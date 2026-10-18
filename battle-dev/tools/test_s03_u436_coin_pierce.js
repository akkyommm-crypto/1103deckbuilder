/* S03-U436: ドリル・シンクロン, アルカナフォースIV－THE EMPEROR, 伝説の賭博師, 混沌の黒魔術師 (stale ENGINE_GAP cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4240001;
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
const DRI='ドリル・シンクロン',ARC='アルカナフォースIV－THE EMPEROR',GAM='伝説の賭博師',CHA='混沌の黒魔術師';
function myAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function H(c){return findCardByUid(c.uid);}
function canZ(c){return getLegalZoneActions(0,'mz',idx(c)).map(a=>a.id).indexOf('effect')>=0;}
function actC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
const REAL_RAND=duelRandomInt;
function seq(a){const q=a.slice();duelRandomInt=function(n){return q.length?q.shift():0;};}
function unseq(){duelRandomInt=REAL_RAND;}

/* ===== ドリル・シンクロン ===== */
{ fresh();const d=mon(DRI,0),w=mon('E・HERO スパークマン',0),f=mon('ワイト',1,'def');gameState.players[0].mz=[d,w];gameState.players[1].mz=[f];baselineA();
  const h0=gameState.players[0].hand.length,l1=lp(1);phase('battle');myAttack(w,f);
  ok('ドリル: my Warrior (ATK 1600) destroyed a Defense Position monster (DEF 200) → piercing damage 1400',z(f)==='grave'&&l1-lp(1)===1400,JSON.stringify([z(f),l1,lp(1)]));
  ok('ドリル: it dealt that damage → I drew 1 card',gameState.players[0].hand.length===h0+1,JSON.stringify([h0,gameState.players[0].hand.length]));
  audit('ドリル 1'); }
{ fresh();const w=mon('E・HERO スパークマン',0),f=mon('ワイト',1,'def');gameState.players[0].mz=[w];gameState.players[1].mz=[f];baselineA();
  const l1=lp(1);phase('battle');myAttack(w,f);
  ok('ドリル control: without it a Defense Position monster takes no piercing damage',z(f)==='grave'&&lp(1)===l1,JSON.stringify([z(f),l1,lp(1)])); }
{ fresh();const d=mon(DRI,0),w=mon('ブラック・マジシャン',0),f=mon('ワイト',1,'def');gameState.players[0].mz=[d,w];gameState.players[1].mz=[f];baselineA();
  const h0=gameState.players[0].hand.length,l1=lp(1);phase('battle');myAttack(w,f);
  ok('ドリル negative: a non-Warrior attacker → no piercing damage, no draw',z(f)==='grave'&&lp(1)===l1&&gameState.players[0].hand.length===h0,JSON.stringify([z(f),l1,lp(1),h0,gameState.players[0].hand.length])); }

/* ===== アルカナフォースIV－THE EMPEROR ===== */
{ fresh();const e=mk(ARC,0),o=mon('アルカナフォースI－THE MAGICIAN',0),x=mon('ワイト',0);gameState.players[0].hand=[e];gameState.players[0].mz=[o,x];baselineA();
  seq([0]);doNormalSummon(0,'atk');drive();unseq();
  ok('エンペラー: heads → every face-up 「アルカナフォース」 of mine +500 ATK (itself 1900, the other 1600), a non-Arcana monster unchanged',z(e)==='mz'&&C(e).c2ArcanaCoin==='heads'&&curATK(C(e))===1900&&curATK(C(o))===1600&&curATK(C(x))===300,JSON.stringify([z(e),C(e).c2ArcanaCoin,curATK(C(e)),curATK(C(o)),curATK(C(x))]));
  audit('エンペラー 1'); }
{ fresh();const e=mk(ARC,0),o=mon('アルカナフォースI－THE MAGICIAN',0);gameState.players[0].hand=[e];gameState.players[0].mz=[o];baselineA();
  seq([1]);doNormalSummon(0,'atk');drive();unseq();
  ok('エンペラー: tails → -500 ATK (itself 900, the other 600)',C(e).c2ArcanaCoin==='tails'&&curATK(C(e))===900&&curATK(C(o))===600,JSON.stringify([C(e).c2ArcanaCoin,curATK(C(e)),curATK(C(o))])); }
{ fresh();const e=mon(ARC,0),o=mon('アルカナフォースI－THE MAGICIAN',1);gameState.players[0].mz=[e];gameState.players[1].mz=[o];baselineA();
  C(e).c2ArcanaCoin='heads';
  ok('エンペラー: the opponent Arcana Force monster is not affected',curATK(C(o))===1100&&curATK(C(e))===1900,JSON.stringify([curATK(C(o)),curATK(C(e))])); }

