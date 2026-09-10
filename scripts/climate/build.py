#!/usr/bin/env python3
"""Собрать src/data/country-climate-chart.js из страниц climatestotravel.com.

Города выбраны руками (scripts/climate/cities.js) — см. предупреждение в том файле.
Здесь только разбор таблиц и запись. Ни одного числа руками.

Запуск:  python3 scripts/climate/build.py <каталог со страницами> [--check]
  --check  ничего не пишет, только сверяет, что все названные города найдены.

Оракул разбора — на Омане: числа обязаны совпасть с ручной сверкой 08-09.09.2026.
"""
import io, json, os, subprocess, sys, datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from parse import parse

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = 'https://www.climatestotravel.com/climate/'

def cities_map():
    out = subprocess.run(['node', '--input-type=module', '-e',
        "import {CHART_CITIES, NO_CHART} from './scripts/climate/cities.js';"
        "console.log(JSON.stringify({CHART_CITIES, NO_CHART}))"],
        cwd=ROOT, capture_output=True, text=True, check=True).stdout
    return json.loads(out)

def build(pages_dir, check_only=False):
    m = cities_map()
    checked = datetime.date.today().isoformat()
    out, missing = {}, []
    for slug, wanted in m['CHART_CITIES'].items():
        f = os.path.join(pages_dir, slug + '.html')
        if not os.path.exists(f):
            missing.append(f'{slug}: страница не скачана'); continue
        got = parse(io.open(f, encoding='utf-8', errors='replace').read())
        cities = []
        for name, ru, role in wanted:
            c = got.get(name)
            if not c or 'rainDays' not in c:
                missing.append(f'{slug}: «{name}» не найден на странице (есть: {", ".join(list(got)[:6])})')
                continue
            row = {'name': ru, 'role': role,
                   'tMax': [round(x, 1) for x in c['tMax']],
                   'rainDays': c['rainDays']}
            if 'sea' in c: row['sea'] = c['sea']
            cities.append(row)
        if not cities: continue
        # Нижняя панель — дожди того города, ради погоды которого возникает вопрос:
        # берём тот, у кого разброс дождей по месяцам больше.
        rain_of = max(range(len(cities)), key=lambda i: max(cities[i]['rainDays']) - min(cities[i]['rainDays']))
        out[slug] = {'cities': cities, 'rainOf': rain_of,
                     'source': {'name': 'Climates to Travel', 'url': SRC + slug_page(slug), 'checked': checked}}
    return out, missing

def slug_page(slug):
    for line in io.open(os.path.join(ROOT, 'scripts/climate/pages.txt'), encoding='utf-8'):
        s, _, p = line.strip().partition('|')
        if s == slug: return p
    return slug

if __name__ == '__main__':
    pages = sys.argv[1]
    data, missing = build(pages, '--check' in sys.argv)
    for x in missing: print('  ✖', x)
    print(f'направлений с графиком: {len(data)}; не найдено городов: {len(missing)}')
    if '--check' in sys.argv: sys.exit(1 if missing else 0)
    if missing: print('⛔ есть ненайденные города — файл не переписан'); sys.exit(1)
    json.dump(data, io.open(os.path.join(ROOT, 'scripts/climate/chart.generated.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)
    print('записано в scripts/climate/chart.generated.json')
