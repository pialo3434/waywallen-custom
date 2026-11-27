const cinematicStages = [...document.querySelectorAll('[data-cinematic]')];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
let motionFrame = null;

function clampProgress(value) {
  return Math.min(1, Math.max(0, value));
}

function drawMotion() {
  motionFrame = null;
  if (reduceMotion.matches) return;

  const viewport = document.documentElement.clientHeight;
  if (!viewport) return;
  const bounds = cinematicStages.map(stage => stage.getBoundingClientRect());
  cinematicStages.forEach((stage, index) => {
    const { top, height } = bounds[index];
    const entering = clampProgress((.96 * viewport - top) / (.72 * viewport));
    const leaving = clampProgress(-top / Math.max(1, Math.min(height, viewport)));
    stage.style.setProperty('--enter', entering.toFixed(4));
    stage.style.setProperty('--exit', leaving.toFixed(4));
  });
}

function scheduleMotion() {
  if (!reduceMotion.matches && motionFrame === null) {
    motionFrame = requestAnimationFrame(drawMotion);
  }
}

const players = new Map();
const visibilityObserver = 'IntersectionObserver' in window
  ? new IntersectionObserver(entries => {
      for (const entry of entries) {
        const player = players.get(entry.target);
        player.visible = entry.isIntersecting && entry.intersectionRatio >= .15;
        updatePlayback(player);
      }
    }, { threshold: .15 })
  : null;

function updatePlaybackLabel({ video, button }) {
  const action = video.paused ? 'Play' : 'Pause';
  button.textContent = action + ' motion';
  button.setAttribute('aria-label', action + ' motion in the ' + button.dataset.label);
}

function updatePlayback(player) {
  const { video, button, status } = player;
  if (button.disabled) return;

  const wantsMotion = player.userChoice ?? !reduceMotion.matches;
  if (!wantsMotion || !player.visible || document.hidden) {
    video.pause();
    return;
  }

  if (!video.hasAttribute('src')) video.src = video.dataset.wallpaperVideo;
  if (!video.paused) return;
  video.play().catch(error => {
    if (error.name === 'AbortError') return;
    updatePlaybackLabel(player);
    if (error.name !== 'NotAllowedError') {
      status.textContent = 'The wallpaper animation could not load.';
      status.classList.remove('sr-only');
      button.disabled = true;
    }
  });
}

for (const section of document.querySelectorAll('[data-player]')) {
  const video = section.querySelector('[data-wallpaper-video]');
  const button = section.querySelector('[data-playback]');
  const status = section.querySelector('[data-media-status]');
  const player = { video, button, status, visible: !visibilityObserver, userChoice: null };

  players.set(section, player);
  button.hidden = false;
  updatePlaybackLabel(player);
  for (const event of ['play', 'pause']) {
    video.addEventListener(event, () => updatePlaybackLabel(player));
  }
  button.addEventListener('click', () => {
    player.userChoice = video.paused;
    player.visible = true;
    updatePlayback(player);
  });
  if (visibilityObserver) visibilityObserver.observe(section);
  else updatePlayback(player);
}

function syncMotionPreference() {
  document.documentElement.dataset.motion = reduceMotion.matches ? 'off' : 'on';
  for (const player of players.values()) {
    player.userChoice = null;
    updatePlayback(player);
  }
  scheduleMotion();
}

window.addEventListener('scroll', scheduleMotion, { passive: true });
window.addEventListener('resize', scheduleMotion);
document.addEventListener('toggle', scheduleMotion, true);
document.addEventListener('visibilitychange', () => {
  for (const player of players.values()) updatePlayback(player);
});
reduceMotion.addEventListener('change', syncMotionPreference);
syncMotionPreference();

const comparison = document.querySelector('#comparison');
const demoVideo = comparison.querySelector('video');
const adjustedCanvas = comparison.querySelector('canvas');
const adjustedContext = adjustedCanvas.getContext('2d', { alpha: false });

