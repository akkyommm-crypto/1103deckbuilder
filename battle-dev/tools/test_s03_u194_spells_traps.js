/* S03-U194: Spells / Traps — モンスターゲート, 停戦協定, R－ライトジャスティス, スクラップ・スコール, 万能地雷グレイモヤ, 降霊の儀式, 鹵獲装置
   (fixed), 光の護封壁, 聖なる輝き, デルタ・クロウ－アンチ・リバース, 因果切断 (scripts unchanged, now tested). Real DUEL paths, Replay-audited.
   Other cards named here are TESTED / GENERIC_OK. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function C(c){return findCardByUid(c.uid).card;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:6},()=>mk('ワイト',p));}
let PREFER=[],TRIG=[],SEEN=[];
function step(){const q=pc();if(q){SEEN.push({title:q.title||'',player:q.player,cancelable:!!q.cancelable});let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push(g.map(c=>c.name).join('+'));eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function toPoint(kind){for(let i=0;i<80;i++){
  const w=gameState.processorWaiting;
  if(w&&w.type==='POINT'&&gameState.processorPaused&&(w.payload||{}).kind===kind)return true;
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return false;}return false;}
function acts(){return v41ReplayPackage(gameState).actions.map(x=>x.action||x);}

/* ===== A: モンスターゲート — Tribute (cost); reveal until a Normal-Summonable monster; the others to the GY ===== */
fresh();
let mg=mk('モンスターゲート',0),rel=mk('ワイト',0,'up'),r1=mk('死者蘇生',0),r2=mk('ギガンテス',0),r3=mk('カオス・ソルジャー',0),hit=mk('ブラッド・ヴォルス',0),rest=mk('ワイト',0);
gameState.players[0].hand=[mg];gameState.players[0].mz=[rel];gameState.players[0].deck=[r1,r2,r3,hit,rest];baselineA();
duelActivateFromHand(0);drive();
ok('A: ワイト tributed; ギガンテス (cannot be Normal Summoned) and カオス・ソルジャー (Ritual) skipped; ブラッド・ヴォルス special summoned; the 3 revealed to the GY; the rest stays',
  z(rel)==='grave'&&z(hit)==='mz'&&z(r1)==='grave'&&z(r2)==='grave'&&z(r3)==='grave'&&z(rest)==='deck',JSON.stringify([z(rel),z(r1),z(r2),z(r3),z(hit),z(rest)]));
ok('A: the Tribute is a cost (sent before the activation)',(function(){const a=acts();const iT=a.findIndex(x=>x.type==='FX_TO_GRAVE'),iC=a.findIndex(x=>x.type==='CHAIN_ADD');return iT>=0&&iC>=0&&iT<iC;})());
audit('A');

/* ===== B: 停戦協定 — face-down Defense monsters face-up (no Flip effect); every effect monster on the field × 500 to the opponent ===== */
fresh();
let cf=mk('停戦協定',0,'down');cf.setTurn=4;let fd=mk('ライトロード・ハンター ライコウ',1,'down','def'),mine=mk('切り込み隊長',0,'up'),opp=mk('サイバー・ドラゴン',1,'up'),nrm=mk('ブラッド・ヴォルス',1,'up');
gameState.players[0].sz=[cf];gameState.players[0].mz=[mine];gameState.players[1].mz=[fd,opp,nrm];baselineA();TRIG.length=0;
const dB=gameState.players[1].deck.length;
duelActivateFromZone(0,'sz',0);drive();
ok('B: ライコウ face-up Defense; its Flip effect did not activate (the opponent Deck untouched)',C(fd).face==='up'&&C(fd).pos==='def'&&gameState.players[1].deck.length===dB&&!TRIG.some(t=>/ライコウ/.test(t)));
ok('B: 3 effect monsters on the field (切り込み隊長, ライコウ, サイバー・ドラゴン) × 500 = 1500 to the opponent',gameState.players[1].lp===6500,String(gameState.players[1].lp));
audit('B');

