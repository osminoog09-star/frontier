# 🤠 FRONTIER — Месячный роадмап (поэтапно)

> Статус проекта: **PRE-ALPHA**. То, что есть сейчас (single-player колония-симулятор) — это прототип ядра.
> Цель месяца: довести до **ALPHA** = играбельная одиночная игра с глубиной + основа сетевой игры
> (облачные сохранения и кооператив на двоих). Дальше (за пределами месяца) — **глобальный
> персистентный мир** с друзьями.

Версионирование стадий:
- **Pre-Alpha** (сейчас): сборки 0.8.x — укрепляем ядро, контент, визуал, звук.
- **Alpha** (конец месяца): 0.9.x — онлайн-фундамент, кооп на двоих, облако.
- **Beta → 1.0** (после месяца): глобальный мир, много игроков, баланс, релиз.

Каждый шаг = отдельная протестированная сборка в `versions/`. Главный `frontier.html` = последняя стабильная.
Каждая сборка проходит авто-прогон в Node (`_harness.js`) — 0 аномалий обязательно.

---

## 🗓️ НЕДЕЛЯ 1 — Фундамент и глубина (single-player core)

Цель: игра становится «настоящей» — есть логистика, цепочки, оборона, заметно лучше графика.

### 1.1 Рефакторинг архитектуры (подготовка к месяцу работы)
- Разбить монолит `frontier.html` на модули (`/src/*.js`): `core` (состояние, цикл), `world` (карта, генерация),
  `pawns` (ИИ, нужды), `combat`, `render`, `ui`, `audio`, `save`, `diag`.
- Ввести явную модель данных (entities) и единый `tick(dt)`.
- Сохранить однофайловую сборку для игры (склейка модулей) — чтобы открывалось по `file://`.
- *Зачем:* месяц правок в одном 3000-строчном файле = боль; модули + сборщик.

### 1.2 Склад и носильщики (логистика)
- Предметы лежат на земле (дерево/руда/еда/мясо как стопки).
- Зоны склада (stockpile). Носильщик (работа «Перевозка») таскает в склад.
- Здания берут ресурсы со склада; без склада ресурсы гниют/теряются.
- *Визуал:* стопки ресурсов, зоны подсвечены.

### 1.3 Цепочки производства
- Кузня: руда + дерево → инструменты (+скорость работ), оружие (револьверы для боя).
- Кухня: сырьё → готовая еда (больше насыщения и настроения).
- Рецепты, очередь крафта, рабочие места «крафт».

### 1.4 Стены с коллизией + ворота + пасфайндинг (A*)
- Настоящий A* по сетке; стены/вода блокируют, ворота пропускают своих.
- Враги штурмуют ворота/ломают стены. Забор получает дверь.
- *Зачем:* оборона перестаёт быть декоративной.

### 1.5 Визуальный пасс 1
- Автотайлинг террейна (плавные переходы трава↔песок↔вода, береговая линия).
- Частицы: пыль при рубке/добыче/стройке, вспышки выстрелов, искры в кузне.
- Лучшее освещение день/ночь, мягкие тени.

**Итог недели 1:** Pre-Alpha 0.8.5 — логистика, крафт, оборона, ощутимо лучше картинка.

---

## 🗓️ НЕДЕЛЯ 2 — Контент и «соковитость» (game feel)

Цель: в игру интересно играть дольше 20 минут; она про ковбоев по-настоящему.

### 2.1 Лошади и ранчо (ковбойская фишка)
- Приручение животных, загон, верховая езда (быстрее перемещение, бой верхом).
- Скот → молоко/мясо/кожа; ранчо как источник дохода.

### 2.2 Мебель и комнаты
- Кровати (качество сна), столы/стулья (еда за столом = настроение), декор.
- Распознавание комнат (спальня, столовая) и их «красота».

### 2.3 Боевая глубина
- Ближний бой, динамит/гранаты, «ранен/без сознания» вместо мгновенной смерти, спасение раненых.
- Типы врагов расширить: снайпер, поджигатель, банда с боссом-дуэлянтом.

