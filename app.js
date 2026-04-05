function currentDirUrl() {
  const path = window.location.pathname;
  let dir = path;
  if (!dir.endsWith("/")) {
    if (/\.html?$/i.test(dir)) {
      dir = dir.replace(/[^/]+$/, "");
    } else {
      dir = `${dir}/`;
    }
  }
  return new URL(`${window.location.origin}${dir}`);
}

function itineraryJsonUrl() {
  return new URL("itinerary.json", currentDirUrl());
}

async function loadItinerary() {
  const response = await fetch(itineraryJsonUrl().href);
  if (!response.ok) {
    throw new Error("無法讀取 itinerary.json");
  }
  return response.json();
}

function byId(id) {
  return document.getElementById(id);
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function scrollMainIntoView() {
  const main = byId("main-content");
  if (!main) {
    return;
  }
  main.scrollIntoView({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block: "start"
  });
}

function escapeHtml(value) {
  if (value === undefined || value === null) {
    return "";
  }
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function reservationTag(item) {
  return item && item.needBooking ? "需預約" : "可現場";
}

function formatMoney(value, currency) {
  return new Intl.NumberFormat("zh-Hant-TW", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value);
}

function renderList(container, items) {
  container.innerHTML = "";
  const ul = document.createElement("ul");
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    ul.appendChild(li);
  });
  container.appendChild(ul);
}

