/* S03-U134: Fusion Material substitutes (沼地の魔神王 ① — was missing, the card was PARTIAL) in 融合-type spells, 超融合 and
   ミラクル・フュージョン. Real DUEL path, Replay-audited. */
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
let PREFER=[],SEEN=[];
function pick(){const q=pc();SEEN.push({title:q.title,cands:q.candidates.map(x=>x.label||x.name||(x.card?nm(x.card):x.value))});
  let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u);if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<400;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';}
function legal(n,zone,i){return strictScriptLegalityV2(n,0,zone||'hand',i||0,{});}
function offered(spell){return fusionSpellOptionsS03(0,spell).map(o=>o.ex.db.n);}
`;

/* ===== A. 融合: 沼地の魔神王 stands in for one named material ===== */
harness(COMMON+String.raw`
fresh();
const sw=mk('沼地の魔神王',0),bl=mk('E・HERO バーストレディ',0),poly=mk('融合',0);
gameState.players[0].hand=[poly,sw,bl];
const fw=mk('E・HERO フレイム・ウィングマン',0),rg=mk('E・HERO ランパートガンナー',0),sh=mk('E・HERO The シャイニング',0);gameState.players[0].ex=[fw,rg,sh];
baselineA();
ok('A: with 沼地の魔神王 + バーストレディ, フレイム・ウィングマン (for フェザーマン) and ランパートガンナー (for クレイマン) are offered; The シャイニング (「E・HERO」モンスター＋光属性) is not',JSON.stringify(offered('融合'))==='["E・HERO フレイム・ウィングマン","E・HERO ランパートガンナー"]',JSON.stringify(offered('融合')));
PREFER=[uid(fw),'atk'];duelActivateFromHand(0);drive();PREFER=[];
ok('A: フレイム・ウィングマン Fusion Summoned; 沼地の魔神王 and バーストレディ in the GY as Fusion Materials',z(fw)==='mz'&&fw.specialSummonKind==='fusion'&&z(sw)==='grave'&&z(bl)==='grave'&&sw.fusionMaterialS03==='融合');
audit('A');
`);

/* ===== B. limits: only one substitute; face-down on the field does not work; not for 「上記のカードでしか」 monsters ===== */
harness(COMMON+String.raw`
fresh();
gameState.players[0].hand=[mk('融合',0),mk('沼地の魔神王',0),mk('沼地の魔神王',0)];gameState.players[0].ex=[mk('E・HERO フレイム・ウィングマン',0)];
ok('B: two substitutes and no real material → illegal',legal('融合').ok===false);
fresh();
const swd=mk('沼地の魔神王',0,'down');swd.pos='def';
gameState.players[0].hand=[mk('融合',0),mk('E・HERO バーストレディ',0)];gameState.players[0].mz=[swd];gameState.players[0].ex=[mk('E・HERO フレイム・ウィングマン',0)];
ok('B: a face-down 沼地の魔神王 on the field cannot substitute → illegal',legal('融合').ok===false);
swd.face='up';swd.pos='atk';
ok('B: face-up it can',legal('融合').ok===true);
fresh();
gameState.players[0].hand=[mk('融合',0),mk('サイバー・ドラゴン',0),mk('沼地の魔神王',0)];
gameState.players[0].ex=[mk('サイバー・ツイン・ドラゴン',0),mk('サイバー・エンド・ドラゴン',0)];
ok('B: サイバー・ツイン・ドラゴン 「このカードの融合召喚は上記のカードでしか行えない」 — no substitute → illegal',legal('融合').ok===false,JSON.stringify(offered('融合')));
`);

/* ===== C. ミラクル・フュージョン: 沼地の魔神王 in the GY substitutes; 超融合 with a face-up 沼地の魔神王 ===== */
harness(COMMON+String.raw`
fresh();
const sw=mk('沼地の魔神王',0),bl=mk('E・HERO バーストレディ',0,'up'),mf=mk('ミラクル・フュージョン',0);
gameState.players[0].hand=[mf];gameState.players[0].grave=[sw];gameState.players[0].mz=[bl];
const fw=mk('E・HERO フレイム・ウィングマン',0);gameState.players[0].ex=[fw];
baselineA();
PREFER=['atk'];duelActivateFromHand(0);drive();PREFER=[];
ok('C: ミラクル・フュージョン with 沼地の魔神王 (GY) + バーストレディ (field) → フレイム・ウィングマン; both banished',z(fw)==='mz'&&z(sw)==='banish'&&z(bl)==='banish',JSON.stringify({fw:z(fw),sw:z(sw),bl:z(bl)}));
audit('C1');
fresh();
const sp=mk('超融合',0),fodder=mk('青眼の白龍',0);gameState.players[0].hand=[sp,fodder];
const sw2=mk('沼地の魔神王',0,'up');gameState.players[0].mz=[sw2];
const foe=mk('E・HERO フェザーマン',1,'up');gameState.players[1].mz=[foe];
const fw2=mk('E・HERO フレイム・ウィングマン',0);gameState.players[0].ex=[fw2];
baselineA();
PREFER=[uid(fodder),'atk'];duelActivateFromHand(0);drive();PREFER=[];
ok('C: 超融合 with own face-up 沼地の魔神王 (for バーストレディ) + the opponent\'s フェザーマン → フレイム・ウィングマン',z(fw2)==='mz'&&z(sw2)==='grave'&&z(foe)==='grave',JSON.stringify({fw:z(fw2),sw:z(sw2),foe:z(foe)}));
audit('C2');
`);

/* ===== D. 沼地の魔神王 ②: discard it from the hand → add 融合 from the Deck ===== */
harness(COMMON+String.raw`
fresh();
const sw=mk('沼地の魔神王',0),pl=mk('融合',0);gameState.players[0].hand=[sw];gameState.players[0].deck=[mk('ワイト',0),pl];
baselineA();
ok('D ②: legal in the Main Phase from the hand',legal('沼地の魔神王').ok===true,JSON.stringify(legal('沼地の魔神王')));
duelActivateFromHand(0);drive();
ok('D ②: 沼地の魔神王 discarded, 融合 added from the Deck',z(sw)==='grave'&&z(pl)==='hand',JSON.stringify({sw:z(sw),pl:z(pl)}));
audit('D');
`);

/* ===== D (limits): no 融合 in the Deck / not in the Main Phase → illegal ===== */
harness(COMMON+String.raw`
fresh();
gameState.players[0].hand=[mk('沼地の魔神王',0)];gameState.players[0].deck=[mk('ワイト',0)];
ok('D ②: no 融合 in the Deck → illegal (the old auto script offered any card)',legal('沼地の魔神王').ok===false);
fresh();gameState.phase='battle';
gameState.players[0].hand=[mk('沼地の魔神王',0)];gameState.players[0].deck=[mk('融合',0)];
ok('D ②: in the Battle Phase → illegal',legal('沼地の魔神王').ok===false,JSON.stringify(legal('沼地の魔神王')));
`);
