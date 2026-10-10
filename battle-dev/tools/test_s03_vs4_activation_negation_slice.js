/* S03-VS4 vertical slice #4: a provisional 真六武衆 list with monster and counter-trap negators (P1) vs the 1103兎ラギア sample (P2), real game path.
   It exercises the three units since VS3 in one game:
   - U17: マジック・ストライカー's chain-less hand procedure;
   - U18: マジック・ジャマー answering a Spell activation;
   - U19: ネイビィロイド answering サイクロン that targets P1's set card (target decode).
   Not a user deck and not legality-checked. Decks are loaded in a fixed order: the arranged top cards come first, so the path is reproducible.
   Checklist: every card named in this file is TESTED or GENERIC_OK (the 兎ラギア list is built at runtime; only its arranged top cards are named).
   T1: 増援 → Normal Summon ネイビィロイド → set 奈落の落とし穴 and マジック・ジャマー.
   T2: P2 サイクロン targets the set 奈落 → ネイビィロイド (discarding 紫炎の足軽) negates it → レスキューラビット Special Summons two セイバーザウルス → 奈落 banishes them.
   T3: マジック・ストライカー procedure (banishing 増援) → two direct attacks → save.
   VM2: resume → T4 P2 死者蘇生 targets 紫炎の足軽 → マジック・ジャマー (discarding カゲキ) negates it. */
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
function settle(){for(let k=0;k<16;k++){const r=drive();if(r==='evt'){if(EVT_V2_STATE.rank>=2)eventSkipGroupV2();else eventPickV2(0);continue;}return r;}return 'loop';}
function labels(){const pc=pendingChoiceV49(gameState);return pc?pc.candidates.map(x=>String(x.label||'')):[];}
function pick(match){const pc=pendingChoiceV49(gameState);if(!pc)throw Error('choice missing for '+match+' toasts='+JSON.stringify(TOASTS.slice(-3)));
  const i=pc.candidates.findIndex(x=>{const h=x.uid!=null&&findCardByUid(x.uid);return x.uid===match||String(x.value||'')===match||(h&&nm(h.card)===match)||String(x.label||'').includes(match);});
  if(i<0)throw Error('candidate '+match+' missing in '+pc.title+': '+JSON.stringify(labels()));__choicePickV49(i);}
function offered(name){const st=EVT_V2_STATE;return !!st&&st.groups.flat().some(c=>c.name===name);}
function answerEvent(name){const st=EVT_V2_STATE;if(!st)return false;const g=st.groups[st.rank];const i=name?g.findIndex(c=>c.name===name):-1;if(i>=0){eventPickV2(i);return true;}if(st.rank>=2){eventSkipGroupV2();return false;}eventPickV2(0);return false;}
function handIdx(p,name){const i=gameState.players[p].hand.findIndex(c=>nm(c)===name);if(i<0)throw Error(name+' not in hand of P'+(p+1)+': '+JSON.stringify(gameState.players[p].hand.map(nm)));return i;}
function zoneIdx(p,zone,name){const i=(gameState.players[p][zone]||[]).findIndex(c=>c&&nm(c)===name);if(i<0)throw Error(name+' not in '+zone+' of P'+(p+1));return i;}
function mz(p,name){return gameState.players[p].mz.find(c=>nm(c)===name);}
function mzNames(p){return gameState.players[p].mz.map(nm);}
function szCard(p,name){return gameState.players[p].sz.find(c=>nm(c)===name);}
function names(p,zone){return (gameState.players[p][zone]||[]).map(nm);}
function responses(p){return getChainResponsesV2(p).map(x=>x.db.n);}
function chainNames(){return gameState.chain.map(l=>l.name);}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});settle();}
function nextTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});settle();}
function replayAudit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,300));}
`;
const P1_FRONT=['ネイビィロイド','奈落の落とし穴','マジック・ジャマー','増援','マジック・ストライカー','紫炎の足軽'];
const P1_LIST=[['真六武衆－カゲキ',3],['六武衆－ザンジ',2],['真六武衆－キザン',3],['真六武衆－ミズホ',2],['真六武衆－エニシ',2],['六武衆の露払い',2],['六武衆の師範',2],['紫炎の足軽',3],['六武衆－ヤイチ',1],['六武衆のご隠居',2],
 ['ネイビィロイド',1],['マジック・ストライカー',1],
 ['紫炎の狼煙',3],['紫炎の計略',1],['六武衆の結束',1],['増援',1],['死者蘇生',1],['奈落の落とし穴',2],['強制脱出装置',1],['エフェクト・ヴェーラー',2],['昇天の角笛',1],['マジック・ジャマー',1],['サイクロン',2]];
const RABBIT_FRONT=['サイクロン','レスキューラビット','死者蘇生','セイバーザウルス','エフェクト・ヴェーラー','ジェネティック・ワーウルフ'];

const first=harness(COMMON+'const P1_FRONT='+JSON.stringify(P1_FRONT)+';const P1_LIST='+JSON.stringify(P1_LIST)+';const RABBIT_FRONT='+JSON.stringify(RABBIT_FRONT)+';'+String.raw`
function arranged(list,front){const rest=[];for(const [n,q] of list)for(let i=0;i<q;i++){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);rest.push({id,face:'down',pos:'atk'});}
  const top=[];for(const n of front){const i=rest.findIndex(c=>CARD_DB[c.id].n===n);if(i<0)throw Error('front card not in list '+n);top.push(rest.splice(i,1)[0]);}return top.concat(rest);}
