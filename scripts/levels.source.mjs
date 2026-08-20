/**
 * Word Hug — the curated level source
 *
 * One line per puzzle:
 *   answer | clue:position, clue:position, clue:position | category | set
 *
 * `position` is where the CLUE sits relative to the ANSWER:
 *   b (before) → compound is  clue + answer   (fire + wood = firewood)
 *   a (after)  → compound is  answer + clue   (wood + work = woodwork)
 *
 * `set` is `free` or one of the five pack ids. **The free run and the packs
 * share no puzzles** — that was the session-7 bug: packs pointed at levels
 * 21–100 of the free bank, so anyone who bought one paid for puzzles they had
 * already played. Every answer below appears exactly once, in exactly one set,
 * and `scripts/level-check.mjs` fails the build if that stops being true.
 *
 * ── This file is the input, not the output ────────────────────────────────
 * `scripts/build-levels.mjs` reads it and emits `apps/native/content/levels.ts`
 * (the free run) and `apps/native/content/pack-levels.ts` (the five packs).
 * **Never edit those** — they are regenerated.
 *
 * ── On the themes ─────────────────────────────────────────────────────────
 * Broad by necessity, and the owner chose that trade knowingly. A Missing Link
 * answer needs three real compounds, and tight themes run dry fast: a probe of
 * strictly on-theme candidates found 26 food words, 19 creatures, 20 weather —
 * against a target of 50 each. So "Creatures" includes bodies and people,
 * "Kitchen Table" includes the whole domestic table, and so on. Some links are
 * a stretch and are marked `~` in the category column.
 *
 * ── Not validated content ─────────────────────────────────────────────────
 * `scripts/puzzle-check.mjs` is the only thing that can answer the two
 * questions a human cannot: is there a SECOND word that hugs all three clues,
 * and what is the real corpus frequency. **It has never been run against any
 * of these.** Everything here is a literate guess by comparison.
 */

