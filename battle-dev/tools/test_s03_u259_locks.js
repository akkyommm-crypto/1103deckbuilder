/* S03-U259: activation locks — 超古代生物の墓場, インヴェルズの歩哨, エンジェルO7, ランドオルスのヒカリゴケ, 苦痛の回廊, 古代の機械砲台, ナチュル・バンブーシュート (engine/1ZD monster effect activations + lingering sources). Real DUEL paths and the legality used by every activation / response list; Replay-audited. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function C(c){const hh=findCardByUid(c.uid);return hh?hh.card:null;}
function idx(c){const hh=findCardByUid(c.uid);return hh?hh.index:-1;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:6},()=>mk('ワイト',p));}
let PREFER=[];
function step(){const q=pc();if(q){let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u||(x.card&&x.card.uid===u));if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function lp(p){return gameState.players[p].lp;}
function up(n,p,pos){return mk(n,p,'up',pos);}
function atk(p,a,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(a),target:target==='direct'?'direct':idx(target)});drive();}
/* player ap attacks; player rp responds at the first POINT matching want(payload) with the card at (zone,i) */
function attackRespond(ap,a,target,rp,want,zone,i){
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:ap,atkIdx:idx(a),target:target==='direct'?'direct':idx(target)});
  let done=false;
  for(let k=0;k<300;k++){const w=gameState.processorWaiting;
    if(!done&&w&&w.type==='POINT'&&gameState.processorPaused&&want(w.payload||{})){pointActivateV27(rp,zone,i,0);done=true;continue;}
    if(!step())break;}
  drive();return done;}
function turnOf(p){gameState.activePlayer=p;gameState.turn=p===0?5:6;gameState.phase='battle';}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function ign(c,prefer){const h=findCardByUid(c.uid);PREFER=(prefer||[]).slice();duelActivateFromZone(h.p,'mz',h.index);drive();PREFER=[];}
function legal(name,p,zone,i){return strictScriptLegalityV2(name,p,zone,i,{});}
function setT(n,p){const c=mk(n,p,'down');c.setTurn=3;return c;}
function ss(c,from){c.specialSummoned=true;c.specialSummonedFrom=from||'deck';c.summonedTurn=3;return c;}
function offered(p,c){return (getChainResponsesV2(p)||[]).some(r=>r.card===C(c));}

/* ===== A: 超古代生物の墓場 — Level 6+ special summoned monsters on the field cannot attack or activate effects ===== */
fresh();
let gv=setT('超古代生物の墓場',0),a7=ss(up('アームド・ドラゴン LV7',0)),a5=ss(up('アームド・ドラゴン LV5',0)),w1=up('ワイト',1);
gameState.players[0].sz=[gv];gameState.players[0].mz=[a7,a5];gameState.players[0].hand=[mk('ジェネティック・ワーウルフ',0),mk('青眼の白龍',0)];gameState.players[1].mz=[w1];baselineA();
duelActivateFromZone(0,'sz',0);drive();
const lgA=legal('アームド・ドラゴン LV7',0,'mz',0),lgA5=legal('アームド・ドラゴン LV5',0,'mz',1);
ok('A: activated; LV7 (Level 7, special summoned) cannot activate its effect; LV5 (Level 5) can',C(gv).face==='up'&&!lgA.ok&&/モンスター効果を発動できません/.test(lgA.reason)&&lgA5.ok,JSON.stringify({gv:C(gv).face,lgA,lgA5}));
duelActivateFromZone(0,'mz',0);drive();
ok('A: an attempted activation does nothing (hand unchanged)',gameState.players[0].hand.length===2&&z(w1)==='mz');
audit('A');
gameState.phase='battle';ensureAllCardUids(gameState);baselineA();
atk(0,a7,w1);
ok('A: LV7 cannot declare an attack; LV5 can',z(w1)==='mz'&&!C(a7).attacked&&canDeclareAttackV48(C(a5)),JSON.stringify({w1:z(w1)}));
fresh();
a7=up('アームド・ドラゴン LV7',0);gameState.players[0].sz=[up('超古代生物の墓場',0)];gameState.players[0].mz=[a7];gameState.players[0].hand=[mk('ジェネティック・ワーウルフ',0)];gameState.players[1].mz=[up('ワイト',1)];baselineA();
ok('A2: a Level 7 monster that was not special summoned is not locked',legal('アームド・ドラゴン LV7',0,'mz',0).ok);

