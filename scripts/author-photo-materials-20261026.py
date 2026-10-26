"""One approved batch, existing CI only; this does not qualify or publish pages."""
import concurrent.futures, hashlib, json, os, tempfile, time, urllib.parse, urllib.request
from pathlib import Path
from PIL import Image, ImageOps, __version__ as pillow_version

API='https://cloud-api.yandex.net/v1/disk/public/resources'
KEY='https://disk.yandex.ru/d/xs-QFgpkt3Advg'
OUT=Path('artifacts/author-materials')
FIELDS='name,path,size,sha256,exif,file'

def get(url, destination=None):
    request=urllib.request.Request(url,headers={'User-Agent':'TravelTribe original-photo preparation/1.0'})
    with urllib.request.urlopen(request,timeout=45) as response:
        if destination is None: return json.load(response)
        h=hashlib.sha256(); length=0
        with destination.open('wb') as target:
            for chunk in iter(lambda:response.read(1024*1024),b''):
                target.write(chunk); h.update(chunk); length+=len(chunk)
        return h.hexdigest(),length

def resource(path, **kwargs):
    return get(API+'?'+urllib.parse.urlencode(dict(public_key=KEY,path=path,**kwargs)))

def prepare(job):
    slug,name,path=job
    try:
        metadata=resource(path,fields=FIELDS)
        with tempfile.TemporaryDirectory(prefix='tt-own-') as temporary:
            original=Path(temporary)/'original.jpg'
            errors=[]
            for attempt in range(2):
                try:
                    link=get(API+'/download?'+urllib.parse.urlencode(dict(public_key=KEY,path=path)))['href']
                    digest,length=get(link,original)
                    break
                except Exception as error:
                    errors.append(type(error).__name__+': '+str(error))
                    if attempt: raise
            if digest!=metadata['sha256'] or length!=metadata['size']:
                raise ValueError('Original SHA-256/size differs from Disk metadata')
            directory=OUT/'images'/slug
            directory.mkdir(parents=True,exist_ok=True)
            with Image.open(original) as image:
                if image.format!='JPEG': raise ValueError('Only original JPEG is expected')
                original_size=image.size; orientation=image.getexif().get(274,1)
                with ImageOps.exif_transpose(image) as transposed:
                    transposed.thumbnail((1920,1920),Image.Resampling.LANCZOS)
                    rgb=transposed.convert('RGB')
                    target=directory/(name+'.jpg')
                    rgb.save(target,'JPEG',quality=85,optimize=True,progressive=True)
                    size=rgb.size; rgb.close()
            return dict(slug=slug,name=name,status='PREPARED',source='disk:/Контент'+path,
                        shot=metadata.get('exif',{}).get('date_time'),size=list(size),
                        originalSha256=digest,originalBytes=length,originalSize=list(original_size),
                        originalOrientation=orientation,sha256=hashlib.sha256(target.read_bytes()).hexdigest(),
                        bytes=target.stat().st_size,downloadErrors=errors,
                        preparation='download API; original SHA-256 and size verified; exif_transpose; 1920px; JPEG q85')
    except Exception as error:
        return dict(slug=slug,name=name,status='FAILED',source=path,error=type(error).__name__+': '+str(error))

def inventory(path):
    items=[]; offset=0; pages=0
    try:
        while True:
            value=resource(path,limit=1000,offset=offset,
                fields='name,path,_embedded.total,_embedded.items.name,_embedded.items.path,_embedded.items.type,_embedded.items.size,_embedded.items.exif')
            embedded=value['_embedded']; page=embedded['items']; items.extend(page); pages+=1
            offset+=len(page)
            if offset>=embedded['total']: break
            if not page: raise ValueError('Empty page before declared total')
        return dict(path=path,total=embedded['total'],pages=pages,complete=True,items=items)
    except Exception as error:
        return dict(path=path,complete=False,items=items,error=type(error).__name__+': '+str(error))

def main():
    if os.environ.get('GITHUB_ACTIONS')!='true': raise RuntimeError('Existing CI only')
    start=time.monotonic(); OUT.mkdir(parents=True,exist_ok=True)
    spec=json.loads(Path('scripts/author-photo-selection-20261026.json').read_text())
    jobs=[(slug,name,path) for slug,photos in spec.items() for name,path in photos.items()]
    workers=min(4,os.cpu_count() or 1)
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
        rows=list(pool.map(prepare,jobs))
    for slug in spec:
        directory=OUT/'images'/slug; directory.mkdir(parents=True,exist_ok=True)
        own={row['name']:{k:v for k,v in row.items() if k not in ('slug','name','status','downloadErrors')}
             for row in rows if row['slug']==slug and row['status']=='PREPARED'}
        (directory/'_own.json').write_text(json.dumps(own,ensure_ascii=False,indent=2)+'\n')
    report=dict(sourceHead=os.environ.get('GITHUB_SHA'),pillow=pillow_version,workers=workers,
                complete=all(row['status']=='PREPARED' for row in rows),images=rows)
    (OUT/'photo-preparation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(dict(images=len(rows),prepared=sum(row['status']=='PREPARED' for row in rows),
                         errors=[dict(slug=row['slug'],name=row['name'],error=row['error']) for row in rows if row['status']!='PREPARED'])),flush=True)
    pending=['/']; seen=set(); index=[]; details=OUT/'archive-directories'; details.mkdir(exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
        while pending:
            batch=[path for path in pending if path not in seen]; pending=[]; seen.update(batch)
            for result in pool.map(inventory,batch):
                pending.extend(item['path'] for item in result['items'] if item['type']=='dir')
                filename=hashlib.sha256(result['path'].encode()).hexdigest()[:16]+'.json'
                (details/filename).write_text(json.dumps(result,ensure_ascii=False)+'\n')
                index.append({k:v for k,v in result.items() if k!='items'}|dict(metadataFile='archive-directories/'+filename))
            (OUT/'archive-index.json').write_text(json.dumps(dict(publicKey=KEY,observedAt=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),complete=all(x['complete'] for x in index),directories=index),ensure_ascii=False,indent=2)+'\n')
            print(json.dumps(dict(directories=len(index),pending=len(pending),errors=sum(not x['complete'] for x in index))),flush=True)
    print(json.dumps(dict(elapsedSeconds=time.monotonic()-start,photoComplete=report['complete'],archiveComplete=all(x['complete'] for x in index))),flush=True)
    if not report['complete'] or not all(x['complete'] for x in index): raise SystemExit(1)

if __name__=='__main__': main()
