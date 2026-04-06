let weatherChart = null;
let currentReport = null;
let allStations = [];

const WEATHER_CODES = {
  0: "Bezchmurnie",
  1: "Przeważnie bezchmurnie",
  2: "Częściowe zachmurzenie",
  3: "Pochmurnie",
  45: "Mgła",
  48: "Mgła lodowa",
  51: "Lekka mżawka",
  53: "Umiarkowana mżawka",
  55: "Gęsta mżawka",
  61: "Lekki deszcz",
  63: "Umiarkowany deszcz",
  65: "Silny deszcz",
  66: "Lekki marznący deszcz",
  67: "Silny marznący deszcz",
  71: "Lekki śnieg",
  73: "Umiarkowany śnieg",
  75: "Gęsty śnieg",
  77: "Śnieg ziarnisty",
  80: "Lekkie przelotne opady",
  81: "Umiarkowane przelotne opady",
  82: "Gwałtowne przelotne opady",
  85: "Lekkie opady śniegu",
  86: "Silne opady śniegu",
  95: "Burza",
  96: "Burza z lekkim gradem",
  99: "Burza z silnym gradem",
};

const WEATHER_ICONS = {
  0: "☀️",
  1: "☀️",
  2: "⛅",
  3: "☁️",
  45: "🌫️",
  48: "🌫️",
  51: "🌦️",
  53: "🌦️",
  55: "🌦️",
  56: "🌧️",
  57: "🌧️",
  61: "🌧️",
  63: "🌧️",
  65: "🌧️",
  66: "🌧️",
  67: "🌧️",
  71: "🌨️",
  73: "🌨️",
  75: "🌨️",
  77: "🌨️",
  80: "🌦️",
  81: "🌧️",
  82: "⛈️",
  85: "🌨️",
  86: "🌨️",
  95: "⛈️",
  96: "⛈️",
  99: "⛈️",
};

const CHART_COLORS = {
  temp: "#ff6b6b",
  tempBg: "rgba(255, 107, 107, 0.2)",
  humidity: "#4ecdc4",
  humidityBg: "rgba(78, 205, 196, 0.2)",
  pressure: "#ffe66d",
  pressureBg: "rgba(255, 230, 109, 0.2)",
  grid: "rgba(255, 255, 255, 0.1)",
  text: "rgba(255, 255, 255, 0.6)",
};

function getWeatherIcon(code) {
  return WEATHER_ICONS[code] || "🌤️";
}

function getWeatherDescription(code) {
  return WEATHER_CODES[code] || "Nieznane";
}

function formatTime(ts) {
  const date = new Date(ts);
  return date.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTime(ts) {
  const date = new Date(ts);
  return date.toLocaleString("pl-PL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFullDate(ts) {
  const date = new Date(ts);
  return date.toLocaleString("pl-PL", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmt(val, decimals = 1) {
  if (val === null || val === undefined) return "-";
  return val.toFixed(decimals);
}

async function init() {
  await loadStations();
  await loadLatestReadings();
  setInterval(loadLatestReadings, 60000);
  initChartPlaceholder();
  initReportPlaceholder();
  updateGreeting();
}

function initChartPlaceholder() {
  const placeholder = document.getElementById("chartPlaceholder");
  if (placeholder) {
    placeholder.style.display = "flex";
  }
}

function showChartPlaceholder(
  message = "Wybierz stację aby zobaczyć wykres historii pogody",
) {
  const placeholder = document.getElementById("chartPlaceholder");
  if (placeholder) {
    placeholder.querySelector("div:last-child").textContent = message;
    placeholder.style.display = "flex";
  }
}

function hideChartPlaceholder() {
  const placeholder = document.getElementById("chartPlaceholder");
  if (placeholder) {
    placeholder.style.display = "none";
  }
}

function initReportPlaceholder() {
  const reportContent = document.getElementById("reportContent");
  if (reportContent) {
    reportContent.innerHTML =
      '<div style="text-align: center; padding: 4rem 2rem; color: var(--text-muted);"><div style="font-size: 3rem; margin-bottom: 1rem;">📋</div><div style="font-size: 1.1rem;">Wybierz stację aby wygenerować raport pogodowy</div></div>';
  }
}

function updateGreeting() {
  const hour = new Date().getHours();
  const greeting = document.querySelector(".header-greeting h2");
  let text = "Cześć! 👋";
  if (hour < 12) text = "Dzień dobry! ☀️";
  else if (hour < 18) text = "Miłego popołudnia! 🌤️";
  else text = "Dobry wieczór! 🌙";
  greeting.textContent = text;
}

async function loadStations() {
  allStations = await (await fetch("/api/stations")).json();
  document.getElementById("stationCount").textContent =
    `${allStations.length} stacji`;
  ["stationSelect", "reportStationSelect"].forEach((id) => {
    const select = document.getElementById(id);
    allStations.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = `${s.name}, ${s.country}`;
      select.appendChild(opt);
    });
  });
}

function loadQuickStations(readings) {
  const container = document.getElementById("quickStations");
  container.innerHTML = readings
    .map(
      (r, i) => `
    <div class="quick-item" style="animation-delay: ${i * 0.1}s" onclick="selectStation(${r.station_id})">
      <span>${r.station_name}</span>
      <span class="quick-temp">${fmt(r.temperature)}°C</span>
    </div>
  `,
    )
    .join("");
}

function selectStation(stationId) {
  document.getElementById("stationSelect").value = stationId;
  document.getElementById("reportStationSelect").value = stationId;
  document.getElementById("charts").scrollIntoView({ behavior: "smooth" });
}

function scrollToSection(sectionId) {
  document.getElementById(sectionId).scrollIntoView({ behavior: "smooth" });
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.remove("active");
  });
  event.target.closest(".nav-item").classList.add("active");
}

