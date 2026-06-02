# FRONTIER changelog

## 2026-06-02

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
