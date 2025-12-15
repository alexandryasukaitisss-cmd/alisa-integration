export const CONFIG = {
  // Вставьте сюда Client ID из Yandex OAuth
  CLIENT_ID: "8d9bb75db29f494a9ebb7b1161145d28",

  // ВАЖНО: должен совпадать с Redirect URI в настройках приложения
  REDIRECT_URI: https://oauth.yandex.ru/verification_code,

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
