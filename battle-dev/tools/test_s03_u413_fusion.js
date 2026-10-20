/* S03-U413: 輝石融合, パーティカル・フュージョン, 融合禁止エリア (NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x40D0001;
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
const KSE='輝石融合',PAR='パーティカル・フュージョン',BAN='融合禁止エリア';
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function actSzC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'sz',idx(c));drive();PREFER=[];}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function legalH(i){const acts=getLegalHandActions(0,i||0);return {ok:acts.some(x=>x.id==='activate'),actions:acts.map(x=>x.id)};}
function zoneAct(c){return getLegalZoneActions(0,'sz',idx(c)).some(x=>x.id==='activate'||x.id==='activateSet');}

/* ===== 輝石融合 ===== */
{ fresh();const t=setCard(KSE,0),ga=mk('ジェムナイト・ガネット',0),sa=mk('ジェムナイト・サフィア',0);
  const rub=mk('ジェムナイト・ルビーズ',0),gat=mk('ガトリング・ドラゴン',0);
  gameState.players[0].sz=[t];gameState.players[0].hand=[ga,sa];gameState.players[0].ex=[gat,rub];baselineA();
  ok('輝石融合: activatable (materials in the hand for a 「ジェムナイト」 Fusion Monster)',zoneAct(t)===true,JSON.stringify(getLegalZoneActions(0,'sz',idx(t)).map(a=>a.id)));
  SEEN.length=0;actSzC(t,[uid(rub),'atk']);
  const exQ=SEEN.find(s=>/融合召喚する融合モンスター/.test(s.title));
  ok('輝石融合: only the 「ジェムナイト」 Fusion Monster is offered (not ガトリング・ドラゴン)',!!exQ&&exQ.cands.indexOf(rub.uid)>=0&&exQ.cands.indexOf(gat.uid)<0,JSON.stringify(exQ));
  ok('輝石融合: ジェムナイト・ルビーズ Fusion Summoned; both materials went to the Graveyard',z(rub)==='mz'&&z(ga)==='grave'&&z(sa)==='grave'&&z(t)==='grave',JSON.stringify({rub:z(rub),ga:z(ga),sa:z(sa),t:z(t)}));
  audit('輝石融合 1'); }
{ fresh();const t=setCard(KSE,0),w=mk('ワイト',0),gat=mk('ガトリング・ドラゴン',0);
  gameState.players[0].sz=[t];gameState.players[0].hand=[w];gameState.players[0].ex=[gat];baselineA();
  ok('輝石融合 negative: no 「ジェムナイト」 Fusion Monster can be summoned → not activatable',zoneAct(t)===false,JSON.stringify(getLegalZoneActions(0,'sz',idx(t)).map(a=>a.id))); }

/* ===== パーティカル・フュージョン ===== */
{ fresh();const sp=mk(PAR,0,'up'),ga=mon('ジェムナイト・ガネット',0),sa=mon('ジェムナイト・サフィア',0),rub=mk('ジェムナイト・ルビーズ',0);
  gameState.players[0].hand=[sp];gameState.players[0].mz=[ga,sa];gameState.players[0].ex=[rub];baselineA();
  const garnetAtk=Number(dbOf(ga).atk)||0;
  cast(0,PAR,[uid(rub),'atk','yes',uid(ga)]);
  ok('パーティカル: ジェムナイト・ルビーズ Fusion Summoned from the field materials',z(rub)==='mz'&&z(ga)==='grave'&&z(sa)==='grave',JSON.stringify({rub:z(rub),ga:z(ga),sa:z(sa)}));
  ok('パーティカル: it banished itself from the Graveyard and added the chosen material ATK to the Fusion Monster until the End Phase',z(sp)==='banish'&&curATK(C(rub))===(Number(dbOf(rub).atk)||0)+garnetAtk,JSON.stringify({sp:z(sp),atk:curATK(C(rub)),base:Number(dbOf(rub).atk),garnetAtk}));
  endTurn();
  ok('パーティカル: back to the printed ATK after the End Phase',curATK(C(rub))===(Number(dbOf(rub).atk)||0),String(curATK(C(rub))));
  audit('パーティカル 1'); }
{ fresh();const sp=mk(PAR,0,'up'),ga=mk('ジェムナイト・ガネット',0),sa=mk('ジェムナイト・サフィア',0),rub=mk('ジェムナイト・ルビーズ',0);
  gameState.players[0].hand=[sp,ga,sa];gameState.players[0].ex=[rub];baselineA();
  ok('パーティカル negative: materials only in the hand (the Spell uses the field only) → not activatable',legalH(0).ok===false,JSON.stringify(legalH(0))); }

/* ===== 融合禁止エリア ===== */
{ fresh();const b=mk(BAN,0,'up'),fu=mk('融合',0),ga=mk('ジェムナイト・ガネット',0),sa=mk('ジェムナイト・サフィア',0),rub=mk('ジェムナイト・ルビーズ',0);
  gameState.players[0].sz=[b];gameState.players[0].hand=[fu,ga,sa];gameState.players[0].ex=[rub];baselineA();
  ok('融合禁止エリア: 融合 cannot be activated while it stands face-up',legalH(0).ok===false,JSON.stringify(legalH(0)));
  ok('融合禁止エリア: nor can any Fusion Summon be performed by an effect (API.specialSummon with summonKind fusion is refused)',API.specialSummon(0,'ex',idx(rub),'atk','test',null,{summonKind:'fusion'})===false&&z(rub)==='ex',z(rub));
  endTurn();audit('融合禁止エリア 1'); }
{ fresh();const fu=mk('融合',0),ga=mk('ジェムナイト・ガネット',0),sa=mk('ジェムナイト・サフィア',0),rub=mk('ジェムナイト・ルビーズ',0);
  gameState.players[0].hand=[fu,ga,sa];gameState.players[0].ex=[rub];baselineA();
  ok('融合禁止エリア control: without it 融合 is activatable',legalH(0).ok===true,JSON.stringify(legalH(0))); }
`);
