/* S03-U114: card-effect Xyz material detach — the player chooses the material (reopened U108 user bug).
   User report (reproduced on device): API.detachMaterial(p, mzIndex, reason) sent FX_DETACH without a material, and
   FX_DETACH removed index 0, so every card effect removed the FIRST material. U108's test only drove the manual
   openXyzDetachPick UI, never a real card activation → cost → choice.
   Fix: generic requestDetachMaterialS03 (engine/1ZF_xyz_detach_choice_s03.js) on the P1 ChoiceRequest registry;
   scripts declare detachCostS03 {count, reason, holders?, after?, targets?}; prepareDuelActivation runs it as a P1.1
   prepared activation (JSON descriptor + registered handlers), so a save inside the choice resumes. Materials are
   identified by UID; FX_DETACH {materialUid} sends the material to its owner's GY; an unknown UID detaches nothing. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function names(p,zn){return (gameState.players[p][zn]||[]).map(nm);}
function pc(){return pendingChoiceV49(gameState);}
function isDetachPrompt(){const q=pc();return !!q&&/取り除くX素材/.test(q.title||'');}
function keyOfMat(m){const q=pc();const c=q&&q.candidates.find(x=>x.value===m.uid);return c?c.key:null;}
function toPoint(){
  for(let i=0;i<80;i++){
    const w=gameState.processorWaiting;
    if(w&&w.type==='POINT'&&gameState.processorPaused&&(w.payload||{}).kind==='attackDeclare')return true;
    if(pc()){__choicePickV49(0);continue;}
    if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){eventSkipGroupV2();continue;}
    if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
    if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
    if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
    return false;
  }
  return false;
}
/* runs the duel until idle; stops (returns 'choice') at any pending choice so the test answers it itself */
function drive(){for(let i=0;i<300;i++){
  if(pc())return 'choice';
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;
  if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));return pkg;}
function detachActions(){return v41ReplayPackage(gameState).actions.map(x=>x&&x.action).filter(a=>a&&a.type==='FX_DETACH');}
function xyzWith(name,p,mats){const c=mk(name,p,'up');c.xyz=mats;c.summonedTurn=1;return c;}
function captureSave(){saveDuel();return localStorage.getItem(DUEL_SAVE_KEY);}
`;

/* ===== A. No.39 希望皇ホープ — opponent's attack declaration → Hope effect → choose the 2nd material ===== */
harness(COMMON+String.raw`
resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='battle';
const m1=mk('ガガガマジシャン',1), m2=mk('ゴブリンドバーグ',1);
const hope=xyzWith('No.39 希望皇ホープ',1,[m1,m2]);
gameState.players[1].mz=[hope];
const atk=mk('サイバー・ドラゴン',0);gameState.players[0].mz=[atk];
baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});
const atPoint=toPoint();
const off=(getChainResponsesV2(1)||[]).filter(r=>r.db.n==='No.39 希望皇ホープ');
ok('A: at the attack declaration Hope is offered to its controller',atPoint&&off.length===1,JSON.stringify({atPoint,off:(getChainResponsesV2(1)||[]).map(r=>r.db.n)}));
pointActivateV27(1,'mz',0);
ok('A: the cost opens "取り除くX素材を選択してください" with both materials',isDetachPrompt()&&pc().candidates.length===2&&pc().player===1,
  JSON.stringify(pc()&&{t:pc().title,c:pc().candidates.map(c=>c.label),p:pc().player}));
ok('A: nothing is detached and nothing is on the chain before the choice',hope.xyz.length===2&&!gameState.chain.length,JSON.stringify({xyz:hope.xyz.map(nm),chain:gameState.chain.length}));
answerChoiceV49([keyOfMat(m2)]);
drive();
ok('A: only the chosen 2nd material (ゴブリンドバーグ) is detached; the 1st stays as material',
  hope.xyz.length===1&&hope.xyz[0]===m1&&names(1,'grave').includes('ゴブリンドバーグ')&&!names(1,'grave').includes('ガガガマジシャン'),
  JSON.stringify({xyz:hope.xyz.map(nm),g1:names(1,'grave')}));
ok('A: the attack is negated (no battle: both monsters remain, no LP change)',z(hope)==='mz'&&z(atk)==='mz'&&gameState.players[0].lp===8000&&gameState.players[1].lp===8000&&!gameState.pendingAttack,
  JSON.stringify({hope:z(hope),atk:z(atk),lp:[gameState.players[0].lp,gameState.players[1].lp]}));
