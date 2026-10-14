/* CODEX-C05 — priority cards from the user's レヴァライダー / ガリスフルモン decks.
   Real DUEL summon/phase/battle paths are used and every completed scenario is
   Replay-audited. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function uid(c){return ensureCardUid(gameState,c);}
function z(c){const h=findCardByUid(uid(c));return h?h.zone:null;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',a.ok,JSON.stringify(a).slice(0,240));}
function fresh(phase='main1'){resetA();gameState.activePlayer=0;gameState.turn=9;gameState.phase=phase;
  gameState.rngInitialSeed=gameState.rngState=0xc05a11;}
function pickUid(c){const q=pc(),i=q?q.candidates.findIndex(x=>x.uid===uid(c)):-1;if(i<0)return false;__choicePickV49(i);return true;}
function drive(){for(let i=0;i<900;i++){
  if(pc()) return 'choice';
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';
}return 'loop';}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});return drive();}
`;

/* A. ミンゲイドラゴン: Dragon-only double Tribute, optional Standby revival,
   non-Dragon grave negative, and banish-on-leave after that revival. */
harness(COMMON+String.raw`
fresh('draw');
const min=mk('ミンゲイドラゴン',0),dragon=mk('青眼の白龍',0),targetDragon=dbOf(mk('レッドアイズ・ダークネスメタルドラゴン',0)),targetWarrior=dbOf(mk('E・HERO スパークマン',0));
gameState.players[0].grave=[min,dragon];baselineA();
const sc=CARD_SCRIPTS['ミンゲイドラゴン'];
ok('A: ミンゲイドラゴン script is registered',!!sc);
ok('A: counts as two Tributes only for a Dragon Tribute Summon',!!sc&&tributeValueOptions(min,targetDragon).includes(2)&&!tributeValueOptions(min,targetWarrior).includes(2));
if(sc)phase('standby');
ok('A: revives in Attack Position during its controller Standby with an all-Dragon GY',z(min)==='mz'&&min.face==='up'&&min.pos==='atk');
ok('A: revived copy receives the leave-field banish replacement',min.banishWhenLeavesField===true);
if(z(min)==='mz')API.returnToHand(locateCardAnyV4(min),'CODEX-C05 test');
ok('A: the revived copy is banished instead of returning to the hand',z(min)==='banish');
audit('A');
`);
harness(COMMON+String.raw`
fresh('draw');
const min=mk('ミンゲイドラゴン',0),nonDragon=mk('ワイト',0);gameState.players[0].grave=[min,nonDragon];baselineA();
if(CARD_SCRIPTS['ミンゲイドラゴン'])phase('standby');
ok('A negative: a non-Dragon monster in my GY prevents the Standby revival',z(min)==='grave');
audit('A negative');
`);

/* B. 時械神メタイオン: no-Tribute Normal Summon, battle/effect protection,
   own battle-damage zero, Battle Phase-end mass bounce/burn, Deck-SS ban, and
   mandatory owner-Deck return in the controller's Standby Phase. */
