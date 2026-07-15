#!/usr/bin/env python3
"""
SEO Pulse 10/10 — двух-движковый actionable монитор traveltribe.ru.

Делает сам:
- Яндекс.Вебмастер: ИКС, страницы в поиске, показы/клики, движки запросов (WoW).
- Google Search Console: показы/клики/CTR/позиция, ТОП выросших/упавших страниц и
  запросов (этот 7д vs прошлый 7д — два запроса диапазонов, без state-диффа).
- Авто-переобход свежих постов в Яндексе (квота).
- Time-series история (seo-pulse/history.jsonl) для трендов > 1 недели.
- Fail-loud: любой слепой источник + истечение токена Яндекса = явный алерт, не silent.
- Два режима: weekly (полный отчёт по понедельникам) и alert (лёгкий ежедневный —
  шлёт ТОЛЬКО при пробое порога / слепоте мониторинга).

Зависимостей нет (stdlib only). Секреты — из env (GHA) с локальным фолбэком.
"""
from datetime import date, datetime, timedelta
from pathlib import Path
import argparse, json, os, re, subprocess, sys, time, urllib.parse, urllib.request, urllib.error

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
BLOG_DIR = REPO_ROOT / "src" / "content" / "blog"
PULSE_DIR = REPO_ROOT / "seo-pulse"
RADAR_DIR = REPO_ROOT / "radar"
STATE_FILE = PULSE_DIR / "_state.json"
HISTORY_FILE = PULSE_DIR / "history.jsonl"
CONFIG_FILE = PULSE_DIR / "config.json"
TODAY = date.today()
DRY = os.environ.get("PULSE_DRY") == "1"

DEFAULT_CFG = {
    "thresholds": {
        "pages_drop_pct": 8, "sqi_drop_pct": 10, "clicks_drop_pct_wow": 25,
        # striking distance (B1): TRAFFIC-2026 — поз 6-15, шаг вверх = ×2-3 CTR
        "striking_pos_min": 6, "striking_pos_max": 15, "striking_min_impr": 50,
        # zero-click подозрение (B2, канон SERP-first): поз ≤10 — уже неплохо
        # ранжируемся, но кликов почти нет = вероятна SERP-фича (AI-ответ,
        # колдунщик), не проблема сниппета/позиции.
        "zero_click_pos_max": 10, "zero_click_min_impr": 100, "zero_click_ctr_ratio": 0.25,
        # Яндекс: не натягиваем гугловскую CTR-кривую (другой SERP, другое
        # поведение) — просто «почти ноль кликов при decent позиции».
        "zero_click_yandex_max_clicks": 2,
        # watchdog (C5): Radar коммитит отчёты сам по cron — если механизм
        # молча сломается (как уже было раз — scheduled-task исчезла), никто
        # не узнает без независимой проверки отсюда.
        "radar_stale_days": 8,
        # content decay (B3): месячно — медленная эрозия за 28д vs пред. 28д.
        # Ключевой фильтр — ПОКАЗЫ, не клики: клики упали при держащихся показах
        # (≥impr_hold_ratio×пред.) = реальное угасание (сниппет/конкуренты/SERP-
        # фича съели CTR) → рефреш. Клики упали ВМЕСТЕ с показами = сезон кончился
        # (travel-сезонность!), не рефрешить. Квалификация по показам≥min_prev_impr,
        # не по кликам — 10 кликов/28д это шум малых чисел (закон малых чисел).
        "decay_clicks_drop_pct": 30, "decay_min_prev_impr": 100,
        "decay_impr_hold_ratio": 0.8,
        # мягкий пол абс. кликов — глушит однокликовый шум; ровно 5, чтобы потеря
        # ОДНОГО клика (5→4=20%) не пробивала 30%-порог, нужно ≥2 клика вниз.
        # Значимость всё равно держат ПОКАЗЫ (≥min_prev_impr), не клики.
        "decay_min_prev_clicks": 5,
        # запуск раз в ~месяц по состоянию (last_decay_run в _state.json), а не по
        # day<=7 — переживает сбой одного понедельника (иначе месяц теряется).
        "decay_interval_days": 25, "decay_min_site_age_days": 60,
    },
    # первый коммит репозитория (жёсткий пол существования сайта) — decay не гоняем,
    # пока сайту < decay_min_site_age_days, иначе пред. 28д-окно предшествует запуску
    # и математика грязная (сравнение полного окна с частично-пустым).
    "site_launch_date": "2026-04-27",
    # дата выпуска OAuth-токена Яндекса (≈1 год жизни) — для self-check истечения
    "yandex_token_issued": "2026-05-05",
    "host": "https:traveltribe.ru:443",
    "gsc_site": "sc-domain:traveltribe.ru",
    "recrawl_max_age": 30,
    "row_limit": 200,
    "timeouts": {"yandex": 20, "gsc_token": 20, "gsc_query": 25, "telegram": 15},
}


