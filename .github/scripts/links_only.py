#!/usr/bin/env python3
"""Проверяет, тронула ли правка src/data/directions.js ФАКТУРУ или только перелинковку.

Читает две версии файла (base и head) из argv. Вырезает из обеих блок
RELATED_POSTS (перелинковка «хаб → блог-гайд») и строку импорта related-posts.js,
затем сравнивает остаток.

exit 0 = вне блока перелинковки ничего не менялось → DATA_UPDATED («цены и визовые
         правила проверены на дату X») бампать не нужно, фактуру не трогали.
exit 1 = изменилась фактура → нужен бамп.

Почему не эвристика по маркерам строк: поля slug:/kind: встречаются в файле и вне
блока (14 и 2 раза на 2026-07), поэтому фильтр по ним был бы дырой в гейте.
Отсутствие этого файла делает гейт строже (вызов падает → требуется бамп), не мягче.
"""
import sys


def strip(src: str) -> str:
    out = src
    i = out.find('const RELATED_POSTS = {')
    if i != -1:
        d = 0
        for k in range(i + len('const RELATED_POSTS = '), len(out)):
            if out[k] == '{':
                d += 1
            elif out[k] == '}':
                d -= 1
                if d == 0:
                    out = out[:i] + out[k + 1:]
                    break
    # Отбрасываем строку импорта и «пустые» строки, включая осиротевшую ';',
    # которая остаётся на месте вырезанного блока. Фактуры они не несут.
    return '\n'.join(l for l in out.splitlines()
                     if 'related-posts.js' not in l and l.strip() not in ('', ';'))


base, head = (open(p, encoding='utf-8').read() for p in sys.argv[1:3])
sys.exit(0 if strip(base) == strip(head) else 1)
