#!/usr/bin/env python3
"""
SEO ping after deploy: IndexNow (Bing/Yandex) + Yandex Webmaster recrawl queue.

Reads changed files from CHANGED_FILES env var (newline-separated, set in workflow
via `git diff --name-only`). Maps blog content + page sources to public URLs and
fires both APIs.

Quotas:
  - IndexNow: 10 000 URL/day, batch size up to 10 000
  - Yandex recrawl: ~150 URL/day per host

Required env (set in GitHub Secrets):
  - YANDEX_OAUTH_TOKEN   Webmaster scope, see ~/.config/yandex/
  - YANDEX_USER_ID       1861674985 for nzaytsev account

Optional:
  - INDEXNOW_KEY         override default key
"""
from __future__ import annotations

import json
import os
import sys
import urllib.request
import urllib.error

SITE = "https://traveltribe.ru"
INDEXNOW_KEY = os.environ.get("INDEXNOW_KEY", "f0944e36f6c3d1316f235088467c0383")
INDEXNOW_HOST = "traveltribe.ru"
YANDEX_TOKEN = os.environ.get("YANDEX_OAUTH_TOKEN", "")
YANDEX_USER = os.environ.get("YANDEX_USER_ID", "1861674985")
YANDEX_HOST = "https:traveltribe.ru:443"


def changed_files() -> list[str]:
    raw = os.environ.get("CHANGED_FILES", "").strip()
    return [line.strip() for line in raw.splitlines() if line.strip()]


def explicit_urls() -> list[str]:
    """Адреса, которые изменившийся файл назвать не может: страницы динамических
    роутов. Список задаёт тот, кто знает, что именно поменялось, — через
    PING_URLS (по одному в строке или через запятую)."""
    raw = os.environ.get("PING_URLS", "").strip()
    if not raw:
        return []
    parts = [x.strip() for line in raw.splitlines() for x in line.split(",")]
    return [u for u in parts if u.startswith(SITE)]


def file_to_url(path: str) -> str | None:
    """Map a repo path to its public URL, or None if it doesn't have one."""
    p = path.replace("\\", "/")

    if p.startswith("src/content/blog/") and (p.endswith(".md") or p.endswith(".mdx")):
        ext = ".mdx" if p.endswith(".mdx") else ".md"
        slug = p.rsplit("/", 1)[1][: -len(ext)]
        return f"{SITE}/blog/{slug}/"

    # Заметки ленты. Появилось 10.08.2026 вместе с их собственными адресами: до
    # этого заметка была пунктом ленты, пинговать было нечего, и робот новостей
    # публиковал молча — поисковик узнавал о заметке сам, когда доходили руки.
    if p.startswith("src/content/news/") and p.endswith(".md"):
        return f"{SITE}/novosti/{p.rsplit('/', 1)[1][:-3]}/"

    if p.startswith("src/pages/") and p.endswith(".astro"):
        rel = p[len("src/pages/") :][: -len(".astro")]
        if rel == "index":
            return f"{SITE}/"
        if rel.endswith("/index"):
            rel = rel[: -len("/index")]
        # ⛔ 05.09.2026: отсеивались только blog/[ и trips/[, поэтому правка
        # src/pages/[slug].astro отправила в IndexNow и на переобход Яндекса
        # литерал https://traveltribe.ru/[slug]/ — несуществующий адрес, а сами
        # 11 изменённых страниц не отправились никуда. Любой шаблон с квадратной
        # скобкой в пути — динамический роут: конкретные адреса подставляет тот,
        # кто их знает, через PING_URLS.
        if "[" in rel:
            return None
        return f"{SITE}/{rel}/"

    if p == "public/llms.txt":
        return f"{SITE}/llms.txt"
    if p == "public/llms-full.txt":
        return f"{SITE}/llms-full.txt"

    return None


def ping_indexnow(urls: list[str]) -> None:
    if not urls:
        return
    body = {
        "host": INDEXNOW_HOST,
        "key": INDEXNOW_KEY,
        "keyLocation": f"{SITE}/{INDEXNOW_KEY}.txt",
        "urlList": urls,
    }
    req = urllib.request.Request(
        "https://api.indexnow.org/IndexNow",
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            print(f"IndexNow: {resp.status} for {len(urls)} URLs")
    except urllib.error.HTTPError as e:
        print(f"IndexNow HTTPError {e.code}: {e.read().decode('utf-8', 'replace')}")
    except Exception as e:
        print(f"IndexNow error: {e}")


def yandex_recrawl(urls: list[str]) -> None:
    if not urls:
        return
    if not YANDEX_TOKEN:
        print("Yandex: skipped (YANDEX_OAUTH_TOKEN not set)")
        return
    base = (
        f"https://api.webmaster.yandex.net/v4/user/{YANDEX_USER}"
        f"/hosts/{YANDEX_HOST}/recrawl/queue/"
    )
    headers = {
        "Authorization": f"OAuth {YANDEX_TOKEN}",
        "Content-Type": "application/json",
    }
    ok = 0
    for url in urls:
        body = json.dumps({"url": url}).encode("utf-8")
        req = urllib.request.Request(base, data=body, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                if resp.status in (200, 202):
                    ok += 1
                else:
                    print(f"Yandex {resp.status} for {url}")
        except urllib.error.HTTPError as e:
            payload = e.read().decode("utf-8", "replace")[:200]
            print(f"Yandex {e.code} for {url}: {payload}")
        except Exception as e:
            print(f"Yandex error for {url}: {e}")
    print(f"Yandex recrawl: {ok}/{len(urls)} accepted")


def main() -> int:
    files = changed_files()
    explicit = explicit_urls()
    if not files and not explicit:
        print("No changed files passed via CHANGED_FILES; nothing to ping.")
        return 0

    urls: list[str] = []
    seen: set[str] = set()
    for u in explicit:
        if u not in seen:
            urls.append(u)
            seen.add(u)
    for f in files:
        u = file_to_url(f)
        if u and u not in seen:
            urls.append(u)
            seen.add(u)

    if not urls:
        print(f"No public URLs derivable from {len(files)} changed files.")
        return 0

    print(f"Pinging {len(urls)} URL(s):")
    for u in urls:
        print(f"  - {u}")

    ping_indexnow(urls)
    yandex_recrawl(urls)
    return 0


if __name__ == "__main__":
    sys.exit(main())
