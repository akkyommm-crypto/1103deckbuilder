/* U510: effect-performed Normal Summon negated before reaching the field.
 * U509 ruling evidence: WIKI-0A19E6117879 (2010-06-05), WIKI-D70393946D93
 * (2010-09-16), WIKI-643A78AB3480 (2008-03-19), WIKI-9E991E9B14E9 (2010-04-21).
 * Destroyed / sent to GY, but NOT destroyed on / sent from the field.
 * 'summon' is provenance, not a physical zone; physical storage remains mz.
 */
const harness=require('./astra_harness');
const COMMON=String.raw`
let QLOG510=[];
const q510=queueDeferredEventV2;queueDeferredEventV2=function(n,e){QLOG510.push({n,uid:e.uid??e.card?.uid});return q510.apply(this,arguments);};
function volatileReset(){EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;
 EVT_RESUME_DATA_V484=null;CHOICE_LEGACY_CB_V49=new Map();ACTIVATION_PREP_S03=null;RESOLVING_LINK_S03=null;
 PENDING_SUMMON_COMMIT=null;PENDING_SUMMON_CANCEL=null;EVT_CANDS=[];PROCESSOR_PUMPING_V27=false;APPLY_ACTION_DEPTH_V31=0;}
function fresh(){resetA();volatileReset();QLOG510=[];gameState.rngInitialSeed=gameState.rngState=0x510;
 for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:10},()=>mk('ワイト',p));}
function zone(uid){return findCardByUid(uid)?.zone;}
function own(uid){return QLOG510.filter(x=>x.uid===uid).map(x=>x.n);}
function trap(n,p){const c=mk(n,p,'down');c.setTurn=gameState.turn-1;return c;}
function tick(){
 if(EVT_V2_STATE){const st=EVT_V2_STATE;if((st.groups[st.rank]||[]).length)eventPickV2(0);else eventSkipGroupV2();return true;}
 if(gameState.chainWindow&&gameState.chain.length){chainPassV2();return true;}
 if(gameState.processorWaiting?.type==='POINT'&&gameState.processorPaused){pointPassV27();return true;}
 if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();return true;}
 if(gameState.deferredEvents.length){flushDeferredEventsV2();return true;}return false;}
function drive(window=false){for(let i=0;i<900;i++){
 if(window&&gameState.pendingSummon?.resolvedSummonS03&&!gameState.chain.length)return 'window';
 if(pendingChoiceV49(gameState)){__choicePickV49(0);continue;}if(!tick())return 'idle';}throw Error('drive exhausted');}
function negate(name='神の宣告'){
 const c=summonNegatorsV2(gameState.pendingSummon).find(x=>x.db.n===name);
 if(!c)throw Error('negator missing');activateSummonNegatorV2(c.p,c.zone,c.index);drive();}
function blood(name,neg='神の宣告'){
 const c=mk(name,0);gameState.players[0].hand=[c];gameState.players[0].sz=[mk('血の代償',0)];
 gameState.players[1].sz=[trap(neg,1)];baselineA();duelActivateFromZone(0,'sz',0);
 if(drive(true)!=='window')throw Error('window missing');return c.uid;}
function audit(){const a=v44ReplayAuditPackage(v41ReplayPackage(gameState));
 ok('Replay digest',a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,180));}
function destroyed(uid){const c=findCardByUid(uid)?.card;
 ok('destroyed in GY, without field provenance',zone(uid)==='grave'&&c.graveInfo?.byDestroy===true&&c.graveInfo.from==='summon',JSON.stringify(c?.graveInfo));
 ok('destroy/GY exactly once, no field departures',own(uid).filter(n=>n==='onDestroy').length===1&&own(uid).filter(n=>n==='onSendToGrave').length===1
   &&!own(uid).includes('onRemove')&&!own(uid).includes('onLeaveField'),JSON.stringify(own(uid)));}
`;