async function loadLatestReadings() {
  try {
    const response = await fetch("/api/readings/latest");
    const readings = await response.json();
    const container = document.getElementById("weatherCards");

    if (!container) {
      console.error("Container weatherCards not found!");
      return;
    }

    if (readings.length === 0) {
      container.innerHTML =
        '<div class="loading" style="grid-column: 1/-1; text-align: center; padding: 3rem;">Brak danych. Kliknij "Odśwież" aby pobrać dane pogodowe.</div>';
      return;
    }

    container.innerHTML = readings
      .map(
        (r, i) => `
      <div class="weather-card" style="animation-delay: ${i * 0.1}s">
        <div class="weather-card-header">
          <div class="weather-location">
            <span class="weather-city">${r.station_name || "Unknown"}</span>
            <span class="weather-country">${r.country || ""}</span>
          </div>
          <div class="weather-icon-big">${getWeatherIcon(r.weather_code)}</div>
        </div>
        <div class="weather-main">
          <span class="weather-temp">${fmt(r.temperature, 0)}</span>
          <span class="weather-unit">°C</span>
        </div>
        <div class="weather-condition">${getWeatherDescription(r.weather_code)}</div>
        <div class="weather-details">
          <div class="weather-detail">
            <span class="weather-detail-label">Wilgotność</span>
            <span class="weather-detail-value">${fmt(r.humidity, 0)}%</span>
          </div>
          <div class="weather-detail">
            <span class="weather-detail-label">Ciśnienie</span>
            <span class="weather-detail-value">${fmt(r.pressure)}</span>
          </div>
          <div class="weather-detail">
            <span class="weather-detail-label">Wiatr</span>
            <span class="weather-detail-value">${fmt(r.wind_speed)} km/h</span>
          </div>
        </div>
        <div class="weather-update">${formatTime(r.timestamp)}</div>
      </div>
    `,
      )
      .join("");
    loadQuickStations(readings);
    const lastUpdateEl = document.getElementById("lastUpdate");
    if (lastUpdateEl) {
      lastUpdateEl.textContent = `Ostatnia aktualizacja: ${new Date().toLocaleTimeString("pl-PL")}`;
    }
  } catch (error) {
    console.error("Error loading readings:", error);
  }
}

async function fetchWeather() {
  const btn = document.getElementById("fetchBtn");
  const headerBtn = document.getElementById("headerRefreshBtn");
  const status = document.getElementById("fetchStatus");
  const overlay = document.getElementById("loadingOverlay");

  btn.disabled = true;
  if (headerBtn) {
    headerBtn.disabled = true;
    headerBtn.classList.add("loading");
  }
  overlay.style.display = "flex";
  status.textContent = "⏳ Pobieranie...";

  try {
    await fetch("/api/fetch", { method: "POST" });
    await loadLatestReadings();
    status.textContent = "✓ Gotowe!";
    setTimeout(() => {
      status.textContent = "";
    }, 3000);
  } catch (err) {
    status.textContent = "✗ Błąd!";
    alert("Wystąpił błąd podczas pobierania danych");
  } finally {
    btn.disabled = false;
    if (headerBtn) {
      headerBtn.disabled = false;
      headerBtn.classList.remove("loading");
    }
    overlay.style.display = "none";
  }
}

