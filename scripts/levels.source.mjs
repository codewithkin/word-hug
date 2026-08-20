/**
 * Word Hug — the curated level source
 *
 * One line per puzzle: `answer | clue:position, clue:position, clue:position | category`
 * where `position` is where the CLUE sits relative to the ANSWER:
 *   b (before) → compound is  clue + answer   (fire + wood = firewood)
 *   a (after)  → compound is  answer + clue   (wood + work = woodwork)
 *
 * ── This file is the input, not the output ────────────────────────────────
 * `scripts/build-levels.mjs` reads it, derives difficulty, orders the levels
 * into the ramp, and emits `apps/native/content/levels.ts`. **Never edit the
 * emitted file** — it is regenerated and your change will vanish.
 *
 * ── Ordering here does not matter ─────────────────────────────────────────
 * The builder sorts by difficulty. Write them in whatever order they come to
 * mind; group them by theme if it helps. The one thing that DOES matter is
 * that an answer appears at most once, because the id is derived from it and a
 * duplicate id would collide two levels' progress records.
 *
 * ── Not validated content ─────────────────────────────────────────────────
 * `scripts/puzzle-check.mjs` is the only thing that can answer the two
 * questions a human cannot: is there a SECOND word that hugs all three clues,
 * and what is the real corpus frequency. Run it before shipping. Everything
 * here is a literate guess by comparison.
 */

export const LEVEL_SOURCE = `
wood      | fire:b, work:a, land:a        | material
snow      | ball:a, flake:a, man:a        | weather
fire      | camp:b, works:a, place:a      | element
house     | green:b, boat:a, light:b      | home
water     | fall:a, melon:a, under:b      | element
stone     | lime:b, wall:a, corner:b      | material
sun       | flower:a, shine:a, rise:a     | sky
ball      | foot:b, room:a, snow:b        | play
book      | case:a, note:b, mark:a        | things
hand      | bag:a, shake:a, second:b      | body
light     | day:b, house:a, moon:b        | element
moon      | light:a, honey:b, beam:a      | sky
shell     | sea:b, fish:a, nut:b          | nature
fish      | cat:b, bowl:a, gold:b         | animals
foot      | ball:a, print:a, bare:b       | body
rain      | bow:a, coat:a, drop:a         | weather
star      | fish:a, light:a, super:b      | sky
bird      | black:b, house:a, song:a      | animals
night     | mare:a, mid:b, fall:a         | time
bell      | blue:b, boy:a, door:b         | things
cake      | pan:b, cup:b, walk:a          | food
milk      | shake:a, butter:b, man:a      | food
road      | rail:b, side:a, block:a       | places
key       | board:a, hole:a, turn:b       | things
horse     | sea:b, shoe:a, race:b         | animals
head      | ache:a, light:a, over:b       | body
cup       | cake:a, tea:b, board:a        | home
box       | mail:b, car:a, sand:b         | things
berry     | blue:b, straw:b, black:b      | food
side      | walk:a, out:b, road:b         | places
time      | table:a, some:b, life:b       | time
board     | card:b, walk:a, key:b         | things
land      | main:b, mark:a, wood:b        | places
ground    | back:b, under:b, work:a       | places
card      | board:a, post:b, wild:b       | things
eye       | ball:a, brow:a, bulls:b       | body
air       | port:a, plane:a, mid:b        | element
line      | life:b, on:b, up:a            | things
case      | brief:b, suit:b, work:a       | things
watch     | wrist:b, dog:a, stop:b        | things
fall      | water:b, rain:b, out:a        | nature
paper     | news:b, back:a, wall:b        | things
word      | cross:b, pass:b, play:a       | things
work      | home:b, shop:a, net:b         | things
game      | board:b, show:a, keeper:a     | play
sea       | food:a, shore:a, side:a       | nature
back      | draw:b, ground:a, pack:a      | things
down      | count:b, stairs:a, town:a     | time
out       | side:a, break:a, black:b      | places
over      | coat:a, head:a, left:b        | things
under     | stand:a, ground:a, wear:a     | places
room      | bath:b, mate:a, bed:b         | home
bath      | room:a, tub:a, blood:b        | home
bed       | room:a, time:a, flower:b      | home
door      | bell:a, way:a, out:b          | home
way       | high:b, side:a, gate:b        | places
walk      | side:b, way:a, board:b        | places
man       | snow:b, kind:a, post:b        | people
boy       | cow:b, friend:a, bell:b       | people
friend    | boy:b, girl:b, ship:a         | people
ship      | friend:b, yard:a, war:b       | things
yard      | ship:b, court:b, stick:a      | places
stick     | yard:b, chop:b, lip:b         | things
brush     | tooth:b, hair:b, paint:b      | home
tooth     | brush:a, ache:a, paste:a      | body
hair      | cut:a, brush:a, style:a       | body
paint     | brush:a, ball:a, work:a       | things
news      | paper:a, cast:a, letter:a     | things
letter    | news:b, box:a, head:a         | things
pot       | tea:b, hole:a, jack:b         | home
pan       | cake:a, sauce:b, handle:a     | home
bread     | corn:b, crumb:a, winner:a     | food
butter    | milk:a, fly:a, cup:a          | food
fly       | butter:b, paper:a, dragon:b   | animals
bug       | lady:b, fire:b, bear:a        | animals
dog       | watch:b, house:a, hot:b       | animals
cat       | fish:a, walk:a, bob:b         | animals
pig       | tail:a, pen:a, skin:a         | animals
cow       | boy:a, girl:a, hide:a         | animals
sheep     | dog:a, skin:a, fold:a         | animals
egg       | shell:a, plant:a, nog:a       | food
nut       | shell:a, pea:b, coco:b        | food
pea       | nut:a, cock:a, shooter:a      | food
corn      | pop:b, bread:a, field:a       | food
field     | corn:b, work:a, battle:b      | places
battle    | field:a, ship:a, axe:a        | things
camp      | fire:a, ground:a, site:a      | places
site      | camp:b, web:b, work:b         | places
net       | work:a, ball:a, inter:b       | things
court     | yard:a, house:a, room:a       | places
farm      | house:a, yard:a, land:a       | places
mark      | book:b, land:b, trade:b       | things
trade     | mark:a, off:a, man:a          | things
mill      | wind:b, stone:a, saw:b        | places
wind      | mill:a, screen:a, whirl:b     | weather
screen    | wind:b, play:a, shot:a        | things
shot      | screen:b, gun:a, snap:b       | things
gun       | shot:a, fire:a, powder:a      | things
rail      | road:a, way:a, hand:b         | places
chair     | arm:b, wheel:b, man:a         | home
`;
