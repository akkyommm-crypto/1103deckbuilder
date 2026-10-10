/* S03-U146: (P) the destroying player of an effect destruction is recorded in DUEL (graveInfo.byPlayer from the Action's P3 stamp —
   before: null, or the player of the next link down); (S) 「このカードが…」 leave-field triggers react only to their own event and once
   per destruction — D－HERO ダブルガイ, ハネクリボー, 魔轟神レヴュアタン, 六武衆の師範 (③ also needs 「相手の効果で」). Real DUEL path,
   Replay-audited. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));return pkg;}
function uid(c){return ensureCardUid(gameState,c);}
let PREFER=[];
function pick(){const q=pc();let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u);if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function step(){
  if(pc()){pick();return true;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();return true;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();return true;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();return true;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();return true;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();return true;}
  return false;}
function drive(){for(let i=0;i<600;i++){if(!step())return 'idle';}return 'loop';}
function fresh(p){resetA();gameState.activePlayer=p||0;gameState.turn=5;gameState.phase='main1';}
function acts(name){return (gameState.log||[]).filter(x=>new RegExp(name+'（SS1）を発動|'+name+'（SS\\d+）を発動').test(x.msg)).length;}
function attack(t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:gameState.activePlayer,atkIdx:0,target:t});return drive();}
`;

/* ===== P. who destroyed it ===== */
harness(COMMON+String.raw`
fresh(0);
const t=mk('聖なるバリア －ミラーフォース－',1,'down');t.setTurn=3;gameState.players[1].sz=[t];
gameState.players[0].hand=[mk('サイクロン',0)];
baselineA();
duelActivateFromHand(0);PREFER=[uid(t)];drive();PREFER=[];
const g1=(findCardByUid(t.uid)||{}).card;
ok('P: サイクロン (player I) destroys the set ミラーフォース → graveInfo.byPlayer = 0',z(t)==='grave'&&g1.graveInfo&&g1.graveInfo.byPlayer===0,JSON.stringify(g1&&g1.graveInfo));
audit('P1');
/* a two-link chain: player I ブラック・ホール (link 1), player II chains サイクロン (link 2) on player I's set card —
   the chain fallback used to answer with link 1's player */
fresh(0);
const mine=mk('聖なるバリア －ミラーフォース－',0,'down');mine.setTurn=3;gameState.players[0].sz=[mine];
const cy=mk('サイクロン',1,'down');cy.setTurn=3;gameState.players[1].sz=[cy];
const w0=mk('ワイト',0,'up'),w1=mk('ワイト',1,'up');gameState.players[0].mz=[w0];gameState.players[1].mz=[w1];
gameState.players[0].hand=[mk('ブラック・ホール',0)];
baselineA();
duelActivateFromHand(0);
let responded=false;
for(let i=0;i<200&&!responded;i++){
  if(gameState.chainWindow&&gameState.chain.length===1){duelActivateResponseV2(1,'sz',0,1);responded=true;break;}
  if(!step())break;}
PREFER=[uid(mine)];drive();PREFER=[];
const gm=(findCardByUid(mine.uid)||{}).card,gw=(findCardByUid(w0.uid)||{}).card;
ok('P: player II chained サイクロン on the ブラック・ホール chain',responded&&z(cy)==='grave',JSON.stringify({responded,cy:z(cy)}));
ok('P: link 2 (player II サイクロン) destroyed ミラーフォース → byPlayer = 1',z(mine)==='grave'&&gm.graveInfo&&gm.graveInfo.byPlayer===1,JSON.stringify(gm&&gm.graveInfo));
ok('P: link 1 (player I ブラック・ホール) destroyed ワイト → byPlayer = 0 (mass destruction too)',z(w0)==='grave'&&gw.graveInfo&&gw.graveInfo.byPlayer===0,JSON.stringify(gw&&gw.graveInfo));
audit('P2');
`);

