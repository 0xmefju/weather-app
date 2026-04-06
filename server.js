const express = require('express');
const path = require('path');
const cron = require('node-cron');
const { initStations, getAllStations, insertReading, getReadings, getLatestReadings } = require('./db');
const { fetchWeather } = require('./weather-service');
const { generateReport, generateAllStationsReport, reportToCSV } = require('./report');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const STATIONS = [
  { name: 'Warszawa', country: 'Polska', lat: 52.23, lon: 21.01 },
  { name: 'Kraków', country: 'Polska', lat: 50.06, lon: 19.94 },
  { name: 'Gdańsk', country: 'Polska', lat: 54.35, lon: 18.65 },
  { name: 'Wrocław', country: 'Polska', lat: 51.11, lon: 17.03 },
  { name: 'Poznań', country: 'Polska', lat: 52.41, lon: 16.93 },
  { name: 'Berlin', country: 'Niemcy', lat: 52.52, lon: 13.41 },
  { name: 'Londyn', country: 'Wielka Brytania', lat: 51.51, lon: -0.13 },
  { name: 'Paryż', country: 'Francja', lat: 48.86, lon: 2.35 },
  { name: 'Nowy Jork', country: 'USA', lat: 40.71, lon: -74.01 },
  { name: 'Tokio', country: 'Japonia', lat: 35.68, lon: 139.69 },
  { name: 'Sydney', country: 'Australia', lat: -33.87, lon: 151.21 },
  { name: 'Moskwa', country: 'Rosja', lat: 55.76, lon: 37.62 }
];

initStations(STATIONS);

async function fetchAllStations() {
  const stations = getAllStations.all();
  console.log(`Pobieranie danych pogodowych dla ${stations.length} stacji...`);

  let successCount = 0;
  await Promise.all(
    stations.map(async (station) => {
      try {
        const weather = await fetchWeather(station.lat, station.lon);
        const timestamp = weather.timestamp.replace('T', ' ');
        insertReading.run(station.id, timestamp, weather.temperature, weather.humidity, weather.pressure, weather.wind_speed, weather.precipitation, weather.weather_code);
        console.log(`  [OK] ${station.name}: ${weather.temperature}°C, ${weather.weather_description}`);
        successCount++;
      } catch (err) {
        console.error(`  [BŁĄD] ${station.name}: ${err.message}`);
      }
    })
  );

  console.log(`Zakończono: ${successCount}/${stations.length} stacji zaktualizowane`);
}

app.get('/api/stations', (req, res) => res.json(getAllStations.all()));

app.get('/api/readings/latest', (req, res) => res.json(getLatestReadings.all()));

app.get('/api/readings/:stationId', (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'Wymagane parametry from i to (format ISO datetime)' });
  res.json(getReadings.all(parseInt(req.params.stationId), from, to));
});

app.get('/api/report/all', (req, res) => res.json(generateAllStationsReport(req.query.period || '24h')));

app.get('/api/report/:stationId', (req, res) => {
  const report = generateReport(parseInt(req.params.stationId), req.query.period || '24h');
  if (!report) return res.status(404).json({ error: 'Stacja nie znaleziona' });

  if (req.query.format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=report-${req.params.stationId}-${req.query.period}.csv`);
    res.send(reportToCSV(report));
  } else {
    res.json(report);
  }
});

app.post('/api/fetch', async (req, res) => {
  await fetchAllStations();
  res.json({ message: 'Pobieranie zakończone' });
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

fetchAllStations().then(() => {
  cron.schedule('*/15 * * * *', fetchAllStations);
  app.listen(PORT, () => console.log(`Aplikacja pogodowa działa na http://localhost:${PORT}`));
});
