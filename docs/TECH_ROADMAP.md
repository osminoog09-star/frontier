# FRONTIER - техническая дорожная карта

Дата обновления: 2026-06-02

## v1.36 public/mobile quality gate

- Public site is now a player-facing Russian status page, not a raw technical roadmap dump.
- Mobile smoke must stay part of any UI release: 390x844, no horizontal overflow, desktop sidebar hidden, minimap not overlapping the bottom build bar.
- Keep `index.html` readable for a player; keep deep agent details in `docs/HANDOFF.md`, `docs/WIP.md`, and this file.
- Current direction is explicit: RimWorld-like colony sim foundations, but with Frontier identity (horses, ranches, saloons, caravans, gold, forts, bandits).
- Next gameplay slice remains Week 2 content: construction/rooms depth, animal pens/livestock, saloon/caravan depth, or visual readability, with harness coverage.
- User direction 2026-06-02: mobile theme is enough for now; postpone mobile work for about four weeks and focus on PC-first roadmap slices.

## v1.37 furniture/rooms start

- Added bed as the first small furniture slice.
- Sleep preference now checks free beds before camps.
- Bed comfort improves energy recovery and mood during sleep.
- Scenario AC validates the comfort delta and bed preference.
- Next furniture work should add tables/room beauty without turning it into a large refactor.

## v1.38 furniture dining comfort

- Added table as the second furniture slice.
- Eating with a built table gives a small mood bonus and a positive thought.
- Scenario AD validates table comfort against eating without a table.
- Next furniture work should move from individual furniture bonuses toward room/beauty evaluation.

## v1.39 decor beauty start

- Added decor as the first beauty object.
- Nearby decor gives a small mood delta bonus and a visible positive thought.
- Scenario AE validates the beauty delta and thought.
- Next step: room/wall recognition or a compact room quality panel.

## v1.40 homestead comfort score

- Added aggregate comfort score from bed/table/decor.
- Complete basic furniture set gives a small global mood delta bonus.
- Stats panel exposes the comfort label and score.
- Scenario AF validates score, bonus, label, and thought.
- Next step: move from colony-wide comfort to room recognition/quality.

## v1.41 ranch daily yield

- Added ranch building as the next horses/ranch slice.
- Ranch daily yield requires at least one completed stable.
- Scenario AG validates no-yield without stable and food/gold yield with stable.
- Next ranch work can add animal taming or a visible ranch capacity/state.

## v1.42 horse taming

- Added `G.herd` state with wild horses, tamed horses, and taming progress.
- Stable daily loop now advances taming; Ranches add a small taming-rate support.
- Tamed horses boost movement and Ranch food/gold output.
- Save/load persists herd state and `normalizeGameState()` initializes old saves.
- Scenario AH validates no-stable no-taming, stable taming, boosted ranch yield, and mount-speed boost.
- Next ranch/animal work can add pens, livestock resources, or a compact animal panel.

## v1.43 build bar groups + minimap clearance

- Fixed feedback from `fix/Screenshot 2026-06-02 171333.png`: minimap overlapped the build area and bottom build buttons occupied too much space.
- Bottom build actions are grouped into `details.build-group` folders while preserving the existing button ids.
- Active build mode highlights the owning group; choosing a building closes the folder.
- `updateBottomUiMetrics()` writes `--bottom-ui-height` from the measured bottom bar height so minimap/zoom controls stay clear.
- Browser smoke covers desktop 1600x900 and mobile 390x844.
- Future UI slices should keep checking `fix/` screenshots before selecting roadmap work.

## v1.44 basic room comfort

- Added first room recognition over small fence/gate enclosures.
- `enclosedRoomAt()` flood-fills from a furniture tile, rejects open/edge/oversized areas, and treats fence/gate/water/rock as boundaries.
- `roomComfortScore()` counts bed/table/decor inside closed rooms and adds a small mood bonus.
- Stats and furniture overlays expose room quality to the player.
- Scenario AI validates open furniture vs enclosed room score, bonus, label, and thought.
- Next room work can split room types (bedroom/dining), wall quality, or a compact room panel.