def cfg() -> dict:
    c = json.loads(json.dumps(DEFAULT_CFG))  # deep copy — timeouts/thresholds вложены
    if CONFIG_FILE.exists():
        try:
            override = json.loads(CONFIG_FILE.read_text())
            for k, v in override.items():
                if isinstance(v, dict) and isinstance(c.get(k), dict):
                    c[k].update(v)
                else:
                    c[k] = v
        except Exception:
            pass
    return c


def http_open(req, timeout, attempts=3, backoff=2):
    """Ретрай на сеть/5xx/429 (up to `attempts` раз, экспоненциальный backoff).
    НЕ ретраит прочие 4xx — протухший токен/бэд-реквест не станет валиднее
    от повтора, а должен алертиться сразу, не после 3×timeout ожидания."""
    last_err = None
    for i in range(attempts):
        try:
            return urllib.request.urlopen(req, timeout=timeout)
        except urllib.error.HTTPError as e:
            if e.code == 429 or e.code >= 500:
                last_err = e
            else:
                raise
        except urllib.error.URLError as e:
            last_err = e
        if i < attempts - 1:
            time.sleep(backoff * (i + 1))
    raise last_err


# Ориентировочная кривая органического CTR по позиции — индустриальный
# усреднённый ориентир (десктоп+мобайл смешаны; реальный CTR гуляет по
# вертикали/типу запроса), НЕ измерение конкретно traveltribe.ru. Используется
# только как относительный сигнал приоритизации (striking distance / B2
# zero-click), не как точная цифра для отчётности наружу.
CTR_BENCHMARK = {
    1: 0.28, 2: 0.15, 3: 0.11, 4: 0.08, 5: 0.07,
    6: 0.05, 7: 0.04, 8: 0.03, 9: 0.03, 10: 0.025,
}


def ctr_benchmark(position: float) -> float:
    p = max(1, round(position))
    if p in CTR_BENCHMARK:
        return CTR_BENCHMARK[p]
    if p <= 15:
        return 0.015
    if p <= 20:
        return 0.01
    return 0.005


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


# ─── Яндекс.Вебмастер ────────────────────────────────────────────────────────
def yapi(c: dict, path: str, method="GET", body=None):
    tok = os.environ.get("YANDEX_OAUTH_TOKEN")
    uid = os.environ.get("YANDEX_USER_ID")
    if not tok or not uid:
        return None, "YANDEX_OAUTH_TOKEN/USER_ID не заданы"
    url = f"https://api.webmaster.yandex.net/v4/user/{uid}/hosts/{c['host']}{path}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"OAuth {tok}")
    if data:
        req.add_header("Content-Type", "application/json")
    try:
        with http_open(req, timeout=c["timeouts"]["yandex"]) as r:
            return json.loads(r.read()), None
    except Exception as e:
        return None, str(e)


def fetch_yandex(c: dict) -> dict:
    s, e1 = yapi(c, "/summary/")
    q, e2 = yapi(c, "/search-queries/popular/?order_by=TOTAL_SHOWS&limit=100"
                 "&query_indicator=TOTAL_SHOWS&query_indicator=TOTAL_CLICKS"
                 "&query_indicator=AVG_SHOW_POSITION")
    if s is None and q is None:
        return {"ok": False, "err": e1 or e2}
    s = s or {}
    th = c["thresholds"]
    queries, shows, clicks, striking, zero_click = {}, 0, 0, [], []
    for it in (q or {}).get("queries", []):
        ind = it.get("indicators", {})
        c2 = int(ind.get("TOTAL_CLICKS") or 0)
        sh = int(ind.get("TOTAL_SHOWS") or 0)
        shows += sh
        clicks += c2
        qt = it.get("query_text") or it.get("query_id")
        if qt:
            queries[qt] = c2
        pos = ind.get("AVG_SHOW_POSITION")
        if qt and pos is not None:
            if th["striking_pos_min"] <= pos <= th["striking_pos_max"] and sh >= th["striking_min_impr"]:
                striking.append({"query": qt, "position": round(pos, 1), "shows": sh, "clicks": c2})
            if pos <= th["zero_click_pos_max"] and sh >= th["zero_click_min_impr"] \
                    and c2 <= th["zero_click_yandex_max_clicks"]:
                zero_click.append({"query": qt, "position": round(pos, 1), "shows": sh, "clicks": c2})
    striking.sort(key=lambda x: -x["shows"])
    zero_click.sort(key=lambda x: -x["shows"])
    return {"ok": True, "sqi": s.get("sqi"), "pages": s.get("searchable_pages_count"),
            "shows": shows, "clicks": clicks, "queries": queries,
            "striking": striking[:10], "striking_total": len(striking),
            "zero_click": zero_click[:10], "zero_click_total": len(zero_click)}


