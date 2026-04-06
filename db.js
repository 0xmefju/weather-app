const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'weather.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(lat, lon)
  );

  CREATE TABLE IF NOT EXISTS readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER NOT NULL,
    timestamp DATETIME NOT NULL,
    temperature REAL,
    humidity REAL,
    pressure REAL,
    wind_speed REAL,
    precipitation REAL,
    weather_code INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES stations(id),
    UNIQUE(station_id, timestamp)
  );

  CREATE INDEX IF NOT EXISTS idx_readings_station ON readings(station_id);
  CREATE INDEX IF NOT EXISTS idx_readings_timestamp ON readings(timestamp);
`);

const insertStation = db.prepare(`INSERT OR IGNORE INTO stations (name, country, lat, lon) VALUES (?, ?, ?, ?)`);
const getAllStations = db.prepare('SELECT * FROM stations ORDER BY name');
const getStationById = db.prepare('SELECT * FROM stations WHERE id = ?');
const insertReading = db.prepare(`INSERT OR REPLACE INTO readings (station_id, timestamp, temperature, humidity, pressure, wind_speed, precipitation, weather_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
const getReadings = db.prepare(`SELECT * FROM readings WHERE station_id = ? AND timestamp >= ? AND timestamp <= ? ORDER BY timestamp ASC`);
const getLatestReadings = db.prepare(`SELECT r.*, s.name as station_name, s.country, s.lat, s.lon FROM readings r JOIN stations s ON r.station_id = s.id WHERE r.id IN (SELECT MAX(id) FROM readings GROUP BY station_id) ORDER BY s.name`);
const getReadingsForReport = db.prepare(`SELECT MIN(temperature) as min_temp, MAX(temperature) as max_temp, AVG(temperature) as avg_temp, AVG(humidity) as avg_humidity, AVG(pressure) as avg_pressure, AVG(wind_speed) as avg_wind, SUM(precipitation) as total_precipitation, COUNT(*) as reading_count FROM readings WHERE station_id = ? AND timestamp >= ? AND timestamp <= ?`);

function initStations(stations) {
  db.exec(`DELETE FROM stations WHERE id NOT IN (SELECT id FROM stations GROUP BY ROUND(lat, 2), ROUND(lon, 2) HAVING COUNT(*) = 1)`);

  const insert = db.transaction(() => {
    for (const station of stations) {
      insertStation.run(station.name, station.country, station.lat, station.lon);
    }
  });
  insert();
}

module.exports = { db, insertStation, getAllStations, getStationById, insertReading, getReadings, getLatestReadings, getReadingsForReport, initStations };