function dedupeBlocks(blocks) {
  const seen = new Set();
  return blocks.filter((block) => {
    const key = `${block.startTime}|${block.endTime}|${block.name}|${block.location}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function getDayMeta(dateStr) {
  const map = {
    "2026-07-04": { label: "抵達日", tag: "travel", tagText: "交通" },
    "2026-07-05": { label: "自由日", tag: "free", tagText: "自由" },
    "2026-07-06": { label: "線上研討日", tag: "online", tagText: "線上" },
    "2026-07-07": { label: "ICPR7 Day 1", tag: "conf", tagText: "ICPR7" },
    "2026-07-08": { label: "ICPR7 Day 2", tag: "conf", tagText: "ICPR7" },
    "2026-07-09": { label: "ICPR7 Day 3", tag: "conf", tagText: "ICPR7" },
    "2026-07-10": { label: "會後放鬆", tag: "free", tagText: "自由" },
    "2026-07-11": { label: "文化藝術日", tag: "free", tagText: "自由" },
    "2026-07-12": { label: "離境日", tag: "travel", tagText: "交通" }
  };
  return map[dateStr] || { label: "行程日", tag: "free", tagText: "行程" };
}

const TAG_CLASS = {
  free: "tag-free",
  conf: "tag-conf",
  online: "tag-online",
  travel: "tag-travel"
};

function getBlockDotClass(block) {
  const name = `${block.name} ${block.location}`;
  if (/ICPR|Conference|研討會|會議/i.test(name) && !/線上/.test(name)) {
    return "dot-conf";
  }
  if (/早餐|午餐|晚餐|餐飲|餐廳|Food|food|熟食|Toast|Ya Kun|美食|Market|Centre|外帶/i.test(name)) {
    return "dot-food";
  }
  if (/線上|線上活動/i.test(name)) {
    return "dot-alert";
  }
  if (/機場|入境|離境|登機|樟宜|Changi|通關/i.test(name)) {
    return "dot-alert";
  }
  if (/住宿|飯店|Check|退房|寄放|hotel/i.test(name)) {
    return "dot-gray";
  }
  return "dot-main";
}

const REVIEW_PRESETS = [
  {
    pattern: /Jewel|Changi/i,
    food: "Shake Shack、星耀美食街與咖啡甜點常被提及。",
    play: "雨漩渦拍照、森林谷散步，適合低強度行程。",
    view: "室內瀑布與高層觀景點夜景評價穩定。"
  },
  {
    pattern: /Clarke Quay/i,
    food: "河岸餐廳以海鮮、肋排、調酒類評價較集中。",
    play: "夜間河畔散步與搭船體驗討論度高。",
    view: "夜景燈光反射在河面，拍照效果佳。"
  },
  {
    pattern: /Lau Pa Sat/i,
    food: "沙嗲街、海南雞飯、炒粿條是常見推薦。",
    play: "晚間外場沙嗲街氛圍感強，適合情侶用餐。",
    view: "歷史建築外觀與夜間人潮景象有特色。"
  },
  {
    pattern: /Gardens by the Bay/i,
    food: "園區內簡餐口碑普通，建議重點放景點體驗。",
    play: "Cloud Forest、Flower Dome、OCBC Skyway 熱門。",
    view: "SuperTree Grove 夜間燈光秀是高頻推薦。"
  },
  {
    pattern: /Sentosa|VivoCity/i,
    food: "VivoCity 餐廳選擇多，日式與新馬料理評價穩定。",
    play: "海灘、纜車、S.E.A. Aquarium 常被列入半日玩法。",
    view: "傍晚海灘夕陽與港灣景觀是常見分享重點。"
  },
  {
    pattern: /National Gallery|Bugis|Little India|Tekka/i,
    food: "Tekka 與 Bugis 一帶小吃（印度煎餅、咖哩）討論度高。",
    play: "美術館常設展、街區散步與採買較受歡迎。",
    view: "古典建築與彩色街區是熱門打卡主題。"
  },
  {
    pattern: /SUSS|Clementi|Beauty World|Bukit Timah/i,
    food: "校園周邊熟食中心平價餐點評價多、性價比高。",
    play: "會議日多建議短距離移動與早點回住宿休息。",
    view: "此區以便利性為主，景觀型行程建議晚間回市區安排。"
  }
];

const FOOD_GALLERY_PRESETS = [
  {
    pattern: /JUMBO|螃蟹|Seafood/i,
    menuKeyword: "JUMBO Seafood Riverside menu Singapore",
    picks: ["chili crab singapore", "black pepper crab singapore"],
    imageKeys: ["chili_crab", "black_pepper_crab"]
  },
  {
    pattern: /肉骨茶|Song Fa|松發/i,
    menuKeyword: "Song Fa Bak Kut Teh menu Singapore",
    picks: ["bak kut teh singapore", "youtiao soup singapore"],
    imageKeys: ["bak_kut_teh", "roti_prata"]
  },
  {
    pattern: /Lau Pa Sat|沙嗲|satay/i,
    menuKeyword: "Lau Pa Sat satay menu Singapore",
    picks: ["satay singapore", "hawker food singapore"],
    imageKeys: ["satay", "hainanese_chicken_rice"]
  },
  {
    pattern: /Toast Box|Ya Kun|Kaya Toast/i,
    menuKeyword: "Toast Box menu Singapore",
    picks: ["kaya toast singapore", "soft boiled eggs singapore breakfast"],
    imageKeys: ["kaya_toast", "hainanese_chicken_rice"]
  },
  {
    pattern: /Tekka|Little India|Bugis/i,
    menuKeyword: "Tekka Centre food stalls Singapore",
    picks: ["indian food singapore hawker", "roti prata singapore"],
    imageKeys: ["roti_prata", "satay"]
  },
  {
    pattern: /VivoCity|HarbourFront|Clarke Quay/i,
    menuKeyword: "VivoCity restaurants menu Singapore",
    picks: ["singapore seafood dinner", "riverfront dining singapore"],
    imageKeys: ["black_pepper_crab", "laksa"]
  },
  {
    pattern: /早餐|午餐|晚餐|餐廳|Food|food|熟食/i,
    menuKeyword: "Singapore local food menu",
    picks: ["singapore local cuisine", "singapore dessert"],
    imageKeys: ["hainanese_chicken_rice", "laksa"]
  }
];

const LOCAL_FOOD_IMAGES = {
  chili_crab: "assets/food/chili_crab.png",
  black_pepper_crab: "assets/food/black_pepper_crab.jpg",
  bak_kut_teh: "assets/food/bak_kut_teh.jpg",
  satay: "assets/food/satay.jpg",
  kaya_toast: "assets/food/kaya_toast.jpg",
  hainanese_chicken_rice: "assets/food/hainanese_chicken_rice.jpg",
  laksa: "assets/food/laksa.jpg",
  roti_prata: "assets/food/roti_prata.jpg"
};

function makePhotoFallbackSvg(label) {
  const safe = escapeHtml(label.length > 18 ? `${label.slice(0, 18)}...` : label);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#eef3fb"/><stop offset="1" stop-color="#dde8f8"/></linearGradient></defs><rect width="640" height="420" fill="url(#g)"/><text x="50%" y="44%" text-anchor="middle" font-size="30" font-family="Segoe UI, Noto Sans TC, sans-serif" fill="#2b4f82">Photo loading</text><text x="50%" y="58%" text-anchor="middle" font-size="21" font-family="Segoe UI, Noto Sans TC, sans-serif" fill="#56729a">${safe}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getLocalFoodImage(imageKey, fallbackLabel) {
  const local = imageKey ? LOCAL_FOOD_IMAGES[imageKey] : "";
  if (!local) {
    return makePhotoFallbackSvg(fallbackLabel || "Food photo");
  }
  return new URL(local, currentDirUrl()).href;
}

function bindFoodImageFallback(root) {
  const scope = root || document;
  const imgs = Array.from(scope.querySelectorAll(".food-card img"));
  imgs.forEach((img) => {
    if (img.dataset.boundError) {
      return;
    }
    img.addEventListener("error", () => {
      const label = img.dataset.fallbackLabel || "Food photo";
      img.src = makePhotoFallbackSvg(label);
    });
    img.dataset.boundError = "1";
  });
}

function makeMenuCardSvg(label) {
  const text = label.length > 16 ? `${label.slice(0, 16)}...` : label;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#eef4ff"/><stop offset="1" stop-color="#dfeaff"/></linearGradient></defs><rect width="640" height="420" fill="url(#g)"/><text x="50%" y="42%" text-anchor="middle" font-size="34" font-family="Segoe UI, Noto Sans TC, sans-serif" fill="#185fa5">Menu</text><text x="50%" y="58%" text-anchor="middle" font-size="24" font-family="Segoe UI, Noto Sans TC, sans-serif" fill="#2e4058">${escapeHtml(text)}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildFoodGallery(block) {
  const text = `${block.name || ""} ${block.location || ""}`;
  const preset = FOOD_GALLERY_PRESETS.find((item) => item.pattern.test(text));
  if (!preset) {
    return "";
  }

  const menuSearch = `https://www.google.com/search?q=${encodeURIComponent(preset.menuKeyword)}`;
  const items = [
    {
      title: "菜單參考",
      caption: "餐廳菜單與價位",
      imageUrl: makeMenuCardSvg(block.location || block.name || "餐廳"),
      targetUrl: menuSearch
    },
    {
      title: "猜你會點",
      caption: "熱門第一名",
      imageUrl: getLocalFoodImage(preset.imageKeys?.[0], preset.picks[0]),
      targetUrl: `https://www.google.com/search?q=${encodeURIComponent(`${block.location} ${preset.picks[0]} reviews`)}`,
      isPhoto: true
    },
    {
      title: "猜你會點",
      caption: "熱門第二名",
      imageUrl: getLocalFoodImage(preset.imageKeys?.[1], preset.picks[1]),
      targetUrl: `https://www.google.com/search?q=${encodeURIComponent(`${block.location} ${preset.picks[1]} reviews`)}`,
      isPhoto: true
    }
  ];

  return `
    <aside class="food-gallery" aria-label="餐廳相簿">
      <h4>餐廳相簿</h4>
      <div class="food-gallery-grid">
        ${items
          .map(
            (item) => `
          <a class="food-card" href="${escapeHtml(item.targetUrl)}" target="_blank" rel="noopener noreferrer">
            <img
              src="${escapeHtml(item.imageUrl)}"
              alt="${escapeHtml(item.title)} - ${escapeHtml(item.caption)}"
              loading="lazy"
              referrerpolicy="no-referrer"
              data-fallback-label="${escapeHtml(item.caption)}"
            >
            <span class="food-card-title">${escapeHtml(item.title)}</span>
            <span class="food-card-caption">${escapeHtml(item.caption)}</span>
          </a>
        `
          )
          .join("")}
      </div>
    </aside>
  `;
}

function buildReviewSourceLinks(block) {
  const keyword = encodeURIComponent(`${block.location || ""} ${block.name || ""} Singapore`.trim());
  const googleUrl = block.mapUrl || `https://www.google.com/maps/search/?api=1&query=${keyword}`;
  return [
    { name: "Google 評論", url: googleUrl },
    { name: "Tripadvisor", url: `https://www.tripadvisor.com/Search?q=${keyword}` },
    { name: "小紅書", url: `https://www.xiaohongshu.com/search_result?keyword=${keyword}` }
  ];
}

function buildReviewHighlight(block) {
  const text = `${block.name || ""} ${block.location || ""}`;
  const preset = REVIEW_PRESETS.find((item) => item.pattern.test(text));
  const links = buildReviewSourceLinks(block)
    .map((item) => `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.name)}</a>`)
    .join("・");
  if (!preset) {
    return `<div class="review-box"><strong>評論入口</strong><br>可查看旅客對餐點、玩法、景觀與服務的即時回饋。<br>來源：${links}</div>`;
  }
  return `<div class="review-box"><strong>評論推薦</strong><br>推薦食物：${escapeHtml(preset.food)}<br>玩得項目：${escapeHtml(preset.play)}<br>看得風景：${escapeHtml(preset.view)}<br>來源：${links}</div>`;
}

function buildBlockDetailLines(block, bookingInfo) {
  const lines = [];
  lines.push(`${escapeHtml(block.location)}｜${escapeHtml(block.address)}`);
  lines.push(`預計花費：${escapeHtml(block.cost)}`);
  lines.push(
    `交通：${escapeHtml(block.transport.route)}；捷運站：${escapeHtml(block.transport.mrtStations.join("、"))}；估：${escapeHtml(block.transport.fareEstimate)}`
  );
  lines.push(`天氣：${escapeHtml(block.weather)}`);
  const book = bookingInfo ? reservationTag(bookingInfo) : "可現場";
  const bookDetail = bookingInfo ? `（${escapeHtml(bookingInfo.action)}）` : "";
  lines.push(`預約：${book}${bookDetail}`);
  if (block.notes) {
    lines.push(`備註：${escapeHtml(block.notes)}`);
  }
  const mapUrl = escapeHtml(block.mapUrl);
  lines.push(`<a href="${mapUrl}" target="_blank" rel="noopener noreferrer">Google Maps 導航</a>`);
  const review = buildReviewHighlight(block);
  if (review) {
    lines.push(review);
  }
  return lines.join("<br>");
}

function renderTimelineRow(block, bookingInfo, isLastRow) {
  const dot = getBlockDotClass(block);
  const timeLabel = `${escapeHtml(block.startTime)}<br>${escapeHtml(block.endTime)}`;
  const onlineAlert =
    /線上活動|線上研討/i.test(block.name) ?
      `<div class="alert-box"><span class="alert-icon">⚠</span><div class="alert-text">請提前 15 分鐘測試網路、鏡頭與麥克風；時段固定勿遲到。</div></div>`
    : "";
  const bookingBadge =
    bookingInfo && bookingInfo.needBooking ?
      `<div class="meal-row"><span class="meal-badge"><span>預約</span>：${escapeHtml(bookingInfo.action)}</span></div>`
    : "";

  const lineHtml = isLastRow ? "" : `<div class="tline" aria-hidden="true"></div>`;
  const foodGallery = buildFoodGallery(block);
  const hasGalleryClass = foodGallery ? "has-gallery" : "";

  return `
    <div class="trow">
      <div class="ttime">${timeLabel}</div>
      <div class="tvisual">
        <div class="tdot ${dot}" aria-hidden="true"></div>
        ${lineHtml}
      </div>
      <div class="tcontent">
        ${onlineAlert}
        <div class="tblock">${escapeHtml(block.name)}</div>
        <div class="tdetail-layout ${hasGalleryClass}">
          <div class="tdesc">${buildBlockDetailLines(block, bookingInfo)}</div>
          ${foodGallery}
        </div>
        ${bookingBadge}
      </div>
    </div>
  `;
}

function renderDayTimelineCard(day) {
  const meta = getDayMeta(day.date);
  const tagClass = TAG_CLASS[meta.tag] || TAG_CLASS.free;
  const blocks = dedupeBlocks(day.blocks);
  const bookingByName = Object.fromEntries(
    (day.bookingItems || []).map((item) => [item.blockName, item])
  );

  const rows = blocks
    .map((block, index) => renderTimelineRow(block, bookingByName[block.name], index === blocks.length - 1))
    .join("");

  return `
    <section class="day-timeline-card">
      <div class="day-timeline-header">
        <span class="day-timeline-date">${escapeHtml(day.date)}（${escapeHtml(day.weekday)}）</span>
        <span class="day-timeline-label">${escapeHtml(meta.label)}</span>
        <span class="day-timeline-tag ${tagClass}">${escapeHtml(meta.tagText)}</span>
      </div>
      <p class="meta" style="margin:0 0 0.75rem">${escapeHtml(day.summary)}</p>
      <div class="timeline">${rows}</div>
    </section>
  `;
}

function renderAllDaysOverview(days, onSelect) {
  const allDaysOverview = byId("all-days-overview");
  if (!allDaysOverview) {
    return;
  }
  allDaysOverview.innerHTML = days
    .map((day, index) => {
      const meta = getDayMeta(day.date);
      const firstTwo = dedupeBlocks(day.blocks).slice(0, 2);
      const searchText = `${day.date} ${day.weekday} ${meta.label} ${firstTwo.map((b) => b.name).join(" ")}`;
      return `
      <article class="overview-card" data-overview-index="${index}" data-search="${escapeHtml(searchText)}">
        <h3>${escapeHtml(day.date)}</h3>
        <p class="meta">${escapeHtml(day.weekday)} · ${escapeHtml(meta.label)}</p>
        <p>${firstTwo.map((b) => `${escapeHtml(b.startTime)} ${escapeHtml(b.name)}`).join(" / ")}</p>
        <button type="button" class="overview-open-btn" data-open-index="${index}">看這一天</button>
      </article>
    `;
    })
    .join("");

  if (!allDaysOverview.dataset.bound) {
    allDaysOverview.addEventListener("click", (event) => {
      const button = event.target.closest(".overview-open-btn");
      if (!button || !allDaysOverview.contains(button)) {
        return;
      }
      onSelect(Number(button.dataset.openIndex));
    });
    allDaysOverview.dataset.bound = "1";
  }
}

function renderOverviewContent(data) {
  const tripOverview = byId("trip-overview");
  const attractionPlan = byId("attraction-plan");
  if (!tripOverview || !attractionPlan) {
    return;
  }
  tripOverview.innerHTML = `<p>${escapeHtml(data.tripOverview || "")}</p>`;
  renderList(attractionPlan, data.attractionPlan || []);
}

function renderPrepContent(data) {
  const weatherSummary = byId("weather-summary");
  const hotelFixed = byId("hotel-fixed");
  const paymentStrategy = byId("payment-strategy");
  const budgetDashboard = byId("budget-dashboard");
  const foodPlan = byId("food-plan");
  const reservationPlan = byId("reservation-plan");
  const transportNotes = byId("transport-notes");
  if (!weatherSummary || !hotelFixed || !paymentStrategy || !budgetDashboard || !foodPlan || !reservationPlan || !transportNotes) {
    return;
  }

  weatherSummary.innerHTML = `
    <p>${escapeHtml(data.weather?.summary || "")}</p>
    <div>${(data.weather?.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
    <p>資料來源：${(data.weather?.sources || []).map((source) => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.name)}</a>`).join("、")}</p>
  `;

  hotelFixed.innerHTML = `
    <article class="block-card">
      <h3>${escapeHtml(data.hotel?.name || "")}</h3>
      <p><strong>地址：</strong>${escapeHtml(data.hotel?.address || "")}</p>
      <p><strong>最近 MRT：</strong>${escapeHtml(data.hotel?.nearestMrt || "")}</p>
      <p><strong>確認號：</strong>${escapeHtml(data.hotel?.confirmationNumber || "以收據為準")}</p>
      <p><strong>房型：</strong>${escapeHtml(data.hotel?.roomType || "以收據為準")}</p>
      <p><strong>入住/退房：</strong>${escapeHtml(data.hotel?.checkIn || "")} - ${escapeHtml(data.hotel?.checkOut || "")}</p>
      <p><strong>電話：</strong>${escapeHtml(data.hotel?.phone || "")}</p>
      <p><strong>已訂總價：</strong>${escapeHtml(data.hotel?.bookedPriceUsd || "")}</p>
      <p><strong>每晚均價：</strong>${escapeHtml(data.hotel?.perNightUsd || "")}</p>
      <p><a href="${escapeHtml(data.hotel?.mapUrl || "#")}" target="_blank" rel="noopener noreferrer">住宿 Google Maps</a></p>
    </article>
  `;

  paymentStrategy.innerHTML = `<p>${escapeHtml(data.payment?.summary || "")}</p>`;
  const paymentList = document.createElement("div");
  renderList(paymentList, data.payment?.recommendations || []);
  paymentStrategy.appendChild(paymentList);
  const paymentSources = document.createElement("p");
  paymentSources.innerHTML = `來源：${(data.payment?.sources || [])
    .map((source) => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.name)}</a>`)
    .join("、")}`;
  paymentStrategy.appendChild(paymentSources);

  const selected = data.budget?.selectedScenario;
  const bd = selected?.breakdown;
  const sgdTotal = bd ? bd.hotel + bd.food + bd.transport + bd.tickets + bd.misc : 0;
  const usdTotal = sgdTotal * (data.budget?.exchangeRate?.usdPerSgd || 0);
  const twdTotal = sgdTotal * (data.budget?.exchangeRate?.twdPerSgd || 0);
  budgetDashboard.innerHTML = `
    <p>${escapeHtml(data.budget?.summary || "")}</p>
    <article class="block-card budget-card">
      <h3>${escapeHtml(selected?.name || "—")}</h3>
      <p><strong>住宿：</strong>${bd ? formatMoney(bd.hotel, "SGD") : "—"}</p>
      <p><strong>餐飲：</strong>${bd ? formatMoney(bd.food, "SGD") : "—"}</p>
      <p><strong>交通：</strong>${bd ? formatMoney(bd.transport, "SGD") : "—"}</p>
      <p><strong>門票：</strong>${bd ? formatMoney(bd.tickets, "SGD") : "—"}</p>
      <p><strong>購物/雜支：</strong>${bd ? formatMoney(bd.misc, "SGD") : "—"}</p>
      <p><strong>雙人總計（SGD）：</strong><span class="budget-total">${formatMoney(sgdTotal, "SGD")}</span></p>
      <p><strong>雙人總計（TWD）：</strong><span class="budget-total">${formatMoney(twdTotal, "TWD")}</span></p>
      <p><strong>雙人總計（USD）：</strong><span class="budget-total">${formatMoney(usdTotal, "USD")}</span></p>
      <p class="meta">${escapeHtml(selected?.note || "")}</p>
      <p class="meta">匯率假設：1 SGD ≈ ${data.budget?.exchangeRate?.twdPerSgd ?? "—"} TWD；1 SGD ≈ ${data.budget?.exchangeRate?.usdPerSgd ?? "—"} USD（出發前請再用實際匯率更新）。</p>
    </article>
  `;

  foodPlan.innerHTML = `
    <div class="blocks">
      ${(data.foodPlan || [])
        .map(
          (item) => `
        <article class="block-card">
          <h3>${escapeHtml(item.date)}（${escapeHtml(item.weekday)}）</h3>
          <p><strong>中餐：</strong>${escapeHtml(item.lunch)}</p>
          <p><strong>晚餐：</strong>${escapeHtml(item.dinner)}</p>
          <p><strong>下午茶/點心：</strong>${escapeHtml(item.afternoonTea)}</p>
          <p><strong>宵夜：</strong>${escapeHtml(item.supper)}</p>
          <p class="meta"><strong>必吃進度：</strong>${escapeHtml(item.mustEatStatus)}</p>
        </article>
      `
        )
        .join("")}
    </div>
  `;

  reservationPlan.innerHTML = `
    <div class="blocks">
      ${(data.bookingChecklist || [])
        .map(
          (item) => `
        <article class="block-card">
          <h3>${escapeHtml(item.name)} <span class="tag">${reservationTag(item)}</span></h3>
          <p><strong>類型：</strong>${escapeHtml(item.type)}</p>
          <p><strong>建議：</strong>${escapeHtml(item.action)}</p>
          <p><strong>時機：</strong>${escapeHtml(item.when)}</p>
          <p><a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">官方或參考頁</a></p>
        </article>
      `
        )
        .join("")}
    </div>
  `;

  renderList(transportNotes, data.transportNotes || []);
}

