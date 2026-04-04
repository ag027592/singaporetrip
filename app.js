async function loadItinerary() {
  const response = await fetch("itinerary.json");
  if (!response.ok) {
    throw new Error("無法讀取 itinerary.json");
  }
  return response.json();
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
        <div class="tdesc">${buildBlockDetailLines(block, bookingInfo)}</div>
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

  const mrtTip = day.mrtRoute ?
    `<div class="tip-box"><div class="tip-text">捷運主軸：${escapeHtml(day.mrtRoute.label)}（${escapeHtml(day.mrtRoute.fare)}）</div></div>`
  : "";

  return `
    <section class="day-timeline-card">
      <div class="day-timeline-header">
        <span class="day-timeline-date">${escapeHtml(day.date)}（${escapeHtml(day.weekday)}）</span>
        <span class="day-timeline-label">${escapeHtml(meta.label)}</span>
        <span class="day-timeline-tag ${tagClass}">${escapeHtml(meta.tagText)}</span>
      </div>
      <p class="meta" style="margin:0 0 0.75rem">${escapeHtml(day.summary)}</p>
      ${mrtTip}
      <div class="timeline">${rows}</div>
    </section>
  `;
}

function renderAllDaysOverview(days, onSelect) {
  const allDaysOverview = document.getElementById("all-days-overview");
  allDaysOverview.innerHTML = days
    .map((day, index) => {
      const meta = getDayMeta(day.date);
      const firstTwo = dedupeBlocks(day.blocks).slice(0, 2);
      return `
      <article class="overview-card" data-overview-index="${index}">
        <h3>${escapeHtml(day.date)}</h3>
        <p class="meta">${escapeHtml(day.weekday)} · ${escapeHtml(meta.label)}</p>
        <p>${firstTwo.map((b) => `${escapeHtml(b.startTime)} ${escapeHtml(b.name)}`).join(" / ")}</p>
        <button type="button" class="overview-open-btn" data-open-index="${index}">看這一天</button>
      </article>
    `;
    })
    .join("");

  Array.from(allDaysOverview.querySelectorAll(".overview-open-btn")).forEach((button) => {
    button.addEventListener("click", () => {
      onSelect(Number(button.dataset.openIndex));
    });
  });
}

function renderTopSection(data) {
  const tripOverview = document.getElementById("trip-overview");
  const attractionPlan = document.getElementById("attraction-plan");
  const weatherSummary = document.getElementById("weather-summary");
  const hotelFixed = document.getElementById("hotel-fixed");
  const priceCheck = document.getElementById("price-check");
  const paymentStrategy = document.getElementById("payment-strategy");
  const budgetDashboard = document.getElementById("budget-dashboard");
  const reservationPlan = document.getElementById("reservation-plan");
  const transportNotes = document.getElementById("transport-notes");

  tripOverview.innerHTML = `<p>${data.tripOverview}</p>`;
  renderList(attractionPlan, data.attractionPlan);

  weatherSummary.innerHTML = `
    <p>${data.weather.summary}</p>
    <div>${data.weather.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>
    <p>資料來源：${data.weather.sources.map((source) => `<a href="${source.url}" target="_blank" rel="noopener noreferrer">${source.name}</a>`).join("、")}</p>
  `;

  hotelFixed.innerHTML = `
    <article class="block-card">
      <h3>${data.hotel.name}</h3>
      <p><strong>地址：</strong>${data.hotel.address}</p>
      <p><strong>最近 MRT：</strong>${data.hotel.nearestMrt}</p>
      <p><strong>電話：</strong>${data.hotel.phone}</p>
      <p><strong>已訂總價：</strong>${data.hotel.bookedPriceUsd} / ${data.hotel.bookedPriceSgd}</p>
      <p><strong>每晚均價：</strong>${data.hotel.perNightSgd}</p>
      <p><a href="${data.hotel.mapUrl}" target="_blank" rel="noopener noreferrer">住宿 Google Maps</a></p>
    </article>
  `;

  priceCheck.innerHTML = `
    <p>${data.priceCheck.summary}</p>
    <div class="blocks">
      ${data.priceCheck.references
        .map(
          (ref) => `
        <article class="block-card">
          <h3>${ref.source}</h3>
          <p>${ref.note}</p>
          <p><a href="${ref.url}" target="_blank" rel="noopener noreferrer">查看來源</a></p>
        </article>
      `
        )
        .join("")}
    </div>
  `;

  paymentStrategy.innerHTML = `<p>${data.payment.summary}</p>`;
  const paymentList = document.createElement("div");
  renderList(paymentList, data.payment.recommendations);
  paymentStrategy.appendChild(paymentList);
  const paymentSources = document.createElement("p");
  paymentSources.innerHTML = `來源：${data.payment.sources
    .map((source) => `<a href="${source.url}" target="_blank" rel="noopener noreferrer">${source.name}</a>`)
    .join("、")}`;
  paymentStrategy.appendChild(paymentSources);

  const selected = data.budget.selectedScenario;
  const sgdTotal = selected.breakdown.hotel + selected.breakdown.food + selected.breakdown.transport + selected.breakdown.tickets + selected.breakdown.misc;
  const usdTotal = sgdTotal * data.budget.exchangeRate.usdPerSgd;
  const twdTotal = sgdTotal * data.budget.exchangeRate.twdPerSgd;
  budgetDashboard.innerHTML = `
    <p>${data.budget.summary}</p>
    <article class="block-card budget-card">
      <h3>${selected.name}</h3>
      <p><strong>住宿：</strong>${formatMoney(selected.breakdown.hotel, "SGD")}</p>
      <p><strong>餐飲：</strong>${formatMoney(selected.breakdown.food, "SGD")}</p>
      <p><strong>交通：</strong>${formatMoney(selected.breakdown.transport, "SGD")}</p>
      <p><strong>門票：</strong>${formatMoney(selected.breakdown.tickets, "SGD")}</p>
      <p><strong>購物/雜支：</strong>${formatMoney(selected.breakdown.misc, "SGD")}</p>
      <p><strong>雙人總計（SGD）：</strong><span class="budget-total">${formatMoney(sgdTotal, "SGD")}</span></p>
      <p><strong>雙人總計（TWD）：</strong><span class="budget-total">${formatMoney(twdTotal, "TWD")}</span></p>
      <p><strong>雙人總計（USD）：</strong><span class="budget-total">${formatMoney(usdTotal, "USD")}</span></p>
      <p class="meta">${selected.note}</p>
      <p class="meta">匯率假設：1 SGD ≈ ${data.budget.exchangeRate.twdPerSgd} TWD；1 SGD ≈ ${data.budget.exchangeRate.usdPerSgd} USD（出發前請再用實際匯率更新）。</p>
    </article>
  `;

  reservationPlan.innerHTML = `
    <div class="blocks">
      ${data.bookingChecklist
        .map(
          (item) => `
        <article class="block-card">
          <h3>${item.name} <span class="tag">${reservationTag(item)}</span></h3>
          <p><strong>類型：</strong>${item.type}</p>
          <p><strong>建議：</strong>${item.action}</p>
          <p><strong>時機：</strong>${item.when}</p>
          <p><a href="${item.url}" target="_blank" rel="noopener noreferrer">官方或參考頁</a></p>
        </article>
      `
        )
        .join("")}
    </div>
  `;

  const transportList = document.createElement("div");
  renderList(transportList, data.transportNotes);
  transportNotes.appendChild(transportList);
}