def recrawl(c: dict, slug: str):
    r, _ = yapi(c, "/recrawl/queue/", "POST",
                {"url": f"https://traveltribe.ru/blog/{slug}/"})
    return r


# ─── Google Search Console (чистый OAuth refresh + REST, без зависимостей) ────
def gsc_creds():
    cid = os.environ.get("GOOGLE_CLIENT_ID")
    csec = os.environ.get("GOOGLE_CLIENT_SECRET")
    rtok = os.environ.get("GOOGLE_REFRESH_TOKEN")
    if cid and csec and rtok:
        return cid, csec, rtok, "env"
    local = Path.home() / ".config" / "gsc" / "credentials.json"
    if local.exists():
        try:
            d = json.loads(local.read_text())
            return d["client_id"], d["client_secret"], d["refresh_token"], "local"
        except Exception:
            pass
    return None, None, None, None


def gsc_token(c: dict):
    cid, csec, rtok, src = gsc_creds()
    if not cid:
        return None, "GSC не настроен (нет GOOGLE_* секретов и ~/.config/gsc)"
    body = urllib.parse.urlencode({
        "client_id": cid, "client_secret": csec,
        "refresh_token": rtok, "grant_type": "refresh_token"}).encode()
    try:
        req = urllib.request.Request("https://oauth2.googleapis.com/token",
                                     data=body, method="POST")
        with http_open(req, timeout=c["timeouts"]["gsc_token"]) as r:
            return json.loads(r.read())["access_token"], None
    except urllib.error.HTTPError as e:
        # Тело ошибки несёт причину (invalid_grant = токен протух/отозван;
        # invalid_client = неверный client_id/secret) — без него алерт бесполезен.
        try:
            detail = json.loads(e.read().decode())
            reason = detail.get("error", "")
            hint = " — перевыпусти токен: python3 ~/.config/gsc/grant.py + Publish App в GCC" if reason == "invalid_grant" else ""
            return None, f"GSC refresh {e.code}: {reason} {detail.get('error_description','')}{hint}"
        except Exception:
            return None, f"GSC refresh failed: HTTP {e.code}"
    except Exception as e:
        return None, f"GSC refresh failed: {e}"


def gsc_query(c: dict, token, start, end, dims):
    site = urllib.parse.quote(c["gsc_site"], safe="")
    url = f"https://searchconsole.googleapis.com/webmasters/v3/sites/{site}/searchAnalytics/query"
    body = json.dumps({"startDate": start.isoformat(), "endDate": end.isoformat(),
                        "dimensions": dims, "rowLimit": c["row_limit"]}).encode()
    req = urllib.request.Request(url, data=body, method="POST")
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Content-Type", "application/json")
    try:
        with http_open(req, timeout=c["timeouts"]["gsc_query"]) as r:
            return json.loads(r.read()).get("rows", []), None
    except Exception as e:
        return None, str(e)


