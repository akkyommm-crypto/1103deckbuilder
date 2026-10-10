/* S03-U133: 「パワー・ボンド」 and 「ジェムナイト・フュージョン」 (both NOT_STARTED) on the Fusion-Spell profiles, and the battle
   position of 超融合 / ミラクル・フュージョン Fusion Summons (was always ATK). Real DUEL path, Replay-audited. */
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
`;

/* ===== A. パワー・ボンド: Machine only; ATK + original ATK; End Phase damage equal to the increase ===== */
harness(COMMON+String.raw`
fresh();
const c1=mk('サイバー・ドラゴン',0),c2=mk('サイバー・ドラゴン',0),pb=mk('パワー・ボンド',0);
gameState.players[0].hand=[pb,c1,c2];
const twin=mk('サイバー・ツイン・ドラゴン',0),fw=mk('E・HERO フレイム・ウィングマン',0);gameState.players[0].ex=[fw,twin];
gameState.players[0].hand.push(mk('E・HERO フェザーマン',0),mk('E・HERO バーストレディ',0));
baselineA();
const lp0=gameState.players[0].lp;
PREFER=[uid(twin),'atk'];duelActivateFromHand(0);drive();PREFER=[];
const exQ=SEEN.find(s=>/融合召喚する融合モンスター/.test(s.title));
ok('A: only Machine Fusion Monsters are offered (not フレイム・ウィングマン)',!!exQ&&exQ.cands.indexOf('サイバー・ツイン・ドラゴン')>=0&&exQ.cands.indexOf('E・HERO フレイム・ウィングマン')<0,JSON.stringify(exQ));
ok('A: サイバー・ツイン・ドラゴン Fusion Summoned with ATK 2800 + 2800',z(twin)==='mz'&&curATK(twin)===5600,JSON.stringify({z:z(twin),atk:curATK(twin)}));
ok('A: no damage yet; one End Phase damage is scheduled',gameState.players[0].lp===lp0&&(gameState.scheduledV7||[]).filter(e=>e.handler==='s03u133.power-bond-damage').length===1);
runDueSchedulesV7('endPhase',gameState);
ok('A: End Phase → 2800 damage to its controller',gameState.players[0].lp===lp0-2800,JSON.stringify({lp:gameState.players[0].lp}));
audit('A');
/* the damage happens even if the monster has left the field */
fresh();
const d1=mk('サイバー・ドラゴン',0),d2=mk('サイバー・ドラゴン',0);gameState.players[0].hand=[mk('パワー・ボンド',0),d1,d2];
const tw2=mk('サイバー・ツイン・ドラゴン',0);gameState.players[0].ex=[tw2];
baselineA();
const lp1=gameState.players[0].lp;
PREFER=['atk'];duelActivateFromHand(0);drive();PREFER=[];
API.destroy(findCardByUid(tw2.uid),'test');drive();
runDueSchedulesV7('endPhase',gameState);
ok('A: the monster destroyed before the End Phase → still 2800 damage',z(tw2)==='grave'&&gameState.players[0].lp===lp1-2800,JSON.stringify({lp:gameState.players[0].lp}));
audit('A2');
`);

/* ===== B. ジェムナイト・フュージョン ① (「ジェムナイト」 Fusion Monsters only, DEF) and ② (banish a ジェムナイト from the GY → back to the hand) ===== */
harness(COMMON+String.raw`
fresh();
const ga=mk('ジェムナイト・ガネット',0),sa=mk('ジェムナイト・サフィア',0),gkf=mk('ジェムナイト・フュージョン',0);
gameState.players[0].hand=[gkf,ga,sa];
const rub=mk('ジェムナイト・ルビーズ',0),aq=mk('ジェムナイト・アクアマリナ',0),gat=mk('ガトリング・ドラゴン',0);gameState.players[0].ex=[gat,rub,aq];
baselineA();
PREFER=[uid(rub),'def'];duelActivateFromHand(0);drive();PREFER=[];
const exQ=SEEN.find(s=>/融合召喚する融合モンスター/.test(s.title));
ok('B ①: both 「ジェムナイト」 Fusion Monsters offered, not ガトリング・ドラゴン',!!exQ&&exQ.cands.length===2&&exQ.cands.indexOf('ガトリング・ドラゴン')<0,JSON.stringify(exQ));
ok('B ①: ジェムナイト・ルビーズ Fusion Summoned in DEF; materials in the GY; the spell in the GY',z(rub)==='mz'&&rub.pos==='def'&&z(ga)==='grave'&&z(sa)==='grave'&&z(gkf)==='grave');
audit('B1');
/* ② */
const gi=gameState.players[0].grave.indexOf(gkf);
ok('B ②: legal from the GY while a ジェムナイト monster is there',legal('ジェムナイト・フュージョン','grave',gi).ok===true,JSON.stringify(legal('ジェムナイト・フュージョン','grave',gi)));
SEEN=[];PREFER=[uid(sa)];duelActivateFromZone(0,'grave',gi);drive();PREFER=[];
ok('B ②: the cost banishes the chosen ジェムナイト; ジェムナイト・フュージョン returns to the hand',z(sa)==='banish'&&z(ga)==='grave'&&z(gkf)==='hand',JSON.stringify({sa:z(sa),ga:z(ga),gkf:z(gkf)}));
audit('B2');
fresh();
const g2=mk('ジェムナイト・フュージョン',0);gameState.players[0].grave=[g2,mk('ワイト',0)];
ok('B ②: no ジェムナイト monster in the GY → illegal',legal('ジェムナイト・フュージョン','grave',0).ok===false);
`);

/* ===== C. 超融合 / ミラクル・フュージョン: the player chooses the position (was always ATK) ===== */
harness(COMMON+String.raw`
fresh();
const sp=mk('超融合',0),fodder=mk('青眼の白龍',0);gameState.players[0].hand=[sp,fodder];
const hero=mk('E・HERO エアーマン',0,'up');gameState.players[0].mz=[hero];
const foeWater=mk('アンモ・ナイト',1,'up');gameState.players[1].mz=[foeWater];
const az=mk('E・HERO アブソルートZero',0);gameState.players[0].ex=[az];
baselineA();
PREFER=[uid(fodder),'def'];duelActivateFromHand(0);drive();PREFER=[];
ok('C: 超融合 asks the position; E・HERO アブソルートZero Fusion Summoned in DEF',z(az)==='mz'&&az.pos==='def'&&SEEN.some(s=>/超融合：.*表示形式/.test(s.title)),JSON.stringify({z:z(az),pos:az.pos}));
audit('C1');
fresh();
const mf=mk('ミラクル・フュージョン',0);gameState.players[0].hand=[mf];
const fm=mk('E・HERO フェザーマン',0),bl=mk('E・HERO バーストレディ',0,'up');gameState.players[0].grave=[fm];gameState.players[0].mz=[bl];
const fw=mk('E・HERO フレイム・ウィングマン',0);gameState.players[0].ex=[fw];
baselineA();
SEEN=[];PREFER=['def'];duelActivateFromHand(0);drive();PREFER=[];
ok('C: ミラクル・フュージョン asks the position; フレイム・ウィングマン in DEF; materials banished',z(fw)==='mz'&&fw.pos==='def'&&z(fm)==='banish'&&z(bl)==='banish'&&SEEN.some(s=>/ミラクル・フュージョン：.*表示形式/.test(s.title)),JSON.stringify({z:z(fw),pos:fw.pos}));
audit('C2');
`);