## v1.56 building repair

- Accepted and completed a paused Claude slice for building repair.
- Construction work now falls back from `tryBuild()` to `tryRepair()` when there are no active blueprints.
- Builders claim damaged completed buildings, move to them, restore HP, and log when repair reaches max HP.
- Scenario AT validates full repair of a damaged fence and false/no-op when no damaged buildings remain.
- This is important follow-up to arsonists and building-damage combat.

## v1.57 mobile pawn drawer

- Added a mobile-only drawer above the bottom bar and left of the minimap.
- The drawer exposes `Пешки` and `Лог` tabs on phones while keeping desktop sidebar behavior unchanged.
- Pawn cards are generated by the same `createPawnCard()` helper for desktop and mobile, so selection/focus stays consistent.
- `renderLog()` now writes to both desktop and mobile log containers.
- Local mobile smoke verifies 390x844 layout, no horizontal overflow, no minimap overlap, visible pawn cards/log entries, and no console errors.

## v1.58 room type labels

- Added room classification for enclosed furniture layouts: bedroom, dining room, living room, and decorated corner.
- `enclosedRoomAt()` now returns room cells so furniture can be grouped by one actual room instead of only global room score.
- Stats shows room type summary; furniture overlays show the selected furniture's concrete room type and score.
- Scenario AU covers three separate rooms and the open non-room fallback.
- PC-first direction: continue room/animal/visual/content slices; do not expand mobile UI for now.

## v1.59 room wall quality

- Added `roomWallQuality()` based on wall-to-floor ratio for enclosed rooms.
- Room labels now include wall quality: compact rooms read as protected, spacious rooms read as wide.
- Stats summary includes wall quality alongside room type and furniture quality.
- Scenario AV validates compact vs spacious room labels and summary text.

## v1.60 room details panel

- Added `roomDetailRows()` as a small data layer for the room list in the PC stats panel.
- The stats panel now lists each detected room with type, comfort, wall quality, size, and furniture counts.
- Scenario AW validates readable room rows for a bedroom and a dining/decor room.

## v1.61 herd details panel

- Added `herdDetailRows()` as a small data layer for the PC herd/animal panel.
- Stats now shows tamed/wild horses, taming progress/rate, stable/ranch counts, movement bonus, and daily ranch yield.
- Scenario AX validates no-stable feedback and active stable/ranch/tamed-horse rows.

## v1.69 room roof shelter

- Closed rooms now count as roof shelter for the first weather/shelter slice.
- Pawns inside an enclosed room do not receive the rain/storm `Мокнет` thought; pawns outside still do.
- Room details expose a roof row, and furniture overlay room labels include `крыша есть`.
- Scenario BC validates sheltered-vs-outside rain thoughts and room UI roof text.

## v1.70 construction material delivery

- Building blueprints no longer start progress immediately after global resource reservation.
- A builder reserves the required resources, carries a visible `buildpack` package to the blueprint, and only then marks materials paid and starts progress.
- Blueprint info shows `Материалы: в пути` while the package is being delivered.
- Scenario BD validates that progress waits for delivery and starts only after the carried package reaches the blueprint.

Этот документ собирает технический план из `ARCHITECTURE.md`, `DESIGN.md`, `ROADMAP_MONTH.md`, `MULTIPLAYER.md`, текущего кода и автотестов `_harness.js`.

Для совместной работы агентов:

- `AGENTS.md` - правила работы Codex/cloud-агентов.
- `docs/HANDOFF.md` - актуальное состояние для следующего исполнителя.
- `docs/CHANGELOG.md` - журнал срезов и версий.

## 1. Текущий стабильный фундамент