audit('A');
const da=detachActions();
ok('E: the journal records the chosen material by UID (Replay reproduces the choice)',da.length===1&&da[0].materialUid===m2.uid,JSON.stringify(da));
`);

/* ===== A2. cancelling the cost choice aborts the activation — nothing detached, no chain link ===== */
harness(COMMON+String.raw`
resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='battle';
const m1=mk('ガガガマジシャン',1), m2=mk('ゴブリンドバーグ',1);
const hope=xyzWith('No.39 希望皇ホープ',1,[m1,m2]);gameState.players[1].mz=[hope];
gameState.players[0].mz=[mk('サイバー・ドラゴン',0)];
baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});toPoint();
pointActivateV27(1,'mz',0);
const was=isDetachPrompt();
__choiceCancelV49();
ok('A2: cancelling the material choice aborts the activation (both materials stay, no chain link)',
  was&&!pc()&&hope.xyz.length===2&&!gameState.chain.length&&!detachActions().length,JSON.stringify({was,xyz:hope.xyz.map(nm),chain:gameState.chain.length}));
`);

/* ===== B. インヴェルズ・ローチ — opponent's chain-less Lv5+ Special Summon → choose which material ===== */
harness(COMMON+String.raw`
resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
const r1=mk('ワイト',1), r2=mk('ゴブリンドバーグ',1);
const roach=xyzWith('インヴェルズ・ローチ',1,[r1,r2]);gameState.players[1].mz=[roach];
const cyber=mk('サイバー・ドラゴン',0);gameState.players[0].hand=[cyber];
baselineA();
runSummonProcedure('サイバー・ドラゴン',0,'hand',0);
if(!gameState.pendingSummon&&!pc())finishSummonProcedure('サイバー・ドラゴン',0,'hand',0,'atk');
ok('B setup: the サイバー・ドラゴン procedure waits in the summon window',!!gameState.pendingSummon,JSON.stringify(gameState.pendingSummon));
activateSummonNegatorV2(1,'mz',0);
ok('B: Roach\'s cost asks which of its 2 materials to detach',isDetachPrompt()&&pc().candidates.length===2,JSON.stringify(pc()&&pc().candidates.map(c=>c.label)));
answerChoiceV49([keyOfMat(r1)]);
drive();
ok('B: only the chosen material (ワイト) is detached; ゴブリンドバーグ stays',roach.xyz.length===1&&roach.xyz[0]===r2&&names(1,'grave').includes('ワイト'),JSON.stringify({xyz:roach.xyz.map(nm),g1:names(1,'grave')}));
ok('B: the Special Summon is negated and サイバー・ドラゴン destroyed',z(cyber)==='grave'&&!gameState.pendingSummon,JSON.stringify({cyber:z(cyber),pending:!!gameState.pendingSummon}));
audit('B');
`);

/* ===== C. エヴォルカイザー・ラギア — 2 materials must be chosen (of 3) ===== */
harness(COMMON+String.raw`
resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
const a=mk('ワイト',1), b=mk('ガガガマジシャン',1), c=mk('ゴブリンドバーグ',1);
const ragia=xyzWith('エヴォルカイザー・ラギア',1,[a,b,c]);gameState.players[1].mz=[ragia];
const cy=mk('サイクロン',0,'down');cy.setTurn=4;gameState.players[0].sz=[cy];
const tgt=mk('ワイト',1,'down');tgt.setTurn=4;gameState.players[1].sz=[tgt];
baselineA();
duelActivateFromZone(0,'sz',0);
if(pc())__choicePickV49(0);          /* サイクロン's target */
const resp=(gameState.chainWindow&&gameState.chain.length)?getChainResponsesV2(1):[];
ok('C setup: Ragia is offered against the Spell activation',resp.some(r=>r.db.n==='エヴォルカイザー・ラギア'),JSON.stringify(resp.map(r=>r.db.n)));
duelActivateResponseV2(1,'mz',0);
ok('C: the cost asks for 2 of the 3 materials',isDetachPrompt()&&pc().candidates.length===3&&pc().min===2&&pc().max===2,JSON.stringify(pc()&&{min:pc().min,max:pc().max,c:pc().candidates.length}));
const oneOnly=answerChoiceV49([keyOfMat(a)]);
ok('C: choosing only 1 is refused — the choice stays open, nothing detached',oneOnly===false&&isDetachPrompt()&&ragia.xyz.length===3,JSON.stringify({oneOnly,xyz:ragia.xyz.length}));
answerChoiceV49([keyOfMat(a),keyOfMat(c)]);
drive();
ok('C: exactly the 2 chosen materials (ワイト, ゴブリンドバーグ) are detached; ガガガマジシャン stays',
  ragia.xyz.length===1&&ragia.xyz[0]===b&&names(1,'grave').includes('ワイト')&&names(1,'grave').includes('ゴブリンドバーグ'),JSON.stringify({xyz:ragia.xyz.map(nm),g1:names(1,'grave')}));
