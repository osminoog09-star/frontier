# FRONTIER changelog

## v1.66 - Architect side menu (RimWorld-style, slice 2b)

- Категории построек переехали с нижних папок в боковую панель **«Архитектор»** слева (вертикальный аккордеон), как Architect в RimWorld.
- Внизу остался слим-тулбар только с «Отмена» и «Снести».
- ID кнопок сохранены — вся игровая логика/привязки не тронуты; срез чисто визуальный (HTML/CSS).
- Harness зелёный (A-BA, 53), GUARD чистый. Требует визуальной проверки в браузере.

## v1.65 - Floors raise room comfort

- Полы теперь влияют на уют комнаты (как красота пола в RimWorld).
- Комната, где полом покрыто >=60% клеток, получает бонус к настроению (+0.04 к delta).
- Панель комнат показывает строку «пол: <материал> <%>✔».
- Хелперы roomFloorInfo/roomIsFloored/anyFlooredRoom/roomFloorBonus вынесены чисто (тестируемо).
- Scenario BA: голая комната vs застеленная — рост бонуса и floored-флаг. Harness A-BA (53) green.

## v1.64 - Walls (RimWorld-style, slice 2a)

- Срез 2a перехода стройки на RimWorld: настоящие **стены из материалов**.
- 🧱 Стена (6 дерева) и 🪨 Каменная стена (6 руды) в папке «Оборона», рисуются кистью.
- Стены блокируют проход (A*), считаются стенами комнаты, рисуются цельным блоком с фаской/кладкой (не плоско).
- Прочность по материалу: каменная стена вдвое крепче деревянной (через getBuildingMaxHp).
- Scenario AZ: блокировка прохода, стена комнаты, прочность дерево<стена<камень. Harness A-AZ (52) green.

## v1.63 - Floors (RimWorld-style)

- Начат переход стройки на модель RimWorld. Первый срез: **полы**.
- Новые постройки: Деревянный пол (2 дерева) и Каменный пол (2 руды), отдельная папка «Полы».
- Полы рисуются кистью (drag), как чертёж; пешка-строитель настилает их по клетке (отдельный слой тайла, не блокирует, мебель может стоять сверху).
- Снос убирает готовый пол или незаконченный чертёж пола.
- Save/load сохраняют полы и их чертежи; старые сейвы нормализуются.
- Scenario AY: разметка пола, отказ на воде, постройка строителем, снос. Harness A-AY (51) green.

## 2026-06-02

### v1.62 - Building Sprite Polish

- Clinic and lab no longer look like flat white/blue boxes: added walls, a roof, a door/sign and an animated flask — they read as buildings.
- Code audit: confirmed all 20 building types have a custom drawStructure case (none falls to the default placeholder).
- Render-only; existing render-smoke scenarios stay green. A-AT green, guard OK.

### v1.61 - Herd Details Panel

- PC-first ranch/horse UX slice: the stats panel now shows a compact herd panel with tamed/wild horses, taming progress, stable/ranch counts, movement bonus, and daily ranch yield.
- Added `herdDetailRows()` so herd-panel data is testable and reusable without tying the scenario to DOM.
- Harness: Scenario AX validates no-stable feedback plus stable/ranch/tamed-horse speed and yield rows. A-AX (50) green.

### v1.60 - Room Details Panel

- PC-first room UX slice: the stats panel now shows a compact list of detected rooms with type, comfort, wall quality, size, and furniture counts.
- Added `roomDetailRows()` so room-panel data is testable without coupling the scenario to DOM rendering.
- Harness: Scenario AW validates readable room detail rows for bedroom and dining/decor rooms. A-AW (49) green.

### v1.59 - Room Wall Quality

- PC-first room slice: enclosed rooms now show wall/shape quality as `тесная защита`, `крепкие стены`, or `широкая комната`.
- Room type labels and stats now include both furniture quality and wall quality.
- Harness: Scenario AV validates compact vs spacious room wall quality and summary text. A-AV (48) green.

### v1.58 - Room Type Labels

- PC-first room slice: enclosed rooms now classify furniture layouts as `спальня`, `столовая`, `жилая комната`, or `украшенный угол`.
- Furniture overlays show the concrete room type plus room quality/score for the selected bed/table/decor.
- Stats now includes a readable room-type summary instead of only a generic room score.
- Harness: Scenario AU validates bedroom/dining/living-room labels, summary text, and open non-room fallback. A-AU (47) green.
- Mobile feature work is intentionally parked for about four weeks per user direction; current work returns to PC roadmap slices.

