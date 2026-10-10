/* S03-U128: ドッペル・ウォリアー — ① Special Summon from the hand when a monster is Special Summoned from your GY (was
   missing); ② tokens only when sent to the GY as Synchro Material (fired on any send to the GY before). Real DUEL path. */
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
function chainAdds(){return v41ReplayPackage(gameState).actions.map(x=>x&&x.action).filter(a=>a&&a.type==='CHAIN_ADD').map(a=>a.name);}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';}
function tokens(p){return (gameState.players[p].mz||[]).filter(c=>c&&c.token&&c.token.n==='ドッペル・トークン');}
`;

/* ===== A. ① a monster is Special Summoned from your GY → Special Summon ドッペル・ウォリアー from the hand ===== */
harness(COMMON+String.raw`
fresh();
const dw=mk('ドッペル・ウォリアー',0),mr=mk('死者蘇生',0);gameState.players[0].hand=[mr,dw];
const w=mk('ワイト',0);gameState.players[0].grave=[w];
baselineA();
PREFER=[uid(w)];duelActivateFromHand(0);drive();PREFER=[];
ok('A ①: ワイト revived from own GY → ドッペル・ウォリアー Special Summoned from the hand (a chain link)',z(w)==='mz'&&z(dw)==='mz'&&chainAdds().includes('ドッペル・ウォリアー'),JSON.stringify({w:z(w),dw:z(dw),adds:chainAdds()}));
audit('A');
/* from the OPPONENT's GY → no trigger */
fresh();
const dw2=mk('ドッペル・ウォリアー',0),mr2=mk('死者蘇生',0);gameState.players[0].hand=[mr2,dw2];
const w2=mk('ワイト',1);gameState.players[1].grave=[w2];
baselineA();
PREFER=[uid(w2)];duelActivateFromHand(0);drive();PREFER=[];
ok('A: 死者蘇生 takes the opponent ワイト straight from the opponent GY (origin recorded as the opponent)',w2.specialSummonedFromPlayer===1&&findCardByUid(w2.uid).p===0,JSON.stringify({from:w2.specialSummonedFromPlayer}));
ok('A ①: revived from the opponent\'s GY → no trigger',z(w2)==='mz'&&z(dw2)==='hand'&&!chainAdds().includes('ドッペル・ウォリアー'),JSON.stringify({dw:z(dw2),adds:chainAdds()}));
API.destroy(findCardByUid(w2.uid),'test');drive();
ok('A: destroyed → it goes to its owner (the opponent) GY',findCardByUid(w2.uid).p===1&&z(w2)==='grave');
`);

/* ===== B. ② used as Synchro Material → 2 ドッペル・トークン in Attack Position ===== */
harness(COMMON+String.raw`
fresh();
const t=mk('ジャンク・シンクロン',0,'up'),dw=mk('ドッペル・ウォリアー',0,'up');gameState.players[0].mz=[t,dw];
const lib=mk('TG ハイパー・ライブラリアン',0);gameState.players[0].ex=[lib];
baselineA();
ok('B: precondition — ジャンク・シンクロン (Lv3) + ドッペル・ウォリアー (Lv2) → Lv5',exCombos(0,dbOf(lib)).combos.length>=1,JSON.stringify(exCombos(0,dbOf(lib)).combos));
const P=gameState.players[0];doExSummon(0,0,[P.mz.indexOf(t),P.mz.indexOf(dw)],'synchro','atk');drive();
ok('B ②: sent as Synchro Material → 2 ドッペル・トークン in Attack Position',z(lib)==='mz'&&z(dw)==='grave'&&tokens(0).length===2&&tokens(0).every(c=>c.pos==='atk'),JSON.stringify({lib:z(lib),n:tokens(0).length,mz:names(0,'mz')}));
audit('B');
`);

/* ===== C. ② does not trigger when destroyed ===== */
harness(COMMON+String.raw`
fresh();gameState.activePlayer=1;
const dw=mk('ドッペル・ウォリアー',0,'up');gameState.players[0].mz=[dw];gameState.players[1].hand=[mk('サンダー・ボルト',1)];
baselineA();
duelActivateFromHand(0);drive();
ok('C: destroyed by サンダー・ボルト → no tokens',z(dw)==='grave'&&tokens(0).length===0&&!chainAdds().includes('ドッペル・ウォリアー'),JSON.stringify({dw:z(dw),adds:chainAdds()}));
audit('C');
`);
