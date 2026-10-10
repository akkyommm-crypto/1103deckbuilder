/* S03-U132: 「龍の鏡」 and 「オーバーロード・フュージョン」 (both NOT_STARTED) on the Fusion-Spell profiles (engine/1ZL_fusion_spell_s03.js):
   materials from the own field / GY are banished. Real DUEL path, Replay-audited. */
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
let PREFER=[],SEEN=[],MATS=null;
function pick(){const q=pc();SEEN.push({title:q.title,cands:q.candidates.map(x=>x.label||x.name||(x.card?nm(x.card):x.value))});
  if(MATS&&/融合素材/.test(q.title)){const want=MATS.map(uid).sort().join(',');const j=q.candidates.findIndex(x=>String(x.value).split(',').map(Number).sort().join(',')===want);__choicePickV49(j);return;}
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
function legal(n){return strictScriptLegalityV2(n,0,'hand',0,{});}
`;

/* ===== A. 龍の鏡: field + GY materials banished → 青眼の究極竜; non-Dragon Fusion Monsters are not offered; hand materials do not count ===== */
harness(COMMON+String.raw`
fresh();
const b1=mk('青眼の白龍',0,'up'),b2=mk('青眼の白龍',0),b3=mk('青眼の白龍',0),mir=mk('龍の鏡',0);
gameState.players[0].hand=[mir];gameState.players[0].mz=[b1];gameState.players[0].grave=[b2,b3];
const ult=mk('青眼の究極竜',0),gat=mk('ガトリング・ドラゴン',0);gameState.players[0].ex=[gat,ult];
baselineA();
ok('A: 龍の鏡 is legal (1 on the field + 2 in the GY)',legal('龍の鏡').ok===true);
PREFER=['atk'];duelActivateFromHand(0);drive();PREFER=[];
const exQ=SEEN.find(s=>/融合召喚する融合モンスター/.test(s.title));
ok('A: only the Dragon Fusion Monster is offered',!!exQ&&JSON.stringify(exQ.cands)==='["青眼の究極竜"]',JSON.stringify(SEEN));
ok('A: 青眼の究極竜 Fusion Summoned; all 3 materials banished (not sent to the GY)',z(ult)==='mz'&&ult.specialSummonKind==='fusion'&&[b1,b2,b3].every(c=>z(c)==='banish')&&z(mir)==='grave',JSON.stringify({ult:z(ult),b:[b1,b2,b3].map(z)}));
audit('A');
/* materials in the hand are not usable */
fresh();
gameState.players[0].hand=[mk('龍の鏡',0),mk('青眼の白龍',0)];gameState.players[0].mz=[mk('青眼の白龍',0,'up')];gameState.players[0].grave=[mk('青眼の白龍',0)];
gameState.players[0].ex=[mk('青眼の究極竜',0)];
ok('A: a material in the hand does not count → illegal',legal('龍の鏡').ok===false);
`);

/* ===== B. under ネクロバレー GY materials cannot be banished → not offered ===== */
harness(COMMON+String.raw`
fresh();
gameState.players[1].field=mk('王家の眠る谷－ネクロバレー',1,'up');
gameState.players[0].hand=[mk('龍の鏡',0)];gameState.players[0].mz=[mk('青眼の白龍',0,'up')];gameState.players[0].grave=[mk('青眼の白龍',0),mk('青眼の白龍',0)];
gameState.players[0].ex=[mk('青眼の究極竜',0)];
ok('B: under ネクロバレー the GY materials are not usable → illegal',legal('龍の鏡').ok===false);
gameState.players[0].mz.push(mk('青眼の白龍',0,'up'),mk('青眼の白龍',0,'up'));
ok('B: with all 3 on the field it is legal again',legal('龍の鏡').ok===true);
`);

/* ===== C. オーバーロード・フュージョン: キメラテック・オーバー・ドラゴン with 3 materials (field + GY); LIGHT Machine Fusion Monsters not offered ===== */
harness(COMMON+String.raw`
fresh();
const cd=mk('サイバー・ドラゴン',0,'up'),m1=mk('サイバー・ドラゴン',0),m2=mk('リボルバー・ドラゴン',0),ov=mk('オーバーロード・フュージョン',0);
gameState.players[0].hand=[ov];gameState.players[0].mz=[cd];gameState.players[0].grave=[m1,m2];
const ctod=mk('キメラテック・オーバー・ドラゴン',0),twin=mk('サイバー・ツイン・ドラゴン',0);gameState.players[0].ex=[twin,ctod];
baselineA();
ok('C: オーバーロード・フュージョン is legal',legal('オーバーロード・フュージョン').ok===true);
MATS=[cd,m1,m2];PREFER=[uid(ctod),'atk'];duelActivateFromHand(0);drive();PREFER=[];MATS=null;
const exQ=SEEN.find(s=>/融合召喚する融合モンスター/.test(s.title)),matQ=SEEN.find(s=>/融合素材/.test(s.title));
ok('C: only the DARK Machine キメラテック・オーバー・ドラゴン is offered (サイバー・ツイン・ドラゴン is LIGHT)',!!exQ&&JSON.stringify(exQ.cands)==='["キメラテック・オーバー・ドラゴン"]',JSON.stringify(exQ));
ok('C: 「機械族モンスター1体以上」 → several combinations offered, labelled with their zones',!!matQ&&matQ.cands.length>=3&&matQ.cands.some(l=>/（墓地）/.test(l)),JSON.stringify(matQ));
ok('C: Fusion Summoned with all 3 materials banished; fusionMaterialCount 3',z(ctod)==='mz'&&[cd,m1,m2].every(c=>z(c)==='banish')&&ctod.fusionMaterialCount===3,JSON.stringify({z:z(ctod),n:ctod.fusionMaterialCount,b:[cd,m1,m2].map(z)}));
audit('C');
`);