### v1.57 - Mobile Pawn Drawer

- Mobile builds now show a compact bottom-left drawer for pawns and the event log instead of losing that information with the hidden desktop sidebar.
- The drawer starts collapsed, opens with a small pawns button, switches between `Пешки` and `Лог`, and reuses the same pawn-card click/focus behavior as desktop.
- The drawer is sized to leave the 96px minimap clear on 390px mobile screens.
- Local mobile browser smoke: 390x844, build 1.57, pawn drawer/log tabs, no minimap overlap, no horizontal overflow, no console errors.

### v1.56 - Building Repair

- Builders now repair damaged completed buildings when there are no construction blueprints to build.
- `tryRepair()` claims damaged buildings, moves a builder to them, restores HP, and logs completion.
- This gives the colony a counterplay loop after arsonists or other building damage.
- Harness: Scenario AT validates damaged fence repair to full HP and no-op when nothing is damaged. A-AT (46) green.

### v1.55 - Marksman Research (combat)

- New research «Меткость»: +0.1 pawn hit chance and +6 shot damage. Extracted pawnHitChance()/pawnShotDamage() pure helpers used by fightEnemy.
- Harness: Scenario AS (research present, hit and damage rise with it). A-AS (45) green.

### v1.54 - Work Skill Leveling

- Pawns gain work XP while working and level up (cap 10); each level adds +4% work speed via wmul (up to +40%).
- Skill level shows in the pawn card (⭐N). Old saves safe (defaults via ||0).
- Harness: Scenario AR (XP accrual, level-up speeds work, cap 10, +40% at lvl 10). A-AR (44) green.

### v1.53 - Arsonist Enemy (attacks buildings)

- New enemy «Поджигатель» (🔥): targets the nearest building instead of pawns, damaging its HP and destroying it (breaching walls/defenses). Falls back to normal behavior if there are no buildings. Joins raids of 6+ (slot after boss/sniper).
- updateArsonist() with fire particles + log on destruction; building removal uses live walkability so paths reopen.
- Harness: Scenario AQ (def, fence destroyed by adjacent arsonist, present in big raid). A-AQ (43) green.

### v1.52 - Powder Barrel Trap (defense)

- New building «Бочка с порохом» (🛢️, defense group): explodes when an enemy comes within ~1.6 tiles, dealing area damage (radius ~3.2, up to 55, falling off with distance), then is consumed.
- updateBarrels() hooked into the sim loop; particles + alarm + log on detonation.
- Harness: Scenario AP (no early boom far away, explodes+consumed when enemies are close, AoE damage). A-AP (42) green.

### v1.51 - Sniper Enemy Type (combat depth)

- New enemy «Снайпер»: long range (11 tiles), high damage, slow reload, fragile. Joins big raids (a sniper covers raids of 5+, alongside the boss); not in small raids. Kill reward 14.
- Harness: Scenario AO (def params, big-raid sniper slot, small-raid absence). A-AO (41) green.

### v1.50 - Queued-Work Counter (visual pass 2)

- Stats panel now shows what is queued for work: 🪓 trees / ⛏️ rocks / 🎯 animals via markedSummaryText().
- Pure helper markedSummaryText() (built on countMarked). Harness: Scenario AN extended. A-AN (40) green.
- Public site index.html refreshed to current state (was stale at v1.44; earlier updates targeted .stat, site uses .badge). Added AGENTS rule to keep the site current each release.

### v1.49 - Marked-Resource Readability (visual pass 2)

- Marked trees/rocks/animals now have a pulsing highlight + a small job icon (🪓/⛏️/🎯), so the player
  clearly sees what's queued for chopping/mining/hunting.
- Added pure helpers `markPulseAlpha()` and `countMarked()` (trees/rocks/animals) for HUD/tests.
- Render-only; no gameplay systems touched.
- Harness: Scenario AN (countMarked + pulsing-highlight render smoke). A-AN (40) green.

### v1.48 - Work Animation (visual pass 2 start)

- Working pawns now swing a tool (animated handle + head, oscillating with the tick) instead of a static
  "⚒" glyph — chopping/mining/building reads at a glance.