async function loadChart() {
  const stationId = document.getElementById("stationSelect").value;
  const range =
    document.querySelector('input[name="range"]:checked')?.value || "24";
  const chartContainer = document.querySelector(".chart-container");

  if (!stationId) {
    showChartPlaceholder();
    if (weatherChart) {
      weatherChart.destroy();
      weatherChart = null;
    }
    return;
  }

  const to = new Date().toISOString().slice(0, 19).replace("T", " ");
  const from = new Date(Date.now() - range * 3600000)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  try {
    const response = await fetch(
      `/api/readings/${stationId}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const readings = await response.json();

    if (readings.length === 0) {
      showChartPlaceholder("Brak danych dla wybranego zakresu czasowego");
      if (weatherChart) {
        weatherChart.destroy();
        weatherChart = null;
      }
      return;
    }

    hideChartPlaceholder();
    if (weatherChart) weatherChart.destroy();

    const station = allStations.find((s) => s.id == stationId);

    weatherChart = new Chart(document.getElementById("weatherChart"), {
      type: "line",
      data: {
        labels: readings.map((r) => formatDateTime(r.timestamp)),
        datasets: [
          {
            label: "Temperatura (°C)",
            data: readings.map((r) => r.temperature),
            borderColor: CHART_COLORS.temp,
            backgroundColor: CHART_COLORS.tempBg,
            yAxisID: "y",
            tension: 0.4,
            fill: true,
            borderWidth: 3,
            pointRadius: 4,
            pointBackgroundColor: CHART_COLORS.temp,
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
          },
          {
            label: "Wilgotność (%)",
            data: readings.map((r) => r.humidity),
            borderColor: CHART_COLORS.humidity,
            backgroundColor: CHART_COLORS.humidityBg,
            yAxisID: "y1",
            tension: 0.4,
            fill: true,
            borderWidth: 3,
            pointRadius: 4,
            pointBackgroundColor: CHART_COLORS.humidity,
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
          },
          {
            label: "Ciśnienie (hPa)",
            data: readings.map((r) => r.pressure),
            borderColor: CHART_COLORS.pressure,
            backgroundColor: CHART_COLORS.pressureBg,
            yAxisID: "y2",
            tension: 0.4,
            fill: true,
            borderWidth: 3,
            pointRadius: 4,
            pointBackgroundColor: CHART_COLORS.pressure,
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            hidden: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          title: {
            display: true,
            text: `${station?.name || "Stacja"} - historia pogody (${readings.length} odczytów)`,
            color: "#fff",
            font: { size: 16, weight: "bold" },
          },
          legend: {
            labels: {
              color: "#fff",
              usePointStyle: true,
              padding: 20,
              font: { size: 12 },
            },
          },
          tooltip: {
            backgroundColor: "rgba(15, 15, 26, 0.95)",
            titleColor: "#fff",
            bodyColor: "#fff",
            borderColor: "rgba(255, 255, 255, 0.2)",
            borderWidth: 1,
            padding: 12,
            callbacks: {
              title: function (context) {
                return "📅 " + context[0].label;
              },
            },
          },
        },
        scales: {
          x: {
            ticks: { color: CHART_COLORS.text, font: { size: 11 } },
            grid: { color: CHART_COLORS.grid, drawBorder: false },
          },
          y: {
            type: "linear",
            position: "left",
            ticks: { color: CHART_COLORS.temp, font: { size: 11 } },
            grid: { color: CHART_COLORS.grid, drawBorder: false },
            title: {
              display: true,
              text: "Temperatura (°C)",
              color: CHART_COLORS.temp,
              font: { size: 12, weight: "bold" },
            },
          },
          y1: {
            type: "linear",
            position: "right",
            ticks: { color: CHART_COLORS.humidity, font: { size: 11 } },
            grid: { drawOnChartArea: false, drawBorder: false },
            title: {
              display: true,
              text: "Wilgotność (%)",
              color: CHART_COLORS.humidity,
              font: { size: 12, weight: "bold" },
            },
          },
          y2: {
            type: "linear",
            position: "right",
            ticks: { color: CHART_COLORS.pressure, font: { size: 11 } },
            grid: { drawOnChartArea: false, drawBorder: false },
            title: {
              display: true,
              text: "Ciśnienie (hPa)",
              color: CHART_COLORS.pressure,
              font: { size: 12, weight: "bold" },
            },
          },
        },
      },
    });
  } catch (err) {
    console.error("Error loading chart:", err);
    showChartPlaceholder("Błąd podczas ładowania wykresu");
  }
}

async function loadReport() {
  const stationId = document.getElementById("reportStationSelect").value;
  const period =
    document.querySelector('input[name="period"]:checked')?.value || "24h";
  const content = document.getElementById("reportContent");

  if (!stationId) {
    content.innerHTML =
      '<div style="text-align: center; padding: 4rem 2rem; color: var(--text-muted);"><div style="font-size: 3rem; margin-bottom: 1rem;">📋</div><div style="font-size: 1.1rem;">Wybierz stację aby wygenerować raport pogodowy</div></div>';
    document.getElementById("csvBtn").style.display = "none";
    return;
  }

  currentReport = await (
    await fetch(`/api/report/${stationId}?period=${period}`)
  ).json();
  const csvBtn = document.getElementById("csvBtn");

  if (currentReport.noData) {
    content.innerHTML =
      '<div style="text-align: center; padding: 2rem; color: var(--text-muted);">Brak danych dla tego okresu.</div>';
    csvBtn.style.display = "none";
    return;
  }

  csvBtn.style.display = "inline-flex";
  const r = currentReport;

  content.innerHTML = `
    <div class="report-header">
      <h3>${r.station.name}, ${r.station.country}</h3>
      <p>${r.period} • ${r.reading_count} odczytów</p>
    </div>
    <div class="report-dates" style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px; border-left: 3px solid var(--neon-cyan);">
      <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <span style="color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">Od:</span>
          <div style="color: var(--neon-cyan); font-weight: 600;">${r.fromFormatted || formatFullDate(r.from)}</div>
        </div>
        <div style="text-align: right;">
          <span style="color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">Do:</span>
          <div style="color: var(--neon-cyan); font-weight: 600;">${r.toFormatted || formatFullDate(r.to)}</div>
        </div>
      </div>
    </div>
    <div class="report-stats">
      <div class="report-stat">
        <div class="report-stat-label">Min. temperatura</div>
        <div class="report-stat-value">${r.temperature.min}<span class="report-stat-unit">°C</span></div>
      </div>
      <div class="report-stat">
        <div class="report-stat-label">Maks. temperatura</div>
        <div class="report-stat-value">${r.temperature.max}<span class="report-stat-unit">°C</span></div>
      </div>
      <div class="report-stat">
        <div class="report-stat-label">Średnia temperatura</div>
        <div class="report-stat-value">${r.temperature.avg}<span class="report-stat-unit">°C</span></div>
      </div>
      <div class="report-stat">
        <div class="report-stat-label">Średnia wilgotność</div>
        <div class="report-stat-value">${r.humidity.avg}<span class="report-stat-unit">%</span></div>
      </div>
      <div class="report-stat">
        <div class="report-stat-label">Średnie ciśnienie</div>
        <div class="report-stat-value">${r.pressure.avg}<span class="report-stat-unit">hPa</span></div>
      </div>
      <div class="report-stat">
        <div class="report-stat-label">Średni wiatr</div>
        <div class="report-stat-value">${r.wind.avg}<span class="report-stat-unit">km/h</span></div>
      </div>
      <div class="report-stat" style="grid-column: span 2;">
        <div class="report-stat-label">Suma opadów</div>
        <div class="report-stat-value">${r.precipitation.total}<span class="report-stat-unit">mm</span></div>
      </div>
    </div>
  `;
}

function exportCSV() {
  if (!currentReport || currentReport.noData) return;

  const r = currentReport;
  const fromDate = r.fromFormatted || formatFullDate(r.from);
  const toDate = r.toFormatted || formatFullDate(r.to);

  const rows = [
    ["Raport pogodowy", r.station.name, r.station.country],
    ["Okres analizy", r.period],
    ["Data od", fromDate],
    ["Data do", toDate],
    ["Liczba odczytów", r.reading_count],
    [],
    ["Metryka", "Wartość"],
    ["Min. temperatura (°C)", r.temperature.min],
    ["Maks. temperatura (°C)", r.temperature.max],
    ["Śr. temperatura (°C)", r.temperature.avg],
    ["Śr. wilgotność (%)", r.humidity.avg],
    ["Śr. ciśnienie (hPa)", r.pressure.avg],
    ["Śr. prędkość wiatru (km/h)", r.wind.avg],
    ["Suma opadów (mm)", r.precipitation.total],
  ];

  const a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob(
      [rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")],
      { type: "text/csv;charset=utf-8;" },
    ),
  );
  a.download = `raport-${r.station.name}-${r.period}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

document.addEventListener("DOMContentLoaded", init);
