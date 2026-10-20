/* S03-U414: インヴェルズの魔細胞, インヴェルズの斥候, 深緑の魔弓使い, 蒼血鬼 (NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x40E0001;
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
const CEL='インヴェルズの魔細胞',SCO='インヴェルズの斥候',ARC='深緑の魔弓使い',BLO='蒼血鬼';
function nsReason(p,name,kind){return v46FaceUpSummonRestrictionReason(p,dbOf({id:findCardIndex(name)}),kind);}
function procOk(name,i){return strictSummonProcedureLegality(name,0,'hand',i).ok;}
function procRun(name,i){runSummonProcedure(name,0,'hand',i);if(!gameState.pendingSummon&&!pc())finishSummonProcedure(name,0,'hand',i,'atk');drive();}
function actC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}

/* ===== インヴェルズの魔細胞 ===== */
{ fresh();const c=mk(CEL,0);gameState.players[0].hand=[c];baselineA();
  ok('魔細胞: Special Summonable from the hand while I control no monster',procOk(CEL,0)===true,'');
  procRun(CEL,0);
  ok('魔細胞: it stands on the field',z(c)==='mz',z(c));
  ok('魔細胞: it can be Tributed only for the Advance Summon of an 「インヴェルズ」 monster',tributeCandidates(0,dbOf({id:findCardIndex('インヴェルズ・ガザス')})).some(x=>x.card===C(c))&&!tributeCandidates(0,dbOf({id:findCardIndex('ブラック・マジシャン')})).some(x=>x.card===C(c)),'');
  ok('魔細胞: it cannot be Synchro material',materialCandidates(0,'synchro').every(x=>x.card!==C(c)),'');
  audit('魔細胞 1'); }
{ fresh();const c=mk(CEL,0);gameState.players[0].hand=[c];gameState.players[0].mz=[mon('ワイト',0)];baselineA();
  ok('魔細胞 negative: a monster on my field → not Special Summonable from the hand',procOk(CEL,0)===false,''); }

/* ===== インヴェルズの斥候 ===== */
{ fresh();const s=mk(SCO,0);gameState.players[0].grave=[s];baselineA();
  ok('斥候: the Graveyard effect is offered at the start of my Main Phase 1 (no Spell / Trap on my field)',getLegalZoneActions(0,'grave',idx(s)).some(a=>a.id==='effect'||a.id==='activate'),JSON.stringify(getLegalZoneActions(0,'grave',idx(s)).map(a=>a.id)));
  duelActivateFromZone(0,'grave',idx(s));drive();
  ok('斥候: Special Summoned from the Graveyard; I cannot Special Summon for the rest of the turn',z(s)==='mz'&&!!nsReason(0,'ワイト','special'),JSON.stringify([z(s),nsReason(0,'ワイト','special')]));
  ok('斥候: Tribute only for 「インヴェルズ」 Advance Summons',!tributeCandidates(0,dbOf({id:findCardIndex('ブラック・マジシャン')})).some(x=>x.card===C(s)),'');
  audit('斥候 1'); }
{ fresh();const s=mk(SCO,0),st=mk('スクリーン・オブ・レッド',0,'up');gameState.players[0].grave=[s];gameState.players[0].sz=[st];baselineA();
  ok('斥候 negative: a Spell / Trap Card on my field → not offered',!getLegalZoneActions(0,'grave',idx(s)).some(a=>a.id==='effect'||a.id==='activate'),JSON.stringify(getLegalZoneActions(0,'grave',idx(s)).map(a=>a.id))); }

/* ===== 深緑の魔弓使い ===== */
{ fresh();const a=mon(ARC,0),p=mon('きのこマン',0),st=mk('スクリーン・オブ・レッド',1,'up');gameState.players[0].mz=[a,p];gameState.players[1].sz=[st];baselineA();
  ok('魔弓使い: the effect is available (a Plant to Tribute, a Spell / Trap on the field)',canZ(a)===true,'');
  actC(a,[uid(p),uid(st)]);
  ok('魔弓使い: the Plant was sacrificed and the Spell / Trap Card destroyed',z(p)==='grave'&&z(st)==='grave',JSON.stringify([z(p),z(st)]));
  audit('魔弓使い 1'); }
{ fresh();const a=mon(ARC,0),p=mon('きのこマン',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[a,p];gameState.players[1].mz=[f];baselineA();
  toOppBattle();const l0=lp(0);foeAttack(f,a);
  ok('魔弓使い: while I control another Plant it cannot be attacked (no damage, still on the field)',z(a)==='mz'&&lp(0)===l0,JSON.stringify([z(a),lp(0)])); }
{ fresh();const a=mon(ARC,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[a];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,a);
  ok('魔弓使い control: without a Plant it can be attacked (destroyed by 青眼)',z(a)==='grave',z(a)); }

/* ===== 蒼血鬼 ===== */
{ fresh();const b=mk(BLO,0);gameState.players[0].hand=[b];baselineA();
  doNormalSummon(0,'atk');drive();
  ok('蒼血鬼: Normal Summoned → turned to Defense Position',z(b)==='mz'&&C(b).pos==='def',JSON.stringify([z(b),C(b)&&C(b).pos]));
  audit('蒼血鬼 1'); }
{ fresh();const b=mon(BLO,0,'def'),xz=mon('ワイト',0),m1=mk('ワイト',0),zm=mk('ゾンビ・マスター',0);xz.xyz=[m1];gameState.players[0].mz=[b,xz];gameState.players[0].grave=[zm];baselineA();
  ok('蒼血鬼: the effect is available (an Xyz Material on my field, a Level 4 Undead in the Graveyard)',canZ(b)===true,'');
  actC(b,[uid(xz),uid(zm)]);
  ok('蒼血鬼: an Xyz Material was detached (cost) and ゾンビ・マスター Special Summoned; once per turn',(C(xz).xyz||[]).length===0&&z(zm)==='mz'&&canZ(b)===false,JSON.stringify([(C(xz).xyz||[]).length,z(zm),canZ(b)]));
  audit('蒼血鬼 2'); }
{ fresh();const b=mon(BLO,0,'def'),zm=mk('ゾンビ・マスター',0);gameState.players[0].mz=[b];gameState.players[0].grave=[zm];baselineA();
  ok('蒼血鬼 negative: no Xyz Material on my field → not offered',canZ(b)===false,''); }
`);
