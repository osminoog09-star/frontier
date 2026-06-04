# 🎯 FRONTIER — Дизайн-документ (GDD)

## Видение
Колония-симулятор в духе RimWorld, но про **Дикий Запад**: ты ведёшь отряд ковбоев-поселенцев,
которые сами живут и работают, а ты задаёшь правила. Игра растёт от одиночного выживания
к **общему живому миру**, где можно играть с друзьями.

## Жанр
Симулятор колонии / стратегия непрямого управления / выживание. Вид сверху, 2D.

## Три столпа (pillars)
1. **Живые пешки.** У ковбоев свои характеры, нужды, отношения, истории. Игрок «режиссёр», а не кукловод.
2. **Дикий Запад как сеттинг.** Лошади, ранчо, салуны, бандиты, золото, дуэли, караваны, шерифы.
3. **Совместный мир.** От одиночной колонии — к кооперативу и общему персистентному миру с другими игроками.

## Игровой цикл (core loop)
1. Осмотреться → отметить ресурсы (лес, камень), заложить постройки.
2. Настроить приоритеты работ и расписание → пешки сами работают.
3. Развивать колонию: еда → жильё → производство → оборона → богатство.
4. Переживать события (налёты, погода, болезни, караваны).
5. Достигать целей (накопить золото / выжить / расшириться) → новые угрозы и масштаб.

## Прогрессия
- **Ранняя:** еда и дерево, первые постройки, выживание.
- **Средняя:** производство (кузня/кухня), оборона (стены/вышки), наука, лошади/ранчо.
- **Поздняя:** богатство, большая колония, крупные налёты, торговые связи.
- **Сетевая:** взаимодействие с колониями других игроков, общий мир.

## Управление (дизайн непрямого контроля)
- **Приоритеты работ** (1–4 / выкл) на каждого ковбоя — что важнее.
- **Расписание** (24ч): сон / работа / досуг / охрана.
- **Зоны** (план): склад, запретная зона, зона приручения.
- **Прямой контроль только в бою** (по желанию): выделить → приказ атаковать.

## Нужды и настроение
- Шкалы: HP, Еда, Сон/Сила, Настроение.
- Мысли (голод, ранение, погода, друг рядом, ссора, красивая комната) формируют настроение.
- Низкое настроение → срыв (отказ работать, запой, агрессия).

## Характеры (трейты)
Влияют на скорость работ, бой, настроение, отношения. (Работяга, Лентяй, Трус, Храбрец, Оптимист,
Пессимист, Выпивоха, Добряк, Жадина, Крепкий — расширяем.)

## Сеттинг-фишки Дикого Запада
- 🐴 Лошади: транспорт, бой верхом, ранчо.
- 🍺 Салун: досуг, азартные игры, наём.
- 🔫 Дуэли и перестрелки, укрытия, динамит.
- 🏜️ Караваны, торговые посты, золотая лихорадка.
- 🤠 Фракции: бандиты, аборигены, кавалерия, другие поселенцы (в т.ч. реальные игроки).

## Цели игры
- Базовая: накопить богатство (золото) и выжить.
- Сценарии (план): «Золотая лихорадка», «Оборона форта», «Караванный путь».
- Сетевая: совместное выживание / соревнование колоний / торговая империя.

## Мультиплеер-фантазия (кратко; детали в MULTIPLAYER.md)
- **Кооп:** с другом строим одну колонию или соседние на одной карте, отбиваем налёты вместе.
- **Глобальный мир:** на общем сервере у каждого своя колония в общем регионе; караваны и торговля
  между реальными игроками; опциональные конфликты.

## Чего НЕ делаем (scope guard)
- Не 3D. Не реалтайм-экшен. Не пытаемся повторить весь RimWorld сразу — берём фундамент и сеттинг.
- Не копируем RimWorld тему/лоре/контент один-в-один. Он для нас ориентир по понятной colony-sim структуре:
  работы, комнаты, логистика, Architect UI, настроение и readable feedback.
- Уникальность FRONTIER держится на Диком Западе: лошади, ранчо, салуны, караваны, золото,
  форты, бандиты, дуэли и торговые маршруты.

## Update 2026-06-03 - Direction Sync
- Текущее направление зафиксировано явно: **RimWorld-like фундамент + Frontier-идентичность**.
- Срезы v1.63-v1.66 уже идут в эту сторону: полы, стены из материалов, уют комнат от пола,
  Architect-панель слева.
- Следующие безопасные дизайн-слои: подвоз материалов к чертежам, крыша/укрытие,
  загоны/скот, салун глубже, караванные риски и визуальная читаемость карты.

## Update 2026-06-02 - Defense Design Status
- Defense is no longer purely decorative: fences now shape movement and gates create intentional entrances.
- The player can build a perimeter with a gate, and pathfinding will respect that structure.
- This unlocks the next design layer: raids can be tuned around approach routes, chokepoints, and later wall/gate damage.

### Next Design Focus
- Logistics fantasy: resources should physically exist as stacks, be hauled into stockpiles, and be consumed by buildings/crafting.

