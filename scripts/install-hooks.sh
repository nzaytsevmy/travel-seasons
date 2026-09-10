#!/usr/bin/env bash
# Ставит хук pre-push как тонкую обёртку над scripts/pre-push.sh.
#
# Зачем обёртка, а не копия: сама проверка живёт в репозитории и едет вместе с
# веткой, а копия в .git/hooks ни с чем не синхронизируется. 10.09.2026 статья дня
# (текст, кадры и артефакт рецензента reviews/blog/*.json) ушла в полный визуальный
# прогон — 1 376 тестов, около 15 минут, — потому что на машине стояла копия от
# 05.09, а правило «reviews/ — это текст» слито 07.09 (#532). CI и автослияние
# новое правило знали, отставала только копия.
#
# Хук общий для всех рабочих копий (.git/hooks лежит в общем каталоге git), а
# обёртка берёт scripts/pre-push.sh той копии, из которой идёт push.
# Запуск: bash scripts/install-hooks.sh — один раз на машину; повторный безвреден.
set -euo pipefail

HOOKS="$(git rev-parse --git-common-dir)/hooks"
mkdir -p "$HOOKS"
TMP="$(mktemp "$HOOKS/.pre-push.XXXXXX")"
cat > "$TMP" <<'HOOK'
#!/usr/bin/env bash
# Обёртка, поставлена scripts/install-hooks.sh. Правила проверки — в scripts/pre-push.sh
# той рабочей копии, из которой идёт push; здесь их не держим, чтобы не отставали.
REPO="$(git rev-parse --show-toplevel)" || exit 1
CHECK="$REPO/scripts/pre-push.sh"
if [ ! -x "$CHECK" ]; then
  echo "⛔ pre-push: в этой ветке нет $CHECK — перенесите ветку на свежую main." >&2
  echo "   Осознанный обход без проверки: git push --no-verify" >&2
  exit 1
fi
# Ветка, отставшая от main, несёт и старую проверку — говорим об этом вслух, а не молча.
if git rev-parse -q --verify origin/main >/dev/null && ! git diff --quiet origin/main -- scripts/pre-push.sh 2>/dev/null; then
  echo "⚠ pre-push: scripts/pre-push.sh этой ветки отличается от origin/main — проверка может быть устаревшей; перенесите ветку на свежую main." >&2
fi
exec "$CHECK" "$@"
HOOK
chmod +x "$TMP"
# Замена переименованием: push, который прямо сейчас исполняет старый хук,
# держит старый файл открытым и доработает его до конца.
mv -f "$TMP" "$HOOKS/pre-push"
echo "pre-push: обёртка над scripts/pre-push.sh установлена в $HOOKS/pre-push"
