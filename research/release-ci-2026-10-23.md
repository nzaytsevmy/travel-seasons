# CI и приёмка: решения 23 октября 2026

Никита поручил найти решения в интернете, включая Google, затем «примени эти
решения и запиши». Это дополнение к разбору 22 октября, а не отмена гейтов.

## Применённая конфигурация

В `playwright.config.ts` штатный trace переведён с `retain-on-failure` на
`on-first-retry`. Первый режим записывает каждый прогон и удаляет успешную трассу
после завершения; второй записывает только первый повтор. Это устраняет запись
трасс успешных тестов. Полное ускорение ещё не измерено.

Цена изменения: нет trace первой неудачной попытки. Её исходный журнал и снимок
ошибки сохраняются; trace первого повтора остаётся. Для диагностики, которой
нужна именно первая попытка, режим записи выбирается адресно. `retries: 1`,
`failOnFlakyTests: true`, четыре браузерных проекта, таймауты, сравнение пикселей,
проверки HTTP/декодирования/нативных размеров фотографий не меняются.

## Очередь и точная версия

`deploy-production` уже сериализует выкладки. Этого недостаточно для последующей
live-приёмки: другой deploy может начаться после завершения первого. Владелец
канонического release gate сохраняет окно до CI/deploy/live/report. В нашем
текущем окне отдельно приостановлены Auto Merge, обновление цен и ежедневный
Deploy. Исходные ACTIVE состояния сохранены; после приёмки их нужно восстановить.
При явной смене приоритета передать следующему владельцу квитанции и обязанность
восстановления, не объявляя незавершённый выпуск DONE.

Сейчас Никита в чате «Выполнить две рутины TravelTribe» отдал приоритет статьям и
новостям. PR782 остаётся DRAFT. Его незавершённые Visual/Content/Aggregate получили
штатный cancel; Build557/557 и успешный Lighthouse сохраняют исходную атрибуцию.
Эта новая конфигурация не проверена их прежним CI. Её полный CI и публикация
остаются обязательными после включения в согласованный финальный source.

## Сетевой checkout

В native39958439701/job120430033818 первая попытка получила Git RPC HTTP408,
`expected packfile` и ошибку promisor remote на checkout, до build/tests. Сохранён
исходный журнал. Выполнен один failed-only retry того же SHA; checkout прошёл,
запустились четыре visual parts. Их последующая остановка вызвана прямой сменой
приоритета владельцем, а не успешным полным CI и не новым сетевым повтором.

Это правило применяется только при установленной внешней сетевой причине.
Ошибки assertions и flaky остаются ошибками. Повтор того же сетевого сбоя без
изменения условий переводит шаг в HOLD; успешные независимые части сохраняются.

## Проверенные источники и Google

Google-запросы действительно открыты в браузере и прочитаны:

- `GitHub Actions deployment concurrency live tests lock Playwright`
- `site:github.com/actions/checkout "HTTP 408" "packfile"` — точного совпадения нет;
  выданная ошибка404 не принимается за причину нашего408.
- `GitHub Actions checkout "could not fetch" "promisor remote"`
- `site:playwright.dev trace on-first-retry performance heavy sharding`

Первичные материалы:

1. [GitHub: concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency): сериализация workflow, группа и отмена. Это не автоматически окно приёмки.
2. [GitHub: locks и concurrency](https://github.com/github/branch-deploy/blob/main/docs/locks.md#actions-concurrency): владение выпуском и сериализация — разные задачи. Применён существующий gate, новый lock-сервис не добавлен.
3. [GitHub: повтор отдельных заданий](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/re-run-workflows-and-jobs): failed-only повтор сохраняет исходные SHA/ref.
4. [Playwright: режимы trace](https://playwright.dev/docs/api/class-testoptions#test-options-trace): точная разница retain-on-failure и on-first-retry.
5. [Playwright: Best Practices](https://playwright.dev/docs/best-practices#debugging-on-ci): рекомендация первого повтора и накладные расходы записи каждого теста.
6. [Playwright: Sharding](https://playwright.dev/docs/test-sharding): `fullyParallel` распределяет отдельные тесты. Он уже включён у нас; новой оптимизацией не объявляется.
7. [Git: partial clone](https://git-scm.com/docs/partial-clone): рабочие blob догружаются из promisor remote. В site-artifact нужны история дат и все фото; слепое fetch-depth1 или удаление фильтра сейчас не применяется.
8. [actions/checkout2306](https://github.com/actions/checkout/issues/2306): похожий класс promisor-сбоя, но журнал содержит401, поэтому одинаковая первопричина с нашим408 не доказана.
9. [MDN: decode](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/decode): HTTP200 не доказывает готовность изображения; реальные проверки декодирования и Sharp2x сохранены.

Источники прочитаны 23.10.2026. Изменение конфигурации, адресная проверка, полный
CI, публикация, live и измеренный выигрыш — отдельные статусы. Локальная подготовка
не считается подтверждённым выпуском.