def fetch_gsc(c: dict, decay: bool = False) -> dict:
    token, err = gsc_token(c)
    if not token:
        return {"ok": False, "err": err}
    end = TODAY - timedelta(days=2)          # лаг GSC 2 дня
    cur0, cur1 = end - timedelta(days=6), end
    prev0, prev1 = end - timedelta(days=13), end - timedelta(days=7)

    def totals(rows):
        i = sum(r["impressions"] for r in rows)
        c = sum(r["clicks"] for r in rows)
        return i, c

    tot_cur, e1 = gsc_query(c, token, cur0, cur1, [])
    if tot_cur is None:
        return {"ok": False, "err": e1}
    tc = tot_cur[0] if tot_cur else {}
    # Прошлый 7д-период тем же необрезанным (без dims) запросом — точный тотал,
    # не сумма по top-N страниц/запросов. Даёт alert-режиму свежую WoW-базу без
    # зависимости от _state.json (тот пишется только по понедельникам).
    tot_prev, _ = gsc_query(c, token, prev0, prev1, [])
    tp = tot_prev[0] if tot_prev else {}
    pg_cur, _ = gsc_query(c, token, cur0, cur1, ["page"])
    pg_prev, _ = gsc_query(c, token, prev0, prev1, ["page"])
    q_cur, _ = gsc_query(c, token, cur0, cur1, ["query"])
    q_prev, _ = gsc_query(c, token, prev0, prev1, ["query"])
    # page+query вместе — нужен URL конкретного запроса для striking distance (B1),
    # чистый ["query"] выше даёт только агрегат по всем страницам сразу.
    pgq_cur, _ = gsc_query(c, token, cur0, cur1, ["page", "query"])

    def movers(cur, prev, key_clean):
        pv = {r["keys"][0]: r for r in (prev or [])}
        out = []
        for r in (cur or []):
            k = r["keys"][0]
            d = r["clicks"] - pv.get(k, {}).get("clicks", 0)
            if abs(d) >= 1:
                out.append((key_clean(k), round(d), round(r["clicks"]),
                            round(r["position"], 1)))
        up = [x for x in sorted(out, key=lambda x: -x[1]) if x[1] > 0][:5]
        down = [x for x in sorted(out, key=lambda x: x[1]) if x[1] < 0][:5]
        return up, down

    pclean = lambda u: u.replace("https://traveltribe.ru", "") or "/"
    qclean = lambda q: q

    # Striking distance (B1): поз 6-15 с показами≥порога, сортировка по потенциалу
    # клика при выходе в топ-3 — impressions × (ctr_benchmark(3) − текущий ctr).
    # Zero-click (B2, канон SERP-first): поз ≤10, показы≥порога, но CTR аномально
    # ниже ожидаемого для этой позиции — вероятна SERP-фича (AI Overview/сниппет),
    # не проблема сниппета. Один проход по pgq_cur на оба сигнала.
    th = c["thresholds"]
    striking, zero_click = [], []
    for r in (pgq_cur or []):
        pos, impr = r["position"], r["impressions"]
        ctr = r["clicks"] / impr if impr else 0
        page, query = r["keys"]
        if th["striking_pos_min"] <= pos <= th["striking_pos_max"] and impr >= th["striking_min_impr"]:
            potential = impr * max(0, ctr_benchmark(3) - ctr)
            striking.append({"query": qclean(query), "page": pclean(page), "position": round(pos, 1),
                              "impressions": impr, "ctr": round(ctr * 100, 2), "potential": round(potential, 1)})
        if pos <= th["zero_click_pos_max"] and impr >= th["zero_click_min_impr"] \
                and ctr < th["zero_click_ctr_ratio"] * ctr_benchmark(pos):
            zero_click.append({"query": qclean(query), "page": pclean(page), "position": round(pos, 1),
                                "impressions": impr, "ctr": round(ctr * 100, 2),
                                "benchmark": round(ctr_benchmark(pos) * 100, 2)})
    striking.sort(key=lambda x: -x["potential"])
    zero_click.sort(key=lambda x: -x["impressions"])

    # Content decay (B3, месячно): 28д vs пред. 28д по страницам. Кандидат на
    # рефреш = клики просели ≥порога ПРИ держащихся показах (иначе сезонность).
    decay_cand, decay_ran = [], False
    if decay:
        d_cur, e_cur = gsc_query(c, token, end - timedelta(days=27), end, ["page"])
        d_prev, e_prev = gsc_query(c, token, end - timedelta(days=55), end - timedelta(days=28), ["page"])
        # decay_ran=True только если ОБА запроса реально вернули данные (None = сбой
        # сети/5xx). Иначе пустой decay_cand неотличим от «ничего не просело» — и
        # вызывающий по ошибке продвинет last_decay_run, потеряв месяц (баг из ревью).
        decay_ran = d_cur is not None and d_prev is not None
        prevmap = {r["keys"][0]: r for r in (d_prev or [])}
        for r in (d_cur or []):
            pv = prevmap.get(r["keys"][0])
            if not pv:
                continue
            pc, cc = pv["clicks"], r["clicks"]
            pi, ci = pv["impressions"], r["impressions"]
            if pi < th["decay_min_prev_impr"] or pc < th["decay_min_prev_clicks"] or pc <= 0:
                continue
            drop = (pc - cc) / pc
            impr_held = ci >= th["decay_impr_hold_ratio"] * pi
            if drop >= th["decay_clicks_drop_pct"] / 100 and impr_held:
                decay_cand.append({
                    "page": pclean(r["keys"][0]),
                    "clicks_prev": round(pc), "clicks_cur": round(cc),
                    "drop_pct": round(drop * 100),
                    "impr_cur": round(ci), "impr_prev": round(pi),
                    "pos_prev": round(pv["position"], 1), "pos_cur": round(r["position"], 1),
                })
        decay_cand.sort(key=lambda x: -(x["clicks_prev"] - x["clicks_cur"]))  # по объёму потери

    return {
        "ok": True,
        "impr": round(tc.get("impressions", 0)),
        "clicks": round(tc.get("clicks", 0)),
        "clicks_prev": round(tp.get("clicks", 0)),
        "ctr": round(tc.get("ctr", 0) * 100, 2),
        "pos": round(tc.get("position", 0), 1),
        "pages_up": movers(pg_cur, pg_prev, pclean)[0],
        "pages_down": movers(pg_cur, pg_prev, pclean)[1],
        "q_up": movers(q_cur, q_prev, qclean)[0],
        "q_down": movers(q_cur, q_prev, qclean)[1],
        "striking": striking[:10],
        "striking_total": len(striking),
        "zero_click": zero_click[:10],
        "zero_click_total": len(zero_click),
        "decay": decay_cand[:8],
        "decay_total": len(decay_cand),
        "decay_ran": decay_ran,
    }