- Статическая web-игра: `frontier.html`.
- Публичный доступ: GitHub Pages.
- Локальный/LAN запуск: `server.js`, `start-phone-server.ps1`.
- Автотесты: `_harness.js`, сценарии A-BD (56) покрывают бой, экономику, save/load, pathfinding, hauling, рецепты, склады, диагностику, production controls, торговлю, сценарии, мебель/комфорт, комнаты, ранчо, приручение лошадей, новые угрозы, навыки, меткость, ремонт, типы комнат, качество стен, room-панель, animal-панель, полы, стены, бонус уюта от пола, материалы чертежей, крышу/укрытие комнат и доставку пакета материалов к стройке.
- Версионные снапшоты: `versions/frontier-v*.html`.

## 2. Обязательное правило релиза

Каждый срез должен заканчиваться так:

1. Изменение маленькое и проверяемое.
2. Добавлен или обновлен scenario в `_harness.js`.
3. `node _harness.js` зеленый.
4. `frontier.html` синхронизирован с `_core.js`.
5. Создан `versions/frontier-vX.Y.html`.
6. Обновлены `ROADMAP.md`, `docs/TECH_ROADMAP.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN.md`, сайт `index.html`, если меняется статус или направление.
7. Обновлены `docs/CHANGELOG.md` и `docs/HANDOFF.md`.
8. Commit + push в GitHub.
9. Проверен публичный GitHub Pages URL.
10. Для mobile-изменений: отдельный smoke 390x844, без horizontal overflow, без desktop sidebar.

## 3. Ближайшая очередь

### 3.1 Стройка и комнаты

Цель: довести RimWorld-like строительство до понятной базы, но без большого refactor.

- [x] Полы как отдельный tile-layer: деревянный и каменный.
- [x] Чертежи полов, работа строителя, снос пола.
- [x] Деревянные и каменные стены как material walls.
- [x] Стены блокируют проход и считаются стенами комнаты.
- [x] Полы повышают уют комнаты, room-панель показывает покрытие.
- [x] Architect-панель слева вместо длинной нижней простыни.
- [x] Визуальная проверка Architect-панели на desktop: подсказки и overlay синхронизированы.
- [x] Первый шаг материалов чертежей: blueprint ставится как план, строитель списывает стоимость при начале работы, нехватка видна в info-overlay/diagnostics.
- [x] Крыша/укрытие: закрытая комната защищает от дождя/грозы и отображается в room-панели.
- [x] Доставка пакета к стройке: progress не растёт, пока строитель не принесёт 📦 к чертежу.
- [ ] Следующий шаг: брать материалы для стройки из stockpile/ground stacks вместо глобального резерва.

### 3.2 Frontier-идентичность

Цель: игра должна ощущаться не копией RimWorld, а colony sim про Дикий Запад.

- [x] Конюшня и приручение диких лошадей.
- [x] Табун ускоряет ковбоев.
- [x] Ранчо дает дневной доход при поддержке конюшни.
- [x] Караваны и торговый пост с профилями сделок.
- [x] Форт/налёты/поджигатель/ремонт построек.
- [ ] Следующий шаг: загоны и скот как ресурсный цикл.
- [ ] Следующий шаг: салун глубже: отдых, найм, риск настроения.
- [ ] Следующий шаг: риски торговых маршрутов.

### 3.3 Торговля и караваны

Цель: после стабилизации логистики дать игроку внешний экономический контур.

- [x] Торговый пост как отдельное здание.
- [x] Караванная сделка: золото -> припасы.
- [x] Бонус от исследования `trading`.
- [x] Лог события и понятный результат сделки.
- [x] Harness: сделка тратит золото и приносит ресурсы.
- [x] Профили караванов: еда, медицина, стройматериалы.
- [x] Harness: Scenario T проверяет профили сделок.
- [x] UI выбора профиля сделки у торгового поста.
- [x] Harness: Scenario U проверяет HTML профилей.
- [ ] Следующий шаг: полировка UI профилей, видимый результат сделки без tooltip.

