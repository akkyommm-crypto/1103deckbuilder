/* S03-U223: NOT_STARTED → TESTED — 畳返し, ツバメ返し, 黒光りするG, 黒蠍－棘のミーネ, スケイルモース. Real DUEL paths, Replay-audited.
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
function toWindow(){for(let i=0;i<200;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push(g.map(c=>c.name).join('+'));eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length)return true;
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return false;}return false;}
function offered(p,c){return (getChainResponsesV2(p)||[]).some(r=>r.card===C(c));}
function ssr(p,name){return v46SpecialSummonRestrictionReason(p,dbOf(mk(name,p)));}

/* ===== A: 畳返し — a monster effect activated on its Normal Summon: negated and destroyed ===== */
fresh();
let tg=mk('畳返し',1,'down');tg.setTurn=4;let bz=mk('BF－極北のブリザード',0),gl=mk('BF－疾風のゲイル',0);
gameState.players[1].sz=[tg];gameState.players[0].hand=[bz];gameState.players[0].grave=[gl];baselineA();
doNormalSummon(0,'atk');
let w1=toWindow();const offA=w1&&offered(1,tg);if(offA)duelActivateResponseV2(1,'sz',0);drive();
ok('A: ブリザード\'s summon effect negated; ブリザード destroyed; ゲイル stays in the GY',offA&&z(bz)==='grave'&&z(gl)==='grave'&&z(tg)==='grave',JSON.stringify({offA,bz:z(bz),gl:z(gl),TRIG}));
audit('A');

/* ===== B: ツバメ返し — a monster effect activated on its Special Summon: negated and destroyed ===== */
fresh();
let tb=mk('ツバメ返し',1,'down');tb.setTurn=4;let gb=mk('ジェネクス・ブラスト',0),gc=mk('ジェネクス・コントローラー',0),mr=mk('死者蘇生',0);
gameState.players[1].sz=[tb];gameState.players[0].grave=[gb];gameState.players[0].hand=[mr];gameState.players[0].deck.push(gc);baselineA();
PREFER=[gb.uid];duelActivateFromHand(0);
w1=toWindow();for(let k=0;k<5&&w1&&(gameState.chain[gameState.chain.length-1]||{}).name!=='ジェネクス・ブラスト';k++){chainPassV2();w1=toWindow();}
const offB=w1&&offered(1,tb);if(offB)duelActivateResponseV2(1,'sz',0);drive();PREFER=[];
ok('B: ブラスト\'s search negated; ブラスト destroyed; the コントローラー stays in the Deck',offB&&z(gb)==='grave'&&z(gc)==='deck'&&z(tb)==='grave',JSON.stringify({offB,gb:z(gb),gc:z(gc),TRIG}));
audit('B');
fresh();
tb=mk('ツバメ返し',1,'down');tb.setTurn=4;bz=mk('BF－極北のブリザード',0);gl=mk('BF－疾風のゲイル',0);
gameState.players[1].sz=[tb];gameState.players[0].hand=[bz];gameState.players[0].grave=[gl];baselineA();
doNormalSummon(0,'atk');w1=toWindow();
ok('B2: a Normal Summon trigger — ツバメ返し not offered',!(w1&&offered(1,tb)));

/* ===== C: 黒光りするG — the opponent special summons one Synchro Monster: banish it from the GY (cost), destroy that monster ===== */
fresh();
let sg=mk('黒光りするG',0),t1=mk('BF－疾風のゲイル',1,'up'),n1=mk('セイバーザウルス',1,'up'),sy=mk('ダーク・ダイブ・ボンバー',1);
gameState.players[0].grave=[sg];gameState.players[1].mz=[t1,n1];gameState.players[1].ex=[sy];gameState.activePlayer=1;baselineA();
const cbC=exCombos(1,dbOf(sy)).combos.find(c=>c.materials.length===2);
if(cbC)beginExSummonV2(1,0,cbC.materials,'synchro','atk');drive();
ok('C: ダーク・ダイブ・ボンバー destroyed; 黒光りするG banished',!!cbC&&z(sy)==='grave'&&z(sg)==='banish',JSON.stringify({sy:z(sy),sg:z(sg),TRIG}));
audit('C');

/* ===== D: 黒蠍－棘のミーネ — battle damage: a 「黒蠍」 card from the Deck or the GY (choose one) ===== */
fresh();
let mn=mk('黒蠍－棘のミーネ',0,'up'),gr=mk('黒蠍盗掘団',0),dc=mk('黒蠍－逃げ足のチック',0);
gameState.players[0].mz=[mn];gameState.players[0].grave=[gr];gameState.players[0].deck.push(dc);gameState.phase='battle';baselineA();
PREFER=['grave',gr.uid];requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:'direct'});drive();PREFER=[];
ok('D: the GY mode — 黒蠍盗掘団 added; the Deck card stays',gameState.players[1].lp===7000&&z(gr)==='hand'&&z(dc)==='deck',JSON.stringify({gr:z(gr),dc:z(dc)}));
audit('D');
fresh();
mn=mk('黒蠍－棘のミーネ',0,'up');dc=mk('黒蠍－逃げ足のチック',0);
gameState.players[0].mz=[mn];gameState.players[0].deck.push(dc);gameState.phase='battle';baselineA();
PREFER=[dc.uid];requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:'direct'});drive();PREFER=[];
ok('D2: only the Deck holds one — チック added from the Deck',z(dc)==='hand');

/* ===== E: スケイルモース — each player can special summon only once per turn ===== */
fresh();
let sm=mk('スケイルモース',1,'up'),w=mk('ワイト',0),be=mk('青眼の白龍',0);mr=mk('死者蘇生',0);let mr2=mk('死者蘇生',0);
gameState.players[1].mz=[sm];gameState.players[0].grave=[w,be];gameState.players[0].hand=[mr,mr2];baselineA();
ok('E: before any special summon — not locked',ssr(0,'ワイト')==='');
PREFER=[w.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('E: after one special summon its controller\'s opponent is locked for this turn; the other player is not',z(w)==='mz'&&/スケイルモース/.test(ssr(0,'青眼の白龍'))&&ssr(1,'ワイト')==='');
duelActivateFromHand(0);drive();
ok('E: the second 死者蘇生 summons nothing',z(be)==='grave');
audit('E');
`);
