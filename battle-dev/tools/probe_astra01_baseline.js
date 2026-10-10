// Historical probe. Run against Cycle66; never erase this evidence after unlock.
require('./astra_harness')(String.raw`
for(const [source,eqName] of [['ドラグニティ－ドゥクス','ドラグニティ－ファランクス'],['ザ・キックマン','団結の力'],['トラックロイド','ワイト']]){
 resetA();const src=mk(source),eq=mk(eqName);gameState.players[0].mz=[src];gameState.players[0].grave=[eq];baselineA();
 const before=v41StateDigest(gameState),a=API.equipMonster(0,h(eq),h(src),'probe'),b=API.equipSpell(h(eq),h(src),'probe');
 ok('Cycle66 historical '+source+': both existing APIs reject grave source',a===false&&b===false);
 ok('Cycle66 historical '+source+': no move/action occurred',h(eq).zone==='grave'&&v41StateDigest(gameState)===before&&V41_ACTION_JOURNAL.length===0);
}
resetA();const host=mk('ワイト'),eq=mk('ドラグニティ－ファランクス');gameState.players[0].mz=[host,eq];baselineA();
ok('Cycle66 historical v46 field equip works',API.equipMonster(0,h(eq),h(host),'probe'));
ok('Cycle66 historical existing equip state fields exist',eq.v46MonsterEquip&&eq.equipTo.uid===host.uid&&host.equippedBy.includes(eq.equipUid));
console.log('OBSERVE baseline equip events',JSON.stringify(evs('onEquipAttached')));
act({type:'FX_CONTROL',player:0,zone:'mz',index:0,toPlayer:1,reason:'probe'});
console.log('OBSERVE baseline control host lookup',!!API.equippedMonster(h(eq)),JSON.stringify(eq.equipTo));
act({type:'FX_SET_STATE',player:1,zone:'mz',index:0,face:'down',pos:'def',reason:'probe'});
console.log('OBSERVE baseline face-down source zone',h(eq).zone);
`);
