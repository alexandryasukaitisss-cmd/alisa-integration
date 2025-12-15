export const CONFIG = {
  // Вставьте сюда Client ID из Yandex OAuth
  CLIENT_ID: "a2875e402bc048d3b804a12d1ccdb272",

  // ВАЖНО: должен совпадать с Redirect URI в настройках приложения
  REDIRECT_URI: window.location.origin + window.location.pathname.replace(/\/[^/]*$/, "/callback.html"),

  // Нужные права для Smart Home API
  SCOPES: ["iot:view", "iot:control"],

  // Где хранить токен: "session" (до закрытия вкладки) или "local" (переживает перезапуск)
  TOKEN_STORAGE: "local",

  // Автообновление показаний (мс)
  REFRESH_INTERVAL_MS: 15000,

  // Если упрётесь в CORS, сюда можно поставить прокси (см. раздел 5)
  // Пример: "https://your-worker.yourname.workers.dev"
  PROXY_ORIGIN: ""
};
