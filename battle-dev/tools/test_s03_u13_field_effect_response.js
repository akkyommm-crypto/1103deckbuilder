/* S03-U13 C-S03-10 FIELD_EFFECT_RESPONSE_REACHABILITY
   Requirement: a face-up Continuous Trap's Spell Speed 2 on-field effect is offered in chain windows and response (POINT)
   windows when it is legal, so a player can use it on the opponent's turn.
   Before the fix: hasFieldActivatableEffect() admitted scripted face-up S/T only with legacy fieldIgnition, so these effects were
   never listed, and the default chain mode auto-passes when nothing is listed.
   U12 (Spell Speed >= 2 for responses) must already be in place so Spell Speed 1 spells stay out.
   Every card named here is TESTED or GENERIC_OK (checklist: no IMPLEMENTED/PARTIAL/ENGINE_GAP names, comments included). */
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
function listed(list,c){return list.some(x=>x.card&&x.card.uid===c.uid);}
function ss1Link(){return {chainId:1,player:0,name:'調和の宝札',ss:1,cardId:findCardIndex('調和の宝札'),uid:null,from:'sz',index:0,prepared:true,targets:[],selection:[]};}
function faceUpFor(p,name){const c=mk(name,p);c.face='up';gameState.players[p].sz.push(c);return c;}
function replay(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a));}
`;

harness(COMMON+String.raw`
/* ===== 零式魔導粉砕機 (unified ignition): chain response on the opponent's turn ===== */
fresh();
let crusher=faceUpFor(1,'零式魔導粉砕機');gameState.players[1].hand=[mk('サイクロン',1)];gameState.activePlayer=0;baselineA();
ok('零式魔導粉砕機 effect is legal from the face-up card (a Spell in hand)',strictScriptLegalityV2('零式魔導粉砕機',1,'sz',0,{}).ok,JSON.stringify(strictScriptLegalityV2('零式魔導粉砕機',1,'sz',0,{})));
gameState.chain=[ss1Link()];gameState.chainWindow={priority:1,passes:0};
let list=getChainResponsesV2(1);
ok('face-up 零式魔導粉砕機 is offered as a chain response on the opponent\'s Spell Speed 1 link',listed(list,crusher),JSON.stringify(list.map(x=>x.db.n)));

/* ===== 強制終了 (declared; its ACTIVATE effect is the on-field effect): attack-declaration response window ===== */
fresh();
let forced=faceUpFor(1,'強制終了');faceUpFor(1,'サイクロン');
const atk=mk('セイバーザウルス');gameState.players[0].mz=[atk];gameState.players[1].mz=[mk('ジェネティック・ワーウルフ',1)];
gameState.activePlayer=0;gameState.phase='battle';baselineA();
list=pointResponsesV27(1,{kind:'attack'});
ok('face-up 強制終了 is offered in the opponent\'s Battle Phase response window when another own card can be sent',listed(list,forced),JSON.stringify(list.map(x=>x.db.n)));

/* ===== 木遁封印式 (legacy declared): chain response ===== */
fresh();
let moku=faceUpFor(1,'木遁封印式');gameState.players[1].mz=[mk('セイバーザウルス',1)];gameState.players[0].grave=[mk('サイクロン'),mk('サイクロン')];
gameState.activePlayer=0;baselineA();
const mokuLegal=strictScriptLegalityV2('木遁封印式',1,'sz',0,{});
gameState.chain=[ss1Link()];gameState.chainWindow={priority:1,passes:0};
list=getChainResponsesV2(1);
ok('face-up 木遁封印式 with an EARTH monster and opponent GY cards is offered as a chain response (legality '+mokuLegal.ok+')',!mokuLegal.ok||listed(list,moku),JSON.stringify({legal:mokuLegal,list:list.map(x=>x.db.n)}));

/* ===== negative controls ===== */
fresh();
let lineage=faceUpFor(1,'正統なる血統');gameState.activePlayer=0;baselineA();
gameState.chain=[ss1Link()];gameState.chainWindow={priority:1,passes:0};
ok('control: a face-up 正統なる血統 (its ACTIVATE is the card activation) is not re-offered',!listed(getChainResponsesV2(1),lineage));
fresh();
let valhalla=faceUpFor(1,'神の居城－ヴァルハラ');gameState.players[1].hand=[mk('もけもけ',1)];gameState.activePlayer=0;baselineA();
gameState.chain=[ss1Link()];gameState.chainWindow={priority:1,passes:0};
ok('control (U12): face-up ヴァルハラ (Spell Speed 1) is still not a chain response',!listed(getChainResponsesV2(1),valhalla));

/* ===== the offered response actually activates ===== */
fresh();
crusher=faceUpFor(1,'零式魔導粉砕機');const spell=mk('サイクロン',1);gameState.players[1].hand=[spell];gameState.activePlayer=0;baselineA();
const lp0=gameState.players[0].lp;
duelActivateResponseV2(1,'sz',0);
for(let k=0;k<4;k++){const pc=pendingChoiceV49(gameState);if(pc){const i=pc.candidates.findIndex(x=>x.uid===spell.uid);__choicePickV49(i<0?0:i);continue;}if(drive()==='idle')break;}
ok('activating 零式魔導粉砕機 from the response list discards the Spell and deals 500',gameState.players[0].lp===lp0-500&&gameState.players[1].grave.some(c=>c.uid===spell.uid),JSON.stringify({lp:gameState.players[0].lp,grave:gameState.players[1].grave.map(cardName)}));
replay('零式魔導粉砕機 response');
`);
