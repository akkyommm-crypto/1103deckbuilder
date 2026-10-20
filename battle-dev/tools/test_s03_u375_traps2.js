/* S03-U375: ハーピィ・レディ・SB, 異次元への隙間, バーサーキング, 能力吸収石 (NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3750001;
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

const SB='ハーピィ・レディ・SB',GAP='異次元への隙間',KING='バーサーキング',STONE='能力吸収石';

/* ===== ハーピィ・レディ・SB ===== */
{ fresh();SEEN.length=0;const bf=mk('バード・フェイス',0,'up');gameState.players[0].mz=[bf];gameState.players[1].mz=[mk('ゴブリン突撃部隊',1,'up')];
  gameState.players[0].deck=[mk('ワイト',0),mk(SB,0),mk('ハーピィ・ガール',0)];
  gameState.activePlayer=1;gameState.phase='battle';baselineA();
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
  const q=SEEN.find(s=>/バード・フェイス/.test(s.title));
  ok('SB: treated as ハーピィ・レディ — バード・フェイス offers it (not ハーピィ・ガール / ワイト)',!!q&&q.cands.length===1,JSON.stringify(SEEN));
  ok('SB: sameCanonical as ハーピィ・レディ',sameCanonicalCardV4(dbOf({id:findCardIndex(SB)}),dbOf({id:findCardIndex('ハーピィ・レディ')}))===true,'');
  audit('SB'); }

/* ===== 異次元への隙間 ===== */
{ fresh();const t=setCard(GAP,0),a=mk('青眼の白龍',0),b=mk('青眼の白龍',0),c=mk('ホーリー・エルフ',1),d=mk('ブラック・マジシャン',1);
  gameState.players[0].sz=[t];gameState.players[0].grave=[a,b];gameState.players[1].grave=[c,d];baselineA();
  ok('隙間: activatable (two same-Attribute monsters in the Graveyards)',legalSz(t)===true,'');
  actSz(t,['光',uid(a),uid(c)]);
  ok('隙間: declared 光 — the chosen 光 monsters of both Graveyards are banished',z(a)==='banish'&&z(c)==='banish',JSON.stringify([z(a),z(c)]));
  ok('隙間: the unchosen 光 monster and the 闇 monster stay',z(b)==='grave'&&z(d)==='grave',JSON.stringify([z(b),z(d)]));
  audit('隙間 1'); }
{ fresh();const t=setCard(GAP,0),a=mk('青眼の白龍',0),c=mk('ブラック・マジシャン',1);
  gameState.players[0].sz=[t];gameState.players[0].grave=[a];gameState.players[1].grave=[c];baselineA();
  ok('隙間 negative: no Attribute with two Graveyard monsters -> not activatable',legalSz(t)===false,''); }

/* ===== バーサーキング (the card activation does nothing; the effect is activated afterwards, face-up) ===== */
function kingField(){fresh();const t=setCard(KING,0),g=mon('ガルヴァス',0),o=mon('オオカミ',1);
  gameState.players[0].sz=[t];gameState.players[0].mz=[g];gameState.players[1].mz=[o];baselineA();return {t,g,o};}
{ const x=kingField();
  actSz(x.t);
  ok('バーサーキング: card activation only — it is face-up and no stat changed',C(x.t).face==='up'&&gv(x.g)===2000&&gv(x.o)===1200,JSON.stringify([C(x.t).face,gv(x.g),gv(x.o)]));
  ok('バーサーキング: the effect is now activatable (my Main Phase, two face-up Beast monsters)',legalSz(x.t)===true,'');
  actSz(x.t,[uid(x.g),uid(x.o)]);
  ok('バーサーキング: ガルヴァス (2000) halved to 1000; オオカミ (1200) +1000 = 2200',gv(x.g)===1000&&gv(x.o)===2200,JSON.stringify([gv(x.g),gv(x.o)]));
  ok('バーサーキング: once per turn',legalSz(x.t)===false,'');
  audit('バーサーキング 1'); }
{ const x=kingField();
  actSz(x.t);actSz(x.t,[uid(x.g),uid(x.o)]);
  endTurn();endTurn();
  ok('バーサーキング: at the End Phase the stats are back (2000 / 1200)',gv(x.g)===2000&&gv(x.o)===1200,JSON.stringify([gv(x.g),gv(x.o)]));
  ok('バーサーキング: usable again in the next turn',legalSz(x.t)===true,''); }
{ const x=kingField();
  actSz(x.t);endTurn();phase('battle');
  ok('バーサーキング: usable in the opposing Battle Phase (face-up, two Beast monsters)',gameState.activePlayer===1&&legalSz(x.t)===true,JSON.stringify([gameState.activePlayer,gameState.phase])); }
{ const x=kingField();
  actSz(x.t);phase('battle');
  ok('バーサーキング negative: my own Battle Phase is not a legal window',gameState.activePlayer===0&&legalSz(x.t)===false,JSON.stringify([gameState.activePlayer,gameState.phase])); }
{ fresh();const t=setCard(KING,0),g=mon('ガルヴァス',0),o=mon('ワイト',1);
  gameState.players[0].sz=[t];gameState.players[0].mz=[g];gameState.players[1].mz=[o];baselineA();
  actSz(t);
  ok('バーサーキング negative: only one Beast on the field -> the effect is not activatable',legalSz(t)===false,''); }