/* ===== S. 六武衆の師範 ③: only when destroyed by the OPPONENT's effect, and only for itself ===== */
harness(COMMON+String.raw`
fresh(1);
const ms=mk('六武衆の師範',0,'up');const zj=mk('六武衆－ザンジ',0,'up');gameState.players[0].mz=[ms,zj];
const zg=mk('六武衆－ザンジ',0);gameState.players[0].grave=[zg];
gameState.players[1].hand=[mk('ブラック・ホール',1)];
baselineA();
duelActivateFromHand(0);drive();
ok('S 師範: destroyed by the opponent ブラック・ホール (with another 六武衆) → ③ activates exactly once, one 六武衆 returns to the hand',
  z(ms)==='grave'&&acts('六武衆の師範')===1&&gameState.players[0].hand.filter(c=>/六武衆/.test(nm(c))).length===1,
  JSON.stringify({acts:acts('六武衆の師範'),hand:gameState.players[0].hand.map(nm)}));
audit('S 師範 foe');
fresh(0);
const ms2=mk('六武衆の師範',0,'up');gameState.players[0].mz=[ms2];gameState.players[0].grave=[mk('六武衆－ザンジ',0)];
gameState.players[0].hand=[mk('ブラック・ホール',0)];
baselineA();
duelActivateFromHand(0);drive();
ok('S 師範: destroyed by its controller own ブラック・ホール → ③ does not activate',z(ms2)==='grave'&&acts('六武衆の師範')===0&&gameState.players[0].hand.length===0,
  JSON.stringify({acts:acts('六武衆の師範'),hand:gameState.players[0].hand.map(nm)}));
`);

/* ===== S. D－HERO ダブルガイ / ハネクリボー / 魔轟神レヴュアタン: once per own destruction, never for another card ===== */
harness(COMMON+String.raw`
fresh(1);
const dg=mk('D－HERO ダブルガイ',0,'up'),hk=mk('ハネクリボー',0,'up'),wt=mk('ワイト',0,'up');gameState.players[0].mz=[dg,hk,wt];
gameState.players[1].hand=[mk('ブラック・ホール',1)];
baselineA();
duelActivateFromHand(0);drive();
const sched=(JSON.stringify(gameState).match(/d4\.tokens/g)||[]).length;
ok('S ダブルガイ: destroyed with 2 other monsters → activates exactly once',z(dg)==='grave'&&acts('D－HERO ダブルガイ')===1,String(acts('D－HERO ダブルガイ')));
ok('S ハネクリボー: destroyed with 2 other monsters → activates exactly once',z(hk)==='grave'&&acts('ハネクリボー')===1,String(acts('ハネクリボー')));
audit('S mass');
/* ダブルガイ destroyed by battle → once */
fresh(1);gameState.phase='battle';
const dg2=mk('D－HERO ダブルガイ',0,'up');gameState.players[0].mz=[dg2];gameState.players[1].mz=[mk('デーモンの召喚',1,'up')];
baselineA();
attack(0);
ok('S ダブルガイ: destroyed by battle → activates exactly once',z(dg2)==='grave'&&acts('D－HERO ダブルガイ')===1,String(acts('D－HERO ダブルガイ')));
audit('S battle ダブルガイ');
/* ハネクリボー already in the GY (destroyed earlier this turn) does not activate again for another card */
fresh(1);gameState.phase='battle';
const hk2=mk('ハネクリボー',0);hk2.graveInfo={turn:5,from:'mz',byDestroy:true,face:'up',pos:'atk',lv:1};gameState.players[0].grave=[hk2];
gameState.players[0].mz=[mk('ワイト',0,'up')];gameState.players[1].mz=[mk('デーモンの召喚',1,'up')];
baselineA();
attack(0);
ok('S ハネクリボー: in the GY, another monster destroyed by battle → no activation',acts('ハネクリボー')===0,String(acts('ハネクリボー')));
/* 魔轟神レヴュアタン destroyed by battle → offered once */
fresh(1);gameState.phase='battle';
const rv=mk('魔轟神レヴュアタン',0,'up');rv.properlySummonedS03=true;gameState.players[0].mz=[rv];
gameState.players[0].grave=[mk('魔轟神クシャノ',0),mk('魔轟神クシャノ',0)];
const big=mk('青眼の白龍',1,'up');gameState.players[1].mz=[big];
baselineA();
attack(0);
ok('S レヴュアタン: destroyed by battle → activates exactly once (onBattleDestroy + onDestroy used to offer it twice)',['grave','ex'].indexOf(z(rv))>=0&&acts('魔轟神レヴュアタン')===1,
  JSON.stringify({rv:z(rv),acts:acts('魔轟神レヴュアタン'),hand:gameState.players[0].hand.map(nm)}));
audit('S レヴュアタン');
`);
