# FRONTIER changelog

## 2026-06-05 - Construction/zones design correction

- По уточнению игрока зафиксирован новый строительный курс: нужна не только панель Architect, а RimWorld-like модель приказов, зон, помещений, станков, складов и job loop.
- Добавлен полный анализ `docs/BUILDING_ZONES_RIMWORLD_ANALYSIS.md`: что у нас сейчас неверно (`farm/mine/stockpile` как magic-buildings), какая целевая модель данных нужна, как должна работать шахта через помещение + станок + склад + зону добычи.
- Обновлены `ROADMAP.md`, `docs/TECH_ROADMAP.md`, `docs/HANDOFF.md`: следующий безопасный gameplay-срез - Mining zone foundation / Scenario CR. Gameplay и `frontier.html` не менялись.

## v2.18 - Architect command panel

- UI строительства переделан ближе к RimWorld-паттерну: слева остаётся стабильный список категорий `Архитектор`, а команды выбранной категории открываются отдельной панелью `ПРИКАЗЫ` справа.
- Убрано ощущение “раскрывающейся простыни”: категории больше не растягивают левую колонку вниз и не прыгают по высоте при выборе раздела.
- Добавлен явный JS-переключатель категорий: открыта ровно одна группа, активный build-mode держит свою категорию открытой, id всех build-кнопок сохранены.
- Browser smoke: новая игра, закрытие подсказки, все 8 категорий Архитектора, `Зоны -> Грядка (зона)`, движение мыши по canvas; пересечений с целью/мини-картой/сайдбаром/низом нет, console/runtime errors = 0.
- `frontier.html` пересобран через `node build.js`; harness A-CQ (95) green.

## v2.17 - FIX zone/floor preview render crash

- Исправлен критический баг из `frontier-log-day1.json`: при выборе зон (`zone_grow`, `zone_stockpile`, `zone_allowed`) preview пытался читать `BUILDS[G.buildMode].size`, падал каждый кадр и давал чёрные провалы на карте.
- Preview теперь отдельно обрабатывает `zone_*`, безопасно игнорирует неизвестный `buildMode`, а `normalizeGameState()` вычищает неизвестные типы зданий из `G.buildings`.
- Добавлен Scenario CQ: zone/floor preview + invalid building guard. Harness A-CQ (95) green.
- Live browser smoke: выбран `Зоны -> Грядка (зона)`, движение мыши по canvas, runtime/page/console errors = 0.

## v2.16 - UI polish: toast + starter hint

- Достижения/toast перенесены ниже блока цели, чтобы не перекрывать `objective-hud` в начале партии.
- Стартовая подсказка синхронизирована с текущей постройкой: вместо старого «лагерь» теперь «спальный мешок».
- Live human audit: меню, howto/roadmap/achievements, вкладки sidebar, все группы Архитектора, выбор пешки, постановка фермы, speed/save/load; runtime/page errors не обнаружены.
- `frontier.html` пересобран через `node build.js`; harness A-CP (94) green.

## v2.15 - FIX Architect closed groups

- Исправлен UI-баг Архитектора: кнопки внутри закрытых групп больше не остаются в раскладке и не перехватывают клики под другими категориями.
- Live browser smoke: новая игра, выбор пешки через правую PC-панель, открытие категории стройки, постановка фермы на canvas, ускорение, save/load; runtime/page errors не обнаружены.
- `frontier.html` пересобран через `node build.js`; harness A-CP (94) green.

## v2.14 - Adobe wall (Frontier material)

- Добавлен материал Дикого Запада: 🟫 «Саманная стена» (adobe) — дешёвая (3 дерева), но слабее деревянной (HP x0.7). Глиняный спрайт.
- Расширяет идею «строй из материала» (как stuff в RimWorld): саман/дерево/камень дают разную прочность. Блокирует проход, образует стены комнаты. Scenario CP. Harness A-CP (94) green.

## v2.13 - «Лагерь» -> «Спальный мешок» (RimWorld bedroll)

- По запросу игрока «что за лагерь»: переименовали 🏕️ «Лагерь» в 🛌 «Спальный мешок» — это RimWorld-bedroll (дешёвое раннее спальное место). Нормальный сон — на кровати в комнате (уже приоритетнее).
- Display-only (тип camp не менялся) => сценарии целы. Harness A-CO (93) green.

## v2.12 - Furniture quality raises comfort (RimWorld)

- Качество мебели теперь влияет на уют: чем выше среднее качество кроватей/столов/декора, тем больше бонус настроения (furnitureQualityBonus).
- Безопасно: «обычное» качество (навык 0) = +0, поэтому сим/пины комфорта не задеты (AF/AI целы). Scenario CO. Harness A-CO (93) green.

## v2.11 - Building quality from builder skill (RimWorld quality)

- Постройки получают КАЧЕСТВО от навыка строителя (как awful..legendary в RimWorld): обычное/хорошее/отличное/шедевр (buildingQuality по навыку building).
- Записывается при завершении (finishBlueprintIfReady), видно в info-overlay постройки. qualityMul для будущего влияния на уют/красоту.
- Безопасно: навык 0 => обычное (x1), сим не изменился. Scenario CN. Harness A-CN (92) green.

## v2.10 - RimWorld-style room types + Frontier rooms + house (Phase 2.5)

- Исследована система стройки RimWorld (docs/DESIGN.md) и расширены авто-типы комнат в том же смысле: кухня (плита), мастерская (кузня), лаборатория.
- Frontier-свои типы: «салун-зал» (салун внутри) и «барак» (2+ кровати — жильё ковбоев).
- Признак «🏠 ДОМ»: замкнутая стенами комната + дверь (ворота) теперь так и подписывается (roomHasDoor). Тип комнаты выводится ярче.
- Scenario CM. Harness A-CM (91) green, старые комнатные сценарии целы.

## v2.09 - Research rework: money + paper + pawn time (Phase 2)

- По запросу игрока исследования переделаны под RimWorld-модель: выбор проекта тратит ДЕНЬГИ + БУМАГУ, а пешка-учёный ИЗУЧАЕТ его за лабораторией (тратит время).
- Новый ресурс «бумага». Убрано пассивное накопление науки из лабораторий и мгновенная покупка за очки.
- tryResearch(p): свободная пешка идёт к лаборатории и ведёт активный проект; прогресс/активный проект в save. Панель показывает стоимость и %.
- Scenario CL. Harness A-CL (90) green, сим B чист, исследования AS целы.

## v2.08 - Combat wounds hit body parts (Phase 2/3)

- Раны в бою теперь задевают случайную часть тела (привязано к существующему 30%-событию «ранен», урон x0.4) — травмы накапливаются и снижают capacity (скорость/работа/стрельба).
- Замыкает медицинскую систему: бой -> травма части -> потеря способности -> (дальше лечение/инфекции). Автобой не сломан (A цел). Scenario CK. Harness A-CK (89) green.

