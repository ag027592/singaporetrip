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
  const bookingByName = Object.fromEntries(
    (day.bookingItems || []).map((item) => [item.blockName, item])
  );

  day.blocks.forEach((block) => {
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
      markActiveButton(index);
    });

    renderBlocks(data.days[0]);
    renderMrtVisual(data.days[0]);
    markActiveButton(0);
  } catch (error) {
    document.body.innerHTML = `<main style="padding: 2rem;"><h1>載入失敗</h1><p>${error.message}</p></main>`;
  }
}

main();
