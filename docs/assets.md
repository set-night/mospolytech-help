# Изображения сервисов

| Файл                                               | Происхождение                                                                                   | Использование                                                                                                                                   |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `public/images/services/mosrasp.svg`               | [Публичный favicon MosRasp](https://mosrasp.ru/favicon.svg), 30.10.2026                         | Логотип рядом с названием сервиса; форма и цвета сохранены                                                                                      |
| `public/images/services/mpunav.png`                | [Публичная иконка MPUNav](https://mpunav.ru/img/favicon/favicon-192.png), 30.10.2026            | Логотип рядом с названием сервиса; форма и цвета сохранены                                                                                      |
| `src/assets/services/mosrasp-banner.png`           | Промобаннер MosRasp, предоставленный автором проекта                                            | Адаптирован через imagegen: убран внешний рекламный текст, графитовый фон и красная линия. Это иллюстрация интерфейса, не актуальное расписание |
| `src/assets/services/mpunav-preview.png`           | [Публичная главная MPUNav](https://mpunav.ru/), 30.10.2026                                      | Скриншот карты без личных данных                                                                                                                |
| `src/assets/services/account-preview.png`          | [Публичная форма входа ЛК](https://e.mospolytech.ru/), 30.10.2026                               | Скриншот без авторизации и заполнения полей                                                                                                     |
| `src/assets/services/student-services-preview.png` | [Перечень цифровых сервисов для студентов](https://help.mospolytech.ru/article/134), 30.10.2026 | Скриншот публичной инструкции                                                                                                                   |

Изображения оптимизируются средствами Astro в WebP с несколькими разрешениями; за пределами первого экрана загружаются лениво. Чтобы обновить превью, сохрани новый публичный экран без персональных данных, обнови дату в этой таблице и описание в `src/features/services/previews.ts`.

Логотипы и интерфейсы принадлежат их авторам; MIT проекта распространяется на наш код. Графические мотивы `Artwork.astro`, `Curl.astro` и `Ribbon.astro` созданы для справочника и не являются логотипом университета.

## Промпт баннера MosRasp

Режим: встроенный `image_gen`, редактирование приложенного пользователем баннера. Итоговый файл: `src/assets/services/mosrasp-banner.png`.

```text
Edit the supplied MosRasp promotional banner into a restrained website service-preview banner for polytech.help. Preserve the actual laptop and phone UI screens, their recognizable schedule widgets, and the real MosRasp service identity from the reference. Do not invent features, login information, classes, or fake readable UI. Remove all promotional headline, subtitle and floating text outside the device screens. Recompose the laptop centered and phone overlapping its lower right, the devices filling roughly 86% of the wide frame. Replace the warm multicolor blurred background with clean solid graphite #1e1e1e and just one very subtle sweeping crimson #e63246 line fading into transparency behind the devices, inspired by Moscow Polytechnic line graphics. Keep device edges elegant, thin, modern, no heavy 3D props, no glow, no clutter. Crisp understated editorial product composition, strong negative space at the edges, wide 16:9 landscape, intended as a small clickable service thumbnail. All Russian text already inside screenshots should stay faithful to the reference; no new text anywhere.
```
