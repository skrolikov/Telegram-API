# Отправка заявок в Telegram (для статического хостинга)

Этот проект нужен, чтобы **не светить токен бота** в коде сайтов. Сайты (ivan, victor) лежат на Spaceweb как статика и шлют заявки сюда — сюда же на Vercel ты один раз прописываешь токен и chat ID.

## Что сделать один раз

1. **Залить этот проект в GitHub**
   - Создай репозиторий (например `telegram-api`).
   - Залить туда только папку `telegram-api`: содержимое — папка `api` с файлом `send-telegram.js` и этот README.

2. **Подключить репо к Vercel**
   - Зайди на [vercel.com](https://vercel.com) → **Add New** → **Project**.
   - **Import** твой репозиторий `telegram-api`.
   - Деплой (Deploy) — можно без настроек.

3. **Прописать токен и chat в Vercel**
   - В проекте: **Settings** → **Environment Variables**.
   - Добавить:
     - `TELEGRAM_TOKEN` — токен бота (например `8529866673:AAF...`).
     - `TELEGRAM_CHAT_ID` — ID чата (например `-1003157866843`).
   - Сохранить и сделать **Redeploy** последнего деплоя.

4. **Вписать URL в сайты**
   - В Vercel после деплоя будет адрес вида: `https://telegram-api-xxxx.vercel.app`.
   - В проектах **ivan** и **victor** в файле **`.env`** добавить (подставь свой URL без слэша в конце):
     ```
     VITE_TELEGRAM_API_URL=https://telegram-api-xxxx.vercel.app
     ```
   - Пересобрать оба сайта (`npm run build`) и выложить `dist` на Spaceweb как обычно.

После этого формы на сайтах будут отправлять заявки на `https://...vercel.app/api/send-telegram`, а токен и chat ID останутся только в настройках Vercel.
