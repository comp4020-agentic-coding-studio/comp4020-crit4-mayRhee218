// Keyboard piano: physical-key, mouse and touch input all funnel through the
// same press()/release() pair so audio and the on-screen "pressed" state can
// never drift apart.

const keys = document.querySelectorAll(".key");
const keysByCode = new Map();
keys.forEach((el) => keysByCode.set(el.dataset.code, el));

let audioCtx = null;
let graph = null; // shared reverb + compressor bus, built once
const voices = new Map(); // data-code -> voice

function ensureAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

// A synthetic impulse response --- decaying filtered noise --- stands in for
// a real room: it's what turns a dry oscillator into something that sounds
// like it's ringing out in space, with no sample file to ship.
function buildReverbImpulse(ctx, durationSeconds, decayPower) {
  const length = Math.round(ctx.sampleRate * durationSeconds);
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < impulse.numberOfChannels; channel++) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decayPower);
    }
  }
  return impulse;
}

// The shared bus every voice feeds into: a room (convolver) in parallel with
// the dry signal, all through a compressor so a big polyphonic chord glues
// together instead of clipping.
function ensureGraph(ctx) {
  if (graph) return graph;

  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-16, ctx.currentTime);
  compressor.knee.setValueAtTime(22, ctx.currentTime);
  compressor.ratio.setValueAtTime(3.5, ctx.currentTime);
  compressor.attack.setValueAtTime(0.004, ctx.currentTime);
  compressor.release.setValueAtTime(0.3, ctx.currentTime);

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.9, ctx.currentTime);
  compressor.connect(masterGain).connect(ctx.destination);

  const convolver = ctx.createConvolver();
  convolver.buffer = buildReverbImpulse(ctx, 2.6, 2.1);
  const reverbReturn = ctx.createGain();
  reverbReturn.gain.setValueAtTime(0.55, ctx.currentTime);
  convolver.connect(reverbReturn).connect(compressor);

  graph = { compressor, convolver, reverbSendLevel: 0.32 };
  return graph;
}

// A real piano note is several strings and a soundboard, not one pure tone:
// a handful of sine partials (the fundamental doubled up a few cents apart,
// for the shimmer of unison strings, plus a slightly stretched --- not
// perfectly integer --- upper partial, the way stiff real strings run a
// touch sharp) add up to something brighter and more alive than one
// oscillator, without the buzz a saw/square wave would add.
const HARMONICS = [
  { ratio: 1, gain: 1.0, decay: 1.0, detuneCents: [-3, 3] },
  { ratio: 2, gain: 0.55, decay: 0.82 },
  { ratio: 3, gain: 0.28, decay: 0.62 },
  { ratio: 4, gain: 0.14, decay: 0.48 },
  { ratio: 6.02, gain: 0.07, decay: 0.3 },
];

const ATTACK_SECONDS = 0.02; // gentle, not a percussive click
const BASE_DECAY_SECONDS = 7; // how long the fundamental keeps ringing if held
const RELEASE_SECONDS = 1.9; // long, smooth tail once the key comes back up
const VOICE_HEADROOM = 0.3; // per-note ceiling so polyphony stays clean

function startVoice(code, freq) {
  if (voices.has(code)) return;
  const ctx = ensureAudioContext();
  const bus = ensureGraph(ctx);
  const now = ctx.currentTime;

  // Bright at the strike, mellowing as the note rings on --- a plain
  // constant-cutoff filter is what makes a synth patch sound static and
  // synthetic instead of like a struck string settling.
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.setValueAtTime(0.3, now);
  filter.frequency.setValueAtTime(Math.min(freq * 11, 13000), now);
  filter.frequency.exponentialRampToValueAtTime(Math.max(freq * 4, 1200), now + 2.4);

  const dry = ctx.createGain();
  dry.gain.setValueAtTime(1, now);
  const reverbSend = ctx.createGain();
  reverbSend.gain.setValueAtTime(bus.reverbSendLevel, now);
  filter.connect(dry).connect(bus.compressor);
  filter.connect(reverbSend).connect(bus.convolver);

  const oscillators = [];
  const harmonicGains = [];

  for (const harmonic of HARMONICS) {
    const partials = harmonic.detuneCents ?? [0];
    for (const cents of partials) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq * harmonic.ratio, now);
      osc.detune.setValueAtTime(cents, now);

      const partialGain = ctx.createGain();
      const peak = (harmonic.gain / partials.length) * VOICE_HEADROOM;
      partialGain.gain.setValueAtTime(0, now);
      partialGain.gain.linearRampToValueAtTime(peak, now + ATTACK_SECONDS);
      partialGain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + ATTACK_SECONDS + BASE_DECAY_SECONDS * harmonic.decay,
      );

      osc.connect(partialGain).connect(filter);
      osc.start(now);

      oscillators.push(osc);
      harmonicGains.push(partialGain);
    }
  }

  voices.set(code, { oscillators, harmonicGains, filter, dry, reverbSend });
}

function stopVoice(code) {
  const voice = voices.get(code);
  if (!voice) return;
  voices.delete(code);

  const ctx = audioCtx;
  const now = ctx.currentTime;

  // The key coming up should not cut the string dead --- let whatever level
  // each partial is already at fade out gradually instead of snapping to
  // silence.
  voice.harmonicGains.forEach((gain) => {
    const current = Math.max(gain.gain.value, 0.0001);
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(current, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + RELEASE_SECONDS);
  });

  const stopAt = now + RELEASE_SECONDS + 0.05;
  voice.oscillators.forEach((osc) => osc.stop(stopAt));
  voice.oscillators[0].addEventListener("ended", () => {
    voice.oscillators.forEach((osc) => osc.disconnect());
    voice.harmonicGains.forEach((gain) => gain.disconnect());
    voice.filter.disconnect();
    voice.dry.disconnect();
    voice.reverbSend.disconnect();
  });
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
