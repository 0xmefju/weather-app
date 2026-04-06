const { getReadingsForReport, getAllStations, getStationById } = require('./db');

const PERIODS = {
  '24h': { hours: 24, label: 'Ostatnie 24 godziny' },
  '7d': { hours: 168, label: 'Ostatnie 7 dni' },
  '30d': { hours: 720, label: 'Ostatnie 30 dni' }
};

function formatDate(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function formatPolishDate(dateStr) {
  const date = new Date(dateStr);
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return date.toLocaleDateString('pl-PL', options);
}

function generateReport(stationId, period) {
  const p = PERIODS[period] || PERIODS['24h'];
  const now = new Date();
  const from = new Date(now.getTime() - p.hours * 60 * 60 * 1000);

  const fromStr = formatDate(from);
  const toStr = formatDate(now);
  const station = getStationById.get(stationId);

  if (!station) return null;

  const stats = getReadingsForReport.get(stationId, fromStr, toStr);

  if (!stats || stats.reading_count === 0) {
    return { 
      station, 
      period: p.label, 
      from: fromStr, 
      to: toStr, 
      fromFormatted: formatPolishDate(fromStr),
      toFormatted: formatPolishDate(toStr),
      noData: true 
    };
  }

  return {
    station,
    period: p.label,
    from: fromStr,
    to: toStr,
    fromFormatted: formatPolishDate(fromStr),
    toFormatted: formatPolishDate(toStr),
    noData: false,
    temperature: {
      min: stats.min_temp?.toFixed(1) || 'N/A',
      max: stats.max_temp?.toFixed(1) || 'N/A',
      avg: stats.avg_temp?.toFixed(1) || 'N/A'
    },
    humidity: { avg: stats.avg_humidity?.toFixed(1) || 'N/A' },
    pressure: { avg: stats.avg_pressure?.toFixed(1) || 'N/A' },
    wind: { avg: stats.avg_wind?.toFixed(1) || 'N/A' },
    precipitation: { total: stats.total_precipitation?.toFixed(1) || '0.0' },
    reading_count: stats.reading_count
  };
}

function generateAllStationsReport(period) {
  return getAllStations.all().map(s => generateReport(s.id, period)).filter(r => r && !r.noData);
}

function reportToCSV(report) {
  if (report.noData) return 'Brak danych';

  const rows = [
    ['Raport pogodowy', report.station.name, report.station.country],
    ['Okres analizy', report.period],
    ['Data od', report.fromFormatted || report.from],
    ['Data do', report.toFormatted || report.to],
    ['Liczba odczytów', report.reading_count],
    [],
    ['Metryka', 'Wartość'],
    ['Min. temperatura (°C)', report.temperature.min],
    ['Maks. temperatura (°C)', report.temperature.max],
    ['Śr. temperatura (°C)', report.temperature.avg],
    ['Śr. wilgotność (%)', report.humidity.avg],
    ['Śr. ciśnienie (hPa)', report.pressure.avg],
    ['Śr. prędkość wiatru (km/h)', report.wind.avg],
    ['Suma opadów (mm)', report.precipitation.total]
  ];

  return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

module.exports = { generateReport, generateAllStationsReport, reportToCSV, PERIODS };