function arrangeRabbit(){const rab=buildTestDeck('rabbit');const rest=rab.main.map(c=>({id:c.id,face:'down',pos:'atk'}));const top=[];for(const n of RABBIT_FRONT){const i=rest.findIndex(c=>CARD_DB[c.id].n===n);if(i<0)throw Error('rabbit front card missing '+n);top.push(rest.splice(i,1)[0]);}return {main:top.concat(rest),ex:rab.ex.map(c=>({id:c.id,face:'down',pos:'atk'}))};}
resetA();resetForTestDuel();gameState.rngInitialSeed=1395762661;gameState.rngState=1395762661;v41ResetActionJournal(gameState);/* S03-U151: fixed RNG seed (was Date.now()) */
const a=arranged(P1_LIST,P1_FRONT),r=arrangeRabbit();
act({type:'LOAD_DECK',player:0,deck:a,ex:[],source:'test',name:'真六武衆 + negators provisional (VS4)'});act({type:'DRAW',player:0,n:5,initial:true});
act({type:'LOAD_DECK',player:1,deck:r.main,ex:r.ex,source:'opponentSample',name:RABBIT_LAGGIA_DECK.name});act({type:'DRAW',player:1,n:5,initial:true});
gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=1;gameState.phase='draw';gameState.drawnThisTurn=false;
const P0=()=>gameState.players[0],P1=()=>gameState.players[1];
ok('setup: 40-card list and the 兎ラギア sample; arranged opening hands',P0().deck.length+P0().hand.length===40&&P0().hand.length===5&&P1().hand.length===5&&P1().hand.some(c=>nm(c)==='サイクロン')&&P1().hand.some(c=>nm(c)==='死者蘇生'),JSON.stringify({total:P0().deck.length+P0().hand.length,h0:P0().hand.map(nm),h1:P1().hand.map(nm)}));

/* ===== T1 (P1) ===== */
requestProcessorV27(PROCESSOR_V27.DRAW,{player:0});settle();phase('standby');phase('main1');
ok('T1: draw to 6 (ネイビィロイド … 紫炎の足軽), Main Phase 1',P0().hand.length===6&&gameState.phase==='main1'&&P0().hand.some(c=>nm(c)==='紫炎の足軽'),JSON.stringify(P0().hand.map(nm)));
duelActivateFromHand(handIdx(0,'増援'));
for(let k=0;k<6;k++){const r=drive();if(r==='choice'){pick('真六武衆－カゲキ');continue;}if(r==='evt'){answerEvent(null);continue;}break;}
ok('T1 増援: adds 真六武衆－カゲキ and goes to the GY',P0().hand.some(c=>nm(c)==='真六武衆－カゲキ')&&P0().grave.some(c=>nm(c)==='増援'),JSON.stringify({hand:P0().hand.map(nm),grave:names(0,'grave'),toasts:TOASTS.slice(-3)}));
doNormalSummon(handIdx(0,'ネイビィロイド'),'atk');settle();
doSetST(handIdx(0,'奈落の落とし穴'),false);settle();
doSetST(handIdx(0,'マジック・ジャマー'),false);settle();
ok('T1: ネイビィロイド is summoned; 奈落の落とし穴 and マジック・ジャマー are set; 3 cards stay in the hand',!!mz(0,'ネイビィロイド')&&szCard(0,'奈落の落とし穴').face==='down'&&szCard(0,'マジック・ジャマー').face==='down'&&P0().hand.length===3,JSON.stringify({mz:mzNames(0),sz:P0().sz.map(c=>nm(c)+':'+c.face),hand:P0().hand.map(nm)}));
nextTurn();
ok('T1 → T2: P2 turn',gameState.turn===2&&gameState.activePlayer===1);