function renderKpis(data) {
  const kpi = byId("trip-kpis");
  if (!kpi) {
    return;
  }
  const dayCount = Array.isArray(data.days) ? data.days.length : 0;
  const confDays = (data.days || []).filter((d) => /ICPR7/i.test(getDayMeta(d.date).label)).length;
  const hotelName = data.hotel?.name || "Citadines Rochor Singapore";
  kpi.innerHTML = `
    <span class="kpi-pill">住宿：<strong>${escapeHtml(hotelName)}</strong></span>
    <span class="kpi-pill">總天數：<strong>${dayCount}</strong></span>
    <span class="kpi-pill">會議日：<strong>${confDays}</strong></span>
    <span class="kpi-pill">離境時限：<strong>07/12 15:00 前抵達機場</strong></span>
  `;
  kpi.hidden = false;
}

function renderPrepOverviewMap(days, options = {}) {
  const loadEmbed = Boolean(options.loadEmbed);
  const hotelStart = options.hotelStart || "Citadines Rochor Singapore";
  const mapSummary = byId("overview-map-summary");
  const mapAreas = byId("overview-map-areas");
  const routeLink = byId("overview-map-route-link");
  const mapFrame = byId("overview-map-frame");
  if (!mapSummary || !mapAreas || !routeLink || !mapFrame) {
    return;
  }

  const allStops = collectChronologicalStops(days);
  const withHotel = [hotelStart, ...allStops].filter((q, i, arr) => arr.indexOf(q) === i);
  const routeStops = withHotel.slice(0, 10);
  const routeUrl = buildGoogleMapsDirUrl(routeStops, "transit", hotelStart);

  const uniqueAreas = Array.from(
    new Set(days.flatMap((d) => getUsefulBlocks(d).map((b) => b.location)))
  ).slice(0, 16);
  mapAreas.innerHTML = uniqueAreas
    .map((area) => `<span class="route-stop">${escapeHtml(area)}</span>`)
    .join("");

  mapSummary.textContent =
    "內嵌地圖為新加坡本島概覽；下方連結可開啟 Google Maps「依行程順序」多站路線（最多 10 站）。點各景點時間軸內連結可單點導航。";
  routeLink.href = routeUrl;
  if (loadEmbed && !mapFrame.dataset.loaded) {
    mapFrame.src = "https://www.google.com/maps?q=Singapore&hl=zh-TW&z=11&output=embed";
    mapFrame.dataset.loaded = "1";
  }
}