## v2.07 - Body capacity affects gameplay (Phase 2/3)

- Травмы частей тела теперь влияют: раненые ноги -> медленнее (move), руки -> медленнее работа (wmul), руки/голова -> хуже стрельба (aim).
- Безопасно: целое тело = x1, поэтому симуляция не изменилась (сим B: 0 аномалий). Минимум 0.2, чтобы тяжелораненый полз, а не замирал. Scenario CJ. Harness A-CJ (88) green.

## v2.06 - Body injuries shown in pawn card (Phase 2/3)

- Карточка пешки показывает травмированные части тела (🩹 травмы: лев.нога, голова...) — новая система здоровья стала видимой.
- bodyInjurySummary(p) — чистый хелпер. Scenario CI. Harness A-CI (87) green.

## v2.05 - Body-part health foundation (Phase 2/3)

- Каркас здоровья по частям тела: p.body (голова/торс/руки/ноги), каждая часть {hp,max}.
- bodyCapacity(p,kind): move(ноги)/work(руки)/aim(руки+голова)/consciousness(голова+торс) — чистые функции 0..1.
- Ранение части снижает соответствующую способность. Создание/normalize/save пешки. Влияние на скорость/работу/бой — следующим срезом. Scenario CH. Harness A-CH (86) green.

## v2.04 - POI events foundation (Phase 3)

- Точки интереса теперь дают одноразовые события при клике: руины приносят еду/медикаменты/науку, золотая жила даёт золото/руду, лагерь бандитов даёт добычу и поднимает малый налёт.
- Карточка POI показывает исход или статус «уже обследовано»; save/load сохраняет `searched` и `exploredDay`.
- Scenario CG. Harness A-CG (84) green, guard sync/кодировки OK.

## v2.03 - Swimming foundation (Phase 3)

- Каркас плавания: swimSpeedMul(p) (скорость в воде от навыка swimming: 0.35 на 0 ур. -> 1.0 на 20) и canSwim(p) (>=3 ур. — рискнуть глубокой водой).
- Чистые функции, A* воду пока НЕ открывает (это отдельный срез — риск для путей). Scenario CF. Harness A-CF (84) green.
- Срез Claude-local; следующий Codex-срез поднял версию до v2.04 после POI-events.

## v2.01 - Frontier points of interest (Phase 3, Codex)

- На карте генерируются первые Frontier-точки интереса: руины поселенцев, лагеря бандитов и золотые жилы.
- Добавлен отдельный слой `G.pois`: точки не занимают воду/скалы, не появляются рядом со стартовой базой, не перекрываются ресурсами и сохраняются в save/load.
- Клик по точке открывает короткую карточку, tooltip показывает название. Это фундамент под будущие находки, рейды, разведку приисков и события мира.
- Scenario CE. Harness A-CE (83) green, guard sync/кодировки OK.

## v2.00 - Weather affects movement (Phase 3)

- Погода замедляет передвижение: дождь x0.92, гроза x0.85, метель x0.80 (weatherSpeedMul), вместе с местностью/грузом/лошадьми.
- Связывает погоду с движением — выходить в бурю невыгодно. Scenario CD. Harness A-CD (82) green, 0 аномалий.
- Веха v2.00: Phase 1 (время/выживание/огонь) + Phase 2 (навыки/личность/вес) + Phase 2.5 (зоны) + Phase 3 (биомы/реки/дороги/погода) — игра ощутимо глубже прототипа.

## v1.99 - Roads (Phase 3)

- На карте генерируется извилистая дорога (floor=road): ускоряет передвижение (x1.3 через terrainSpeedMul) и служит ориентиром.
- Реализована через систему полов (рендер drawFloorTile, скорость, save/load floors=3) — без правки общего рендера. Scenario CC. Harness A-CC (81) green.

## v1.98 - Rivers + lakes (Phase 3)

- Помимо реки на карте теперь появляются озёра — несколько водных «клякс» вразброс, мир разнообразнее и читаемее.
- Постройки по-прежнему не ставятся на воду (save/load round-trip: on water 0). Scenario CB (доля воды + разброс по квадрантам). Harness A-CB (80) green.

## v1.97 - Resource density by biome (Phase 3)

- Деревья и камни теперь зависят от биома: густой лес даёт много деревьев, прерия/равнина — редкие, пустыня — без деревьев; камень/руда — в горах.
- Чистый хелпер treeChanceForBiome(biome). Биом-регионы стали осмысленными для добычи/рубки. Scenario CA. Harness A-CA (79) green.

## 2026-06-04 - Docs status sync after v1.96 (Codex)

- ROADMAP.md, docs/HANDOFF.md, docs/TECH_ROADMAP.md, docs/WIP.md и index.html синхронизированы с v1.96/A-BZ (78).
- Публичный roadmap теперь честно показывает: Phase 1 завершена, Phase 3 начата, ближайшие задачи — ресурсы по биомам, вода/дороги и точки интереса.
- Gameplay не менялся; `_core.js`, `_harness.js` и `frontier.html` не редактировались.

## v1.96 - Biome world generation (Phase 3)

- Карта теперь делится на крупные биом-регионы: пустыня/равнина/прерия/лес/горы (низкочастотный шум region смещает влажность).
- Чистые функции biomeAt(e,m) и biomeTerrain(biome); тип тайла выбирается по биому существующими цветами — без правки рендера/сейва.
- tile.biome сохраняется для будущих систем (плотность деревьев, фуражировка). Scenario BZ. Harness A-BZ (78) green, save/load карты цел.

## v1.95 - Allowed zones (Phase 2.5, territory designation)

- Разрешённые зоны (выделение территории): если задана зона «Разрешённая», пешки в простое держатся в ней (блуждание ограничено зоной).
- Безопасно: ограничивает только wander/idle, не рабочие маршруты, чтобы не ломать работу. isAllowedTile() хелпер.
- Кнопка 🚷 «Разрешённая зона» в Архитекторе. Scenario BY. Harness A-BY (77) green, 0 аномалий.

## v1.94 - Stockpile zone (Phase 2.5)

- Складская зона теперь работает как сток для переноски наравне со зданием «Склад»: носильщики тащат разрешённые наземные ресурсы к ближайшей клетке зоны.
- nearestStockpileForRes/hasStockpileForRes учитывают склад-зону (zoneAllows, фильтр по умолчанию — всё). Возврат сделан {tx,ty} для единообразия.
- Здания-склады не сломаны (Scenario F цел). Scenario BX. Harness A-BX (76) green.

## v1.93 - Grow-zone farming (Phase 2.5)

- Грядки-зоны ожили: пешки-фермеры сеют на пустых клетках зоны, культура растёт (зима медленнее/лето быстрее), созревшую жнут → еда.
- Рост хранится в самой зоне (z.crops) → сохраняется в save. Рендер всходов (росток растёт, золотой при созревании).
- Параллельно зданию «Ферма», но на размеченной кистью земле — как в RimWorld. Scenario BW. Harness A-BW (75) green, сим B чист.

