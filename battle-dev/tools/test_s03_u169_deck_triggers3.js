/* S03-U169: ナチュル・チェリー (sent to the GY by the opponent → up to 2 copies face-down Defense), プチトマボー (up to 2 「トマボー」,
   no Synchro Material this turn), 素早いムササビ (500 damage + any number of copies to the opponent's field; not a Tribute for an
   Advance Summon). Engine: spec.summonFlag / spec.toOpponent (engine/1ZT), GROUP.TOMABO (P4-v7), noSynchroMaterialTurnS03 in the
   Synchro material candidates, script-level noAdvanceTributeS03. Real DUEL path; Replay-audited. */
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


/* ===== A. ナチュル・チェリー ===== */
harness(COMMON+HELP+String.raw`
function cherry(setup){
  fresh();SEEN=[];TRIG=[];
  const ch=mk('ナチュル・チェリー',0,'up','atk');gameState.players[0].mz=[ch];
  const c2=mk('ナチュル・チェリー',0),c3=mk('ナチュル・チェリー',0);gameState.players[0].deck=[c2,c3,mk('ワイト',0)];gameState.players[1].deck=[mk('ワイト',1)];
  setup(ch);
  return {ch,c2,c3};
}
let r=cherry(ch=>{gameState.players[1].hand=[mk('サンダー・ボルト',1)];gameState.activePlayer=1;baselineA();});
PREFER=[uid(r.c2),uid(r.c3)];
duelActivateFromHand(0);
for(let i=0;i<200;i++){const q=pc();if(q&&q.title.indexOf('ナチュル・チェリー')===0){answerChoiceV49(q.candidates.map(x=>x.key));continue;}if(q){pick();continue;}
  if(EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length){TRIG.push({names:g.map(c=>c.name),forced:EVT_V2_STATE.rank<2});eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}break;}
PREFER=[];
ok('A: destroyed by the opponent\'s サンダー・ボルト — optional trigger; 2 ナチュル・チェリー Special Summoned in face-down Defense Position',z(r.ch)==='grave'&&evOffered('ナチュル・チェリー')&&!evForced('ナチュル・チェリー')&&[r.c2,r.c3].every(c=>{const h=findCardByUid(c.uid);return h&&h.zone==='mz'&&h.card.face==='down'&&h.card.pos==='def';}),JSON.stringify({trig:TRIG}));
audit('A effect');
r=cherry(ch=>{gameState.players[0].hand=[mk('ブラック・ホール',0)];baselineA();});
duelActivateFromHand(0);drive();
ok('A: destroyed by its controller\'s own ブラック・ホール — no trigger',z(r.ch)==='grave'&&!evOffered('ナチュル・チェリー'));
r=cherry(ch=>{gameState.players[1].mz=[mk('ゴブリン突撃部隊',1,'up')];gameState.activePlayer=1;gameState.phase='battle';baselineA();});
SKIP_OPTIONAL=true;hitAt(1,gameState.players[1].mz[0],r.ch);SKIP_OPTIONAL=false;
ok('A: destroyed by battle with the opponent\'s monster — the trigger is offered (declined here)',z(r.ch)==='grave'&&evOffered('ナチュル・チェリー')&&z(r.c2)==='deck');
audit('A battle');
`);

/* ===== B. プチトマボー ===== */
harness(COMMON+HELP+String.raw`
fresh();
const pt=mk('プチトマボー',0,'up','atk');gameState.players[0].mz=[pt];gameState.players[1].mz=[mk('ゴブリン突撃部隊',1,'up')];
const t1=mk('トマボー',0),t2=mk('プチトマボー',0);gameState.players[0].deck=[t1,mk('ワイト',0),t2];gameState.players[1].deck=[mk('ワイト',1)];
gameState.activePlayer=1;gameState.phase='battle';baselineA();
atk(1,0);
for(let i=0;i<200;i++){const q=pc();if(q&&q.title.indexOf('プチトマボー')===0){SEEN.push({title:q.title,names:q.candidates.map(x=>x.name)});answerChoiceV49(q.candidates.map(x=>x.key));continue;}if(q){pick();continue;}
  if(EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}break;}
const s=SEEN.find(x=>x.title.indexOf('プチトマボー')===0);
const sm=[t1,t2].map(c=>findCardByUid(c.uid)).filter(h=>h&&h.zone==='mz');
ok('B: destroyed by battle — offers only the 「トマボー」 monsters (トマボー, プチトマボー; not ワイト) and Special Summons both',!!s&&s.names.length===2&&s.names.indexOf('ワイト')<0&&sm.length===2,JSON.stringify({seen:SEEN,sm:sm.length}));
ok('B: this turn they cannot be Synchro Material (turn mark; not in the Synchro material candidates)',sm.every(h=>h.card.noSynchroMaterialTurnS03===gameState.turn)&&!materialCandidates(0,'synchro').some(x=>sm.some(h=>h.card===x.card)));
audit('B');
`);

/* ===== C. 素早いムササビ ===== */
harness(COMMON+HELP+String.raw`
fresh();
const ms=mk('素早いムササビ',0,'up','atk');gameState.players[0].mz=[ms];gameState.players[1].mz=[mk('ゴブリン突撃部隊',1,'up')];
const m2=mk('素早いムササビ',0),m3=mk('素早いムササビ',0);gameState.players[0].deck=[m2,m3,mk('ワイト',0)];gameState.players[1].deck=[mk('ワイト',1)];
gameState.activePlayer=1;gameState.phase='battle';baselineA();
const lp1=gameState.players[1].lp;
atk(1,0);
let seen=null;
for(let i=0;i<200;i++){const q=pc();if(q&&q.title.indexOf('素早いムササビ')===0){seen={min:q.min,max:q.max};answerChoiceV49(q.candidates.map(x=>x.key));continue;}if(q){pick();continue;}
  if(EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length){TRIG.push({names:g.map(c=>c.name),forced:EVT_V2_STATE.rank<2});eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}break;}
const on1=[m2,m3].map(c=>findCardByUid(c.uid)).filter(h=>h&&h.zone==='mz'&&h.p===1);
ok('C: forced — 500 damage to the opponent; the choice allows 0 to 2; both copies are Special Summoned face-up Attack on the OPPONENT\'s field',evForced('素早いムササビ')&&gameState.players[1].lp===lp1-500&&!!seen&&seen.min===0&&seen.max===2&&on1.length===2&&on1.every(h=>h.card.face==='up'&&h.card.pos==='atk'),JSON.stringify({lp:gameState.players[1].lp,lp1,seen,on1:on1.length}));
audit('C');
fresh();
const m4=mk('素早いムササビ',0,'up','atk'),w4=mk('ワイト',0,'up','atk');gameState.players[0].mz=[m4,w4];baselineA();
ok('C: 「アドバンス召喚のためにはリリースできない」 — not a Tribute candidate (ワイト is)',!tributeCandidates(0).some(x=>x.card===m4)&&tributeCandidates(0).some(x=>x.card===w4));
`);