## Update 2026-06-02 - Logistics Design Status
- The colony now has a visible logistics loop: resources can lie on the ground, pawns haul them, and stockpiles matter.
- This makes resource flow more RimWorld-like without yet adding stockpile filters or complex inventories.

### Next Design Focus
- Production should ask for stored inputs: kitchen/cooking and smithy/toolmaking are the next natural layer.

## Update 2026-06-02 - Production Design Status
- Smithy production is now an actual colony task: a pawn works the station and consumes stored inputs.
- Gold from the smithy is no longer passive daily income; the player needs ore, wood, a completed smithy, and available labor.
- This makes the economy less magical and gives stockpiles/hauling a reason to exist.

### Next Design Focus
- Add a similarly small cooking loop, then improve the UI so players can see what a station needs and why it is idle.

## Update 2026-06-02 - Cooking Design Status
- Kitchen gives hunted `meat` a clear purpose beyond being a loose resource.
- Cooking now turns `meat` into usable `food`, which connects hunting, hauling, stockpiles, and pawn hunger into one loop.
- The next UX need is feedback: the player should see whether a station is working, waiting for inputs, or blocked by labor.

## Update 2026-06-02 - Production Feedback Design Status
- Recipe buildings now explain themselves when clicked: what they make, what they need, and whether they are working.
- This reduces invisible failure states where a station looks idle but is actually missing inputs.
- Next design layer: stockpiles should become configurable so the player can shape logistics, not only watch it happen.

## Update 2026-06-02 - Stockpile Filter Design Status
- Stockpiles are now player-configurable instead of generic dumping zones.
- The first filter UI is intentionally compact: each resource is a toggle chip in the stockpile info panel.
- Haulers respecting filters makes logistics planning meaningful without adding a full inventory UI yet.

## Update 2026-06-02 - Logistics Diagnostics Design Status
- When filters accidentally block hauling, the game now exposes it through diagnostics instead of silently letting stacks rot on the ground.
- This supports the player's mental model: if nobody hauls, the log can say whether the cause is storage rules.
- Next production control should follow the same idea: make station intent explicit and visible.

## Update 2026-06-02 - Production Toggle Design Status
- Players can now pause an individual recipe station without demolishing it or starving the whole colony of inputs.
- The control lives where the player looks for station state: the building info panel.
- This is the first step toward richer production queues while keeping the UI compact.

## Update 2026-06-02 - Public Mobile Web Design Status
- Phone access now has a dedicated narrow-screen layout instead of squeezing the desktop sidebar beside the map.
- The first mobile pass prioritizes playability: full-width map, compact topbar, hidden sidebar.
- Deeper mobile panels can come later; the goal here is reliable public access from a phone browser.

## Update 2026-06-02 - Production Output Limits Design Status
- Recipe stations no longer have to run forever just because resources exist.
- The player can set a simple output cap from the station panel.
- This keeps early production understandable while opening the path toward richer queues and desired-stock rules.

## Update 2026-06-02 - Public Site Status
- The project root page now shows the playable build, current roadmap status, latest slices, and documentation links.
- This makes the GitHub Pages root useful instead of forcing players to know the direct `frontier.html` URL.

## Update 2026-06-02 - Stockpile Logistics UI Design Status
- Stockpiles now explain what is lying on the map and what cannot be hauled because no stockpile accepts it.
- This makes filter mistakes visible in normal play, not only through downloaded diagnostics.
- The UI stays compact: two lines in the stockpile panel instead of a heavy inventory screen.

## Update 2026-06-02 - Production Limit Presets Design Status
- Station output limits are now quick to set with x1/x3/x5 chips.
- This keeps the control usable on both desktop and phone, where repeated tiny clicks are annoying.
- Production/logistics controls are now stable enough to start adding more world content.

## Update 2026-06-02 - Tradepost Caravan Design Status
- The colony now has its first external economy hook: a trading post can turn gold into useful supplies.
- Caravan events have clearer meaning once the player invests in trade infrastructure.
- This prepares the "Caravan Route" scenario and later faction/trade systems.

## Update 2026-06-02 - Start Scenarios Design Status
- Players can now choose a starting fantasy instead of always using the same colony setup.
- Gold Rush pushes wealth and ore.
- Fort Defense starts with a defensible perimeter.
- Caravan Route starts with trade infrastructure.
- This gives future content a clear structure for goals, events, and balance.

## Update 2026-06-02 - Scenario Goals Design Status
- Each starting fantasy now has a different visible win condition.
- Settlers stays the classic wealth objective.
- Gold Rush asks for a larger gold target.
- Fort Defense is about holding out until day 5.
- Caravan Route is about completing trade deals.
- The top objective HUD now tells the player what to do without opening documentation.

## Update 2026-06-02 - Scenario Event Pressure Design Status
- Scenarios now affect early pacing, not only starting resources.
- Gold Rush creates pressure through food drain.
- Fort Defense adds early danger through scouting raids.
- Caravan Route makes trade events feel more frequent.
- The next design step is giving caravan trades clear profiles and player-readable choices.