## v1.92 - Zone framework (Phase 2.5, RimWorld-style)

- Начат блок «Зоны и территории» (по запросу — стройка/управление как в RimWorld).
- Каркас зон G.zones: рисуются кистью по земле, не на воде/скале/зданиях; одна клетка — одна зона; снос убирает клетку зоны.
- Группа «Зоны» в Архитекторе: Грядка (зона) и Склад (зона). Рендер-оверлей с рамкой. Save/load/normalize.
- AI (посев/жатва в грядке, хранение в склад-зоне) — следующими срезами. Scenario BV. Harness A-BV (74) green.

## v1.91 - Weight & carry foundation (Phase 2)

- Реальный вес/переноска: у ресурсов вес в кг (RES_WEIGHT), у пешки грузоподъёмность (pawnCarryCapacity, база 35кг, +tough, +трудолюбие).
- Гружёная пешка двигается медленнее: loadSpeedMul по порогам (<=50% полная, ~0.85, ~0.65, перегруз 0.45). Подключено к движению (вместе с местностью и лошадьми).
- Фундамент для системы выживания/логистики; связка с terrainSpeedMul. Scenario BU. Harness A-BU (73) green; перенос (F) цел.

## v1.90 - Personality affects behavior (Phase 2)

- Оси характера теперь влияют на поведение:
  - Смелость: рядом с врагами робкие падают духом, смелые держатся (заменила бинарный трейт «Трус» на плавную ось).
  - Общительность: общительные охотнее налаживают отношения в отряде.
- Scenario BT. Harness A-BT (72) green; автобой/настроение целы.

## v1.89 - Personality axes foundation (Phase 2)

- Каркас глубокой личности: у пешки p.personality из 8 осей 0-100 (смелость, трудолюбие, агрессивность, доброта, общительность, жадность, любознательность, дисциплина).
- Оси катятся при создании и сдвигаются трейтами (brave->+смелость, lazy->-трудолюбие и т.д.). Миграция старых сейвов.
- Карточка пешки показывает краткий ярлык характера (🧠). Хелперы axis()/personalitySummary().
- Поведение пока не задето (влияние осей на реакции/настроение — следующими срезами). Scenario BS. Harness A-BS (71) green.

## v1.88 - FIX: категория «Архитектора» не схлопывается при выборе здания

- Исправлен баг: при выборе здания в боковом меню «Архитектор» категория-папка сразу закрывалась.
- Причина: легаси-вызов removeAttribute('open') после выбора (поведение старой нижней панели).
- Решение: убран; updateBuildButtons держит активную категорию открытой. Теперь можно ставить здания подряд. Проверено в браузере.
- Заведён docs/BUGS.md (список багов игрока + статусы).

## v1.87 - FIX: выбор пешки справа (PC)

- Исправлен баг: пешка не выделялась при клике в правом сайдбаре на ПК.
- Причина: список пешек пересобирается ~10 раз/сек (updateUI->renderPawns), карточка под курсором уничтожалась между mousedown и mouseup, и событие click не возникало → выбор терялся.
- Решение: делегирование переведено с click на pointerdown (срабатывает сразу при нажатии, до перерисовки). Проверено в живом браузере: selectedPawnId выставляется, карточка подсвечивается, панель приоритетов открывается, камера центрируется.

## v1.86 - Mentorship + shooting skill (Phase 2)

- Наставничество: если рядом (<=5 клеток) более умелый союзник (навык >= +2), новичок учится в 1.6x быстрее (mentorBonus в doSpecificWork).
- Навык стрельбы теперь растёт в бою и влияет: pawnHitChance(+0.5%/ур, до +10%) и pawnShotDamage(+0.3/ур). Параметры опциональны → AS/BH/автобой не задеты.
- Scenario BR. Harness A-BR (70) green, бой/меткость целы.

## v1.85 - Skill degradation (Phase 2)

- Навыки без практики медленно угасают: раз в день decaySkills() снимает немного опыта с навыков, которые не использовались, вплоть до падения уровня.
- gainSkill метит навык как practiced-today, поэтому активно используемые навыки не деградируют.
- Срабатывает на смене дня (onNewDay); пины/короткие сценарии не задеты, сим B чист (за ~1.7 дня навыки в работе). Scenario BQ. Harness A-BQ (69) green.

## v1.84 - Skills drive work speed (Phase 2)

- Per-skill навык теперь влияет на скорость работы: во время конкретной работы wmul использует skillSpeedMul активного навыка (+5%/уровень), а не общий workLevel.
- doSpecificWork выставляет p._activeSkill по типу работы; сбрасывается per-tick и перед крафтом, чтобы навык не протекал.
- Пины с навыком 0 не задеты (skillSpeedMul=1); сим B чист (пешки лишь немного быстрее по мере роста). Scenario BP. Harness A-BP (68) green.

## v1.83 - Per-skill system foundation (Phase 2)

- Начат Phase 2 (Colony Management). Каркас индивидуальных навыков: у пешки p.skills = {id:{lvl,xp}}.
- 10 навыков (рубка/ферма/добыча/стройка/охота/медицина/стрельба/перевозка/кулинария/животноводство), рост практикой через doSpecificWork, кап 20, +5%/уровень (skillSpeedMul).
- Карточка пешки показывает 3 топ-навыка с иконками. Миграция старых сейвов (normalizeGameState).
- Баланс wmul пока не тронут (per-skill подключим к скорости/бою следующими срезами) → 0 регрессий. Scenario BO. Harness A-BO (67) green.

## v1.82 - Night effects (Phase 1 complete)

- Ночь теперь влияет: труд медленнее на 15% (dayWorkMul, глубокая ночь 21-5), животные ночью отдыхают и бродят меньше.
- Рассвет (стартовый час 6:00) и день труд не штрафуют → pinned-сценарии не задеты; сим B (20k тиков через ночь) чист, 0 аномалий.
- Хелперы isNight()/dayWorkMul(h) поверх dayPhase. Эффект ночи на бой — отдельным микро-срезом позже.
- Scenario BN. Harness A-BN (66) green. Завершает ядро Phase 1 (Playable Core).

## v1.81 - Fire system (Phase 1)

- Полноценная базовая система огня: G.fires на уровне тайлов.
- Горит дерево/трава/деревянный пол/деревянные постройки; камень/вода/земля — нет (tileFuel).
- Огонь распространяется на соседние горючие тайлы, повреждает постройки/деревья, выжигает траву в землю и сжигает деревянный пол.
- Источник: молния в грозу (редко). Дождь/гроза быстро гасят огонь.
- Пешки бросают дела и тушат ближайший пожар (tryFirefight — срочнее обычной работы); потушенный пожар не уничтожает топливо.
- Рендер пламени; save/load/normalize для G.fires. Scenario BM. Harness A-BM (65) green, поджигатель (AQ) цел, 0 аномалий.

