# Монетизация TravelTribe — контрольный срез 31.08.2026

Часовой пояс отчёта — Europe/Moscow. Финансовые статусы и суммы проверены через
официальный Statistics API Travelpayouts; идентификаторы броней и секреты не
сохраняются в репозитории.

## Деньги

- `paid`: 1 действие, 269,64 ₽ подтверждённой комиссии;
- `processing`: 4 действия, 11 790,22 ₽ потенциальной комиссии;
- `cancelled`: 0 действий;
- всего: 5 действий у четырёх партнёрских программ.

`processing` не считается доходом. Единственная подтверждённая сумма на дату
среза — 269,64 ₽.

## Атрибуция

- старый `sub_id` есть у 5 из 5 действий;
- `external_click_id` есть у 1 из 5 действий;
- этот `external_click_id` найден у action, но не у исходного redirect;
- CTA-level цепочка видна, но при нескольких кликах нельзя доказать, какой из
  них создал заказ.

Поэтому историческое покрытие точным `action→click` join равно 0%. С 31.08.2026
контракт `revenue_v2` кладёт один случайный `click_id` одновременно в `sub_id`
Travelpayouts и событие `outbound_link` Метрики.

## Не смешивать окна

Срез Метрики 27.08.2026 содержит 8 883 органические сессии и 245 человеческих
переходов к партнёрам. Это более ранний трафиковый baseline, а не знаменатель
для пяти действий 31.08.2026. Денежный RPM появится только после сведения
эквивалентных когорт по `click_date` и окну зрелости.

## Источники контракта

- Travelpayouts Statistics API: https://support.travelpayouts.com/hc/en-us/articles/360019864079-API-of-affiliate-programs-booking-statistics
- Travelpayouts SubID: https://support.travelpayouts.com/hc/en-us/articles/203955653-ID-and-SubID-Affiliate-marker-and-additional-marker
- Яндекс.Метрика `reachGoal`: https://yandex.ru/support/metrica/ru/objects/reachgoal