function renderDayNav(days, onSelectDaily) {
  const dayNav = byId("day-nav");
  if (!dayNav) {
    return;
  }
  dayNav.innerHTML = "";

  const allButton = document.createElement("button");
  allButton.type = "button";
  allButton.className = "day-button day-pick";
  allButton.dataset.index = "-1";
  allButton.textContent = "總覽";
  allButton.addEventListener("click", () => onSelectDaily(-1));
  dayNav.appendChild(allButton);

  days.forEach((day, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "day-button day-pick";
    button.dataset.index = String(index);
    button.textContent = `${day.date} (${day.weekday})`;
    button.addEventListener("click", () => onSelectDaily(index));
    dayNav.appendChild(button);
  });
}

function renderAllBlocks(days) {
  const dayTitle = byId("day-title");
  const daySummary = byId("day-summary");
  const blocks = byId("blocks");
  if (!dayTitle || !daySummary || !blocks) {
    return;
  }

  dayTitle.textContent = "一次看完：全行程時間軸";
  daySummary.textContent = "以下為 7/4～7/12 完整逐日時間軸，含地點、花費、交通、天氣、預約與地圖連結。";
  blocks.innerHTML = days.map((day) => renderDayTimelineCard(day)).join("");
  bindFoodImageFallback(blocks);
}

