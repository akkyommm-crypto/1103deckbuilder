/* S03-U482: prepared chain links serialize event card identity as uid.  Resolution must
   restore that uid to the current live card before scripts inspect ctx.event.card. */
const harness=require('./astra_harness');
const COMMON=String.raw`
function fresh(){resetA();gameState.activePlayer=0;gameState.phase='main1';}
function linkFor(source,name,event,eventName){
  return {player:0,uid:ensureCardUid(gameState,source),name,from:'sz',index:0,ss:2,
    event,eventName:eventName||'onNormalSummon',chainId:482,
    effectClass:'monsterEffect',keep:true,targets:[],selection:[]};
}
function roundTripChain(link){gameState.chain=[link];gameState=JSON.parse(JSON.stringify(gameState));return gameState.chain[0];}
function run(link){const ctx=preparedChainContext(link);CARD_SCRIPTS[link.name].resolve(ctx);return ctx;}
function drive(){for(let i=0;i<300;i++){
  if(EVT_V2_STATE||pendingChoiceV49(gameState))return EVT_V2_STATE?'event':'choice';
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function reach(name){for(let i=0;i<12;i++){
  const state=drive();if(state!=='event')return state;
  const group=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];
  if(group.some(x=>x.name===name))return 'offered';
  if(EVT_V2_STATE.rank>=2){eventSkipGroupV2();continue;}
  return 'other-forced';}return 'loop';}
function zone(card){const h=findCardByUid(card.uid);return h&&h.zone;}
function audit(label){const pkg=v41ReplayPackage(gameState),result=v44ReplayAuditPackage(pkg);ok(label,pkg.actions.length>0&&result.ok,JSON.stringify(result));}
`;

/* Destruction trap: a same-name card must never be substituted for the event subject. */
harness(COMMON+String.raw`
fresh();
const trap=mk('ねずみ取り',0,'up'),subject=mk('もけもけ',1),same=mk('もけもけ',1);
gameState.players[0].sz=[trap];gameState.players[1].mz=[subject,same];baselineA();
const link=linkFor(trap,'ねずみ取り',{card:subject,uid:subject.uid,player:1,reason:'normal summon',provenance:'u482-destroy'});
ok('raw trigger link stores the live event card, uid and primitive provenance before Save',link.event.card===subject&&link.event.uid===subject.uid&&link.event.provenance==='u482-destroy',JSON.stringify(link.event));
const loaded=roundTripChain(link),liveSubject=findCardByUid(subject.uid).card,liveSame=findCardByUid(same.uid).card,ctx=run(loaded);
ok('Save/Load resolution rebinds event.card to the exact live uid',ctx.event.card===liveSubject&&ctx.event.card!==liveSame&&ctx.event.provenance==='u482-destroy',JSON.stringify(ctx.event));
ok('event-card destruction operation acts on the exact summoned card',findCardByUid(subject.uid).zone==='grave'&&findCardByUid(same.uid).zone==='mz','');
`);

/* Continuous trigger: the same boundary serves a different operation and also works without Save/Load. */
harness(COMMON+String.raw`
fresh();
const stumble=mk('つまずき',0,'up'),subject=mk('ワイト',1);gameState.players[0].sz=[stumble];gameState.players[1].mz=[subject];baselineA();
const link=linkFor(stumble,'つまずき',{card:subject,uid:subject.uid,player:1,reason:'special summon',provenance:'u482-position'},'onSpecialSummon');
const ctx=run(roundTripChain(link));
ok('a second Save/Load chain resolution restores the live event.card',ctx.event.card===findCardByUid(subject.uid).card&&ctx.event.provenance==='u482-position',JSON.stringify(ctx.event));
ok('continuous position-change operation receives that card',findCardByUid(subject.uid).card.pos==='def',JSON.stringify(findCardByUid(subject.uid).card));
`);

/* Missing event subjects stay absent; exact uid lookup must not fall through to a same-name card. */
harness(COMMON+String.raw`
fresh();
const stumble=mk('つまずき',0,'up'),gone=mk('ワイト',1),same=mk('ワイト',1);gameState.players[0].sz=[stumble];gameState.players[1].mz=[gone,same];baselineA();
const link=linkFor(stumble,'つまずき',{card:gone,uid:gone.uid,player:1,provenance:'u482-missing'},'onSpecialSummon');
gameState.players[1].mz.splice(0,1);const ctx=run(roundTripChain(link));
ok('missing uid leaves event.card absent while preserving primitive provenance',!ctx.event.card&&ctx.event.uid===gone.uid&&ctx.event.provenance==='u482-missing',JSON.stringify(ctx.event));
ok('missing uid never binds or changes a same-name survivor',findCardByUid(same.uid).card.pos==='atk'&&ctx.event.card!==findCardByUid(same.uid).card,'');
`);

