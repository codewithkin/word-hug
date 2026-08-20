# Word Hug — Art Direction & Asset Brief

**Version:** 1.0 (session 8)
**Audience:** whoever makes the images — an illustrator, a designer, or a
prompt into an image model. Everything needed to produce an on-brand asset
without opening the codebase is in this file.

**Source of truth:** the colour and type values below are copied from
`apps/native/theme.generated.css`, which is generated from
`packages/tokens/src/index.ts`. If they ever disagree, the token package wins
and this document is stale.

---

## 0. The one-paragraph brief

Word Hug is a cozy word puzzle. Three clue words, one word that joins all three
(`SNOW` + ball, flake, man). It is warm, hand-made, unhurried and slightly
chunky — closer to a wooden toy or a felt board than to a slick mobile game.
It has no timer, no score, no lives and no way to lose, and **the art must not
imply otherwise.** Nothing sparkles, nothing counts down, nothing is on fire.

### The reference images, and what we take from them

The Wordscapes assets supplied as reference are the right *category* and the
wrong *temperature*. What is worth taking:

- **The letter-tile motif as the brand's atom.** Wordscapes builds nearly every
  asset out of scattered letter tiles. Word Hug should do the same, because our
  logo is already made of tiles — see §3.
- **Logotype centred, subject behind it, generous empty space.** The Solitaire
  banner and the sunset banner both work because the mark sits alone in the
  middle third and the scene is pushed to the edges and blurred.
- **One scene per pack, colour-coded.** Their "beach", "sunset", "mountain"
  treatments are exactly the job our five packs need doing.

What to explicitly **not** take:

- **The photographic blur backgrounds.** Word Hug's elevation is a hard shadow
  with *zero blur* (§4). Blur is the one visual effect this brand does not own,
  and a blurred photo behind a chunky flat mark looks like two products.
- **Gloss, bevels, drop shadows with spread, outer glows, lens flare.** Their
  logo has a 3D extrude and a soft glow. Ours is flat with a hard offset.
- **Saturated blue/purple gradients** (the Appier graphic). Our dark theme is
  deep indigo, but our *brand* colour is amber on warm cream.
- **The registered-trademark, high-contrast, shouty tone.** Their copy shouts;
  ours does not.

> If an asset would look at home in an ad for a casino app, it is wrong.

---

## 1. Colour

Every value is a literal from the token file. **Do not eyedrop these from a
screenshot** — screenshots are gradient-shaded and will give you the wrong hex.

### 1.1 Light theme (the default, and what most assets should use)

| Role | Hex | Notes |
|---|---|---|
| Ground | `#EFE6DA` | The app's outermost background. Warm grey-cream. |
| Surface | `#FFFFFF` | Cards, tiles, keycaps. |
| Surface sunken | `#FFF4E2` | The splash background. Also the Android adaptive-icon background. |
| Surface inset | `#FFF0CE` | Keycaps. |
| **Primary (amber)** | **`#FFB020`** | **The brand colour.** Buttons, the HUG tiles, the coin. |
| Primary shadow | `#D98A00` | The hard shadow *under* anything amber. |
| On primary | `#4A3000` | Text on amber. A deep brown, never black. |
| Accent (teal) | `#17A398` | Secondary actions. |
| Accent shadow | `#0E7A72` | |
| On accent | `#EAFFFC` | |
| Highlight (coral) | `#FF6B4A` | Streak, and the Kitchen pack. Used sparingly. |
| Text primary | `#3A2A18` | Dark warm brown. **The app contains no pure black.** |
| Text secondary | `#6E5B44` | |
| Text muted | `#8C7A66` | |
| Text faint | `#A6866B` | |
| Clue card | `#FFFFFF` on `#EBD6B0` shadow | |
| Clue slot | `#FFF3DE`, border `#E0C795` | The dashed empty slot. |
| Answer tile empty | `#F3E3C4` | |
| Key cap | `#FFF0CE` on `#E9D6A8` shadow | |

### 1.2 Dark theme