/* ===== 能力吸収石 ===== */
{ fresh();const s=setCard(STONE,0),r=mon('D・リモコン',0),gn=mon('氷結界の龍 グングニール',0),h1=mk('ワイト',0),g1=mk('D・ボードン',0),d1=mk('D・チャッカン',0),f1=mon('ワイト',1);
  const X=mon('超古深海王シーラカンス',0);
  gameState.players[0].sz=[s];gameState.players[0].mz=[r,gn];gameState.players[0].hand=[h1];gameState.players[0].grave=[g1];gameState.players[0].deck=[d1].concat(gameState.players[0].deck);gameState.players[1].mz=[f1];baselineA();
  actSz(s);
  ok('能力吸収石: face-up (activated)',sz(s)==='sz'&&C(s).face==='up',JSON.stringify([sz(s),C(s).face]));
  ok('能力吸収石: no counter yet',(C(s).counters&&C(s).counters['魔石'])===undefined||C(s).counters['魔石']===0,JSON.stringify(C(s).counters));
  actZ(r,[uid(g1),uid(d1)]);
  ok('能力吸収石: a monster effect (D・リモコン) was activated -> 1 魔石 counter',C(s).counters&&C(s).counters['魔石']===1,JSON.stringify(C(s).counters));
  ok('能力吸収石: with one counter, monsters still work (グングニール activatable)',canZ(gn)===true,'');
  actZ(gn,[uid(h1),uid(f1)]);
  ok('能力吸収石: the second monster effect -> 2 counters (max)',C(s).counters&&C(s).counters['魔石']===2,JSON.stringify(C(s).counters));
  ok('能力吸収石: with 2 counters every face-up monster is negated',effectNegated(C(r))&&effectNegated(C(gn)),JSON.stringify([effectNegated(C(r)),effectNegated(C(gn))]));
  ok('能力吸収石: …and no new monster effect can be activated',canZ(X)===false,'');
  audit('能力吸収石 1'); }
{ fresh();const s=setCard(STONE,0),r=mon('D・リモコン',0),gn=mon('氷結界の龍 グングニール',0),h1=mk('ワイト',0),g1=mk('D・ボードン',0),d1=mk('D・チャッカン',0),f1=mon('ワイト',1);
  gameState.players[0].sz=[s];gameState.players[0].mz=[r,gn];gameState.players[0].hand=[h1];gameState.players[0].grave=[g1];gameState.players[0].deck=[d1].concat(gameState.players[0].deck);gameState.players[1].mz=[f1];baselineA();
  actSz(s);actZ(r,[uid(g1),uid(d1)]);actZ(gn,[uid(h1),uid(f1)]);
  phase('end');drive();
  ok('能力吸収石: at the End Phase all counters are removed and the monsters work again',(C(s).counters&&C(s).counters['魔石']||0)===0&&!effectNegated(C(r)),JSON.stringify([C(s).counters,effectNegated(C(r))])); }
`);
