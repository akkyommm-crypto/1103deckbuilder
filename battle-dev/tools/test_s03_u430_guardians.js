/* S03-U430: ガーディアン・グラール, ケースト, エルマ, バオウ, シール (stale ENGINE_GAP cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x41E0001;
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
const GRA='ガーディアン・グラール',KES='ガーディアン・ケースト',ELM='ガーディアン・エルマ',BAO='ガーディアン・バオウ',SEA='ガーディアン・シール';
function ids(i){return getLegalHandActions(0,i).map(a=>a.id);}
function actC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function canZ(c){return getLegalZoneActions(0,'mz',idx(c)).map(a=>a.id).indexOf('effect')>=0;}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function myAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function boost(c,n){c.mods=[{atk:n,def:0,until:'permanent',label:'fixture',turn:5}];}
function H(c){return findCardByUid(c.uid);}

/* ===== ガーディアン・グラール ===== */
{ fresh();const g=mk(GRA,0),w=mk('ワイト',0),ax=mk('重力の斧－グラール',0,'up'),t=mon('ワイト',0);gameState.players[0].hand=[g,w];gameState.players[0].sz=[ax];gameState.players[0].mz=[t];baselineA();
  ok('グラール: with 「重力の斧－グラール」 on my field the Advance Summon is offered',ids(0).indexOf('normalSummon')>=0,JSON.stringify(ids(0))); }
{ fresh();const g=mk(GRA,0),w=mk('ワイト',0),t=mon('ワイト',0);gameState.players[0].hand=[g,w];gameState.players[0].mz=[t];baselineA();
  ok('グラール negative: without the Equip Spell and with another card in the hand → no summon is offered',ids(0).indexOf('normalSummon')<0&&ids(0).indexOf('specialSummonProcedure')<0,JSON.stringify(ids(0))); }
{ fresh();const g=mk(GRA,0);gameState.players[0].hand=[g];baselineA();
  ok('グラール: it is the only card in my hand → it can be Special Summoned from the hand',ids(0).indexOf('specialSummonProcedure')>=0,JSON.stringify(ids(0)));
  runSummonProcedure(GRA,0,'hand',0);if(!gameState.pendingSummon&&!pc())finishSummonProcedure(GRA,0,'hand',0,'atk');drive();
  ok('グラール: Special Summoned',z(g)==='mz',z(g));
  audit('グラール 1'); }

