
// ==================== CONFIG ====================
const GAME_VERSION = '2.04';   // обновлять при каждом релизном срезе (см. AGENTS.md)
const TILE = 24;
const MAP_W = 80, MAP_H = 60;
// Скорость хода игровых часов. Раньше было 0.5 (сутки ~48с на x1 — слишком быстро).
// 0.125 => сутки ~3.2 мин на x1: фазы дня успевают читаться. Нужды/работа/события — тик-based, не зависят от этой константы.
const MINUTES_PER_TICK = 0.125;

const TERRAIN = { DIRT:0, GRASS:1, SAND:2, WATER:3, ROCK:4, SNOW:5 };
const TCOLORS = ['#9c7b4e','#6f9a4a','#d9bd86','#2f6ea8','#7a7570','#dfe6ef'];
const TCOLORS2 = ['#8a6b42','#5f8a3c','#cdaf73','#3a7cb8','#8c8782','#cdd6e4']; // shade variant
const TNAMES = ['Земля','Трава','Песок','Вода','Скала','Снег'];

const SEASONS = ['Весна','Лето','Осень','Зима'];
const SEASON_COLORS = ['#6a7a3a','#4a8a2a','#8a6a2a','#4a6a9a'];
const SEASON_BG = ['#6a5a3a','#5a7a2a','#7a5a2a','#3a4a6a'];

const WORK_TYPES = ['Рубка','Фермерство','Добыча','Строительство','Охота','Уход','Охрана','Перевозка'];
// Навыки per-skill (Phase 2). Растут практикой; влияние на скорость/бой подключается срезами далее.
const SKILLS = [
  {id:'woodcutting', name:'Рубка',         icon:'🪓'},
  {id:'farming',     name:'Фермерство',    icon:'🌾'},
  {id:'mining',      name:'Добыча',        icon:'⛏️'},
  {id:'building',    name:'Строительство', icon:'🔨'},
  {id:'hunting',     name:'Охота',         icon:'🏹'},
  {id:'medicine',    name:'Медицина',      icon:'💊'},
  {id:'shooting',    name:'Стрельба',      icon:'🎯'},
  {id:'hauling',     name:'Перевозка',     icon:'📦'},
  {id:'cooking',     name:'Кулинария',     icon:'🍳'},
  {id:'animals',     name:'Животноводство',icon:'🐴'},
];
// Соответствие WORK_TYPES -> навык (по индексу). 5:Уход->медицина, 6:Охрана->стрельба.
const WORK_SKILL = ['woodcutting','farming','mining','building','hunting','medicine','shooting','hauling'];
const SKILL_MAX = 20;
function ensureSkills(p) { if (!p.skills) p.skills = {}; return p.skills; }
function skillLvl(p, id) { const s = p.skills && p.skills[id]; return s ? s.lvl : 0; }
function skillNextReq(lvl) { return (lvl + 1) * 80; }
function gainSkill(p, id, amt) {
  if (!p || !id || amt <= 0) return;
  const sk = ensureSkills(p);
  if (!sk[id]) sk[id] = { lvl:0, xp:0 };
  const s = sk[id];
  s.usedToday = true;                 // практиковался сегодня — не угаснет на смене дня
  if (s.lvl >= SKILL_MAX) return;
  s.xp += amt;
  while (s.lvl < SKILL_MAX && s.xp >= skillNextReq(s.lvl)) { s.xp -= skillNextReq(s.lvl); s.lvl++; }
}
// Деградация без практики: раз в день навыки, которые не использовались, медленно угасают.
function decaySkills() {
  for (const p of G.pawns || []) {
    if (!p.alive || !p.skills) continue;
    for (const id in p.skills) {
      const s = p.skills[id];
      if (s.usedToday) { s.usedToday = false; continue; }
      if (s.lvl > 0 || s.xp > 0) {
        s.xp -= 10;
        if (s.xp < 0) { if (s.lvl > 0) { s.lvl--; s.xp = skillNextReq(s.lvl) - 10; } else s.xp = 0; }
      }
    }
  }
}
function skillSpeedMul(p, id) { return 1 + 0.05 * skillLvl(p, id); }   // +5% за уровень (до +100%)
function topSkills(p, n=3) {
  const sk = p.skills || {};
  return Object.keys(sk).map(id => ({ id, lvl: sk[id].lvl }))
    .filter(x => x.lvl > 0).sort((a,b) => b.lvl - a.lvl).slice(0, n);
}
const WORK_ICONS = ['🪓','🌾','⛏️','🔨','🦌','💊','🛡️','📦'];

// ──────────── ЛИЧНОСТЬ: оси характера 0–100 (Phase 2) ────────────
// Поверх трейтов. Влияние на поведение/настроение подключается следующими срезами.
const PERSONALITY_AXES = [
  { id:'bravery',     hi:'Смелый',            lo:'Робкий' },
  { id:'industry',    hi:'Трудолюбивый',      lo:'Ленивый' },
  { id:'aggression',  hi:'Агрессивный',       lo:'Миролюбивый' },
  { id:'kindness',    hi:'Добрый',            lo:'Чёрствый' },
  { id:'sociability', hi:'Общительный',       lo:'Замкнутый' },
  { id:'greed',       hi:'Жадный',            lo:'Щедрый' },
  { id:'curiosity',   hi:'Любознательный',    lo:'Равнодушный' },
  { id:'discipline',  hi:'Дисциплинированный',lo:'Разгильдяй' },
];
function rollPersonality(traits) {
  const t = traits || [];
  const p = {};
  for (const ax of PERSONALITY_AXES) p[ax.id] = rngInt(20, 80);
  const bump = (id, d) => { p[id] = clamp(p[id] + d, 0, 100); };
  if (t.includes('brave'))       bump('bravery', 30);
  if (t.includes('coward'))      bump('bravery', -30);
  if (t.includes('hardworking')) bump('industry', 30);
  if (t.includes('lazy'))        bump('industry', -30);
  if (t.includes('kind'))      { bump('kindness', 25); bump('sociability', 10); }
  if (t.includes('greedy'))      bump('greed', 35);
  if (t.includes('optimist'))    bump('sociability', 10);
  if (t.includes('pessimist'))   bump('sociability', -10);
  if (t.includes('drunkard'))  { bump('sociability', 15); bump('discipline', -15); }
  return p;
}
function axis(p, id) { return (p && p.personality && typeof p.personality[id] === 'number') ? p.personality[id] : 50; }
// Краткий ярлык: самая выраженная ось (или «Уравновешенный»).
function personalitySummary(p) {
  if (!p || !p.personality) return 'Уравновешенный';
  let best = null, bestDev = 0;
  for (const ax of PERSONALITY_AXES) {
    const v = axis(p, ax.id), dev = Math.abs(v - 50);
    if (dev > bestDev) { bestDev = dev; best = ax; }
  }
  if (!best || bestDev < 16) return 'Уравновешенный';
  return axis(p, best.id) >= 50 ? best.hi : best.lo;
}

const BUILDS = {
  farm:   { name:'Ферма',    icon:'🌾', cost:{wood:10},          size:1, prod:'food',  rate:0.3 },
  kitchen:{ name:'Кухня',    icon:'🍳', cost:{wood:18,ore:5},    size:2, prod:'food',  rate:0 },
  mine:   { name:'Шахта',    icon:'⛏️', cost:{wood:15,ore:0},    size:1, prod:'ore',   rate:0.2 },
  stockpile:{ name:'Склад',   icon:'▣', cost:{wood:0},             size:2, prod:'storage',rate:0 },
  fence:  { name:'Забор',    icon:'🪵', cost:{wood:5},            size:1, prod:null,   hp:100 },
  gate:   { name:'Ворота',   icon:'▫', cost:{wood:8},            size:1, prod:null,   hp:120, passable:true },
  wall:      { name:'Стена',        icon:'🧱', cost:{wood:6},     size:1, prod:null, wall:true },
  wall_stone:{ name:'Каменная стена',icon:'🪨', cost:{ore:6},     size:1, prod:null, wall:true },
  tower:  { name:'Вышка',    icon:'🗼', cost:{wood:20,ore:10},   size:1, prod:null,   range:12 },
  saloon: { name:'Салун',    icon:'🍺', cost:{wood:30,gold:10},  size:2, prod:'mood',  rate:0.1 },
  tradepost:{ name:'Торг. пост',icon:'🧳', cost:{wood:35,gold:20}, size:2, prod:'trade', rate:0 },
  lab:    { name:'Лаборатория',icon:'🔬',cost:{wood:25,ore:15},  size:2, prod:'sci',   rate:0.15 },
  clinic: { name:'Клиника',  icon:'💊', cost:{wood:20,med:0},    size:2, prod:'heal',  rate:0.3 },
  smithy: { name:'Кузня',    icon:'🔨', cost:{wood:20,ore:20},   size:2, prod:'gold',  rate:0.1 },
  camp:   { name:'Лагерь',   icon:'🏕️', cost:{wood:15},          size:2, prod:'rest',  rate:0.2 },
  bed:    { name:'Кровать',  icon:'🛏️', cost:{wood:12},          size:1, prod:'comfort',rate:0 },
  table:  { name:'Стол',     icon:'🍽️', cost:{wood:10},          size:1, prod:'comfort',rate:0 },
  decor:  { name:'Декор',    icon:'🪴', cost:{wood:8,gold:2},     size:1, prod:'beauty', rate:0 },
  well:   { name:'Колодец',  icon:'🪣', cost:{wood:10,ore:5},    size:1, prod:'water', rate:0.1 },
  stable: { name:'Конюшня',  icon:'🐴', cost:{wood:25,ore:10},   size:2, prod:'horses',rate:0 },
  ranch:  { name:'Ранчо',    icon:'🤠', cost:{wood:35,ore:8},    size:2, prod:'ranch', rate:0 },
  barrel: { name:'Бочка с порохом', icon:'🛢️', cost:{wood:5,gold:5}, size:1, prod:'trap', rate:0 },
  sandbag:{ name:'Мешки с песком', icon:'🛡️', cost:{wood:3},        size:1, prod:null, passable:true, cover:0.3 },
  floor_wood:  { name:'Деревянный пол', icon:'🟫', cost:{wood:2},          size:1, floor:'wood' },
  floor_stone: { name:'Каменный пол',   icon:'⬜', cost:{ore:2},           size:1, floor:'stone' },
};

const RECIPES = {
  smithy: { out:'gold', outAmount:6, in:{ore:4, wood:2}, work:260 },
  kitchen:{ out:'food', outAmount:14, in:{meat:8, wood:1}, work:180 },
};

const CARAVAN_PROFILES = {
  mixed:    { name:'Смешанный караван', cost:15, out:{food:35, wood:18, med:5} },
  food:     { name:'Продовольственный караван', cost:12, out:{food:62, meat:12} },
  medicine: { name:'Медицинский караван', cost:18, out:{med:18, food:18} },
  materials:{ name:'Стройматериалы', cost:20, out:{wood:58, ore:18} },
};

const TRAITS = {
  hardworking: { name:'Работяга',   icon:'💪', desc:'+25% скорость работы', good:true },
  lazy:        { name:'Лентяй',     icon:'😴', desc:'−20% скорость работы', good:false },
  brave:       { name:'Храбрец',    icon:'🦁', desc:'не падает духом в бою', good:true },
  coward:      { name:'Трус',       icon:'😨', desc:'настроение падает рядом с врагами', good:false },
  optimist:    { name:'Оптимист',   icon:'🌞', desc:'настроение растёт быстрее', good:true },
  pessimist:   { name:'Пессимист',  icon:'🌧️', desc:'настроение ниже', good:false },
  drunkard:    { name:'Выпивоха',   icon:'🍺', desc:'+отдых в салуне, но хандрит без него', good:false },
  kind:        { name:'Добряк',     icon:'❤️', desc:'улучшает отношения в отряде', good:true },
  greedy:      { name:'Жадина',     icon:'🤑', desc:'счастлив когда много золота', good:false },
  tough:       { name:'Крепкий',    icon:'🛡️', desc:'+30 макс. HP', good:true },
};
const TRAIT_KEYS = Object.keys(TRAITS);

const RESEARCHES = [
  { id:'tools',   name:'Острые инструменты', desc:'+50% добычи всех ресурсов', cost:80,  done:false, effect:'tools' },
  { id:'medicine',name:'Медицина',           desc:'Ковбои выздоравливают быстрее', cost:120, done:false, effect:'medicine' },
  { id:'cooking', name:'Кулинария',          desc:'Еда даёт +20% к настроению', cost:60,  done:false, effect:'cooking' },
  { id:'walls',   name:'Укрепления',         desc:'+50% HP строений', cost:100, done:false, effect:'walls' },
  { id:'hunting', name:'Следопытство',       desc:'Охотники убивают быстрее, +30% мяса', cost:80, done:false, effect:'hunting' },
  { id:'trading', name:'Торговля',           desc:'Торговцы приносят больше', cost:70,   done:false, effect:'trading' },
  { id:'marksman',name:'Меткость',           desc:'Ковбои метче и больнее стреляют', cost:90, done:false, effect:'marksman' },
  { id:'fortification',name:'Фортификация',  desc:'Ковбои за укрытием получают доп. защиту от выстрелов', cost:100, done:false, effect:'fortification' },
];

// ==================== STATE ====================
let G = null; // game state
let _rng = null; // seeded PRNG (null => используем Math.random; включается seedRng)
const DEFAULT_RES = { food:120, wood:60, ore:20, meat:0, med:10, sci:0, gold:30 };
const STORABLE_RES = ['food','wood','ore','meat','med','gold'];
const DEFAULT_HERD = { wild:6, tamed:0, tameProgress:0 };
const SCENARIOS = {
  settlers: { name:'Поселенцы', desc:'Обычный старт: баланс еды, дерева и золота.' },
  goldrush: { name:'Золотая лихорадка', desc:'Больше золота и руды, но меньше еды. Быстрее выход к богатству.' },
  fort: { name:'Оборона форта', desc:'Старт с периметром, воротами и вышкой. Готовься к налётам.' },
  caravan: { name:'Караванный путь', desc:'Старт с торговым постом и золотом для первых сделок.' },
};

function ensureScenarioStats() {
  if (!G.stats) G.stats = {};
  const defaults = { days:0, kills:0, foodHarvested:0, treesChopped:0, goldEarned:0, caravanDeals:0, fortWavesHeld:0 };
  for (const [key, value] of Object.entries(defaults)) {
    if (typeof G.stats[key] !== 'number' || isNaN(G.stats[key])) G.stats[key] = value;
  }
}

function ensureHerd() {
  if (!G.herd || typeof G.herd !== 'object') G.herd = {...DEFAULT_HERD};
  for (const [key, value] of Object.entries(DEFAULT_HERD)) {
    if (typeof G.herd[key] !== 'number' || isNaN(G.herd[key]) || G.herd[key] < 0) G.herd[key] = value;
  }
  G.herd.wild = Math.floor(G.herd.wild);
  G.herd.tamed = Math.floor(G.herd.tamed);
  G.herd.tameProgress = clamp(G.herd.tameProgress, 0, 99);
  return G.herd;
}

function scenarioGoalStatus() {
  ensureScenarioStats();
  const scenario = G.scenario || 'settlers';
  if (scenario === 'goldrush') {
    const target = 700;
    const value = Math.floor(G.res.gold || 0);
    return {
      scenario, value, target,
      pct: clamp(value / target, 0, 1) * 100,
      text: `Накопи 700 💰 золота (${value}/${target})`,
      sidebar: `накопить 700 💰 (сейчас: ${value})`,
    };
  }
  if (scenario === 'fort') {
    const target = 5;
    const value = Math.max(1, Math.floor(G.day || 1));
    const held = Math.floor((G.stats && G.stats.fortWavesHeld) || 0);
    return {
      scenario, value, target,
      pct: clamp((value - 1) / (target - 1), 0, 1) * 100,
      text: `Удержи форт до дня ${target} (день ${value}, удержано волн: ${held})`,
      sidebar: `удержать форт до дня ${target} (сейчас: ${value})`,
    };
  }
  if (scenario === 'caravan') {
    const target = 3;
    const value = Math.floor(G.stats.caravanDeals || 0);
    return {
      scenario, value, target,
      pct: clamp(value / target, 0, 1) * 100,
      text: `Проведи 3 караванные сделки (${value}/${target})`,
      sidebar: `провести 3 караванные сделки (сейчас: ${value})`,
    };
  }
  const target = 500;
  const value = Math.floor(G.res.gold || 0);
  return {
    scenario, value, target,
    pct: clamp(value / target, 0, 1) * 100,
    text: `Накопи 500 💰 золота (${value}/${target})`,
    sidebar: `накопить 500 💰 (сейчас: ${value})`,
  };
}

function isScenarioGoalMet() {
  const goal = scenarioGoalStatus();
  return goal.value >= goal.target;
}

function scenarioEventDelay() {
  if (!G) return 500 + randInt(0, 700);
  if (G.scenario === 'caravan') return 220 + randInt(0, 260);
  if (G.scenario === 'fort') return 360 + randInt(0, 320);
  if (G.scenario === 'goldrush') return 420 + randInt(0, 420);
  return 500 + randInt(0, 700);
}

function triggerScenarioDayEvent() {
  if (!G || G.gameOver) return null;
  if (G.scenario === 'goldrush' && G.day >= 2) {
    // Со дня 4 (чётные дни) на прииск приходят налётчики за золотом — нарастающий риск
    if (G.day >= 4 && G.day % 2 === 0) {
      const count = 2 + Math.floor(G.day / 3);
      spawnEnemy(count);
      Sfx.alarm();
      addLog(`💰 Налётчики за золотом: ${count} бандитов идут к прииску!`, 'danger');
      return { type:'goldrush_claim_raid', count };
    }
    // Ранние дни (2-5): давление по еде
    if (G.day <= 5) {
      const loss = Math.min(G.res.food, 8);
      G.res.food -= loss;
      addLog(`💰 Золотая лихорадка давит на припасы: старатели съели ${loss} еды.`, 'warn');
      return { type:'goldrush_food_pressure', loss };
    }
  }
  if (G.scenario === 'fort' && G.day >= 2 && G.day <= 4) {
    const total = 3;
    const wave = G.day - 1;           // дни 2,3,4 → волны 1,2,3
    const count = wave + 1;           // 2,3,4 бандита — нарастающие волны
    // награда за удержание ПРЕДЫДУЩЕЙ волны (со 2-й волны и далее)
    let reward = 0;
    if (wave >= 2) {
      reward = 15 + 5 * (wave - 2);   // волна2: +15, волна3: +20
      G.res.gold += reward;
      G.res.med = (G.res.med || 0) + 2;
      ensureScenarioStats();
      G.stats.fortWavesHeld = (G.stats.fortWavesHeld || 0) + 1;
    }
    spawnEnemy(count);
    Sfx.alarm();
    const rewardText = reward ? ` (+${reward}💰 и медикаменты за удержание прошлой волны)` : '';
    addLog(`🛡️ Волна ${wave}/${total}: ${count} бандитов штурмуют форт!${rewardText}`, 'danger');
    return { type:'fort_raid_pressure', wave, total, count, reward };
  }
  if (G.scenario === 'caravan' && G.day >= 2 && G.day % 2 === 0) {
    G.eventTimer = Math.min(G.eventTimer || 999, 80);
    addLog('🐎 Караванный путь оживлён: следующий караван придёт быстрее.', 'good');
    return { type:'caravan_cadence', eventTimer:G.eventTimer };
  }
  return null;
}

function newGame(scenarioId='settlers') {
  const seed = (Math.random() * 0x100000000) >>> 0;  // случайный seed на партию, сохраняется в G.seed
  seedRng(seed);                                      // дальше вся симуляция детерминирована от seed
  const map = generateMap();
  G = {
    map,
    pois: generatePOIs(map),
    seed,
    pawns: [],
    buildings: [],
    items: [],
    animals: [],
    herd: {...DEFAULT_HERD},
    enemies: [],
    projectiles: [],
    bloodSplats: [],
    particles: [],
    res: {...DEFAULT_RES},
    day: 1,
    hour: 6,
    minute: 0,
    tick: 0,
    season: 0, // 0=spring 1=summer 2=autumn 3=winter
    dayOfYear: 0, // 0-364
    weather: 'clear', // clear, rain, storm, sandstorm
    weatherTimer: 0,
    autoBattle: false,
    speed: 1,
    buildMode: null,
    selectedPawnId: null,
    demolishMode: false,
    log: [],
    researches: JSON.parse(JSON.stringify(RESEARCHES)),
    activeResearch: null,
    stats: { days:0, kills:0, foodHarvested:0, treesChopped:0, goldEarned:0, caravanDeals:0 },
    runtimeErrors: [],
    achievements: {},
    camera: { x: MAP_W*TILE/2 - 400, y: MAP_H*TILE/2 - 300, zoom: 1.0 },
    nextId: 1,
    eventTimer: 600 + rng()*600,
    gameOver: false,
    scenario: scenarioId,
  };

  // Spawn starting pawns
  const cx = Math.floor(MAP_W/2), cy = Math.floor(MAP_H/2);
  spawnPawn(cx-2, cy, 'Джек',  [1,2,3,4,4,3,4,2]);
  spawnPawn(cx,   cy, 'Бет',   [4,1,2,3,3,2,4,3]);
  spawnPawn(cx+2, cy, 'Коди',  [3,4,1,2,4,3,2,2]);
  const stockSpot = findBuildableSpot('stockpile', cx-1, cy+4, G.buildings) || {tx:cx-1, ty:cy+4};
  G.buildings.push({type:'stockpile', tx:stockSpot.tx, ty:stockSpot.ty, blueprint:false, done:true, progress:1, hp:200, maxHp:200, selected:false, filters:defaultStockpileFilters()});

  // Spawn trees & rocks — плотность зависит от биома (лес густой, пустыня пустая)
  for (let i=0; i<360; i++) {
    const x=randInt(2,MAP_W-2), y=randInt(2,MAP_H-2);
    const t = G.map[y][x];
    if (poiAt(x,y)) continue;
    if (t.obj || (t.type!==TERRAIN.GRASS && t.type!==TERRAIN.DIRT)) continue;
    if (rng() < treeChanceForBiome(t.biome)) t.obj = { type:'tree', hp:40, maxHp:40, marked:false };
  }
  for (let i=0; i<240; i++) {
    const x=randInt(2,MAP_W-2), y=randInt(2,MAP_H-2);
    const t = G.map[y][x];
    if (poiAt(x,y)) continue;
    if (t.type===TERRAIN.ROCK && !t.obj && rng() < 0.72) {
      t.obj = { type:'rock', hp:60, maxHp:60, marked:false };
    }
  }

  // Spawn animals
  for (let i=0; i<20; i++) spawnAnimal();

  applyScenario(scenarioId, cx, cy);

  _miniDirty = true;
  addLog(`🤠 Добро пожаловать на Дикий Запад! Сценарий: ${SCENARIOS[G.scenario]?.name || SCENARIOS.settlers.name}`, 'good');
  addLog('Постройте ферму и рубите деревья.', '');
  normalizeGameState('newGame');
}

function addDoneBuilding(type, tx, ty, extra={}) {
  const spot = canPlaceBuilding(type, tx, ty, G.buildings) ? {tx, ty} : findBuildableSpot(type, tx, ty, G.buildings);
  if (!spot) return null;
  const hp = getBuildingMaxHp(type);
  const b = {type, tx:spot.tx, ty:spot.ty, blueprint:false, done:true, progress:1, hp, maxHp:hp, selected:false, ...extra};
  if (type === 'stockpile') b.filters = b.filters || defaultStockpileFilters();
  normalizeRecipeStation(b);
  normalizeStockpileFilters(b);
  G.buildings.push(b);
  return b;
}

function forceDry(tx, ty, size=1) {
  for (let dy=0; dy<size; dy++) for (let dx=0; dx<size; dx++) {
    const x = tx+dx, y = ty+dy;
    if (x>=0 && y>=0 && x<MAP_W && y<MAP_H) {
      G.map[y][x].type = TERRAIN.DIRT;
      G.map[y][x].obj = null;
    }
  }
}

function addFortPerimeter(cx, cy) {
  for (let x=cx-5; x<=cx+5; x++) {
    if (x === cx) addDoneBuilding('gate', x, cy-5);
    else addDoneBuilding('fence', x, cy-5);
    addDoneBuilding('fence', x, cy+5);
  }
  for (let y=cy-4; y<=cy+4; y++) {
    addDoneBuilding('fence', cx-5, y);
    addDoneBuilding('fence', cx+5, y);
  }
  addDoneBuilding('tower', cx-4, cy-4);
}

function applyScenario(id, cx=Math.floor(MAP_W/2), cy=Math.floor(MAP_H/2)) {
  const scenario = SCENARIOS[id] ? id : 'settlers';
  G.scenario = scenario;
  if (scenario === 'goldrush') {
    G.res.food = 80;
    G.res.ore += 45;
    G.res.gold += 70;
    for (let i=0; i<10; i++) {
      const tx = clamp(cx + randInt(-8, 8), 2, MAP_W-3);
      const ty = clamp(cy + randInt(-8, 8), 2, MAP_H-3);
      G.map[ty][tx].type = TERRAIN.ROCK;
      G.map[ty][tx].obj = {type:'rock', hp:60, maxHp:60, marked:false};
    }
    addLog('💰 Золотая лихорадка: рядом больше руды и стартового золота.', 'good');
  } else if (scenario === 'fort') {
    forceDry(cx-6, cy-6, 13);
    addFortPerimeter(cx, cy);
    G.res.wood += 35;
    G.res.ore += 15;
    addLog('🛡️ Оборона форта: стартовый периметр и вышка готовы.', 'good');
  } else if (scenario === 'caravan') {
    forceDry(cx+5, cy+2, 2);
    addDoneBuilding('tradepost', cx+5, cy+2);
    G.res.gold += 45;
    G.res.food += 20;
    G.eventTimer = 260;
    addLog('🐎 Караванный путь: торговый пост построен, золото на первую сделку есть.', 'good');
  }
}

// Биом по высоте/влажности (чистая функция — тестируемо). Phase 3.
function biomeAt(e, m) {
  if (e < 0.30) return 'water';
  if (e > 0.78) return 'mountain';
  if (m > 0.62) return 'forest';
  if (m > 0.45) return 'prairie';
  if (m > 0.30) return 'plains';
  return 'desert';
}
// Тип тайла для биома (существующие TERRAIN — без правки рендера/сейва).
function biomeTerrain(biome) {
  switch (biome) {
    case 'water':    return TERRAIN.WATER;
    case 'mountain': return TERRAIN.ROCK;
    case 'forest':   return TERRAIN.GRASS;
    case 'prairie':  return TERRAIN.GRASS;
    case 'plains':   return TERRAIN.DIRT;
    case 'desert':   return TERRAIN.SAND;
    default:         return TERRAIN.DIRT;
  }
}
// Шанс дерева на пригодной клетке по биому (Phase 3): лес густой, пустыня — ноль.
function treeChanceForBiome(b) {
  return b==='forest' ? 0.55 : b==='prairie' ? 0.10 : b==='plains' ? 0.05 : 0;
}

function generateMap() {
  // Build smooth value-noise fields for large coherent biomes
  const seedA = rng()*1000, seedB = rng()*1000, seedC = rng()*1000;
  const elev = buildNoiseField(seedA, 5.5);   // height -> water / land / mountains
  const moist = buildNoiseField(seedB, 4.0);  // moisture -> grass vs sand
  const region = buildNoiseField(seedC, 2.2); // низкочастотный шум -> крупные биом-регионы

  const map = [];
  for (let y=0; y<MAP_H; y++) {
    map[y] = [];
    for (let x=0; x<MAP_W; x++) {
      const e = elev[y][x];
      // регион делает большие области суше (пустыня) или влажнее (лес)
      const m = clamp(moist[y][x] + (region[y][x] - 0.5) * 0.5, 0, 1);
      const biome = biomeAt(e, m);
      const type = biomeTerrain(biome);
      // store a per-tile variation value for subtle texture + биом для будущих систем (деревья/фуражировка)
      map[y][x] = { type, obj:null, biome, v: (Math.sin(x*12.9+y*78.2)*43758.5)%1 };
    }
  }

  // Carve a smooth river through the lowest band
  let rx = Math.floor(MAP_W*0.5);
  for (let y=0; y<MAP_H; y++) {
    rx += randInt(-1,1);
    rx = clamp(rx, 4, MAP_W-5);
    const w = 1 + (y%7===0?1:0);
    for (let dx=-w; dx<=w; dx++) {
      const xx = rx+dx;
      if (xx>=0 && xx<MAP_W) map[y][xx].type = TERRAIN.WATER;
    }
  }

  // Озёра: несколько водных «клякс» вразброс (помимо реки) — мир разнообразнее.
  const lakeCount = 3 + rngInt(0, 2);
  for (let l=0; l<lakeCount; l++) {
    const lx = rngInt(6, MAP_W-6), ly = rngInt(6, MAP_H-6), r = 2 + rngInt(0, 2);
    for (let dy=-r; dy<=r; dy++) for (let dx=-r; dx<=r; dx++) {
      const xx = lx+dx, yy = ly+dy;
      if (xx<0||yy<0||xx>=MAP_W||yy>=MAP_H) continue;
      if (dx*dx + dy*dy <= r*r) map[yy][xx].type = TERRAIN.WATER;
    }
  }

  // Smooth out single stray water tiles on land (removes salt-and-pepper)
  for (let y=1; y<MAP_H-1; y++) {
    for (let x=1; x<MAP_W-1; x++) {
      if (map[y][x].type===TERRAIN.WATER) {
        let waterN = 0;
        for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])
          if (map[y+dy][x+dx].type===TERRAIN.WATER) waterN++;
        if (waterN===0) map[y][x].type = TERRAIN.SAND;
      }
    }
  }

  // Дорога: извилистая тропа через карту (floor='road') — ускоряет движение, читаемый ориентир.
  let ry = Math.floor(MAP_H*0.5);
  for (let x=0; x<MAP_W; x++) {
    ry += rngInt(-1,1); ry = clamp(ry, 3, MAP_H-4);
    for (let dy=0; dy<=1; dy++) {
      const tt = map[ry+dy] && map[ry+dy][x];
      if (tt && tt.type!==TERRAIN.WATER && tt.type!==TERRAIN.ROCK) tt.floor = 'road';
    }
  }

  return map;
}

const POI_DEFS = {
  ruin:       { name:'Руины поселенцев', icon:'🏚️', color:'#b8a06a', note:'Старая усадьба: можно обследовать и найти припасы.', result:'еда +18, медикаменты +4, наука +4' },
  banditCamp: { name:'Лагерь бандитов',  icon:'🚩', color:'#b84a3a', note:'Опасная точка: разведка даст добычу, но поднимет тревогу.', result:'золото +20, малый налёт' },
  goldClaim:  { name:'Золотая жила',     icon:'💰', color:'#e8c95a', note:'Перспективный прииск: обследование вскрывает жилу.', result:'золото +45, руда +10' },
};

function poiDef(type) { return POI_DEFS[type] || POI_DEFS.ruin; }

function canPlacePoi(map, tx, ty, existing, avoidCx=Math.floor(MAP_W/2), avoidCy=Math.floor(MAP_H/2)) {
  if (!map || tx<3 || ty<3 || tx>=MAP_W-3 || ty>=MAP_H-3) return false;
  const t = map[ty] && map[ty][tx];
  if (!t || t.type===TERRAIN.WATER || t.type===TERRAIN.ROCK || t.obj) return false;
  if (Math.hypot(tx-avoidCx, ty-avoidCy) < 10) return false;
  for (const p of existing || []) if (Math.hypot(tx-p.tx, ty-p.ty) < 9) return false;
  return true;
}

function findPoiSpot(map, type, existing) {
  for (let tries=0; tries<700; tries++) {
    const tx = rngInt(4, MAP_W-5), ty = rngInt(4, MAP_H-5);
    const t = map[ty] && map[ty][tx];
    if (!canPlacePoi(map, tx, ty, existing)) continue;
    if (type==='goldClaim' && t.biome && t.biome!=='mountain' && t.biome!=='desert' && tries < 500) continue;
    if (type==='banditCamp' && t.floor==='road' && tries < 500) continue;
    if (type==='ruin' && t.type===TERRAIN.SAND && tries < 350) continue;
    return { tx, ty };
  }
  for (let y=4; y<MAP_H-4; y++) for (let x=4; x<MAP_W-4; x++) {
    if (canPlacePoi(map, x, y, existing)) return { tx:x, ty:y };
  }
  return null;
}

function generatePOIs(map) {
  const pois = [];
  const plan = ['ruin','ruin','banditCamp','banditCamp','goldClaim','goldClaim'];
  for (const type of plan) {
    const spot = findPoiSpot(map, type, pois);
    if (!spot) continue;
    pois.push({
      id:`poi_${type}_${spot.tx}_${spot.ty}`,
      type,
      tx:spot.tx,
      ty:spot.ty,
      discovered:false,
    });
  }
  return pois;
}

function poiAt(tx, ty) {
  return (G.pois || []).find(p => p.tx===tx && p.ty===ty);
}

function explorePoi(poi, quiet=false) {
  if (!G || !poi || !POI_DEFS[poi.type]) return false;
  poi.discovered = true;
  if (poi.searched) {
    if (!quiet) addLog(`🗺️ ${poiDef(poi.type).name} уже обследована.`, '');
    return false;
  }
  poi.searched = true;
  poi.exploredDay = G.day || 1;
  if (poi.type === 'ruin') {
    G.res.food += 18; G.res.med += 4; G.res.sci += 4;
    if (!quiet) addLog('🏚️ Руины обследованы: нашли еду, медикаменты и старые записи.', 'good');
  } else if (poi.type === 'goldClaim') {
    G.res.gold += 45; G.res.ore += 10;
    if (!quiet) addLog('💰 Прииск разведан: +45 золота и +10 руды.', 'good');
  } else if (poi.type === 'banditCamp') {
    G.res.gold += 20;
    spawnEnemy(2);
    Sfx.alarm();
    if (!quiet) addLog('🚩 Лагерь бандитов обыскан: добыча найдена, но разведчики подняли тревогу!', 'danger');
  }
  return true;
}

