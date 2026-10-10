/* S03-U292: ENGINE_GAP re-check 9 (2011 texts) — ライト・オブ・デストラクション, 強制接収, 怒れる類人猿, 機動砦のギア・ゴーレム, モロコシーナ, コダロス, 地縛神の復活, 再機動.
   Real DUEL paths (card activations, chain windows, POINT responses, attacks, phase / turn changes, the hand-size rule), choices answered by the player they belong to, Replay-audited.
   The harness answers the Token position question with its default; one scenario answers it itself. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function pl(c){const hh=findCardByUid(c.uid);return hh?hh.p:null;}
function C(c){const hh=findCardByUid(c.uid);return hh?hh.card:null;}
function idx(c){const hh=findCardByUid(c.uid);return hh?hh.index:-1;}
function pc(){return pendingChoiceV49(gameState);}
function lp(p){return gameState.players[p].lp;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;SEEN=[];TRIG=[];PREFER=[];CH.length=0;
  globalThis.__MANUAL_SS_POSITION_S03=false;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:10},()=>mk('ワイト',p));}
let PREFER=[],TRIG=[],SEEN=[];const CH=[];
const __rq=requestChoiceV49;requestChoiceV49=function(spec){CH.push({title:spec&&spec.title||'',player:spec&&spec.player,min:spec&&spec.min,max:spec&&spec.max,n:((spec&&spec.candidates)||[]).length});return __rq.apply(this,arguments);};
function step(){const q=pc();if(!q)return false;
  SEEN.push({title:q.title||'',kind:q.kind,player:q.player,min:q.min,max:q.max,n:(q.candidates||[]).length,keys:(q.candidates||[]).map(x=>x.uid!=null?x.uid:x.key)});
  const find=u=>q.candidates.findIndex(x=>x.uid===u||x.key===u||x.value===u||(x.card&&x.card.uid===u));
  if(q.max>1||q.min!==q.max){
    let ks=[];for(const u of PREFER){const j=find(u);if(j>=0&&ks.indexOf(q.candidates[j].key)<0)ks.push(q.candidates[j].key);}
    ks=ks.slice(0,q.max);for(const c of q.candidates){if(ks.length>=q.min)break;if(ks.indexOf(c.key)<0)ks.push(c.key);}
    PREFER=PREFER.filter(u=>find(u)<0);answerChoiceV49(ks);return true;}
  let j=-1,k=-1;for(k=0;k<PREFER.length;k++){j=find(PREFER[k]);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}
function drive(){for(let i=0;i<800;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push({names:g.map(c=>c.name),forced:st.rank<2});eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function up(n,p,pos){return mk(n,p,'up',pos);}
function down(n,p){const c=mk(n,p,'down');c.pos='def';return c;}
function setT(n,p){const c=mk(n,p,'down');c.setTurn=3;return c;}
function fieldSp(n,p){const f=up(n,p);gameState.players[p].field=f;return f;}
function base(){gameState.posSnapV10=positionSnapshotV10(gameState);baselineA();}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function legalHand(p,name){const P=gameState.players[p],i=P.hand.findIndex(c=>cardName(c)===name),c=P.hand[i];return strictScriptLegalityV2(name,p,'hand',i,{cardOverride:c,logicalZone:'sz',prospectiveIndex:(P.sz||[]).length});}
function legalMz(c){const hh=findCardByUid(c.uid);return strictScriptLegalityV2(cardName(c),hh.p,'mz',hh.index,{});}
function ign(c,prefer){const hh=findCardByUid(c.uid);PREFER=(prefer||[]).slice();duelActivateFromZone(hh.p,'mz',hh.index);drive();PREFER=[];}
function toWindow(){for(let i=0;i<200;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length)return true;
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return false;}return false;}
function offered(p,c){return (getChainResponsesV2(p)||[]).some(r=>r.card===C(c));}
function toPhase(ph){const ord=['draw','standby','main1','battle','main2','end'];for(let k=0;k<8&&gameState.phase!==ph;k++){const i=ord.indexOf(gameState.phase);if(i<0||i>=ord.indexOf(ph))break;requestProcessorV27(PROCESSOR_V27.PHASE,{to:ord[i+1]});drive();}}
function nextTurn(){toPhase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});drive();}
const trigNamed=n=>TRIG.filter(t=>t.names.indexOf(n)>=0);
const ptitle=s=>SEEN.filter(x=>x.title.indexOf(s)>=0);
const grW=p=>gameState.players[p].grave.filter(c=>cardName(c)==='ワイト').length;
const LD='ライト・オブ・デストラクション',FR='強制接収',AP='怒れる類人猿',GG='機動砦のギア・ゴーレム',MR='モロコシーナ',KD='コダロス',ER='地縛神の復活',RB='再機動';
const NEG=[];function neg(d,v){NEG.push({d,v:!!v});}
function negDone(label){ok(label+': negative — all '+NEG.length+' cases are refused',NEG.length>0&&NEG.every(x=>x.v),JSON.stringify(NEG.filter(x=>!x.v)));NEG.length=0;}
let S0,S1,t,w,ha,nb;

/* ===== L: ライト・オブ・デストラクション — an effect of the opponent sends cards from the opponent Deck to the GY: 3 more cards of that Deck are sent ===== */
/* L1: the opponent's own effect sends 5 together (針虫の巣窟) — one trigger, 3 more (8 in all); the extra mill is this card's own effect and does not trigger it again */
fresh();gameState.activePlayer=1;gameState.turn=6;
S0=up(LD,0);t=setT('針虫の巣窟',1);gameState.players[0].sz=[S0];gameState.players[1].sz=[t];base();
duelActivateFromZone(1,'sz',0);drive();
ok('L1: 針虫の巣窟 (opponent) sent 5 cards of the opponent Deck — ライト・オブ・デストラクション triggered once and sent 3 more (8 in all, 2 left)',grW(1)===8&&gameState.players[1].deck.length===2&&trigNamed(LD).length===1&&grW(0)===0,JSON.stringify({g:grW(1),deck:gameState.players[1].deck.length,TRIG}));
audit('L1');
/* L1b: forced — declining the Trap trigger group three times does not drop it */
fresh();gameState.activePlayer=1;gameState.turn=6;
S0=up(LD,0);t=setT('針虫の巣窟',1);gameState.players[0].sz=[S0];gameState.players[1].sz=[t];base();
duelActivateFromZone(1,'sz',0);
let skipped=0,flagged=false;for(let i=0;i<400;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];
    if(g.length&&g.some(c=>c.name===LD)&&skipped<3){flagged=flagged||g.some(c=>c.name===LD&&c.forcedSTS03===true);skipped++;eventSkipGroupV2();continue;}
    if(g.length){TRIG.push({names:g.map(c=>c.name)});eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w2=gameState.processorWaiting;if(w2&&w2.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}break;}
