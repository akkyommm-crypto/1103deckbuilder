/* S03-U208: NOT_STARTED → TESTED — ラヴァルの炎車回し, ナチュル・マロン, スクラップ・コング, 貫ガエル. Real DUEL paths, Replay-audited.
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
function step(){const q=pc();if(!q)return false;
  if(q.min>1&&q.min===q.max){answerChoiceV49(q.candidates.slice(0,q.min).map(x=>x.key));return true;}
  let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push(g.map(c=>c.name).join('+'));eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}

/* ===== A: ラヴァルの炎車回し — destroyed by battle: 2 「ラヴァル」 monsters from the Deck to the GY ===== */
fresh();
let lk=mk('ラヴァルの炎車回し',0,'up'),l1=mk('ラヴァル・ウォリアー',0),l2=mk('ラヴァルのマグマ砲兵',0),at=mk('ブラッド・ヴォルス',1,'up');
gameState.players[0].mz=[lk];gameState.players[0].deck.push(l1,l2);gameState.players[1].mz=[at];gameState.activePlayer=1;gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('A: destroyed by battle → ラヴァル・ウォリアー and マグマ砲兵 sent',z(lk)==='grave'&&z(l1)==='grave'&&z(l2)==='grave',JSON.stringify({l1:z(l1),l2:z(l2),TRIG}));
audit('A');

/* ===== B: ナチュル・マロン — summoned: a 「ナチュル」 from the Deck to the GY; once per turn: 2 「ナチュル」 from the GY to the Deck, draw 1 ===== */
fresh();
let nm=mk('ナチュル・マロン',0),nd=mk('ナチュル・アントジョー',0),g1=mk('ナチュル・クリフ',0),g2=mk('ナチュル・ガーディアン',0);
gameState.players[0].hand=[nm];gameState.players[0].deck.push(nd);gameState.players[0].grave=[g1,g2];baselineA();
doNormalSummon(0,'atk');drive();
ok('B: ① ナチュル・アントジョー sent from the Deck',z(nd)==='grave');
const hB=gameState.players[0].hand.length;
PREFER=[g1.uid,g2.uid];duelActivateFromZone(0,'mz',findCardByUid(nm.uid).index);drive();PREFER=[];
ok('B: ② 2 「ナチュル」 returned to the Deck, drew 1; once per turn',[z(g1),z(g2),z(nd)].filter(x=>x==='deck').length===2&&gameState.players[0].hand.length===hB+1&&strictScriptLegalityV2('ナチュル・マロン',0,'mz',findCardByUid(nm.uid).index,{}).ok===false,JSON.stringify([z(g1),z(g2),z(nd),gameState.players[0].hand.length,hB]));
audit('B');

/* ===== C: スクラップ・コング — Normal Summoned: destroys itself (a 「スクラップ」 effect) → a 「スクラップ」 from the GY to the hand ===== */
fresh();
let kg=mk('スクラップ・コング',0),sb=mk('スクラップ・ビースト',0),k2=mk('スクラップ・コング',0);
gameState.players[0].hand=[kg];gameState.players[0].grave=[sb,k2];baselineA();
PREFER=[sb.uid];doNormalSummon(0,'atk');drive();PREFER=[];
ok('C: スクラップ・コング destroyed by its own effect → スクラップ・ビースト added (the other コング not a candidate)',z(kg)==='grave'&&z(sb)==='hand'&&z(k2)==='grave',JSON.stringify({kg:z(kg),sb:z(sb),TRIG}));
audit('C');
fresh();
kg=mk('スクラップ・コング',0,'up');sb=mk('スクラップ・ビースト',0);let bh=mk('ブラック・ホール',0);
gameState.players[0].mz=[kg];gameState.players[0].hand=[bh];gameState.players[0].grave=[sb];baselineA();TRIG.length=0;
duelActivateFromHand(0);drive();
ok('C2: destroyed by ブラック・ホール (not 「スクラップ」) — no activation',z(kg)==='grave'&&z(sb)==='grave'&&!TRIG.some(t=>/コング/.test(t)));
audit('C2');

/* ===== D: 貫ガエル — attacks directly past a monster; with another 「ガエル」: an opponent Spell / Trap destroyed ===== */
fresh();
let nk=mk('貫ガエル',0,'up'),fr=mk('悪魔ガエル',0,'up'),om=mk('ブラッド・ヴォルス',1,'up'),st=mk('サイクロン',1,'down');
gameState.players[0].mz=[nk,fr];gameState.players[1].mz=[om];gameState.players[1].sz=[st];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:'direct'});drive();
ok('D: direct attack past ブラッド・ヴォルス (400 damage); サイクロン destroyed',gameState.players[1].lp===7600&&z(st)==='grave',JSON.stringify({lp:gameState.players[1].lp,st:z(st),TRIG}));
audit('D');
`);
