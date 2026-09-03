#!/usr/bin/env bash
# traveltribe визуал-гейт перед push: build → preview :4322 → playwright regression.
# Зелёный → push уходит. Не зелёный → блок. Намеренный обход: git push --no-verify
set -uo pipefail

REPO="$(git rev-parse --show-toplevel)" || exit 1
cd "$REPO" || exit 1

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
RANGE_BASE="$(git merge-base HEAD origin/main 2>/dev/null || echo HEAD~1)"
CHANGED="$(git diff --name-only "$RANGE_BASE" HEAD 2>/dev/null)"
CODE_TOUCHED="$(printf '%s\n' "$CHANGED" | grep -vE '^(src/content/|news/|public/llms|measurements/|.*\.md$)' | grep -v '^$' || true)"

if [ -z "$CODE_TOUCHED" ] && [ -n "$CHANGED" ]; then
  MODE="text"
  echo "▶ pre-push: правки только текстовые → сборка + гейты содержания (без визуальных)"
else
  MODE="full"
  echo "▶ pre-push визуал-гейт (build → :4322 → playwright)…"
fi

if ! npm run check:delivery >/tmp/ttb_prepush_delivery.log 2>&1; then
  echo "✖ delivery/agent-skills контракт НЕ зелёный → /tmp/ttb_prepush_delivery.log"
  exit 1
fi

# Минификация HTML занимает три четверти сборки (79с против 21с, замерено
# 01.08.2026), а на отрисовку страницы и на скриншоты не влияет вовсе.
# На прод сайт уезжает минифицированным как раньше — там переменной нет.
if ! SKIP_HTML_MIN=1 npm run build >/tmp/ttb_prepush_build.log 2>&1; then
  echo "✖ build упал → /tmp/ttb_prepush_build.log"; exit 1
fi

if ! npm run check:seo >/tmp/ttb_prepush_seo.log 2>&1; then
  echo "✖ full-site SEO audit НЕ зелёный → /tmp/ttb_prepush_seo.log"
  exit 1
fi

if ! node scripts/monetization-site-audit.mjs dist >/tmp/ttb_prepush_money.log 2>&1 \
  || ! node --test tests/monetization-contract.test.mjs tests/monetization-report.test.mjs >>/tmp/ttb_prepush_money.log 2>&1 \
  || ! python3 tests/test_seo_pulse_travelpayouts.py >>/tmp/ttb_prepush_money.log 2>&1; then
  echo "✖ денежный контракт НЕ зелёный → /tmp/ttb_prepush_money.log"
  exit 1
fi

# ⛔ Сервер поднимает сам прогон (webServer в playwright.config.ts), а не мы.
#    Запущенный отсюда через ( … & ) он умирал посреди прогона, и проверки
#    краснели с «соединение отклонено» на нетронутых страницах — 27.08 так
#    пришло семь ложных падений, а одиннадцать эталонов записались страницами
#    ошибки и чуть не закрепились как образец. Ещё причина не задавать
#    PREVIEW_URL: эта переменная отключает webServer.
pkill -f "astro preview --port 4322" 2>/dev/null
cleanup(){ pkill -f "astro preview --port 4322" 2>/dev/null; }
trap cleanup EXIT

if [ "$MODE" = "text" ]; then
  if ! npx playwright test \
      tests/content-invariants.spec.ts tests/rhythm-gate.spec.ts tests/news-gate.spec.ts tests/monetization-browser.spec.ts tests/changed-pages-structural.spec.ts \
      --project=chromium-desktop >/tmp/ttb_prepush_pw.log 2>&1; then
    echo "✖ гейты содержания НЕ зелёные → /tmp/ttb_prepush_pw.log"
    echo "  намеренный обход: git push --no-verify"
    exit 1
  fi
  echo "✔ гейты содержания зелёные — push разрешён."
  exit 0
fi

if ! npx playwright test >/tmp/ttb_prepush_pw.log 2>&1; then
  echo "⚠ первый прогон не зелёный — ретрай упавших (отсев известного флейка blog-japan fullPage)…"
  if ! npx playwright test --last-failed >>/tmp/ttb_prepush_pw.log 2>&1; then
    echo "✖ Playwright визуал-регресс НЕ зелёный (упало ДВАЖДЫ = реальный регресс) — push заблокирован."
    echo "  лог: /tmp/ttb_prepush_pw.log | отчёт: npm run check:visual:report"
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