ok('L1b: the trigger is forced — declining the group 3 times keeps it; it resolves (8 cards in the opponent GY)',flagged&&skipped===3&&grW(1)===8&&trigNamed(LD).length===1,JSON.stringify({flagged,skipped,g:grW(1),TRIG}));
audit('L1b');
/* L2: the opponent Deck has fewer than 3 cards left — as many as possible are sent (6 cards: 5 + 1) */
fresh();gameState.activePlayer=1;gameState.turn=6;
S0=up(LD,0);t=setT('針虫の巣窟',1);gameState.players[0].sz=[S0];gameState.players[1].sz=[t];
gameState.players[1].deck=Array.from({length:6},()=>mk('ワイト',1));base();
duelActivateFromZone(1,'sz',0);drive();
ok('L2: only 1 card was left after the 5 — it is sent too (the Deck is empty, no crash)',grW(1)===6&&gameState.players[1].deck.length===0&&trigNamed(LD).length===1,JSON.stringify({g:grW(1),deck:gameState.players[1].deck.length,TRIG}));
audit('L2');
/* L3: negative — the controller's own effect sends cards from the controller's Deck (「相手のデッキ」) */
fresh();
S0=up(LD,0);gameState.players[0].sz=[S0,setT('針虫の巣窟',0)];base();
duelActivateFromZone(0,'sz',1);drive();
ok('L3: negative — my own Deck milled by my own effect: no trigger',grW(0)===5&&grW(1)===0&&!trigNamed(LD).length,JSON.stringify({g:[grW(0),grW(1)],TRIG}));
audit('L3');
/* L4: negative — the opponent pays a cost from its own Deck (ナチュル・ビースト): not 「効果によって」 */
fresh();
S0=up(LD,0);nb=up('ナチュル・ビースト',1);gameState.players[0].sz=[S0];gameState.players[1].mz=[nb];gameState.players[0].hand=[mk('強欲な壺',0)];base();
duelActivateFromHand(0);
let offL4=toWindow()&&offered(1,nb);
if(offL4){const o=findCardByUid(nb.uid);duelActivateResponseV2(1,o.zone,o.index);}
drive();
ok('L4: negative — ナチュル・ビースト paid 2 cards from its Deck as a cost: no trigger',offL4&&grW(1)===2&&!trigNamed(LD).length,JSON.stringify({offL4,g:grW(1),TRIG}));
audit('L4');
/* L5: negative — my own effect (ブラッド・サッカー, battle damage) sends the opponent Deck cards: 「相手の効果」 is not met */
fresh();
S0=up(LD,0);const bs=up('ブラッド・サッカー',0);gameState.players[0].sz=[S0];gameState.players[0].mz=[bs];base();
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'battle'});drive();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(bs),target:'direct'});drive();
ok('L5: negative — ブラッド・サッカー (mine) sent 1 card of the opponent Deck: no trigger (my own effect)',grW(1)===1&&!trigNamed(LD).length&&lp(1)<8000,JSON.stringify({g:grW(1),lp:lp(1),TRIG}));
audit('L5');
/* L6: negative — the opponent effect sends cards from MY Deck (ブラッド・サッカー hits me): 「相手のデッキ」 is not met for my card */
fresh();gameState.activePlayer=1;gameState.turn=6;gameState.phase='main1';
S0=up(LD,0);const bs6=up('ブラッド・サッカー',1);gameState.players[0].sz=[S0];gameState.players[1].mz=[bs6];base();
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'battle'});drive();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(bs6),target:'direct'});drive();
ok('L6: negative — an opponent effect sent 1 card of MY Deck: no trigger (not the opponent Deck)',grW(0)===1&&grW(1)===0&&!trigNamed(LD).length,JSON.stringify({g:[grW(0),grW(1)],TRIG}));
/* L7: negative — face-down (Set) 針虫の巣窟 resolved while my LD is face-down: no trigger */
fresh();gameState.activePlayer=1;gameState.turn=6;
S0=setT(LD,0);t=setT('針虫の巣窟',1);gameState.players[0].sz=[S0];gameState.players[1].sz=[t];base();
duelActivateFromZone(1,'sz',0);drive();
ok('L7: negative — a face-down ライト・オブ・デストラクション does not trigger',grW(1)===5&&!trigNamed(LD).length,JSON.stringify({g:grW(1),TRIG}));
/* L8: the Trap itself is activated from the Set position: it stays on the field face-up and nothing is milled */
fresh();
S0=setT(LD,0);gameState.players[0].sz=[S0];base();
duelActivateFromZone(0,'sz',0);drive();
ok('L8: activating the Set Trap — it stays face-up in the Spell & Trap Zone and mills nothing',z(S0)==='sz'&&C(S0).face==='up'&&grW(0)===0&&grW(1)===0,JSON.stringify({z:z(S0),face:C(S0)&&C(S0).face}));
audit('L8');

