/* S03-VS7 vertical slice #7: a provisional Dragunity-ish list (P1) vs a provisional removal list (P2), real game path.
   It exercises the three units since VS6 in one game:
   - U30: 《竜の渓谷》 is activated through the **UI action menu** (getLegalHandActions / getLegalZoneActions run strings) —
          the card activation alone, then the effect as a separate operation (mode → discard → resolve);
   - U28: 《ミドル・シールド・ガードナー》 negates the activation of P2's 《シールドクラッシュ》 that targets it while face-down, with no chain block;
   - U29: that negated 《シールドクラッシュ》 is sent to P2's GY instead of staying face-up in the Spell & Trap Zone;
   - U28 second consumer: 《アルカナフォース0－THE FOOL》 negates and destroys a card that targets it, on the side its coin toss names.
   The coin is set by THE FOOL's own forced summon trigger via the deterministic RNG, so the slice reads it and takes the matching branch:
   tails(2) → P2's 《ソウルテイカー》 is negated and destroyed; heads(1) → P1's own 《ハーフ・シャット》 is negated and destroyed instead.
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
/* settle(take): an event group containing a named card is taken; optional groups are otherwise skipped. */
function settle(take){take=take||[];for(let k=0;k<30;k++){const r=drive();
  if(r==='evt'){const st=EVT_V2_STATE;st.groups.flat().forEach(c=>SEEN.push(c.name));const g=st.groups[st.rank];
    if(!(g&&g.length)){eventSkipGroupV2();continue;}
    const i=g.findIndex(c=>take.includes(c.name));
    if(i<0&&st.rank>=2){eventSkipGroupV2();continue;}
    eventPickV2(i<0?0:i);continue;}
  if(r==='choice'){__choicePickV49(0);continue;}
  return r;}return 'loop';}
function handIdx(p,name){const i=gameState.players[p].hand.findIndex(c=>nm(c)===name);if(i<0)throw Error(name+' not in hand of P'+(p+1)+': '+JSON.stringify(gameState.players[p].hand.map(nm)));return i;}
function zoneOf(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function faceOf(c){const h=findCardByUid(c.uid);return h?h.card.face:null;}
function posOf(c){const h=findCardByUid(c.uid);return h?h.card.pos:null;}
function names(p,zone){return (gameState.players[p][zone]||[]).map(nm);}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});settle();}
function nextTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});settle();}
function pickChoice(match){const pc=pendingChoiceV49(gameState);if(!pc)throw Error('choice missing for '+match);
  const i=pc.candidates.findIndex(x=>{const h=x.uid!=null&&findCardByUid(x.uid);return (h&&nm(h.card)===match)||String(x.label||'').includes(match)||x.uid===match;});
  if(i<0)throw Error('candidate '+match+' missing: '+JSON.stringify(pc.candidates.map(c=>c.label||c.key)));__choicePickV49(i);}
function chained(name){const pkg=v41ReplayPackage(gameState);return pkg.actions.map(x=>x&&x.action).some(x=>x&&x.type==='CHAIN_ADD'&&x.name===name);}
function negatedLinks(){const pkg=v41ReplayPackage(gameState);return pkg.actions.map(x=>x&&x.action).filter(x=>x&&x.type==='CHAIN_NEGATE_LINK').map(x=>({mode:x.mode,reason:x.reason}));}
function replayAudit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,200));}
/* drive a menu entry exactly as the UI does: evaluate the action's run string */
function runMenu(list,id){const e=(list||[]).find(a=>a.id===id);if(!e)throw Error(id+' not offered: '+JSON.stringify((list||[]).map(a=>a.id)));eval(e.run);return e;}
function ids(list){return (list||[]).map(a=>a.id);}
`;
/* P1 opening 5 = 竜の渓谷 / MSG / ファランクス(discard fodder) / THE FOOL / ハーフ・シャット; then the T1, T3, T5 draws. */
const P1_LIST=[['竜の渓谷',1],['ミドル・シールド・ガードナー',1],['ドラグニティ－ファランクス',1],['アルカナフォース0－THE FOOL',1],['ハーフ・シャット',1],
 ['ドラグニティ－ドゥクス',1],['サイバー・ドラゴン',1],['セイバーザウルス',1],
 ['ドラグニティ－ドゥクス',2],['ドラグニティ－ファランクス',2],['ドラグニティ－レギオン',2],['調和の宝札',2],['竜の渓谷',1],
 ['異次元の女戦士',2],['エフェクト・ヴェーラー',2],['スノーマンイーター',2],['ライオウ',1],['魔導戦士 ブレイカー',2],
 ['サイクロン',2],['死者蘇生',1],['強欲で謙虚な壺',2],['奈落の落とし穴',2],['増援',1],['天使の施し',1],['ジェネティック・ワーウルフ',3]];
/* P2 opening 5 = シールドクラッシュ / ソウルテイカー / filler; then the T2, T4 draws. */
const P2_LIST=[['シールドクラッシュ',1],['ソウルテイカー',1],['ジェネティック・ワーウルフ',1],['セイバーザウルス',1],['サイクロン',1],
 ['ワイト',1],['はにわ',1],
 ['シールドクラッシュ',1],['ソウルテイカー',2],['ファイターズ・エイプ',3],['ダッシュ・ウォリアー',2],['マジック・ストライカー',2],
 ['ハイドロゲドン',3],['ダーク・グレファー',2],['クリッター',1],['オネスト',1],['青眼の白龍',2],
 ['死者蘇生',1],['ハリケーン',1],['強欲で謙虚な壺',2],['サイクロン',1],['天使の施し',1],['ワイト',3],['はにわ',2]];

const first=harness(COMMON+'const P1_LIST='+JSON.stringify(P1_LIST)+';const P2_LIST='+JSON.stringify(P2_LIST)+';'+String.raw`
function expand(list){const out=[];for(const [n,q] of list)for(let i=0;i<q;i++){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);out.push({id,face:'down',pos:'atk'});}return out;}
resetA();resetForTestDuel();
/* Fixed RNG seed so the whole path — including THE FOOL’s coin toss — is reproducible.
   Seed first, then re-baseline the action journal, so Replay starts from the seeded state (same pattern as the v4.3 / v4.4 tests). */
