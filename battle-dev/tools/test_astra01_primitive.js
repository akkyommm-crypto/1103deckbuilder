require('./astra_harness')(String.raw`
function setupE(eqName='ドラグニティ－ファランクス',owner=0){
 resetA();const host=mk('ドラグニティ－ドゥクス'),eq=mk(eqName,owner);
 gameState.players[0].mz=[host];gameState.players[owner].grave=[eq];baselineA();return {host,eq};
}
function auditE(label){const result=v44ReplayAuditPackage(v41ReplayPackage(gameState));ok('Astra01 Replay '+label,result.ok,JSON.stringify(result));}
let pair=setupE(),before=v41StateDigest(gameState);
ok('Astra01 positive: grave monster equip',API.equipFromGrave(0,h(pair.eq),h(pair.host),'test',pair.host.uid));
ok('Astra01 atomic: exactly one move action',V41_ACTION_JOURNAL.length===1&&V41_ACTION_JOURNAL[0].action.type==='FX_EQUIP_FROM_GRAVE_V31');
ok('Astra01 state: same object, monster identity and symmetric UID link',h(pair.eq).zone==='sz'&&pair.eq.v46MonsterEquip&&pair.eq.equipTo.uid===pair.host.uid&&pair.host.equippedBy[0]===pair.eq.uid);
ok('Astra01 not Special Summon',!pair.eq.specialSummoned&&!pair.eq.summonProvenance&&evs('onSpecialSummon').length===0);
ok('Astra01 not Spell activation',evs('onActivateSuccess').length===0);
let evt=evs('onEquipAttached')[0];
ok('Astra01 event: owner/controller/source/zone/turn',evt&&evt.owner===0&&evt.controller===0&&evt.sourceUid===pair.host.uid&&evt.fromPlayer===0&&evt.from==='grave'&&evt.turn===5&&evt.byPlayer===0&&evt.targetPlayer===0);
ok('Astra01 event: only JSON scalar identities',evt&&JSON.stringify(evt).indexOf('ドラグニティ')<0&&!evt.card);
auditE('attach');const savedJournal=v41ReplayPackage(gameState),after=v41StateDigest(gameState);undo();
ok('Astra01 Undo: exact pre-attach digest',v41StateDigest(gameState)===before);
redo();ok('Astra01 Redo: exact attached digest',v41StateDigest(gameState)===after);
let saved=JSON.stringify(gameState);gameState=JSON.parse(saved);
ok('Astra01 SaveLoad: links readable',API.equippedMonster(h(findCardByUid(pair.eq.uid).card)).card.uid===pair.host.uid&&v41StateDigest(gameState)===after);
ok('Astra01 SaveLoad: restore complete Journal',v41RestoreJournalPackage(JSON.parse(JSON.stringify(savedJournal)),gameState)&&V41_ACTION_JOURNAL.length>0);
auditE('save/load and redo');
const corrupt=JSON.parse(JSON.stringify(savedJournal));corrupt.actions[0].action.sourceUid=999999;
ok('Astra01 digest: altered equip source provenance rejected',!v44ReplayAuditPackage(corrupt).ok);
for(const kind of ['full','face-down','hand','spell-not-equip','missing-host','wrong-from-player','wrong-equipment-uid']){
 pair=setupE(kind==='spell-not-equip'?'サイクロン':'ドラグニティ－ファランクス');
 if(kind==='full')gameState.players[0].sz=Array.from({length:5},()=>mk('サイクロン'));
 if(kind==='face-down')pair.host.face='down';
 if(kind==='hand'){gameState.players[0].grave=[];gameState.players[0].hand=[pair.eq];}
 baselineA();before=v41StateDigest(gameState);
 let result;
 if(kind==='missing-host'||kind==='wrong-from-player'||kind==='wrong-equipment-uid'){
   applyAction(gameState,{type:'FX_EQUIP_FROM_GRAVE_V31',player:0,fromPlayer:kind==='wrong-from-player'?1:0,equipUid:kind==='wrong-equipment-uid'?999:pair.eq.uid,targetUid:kind==='missing-host'?999:pair.host.uid});result=false;
 }else result=API.equipFromGrave(0,h(pair.eq),h(pair.host),'test');
 ok('Astra01 negative '+kind+': reject atomically',result===false&&v41StateDigest(gameState)===before);
}
pair=setupE('団結の力');const eqScript=CARD_SCRIPTS['団結の力'];
CARD_SCRIPTS['団結の力']=Object.assign({},eqScript,{equipSpec:{canEquip:()=>false}});before=v41StateDigest(gameState);
ok('Astra01 negative: existing equipSpec enforced',!API.equipFromGrave(0,h(pair.eq),h(pair.host),'test')&&v41StateDigest(gameState)===before);
CARD_SCRIPTS['団結の力']=eqScript;
ok('Astra01 positive: grave Equip Spell',API.equipFromGrave(0,h(pair.eq),h(pair.host),'test'));
ok('Astra01 Equip Spell retains spell representation',!pair.eq.v46MonsterEquip&&dbOf(pair.eq).k==='s');
const bonus=curATK(pair.host)-dbOf(pair.host).atk;
ok('Astra01 consumer: existing Equip Spell stat effect works',bonus>0);
API.negateEffectUntil(h(pair.eq),'endTurn','test');
ok('Astra01 lifecycle: source negation keeps relation',pair.eq.equipTo.uid===pair.host.uid&&API.equipCount(h(pair.host))===1);
auditE('spell and negation');
pair=setupE('ワイト',1);API.equipFromGrave(0,h(pair.eq),h(pair.host),'test');
ok('Astra01 owner/controller differ',pair.eq.owner===1&&pair.eq.controller===0);
act({type:'FX_CONTROL',player:0,zone:'mz',index:0,toPlayer:1,reason:'test'});
ok('Astra01 control: host query follows UID',pair.eq.equipTo.p===1&&API.equippedMonster(h(pair.eq)).card.uid===pair.host.uid&&h(pair.eq).p===0);
act({type:'FX_SET_STATE',player:1,zone:'mz',index:0,face:'down',pos:'def',reason:'test'});
ok('Astra01 face-down: equip routes to original owner grave',h(pair.eq).p===1&&h(pair.eq).zone==='grave');
ok('Astra01 face-down: no ghost links',!pair.eq.equipTo&&!pair.eq.v46MonsterEquip&&!pair.eq.equipUid&&pair.host.equippedBy.length===0);
ok('Astra01 rule cleanup: not opponent effect',pair.eq.graveInfo.rule==='equip'&&pair.eq.graveInfo.byPlayer===null);
ok('Astra01 rule cleanup: grave arrival emitted',evs('onSendToGrave').some(e=>e.uid===pair.eq.uid&&e.reason==='equip-rule'));
auditE('cross-owner/control/face-down');
for(const target of ['host','equipment'])for(const type of ['FX_TO_GRAVE','FX_BOUNCE','FX_BANISH']){
 pair=setupE('ワイト',1);API.equipFromGrave(0,h(pair.eq),h(pair.host),'test');
 const at=h(target==='host'?pair.host:pair.eq);
 act({type,player:at.p,zone:at.zone,index:at.index,byDestroy:true,reason:'test'});
 ok('Astra01 departure '+target+' '+type+': relations clear',!pair.eq.equipTo&&!pair.eq.v46MonsterEquip&&!(pair.host.equippedBy||[]).length);
 ok('Astra01 departure '+target+' '+type+': owner retained',h(pair.eq).p===1);
 auditE(target+' '+type);
}
pair=setupE();API.equipFromGrave(0,h(pair.eq),h(pair.host),'test');API.detachEquip(h(pair.eq),'test');
ok('Astra01 explicit detach: same sz card unlinked',h(pair.eq).zone==='sz'&&!pair.eq.equipTo&&!(pair.host.equippedBy||[]).length);
// Real card tests use the resolution batch for revival. Primitive Action test
// verifies the transition independently without pretending to resolve a card.
act({type:'FX_SPECIAL_SUMMON',player:0,from:'sz',index:h(pair.eq).index,pos:'atk',reason:'primitive'});
ok('Astra01 detached monster resumes monster representation',h(pair.eq).zone==='mz'&&!pair.eq.v46MonsterEquip&&!pair.eq.equipTo);
auditE('detach and summon action');
ok('Astra01 serialization: existing v15 checker',assertEquipStateSerializableV15(gameState)===null);
ok('Astra01 no independent mutable registry',gameState.equipV31===undefined&&gameState.equipLogV31===undefined);
`);
