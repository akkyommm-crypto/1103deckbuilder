/* S03-U256: LV monsters 3 — ミスティック・ソードマン LV4 / LV6, サイレント・マジシャン LV4, 進化する翼, ハネクリボー LV10 (2011 texts).
   Real DUEL paths, Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function C(c){return findCardByUid(c.uid).card;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:6},()=>mk('ワイト',p));}
let PREFER=[];
function step(){const q=pc();if(q){let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function offered(p,c){return (getChainResponsesV2(p)||[]).some(r=>r.card===C(c));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function lp(p){return gameState.players[p].lp;}
function up(n,p,pos){return mk(n,p,'up',pos);}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function hit(a,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:findCardByUid(a.uid).p,atkIdx:findCardByUid(a.uid).index,target:findCardByUid(t.uid).index});drive();}
function toStandby(turn){gameState.turn=turn;gameState.activePlayer=0;gameState.phase='draw';ensureAllCardUids(gameState);baselineA();phase('standby');}
function src(c){const s=C(c).summonSrcS03;return s?s.name:null;}
function ctr(c){return (C(c).counters&&Number(C(c).counters['魔力']))||0;}

/* ===== A: ミスティック・ソードマン LV4 — Normal Summon only as a Set ===== */
fresh();
let m4=mk('ミスティック・ソードマン LV4',0),db4=dbOf(m4);gameState.players[0].hand=[m4];baselineA();
ok('A: no Normal Summon method face-up; exactly one Set method (no Tribute)',normalSummonMethodsFor(db4,0,'summon').length===0&&normalSummonMethodsFor(db4,0,'set').length===1);
doSetMonster(0);drive();
ok('A: Set face-down in Defense Position',z(m4)==='mz'&&C(m4).face==='down'&&C(m4).pos==='def',JSON.stringify({z:z(m4),face:C(m4).face}));
audit('A');
fresh();
let m6=mk('ミスティック・ソードマン LV6',0);gameState.players[0].hand=[m6];gameState.players[0].mz=[up('ワイト',0)];baselineA();
ok('A2: LV6 — only a Set with 1 Tribute',normalSummonMethodsFor(dbOf(m6),0,'summon').length===0&&normalSummonMethodsFor(dbOf(m6),0,'set').length===1&&normalSummonMethodsFor(dbOf(m6),0,'set')[0].tributes===1);

/* ===== B: LV4 attacks a face-down Defense monster: destroyed without damage calculation → End Phase: LV4 → LV6 ===== */
fresh();
m4=up('ミスティック・ソードマン LV4',0);m6=mk('ミスティック・ソードマン LV6',0);let fd=mk('ワイト',1,'down','def');
gameState.players[0].mz=[m4];gameState.players[0].deck.push(m6);gameState.players[1].mz=[fd];gameState.phase='battle';baselineA();
hit(m4,fd);
ok('B: the face-down ワイト destroyed while still face-down (no damage calculation, not flipped), no damage',z(fd)==='grave'&&C(fd).graveInfo?.face==='down'&&lp(1)===8000&&lp(0)===8000,JSON.stringify({fd:z(fd),gi:C(fd).graveInfo,lp:[lp(0),lp(1)]}));
phase('main2');phase('end');
ok('B: End Phase — LV4 → LV6 (summoned by LV4)',z(m4)==='grave'&&z(m6)==='mz'&&src(m6)==='ミスティック・ソードマン LV4',JSON.stringify({m4:z(m4),m6:z(m6)}));
audit('B');
fresh();
m4=up('ミスティック・ソードマン LV4',0);m6=mk('ミスティック・ソードマン LV6',0);gameState.players[0].mz=[m4];gameState.players[0].deck.push(m6);baselineA();
phase('end');
ok('B2: no monster destroyed — no LV-up',z(m4)==='mz'&&z(m6)==='deck');

/* ===== C: LV6 — the face-down monster it destroys may be placed on top of the opponent's Deck instead of the GY ===== */
fresh();
m6=up('ミスティック・ソードマン LV6',0);fd=mk('ワイト',1,'down','def');gameState.players[0].mz=[m6];gameState.players[1].mz=[fd];gameState.phase='battle';baselineA();
PREFER=['top'];hit(m6,fd);PREFER=[];
ok('C: placed on top of the opponent\'s Deck (not in the GY)',z(fd)==='deck'&&gameState.players[1].deck[0].uid===fd.uid&&gameState.players[1].grave.length===0,JSON.stringify({fd:z(fd),g:gameState.players[1].grave.length}));
audit('C');
fresh();
m6=up('ミスティック・ソードマン LV6',0);fd=mk('ワイト',1,'down','def');gameState.players[0].mz=[m6];gameState.players[1].mz=[fd];gameState.phase='battle';baselineA();
PREFER=['grave'];hit(m6,fd);PREFER=[];
ok('C2: or sent to the GY (destroyed face-down by the effect)',z(fd)==='grave'&&C(fd).graveInfo?.face==='down'&&lp(1)===8000,JSON.stringify({gi:C(fd).graveInfo}));
audit('C2');

