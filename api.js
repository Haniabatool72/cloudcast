// api.js — all communication with the weather API lives here.
// The UI (script.js) never calls fetch() directly.
//
// Provider: Open-Meteo (free, no API key needed)
//   Geocoding: https://open-meteo.com/en/docs/geocoding-api
//   Forecast:  https://open-meteo.com/en/docs

const WeatherAPI = (() => {
  const CONFIG = {
    geocodingUrl: "https://geocoding-api.open-meteo.com/v1/search",
    forecastUrl: "https://api.open-meteo.com/v1/forecast",
    timeoutMs: 10000,
    forecastDays: 5,
    // If you switch to a provider that needs a key (e.g. OpenWeatherMap),
    // put it here and add it to the request URLs below.
    // Never commit a real key to a public repo.
    apiKey: ""
  };

  // Error with a machine-readable code so the UI can show the right message.
  // Codes: NOT_FOUND | TIMEOUT | NETWORK | HTTP | CANCELLED
  class ApiError extends Error {
    constructor(code, message, status) {
      super(message);
      this.name = "ApiError";
      this.code = code;
      this.status = status;
    }
  }

  // Shared request helper: timeout + cancellation + HTTP and network errors.
  async function request(url, signal) {
    const inner = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; inner.abort(); }, CONFIG.timeoutMs);
    const onOuterAbort = () => inner.abort();
    if (signal) signal.addEventListener("abort", onOuterAbort);

    try {
      const res = await fetch(url, { signal: inner.signal });
      if (!res.ok) throw new ApiError("HTTP", "HTTP " + res.status, res.status);
      return await res.json();
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (err.name === "AbortError") {
        throw new ApiError(timedOut ? "TIMEOUT" : "CANCELLED", timedOut ? "Request timed out" : "Request cancelled");
      }
      throw new ApiError("NETWORK", "Network error");
    } finally {
      clearTimeout(timer);
      if (signal) signal.removeEventListener("abort", onOuterAbort);
    }
  }

  // City name -> { name, region, country, latitude, longitude }
  async function searchCity(name, signal) {
    const url = CONFIG.geocodingUrl + "?count=1&language=en&name=" + encodeURIComponent(name);
    const data = await request(url, signal);
    if (!data.results || !data.results.length) {
      throw new ApiError("NOT_FOUND", "City not found");
    }
    const r = data.results[0];
    return { name: r.name, region: r.admin1, country: r.country, latitude: r.latitude, longitude: r.longitude };
  }

  // Coordinates -> normalized weather object (UI does not need to know the API shape)
  async function getWeather(place, signal) {
    const url = CONFIG.forecastUrl +
      "?latitude=" + place.latitude + "&longitude=" + place.longitude +
      "&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code" +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min" +
      "&forecast_days=" + CONFIG.forecastDays + "&timezone=auto";
    const d = await request(url, signal);

    return {
      current: {
        temp: d.current.temperature_2m,
        feelsLike: d.current.apparent_temperature,
        humidity: d.current.relative_humidity_2m,
        humidityUnit: d.current_units.relative_humidity_2m,
        wind: d.current.wind_speed_10m,
        windUnit: d.current_units.wind_speed_10m,
        code: d.current.weather_code
      },
      daily: d.daily.time.map((date, i) => ({
        date,
        code: d.daily.weather_code[i],
        max: d.daily.temperature_2m_max[i],
        min: d.daily.temperature_2m_min[i]
      }))
    };
  }

  // One call for the UI: city name in, place + weather out.
  async function getWeatherByCity(name, signal) {
    const place = await searchCity(name, signal);
    const weather = await getWeather(place, signal);
    return { place, ...weather };
  }

  return { getWeatherByCity, ApiError };
})();