// Smooth value noise field 0..1 (bilinear-interpolated lattice + octaves)
function buildNoiseField(seed, scale) {
  const gw = Math.ceil(scale)+2, gh = Math.ceil(scale*MAP_H/MAP_W)+2;
  const rnd = (i,j) => {
    const n = Math.sin((i*127.1 + j*311.7 + seed)*1.0)*43758.5453;
    return n - Math.floor(n);
  };
  const field = [];
  for (let y=0; y<MAP_H; y++) {
    field[y] = [];
    for (let x=0; x<MAP_W; x++) {
      // two octaves
      let val = 0, amp = 0, freq = scale;
      for (let o=0; o<3; o++) {
        const gx = x/MAP_W*freq, gy = y/MAP_H*freq;
        const x0 = Math.floor(gx), y0 = Math.floor(gy);
        const fx = smooth(gx-x0), fy = smooth(gy-y0);
        const a = rnd(x0,y0+o*50),     b = rnd(x0+1,y0+o*50);
        const c = rnd(x0,y0+1+o*50),   d = rnd(x0+1,y0+1+o*50);
        const top = a+(b-a)*fx, bot = c+(d-c)*fx;
        val += (top+(bot-top)*fy) * (1/(o+1));
        amp += 1/(o+1);
        freq *= 2;
      }
      field[y][x] = val/amp;
    }
  }
  return field;
}
function smooth(t){ return t*t*(3-2*t); }

function spawnPawn(tx, ty, name, priorities) {
  const roles = ['Лесоруб','Фермер','Горняк','Строитель','Охотник','Медик','Охранник','Носильщик'];
  const roleIdx = priorities.indexOf(Math.min(...priorities));
  G.pawns.push({
    id: G.nextId++,
    name,
    role: roles[roleIdx],
    x: tx*TILE + TILE/2,
    y: ty*TILE + TILE/2,
    tx: tx, ty: ty,
    hp: 100, maxHp: 100,
    food: 100, maxFood: 100,
    mood: 80, maxMood: 100,
    energy: 100, maxEnergy: 100,
    alive: true,
    dead: false,
    state: 'idle', // idle, moving, working, sleeping, joy, fighting
    task: null,
    targetX: tx, targetY: ty,
    path: [],
    priorities: [...priorities], // 1=top, 4=low, 0=disabled for each WORK_TYPES
    schedule: Array(24).fill('any'), // any/sleep/work/joy
    thoughts: [],
    attackCooldown: 0,
    bleedTimer: 0,
    woundSeverity: 0, // 0-3
    traits: rollTraits(),
    opinions: {},      // {pawnId: -100..100}
    sick: null,        // {name, severity 1-3, timer}
    workMul: 1,
    workXp: 0, workLevel: 0,   // общий навык труда (легаси, влияет на wmul)
    skills: {},                // per-skill навыки (Phase 2): {id:{lvl,xp}}
    socialTimer: randInt(100,400),
    schedule_default: (() => {
      const s = Array(24).fill('work');
      for (let h=22; h<24; h++) s[h]='sleep';
      for (let h=0; h<6; h++) s[h]='sleep';
      s[12]='joy'; s[13]='joy';
      return s;
    })(),
  });
  // Apply default schedule + trait effects
  const p = G.pawns[G.pawns.length-1];
  p.schedule = [...p.schedule_default];
  applyTraitEffects(p);
}

function rollTraits() {
  const n = rng()<0.5 ? 1 : 2;
  const pool = [...TRAIT_KEYS];
  const out = [];
  for (let i=0; i<n; i++) {
    if (!pool.length) break;
    const k = pool.splice(randInt(0,pool.length-1),1)[0];
    // avoid contradictory pairs
    const conflicts = {hardworking:'lazy',lazy:'hardworking',brave:'coward',coward:'brave',optimist:'pessimist',pessimist:'optimist'};
    if (out.includes(conflicts[k])) continue;
    out.push(k);
  }
  return out;
}

function applyTraitEffects(p) {
  p.workMul = 1;
  if (p.traits.includes('hardworking')) p.workMul *= 1.25;
  if (p.traits.includes('lazy')) p.workMul *= 0.8;
  if (p.traits.includes('tough')) { p.maxHp = 130; if (p.hp===100) p.hp = 130; }
  p.personality = rollPersonality(p.traits);
}

// Effective work speed (traits + illness)
function wmul(p) {
  // Во время конкретной работы скорость задаёт соответствующий per-skill навык;
  // вне работы (или если навык не выставлен) — легаси-уровень труда.
  const skill = p._activeSkill ? skillSpeedMul(p, p._activeSkill) : (1 + 0.04 * (p.workLevel || 0));
  return (p.workMul || 1) * skill * (p.sick ? (0.7 - p.sick.severity*0.12) : 1) * dayWorkMul(G ? G.hour : 12);
}

// Опыт работы: копится, пока пешка работает; уровни до 10 ускоряют труд.
function gainWorkXp(p) {
  if (!p) return;
  p.workXp = (p.workXp || 0) + 0.05;
  const lvl = p.workLevel || 0;
  if (lvl < 10 && p.workXp >= (lvl + 1) * 100) {
    p.workLevel = lvl + 1;
    addLog(`📈 ${p.name} набрался опыта (навык ${p.workLevel}).`, '');
  }
}

function spawnAnimal(forced) {
  const types = ['deer','bison','rabbit'];
  const t = types[randInt(0, types.length-1)];
  const x = randInt(2, MAP_W-2) * TILE + TILE/2;
  const y = randInt(2, MAP_H-2) * TILE + TILE/2;
  G.animals.push({
    id: G.nextId++,
    type: t,
    x, y,
    tx: Math.floor(x/TILE), ty: Math.floor(y/TILE),
    hp: t==='bison'?80:t==='deer'?40:20,
    maxHp: t==='bison'?80:t==='deer'?40:20,
    speed: t==='rabbit'?2.5:1.5,
    meat: t==='bison'?30:t==='deer'?15:5,
    marked: false,
    wanderTimer: randInt(60,200),
    fleeTimer: 0,
    path: [], targetX:0, targetY:0,
    alive: true,
  });
}

const ENEMY_TYPES = {
  knifer: { name:'Головорез', hp:55, speed:1.6, atk:10, range:1.5,  ranged:false, color:'#8a2020', reload:55,  icon:'🔪' },
  gunner: { name:'Стрелок',   hp:65, speed:1.1, atk:9,  range:7.0,  ranged:true,  color:'#a04428', reload:110, icon:'🔫' },
  boss:   { name:'Главарь',   hp:160,speed:1.0, atk:16, range:6.0,  ranged:true,  color:'#6a1818', reload:90,  icon:'🤠' },
  sniper: { name:'Снайпер',   hp:45, speed:0.9, atk:22, range:11.0, ranged:true,  color:'#7a5a2a', reload:170, icon:'🎯' },
  arsonist:{ name:'Поджигатель',hp:50,speed:1.35,atk:6, range:1.5,  ranged:false, color:'#b8602a', reload:45,  icon:'🔥', burns:true },
  brute:  { name:'Громила',   hp:140,speed:0.85,atk:18, range:1.6,  ranged:false, color:'#5a3520', reload:70,  icon:'💪' },
};

function spawnEnemy(count) {
  const side = randInt(0,3);
  for (let i=0; i<count; i++) {
    let ex, ey;
    if (side===0) { ex=randInt(0,MAP_W-1); ey=0; }
    else if (side===1) { ex=MAP_W-1; ey=randInt(0,MAP_H-1); }
    else if (side===2) { ex=randInt(0,MAP_W-1); ey=MAP_H-1; }
    else { ex=0; ey=randInt(0,MAP_H-1); }
    // pick type: boss ведёт крупный рейд, снайпер прикрывает большие налёты, остальные — стрелки/головорезы
    let type;
    if (i===0 && count>=4) type='boss';
    else if (i===1 && count>=5) type='sniper';
    else if (i===2 && count>=6) type='arsonist';
    else if (i===3 && count>=7) type='brute';
    else type = rng()<0.5 ? 'gunner' : 'knifer';
    const def = ENEMY_TYPES[type];
    G.enemies.push({
      id: G.nextId++,
      type,
      x: ex*TILE+TILE/2, y: ey*TILE+TILE/2,
      tx: ex, ty: ey,
      hp: def.hp + randInt(0,15),
      maxHp: def.hp + 15,
      speed: def.speed,
      atk: def.atk,
      range: def.range,
      ranged: def.ranged,
      reload: def.reload,
      path: [], targetX:ex, targetY:ey,
      attackCooldown: randInt(0,40),
      alive: true,
    });
  }
}

// Какое музыкальное настроение сейчас (чистая функция — тестируемо): бой важнее ночи важнее дня.
function musicProfile() {
  if (!G) return 'calm';
  if (G.enemies && G.enemies.some(e => e.alive)) return 'combat';
  const h = G.hour;
  if (h < 6 || h >= 21) return 'night';
  return 'calm';
}

// Какой эмбиент-слой играть сейчас (чистая функция от состояния — тестируемо).
function ambientProfile() {
  if (!G) return 'day';
  const w = G.weather;
  if (w === 'rain' || w === 'storm') return 'rain';
  if (w === 'blizzard') return 'blizzard';
  const h = G.hour;
  if (h < 6 || h >= 21) return 'night';
  return 'day';
}

// Лошади из конюшен ускоряют передвижение колонии: каждая готовая конюшня +15%, максимум +45%.
// Множитель скорости от местности (фундамент под систему веса Phase 2).
// Мощёный пол = «дорога» (быстрее); песок/земля медленнее травы. Биомы/снег/склоны — Phase 3.
function terrainSpeedMul(tx, ty) {
  if (!G || !G.map || !G.map[ty] || !G.map[ty][tx]) return 1;
  const t = G.map[ty][tx];
  if (t.floor) return 1.3;                 // мощёный пол ускоряет
  switch (t.type) {
    case TERRAIN.GRASS: return 1.0;
    case TERRAIN.DIRT:  return 0.9;
    case TERRAIN.SAND:  return 0.8;
    default: return 1.0;
  }
}
// ──────────── ВЕС И ПЕРЕНОСКА (Phase 2) ────────────
// Вес единицы ресурса в кг (реалистичные ориентиры, затем подгонка под играбельность).
const RES_WEIGHT = { food:0.5, wood:2.5, ore:4, meat:0.6, med:0.3, gold:0.1, sci:0, buildpack:2.5 };
function pawnCarryCapacity(p) {
  let cap = 35;                                   // базовая комфортная нагрузка, кг
  if (p && p.traits && p.traits.includes('tough')) cap += 12;
  if (p) cap += Math.round((axis(p,'industry') - 50) / 5);  // трудолюбивые тащат чуть больше
  return Math.max(20, cap);
}
function pawnLoad(p) {
  if (!p || !p.carry) return 0;
  const w = RES_WEIGHT[p.carry.res];
  return (typeof w === 'number' ? w : 1) * (p.carry.amount || 0);
}
// Множитель скорости от загрузки: налегке — полная, перегруз — почти стоп.
function loadSpeedMul(p) {
  const cap = pawnCarryCapacity(p);
  const ratio = cap > 0 ? pawnLoad(p) / cap : 0;
  if (ratio <= 0.5) return 1;
  if (ratio <= 0.8) return 0.85;
  if (ratio <= 1.0) return 0.65;
  return 0.45;
}
// Плавание (Phase 3, каркас): скорость в воде зависит от навыка swimming.
// A* воду пока не открывает — это отдельный срез; здесь только чистые функции для него.
function swimSpeedMul(p) { return clamp(0.35 + 0.0325 * skillLvl(p, 'swimming'), 0.35, 1); }
function canSwim(p) { return skillLvl(p, 'swimming') >= 3; }   // достаточно умеет, чтобы рискнуть глубокой водой
// Погода замедляет передвижение: дождь/гроза/метель (Phase 3).
function weatherSpeedMul() {
  if (!G) return 1;
  switch (G.weather) {
    case 'rain':     return 0.92;
    case 'storm':    return 0.85;
    case 'blizzard': return 0.80;
    default:         return 1;
  }
}
function mountSpeedMul() {
  if (!G || !G.buildings) return 1;
  const stables = G.buildings.filter(b => b.type === 'stable' && b.done && !b.blueprint).length;
  const herd = ensureHerd();
  return 1 + Math.min(stables, 3) * 0.15 + Math.min(herd.tamed, 4) * 0.05;
}
function horseTamingRate() {
  if (!G || !G.buildings) return 0;
  const stables = G.buildings.filter(b => b.type === 'stable' && b.done && !b.blueprint).length;
  const ranches = G.buildings.filter(b => b.type === 'ranch' && b.done && !b.blueprint).length;
  if (!stables) return 0;
  return stables * 35 + ranches * 10;
}
function processHorseTaming() {
  const herd = ensureHerd();
  const rate = horseTamingRate();
  if (!rate || herd.wild <= 0) return { tamed:0, rate, progress:herd.tameProgress };
  herd.tameProgress += rate;
  let tamedNow = 0;
  while (herd.tameProgress >= 100 && herd.wild > 0) {
    herd.tameProgress -= 100;
    herd.wild--;
    herd.tamed++;
    tamedNow++;
  }
  if (herd.wild <= 0) herd.tameProgress = 0;
  if (tamedNow) addLog(`🐴 Приручено лошадей: +${tamedNow} (в табуне: ${herd.tamed})`, 'good');
  return { tamed:tamedNow, rate, progress:herd.tameProgress };
}
function ranchDailyYield() {
  if (!G || !G.buildings) return { food:0, gold:0 };
  const herd = ensureHerd();
  const ranches = G.buildings.filter(b=>b.type==='ranch' && b.done && !b.blueprint).length;
  const stables = G.buildings.filter(b=>b.type==='stable' && b.done && !b.blueprint).length;
  if (!ranches || !stables) return { food:0, gold:0 };
  const herdBonus = Math.min(herd.tamed, ranches * 4);
  const food = ranches * 8 + herdBonus * 2;
  const gold = ranches * Math.min(stables, 3) * 2 + herdBonus;
  return { food, gold };
}
function herdDetailRows() {
  const herd = ensureHerd();
  const stables = (G && G.buildings ? G.buildings : []).filter(b=>b.type==='stable' && b.done && !b.blueprint).length;
  const ranches = (G && G.buildings ? G.buildings : []).filter(b=>b.type==='ranch' && b.done && !b.blueprint).length;
  const rate = horseTamingRate();
  const y = ranchDailyYield();
  const speedBonus = Math.round((mountSpeedMul() - 1) * 100);
  return [
    { label:'Табун', value:`${herd.tamed} приручено / ${herd.wild} диких` },
    { label:'Приручение', value:rate ? `${herd.tameProgress}/100 · +${rate}/день` : 'нужна конюшня' },
    { label:'Постройки', value:`конюшни: ${stables}, ранчо: ${ranches}` },
    { label:'Скорость', value:`+${speedBonus}% к движению` },
    { label:'Доход ранчо', value:y.food || y.gold ? `${y.food} еды / ${y.gold} золота в день` : 'нет дохода' }
  ];
}

// ==================== AI ====================
function updatePawns() {
  G._claims = {}; // reset per-tick job reservations (workplace key -> count)
  for (const p of G.pawns) {
    if (!p.alive) continue;
    if (p.downed) { updateDowned(p); continue; } // лежит без сознания — обычный ИИ не работает
    p._wt = null; // reset current work tag before schedule/combat can branch away
    p._activeSkill = null; // сбрасываем активный навык (выставляется в doSpecificWork)
    p.attackCooldown = Math.max(0, p.attackCooldown - 1);

    // Passive stats
    if (G.tick % 60 === 0) { // once per in-game minute (approx)
      p.food = clamp(p.food - 0.5, 0, p.maxFood);
      const comfort = sleepComfortAt(p);
      const dE = (p.state==='sleeping' ? sleepEnergyRate(comfort) : -0.3);
      p.energy = clamp(p.energy + dE, 0, p.maxEnergy);
      if (p.state==='sleeping' && comfort >= 2) p.mood = clamp(p.mood + (comfort >= 3 ? 0.8 : 0.5), 0, 100);
      if (p.food <= 0) p.hp = Math.max(0, p.hp - 2);
      if (p.hp <= 0) downPawn(p);
    }

    // Eat if hungry
    if (p.food < 40 && G.res.food >= 5) {
      G.res.food -= 5;
      p.food = Math.min(p.maxFood, p.food + 30);
      if (hasDiningTable()) {
        p.mood = clamp(p.mood + 2, 0, 100);
        addThought(p, '🍽️ Ел за столом', 6, true);
      } else {
        addThought(p, '🍖 Поел', 5, true);
      }
    }

    // Update mood
    const moodDelta = calcMoodDelta(p);
    p.mood = clamp(p.mood + moodDelta * 0.02, 0, 100);

    if (p.mood < 10 && rng() < 0.002) {
      addLog(`😡 ${p.name} устроил срыв!`, 'warn');
      p.state = 'breakdown';
      setTimeout(() => { if(p.alive) p.state='idle'; }, 5000);
    }

    // Healing
    if (p.hp < p.maxHp && p.state==='sleeping') {
      const healRate = hasResearch('medicine') ? 0.3 : 0.1;
      p.hp = Math.min(p.maxHp, p.hp + healRate);
    }

    // ---- COMBAT: overrides schedule (auto-battle, self-defense, OR manual target) ----
    let inCombat = false;
    if (G.enemies.length > 0) {
      // auto-battle: engage in wide radius; otherwise self-defense in close radius
      const radius = G.autoBattle ? 22 : 7;
      const e = nearestEnemy(p, radius);
      if (e) { fightEnemy(p, e); inCombat = true; }
      else if (p.state === 'fighting' && !p.manualTarget) p.state = 'idle';
    }
    if (!inCombat && p.manualTarget != null) {
      const e = G.enemies.find(en => en.id === p.manualTarget && en.alive);
      if (e) { fightEnemy(p, e); inCombat = true; }
      else { p.manualTarget = null; if (p.state === 'fighting') p.state = 'idle'; }
    }

    if (!inCombat) {
      // Decide what to do based on schedule
      const schedSlot = p.schedule[G.hour];
      if (p.state === 'breakdown') { /* frozen */ }
      else if (schedSlot === 'sleep' || p.energy < 5) doSleep(p);
      else if (schedSlot === 'joy') doJoy(p);
      else doWork(p);
    }

    // Movement (faster when charging into combat); конюшни дают лошадей → ускорение
    const base = p.state==='sleeping' ? 0.5 : inCombat ? 2.4 : 2.0;
    const terrain = terrainSpeedMul(Math.floor(p.x/TILE), Math.floor(p.y/TILE));
    const moveSpeed = base * (p.state==='sleeping' ? 1 : mountSpeedMul()) * terrain * loadSpeedMul(p) * weatherSpeedMul();
    moveTowardsTarget(p, moveSpeed);

    if (p.state === 'working') gainWorkXp(p);   // опыт за труд

    // Social interactions
    updateSocial(p);

    // Illness progression
    updateIllness(p);

    // Update thoughts periodically
    if (G.tick % 300 === p.id % 300) updateThoughts(p);
  }
}

function updateSocial(p) {
  p.socialTimer--;
  if (p.socialTimer > 0) return;
  p.socialTimer = randInt(200, 500);
  // find a nearby colleague
  const other = G.pawns.find(q => q.alive && q.id!==p.id && Math.hypot(q.x-p.x,q.y-p.y)<TILE*4);
  if (!other) return;
  if (p.opinions[other.id]===undefined) p.opinions[other.id]=0;
  // chemistry: kind boosts, pessimist/greedy can clash
  let change = randInt(-3, 5);
  change += Math.round((axis(p,'sociability') - 50) / 20);   // общительный охотнее ладит
  if (p.traits.includes('kind') || other.traits.includes('kind')) change += 4;
  if (p.traits.includes('pessimist')) change -= 2;
  p.opinions[other.id] = clamp(p.opinions[other.id] + change, -100, 100);
  const op = p.opinions[other.id];
  if (op > 40 && rng()<0.3) { addThought(p,'😊 Поболтал с другом',6,true); p.mood=Math.min(100,p.mood+3); }
  else if (op < -40 && rng()<0.3) { addThought(p,'😠 Поссорился',6,false); p.mood=Math.max(0,p.mood-3);
    if (rng()<0.15) addLog(`💢 ${p.name} и ${other.name} поругались`, ''); }
}

function updateIllness(p) {
  // random chance to fall ill (worse in winter / low mood)
  if (!p.sick && G.tick % 200 === p.id % 200) {
    let chance = 0.004;
    if (G.season===3) chance *= 2;
    if (p.food < 30) chance *= 2;
    if (rng() < chance) {
      const diseases = ['Лихорадка','Простуда','Дизентерия','Инфекция'];
      p.sick = { name: diseases[randInt(0,diseases.length-1)], severity: 1, timer: 0 };
      addLog(`🤒 ${p.name} заболел: ${p.sick.name}`, 'warn');
    }
  }
  if (p.sick) {
    p.sick.timer++;
    const treated = G.res.med > 0 && (nearestBuilding(p,'clinic') || hasResearch('medicine'));
    if (treated) {
      // recovering
      if (G.tick % 120 === 0) {
        G.res.med = Math.max(0, G.res.med - 0.3);
        p.sick.timer -= 200;
        if (p.sick.timer < -300) { addLog(`💚 ${p.name} выздоровел`, 'good'); p.sick=null; return; }
      }
    } else {
      // worsening
      if (p.sick.timer > 600 && p.sick.severity < 3) { p.sick.severity++; p.sick.timer=0; }
      if (p.sick.severity >= 3 && G.tick % 60 === 0) p.hp = Math.max(0, p.hp - 1);
      if (p.hp <= 0) downPawn(p);
    }
    // sick pawns work slower
  }
}

function calcMoodDelta(p) {
  let delta = 0;
  if (p.food > 80) delta += 0.2;
  else if (p.food < 30) delta -= 0.5;
  if (p.hp < 50) delta -= 0.3;
  if (p.energy > 80) delta += 0.1;
  if (G.weather === 'sandstorm') delta -= 0.4;
  if (G.season===3) delta -= 0.1; // winter
  if (hasResearch('cooking') && p.food > 60) delta += 0.1;
  if (p.sick) delta -= 0.3 * p.sick.severity;
  if (p.state === 'sleeping' && sleepComfortAt(p) >= 2) delta += 0.15;
  if (nearBeautyDecor(p)) delta += 0.2;
  delta += homesteadComfortBonus();
  delta += roomComfortBonus();

  // Traits
  if (p.traits.includes('optimist')) delta += 0.15;
  if (p.traits.includes('pessimist')) delta -= 0.15;
  if (p.traits.includes('greedy')) delta += G.res.gold > 200 ? 0.2 : -0.1;
  // Смелость (ось характера): рядом с врагами робкие падают духом, смелые — собранны.
  if (G.enemies.length>0) {
    const near = G.enemies.some(e=>e.alive!==false && Math.hypot(e.x-p.x,e.y-p.y)<TILE*12);
    if (near) delta += (axis(p,'bravery') - 50) / 100 * 0.8;   // bravery 0→-0.4, 100→+0.4
  }
  if (p.traits.includes('drunkard')) {
    const nearSaloon = nearestBuilding(p,'saloon') && p.state==='joy';
    delta += nearSaloon ? 0.2 : -0.12;
  }
  return delta;
}

function updateThoughts(p) {
  p.thoughts = [];
  if (p.food < 30) p.thoughts.push({text:'😩 Голоден', neg:true});
  else if (p.food > 80) p.thoughts.push({text:'😋 Сыт', neg:false});
  if (p.energy < 20) p.thoughts.push({text:'😴 Устал', neg:true});
  if (p.hp < 50) p.thoughts.push({text:'🤕 Ранен', neg:true});
  if (p.mood > 80) p.thoughts.push({text:'😊 Счастлив', neg:false});
  else if (p.mood < 30) p.thoughts.push({text:'😞 Подавлен', neg:true});
  if ((G.weather === 'rain' || G.weather === 'storm') && !pawnShelteredByRoom(p)) p.thoughts.push({text:'🌧️ Мокнет', neg:true});
  if (G.season===3) p.thoughts.push({text:'❄️ Зябко', neg:true});
  if (p.sick) p.thoughts.push({text:`🤒 ${p.sick.name}`, neg:true});
  if (sleepComfortAt(p) >= 2 && p.energy > 50) p.thoughts.push({text:'🛏️ Спал в кровати', neg:false});
  if (nearBeautyDecor(p)) p.thoughts.push({text:'🪴 Красивый уголок', neg:false});
  if (homesteadComfortScore() >= 3) p.thoughts.push({text:'🏠 Уютная усадьба', neg:false});
  if (roomComfortScore() >= 2) p.thoughts.push({text:'🏠 Хорошая комната', neg:false});
}

function addThought(p, text, duration, positive) {
  p.thoughts.push({text, neg:!positive});
  setTimeout(() => {
    const i = p.thoughts.findIndex(t=>t.text===text);
    if (i>=0) p.thoughts.splice(i,1);
  }, duration*1000);
}

const CAMP_CAP = 3; // сколько ковбоев помещается в один лагерь/палатку
const BED_CAP = 1;
// Прогрессия жилья (как в RimWorld): земля(0) < палатка/лагерь(1) < одиночная кровать(2) < кровать в доме(3).
// «Дом» = кровать внутри замкнутой комнаты из стен/ворот (enclosedRoomAt). Палатка — ранняя времянка.
function sleepComfortAt(p) {
  if (!p || !G || !G.buildings) return 0;
  const bed = G.buildings.find(b=>b.type==='bed' && b.done && !b.blueprint && distTiles(p,b.tx,b.ty)<=1.2);
  if (bed) return enclosedRoomAt(bed.tx, bed.ty) ? 3 : 2;   // кровать в комнате = 3, одиночная = 2
  if (G.buildings.some(b=>b.type==='camp' && b.done && !b.blueprint && distTiles(p,b.tx,b.ty)<=1.8)) return 1;
  return 0;
}
function sleepEnergyRate(comfort) {
  if (comfort >= 3) return 5.2;   // кровать в доме — лучший сон
  if (comfort >= 2) return 4.4;
  if (comfort >= 1) return 3.2;
  return 2.4;
}
function hasDiningTable() {
  return !!(G && G.buildings && G.buildings.some(b=>b.type==='table' && b.done && !b.blueprint));
}
function nearBeautyDecor(p) {
  return !!(p && G && G.buildings && G.buildings.some(b=>b.type==='decor' && b.done && !b.blueprint && distTiles(p,b.tx,b.ty)<=5));
}
function homesteadComfortScore() {
  if (!G || !G.buildings) return 0;
  const built = type => G.buildings.some(b=>b.type===type && b.done && !b.blueprint);
  return (built('bed') ? 1 : 0) + (built('table') ? 1 : 0) + (built('decor') ? 1 : 0);
}
function homesteadComfortBonus() {
  const score = homesteadComfortScore();
  if (score >= 3) return 0.12;
  if (score >= 2) return 0.05;
  return 0;
}
function homesteadComfortLabel() {
  const score = homesteadComfortScore();
  if (score >= 3) return 'уютная';
  if (score >= 2) return 'обживается';
  if (score >= 1) return 'зачатки';
  return 'нет';
}
function isRoomWallAt(tx, ty) {
  return !!(G && G.buildings && G.buildings.some(b => {
    if (!b.done || b.blueprint || !(['fence','gate'].includes(b.type) || BUILDS[b.type]?.wall)) return false;
    const size = BUILDS[b.type]?.size || 1;
    return tx >= b.tx && ty >= b.ty && tx < b.tx + size && ty < b.ty + size;
  }));
}
function enclosedRoomAt(tx, ty, maxTiles=80) {
  if (!G || !G.map || tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return null;
  if (isRoomWallAt(tx, ty)) return null;
  const seen = new Set();
  const q = [[tx, ty]];
  let walls = 0;
  let reachedEdge = false;
  while (q.length) {
    const [x, y] = q.shift();
    const key = x + ',' + y;
    if (seen.has(key)) continue;
    if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) { reachedEdge = true; continue; }
    if (isRoomWallAt(x, y)) { walls++; continue; }
    const tile = G.map[y][x];
    if (!tile || tile.type === TERRAIN.WATER || tile.type === TERRAIN.ROCK) { walls++; continue; }
    seen.add(key);
    if (x === 0 || y === 0 || x === MAP_W-1 || y === MAP_H-1) reachedEdge = true;
    if (seen.size > maxTiles) return null;
    q.push([x+1,y], [x-1,y], [x,y+1], [x,y-1]);
  }
  if (reachedEdge || seen.size < 4 || walls < 8) return null;
  return { tiles: seen.size, walls, cells: seen };
}
function isFurnitureInRoom(type) {
  return !!(G && G.buildings && G.buildings.some(b => b.type === type && b.done && !b.blueprint && enclosedRoomAt(b.tx, b.ty)));
}
function roomHasTile(room, tx, ty) {
  return !!(room && room.cells && room.cells.has(tx + ',' + ty));
}
function roomFurnitureCounts(room) {
  const counts = { bed:0, table:0, decor:0 };
  if (!room || !G || !G.buildings) return counts;
  for (const b of G.buildings) {
    if (!b.done || b.blueprint || !(b.type in counts)) continue;
    if (roomHasTile(room, b.tx, b.ty)) counts[b.type]++;
  }
  return counts;
}
function roomFurnitureScore(counts) {
  return (counts.bed ? 1 : 0) + (counts.table ? 1 : 0) + (counts.decor ? 1 : 0);
}
function roomFloorInfo(room) {
  if (!room || !room.cells || !G || !G.map) return { covered:0, total:0, ratio:0, mat:null };
  let covered=0, wood=0, stone=0;
  for (const key of room.cells) {
    const c = key.split(',');
    const x = +c[0], y = +c[1];
    const f = G.map[y] && G.map[y][x] && G.map[y][x].floor;
    if (f) { covered++; if (f==='stone') stone++; else wood++; }
  }
  const total = room.cells.size;
  return { covered, total, ratio: total ? covered/total : 0, mat: stone>=wood && stone>0 ? 'камень' : (wood>0 ? 'дерево' : null) };
}
function roomIsFloored(room) { return roomFloorInfo(room).ratio >= 0.6; }
function anyFlooredRoom() {
  if (!G || !G.buildings) return false;
  const seen = new Set();
  for (const b of G.buildings) {
    if (!b.done || b.blueprint || !['bed','table','decor'].includes(b.type)) continue;
    const room = enclosedRoomAt(b.tx, b.ty);
    if (!room) continue;
    const k = roomKey(room);
    if (seen.has(k)) continue; seen.add(k);
    if (roomIsFloored(room)) return true;
  }
  return false;
}
function roomFloorBonus() { return anyFlooredRoom() ? 0.04 : 0; }
function roomRoofInfo(room) {
  if (!room || !room.cells) return { covered:0, total:0, ratio:0, label:'нет' };
  return { covered:room.tiles, total:room.tiles, ratio:1, label:'крыша есть' };
}
function pawnShelteredByRoom(p) {
  if (!p) return false;
  const tx = Math.floor(p.x / TILE), ty = Math.floor(p.y / TILE);
  return !!enclosedRoomAt(tx, ty);
}
// Set of "x,y" cells that are under a roof (inside any enclosed room). Cached;
// cheap because each enclosed room is flooded only once via the `checked` memo.
function recomputeRoofedCells() {
  const roofed = new Set();
  if (G && G.buildings) {
    const checked = new Set();
    for (const b of G.buildings) {
      if (!b.done || b.blueprint) continue;
      if (!(['fence','gate'].includes(b.type) || (BUILDS[b.type] && BUILDS[b.type].wall))) continue;
      for (const d of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx = b.tx + d[0], ny = b.ty + d[1];
        const k = nx + ',' + ny;
        if (checked.has(k)) continue;
        checked.add(k);
        const room = enclosedRoomAt(nx, ny);
        if (room && room.cells) for (const c of room.cells) { roofed.add(c); checked.add(c); }
      }
    }
  }
  G._roofedCells = roofed;
  return roofed;
}
function roofedCellCount() { return (G && G._roofedCells) ? G._roofedCells.size : 0; }
function roomWallQuality(room) {
  if (!room) return { label:'нет', score:0, ratio:0 };
  const ratio = room.tiles > 0 ? room.walls / room.tiles : 0;
  if (ratio >= 1.25) return { label:'тесная защита', score:3, ratio };
  if (ratio >= 0.8) return { label:'крепкие стены', score:2, ratio };
  return { label:'широкая комната', score:1, ratio };
}
function roomComfortLabelForScore(score) {
  if (score >= 3) return 'хорошая комната';
  if (score >= 2) return 'жилая комната';
  if (score >= 1) return 'укрытый угол';
  return 'нет';
}
function classifyRoom(counts) {
  if (counts.bed && counts.table) return 'жилая комната';
  if (counts.bed) return 'спальня';
  if (counts.table) return 'столовая';
  if (counts.decor) return 'украшенный угол';
  return 'пустая комната';
}
function roomKey(room) {
  return room && room.cells ? Array.from(room.cells).sort().join(';') : '';
}
function roomTypeEntries() {
  const rooms = new Map();
  if (!G || !G.buildings) return [];
  for (const b of G.buildings) {
    if (!b.done || b.blueprint || !['bed','table','decor'].includes(b.type)) continue;
    const room = enclosedRoomAt(b.tx, b.ty);
    if (!room) continue;
    const key = roomKey(room);
    if (!rooms.has(key)) rooms.set(key, { room, counts:{ bed:0, table:0, decor:0 } });
    rooms.get(key).counts[b.type]++;
  }
  return Array.from(rooms.values()).map(entry => {
    const score = roomFurnitureScore(entry.counts);
    return {
      type: classifyRoom(entry.counts),
      score,
      label: roomComfortLabelForScore(score),
      wall: roomWallQuality(entry.room),
      tiles: entry.room.tiles,
      counts: entry.counts,
      floor: roomFloorInfo(entry.room),
      roof: roomRoofInfo(entry.room)
    };
  });
}
function roomDetailRows() {
  return roomTypeEntries().map((r, idx) => {
    const furniture = [];
    if (r.counts.bed) furniture.push('кровати: ' + r.counts.bed);
    if (r.counts.table) furniture.push('столы: ' + r.counts.table);
    if (r.counts.decor) furniture.push('декор: ' + r.counts.decor);
    const fl = r.floor || { ratio:0, mat:null };
    const floorText = fl.mat ? `${fl.mat} ${Math.round(fl.ratio*100)}%${fl.ratio>=0.6?' ✔':''}` : 'нет';
    const roofText = r.roof && r.roof.ratio >= 1 ? 'есть · дождь не мочит' : 'нет';
    return {
      id: idx + 1,
      title: r.type,
      comfort: `${r.label} (${r.score}/3)`,
      walls: `${r.wall.label} · ${r.wall.ratio.toFixed(2)}`,
      size: `${r.tiles} клеток`,
      floor: floorText,
      roof: roofText,
      furniture: furniture.length ? furniture.join(', ') : 'пусто'
    };
  });
}
function roomTypeSummary() {
  const entries = roomTypeEntries();
  if (!entries.length) return 'нет';
  return entries.map(r => `${r.type} (${r.label}, ${r.wall.label})`).join(', ');
}
function roomTypeLabelAt(tx, ty) {
  const room = enclosedRoomAt(tx, ty);
  if (!room) return 'не закрыта стенами';
  const counts = roomFurnitureCounts(room);
  const score = roomFurnitureScore(counts);
  const wall = roomWallQuality(room);
  const roof = roomRoofInfo(room);
  return `${classifyRoom(counts)} · ${roomComfortLabelForScore(score)} (${score}/3) · ${wall.label} · ${roof.label}`;
}
function roomComfortScore() {
  return (isFurnitureInRoom('bed') ? 1 : 0) + (isFurnitureInRoom('table') ? 1 : 0) + (isFurnitureInRoom('decor') ? 1 : 0);
}
function roomComfortBonus() {
  const score = roomComfortScore();
  let base = 0;
  if (score >= 3) base = 0.12;
  else if (score >= 2) base = 0.06;
  else if (score >= 1) base = 0.03;
  return base + roomFloorBonus();
}
function roomComfortLabel() {
  return roomComfortLabelForScore(roomComfortScore());
}
function doSleep(p) {
  p.state = 'sleeping';
  const beds = G.buildings.filter(b=>b.type==='bed' && b.done)
    .filter(b=> claimCount('sleep_bed_'+b.tx+'_'+b.ty) < BED_CAP)
    .sort((a,b)=>distTiles(p,a.tx,a.ty)-distTiles(p,b.tx,b.ty));
  const bed = beds[0];
  if (bed) {
    claimSpot('sleep_bed_'+bed.tx+'_'+bed.ty);
    setTarget(p, bed.tx, bed.ty);
    return;
  }
  // already resting at a camp this night? keep the slot
  const camps = G.buildings.filter(b=>b.type==='camp' && b.done)
    .filter(b=> claimCount('sleep_'+b.tx+'_'+b.ty) < CAMP_CAP)
    .sort((a,b)=>distTiles(p,a.tx,a.ty)-distTiles(p,b.tx,b.ty));
  const camp = camps[0];
  if (camp) {
    claimSpot('sleep_'+camp.tx+'_'+camp.ty);
    setTarget(p, camp.tx, camp.ty);
  }
  // no free camp → sleep where they stand (stops everyone piling into one tent)
}

