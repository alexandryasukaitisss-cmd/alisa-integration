import { CONFIG } from "./config.js";

const LS_TOKEN = "ya_home_token";
const LS_EXP = "ya_home_token_expires_at";
const LS_FAV = "ya_home_favorites"; // JSON: { devices: {id:true}, scenarios:{id:true} }

const ui = {
  statusLine: document.getElementById("statusLine"),
  btnLogin: document.getElementById("btnLogin"),
  btnLogout: document.getElementById("btnLogout"),
  btnRefresh: document.getElementById("btnRefresh"),

  sensorsGrid: document.getElementById("sensorsGrid"),
  sensorsEmpty: document.getElementById("sensorsEmpty"),

  controlsGrid: document.getElementById("controlsGrid"),
  controlsEmpty: document.getElementById("controlsEmpty"),

  scenariosGrid: document.getElementById("scenariosGrid"),
  scenariosEmpty: document.getElementById("scenariosEmpty"),

  errorBox: document.getElementById("errorBox"),
  errorText: document.getElementById("errorText")
};

function storage() {
  return CONFIG.TOKEN_STORAGE === "local" ? localStorage : sessionStorage;
}

function getToken() {
  const s = storage();
  const token = s.getItem(LS_TOKEN);
  const expAt = Number(s.getItem(LS_EXP) || "0");
  if (!token) return null;
  if (expAt && Date.now() > expAt) return null;
  return token;
}

function clearToken() {
  const s = storage();
  s.removeItem(LS_TOKEN);
  s.removeItem(LS_EXP);
}

function getFav() {
  try {
    return JSON.parse(localStorage.getItem(LS_FAV) || "") || { devices: {}, scenarios: {} };
  } catch {
    return { devices: {}, scenarios: {} };
  }
}

function setFav(f) {
  localStorage.setItem(LS_FAV, JSON.stringify(f));
}

function setError(err) {
  ui.errorBox.style.display = "block";
  ui.errorText.textContent = String(err?.stack || err?.message || err);
}

function clearError() {
  ui.errorBox.style.display = "none";
  ui.errorText.textContent = "";
}

function oauthLogin() {
  // Для GitHub Pages (статический хостинг) используем implicit: response_type=token :contentReference[oaicite:3]{index=3}
  const scope = encodeURIComponent(CONFIG.SCOPES.join(" "));
  const redirectUri = encodeURIComponent(CONFIG.REDIRECT_URI);
  const state = encodeURIComponent(crypto.randomUUID());

  const url =
    `https://oauth.yandex.com/authorize` +
    `?response_type=token` +
    `&client_id=${encodeURIComponent(CONFIG.CLIENT_ID)}` +
    `&redirect_uri=${redirectUri}` +
    `&scope=${scope}` +
    `&state=${state}`;

  window.location.assign(url);
}

function apiBase() {
  // Smart Home API host :contentReference[oaicite:4]{index=4}
  if (CONFIG.PROXY_ORIGIN) return CONFIG.PROXY_ORIGIN.replace(/\/+$/, "");
  return "https://api.iot.yandex.net";
}

