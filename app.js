const body = document.body;
const intro = document.querySelector("#intro");
const header = document.querySelector("[data-header]");
const progressBar = document.querySelector(".page-progress i");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const finishIntro = (skipped = false) => {
  if (!intro || intro.dataset.finished) return;
  intro.dataset.finished = "true";
  if (skipped) {
    intro.classList.add("is-skipped");
    body.classList.add("intro-skipped");
  }
  body.classList.remove("intro-active");
  window.setTimeout(() => intro.setAttribute("aria-hidden", "true"), skipped ? 500 : 700);
};

if (reduceMotion) finishIntro(true);
else window.setTimeout(() => finishIntro(false), 5000);
document.querySelector("[data-skip-intro]")?.addEventListener("click", () => finishIntro(true));

const updateChrome = () => {
  header?.classList.toggle("scrolled", window.scrollY > 24);
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (progressBar) progressBar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
};
updateChrome();

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("visible");
    revealObserver.unobserve(entry.target);
  });
}, { threshold: .16 });
document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

const map = document.querySelector("[data-map]");
if (map) {
  const mapObserver = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      map.classList.add("visible");
      mapObserver.disconnect();
    }
  }, { threshold: .12, rootMargin: "0px 0px -15% 0px" });
  mapObserver.observe(map);
}

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const symptoms = document.querySelector(".symptoms");
const symptomWords = [...document.querySelectorAll(".symptoms-copy p")];
const photoStory = document.querySelector(".photo-story");
const photoMask = document.querySelector("[data-photo-mask]");
const photoImage = photoMask?.querySelector("img");
const parallax = document.querySelector("[data-parallax]");

let activeSymptomIndex = 0;
let pendingSymptomIndex = 0;
let symptomSwapTimer;
symptomWords[0]?.classList.add("is-active");

const showSymptom = (nextIndex) => {
  pendingSymptomIndex = nextIndex;
  if (symptomSwapTimer || pendingSymptomIndex === activeSymptomIndex) return;
  symptomWords[activeSymptomIndex]?.classList.remove("is-active");
  symptomSwapTimer = window.setTimeout(() => {
    activeSymptomIndex = pendingSymptomIndex;
    symptomWords[activeSymptomIndex]?.classList.add("is-active");
    symptomSwapTimer = undefined;
  }, 460);
};

const updateScenes = () => {
  updateChrome();
  if (parallax) {
    const offset = window.scrollY * Number(parallax.dataset.parallax || 0);
    parallax.style.transform = `translateY(calc(-50% + ${offset}px))`;
  }
  if (symptoms && symptomWords.length) {
    const travel = symptoms.offsetHeight - window.innerHeight;
    const sceneProgress = clamp((window.scrollY - symptoms.offsetTop) / travel);
    const nextIndex = Math.min(symptomWords.length - 1, Math.floor(sceneProgress * symptomWords.length));
    showSymptom(nextIndex);
  }
  if (photoStory && photoMask && photoImage) {
    const travel = photoStory.offsetHeight - window.innerHeight;
    const sceneProgress = clamp((window.scrollY - photoStory.offsetTop) / travel);
    const inset = 12 * (1 - sceneProgress);
    const radius = 2.4 * (1 - sceneProgress);
    photoMask.style.clipPath = `inset(${inset}% ${inset}% ${inset}% ${inset}% round ${radius}rem)`;
    photoImage.style.transform = `scale(${1.09 - sceneProgress * .09})`;
  }
};

let scrollQueued = false;
window.addEventListener("scroll", () => {
  if (scrollQueued) return;
  scrollQueued = true;
  requestAnimationFrame(() => {
    updateScenes();
    scrollQueued = false;
  });
}, { passive: true });
window.addEventListener("resize", updateScenes, { passive: true });
updateScenes();

const steps = [...document.querySelectorAll(".method-step")];
const stepNumber = document.querySelector("[data-step-number]");
let activeStepIndex = 0;
let targetStepIndex = 0;
let stepSequenceTimer;

const renderStep = (index) => {
  steps.forEach((step, stepIndex) => step.classList.toggle("is-active", stepIndex === index));
  if (!stepNumber) return;
  stepNumber.classList.add("is-changing");
  window.setTimeout(() => {
    stepNumber.textContent = steps[index].dataset.step;
    stepNumber.classList.remove("is-changing");
  }, 170);
};

const advanceStepSequence = () => {
  if (activeStepIndex === targetStepIndex) {
    stepSequenceTimer = undefined;
    return;
  }
  activeStepIndex += Math.sign(targetStepIndex - activeStepIndex);
  renderStep(activeStepIndex);
  stepSequenceTimer = window.setTimeout(advanceStepSequence, 390);
};

const updateMethodStep = () => {
  if (!steps.length) return;
  const focusLine = window.innerHeight * .54;
  const distances = steps.map((step) => Math.abs(step.getBoundingClientRect().top + step.offsetHeight / 2 - focusLine));
  targetStepIndex = distances.indexOf(Math.min(...distances));
  if (!stepSequenceTimer && targetStepIndex !== activeStepIndex) advanceStepSequence();
};

window.addEventListener("scroll", updateMethodStep, { passive: true });
window.addEventListener("resize", updateMethodStep, { passive: true });
updateMethodStep();

if (window.matchMedia("(pointer: fine)").matches && !reduceMotion) {
  body.classList.add("cursor-on");
  const dot = document.querySelector(".cursor-dot");
  const ring = document.querySelector(".cursor-ring");
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;

  window.addEventListener("pointermove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    if (dot) dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    const target = document.elementFromPoint(mouseX, mouseY);
    body.classList.toggle("cursor-light", Boolean(target?.closest("[data-dark], .photo-story")));
  }, { passive: true });

  const animateCursor = () => {
    ringX += (mouseX - ringX) * .16;
    ringY += (mouseY - ringY) * .16;
    if (ring) ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
    requestAnimationFrame(animateCursor);
  };
  animateCursor();
  document.querySelectorAll(".cursor-zone").forEach((zone) => {
    zone.addEventListener("pointerenter", () => body.classList.add("cursor-hover"));
    zone.addEventListener("pointerleave", () => body.classList.remove("cursor-hover"));
  });
}

document.querySelector("#contact-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const message = [
    "Hola, quiero solicitar un diagnóstico con SOREN.",
    `Nombre: ${data.get("nombre")}`,
    `Empresa: ${data.get("empresa")}`,
    `Correo: ${data.get("correo")}`,
    `Situación: ${data.get("situacion")}`
  ].join("\n");
  window.open(`https://wa.me/525652691960?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
});
