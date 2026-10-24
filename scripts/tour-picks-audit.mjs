import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, basename, join } from 'node:path';
import { DIRECTIONS } from '../src/data/directions.js';
import { TOUR_PICKS, TOUR_PARTNERS, tourCollection, tourErrors, tourRatingLabel } from '../src/data/tour-picks.js';

const known = new Set(DIRECTIONS.map(d => d.slug));
const ids = new Set();
const errors = [];
const imageRoot = fileURLToPath(new URL('../src/content/blog/_images/', import.meta.url));
const provenance = JSON.parse(readFileSync(join(imageRoot, '_provenance.json'), 'utf8'));
const creditsCache = new Map();
function hasPhotoRights(relativePath) {
  const path = join(imageRoot, relativePath);
  const sidecar = join(dirname(path), '_credits.json');
  if (existsSync(sidecar)) {
    if (!creditsCache.has(sidecar)) creditsCache.set(sidecar, JSON.parse(readFileSync(sidecar, 'utf8')));
    const credits = creditsCache.get(sidecar);
    const entry = credits[basename(path).replace(/\.[^.]+$/, '')] || credits[basename(path)];
    if (entry && ['creator','license','source'].every(key => typeof entry[key] === 'string' && entry[key].trim())) return true;
  }
  const entry = provenance[relativePath];
  return entry?.status === 'own' || (entry?.status === 'licensed' && ['creator','license','source'].every(key => entry[key]));
}
for (const tour of TOUR_PICKS) {
  if (ids.has(tour.id)) errors.push(`Duplicate offer ID: ${tour.id}`);
  ids.add(tour.id);
  if (!known.has(tour.destination)) errors.push(`Unknown destination: ${tour.destination}`);
  if (tour.status !== 'approved') continue;
  if (known.has(tour.city)) errors.push(`${tour.id}: destination ID leaked into the visible location`);
  errors.push(...tourErrors(tour).map(error => `${tour.id}: ${error}`));
  if (!tour.image || !existsSync(fileURLToPath(new URL(`../src/content/blog/_images/${tour.image}`, import.meta.url)))) errors.push(`${tour.id}: missing editorial photo`);
  if (tour.image && !hasPhotoRights(tour.image)) errors.push(`${tour.id}: photo rights are not documented for ${tour.image}`);
  if (!tour.imageAlt || !tour.imageCredit) errors.push(`${tour.id}: missing photo description or provenance`);
}
const discovery = JSON.parse(readFileSync(new URL('../research/tour-discovery-2026-10-24.json', import.meta.url)));
const today = new Date().toISOString().slice(0, 10);
const rows = DIRECTIONS.map(d => {
  const tours = tourCollection(d.slug);
  const expired = TOUR_PICKS.filter(t => t.destination === d.slug && t.status === 'approved' && t.checks.reviewAfter <= today).length;
  const candidates = discovery.directions.find(x => x.slug === d.slug)?.results?.length ?? 0;
  return { slug:d.slug, name:d.cases.nom, tours, candidates, expired, status:tours.length >= 3 ? 'Подборка готова' : 'Нужно добрать и проверить' };
});
const complete = rows.filter(r => r.tours.length >= 3).length;
for (const row of rows) if (row.tours.length < 3) errors.push(`${row.slug}: fewer than 3 current reviewed offers (${row.tours.length})`);
const report = [
  '# Покрытие направлений экскурсиями', '', `Срез ${today}. Готово ${complete} из ${rows.length} направлений. Раздел показывается при наличии минимум трёх проверенных предложений. Поисковая выдача служит списком кандидатов, а не подтверждением качества.`, '',
  '## Партнёры', '',
  '| Партнёр | Канал | Одобрено предложений | Статус подключения |', '|---|---|---:|---|',
  ...Object.entries(TOUR_PARTNERS).map(([key,p]) => `| ${p.name} | ${p.network} | ${TOUR_PICKS.filter(t => t.partner === key && t.status === 'approved').length} | Существующая ссылка проекта; доступ к кабинету и действующая ставка не подтверждены |`), '',
  '## Направления', '',
  '| Направление | Одобрено и актуально | Нужно до минимума | Просрочено | Результатов поиска | Статус |', '|---|---:|---:|---:|---:|---|',
  ...rows.map(r => `| [${r.name}](https://traveltribe.ru/${r.slug}/) | ${r.tours.length} | ${Math.max(0,3-r.tours.length)} | ${r.expired} | ${r.candidates} | ${r.status} |`), '',
  '## Отобранные предложения', '',
  ...rows.filter(r => r.tours.length).flatMap(r => [
    `### ${r.name}${r.tours.length < 3 ? ' — подборка ещё не показывается' : ''}`, '',
    ...r.tours.map(t => `- [${t.title}](${t.url}) — ${TOUR_PARTNERS[t.partner].name}, ${tourRatingLabel(t)}: ${t.rating}/5, отзывов: ${t.reviewCount}. ${t.reason}`), '',
  ]),
  '## Порядок обновления', '',
  'Редактор проверяет программу, географию, организатора, последние отзывы и выборку оценок 1–3, оплату и отмену. Записывает обоснование и срок повторной проверки в checks. Основной отбор — рейтинг тура от 4,7 и минимум 30 собственных отзывов. Для редких направлений действует согласованная комплексная проверка: программа, география, отзывы покупателей, подтверждённая история и профиль организатора. При малой выборке её размер и источник оценки видны в карточке. Рейтинг организатора не выдаётся за рейтинг тура. Билеты официальных поставщиков дополнительно сверяются с собственным сайтом объекта. Предложения без доступных мест не включены. Поездка по малайзийской части Борнео и наземные экскурсии из Пуэрто-Монтта подписаны явно; круиз 2028 года содержит год в заголовке. Совпадающие маршруты объединяются по experienceKey. Цены в рублях имеют отдельный срок актуальности; без свежей цены показывается «Уточнить стоимость».', '',
  'Повторная проверка предложений — через 30 дней; цены — через 7 дней. Обновление выполняется редакционно перед очередной сборкой. Автоматическое расписание не создано. Сборка скрывает просроченные предложения; опубликованный статический сайт меняется после следующего deploy.', '',
  'Запуск: npm run check:tours. Обновить этот отчёт: node scripts/tour-picks-audit.mjs --write. Неполное покрытие не превращается в автоматическое одобрение слабых кандидатов.', '',
].join('\n');
if (process.argv.includes('--write')) writeFileSync(new URL('../research/tour-coverage.md', import.meta.url),report);
if (errors.length) { console.error(errors.join('\n')); process.exitCode=1; }
console.log(`Tours: ${TOUR_PICKS.filter(t=>t.status==='approved').length} approved; ${complete}/${rows.length} complete destinations; ${errors.length} errors.`);
