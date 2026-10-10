/* S03-U68 C-S03-27 ACTIVATION_NEGATED_RELEASE secondary.
   Requirement: closes S03-U34's own "② Remaining" list of "1ターンに1枚しか発動できない" cards left
   undeclared: オーバー・レンチ, 無欲な壺, 限定解除 (new scripts, were NOT_STARTED), 魔力掌握 (was
   AUTO_DECK_TABLE coarse, now a real script). Also fixes a real bug in the already-scripted 黒羽の宝札: it
   set noSpecialSummon in cost() (unconditionally, before the chain even forms) instead of resolve() like
   every other C-S03-27 card (強欲で謙虚な壺 itself), so a negated activation still permanently locked
   Special Summons for the rest of the turn.
   Every card named here is TESTED or GENERIC_OK: ワイト, もけもけ, 死者蘇生, 天罰. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
ASK_CHAIN=false;
function nm(c){return c?cardName(c):null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;}
function drive(){for(let i=0;i<300;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(EVT_V2_STATE)return 'evt';
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function settle(){for(let k=0;k<30;k++){const r=drive();if(r==='evt'){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank];if(g&&g.length)eventPickV2(0);else eventSkipGroupV2();continue;}if(r==='choice'){__choicePickV49(0);continue;}return r;}return 'loop';}
function zoneOf(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function handIdx(p,name){const i=gameState.players[p].hand.findIndex(c=>nm(c)===name);if(i<0)throw Error(name+' not in hand');return i;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));return pkg;}
function pickUid(uid){for(let k=0;k<4&&pendingChoiceV49(gameState);k++){const pc=pendingChoiceV49(gameState);const i=pc.candidates.findIndex(x=>x.uid===uid);__choicePickV49(i<0?0:i);}}
function pickYes(){const pc=pendingChoiceV49(gameState);if(!pc)return false;const i=pc.candidates.findIndex(x=>x.value===true);__choicePickV49(i<0?0:i);return true;}
function endPhase(){requestProcessorV27(PROCESSOR_V27.PHASE,{to:'end'});settle();}

/* ===== A. オーバー・レンチ: real activation doubles ATK/DEF, real End Phase return to hand. ===== */
fresh();
const owz=mk('ゼンマイウォリアー',0);gameState.players[0].mz=[owz];
const ow=mk('オーバー・レンチ',0,'down');ow.setTurn=gameState.turn-1;gameState.players[0].sz=[ow];
gameState.activePlayer=0;gameState.phase='main1';baselineA();
duelActivateFromZone(0,'sz',0);
pickUid(owz.uid);
settle();
let pkg=audit('A オーバー・レンチ activation');
ok('A: オーバー・レンチ doubles the ATK/DEF of ゼンマイウォリアー for real (1200/1800 -> 2400/3600)',
  curATK(owz)===2400&&curDEF(owz)===3600,JSON.stringify({atk:curATK(owz),def:curDEF(owz)}));
endPhase();
ok('A: at the real End Phase, ゼンマイウォリアー returns to hand',
  zoneOf(owz)==='hand',JSON.stringify({zone:zoneOf(owz),hand:gameState.players[0].hand.map(nm)}));
audit('A オーバー・レンチ end phase return');

/* ===== B. オーバー・レンチ: negated activation refunds the once-per-turn count. ===== */
fresh();
const owz2=mk('ゼンマイソルジャー',0);gameState.players[0].mz=[owz2];
const ow2=mk('オーバー・レンチ',0,'down');ow2.setTurn=gameState.turn-1;gameState.players[0].sz=[ow2];
const ow2b=mk('オーバー・レンチ',0,'down');ow2b.setTurn=gameState.turn-1;gameState.players[0].sz.push(ow2b);
const warn=mk('神の宣告',1,'down');warn.setTurn=gameState.turn-1;gameState.players[1].sz=[warn];
gameState.players[1].lp=8000;
gameState.activePlayer=0;gameState.phase='main1';baselineA();
duelActivateFromZone(0,'sz',0);
for(let i=0;i<10&&pendingChoiceV49(gameState);i++)pickUid(owz2.uid);
const respB=gameState.chainWindow&&gameState.chain.length?getChainResponsesV2(1):[];
ok('B setup: 神の宣告 is offered as a real chain response to オーバー・レンチ',respB.some(x=>x.card===warn),JSON.stringify(respB.map(x=>x.db.n)));
duelActivateResponseV2(1,'sz',0);
settle();
pkg=audit('B オーバー・レンチ negated');
ok('B: 神の宣告 negates the first オーバー・レンチ activation for real (paying half LP), no ATK/DEF change',
  gameState.players[1].lp===4000&&curATK(owz2)===1800&&curDEF(owz2)===1200,
  JSON.stringify({lp1:gameState.players[1].lp,atk:curATK(owz2),def:curDEF(owz2)}));
const ow2bLoc=locateCardAnyV4(ow2b);
const L=ow2bLoc?strictScriptLegalityV2('オーバー・レンチ',0,ow2bLoc.zone,ow2bLoc.index,{}):{ok:false,reason:'not found'};
ok('B: after the negation, the second オーバー・レンチ copy is still legal (count refunded, 10/05/19-style ruling)',
  L.ok,JSON.stringify(L));