### 2.4 Экономика и события-квесты
- Караваны-торговцы с ассортиментом и торгом.
- Цепочки событий (квесты): спасти поселенца, защитить караван, награда.
- Репутация с фракциями (бандиты, аборигены, кавалерия).

### 2.5 Аудио-пасс
- Эмбиент: ветер днём, сверчки ночью, дождь.
- Музыка: 2-3 трека (спокойный/напряжённый бой/победа) — генеративные или лёгкие лупы.
- Расширить SFX (шаги, постройка, торговля, ржание лошади).

### 2.6 Визуальный пасс 2
- Полировка UI (тема, иконки, анимации панелей).
- Анимации пешек: работа киркой/топором/выстрел.
- Эффекты погоды и сезонов сочнее.

**Итог недели 2:** Pre-Alpha 0.8.9 — насыщенный одиночный геймплей, звук и музыка, живые ковбои.

---

## 🗓️ НЕДЕЛЯ 3 — Подготовка к онлайну (architecture for net)

Цель: симуляция готова к сети, есть бэкенд-скелет и облачные сохранения.

### 3.1 Детерминизм и команды
- Перевести ввод игрока в «команды» (place_build, set_priority, mark_tree…).
- Симуляция применяет команды детерминированно (фикс. шаг, сид RNG в состоянии).
- *Зачем:* база и для облака (реплей), и для сетевого согласования.

### 3.2 Save v2 (облако-готовый)
- Версионированная схема, миграции, компактный бинарный/JSON формат.
- Полное состояние мира (карта, сущности, RNG-сид, команды-история).

### 3.3 Бэкенд-скелет
- Стек: **Node.js + ws (WebSocket)**, состояние комнат в памяти, персист в **SQLite/Postgres**.
- Эндпоинты: создать/загрузить колонию (cloud save), список сейвов.
- Локальная игра продолжает работать оффлайн (без сервера).

### 3.4 Идентичность
- Без регистрации: device-id (localStorage) → опционально аккаунт (ник + код).
- Привязка облачных сейвов к id.

**Итог недели 3:** Pre-Alpha 0.9.0 — оффлайн как раньше, но симуляция детерминирована, есть сервер и облачные сейвы.

---

## 🗓️ НЕДЕЛЯ 4 — ALPHA: кооп на двоих + облако

Цель: играем с другом по интернету на общей карте, прогресс сохраняется в облаке.

### 4.1 Авторитетный сервер
- Сервер держит симуляцию комнаты, тикает, рассылает снапшоты/дельты.
- Клиенты шлют команды; клиентское предсказание + сглаживание.

### 4.2 Комнаты и приглашение
- Создать игру → код/ссылка → друг подключается.
- 2 игрока управляют одной колонией (общие пешки) ИЛИ соседними колониями на одной карте (решим по дизайну — см. MULTIPLAYER.md).

### 4.3 Облачные сейвы кооп-мира
- Автосейв состояния комнаты на сервер; продолжить позже вдвоём.

### 4.4 Задел под глобальный мир
- Дизайн персистентного мира (регионы/шарды, много колоний, торговля между игроками).
- Частичная реализация: один общий серверный мир-песочница (демо).

**Итог недели 4 = ALPHA 0.9.x:** кооп на двоих по интернету, облачные сохранения, дизайн глобального мира готов.

---

## 🌍 ПОСЛЕ МЕСЯЦА — путь к Beta/1.0
- **Глобальный персистентный мир:** общий сервер, регионы-шарды, у каждого игрока колония,
  караваны и торговля между реальными игроками, опциональные набеги (PvE/PvP).
- Аккаунты, друзья, лобби, чат.
- Балансировка, античит (сервер-авторитет), масштабирование, хостинг (VPS/Docker).
- Туториал-кампания, достижения, моддинг.

---