async function apiFetch(path, { method = "GET", body } = {}) {
  const token = getToken();
  if (!token) throw new Error("Нет токена. Нажмите «Войти».");

  const headers = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  };

  const res = await fetch(apiBase() + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* ignore */ }

  if (!res.ok) {
    const msg = data?.message || data?.status || text || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

function getFloatProp(device, instance) {
  const props = device?.properties || [];
  for (const p of props) {
    // PropertyStateObject содержит instance/value и пр. :contentReference[oaicite:5]{index=5}
    if (p?.type === "devices.properties.float" && p?.state?.instance === instance) {
      return p?.state?.value;
    }
  }
  return null;
}

function getOnOff(device) {
  const caps = device?.capabilities || [];
  for (const c of caps) {
    if (c?.type === "devices.capabilities.on_off" && c?.state?.instance === "on") {
      return !!c?.state?.value;
    }
  }
  return null;
}

function isFavoriteDevice(id) {
  const f = getFav();
  return !!f.devices?.[id];
}

function toggleFavoriteDevice(id) {
  const f = getFav();
  f.devices = f.devices || {};
  f.devices[id] = !f.devices[id];
  setFav(f);
}

function isFavoriteScenario(id) {
  const f = getFav();
  return !!f.scenarios?.[id];
}

function toggleFavoriteScenario(id) {
  const f = getFav();
  f.scenarios = f.scenarios || {};
  f.scenarios[id] = !f.scenarios[id];
  setFav(f);
}

function card({ title, subtitle, rightTop, body, footer, fav, onFav }) {
  const el = document.createElement("div");
  el.className = "card";

  const head = document.createElement("div");
  head.className = "cardHead";

  const left = document.createElement("div");
  left.className = "cardTitleWrap";

  const t = document.createElement("div");
  t.className = "cardTitle";
  t.textContent = title;

  const s = document.createElement("div");
  s.className = "cardSub";
  s.textContent = subtitle || "";

  left.appendChild(t);
  left.appendChild(s);

  const right = document.createElement("div");
  right.className = "cardRight";

  const favBtn = document.createElement("button");
  favBtn.className = "btn mini";
  favBtn.textContent = fav ? "★" : "☆";
  favBtn.title = "Избранное";
  favBtn.onclick = (e) => { e.preventDefault(); onFav?.(); };

  const rt = document.createElement("div");
  rt.className = "cardMeta";
  rt.textContent = rightTop || "";

  right.appendChild(favBtn);
  right.appendChild(rt);

  head.appendChild(left);
  head.appendChild(right);

  const mid = document.createElement("div");
  mid.className = "cardBody";
  if (body) mid.appendChild(body);

  const foot = document.createElement("div");
  foot.className = "cardFoot";
  if (footer) foot.appendChild(footer);

  el.appendChild(head);
  el.appendChild(mid);
  el.appendChild(foot);

  return el;
}

function makeSensorBody(temp, hum) {
  const wrap = document.createElement("div");
  wrap.className = "metrics";

  const a = document.createElement("div");
  a.className = "metric";
  a.innerHTML = `<div class="metricLabel">Температура</div><div class="metricValue">${temp ?? "—"}<span class="unit">°C</span></div>`;

  const b = document.createElement("div");
  b.className = "metric";
  b.innerHTML = `<div class="metricLabel">Влажность</div><div class="metricValue">${hum ?? "—"}<span class="unit">%</span></div>`;

  wrap.appendChild(a);
  wrap.appendChild(b);
  return wrap;
}

function makeToggleFooter(isOn, onClick) {
  const wrap = document.createElement("div");
  wrap.className = "row";

  const st = document.createElement("div");
  st.className = "pill";
  st.textContent = isOn ? "ON" : "OFF";

  const btn = document.createElement("button");
  btn.className = "btn primary";
  btn.textContent = isOn ? "Выключить" : "Включить";
  btn.onclick = onClick;

  wrap.appendChild(st);
  wrap.appendChild(btn);
  return wrap;
}

function makeScenarioFooter(onClick) {
  const wrap = document.createElement("div");
  wrap.className = "row";

  const btn = document.createElement("button");
  btn.className = "btn primary";
  btn.textContent = "Запустить";
  btn.onclick = onClick;

  wrap.appendChild(btn);
  return wrap;
}

async function render() {
  clearError();

  const token = getToken();
  ui.btnLogin.style.display = token ? "none" : "inline-flex";
  ui.btnLogout.style.display = token ? "inline-flex" : "none";
  ui.btnRefresh.style.display = token ? "inline-flex" : "none";

  if (!token) {
    ui.statusLine.textContent = "не авторизовано";
    ui.sensorsGrid.innerHTML = "";
    ui.controlsGrid.innerHTML = "";
    ui.scenariosGrid.innerHTML = "";
    ui.sensorsEmpty.style.display = "block";
    ui.controlsEmpty.style.display = "block";
    ui.scenariosEmpty.style.display = "block";
    return;
  }

  ui.statusLine.textContent = "загрузка…";

  // Получаем полную структуру дома :contentReference[oaicite:6]{index=6}
  const info = await apiFetch("/v1.0/user/info");
  const devices = info?.devices || [];
  const scenarios = info?.scenarios || [];

  const now = new Date();
  ui.statusLine.textContent = `обновлено: ${now.toLocaleTimeString()}`;

  // --- Sensors ---
  ui.sensorsGrid.innerHTML = "";
  const sensorCandidates = devices
    .map(d => ({
      d,
      t: getFloatProp(d, "temperature"),
      h: getFloatProp(d, "humidity")
    }))
    .filter(x => x.t !== null || x.h !== null);

  // Сначала избранные
  sensorCandidates.sort((a, b) => (isFavoriteDevice(b.d.id) - isFavoriteDevice(a.d.id)));

  for (const x of sensorCandidates) {
    const el = card({
      title: x.d.name,
      subtitle: x.d.room ? `Комната: ${x.d.room}` : "",
      rightTop: x.d.state || "",
      fav: isFavoriteDevice(x.d.id),
      onFav: () => { toggleFavoriteDevice(x.d.id); render(); },
      body: makeSensorBody(x.t, x.h),
      footer: null
    });
    ui.sensorsGrid.appendChild(el);
  }
  ui.sensorsEmpty.style.display = sensorCandidates.length ? "none" : "block";

  // --- Controls (on_off) ---
  ui.controlsGrid.innerHTML = "";
  const controllable = devices
    .map(d => ({ d, on: getOnOff(d) }))
    .filter(x => x.on !== null);

  controllable.sort((a, b) => (isFavoriteDevice(b.d.id) - isFavoriteDevice(a.d.id)));

  for (const x of controllable) {
    const el = card({
      title: x.d.name,
      subtitle: x.d.room ? `Комната: ${x.d.room}` : "",
      rightTop: x.d.state || "",
      fav: isFavoriteDevice(x.d.id),
      onFav: () => { toggleFavoriteDevice(x.d.id); render(); },
      body: document.createElement("div"),
      footer: makeToggleFooter(x.on, async () => {
        try {
          // Управление устройствами через POST /devices/actions :contentReference[oaicite:7]{index=7}
          await apiFetch("/v1.0/devices/actions", {
            method: "POST",
            body: {
              devices: [{
                id: x.d.id,
                actions: [{
                  type: "devices.capabilities.on_off",
                  state: { instance: "on", value: !x.on }
                }]
              }]
            }
          });
          await render();
        } catch (e) {
          setError(e);
        }
      })
    });
    ui.controlsGrid.appendChild(el);
  }
  ui.controlsEmpty.style.display = controllable.length ? "none" : "block";

  // --- Scenarios ---
  ui.scenariosGrid.innerHTML = "";
  const sc = [...scenarios].sort((a, b) => (isFavoriteScenario(b.id) - isFavoriteScenario(a.id)));

  for (const s of sc) {
    const el = card({
      title: s.name,
      subtitle: s.is_active === false ? "Неактивен" : "",
      rightTop: "",
      fav: isFavoriteScenario(s.id),
      onFav: () => { toggleFavoriteScenario(s.id); render(); },
      body: document.createElement("div"),
      footer: makeScenarioFooter(async () => {
        try {
          // POST /scenarios/{scenario_id}/actions :contentReference[oaicite:8]{index=8}
          await apiFetch(`/v1.0/scenarios/${encodeURIComponent(s.id)}/actions`, { method: "POST" });
          await render();
        } catch (e) {
          setError(e);
        }
      })
    });
    ui.scenariosGrid.appendChild(el);
  }
  ui.scenariosEmpty.style.display = sc.length ? "none" : "block";
}

let timer = null;

function startAutoRefresh() {
  if (timer) clearInterval(timer);
  timer = setInterval(() => render().catch(setError), CONFIG.REFRESH_INTERVAL_MS);
}

ui.btnLogin.onclick = () => oauthLogin();
ui.btnLogout.onclick = () => { clearToken(); render(); };
ui.btnRefresh.onclick = () => render().catch(setError);

render()
  .then(() => startAutoRefresh())
  .catch(setError);
