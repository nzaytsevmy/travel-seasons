# -*- coding: utf-8 -*-
"""Execute the real CI step on fixtures, including missing files and unreadable Git state.
GNU xargs returns 123 for child statuses 1-125: aggregate status cannot mean 'no matches'.
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


def run_step(script, first_line, files=250, missing=False):
    with tempfile.TemporaryDirectory() as d:
        subprocess.run(['git', 'init', '-q', d], check=True)
        for n in range(files):
            with open(os.path.join(d, 'f%04d.txt' % n), 'w', encoding='utf-8') as f:
                f.write((first_line if n == 0 else 'clean line') + '\n')
        os.makedirs(os.path.join(d, 'scripts'))
        shutil.copy('scripts/secret-scan.py', os.path.join(d, 'scripts/secret-scan.py'))
        subprocess.run(['git', '-C', d, 'add', '--', '.'], check=True)
        subprocess.run(['git', '-C', d, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid',
                        'commit', '-qm', 'fixture'], check=True)
        if missing:
            os.unlink(os.path.join(d, 'f0000.txt'))
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
    ('ключ в первом из трёх заходов', KEY, 1, False),
    ('ссылка фотостока', STOCK, 0, False),
    ('чистый репозиторий', 'clean line', 0, False),
    ('ключ в индексе, файл отсутствует на диске', KEY, 1, True),
]
ok = True
for name, line, want, missing in cases:
    code, out = run_step(script, line, missing=missing)
    good = code == want
    leaked = KEY in out
    if not good or leaked:
        ok = False
    print('%s: %s — код %d, ждали %s%s' % (
        'ок' if good and not leaked else 'ПРОВАЛ', name, code,
        'красный' if want else 'зелёный', '; КЛЮЧ ПОПАЛ В ЖУРНАЛ' if leaked else ''))
scanner = os.path.abspath('scripts/secret-scan.py')
def assert_scan(name, cwd, expected, *args):
    global ok
    result = subprocess.run([sys.executable, scanner, *args], cwd=cwd, capture_output=True, text=True)
    good = result.returncode == expected and KEY not in result.stdout + result.stderr
    ok = ok and good
    print('%s: %s — код %d, ждали %d' % ('ок' if good else 'ПРОВАЛ', name, result.returncode, expected))

with tempfile.TemporaryDirectory() as d:
    assert_scan('каталог без Git не выдаётся за чистый', d, 2)
    subprocess.run(['git', 'init', '-q', d], check=True)
    assert_scan('пустой охват не выдаётся за чистый', d, 2)
    path = os.path.join(d, 'sample.txt')
    with open(path, 'w') as f: f.write('clean\n')
    subprocess.run(['git', '-C', d, 'add', '--', '.'], check=True)
    subprocess.run(['git', '-C', d, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid',
                    'commit', '-qm', 'clean'], check=True)
    assert_scan('неизвестное дерево блокируется', d, 2, '--tree', 'missing-ref')
    with open(path, 'w') as f: f.write(KEY + '\n')
    subprocess.run(['git', '-C', d, 'add', '--', '.'], check=True)
    with open(path, 'w') as f: f.write('clean worktree\n')
    assert_scan('локально проверяется индекс, не рабочая копия', d, 1)
    assert_scan('CI проверяет выбранный коммит, не индекс', d, 0, '--tree', 'HEAD')
    # Реальная ошибка Git после успешного чтения списка файлов должна блокировать сканирование.
    os.makedirs(os.path.join(d, 'shim'))
    git = shutil.which('git')
    with open(os.path.join(d, 'shim', 'git'), 'w') as f:
        f.write('#!/bin/sh\nif [ "$1" = grep ]; then exit 2; fi\nexec "%s" "$@"\n' % git)
    os.chmod(os.path.join(d, 'shim', 'git'), 0o755)
    prior_path = os.environ['PATH']
    try:
        os.environ['PATH'] = os.path.join(d, 'shim') + os.pathsep + prior_path
        assert_scan('ошибка поиска блокируется', d, 2)
    finally:
        os.environ['PATH'] = prior_path
print('ИТОГ:', 'проверка ведёт себя верно' if ok else 'проверка сломана')
sys.exit(0 if ok else 1)