## Принципы работы на месяц
1. **Каждый шаг — играбельная протестированная сборка.** Ничего «висящего».
2. **Визуал и звук — не в конце, а в каждом этапе** (игрокам важно «вкусно»).
3. **Диагностика ловит регрессии** — авто-тесты обязательны.
4. **Оффлайн всегда работает** даже после введения сети.
5. **Документация живая** — обновляется вместе с кодом (`docs/`).

## Update 2026-06-02 - v1.42 Horse Taming
- Done: конюшни теперь приручают диких лошадей через дневной прогресс.
- Done: добавлено состояние табуна (`wild`, `tamed`, `tameProgress`) с нормализацией старых сейвов.
- Done: приручённые лошади усиливают скорость ковбоев и дневной доход ранчо.
- Done: info-overlay конюшни/ранчо и stats показывают состояние лошадей.
- Done: `_harness.js` включает Scenario AH; полный harness A-AH зелёный.

### Next Step
- Маленький срез Недели 2: комнаты/стены жилья, загоны/скот, audio-pass или визуальная читаемость.

## Update 2026-06-02 - v1.43 Build UI Fix
- Done: по скрину из `fix/` исправлено перекрытие миникарты и нижней панели строительства.
- Done: строительство сгруппировано в папки (еда, логистика, оборона, город, ранчо, дом).
- Done: миникарта использует реальную высоту bottom bar и держится выше панели на desktop/mobile.
- Done: browser smoke 1600x900 и 390x844 зелёный, без горизонтального вылета и console errors.

### Next Step
- Продолжить маленький срез Недели 2: комнаты/стены жилья, загоны/скот, audio-pass или визуальная читаемость.

## Update 2026-06-02 - v1.44 Basic Room Comfort
- Done: первый room-recognition для мебели внутри замкнутой зоны из забора/ворот.
- Done: room-score виден в stats и даёт небольшой mood-бонус.
- Done: overlay кровати/стола/декора показывает, закрыта ли мебель стенами.
- Done: `_harness.js` включает Scenario AI; полный harness A-AI зелёный.

### Next Step
- Продолжить Неделю 2 маленьким срезом: загоны/скот, compact animal panel, audio-pass или расширение типов комнат.

## Update 2026-06-02 - v1.56 Building Repair
- Done: принят PAUSED-срез Claude по ремонту построек.
- Done: строители чинят повреждённые готовые здания после поджигателя/урона.
- Done: Scenario AT покрывает ремонт повреждённого забора до полного HP и no-op без повреждений.
- Done: полный harness A-AT зелёный.

### Next Step
- Продолжить Неделю 2 маленьким срезом: загоны/скот, compact animal panel, автотайлинг или mobile UX.

## Update 2026-06-02 - v1.57 Mobile Pawn Drawer

- Done: mobile-only drawer gives phones access to pawn cards and the event log while desktop keeps the sidebar.
- Done: drawer opens/collapses, switches `Пешки`/`Лог`, and stays left of the minimap on 390px.
- Done: local mobile browser smoke covers build 1.57, drawer tabs, pawn/log content, no horizontal overflow, no console errors.

### Next Step
- Mobile work is paused for about four weeks by user direction; continue PC-first Week 2 content.

## Update 2026-06-02 - v1.58 Room Type Labels

- Done: closed furniture rooms are classified as bedroom, dining room, living room, or decorated corner.
- Done: stats and furniture overlays now expose room type plus room quality score.
- Done: `_harness.js` includes Scenario AU; full harness A-AU is green.

### Next Step
- Continue PC roadmap: animal pens/livestock, wall quality, room panel, autotiling, or desktop UI polish.

## Update 2026-06-02 - Week 1 Status
- Done: defense/pathfinding slice from Week 1 is now implemented as `versions/frontier-v1.8.html`.
- Done: fences are real blockers; gates are passable; A* routes around blockers and through gates.
- Done: save/load now sanitizes invalid building footprints after map restore.
- Done: `_harness.js` includes Scenario E for fence/gate pathfinding, and the full harness is green with 0 diagnostics anomalies.

### Next Step
- Start Week 1 logistics slice: item stacks on ground, stockpile zones, hauling jobs, and resource consumption from storage.

