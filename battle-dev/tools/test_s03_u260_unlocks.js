/* S03-U260: outdated ENGINE_GAP reasons — ブリザード・プリンセス, エレキリン, エレメント・ヴァルキリー, 氷結界の交霊師, 怨霊の湿地帯 (engine: card-activation record, flip-summon turn, opt-in S/T effect locks). Real DUEL paths and the activation legality; Replay-audited. */
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
function legal(name,p,zone,i){const P=gameState.players[p],c=zone==='hand'?P.hand[i]:null,d=c?dbOf(c):null;const o=(c&&(d.k==='s'||d.k==='t'))?{cardOverride:c,logicalZone:d.sub==='フィールド'?'field':'sz',prospectiveIndex:(P.sz||[]).length}:{};return strictScriptLegalityV2(name,p,zone,i,o);}
function setT(n,p){const c=mk(n,p,'down');c.setTurn=3;return c;}
function ctl(c){const h=findCardByUid(c.uid);return h?h.p:null;}
function nextTurn(){gameState.phase='end';ensureAllCardUids(gameState);baselineA();requestProcessorV27(PROCESSOR_V27.TURN,{});drive();}

/* ===== A: ブリザード・プリンセス — Tribute Summon with 1 Spellcaster; the turn it was summoned the opponent cannot activate Spell / Trap cards ===== */
fresh();
let bp=mk('ブリザード・プリンセス',0),bm=up('ブラック・マジシャン',0),wt=up('ワイト',0),jar=setT('強欲な瓶',1);
gameState.players[0].hand=[bp];gameState.players[0].mz=[wt,bm];gameState.players[1].sz=[jar];baselineA();
const ms=normalSummonMethodsFor(dbOf(C(bp)),0,'summon').map(m=>m.id);
const cands=tributeCandidatesForV23(0,dbOf(C(bp)),normalSummonMethodById(dbOf(C(bp)),0,'spellcasterTribute'),'summon').map(x=>cardName(x.card));
ok('A: a 1-Tribute method for Spellcasters (only ブラック・マジシャン is a candidate) next to the standard 2-Tribute one',ms.indexOf('spellcasterTribute')>=0&&cands.length===1&&cands[0]==='ブラック・マジシャン',JSON.stringify({ms,cands}));
{const opS03=openPick;openPick=(t,sub,rows)=>{const r=(rows||[]).find(x=>/魔法使い族/.test(x.label));if(r)r.onPick();};PREFER=[bm.uid];doNormalSummon(0,'atk');drive();PREFER=[];openPick=opS03;}
const lgA=legal('強欲な瓶',1,'sz',0);
ok('A: Tribute Summoned with ブラック・マジシャン; the opponent\'s Trap is not legal this turn',z(bp)==='mz'&&z(bm)==='grave'&&z(wt)==='mz'&&!lgA.ok&&/ブリザード・プリンセス/.test(lgA.reason),JSON.stringify({bp:z(bp),bm:z(bm),lgA}));
audit('A');
nextTurn();
ok('A: the next turn the opponent can activate it again',legal('強欲な瓶',1,'sz',0).ok);

/* ===== B: エレキリン — attacks directly past a monster; after the damage the opponent cannot activate Spells / Traps / monster effects this turn ===== */
fresh();
let ek=up('エレキリン',0),w1=up('ワイト',1),a5=up('アームド・ドラゴン LV5',1);jar=setT('強欲な瓶',1);
gameState.players[0].mz=[ek];gameState.players[1].mz=[w1,a5];gameState.players[1].sz=[jar];gameState.players[1].hand=[mk('青眼の白龍',1)];gameState.phase='battle';baselineA();
ok('B: before the damage the opponent\'s Trap and monster effect are legal',legal('強欲な瓶',1,'sz',0).ok&&legal('アームド・ドラゴン LV5',1,'mz',1).ok);
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:'direct'});drive();
const lgB1=legal('強欲な瓶',1,'sz',0),lgB2=legal('アームド・ドラゴン LV5',1,'mz',1);
ok('B: a direct attack while the opponent controls monsters: 1200 damage; then the opponent\'s Trap and monster effect are not legal',gameState.players[1].lp===8000-1200&&!lgB1.ok&&!lgB2.ok&&/エレキリン/.test(lgB2.reason),JSON.stringify({lp1:gameState.players[1].lp,lgB1,lgB2}));
audit('B');
nextTurn();
ok('B: next turn — no lock',legal('アームド・ドラゴン LV5',1,'mz',1).ok);