| Role | Hex |
|---|---|
| Ground | `#0C0718` |
| Surface | `#33206B` |
| Surface alt | `#2B1A5E` |
| Surface inset | `#1A0F38` (the dark splash background) |
| Primary | `#FFB020` (**unchanged** — amber is amber in both themes) |
| Primary shadow | `#C97F0B` |
| Accent | `#17A398` (unchanged) |
| Text primary | `#FFF3DE` |
| Text secondary | `#B29CE8` |
| Clue card | `#33206B` on `#1C1040` |

The dark theme is **deep indigo-violet, not neutral grey and not navy.** It
reads as "evening indoors", which is also the Nightfall pack's whole idea.

### 1.3 The rule that matters most

Amber `#FFB020` is the only colour allowed to dominate an asset. Teal and coral
are accents. If a promo image is mostly teal, it is a pack image, not a brand
image.

---

## 2. Type

**One family: Baloo 2.** Two weights only.

| Token | Family | Used for |
|---|---|---|
| `font-wh-regular` | Baloo2 **700 Bold** | Body copy. Yes — "regular" is Bold. |
| `font-wh-bold` | Baloo2 **800 ExtraBold** | Buttons, answers, headings. |
| `font-wh-heavy` | Baloo2 **800 ExtraBold** | Labels, eyebrows. |

There is no light, book, or medium weight anywhere in this product. Baloo 2 is
a rounded, friendly, slightly heavy display face; using it at 400 would make it
look like a different typeface.

### 2.1 Sizes (px)

`11.5 · 12 · 13 · 13.5 · 14 · 16 · 17 · 20 · 22 · 24 · 26 · 28 · 32 · 34`

### 2.2 Letter-spacing

- `tracking-wh-tight` `0em` — body
- `tracking-wh-wide` `0.06em` — button labels
- `tracking-wh-label` `0.18em` — small uppercase eyebrows (`LEVEL 4 OF 50`)

**Uppercase + `0.18em` + 12px + ExtraBold** is the app's signature small label.
Any promo art with a caption should use it.

---

## 3. The logo

`WORD` in four small pale tiles, above `HUG` in three large amber tiles. Every
tile is individually rotated:

- `W −5°`, `O +3°`, `R −2°`, `D +5°`
- `H +4°`, `U −3°`, `G +5°`

**These rotations are not decorative noise — they are the mark.** Do not
average them, do not alternate them evenly, do not straighten them "for the
store listing". The asymmetry is what makes it look hand-placed.

Each tile is a rounded square (`radius-wh-card`, 16px at normal size) with the
hard zero-blur shadow beneath it. `WORD` tiles use the **answer-tile** colour,
not `surface` — identical in light, different in dark, and getting it wrong
makes the mark go flat in dark mode.

Existing assets already implementing this: `assets/images/icon.png`,
`splash-icon.png`, `splash-icon-dark.png`, `adaptive-icon.png`.

---

## 4. Elevation — the single most important visual rule

Everything in Word Hug sits on a **hard vertical shadow with ZERO blur.**

```
box-shadow: 0 4px 0 <shadow-colour>;
```

Not `0 4px 8px`. Not `0 4px 4px rgba(0,0,0,0.1)`. **Zero blur, offset only,
and the shadow colour is a specific opaque token per surface** — amber sits on
`#D98A00`, white cards sit on `#EBD6B0`, keycaps on `#E9D6A8`.

Offsets in use: 2–6px. 3 and 4 are the workhorses. Pressing a button drops it
to 2px and moves the element down by the same amount, so its bottom edge stays
put.

Inset variants (`inset 0 -4px 0`) read as "sunken" and are used for empty
answer tiles.

> This is decision D-004 and it is the whole personality of the interface. An
> asset with a soft blurred drop shadow is off-brand no matter how good it is.

### 4.1 Corner radii

`3 · 10 · 14 · 16 (card) · 20 · 22 · 999 (pill)`

Tiles and cards are 16. Buttons are 19–22. Chips and coins are full pills.

---

## 5. Backgrounds

The puzzle screens are **not a flat colour**. They are a three-stop radial
gradient with a warm glow at the top:

```
radial-gradient(115% 70% at 50% 0%, #FFE6B4 0%, #FFF4E2 58%, #FFF9EF 100%)
```

All 74 gradients in the original designs are **radial. Not one is linear.**
Promo art that needs a background should use a radial warm glow, positioned
top-centre, never a linear top-to-bottom ramp.

---