function doJoy(p) {
  p.state = 'joy';
  const saloon = nearestBuilding(p, 'saloon');
  if (saloon) setTarget(p, saloon.tx, saloon.ty);
  else wander(p, 2);
  if (G.tick % 90 === p.id % 90) {
    p.mood = Math.min(100, p.mood + 2);
    p.energy = Math.min(100, p.energy + 1);
  }
}

function doWork(p) {
  // Пожар — важнее всего: если что-то горит рядом, ковбои бросаются тушить.
  if (G.fires && G.fires.length && tryFirefight(p)) return;
  // Construction is urgent, BUT only a limited crew builds at once — otherwise
  // a big blueprint project (e.g. a long fence) starves mining/farming/chopping.
  const builderCap = clamp(Math.floor(G.pawns.filter(q=>q.alive).length/3), 1, 4);
  let totalBuilders = 0;
  for (const k in (G._claims||{})) if (k[0]==='b' && k[1]==='p') totalBuilders += G._claims[k];
  const hasFloorBp = !!(G.floorBlueprints && G.floorBlueprints.length);
  if (p.priorities[3] > 0 && totalBuilders < builderCap && (G.buildings.some(b=>b.blueprint && !b.done) || hasFloorBp)) {
    if (tryBuild(p)) return;
  }

  // Find best task by priority
  const sorted = WORK_TYPES.map((w,i)=>({i,w,pri:p.priorities[i]}))
    .filter(x=>x.pri>0).sort((a,b)=>a.pri-b.pri);

  for (const {i,w} of sorted) {
    if (doSpecificWork(p, i)) return;
  }

  p._activeSkill = null; // крафт идёт по легаси-скорости (не наследует навык предыдущей попытки)
  if (tryCraft(p)) return;

  p.state = 'idle';
  wander(p, 4);
}

function doSpecificWork(p, workIdx) {
  // 0:Рубка 1:Фермерство 2:Добыча 3:Строительство 4:Охота 5:Уход 6:Охрана 7:Перевозка
  let did = false;
  p._activeSkill = WORK_SKILL[workIdx] || null;   // навык, который сейчас задействован (для wmul)
  switch(workIdx) {
    case 0: did = tryChopTree(p); break;
    case 1: did = tryFarm(p) || tryFarmZone(p); break;
    case 2: did = tryMine(p); break;
    case 3: did = tryBuild(p) || tryRepair(p); break;
    case 4: did = tryHunt(p); break;
    case 5: did = tryHeal(p); break;
    case 6: did = tryGuard(p); break;
    case 7: did = tryHaul(p); break;
  }
  if (did && WORK_SKILL[workIdx]) gainSkill(p, WORK_SKILL[workIdx], 0.05 * mentorBonus(p, WORK_SKILL[workIdx])); // практика (+наставник) растит навык
  return did;
}

function tryChopTree(p) {
  const marked = findMarkedObj(p, 'tree', MAP_W + MAP_H);
  if (!marked) return false;
  claimSpot('t_'+marked.x+'_'+marked.y);
  setTarget(p, marked.x, marked.y);
  if (distTiles(p, marked.x, marked.y) <= 1.5) {
    workOnObj(p, marked, 'tree', 15, () => {
      const mul = hasResearch('tools') ? 1.5 : 1;
      dropItem('wood', Math.floor((8 + randInt(0,6)) * mul), marked.x, marked.y);
      G.stats.treesChopped++;
      Sfx.chop();
      FX.chips(marked.x*TILE+TILE/2, marked.y*TILE+TILE/2);
      G.map[marked.y][marked.x].obj = null;
      p.state = 'idle';
    });
  }
  p.state = 'working';
  return true;
}

function tryFarm(p) {
  const farm = freeBuildingWithWork(p, 'farm', 25, 2);
  if (!farm) return false;
  claimSpot('b_'+farm.tx+'_'+farm.ty);
  p._wt = 'b_'+farm.tx+'_'+farm.ty;
  setTarget(p, farm.tx, farm.ty);
  if (distTiles(p, farm.tx, farm.ty) <= 1.5) {
    if (!farm.growth) farm.growth = 0;
    farm.growth += 0.005 * wmul(p) * (G.season===3 ? 0.2 : G.season===1 ? 1.4 : 1);
    if (farm.growth >= 1) {
      const mul = hasResearch('tools') ? 1.5 : 1;
      const got = Math.floor((8+randInt(0,5)) * mul);
      G.res.food += got;
      G.stats.foodHarvested += got;
      farm.growth = 0;
    }
    p.state = 'working';
  }
  return true;
}

// Грядка-зона (Phase 2.5): пешка сеет на пустой клетке зоны, жнёт созревшую → еда.
function tryFarmZone(p) {
  const gz = G.zones && G.zones.find(z => z.type === 'grow');
  if (!gz || !gz.cells.length) return false;
  if (!gz.crops) gz.crops = {};
  let ripeT=null, ripeD=Infinity, emptyT=null, emptyD=Infinity;
  for (const key of gz.cells) {
    if (claimCount('crop_'+key) >= 1) continue;
    const c = key.split(','), tx=+c[0], ty=+c[1], d=distTiles(p,tx,ty), g=gz.crops[key];
    if (g >= 1) { if (d < ripeD) { ripeD=d; ripeT={tx,ty,key}; } }
    else if (g === undefined) { if (d < emptyD) { emptyD=d; emptyT={tx,ty,key}; } }
  }
  const target = ripeT || emptyT;
  if (!target) return false;
  claimSpot('crop_'+target.key);
  p._wt = 'crop_'+target.key;
  setTarget(p, target.tx, target.ty);
  if (distTiles(p, target.tx, target.ty) <= 1.2) {
    if (gz.crops[target.key] >= 1) {                       // жатва
      const mul = hasResearch('tools') ? 1.5 : 1;
      const got = Math.floor((5 + randInt(0,4)) * mul);
      G.res.food += got; if (G.stats) G.stats.foodHarvested += got;
      delete gz.crops[target.key];
      if (Sfx && Sfx.coin) Sfx.coin();
    } else if (gz.crops[target.key] === undefined) {      // посев
      gz.crops[target.key] = 0.001;
    }
  }
  p.state = 'working';
  return true;
}
// Рост культур в грядках (зима медленнее, лето быстрее).
function updateCrops() {
  if (!G.zones) return;
  const seasonMul = G.season===3 ? 0.2 : G.season===1 ? 1.4 : 1;
  for (const z of G.zones) {
    if (z.type !== 'grow' || !z.crops) continue;
    for (const key in z.crops) if (z.crops[key] < 1) z.crops[key] = Math.min(1, z.crops[key] + 0.0006 * seasonMul);
  }
}

function tryMine(p) {
  const marked = findMarkedObj(p, 'rock', MAP_W + MAP_H);
  const mine = marked ? null : freeBuildingWithWork(p, 'mine', 25, 2);
  const target = marked || mine;
  if (!target) return false;

  if (marked) {
    claimSpot('t_'+marked.x+'_'+marked.y);
    setTarget(p, marked.x, marked.y);
    if (distTiles(p, marked.x, marked.y) <= 1.5) {
      workOnObj(p, marked, 'rock', 20, () => {
        const mul = hasResearch('tools') ? 1.5 : 1;
        dropItem('ore', Math.floor((5+randInt(0,5)) * mul), marked.x, marked.y);
        Sfx.chop();
        FX.rock(marked.x*TILE+TILE/2, marked.y*TILE+TILE/2);
        G.map[marked.y][marked.x].obj = null;
        p.state = 'idle';
      });
    }
  } else {
    claimSpot('b_'+mine.tx+'_'+mine.ty);
    p._wt = 'b_'+mine.tx+'_'+mine.ty;
    setTarget(p, mine.tx, mine.ty);
    if (distTiles(p, mine.tx, mine.ty) <= 1.5) {
      if (G.tick % 120 === 0) {
        const mul = hasResearch('tools') ? 1.5 : 1;
        G.res.ore += Math.floor(2 * mul);
        G.res.gold += 0.1;
      }
    }
  }
  p.state = 'working';
  return true;
}

// Ремонт: строитель чинит ближайшее повреждённое готовое здание (контра поджигателю/износу).
function tryRepair(p) {
  const dmg = G.buildings
    .filter(b => b.done && !b.blueprint && (b.hp||0) < (b.maxHp||0) && claimCount('rp_'+b.tx+'_'+b.ty) < 2)
    .sort((a,b) => distTiles(p,a.tx,a.ty) - distTiles(p,b.tx,b.ty))[0];
  if (!dmg) return false;
  claimSpot('rp_'+dmg.tx+'_'+dmg.ty);
  p._wt = 'rp_'+dmg.tx+'_'+dmg.ty;
  setTarget(p, dmg.tx, dmg.ty);
  if (distTiles(p, dmg.tx, dmg.ty) <= 2) {
    dmg.hp = Math.min(dmg.maxHp, (dmg.hp||0) + 0.6 * wmul(p));
    if (dmg.hp >= dmg.maxHp) { dmg.hp = dmg.maxHp; addLog(`🔧 ${p.name} починил «${BUILDS[dmg.type]?.name||dmg.type}»`, 'good'); }
  }
  p.state = 'working';
  return true;
}

function tryBuild(p) {
  if (p.carry && p.carry.res === 'buildpack') {
    const bp = findBlueprintByDeliveryKey(p.carry.target);
    if (!bp) { p.carry = null; return false; }
    claimSpot('bp_'+bp.tx+'_'+bp.ty);
    p._wt = 'bp_'+bp.tx+'_'+bp.ty;
    setTarget(p, bp.tx, bp.ty);
    if (distTiles(p, bp.tx, bp.ty) <= 2) {
      deliverBlueprintMaterials(p, bp);
      bp.progress = (bp.progress||0) + 0.008 * wmul(p);
      finishBlueprintIfReady(p, bp);
    }
    p.state = 'working';
    return true;
  }

  // nearest pending blueprint that isn't already full (cap 2 builders)
  const pending = G.buildings.filter(b=>b.blueprint && !b.done)
    .filter(b=>claimCount('bp_'+b.tx+'_'+b.ty) < 2)
    .filter(b=>b.materialsPaid || !b.materialsDeliveryReserved);
  const ready = pending.filter(b=>blueprintMaterialsReady(b));
  if (!ready.length) {
    pending.forEach(updateBlueprintWaiting);
    return tryBuildFloor(p);
  }
  const bp = ready.sort((a,b)=>distTiles(p,a.tx,a.ty)-distTiles(p,b.tx,b.ty))[0];
  if (!bp) return tryBuildFloor(p);
  claimSpot('bp_'+bp.tx+'_'+bp.ty);
  p._wt = 'bp_'+bp.tx+'_'+bp.ty;
  setTarget(p, bp.tx, bp.ty);
  if (!bp.materialsPaid) {
    if (!reserveBlueprintDelivery(p, bp)) return false;
    p.state = 'working';
    return true;
  }
  if (distTiles(p, bp.tx, bp.ty) <= 2) {
    bp.progress = (bp.progress||0) + 0.008 * wmul(p);
    finishBlueprintIfReady(p, bp);
  }
  p.state = 'working';
  return true;
}

function blueprintDeliveryKey(bp) {
  return bp ? `${bp.type}_${bp.tx}_${bp.ty}` : '';
}

function findBlueprintByDeliveryKey(key) {
  return (G.buildings || []).find(b => b.blueprint && !b.done && blueprintDeliveryKey(b) === key) || null;
}

function reserveBlueprintDelivery(p, bp) {
  if (!p || !bp || !bp.blueprint) return false;
  if (bp.materialsPaid) return true;
  if (bp.materialsDeliveryReserved) return false;
  const cost = BUILDS[bp.type]?.cost || {};
  if (updateBlueprintWaiting(bp)) return false;
  consumeResources(cost);
  const total = Object.values(cost).reduce((sum, amount) => sum + (amount || 0), 0);
  bp.materialsDeliveryReserved = true;
  bp.waitingMissing = '';
  bp.deliveryStatus = 'materials_in_transit';
  p.carry = { res:'buildpack', amount:total, target:blueprintDeliveryKey(bp), label:'материалы' };
  addLog(`📦 ${p.name} несёт материалы к «${BUILDS[bp.type].name}»`, '');
  return true;
}

function deliverBlueprintMaterials(p, bp) {
  if (!p || !bp || !p.carry || p.carry.res !== 'buildpack') return false;
  if (p.carry.target !== blueprintDeliveryKey(bp)) return false;
  bp.materialsPaid = true;
  bp.materialsDeliveryReserved = false;
  bp.deliveryStatus = '';
  bp.waitingMissing = '';
  p.carry = null;
  FX.build(bp.tx*TILE+TILE/2, bp.ty*TILE+TILE/2);
  return true;
}

function finishBlueprintIfReady(p, bp) {
  if (!bp || bp.progress < 1) return false;
  bp.blueprint = false;
  bp.done = true;
  bp.waitingMissing = '';
  bp.deliveryStatus = '';
  bp.materialsDeliveryReserved = false;
  bp.hp = getBuildingMaxHp(bp.type);
  bp.maxHp = bp.hp;
  addLog(`🔨 ${p.name} построил ${BUILDS[bp.type].name}`, 'good');
  Diag.action(`Построено: ${BUILDS[bp.type].name} @${bp.tx},${bp.ty}`);
  Sfx.build();
  FX.build(bp.tx*TILE+TILE*BUILDS[bp.type].size/2, bp.ty*TILE+TILE*BUILDS[bp.type].size/2);
  unlock('first_build');
  return true;
}

function missingResources(cost) {
  return Object.entries(cost || {})
    .filter(([, amt]) => amt > 0)
    .map(([res, amt]) => ({ res, need: amt, have: Math.floor(G.res[res] || 0) }))
    .filter(x => x.have < x.need);
}

function missingResourcesText(cost) {
  const miss = missingResources(cost);
  return miss.map(x => `${x.res}: ${x.have}/${x.need}`).join(', ');
}

function updateBlueprintWaiting(bp) {
  if (!bp || !bp.blueprint || bp.materialsPaid) return '';
  if (bp.materialsDeliveryReserved) { bp.waitingMissing = ''; return ''; }
  bp.waitingMissing = missingResourcesText(BUILDS[bp.type]?.cost || {});
  return bp.waitingMissing;
}

function blueprintMaterialsReady(bp) {
  if (!bp || !bp.blueprint) return false;
  if (bp.materialsPaid) { bp.waitingMissing = ''; return true; }
  if (bp.materialsDeliveryReserved) { bp.waitingMissing = ''; return false; }
  const missing = updateBlueprintWaiting(bp);
  return !missing;
}

function ensureBlueprintMaterials(bp) {
  if (!bp || !bp.blueprint) return false;
  if (bp.materialsPaid) return true;
  if (bp.materialsDeliveryReserved) return false;
  const cost = BUILDS[bp.type]?.cost || {};
  if (updateBlueprintWaiting(bp)) return false;
  consumeResources(cost);
  bp.materialsPaid = true;
  bp.waitingMissing = '';
  return true;
}

function tryBuildFloor(p) {
  const fbs = G.floorBlueprints || [];
  if (!fbs.length) return false;
  const fb = fbs.filter(f=>claimCount('fl_'+f.tx+'_'+f.ty) < 2)
    .sort((a,b)=>distTiles(p,a.tx,a.ty)-distTiles(p,b.tx,b.ty))[0];
  if (!fb) return false;
  claimSpot('fl_'+fb.tx+'_'+fb.ty);
  p._wt = 'fl_'+fb.tx+'_'+fb.ty;
  setTarget(p, fb.tx, fb.ty);
  if (distTiles(p, fb.tx, fb.ty) <= 1.5) {
    fb.progress = (fb.progress||0) + 0.012 * wmul(p);
    if (fb.progress >= 1) {
      G.map[fb.ty][fb.tx].floor = fb.mat;
      const i = fbs.indexOf(fb); if (i>=0) fbs.splice(i, 1);
      addLog(`🔨 ${p.name} настелил пол`, 'good');
      Sfx.build();
    }
  }
  p.state = 'working';
  return true;
}

function tryCraft(p) {
  const stations = G.buildings
    .filter(b=>b.done && !b.blueprint && RECIPES[b.type])
    .filter(b=>b.craftEnabled !== false)
    .filter(b=>claimCount('craft_'+b.tx+'_'+b.ty) < 1)
    .sort((a,b)=>distTiles(p,a.tx,a.ty)-distTiles(p,b.tx,b.ty));
  for (const station of stations) {
    const recipe = RECIPES[station.type];
    if (station.craftLimit > 0 && (G.res[recipe.out] || 0) >= station.craftLimit && !station.craft) continue;
    if (!station.craft && !hasResources(recipe.in)) continue;
    claimSpot('craft_'+station.tx+'_'+station.ty);
    p._wt = 'craft_'+station.tx+'_'+station.ty;
    setTarget(p, station.tx, station.ty);
    if (distTiles(p, station.tx, station.ty) <= 1.8) {
      if (!station.craft) {
        consumeResources(recipe.in);
        station.craft = { progress:0 };
      }
      station.craft.progress += wmul(p);
      if (station.craft.progress >= recipe.work) {
        G.res[recipe.out] = (G.res[recipe.out] || 0) + recipe.outAmount;
        if (recipe.out === 'gold') G.stats.goldEarned += recipe.outAmount;
        station.craft = null;
        Sfx.coin();
        FX.spark(station.tx*TILE+TILE, station.ty*TILE+TILE);
      }
    }
    p.state = 'working';
    return true;
  }
  return false;
}

function hasResources(cost) {
  for (const [res, amount] of Object.entries(cost)) {
    if ((G.res[res] || 0) < amount) return false;
  }
  return true;
}

function consumeResources(cost) {
  for (const [res, amount] of Object.entries(cost)) {
    G.res[res] = (G.res[res] || 0) - amount;
  }
}

function recipeStatusLines(b) {
  const recipe = RECIPES[b.type];
  if (!recipe) return [];
  const inputs = Object.entries(recipe.in).map(([res, amount]) => `${amount} ${res}`).join(' + ');
  const lines = [`Рецепт: <b>${inputs}</b> → <b>${recipe.outAmount} ${recipe.out}</b>`];
  if (b.craftEnabled === false) {
    lines.push('Станция: <b>выключена</b>');
    return lines;
  }
  if (b.craftLimit > 0) lines.push(`Лимит: <b>${b.craftLimit} ${recipe.out}</b>`);
  else lines.push('Лимит: <b>без лимита</b>');
  if (b.craftLimit > 0 && (G.res[recipe.out] || 0) >= b.craftLimit && !b.craft) {
    lines.push('Станция: <b>лимит достигнут</b>');
    return lines;
  }
  if (b.craft) {
    const pct = Math.round(clamp((b.craft.progress || 0) / recipe.work, 0, 1) * 100);
    lines.push(`Работает: <b>${pct}%</b>`);
    return lines;
  }
  const missing = Object.entries(recipe.in)
    .filter(([res, amount]) => (G.res[res] || 0) < amount)
    .map(([res, amount]) => `${res}: ${Math.floor(G.res[res] || 0)}/${amount}`);
  if (missing.length) lines.push(`Ждет ресурсы: <b>${missing.join(', ')}</b>`);
  else lines.push('Готово к работе: <b>нужен свободный работник</b>');
  return lines;
}

function tryHunt(p) {
  const animal = G.animals.filter(a=>a.alive && a.marked).sort((a,b)=>dist(p,a)-dist(b,a))[0]
    || G.animals.filter(a=>a.alive).sort((a,b)=>dist(p,a)-dist(b,a))[0];
  if (!animal) return false;
  setTarget(p, Math.floor(animal.x/TILE), Math.floor(animal.y/TILE));
  const d = Math.hypot(p.x-animal.x, p.y-animal.y);
  if (d < TILE*1.5) {
    if (p.attackCooldown <= 0) {
      const dmg = hasResearch('hunting') ? 18 : 12;
      animal.hp -= dmg;
      p.attackCooldown = 60;
      if (animal.hp <= 0) {
        const mul = hasResearch('hunting') ? 1.3 : 1;
        dropItem('meat', Math.floor(animal.meat * mul), Math.floor(animal.x/TILE), Math.floor(animal.y/TILE));
        dropItem('food', Math.floor(animal.meat * 0.5 * mul), Math.floor(animal.x/TILE), Math.floor(animal.y/TILE));
        animal.alive = false;
        G.animals = G.animals.filter(a=>a.alive);
        addLog(`🦌 ${p.name} добыл ${animal.type==='bison'?'бизона':animal.type==='deer'?'оленя':'кролика'}`, 'good');
        p.state='idle';
      }
    }
  }
  p.state = 'working';
  return true;
}

function tryHeal(p) {
  const wounded = G.pawns.find(q=>q.alive && q.hp < q.maxHp*0.9 && q.id!==p.id);
  if (!wounded || G.res.med <= 0) return false;
  setTarget(p, Math.floor(wounded.x/TILE), Math.floor(wounded.y/TILE));
  if (Math.hypot(p.x-wounded.x, p.y-wounded.y) < TILE*2) {
    if (G.tick % 60 === 0 && G.res.med > 0) {
      const rate = hasResearch('medicine') ? 15 : 8;
      wounded.hp = Math.min(wounded.maxHp, wounded.hp + rate);
      G.res.med -= 0.5;
    }
  }
  p.state = 'working';
  return true;
}

function tryGuard(p) {
  // Patrol perimeter
  if (!p.patrolTarget || (distTiles(p, p.patrolTarget.x, p.patrolTarget.y) < 2)) {
    const perimeter = [
      {x:10, y:10}, {x:MAP_W-10, y:10},
      {x:MAP_W-10, y:MAP_H-10}, {x:10, y:MAP_H-10}
    ];
    p.patrolTarget = perimeter[Math.floor(G.tick/300) % 4];
  }
  setTarget(p, p.patrolTarget.x, p.patrolTarget.y);
  p.state = 'working';
  return true;
}

function tryHaul(p) {
  if (p.carry && p.carry.res === 'buildpack') return tryBuild(p);
  if (p.carry) {
    const stock = nearestStockpileForRes(p, p.carry.res);
    if (!stock) {
      depositCarry(p);
      return true;
    }
    claimSpot('haul_stock_'+stock.tx+'_'+stock.ty);
    p._wt = 'haul_stock_'+stock.tx+'_'+stock.ty;
    setTarget(p, stock.tx, stock.ty);
    if (distTiles(p, stock.tx, stock.ty) <= 1.5) depositCarry(p, stock);
    p.state = 'working';
    return true;
  }

  const item = G.items
    .filter(it=>it.amount>0 && claimCount('item_'+it.id) < 1)
    .filter(it=>!!nearestStockpileForRes(p, it.res))
    .sort((a,b)=>distTiles(p,a.tx,a.ty)-distTiles(p,b.tx,b.ty))[0];
  if (!item) return false;
  claimSpot('item_'+item.id);
  p._wt = 'item_'+item.id;
  setTarget(p, item.tx, item.ty);
  if (distTiles(p, item.tx, item.ty) <= 1.2) {
    const take = Math.min(item.amount, 25);
    item.amount -= take;
    p.carry = { res:item.res, amount:take };
    G.items = G.items.filter(it=>it.amount>0);
  }
  p.state = 'working';
  return true;
}

function depositCarry(p, stock=null) {
  if (!p.carry) return;
  if (p.carry.res === 'buildpack') { p.carry = null; p.state = 'idle'; return; }
  const carried = p.carry;
  G.res[p.carry.res] = (G.res[p.carry.res] || 0) + p.carry.amount;
  if (stock) p.lastDepositStock = {tx:stock.tx, ty:stock.ty, res:carried.res, amount:carried.amount};
  p.carry = null;
  p.state = 'idle';
  Sfx.coin();
}

function defaultStockpileFilters() {
  return Object.fromEntries(STORABLE_RES.map(res => [res, true]));
}

function normalizeStockpileFilters(b) {
  if (!b || b.type !== 'stockpile') return null;
  if (!b.filters || typeof b.filters !== 'object') b.filters = defaultStockpileFilters();
  for (const res of STORABLE_RES) {
    if (typeof b.filters[res] !== 'boolean') b.filters[res] = true;
  }
  return b.filters;
}

function normalizeRecipeStation(b) {
  if (!b || !RECIPES[b.type]) return;
  if (typeof b.craftEnabled !== 'boolean') b.craftEnabled = true;
  if (typeof b.craftLimit !== 'number' || isNaN(b.craftLimit) || b.craftLimit < 0) b.craftLimit = 0;
}

function stockpileAllows(b, res) {
  const filters = normalizeStockpileFilters(b);
  return !!filters && filters[res] !== false;
}

function zoneAllows(z, res) { return !!z && (!z.filters || z.filters[res] !== false); }

// Ближайший сток для ресурса: здание-склад ИЛИ клетка склад-зоны (Phase 2.5). Возвращает {tx,ty}.
function nearestStockpileForRes(p, res) {
  let best = null, bestD = Infinity;
  for (const b of G.buildings) {
    if (b.done && !b.blueprint && b.type==='stockpile' && stockpileAllows(b, res)) {
      const d = distTiles(p, b.tx, b.ty); if (d < bestD) { bestD = d; best = { tx:b.tx, ty:b.ty }; }
    }
  }
  const z = G.zones && G.zones.find(z => z.type === 'stockpile');
  if (z && zoneAllows(z, res)) {
    for (const key of z.cells) { const c = key.split(','), tx=+c[0], ty=+c[1], d=distTiles(p,tx,ty); if (d < bestD) { bestD = d; best = { tx, ty }; } }
  }
  return best;
}

function hasStockpileForRes(res) {
  if (G.buildings.some(b=>b.done && !b.blueprint && b.type==='stockpile' && stockpileAllows(b, res))) return true;
  const z = G.zones && G.zones.find(z => z.type === 'stockpile');
  return !!(z && zoneAllows(z, res));
}

function dropItem(res, amount, tx, ty) {
  if (!amount || amount <= 0) return;
  tx = clamp(tx, 0, MAP_W-1);
  ty = clamp(ty, 0, MAP_H-1);
  if (!G.items) G.items = [];
  const existing = G.items.find(it=>it.res===res && it.tx===tx && it.ty===ty);
  if (existing) existing.amount += amount;
  else G.items.push({ id:G.nextId++, res, amount, tx, ty });
}

// Pawns are gunslingers: shoot from range, keep distance
// Шанс попадания и урон ковбоя (чистые функции — тестируемо; «Меткость» усиливает обе).
function pawnHitChance(d, cover, shootLvl=0) {
  let hc = 0.95 - d*0.07 - cover;
  if (hasResearch('marksman')) hc += 0.1;
  hc += (shootLvl || 0) * 0.005;   // навык стрельбы: до +10% точности на 20 ур.
  return clamp(hc, 0.2, 0.98);
}
function pawnShotDamage(shootLvl=0) {
  return (14 + randInt(0,8)) + (hasResearch('marksman') ? 6 : 0) + Math.round((shootLvl || 0) * 0.3);
}
// Наставничество: рост навыка ускоряется, если рядом есть более умелый союзник.
function mentorBonus(p, skillId) {
  if (!p || !skillId || !G.pawns) return 1;
  const myLvl = skillLvl(p, skillId);
  for (const q of G.pawns) {
    if (q === p || !q.alive) continue;
    if (Math.hypot(q.x - p.x, q.y - p.y) <= TILE * 5 && skillLvl(q, skillId) >= myLvl + 2) return 1.6;
  }
  return 1;
}
// Шанс врага попасть по пешке: падает с дистанцией, укрытием и исследованием «Фортификация».
function enemyHitChance(d, cover) {
  let hc = 0.8 - d*0.06 - cover;
  if (hasResearch('fortification')) hc -= 0.1;
  return clamp(hc, 0.12, 0.8);
}

function fightEnemy(p, e) {
  p.state = 'fighting';
  const d = Math.hypot(p.x-e.x, p.y-e.y) / TILE;
  const SHOOT_RANGE = 6.5;

  if (d > SHOOT_RANGE) {
    // close in
    setTarget(p, Math.floor(e.x/TILE), Math.floor(e.y/TILE));
  } else if (d < 2.5) {
    // too close — back off a little (kiting)
    const bx = Math.floor((p.x + (p.x-e.x))/TILE);
    const by = Math.floor((p.y + (p.y-e.y))/TILE);
    setTarget(p, clamp(bx,0,MAP_W-1), clamp(by,0,MAP_H-1));
  } else {
    // hold position and shoot
    setTarget(p, Math.floor(p.x/TILE), Math.floor(p.y/TILE));
  }

  if (d <= SHOOT_RANGE && p.attackCooldown <= 0) {
    p.attackCooldown = hasResearch('tools') ? 45 : 60; // fire rate
    // accuracy falls with distance and target cover
    const cover = getCover(e.x, e.y);
    const sl = skillLvl(p, 'shooting');
    const hitChance = pawnHitChance(d, cover, sl);
    const dmg = pawnShotDamage(sl);
    gainSkill(p, 'shooting', 0.06);   // опыт стрельбы в бою
    fireProjectile(p.x, p.y-4, e, true, rng()<hitChance ? dmg : 0);
  }
}

function fireProjectile(x, y, target, friendly, dmg) {
  Sfx.shot();
  FX.muzzle(x, y);
  G.projectiles.push({
    x, y,
    tx: target.x, ty: target.y,
    target, friendly, dmg,
    life: 30,
    speed: 9,
  });
}

function updateProjectiles() {
  for (const pr of G.projectiles) {
    pr.life--;
    // home toward target's current position a bit
    const aimX = pr.target && pr.target.alive!==false ? pr.target.x : pr.tx;
    const aimY = pr.target && pr.target.alive!==false ? pr.target.y : pr.ty;
    const dx = aimX - pr.x, dy = aimY - pr.y;
    const d = Math.hypot(dx, dy);
    if (d < pr.speed || pr.life<=0) {
      // impact
      if (pr.dmg > 0 && pr.target && pr.target.alive!==false) {
        applyHit(pr.target, pr.dmg, pr.friendly);
        addSplat(pr.target.x, pr.target.y);
      } else if (pr.dmg>0) {
        addSplat(pr.x, pr.y); // miss puff
      }
      pr.life = 0;
    } else {
      pr.x += dx/d * pr.speed;
      pr.y += dy/d * pr.speed;
    }
  }
  G.projectiles = G.projectiles.filter(p=>p.life>0);
}

function applyHit(target, dmg, friendly) {
  target.hp -= dmg;
  if (friendly) {
    // target is enemy
    if (target.hp <= 0 && target.alive) {
      target.alive = false;
      G.stats.kills++;
      const reward = target.type==='boss' ? 30 : target.type==='brute' ? 16 : target.type==='sniper' ? 14 : 6;
      G.res.gold += reward;
      G.stats.goldEarned += reward;
      Sfx.coin();
      if (target.type==='boss') unlock('boss_down');
      addLog(`💀 ${ENEMY_TYPES[target.type]?.name||'Бандит'} убит! +${reward}💰`, 'good');
    }
  } else {
    // target is pawn — random wound
    if (target.hp <= 0) downPawn(target);
    else if (rng()<0.3) {
      target.woundSeverity = Math.min(3, (target.woundSeverity||0)+1);
      addThought(target, '🩸 Ранен пулей', 8, false);
    }
  }
}

// Cover: 0..0.4 hit-chance reduction if target hugs a wall/rock/building
function getCover(wx, wy) {
  const tx = Math.floor(wx/TILE), ty = Math.floor(wy/TILE);
  let cover = 0;
  for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
    const x2=tx+dx, y2=ty+dy;
    if (x2<0||y2<0||x2>=MAP_W||y2>=MAP_H) continue;
    const t = G.map[y2][x2];
    if (t.obj && (t.obj.type==='rock'||t.obj.type==='tree')) cover += 0.12;
    const b = G.buildings.find(b=>b.tx===x2&&b.ty===y2 && !b.blueprint);
    if (b) cover += (BUILDS[b.type] && BUILDS[b.type].cover) ? BUILDS[b.type].cover : 0.15;
  }
  return Math.min(cover, 0.5);
}

