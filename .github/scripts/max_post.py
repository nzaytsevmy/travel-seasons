#!/usr/bin/env python3
"""Пост новых заметок ленты в канал MAX после выкладки.

Читает CHANGED_FILES (как seo_ping), берёт ТОЛЬКО новые файлы заметок
(которых не было в предыдущем коммите), шлёт в канал: заголовок + выжимка
+ кнопка-ссылка на страницу заметки.

API MAX (сверено с dev.max.ru 12.08.2026):
  POST https://platform-api2.max.ru/messages?chat_id={id}
  Authorization: {token}   — токен ТОЛЬКО заголовком, query не поддерживается
  тело: {"text": ..., "attachments": [inline_keyboard c кнопкой type=link]}
  лимит: не больше 2 сообщений в секунду в один канал
  TLS: сертификат НУЦ Минцифры — раннер ему не доверяет, поэтому берём
  MAX_CA_FILE и добавляем к системным корням.

Секреты (GitHub Secrets): MAX_BOT_TOKEN, MAX_CHAT_ID. Пока их нет — шаг
тихо пропускается, деплой не трогаем. Появятся — начнёт постить сам.

Режимы:
  MAX_DRY_RUN=1  — напечатать payload, ничего не слать (оракул локально)
  --list-chats   — показать каналы, куда добавлен бот (узнать chat_id)
"""
from __future__ import annotations

import json
import os
import re
import ssl
import subprocess
import sys
import time
import urllib.request

API = "https://platform-api2.max.ru"
SITE = "https://traveltribe.ru"


def ssl_ctx() -> ssl.SSLContext:
    ctx = ssl.create_default_context()
    ca = os.environ.get("MAX_CA_FILE", "")
    if ca and os.path.exists(ca):
        ctx.load_verify_locations(cafile=ca)
    return ctx


def api(method: str, path: str, token: str, body: dict | None = None) -> dict:
    req = urllib.request.Request(
        API + path,
        data=json.dumps(body).encode() if body is not None else None,
        method=method,
        headers={"Authorization": token, "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=30, context=ssl_ctx()) as r:
        return json.loads(r.read() or "{}")


def new_news_files() -> list[str]:
    raw = os.environ.get("CHANGED_FILES", "")
    picked = []
    for line in raw.splitlines():
        p = line.strip()
        if not re.fullmatch(r"src/content/news/[^/]+\.md", p):
            continue
        # только ДОБАВЛЕННЫЕ: существовавшие в HEAD~1 — правки, их не постим
        probe = subprocess.run(
            ["git", "cat-file", "-e", f"HEAD~1:{p}"], capture_output=True
        )
        if probe.returncode != 0:
            picked.append(p)
    return picked


def parse_note(path: str) -> tuple[str, str, str]:
    text = open(path, encoding="utf-8").read()
    fm = text.split("---", 2)[1]
    def field(name: str) -> str:
        m = re.search(rf'^{name}:\s*"(.*)"\s*$', fm, re.M)
        return m.group(1) if m else ""
    slug = os.path.basename(path)[:-3]
    return field("title"), field("tldr"), f"{SITE}/novosti/{slug}/"


def post_note(token: str, chat_id: str, title: str, tldr: str, url: str) -> None:
    payload = {
        "text": f"{title}\n\n{tldr}",
        "attachments": [{
            "type": "inline_keyboard",
            "payload": {"buttons": [[{"type": "link", "text": "Читать на сайте", "url": url}]]},
        }],
    }
    if os.environ.get("MAX_DRY_RUN"):
        print(f"DRY-RUN → chat {chat_id}:")
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return
    api("POST", f"/messages?chat_id={chat_id}", token, payload)
    print(f"MAX: отправлено — {title[:60]}")


def main() -> int:
    token = os.environ.get("MAX_BOT_TOKEN", "")
    chat_id = os.environ.get("MAX_CHAT_ID", "")

    if "--list-chats" in sys.argv:
        if not token:
            print("нет MAX_BOT_TOKEN")
            return 1
        # GET /chats — список каналов и чатов, куда бот добавлен. Проверено живым
        # запросом 13.08.2026: /subscriptions — про вебхуки, а не про чаты.
        for c in api("GET", "/chats", token).get("chats", []):
            print(f"{c.get('chat_id')}\t{c.get('type')}\t{c.get('title')}")
        return 0

    if not token or not chat_id:
        print("MAX: секреты не заданы — пропускаю (это ок, канал ещё не подключён)")
        return 0

    notes = new_news_files()
    if not notes:
        print("MAX: новых заметок в этой выкладке нет")
        return 0

    for i, p in enumerate(notes):
        title, tldr, url = parse_note(p)
        if not title:
            print(f"MAX: у {p} не разобрался заголовок — пропуск")
            continue
        if i:
            time.sleep(1)  # лимит платформы: ≤2 сообщений в секунду
        post_note(token, chat_id, title, tldr, url)
    return 0


if __name__ == "__main__":
    sys.exit(main())