/* ===== 伝説の賭博師 ===== */
{ fresh();const g=mon(GAM,0),a=mon('ワイト',1),b=mon('ワイト',1);gameState.players[0].mz=[g];gameState.players[1].mz=[a,b];baselineA();
  ok('賭博師: available in the Main Phase',canZ(g)===true,'');
  seq([0,0,0]);actC(g,[]);unseq();
  ok('賭博師: 3 heads → all the opponent monsters destroyed',z(a)==='grave'&&z(b)==='grave'&&z(g)==='mz',JSON.stringify([z(a),z(b),z(g)]));
  ok('賭博師: once per turn',canZ(g)===false,'');
  audit('賭博師 3'); }
{ fresh();const g=mon(GAM,0),f=mon('ワイト',1),h1=mk('ワイト',1),h2=mk('ブラック・マジシャン',1);gameState.players[0].mz=[g];gameState.players[1].mz=[f];gameState.players[1].hand=[h1,h2];baselineA();
  seq([0,0,1,1]);actC(g,[]);unseq();
  ok('賭博師: 2 heads → one random card of the opponent hand discarded (the chosen index 1), the field untouched',z(h2)==='grave'&&z(h1)==='hand'&&z(f)==='mz',JSON.stringify([z(h1),z(h2),z(f)])); }
{ fresh();const g=mon(GAM,0),x=mon('ワイト',0);gameState.players[0].mz=[g,x];baselineA();
  seq([0,1,1]);actC(g,[uid(x)]);unseq();
  ok('賭博師: 1 head → one chosen card of mine destroyed',z(x)==='grave'&&z(g)==='mz',JSON.stringify([z(x),z(g)])); }
{ fresh();const g=mon(GAM,0),h1=mk('ワイト',0),h2=mk('ブラック・マジシャン',0),f=mon('ワイト',1);gameState.players[0].mz=[g];gameState.players[0].hand=[h1,h2];gameState.players[1].mz=[f];baselineA();
  seq([1,1,1]);actC(g,[]);unseq();
  ok('賭博師: 0 heads → my whole hand discarded',z(h1)==='grave'&&z(h2)==='grave'&&z(f)==='mz',JSON.stringify([z(h1),z(h2),z(f)])); }

/* ===== 混沌の黒魔術師 ===== */
{ fresh();const c=mk(CHA,0),sp=mk('ブラック・ホール',0);gameState.players[0].hand=[c];gameState.players[0].grave=[sp];baselineA();
  API.specialSummon(0,'hand',0,'atk','test');flushDeferredEventsV2();drive();
  ok('混沌の黒魔術師: Special Summoned',z(c)==='mz',z(c));
  PREFER=[uid(sp)];phase('end');PREFER=[];
  ok('混沌の黒魔術師: End Phase of the summon turn → a Spell of my Graveyard was added to the hand',z(sp)==='hand',z(sp));
  audit('混沌 1'); }
{ fresh();const c=mon(CHA,0),sp=mk('ブラック・ホール',0);gameState.players[0].mz=[c];gameState.players[0].grave=[sp];baselineA();
  phase('end');
  ok('混沌の黒魔術師 negative: not summoned this turn → no retrieval',z(sp)==='grave',z(sp)); }
{ fresh();const c=mk(CHA,0);gameState.players[0].hand=[c];baselineA();
  API.specialSummon(0,'hand',0,'atk','test');flushDeferredEventsV2();drive();
  API.destroy(H(c),'test');flushDeferredEventsV2();drive();
  ok('混沌の黒魔術師: leaving the field → banished instead of the Graveyard',z(c)==='banish',z(c)); }
{ fresh();const c=mon(CHA,0),f=mon('ワイト',1);gameState.players[0].mz=[c];gameState.players[1].mz=[f];baselineA();
  phase('battle');myAttack(c,f);
  ok('混沌の黒魔術師: the monster it destroyed in battle was banished',z(f)==='banish',z(f));
  audit('混沌 2'); }
`);
