# -*- coding: utf-8 -*-
"""Стенд проверки секретов: гоняет НАСТОЯЩИЙ шаг из процесса на подложенном репозитории.

До 12.09.2026 стенд сверял только образец поиска и выходил с кодом 0 даже при провале,
а вызывать его было некому. Беда при этом сидела не в образце, а в шаге: список файлов
длиннее одной команды, xargs режет его на заходы и отвечает кодом последнего — ключ из
первого захода печатался в журнал, а итог выходил «чисто».
"""
import io, os, re, shutil, subprocess, sys, tempfile

WORKFLOW = '.github/workflows/secret-scan.yml'
STEP = 'name: Scan tracked files for secret formats'


def step_script(text):
    lines = text.split('\n')
    i = next(k for k, l in enumerate(lines) if STEP in l)
    j = next(k for k in range(i, len(lines)) if lines[k].strip() == 'run: |')
    indent = len(lines[j + 1]) - len(lines[j + 1].lstrip())
    body = []
    for l in lines[j + 1:]:
        if l.strip() and len(l) - len(l.lstrip()) < indent:
            break
        body.append(l[indent:])
    return '\n'.join(body)


# формат ключа собираем из кодов символов, чтобы литерала не было в исходнике
KEY = chr(115) + chr(107) + chr(45) + 'ant' + chr(45) + 'A' * 24
STOCK = '"source": "https://pixabay.com/photos/murman' + chr(115) + chr(107) + '-factory-sea-6715517/",'


def run_step(script, first_line, files=250):
    with tempfile.TemporaryDirectory() as d:
        subprocess.run(['git', 'init', '-q', d], check=True)
        for n in range(files):
            with open(os.path.join(d, 'f%04d.txt' % n), 'w', encoding='utf-8') as f:
                f.write((first_line if n == 0 else 'clean line') + '\n')
        subprocess.run(['git', '-C', d, 'add', '--', '.'], check=True)
        # Заходы по 100 файлов: так беда повторяется на любой машине, а не только там,
        # где список длиннее предела командной строки. Прокладка — вне репозитория.
        shim = tempfile.mkdtemp()
        with open(os.path.join(shim, 'xargs'), 'w') as f:
            f.write('#!/bin/sh\nexec %s -n 100 "$@"\n' % shutil.which('xargs'))
        os.chmod(os.path.join(shim, 'xargs'), 0o755)
        env = dict(os.environ, PATH=shim + os.pathsep + os.environ['PATH'])
        r = subprocess.run(['bash', '-c', script], cwd=d, env=env, capture_output=True, text=True)
        shutil.rmtree(shim)
        return r.returncode, r.stdout + r.stderr


script = step_script(io.open(WORKFLOW, encoding='utf-8').read())
cases = [
    ('ключ в первом из трёх заходов', KEY, 1),
    ('ссылка фотостока', STOCK, 0),
    ('чистый репозиторий', 'clean line', 0),
]
ok = True
for name, line, want in cases:
    code, out = run_step(script, line)
    good = (code != 0) == (want != 0)
    leaked = KEY in out
    if not good or leaked:
        ok = False
    print('%s: %s — код %d, ждали %s%s' % (
        'ок' if good and not leaked else 'ПРОВАЛ', name, code,
        'красный' if want else 'зелёный', '; КЛЮЧ ПОПАЛ В ЖУРНАЛ' if leaked else ''))
print('ИТОГ:', 'проверка ведёт себя верно' if ok else 'проверка сломана')
sys.exit(0 if ok else 1)