/* ===== B: インヴェルズの歩哨 — while face-up in Attack Position: Level 5+ special summoned monsters cannot activate effects ===== */
fresh();
let sn=up('インヴェルズの歩哨',1);a5=ss(up('アームド・ドラゴン LV5',0));
gameState.players[0].mz=[a5];gameState.players[0].hand=[mk('青眼の白龍',0)];gameState.players[1].mz=[sn,up('ワイト',1)];baselineA();
const lgB=legal('アームド・ドラゴン LV5',0,'mz',0);
ok('B: LV5 (special summoned) locked by the opponent\'s face-up Attack Position 歩哨',!lgB.ok&&/インヴェルズの歩哨/.test(lgB.reason),JSON.stringify(lgB));
fresh();
sn=up('インヴェルズの歩哨',1,'def');a5=ss(up('アームド・ドラゴン LV5',0));
gameState.players[0].mz=[a5];gameState.players[0].hand=[mk('青眼の白龍',0)];gameState.players[1].mz=[sn,up('ワイト',1)];baselineA();
ok('B2: 歩哨 in Defense Position — no lock',legal('アームド・ドラゴン LV5',0,'mz',0).ok);

/* ===== C: エンジェルO7 — Tribute Summoned: effect monsters cannot activate effects (both players) ===== */
fresh();
let o7=mk('エンジェルO7',0),t1=up('ワイト',0),t2=up('ワイト',0);a5=up('アームド・ドラゴン LV5',1);
gameState.players[0].hand=[o7];gameState.players[0].mz=[t1,t2];gameState.players[1].mz=[a5];gameState.players[1].hand=[mk('青眼の白龍',1)];baselineA();
PREFER=[t1.uid,t2.uid];doNormalSummon(0,'atk');drive();PREFER=[];
const lgC=legal('アームド・ドラゴン LV5',1,'mz',0);
ok('C: Tribute Summoned (2 Tributes); the opponent\'s LV5 cannot activate its effect',z(o7)==='mz'&&C(o7).summonProvenance?.summonType==='tribute'&&!lgC.ok&&/エンジェルO7/.test(lgC.reason),JSON.stringify({o7:z(o7),lgC}));
audit('C');
fresh();
o7=up('エンジェルO7',0);a5=up('アームド・ドラゴン LV5',1);gameState.players[0].mz=[o7];gameState.players[1].mz=[a5];gameState.players[1].hand=[mk('青眼の白龍',1)];baselineA();
ok('C2: not Tribute Summoned — no lock',legal('アームド・ドラゴン LV5',1,'mz',0).ok);

/* ===== D: ランドオルスのヒカリゴケ — this turn, the opponent's effect monsters cannot activate effects ===== */
fresh();
let cl=up('ナチュル・クリフ',0),own5=up('アームド・ドラゴン LV5',0),foe5=up('アームド・ドラゴン LV5',1),hk=mk('ランドオルスのヒカリゴケ',0);
gameState.players[0].mz=[cl,own5];gameState.players[0].hand=[hk,mk('青眼の白龍',0)];gameState.players[1].mz=[foe5,up('ワイト',1)];gameState.players[1].hand=[mk('青眼の白龍',1)];baselineA();
cast(0,'ランドオルスのヒカリゴケ');
const lgD=legal('アームド・ドラゴン LV5',1,'mz',0),lgDo=legal('アームド・ドラゴン LV5',0,'mz',1);
ok('D: activated with a face-up ナチュル; the opponent\'s monster effect is locked, its controller\'s is not',z(hk)==='grave'&&!lgD.ok&&/ランドオルスのヒカリゴケ/.test(lgD.reason)&&lgDo.ok,JSON.stringify({hk:z(hk),lgD,lgDo}));
audit('D');
gameState.phase='end';ensureAllCardUids(gameState);baselineA();requestProcessorV27(PROCESSOR_V27.TURN,{});drive();
ok('D: next turn — no lock',legal('アームド・ドラゴン LV5',1,'mz',0).ok);
fresh();
gameState.players[0].mz=[up('ワイト',0)];gameState.players[0].hand=[mk('ランドオルスのヒカリゴケ',0)];baselineA();
ok('D2: without a face-up ナチュル it cannot be activated',!legal('ランドオルスのヒカリゴケ',0,'hand',0).ok);

