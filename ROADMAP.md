# 🤠 FRONTIER — Роадмап разработки

Стратегия выживания в стиле RimWorld про ковбоев на Диком Западе.
Каждая версия — отдельный играбельный HTML-файл в папке `versions/`.
Главный файл `frontier.html` = последняя стабильная сборка.

> ## 🚩 Стадия проекта: **PRE-ALPHA**
> То, что сделано ниже (v1.0–v1.7.2) — это **прототип ядра**, не полноценная игра.
> Дальше работаем по **месячному поэтапному плану** к ALPHA (онлайн + кооп).
>
> ### 📚 Документация (`docs/`)
> - **[ROADMAP_MONTH.md](docs/ROADMAP_MONTH.md)** — месячный поэтапный план (Неделя 1–4 → Alpha)
> - **[DESIGN.md](docs/DESIGN.md)** — дизайн-документ (видение, столпы, механики)
> - **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** — тех. архитектура, модули, симуляция, тесты
> - **[ART.md](docs/ART.md)** — визуальный стайл-гайд (палитра, спрайты, эффекты)
> - **[AUDIO.md](docs/AUDIO.md)** — звук и музыка
> - **[MULTIPLAYER.md](docs/MULTIPLAYER.md)** — сеть, облако, кооп, глобальный мир
>
> ### Краткий месячный план
> - **Неделя 1 — Фундамент:** рефакторинг в модули, склад/носильщики, цепочки крафта, стены+ворота+A*, визуал-пасс 1.
> - **Неделя 2 — Контент:** лошади/ранчо, мебель/комнаты, боевая глубина, караваны/квесты, аудио-пасс, визуал-пасс 2.
> - **Неделя 3 — Онлайн-фундамент:** детерминизм+команды, save v2, бэкенд-скелет, облачные сейвы.
> - **Неделя 4 — ALPHA:** авторитетный сервер, кооп на двоих по интернету, облачные кооп-сейвы, дизайн глобального мира.
> - **После месяца:** глобальный персистентный мир с друзьями (см. MULTIPLAYER.md).

---

## История прототипа (Pre-Alpha, v1.x = внутренние сборки ядра)

## ✅ v1.0 — Фундамент (готово)
- Карта, пешки с ИИ, расписание, приоритеты работ
- Постройки, ресурсы, наука, животные, события, погода, сезоны
- Автобой, сохранение
- **Фиксы:** смещение клика при постройке, плавная генерация карты (биомы), подсветка/превью построек

## ✅ v1.1 — Графика (готово)
- [x] Нарисованные спрайты ковбоев (тело, жилет, шляпа, анимация ног/рук при ходьбе, у каждого свой цвет рубашки)
- [x] Нарисованные здания (ферма с грядками, салун с крышей, кузня с горном, колодец, палатка-лагерь и т.д.)
- [x] Деревья/камни с тенями и объёмом, надгробия
- [x] Плавный день/ночь цикл с освещением + тёплое свечение окон ночью
- [x] Чертёж-блюпринт пунктиром

## ✅ v1.2 — Играбельность (готово)
- [x] Понятная цель с прогресс-баром (HUD по центру сверху)
- [x] Стартовая подсказка-туториал (как добывать, строить, командовать)
- [x] Пауза + скорости x1/x2/x4
- [x] Первый день без бандитов/эпидемий — спокойный старт
- [ ] Склад (stockpile) и носильщики — перенесено в v1.3+
- [ ] Цепочки производства — перенесено

## ✅ v1.3 — Меню и фикс боя (готово)
- [x] **Починен автобой** — ковбои сами нападают на бандитов (был баг: застревали в состоянии fighting)
- [x] Правый клик по врагу = постоянная цель преследования
- [x] **Главное меню** с роадмапом, «Как играть», новой игрой и продолжением
- [x] Пауза под меню

## ✅ v1.4 — Бой (готово)
- [x] Огнестрел: пули летят, точность падает с дистанцией
- [x] Укрытия (за стенами/камнями/деревьями меньше шанс попадания, до −40%)
- [x] Типы врагов: Головорез (нож), Стрелок (револьвер), Главарь (толстый, +30💰)
- [x] Самозащита ковбоев + кайтинг (держат дистанцию)
- [x] Протестировано прогоном в Node (бой + 20k тиков экономики, 0 ошибок)
- [ ] Раны по частям тела, перевязка — перенесено в v1.5