/* ===== R: 強制接収 — activated right after its controller discarded; afterwards every discard of its controller makes the opponent discard as many cards (their choice) ===== */
function skipAll(max){let n=0;for(let i=0;i<400;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length&&n<max){n++;eventSkipGroupV2();continue;}if(g.length){TRIG.push({names:g.map(c=>c.name)});eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w3=gameState.processorWaiting;if(w3&&w3.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}break;}return n;}
const handN=p=>gameState.players[p].hand.length;
/* R1/R2: a Set 強制接収 is activated in the window after 天使の施し made me discard 2 (the discard that allowed it does not count); a later discard of 2 (天使の施し again) makes the opponent choose and discard 2 */
fresh();
S0=setT(FR,0);gameState.players[0].sz=[S0];
const rw1=mk('ワイト',0),rw2=mk('ワイト',0);
gameState.players[0].hand=[mk('天使の施し',0),mk('天使の施し',0),rw1,rw2];
const rOpp=Array.from({length:4},()=>mk('ワイト',1));const rOppUids=rOpp.map(c=>c.uid);gameState.players[1].hand=rOpp;
base();
cast(0,'天使の施し',[rw1.uid,rw2.uid]);
ok('R1: activated from the Set position in the window after my discard — face-up in the Spell & Trap Zone',z(S0)==='sz'&&C(S0).face==='up'&&trigNamed(FR).length===1,JSON.stringify({z:z(S0),face:C(S0)&&C(S0).face,TRIG}));
ok('R1: the discard that allowed the activation does not count — the opponent still holds 4 cards, no choice was asked of the opponent',handN(1)===4&&gameState.players[1].grave.length===0&&!ptitle('強制接収').length,JSON.stringify({opp:handN(1),SEEN}));
audit('R1');
CH.length=0;SEEN=[];TRIG=[];
PREFER=[rOppUids[1],rOppUids[3]];
duelActivateFromHand(gameState.players[0].hand.findIndex(c=>cardName(c)==='天使の施し'));drive();PREFER=[];
const rq=ptitle('強制接収');
ok('R2: my next discard of 2 — the opponent was asked to choose 2 of their 4 hand cards (a choice answered by the opponent, forced)',rq.length===1&&rq[0].player===1&&rq[0].min===2&&rq[0].max===2&&rq[0].n===4,JSON.stringify(rq));
ok('R2: the cards the opponent chose were discarded, the others stayed',handN(1)===2&&gameState.players[1].grave.length===2&&gameState.players[1].hand.map(c=>c.uid).sort().join()===[rOppUids[0],rOppUids[2]].join()&&gameState.players[1].grave.map(c=>c.uid).sort().join()===[rOppUids[1],rOppUids[3]].join(),JSON.stringify({opp:handN(1),h:gameState.players[1].hand.map(c=>c.uid),g:gameState.players[1].grave.map(c=>c.uid)}));
ok('R2: 強制接収 stays face-up in the Spell & Trap Zone (continuous)',C(S0).face==='up'&&z(S0)==='sz',JSON.stringify({z:z(S0)}));
audit('R2');
/* R3: the opponent holds fewer cards than I discarded — the whole hand is discarded (no choice); an empty hand — nothing happens */
fresh();
S0=up(FR,0);gameState.players[0].sz=[S0];
const rx1=mk('ワイト',0),rx2=mk('ワイト',0);
gameState.players[0].hand=[mk('天使の施し',0),rx1,rx2];gameState.players[1].hand=[mk('ワイト',1)];base();
cast(0,'天使の施し',[rx1.uid,rx2.uid]);
ok('R3: the opponent had 1 card (fewer than 2) — their whole hand was discarded without a choice',handN(1)===0&&gameState.players[1].grave.length===1&&!ptitle('強制接収').length,JSON.stringify({opp:handN(1),g:gameState.players[1].grave.length,SEEN}));
audit('R3');
fresh();
S0=up(FR,0);gameState.players[0].sz=[S0];
const ry1=mk('ワイト',0),ry2=mk('ワイト',0);
gameState.players[0].hand=[mk('天使の施し',0),ry1,ry2];gameState.players[1].hand=[];base();
cast(0,'天使の施し',[ry1.uid,ry2.uid]);
ok('R3b: the opponent has no hand — nothing happens, no choice, no error',handN(1)===0&&gameState.players[1].grave.length===0&&!pc()&&gameState.players[0].grave.length===3,JSON.stringify({opp:handN(1),SEEN}));
/* R4: a discard paid as a cost counts (強引な安全協定): 1 card */
fresh();
S0=up(FR,0);const sf=setT('強引な安全協定',0);gameState.players[0].sz=[S0,sf];
const rz=mk('ワイト',0);gameState.players[0].hand=[rz];const rzOpp=Array.from({length:3},()=>mk('ワイト',1));const rzU=rzOpp[2].uid;gameState.players[1].hand=rzOpp;base();
PREFER=[rz.uid,rzU];duelActivateFromZone(0,'sz',idx(sf));drive();PREFER=[];
ok('R4: I discarded 1 card as a cost — the opponent chose 1 of their 3 and discarded it',z(rz)==='grave'&&handN(1)===2&&gameState.players[1].grave.length===1&&gameState.players[1].grave[0].uid===rzU&&ptitle('強制接収').length===1,JSON.stringify({opp:handN(1),SEEN:ptitle('強制接収')}));
audit('R4');
/* R5: the hand-size rule at the end of my turn (8 cards -> 2 discarded) counts: the opponent discards 2 */
fresh();
S0=up(FR,0);gameState.players[0].sz=[S0];
gameState.players[0].hand=Array.from({length:8},()=>mk('ワイト',0));gameState.players[1].hand=Array.from({length:5},()=>mk('ワイト',1));base();
nextTurn();
ok('R5: I discarded 2 by the hand-size rule — the opponent chose and discarded 2',gameState.players[1].grave.length===2&&ptitle('強制接収').length===1&&ptitle('強制接収')[0].player===1,JSON.stringify({me:handN(0),opp:handN(1),g:gameState.players[1].grave.length,SEEN:ptitle('強制接収')}));
audit('R5');
/* R6: negative — the opponent's own discard (hand-size rule at the end of their turn) does not make me discard */
fresh();gameState.activePlayer=1;gameState.turn=6;
S0=up(FR,0);gameState.players[0].sz=[S0];
gameState.players[0].hand=Array.from({length:4},()=>mk('ワイト',0));gameState.players[1].hand=Array.from({length:8},()=>mk('ワイト',1));base();
nextTurn();
ok('R6: negative — the opponent discarded 2 by the hand-size rule: I discard nothing (only my own discards are mirrored)',gameState.players[1].grave.length===2&&gameState.players[0].grave.length===0&&!ptitle('強制接収').length,JSON.stringify({me:handN(0),opp:handN(1),SEEN}));
/* R7: negative — a Set 強制接収 whose activation I decline does not mirror anything; and it is not offered for the opponent's discard */
fresh();
S0=setT(FR,0);gameState.players[0].sz=[S0];
const rv1=mk('ワイト',0),rv2=mk('ワイト',0);
gameState.players[0].hand=[mk('天使の施し',0),rv1,rv2];gameState.players[1].hand=Array.from({length:3},()=>mk('ワイト',1));base();
PREFER=[rv1.uid,rv2.uid];duelActivateFromHand(0);const skipped7=skipAll(1);PREFER=[];
ok('R7: negative — I declined the activation window: it stays Set, the opponent discards nothing',skipped7===1&&z(S0)==='sz'&&C(S0).face==='down'&&handN(1)===3&&gameState.players[1].grave.length===0,JSON.stringify({skipped7,face:C(S0).face,opp:handN(1)}));
fresh();gameState.activePlayer=1;gameState.turn=6;
S0=setT(FR,0);gameState.players[0].sz=[S0];
gameState.players[0].hand=[mk('ワイト',0)];gameState.players[1].hand=Array.from({length:8},()=>mk('ワイト',1));base();
nextTurn();
ok('R7b: negative — the opponent discarded 2: no activation window for my Set 強制接収 (it is not my discard)',gameState.players[1].grave.length===2&&z(S0)==='sz'&&C(S0).face==='down'&&!trigNamed(FR).length,JSON.stringify({TRIG,face:C(S0).face}));
/* R8: forced — declining the Trap trigger group three times keeps it (cost discard, 強引な安全協定) */
fresh();
S0=up(FR,0);const sf8=setT('強引な安全協定',0);gameState.players[0].sz=[S0,sf8];
const r8=mk('ワイト',0);gameState.players[0].hand=[r8];gameState.players[1].hand=Array.from({length:2},()=>mk('ワイト',1));base();
PREFER=[r8.uid];duelActivateFromZone(0,'sz',idx(sf8));const sk8=skipAll(3);PREFER=[];
ok('R8: the trigger is forced — declining the group 3 times keeps it; the opponent discarded 1',sk8>=1&&handN(1)===1&&gameState.players[1].grave.length===1,JSON.stringify({sk8,opp:handN(1),TRIG}));
audit('R8');