/* UID-only prepared snapshots are the generic serialized contract and must hydrate too. */
harness(COMMON+String.raw`
fresh();
const stumble=mk('つまずき',0,'up'),subject=mk('ワイト',1);gameState.players[0].sz=[stumble];gameState.players[1].mz=[subject];baselineA();
const event=safeActivationEventV11({card:subject,player:1,provenance:'u482-uid-only'}),link=linkFor(stumble,'つまずき',event,'onSpecialSummon'),loaded=roundTripChain(link),ctx=run(loaded);
ok('uid-only prepared snapshot hydrates the exact live card only in its resolution context',ctx.event.uid===subject.uid&&ctx.event.card===findCardByUid(subject.uid).card&&ctx.event.provenance==='u482-uid-only',JSON.stringify(ctx.event));
ok('uid-only stored snapshot stays JSON-only and the event-card operation resolves',!('card' in loaded.event)&&findCardByUid(subject.uid).card.pos==='def',JSON.stringify(loaded.event));
`);

/* Full processor path: a real trigger activation may retain a raw event-card clone until Save/Load. */
harness(COMMON+String.raw`
fresh();
const air=mk('E・HERO エアーマン',0),hero=mk('E・HERO クレイマン',0);gameState.players[0].hand=[air];gameState.players[0].deck=[hero];baselineA();
doNormalSummon(0,'atk');let state=drive(),group=EVT_V2_STATE&&EVT_V2_STATE.groups[EVT_V2_STATE.rank],i=group?group.findIndex(c=>c.name==='E・HERO エアーマン'):-1;
ok('real summon event offers the event-card trigger',state==='event'&&i>=0,JSON.stringify({state,names:group&&group.map(c=>c.name)}));
eventPickV2(i);let q=pendingChoiceV49(gameState),pick=q&&q.candidates.find(c=>c.value===true);answerChoiceV49([pick.key]);
const link=gameState.chain.find(x=>x.name==='E・HERO エアーマン');
ok('real trigger link keeps its live event.card and uid before Save',link&&link.event.uid===air.uid&&link.event.card===air,JSON.stringify(link&&link.event));
gameState=JSON.parse(JSON.stringify(gameState));const loaded=gameState.chain.find(x=>x.name==='E・HERO エアーマン'),live=findCardByUid(air.uid).card;
ok('Save/Load leaves the stored trigger snapshot detached before context hydration',loaded.event.card!==live&&loaded.event.card.uid===live.uid,JSON.stringify({saved:loaded.event.card.uid,live:live.uid}));
const detached=loaded.event.card,ctx=preparedChainContext(loaded);
ok('real Save/Load chain context restores its exact live event card without mutating the stored snapshot',ctx.event.card===live&&ctx.event.uid===air.uid&&loaded.event.card===detached&&loaded.event.card!==live,JSON.stringify(ctx.event));
`);

/* Actual DUEL + production Save/Resume: Bottomless must banish only the monster from the saved summon event. */
harness(COMMON+String.raw`
fresh();
const old=mk('ジェネティック・ワーウルフ',0),summoned=mk('ジェネティック・ワーウルフ',0),bottomless=mk('奈落の落とし穴',1,'down');
bottomless.setTurn=gameState.turn-1;gameState.players[0].mz=[old];gameState.players[0].hand=[summoned];gameState.players[1].sz=[bottomless];baselineA();
doNormalSummon(0,'atk');const offered=reach('奈落の落とし穴'),group=EVT_V2_STATE&&EVT_V2_STATE.groups[EVT_V2_STATE.rank],offerIndex=group?group.findIndex(x=>x.name==='奈落の落とし穴'):-1;
ok('actual Normal Summon offers Bottomless Trap Hole',offered==='offered'&&offerIndex>=0,JSON.stringify({offered,names:group&&group.map(x=>x.name)}));
eventPickV2(offerIndex);
let link=gameState.chain.find(x=>x.name==='奈落の落とし穴');
ok('actual activation records the summoned uid on its prepared link',!!link&&link.event.uid===summoned.uid,JSON.stringify(link&&link.event));
localStorage.removeItem(DUEL_SAVE_KEY);saveDuel();const raw=localStorage.getItem(DUEL_SAVE_KEY);
ok('production save captures the open Bottomless chain',!!raw&&raw.includes('奈落の落とし穴'),'bytes='+(raw&&raw.length));
resetA();localStorage.setItem(DUEL_SAVE_KEY,raw);const resumed=offerResumeDuel();
link=gameState.chain.find(x=>x.name==='奈落の落とし穴');const storedEvent=link&&link.event;
ok('production resume restores the open chain with a JSON-safe event snapshot',resumed===true&&!!link&&storedEvent.uid===summoned.uid&&(!storedEvent.card||storedEvent.card!==findCardByUid(summoned.uid).card),JSON.stringify(storedEvent));
const context=preparedChainContext(link);
ok('resumed Bottomless context rebinds the exact summoned live uid without mutating its snapshot',context.event.card===findCardByUid(summoned.uid).card&&context.event.card!==findCardByUid(old.uid).card&&link.event===storedEvent&&link.event.card!==context.event.card,JSON.stringify(context.event));
drive();
ok('resumed Bottomless banishes only the summoned same-name monster',zone(summoned)==='banish'&&zone(old)==='mz'&&zone(bottomless)==='grave',JSON.stringify({summoned:zone(summoned),old:zone(old),bottomless:zone(bottomless)}));
audit('actual Bottomless Save/Resume Replay audit reproduces every digest');
`);
