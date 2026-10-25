# Адресная дельта после content402 CI — 25.10.2026

Scope: только язык Georgia и объяснение годового полиса в общем обзоре. Остальной текст, тесты, UI и release не изменялись этим агентом.

- Georgia: заменено «откройте именно документ, а не только квитанцию» на ясное «откройте полный документ: квитанция об оплате его не заменяет». Осталось два употребления «не только», смысл проверки состава полиса сохранён.
- Общий обзор: срок годового договора отделён от непрерывного покрытия, суммарных дней и предела одной поездки. Конкретный пример теперь именован: ЕВРОИНС «ОПТИМА-годовой», поездки не ограничены числом, каждая не более 45 дней. Прежние универсальные исключения и цены не возвращались.

Первоисточники повторно прочитаны web 25.10.2026:

1. https://www.erv.ru/products/optima-annual/ — основной текст и блок «Годовой полис»: действует один год, число поездок не ограничено, каждая до 45 дней. Внизу страницы дата изменения 27.06.2026; это дата сайта, не гарантия свежести индивидуального предложения.
2. https://www.erv.ru/files/rules/erv_rules_5_latest.pdf — Правила №5, редакция 25.08.2025. Пп.5.2–5.3 различают годовой срок, покрываемые первые дни каждого выезда и ограниченное общее число дней для иной конструкции договора. Не утверждалось, что программа «ОПТИМА-годовой» имеет отдельный ограниченный суммарный бюджет дней: читателю предложено проверить это поле своего предложения.

В `tests/packing-facts.spec.ts:69` прочитан весь страховой тест: негативные защиты от прежних универсальных исключений/413 ₽ и позитивные проверки объяснения годового покрытия. Тест не редактировался. Новая формулировка добавлена ради существенной разницы календарного срока и защиты, а не ради исторической таблицы цен. `git diff --check` чистый. Финальный рендер/CI не запускался: владелец выпуска root. Независимая дельта-рецензия B ещё нужна; прежние review hashes после изменения прозы требуют обновления рецензентом.

## Mobile comparison labels: exact CI regression

Content Gate40214454394/head660b43e6:390px/200%text produces536px scrollWidth; WebKit mobile confirms148px overflow. Original trace HTML/fonts replay: body538px, table/third TD scroll506px in326px available width. Element boxes fit; the full long data-label uses an unshrinkable flex:0 0 auto pseudo-element. Mobile-only change: flex:0 1 auto,min-width:0,max-width:100%,overflow-wrap:anywhere. Full text/thead/roles preserved; desktop/first-column rules unchanged. Independent source review: work/batch10/table-label-css-review.json. After-fix runtime and final CI remain pending.

Technical primary references checked2026-10-25: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overflow-wrap ; https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/min-width .
