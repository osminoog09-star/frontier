const vm = require('vm');
const fs = require('fs');

// ---- ENCODING + SYNC GUARD ----
// Ловит регрессию кодировки/синхронизации ДО игровых сценариев.
// Класс бага: PowerShell `Get-Content -Raw` читает UTF-8 как CP1251 и портит кириллицу,
// или frontier.html не пересобран из _core.js. Чинится через `node build.js`.
(function guardEncodingAndSync() {
  const MOJIBAKE = /вЂ|РєРёР|Р”Рё|С‚С€/;
  const core = fs.readFileSync(__dirname + '/_core.js', 'utf8');
  if (MOJIBAKE.test(core)) { console.error('GUARD FAIL: mojibake в _core.js — пересобери из чистого источника.'); process.exit(1); }
  if (fs.existsSync(__dirname + '/frontier.html')) {
    const html = fs.readFileSync(__dirname + '/frontier.html', 'utf8');
    if (MOJIBAKE.test(html)) { console.error('GUARD FAIL: mojibake в frontier.html — запусти `node build.js`.'); process.exit(1); }
    if (!html.includes('Дикий Запад')) { console.error('GUARD FAIL: нет «Дикий Запад» в frontier.html — кодировка повреждена.'); process.exit(1); }
    const s = html.indexOf('<script>') + 8, e = html.lastIndexOf('</script>');
    const inner = html.slice(s, e).trim();
    if (inner !== core.trim()) { console.error('GUARD FAIL: frontier.html не синхронизирован с _core.js — запусти `node build.js`.'); process.exit(1); }
    console.log('GUARD OK: кодировка чистая, frontier.html синхронизирован с _core.js.');
  }
})();

const noop = () => {};
function makeEl() {
  const base = {
    style:{}, classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},
    addEventListener:noop, appendChild:noop, setAttribute:noop,
    querySelectorAll:()=>[], getBoundingClientRect:()=>({left:0,top:0,width:1280,height:720}),
    getContext:()=>ctxStub, textContent:'', innerHTML:'',
  };
  return new Proxy(base, {
    set(){ return true; }, // ignore writes (e.g. canvas.width = ...)
    get(t,k){
      if (typeof k==='string' && /(width|height|clientWidth|clientHeight)/i.test(k)) return k.match(/height/i)?720:1280;
      if (k in t) return t[k];
      if (k==='value') return '0';
      if (k===Symbol.toPrimitive || k==='toString' || k==='valueOf') return ()=>0;
      return makeEl();
    }
  });
}
const ctxStub = new Proxy({}, { get(){ return () => ctxStub2; } });
const ctxStub2 = new Proxy({}, { get(){ return noop; } });
const elCache = {};
const sandbox = {
  console,
  Math, Date, JSON, Array, Object, parseInt, parseFloat, isNaN, setTimeout:noop, clearTimeout:noop,
  document: {
    getElementById:(id)=> elCache[id] || (elCache[id]=makeEl()),
    querySelectorAll:()=>[], createElement:()=>makeEl(), addEventListener:noop,
  },
  window: { addEventListener:noop },
  localStorage: (()=>{ const s={}; return { getItem:k=>k in s?s[k]:null, setItem:(k,v)=>{s[k]=String(v);}, removeItem:k=>{delete s[k];} }; })(),
  URL: { createObjectURL:()=>'', revokeObjectURL:noop },
  Blob: function(){ return {}; },
  requestAnimationFrame: noop,
  performance: { now:()=>Date.now() },
};
sandbox.globalThis = sandbox;

