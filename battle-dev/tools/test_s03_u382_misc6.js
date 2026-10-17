/* S03-U382: 摩天楼, 極星宝グングニル, 紅蓮魔闘士, 樹海の射手 (NOT_STARTED cards).
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
let PREFER=[];const SEEN=[];
function pick(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}
  if(q.min>1){const keys=[];PREFER.forEach(u=>{const x=q.candidates.find(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(x&&keys.length<q.max&&keys.indexOf(x.key)<0)keys.push(x.key);});q.candidates.forEach(x=>{if(keys.length<q.min&&keys.indexOf(x.key)<0)keys.push(x.key);});answerChoiceV49(keys);return;}SEEN.push({title:q.title,cands:q.candidates.map(x=>x.uid||x.value||x.key)});let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(j>=0)break;}if(j>=0){const u=PREFER.find(u=>q.candidates.some(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u)));PREFER.splice(PREFER.indexOf(u),1);}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<800;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3820001;
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








const SKY='摩天楼 －スカイスクレイパー－',GUN='極星宝グングニル',GRM='紅蓮魔闘士',ARC='樹海の射手';
function procOk(name,i){return strictSummonProcedureLegality(name,0,'hand',i).ok;}
function procRun(name,i){runSummonProcedure(name,0,'hand',i);if(!gameState.pendingSummon&&!pc())finishSummonProcedure(name,0,'hand',i,'atk');drive();}
function atkTarget(p,c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(c),target:t==='direct'?'direct':idx(t)});drive();}
function toOppBattle(){endTurn();phase('battle');}
function actSzC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'sz',idx(c));drive();PREFER=[];}
function legalSz(c){return strictScriptLegalityV2(cardName(c),0,'sz',idx(c)).ok;}

/* ===== 摩天楼 ===== */
function skyField(withSky){fresh();const sk=mk(SKY,0,'up'),e=mon('E・HERO エッジマン',0),bw=mon('青眼の白龍',1),w=mon('ワイト',1);
  gameState.players[0].field=withSky?sk:null;gameState.players[0].mz=[e];gameState.players[1].mz=[bw,w];baselineA();return {sk,e,bw,w};}
{ const x=skyField(true);
  phase('battle');
  atkTarget(0,x.e,x.bw);
  ok('摩天楼: エッジマン (2600) attacking 青眼の白龍 (3000) gets +1000 in the damage calculation and wins',z(x.bw)==='grave'&&z(x.e)==='mz',JSON.stringify([z(x.bw),z(x.e)]));
  audit('摩天楼 1'); }
{ const x=skyField(false);
  phase('battle');
  atkTarget(0,x.e,x.bw);
  ok('摩天楼 control: without the Field Spell エッジマン loses to 青眼の白龍',z(x.e)==='grave'&&z(x.bw)==='mz',JSON.stringify([z(x.e),z(x.bw)])); }
{ const x=skyField(true);
  toOppBattle();
  atkTarget(1,x.bw,x.e);
  ok('摩天楼: the bonus applies only when the 「E・HERO」 attacks — as the defender エッジマン is destroyed',z(x.e)==='grave'&&z(x.bw)==='mz',JSON.stringify([z(x.e),z(x.bw)])); }
{ const x=skyField(true);
  ok('摩天楼: outside the damage calculation the ATK is unchanged',curATK(C(x.e))===2600,String(curATK(C(x.e)))); }

/* ===== 極星宝グングニル ===== */
function gunField(){fresh();const t=setCard(GUN,0),ga=mon('極星獣ガルム',0),w=mon('ワイト',0),ft=setCard('強制脱出装置',1),f=mon('ライオウ',1);
  gameState.players[0].sz=[t];gameState.players[0].mz=[ga,w];gameState.players[1].sz=[ft];gameState.players[1].mz=[f];baselineA();return {t,ga,w,ft,f};}
{ const x=gunField();
  ok('グングニル: activatable with a face-up 極星 monster',legalSz(x.t)===true,'');
  actSzC(x.t,[uid(x.ga),uid(x.f)]);
  ok('グングニル: the 極星 monster banished (cost); the chosen field card (ライオウ) destroyed',z(x.ga)==='banish'&&z(x.f)==='grave',JSON.stringify([z(x.ga),z(x.f)]));
  endTurn();endTurn();
  ok('グングニル: not back after the first End Phase of mine',z(x.ga)==='banish',z(x.ga));
  endTurn();
  ok('グングニル: back at my second End Phase, face-up in Attack Position',z(x.ga)==='mz'&&C(x.ga).face==='up'&&C(x.ga).pos==='atk',JSON.stringify([z(x.ga),C(x.ga)&&C(x.ga).face,C(x.ga)&&C(x.ga).pos]));
  audit('グングニル 1'); }
{ fresh();const t=setCard(GUN,0),w=mon('ワイト',0);gameState.players[0].sz=[t];gameState.players[0].mz=[w];gameState.players[1].mz=[mon('ライオウ',1)];baselineA();
  ok('グングニル negative: no 極神 / 極星 monster -> not activatable',legalSz(t)===false,''); }

