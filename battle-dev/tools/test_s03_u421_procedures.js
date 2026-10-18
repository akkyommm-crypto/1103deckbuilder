/* S03-U421: ヴァンパイアジェネシス, 異次元の一角戦士, ネオス・ワイズマン, サイバー・エルタニン (NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4150001;
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
const VAM='ヴァンパイアジェネシス',UNI='異次元の一角戦士',WIS='ネオス・ワイズマン',ELT='サイバー・エルタニン';
function procOk(name,i){return strictSummonProcedureLegality(name,0,'hand',i).ok;}
function procRun(name,i){runSummonProcedure(name,0,'hand',i);if(!gameState.pendingSummon&&!pc())finishSummonProcedure(name,0,'hand',i,'atk');drive();}
function actC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function canZ(c){return getLegalZoneActions(0,'mz',idx(c)).map(a=>a.id).indexOf('effect')>=0;}
function nsReason(p,name,kind){return v46FaceUpSummonRestrictionReason(p,dbOf({id:findCardIndex(name)}),kind);}
function myAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}

/* ===== ヴァンパイアジェネシス ===== */
{ fresh();const g=mk(VAM,0),vl=mon('ヴァンパイア・ロード',0);gameState.players[0].hand=[g];gameState.players[0].mz=[vl];baselineA();
  ok('ジェネシス: Special Summonable by banishing my face-up ヴァンパイア・ロード',procOk(VAM,0)===true,'');
  procRun(VAM,0);
  ok('ジェネシス: it stands on the field; the ヴァンパイア・ロード was banished',z(g)==='mz'&&z(vl)==='banish',JSON.stringify([z(g),z(vl)]));
  audit('ジェネシス 1'); }
{ fresh();const g=mk(VAM,0),w=mon('ワイト',0);gameState.players[0].hand=[g];gameState.players[0].mz=[w];baselineA();
  ok('ジェネシス negative: no ヴァンパイア・ロード → not Special Summonable',procOk(VAM,0)===false,''); }
{ fresh();const g=mon(VAM,0),zm=mk('ゾンビ・マスター',0),w=mk('ワイト',0);gameState.players[0].mz=[g];gameState.players[0].hand=[zm];gameState.players[0].grave=[w];baselineA();
  ok('ジェネシス: the effect is available (discard ゾンビ・マスター Lv4, revive the Lv3 ワイト)',canZ(g)===true,'');
  actC(g,[uid(zm),uid(w)]);
  ok('ジェネシス: the Undead of the hand was discarded and the lower-Level Undead of the Graveyard Special Summoned; once per turn',z(zm)==='grave'&&z(w)==='mz'&&canZ(g)===false,JSON.stringify([z(zm),z(w),canZ(g)]));
  audit('ジェネシス 2'); }
{ fresh();const g=mon(VAM,0),w=mk('ワイト',0),zm=mk('ゾンビ・マスター',0);gameState.players[0].mz=[g];gameState.players[0].hand=[w];gameState.players[0].grave=[zm];baselineA();
  ok('ジェネシス negative: the Graveyard Undead (Lv4) is not lower than the discarded one (Lv3) → not offered',canZ(g)===false,''); }

/* ===== 異次元の一角戦士 ===== */
{ fresh();const u=mk(UNI,0),tu=mon('X－セイバー パシウル',0),f=mon('ブラック・マジシャン',1),bn=mk('ワイト',0);
  gameState.players[0].hand=[u];gameState.players[0].mz=[tu];gameState.players[1].mz=[f];gameState.players[0].banish=[bn];baselineA();
  ok('一角戦士: Special Summonable (the opponent has a monster, I control a face-up Tuner)',procOk(UNI,0)===true,'');
  PREFER=[uid(bn)];procRun(UNI,0);PREFER=[];
  ok('一角戦士: it stands on the field and no Normal Summon this turn',z(u)==='mz'&&!!nsReason(0,'ワイト','normal'),JSON.stringify([z(u),nsReason(0,'ワイト','normal')]));
  ok('一角戦士: the banished non-Tuner Level 3 ワイト was Special Summoned with its effects negated',z(bn)==='mz'&&API.isEffectNegated(findCardByUid(bn.uid))===true,JSON.stringify([z(bn),API.isEffectNegated(findCardByUid(bn.uid))]));
  audit('一角戦士 1'); }
{ fresh();const u=mk(UNI,0),tu=mon('X－セイバー パシウル',0);gameState.players[0].hand=[u];gameState.players[0].mz=[tu];baselineA();
  ok('一角戦士 negative: no monster on the opponent field → not Special Summonable',procOk(UNI,0)===false,''); }
{ fresh();const u=mk(UNI,0),w=mon('ワイト',0),f=mon('ブラック・マジシャン',1);gameState.players[0].hand=[u];gameState.players[0].mz=[w];gameState.players[1].mz=[f];baselineA();
  ok('一角戦士 negative: no Tuner on my field → not Special Summonable',procOk(UNI,0)===false,''); }

