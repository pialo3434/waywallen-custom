const stage = document.querySelector('.hero-window');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const compactStage = matchMedia('(max-width: 700px)');
let cameraFrame;

function updateCamera() {
  cameraFrame = undefined;
  const useTilt = !reduceMotion.matches && !compactStage.matches;
  const progress = Math.min(1, Math.max(0, window.scrollY / 380));
  stage.style.setProperty('--tilt', (useTilt ? 9 * (1 - progress) : 0) + 'deg');
  stage.style.setProperty('--lift', (useTilt ? 14 * (1 - progress) : 0) + 'px');
}

function updateMotion() {
  document.documentElement.dataset.motion = reduceMotion.matches ? 'off' : 'on';
  updateCamera();
}

window.addEventListener('scroll', () => {
  if (cameraFrame === undefined) cameraFrame = requestAnimationFrame(updateCamera);
}, { passive: true });
reduceMotion.addEventListener('change', updateMotion);
compactStage.addEventListener('change', updateCamera);
updateMotion();

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: .12 });
  for (const feature of document.querySelectorAll('[data-reveal]')) {
    revealObserver.observe(feature);
  }
}

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