/* ===== C. 無欲な壺: real activation returns 2 GY cards to Deck (own + opponent), then banishes itself. ===== */
fresh();
const muyoku=mk('無欲な壺',0);gameState.players[0].hand=[muyoku];
gameState.players[0].grave=[mk('ワイト',0)];
gameState.players[1].grave=[mk('もけもけ',1)];
gameState.activePlayer=0;gameState.phase='main1';baselineA();
const deck0Before=gameState.players[0].deck.length, deck1Before=gameState.players[1].deck.length;
duelActivateFromHand(handIdx(0,'無欲な壺'));
settle();
pkg=audit('C 無欲な壺');
ok('C: both GY cards return to their owner Deck and 無欲な壺 is banished (not sent to the GY)',
  gameState.players[0].grave.length===0&&gameState.players[1].grave.length===0&&
  gameState.players[0].deck.length===deck0Before+1&&gameState.players[1].deck.length===deck1Before+1&&
  zoneOf(muyoku)==='banish',
  JSON.stringify({grave0:gameState.players[0].grave.length,grave1:gameState.players[1].grave.length,deck0:gameState.players[0].deck.length,deck1:gameState.players[1].deck.length,muyoku:zoneOf(muyoku)}));

/* ===== D. 限定解除: real activation pays 1000 LP and Special Summons a Ritual Monster from hand;
   it cannot attack for real, and is destroyed at the real End Phase. ===== */
fresh();
const gentei=mk('限定解除',0);const ritual=mk('イビリチュア・ガストクラーケ',0);
gameState.players[0].hand=[gentei,ritual];gameState.players[0].lp=8000;
gameState.activePlayer=0;gameState.phase='main1';baselineA();
duelActivateFromHand(handIdx(0,'限定解除'));
pickUid(ritual.uid);
settle();
pkg=audit('D 限定解除 summon');
ok('D: 限定解除 pays 1000 LP and Special Summons イビリチュア・ガストクラーケ for real',
  gameState.players[0].lp===7000&&zoneOf(ritual)==='mz',JSON.stringify({lp:gameState.players[0].lp,zone:zoneOf(ritual)}));
const actsD=getLegalZoneActions(0,'mz',gameState.players[0].mz.findIndex(c=>c.uid===ritual.uid)).map(a=>a.id);
ok('D: the Special Summoned Ritual Monster cannot attack for real',!actsD.includes('attack'),JSON.stringify(actsD));
endPhase();
ok('D: at the real End Phase, it is destroyed',zoneOf(ritual)==='grave',JSON.stringify({zone:zoneOf(ritual)}));
audit('D 限定解除 end phase destroy');

/* ===== E. 魔力掌握: real activation places a Spell Counter, then optionally searches another copy. ===== */
fresh();
const stone=mk('漆黒のパワーストーン',0);gameState.players[0].sz=[stone];
const grasp=mk('魔力掌握',0);gameState.players[0].hand=[grasp];
gameState.players[0].deck=[mk('魔力掌握',0,'down')];
gameState.activePlayer=0;gameState.phase='main1';baselineA();
duelActivateFromHand(handIdx(0,'魔力掌握'));
drive();
{const pc=pendingChoiceV49(gameState);const i=pc.candidates.findIndex(x=>x.uid===stone.uid);__choicePickV49(i<0?0:i);}
drive();
ok('E: 魔力掌握 opens a yes/no choice for the Deck search after placing the counter',
  pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).kind==='yesno',JSON.stringify(pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).title));
pickYes();
settle();
pkg=audit('E 魔力掌握');
ok('E: a real Spell Counter is placed on 漆黒のパワーストーン and another 魔力掌握 is searched from the Deck',
  (stone.counters&&stone.counters['魔力'])===1&&gameState.players[0].hand.some(c=>nm(c)==='魔力掌握'),
  JSON.stringify({counter:stone.counters&&stone.counters['魔力'],hand:gameState.players[0].hand.map(nm)}));

/* ===== F. 黒羽の宝札: negated activation does NOT lock Special Summons for the rest of the turn (the bug
   fix — previously the cost-time flag stuck around even after a negation). ===== */
fresh();
const kurohane=mk('黒羽の宝札',0);const bf=mk('BF－精鋭のゼピュロス',0);
gameState.players[0].hand=[kurohane,bf];gameState.players[0].deck=[mk('ワイト',0,'down'),mk('もけもけ',0,'down')];
const warn2=mk('神の宣告',1,'down');warn2.setTurn=gameState.turn-1;gameState.players[1].sz=[warn2];
gameState.players[1].lp=8000;
gameState.activePlayer=0;gameState.phase='main1';baselineA();
duelActivateFromHand(handIdx(0,'黒羽の宝札'));
for(let i=0;i<10&&pendingChoiceV49(gameState);i++)pickUid(bf.uid);
const respF=gameState.chainWindow&&gameState.chain.length?getChainResponsesV2(1):[];
ok('F setup: 神の宣告 is offered as a real chain response to 黒羽の宝札',respF.some(x=>x.card===warn2),JSON.stringify(respF.map(x=>x.db.n)));
duelActivateResponseV2(1,'sz',0);
settle();
pkg=audit('F 黒羽の宝札 negated');
ok('F: 神の宣告 negates 黒羽の宝札 for real (paying half LP); no cards are drawn',
  gameState.players[1].lp===4000&&gameState.players[0].deck.length===2,
  JSON.stringify({lp1:gameState.players[1].lp,deck:gameState.players[0].deck.length}));
ok('F: after the negation, noSpecialSummon does NOT persist (the bug fix — resolve() never ran)',
  !gameState.players[0].temporaryFlags||!gameState.players[0].temporaryFlags.noSpecialSummon,
  JSON.stringify({flags:gameState.players[0].temporaryFlags}));
const Lf=v46GlobalSpecialSummonRestrictionReason(0);
ok('F: a real Special Summon is not blocked by 黒羽の宝札 after its negation',!Lf,JSON.stringify(Lf||''));
`);
