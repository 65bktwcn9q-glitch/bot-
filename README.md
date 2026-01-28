# Deutsch Flow — Telegram Web App (Mini App)

## Описание
Deutsch Flow — Telegram Web App для изучения немецкого и английского языков. В приложении есть мини-уроки, AI помощник, прогресс недели, лимиты для Free и VIP доступ с тестовой покупкой. UI поддерживает ru/de/en, язык обучения — de/en.

## Быстрый старт (локально)

```bash
npm i
npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:4000

## Переменные окружения

### API (`apps/api/.env`)

```env
PORT=4000
JWT_SECRET=dev_secret
TELEGRAM_BOT_TOKEN=123456:telegram-bot-token
DEV_AUTH_BYPASS=true
DEEPSEEK_API_KEY=your_deepseek_key
```

### Web (`apps/web/.env`)

```env
VITE_API_URL=/api
VITE_DEV_AUTH_BYPASS=true
VITE_DEV_USER_ID=100200300
```

## DEV auth bypass

- В DEV режиме (`DEV_AUTH_BYPASS=true`) endpoint `/auth/telegram` принимает `devUserId` и пропускает проверку `initData`.
- В PROD требуется валидное `initData` и `TELEGRAM_BOT_TOKEN`.

## DeepSeek подключение

- Укажите `DEEPSEEK_API_KEY` в API.
- Запросы идут только через backend (`/assistant/ask` и генерация уроков).
- Если ключ не указан, будут использоваться локальные шаблоны заданий.

## Мульти-язычность

- UI язык: ru / de / en
- Язык обучения: de / en
- Уровни хранятся отдельно: `levelDe` и `levelEn`.
- Прогресс и уроки учитывают `learningLanguage`.

## Payments / VIP

- `/payments/test` — тестовая покупка. Создаёт Payment и Subscription.
- Для VIP отключаются реклама и лимиты.
- История платежей доступна через `/payments`.

## Stars / TON / USDT (инструкции подключения)

> Реализация выполнена как адаптеры и endpoint `/payments/test` для проверки. Для реальных платежей:

1. **Telegram Stars**
   - Подключите `payments` в BotFather.
   - Реализуйте invoice через Bot API и обработчик `successful_payment`.
   - В API добавьте провайдер `stars` и обновляйте Payment/Subscription.

2. **TON**
   - Используйте TonConnect и проверьте транзакцию в сети.
   - Подпишите web hook, чтобы создавать Payment записи.

3. **USDT**
   - Подключите процессинг (например, через крипто-эквайринг).
   - Подтверждение оплаты через webhook -> создание Payment + Subscription.

## Деплой

- **Vercel (web + serverless API)**: в корне есть `vercel.json`, используется `npm run vercel-build`, а API публикуется как Serverless Function из `/api/index.ts`. Укажите переменные окружения для API в настройках проекта.
- **Альтернатива**: Web на Vercel, API на Railway/Render — перенесите `.env`, включите SQLite storage.
- Prisma миграции: `npm run prisma:migrate`.
