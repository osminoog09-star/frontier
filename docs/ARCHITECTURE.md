# 🏗️ FRONTIER — Техническая архитектура

## Текущее состояние (Pre-Alpha)
- Один файл `frontier.html`: HTML + CSS + один большой `<script>` (~3000 строк).
- Глобальное состояние `G` (объект). Игровой цикл `gameLoop(ts)` через `requestAnimationFrame`.
- Рендер на 2D `<canvas>`. UI — DOM-элементы + Canvas-оверлеи.
- Сохранение в `localStorage` (формат v2: карта + сущности).
- Диагностика `Diag` + офлайн авто-тест `_harness.js` (Node + заглушки DOM/Canvas).

## Проблемы текущей структуры
- Монолит тяжело поддерживать месяц.
- Логика рендера/симуляции/UI переплетена.
- Нет явного разделения «симуляция ↔ представление» (нужно для сети).

## Целевая модульная структура (Неделя 1)
```
/src
  core.js      — состояние мира G, главный tick(dt), RNG (сид в состоянии)
  world.js     — генерация карты, террейн, автотайлинг, объекты (деревья/камни)
  pathfind.js  — A* по сетке, проходимость, ворота
  pawns.js     — модель пешки, нужды, ИИ-приоритеты, расписание, трейты, соц., болезни
  jobs.js      — система работ/резерваций, склад, носильщики, крафт
  combat.js    — снаряды, бой, укрытия, типы врагов, раны
  buildings.js — определения зданий, постройка, производство
  render.js    — отрисовка мира, спрайты, частицы, освещение, миникарта
  ui.js        — DOM-панели, меню, расписание, приоритеты, тосты
  audio.js     — Sfx (WebAudio), эмбиент, музыка
  save.js      — сериализация/миграции, облако (позже)
  diag.js      — диагностика и логи
  net.js       — (Неделя 3+) сетевой слой, команды, синхронизация
  main.js      — склейка, старт
/build
  frontier.html — собранная однофайловая версия (для file://)
```
- **Сборка:** простой скрипт-конкатенатор `build.js` (Node) склеивает `/src/*.js` + шаблон в один HTML.
  Сохраняем запуск по `file://` без сервера.
- Принцип: **симуляция (core/world/pawns/jobs/combat) не знает про DOM/Canvas.** Рендер и UI — отдельно.

## Симуляция
- Фиксированный логический шаг (например, 1 тик = 1/60 c условного времени), скорость = множитель шагов.
- Детерминизм (Неделя 3): RNG с сидом в состоянии, ввод как команды, без `Math.random()` в симуляции.
- Время: тики → минуты → часы → дни → сезоны → год.

## Модель данных (entities)
- `pawn`, `animal`, `enemy`, `building`, `item` (стопка на земле), `projectile`, `tile`.
- У каждой сущности `id` (из `G.nextId`), позиция, состояние.
- Карта: `G.map[y][x] = { type, obj, item?, walkable }`.

## Рендер-пайплайн
1. Очистка → камера (translate+scale по зуму).
2. Тайлы (с автотайлингом и сезонным тинтом) → объекты → предметы → здания → животные → враги → пешки → снаряды → частицы.
3. Экранные оверлеи: погода, день/ночь, миникарта, подсветка.
- Кэш: миникарта-террейн (`_miniBase`), статичные слои по возможности.

## Сохранение
- `localStorage['frontier_save']`, JSON, поле `v` (версия формата) + миграции.
- Сохраняем: карту (компактно), сущности, ресурсы, время, исследования, достижения, RNG-сид, камеру.
- Облако (Неделя 3): тот же сериализатор → отправка на сервер.

## Диагностика и тесты
- `Diag`: журнал действий игрока + детект аномалий (шкалы за пределами, NaN, скучивание, простой работ, стоящие чертежи).
- `_harness.js`: Node-прогон с заглушками — сценарии (бой, экономика, save/load, стройка+добыча). **0 аномалий = критерий сборки.**
- Правило: каждый баг от игрока → сначала воспроизводящий сценарий в harness, потом фикс.

## Сетевой слой (план, Неделя 3–4) — детали в MULTIPLAYER.md
- Клиент-команды → сервер (авторитет) → тик симуляции → снапшот/дельта клиентам.
- Стек: Node + `ws`, состояние в памяти, персист в SQLite/Postgres.

## Производительность
- Цель: 60 FPS при 80×60 карте, ~20–40 сущностей.
- Узкие места: per-tile рендер (батчить), сканы карты в диагностике (раз в N тиков), A* (кэш путей).

## Update 2026-06-02 - Implemented Architecture Notes
- Pathfinding: `setTarget()` now builds a grid path; `moveTowardsTarget()` follows cached waypoints. Open terrain uses a direct-line fast path before A*.
- Collision: completed `fence` buildings block walkability; `gate` buildings are explicitly passable.
- Targeting: if a requested target tile is blocked, pathfinding chooses a nearby walkable tile so work targets remain reachable.
- Save/load: loaded buildings are sanitized against restored terrain and existing footprints; invalid placements move to the nearest dry valid footprint.
- Tests: `_harness.js` Scenario E validates fence blocking, gate passability, path routing through gates, and pawn arrival.

### Next Architecture Work
- Add item entities/stacks and stockpile zones under the existing job reservation model.
- Keep simulation and rendering decoupled where possible before deeper module extraction.

