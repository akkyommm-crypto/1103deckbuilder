/* S03-U164: デュアル・サモナー — in the opponent's End Phase, pay 500 LP: Normal Summon a Gemini monster from the hand (with
   Tributes for Lv5+) or Gemini Summon a face-up one on the field, without using the player's Normal Summon; once-per-turn battle
   protection. Real DUEL path (processor phases, the End Phase event, chain, resolution choices); Replay-audited, fixed seed. */
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
function oppEnd(hand,mz,extraMz){
  fresh();SEEN=[];TRIG=[];
  const ds=mk('デュアル・サモナー',0,'up','atk');gameState.players[0].mz=[ds].concat((mz||[]).map(n=>mk(n,0,'up','atk')));
  gameState.players[0].hand=(hand||[]).map(n=>mk(n,0));
  decks();gameState.activePlayer=1;gameState.phase='main2';baselineA();
  const lp0=gameState.players[0].lp;
  phase('end');
  return {ds,lp0};
}
/* A. Gemini Summon of a face-up Gemini monster on the field */
PREFER=[];
let r=oppEnd([],['チューンド・マジシャン']);
let tm=gameState.players[0].mz.find(c=>nm(c)==='チューンド・マジシャン');
ok('A: offered in the opponent\'s End Phase; 500 LP paid; チューンド・マジシャン becomes an Effect Monster (Gemini Summon); player I\'s Normal Summon is not used',evOffered('デュアル・サモナー')&&!evForced('デュアル・サモナー')&&gameState.players[0].lp===r.lp0-500&&!!tm&&tm.dualUp===true&&!gameState.players[0].normalSummonUsed,JSON.stringify({trig:TRIG,lp:gameState.players[0].lp,dual:tm&&tm.dualUp}));
audit('A');
/* B. from the hand, Lv4: Normal Summon in face-up Attack Position */
r=oppEnd(['デュアル・ランサー'],[]);
let dl=gameState.players[0].mz.find(c=>nm(c)==='デュアル・ランサー');
ok('B: デュアル・ランサー (Lv4) is Normal Summoned from the hand in face-up Attack Position',!!dl&&dl.face==='up'&&dl.pos==='atk'&&!gameState.players[0].normalSummonUsed&&gameState.players[0].hand.length===0);
audit('B');
/* C. from the hand, Lv6: one Tribute chosen at resolution */
fresh();SEEN=[];TRIG=[];
{
  const ds=mk('デュアル・サモナー',0,'up','atk'),w=mk('ワイト',0,'up','atk');gameState.players[0].mz=[ds,w];
  const gp=mk('ギガプラント',0);gameState.players[0].hand=[gp];
  decks();gameState.activePlayer=1;gameState.phase='main2';baselineA();
  PREFER=[uid(gp),uid(w)];phase('end');PREFER=[];
  ok('C: ギガプラント (Lv6) is Normal Summoned with ワイト Tributed',z(gp)==='mz'&&z(w)==='grave'&&z(ds)==='mz',JSON.stringify({gp:z(gp),w:z(w),seen:SEEN.map(s=>s.title)}));
  audit('C');
}
/* D. not in its controller's own End Phase */
fresh();SEEN=[];TRIG=[];
{
  const ds=mk('デュアル・サモナー',0,'up','atk');gameState.players[0].mz=[ds];gameState.players[0].hand=[mk('デュアル・ランサー',0)];
  decks();gameState.activePlayer=0;gameState.phase='main2';baselineA();
  phase('end');
  ok('D: not offered in its controller\'s own End Phase',!evOffered('デュアル・サモナー')&&gameState.players[0].hand.length===1);
}
/* E. no Gemini monster to summon: not offered */
r=oppEnd(['ワイト'],['ワイト']);
ok('E: no Gemini monster in the hand or face-up on the field — not offered, no LP paid',!evOffered('デュアル・サモナー')&&gameState.players[0].lp===r.lp0);
/* F. once per turn not destroyed by battle */
fresh();
{
  const ds=mk('デュアル・サモナー',0,'up','atk');gameState.players[0].mz=[ds];
  const a1=mk('ゴブリン突撃部隊',1,'up'),a2=mk('ギガンテス',1,'up');gameState.players[1].mz=[a1,a2];
  decks();gameState.activePlayer=1;gameState.phase='battle';baselineA();
  hitAt(1,a1,ds);const once=z(ds);hitAt(1,a2,ds);
  ok('F: survives the 1st battle of the turn, destroyed by the 2nd',once==='mz'&&z(ds)==='grave');
  audit('F');
}
`);