ok('C: サイクロン is negated and destroyed; the set card survives',z(cy)==='grave'&&z(tgt)==='sz',JSON.stringify({cy:z(cy),tgt:z(tgt)}));
audit('C');
const da=detachActions();
ok('E: both chosen UIDs are journaled',da.length===2&&da.map(x=>x.materialUid).sort().join()===[a.uid,c.uid].sort().join(),JSON.stringify(da.map(x=>x.materialUid)));
`);

/* ===== D. ownership — an opponent-owned material goes to its owner's GY ===== */
harness(COMMON+String.raw`
resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
const own=mk('ガガガマジシャン',0), foreign=mk('ゴブリンドバーグ',1);
const eye=xyzWith('No.11 ビッグ・アイ',0,[own,foreign]);gameState.players[0].mz=[eye];
const victim=mk('ワイト',1,'up');gameState.players[1].mz=[victim];
baselineA();
duelActivateFromZone(0,'mz',0);
ok('D: Big Eye\'s cost asks which material; the opponent-owned one is labelled as such',isDetachPrompt()&&pc().candidates.some(c=>/所有/.test(c.label)),JSON.stringify(pc()&&pc().candidates.map(c=>c.label)));
answerChoiceV49([keyOfMat(foreign)]);
ok('D: after the detach, the target prompt (registered) asks for the opponent monster',!!pc()&&!isDetachPrompt()&&pc().candidates.length===1,JSON.stringify(pc()&&pc().title));
__choicePickV49(0);drive();
ok('D: the opponent-owned material went to its OWNER\'s (P2) GY, not the controller\'s',names(1,'grave').includes('ゴブリンドバーグ')&&!names(0,'grave').includes('ゴブリンドバーグ')&&eye.xyz.length===1&&eye.xyz[0]===own,
  JSON.stringify({g0:names(0,'grave'),g1:names(1,'grave'),xyz:eye.xyz.map(nm)}));