## v1.80 - Terrain affects movement (Phase 1)

- Скорость пешек теперь зависит от местности: трава x1.0, земля x0.9, песок x0.8.
- Мощёный пол работает как дорога (x1.3) — прямая связка со стройкой: вымостил пути = ковбои быстрее.
- terrainSpeedMul() — чистый хелпер; фундамент под систему веса (Phase 2) и биомы/снег/склоны (Phase 3).
- Scenario BL. Harness A-BL (64) green, движение/путь (E) не сломаны, 0 аномалий.

## v1.79 - Day/night rework (Phase 1)

- Время суток замедлено ~x4: сутки ~3.2 мин на x1 (было ~48с) — фазы дня успевают читаться. Константа MINUTES_PER_TICK.
- Нужды/работа/события тик-based и не зависят от константы → реальный темп игры не изменился, сценарий B чист (0 аномалий).
- Добавлены чистые хелперы dayPhase(h) и daylight(h) (для тинта и будущих эффектов работа/бой/животные).
- Scenario BK. Harness A-BK (63) green.

## v1.78 - Roadmap revision (full audit)

- Проведён полный аудит проекта; roadmap переписан под 7 фаз (Playable Core → Colony Mgmt → World Sim → Wild West → Multiplayer → Steam EA → Mobile).
- Мультиплеер/бэкенд/cloud/кооп НЕ удалены — перенесены в Phase 5 (сначала глубина колонии и идентичность). Детерминизм (v1.75-77) оставлен как готовый фундамент.
- Обновлены ROADMAP.md, in-game roadmap-панель (showRoadmapPanel) и публичный сайт index.html. Геймплей не менялся, harness зелёный.

## v1.77 - Deterministic games from seed

- newGame теперь сидирует PRNG в самом начале (случайный seed на партию, сохраняется в G.seed).
- Вся партия — карта, спавны, ИИ, события — детерминирована от seed. Один seed = одна и та же игра.
- Фундамент для онлайн-синхронизации (одинаковый seed + одинаковые команды = одинаковый мир).
- Проверено: harness 5/5 прогонов зелёные, 62 сценария, 0 аномалий. Scenario BJ (seed воспроизводит карту+спавны).
- Известное ограничение: позиция rng-потока пока не сохраняется в сейв (resume mid-game не идеально воспроизводим) — отдельный срез save v2.

## v1.76 - Route all randomness through rng()

- Все 26 вызовов Math.random() в логике заменены на rng() (кроме самого fallback в rng()).
- Поведение не изменилось: без сидирования rng()===Math.random. Но теперь вся случайность идёт через одну точку.
- Это завершает подготовку: при включении seedRng на старте игра станет полностью детерминированной (следующий срез, с многократной проверкой harness).
- Harness A-BI (61) green, 0 DIAG-аномалий.

## v1.75 - Seeded PRNG foundation (Week 3 start)

- Первый шаг к онлайну: фундамент детерминизма. Добавлен seeded-PRNG (mulberry32) + rng()/rngInt()/seedRng()/clearRng().
- randInt теперь идёт через rng(); по умолчанию _rng не засеян => поведение = Math.random (нулевое изменение текущей игры).
- G.seed сохраняется/загружается (зачаток save v2). При seedRng один и тот же seed воспроизводит последовательность.
- Миграция остальных Math.random-вызовов на rng — последующими срезами. Scenario BI. Harness A-BI (61) green.

## v1.74 - Fortification research

- Новое исследование «Фортификация» (100 науки): пешки за укрытием получают доп. -0.1 к шансу врага попасть.
- Расчёт вражеского попадания вынесен в чистый хелпер enemyHitChance(d, cover) — тестируемо, парно к pawnHitChance.
- Связывает мешки с песком/стены в осмысленную оборонительную ветку. Scenario BH. Harness A-BH (60) green.

## v1.73 - Sandbag cover

- Новая постройка «🛡️ Мешки с песком» (3 дерева) в группе «Оборона».
- Проходимое укрытие: пешка/враг рядом получает усиленный cover (0.3 против 0.15 у обычного здания), поэтому по тому, кто прячется за мешками, сложнее попасть.
- getCover теперь учитывает поле cover у постройки; потолок укрытия поднят до 0.5.
- Спрайт — низкий ряд мешков. Scenario BG. Harness A-BG (59) green.

## v1.72 - Brute enemy

- Новый тип врага «💪 Громила»: танковый ближний бой (hp 140, медленный, atk 18), награда 16.
- Появляется только в очень крупных налётах (7+) как 4-й по списку (после босса/снайпера/поджигателя), малые рейды не трогает.
- Scenario BF: характеристики, появление в 7+, отсутствие в рейде из 6. Harness A-BF (58) green.

## v1.71 - Roof shade overlay

- Крытые тайлы (внутри замкнутой комнаты) теперь видно: лёгкая тень-оверлей поверх земли, как в RimWorld.
- Дополняет логику укрытия от дождя Codex (v1.69) визуальным слоем — игрок видит, где крыша.
- Кэш крытых клеток (recomputeRoofedCells, пересчёт ~раз в 20 тиков) — дёшево, каждая комната флудится один раз.
- Scenario BE: клетки внутри комнаты помечены крытыми, снаружи чисто. Harness A-BE (57) green.

## v1.70 - Construction material delivery

- Стройка стала на шаг ближе к настоящей логистике: строитель резервирует ресурсы, несёт видимый 📦 пакет к чертежу, и только после доставки начинается progress.
- Пока пакет в пути, info-overlay чертежа показывает `Материалы: в пути`.
- `buildpack` защищён от обычного hauling: его нельзя случайно сдать на склад как ресурс.
- Scenario BB обновлён под новую доставку материалов; Scenario BD добавлен для проверки, что progress ждёт доставки пакета.
- Проверки: `node build.js`, `node _harness.js` green (A-BD, 56), runtime errors = 0.

## v1.69 - Room roof shelter

- Закрытая комната теперь считается крытой: под дождём/грозой пешка внутри не получает мысль `Мокнет`.
- Пешка снаружи всё ещё мокнет, поэтому эффект комнаты виден и проверяем.
- Room-панель показывает строку `крыша: есть · дождь не мочит`, а overlay мебели добавляет `крыша есть` в описание комнаты.
- Scenario BC покрывает: внутри сухо, снаружи мокнет, room-панель и label показывают крышу.
- Проверки: `node build.js`, `node _harness.js` green (A-BC, 55), runtime errors = 0.

## 2026-06-03 - Public harness badge sync

- `index.html`, `ROADMAP.md`, `docs/TECH_ROADMAP.md` и `docs/HANDOFF.md` синхронизированы с текущей проверкой v1.68: harness A-BB (54), включая Scenario BB про материалы чертежей.
- Gameplay не менялся.

## v1.68 - Blueprint material feedback