/* ===== ネオス・ワイズマン ===== */
{ fresh();const w=mk(WIS,0),ne=mon('E・HERO ネオス',0),yu=mon('ユベル',0);gameState.players[0].hand=[w];gameState.players[0].mz=[ne,yu];baselineA();
  ok('ワイズマン: Special Summonable by sending ネオス and ユベル from the field',procOk(WIS,0)===true,'');
  procRun(WIS,0);
  ok('ワイズマン: both went to the Graveyard and it stands on the field',z(w)==='mz'&&z(ne)==='grave'&&z(yu)==='grave',JSON.stringify([z(w),z(ne),z(yu)]));
  audit('ワイズマン 1'); }
{ fresh();const w=mk(WIS,0),ne=mon('E・HERO ネオス',0);gameState.players[0].hand=[w];gameState.players[0].mz=[ne];baselineA();
  ok('ワイズマン negative: without ユベル → not Special Summonable',procOk(WIS,0)===false,''); }
{ fresh();const w=mon(WIS,0),f=mon('ワイト',1);gameState.players[0].mz=[w];gameState.players[1].mz=[f];baselineA();
  const l1=lp(1),l0=lp(0),fa=curATK(C(f)),fd=curDEF(C(f));
  phase('battle');myAttack(w,f);
  ok('ワイズマン: after the battle the partner\'s ATK was dealt to the opponent and I recovered its DEF',z(f)==='grave'&&l1-lp(1)===(curATK(C(w))-fa)+fa&&lp(0)-l0===fd,JSON.stringify([z(f),l1,lp(1),l0,lp(0),fa,fd,curATK(C(w))]));
  audit('ワイズマン 2'); }
{ fresh();const w=mon(WIS,0);gameState.players[0].mz=[w];baselineA();
  API.destroy(findCardByUid(w.uid),'test');
  ok('ワイズマン: it is not destroyed by a card effect',z(w)==='mz',z(w)); }

/* ===== サイバー・エルタニン ===== */
{ fresh();const e=mk(ELT,0),va=mon('サイバー・ヴァリー',0),gd=mk('サイバー・ドラゴン',0),w=mon('ワイト',0),f=mon('ブラック・マジシャン',1);
  gameState.players[0].hand=[e];gameState.players[0].mz=[va,w];gameState.players[0].grave=[gd];gameState.players[1].mz=[f];baselineA();
  ok('エルタニン: Special Summonable (Machine LIGHT monsters in the Graveyard and on the field)',procOk(ELT,0)===true,'');
  procRun(ELT,0);
  ok('エルタニン: every Machine LIGHT monster (サイバー・ヴァリー, サイバー・ドラゴン) was banished',z(va)==='banish'&&z(gd)==='banish',JSON.stringify([z(va),z(gd)]));
  ok('エルタニン: ATK / DEF = 500 x 2 banished monsters',z(e)==='mz'&&curATK(C(e))===1000&&curDEF(C(e))===1000,JSON.stringify([z(e),curATK(C(e)),curDEF(C(e))]));
  ok('エルタニン: all the other face-up monsters of the field were sent to the Graveyard',z(w)==='grave'&&z(f)==='grave',JSON.stringify([z(w),z(f)]));
  audit('エルタニン 1'); }
{ fresh();const e=mk(ELT,0),w=mon('ワイト',0);gameState.players[0].hand=[e];gameState.players[0].mz=[w];baselineA();
  ok('エルタニン negative: no Machine LIGHT monster → not Special Summonable',procOk(ELT,0)===false,''); }
`);
