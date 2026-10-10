/* S03-U17 CHAIN_LESS_PROCEDURE_AS_EFFECT
   Requirement: マジック・ストライカー, パワー・ジャイアント and 異次元の精霊 Special Summon themselves from the hand by a chain-less
   summon procedure (their text 「…し、手札から特殊召喚できる」; 異次元の精霊 is a 召喚ルール効果 by the 2011 wiki 10/11/17),
   not by an activated effect. The card used by the procedure (banished Spell, sent monster, banished monster) is part of the
   procedure; the card-specific follow-up is applied on the summon (パワー・ジャイアント lowers its level by the sent monster's
   level; 異次元の精霊 schedules the return of the banished monster), including after a save inside the summon-negation window.
   Before the fix: the three were scripted as activated effects whose cost read the selection before it was made, so they could not
   be used in a real duel (S03-U16 measurement), and making them activatable would have opened chain windows that do not exist.
   Every card named here is TESTED or GENERIC_OK. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;}
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
  const i=pc.candidates.findIndex(x=>{const h=x.uid!=null&&findCardByUid(x.uid);return (h&&nm(h.card)===match)||String(x.label||'').includes(match);});
  if(i<0)throw Error('candidate '+match+' missing: '+JSON.stringify(labels()));__choicePickV49(i);}
function mzNames(p){return gameState.players[p].mz.map(nm);}
function actionIds(p,i){return getLegalHandActions(p,i).map(a=>a.id);}
function chainAddedFor(name){return (gameState.actionJournalV41||gameState.__v41Journal||[]).some(a=>a&&a.type==='CHAIN_ADD'&&a.name===name);}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});settle();}
function replay(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,300));
  ok(label+': no chain link was ever added for the procedure card',!pkg.actions.some(x=>x&&x.action&&x.action.type==='CHAIN_ADD'),JSON.stringify(pkg.actions.filter(x=>x&&x.action&&x.action.type==='CHAIN_ADD').map(x=>x.action.name)));}
function procedure(name,p,idx,pos){runSummonProcedure(name,p,'hand',idx);if(!gameState.pendingSummon&&!pendingChoiceV49(gameState))finishSummonProcedure(name,p,'hand',idx,pos||'atk');}
`;

const first=harness(COMMON+String.raw`
/* ===== マジック・ストライカー ===== */
fresh();const ms=mk('マジック・ストライカー');gameState.players[0].hand=[ms];gameState.players[0].grave=[mk('サイクロン')];baselineA();
const msIds=actionIds(0,0);
ok('マジック・ストライカー: the hand offers the Special Summon procedure and no effect activation',msIds.includes('specialSummonProcedure')&&!msIds.includes('handEffect'),JSON.stringify(msIds));
procedure('マジック・ストライカー',0,0,'atk');
ok('マジック・ストライカー: the procedure asks which GY Spell to banish',!!pendingChoiceV49(gameState)&&labels().some(l=>l.includes('サイクロン')),JSON.stringify({labels:labels(),toasts:TOASTS}));
pick('サイクロン');settle();
ok('マジック・ストライカー: サイクロン is banished and it is Special Summoned; it can attack directly',
  mzNames(0).includes('マジック・ストライカー')&&gameState.players[0].banish.some(c=>nm(c)==='サイクロン')&&canDirectAttackThroughMonstersV51(ms),JSON.stringify({mz:mzNames(0),banish:gameState.players[0].banish.map(nm)}));
replay('マジック・ストライカー');
fresh();gameState.players[0].hand=[mk('マジック・ストライカー')];gameState.players[0].grave=[mk('ワイト')];baselineA();
ok('マジック・ストライカー: with no Spell in the GY the procedure is not offered',!actionIds(0,0).includes('specialSummonProcedure'));

/* ===== パワー・ジャイアント ===== */
fresh();const pg=mk('パワー・ジャイアント');gameState.players[0].hand=[pg,mk('ワイト'),mk('ヂェミナイ・エルフ')];baselineA();
const pgIds=actionIds(0,0);
ok('パワー・ジャイアント: the hand offers the Special Summon procedure and no effect activation',pgIds.includes('specialSummonProcedure')&&!pgIds.includes('handEffect'),JSON.stringify(pgIds));
procedure('パワー・ジャイアント',0,0,'atk');
ok('パワー・ジャイアント: the candidates are the Level 4 or lower monsters in the hand',labels().length===2&&labels().some(l=>l.includes('ワイト'))&&labels().some(l=>l.includes('ヂェミナイ・エルフ')),JSON.stringify(labels()));
pick('ワイト');settle();
ok('パワー・ジャイアント: ワイト (Level 1) is sent and パワー・ジャイアント is Special Summoned at Level 6 − 1 = 5',
  !!gameState.players[0].mz.find(c=>c===pg)&&curLV(pg)===5&&gameState.players[0].grave.some(c=>nm(c)==='ワイト'),JSON.stringify({mz:mzNames(0),lv:curLV(pg)}));
