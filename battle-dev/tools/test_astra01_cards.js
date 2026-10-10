/* Exercise UI entry points, registry choices and the real chain processor.
   Only DOM/timers are stubbed by the harness. No operation() shortcuts. */
require('./astra_harness')(String.raw`
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;}
function pick(c){const pc=pendingChoiceV49(gameState);if(!pc)throw Error('choice missing');const i=pc.candidates.findIndex(x=>x.uid===c.uid);if(i<0)throw Error('candidate missing '+cardName(c));__choicePickV49(i);}
function pass(){for(let i=0;i<40;i++){
 if(EVT_V2_STATE||pendingChoiceV49(gameState))return;
 if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
 if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
 if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
 return;
 }throw Error('pass loop');}
function activate(c){const x=h(c);return prepareDuelActivation(cardName(c),x.p,x.zone,x.index,{});}
function replay(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+' Replay nonempty',pkg.actions.length>0&&a.ok,JSON.stringify(a));}
function normal(n='ドラグニティ－ドゥクス',e='ドラグニティ－ファランクス',withFoe=false){
 fresh();const c=mk(n),eq=mk(e);gameState.players[0].hand=[c];gameState.players[0].grave=[eq];
 gameState.players[0].ex=[mk('ドラグニティナイト－ゲイボルグ')];
 if(withFoe)gameState.players[1].mz=[mk('ライオウ',1)];
 baselineA();doNormalSummon(0,'atk');return {c,eq};
}
let {c,eq}=normal();
ok('Dux normal summon enters optional SEGOC',!!EVT_V2_STATE&&EVT_V2_STATE.rank===2);
eventPickV2(0);ok('Dux targets own grave via registry',pendingChoiceV49(gameState).targeting&&!pendingChoiceV49(gameState).legacy);
const saveChoice=JSON.stringify(gameState);
gameState=JSON.parse(saveChoice);EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;CHOICE_LEGACY_CB_V49.clear();reconcileChoiceAfterLoadV49(gameState);
c=findCardByUid(c.uid).card;eq=findCardByUid(eq.uid).card;pick(eq);
ok('Dux loaded target choice completes SEGOC',!EVT_V2_STATE&&gameState.chain.length===1&&!!gameState.eventChainResumeV11);
const chainId=gameState.chain[0].chainId;
gameState=JSON.parse(JSON.stringify(gameState));CHAIN_AFTER_V2=null;c=findCardByUid(c.uid).card;eq=findCardByUid(eq.uid).card;
pass();
ok('Dux real resolution equips without summoning',h(eq).zone==='sz'&&!eq.specialSummoned&&!gameState.systemFault);
ok('Dux stat counts itself and equipped Dragunity',curATK(c)===1900,curATK(c));
ok('Dux saved chain resumes normal Main Phase',!gameState.processorPaused&&!gameState.eventChainResumeV11&&!gameState.chainWindow);
ok('Dux attach provenance has resolving chain id',V41_ACTION_JOURNAL.some(x=>x.action.type==='FX_EQUIP_FROM_GRAVE_V31'&&x.action.chainId===chainId));
replay('Dux selection/save/resolve');
ok('Phalanx equipped ignition legal',activate(eq));pass();
ok('Dux -> Phalanx actual self Special Summon',h(eq).zone==='mz'&&!eq.equipTo&&!eq.v46MonsterEquip&&eq.specialSummonedFrom==='sz');
const ex=gameState.players[0].ex[0];
const combos=exCombos(0,dbOf(ex)).combos;
if(combos.length)doExSummon(0,0,combos[0].materials,'synchro','atk');pass();
ok('Dux -> Phalanx -> Gae Bulg legal Synchro',h(ex).zone==='mz'&&h(c).zone==='grave'&&h(eq).zone==='grave'&&ex.specialSummonKind==='synchro');
replay('Dragunity Synchro');

for(const mode of ['empty','wrong-race','level4','special']){
 fresh();c=mk('ドラグニティ－ドゥクス');eq=mk(mode==='wrong-race'?'ドラグニティ－レギオン':mode==='level4'?'ドラグニティ－アングス':'ドラグニティ－ファランクス');
 gameState.players[0].mz=[c];if(mode!=='empty')gameState.players[0].grave=[eq];baselineA();
 const event=mode==='special'?'onSpecialSummon':'onNormalSummon';
 ok('Dux negative '+mode,collectHandlers(event,{card:c,player:0}).filter(x=>x.card===c).length===0);
}
for(const mode of ['target-gone','host-down','full-at-resolution','negated']){
 ({c,eq}=normal());eventPickV2(0);pick(eq);
 if(mode==='target-gone')API.banish(h(eq),'response');
 if(mode==='host-down')act({type:'FX_SET_STATE',player:0,zone:'mz',index:0,face:'down',pos:'def'});
 if(mode==='full-at-resolution')for(let i=0;i<5;i++){const x=mk('サイクロン');gameState.players[0].hand.push(x);act({type:'MOVE',player:0,from:'hand',fromIndex:0,to:'sz',face:'down'});}
 if(mode==='negated')API.negateEffectUntil(h(c),'endTurn','response');
 pass();ok('Dux resolve negative '+mode,h(eq).zone!=='sz'&&!gameState.systemFault);
}
({c,eq}=normal());eventPickV2(0);cancelChoiceV49();ok('Dux cancel returns to optional SEGOC',!!EVT_V2_STATE&&gameState.chain.length===0);eventSkipGroupV2();pass();ok('Dux skip resumes duel',!gameState.processorPaused);
({c,eq}=normal());eventPickV2(0);pick(eq);act({type:'FX_CONTROL',player:0,zone:'mz',index:0,toPlayer:1,reason:'response'});pass();
ok('Dux source control change before resolution keeps self equip',h(c).p===1&&h(eq).p===0&&h(eq).zone==='sz'&&eq.equipTo.p===1&&eq.equipTo.uid===c.uid);replay('Dux chain control change');

// Reborn is activated from hand; its real selection and chain resolution
// produce Kick Man's Special Summon event.
fresh();c=mk('ザ・キックマン');eq=mk('団結の力');const reborn=mk('死者蘇生');gameState.players[0].grave=[c,eq];gameState.players[0].hand=[reborn];baselineA();
duelActivateFromHand(0);pick(c);pass();
ok('Kick Man Reborn triggers Special Summon SEGOC',!!EVT_V2_STATE&&h(c).zone==='mz');eventPickV2(0);pick(eq);pass();
ok('Kick Man recovered Equip Spell applies +800',h(eq).zone==='sz'&&curATK(c)===2100&&!gameState.systemFault,curATK(c));
ok('Kick Man equip is not second Spell activation',V41_ACTION_JOURNAL.filter(x=>x.action.type==='CHAIN_ADD'&&x.action.name==='団結の力').length===0);
replay('Kick Man');
ok('Kick Man no normal summon trigger',!collectHandlers('onNormalSummon',{card:c,player:0}).some(x=>x.card===c));

fresh();c=mk('凶悪犯－チョップマン',0,'down','def');eq=mk('団結の力');gameState.players[0].mz=[c];gameState.players[0].grave=[eq];baselineA();doFlipUp(0,'mz',0,'atk');
ok('Chopman real flip summon produces trigger',!!EVT_V2_STATE);eventPickV2(0);pick(eq);pass();
ok('Chopman resolves Equip Spell',h(eq).zone==='sz'&&curATK(c)===1900&&!gameState.systemFault,curATK(c));
ok('Chopman battle flip excluded',!collectHandlers('onFlip',{card:c,player:0,treatAsField:true,flipSummon:false}).some(x=>x.card===c));replay('Chopman');

({c,eq}=normal('ドラグニティ－レギオン','ドラグニティ－ファランクス',true));const foe=gameState.players[1].mz[0];eventPickV2(0);pick(eq);
ok('Legion equip branch is not destruction category',!API.effectHasCategory(gameState.chain[0],'destroy'));
pass();
ok('Legion equip resolved',h(eq).zone==='sz');ok('Legion ignition legal',activate(c));pick(eq);
ok('Legion cost paid before target choice',h(eq).zone==='grave'&&pendingChoiceV49(gameState).targeting&&!pendingChoiceV49(gameState).cancelable);
pick(foe);const link=gameState.chain[0];ok('Legion cost snapshot on chain',link.costSnapshots&&link.costSnapshots.length>0);
ok('Legion destroy branch is destruction category',linkHasCategoryV19(gameState,link,'destroy'));pass();
ok('Legion target destroyed',h(foe).zone==='grave'&&!gameState.systemFault);
ok('Legion no further activation without cost',!activate(c));
replay('Legion equip/cost/destroy');

function truck(defending=false,banishVictim=false,full=false){fresh();c=mk('トラックロイド');eq=mk('ワイト',1);gameState.players[0].mz=[c];gameState.players[1].mz=[eq];gameState.phase='battle';gameState.activePlayer=defending?1:0;
 if(full)gameState.players[0].sz=Array.from({length:5},()=>mk('サイクロン',0,'down'));
 baselineA();
 requestProcessorV27(PROCESSOR_V27.ATTACK,{player:defending?1:0,atkIdx:0,target:0});pass();
 ok('Truck '+defending+' real battle reaches mandatory trigger',!!EVT_V2_STATE&&EVT_V2_STATE.rank<2);
 if(!EVT_V2_STATE)return;eventPickV2(0);
 ok('Truck absorbs without targeting or destruction effect',gameState.chain.length===1&&API.chainLinkTargets(gameState.chain[0].chainId).length===0&&!linkHasCategoryV19(gameState,gameState.chain[0],'destroy'));
 if(banishVictim)API.banish(h(eq),'response');pass();
 ok('Truck '+defending+' '+banishVictim+' '+full+' resolution',banishVictim?h(eq).zone==='banish':full?h(eq).zone==='grave':h(eq).zone==='sz'&&h(eq).p===0&&eq.owner===1&&curATK(c)===1300,gameState.systemFault||curATK(c));
 replay('Truck '+defending+' '+banishVictim);
}
truck();truck(true);truck(false,true);truck(false,false,true);truck();
API.negateEffectUntil(h(c),'endTurn','test');ok('Truck negation suspends gain and retains attachment',curATK(c)===1000&&eq.equipTo.uid===c.uid);
replay('Truck continuous negation');
fresh();c=mk('トラックロイド');eq=mk('トラックロイド',1);gameState.players[0].mz=[c];gameState.players[1].mz=[eq];gameState.phase='battle';baselineA();requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});pass();
ok('Truck mutual battle destruction does not trigger',!EVT_V2_STATE&&h(c).zone==='grave'&&h(eq).zone==='grave');

for(const name of ['ザ・キックマン','凶悪犯－チョップマン'])for(const mode of ['empty','non-equip','full']){
 fresh();c=mk(name);gameState.players[0].mz=[c];
 if(mode!=='empty')gameState.players[0].grave=[mk(mode==='non-equip'?'サイクロン':'団結の力')];
 if(mode==='full')gameState.players[0].sz=Array.from({length:5},()=>mk('サイクロン',0,'down'));
 baselineA();const event=name==='ザ・キックマン'?'onSpecialSummon':'onFlip';
 ok(name+' negative '+mode,!collectHandlers(event,{card:c,player:0,flipSummon:true}).some(x=>x.card===c));
}

for(const mode of ['negated','target-down']){
 ({c,eq}=normal('ドラグニティ－レギオン','ドラグニティ－ファランクス',true));const target=gameState.players[1].mz[0];eventPickV2(0);pick(eq);pass();activate(c);pick(eq);pick(target);
 if(mode==='negated')API.negateEffectUntil(h(c),'endTurn','response');else act({type:'FX_SET_STATE',player:1,zone:'mz',index:0,face:'down',pos:'def'});
 pass();ok('Legion '+mode+': cost remains paid, target not destroyed',h(eq).zone==='grave'&&h(target).zone==='mz');replay('Legion '+mode);
}
ok('Astra01 no lost registry continuation',choiceStatsV49().lostContinuation===0);
`);