/* ===== A: 怒れる類人猿 — destroyed while face-up in Defense Position; must attack if able ===== */
/* A1: face-up Attack Position: it stays; the controller must attack with it (it is on the must-attack list while the Battle Phase can still be used) */
fresh();
let ap=up(AP,0),wt1=up('ワイト',1),wt0=up('ワイト',0);gameState.players[0].mz=[ap,wt0];gameState.players[1].mz=[wt1];base();
toPhase('battle');
ok('A1: in face-up Attack Position it stays on the field and must attack (mustAttackNow, on the pending list; another monster is not)',z(ap)==='mz'&&mustAttackNow(C(ap))===true&&pendingMustAttack().includes(C(ap))&&!pendingMustAttack().includes(C(wt0))&&mustAttackNow(C(wt0))===false,JSON.stringify({z:z(ap),pend:pendingMustAttack().length}));
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(ap),target:idx(wt1)});drive();
ok('A1: after it has attacked it is no longer pending, the attack destroyed the target',!pendingMustAttack().includes(C(ap))&&z(wt1)==='grave'&&lp(1)===8000-1700,JSON.stringify({pend:pendingMustAttack().length,wt1:z(wt1),lp:lp(1)}));
audit('A1');
/* A2: changing it to Defense Position by hand (the rule) destroys it at once */
fresh();
ap=up(AP,0);wt0=up('ワイト',0,'def');gameState.players[0].mz=[ap,wt0];base();
zAct('TOGGLE_POS',0,'mz',idx(ap));drive();
ok('A2: switched to face-up Defense Position — destroyed (sent to the GY)',z(ap)==='grave'&&z(wt0)==='mz',JSON.stringify({ap:z(ap),wt0:z(wt0)}));
audit('A2');
/* A3: Flipped face-up in Defense Position (「表側守備にする」) — destroyed */
fresh();
ap=down(AP,0);gameState.players[0].mz=[ap];base();
doFlipUp(0,'mz',idx(ap),'def');drive();
ok('A3: set card turned face-up in Defense Position — destroyed',z(ap)==='grave',JSON.stringify({ap:z(ap)}));
audit('A3');
/* A4: negative — a face-down Defense Position card is not face-up; another monster in face-up Defense Position stays; face-down it is not forced to attack */
fresh();
ap=down(AP,0);wt0=up('ワイト',0,'def');gameState.players[0].mz=[ap,wt0];base();
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'battle'});drive();
ok('A4: negative — face-down Defense Position: stays, is not forced to attack; the other monster in Defense is unaffected',z(ap)==='mz'&&C(ap).face==='down'&&mustAttackNow(C(ap))===false&&z(wt0)==='mz'&&!pendingMustAttack().length,JSON.stringify({ap:z(ap),pend:pendingMustAttack().length}));
/* A5: negative — on the opponent's turn the clause binds only the card's controller: the list of the player whose turn it is does not hold the card */
fresh();gameState.activePlayer=1;gameState.turn=6;
ap=up(AP,0);gameState.players[0].mz=[ap];gameState.players[1].mz=[up('ワイト',1)];base();
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'battle'});drive();
ok('A5: negative — during the opponent Battle Phase the Ape (mine) is not on the pending list (it only must attack in its controller turn)',z(ap)==='mz'&&!pendingMustAttack().includes(C(ap)),JSON.stringify({pend:pendingMustAttack().length}));
/* A6: an Ape controlled by the opponent after a control change is judged by its current controller — here the opponent's Ape in Attack Position is on the pending list of the opponent turn */
fresh();gameState.activePlayer=1;gameState.turn=6;
ap=up(AP,1);gameState.players[1].mz=[ap];gameState.players[0].mz=[up('ワイト',0)];base();
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'battle'});drive();
ok('A6: the opponent Ape on its own turn is on its controller must-attack list',pendingMustAttack().includes(C(ap)),JSON.stringify({pend:pendingMustAttack().length}));

