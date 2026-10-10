/* S03-U91: 朱光の宣告者 (Herald of Orange Light) — priority #7's IMPLEMENTED-tier audit picked this up next
   after S03-U90 (qty=3, agent main deck). Real text (confirmed via Yugipedia): "When your opponent
   activates a monster effect (Quick Effect): You can send this card and 1 other Fairy monster from your
   hand to the GY; negate the activation, and if you do, destroy it." Reading the existing implementation
   (cards/30_themes_b.js) surfaced the exact same ENGINE_MISSING bug class as S03-U86 (盗賊の七つ道具/
   ナチュル・パルキオン): the old implementation never read ctx.event (the S03-U18/C-S03-15
   activation-response mechanism every other "negate a card's activation" card uses) and instead freely
   picked ANY face-up monster on the field as a manual target, with no gating on whether the opponent had
   actually just activated a monster effect at all. Fixed to the established ctx.event +
   API.negateChainLink pattern (matching ジャスティス・ブリンガー's e.kind==='monster' condition check) and
   declared in ACTIVATION_RESPONSE_S03. Promotes 朱光の宣告者 IMPLEMENTED->TESTED. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;}
function drive(){for(let i=0;i<300;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){
    const st=EVT_V2_STATE,g=st.groups[st.rank]||[];
    if(g.length) return 'evt'; else eventSkipGroupV2();
    continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function settle(){for(let k=0;k<16;k++){const r=drive();if(r!=='idle'&&r!=='loop')return r;return r;}return 'loop';}
function chainNames(){return gameState.chain.map(l=>l.name);}
function responses(p){return getChainResponsesV2(p).map(x=>x.db.n);}
function zoneOf(uid){const h=findCardByUid(uid);return h?h.zone:null;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,260));}
`;

/* ===== A. 朱光の宣告者 really responds to a real opponent Monster Effect activation (クレボンス's own real
   attack-response Quick Effect, activated during a real attack declaration): negates and destroys it, really
   paying the real cost (discarding itself + 1 real Fairy from hand). クレボンス's own 800 LP cost is still
   really paid even though its effect is negated (matching the real rule that a paid cost is not undone by
   negation). ===== */
harness(COMMON+String.raw`
fresh();
gameState.activePlayer=0;gameState.phase='battle';
const attacker=mk('ワイト',0);
gameState.players[0].mz=[attacker];
const herald=mk('朱光の宣告者',0), angel=mk('もけもけ',0);
gameState.players[0].hand=[herald,angel];
const kelbek=mk('クレボンス',1);
gameState.players[1].mz=[kelbek];
gameState.players[1].lp=8000;
baselineA();
ok('A: with no chain open, 朱光の宣告者 is not a legal activation',!strictScriptLegalityV2('朱光の宣告者',0,'hand',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('朱光の宣告者',0,'hand',0,{})));
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});
ok('A: the real defending player has クレボンス (a real monster effect) as a legal real chain response to the real attack declaration',
  responses(1).includes('クレボンス'),JSON.stringify(responses(1)));
duelActivateResponseV2(1,'mz',0);
ok('A: クレボンス really joins the real chain (kind=monster); P1’s real chain responses now list 朱光の宣告者',
  chainNames().join()==='クレボンス'&&responses(0).includes('朱光の宣告者'),JSON.stringify({chain:chainNames(),resp:responses(0)}));
duelActivateResponseV2(0,'hand',0);
if(pendingChoiceV49(gameState)){
  const pc=pendingChoiceV49(gameState);
  const i=pc.candidates.findIndex(x=>{const h=x.uid!=null&&findCardByUid(x.uid);return h&&nm(h.card)==='もけもけ';});
  __choicePickV49(i>=0?i:0);
}
settle();
ok('A: resolution really negates and destroys クレボンス; the real attack is not negated by クレボンス (its own effect never resolved)',
  gameState.players[1].grave.some(c=>nm(c)==='クレボンス')&&!gameState.players[1].mz.length&&!gameState.chain.length,
  JSON.stringify({p1mz:gameState.players[1].mz.map(nm),p1grave:gameState.players[1].grave.map(nm)}));
ok('A: クレボンス’s own real 800 LP cost is still really paid even though its effect was negated (a real paid cost is not undone by negation)',
  gameState.players[1].lp===7200,JSON.stringify({lp:gameState.players[1].lp}));
ok('A: 朱光の宣告者 and the real discarded Fairy-Type cost really resolve to the real grave',
  gameState.players[0].grave.some(c=>nm(c)==='朱光の宣告者')&&gameState.players[0].grave.some(c=>nm(c)==='もけもけ')
  &&!gameState.players[0].hand.length,
  JSON.stringify({p0grave:gameState.players[0].grave.map(nm),p0hand:gameState.players[0].hand.map(nm)}));
audit('A');
`);

/* ===== B. Negative control: with no Fairy-Type monster in hand to pay the real cost, 朱光の宣告者 is
   correctly excluded from the real chain responses even while a real opponent Monster Effect is on the
   chain. ===== */
harness(COMMON+String.raw`
fresh();
gameState.activePlayer=0;gameState.phase='battle';
const attacker=mk('ワイト',0);
gameState.players[0].mz=[attacker];
const herald=mk('朱光の宣告者',0), nonFairy=mk('青眼の白龍',0);
gameState.players[0].hand=[herald,nonFairy];
const kelbek=mk('クレボンス',1);
gameState.players[1].mz=[kelbek];
gameState.players[1].lp=8000;
baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});
duelActivateResponseV2(1,'mz',0);
ok('B: with no real Fairy-Type monster in hand, 朱光の宣告者 is correctly excluded from the real chain responses',
  !responses(0).includes('朱光の宣告者'),JSON.stringify(responses(0)));
`);

/* ===== C. Negative control: a real opponent Spell activation (not a monster effect) does not offer 朱光の
   宣告者 as a response. ===== */
harness(COMMON+String.raw`
fresh();
gameState.activePlayer=1;gameState.phase='main1';
const herald=mk('朱光の宣告者',0), angel=mk('もけもけ',0);
gameState.players[0].hand=[herald,angel];
gameState.players[0].sz=[mk('強欲な壺',0,'down')];
gameState.players[1].hand=[mk('サイクロン',1)];
baselineA();
duelActivateFromHand(0);
if(pendingChoiceV49(gameState)) __choicePickV49(0);
ok('C: a real opponent Spell activation (not a monster effect) does not offer 朱光の宣告者 as a response',
  chainNames().join()==='サイクロン'&&!responses(0).includes('朱光の宣告者'),
  JSON.stringify({chain:chainNames(),resp:responses(0)}));
`);