## 6. Motion (for video/GIF assets only)

- The wordmark assembles letter by letter — `WORD` then `HUG`.
- Elements rise 6–12px and fade in, staggered by 60–80ms.
- A wrong guess shakes horizontally and buzzes. Nothing turns red and stays red.
- **Nothing loops forever, nothing pulses to draw attention, nothing bounces
  to be noticed.** Motion happens once, when something arrives.

---

# PART TWO — THE ASSETS

Each entry below is a complete brief. Sizes are final export sizes.

---

## 7. Pack promo art — the priority

This is the commercial ask: five images whose job is to make someone spend
£1.99. They appear on `/packs` (list, ~343×160 card), on `/pack/[id]` (hero,
full width ~375×200), and in the store listing.

### 7.0 Rules that apply to all five

1. **Same composition every time.** One scene, letter tiles scattered in the
   foreground, pack name in the app's own type. Five images that share a
   skeleton read as a set; five illustrations in five styles read as clip art.
2. **The pack's tint is the dominant colour**, and the amber logo does *not*
   appear — these sit inside the app, which is already branded.
3. **Flat vector illustration**, thick warm outlines (`#3A2A18`, ~2.5px at 1×),
   no gradients on objects, no texture, no photographic elements. Objects may
   carry the same zero-blur offset shadow as the UI.
4. **Include 3–5 real letter tiles** from that pack's answers, scattered at the
   same cheeky angles as the logo (−5° to +5°). Use actual answers from the
   pack — listed per pack below.
5. **No people, no faces, no hands.** The product has none anywhere.
6. **Leave the centre-left third clear** for the name and price overlay.
7. Deliver at **3× (1029×480 for the card, 1125×600 for the hero)**, PNG,
   transparent background *plus* a version on the pack's tint.

### 7.0.1 The composition every pack shares

Work on a **1125 × 600** canvas (the hero at 3×). The card crop is the centre
**1029 × 480** of the same artwork — so compose once, and keep anything
load-bearing inside the card crop.

Divide the canvas into thirds vertically:

| Zone | Contents |
|---|---|
| **Left third** | **Kept clear.** The pack name and price sit here as live text drawn by the app, not baked into the image. Nothing but background wash and at most one drifting letter tile. |
| **Middle third** | The scene's focal object — the teapot, the tree, the fox, the hammer, the lamp. Largest element, roughly 55–65% of canvas height. |
| **Right third** | Supporting objects, smaller, some cropped by the right edge. Depth without clutter. |

**Horizon / baseline** sits at 62% down the canvas on all five, so the set
reads as one shelf of images when scrolled past.

**Letter tiles** are the connective tissue: 3–5 per image, at 8–14% of canvas
height, rotated between −5° and +5°, never overlapping the focal object's
silhouette, at least one clipped by an edge. They sit *in front* of the scene
with the standard zero-blur offset shadow.

**Lighting** is flat. There is no light source, no cast shadows on the ground,
no ambient occlusion. Objects are separated by outline and colour only. The one
exception is Nightfall's lamp pool, which is a hard-edged shape, not a gradient.

### 7.1 Kitchen Table — `wh_pack_kitchen` — £1.99

- **Tint:** Coral `#FF6B4A`, text white, shadow `rgba(160,45,25,0.35)`
- **Blurb in app:** "Fifty about food, the kettle and the washing up."
- **Scene:** A kitchen table seen from slightly above and to the side. A
  chipped enamel teapot mid-pour, two mismatched mugs, a plate with a slice of
  cake, a wooden spoon resting on a folded tea towel. Steam drawn as two thin
  curling outlines — **outline only, never a soft white haze.**
- **Palette:** Coral-forward. Teapot in coral, cream `#FFF4E2` highlights,
  a single teal `#17A398` stripe on one mug so it belongs to the family.
  Background a warm coral wash, radial, lighter at the top.
- **Letter tiles to scatter:** `T` `E` `A` — plus `P` and `N` as decoys.
  (Real answers in this pack include *tea, cake, spoon, dish, bread*.)
- **Mood:** Mid-morning, someone has just sat down. Comfortable clutter, not mess.

- **Card crop check:** the teapot and one mug must survive the 1029×480 crop.

**Generation prompt**

