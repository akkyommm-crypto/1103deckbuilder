/* S03-U173: optional destruction substitutes — the protected card's controller chooses at the destruction (user decision 2026-09-26).
   真六武衆－シエン / 六武衆－ザンジ / 六武衆－ヤイチ (another own face-up 六武衆) and ガチガチガンテツ (one of its Xyz materials) on the common
   mechanism of engine/1ZV. Real DUEL paths: 地割れ (effect destruction during a chain link), ブラック・ホール (mass destruction), battle.
   Nothing moves until the decision; the choice is not cancelable; save / resume and Replay. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:8},()=>mk('ワイト',p));}
const SUB='s03u173.destroy-sub';
function subPending(){const q=pc();return !!(q&&q.resume&&q.resume.handler===SUB);}
/* drive until a destruction-substitute decision is pending (returns true) or nothing is left to do (false) */
function driveSub(){for(let i=0;i<600;i++){
  if(subPending())return true;
  if(pc()){__choicePickV49(0);continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return false;}return false;}
function answer(key){const q=pc();const i=q.candidates.findIndex(c=>c.key===key);__choicePickV49(i);}
function keys(){return (pc()?pc().candidates:[]).map(c=>c.key);}
function subKey(c){return 'sub:'+c.uid;}
function earthquake(){gameState.activePlayer=1;const e=mk('地割れ',1);gameState.players[1].hand=[e];baselineA();duelActivateFromHand(0);return e;}
function attackOn(p,atkCard,target){const ai=gameState.players[p].mz.indexOf(atkCard),ti=gameState.players[p===0?1:0].mz.indexOf(target);
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:ai,target:ti});}
`;

const first=harness(COMMON+String.raw`
/* ===== A: 地割れ destroys 六武衆－ヤイチ (lowest ATK); one candidate (カゲキ) → asked anyway; use it ===== */
fresh();
let ya=mk('六武衆－ヤイチ',0,'up'),ka=mk('真六武衆－カゲキ',0,'up');gameState.players[0].mz=[ya,ka];
gameState.players[1].mz=[mk('ギガンテス',1,'up')];
let eq=earthquake();
let paused=driveSub();
let q=pc();
ok('A: the destruction pauses and asks the controller of ヤイチ (Player1) — not the player of 地割れ',paused&&q.player===0&&q.title.indexOf('六武衆－ヤイチ')===0,JSON.stringify(q&&{p:q.player,t:q.title}));
ok('A: one candidate — both 「身代わりを使う：「真六武衆－カゲキ」を破壊」 and 「使わずに破壊する」 are shown',JSON.stringify(keys())===JSON.stringify([subKey(ka),'decline'])&&q.candidates[0].label.indexOf('身代わりを使う')===0&&q.candidates[1].label==='使わずに破壊する',JSON.stringify(q.candidates.map(c=>c.label)));
ok('A: the choice cannot be cancelled / closed into a decision',q.cancelable===false&&cancelChoiceV49()===false&&subPending());
ok('A: nothing has moved while the decision is pending',z(ya)==='mz'&&z(ka)==='mz'&&gameState.players[0].grave.length===0,JSON.stringify({ya:z(ya),ka:z(ka)}));
ok('A: the sheet shows the protected card',JSON.stringify(destroySubSheetInfoS03(q))===JSON.stringify({uid:ya.uid,name:'六武衆－ヤイチ',cause:'effect'}));
globalThis.__SAVE_A=JSON.stringify({at:0,turn:gameState.turn,state:gameState,replay:v41ReplayPackage(gameState),interruptedPromptS03:null});
globalThis.__UIDS_A=JSON.stringify({ya:ya.uid,ka:ka.uid,eq:eq.uid});
answer(subKey(ka));driveSub();
let kg=gameState.players[0].grave.find(c=>c.uid===ka.uid);
ok('A: used — カゲキ is destroyed instead (effect destruction by Player1), ヤイチ stays',z(ya)==='mz'&&z(ka)==='grave'&&kg&&kg.graveInfo&&kg.graveInfo.byDestroy===true&&kg.graveInfo.byPlayer===0,JSON.stringify(kg&&kg.graveInfo));
ok('A: the chain finished (地割れ in the GY, no processor wait left)',z(eq)==='grave'&&!gameState.chain.length&&!pc()&&!(gameState.processorPaused&&gameState.processorWaiting&&gameState.processorWaiting.type==='SOLVE_CHAIN'));
globalThis.__FINAL_A=v41StateDigest(gameState);
audit('A');

/* ===== B: same, 「使わずに破壊する」 ===== */
fresh();
ya=mk('六武衆－ヤイチ',0,'up');ka=mk('真六武衆－カゲキ',0,'up');gameState.players[0].mz=[ya,ka];
gameState.players[1].mz=[mk('ギガンテス',1,'up')];
eq=earthquake();driveSub();answer('decline');driveSub();
ok('B: declined — ヤイチ is destroyed, カゲキ stays',z(ya)==='grave'&&z(ka)==='mz'&&z(eq)==='grave');
audit('B');

