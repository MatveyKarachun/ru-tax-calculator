# Revenue

Калькулятор налогов на Vite, React и TypeScript.

## Приложения

- Калькулятор налогов: НДФЛ РФ и УСН ИП 6%.

## Команды

```bash
npm run dev
npm run build
npm test
```

## Аналитика и индексация

- Vercel Web Analytics подключена через `@vercel/analytics`.
- Vercel Speed Insights подключен через `@vercel/speed-insights`.
- Для Google Search Console и Yandex Webmaster нужно добавить сайт в их кабинетах и подтвердить владение доменом. Если выбираешь подтверждение через meta tag, добавь выданные сервисами значения в `index.html`.

## PWA

- `public/manifest.webmanifest` задает мобильное имя приложения `Налоги РФ`.
- `public/sw.js` кэширует shell приложения для повторного запуска без интернета.
- Последние успешно загруженные курсы USD/EUR сохраняются в `localStorage` и используются как fallback без сети.

## Технологии

- Vite
- React
- TypeScript
- Tailwind CSS
- decimal.js
- Vitest
