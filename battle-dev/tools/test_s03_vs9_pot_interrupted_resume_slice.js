/* S03-VS9 vertical slice #9: a provisional Warrior list (P1) vs a provisional trap list (P2), real game path.
   It exercises the two units since VS8 in one game:
   - U34 (C-S03-27): 強欲で謙虚な壺 reveals nothing at activation; P2's マジック・ジャマー negates the first copy; the second copy is
         still legal that turn (the negated activation does not count) and reveals/picks the top three at resolution;
         Special Summons are locked after it resolves;
   - U35 (C-S03-28): P1 activates サイクロン against P2's set 奈落の落とし穴 and the duel is saved while the target choice is open;
         the resume in a fresh VM undoes the unfinished activation (サイクロン back in the hand, 奈落 still set) and play continues:
         サイクロン is activated again and destroys 奈落.
   The RNG seed is pinned and the action journal re-baselined before the decks load (VS7's lesson).
   No Deck search or shuffle happens before the second 強欲で謙虚な壺 resolves, so its top three are known from the fixed order.
   Not user decks and not legality-checked.
   Checklist: every card named in this file is TESTED or GENERIC_OK (name-scanned against the U34 baseline). */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function drive(){for(let i=0;i<300;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(EVT_V2_STATE)return 'evt';
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function settle(){for(let k=0;k<30;k++){const r=drive();
  if(r==='evt'){const st=EVT_V2_STATE;const g=st.groups[st.rank];if(!(g&&g.length)||st.rank>=2){eventSkipGroupV2();continue;}eventPickV2(0);continue;}
  if(r==='choice'){__choicePickV49(0);continue;}
  return r;}return 'loop';}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});settle();}
function nextTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});settle();}
function handIdx(p,name){const i=gameState.players[p].hand.findIndex(c=>nm(c)===name);if(i<0)throw Error(name+' not in hand of P'+(p+1)+': '+JSON.stringify(gameState.players[p].hand.map(nm)));return i;}
function names(p,zone){return (gameState.players[p][zone]||[]).map(nm);}
function zoneOf(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function faceOf(c){const h=findCardByUid(c.uid);return h?h.card.face:null;}
function title(){const q=pendingChoiceV49(gameState);return q?String(q.title||''):null;}
function pickUid(uid){const q=pendingChoiceV49(gameState);if(!q)throw Error('choice missing for uid '+uid);
  const i=q.candidates.findIndex(x=>x.uid===uid);if(i<0)throw Error('uid '+uid+' not offered: '+JSON.stringify(q.candidates.map(x=>x.label||x.key)));__choicePickV49(i);}
function replayAudit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,200));}
function expand(list){const out=[];for(const [n,q] of list)for(let i=0;i<q;i++){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);out.push({id,face:'down',pos:'atk'});}return out;}
`;
/* P1 opening 5, then the T1 draw (ワイト) and the T3 draw (はにわ); the second 強欲で謙虚な壺 then reveals オネスト, クリッター, 異次元の女戦士. */
const P1_LIST=[['強欲で謙虚な壺',2],['サイクロン',1],['マジック・ストライカー',1],['ダッシュ・ウォリアー',1],
 ['ワイト',1],['はにわ',1],['オネスト',1],['クリッター',1],['異次元の女戦士',1],
 ['ダーク・グレファー',2],['ジェネティック・ワーウルフ',2],['ハイドロゲドン',2],['エフェクト・ヴェーラー',2],['死者蘇生',1],['ハリケーン',1],['増援',1],['天使の施し',1]];
/* P2 opening 5 (two traps to set, a monster, two discard fodder), then the T2 draw. */
const P2_LIST=[['マジック・ジャマー',1],['奈落の落とし穴',1],['ワイト',1],['はにわ',2],
 ['セイバーザウルス',1],
 ['ワイト',2],['セイバーザウルス',2],['ハイドロゲドン',2],['ファイターズ・エイプ',3],['クリッター',1],['オネスト',1],['サイクロン',2],['死者蘇生',1],['天使の施し',1],['ジェネティック・ワーウルフ',2]];

const first=harness(COMMON+'const P1_LIST='+JSON.stringify(P1_LIST)+';const P2_LIST='+JSON.stringify(P2_LIST)+';'+String.raw`
resetA();resetForTestDuel();
gameState.rngInitialSeed=0x59090009;gameState.rngState=0x59090009;gameState.__v41Seq=0;v41ResetActionJournal(gameState);
act({type:'LOAD_DECK',player:0,deck:expand(P1_LIST),ex:[],source:'test',name:'Warrior provisional (VS9)'});
act({type:'DRAW',player:0,n:5,initial:true});
act({type:'LOAD_DECK',player:1,deck:expand(P2_LIST),ex:[],source:'test',name:'Trap provisional (VS9)'});
act({type:'DRAW',player:1,n:5,initial:true});
gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=1;gameState.phase='draw';gameState.drawnThisTurn=false;
const P0=()=>gameState.players[0],P1=()=>gameState.players[1];
ok('setup: both provisional lists load and each player holds 5',P0().hand.length===5&&P1().hand.length===5,
  JSON.stringify({p1:names(0,'hand'),p2:names(1,'hand')}));

