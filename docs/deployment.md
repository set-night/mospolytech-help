# Cloudflare Pages

- Аккаунт: `polytech`.
- Pages-проект: `polytech-help`.
- Основной домен: `polytech.help`; технический: `polytech-help.pages.dev`.
- Production branch: `main`. Сборка загружается через Wrangler Direct Upload.
- Выбран один путь публикации — GitHub Actions, встроенная Git-сборка Cloudflare не используется.

## Доступы

GitHub environment `production`:

| Имя                     | Тип      | Значение                                           |
| ----------------------- | -------- | -------------------------------------------------- |
| `CLOUDFLARE_ACCOUNT_ID` | variable | ID аккаунта проекта                                |
| `CLOUDFLARE_API_TOKEN`  | secret   | Токен только с `Account → Cloudflare Pages → Edit` |

Создай токен через Cloudflare Account API Tokens и ограничь аккаунтом проекта. Не выдавай ему DNS, Billing или API Tokens permissions. Для скрытого ввода и прямой записи в GitHub:

```sh
python scripts/setup-deploy.py
```

Токен хранится в GitHub, не в файлах проекта. Локальная авторизация `npx wrangler login` используется только для ручной настройки. Не копируй OAuth-токен в CI: он короткоживущий и имеет другие права.

## Как работает CI/CD

`ci.yml` на push/PR: `npm ci`, формат, контент, типы, audit, сборка, ссылки, Chromium + WebKit и axe. На каждом PR можно скачать `site` и `browser-report`, без доступа к секретам.

`deploy.yml` получает только успешные CI-запуски, проверяет push в `main` исходного репозитория. Устанавливает закреплённый Wrangler без доступа к секретам, скачивает `site` строго из этого запуска. Шаг публикации получает токен. Нет checkout, npm-скриптов проекта или выполнения кода из артефакта в привилегированной задаче.

Защита `main` требует PR, review CODEOWNERS и статус `Quality & browser tests`. Владельцу разрешён явный административный bypass для аварийного исправления. Не включай обход для сторонних участников.

## Домен

Для корневого `polytech.help` DNS-зона должна быть активна в том же Cloudflare-аккаунте. Домен сначала добавляется к Pages-проекту, затем создаётся проксируемый CNAME `polytech.help → polytech-help.pages.dev`. Не меняй существующие MX/TXT записи. HTTPS выпускается Cloudflare автоматически; статус проверяется после активации.

## Ручная публикация и откат

```sh
npm ci
npm run check
npm run build
npm run check:links
npm run deploy
```

Для отката выбери предыдущий успешный production deployment в Cloudflare Pages → Deployments → Rollback. Затем исправь `main` через PR, чтобы следующий CI не вернул ошибку.

## Будущие Functions

В `functions/` можно добавить Pages Functions; Wrangler загрузит их вместе со статикой. Перед этим определи тесты API, лимиты, валидацию и отдельные runtime-секреты. Секрет CI не должен попадать в Functions или браузер. Никакой пустой микробэкенд сейчас не развёрнут.