// Бочки с порохом: взрываются, когда враг подходит вплотную, и бьют по площади.
const BARREL_TRIGGER = 1.6;   // тайлов — на каком расстоянии враг поджигает бочку
const BARREL_BLAST = 3.2;     // тайлов — радиус взрыва
const BARREL_DMG = 55;        // урон в эпицентре (спадает к краю)
function updateBarrels() {
  if (!G || !G.buildings || !G.enemies) return;
  const barrels = G.buildings.filter(b => b.type === 'barrel' && b.done && !b.blueprint);
  if (!barrels.length) return;
  for (const b of barrels) {
    const bx = b.tx + 0.5, by = b.ty + 0.5;
    const trigger = G.enemies.some(e => e.alive && Math.hypot((e.x/TILE) - bx, (e.y/TILE) - by) <= BARREL_TRIGGER);
    if (!trigger) continue;
    // взрыв: урон всем врагам в радиусе, спад по расстоянию
    for (const e of G.enemies) {
      if (!e.alive) continue;
      const d = Math.hypot((e.x/TILE) - bx, (e.y/TILE) - by);
      if (d <= BARREL_BLAST) {
        const dmg = Math.round(BARREL_DMG * (1 - d / BARREL_BLAST));
        applyHit(e, dmg, true);
      }
    }
    const px = bx * TILE, py = by * TILE;
    if (typeof FX !== 'undefined' && FX.build) FX.spark && FX.spark(px, py);
    spawnParticles(px, py, { count: 22, colors:['#ff9030','#ffd060','#888','#553'], speed: 2.2, life: 26, size: 3 });
    addSplat(px, py);
    if (Sfx && Sfx.alarm) Sfx.alarm();
    addLog(`🛢️ Бочка с порохом взорвалась среди налётчиков!`, 'good');
    b.done = false; b.blueprint = false; b._spent = true;   // бочка израсходована
  }
  // убрать израсходованные бочки
  G.buildings = G.buildings.filter(b => !(b.type === 'barrel' && b._spent));
}

// Поджигатель идёт к ближайшей постройке и поджигает её (урон по HP), ломая оборону.
// Возвращает true, если занят зданием; false — если построек нет (тогда ведёт себя как обычный враг).
function updateArsonist(e) {
  const targets = G.buildings.filter(b => b.done && !b.blueprint);
  if (!targets.length) return false;
  let best = null, bestD = Infinity;
  for (const b of targets) {
    const bx = b.tx + (BUILDS[b.type]?.size||1)/2, by = b.ty + (BUILDS[b.type]?.size||1)/2;
    const dd = Math.hypot((e.x/TILE) - bx, (e.y/TILE) - by);
    if (dd < bestD) { bestD = dd; best = b; }
  }
  if (!best) return false;
  setTarget(e, best.tx, best.ty);
  moveTowardsTarget(e, e.speed);
  if (bestD <= 1.7 && e.attackCooldown <= 0) {
    e.attackCooldown = e.reload;
    best.hp = (best.hp || 0) - 12;
    FX.spark && FX.spark(best.tx*TILE + TILE/2, best.ty*TILE + TILE/2);
    spawnParticles(best.tx*TILE + TILE/2, best.ty*TILE + TILE/2, { count:6, colors:['#ff8030','#ffd060','#553'], speed:1.2, life:20, size:2.4, lift:0.5 });
    if (best.hp <= 0) {
      addLog(`🔥 Поджигатель уничтожил постройку «${BUILDS[best.type]?.name||best.type}»!`, 'danger');
      G.buildings = G.buildings.filter(b => b !== best);
    }
  }
  return true;
}

function updateEnemies() {
  G.enemies = G.enemies.filter(e=>e.alive);
  for (const e of G.enemies) {
    e.attackCooldown = Math.max(0, e.attackCooldown-1);
    // Поджигатель целит в постройки (ломает стены/здания), а не в ковбоев
    if (e.type === 'arsonist' && updateArsonist(e)) continue;
    // Find nearest standing pawn (лежачих без сознания враги не добивают)
    const standing = G.pawns.filter(p=>p.alive && !p.downed);
    const target = (standing.length ? standing : G.pawns.filter(p=>p.alive))
      .sort((a,b)=>dist(e,a)-dist(e,b))[0];
    if (!target) continue;
    const d = Math.hypot(e.x-target.x, e.y-target.y) / TILE;
    const range = e.range || 1.5;

    if (e.ranged) {
      // keep at shooting range
      if (d > range) setTarget(e, Math.floor(target.x/TILE), Math.floor(target.y/TILE));
      else setTarget(e, Math.floor(e.x/TILE), Math.floor(e.y/TILE));
      moveTowardsTarget(e, e.speed);
      if (d <= range && e.attackCooldown <= 0) {
        e.attackCooldown = e.reload;
        const cover = getCover(target.x, target.y);
        const hit = rng() < enemyHitChance(d, cover);
        fireProjectile(e.x, e.y-4, target, false, hit ? e.atk+randInt(0,4) : 0);
      }
    } else {
      // melee charger
      setTarget(e, Math.floor(target.x/TILE), Math.floor(target.y/TILE));
      moveTowardsTarget(e, e.speed);
      if (d < 1.5 && e.attackCooldown <= 0) {
        e.attackCooldown = e.reload;
        applyHit(target, e.atk, false);
        addSplat(target.x, target.y);
      }
    }
  }
}

function updateAnimals() {
  for (const a of G.animals) {
    if (!a.alive) continue;
    a.wanderTimer--;
    if (a.wanderTimer <= 0) {
      a.targetX = clamp(Math.floor(a.x/TILE) + randInt(-6,6), 0, MAP_W-1);
      a.targetY = clamp(Math.floor(a.y/TILE) + randInt(-6,6), 0, MAP_H-1);
      a.wanderTimer = randInt(80,200);
    }
    // Flee from nearby pawns
    const nearPawn = G.pawns.find(p=>p.alive && Math.hypot(p.x-a.x,p.y-a.y)<TILE*5);
    if (nearPawn && !a.marked) {
      const dx = a.x - nearPawn.x, dy = a.y - nearPawn.y;
      const d = Math.hypot(dx,dy);
      a.x += dx/d * a.speed * 1.5;
      a.y += dy/d * a.speed * 1.5;
    } else {
      const tx = a.targetX*TILE+TILE/2, ty = a.targetY*TILE+TILE/2;
      const dx = tx-a.x, dy = ty-a.y;
      const d = Math.hypot(dx,dy);
      const rest = isNight() ? 0.4 : 1;   // ночью животные отдыхают, бродят меньше
      if (d > 2) { a.x += dx/d*a.speed*rest; a.y += dy/d*a.speed*rest; }
    }
    a.x = clamp(a.x, 0, MAP_W*TILE);
    a.y = clamp(a.y, 0, MAP_H*TILE);
  }
  // Respawn
  if (G.tick % 1200 === 0 && G.animals.length < 30) spawnAnimal();
}

// ==================== PATHFINDING (simple A*) ====================
function setTarget(obj, tx, ty) {
  tx = clamp(tx, 0, MAP_W-1);
  ty = clamp(ty, 0, MAP_H-1);
  if (obj.targetX === tx && obj.targetY === ty && obj.path) return;
  obj.targetX = tx;
  obj.targetY = ty;
  obj.path = findPath(Math.floor(obj.x/TILE), Math.floor(obj.y/TILE), tx, ty);
}

function moveTowardsTarget(obj, speed) {
  const next = obj.path && obj.path.length ? obj.path[0] : {x:obj.targetX, y:obj.targetY};
  const tx = next.x * TILE + TILE/2;
  const ty = next.y * TILE + TILE/2;
  const dx = tx - obj.x, dy = ty - obj.y;
  const d = Math.hypot(dx, dy);
  if (d > 2) {
    obj.x += dx/d * speed;
    obj.y += dy/d * speed;
  } else if (obj.path && obj.path.length) {
    obj.path.shift();
  }
}

function isBlockingBuildingAt(tx, ty) {
  return G.buildings.some(b => {
    if (!b.done || b.blueprint || !BUILDS[b.type] || BUILDS[b.type].passable) return false;
    const size = buildingSize(b.type);
    return tx>=b.tx && ty>=b.ty && tx<b.tx+size && ty<b.ty+size && (b.type==='fence' || BUILDS[b.type].wall);
  });
}

function isWalkableTile(tx, ty) {
  if (tx<0 || ty<0 || tx>=MAP_W || ty>=MAP_H) return false;
  const t = G.map[ty][tx];
  if (!t || t.type===TERRAIN.WATER || t.type===TERRAIN.ROCK) return false;
  return !isBlockingBuildingAt(tx, ty);
}

function nearestWalkableTarget(tx, ty, fromX, fromY) {
  if (isWalkableTile(tx, ty)) return {x:tx, y:ty};
  let best = null, bestScore = Infinity;
  for (let r=1; r<=8; r++) {
    for (let dy=-r; dy<=r; dy++) for (let dx=-r; dx<=r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const nx = tx+dx, ny = ty+dy;
      if (!isWalkableTile(nx, ny)) continue;
      const score = Math.hypot(nx-fromX, ny-fromY) + r*0.1;
      if (score < bestScore) { bestScore = score; best = {x:nx, y:ny}; }
    }
    if (best) return best;
  }
  return {x:tx, y:ty};
}

function findPath(sx, sy, tx, ty) {
  sx = clamp(sx, 0, MAP_W-1); sy = clamp(sy, 0, MAP_H-1);
  const target = nearestWalkableTarget(tx, ty, sx, sy);
  tx = target.x; ty = target.y;
  if (sx===tx && sy===ty) return [];
  if (hasClearWalkLine(sx, sy, tx, ty)) return [{x:tx, y:ty}];

  const open = [{x:sx, y:sy, g:0, f:Math.hypot(tx-sx, ty-sy)}];
  const came = {};
  const gScore = {[sx+'_'+sy]:0};
  const closed = {};
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];

  while (open.length) {
    open.sort((a,b)=>a.f-b.f);
    const cur = open.shift();
    const key = cur.x+'_'+cur.y;
    if (closed[key]) continue;
    closed[key] = true;
    if (cur.x===tx && cur.y===ty) {
      const path = [];
      let k = key;
      while (came[k]) {
        const [px, py] = k.split('_').map(Number);
        path.unshift({x:px, y:py});
        k = came[k];
      }
      return path;
    }
    for (const [dx,dy] of dirs) {
      const nx = cur.x+dx, ny = cur.y+dy;
      if (!isWalkableTile(nx, ny)) continue;
      const nk = nx+'_'+ny;
      const ng = cur.g + 1;
      if (ng >= (gScore[nk] ?? Infinity)) continue;
      came[nk] = key;
      gScore[nk] = ng;
      open.push({x:nx, y:ny, g:ng, f:ng+Math.abs(tx-nx)+Math.abs(ty-ny)});
    }
  }
  return [];
}

function hasClearWalkLine(sx, sy, tx, ty) {
  const steps = Math.max(Math.abs(tx-sx), Math.abs(ty-sy));
  if (steps <= 1) return isWalkableTile(tx, ty);
  for (let i=1; i<=steps; i++) {
    const x = Math.round(sx + (tx-sx) * (i/steps));
    const y = Math.round(sy + (ty-sy) * (i/steps));
    if (!isWalkableTile(x, y)) return false;
  }
  return true;
}

function distTiles(obj, tx, ty) {
  const ox = Math.floor(obj.x/TILE), oy = Math.floor(obj.y/TILE);
  return Math.hypot(ox-tx, oy-ty);
}

function dist(a, b) {
  return Math.hypot(a.x-b.x, a.y-b.y);
}

// ==================== HELPERS ====================
function nearestBuilding(p, type) {
  return G.buildings.filter(b=>b.type===type && b.done)
    .sort((a,b)=>dist(p,{x:a.tx*TILE,y:a.ty*TILE})-dist(p,{x:b.tx*TILE,y:b.ty*TILE}))[0] || null;
}

function nearestBuildingWithWork(p, type, range) {
  return G.buildings.filter(b=>b.type===type && b.done)
    .filter(b=>distTiles(p, b.tx, b.ty) <= range)
    .sort((a,b)=>distTiles(p,a.tx,a.ty)-distTiles(p,b.tx,b.ty))[0] || null;
}

// Job reservation: limit how many pawns work one spot, so they spread out
function claimCount(key) { return (G._claims && G._claims[key]) || 0; }
function claimSpot(key) { if (!G._claims) G._claims={}; G._claims[key] = (G._claims[key]||0)+1; }
// nearest workplace of `type` whose worker count is below cap
function freeBuildingWithWork(p, type, range, cap) {
  const list = G.buildings.filter(b=>b.type===type && b.done && distTiles(p,b.tx,b.ty)<=range)
    .filter(b=> claimCount('b_'+b.tx+'_'+b.ty) < cap)
    .sort((a,b)=>distTiles(p,a.tx,a.ty)-distTiles(p,b.tx,b.ty));
  return list[0] || null;
}

function nearestEnemy(p, range) {
  return G.enemies.filter(e=>e.alive)
    .filter(e=>Math.hypot(e.x-p.x,e.y-p.y)<range*TILE)
    .sort((a,b)=>dist(p,a)-dist(p,b))[0] || null;
}

function findMarkedObj(p, type, range) {
  let best = null, bestD = 999;
  if (range >= Math.max(MAP_W, MAP_H)) {
    for (let ty=0; ty<MAP_H; ty++) {
      for (let tx=0; tx<MAP_W; tx++) {
        const t = G.map[ty][tx];
        if (t.obj && t.obj.type===type && t.obj.marked) {
          if (claimCount('t_'+tx+'_'+ty) >= 1) continue;
          const d = distTiles(p, tx, ty);
          if (d<bestD) { bestD=d; best={x:tx,y:ty,obj:t.obj}; }
        }
      }
    }
    return best;
  }
  for (let dy=-range; dy<=range; dy++) {
    for (let dx=-range; dx<=range; dx++) {
      const tx = Math.floor(p.x/TILE)+dx, ty = Math.floor(p.y/TILE)+dy;
      if (tx<0||ty<0||tx>=MAP_W||ty>=MAP_H) continue;
      const t = G.map[ty][tx];
      if (t.obj && t.obj.type===type && t.obj.marked) {
        if (claimCount('t_'+tx+'_'+ty) >= 1) continue; // already taken by another pawn
        const d = Math.hypot(dx,dy);
        if (d<bestD) { bestD=d; best={x:tx,y:ty,obj:t.obj}; }
      }
    }
  }
  return best;
}

let workTimers = {};
function workOnObj(p, target, type, duration, onDone) {
  const key = `${target.x}_${target.y}`;
  if (!workTimers[key]) workTimers[key] = 0;
  workTimers[key] += wmul(p);
  if (workTimers[key] >= duration * 3) {
    workTimers[key] = 0;
    onDone();
  }
}

function wander(p, range) {
  if (G.tick % 120 === p.id % 120) {
    let tx = clamp(Math.floor(p.x/TILE)+randInt(-range,range), 0, MAP_W-1);
    let ty = clamp(Math.floor(p.y/TILE)+randInt(-range,range), 0, MAP_H-1);
    if (!isAllowedTile(tx, ty)) {                 // держимся в разрешённой зоне
      const z = G.zones.find(z => z.type === 'allowed');
      if (z && z.cells.length) { const c = z.cells[rngInt(0, z.cells.length-1)].split(','); tx=+c[0]; ty=+c[1]; }
    }
    if (G.map[ty][tx].type !== TERRAIN.WATER) setTarget(p, tx, ty);
  }
}

// Падение в «без сознания» (downed) вместо мгновенной смерти.
// Повторный смертельный урон по уже лежащему — добивает. Иначе пешка истекает кровью
// (downedTimer), но её может стабилизировать другой ковбой медикаментами.
// Лежачая пешка: истекает кровью; стабилизируется, если другой ковбой лечит её медикаментами.
function updateDowned(p) {
  p.downedTimer = (p.downedTimer || 0) - 1;
  // спасение: если HP подняли (медиком через tryHeal) выше порога — приходит в себя
  if (p.hp >= 25) {
    p.downed = false;
    p.state = 'idle';
    p.downedTimer = 0;
    addLog(`💚 ${p.name} пришёл в себя.`, 'good');
    return;
  }
  // без помощи — истекает кровью и гибнет
  if (p.downedTimer <= 0) { killPawn(p); return; }
  if (G.tick % 240 === 0) addSplat(p.x, p.y);
}

function downPawn(p) {
  if (!p.alive) return;
  if (p.downed) { killPawn(p); return; }   // добили лежачего
  p.downed = true;
  p.hp = Math.max(1, Math.min(p.hp, 1));
  p.downedTimer = 1500;                     // ~истекает кровью за это время без помощи
  p.state = 'downed';
  p.manualTarget = null;
  addLog(`🩸 ${p.name} потерял сознание! Нужна помощь.`, 'danger');
  addSplat(p.x, p.y);
}

function killPawn(p) {
  if (!p.alive) return;
  p.alive = false;
  p.dead = true;
  p.downed = false;
  addLog(`💀 ${p.name} погиб!`, 'danger');
  addSplat(p.x, p.y);
  const alivePawns = G.pawns.filter(q=>q.alive);
  if (alivePawns.length === 0) { gameOver('lose'); }
}

function addSplat(x, y) {
  G.bloodSplats.push({x, y, opacity:1, size:4+rng()*4});
}

// ---- Particle system (visual juice) ----
function spawnParticles(x, y, opts={}) {
  if (!G.particles) G.particles = [];
  const n = opts.count || 6;
  const colors = opts.colors || ['#cab184'];
  for (let i=0; i<n; i++) {
    const a = rng()*Math.PI*2;
    const sp = (opts.speed||0.6) * (0.4+rng()*0.8);
    G.particles.push({
      x, y,
      vx: Math.cos(a)*sp + (opts.vx||0),
      vy: Math.sin(a)*sp + (opts.vy||0) - (opts.lift||0.3),
      life: (opts.life||30) * (0.6+rng()*0.6),
      maxLife: opts.life||30,
      size: (opts.size||2.5) * (0.6+rng()*0.8),
      color: colors[(rng()*colors.length)|0],
      grav: opts.grav!==undefined ? opts.grav : 0.03,
      fade: opts.fade!==false,
    });
  }
  if (G.particles.length > 600) G.particles.splice(0, G.particles.length-600);
}
// presets
const FX = {
  dust:  (x,y)=>spawnParticles(x,y,{count:6, colors:['#c2a878','#a98c5e','#d8c39a'], speed:0.5, life:26, size:2.6}),
  chips: (x,y)=>spawnParticles(x,y,{count:7, colors:['#6a4a28','#8a6536','#9a7a44'], speed:0.8, life:28, size:2.2}),
  rock:  (x,y)=>spawnParticles(x,y,{count:7, colors:['#888','#9a948c','#6a655e'], speed:0.7, life:26, size:2.2}),
  build: (x,y)=>spawnParticles(x,y,{count:8, colors:['#d8c39a','#b89a5a','#e8c97e'], speed:0.7, life:32, size:2.4, lift:0.5}),
  muzzle:(x,y)=>spawnParticles(x,y,{count:5, colors:['#ffd070','#ffae40','#fff0c0'], speed:1.4, life:10, size:2.6, grav:0, lift:0}),
  spark: (x,y)=>spawnParticles(x,y,{count:3, colors:['#ff9030','#ffd060'], speed:0.9, life:16, size:1.8, grav:0.01}),
};

function updateParticles() {
  if (!G.particles) return;
  for (const p of G.particles) {
    p.x += p.vx; p.y += p.vy;
    p.vy += p.grav;
    p.vx *= 0.96; p.vy *= 0.98;
    p.life--;
  }
  G.particles = G.particles.filter(p=>p.life>0);
}

function getBuildingMaxHp(type) {
  const base = hasResearch('walls') ? 300 : 200;
  if (type === 'wall') return base + 80;
  if (type === 'wall_stone') return base * 2;
  return base;
}

function hasResearch(id) {
  return G.researches.find(r=>r.id===id)?.done || false;
}

function addLog(msg, type='') {
  const entry = { msg, type, time:`День ${G.day} ${String(G.hour).padStart(2,'0')}:${String(G.minute).padStart(2,'0')}` };
  G.log.unshift(entry);
  if (G.log.length > 100) G.log.pop();
  renderLog();
}

function normalizeGameState(source='') {
  if (!G) return;
  if (!G.res) G.res = {};
  for (const [k,v] of Object.entries(DEFAULT_RES)) {
    if (typeof G.res[k] !== 'number' || isNaN(G.res[k]) || G.res[k] < 0) G.res[k] = v;
  }
  ensureScenarioStats();
  ensureHerd();
  if (!Array.isArray(G.items)) G.items = [];
  if (!Array.isArray(G.floorBlueprints)) G.floorBlueprints = [];
  if (!Array.isArray(G.fires)) G.fires = [];
  if (!Array.isArray(G.zones)) G.zones = [];
  for (const p of G.pawns || []) {
    if (!p.skills || typeof p.skills !== 'object') p.skills = {};
    if (!p.personality || typeof p.personality !== 'object') p.personality = rollPersonality(p.traits);
  }
  for (const b of G.buildings || []) {
    normalizeStockpileFilters(b);
    normalizeRecipeStation(b);
  }
  if (!Array.isArray(G.runtimeErrors)) G.runtimeErrors = [];
  if (!G.camera || !isFinite(G.camera.x) || !isFinite(G.camera.y) || !isFinite(G.camera.zoom)) {
    G.camera = { x: MAP_W*TILE/2 - 400, y: MAP_H*TILE/2 - 300, zoom: 1.0 };
    if (source) safeDiagRuntime('camera_reset_'+source, 'Camera was invalid and got reset');
  }
  G.camera.zoom = clamp(G.camera.zoom || 1, 0.4, 2.8);
  if (!G.map || !G.map.length || !G.map[0] || G.map.length !== MAP_H || G.map[0].length !== MAP_W) {
    G.map = generateMap();
    _miniDirty = true;
    safeDiagRuntime('map_reset_'+source, 'Map was invalid and got regenerated');
  }
  if (!Array.isArray(G.pois) || G.pois.length === 0) G.pois = generatePOIs(G.map);
  G.pois = (G.pois || []).filter(p => p && POI_DEFS[p.type] && p.tx>=0 && p.ty>=0 && p.tx<MAP_W && p.ty<MAP_H)
    .map(p => ({
      id:p.id || `poi_${p.type}_${p.tx}_${p.ty}`,
      type:p.type, tx:p.tx, ty:p.ty,
      discovered:!!p.discovered,
      searched:!!p.searched,
      exploredDay:p.exploredDay || 0,
    }));
}

function safeDiagRuntime(key, msg, stack='') {
  try {
    if (G) {
      if (!Array.isArray(G.runtimeErrors)) G.runtimeErrors = [];
      G.runtimeErrors.push({tick:G.tick||0, msg, stack:String(stack||'').slice(0,1200)});
      if (G.runtimeErrors.length > 100) G.runtimeErrors.shift();
    }
    if (typeof Diag !== 'undefined' && Diag && typeof Diag.anomaly === 'function' && G) {
      Diag.anomaly('runtime_'+key, msg);
    }
  } catch(e) {
    try { console.error('[FRONTIER LOGGER FAILED]', e); } catch(_) {}
  }
}

function gameOver(type) {
  G.gameOver = true;
  const overlay = document.getElementById('end-overlay');
  overlay.style.display = 'flex';
  if (type==='win') {
    if (G.achievements) unlock('win');
    Sfx.win();
    document.getElementById('end-title').textContent = '🏆 Победа!';
    document.getElementById('end-msg').textContent = `Ты построил империю за ${G.day} дней! Убито бандитов: ${G.stats.kills}`;
  } else {
    Sfx.lose();
    document.getElementById('end-title').textContent = '💀 Поражение';
    document.getElementById('end-msg').textContent = 'Все ковбои погибли. Дикий Запад победил.';
  }
}

// ==================== TIME & EVENTS ====================
function updateTime() {
  G.minute += MINUTES_PER_TICK * G.speed;
  if (G.minute >= 60) {
    G.minute = 0;
    G.hour++;
    if (G.hour >= 24) {
      G.hour = 0;
      G.day++;
      G.dayOfYear = (G.dayOfYear + 1) % 365;
      G.season = Math.floor(G.dayOfYear / 91);
      G.stats.days++;
      onNewDay();
    }
  }
}

function onNewDay() {
  decaySkills();   // навыки без практики медленно угасают
  // Science from labs
  const labs = G.buildings.filter(b=>b.type==='lab'&&b.done).length;
  G.res.sci += labs * 5;

  const ranchYield = ranchDailyYield();
  if (ranchYield.food || ranchYield.gold) {
    G.res.food += ranchYield.food;
    G.res.gold += ranchYield.gold;
    G.stats.goldEarned += ranchYield.gold;
    addLog(`🤠 Ранчо дало ${ranchYield.food} еды и ${ranchYield.gold} золота`, 'good');
  }
  processHorseTaming();

  // Research progress
  if (G.activeResearch) {
    const r = G.researches.find(r=>r.id===G.activeResearch);
    if (r && !r.done && G.res.sci >= r.cost) {
      G.res.sci -= r.cost;
      r.done = true;
      addLog(`🔬 Исследование завершено: ${r.name}`, 'good');
      G.activeResearch = null;
      renderResearch();
    }
  }

  // Season change
  if (G.dayOfYear % 91 === 0) {
    addLog(`🍂 Наступил ${SEASONS[G.season]}`, '');
  }

  checkAchievements();
  triggerScenarioDayEvent();

  // Win condition
  if (isScenarioGoalMet()) { gameOver('win'); }
}

function triggerEvent(peaceful) {
  const events = [
    { name:'Торговец', fn: () => { G.res.food+=30; G.res.med+=5; addLog('🤠 Торговец привёз еду и медикаменты!', 'good'); } },
    { name:'Караван', fn: () => runCaravanTrade() },
    { name:'Засуха', fn: () => { G.buildings.filter(b=>b.type==='farm').forEach(f=>f.growth=0); addLog('☀️ Засуха! Все фермы сгорели.', 'warn'); } },
    { name:'Налёт бандитов', fn: () => { const n=2+randInt(0,3)+Math.floor(G.day/6); spawnEnemy(n); Sfx.alarm(); addLog(`🔫 Налёт! ${n} бандитов атакуют!`, 'danger'); } },
    { name:'Золотая жила', fn: () => { G.res.gold+=30; addLog('💰 Нашли золотую жилу! +30 золота', 'good'); } },
    { name:'Охота', fn: () => { for(let i=0;i<5;i++) spawnAnimal(); addLog('🦌 Стадо животных прошло мимо!', 'good'); } },
    { name:'Знахарь', fn: () => { G.res.med+=15; addLog('💊 Знахарь оставил медикаменты!', 'good'); } },
    { name:'Буря', fn: () => { G.weather='storm'; G.weatherTimer=300; addLog('⛈️ Надвигается гроза!', 'warn'); } },
    { name:'Эпидемия', fn: () => { G.pawns.filter(p=>p.alive).forEach(p=>p.hp=Math.max(10,p.hp-20)); addLog('🤒 Эпидемия! Все ковбои заболели.', 'danger'); } },
    { name:'Наёмник', fn: () => {
      const names=['Дэн','Ро','Сью','Карл','Пит'];
      const nm=names[randInt(0,names.length-1)];
      const cx=Math.floor(MAP_W/2), cy=Math.floor(MAP_H/2);
      spawnPawn(cx+randInt(-3,3), cy+randInt(-3,3), nm, [2,2,2,2,2,2,2,2]);
      addLog(`🤠 Наёмник ${nm} присоединился к отряду!`, 'good');
    }},
    { name:'Пожар', fn: () => {
      const trees = [];
      for(let y=0;y<MAP_H;y++) for(let x=0;x<MAP_W;x++) if(G.map[y][x].obj?.type==='tree') trees.push({x,y});
      const burned=trees.slice(0,randInt(3,8));
      burned.forEach(t=>G.map[t.y][t.x].obj=null);
      addLog(`🔥 Лесной пожар! Сгорело ${burned.length} деревьев.`, 'warn');
    }},
  ];
  let pool = events;
  if (peaceful) pool = events.filter(e=>!['Налёт бандитов','Эпидемия'].includes(e.name));
  const ev = pool[randInt(0, pool.length-1)];
  ev.fn();
}

function pickCaravanProfile() {
  if (G?.scenario === 'caravan') {
    const keys = ['mixed', 'food', 'medicine', 'materials'];
    return keys[randInt(0, keys.length-1)];
  }
  return 'mixed';
}

function caravanOutputText(outputs) {
  return Object.entries(outputs)
    .filter(([, amount]) => amount > 0)
    .map(([res, amount]) => `+${amount} ${res}`)
    .join(', ');
}

function runCaravanTrade(profileId=null) {
  const post = G.buildings.find(b=>b.done && !b.blueprint && b.type==='tradepost');
  if (!post) {
    G.res.food += 20;
    addLog('🐎 Малый караван оставил немного провианта. Построй торг. пост для сделок.', 'good');
    return { traded:false, reason:'no_tradepost', food:20 };
  }
  const selectedProfile = CARAVAN_PROFILES[profileId] ? profileId : pickCaravanProfile();
  const profile = CARAVAN_PROFILES[selectedProfile] || CARAVAN_PROFILES.mixed;
  if ((G.res.gold || 0) < profile.cost) {
    addLog('🐎 Караван пришёл, но золота для сделки не хватило.', 'warn');
    return { traded:false, reason:'no_gold', profile:selectedProfile, cost:profile.cost };
  }
  // Бонус торговли + бонус сценария «Караванный путь» (маршрут даёт +20% к сделкам)
  const routeBonus = (G.scenario === 'caravan') ? 1.2 : 1;
  const bonus = (hasResearch('trading') ? 1.35 : 1) * routeBonus;
  G.res.gold -= profile.cost;
  const outputs = {};
  for (const [res, amount] of Object.entries(profile.out)) {
    const finalAmount = Math.floor(amount * bonus);
    outputs[res] = finalAmount;
    G.res[res] = (G.res[res] || 0) + finalAmount;
  }
  ensureScenarioStats();
  G.stats.caravanDeals++;
  G._lastCaravan = `${profile.name}: −${profile.cost}💰 → ${caravanOutputText(outputs)}`;
  addLog(`🐎 ${profile.name}: -${profile.cost} золота, ${caravanOutputText(outputs)}`, 'good');
  Diag.action(`${profile.name} @${post.tx},${post.ty}`);
  return { traded:true, profile:selectedProfile, spentGold:profile.cost, outputs, ...outputs };
}

function updateWeather() {
  G.weatherTimer = Math.max(0, G.weatherTimer - 1);
  if (G.weatherTimer <= 0) {
    if (rng() < 0.002) {
      const weathers = G.season===3 ? ['clear','snow','blizzard'] : ['clear','rain','storm','sandstorm'];
      G.weather = weathers[randInt(0, weathers.length-1)];
      G.weatherTimer = 200 + randInt(0,400);
      if (G.weather==='storm') addLog('⛈️ Началась гроза!', 'warn');
      else if (G.weather==='blizzard') addLog('🌨️ Метель!', 'warn');
      else if (G.weather==='sandstorm') addLog('🌪️ Песчаная буря!', 'warn');
    } else {
      G.weather = 'clear';
    }
  }
}

// ==================== RENDERING ====================
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let hoverTile = null;

