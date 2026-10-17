export function initHotelGalleries() {
document.querySelectorAll('.hotel-photos').forEach(container => {
    const gallery = container.querySelector('.hotel-gallery');
    const controls = container.querySelector('.hotel-gallery-controls');
    const figures = [...gallery.querySelectorAll('figure')];
    const previous = controls.querySelector('[data-photo-prev]');
    const next = controls.querySelector('[data-photo-next]');
    if (figures.length < 2) return;
    let index = 0;
    const update = () => {
      index = figures.reduce((best, figure, i) => Math.abs(figure.offsetLeft - figures[0].offsetLeft - gallery.scrollLeft) < Math.abs(figures[best].offsetLeft - figures[0].offsetLeft - gallery.scrollLeft) ? i : best, 0);
      previous.disabled = index === 0;
      next.disabled = index === figures.length - 1;
    };
    const move = (delta) => {
      const target = figures[Math.max(0, Math.min(figures.length - 1, index + delta))];
      gallery.scrollTo({ left: target.offsetLeft - figures[0].offsetLeft, behavior: 'instant' });
      update();
    };
    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    gallery.addEventListener('scroll', update, { passive: true });
    controls.hidden = false;
    update();
  });
}