### 3.4 Сценарии старта

Цель: добавить разные способы начать колонию.

- [x] "Золотая лихорадка": больше руды/золота, меньше еды.
- [x] "Форт": старт с забором, воротами и вышкой.
- [x] "Караванный путь": старт с торговым постом и золотом.
- [x] Harness: сценарий корректно создает стартовые ресурсы/здания.
- [x] Сценарные цели: золото, выживание форта, караванные сделки.
- [x] Harness: Scenario R проверяет цели и счётчик караванов.
- [x] Базовые сценарные события: давление по еде, ранние налёты, частые караваны.
- [x] Harness: Scenario S проверяет сценарное давление.
- [x] Профили караванных сделок.

### 3.5 Production queues

Цель: сделать производство управляемым, но не перегрузить UI.

- Desired stock presets уже начаты через `craftLimit`.
- Следующий шаг: понятные presets и состояние "почему станция не работает".
- Позже: очередь из нескольких рецептов, если появится больше рецептов.

### 3.6 Логистика

Цель: склады и перевозка должны быть понятны игроку.

- Фильтры складов уже есть.
- Диагностика заблокированных ground stacks уже есть.
- Следующий шаг: лучшая визуальная подсветка blocked stacks на карте.
- Позже: отдельное хранение по складам вместо глобального `G.res`.

### 3.7 Mobile UX

Цель: телефонная версия должна быть проверяемой, а не случайно сжатой desktop-страницей.

- [x] GitHub Pages открывает игру с телефона.
- [x] Public site на телефоне показывает fullscreen play card вместо iframe.
- [x] Game page скрывает desktop sidebar на mobile/touch.
- [x] Canvas занимает viewport без horizontal overflow.
- [x] Harness остаётся зелёным после mobile CSS hotfix.
- [x] Компактные mobile-панели для пешек/лога вместо полного desktop sidebar.
- [ ] Следующий шаг: глубокую мобильную тему не трогать до отдельной mobile-недели, кроме критических поломок.

## 4. Среднесрочная очередь

### 4.1 Карта и биомы

- Разные стартовые биомы.
- Опасности биома: засуха, метель, песчаная буря.
- Баланс ресурсов под биом.

### 4.2 Караваны и фракции

- Караваны с разным профилем: еда, медицина, стройматериалы, оружие.
- Репутация с фракциями.
- Риски на торговом пути.

### 4.3 Save v2

- Явная версия схемы.
- Миграции старых сейвов.
- Более строгая нормализация зданий, рецептов, складов, сценариев.

### 4.4 Модульность

Текущий single-file формат удобен для GitHub Pages, но код надо постепенно разделять внутренне:

- `world`
- `pawns`
- `jobs`
- `combat`
- `logistics`
- `production`
- `ui`
- `diag`

Публичная сборка может оставаться single-file.

## 5. Дальняя очередь

### 5.1 Облако и мультиплеер

Из `MULTIPLAYER.md`:

- Командная модель ввода.
- Детерминированная симуляция.
- Backend skeleton на Node.js + WebSocket.
- Cloud saves.
- Кооператив на одной карте.

### 5.2 Глобальный мир

- Регионы.
- Несколько колоний.
- Торговые маршруты.
- PvE-события, позже опционально PvP.

## 6. Критические риски

- Не ломать `requestAnimationFrame` запуск.
- Не возвращать mojibake в `frontier.html` и `_core.js`.
- Не добавлять фичу без harness-сценария.
- Не расширять UI так, чтобы телефонный layout снова стал непригодным.
- Не делать большие refactor-срезы без маленьких проверяемых шагов.

## 7. Текущий публичный URL

- Игра: `https://osminoog09-star.github.io/frontier/frontier.html`
- Сайт/статус: `https://osminoog09-star.github.io/frontier/`
