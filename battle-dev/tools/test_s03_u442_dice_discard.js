/* S03-U442: デンジャラスマシン TYPE－6, グラディアル・チェンジ, 暗黒の謀略, バッド・エンド・クイーン・ドラゴン (stale ENGINE_GAP / NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x42A0001;
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
const DM='デンジャラスマシン TYPE－6',GCH='グラディアル・チェンジ',PLO='暗黒の謀略',BQD='バッド・エンド・クイーン・ドラゴン';
const REAL_RAND=duelRandomInt;
function seq(a){const q=a.slice();duelRandomInt=function(n){return q.length?q.shift():0;};}
function unseq(){duelRandomInt=REAL_RAND;}
function myAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function H(c){return findCardByUid(c.uid);}
function setTrap(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function procOk(name,i){return strictSummonProcedureLegality(name,0,'hand',i).ok;}
function procRun(name,i){runSummonProcedure(name,0,'hand',i);if(!gameState.pendingSummon&&!pc())finishSummonProcedure(name,0,'hand',i,'atk');drive();}
let VETO=false;const __p=pick;pick=function(){const q=pc();if(VETO&&q&&q.min===0&&q.title.indexOf('無効')>=0){answerChoiceV49([q.candidates[0].key]);return;}return __p();};
function legalT(i){return strictScriptLegalityV2(cardName(gameState.players[0].sz[i]),0,'sz',i).ok;}

/* ===== デンジャラスマシン TYPE－6 ===== */
function dmField(){fresh();const s=mk(DM,0,'up'),h1=mk('ワイト',0),h2=mk('ブラック・マジシャン',0),o1=mk('ワイト',1),o2=mk('青眼の白龍',1),f=mon('ワイト',1);
  gameState.players[0].hand=[s,h1,h2];gameState.players[1].hand=[o1,o2];gameState.players[1].mz=[f];baselineA();cast(0,DM,[]);return {s,h1,h2,o1,o2,f};}
{ const x=dmField();
  ok('TYPE－6: placed face-up in my Spell & Trap Zone',z(x.s)==='sz'&&C(x.s).face==='up',JSON.stringify([z(x.s),C(x.s)&&C(x.s).face]));
  seq([0]);PREFER=[uid(x.h1)];endTurn();endTurn();drive();PREFER=[];unseq();
  ok('TYPE－6: die 1 → I discarded the hand card of my choice',z(x.h1)==='grave'&&z(x.h2)==='hand',JSON.stringify([z(x.h1),z(x.h2)]));
  audit('TYPE6 1'); }
{ const x=dmField();
  seq([1]);PREFER=[uid(x.o1)];endTurn();endTurn();drive();PREFER=[];unseq();
  ok('TYPE－6: die 2 → the opponent discarded the hand card of their own choice',z(x.o1)==='grave'&&z(x.o2)==='hand',JSON.stringify([z(x.o1),z(x.o2)])); }
{ const x=dmField();
  const n0=gameState.players[0].hand.length;seq([2]);endTurn();endTurn();drive();unseq();
  ok('TYPE－6: die 3 → I drew 1 more card (normal draw + 1)',gameState.players[0].hand.length===n0+2,JSON.stringify([n0,gameState.players[0].hand.length])); }
{ const x=dmField();
  const n1=gameState.players[1].hand.length;seq([3]);endTurn();endTurn();drive();unseq();
  ok('TYPE－6: die 4 → the opponent drew 1 on top of their own turn draw (n + 2)',gameState.players[1].hand.length===n1+2,JSON.stringify([n1,gameState.players[1].hand.length])); }
{ const x=dmField();
  seq([4]);PREFER=[uid(x.f)];endTurn();endTurn();drive();PREFER=[];unseq();
  ok('TYPE－6: die 5 → an opponent monster of my choice destroyed',z(x.f)==='grave',z(x.f)); }
{ const x=dmField();
  seq([5]);endTurn();endTurn();drive();unseq();
  ok('TYPE－6: die 6 → the card destroyed itself',z(x.s)==='grave',z(x.s)); }

/* ===== グラディアル・チェンジ ===== */
{ fresh();const tr=setTrap(GCH,0),g=mk('剣闘獣アンダル',0),o1=mk('ワイト',1),o2=mk('青眼の白龍',1);gameState.players[0].sz=[tr];gameState.players[0].hand=[g];gameState.players[1].hand=[o1,o2];baselineA();
  PREFER=[uid(o1)];API.specialSummon(0,'hand',0,'atk','test');flushDeferredEventsV2();drive();PREFER=[];
  ok('グラディアル・チェンジ: my 剣闘獣 was Special Summoned → the opponent discarded the hand card of their own choice',z(g)==='mz'&&z(tr)==='grave'&&z(o1)==='grave'&&z(o2)==='hand',JSON.stringify([z(g),z(tr),z(o1),z(o2)]));
  audit('グラディアル 1'); }
{ fresh();const tr=setTrap(GCH,0),g=mk('ワイト',0),o1=mk('ワイト',1);gameState.players[0].sz=[tr];gameState.players[0].hand=[g];gameState.players[1].hand=[o1];baselineA();
  API.specialSummon(0,'hand',0,'atk','test');flushDeferredEventsV2();drive();
  ok('グラディアル・チェンジ negative: a Special Summon of a non-剣闘獣 does not trigger it',z(tr)==='sz'&&z(o1)==='hand',JSON.stringify([z(tr),z(o1)])); }