const saved=harness(COMMON+String.raw`
fresh();const uid=blood('ダンディライオン');
localStorage.removeItem(DUEL_SAVE_KEY);saveDuel();globalThis.SAVED=localStorage.getItem(DUEL_SAVE_KEY);
negate();destroyed(uid);
ok('Dandylion summons two tokens',gameState.players[0].mz.filter(c=>cardName(c)==='綿毛トークン').length===2);
ok('Offering cost remains paid',gameState.players[0].lp===7500);
globalThis.WANT=v41StateDigest(gameState);audit();
`,{expect:5});
harness('const SAVED='+JSON.stringify(saved.SAVED)+';const WANT='+JSON.stringify(saved.WANT)+';'+COMMON+String.raw`
fresh();localStorage.setItem(DUEL_SAVE_KEY,SAVED);ok('fresh VM resume',offerResumeDuel()===true);
const uid=gameState.pendingSummon.uid;negate();destroyed(uid);
ok('Save/Load final digest equals uninterrupted duel',v41StateDigest(gameState)===WANT);audit();
`,{expect:5});
harness(COMMON+String.raw`
fresh();const jinzo=mk('人造人間－サイコ・ショッカー',0);gameState.players[0].grave=[jinzo];
const uid=blood('人造人間－サイコ・リターナー');negate();destroyed(uid);
ok('Returner revives Jinzo',zone(jinzo.uid)==='mz');audit();
`,{expect:4});
harness(COMMON+String.raw`
fresh();const uid=blood('クリッター');negate();destroyed(uid);
ok('Sangan never reached field: no search',gameState.players[0].hand.length===0);audit();
`,{expect:4});
harness(COMMON+String.raw`
fresh();const uid=blood('ダンディライオン','キックバック');negate('キックバック');
ok('Kickback returns to hand without destruction or GY',zone(uid)==='hand'&&!own(uid).includes('onDestroy')&&!own(uid).includes('onSendToGrave'));
ok('Kickback produces no tokens',gameState.players[0].mz.length===0);audit();
`,{expect:3});
harness(COMMON+String.raw`
fresh();gameState.phase='end';gameState.activePlayer=0;
const src=mk('デュアル・サモナー',1),mon=mk('デュアル・ソルジャー',1);
gameState.players[1].mz=[src];gameState.players[1].hand=[mon];gameState.players[0].sz=[trap('神の宣告',0)];
baselineA();duelActivateFromZone(1,'mz',0);ok('Dual Summoner opens window',drive(true)==='window');
negate();destroyed(mon.uid);ok('source remains on field',zone(src.uid)==='mz');audit();
`,{expect:5});

// Reducer boundary: matching uid only; field replacement/protection must not apply.
for(const marker of ['matching','missing','wrong'])harness(COMMON+'const MARKER='+JSON.stringify(marker)+';'+String.raw`
fresh();const c=mk('大天使クリスティア',0);gameState.players[0].mz=[c];baselineA();
const a={type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,byDestroy:true};
if(MARKER!=='missing')a.summonNegatedS03=MARKER==='matching'?c.uid:c.uid+10000;
act(a);
ok('Kristya replacement respects marker: '+MARKER,zone(c.uid)===(MARKER==='matching'?'grave':'deck'));
ok('field departure respects marker: '+MARKER,own(c.uid).includes('onLeaveField')===(MARKER!=='matching'));audit();
`,{expect:3});
harness(COMMON+String.raw`
fresh();gameState.players[1].sz=[mk('マクロコスモス',1)];const c=mk('ダンディライオン',0);gameState.players[0].mz=[c];baselineA();
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,byDestroy:true,summonNegatedS03:c.uid});
ok('Macro still redirects to banished',zone(c.uid)==='banish');
ok('destroyed but no GY event under Macro',own(c.uid).includes('onDestroy')&&!own(c.uid).includes('onSendToGrave'));
ok('banished from pending summon, not from field',findCardByUid(c.uid).card.banishInfo?.from==='summon'
 &&!v42WasFaceUpFieldWhenBanished(findCardByUid(c.uid).card));audit();
`,{expect:4});
for(const valid of [true,false])harness(COMMON+'const VALID='+valid+';'+String.raw`
fresh();const c=mk('ワイト',0);gameState.players[0].mz=[c];baselineA();let protectedCalls=0;
applyDestructionProtectionV21=()=>{protectedCalls++;return {label:'test field protection'};};
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,byDestroy:true,summonNegatedS03:VALID?c.uid:c.uid+10000});
ok('only pending summon bypasses field protection: '+VALID,zone(c.uid)===(VALID?'grave':'mz')&&protectedCalls===(VALID?0:1));
`,{expect:1});