- Чертежи зданий больше не списывают ресурсы в момент клика: они ставятся как план, а стоимость списывается, когда строитель реально начинает работу.
- Если ресурсов не хватает, чертёж остаётся и показывает `Ждёт материалы: wood/ore/gold ...` в info-overlay.
- Диагностика `bp_stuck` теперь различает нехватку материалов и отсутствие свободных строителей.
- Старые сейвы совместимы: старые незавершённые blueprint считаются уже оплаченными.
- Scenario BB покрывает: план без списания, ожидание без дерева, списание при начале работы и строку info-overlay.
- Проверки: `node _harness.js` green (A-BB, 54), local browser smoke site/game green, runtime errors = 0.

## v1.67 - Architect desktop polish

- Проведён desktop smoke для боковой панели `Архитектор`: не перекрывает цель, миникарту и нижнюю панель.
- Стартовый help-popup и меню «Как играть» больше не говорят выбирать постройку снизу; теперь ведут игрока к левой панели «Архитектор».
- `info-overlay` на desktop сдвинут правее и ниже, чтобы не прятаться под Architect-панелью и верхней целью.
- Gameplay не менялся; `_core.js` изменён только ради help-текста/версии. `frontier.html` собран через `node build.js`.
- Проверки: local browser smoke site/game green, `node _harness.js` green (A-BA, 53), runtime errors = 0.

## 2026-06-03 - Roadmap identity sync

- Roadmap/site/docs синхронизированы с текущим направлением: **RimWorld-like фундамент + Frontier-идентичность**.
- `ROADMAP.md` переписан как понятный русский план: что уже сделано, что сейчас, что дальше, и почему игра не должна быть копией RimWorld.
- `index.html` обновлён до актуального v1.66/A-BA и объясняет свежие срезы: полы, стены, уют комнат, Architect-панель.
- `docs/TECH_ROADMAP.md`, `docs/DESIGN.md`, `docs/HANDOFF.md` приведены к v1.66 и текущей очереди.
- Gameplay не менялся; harness-сценарии не добавлялись. Проверка `node _harness.js` зелёная (A-BA, 53), runtime errors = 0.

## v1.66 - Architect side menu (RimWorld-style, slice 2b)

- Категории построек переехали с нижних папок в боковую панель **«Архитектор»** слева (вертикальный аккордеон), как Architect в RimWorld.
- Внизу остался слим-тулбар только с «Отмена» и «Снести».
- ID кнопок сохранены — вся игровая логика/привязки не тронуты; срез чисто визуальный (HTML/CSS).
- Harness зелёный (A-BA, 53), GUARD чистый. Требует визуальной проверки в браузере.

## v1.65 - Floors raise room comfort

- Полы теперь влияют на уют комнаты (как красота пола в RimWorld).
- Комната, где полом покрыто >=60% клеток, получает бонус к настроению (+0.04 к delta).
- Панель комнат показывает строку «пол: <материал> <%>✔».
- Хелперы roomFloorInfo/roomIsFloored/anyFlooredRoom/roomFloorBonus вынесены чисто (тестируемо).
- Scenario BA: голая комната vs застеленная — рост бонуса и floored-флаг. Harness A-BA (53) green.

## v1.64 - Walls (RimWorld-style, slice 2a)

- Срез 2a перехода стройки на RimWorld: настоящие **стены из материалов**.
- 🧱 Стена (6 дерева) и 🪨 Каменная стена (6 руды) в папке «Оборона», рисуются кистью.
- Стены блокируют проход (A*), считаются стенами комнаты, рисуются цельным блоком с фаской/кладкой (не плоско).
- Прочность по материалу: каменная стена вдвое крепче деревянной (через getBuildingMaxHp).
- Scenario AZ: блокировка прохода, стена комнаты, прочность дерево<стена<камень. Harness A-AZ (52) green.

## v1.63 - Floors (RimWorld-style)

- Начат переход стройки на модель RimWorld. Первый срез: **полы**.
- Новые постройки: Деревянный пол (2 дерева) и Каменный пол (2 руды), отдельная папка «Полы».
- Полы рисуются кистью (drag), как чертёж; пешка-строитель настилает их по клетке (отдельный слой тайла, не блокирует, мебель может стоять сверху).
- Снос убирает готовый пол или незаконченный чертёж пола.
- Save/load сохраняют полы и их чертежи; старые сейвы нормализуются.
- Scenario AY: разметка пола, отказ на воде, постройка строителем, снос. Harness A-AY (51) green.

## 2026-06-02

### v1.62 - Building Sprite Polish

- Clinic and lab no longer look like flat white/blue boxes: added walls, a roof, a door/sign and an animated flask — they read as buildings.
- Code audit: confirmed all 20 building types have a custom drawStructure case (none falls to the default placeholder).
- Render-only; existing render-smoke scenarios stay green. A-AT green, guard OK.

### v1.61 - Herd Details Panel

- PC-first ranch/horse UX slice: the stats panel now shows a compact herd panel with tamed/wild horses, taming progress, stable/ranch counts, movement bonus, and daily ranch yield.
- Added `herdDetailRows()` so herd-panel data is testable and reusable without tying the scenario to DOM.
- Harness: Scenario AX validates no-stable feedback plus stable/ranch/tamed-horse speed and yield rows. A-AX (50) green.

### v1.60 - Room Details Panel

- PC-first room UX slice: the stats panel now shows a compact list of detected rooms with type, comfort, wall quality, size, and furniture counts.
- Added `roomDetailRows()` so room-panel data is testable without coupling the scenario to DOM rendering.
- Harness: Scenario AW validates readable room detail rows for bedroom and dining/decor rooms. A-AW (49) green.

### v1.59 - Room Wall Quality

- PC-first room slice: enclosed rooms now show wall/shape quality as `тесная защита`, `крепкие стены`, or `широкая комната`.
- Room type labels and stats now include both furniture quality and wall quality.
- Harness: Scenario AV validates compact vs spacious room wall quality and summary text. A-AV (48) green.

### v1.58 - Room Type Labels

- PC-first room slice: enclosed rooms now classify furniture layouts as `спальня`, `столовая`, `жилая комната`, or `украшенный угол`.
- Furniture overlays show the concrete room type plus room quality/score for the selected bed/table/decor.
- Stats now includes a readable room-type summary instead of only a generic room score.
- Harness: Scenario AU validates bedroom/dining/living-room labels, summary text, and open non-room fallback. A-AU (47) green.
- Mobile feature work is intentionally parked for about four weeks per user direction; current work returns to PC roadmap slices.

### v1.57 - Mobile Pawn Drawer

- Mobile builds now show a compact bottom-left drawer for pawns and the event log instead of losing that information with the hidden desktop sidebar.
- The drawer starts collapsed, opens with a small pawns button, switches between `Пешки` and `Лог`, and reuses the same pawn-card click/focus behavior as desktop.
- The drawer is sized to leave the 96px minimap clear on 390px mobile screens.
- Local mobile browser smoke: 390x844, build 1.57, pawn drawer/log tabs, no minimap overlap, no horizontal overflow, no console errors.

