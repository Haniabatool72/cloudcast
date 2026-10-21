// script.js — UI only. All API calls are in api.js.
// WMO weather codes -> label, icon, theme
const CODES = {
  0:["Clear sky","☀️","clear"], 1:["Mostly clear","🌤️","clear"], 2:["Partly cloudy","⛅","cloud"], 3:["Overcast","☁️","cloud"],
  45:["Fog","🌫️","cloud"], 48:["Freezing fog","🌫️","cloud"],
  51:["Light drizzle","🌦️","rain"], 53:["Drizzle","🌦️","rain"], 55:["Heavy drizzle","🌧️","rain"],
  61:["Light rain","🌧️","rain"], 63:["Rain","🌧️","rain"], 65:["Heavy rain","🌧️","rain"],
  71:["Light snow","🌨️","snow"], 73:["Snow","❄️","snow"], 75:["Heavy snow","❄️","snow"], 77:["Snow grains","❄️","snow"],
  80:["Rain showers","🌦️","rain"], 81:["Rain showers","🌧️","rain"], 82:["Violent showers","🌧️","rain"],
  85:["Snow showers","🌨️","snow"], 86:["Snow showers","🌨️","snow"],
  95:["Thunderstorm","⛈️","storm"], 96:["Thunderstorm, hail","⛈️","storm"], 99:["Thunderstorm, hail","⛈️","storm"]
};
const info = c => CODES[c] || ["Unknown","🌡️","cloud"];

const $ = id => document.getElementById(id);
const form = $("form"), input = $("city"), btn = $("btn"), status = $("status");
let controller = null;

function show(html) { status.innerHTML = html; }
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
const errorBox = text => show('<div class="msg error">' + text + '</div>');

async function search(name) {
  if (controller) controller.abort();          // cancel any earlier request
  controller = new AbortController();
  const { signal } = controller;

  btn.disabled = true;
  show('<div class="msg"><span class="spin"></span>Loading weather for ' + esc(name) + '…</div>');

  try {
    const data = await WeatherAPI.getWeatherByCity(name, signal);
    render(data);
  } catch (e) {
    if (e.code === "CANCELLED") return;        // replaced by a newer search
    const messages = {
      NOT_FOUND: "No city found for “" + esc(name) + "”. Check the spelling or try a nearby city.",
      TIMEOUT: "The request took too long. Check your internet connection and search again.",
      NETWORK: "Can’t reach the weather service. Check your internet connection and try again.",
      HTTP: "The weather service returned an error (" + esc(e.message) + "). Try again in a moment."
    };
    errorBox(messages[e.code] || "Something went wrong. Try again.");
  } finally {
    if (!signal.aborted) btn.disabled = false;
  }
}

function render({ place, current: c, daily }) {
  const [label, icon, theme] = info(c.code);
  document.body.className = theme;
  const title = [place.name, place.region, place.country].filter(Boolean).join(", ");

  const days = daily.map((d, i) => {
    const day = new Date(d.date + "T12:00").toLocaleDateString("en", { weekday: "short" });
    return '<div class="day"><div>' + (i ? day : "Today") + '</div><div class="ic">' + info(d.code)[1] +
      '</div><div><b>' + Math.round(d.max) + '°</b> ' + Math.round(d.min) + '°</div></div>';
  }).join("");

  show(
    '<p class="place">' + esc(title) + '</p>' +
    '<p class="temp">' + Math.round(c.temp) + '°</p>' +
    '<p class="cond"><span class="icon">' + icon + '</span>' + esc(label) + '</p>' +
    '<div class="stats">' +
      '<div class="stat"><b>' + Math.round(c.feelsLike) + '°C</b><span>Feels like</span></div>' +
      '<div class="stat"><b>' + c.humidity + esc(c.humidityUnit) + '</b><span>Humidity</span></div>' +
      '<div class="stat"><b>' + Math.round(c.wind) + ' ' + esc(c.windUnit) + '</b><span>Wind</span></div>' +
    '</div>' +
    '<div class="days">' + days + '</div>'
  );
}

form.addEventListener("submit", e => {
  e.preventDefault();
  const name = input.value.trim();
  if (!name) { errorBox("Enter a city name first."); input.focus(); return; }
  search(name);
});