## ✅ v1.5 — Камера и удобство (готово)
- [x] Миникарта (террейн, здания, пешки, враги) с кликом-переходом камеры
- [x] Зум колесом мыши к курсору + кнопки ＋／－／⊙
- [x] Полноэкранный режим
- [x] Обычный курсор вместо крестика, перетаскивание камеры с учётом зума
- [x] Протестировано прогоном в Node (рендер с зумом/миникартой, 0 ошибок)

## ✅ v1.6 — Жизнь колонии (готово)
- [x] 10 характеров (трейтов): Работяга, Лентяй, Храбрец, Трус, Оптимист, Пессимист, Выпивоха, Добряк, Жадина, Крепкий
- [x] Трейты влияют на скорость работы, макс. HP и настроение
- [x] Отношения: общение, дружба, ссоры (видно в логе и настроении)
- [x] Болезни (Лихорадка, Простуда, Дизентерия, Инфекция) с лечением медикаментами
- [x] Трейты в карточке пешки; совместимость старых сохранений
- [ ] Склад, носильщики, цепочки производства — перенесено в v1.7

## ✅ v1.6.1 — Диагностика и фиксы (готово)
- [x] Модуль Diag: журнал действий игрока + авто-детект аномалий (стат за пределами, NaN, скучивание, стоящие чертежи)
- [x] Кнопка 🐞 + экспорт лога в JSON; авто-проверки встроены в Node-прогон
- [x] Фикс: энергия уходила за максимум (445/100)
- [x] Фикс: пешки толпились на одной ферме/шахте — добавлены лимиты рабочих мест
- [x] Фикс: заложенные постройки не строились — стройка стала срочной

## ✅ v1.7 — Полировка (готово) — базовый релиз 1.0!
- [x] Процедурный звук (WebAudio): выстрелы, рубка, стройка, монеты, тревога, фанфары
- [x] 9 достижений с тостами, сохранением и экраном в меню
- [x] Тач-управление: палец-камера, два пальца-зум, тап-выбор
- [x] Баланс: волны бандитов растут со временем
- [x] Авто-тесты зелёные (0 аномалий)

---

## ✅ v1.7.1 — Фиксы и удобство (готово)
- [x] **Фикс сохранения: карта теперь персистится** (была критическая дыра — новая карта при загрузке, здания на воде)
- [x] Рисование заборов/сноса кистью (зажал ЛКМ и ведёшь)
- [x] Клик по пешке в правой панели → камера прыгает к ней
- [x] Вместимость лагеря (макс 3), остальные спят на месте
- [x] Авто-тест save/load round-trip (карта идентична, 0 зданий на воде)

## ✅ v1.7.2 — Фикс работ + умная диагностика (готово)
- [x] **Фикс: добыча/работа застревала при больших стройках** — все пешки бросали работу на стройку забора; теперь бригада строителей ограничена (~треть колонии, до 4)
- [x] Сторож добычи: ловит «помеченные камни/деревья не добываются» (срабатывает только при реальном простое, не во время подхода)
- [x] Сторож простоя: >60% пешек без дела при наличии работы
- [x] Авто-тест: большая стройка забора + помеченные камни → руда всё равно добывается

## ⏳ v2.0 — Оборона и контент (план)
- [ ] **Стены с коллизией + ворота** (забору нужна дверь; пешки и враги обходят/упираются) — требует пасфайндинга
- [ ] Склад и носильщики (ресурсы на земле)
- [ ] Караваны, торговый пост, лошади
- [ ] Сценарии/биомы, разные старты

## Журнал версий
- **v1.0** — базовая игра + фиксы карты и кликов
- **v1.1** — полностью рисованная графика (ковбои, здания, природа), день/ночь освещение
- **v1.2** — цель с прогрессом, туториал, пауза/скорости, спокойный первый день
- **v1.3** — главное меню с роадмапом, починен автобой
- **v1.4** — боевая система: огнестрел, укрытия, типы врагов, самозащита
- **v1.5** — миникарта, зум, полный экран, обычный курсор
- **v1.6** — характеры, отношения, болезни
- **v1.6.1** — система диагностики/логов + фиксы: энергия за 100, скучивание на работах, никто не строит
- **v1.7** — звук, достижения, тач-управление, баланс волн → **базовый релиз 1.0 готов 🎉**
- **v1.7.1** — фикс сохранения карты, забор-кистью, прыжок к пешке, вместимость лагеря
- **v1.7.2** — фикс простоя работ при больших стройках + сторожа добычи/простоя в диагностике

