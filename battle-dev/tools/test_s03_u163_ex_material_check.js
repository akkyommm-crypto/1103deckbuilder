/* S03-U163: the Synchro / Xyz summon entry point (beginExSummonV2, reached from the EX deck UI and doExSummon) now checks that the
   given materials are a legal set (engine/20 exMaterialsLegalS03: exCombos restricted to exactly those materials, not capped by
   the combination limit). Before, a caller could Synchro Summon ゴヨウ・ガーディアン with a DARK Tuner or Xyz Summon
   エヴォルカイザー・ラギア with two Warriors (two gate tests did). Real DUEL path; Replay-audited. */
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
function tryEx(mzNames,exName,idx,kind){
  fresh();SEEN=[];TRIG=[];
  const M=mzNames.map(n=>mk(n,0,'up','atk'));gameState.players[0].mz=M.slice();
  const ex=mk(exName,0);gameState.players[0].ex=[ex];
  decks();baselineA();TOASTS.length=0;
  beginExSummonV2(0,0,idx,kind,'atk');drive();
  return {M,ex};
}
/* A. Synchro: ゴヨウ・ガーディアン needs an EARTH Tuner */
let r=tryEx(['ジャンク・シンクロン','クリッター'],'ゴヨウ・ガーディアン',[0,1],'synchro');
ok('A: ゴヨウ・ガーディアン with a DARK Tuner (ジャンク・シンクロン) is refused — nothing moves, no summon window',z(r.ex)==='ex'&&r.M.every(c=>z(c)==='mz')&&!gameState.pendingExV2&&TOASTS.some(t=>/素材の条件/.test(t)),JSON.stringify({ex:z(r.ex),t:TOASTS}));
r=tryEx(['カラクリ参謀 弐四八','クリッター'],'ゴヨウ・ガーディアン',[0,1],'synchro');
ok('A: with an EARTH Tuner (カラクリ参謀 弐四八) the same Synchro Summon succeeds',z(r.ex)==='mz'&&r.M.every(c=>z(c)==='grave'));
audit('A');
/* B. Xyz: エヴォルカイザー・ラギア needs two Lv4 Dinosaurs */
r=tryEx(['真六武衆－キザン','六武衆－ザンジ'],'エヴォルカイザー・ラギア',[0,1],'xyz');
ok('B: エヴォルカイザー・ラギア with two Lv4 Warriors is refused',z(r.ex)==='ex'&&r.M.every(c=>z(c)==='mz')&&!gameState.pendingExV2);
r=tryEx(['セイバーザウルス','ワイルド・ラプター'],'エヴォルカイザー・ラギア',[0,1],'xyz');
ok('B: with two Lv4 Dinosaurs it succeeds (the materials become Xyz Materials)',z(r.ex)==='mz'&&r.M.every(c=>z(c)!=='mz'));
audit('B');
/* C. a legal set that is not the first combination is accepted; a wrong total Level is refused */
r=tryEx(['クリッター','カラクリ参謀 弐四八','ワイト','ギガンテス'],'ゴヨウ・ガーディアン',[1,3],'synchro');
ok('C: カラクリ参謀 弐四八 (3) + ギガンテス (4) is not Lv6 — refused',z(r.ex)==='ex');
r=tryEx(['ワイト','クリッター','ギガンテス','カラクリ参謀 弐四八'],'ゴヨウ・ガーディアン',[1,3],'synchro');

ok('C: クリッター (3) + カラクリ参謀 弐四八 (3) chosen among four monsters — accepted',z(r.ex)==='mz'&&z(r.M[1])==='grave'&&z(r.M[3])==='grave'&&z(r.M[0])==='mz'&&z(r.M[2])==='mz');
/* D. the helper itself */
fresh();gameState.players[0].mz=[mk('カラクリ参謀 弐四八',0,'up'),mk('クリッター',0,'up')];baselineA();
const gy=CARD_DB[findCardIndex('ゴヨウ・ガーディアン')];
ok('D: exMaterialsLegalS03 — the legal pair yes; a duplicated index, one material, or no material no',exMaterialsLegalS03(0,gy,[0,1])&&exMaterialsLegalS03(0,gy,[1,0])&&!exMaterialsLegalS03(0,gy,[0,0])&&!exMaterialsLegalS03(0,gy,[0])&&!exMaterialsLegalS03(0,gy,[]));
`);
