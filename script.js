const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  tg.disableVerticalSwipes?.();
  tg.setHeaderColor?.('#12050f');
  tg.setBackgroundColor?.('#12050f');
}

const modalLayer = document.getElementById('modalLayer');
const openInstall = document.getElementById('openInstall');
const closeModal = document.getElementById('closeModal');
const installBtn = document.getElementById('installBtn');
const doneBtn = document.getElementById('doneBtn');
const percentText = document.getElementById('percentText');
const progressFill = document.getElementById('progressFill');
const ringProgress = document.getElementById('ringProgress');
const loadingText = document.getElementById('loadingText');
const fxBtn = document.getElementById('fxBtn');

const RING_LENGTH = 264;
const INSTALL_DURATION = 30000;
let installFrame = null;
let installStart = 0;
let softFx = true;

const loadingMessages = [
  [0, 'Подготовка файлов...'],
  [15, 'Проверка мира...'],
  [31, 'Загрузка блоков...'],
  [48, 'Сборка пиксельных ресурсов...'],
  [67, 'Оптимизация под Telegram...'],
  [84, 'Финальная настройка...'],
  [97, 'Завершение...']
];

function haptic(type = 'light') {
  if (!softFx || !tg?.HapticFeedback) return;
  try {
    if (type === 'success') tg.HapticFeedback.notificationOccurred('success');
    else tg.HapticFeedback.impactOccurred(type);
  } catch (_) {}
}

function setState(name) {
  document.querySelectorAll('.state').forEach(state => {
    state.classList.toggle('is-active', state.dataset.state === name);
  });
}

function openSheet() {
  haptic('medium');
  modalLayer.classList.add('is-open');
  modalLayer.setAttribute('aria-hidden', 'false');
  resetInstall();
}

function closeSheet() {
  haptic('light');
  modalLayer.classList.remove('is-open');
  modalLayer.setAttribute('aria-hidden', 'true');
  cancelAnimationFrame(installFrame);
}

function resetInstall() {
  cancelAnimationFrame(installFrame);
  setState('start');
  percentText.textContent = '0%';
  progressFill.style.width = '0%';
  ringProgress.style.strokeDashoffset = RING_LENGTH;
  loadingText.textContent = loadingMessages[0][1];
}

function updateLoadingMessage(percent) {
  let text = loadingMessages[0][1];
  for (const [threshold, msg] of loadingMessages) {
    if (percent >= threshold) text = msg;
  }
  loadingText.textContent = text;
}

function startInstall() {
  haptic('medium');
  setState('loading');
  installStart = performance.now();

  const tick = now => {
    const elapsed = now - installStart;
    const raw = Math.min(elapsed / INSTALL_DURATION, 1);
    const eased = 1 - Math.pow(1 - raw, 2.2);
    const percent = Math.min(100, Math.floor(eased * 100));

    percentText.textContent = `${percent}%`;
    progressFill.style.width = `${percent}%`;
    ringProgress.style.strokeDashoffset = RING_LENGTH - (RING_LENGTH * percent / 100);
    updateLoadingMessage(percent);

    if (raw < 1) {
      installFrame = requestAnimationFrame(tick);
    } else {
      percentText.textContent = '100%';
      progressFill.style.width = '100%';
      ringProgress.style.strokeDashoffset = 0;
      setTimeout(() => {
        setState('success');
        haptic('success');
      }, 280);
    }
  };

  installFrame = requestAnimationFrame(tick);
}

openInstall.addEventListener('click', openSheet);
closeModal.addEventListener('click', closeSheet);
installBtn.addEventListener('click', startInstall);
doneBtn.addEventListener('click', closeSheet);
fxBtn.addEventListener('click', () => {
  softFx = !softFx;
  fxBtn.classList.toggle('is-on', softFx);
  haptic('light');
});
fxBtn.classList.add('is-on');

window.addEventListener('keydown', event => {
  if (event.key === 'Escape' && modalLayer.classList.contains('is-open')) closeSheet();
});

// Pixel sakura petals canvas
const canvas = document.getElementById('petals');
const ctx = canvas.getContext('2d');
const petals = [];
let dpr = Math.min(window.devicePixelRatio || 1, 2);

function resizeCanvas() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(innerWidth * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
  canvas.style.width = `${innerWidth}px`;
  canvas.style.height = `${innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function makePetal(initial = false) {
  const size = Math.random() * 5 + 4;
  return {
    x: Math.random() * innerWidth,
    y: initial ? Math.random() * innerHeight : -30,
    size,
    speed: Math.random() * 1.15 + .35,
    sway: Math.random() * 1.2 + .35,
    phase: Math.random() * Math.PI * 2,
    rotate: Math.random() * Math.PI,
    spin: (Math.random() - .5) * .025,
    alpha: Math.random() * .45 + .48,
    tone: Math.random()
  };
}

function seedPetals() {
  petals.length = 0;
  const count = Math.min(64, Math.floor(innerWidth * innerHeight / 13500));
  for (let i = 0; i < count; i++) petals.push(makePetal(true));
}

function drawPixelPetal(p) {
  ctx.save();
  ctx.globalAlpha = p.alpha;
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotate);
  const s = p.size;
  const colors = p.tone > .5
    ? ['#ff9bd0', '#ff67b7', '#ffd0e7']
    : ['#ffb4dc', '#fb73c0', '#ffe0ef'];
  ctx.fillStyle = colors[0];
  ctx.fillRect(-s / 2, -s / 2, s, s);
  ctx.fillStyle = colors[1];
  ctx.fillRect(0, -s * .95, s * .8, s * .8);
  ctx.fillStyle = colors[2];
  ctx.fillRect(-s * .95, 0, s * .75, s * .75);
  ctx.restore();
}

function animatePetals() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  for (const p of petals) {
    p.phase += .012;
    p.y += p.speed;
    p.x += Math.sin(p.phase) * p.sway;
    p.rotate += p.spin;
    if (p.y > innerHeight + 35 || p.x < -45 || p.x > innerWidth + 45) Object.assign(p, makePetal(false));
    drawPixelPetal(p);
  }
  requestAnimationFrame(animatePetals);
}

resizeCanvas();
seedPetals();
animatePetals();
window.addEventListener('resize', () => { resizeCanvas(); seedPetals(); });