function renderSingleDayBlocks(day) {
  const dayTitle = byId("day-title");
  const daySummary = byId("day-summary");
  const blocks = byId("blocks");
  if (!dayTitle || !daySummary || !blocks) {
    return;
  }

  dayTitle.textContent = `${escapeHtml(day.date)}（${escapeHtml(day.weekday)}）詳細時間軸`;
  daySummary.textContent = day.summary || "";
  blocks.innerHTML = renderDayTimelineCard(day);
  bindFoodImageFallback(blocks);
}

function getUsefulBlocks(day) {
  return dedupeBlocks(day.blocks).filter((block) => {
    const text = `${block.name} ${block.location}`;
    return !text.includes("住宿");
  });
}

function mapQueryFromBlock(block) {
  const fallback = `${block.location || ""} ${block.address || ""}`.trim();
  const raw = block.address && !block.address.includes("依住宿位置") ? block.address : fallback;
  return raw || "Singapore";
}

function collectChronologicalStops(days) {
  const out = [];
  let last = "";
  for (const day of days) {
    for (const block of dedupeBlocks(day.blocks)) {
      const q = mapQueryFromBlock(block);
      if (!q || q === last) {
        continue;
      }
      last = q;
      out.push(q);
    }
  }
  return out;
}

function buildGoogleMapsDirUrl(stops, travelMode, originHint) {
  const mode = travelMode || "transit";
  const defaultOrigin = originHint || "Singapore";
  if (stops.length === 0) {
    return "https://www.google.com/maps/search/?api=1&query=Singapore";
  }
  if (stops.length === 1) {
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(defaultOrigin)}&destination=${encodeURIComponent(stops[0])}&travelmode=${mode}`;
  }
  const max = 10;
  const slice = stops.slice(0, max);
  const origin = encodeURIComponent(slice[0]);
  const destination = encodeURIComponent(slice[slice.length - 1]);
  const middle = slice.slice(1, -1);
  const waypoints = middle.length ? `&waypoints=${middle.map(encodeURIComponent).join("|")}` : "";
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints}&travelmode=${mode}`;
}

