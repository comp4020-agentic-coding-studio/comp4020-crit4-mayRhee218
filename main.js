// Keyboard piano: physical-key, mouse and touch input all funnel through the
// same press()/release() pair so audio and the on-screen "pressed" state can
// never drift apart.

const keys = document.querySelectorAll(".key");
const keysByCode = new Map();
keys.forEach((el) => keysByCode.set(el.dataset.code, el));

let audioCtx = null;
const voices = new Map(); // data-code -> { oscillators, gain }

function ensureAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

// A struck piano string loses energy the instant it's hit, whether or not the
// key stays down --- so the envelope decays on its own; release just cuts
// whatever's left over a touch more quickly, to avoid a click.
function startVoice(code, freq) {
  if (voices.has(code)) return;
  const ctx = ensureAudioContext();
  const now = ctx.currentTime;

  const fundamental = ctx.createOscillator();
  fundamental.type = "triangle";
  fundamental.frequency.setValueAtTime(freq, now);

  const overtone = ctx.createOscillator();
  overtone.type = "sine";
  overtone.frequency.setValueAtTime(freq * 2, now);

  const overtoneGain = ctx.createGain();
  overtoneGain.gain.setValueAtTime(0.15, now);

  const tone = ctx.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.setValueAtTime(Math.min(freq * 6, 8000), now);
  tone.Q.setValueAtTime(0.7, now);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);

  fundamental.connect(tone);
  overtone.connect(overtoneGain).connect(tone);
  tone.connect(gain).connect(ctx.destination);

  const peak = 0.28;
  gain.gain.linearRampToValueAtTime(peak, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(Math.max(peak * 0.15, 0.0001), now + 1.1);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 4);

  fundamental.start(now);
  overtone.start(now);

  voices.set(code, { oscillators: [fundamental, overtone], gain });
}

function stopVoice(code) {
  const voice = voices.get(code);
  if (!voice) return;
  voices.delete(code);

  const now = audioCtx.currentTime;
  const { oscillators, gain } = voice;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
  oscillators.forEach((osc) => osc.stop(now + 0.2));
}

function press(el) {
  if (el.classList.contains("is-pressed")) return;
  el.classList.add("is-pressed");
  el.setAttribute("aria-pressed", "true");
  startVoice(el.dataset.code, Number(el.dataset.freq));
}

function release(el) {
  if (!el.classList.contains("is-pressed")) return;
  el.classList.remove("is-pressed");
  el.setAttribute("aria-pressed", "false");
  stopVoice(el.dataset.code);
}

window.addEventListener("keydown", (event) => {
  if (event.repeat) return;
  const el = keysByCode.get(event.code);
  if (!el) return;
  press(el);
});

window.addEventListener("keyup", (event) => {
  const el = keysByCode.get(event.code);
  if (!el) return;
  release(el);
});

// Losing focus mid-press (alt-tab, a browser dialog) must not leave a note
// stuck ringing forever with no matching keyup ever arriving.
window.addEventListener("blur", () => {
  keys.forEach((el) => release(el));
});

keys.forEach((el) => {
  el.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    el.setPointerCapture(event.pointerId);
    press(el);
  });
  el.addEventListener("pointerup", () => release(el));
  el.addEventListener("pointercancel", () => release(el));
  el.addEventListener("contextmenu", (event) => event.preventDefault());
});
