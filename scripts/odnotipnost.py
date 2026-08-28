#!/usr/bin/env python3
# Проверка на однотипность программных разделов.
#
# Зачем: в руководстве асессоров Google низшая оценка ставится не за долю денежных
# страниц, а за СИСТЕМНУЮ повторяемость одной беды — асессору велено открыть соседние
# страницы сайта и посмотреть, не то же ли самое. Эта проверка делает то же самое числом.
#
# Как читать: показывает, какая доля предложений совпадает дословно у двух случайных
# страниц одного раздела. Сквозной текст (шапка, подвал, баннер cookie) вычитается.
# ⛔ Число само по себе не приговор: часть совпадений законна (документы, запреты,
# правила ввоза от месяца не зависят). Смотреть глазами, ЧТО именно совпало.
#
# Запуск: python3 scripts/odnotipnost.py   (нужна собранная папка dist)
#
# Замер 28.08.2026: /packing/ 13% в среднем и 44% у худшей пары, /trips/ 11% и 44%.

import re, os, io, random, collections
random.seed(7)
ROOT='dist'
TAG=re.compile(r'<[a-zA-Z/!][^>"\']*(?:"[^"]*"[^>"\']*|\'[^\']*\'[^>"\']*)*>')
DROP=re.compile(r'<(script|style|noscript)\b[\s\S]*?</\1\s*>', re.I)
CMT=re.compile(r'<!--[\s\S]*?-->')
def text(p):
    s=io.open(p,encoding='utf-8',errors='ignore').read()
    s=CMT.sub(' ',s); s=DROP.sub(' ',s); s=TAG.sub(' ',s)
    s=re.sub(r'&[a-z]+;|&#\d+;',' ',s)
    return re.sub(r'\s+',' ',s).strip()
def sents(t):
    return [p.strip() for p in re.split(r'(?<=[.!?])\s+', t) if len(p.strip())>=40]

pages=[]
for d,_,fs in os.walk(ROOT):
    for f in fs:
        if f.endswith('.html'): pages.append(os.path.join(d,f))

# 1) сквозной текст: предложения, встречающиеся более чем на 40% случайных страниц всего сайта
probe=random.sample(pages,200)
freq=collections.Counter()
for p in probe:
    for s in set(sents(text(p))): freq[s]+=1
BOILER={s for s,c in freq.items() if c>len(probe)*0.4}
print('сквозных предложений (шапка/подвал/сквозные блоки): %d' % len(BOILER))
for s in list(sorted(BOILER, key=len, reverse=True))[:3]:
    print('   пример: %s' % s[:100])
print()

def group(p):
    rel=p[len(ROOT)+1:]; parts=rel.split(os.sep)
    if len(parts)<2: return '/(корень)'
    if parts[0]=='trips' and len(parts)>=3: return '/trips/месяц/страна/'
    return '/'+parts[0]+'/'
g=collections.defaultdict(list)
for p in pages: g[group(p)].append(p)

print('%-24s %6s %8s %8s  %s' % ('раздел','стр.','совпад','худшая','худшая пара'))
rows=[]
for name,ps in sorted(g.items()):
    if len(ps)<4: continue
    sample=random.sample(ps,min(len(ps),40))
    cache={p:(set(sents(text(p)))-BOILER) for p in sample}
    pairs=[]
    for i in range(len(sample)):
        for j in range(i+1,len(sample)):
            a,b=cache[sample[i]],cache[sample[j]]
            if len(a)<3 or len(b)<3: continue
            u=len(a|b)
            if u: pairs.append((len(a&b)/u, sample[i], sample[j]))
    if not pairs: continue
    pairs.sort(reverse=True)
    avg=sum(x[0] for x in pairs)/len(pairs)
    rows.append((avg,name,len(ps),pairs[0]))
rows.sort(reverse=True)
for avg,name,n,worst in rows:
    ex=worst[1][len(ROOT)+1:].replace('/index.html','')+' ↔ '+worst[2][len(ROOT)+1:].replace('/index.html','')
    print('%-24s %6d %7.0f%% %7.0f%%  %s' % (name,n,avg*100,worst[0]*100,ex[:60]))

# ── Этап 4 промта (29.08.2026): второй замер — есть ли на странице СВОИ данные ──
# Внешняя проверка показала: асессор ищет не «чем страницы отличаются», а есть ли
# на странице то, чего нет у соседей. Для месячной страницы это месяце-специфичные
# факты: температура месяца, осадки, цена месяца, события месяца.
# Страница без единого такого факта — в красный список.

def month_specific_facts(path):
    """Считает ИЗМЕРЕННЫЕ факты месяца — не шаблонные.

    ⛔ Первая версия считала любые «°C» и слова «высокий сезон» — их держит
    шаблон на каждой странице, и красный список вышел пустым при 58 странах
    без данных. Настоящий маркер измеренного факта — строка «Замер по <город>.
    Источник: …», её печатает только реальный погодный блок."""
    t = text(path)
    facts = 0
    # реальный погодный блок: замер по конкретному городу с источником
    facts += len(re.findall(r'Замер по\s+\S+.{0,40}?Источник', t))
    # осадки вида «115 мм / 4 дн» — есть только у реальных данных
    facts += len(re.findall(r'\d+\s*мм\s*/\s*\d+\s*дн', t))
    return facts

if __name__ == '__main__' and os.environ.get('FACTS'):
    import sys
    red = []
    sample_dirs = []
    for d, dirs, fs in os.walk(ROOT + '/packing'):
        if 'index.html' in fs and d.count('/') >= 3:  # dist/packing/страна/месяц
            sample_dirs.append(d + '/index.html')
    print('месячных страниц сборов: %d' % len(sample_dirs))
    counts = {}
    for p in sample_dirs:
        n = month_specific_facts(p)
        counts[p] = n
        if n == 0:
            red.append(p)
    vals = sorted(counts.values())
    print('фактов на страницу: медиана %d, мин %d, макс %d' % (
        vals[len(vals)//2], vals[0], vals[-1]))
    print('⛔ страниц БЕЗ единого месяце-специфичного факта: %d' % len(red))
    for p in red[:10]:
        print('   ' + p[len(ROOT)+1:].replace('/index.html',''))
