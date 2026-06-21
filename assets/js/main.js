// Ornia — vanilla JS, no build step required.

// Point this at your deployed Ornia/Maluel backend before going live.
// Locally this matches apps/maluel-backend's dev server (npm run dev -> port 3001).
const API_BASE_URL = 'http://localhost:3001';
const WAITLIST_ENDPOINT = `${API_BASE_URL}/api/v1/waitlist`;

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initReveal();
  initBigNumbers();
  initOrb();
  initOrbInteraction();
  initDevices();
  initGallery();
  initWaitlistForm();
});

// ===== NAV =====
function initNav() {
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });
}

// ===== SCROLL REVEAL =====
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('in'); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.15 });
  els.forEach((el) => observer.observe(el));
}

// ===== BIG NUMBER COUNTERS =====
function initBigNumbers() {
  function format(value, fmt) {
    if (fmt === 'M') return (value / 1e6).toFixed(1) + 'M';
    if (fmt === 'ms') return '<' + Math.round(value) + 'ms';
    if (fmt === 'hr') return Math.round(value) + '/7';
    return Math.round(value).toLocaleString();
  }
  function animate(el) {
    const target = parseInt(el.dataset.target, 10);
    const fmt = el.dataset.fmt;
    const duration = 1800, steps = 60, inc = target / steps, iv = duration / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += inc;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = format(current, fmt);
    }, iv);
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { animate(entry.target); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('.bignum .num').forEach((el) => observer.observe(el));
}

// ===== HERO ORB READOUT + CALLOUTS =====
function initOrb() {
  const hr = document.getElementById('orb-hr');
  const spo2 = document.getElementById('orb-spo2');
  const rr = document.getElementById('orb-rr');
  const temp = document.getElementById('orb-temp');
  if (!hr) return;
  function rnd(a, b, d = 0) { return parseFloat((Math.random() * (b - a) + a).toFixed(d)); }
  function tick() {
    hr.textContent = rnd(118, 132);
    if (spo2) spo2.textContent = rnd(96, 99) + '%';
    if (rr) rr.textContent = rnd(32, 40);
    if (temp) temp.textContent = rnd(36.4, 37.1, 1) + '°';
  }
  setInterval(tick, 2400);
}

// ===== ORB CURSOR INTERACTIONS =====
// Magnetic lean toward the cursor (moves the whole orb + its leader-lines together
// so the lines stay perfectly attached), plus a brighter spotlight that tracks the
// cursor once it's actually over the orb itself.
function initOrbInteraction() {
  const stage = document.getElementById('orb-stage');
  const visual = document.getElementById('orb-visual');
  const core = document.getElementById('orb-core');
  if (!stage || !visual || !core) return;

  const MAX_PULL = 16;
  let targetX = 0, targetY = 0, curX = 0, curY = 0, raf = null;

  function loop() {
    curX += (targetX - curX) * 0.12;
    curY += (targetY - curY) * 0.12;
    visual.style.transform = `translate(${curX.toFixed(2)}px, ${curY.toFixed(2)}px)`;
    if (Math.abs(targetX - curX) > 0.05 || Math.abs(targetY - curY) > 0.05) {
      raf = requestAnimationFrame(loop);
    } else {
      raf = null;
    }
  }
  function kick() { if (!raf) raf = requestAnimationFrame(loop); }

  stage.addEventListener('mousemove', (e) => {
    const rect = stage.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    const dist = Math.hypot(dx, dy) || 1;
    const maxDist = Math.min(rect.width, rect.height) / 2;
    const strength = Math.max(0, 1 - dist / maxDist);
    targetX = (dx / dist) * MAX_PULL * strength;
    targetY = (dy / dist) * MAX_PULL * strength;
    stage.classList.toggle('is-near', strength > 0.35);
    kick();
  });
  stage.addEventListener('mouseleave', () => {
    targetX = 0; targetY = 0;
    stage.classList.remove('is-near');
    kick();
  });

  core.addEventListener('mouseenter', () => core.classList.add('is-hover'));
  core.addEventListener('mouseleave', () => core.classList.remove('is-hover'));
  core.addEventListener('mousemove', (e) => {
    const r = core.getBoundingClientRect();
    core.style.setProperty('--spot-x', ((e.clientX - r.left) / r.width) * 100 + '%');
    core.style.setProperty('--spot-y', ((e.clientY - r.top) / r.height) * 100 + '%');
  });

  // Click: a burst of expanding rings + a brightness flash, like an emitted pulse
  function spawnBurst(delay) {
    setTimeout(() => {
      const burst = document.createElement('div');
      burst.className = 'orb-burst';
      visual.appendChild(burst);
      burst.addEventListener('animationend', () => burst.remove());
    }, delay);
  }
  core.addEventListener('click', () => {
    core.classList.remove('is-pulsing');
    void core.offsetWidth; // restart the flash animation if clicked again quickly
    core.classList.add('is-pulsing');
    spawnBurst(0);
    spawnBurst(160);
  });

  // Tooltip explains each annotated label, follows the cursor while hovering it
  const tooltip = document.getElementById('orb-tooltip');
  if (tooltip) {
    document.querySelectorAll('.callout').forEach((el) => {
      const tip = el.dataset.tip;
      if (!tip) return;
      el.addEventListener('mouseenter', () => {
        tooltip.textContent = tip;
        tooltip.classList.add('show');
      });
      el.addEventListener('mouseleave', () => tooltip.classList.remove('show'));
      el.addEventListener('mousemove', (e) => {
        tooltip.style.left = e.clientX + 'px';
        tooltip.style.top = e.clientY + 'px';
      });
    });
  }
}