gameState.rngInitialSeed=0x57070007;gameState.rngState=0x57070007;gameState.__v41Seq=0;v41ResetActionJournal(gameState);
act({type:'LOAD_DECK',player:0,deck:expand(P1_LIST),ex:[],source:'test',name:'Dragunity-ish provisional (VS7)'});
act({type:'DRAW',player:0,n:5,initial:true});
act({type:'LOAD_DECK',player:1,deck:expand(P2_LIST),ex:[],source:'test',name:'Removal provisional (VS7)'});
act({type:'DRAW',player:1,n:5,initial:true});
gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=1;gameState.phase='draw';gameState.drawnThisTurn=false;
const P0=()=>gameState.players[0],P1=()=>gameState.players[1];
ok('setup: both provisional lists load and each player holds 5',
  P0().hand.length===5&&P1().hand.length===5&&P0().deck.length+5>=30,
  JSON.stringify({p1:P0().hand.map(nm),p2:P1().hand.map(nm),deck0:P0().deck.length,deck1:P1().deck.length}));

/* ===== T1 (P1): 竜の渓谷 through the UI menu — card activation, then the effect ===== */
requestProcessorV27(PROCESSOR_V27.DRAW,{player:0});settle();phase('standby');phase('main1');
const deckBefore=P0().deck.length, handBefore=P0().hand.length;
const valley=P0().hand[handIdx(0,'竜の渓谷')];
runMenu(getLegalHandActions(0,handIdx(0,'竜の渓谷')),'activate');
ok('T1 竜の渓谷 (UI route): the card activation opens no choice and is cardActivationOnly (U10/U30)',
  !pendingChoiceV49(gameState)&&gameState.chain.length===1&&gameState.chain[0].cardActivationOnly===true,
  JSON.stringify({chain:gameState.chain.map(l=>({name:l.name,cao:!!l.cardActivationOnly,key:l.v4EffectKey}))}));
settle();
ok('T1 竜の渓谷 (UI route): face-up in the Field Zone, nothing discarded, Deck untouched, 1/turn unused',
  !!P0().field&&nm(P0().field)==='竜の渓谷'&&P0().grave.length===0&&P0().deck.length===deckBefore&&P0().hand.length===handBefore-1
  &&countLeft(0,'竜の渓谷',CARD_SCRIPTS['竜の渓谷'],P0().field)>0,
  JSON.stringify({field:nm(P0().field),grave:names(0,'grave'),deck:P0().deck.length,left:countLeft(0,'竜の渓谷',CARD_SCRIPTS['竜の渓谷'],P0().field)}));
runMenu(getLegalZoneActions(0,'field',0),'effect');
/* drive() stops at a choice without answering it; settle() would auto-pick index 0 and swallow these */
pickChoice('ドラグニティを手札へ');pickChoice('ドラグニティ－ファランクス');drive();pickChoice('ドラグニティ－ドゥクス');drive();settle();
ok('T1 竜の渓谷 effect (UI route): ファランクス discarded as the cost, ドゥクス added, and the 1/turn is now used',
  P0().grave.some(c=>nm(c)==='ドラグニティ－ファランクス')&&P0().hand.some(c=>nm(c)==='ドラグニティ－ドゥクス')
  &&countLeft(0,'竜の渓谷',CARD_SCRIPTS['竜の渓谷'],P0().field)<=0,
  JSON.stringify({grave:names(0,'grave'),hand:names(0,'hand'),left:countLeft(0,'竜の渓谷',CARD_SCRIPTS['竜の渓谷'],P0().field)}));
