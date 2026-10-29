const header = document.querySelector('.site-header');
const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.nav');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const setMenu = (open) => {
  toggle.setAttribute('aria-expanded', open);
  toggle.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
  nav.classList.toggle('open', open);
  document.body.classList.toggle('lock', open);
};
toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

const bar = document.querySelector('.mobile-bar');
const hideZones = [...document.querySelectorAll('#contatti, .site-footer')];
const inHideZone = () => hideZones.some((z) => {
  const r = z.getBoundingClientRect();
  return r.top < window.innerHeight - 80 && r.bottom > 0;
});
const onScroll = () => {
  header.classList.toggle('scrolled', window.scrollY > 60);
  if (bar) bar.classList.toggle('show', window.scrollY > window.innerHeight * 0.6 && !inHideZone());
};
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
onScroll();

document.querySelectorAll('figure img').forEach((img) => {
  const hide = () => img.parentElement.classList.add('no-img');
  if (img.complete && img.naturalWidth === 0) hide();
  img.addEventListener('error', hide);
});

const countUp = (el) => {
  if (reduceMotion) return;
  const to = Number(el.dataset.count);
  const from = Number(el.dataset.from || 0);
  const suffix = el.dataset.suffix || '';
  const start = performance.now();
  const step = (now) => {
    const t = Math.min((now - start) / 1800, 1);
    el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - t, 3))) + suffix;
    if (t < 1) requestAnimationFrame(step);
  };
  el.textContent = from + suffix;
  requestAnimationFrame(step);
};

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      e.target.querySelectorAll(':scope > .img-reveal').forEach((el) => el.classList.add('in'));
      e.target.querySelectorAll('[data-count]').forEach(countUp);
      io.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.about-head, .service, .counter, .about-cta, .other').forEach((el) => {
    el.classList.add('reveal');
    if (el.matches('.service, .counter, .other')) {
      el.style.transitionDelay = `${[...el.parentElement.children].indexOf(el) * 0.12}s`;
      el.addEventListener('transitionend', () => { el.style.transitionDelay = ''; }, { once: true });
    }
  });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
  document.querySelectorAll('.img-reveal').forEach((el) => io.observe(el.parentElement));
} else {
  document.querySelectorAll('.reveal, .img-reveal').forEach((el) => el.classList.add('in'));
}

const about = document.querySelector('.about');
const layers = document.querySelectorAll('[data-parallax]');
if (about && layers.length && !reduceMotion) {
  let ticking = false;
  const update = () => {
    const r = about.getBoundingClientRect();
    const p = Math.min(Math.max((window.innerHeight - r.top) / (window.innerHeight + r.height), 0), 1);
    layers.forEach((el) => {
      const d = Number(el.dataset.parallax);
      el.style.transform = `translateY(${p * d}px) rotate(${p * (d > 0 ? -20 : 20)}deg)`;
    });
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
  update();
}

const links = [...document.querySelectorAll('[data-lightbox]')];
if (links.length) {
  const icon = (id) => `<svg class="ic" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const box = document.createElement('div');
  box.className = 'lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Galleria immagini');
  box.innerHTML = `<span class="lb-count"></span><img alt="">
    <button class="lb-btn lb-close" aria-label="Chiudi">${icon('x')}</button>
    <button class="lb-btn lb-prev" aria-label="Foto precedente">${icon('left')}</button>
    <button class="lb-btn lb-next" aria-label="Foto successiva">${icon('right')}</button>`;
  document.body.append(box);
  const img = box.querySelector('img');
  const count = box.querySelector('.lb-count');
  let index = 0;
  let lastFocus = null;

  const show = (i) => {
    index = (i + links.length) % links.length;
    img.src = links[index].href;
    img.alt = links[index].querySelector('img').alt;
    count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(links.length).padStart(2, '0')}`;
  };
  const open = (i) => {
    lastFocus = document.activeElement;
    show(i);
    box.classList.add('open');
    document.body.classList.add('lock');
    box.querySelector('.lb-close').focus();
  };
  const close = () => {
    box.classList.remove('open');
    document.body.classList.remove('lock');
    if (lastFocus) lastFocus.focus();
  };

  links.forEach((a, i) => a.addEventListener('click', (e) => {
    e.preventDefault();
    open(i);
  }));
  box.querySelector('.lb-close').addEventListener('click', close);
  box.querySelector('.lb-prev').addEventListener('click', () => show(index - 1));
  box.querySelector('.lb-next').addEventListener('click', () => show(index + 1));
  box.addEventListener('click', (e) => { if (e.target === box) close(); });
  document.addEventListener('keydown', (e) => {
    if (!box.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });
  let startX = 0;
  box.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
  });
}

document.querySelectorAll('[data-yt]').forEach((wrap) => {
  wrap.querySelector('button').addEventListener('click', () => {
    const id = wrap.dataset.yt;
    wrap.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1" title="Video del residence" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
  });
});

const select = document.getElementById('interesse');
const wanted = new URLSearchParams(location.search).get('interesse');
if (select && wanted && select.querySelector(`option[value="${CSS.escape(wanted)}"]`)) select.value = wanted;
