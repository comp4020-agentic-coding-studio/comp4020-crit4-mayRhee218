# Crit 4: an instrument

**What was the breakthrough that moved the work forward?**

Realising that my test suite was lying to me by omission. Everything I could
check with `pnpm check` -- markup, types, lint, the built HTML -- went green
early, but green there only meant "well-formed," not "sounds like a piano" or
"the black keys are actually where a piano's black keys go." Those two things
are exactly what the brief cares about, and neither shows up in a DOM parsed
by JSDOM, which never lays out a page or runs an audio graph. The breakthrough
was treating "open it in a browser" as a real verification step with its own
rigour, not a vibe check after the tests pass: scripting a headless browser to
measure each black key's pixel position against the white-key math, and to
log the actual `AudioParam` ramp calls around a key press and release. That's
what caught a release envelope that cut every note to silence in 0.18
seconds -- correct by every test I had, wrong to the ear -- and having a
script that could re-check the timing after the fix meant I wasn't just
trusting that it sounded better.

**What did this work change about who I want to be as a software developer?**

I want to be someone who treats "the tests pass" and "it works" as different
claims that both need evidence, especially on anything with a perceptual
dimension a test framework can't render -- sound, layout, feel. The checks
that ship with a static-site template are honest about what they cover; it's
on me to notice where that coverage runs out and go look for myself, in the
actual medium the thing runs in, before I call it done.