ok('D: Big Eye took control of the target',gameState.players[0].mz.includes(victim),JSON.stringify(names(0,'mz')));
audit('D');
`);

/* ===== G. one material → no prompt (auto); unknown material UID never falls back to the first ===== */
harness(COMMON+String.raw`
resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='battle';
const only=mk('ゴブリンドバーグ',1);
const hope=xyzWith('No.39 希望皇ホープ',1,[only]);gameState.players[1].mz=[hope];
gameState.players[0].mz=[mk('サイバー・ドラゴン',0)];
baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});toPoint();
pointActivateV27(1,'mz',0);
ok('G: with a single material no choice is shown; it is detached and the effect chains',!isDetachPrompt()&&hope.xyz.length===0&&names(1,'grave').includes('ゴブリンドバーグ'),JSON.stringify({pc:pc()&&pc().title,xyz:hope.xyz.length}));
resetA();
const x1=mk('ワイト',0), x2=mk('ガガガマジシャン',0);
const eye=xyzWith('No.11 ビッグ・アイ',0,[x1,x2]);gameState.players[0].mz=[eye];baselineA();
act({type:'FX_DETACH',player:0,mzIndex:0,materialUid:987654321,reason:'test'});
ok('G: FX_DETACH with an unknown material UID detaches nothing (no silent fallback to the first)',eye.xyz.length===2,JSON.stringify(eye.xyz.map(nm)));
`);

/* ===== F. SaveLoad — a save taken inside the material choice resumes with the same candidates and count ===== */
const first=harness(COMMON+String.raw`
resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
const a=mk('ワイト',1), b=mk('ガガガマジシャン',1), c=mk('ゴブリンドバーグ',1);
const ragia=xyzWith('エヴォルカイザー・ラギア',1,[a,b,c]);gameState.players[1].mz=[ragia];
const cy=mk('サイクロン',0,'down');cy.setTurn=4;gameState.players[0].sz=[cy];
const tgt=mk('ワイト',1,'down');tgt.setTurn=4;gameState.players[1].sz=[tgt];
baselineA();
duelActivateFromZone(0,'sz',0);if(pc())__choicePickV49(0);
duelActivateResponseV2(1,'mz',0);
ok('F setup: waiting in the Ragia material choice (2 of 3)',isDetachPrompt()&&pc().min===2);
globalThis.__SAVE=captureSave();
globalThis.__UIDS={a:a.uid,b:b.uid,c:c.uid};
globalThis.__KEYS=pc().candidates.map(x=>x.key);
`);
harness('const SAVE='+JSON.stringify(first.__SAVE)+';const UIDS='+JSON.stringify(first.__UIDS)+';const KEYS='+JSON.stringify(first.__KEYS)+';'+COMMON+String.raw`
resetA();
localStorage.setItem(DUEL_SAVE_KEY,SAVE);
const resumed=offerResumeDuel();
ok('F: the save resumes',resumed===true,String(resumed));
ok('F: after the reload the same material choice is pending — same candidates, same required count (2)',
  isDetachPrompt()&&JSON.stringify(pc().candidates.map(x=>x.key))===JSON.stringify(KEYS)&&pc().min===2&&pc().max===2,
  JSON.stringify(pc()&&{keys:pc().candidates.map(x=>x.key),min:pc().min}));
answerChoiceV49(['mat:'+UIDS.a,'mat:'+UIDS.b]);
drive();
const ragia=gameState.players[1].mz.find(x=>cardName(x)==='エヴォルカイザー・ラギア');
ok('F: answering after the reload detaches the 2 chosen materials and the activation continues (サイクロン negated)',
  ragia&&ragia.xyz.length===1&&ragia.xyz[0].uid===UIDS.c&&gameState.players[0].grave.some(x=>cardName(x)==='サイクロン'),
  JSON.stringify({xyz:ragia&&ragia.xyz.map(x=>x.uid),g0:names(0,'grave')}));
audit('F');
`);

/* ===== H. the other converted consumers, each on its real activation path: 2 materials → prompt → the 2nd is removed ===== */
harness(COMMON+String.raw`
function run(name, setup, how){
  resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
  const w1=mk('ワイト',0), w2=mk('ゴブリンドバーグ',0);
  const x=xyzWith(name,0,[w1,w2]);gameState.players[0].mz=[x];
  if(setup) setup(x);
  baselineA();
  (how||(()=>duelActivateFromZone(0,'mz',0)))();
  const prompted=isDetachPrompt()&&pc().candidates.length===2;
  if(prompted) answerChoiceV49([keyOfMat(w2)]);
  for(let i=0;i<4&&pc()&&!isDetachPrompt();i++){ __choicePickV49(0); }
  drive();
  ok('H '+name+': asks which of 2 materials, removes only the chosen one',
    prompted&&x.xyz.length===1&&x.xyz[0]===w1&&names(0,'grave').includes('ゴブリンドバーグ'),
    JSON.stringify({prompted,xyz:x.xyz.map(nm),g0:names(0,'grave'),toasts:TOASTS.slice(-2)}));
}
run('No.17 リバイス・ドラゴン');
run('No.20 蟻岩土ブリリアント');
run('潜航母艦エアロ・シャーク');
run('サンダーエンド・ドラゴン',()=>{gameState.players[1].mz=[mk('ワイト',1,'up')];});
run('No.10 白輝士イルミネーター',()=>{gameState.players[0].hand=[mk('サイクロン',0)];gameState.players[0].deck=[mk('ワイト',0),mk('ワイト',0)];});
run('発条機甲ゼンマイスター');
run('No.34 電算機獣テラ・バイト',()=>{gameState.players[1].mz=[mk('ワイト',1,'up')];});
run('ダイガスタ・フェニクス');
run('ヴァイロン・ディシグマ',()=>{gameState.players[1].mz=[mk('サイバー・ドラゴン',1,'up')];});
run('虚空海竜リヴァイエール',()=>{gameState.players[1].banish=[mk('ワイト',1)];});
run('No.16 色の支配者ショック・ルーラー');
/* Spells / Traps that detach from one of your own Xyz monsters */
run('No.39 希望皇ホープ',()=>{const e=mk('エクシーズエナジー',0,'down');e.setTurn=4;gameState.players[0].sz=[e];gameState.players[1].mz=[mk('ワイト',1,'up')];},
    ()=>duelActivateFromZone(0,'sz',0));
