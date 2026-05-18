#!/usr/bin/env python3
"""
SEO Pulse — еженедельный статус traveltribe.ru.
Делает сам: тянет цифры из Я.Вебмастера (страницы в поиске, ИКС, показы/клики),
авто-переобход свежих постов, считает тренд неделя-к-неделе, шлёт КОРОТКИЙ
отчёт в Telegram (без простыни, если действий нет), коммитит state+копию.
"""
from datetime import date, datetime
from pathlib import Path
import os, re, json, sys, urllib.parse, urllib.request

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
BLOG_DIR = REPO_ROOT / "src" / "content" / "blog"
PULSE_DIR = REPO_ROOT / "seo-pulse"
STATE_FILE = PULSE_DIR / "_state.json"
TODAY = date.today()
DRY = os.environ.get("PULSE_DRY") == "1"

HOST = "https:traveltribe.ru:443"
INDEX_MAX = 30  # дней: посты этого возраста и младше шлём на переобход


def parse_frontmatter(text: str) -> dict:
    if not text.startswith("---"):
        return {}
    end = text.find("\n---", 3)
    if end == -1:
        return {}
    fm = {}
    for line in text[3:end].splitlines():
        m = re.match(r'^([a-zA-Z_]+):\s*"?([^"]*?)"?\s*$', line)
        if m:
            fm[m.group(1)] = m.group(2)
    return fm


def yapi(path: str, method="GET", body=None):
    tok = os.environ.get("YANDEX_OAUTH_TOKEN")
    uid = os.environ.get("YANDEX_USER_ID")
    if not tok or not uid:
        return None
    url = f"https://api.webmaster.yandex.net/v4/user/{uid}/hosts/{HOST}{path}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"OAuth {tok}")
    if data:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.loads(r.read())
    except Exception as e:
        print(f"yapi {path}: {e}", file=sys.stderr)
        return None


def fetch_metrics() -> dict:
    s = yapi("/summary/") or {}
    q = yapi("/search-queries/popular/?order_by=TOTAL_SHOWS&limit=100"
             "&query_indicator=TOTAL_SHOWS&query_indicator=TOTAL_CLICKS") or {}
    shows = clicks = 0
    for it in q.get("queries", []):
        ind = it.get("indicators", {})
        shows += int(ind.get("TOTAL_SHOWS") or 0)
        clicks += int(ind.get("TOTAL_CLICKS") or 0)
    return {
        "sqi": s.get("sqi"),
        "pages": s.get("searchable_pages_count"),
        "shows": shows,
        "clicks": clicks,
    }


def recrawl(slug: str):
    return yapi("/recrawl/queue/", "POST",
                {"url": f"https://traveltribe.ru/blog/{slug}/"})


def arrow(cur, prev):
    if cur is None or prev is None:
        return ""
    d = cur - prev
    if d == 0:
        return " (→0)"
    return f" ({'▲' if d > 0 else '▼'}{abs(d)})"


def main() -> None:
    posts = []
    for md in sorted(BLOG_DIR.glob("*.md")):
        fm = parse_frontmatter(md.read_text(encoding="utf-8"))
        pub = fm.get("pubDate")
        if not pub:
            continue
        try:
            age = (TODAY - datetime.strptime(pub, "%Y-%m-%d").date()).days
        except ValueError:
            continue
        posts.append({"slug": md.stem, "title": fm.get("title", md.stem), "age": age})
    if not posts:
        print("No posts", file=sys.stderr)
        sys.exit(1)

    metrics = fetch_metrics()
    prev = {}
    if STATE_FILE.exists():
        try:
            prev = json.loads(STATE_FILE.read_text())
        except Exception:
            prev = {}

    # авто-переобход: свежие посты (<= INDEX_MAX дней)
    fresh = [p for p in posts if p["age"] <= INDEX_MAX]
    recrawled, quota = [], None
    for p in fresh:
        if DRY:
            recrawled.append(p["slug"])
            continue
        r = recrawl(p["slug"])
        if r and "task_id" in r:
            recrawled.append(p["slug"])
            quota = r.get("quota_remainder", quota)

    # сообщение
    L = [f"*TravelTribe SEO Pulse — {TODAY}*", ""]
    if metrics.get("pages") is not None:
        L.append(
            f"Страницы в поиске: {metrics['pages']}{arrow(metrics['pages'], prev.get('pages'))}  "
            f"ИКС: {metrics['sqi']}{arrow(metrics['sqi'], prev.get('sqi'))}"
        )
        L.append(
            f"Показы 7д: {metrics['shows']}{arrow(metrics['shows'], prev.get('shows'))}  "
            f"Клики: {metrics['clicks']}{arrow(metrics['clicks'], prev.get('clicks'))}"
        )
    else:
        L.append("⚠ Я.Вебмастер не ответил — цифры пропущены")
    if recrawled:
        q = f", квота {quota}" if quota is not None else ""
        L.append(f"Авто-переобход: {len(recrawled)} постов отправлено ✅{q}")
    new = [p for p in posts if p["age"] <= 7]
    if new:
        L.append("🆕 Новые (отправлены на переобход): "
                 + ", ".join(f"{p['slug']} ({p['age']}д)" for p in new))

    # «нужно от тебя» — только реально ручное: подтвердить индексацию свежих
    pending = [p for p in fresh if 14 <= p["age"] <= INDEX_MAX]
    if pending:
        L += ["", "━━━ Проверить вручную (если важно) ━━━"]
        for p in pending:
            L.append(f"• {p['slug']} ({p['age']}д) — переобход отправлен; "
                     f"статус — Вебмастер «Страницы в поиске», фильтр URL")
    else:
        L += ["", "Ручных действий нет — всё на автоматике."]

    report = "\n".join(L)
    print(report)
    if not DRY:
        PULSE_DIR.mkdir(exist_ok=True)
        (PULSE_DIR / f"{TODAY}.md").write_text(report, encoding="utf-8")
        STATE_FILE.write_text(json.dumps(
            {"date": str(TODAY), **{k: metrics.get(k) for k in ("sqi", "pages", "shows", "clicks")}},
            ensure_ascii=False), encoding="utf-8")
        send_telegram(report)


def send_telegram(text: str) -> None:
    token = os.environ.get("TG_BOT_TOKEN")
    chat_id = os.environ.get("TG_CHAT_ID")
    if not token or not chat_id:
        print("ERROR: TG secrets not set", file=sys.stderr)
        sys.exit(1)
    chunks = []
    while text:
        if len(text) <= 4000:
            chunks.append(text); break
        cut = text.rfind("\n\n", 0, 4000)
        cut = cut if cut != -1 else 4000
        chunks.append(text[:cut]); text = text[cut:].lstrip()
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    for chunk in chunks:
        for pm in ("Markdown", None):
            d = {"chat_id": chat_id, "text": chunk}
            if pm:
                d["parse_mode"] = pm
            try:
                req = urllib.request.Request(url, data=urllib.parse.urlencode(d).encode(), method="POST")
                with urllib.request.urlopen(req, timeout=15) as resp:
                    if json.loads(resp.read()).get("ok"):
                        break
            except Exception as e:
                print(f"TG {pm}: {e}", file=sys.stderr)
        else:
            sys.exit(1)


if __name__ == "__main__":
    main()
