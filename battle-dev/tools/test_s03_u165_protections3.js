/* S03-U165: デュアル・ソルジャー (Gemini: once-per-turn battle protection + recruit a Lv4-or-lower Gemini after damage calculation),
   幻獣サンダーペガス (GY quick effect at the opponent's attack declaration: a 「幻獣」 monster is not destroyed by battle this turn),
   E・HERO テンペスター (cost: another own card; a selected own monster is not destroyed by battle while it is face-up).
   Real DUEL path; Replay-audited, fixed seed. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pc(){return pendingChoiceV49(gameState);}
function uid(c){return ensureCardUid(gameState,c);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;}
/* SEEN: every choice shown {title, names, min, max, cancelable}; TRIG: every trigger group offered {names, forced}.
   PREFER: uids / keys to pick first; SKIP_OPTIONAL: decline optional trigger groups. */
let PREFER=[],SEEN=[],TRIG=[],SKIP_OPTIONAL=false;
function pick(){const q=pc();SEEN.push({title:q.title,names:q.candidates.map(x=>x.name||x.label||(x.uid!=null?nm(findCardByUid(x.uid)&&findCardByUid(x.uid).card):x.value)),min:q.min,max:q.max,cancelable:!!q.cancelable,kind:q.kind});
  let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.key===u||x.value===u);if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<600;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];
    if(g.length){TRIG.push({names:g.map(c=>c.name),forced:st.rank<2});}
    if(g.length&&!(SKIP_OPTIONAL&&st.rank>=2))eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function toPoint(kind){for(let i=0;i<80;i++){
  const w=gameState.processorWaiting;
  if(w&&w.type==='POINT'&&gameState.processorPaused&&(w.payload||{}).kind===kind)return true;
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return false;}return false;}
function journal(t){return V41_ACTION_JOURNAL.filter(x=>x.action.type===t);}
function chains(name){return journal('CHAIN_ADD').filter(x=>x.action&&(x.action.name===name||(x.action.link&&x.action.link.name===name)));}
function evOffered(name){return TRIG.some(e=>e.names.indexOf(name)>=0);}
function evForced(name){const e=TRIG.find(e=>e.names.indexOf(name)>=0);return !!(e&&e.forced);}
function seenFor(name){return SEEN.filter(s=>s.title.indexOf(name)===0);}
function atk(p,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:0,target:t==null?0:t});}
`;

const HELP=String.raw`
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function nextTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});drive();
  requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function decks(){for(let p=0;p<2;p++) gameState.players[p].deck=[mk('ワイト',p),mk('ワイト',p),mk('ワイト',p),mk('ワイト',p),mk('ワイト',p)];}
function hitAt(p,atkCard,target){const ai=gameState.players[p].mz.indexOf(atkCard),ti=gameState.players[p===0?1:0].mz.indexOf(target);
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:ai,target:ti});drive();}
`;


/* ===== A. デュアル・ソルジャー ===== */
harness(COMMON+HELP+String.raw`
fresh();
const ds=mk('デュアル・ソルジャー',0,'up','atk');gameState.players[0].mz=[ds];
const gob=mk('ゴブリン突撃部隊',1,'up');gameState.players[1].mz=[gob];
const lan=mk('デュアル・ランサー',0),ds2=mk('デュアル・ソルジャー',0),va=mk('ヴァリュアブル・アーマー',0);
gameState.players[0].deck=[ds2,va,lan,mk('ワイト',0),mk('ワイト',0)];gameState.players[1].deck=[mk('ワイト',1),mk('ワイト',1)];
baselineA();
doGeminiSummonS03(0,'mz',0);drive();
const g0=findCardByUid(ds.uid).card.dualUp===true;
phase('battle');
PREFER=[uid(lan),'atk'];hitAt(0,findCardByUid(ds.uid).card,gob);PREFER=[];
const s=seenFor('デュアル・ソルジャー')[0];
ok('A: Gemini Summoned; it attacks ゴブリン突撃部隊 and is not destroyed (1st battle of the turn)',g0&&z(ds)==='mz',JSON.stringify({g0,z:z(ds)}));
ok('A: after damage calculation it Special Summons a Lv4-or-lower Gemini from the Deck — only デュアル・ランサー offered (not another デュアル・ソルジャー, not the Lv5 ヴァリュアブル・アーマー)',!!s&&JSON.stringify(s.names)==='["デュアル・ランサー"]'&&z(lan)==='mz',JSON.stringify({seen:SEEN,trig:TRIG}));
audit('A');

