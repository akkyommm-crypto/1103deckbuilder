/* CODEX-C04 — 安全地帯 (Safe Zone).
   All activations use the real DUEL preparation / chain / resolution path and
   every completed scenario is Replay-audited. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function uid(c){return ensureCardUid(gameState,c);}
function labels(q){return q?q.candidates.map(x=>x.label||x.name||''):[];}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(active=0){resetA();gameState.activePlayer=active;gameState.turn=7;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0xc04a11;}
function pickUid(c){const q=pc(),i=q?q.candidates.findIndex(x=>x.uid===uid(c)):-1;if(i<0)return false;__choicePickV49(i);return true;}
function drive(){for(let i=0;i<700;i++){
  if(pc()) return 'choice';
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';
}return 'loop';}
function activateSafe(zoneIndex,target){duelActivateFromZone(0,'sz',zoneIndex);const q=pc();if(q&&pickUid(target))drive();return q;}
`;

/* A. The reported bug: a previously Set Continuous Trap must activate during
   the opponent's Main Phase. Only face-up Attack Position monsters are legal. */
harness(COMMON+String.raw`
fresh(1);
const safe=mk('安全地帯',0,'down'),ownAtk=mk('ワイト',0,'up','atk'),ownDef=mk('青眼の白龍',0,'up','def'),foeAtk=mk('ライオウ',1,'up','atk');safe.setTurn=5;
gameState.players[0].sz=[safe];gameState.players[0].mz=[ownAtk,ownDef];gameState.players[1].mz=[foeAtk];baselineA();
ok('A: 安全地帯 script is registered',!!CARD_SCRIPTS['安全地帯']);
duelActivateFromZone(0,'sz',0);const q=pc(),us=q&&q.candidates.map(x=>x.uid);
ok('A: Set 安全地帯 activates during the opponent turn and opens target choice',!!q,JSON.stringify({toasts:TOASTS,labels:labels(q)}));
ok('A: both players face-up Attack Position monsters are legal targets',!!q&&us.includes(uid(ownAtk))&&us.includes(uid(foeAtk)),JSON.stringify(labels(q)));
ok('A: a Defense Position monster is not a legal target',!!q&&!us.includes(uid(ownDef)),JSON.stringify(labels(q)));
if(q&&pickUid(ownAtk))drive();
const sh=findCardByUid(uid(safe)),mh=findCardByUid(uid(ownAtk));
ok('A: resolution leaves the Continuous Trap face-up and links both cards',!!sh&&sh.zone==='sz'&&safe.face==='up'&&!!linkWatchesV9(safe,uid(ownAtk))&&!!linkWatchesV9(ownAtk,uid(safe)));
audit('A');
`);

/* B. Opponent targeting and effect destruction are blocked. A different
   monster remains targetable, and a non-targeting Black Hole cannot destroy
   the protected monster. */
harness(COMMON+String.raw`
fresh(1);
const safe=mk('安全地帯',0,'down'),protectedMon=mk('ワイト',0,'up','atk'),plain=mk('E・HERO スパークマン',0,'up','atk'),rogue=mk('ならず者傭兵部隊',1),hole=mk('ブラック・ホール',1,'down');safe.setTurn=5;hole.setTurn=5;
gameState.players[0].sz=[safe];gameState.players[0].mz=[protectedMon,plain];gameState.players[1].mz=[rogue];gameState.players[1].sz=[hole];baselineA();
activateSafe(0,protectedMon);
duelActivateFromZone(1,'mz',0);let q=pc(),us=q&&q.candidates.map(x=>x.uid);
ok('B: an opponent effect cannot target the protected monster',!!q&&!us.includes(uid(protectedMon))&&us.includes(uid(plain)),JSON.stringify(labels(q)));
if(q&&pickUid(plain))drive();
duelActivateFromZone(1,'sz',0);drive();
ok('B: opponent non-targeting effect destruction is prevented',z(protectedMon)==='mz'&&z(safe)==='sz',JSON.stringify({monster:z(protectedMon),safe:z(safe)}));
audit('B');
`);

/* C. The controller's own effect may target and destroy the monster. Its
   departure immediately destroys Safe Zone through the mutual link. */