# ─── утилиты ─────────────────────────────────────────────────────────────────
def arrow(cur, prev):
    if cur is None or prev is None:
        return ""
    d = cur - prev
    if d == 0:
        return " (→0)"
    return f" ({'▲' if d > 0 else '▼'}{abs(round(d))})"


def q_movers_yandex(cur: dict, prev: dict):
    if not cur or not prev:
        return [], []
    diff = [(k, cur[k] - prev.get(k, 0), cur[k]) for k in cur]
    up = sorted([d for d in diff if d[1] > 0], key=lambda x: -x[1])[:5]
    down = sorted([d for d in diff if d[1] < 0], key=lambda x: x[1])[:5]
    return up, down


def load_state() -> dict:
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text())
        except Exception:
            return {}
    return {}


def token_expiry_warn(c) -> str:
    try:
        issued = datetime.strptime(c["yandex_token_issued"], "%Y-%m-%d").date()
        left = 365 - (TODAY - issued).days
        if left <= 30:
            return (f"🔑 Токен Яндекса истекает через ~{left} дн "
                    f"(выдан {issued}) — перевыпусти, иначе монитор ослепнет")
    except Exception:
        pass
    return ""


def radar_watchdog(c) -> str:
    """Dead-man switch на Quality Radar: тот сам коммитит отчёты по своему cron,
    но если механизм молча сломается (уже было раз — scheduled-task исчезла
    без следа, Radar молчал 2 недели прежде чем кто-то заметил) — независимая
    проверка отсюда должна это поймать.

    Дата — из git log, НЕ mtime файла: свежий checkout в CI сбрасывает mtime
    на момент чекаута, а не на момент коммита — по mtime watchdog был бы вечно
    зелёным вне зависимости от реальной свежести."""
    try:
        out = subprocess.run(
            ["git", "log", "-1", "--format=%cI", "--", "radar/RADAR-*.md"],
            cwd=REPO_ROOT, capture_output=True, text=True, timeout=10,
        )
        if out.returncode != 0:
            print(f"radar_watchdog: git log вернул {out.returncode}: {out.stderr.strip()}", file=sys.stderr)
        ts = out.stdout.strip()
    except Exception as e:
        print(f"radar_watchdog: git недоступен: {e}", file=sys.stderr)
        return ""  # не алертить на пустом месте
    if not ts:
        if RADAR_DIR.exists() and (RADAR_DIR / "SKILL.md").exists():
            return "📡 Radar: скилл есть, но ни одного отчёта в git-истории ещё нет — проверь, отработал ли первый прогон quality-radar.yml"
        return ""  # Radar ещё не подключён к репо — рано алертить
    try:
        last = datetime.fromisoformat(ts).date()
    except ValueError:
        return ""
    days = (TODAY - last).days
    if days > c["thresholds"]["radar_stale_days"]:
        return f"📡 Radar молчит {days} дн. (последний отчёт {last}) — проверь workflow quality-radar.yml"
    return ""


# ─── режимы ──────────────────────────────────────────────────────────────────
def collect_posts():
    posts = []
    for md in sorted(BLOG_DIR.glob("*.md")) + sorted(BLOG_DIR.glob("*.mdx")):
        fm = parse_frontmatter(md.read_text(encoding="utf-8"))
        pub = fm.get("pubDate")
        if not pub:
            continue
        try:
            age = (TODAY - datetime.strptime(pub, "%Y-%m-%d").date()).days
        except ValueError:
            continue
        posts.append({"slug": md.stem, "age": age})
    return posts


