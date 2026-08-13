#!/bin/zsh
# Ежедневно смотрит дорожную карту сайта. Если на сегодня назначен чекпоинт:
#   1) пишет напоминание в Telegram — что именно сегодня по плану;
#   2) сам запускает Claude Code с этим заданием;
#   3) присылает в Telegram выжимку результата.
#
# Почему локально, а не облачной задачей: перезамеры требуют ключей Метрики и
# Вебмастера (лежат в ~/.config/tt/secrets.env, вне репозитория) и живого
# просмотра выдачи в браузере, где вы залогинены. В облаке ни того, ни другого нет.
#
# Пункты берутся из seo-pulse/config.json — одна дорожная карта и для
# понедельничного отчёта, и для этого запуска. Отметил «сделано» — перестанет.

set -u
REPO="$HOME/seasons-work"
LOG_DIR="$REPO/.roadmap-logs"
SECRETS="$HOME/.config/tt/secrets.env"
mkdir -p "$LOG_DIR"
TODAY=$(date +%F)
LOG="$LOG_DIR/$TODAY.log"

# ⛔ Файл секретов не отдаёт значения дочерним процессам (в строках нет export),
# поэтому читаем нужные ключи напрямую.
TG_TOKEN=$(grep '^TG_BOT_TOKEN=' "$SECRETS" 2>/dev/null | cut -d= -f2-)
TG_CHAT=$(grep '^TG_CHAT_ID=' "$SECRETS" 2>/dev/null | cut -d= -f2-)

tg() {
  [[ -z "$TG_TOKEN" || -z "$TG_CHAT" ]] && { echo "нет ключей Telegram — пропускаю отправку"; return 0; }
  curl -s --max-time 20 -o /dev/null \
    "https://api.telegram.org/bot${TG_TOKEN}/sendMessage" \
    --data-urlencode "chat_id=${TG_CHAT}" \
    --data-urlencode "text=$1"
}

DUE=$(cd "$REPO" && python3 - "$TODAY" <<'PY'
import json, sys, io
today = sys.argv[1]
c = json.load(io.open('seo-pulse/config.json', encoding='utf-8'))
for r in c.get('roadmap', []):
    if not r.get('done') and str(r.get('date','')) == today:
        print(r.get('label','') + '\t' + r.get('prompt','').replace('\n', ' '))
PY
)

if [[ -z "$DUE" ]]; then
  echo "$(date '+%F %T') — на сегодня заданий нет"
  exit 0
fi

echo "$DUE" | while IFS=$'\t' read -r LABEL TASK; do
  [[ -z "$TASK" ]] && continue
  echo "$(date '+%F %T') — $LABEL"
  tg "📍 Сегодня по плану сайта: ${LABEL}

Беру в работу, отчёт пришлю сюда же."
  cd "$REPO" || exit 1
  # Разрешены только чтение, поиск и запуск команд: молча править репозиторий
  # из фонового запуска нельзя — находки приносим, решения принимает человек.
  claude -p "$TASK

Работай самостоятельно. В конце дай короткий отчёт: что нашёл, что это значит, что делать. Если данных не хватает — скажи прямо, чего не хватает, и не выдумывай цифры." \
    --allowedTools "Bash,Read,Grep,Glob" >> "$LOG" 2>&1
  RESULT=$(tail -c 3000 "$LOG")
  tg "✅ ${LABEL} — готово.

${RESULT}"
  echo "$(date '+%F %T') — отчёт отправлен, полный текст в $LOG"
done
