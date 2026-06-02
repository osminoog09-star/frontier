# FRONTIER handoff

Дата: 2026-06-02

## Текущее состояние

- Публичный сайт: https://osminoog09-star.github.io/frontier/
- Публичная игра: https://osminoog09-star.github.io/frontier/frontier.html
- Последний локальный срез: `v1.28 - Fort Defense Waves + Hold Reward`.
- Последний harness: Scenarios A-W pass + encoding/sync guard OK.
- СБОРКА: `frontier.html` собирается ТОЛЬКО через `node build.js` (template + `_core.js`, UTF-8, mojibake-guard).
  Никаких ручных PowerShell `Get-Content -Raw` синхронизаций — они портят кириллицу.
- Ожидаемая anomaly в harness: Scenario K специально создает заблокированный `meat` stack и проверяет диагностику.

## Последние изменения

- Добавлены стартовые сценарии:
  - `settlers`
  - `goldrush`
  - `fort`
  - `caravan`
- Добавлено меню сценариев.
- Save/load сохраняет `scenario`.
- Добавлены сценарные цели:
  - `settlers`: накопить 500 золота.
  - `goldrush`: накопить 700 золота.
  - `fort`: удержать форт до дня 5.
  - `caravan`: провести 3 караванные сделки.
- HUD, статистика пешек, справка и победа используют `scenarioGoalStatus()`.
- Караванные сделки пишутся в `stats.caravanDeals`.
- Добавлены сценарные события:
  - `goldrush`: раннее давление по еде.
  - `fort`: разведывательные налёты на 2 и 4 день.
  - `caravan`: более частое окно караванов/событий.
- Event cadence вынесен в `scenarioEventDelay()`.
- Добавлены профили караванов:
  - `mixed`
  - `food`
  - `medicine`
  - `materials`
- `runCaravanTrade(profileId)` поддерживает детерминированный профиль для harness и будущего UI.
- Торговый пост показывает кнопки профилей сделок, цену и tooltip с результатом.
- Исправлен телефонный layout:
  - игра скрывает desktop sidebar на touch/mobile;
  - canvas занимает viewport без горизонтального overflow;
  - topbar desktop-кнопки не торчат над картой;
  - публичный сайт на телефоне не встраивает игру iframe, а даёт fullscreen-кнопку.
- Public `index.html` полностью на русском и показывает roadmap/status.
- Добавлен `docs/TECH_ROADMAP.md`.
- Добавлены `AGENTS.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.

## Что делать дальше

Приоритет 1 (ГОТОВО в v1.27): полировка UI караванной сделки.

- [x] Вывод ресурсов виден в строке, не только tooltip.
- [x] Недоступные сделки затемнены + показывают нехватку золота.
- [x] Короткая подсказка "выбери сделку" + строка последней сделки.
- [x] Harness Scenario V.

Приоритет 2 (в работе): углубить сценарные события.

- [x] Fort Defense: нумерованные волны 1/3–3/3 + награда за удержание (v1.28).
- [ ] Gold Rush: риск засухи/налётов на добытчиков.
- [ ] Caravan Route: торговые бонусы и выбор сделки.

Приоритет 3: улучшить UX сценариев.

- Показ текущего сценария уже есть в stats panel и objective HUD.
- Следующий UX-шаг: компактная карточка сценария в стартовом меню/паузе с прогрессом и подсказкой.

## Проверки перед релизом

```powershell
node _harness.js
```

Публичный smoke:

- Проверить root содержит актуальную версию.
- Проверить `frontier.html` на mobile viewport.
- Проверить отсутствие console errors.

## Важные файлы

- `_core.js` - игровая логика.
- `frontier.html` - публичная сборка, должна быть синхронизирована с `_core.js`.
- `_harness.js` - автотесты A-U.
- `index.html` - публичный русский сайт/roadmap.
- `ROADMAP.md` - общий roadmap.
- `docs/TECH_ROADMAP.md` - технический roadmap для агентов.
- `docs/CHANGELOG.md` - журнал срезов.
- `AGENTS.md` - правила совместной работы агентов.
