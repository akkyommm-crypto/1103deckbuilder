/* S03-U166: D・ステープラン — Attack Position: the opponent cannot target its other monsters for attacks, and when destroyed by battle
   the monster that destroyed it loses 300 ATK; Defense Position: not destroyed by battle, and after it is attacked the attacker-side
   face-up Attack Position monster it targets goes to Defense Position while it goes to Attack Position.
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


harness(COMMON+HELP+String.raw`
/* A. Attack Position */
fresh();
const st=mk('D・ステープラン',0,'up','atk'),w=mk('ワイト',0,'up','atk');gameState.players[0].mz=[st,w];
const gob=mk('ゴブリン突撃部隊',1,'up');gameState.players[1].mz=[gob];
decks();gameState.activePlayer=1;gameState.phase='battle';baselineA();
const T=battleTargetsV29(gob.uid).targets.map(x=>x.card.uid);
ok('A: in Attack Position the opponent cannot choose ワイト as an attack target — only D・ステープラン',T.length===1&&T[0]===st.uid,JSON.stringify(T));
hitAt(1,gob,st);
ok('A: destroyed by battle in Attack Position → the forced trigger lowers ゴブリン突撃部隊\'s ATK by 300 (2300 → 2000)',z(st)==='grave'&&chains('D・ステープラン').length===1&&curATK(findCardByUid(gob.uid).card)===2000,JSON.stringify({z:z(st),atk:curATK(findCardByUid(gob.uid).card),trig:TRIG}));
audit('A');

/* B. Defense Position */
fresh();SEEN=[];TRIG=[];
const s2=mk('D・ステープラン',0,'up','def'),w2=mk('ワイト',0,'up','atk');gameState.players[0].mz=[s2,w2];
const g2=mk('ゴブリン突撃部隊',1,'up');gameState.players[1].mz=[g2];
decks();gameState.activePlayer=1;gameState.phase='battle';baselineA();
const T2=battleTargetsV29(g2.uid).targets.map(x=>x.card.uid);
ok('B: in Defense Position the attack-target restriction does not apply (ワイト is a target)',T2.indexOf(w2.uid)>=0);
PREFER=[uid(g2)];hitAt(1,g2,s2);PREFER=[];
const sNow=findCardByUid(s2.uid),gNow=findCardByUid(g2.uid);
ok('B: attacked in Defense Position — not destroyed; after damage calculation ゴブリン突撃部隊 → Defense Position, D・ステープラン → Attack Position',!!sNow&&sNow.zone==='mz'&&sNow.card.pos==='atk'&&!!gNow&&gNow.card.pos==='def'&&chains('D・ステープラン').length===1,JSON.stringify({s:sNow&&sNow.card.pos,g:gNow&&gNow.card.pos,trig:TRIG}));
audit('B');

/* C. destroyed while attacking from Attack Position: the defender that destroyed it loses 300 */
fresh();SEEN=[];TRIG=[];
const s3=mk('D・ステープラン',0,'up','atk');gameState.players[0].mz=[s3];
const gi=mk('ギガンテス',1,'up','atk');gameState.players[1].mz=[gi];
decks();gameState.phase='battle';baselineA();
hitAt(0,s3,gi);
ok('C: attacking ギガンテス and destroyed — ギガンテス (the monster that destroyed it) loses 300 ATK (1900 → 1600)',z(s3)==='grave'&&curATK(findCardByUid(gi.uid).card)===1600);
audit('C');
`);
