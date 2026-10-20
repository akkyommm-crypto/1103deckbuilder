/* S03-U364: デス・モスキート, メタル・シューター, コンボファイター, コンボマスター (and the destroy-substitute kind "counter").
   Real DUEL paths (counters and ATK, a counter removed instead of the destruction, a chain in Main Phase 1 granting a second attack), Replay-audited. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pl(c){const h=findCardByUid(c.uid);return h?h.p:null;}
function C(c){const h=findCardByUid(c.uid);return h?h.card:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));return pkg;}
function uid(c){return ensureCardUid(gameState,c);}
let PREFER=[];
function pick(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<800;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3640001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function lp(p){return gameState.players[p].lp;}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function atkTarget(p,c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(c),target:t==='direct'?'direct':idx(t)});drive();}
function startTurn(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function endTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();startTurn();}
function toOppBattle(){endTurn();phase('battle');}
function canZ(c){return getLegalZoneActions(0,'mz',idx(c)).map(a=>a.id).indexOf('effect')>=0;}
function actZ(c){duelActivateFromZone(0,'mz',idx(c));drive();}
function procOk(name,i){return strictSummonProcedureLegality(name,0,'hand',i).ok;}
function procRun(name,i){runSummonProcedure(name,0,'hand',i);if(!gameState.pendingSummon&&!pc())finishSummonProcedure(name,0,'hand',i,'atk');drive();}



function summonVia(i,tributes){const p=gameState.activePlayer,db=dbOf(gameState.players[p].hand[i]);const ms=normalSummonMethodsFor(db,p,'summon');const m=ms.find(x=>x.tributes===tributes)||ms[0];
  pickTributes(p,m.tributes,[],payment=>finishNormalSummon(i,'atk',payment,m.id,null),db,m,'summon');drive();}
const MOS='デス・モスキート',MET='メタル・シューター',CF='コンボファイター',CM='コンボマスター';
function pz(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pp(c){const h=findCardByUid(c.uid);return h?h.p:null;}
function cnt(c){const h=findCardByUid(c.uid);return h?API.countCounter(h,'カウンター'):-1;}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}

/* ===== デス・モスキート ===== */
{ fresh();const m=mk(MOS,0);gameState.players[0].hand=[m];baselineA();
  doNormalSummon(0,'atk');drive();
  ok('モスキート: Normal Summoned -> 2 counters, ATK 500 + 1000 = 1500',pz(m)==='mz'&&cnt(m)===2&&curATK(C(m))===1500,JSON.stringify({z:pz(m),n:cnt(m),a:C(m)&&curATK(C(m))}));
  audit('モスキート 1'); }
{ fresh();const m=mk(MOS,0),rv=mk('死者蘇生',0);gameState.players[0].grave=[m];gameState.players[0].hand=[rv];baselineA();
  cast(0,'死者蘇生',[m.uid]);
  ok('モスキート: Special Summoned -> 2 counters too',pz(m)==='mz'&&cnt(m)===2,JSON.stringify({z:pz(m),n:cnt(m)})); }
{ fresh();const m=mon(MOS,0),f=mon('青眼の白龍',1);m.counters={'カウンター':2};gameState.players[0].mz=[m];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,m);
  ok('モスキート: destroyed by battle -> a counter is removed instead (1 left), it stays',pz(m)==='mz'&&cnt(m)===1,JSON.stringify({z:pz(m),n:cnt(m)}));
  audit('モスキート 2'); }
{ fresh();const m=mon(MOS,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[m];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,m);
  ok('モスキート: with no counters left it is destroyed by battle',pz(m)==='grave',pz(m)); }
{ fresh();const m=mon(MOS,0),f=mon('青眼の白龍',1);m.counters={'カウンター':1};gameState.players[0].mz=[m];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,m);
  ok('モスキート: the last counter is used (0 left) and it stays',pz(m)==='mz'&&cnt(m)===0,JSON.stringify({z:pz(m),n:cnt(m)})); }
{ fresh();const m=mon(MOS,0),bh=mk('ブラック・ホール',1);m.counters={'カウンター':2};gameState.activePlayer=1;gameState.players[0].mz=[m];gameState.players[1].hand=[bh];baselineA();
  cast(1,'ブラック・ホール');
  ok('モスキート control: destroyed by an EFFECT (the substitute is for battle only) -> destroyed',pz(m)==='grave',JSON.stringify({z:pz(m)})); }

/* ===== メタル・シューター ===== */
{ fresh();const m=mk(MET,0),w=mon('ワイト',0);gameState.players[0].hand=[m];gameState.players[0].mz=[w];baselineA();
  summonVia(0,1);drive();
  ok('シューター: Normal Summoned (tribute if needed) -> 2 counters, ATK 800 + 1600 = 2400',pz(m)==='mz'&&cnt(m)===2&&curATK(C(m))===2400,JSON.stringify({z:pz(m),n:cnt(m)})); }
{ fresh();const m=mon(MET,0),bh=mk('ブラック・ホール',1);m.counters={'カウンター':2};gameState.activePlayer=1;gameState.players[0].mz=[m];gameState.players[1].hand=[bh];baselineA();
  cast(1,'ブラック・ホール');
  ok('シューター: destroyed by an effect -> a counter is removed instead (1 left), it stays',pz(m)==='mz'&&cnt(m)===1,JSON.stringify({z:pz(m),n:cnt(m)}));
  audit('シューター 1'); }
{ fresh();const m=mon(MET,0),f=mon('青眼の白龍',1);m.counters={'カウンター':2};m.pos='def';gameState.players[0].mz=[m];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,m);
  ok('シューター control: destroyed by BATTLE (DEF 800) -> destroyed (the substitute is for effects only)',pz(m)==='grave',pz(m)); }

/* ===== コンボファイター / コンボマスター ===== */
[[CF,1600],[CM,2200]].forEach(([nm,atk])=>{
  { fresh();const c=mon(nm,0),sp=mk('強欲な壺',0),f=mon('ワイト',1);gameState.players[0].mz=[c];gameState.players[0].hand=[sp];gameState.players[1].mz=[f];baselineA();
    cast(0,'強欲な壺');
    phase('battle');atkTarget(0,c,f);
    const f2=mon('ワイト',1);
    ok(nm+': a chain in my Main Phase 1 -> it may attack twice this Battle Phase (the first attack destroyed ワイト)',pz(f)==='grave',pz(f));
    ok(nm+': the second attack is possible (direct attack)',(()=>{const l1=lp(1);atkTarget(0,c,'direct');return lp(1)===l1-atk;})(),String(lp(1)));
    audit(nm+' 1'); }
  { fresh();const c=mon(nm,0),f=mon('ワイト',1);gameState.players[0].mz=[c];gameState.players[1].mz=[f];baselineA();
    phase('battle');atkTarget(0,c,f);const l1=lp(1);atkTarget(0,c,'direct');
    ok(nm+' control: no chain in Main Phase 1 -> only one attack (the direct attack is refused)',lp(1)===l1,String(l1-lp(1))); }
});

console.log('U364 done');
`);