/* ===== C: 光の護封壁 — pay 1000 × n; the opponent's monsters with that ATK or less cannot attack ===== */
fresh();
let lw=mk('光の護封壁',0,'down');lw.setTurn=4;let low=mk('ワイト',1,'up'),hi2=mk('ブラッド・ヴォルス',1,'up');
gameState.players[0].sz=[lw];gameState.players[1].mz=[low,hi2];baselineA();
duelActivateFromZone(0,'sz',0);drive();
ok('C: 1000 paid; ワイト (300) cannot attack, ブラッド・ヴォルス (1900) can',gameState.players[0].lp===7000&&cannotAttackNow(C(low))===true&&!cannotAttackNow(C(hi2)),JSON.stringify([gameState.players[0].lp,C(lw).wallValue]));
audit('C');

/* ===== D: 聖なる輝き — a monster "set" is placed face-up in Defense Position ===== */
fresh();
let hs=mk('聖なる輝き',0,'up'),sm=mk('ブラッド・ヴォルス',0);gameState.players[0].sz=[hs];gameState.players[0].hand=[sm];baselineA();
const setA=getLegalHandActions(0,0).find(a=>a.id==='setMonster');
if(setA)(new Function(setA.run))();drive();
ok('D: the set monster is face-up Defense',!!setA&&z(sm)==='mz'&&C(sm).face==='up'&&C(sm).pos==='def',JSON.stringify({set:!!setA,z:z(sm),f:z(sm)==='mz'?C(sm).face:null}));
audit('D');

/* ===== E: R－ライトジャスティス — as many Spell / Trap cards as 「E・HERO」 cards (the Field Zone too); fewer → all ===== */
fresh();
let rl=mk('R－ライトジャスティス',0),h1=mk('E・HERO スパークマン',0,'up'),h2=mk('E・HERO クレイマン',0,'up'),os=mk('サイクロン',1,'down'),of=mk('ウォーターワールド',1,'up'),os2=mk('強欲な壺',1,'down');
gameState.players[0].hand=[rl];gameState.players[0].mz=[h1,h2];gameState.players[1].sz=[os,os2];gameState.players[1].field=of;baselineA();
PREFER=[os.uid,of.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('E: 2 E・HERO → サイクロン and the Field Spell destroyed; 強欲な壺 stays',z(os)==='grave'&&z(of)==='grave'&&z(os2)==='sz');
audit('E');
fresh();
rl=mk('R－ライトジャスティス',0);h1=mk('E・HERO スパークマン',0,'up');h2=mk('E・HERO クレイマン',0,'up');let h3=mk('E・HERO フェザーマン',0,'up');os=mk('サイクロン',1,'down');
gameState.players[0].hand=[rl];gameState.players[0].mz=[h1,h2,h3];gameState.players[1].sz=[os];baselineA();
duelActivateFromHand(0);drive();
ok('E2: 3 E・HERO but only 1 Spell / Trap — it is destroyed (not a fizzle)',z(os)==='grave');
audit('E2');

/* S03-U332: the destroyed fixture is スクラップ・ハンター — スクラップ・ゴブリン now has its own optional recovery trigger after a スクラップ card destroyed it (a driver that always activates would recover the milled ビースト) */
/* ===== F: スクラップ・スコール — a 「スクラップ」 from the Deck to the GY, draw 1, then the chosen 「スクラップ」 destroyed ===== */
fresh();
let ss=mk('スクラップ・スコール',0),sg=mk('スクラップ・ハンター',0,'up'),sd=mk('スクラップ・ビースト',0);gameState.players[0].hand=[ss];gameState.players[0].mz=[sg];gameState.players[0].deck.unshift(sd);baselineA();
const hF=gameState.players[0].hand.length;SEEN=[];
duelActivateFromHand(0);drive();
ok('F: スクラップ・ビースト milled, 1 drawn, スクラップ・ハンター destroyed; the choice was not cancelable',z(sd)==='grave'&&z(sg)==='grave'&&gameState.players[0].hand.length===hF-1+1&&SEEN.some(s=>/スクラップ・スコール/.test(s.title)&&!s.cancelable));
audit('F');

/* ===== G: デルタ・クロウ－アンチ・リバース — with a 「BF」: every set Spell / Trap of the opponent destroyed (not the face-up one) ===== */
fresh();
let dc=mk('デルタ・クロウ－アンチ・リバース',0,'down');dc.setTurn=4;let bf=mk('BF－疾風のゲイル',0,'up'),t1=mk('サイクロン',1,'down'),t2=mk('強欲な壺',1,'down'),t3=mk('ウォーターワールド',1,'up');
gameState.players[0].sz=[dc];gameState.players[0].mz=[bf];gameState.players[1].sz=[t1,t2];gameState.players[1].field=t3;baselineA();
duelActivateFromZone(0,'sz',0);drive();
ok('G: both set cards destroyed; the face-up Field Spell stays',z(t1)==='grave'&&z(t2)==='grave'&&z(t3)==='field');
audit('G');

/* ===== H: 万能地雷グレイモヤ — at the attack declaration: the opponent's Attack Position monster with the highest ATK destroyed ===== */
fresh();
let gm=mk('万能地雷グレイモヤ',0,'down');gm.setTurn=4;let a1=mk('ブラッド・ヴォルス',1,'up'),a2=mk('サイバー・ドラゴン',1,'up');
gameState.players[0].sz=[gm];gameState.players[0].mz=[mk('ワイト',0,'up')];gameState.players[1].mz=[a1,a2];gameState.activePlayer=1;gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});
const atH=toPoint('attackDeclare');const offH=atH&&(getChainResponsesV2(0)||[]).some(r=>r.card===C(gm));
if(offH)pointActivateV27(0,'sz',0);
drive();
ok('H: サイバー・ドラゴン (2100) destroyed; ブラッド・ヴォルス stays',offH&&z(a2)==='grave'&&z(a1)==='mz');
audit('H');