run('No.39 希望皇ホープ',()=>{const t=mk('皇の波動',0,'down');t.setTurn=4;gameState.players[0].sz=[t];},
    ()=>duelActivateFromZone(0,'sz',0));
`);

/* ===== I. スペース・サイクロン — the activating player chooses which material of the targeted Xyz monster ===== */
harness(COMMON+String.raw`
resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
const f1=mk('ワイト',1), f2=mk('ゴブリンドバーグ',1);
const foe=xyzWith('No.39 希望皇ホープ',1,[f1,f2]);gameState.players[1].mz=[foe];
const sc=mk('スペース・サイクロン',0,'down');sc.setTurn=4;gameState.players[0].sz=[sc];
baselineA();
duelActivateFromZone(0,'sz',0);if(pc()&&!isDetachPrompt())__choicePickV49(0);
drive();
ok('I: at resolution the activating player (P1) is asked which material to remove',isDetachPrompt()&&pc().player===0&&pc().candidates.length===2&&!pc().cancelable,JSON.stringify(pc()&&{p:pc().player,c:pc().candidates.length}));
answerChoiceV49([keyOfMat(f1)]);drive();
ok('I: only the chosen material is removed, to its owner\'s GY',foe.xyz.length===1&&foe.xyz[0]===f2&&names(1,'grave').includes('ワイト'),JSON.stringify({xyz:foe.xyz.map(nm),g1:names(1,'grave')}));
audit('I');
`);

/* ===== J. static: no card still calls the first-material path except 鬼神の連撃 (removes ALL materials: no choice needed) ===== */
{
  const fs=require('fs'),path=require('path');
  const dir=path.join(__dirname,'..','cards');
  const hits=[];
  fs.readdirSync(dir).filter(f=>f.endsWith('.js')).forEach(f=>{
    /* blank out block comments (line numbers kept) so prose that mentions the API is not counted */
    fs.readFileSync(path.join(dir,f),'utf8').replace(/\/\*[\s\S]*?\*\//g,m=>m.replace(/[^\n]/g,' ')).split('\n').forEach((l,i)=>{
      if(/API\.detachMaterial\(/.test(l) && !/^\s*(\/\/|\*|\/\*)/.test(l)) hits.push(f+':'+(i+1));
    });
  });
  const allowed=hits.filter(h=>/A1_ready25_b3\.js/.test(h));
  const bad=hits.filter(h=>allowed.indexOf(h)<0);
  console.log((bad.length?'FAIL ':'PASS ')+'J: API.detachMaterial (first material) is only used by 鬼神の連撃, which removes ALL materials (no choice needed)'+(bad.length?' :: '+JSON.stringify(bad):''));
  if(bad.length) process.exitCode=2;
  const mustDeclare=['グレンザウルス（コスト）','イビリチュア・メロウガイスト（コスト）','カチコチドラゴン（コスト）'];
  const src=fs.readdirSync(dir).filter(f=>f.endsWith('.js')).map(f=>fs.readFileSync(path.join(dir,f),'utf8')).join('\n');
  const miss=mustDeclare.filter(r=>src.indexOf("detachCostS03:{count:1,reason:'"+r+"'")<0);
  console.log((miss.length?'FAIL ':'PASS ')+'J: the damage-step detach costs (グレンザウルス / メロウガイスト / カチコチ) declare detachCostS03'+(miss.length?' :: '+JSON.stringify(miss):''));
  if(miss.length) process.exitCode=2;
  const acid=src.indexOf("requestDetachMaterialS03({player:ctx.player,holderUid:ctx.card.uid,count:1,reason:'No.30 破滅のアシッド・ゴーレム'")>=0;
  console.log((acid?'PASS ':'FAIL ')+'J: No.30 アシッド・ゴーレム\'s Standby detach uses the choice primitive');
  if(!acid) process.exitCode=2;
}
