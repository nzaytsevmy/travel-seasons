#!/usr/bin/env python3
"""Читает `git diff -U0` поста из stdin.
exit 0 = правка тела тронула ТОЛЬКО партнёрский URL (tpk.mx/pxf.io) — проза и
         фактура те же (напр. sub_id переставлен на шортлинк) → свежесть (updatedDate)
         не требуется, как и для правки title/description.
exit 1 = есть реальная правка контента → нужен updatedDate.

Логика: маскируем каждый партнёрский URL в добавленных и удалённых строках одной
меткой. Если после маскировки мультимножества удалённых и добавленных строк
совпадают — вне aff-URL ничего не менялось. Строки title/description/updatedDate
исключаются (их свежесть гейт и так не требует).
"""
import sys, re

AFF = re.compile(r'https?://[^"\'\s)]*(?:tpk\.mx|pxf\.io)[^"\'\s)]*')
META = re.compile(r'^(title|description|updatedDate):')

rem, add = [], []
for line in sys.stdin.read().splitlines():
    if line.startswith('+++') or line.startswith('---'):
        continue
    if line[:1] in '+-':
        body = line[1:]
        if META.match(body):
            continue
        (add if line[0] == '+' else rem).append(AFF.sub('AFFURL', body))

sys.exit(0 if sorted(rem) == sorted(add) else 1)