/* ===== 暗黒の謀略 ===== */
function plot(){fresh();const tr=setTrap(PLO,0),a1=mk('ワイト',0),a2=mk('ブラック・マジシャン',0),a3=mk('青眼の白龍',0),b1=mk('ワイト',1),b2=mk('ブラック・マジシャン',1),b3=mk('青眼の白龍',1);
  gameState.players[0].sz=[tr];gameState.players[0].hand=[a1,a2,a3];gameState.players[1].hand=[b1,b2,b3];baselineA();return {tr,a1,a2,a3,b1,b2,b3};}
{ const x=plot();VETO=false;PREFER=[uid(x.a1),uid(x.a2),uid(x.b1),uid(x.b2)];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
  ok('暗黒の謀略: the opponent declined → I discarded 2 of my choice, the opponent 2 of theirs, both drew 2',z(x.a1)==='grave'&&z(x.a2)==='grave'&&z(x.b1)==='grave'&&z(x.b2)==='grave'&&z(x.a3)==='hand'&&z(x.b3)==='hand'&&gameState.players[0].hand.length===3&&gameState.players[1].hand.length===3,JSON.stringify([z(x.a1),z(x.a2),z(x.b1),z(x.b2),gameState.players[0].hand.length,gameState.players[1].hand.length]));
  audit('謀略 1'); }
{ const x=plot();VETO=true;PREFER=[];duelActivateFromZone(0,'sz',0);drive();PREFER=[];VETO=false;
  ok('暗黒の謀略: the opponent discarded 1 hand card → the effect was negated (my hand untouched, no draw)',z(x.b1)==='grave'&&z(x.b2)==='hand'&&z(x.a1)==='hand'&&z(x.a2)==='hand'&&gameState.players[0].hand.length===3&&gameState.players[1].hand.length===2,JSON.stringify([z(x.b1),z(x.b2),z(x.a1),z(x.a2),gameState.players[0].hand.length,gameState.players[1].hand.length])); }
{ fresh();const tr=setTrap(PLO,0),a1=mk('ワイト',0);gameState.players[0].sz=[tr];gameState.players[0].hand=[a1];gameState.players[1].hand=[mk('ワイト',1),mk('ワイト',1)];baselineA();
  ok('暗黒の謀略 negative: I have fewer than 2 hand cards → not activatable',legalT(0)===false,''); }

/* ===== バッド・エンド・クイーン・ドラゴン ===== */
function contSet(n){return ['エレメントの泉','つまずき','ウェポンチェンジ','7'].slice(0,n).map(x=>mk(x,0,'up'));}
{ fresh();const b=mk(BQD,0);gameState.players[0].hand=[b];gameState.players[0].sz=contSet(3);baselineA();
  ok('BEQD: three Continuous Spells on my field → Special Summonable from the hand',procOk(BQD,0)===true,'');
  procRun(BQD,0);
  ok('BEQD: Special Summoned',z(b)==='mz',z(b));
  audit('BEQD 1'); }
{ fresh();const b=mk(BQD,0);gameState.players[0].hand=[b];gameState.players[0].sz=contSet(2);baselineA();
  ok('BEQD negative: only two Continuous Spells → not Special Summonable',procOk(BQD,0)===false,''); }
{ fresh();const b=mon(BQD,0),o1=mk('ワイト',1),o2=mk('青眼の白龍',1);gameState.players[0].mz=[b];gameState.players[1].hand=[o1,o2];baselineA();
  const d0=gameState.players[0].deck.length;phase('battle');PREFER=[uid(o2)];myAttack(b,'direct');PREFER=[];
  ok('BEQD: its attack dealt battle damage → the opponent sent the hand card of their own choice to the Graveyard and I drew 1',z(o2)==='grave'&&z(o1)==='hand'&&gameState.players[0].hand.length===1&&gameState.players[0].deck.length===d0-1,JSON.stringify([z(o2),z(o1),gameState.players[0].hand.length,gameState.players[0].deck.length,d0]));
  audit('BEQD 2'); }
{ fresh();const b=mon(BQD,0),cs=contSet(2);gameState.players[0].mz=[b];gameState.players[0].sz=cs.slice();baselineA();
  API.destroy(H(b),'test');flushDeferredEventsV2();drive();
  ok('BEQD: destroyed → in the Graveyard',z(b)==='grave',z(b));
  PREFER=[uid(cs[0])];endTurn();endTurn();drive();PREFER=[];
  ok('BEQD: at my Standby Phase it was Special Summoned from the Graveyard by sending a Continuous Spell of mine to the Graveyard',z(b)==='mz'&&cs.filter(c=>z(c)==='grave').length===1,JSON.stringify([z(b),z(cs[0]),z(cs[1])]));
  audit('BEQD 3'); }
`);
