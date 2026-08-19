import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

// Mechanically-checkable slice of this week's spec (crits/04-instrument).
// Everything else --- expressiveness, "no fail state", whether a stranger
// finds the first sound uninstructed --- is judged live at the crit; the
// brief itself says so. Deploy-live and process-evidence are already covered
// by CI and check-evidence.ts, so they aren't repeated here.
const DIST = resolve("dist");

function files(dir: string = DIST): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

const shipped = files();
const scripts = shipped.filter((path) => path.endsWith(".js"));
const pages = shipped
  .filter((path) => path.endsWith(".html"))
  .map((path) => new JSDOM(readFileSync(path, "utf8")).window.document);

describe("crit 4: an instrument", () => {
  it("synthesizes sound live via the Web Audio API, not by playing back a recording", () => {
    const usesWebAudio = scripts.some((path) => /\bAudioContext\b/.test(readFileSync(path, "utf8")));
    expect(
      usesWebAudio,
      "the brief asks for sound made live in the page by the player --- no AudioContext found in any shipped script",
    ).toBe(true);
  });

  it("gives the player at least one focusable control, so it's playable by keyboard as well as mouse or touch", () => {
    const playable = pages.some(
      (doc) => doc.querySelectorAll('button, [tabindex]:not([tabindex="-1"])').length > 0,
    );
    expect(
      playable,
      "no focusable control found on any page --- a stranger with only a keyboard couldn't play this",
    ).toBe(true);
  });
});