/* ===== I: 因果切断 — discard 1: an opponent face-up monster banished, and its same-name cards in the opponent's GY ===== */
fresh();
let ic=mk('因果切断',0,'down');ic.setTurn=4;let dcd=mk('ワイト',0),tgt=mk('ブラッド・ヴォルス',1,'up'),gy1=mk('ブラッド・ヴォルス',1),gy2=mk('ワイト',1);
gameState.players[0].sz=[ic];gameState.players[0].hand=[dcd];gameState.players[1].mz=[tgt];gameState.players[1].grave=[gy1,gy2];baselineA();
PREFER=[dcd.uid,tgt.uid];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
ok('I: ワイト discarded; ブラッド・ヴォルス banished with its copy in the GY; the other GY card stays',z(dcd)==='grave'&&z(tgt)==='banish'&&z(gy1)==='banish'&&z(gy2)==='grave');
audit('I');

/* ===== J: 降霊の儀式 — a 「墓守の」 monster revived even under 王家の眠る谷－ネクロバレー ===== */
fresh();
let kr=mk('降霊の儀式',0,'down');kr.setTurn=4;let gk=mk('墓守の偵察者',0),nv=mk('王家の眠る谷－ネクロバレー',0,'up');
gameState.players[0].sz=[kr];gameState.players[0].grave=[gk];gameState.players[0].field=nv;baselineA();
duelActivateFromZone(0,'sz',0);drive();
ok('J: 墓守の偵察者 special summoned',z(gk)==='mz');
audit('J');

/* ===== K: 鹵獲装置 — the controller gives a face-up Normal Monster; the opponent chooses its own monster to give ===== */
fresh();
let rk=mk('鹵獲装置',0),nm1=mk('ブラッド・ヴォルス',0,'up'),o1=mk('サイバー・ドラゴン',1,'up'),o2=mk('ワイト',1,'up');
gameState.players[0].hand=[rk];gameState.players[0].mz=[nm1];gameState.players[1].mz=[o1,o2];baselineA();SEEN=[];
PREFER=[nm1.uid,o2.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('K: swapped — ブラッド・ヴォルス to the opponent, ワイト to the controller',findCardByUid(nm1.uid).p===1&&findCardByUid(o2.uid).p===0&&findCardByUid(o1.uid).p===1);
ok('K: the second choice was made by the opponent, and neither was cancelable',SEEN.filter(s=>/鹵獲装置/.test(s.title)).length===2&&SEEN.filter(s=>/鹵獲装置/.test(s.title))[1].player===1&&SEEN.filter(s=>/鹵獲装置/.test(s.title)).every(s=>!s.cancelable),JSON.stringify(SEEN));
audit('K');
`);