- Extracted `stateGlyph(state)` as a pure helper (testable); fighting and downed keep their own visuals.
- Render-only change, isolated to drawPawn — no gameplay systems touched.
- Harness: Scenario AM (stateGlyph map + working-render smoke). A-AM (39) green.

### v1.47 - Mood Music (finishes the audio pass)

- Added a quiet mood music pad layered under ambient: calm (day), darker (night), tense (combat — when
  enemies are alive). Generative sustained chord via WebAudio, very low gain, restarts only on change.
- `musicProfile()` pure selector (combat > night > calm); `Sfx.setMusic()` safe no-op without audio.
- Sound 🔊 toggle now also stops ambient + music when turned off.
- Harness: Scenario AL (profile selection + setMusic smoke). A-AL (38) green.

### v1.46 - Housing Progression (beds make tents make sense)

- Fixed a design redundancy: with beds, the tent/camp felt pointless. Now there is a clear progression:
  ground(0) < tent/camp(1, early shelter) < lone bed(2) < **bed inside an enclosed room/house(3)**.
- A bed inside a fenced/gated room ("house") gives the best sleep (energy 5.2) plus the room mood bonus —
  giving the player a RimWorld-like reason to wall off a bedroom.
- Additive change: existing "bed=2" semantics preserved, so Codex's Scenario AC stays valid.
- Harness: Scenario AK (lone bed 2 vs bed-in-room 3, ordered sleep rates). A-AK (37) green.
- Design note + a small logic-review checklist added to docs/DESIGN.md.

### v1.45 - Ambient Audio (Week 2 audio pass)

- Added ambient sound layers driven by time/weather: light wind by day, quieter rustle at night,
  rain during rain/storm, howling during blizzard. Looping filtered-noise bed via WebAudio.
- `ambientProfile()` is a pure selector (hour/weather → day/night/rain/blizzard); `Sfx.setAmbient()`
  only restarts the loop when the profile changes; safe no-op without audio (Node/sound off).
- Hooked into `updateUI()`; toggled by the existing 🔊 button.
- Harness: Scenario AJ validates the profile selector + setAmbient smoke. A-AJ (36) green.

### v1.44-hotfix - Deterministic harness (fix flaky Scenario AC)

- FIX: Scenario AC (bed comfort sleep) was flaky — it ran 60 ticks of RNG-driven pawn AI and the pawn
  sometimes drifted off the bed tile, so comfort read 0 and the test failed. Because scenarios `throw`
  on failure, this intermittently aborted the WHOLE harness (AD–AI never ran). It only passed for Codex
  on a lucky run. Now the pawn is pinned each tick → deterministic. All 35 scenarios (A–AI) pass reliably.
- Added AGENTS.md rule: harness scenarios must be deterministic (no reliance on Math.random in AI).
- Game build unchanged (only `_harness.js`); current playable build remains v1.44.

### v1.44 - Basic Room Comfort

- Added first room recognition pass: furniture inside a small fenced/gated enclosure counts as room comfort.
- Room comfort contributes a small mood bonus and can add the "Хорошая комната" thought.
- Research/stats panel now shows room quality: label and 0-3 score.
- Furniture info overlays show whether the furniture is inside a closed room or not.
- Harness: Scenario AI validates open furniture vs enclosed room score, bonus, label, and thought.

### v1.43 - Build Bar Groups + Minimap Clearance

- Reviewed the latest screenshot from `fix/`: minimap overlapped the build area and the build bar took too much space.
- Grouped bottom build actions into folders: Food, Logistics, Defense, Town, Ranch, Home.
- Build folders open upward, close after choosing a building, and highlight when their selected building is active.
- Minimap/zoom controls now use the measured bottom bar height, so the minimap stays above build controls on desktop and mobile.
- Browser smoke: desktop 1600x900 and mobile 390x844, no horizontal overflow, no console errors, minimap clear of the bottom bar.

### v1.42 - Horse Taming Slice

- Added a visible herd state: wild horses, tamed horses, and taming progress.
- Completed Stables now tame wild horses over days; Ranches help the taming rate.
- Tamed horses add a small movement bonus and boost Ranch daily food/gold output.
- Stable/Ranch info overlays and the stats panel now show horse state.
- Save/load persists `herd`; old saves normalize it safely.
- Harness: Scenario AH validates no-stable no-taming, stable taming, ranch boost, and speed boost.

