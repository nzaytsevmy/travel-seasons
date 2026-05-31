#!/usr/bin/env sh
# Pre-push hook: блокирует push если visual tests падают.
# Цикл: build → preview server → Playwright (chromium + webkit, 4 viewports).
# Время ~2-3 минуты.

set -e

echo "→ pre-push: build production"
npm run build > /tmp/pre-push-build.log 2>&1 || {
  echo "✗ Build failed. См. /tmp/pre-push-build.log"
  exit 1
}

echo "→ pre-push: starting preview server"
pkill -f "astro preview" 2>/dev/null || true
sleep 1
npx astro preview --port 4322 > /tmp/pre-push-preview.log 2>&1 &
PREVIEW_PID=$!

for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -sf http://localhost:4322/ > /dev/null 2>&1; then break; fi
  sleep 1
done

echo "→ pre-push: visual regression tests"
if npm run check:visual > /tmp/pre-push-tests.log 2>&1; then
  echo "✓ All visual tests passed"
  RESULT=0
else
  echo "✗ Visual tests FAILED. См. /tmp/pre-push-tests.log"
  echo "  HTML-отчёт: npm run check:visual:report"
  RESULT=1
fi

kill $PREVIEW_PID 2>/dev/null || true
exit $RESULT
