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

- v1.70 - Construction material delivery (Codex). Строитель резервирует ресурсы, несёт видимый 📦 пакет к чертежу, и только после доставки начинается progress; overlay показывает `Материалы: в пути`. Scenario BD. Harness A-BD (56) green.

- v1.69 - Room roof shelter (Codex). Закрытая комната считается крытой: пешка внутри не получает «Мокнет» под дождём/грозой, пешка снаружи продолжает мокнуть; room-панель и overlay мебели показывают крышу. Scenario BC. Harness A-BC (55) green.

- v1.68 - Blueprint material feedback (Codex). Чертежи зданий ставятся как план без мгновенного списания; строитель списывает материалы при начале работы; info-overlay/diagnostics показывают нехватку. Scenario BB. Harness A-BB (54) green, local site/game smoke green.

- v1.67 - Architect desktop polish (Codex). Desktop smoke подтвердил: Architect не перекрывает цель/миникарту/низ; help-popup и «Как играть» ведут к левой панели, старый текст про нижнее меню убран; info-overlay сдвинут. Gameplay не менялся. Harness A-BA (53) green, local site/game smoke green.

- 2026-06-03 - Roadmap identity sync (Codex). `ROADMAP.md`, `index.html`, `docs/TECH_ROADMAP.md`, `docs/DESIGN.md`, `docs/HANDOFF.md`, `docs/CHANGELOG.md` синхронизированы с направлением: RimWorld-like фундамент + Frontier-идентичность. Gameplay не менялся. Harness A-BA (53) green, local site smoke green.

- v1.66 - RimWorld-стройка срез 2b: меню-архитектор (Claude). Категории построек -> боковая панель слева; внизу слим-тулбар отмена/снести. HTML/CSS-only, ID кнопок сохранены. Harness A-BA (53) green. НУЖНА визуальная проверка.


- v1.65 - Полы влияют на уют комнаты (Claude). >=60% покрытия = бонус настроения; панель комнат показывает пол; Scenario BA. Harness A-BA (53) green.


- v1.64 - RimWorld-стройка срез 2a: стены из материалов (Claude). Дерев./каменная стена кистью, блокируют проход, стены комнаты, прочность по материалу. Scenario AZ. Harness A-AZ (52) green.


- v1.63 - Floors / RimWorld-стройка срез 1 (Claude). Полы (дерево/камень) кистью → строитель настилает по клетке; снос; save/load; Scenario AY. Harness A-AY (51) green.


- v1.62 - Building Sprite Polish (Claude). Клиника/лаборатория объёмнее (стены/крыша/вывеска), не плоские квадраты. Аудит: у всех 20 зданий есть свой спрайт. Render-only, harness зелёный.

- v1.61 - Herd Details Panel. PC stats показывает компактную animal-панель: табун, приручение, конюшни/ранчо, бонус скорости и доход ранчо. Добавлен `herdDetailRows()` и Scenario AX. Harness A-AX (50) green.

- v1.60 - Room Details Panel. PC stats показывает компактную room-панель: тип, уют, качество стен, размер и мебель по каждой найденной комнате. Добавлен `roomDetailRows()` и Scenario AW. Harness A-AW (49) green.

- v1.59 - Room Wall Quality. Комнаты показывают качество стен/формы (тесная защита/крепкие стены/широкая комната), overlay/stats обновлены, Scenario AV. Harness A-AV (48) green.

- v1.58 - Room Type Labels. Mobile-направление отложено; закрытые комнаты теперь показывают тип (спальня/столовая/жилая/украшенный угол), overlay/stats обновлены, Scenario AU. Harness A-AU (47) green.

- v1.57 - Mobile Pawn Drawer. На телефоне появилась компактная панель `Пешки`/`Лог` вместо скрытого desktop sidebar; локальный mobile smoke 390x844 green.

- v1.56 - Building Repair. Принят PAUSED-срез Claude: строители чинят повреждённые готовые здания; Scenario AT. Harness A-AT (46) green.

- v1.55 - Marksman Research. Исследование «Меткость»: точнее/больнее стрельба ковбоев. Scenario AS. Harness A-AS (45) green.

- v1.54 - Work Skill. Опыт за труд → уровни (до 10) ускоряют работу (+4%/ур). Scenario AR. Harness A-AR (44) green.

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
