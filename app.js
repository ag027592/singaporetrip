async function loadItinerary() {
  const response = await fetch("itinerary.json");
  if (!response.ok) {
    throw new Error("無法讀取 itinerary.json");
  }
  return response.json();
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

  dayTitle.textContent = `${day.date} (${day.weekday}) 詳細安排`;
  daySummary.textContent = day.summary;
  blocks.innerHTML = "";
  const seen = new Set();
  const uniqueBlocks = day.blocks.filter((block) => {
    const key = `${block.startTime}|${block.endTime}|${block.name}|${block.location}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
  const bookingByName = Object.fromEntries(
    (day.bookingItems || []).map((item) => [item.blockName, item])
  );

  uniqueBlocks.forEach((block) => {
    const bookingInfo = bookingByName[block.name];
    const card = document.createElement("article");
    card.className = "block-card";
    card.innerHTML = `
      <div class="block-head">
        <h3>${block.name}</h3>
        <strong>${block.startTime} - ${block.endTime}</strong>
      </div>
      <p class="meta">${block.location} | ${block.address}</p>
      <p><strong>預計花費：</strong>${block.cost}</p>
      <p><strong>交通建議：</strong>${block.transport.route}</p>
      <p><strong>捷運站：</strong>${block.transport.mrtStations.join("、")}</p>
      <p><strong>預估捷運/巴士費：</strong>${block.transport.fareEstimate}</p>
      <p><strong>天氣提醒：</strong>${block.weather}</p>
      <p><strong>預約：</strong>${bookingInfo ? reservationTag(bookingInfo) : "可現場"}${bookingInfo ? `（${bookingInfo.action}）` : ""}</p>
      <p><a href="${block.mapUrl}" target="_blank" rel="noopener noreferrer">Google Maps 導航</a></p>
      <p>${block.notes}</p>
    `;
    blocks.appendChild(card);
  });
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
  return day.blocks.filter((block) => {
    const text = `${block.name} ${block.location}`;
    return !text.includes("住宿");
  });
}

function mapQueryFromBlock(block) {
  const fallback = `${block.location || ""} ${block.address || ""}`.trim();
  const raw = (block.address && !block.address.includes("依住宿位置")) ? block.address : fallback;
  return raw || "Singapore";
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
  const embedUrl = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`;

  const stops = usefulBlocks.slice(0, 5).map((block) => mapQueryFromBlock(block));
  const origin = stops[0] || "Citadines Rochor Singapore";
  const destination = stops[stops.length - 1] || origin;
  const waypoints = stops.slice(1, -1).join("|");
  const routeUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=transit${waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : ""}`;

  const uniqueAreas = Array.from(new Set(usefulBlocks.map((block) => block.location))).slice(0, 6);
  mapAreas.innerHTML = uniqueAreas
    .map((area) => `<span class="route-stop">${area}</span>`)
    .join("");

  mapTitle.textContent = `${day.date} (${day.weekday}) 每日互動地圖`;
  mapSummary.textContent = `今日主要玩樂區域已圈選如下，地圖預設聚焦第一站，點下方連結可開啟完整 Google Maps 大圖路線。`;
  routeLink.href = routeUrl;
  mapFrame.src = embedUrl;
}

function markActiveButton(index) {
  const buttons = Array.from(document.querySelectorAll(".day-button"));
  buttons.forEach((button) => {
    const buttonIndex = Number(button.dataset.index);
    button.classList.toggle("active", buttonIndex === index);
  });
}

async function main() {
  try {
    const data = await loadItinerary();
    renderTopSection(data);
    renderDayNav(data.days, (index) => {
      renderBlocks(data.days[index]);
      renderMrtVisual(data.days[index]);
      renderDayMap(data.days[index]);
      markActiveButton(index);
    });

    renderBlocks(data.days[0]);
    renderMrtVisual(data.days[0]);
    renderDayMap(data.days[0]);
    markActiveButton(0);
  } catch (error) {
    document.body.innerHTML = `<main style="padding: 2rem;"><h1>載入失敗</h1><p>${error.message}</p></main>`;
  }
}

main();