/* ===== T2 (P2) ===== */
requestProcessorV27(PROCESSOR_V27.DRAW,{player:1});settle();phase('standby');phase('main1');
const bottomless=szCard(0,'奈落の落とし穴');
duelActivateFromHand(handIdx(1,'サイクロン'));
if(pendingChoiceV49(gameState))pick(bottomless.uid);
ok('T2: P2 activates サイクロン targeting P1’s set 奈落; P1’s responses list ネイビィロイド (a S/T-destroying card targeting its own S/T) and マジック・ジャマー (a Spell)',
  chainNames().join()==='サイクロン'&&responses(0).includes('ネイビィロイド')&&responses(0).includes('マジック・ジャマー'),JSON.stringify({chain:chainNames(),resp:responses(0),toasts:TOASTS.slice(-3)}));
duelActivateResponseV2(0,'mz',zoneIdx(0,'mz','ネイビィロイド'));
if(pendingChoiceV49(gameState))pick('紫炎の足軽');
ok('T2: ネイビィロイド is chained after discarding 紫炎の足軽',chainNames().join()==='サイクロン,ネイビィロイド'&&P0().grave.some(c=>nm(c)==='紫炎の足軽'),JSON.stringify({chain:chainNames(),grave:names(0,'grave'),toasts:TOASTS.slice(-3)}));
settle();
ok('T2: サイクロン is negated and destroyed; 奈落 and マジック・ジャマー stay set',P1().grave.some(c=>nm(c)==='サイクロン')&&P0().sz.includes(bottomless)&&!!szCard(0,'マジック・ジャマー')&&!gameState.chain.length,JSON.stringify({sz0:P0().sz.map(nm),g1:names(1,'grave')}));
doNormalSummon(handIdx(1,'レスキューラビット'),'atk');
ok('T2: 奈落 is not offered for the 300-ATK Normal Summon of レスキューラビット',!offered('奈落の落とし穴')&&!!mz(1,'レスキューラビット'),JSON.stringify({mz1:mzNames(1),pending:gameState.pendingSummon}));
for(let k=0;k<4&&drive()==='evt';k++)answerEvent(null);
duelActivateFromZone(1,'mz',zoneIdx(1,'mz','レスキューラビット'));
let bottomlessOffered=false;
for(let k=0;k<10;k++){const r=drive();
  if(r==='choice'){pick('セイバーザウルス');continue;}
  if(r==='evt'){if(offered('奈落の落とし穴'))bottomlessOffered=true;answerEvent('奈落の落とし穴');continue;}
  break;}
ok('T2: レスキューラビット Special Summons two セイバーザウルス; P1’s 奈落 is offered and banishes both',
  bottomlessOffered&&P1().banish.some(c=>nm(c)==='レスキューラビット')&&P1().banish.filter(c=>nm(c)==='セイバーザウルス').length===2&&P1().mz.length===0&&P0().grave.some(c=>nm(c)==='奈落の落とし穴'),
  JSON.stringify({offered:bottomlessOffered,mz1:mzNames(1),ban1:names(1,'banish'),g0:names(0,'grave'),toasts:TOASTS.slice(-3)}));
nextTurn();
ok('T2 → T3: P1 turn',gameState.turn===3&&gameState.activePlayer===0);