### v1.41 - Ranch Daily Yield

- Added **Ranch (Ранчо 🤠)** as the next horses/ranch slice.
- Ranches produce daily food and gold only when at least one Stable is built.
- Added ranch build button, map drawing, and info-overlay daily yield line.
- Harness: Scenario AG validates no-yield without stable and daily food/gold yield with stable support.

### v1.40 - Homestead Comfort Score

- Added a visible **Homestead Comfort** score from built bed/table/decor.
- A complete basic furniture set gives a small global mood delta bonus.
- Pawn thoughts can now show "Уютная усадьба" when the comfort set is complete.
- Stats panel now shows `Комфорт усадьбы: <label> (score/3)`.
- Harness: Scenario AF validates score 0→3, mood bonus, label, and thought.

### v1.39 - Decor Beauty Slice

- Added **Decor (Декор 🪴)** as the first beauty/room-feel slice.
- Pawns near built decor get a small mood delta bonus and a positive "Красивый уголок" thought.
- Added a drawn decor sprite, bottom build button, and building info line.
- Harness: Scenario AE validates the nearby beauty mood bonus and thought.

### v1.38 - Table Dining Comfort Slice

- Added the **Table (Стол 🍽️)** as the second furniture/rooms slice.
- Eating with a built table gives a small mood bonus and a positive "Ел за столом" thought.
- Added a drawn table sprite, bottom build button, and building info line.
- Harness: Scenario AD validates table dining comfort vs eating without a table.

### v1.37 - Beds Comfort Slice

- Added the **Bed (Кровать 🛏️)** as the first furniture/rooms slice.
- Sleeping pawns prefer a free bed over a camp.
- Sleeping near a bed restores energy faster and gives a small mood/comfort benefit.
- Added a drawn bed sprite, bottom build button, and building info line.
- Harness: Scenario AC validates bed comfort vs rough sleep and bed preference over camp.

### v1.36 - Public Site + Mobile Map Fix

- Rebuilt the public `index.html` into a clear Russian project/status page: playable link, done/next sections, weekly plan, and document links.
- Removed the old first-screen `Roadmap.md` / `Phone access` style navigation from the public site.
- Added `assets/site-game-preview.png` as a real gameplay preview for the site hero.
- Mobile game layout: minimap is smaller and raised above the bottom build bar; zoom buttons and keyboard hints are hidden on touch/mobile.
- Local Chrome smoke: 390x844 site and game have no horizontal overflow; game sidebar is hidden; console errors = 0.

### v1.35 - Horses: Stable & Mount Speed

- Added the **Stable (Конюшня 🐴)** building. Each completed stable gives the colony horses that speed up
  pawn movement by +15% (caps at +45% with 3 stables).
- New build button + drawn structure + `mountSpeedMul()` applied to non-sleeping movement.
- Harness: Scenario AB validates the speed bonus values (1 / 1.15 / 1.45) and a 400-tick sim with stables.
- First pass of Week 2 "horses/ranch"; ranch income & taming come later.

### v1.34 - Combat Depth: Downed State (Week 2 start)

- Pawns no longer die instantly at 0 HP — they fall **unconscious (downed)** and bleed out over time.
- A downed pawn can be **rescued**: another cowboy healing them with medicine raises HP; at 25+ HP they recover.
- No rescue → they bleed out and die; a second lethal hit **finishes off** a downed pawn immediately.
- Enemies ignore downed pawns and target standing cowboys instead.
- Downed pawns are drawn lying with a blood pool + red cross; sidebar shows "🩸 Без сознания".
- Added `GAME_VERSION` constant; roadmap panel badge reads it.
- Harness: Scenario AA validates down/rescue/finish-off/bleed-out. A-AA green; Scenario A (raid) still passes.

### v1.33 - Menu Scroll Fix + Clear Roadmap + Agent Coordination

- FIX: the main-menu left column was not scrollable — bottom buttons (site, diagnostics) were cut off on
  shorter screens. Added `overflow-y:auto` so all menu buttons are reachable.
- Rewrote the in-game roadmap panel: all Russian, fixed broken `<\span>`/`<\b>` tags, current statuses
  (Week 1 DONE, Week 2 NOW), version history grouped by milestone (v1.0–1.33), and a clear "what's next".
