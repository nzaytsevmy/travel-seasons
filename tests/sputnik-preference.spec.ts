import {test,expect} from './browser-fixture';

for(const path of ['/bali/','/japan/','/oman/','/packing/turkey/','/packing/turkey/september/',
  '/visa/japan/','/trips/july/','/trips/july/georgia/','/compare/turkey-vs-egypt/','/calculator/','/events/july/',
  '/blog/gagra-2026/']){
 for(const width of [402,1280]){
  test(`Sputnik destination CTA keeps its real partner and destination: ${path} @${width}`,async({page})=>{
    await page.setViewportSize({width,height:900});
    await page.goto(path);
    const link=page.locator('a[data-partner="sputnik8"]:not([data-tour-id])').last();
    await expect(link).toHaveAttribute('data-cta-prepared','1');
    const url=new URL(await link.getAttribute('href') as string);
    expect(url.hostname).toBe('sputnik8.tpk.mx');
    expect(url.searchParams.get('erid')).toBe('2Vtzqugsszo');
    expect(url.searchParams.get('sub_id')).toBeTruthy();
    const target=new URL(url.searchParams.get('u') as string);
    expect(target.hostname).toBe('www.sputnik8.com');
    expect(await link.innerText()).not.toMatch(/готовый маршрут|малая группа|авторские туры/i);
    await expect(link).toHaveAttribute('rel',/sponsored/);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await link.scrollIntoViewIfNeeded();
    await test.info().attach(`sputnik-cta-${width}`,{body:await page.screenshot(),contentType:'image/png'});
  });
 }
}

test('an expedition fallback still opens a multi-day product, not a city walk',async({page})=>{
  await page.goto('/antarctica/');
  const product=page.locator('[data-tour-picks] a[data-partner="youtravel"]').first();
  await expect(product).toHaveAttribute('data-cta-prepared','1');
  const target=new URL(new URL(await product.getAttribute('href') as string).searchParams.get('redirect') as string);
  expect(target.hostname).toBe('youtravel.me');
  expect(target.pathname).toMatch(/^\/tours\/\d+\//);
});
