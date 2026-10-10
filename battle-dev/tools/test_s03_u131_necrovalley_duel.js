/* S03-U131: 王家の眠る谷－ネクロバレー in DUEL chain resolution. graveMoveBlocked() used SCRIPT_PHASE / SCRIPT_ZONE / ACTIVE_SCRIPT,
   which only the MANUAL runScript sets — so in real duels 死者蘇生 revived under ネクロバレー (only banishing was stopped).
   Now the resolving chain block (RESOLVING_LINK_S03) counts as "an effect resolving". Real DUEL path, Replay-audited. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function names(p,zn){return (gameState.players[p][zn]||[]).map(nm);}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function uid(c){return ensureCardUid(gameState,c);}
let PREFER=[];
function pick(){const q=pc();let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u);if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<400;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';}
function necro(p){gameState.players[p].field=mk('王家の眠る谷－ネクロバレー',p,'up');}
`;

/* ===== A. 死者蘇生 under the opponent's ネクロバレー: the revival does not happen ===== */
harness(COMMON+String.raw`
fresh();necro(1);
const w=mk('ワイト',0),mr=mk('死者蘇生',0);gameState.players[0].grave=[w];gameState.players[0].hand=[mr];
baselineA();
PREFER=[uid(w)];duelActivateFromHand(0);drive();PREFER=[];
ok('A: under ネクロバレー 死者蘇生 resolves but ワイト stays in the GY',z(w)==='grave'&&z(mr)==='grave'&&gameState.players[0].mz.length===0,JSON.stringify({w:z(w),mz:names(0,'mz')}));
ok('A: no chain block remains marked as resolving after the chain',typeof RESOLVING_LINK_S03==='undefined'||RESOLVING_LINK_S03===null);
audit('A');
/* control: without ネクロバレー it revives */
fresh();
const w2=mk('ワイト',0);gameState.players[0].grave=[w2];gameState.players[0].hand=[mk('死者蘇生',0)];
baselineA();
PREFER=[uid(w2)];duelActivateFromHand(0);drive();PREFER=[];
ok('A: control — without ネクロバレー ワイト is revived',z(w2)==='mz');
`);

/* ===== B. an effect activated in the GY is not 「墓地のカードへ及ぶ効果」 (1103 ruling, RULING_1103_GRAVE_ACTIVATION):
   グローアップ・バルブ still revives itself ===== */
harness(COMMON+String.raw`
fresh();necro(1);
const gb=mk('グローアップ・バルブ',0);gameState.players[0].grave=[gb];gameState.players[0].deck=[mk('ワイト',0),mk('ワイト',0)];
baselineA();
duelActivateFromZone(0,'grave',0);drive();
ok('B: グローアップ・バルブ (activated in the GY) revives itself under ネクロバレー',z(gb)==='mz'&&gameState.players[0].grave.length===1,JSON.stringify({gb:z(gb),g:names(0,'grave')}));
audit('B');
`);

/* ===== C. 墓守の石版 (ignoresNecrovalley) still returns 2 墓守 monsters under its controller's own ネクロバレー ===== */
harness(COMMON+String.raw`
fresh();necro(0);
const g1=mk('墓守の番兵',0),g2=mk('墓守の偵察者',0);gameState.players[0].grave=[g1,g2];gameState.players[0].hand=[mk('墓守の石版',0)];
baselineA();
duelActivateFromHand(0);drive();
ok('C: 墓守の石版 returns both 墓守 monsters to the hand under ネクロバレー',z(g1)==='hand'&&z(g2)==='hand',JSON.stringify({g1:z(g1),g2:z(g2)}));
audit('C');
`);
