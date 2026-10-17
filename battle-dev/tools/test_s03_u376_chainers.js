/* S03-U376: 獣人アレス, 連爆魔人, 紅蓮の炎壁, 地獄の暴走召喚 (NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3760001;
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


const ARES='獣人アレス',RENB='連爆魔人',FLAME='紅蓮の炎壁',RECK='地獄の暴走召喚';

/* ===== 獣人アレス ===== */
{ fresh();const a=mon(ARES,0),cy=mk('サイクロン',0,'up'),cy2=mk('サイクロン',0,'up'),t1=setCard('強制脱出装置',1),t2=setCard('強制脱出装置',1);
  gameState.players[0].mz=[a];gameState.players[0].hand=[cy,cy2];gameState.players[1].sz=[t1,t2];baselineA();
  ok('アレス: ATK 500 at the start',gv(a)===500,String(gv(a)));
  cast(0,'サイクロン',[uid(t1)]);
  ok('アレス: a chain occurred (サイクロン) -> ATK +500 (1000)',gv(a)===1000,String(gv(a)));
  cast(0,'サイクロン',[uid(t2)]);
  ok('アレス: another chain -> ATK 1500',gv(a)===1500,String(gv(a)));
  audit('アレス 1'); }
{ fresh();const a=mk(ARES,0,'down','def'),cy=mk('サイクロン',0,'up'),t1=setCard('強制脱出装置',1);
  gameState.players[0].mz=[a];gameState.players[0].hand=[cy];gameState.players[1].sz=[t1];baselineA();
  cast(0,'サイクロン',[uid(t1)]);
  ok('アレス negative: face-down -> no effect (ATK 500 once flipped)',C(a).face==='down'&&curATK(C(a))===500,JSON.stringify([C(a).face,curATK(C(a))])); }

/* ===== 連爆魔人 ===== */
{ fresh();const r=mon(RENB,0),cy=mk('サイクロン',0,'up'),fc=setCard('サイクロン',1),t1=setCard('強制脱出装置',1),t2=setCard('リビングデッドの呼び声',0);
  gameState.players[0].mz=[r];gameState.players[0].hand=[cy];gameState.players[0].sz=[t2];gameState.players[1].sz=[t1,fc];baselineA();
  const l1=lp(1);
  PREFER=[uid(t1)];duelActivateFromHand(0);for(let i=0;i<10&&pc();i++)pick();PREFER=[];
  ok('連爆魔人: the opponent is offered a chain with its own サイクロン',offeredTo(1,fc),JSON.stringify({len:gameState.chain.length}));
  respond(1,fc,[uid(t2)]);drive();
  ok('連爆魔人: a Spell chained (link 2) -> 500 damage to the opponent of the controller (once)',lp(1)===l1-500&&lp(0)===8000,JSON.stringify([l1,lp(1),lp(0)]));
  audit('連爆魔人 1'); }
{ fresh();const r=mon(RENB,0),cy=mk('サイクロン',0,'up'),t1=setCard('強制脱出装置',1);
  gameState.players[0].mz=[r];gameState.players[0].hand=[cy];gameState.players[1].sz=[t1];baselineA();
  const l1=lp(1);cast(0,'サイクロン',[uid(t1)]);
  ok('連爆魔人 negative: a lone Spell (chain link 1) deals no damage',lp(1)===l1,JSON.stringify([l1,lp(1)])); }