/* ===== G: 機動砦のギア・ゴーレム — Main Phase 1 only, pay 800 LP: this turn it can attack directly ===== */
/* G1: activated in Main Phase 1 (800 LP paid); it attacks directly although the opponent has a monster; 800 damage */
fresh();
let gg=up(GG,0),fm=up('ワイト',1);gameState.players[0].mz=[gg];gameState.players[1].mz=[fm];base();
ok('G1: legal in Main Phase 1 with 800 or more LP',legalMz(gg).ok===true,JSON.stringify(legalMz(gg)));
ign(gg);
ok('G1: 800 Life Points were paid (cost)',lp(0)===7200,JSON.stringify({lp:lp(0)}));
toPhase('battle');
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(gg),target:'direct'});drive();
ok('G1: it attacked the opponent directly past the monster (800 damage), the monster was not attacked',lp(1)===7200&&z(fm)==='mz',JSON.stringify({lp:[lp(0),lp(1)],fm:z(fm)}));
audit('G1');
/* G2: negative — without the activation it cannot attack directly while the opponent controls a monster */
fresh();
gg=up(GG,0);fm=up('ワイト',1);gameState.players[0].mz=[gg];gameState.players[1].mz=[fm];base();
toPhase('battle');
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(gg),target:'direct'});drive();
ok('G2: negative — no activation: the direct attack is refused (no damage, nothing destroyed)',lp(1)===8000&&lp(0)===8000&&z(fm)==='mz'&&canDirectAttackThroughMonstersV51(C(gg))===false,JSON.stringify({lp:[lp(0),lp(1)]}));
/* G3: negative — not in Main Phase 2, not with less than 800 LP, not on the opponent turn, not face-down */
fresh();
gg=up(GG,0);gameState.players[0].mz=[gg];base();
toPhase('main2');
neg('not legal in Main Phase 2',legalMz(gg).ok===false);
fresh();
gg=up(GG,0);gameState.players[0].mz=[gg];gameState.players[0].lp=700;base();
neg('not legal with 700 Life Points (cannot pay 800)',legalMz(gg).ok===false);
fresh();gameState.activePlayer=1;gameState.turn=6;
gg=up(GG,0);gameState.players[0].mz=[gg];base();
neg('not legal on the opponent turn',legalMz(gg).ok===false);
fresh();
gg=down(GG,0);gameState.players[0].mz=[gg];base();
neg('not legal face-down',legalMz(gg).ok===false);
negDone('G3');
/* G4: only this turn — the permission is gone on the next own turn */
fresh();
gg=up(GG,0);fm=up('ワイト',1);gameState.players[0].mz=[gg];gameState.players[1].mz=[fm];base();
ign(gg);
const g4now=canDirectAttackThroughMonstersV51(C(gg));
nextTurn();nextTurn();
ok('G4: it could attack directly in the activation turn, not in its next turn',g4now===true&&gameState.turn===7&&canDirectAttackThroughMonstersV51(C(gg))===false,JSON.stringify({g4now,turn:gameState.turn}));
/* G5: the permission ends when the card leaves the field (it lives on the card in the zone) */
fresh();
gg=up(GG,0);gameState.players[0].mz=[gg];gameState.players[1].mz=[up('ワイト',1)];base();
ign(gg);
const g5a=grantedDirectAttackV6(C(gg));
API.returnToHand(findCardByUid(gg.uid),'test');
ok('G5: it was granted, and the permission is gone once the card has left the field',g5a===true&&z(gg)==='hand'&&grantedDirectAttackV6(C(gg))===false,JSON.stringify({g5a,z:z(gg)}));

/* ===== M: モロコシーナ — once per turn, Main Phase 2, pay 500 LP: Special Summon 1 つぶコーントークン ===== */
const tokenPosQ=()=>SEEN.filter(x=>x.title.indexOf('特殊召喚する表示形式')>=0);
fresh();
let mr=up(MR,0);gameState.players[0].mz=[mr];base();
toPhase('main2');
ok('M1: legal in Main Phase 2',legalMz(mr).ok===true,JSON.stringify(legalMz(mr)));
ign(mr);
let tk=gameState.players[0].mz.filter(c=>c.token);
ok('M1: 500 Life Points were paid and one つぶコーントークン (Plant / EARTH / Level 1 / 0 ATK / 0 DEF) was Special Summoned to my field',lp(0)===7500&&tk.length===1&&cardName(tk[0])==='つぶコーントークン'&&curATK(tk[0])===0&&curDEF(tk[0])===0&&curLV(tk[0])===1&&currentRaceV17(tk[0])==='植物'&&currentAttributeV17(tk[0])==='地'&&tk[0].face==='up',JSON.stringify({lp:lp(0),n:tk.length,name:tk[0]&&cardName(tk[0])}));
ok('M1: the Token position was asked of the summoning player (the text gives none; the harness answered it)',CH.filter(c=>c.title.indexOf('特殊召喚する表示形式')>=0&&c.player===0).length===1&&tk[0].pos==='def',JSON.stringify(CH));
audit('M1');
/* M1b: the player chooses Attack Position */
fresh();globalThis.__MANUAL_SS_POSITION_S03=true;
mr=up(MR,0);gameState.players[0].mz=[mr];base();
toPhase('main2');
ign(mr,['atk']);
tk=gameState.players[0].mz.filter(c=>c.token);
ok('M1b: choosing Attack Position — the Token is face-up Attack Position',tk.length===1&&tk[0].pos==='atk'&&tokenPosQ().length===1,JSON.stringify({pos:tk[0]&&tk[0].pos,q:tokenPosQ().length}));
audit('M1b');
fresh();globalThis.__MANUAL_SS_POSITION_S03=true;
mr=up(MR,0);gameState.players[0].mz=[mr];base();
toPhase('main2');
ign(mr,['def']);
tk=gameState.players[0].mz.filter(c=>c.token);
ok('M1c: choosing Defense Position — the Token is face-up Defense Position',tk.length===1&&tk[0].pos==='def'&&tk[0].face==='up',JSON.stringify({pos:tk[0]&&tk[0].pos}));
globalThis.__MANUAL_SS_POSITION_S03=false;
/* M2: once per turn */
fresh();
mr=up(MR,0);gameState.players[0].mz=[mr];base();
toPhase('main2');
ign(mr);
ok('M2: negative — a second use in the same turn is not legal (once per turn)',legalMz(mr).ok===false&&lp(0)===7500,JSON.stringify(legalMz(mr)));
/* M3: negatives — Main Phase 1, the opponent turn, less than 500 LP, no free Monster Zone, face-down */
fresh();
mr=up(MR,0);gameState.players[0].mz=[mr];base();
neg('not legal in Main Phase 1',legalMz(mr).ok===false);
fresh();gameState.activePlayer=1;gameState.turn=6;gameState.phase='main2';
mr=up(MR,0);gameState.players[0].mz=[mr];base();
neg('not legal on the opponent turn (even in their Main Phase 2)',legalMz(mr).ok===false);
fresh();gameState.phase='main2';
mr=up(MR,0);gameState.players[0].mz=[mr];gameState.players[0].lp=400;base();
neg('not legal with 400 Life Points',legalMz(mr).ok===false);
fresh();gameState.phase='main2';
mr=up(MR,0);gameState.players[0].mz=[mr,up('ワイト',0),up('ワイト',0),up('ワイト',0),up('ワイト',0)];base();
neg('not legal with all 5 Monster Zones in use',legalMz(mr).ok===false);
fresh();gameState.phase='main2';
mr=down(MR,0);gameState.players[0].mz=[mr];base();
neg('not legal face-down',legalMz(mr).ok===false);
negDone('M3');
/* M4: the once-per-turn limit renews on my next turn */
fresh();
mr=up(MR,0);gameState.players[0].mz=[mr];base();
toPhase('main2');ign(mr);nextTurn();nextTurn();toPhase('main2');
ok('M4: on my next turn it can be used again',gameState.turn===7&&legalMz(mr).ok===true,JSON.stringify({turn:gameState.turn,l:legalMz(mr)}));