- Agent coordination: added `docs/WIP.md` (a lock listing in-progress tasks) and an AGENTS.md rule —
  read WIP before starting, mark tasks IN PROGRESS, leave PAUSED notes if interrupted so the other agent
  doesn't restart the same work.

### v1.32 - Pre-Week-2 Audit Pass

- Full audit before starting Week 2: harness A-Z green, encoding/sync guard OK, no mojibake, git clean.
- FIX: in-game menu version label was stale (`build 0.8.0`) vs actual v1.31 — synced to current build.
- Added a protocol rule: bump `menu-ver` in `frontier.template.html` on every version snapshot to avoid drift.
- Week 1 status confirmed: logistics, production chains, walls+gates+A*, particles/shoreline DONE.
  Deferred (optional): full module refactor, terrain autotiling — folded into later visual passes.

### v1.31 - Caravan Route Trade Bonus

- Caravan Route scenario now grants a +20% route bonus to all caravan deal outputs (stacks with `trading` research).
- The tradepost panel shows a "+20% к выдаче сделок" note in the Caravan Route scenario.
- Makes the scenario's caravan-deal goal feel rewarding and distinct.
- Harness: Scenario Z validates the +20% bonus (74 vs 62 food) and the UI note; Scenarios T/U still green.

### v1.30 - Reliable Sidebar Pawn Selection

- FIX: clicking a pawn card in the right sidebar sometimes did nothing — `renderPawns()` rebuilds the
  list via `innerHTML` every few ticks, and a rebuild between mousedown/mouseup cancelled the `click`
  (worse at x2/x4 speed). Now selection uses event delegation on `#pawn-list` (survives rebuilds).
- Clicking a card selects the pawn, centers the camera on it (`focusPawn`), and opens its priority panel.
- The selected pawn is now obvious on the map: a pulsing ring + a bobbing arrow above the head.
- Harness: Scenario Y validates that `focusPawn` selects the pawn and centers the camera on it.

### v1.29 - Gold Rush Economic Risk

- Gold Rush now escalates: early days (2-5) keep the food pressure; from day 4 (even days) claim-jumper raids spawn bandits drawn to the mine.
- Raid size scales with the day, raising tension as the player gets richer.
- Harness: Scenario X validates early food pressure and escalating claim raids (day 4 vs day 6).

### v1.28 - Fort Defense Waves + Hold Reward

- Fort Defense raids are now numbered, escalating waves: day 2 → wave 1/3 (2 enemies), day 3 → 2/3 (3), day 4 → 3/3 (4).
- Holding a wave pays off: from wave 2 the colony gets gold (+15, then +20) and medicine for surviving the previous wave.
- `stats.fortWavesHeld` tracks held waves; the fort objective text shows the count.
- Save/load normalizes `fortWavesHeld` for older saves.
- Harness: Scenario W validates wave numbering, escalation, and the hold reward; Scenario S still green.


### v1.27 - Caravan Deal UI Polish + Safe Build System

- Tradepost deal buttons now show the deal output directly in the row, not only in the tooltip.
- Insufficient-gold deals are dimmed and show how much gold is missing (`не хватает N💰`).
- Panel shows current gold and a short hint ("выбери сделку").
- A "last deal" line summarizes the most recent successful caravan trade (`G._lastCaravan`).
- Harness: Scenario V validates visible outputs, the insufficient-gold hint, and the last-deal line.

- ENCODING FIX: a manual PowerShell `Get-Content -Raw` sync corrupted `frontier.html` (UTF-8 read as
  CP1251 → double-encoded Cyrillic / кракозябры). Rebuilt `frontier.html` cleanly.
- New safe build: `build.js` (Node, UTF-8) assembles `frontier.html` from `frontier.template.html`
  (`__CORE__` marker) + `_core.js`, with a built-in mojibake guard that refuses to write garbled output.
- `_harness.js` now has an encoding+sync guard: fails if `frontier.html` has mojibake or is out of sync
  with `_core.js`. This whole bug class is now caught automatically by `node _harness.js`.
- Rule: sync ONLY via `node build.js`; never hand-edit the embedded `<script>` via PowerShell.

### v1.26 - Mobile Layout Hotfix

