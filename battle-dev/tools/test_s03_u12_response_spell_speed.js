/* S03-U12 C-S03-09 CHAIN_RESPONSE_SPELL_SPEED
   Requirement: chain windows and POINT (response) windows only offer Spell Speed 2+ activations.
   Spell Speed 1 effects (the on-field effect of a face-up Continuous/Field Spell) are activated only in an open game state.
   Measured before the fix (VS1 build, real legality): face-up 神の居城－ヴァルハラ and a Field Spell with an on-field ignition effect, with their conditions met, were
   offered in the opponent's chain window on a Spell Speed 1 link and in the POINT window after the opponent's Normal Summon.
   Cause: getChainResponsesV2 filtered Spell/Trap responses only by ss<top.
   Named cards are TESTED or GENERIC_OK; the invariant sweep reads script names at runtime. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;}
function drive(){for(let i=0;i<200;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(EVT_V2_STATE)return 'evt';
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function zoneOf(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function listed(list,c){return list.some(x=>x.card&&x.card.uid===c.uid);}
function ss1Link(){return {chainId:1,player:0,name:'調和の宝札',ss:1,cardId:findCardIndex('調和の宝札'),uid:null,from:'sz',index:0,prepared:true,targets:[],selection:[]};}
function replay(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a));}
function valhallaFor(p){const v=mk('神の居城－ヴァルハラ',p);v.face='up';gameState.players[p].sz=[v];const fairy=mk('もけもけ',p);gameState.players[p].hand=[fairy];return {v,fairy};}
`;

harness(COMMON+String.raw`
/* ===== chain window: opponent's Spell Speed 1 link ===== */
fresh();
let s=valhallaFor(1);let cyc=mk('サイクロン',1,'down');cyc.setTurn=gameState.turn-1;gameState.players[1].sz.push(cyc);
gameState.activePlayer=0;baselineA();
ok('ヴァルハラ effect legality alone would pass (condition met)',strictScriptLegalityV2('神の居城－ヴァルハラ',1,'sz',0,{}).ok);
gameState.chain=[ss1Link()];gameState.chainWindow={priority:1,passes:0};
let list=getChainResponsesV2(1);
ok('face-up ヴァルハラ (Spell Speed 1) is not offered in the opponent\'s chain window',!listed(list,s.v),JSON.stringify(list.map(x=>x.db.n)));
ok('control: a set Quick-Play サイクロン is still offered as a chain response',listed(list,cyc));

/* ===== POINT window after the opponent's Normal Summon ===== */
fresh();
s=valhallaFor(1);cyc=mk('サイクロン',1,'down');cyc.setTurn=gameState.turn-1;gameState.players[1].sz.push(cyc);
gameState.activePlayer=0;const saber=mk('セイバーザウルス');gameState.players[0].hand=[saber];baselineA();
doNormalSummon(0,'atk');
list=pointResponsesV27(1,{kind:'summon'});
ok('face-up ヴァルハラ is not offered in the summon response POINT window',!listed(list,s.v),JSON.stringify(list.map(x=>x.db.n)));
ok('control: the set サイクロン is still offered in that POINT window',listed(list,cyc));

/* ===== control: a set declared Continuous Trap card activation (Spell Speed 2) stays a chain response ===== */
fresh();
const ice=mk('アイスバーン',1,'down');ice.setTurn=gameState.turn-1;gameState.players[1].sz=[ice];gameState.activePlayer=0;baselineA();
gameState.chain=[ss1Link()];gameState.chainWindow={priority:1,passes:0};
ok('control: a set Continuous Trap (card activation, Spell Speed 2) is still offered',listed(getChainResponsesV2(1),ice));

/* ===== own open Main Phase: the Spell Speed 1 effect is still activatable ===== */
fresh();
s=valhallaFor(0);gameState.activePlayer=0;baselineA();
ok('in its controller\'s own open Main Phase the ヴァルハラ effect is offered',getLegalZoneActions(0,'sz',0).some(a=>a.id==='effect'));
duelActivateFromZone(0,'sz',0);
for(let k=0;k<4;k++){const pc=pendingChoiceV49(gameState);if(pc){const i=pc.candidates.findIndex(x=>x.uid===s.fairy.uid);__choicePickV49(i<0?0:i);continue;}if(drive()==='idle')break;}
ok('the effect resolves and Special Summons the Fairy',zoneOf(s.fairy)==='mz');
replay('ヴァルハラ own-turn effect');

/* ===== invariant sweep (name-free): no face-up Spell Speed 1 S/T effect is ever a chain response ===== */
const realLegal=strictScriptLegalityV2;const offenders=[];let checked=0;
try{
  strictScriptLegalityV2=()=>({ok:true,reason:''});
  for(const name of Object.keys(CARD_SCRIPTS)){
    const id=findCardIndex(name);if(id<0)continue;const db=CARD_DB[id];
    if(!db||db.k!=='s'||!['永続','フィールド'].includes(db.sub))continue;
    const sc=CARD_SCRIPTS[name];if(typeof sc.resolve!=='function')continue;
    fresh();const c=mk(name,1);c.face='up';
    if(db.sub==='フィールド')gameState.players[1].field=c;else gameState.players[1].sz=[c];
    gameState.activePlayer=0;baselineA();
    gameState.chain=[ss1Link()];gameState.chainWindow={priority:1,passes:0};
    if(listed(getChainResponsesV2(1),c))offenders.push(name);
    checked++;
  }
}finally{strictScriptLegalityV2=realLegal;}
ok('invariant: no face-up Continuous/Field Spell effect (Spell Speed 1) is listed as a chain response, even with legality forced ('+checked+' scripts)',offenders.length===0&&checked>50,offenders.join(','));
`);
