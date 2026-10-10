/* S03-U129: スケープ・ゴート (activation-turn summon lock, 4 zones, sheep not Tribute material) + 闇の誘惑 (sends the hand to the
   GY — not a discard; the banish choice is mandatory). Real DUEL path, Replay-audited. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function names(p,zn){return (gameState.players[p][zn]||[]).map(nm);}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function uid(c){return ensureCardUid(gameState,c);}
let PREFER=[];
function pick(){const q=pc();let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u);if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<400;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';}
function sheep(p){return (gameState.players[p].mz||[]).filter(c=>c&&c.token&&c.token.n==='羊トークン');}
function handActs(i){return getLegalHandActions(0,i).map(a=>a.id);}
`;

/* ===== A. activation legality ===== */
harness(COMMON+String.raw`
fresh();
gameState.players[0].hand=[mk('スケープ・ゴート',0),mk('ワイト',0)];
baselineA();
ok('A: legal with 5 free zones and no summon this turn',strictScriptLegalityV2('スケープ・ゴート',0,'hand',0,{}).ok===true);
doNormalSummon(1,'atk');drive();
ok('A: after a Normal Summon this turn → illegal',strictScriptLegalityV2('スケープ・ゴート',0,'hand',0,{}).ok===false&&/既にモンスターを召喚/.test(strictScriptLegalityV2('スケープ・ゴート',0,'hand',0,{}).reason));
fresh();
gameState.players[0].hand=[mk('スケープ・ゴート',0)];gameState.players[0].mz=[mk('ワイト',0,'up'),mk('ワイト',0,'up')];
baselineA();
ok('A: only 3 free zones → illegal',strictScriptLegalityV2('スケープ・ゴート',0,'hand',0,{}).ok===false&&/4つ空いていません/.test(strictScriptLegalityV2('スケープ・ゴート',0,'hand',0,{}).reason));
fresh();
gameState.players[0].hand=[mk('スケープ・ゴート',0),mk('死者蘇生',0)];gameState.players[0].grave=[mk('ワイト',0)];
baselineA();
duelActivateFromHand(1);drive();
ok('A: after a Special Summon this turn → illegal',gameState.players[0].mz.length===1&&strictScriptLegalityV2('スケープ・ゴート',0,'hand',0,{}).ok===false);
fresh();
const f=mk('ワイト',0,'down');f.pos='def';f.setTurn=3;
gameState.players[0].hand=[mk('スケープ・ゴート',0)];gameState.players[0].mz=[f];
baselineA();
doFlipUp(0,'mz',0,'atk');drive();
ok('A: after a Flip Summon this turn → illegal',f.face==='up'&&strictScriptLegalityV2('スケープ・ゴート',0,'hand',0,{}).ok===false);
audit('A');
`);

/* ===== B. after it resolves: 4 sheep; no Normal / Flip / Special Summon this turn; a Set is still allowed; next turn free ===== */
harness(COMMON+String.raw`
fresh();
const w=mk('ワイト',0),fd=mk('ワイトキング',0,'down');fd.pos='def';fd.setTurn=3;
gameState.players[0].hand=[mk('スケープ・ゴート',0),w,mk('死者蘇生',0)];gameState.players[0].grave=[mk('ワイト夫人',0)];
gameState.players[0].mz=[fd];
baselineA();
duelActivateFromHand(0);drive();
ok('B: 4 羊トークン in Defense Position',sheep(0).length===4&&sheep(0).every(c=>c.pos==='def'),JSON.stringify(names(0,'mz')));
const wi=gameState.players[0].hand.indexOf(w);
ok('B: Normal Summon is no longer offered',!handActs(wi).includes('normalSummon'),JSON.stringify(handActs(wi)));
TOASTS.length=0;doNormalSummon(wi,'atk');drive();
ok('B: a forced Normal Summon is refused',z(w)==='hand'&&TOASTS.some(t=>/スケープ・ゴート/.test(t)),JSON.stringify(TOASTS));
ok('B: Special Summon (死者蘇生) is refused',strictScriptLegalityV2('死者蘇生',0,'hand',gameState.players[0].hand.findIndex(c=>nm(c)==='死者蘇生'),{}).ok===false);
TOASTS.length=0;doFlipUp(0,'mz',gameState.players[0].mz.indexOf(fd),'atk');drive();
ok('B: a Flip Summon is refused',fd.face==='down'&&TOASTS.some(t=>/スケープ・ゴート/.test(t)),JSON.stringify({face:fd.face,t:TOASTS}));
audit('B');
/* next turn */
gameState.turn=6;act({type:'PASS_TURN'});act({type:'PASS_TURN'});
ok('B: the lock is gone after the turn',!gameState.players[0].temporaryFlags.noSummonS03);
`);

/* ===== C. the sheep cannot be Tributed for a Tribute Summon ===== */
harness(COMMON+String.raw`
fresh();
gameState.players[0].hand=[mk('スケープ・ゴート',0)];
baselineA();
duelActivateFromHand(0);drive();
ok('C: 羊トークン are not Tribute candidates',sheep(0).length===4&&!tributeCandidates(0).some(x=>x.card&&x.card.token&&x.card.token.n==='羊トークン'));
`);

/* ===== D. 闇の誘惑 ===== */
harness(COMMON+String.raw`
fresh();
/* 魔轟神獣ケルベラル (LIGHT): 「手札から墓地へ捨てられた場合」 — being sent to the GY is not a discard */
const a1=mk('魔轟神獣ケルベラル',0);
gameState.players[0].hand=[mk('闇の誘惑',0),a1];gameState.players[0].deck=[mk('サイクロン',0),mk('大嵐',0)];
baselineA();
duelActivateFromHand(0);
drive();
const types=v41ReplayPackage(gameState).actions.map(x=>x&&x.action&&x.action.type);
ok('D: no DARK monster → the whole hand (3 cards) is sent to the GY',gameState.players[0].hand.length===0&&z(a1)==='grave'&&names(0,'grave').filter(n=>n!=='闇の誘惑').length===3,JSON.stringify({hand:names(0,'hand'),g:names(0,'grave')}));
ok('D: it is a send (FX_HAND_SEND_GRAVE), not a discard — 魔轟神獣ケルベラル does not trigger',types.includes('FX_HAND_SEND_GRAVE')&&!types.includes('FX_DISCARD')&&z(a1)==='grave',JSON.stringify(types));
audit('D send');
fresh();
const dk=mk('暗黒界の狩人 ブラウ',0);
gameState.players[0].hand=[mk('闇の誘惑',0),dk];gameState.players[0].deck=[mk('ワイト',0),mk('ワイト',0)];
baselineA();
duelActivateFromHand(0);
for(let i=0;i<30&&!pc();i++){ if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;} if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;} break; }
const q=pc();
ok('D: with a DARK monster the banish choice is mandatory (not cancelable)',!!q&&q.cancelable===false&&/除外する闇属性/.test(q.title||''),JSON.stringify(q&&{t:q.title,c:q.cancelable}));
`);