function resizeCanvas() {
  const wrap = document.getElementById('canvas-wrap');
  canvas.width = wrap.clientWidth;
  canvas.height = wrap.clientHeight;
  updateBottomUiMetrics();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function render() {
  if (!G) return;
  const cam = G.camera;
  const z = cam.zoom;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(-cam.x*z, -cam.y*z);
  ctx.scale(z, z);

  const startX = Math.max(0, Math.floor(cam.x/TILE)-1);
  const startY = Math.max(0, Math.floor(cam.y/TILE)-1);
  const endX = Math.min(MAP_W, Math.ceil((cam.x+canvas.width/z)/TILE)+1);
  const endY = Math.min(MAP_H, Math.ceil((cam.y+canvas.height/z)/TILE)+1);

  // Draw tiles
  const floorBpSet = new Set((G.floorBlueprints||[]).map(f=>f.tx+','+f.ty));
  if (!G._roofedCells || (((G.tick||0) - (G._roofTick||-999)) >= 20)) { recomputeRoofedCells(); G._roofTick = G.tick||0; }
  const roofedCells = G._roofedCells;
  const zoneMap = new Map();
  const cropMap = new Map();
  for (const z of (G.zones||[])) { for (const k of z.cells) zoneMap.set(k, z.type); if (z.crops) for (const k in z.crops) cropMap.set(k, z.crops[k]); }
  for (let y=startY; y<endY; y++) {
    for (let x=startX; x<endX; x++) {
      const tile = G.map[y][x];
      // checker-ish subtle variation for texture
      const useShade = (((x*7+y*13) % 5) < 2);
      let col = useShade ? TCOLORS2[tile.type] : TCOLORS[tile.type];
      // Season tint
      if (G.season===3 && tile.type!==TERRAIN.WATER) col = blendColor(col, '#c4d2e4', 0.4);
      else if (G.season===2 && tile.type===TERRAIN.GRASS) col = blendColor(col, '#b09030', 0.35);
      ctx.fillStyle = col;
      ctx.fillRect(x*TILE, y*TILE, TILE+1, TILE+1);

      // Water shimmer
      if (tile.type===TERRAIN.WATER && (x+y+Math.floor(G.tick/30))%6===0) {
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(x*TILE+4, y*TILE+TILE*0.4, TILE-8, 2);
      }
      // Shoreline foam: light rim on water edges touching land
      if (tile.type===TERRAIN.WATER) {
        ctx.fillStyle = 'rgba(210,235,250,0.35)';
        if (y>0 && G.map[y-1][x].type!==TERRAIN.WATER) ctx.fillRect(x*TILE, y*TILE, TILE, 2);
        if (y<MAP_H-1 && G.map[y+1][x].type!==TERRAIN.WATER) ctx.fillRect(x*TILE, y*TILE+TILE-2, TILE, 2);
        if (x>0 && G.map[y][x-1].type!==TERRAIN.WATER) ctx.fillRect(x*TILE, y*TILE, 2, TILE);
        if (x<MAP_W-1 && G.map[y][x+1].type!==TERRAIN.WATER) ctx.fillRect(x*TILE+TILE-2, y*TILE, 2, TILE);
      }
      // Grass blades hint
      if (tile.type===TERRAIN.GRASS && G.season!==3 && ((x*3+y*5)%4===0)) {
        ctx.fillStyle = 'rgba(40,70,20,0.25)';
        ctx.fillRect(x*TILE+TILE*0.3, y*TILE+TILE*0.3, 2, 4);
        ctx.fillRect(x*TILE+TILE*0.6, y*TILE+TILE*0.5, 2, 3);
      }

      // Floors (constructed) and floor blueprints
      if (tile.floor) drawFloorTile(x, y, tile.floor);
      if (floorBpSet.has(x+','+y)) {
        const px = x*TILE, py = y*TILE;
        ctx.fillStyle = 'rgba(90,150,220,0.20)'; ctx.fillRect(px, py, TILE, TILE);
        ctx.strokeStyle = 'rgba(150,195,255,0.7)'; ctx.setLineDash([3,2]);
        ctx.strokeRect(px+1.5, py+1.5, TILE-3, TILE-3); ctx.setLineDash([]);
      }

      // Roof shade: subtle darkening over sheltered (enclosed-room) tiles
      if (roofedCells && roofedCells.has(x+','+y)) {
        ctx.fillStyle = 'rgba(18,16,28,0.20)';
        ctx.fillRect(x*TILE, y*TILE, TILE+1, TILE+1);
      }

      // Zone overlay (grow / stockpile / ...)
      const _zt = zoneMap.get(x+','+y);
      if (_zt && ZONE_DEFS[_zt]) {
        ctx.fillStyle = ZONE_DEFS[_zt].fill; ctx.fillRect(x*TILE, y*TILE, TILE, TILE);
        ctx.strokeStyle = ZONE_DEFS[_zt].border; ctx.strokeRect(x*TILE+0.5, y*TILE+0.5, TILE-1, TILE-1);
        const _cg = cropMap.get(x+','+y);
        if (_cg != null) {
          const cx0 = x*TILE+TILE/2, ripe = _cg >= 1;
          ctx.fillStyle = ripe ? '#e8c040' : '#5aa83a';
          const h = 3 + Math.min(_cg,1) * (TILE*0.5);
          ctx.fillRect(cx0-1, y*TILE+TILE-3-h, 2, h);
          if (ripe) { ctx.beginPath(); ctx.arc(cx0, y*TILE+TILE-3-h, 2.5, 0, Math.PI*2); ctx.fill(); }
        }
      }

      // Objects
      if (tile.obj) drawTileObj(x, y, tile.obj);
    }
  }

  // Ground item stacks
  for (const item of G.items || []) drawItemStack(item);

  // Frontier points of interest
  for (const poi of G.pois || []) drawPOI(poi);

  // Hover highlight / build preview
  if (hoverTile && !isDragging) {
    const {tx, ty} = hoverTile;
    if (tx>=0 && ty>=0 && tx<MAP_W && ty<MAP_H) {
      if (G.buildMode) {
        const def = BUILDS[G.buildMode];
        const sz = def.size;
        let ok = true;
        for (let dy=0; dy<sz; dy++) for (let dx=0; dx<sz; dx++) {
          const x2=tx+dx, y2=ty+dy;
          if (x2>=MAP_W||y2>=MAP_H||G.map[y2][x2].type===TERRAIN.WATER||G.buildings.find(b=>b.tx===x2&&b.ty===y2)) ok=false;
        }
        ctx.fillStyle = ok ? 'rgba(120,200,120,0.30)' : 'rgba(200,80,80,0.35)';
        ctx.fillRect(tx*TILE, ty*TILE, TILE*sz, TILE*sz);
        ctx.strokeStyle = ok ? '#9cff9c' : '#ff8080';
        ctx.lineWidth = 2;
        ctx.strokeRect(tx*TILE, ty*TILE, TILE*sz, TILE*sz);
        ctx.font = `${TILE*sz*0.5}px serif`;
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.globalAlpha = 0.6;
        ctx.fillText(def.icon, tx*TILE+TILE*sz/2, ty*TILE+TILE*sz/2);
        ctx.globalAlpha = 1;
      } else if (G.demolishMode) {
        ctx.fillStyle = 'rgba(200,60,60,0.3)';
        ctx.fillRect(tx*TILE, ty*TILE, TILE, TILE);
      } else {
        ctx.strokeStyle = 'rgba(232,201,126,0.5)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(tx*TILE+1, ty*TILE+1, TILE-2, TILE-2);
      }
      ctx.lineWidth = 1;
    }
  }

  // Blood splats
  for (const s of G.bloodSplats) {
    ctx.fillStyle = `rgba(160,30,30,${s.opacity})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI*2);
    ctx.fill();
  }

  // Buildings
  for (const b of G.buildings) {
    drawBuilding(b);
  }

  // Animals
  for (const a of G.animals) {
    if (!a.alive) continue;
    drawAnimal(a);
  }

  // Enemies
  for (const e of G.enemies) {
    if (!e.alive) continue;
    drawEnemy(e);
  }

  // Pawns
  for (const p of G.pawns) {
    drawPawn(p);
  }

  // Projectiles (bullets)
  for (const pr of G.projectiles) {
    ctx.strokeStyle = pr.friendly ? 'rgba(255,230,150,0.9)' : 'rgba(255,160,120,0.9)';
    ctx.lineWidth = 2;
    const aimX = pr.target ? pr.target.x : pr.tx, aimY = pr.target ? pr.target.y : pr.ty;
    const d = Math.hypot(aimX-pr.x, aimY-pr.y) || 1;
    ctx.beginPath();
    ctx.moveTo(pr.x, pr.y);
    ctx.lineTo(pr.x - (aimX-pr.x)/d*6, pr.y - (aimY-pr.y)/d*6);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  // Particles (world space)
  if (G.particles) {
    for (const pt of G.particles) {
      ctx.globalAlpha = pt.fade ? clamp(pt.life/pt.maxLife, 0, 1) : 1;
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x - pt.size/2, pt.y - pt.size/2, pt.size, pt.size);
    }
    ctx.globalAlpha = 1;
  }

  ctx.restore();

  drawFires();

  // Screen-space overlays
  drawWeather();
  drawDayNightOverlay();
  drawMinimap();
}

// ──────────────── СИСТЕМА ОГНЯ (Phase 1) ────────────────
// Горючесть тайла: дерево/деревянный пол/трава/деревянные постройки горят; камень/вода/земля — нет.
function tileFuel(tx, ty) {
  if (!G || !G.map || !G.map[ty] || !G.map[ty][tx]) return 0;
  const t = G.map[ty][tx];
  if (t.type === TERRAIN.WATER || t.type === TERRAIN.ROCK) return 0;
  let fuel = 0;
  if (t.obj && t.obj.type === 'tree') fuel = Math.max(fuel, 60);
  if (t.floor === 'wood') fuel = Math.max(fuel, 40);
  if (t.type === TERRAIN.GRASS) fuel = Math.max(fuel, 20);
  const b = G.buildings.find(b => b.tx===tx && b.ty===ty && b.done && !b.blueprint);
  if (b && BUILDS[b.type] && BUILDS[b.type].cost && BUILDS[b.type].cost.wood && b.type!=='wall_stone') fuel = Math.max(fuel, 80);
  return fuel;
}
function isBurningAt(tx, ty) { return !!(G.fires && G.fires.some(f => f.tx===tx && f.ty===ty)); }
function igniteTile(tx, ty) {
  if (!G.fires) G.fires = [];
  if (tx<0||ty<0||tx>=MAP_W||ty>=MAP_H) return false;
  if (isBurningAt(tx, ty)) return false;
  const fuel = tileFuel(tx, ty);
  if (fuel <= 0) return false;
  G.fires.push({ tx, ty, hp: fuel });
  return true;
}
function maybeLightning() {
  if (G.weather === 'storm' && rng() < 0.0004) {
    const tx = rngInt(0, MAP_W-1), ty = rngInt(0, MAP_H-1);
    if (igniteTile(tx, ty)) addLog('⚡ Молния вызвала пожар!', 'warn');
  }
}
function updateFires() {
  if (!G.fires) G.fires = [];
  const rainy = G.weather==='rain' || G.weather==='storm' || G.weather==='blizzard';
  if (G.fires.length) {
    const burn = rainy ? 2.4 : 0.7;   // дождь гасит быстрее
    for (const f of G.fires) {
      f.hp -= burn;
      const t = G.map[f.ty] && G.map[f.ty][f.tx];
      if (t) {
        const b = G.buildings.find(b => b.tx===f.tx && b.ty===f.ty && b.done && !b.blueprint);
        if (b) { b.hp -= 0.8; if (b.hp <= 0) { G.buildings = G.buildings.filter(x=>x!==b); addLog(`🔥 ${BUILDS[b.type].name} сгорела`, 'danger'); } }
        if (t.obj && t.obj.type === 'tree') { t.obj.hp -= 1.2; if (t.obj.hp <= 0) t.obj = null; }
      }
      if (!rainy && rng() < 0.05) {  // распространение на соседний горючий тайл
        const d = [[1,0],[-1,0],[0,1],[0,-1]][rngInt(0,3)];
        igniteTile(f.tx+d[0], f.ty+d[1]);
      }
    }
    G.fires = G.fires.filter(f => {
      if (f.hp > 0) return true;
      const t = G.map[f.ty] && G.map[f.ty][f.tx];   // топливо выгорело
      if (t) { if (t.floor==='wood') t.floor = null; if (t.type===TERRAIN.GRASS && !t.obj) t.type = TERRAIN.DIRT; }
      return false;
    });
  }
  maybeLightning();
}
// Пешка тушит ближайший пожар (срочная работа — пожар важнее обычных дел).
function tryFirefight(p) {
  if (!G.fires || !G.fires.length) return false;
  const fire = G.fires.filter(f => claimCount('fire_'+f.tx+'_'+f.ty) < 3)
    .sort((a,b) => distTiles(p,a.tx,a.ty) - distTiles(p,b.tx,b.ty))[0];
  if (!fire) return false;
  claimSpot('fire_'+fire.tx+'_'+fire.ty);
  p._wt = 'fire_'+fire.tx+'_'+fire.ty;
  setTarget(p, fire.tx, fire.ty);
  if (distTiles(p, fire.tx, fire.ty) <= 1.6) {
    fire.hp -= 1.6 * wmul(p);
    if (fire.hp <= 0) { G.fires = G.fires.filter(x=>x!==fire); addLog('🧯 Пожар потушен', 'good'); }
  }
  p.state = 'working';
  return true;
}
function drawFires() {
  if (!G.fires || !G.fires.length) return;
  for (const f of G.fires) {
    const px = f.tx*TILE, py = f.ty*TILE;
    const flick = 0.6 + 0.4*Math.sin((G.tick||0)*0.4 + f.tx*3 + f.ty);
    ctx.fillStyle = `rgba(255,${90+Math.floor(80*flick)},20,0.85)`;
    ctx.beginPath(); ctx.moveTo(px+TILE*0.5, py+TILE*0.1); ctx.lineTo(px+TILE*0.2, py+TILE*0.9); ctx.lineTo(px+TILE*0.8, py+TILE*0.9); ctx.closePath(); ctx.fill();
    ctx.fillStyle = `rgba(255,220,80,${0.55*flick})`;
    ctx.beginPath(); ctx.moveTo(px+TILE*0.5, py+TILE*0.4); ctx.lineTo(px+TILE*0.38, py+TILE*0.85); ctx.lineTo(px+TILE*0.62, py+TILE*0.85); ctx.closePath(); ctx.fill();
  }
}

// Фаза суток по часу (чистая функция — тестируемо). Используется для тинта и будущих эффектов.
function dayPhase(h) {
  if (h < 5 || h >= 21) return 'night';
  if (h < 7) return 'dawn';
  if (h < 19) return 'day';
  return 'dusk';
}
// Уровень освещённости 0..1 (полночь=0, полдень=1), плавно.
function daylight(h) {
  return clamp(0.5 - 0.5 * Math.cos((h / 24) * Math.PI * 2), 0, 1);
}
function isNight() { return dayPhase(G ? G.hour : 12) === 'night'; }
// Множитель скорости работы от времени суток: ночью труд медленнее (темно).
function dayWorkMul(h) { return dayPhase(h) === 'night' ? 0.85 : 1; }

function drawDayNightOverlay() {
  const h = G.hour + G.minute/60;
  let tint = null;
  if (h < 5 || h >= 21) tint = 'rgba(10,15,45,0.55)';        // night
  else if (h < 7) tint = 'rgba(60,40,80,0.35)';              // dawn
  else if (h < 8) tint = 'rgba(200,140,80,0.18)';            // sunrise warm
  else if (h >= 19 && h < 20) tint = 'rgba(220,120,60,0.20)';// sunset
  else if (h >= 20) tint = 'rgba(40,30,70,0.40)';            // dusk
  if (G.weather==='storm'||G.weather==='blizzard') tint = 'rgba(30,35,55,0.45)';
  if (tint) {
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  // Warm glow around lit buildings at night
  if (h < 6 || h >= 20) {
    ctx.globalCompositeOperation = 'lighter';
    for (const b of G.buildings) {
      if (b.blueprint) continue;
      if (['saloon','smithy','camp','lab'].includes(b.type)) {
        const z = G.camera.zoom;
        const sx = (b.tx*TILE + TILE*BUILDS[b.type].size/2 - G.camera.x)*z;
        const sy = (b.ty*TILE + TILE*BUILDS[b.type].size/2 - G.camera.y)*z;
        if (sx<-40||sy<-40||sx>canvas.width+40||sy>canvas.height+40) continue;
        const grd = ctx.createRadialGradient(sx, sy, 2, sx, sy, 40);
        grd.addColorStop(0, 'rgba(255,180,80,0.25)');
        grd.addColorStop(1, 'rgba(255,180,80,0)');
        ctx.fillStyle = grd;
        ctx.fillRect(sx-40, sy-40, 80, 80);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }
}

function drawFloorTile(x, y, mat) {
  const px = x*TILE, py = y*TILE;
  if (mat==='road') {
    ctx.fillStyle = '#b09464'; ctx.fillRect(px, py, TILE+1, TILE+1);            // утоптанная тропа
    ctx.fillStyle = 'rgba(120,95,55,0.45)';
    ctx.fillRect(px+2, py+TILE*0.35, TILE-4, 2); ctx.fillRect(px+2, py+TILE*0.6, TILE-4, 2); // колеи
    return;
  }
  if (mat==='stone') {
    ctx.fillStyle = '#8d8a82'; ctx.fillRect(px, py, TILE+1, TILE+1);
    ctx.fillStyle = '#9a978f'; ctx.fillRect(px, py, TILE/2, TILE/2); ctx.fillRect(px+TILE/2, py+TILE/2, TILE/2, TILE/2);
    ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 1;
    ctx.strokeRect(px+0.5, py+0.5, TILE, TILE);
    ctx.beginPath(); ctx.moveTo(px, py+TILE/2); ctx.lineTo(px+TILE, py+TILE/2); ctx.moveTo(px+TILE/2, py); ctx.lineTo(px+TILE/2, py+TILE); ctx.stroke();
  } else {
    ctx.fillStyle = '#7a5230'; ctx.fillRect(px, py, TILE+1, TILE+1);
    ctx.strokeStyle = 'rgba(40,22,8,0.5)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let i=1;i<3;i++){ ctx.moveTo(px, py+i*TILE/3); ctx.lineTo(px+TILE, py+i*TILE/3); }
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,222,170,0.10)'; ctx.fillRect(px, py, TILE, 2);
  }
}

function drawTileObj(x, y, obj) {
  const px = x*TILE+TILE/2, py = y*TILE+TILE/2;
  if (obj.type==='tree') {
    const healthy = obj.hp/obj.maxHp;
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath(); ctx.ellipse(px+2, py+8, 7, 3, 0, 0, Math.PI*2); ctx.fill();
    // Trunk
    ctx.fillStyle = '#5a3a20';
    ctx.fillRect(px-2, py-1, 4, TILE/2);
    // Canopy: layered for volume
    const base = G.season===3 ? '#9ab0c0' : G.season===2 ? '#9a7a30' : '#3a7a2a';
    const light = G.season===3 ? '#c0d0dc' : G.season===2 ? '#c0a040' : '#5a9a3a';
    ctx.fillStyle = base;
    ctx.beginPath(); ctx.arc(px, py-3, 8*healthy+2, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = light;
    ctx.beginPath(); ctx.arc(px-2, py-5, 5*healthy+1, 0, Math.PI*2); ctx.fill();
    if (obj.marked) {
      const a = markPulseAlpha();
      ctx.strokeStyle = `rgba(232,201,126,${a})`; ctx.lineWidth = 1.5;
      ctx.strokeRect(x*TILE+1, y*TILE+1, TILE-2, TILE-2); ctx.lineWidth = 1;
      ctx.globalAlpha = a; ctx.font = '9px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('🪓', px, y*TILE+5); ctx.globalAlpha = 1;
    }
  } else if (obj.type==='rock') {
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath(); ctx.ellipse(px+2, py+5, 9, 3, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#56524d';
    ctx.beginPath(); ctx.ellipse(px, py+1, 9, 7, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#7a756e';
    ctx.beginPath(); ctx.ellipse(px-1, py-1, 6, 5, -0.3, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#969089';
    ctx.beginPath(); ctx.ellipse(px-2, py-2, 2.5, 2, 0, 0, Math.PI*2); ctx.fill();
    if (obj.marked) {
      const a = markPulseAlpha();
      ctx.strokeStyle = `rgba(232,160,48,${a})`; ctx.lineWidth = 1.5;
      ctx.strokeRect(x*TILE+1, y*TILE+1, TILE-2, TILE-2); ctx.lineWidth = 1;
      ctx.globalAlpha = a; ctx.font = '9px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('⛏️', px, y*TILE+5); ctx.globalAlpha = 1;
    }
  }
}

function drawPOI(poi) {
  const def = poiDef(poi.type);
  const px = poi.tx*TILE + TILE/2, py = poi.ty*TILE + TILE/2;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath(); ctx.ellipse(px+2, py+7, 9, 3, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = 'rgba(20,16,10,0.72)';
  ctx.strokeStyle = def.color;
  ctx.lineWidth = 1.5;
  ctx.fillRect(px-9, py-12, 18, 18);
  ctx.strokeRect(px-9, py-12, 18, 18);
  ctx.font = '14px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f4deb0';
  ctx.fillText(def.icon, px, py-3);
  ctx.restore();
}

function showPoiInfo(poi, cx, cy) {
  const overlay = document.getElementById('info-overlay');
  const def = poiDef(poi.type);
  overlay.style.display = 'block';
  overlay.style.left = Math.min(cx, canvas.width-280) + 'px';
  overlay.style.top = (cy + 10) + 'px';
  overlay.innerHTML = `
    <div class="inf-title">${def.icon} ${def.name}</div>
    <div class="inf-line">Координаты: <b>${poi.tx},${poi.ty}</b></div>
    <div class="inf-line">${def.note}</div>
    <div class="inf-line">Исход: <b>${poi.searched ? 'уже обследовано' : def.result}</b></div>
  `;
  setTimeout(() => { overlay.style.display='none'; }, 3000);
}

function drawBuilding(b) {
  const x = b.tx*TILE, y = b.ty*TILE;
  const def = BUILDS[b.type];
  const S = TILE*def.size;

  if (b.blueprint) {
    // Blueprint look: dashed outline + ghost icon
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = 'rgba(80,140,200,0.12)';
    ctx.fillRect(x, y, S, S);
    ctx.strokeStyle = '#6aa6e0';
    ctx.setLineDash([4,3]); ctx.lineWidth = 1.5;
    ctx.strokeRect(x+1, y+1, S-2, S-2);
    ctx.setLineDash([]); ctx.lineWidth = 1;
    ctx.font = `${S*0.4}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.globalAlpha = 0.5;
    ctx.fillText(def.icon, x+S/2, y+S/2);
    ctx.globalAlpha = 1;
    if (b.progress > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x, y+S-4, S, 4);
      ctx.fillStyle = '#6aa6e0'; ctx.fillRect(x, y+S-4, S*b.progress, 4);
    }
    return;
  }

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fillRect(x+3, y+3, S, S);

  // Specific drawings
  drawStructure(b.type, x, y, S, def, b);

  // Selection
  if (b.selected) {
    ctx.strokeStyle = '#e8c97e'; ctx.lineWidth = 2;
    ctx.strokeRect(x, y, S, S); ctx.lineWidth = 1;
  }

  // HP bar
  if (b.hp < b.maxHp) {
    const ratio = b.hp/b.maxHp;
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x, y-5, S, 3);
    ctx.fillStyle = ratio>0.5?'#7ca84e':'#c04444'; ctx.fillRect(x, y-5, S*ratio, 3);
  }
}

