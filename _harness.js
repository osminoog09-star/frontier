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
