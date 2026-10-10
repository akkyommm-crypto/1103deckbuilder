/* S03-U130: 「融合」 (was NOT_STARTED — no Fusion Summon by Polymerization in DUEL mode) and 「ダーク・フュージョン」 (NOT_STARTED)
   on the Fusion-Spell procedure (engine/1ZL_fusion_spell_s03.js). Real DUEL path, Replay-audited. */
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
function legal(n,p,zone,i){return strictScriptLegalityV2(n,p||0,zone||'hand',i||0,{});}
`;

/* ===== A. 融合 from the hand: Fusion Summon of E・HERO フレイム・ウィングマン in DEF; E－HERO インフェルノ・ウィング (ダーク・フュージョン only)
   is not offered ===== */
harness(COMMON+String.raw`
fresh();
const fm=mk('E・HERO フェザーマン',0),bl=mk('E・HERO バーストレディ',0),poly=mk('融合',0);
gameState.players[0].hand=[poly,fm,bl];
const fw=mk('E・HERO フレイム・ウィングマン',0),iw=mk('E－HERO インフェルノ・ウィング',0);gameState.players[0].ex=[iw,fw];
baselineA();
ok('A: 融合 is legal (materials in the hand)',legal('融合').ok===true,JSON.stringify(legal('融合')));
PREFER=['def'];duelActivateFromHand(0);drive();PREFER=[];
const exQ=SEEN.find(s=>/融合召喚する融合モンスター/.test(s.title));
ok('A: only E・HERO フレイム・ウィングマン is offered (インフェルノ・ウィング needs ダーク・フュージョン)',!!exQ&&JSON.stringify(exQ.cands)==='["E・HERO フレイム・ウィングマン"]',JSON.stringify(SEEN));
ok('A: Fusion Summoned in face-up Defense Position, as a Fusion Summon',z(fw)==='mz'&&fw.face==='up'&&fw.pos==='def'&&fw.specialSummonKind==='fusion'&&fw.properlySummonedS03===true,JSON.stringify({z:z(fw),pos:fw.pos,k:fw.specialSummonKind}));
ok('A: both materials sent to the GY (marked as Fusion Materials), 融合 in the GY',z(fm)==='grave'&&z(bl)==='grave'&&fm.fusionMaterialS03==='融合'&&bl.fusionMaterialS03==='融合'&&z(poly)==='grave',JSON.stringify(names(0,'grave')));
ok('A: インフェルノ・ウィング stays in the Extra Deck',z(iw)==='ex');
audit('A');
`);

/* ===== B. materials from the field (face-down too) + hand; several combinations → the player chooses; zone and lock checks ===== */
harness(COMMON+String.raw`
fresh();
const cl=mk('E・HERO クレイマン',0,'down');cl.pos='def';cl.setTurn=3;
const b1=mk('E・HERO バーストレディ',0),b2=mk('E・HERO バーストレディ',0,'up'),fm=mk('E・HERO フェザーマン',0);
gameState.players[0].hand=[mk('融合',0),b1,fm];gameState.players[0].mz=[cl,b2];
const rg=mk('E・HERO ランパートガンナー',0),fw=mk('E・HERO フレイム・ウィングマン',0);gameState.players[0].ex=[fw,rg];
baselineA();
PREFER=[uid(rg),String(uid(cl))+','+String(uid(b2)),'atk'];
/* pick ランパートガンナー, then the combination face-down クレイマン + the field バーストレディ */
duelActivateFromHand(0);
for(let i=0;i<40;i++){
  const q=pc();
  if(q&&/融合素材/.test(q.title)){const j=q.candidates.findIndex(x=>{const v=String(x.value).split(',').map(Number).sort().join(',');return v===[uid(cl),uid(b2)].sort().join(',');});SEEN.push({title:q.title,cands:q.candidates.map(x=>x.label)});__choicePickV49(j);continue;}
  if(q){pick();continue;}
  if(drive()==='idle')break;
}
const exQ=SEEN.find(s=>/融合召喚する融合モンスター/.test(s.title)),matQ=SEEN.find(s=>/融合素材/.test(s.title));
ok('B: both Fusion Monsters are offered',!!exQ&&exQ.cands.length===2,JSON.stringify(exQ));
ok('B: ランパートガンナー has 2 combinations (hand / field バーストレディ) → a material choice',!!matQ&&matQ.cands.length===2&&matQ.cands.some(l=>/裏側のE・HERO クレイマン（フィールド）/.test(l)),JSON.stringify(matQ));
ok('B: the chosen field materials (face-down クレイマン + field バーストレディ) went to the GY; the hand one stayed',z(cl)==='grave'&&z(b2)==='grave'&&z(b1)==='hand'&&z(rg)==='mz'&&rg.pos==='atk',JSON.stringify({cl:z(cl),b2:z(b2),b1:z(b1),rg:z(rg)}));
audit('B');
/* no free zone when all materials are in the hand */
fresh();
gameState.players[0].hand=[mk('融合',0),mk('E・HERO フェザーマン',0),mk('E・HERO バーストレディ',0)];
gameState.players[0].mz=[1,2,3,4,5].map(()=>mk('ワイト',0,'up'));gameState.players[0].ex=[mk('E・HERO フレイム・ウィングマン',0)];
baselineA();
ok('B: 5 monsters on the field and the materials in the hand → illegal',legal('融合').ok===false);
/* a Special Summon lock */
fresh();
gameState.players[0].hand=[mk('融合',0),mk('E・HERO フェザーマン',0),mk('E・HERO バーストレディ',0)];gameState.players[0].ex=[mk('E・HERO フレイム・ウィングマン',0)];
gameState.players[0].temporaryFlags.noSpecialSummon=true;
ok('B: under a Special Summon lock → illegal',legal('融合').ok===false);
/* nothing to fuse */
fresh();
gameState.players[0].hand=[mk('融合',0),mk('E・HERO フェザーマン',0)];gameState.players[0].ex=[mk('E・HERO フレイム・ウィングマン',0)];
ok('B: materials missing → illegal',legal('融合').ok===false);
`);

/* ===== C. ダーク・フュージョン: 悪魔族 only; the summoned monster cannot be targeted by the opponent's effects this turn ===== */
harness(COMMON+String.raw`
fresh();
const fm=mk('E・HERO フェザーマン',0),bl=mk('E・HERO バーストレディ',0);
gameState.players[0].hand=[mk('ダーク・フュージョン',0),fm,bl];
const fw=mk('E・HERO フレイム・ウィングマン',0),iw=mk('E－HERO インフェルノ・ウィング',0);gameState.players[0].ex=[fw,iw];
const moon=mk('月の書',1,'down');moon.setTurn=3;gameState.players[1].sz=[moon];
const foe=mk('ゴブリンドバーグ',1,'up');gameState.players[1].mz=[foe];
baselineA();
ok('C: ダーク・フュージョン is legal',legal('ダーク・フュージョン').ok===true);
duelActivateFromHand(0);drive();
const exQ=SEEN.find(s=>/融合召喚する融合モンスター/.test(s.title));
ok('C: only the 悪魔族 インフェルノ・ウィング is offered',!!exQ&&JSON.stringify(exQ.cands)==='["E－HERO インフェルノ・ウィング"]',JSON.stringify(SEEN));
ok('C: インフェルノ・ウィング Fusion Summoned, materials in the GY',z(iw)==='mz'&&iw.specialSummonKind==='fusion'&&z(fm)==='grave'&&z(bl)==='grave');
const hIW=findCardByUid(iw.uid);
ok('C: this turn the opponent cannot target it; its controller can',filterTargetable([hIW],1).length===0&&filterTargetable([hIW],0).length===1);
/* the opponent's set 月の書 offers only its own monster */
SEEN=[];PREFER=[uid(foe)];
duelActivateFromZone(1,'sz',0);
const q=pc();
ok('C: the opponent\'s 月の書 cannot choose インフェルノ・ウィング',!q||!q.candidates.some(x=>x.uid===iw.uid),JSON.stringify(q&&q.candidates.map(x=>x.name||x.label)));
drive();PREFER=[];
ok('C: … so it stays face-up',iw.face==='up');
audit('C');
gameState.turn=6;
ok('C: next turn the protection is gone',filterTargetable([findCardByUid(iw.uid)],1).length===1);
`);

/* ===== D. found with C: in DUEL activation, legacy targets:true scripts (API.selectCard) ignored target immunity entirely
   (ACTIVE_SCRIPT is null while the activation is prepared). A printed immunity: オベリスクの巨神兵 「このカードは効果の対象にならない」 ===== */
harness(COMMON+String.raw`
fresh();
const ob=mk('オベリスクの巨神兵',0,'up');gameState.players[0].mz=[ob];
const moon=mk('月の書',1,'down');moon.setTurn=3;gameState.players[1].sz=[moon];
const foe=mk('ゴブリンドバーグ',1,'up');gameState.players[1].mz=[foe];
baselineA();
PREFER=[uid(foe)];
duelActivateFromZone(1,'sz',0);
const q=pc();
ok('D: the opponent\'s 月の書 cannot choose オベリスクの巨神兵',!!q&&!q.candidates.some(x=>x.uid===ob.uid)&&q.candidates.some(x=>x.uid===foe.uid),JSON.stringify(q&&q.candidates.map(x=>x.name||x.label)));
drive();PREFER=[];
ok('D: オベリスクの巨神兵 stays face-up; 月の書 hit the other monster',ob.face==='up'&&foe.face==='down');
audit('D');
`);