function drawStructure(type, x, y, S, def, b) {
  const cx = x+S/2, cy = y+S/2;
  switch(type) {
    case 'farm': {
      ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x, y, S, S);
      const g = b.growth || 0;
      for (let i=0; i<3; i++) for (let j=0; j<3; j++) {
        const px = x+4+i*(S-8)/2.5, py = y+4+j*(S-8)/2.5;
        ctx.fillStyle = g>0.7?'#e8c040':g>0.3?'#7aaa3a':'#4a6a2a';
        ctx.fillRect(px, py, 3, 3+g*4);
      }
      ctx.strokeStyle = '#3a2a1a'; ctx.strokeRect(x+0.5, y+0.5, S-1, S-1);
      break;
    }
    case 'kitchen': {
      ctx.fillStyle = '#6c4a2e'; ctx.fillRect(x+2, y+2, S-4, S-4);
      ctx.fillStyle = '#3a2618'; ctx.fillRect(x+5, y+5, S-10, 6);
      ctx.fillStyle = '#1f1f1f'; ctx.beginPath(); ctx.arc(cx, cy+3, S*0.18, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#c8c0a8'; ctx.fillRect(cx-7, cy-2, 14, 3);
      ctx.fillStyle = 'rgba(255,170,60,'+(0.25+0.2*Math.sin(G.tick*0.08))+')';
      ctx.beginPath(); ctx.arc(cx+S*0.22, cy+S*0.18, 4, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#2b1a10'; ctx.strokeRect(x+2, y+2, S-4, S-4);
      break;
    }
    case 'mine': {
      ctx.fillStyle = '#5a5550'; ctx.fillRect(x, y, S, S);
      ctx.fillStyle = '#3a3530'; // pit
      ctx.beginPath(); ctx.ellipse(cx, cy, S*0.3, S*0.25, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#8a8580'; // rocks
      ctx.fillRect(x+3, y+3, 4, 4); ctx.fillRect(x+S-7, y+S-7, 4, 4);
      ctx.strokeStyle = '#2a2520'; ctx.strokeRect(x+0.5, y+0.5, S-1, S-1);
      break;
    }
    case 'stockpile': {
      ctx.fillStyle = 'rgba(80,70,45,0.35)';
      ctx.fillRect(x+1, y+1, S-2, S-2);
      ctx.strokeStyle = '#b89a5a';
      ctx.setLineDash([4,3]);
      ctx.strokeRect(x+2, y+2, S-4, S-4);
      ctx.setLineDash([]);
      ctx.fillStyle = '#9a7a44';
      ctx.fillRect(x+S*0.2, y+S*0.55, S*0.22, S*0.18);
      ctx.fillRect(x+S*0.5, y+S*0.35, S*0.24, S*0.18);
      break;
    }
    case 'fence': {
      ctx.strokeStyle = '#6a4520'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x+2, cy); ctx.lineTo(x+S-2, cy); ctx.stroke();
      ctx.fillStyle = '#7a5530';
      ctx.fillRect(x+3, y+4, 3, S-8); ctx.fillRect(x+S-6, y+4, 3, S-8);
      ctx.lineWidth = 1;
      break;
    }
    case 'sandbag': {
      ctx.fillStyle = '#b8a86a';                                  // ряд мешков
      for (let i=0; i<3; i++) {
        ctx.beginPath(); ctx.ellipse(x+S*(0.25+i*0.25), y+S*0.62, S*0.16, S*0.13, 0, 0, Math.PI*2); ctx.fill();
      }
      ctx.fillStyle = '#9a8a50';                                  // нижний ряд
      for (let i=0; i<2; i++) {
        ctx.beginPath(); ctx.ellipse(x+S*(0.38+i*0.25), y+S*0.8, S*0.16, S*0.12, 0, 0, Math.PI*2); ctx.fill();
      }
      ctx.strokeStyle = 'rgba(60,50,20,0.4)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x+S*0.12, y+S*0.62); ctx.lineTo(x+S*0.88, y+S*0.62); ctx.stroke();
      break;
    }
    case 'wall': {
      ctx.fillStyle = '#7a5836'; ctx.fillRect(x+1, y+1, S-2, S-2);
      ctx.fillStyle = '#8d6a44'; ctx.fillRect(x+1, y+1, S-2, 3); // верхняя фаска
      ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(x+1, y+S-4, S-2, 3);
      ctx.strokeStyle = 'rgba(40,24,10,0.55)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x+1, cy); ctx.lineTo(x+S-1, cy); ctx.stroke(); // доски
      break;
    }
    case 'wall_stone': {
      ctx.fillStyle = '#8a8780'; ctx.fillRect(x+1, y+1, S-2, S-2);
      ctx.fillStyle = '#9c998f'; ctx.fillRect(x+1, y+1, S-2, 3);
      ctx.fillStyle = 'rgba(0,0,0,0.30)'; ctx.fillRect(x+1, y+S-4, S-2, 3);
      ctx.strokeStyle = 'rgba(30,30,30,0.45)'; ctx.lineWidth = 1; // кладка
      ctx.beginPath();
      ctx.moveTo(x+1, cy); ctx.lineTo(x+S-1, cy);
      ctx.moveTo(cx, y+1); ctx.lineTo(cx, cy);
      ctx.moveTo(x+S*0.3, cy); ctx.lineTo(x+S*0.3, y+S-1);
      ctx.moveTo(x+S*0.7, cy); ctx.lineTo(x+S*0.7, y+S-1);
      ctx.stroke();
      break;
    }
    case 'gate': {
      ctx.strokeStyle = '#7a5530'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x+2, cy); ctx.lineTo(x+S-2, cy); ctx.stroke();
      ctx.fillStyle = '#9a6a35';
      ctx.fillRect(x+3, y+4, 3, S-8); ctx.fillRect(x+S-6, y+4, 3, S-8);
      ctx.strokeStyle = '#d0a45a'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx-4, y+6); ctx.lineTo(cx+4, y+S-6);
      ctx.moveTo(cx+4, y+6); ctx.lineTo(cx-4, y+S-6); ctx.stroke();
      ctx.lineWidth = 1;
      break;
    }
    case 'tower': {
      ctx.fillStyle = '#6a5540'; ctx.fillRect(x+4, y+4, S-8, S-8);
      ctx.fillStyle = '#4a3a2a'; ctx.fillRect(x+2, y+2, S-4, 4); // top platform
      ctx.fillStyle = '#3a2a1a';
      for (let i=0; i<S; i+=6) ctx.fillRect(x+2+i, y+2, 2, 2);
      // little flag
      ctx.strokeStyle='#5a4030'; ctx.beginPath(); ctx.moveTo(cx,y+2); ctx.lineTo(cx,y-4); ctx.stroke();
      ctx.fillStyle='#b04040'; ctx.fillRect(cx, y-4, 5, 3);
      break;
    }
    case 'stable': {
      ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x+2, y+S*0.32, S-4, S*0.66);     // сарай
      ctx.fillStyle = '#4a3018';                                               // крыша
      ctx.beginPath(); ctx.moveTo(x, y+S*0.34); ctx.lineTo(cx, y+3); ctx.lineTo(x+S, y+S*0.34); ctx.fill();
      ctx.fillStyle = '#2a1c10'; ctx.fillRect(cx-5, y+S*0.55, 10, S*0.43);      // ворота сарая
      ctx.fillStyle = '#caa45a'; ctx.fillRect(cx-4, y+S*0.58, 3, S*0.36); ctx.fillRect(cx+1, y+S*0.58, 3, S*0.36);
      ctx.font = `${S*0.32}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('🐴', cx, y+S*0.2);
      break;
    }
    case 'barrel': {
      ctx.fillStyle = '#5a3a1c'; ctx.beginPath();                        // деревянная бочка
      ctx.ellipse(cx, cy, S*0.28, S*0.36, 0, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#2a1a0c'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx-S*0.26, cy-S*0.1); ctx.lineTo(cx+S*0.26, cy-S*0.1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx-S*0.26, cy+S*0.12); ctx.lineTo(cx+S*0.26, cy+S*0.12); ctx.stroke();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#222'; ctx.beginPath(); ctx.moveTo(cx, cy-S*0.36); ctx.lineTo(cx+3, cy-S*0.5); ctx.stroke(); // фитиль
      ctx.fillStyle = (((G&&G.tick)||0)>>3)%2 ? '#ffd060' : '#ff8030';
      ctx.beginPath(); ctx.arc(cx+3, cy-S*0.5, 1.6, 0, Math.PI*2); ctx.fill(); // искра
      break;
    }
    case 'ranch': {
      ctx.fillStyle = '#7a5a35'; ctx.fillRect(x+2, y+S*0.38, S-4, S*0.6);
      ctx.fillStyle = '#4a3018';
      ctx.beginPath(); ctx.moveTo(x+1, y+S*0.4); ctx.lineTo(cx, y+4); ctx.lineTo(x+S-1, y+S*0.4); ctx.fill();
      ctx.strokeStyle = '#9a6a35'; ctx.lineWidth = 2;
      ctx.strokeRect(x+4, y+S*0.58, S-8, S*0.32);
      ctx.lineWidth = 1;
      ctx.font = `${S*0.28}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('🤠', cx, y+S*0.22);
      break;
    }
    case 'saloon': {
      ctx.fillStyle = '#7a5530'; ctx.fillRect(x, y+S*0.35, S, S*0.65); // body
      ctx.fillStyle = '#5a3a1a'; // roof
      ctx.beginPath(); ctx.moveTo(x, y+S*0.35); ctx.lineTo(cx, y+2); ctx.lineTo(x+S, y+S*0.35); ctx.fill();
      ctx.fillStyle = '#3a2510'; ctx.fillRect(cx-4, y+S*0.6, 8, S*0.4); // door
      ctx.fillStyle = '#c8a040'; ctx.fillRect(x+4, y+S*0.5, 5, 5); ctx.fillRect(x+S-9, y+S*0.5, 5, 5); // windows
      break;
    }
    case 'tradepost': {
      ctx.fillStyle = '#6b5130'; ctx.fillRect(x+2, y+S*0.3, S-4, S*0.68);
      ctx.fillStyle = '#3a2815'; ctx.fillRect(x+4, y+S*0.18, S-8, S*0.16);
      ctx.fillStyle = '#caa45a'; ctx.fillRect(x+S*0.18, y+S*0.48, S*0.22, S*0.18);
      ctx.fillStyle = '#8a5a2e'; ctx.fillRect(x+S*0.55, y+S*0.5, S*0.25, S*0.22);
      ctx.strokeStyle = '#d0a45a'; ctx.strokeRect(x+S*0.16, y+S*0.46, S*0.68, S*0.3);
      ctx.fillStyle = '#1d140a'; ctx.fillRect(cx-4, y+S*0.65, 8, S*0.33);
      break;
    }
    case 'lab': {
      ctx.fillStyle = '#33405a'; ctx.fillRect(x+2, y+S*0.25, S-4, S*0.73);          // стены
      ctx.fillStyle = '#26304a';                                                    // крыша
      ctx.beginPath(); ctx.moveTo(x+1, y+S*0.27); ctx.lineTo(cx, y+2); ctx.lineTo(x+S-1, y+S*0.27); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#6aa0c0'; ctx.beginPath(); ctx.arc(cx, cy+2, S*0.16, 0, Math.PI*2); ctx.fill();   // колба
      ctx.fillStyle = '#aee0ff'; ctx.beginPath(); ctx.arc(cx-2, cy, S*0.06, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = `rgba(174,224,255,${0.5+0.4*Math.sin((G.tick||0)*0.12)})`;     // пузырёк
      ctx.beginPath(); ctx.arc(cx+3, cy-3-((G.tick||0)%20)/10, 1.6, 0, Math.PI*2); ctx.fill();
      break;
    }
    case 'clinic': {
      ctx.fillStyle = '#d8d4c8'; ctx.fillRect(x+2, y+S*0.28, S-4, S*0.7);          // стены
      ctx.fillStyle = '#9a3030';                                                    // красная крыша
      ctx.beginPath(); ctx.moveTo(x, y+S*0.3); ctx.lineTo(cx, y+2); ctx.lineTo(x+S, y+S*0.3); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#7a6a55'; ctx.fillRect(cx-4, y+S*0.62, 8, S*0.36);           // дверь
      ctx.fillStyle = '#fff'; ctx.fillRect(cx-6, y+S*0.36, 12, 12);                 // вывеска
      ctx.fillStyle = '#c03030'; ctx.fillRect(cx-1, y+S*0.36+2, 2, 8); ctx.fillRect(cx-4, y+S*0.36+5, 8, 2);
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.strokeRect(x+2, y+S*0.28, S-4, S*0.7);
      break;
    }
    case 'smithy': {
      ctx.fillStyle = '#4a3525'; ctx.fillRect(x+2, y+2, S-4, S-4);
      ctx.fillStyle = '#2a2020'; ctx.fillRect(cx-6, cy-2, 12, 8); // anvil base
      ctx.fillStyle = '#888'; ctx.fillRect(cx-7, cy-4, 14, 4);
      // glow
      ctx.fillStyle = 'rgba(255,140,40,'+(0.4+0.3*Math.sin(G.tick*0.1))+')';
      ctx.beginPath(); ctx.arc(x+S-7, y+7, 4, 0, Math.PI*2); ctx.fill();
      break;
    }
    case 'camp': {
      ctx.fillStyle = '#c8b090'; // tent
      ctx.beginPath(); ctx.moveTo(cx, y+3); ctx.lineTo(x+3, y+S-3); ctx.lineTo(x+S-3, y+S-3); ctx.fill();
      ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.moveTo(cx, y+S*0.4); ctx.lineTo(cx-5, y+S-3); ctx.lineTo(cx+5, y+S-3); ctx.fill();
      ctx.strokeStyle='#8a7050'; ctx.beginPath(); ctx.moveTo(cx, y+1); ctx.lineTo(cx, y+S-3); ctx.stroke();
      break;
    }
    case 'bed': {
      ctx.fillStyle = '#5a3b24'; ctx.fillRect(x+3, y+4, S-6, S-7);
      ctx.fillStyle = '#d9c6a0'; ctx.fillRect(x+5, y+6, S-10, S*0.28);
      ctx.fillStyle = '#7a3f3f'; ctx.fillRect(x+5, y+S*0.38, S-10, S*0.42);
      ctx.fillStyle = '#2f2018'; ctx.fillRect(x+3, y+S-5, 4, 3); ctx.fillRect(x+S-7, y+S-5, 4, 3);
      ctx.strokeStyle = '#2a1a10'; ctx.strokeRect(x+3.5, y+4.5, S-7, S-8);
      break;
    }
    case 'table': {
      ctx.fillStyle = '#7a5430'; ctx.fillRect(x+4, y+6, S-8, S-10);
      ctx.fillStyle = '#4a2f18'; ctx.fillRect(x+6, y+8, 3, S-14); ctx.fillRect(x+S-9, y+8, 3, S-14);
      ctx.fillStyle = '#d8c08a'; ctx.beginPath(); ctx.arc(cx, cy, S*0.16, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#2a1a10'; ctx.strokeRect(x+4.5, y+6.5, S-9, S-11);
      break;
    }
    case 'decor': {
      ctx.fillStyle = '#5a3a22'; ctx.fillRect(cx-5, y+S-8, 10, 6);
      ctx.fillStyle = '#3f7a43'; ctx.beginPath(); ctx.arc(cx-3, cy, S*0.18, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#5fa85a'; ctx.beginPath(); ctx.arc(cx+4, cy-3, S*0.16, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#e8c97e'; ctx.beginPath(); ctx.arc(cx+1, cy-5, 2, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#2a1a10'; ctx.strokeRect(cx-5.5, y+S-8.5, 10, 6);
      break;
    }
    case 'well': {
      ctx.fillStyle = '#6a6560'; ctx.beginPath(); ctx.arc(cx, cy, S*0.32, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#2a4560'; ctx.beginPath(); ctx.arc(cx, cy, S*0.2, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#4a3520'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(x+4, y+2); ctx.lineTo(x+4, cy); ctx.moveTo(x+S-4, y+2); ctx.lineTo(x+S-4, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x+3, y+3); ctx.lineTo(x+S-3, y+3); ctx.stroke(); ctx.lineWidth=1;
      break;
    }
    default:
      ctx.fillStyle = '#444'; ctx.fillRect(x, y, S, S);
      ctx.font = `${S*0.5}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(def.icon, cx, cy);
  }
}

function drawItemStack(item) {
  const x = item.tx*TILE + TILE/2;
  const y = item.ty*TILE + TILE/2;
  const colors = {wood:'#8a5a2e', ore:'#8c8782', food:'#d8b050', meat:'#b85a50', med:'#e8e8e0'};
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath(); ctx.ellipse(x, y+6, 8, 3, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = colors[item.res] || '#d0b070';
  const n = clamp(Math.ceil(item.amount/8), 1, 5);
  for (let i=0; i<n; i++) {
    ctx.fillRect(x-7+i*3, y+2-i, 8, 5);
  }
  ctx.fillStyle = '#f0d090';
  ctx.font = '8px Courier New'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(Math.floor(item.amount), x, y-8);
}

// Глиф состояния над пешкой (чистая функция — тестируемо). Бой и downed рисуются отдельно.
function stateGlyph(state) {
  return ({ working:'⚒', joy:'♪', breakdown:'💢', sleeping:'💤' })[state] || '';
}

// Пульсация подсветки помеченных объектов (0.45..0.9).
function markPulseAlpha() {
  return 0.45 + 0.45 * Math.abs(Math.sin(((G && G.tick) || 0) * 0.12));
}

// Сколько объектов помечено для работы (чистая функция — для HUD и тестов).
function countMarked() {
  const out = { trees: 0, rocks: 0, animals: 0 };
  if (!G) return out;
  if (G.map) for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
    const o = G.map[y][x] && G.map[y][x].obj;
    if (o && o.marked) { if (o.type === 'rock') out.rocks++; else if (o.type === 'tree') out.trees++; }
  }
  if (G.animals) for (const a of G.animals) if (a.alive && a.marked) out.animals++;
  return out;
}

// Короткая сводка «что в очереди работ» для HUD (чистая функция — тестируемо).
function markedSummaryText() {
  const m = countMarked();
  const parts = [];
  if (m.trees) parts.push('🪓 ' + m.trees);
  if (m.rocks) parts.push('⛏️ ' + m.rocks);
  if (m.animals) parts.push('🎯 ' + m.animals);
  return parts.length ? parts.join(' · ') : 'нет';
}

function drawPawn(p) {
  const isSelected = G.selectedPawnId === p.id;
  const x = Math.round(p.x), y = Math.round(p.y);

  if (!p.alive) {
    // Gravestone (drawn)
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(x, y+7, 7, 3, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#6a6a6a';
    ctx.fillRect(x-5, y-6, 10, 12);
    ctx.beginPath(); ctx.arc(x, y-6, 5, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(x-3, y-2, 6, 1.5);
    ctx.fillRect(x-1, y-5, 2, 6);
    return;
  }

  // Walk animation phase
  if (!p._anim) p._anim = 0;
  const moving = Math.hypot((p._lx||x)-x, (p._ly||y)-y) > 0.3;
  p._lx = x; p._ly = y;
  if (moving) p._anim += 0.3; else p._anim = 0;
  const legSwing = Math.sin(p._anim) * 2.5;

  // Each pawn has a consistent shirt color from id
  const shirts = ['#7a5a9a','#5a7a9a','#9a6a4a','#4a8a6a','#9a9a4a','#aa5a5a','#5a8a9a','#8a6a8a'];
  const shirt = p.state==='fighting' ? '#b04040' : shirts[p.id % shirts.length];

  // Selection ring
  if (isSelected) {
    // пульсирующее кольцо
    const pulse = 2 + Math.sin((G.tick||0) * 0.18) * 1.5;
    ctx.strokeStyle = '#e8c97e';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(x, y+7, 11, 5, 0, 0, Math.PI*2); ctx.stroke();
    ctx.strokeStyle = 'rgba(232,201,126,0.5)';
    ctx.beginPath(); ctx.ellipse(x, y+7, 11+pulse, 5+pulse*0.5, 0, 0, Math.PI*2); ctx.stroke();
    ctx.lineWidth = 1;
    // прыгающая стрелка-указатель над головой — пешку сразу видно
    const ay = y - 26 - Math.abs(Math.sin((G.tick||0) * 0.15)) * 4;
    ctx.fillStyle = '#e8c97e';
    ctx.beginPath();
    ctx.moveTo(x, ay + 8); ctx.lineTo(x - 5, ay); ctx.lineTo(x + 5, ay);
    ctx.closePath(); ctx.fill();
  }

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath(); ctx.ellipse(x, y+8, 7, 3, 0, 0, Math.PI*2); ctx.fill();

  if (p.downed) {
    // лежит без сознания — кровь + красный крест-призыв о помощи
    ctx.fillStyle = 'rgba(150,30,30,0.4)';
    ctx.beginPath(); ctx.ellipse(x, y+2, 11, 5, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = shirt;
    ctx.fillRect(x-8, y-1, 16, 6);
    ctx.fillStyle = '#d8a878';
    ctx.beginPath(); ctx.arc(x-10, y+2, 3, 0, Math.PI*2); ctx.fill(); // голова
    ctx.fillStyle = '#c03030';
    ctx.font = '10px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('✚', x+4, y-9);
  } else if (p.state==='sleeping') {
    // lying down
    ctx.fillStyle = shirt;
    ctx.fillRect(x-8, y-2, 16, 6);
    ctx.fillStyle = '#3a2510';
    ctx.fillRect(x-11, y-2, 5, 5); // hat
    ctx.fillStyle = '#666';
    ctx.font = '9px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('💤', x+2, y-9);
  } else {
    // Legs (animated)
    ctx.strokeStyle = '#3a2a1a';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x-2, y+3); ctx.lineTo(x-2+legSwing, y+9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+2, y+3); ctx.lineTo(x+2-legSwing, y+9); ctx.stroke();
    ctx.lineWidth = 1;
    // Body / vest
    ctx.fillStyle = shirt;
    roundRect(x-5, y-4, 10, 9, 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(x-1, y-4, 2, 9); // vest seam
    // Arms
    ctx.strokeStyle = shirt; ctx.lineWidth = 2.5;
    const armSwing = moving ? -legSwing : 0;
    ctx.beginPath(); ctx.moveTo(x-4, y-2); ctx.lineTo(x-6, y+2+armSwing); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+4, y-2); ctx.lineTo(x+6, y+2-armSwing); ctx.stroke();
    ctx.lineWidth = 1;
    // Head
    ctx.fillStyle = '#d8a878';
    ctx.beginPath(); ctx.arc(x, y-7, 3.5, 0, Math.PI*2); ctx.fill();
    // Cowboy hat
    ctx.fillStyle = '#4a3018';
    ctx.beginPath(); ctx.ellipse(x, y-9, 7, 2.5, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillRect(x-3, y-13, 6, 4);
    ctx.beginPath(); ctx.ellipse(x, y-13, 3, 1.5, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(x-3, y-10, 6, 1);
    // Gun if fighting
    if (p.state==='fighting') {
      ctx.strokeStyle = '#222'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x+5, y); ctx.lineTo(x+10, y-2); ctx.stroke();
      ctx.lineWidth = 1;
    }
    // Tool swing if working — взмах инструмента (рубка/кирка/молот)
    if (p.state==='working') {
      const sw = Math.abs(Math.sin((G.tick||0) * 0.35));   // 0..1 мах вверх-вниз
      const hx = x + 5, hy = y - 1;
      const tipX = hx + 4, tipY = hy - 7 + sw * 8;
      ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 2;       // рукоять
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tipX, tipY); ctx.stroke();
      ctx.fillStyle = '#cfcfcf';                             // головка инструмента
      ctx.fillRect(tipX - 1, tipY - 2, 4, 3);
      ctx.lineWidth = 1;
    }
  }

  // State glyph (для не-боевых состояний; downed рисуется отдельно крестом)
  const stateIcon = stateGlyph(p.state);
  if (stateIcon) {
    ctx.font = '9px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(stateIcon, x+8, y-12);
  }
  if (p.carry) {
    ctx.fillStyle = '#e8c97e';
    ctx.font = '9px Courier New'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(p.carry.res === 'buildpack' ? '📦' : '['+Math.floor(p.carry.amount)+']', x, y-18);
  }

  // Name tag
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  roundRect(x-16, y+11, 32, 9, 2); ctx.fill();
  ctx.fillStyle = p.mood < 30 ? '#e07070' : '#e8c97e';
  ctx.font = '8px Courier New'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(p.name.substring(0,7), x, y+16);

  // HP bar above head (only if damaged)
  if (p.hp < p.maxHp) {
    const hpRatio = p.hp/p.maxHp;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x-12, y-20, 24, 3);
    ctx.fillStyle = hpRatio>0.6?'#7ca84e':hpRatio>0.3?'#e8a030':'#c04444';
    ctx.fillRect(x-12, y-20, 24*hpRatio, 3);
  }
}

// rounded rect helper (path only; caller does fill/stroke)
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
}

function drawAnimal(a) {
  const icons = {deer:'🦌', bison:'🐃', rabbit:'🐇'};
  ctx.font = '14px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(icons[a.type]||'🐾', a.x, a.y);
  if (a.marked) {
    const al = markPulseAlpha();
    ctx.strokeStyle = `rgba(192,68,68,${al})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(a.x, a.y, 10, 0, Math.PI*2);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.globalAlpha = al; ctx.font = '9px serif';
    ctx.fillText('🎯', a.x, a.y-12); ctx.globalAlpha = 1;
  }
}

function drawEnemy(e) {
  const x = Math.round(e.x), y = Math.round(e.y);
  const def = ENEMY_TYPES[e.type] || ENEMY_TYPES.knifer;
  const big = e.type==='boss';
  const sz = big ? 1.4 : 1;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath(); ctx.ellipse(x, y+8*sz, 7*sz, 3, 0, 0, Math.PI*2); ctx.fill();

  // Legs
  ctx.strokeStyle = '#2a1515'; ctx.lineWidth = 2.5*sz;
  ctx.beginPath(); ctx.moveTo(x-2, y+3*sz); ctx.lineTo(x-2, y+9*sz); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x+2, y+3*sz); ctx.lineTo(x+2, y+9*sz); ctx.stroke();
  ctx.lineWidth = 1;
  // Body
  ctx.fillStyle = def.color;
  roundRect(x-5*sz, y-4*sz, 10*sz, 9*sz, 2); ctx.fill();
  // Head
  ctx.fillStyle = '#c89878';
  ctx.beginPath(); ctx.arc(x, y-7*sz, 3.5*sz, 0, Math.PI*2); ctx.fill();
  // Black hat (bandit)
  ctx.fillStyle = '#1a1010';
  ctx.beginPath(); ctx.ellipse(x, y-9*sz, 7*sz, 2.5, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillRect(x-3*sz, y-13*sz, 6*sz, 4*sz);
  // Bandana
  ctx.fillStyle = big ? '#c0a040' : '#aa3030';
  ctx.fillRect(x-3.5*sz, y-6*sz, 7*sz, 2.5);
  // Weapon hint
  if (e.ranged) {
    ctx.strokeStyle='#222'; ctx.lineWidth=2*sz;
    ctx.beginPath(); ctx.moveTo(x+4*sz, y); ctx.lineTo(x+10*sz, y-2); ctx.stroke(); ctx.lineWidth=1;
  } else {
    ctx.fillStyle='#ccc'; ctx.fillRect(x+5*sz, y-2, 5*sz, 1.5);
  }

  // HP bar
  const r = e.hp/e.maxHp;
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x-12*sz, y-16*sz, 24*sz, 3);
  ctx.fillStyle = '#c04444'; ctx.fillRect(x-12*sz, y-16*sz, 24*sz*r, 3);
  // Name for boss
  if (big) {
    ctx.fillStyle='#e8a030'; ctx.font='8px Courier New'; ctx.textAlign='center';
    ctx.fillText('ГЛАВАРЬ', x, y-20);
  }
}

function drawWeather() {
  if (!G) return;
  if (G.weather === 'rain' || G.weather === 'storm') {
    ctx.strokeStyle = G.weather==='storm' ? 'rgba(150,180,255,0.25)' : 'rgba(100,150,255,0.15)';
    ctx.lineWidth = 1;
    for (let i=0; i<(G.weather==='storm'?80:40); i++) {
      const rx = (Math.sin(G.tick*0.01+i*77.3)*0.5+0.5)*canvas.width;
      const ry = ((G.tick*2+i*37)%(canvas.height+20))-20;
      ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx-2, ry+8); ctx.stroke();
    }
  }
  if (G.weather === 'sandstorm') {
    ctx.fillStyle = 'rgba(200,150,80,0.08)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  if (G.season === 3 && (G.weather==='blizzard'||rng()<0.01)) {
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (let i=0; i<20; i++) {
      const rx = (Math.sin(G.tick*0.007+i*53.1)*0.5+0.5)*canvas.width;
      const ry = ((G.tick*1.5+i*41)%(canvas.height+10))-10;
      ctx.beginPath(); ctx.arc(rx, ry, 2, 0, Math.PI*2); ctx.fill();
    }
  }
}

// ==================== MINIMAP ====================
const miniCanvas = document.getElementById('minimap');
const miniCtx = miniCanvas.getContext('2d');
let _miniBase = null; // cached terrain image
let _miniDirty = true;

function buildMiniBase() {
  const off = document.createElement('canvas');
  off.width = MAP_W; off.height = MAP_H;
  const octx = off.getContext('2d');
  for (let y=0; y<MAP_H; y++) for (let x=0; x<MAP_W; x++) {
    octx.fillStyle = TCOLORS[G.map[y][x].type];
    octx.fillRect(x, y, 1, 1);
  }
  _miniBase = off;
  _miniDirty = false;
}

function drawMinimap() {
  if (!G) return;
  if (_miniDirty || !_miniBase) buildMiniBase();
  const W = miniCanvas.width, H = miniCanvas.height;
  const sx = W/MAP_W, sy = H/MAP_H;
  // terrain
  miniCtx.imageSmoothingEnabled = false;
  miniCtx.drawImage(_miniBase, 0, 0, W, H);

  // buildings (gold)
  miniCtx.fillStyle = '#e8c97e';
  for (const b of G.buildings) if (!b.blueprint) miniCtx.fillRect(b.tx*sx, b.ty*sy, sx*1.5, sy*1.5);
  // animals (light)
  miniCtx.fillStyle = 'rgba(220,200,160,0.7)';
  for (const a of G.animals) if (a.alive) miniCtx.fillRect((a.x/TILE)*sx-0.5, (a.y/TILE)*sy-0.5, 1.5, 1.5);
  // enemies (red)
  miniCtx.fillStyle = '#ff4040';
  for (const e of G.enemies) if (e.alive) miniCtx.fillRect((e.x/TILE)*sx-1, (e.y/TILE)*sy-1, 3, 3);
  // pawns (cyan)
  miniCtx.fillStyle = '#5ad0ff';
  for (const p of G.pawns) if (p.alive) miniCtx.fillRect((p.x/TILE)*sx-1, (p.y/TILE)*sy-1, 3, 3);

  // camera viewport rectangle
  const z = G.camera.zoom;
  const vx = (G.camera.x/TILE)*sx;
  const vy = (G.camera.y/TILE)*sy;
  const vw = (canvas.width/z/TILE)*sx;
  const vh = (canvas.height/z/TILE)*sy;
  miniCtx.strokeStyle = '#ffffff'; miniCtx.lineWidth = 1;
  miniCtx.strokeRect(vx, vy, vw, vh);
}

// Click minimap -> center camera there
miniCanvas.addEventListener('mousedown', (e) => {
  const r = miniCanvas.getBoundingClientRect();
  const fx = (e.clientX - r.left)/r.width;
  const fy = (e.clientY - r.top)/r.height;
  const z = G.camera.zoom;
  G.camera.x = fx*MAP_W*TILE - canvas.width/z/2;
  G.camera.y = fy*MAP_H*TILE - canvas.height/z/2;
  e.stopPropagation();
});