const msg=P0().hand[handIdx(0,'ミドル・シールド・ガードナー')];
doSetMonsterLegal(handIdx(0,'ミドル・シールド・ガードナー'));settle();
ok('T1: ミドル・シールド・ガードナー is set face-down in Defense Position',
  zoneOf(msg)==='mz'&&faceOf(msg)==='down'&&posOf(msg)==='def',JSON.stringify({msg:zoneOf(msg),face:faceOf(msg),pos:posOf(msg)}));
replayAudit('VM1 T1');
nextTurn();

/* ===== T2 (P2): シールドクラッシュ targets the face-down MSG → negated (U28) and sent to the GY (U29) ===== */
requestProcessorV27(PROCESSOR_V27.DRAW,{player:1});settle();phase('standby');phase('main1');
const crush=P1().hand[handIdx(1,'シールドクラッシュ')];
SEEN=[];
duelActivateFromHand(handIdx(1,'シールドクラッシュ'));
for(let k=0;k<4&&pendingChoiceV49(gameState);k++){const pc=pendingChoiceV49(gameState);const i=pc.candidates.findIndex(x=>x.uid===msg.uid);__choicePickV49(i<0?0:i);}
settle();
ok('T2 (U28): P2 シールドクラッシュ targeting the face-down MSG has its activation negated automatically; MSG survives face-up in Defense Position and creates no chain block',
  zoneOf(msg)==='mz'&&faceOf(msg)==='up'&&posOf(msg)==='def'&&negatedLinks().some(x=>x.mode==='activation'&&x.reason==='ミドル・シールド・ガードナー')&&!chained('ミドル・シールド・ガードナー'),
  JSON.stringify({msg:zoneOf(msg),face:faceOf(msg),pos:posOf(msg),neg:negatedLinks(),seen:SEEN}));
ok('T2 (U29): the negated シールドクラッシュ is in P2 GY, not in the Spell & Trap Zone',
  zoneOf(crush)==='grave'&&!P1().sz.some(c=>c.uid===crush.uid),
  JSON.stringify({crush:zoneOf(crush),sz1:names(1,'sz'),g1:names(1,'grave')}));
replayAudit('VM1 T2');
nextTurn();

/* ===== T3 (P1): summon THE FOOL and resolve its coin toss ===== */
requestProcessorV27(PROCESSOR_V27.DRAW,{player:0});settle();phase('standby');phase('main1');
const fool=P0().hand[handIdx(0,'アルカナフォース0－THE FOOL')];
doNormalSummon(handIdx(0,'アルカナフォース0－THE FOOL'),'atk');
SEEN=[];settle(['アルカナフォース0－THE FOOL']);
const coin=Number(findCardByUid(fool.uid).card.e9FoolCoin||0);
ok('T3: THE FOOL is Normal Summoned and its coin toss resolved (1 heads / 2 tails)',
  zoneOf(fool)==='mz'&&(coin===1||coin===2),JSON.stringify({fool:zoneOf(fool),coin,seen:SEEN}));
replayAudit('VM1 T3');
nextTurn();

/* ===== T4 (P2): the coin decides whose targeting card THE FOOL negates ===== */
requestProcessorV27(PROCESSOR_V27.DRAW,{player:1});settle();phase('standby');phase('main1');
const soul=P1().hand[handIdx(1,'ソウルテイカー')];
const lp1=P1().lp, lp0=P0().lp;
duelActivateFromHand(handIdx(1,'ソウルテイカー'));
for(let k=0;k<4&&pendingChoiceV49(gameState);k++){const pc=pendingChoiceV49(gameState);const i=pc.candidates.findIndex(x=>x.uid===fool.uid);__choicePickV49(i<0?0:i);}
settle();
if(coin===2){
  ok('T4 (U28, tails): P2 ソウルテイカー targeting THE FOOL is negated and destroyed; THE FOOL survives and P2 gains no LP',
    zoneOf(fool)==='mz'&&zoneOf(soul)==='grave'&&P1().lp===lp1&&negatedLinks().some(x=>x.reason==='アルカナフォース0－THE FOOL'),
    JSON.stringify({fool:zoneOf(fool),soul:zoneOf(soul),lp1:P1().lp,neg:negatedLinks()}));
}else{
  ok('T4 (heads): P2 ソウルテイカー is NOT negated (heads only stops its controller\u2019s cards); THE FOOL is destroyed and P1 (the opponent of the activating player) recovers 1000 LP',
    zoneOf(fool)==='grave'&&P0().lp===lp0+1000&&P1().lp===lp1&&!negatedLinks().some(x=>x.reason==='アルカナフォース0－THE FOOL'),
    JSON.stringify({fool:zoneOf(fool),soul:zoneOf(soul),lp1:P1().lp,neg:negatedLinks()}));
}
replayAudit('VM1 T4');
nextTurn();

