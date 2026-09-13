#!/usr/bin/env python3
"""Scan the staged index locally, or an explicit commit tree in CI; never print values."""
import argparse
import json
import subprocess
import sys

PATTERNS = [
    r'(^|[^A-Za-z0-9_-])(sk-(ant-)?[A-Za-z0-9_-]{16,}|ghp_[A-Za-z0-9]{20,}|gho_[A-Za-z0-9]{20,}|glpat-[A-Za-z0-9_-]{16,}|xox[baprs]-[A-Za-z0-9-]{10,}|AKIA[0-9A-Z]{16}|AIza[A-Za-z0-9_-]{30,}|y0_[A-Za-z0-9_-]{20,}|fc-[A-Za-z0-9]{20,}|(sk|rk|pk)_live_[A-Za-z0-9]{16,}|[0-9]{8,10}:AA[A-Za-z0-9_-]{30,})',
    r'''PGPASSWORD[[:space:]]*=[[:space:]]*['"]?[^$ ]{6,}''',
]


def scan(tree=None):
    target = ['--cached']
    inventory_command = ['git', 'ls-files', '--cached', '-z']
    if tree:
        resolved = subprocess.run(['git', 'rev-parse', '--verify', '--end-of-options', tree + '^{tree}'],
                                  capture_output=True, text=True)
        if resolved.returncode:
            print('secret-scan: ERROR — дерево коммита недоступно', file=sys.stderr)
            return 2
        target = [resolved.stdout.strip()]
        inventory_command = ['git', 'ls-tree', '-r', '--name-only', '-z', target[0]]
    inventory = subprocess.run(inventory_command, capture_output=True)
    if inventory.returncode or not inventory.stdout:
        print('secret-scan: ERROR — список проверяемых файлов пуст или недоступен', file=sys.stderr)
        return 2
    paths = set()
    for pattern in PATTERNS:
        # -l: только имена; -z: даже перевод строки в имени не создаёт команду CI.
        result = subprocess.run(['git', 'grep', '-IlzE', '-e', pattern, *target, '--'], capture_output=True)
        if result.returncode not in (0, 1):
            print('secret-scan: ERROR — поиск не завершён', file=sys.stderr)
            return 2
        if result.returncode == 0:
            paths.update(p.decode('utf8', 'backslashreplace') for p in result.stdout.split(b'\0') if p)
    if paths:
        for path in sorted(paths):
            print('Возможный секрет: ' + json.dumps(path, ensure_ascii=True))
        return 1
    print('secret-scan: clean')
    return 0


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--tree', help='Commit to scan. Omit to scan the staged index.')
    args = parser.parse_args()
    try:
        sys.exit(scan(args.tree))
    except (OSError, ValueError):
        print('secret-scan: ERROR — проверку выполнить не удалось', file=sys.stderr)
        sys.exit(2)