harness(COMMON+String.raw`
fresh(0);
const safe=mk('安全地帯',0,'down'),protectedMon=mk('ワイト',0,'up','atk'),rogue=mk('ならず者傭兵部隊',0);safe.setTurn=5;
gameState.players[0].sz=[safe];gameState.players[0].mz=[protectedMon,rogue];baselineA();
activateSafe(0,protectedMon);
duelActivateFromZone(0,'mz',1);const q=pc();
ok('C: my own effect may target the protected monster',!!q&&q.candidates.some(x=>x.uid===uid(protectedMon)),JSON.stringify(labels(q)));
if(q&&pickUid(protectedMon))drive();
ok('C: own effect destroys the monster and its departure destroys 安全地帯',z(protectedMon)==='grave'&&z(safe)==='grave',JSON.stringify({monster:z(protectedMon),safe:z(safe)}));
audit('C');
`);

/* D. Battle destruction is prevented, while the linked monster cannot attack
   the opponent directly. */
harness(COMMON+String.raw`
fresh(1);
const safe=mk('安全地帯',0,'down'),protectedMon=mk('ワイト',0,'up','atk'),attacker=mk('青眼の白龍',1);safe.setTurn=5;
gameState.players[0].sz=[safe];gameState.players[0].mz=[protectedMon];gameState.players[1].mz=[attacker];baselineA();
activateSafe(0,protectedMon);requestProcessorV27(PROCESSOR_V27.PHASE,{to:'battle'});drive();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('D: the linked monster is not destroyed by battle',z(protectedMon)==='mz'&&z(attacker)==='mz',JSON.stringify({monster:z(protectedMon),attacker:z(attacker)}));
audit('D battle');
`);
harness(COMMON+String.raw`
fresh(0);
const safe=mk('安全地帯',0,'down'),protectedMon=mk('青眼の白龍',0,'up','atk');safe.setTurn=5;
gameState.players[0].sz=[safe];gameState.players[0].mz=[protectedMon];baselineA();
activateSafe(0,protectedMon);requestProcessorV27(PROCESSOR_V27.PHASE,{to:'battle'});drive();
const before=gameState.players[1].lp;requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:'direct'});drive();
ok('D: the linked monster cannot attack the opponent directly',gameState.players[1].lp===before&&!protectedMon.attacked,JSON.stringify({lp:gameState.players[1].lp,toasts:TOASTS}));
audit('D direct');
`);

/* E. If Safe Zone leaves, destroy its monster. */
harness(COMMON+String.raw`
fresh(1);
const safe=mk('安全地帯',0,'down'),protectedMon=mk('ワイト',0,'up','atk'),cyclone=mk('サイクロン',1,'down');safe.setTurn=5;cyclone.setTurn=5;
gameState.players[0].sz=[safe];gameState.players[0].mz=[protectedMon];gameState.players[1].sz=[cyclone];baselineA();
activateSafe(0,protectedMon);duelActivateFromZone(1,'sz',0);const q=pc();if(q&&pickUid(safe))drive();
ok('E: when 安全地帯 leaves the field its linked monster is destroyed',z(safe)==='grave'&&z(protectedMon)==='grave',JSON.stringify({safe:z(safe),monster:z(protectedMon)}));
audit('E');
`);

/* F. If the monster leaves without being destroyed, Safe Zone is destroyed. */
harness(COMMON+String.raw`
fresh(1);
const safe=mk('安全地帯',0,'down'),escape=mk('強制脱出装置',0,'down'),protectedMon=mk('ワイト',0,'up','atk');safe.setTurn=5;escape.setTurn=5;
gameState.players[0].sz=[safe,escape];gameState.players[0].mz=[protectedMon];baselineA();
activateSafe(0,protectedMon);duelActivateFromZone(0,'sz',1);const q=pc();
ok('F: my Trap may target the linked monster during the opponent turn',!!q&&q.candidates.some(x=>x.uid===uid(protectedMon)),JSON.stringify(labels(q)));
if(q&&pickUid(protectedMon))drive();
ok('F: monster bounce destroys 安全地帯',z(protectedMon)==='hand'&&z(safe)==='grave',JSON.stringify({safe:z(safe),monster:z(protectedMon)}));
audit('F');
`);
