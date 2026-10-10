/* S03-VS8 vertical slice #8: a provisional Warrior list (P1) vs a provisional Spellcaster list (P2), real game path.
   It exercises the DUEL units since VS7 in one game:
   - U33 (C-S03-26): at P1's Draw Phase a face-up 無敗将軍 フリード offers its effect instead of the normal draw; P1 takes it and
         searches a Level 4 or lower Warrior; the normal draw is used up; the effect is not offered in the Main Phase;
   - U32 (C-S03-24 extension): P2's ソウルテイカー targeting the face-up 無敗将軍 フリード is negated and destroyed with no chain block;
         カオス・マジシャン negates P1's ADチェンジャー, a monster effect that targets only it;
   - both key monsters arrive through real one-tribute Normal Summons (ADチェンジャー and ワイト are the tributes).
   U31 is MANUAL-only and stays covered by its own test (slices are DUEL games).
   The RNG seed is pinned and the action journal re-baselined before the decks load (VS7's lesson).
   Not user decks and not legality-checked. Decks load in a fixed order, so the path is reproducible.
   Checklist: every card named in this file is TESTED or GENERIC_OK. */
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
let SEEN=[];
/* settle(): skips optional event groups and auto-answers choices with index 0 — never use it while a choice must be answered explicitly */
function settle(){for(let k=0;k<30;k++){const r=drive();
  if(r==='evt'){const st=EVT_V2_STATE;st.groups.flat().forEach(c=>SEEN.push(c.name));const g=st.groups[st.rank];
    if(!(g&&g.length)||st.rank>=2){eventSkipGroupV2();continue;}eventPickV2(0);continue;}
  if(r==='choice'){__choicePickV49(0);continue;}
  return r;}return 'loop';}
function handIdx(p,name){const i=gameState.players[p].hand.findIndex(c=>nm(c)===name);if(i<0)throw Error(name+' not in hand of P'+(p+1)+': '+JSON.stringify(gameState.players[p].hand.map(nm)));return i;}
function zoneOf(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function posOf(c){const h=findCardByUid(c.uid);return h?h.card.pos:null;}
function faceOf(c){const h=findCardByUid(c.uid);return h?h.card.face:null;}
function names(p,zone){return (gameState.players[p][zone]||[]).map(nm);}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});settle();}
function nextTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});settle();}
function title(){const q=pendingChoiceV49(gameState);return q?String(q.title||''):null;}
function labels(){const q=pendingChoiceV49(gameState);return q?q.candidates.map(x=>String(x.label||x.key||'')):[];}
function pickLabel(m){const q=pendingChoiceV49(gameState);if(!q)throw Error('choice missing for '+m);
  const i=q.candidates.findIndex(x=>String(x.label||x.key||'').includes(m)||(x.uid!=null&&findCardByUid(x.uid)&&nm(findCardByUid(x.uid).card)===m));
  if(i<0)throw Error('candidate '+m+' missing: '+JSON.stringify(labels()));__choicePickV49(i);}
function pickUid(uid){const q=pendingChoiceV49(gameState);if(!q)throw Error('choice missing for uid '+uid);
  const i=q.candidates.findIndex(x=>x.uid===uid);if(i<0)throw Error('uid '+uid+' not offered: '+JSON.stringify(labels()));__choicePickV49(i);}
/* a real one-tribute Normal Summon: answer the tribute prompt with the named fodder */
function tributeSummon(p,bossName,fodder){doNormalSummon(handIdx(p,bossName),'atk');
  for(let k=0;k<8;k++){const r=drive();if(r==='choice'&&/リリース/.test(title()||'')){pickUid(fodder.uid);continue;}if(r==='evt'){eventSkipGroupV2();continue;}break;}settle();}
