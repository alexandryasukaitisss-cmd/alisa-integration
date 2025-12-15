export const CONFIG = {
  // Вставьте сюда Client ID из Yandex OAuth
  CLIENT_ID: "f94b1f9f42104845ba853ff985f21e14",

  // ВАЖНО: должен совпадать с Redirect URI в настройках приложения
  REDIRECT_URI: "https://alexandryasukaitisss-cmd.github.io/alisa-integration/callback.html",
  
  // Нужные права для Smart Home API
  SCOPES: ["iot:view", "iot:control"],

  // Где хранить токен: "session" (до закрытия вкладки) или "local" (переживает перезапуск)
  TOKEN_STORAGE: "local",

  // Автообновление показаний (мс)
  REFRESH_INTERVAL_MS: 30000,

  // Если упрётесь в CORS, сюда можно поставить прокси (см. раздел 5)
  // Пример: "https://your-worker.yourname.workers.dev"
  PROXY_ORIGIN: "https://ya-iot-proxy.alexandryasukaitisss.workers.dev/"
};