/* ===== T1 (P1): draw, Normal Summon マジック・ストライカー ===== */
requestProcessorV27(PROCESSOR_V27.DRAW,{player:0});settle();phase('standby');phase('main1');
const striker=P0().hand[handIdx(0,'マジック・ストライカー')];
doNormalSummon(handIdx(0,'マジック・ストライカー'),'atk');settle();
ok('T1: ワイト drawn; マジック・ストライカー is Normal Summoned',names(0,'hand').includes('ワイト')&&zoneOf(striker)==='mz',JSON.stringify({hand:names(0,'hand'),mz0:names(0,'mz')}));
replayAudit('VM1 T1');
nextTurn();

/* ===== T2 (P2): draw, set マジック・ジャマー and 奈落の落とし穴, Normal Summon ワイト ===== */
requestProcessorV27(PROCESSOR_V27.DRAW,{player:1});settle();phase('standby');phase('main1');
const jammer=P1().hand[handIdx(1,'マジック・ジャマー')], pit=P1().hand[handIdx(1,'奈落の落とし穴')];
act({type:'MOVE',player:1,from:'hand',fromIndex:handIdx(1,'マジック・ジャマー'),to:'sz',face:'down'});
act({type:'MOVE',player:1,from:'hand',fromIndex:handIdx(1,'奈落の落とし穴'),to:'sz',face:'down'});
const wight=P1().hand[handIdx(1,'ワイト')];
doNormalSummon(handIdx(1,'ワイト'),'atk');settle();
ok('T2: P2 sets two cards and Normal Summons ワイト',zoneOf(jammer)==='sz'&&faceOf(jammer)==='down'&&zoneOf(pit)==='sz'&&faceOf(pit)==='down'&&zoneOf(wight)==='mz',
  JSON.stringify({sz1:(P1().sz||[]).map(c=>nm(c)+'/'+c.face),mz1:names(1,'mz')}));
replayAudit('VM1 T2');
nextTurn();

/* ===== T3 (P1): U34 — first 強欲で謙虚な壺 negated by マジック・ジャマー, the second resolves ===== */
requestProcessorV27(PROCESSOR_V27.DRAW,{player:0});settle();phase('standby');phase('main1');
const pots=P0().hand.filter(c=>nm(c)==='強欲で謙虚な壺');
const deckTop3=P0().deck.slice(0,3).map(nm);
duelActivateFromHand(P0().hand.findIndex(c=>c.uid===pots[0].uid));
ok('T3 (U34): activating 強欲で謙虚な壺 reveals and picks nothing; P2 holds priority',
  !pendingChoiceV49(gameState)&&gameState.chain.length===1&&!!gameState.chainWindow&&gameState.chainWindow.priority===1,
  JSON.stringify({pending:title(),chain:gameState.chain.map(l=>l.name),win:gameState.chainWindow}));
const respJ=getChainResponsesV2(1).map(x=>x.db.n);
if(respJ.includes('マジック・ジャマー'))duelActivateResponseV2(1,'sz',P1().sz.findIndex(c=>c.uid===jammer.uid));
for(let k=0;k<6;k++){const r=drive();if(r==='choice'&&/捨てる/.test(title()||'')){__choicePickV49(0);continue;}break;}
ok('T3 (U34): マジック・ジャマー negates the first 強欲で謙虚な壺; no choice, nothing added, P1 may still Special Summon',
  zoneOf(pots[0])==='grave'&&zoneOf(jammer)==='grave'&&!pendingChoiceV49(gameState)&&!v46GlobalSpecialSummonRestrictionReason(0),
  JSON.stringify({pot:zoneOf(pots[0]),jammer:zoneOf(jammer),ss:v46GlobalSpecialSummonRestrictionReason(0),hand:names(0,'hand')}));
const i2=P0().hand.findIndex(c=>c.uid===pots[1].uid);
duelActivateFromHand(i2);drive();
const cand=(pendingChoiceV49(gameState)||{candidates:[]}).candidates.map(x=>{const h=findCardByUid(x.uid);return h?nm(h.card):null;});
ok('T3 (U34): the second copy is legal the same turn and offers exactly the top three at resolution',
  /強欲で謙虚な壺/.test(title()||'')&&JSON.stringify(cand.slice().sort())===JSON.stringify(deckTop3.slice().sort()),
  JSON.stringify({title:title(),cand,deckTop3,toasts:TOASTS.slice(-3)}));