## Update 2026-06-02 - Logistics Architecture Notes
- `G.items` now stores ground item stacks: `{ id, res, amount, tx, ty }`.
- `stockpile` is a passable storage building/zone and is placed at game start on a valid dry footprint.
- `tryHaul()` implements the transport job: reserve item, pick up up to 25 units, move to nearest stockpile, deposit into `G.res`.
- Save/load persists `items`; pawns can persist carried loads through the existing pawn serializer.
- Rendering now has a ground item layer and carried-load labels above pawns.
- Tests: Scenario F validates stockpile hauling end-to-end.

### Next Architecture Work
- Split global resources into stored resources vs production inputs gradually, starting with craft queues.
- Add stockpile filters only after the basic production chain is stable.

## Update 2026-06-02 - Diagnostics Runtime Guard
- Runtime JS errors and unhandled promise rejections are now captured into `Diag` and exported in diagnostic JSON.
- `gameLoop()` is guarded so a single render/tick error does not silently kill the simulation loop.
- `normalizeGameState()` repairs common corrupt-state cases from old saves or bad boot state.

## Update 2026-06-02 - Critical Browser Loop Fix
- Browser playability requires `startLoop()` to schedule `requestAnimationFrame` continuously.
- First-frame layout repair now calls `resizeCanvas()`, `normalizeGameState()`, `updateUI()`, and `render()` before entering the recurring frame loop.
- This class of bug was not caught by the Node harness because the harness invokes simulation/render functions directly; future browser smoke checks must confirm RAF is present in the bundled HTML.

## Update 2026-06-02 - Production Architecture Notes
- `RECIPES` is the first central recipe table. Current implemented recipe: `smithy` consumes `ore` and `wood`, then outputs `gold`.
- `tryCraft()` runs inside `doWork()` after higher-priority immediate work, so production uses pawns, station reservations, and work progress instead of passive day ticks.
- Craft reservations use a station tile key (`craft_tx_ty`) so multiple pawns do not work the same station recipe at once.
- Passive smithy income was removed from `onNewDay()`; production should now be explicit, testable, and resource-bound.
- Tests: Scenario G validates input consumption and output creation for smithy crafting.

### Next Architecture Work
- Add more recipes only after each one has a harness scenario.
- Consider separating stored resources from global counters once stockpile filters and inventories become more detailed.

## Update 2026-06-02 - Cooking Architecture Notes
- `kitchen` is now a recipe station using the same `RECIPES` and `tryCraft()` path as `smithy`.
- `RECIPES.kitchen` consumes `meat` and `wood`, then outputs `food`.
- Scenario H validates that the shared recipe flow works for a second station type, not just smithy.

### Next Architecture Work
- Surface station state (`craft.progress`, missing inputs) in UI before adding complex queues.

## Update 2026-06-02 - Production Feedback Architecture Notes
- `recipeStatusLines(building)` centralizes recipe station status text.
- `showBuildingInfo()` renders recipe input/output, missing resource state, and active craft progress.
- Scenario I covers the formatter directly so future station UI changes have a simple regression check.

### Next Architecture Work
- Add stockpile filter data on stockpile buildings, then update `tryHaul()` target selection to respect allowed resources.

## Update 2026-06-02 - Stockpile Filter Architecture Notes
- Stockpile buildings now carry a `filters` object keyed by resource id.
- `normalizeStockpileFilters()` keeps old saves compatible by defaulting missing filters to enabled.
- `nearestStockpileForRes(pawn, res)` centralizes filtered stockpile selection for hauling.
- `tryHaul()` ignores ground stacks that have no valid destination and deposits carried loads only into an allowed stockpile when one exists.
- Scenario J validates filtered hauling behavior.

### Next Architecture Work
- Add diagnostics for item stacks that are blocked by filters/no destination.

## Update 2026-06-02 - Logistics Diagnostics Architecture Notes
- `hasStockpileForRes(res)` checks whether any completed stockpile currently accepts a resource.
- `Diag.check()` now scans `G.items` for stranded stacks with no valid stockpile destination.
- The anomaly key is resource-specific (`haul_blocked_*`) to avoid log spam while still showing the blocked resource group.
- Scenario K covers this watchdog directly.

### Next Architecture Work
- Add station-level enabled/paused state to recipe buildings and make `tryCraft()` respect it.

## Update 2026-06-02 - Production Toggle Architecture Notes
- Recipe stations now support `craftEnabled`.
- `normalizeRecipeStation()` defaults missing state to enabled for save compatibility.
- `tryCraft()` filters out disabled stations before reservation/pathing.
- `showBuildingInfo()` renders a recipe enable/disable chip and re-renders after toggling.
- Scenario L verifies that disabled stations do not consume inputs and resumed stations craft normally.

### Next Architecture Work
- Add recipe queue depth or per-station desired output limits after public deployment is stable.

## Update 2026-06-02 - Public Mobile Web Architecture Notes
- The game is now published as static GitHub Pages content from repository root.
- `frontier.html` remains the playable build; `server.js` is only for local/LAN testing.
- Inline favicon prevents noisy 404 console errors on GitHub Pages.
- Mobile CSS hides the sidebar below 700px so the canvas remains usable on phones.

### Next Architecture Work
- Keep public URL smoke checks as part of release validation.

## Update 2026-06-02 - Production Output Limits Architecture Notes
- Recipe stations now support `craftLimit`.
- `normalizeRecipeStation()` keeps old saves compatible by defaulting missing/invalid limits to `0` (no limit).
- `tryCraft()` checks `craftLimit` before starting a new recipe but allows an already-running craft to finish.
- `showBuildingInfo()` exposes limit state and limit controls.
- Scenario M validates that limits block new consumption and raised limits resume crafting.

### Next Architecture Work
- Convert limit controls into presets/queue depth once the simple numeric limit is stable.
