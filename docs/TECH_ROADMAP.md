# FRONTIER - техническая дорожная карта

Дата обновления: 2026-06-02

## v1.36 public/mobile quality gate

- Public site is now a player-facing Russian status page, not a raw technical roadmap dump.
- Mobile smoke must stay part of any UI release: 390x844, no horizontal overflow, desktop sidebar hidden, minimap not overlapping the bottom build bar.
- Keep `index.html` readable for a player; keep deep agent details in `docs/HANDOFF.md`, `docs/WIP.md`, and this file.
- Next gameplay slice remains Week 2 content: furniture/rooms or deeper ranch systems, with harness coverage.

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

Этот документ собирает технический план из `ARCHITECTURE.md`, `DESIGN.md`, `ROADMAP_MONTH.md`, `MULTIPLAYER.md`, текущего кода и автотестов `_harness.js`.

Для совместной работы агентов:

- `AGENTS.md` - правила работы Codex/cloud-агентов.
- `docs/HANDOFF.md` - актуальное состояние для следующего исполнителя.
- `docs/CHANGELOG.md` - журнал срезов и версий.

## 1. Текущий стабильный фундамент

- Статическая web-игра: `frontier.html`.
- Публичный доступ: GitHub Pages.
- Локальный/LAN запуск: `server.js`, `start-phone-server.ps1`.
- Автотесты: `_harness.js`, сценарии A-U уже покрывают бой, экономику, save/load, pathfinding, hauling, рецепты, склады, диагностику, production controls, торговлю, сценарные цели, базовые сценарные события, профили караванов и UI торгового поста.
- Версионные снапшоты: `versions/frontier-v*.html`.

## 2. Обязательное правило релиза

Каждый срез должен заканчиваться так:

1. Изменение маленькое и проверяемое.
2. Добавлен или обновлен scenario в `_harness.js`.
3. `node _harness.js` зеленый.
4. `frontier.html` синхронизирован с `_core.js`.
5. Создан `versions/frontier-vX.Y.html`.
6. Обновлены `ROADMAP.md`, `docs/ROADMAP_MONTH.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN.md`, сайт `index.html`.
7. Обновлены `docs/CHANGELOG.md` и `docs/HANDOFF.md`.
8. Commit + push в GitHub.
9. Проверен публичный GitHub Pages URL.
10. Для mobile-изменений: отдельный smoke 390x844, без horizontal overflow, без desktop sidebar.

## 3. Ближайшая очередь

### 3.1 Торговля и караваны

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

### 3.2 Сценарии старта

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

### 3.3 Production queues

Цель: сделать производство управляемым, но не перегрузить UI.

- Desired stock presets уже начаты через `craftLimit`.
- Следующий шаг: понятные presets и состояние "почему станция не работает".
- Позже: очередь из нескольких рецептов, если появится больше рецептов.

### 3.4 Логистика

Цель: склады и перевозка должны быть понятны игроку.

- Фильтры складов уже есть.
- Диагностика заблокированных ground stacks уже есть.
- Следующий шаг: лучшая визуальная подсветка blocked stacks на карте.
- Позже: отдельное хранение по складам вместо глобального `G.res`.

### 3.5 Mobile UX

Цель: телефонная версия должна быть проверяемой, а не случайно сжатой desktop-страницей.

- [x] GitHub Pages открывает игру с телефона.
- [x] Public site на телефоне показывает fullscreen play card вместо iframe.
- [x] Game page скрывает desktop sidebar на mobile/touch.
- [x] Canvas занимает viewport без horizontal overflow.
- [x] Harness остаётся зелёным после mobile CSS hotfix.
- [ ] Следующий шаг: компактные mobile-панели для пешек/лога вместо полного desktop sidebar.

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
