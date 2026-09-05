#!/usr/bin/env bash
# traveltribe визуал-гейт перед push: build → preview :<порт копии> → playwright regression.
# Зелёный → push уходит. Не зелёный → блок. Намеренный обход: git push --no-verify
set -uo pipefail

REPO="$(git rev-parse --show-toplevel)" || exit 1
cd "$REPO" || exit 1
# Свой порт и свои логи у каждой рабочей копии (scripts/preview-port.mjs):
# соседняя сессия на общем 4322 и в общих /tmp-логах отравляла и прогон, и диагноз.
PORT="$(node scripts/preview-port.mjs)" || exit 1
LOG="/tmp/ttb_prepush_${PORT}"

# Что уезжает: только текст или ещё и вёрстка с кодом. Решение то же, что уже
# принято на сервере (там визуальный прогон имеет фильтр paths-ignore на
# src/content): текст не двигает пиксели, под эталоном 14 канареек и текста
# среди них нет. Значит для чисто текстовых правок гонять 217 визуальных
# тестов на четырёх движках незачем — хватает инвариантов, ритма и ленты.
#
# Зачем: 19.08.2026 отправка простых текстовых правок занимала минуты, потому
# что каждая попытка пересобирала сайт и гоняла полный визуальный набор — то
# же самое, что потом делает сервер. На занятой машине это растягивалось до
# получаса и валилось по чужой причине.
# Диапазон — то, что уезжает. Git передаёт хуку строки «локальная ссылка, sha,
# удалённая ссылка, sha»; удалённый sha и есть база. Раньше база считалась от
# точки расхождения с main, и каждый push ветки с кодом гонял полный визуальный
# прогон, даже если уезжали только linux-эталоны (05.09.2026: три раза по 20 минут).
# Первый push ветки (удалённый sha нулевой) и ручной запуск — по-прежнему от main.
RANGE_BASE=""
if [ ! -t 0 ]; then
  while read -r _lref _lsha _rref rsha; do
    case "$rsha" in ""|0000000000000000000000000000000000000000) ;; *) RANGE_BASE="$rsha" ;; esac
  done
fi
if [ -z "$RANGE_BASE" ] || ! git cat-file -e "$RANGE_BASE" 2>/dev/null; then
  RANGE_BASE="$(git merge-base HEAD origin/main 2>/dev/null || echo HEAD~1)"
fi
CHANGED="$(git diff --name-only "$RANGE_BASE" HEAD 2>/dev/null)"
# Linux-эталоны локально не проверяются (здесь darwin) — их сверяет CI.
CODE_TOUCHED="$(printf '%s\n' "$CHANGED" | grep -vE '^(src/content/|news/|public/llms|measurements/|tests/visual\.spec\.ts-snapshots/[^/]*-linux\.png$|.*\.md$)' | grep -v '^$' || true)"

if [ -z "$CODE_TOUCHED" ] && [ -n "$CHANGED" ]; then
  MODE="text"
  echo "▶ pre-push: правки только текстовые → сборка + гейты содержания (без визуальных)"
else
  MODE="full"
  echo "▶ pre-push визуал-гейт (build → :$PORT → playwright)…"
fi

if ! npm run check:delivery >${LOG}_delivery.log 2>&1; then
  echo "✖ delivery/agent-skills контракт НЕ зелёный → ${LOG}_delivery.log"
  exit 1
fi

# Минификация HTML занимает три четверти сборки (79с против 21с, замерено
# 01.08.2026), а на отрисовку страницы и на скриншоты не влияет вовсе.
# На прод сайт уезжает минифицированным как раньше — там переменной нет.
if ! SKIP_HTML_MIN=1 npm run build >${LOG}_build.log 2>&1; then
  echo "✖ build упал → ${LOG}_build.log"; exit 1
fi

if ! npm run check:seo >${LOG}_seo.log 2>&1; then
  echo "✖ full-site SEO audit НЕ зелёный → ${LOG}_seo.log"
  exit 1
fi

if ! node scripts/monetization-site-audit.mjs dist >${LOG}_money.log 2>&1 \
  || ! node --test tests/monetization-contract.test.mjs tests/monetization-report.test.mjs >>${LOG}_money.log 2>&1 \
  || ! python3 tests/test_seo_pulse_travelpayouts.py >>${LOG}_money.log 2>&1; then
  echo "✖ денежный контракт НЕ зелёный → ${LOG}_money.log"
  exit 1
fi

# ⛔ Сервер поднимает сам прогон (webServer в playwright.config.ts), а не мы.
#    Запущенный отсюда через ( … & ) он умирал посреди прогона, и проверки
#    краснели с «соединение отклонено» на нетронутых страницах — 27.08 так
#    пришло семь ложных падений, а одиннадцать эталонов записались страницами
#    ошибки и чуть не закрепились как образец. Ещё причина не задавать
#    PREVIEW_URL: эта переменная отключает webServer.
pkill -f "astro preview --port $PORT" 2>/dev/null
cleanup(){ pkill -f "astro preview --port $PORT" 2>/dev/null; }
trap cleanup EXIT

if [ "$MODE" = "text" ]; then
  if ! npx playwright test \
      tests/content-invariants.spec.ts tests/rhythm-gate.spec.ts tests/news-gate.spec.ts tests/monetization-browser.spec.ts tests/changed-pages-structural.spec.ts \
      --project=chromium-desktop >${LOG}_pw.log 2>&1; then
    echo "✖ гейты содержания НЕ зелёные → ${LOG}_pw.log"
    echo "  намеренный обход: git push --no-verify"
    exit 1
  fi
  echo "✔ гейты содержания зелёные — push разрешён."
  exit 0
fi

if ! npx playwright test >${LOG}_pw.log 2>&1; then
  echo "⚠ первый прогон не зелёный — ретрай упавших (отсев известного флейка blog-japan fullPage)…"
  if ! npx playwright test --last-failed >>${LOG}_pw.log 2>&1; then
    echo "✖ Playwright визуал-регресс НЕ зелёный (упало ДВАЖДЫ = реальный регресс) — push заблокирован."
    echo "  лог: ${LOG}_pw.log | отчёт: npm run check:visual:report"
    echo "  если правки легитимны (новый пост → home/blog-index):"
    echo "   1) глазами подтверди что ТОЛЬКО аддитивно"
    echo "   2) npx playwright test --update-snapshots -g \"home — visual|blog-index — visual\""
    echo "   3) повтори push"
    echo "  намеренный обход: git push --no-verify"
    exit 1
  fi
  echo "  (упавшее прошло на ретрае — флейк, не регресс; пропускаю)"
fi

echo "✔ визуал-гейт зелёный — push разрешён."
exit 0