// ==================== UI UPDATE ====================
function updateUI() {
  if (!G) return;
  if (Sfx.on) { Sfx.setAmbient(ambientProfile()); Sfx.setMusic(musicProfile()); } // эмбиент + музыка (рестарт только при смене)
  document.getElementById('res-food').textContent = Math.floor(G.res.food);
  document.getElementById('res-wood').textContent = Math.floor(G.res.wood);
  document.getElementById('res-ore').textContent = Math.floor(G.res.ore);
  document.getElementById('res-meat').textContent = Math.floor(G.res.meat);
  document.getElementById('res-med').textContent = Math.floor(G.res.med);
  document.getElementById('res-sci').textContent = Math.floor(G.res.sci);
  document.getElementById('res-gold').textContent = Math.floor(G.res.gold);

  const s = G.season;
  const badge = document.getElementById('season-badge');
  badge.textContent = SEASONS[s];
  badge.style.background = SEASON_BG[s];

  const weatherIcons = {clear:G.season===3?'❄️':'☀️', rain:'🌧️', storm:'⛈️', sandstorm:'🌪️', snow:'🌨️', blizzard:'🌨️'};
  document.getElementById('weather-badge').textContent = weatherIcons[G.weather] || '☀️';

  const h = Math.floor(G.hour), m = Math.floor(G.minute);
  document.getElementById('clock').textContent = `День ${G.day} • ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;

  // Objective progress
  const goal = scenarioGoalStatus();
  document.getElementById('obj-fill').style.width = goal.pct+'%';
  document.getElementById('obj-text').textContent = goal.text;

  renderPawns();
  renderSchedule();
}

function focusPawn(id) {
  const p = G.pawns.find(q => q.id === id && !q.dead);
  if (!p) return;
  G.selectedPawnId = id;
  jumpToPawn(p);            // центрируем камеру на пешке
  showPriorityPanel(p);
  renderPawns();            // мгновенно подсветить выбранную карточку
}

const _boundPawnLists = new WeakSet();
function bindPawnList(list) {
  if (!list || _boundPawnLists.has(list)) return;
  // Делегирование: один слушатель на контейнере. ВАЖНО: используем pointerdown, а НЕ click.
  // Список пешек пересобирается ~10 раз/сек (updateUI), поэтому карточка под курсором
  // уничтожается между mousedown и mouseup и событие click не возникает — выбор «терялся».
  // pointerdown срабатывает сразу при нажатии, до перерисовки.
  list.addEventListener('pointerdown', (e) => {
    if (e.button && e.button !== 0) return;        // только основная кнопка
    const card = e.target.closest && e.target.closest('.pawn-card[data-pawn-id]');
    if (!card) return;
    focusPawn(parseInt(card.dataset.pawnId, 10));
  });
  _boundPawnLists.add(list);
}

function bindPawnLists() {
  ['pawn-list', 'mobile-pawn-list'].forEach(id => bindPawnList(document.getElementById(id)));
}

function createPawnCard(p) {
  const card = document.createElement('div');
  card.dataset.pawnId = p.id;
  card.className = 'pawn-card' + (G.selectedPawnId===p.id?' selected':'') + (p.dead?' dead':'');
  const stateNames = {idle:'Отдыхает',working:'Работает',sleeping:'Спит',fighting:'Сражается',joy:'Развлекается',breakdown:'Срыв!',downed:'🩸 Без сознания'};
  const woundText = p.hp < p.maxHp*0.5 ? '🤕 Ранен' : '';
  const sickText = p.sick ? `🤒 ${p.sick.name}` : '';
  const traitChips = (p.traits||[]).map(t=>{
    const tr = TRAITS[t]; if(!tr) return '';
    return `<span class="trait-chip ${tr.good?'tg':'tb'}" title="${tr.desc}">${tr.icon} ${tr.name}</span>`;
  }).join('');
  const skillChips = topSkills(p,3).map(s=>{
    const def = SKILLS.find(d=>d.id===s.id);
    return def ? `<span title="${def.name}">${def.icon}${s.lvl}</span>` : '';
  }).join(' ');
  card.innerHTML = `
    <div class="pawn-name">🤠 ${p.name} ${p.dead?'(погиб)':''}</div>
    <div class="pawn-status">${p.role}${(p.workLevel||0)>0?` ⭐${p.workLevel}`:''} • ${stateNames[p.state]||p.state} ${woundText} ${sickText}</div>
    <div class="pawn-status" style="color:#9a8fc0">🧠 ${personalitySummary(p)}</div>
    <div class="trait-row">${traitChips}</div>
    ${bar('HP',p.hp,p.maxHp,'bar-hp')}
    ${bar('Еда',p.food,p.maxFood,'bar-food')}
    ${bar('Настр',p.mood,p.maxMood,'bar-mood')}
    ${bar('Сила',p.energy,p.maxEnergy,'bar-energy')}
    ${skillChips?`<div class="pawn-thoughts" style="color:#9cc06a">Навыки: ${skillChips}</div>`:''}
    <div class="pawn-thoughts">${p.thoughts.slice(0,3).map(t=>`<span class="${t.neg?'thought-neg':'thought-pos'}">${t.text}</span>`).join(' ')}</div>
  `;
  return card;
}

function renderPawns() {
  bindPawnLists();
  const lists = ['pawn-list', 'mobile-pawn-list'].map(id => document.getElementById(id)).filter(Boolean);
  for (const list of lists) {
    list.innerHTML = '';
    for (const p of G.pawns) list.appendChild(createPawnCard(p));
  }
}

// Center camera on a pawn (used when selecting from the sidebar)
function jumpToPawn(p) {
  const z = G.camera.zoom;
  G.camera.x = p.x - canvas.width/z/2;
  G.camera.y = p.y - canvas.height/z/2;
}

function bar(label, val, max, cls) {
  const pct = Math.round(clamp(val/max,0,1)*100);
  return `<div class="bar-wrap">
    <div class="bar-label"><span>${label}</span><span>${Math.floor(val)}/${max}</span></div>
    <div class="bar"><div class="bar-fill ${cls}" style="width:${pct}%"></div></div>
  </div>`;
}

function renderSchedule() {
  const wrap = document.getElementById('schedule-wrap');
  if (document.getElementById('tab-schedule').classList.contains('active')) {
    wrap.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'schedule-grid';

    // Hours header
    const hrow = document.createElement('div');
    hrow.style.cssText = 'color:#555;font-size:9px;text-align:center;grid-column:2/-1;display:grid;grid-template-columns:repeat(24,1fr)';
    for (let h=0; h<24; h++) {
      const c = document.createElement('span');
      c.textContent = h;
      hrow.appendChild(c);
    }
    grid.innerHTML = '<div></div>';
    grid.appendChild(hrow);

    for (const p of G.pawns) {
      if (p.dead) continue;
      const nameEl = document.createElement('div');
      nameEl.className = 'sched-name';
      nameEl.textContent = p.name;
      grid.appendChild(nameEl);
      for (let h=0; h<24; h++) {
        const cell = document.createElement('div');
        const slot = p.schedule[h];
        cell.className = `sched-cell sched-${slot}`;
        if (h === G.hour) cell.style.outline = '1px solid #e8c97e';
        cell.title = `${p.name} ${h}:00 — ${slot}`;
        const ph = h, pp = p;
        cell.addEventListener('click', () => {
          const slots = ['any','work','sleep','joy'];
          pp.schedule[ph] = slots[(slots.indexOf(pp.schedule[ph])+1)%slots.length];
          renderSchedule();
        });
        grid.appendChild(cell);
      }
    }
    wrap.appendChild(grid);

    const legend = document.createElement('div');
    legend.style.cssText = 'margin-top:8px;font-size:10px;color:#666;display:flex;gap:8px;flex-wrap:wrap';
    legend.innerHTML = `
      <span><span style="background:#3a4a3a;padding:0 4px">■</span> Свободно</span>
      <span><span style="background:#4a3a1a;padding:0 4px">■</span> Работа</span>
      <span><span style="background:#2a2a5a;padding:0 4px">■</span> Сон</span>
      <span><span style="background:#3a2a4a;padding:0 4px">■</span> Досуг</span>
    `;
    wrap.appendChild(legend);
  }
}

function renderResearch() {
  const list = document.getElementById('research-list');
  list.innerHTML = '';
  const sci = Math.floor(G.res.sci);
  for (const r of G.researches) {
    const div = document.createElement('div');
    div.className = 'research-item' + (r.done?' done':'') + (G.activeResearch===r.id?' active':'');
    const canAfford = sci >= r.cost;
    div.innerHTML = `
      <div class="research-name">${r.done?'✅':''} ${r.name}</div>
      <div class="research-desc">${r.desc}</div>
      <div class="research-cost">🔬 ${r.cost} очков науки ${r.done?'(завершено)':canAfford?'(доступно)':'(недостаточно)'}</div>
      ${!r.done ? `<button class="btn-small" ${G.activeResearch===r.id?'disabled':''} data-rid="${r.id}">${G.activeResearch===r.id?'⏳ Исследуется...':'▶ Исследовать'}</button>` : ''}
    `;
    list.appendChild(div);
  }

  list.querySelectorAll('.btn-small[data-rid]').forEach(btn => {
    btn.addEventListener('click', () => {
      const r = G.researches.find(r=>r.id===btn.dataset.rid);
      if (!r || r.done) return;
      if (G.res.sci >= r.cost) {
        G.res.sci -= r.cost;
        r.done = true;
        G.activeResearch = null;
        addLog(`🔬 Исследовано: ${r.name}`, 'good');
        renderResearch();
      } else {
        G.activeResearch = r.id;
        addLog(`🔬 Начато исследование: ${r.name}`, '');
        renderResearch();
      }
    });
  });

  // Stats
  const goal = scenarioGoalStatus();
  const herdRows = herdDetailRows();
  const herdPanelHtml = `
    <div style="margin-top:6px;display:grid;gap:4px;padding:5px;border:1px solid #2d2a22;background:#151412;border-radius:3px">
      ${herdRows.map(r => `
        <div><span style="color:#7a6a4a">${r.label}:</span> <b style="color:#aaa">${r.value}</b></div>
      `).join('')}
    </div>
  `;
  const roomRows = roomDetailRows();
  const roomPanelHtml = roomRows.length ? `
    <div style="margin-top:6px;display:grid;gap:5px">
      ${roomRows.map(r => `
        <div style="padding:5px;border:1px solid #2d2a22;background:#151412;border-radius:3px">
          <div style="color:#e8c97e;font-weight:bold">#${r.id} ${r.title}</div>
          <div>уют: <b style="color:#aaa">${r.comfort}</b></div>
          <div>стены: <b style="color:#aaa">${r.walls}</b></div>
          <div>размер: <b style="color:#aaa">${r.size}</b></div>
          <div>пол: <b style="color:#aaa">${r.floor}</b></div>
          <div>крыша: <b style="color:#aaa">${r.roof}</b></div>
          <div>мебель: <b style="color:#aaa">${r.furniture}</b></div>
        </div>
      `).join('')}
    </div>
  ` : `<div style="margin-top:6px;color:#777">Комнат пока нет: замкни зону забором/воротами и поставь мебель внутри.</div>`;
  const stats = document.createElement('div');
  stats.style.cssText = 'margin-top:10px;padding:6px;background:#1a1a1a;border-radius:3px;font-size:10px;color:#666';
  stats.innerHTML = `
    <div class="section-title">Статистика</div>
    <div>📅 Прожито дней: <b style="color:#aaa">${G.stats.days}</b></div>
    <div>💀 Убито бандитов: <b style="color:#aaa">${G.stats.kills}</b></div>
    <div>🍖 Еды собрано: <b style="color:#aaa">${G.stats.foodHarvested}</b></div>
    <div>🪵 Деревьев срублено: <b style="color:#aaa">${G.stats.treesChopped}</b></div>
    <div>💰 Золота заработано: <b style="color:#aaa">${Math.floor(G.stats.goldEarned)}</b></div>
    <div>🐎 Караванных сделок: <b style="color:#aaa">${Math.floor(G.stats.caravanDeals || 0)}</b></div>
    <div>🐴 Лошади: <b style="color:#aaa">${ensureHerd().tamed} приручено / ${ensureHerd().wild} диких</b></div>
    ${herdPanelHtml}
    <div>🏠 Комфорт усадьбы: <b style="color:#aaa">${homesteadComfortLabel()} (${homesteadComfortScore()}/3)</b></div>
    <div>🧱 Комнаты: <b style="color:#aaa">${roomComfortLabel()} (${roomComfortScore()}/3)</b> · ${roomTypeSummary()}</div>
    ${roomPanelHtml}
    <div>🎯 В очереди работ: <b style="color:#aaa">${markedSummaryText()}</b></div>
    <div style="margin-top:4px;color:#7a6a4a">🏆 ${SCENARIOS[G.scenario]?.name || SCENARIOS.settlers.name}: ${goal.sidebar}</div>
  `;
  list.appendChild(stats);
}

function renderLog() {
  const html = G.log.slice(0,50).map(e=>
    `<div class="log-entry ${e.type}"><span class="log-time">${e.time}</span> ${e.msg}</div>`
  ).join('');
  ['event-log', 'mobile-event-log'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  });
}

function setupMobileDrawer() {
  const drawer = document.getElementById('mobile-drawer');
  const toggle = document.getElementById('mobile-drawer-toggle');
  if (!drawer || !toggle) return;

  toggle.addEventListener('click', () => {
    drawer.classList.toggle('open');
  });

  document.querySelectorAll('.mobile-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      drawer.classList.add('open');
      document.querySelectorAll('.mobile-tab-btn').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.mobile-tab-content').forEach(c=>c.classList.remove('active'));
      btn.classList.add('active');
      const panel = document.getElementById('mobile-tab-'+btn.dataset.mobileTab);
      if (panel) panel.classList.add('active');
    });
  });
}

function showPriorityPanel(p) {
  const panel = document.getElementById('priority-panel');
  document.getElementById('priority-title').textContent = `Приоритеты: ${p.name}`;
  const rows = document.getElementById('priority-rows');
  rows.innerHTML = '';
  WORK_TYPES.forEach((w,i) => {
    const row = document.createElement('div');
    row.className = 'priority-row';
    const sel = document.createElement('select');
    sel.className = 'priority-select';
    [['❌ Выкл',0],['1 (высший)',1],['2',2],['3',3],['4 (низкий)',4]].forEach(([lbl,val]) => {
      const opt = document.createElement('option');
      opt.value = val; opt.textContent = lbl;
      if (p.priorities[i]===val) opt.selected=true;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', () => { p.priorities[i] = parseInt(sel.value); });
    row.innerHTML = `<div class="priority-label">${WORK_ICONS[i]} ${w}</div>`;
    row.appendChild(sel);
    rows.appendChild(row);
  });
  panel.style.display = 'block';
}

// ==================== INPUT ====================
let isDragging = false, dragStart = null, dragCamStart = null;

// Convert mouse event -> world tile coords (accounts for canvas offset & zoom)
function eventToTile(e) {
  const r = canvas.getBoundingClientRect();
  const z = G.camera.zoom;
  const sx = e.clientX - r.left, sy = e.clientY - r.top;
  const mx = sx/z + G.camera.x;
  const my = sy/z + G.camera.y;
  return { tx: Math.floor(mx/TILE), ty: Math.floor(my/TILE), wx: mx, wy: my, sx, sy };
}

let paintMode = null;       // 'build' | 'demolish' while dragging in build/demolish mode
let paintLast = null;       // last painted tile key

canvas.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  const {tx, ty} = eventToTile(e);
  // In build/demolish mode, left-drag PAINTS tiles (e.g. a row of fences)
  if (G.buildMode) {
    paintMode = 'build'; paintLast = tx+'_'+ty;
    placeBuild(tx, ty);
    return;
  }
  if (G.demolishMode) {
    paintMode = 'demolish'; paintLast = tx+'_'+ty;
    demolishAt(tx, ty);
    return;
  }
  isDragging = false;
  dragStart = {x:e.clientX, y:e.clientY};
  dragCamStart = {...G.camera};
});

canvas.addEventListener('mousemove', (e) => {
  const {tx, ty, sx, sy} = eventToTile(e);

  // Painting a line of buildings / demolitions
  if (paintMode) {
    const key = tx+'_'+ty;
    if (key !== paintLast) {
      paintLast = key;
      if (paintMode === 'build') placeBuild(tx, ty);
      else demolishAt(tx, ty);
    }
    hoverTile = {tx, ty};
    return;
  }

  if (dragStart) {
    const dx = e.clientX - dragStart.x, dy = e.clientY - dragStart.y;
    if (Math.hypot(dx,dy) > 5) {
      isDragging = true;
      G.camera.x = dragCamStart.x - dx/G.camera.zoom;
      G.camera.y = dragCamStart.y - dy/G.camera.zoom;
    }
  }

  hoverTile = {tx, ty};
  showTooltip(e, tx, ty);
});

window.addEventListener('mouseup', (e) => {
  if (paintMode) { paintMode = null; paintLast = null; return; }
  if (isDragging) { isDragging = false; dragStart = null; return; }
  if (e.target !== canvas) { dragStart = null; return; }
  dragStart = null;

  const {tx, ty, sx, sy} = eventToTile(e);
  if (e.button === 0) handleLeftClick(tx, ty, sx, sy);
  if (e.button === 2) handleRightClick(tx, ty);
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// ---------- TOUCH (mobile) ----------
let touchState = null;
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  Sfx.init(); Sfx.resume();
  if (e.touches.length === 1) {
    const t = e.touches[0];
    touchState = { mode:'pan', startX:t.clientX, startY:t.clientY, camX:G.camera.x, camY:G.camera.y, moved:0, t0:Date.now() };
  } else if (e.touches.length === 2) {
    const [a,b] = e.touches;
    touchState = { mode:'pinch', dist:Math.hypot(a.clientX-b.clientX, a.clientY-b.clientY),
      cx:(a.clientX+b.clientX)/2, cy:(a.clientY+b.clientY)/2 };
  }
}, {passive:false});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (!touchState) return;
  if (touchState.mode==='pan' && e.touches.length===1) {
    const t = e.touches[0];
    const dx = t.clientX - touchState.startX, dy = t.clientY - touchState.startY;
    touchState.moved = Math.max(touchState.moved, Math.hypot(dx,dy));
    G.camera.x = touchState.camX - dx/G.camera.zoom;
    G.camera.y = touchState.camY - dy/G.camera.zoom;
  } else if (touchState.mode==='pinch' && e.touches.length===2) {
    const [a,b] = e.touches;
    const nd = Math.hypot(a.clientX-b.clientX, a.clientY-b.clientY);
    const cx = (a.clientX+b.clientX)/2, cy = (a.clientY+b.clientY)/2;
    zoomAt(cx, cy, nd/touchState.dist);
    touchState.dist = nd;
  }
}, {passive:false});

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  if (touchState && touchState.mode==='pan' && touchState.moved < 10 && (Date.now()-touchState.t0) < 300) {
    // tap = left click
    const { tx, ty, sx, sy } = eventToTile({ clientX: touchState.startX, clientY: touchState.startY });
    handleLeftClick(tx, ty, sx, sy);
  }
  touchState = null;
}, {passive:false});

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.12 : 1/1.12);
}, {passive:false});

// Zoom keeping the world point under (clientX,clientY) fixed
function zoomAt(clientX, clientY, factor) {
  const r = canvas.getBoundingClientRect();
  const sx = clientX - r.left, sy = clientY - r.top;
  const cam = G.camera;
  const worldX = sx/cam.zoom + cam.x;
  const worldY = sy/cam.zoom + cam.y;
  cam.zoom = clamp(cam.zoom * factor, 0.4, 2.8);
  cam.x = worldX - sx/cam.zoom;
  cam.y = worldY - sy/cam.zoom;
}

function handleLeftClick(tx, ty, cx, cy) {
  if (!G || G.gameOver) return;
  if (tx<0||ty<0||tx>=MAP_W||ty>=MAP_H) return;

  if (G.demolishMode) { demolishAt(tx, ty); return; }
  if (G.buildMode) { placeBuild(tx, ty); return; }

  // Click on tile obj
  const tile = G.map[ty][tx];
  if (tile.obj) {
    tile.obj.marked = !tile.obj.marked;
    return;
  }

  // Click on animal
  const animal = G.animals.find(a=>a.alive && Math.abs(Math.floor(a.x/TILE)-tx)<2 && Math.abs(Math.floor(a.y/TILE)-ty)<2);
  if (animal) { animal.marked = !animal.marked; return; }

  const poi = poiAt(tx, ty);
  if (poi) {
    explorePoi(poi);
    showPoiInfo(poi, cx, cy);
    return;
  }

  // Click on pawn
  const pawn = G.pawns.find(p=>p.alive && Math.abs(Math.floor(p.x/TILE)-tx)<2 && Math.abs(Math.floor(p.y/TILE)-ty)<2);
  if (pawn) {
    G.selectedPawnId = G.selectedPawnId===pawn.id ? null : pawn.id;
    if (G.selectedPawnId) showPriorityPanel(pawn);
    else document.getElementById('priority-panel').style.display='none';
    return;
  }

  // Click on building
  const bld = G.buildings.find(b=>tx>=b.tx && ty>=b.ty && tx<b.tx+BUILDS[b.type].size && ty<b.ty+BUILDS[b.type].size);
  if (bld) {
    showBuildingInfo(bld, cx, cy);
    return;
  }

  // Move selected pawn
  if (G.selectedPawnId) {
    const p = G.pawns.find(p=>p.id===G.selectedPawnId);
    if (p) { setTarget(p, tx, ty); p.state='idle'; }
  }
}

function handleRightClick(tx, ty) {
  if (G.buildMode || G.demolishMode) {
    G.buildMode = null;
    G.demolishMode = false;
    updateBuildButtons();
    return;
  }
  // Attack enemy — assign as persistent manual target
  const e = G.enemies.find(e=>e.alive && Math.abs(Math.floor(e.x/TILE)-tx)<2 && Math.abs(Math.floor(e.y/TILE)-ty)<2);
  if (e && G.selectedPawnId) {
    const p = G.pawns.find(p=>p.id===G.selectedPawnId);
    if (p) { p.manualTarget = e.id; p.state='fighting'; addLog(`🔫 ${p.name} атакует бандита!`, ''); }
  }
}

function demolishAt(tx, ty) {
  const b = G.buildings.find(b=> tx>=b.tx && ty>=b.ty && tx<b.tx+BUILDS[b.type].size && ty<b.ty+BUILDS[b.type].size);
  if (!b) {
    // нет здания — может, тут пол или чертёж пола
    if (G.floorBlueprints && G.floorBlueprints.length) {
      const fi = G.floorBlueprints.findIndex(f=>f.tx===tx && f.ty===ty);
      if (fi>=0) { G.floorBlueprints.splice(fi,1); return; }
    }
    const tile = G.map[ty] && G.map[ty][tx];
    if (tile && tile.floor) { tile.floor = null; return; }
    if (eraseZoneAt(tx, ty)) return;   // снять клетку зоны
    return;
  }
  G.buildings = G.buildings.filter(x=>x!==b);
  const def = BUILDS[b.type];
  if (def.cost.wood) G.res.wood += Math.floor(def.cost.wood/2);
  addLog(`🔥 Снесено: ${def.name}`, 'warn');
  Diag.action(`Снёс ${def.name} @${b.tx},${b.ty}`);
}

function buildingSize(type) {
  return (BUILDS[type] && BUILDS[type].size) || 1;
}

function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function canPlaceBuilding(type, tx, ty, buildings = G.buildings, ignore = null) {
  const size = buildingSize(type);
  if (!BUILDS[type] || tx < 0 || ty < 0 || tx + size > MAP_W || ty + size > MAP_H) return false;
  for (let dy=0; dy<size; dy++) {
    for (let dx=0; dx<size; dx++) {
      if (G.map[ty+dy][tx+dx].type === TERRAIN.WATER) return false;
      if (poiAt(tx+dx, ty+dy)) return false;
    }
  }
  for (const b of buildings) {
    if (!b || b === ignore || !BUILDS[b.type]) continue;
    const bSize = buildingSize(b.type);
    if (rectsOverlap(tx, ty, size, size, b.tx, b.ty, bSize, bSize)) return false;
  }
  return true;
}

function findBuildableSpot(type, fromTx, fromTy, buildings = G.buildings) {
  for (let r=0; r<16; r++) {
    for (let dy=-r; dy<=r; dy++) {
      for (let dx=-r; dx<=r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const tx = fromTx + dx, ty = fromTy + dy;
        if (canPlaceBuilding(type, tx, ty, buildings)) return {tx, ty};
      }
    }
  }
  for (let ty=0; ty<MAP_H; ty++) {
    for (let tx=0; tx<MAP_W; tx++) {
      if (canPlaceBuilding(type, tx, ty, buildings)) return {tx, ty};
    }
  }
  return null;
}

function sanitizeBuildings(buildings) {
  const clean = [];
  for (const raw of buildings || []) {
    if (!raw || !BUILDS[raw.type]) continue;
    const b = {...raw};
    const spot = canPlaceBuilding(b.type, b.tx, b.ty, clean)
      ? {tx:b.tx, ty:b.ty}
      : findBuildableSpot(b.type, b.tx || 0, b.ty || 0, clean);
    if (!spot) continue;
    b.tx = spot.tx;
    b.ty = spot.ty;
    b.blueprint = !!b.blueprint;
    b.done = !!b.done || !b.blueprint;
    if (b.blueprint && b.materialsPaid === undefined) b.materialsPaid = true;
    if (!b.blueprint || b.materialsPaid) {
      b.materialsDeliveryReserved = false;
      b.deliveryStatus = '';
    }
    if (b.done && (!b.hp || !b.maxHp)) {
      b.hp = getBuildingMaxHp(b.type);
      b.maxHp = b.hp;
    }
    clean.push(b);
  }
  return clean;
}

function placeFloor(tx, ty, def) {
  const quiet = paintMode === 'build';
  if (tx<0 || ty<0 || tx>=MAP_W || ty>=MAP_H) return;
  const tile = G.map[ty][tx];
  if (tile.type===TERRAIN.WATER || tile.type===TERRAIN.ROCK) {
    if (!quiet) addLog('❌ Здесь нельзя стелить пол', 'warn'); return;
  }
  if (tile.floor === def.floor) return; // уже такой пол
  if (!G.floorBlueprints) G.floorBlueprints = [];
  if (G.floorBlueprints.some(f=>f.tx===tx && f.ty===ty)) return; // уже размечено
  for (const [res, amt] of Object.entries(def.cost)) {
    if ((G.res[res]||0) < amt) { if(!quiet) addLog(`❌ Недостаточно ресурсов для пола`, 'warn'); return; }
  }
  for (const [res, amt] of Object.entries(def.cost)) G.res[res] -= amt;
  G.floorBlueprints.push({ tx, ty, mat:def.floor, progress:0 });
  if (!quiet) addLog(`📐 Размечен ${def.name.toLowerCase()}`, '');
}

// ──────────── ЗОНЫ И ТЕРРИТОРИИ (Phase 2.5, RimWorld-style) ────────────
const ZONE_DEFS = {
  grow:      { name:'Грядка',     fill:'rgba(90,170,70,0.22)',  border:'rgba(124,192,90,0.6)' },
  stockpile: { name:'Склад-зона', fill:'rgba(200,165,80,0.20)', border:'rgba(202,164,90,0.6)' },
  allowed:   { name:'Разрешённая',fill:'rgba(90,140,210,0.16)', border:'rgba(120,170,235,0.55)' },
};
// Разрешено ли пешке находиться на клетке: если задана зона «Разрешённая» — только в ней.
function isAllowedTile(tx, ty) {
  const z = G.zones && G.zones.find(z => z.type === 'allowed');
  if (!z || !z.cells.length) return true;
  return z.cells.includes(tx + ',' + ty);
}
function ensureZones() { if (!Array.isArray(G.zones)) G.zones = []; return G.zones; }
function zoneAt(tx, ty) {
  if (!G.zones) return null;
  const key = tx + ',' + ty;
  for (const z of G.zones) if (z.cells.includes(key)) return z.type;
  return null;
}
function zoneCellCount(type) { const z = G.zones && G.zones.find(z => z.type === type); return z ? z.cells.length : 0; }
function paintZone(type, tx, ty) {
  if (!ZONE_DEFS[type] || tx<0 || ty<0 || tx>=MAP_W || ty>=MAP_H) return;
  const tile = G.map[ty][tx];
  if (tile.type === TERRAIN.WATER || tile.type === TERRAIN.ROCK) return; // не на воде/скале
  if (G.buildings.find(b => b.tx===tx && b.ty===ty && !b.blueprint)) return; // не поверх здания
  ensureZones();
  const key = tx + ',' + ty;
  for (const z of G.zones) { const i = z.cells.indexOf(key); if (i>=0) z.cells.splice(i,1); } // клетка — одна зона
  let z = G.zones.find(z => z.type === type);
  if (!z) { z = { id: G.nextId++, type, cells: [] }; G.zones.push(z); }
  z.cells.push(key);
}
function eraseZoneAt(tx, ty) {
  if (!G.zones) return false;
  const key = tx + ',' + ty; let removed = false;
  for (const z of G.zones) { const i = z.cells.indexOf(key); if (i>=0) { z.cells.splice(i,1); if (z.crops) delete z.crops[key]; removed = true; } }
  G.zones = G.zones.filter(z => z.cells.length > 0);
  return removed;
}

function placeBuild(tx, ty) {
  if (typeof G.buildMode === 'string' && G.buildMode.startsWith('zone_')) { paintZone(G.buildMode.slice(5), tx, ty); return; }
  const def = BUILDS[G.buildMode];
  if (!def) return;
  if (def.floor) { placeFloor(tx, ty, def); return; }
  const quiet = paintMode === 'build'; // во время рисования не спамим лог
  // Check overlap / terrain
  if (!canPlaceBuilding(G.buildMode, tx, ty)) {
    if (!quiet && tx>=0 && ty>=0 && tx<MAP_W && ty<MAP_H && G.map[ty][tx].type===TERRAIN.WATER) {
      addLog('❌ Нельзя строить на воде!', 'warn');
    }
    return;
  }
  G.buildings.push({
    type: G.buildMode, tx, ty,
    blueprint: true, done: false, progress: 0,
    hp: 0, maxHp: 0, selected: false,
    materialsPaid: false, waitingMissing: missingResourcesText(def.cost),
  });
  if (!quiet) addLog(`📐 Заложена ${def.name}; материалы принесут строители`, '');
  Diag.action(`Заложил ${def.name} @${tx},${ty}`);
}

function showBuildingInfo(b, cx, cy) {
  const overlay = document.getElementById('info-overlay');
  const def = BUILDS[b.type];
  const recipeLines = recipeStatusLines(b).map(line => `<div class="inf-line">${line}</div>`).join('');
  const recipeControls = recipeControlHtml(b);
  const stockpileLines = stockpileInfoHtml(b);
  const caravanTrade = caravanTradeHtml(b);
  const furnitureInfo = furnitureInfoHtml(b);
  overlay.style.display = 'block';
  overlay.style.left = Math.min(cx, canvas.width-280) + 'px';
  overlay.style.top = (cy + 10) + 'px';
  overlay.innerHTML = `
    <div class="inf-title">${def.icon} ${def.name}</div>
    ${b.blueprint ? `<div class="inf-line">🔨 Строится: ${Math.round((b.progress||0)*100)}%</div>` : ''}
    ${blueprintMaterialInfoHtml(b)}
    ${b.done ? `<div class="inf-line">HP: <b>${Math.floor(b.hp||0)}/${b.maxHp||0}</b></div>` : ''}
    ${def.prod ? `<div class="inf-line">Производит: <b>${def.prod}</b></div>` : ''}
    ${recipeLines}
    ${recipeControls}
    ${stockpileLines}
    ${caravanTrade}
    ${furnitureInfo}
  `;
  bindRecipeControlButtons(b);
  bindStockpileFilterButtons(b);
  bindCaravanTradeButtons(b);
  setTimeout(() => { overlay.style.display='none'; }, 3000);
}

function blueprintMaterialInfoHtml(b) {
  if (!b || !b.blueprint) return '';
  const def = BUILDS[b.type];
  if (!def) return '';
  if (b.materialsPaid) return `<div class="inf-line">📦 Материалы: <b style="color:#9cc06a">готовы</b></div>`;
  if (b.materialsDeliveryReserved) return `<div class="inf-line">📦 Материалы: <b style="color:#75aee8">в пути</b></div>`;
  const missing = updateBlueprintWaiting(b);
  if (missing) return `<div class="inf-line">📦 Ждёт материалы: <b style="color:#e8c97e">${missing}</b></div>`;
  return `<div class="inf-line">📦 Материалы: <b>строитель принесёт перед работой</b></div>`;
}

function furnitureInfoHtml(b) {
  if (!b || b.blueprint || !b.done) return '';
  const roomLine = ['bed','table','decor'].includes(b.type)
    ? `<div class="inf-line">Комната: <b>${roomTypeLabelAt(b.tx, b.ty)}</b></div>`
    : '';
  if (b.type === 'bed') return `<div class="inf-line">Комфорт: <b>сон быстрее, настроение выше</b></div>${roomLine}`;
  if (b.type === 'table') return `<div class="inf-line">Комфорт: <b>еда за столом даёт настроение</b></div>${roomLine}`;
  if (b.type === 'decor') return `<div class="inf-line">Красота: <b>рядом настроение растёт</b></div>${roomLine}`;
  if (b.type === 'stable') {
    const herd = ensureHerd();
    const rate = horseTamingRate();
    return `<div class="inf-line">Лошади: <b>${herd.tamed} приручено, ${herd.wild} диких</b> · приручение ${rate ? herd.tameProgress + '/100' : 'нужна конюшня'}</div>`;
  }
  if (b.type === 'ranch') {
    const herd = ensureHerd();
    const y = ranchDailyYield();
    return `<div class="inf-line">Ранчо: <b>${y.food || 0} еды / ${y.gold || 0} золота в день</b> · лошадей ${herd.tamed}</div>`;
  }
  return '';
}

function caravanTradeHtml(b) {
  if (!b || b.type !== 'tradepost' || !b.done || b.blueprint) return '';
  const gold = Math.floor(G.res.gold || 0);
  const buttons = Object.entries(CARAVAN_PROFILES).map(([id, profile]) => {
    const canBuy = gold >= profile.cost;
    const out = caravanOutputText(profile.out);
    const lack = canBuy ? '' : ` · не хватает ${profile.cost - gold}💰`;
    return `<button class="filter-chip ${canBuy?'on':'off'}" data-caravan-profile="${id}"`
      + ` style="display:block;width:100%;text-align:left;margin:2px 0;${canBuy?'':'opacity:.55;cursor:not-allowed'}"`
      + ` title="${profile.name}: отдать ${profile.cost}💰, получить ${out}">`
      + `<b>${profile.name}</b> <span style="float:right">${profile.cost}💰${lack}</span>`
      + `<br><span style="color:#9cc06a">${out}</span></button>`;
  }).join('');
  const last = G._lastCaravan
    ? `<div class="inf-line" style="color:#7ca84e">✓ Последняя сделка: ${G._lastCaravan}</div>`
    : '';
  const routeNote = (G.scenario === 'caravan')
    ? `<div class="inf-line" style="color:#9cc06a;font-size:10px">🐎 Караванный путь: +20% к выдаче сделок</div>`
    : '';
  return `<div class="inf-line">🐎 Караванные сделки (золото: ${gold}💰):</div>${routeNote}`
    + `<div class="inf-line" style="color:#888;font-size:10px">Выбери сделку — золото в обмен на припасы</div>`
    + `<div class="filter-row" style="flex-direction:column">${buttons}</div>${last}`;
}

function bindCaravanTradeButtons(b) {
  if (!b || b.type !== 'tradepost') return;
  const overlay = document.getElementById('info-overlay');
  overlay.querySelectorAll('.filter-chip[data-caravan-profile]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      runCaravanTrade(btn.dataset.caravanProfile);
      updateUI();
      showBuildingInfo(b, parseInt(overlay.style.left,10)||0, Math.max(0, (parseInt(overlay.style.top,10)||0)-10));
    });
  });
}

function recipeControlHtml(b) {
  if (!b || !RECIPES[b.type]) return '';
  const on = b.craftEnabled !== false;
  const recipe = RECIPES[b.type];
  const step = Math.max(recipe.outAmount, 5);
  const limit = b.craftLimit || 0;
  return `<div class="filter-row">
    <button class="filter-chip ${on?'on':'off'}" data-recipe-toggle="1">${on?'✓ Вкл':'× Выкл'}</button>
    <button class="filter-chip" data-limit-delta="${-step}">− лимит</button>
    <button class="filter-chip" data-limit-delta="${step}">+ лимит</button>
    <button class="filter-chip" data-limit-preset="${recipe.outAmount}">x1</button>
    <button class="filter-chip" data-limit-preset="${recipe.outAmount*3}">x3</button>
    <button class="filter-chip" data-limit-preset="${recipe.outAmount*5}">x5</button>
    <button class="filter-chip ${limit===0?'on':''}" data-limit-clear="1">∞</button>
  </div>`;
}

function bindRecipeControlButtons(b) {
  if (!b || !RECIPES[b.type]) return;
  const overlay = document.getElementById('info-overlay');
  const btn = overlay.querySelector('.filter-chip[data-recipe-toggle]');
  if (!btn) return;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    b.craftEnabled = b.craftEnabled === false;
    showBuildingInfo(b, parseInt(overlay.style.left,10)||0, Math.max(0, (parseInt(overlay.style.top,10)||0)-10));
  });
  overlay.querySelectorAll('.filter-chip[data-limit-delta]').forEach(limitBtn => {
    limitBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      normalizeRecipeStation(b);
      const delta = parseInt(limitBtn.dataset.limitDelta, 10) || 0;
      b.craftLimit = Math.max(0, (b.craftLimit || 0) + delta);
      showBuildingInfo(b, parseInt(overlay.style.left,10)||0, Math.max(0, (parseInt(overlay.style.top,10)||0)-10));
    });
  });
  overlay.querySelectorAll('.filter-chip[data-limit-preset]').forEach(presetBtn => {
    presetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      b.craftLimit = Math.max(0, parseInt(presetBtn.dataset.limitPreset, 10) || 0);
      showBuildingInfo(b, parseInt(overlay.style.left,10)||0, Math.max(0, (parseInt(overlay.style.top,10)||0)-10));
    });
  });
  const clearBtn = overlay.querySelector('.filter-chip[data-limit-clear]');
  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      b.craftLimit = 0;
      showBuildingInfo(b, parseInt(overlay.style.left,10)||0, Math.max(0, (parseInt(overlay.style.top,10)||0)-10));
    });
  }
}

function stockpileInfoHtml(b) {
  if (!b || b.type !== 'stockpile') return '';
  const filters = normalizeStockpileFilters(b);
  const buttons = STORABLE_RES.map(res => {
    const on = filters[res] !== false;
    return `<button class="filter-chip ${on?'on':'off'}" data-res="${res}">${on?'✓':'×'} ${res}</button>`;
  }).join('');
  const logistics = stockpileLogisticsLines().map(line => `<div class="inf-line">${line}</div>`).join('');
  return `<div class="inf-line">Фильтры склада:</div><div class="filter-row">${buttons}</div>${logistics}`;
}

function itemStacksByRes(items) {
  const byRes = {};
  for (const it of items || []) {
    if (!it || it.amount <= 0) continue;
    byRes[it.res] = (byRes[it.res] || 0) + it.amount;
  }
  return byRes;
}

function formatResBreakdown(byRes) {
  const entries = Object.entries(byRes).filter(([,amount]) => amount > 0);
  if (!entries.length) return 'нет';
  return entries.map(([res, amount]) => `${res}:${Math.floor(amount)}`).join(', ');
}

function stockpileLogisticsLines() {
  const ground = itemStacksByRes(G.items || []);
  const blocked = itemStacksByRes((G.items || []).filter(it=>it.amount>0 && !hasStockpileForRes(it.res)));
  return [
    `На земле: <b>${formatResBreakdown(ground)}</b>`,
    `Без склада: <b>${formatResBreakdown(blocked)}</b>`,
  ];
}

function bindStockpileFilterButtons(b) {
  if (!b || b.type !== 'stockpile') return;
  const overlay = document.getElementById('info-overlay');
  overlay.querySelectorAll('.filter-chip[data-res]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const res = btn.dataset.res;
      const filters = normalizeStockpileFilters(b);
      filters[res] = !filters[res];
      showBuildingInfo(b, parseInt(overlay.style.left,10)||0, Math.max(0, (parseInt(overlay.style.top,10)||0)-10));
    });
  });
}

function showTooltip(e, tx, ty) {
  const tooltip = document.getElementById('tooltip');
  if (tx<0||ty<0||tx>=MAP_W||ty>=MAP_H) { tooltip.style.display='none'; return; }

  const tile = G.map[ty][tx];
  let text = TNAMES[tile.type];
  if (tile.obj) text += ` • ${tile.obj.type==='tree'?'Дерево':tile.obj.type==='rock'?'Камень':'?'} (HP ${tile.obj.hp}/${tile.obj.maxHp})`;

  const poi = poiAt(tx, ty);
  if (poi) text += ` • ${poiDef(poi.type).name}`;

  const bld = G.buildings.find(b=>tx>=b.tx && ty>=b.ty && tx<b.tx+BUILDS[b.type].size && ty<b.ty+BUILDS[b.type].size);
  if (bld) text = `${BUILDS[bld.type].name} ${bld.blueprint?'(стройка)':''}`;

  tooltip.textContent = text;
  tooltip.style.display = 'block';
  tooltip.style.left = (e.clientX+12)+'px';
  tooltip.style.top = (e.clientY-4)+'px';
}

canvas.addEventListener('mouseleave', () => {
  document.getElementById('tooltip').style.display='none';
  document.getElementById('info-overlay').style.display='none';
  hoverTile = null;
});

// ==================== BUTTONS ====================
function setupButtons() {
  setupMobileDrawer();

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-'+btn.dataset.tab).classList.add('active');
      if (btn.dataset.tab==='research') renderResearch();
      if (btn.dataset.tab==='schedule') renderSchedule();
    });
  });

  // Build buttons
  const buildMap = {
    'build-farm-btn':'farm','build-kitchen-btn':'kitchen','build-mine-btn':'mine','build-stockpile-btn':'stockpile','build-fence-btn':'fence','build-wall-btn':'wall','build-wallstone-btn':'wall_stone','build-gate-btn':'gate',
    'build-tower-btn':'tower','build-barrel-btn':'barrel','build-sandbag-btn':'sandbag','build-saloon-btn':'saloon','build-tradepost-btn':'tradepost','build-stable-btn':'stable','build-ranch-btn':'ranch','build-lab-btn':'lab',
    'build-clinic-btn':'clinic','build-smithy-btn':'smithy',
    'build-camp-btn':'camp','build-bed-btn':'bed','build-table-btn':'table','build-decor-btn':'decor','build-well-btn':'well',
    'build-floorwood-btn':'floor_wood','build-floorstone-btn':'floor_stone',
    'build-zonegrow-btn':'zone_grow','build-zonestock-btn':'zone_stockpile','build-zoneallowed-btn':'zone_allowed',
  };
  for (const [id, type] of Object.entries(buildMap)) {
    document.getElementById(id).addEventListener('click', () => {
      G.buildMode = G.buildMode===type ? null : type;
      G.demolishMode = false;
      updateBuildButtons();
      // НЕ закрываем категорию после выбора: в боковом «Архитекторе» это мешало
      // (папка схлопывалась при каждом выборе). updateBuildButtons держит активную открытой.
    });
  }

  document.querySelectorAll('.build-group').forEach(group => {
    group.addEventListener('toggle', () => {
      if (group.open) {
        document.querySelectorAll('.build-group').forEach(other => {
          if (other !== group) other.open = false;
        });
      }
      updateBottomUiMetrics();
    });
  });

  document.getElementById('demolish-btn').addEventListener('click', () => {
    G.demolishMode = !G.demolishMode;
    G.buildMode = null;
    document.querySelectorAll('.build-group').forEach(group => { group.open = false; });
    updateBuildButtons();
  });

  document.getElementById('cancel-btn').addEventListener('click', () => {
    G.buildMode = null; G.demolishMode = false; updateBuildButtons();
    document.querySelectorAll('.build-group').forEach(group => { group.open = false; });
    G.selectedPawnId = null;
    document.getElementById('priority-panel').style.display='none';
  });

  document.getElementById('diag-btn').addEventListener('click', () => { Diag.action('Скачал лог диагностики'); Diag.download(); });

  document.getElementById('save-btn').addEventListener('click', () => { Diag.action('Сохранение'); saveGame(); });
  document.getElementById('load-btn').addEventListener('click', () => { Diag.action('Загрузка'); loadGame(); });

  document.getElementById('speed-btn').addEventListener('click', () => {
    G.speed = G.speed===0?1:G.speed===1?2:G.speed===2?4:0;
    document.getElementById('speed-btn').textContent = G.speed===0 ? '⏸ Пауза' : `▶ x${G.speed}`;
  });

  // Sound toggle
  document.getElementById('sound-btn').addEventListener('click', () => {
    Sfx.on = !Sfx.on;
    if (Sfx.on) { Sfx.init(); Sfx.resume(); Sfx.click(); }
    else { Sfx._stopAmbient(); Sfx._stopMusic(); Sfx.ambient.profile = null; Sfx.music.profile = null; } // глушим фон
    document.getElementById('sound-btn').textContent = Sfx.on ? '🔊' : '🔇';
    Diag.action('Звук ' + (Sfx.on?'ВКЛ':'ВЫКЛ'));
  });
  // Init audio on first user gesture anywhere
  const initAudioOnce = () => { Sfx.init(); Sfx.resume(); window.removeEventListener('pointerdown', initAudioOnce); };
  window.addEventListener('pointerdown', initAudioOnce);

  // Fullscreen
  document.getElementById('fullscreen-btn').addEventListener('click', () => {
    if (!document.fullscreenElement) {
      (document.documentElement.requestFullscreen||noopFS).call(document.documentElement);
    } else {
      (document.exitFullscreen||noopFS).call(document);
    }
  });
  document.addEventListener('fullscreenchange', () => {
    document.getElementById('fullscreen-btn').textContent = document.fullscreenElement ? '⛶ Выйти' : '⛶ Экран';
    setTimeout(resizeCanvas, 100);
  });

  // Zoom buttons (zoom toward screen center)
  const cz = (f) => {
    const r = canvas.getBoundingClientRect();
    zoomAt(r.left + canvas.width/2, r.top + canvas.height/2, f);
  };
  document.getElementById('zoom-in').addEventListener('click', () => cz(1.25));
  document.getElementById('zoom-out').addEventListener('click', () => cz(1/1.25));
  document.getElementById('zoom-reset').addEventListener('click', () => { G.camera.zoom = 1.0; });

  document.getElementById('autobattle-btn').addEventListener('click', () => {
    G.autoBattle = !G.autoBattle;
    Diag.action('Авт.Бой ' + (G.autoBattle?'ВКЛ':'ВЫКЛ'));
    const btn = document.getElementById('autobattle-btn');
    btn.textContent = G.autoBattle ? '⚔️ Авт.Бой ВКЛ' : '⚔️ Авт.Бой';
    btn.classList.toggle('active', G.autoBattle);
  });

  document.getElementById('priority-close').addEventListener('click', () => {
    document.getElementById('priority-panel').style.display='none';
  });

  document.getElementById('end-restart').addEventListener('click', () => {
    document.getElementById('end-overlay').style.display='none';
    newGame();
  });

  // ---- Main menu ----
  setupMainMenu();

  // Help popup: show once per browser
  const helpClose = document.getElementById('help-close');
  helpClose.addEventListener('click', () => {
    document.getElementById('help-popup').style.display='none';
    localStorage.setItem('frontier_helpseen','1');
  });
  if (localStorage.getItem('frontier_helpseen')) {
    document.getElementById('help-popup').style.display='none';
  }
}

// ==================== MAIN MENU ====================
function setupMainMenu() {
  const menu = document.getElementById('main-menu');
  const panel = document.getElementById('menu-panel-content');
  const resumeBtn = document.getElementById('mm-resume');

  const openMenu = () => { menu.style.display='flex'; G._pausedByMenu = G.speed; G.speed = 0; };
  const closeMenu = () => { menu.style.display='none'; if (G._pausedByMenu) { G.speed = G._pausedByMenu; document.getElementById('speed-btn').textContent = `▶ x${G.speed}`; } };

  document.getElementById('menu-btn').addEventListener('click', () => {
    resumeBtn.style.display='block';
    openMenu();
    showRoadmapPanel(panel);
  });

  document.getElementById('mm-new').addEventListener('click', () => {
    newGame(); menu.style.display='none';
    G.speed = 1; document.getElementById('speed-btn').textContent = '▶ x1';
    document.getElementById('end-overlay').style.display='none';
  });
  document.getElementById('mm-scenarios').addEventListener('click', () => showScenarioPanel(panel, menu));
  document.getElementById('mm-continue').addEventListener('click', () => {
    loadGame(); menu.style.display='none';
    G.speed = 1; document.getElementById('speed-btn').textContent = '▶ x1';
  });
  document.getElementById('mm-diag').addEventListener('click', () => { Diag.action('Скачал лог из меню'); Diag.download(); });
  document.getElementById('mm-howto').addEventListener('click', () => showHowtoPanel(panel));
  document.getElementById('mm-achv').addEventListener('click', () => showAchievementsPanel(panel));
  document.getElementById('mm-roadmap').addEventListener('click', () => showRoadmapPanel(panel));
  resumeBtn.addEventListener('click', closeMenu);

  // Show roadmap by default on first load
  showRoadmapPanel(panel);
}

function showScenarioPanel(panel, menu) {
  panel.innerHTML = `
    <h2>Сценарии старта</h2>
    <p>Выбери стартовый профиль. Все сценарии используют тот же мир и те же правила, но меняют первые ресурсы, здания и риск.</p>
    <div style="display:grid;gap:10px;margin-top:12px">
      ${Object.entries(SCENARIOS).map(([id, s]) => `
        <button class="menu-btn-big scenario-start" data-scenario="${id}" style="text-align:left">
          <b>${s.name}</b><br><span style="font-size:11px;color:#888">${s.desc}</span>
        </button>
      `).join('')}
    </div>
  `;
  panel.querySelectorAll('.scenario-start').forEach(btn => {
    btn.addEventListener('click', () => {
      newGame(btn.dataset.scenario || 'settlers');
      menu.style.display = 'none';
      G.speed = 1;
      document.getElementById('speed-btn').textContent = '▶ x1';
      document.getElementById('end-overlay').style.display='none';
    });
  });
}

function rmRow(status, title, desc) {
  const tag = status === 'done' ? '<span class="rm-tag tag-done">ГОТОВО</span>'
            : status === 'now'  ? '<span class="rm-tag tag-now">СЕЙЧАС</span>'
            :                      '<span class="rm-tag tag-soon">СКОРО</span>';
  const cls = status === 'done' ? 'rm-done' : status === 'now' ? 'rm-now' : 'rm-soon';
  return `<div class="rm-row">${tag} <b class="${cls}">${title}</b>`
       + `<div style="color:#888;font-size:11px;margin-top:2px">${desc}</div></div>`;
}

function showRoadmapPanel(panel) {
  const monthRows = [
    ['done','Фундамент — ГОТОВО','Работы/расписание/нужды, склады+носильщики, производство, A*, стены/ворота, сценарии, караваны, бой, детерминизм (seed).'],
    ['done','Стройка как colony sim — ГОТОВО','Полы/стены кистью, Architect-панель, подвоз материалов к чертежу, комнаты/крыша/уют.'],
    ['done', 'PHASE 1 — Playable Core','Готово: замедленное время, фазы суток, ночные эффекты, базовый огонь и движение по местности.'],
    ['done','PHASE 2 — Colony Management','Основа готова: навыки, личность, вес/переноска, зоны и логистика. Осталось здоровье по частям тела.'],
    ['now','PHASE 3 — World Simulation','Сейчас: биомы, ресурсы по биому, реки/озёра, дороги, погода-движение, Frontier-точки интереса, POI-события и каркас плавания. Дальше: вода как препятствие и экосистема.'],
    ['soon','PHASE 4 — Wild West','Шериф, бандиты, охотники за головами, прииски, салун-события, железная дорога, фракции — идентичность Frontier.'],
    ['soon','PHASE 5 — Multiplayer','Кооп и облако поверх детерминизма (перенесено сюда: сначала глубина колонии).'],
    ['soon','PHASE 6–7 — Steam EA / Mobile','Туториал, локализация, Steam-обёртка; мобайл — последней фазой, без ущерба PC.'],
  ];
  const versionRows = [
    ['done','v1.0–1.2','Фундамент + графика + играбельность: карта, ИИ пешек, расписание, постройки, наука, рисованные спрайты, день/ночь, цель и туториал.'],
    ['done','v1.3–1.5','Бой и удобство: автобой, огнестрел с укрытиями, типы врагов, миникарта, зум, полный экран.'],
    ['done','v1.6–1.7','Жизнь колонии и полировка: характеры, отношения, болезни, звук, достижения, тач-управление.'],
    ['done','v1.8–1.12','Оборона и производство: A*-пасфайндинг, стены+ворота, склад/носильщики, рецепты (кузня, кухня).'],
    ['done','v1.13–1.20','Логистика и торговля: фильтры складов, диагностика, лимиты крафта, торговый пост, караваны.'],
    ['done','v1.21–1.27','Сценарии старта и UI: Поселенцы/Золотая лихорадка/Форт/Караван, цели, мобильный layout, полировка сделок.'],
    ['done','v1.28–1.31','Глубина сценариев: волны форта с наградой, налётчики Gold Rush, бонус Caravan Route, фикс выбора пешки.'],
    ['done','v1.32–1.35','Аудит + UX: фикс версии и прокрутки меню, понятный роадмап, координация с Codex, боевая глубина (без сознания/спасение), конюшня (лошади ускоряют ковбоев).'],
    ['done', 'v1.36–1.54','Публичный сайт, мобильная карта, мебель/комфорт усадьбы, ранчо, табун, группы стройки, room-бонусы и эмбиент-звук, прогрессия жилья, музыка настроений, анимация работ, подсветка помеченных ресурсов, счётчик задач, новый враг «Снайпер», бочка с порохом, враг «Поджигатель», навыки работы, исследование «Меткость».'],
    ['now', 'v1.55–2.04','Ремонт, комнаты/крыши, детерминизм, Phase 1–2, зоны, биомы, ресурсы по биомам, реки/озёра, дороги, погода влияет на движение, Frontier-точки интереса, POI-события и плавание-каркас.'],
  ];
  panel.innerHTML = `
    <h2>🗺️ Роадмап разработки</h2>
    <div style="background:#1a1610;border:1px solid #3a3320;border-radius:6px;padding:8px 10px;margin-bottom:12px">
      <b style="color:#e8c97e">🚩 Стадия: PRE-ALPHA · сборка ${GAME_VERSION}</b>
      <div style="color:#999;font-size:11px;margin-top:3px">Ядро и контент Недели 1 готовы. Идёт Неделя 2. Цель месяца — ALPHA (онлайн + кооп). Полная документация: папка <b>docs/</b>.</div>
    </div>
    <h3 style="margin-top:0">📅 Месячный план</h3>
    ${monthRows.map(([st,title,desc]) => rmRow(st, title, desc)).join('')}
    <h3>🧱 Что уже сделано (по версиям)</h3>
    <p style="font-size:11px;color:#888">Каждая сборка сохранена отдельным файлом в папке <b>versions/</b> — можно играть в любую.</p>
    ${versionRows.map(([st,title,desc]) => rmRow(st, title, desc)).join('')}
    <h3>🔜 Что дальше (Неделя 2)</h3>
    <ul>
      <li>🏠 Комнаты и стены жилья: спальня/столовая, room-бонусы, понятная оценка помещения</li>
      <li>🐴 Животноводство: загоны, скот, ресурсы животных и animal-панель</li>
      <li>🔊 Аудио-пасс: эмбиент (ветер/сверчки), музыка настроений</li>
      <li>🎨 Визуал-пасс 2: анимации работ пешек, автотайлинг террейна, полировка интерфейса</li>
    </ul>
  `;
}
function showAchievementsPanel(panel) {
  const got = G.achievements || {};
  const total = ACHIEVEMENTS.length;
  const done = ACHIEVEMENTS.filter(a=>got[a.id]).length;
  panel.innerHTML = `
    <h2>🏅 Достижения</h2>
    <p>Открыто ${done} из ${total}.</p>
    ${ACHIEVEMENTS.map(a=>{
      const ok = got[a.id];
      return `<div class="rm-row" style="display:flex;gap:10px;align-items:center;${ok?'':'opacity:.45'}">
        <span style="font-size:22px">${ok?a.icon:'🔒'}</span>
        <div><b style="color:${ok?'#e8c97e':'#888'}">${a.name}</b>
        <div style="font-size:11px;color:#888">${a.desc}</div></div>
      </div>`;
    }).join('')}
  `;
}

function showHowtoPanel(panel) {
  panel.innerHTML = `
    <h2>❓ Как играть</h2>
    <p>Ты командуешь отрядом <b>не напрямую</b>, как в RimWorld — задаёшь приоритеты, а ковбои сами всё делают.</p>
    <h3>Основы</h3>
    <ul>
      <li>🌲 <b>Клик по дереву/камню</b> → пешка придёт и добудет ресурс.</li>
      <li>🏗️ <b>Выбери постройку слева в «Архитекторе»</b> → кликни на карту. Зелёная зона = можно ставить.</li>
      <li>👥 <b>Клик по ковбою</b> → панель приоритетов работ (1 = главное, ❌ = не делать).</li>
      <li>📅 Вкладка «Расп.» → расписание сна / работы / отдыха по часам.</li>
    </ul>
    <h3>Бой</h3>
    <ul>
      <li>⚔️ Кнопка <b>«Авт.Бой»</b> вверху → ковбои сами стреляют по бандитам.</li>
      <li>🔫 Или выбери ковбоя и <b>правый клик по врагу</b> — будет преследовать.</li>
    </ul>
    <h3>Камера</h3>
    <ul>
      <li>🖱️ Тащи мышь = двигать карту. Колесо = тоже двигать.</li>
      <li>⌨️ WASD / стрелки = камера. F = ферма, M = шахта, Esc = сброс.</li>
    </ul>
    <h3>Цель</h3>
    <p><b>Текущая цель показана сверху по центру.</b> Она зависит от выбранного сценария: золото, оборона форта или караванные сделки. Не дай ковбоям умереть с голоду!</p>
  `;
}

function updateBuildButtons() {
  const buildMap = {
    'build-farm-btn':'farm','build-kitchen-btn':'kitchen','build-mine-btn':'mine','build-stockpile-btn':'stockpile','build-fence-btn':'fence','build-wall-btn':'wall','build-wallstone-btn':'wall_stone','build-gate-btn':'gate',
    'build-tower-btn':'tower','build-barrel-btn':'barrel','build-sandbag-btn':'sandbag','build-saloon-btn':'saloon','build-tradepost-btn':'tradepost','build-stable-btn':'stable','build-ranch-btn':'ranch','build-lab-btn':'lab',
    'build-clinic-btn':'clinic','build-smithy-btn':'smithy',
    'build-camp-btn':'camp','build-bed-btn':'bed','build-table-btn':'table','build-decor-btn':'decor','build-well-btn':'well',
    'build-floorwood-btn':'floor_wood','build-floorstone-btn':'floor_stone',
    'build-zonegrow-btn':'zone_grow','build-zonestock-btn':'zone_stockpile','build-zoneallowed-btn':'zone_allowed',
  };
  for (const [id, type] of Object.entries(buildMap)) {
    const btn = document.getElementById(id);
    btn.classList.toggle('active', G.buildMode===type);
  }
  document.getElementById('demolish-btn').classList.toggle('active', G.demolishMode);
  document.querySelectorAll('.build-group').forEach(group => {
    const active = !!group.querySelector('.action-btn.active');
    group.classList.toggle('active', active);
    if (active) group.open = true;
  });
  canvas.style.cursor = (G.buildMode || G.demolishMode) ? 'cell' : 'default';
  updateBottomUiMetrics();
}

function updateBottomUiMetrics() {
  const wrap = document.getElementById('canvas-wrap');
  const bar = document.getElementById('bottombar');
  if (!wrap || !bar) return;
  const value = Math.ceil(bar.getBoundingClientRect().height) + 'px';
  if (wrap.style && typeof wrap.style.setProperty === 'function') wrap.style.setProperty('--bottom-ui-height', value);
  else if (wrap.style) wrap.style['--bottom-ui-height'] = value;
}

// Keyboard
document.addEventListener('keydown', (e) => {
  if (!G) return;
  switch(e.key) {
    case 'Escape': G.buildMode=null; G.demolishMode=false; G.selectedPawnId=null;
      document.getElementById('priority-panel').style.display='none';
      updateBuildButtons(); break;
    case 'f': case 'F': G.buildMode='farm'; G.demolishMode=false; updateBuildButtons(); break;
    case 'm': case 'M': G.buildMode='mine'; G.demolishMode=false; updateBuildButtons(); break;
    case 'b': case 'B': G.buildMode='fence'; G.demolishMode=false; updateBuildButtons(); break;
    case ' ': G.autoBattle=!G.autoBattle; break;
    case 's': if (e.ctrlKey) { e.preventDefault(); saveGame(); } break;
  }
  // Camera WASD
  const spd = 20;
  if (e.key==='ArrowLeft'||e.key==='a') G.camera.x -= spd;
  if (e.key==='ArrowRight'||e.key==='d') G.camera.x += spd;
  if (e.key==='ArrowUp'||e.key==='w') G.camera.y -= spd;
  if (e.key==='ArrowDown'||e.key==='s'&&!e.ctrlKey) G.camera.y += spd;
});

// ==================== SAVE/LOAD ====================
function saveGame() {
  try {
    const save = {
      v: 2, // save format version
      res:G.res, day:G.day, hour:G.hour, minute:G.minute,
      season:G.season, dayOfYear:G.dayOfYear, weather:G.weather,
      nextId:G.nextId,
      seed:G.seed,
      fires:G.fires || [],
      zones:G.zones || [],
      pois:G.pois || [],
      scenario:G.scenario || 'settlers',
      camera:{x:G.camera.x, y:G.camera.y, zoom:G.camera.zoom},
      // compact map: plain number for empty tile, [type, objCode, hp, marked] for tiles with tree/rock
      map: G.map.map(row=>row.map(t=>
        t.obj ? [t.type, t.obj.type==='tree'?1:2, Math.round(t.obj.hp), t.obj.marked?1:0] : t.type
      )),
      floors: G.map.map(row=>row.map(t=> t.floor==='wood'?1:(t.floor==='stone'?2:(t.floor==='road'?3:0)) )),
      floorBlueprints: G.floorBlueprints || [],
      animals: G.animals.filter(a=>a.alive).map(a=>({type:a.type,x:a.x,y:a.y,hp:a.hp,maxHp:a.maxHp,speed:a.speed,meat:a.meat})),
      herd: G.herd,
      items: G.items || [],
      pawns:G.pawns.map(p=>({...p, thoughts:[]})),
      buildings:G.buildings,
      researches:G.researches,
      stats:G.stats,
      achievements:G.achievements,
    };
    localStorage.setItem('frontier_save', JSON.stringify(save));
    addLog('💾 Игра сохранена', 'good');
  } catch(ex) { addLog('❌ Ошибка сохранения', 'danger'); }
}

function loadGame() {
  try {
    const data = localStorage.getItem('frontier_save');
    if (!data) { addLog('❌ Сохранение не найдено', 'warn'); return; }
    const save = JSON.parse(data);
    newGame();
    Object.assign(G.res, save.res);
    G.day=save.day; G.hour=save.hour; G.minute=save.minute;
    G.scenario=save.scenario||'settlers';
    G.season=save.season||0; G.dayOfYear=save.dayOfYear||0;
    G.weather=save.weather||'clear';
    if (save.nextId) G.nextId = save.nextId;
    if (save.seed != null) seedRng(save.seed);
    G.fires = Array.isArray(save.fires) ? save.fires : [];
    G.zones = Array.isArray(save.zones) ? save.zones : [];
    G.pois = Array.isArray(save.pois) ? save.pois : [];
    if (save.herd) G.herd = save.herd;
    if (save.camera) G.camera = { x:save.camera.x, y:save.camera.y, zoom:save.camera.zoom||1 };

    // Restore terrain map (critical: without this a new map is generated → buildings on water)
    if (save.map) {
      G.map = save.map.map(row=>row.map(c=>{
        if (Array.isArray(c)) {
          const [type, oc, hp, marked] = c;
          const otype = oc===1 ? 'tree' : 'rock';
          return { type, v:0, obj:{ type:otype, hp, maxHp: otype==='tree'?40:60, marked:!!marked } };
        }
        return { type:c, v:0, obj:null };
      }));
      if (save.floors) {
        for (let y=0; y<G.map.length; y++) for (let x=0; x<G.map[y].length; x++) {
          const f = save.floors[y] && save.floors[y][x];
          if (f) G.map[y][x].floor = f===1 ? 'wood' : f===2 ? 'stone' : 'road';
        }
      }
      _miniDirty = true;
    }
    G.floorBlueprints = Array.isArray(save.floorBlueprints) ? save.floorBlueprints : [];
    if (save.animals) {
      G.animals = save.animals.map(a=>({
        id:G.nextId++, type:a.type, x:a.x, y:a.y, tx:Math.floor(a.x/TILE), ty:Math.floor(a.y/TILE),
        hp:a.hp, maxHp:a.maxHp, speed:a.speed, meat:a.meat, marked:false,
        wanderTimer:randInt(60,200), fleeTimer:0, path:[], targetX:0, targetY:0, alive:true,
      }));
    }
    G.items = (save.items || []).map(it=>({id:it.id||G.nextId++, res:it.res, amount:it.amount, tx:it.tx, ty:it.ty}))
      .filter(it=>it.res && it.amount>0 && it.tx>=0 && it.ty>=0 && it.tx<MAP_W && it.ty<MAP_H);

    G.pawns=save.pawns.map(p=>({
      traits:[], opinions:{}, sick:null, workMul:1, socialTimer:200,
      ...p, thoughts:[], path:[]
    }));
    G.buildings=sanitizeBuildings(save.buildings);
    G.researches=save.researches;
    G.stats=save.stats||G.stats;
    G.achievements=save.achievements||{};
    normalizeGameState('load');
    addLog('📂 Игра загружена' + (save.map?'':' (старый формат — карта новая)'), 'good');
    Diag.action('Загрузка ' + (save.map?'(с картой v'+(save.v||1)+')':'(старый формат без карты)'));
  } catch(ex) { addLog('❌ Ошибка загрузки', 'danger'); }
}

// ==================== UTILS ====================
function noopFS(){}
// ── Seeded PRNG (фундамент детерминизма для онлайна) ──
// mulberry32: компактный детерминированный генератор. Пока опционален: если
// _rng не засеян, rng() ведёт себя как rng() — нулевое изменение поведения.
function mulberry32(a) {
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function seedRng(seed) { _rng = mulberry32((seed >>> 0) || 1); if (typeof G !== 'undefined' && G) G.seed = (seed >>> 0); return _rng; }
function clearRng() { _rng = null; }
function rng() { return _rng ? _rng() : Math.random(); }
function rngInt(min, max) { return Math.floor(rng() * (max - min + 1)) + min; }
function randInt(min, max) { return Math.floor(rng()*(max-min+1))+min; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function blendColor(hex1, hex2, t) {
  const parse = h => [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
  const [r1,g1,b1]=parse(hex1), [r2,g2,b2]=parse(hex2);
  const r=Math.round(r1+(r2-r1)*t), g=Math.round(g1+(g2-g1)*t), b=Math.round(b1+(b2-b1)*t);
  return `rgb(${r},${g},${b})`;
}

// ==================== MAIN LOOP ====================
let lastTime = 0;
function gameLoop(ts) {
  try {
    const dt = ts - lastTime;
    if (dt < 16) return; // cap at 60fps
    lastTime = ts;

    if (!G || G.gameOver) { render(); return; }

    G.tick++;

    const steps = G.speed;
    for (let s=0; s<steps; s++) {
      updateTime();
      updateWeather();
      updatePawns();
      updateAnimals();
      updateEnemies();
      updateBarrels();
      updateFires();
      updateCrops();
      updateProjectiles();
      updateParticles();

      // Events (no raids in the first day — let the player settle)
      G.eventTimer--;
      if (G.eventTimer <= 0) {
        triggerEvent(G.day < 2);
        G.eventTimer = scenarioEventDelay();
      }
    }

    // Fade blood
    G.bloodSplats.forEach(s => s.opacity -= 0.0005);
    G.bloodSplats = G.bloodSplats.filter(s=>s.opacity>0);

    normalizeGameState('loop');
    render();

    // UI update (less frequent)
    if (G.tick % 6 === 0) updateUI();

    // Diagnostics scan + achievements
    if (G.tick % 120 === 0) { Diag.check(); checkAchievements(); }
  } catch (err) {
    safeDiagRuntime('game_loop', err && err.message ? err.message : String(err), err && err.stack);
  }
}

// ==================== SOUND (procedural WebAudio) ====================
const Sfx = {
  ctx: null, on: true, master: null,
  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext||window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.25;
      this.master.connect(this.ctx.destination);
    } catch(e) { this.on = false; }
  },
  resume() { if (this.ctx && this.ctx.state==='suspended') this.ctx.resume(); },
  beep(freq, dur, type='sine', vol=1, sweep=0) {
    if (!this.on || !this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (sweep) o.frequency.exponentialRampToValueAtTime(Math.max(40,freq+sweep), t+dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t+dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t+dur);
  },
  noise(dur, vol=1) {
    if (!this.on || !this.ctx) return;
    const t = this.ctx.currentTime;
    const n = Math.floor(this.ctx.sampleRate*dur);
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i=0;i<n;i++) d[i] = (rng()*2-1) * (1-i/n);
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const g = this.ctx.createGain(); g.gain.value = vol;
    src.connect(g); g.connect(this.master); src.start(t);
  },
  // ---- ambient loop (ветер/сверчки/дождь/метель) ----
  ambient: { profile: null, src: null, gain: null, filter: null },
  setAmbient(profile) {
    if (this.ambient.profile === profile && (this.ambient.src || !this.ctx)) { this.ambient.profile = profile; return; }
    this.ambient.profile = profile;
    if (!this.on || !this.ctx) return;       // в Node/без звука — только запоминаем профиль
    this._stopAmbient();
    this._startAmbient(profile);
  },
  _stopAmbient() {
    try { if (this.ambient.src) { this.ambient.src.stop(); this.ambient.src.disconnect(); } } catch(e) {}
    this.ambient.src = null;
  },
  _startAmbient(profile) {
    if (!this.ctx) return;
    try {
      const ctx = this.ctx;
      const len = Math.floor(ctx.sampleRate * 2);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = rng() * 2 - 1;
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const filter = ctx.createBiquadFilter(); filter.type = 'lowpass';
      const g = ctx.createGain();
      const cfg = ({
        day:      { freq: 600,  gain: 0.05 },   // лёгкий ветер днём
        night:    { freq: 1800, gain: 0.03 },   // тихий шелест/сверчки
        rain:     { freq: 3500, gain: 0.10 },   // дождь
        blizzard: { freq: 900,  gain: 0.09 },   // вой метели
      })[profile] || { freq: 700, gain: 0.04 };
      filter.frequency.value = cfg.freq;
      g.gain.value = cfg.gain;
      src.connect(filter); filter.connect(g); g.connect(this.master);
      src.start();
      this.ambient.src = src; this.ambient.gain = g; this.ambient.filter = filter;
    } catch(e) {}
  },
  // ---- music (тихий пад: спокойно/ночь/бой) ----
  music: { profile: null, oscs: null, gain: null },
  setMusic(profile) {
    if (this.music.profile === profile && (this.music.oscs || !this.ctx)) { this.music.profile = profile; return; }
    this.music.profile = profile;
    if (!this.on || !this.ctx) return;
    this._stopMusic();
    this._startMusic(profile);
  },
  _stopMusic() {
    try { if (this.music.oscs) this.music.oscs.forEach(o => { try { o.stop(); o.disconnect(); } catch(e){} }); } catch(e) {}
    this.music.oscs = null;
  },
  _startMusic(profile) {
    if (!this.ctx) return;
    try {
      const ctx = this.ctx;
      const chords = {
        calm:   { notes: [261.63, 329.63, 392.00], gain: 0.025, type: 'sine' },     // C-dur, спокойно
        night:  { notes: [196.00, 233.08, 293.66], gain: 0.018, type: 'sine' },     // тихий тёмный аккорд
        combat: { notes: [196.00, 277.18, 311.13], gain: 0.035, type: 'triangle' }, // напряжённый
      };
      const cfg = chords[profile] || chords.calm;
      const g = ctx.createGain(); g.gain.value = cfg.gain;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
      g.connect(lp); lp.connect(this.master);
      const oscs = [];
      for (const f of cfg.notes) {
        const o = ctx.createOscillator(); o.type = cfg.type;
        o.frequency.value = f * (0.999 + rng()*0.002); // лёгкая расстройка для «живости»
        o.connect(g); o.start();
        oscs.push(o);
      }
      this.music.oscs = oscs; this.music.gain = g;
    } catch(e) {}
  },
  // game sounds
  shot()  { this.beep(220, 0.08, 'square', 0.5, -160); this.noise(0.06, 0.4); },
  chop()  { this.beep(160, 0.06, 'triangle', 0.5, -40); },
  build() { this.beep(440, 0.1, 'sine', 0.5); setTimeout(()=>this.beep(660,0.12,'sine',0.5),90); },
  coin()  { this.beep(880, 0.05, 'square', 0.3); setTimeout(()=>this.beep(1180,0.06,'square',0.3),50); },
  alarm() { this.beep(330,0.18,'sawtooth',0.5); setTimeout(()=>this.beep(247,0.22,'sawtooth',0.5),180); },
  click() { this.beep(600, 0.03, 'square', 0.25); },
  win()   { [523,659,784,1046].forEach((f,i)=>setTimeout(()=>this.beep(f,0.2,'sine',0.5),i*140)); },
  lose()  { [392,330,262,196].forEach((f,i)=>setTimeout(()=>this.beep(f,0.25,'triangle',0.5),i*160)); },
};

// ==================== ACHIEVEMENTS ====================
const ACHIEVEMENTS = [
  { id:'first_build', name:'Первый дом',      desc:'Построй первое здание',        icon:'🏠' },
  { id:'first_kill',  name:'Шериф',           desc:'Убей первого бандита',         icon:'🤠' },
  { id:'boss_down',   name:'Гроза прерий',    desc:'Убей Главаря банды',           icon:'💀' },
  { id:'wood100',     name:'Лесопилка',       desc:'Накопи 100 дерева',            icon:'🪵' },
  { id:'gold250',     name:'Богач',           desc:'Накопи 250 золота',            icon:'💰' },
  { id:'pop8',        name:'Городок',         desc:'8 ковбоев в отряде',           icon:'👥' },
  { id:'survive10',   name:'Старожил',        desc:'Доживи до 10-го дня',          icon:'📅' },
  { id:'research3',   name:'Учёный',          desc:'Исследуй 3 технологии',        icon:'🔬' },
  { id:'win',         name:'Король Запада',   desc:'Выполни цель выбранного сценария — победа!',   icon:'🏆' },
];
function unlock(id) {
  if (!G.achievements) G.achievements = {};
  if (G.achievements[id]) return;
  G.achievements[id] = true;
  const a = ACHIEVEMENTS.find(x=>x.id===id);
  if (!a) return;
  Sfx.coin();
  showToast(`${a.icon} Достижение: ${a.name}`, a.desc);
  addLog(`🏅 Достижение получено: ${a.name}`, 'good');
  Diag.action('Достижение: '+a.name);
}
function checkAchievements() {
  if (!G) return;
  if (G.buildings.some(b=>b.done)) unlock('first_build');
  if (G.stats.kills >= 1) unlock('first_kill');
  if (G.res.wood >= 100) unlock('wood100');
  if (G.res.gold >= 250) unlock('gold250');
  if (G.pawns.filter(p=>p.alive).length >= 8) unlock('pop8');
  if (G.day >= 10) unlock('survive10');
  if (G.researches.filter(r=>r.done).length >= 3) unlock('research3');
}
function showToast(title, sub) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.innerHTML = `<div class="toast-title">${title}</div><div class="toast-sub">${sub||''}</div>`;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(()=>el.classList.remove('show'), 3500);
}

// ==================== DIAGNOSTICS / LOGGING ====================
const Diag = {
  actions: [],     // что делал игрок
  anomalies: [],   // пойманные аномалии
  seen: {},        // дедуп аномалий по ключу
  _bpStuck: 0,
  stamp() {
    return `D${G.day} ${String(Math.floor(G.hour)).padStart(2,'0')}:${String(Math.floor(G.minute)).padStart(2,'0')} (t${G.tick})`;
  },
  action(msg) {
    this.actions.push({ t: this.stamp(), tick: G.tick, msg });
    if (this.actions.length > 3000) this.actions.shift();
  },
  anomaly(key, msg) {
    const last = this.seen[key] ?? -1e9;
    if (G.tick - last < 600) return;          // не спамить: раз в 600 тиков на ключ
    this.seen[key] = G.tick;
    const rec = { t: this.stamp(), tick: G.tick, key, msg };
    this.anomalies.push(rec);
    if (this.anomalies.length > 600) this.anomalies.shift();
    try { console.warn('[ANOMALY]', rec.t, msg); } catch(e){}
    if (typeof addLog === 'function') addLog('⚠️ ' + msg, 'danger');
    updateAnomalyBadge();
  },
  check() {
    if (!G || G.gameOver) return;
    // 1) Шкалы пешек в пределах
    for (const p of G.pawns) {
      if (!p.alive) continue;
      const checks = [['энергия',p.energy,p.maxEnergy],['еда',p.food,p.maxFood],['настр',p.mood,p.maxMood],['HP',p.hp,p.maxHp]];
      for (const [n,v,mx] of checks) {
        if (typeof v !== 'number' || isNaN(v)) this.anomaly('nan_'+n, `${p.name}: ${n}=NaN`);
        else if (v > mx + 1) this.anomaly('over_'+n, `${p.name}: ${n} ${Math.floor(v)} > макс ${mx}`);
        else if (v < -1) this.anomaly('under_'+n, `${p.name}: ${n} ${Math.floor(v)} < 0`);
      }
    }
    // 2) Ресурсы вменяемы
    for (const k in G.res) {
      const v = G.res[k];
      if (isNaN(v)) this.anomaly('res_nan_'+k, `Ресурс ${k}=NaN`);
      else if (v < -1) this.anomaly('res_neg_'+k, `Ресурс ${k} отрицательный (${Math.floor(v)})`);
    }
    // 3) Скучивание: слишком много пешек на одном рабочем месте
    const counts = {};
    for (const p of G.pawns) if (p.alive && p._wt) counts[p._wt] = (counts[p._wt]||0)+1;
    for (const k in counts) if (counts[k] > 3) this.anomaly('clump_'+k, `${counts[k]} пешек толпятся на одном месте (${k})`);
    // 4) Чертежи стоят без движения = никто не строит
    const bps = G.buildings.filter(b=>b.blueprint);
    if (bps.length) {
      const anyProg = bps.some(b => (b.progress||0) > (b._lastProg||0) + 0.0001);
      bps.forEach(b => b._lastProg = b.progress||0);
      this._bpStuck = anyProg ? 0 : this._bpStuck + 1;
      if (this._bpStuck > 25) {
        const waiting = bps.filter(b => b.blueprint && !b.materialsPaid).map(updateBlueprintWaiting).filter(Boolean);
        const reason = waiting.length
          ? `не хватает материалов: ${Array.from(new Set(waiting)).slice(0,3).join('; ')}`
          : 'нет свободных строителей?';
        this.anomaly('bp_stuck', `${bps.length} чертёж(ей) не строятся — ${reason}`);
      }
    } else this._bpStuck = 0;

    // 5) Watchdog добычи: помеченные объекты есть, а ресурс не растёт
    let markedRocks = 0, markedTrees = 0;
    for (let y=0; y<MAP_H; y++) for (let x=0; x<MAP_W; x++) {
      const o = G.map[y][x].obj;
      if (o && o.marked) { if (o.type==='rock') markedRocks++; else markedTrees++; }
    }
    this._harvestWatch('rock', markedRocks, G.res.ore,  2, 'камни',  'добыча');
    this._harvestWatch('tree', markedTrees, G.res.wood, 0, 'деревья','рубка');

    // 6) Простой: много живых пешек висят без дела
    const alive = G.pawns.filter(p=>p.alive);
    const idle = alive.filter(p=>p.state==='idle').length;
    const jobsExist = markedRocks+markedTrees>0 || bps.length>0 || G.buildings.some(b=>b.done&&(b.type==='farm'||b.type==='mine'));
    if (alive.length>=3 && idle/alive.length > 0.6 && jobsExist) {
      this._idleStall = (this._idleStall||0)+1;
      if (this._idleStall > 8) this.anomaly('idle_stall', `${idle}/${alive.length} пешек простаивают, хотя есть работа`);
    } else this._idleStall = 0;

    // 7) Logistics watchdog: ground stacks that no stockpile accepts will never be hauled.
    const blockedItems = (G.items || []).filter(it=>it.amount>0 && !hasStockpileForRes(it.res));
    if (blockedItems.length) {
      const byRes = {};
      for (const it of blockedItems) byRes[it.res] = (byRes[it.res] || 0) + it.amount;
      const details = Object.entries(byRes).map(([res, amount]) => `${res}:${Math.floor(amount)}`).join(', ');
      this.anomaly('haul_blocked_'+Object.keys(byRes).sort().join('_'), `Ресурсы на земле некуда везти: ${details}`);
    }
  },
  _harvestWatch(key, markedCount, currentRes, workIdx, label, workName) {
    if (!this._watch) this._watch = {};
    const w = this._watch[key] || (this._watch[key] = { last: currentRes, lastMarked: markedCount, stall: 0 });
    if (markedCount > 0) {
      const someoneCan = G.pawns.some(p => p.alive && p.priorities[workIdx] > 0);
      const resRising = currentRes > w.last + 0.5;
      const markedDropping = markedCount < w.lastMarked;       // объект добыли — прогресс есть
      if (resRising || markedDropping) w.stall = 0; else w.stall++;
      w.last = currentRes; w.lastMarked = markedCount;
      if (w.stall >= 20) { // ~2400 тиков полного простоя добычи при наличии помеченных
        const why = someoneCan ? 'все пешки заняты другим (стройка?) или путь перекрыт' : `ни у кого не включена работа «${workName}»`;
        this.anomaly('harvest_'+key, `Помеченные ${label} (${markedCount} шт) не добываются ~${w.stall*120} тиков — ${why}`);
      }
    } else { w.stall = 0; w.last = currentRes; w.lastMarked = 0; }
  },
  download() {
    const data = {
      exportedAt: new Date().toISOString(),
      version: '1.6.1', day: G.day, tick: G.tick,
      stats: G.stats, res: G.res,
      pawns: G.pawns.map(p=>({name:p.name, alive:p.alive, hp:p.hp, energy:p.energy, food:p.food, mood:p.mood, traits:p.traits, sick:p.sick})),
      runtimeErrors: G.runtimeErrors || [],
      anomalies: this.anomalies,
      actions: this.actions.slice(-1500),
    };
    try {
      const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `frontier-log-day${G.day}.json`; a.click();
      URL.revokeObjectURL(url);
    } catch(e) { try{ console.log(JSON.stringify(data)); }catch(_){} }
  },
};
try {
  window.Diag = Diag;
  window.addEventListener('error', (e) => {
    safeDiagRuntime('window_error', e.message || 'window error', e.error && e.error.stack);
  });
  window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason || {};
    safeDiagRuntime('unhandled_rejection', reason.message || String(reason), reason.stack);
  });
} catch(e){}

function updateAnomalyBadge() {
  const b = document.getElementById('diag-btn');
  if (!b) return;
  const n = Diag.anomalies.length;
  b.textContent = n ? `🐞 ${n}` : '🐞';
  b.style.color = n ? '#e05050' : '';
  b.style.borderColor = n ? '#5a2222' : '';
}

// ==================== START ====================
setupButtons();
newGame();
normalizeGameState('boot');
updateUI();
render();
// Pause under the opening menu until the player picks an option
G.speed = 0;
document.getElementById('speed-btn').textContent = '⏸ Пауза';

function startLoop() {
  const frame = (ts) => {
    gameLoop(ts);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame((ts) => {
    resizeCanvas();
    normalizeGameState('first_frame');
    updateUI();
    render();
    frame(ts);
  });
}
startLoop();
