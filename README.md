# SkyCheck

A simple weather app built with plain HTML, CSS and JavaScript. Search any city and see its live weather and a 5-day forecast. No framework, no build step, no API key.

## Features

- Search weather by city name
- Current temperature, feels-like temperature, humidity and wind speed
- Weather condition with icon (clear, cloudy, rain, snow, storm)
- 5-day forecast with daily high and low
- Background changes with the weather
- Loading indicator while data is being fetched
- Error handling for:
  - empty input
  - city not found
  - no internet or network failure
  - server errors
  - request timeout (10 seconds)
- Older requests are cancelled when you search again quickly

## Demo

Add a screenshot here:

```
![SkyCheck screenshot](screenshot.png)
```

## Getting started

1. Clone the repository

   ```bash
   git clone https://github.com/<Haniabatool72>/skycheck.git
   cd skycheck
   ```

2. Open `index.html` in your browser. That's it.

You need an internet connection, because the app fetches live data.

## Project structure

```
skycheck/
├── index.html   # page structure
├── style.css    # styling and weather themes
├── api.js       # all API calls (geocoding, forecast, timeout, errors)
├── script.js    # UI: loading, error messages, rendering
└── README.md
```

## How it works

1. The city name is sent to the [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api), which returns its latitude and longitude.
2. Those coordinates are sent to the [Open-Meteo Forecast API](https://open-meteo.com/en/docs), which returns current weather and the daily forecast.
3. `api.js` turns the response into a clean object and throws typed errors (`NOT_FOUND`, `TIMEOUT`, `NETWORK`, `HTTP`), so the UI never touches `fetch()`.
4. Weather codes (WMO) are mapped to a label, an icon and a background theme.

Both APIs are free and need no API key. Open-Meteo's free tier is meant for non-commercial use.

## Built with

- HTML5
- CSS3 (CSS variables, grid, flexbox)
- Vanilla JavaScript (`fetch`, `async/await`, `AbortController`)

## Ideas for improvement

- °C / °F toggle
- Recent searches saved in `localStorage`
- "Use my location" button
- Hourly forecast

## License

MIT. See [LICENSE](LICENSE) if you add one.
