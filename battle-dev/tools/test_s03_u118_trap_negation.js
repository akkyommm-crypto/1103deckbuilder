/* S03-U118: field Trap negation (王宮のお触れ / トラップ・スタン / 人造人間－サイコ・ショッカー) — engine/1ZH_trap_negation_s03.js.
   Measured on U117: a Trap already on the chain was not negated when it resolved after トラップ・スタン / 王宮のお触れ
   had started applying; activating a Trap under them was refused although by rule only its effect is negated;
   サイコ・ショッカー was ENGINE_GAP. Real DUEL path (set cards activated with duelActivateFromZone /
   duelActivateResponseV2), Replay-audited. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function names(p,zn){return (gameState.players[p][zn]||[]).map(nm);}
function pc(){return pendingChoiceV49(gameState);}
let PREFER=[];
function pick(){const q=pc();let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u);if(j>=0)break;}__choicePickV49(j>=0?j:0);}
/* resolve everything, passing all priority */
function drive(){for(let i=0;i<400;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;
  if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
/* finish pending choices only (leave the chain window open for a response) */
function choose(){for(let i=0;i<20&&pc();i++)pick();}
function chainNames(){return gameState.chain.map(l=>l.name);}
function responses(p){return getChainResponsesV2(p).map(x=>x.db.n);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function setc(n,p){const c=mk(n,p,'down');c.setTurn=gameState.turn-1;return c;}
function szIdx(p,c){return gameState.players[p].sz.indexOf(c);}
function fresh(){resetA();gameState.activePlayer=1;gameState.turn=5;gameState.phase='main1';}
`;

/* ===== A. トラップ・スタン chained to a Trap: that Trap resolves afterwards → negated ===== */
harness(COMMON+String.raw`
fresh();
const ts=setc('トラップ・スタン',0), x=setc('聖なるバリア －ミラーフォース－',0);gameState.players[0].sz=[ts,x];
const dt=setc('砂塵の大竜巻',1);gameState.players[1].sz=[dt];
baselineA();
PREFER=[ensureCardUid(gameState,x)];
duelActivateFromZone(1,'sz',0);choose();
ok('A: P2 activates 砂塵の大竜巻 targeting P1\'s set card; P1 may respond with トラップ・スタン',chainNames().join()==='砂塵の大竜巻'&&responses(0).includes('トラップ・スタン'),JSON.stringify({chain:chainNames(),resp:responses(0)}));
duelActivateResponseV2(0,'sz',szIdx(0,ts));choose();
drive();
ok('A: トラップ・スタン resolves first → 砂塵の大竜巻 is negated when it resolves: the target survives',z(x)==='sz'&&names(1,'grave').includes('砂塵の大竜巻')&&names(0,'grave').includes('トラップ・スタン'),JSON.stringify({x:z(x),g1:names(1,'grave'),g0:names(0,'grave')}));
ok('A: the log names the reason',gameState.log.some(l=>String(l&&l.msg||l).includes('フィールドの罠カードの効果が無効化されている')),'');
audit('A');
`);

/* ===== B. 王宮のお触れ chained to a Trap: the same ===== */
harness(COMMON+String.raw`
fresh();
const rd=setc('王宮のお触れ',0), x=setc('聖なるバリア －ミラーフォース－',0);gameState.players[0].sz=[rd,x];
const dt=setc('砂塵の大竜巻',1);gameState.players[1].sz=[dt];
baselineA();
PREFER=[ensureCardUid(gameState,x)];
duelActivateFromZone(1,'sz',0);choose();
duelActivateResponseV2(0,'sz',szIdx(0,rd));choose();
drive();
ok('B: 王宮のお触れ resolves face-up first → 砂塵の大竜巻 negated, target survives',z(x)==='sz'&&z(rd)==='sz'&&rd.face==='up'&&names(1,'grave').includes('砂塵の大竜巻'),JSON.stringify({x:z(x),rd:[z(rd),rd.face],g1:names(1,'grave')}));
audit('B');
`);

/* ===== C. order matters: a Trap chained AFTER トラップ・スタン resolves first and is not negated ===== */
harness(COMMON+String.raw`
fresh();
const ts=setc('トラップ・スタン',0), x=setc('聖なるバリア －ミラーフォース－',0);gameState.players[0].sz=[ts,x];
const dt=setc('砂塵の大竜巻',1);gameState.players[1].sz=[dt];
gameState.activePlayer=0;
baselineA();
duelActivateFromZone(0,'sz',0);choose();
PREFER=[ensureCardUid(gameState,x)];
duelActivateResponseV2(1,'sz',0);choose();
drive();
ok('C: 砂塵の大竜巻 (chain 2) resolves before トラップ・スタン (chain 1) → not negated, target destroyed',z(x)==='grave'&&names(1,'grave').includes('砂塵の大竜巻'),JSON.stringify({x:z(x),g0:names(0,'grave')}));
audit('C');
`);

/* ===== D. activation under 王宮のお触れ / トラップ・スタン is legal; the cost is paid; the effect is negated ===== */
harness(COMMON+String.raw`
fresh();
const rd=mk('王宮のお触れ',0,'up');gameState.players[0].sz=[rd];
const m=mk('ジェネティック・ワーウルフ',0,'up');gameState.players[0].mz=[m];
const tb=setc('サンダー・ブレイク',1);gameState.players[1].sz=[tb];gameState.players[1].hand=[mk('ワイト',1)];
baselineA();
const L=strictScriptLegalityV2('サンダー・ブレイク',1,'sz',0,{});
ok('D: under a face-up 王宮のお触れ, activating サンダー・ブレイク is legal',L.ok===true,JSON.stringify(L));
PREFER=[ensureCardUid(gameState,m)];
duelActivateFromZone(1,'sz',0);drive();
ok('D: its discard cost is paid, its effect is negated (the monster survives), it goes to the GY',names(1,'grave').includes('ワイト')&&names(1,'grave').includes('サンダー・ブレイク')&&z(m)==='mz'&&!gameState.players[1].hand.length,JSON.stringify({g1:names(1,'grave'),m:z(m)}));
audit('D decree');
/* トラップ・スタン already resolved this turn: a Trap set later is still activatable and is negated */
fresh();
const ts=setc('トラップ・スタン',0);gameState.players[0].sz=[ts];
const m2=mk('ジェネティック・ワーウルフ',0,'up');gameState.players[0].mz=[m2];
const tb2=setc('サンダー・ブレイク',1);gameState.players[1].sz=[tb2];gameState.players[1].hand=[mk('ワイト',1)];
gameState.activePlayer=0;
baselineA();
duelActivateFromZone(0,'sz',0);drive();
ok('D: トラップ・スタン resolved (this turn)',names(0,'grave').includes('トラップ・スタン'),JSON.stringify(names(0,'grave')));
ok('D: P2 may still activate サンダー・ブレイク (legal)',strictScriptLegalityV2('サンダー・ブレイク',1,'sz',0,{}).ok===true,JSON.stringify(strictScriptLegalityV2('サンダー・ブレイク',1,'sz',0,{})));
PREFER=[ensureCardUid(gameState,m2)];
gameState.activePlayer=0;
duelActivateFromZone(1,'sz',0);drive();
ok('D: …and it is negated on resolution (monster survives, cost paid)',z(m2)==='mz'&&names(1,'grave').includes('ワイト'),JSON.stringify({m:z(m2),g1:names(1,'grave')}));
`);

/* ===== E. 人造人間－サイコ・ショッカー: Traps cannot be activated; face-up Traps are negated; negated by スキルドレイン ===== */
harness(COMMON+String.raw`
fresh();
const j=mk('人造人間－サイコ・ショッカー',0,'up');gameState.players[0].mz=[j];
const tb=setc('サンダー・ブレイク',1);gameState.players[1].sz=[tb];gameState.players[1].hand=[mk('ワイト',1)];
const ts=setc('トラップ・スタン',0);gameState.players[0].sz=[ts];
baselineA();
const L=strictScriptLegalityV2('サンダー・ブレイク',1,'sz',0,{});
ok('E: with サイコ・ショッカー face-up, P2 cannot activate a Trap',L.ok===false&&/罠カードは発動できません/.test(L.reason),JSON.stringify(L));
ok('E: …nor can its controller (お互い)',strictScriptLegalityV2('トラップ・スタン',0,'sz',0,{}).ok===false);
duelActivateFromZone(1,'sz',0);drive();
ok('E: a forced activation attempt does nothing (card stays set, no cost)',z(tb)==='sz'&&tb.face==='down'&&gameState.players[1].hand.length===1,JSON.stringify({tb:[z(tb),tb.face]}));
/* スキルドレイン already face-up vs サイコ・ショッカー: スキルドレイン applies (サイコ・ショッカー cannot be the one that wins) */
fresh();
const j2=mk('人造人間－サイコ・ショッカー',0,'up');gameState.players[0].mz=[j2];
const sd=mk('スキルドレイン',1,'up');gameState.players[1].sz=[sd];
baselineA();
ok('E: スキルドレイン already face-up negates サイコ・ショッカー (its effect is negated, so スキルドレイン is not)',effectNegated(j2)===true&&trapNegated(sd)===false&&!trapActivationForbiddenS03(1,setc('サンダー・ブレイク',1)),'');
/* face-down サイコ・ショッカー / in the GY does nothing */
fresh();
const j3=mk('人造人間－サイコ・ショッカー',0,'down');j3.pos='def';gameState.players[0].mz=[j3];
const tb3=setc('サンダー・ブレイク',1);gameState.players[1].sz=[tb3];gameState.players[1].hand=[mk('ワイト',1)];
baselineA();
ok('E: a face-down サイコ・ショッカー does not forbid Trap activation',strictScriptLegalityV2('サンダー・ブレイク',1,'sz',0,{}).ok===true);
`);

/* ===== F. サイコ・ショッカー revived in response (リビングデッドの呼び声, chain 2) → the Trap on chain 1 is negated at resolution ===== */
harness(COMMON+String.raw`
fresh();
const j=mk('人造人間－サイコ・ショッカー',0);gameState.players[0].grave=[j];
const call=setc('リビングデッドの呼び声',0);gameState.players[0].sz=[call];
const x=mk('ワイト',0,'up');gameState.players[0].mz=[x];
const tb=setc('サンダー・ブレイク',1);gameState.players[1].sz=[tb];gameState.players[1].hand=[mk('ワイト',1)];
baselineA();
PREFER=[ensureCardUid(gameState,x)];
duelActivateFromZone(1,'sz',0);choose();
ok('F: サンダー・ブレイク on the chain; P1 may respond with リビングデッドの呼び声',chainNames().join()==='サンダー・ブレイク'&&responses(0).includes('リビングデッドの呼び声'),JSON.stringify({chain:chainNames(),resp:responses(0)}));
PREFER=[ensureCardUid(gameState,j)];
duelActivateResponseV2(0,'sz',0);choose();
drive();
ok('F: サイコ・ショッカー is revived first, then サンダー・ブレイク resolves negated: ワイト survives',z(j)==='mz'&&j.face==='up'&&z(x)==='mz'&&names(1,'grave').includes('サンダー・ブレイク'),JSON.stringify({j:z(j),x:z(x),g1:names(1,'grave')}));
ok('F: リビングデッドの呼び声 itself stays face-up (a Trap, but it had already resolved)',z(call)==='sz'&&call.face==='up',JSON.stringify([z(call),call.face]));
audit('F');
`);

/* ===== G. continuous effects of negated Traps stop applying (they used to keep working) ===== */
harness(COMMON+String.raw`
/* サイコ・ショッカー vs a face-up グラヴィティ・バインド: Level 4+ monsters may attack again */
fresh();gameState.activePlayer=0;
const j=mk('人造人間－サイコ・ショッカー',0,'up');gameState.players[0].mz=[j];
const gb=mk('グラヴィティ・バインド－超重力の網－',1,'up');gameState.players[1].sz=[gb];
baselineA();
ok('G サイコ・ショッカー: グラヴィティ・バインド is negated, the Level 6 サイコ・ショッカー can declare an attack',trapNegated(gb)===true&&cannotAttackNow(j)===false&&canDeclareAttackV48(j),'');
doPhase('battle');drive();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:'direct'});drive();
ok('G: it really attacks directly for 2400',gameState.players[1].lp===8000-2400,JSON.stringify({lp:gameState.players[1].lp,t:TOASTS}));
audit('G jinzo');
/* 王宮のお触れ vs スキルドレイン: the monster's effect is no longer negated */
fresh();
const v=mk('魔導戦士 ブレイカー',0,'up');gameState.players[0].mz=[v];
gameState.players[0].sz=[mk('王宮のお触れ',0,'up')];gameState.players[1].sz=[mk('スキルドレイン',1,'up')];
baselineA();
ok('G 王宮のお触れ: スキルドレイン is negated → 魔導戦士 ブレイカー\'s effect is not negated',effectNegated(v)===false,'');
gameState.players[0].sz=[];
ok('G control: without 王宮のお触れ, スキルドレイン negates it',effectNegated(v)===true,'');
/* トラップ・スタン resolved this turn → a face-up グラヴィティ・バインド is negated for the turn only */
fresh();gameState.activePlayer=0;
const m=mk('ジェネティック・ワーウルフ',0,'up');gameState.players[0].mz=[m];
const ts=setc('トラップ・スタン',0);gameState.players[0].sz=[ts];
const gb2=mk('グラヴィティ・バインド－超重力の網－',1,'up');gameState.players[1].sz=[gb2];
baselineA();
ok('G control: グラヴィティ・バインド stops the Level 4 monster',cannotAttackNow(m)===true,'');
duelActivateFromZone(0,'sz',0);drive();
ok('G トラップ・スタン: after it resolves, the monster can attack this turn',cannotAttackNow(m)===false,'');
audit('G stun');
gameState.turn+=1;
ok('G トラップ・スタン: next turn グラヴィティ・バインド applies again',cannotAttackNow(m)===true,'');
`);