/* ===== K: コダロス — send the face-up 「海」 you control to the GY: send up to 2 cards on the opponent's field to the GY (targets chosen at activation) ===== */
/* the activator starts an ignition effect (mz) / casts from the hand; the other player answers in the first chain window with a card at (zone,i) */
function respondTo(startFn,rp,rzone,ri,rprefer){startFn();const wn=toWindow();PREFER=(rprefer||[]).slice();if(wn)duelActivateResponseV2(rp,rzone,ri);drive();PREFER=[];return wn;}
const grN=(p,n)=>gameState.players[p].grave.filter(c=>cardName(c)===n).length;
/* K1: two targets (a monster and the opponent's Field Spell); my own cards are not offered; 「海」 is the cost */
fresh();
let kd=up(KD,0),sea=fieldSp('海',0);
let km1=up('ワイト',1),km2=up('ワイト',1),kst=setT('聖なるバリア －ミラーフォース－',1),kfs=fieldSp('山',1);
const kmine=up('ワイト',0);gameState.players[0].mz=[kd,kmine];gameState.players[0].sz=[setT('聖なるバリア －ミラーフォース－',0)];gameState.players[1].mz=[km1,km2];gameState.players[1].sz=[kst];
base();
ok('K1: legal in Main Phase with a face-up 「海」 and cards on the opponent field',legalMz(kd).ok===true,JSON.stringify(legalMz(kd)));
ign(kd,[km2.uid,kfs.uid]);
let kq=ptitle('コダロス：墓地へ送る');
ok('K1: the targets are chosen at activation among the opponent field cards only (monsters, Set Spell/Trap, Field Zone = 4; 1 to 2)',kq.length===1&&kq[0].player===0&&kq[0].min===1&&kq[0].max===2&&kq[0].n===4,JSON.stringify(kq));
ok('K1: the two chosen cards were sent to the Graveyard, the others stayed; my own cards were not touched',z(km2)==='grave'&&z(kfs)==='grave'&&z(km1)==='mz'&&z(kst)==='sz'&&z(kmine)==='mz'&&gameState.players[0].sz.length===1,JSON.stringify({km2:z(km2),kfs:z(kfs),km1:z(km1),kst:z(kst)}));
ok('K1: the cost: 「海」 was sent to my Graveyard',z(sea)==='grave'&&gameState.players[0].field===null,JSON.stringify({sea:z(sea),f:gameState.players[0].field}));
audit('K1');
/* K2: choosing just one target */
fresh();
kd=up(KD,0);sea=fieldSp('海',0);km1=up('ワイト',1);km2=up('ワイト',1);gameState.players[0].mz=[kd];gameState.players[1].mz=[km1,km2];base();
ign(kd,[km1.uid]);
ok('K2: one target chosen — only that card was sent to the Graveyard',z(km1)==='grave'&&z(km2)==='mz'&&z(sea)==='grave',JSON.stringify({km1:z(km1),km2:z(km2)}));
audit('K2');
/* K3: only one card on the opponent field — it is the single target (the choice allows up to 2 but offers 1) */
fresh();
kd=up(KD,0);sea=fieldSp('海',0);km1=up('ワイト',1);gameState.players[0].mz=[kd];gameState.players[1].mz=[km1];base();
ign(kd);kq=ptitle('コダロス：墓地へ送る');
ok('K3: a lone opponent card is the only candidate and is sent to the Graveyard',kq.length===1&&kq[0].n===1&&z(km1)==='grave',JSON.stringify(kq));
/* K4: negatives — no 「海」; 「海」 face-down; an opponent field without cards; a different Field Spell */
fresh();
kd=up(KD,0);km1=up('ワイト',1);gameState.players[0].mz=[kd];gameState.players[1].mz=[km1];base();
neg('not legal without 「海」',legalMz(kd).ok===false);
fresh();
kd=up(KD,0);sea=mk('海',0,'down');gameState.players[0].field=sea;km1=up('ワイト',1);gameState.players[0].mz=[kd];gameState.players[1].mz=[km1];base();
neg('not legal with a face-down 「海」',legalMz(kd).ok===false);
fresh();
kd=up(KD,0);fieldSp('山',0);km1=up('ワイト',1);gameState.players[0].mz=[kd];gameState.players[1].mz=[km1];base();
neg('not legal with another Field Spell (not 「海」)',legalMz(kd).ok===false);
fresh();
kd=up(KD,0);fieldSp('海',0);gameState.players[0].mz=[kd];base();
neg('not legal when the opponent field has no card',legalMz(kd).ok===false);
fresh();gameState.activePlayer=1;gameState.turn=6;
kd=up(KD,0);fieldSp('海',0);km1=up('ワイト',1);gameState.players[0].mz=[kd];gameState.players[1].mz=[km1];base();
neg('not legal on the opponent turn',legalMz(kd).ok===false);
fresh();
kd=up(KD,0);fieldSp('海',1);km1=up('ワイト',1);gameState.players[0].mz=[kd];gameState.players[1].mz=[km1];base();
neg('not legal when the 「海」 is on the opponent field (not mine)',legalMz(kd).ok===false);
negDone('K4');
/* K5: a target leaves the field in response (サイクロン by the opponent on their own Set Trap): the other target is still sent; the cost stays paid */
fresh();
kd=up(KD,0);sea=fieldSp('海',0);km1=up('ワイト',1);kst=setT('聖なるバリア －ミラーフォース－',1);const cy=setT('サイクロン',1);
gameState.players[0].mz=[kd];gameState.players[1].mz=[km1];gameState.players[1].sz=[kst,cy];base();
const w5=respondTo(()=>{PREFER=[km1.uid,kst.uid];duelActivateFromZone(0,'mz',idx(kd));},1,'sz',idx(cy),[kst.uid]);
ok('K5: the opponent answered with サイクロン on its own Set Trap: both cards are in the Graveyard in the end (the Trap by サイクロン, the monster by コダロス)',w5===true&&z(kst)==='grave'&&z(km1)==='grave'&&z(sea)==='grave',JSON.stringify({w5,kst:z(kst),km1:z(km1),sea:z(sea)}));
ok('K5: コダロス still resolved for the target that remained: the monster was sent (not destroyed), the Trap had been destroyed by サイクロン',C(km1).graveInfo&&C(km1).graveInfo.byDestroy===false&&C(kst).graveInfo&&C(kst).graveInfo.byDestroy===true&&grN(1,'サイクロン')===1,JSON.stringify({km1:C(km1).graveInfo,kst:C(kst).graveInfo}));
audit('K5');