fresh();SEEN=[];TRIG=[];
const d2=mk('デュアル・ソルジャー',0,'up','atk');gameState.players[0].mz=[d2];
const g2=mk('ゴブリン突撃部隊',1,'up');gameState.players[1].mz=[g2];gameState.players[0].deck=[mk('デュアル・ランサー',0)];
gameState.phase='battle';baselineA();
hitAt(0,d2,g2);
ok('A: not Gemini Summoned — a Normal Monster: destroyed by battle, no Special Summon',z(d2)==='grave'&&!evOffered('デュアル・ソルジャー'));
audit('A normal');
`);

/* ===== B. 幻獣サンダーペガス ===== */
harness(COMMON+HELP+String.raw`
fresh();
const gz=mk('幻獣王ガゼル',0,'up','atk');gameState.players[0].mz=[gz];
const tp=mk('幻獣サンダーペガス',0);gameState.players[0].grave=[tp];
const b1=mk('青眼の白龍',1,'up'),b2=mk('青眼の白龍',1,'up');gameState.players[1].mz=[b1,b2];
decks();gameState.activePlayer=1;gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});
const at=toPoint('attackDeclare');
const offered=at&&(getChainResponsesV2(0)||[]).some(r=>r.db.n==='幻獣サンダーペガス');
if(offered){PREFER=[uid(gz)];pointActivateV27(0,'grave',0);}
drive();PREFER=[];
ok('B: at the opponent\'s attack declaration 幻獣サンダーペガス is offered from the GY; it is banished as the cost',offered&&z(tp)==='banish',JSON.stringify({at,offered,tp:z(tp)}));
ok('B: 幻獣王ガゼル is not destroyed by the attacking 青眼の白龍',z(gz)==='mz');
hitAt(1,b2,findCardByUid(gz.uid).card);
ok('B: 「このターン」 — not destroyed by the 2nd attack either',z(gz)==='mz');
audit('B');
`);

/* ===== C. E・HERO テンペスター ===== */
harness(COMMON+HELP+String.raw`
fresh();
const te=mk('E・HERO テンペスター',0,'up','atk'),w=mk('ワイト',0,'up','atk'),gob=mk('ゴブリン突撃部隊',0,'up','atk');gameState.players[0].mz=[te,w,gob];
const bl=mk('青眼の白龍',1,'up');gameState.players[1].mz=[bl];
for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:6},()=>mk('ワイト',p));
baselineA();
PREFER=[uid(w),uid(gob)];duelActivateFromZone(0,'mz',0);drive();PREFER=[];
ok('C: ignition — ワイト sent to the GY as the cost; ゴブリン突撃部隊 selected (linked on both monsters)',z(w)==='grave'&&findCardByUid(gob.uid).card.u165TempesterBy===te.uid,JSON.stringify({w:z(w),seen:SEEN.map(s=>s.title)}));
nextTurn();phase('battle');
const lp0=gameState.players[0].lp;
hitAt(1,findCardByUid(bl.uid).card,findCardByUid(gob.uid).card);
ok('C: in the opponent\'s turn ゴブリン突撃部隊 is not destroyed by battle (the battle damage still applies)',z(gob)==='mz'&&gameState.players[0].lp===lp0-700,JSON.stringify({gob:z(gob),lp:gameState.players[0].lp,lp0}));
audit('C');

fresh();
const t2=mk('E・HERO テンペスター',0,'up','atk'),w2=mk('ワイト',0,'up','atk'),g2=mk('ゴブリン突撃部隊',0,'up','atk');gameState.players[0].mz=[t2,w2,g2];
gameState.players[1].mz=[mk('青眼の白龍',1,'up')];gameState.players[1].hand=[mk('サンダー・ボルト',1)];
for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:6},()=>mk('ワイト',p));
baselineA();
PREFER=[uid(w2),uid(g2)];duelActivateFromZone(0,'mz',0);drive();PREFER=[];
nextTurn();
duelActivateFromHand(0);drive();
phase('battle');
hitAt(1,gameState.players[1].mz[0],findCardByUid(g2.uid).card);
ok('C: with テンペスター destroyed (サンダー・ボルト), ゴブリン突撃部隊 is no longer protected',z(t2)==='grave'&&z(g2)==='grave',JSON.stringify({t2:z(t2),g2:z(g2)}));
audit('C gone');
`);
