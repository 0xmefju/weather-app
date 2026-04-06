const https = require('https');

const WEATHER_CODES = {
  0: 'Bezchmurnie', 1: 'Przeważnie bezchmurnie', 2: 'Częściowe zachmurzenie', 3: 'Pochmurnie',
  45: 'Mgła', 48: 'Mgła lodowa',
  51: 'Lekka mżawka', 53: 'Umiarkowana mżawka', 55: 'Gęsta mżawka',
  61: 'Lekki deszcz', 63: 'Umiarkowany deszcz', 65: 'Silny deszcz',
  66: 'Lekki marznący deszcz', 67: 'Silny marznący deszcz',
  71: 'Lekki śnieg', 73: 'Umiarkowany śnieg', 75: 'Gęsty śnieg',
  77: 'Śnieg ziarnisty',
  80: 'Lekkie przelotne opady', 81: 'Umiarkowane przelotne opady', 82: 'Gwałtowne przelotne opady',
  85: 'Lekkie opady śniegu', 86: 'Silne opady śniegu',
  95: 'Burza', 96: 'Burza z lekkim gradem', 99: 'Burza z silnym gradem'
};

function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,precipitation,weather_code,wind_speed_10m&timezone=UTC`;

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (!json.current) {
            reject(new Error('Brak danych pogodowych'));
            return;
          }
          resolve({
            temperature: json.current.temperature_2m,
            humidity: json.current.relative_humidity_2m,
            pressure: json.current.surface_pressure,
            wind_speed: json.current.wind_speed_10m,
            precipitation: json.current.precipitation,
            weather_code: json.current.weather_code,
            weather_description: WEATHER_CODES[json.current.weather_code] || 'Nieznane',
            timestamp: json.current.time
          });
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

module.exports = { fetchWeather };
