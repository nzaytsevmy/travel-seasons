#!/usr/bin/env python3
"""Свои кадры с Яндекс.Диска в статью блога.

Зачем: 45 статей из 64 написаны без единого следа личного опыта, хотя в архиве
поездок 52 папки стран (ревизия 11.08.2026). Чужой сток заменяется своим кадром —
это и уникальная картинка, которой нет ни у кого, и честное доказательство, что
автор там был.

Три правила ниже оплачены багами на проде ([[feedback_yandex_disk_workflow]]):
  1. Скачивать через download API. `preview_size=XXL` отдаёт замыленное превью
     на 130 КБ — обложка Боливии на сайте вышла «ужасного качества».
  2. `exif_transpose` ДО любых операций: PIL молча игнорирует флаг поворота,
     и вертикальный кадр Лагуны Колорада лёг на бок.
  3. Ужимать до 1920px q=85. Оригиналы по 25 МБ Astro превращал в webp по
     10–12 МБ, и вместо фотографий в трёх статьях были знаки вопроса.

Порядок работы: сначала `--contact` (контактный лист всей папки одним листом,
смотреть глазами), потом `--pick` с номерами понравившихся кадров.

  python3 scripts/disk-photos.py "Чили '25" --contact
  python3 scripts/disk-photos.py "Чили '25" --pick 12,40,77 --slug chile --names atacama,geysers,santiago
"""
import argparse, io, json, os, sys, urllib.parse, urllib.request
from pathlib import Path
from PIL import Image, ImageOps

API = 'https://cloud-api.yandex.net/v1/disk'


def token():
    t = os.environ.get('YANDEX_DISK_TOKEN')
    if not t:
        sys.exit('нет YANDEX_DISK_TOKEN — подключите ~/.config/tt/secrets.env')
    return t


def req(url):
    r = urllib.request.Request(url, headers={'Authorization': f'OAuth {token()}'})
    return urllib.request.urlopen(r, timeout=60)


def listing(path):
    items, offset = [], 0
    while True:
        u = f'{API}/resources?' + urllib.parse.urlencode({'path': path, 'limit': 200, 'offset': offset})
        page = json.load(req(u))['_embedded']['items']
        items += page
        if len(page) < 200:
            break
        offset += 200
    return [i for i in items if i['type'] == 'file'
            and i['name'].lower().endswith(('.jpg', '.jpeg'))]


def fetch(path, preview=False):
    """preview=True — только для контактного листа, в статью так класть нельзя."""
    if preview:
        u = f'{API}/resources?' + urllib.parse.urlencode({'path': path, 'preview_size': 'M'})
        href = json.load(req(u)).get('preview')
    else:
        u = f'{API}/resources/download?' + urllib.parse.urlencode({'path': path})
        href = json.load(req(u))['href']
    return req(href).read()


def shot_date(img):
    """Месяц и год съёмки из EXIF — факт для подписи, а не догадка."""
    exif = img.getexif()
    raw = exif.get(306) or exif.get(36867)          # DateTime / DateTimeOriginal
    if not raw:
        return None
    try:
        y, m = raw.split(':')[0], raw.split(':')[1]
        months = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль',
                  'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь']
        return f'{months[int(m) - 1]} {y}'
    except Exception:
        return None


def contact_sheet(folder, out):
    files = sorted(listing(f'disk:/Контент/{folder}'), key=lambda i: i['name'])
    if not files:
        # Так падало на «Вьетнам»: в корне поездки одни RAW и видео, просматриваемых
        # jpg нет вовсе, а PIL на пустом листе кидает «cannot write empty image».
        sys.exit(f'в «{folder}» нет просматриваемых jpg — загляните в подпапки '
                 f'(RAW/, Видео/) или возьмите другую поездку')
    cw, ch, cols = 300, 200, 6
    rows = (len(files) + cols - 1) // cols
    sheet = Image.new('RGB', (cw * cols, ch * rows), '#111')
    for n, it in enumerate(files):
        try:
            im = Image.open(io.BytesIO(fetch(it['path'], preview=True)))
            im = ImageOps.exif_transpose(im)
            im = ImageOps.fit(im, (cw, ch), Image.LANCZOS)
            sheet.paste(im, ((n % cols) * cw, (n // cols) * ch))
        except Exception:
            pass
        if n % 20 == 0:
            print(f'  {n}/{len(files)}', flush=True)
    sheet.save(out, 'JPEG', quality=80, optimize=True)
    print(f'\nконтактный лист: {out}')
    print(f'кадров: {len(files)} · нумерация слева направо, {cols} в ряду, с 1')
    return files


def pick(folder, numbers, slug, names, root):
    files = sorted(listing(f'disk:/Контент/{folder}'), key=lambda i: i['name'])
    outdir = Path(root) / 'src/content/blog/_images' / slug
    outdir.mkdir(parents=True, exist_ok=True)
    meta = {}
    for num, name in zip(numbers, names):
        it = files[num - 1]
        img = Image.open(io.BytesIO(fetch(it['path'])))
        img = ImageOps.exif_transpose(img)
        when = shot_date(img)
        if max(img.size) > 1920:
            img.thumbnail((1920, 1920), Image.LANCZOS)
        dst = outdir / f'{name}.jpg'
        img.convert('RGB').save(dst, 'JPEG', quality=85, optimize=True, progressive=True)
        kb = dst.stat().st_size // 1024
        meta[name] = {'source': it['path'], 'shot': when, 'size': img.size}
        print(f'✓ {name:14} {img.size[0]}×{img.size[1]} {kb} КБ · снято: {when or "дата не записана"}')
    (outdir / '_own.json').write_text(json.dumps(meta, ensure_ascii=False, indent=2), 'utf-8')
    print(f'\nсохранено в {outdir}, происхождение — в _own.json')


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('folder', help='папка поездки внутри Контент/')
    ap.add_argument('--contact', action='store_true', help='собрать контактный лист')
    ap.add_argument('--pick', help='номера кадров через запятую')
    ap.add_argument('--slug', help='папка статьи в _images/')
    ap.add_argument('--names', help='имена файлов через запятую, по числу номеров')
    ap.add_argument('--out', default='/tmp/contact.jpg')
    ap.add_argument('--root', default=str(Path(__file__).resolve().parent.parent))
    a = ap.parse_args()
    if a.contact:
        contact_sheet(a.folder, a.out)
    elif a.pick:
        nums = [int(x) for x in a.pick.split(',')]
        names = a.names.split(',')
        if len(nums) != len(names):
            sys.exit('номеров и имён должно быть поровну')
        pick(a.folder, nums, a.slug, names, a.root)
    else:
        ap.error('нужен --contact или --pick')
