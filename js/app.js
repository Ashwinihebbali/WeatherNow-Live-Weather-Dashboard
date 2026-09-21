// ─────────────────────────────────────────────────────────────────────────────
//  WeatherNow — app.js
//  Powered by Visual Crossing Weather API
//  Built by Ashwini Vishal using IBM Bob
// ─────────────────────────────────────────────────────────────────────────────

const API_KEY = 'YPC5UAXGC3Q2HPGUR8C99FULZ';
const BASE    = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline';

// ── State ─────────────────────────────────────────────────────────────────────
let isCelsius = true;
let lastData  = null;

// ── DOM refs ──────────────────────────────────────────────────────────────────
const cityInput   = document.getElementById('cityInput');
const searchBtn   = document.getElementById('searchBtn');
const unitToggle  = document.getElementById('unitToggle');
const loader      = document.getElementById('loader');
const dashboard   = document.getElementById('dashboard');
const emptyState  = document.getElementById('emptyState');
const errorBanner = document.getElementById('errorBanner');
const errorMsg    = document.getElementById('errorMsg');
const particlesEl = document.getElementById('particles');

// ── Visual Crossing icon → theme / emoji ─────────────────────────────────────
function getMetaFromVC(icon) {
  const map = {
    'clear-day':            { bg:'bg-clear',   icon:'☀️',  label:'Clear Sky'        },
    'clear-night':          { bg:'bg-night',   icon:'🌙',  label:'Clear Night'      },
    'partly-cloudy-day':    { bg:'bg-clouds',  icon:'⛅',  label:'Partly Cloudy'    },
    'partly-cloudy-night':  { bg:'bg-night',   icon:'🌥️', label:'Partly Cloudy'    },
    'cloudy':               { bg:'bg-clouds',  icon:'☁️',  label:'Cloudy'           },
    'fog':                  { bg:'bg-mist',    icon:'🌫️', label:'Foggy'            },
    'wind':                 { bg:'bg-clouds',  icon:'💨',  label:'Windy'            },
    'rain':                 { bg:'bg-rain',    icon:'🌧️', label:'Rain'             },
    'drizzle':              { bg:'bg-rain',    icon:'🌦️', label:'Drizzle'          },
    'showers-day':          { bg:'bg-rain',    icon:'🌦️', label:'Showers'          },
    'showers-night':        { bg:'bg-rain',    icon:'🌧️', label:'Night Showers'    },
    'thunder-rain':         { bg:'bg-thunder', icon:'⛈️', label:'Thunderstorm'     },
    'thunder-showers-day':  { bg:'bg-thunder', icon:'⛈️', label:'Thunderstorm'     },
    'thunder-showers-night':{ bg:'bg-thunder', icon:'🌩️', label:'Night Storm'      },
    'snow':                 { bg:'bg-snow',    icon:'❄️',  label:'Snow'             },
    'snow-showers-day':     { bg:'bg-snow',    icon:'🌨️', label:'Snow Showers'     },
    'snow-showers-night':   { bg:'bg-snow',    icon:'🌨️', label:'Night Snow'       },
    'sleet':                { bg:'bg-snow',    icon:'🌧️', label:'Sleet'            },
    'hail':                 { bg:'bg-thunder', icon:'🌩️', label:'Hail'             },
  };
  return map[icon] || { bg:'bg-clear', icon:'🌡️', label:'Weather' };
}

function particleCondition(icon) {
  if (!icon) return 'Clear';
  if (icon.includes('thunder')) return 'Thunderstorm';
  if (icon.includes('snow') || icon === 'sleet') return 'Snow';
  if (icon.includes('rain') || icon === 'drizzle' || icon.includes('showers')) return 'Rain';
  if (icon === 'fog') return 'Fog';
  return 'Clear';
}

// ── Unit helpers ──────────────────────────────────────────────────────────────
const toF     = c  => Math.round(c * 9 / 5 + 32);
const fmt     = c  => isCelsius ? `${Math.round(c)}°C` : `${toF(c)}°F`;
const fmtWind = kh => isCelsius ? `${Math.round(kh)} km/h` : `${Math.round(kh * 0.621371)} mph`;
const fmtVis  = km => `${(+km).toFixed(1)} km`;

function degToCompass(deg) {
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round((+deg) / 45) % 8];
}