## Update 2026-06-02 - Week 1 Logistics Status
- Done: first stockpile/hauling slice implemented as `versions/frontier-v1.9.html`.
- Done: resources can exist as ground stacks and be hauled by pawns into storage.
- Done: `_harness.js` includes Scenario F for stockpile + hauling.

### Next Step
- Continue Week 1 production slice: stored resources should feed crafting/production queues instead of all production being instant/global.

## Update 2026-06-02 - Week 1 Production Status
- Done: first stored-resource production slice implemented as `versions/frontier-v1.10.html`.
- Done: smithy now uses a recipe instead of passive daily income: `ore` + `wood` -> `gold`.
- Done: crafting is pawn-work-driven through the normal job loop/reservation flow.
- Done: `_harness.js` includes Scenario G for recipe input/output validation.

### Next Step
- Continue production carefully with kitchen/cooking or stockpile filters, one tested slice at a time.

## Update 2026-06-02 - Week 1 Cooking Status
- Done: cooking slice implemented as `versions/frontier-v1.11.html`.
- Done: kitchen is buildable and uses the existing recipe/craft architecture.
- Done: `meat` now has a production sink: kitchen converts `meat` + `wood` into `food`.
- Done: `_harness.js` includes Scenario H for kitchen input/output validation.

### Next Step
- Add production feedback in the UI before expanding filters or queues.

## Update 2026-06-02 - Week 1 Production Feedback Status
- Done: production feedback slice implemented as `versions/frontier-v1.12.html`.
- Done: recipe stations expose input/output, missing resources, and active progress in building info.
- Done: `_harness.js` includes Scenario I for station feedback text.

### Next Step
- Start stockpile filters and make hauling respect them.

## Update 2026-06-02 - Week 1 Stockpile Filter Status
- Done: stockpile filter slice implemented as `versions/frontier-v1.13.html`.
- Done: stockpile cards expose clickable resource filters.
- Done: hauling respects stockpile filters.
- Done: `_harness.js` includes Scenario J for filtered delivery.

### Next Step
- Add better logistics diagnostics/UI for blocked hauling and visible ground stacks.

## Update 2026-06-02 - Week 1 Logistics Diagnostics Status
- Done: logistics diagnostics slice implemented as `versions/frontier-v1.14.html`.
- Done: diagnostic watchdog reports ground stacks that no stockpile accepts.
- Done: `_harness.js` includes Scenario K for blocked hauling diagnostics.

### Next Step
- Add production station pause/toggle controls.

## Update 2026-06-02 - Week 1 Production Toggle Status
- Done: production station toggle slice implemented as `versions/frontier-v1.15.html`.
- Done: recipe stations can be enabled/disabled from their info panel.
- Done: `_harness.js` includes Scenario L for paused/resumed station behavior.

### Next Step
- Publish and smoke-test the web build through GitHub Pages for phone access.

## Update 2026-06-02 - Public Mobile Web Status
- Done: GitHub repository `osminoog09-star/frontier` created and pushed.
- Done: GitHub Pages enabled from `main` root.
- Done: phone-oriented CSS added in `versions/frontier-v1.16.html`.
- Done: local mobile viewport smoke passes with full-width canvas.

### Next Step
- Confirm public mobile URL after Pages cache refresh, then continue gameplay roadmap.

## Update 2026-06-02 - Production Output Limits Status
- Done: production output limit slice implemented as `versions/frontier-v1.17.html`.
- Done: recipe stations can stop when target output is reached.
- Done: station panel has limit controls.
- Done: `_harness.js` includes Scenario M for blocked/resumed production by output limit.
- Done: public `index.html` was rebuilt into a status/roadmap page instead of an outdated shell.

### Next Step
- Add queue depth or desired output presets, then continue toward richer scenarios/trade.

## Update 2026-06-02 - Stockpile Logistics UI Status
- Done: logistics UI slice implemented as `versions/frontier-v1.18.html`.
- Done: stockpile info shows ground stacks by resource.
- Done: stockpile info shows resources blocked by stockpile filters.
- Done: `_harness.js` includes Scenario N for logistics info text.