// ===== DEVICE MOCKUPS (laptop bars + phone vitals + waveform) =====
function initDevices() {
  // Laptop bar chart — gentle randomized heartbeat-style bars
  const barsHost = document.getElementById('laptop-bars');
  if (barsHost) {
    const n = 24;
    const bars = [];
    for (let i = 0; i < n; i++) {
      const bar = document.createElement('i');
      bars.push(bar);
      barsHost.appendChild(bar);
    }
    function randomizeBars() {
      bars.forEach((b) => { b.style.height = (28 + Math.random() * 65) + '%'; });
    }
    randomizeBars();
    setInterval(randomizeBars, 1800);
  }

  // Phone vitals ticking gently within a healthy range
  function rnd(a, b, d = 0) { return parseFloat((Math.random() * (b - a) + a).toFixed(d)); }
  function tickVitals() {
    const spo2 = rnd(96, 99) + '%';
    const hr = Math.round(rnd(112, 134));
    const rr = Math.round(rnd(30, 42));
    const temp = rnd(36.4, 37.1, 1) + '°';
    const map = { 'pv-spo2': spo2, 'pv-hr': hr, 'pv-rr': rr, 'pv-temp': temp };
    Object.entries(map).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    });
  }
  tickVitals();
  setInterval(tickVitals, 2200);

  // Phone waveform canvas
  const cv = document.getElementById('phoneWave');
  if (cv) {
    const ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    const pts = new Array(W).fill(H / 2);
    let ph = 0;
    function draw() {
      ph += 0.16;
      pts.shift();
      const y = H / 2 - Math.sin(ph) * H * 0.32 + (Math.random() - 0.5) * 2;
      pts.push(y);
      ctx.clearRect(0, 0, W, H);
      const g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, 'rgba(24,200,178,0)');
      g.addColorStop(0.5, 'rgba(24,200,178,.95)');
      g.addColorStop(1, 'rgba(24,200,178,0)');
      ctx.beginPath();
      ctx.moveTo(0, pts[0]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(i, pts[i]);
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.6;
      ctx.shadowBlur = 6;
      ctx.shadowColor = 'rgba(24,200,178,0.5)';
      ctx.stroke();
      ctx.shadowBlur = 0;
      requestAnimationFrame(draw);
    }
    draw();
  }
}

// ===== HORIZONTAL GALLERY =====
function initGallery() {
  const track = document.getElementById('gallery-track');
  const prev = document.getElementById('gal-prev');
  const next = document.getElementById('gal-next');
  if (!track) return;
  function step(dir) {
    const slide = track.querySelector('.gallery-slide');
    const amount = slide ? slide.getBoundingClientRect().width + 20 : 320;
    track.scrollBy({ left: dir * amount, behavior: 'smooth' });
  }
  prev?.addEventListener('click', () => step(-1));
  next?.addEventListener('click', () => step(1));
}

// ===== WAITLIST FORM =====
function initWaitlistForm() {
  const body = document.getElementById('form-body');
  const sending = document.getElementById('form-sending');
  const success = document.getElementById('form-success');
  const errorBox = document.getElementById('form-error');
  const submitBtn = document.getElementById('submit-btn');
  if (!submitBtn) return;

  submitBtn.addEventListener('click', async () => {
    const fn = document.getElementById('fn').value.trim();
    const em = document.getElementById('em').value.trim();
    const ro = document.getElementById('ro').value;

    const fields = { fn: document.getElementById('fn'), em: document.getElementById('em'), ro: document.getElementById('ro') };
    let valid = true;
    Object.values(fields).forEach((el) => {
      if (!el.value.trim()) { el.style.borderColor = '#c0392b'; valid = false; }
      else el.style.borderColor = '';
    });

    errorBox.style.display = 'none';

    if (!valid) {
      errorBox.textContent = 'Please fill in your name, email, and role.';
      errorBox.style.display = 'block';
      return;
    }

    const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailReg.test(em)) {
      fields.em.style.borderColor = '#c0392b';
      errorBox.textContent = 'Please enter a valid email address.';
      errorBox.style.display = 'block';
      return;
    }

    const payload = {
      fullName: fn,
      email: em,
      role: ro,
      organization: document.getElementById('org').value.trim() || undefined,
      phone: document.getElementById('ph').value.trim() || undefined,
      referralSource: document.getElementById('ref').value || undefined,
      message: document.getElementById('msg').value.trim() || undefined,
    };

    body.style.display = 'none';
    sending.style.display = 'flex';

    try {
      const res = await fetch(WAITLIST_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to join the waitlist.');

      document.getElementById('wl-ref').textContent = '#' + Math.random().toString(36).slice(2, 8).toUpperCase();
      sending.style.display = 'none';
      success.style.display = 'block';
    } catch (err) {
      sending.style.display = 'none';
      body.style.display = 'block';
      errorBox.textContent = err.message || `Couldn't reach the Ornia server. Please try again shortly.`;
      errorBox.style.display = 'block';
    }
  });
}
