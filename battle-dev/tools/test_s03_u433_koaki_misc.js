/* S03-U433: コアキメイル・デビル, コアキメイル・パワーハンド, G・コザッキー, ターレット・ウォリアー, バイス・ドラゴン, デス・カンガルー (stale ENGINE_GAP cards).
   Real DUEL paths, Replay-audited. */
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
let PREFER=[];function pick(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}
  if(q.min>1){const keys=[];PREFER.forEach(u=>{const x=q.candidates.find(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(x&&keys.length<q.max&&keys.indexOf(x.key)<0)keys.push(x.key);});q.candidates.forEach(x=>{if(keys.length<q.min&&keys.indexOf(x.key)<0)keys.push(x.key);});answerChoiceV49(keys);return;}SEEN.push({title:q.title,cands:q.candidates.map(x=>x.uid||x.value||x.key)});let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(j>=0)break;}if(j>=0){const u=PREFER.find(u=>q.candidates.some(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u)));PREFER.splice(PREFER.indexOf(u),1);}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<800;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4210001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function lp(p){return gameState.players[p].lp;}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function startTurn(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function endTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();startTurn();}
function toOppBattle(){endTurn();phase('battle');}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function actC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function equipped(host,eq){const h=C(host),e=C(eq);return !!h&&!!e&&e.equipTo&&e.equipTo.uid===host.uid&&Array.isArray(h.equippedBy)&&h.equippedBy.indexOf(e.equipUid)>=0;}
function legalH(i){const acts=getLegalHandActions(0,i||0);return {ok:acts.some(x=>x.id==='activate'),actions:acts.map(x=>x.id)};}
function cc(c){const x=C(c);return x&&x.counters?Number(x.counters['魔力'])||0:0;}
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}

function offeredTo(p,c){return !!(gameState.chainWindow&&gameState.chain.length&&getChainResponsesV2(p).some(x=>x.card===c));}
function respond(p,c,prefer){const hh=findCardByUid(c.uid); if(!hh) return false;
  PREFER=(prefer||[]).slice();duelActivateResponseV2(p,hh.zone,hh.index);for(let i=0;i<10&&pc();i++)pick();PREFER=[];return true;}
