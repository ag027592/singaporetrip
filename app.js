async function loadItinerary() {
  const response = await fetch("itinerary.json");
  if (!response.ok) {
    throw new Error("無法讀取 itinerary.json");
  }
  return response.json();
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
  const accommodation = document.getElementById("accommodation");
  const transportNotes = document.getElementById("transport-notes");

  tripOverview.innerHTML = `<p>${data.tripOverview}</p>`;
  renderList(attractionPlan, data.attractionPlan);

  weatherSummary.innerHTML = `
    <p>${data.weather.summary}</p>
    <div>${data.weather.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>
    <p>資料來源：${data.weather.sources.map((source) => `<a href="${source.url}" target="_blank" rel="noopener noreferrer">${source.name}</a>`).join("、")}</p>
  `;

  accommodation.innerHTML = `<p>${data.accommodation.summary}</p>`;
  const hotelCards = data.accommodation.hotels
    .map(
      (hotel) => `
      <article class="block-card">
        <h3>${hotel.name}</h3>
        <p><strong>價格區間：</strong>${hotel.priceRange}</p>
        <p><strong>床型：</strong>${hotel.bed}</p>
        <p><strong>隔音觀察：</strong>${hotel.soundproof}</p>
        <p><a href="${hotel.mapUrl}" target="_blank" rel="noopener noreferrer">Google Maps 位置</a></p>
      </article>
    `
    )
    .join("");
  if (hotelCards) {
    accommodation.innerHTML += `<div class="blocks">${hotelCards}</div>`;
  }
  const accommodationList = document.createElement("div");
  renderList(accommodationList, data.accommodation.tips);
  accommodation.appendChild(accommodationList);

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

  day.blocks.forEach((block) => {
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
      <p><a href="${block.mapUrl}" target="_blank" rel="noopener noreferrer">Google Maps 導航</a></p>
      <p>${block.notes}</p>
    `;
    blocks.appendChild(card);
  });
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
      markActiveButton(index);
    });

    renderBlocks(data.days[0]);
    markActiveButton(0);
  } catch (error) {
    document.body.innerHTML = `<main style="padding: 2rem;"><h1>載入失敗</h1><p>${error.message}</p></main>`;
  }
}

main();
