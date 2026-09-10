# Разбор страницы climatestotravel.com: по каждому городу дневной максимум,
# дни с осадками и температура воды по месяцам.
#
# Оракул: на Омане разбор обязан повторить числа, сверенные руками 08-09.09.2026.
#
# Две ловушки, на которых он уже ломался (09.09.2026):
#  1. Имя города и вид таблицы живут в <caption>, а не в первых знаках разметки:
#     у таблицы моря подписи внутри тела нет, срез ловил заголовок колонки.
#  2. У источника попадаются битые ячейки: в ноябре у моря Маската стоит 27.5">.
#     Строгая сверка текста молча роняла ВЕСЬ ряд города. Значение берём из
#     атрибута data-celsius, текст — запасной путь.
import re, sys, io, json
M = ['January','February','March','April','May','June','July','August','September','October','November','December']

def tables(html):
    for tb in re.findall(r'<table.*?</table>', html, re.S):
        cap = re.search(r'<caption[^>]*>(.*?)</caption>', tb, re.S)
        if not cap: continue
        head = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', cap.group(1))).strip()
        rows = []
        for r in re.findall(r'<tr.*?</tr>', tb, re.S):
            cells = re.findall(r'<t[dh][^>]*>.*?</t[dh]>', r, re.S)
            if cells: rows.append(cells)
        yield head, rows

def text(cell):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', cell)).strip()

def number(cell):
    a = re.search(r'data-(?:celsius|mm|days|value)="(-?\d+(?:\.\d+)?)"', cell)
    if a: return float(a.group(1))
    m = re.search(r'-?\d+(?:\.\d+)?', text(cell).replace('−', '-').replace(',', '.'))
    return float(m.group(0)) if m else None

def by_month(rows, col):
    out = {}
    for cells in rows:
        m = text(cells[0])
        if m in M and len(cells) > col:
            v = number(cells[col])
            if v is not None: out[m] = v
    if len(out) == 12: return [out[m] for m in M]
    return None

def parse(html):
    cities = {}
    for head, rows in tables(html):
        name = re.split(r'\s+-\s+', head)[0].strip()
        if not name or len(name) > 40: continue
        low = head.lower()
        hdr = next((r for r in rows if text(r[0]) == 'Month'), None)
        labels = [text(c) for c in hdr] if hdr else []
        c = cities.setdefault(name, {})
        if 'sea temperature' in low:
            v = by_month(rows, 1)
            if v: c['sea'] = v
        elif 'temperature' in low:
            v = by_month(rows, labels.index('Max') if 'Max' in labels else 2)
            if v: c['tMax'] = v
        elif 'precipitation' in low:
            v = by_month(rows, labels.index('Days') if 'Days' in labels else 2)
            if v: c['rainDays'] = [int(round(x)) for x in v]
    return {k: v for k, v in cities.items() if 'tMax' in v}

if __name__ == '__main__':
    html = io.open(sys.argv[1], encoding='utf-8', errors='replace').read()
    print(json.dumps(parse(html), ensure_ascii=False, indent=1))
