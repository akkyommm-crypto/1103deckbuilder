/* Codex U548+: real hand activation and legal turn progression on the existing fixed-seed harness. */
module.exports=require('./codex_equip_test_common')+String.raw`
function castActual(p,c){const hit=h(c);if(hit.zone==='hand'){if(p!==gameState.activePlayer)return 'wrong-player';duelActivateFromHand(hit.index);return drive();}return useCard(p,c);}
function nextMainActual(){phase('end');turn();return phase('main1');}
function cardLinks(name){return V41_ACTION_JOURNAL.filter(x=>x.action.type==='CHAIN_ADD'&&x.action.name===name).length;}
`;
