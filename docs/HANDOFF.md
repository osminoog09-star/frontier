# FRONTIER handoff

Дата: 2026-06-02

## Текущее состояние

- Публичный сайт: https://osminoog09-star.github.io/frontier/
- Публичная игра: https://osminoog09-star.github.io/frontier/frontier.html
- Последний локальный срез: `v1.22 - Scenario Goals`.
- Последний harness: Scenarios A-R pass.
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
- Public `index.html` полностью на русском и показывает roadmap/status.
- Добавлен `docs/TECH_ROADMAP.md`.
- Добавлены `AGENTS.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.

## Что делать дальше

Приоритет 1: сценарные события и давление.

- Gold Rush: больше экономического давления, риск засухи/налётов на добытчиков.
- Fort Defense: ранний/регулярный raid pressure.
- Caravan Route: более частые караваны и торговые бонусы.

Приоритет 2: расширить караваны.

- Food caravan.
- Medicine caravan.
- Building materials caravan.
- Harness для каждого профиля сделки.

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
- `_harness.js` - автотесты A-R.
- `index.html` - публичный русский сайт/roadmap.
- `ROADMAP.md` - общий roadmap.
- `docs/TECH_ROADMAP.md` - технический roadmap для агентов.
- `docs/CHANGELOG.md` - журнал срезов.
- `AGENTS.md` - правила совместной работы агентов.
