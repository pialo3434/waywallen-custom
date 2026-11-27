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
  // Sample every stage before updating styles so scrolling needs one layout read.
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

function syncMotionPreference() {
  document.documentElement.dataset.motion = reduceMotion.matches ? 'off' : 'on';
  scheduleMotion();
}

window.addEventListener('scroll', scheduleMotion, { passive: true });
window.addEventListener('resize', scheduleMotion);
document.addEventListener('toggle', scheduleMotion, true);
reduceMotion.addEventListener('change', syncMotionPreference);
syncMotionPreference();

const comparison = document.querySelector('#comparison');
const wipe = document.querySelector('#wipe');
const controls = document.querySelector('#scene-controls');
const reset = document.querySelector('#reset-colors');
const sliders = [...controls.querySelectorAll('input[type="range"]')];

function updateComparison() {
  comparison.style.setProperty('--split', wipe.value + '%');
  wipe.setAttribute('aria-valuetext', (100 - wipe.valueAsNumber) + '% adjusted');
}

function updateColors() {
  for (const slider of sliders) {
    const unit = slider.dataset.unit;
    const filterUnit = slider.dataset.filterUnit ?? unit;
    comparison.style.setProperty('--' + slider.id, slider.value + filterUnit);
    slider.previousElementSibling.querySelector('output').value = slider.value + unit;
  }
}

wipe.addEventListener('input', updateComparison);
controls.addEventListener('input', updateColors);
reset.addEventListener('click', () => {
  for (const input of sliders) input.value = input.id === 'hue' ? 0 : 100;
  updateColors();
});
updateComparison();
updateColors();
wipe.disabled = false;
controls.disabled = false;
reset.disabled = false;

const folderSwitch = document.querySelector('#folder-switch');
const folderStage = document.querySelector('#folder-stage');
const folderCaption = document.querySelector('#folder-caption');
const folderButtons = [...folderSwitch.querySelectorAll('[data-folder-view]')];

for (const button of folderButtons) {
  button.addEventListener('click', () => {
    const view = button.dataset.folderView;
    const editing = view === 'editor';
    folderStage.dataset.view = view;
    folderStage.querySelector('.folder-library').setAttribute('aria-hidden', String(editing));
    folderStage.querySelector('.folder-editor').setAttribute('aria-hidden', String(!editing));
    folderCaption.textContent = editing
      ? 'The folder editor with a test folder selected.'
      : 'Folder cards in the test wallpaper library.';
    for (const choice of folderButtons) {
      choice.setAttribute('aria-pressed', String(choice === button));
    }
  });
}
folderSwitch.hidden = false;