function foeCast(name,prefer){const i=gameState.players[1].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);for(let i2=0;i2<10&&pc();i2++)pick();PREFER=[];}
function actZ(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function canZ(c){return getLegalZoneActions(0,'mz',idx(c)).map(a=>a.id).indexOf('effect')>=0;}

function sz(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function actSz(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'sz',idx(c));drive();PREFER=[];}
function legalSz(c){return strictScriptLegalityV2(cardName(c),0,'sz',idx(c)).ok;}
function gv(c){return curATK(C(c));}



































































const SEEN=[];
const DEV='コアキメイル・デビル',PHD='コアキメイル・パワーハンド',GKO='G・コザッキー',TUR='ターレット・ウォリアー',VIC='バイス・ドラゴン',KAN='デス・カンガルー',CORE='コアキメイルの鋼核';
function procOk(name,i){return strictSummonProcedureLegality(name,0,'hand',i).ok;}
function procRun(name,i){runSummonProcedure(name,0,'hand',i);if(!gameState.pendingSummon&&!pc())finishSummonProcedure(name,0,'hand',i,'atk');drive();}
function myAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function H(c){return findCardByUid(c.uid);}

/* ===== コアキメイル・デビル ===== */
{ fresh();const d=mon(DEV,0),co=mk(CORE,0);gameState.players[0].mz=[d];gameState.players[0].hand=[co];baselineA();
  phase('end');
  ok('デビル: End Phase — 鋼核 sent to the Graveyard, it stays',z(d)==='mz'&&z(co)==='grave',JSON.stringify([z(d),z(co)]));
  audit('デビル upkeep'); }
{ fresh();const d=mon(DEV,0),fi=mk('ダーク・ネクロフィア',0);gameState.players[0].mz=[d];gameState.players[0].hand=[mk('ワイト',0)];baselineA();
  phase('end');
  ok('デビル: no 鋼核 and no 悪魔族 in hand → destroyed',z(d)==='grave',z(d)); }
{ fresh();const d=mon(DEV,0),dm=mk('G・コザッキー',0);gameState.players[0].mz=[d];gameState.players[0].hand=[dm];baselineA();
  phase('end');
  ok('デビル: no 鋼核 but a 悪魔族 shown → stays (the shown card stays in hand)',z(d)==='mz'&&z(dm)==='hand',JSON.stringify([z(d),z(dm)])); }
{ fresh();const d=mon(DEV,0),li=mon('ライオウ',1),dk=mon('キラー・トマト',1),ea=mon('7つの武器を持つハンター',1);gameState.players[0].mz=[d];gameState.players[1].mz=[li,dk,ea];baselineA();
  ok('デビル: in the Main Phase the effects of face-up LIGHT and DARK monsters are negated, an EARTH monster is not',API.isEffectNegated(H(li))===true&&API.isEffectNegated(H(dk))===true&&API.isEffectNegated(H(ea))===false,JSON.stringify([API.isEffectNegated(H(li)),API.isEffectNegated(H(dk)),API.isEffectNegated(H(ea))]));
  phase('battle');
  ok('デビル: in the Battle Phase nothing is negated',API.isEffectNegated(H(li))===false&&API.isEffectNegated(H(dk))===false,JSON.stringify([API.isEffectNegated(H(li)),API.isEffectNegated(H(dk))])); }
{ fresh();const li=mon('ライオウ',1);gameState.players[1].mz=[li];baselineA();
  ok('デビル control: without it the LIGHT monster is not negated in the Main Phase',API.isEffectNegated(H(li))===false,''); }

/* ===== コアキメイル・パワーハンド ===== */
{ fresh();const p=mon(PHD,0),tr=mk('落とし穴',0);gameState.players[0].mz=[p];gameState.players[0].hand=[tr];baselineA();
  phase('end');
  ok('パワーハンド: no 鋼核 but a Normal Trap shown → stays',z(p)==='mz'&&z(tr)==='hand',JSON.stringify([z(p),z(tr)]));
  audit('パワーハンド upkeep'); }
{ fresh();const p=mon(PHD,0),tr=mk('リビングデッドの呼び声',0);gameState.players[0].mz=[p];gameState.players[0].hand=[tr];baselineA();
  phase('end');
  ok('パワーハンド: a Continuous Trap is not a Normal Trap → destroyed',z(p)==='grave',z(p)); }
{ fresh();const p=mon(PHD,0),li=mon('ライオウ',1),li2=mon('ライオウ',1),ea=mon('7つの武器を持つハンター',1);gameState.players[0].mz=[p];gameState.players[1].mz=[li,li2,ea];baselineA();
  phase('battle');
  ok('パワーハンド control: no battle going on → the LIGHT monster is not negated',API.isEffectNegated(H(li))===false,'');
  gameState.battle={player:0,atkIdx:0,target:0,atkUid:ensureCardUid(gameState,p),targetUid:ensureCardUid(gameState,li),step:'start'};
  ok('パワーハンド: in battle with it the LIGHT monster\'s effect is negated; another LIGHT monster is not',API.isEffectNegated(H(li))===true&&API.isEffectNegated(H(li2))===false,JSON.stringify([API.isEffectNegated(H(li)),API.isEffectNegated(H(li2))]));
  gameState.battle={player:0,atkIdx:0,target:2,atkUid:ensureCardUid(gameState,p),targetUid:ensureCardUid(gameState,ea),step:'start'};
  ok('パワーハンド: battling an EARTH monster negates nothing',API.isEffectNegated(H(ea))===false,'');
  gameState.battle=null;gameState.phase='main2';
  ok('パワーハンド: outside the Battle Phase the LIGHT monster is not negated',API.isEffectNegated(H(li))===false,''); }

/* ===== G・コザッキー ===== */
{ fresh();const g=mon(GKO,0),k=mon('コザッキー',1);gameState.players[0].mz=[g];gameState.players[1].mz=[k];baselineA();
  ok('G・コザッキー: a face-up コザッキー on the field (either side) → it stays',z(g)==='mz',z(g));
  const l0=lp(0);API.destroy(H(k),'test');flushDeferredEventsV2();drive();
  ok('G・コザッキー: no コザッキー left → destroyed, and its original ATK (2500) is dealt to its controller',z(g)==='grave'&&l0-lp(0)===2500,JSON.stringify([z(g),l0,lp(0)]));
  audit('G・コザッキー 1'); }

/* ===== ターレット・ウォリアー ===== */
{ fresh();const t=mk(TUR,0),w=mon('7つの武器を持つハンター',0);gameState.players[0].hand=[t];gameState.players[0].mz=[w];baselineA();
  ok('ターレット: a Warrior on my field → Special Summonable from the hand',procOk(TUR,0)===true,'');
  PREFER=[uid(w)];procRun(TUR,0);PREFER=[];
  ok('ターレット: the Warrior was sent to the Graveyard and its original ATK (1000) was added (1200 → 2200)',z(t)==='mz'&&z(w)==='grave'&&curATK(C(t))===2200,JSON.stringify([z(t),z(w),curATK(C(t))]));
  audit('ターレット 1'); }
{ fresh();const t=mk(TUR,0),n=mon('ワイト',0);gameState.players[0].hand=[t];gameState.players[0].mz=[n];baselineA();
  ok('ターレット negative: no Warrior on my field → not Special Summonable',procOk(TUR,0)===false,''); }

/* ===== バイス・ドラゴン ===== */
{ fresh();const v=mk(VIC,0),f=mon('ワイト',1);gameState.players[0].hand=[v];gameState.players[1].mz=[f];baselineA();
  ok('バイス・ドラゴン: only the opponent has a monster → Special Summonable from the hand',procOk(VIC,0)===true,'');
  procRun(VIC,0);
  ok('バイス・ドラゴン: its original ATK / DEF are halved (2000 / 2400 → 1000 / 1200)',z(v)==='mz'&&curATK(C(v))===1000&&curDEF(C(v))===1200,JSON.stringify([z(v),curATK(C(v)),curDEF(C(v))]));
  audit('バイス 1'); }
{ fresh();const v=mk(VIC,0),m=mon('ワイト',0),f=mon('ワイト',1);gameState.players[0].hand=[v];gameState.players[0].mz=[m];gameState.players[1].mz=[f];baselineA();
  ok('バイス・ドラゴン negative: I control a monster → not Special Summonable',procOk(VIC,0)===false,''); }
{ fresh();const v=mk(VIC,0);gameState.players[0].hand=[v];baselineA();
  ok('バイス・ドラゴン negative: the opponent has no monster → not Special Summonable',procOk(VIC,0)===false,''); }

/* ===== デス・カンガルー ===== */
{ fresh();const k=mon(KAN,1,'def'),a=mon('ワイト',0);gameState.players[0].mz=[a];gameState.players[1].mz=[k];baselineA();
  phase('battle');myAttack(a,k);
  ok('デス・カンガルー: attacked in Defense Position by ATK 1200 < DEF 1700 → the attacker is destroyed, it survives',z(a)==='grave'&&z(k)==='mz',JSON.stringify([z(a),z(k)]));
  audit('カンガルー 1'); }
{ fresh();const k=mon(KAN,1,'def'),a=mon('青眼の白龍',0);gameState.players[0].mz=[a];gameState.players[1].mz=[k];baselineA();
  phase('battle');myAttack(a,k);
  ok('デス・カンガルー negative: attacker ATK 3000 ≥ DEF 1700 → the attacker survives, the Kangaroo is destroyed',z(a)==='mz'&&z(k)==='grave',JSON.stringify([z(a),z(k)])); }
{ fresh();const k=mon(KAN,1,'atk'),a=mon('ガトリングバギー',0);gameState.players[0].mz=[a];gameState.players[1].mz=[k];baselineA();
  phase('battle');myAttack(a,k);
  ok('デス・カンガルー negative: Attack Position → no effect (ATK 1600 vs 1500, the Kangaroo is destroyed by battle only)',z(a)==='mz'&&z(k)==='grave',JSON.stringify([z(a),z(k)])); }

/* ===== U432 follow-up: ゴーレム also negates the continuous effect of a LIGHT monster (ブレイドナイト +400) ===== */
{ fresh();const g=mon('ゴーレム',1),b=mon('ブレイドナイト',0);gameState.players[0].mz=[b];gameState.players[0].hand=[];gameState.players[1].mz=[g];baselineA();
  ok('ゴーレム follow-up: the LIGHT ブレイドナイト loses its continuous +400 ATK (1600)',curATK(C(b))===1600,String(curATK(C(b)))); }
{ fresh();const b=mon('ブレイドナイト',0);gameState.players[0].mz=[b];gameState.players[0].hand=[];baselineA();
  ok('ゴーレム follow-up control: without ゴーレム ブレイドナイト keeps +400 (2000)',curATK(C(b))===2000,String(curATK(C(b)))); }
`);