/* ===== V: 地縛神の復活 — discard 1 (cost); add 1 「地縛神」 monster and 1 Field Spell from your GY to your hand (targets chosen at activation) ===== */
const UR='地縛神 Uru',AS='地縛神 Aslla piscu';
const inGrave=(c,p)=>pl(c)===p&&z(c)==='grave';
/* V1: a plain case — hand: the Spell, 2 other cards; GY: 2 「地縛神」 monsters, 2 Field Spells and a normal monster. Cost chosen, targets chosen at activation */
fresh();
let er=mk(ER,0),vc1=mk('ワイト',0),vc2=mk('ワイト',0);
let vu=mk(UR,0),va=mk(AS,0),vy=mk('山',0),vs=mk('海',0),vw=mk('ワイト',0);
gameState.players[0].hand=[er,vc1,vc2];gameState.players[0].grave=[vu,va,vy,vs,vw];base();
ok('V1: legal with a discard and both kinds of target in the GY',legalHand(0,ER).ok===true,JSON.stringify(legalHand(0,ER)));
cast(0,ER,[vc1.uid,va.uid,vs.uid]);
let vq=ptitle('地縛神の復活：捨てる手札');
ok('V1: the cost was chosen among the other hand cards (2 offered, the Spell itself not offered)',vq.length===1&&vq[0].player===0&&vq[0].min===1&&vq[0].max===1&&vq[0].n===2,JSON.stringify(vq));
ok('V1: the monster target was chosen among the 「地縛神」 monsters only (2 offered; the plain monster and the Field Spells not offered)',ptitle('地縛神の復活：手札に加える「地縛神」').length===1&&ptitle('地縛神の復活：手札に加える「地縛神」')[0].n===2,JSON.stringify(ptitle('地縛神の復活')));
ok('V1: the Field Spell target was chosen among the Field Spells (2 offered)',ptitle('地縛神の復活：手札に加えるフィールド魔法').length===1&&ptitle('地縛神の復活：手札に加えるフィールド魔法')[0].n===2,JSON.stringify(ptitle('地縛神の復活')));
ok('V1: the chosen 「地縛神」 monster and Field Spell are in my hand, the others stayed in the GY; the discarded card and the Spell are in the GY',z(va)==='hand'&&z(vs)==='hand'&&inGrave(vu,0)&&inGrave(vy,0)&&inGrave(vw,0)&&inGrave(vc1,0)&&inGrave(er,0)&&z(vc2)==='hand',JSON.stringify({va:z(va),vs:z(vs),vu:z(vu),vy:z(vy),vc1:z(vc1),er:z(er)}));
audit('V1');
/* V2: the discarded card is the Field Spell itself (the GY has none) — it can be chosen as the target; the only legal cost is that card */
fresh();
er=mk(ER,0);vy=mk('山',0);vc1=mk('ワイト',0);vu=mk(UR,0);
gameState.players[0].hand=[er,vy,vc1];gameState.players[0].grave=[vu];base();
ok('V2: legal: discarding the Field Spell supplies the second target',legalHand(0,ER).ok===true,JSON.stringify(legalHand(0,ER)));
cast(0,ER);
vq=ptitle('地縛神の復活：捨てる手札');
ok('V2: only the Field Spell was offered as the cost (the plain monster would leave no Field Spell target)',vq.length===1&&vq[0].n===1,JSON.stringify(vq));
ok('V2: the discarded Field Spell was the target: it is back in my hand together with the 「地縛神」 monster; the Spell and the plain card stayed',z(vy)==='hand'&&z(vu)==='hand'&&inGrave(er,0)&&z(vc1)==='hand',JSON.stringify({vy:z(vy),vu:z(vu),er:z(er),vc1:z(vc1)}));
audit('V2');
/* V3: the discarded card is the 「地縛神」 monster (the GY has only a Field Spell) */
fresh();
er=mk(ER,0);va=mk(AS,0);vc1=mk('ワイト',0);vy=mk('山',0);
gameState.players[0].hand=[er,va,vc1];gameState.players[0].grave=[vy];base();
cast(0,ER);
vq=ptitle('地縛神の復活：捨てる手札');
ok('V3: discarding the 「地縛神」 monster supplies the first target: both are in my hand, only the monster was a legal cost',vq.length===1&&vq[0].n===1&&z(va)==='hand'&&z(vy)==='hand'&&z(vc1)==='hand',JSON.stringify({vq,va:z(va),vy:z(vy)}));
/* V4: negatives */
fresh();
er=mk(ER,0);gameState.players[0].hand=[er,mk('ワイト',0)];gameState.players[0].grave=[mk('山',0)];base();
neg('not legal without a 「地縛神」 monster in the GY (and none to discard)',legalHand(0,ER).ok===false);
fresh();
er=mk(ER,0);gameState.players[0].hand=[er,mk('ワイト',0)];gameState.players[0].grave=[mk(UR,0)];base();
neg('not legal without a Field Spell in the GY (and none to discard)',legalHand(0,ER).ok===false);
fresh();
er=mk(ER,0);gameState.players[0].hand=[er];gameState.players[0].grave=[mk(UR,0),mk('山',0)];base();
neg('not legal without another hand card to discard',legalHand(0,ER).ok===false);
fresh();
er=mk(ER,0);gameState.players[0].hand=[er,mk('ワイト',0)];gameState.players[0].grave=[mk('ワイト',0),mk('山',0)];base();
neg('not legal when the GY monster is not a 「地縛神」',legalHand(0,ER).ok===false);
fresh();
er=mk(ER,0);gameState.players[0].hand=[er,mk('ワイト',0)];gameState.players[0].grave=[mk(UR,0),mk('強欲な壺',0)];base();
neg('not legal when the GY spell is a Normal Spell, not a Field Spell',legalHand(0,ER).ok===false);
fresh();
er=mk(ER,0);gameState.players[0].hand=[er,mk('ワイト',0)];gameState.players[1].grave=[mk(UR,1),mk('山',1)];base();
neg('not legal when only the opponent GY holds the targets (my GY)',legalHand(0,ER).ok===false);
negDone('V4');
/* V5: a target is removed from the GY in response (ロスト by the opponent banishes it): the one that remained is added; nothing is refunded */
fresh();
er=mk(ER,0);vc1=mk('ワイト',0);vu=mk(UR,0);vy=mk('山',0);
const lost=setT('ロスト',1);gameState.players[0].hand=[er,vc1];gameState.players[0].grave=[vu,vy];gameState.players[1].sz=[lost];base();
const w5v=respondTo(()=>{PREFER=[vc1.uid,vu.uid,vy.uid];duelActivateFromHand(0);},1,'sz',0,[vu.uid]);
ok('V5: the opponent banished the 「地縛神」 target from my GY in response — it is not added; the Field Spell target still is',w5v===true&&gameState.players[0].banish.some(c=>c.uid===vu.uid)&&z(vu)==='banish'&&z(vy)==='hand'&&inGrave(vc1,0),JSON.stringify({w5v,vu:z(vu),vy:z(vy),vc1:z(vc1)}));
audit('V5');