## Update 2026-06-02 - v1.8 Defense Slice
- [x] Created `versions/frontier-v1.8.html` as a tested build.
- [x] Added grid A* pathfinding with a fast direct-line path for open terrain.
- [x] Added fence collision: completed fences block pawns/enemies instead of being decorative.
- [x] Added passable gates and a build button for gates.
- [x] Added save/load building sanitation: invalid/legacy buildings are moved to nearest valid dry footprint.
- [x] Extended `_harness.js` with Scenario E: fence blocks, gate passes, path uses gate, pawn reaches target.
- [x] Regression harness green: 0 diagnostics anomalies, save/load round-trip clean, mining/building starvation guard clean.

### Next Autonomous Target
- [ ] Stockpile + hauling: ground item stacks, stockpile zones, hauler work type, buildings consume stored resources.
- [ ] Keep harness as release gate: every new slice must finish with 0 anomalies.

## Update 2026-06-02 - v1.9 Logistics Slice
- [x] Created `versions/frontier-v1.9.html` as a tested build.
- [x] Added stockpile building/zone with a build button.
- [x] Added ground item stacks for chopped wood, mined ore, hunted meat/food.
- [x] Enabled hauling work: pawns pick up item stacks and deposit them into stockpiles/resources.
- [x] Added rendering for stockpiles, ground stacks, and carried loads.
- [x] Save/load now persists ground item stacks.
- [x] Extended `_harness.js` with Scenario F: stockpile + hauling.
- [x] Regression harness green: Scenarios A-F pass with 0 diagnostics anomalies.

### Next Autonomous Target
- [ ] Production chains: make buildings consume stored resources and add basic craft queues for kitchen/smithy.
- [ ] Later: expand stockpile UX into painted zones and filters.

## Update 2026-06-02 - v1.9.1 Diagnostics Guard
- [x] Created `versions/frontier-v1.9.1.html` as a tested build.
- [x] Added runtime error capture: `window.onerror`, `unhandledrejection`, and guarded `gameLoop()` now log into `Diag`.
- [x] Diagnostic export now includes `runtimeErrors`.
- [x] Added `normalizeGameState()` to repair missing/invalid resources, camera, item arrays, runtime error arrays, and map shape.
- [x] Forced first boot `updateUI()` + `render()` after `newGame()` to avoid silent blank HUD/canvas startup states.
- [x] Regression harness green: Scenarios A-F pass with 0 diagnostics anomalies.

## Update 2026-06-02 - v1.9.2 Critical Playability Hotfix
- [x] Fixed browser build not starting the animation loop: `requestAnimationFrame(gameLoop)` was missing after prior refactors.
- [x] Added `startLoop()` with first-frame `resizeCanvas()`, `normalizeGameState()`, `updateUI()`, and `render()` after layout.
- [x] This addresses the black/empty world and non-playing state seen in browser screenshots.
- [x] Created `versions/frontier-v1.9.2.html` as the current playable hotfix build.
- [x] Regression harness still passes Scenarios A-F with no runtime errors.

## Update 2026-06-02 - v1.10 Production Chain Slice
- [x] Created `versions/frontier-v1.10.html` from the current playable build.
- [x] Added a first recipe table: `RECIPES.smithy` consumes stored `ore` + `wood` and produces `gold`.
- [x] Added pawn-driven crafting via `tryCraft()`; production now requires a worker and reserved station work.
- [x] Removed the old passive daily smithy gold income so production is no longer free/automatic.
- [x] Extended `_harness.js` with Scenario G: smithy crafting consumes inputs and creates output.
- [x] Regression harness green: Scenarios A-G pass, 0 diagnostics anomalies, no runtime errors.

### Next Autonomous Target
- [ ] Kitchen/cooking recipe: turn meat/food inputs into a more explicit meal/food loop.
- [ ] Stockpile filters and clearer production UX after the basic craft chain stays stable.
- [ ] Browser smoke gate: after each gameplay change, confirm bundled `frontier.html` still starts the RAF loop and has no mojibake in generated UI strings.

