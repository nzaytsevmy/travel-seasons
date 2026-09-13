// Runs in the page. WCAG 2.5.8: 24px target OR spacing, with a narrow inline exception.
export function targetViolations() {
  const targets = [...document.querySelectorAll('a[href],button,[role=button],input:not([type=hidden]),select,summary')]
    .filter(el => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return !el.closest('[inert]') && !el.matches(':disabled') && rect.width > 0 && rect.height > 0 &&
        style.display !== 'none' && style.visibility === 'visible' &&
        (!el.checkVisibility || el.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}));
    }).map(el => {
      const rect = el.getBoundingClientRect();
      const prose = el.matches('a') ? el.closest('p,li') : null;
      let inline = false;
      if (prose && ['inline','inline-block'].includes(getComputedStyle(el).display)) {
        const copy = prose.cloneNode(true);
        copy.querySelectorAll('a,button,input,select,summary,[role=button]').forEach(node=>node.remove());
        inline = /[\p{L}\p{N}]/u.test(copy.textContent || '');
      }
      return {el,inline,x:rect.x,y:rect.y,w:rect.width,h:rect.height,
        cx:rect.x+rect.width/2,cy:rect.y+rect.height/2,small:rect.width<24||rect.height<24};
    });
  return targets.filter(a => a.small && !a.inline && targets.some(b => {
    if (a === b || a.el.contains(b.el) || b.el.contains(a.el)) return false;
    if (b.small) return Math.hypot(a.cx-b.cx,a.cy-b.cy) < 24 - 0.1;
    const dx = a.cx - Math.max(b.x,Math.min(a.cx,b.x+b.w));
    const dy = a.cy - Math.max(b.y,Math.min(a.cy,b.y+b.h));
    return Math.hypot(dx,dy) < 12 - 0.1;
  })).map(({el,w,h})=>({t:(el.textContent||el.getAttribute('aria-label')||el.tagName).trim().slice(0,60),w,h}));
}