def alert_mode(c) -> None:
    """Лёгкий ежедневный: только summary, шлёт ТОЛЬКО при проблеме.

    Google-клики сравниваются со свежим прошлым 7д-окном из самого API
    (fetch_gsc → clicks_prev), не из _state.json — тот пишется только по
    понедельникам, поэтому вт-вс сверялись бы с недельной давности снимком
    вместо вчерашнего. Яндекс (pages/ИКС) сравнивается с последним недельным
    снимком осознанно — эти метрики двигаются медленно, а у API Вебмастера
    нет своего диапазонного запроса для честного rolling-сравнения."""
    y = fetch_yandex(c)
    g = fetch_gsc(c)
    prev = load_state()
    th = c["thresholds"]
    alerts = []

    if not y["ok"]:
        alerts.append(f"⚠️ Я.Вебмастер слеп: {y['err']}")
    else:
        pp, sp = prev.get("pages"), prev.get("sqi")
        if pp and y["pages"] is not None and y["pages"] < pp * (1 - th["pages_drop_pct"] / 100):
            alerts.append(f"🔻 Страницы в поиске: {pp} → {y['pages']} "
                          f"(−{round((1-y['pages']/pp)*100)}%)")
        if sp and y["sqi"] is not None and y["sqi"] < sp * (1 - th["sqi_drop_pct"] / 100):
            alerts.append(f"🔻 ИКС: {sp} → {y['sqi']}")
    if not g["ok"]:
        alerts.append(f"⚠️ GSC слеп: {g['err']}")
    else:
        pc = g.get("clicks_prev")
        if pc and g["clicks"] < pc * (1 - th["clicks_drop_pct_wow"] / 100):
            alerts.append(f"🔻 Google клики 7д: {pc} → {g['clicks']} "
                          f"(−{round((1-g['clicks']/pc)*100)}%)")
    w = token_expiry_warn(c)
    if w:
        alerts.append(w)

    if not alerts:
        print("alert-mode: всё в норме, тишина")
        return
    msg = f"*⚠️ TravelTribe SEO ALERT — {TODAY}*\n\n" + "\n".join(alerts)
    print(msg)
    if not DRY:
        send_telegram(c, msg)