/* ===== 紅蓮魔闘士 ===== */
{ fresh();const g=mk(GRM,0),n1=mk('ブラック・マジシャン',0),n2=mk('青眼の白龍',0),n3=mk('13人目の埋葬者',0);
  gameState.players[0].hand=[g];gameState.players[0].grave=[n1,n2,n3];baselineA();
  ok('魔闘士: Special Summonable from the hand with exactly 3 Normal Monsters in the Graveyard',procOk(GRM,0)===true,'');
  PREFER=[uid(n1),uid(n2)];procRun(GRM,0);PREFER=[];
  ok('魔闘士: two Normal Monsters banished; 紅蓮魔闘士 Special Summoned',z(g)==='mz'&&gameState.players[0].grave.length===1,JSON.stringify([z(g),gameState.players[0].grave.length,z(n1),z(n2),z(n3)]));
  audit('魔闘士 1'); }
{ fresh();const g=mk(GRM,0),n1=mk('青眼の白龍',0),n2=mk('13人目の埋葬者',0);gameState.players[0].hand=[g];gameState.players[0].grave=[n1,n2];baselineA();
  ok('魔闘士 negative: only 2 Normal Monsters -> not Special Summonable',procOk(GRM,0)===false,''); }
{ fresh();const g=mon(GRM,0),n1=mk('13人目の埋葬者',0),hi=mk('ブラック・マジシャン',0);gameState.players[0].mz=[g];gameState.players[0].grave=[n1,hi];baselineA();
  ok('魔闘士: the effect is activatable (a Level 4 or lower Normal Monster in the Graveyard)',canZ(g)===true,'');
  actZ(g,[uid(n1)]);
  ok('魔闘士: the Normal Monster Special Summoned; once per turn',z(n1)==='mz'&&canZ(g)===false,JSON.stringify([z(n1),canZ(g)]));
  audit('魔闘士 2'); }

/* ===== 樹海の射手 ===== */
{ fresh();const a=mk(ARC,0),n1=mk('青眼の白龍',0),n2=mk('13人目の埋葬者',0);gameState.players[0].hand=[a];gameState.players[0].grave=[n1,n2];baselineA();
  ok('射手: Special Summonable with 2 Normal Monsters in the Graveyard',procOk(ARC,0)===true,'');
  procRun(ARC,0);
  ok('射手: Special Summoned from the hand',z(a)==='mz',z(a));
  audit('射手 1'); }
{ fresh();const a=mk(ARC,0),n1=mk('青眼の白龍',0);gameState.players[0].hand=[a];gameState.players[0].grave=[n1];baselineA();
  ok('射手 negative: only one Normal Monster in the Graveyard -> not Special Summonable',procOk(ARC,0)===false,''); }
{ fresh();const a=mon(ARC,0),d=mk('ヴァイロン・ソルジャー',0),du=mk('ワイト',0);
  /* find a Dual Monster in the data */
  const dual=CARD_DB.find(x=>x.k==='m'&&(x.st||[]).indexOf('デュアル')>=0&&!x.ex&&x.d<='2011-08-31');
  const dm=mk(dual.n,0);gameState.players[0].mz=[a];gameState.players[0].deck=[du,dm].concat(gameState.players[0].deck);baselineA();
  ok('射手: the release effect is activatable with a Dual Monster in the Deck ('+dual.n+')',canZ(a)===true,'');
  actZ(a,[uid(dm)]);
  ok('射手: released (sent to the Graveyard); the Dual Monster added from the Deck',z(a)==='grave'&&z(dm)==='hand'&&z(du)==='deck',JSON.stringify([z(a),z(dm),z(du)]));
  audit('射手 2'); }
`);
