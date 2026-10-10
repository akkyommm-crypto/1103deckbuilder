/* S03-U190: ライトロード — engine/1ZZE (「ライトロード」の効果によってデッキから墓地へ送られた): ライトロード・ウォリアー ガロス, ライトロード・プリースト
   ジェニス; ライトロード・ビースト ウォルフ (trigger), ライトロード・サモナー ルミナス, ライトロード・シーフ ライニャン (shuffle), 光の召集 (mandatory).
   Real DUEL paths (End Phase, flip summon, ignition), Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function C(c){return findCardByUid(c.uid).card;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(deck0){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:6},()=>mk('ワイト',p));
  if(deck0) gameState.players[0].deck=deck0.concat(gameState.players[0].deck);}
let PREFER=[],TRIG=[];
function step(){const q=pc();if(q){let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push(g.map(c=>c.name).join('+'));eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function toEnd(){phase('battle');phase('main2');phase('end');}
function trigCount(re){return TRIG.filter(t=>re.test(t)).length;}

/* ===== A: ルミナス ① — discard 1, special summon a Level 4 or lower 「ライトロード」 from the GY; once per turn ===== */
fresh();
let lu=mk('ライトロード・サモナー ルミナス',0,'up'),dh=mk('ワイト',0),dh2=mk('ワイト',0),jn=mk('ライトロード・パラディン ジェイン',0);
gameState.players[0].mz=[lu];gameState.players[0].hand=[dh,dh2];gameState.players[0].grave=[jn];baselineA();
PREFER=[dh.uid,jn.uid];duelActivateFromZone(0,'mz',0);drive();PREFER=[];
ok('A: ワイト discarded; ジェイン special summoned from the GY',z(dh)==='grave'&&z(jn)==='mz');
ok('A: once per turn',strictScriptLegalityV2('ライトロード・サモナー ルミナス',0,'mz',0,{}).ok===false);
audit('A');

/* ===== A2: ルミナス ① is an ignition effect — not in the Battle Phase, not in the opponent's turn ===== */
fresh();
lu=mk('ライトロード・サモナー ルミナス',0,'up');gameState.players[0].mz=[lu];gameState.players[0].hand=[mk('ワイト',0)];gameState.players[0].grave=[mk('ライトロード・パラディン ジェイン',0)];baselineA();
ok('A2: legal in the own Main Phase 1',strictScriptLegalityV2('ライトロード・サモナー ルミナス',0,'mz',0,{}).ok===true);
phase('battle');
ok('A2: not in the Battle Phase',strictScriptLegalityV2('ライトロード・サモナー ルミナス',0,'mz',0,{}).ok===false);
phase('main2');phase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});drive();requestProcessorV27(PROCESSOR_V27.DRAW,{player:1});drive();
phase('standby');phase('main1');
const LA2=strictScriptLegalityV2('ライトロード・サモナー ルミナス',0,'mz',findCardByUid(lu.uid).index,{});
ok('A2: not in the opponent’s Main Phase 1 (「自分のメインフェイズ」)',gameState.activePlayer===1&&gameState.phase==='main1'&&LA2.ok===false,JSON.stringify(LA2));
audit('A2');

/* ===== B: ジェニス — at the End Phase after ルミナス's End Phase mill: 500 damage, 500 gain, once ===== */
fresh();
lu=mk('ライトロード・サモナー ルミナス',0,'up');let je=mk('ライトロード・プリースト ジェニス',0,'up');
gameState.players[0].mz=[lu,je];baselineA();TRIG.length=0;
toEnd();
ok('B: ルミナス milled 3; ジェニス: opponent 7500, controller 8500 (once)',gameState.players[0].grave.length===3&&gameState.players[1].lp===7500&&gameState.players[0].lp===8500&&trigCount(/ジェニス/)===1,
  JSON.stringify({g:gameState.players[0].grave.length,lp:[gameState.players[0].lp,gameState.players[1].lp],TRIG}));
audit('B');

/* ===== B2: ジェニス without a 「ライトロード」 mill that turn — no effect; 裁きの龍 (not 「ライトロード」) does not count ===== */
fresh();
je=mk('ライトロード・プリースト ジェニス',0,'up');let jd=mk('裁きの龍',0,'up');
gameState.players[0].mz=[je,jd];baselineA();TRIG.length=0;
toEnd();
ok('B2: 裁きの龍 milled 4; ジェニス does not activate',gameState.players[0].grave.length===4&&gameState.players[1].lp===8000&&gameState.players[0].lp===8000&&trigCount(/ジェニス/)===0,JSON.stringify(TRIG));
audit('B2');

/* ===== C: ガロス — ルミナス's mill → ガロス mills 2 and draws 1 per 「ライトロード」 monster among them; its own mill does not retrigger it ===== */
let jn2=mk('ライトロード・パラディン ジェイン',0);
fresh([mk('ワイト',0),mk('ワイト',0),mk('ワイト',0),jn2,mk('ワイト',0)]);
lu=mk('ライトロード・サモナー ルミナス',0,'up');let ga=mk('ライトロード・ウォリアー ガロス',0,'up');
gameState.players[0].mz=[lu,ga];baselineA();TRIG.length=0;
const hC=gameState.players[0].hand.length;
toEnd();
ok('C: ルミナス 3 + ガロス 2 milled (ジェイン among them); ガロス drew 1; it activated once',z(jn2)==='grave'&&gameState.players[0].grave.length===5&&gameState.players[0].hand.length===hC+1&&trigCount(/ガロス/)===1,
  JSON.stringify({g:gameState.players[0].grave.length,h:gameState.players[0].hand.length,TRIG}));
