/* S03-U402: 選ばれし者, 荒野の大竜巻, 竜操術 (NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4020001;
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




























const CHO='選ばれし者',TOR='荒野の大竜巻',RYU='竜操術',DRG='ドラグニティ－ブランディストック';
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function actSzC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'sz',idx(c));drive();PREFER=[];}
function faceSet(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function legalH(i){const acts=getLegalHandActions(0,i||0);return {ok:acts.some(x=>x.id==='activate'),actions:acts.map(x=>x.id)};}

/* ===== 選ばれし者 ===== */
function chosen(seed){fresh();gameState.rngInitialSeed=gameState.rngState=seed;
  const sp=mk(CHO,0,'up'),mn=mk('ワイト',0),s1=mk('ブラック・ホール',0),s2=mk('サイクロン',0);
  gameState.players[0].hand=[sp,mn,s1,s2];baselineA();
  cast(0,CHO,[uid(mn),uid(s1),uid(s2)]);
  return {sp,mn,s1,s2,summoned:z(mn)==='mz'};}
{ const seen={};let any=null;
  for(let sd=1;sd<=40&&Object.keys(seen).length<2;sd++){const x=chosen(0x3400001+sd*7919);const k=x.summoned?'mon':'oth';
    if(!seen[k]){seen[k]=true;
      if(x.summoned) ok('選ばれし者: the opponent picked the monster → it was Special Summoned and the other two cards went to the Graveyard',z(x.mn)==='mz'&&z(x.s1)==='grave'&&z(x.s2)==='grave'&&z(x.sp)==='grave',JSON.stringify({mn:z(x.mn),s1:z(x.s1),s2:z(x.s2)}));
      else ok('選ばれし者: the opponent picked a non-monster → all three chosen cards went to the Graveyard',z(x.mn)==='grave'&&z(x.s1)==='grave'&&z(x.s2)==='grave',JSON.stringify({mn:z(x.mn),s1:z(x.s1),s2:z(x.s2)}));}}
  ok('選ばれし者: both outcomes occur over the seeds',Object.keys(seen).length===2,JSON.stringify(seen)); }
{ fresh();const sp=mk(CHO,0,'up'),mn=mk('ワイト',0),s1=mk('ブラック・ホール',0);gameState.players[0].hand=[sp,mn,s1];baselineA();
  ok('選ばれし者 negative: only one non-monster card (needs two) → not activatable',legalH(0).ok===false,JSON.stringify(legalH(0))); }
{ const x=chosen(7);audit('選ばれし者 audit'); }

/* ===== 荒野の大竜巻 ===== */
{ fresh();const tr=faceSet(TOR,0),tg=mk('スクリーン・オブ・レッド',1,'up'),bh=mk('ブラック・ホール',1);gameState.players[0].sz=[tr];gameState.players[1].sz=[tg];gameState.players[1].hand=[bh];baselineA();
  PREFER=[uid(tg),'yes',uid(bh)];duelActivateFromZone(0,'sz',idx(tr));drive();PREFER=[];
  ok('大竜巻: the face-up Spell / Trap was destroyed',z(tg)==='grave',z(tg));
  ok('大竜巻: its controller (the opponent) Set a Spell / Trap of the hand',z(bh)==='sz'&&C(bh).face==='down',JSON.stringify([z(bh),C(bh)&&C(bh).face]));
  audit('大竜巻 1'); }
{ fresh();const tr=faceSet(TOR,0),tg=mk('スクリーン・オブ・レッド',1,'up');gameState.players[0].sz=[tr];gameState.players[1].sz=[tg];baselineA();
  PREFER=[uid(tg)];duelActivateFromZone(0,'sz',idx(tr));drive();PREFER=[];
  ok('大竜巻: without a Spell / Trap in the opponent hand the destruction simply happens (no Set offered)',z(tg)==='grave'&&!pc(),JSON.stringify([z(tg),!!pc()])); }
{ fresh();const tr=faceSet(TOR,0),f=mon('ライオウ',1),cy=mk('サイクロン',1);gameState.players[0].sz=[tr];gameState.players[1].mz=[f];gameState.players[1].hand=[cy];baselineA();
  endTurn();
  PREFER=[uid(tr),uid(f)];cast(1,'サイクロン',[uid(tr),uid(f)]);
  ok('大竜巻 ②: the Set trap destroyed by the opponent → it destroys a face-up card of the field (ライオウ)',z(tr)==='grave'&&z(f)==='grave',JSON.stringify({tr:z(tr),f:z(f)}));
  audit('大竜巻 2'); }

/* ===== 竜操術 ===== */
{ fresh();const sp=mk(RYU,0,'up'),h=mon('ワイト',0),dr=mk(DRG,0);gameState.players[0].hand=[sp,dr];gameState.players[0].mz=[h];baselineA();
  cast(0,RYU);
  ok('竜操術: activated (face-up Continuous Spell)',z(sp)==='sz'&&C(sp).face==='up',JSON.stringify([z(sp),C(sp)&&C(sp).face]));
  ok('竜操術: the equip ignition is offered',getLegalZoneActions(0,'sz',idx(sp)).some(a=>a.id==='effect'),JSON.stringify(getLegalZoneActions(0,'sz',idx(sp)).map(a=>a.id)));
  actSzC(sp,[uid(dr),uid(h)]);
  ok('竜操術: the Dragunity from the hand is an Equip on ワイト (not Special Summoned)',z(dr)==='sz'&&C(dr).v46MonsterEquip===true&&C(dr).equipTo&&C(dr).equipTo.uid===h.uid,JSON.stringify({dr:z(dr),eq:!!C(dr).v46MonsterEquip}));
  ok('竜操術: the host ATK 300 + 500 = 800',curATK(C(h))===800,String(curATK(C(h))));
  ok('竜操術: once per turn',getLegalZoneActions(0,'sz',idx(sp)).every(a=>a.id!=='effect'),JSON.stringify(getLegalZoneActions(0,'sz',idx(sp)).map(a=>a.id)));
  audit('竜操術 1'); }
{ fresh();const sp=mk(RYU,0,'up'),h=mon('ワイト',0);gameState.players[0].hand=[sp];gameState.players[0].mz=[h];baselineA();
  cast(0,RYU);
  ok('竜操術 negative: no Dragunity Dragon in the hand → no equip effect; the ATK of ワイト stays 300',getLegalZoneActions(0,'sz',idx(sp)).every(a=>a.id!=='effect')&&curATK(C(h))===300,JSON.stringify([getLegalZoneActions(0,'sz',idx(sp)).map(a=>a.id),curATK(C(h))])); }
`);
