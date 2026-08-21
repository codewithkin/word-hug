# Word Hug — pack art & in-app illustrations

Extract into your Expo project's `assets/` folder. Nothing here needs a config
change: these are content images, loaded with `require()` at the point of use.

    assets/packs/            6 files, 960 × 540, opaque PNG (2× of a 480 × 270 design)
    assets/illustrations/   14 files, 480 × 480, PNG with alpha (2× of a 240 × 240 design)

## Packs

    pack-nightfall.png    indigo  #4A3193 on #251A5C
    pack-workshop.png     slate   #5E7288 on #3C4C5D
    pack-creatures.png    plum    #9B4A7E on #6C2E56
    pack-kitchen.png      paprika #C4432A on #8E2A17
    pack-outdoors.png     moss    #3F7D4E on #275834
    pack-bundle.png       all five, fanned, on cream #FFF4E2

Pack name and price are drawn by the app over the art, never baked in. Keep the
overlay inside a 56px margin (2× of 28px) — that area is clear in every file.
Each pack's tint pair doubles as its card and detail-header colour in the app.

## Illustrations

    empty-caught-up        archive with nothing left to play
    empty-no-packs         pack list / shop before the first purchase
    empty-offline          no connection
    empty-error            generic failure, failed restore
    empty-not-found        missing puzzle, dead deep link, empty search
    empty-update           forced-update wall, stats with no history
    empty-solved           puzzle complete, streak milestones

Each has a `-dark` counterpart. Light files use white tiles with the cream
shadow, dark files grape tiles with the deep-grape shadow; geometry is identical
between the pair, so a theme switch never moves anything. Amber #FFB020 and its
shadow #D98A00 are unchanged in both.

Both sets are drawn from the same material as the app: rounded tiles, hard
`0 Npx 0` drop shadows, flat fills, no gradients and no outlines. They can be
recoloured by swapping fills — no redraw needed.

Sources: `07 Pack Promo Art.dc.html`, `12 In-App Illustrations.dc.html`.