/* ===== D: サイレント・マジシャン LV4 — a counter per card the opponent draws (max 5), +500 ATK each; → LV8 at the next own Standby Phase ===== */
fresh();
let s4=up('サイレント・マジシャン LV4',0),s8=mk('サイレント・マジシャン LV8',0);gameState.players[0].mz=[s4];gameState.players[0].deck.push(s8);
gameState.players[1].hand=[mk('強欲な壺',1)];gameState.activePlayer=1;baselineA();
cast(1,'強欲な壺');
ok('D: the opponent draws 2 — 2 counters, ATK 1000 + 1000',ctr(s4)===2&&curATK(C(s4))===2000,JSON.stringify({c:ctr(s4),atk:curATK(C(s4))}));
gameState.players[0].hand=[mk('強欲な壺',0)];gameState.activePlayer=0;ensureAllCardUids(gameState);baselineA();
cast(0,'強欲な壺');
ok('D: its controller\'s own draw adds nothing',ctr(s4)===2);
audit('D');
fresh();
s4=up('サイレント・マジシャン LV4',0);s4.counters={'魔力':4};s8=mk('サイレント・マジシャン LV8',0);gameState.players[0].mz=[s4];gameState.players[0].deck.push(s8);
gameState.players[1].hand=[mk('強欲な壺',1)];gameState.activePlayer=1;baselineA();
cast(1,'強欲な壺');
ok('D2: 4 + 2 draws → capped at 5 (ATK 3500); the 5th counter turn recorded',ctr(s4)===5&&curATK(C(s4))===3500&&C(s4).silentMagFifthTurnS03===5,JSON.stringify({c:ctr(s4),t:C(s4).silentMagFifthTurnS03}));
audit('D2');
toStandby(7);
ok('D2: next own Standby — LV4 → LV8 (special summoned by LV4)',z(s4)==='grave'&&z(s8)==='mz'&&src(s8)==='サイレント・マジシャン LV4',JSON.stringify({s4:z(s4),s8:z(s8)}));
audit('D3');

/* ===== E: 進化する翼 → ハネクリボー LV10; LV10 in the opponent's Battle Phase destroys its Attack Position monsters and burns their original ATK ===== */
fresh();
let hk=up('ハネクリボー',0),k10=mk('ハネクリボー LV10',0),c1=mk('ワイト',0),c2=mk('ワイト',0);
gameState.players[0].mz=[hk];gameState.players[0].hand=[mk('進化する翼',0),c1,c2];gameState.players[0].deck.push(k10);baselineA();
cast(0,'進化する翼',[hk.uid,c1.uid,c2.uid]);
ok('E: cost ハネクリボー + 2 hand cards; ハネクリボー LV10 special summoned from the Deck',z(hk)==='grave'&&z(c1)==='grave'&&z(c2)==='grave'&&z(k10)==='mz',JSON.stringify({hk:z(hk),c1:z(c1),k10:z(k10)}));
audit('E');
ok('E2: LV10 cannot be special summoned by another effect',summonOnlyReasonS03(mk('ハネクリボー LV10',0),null,'死者蘇生')!=='');
fresh();
k10=up('ハネクリボー LV10',0);let b1=up('青眼の白龍',1),b2=up('ジェネティック・ワーウルフ',1),b3=up('ワイト',1,'def');
gameState.players[0].mz=[k10];gameState.players[1].mz=[b1,b2,b3];gameState.activePlayer=1;gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});
let used=false;
for(let i=0;i<80;i++){ if(step())continue; const w=gameState.processorWaiting;
  if(!used&&w&&w.type==='POINT'&&gameState.processorPaused&&offered(0,k10)){ used=true; pointActivateV27(0,'mz',0); continue; }
  if(drive()==='idle')break; }
drive();
ok('E3: LV10 released in the opponent\'s Battle Phase — 青眼 and ワーウルフ destroyed, ワイト (Defense) stays; 3000 + 2000 damage',used&&z(k10)==='grave'&&z(b1)==='grave'&&z(b2)==='grave'&&z(b3)==='mz'&&lp(1)===8000-5000,JSON.stringify({used,b1:z(b1),b3:z(b3),lp1:lp(1)}));
audit('E3');
fresh();
k10=up('ハネクリボー LV10',0);gameState.players[0].mz=[k10];gameState.players[1].mz=[up('青眼の白龍',1)];gameState.phase='main1';baselineA();
ok('E4: not in its controller\'s own turn',!strictScriptLegalityV2('ハネクリボー LV10',0,'mz',0,{}).ok);
`);