audit('C');

/* ===== C2: ガロス does not react to a non-「ライトロード」 mill (裁きの龍) ===== */
fresh();
jd=mk('裁きの龍',0,'up');ga=mk('ライトロード・ウォリアー ガロス',0,'up');
gameState.players[0].mz=[jd,ga];baselineA();TRIG.length=0;
toEnd();
ok('C2: only 裁きの龍 milled (4); ガロス did not activate',gameState.players[0].grave.length===4&&trigCount(/ガロス/)===0,JSON.stringify(TRIG));
audit('C2');

/* ===== D: ウォルフ — milled from the Deck → special summons itself; it cannot be Normal Summoned ===== */
let wf=mk('ライトロード・ビースト ウォルフ',0);
fresh([wf]);
lu=mk('ライトロード・サモナー ルミナス',0,'up');gameState.players[0].mz=[lu];let wf2=mk('ライトロード・ビースト ウォルフ',0);gameState.players[0].hand=[wf2];baselineA();
const LD=getLegalHandActions(0,0);
ok('D: ウォルフ in the hand — no Normal Summon / Set',!LD.some(a=>a.id==='normalSummon'||a.id==='setMonster'),JSON.stringify(LD.map(a=>a.id)));
toEnd();
ok('D: milled by ルミナス, ウォルフ special summoned itself',z(wf)==='mz');
audit('D');

/* ===== D2: the rule behind it — 「このカードは通常召喚できない」 (Sin 青眼の白龍) and Ritual Monsters (カオス・ソルジャー) cannot be Normal Summoned / Set;
   サイバー・ドラゴン (no such text) still can ===== */
fresh();
gameState.players[0].hand=[mk('Sin 青眼の白龍',0),mk('カオス・ソルジャー',0),mk('サイバー・ドラゴン',0)];gameState.players[0].mz=[mk('ワイト',0,'up'),mk('ワイト',0,'up')];baselineA();
const ids=i=>getLegalHandActions(0,i).map(a=>a.id);
ok('D2: Sin 青眼の白龍 / カオス・ソルジャー — no Normal Summon or Set; サイバー・ドラゴン — Normal Summon (1 Tribute)',
  !ids(0).some(x=>x==='normalSummon'||x==='setMonster')&&!ids(1).some(x=>x==='normalSummon'||x==='setMonster')&&ids(2).includes('normalSummon'),
  JSON.stringify([ids(0),ids(1),ids(2)]));

/* ===== E: ライニャン — flip: a 「ライトロード」 monster from the GY shuffled into the Deck, draw 1 ===== */
fresh();
let ly=mk('ライトロード・シーフ ライニャン',0,'down','def');ly.setTurn=4;jn=mk('ライトロード・パラディン ジェイン',0);
gameState.players[0].mz=[ly];gameState.players[0].grave=[jn];baselineA();
const hE=gameState.players[0].hand.length,dE=gameState.players[0].deck.length;
PREFER=[jn.uid];doFlipUp(0,'mz',0,'atk');drive();PREFER=[];
const shuffled=gameState.journal?true:true;
ok('E: ジェイン returned to the Deck, 1 drawn (hand +1, Deck size unchanged)',z(jn)!=='grave'&&gameState.players[0].hand.length===hE+1&&gameState.players[0].deck.length===dE,
  JSON.stringify({jn:z(jn),h:gameState.players[0].hand.length,d:gameState.players[0].deck.length}));
ok('E: the Deck was shuffled after the return (SHUFFLE in the journal, before the draw)',
  (function(){const acts=v41ReplayPackage(gameState).actions.map(x=>x.action||x);const iR=acts.findIndex(a=>a.type==='FX_RETURN_DECK');const iS=acts.findIndex((a,k)=>k>iR&&a.type==='SHUFFLE');const iD=acts.findIndex((a,k)=>k>iR&&a.type==='DRAW');return iR>=0&&iS>iR&&iD>iS;})());
audit('E');

/* ===== F: 光の召集 — discard the hand (2), add 2 LIGHT monsters from the GY (mandatory) ===== */
fresh();
let lc=mk('光の召集',0,'down');lc.setTurn=4;let h1=mk('ワイト',0),h2=mk('ギガンテス',0),l1=mk('ライトロード・パラディン ジェイン',0),l2=mk('ライトロード・サモナー ルミナス',0);
gameState.players[0].sz=[lc];gameState.players[0].hand=[h1,h2];gameState.players[0].grave=[l1,l2];baselineA();
duelActivateFromZone(0,'sz',0);drive();
ok('F: both hand cards discarded; ジェイン and ルミナス added',z(h1)==='grave'&&z(h2)==='grave'&&z(l1)==='hand'&&z(l2)==='hand'&&gameState.players[0].hand.length===2);
audit('F');
`);
