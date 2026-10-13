/* CODEX-C06 — バイス・ドラゴン / コアキメイル・ドラゴ.
   Uses real DUEL procedure, Special Summon, End Phase, and Replay paths. */
const harness=require('./astra_harness');
const COMMON=String.raw`
function uid(c){return ensureCardUid(gameState,c);}
function z(c){const h=findCardByUid(uid(c));return h?h.zone:null;}
function ss(c,p,reason){const h=locateCardAnyV4(c);return h?API.specialSummon(p,h.zone,h.index,'atk',reason,h.p):false;}
function ba(c){return p3OriginalStatV3(c,'atk');}
function bd(c){return p3OriginalStatV3(c,'def');}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit',a.ok,JSON.stringify(a).slice(0,240));}
function fresh(phase='main1'){resetA();gameState.activePlayer=0;gameState.turn=12;gameState.phase=phase;gameState.rngInitialSeed=gameState.rngState=0xc06a11;}
function drive(){for(let i=0;i<900;i++){
  const q=pendingChoiceV49(gameState);if(q){__choicePickV49(0);continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';
}return 'loop';}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});return drive();}
`;

/* A. バイス・ドラゴン: exact hand procedure and procedure-only original stats. */
harness(COMMON+String.raw`
fresh();
const vice=mk('バイス・ドラゴン',0),foe=mk('ワイト',1);gameState.players[0].hand=[vice];gameState.players[1].mz=[foe];baselineA();
const sc=CARD_SCRIPTS['バイス・ドラゴン'];
ok('A: バイス・ドラゴン script is registered',!!sc);
ok('A: procedure is legal only while only the opponent controls a monster',!!sc&&strictSummonProcedureLegality('バイス・ドラゴン',0,'hand',0).ok===true);
if(sc){finishSummonProcedure('バイス・ドラゴン',0,'hand',0,'atk');drive();}
ok('A: hand procedure Special Summons with procedure provenance',z(vice)==='mz'&&vice.specialSummonKind==='procedure');
ok('A: that procedure halves original ATK/DEF while face-up',ba(vice)===1000&&bd(vice)===1200&&curATK(vice)===1000&&curDEF(vice)===1200,JSON.stringify({ba:ba(vice),bd:bd(vice),a:curATK(vice),d:curDEF(vice)}));
const vh=locateCardAnyV4(vice);if(vh)act({type:'FX_SET_STATE',player:vh.p,zone:'mz',index:vh.index,face:'down',pos:'def',reason:'CODEX-C06 face-down reset'});
ok('A: turning it face-down ends the procedure-only original-stat change',vice.face==='down'&&ba(vice)===2000&&bd(vice)===2400);
audit('A');
`);
harness(COMMON+String.raw`
fresh();
const vice=mk('バイス・ドラゴン',0),own=mk('ワイト',0),foe=mk('ワイト',1);gameState.players[0].hand=[vice];gameState.players[0].mz=[own];gameState.players[1].mz=[foe];baselineA();
const legal=CARD_SCRIPTS['バイス・ドラゴン']&&strictSummonProcedureLegality('バイス・ドラゴン',0,'hand',0).ok;
ok('A negative: own monster makes the procedure illegal',legal===false);
audit('A negative');
`);
harness(COMMON+String.raw`
fresh();
const vice=mk('バイス・ドラゴン',0);gameState.players[0].grave=[vice];baselineA();
API.specialSummon(0,'grave',0,'atk','CODEX-C06 ordinary revival');
ok('A negative: a non-procedure Special Summon keeps printed original stats',z(vice)==='mz'&&ba(vice)===2000&&bd(vice)===2400);
audit('A ordinary revival');
`);

/* B. コアキメイル・ドラゴ: both-player LIGHT/DARK lock and upkeep. */
harness(COMMON+String.raw`
fresh();
const drago=mk('コアキメイル・ドラゴ',0),ownLight=mk('青眼の白龍',0),foeDark=mk('ワイト',1),foeWind=mk('ドラグニティ－ブランディストック',1);
gameState.players[0].mz=[drago];gameState.players[0].hand=[ownLight];gameState.players[1].hand=[foeDark,foeWind];baselineA();
const sc=CARD_SCRIPTS['コアキメイル・ドラゴ'];
ok('B: コアキメイル・ドラゴ script is registered',!!sc);
const a=ss(ownLight,0,'CODEX-C06 own LIGHT');
const b=ss(foeDark,1,'CODEX-C06 foe DARK');
const c=ss(foeWind,1,'CODEX-C06 foe WIND');
ok('B: its live continuous effect blocks both players LIGHT/DARK Special Summons',a===false&&b===false&&z(ownLight)==='hand'&&z(foeDark)==='hand',JSON.stringify({a,b,ol:z(ownLight),fd:z(foeDark)}));
ok('B: the lock allows a non-LIGHT/DARK monster',c===true&&z(foeWind)==='mz');
audit('B lock');
`);
harness(COMMON+String.raw`
fresh();
const drago=mk('コアキメイル・ドラゴ',0),dark=mk('ワイト',1);gameState.players[0].mz=[drago];gameState.players[1].hand=[dark];baselineA();
API.negateEffectUntil({p:0,zone:'mz',index:0,card:drago},'permanent','CODEX-C06 test');
const did=API.specialSummon(1,'hand',0,'atk','CODEX-C06 negated source');
ok('B negative: negating コアキメイル・ドラゴ removes the lock',did===true&&z(dark)==='mz');
audit('B negated');
`);
harness(COMMON+String.raw`
fresh();
const drago=mk('コアキメイル・ドラゴ',0),core=mk('コアキメイルの鋼核',0);gameState.players[0].mz=[drago];gameState.players[0].hand=[core];baselineA();
if(CARD_SCRIPTS['コアキメイル・ドラゴ'])phase('end');
ok('B: own End Phase upkeep sends 鋼核 from hand to GY',z(drago)==='mz'&&z(core)==='grave');
audit('B upkeep core');
`);
harness(COMMON+String.raw`
fresh();
const drago=mk('コアキメイル・ドラゴ',0);gameState.players[0].mz=[drago];baselineA();
if(CARD_SCRIPTS['コアキメイル・ドラゴ'])phase('end');
ok('B negative: without 鋼核 or a Dragon reveal, upkeep destroys itself',z(drago)==='grave');
audit('B upkeep destroy');
`);