> Flat vector illustration, no gradients on objects, thick warm dark-brown
> outlines (#3A2A18). A kitchen table scene viewed from slightly above and to
> the side. A chipped enamel teapot in coral (#FF6B4A) mid-pour, two mismatched
> mugs in cream (#FFF4E2) — one with a single teal (#17A398) stripe — a plate
> with a slice of cake, a wooden spoon on a folded tea towel. Steam drawn as
> two thin curling outlines only. Background a warm coral radial wash, lighter
> at the top. Scrabble-style letter tiles reading T, E, A scattered in the
> foreground, tilted a few degrees, each with a hard offset shadow and no blur.
> Left third of the image empty. Flat lighting, no cast shadows, no texture, no
> people, no faces. Cozy, hand-made, unhurried. Children's-book flatness.


### 7.2 Out of Doors — `wh_pack_outdoors` — £1.99

- **Tint:** Teal `#17A398`, text `#EAFFFC`, shadow `#0E7A72`
- **Blurb:** "Weather, water and things that grow. Fifty to take outside."
- **Scene:** A low hill in three flat overlapping bands — foreground grass,
  midground hill, far ridge. A single tree, slightly off-centre right. A stream
  as a simple teal ribbon. Above, three or four rounded clouds and a small
  amber sun `#FFB020` — **the one place amber is allowed in pack art**, because
  it is the sun and it ties the set to the brand.
- **Palette:** Teal and sage greens, cream sky, amber sun. No blue.
- **Letter tiles:** `R` `A` `I` `N` scattered as if falling, tilted.
- **Mood:** A bright still day just after rain. Clean, open, uncrowded.

- **Card crop check:** the tree and the sun must survive the crop; the stream may be cut.

**Generation prompt**

> Flat vector illustration, no gradients on objects, thick warm dark-brown
> outlines (#3A2A18). A low rolling hill built from three flat overlapping
> bands — foreground grass, midground hill, far ridge — in teal (#17A398) and
> sage green. One simple tree slightly right of centre. A stream as a plain
> teal ribbon. Above, four rounded clouds in cream and a small flat amber
> (#FFB020) sun. Cream sky, no blue anywhere. Letter tiles reading R, A, I, N
> scattered as if falling, each tilted a few degrees with a hard offset shadow
> and no blur. Left third empty. Flat lighting, no cast shadows, no texture, no
> people. Bright, still, clean, uncrowded.


### 7.3 Creatures — `wh_pack_creatures` — £1.99

- **Tint:** Amber `#FFB020`, text `#4A3000`, shadow `#D98A00`
- **Blurb:** "Fifty with something living in them — animals, and the bodies
  they come in."
- **Scene:** Four or five simple animals arranged in a loose row at different
  scales, as if posing for a group photo: a fox sitting, a duck, a snail, a bee
  mid-air, a frog. **Rounded, geometric, toy-like — two dots for eyes, no
  pupils, no expressions, no anthropomorphism.** They are shapes, not characters.
- **Palette:** Amber ground, warm browns, cream bellies, one coral accent
  (the fox), one teal accent (the frog).
- **Letter tiles:** `F` `O` `X` and a stray `B`.
- **Mood:** A shelf of wooden animal toys. Warm, still, a bit funny.

- **Card crop check:** at least four creatures must survive the crop.

**Generation prompt**

> Flat vector illustration, no gradients on objects, thick warm dark-brown
> outlines (#3A2A18). Five extremely simple geometric animals in a loose row at
> different scales, like a shelf of wooden toys: a sitting fox in coral
> (#FF6B4A), a duck, a snail, a bee in mid-air, a frog in teal (#17A398). Each
> animal is built from rounded geometric shapes with two small solid dots for
> eyes — no pupils, no mouths, no expressions, not anthropomorphic. Warm amber
> (#FFB020) background, warm browns, cream bellies. Letter tiles reading F, O,
> X scattered in the foreground, tilted, with hard offset shadows and no blur.
> Left third empty. Flat lighting, no cast shadows, no texture. Warm, still,
> quietly funny. Wooden toy, not cartoon mascot.

- **Risk to avoid:** cute-animal-mascot territory. If any creature looks like
  it could have a name, simplify it further.

### 7.4 The Workshop — `wh_pack_workshop` — £1.99

- **Tint:** Violet `#6E5AB8`, text white, shadow `#1C1040`
- **Blurb:** "Tools, materials and the shed. Fifty with their sleeves rolled up."
- **Scene:** A pegboard wall, straight on and flat. Hanging in a considered
  grid: a hammer, a hand saw, a wrench, a coil of rope, a spirit level. On a
  narrow shelf beneath, three jars of screws and a folded rule. Faint peg holes
  as a regular dot grid — this is the one asset allowed a repeating pattern.
- **Palette:** Violet board, cream and steel-grey tools with warm wooden
  handles, one amber jar lid.
- **Letter tiles:** `S` `A` `W` hung on pegs like the tools.
- **Mood:** Orderly, mid-project, everything has its place.

- **Card crop check:** hammer, saw and the jar shelf must survive the crop.

**Generation prompt**

> Flat vector illustration, no gradients on objects, thick warm dark-brown
> outlines (#3A2A18). A pegboard wall seen straight on and completely flat, in
> violet (#6E5AB8), with a faint regular grid of small peg holes. Hanging in a
> considered arrangement: a hammer, a hand saw, a wrench, a coil of rope, a
> spirit level — cream and steel-grey heads with warm wooden handles. A narrow
> shelf beneath holds three jars of screws, one with an amber (#FFB020) lid,
> and a folded ruler. Letter tiles reading S, A, W hung on pegs among the
> tools, slightly tilted, with hard offset shadows and no blur. Left third
> empty. Flat lighting, no cast shadows, no texture, no people. Orderly,
> mid-project, everything in its place.

- **Note:** Violet is the one tint with no light-theme token — it is written
  literally as `#6E5AB8` in `content/packs.ts`. Use that exact value.

### 7.5 Nightfall — `wh_pack_nightfall` — £2.49

- **Tint:** Slate `#3E5266`, text white, shadow `#1C1040`
- **Blurb:** "The indoor evening. Fifty quieter ones, and a little harder."
- **Scene:** A window at night from inside, sill in the foreground. Beyond it a
  deep indigo sky `#0C0718` with a small cream moon and three or four stars as
  simple four-pointed sparks. On the sill: a lit lamp casting a **hard-edged**
  amber pool of light (a shape, not a glow), a closed book, a mug.
- **Palette:** The dark theme. Indigo `#0C0718`, slate `#3E5266`, surface
  violet `#33206B`, cream `#FFF3DE` text, one amber lamp.
- **Letter tiles:** `M` `O` `N` in the dark-theme tile colours.
- **Mood:** The last hour of the day. Quiet, slightly cooler, still warm
  because of the lamp.

- **Card crop check:** the lamp, the moon and the book must survive the crop.

**Generation prompt**

> Flat vector illustration, no gradients on objects, thick cream outlines
> (#FFF3DE) on a dark scene. A window at night seen from inside, with a wide
> sill in the foreground. Beyond the glass, a deep indigo sky (#0C0718) with a
> small flat cream moon and four simple four-pointed stars. On the sill: a lit
> lamp casting a hard-edged amber (#FFB020) pool of light shaped as a solid
> geometric wedge — not a soft glow — a closed book, and a mug. Slate (#3E5266)
> window frame, violet (#33206B) interior surfaces. Letter tiles reading M, O,
> N in dark violet with cream letters, scattered on the sill, tilted, with hard
> offset shadows and no blur. Left third empty. Flat lighting, no cast shadows,
> no texture, no people. Quiet, cool, still warm because of the lamp.

- **This is the only pack image that uses the dark theme**, and it should be
  visibly the odd one out — it is priced higher and sold as the calm one.

### 7.6 The bundle — `wh_pack_bundle` — £7.99

One image, not five stacked. **All five tints as five overlapping rounded
cards fanned like a hand of cards**, each showing a sliver of its scene, coral
at the front through to slate at the back. Amber logo tile resting on top.
Same export sizes as a pack hero.

---

## 8. App icon & store icon

Already exists (`icon.png`, `adaptive-icon.png`) — specified here so a
re-cut matches.

- **Content:** the `HUG` row only — three amber tiles, rotated `+4°`, `−3°`,
  `+5°`. `WORD` does not fit legibly at 48px.
- **Background:** `#FFF4E2`. Android adaptive icon uses the same value.
- **Sizes:** 1024×1024 master. Android adaptive foreground 432×432 with the
  mark inside the central 66% safe circle — **this was already a bug once, the
  splash mark was clipped by circle-masking. Keep the safe area honest.**
- **Monochrome (Android 13 themed icons):** `adaptive-icon-monochrome.png`,
  pure white silhouette of the three tiles on transparent.

## 9. Splash

- `splash-icon.png` — wordmark, both rows, on `#FFF4E2`, `imageWidth: 288`,
  `resizeMode: contain`.
- `splash-icon-dark.png` — same on `#1A0F38`.
- **Must be square-safe with generous padding.** The 200px version was clipped;
  288 with padding is the fix. Do not tighten the crop.

## 10. Notification icon

- `notification-icon.png` — Android requires a **pure white silhouette on
  transparent**, no colour. Any colour is stripped and rendered as a white
  blob. Tint is applied by the OS from `#FFB020`.
- Simplest readable form: one tile outline with a `H` knocked out, 96×96.

---

## 11. Store listing assets

### 11.1 Google Play feature graphic — 1024×500

The most-seen image the product has. Layout, adapting the reference banners:

- Warm radial ground (`#FFE6B4` → `#FFF4E2`), glow top-centre.
- Wordmark centred in the middle third, at ~40% of the width.
- Letter tiles scattered toward both edges at brand angles, some cropped by
  the frame, sizes varying 0.5×–1×. **In focus.** No blur.
- Beneath the mark, one line in 12px-equivalent uppercase `0.18em`:
  `THREE WORDS. ONE WORD THAT HUGS THEM ALL.`
- No device frame, no screenshot, no badges, no "FREE", no starburst.

### 11.2 Screenshots — 1284×2778 (iOS 6.7"), 1080×1920 (Android)

Six, in this order, each with a caption band at the top in brand type:

1. **A level mid-solve.** Caption: "Three words. One word that hugs all three."
2. **The solve celebration**, compounds spelled out. "Snowball. Snowflake. Snowman."
3. **The level map**, showing progress. "Fifty levels, at your pace."
4. **The daily puzzle.** "A new one every day. Free, always."
5. **The packs screen**, all five tints visible. "Five packs when you want more."
6. **Stats / streak.** "No timer. No score. No way to lose."

Real screenshots on the real gradient. **Do not mock these up in Figma with
approximated colours** — the radial gradient is the thing that sells it and it
is very easy to flatten by accident.

### 11.3 App Store / Play listing icon

Same as §8, 1024×1024, no transparency, no rounded corners baked in.

---

## 12. In-app illustrations still needed

Small, single-colour-family, flat.

| Where | Subject |
|---|---|
| `/stats-empty` | An empty calendar grid, one square gently amber. |
| `/all-caught-up` | A closed book with a ribbon marker. |
| `/free-run-complete` | Fifty tiles arranged as a filled grid, the last one amber. |
| `/store-unreachable` | A shop shutter, half down. |
| `/offline-notice` | A cloud with a soft dashed underline. |
| `/+not-found` | A single tile face-down. |
| `/error` | A tile with a corner turned up. |

All at 240×240, transparent PNG plus SVG source, light and dark variants.

---

## 13. What does not exist and must not be created

- Any character, mascot, avatar or face.
- Any leaderboard, rank badge, trophy, medal, star rating or crown.
- Any timer, clock, hourglass, countdown, or heart/life/energy icon.
  **The energy system was removed in session 8. Art implying one would be
  advertising a feature the app does not have.**
- Any "limited time", "sale", "% off", or urgency device.
- Any loot box, spin wheel, chest, or gacha imagery.

---

## 14. Delivery

```
assets/
  brand/          logo lockups, SVG + PNG @1×2×3
  packs/
    kitchen/      card.png hero.png @3×, plus .svg source
    outdoors/
    creatures/
    workshop/
    nightfall/
    bundle/
  store/          feature-graphic.png, screenshots/
  illustrations/  <route>-light.svg, <route>-dark.svg
```

SVG source for everything vector. PNG exports at 1×, 2×, 3×. No JPEG anywhere —
this palette bands badly under JPEG and every asset has flat areas.