replay('パワー・ジャイアント');

/* パワー・ジャイアント negated by ライオウ: the sent monster stays in the GY */
fresh();gameState.players[1].mz=[mk('ライオウ',1)];const pg2=mk('パワー・ジャイアント');gameState.players[0].hand=[pg2,mk('ワイト')];baselineA();
procedure('パワー・ジャイアント',0,0,'atk');pick('ワイト');
ok('パワー・ジャイアント: the procedure waits in the summon-negation window facing ライオウ (it can be negated, wiki 11/08/12)',!!gameState.pendingSummon&&gameState.pendingSummon.kind==='procedure'&&gameState.pendingSummon.resumeS03&&gameState.pendingSummon.resumeS03.data&&gameState.pendingSummon.resumeS03.data.sentLv===1,JSON.stringify(gameState.pendingSummon));
activateSummonNegatorV2(1,'mz',0);settle();
ok('パワー・ジャイアント: ライオウ negates it; パワー・ジャイアント goes to the GY and ワイト is not returned',
  gameState.players[0].grave.some(c=>c===pg2)&&gameState.players[0].grave.some(c=>nm(c)==='ワイト')&&!gameState.pendingSummon,JSON.stringify({grave:gameState.players[0].grave.map(nm)}));

/* ===== 異次元の精霊: save inside the window facing ライオウ ===== */
fresh();gameState.players[1].mz=[mk('ライオウ',1)];const elf=mk('ヂェミナイ・エルフ');gameState.players[0].mz=[elf];gameState.players[0].hand=[mk('異次元の精霊')];
/* both players need cards in the Deck: the test advances through the next Draw Phase to the Standby Phase */
gameState.players[0].deck=[mk('ワイト',0,'down'),mk('ワイト',0,'down')];gameState.players[1].deck=[mk('ワイト',1,'down'),mk('ワイト',1,'down')];
baselineA();
const ijIds=actionIds(0,0);
ok('異次元の精霊: the hand offers the Special Summon procedure and no effect activation',ijIds.includes('specialSummonProcedure')&&!ijIds.includes('handEffect'),JSON.stringify(ijIds));
procedure('異次元の精霊',0,0,'atk');pick('ヂェミナイ・エルフ');
ok('異次元の精霊: ヂェミナイ・エルフ is banished by the procedure, which waits in the window with the banished uid as data',
  gameState.players[0].banish.includes(elf)&&!!gameState.pendingSummon&&gameState.pendingSummon.resumeS03.data&&gameState.pendingSummon.resumeS03.data.uid===elf.uid,JSON.stringify(gameState.pendingSummon));
globalThis.__ELF_UID=elf.uid;
saveDuel();globalThis.__RAW=localStorage.getItem(DUEL_SAVE_KEY);
`);

if(first.__RAW){
  harness('const RAW='+JSON.stringify(first.__RAW)+';const ELF_UID='+JSON.stringify(first.__ELF_UID)+';'+COMMON+String.raw`
  fresh();localStorage.setItem(DUEL_SAVE_KEY,RAW);
  ok('VM2: the save resumes inside the window',offerResumeDuel()&&!!gameState.pendingSummon&&reopenSummonWindowAfterLoadS03()==='sheet');
  commitPendingSummonV2();settle();
  const ret=(gameState.scheduledV7||[]).find(e=>e&&e.handler==='d4.returnBanishedUid');
  ok('VM2: committing (ライオウ not used) Special Summons 異次元の精霊 and schedules the return of the banished ヂェミナイ・エルフ',
    mzNames(0).includes('異次元の精霊')&&!!ret&&ret.args&&ret.args.uid===ELF_UID,JSON.stringify({mz:mzNames(0),ret}));
  phase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});settle();
  requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});settle();phase('standby');
  ok('VM2: in the next Standby Phase ヂェミナイ・エルフ returns to the field',gameState.players[0].mz.some(c=>c.uid===ELF_UID)&&!gameState.players[0].banish.some(c=>c.uid===ELF_UID),JSON.stringify({mz:mzNames(0),banish:gameState.players[0].banish.map(nm),turn:gameState.turn,phase:gameState.phase,active:gameState.activePlayer,drawn:gameState.drawnThisTurn,paused:gameState.processorPaused,waiting:gameState.processorWaiting&&gameState.processorWaiting.type,q:(gameState.processorQueue||[]).length,choice:!!pendingChoiceV49(gameState),evt:!!EVT_V2_STATE,toasts:TOASTS.slice(-4)}));
  replay('VM2 異次元の精霊');
  `);
}else{console.log('FAIL VM1 did not reach the save point');process.exitCode=2;}