### Next Step
- Add production queue depth or desired-stock presets.

## Update 2026-06-02 - Production Limit Presets Status
- Done: production limit preset slice implemented as `versions/frontier-v1.19.html`.
- Done: recipe stations expose x1/x3/x5 output target chips.
- Done: `_harness.js` includes Scenario O for preset controls/status.

### Next Step
- Move from economy controls into scenario/trade content.

## Update 2026-06-02 - Tradepost Caravan Status
- Done: tradepost caravan slice implemented as `versions/frontier-v1.20.html`.
- Done: tradepost is buildable and has a drawn map structure.
- Done: caravan trade converts gold into food, wood, and medicine.
- Done: `trading` research improves caravan output.
- Done: `_harness.js` includes Scenario P for caravan trade.
- Done: public site was rebuilt in Russian and now links the technical roadmap.

### Next Step
- Start scenario initialization: Gold Rush, Fort Defense, Caravan Route.

## Update 2026-06-02 - Start Scenarios Status
- Done: scenario initialization slice implemented as `versions/frontier-v1.21.html`.
- Done: start menu exposes scenarios.
- Done: Gold Rush, Fort Defense, and Caravan Route profiles are implemented.
- Done: `_harness.js` includes Scenario Q for scenario initialization.

### Next Step
- Add scenario-specific events and deeper caravan profiles.

## Update 2026-06-02 - Scenario Goals Status
- Done: scenario goal slice implemented as `versions/frontier-v1.22.html`.
- Done: Settlers, Gold Rush, Fort Defense, and Caravan Route now have different win goals.
- Done: objective HUD, pawn stats panel, help text, and win condition use shared scenario goal logic.
- Done: caravan deals are tracked through `stats.caravanDeals`.
- Done: `_harness.js` includes Scenario R for scenario goals.

### Next Step
- Add caravan deal profiles.

## Update 2026-06-02 - Scenario Event Pressure Status
- Done: scenario event pressure slice implemented as `versions/frontier-v1.23.html`.
- Done: Gold Rush applies early food pressure.
- Done: Fort Defense spawns early scouting raids.
- Done: Caravan Route accelerates the next caravan/event window.
- Done: `_harness.js` includes Scenario S for scenario event modifiers.

### Next Step
- Add tradepost UI for choosing caravan deal profile.

## Update 2026-06-02 - Caravan Profiles Status
- Done: caravan profile slice implemented as `versions/frontier-v1.24.html`.
- Done: `mixed`, `food`, `medicine`, and `materials` profiles exist.
- Done: `runCaravanTrade(profileId)` can execute deterministic profile deals.
- Done: `_harness.js` includes Scenario T for caravan profiles.

### Next Step
- Polish caravan profile UI in the tradepost panel.

## Update 2026-06-02 - Tradepost Deal UI Status
- Done: tradepost UI slice implemented as `versions/frontier-v1.25.html`.
- Done: tradepost info panel exposes caravan profile buttons.
- Done: clicking a profile runs the selected caravan deal.
- Done: `_harness.js` includes Scenario U for profile UI HTML.

### Next Step
- Show profile outputs directly in the panel and improve disabled-state clarity.

## Update 2026-06-02 - Caravan Deal UI Polish (v1.27)
- Tradepost deal rows now display outputs inline; insufficient-gold deals show the missing amount.
- Added a current-gold readout, a "choose a deal" hint, and a last-deal summary line.
- Harness Scenario V covers the polished trade UI.
- Next: deepen scenario-specific events (Gold Rush pressure, Fort waves, Caravan route bonuses).

## Update 2026-06-02 - Fort Defense Waves (v1.28)
- Fort scenario now has readable escalating waves (1/3,2/3,3/3) and a gold/medicine reward for holding.
- Harness Scenario W covers wave numbering, escalation, and reward.
- Next scenario depth: Gold Rush economic risk (drought/raids on miners), Caravan Route trade bonuses.
