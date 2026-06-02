# FRONTIER agent protocol

Этот файл нужен, чтобы Codex, cloud-агент и любой следующий исполнитель понимали текущее состояние проекта и не ломали работу друг друга.

## Главные правила

1. Не делать большие изменения без маленького проверяемого среза.
2. Каждый gameplay-срез должен иметь scenario в `_harness.js`.
3. После изменения `_core.js` синхронизировать его в `frontier.html` ТОЛЬКО командой `node build.js`.
   - НЕЛЬЗЯ синхронизировать вручную через PowerShell `Get-Content -Raw` / `Set-Content`:
     в Windows PowerShell 5.1 это читает UTF-8 как CP1251 и портит кириллицу (double-encoding, кракозябры).
   - `build.js` собирает `frontier.html` = `frontier.template.html` (обёртка с маркером `__CORE__`) + `_core.js`,
     пишет UTF-8 без BOM и имеет mojibake-guard (упадёт, если порча).
   - `node _harness.js` дополнительно проверяет: нет mojibake и `frontier.html` синхронизирован с `_core.js`.
4. После релизного среза создавать `versions/frontier-vX.Y.html` (копией собранного `frontier.html`).
   - Перед сборкой обновлять номер версии в `frontier.template.html` (`class="menu-ver"`), чтобы меню игры
     не рассинхронизировалось с `versions/`, `index.html` и `docs/CHANGELOG.md`.
5. Обновлять `ROADMAP.md`, `docs/TECH_ROADMAP.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md` и публичный `index.html`, если меняется статус.
6. Перед push запускать `node _harness.js`.
7. После push проверять GitHub Pages:
   - `https://osminoog09-star.github.io/frontier/`
   - `https://osminoog09-star.github.io/frontier/frontier.html`

## Тесты должны быть ДЕТЕРМИНИРОВАННЫМИ

- Сценарий harness не должен зависеть от `Math.random()` в ИИ. Если гоняешь `updatePawns()` в цикле и
  проверяешь точный результат — **фиксируй состояние** (позицию/state пешки каждый тик) или тестируй
  чистую функцию напрямую. Иначе тест флакает и проходит «на удачном прогоне».
- Перед push прогоняй `node _harness.js` несколько раз; флакающий тест = красная сборка.
- Сценарии бросают `throw` при провале и обрывают прогон — тем более они обязаны быть стабильными.

## Что нельзя ломать

- `requestAnimationFrame` запуск в конце `frontier.html`.
- Mobile layout: на телефоне sidebar скрыт, canvas занимает ширину экрана.
- Кодировка: не возвращать mojibake в `_core.js`, `frontier.html`, `index.html`.
- Save/load: старые сейвы должны нормализоваться через `normalizeGameState()`.
- GitHub Pages должен оставаться статическим: root + `frontier.html`.

## Координация двух агентов (Codex + Claude) — ОБЯЗАТЕЛЬНО

- Перед началом работы читай `docs/WIP.md` («замок» текущих задач).
- Если задача там помечена `IN PROGRESS` другим агентом — НЕ берись за неё, возьми другую из очереди.
- Когда берёшь задачу — впиши её в `docs/WIP.md` как `IN PROGRESS` (автор, дата).
- Когда закончил и закоммитил — убери её из `docs/WIP.md`.
- Если НЕ успел доделать (кончились токены/время) — оставь задачу в `docs/WIP.md` как `PAUSED`
  с описанием: что сделано, что осталось, какие файлы затронуты. Это не даст другому начать с нуля.
- Всегда `git pull` перед началом и `git push` после среза, чтобы не разойтись.

## Рабочий цикл

1. Прочитать `docs/HANDOFF.md` И `docs/WIP.md`.
2. Проверить `git status --short --branch` (при необходимости `git pull`).
3. Взять одну задачу из очереди WIP, пометить её `IN PROGRESS` в `docs/WIP.md`.
4. Сделать один маленький roadmap-срез.
4. Обновить harness.
5. Запустить `node _harness.js`.
6. Сделать browser smoke локально или публично, если менялся UI/web.
7. Обновить docs/site.
8. Создать версию в `versions/`.
9. Commit + push.
10. Обновить `docs/HANDOFF.md` последним состоянием.

## Текущие публичные URL

- Сайт: https://osminoog09-star.github.io/frontier/
- Игра: https://osminoog09-star.github.io/frontier/frontier.html

