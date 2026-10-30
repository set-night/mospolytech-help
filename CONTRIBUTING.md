# Как помочь

## Поправить статью

1. Открой статью на [polytech.help](https://polytech.help) и нажми **Исправить на GitHub**.
2. Измени текст → **Propose changes** → открой pull request. GitHub предложит создать форк, если он нужен.

Новый вопрос: скопируй [шаблон](docs/article-template.md) в `src/content/articles/ponyatnyy-slug.md`. Не знаешь ответа — [предложи вопрос](https://github.com/set-night/mospolytech-help/issues/new?template=question.yml).

Пиши коротко: ответ → шаги → исключения. Добавь первоисточник, теги и дату. Суммы и сроки привязывай к учебному году; личные данные не публикуй.

| Статус         | Когда использовать                 |
| -------------- | ---------------------------------- |
| `verified`     | Сопоставил ответ с первоисточником |
| `community`    | Делишься опытом студентов          |
| `needs-review` | Ответ ещё нужно проверить          |

Категории и остальные поля показаны в шаблоне. HTML в статьях не используется.

## Изменить сайт

Нужны Node.js 24 LTS и npm.

```sh
npm ci
npm run dev
```

Открой адрес из терминала. Полнотекстовый поиск проверяй в готовой сборке: `npm run build` → `npm run preview`.

Код разбит по задачам:

| Что меняешь               | Где искать                                           |
| ------------------------- | ---------------------------------------------------- |
| Статьи                    | `src/content/articles/`                              |
| Главная, категории, теги  | `src/features/browse/`                               |
| Полнотекстовый поиск      | `src/features/search/`                               |
| Тема и анимации           | `src/features/theme/`, `src/features/motion/`        |
| Общая навигация           | `src/features/navigation/`, `src/layouts/Base.astro` |
| Айдентика и favicon       | `src/features/brand/`, `public/favicon.svg`          |
| Стили и цвета             | `src/styles/global.css`                              |
| Сервисы, баннеры и ссылки | `src/features/services/`                             |
| Категории и чаты          | `src/lib/data.ts`                                    |
| SEO и Sitemap             | `src/features/seo/`, `src/pages/sitemap.xml.ts`      |
| Проверки интерфейса       | `tests/`                                             |

## Перед PR

```sh
npm run format
npm run verify
npx playwright install chromium
npm test
```

Для изменения текста достаточно PR из браузера: CI выполнит проверки сам. Для интерфейса проверь телефон, обе темы и клавиатуру; приложи скриншот. Регрессии поиска и фокуса проверяются в `tests/interactions.spec.ts`.

PR не получает секреты публикации. Отчёт браузерных тестов и сборку можно скачать в Actions. Подробности эксплуатации вынесены в [документацию](docs/README.md).

Коммиты: `docs(content): уточнить заселение`, `fix(search): исправить фильтр`. Без подписей генераторов и соавторства инструментов.

На NixOS укажи путь к Chromium в `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. WebKit для iPhone запускается в CI на Ubuntu; локально его можно включить через `PLAYWRIGHT_ALL_BROWSERS=1` после установки браузера.
