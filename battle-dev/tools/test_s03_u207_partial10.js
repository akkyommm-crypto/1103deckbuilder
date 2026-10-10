/* S03-U207: PARTIAL → TESTED — スカル・フレイム (hand Special Summon + no Battle Phase; its S03-U65 draw replacement untouched),
   コア転送ユニット, 霞の谷の神風, 迷宮変化. Real DUEL paths, Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
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
function step(){const q=pc();if(q){SEEN.push({title:q.title,names:q.candidates.map(x=>x.label||x.name||'')});let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push(g.map(c=>c.name).join('+'));eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function offered(c){return SEEN.some(s=>s.names.some(n=>String(n).indexOf(cardName(c))>=0));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}

/* ===== A: スカル・フレイム — once per turn, バーニング・スカルヘッド from the hand; no Battle Phase this turn ===== */
fresh();
let sf=mk('スカル・フレイム',0,'up'),bs=mk('バーニング・スカルヘッド',0),b2=mk('バーニング・スカルヘッド',0);gameState.players[0].mz=[sf];gameState.players[0].hand=[bs,b2];baselineA();
const lpA=gameState.players[1].lp;
PREFER=[bs.uid];duelActivateFromZone(0,'mz',0);drive();PREFER=[];
ok('A: バーニング・スカルヘッド special summoned from the hand (its own trigger: the opponent 7000)',z(bs)==='mz'&&gameState.players[1].lp===lpA-1000,JSON.stringify({bs:z(bs),lp:gameState.players[1].lp,TRIG}));
ok('A: once per turn; no Battle Phase this turn',strictScriptLegalityV2('スカル・フレイム',0,'mz',0,{}).ok===false&&battlePhaseForbiddenV340(gameState)==='effect');
audit('A');
fresh();
sf=mk('スカル・フレイム',0,'up');bs=mk('バーニング・スカルヘッド',0);gameState.players[0].mz=[sf];gameState.players[0].hand=[bs];baselineA();
phase('battle');phase('main2');
ok('A2: after the Battle Phase (Main Phase 2) — not activatable',strictScriptLegalityV2('スカル・フレイム',0,'mz',0,{}).ok===false);

/* ===== B: コア転送ユニット — face-up: discard 1 (cost), コアキメイルの鋼核 from the Deck; once per turn ===== */
fresh();
let cu=mk('コア転送ユニット',0,'up'),dc=mk('ワイト',0),kc=mk('コアキメイルの鋼核',0),kc2=mk('コアキメイルの鋼核',0);
gameState.players[0].sz=[cu];gameState.players[0].hand=[dc,mk('ブラッド・ヴォルス',0)];gameState.players[0].deck.push(kc,kc2);baselineA();
PREFER=[dc.uid];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
ok('B: ワイト discarded; one コアキメイルの鋼核 added; once per turn',z(dc)==='grave'&&[z(kc),z(kc2)].filter(x=>x==='hand').length===1&&strictScriptLegalityV2('コア転送ユニット',0,'sz',0,{}).ok===false);
audit('B');

/* ===== C: 霞の谷の神風 — an own face-up WIND monster returned to the hand: a Level 4 or lower WIND from the Deck ===== */
fresh();
let mv=mk('霞の谷の神風',0,'up'),wm=mk('ガスタ・ガルド',0,'up'),ce=mk('強制脱出装置',0,'down');ce.setTurn=4;let wd=mk('ガスタ・コドル',0),big=mk('ガスタの疾風 リーズ',0);
gameState.players[0].field=mv;gameState.players[0].mz=[wm];gameState.players[0].sz=[ce];gameState.players[0].deck.push(big,wd);baselineA();SEEN=[];
PREFER=[wm.uid];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
ok('C: ガスタ・ガルド returned to the hand → ガスタ・コドル (Lv3 WIND) special summoned; リーズ (Lv5) not offered',z(wm)==='hand'&&z(wd)==='mz'&&!offered(big),JSON.stringify({wm:z(wm),wd:z(wd),TRIG}));
audit('C');

/* ===== D: 迷宮変化 — equipped to 迷宮壁－ラビリンス・ウォール－; Tribute both: ウォール・シャドウ from the Deck ===== */
fresh();
let mh=mk('迷宮変化',0),lw=mk('迷宮壁－ラビリンス・ウォール－',0,'up'),ws=mk('ウォール・シャドウ',0);gameState.players[0].hand=[mh];gameState.players[0].mz=[lw];gameState.players[0].deck.push(ws);baselineA();
PREFER=[lw.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('D: 迷宮変化 equipped to 迷宮壁',z(mh)==='sz'&&C(mh).equipTo&&C(mh).equipTo.uid===lw.uid);
duelActivateFromZone(0,'sz',findCardByUid(mh.uid).index);drive();
ok('D: 迷宮壁 and 迷宮変化 tributed; ウォール・シャドウ special summoned',z(lw)==='grave'&&z(mh)==='grave'&&z(ws)==='mz',JSON.stringify({lw:z(lw),mh:z(mh),ws:z(ws)}));
audit('D');
fresh();
ws=mk('ウォール・シャドウ',0);gameState.players[0].grave=[ws];baselineA();
ok('D2: ウォール・シャドウ cannot be revived by 死者蘇生 (「迷宮変化」の効果でしか特殊召喚できない)',canEffectSpecialSummonS03(C(ws),'grave','死者蘇生')===false);
`);
