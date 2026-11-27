const root = document.documentElement;
const hero = document.querySelector('.hero');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const reelControls = document.querySelector('#reel-controls');
const motionToggle = document.querySelector('#motion-toggle');
const sceneButtons = [...reelControls.querySelectorAll('[data-scene]')];
const sceneImages = [...hero.querySelectorAll('[data-reel-image]')];

let sceneIndex = 0;
let motionRequested = true;
let heroVisible = true;
let sceneTimer;
let scrollFrame;

function showScene(index) {
  sceneIndex = index;
  const scene = sceneButtons[index].dataset.scene;
  for (const image of sceneImages) {
    image.classList.toggle('is-current', image.dataset.reelImage === scene);
  }
  for (const button of sceneButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.scene === scene));
  }
}

function scheduleReel() {
  window.clearTimeout(sceneTimer);
  if (root.dataset.motion === 'on' && heroVisible && !document.hidden) {
    sceneTimer = window.setTimeout(() => {
      showScene((sceneIndex + 1) % sceneButtons.length);
      scheduleReel();
    }, 8500);
  }
}

function updateCamera() {
  scrollFrame = undefined;
  const offset = root.dataset.motion === 'on'
    ? Math.min(68, Math.max(0, window.scrollY * .13))
    : 0;
  hero.style.setProperty('--hero-offset', offset + 'px');
}

function updateMotion() {
  const active = motionRequested && !reduceMotion.matches;
  root.dataset.motion = active ? 'on' : 'off';
  motionToggle.disabled = reduceMotion.matches;
  motionToggle.textContent = reduceMotion.matches
    ? 'Motion reduced'
    : active ? 'Pause motion' : 'Play motion';
  updateCamera();
  scheduleReel();
}

sceneButtons.forEach((button, index) => {
  button.addEventListener('click', () => {
    showScene(index);
    scheduleReel();
  });
});
motionToggle.addEventListener('click', () => {
  motionRequested = !motionRequested;
  updateMotion();
});
window.addEventListener('scroll', () => {
  if (heroVisible && scrollFrame === undefined) {
    scrollFrame = window.requestAnimationFrame(updateCamera);
  }
}, { passive: true });
document.addEventListener('visibilitychange', scheduleReel);
reduceMotion.addEventListener('change', updateMotion);

const chapterObserver = new IntersectionObserver((entries, observer) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }
}, { threshold: .12 });
for (const item of document.querySelectorAll('[data-reveal]')) {
  chapterObserver.observe(item);
}
const heroObserver = new IntersectionObserver(([entry]) => {
  heroVisible = entry.isIntersecting;
  scheduleReel();
});
heroObserver.observe(hero);

reelControls.hidden = false;
updateMotion();

const comparison = document.querySelector('#comparison');
const split = document.querySelector('#wipe');
const gradeControls = document.querySelector('#scene-controls');
const gradeInputs = [...gradeControls.querySelectorAll('input[type="range"]')];
const looks = document.querySelector('#looks');
const lookButtons = [...looks.querySelectorAll('[data-look]')];
const reset = document.querySelector('#reset-colors');
const presets = {
  aurora: [109, 111, 132, 36],
  gold: [110, 120, 127, -18],
  night: [80, 112, 82, 28],
};

function updateGrade() {
  for (const input of gradeInputs) {
    const unit = input.dataset.unit;
    const filterUnit = input.dataset.filterUnit ?? unit;
    comparison.style.setProperty('--' + input.id, input.value + filterUnit);
    input.previousElementSibling.querySelector('output').value = input.value + unit;
  }
  for (const button of lookButtons) {
    const selected = presets[button.dataset.look].every((value, index) =>
      value === gradeInputs[index].valueAsNumber
    );
    button.setAttribute('aria-pressed', String(selected));
  }
}

function applyGrade(values) {
  comparison.classList.remove('is-dragging');
  gradeInputs.forEach((input, index) => { input.value = values[index]; });
  updateGrade();
}

function updateSplit() {
  comparison.style.setProperty('--split', split.value + '%');
  split.setAttribute('aria-valuetext', (100 - split.valueAsNumber) + '% adjusted');
}

gradeControls.addEventListener('input', () => {
  comparison.classList.add('is-dragging');
  updateGrade();
});
for (const button of lookButtons) {
  button.addEventListener('click', () => applyGrade(presets[button.dataset.look]));
}
reset.addEventListener('click', () => applyGrade([100, 100, 100, 0]));
split.addEventListener('input', updateSplit);
updateGrade();
updateSplit();
looks.hidden = false;
gradeControls.disabled = false;
split.disabled = false;
reset.disabled = false;

const folderChoices = document.querySelector('#folder-choices');
const folderButtons = [...folderChoices.querySelectorAll('[data-folder]')];
const folderShelf = document.querySelector('#folder-shelf');
const folderBack = document.querySelector('#folder-back');
const folderFront = document.querySelector('#folder-front');
const folderCaption = document.querySelector('#folder-caption');
const folderCount = document.querySelector('#folder-count');
const folders = {
  scenes: {
    label: 'Scenery',
    front: './assets/night-coast.webp',
    frontAlt: 'Polar coast at night',
    back: './assets/valley.webp',
  },
  after: {
    label: 'After dark',
    front: './assets/after-hours.webp',
    frontAlt: 'A harbor with glowing buildings after midnight',
    back: './assets/night-coast.webp',
  },
  water: {
    label: 'Coastlines',
    front: './assets/night-coast.webp',
    frontAlt: 'Moonlit waves reaching the black-sand coast',
  },
};

function updateFolder(id) {
  const album = folders[id];
  folderShelf.dataset.folderView = id;
  folderFront.src = album.front;
  folderFront.alt = album.frontAlt;
  folderBack.hidden = !album.back;
  if (album.back) {
    folderBack.src = album.back;
  }
  folderCaption.textContent = album.label;
  folderCount.textContent = album.back ? '2 sample wallpapers' : '1 sample wallpaper';
  for (const button of folderButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.folder === id));
  }
  if (root.dataset.motion === 'on') {
    folderFront.animate([
      { opacity: .35, transform: 'translateY(12px) rotate(-2deg) scale(.97)' },
      { opacity: 1, transform: 'translateY(0) rotate(-6deg) scale(1)' },
    ], { duration: 570, easing: 'cubic-bezier(.18, .72, .19, 1)' });
    folderBack.animate([
      { transform: 'translateX(-9px) rotate(2deg)' },
      { transform: 'translateX(0) rotate(8deg)' },
    ], { duration: 720, easing: 'cubic-bezier(.18, .72, .19, 1)' });
  }
}

for (const button of folderButtons) {
  button.addEventListener('click', () => updateFolder(button.dataset.folder));
}
folderChoices.hidden = false;

const themeChoices = document.querySelector('#theme-choices');
const themeButtons = [...themeChoices.querySelectorAll('[data-palette]')];
const theater = document.querySelector('#theme-theater');
const themeCaption = document.querySelector('#theme-caption');

for (const button of themeButtons) {
  button.addEventListener('click', () => {
    const palette = button.dataset.palette;
    theater.dataset.paletteView = palette;
    themeCaption.textContent = button.textContent.trim() + ' palette preview';
    for (const choice of themeButtons) {
      choice.setAttribute('aria-pressed', String(choice.dataset.palette === palette));
    }
  });
}
themeChoices.hidden = false;