function renderDayNav(days, onSelect) {
  const dayNav = document.getElementById("day-nav");
  dayNav.innerHTML = "";

  const allButton = document.createElement("button");
  allButton.type = "button";
  allButton.className = "day-button";
  allButton.dataset.index = "-1";
  allButton.textContent = "一次看完";
  allButton.addEventListener("click", () => onSelect(-1));
  dayNav.appendChild(allButton);

  days.forEach((day, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "day-button";
    button.dataset.index = String(index);
    button.textContent = `${day.date} (${day.weekday})`;
    button.addEventListener("click", () => onSelect(index));
    dayNav.appendChild(button);
  });
}

function renderBlocks(day) {
  const dayTitle = document.getElementById("day-title");
  const daySummary = document.getElementById("day-summary");
  const blocks = document.getElementById("blocks");

  dayTitle.textContent = `${day.date}（${day.weekday}）每日時間軸`;
  daySummary.textContent = day.summary;
  blocks.innerHTML = renderDayTimelineCard(day);
}

function renderAllBlocks(days) {
  const dayTitle = document.getElementById("day-title");
  const daySummary = document.getElementById("day-summary");
  const blocks = document.getElementById("blocks");

  dayTitle.textContent = "一次看完：全行程時間軸";
  daySummary.textContent = "以下為 7/4～7/12 完整逐日時間軸，含地點、花費、交通、天氣、預約與地圖連結。";
  blocks.innerHTML = days.map((day) => renderDayTimelineCard(day)).join("");
}

