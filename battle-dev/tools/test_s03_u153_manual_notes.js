/* S03-U153: クリボー / ネクロ・ガードナー / 打ち出の小槌 — their effects are carried out (they only left a manual note before).
   Real DUEL path (attacks, damage calculation window, activations and choices through the processor), Replay-audited. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));return pkg;}
function uid(c){return ensureCardUid(gameState,c);}
let PREFER=[];
function pick(){const q=pc();let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||(x.card&&x.card.uid===u));if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function step(){
  if(pc()){pick();return true;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();return true;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();return true;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();return true;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();return true;}
  return false;}
function drive(){for(let i=0;i<600;i++){if(!step())return 'idle';}return 'loop';}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
/* player II attacks; player I responds at the first POINT matching want(payload) */
function attackRespond(att,target,want,zone,i){
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});
  let done=false;
  for(let k=0;k<300;k++){const w=gameState.processorWaiting;
    if(!done&&w&&w.type==='POINT'&&gameState.processorPaused&&want(w.payload||{})){pointActivateV27(0,zone,i,0);done=true;continue;}
    if(!step())break;}
  drive();return done;}
function fresh(){resetA();gameState.activePlayer=1;gameState.turn=6;gameState.phase='battle';
  const a1=mk('デーモンの召喚',1,'up'),a2=mk('ゴブリン突撃部隊',1,'up');gameState.players[1].mz=[a1,a2];
  for(let p=0;p<2;p++) gameState.players[p].deck=[mk('ワイト',p),mk('ワイト',p),mk('ワイト',p),mk('ワイト',p),mk('ワイト',p)];
  return {a1,a2};}
`;

/* ===== A. クリボー ===== */
harness(COMMON+String.raw`
const s=fresh();const kb=mk('クリボー',0);gameState.players[0].hand=[kb];
baselineA();
const r=attackRespond(s.a1,'direct',pl=>pl.kind==='damageStep'&&pl.step==='calc','hand',0);
ok('A クリボー: offered at the damage calculation, discarded, the 2500 battle damage becomes 0',r&&z(kb)==='grave'&&gameState.players[0].lp===8000,
  JSON.stringify({r,kb:z(kb),lp:gameState.players[0].lp}));
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(s.a2),target:'direct'});drive();
ok('A: only that battle — the next direct attack (2300) deals damage',gameState.players[0].lp===5700,String(gameState.players[0].lp));
audit('A');
`);

/* ===== B. ネクロ・ガードナー during an attack ===== */
harness(COMMON+String.raw`
const s=fresh();const ng=mk('ネクロ・ガードナー',0);gameState.players[0].grave=[ng];const w=mk('ワイト',0,'up');gameState.players[0].mz=[w];
baselineA();
const r=attackRespond(s.a1,w,pl=>pl.kind==='attackDeclare','grave',0);
ok('B ネクロ・ガードナー: banished at the attack declaration, the attack is negated (ワイト survives)',r&&z(ng)==='banish'&&z(w)==='mz',JSON.stringify({r,ng:z(ng),w:z(w)}));
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(s.a2),target:idx(w)});drive();
ok('B: only once — ゴブリン突撃部隊 then destroys ワイト',z(w)==='grave');
audit('B');
`);

/* ===== B2. ネクロ・ガードナー outside an attack (the Battle Step window after a first attack): the next attack is negated ===== */
harness(COMMON+String.raw`
const s=fresh();const ng=mk('ネクロ・ガードナー',0);gameState.players[0].grave=[ng];
gameState.players[0].grave=[ng];
baselineA();
/* first attack (2300, direct); in the Battle Step window after it, player I activates ネクロ・ガードナー (no attack pending) */
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(s.a2),target:'direct'});
let done=false,sawDamage=false;
for(let k=0;k<300;k++){const w=gameState.processorWaiting;
  if(gameState.players[0].lp===5700) sawDamage=true;
  if(!done&&sawDamage&&!gameState.pendingAttack&&!gameState.battle&&w&&w.type==='POINT'&&gameState.processorPaused){pointActivateV27(0,'grave',0,0);done=true;continue;}
  if(!step())break;}
drive();
ok('B2: after the first attack (LP 5700) it is activated with no attack pending: banished',done&&z(ng)==='banish'&&gameState.players[0].lp===5700,JSON.stringify({done,ng:z(ng),lp:gameState.players[0].lp}));
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(s.a1),target:'direct'});drive();
ok('B2: the next attack (direct, 2500) is negated at its declaration',gameState.players[0].lp===5700,String(gameState.players[0].lp));
audit('B2');
`);

/* ===== C. 打ち出の小槌 ===== */
harness(COMMON+String.raw`
resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
const ml=mk('打ち出の小槌',0),h1=mk('ワイト',0),h2=mk('ワイト',0),keep=mk('デーモンの召喚',0);gameState.players[0].hand=[ml,h1,h2,keep];
const d=[mk('クリボー',0),mk('クリボー',0),mk('クリボー',0),mk('クリボー',0)];gameState.players[0].deck=d;
gameState.rngInitialSeed=0x5331a5e5;gameState.rngState=0x5331a5e5;
baselineA();
duelActivateFromHand(0);
for(let k=0;k<100;k++){const q=pc();
  if(q&&/打ち出の小槌/.test(q.title||'')){answerChoiceV49(q.candidates.filter(x=>x.uid===uid(h1)||x.uid===uid(h2)).map(x=>x.key));continue;}
  if(!step())break;}
const P=gameState.players[0];
const pkgC=v41ReplayPackage(gameState);
const returned=pkgC.actions.map(x=>x&&x.action).filter(a=>a&&a.type==='FX_RETURN_DECK'&&a.zone==='hand').length;
const wights=[h1,h2].filter(c=>z(c)==='hand'||z(c)==='deck').length;
ok('C 打ち出の小槌: the 2 chosen cards are returned to the Deck (2 FX_RETURN_DECK from the hand), then 2 are drawn — hand 3 (デーモンの召喚 kept), Deck 4',
  returned===2&&wights===2&&z(keep)==='hand'&&P.hand.length===3&&P.deck.length===4&&z(ml)==='grave',
  JSON.stringify({returned,h1:z(h1),h2:z(h2),hand:P.hand.map(nm),deck:P.deck.length,ml:z(ml)}));
audit('C');
`);
