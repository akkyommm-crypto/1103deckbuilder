/* S03-U357: 踊りによる誘発, 亀の誓い, ハンバーガーのレシピ, 大邪神 レシェフ.
   Real DUEL paths (Ritual Spells through the engine ritual path, an ignition control steal), Replay-audited. */
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3570001;
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



const DAN='ダンシング・ソルジャー',TUR='クラブ・タートル',BUR='ハングリーバーガー',LES='大邪神 レシェフ';
const S_DAN='踊りによる誘発',S_TUR='亀の誓い',S_BUR='ハンバーガーのレシピ';
function pz(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pp(c){const h=findCardByUid(c.uid);return h?h.p:null;}
function actC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function ritual(spellName,prefer){const i=gameState.players[0].hand.findIndex(c=>cardName(c)===spellName);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}

/* ===== the three Ritual Spells ===== */
const SETS=[[S_DAN,DAN,6],[S_TUR,TUR,8],[S_BUR,BUR,6]];
SETS.forEach(([sp,rm,lv])=>{
  { fresh();const s=mk(sp,0),m=mk(rm,0),big=mon('青眼の白龍',0);gameState.players[0].hand=[s,m];gameState.players[0].mz=[big];baselineA();
    ok(sp+': activatable with a Level 8 monster as the Tribute (needs '+lv+' or more)',API.ritualCanActivate(0,sp)===true,'');
    ritual(sp,[m.uid,big.uid]);
    ok(sp+': '+rm+' Ritual Summoned, the material and the Spell in the Graveyard',pz(m)==='mz'&&pz(big)==='grave'&&pz(s)==='grave',JSON.stringify({m:pz(m),big:pz(big),s:pz(s)}));
    audit(sp+' 1'); }
  { fresh();const s=mk(sp,0),m=mk(rm,0),lo=mon('サファイアドラゴン',0);gameState.players[0].hand=[s,m];gameState.players[0].mz=[lo];baselineA();
    ok(sp+' negative: Level 4 alone is not enough',API.ritualCanActivate(0,sp)===false,''); }
  { fresh();const s=mk(sp,0),big=mon('青眼の白龍',0);gameState.players[0].hand=[s];gameState.players[0].mz=[big];baselineA();
    ok(sp+' negative: the Ritual Monster is not in the hand',API.ritualCanActivate(0,sp)===false,''); }
});
{ fresh();const s=mk(S_BUR,0),m=mk(BUR,0),a=mon('サファイアドラゴン',0),b=mon('おジャマ・イエロー',0);gameState.players[0].hand=[s,m];gameState.players[0].mz=[a,b];baselineA();
  ok('ハンバーガーのレシピ: Levels 4 + 2 = 6 can be offered together',API.ritualCanActivate(0,S_BUR)===true,'');
  ritual(S_BUR,[m.uid,a.uid,b.uid]);
  ok('ハンバーガーのレシピ: summoned with two Tributes',pz(m)==='mz'&&pz(a)==='grave'&&pz(b)==='grave',JSON.stringify({m:pz(m),a:pz(a),b:pz(b)}));
  audit('ハンバーガー 2'); }

/* ===== 大邪神 レシェフ ===== */
{ fresh();const l=mon(LES,0),sp=mk('ブラック・ホール',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[l];gameState.players[0].hand=[sp];gameState.players[1].mz=[f];baselineA();
  ok('レシェフ: a Spell in hand and an opposing monster -> can activate',canZ(l),'');
  actC(l,[sp.uid,f.uid]);
  ok('レシェフ: the Spell discarded, the opposing monster is mine',pz(sp)==='grave'&&pp(f)===0&&pz(f)==='mz',JSON.stringify({sp:pz(sp),p:pp(f)}));
  ok('レシェフ: once per turn',!canZ(l),'');
  audit('レシェフ 1');
  phase('end');drive();
  ok('レシェフ: the monster returns at the End Phase',pp(f)===1,String(pp(f))); }
{ fresh();const l=mon(LES,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[l];gameState.players[1].mz=[f];baselineA();
  ok('レシェフ negative: no Spell in hand',!canZ(l),''); }
{ fresh();const l=mon(LES,0),mm=mk('ワイト',0);gameState.players[0].mz=[l];gameState.players[0].hand=[mm];gameState.players[1].mz=[mon('青眼の白龍',1)];baselineA();
  ok('レシェフ negative: only a monster in hand',!canZ(l),''); }

console.log('U357 done');
`);
