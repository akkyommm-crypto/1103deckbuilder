/* S03-U140: シューティング・クェーサー・ドラゴン (PARTIAL auto-table "recruit ignition"; fixed Debris list x1). Real DUEL path, Replay-audited. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function uid(c){return ensureCardUid(gameState,c);}
let PREFER=[];
function pick(){const q=pc();let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u);if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<600;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';}
function responses(p){return getChainResponsesV2(p).map(x=>x.db.n);}
`;

/* ===== A. ①: attacks up to the number of non-Tuner Synchro materials ===== */
harness(COMMON+String.raw`
fresh();
const fs=mk('フォーミュラ・シンクロン',0,'up'),lib=mk('TG ハイパー・ライブラリアン',0,'up'),rg=mk('魔轟神レイジオン',0,'up');
gameState.players[0].mz=[fs,lib,rg];
const qs=mk('シューティング・クェーサー・ドラゴン',0);gameState.players[0].ex=[qs];
baselineA();
const cb=exCombos(0,dbOf(qs)).combos;
ok('A: precondition — フォーミュラ・シンクロン + ライブラリアン + レイジオン is a legal combination',cb.length>=1);
beginExSummonV2(0,0,cb[0].materials,'synchro','atk');drive();
ok('A ①: Synchro Summoned; 2 non-Tuner materials → it can attack twice per Battle Phase',z(qs)==='mz'&&attackLimitV48(qs)===2,JSON.stringify({z:z(qs),limit:attackLimitV48(qs)}));
audit('A');
`);

/* ===== B. ②: once per turn, negate an activation and destroy the card ===== */
harness(COMMON+String.raw`
fresh();gameState.activePlayer=1;
const qs=mk('シューティング・クェーサー・ドラゴン',0,'up');qs.properlySummonedS03=true;gameState.players[0].mz=[qs];
const tb=mk('サンダー・ボルト',1),tb2=mk('サンダー・ボルト',1);gameState.players[1].hand=[tb,tb2];
baselineA();
duelActivateFromHand(0);
ok('B ②: offered as a response to the opponent\'s サンダー・ボルト',responses(0).indexOf('シューティング・クェーサー・ドラゴン')>=0,JSON.stringify(responses(0)));
duelActivateResponseV2(0,'mz',0);drive();
ok('B ②: サンダー・ボルト negated and destroyed; Quasar survives',z(qs)==='mz'&&z(tb)==='grave',JSON.stringify({qs:z(qs),tb:z(tb)}));
duelActivateFromHand(0);
ok('B ②: once per turn — not offered against the second サンダー・ボルト',responses(0).indexOf('シューティング・クェーサー・ドラゴン')<0,JSON.stringify(responses(0)));
drive();
ok('B: the second サンダー・ボルト resolves and destroys Quasar',z(qs)!=='mz');
audit('B');
`);

/* ===== C. ③: when it leaves the field face-up → シューティング・スター・ドラゴン from the Extra Deck ===== */
harness(COMMON+String.raw`
fresh();gameState.activePlayer=1;
const qs=mk('シューティング・クェーサー・ドラゴン',0,'up');qs.properlySummonedS03=true;gameState.players[0].mz=[qs];
const ssd=mk('シューティング・スター・ドラゴン',0);gameState.players[0].ex=[ssd];
gameState.players[1].hand=[mk('サンダー・ボルト',1)];
baselineA();
duelActivateFromHand(0);drive();
ok('C ③: Quasar destroyed by the opponent サンダー・ボルト → シューティング・スター・ドラゴン Special Summoned from the Extra Deck',z(qs)==='grave'&&z(ssd)==='mz',JSON.stringify({qs:z(qs),ssd:z(ssd)}));
audit('C');
fresh();
const qd=mk('シューティング・クェーサー・ドラゴン',0,'down');qd.pos='def';gameState.players[0].mz=[qd];
const ssd2=mk('シューティング・スター・ドラゴン',0);gameState.players[0].ex=[ssd2];
gameState.players[1].hand=[mk('サンダー・ボルト',1)];gameState.activePlayer=1;
baselineA();
duelActivateFromHand(0);drive();
ok('C ③: face-down when it left → no summon',z(ssd2)==='ex');
audit('C2');
`);