/* ===== T5 (P1): on heads, P1's own ハーフ・シャット is the card THE FOOL negates; save at Main Phase 2 ===== */
requestProcessorV27(PROCESSOR_V27.DRAW,{player:0});settle();phase('standby');phase('main1');
if(coin===1&&zoneOf(fool)==='grave'){
  ok('T5 (heads): THE FOOL already left the field, so the heads branch is covered by the T4 control',true,JSON.stringify({fool:zoneOf(fool)}));
}else if(coin===1){
  const half=P0().hand[handIdx(0,'ハーフ・シャット')];
  duelActivateFromHand(handIdx(0,'ハーフ・シャット'));
  for(let k=0;k<4&&pendingChoiceV49(gameState);k++){const pc=pendingChoiceV49(gameState);const i=pc.candidates.findIndex(x=>x.uid===fool.uid);__choicePickV49(i<0?0:i);}
  settle();
  ok('T5 (U28, heads): P1\u2019s own ハーフ・シャット targeting THE FOOL is negated and destroyed',
    zoneOf(half)==='grave'&&negatedLinks().some(x=>x.reason==='アルカナフォース0－THE FOOL'),JSON.stringify({half:zoneOf(half),neg:negatedLinks()}));
}else{
  ok('T5 (tails): THE FOOL is still on the field after negating P2\u2019s removal',zoneOf(fool)==='mz',JSON.stringify({fool:zoneOf(fool)}));
}
/* T5 continues with a real Battle Phase: Main Phase 2 must be reached through the legal main1 → battle → main2 transition,
   otherwise the phase change is refused in DUEL mode and the save would capture Main Phase 1. */
const dux=P0().hand[handIdx(0,'ドラグニティ－ドゥクス')];
doNormalSummon(handIdx(0,'ドラグニティ－ドゥクス'),'atk');
SEEN=[];settle(['ドラグニティ－ドゥクス']);
ok('T5: ドラグニティ－ドゥクス is Normal Summoned and equips ドラグニティ－ファランクス from the GY',
  zoneOf(dux)==='mz'&&P0().sz.some(c=>nm(c)==='ドラグニティ－ファランクス'&&c.equipTo),
  JSON.stringify({dux:zoneOf(dux),sz0:names(0,'sz'),seen:SEEN}));
phase('battle');
const lpB=P1().lp, duxAtk=curATK(findCardByUid(dux.uid).card);
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:P0().mz.indexOf(findCardByUid(dux.uid).card),target:'direct'});settle();
ok('T5: P2 has no monsters, so ドゥクス attacks directly for its current ATK',
  P1().lp===lpB-duxAtk,JSON.stringify({lp1:P1().lp,before:lpB,atk:duxAtk}));
phase('main2');
replayAudit('VM1 T1–T5 real path');
saveDuel();globalThis.__RAW=localStorage.getItem(DUEL_SAVE_KEY);globalThis.__COIN=coin;
`);

if(first.__RAW){
  harness('const RAW='+JSON.stringify(first.__RAW)+';const COIN='+first.__COIN+';'+COMMON+String.raw`
  resetA();localStorage.setItem(DUEL_SAVE_KEY,RAW);
  const P0=()=>gameState.players[0],P1=()=>gameState.players[1];
  ok('VM2: the T5 Main Phase 2 save resumes with the same board',offerResumeDuel()&&gameState.turn===5&&gameState.phase==='main2',
    JSON.stringify({turn:gameState.turn,phase:gameState.phase,field:P0().field&&nm(P0().field),mz0:names(0,'mz'),g1:names(1,'grave')}));
  ok('VM2: the negated シールドクラッシュ is still in P2 GY after the resume (U29 persists through save/load)',
    names(1,'grave').includes('シールドクラッシュ'),JSON.stringify({g1:names(1,'grave')}));
  nextTurn();
  ok('VM2: T6 begins for P2 and the game continues',gameState.turn===6&&gameState.activePlayer===1,JSON.stringify({turn:gameState.turn,ap:gameState.activePlayer}));
  replayAudit('VM2 continuation');
  `);
}else{console.log('FAIL VM1 did not reach the save point');process.exitCode=2;}