### v1.56 - Building Repair

- Builders now repair damaged completed buildings when there are no construction blueprints to build.
- `tryRepair()` claims damaged buildings, moves a builder to them, restores HP, and logs completion.
- This gives the colony a counterplay loop after arsonists or other building damage.
- Harness: Scenario AT validates damaged fence repair to full HP and no-op when nothing is damaged. A-AT (46) green.

### v1.55 - Marksman Research (combat)

- New research «Меткость»: +0.1 pawn hit chance and +6 shot damage. Extracted pawnHitChance()/pawnShotDamage() pure helpers used by fightEnemy.
- Harness: Scenario AS (research present, hit and damage rise with it). A-AS (45) green.

### v1.54 - Work Skill Leveling

- Pawns gain work XP while working and level up (cap 10); each level adds +4% work speed via wmul (up to +40%).
- Skill level shows in the pawn card (⭐N). Old saves safe (defaults via ||0).
- Harness: Scenario AR (XP accrual, level-up speeds work, cap 10, +40% at lvl 10). A-AR (44) green.

### v1.53 - Arsonist Enemy (attacks buildings)

- New enemy «Поджигатель» (🔥): targets the nearest building instead of pawns, damaging its HP and destroying it (breaching walls/defenses). Falls back to normal behavior if there are no buildings. Joins raids of 6+ (slot after boss/sniper).
- updateArsonist() with fire particles + log on destruction; building removal uses live walkability so paths reopen.
- Harness: Scenario AQ (def, fence destroyed by adjacent arsonist, present in big raid). A-AQ (43) green.

### v1.52 - Powder Barrel Trap (defense)

- New building «Бочка с порохом» (🛢️, defense group): explodes when an enemy comes within ~1.6 tiles, dealing area damage (radius ~3.2, up to 55, falling off with distance), then is consumed.
- updateBarrels() hooked into the sim loop; particles + alarm + log on detonation.
- Harness: Scenario AP (no early boom far away, explodes+consumed when enemies are close, AoE damage). A-AP (42) green.

### v1.51 - Sniper Enemy Type (combat depth)

- New enemy «Снайпер»: long range (11 tiles), high damage, slow reload, fragile. Joins big raids (a sniper covers raids of 5+, alongside the boss); not in small raids. Kill reward 14.
- Harness: Scenario AO (def params, big-raid sniper slot, small-raid absence). A-AO (41) green.

### v1.50 - Queued-Work Counter (visual pass 2)

- Stats panel now shows what is queued for work: 🪓 trees / ⛏️ rocks / 🎯 animals via markedSummaryText().
- Pure helper markedSummaryText() (built on countMarked). Harness: Scenario AN extended. A-AN (40) green.
- Public site index.html refreshed to current state (was stale at v1.44; earlier updates targeted .stat, site uses .badge). Added AGENTS rule to keep the site current each release.

### v1.49 - Marked-Resource Readability (visual pass 2)

- Marked trees/rocks/animals now have a pulsing highlight + a small job icon (🪓/⛏️/🎯), so the player
  clearly sees what's queued for chopping/mining/hunting.
- Added pure helpers `markPulseAlpha()` and `countMarked()` (trees/rocks/animals) for HUD/tests.
- Render-only; no gameplay systems touched.
- Harness: Scenario AN (countMarked + pulsing-highlight render smoke). A-AN (40) green.

### v1.48 - Work Animation (visual pass 2 start)

- Working pawns now swing a tool (animated handle + head, oscillating with the tick) instead of a static
  "⚒" glyph — chopping/mining/building reads at a glance.
- Extracted `stateGlyph(state)` as a pure helper (testable); fighting and downed keep their own visuals.
- Render-only change, isolated to drawPawn — no gameplay systems touched.
- Harness: Scenario AM (stateGlyph map + working-render smoke). A-AM (39) green.

### v1.47 - Mood Music (finishes the audio pass)

- Added a quiet mood music pad layered under ambient: calm (day), darker (night), tense (combat — when
  enemies are alive). Generative sustained chord via WebAudio, very low gain, restarts only on change.
- `musicProfile()` pure selector (combat > night > calm); `Sfx.setMusic()` safe no-op without audio.
- Sound 🔊 toggle now also stops ambient + music when turned off.
- Harness: Scenario AL (profile selection + setMusic smoke). A-AL (38) green.

### v1.46 - Housing Progression (beds make tents make sense)

- Fixed a design redundancy: with beds, the tent/camp felt pointless. Now there is a clear progression:
  ground(0) < tent/camp(1, early shelter) < lone bed(2) < **bed inside an enclosed room/house(3)**.
- A bed inside a fenced/gated room ("house") gives the best sleep (energy 5.2) plus the room mood bonus —
  giving the player a RimWorld-like reason to wall off a bedroom.
- Additive change: existing "bed=2" semantics preserved, so Codex's Scenario AC stays valid.
- Harness: Scenario AK (lone bed 2 vs bed-in-room 3, ordered sleep rates). A-AK (37) green.
- Design note + a small logic-review checklist added to docs/DESIGN.md.

### v1.45 - Ambient Audio (Week 2 audio pass)

- Added ambient sound layers driven by time/weather: light wind by day, quieter rustle at night,
  rain during rain/storm, howling during blizzard. Looping filtered-noise bed via WebAudio.
- `ambientProfile()` is a pure selector (hour/weather → day/night/rain/blizzard); `Sfx.setAmbient()`
  only restarts the loop when the profile changes; safe no-op without audio (Node/sound off).
- Hooked into `updateUI()`; toggled by the existing 🔊 button.
- Harness: Scenario AJ validates the profile selector + setAmbient smoke. A-AJ (36) green.

### v1.44-hotfix - Deterministic harness (fix flaky Scenario AC)

- FIX: Scenario AC (bed comfort sleep) was flaky — it ran 60 ticks of RNG-driven pawn AI and the pawn
  sometimes drifted off the bed tile, so comfort read 0 and the test failed. Because scenarios `throw`
  on failure, this intermittently aborted the WHOLE harness (AD–AI never ran). It only passed for Codex
  on a lucky run. Now the pawn is pinned each tick → deterministic. All 35 scenarios (A–AI) pass reliably.
- Added AGENTS.md rule: harness scenarios must be deterministic (no reliance on Math.random in AI).
- Game build unchanged (only `_harness.js`); current playable build remains v1.44.

### v1.44 - Basic Room Comfort

- Added first room recognition pass: furniture inside a small fenced/gated enclosure counts as room comfort.
- Room comfort contributes a small mood bonus and can add the "Хорошая комната" thought.
- Research/stats panel now shows room quality: label and 0-3 score.
- Furniture info overlays show whether the furniture is inside a closed room or not.
- Harness: Scenario AI validates open furniture vs enclosed room score, bonus, label, and thought.