if (adjustedContext) {
  // Both sides show the same decoded frame. Only the adjusted side gets the CSS color grade.
  const requestFrame = demoVideo.requestVideoFrameCallback
    ? demoVideo.requestVideoFrameCallback.bind(demoVideo)
    : requestAnimationFrame;
  let frameScheduled = false;

  function paintAdjusted() {
    if (demoVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
    adjustedContext.drawImage(demoVideo, 0, 0, adjustedCanvas.width, adjustedCanvas.height);
    adjustedCanvas.hidden = false;
  }

  function scheduleAdjusted() {
    if (frameScheduled || demoVideo.paused) return;
    frameScheduled = true;
    requestFrame(() => {
      frameScheduled = false;
      paintAdjusted();
      scheduleAdjusted();
    });
  }

  for (const event of ['loadeddata', 'seeked', 'pause']) {
    demoVideo.addEventListener(event, paintAdjusted);
  }
  demoVideo.addEventListener('play', scheduleAdjusted);
}

const wipe = document.querySelector('#wipe');
const controls = document.querySelector('#scene-controls');
const reset = document.querySelector('#reset-colors');
const presets = document.querySelector('#grade-presets');
const gradeButtons = [...presets.querySelectorAll('[data-grade]')];
const sliders = [...controls.querySelectorAll('input[type="range"]')];
const grades = {
  violet: [111, 114, 135, 42],
  gold: [107, 125, 150, -63],
  neutral: [100, 100, 100, 0],
};

function updateComparison() {
  comparison.style.setProperty('--split', wipe.value + '%');
  wipe.setAttribute('aria-valuetext', wipe.value + '% original and ' + (100 - wipe.valueAsNumber) + '% adjusted');
}

function updateColors() {
  for (const slider of sliders) {
    const unit = slider.dataset.unit;
    comparison.style.setProperty('--' + slider.id, slider.value + (slider.dataset.filterUnit ?? unit));
    slider.previousElementSibling.querySelector('output').value = slider.value + unit;
  }

  for (const button of gradeButtons) {
    const grade = grades[button.dataset.grade];
    button.setAttribute('aria-pressed', String(sliders.every((slider, index) => slider.valueAsNumber === grade[index])));
  }
}

function applyGrade(grade) {
  sliders.forEach((slider, index) => { slider.value = grade[index]; });
  updateColors();
}

wipe.addEventListener('input', updateComparison);
controls.addEventListener('input', updateColors);
reset.addEventListener('click', () => applyGrade(grades.neutral));
for (const button of gradeButtons) {
  button.addEventListener('click', () => applyGrade(grades[button.dataset.grade]));
}
updateComparison();
updateColors();
wipe.disabled = false;
controls.disabled = false;
reset.disabled = false;
presets.hidden = false;

const folderDemo = document.querySelector('#folder-demo');
const folderName = document.querySelector('#folder-name');
const folderCard = document.querySelector('#live-folder');
const folderTitle = document.querySelector('#live-folder-name');
const folderIcon = document.querySelector('#folder-icon-shape');
const folderTally = document.querySelector('#folder-tally');
const folderContents = document.querySelector('#folder-contents');
const wallpaperChoices = [...folderDemo.querySelectorAll('input[name="folder-wallpaper"]')];

const folderIcons = {
  folder: 'M3 6.5h7l2 2h9v10H3z M3 11h18',
  planet: 'M18.3 7a7 7 0 1 1-11-1.5A7 7 0 0 1 18.3 7Z M4 16.7c-3-1.2.5-4.4 5.4-6.8 5-2.4 10-3.1 11-1.2 1 1.9-2.6 4.8-7.6 7.2-3.5 1.7-7.3 2.2-8.8.8Z',
  sparks: 'M9 3.5l1.6 4.9 4.9 1.6-4.9 1.6L9 16.5l-1.6-4.9L2.5 10l4.9-1.6L9 3.5Z M18 13.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6Z',
};

folderName.addEventListener('input', () => {
  folderTitle.textContent = folderName.value.trim() || 'Untitled folder';
});
for (const input of folderDemo.querySelectorAll('input[name="folder-icon"]')) {
  input.addEventListener('change', () => folderIcon.setAttribute('d', folderIcons[input.value]));
}
for (const input of folderDemo.querySelectorAll('input[name="folder-color"]')) {
  input.addEventListener('change', () => { folderCard.dataset.color = input.value; });
}

function updateFolderContents() {
  const members = wallpaperChoices.filter(input => input.checked);
  folderTally.value = members.length === 1 ? '1 wallpaper' : members.length + ' wallpapers';
  folderContents.replaceChildren(...members.map(input => {
    const item = document.createElement('li');
    item.textContent = input.value;
    return item;
  }));
}

for (const input of wallpaperChoices) {
  input.addEventListener('change', updateFolderContents);
}
folderDemo.hidden = false;

const themeSection = document.querySelector('#themes');
const themeSwitch = document.querySelector('#theme-switch');
const themeButtons = [...themeSwitch.querySelectorAll('[data-theme-view]')];
const themeLink = document.querySelector('#theme-image-link');
const themeFullCapture = document.querySelector('#theme-full-capture');
const themeImage = document.querySelector('#theme-image');
const themeCaption = document.querySelector('#theme-caption');
const themePreviews = {
  aurora: {
    alt: 'Waywallen’s Themes screen with Aurora active and the preset gallery visible',
    caption: 'Aurora pairs a deep blue frame and mint accents with moving ribbons.',
  },
  'sea-glass': {
    alt: 'Waywallen’s Themes screen with the pale Sea Glass preset active',
    caption: 'Sea Glass uses a light frame with deep teal text and icons, plus a wave effect.',
  },
  ember: {
    alt: 'Waywallen’s Themes screen with Ember active, showing pink and peach accents',
    caption: 'Ember gives the launcher a plum palette, peach controls, and a pulse effect.',
  },
  editor: {
    alt: 'Waywallen’s Clone theme editor showing editable text and icon colors, other palette colors, texture, and effect',
    caption: 'Clone a preset to change text and icon colors, add a texture, or pick a different background effect.',
  },
};
let themeAnimation;

for (const button of themeButtons) {
  button.addEventListener('click', () => {
    const view = button.dataset.themeView;
    if (view === themeSection.dataset.theme) return;

    const { alt, caption } = themePreviews[view];
    const source = './assets/theme-' + view + '.webp';
    const fullCapture = view === 'editor' ? source : './assets/theme-app-' + view + '.webp';
    themeSection.dataset.theme = view;
    themeImage.width = view === 'editor' ? 510 : 724;
    themeImage.height = view === 'editor' ? 648 : 570;
    themeImage.src = source;
    themeImage.alt = alt;
    themeLink.href = fullCapture;
    themeFullCapture.href = fullCapture;
    themeCaption.textContent = caption;
    for (const choice of themeButtons) {
      choice.setAttribute('aria-pressed', String(choice === button));
    }

    themeAnimation?.cancel();
    if (!reduceMotion.matches) {
      themeAnimation = themeImage.animate(
        [{ opacity: .35, transform: 'translateY(13px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 370, easing: 'cubic-bezier(.16, .77, .28, 1)' }
      );
    }
    scheduleMotion();
  });
}
themeSwitch.hidden = false;
scheduleMotion();