- Fixed phone layout for the public game page.
- Mobile game now hides the desktop sidebar at a wider breakpoint and on touch devices.
- Mobile canvas now uses the full viewport without horizontal overflow.
- Topbar desktop action buttons are hidden on phones so they do not leak over the map.
- Public site no longer embeds the game iframe on phones; it shows a fullscreen play card instead.
- Mobile smoke: 390px viewport, no horizontal scroll, sidebar hidden, canvas 390x790, no runtime errors.

### v1.25 - Tradepost Deal UI

- Tradepost info panel now shows caravan profile buttons.
- Each button shows profile name and gold cost.
- Button tooltip exposes profile output.
- Clicking a profile runs that caravan deal, updates resources, and refreshes the panel.
- Harness: Scenario U.

### v1.24 - Caravan Profiles

- Added `CARAVAN_PROFILES`: `mixed`, `food`, `medicine`, `materials`.
- `runCaravanTrade(profileId)` can now run deterministic caravan deals.
- Random caravan events choose profiles for Caravan Route and keep `mixed` for the default route.
- Trading research still boosts caravan outputs.
- Successful caravan profile trades increment `stats.caravanDeals`.
- Harness: Scenario T.

### v1.23 - Scenario Event Pressure

- Added scenario-specific event modifiers.
- Gold Rush loses a small amount of food on early days to create economic pressure.
- Fort Defense spawns early scouting raids on days 2 and 4.
- Caravan Route shortens the next caravan/event timer on even days.
- Added `scenarioEventDelay()` so Caravan/Fort/Gold Rush can use different event cadence.
- Harness: Scenario S.

### v1.22 - Scenario Goals

- Added scenario-specific objective logic.
- Settlers goal remains 500 gold.
- Gold Rush goal is 700 gold.
- Fort Defense goal is survival until day 5.
- Caravan Route goal is 3 caravan deals.
- Caravan trades now increment `stats.caravanDeals`.
- Objective HUD, pawn stats panel, win condition, and help text use the same scenario goal source.
- Save/load normalizes new stats fields for older saves.
- Harness: Scenario R.

### v1.21 - Start Scenarios

- Added `SCENARIOS`: `settlers`, `goldrush`, `fort`, `caravan`.
- Added scenario start menu.
- `newGame(scenarioId)` now applies selected starting profile.
- Gold Rush starts with more ore/gold and less food.
- Fort Defense starts with perimeter, gate, tower, and extra materials.
- Caravan Route starts with tradepost and trade gold.
- Save/load persists `scenario`.
- Harness: Scenario Q.
- Public Pages smoke: scenario menu works.

### v1.20 - Tradepost Caravan

- Added buildable tradepost.
- Added caravan trade helper: gold -> food/wood/medicine.
- `trading` research improves caravan output.
- Random events can trigger caravan trade.
- Rebuilt public site in Russian.
- Added `docs/TECH_ROADMAP.md`.
- Harness: Scenario P.

### v1.19 - Production Limit Presets

- Added x1/x3/x5 output limit presets for recipe stations.
- Harness: Scenario O.

### v1.18 - Stockpile Logistics UI

- Stockpile info shows ground stacks by resource.
- Stockpile info shows stacks blocked by filters.
- Harness: Scenario N.

### v1.17 - Production Output Limits

- Added `craftLimit` for recipe stations.
- Station panel shows limit state and limit controls.
- Harness: Scenario M.

### v1.16 - Public Mobile Web

- GitHub Pages live.
- Mobile CSS hides sidebar and gives canvas full phone width.
- Inline favicon prevents `/favicon.ico` 404 noise.

### v1.15 - Production Station Toggle

- Recipe stations can be enabled/disabled.
- Harness: Scenario L.

### v1.14 - Logistics Diagnostics

- Diagnostics report ground stacks that no stockpile accepts.
- Harness: Scenario K.

### v1.13 - Stockpile Filters

- Per-stockpile resource filters.
- Haulers respect filters.
- Harness: Scenario J.

### v1.12 - Production Feedback

- Station panel shows recipe, missing inputs, and progress.
- Harness: Scenario I.

### v1.11 - Cooking

- Added kitchen.
- Meat + wood -> food.
- Harness: Scenario H.

### v1.10 - Smithy Production

- Smithy uses recipe instead of passive daily income.
- Harness: Scenario G.