// ── Date helpers ──────────────────────────────────────────────────────────────
function formatDisplayDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
}
function shortDay(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-GB', { weekday:'short' });
}
function fmt12(timeStr) {
  if (!timeStr) return '—';
  const [h, m] = timeStr.split(':');
  const hr = parseInt(h);
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}

// ── Theme ─────────────────────────────────────────────────────────────────────
const bgClasses = ['bg-clear','bg-clouds','bg-rain','bg-thunder','bg-snow','bg-mist','bg-night'];

function applyTheme(bg, vcIcon) {
  bgClasses.forEach(c => document.body.classList.remove(c));
  document.body.classList.add(bg);
  spawnParticles(particleCondition(vcIcon));
}

// ── Particle system ───────────────────────────────────────────────────────────
function spawnParticles(condition) {
  particlesEl.innerHTML = '';

  const cfgs = {
    Rain:        { count:60, sMin:1,  sMax:2.5, spMin:1,  spMax:2.5, opMin:0.4, opMax:0.8, shape:'rain'  },
    Snow:        { count:45, sMin:3,  sMax:8,   spMin:3,  spMax:6,   opMin:0.5, opMax:0.9, shape:'round' },
    Thunderstorm:{ count:50, sMin:1,  sMax:2,   spMin:0.8,spMax:2,   opMin:0.3, opMax:0.7, shape:'rain'  },
    Fog:         { count:12, sMin:60, sMax:120, spMin:8,  spMax:14,  opMin:0.05,opMax:0.12,shape:'fog'   },
    Clear:       { count:12, sMin:2,  sMax:5,   spMin:6,  spMax:12,  opMin:0.1, opMax:0.25,shape:'round' },
  };
  const cfg = cfgs[condition] || cfgs.Clear;

  for (let i = 0; i < cfg.count; i++) {
    const p    = document.createElement('div');
    const size = cfg.sMin  + Math.random() * (cfg.sMax  - cfg.sMin);
    const dur  = cfg.spMin + Math.random() * (cfg.spMax - cfg.spMin);
    const op   = cfg.opMin + Math.random() * (cfg.opMax - cfg.opMin);

    if (cfg.shape === 'rain') {
      p.className = 'particle raindrop';
      p.style.cssText = `width:${size}px;height:${size*10}px;left:${Math.random()*105}%;`
        + `animation-duration:${dur}s;animation-delay:${Math.random()*3}s;opacity:${op};`
        + `border-radius:2px;background:rgba(180,220,255,${op});`;
    } else if (cfg.shape === 'fog') {
      p.className = 'particle fog-wisp';
      p.style.cssText = `width:${size}px;height:${size*0.4}px;left:${Math.random()*110-10}%;`
        + `top:${Math.random()*100}%;animation-duration:${dur}s;animation-delay:${Math.random()*6}s;`
        + `opacity:${op};border-radius:50%;background:rgba(255,255,255,${op});animation-name:fogDrift;`;
    } else {
      p.className = 'particle';
      p.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}%;`
        + `animation-duration:${dur}s;animation-delay:${Math.random()*5}s;opacity:${op};border-radius:50%;`;
    }
    particlesEl.appendChild(p);
  }

  if (condition === 'Thunderstorm') {
    setInterval(() => {
      if (Math.random() > 0.6) {
        const f = document.createElement('div');
        f.className = 'lightning-flash';
        document.body.appendChild(f);
        setTimeout(() => f.remove(), 300);
      }
    }, 2500);
  }
}

// ── Show / hide helpers ───────────────────────────────────────────────────────
function showLoader()    { loader.classList.remove('hidden'); dashboard.classList.add('hidden'); emptyState.classList.add('hidden'); hideError(); }
function showDashboard() { loader.classList.add('hidden');    dashboard.classList.remove('hidden'); emptyState.classList.add('hidden'); }
function showEmpty()     { loader.classList.add('hidden');    dashboard.classList.add('hidden');    emptyState.classList.remove('hidden'); }
function showError(msg)  { errorBanner.classList.remove('hidden'); errorMsg.textContent = msg; }
function hideError()     { errorBanner.classList.add('hidden'); }

// ── Render current ────────────────────────────────────────────────────────────
function renderCurrent(data) {
  const today   = data.days[0];
  const cur     = data.currentConditions;
  const meta    = getMetaFromVC(cur.icon);

  applyTheme(meta.bg, cur.icon);

  document.getElementById('cityName').textContent      = data.resolvedAddress;
  document.getElementById('countryDate').textContent   = formatDisplayDate(today.datetime) + ' · ' + (cur.datetime?.slice(0,5) || '');
  document.getElementById('tempBig').textContent       = fmt(cur.temp);
  document.getElementById('weatherIcon').textContent   = meta.icon;
  document.getElementById('feelsLike').textContent     = `Feels like ${fmt(cur.feelslike)}`;
  document.getElementById('conditionText').textContent = cur.conditions || meta.label;
  document.getElementById('humidity').textContent      = `${Math.round(cur.humidity)}%`;
  document.getElementById('wind').textContent          = fmtWind(cur.windspeed);
  document.getElementById('visibility').textContent    = fmtVis(cur.visibility);
  document.getElementById('pressure').textContent      = `${Math.round(cur.pressure)} hPa`;
  document.getElementById('sunrise').textContent       = fmt12(today.sunrise);
  document.getElementById('sunset').textContent        = fmt12(today.sunset);
  document.getElementById('minMax').textContent        = `${fmt(today.tempmin)} / ${fmt(today.tempmax)}`;
  document.getElementById('cloudCover').textContent    = `${Math.round(cur.cloudcover ?? today.cloudcover)}%`;
  document.getElementById('windDir').textContent       = degToCompass(cur.winddir);
  document.getElementById('seaLevel').textContent      = cur.pressure ? `${Math.round(cur.pressure)} hPa` : '—';
}

// ── Render forecast ───────────────────────────────────────────────────────────
function renderForecast(days) {
  document.getElementById('forecastStrip').innerHTML = days.slice(0,5).map((day, i) => {
    const meta  = getMetaFromVC(day.icon);
    const label = i === 0 ? 'Today' : shortDay(day.datetime);
    return `<div class="forecast-card" style="animation-delay:${i*0.08}s">
      <p class="fc-day">${label}</p>
      <div class="fc-icon">${meta.icon}</div>
      <p class="fc-temps"><span class="fc-hi">${fmt(day.tempmax)}</span><span class="fc-lo">${fmt(day.tempmin)}</span></p>
      <p class="fc-desc">${day.conditions?.split(',')[0] || meta.label}</p>
      <p class="fc-precip">${day.precipprob > 10 ? `💧 ${Math.round(day.precipprob)}%` : ''}</p>
    </div>`;
  }).join('');
}

// ── Render hourly ─────────────────────────────────────────────────────────────
function renderHourly(hours) {
  const strip = document.getElementById('hourlyStrip');
  if (!strip || !hours) return;
  strip.innerHTML = hours.slice(0,12).map(h => {
    const meta = getMetaFromVC(h.icon);
    return `<div class="hourly-card">
      <p class="hc-time">${fmt12(h.datetime)}</p>
      <div class="hc-icon">${meta.icon}</div>
      <p class="hc-temp">${fmt(h.temp)}</p>
    </div>`;
  }).join('');
}

// ── Fetch ─────────────────────────────────────────────────────────────────────
async function fetchWeather(city) {
  if (!city.trim()) return;
  showLoader();
  hideError();

  const url = `${BASE}/${encodeURIComponent(city)}/next5days`
    + `?unitGroup=metric&key=${API_KEY}&contentType=json&include=current,hours,days`;

  try {
    const res  = await fetch(url);
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || `Error ${res.status}`);

    lastData = data;
    renderCurrent(data);
    renderForecast(data.days);
    renderHourly(data.days[0]?.hours);
    showDashboard();

  } catch (err) {
    showEmpty();
    showError(`❌  ${err.message}`);
  }
}

// ── Unit toggle ───────────────────────────────────────────────────────────────
unitToggle.addEventListener('click', () => {
  isCelsius = !isCelsius;
  unitToggle.textContent = isCelsius ? '°C / °F' : '°F / °C';
  if (lastData) {
    renderCurrent(lastData);
    renderForecast(lastData.days);
    renderHourly(lastData.days[0]?.hours);
  }
});

// ── Events ────────────────────────────────────────────────────────────────────
searchBtn.addEventListener('click', () => fetchWeather(cityInput.value));
cityInput.addEventListener('keydown', e => { if (e.key === 'Enter') fetchWeather(cityInput.value); });
document.querySelectorAll('.qc-btn').forEach(btn =>
  btn.addEventListener('click', () => {
    cityInput.value = btn.dataset.city;
    fetchWeather(btn.dataset.city);
  })
);

// ── Boot ──────────────────────────────────────────────────────────────────────
spawnParticles('Clear');