### v1.43 - Build Bar Groups + Minimap Clearance

- Reviewed the latest screenshot from `fix/`: minimap overlapped the build area and the build bar took too much space.
- Grouped bottom build actions into folders: Food, Logistics, Defense, Town, Ranch, Home.
- Build folders open upward, close after choosing a building, and highlight when their selected building is active.
- Minimap/zoom controls now use the measured bottom bar height, so the minimap stays above build controls on desktop and mobile.
- Browser smoke: desktop 1600x900 and mobile 390x844, no horizontal overflow, no console errors, minimap clear of the bottom bar.

### v1.42 - Horse Taming Slice

- Added a visible herd state: wild horses, tamed horses, and taming progress.
- Completed Stables now tame wild horses over days; Ranches help the taming rate.
- Tamed horses add a small movement bonus and boost Ranch daily food/gold output.
- Stable/Ranch info overlays and the stats panel now show horse state.
- Save/load persists `herd`; old saves normalize it safely.
- Harness: Scenario AH validates no-stable no-taming, stable taming, ranch boost, and speed boost.

### v1.41 - Ranch Daily Yield

- Added **Ranch (Ранчо 🤠)** as the next horses/ranch slice.
- Ranches produce daily food and gold only when at least one Stable is built.
- Added ranch build button, map drawing, and info-overlay daily yield line.
- Harness: Scenario AG validates no-yield without stable and daily food/gold yield with stable support.

### v1.40 - Homestead Comfort Score

- Added a visible **Homestead Comfort** score from built bed/table/decor.
- A complete basic furniture set gives a small global mood delta bonus.
- Pawn thoughts can now show "Уютная усадьба" when the comfort set is complete.
- Stats panel now shows `Комфорт усадьбы: <label> (score/3)`.
- Harness: Scenario AF validates score 0→3, mood bonus, label, and thought.

### v1.39 - Decor Beauty Slice

- Added **Decor (Декор 🪴)** as the first beauty/room-feel slice.
- Pawns near built decor get a small mood delta bonus and a positive "Красивый уголок" thought.
- Added a drawn decor sprite, bottom build button, and building info line.
- Harness: Scenario AE validates the nearby beauty mood bonus and thought.

### v1.38 - Table Dining Comfort Slice

- Added the **Table (Стол 🍽️)** as the second furniture/rooms slice.
- Eating with a built table gives a small mood bonus and a positive "Ел за столом" thought.
- Added a drawn table sprite, bottom build button, and building info line.
- Harness: Scenario AD validates table dining comfort vs eating without a table.

### v1.37 - Beds Comfort Slice

- Added the **Bed (Кровать 🛏️)** as the first furniture/rooms slice.
- Sleeping pawns prefer a free bed over a camp.
- Sleeping near a bed restores energy faster and gives a small mood/comfort benefit.
- Added a drawn bed sprite, bottom build button, and building info line.
- Harness: Scenario AC validates bed comfort vs rough sleep and bed preference over camp.

### v1.36 - Public Site + Mobile Map Fix

- Rebuilt the public `index.html` into a clear Russian project/status page: playable link, done/next sections, weekly plan, and document links.
- Removed the old first-screen `Roadmap.md` / `Phone access` style navigation from the public site.
- Added `assets/site-game-preview.png` as a real gameplay preview for the site hero.
- Mobile game layout: minimap is smaller and raised above the bottom build bar; zoom buttons and keyboard hints are hidden on touch/mobile.
- Local Chrome smoke: 390x844 site and game have no horizontal overflow; game sidebar is hidden; console errors = 0.

### v1.35 - Horses: Stable & Mount Speed

- Added the **Stable (Конюшня 🐴)** building. Each completed stable gives the colony horses that speed up
  pawn movement by +15% (caps at +45% with 3 stables).
- New build button + drawn structure + `mountSpeedMul()` applied to non-sleeping movement.
- Harness: Scenario AB validates the speed bonus values (1 / 1.15 / 1.45) and a 400-tick sim with stables.
- First pass of Week 2 "horses/ranch"; ranch income & taming come later.

### v1.34 - Combat Depth: Downed State (Week 2 start)

- Pawns no longer die instantly at 0 HP — they fall **unconscious (downed)** and bleed out over time.
- A downed pawn can be **rescued**: another cowboy healing them with medicine raises HP; at 25+ HP they recover.
- No rescue → they bleed out and die; a second lethal hit **finishes off** a downed pawn immediately.
- Enemies ignore downed pawns and target standing cowboys instead.
- Downed pawns are drawn lying with a blood pool + red cross; sidebar shows "🩸 Без сознания".
- Added `GAME_VERSION` constant; roadmap panel badge reads it.
- Harness: Scenario AA validates down/rescue/finish-off/bleed-out. A-AA green; Scenario A (raid) still passes.

### v1.33 - Menu Scroll Fix + Clear Roadmap + Agent Coordination

- FIX: the main-menu left column was not scrollable — bottom buttons (site, diagnostics) were cut off on
  shorter screens. Added `overflow-y:auto` so all menu buttons are reachable.
- Rewrote the in-game roadmap panel: all Russian, fixed broken `<\span>`/`<\b>` tags, current statuses
  (Week 1 DONE, Week 2 NOW), version history grouped by milestone (v1.0–1.33), and a clear "what's next".
- Agent coordination: added `docs/WIP.md` (a lock listing in-progress tasks) and an AGENTS.md rule —
  read WIP before starting, mark tasks IN PROGRESS, leave PAUSED notes if interrupted so the other agent
  doesn't restart the same work.

### v1.32 - Pre-Week-2 Audit Pass

- Full audit before starting Week 2: harness A-Z green, encoding/sync guard OK, no mojibake, git clean.
- FIX: in-game menu version label was stale (`build 0.8.0`) vs actual v1.31 — synced to current build.
- Added a protocol rule: bump `menu-ver` in `frontier.template.html` on every version snapshot to avoid drift.
- Week 1 status confirmed: logistics, production chains, walls+gates+A*, particles/shoreline DONE.
  Deferred (optional): full module refactor, terrain autotiling — folded into later visual passes.

### v1.31 - Caravan Route Trade Bonus

- Caravan Route scenario now grants a +20% route bonus to all caravan deal outputs (stacks with `trading` research).
- The tradepost panel shows a "+20% к выдаче сделок" note in the Caravan Route scenario.
- Makes the scenario's caravan-deal goal feel rewarding and distinct.
- Harness: Scenario Z validates the +20% bonus (74 vs 62 food) and the UI note; Scenarios T/U still green.

### v1.30 - Reliable Sidebar Pawn Selection

- FIX: clicking a pawn card in the right sidebar sometimes did nothing — `renderPawns()` rebuilds the
  list via `innerHTML` every few ticks, and a rebuild between mousedown/mouseup cancelled the `click`
  (worse at x2/x4 speed). Now selection uses event delegation on `#pawn-list` (survives rebuilds).
