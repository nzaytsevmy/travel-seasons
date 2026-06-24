#!/usr/bin/env python3
"""Замер эффекта SEO-правок (before/after). Запуск: python3 seo-audit/measure.py
Снимает GSC (query×page, 28 дн) + Я.Вебмастер (popular top-500) по целевым запросам/страницам,
сохраняет датированный снимок в seo-audit/measure/ и сравнивает с предыдущим снимком.
Запустить СЕЙЧАС (baseline «до») и через 2-4 недели («после»)."""
import sys, os, json, glob, urllib.request
from pathlib import Path
from datetime import date, timedelta

sys.path.insert(0, str(Path.home() / ".config" / "gsc"))
import gsc  # noqa: E402

# Целевые запросы правок этой сессии (substring-матч, формулировки варьируются)
TARGET_Q = [
    "абхазия 2026 стоит ли ехать", "безопасно ли ехать в абхазию", "нужен ли загранпаспорт в абхазию",
    "грузия без франшизы", "грузия с франшизой", "отдых в грузии 2026", "грузия франшиза штраф 300",
    "ees", "ees проверить визу",
    "куда поехать с ребенком на море", "куда поехать с ребёнком на море", "что взять на море",
]
TARGET_PAGES = [
    "/blog/abkhazia-2026/", "/blog/ees-2026/", "/blog/georgia-insurance-2026/",
    "/blog/georgia-guide-2026/", "/blog/kuda-na-more-s-rebenkom-2026/", "/blog/chto-vzyat-na-more-2026/",
]


def yandex_token():
    # Keychain-first (macOS), fallback на secrets.env
    try:
        import keyring
        v = keyring.get_password("tt-secrets", "YANDEX_OAUTH_TOKEN")
        if v:
            return v
    except Exception:
        pass
    p = Path.home() / ".config" / "tt" / "secrets.env"
    if p.exists():
        for line in open(p):
            if line.startswith("YANDEX_OAUTH_TOKEN"):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise RuntimeError("YANDEX_OAUTH_TOKEN не найден (Keychain/secrets.env)")


def pull_gsc():
    svc = gsc.get_service()
    end = date.today(); start = end - timedelta(days=28)
    rows = svc.searchanalytics().query(siteUrl=gsc.SITE, body={
        "startDate": str(start), "endDate": str(end),
        "dimensions": ["query", "page"], "rowLimit": 2000,
    }).execute().get("rows", [])
    return rows


def pull_yandex():
    tok = yandex_token()
    base = "https://api.webmaster.yandex.net/v4/user/1861674985/hosts/https:traveltribe.ru:443"
    url = (base + "/search-queries/popular/?order_by=TOTAL_SHOWS"
           "&query_indicator=TOTAL_SHOWS&query_indicator=TOTAL_CLICKS"
           "&query_indicator=AVG_SHOW_POSITION&limit=500")
    req = urllib.request.Request(url, headers={"Authorization": "OAuth " + tok})
    return json.load(urllib.request.urlopen(req, timeout=40)).get("queries", [])


def snapshot():
    gsc_rows = pull_gsc()
    yw = pull_yandex()
    # GSC: агрегируем по целевым запросам и страницам
    g_q = {}
    for r in gsc_rows:
        q, p = r["keys"]
        if any(t in q.lower() for t in TARGET_Q):
            a = g_q.setdefault(q, {"imp": 0, "clicks": 0, "pos": []})
            a["imp"] += r["impressions"]; a["clicks"] += r["clicks"]; a["pos"].append(r["position"])
    for q in g_q:
        g_q[q]["pos"] = round(sum(g_q[q]["pos"]) / len(g_q[q]["pos"]), 1)
    g_pages = {}
    for r in gsc_rows:
        p = r["keys"][1].replace("https://traveltribe.ru", "")
        if p in TARGET_PAGES:
            a = g_pages.setdefault(p, {"imp": 0, "clicks": 0})
            a["imp"] += r["impressions"]; a["clicks"] += r["clicks"]
    # Яндекс: целевые запросы
    y_q = {}
    for q in yw:
        t = q["query_text"]
        if any(tt in t.lower() for tt in TARGET_Q):
            i = q["indicators"]
            y_q[t] = {"shows": i.get("TOTAL_SHOWS") or 0, "clicks": i.get("TOTAL_CLICKS") or 0,
                      "pos": round(i.get("AVG_SHOW_POSITION") or 0, 1)}
    return {"date": str(date.today()), "gsc_queries": g_q, "gsc_pages": g_pages, "yandex_queries": y_q}


def main():
    out = Path("seo-audit/measure"); out.mkdir(parents=True, exist_ok=True)
    snap = snapshot()
    f = out / f"snap-{snap['date']}.json"
    json.dump(snap, open(f, "w"), ensure_ascii=False, indent=1)
    print(f"снимок сохранён: {f}\n")

    print("=== GSC целевые страницы (показы/клики, 28 дн) ===")
    for p, m in sorted(snap["gsc_pages"].items(), key=lambda x: -x[1]["imp"]):
        print(f"  {m['imp']:5} показ {m['clicks']:3} кл  {p}")
    print("\n=== Яндекс целевые запросы (показы/клики/поз) ===")
    for q, m in sorted(snap["yandex_queries"].items(), key=lambda x: -x[1]["shows"])[:15]:
        print(f"  {m['shows']:5.0f} показ {m['clicks']:.0f} кл поз{m['pos']:4.1f}  {q}")

    # сравнение с предыдущим снимком
    prior = sorted(glob.glob(str(out / "snap-*.json")))
    prior = [p for p in prior if not p.endswith(f"snap-{snap['date']}.json")]
    if prior:
        old = json.load(open(prior[-1]))
        print(f"\n=== Δ vs {old['date']} (целевые страницы, показы / клики) ===")
        for p in TARGET_PAGES:
            n = snap["gsc_pages"].get(p, {"imp": 0, "clicks": 0})
            o = old["gsc_pages"].get(p, {"imp": 0, "clicks": 0})
            di, dc = n["imp"] - o["imp"], n["clicks"] - o["clicks"]
            print(f"  {p:42} показы {o['imp']:4}→{n['imp']:4} ({di:+}) | клики {o['clicks']:3}→{n['clicks']:3} ({dc:+})")
    else:
        print("\n(предыдущего снимка нет — это baseline «до». Запусти снова через 2-4 нед для «после».)")


if __name__ == "__main__":
    main()
