#!/usr/bin/env python3
"""
SEO Pulse — еженедельный анализ блог-постов traveltribe.ru.
Читает src/content/blog/*.md, считает возраст постов, категоризирует
по схеме INDEXATION/OPTIMIZE/REFRESH/ANNUAL/ARCHIVE, шлёт отчёт в Telegram
и коммитит копию в seo-pulse/<date>.md.
"""
from datetime import date, datetime
from pathlib import Path
import os
import re
import urllib.parse
import urllib.request
import json
import sys

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
BLOG_DIR = REPO_ROOT / "src" / "content" / "blog"
PULSE_DIR = REPO_ROOT / "seo-pulse"
TODAY = date.today()

CATEGORIES = [
    (14, "SKIP", ""),
    (30, "INDEXATION", "Скриншот Я.Вебмастера → «Индексирование → Страницы в поиске» (фильтр URL)"),
    (90, "OPTIMIZE", "Два CSV (yawebmaster + gsc) — цель: low-CTR <2% при позиции топ-10"),
    (180, "REFRESH", "Два CSV + свежие цены/визы/отзывы из @traveltriberu, 3-5 новых FAQ"),
    (365, "ANNUAL", "Полная ревизия фактов + два CSV + обновить updatedDate"),
    (10**6, "ARCHIVE", "Переписать с нуля / 301-редирект / удалить"),
]


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


def categorize(age_days: int) -> tuple[str, str]:
    for limit, name, action in CATEGORIES:
        if age_days < limit:
            return name, action
    return "ARCHIVE", CATEGORIES[-1][2]


def csv_block(slug: str) -> str:
    return (
        f"📊 Выгрузить два CSV в ~/Downloads/:\n"
        f"1. webmaster.yandex.ru → traveltribe.ru → Поисковые запросы → URL "
        f"https://traveltribe.ru/blog/{slug}/ → 30 дней → CSV → "
        f"`yawebmaster_{slug}_{TODAY}.csv`\n"
        f"2. search.google.com/search-console → Performance → "
        f"Page = https://traveltribe.ru/blog/{slug}/ → 28 дней → CSV → "
        f"`gsc_{slug}_{TODAY}.csv`"
    )


def build_report(posts: list[dict]) -> str:
    by_cat = {}
    for p in posts:
        by_cat.setdefault(p["category"], []).append(p)

    skip_count = len(by_cat.get("SKIP", []))
    actionable = [p for p in posts if p["category"] != "SKIP"]

    lines = [f"*TravelTribe SEO Pulse — {TODAY}*", ""]
    lines.append(f"Всего постов: {len(posts)} | Действий: {len(actionable)}")

    cat_order = ["INDEXATION", "OPTIMIZE", "REFRESH", "ANNUAL", "ARCHIVE"]
    summary = " | ".join(
        f"{cat}: {len(by_cat[cat])}" for cat in cat_order if cat in by_cat
    )
    if summary:
        lines.append(summary)
    lines.append("")

    if not actionable:
        lines.append(f"✅ Все {skip_count} постов <14 дней — действий не требуется.")
        next_skip = sorted(posts, key=lambda p: p["age"], reverse=True)[:3]
        if next_skip:
            lines.append("")
            lines.append("Ближайшие к INDEXATION (потребуют скриншот Я.Вебмастера):")
            for p in next_skip:
                days_left = 14 - p["age"]
                lines.append(f"  • {p['slug']} — через {days_left} дн.")
        return "\n".join(lines)

    for cat in cat_order:
        items = by_cat.get(cat, [])
        if not items:
            continue
        lines.append(f"━━━ {cat} ━━━")
        for p in items:
            lines.append(f"*{p['slug']}* — {p['title']}")
            lines.append(f"Возраст: {p['age']} дней | Дедлайн: пн")
            lines.append(p["action"])
            if cat in ("OPTIMIZE", "REFRESH", "ANNUAL"):
                lines.append(csv_block(p["slug"]))
            lines.append("")

    new_posts = [p for p in posts if p["age"] <= 7]
    if new_posts and len(new_posts) != len(posts):
        lines.append("🆕 Новые на этой неделе:")
        for p in new_posts:
            lines.append(f"  • {p['slug']} ({p['age']} дн.)")

    return "\n".join(lines)


def send_telegram(text: str) -> None:
    token = os.environ.get("TG_BOT_TOKEN")
    chat_id = os.environ.get("TG_CHAT_ID")
    if not token or not chat_id:
        print("ERROR: TG_BOT_TOKEN or TG_CHAT_ID not set", file=sys.stderr)
        sys.exit(1)

    chunks = []
    while text:
        if len(text) <= 4000:
            chunks.append(text)
            break
        cut = text.rfind("\n\n", 0, 4000)
        if cut == -1:
            cut = 4000
        chunks.append(text[:cut])
        text = text[cut:].lstrip()

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    for chunk in chunks:
        for parse_mode in ("Markdown", None):
            data = {"chat_id": chat_id, "text": chunk}
            if parse_mode:
                data["parse_mode"] = parse_mode
            req = urllib.request.Request(
                url,
                data=urllib.parse.urlencode(data).encode(),
                method="POST",
            )
            try:
                with urllib.request.urlopen(req, timeout=15) as resp:
                    body = json.loads(resp.read())
                if body.get("ok"):
                    break
                print(f"Telegram API error: {body}", file=sys.stderr)
            except Exception as e:
                print(f"Telegram send failed ({parse_mode}): {e}", file=sys.stderr)
        else:
            sys.exit(1)


def main() -> None:
    if not BLOG_DIR.exists():
        print(f"Blog dir not found: {BLOG_DIR}", file=sys.stderr)
        sys.exit(1)

    posts = []
    for md in sorted(BLOG_DIR.glob("*.md")):
        fm = parse_frontmatter(md.read_text(encoding="utf-8"))
        pub = fm.get("pubDate")
        if not pub:
            continue
        try:
            pub_date = datetime.strptime(pub, "%Y-%m-%d").date()
        except ValueError:
            continue
        age = (TODAY - pub_date).days
        cat, action = categorize(age)
        posts.append({
            "slug": md.stem,
            "title": fm.get("title", md.stem),
            "pubDate": pub,
            "age": age,
            "category": cat,
            "action": action,
        })

    if not posts:
        print("No posts found", file=sys.stderr)
        sys.exit(1)

    report = build_report(posts)
    print(report)

    PULSE_DIR.mkdir(exist_ok=True)
    (PULSE_DIR / f"{TODAY}.md").write_text(report, encoding="utf-8")

    send_telegram(report)


if __name__ == "__main__":
    main()