function updateNavHighlight(dayIndex) {
  document.querySelectorAll(".day-pick").forEach((btn) => {
    const idx = Number(btn.dataset.index);
    btn.classList.toggle("active", idx === dayIndex);
    if (idx === dayIndex) {
      btn.setAttribute("aria-current", "page");
    } else {
      btn.removeAttribute("aria-current");
    }
  });
  document.querySelectorAll(".overview-card").forEach((card) => {
    const cardIndex = Number(card.dataset.overviewIndex);
    card.classList.toggle("active", cardIndex === dayIndex);
  });
}

const FONT_MODE_KEY = "sgTripFontMode";
const FONT_MODES = ["standard", "large"];

function applyFontMode(mode) {
  const root = document.documentElement;
  if (!root) {
    return "standard";
  }
  const safeMode = FONT_MODES.includes(mode) ? mode : "standard";
  if (safeMode === "large") {
    root.setAttribute("data-font-mode", "large");
  } else {
    root.removeAttribute("data-font-mode");
  }
  return safeMode;
}

function loadFontMode() {
  try {
    return localStorage.getItem(FONT_MODE_KEY) || "standard";
  } catch (error) {
    return "standard";
  }
}

function saveFontMode(mode) {
  try {
    localStorage.setItem(FONT_MODE_KEY, mode);
  } catch (error) {
    // ignore storage errors
  }
}

