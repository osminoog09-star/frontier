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

- [IN PROGRESS] Codex 2026-06-04 - POI events foundation
  - Сделано: взял свободный срез Phase 3, не пересекающийся с Claude-плаванием.
  - Осталось: добавить одноразовый обыск POI, награды/опасность по типам, Scenario CF, сборку, документы, версию.
  - Затронутые файлы: `_core.js`, `_harness.js`, `frontier.template.html`, `frontier.html`, `versions/frontier-v2.02.html`, `ROADMAP.md`, `docs/TECH_ROADMAP.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`, `docs/WIP.md`, `index.html`.

---

## Очередь (текущий план — Phase 3: World Simulation)

1. Плавание и вода как препятствие: скорость/риск от навыка, груза и погоды.
2. События POI: руины дают находки, лагеря бандитов давление, прииски золото.
3. Frontier-экосистема: животные/опасности/фуражировка зависят от биома и погоды.

(Мультиплеер/онлайн перенесён в Phase 5. Полный план: ROADMAP.md)

---

## Последний завершённый срез

- v2.01 - Frontier points of interest (Codex, Phase 3). Добавлены `G.pois`: руины поселенцев, лагеря бандитов, золотые жилы; клик/tooltip, save/load, запрет на воду/скалы/ресурсы/стартовую область. Scenario CE. Harness A-CE (83) green.

- v2.00 - Weather affects movement (Claude-local, Phase 3). Дождь/гроза/метель замедляют движение (weatherSpeedMul). Scenario CD. Harness A-CD (82) green.

- v1.99 - Roads (Claude-local, Phase 3). Дорога на карте (floor=road) ускоряет движение x1.3; через систему полов (рендер/скорость/save). Scenario CC. Harness A-CC (81) green.

- v1.98 - Rivers + lakes (Claude-local, Phase 3). Озёра-кляксы вразброс помимо реки; постройки не на воде. Scenario CB. Harness A-CB (80) green.

- v1.97 - Resource density by biome (Claude-local, Phase 3). Деревья/камни по биому (лес густой, пустыня пустая, руда в горах); treeChanceForBiome. Scenario CA. Harness A-CA (79) green.

- 2026-06-04 - Docs status sync after v1.96 (Codex). ROADMAP.md, docs/HANDOFF.md, docs/TECH_ROADMAP.md, docs/WIP.md и index.html синхронизированы с v1.96/A-BZ (78) и текущей Phase 3. Gameplay не менялся.

- v1.96 - Biome world gen (Claude-local, Phase 3). Карта делится на биомы (пустыня/равнина/прерия/лес/горы) через biomeAt/biomeTerrain + региональный шум. Scenario BZ. Harness A-BZ (78) green.

- v1.95 - Allowed zones (Claude, Phase 2.5). Разрешённая зона ограничивает блуждание пешек (isAllowedTile); кнопка в Архитекторе. Scenario BY. Harness A-BY (77) green.


- v1.94 - Stockpile zone (Claude, Phase 2.5). Склад-зона = сток для переноски (nearestStockpileForRes/hasStockpileForRes учитывают зону). Здания-склады целы. Scenario BX. Harness A-BX (76) green.


- v1.93 - Grow-zone farming (Claude, Phase 2.5). Грядки: посев->рост(z.crops)->жатва->еда; рендер всходов. Scenario BW. Harness A-BW (75) green.


- v1.92 - Zone framework (Claude, Phase 2.5). G.zones рисуются кистью (грядка/склад-зона), рендер, save/load, снос. AI следующими срезами. Scenario BV. Harness A-BV (74) green.


- v1.91 - Weight & carry (Claude, Phase 2). Вес ресурсов (кг), грузоподъёмность, гружёный медленнее (loadSpeedMul). Scenario BU. Harness A-BU (73) green.


- v1.90 - Personality affects behavior (Claude, Phase 2). Смелость->настроение рядом с врагами; общительность->соц.отношения. Scenario BT. Harness A-BT (72) green.


- v1.89 - Personality axes (Claude, Phase 2). 8 осей характера 0-100, вывод из трейтов, ярлык в карточке (axis/personalitySummary). Поведение не задето. Scenario BS. Harness A-BS (71) green.