/* ===== T3 (P1) ===== */
requestProcessorV27(PROCESSOR_V27.DRAW,{player:0});settle();phase('standby');phase('main1');
const msIdx=handIdx(0,'マジック・ストライカー');
ok('T3: マジック・ストライカー offers its Special Summon procedure (増援 is in the GY)',getLegalHandActions(0,msIdx).some(x=>x.id==='specialSummonProcedure'),JSON.stringify(getLegalHandActions(0,msIdx).map(x=>x.id)));
runSummonProcedure('マジック・ストライカー',0,'hand',msIdx);
if(!gameState.pendingSummon&&!pendingChoiceV49(gameState)&&!mz(0,'マジック・ストライカー'))finishSummonProcedure('マジック・ストライカー',0,'hand',msIdx,'atk');
for(let k=0;k<6;k++){const r=drive();if(r==='choice'){const pc=pendingChoiceV49(gameState);if(labels().some(l=>l.includes('増援')))pick('増援');else{const i=pc.candidates.findIndex(x=>/攻撃/.test(String(x.label||'')));__choicePickV49(i<0?0:i);}continue;}if(r==='evt'){answerEvent(null);continue;}break;}
ok('T3: マジック・ストライカー is Special Summoned by banishing 増援, with no chain link',!!mz(0,'マジック・ストライカー')&&P0().banish.some(c=>nm(c)==='増援')&&!gameState.chain.length&&!gameState.pendingSummon,JSON.stringify({mz:mzNames(0),ban:names(0,'banish'),pending:gameState.pendingSummon,toasts:TOASTS.slice(-3)}));
phase('battle');
const lp0=P1().lp;
for(const name of ['ネイビィロイド','マジック・ストライカー']){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:zoneIdx(0,'mz',name),target:'direct'});settle();}
ok('T3: two direct attacks, ネイビィロイド 1000 + マジック・ストライカー 600, take P2 to 6400',lp0===8000&&P1().lp===6400,JSON.stringify({lp0,lp:P1().lp}));
phase('main2');
ok('T3: Main Phase 2 reached',gameState.phase==='main2');
replayAudit('VM1 T1–T3 real path');
saveDuel();globalThis.__RAW=localStorage.getItem(DUEL_SAVE_KEY);
`);

if(first.__RAW){
  harness('const RAW='+JSON.stringify(first.__RAW)+';'+COMMON+String.raw`
  resetA();localStorage.setItem(DUEL_SAVE_KEY,RAW);
  const P0=()=>gameState.players[0],P1=()=>gameState.players[1];
  ok('VM2: the T3 Main Phase 2 save resumes',offerResumeDuel()&&gameState.turn===3&&gameState.phase==='main2'&&!!mz(0,'マジック・ストライカー'));
  nextTurn();
  ok('VM2: T4 begins for P2',gameState.turn===4&&gameState.activePlayer===1);
  requestProcessorV27(PROCESSOR_V27.DRAW,{player:1});settle();phase('standby');phase('main1');
  const foot=P0().grave.find(c=>nm(c)==='紫炎の足軽');
  duelActivateFromHand(handIdx(1,'死者蘇生'));
  if(pendingChoiceV49(gameState))pick(foot.uid);
  ok('VM2 T4: P2 activates 死者蘇生 targeting 紫炎の足軽 in P1’s GY; P1’s responses list マジック・ジャマー',chainNames().join()==='死者蘇生'&&responses(0).includes('マジック・ジャマー'),JSON.stringify({chain:chainNames(),resp:responses(0),toasts:TOASTS.slice(-3)}));
  duelActivateResponseV2(0,'sz',zoneIdx(0,'sz','マジック・ジャマー'));
  if(pendingChoiceV49(gameState))pick('真六武衆－カゲキ');
  ok('VM2 T4: マジック・ジャマー is chained after discarding 真六武衆－カゲキ',chainNames().join()==='死者蘇生,マジック・ジャマー'&&P0().grave.some(c=>nm(c)==='真六武衆－カゲキ'),JSON.stringify({chain:chainNames(),g0:names(0,'grave'),toasts:TOASTS.slice(-3)}));
  settle();
  ok('VM2 T4: 死者蘇生 is negated and destroyed; 紫炎の足軽 stays in P1’s GY and P2 summons nothing',
    P1().grave.some(c=>nm(c)==='死者蘇生')&&P0().grave.includes(foot)&&P1().mz.length===0&&P0().grave.some(c=>nm(c)==='マジック・ジャマー')&&!gameState.chain.length,
    JSON.stringify({g0:names(0,'grave'),g1:names(1,'grave'),mz1:mzNames(1),toasts:TOASTS.slice(-3)}));
  doNormalSummon(handIdx(1,'ジェネティック・ワーウルフ'),'atk');settle();
  ok('VM2 T4: P2 Normal Summons ジェネティック・ワーウルフ (P1 has no set cards left, so no summon window)',!!mz(1,'ジェネティック・ワーウルフ')&&!gameState.pendingSummon,JSON.stringify({mz1:mzNames(1),pending:gameState.pendingSummon}));
  phase('battle');
  const lpP1=P0().lp;
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:zoneIdx(1,'mz','ジェネティック・ワーウルフ'),target:zoneIdx(0,'mz','マジック・ストライカー')});settle();
  ok('VM2 T4: ジェネティック・ワーウルフ (2000) destroys マジック・ストライカー (600); by its text ③ P1 takes no battle damage',
    P0().grave.some(c=>nm(c)==='マジック・ストライカー')&&!mz(0,'マジック・ストライカー')&&P0().lp===lpP1&&lpP1===8000&&!!mz(0,'ネイビィロイド'),
    JSON.stringify({lpP1,lp:P0().lp,mz0:mzNames(0),g0:names(0,'grave'),toasts:TOASTS.slice(-3)}));
  nextTurn();
  ok('VM2: T5 begins for P1; the game continues',gameState.turn===5&&gameState.activePlayer===0);
  replayAudit('VM2 T4 continuation');
  `);
}else{console.log('FAIL VM1 did not reach the save point');process.exitCode=2;}
