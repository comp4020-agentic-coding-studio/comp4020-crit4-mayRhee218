# Process overview

A reading-guide to how the work came together --- a map to your process, not an
essay about it. Markers read this file and follow its citations; they don't
trawl the repo for evidence you didn't point at, so if a moment mattered, cite
it.

This file is the shape; the course site's
[assessment page](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/assessment/#what-you-submit)
is the requirement, and its
[word counts](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/assessment/#word-counts)
cover every deliverable.

## What I built

A keyboard piano: 11 white keys mapped to `A` through `'`, black keys on the
QWERTY row above them following the real piano's C#-D#-_-F#-G#-A#-_ gap
pattern, playable by physical keyboard, mouse, or touch, with a Web Audio API
voice built from layered sine partials rather than one plain oscillator, so it
has a longer, more natural decay instead of a synthesiser buzz.

## The moments that mattered

1. **Carrying the stack forward broke the entry point.** Keeping assignment
   1's bare stack (no bundler, hand-written HTML/CSS/JS) meant `main.ts` --
   loaded as `<script type="module" src="./main.ts">` -- couldn't run in a
   browser at all without a build step. The obvious fix was to add one back;
   instead I renamed the entry point to `main.js` and dropped the type
   annotation, which is what "bare" actually means, rather than quietly
   reintroducing the tooling the stack choice was meant to drop
   ([`52d1e16`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-mayRhee218/commit/52d1e165a88d813aa1ed1ab589990ae223a4e81e)).
   `pnpm check` going green straight after, with no bundler in the dependency
   tree, is what told me it had actually landed.

2. **Static-HTML tests can't see what JavaScript draws.** `spec/invariants.test.ts`
   and my own `spec/crit-4.test.ts` both run against the *built* HTML through
   JSDOM, which never executes `<script>` tags. That ruled out generating the
   18 piano keys at runtime, which would have been the shorter way to write
   `index.html` -- a JS-templated version would have shipped a page with no
   buttons in it as far as the test suite (and a screen reader hitting the
   page before the script runs) is concerned. I hand-wrote all 18 keys as
   real `<button>` elements instead, so "gives the player at least one
   focusable control" is true of the file on disk, not just of the DOM after
   a script runs
   ([`08b42d6`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-mayRhee218/commit/08b42d639ad020301cd285611cb3fc9c440d70a8)).
   I checked this the same way the test does: read the built `dist/index.html`
   directly, not the page after load.

3. **"Play it and see" caught what the unit tests couldn't.** The brief asks
   for accurate black-key placement and a release that fades rather than
   cuts off -- neither is something JSDOM can judge, since it never runs a
   layout engine or an audio graph. I scripted a real headless Chromium
   session to measure each black key's on-screen centre against the white-key
   boundary math and to log every `AudioParam` automation call around a
   press/release, rather than trusting the CSS percentages and the envelope
   code by inspection. That's what turned up that the first release envelope
   cut a note from full volume to silence in 0.18s regardless of how it had
   already decayed -- technically a release, but not the "gradual, natural
   tail" the sound was supposed to have. Rewriting it to continue the note's
   own decay curve out to ~1.9s, and re-running the same measurement script
   to confirm the new release ramp's timing, is the check that told me it
   was fixed, not just different
   ([`9c07f96`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-mayRhee218/commit/9c07f96cf34317561612d15ea1ed278ebf5e4cd1)).

## Before you ship

`pnpm check:evidence` verifies your citations resolve to real commits, that a
reflection entry the marker reads is in `reflections/`, and that your
`CLAUDE.md` is there --- before a marker ever opens the file. It checks that
your map is traceable, not that it is good: the marker judges whether your
small, deliberately chosen set of moments shows real judgement and reflection. A
green check is not a substitute for that curation.

Images aren't checked: whether one renders is visible the moment you look. Open
this file on GitHub and look at it before you ship.