- Clicking a card selects the pawn, centers the camera on it (`focusPawn`), and opens its priority panel.
- The selected pawn is now obvious on the map: a pulsing ring + a bobbing arrow above the head.
- Harness: Scenario Y validates that `focusPawn` selects the pawn and centers the camera on it.

### v1.29 - Gold Rush Economic Risk

- Gold Rush now escalates: early days (2-5) keep the food pressure; from day 4 (even days) claim-jumper raids spawn bandits drawn to the mine.
- Raid size scales with the day, raising tension as the player gets richer.
- Harness: Scenario X validates early food pressure and escalating claim raids (day 4 vs day 6).

### v1.28 - Fort Defense Waves + Hold Reward

- Fort Defense raids are now numbered, escalating waves: day 2 → wave 1/3 (2 enemies), day 3 → 2/3 (3), day 4 → 3/3 (4).
- Holding a wave pays off: from wave 2 the colony gets gold (+15, then +20) and medicine for surviving the previous wave.
- `stats.fortWavesHeld` tracks held waves; the fort objective text shows the count.
- Save/load normalizes `fortWavesHeld` for older saves.
- Harness: Scenario W validates wave numbering, escalation, and the hold reward; Scenario S still green.


### v1.27 - Caravan Deal UI Polish + Safe Build System

- Tradepost deal buttons now show the deal output directly in the row, not only in the tooltip.
- Insufficient-gold deals are dimmed and show how much gold is missing (`не хватает N💰`).
- Panel shows current gold and a short hint ("выбери сделку").
- A "last deal" line summarizes the most recent successful caravan trade (`G._lastCaravan`).
- Harness: Scenario V validates visible outputs, the insufficient-gold hint, and the last-deal line.

- ENCODING FIX: a manual PowerShell `Get-Content -Raw` sync corrupted `frontier.html` (UTF-8 read as
  CP1251 → double-encoded Cyrillic / кракозябры). Rebuilt `frontier.html` cleanly.
- New safe build: `build.js` (Node, UTF-8) assembles `frontier.html` from `frontier.template.html`
  (`__CORE__` marker) + `_core.js`, with a built-in mojibake guard that refuses to write garbled output.
- `_harness.js` now has an encoding+sync guard: fails if `frontier.html` has mojibake or is out of sync
  with `_core.js`. This whole bug class is now caught automatically by `node _harness.js`.
- Rule: sync ONLY via `node build.js`; never hand-edit the embedded `<script>` via PowerShell.

### v1.26 - Mobile Layout Hotfix

- Fixed phone layout for the public game page.
- Mobile game now hides the desktop sidebar at a wider breakpoint and on touch devices.
- Mobile canvas now uses the full viewport without horizontal overflow.
- Topbar desktop action buttons are hidden on phones so they do not leak over the map.
- Public site no longer embeds the game iframe on phones; it shows a fullscreen play card instead.
- Mobile smoke: 390px viewport, no horizontal scroll, sidebar hidden, canvas 390x790, no runtime errors.

### v1.25 - Tradepost Deal UI

- Tradepost info panel now shows caravan profile buttons.
- Each button shows profile name and gold cost.
- Button tooltip exposes profile output.
- Clicking a profile runs that caravan deal, updates resources, and refreshes the panel.
- Harness: Scenario U.

### v1.24 - Caravan Profiles

- Added `CARAVAN_PROFILES`: `mixed`, `food`, `medicine`, `materials`.
- `runCaravanTrade(profileId)` can now run deterministic caravan deals.
- Random caravan events choose profiles for Caravan Route and keep `mixed` for the default route.
- Trading research still boosts caravan outputs.
- Successful caravan profile trades increment `stats.caravanDeals`.
- Harness: Scenario T.

### v1.23 - Scenario Event Pressure

- Added scenario-specific event modifiers.
- Gold Rush loses a small amount of food on early days to create economic pressure.
- Fort Defense spawns early scouting raids on days 2 and 4.
- Caravan Route shortens the next caravan/event timer on even days.
- Added `scenarioEventDelay()` so Caravan/Fort/Gold Rush can use different event cadence.
- Harness: Scenario S.

### v1.22 - Scenario Goals

- Added scenario-specific objective logic.
- Settlers goal remains 500 gold.
- Gold Rush goal is 700 gold.
- Fort Defense goal is survival until day 5.
- Caravan Route goal is 3 caravan deals.
- Caravan trades now increment `stats.caravanDeals`.
- Objective HUD, pawn stats panel, win condition, and help text use the same scenario goal source.
- Save/load normalizes new stats fields for older saves.
- Harness: Scenario R.

### v1.21 - Start Scenarios

- Added `SCENARIOS`: `settlers`, `goldrush`, `fort`, `caravan`.
- Added scenario start menu.
- `newGame(scenarioId)` now applies selected starting profile.
- Gold Rush starts with more ore/gold and less food.
- Fort Defense starts with perimeter, gate, tower, and extra materials.
- Caravan Route starts with tradepost and trade gold.
- Save/load persists `scenario`.
- Harness: Scenario Q.
- Public Pages smoke: scenario menu works.

### v1.20 - Tradepost Caravan

- Added buildable tradepost.
- Added caravan trade helper: gold -> food/wood/medicine.
- `trading` research improves caravan output.
- Random events can trigger caravan trade.
- Rebuilt public site in Russian.
- Added `docs/TECH_ROADMAP.md`.
- Harness: Scenario P.

### v1.19 - Production Limit Presets

- Added x1/x3/x5 output limit presets for recipe stations.
- Harness: Scenario O.

### v1.18 - Stockpile Logistics UI

- Stockpile info shows ground stacks by resource.
- Stockpile info shows stacks blocked by filters.
- Harness: Scenario N.

### v1.17 - Production Output Limits

- Added `craftLimit` for recipe stations.
- Station panel shows limit state and limit controls.
- Harness: Scenario M.

### v1.16 - Public Mobile Web

- GitHub Pages live.
- Mobile CSS hides sidebar and gives canvas full phone width.
- Inline favicon prevents `/favicon.ico` 404 noise.

### v1.15 - Production Station Toggle

- Recipe stations can be enabled/disabled.
- Harness: Scenario L.

### v1.14 - Logistics Diagnostics

- Diagnostics report ground stacks that no stockpile accepts.
- Harness: Scenario K.

### v1.13 - Stockpile Filters

- Per-stockpile resource filters.
- Haulers respect filters.
- Harness: Scenario J.

### v1.12 - Production Feedback

- Station panel shows recipe, missing inputs, and progress.
- Harness: Scenario I.

### v1.11 - Cooking

- Added kitchen.
- Meat + wood -> food.
- Harness: Scenario H.

### v1.10 - Smithy Production

- Smithy uses recipe instead of passive daily income.
- Harness: Scenario G.
