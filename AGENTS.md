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

## Что нельзя ломать

- `requestAnimationFrame` запуск в конце `frontier.html`.
- Mobile layout: на телефоне sidebar скрыт, canvas занимает ширину экрана.
- Кодировка: не возвращать mojibake в `_core.js`, `frontier.html`, `index.html`.
- Save/load: старые сейвы должны нормализоваться через `normalizeGameState()`.
- GitHub Pages должен оставаться статическим: root + `frontier.html`.

## Рабочий цикл

1. Прочитать `docs/HANDOFF.md`.
2. Проверить `git status --short --branch`.
3. Сделать один маленький roadmap-срез.
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

