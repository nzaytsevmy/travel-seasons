#!/bin/zsh
# Ежедневно смотрит дорожную карту сайта и, если на сегодня назначен чекпоинт,
# сам запускает Claude Code с этим заданием — без участия человека.
#
# Почему локально, а не облачной задачей: перезамеры требуют ключей Метрики и
# Вебмастера (лежат в ~/.config/tt/secrets.env, вне репозитория) и живого
# просмотра выдачи в браузере, где вы залогинены. В облаке ни того, ни другого нет.
#
# Пункты берутся из seo-pulse/config.json — одна дорожная карта и для
# понедельничного отчёта, и для этого запуска. Отметил «сделано» — перестанет.

set -u
REPO="$HOME/seasons-work"
LOG_DIR="$HOME/seasons-work/.roadmap-logs"
mkdir -p "$LOG_DIR"
TODAY=$(date +%F)

DUE=$(cd "$REPO" && python3 - "$TODAY" <<'PY'
import json, sys, io
today = sys.argv[1]
c = json.load(io.open('seo-pulse/config.json', encoding='utf-8'))
for r in c.get('roadmap', []):
    if not r.get('done') and str(r.get('date','')) == today:
        print(r.get('prompt','').replace('\n', ' '))
PY
)

if [[ -z "$DUE" ]]; then
  echo "$(date '+%F %T') — на сегодня заданий нет"
  exit 0
fi

echo "$DUE" | while IFS= read -r TASK; do
  [[ -z "$TASK" ]] && continue
  echo "$(date '+%F %T') — запускаю: ${TASK:0:80}…"
  cd "$REPO" || exit 1
  # Разрешены только чтение, поиск и запуск команд: правки в репозиторий
  # агент вносит через обычный ход работы, а не молча из фонового запуска.
  claude -p "$TASK

Работай самостоятельно, отчёт пришли в конце. Если данных не хватает — скажи прямо, чего не хватает, и не выдумывай цифры." \
    --allowedTools "Bash,Read,Grep,Glob" \
    >> "$LOG_DIR/$TODAY.log" 2>&1
  echo "$(date '+%F %T') — готово, отчёт в $LOG_DIR/$TODAY.log"
done