async function main() {
  const loading = byId("app-loading");
  const errorBox = byId("app-error");
  const viewDaily = byId("view-daily");
  const appToolbar = byId("app-toolbar");
  const viewStatus = byId("view-status");
  const showError = (message) => {
    if (errorBox) {
      errorBox.innerHTML = `<h2>載入失敗</h2><p>${escapeHtml(message)}</p><p><a href="#" id="retry-load-link">重新整理</a></p>`;
      errorBox.hidden = false;
      const retry = byId("retry-load-link");
      if (retry) {
        retry.addEventListener("click", (event) => {
          event.preventDefault();
          window.location.reload();
        });
      }
    }
    if (loading) {
      loading.hidden = true;
    }
    if (viewDaily) {
      viewDaily.hidden = true;
    }
  };

  try {
    const requiredIds = [
      "day-nav",
      "trip-overview",
      "attraction-plan",
      "weather-summary",
      "hotel-fixed",
      "payment-strategy",
      "budget-dashboard",
      "food-plan",
      "reservation-plan",
      "transport-notes",
      "all-days-overview",
      "quick-overview-empty",
      "full-trip-static",
      "main-quick-overview",
      "full-trip-timeline-block",
      "overview-map-summary",
      "overview-map-areas",
      "overview-map-route-link",
      "overview-map-frame",
      "mrt-summary",
      "mrt-visual",
      "day-title",
      "day-summary",
      "blocks",
      "btn-show-overview",
      "btn-show-cards",
      "btn-print",
      "btn-font-mode",
      "btn-back-cards",
      "day-filter-input",
      "btn-clear-filter",
      "trip-kpis"
    ];
    const missing = requiredIds.filter((id) => !byId(id));
    if (missing.length) {
      throw new Error(`頁面缺少節點：${missing.join("、")}。請同步部署最新的 index.html 與 app.js。`);
    }

    const data = await loadItinerary();
    if (!data.days || !Array.isArray(data.days)) {
      throw new Error("itinerary.json 格式錯誤：缺少 days 陣列。");
    }

    renderOverviewContent(data);
    renderPrepContent(data);
    renderKpis(data);
    const hotelStart = `${data.hotel?.name || ""} ${data.hotel?.address || ""}`.trim() || "Citadines Rochor Singapore";
    renderPrepOverviewMap(data.days, { loadEmbed: false, hotelStart });

    const fullTripStatic = byId("full-trip-static");
    const mainQuickOverview = byId("main-quick-overview");
    const fullTripTimelineBlock = byId("full-trip-timeline-block");
    const quickOverviewEmpty = byId("quick-overview-empty");
    const dayFilterInput = byId("day-filter-input");
    const btnClearFilter = byId("btn-clear-filter");
    const btnShowOverview = byId("btn-show-overview");
    const btnShowCards = byId("btn-show-cards");
    const btnPrint = byId("btn-print");
    const btnFontMode = byId("btn-font-mode");
    const btnBackCards = byId("btn-back-cards");
    const staticInfoPanels = Array.from(
      document.querySelectorAll("#full-trip-static > .panel:not(.panel-map-overview)")
    );
    let hasLoadedOverviewMap = false;
    let hasRenderedFullTimeline = false;
    let activeDayIndex = 0;

    const setViewStatus = (text) => {
      if (viewStatus) {
        viewStatus.textContent = text;
        viewStatus.hidden = false;
      }
    };

    const updateFontModeButton = (mode) => {
      if (!btnFontMode) {
        return;
      }
      const large = mode === "large";
      btnFontMode.textContent = large ? "字體：放大" : "字體：標準";
      btnFontMode.setAttribute("aria-pressed", large ? "true" : "false");
      btnFontMode.setAttribute("aria-label", large ? "目前為放大字體，點擊切回標準字體" : "目前為標準字體，點擊切換放大字體");
    };

    const toggleStaticInfoPanels = (visible) => {
      staticInfoPanels.forEach((panel) => {
        panel.hidden = !visible;
      });
    };

    const showCardsOnly = () => {
      fullTripStatic.hidden = true;
      mainQuickOverview.hidden = false;
      fullTripTimelineBlock.hidden = true;
      updateNavHighlight(activeDayIndex);
      setViewStatus("目前顯示快速跳轉卡片。可點「看這一天」進入詳細行程。");
      scrollMainIntoView();
    };

    const applyQuickFilter = () => {
      const query = (dayFilterInput?.value || "").trim().toLowerCase();
      const cards = Array.from(document.querySelectorAll(".overview-card"));
      let visibleCount = 0;
      cards.forEach((card) => {
        const haystack = (card.dataset.search || "").toLowerCase();
        const match = !query || haystack.includes(query);
        card.hidden = !match;
        if (match) {
          visibleCount += 1;
        }
      });
      if (quickOverviewEmpty) {
        quickOverviewEmpty.hidden = visibleCount !== 0;
      }
    };

    const selectDaily = (index) => {
      activeDayIndex = index === -1 ? 0 : index;
      if (index === -1) {
        fullTripStatic.hidden = false;
        mainQuickOverview.hidden = true;
        fullTripTimelineBlock.hidden = false;
        toggleStaticInfoPanels(true);
        if (!hasLoadedOverviewMap) {
          renderPrepOverviewMap(data.days, { loadEmbed: true, hotelStart });
          hasLoadedOverviewMap = true;
        }
        if (!hasRenderedFullTimeline) {
          renderAllBlocks(data.days);
          const mrtSummary = byId("mrt-summary");
          const mrtVisual = byId("mrt-visual");
          if (mrtSummary) {
            mrtSummary.textContent = "一次看完：全行程主要捷運節點（去重後）";
          }
          if (mrtVisual) {
            mrtVisual.innerHTML = data.days
              .flatMap((day) => (day.mrtRoute ? day.mrtRoute.stations : []))
              .filter((station, i, arr) => arr.indexOf(station) === i)
              .slice(0, 16)
              .map((station) => `<span class="route-stop">${escapeHtml(station)}</span>`)
              .join("");
          }
          hasRenderedFullTimeline = true;
        }
        setViewStatus("目前顯示總覽模式：行前資訊、全行程地圖與完整時間軸。");
      } else {
        fullTripStatic.hidden = false;
        mainQuickOverview.hidden = true;
        fullTripTimelineBlock.hidden = false;
        toggleStaticInfoPanels(false);
        if (!hasLoadedOverviewMap) {
          renderPrepOverviewMap(data.days, { loadEmbed: true, hotelStart });
          hasLoadedOverviewMap = true;
        }
        const day = data.days[index];
        if (day) {
          renderSingleDayBlocks(day);
          const mrtSummary = byId("mrt-summary");
          const mrtVisual = byId("mrt-visual");
          if (mrtSummary) {
            mrtSummary.textContent = day.mrtRoute
              ? `${day.mrtRoute.label}（估計交通費：${day.mrtRoute.fare}）`
              : "今日無捷運重點動線。";
          }
          if (mrtVisual) {
            if (day.mrtRoute && Array.isArray(day.mrtRoute.stations)) {
              mrtVisual.innerHTML = day.mrtRoute.stations
                .map((station, stationIndex, arr) => {
                  const arrow = stationIndex < arr.length - 1 ? `<span class="route-arrow">→</span>` : "";
                  return `<span class="route-stop">${escapeHtml(station)}</span>${arrow}`;
                })
                .join("");
            } else {
              mrtVisual.innerHTML = "";
            }
          }
        }
        setViewStatus(`目前顯示 ${data.days[index].date} 的詳細行程。`);
      }
      updateNavHighlight(index);
      scrollMainIntoView();
    };

    renderDayNav(data.days, selectDaily);
    renderAllDaysOverview(data.days, selectDaily);

    btnShowOverview?.addEventListener("click", () => selectDaily(-1));
    btnShowCards?.addEventListener("click", showCardsOnly);
    btnBackCards?.addEventListener("click", showCardsOnly);
    btnPrint?.addEventListener("click", () => window.print());
    let fontMode = applyFontMode(loadFontMode());
    updateFontModeButton(fontMode);
    btnFontMode?.addEventListener("click", () => {
      fontMode = fontMode === "large" ? "standard" : "large";
      fontMode = applyFontMode(fontMode);
      saveFontMode(fontMode);
      updateFontModeButton(fontMode);
      setViewStatus(fontMode === "large" ? "已切換為放大字體模式。" : "已切換為標準字體模式。");
    });
    dayFilterInput?.addEventListener("input", applyQuickFilter);
    btnClearFilter?.addEventListener("click", () => {
      if (dayFilterInput) {
        dayFilterInput.value = "";
      }
      applyQuickFilter();
    });

    if (viewDaily) {
      viewDaily.hidden = false;
    }
    if (appToolbar) {
      appToolbar.hidden = false;
    }
    if (loading) {
      loading.hidden = true;
    }
    applyQuickFilter();
    showCardsOnly();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    showError(message);
  }
}

main();