const core = fs.readFileSync('./_core.js','utf8');
const test = `
;(function(){
  // Scenario A: auto-battle vs one realistic raid of 4 (incl. boss)
  newGame();
  G.autoBattle = true;
  spawnEnemy(4);
  for (let i=0; i<6000 && !G.gameOver; i++) {
    G.tick++;
    updateTime(); updateWeather();
    updatePawns(); updateAnimals(); updateEnemies(); updateProjectiles();
    render();
    if (G.enemies.length===0) { console.log('  [A] raid cleared at tick', i); break; }
  }
  console.log('SCENARIO A (autobattle, raid of 4):');
  console.log('   enemies left:', G.enemies.length, '| kills:', G.stats.kills, '| pawns alive:', G.pawns.filter(p=>p.alive).length);

  // Scenario B: economy with farms/mines/blueprints + DIAGNOSTICS assertion
  newGame();
  const cx = Math.floor(80/2), cy = Math.floor(60/2);
  // helper: nearest non-water tile to (x,y)
  const land = (x,y)=>{ for(let r=0;r<10;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<80&&ny<60&&G.map[ny][nx].type!==3&&!G.buildings.find(b=>b.tx===nx&&b.ty===ny))return[nx,ny];}return [x,y]; };
  const mk = (type,x,y)=>{ const [tx,ty]=land(x,y); G.buildings.push({type,tx,ty,blueprint:false,done:true,hp:200,maxHp:200,selected:false,growth:0}); };
  mk('farm',cx-3,cy); mk('farm',cx+3,cy); mk('farm',cx,cy+3);
  mk('mine',cx-3,cy+3); mk('mine',cx+3,cy+3);
  // 2 blueprints to verify building happens
  G.buildings.push({type:'camp',tx:cx,ty:cy-3,blueprint:true,done:false,progress:0,hp:0,maxHp:0});
  G.buildings.push({type:'saloon',tx:cx+5,ty:cy-3,blueprint:true,done:false,progress:0,hp:0,maxHp:0});
  // mark a few trees for chopping
  let marked=0;
  for(let y=0;y<60&&marked<6;y++)for(let x=0;x<80&&marked<6;x++){const o=G.map[y][x].obj;if(o&&o.type==='tree'){o.marked=true;marked++;}}
  // give everyone building priority so blueprints get built
  G.pawns.forEach(p=>{ p.priorities[3]=2; });

  for (let i=0; i<20000 && !G.gameOver; i++) {
    G.tick++;
    updateTime(); updateWeather();
    updatePawns(); updateAnimals(); updateEnemies(); updateProjectiles();
    G.eventTimer--; if (G.eventTimer<=0){ triggerEvent(G.day<2); G.eventTimer=500; }
    render();
    if (G.tick % 120 === 0) Diag.check();
  }
  const built = G.buildings.filter(b=>b.done && (b.type==='camp'||b.type==='saloon')).length;
  console.log('SCENARIO B (20k ticks, farms+mines+blueprints):');
  console.log('   day:', G.day, '| pawns alive:', G.pawns.filter(p=>p.alive).length, '| gold:', Math.floor(G.res.gold), '| wood:', Math.floor(G.res.wood));
  console.log('   blueprints built:', built, '/ 2', built>=1?'(строительство работает ✅)':'(НИКТО НЕ СТРОИТ ❌)');
  // peak energy check
  const maxE = Math.max(...G.pawns.map(p=>p.energy));
  console.log('   peak energy:', maxE.toFixed(1), '(макс 100/130)', maxE<=131?'✅':'ПЕРЕПОЛНЕНИЕ ❌');
  console.log('DIAG anomalies:', Diag.anomalies.length);
  Diag.anomalies.slice(0,8).forEach(a=>console.log('   ⚠️', a.msg));

  // Scenario C: save/load round-trip — map and buildings must survive, no buildings on water
  const mapBefore = G.map.map(r=>r.map(t=>t.type)).flat().join('');
  const bCount = G.buildings.length;
  saveGame();
  // wipe & load
  loadGame();
  const mapAfter = G.map.map(r=>r.map(t=>t.type)).flat().join('');
  const sameMap = mapBefore === mapAfter;
  const onWater = G.buildings.filter(b=>{
    for(let dy=0;dy<__BSIZE(b.type);dy++)for(let dx=0;dx<__BSIZE(b.type);dx++){
      const x=b.tx+dx,y=b.ty+dy; if(G.map[y]&&G.map[y][x]&&G.map[y][x].type===3) return true;
    } return false;
  }).length;
  console.log('SCENARIO C (save/load round-trip):');
  console.log('   map identical:', sameMap?'✅':'❌', '| buildings:', G.buildings.length, '/ was', bCount, '| on water:', onWater, onWater===0?'✅':'❌');
  function __BSIZE(t){ return ({saloon:2,lab:2,clinic:2,smithy:2,camp:2}[t])||1; }

  // Scenario D: big fence project + marked rocks — mining must NOT starve (the user's bug)
  newGame();
  const ccx=40, ccy=30;
  // guarantee 8 mineable rocks on land near the colony (deterministic test)
  let rk=0;
  const spots=[[-5,0],[-6,0],[-7,0],[5,1],[6,1],[7,1],[-4,3],[4,3]];
  for(const [dx,dy] of spots){ const x=ccx+dx,y=ccy+dy;
    if(G.map[y][x].type!==3){ G.map[y][x].obj={type:'rock',hp:60,maxHp:60,marked:true}; rk++; }
  }
  // lay 40 fence blueprints in a long line on land
  let laid=0; for(let x=10;x<70&&laid<40;x++){ if(G.map[ccy][x].type!==3 && !G.buildings.find(b=>b.tx===x&&b.ty===ccy)){ G.buildings.push({type:'fence',tx:x,ty:ccy,blueprint:true,done:false,progress:0,hp:0,maxHp:0}); laid++; } }
  // everyone can build AND mine
  G.pawns.forEach(p=>{ p.priorities[3]=2; p.priorities[2]=1; });
  const oreStart = G.res.ore;
  for (let i=0;i<8000 && !G.gameOver;i++){
    G.tick++; updateTime(); updateWeather();
    updatePawns(); updateAnimals(); updateEnemies(); updateProjectiles(); render();
    if (G.tick%120===0) Diag.check();
  }
  const oreGain = G.res.ore - oreStart;
  const builtFence = G.buildings.filter(b=>b.type==='fence'&&b.done).length;
  const remainRocks = (()=>{let c=0;for(let y=0;y<60;y++)for(let x=0;x<80;x++){const o=G.map[y][x].obj;if(o&&o.marked&&o.type==='rock')c++;}return c;})();
  const harvestAnoms = Diag.anomalies.filter(a=>a.key&&a.key.indexOf('harvest')===0).length;
  console.log('SCENARIO D (fence project + marked rocks):');
  console.log('   marked rocks at start:', rk, '| ore gained:', Math.floor(oreGain), oreGain>0?'(добыча идёт ✅)':'(МАЙНИНГ ЗАСТРЯЛ ❌)');
  console.log('   fences built:', builtFence, '/ '+laid, '| rocks left marked:', remainRocks, '| harvest-anomalies:', harvestAnoms);
  // Scenario E: fence collision + gate passability for A*
  newGame();
  for (let y=28; y<=32; y++) for (let x=28; x<=52; x++) {
    G.map[y][x].type = 1;
    G.map[y][x].obj = null;
  }
  for (let y=18; y<=42; y++) {
    G.map[y][39].type = 1;
    G.map[y][40].type = 1;
    G.map[y][41].type = 1;
    G.map[y][40].obj = null;
    G.buildings.push({
      type: y===30 ? 'gate' : 'fence',
      tx:40, ty:y, blueprint:false, done:true,
      progress:1, hp:100, maxHp:100, selected:false
    });
  }
  const testPawn = G.pawns[0];
  testPawn.x = 30*TILE + TILE/2;
  testPawn.y = 30*TILE + TILE/2;
  setTarget(testPawn, 50, 30);
  const directGateCross = testPawn.path.length===1 && hasClearWalkLine(30, 30, 50, 30) && isWalkableTile(40, 30);
  const crossesGate = directGateCross || testPawn.path.some(pt=>pt.x===40 && pt.y===30);
  const crossesFence = testPawn.path.some(pt=>pt.x===40 && pt.y!==30);
  const blocked = isWalkableTile(40, 29) === false;
  const gateOpen = isWalkableTile(40, 30) === true;
  for (let i=0; i<900; i++) moveTowardsTarget(testPawn, 2.0);
  const reachedEast = Math.floor(testPawn.x/TILE) >= 49;
  console.log('SCENARIO E (A* fence collision + gate):');
  console.log('   fence blocks:', blocked?'OK':'FAIL', '| gate passable:', gateOpen?'OK':'FAIL', '| path uses gate:', crossesGate?'OK':'FAIL', '| crosses fence:', crossesFence?'FAIL':'OK', '| reached:', reachedEast?'OK':'FAIL');

  // Scenario F: stockpile + hauling
  newGame();
  const hauler = G.pawns[0];
  const stock = G.buildings.find(b=>b.type==='stockpile');
  hauler.x = (stock.tx+4)*TILE + TILE/2;
  hauler.y = stock.ty*TILE + TILE/2;
  const woodBefore = G.res.wood;
  dropItem('wood', 17, stock.tx+4, stock.ty);
  for (let i=0; i<900; i++) {
    tryHaul(hauler);
    moveTowardsTarget(hauler, 2.0);
  }
  const hauled = G.res.wood >= woodBefore + 17;
  const noItems = G.items.length === 0;
  const noCarry = !hauler.carry;
  console.log('SCENARIO F (stockpile + hauling):');
  console.log('   hauled:', hauled?'OK':'FAIL', '| ground clear:', noItems?'OK':'FAIL', '| hands empty:', noCarry?'OK':'FAIL');

  // Scenario G: smithy production chain consumes inputs and creates output
  newGame();
  const crafter = G.pawns[0];
  const sx = Math.floor(80/2)+4, sy = Math.floor(60/2)+4;
  G.map[sy][sx].type = 1;
  G.map[sy][sx].obj = null;
  G.buildings.push({type:'smithy',tx:sx,ty:sy,blueprint:false,done:true,progress:1,hp:200,maxHp:200,selected:false});
  crafter.x = (sx+1)*TILE + TILE/2;
  crafter.y = sy*TILE + TILE/2;
  G.res.ore = 20; G.res.wood = 20; G.res.gold = 0;
  const oreBeforeCraft = G.res.ore;
  const woodBeforeCraft = G.res.wood;
  for (let i=0; i<500; i++) {
    G._claims = {};
    tryCraft(crafter);
    moveTowardsTarget(crafter, 2.0);
  }
  const craftedGold = G.res.gold >= RECIPES.smithy.outAmount;
  const consumedInputs = G.res.ore < oreBeforeCraft && G.res.wood < woodBeforeCraft;
  console.log('SCENARIO G (smithy production chain):');
  console.log('   crafted gold:', craftedGold?'OK':'FAIL', '| consumed inputs:', consumedInputs?'OK':'FAIL', '| gold:', Math.floor(G.res.gold), '| ore:', Math.floor(G.res.ore), '| wood:', Math.floor(G.res.wood));

  // Scenario H: kitchen cooking chain consumes meat and creates food
  newGame();
  const cook = G.pawns[0];
  const kx = Math.floor(80/2)+4, ky = Math.floor(60/2)+4;
  for (const [tx, ty] of [[kx,ky],[kx+1,ky],[kx,ky+1],[kx+1,ky+1]]) {
    G.map[ty][tx].type = 1;
    G.map[ty][tx].obj = null;
  }
  G.buildings.push({type:'kitchen',tx:kx,ty:ky,blueprint:false,done:true,progress:1,hp:200,maxHp:200,selected:false});
  cook.x = (kx+1)*TILE + TILE/2;
  cook.y = ky*TILE + TILE/2;
  G.res.meat = 20; G.res.wood = 20; G.res.food = 0;
  const meatBeforeCook = G.res.meat;
  const woodBeforeCook = G.res.wood;
  for (let i=0; i<420; i++) {
    G._claims = {};
    tryCraft(cook);
    moveTowardsTarget(cook, 2.0);
  }
  const cookedFood = G.res.food >= RECIPES.kitchen.outAmount;
  const consumedCookingInputs = G.res.meat < meatBeforeCook && G.res.wood < woodBeforeCook;
  console.log('SCENARIO H (kitchen cooking chain):');
  console.log('   cooked food:', cookedFood?'OK':'FAIL', '| consumed inputs:', consumedCookingInputs?'OK':'FAIL', '| food:', Math.floor(G.res.food), '| meat:', Math.floor(G.res.meat), '| wood:', Math.floor(G.res.wood));

  // Scenario I: production station feedback exposes recipe, missing inputs, and progress
  newGame();
  const infoKitchen = {type:'kitchen',tx:10,ty:10,blueprint:false,done:true,progress:1,hp:200,maxHp:200,selected:false};
  G.buildings.push(infoKitchen);
  G.res.meat = 0; G.res.wood = 10; G.res.food = 0;
  const missingLines = recipeStatusLines(infoKitchen).join(' | ');
  infoKitchen.craft = { progress: RECIPES.kitchen.work / 2 };
  const progressLines = recipeStatusLines(infoKitchen).join(' | ');
  const hasRecipeLine = missingLines.includes('Рецепт') && missingLines.includes('food');
  const hasMissingLine = missingLines.includes('Ждет ресурсы') && missingLines.includes('meat');
  const hasProgressLine = progressLines.includes('Работает') && progressLines.includes('50%');
  console.log('SCENARIO I (production feedback text):');
  console.log('   recipe line:', hasRecipeLine?'OK':'FAIL', '| missing inputs:', hasMissingLine?'OK':'FAIL', '| progress:', hasProgressLine?'OK':'FAIL');

  // Scenario J: stockpile filters route hauling to an allowed stockpile
  newGame();
  const filteredHauler = G.pawns[0];
  G.buildings = G.buildings.filter(b=>b.type!=='stockpile');
  const blockedStock = {type:'stockpile',tx:20,ty:20,blueprint:false,done:true,progress:1,hp:200,maxHp:200,selected:false,filters:defaultStockpileFilters()};
  const allowedStock = {type:'stockpile',tx:24,ty:20,blueprint:false,done:true,progress:1,hp:200,maxHp:200,selected:false,filters:defaultStockpileFilters()};
  blockedStock.filters.ore = false;
  G.buildings.push(blockedStock, allowedStock);
  filteredHauler.x = 22*TILE + TILE/2;
  filteredHauler.y = 20*TILE + TILE/2;
  G.items = [];
  G.res.ore = 0;
  dropItem('ore', 9, 22, 20);
  for (let i=0; i<520; i++) {
    G._claims = {};
    tryHaul(filteredHauler);
    moveTowardsTarget(filteredHauler, 2.0);
  }
  const routedToAllowed = filteredHauler.lastDepositStock && filteredHauler.lastDepositStock.tx === allowedStock.tx && filteredHauler.lastDepositStock.res === 'ore';
  const blockedRejected = stockpileAllows(blockedStock, 'ore') === false;
  console.log('SCENARIO J (stockpile filters):');
  console.log('   routed allowed:', routedToAllowed?'OK':'FAIL', '| blocked rejects ore:', blockedRejected?'OK':'FAIL', '| ore:', Math.floor(G.res.ore));

  // Scenario K: diagnostics report ground items blocked by stockpile filters
  newGame();
  const onlyStock = G.buildings.find(b=>b.type==='stockpile');
  onlyStock.filters = defaultStockpileFilters();
  onlyStock.filters.meat = false;
  G.items = [];
  dropItem('meat', 11, onlyStock.tx+3, onlyStock.ty);
  Diag.anomalies = [];
  Diag.seen = {};
  Diag.check();
  const blockedDiag = Diag.anomalies.some(a=>a.key.includes('haul_blocked') && a.msg.includes('meat'));
  console.log('SCENARIO K (blocked hauling diagnostics):');
  console.log('   blocked item anomaly:', blockedDiag?'OK':'FAIL', '| anomalies:', Diag.anomalies.length);

  // Scenario L: disabled recipe station does not consume inputs
  newGame();
  const pausedCook = G.pawns[0];
  const px = Math.floor(80/2)+5, py = Math.floor(60/2)+5;
  for (const [tx, ty] of [[px,py],[px+1,py],[px,py+1],[px+1,py+1]]) {
    G.map[ty][tx].type = 1;
    G.map[ty][tx].obj = null;
  }
  const pausedKitchen = {type:'kitchen',tx:px,ty:py,blueprint:false,done:true,progress:1,hp:200,maxHp:200,selected:false,craftEnabled:false};
  G.buildings.push(pausedKitchen);
  pausedCook.x = (px+1)*TILE + TILE/2;
  pausedCook.y = py*TILE + TILE/2;
  G.res.meat = 20; G.res.wood = 20; G.res.food = 0;
  for (let i=0; i<520; i++) {
    G._claims = {};
    tryCraft(pausedCook);
    moveTowardsTarget(pausedCook, 2.0);
  }
  const pausedNoConsume = G.res.meat === 20 && G.res.wood === 20 && G.res.food === 0;
  pausedKitchen.craftEnabled = true;
  for (let i=0; i<520; i++) {
    G._claims = {};
    tryCraft(pausedCook);
    moveTowardsTarget(pausedCook, 2.0);
  }
  const resumedCrafts = G.res.food >= RECIPES.kitchen.outAmount && G.res.meat < 20;
  console.log('SCENARIO L (recipe station toggle):');
  console.log('   paused no consume:', pausedNoConsume?'OK':'FAIL', '| resumed crafts:', resumedCrafts?'OK':'FAIL');

  // Scenario M: recipe station output limit blocks new production
  newGame();
  const limitCook = G.pawns[0];
  const lx = Math.floor(80/2)+5, ly = Math.floor(60/2)+5;
  for (const [tx, ty] of [[lx,ly],[lx+1,ly],[lx,ly+1],[lx+1,ly+1]]) {
    G.map[ty][tx].type = 1;
    G.map[ty][tx].obj = null;
  }
  const limitedKitchen = {type:'kitchen',tx:lx,ty:ly,blueprint:false,done:true,progress:1,hp:200,maxHp:200,selected:false,craftEnabled:true,craftLimit:14};
  G.buildings.push(limitedKitchen);
  limitCook.x = (lx+1)*TILE + TILE/2;
  limitCook.y = ly*TILE + TILE/2;
  G.res.meat = 20; G.res.wood = 20; G.res.food = 14;
  for (let i=0; i<260; i++) {
    G._claims = {};
    tryCraft(limitCook);
    moveTowardsTarget(limitCook, 2.0);
  }
  const limitNoConsume = G.res.meat === 20 && G.res.wood === 20 && G.res.food === 14 && !limitedKitchen.craft;
  limitedKitchen.craftLimit = 28;
  for (let i=0; i<520; i++) {
    G._claims = {};
    tryCraft(limitCook);
    moveTowardsTarget(limitCook, 2.0);
  }
  const limitRaisedCrafts = G.res.food >= 28 && G.res.meat < 20;
  console.log('SCENARIO M (recipe output limit):');
  console.log('   limit blocks:', limitNoConsume?'OK':'FAIL', '| raised limit crafts:', limitRaisedCrafts?'OK':'FAIL');

  // Scenario N: stockpile info exposes ground stacks and blocked resources
  newGame();
  const infoStock = G.buildings.find(b=>b.type==='stockpile');
  infoStock.filters = defaultStockpileFilters();
  infoStock.filters.meat = false;
  G.items = [];
  dropItem('wood', 12, infoStock.tx+3, infoStock.ty);
  dropItem('meat', 7, infoStock.tx+4, infoStock.ty);
  const logisticsLines = stockpileLogisticsLines().join(' | ');
  const hasGroundStacks = logisticsLines.includes('wood:12') && logisticsLines.includes('meat:7');
  const hasBlockedMeat = logisticsLines.includes('Без склада') && logisticsLines.includes('meat:7');
  console.log('SCENARIO N (stockpile logistics info):');
  console.log('   ground stacks:', hasGroundStacks?'OK':'FAIL', '| blocked meat:', hasBlockedMeat?'OK':'FAIL');

  // Scenario O: recipe limit presets are exposed in station controls
  newGame();
  const presetKitchen = {type:'kitchen',tx:10,ty:10,blueprint:false,done:true,progress:1,hp:200,maxHp:200,selected:false,craftEnabled:true,craftLimit:0};
  G.buildings.push(presetKitchen);
  const controlsHtml = recipeControlHtml(presetKitchen);
  presetKitchen.craftLimit = RECIPES.kitchen.outAmount * 3;
  const presetLines = recipeStatusLines(presetKitchen).join(' | ');
  const hasPresetButtons = controlsHtml.includes('data-limit-preset') && controlsHtml.includes('x3') && controlsHtml.includes('x5');
  const presetStatus = presetLines.includes(String(RECIPES.kitchen.outAmount * 3)) && presetLines.includes('food');
  console.log('SCENARIO O (recipe limit presets):');
  console.log('   preset buttons:', hasPresetButtons?'OK':'FAIL', '| preset status:', presetStatus?'OK':'FAIL');

  // Scenario P: tradepost caravan trade spends gold and brings supplies
  newGame();
  const txp = Math.floor(80/2)+6, typ = Math.floor(60/2)+6;
  for (const [tx, ty] of [[txp,typ],[txp+1,typ],[txp,typ+1],[txp+1,typ+1]]) {
    G.map[ty][tx].type = 1;
    G.map[ty][tx].obj = null;
  }
  G.buildings.push({type:'tradepost',tx:txp,ty:typ,blueprint:false,done:true,progress:1,hp:200,maxHp:200,selected:false});
  G.res.gold = 30; G.res.food = 0; G.res.wood = 0; G.res.med = 0;
  const trade = runCaravanTrade();
  const tradeSpentGold = G.res.gold === 15;
  const tradeDelivered = trade.traded && G.res.food >= 35 && G.res.wood >= 18 && G.res.med >= 5;
  console.log('SCENARIO P (tradepost caravan trade):');
  console.log('   spent gold:', tradeSpentGold?'OK':'FAIL', '| delivered:', tradeDelivered?'OK':'FAIL', '| food:', Math.floor(G.res.food), '| wood:', Math.floor(G.res.wood), '| med:', Math.floor(G.res.med));

  // Scenario Q: scenario initialization profiles
  newGame('goldrush');
  const goldrushOk = G.scenario === 'goldrush' && G.res.gold >= DEFAULT_RES.gold + 70 && G.res.food < DEFAULT_RES.food;
  newGame('fort');
  const fortFences = G.buildings.filter(b=>b.type==='fence' && b.done).length;
  const fortOk = G.scenario === 'fort' && fortFences >= 30 && G.buildings.some(b=>b.type==='gate') && G.buildings.some(b=>b.type==='tower');
  newGame('caravan');
  const caravanOk = G.scenario === 'caravan' && G.buildings.some(b=>b.type==='tradepost' && b.done) && G.res.gold >= DEFAULT_RES.gold + 45;
  console.log('SCENARIO Q (start scenarios):');
  console.log('   goldrush:', goldrushOk?'OK':'FAIL', '| fort:', fortOk?'OK':'FAIL', '| caravan:', caravanOk?'OK':'FAIL');

  // Scenario R: scenario-specific goals and caravan deal counter
  newGame('settlers');
  const settlersGoal = scenarioGoalStatus();
  const settlersGoalOk = settlersGoal.target === 500 && settlersGoal.text.includes('500');
  newGame('goldrush');
  const goldrushGoal = scenarioGoalStatus();
  const goldrushGoalOk = goldrushGoal.target === 700 && goldrushGoal.text.includes('700');
  newGame('fort');
  G.day = 5;
  const fortGoal = scenarioGoalStatus();
  const fortGoalOk = fortGoal.target === 5 && isScenarioGoalMet();
  newGame('caravan');
  G.res.gold = 60;
  const beforeDeals = G.stats.caravanDeals || 0;
  const caravanTrade = runCaravanTrade();
  const caravanGoal = scenarioGoalStatus();
  const caravanGoalOk = caravanTrade.traded && G.stats.caravanDeals === beforeDeals + 1 && caravanGoal.target === 3 && caravanGoal.value === 1;
  console.log('SCENARIO R (scenario goals):');
  console.log('   settlers:', settlersGoalOk?'OK':'FAIL', '| goldrush:', goldrushGoalOk?'OK':'FAIL', '| fort:', fortGoalOk?'OK':'FAIL', '| caravan:', caravanGoalOk?'OK':'FAIL');

  // Scenario S: scenario-specific event pressure
  newGame('goldrush');
  G.day = 2; G.res.food = 50;
  const goldPressure = triggerScenarioDayEvent();
  const goldPressureOk = goldPressure && goldPressure.type === 'goldrush_food_pressure' && G.res.food === 42;
  newGame('fort');
  G.day = 2; G.enemies = [];
  const fortPressure = triggerScenarioDayEvent();
  const fortPressureOk = fortPressure && fortPressure.type === 'fort_raid_pressure' && G.enemies.length === fortPressure.count;
  newGame('caravan');
  G.day = 2; G.eventTimer = 400;
  const caravanPressure = triggerScenarioDayEvent();
  const caravanPressureOk = caravanPressure && caravanPressure.type === 'caravan_cadence' && G.eventTimer <= 80;
  newGame('caravan');
  const delays = Array.from({length:20}, () => scenarioEventDelay());
  const caravanDelayOk = delays.every(v => v >= 220 && v <= 480);
  console.log('SCENARIO S (scenario event pressure):');
  console.log('   goldrush:', goldPressureOk?'OK':'FAIL', '| fort:', fortPressureOk?'OK':'FAIL', '| caravan:', caravanPressureOk?'OK':'FAIL', '| caravan delay:', caravanDelayOk?'OK':'FAIL');

  // Scenario T: caravan deal profiles
  function setupTradeProfile() {
    newGame('caravan');
    G.res.gold = 100; G.res.food = 0; G.res.meat = 0; G.res.med = 0; G.res.wood = 0; G.res.ore = 0;
    G.stats.caravanDeals = 0;
  }
  setupTradeProfile();
  const foodTrade = runCaravanTrade('food');
  const foodProfileOk = foodTrade.traded && foodTrade.profile === 'food' && G.res.gold === 88 && G.res.food >= 62 && G.res.meat >= 12 && G.stats.caravanDeals === 1;
  setupTradeProfile();
  const medTrade = runCaravanTrade('medicine');
  const medProfileOk = medTrade.traded && medTrade.profile === 'medicine' && G.res.gold === 82 && G.res.med >= 18 && G.res.food >= 18 && G.stats.caravanDeals === 1;
  setupTradeProfile();
  const matTrade = runCaravanTrade('materials');
  const matProfileOk = matTrade.traded && matTrade.profile === 'materials' && G.res.gold === 80 && G.res.wood >= 58 && G.res.ore >= 18 && G.stats.caravanDeals === 1;
  console.log('SCENARIO T (caravan profiles):');
  console.log('   food:', foodProfileOk?'OK':'FAIL', '| medicine:', medProfileOk?'OK':'FAIL', '| materials:', matProfileOk?'OK':'FAIL');

  // Scenario U: tradepost UI exposes caravan profiles
  newGame('caravan');
  G.res.gold = 100;
  const tradepost = G.buildings.find(b=>b.type==='tradepost' && b.done);
  const tradeHtml = caravanTradeHtml(tradepost);
  const tradeUiProfiles = ['mixed','food','medicine','materials'].every(id => tradeHtml.includes('data-caravan-profile="' + id + '"'));
  const tradeUiCosts = tradeHtml.includes('12💰') && tradeHtml.includes('18💰') && tradeHtml.includes('20💰');
  const tradeUiOutputs = tradeHtml.includes('+62 food') && tradeHtml.includes('+18 med') && tradeHtml.includes('+58 wood');
  console.log('SCENARIO U (tradepost caravan UI):');
  console.log('   profiles:', tradeUiProfiles?'OK':'FAIL', '| costs:', tradeUiCosts?'OK':'FAIL', '| outputs:', tradeUiOutputs?'OK':'FAIL');

  // Scenario V: caravan deal UI polish (visible outputs, insufficient-gold hint, last-deal result)
  newGame('caravan');
  const tpV = G.buildings.find(b=>b.type==='tradepost' && b.done);
  G.res.gold = 0;
  G._lastCaravan = null;
  const poorHtml = caravanTradeHtml(tpV);
  const lackHint = poorHtml.includes('не хватает');
  const outRow = poorHtml.includes('+62 food'); // outputs visible in the row, not only tooltip
  G.res.gold = 100;
  const vTrade = runCaravanTrade('food');
  const richHtml = caravanTradeHtml(tpV);
  const lastShown = vTrade.traded && !!G._lastCaravan && richHtml.includes('Последняя сделка');
  console.log('SCENARIO V (caravan deal UI polish):');
  console.log('   outputs in row:', outRow?'OK':'FAIL', '| lack hint:', lackHint?'OK':'FAIL', '| last deal shown:', lastShown?'OK':'FAIL');

  // Scenario W: fort waves escalate (1/3,2/3,3/3) and award gold for holding
  newGame('fort'); G.day = 2; G.enemies = []; G.res.gold = 0; G.res.med = 0;
  const fw2 = triggerScenarioDayEvent();
  const wave2ok = fw2 && fw2.type==='fort_raid_pressure' && fw2.wave===1 && fw2.total===3 && fw2.count===2 && G.enemies.length===2 && fw2.reward===0;
  newGame('fort'); G.day = 3; G.enemies = []; G.res.gold = 0; G.res.med = 0;
  const fw3 = triggerScenarioDayEvent();
  const wave3ok = fw3 && fw3.wave===2 && fw3.count===3 && G.enemies.length===3 && fw3.reward>0 && G.res.gold===fw3.reward && G.res.med===2 && (G.stats.fortWavesHeld||0)===1;
  newGame('fort'); G.day = 4; G.enemies = []; G.res.gold = 0;
  const fw4 = triggerScenarioDayEvent();
  const wave4ok = fw4 && fw4.wave===3 && fw4.count===4 && G.enemies.length===4 && fw4.reward>fw3.reward;
  console.log('SCENARIO W (fort waves + hold reward):');
  console.log('   wave 1/3:', wave2ok?'OK':'FAIL', '| wave 2/3 reward:', wave3ok?'OK':'FAIL', '| wave 3/3 escalates:', wave4ok?'OK':'FAIL');

  // Scenario X: Gold Rush economic risk — early food pressure, then claim-jumper raids
  newGame('goldrush'); G.day = 2; G.res.food = 50;
  const grEarly = triggerScenarioDayEvent();
  const earlyOk = grEarly && grEarly.type==='goldrush_food_pressure' && G.res.food === 42;
  newGame('goldrush'); G.day = 4; G.enemies = [];
  const grRaid = triggerScenarioDayEvent();
  const raidOk = grRaid && grRaid.type==='goldrush_claim_raid' && grRaid.count>=2 && G.enemies.length===grRaid.count;
  newGame('goldrush'); G.day = 6; G.enemies = [];
  const grRaid6 = triggerScenarioDayEvent();
  const raid6Ok = grRaid6 && grRaid6.type==='goldrush_claim_raid' && grRaid6.count>grRaid.count && G.enemies.length===grRaid6.count;
  console.log('SCENARIO X (gold rush economic risk):');
  console.log('   early food pressure:', earlyOk?'OK':'FAIL', '| claim raid day4:', raidOk?'OK':'FAIL', '| raid escalates day6:', raid6Ok?'OK':'FAIL');

  // Scenario Y: focusPawn selects a pawn from the sidebar and centers the camera on it
  newGame('settlers');
  const target = G.pawns.find(p => p.alive);
  // переместим пешку подальше, камеру — в другое место, чтобы проверить центрирование
  target.x = 70 * 24; target.y = 50 * 24;
  G.camera.x = 0; G.camera.y = 0; G.camera.zoom = 1;
  focusPawn(target.id);
  const selectedOkY = G.selectedPawnId === target.id;
  // после центрирования пешка должна попасть в видимую область камеры
  const zY = G.camera.zoom;
  const cwY = 1280, chY = 720; // размеры из заглушки canvas
  const psxY = (target.x - G.camera.x) * zY, psyY = (target.y - G.camera.y) * zY;
  const inViewY = psxY > 0 && psxY < cwY && psyY > 0 && psyY < chY;
  const centeredY = Math.abs(psxY - cwY/2) < 2 && Math.abs(psyY - chY/2) < 2;
  console.log('SCENARIO Y (sidebar pawn select + camera focus):');
  console.log('   selected:', selectedOkY?'OK':'FAIL', '| in view:', inViewY?'OK':'FAIL', '| centered:', centeredY?'OK':'FAIL');

  // Scenario Z: Caravan Route scenario grants +20% trade outputs vs other scenarios
  newGame('caravan'); G.res.gold = 100; G.res.food = 0; G.res.meat = 0;
  G.researches.forEach(r => { if (r.id === 'trading') r.done = false; });
  const crTrade = runCaravanTrade('food');
  const routeFood = G.res.food;            // floor(62 * 1.2) = 74
  newGame('settlers'); G.res.gold = 100; G.res.food = 0;
  G.researches.forEach(r => { if (r.id === 'trading') r.done = false; });
  G.buildings.push({ type:'tradepost', tx:10, ty:10, blueprint:false, done:true, hp:200, maxHp:200, selected:false });
  const baseTrade = runCaravanTrade('food');
  const baseFood = G.res.food;             // 62
  const routeOk = crTrade.traded && baseTrade.traded && routeFood === 74 && baseFood === 62 && routeFood > baseFood;
  // UI note appears only in caravan scenario
  newGame('caravan');
  const crPost = G.buildings.find(b => b.type === 'tradepost' && b.done);
  const noteOk = caravanTradeHtml(crPost).includes('+20% к выдаче');
  console.log('SCENARIO Z (caravan route trade bonus):');
  console.log('   route +20%:', routeOk?'OK':'FAIL', '| route food', routeFood, 'vs base', baseFood, '| UI note:', noteOk?'OK':'FAIL');

  // Scenario AA: combat downed state — incapacitated instead of instant death, finish-off, rescue, bleed-out
  newGame('settlers');
  const dp = G.pawns.find(p => p.alive);
  // смертельный урон → без сознания, но жив
  dp.hp = 5; downPawn(dp);
  const downedOk = dp.alive && dp.downed && !dp.dead && dp.hp <= 1 && dp.downedTimer > 0;
  // спасение: подняли HP и тикнули → пришёл в себя
  dp.hp = 30; updateDowned(dp);
  const rescuedOk = dp.alive && !dp.downed && dp.state === 'idle';
  // добивание лежачего
  const dp2 = G.pawns.filter(p => p.alive)[1] || G.pawns.find(p=>p.alive&&p.id!==dp.id);
  downPawn(dp2); const wasDowned = dp2.downed && dp2.alive;
  downPawn(dp2); const finishedOff = dp2.dead && !dp2.alive;
  // истечение кровью без помощи
  const dp3 = G.pawns.find(p => p.alive && !p.downed);
  downPawn(dp3); dp3.downedTimer = 1; updateDowned(dp3);
  const bledOut = dp3.dead && !dp3.alive;
  console.log('SCENARIO AA (combat downed/rescue/bleed-out):');
  console.log('   downed not dead:', downedOk?'OK':'FAIL', '| rescued:', rescuedOk?'OK':'FAIL', '| finish-off:', (wasDowned&&finishedOff)?'OK':'FAIL', '| bleed-out:', bledOut?'OK':'FAIL');

  // Scenario AB: stable gives horses → movement speed bonus (caps at +45%)
  newGame('settlers');
  G.buildings = G.buildings.filter(b => b.type !== 'stable');
  const m0 = mountSpeedMul();
  G.buildings.push({ type:'stable', tx:5, ty:5, done:true, blueprint:false, hp:200, maxHp:200 });
  const m1 = mountSpeedMul();
  for (let i = 0; i < 3; i++) G.buildings.push({ type:'stable', tx:8+i*3, ty:5, done:true, blueprint:false, hp:200, maxHp:200 });
  const mCap = mountSpeedMul();
  const bonusOk = m0 === 1 && Math.abs(m1 - 1.15) < 1e-9 && Math.abs(mCap - 1.45) < 1e-9;
  let simOk = true;
  try {
    for (let i = 0; i < 400; i++) { G.tick++; updateTime(); updateWeather(); updatePawns(); updateAnimals(); updateEnemies(); updateProjectiles(); render(); }
  } catch (e) { simOk = false; }
  console.log('SCENARIO AB (stable mount speed):');
  console.log('   bonus 0/1/cap:', bonusOk?'OK':'FAIL', '(' + m0 + '/' + m1.toFixed(2) + '/' + mCap.toFixed(2) + ') | sim stable:', simOk?'OK':'FAIL');
  if (!bonusOk || !simOk) throw new Error('Scenario AB failed');

  // Scenario AC: bed comfort improves sleep and is preferred over camp
  newGame('settlers');
  G.buildings = G.buildings.filter(b => b.type !== 'bed' && b.type !== 'camp');
  // детерминированно: фиксируем пешку на тайле и состояние сна каждый тик,
  // чтобы случайный ИИ не «съезжал» с кровати и тест не флакал
  let pSleep = G.pawns[0];
  pSleep.energy = 20; pSleep.mood = 50; G.hour = 23;
  for (let i = 0; i < 60; i++) { G.tick++; pSleep.x = 10*TILE; pSleep.y = 10*TILE; pSleep.state = 'sleeping'; pSleep.downed = false; updatePawns(); }
  const roughEnergy = pSleep.energy;
  const roughMood = pSleep.mood;
  newGame('settlers');
  G.buildings = G.buildings.filter(b => b.type !== 'bed' && b.type !== 'camp');
  pSleep = G.pawns[0];
  pSleep.energy = 20; pSleep.mood = 50; G.hour = 23;
  G.buildings.push({ type:'bed', tx:10, ty:10, done:true, blueprint:false, hp:120, maxHp:120 });
  for (let i = 0; i < 60; i++) { G.tick++; pSleep.x = 10*TILE; pSleep.y = 10*TILE; pSleep.state = 'sleeping'; pSleep.downed = false; updatePawns(); }
  const bedEnergy = pSleep.energy;
  const bedMood = pSleep.mood;
  const comfortOk = sleepComfortAt(pSleep) >= 2 && bedEnergy > roughEnergy + 1 && bedMood > roughMood;
  newGame('settlers');
  G.buildings = G.buildings.filter(b => b.type !== 'bed' && b.type !== 'camp');
  pSleep = G.pawns[0]; pSleep.x = 20*TILE; pSleep.y = 20*TILE;
  G.buildings.push({ type:'camp', tx:20, ty:20, done:true, blueprint:false, hp:200, maxHp:200 });
  G.buildings.push({ type:'bed', tx:24, ty:20, done:true, blueprint:false, hp:120, maxHp:120 });
  doSleep(pSleep);
  const prefersBed = pSleep.targetX === 24 && pSleep.targetY === 20;
  console.log('SCENARIO AC (bed comfort sleep):');
  console.log('   comfort bonus:', comfortOk?'OK':'FAIL', '| energy:', roughEnergy.toFixed(1), '->', bedEnergy.toFixed(1), '| mood:', roughMood.toFixed(1), '->', bedMood.toFixed(1), '| prefers bed:', prefersBed?'OK':'FAIL');
  if (!comfortOk || !prefersBed) throw new Error('Scenario AC failed');

  // Scenario AD: dining table gives a small comfort mood bonus when eating
  const prepDining = (withTable) => {
    newGame('settlers');
    G.enemies = [];
    G.res.food = 20;
    G.buildings = G.buildings.filter(b => b.type !== 'table');
    if (withTable) G.buildings.push({ type:'table', tx:12, ty:12, done:true, blueprint:false, hp:100, maxHp:100 });
    G.pawns.forEach((q, i) => { q.food = i === 0 ? 35 : 100; q.mood = 50; q.energy = 80; q.socialTimer = 9999; q.state = 'idle'; });
    return G.pawns[0];
  };
  let pEat = prepDining(false);
  updatePawns();
  const noTableMood = pEat.mood;
  const noTableThought = pEat.thoughts.some(t => t.text.includes('Ел за столом'));
  pEat = prepDining(true);
  updatePawns();
  const tableMood = pEat.mood;
  const tableThought = pEat.thoughts.some(t => t.text.includes('Ел за столом'));
  const diningOk = hasDiningTable() && tableMood > noTableMood + 1 && tableThought && !noTableThought;
  console.log('SCENARIO AD (table dining comfort):');
  console.log('   dining bonus:', diningOk?'OK':'FAIL', '| mood:', noTableMood.toFixed(1), '->', tableMood.toFixed(1), '| thought:', tableThought?'OK':'FAIL');
  if (!diningOk) throw new Error('Scenario AD failed');

  // Scenario AE: decor gives nearby beauty mood/thought
  newGame('settlers');
  G.buildings = G.buildings.filter(b => b.type !== 'decor');
  const pBeauty = G.pawns[0];
  pBeauty.x = 15*TILE; pBeauty.y = 15*TILE; pBeauty.food = 80; pBeauty.energy = 80; pBeauty.hp = pBeauty.maxHp; pBeauty.sick = null;
  const plainDelta = calcMoodDelta(pBeauty);
  G.buildings.push({ type:'decor', tx:16, ty:15, done:true, blueprint:false, hp:100, maxHp:100 });
  const decorDelta = calcMoodDelta(pBeauty);
  updateThoughts(pBeauty);
  const decorThought = pBeauty.thoughts.some(t => t.text.includes('Красивый уголок'));
  const decorOk = nearBeautyDecor(pBeauty) && decorDelta > plainDelta + 0.15 && decorThought;
  console.log('SCENARIO AE (decor beauty mood):');
  console.log('   beauty bonus:', decorOk?'OK':'FAIL', '| delta:', plainDelta.toFixed(2), '->', decorDelta.toFixed(2), '| thought:', decorThought?'OK':'FAIL');
  if (!decorOk) throw new Error('Scenario AE failed');

  // Scenario AF: homestead comfort score rewards a basic furniture set
  newGame('settlers');
  G.buildings = G.buildings.filter(b => !['bed','table','decor'].includes(b.type));
  const pHome = G.pawns[0];
  pHome.x = 30*TILE; pHome.y = 30*TILE; pHome.food = 80; pHome.energy = 80; pHome.hp = pHome.maxHp; pHome.sick = null;
  const emptyScore = homesteadComfortScore();
  const emptyBonus = homesteadComfortBonus();
  const emptyDelta = calcMoodDelta(pHome);
  G.buildings.push({ type:'bed', tx:30, ty:30, done:true, blueprint:false, hp:120, maxHp:120 });
  G.buildings.push({ type:'table', tx:31, ty:30, done:true, blueprint:false, hp:100, maxHp:100 });
  G.buildings.push({ type:'decor', tx:32, ty:30, done:true, blueprint:false, hp:100, maxHp:100 });
  const fullScore = homesteadComfortScore();
  const fullBonus = homesteadComfortBonus();
  const fullDelta = calcMoodDelta(pHome);
  updateThoughts(pHome);
  const homeThought = pHome.thoughts.some(t => t.text.includes('Уютная усадьба'));
  const homeOk = emptyScore === 0 && emptyBonus === 0 && fullScore === 3 && fullBonus > 0 && fullDelta > emptyDelta && homeThought && homesteadComfortLabel() === 'уютная';
  console.log('SCENARIO AF (homestead comfort score):');
  console.log('   score:', emptyScore + '->' + fullScore, '| bonus:', emptyBonus.toFixed(2) + '->' + fullBonus.toFixed(2), '| thought:', homeThought?'OK':'FAIL');
  if (!homeOk) throw new Error('Scenario AF failed');

  // Scenario AG: ranch daily yield requires stable support
  newGame('settlers');
  G.buildings = G.buildings.filter(b => !['ranch','stable'].includes(b.type));
  G.res.food = 10; G.res.gold = 0; G.stats.goldEarned = 0;
  G.buildings.push({ type:'ranch', tx:12, ty:12, done:true, blueprint:false, hp:200, maxHp:200 });
  const noStableYield = ranchDailyYield();
  onNewDay();
  const noStableOk = noStableYield.food === 0 && noStableYield.gold === 0 && G.res.food === 10 && G.res.gold === 0;
  G.buildings.push({ type:'stable', tx:15, ty:12, done:true, blueprint:false, hp:200, maxHp:200 });
  const withStableYield = ranchDailyYield();
  onNewDay();
  const withStableOk = withStableYield.food === 8 && withStableYield.gold === 2 && G.res.food === 18 && G.res.gold === 2 && G.stats.goldEarned === 2;
  console.log('SCENARIO AG (ranch daily yield):');
  console.log('   requires stable:', noStableOk?'OK':'FAIL', '| yield:', withStableYield.food + ' food / ' + withStableYield.gold + ' gold', '| applied:', withStableOk?'OK':'FAIL');
  if (!noStableOk || !withStableOk) throw new Error('Scenario AG failed');

  // Scenario AH: stables tame wild horses, and tamed horses boost ranch output
  newGame('settlers');
  G.buildings = G.buildings.filter(b => !['ranch','stable'].includes(b.type));
  G.herd = { wild:2, tamed:0, tameProgress:0 };
  const noStableTaming = processHorseTaming();
  const noStableOk2 = noStableTaming.tamed === 0 && G.herd.wild === 2 && G.herd.tamed === 0 && G.herd.tameProgress === 0;
  G.buildings.push({ type:'stable', tx:15, ty:12, done:true, blueprint:false, hp:200, maxHp:200 });
  processHorseTaming();
  processHorseTaming();
  const beforeThird = {...G.herd};
  const thirdTaming = processHorseTaming();
  const tamingOk = beforeThird.wild === 2 && beforeThird.tamed === 0 && thirdTaming.tamed === 1 && G.herd.wild === 1 && G.herd.tamed === 1 && G.herd.tameProgress === 5;
  G.buildings.push({ type:'ranch', tx:12, ty:12, done:true, blueprint:false, hp:200, maxHp:200 });
  const boostedYield = ranchDailyYield();
  const boostOk = boostedYield.food === 10 && boostedYield.gold === 3 && mountSpeedMul() > 1.15;
  console.log('SCENARIO AH (horse taming):');
  console.log('   no stable:', noStableOk2?'OK':'FAIL', '| tamed:', G.herd.tamed, '| yield:', boostedYield.food + ' food / ' + boostedYield.gold + ' gold', '| boost:', boostOk?'OK':'FAIL');
  if (!noStableOk2 || !tamingOk || !boostOk) throw new Error('Scenario AH failed');

  // Scenario AI: fenced room around furniture gives a visible room comfort bonus
  newGame('settlers');
  G.buildings = G.buildings.filter(b => !['bed','table','decor','fence','gate'].includes(b.type));
  for (let y=24; y<=32; y++) for (let x=24; x<=32; x++) forceDry(x, y, 1);
  const pRoom = G.pawns[0];
  pRoom.x = 28*TILE; pRoom.y = 28*TILE; pRoom.food = 80; pRoom.energy = 80; pRoom.hp = pRoom.maxHp; pRoom.sick = null;
  G.buildings.push({ type:'bed', tx:28, ty:28, done:true, blueprint:false, hp:120, maxHp:120 });
  G.buildings.push({ type:'table', tx:29, ty:28, done:true, blueprint:false, hp:100, maxHp:100 });
  G.buildings.push({ type:'decor', tx:28, ty:29, done:true, blueprint:false, hp:100, maxHp:100 });
  const openScore = roomComfortScore();
  const openBonus = roomComfortBonus();
  const openDelta = calcMoodDelta(pRoom);
  for (let x=26; x<=31; x++) {
    G.buildings.push({ type:'fence', tx:x, ty:26, done:true, blueprint:false, hp:100, maxHp:100 });
    G.buildings.push({ type:'fence', tx:x, ty:31, done:true, blueprint:false, hp:100, maxHp:100 });
  }
  for (let y=27; y<=30; y++) {
    G.buildings.push({ type:'fence', tx:26, ty:y, done:true, blueprint:false, hp:100, maxHp:100 });
    G.buildings.push({ type:'fence', tx:31, ty:y, done:true, blueprint:false, hp:100, maxHp:100 });
  }
  const room = enclosedRoomAt(28, 28);
  const closedScore = roomComfortScore();
  const closedBonus = roomComfortBonus();
  const closedDelta = calcMoodDelta(pRoom);
  updateThoughts(pRoom);
  const roomThought = pRoom.thoughts.some(t => t.text.includes('Хорошая комната'));
  const roomOk = openScore === 0 && openBonus === 0 && room && room.tiles > 0 && closedScore === 3 && closedBonus > 0 && closedDelta > openDelta && roomThought && roomComfortLabel() === 'хорошая комната';
  console.log('SCENARIO AI (basic room comfort):');
  console.log('   score:', openScore + '->' + closedScore, '| tiles:', room ? room.tiles : 0, '| bonus:', openBonus.toFixed(2) + '->' + closedBonus.toFixed(2), '| thought:', roomThought?'OK':'FAIL');
  if (!roomOk) throw new Error('Scenario AI failed');

  // Scenario AJ: ambient profile selection (deterministic) + setAmbient smoke (no audio in Node)
  newGame('settlers');
  G.weather = 'clear'; G.hour = 12; const pDay = ambientProfile();
  G.hour = 1; const pNight = ambientProfile();
  G.hour = 22; const pNight2 = ambientProfile();
  G.hour = 12; G.weather = 'rain'; const pRain = ambientProfile();
  G.weather = 'storm'; const pStorm = ambientProfile();
  G.weather = 'blizzard'; const pBliz = ambientProfile();
  const profOk = pDay==='day' && pNight==='night' && pNight2==='night' && pRain==='rain' && pStorm==='rain' && pBliz==='blizzard';
  let smokeOk = true;
  try { ['day','night','rain','blizzard','day'].forEach(p => Sfx.setAmbient(p)); } catch(e) { smokeOk = false; }
  const smokeProfileSet = Sfx.ambient && Sfx.ambient.profile === 'day';
  console.log('SCENARIO AJ (ambient audio profile):');
  console.log('   profile select:', profOk?'OK':'FAIL', '(' + [pDay,pNight,pRain,pBliz].join('/') + ') | setAmbient smoke:', (smokeOk&&smokeProfileSet)?'OK':'FAIL');
  if (!profOk || !smokeOk || !smokeProfileSet) throw new Error('Scenario AJ failed');

  // Scenario AK: housing progression — lone bed (2) < bed inside an enclosed room/house (3)
  newGame('settlers');
  G.buildings = G.buildings.filter(b => !['bed','camp','fence','gate'].includes(b.type));
  // ровная земля под комнату, чтобы flood-fill не считал воду/скалу стенами
  for (let y = 30; y <= 34; y++) for (let x = 40; x <= 44; x++) { G.map[y][x].type = TERRAIN.GRASS; G.map[y][x].obj = null; }
  const pawnK = G.pawns[0];
  pawnK.x = 42*TILE; pawnK.y = 32*TILE;
  G.buildings.push({ type:'bed', tx:42, ty:32, done:true, blueprint:false, hp:120, maxHp:120 });
  const loneComfort = sleepComfortAt(pawnK);
  // обнести кровать кольцом забора 40..44 x 30..34 → замкнутая комната (дом)
  for (let x = 40; x <= 44; x++) for (let y = 30; y <= 34; y++) {
    if (x===40||x===44||y===30||y===34) G.buildings.push({ type:'fence', tx:x, ty:y, done:true, blueprint:false, hp:100, maxHp:100 });
  }
  const roomComfort = sleepComfortAt(pawnK);
  const rateOk = sleepEnergyRate(3) > sleepEnergyRate(2) && sleepEnergyRate(2) > sleepEnergyRate(1) && sleepEnergyRate(1) > sleepEnergyRate(0);
  const houseOk = loneComfort === 2 && roomComfort === 3 && rateOk;
  console.log('SCENARIO AK (housing progression bed->house):');
  console.log('   lone bed:', loneComfort, '| bed in room:', roomComfort, '| sleep rates ordered:', rateOk?'OK':'FAIL', '|', houseOk?'OK':'FAIL');
  if (!houseOk) throw new Error('Scenario AK failed');

  // Scenario AL: mood music profile (deterministic) + setMusic smoke (no audio in Node)
  newGame('settlers');
  G.enemies = []; G.hour = 12; const mCalm = musicProfile();
  G.hour = 23; const mNight = musicProfile();
  G.enemies = [{ alive:true, x:0, y:0 }]; G.hour = 12; const mCombat = musicProfile();
  G.hour = 23; const mCombat2 = musicProfile();   // бой важнее ночи
  const musicOk = mCalm==='calm' && mNight==='night' && mCombat==='combat' && mCombat2==='combat';
  let mSmokeOk = true;
  try { ['calm','night','combat','calm'].forEach(p => Sfx.setMusic(p)); } catch(e) { mSmokeOk = false; }
  const musicProfileSet = Sfx.music && Sfx.music.profile === 'calm';
  console.log('SCENARIO AL (mood music profile):');
  console.log('   profile select:', musicOk?'OK':'FAIL', '(' + [mCalm,mNight,mCombat].join('/') + ') | setMusic smoke:', (mSmokeOk&&musicProfileSet)?'OK':'FAIL');
  if (!musicOk || !mSmokeOk || !musicProfileSet) throw new Error('Scenario AL failed');

  // Scenario AM: state glyph (pure) + work-animation render smoke
  newGame('settlers');
  const glyphOk = stateGlyph('working')==='⚒' && stateGlyph('joy')==='♪'
    && stateGlyph('idle')==='' && stateGlyph('fighting')==='' && stateGlyph('downed')==='';
  let amSmokeOk = true;
  try { const p0 = G.pawns[0]; p0.state='working'; for (let i=0;i<5;i++){ G.tick++; render(); } } catch(e) { amSmokeOk = false; }
  console.log('SCENARIO AM (work animation + state glyph):');
  console.log('   glyph map:', glyphOk?'OK':'FAIL', '| working render smoke:', amSmokeOk?'OK':'FAIL');
  if (!glyphOk || !amSmokeOk) throw new Error('Scenario AM failed');

  // Scenario AN: marked-resource readability (countMarked + pulsing-highlight render smoke)
  newGame('settlers');
  const c0 = countMarked();
  // пометить пару деревьев, камень и животное
  let mt = 0, mr = 0;
  for (let y=0;y<MAP_H && (mt<2||mr<1);y++) for (let x=0;x<MAP_W && (mt<2||mr<1);x++) {
    const o = G.map[y][x].obj;
    if (o && o.type==='tree' && mt<2) { o.marked = true; mt++; }
    else if (o && o.type==='rock' && mr<1) { o.marked = true; mr++; }
  }
  if (G.animals[0]) G.animals[0].marked = true;
  const c1 = countMarked();
  const countOk = c0.trees===0 && c0.rocks===0 && c0.animals===0
    && c1.trees===mt && c1.rocks===mr && c1.animals===(G.animals[0]?1:0)
    && markPulseAlpha() >= 0 && markPulseAlpha() <= 1;
  let anSmoke = true;
  try { for (let i=0;i<4;i++){ G.tick++; render(); } } catch(e) { anSmoke = false; }
  const summary = markedSummaryText();
  const sWithMarksOk = (mt > 0 ? summary.includes('🪓 ' + mt) : true);
  newGame('settlers');
  const sEmptyOk = markedSummaryText() === 'нет';
  const summaryOk = sWithMarksOk && sEmptyOk;
  console.log('SCENARIO AN (marked readability):');
  console.log('   count:', JSON.stringify(c1), '| countOk:', countOk?'OK':'FAIL', '| summary:', summaryOk?'OK':'FAIL', '| render smoke:', anSmoke?'OK':'FAIL');
  if (!countOk || !anSmoke || !summaryOk) throw new Error('Scenario AN failed');

  // Scenario AO: sniper enemy type — joins big raids, long range, not in small raids
  const sniperDef = ENEMY_TYPES.sniper;
  const defOk = sniperDef && sniperDef.range >= 11 && sniperDef.ranged === true && sniperDef.atk >= 20;
  newGame('settlers'); G.enemies = [];
  spawnEnemy(6);   // большой налёт: [0]=boss, [1]=sniper
  const bigOk = G.enemies[0].type === 'boss' && G.enemies[1].type === 'sniper'
    && G.enemies[1].range >= 11 && G.enemies[1].ranged === true;
  newGame('settlers'); G.enemies = [];
  spawnEnemy(2);   // мелкий налёт: без снайпера и без босса
  const smallOk = !G.enemies.some(e => e.type === 'sniper') && !G.enemies.some(e => e.type === 'boss');
  const sniperOk = defOk && bigOk && smallOk;
  console.log('SCENARIO AO (sniper enemy type):');
  console.log('   def:', defOk?'OK':'FAIL', '| big raid has sniper:', bigOk?'OK':'FAIL', '| small raid none:', smallOk?'OK':'FAIL');
  if (!sniperOk) throw new Error('Scenario AO failed');

  // Scenario AP: powder barrel trap — explodes when an enemy approaches, AoE damage, consumed
  newGame('settlers'); G.enemies = [];
  // бочка на суше у центра
  const bx0 = 40, by0 = 30; G.map[by0][bx0].type = TERRAIN.GRASS; G.map[by0][bx0].obj = null;
  G.buildings.push({ type:'barrel', tx:bx0, ty:by0, done:true, blueprint:false, hp:20, maxHp:20 });
  // враг далеко — взрыва нет
  G.enemies.push({ id:G.nextId++, type:'knifer', x:(bx0+8)*TILE, y:by0*TILE, tx:bx0+8, ty:by0, hp:55, maxHp:70, speed:1.5, atk:10, range:1.5, ranged:false, reload:55, attackCooldown:0, path:[], targetX:0, targetY:0, alive:true });
  updateBarrels();
  const noEarlyBoom = G.buildings.some(b => b.type==='barrel' && b.done) && G.enemies[0].hp === 55;
  // три врага рядом — взрыв
  const near = [];
  for (let i=0;i<3;i++){ const e={ id:G.nextId++, type:'knifer', x:(bx0+i)*TILE, y:by0*TILE, tx:bx0+i, ty:by0, hp:55, maxHp:70, speed:1.5, atk:10, range:1.5, ranged:false, reload:55, attackCooldown:0, path:[], targetX:0, targetY:0, alive:true }; G.enemies.push(e); near.push(e); }
  updateBarrels();
  const barrelGone = !G.buildings.some(b => b.type==='barrel');
  const damaged = near.every(e => !e.alive || e.hp < 55);
  const trapOk = noEarlyBoom && barrelGone && damaged;
  console.log('SCENARIO AP (powder barrel trap):');
  console.log('   no early boom:', noEarlyBoom?'OK':'FAIL', '| exploded+consumed:', barrelGone?'OK':'FAIL', '| AoE damage:', damaged?'OK':'FAIL');
  if (!trapOk) throw new Error('Scenario AP failed');

  // Scenario AQ: arsonist enemy attacks buildings (breaks walls), and joins big raids
  const arsDef = ENEMY_TYPES.arsonist;
  const arsDefOk = arsDef && arsDef.burns === true;
  newGame('settlers'); G.enemies = []; G.buildings = G.buildings.filter(b => b.type !== 'fence');
  const fX = 40, fY = 30; G.map[fY][fX].type = TERRAIN.GRASS; G.map[fY][fX].obj = null;
  G.buildings.push({ type:'fence', tx:fX, ty:fY, done:true, blueprint:false, hp:30, maxHp:100 });
  G.enemies.push({ id:G.nextId++, type:'arsonist', x:(fX+1)*TILE, y:fY*TILE, tx:fX+1, ty:fY, hp:50, maxHp:65, speed:1.35, atk:6, range:1.5, ranged:false, reload:45, attackCooldown:0, path:[], targetX:0, targetY:0, alive:true });
  const fenceHp0 = G.buildings.find(b => b.type==='fence').hp;
  for (let i = 0; i < 220; i++) updateEnemies();
  const fenceGone = !G.buildings.some(b => b.type === 'fence');
  // big raid includes an arsonist at slot 2
  newGame('settlers'); G.enemies = [];
  spawnEnemy(6);
  const raidHasArsonist = G.enemies[2] && G.enemies[2].type === 'arsonist';
  const arsOk = arsDefOk && fenceHp0 === 30 && fenceGone && raidHasArsonist;
  console.log('SCENARIO AQ (arsonist breaks buildings):');
  console.log('   def burns:', arsDefOk?'OK':'FAIL', '| destroyed fence:', fenceGone?'OK':'FAIL', '| in big raid:', raidHasArsonist?'OK':'FAIL');
  if (!arsOk) throw new Error('Scenario AQ failed');

  // Scenario AR: work skill — XP accrues while working, levels speed up work, capped at 10
  newGame('settlers');
  const ps = G.pawns[0];
  ps.workXp = 0; ps.workLevel = 0;
  const wmul0 = wmul(ps);
  for (let i = 0; i < 2200; i++) gainWorkXp(ps);   // ~110 xp → уровень 1
  const leveledUp = ps.workLevel >= 1;
  const wmul1 = wmul(ps);
  const fasterWithSkill = wmul1 > wmul0;
  // кап: накачать опыт до предела
  ps.workXp = 100000; for (let i = 0; i < 60; i++) gainWorkXp(ps);
  const capped = ps.workLevel === 10;
  const skillOk = leveledUp && fasterWithSkill && capped && Math.abs(wmul({workLevel:10}) - 1.4) < 1e-9;
  console.log('SCENARIO AR (work skill leveling):');
  console.log('   level up:', leveledUp?'OK':'FAIL', '| faster:', fasterWithSkill?'OK':'FAIL', '| cap 10:', capped?'OK':'FAIL');
  if (!skillOk) throw new Error('Scenario AR failed');
})();
`;
try {
  vm.runInNewContext(core + test, sandbox, { filename:'game.js' });
  console.log('NO runtime errors.');
} catch(e) {
  console.log('RUNTIME ERROR:', e.message);
  console.log((e.stack||'').split('\n').slice(0,6).join('\n'));
  process.exit(1);
}
