import {test,expect} from './browser-fixture';

for(const path of ['/', '/blog/madrid-gde-ostanovitsya/', '/blog/tutu-vozvrat-bileta-na-poezd-2026/', '/novosti/2026-10-11-madrid-thyssen-free-day/', '/trips/december/georgia/', '/packing/turkey/january/', '/visa/japan/', '/calculator/']) {
  test(`три услуги без дублирования и потери меток: ${path}`,async({page})=> {
    await page.goto(path);
    const planner=page.locator('[data-trip-planning]');
    await expect(planner).toHaveCount(1);
    const links=planner.locator('a');
    await expect(links).toHaveCount(3);
    const result=await links.evaluateAll(nodes=>nodes.map(node=>{
      const a=node as HTMLAnchorElement;const rect=a.getBoundingClientRect();
      return {offer:a.dataset.offer,id:a.dataset.ctaId,sub:new URL(a.href).searchParams.get('sub_id'),height:rect.height,rel:a.rel,visible:rect.width>0};
    }));
    expect(result.map(x=>x.offer)).toEqual(['stay','flight','insurance']);
    for(const item of result) {
      expect(item.sub).toBe(item.id);
      expect(item.rel).toContain('sponsored');
      expect(item.height).toBeGreaterThanOrEqual(44);
      expect(item.visible).toBe(true);
    }
  });
}

test('повторные клики сохраняют размещение и получают разные click_id',async({page})=>{
  await page.addInitScript(()=>{
    (window as any).__goals=[];
    (window as any).ym=(...args:unknown[])=>(window as any).__goals.push(args);
    window.addEventListener('click',event=>{
      if((event.target as Element)?.closest?.('a[data-cta-id]'))event.preventDefault();
    },true);
  });
  await page.goto('/blog/madrid-gde-ostanovitsya/');
  const link=page.locator('[data-trip-planning] a[data-partner="aviasales"]');
  const original=await link.getAttribute('data-cta-id');
  for(let i=0;i<2;i++)await link.evaluate(a=>a.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true})));
  const goals=await page.evaluate(()=>(window as any).__goals.filter((args:any[])=>args[2]==='outbound_link'));
  expect(goals).toHaveLength(2);
  expect(goals[0][3].click_id).not.toBe(goals[1][3].click_id);
  for(const goal of goals)expect(goal[3]).toMatchObject({cta_id:original,placement:'planning',destination:'spain',partner:'aviasales'});
  const target=new URL((await link.getAttribute('href'))!);
  expect(target.searchParams.get('sub_id')).toContain(original!);
  expect(target.searchParams.get('erid')).toBeTruthy();
  expect(target.searchParams.get('u')).toMatch(/MAD1$/);
});

test('справочный ответ остаётся первым, служебные страницы не получают офферы',async({page})=>{
  await page.goto('/blog/tutu-vozvrat-bileta-na-poezd-2026/');
  await expect(page.locator('.prose a[rel~="sponsored"]')).toHaveCount(0);
  const order=await page.evaluate(()=>{
    const prose=document.querySelector('.prose')!;const planner=document.querySelector('[data-trip-planning]')!;
    return Boolean(prose.compareDocumentPosition(planner)&Node.DOCUMENT_POSITION_FOLLOWING);
  });
  expect(order).toBe(true);
  await page.goto('/legal/privacy/');
  await expect(page.locator('[data-trip-planning]')).toHaveCount(0);
});

test('многострановой маршрут сохраняет общий поиск после инициализации',async({page})=>{
  await page.goto('/blog/safari-afrika-2026/');
  const anchors=await page.locator('[data-trip-planning] a').evaluateAll(nodes=>nodes.map(n=>({destination:(n as HTMLAnchorElement).dataset.destination,href:(n as HTMLAnchorElement).href})));
  for(const a of anchors)expect(a.destination).toBe('');
  expect(new URL(anchors[1].href).searchParams.get('u')).toBe('https://www.aviasales.ru/');
});

test('отказ от аналитики сохраняет полезные партнёрские переходы',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('tt_consent','denied'));
  await page.goto('/blog/madrid-gde-ostanovitsya/');
  for(const partner of ['ostrovok','aviasales','cherehapa']) {
    const link=page.locator(`[data-trip-planning] a[data-partner="${partner}"]`);
    const href=new URL((await link.getAttribute('href'))!);
    expect(href.hostname).toBe(`${partner}.tpk.mx`);
    expect(href.searchParams.get('sub_id')).toBe(await link.getAttribute('data-cta-id'));
  }
});

test.describe('без JavaScript',()=>{
  test.use({javaScriptEnabled:false});
  test('основной ответ и три услуги доступны, щит объясняет ограничение перехода',async({page})=>{
    await page.goto('/blog/madrid-gde-ostanovitsya/');
    await expect(page.locator('h1')).toHaveCount(1);
    const links=page.locator('[data-trip-planning] a');
    await expect(links).toHaveCount(3);
    for(let i=0;i<3;i++) {
      await expect(links.nth(i)).toHaveAttribute('href','/go/');
      await expect(links.nth(i)).toHaveAttribute('data-go',/.+/);
    }
    await page.goto('/go/');
    const explanation=page.locator('p').first();
    await expect(explanation).toBeVisible();
    expect((await explanation.innerText()).replace(/\u2060/g,'').replace(/\s+/g,' ')).toMatch(/с включённым JavaScript/);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content','noindex, nofollow');
  });
});

test('flight-delay claim guidance keeps all optional affiliate steps after the answer',async({page})=>{
  await page.goto('/blog/strahovka-ot-zaderzhki-reysa/');
  await expect(page.locator('[data-trip-planning]')).toHaveCount(1);
  await expect(page.locator('.post-end-money')).toHaveCount(0);
  const outside=await page.locator('a[rel~="sponsored"]').evaluateAll(nodes=>nodes.filter(n=>!n.closest('[data-trip-planning]')).map(n=>n.textContent));
  expect(outside).toEqual([]);
});

test('insurance purchase guidance retains its relevant main offer',async({page})=>{
  await page.goto('/blog/strahovka-dlya-puteshestviy-2026/');
  await expect(page.locator('.sticky-cta a')).toHaveCount(1);
  await expect(page.locator('.sticky-cta a')).toHaveAttribute('href',/cherehapa\.tpk\.mx/);
  await expect(page.locator('[data-trip-planning]')).toHaveCount(1);
});