/* ===== C: two candidates — pick the second (キザン) ===== */
fresh();
ya=mk('六武衆－ヤイチ',0,'up');ka=mk('真六武衆－カゲキ',0,'up');let ki=mk('真六武衆－キザン',0,'up');gameState.players[0].mz=[ya,ka,ki];
gameState.players[1].mz=[mk('ギガンテス',1,'up')];
eq=earthquake();driveSub();
ok('C: both other 六武衆 are candidates, plus 「使わずに破壊する」',JSON.stringify(keys())===JSON.stringify([subKey(ka),subKey(ki),'decline']),JSON.stringify(keys()));
answer(subKey(ki));driveSub();
ok('C: the chosen キザン is destroyed, ヤイチ and カゲキ stay',z(ki)==='grave'&&z(ya)==='mz'&&z(ka)==='mz');
audit('C');

/* ===== D: battle — 青眼の白龍 attacks 真六武衆－シエン; 六武衆－ザンジ as the substitute ===== */
fresh();
let si=mk('真六武衆－シエン',0,'up'),za=mk('六武衆－ザンジ',0,'up');gameState.players[0].mz=[si,za];
let bl=mk('青眼の白龍',1,'up');gameState.players[1].mz=[bl];gameState.activePlayer=1;gameState.phase='battle';baselineA();
const lpD=gameState.players[0].lp;
attackOn(1,bl,si);paused=driveSub();q=pc();
ok('D: battle destruction of シエン pauses before the cleanup and asks Player1',paused&&q.player===0&&q.title==='真六武衆－シエン：戦闘で破壊されます'&&JSON.stringify(keys())===JSON.stringify([subKey(za),'decline']),JSON.stringify(q&&{t:q.title,k:keys()}));
ok('D: nothing moved yet (シエン still on the field, marked destroyed by battle)',z(si)==='mz'&&z(za)==='mz'&&findCardByUid(si.uid).card.battleDestroyed===true);
globalThis.__SAVE_D=JSON.stringify({at:0,turn:gameState.turn,state:gameState,replay:v41ReplayPackage(gameState),interruptedPromptS03:null});
globalThis.__UIDS_D=JSON.stringify({si:si.uid,za:za.uid,bl:bl.uid,lp:lpD});
answer(subKey(za));driveSub();
ok('D: used — ザンジ destroyed instead, シエン stays; the battle damage (500) still applies',z(si)==='mz'&&z(za)==='grave'&&!findCardByUid(si.uid).card.battleDestroyed&&gameState.players[0].lp===lpD-500,JSON.stringify({si:z(si),za:z(za),lp:gameState.players[0].lp}));
ok('D: the battle went on to its end (no battle left open)',!gameState.battle&&!pc());
globalThis.__FINAL_D=v41StateDigest(gameState);
audit('D');

/* ===== E: no other 六武衆 → no question, destroyed normally ===== */
fresh();
si=mk('真六武衆－シエン',0,'up');gameState.players[0].mz=[si];
bl=mk('青眼の白龍',1,'up');gameState.players[1].mz=[bl];gameState.activePlayer=1;gameState.phase='battle';baselineA();
attackOn(1,bl,si);paused=driveSub();
ok('E: without a candidate nothing is asked and シエン is destroyed by battle',!paused&&z(si)==='grave');

/* ===== F: ブラック・ホール — every monster is destroyed at the same time: ザンジ has no usable substitute (カゲキ is destroyed too);
   ガチガチガンテツ may detach one of its 2 materials (the second chosen) ===== */
fresh();
za=mk('六武衆－ザンジ',0,'up');ka=mk('真六武衆－カゲキ',0,'up');let gt=mk('ガチガチガンテツ',0,'up');
let m1=mk('ワイト',0),m2=mk('ゴブリン突撃部隊',0);gt.xyz=[m1,m2];gameState.players[0].mz=[za,ka,gt];
let g1=mk('ギガンテス',1,'up');gameState.players[1].mz=[g1];
gameState.activePlayer=1;const bh=mk('ブラック・ホール',1);gameState.players[1].hand=[bh];baselineA();
duelActivateFromHand(0);paused=driveSub();q=pc();
ok('F: only ガンテツ is asked (ザンジ\'s only 六武衆 is being destroyed at the same time)',paused&&q.title.indexOf('ガチガチガンテツ')===0&&JSON.stringify(keys())===JSON.stringify(['mat:'+m1.uid,'mat:'+m2.uid,'decline']),JSON.stringify(q&&{t:q.title,k:keys()}));
ok('F: nothing moved yet (all monsters still on the field, both materials attached)',[za,ka,gt,g1].every(c=>z(c)==='mz')&&findCardByUid(gt.uid).card.xyz.length===2);
answer('mat:'+m2.uid);driveSub();
const gtNow=findCardByUid(gt.uid);
ok('F: ガンテツ stays with 1 material (ゴブリン突撃部隊 removed to the GY); every other monster destroyed together',gtNow&&gtNow.zone==='mz'&&gtNow.card.xyz.length===1&&gtNow.card.xyz[0].uid===m1.uid&&z(m2)==='grave'&&z(za)==='grave'&&z(ka)==='grave'&&z(g1)==='grave'&&z(bh)==='grave',JSON.stringify({gt:gtNow&&gtNow.zone,za:z(za),ka:z(ka),g1:z(g1)}));
ok('F: the removed material is not recorded as destroyed',!(gameState.players[0].grave.find(c=>c.uid===m2.uid).graveInfo||{}).byDestroy);
audit('F');

