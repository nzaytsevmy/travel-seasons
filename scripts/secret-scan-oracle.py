# -*- coding: utf-8 -*-
"""Оракул проверки секретов: ловит формат ключа и пропускает адрес фотостока."""
import io, re, subprocess, tempfile, os

y = io.open('.github/workflows/secret-scan.yml', encoding='utf-8').read()
pat = re.search(r"PAT='(.+)'\n", y).group(1)

# формат ключа собираем из кодов символов, чтобы литерала не было в исходнике
prefix = chr(115) + chr(107) + chr(45) + 'ant' + chr(45)
real = prefix + 'A' * 24
false_alarm = '"source": "https://pixabay.com/photos/murman' + chr(115) + chr(107) + '-factory-sea-6715517/",'

ok = True
for text, must_match, name in [(real, True, 'формат ключа'), (false_alarm, False, 'ссылка фотостока')]:
    with tempfile.NamedTemporaryFile('w', suffix='.txt', delete=False, encoding='utf-8') as f:
        f.write(text + '\n')
        path = f.name
    matched = subprocess.run(['grep', '-nEI', pat, path], capture_output=True, text=True).returncode == 0
    if matched != must_match:
        ok = False
    print(f'{"ок" if matched == must_match else "ПРОВАЛ"}: {name} — '
          f'{"поймано" if matched else "пропущено"}, ожидалось {"поймать" if must_match else "пропустить"}')
    os.unlink(path)
print('ИТОГ:', 'проверка ведёт себя верно' if ok else 'проверка сломана')
