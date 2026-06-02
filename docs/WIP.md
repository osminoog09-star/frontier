# WIP - текущая работа агентов (Codex / Claude / cloud)

Этот файл - "замок" задач, чтобы два агента не делали одно и то же и не ломали работу друг друга.

## Как пользоваться

1. Перед началом среза прочитать раздел "Сейчас в работе".
2. Если там есть задача `IN PROGRESS` другого агента, не брать её.
3. Когда берёшь задачу, вписать её сюда со статусом `IN PROGRESS`.
4. Если не успел закончить, оставить `PAUSED` с тем, что сделано, что осталось и какие файлы затронуты.
5. После завершённого commit убрать задачу из WIP и перенести итог в `docs/CHANGELOG.md`.

Формат:

```text
- [IN PROGRESS|PAUSED] <автор> <дата> - <название среза>
  - Сделано: ...
  - Осталось: ...
  - Затронутые файлы: ...
```

---

## Сейчас в работе

Пусто.

---

## Очередь (Неделя 2)

1. Мебель и комнаты: кровати/столы, красота, бонусы настроения.
2. Лошади/ранчо: конюшня уже готова, дальше приручение/доход/ресурсный цикл.
3. Аудио-pass: ✅ эмбиент (ветер/сверчки/дождь) — v1.45. ✅ музыка настроений — v1.47.
4. Визуальный pass 2: ✅ анимация работ пешек — v1.48. ✅ читаемость помеченных — v1.49. Осталось: автотайлинг, полировка UI.
5. Mobile UX: компактные панели для пешек/лога вместо desktop sidebar.

---

## Последний завершённый срез

- v1.53 - Arsonist Enemy. Поджигатель атакует и уничтожает постройки (брешь в обороне); в крупных налётах (6+). Scenario AQ. Harness A-AQ (43) green.

- v1.52 - Powder Barrel Trap. Бочка с порохом: взрыв по площади при подходе врага, потом расходуется. Scenario AP. Harness A-AP (42) green.

- v1.51 - Sniper Enemy. Дальнобойный опасный враг в крупных налётах (5+), награда 14. Scenario AO. Harness A-AO (41) green.

- v1.50 - Queued-Work Counter + site refresh. Панель статистики показывает очередь работ (🪓/⛏️/🎯); сайт обновлён до текущего состояния. Scenario AN расширен. Harness A-AN (40) green.

- v1.49 - Marked Readability. Пульсирующая подсветка + иконки у помеченных деревьев/камней/животных; countMarked(). Scenario AN. Harness A-AN (40) green.

- v1.48 - Work Animation. Работающие пешки машут инструментом; stateGlyph() вынесен в чистую функцию. Scenario AM. Harness A-AM (39) green.

- v1.47 - Mood Music. Тихий пад под эмбиент: calm/night/combat; musicProfile()+Sfx.setMusic(). Scenario AL. Harness A-AL (38) green.

- v1.46 - Housing Progression. Кровать в замкнутой комнате (доме) = лучший сон (comfort 3); палатка осталась ранним укрытием. Scenario AK. Harness A-AK (37) green.

- v1.45 - Ambient Audio. Эмбиент-слои по времени/погоде (ветер днём, шелест ночью, дождь, метель); ambientProfile() + Sfx.setAmbient(). Scenario AJ. Harness A-AJ (36) green.
- v1.44 - Basic Room Comfort.
- Мебель внутри замкнутой зоны из забора/ворот даёт первый room-score, mood-бонус и мысль.
- Harness A-AI green.

- v1.43 - Build Bar Groups + Minimap Clearance.
- По скрину из fix/: стройка сгруппирована в папки, миникарта отступает от реальной высоты bottom bar.
- Harness A-AH green, desktop/mobile browser smoke green.

- v1.42 - Horse Taming Slice.
- Конюшни приручают диких лошадей; приручённые лошади ускоряют ковбоев и усиливают ранчо.
- Harness A-AH green, local Chrome mobile smoke green.

- v1.41 - Ranch Daily Yield.
- Добавлено ранчо: при наличии конюшни каждый день даёт еду и золото.
- Harness A-AG green, local Chrome mobile smoke green.

- v1.40 - Homestead Comfort Score.
- Кровать, стол и декор теперь складываются в общий комфорт усадьбы; stats показывает score, mood получает мягкий bonus.
- Harness A-AF green, local Chrome mobile smoke green.

- v1.39 - Decor Beauty Slice.
- Добавлен декор как первый beauty-срез: рядом с украшением настроение растёт и появляется мысль.
- Harness A-AE green, local Chrome mobile smoke green.

- v1.38 - Table Dining Comfort Slice.
- Добавлен стол как второй срез мебели: еда за столом даёт небольшой бонус настроения и мысль.
- Harness A-AD green, local Chrome mobile smoke green.

- v1.37 - Beds Comfort Slice.
- Добавлена кровать как первый срез мебели: ковбои предпочитают её лагерю, быстрее отдыхают и получают комфорт сна.
- Harness A-AC green, local Chrome mobile smoke green.

- v1.36 - Public Site + Mobile Map Fix.
- Сайт стал понятным русским status/roadmap вместо технической простыни.
- Мобильная игра: миникарта поднята над нижней панелью, zoom/key hints скрыты, sidebar скрыт.
- Harness A-AB green, local Chrome mobile smoke green.
