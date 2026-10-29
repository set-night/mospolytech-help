<div align="center">

# polytech.help ↗

**Политех, по-человечески.**

Открытый справочник студентов Московского Политеха.

[Сайт](https://polytech.help) · [Добавить ответ](CONTRIBUTING.md) · [Сообщить об ошибке](https://github.com/set-night/mospolytech-help/issues/new/choose)

[![CI](https://github.com/set-night/mospolytech-help/actions/workflows/ci.yml/badge.svg)](https://github.com/set-night/mospolytech-help/actions/workflows/ci.yml)
[![Deploy](https://github.com/set-night/mospolytech-help/actions/workflows/deploy.yml/badge.svg)](https://github.com/set-night/mospolytech-help/actions/workflows/deploy.yml)
[![License: MIT — code](https://img.shields.io/badge/code-MIT-202020)](LICENSE)

</div>

![Главная polytech.help](public/images/screenshot-desktop.png)

106 статей с источниками. Полнотекстовый поиск, русская морфология, синонимы и исправление раскладки. `Ctrl/⌘ K` или `/` — поиск; `↑ ↓` — выбрать; `Enter` — открыть; `Esc` — закрыть.

**Astro 7 · TypeScript strict · Markdown · Pagefind · Cloudflare Pages**

## Дополнить справочник

На странице статьи нажми **Исправить на GitHub**. Для нового вопроса скопируй [шаблон](docs/article-template.md) в `src/content/articles/` и открой PR. Подробности — в [CONTRIBUTING.md](CONTRIBUTING.md). Ключи публикации участникам не нужны.

## Запуск

Node.js 24 LTS:

```sh
npm ci
npm run dev
```

Поиск работает по собранному сайту:

```sh
npm run build
npm run preview
```

Проверки: `npm run check`, `npm run check:content`, `npm run check:links` после сборки, `npm test` после `npx playwright install chromium`. Форматирование: `npm run format`.

## Публикация

PR → форматирование, типы, контент, ссылки, браузерные тесты и axe → merge в `main` → успешный CI → отдельный Deploy → [polytech.help](https://polytech.help).

В Actions доступны HTML-отчёт и готовая сборка. PR из форков не получают секреты. Деплой использует проверенный артефакт и токен из environment `production`; исходники проекта в задаче публикации не выполняются. [Настройка](docs/deployment.md) · [Безопасность](SECURITY.md).

## Источники

Материалы [официального сайта](https://mospolytech.ru/), [«Привет, Московский Политех»](https://privet-mospolytech-student-guide.lavrushec.chatgpt.site/) и [«Политех. Выжить и выпуститься»](https://faq.rozb.pw/). Снимки, покрытие импорта и ограничения — в [docs/sources](docs/sources/README.md). 50 совпадающих вопросов объединены с сохранением ссылок.

Проект неофициальный. Импортированные ответы требуют редакторской проверки — статус виден в статье. MIT распространяется на код; права на импортированные материалы остаются у авторов.
