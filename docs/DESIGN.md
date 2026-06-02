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