/* ===== ガーディアン・ケースト ===== */
{ fresh();const k=mk(KES,0),ro=mk('静寂のロッド－ケースト',0,'up'),t=mon('ワイト',0);gameState.players[0].hand=[k];gameState.players[0].sz=[ro];gameState.players[0].mz=[t];baselineA();
  ok('ケースト: with 「静寂のロッド－ケースト」 on my field the Advance Summon is offered',ids(0).indexOf('normalSummon')>=0,JSON.stringify(ids(0))); }
{ fresh();const k=mk(KES,0),t=mon('ワイト',0);gameState.players[0].hand=[k];gameState.players[0].mz=[t];baselineA();
  ok('ケースト negative: without the Equip Spell no summon is offered',ids(0).indexOf('normalSummon')<0,JSON.stringify(ids(0))); }
{ fresh();const k=mon(KES,0),w=mon('ワイト',0),bh=mk('ブラック・ホール',1);gameState.players[0].mz=[k,w];gameState.players[1].hand=[bh];baselineA();
  endTurn();cast(1,'ブラック・ホール');
  ok('ケースト: unaffected by Spell effects (ブラック・ホール destroyed ワイト only)',z(k)==='mz'&&z(w)==='grave',JSON.stringify([z(k),z(w)]));
  audit('ケースト 1'); }
{ fresh();const k=mon(KES,0),w=mon('ワイト',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[k,w];gameState.players[1].mz=[f];baselineA();
  const l0=lp(0);endTurn();phase('battle');foeAttack(f,k);
  ok('ケースト: it cannot be chosen as an attack target by the opponent\'s monsters (no battle, no damage)',z(k)==='mz'&&lp(0)===l0&&z(f)==='mz',JSON.stringify([z(k),l0,lp(0)])); }

/* ===== ガーディアン・エルマ ===== */
{ fresh();const e=mk(ELM,0),da=mk('蝶の短剣－エルマ',0,'up'),eq=mk('団結の力',0);gameState.players[0].hand=[e];gameState.players[0].sz=[da];gameState.players[0].grave=[eq];baselineA();
  PREFER=[uid(eq)];doNormalSummon(0,'atk');drive();PREFER=[];
  ok('エルマ: Normal Summoned → an Equip Spell of my Graveyard (団結の力) was equipped to it',z(e)==='mz'&&z(eq)==='sz'&&C(eq).equipTo&&C(eq).equipTo.uid===e.uid,JSON.stringify([z(e),z(eq),C(eq)&&C(eq).equipTo&&C(eq).equipTo.uid,e.uid]));
  audit('エルマ 1'); }
{ fresh();const e=mk(ELM,0),da=mk('蝶の短剣－エルマ',0,'up');gameState.players[0].hand=[e];gameState.players[0].sz=[da];baselineA();
  doNormalSummon(0,'atk');drive();
  ok('エルマ negative: no Equip Spell in the Graveyard → nothing is equipped',z(e)==='mz',z(e)); }
{ fresh();const e=mk(ELM,0);gameState.players[0].hand=[e];baselineA();
  ok('エルマ negative: without 「蝶の短剣－エルマ」 it cannot be Normal Summoned',ids(0).indexOf('normalSummon')<0,JSON.stringify(ids(0))); }

/* ===== ガーディアン・バオウ ===== */
{ fresh();const b=mon(BAO,0),sw=mk('破邪の大剣－バオウ',0,'up'),f=mon('キラー・トマト',1);boost(b,2000);gameState.players[0].mz=[b];gameState.players[0].sz=[sw];gameState.players[1].mz=[f];gameState.players[1].deck.push(mk('ワイト',1));baselineA();
  const a0=curATK(C(b));phase('battle');myAttack(b,f);
  ok('バオウ: it destroyed a monster in battle → ATK +1000',z(f)==='grave'&&curATK(C(b))===a0+1000,JSON.stringify([z(f),a0,curATK(C(b))]));
  ok('バオウ: the destroyed Effect Monster\'s effect (キラー・トマト summons a monster) was negated',gameState.players[1].mz.length===0,JSON.stringify(gameState.players[1].mz.map(cardName)));
  audit('バオウ 1'); }
{ fresh();const b=mk(BAO,0),t=mon('ワイト',0);gameState.players[0].hand=[b];gameState.players[0].mz=[t];baselineA();
  ok('バオウ negative: without 「破邪の大剣－バオウ」 no summon is offered',ids(0).indexOf('normalSummon')<0,JSON.stringify(ids(0))); }

/* ===== ガーディアン・シール ===== */
{ fresh();const s=mon(SEA,0),bw=mk('流星の弓－シール',0,'up'),eq=mk('団結の力',0),w=mon('ブラック・マジシャン',1);gameState.players[0].mz=[s];gameState.players[0].sz=[bw,eq];gameState.players[1].mz=[w];baselineA();
  API.equipSpell(findCardByUid(eq.uid),findCardByUid(s.uid),'test');
  ok('シール: the effect is available (an Equip Card of mine is equipped to it)',canZ(s)===true,'');
  actC(s,[uid(eq),uid(w)]);
  ok('シール: the equipped Equip Card went to the Graveyard and the chosen opponent monster was destroyed',z(eq)==='grave'&&z(w)==='grave',JSON.stringify([z(eq),z(w)]));
  audit('シール 1'); }
{ fresh();const s=mon(SEA,0),w=mon('ブラック・マジシャン',1);gameState.players[0].mz=[s];gameState.players[1].mz=[w];baselineA();
  ok('シール negative: no equipped Equip Card → not offered',canZ(s)===false,''); }
`);
