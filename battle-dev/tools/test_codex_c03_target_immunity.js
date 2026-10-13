/* CODEX-C03 — source/controller-aware targeting immunity.
   Every activation uses the real DUEL preparation/chain path and the completed
   scenarios are Replay-audited. */
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
  gameState.rngInitialSeed=gameState.rngState=0xc03a11;}
function pickUid(c){const q=pc(),i=q?q.candidates.findIndex(x=>x.uid===uid(c)):-1;if(i<0)throw Error('candidate missing: '+cardName(c));__choicePickV49(i);}
function drive(){for(let i=0;i<500;i++){
  if(pc()) return 'choice';
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';
}return 'loop';}
`;

/* A. The opponent's Effect Monster cannot target either the Garden Warden or
   another face-up Ice Barrier monster. A non-Ice-Barrier target stays legal. */
harness(COMMON+String.raw`
fresh(1);
const guard=mk('氷結界の御庭番',0),ice=mk('氷結界の術者',0),plain=mk('ワイト',0),rogue=mk('ならず者傭兵部隊',1);
gameState.players[0].mz=[guard,ice,plain];gameState.players[1].mz=[rogue];baselineA();
ok('A: 氷結界の御庭番 script is registered',!!CARD_SCRIPTS['氷結界の御庭番']);
duelActivateFromZone(1,'mz',0);
const q=pc(),us=q&&q.candidates.map(x=>x.uid);
ok('A: opponent Effect Monster cannot target 氷結界の御庭番',!!q&&!us.includes(uid(guard)),JSON.stringify(labels(q)));
ok('A: opponent Effect Monster cannot target another face-up Ice Barrier',!!q&&!us.includes(uid(ice)),JSON.stringify(labels(q)));
ok('A: a non-Ice-Barrier monster remains targetable',!!q&&us.includes(uid(plain)),JSON.stringify(labels(q)));
pickUid(plain);drive();
ok('A: the legal target is destroyed; both protected monsters remain',z(plain)==='grave'&&z(guard)==='mz'&&z(ice)==='mz');
audit('A');
`);

/* B. The controller's own monster effects are not blocked. */
harness(COMMON+String.raw`
fresh(0);
const guard=mk('氷結界の御庭番',0),ice=mk('氷結界の術者',0),rogue=mk('ならず者傭兵部隊',0);
gameState.players[0].mz=[guard,ice,rogue];baselineA();
duelActivateFromZone(0,'mz',2);const q=pc(),us=q&&q.candidates.map(x=>x.uid);
ok('B: my Effect Monster may target my protected Ice Barrier',!!q&&us.includes(uid(ice)),JSON.stringify(labels(q)));
pickUid(ice);drive();ok('B: own monster effect destroys the chosen Ice Barrier',z(ice)==='grave'&&z(guard)==='mz');audit('B');
`);

/* C. The text blocks only Effect Monsters, so an opponent's Trap is legal. */
harness(COMMON+String.raw`
fresh(1);
const guard=mk('氷結界の御庭番',0),ice=mk('氷結界の術者',0),trap=mk('強制脱出装置',1,'down');trap.setTurn=5;
gameState.players[0].mz=[guard,ice];gameState.players[1].sz=[trap];baselineA();
duelActivateFromZone(1,'sz',0);const q=pc();
ok('C: opponent Trap may target the Ice Barrier',!!q&&q.candidates.some(x=>x.uid===uid(ice)),JSON.stringify(labels(q)));
pickUid(ice);drive();ok('C: Trap returns the chosen Ice Barrier',z(ice)==='hand'&&z(guard)==='mz');audit('C');
`);

/* D. An opponent's Spell is also legal. */
harness(COMMON+String.raw`
fresh(1);
const guard=mk('氷結界の御庭番',0),ice=mk('氷結界の術者',0),moon=mk('月の書',1,'down');moon.setTurn=5;
gameState.players[0].mz=[guard,ice];gameState.players[1].sz=[moon];baselineA();
duelActivateFromZone(1,'sz',0);const q=pc();
ok('D: opponent Spell may target the Ice Barrier',!!q&&q.candidates.some(x=>x.uid===uid(ice)),JSON.stringify(labels(q)));
pickUid(ice);drive();ok('D: Spell changes the chosen Ice Barrier face-down',ice.face==='down'&&ice.pos==='def');audit('D');
`);

/* E. Negating the source continuous effect disables the protection. */
harness(COMMON+String.raw`
fresh(1);
const guard=mk('氷結界の御庭番',0),ice=mk('氷結界の術者',0),rogue=mk('ならず者傭兵部隊',1);guard.negated=true;
gameState.players[0].mz=[guard,ice];gameState.players[1].mz=[rogue];baselineA();
duelActivateFromZone(1,'mz',0);const q=pc();
ok('E: a negated Garden Warden gives no targeting protection',!!q&&q.candidates.some(x=>x.uid===uid(ice)),JSON.stringify(labels(q)));
pickUid(ice);drive();ok('E: opponent monster effect resolves on the formerly protected monster',z(ice)==='grave');audit('E');
`);

/* F. A face-down card has no public Ice Barrier name and is not protected. */
harness(COMMON+String.raw`
fresh(1);
const guard=mk('氷結界の御庭番',0),ice=mk('氷結界の術者',0,'down','def'),rogue=mk('ならず者傭兵部隊',1);
gameState.players[0].mz=[guard,ice];gameState.players[1].mz=[rogue];baselineA();
duelActivateFromZone(1,'mz',0);const q=pc();
ok('F: a face-down Ice Barrier is not protected by its hidden name',!!q&&q.candidates.some(x=>x.uid===uid(ice)),JSON.stringify(labels(q)));
pickUid(ice);drive();ok('F: opponent monster effect destroys the face-down target',z(ice)==='grave');audit('F');
`);