function chained(name){const pkg=v41ReplayPackage(gameState);return pkg.actions.map(x=>x&&x.action).some(x=>x&&x.type==='CHAIN_ADD'&&x.name===name);}
function negatedLinks(){const pkg=v41ReplayPackage(gameState);return pkg.actions.map(x=>x&&x.action).filter(x=>x&&x.type==='CHAIN_NEGATE_LINK').map(x=>({mode:x.mode,reason:x.reason}));}
function replayAudit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,200));}
`;
/* P1 opening 5, then the T1 and T3 draws; T5's draw is replaced by 無敗将軍 フリード. */
const P1_LIST=[['ADチェンジャー',1],['無敗将軍 フリード',1],['サイクロン',1],['死者蘇生',1],['ハリケーン',1],
 ['セイバーザウルス',1],['ファイターズ・エイプ',1],
 ['はにわ',1],['異次元の女戦士',2],['ダッシュ・ウォリアー',2],['マジック・ストライカー',2],['ダーク・グレファー',2],
 ['ジェネティック・ワーウルフ',3],['ハイドロゲドン',3],['オネスト',1],['クリッター',1],['エフェクト・ヴェーラー',2],
 ['強欲で謙虚な壺',2],['天使の施し',1],['増援',1],['はにわ',1]];
/* P2 opening 5, then the T2 and T4 draws. */
const P2_LIST=[['ワイト',1],['カオス・マジシャン',1],['ソウルテイカー',1],['セイバーザウルス',1],['はにわ',1],
 ['ジェネティック・ワーウルフ',1],['ハイドロゲドン',1],
 ['ワイト',2],['セイバーザウルス',2],['はにわ',2],['ハイドロゲドン',2],['ファイターズ・エイプ',3],['クリッター',1],['オネスト',1],
 ['サイクロン',2],['死者蘇生',1],['強欲で謙虚な壺',2],['天使の施し',1],['ハリケーン',1],['青眼の白龍',2],['ジェネティック・ワーウルフ',2],['ダーク・グレファー',2]];

const first=harness(COMMON+'const P1_LIST='+JSON.stringify(P1_LIST)+';const P2_LIST='+JSON.stringify(P2_LIST)+';'+String.raw`
function expand(list){const out=[];for(const [n,q] of list)for(let i=0;i<q;i++){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);out.push({id,face:'down',pos:'atk'});}return out;}
resetA();resetForTestDuel();
/* pinned seed first, then re-baseline the action journal, so Replay starts from the seeded state (v4.3 / v4.4 test pattern) */
gameState.rngInitialSeed=0x58080008;gameState.rngState=0x58080008;gameState.__v41Seq=0;v41ResetActionJournal(gameState);
act({type:'LOAD_DECK',player:0,deck:expand(P1_LIST),ex:[],source:'test',name:'Warrior provisional (VS8)'});
act({type:'DRAW',player:0,n:5,initial:true});
act({type:'LOAD_DECK',player:1,deck:expand(P2_LIST),ex:[],source:'test',name:'Spellcaster provisional (VS8)'});
act({type:'DRAW',player:1,n:5,initial:true});
gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=1;gameState.phase='draw';gameState.drawnThisTurn=false;
const P0=()=>gameState.players[0],P1=()=>gameState.players[1];
ok('setup: both provisional lists load and each player holds 5',P0().hand.length===5&&P1().hand.length===5,
  JSON.stringify({p1:names(0,'hand'),p2:names(1,'hand'),deck0:P0().deck.length,deck1:P1().deck.length}));

/* ===== T1 (P1): normal draw (no replacer yet), Normal Summon ADチェンジャー ===== */
requestProcessorV27(PROCESSOR_V27.DRAW,{player:0});settle();phase('standby');phase('main1');
const adc=P0().hand[handIdx(0,'ADチェンジャー')];
doNormalSummon(handIdx(0,'ADチェンジャー'),'atk');settle();
ok('T1: normal draw to 6, then ADチェンジャー is Normal Summoned',P0().hand.length===5&&zoneOf(adc)==='mz',
  JSON.stringify({hand:names(0,'hand'),mz0:names(0,'mz')}));
replayAudit('VM1 T1');
nextTurn();

/* ===== T2 (P2): Normal Summon ワイト ===== */
requestProcessorV27(PROCESSOR_V27.DRAW,{player:1});settle();phase('standby');phase('main1');
const wight=P1().hand[handIdx(1,'ワイト')];
doNormalSummon(handIdx(1,'ワイト'),'atk');settle();
ok('T2: P2 Normal Summons ワイト',zoneOf(wight)==='mz',JSON.stringify({mz1:names(1,'mz')}));
replayAudit('VM1 T2');
nextTurn();

/* ===== T3 (P1): tribute ADチェンジャー for 無敗将軍 フリード ===== */
requestProcessorV27(PROCESSOR_V27.DRAW,{player:0});settle();phase('standby');phase('main1');
const freed=P0().hand[handIdx(0,'無敗将軍 フリード')];
tributeSummon(0,'無敗将軍 フリード',adc);
ok('T3: 無敗将軍 フリード is Tribute Summoned face-up; ADチェンジャー is in the GY',
  zoneOf(freed)==='mz'&&faceOf(freed)==='up'&&zoneOf(adc)==='grave',JSON.stringify({mz0:names(0,'mz'),g0:names(0,'grave'),toasts:TOASTS.slice(-3)}));
replayAudit('VM1 T3');
nextTurn();

/* ===== T4 (P2): tribute ワイト for カオス・マジシャン; ソウルテイカー targeting フリード is negated (U32) ===== */
requestProcessorV27(PROCESSOR_V27.DRAW,{player:1});settle();phase('standby');phase('main1');
const cm=P1().hand[handIdx(1,'カオス・マジシャン')];
tributeSummon(1,'カオス・マジシャン',wight);
ok('T4: カオス・マジシャン is Tribute Summoned face-up; ワイト is in the GY',
  zoneOf(cm)==='mz'&&faceOf(cm)==='up'&&zoneOf(wight)==='grave',JSON.stringify({mz1:names(1,'mz'),g1:names(1,'grave')}));