/* ===== 紅蓮の炎壁 ===== */
{ fresh();const f=mk(FLAME,0,'up'),l1=mk('ラヴァル炎湖畔の淑女',0),l2=mk('ラヴァル・ウォリアー',0),l3=mk('ラヴァル・ガンナー',0),other=mk('ワイト',0);
  gameState.players[0].hand=[f];gameState.players[0].grave=[l1,l2,l3,other];baselineA();
  cast(0,FLAME,[uid(l1),'yes',uid(l2),'no']);
  ok('炎壁: the two chosen 「ラヴァル」 were banished (cost); the third and the other monster stay',z(l1)==='banish'&&z(l2)==='banish'&&z(l3)==='grave'&&z(other)==='grave',JSON.stringify([z(l1),z(l2),z(l3),z(other)]));
  const toks=gameState.players[0].mz.filter(c=>cardName(c)==='ラヴァルトークン');
  ok('炎壁: two ラヴァルトークン in Defense Position (ATK / DEF 0)',toks.length===2&&toks.every(c=>c.pos==='def'&&curATK(c)===0&&curDEF(c)===0),JSON.stringify(toks.map(c=>[cardName(c),c.pos,curATK(c)])));
  audit('炎壁 1'); }
{ fresh();const f=mk(FLAME,0,'up'),l1=mk('ラヴァル炎湖畔の淑女',0),l2=mk('ラヴァル・ウォリアー',0);
  gameState.players[0].hand=[f];gameState.players[0].grave=[l1,l2];gameState.players[0].mz=[mon('ワイト',0),mon('ワイト',0),mon('ワイト',0),mon('ワイト',0)];baselineA();
  cast(0,FLAME,[uid(l1),'yes',uid(l2)]);
  const toks=gameState.players[0].mz.filter(c=>cardName(c)==='ラヴァルトークン');
  ok('炎壁: only as many as the free Monster Zones (one) are chosen / Summoned',toks.length===1&&gameState.players[0].mz.length===5,JSON.stringify([toks.length,gameState.players[0].mz.length])); }
{ fresh();const f=mk(FLAME,0,'up');gameState.players[0].hand=[f];gameState.players[0].grave=[mk('ワイト',0)];baselineA();
  ok('炎壁 negative: no 「ラヴァル」 in the Graveyard -> not activatable',getLegalHandActions(0,0).some(a=>a.id==='activate')===false,''); }

/* ===== 地獄の暴走召喚 ===== */
{ fresh();const t=setCard(RECK,0),rv=mk('死者蘇生',0,'up'),k1=mk('ワイト',0),f=mon('ワイト',1),fd=mk('ワイト',1),fh=mk('ワイト',1);
  gameState.players[0].sz=[t];gameState.players[0].grave=[k1];gameState.players[0].hand=[rv,mk('ワイト',0)];gameState.players[0].deck=[mk('ワイト',0),mk('ワイト',0)].concat(gameState.players[0].deck);
  gameState.players[1].mz=[f];gameState.players[1].hand=[fh];gameState.players[1].grave=[fd];baselineA();
  PREFER=[uid(k1)];duelActivateFromHand(0);for(let i=0;i<10&&pc();i++)pick();PREFER=[];drive();
  ok('暴走召喚: 死者蘇生 revived one ワイト (ATK 300) -> the Quick-Play Spell was used',z(t)==='grave',JSON.stringify([z(t),gameState.players[0].mz.length]));
  const mine=gameState.players[0].mz.filter(c=>cardName(c)==='ワイト');
  ok('暴走召喚: my other ワイト (hand, Deck, Graveyard) up to the free zones were Special Summoned in Attack Position',mine.length>=4&&mine.every(c=>c.pos==='atk'),JSON.stringify(mine.map(c=>c.pos)));
  const theirs=gameState.players[1].mz.filter(c=>cardName(c)==='ワイト');
  ok('暴走召喚: the opponent chose their face-up ワイト and Special Summoned its same-name monsters (hand, Graveyard)',theirs.length>=3,JSON.stringify(theirs.length));
  audit('暴走召喚 1'); }
{ fresh();const t=setCard(RECK,0),rv=mk('死者蘇生',0,'up'),k1=mk('青眼の白龍',0);
  gameState.players[0].sz=[t];gameState.players[0].grave=[k1];gameState.players[0].hand=[rv];gameState.players[1].mz=[mon('ワイト',1)];baselineA();
  PREFER=[uid(k1)];duelActivateFromHand(0);for(let i=0;i<10&&pc();i++)pick();PREFER=[];drive();
  ok('暴走召喚 negative: a Special Summoned monster with ATK over 1500 -> not used',z(t)==='sz',z(t)); }
{ fresh();const t=setCard(RECK,0),rv=mk('死者蘇生',0,'up'),k1=mk('ワイト',0);
  gameState.players[0].sz=[t];gameState.players[0].grave=[k1];gameState.players[0].hand=[rv];gameState.players[1].mz=[];baselineA();
  PREFER=[uid(k1)];duelActivateFromHand(0);for(let i=0;i<10&&pc();i++)pick();PREFER=[];drive();
  ok('暴走召喚 negative: the opponent has no face-up monster -> not used',z(t)==='sz',z(t)); }
`);