/* ===== F: 再機動 — return 1 「機皇」 monster from your hand to the Deck (cost); add 1 「機皇」 card from your GY to your hand (target chosen at activation) ===== */
const W1='機皇兵ワイゼル・アイン',G1='機皇兵グランエル・アイン',SK='機皇帝スキエル∞',KJ='機皇城',KW='機皇廠';
/* F1: the cost is chosen among the 「機皇」 monsters of the hand only; the Deck is shuffled; the target (a Trap) goes to the hand */
fresh();
let rb=mk(RB,0),f1=mk(W1,0),f2=mk(G1,0),fw=mk('ワイト',0),fk=mk(KJ,0);
let fg1=mk(KW,0),fg2=mk('機皇兵スキエル・アイン',0),fg3=mk('ワイト',0);
gameState.players[0].hand=[rb,f1,f2,fw,fk];gameState.players[0].grave=[fg1,fg2,fg3];
const deck0=gameState.players[0].deck.length;base();
const rng0=gameState.rngState;
ok('F1: legal with a 「機皇」 monster in the hand and a 「機皇」 card in the GY',legalHand(0,RB).ok===true,JSON.stringify(legalHand(0,RB)));
cast(0,RB,[f1.uid,fg1.uid]);
let fq=ptitle('再機動：デッキに戻す');
ok('F1: the cost was chosen among the 「機皇」 monsters of the hand (2 offered: not the plain monster, not the 「機皇」 Field Spell)',fq.length===1&&fq[0].player===0&&fq[0].min===1&&fq[0].max===1&&fq[0].n===2,JSON.stringify(fq));
fq=ptitle('再機動：手札に加える');
ok('F1: the target was chosen at activation among the 「機皇」 cards of the GY (2 offered: the Trap and the monster; not the plain monster)',fq.length===1&&fq[0].n===2,JSON.stringify(fq));
ok('F1: the monster went back to the Deck (which was shuffled), the Trap 「機皇廠」 was added to my hand, the other cards stayed',z(f1)==='deck'&&gameState.players[0].deck.length===deck0+1&&gameState.rngState!==rng0&&z(fg1)==='hand'&&inGrave(fg2,0)&&z(f2)==='hand'&&z(rb)==='grave',JSON.stringify({f1:z(f1),deck:gameState.players[0].deck.length,deck0,fg1:z(fg1),fg2:z(fg2),rb:z(rb)}));
audit('F1');
/* F2: a 「機皇」 monster (here the Special Summon-only 機皇帝スキエル∞) is a legal target and goes to the hand; a Field Spell is also a 「機皇」 card */
fresh();
rb=mk(RB,0);f1=mk(W1,0);fg1=mk(SK,0);gameState.players[0].hand=[rb,f1];gameState.players[0].grave=[fg1];base();
cast(0,RB);
ok('F2: the 「機皇」 monster 機皇帝スキエル∞ in the GY was added to the hand, the cost monster is in the Deck',z(fg1)==='hand'&&z(f1)==='deck'&&z(rb)==='grave'&&gameState.players[0].hand.length===1,JSON.stringify({fg1:z(fg1),f1:z(f1),hand:gameState.players[0].hand.length}));
audit('F2');
fresh();
rb=mk(RB,0);f1=mk(W1,0);fg1=mk(KJ,0);gameState.players[0].hand=[rb,f1];gameState.players[0].grave=[fg1];base();
cast(0,RB);
ok('F2b: a 「機皇」 Field Spell in the GY can be the target and is added to the hand',z(fg1)==='hand'&&z(f1)==='deck',JSON.stringify({fg1:z(fg1),f1:z(f1)}));
/* F3: negatives */
fresh();
rb=mk(RB,0);gameState.players[0].hand=[rb,mk('ワイト',0),mk(KJ,0)];gameState.players[0].grave=[mk(KW,0)];base();
neg('not legal without a 「機皇」 monster in the hand (a plain monster and a 「機皇」 Spell do not pay the cost)',legalHand(0,RB).ok===false);
fresh();
rb=mk(RB,0);gameState.players[0].hand=[rb,mk(W1,0)];gameState.players[0].grave=[mk('ワイト',0),mk('強欲な壺',0)];base();
neg('not legal without a 「機皇」 card in the GY',legalHand(0,RB).ok===false);
fresh();
rb=mk(RB,0);gameState.players[0].hand=[rb,mk(W1,0)];gameState.players[1].grave=[mk(KW,1)];base();
neg('not legal when the 「機皇」 card is only in the opponent GY',legalHand(0,RB).ok===false);
fresh();
rb=mk(RB,0);gameState.players[0].hand=[rb];gameState.players[0].grave=[mk(KW,0)];gameState.players[0].mz=[up(W1,0)];base();
neg('not legal when the 「機皇」 monster is on the field, not in the hand',legalHand(0,RB).ok===false);
negDone('F3');
/* F4: the target is banished from the GY in response (ロスト by the opponent): the cost stays paid, nothing is added */
fresh();
rb=mk(RB,0);f1=mk(W1,0);fg1=mk(KW,0);
const lost2=setT('ロスト',1);gameState.players[0].hand=[rb,f1];gameState.players[0].grave=[fg1];gameState.players[1].sz=[lost2];base();
const w4=respondTo(()=>{PREFER=[f1.uid,fg1.uid];duelActivateFromHand(0);},1,'sz',0,[fg1.uid]);
ok('F4: the opponent banished the target from my GY in response — it is not added, the cost (the monster back in the Deck) stays paid',w4===true&&z(fg1)==='banish'&&z(f1)==='deck'&&gameState.players[0].hand.length===0&&z(rb)==='grave',JSON.stringify({w4,fg1:z(fg1),f1:z(f1)}));
audit('F4');
`);