/* ===== F2: two ガチガチガンテツ in the same ブラック・ホール — asked one after the other; nothing moves until the last answer ===== */
fresh();
let ga=mk('ガチガチガンテツ',0,'up'),gb=mk('ガチガチガンテツ',0,'up');let ma=mk('ワイト',0),mb=mk('ワイト',0);ga.xyz=[ma];gb.xyz=[mb];
gameState.players[0].mz=[ga,gb];gameState.players[1].mz=[mk('ギガンテス',1,'up')];
gameState.activePlayer=1;const bh2=mk('ブラック・ホール',1);gameState.players[1].hand=[bh2];baselineA();
duelActivateFromHand(0);driveSub();
const firstAsk=pc().title;answer('mat:'+ma.uid);driveSub();
const secondAsk=subPending()&&pc().title;
ok('F2: the second ガンテツ is asked after the first answer, and still nothing has moved',firstAsk.indexOf('ガチガチガンテツ')===0&&!!secondAsk&&findCardByUid(ga.uid).card.xyz.length===1&&z(ma)!=='grave'&&z(ga)==='mz',JSON.stringify({firstAsk,secondAsk}));
answer('decline');driveSub();
ok('F2: then both decisions apply together — the first keeps itself by its material, the second is destroyed',z(ga)==='mz'&&findCardByUid(ga.uid).card.xyz.length===0&&z(gb)==='grave'&&z(bh2)==='grave');
audit('F2');

/* ===== G: the four scripts declare the substitute; the sheet cannot be closed by tapping outside ===== */
ok('G: declarations',['真六武衆－シエン','六武衆－ザンジ','六武衆－ヤイチ'].every(n=>CARD_SCRIPTS[n].destroySubstituteS03&&CARD_SCRIPTS[n].destroySubstituteS03.kind==='destroyOwn')&&CARD_SCRIPTS['ガチガチガンテツ'].destroySubstituteS03.kind==='detach');
`);

function resume(tag, save, uids, final, body){
  harness('const SAVED='+JSON.stringify(save)+';const U=JSON.parse('+JSON.stringify(uids)+');const FINAL='+JSON.stringify(final)+';'+COMMON+String.raw`
resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;
loadSavedDuel=()=>JSON.parse(SAVED);confirm=()=>true;
const resumed=offerResumeDuel();
const q=pc();
ok('`+tag+`: the saved duel resumes with the substitute decision pending and the processor waiting',resumed&&subPending()&&gameState.processorPaused===true,JSON.stringify({resumed,p:!!q,w:gameState.processorWaiting&&gameState.processorWaiting.type}));
`+body+String.raw`
ok('`+tag+`: the final state equals the uninterrupted run',v41StateDigest(gameState)===FINAL);
audit('`+tag+`');
`);
}
if(first.__SAVE_A&&first.__SAVE_D){
  resume('A-resume', first.__SAVE_A, first.__UIDS_A, first.__FINAL_A, String.raw`
answer('sub:'+U.ka);driveSub();
ok('A-resume: カゲキ destroyed instead, ヤイチ stays, 地割れ resolved',z({uid:U.ka})==='grave'&&z({uid:U.ya})==='mz'&&z({uid:U.eq})==='grave');
`);
  resume('D-resume', first.__SAVE_D, first.__UIDS_D, first.__FINAL_D, String.raw`
answer('sub:'+U.za);driveSub();
ok('D-resume: ザンジ destroyed instead, シエン stays, 500 battle damage',z({uid:U.za})==='grave'&&z({uid:U.si})==='mz'&&gameState.players[0].lp===U.lp-500&&!gameState.battle);
`);
}else{console.log('FAIL save snapshots missing');process.exitCode=2;}

/* H: closing the sheet by tapping outside never answers a non-cancelable choice (static check of the veil handler; the node harness has no DOM) */
{
  const fs=require('fs'),path=require('path');
  const src=fs.readFileSync(path.join(__dirname,'..','engine','60_damage_segoc_ui_helpers.js'),'utf8');
  const m=src.match(/veil\.addEventListener\("click"[\s\S]*?\n\}\);/);
  const good=!!m&&/pendingChoiceV49\(gameState\)\.cancelable===false\) return;/.test(m[0])&&!/cancelChoiceV49|answerChoiceV49/.test(m[0]);
  console.log((good?'PASS':'FAIL')+' H: tapping outside keeps a non-cancelable choice open and never answers it');
  if(!good) process.exitCode=1;
}