const pickName=deckTop3.includes('異次元の女戦士')?'異次元の女戦士':deckTop3[0];
const q=pendingChoiceV49(gameState);if(q){const k=q.candidates.findIndex(x=>{const h=findCardByUid(x.uid);return h&&nm(h.card)===pickName;});__choicePickV49(k<0?0:k);}
drive();
ok('T3 (U34): the chosen card is added and Special Summons are locked for the turn',
  names(0,'hand').includes(pickName)&&zoneOf(pots[1])==='grave'&&!!v46GlobalSpecialSummonRestrictionReason(0),
  JSON.stringify({hand:names(0,'hand'),pot:zoneOf(pots[1]),ss:v46GlobalSpecialSummonRestrictionReason(0)}));
replayAudit('VM1 T3 pots');

/* ===== T3 (P1): U35 — サイクロン against 奈落, saved while the target choice is open ===== */
const cyc=P0().hand[handIdx(0,'サイクロン')];
duelActivateFromHand(handIdx(0,'サイクロン'));
ok('T3 (U35): サイクロン is waiting for its target, with the activation marker on the choice',
  !!pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).legacy===true&&!!pendingChoiceV49(gameState).meta.activationPrepS03&&zoneOf(cyc)==='sz',
  JSON.stringify({title:title(),cyc:zoneOf(cyc)}));
saveDuel();globalThis.__RAW=localStorage.getItem(DUEL_SAVE_KEY);
globalThis.__U={cyc:cyc.uid,pit:pit.uid,striker:striker.uid,wight:wight.uid,pickName};
`);

if(first.__RAW){
  const second=harness('const RAW='+JSON.stringify(first.__RAW)+';const U='+JSON.stringify(first.__U)+';'+COMMON+String.raw`
  resetA();localStorage.setItem(DUEL_SAVE_KEY,RAW);
  const P0=()=>gameState.players[0],P1=()=>gameState.players[1];
  const r=offerResumeDuel();
  const cyc=findCardByUid(U.cyc), pit=findCardByUid(U.pit);
  ok('VM2 (U35): the resume undoes the unfinished サイクロン — back in the hand, 奈落の落とし穴 still set, no choice, no chain',
    r&&TOASTS.some(t=>/発動を取り消し/.test(t))&&cyc&&cyc.zone==='hand'&&pit&&pit.zone==='sz'&&pit.card.face==='down'&&!pendingChoiceV49(gameState)&&gameState.chain.length===0
    &&gameState.turn===3&&gameState.phase==='main1'&&names(0,'hand').includes(U.pickName),
    JSON.stringify({r,toasts:TOASTS,cyc:cyc&&cyc.zone,pit:pit&&(pit.zone+'/'+pit.card.face),turn:gameState.turn,phase:gameState.phase,hand:names(0,'hand')}));
  replayAudit('VM2 after resume');
  duelActivateFromHand(P0().hand.findIndex(c=>c.uid===U.cyc));pickUid(U.pit);settle();
  ok('VM2: サイクロン is activated again and destroys 奈落の落とし穴',(findCardByUid(U.pit)||{}).zone==='grave'&&(findCardByUid(U.cyc)||{}).zone==='grave',
    JSON.stringify({pit:(findCardByUid(U.pit)||{}).zone,cyc:(findCardByUid(U.cyc)||{}).zone}));
  phase('battle');
  const si=P0().mz.findIndex(c=>c.uid===U.striker), wi=P1().mz.findIndex(c=>c.uid===U.wight);
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:si,target:wi});settle();
  ok('VM2: マジック・ストライカー attacks ワイト and the battle resolves',(findCardByUid(U.wight)||{}).zone==='grave'||P1().lp<8000,
    JSON.stringify({wight:(findCardByUid(U.wight)||{}).zone,lp1:P1().lp,toasts:TOASTS.slice(-3)}));
  phase('main2');
  replayAudit('VM2 T3 continued');
  saveDuel();globalThis.__RAW2=localStorage.getItem(DUEL_SAVE_KEY);
  `);
  if(second.__RAW2){
    harness('const RAW='+JSON.stringify(second.__RAW2)+';'+COMMON+String.raw`
    resetA();localStorage.setItem(DUEL_SAVE_KEY,RAW);
    ok('VM3: the T3 Main Phase 2 save resumes',offerResumeDuel()&&gameState.turn===3&&gameState.phase==='main2',JSON.stringify({turn:gameState.turn,phase:gameState.phase}));
    nextTurn();
    ok('VM3: T4 begins for P2',gameState.turn===4&&gameState.activePlayer===1,JSON.stringify({turn:gameState.turn,ap:gameState.activePlayer}));
    replayAudit('VM3 continuation');
    `);
  }else{console.log('FAIL VM2 did not reach its save point');process.exitCode=2;}
}else{console.log('FAIL VM1 did not reach the save point');process.exitCode=2;}