def weekly_mode(c) -> None:
    posts = collect_posts()
    prev = load_state()
    # Content decay (B3) — месячно по СОСТОЯНИЮ (устойчиво к сбою одного Пн, иначе
    # месяц теряется): гоняем если с прошлого decay-прогона прошло ≥ interval дней
    # И сайту ≥ min_site_age. DRY всегда гоняет — чтобы секция была видна на тесте.
    th = c["thresholds"]
    last_decay = prev.get("last_decay_run")
    # fromisoformat строгий — битая дата (ручная правка _state.json / кривой конфиг)
    # иначе уронила бы ВЕСЬ отчёт, не только decay. Битый last_decay → форс-запуск
    # (безвредно, decay идемпотентен); битый launch_date → age=-1 → decay пропущен
    # (безопаснее форса на возможно-молодом сайте), но отчёт живёт.
    try:
        days_since_decay = (TODAY - date.fromisoformat(last_decay)).days if last_decay else 10**6
    except ValueError:
        days_since_decay = 10**6
    try:
        site_age = (TODAY - date.fromisoformat(c["site_launch_date"])).days
    except (ValueError, KeyError):
        site_age = -1
    run_decay = DRY or (days_since_decay >= th["decay_interval_days"]
                        and site_age >= th["decay_min_site_age_days"])
    y = fetch_yandex(c)
    g = fetch_gsc(c, decay=run_decay)

    # авто-переобход
    fresh = [p for p in posts if p["age"] <= c["recrawl_max_age"]]
    recrawled, quota = [], None
    for p in fresh:
        if DRY:
            recrawled.append(p["slug"]); continue
        r = recrawl(c, p["slug"])
        if r and "task_id" in r:
            recrawled.append(p["slug"])
            quota = r.get("quota_remainder", quota)

    L = [f"*TravelTribe SEO Pulse — {TODAY}*", ""]

    # Яндекс
    if y["ok"]:
        L.append(f"🔸 *Яндекс* — страницы {y['pages']}{arrow(y['pages'], prev.get('pages'))}  "
                 f"ИКС {y['sqi']}{arrow(y['sqi'], prev.get('sqi'))}")
        L.append(f"   показы 7д {y['shows']}{arrow(y['shows'], prev.get('shows'))}  "
                 f"клики {y['clicks']}{arrow(y['clicks'], prev.get('clicks'))}")
        up, down = q_movers_yandex(y["queries"], prev.get("y_queries", {}))
        if up:
            L.append("   🔺 " + ", ".join(f"{k} +{d}" for k, d, _ in up[:3]))
        if down:
            L.append("   🔻 " + ", ".join(f"{k} {d}" for k, d, _ in down[:3]))
    else:
        L.append(f"⚠️ *Яндекс слеп*: {y['err']}")

    # Google
    if g["ok"]:
        L.append(f"🔹 *Google* — клики 7д {g['clicks']}{arrow(g['clicks'], prev.get('g_clicks'))}  "
                 f"показы {g['impr']}{arrow(g['impr'], prev.get('g_impr'))}  "
                 f"CTR {g['ctr']}%  поз {g['pos']}")
        if g["pages_up"]:
            L.append("   🔺 стр: " + ", ".join(f"{p} +{d}" for p, d, _, _ in g["pages_up"][:3]))
        if g["pages_down"]:
            L.append("   🔻 стр: " + ", ".join(f"{p} {d}" for p, d, _, _ in g["pages_down"][:3]))
        if g["q_down"]:
            L.append("   🔻 запросы: " + ", ".join(f"{q} {d}" for q, d, _, _ in g["q_down"][:3]))
    else:
        L.append(f"⚠️ *Google слеп*: {g['err']}")

    # Striking distance (B1): поз 6-15 — шаг вверх в топ-3 = ×2-3 CTR (TRAFFIC-2026)
    strk_g = g.get("striking", []) if g["ok"] else []
    strk_y = y.get("striking", []) if y["ok"] else []
    if strk_g or strk_y:
        L += ["", "━━━ 🎯 Striking distance (поз 6-15) ━━━"]
        for s in strk_g[:3]:
            L.append(f"• G: «{s['query']}» {s['page']} — поз {s['position']}, "
                     f"показы {s['impressions']}, CTR {s['ctr']}%")
        for s in strk_y[:3]:
            L.append(f"• Я: «{s['query']}» — поз {s['position']}, показы {s['shows']}")
    else:
        L += ["", "🎯 Striking distance: кандидатов нет (поз 6-15, показы≥"
                   f"{c['thresholds']['striking_min_impr']})."]

    # Zero-click подозрение (B2): позиция хорошая, кликов почти нет —
    # вероятна SERP-фича (AI Overview/Нейро/колдунщик), не проблема сниппета.
    zc_g = g.get("zero_click", []) if g["ok"] else []
    zc_y = y.get("zero_click", []) if y["ok"] else []
    if zc_g or zc_y:
        L += ["", "━━━ 🚫 Zero-click подозрение (поз ≤10, CTR аномально низкий) ━━━"]
        for s in zc_g[:3]:
            L.append(f"• G: «{s['query']}» {s['page']} — поз {s['position']}, "
                     f"показы {s['impressions']}, CTR {s['ctr']}% (ориентир ~{s['benchmark']}%)")
        for s in zc_y[:3]:
            L.append(f"• Я: «{s['query']}» — поз {s['position']}, показы {s['shows']}, "
                     f"кликов {s['clicks']}")
        L.append("  → переписать title/сниппет бесполезно если это SERP-фича — "
                 "смотреть живую выдачу, пивот на неопределяемые AI интенты")
    else:
        L += ["", "🚫 Zero-click: аномалий нет (поз≤10, показы≥"
                   f"{c['thresholds']['zero_click_min_impr']})."]

    # Content decay (B3): показывается только в decay-прогон (≈раз в месяц) —
    # в обычные недели секции нет вовсе, чтобы не шуметь.
    if run_decay and g["ok"]:
        dec = g.get("decay", [])
        if dec:
            L += ["", "━━━ 📉 Content decay (28д, кандидаты на рефреш) ━━━"]
            for d in dec[:5]:
                L.append(f"• {d['page']} — клики {d['clicks_prev']}→{d['clicks_cur']} "
                         f"(−{d['drop_pct']}%), показы держатся {d['impr_cur']}, "
                         f"поз {d['pos_prev']}→{d['pos_cur']}")
            L.append("  → показы есть, клики ушли: обновить текст/факты, освежить дату публикации")
        else:
            L += ["", "📉 Content decay: просевших страниц нет (28д, показы≥"
                       f"{th['decay_min_prev_impr']}, клики −{th['decay_clicks_drop_pct']}%+)."]

    if recrawled:
        qn = f", квота {quota}" if quota is not None else ""
        L.append(f"♻️ Авто-переобход: {len(recrawled)} постов ✅{qn}")
    new = [p for p in posts if p["age"] <= 7]
    if new:
        L.append("🆕 " + ", ".join(f"{p['slug']} ({p['age']}д)" for p in new))

    w = token_expiry_warn(c)
    if w:
        L += ["", w]
    rw = radar_watchdog(c)
    if rw:
        L += ["", rw]
    pending = [p for p in fresh if 14 <= p["age"] <= c["recrawl_max_age"]]
    if pending:
        L += ["", "━━━ Проверить вручную ━━━"]
        for p in pending:
            L.append(f"• {p['slug']} ({p['age']}д) — переобход отправлен, "
                     f"свериться: Вебмастер «Страницы в поиске» / GSC Inspect")
    else:
        L += ["", "Ручных действий нет — всё на автоматике."]

    # Дорожная карта: датированные чекпоинты — нудж когда срок пришёл и не done
    due = [r for r in c.get("roadmap", [])
           if not r.get("done") and str(r.get("date", "9999")) <= str(TODAY)]
    if due:
        L += ["", "━━━ 📍 ДОРОЖНАЯ КАРТА — пора ━━━"]
        for r in due:
            L.append(f"• {r.get('label','')}")
            L.append(f"  ▶ {r.get('prompt','')}")
        L.append('  (сделано → в seo-pulse/config.json у пункта "done": true)')

    report = "\n".join(L)
    print(report)
    if DRY:
        return

    PULSE_DIR.mkdir(exist_ok=True)
    (PULSE_DIR / f"{TODAY}.md").write_text(report, encoding="utf-8")
    snap = {"date": str(TODAY)}
    if y["ok"]:
        snap.update(sqi=y["sqi"], pages=y["pages"], shows=y["shows"],
                    clicks=y["clicks"], y_queries=y["queries"])
    if g["ok"]:
        snap.update(g_clicks=g["clicks"], g_impr=g["impr"], g_ctr=g["ctr"], g_pos=g["pos"])
    # Полные счётчики, НЕ len(strk_g)+len(strk_y) — те обрезаны до топ-10 каждый
    # для отчёта; тренд в history.jsonl должен видеть реальный объём.
    snap["striking_count"] = (g.get("striking_total", 0) if g["ok"] else 0) + \
                              (y.get("striking_total", 0) if y["ok"] else 0)
    snap["zero_click_count"] = (g.get("zero_click_total", 0) if g["ok"] else 0) + \
                                (y.get("zero_click_total", 0) if y["ok"] else 0)
    # last_decay_run: продвигаем ТОЛЬКО если decay реально отработал по живым данным
    # — g["ok"] И оба GSC-запроса decay вернули данные (decay_ran). Иначе сетевой
    # сбой на decay-запросах молча сдвинул бы дату на месяц вперёд без данных.
    # На прочих неделях переносим прежнюю дату, иначе интервал собьётся.
    snap["last_decay_run"] = str(TODAY) if (run_decay and g["ok"] and g.get("decay_ran")) else last_decay
    STATE_FILE.write_text(json.dumps(snap, ensure_ascii=False), encoding="utf-8")
    hist = {"date": str(TODAY)}
    hist.update({k: snap.get(k) for k in
                 ("sqi", "pages", "shows", "clicks", "g_clicks", "g_impr", "g_ctr", "g_pos",
                  "striking_count", "zero_click_count")})
    with HISTORY_FILE.open("a", encoding="utf-8") as f:
        f.write(json.dumps(hist, ensure_ascii=False) + "\n")
    send_telegram(c, report)


