/* S03-U185: cards combining a Deck trigger (engine/1ZT deckTriggerEffectV4S03) with other effects — メカウサー (flip burn; recruit face-down),
   サイバー・ラーバァ (attack target → battle damage 0 this turn; recruit), 電池メン－ボタン型 (flip recruit; reversed + battle destroyed → draw),
   ガスタ・サンボルト (battle destroyed → at that Battle Phase end, banish a ガスタ → Psychic WIND DEF ≤ 1500 from the Deck).
   Real DUEL paths; Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function C(c){return findCardByUid(c.uid).card;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=1;gameState.turn=5;gameState.phase='battle';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:4},()=>mk('ワイト',p));}
let PREFER=[],TRIG=[];
function step(){const q=pc();if(q){let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push(g.map(c=>c.name));eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function attack(p,a,t){const ai=gameState.players[p].mz.indexOf(C(a)),ti=gameState.players[p===0?1:0].mz.indexOf(C(t));requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:ai,target:ti});drive();}
function trig(name){return TRIG.some(g=>g.indexOf(name)>=0);}

/* ===== A: メカウサー — destroyed by battle → another メカウサー from the Deck in face-down Defense; flipped by an attack → 500 to the chosen card's controller ===== */
fresh();
let mu=mk('メカウサー',0,'up'),mu2=mk('メカウサー',0);gameState.players[0].mz=[mu];gameState.players[0].deck.push(mu2);
let gi=mk('ギガンテス',1,'up');gameState.players[1].mz=[gi];baselineA();
TRIG=[];attack(1,gi,mu);
ok('A: destroyed by battle → optional trigger summoned メカウサー face-down Defense',z(mu)==='grave'&&z(mu2)==='mz'&&C(mu2).face==='down'&&C(mu2).pos==='def'&&trig('メカウサー'),JSON.stringify({mu:z(mu),mu2:z(mu2),TRIG}));
audit('A');
fresh();
mu=mk('メカウサー',0,'down','def');gameState.players[0].mz=[mu];gi=mk('ギガンテス',1,'up');gameState.players[1].mz=[gi];baselineA();
const lp1=gameState.players[1].lp;
PREFER=[gi.uid];attack(1,gi,mu);PREFER=[];
ok('A: flipped by the attack → the forced flip effect deals 500 to ギガンテス’s controller',gameState.players[1].lp===lp1-500,JSON.stringify({lp:gameState.players[1].lp}));
audit('A2');

/* ===== B: サイバー・ラーバァ — selected as the attack target → its controller takes no battle damage this turn; destroyed → recruit another ===== */
fresh();
let cl=mk('サイバー・ラーバァ',0,'up'),cl2=mk('サイバー・ラーバァ',0);gameState.players[0].mz=[cl];gameState.players[0].deck.push(cl2);
gi=mk('ギガンテス',1,'up');gameState.players[1].mz=[gi];baselineA();
const lp0=gameState.players[0].lp;
TRIG=[];PREFER=[cl2.uid,'atk'];attack(1,gi,cl);PREFER=[];
ok('B: ① forced on the attack; 1500 battle damage prevented; ② recruited サイバー・ラーバァ',gameState.players[0].lp===lp0&&z(cl)==='grave'&&z(cl2)==='mz'&&trig('サイバー・ラーバァ'),JSON.stringify({lp:gameState.players[0].lp,cl:z(cl),cl2:z(cl2),TRIG}));
audit('B');

/* ===== C: 電池メン－ボタン型 — flipped by an attack: recruit 電池メン－単三型 (face-up); then destroyed by battle (it was reversed) → draw 1 ===== */
fresh();
let bt=mk('電池メン－ボタン型',0,'down','def'),aa=mk('電池メン－単三型',0);gameState.players[0].mz=[bt];gameState.players[0].deck.push(aa);
gi=mk('ギガンテス',1,'up');gameState.players[1].mz=[gi];baselineA();
const h0=gameState.players[0].hand.length;
TRIG=[];PREFER=[aa.uid,'def'];attack(1,gi,bt);PREFER=[];
ok('C: flip → 単三型 special summoned (Defense, chosen); destroyed by battle after reversing → drew 1',z(aa)==='mz'&&C(aa).pos==='def'&&z(bt)==='grave'&&gameState.players[0].hand.length===h0+1,JSON.stringify({aa:z(aa),bt:z(bt),h:gameState.players[0].hand.length,TRIG}));
audit('C');
fresh();
bt=mk('電池メン－ボタン型',0,'up');gameState.players[0].mz=[bt];gi=mk('ギガンテス',1,'up');gameState.players[1].mz=[gi];baselineA();
const h1=gameState.players[0].hand.length;
attack(1,gi,bt);
ok('C: never reversed (summoned face-up) → no draw when destroyed by battle',z(bt)==='grave'&&gameState.players[0].hand.length===h1);

/* ===== D: ガスタ・サンボルト — destroyed by battle; at that Battle Phase end banish ガスタ・イグル → ガスタの静寂 カーム from the Deck ===== */
fresh();
let sb=mk('ガスタ・サンボルト',0,'up'),ig=mk('ガスタ・イグル',0),km=mk('ガスタの静寂 カーム',0);gameState.players[0].mz=[sb];gameState.players[0].grave=[ig];gameState.players[0].deck.push(km);
gi=mk('ギガンテス',1,'up');gameState.players[1].mz=[gi];baselineA();
attack(1,gi,sb);
ok('D: destroyed by battle — nothing yet at the damage step',z(sb)==='grave'&&z(km)==='deck');
TRIG=[];PREFER=[ig.uid,km.uid,'def'];phase('main2');PREFER=[];
ok('D: at the Battle Phase end — ガスタ・イグル banished, カーム special summoned',trig('ガスタ・サンボルト')&&z(ig)==='banish'&&z(km)==='mz',JSON.stringify({TRIG,ig:z(ig),km:z(km)}));
audit('D');
`);