## Update 2026-06-02 - v1.11 Cooking Slice
- [x] Created `versions/frontier-v1.11.html` from the current playable build.
- [x] Added a `kitchen` building with a bottom-bar build button.
- [x] Added `RECIPES.kitchen`: consumes stored `meat` + `wood`, produces `food`.
- [x] Reused the same pawn-driven `tryCraft()` flow, so cooking is labor-bound and resource-bound.
- [x] Added a drawn kitchen structure so it is visible on the map.
- [x] Extended `_harness.js` with Scenario H: kitchen cooking consumes inputs and creates food.
- [x] Regression harness green: Scenarios A-H pass, 0 diagnostics anomalies, no runtime errors.

### Next Autonomous Target
- [ ] Production UX: show active recipe/progress and missing inputs in building tooltip/panel.
- [ ] Stockpile filters after production feedback is visible.
- [ ] Keep Chrome/file smoke + harness as the release gate for every gameplay slice.

## Update 2026-06-02 - v1.12 Production Feedback Slice
- [x] Created `versions/frontier-v1.12.html` from the current playable build.
- [x] Added `recipeStatusLines()` as a shared station status formatter.
- [x] Building info now shows recipe inputs/output for recipe stations.
- [x] Building info now shows missing inputs when a station cannot start.
- [x] Building info now shows current craft progress when a station is working.
- [x] Extended `_harness.js` with Scenario I: recipe line, missing-input line, and progress line are all present.
- [x] Regression harness green: Scenarios A-I pass, 0 diagnostics anomalies, no runtime errors.

### Next Autonomous Target
- [ ] Stockpile filters: allow storage rules per stockpile after production feedback is visible.
- [ ] Then make haulers respect filters and add harness coverage for filtered delivery.

## Update 2026-06-02 - v1.13 Stockpile Filter Slice
- [x] Created `versions/frontier-v1.13.html` from the current playable build.
- [x] Added per-stockpile resource filters for `food`, `wood`, `ore`, `meat`, `med`, and `gold`.
- [x] Stockpile info now shows clickable filter chips.
- [x] Haulers now choose stockpiles that allow the carried/item resource.
- [x] Old/new stockpiles normalize missing filters to "accept all" for save compatibility.
- [x] Extended `_harness.js` with Scenario J: ore is routed to the allowed stockpile and rejected by the blocked one.
- [x] Regression harness green: Scenarios A-J pass, 0 diagnostics anomalies, no runtime errors.
- [x] Chrome/file smoke green: filter chip toggles in the stockpile overlay.

### Next Autonomous Target
- [ ] Improve logistics visibility: show ground-item counts and filtered/blocked hauling state in diagnostics/UI.
- [ ] Then start queue depth or manual recipe pause/toggle for production stations.

## Update 2026-06-02 - v1.14 Logistics Diagnostics Slice
- [x] Created `versions/frontier-v1.14.html` from the current playable build.
- [x] Added `hasStockpileForRes()` for logistics destination checks.
- [x] Diagnostics now detect ground item stacks that no stockpile accepts because of filters.
- [x] Diagnostic anomaly explains which resource is blocked and how much is stranded.
- [x] Extended `_harness.js` with Scenario K: blocked meat stack creates a hauling anomaly.
- [x] Regression harness green: Scenarios A-K pass, expected Scenario K anomaly is detected, no runtime errors.
- [x] Chrome/file smoke green: diagnostic badge updates for blocked hauling.

### Next Autonomous Target
- [ ] Production station toggles: allow disabling/enabling a recipe station from its info panel.
- [ ] Then add harness/browser coverage for paused stations not consuming inputs.

## Update 2026-06-02 - v1.15 Production Station Toggle Slice
- [x] Created `versions/frontier-v1.15.html` from the current playable build.
- [x] Added `craftEnabled` state for recipe stations.
- [x] `tryCraft()` now skips disabled recipe stations.
- [x] Recipe station info panel now has a clickable enable/disable chip.
- [x] Disabled stations show `Станция: выключена` and do not consume inputs.
- [x] Extended `_harness.js` with Scenario L: paused station consumes nothing, resumed station crafts again.
- [x] Regression harness green: Scenarios A-L pass, expected Scenario K anomaly is detected, no runtime errors.

### Next Autonomous Target
- [ ] GitHub Pages/mobile publishing: keep public build online and smoke-test the public URL.
- [ ] Continue gameplay roadmap with more station control/queues after public access is stable.