- v1.88 - FIX категория Архитектора не закрывается при выборе здания (Claude). Убран removeAttribute(open). Проверено в браузере. Заведён docs/BUGS.md. Harness A-BR (70) green.


- v1.87 - FIX выбор пешки справа (Claude). pointerdown вместо click: список перерисовывался между mousedown/mouseup и click не возникал. Проверено в браузере. Harness A-BR (70) green.


- v1.86 - Mentorship + shooting skill (Claude, Phase 2). Наставник рядом ускоряет рост (x1.6); навык стрельбы растёт в бою и влияет на точность/урон. Scenario BR. Harness A-BR (70) green.


- v1.85 - Skill degradation (Claude, Phase 2). Навыки без практики угасают раз в день (decaySkills); используемые сохраняются. Scenario BQ. Harness A-BQ (69) green.


- v1.84 - Skills drive work speed (Claude, Phase 2). wmul во время работы идёт через skillSpeedMul активного навыка; p._activeSkill в doSpecificWork. Пины не задеты. Scenario BP. Harness A-BP (68) green.


- v1.83 - Per-skill foundation (Claude, Phase 2). p.skills с уровнями/опытом, 10 навыков, рост практикой, кап 20, топ-навыки в карточке. wmul не тронут (0 регрессий). Scenario BO. Harness A-BO (67) green.


- v1.82 - Night effects (Claude, Phase 1). Ночью труд -15% (dayWorkMul), животные отдыхают; день/рассвет не штрафуют (сим цел). Scenario BN. Harness A-BN (66) green. Ядро Phase 1 завершено.


- v1.81 - Fire system (Claude, Phase 1). G.fires: горючесть тайлов, распространение, урон, молния-источник, дождь гасит, пешки тушат (tryFirefight). Scenario BM. Harness A-BM (65) green.


- v1.80 - Terrain movement (Claude, Phase 1). Скорость зависит от местности (трава/земля/песок); мощёный пол = дорога (x1.3). terrainSpeedMul(). Scenario BL. Harness A-BL (64) green.


- v1.79 - Day/night rework (Claude, Phase 1). Время x4 медленнее (сутки ~3.2 мин); dayPhase/daylight хелперы; нужды тик-based не задеты. Scenario BK. Harness A-BK (63) green.


- v1.78 - Roadmap revision / full audit (Claude). Полный аудит; новый 7-фазный roadmap; мультиплеер перенесён в Phase 5 (не удалён); детерминизм оставлен. Обновлены ROADMAP.md, in-game панель, сайт. Геймплей не менялся.


- v1.77 - Deterministic games from seed (Claude). newGame сидирует PRNG в начале; вся партия воспроизводима из G.seed. Harness 5/5 green (62 scn). Scenario BJ. Фундамент онлайн-синхронизации.


- v1.76 - All randomness via rng() (Claude). 26 Math.random() -> rng() в логике; поведение идентично (fallback), но случайность централизована. Готово к сидированию-на-старте. Harness A-BI (61) green, 0 аномалий.


- v1.75 - Seeded PRNG foundation (Claude). mulberry32 + rng/rngInt/seedRng; randInt через rng (по умолчанию = Math.random); G.seed в сейве. Старт Недели 3 (детерминизм). Scenario BI. Harness A-BI (61) green.


- v1.74 - Fortification research (Claude). Исследование «Фортификация»: -0.1 к шансу врага попасть по укрытой пешке; чистый хелпер enemyHitChance. Scenario BH. Harness A-BH (60) green.


- v1.73 - Sandbag cover (Claude). Мешки с песком: проходимое укрытие с усиленным cover (0.3); getCover учитывает поле cover. Scenario BG. Harness A-BG (59) green.


- v1.72 - Brute enemy (Claude). Враг «Громила»: танк ближнего боя в налётах 7+, награда 16. Scenario BF. Harness A-BF (58) green.


- v1.71 - Roof shade overlay (Claude). Крытые тайлы замкнутой комнаты показаны тенью-оверлеем; кэш recomputeRoofedCells. Дополняет roof-логику Codex (v1.69). Scenario BE. Harness A-BE (57) green.


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