export const LEVEL_SOURCE = `
# ── FREE — 50 ─────────────────────────────────────────────────────────────
# The whole free run. Mixed subjects on purpose: this is the shop window, so
# it shows the range rather than a single theme.
wood      | fire:b, work:a, land:a        | material   | free
snow      | ball:a, flake:a, man:a        | weather    | free
fire      | camp:b, works:a, place:a      | element    | free
house     | green:b, boat:a, light:b      | home       | free
water     | fall:a, melon:a, under:b      | element    | free
stone     | lime:b, wall:a, corner:b      | material   | free
sun       | flower:a, shine:a, rise:a     | sky        | free
ball      | room:a, eye:b, snow:b         | play       | free
book      | case:a, note:b, mark:a        | things     | free
hand      | bag:a, shake:a, second:b      | body       | free
light     | day:b, house:a, moon:b        | element    | free
moon      | light:a, honey:b, beam:a      | sky        | free
fish      | cat:b, bowl:a, gold:b         | animals    | free
foot      | ball:a, print:a, bare:b       | body       | free
rain      | bow:a, coat:a, drop:a         | weather    | free
star      | fish:a, light:a, super:b      | sky        | free
bird      | black:b, cage:a, song:a       | animals    | free
night     | mare:a, mid:b, fall:a         | time       | free
cake      | pan:b, cup:b, walk:a          | food       | free
milk      | shake:a, butter:b, man:a      | food       | free
road      | rail:b, side:a, block:a       | places     | free
key       | board:a, hole:a, turn:b       | things     | free
head      | ache:a, light:a, over:b       | body       | free
cup       | cake:a, tea:b, board:a        | home       | free
box       | mail:b, car:a, sand:b         | things     | free
side      | walk:a, out:b, road:b         | places     | free
time      | table:a, some:b, life:b       | time       | free
board     | card:b, walk:a, key:b         | things     | free
land      | main:b, mark:a, wood:b        | places     | free
ground    | back:b, under:b, work:a       | places     | free
card      | board:a, post:b, wild:b       | things     | free
eye       | ball:a, brow:a, bulls:b       | body       | free
air       | port:a, plane:a, mid:b        | element    | free
line      | life:b, on:b, up:a            | things     | free
case      | brief:b, suit:b, work:a       | things     | free
watch     | wrist:b, dog:a, stop:b        | things     | free
fall      | water:b, rain:b, out:a        | nature     | free
paper     | news:b, back:a, wall:b        | things     | free
word      | cross:b, pass:b, play:a       | things     | free
work      | home:b, shop:a, net:b         | things     | free
game      | board:b, show:a, keeper:a     | play       | free
sea       | food:a, shore:a, side:a       | nature     | free
back      | draw:b, ground:a, pack:a      | things     | free
down      | count:b, stairs:a, town:a     | time       | free
out       | side:a, break:a, black:b      | places     | free
over      | coat:a, head:a, left:b        | things     | free
room      | bath:b, mate:a, bed:b         | home       | free
way       | high:b, side:a, gate:b        | places     | free
man       | snow:b, kind:a, post:b        | people     | free
friend    | boy:b, girl:b, ship:a         | people     | free

# ── KITCHEN TABLE — 50 ────────────────────────────────────────────────────
# Food, drink, cooking, and the domestic table around it. Broad: the tight
# food-only pool is about 26 words, so this reaches out to the crockery, the
# washing up and the meals themselves.
tea       | pot:a, cup:a, spoon:a         | food       | kitchen
salt      | water:a, shaker:a, cellar:a   | food       | kitchen
honey     | moon:a, comb:a, bee:a         | food       | kitchen
sugar     | cane:a, plum:a, coat:a        | food       | kitchen
cheese    | burger:a, cake:a, board:a     | food       | kitchen
meat      | ball:a, loaf:a, sweet:b       | food       | kitchen
bean      | jelly:b, stalk:a, bag:a       | food       | kitchen
spoon     | tea:b, table:b, full:a        | home       | kitchen
fork      | pitch:b, lift:a, ful:a        | home       | kitchen
knife     | pen:b, jack:b, point:a        | home       | kitchen
dish      | cloth:a, washer:a, rag:a      | home       | kitchen
bowl      | fish:b, super:b, ful:a        | home       | kitchen
table     | time:b, cloth:a, spoon:a      | home       | kitchen
fruit     | grape:b, cake:a, ful:a        | food       | kitchen
pie       | mag:b, crust:a, bald:a        | food       | kitchen
cook      | book:a, ware:a, house:a       | food       | kitchen
bake      | house:a, ware:a, off:a        | food       | kitchen
plate     | name:b, ful:a, hot:b          | home       | kitchen
roll      | drum:b, over:a, coaster:a     | food       | kitchen
apple     | pine:b, sauce:a, cart:a       | food       | kitchen
grape     | fruit:a, vine:a, shot:a       | food       | kitchen
straw     | berry:a, man:a, board:a       | food       | kitchen
bar       | tender:a, code:a, crow:b      | home       | kitchen
sauce     | pan:a, apple:b, boat:a        | food       | kitchen
pepper    | mint:a, corn:a, box:a         | food       | kitchen
ginger    | bread:a, snap:a, root:a       | food       | kitchen
cob       | corn:b, web:a, nut:a          | food       | kitchen
pod       | pea:b, cast:a, seed:b         | food       | kitchen
seed      | pod:a, bird:b, ling:a         | food       | kitchen
dough     | nut:a, sour:b, boy:a          | food       | kitchen
jelly     | fish:a, bean:a, roll:a        | food       | kitchen
ice       | berg:a, box:a, breaker:a      | food       | kitchen
lime      | stone:a, light:a, sub:b       | food       | kitchen
lunch     | box:a, time:a, room:a         | food       | kitchen
break     | fast:a, down:a, out:b         | food       | kitchen
sweet     | meat:a, heart:a, corn:a       | food       | kitchen
wheat     | buck:b, germ:a, field:a       | food       | kitchen
pop       | corn:a, gun:a, up:a           | food       | kitchen
cloth     | dish:b, table:b, wash:b       | home       | kitchen
wash      | cloth:a, basin:a, room:a      | home       | kitchen
soap      | box:a, suds:a, stone:a        | home       | kitchen
pot       | tea:b, hole:a, jack:b         | home       | kitchen
pan       | cake:a, sauce:b, handle:a     | home       | kitchen
bread     | corn:b, crumb:a, winner:a     | food       | kitchen
butter    | milk:a, fly:a, cup:a          | food       | kitchen
egg       | shell:a, plant:a, nog:a       | food       | kitchen
nut       | shell:a, pea:b, coco:b        | food       | kitchen
pea       | nut:a, cock:a, shooter:a      | food       | kitchen
corn      | pop:b, bread:a, field:a       | food       | kitchen
berry     | blue:b, straw:b, black:b      | food       | kitchen

# ── OUT OF DOORS — 50 ─────────────────────────────────────────────────────
# Weather, water, land and the things growing on it. Reaches into farming and
# travel where the strict weather pool runs out.
wind      | mill:a, screen:a, whirl:b     | weather    | outdoors
storm     | brain:b, cloud:a, thunder:b   | weather    | outdoors
cloud     | storm:b, burst:a, thunder:b   | weather    | outdoors
frost     | bite:a, work:a, de:b           | weather    | outdoors
flood     | gate:a, light:a, plain:a      | weather    | outdoors
sky       | line:a, lark:a, scraper:a     | sky        | outdoors
shore     | sea:b, line:a, off:b          | nature     | outdoors
tide      | low:b, water:a, high:b        | nature     | outdoors
wave      | micro:b, length:a, heat:b     | nature     | outdoors
river     | bed:a, bank:a, side:a         | nature     | outdoors
lake      | side:a, front:a, bed:a        | nature     | outdoors
brook     | babbling:b, side:a, let:a     | ~nature    | outdoors
spring    | time:a, board:a, off:b        | nature     | outdoors
summer    | time:a, house:a, mid:b        | time       | outdoors
winter    | time:a, green:a, mid:b        | time       | outdoors
dust      | saw:b, bin:a, pan:a           | nature     | outdoors
field     | corn:b, work:a, battle:b      | places     | outdoors
farm      | house:a, yard:a, land:a       | places     | outdoors
camp      | fire:a, ground:a, site:a      | places     | outdoors
shell     | sea:b, fish:a, nut:b          | nature     | outdoors
sand      | box:a, storm:a, paper:a       | nature     | outdoors
mud       | slide:a, guard:a, bath:a      | nature     | outdoors
rock      | bed:a, slide:a, sham:b        | nature     | outdoors
hill      | side:a, top:a, up:b           | places     | outdoors
grass     | hopper:a, land:a, blue:b      | nature     | outdoors
leaf      | let:a, over:b, gold:b         | nature     | outdoors
root      | beet:b, ginger:b, less:a      | nature     | outdoors
branch    | out:a, off:a, tree:b          | ~nature    | outdoors
pine      | apple:a, cone:a, tree:a       | nature     | outdoors
weed      | sea:b, killer:a, tumble:b     | nature     | outdoors
flower    | sun:b, pot:a, bed:a           | nature     | outdoors
garden    | er:a, kitchen:b, roof:b       | ~places    | outdoors
path      | way:a, foot:b, tow:b          | places     | outdoors
trail     | blazer:a, off:a, nature:b     | ~places    | outdoors
bridge    | draw:b, foot:b, head:a        | places     | outdoors
gate      | way:a, flood:b, keeper:a      | places     | outdoors
cave      | man:a, in:a, dweller:a        | ~places    | outdoors
north     | east:a, ward:a, pole:a        | places     | outdoors
day       | birth:b, light:a, break:a     | time       | outdoors
week      | end:a, day:a, mid:b           | time       | outdoors
earth     | quake:a, worm:a, work:a       | nature     | outdoors
track     | race:b, back:a, side:a        | places     | outdoors
port      | air:b, sea:b, hole:a          | places     | outdoors
coast     | line:a, guard:a, sea:b        | nature     | outdoors
bank      | river:b, note:a, side:a       | places     | outdoors
stream    | down:b, up:b, line:a          | nature     | outdoors
tree      | top:a, house:a, line:a        | nature     | outdoors
log       | book:a, jam:a, back:b         | nature     | outdoors
smoke     | screen:a, stack:a, house:a    | ~nature    | outdoors
steam     | boat:a, roller:a, ship:a      | ~nature    | outdoors


# ── CREATURES — 50 ────────────────────────────────────────────────────────
# Animals, bodies and people. The strict-animal pool is about 19 words, so
# this takes in the body it lives in and the people around it.
horse     | sea:b, shoe:a, race:b         | animals    | creatures
dog       | watch:b, house:a, hot:b       | animals    | creatures
cat       | fish:a, walk:a, bob:b         | animals    | creatures
pig       | tail:a, pen:a, skin:a         | animals    | creatures
cow       | boy:a, girl:a, hide:a         | animals    | creatures
sheep     | dog:a, skin:a, fold:a         | animals    | creatures
fly       | butter:b, paper:a, dragon:b   | animals    | creatures
bug       | lady:b, fire:b, bear:a        | animals    | creatures
worm      | earth:b, hole:a, wood:b       | animals    | creatures
bee       | hive:a, keeper:a, honey:b     | animals    | creatures
fox       | glove:a, hole:a, hound:b      | animals    | creatures
frog      | man:a, spawn:a, bull:b        | animals    | creatures
crab      | apple:a, meat:a, grass:a      | animals    | creatures
mouse     | trap:a, hole:a, dor:b         | animals    | creatures
rat       | trap:a, race:a, mus:b         | animals    | creatures
tooth     | brush:a, ache:a, paste:a      | body       | creatures
hair      | cut:a, brush:a, style:a       | body       | creatures
boy       | cow:b, friend:a, bell:b       | people     | creatures
skin      | pig:b, deep:a, sheep:b        | body       | creatures
bone      | back:a, dry:a, wish:b         | body       | creatures
blood     | stream:a, hound:a, life:b     | body       | creatures
heart     | beat:a, burn:a, sweet:b       | body       | creatures
brain     | storm:a, wash:a, child:a      | body       | creatures
finger    | print:a, nail:a, tip:a        | body       | creatures
thumb     | nail:a, tack:a, screw:a       | body       | creatures
knee      | cap:a, deep:a, jerk:a         | body       | creatures
neck      | lace:a, tie:a, bottle:b       | body       | creatures
ear       | ring:a, drum:a, ache:a        | body       | creatures
face      | book:a, lift:a, sur:b         | body       | creatures
arm       | chair:a, pit:a, band:a        | body       | creatures
leg       | work:a, room:a, boot:b        | body       | creatures
tail      | pig:b, gate:a, coat:a         | animals    | creatures
horn      | pipe:a, shoe:b, long:b        | animals    | creatures
nest      | egg:a, bird:b, hornet:b       | animals    | creatures
duck      | ling:a, weed:a, board:a       | animals    | creatures
nail      | finger:b, thumb:b, toe:b      | body       | creatures
lip       | stick:a, read:a, sync:a       | body       | creatures
nose      | dive:a, bleed:a, brown:b      | body       | creatures
hound     | fox:b, blood:b, grey:b        | animals    | creatures
wing      | span:a, nut:a, tip:a          | animals    | creatures
wolf      | were:b, hound:a, bane:a       | animals    | creatures
goose     | bump:a, berry:a, neck:a       | animals    | creatures
crow      | bar:a, scare:b, foot:a        | animals    | creatures
lady      | bug:a, bird:a, like:a         | people     | creatures
child     | hood:a, brain:b, proof:a      | people     | creatures
mother    | grand:b, hood:a, land:a       | people     | creatures
father    | grand:b, hood:a, step:b       | people     | creatures
king      | fisher:a, dom:a, pin:a        | people     | creatures
body      | every:b, guard:a, work:a      | body       | creatures
mind      | master:b, set:a, ful:a        | body       | creatures


# ── THE WORKSHOP — 50 ─────────────────────────────────────────────────────
# Tools, materials, making and trade. Reaches into transport and machinery
# where the hand-tool pool runs out.
stick     | yard:b, chop:b, lip:b         | things     | workshop
brush     | tooth:b, hair:b, paint:b      | things     | workshop
paint     | brush:a, ball:a, work:a       | things     | workshop
mill      | wind:b, stone:a, saw:b        | places     | workshop
net       | work:a, ball:a, inter:b       | things     | workshop
trade     | mark:a, off:a, man:a          | things     | workshop
mark      | book:b, land:b, trade:b       | things     | workshop
screen    | wind:b, play:a, shot:a        | things     | workshop
shot      | screen:b, gun:a, snap:b       | things     | workshop
gun       | shot:a, fire:a, powder:a      | things     | workshop
rail      | road:a, way:a, hand:b         | places     | workshop
site      | camp:b, web:b, work:b         | places     | workshop
battle    | field:a, ship:a, axe:a        | things     | workshop
yard      | ship:b, court:b, stick:a      | places     | workshop
ship      | friend:b, yard:a, war:b       | things     | workshop
walk      | side:b, way:a, board:b        | places     | workshop
saw       | mill:a, dust:a, chain:b       | things     | workshop
screw     | driver:a, ball:a, cork:b      | things     | workshop
hammer    | sledge:b, head:a, jack:b      | things     | workshop
bolt      | thunder:b, lock:b, cutter:a   | things     | workshop
pin       | king:b, cushion:a, point:a    | things     | workshop
chain     | saw:a, mail:a, key:b          | things     | workshop
wheel     | barrow:a, chair:a, cart:b     | things     | workshop
gear      | box:a, shift:a, head:b        | things     | workshop
motor     | bike:a, way:a, cade:a         | things     | workshop
cart      | wheel:b, horse:b, load:a      | things     | workshop
brick     | work:a, layer:a, red:b        | material   | workshop
glass     | hour:b, house:a, eye:b        | material   | workshop
iron      | work:a, cast:b, clad:a        | material   | workshop
steel     | work:a, wool:a, stain:b       | material   | workshop
metal     | work:a, sheet:b, heavy:b      | material   | workshop
rubber    | band:a, neck:a, stamp:a       | material   | workshop
craft     | air:b, hand:b, ship:a         | things     | workshop
shop      | work:b, keeper:a, lift:a      | places     | workshop
store     | house:a, room:a, keeper:a     | places     | workshop
tool      | box:a, bar:a, kit:a           | things     | workshop
lock      | pad:a, smith:a, dead:b        | things     | workshop
beam      | moon:b, sun:b, cross:b        | material   | workshop
post      | card:a, man:a, sign:b         | things     | workshop
sign      | post:a, board:a, de:b         | things     | workshop
frame     | work:a, time:b, door:b        | things     | workshop
wire      | tap:a, less:a, hay:b          | material   | workshop
pipe      | line:a, dream:a, horn:b       | things     | workshop
tank      | top:a, er:a, think:b          | things     | workshop
lift      | fork:b, shop:b, off:a         | things     | workshop
switch    | board:a, blade:a, over:a      | things     | workshop
plug      | un:b, hole:a, spark:b         | things     | workshop

band      | rubber:b, wide:b, wagon:a     | things     | workshop
press     | news:b, up:a, ing:a           | things     | workshop
stamp     | rubber:b, ede:a, foot:b       | things     | workshop

# ── NIGHTFALL — 50 ────────────────────────────────────────────────────────
# Night, sleep, quiet and the indoor evening. The hardest pack — the ramp for
# this one starts where the free run ends.
bell      | blue:b, boy:a, door:b         | things     | nightfall
under     | stand:a, ground:a, wear:a     | places     | nightfall
bath      | room:a, tub:a, blood:b        | home       | nightfall
bed       | room:a, time:a, flower:b      | home       | nightfall
door      | bell:a, way:a, out:b          | home       | nightfall
news      | paper:a, cast:a, letter:a     | things     | nightfall
letter    | news:b, box:a, head:a         | things     | nightfall
court     | yard:a, house:a, room:a       | places     | nightfall
chair     | arm:b, wheel:b, man:a         | home       | nightfall
school    | pre:b, boy:a, master:a        | places     | nightfall
dark      | room:a, ness:a, after:b       | time       | nightfall
dream     | day:b, land:a, catcher:a      | time       | nightfall
sleep     | over:a, walker:a, less:a      | time       | nightfall
pillow    | case:a, talk:a, fight:a       | home       | nightfall
lamp      | post:a, shade:a, light:b      | home       | nightfall
shade     | sun:b, night:b, lamp:b        | home       | nightfall
window    | pane:a, sill:a, bay:b         | home       | nightfall
floor     | board:a, ground:b, dance:b    | home       | nightfall
wall      | paper:a, flower:a, fire:b     | home       | nightfall
stair     | up:b, down:b, case:a          | home       | nightfall
hall      | way:a, mark:a, town:b         | home       | nightfall
clock     | wise:a, work:a, o:b           | time       | nightfall
hour      | glass:a, half:b, rush:b       | time       | nightfall
mid       | night:a, way:a, summer:a      | time       | nightfall
after     | noon:a, math:a, thought:a     | time       | nightfall
noon      | after:b, fore:b, day:b        | time       | nightfall
bunk      | bed:a, house:a, de:b          | home       | nightfall
shadow    | over:b, box:a, play:a         | ~time      | nightfall
peace     | keeper:a, maker:a, time:a     | ~time      | nightfall
rest      | less:a, room:a, bed:b         | time       | nightfall
song      | bird:b, writer:a, swan:b      | ~time      | nightfall
story     | book:a, teller:a, line:a      | ~time      | nightfall
home      | town:a, work:a, sick:a        | home       | nightfall
town      | home:b, down:b, ship:a        | places     | nightfall
ring      | ear:b, tone:a, leader:a       | things     | nightfall
glow      | worm:a, after:b, stick:a      | ~time      | nightfall
torch     | light:a, blow:b, bearer:a     | things     | nightfall
read      | lip:b, proof:b, out:a         | ~time      | nightfall
page      | home:b, boy:a, ram:b          | things     | nightfall
print     | foot:b, finger:b, out:a       | things     | nightfall
write     | up:a, under:b, off:a          | ~time      | nightfall
note      | book:a, foot:b, pad:a         | things     | nightfall
pen       | knife:a, name:a, play:b       | things     | nightfall
ink       | well:a, blot:a, pot:a         | things     | nightfall
step      | door:b, foot:b, ladder:a      | home       | nightfall
stool     | foot:b, toad:b, bar:b         | home       | nightfall
guest     | house:a, room:a, book:a       | home       | nightfall
short     | hand:a, cut:a, bread:a        | ~time      | nightfall
soft      | ware:a, wood:a, ball:a        | ~time      | nightfall
set       | sun:b, mind:b, back:a         | time       | nightfall
`;