## Update 2026-06-02 - Caravan Profiles Design Status
- Caravan trades now have distinct identities: mixed supplies, food, medicine, and building materials.
- This gives the tradepost a clearer role as a strategic supply tool.
- The next design step is letting the player choose the profile before paying gold.

## Update 2026-06-02 - Tradepost Deal UI Design Status
- The tradepost panel now gives the player direct profile buttons instead of hiding all trade behind random events.
- Cost is visible on each button.
- Output is available through tooltip; the next polish step is making output visible without hover.

## Update 2026-06-02 - Trade UX Design Status
- Caravan trading is now readable at a glance: the player sees what each deal gives and whether they can afford it without hovering.
- A last-deal line gives quick feedback that a trade actually happened.
- Next design focus: scenario events should make each start feel distinct (Gold Rush economic risk, Fort raid waves, Caravan route trade windows).

## Update 2026-06-02 - Housing Progression (v1.46)
- Жильё теперь прогрессирует, как в RimWorld, и палатка не бессмысленна:
  - земля (0) — медленный сон, без укрытия;
  - 🏕️ палатка/лагерь (1) — дешёвая ранняя времянка, пока нет стен/кроватей;
  - 🛏️ одиночная кровать (2) — лучше палатки;
  - 🏠 кровать в замкнутой комнате/доме (3) — лучший сон (energy 5.2) + бонус комнаты к настроению.
- «Дом» = кровать внутри замкнутой зоны из заборов/ворот (reuse `enclosedRoomAt`). Это даёт игроку
  понятную цель: обнести спальню стенами с воротами.
- Сделано аддитивно: старая семантика «кровать=2» сохранена (тест AC не сломан), добавлен тир 3.

### Логика-ревизия (на будущее)
- Палатка остаётся ранним укрытием; мид-гейм её вытесняет дом — это норм прогрессия.
- Проверить далее: используется ли ресурс «вода» (колодец) где-либо; не дублируют ли друг друга
  источники еды; нужна ли «крыша» отдельно от стен (сейчас комната = только стены).


---

## ДИЗАЙН-СПЕКИ (Claude, готовы к реализации)

_Подготовлено в doc-only режиме, пока Codex делал POI (без правок кода). Каждый пункт — отдельный проверяемый срез с harness-сценарием._

### A. Плавание (Phase 3)
- Навык `swimming` уже в списке SKILLS. Сейчас вода непроходима (isWalkableTile=false на WATER).
- Срез 1 (каркас, безопасно): `swimSpeedMul(p)` = f(навык): низкий навык => медленно/риск; чистая функция + тест. Воду пока НЕ открываем в A*.
- Срез 2: разрешить A* проходить воду как «дорогую» клетку (стоимость×8) ТОЛЬКО если у пешки swimming>0; pathfinding cost-tier. Скорость на воде = base×swimSpeedMul×weather.
- Срез 3: риск утонуть при swimming<низкого + глубокая вода + груз; бросает груз/урон. Навык растёт от плавания, деградирует, обучается наставником.
- Факторы: течение реки, температура воды (переохлаждение зимой), одежда/сапоги (-), вес груза (-).

### B. Здоровье по частям тела (Phase 2/медицина)
- `p.body = { head, torso, leftArm, rightArm, leftLeg, rightLeg }`, каждая часть { hp, max, condition 0..1 }.
- Ранение в бою бьёт по случайной части (вес по площади). Часть влияет на способности:
  - ноги => множитель скорости; руки => множитель работы/стрельбы; голова/торс => сознание/жизнь.
- Инфекция: у раны шанс инфекции (sick), лечится медициной/навыком medicine; без лечения растёт.
- Срез 1 (каркас): `p.body` + `bodyCapacity(p,move|work|aim)` чистые функции + тест; пока без визуала.
- Срез 2: бой бьёт по части, capacity влияет на speed/wmul/hitChance. Срез 3: инфекции/лечение/протезы.
- Save/load: `p.body` сериализуется; нормализация старых сейвов.

### C. Wild-West идентичность (Phase 4)
- `G.factions` (репутация: поселенцы/бандиты/коренные/закон). События меняют репутацию.
- Шериф: здание/роль; снижает преступность, даёт квесты-награды.
- Охотники за головами: контракты на бандит-лагеря (Codex POI) => награда золотом/репутацией.
- Прииск (POI): риск/награда — золото, но притягивает налётчиков (уже есть в goldrush).
- Салун-события: слухи/наём/азарт (мини-риск настроения/денег).
- Железная дорога/торговые маршруты: связь с соседними поселениями (Phase 5 — общий мир).
- Дуэли: 1-на-1 разрешение конфликтов между пешками/бандитами.
- Принцип: каждая фича — маленький срез + сценарий; держать фокус, не размывать.

### D. Эндшпиль (после главной цели)
- Достижение цели сценария не завершает игру, а ОТКРЫВАет слой: рост поселения в город, эскалация налётов, новые фракции/контракты.
- Бесконечный режим со скейлингом сложности и «директором событий» (Storyteller) в Wild-West-обёртке.
