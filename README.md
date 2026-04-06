# Weather Dashboard

Aplikacja pogodowa z dashboardem showing dane z 12 stacji meteorologicznych worldwide.

## Wymagania

- Node.js 18+
- npm

## Instalacja

```bash
npm install
```

## Uruchomienie

```bash
npm start
```

Serwer uruchomi się na http://localhost:3000

## Funkcje

- **Aktualna pogoda** - dane z 12 stacji (Polska, Niemcy, Wielka Brytania, Francja, USA, Japonia, Australia, Rosja)
- **Analiza historyczna** - wykresy temperatury, wilgotności i ciśnienia
- **Raporty pogodowe** - statystyki z wybranego okresu (24h, 7 dni, 30 dni)
- **Eksport CSV** - pobieranie raportów jako plik CSV
- **Automatyczne aktualizacje** - dane pobierane co 15 minut

## Stacje

| Miasto | Kraj |
|--------|------|
| Warszawa | Polska |
| Kraków | Polska |
| Gdańsk | Polska |
| Wrocław | Polska |
| Poznań | Polska |
| Berlin | Niemcy |
| Londyn | Wielka Brytania |
| Paryż | Francja |
| Nowy Jork | USA |
| Tokio | Japonia |
| Sydney | Australia |
| Moskwa | Rosja |

## API

- `GET /api/stations` - lista stacji
- `GET /api/readings/latest` - najnowsze odczyty
- `GET /api/readings/:id?from=&to=` - historia dla stacji
- `GET /api/report/:id?period=24h|7d|30d` - raport dla stacji
- `POST /api/fetch` - wymuś pobranie danych

## Dane

Dane pochodzą z Open-Meteo API (bez klucza, darmowe).