harness(COMMON+String.raw`
fresh();
const met=mk('時械神メタイオン',0),blue=mk('青眼の白龍',1),wight=mk('ワイト',1);gameState.players[0].hand=[met];gameState.players[1].mz=[blue,wight];baselineA();
const sc=CARD_SCRIPTS['時械神メタイオン'];
ok('B: 時械神メタイオン script is registered',!!sc);
if(sc){doNormalSummon(0,'atk');drive();}
ok('B: can be Normal Summoned without Tribute while I control no monster',z(met)==='mz'&&met.normalSummonMethod==='metaion0');
const myLp=gameState.players[0].lp,foeLp=gameState.players[1].lp;
if(z(met)==='mz'){phase('battle');requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();}
ok('B: is not destroyed by battle and its Attack Position battle damage to me is zero',z(met)==='mz'&&gameState.players[0].lp===myLp,JSON.stringify({zone:z(met),lp:gameState.players[0].lp}));
if(z(met)==='mz')phase('main2');
ok('B: after it battled, all other field monsters return to their owners hands',z(blue)==='hand'&&z(wight)==='hand'&&z(met)==='mz',JSON.stringify({blue:z(blue),wight:z(wight),met:z(met)}));
ok('B: inflicts 300 damage for each monster actually returned',gameState.players[1].lp===foeLp-600,JSON.stringify({before:foeLp,after:gameState.players[1].lp}));
audit('B battle/end');
`);
harness(COMMON+String.raw`
fresh();
const met=mk('時械神メタイオン',0),hole=mk('ブラック・ホール',1,'down');hole.setTurn=5;gameState.players[0].mz=[met];gameState.players[1].sz=[hole];gameState.activePlayer=1;baselineA();
if(CARD_SCRIPTS['時械神メタイオン']){duelActivateFromZone(1,'sz',0);drive();}
ok('B: is not destroyed by an opponent effect',z(met)==='mz');
audit('B effect protection');
`);
harness(COMMON+String.raw`
fresh();
const met=mk('時械神メタイオン',0);gameState.players[0].deck=[met];baselineA();
ok('B negative: Deck copy is excluded from effect Special Summon candidates',canEffectSpecialSummonS03(met,'deck','CODEX-C05 test')===false);
const did=API.specialSummon(0,'deck',0,'atk','CODEX-C05 test');
ok('B negative: cannot be Special Summoned from the Deck',did===false&&z(met)==='deck',JSON.stringify({did,zone:z(met),toasts:TOASTS}));
const ignored=API.specialSummon(0,'deck',0,'atk','CODEX-C05 ignore test',null,{ignoreSummonConditionS03:true});
ok('B: an effect explicitly ignoring summon conditions can bypass the source-zone condition',ignored===true&&z(met)==='mz');
audit('B Deck-SS negative');
`);
harness(COMMON+String.raw`
fresh('draw');
const met=mk('時械神メタイオン',0);gameState.players[0].mz=[met];baselineA();
if(CARD_SCRIPTS['時械神メタイオン'])phase('standby');
ok('B: returns to its owner Deck during its controller Standby Phase',z(met)==='deck');
audit('B Standby');
`);

/* C. 究極時械神セフィロン: proper hand Summon procedure at ten GY
   monsters and a non-targeting once-per-turn resolution choice from hand/GY. */
harness(COMMON+String.raw`
fresh();
const seph=mk('究極時械神セフィロン',0),met=mk('時械神メタイオン',0),christia=mk('大天使クリスティア',0);
gameState.players[0].hand=[seph,christia];gameState.players[0].grave=[met];for(let i=0;i<9;i++)gameState.players[0].grave.push(mk('ワイト',0));baselineA();
const sc=CARD_SCRIPTS['究極時械神セフィロン'];
ok('C: 究極時械神セフィロン script is registered',!!sc);
ok('C: its procedure is legal with ten monsters in my GY',!!sc&&strictSummonProcedureLegality('究極時械神セフィロン',0,'hand',0).ok===true);
if(sc){finishSummonProcedure('究極時械神セフィロン',0,'hand',0,'atk');drive();}
ok('C: the non-chain procedure Special Summons it from the hand',z(seph)==='mz'&&seph.properlySummonedS03===true);
if(z(seph)==='mz'){duelActivateFromZone(0,'mz',0);drive();const q=pc();ok('C: resolution choice offers Level 8+ Fairies from both hand and GY',!!q&&q.candidates.some(x=>x.uid===uid(met))&&q.candidates.some(x=>x.uid===uid(christia)));if(q)pickUid(met);drive();}
else ok('C: resolution choice offers Level 8+ Fairies from both hand and GY',false);
ok('C: the chosen Fairy is Special Summoned with effects negated and ATK 4000',z(met)==='mz'&&effectNegated(met)&&curATK(met)===4000,JSON.stringify({zone:z(met),negated:effectNegated(met),atk:curATK(met)}));
ok('C: the summon effect is non-targeting and cannot be used twice that turn',!!sc&&sc.targets!==true&&strictScriptLegalityV2('究極時械神セフィロン',0,'mz',0,{}).ok===false);
audit('C');
`);
harness(COMMON+String.raw`
fresh();
const seph=mk('究極時械神セフィロン',0);gameState.players[0].hand=[seph];for(let i=0;i<9;i++)gameState.players[0].grave.push(mk('ワイト',0));baselineA();
const legal=CARD_SCRIPTS['究極時械神セフィロン']&&strictSummonProcedureLegality('究極時械神セフィロン',0,'hand',0).ok;
ok('C negative: nine monsters in my GY are insufficient for the procedure',legal===false);
audit('C negative');
`);
