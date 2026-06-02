# FRONTIER changelog

## 2026-06-02

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
