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
