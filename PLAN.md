# Build a Keyboard Piano Web App

I want you to build a **web-based piano that can be played using a computer keyboard**.

## 1. Keyboard Layout and Note Mapping

Use the computer keyboard keys from **`A` on the far left to `'` on the far right** as the white piano keys.

There should be **11 white keys in total**.

Map them sequentially to the notes of a piano.

For example:

* `A` → C
* `S` → D
* `D` → E
* `F` → F
* `G` → G
* `H` → A
* `J` → B
* `K` → C
* `L` → D
* `;` → E
* `'` → F

In other words, the keys from `A` through `'` represent **11 consecutive white piano keys**.

## 2. Black Key Mapping

The black keys should follow the standard layout of a real piano.

Use the **QWERTY row above the A–' row** for the black keys.

For example:

* `A` → C
* `W` → C#
* `S` → D

Therefore, `W` should visually appear between the `A (C)` and `S (D)` white keys.

Follow the normal piano pattern:

* C → C# → D → D# → E → F → F# → G → G# → A → A# → B → C
* There is **no black key between E and F**
* There is **no black key between B and C**

So the black-key pattern should be:

**C# – D# – [none] – F# – G# – A# – [none]**

The corresponding keyboard keys should be taken from the QWERTY row above the white-key row.

For example:

```text
        W       E               T       Y       U
        │       │               │       │       │
┌───────┬───────┬───────┬───────┬───────┬───────┐
│   A   │   S   │   D   │   F   │   G   │   H   │
│   C   │   D   │   E   │   F   │   G   │   A   │
└───────┴───────┴───────┴───────┴───────┴───────┘
```

The black keys should be positioned **on top of and between the appropriate white keys**, just like on a real piano.

If there is no black key between two white keys, simply leave that position empty.

## 3. Piano UI

The main purpose of the website is to make the piano occupy **as much of the screen as possible**.

### White Keys

* There must be exactly **11 white keys**.
* They should be arranged in a single horizontal row.
* All white keys should have the same width.
* The 11 keys should stretch across almost the entire width of the screen.
* Each key should display:

  * The corresponding computer keyboard key
  * The corresponding piano note

For example:

```text
┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐
│ A  │ S  │ D  │ F  │ G  │ H  │ J  │ K  │ L  │ ;  │ '  │
│ C  │ D  │ E  │ F  │ G  │ A  │ B  │ C  │ D  │ E  │ F  │
└────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘
```

### Black Keys

Black keys should be narrower and shorter than the white keys, and should overlap the top portion of the white keys.

Their horizontal positions must accurately correspond to the gaps between the appropriate white keys, just like a real piano.

## 4. Playing the Piano

The user should be able to play the piano in two ways:

1. By pressing the corresponding keys on their physical keyboard.
2. By clicking or touching the piano keys on the screen.

When a key is pressed, it should:

* Play the corresponding note.
* Visually change to indicate that it is being pressed.
* Return to its normal appearance when released.

For example:

* User presses `A`
* The C key on the screen becomes visually pressed
* The C note plays
* User releases `A`
* The key returns to its normal state

The same behavior should work for both white and black keys.

## 5. Audio

The piano should work entirely in the browser without requiring a backend server.

Use the **Web Audio API** if appropriate.

The notes should have accurate pitch and should sound reasonably similar to a real piano.

Also make sure that multiple notes can be played simultaneously if the user presses multiple keyboard keys at the same time.

## 6. Responsive Design

The piano should work on:

* Desktop
* Laptop
* Tablet
* Mobile

On mobile and tablet devices, users should be able to play the piano by tapping and holding the keys.

The piano should automatically adapt to the screen size.

On desktop, the 11 white keys should occupy almost the entire available horizontal space.

## 7. Visual Design

Make the interface look like a clean, modern digital piano.

Requirements:

* Realistic white and black piano-key appearance
* Clear distinction between white and black keys
* Smooth press/release animations
* Subtle shadows and depth
* Minimal and uncluttered interface
* The piano itself should be the main focus of the screen

Do not add unnecessary UI elements.

## 8. Important Implementation Requirement

Please implement the piano as a **fully functional web application**, not just a visual mockup.

Make sure:

* Keyboard input works correctly.
* Mouse/touch input works correctly.
* Audio plays correctly.
* Black keys are positioned accurately.
* The piano layout follows the actual structure of a piano.
* The 11 white keys fill the available screen width.
* The application works without a backend.

Please provide the complete implementation and explain how to run it locally.