const soul=P1().hand[handIdx(1,'ソウルテイカー')];
const lp0=P0().lp;SEEN=[];
duelActivateFromHand(handIdx(1,'ソウルテイカー'));
for(let k=0;k<4&&pendingChoiceV49(gameState);k++)pickUid(freed.uid);
settle();
ok('T4 (U32): P2 ソウルテイカー targeting 無敗将軍 フリード is negated and destroyed with no chain block; フリード survives and P1 gains no LP',
  zoneOf(freed)==='mz'&&zoneOf(soul)==='grave'&&P0().lp===lp0&&negatedLinks().some(x=>x.reason==='無敗将軍 フリード')&&!chained('無敗将軍 フリード'),
  JSON.stringify({freed:zoneOf(freed),soul:zoneOf(soul),lp0:P0().lp,neg:negatedLinks(),seen:SEEN}));
replayAudit('VM1 T4');
nextTurn();

/* ===== T5 (P1): the draw is replaced (U33); ADチェンジャー from the GY is negated by カオス・マジシャン (U32) ===== */
/* a Deck search shuffles the Deck, so "no normal draw" is checked by identity: the card that was on top is still in the Deck,
   and the Deck shrinks by exactly the one searched card */
const handBefore=P0().hand.length, deckBefore=P0().deck.length, topCard=P0().deck[0], topBefore=nm(topCard);
requestProcessorV27(PROCESSOR_V27.DRAW,{player:0});drive();
ok('T5 (U33): at the normal draw P1 is offered 「通常のドローを行う」 or 無敗将軍 フリード\u2019s effect instead',
  /通常のドロー/.test(title()||'')&&labels().some(l=>l.includes('無敗将軍 フリード')),JSON.stringify({title:title(),labels:labels()}));
pickLabel('無敗将軍 フリード');
for(let k=0;k<8;k++){const r=drive();if(r==='choice'&&/手札に加える/.test(title()||'')){pickLabel('異次元の女戦士');continue;}if(r==='evt'){eventSkipGroupV2();continue;}break;}
ok('T5 (U33): 異次元の女戦士 is added instead of drawing — the former top card stays in the Deck, the Deck shrinks by exactly one, and the normal draw is used up',
  P0().hand.length===handBefore+1&&names(0,'hand').includes('異次元の女戦士')&&zoneOf(topCard)==='deck'&&P0().deck.length===deckBefore-1&&gameState.drawnThisTurn===true,
  JSON.stringify({hand:names(0,'hand'),topBefore,topZone:zoneOf(topCard),deck:P0().deck.length,deckBefore,drawn:gameState.drawnThisTurn,toasts:TOASTS.slice(-3)}));
phase('standby');phase('main1');
const freedIdx=P0().mz.findIndex(c=>c.uid===freed.uid);
ok('T5 (U33): in the Main Phase 無敗将軍 フリード offers no search effect',
  !getLegalZoneActions(0,'mz',freedIdx).some(a=>a.id==='effect'),JSON.stringify(getLegalZoneActions(0,'mz',freedIdx).map(a=>a.id)));
replayAudit('VM1 T5 draw replacement');
const adcIdx=P0().grave.findIndex(c=>c.uid===adc.uid);
const cmPos=posOf(cm);
duelActivateFromZone(0,'grave',adcIdx);
for(let k=0;k<4&&pendingChoiceV49(gameState);k++)pickUid(cm.uid);
settle();
ok('T5 (U32): ADチェンジャー targeting only カオス・マジシャン is negated — its position is unchanged and ADチェンジャー was banished as the cost',
  zoneOf(cm)==='mz'&&posOf(cm)===cmPos&&negatedLinks().some(x=>x.reason==='カオス・マジシャン')&&zoneOf(adc)==='banish',
  JSON.stringify({cm:zoneOf(cm),pos:posOf(cm),before:cmPos,adc:zoneOf(adc),neg:negatedLinks(),toasts:TOASTS.slice(-3)}));
phase('battle');phase('main2');
replayAudit('VM1 T1–T5 real path');
saveDuel();globalThis.__RAW=localStorage.getItem(DUEL_SAVE_KEY);
`);

if(first.__RAW){
  harness('const RAW='+JSON.stringify(first.__RAW)+';'+COMMON+String.raw`
  resetA();localStorage.setItem(DUEL_SAVE_KEY,RAW);
  const P0=()=>gameState.players[0],P1=()=>gameState.players[1];
  ok('VM2: the T5 Main Phase 2 save resumes with the same board',offerResumeDuel()&&gameState.turn===5&&gameState.phase==='main2'
    &&names(0,'mz').includes('無敗将軍 フリード')&&names(1,'mz').includes('カオス・マジシャン')&&names(0,'hand').includes('異次元の女戦士'),
    JSON.stringify({turn:gameState.turn,phase:gameState.phase,mz0:names(0,'mz'),mz1:names(1,'mz'),hand0:names(0,'hand')}));
  nextTurn();
  ok('VM2: T6 begins for P2 and the game continues',gameState.turn===6&&gameState.activePlayer===1,JSON.stringify({turn:gameState.turn,ap:gameState.activePlayer}));
  replayAudit('VM2 continuation');
  `);
}else{console.log('FAIL VM1 did not reach the save point');process.exitCode=2;}