/* ===== C: エレメント・ヴァルキリー — a FIRE monster on the field: +500 ATK; a WATER monster: its control cannot change ===== */
fresh();
let ev=up('エレメント・ヴァルキリー',0);gameState.players[0].mz=[ev];baselineA();
ok('C: no FIRE monster — 1500',curATK(C(ev))===1500);
fresh();
ev=up('エレメント・ヴァルキリー',0);gameState.players[0].mz=[ev];gameState.players[1].mz=[up('火霊使いヒータ',1)];baselineA();
ok('C: a FIRE monster on either field — 2000',curATK(C(ev))===2000,String(curATK(C(ev))));
fresh();
ev=up('エレメント・ヴァルキリー',0);gameState.players[0].mz=[ev,up('水霊使いエリア',0)];gameState.players[1].hand=[mk('心変わり',1)];gameState.activePlayer=1;baselineA();
PREFER=[ev.uid];cast(1,'心変わり',[ev.uid]);
ok('C: a WATER monster on the field — 心変わり does not take it',ctl(ev)===0,JSON.stringify({ctl:ctl(ev)}));
audit('C');
fresh();
ev=up('エレメント・ヴァルキリー',0);gameState.players[0].mz=[ev];gameState.players[1].hand=[mk('心変わり',1)];gameState.activePlayer=1;baselineA();
cast(1,'心変わり',[ev.uid]);
ok('C2 control: no WATER monster — 心変わり takes it',ctl(ev)===1,JSON.stringify({ctl:ctl(ev)}));

/* ===== D: 氷結界の交霊師 — special summon from the hand with 4+ more opponent cards; the opponent can activate only one Spell / Trap card per turn ===== */
fresh();
let ic=mk('氷結界の交霊師',0);gameState.players[0].hand=[ic];gameState.players[1].mz=[up('ワイト',1),up('ワイト',1),up('ワイト',1),up('ワイト',1)];baselineA();
const lgD0=strictSummonProcedureLegality('氷結界の交霊師',0,'hand',0);
runSummonProcedure('氷結界の交霊師',0,'hand',0);if(!gameState.pendingSummon&&!pc())finishSummonProcedure('氷結界の交霊師',0,'hand',0,'atk');drive();
ok('D: 4 opponent cards vs 0 — special summoned from the hand',lgD0.ok===true&&z(ic)==='mz',JSON.stringify({lgD0,z:z(ic)}));
audit('D1');
fresh();
ic=mk('氷結界の交霊師',0);gameState.players[0].hand=[ic];gameState.players[0].mz=[up('ワイト',0)];gameState.players[1].mz=[up('ワイト',1),up('ワイト',1),up('ワイト',1),up('ワイト',1)];baselineA();
ok('D2: 4 vs 1 — not legal',strictSummonProcedureLegality('氷結界の交霊師',0,'hand',0).ok===false);
fresh();
ic=up('氷結界の交霊師',0);gameState.players[0].mz=[ic];gameState.players[1].hand=[mk('強欲な壺',1),mk('強欲な壺',1)];gameState.activePlayer=1;baselineA();
ok('D3: the opponent\'s first Spell is legal',legal('強欲な壺',1,'hand',0).ok);
cast(1,'強欲な壺');
const lgD3=legal('強欲な壺',1,'hand',0);
ok('D3: after one Spell card activation the second is not legal',gameState.players[1].hand.length===3&&!lgD3.ok&&/氷結界の交霊師/.test(lgD3.reason),JSON.stringify({h:gameState.players[1].hand.length,lgD3}));
audit('D3');

/* ===== E: 怨霊の湿地帯 — monsters Normal / Flip / Special Summoned this turn cannot attack ===== */
fresh();
let sw=up('怨霊の湿地帯',0),old=up('ジェネティック・ワーウルフ',0),nw=mk('ワイト',0),fd=mk('ワイト',0,'down','def');old.summonedTurn=3;fd.setTurn=3;
gameState.players[0].sz=[sw];gameState.players[0].mz=[old,fd];gameState.players[0].hand=[nw];baselineA();
doNormalSummon(0,'atk');drive();
doFlipUp(0,'mz',1,'atk');drive();
ok('E: Normal Summoned and Flip Summoned this turn — cannot attack; the older monster can',z(nw)==='mz'&&C(fd).face==='up'&&C(fd).flipSummonedTurnS03===5&&!canDeclareAttackV48(C(nw))&&!canDeclareAttackV48(C(fd))&&canDeclareAttackV48(C(old)),JSON.stringify({nw:z(nw),fd:C(fd).face,t:C(fd).flipSummonedTurnS03}));
audit('E');
fresh();
nw=mk('ワイト',0);gameState.players[0].hand=[nw];baselineA();
doNormalSummon(0,'atk');drive();
ok('E2 control: without it a monster Normal Summoned this turn can attack',canDeclareAttackV48(C(nw)));
`);