def send_telegram(c: dict, text: str) -> None:
    token = os.environ.get("TG_BOT_TOKEN")
    chat_id = os.environ.get("TG_CHAT_ID")
    if not token or not chat_id:
        print("ERROR: TG secrets not set", file=sys.stderr)
        sys.exit(1)
    chunks = []
    while text:
        if len(text) <= 4000:
            chunks.append(text); break
        cut = text.rfind("\n", 0, 4000)
        cut = cut if cut != -1 else 4000
        chunks.append(text[:cut]); text = text[cut:].lstrip()
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    for chunk in chunks:
        for pm in ("Markdown", None):
            d = {"chat_id": chat_id, "text": chunk}
            if pm:
                d["parse_mode"] = pm
            try:
                req = urllib.request.Request(
                    url, data=urllib.parse.urlencode(d).encode(), method="POST")
                with http_open(req, timeout=c["timeouts"]["telegram"]) as resp:
                    if json.loads(resp.read()).get("ok"):
                        break
            except Exception as e:
                print(f"TG {pm}: {e}", file=sys.stderr)
        else:
            sys.exit(1)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", choices=["weekly", "alert"], default="weekly")
    mode = ap.parse_args().mode
    c = cfg()
    if mode == "alert":
        alert_mode(c)
    else:
        weekly_mode(c)


if __name__ == "__main__":
    main()
