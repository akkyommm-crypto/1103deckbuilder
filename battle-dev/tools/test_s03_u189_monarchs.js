/* S03-U189: the 2011 Monarchs — 雷帝ザボルグ, 氷帝メビウス, 炎帝テスタロス, 光帝クライス. Real DUEL paths (Tribute Summon through
   doNormalSummon, 死者蘇生), Replay-audited. 光帝クライス fixed: only destroyed cards count, and the draw is each controller's choice.
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
function tribSummon(mon,trib,extra){PREFER=[trib.uid].concat(extra||[]);doNormalSummon(gameState.players[0].hand.indexOf(C(mon)),'atk');drive();PREFER=[];}

/* ===== A: 雷帝ザボルグ — Tribute Summon: forced, destroys the chosen monster ===== */
fresh();
let zb=mk('雷帝ザボルグ',0),w1=mk('ワイト',0,'up'),gi=mk('ギガンテス',1,'up'),w2=mk('ワイト',1,'up');
gameState.players[0].hand=[zb];gameState.players[0].mz=[w1];gameState.players[1].mz=[gi,w2];baselineA();
tribSummon(zb,w1,[gi.uid]);
ok('A: ザボルグ Tribute Summoned (ワイト tributed); the chosen ギガンテス destroyed, the other stays',z(zb)==='mz'&&z(w1)==='grave'&&z(gi)==='grave'&&z(w2)==='mz');
audit('A');

/* ===== A2: 雷帝ザボルグ special summoned by 死者蘇生 — not a Tribute Summon: no trigger ===== */
fresh();
zb=mk('雷帝ザボルグ',0);let rv=mk('死者蘇生',0);gi=mk('ギガンテス',1,'up');
gameState.players[0].grave=[zb];gameState.players[0].hand=[rv];gameState.players[1].mz=[gi];baselineA();
TRIG.length=0;PREFER=[zb.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('A2: ザボルグ revived; ギガンテス stays (the effect needs a Tribute Summon)',z(zb)==='mz'&&z(gi)==='mz'&&!TRIG.some(t=>/ザボルグ/.test(t)),JSON.stringify(TRIG));
audit('A2');

/* ===== B: 氷帝メビウス — Tribute Summon: up to 2 chosen Spell / Trap cards destroyed ===== */
fresh();
let mb=mk('氷帝メビウス',0);w1=mk('ワイト',0,'up');let s1=mk('聖なるバリア －ミラーフォース－',1,'down'),s2=mk('サイクロン',1,'down'),s3=mk('強欲な壺',1,'down');
gameState.players[0].hand=[mb];gameState.players[0].mz=[w1];gameState.players[1].sz=[s1,s2,s3];baselineA();
tribSummon(mb,w1,[s1.uid,'yes',s3.uid]);
ok('B: メビウス summoned; the 2 chosen cards destroyed, サイクロン stays',z(mb)==='mz'&&z(s1)==='grave'&&z(s3)==='grave'&&z(s2)==='sz',JSON.stringify([z(s1),z(s2),z(s3)]));
audit('B');

/* ===== C: 炎帝テスタロス — Tribute Summon: a random card of the opponent's hand discarded; a monster → its Level ×100 damage ===== */
fresh();
let ts=mk('炎帝テスタロス',0);w1=mk('ワイト',0,'up');let oh=mk('ギガンテス',1);
gameState.players[0].hand=[ts];gameState.players[0].mz=[w1];gameState.players[1].hand=[oh];baselineA();
const lpC=gameState.players[1].lp;
tribSummon(ts,w1);
ok('C: ギガンテス (Lv4) discarded; 400 damage',z(ts)==='mz'&&z(oh)==='grave'&&gameState.players[1].lp===lpC-400);
audit('C');
fresh();
ts=mk('炎帝テスタロス',0);w1=mk('ワイト',0,'up');oh=mk('死者蘇生',1);
gameState.players[0].hand=[ts];gameState.players[0].mz=[w1];gameState.players[1].hand=[oh];baselineA();
tribSummon(ts,w1);
ok('C2: a Spell discarded — no damage',z(oh)==='grave'&&gameState.players[1].lp===8000);
audit('C2');

/* ===== D: 光帝クライス — up to 2 cards destroyed; each controller may draw that many; it cannot attack this turn ===== */
fresh();
let kr=mk('光帝クライス',0);w1=mk('ワイト',0,'up');gi=mk('ギガンテス',1,'up');s2=mk('サイクロン',1,'down');
gameState.players[0].hand=[kr];gameState.players[0].mz=[w1];gameState.players[1].mz=[gi];gameState.players[1].sz=[s2];baselineA();
const h1=gameState.players[1].hand.length;
tribSummon(kr,w1,[gi.uid,'yes',s2.uid,'yes']);
ok('D: ギガンテス and サイクロン destroyed; the opponent drew 2',z(gi)==='grave'&&z(s2)==='grave'&&gameState.players[1].hand.length===h1+2);
ok('D: クライス cannot attack the turn it was summoned',cannotAttackNow(C(kr))===true);
audit('D');

/* ===== D2: クライス targets itself and an opponent card; the controller declines the draw, the opponent draws ===== */
fresh();
kr=mk('光帝クライス',0);w1=mk('ワイト',0,'up');gi=mk('ギガンテス',1,'up');
gameState.players[0].hand=[kr];gameState.players[0].mz=[w1];gameState.players[1].mz=[gi];baselineA();
const d0=gameState.players[0].hand.length,d1=gameState.players[1].hand.length;
tribSummon(kr,w1,[kr.uid,'yes',gi.uid,'no','yes']);
ok('D2: both destroyed; Player1 declined (hand unchanged), the opponent drew 1',z(kr)==='grave'&&z(gi)==='grave'&&gameState.players[0].hand.length===d0-1&&gameState.players[1].hand.length===d1+1,
  JSON.stringify({kr:z(kr),gi:z(gi),h0:gameState.players[0].hand.length,d0,h1:gameState.players[1].hand.length,d1}));
audit('D2');

/* ===== D3: a target that left the field before resolution is not destroyed and gives no draw ===== */
fresh();
kr=mk('光帝クライス',0);w1=mk('ワイト',0,'up');gi=mk('ギガンテス',1,'up');let ci=mk('強制脱出装置',1,'down');ci.setTurn=4;
gameState.players[0].hand=[kr];gameState.players[0].mz=[w1];gameState.players[1].mz=[gi];gameState.players[1].sz=[ci];baselineA();
const e1=gameState.players[1].hand.length;
PREFER=[w1.uid,gi.uid,'no'];doNormalSummon(0,'atk');
for(let i=0;i<200;i++){ if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length)break;
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  break;}
const offCI=(getChainResponsesV2(1)||[]).some(r=>r.card===C(ci));
if(offCI){PREFER=[gi.uid];duelActivateResponseV2(1,'sz',0);}
drive();PREFER=[];
ok('D3: 強制脱出装置 returned ギガンテス in response; クライス resolves with no destruction and no draw',offCI&&z(gi)==='hand'&&gameState.players[1].hand.length===e1+1,
  JSON.stringify({offCI,gi:z(gi),h1:gameState.players[1].hand.length,e1}));
audit('D3');
`);