function renderMrtVisual(day) {
  const mrtSummary = document.getElementById("mrt-summary");
  const mrtVisual = document.getElementById("mrt-visual");
  const route = day.mrtRoute;

  if (!route) {
    mrtSummary.textContent = "今日無捷運重點動線。";
    mrtVisual.innerHTML = "";
    return;
  }

  mrtSummary.textContent = `${route.label}（估計交通費：${route.fare}）`;
  mrtVisual.innerHTML = route.stations
    .map((station, index) => {
      const arrow = index < route.stations.length - 1 ? `<span class="route-arrow">→</span>` : "";
      return `<span class="route-stop">${station}</span>${arrow}`;
    })
    .join("");
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

function buildGoogleMapsDirUrl(stops, travelMode) {
  const mode = travelMode || "transit";
  if (stops.length === 0) {
    return "https://www.google.com/maps/search/?api=1&query=Singapore";
  }
  if (stops.length === 1) {
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent("Citadines Rochor Singapore")}&destination=${encodeURIComponent(stops[0])}&travelmode=${mode}`;
  }
  const max = 10;
  const slice = stops.slice(0, max);
  const origin = encodeURIComponent(slice[0]);
  const destination = encodeURIComponent(slice[slice.length - 1]);
  const middle = slice.slice(1, -1);
  const waypoints = middle.length ? `&waypoints=${middle.map(encodeURIComponent).join("|")}` : "";
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints}&travelmode=${mode}`;
}

function renderDayMap(day) {
  const mapTitle = document.getElementById("day-map-title");
  const mapSummary = document.getElementById("day-map-summary");
  const mapAreas = document.getElementById("day-map-areas");
  const routeLink = document.getElementById("day-map-route-link");
  const mapFrame = document.getElementById("day-map-frame");

  const usefulBlocks = getUsefulBlocks(day);
  const focusBlock = usefulBlocks[0] || day.blocks[0];
  const mapQuery = mapQueryFromBlock(focusBlock);
  const embedUrl = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&hl=zh-TW&z=15&output=embed`;

  const stops = usefulBlocks.slice(0, 6).map((block) => mapQueryFromBlock(block));
  const routeUrl = buildGoogleMapsDirUrl(stops.length ? stops : [mapQuery], "transit");

  const uniqueAreas = Array.from(new Set(usefulBlocks.map((block) => block.location))).slice(0, 8);
  mapAreas.innerHTML = uniqueAreas
    .map((area) => `<span class="route-stop">${escapeHtml(area)}</span>`)
    .join("");

  mapTitle.textContent = `${day.date}（${day.weekday}）每日互動地圖`;
  mapSummary.textContent = "內嵌地圖聚焦今日第一站；點下方連結可在 Google Maps 開啟當日多站路線（大螢幕較清楚）。";
  routeLink.textContent = "開啟 Google Maps 當日多站路線";
  routeLink.href = routeUrl;
  mapFrame.src = embedUrl;
}

function renderAllDaysMap(days) {
  const mapTitle = document.getElementById("day-map-title");
  const mapSummary = document.getElementById("day-map-summary");
  const mapAreas = document.getElementById("day-map-areas");
  const routeLink = document.getElementById("day-map-route-link");
  const mapFrame = document.getElementById("day-map-frame");

  const allStops = collectChronologicalStops(days);
  const withHotel = ["Citadines Rochor Singapore", ...allStops].filter((q, i, arr) => arr.indexOf(q) === i);
  const routeStops = withHotel.slice(0, 10);
  const routeUrl = buildGoogleMapsDirUrl(routeStops, "transit");

  const uniqueAreas = Array.from(
    new Set(days.flatMap((d) => getUsefulBlocks(d).map((b) => b.location)))
  ).slice(0, 16);
  mapAreas.innerHTML = uniqueAreas
    .map((area) => `<span class="route-stop">${escapeHtml(area)}</span>`)
    .join("");

  mapTitle.textContent = "一次看完：全行程景點路線";
  mapSummary.textContent =
    "下方內嵌地圖以新加坡本島概覽為主；請點連結在 Google Maps 開啟「住宿起算、依行程順序」的多站路線（最多 10 站，避免網址過長）。";
  routeLink.textContent = "開啟 Google Maps 全行程多站路線";
  routeLink.href = routeUrl;
  mapFrame.src = "https://www.google.com/maps?q=Singapore&hl=zh-TW&z=11&output=embed";
}

function markActiveSelection(index) {
  const buttons = Array.from(document.querySelectorAll(".day-button"));
  buttons.forEach((button) => {
    const buttonIndex = Number(button.dataset.index);
    button.classList.toggle("active", buttonIndex === index);
  });
  const overviewCards = Array.from(document.querySelectorAll(".overview-card"));
  overviewCards.forEach((card) => {
    const cardIndex = Number(card.dataset.overviewIndex);
    card.classList.toggle("active", cardIndex === index);
  });
}

async function main() {
  try {
    const data = await loadItinerary();
    renderTopSection(data);
    const selectDay = (index) => {
      if (index === -1) {
        renderAllBlocks(data.days);
        document.getElementById("mrt-summary").textContent = "一次看完：全行程主要捷運節點（去重後）";
        document.getElementById("mrt-visual").innerHTML = data.days
          .flatMap((day) => (day.mrtRoute ? day.mrtRoute.stations : []))
          .filter((station, i, arr) => arr.indexOf(station) === i)
          .slice(0, 16)
          .map((station) => `<span class="route-stop">${escapeHtml(station)}</span>`)
          .join("");
        renderAllDaysMap(data.days);
      } else {
        renderBlocks(data.days[index]);
        renderMrtVisual(data.days[index]);
        renderDayMap(data.days[index]);
      }
      markActiveSelection(index);
    };
    renderDayNav(data.days, selectDay);
    renderAllDaysOverview(data.days, selectDay);

    selectDay(0);
  } catch (error) {
    document.body.innerHTML = `<main style="padding: 2rem;"><h1>載入失敗</h1><p>${error.message}</p></main>`;
  }
}

main();