/* ===== E: 苦痛の回廊 — monsters special summoned from the Deck: effects negated, cannot be activated, cannot attack ===== */
fresh();
let cr=up('苦痛の回廊',0),dk=ss(up('アームド・ドラゴン LV5',1),'deck'),hd=ss(up('アームド・ドラゴン LV5',1),'hand');
gameState.players[0].sz=[cr];gameState.players[1].mz=[dk,hd];gameState.players[1].hand=[mk('青眼の白龍',1)];gameState.players[0].mz=[up('ワイト',0)];gameState.activePlayer=1;baselineA();
ok('E: the one from the Deck — negated, cannot activate, cannot attack; the one from the hand is free',effectNegated(C(dk))&&!legal('アームド・ドラゴン LV5',1,'mz',0).ok&&!canDeclareAttackV48(C(dk))&&!effectNegated(C(hd))&&legal('アームド・ドラゴン LV5',1,'mz',1).ok&&canDeclareAttackV48(C(hd)));

/* ===== F: 古代の機械砲台 — release it: 500 damage; during this turn's Battle Phase neither player can activate Trap cards ===== */
fresh();
let cn=up('古代の機械砲台',0),wa=up('ワイト',0),mf=setT('聖なるバリア －ミラーフォース－',1),jar=setT('強欲な瓶',1);
gameState.players[0].mz=[cn,wa];gameState.players[1].sz=[mf,jar];baselineA();
ign(cn);
ok('F: released, 500 damage',z(cn)==='grave'&&lp(1)===7500,JSON.stringify({cn:z(cn),lp1:lp(1)}));
ok('F: Main Phase — Traps are still activatable',legal('強欲な瓶',1,'sz',1).ok);
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'battle'});drive();
const lgF=legal('聖なるバリア －ミラーフォース－',1,'sz',0);
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:findCardByUid(wa.uid).index,target:'direct'});
let offF=false;for(let k=0;k<200;k++){const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){if(offered(1,mf))offF=true;pointPassV27();continue;}if(!step()&&drive()==='idle')break;}
drive();
ok('F: Battle Phase — ミラーフォース is not legal nor offered; the direct attack goes through',!lgF.ok&&!offF&&z(mf)==='sz'&&lp(1)===7500-300,JSON.stringify({lgF,offF,lp1:lp(1)}));
audit('F');

/* ===== G: ナチュル・バンブーシュート — Tribute Summoned by releasing a 「ナチュル」: the opponent cannot activate Spell / Trap cards ===== */
fresh();
let bb=mk('ナチュル・バンブーシュート',0);cl=up('ナチュル・クリフ',0);jar=setT('強欲な瓶',1);
gameState.players[0].hand=[bb];gameState.players[0].mz=[cl];gameState.players[1].sz=[jar];baselineA();
PREFER=[cl.uid];doNormalSummon(0,'atk');drive();PREFER=[];
const lgG=legal('強欲な瓶',1,'sz',0);
ok('G: Tribute Summoned with ナチュル・クリフ; the opponent\'s Trap is not legal',z(bb)==='mz'&&!lgG.ok&&/バンブーシュート/.test(lgG.reason),JSON.stringify({bb:z(bb),lgG}));
audit('G');
fresh();
bb=mk('ナチュル・バンブーシュート',0);let wt=up('ワイト',0);jar=setT('強欲な瓶',1);
gameState.players[0].hand=[bb];gameState.players[0].mz=[wt];gameState.players[1].sz=[jar];baselineA();
PREFER=[wt.uid];doNormalSummon(0,'atk');drive();PREFER=[];
ok('G2: Tribute Summoned with ワイト — no lock',z(bb)==='mz'&&legal('強欲な瓶',1,'sz',0).ok);
`);
