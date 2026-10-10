/* S03-U127: special-summon monsters can be Special Summoned by another effect only after a proper summon
   (engine/1ZK_summon_only_s03.js: properlySummonedReasonS03 / properlySummonedS03 / sweep). Real DUEL path, Replay-audited. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
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
/* 死者蘇生 must already be in the hand before baselineA() (an unjournaled hand change would break the Replay audit) */
function revive(c){const i=gameState.players[0].hand.findIndex(x=>nm(x)==='死者蘇生');PREFER=[uid(c)];duelActivateFromHand(i);drive();PREFER=[];}
`;

/* ===== A. ダーク・アームド・ドラゴン milled to the GY (never summoned) → 死者蘇生 cannot revive it ===== */
harness(COMMON+String.raw`
fresh();
const dad=mk('ダーク・アームド・ドラゴン',0);gameState.players[0].deck=[dad,mk('ワイト',0)];
gameState.players[0].hand=[mk('死者蘇生',0)];
baselineA();
API.millTop(0,1,'test mill');
ok('A: precondition — ダーク・アームド・ドラゴン is in the GY (milled)',z(dad)==='grave');
PREFER=[uid(dad)];duelActivateFromHand(0);drive();PREFER=[];
/* S03-U144: 死者蘇生 no longer offers a card it cannot Special Summon, so the refusal now comes at activation; the rule itself is still checked. */
ok('A: 死者蘇生 cannot Special Summon it (never properly summoned)',z(dad)==='grave'&&(TOASTS.some(t=>/正規の方法で特殊召喚されていない/.test(t))||(strictScriptLegalityV2('死者蘇生',0,'hand',0,{}).ok===false&&/正規の方法で特殊召喚されていない/.test(properlySummonedReasonS03(dad,null,'死者蘇生','grave')))),JSON.stringify({z:z(dad),t:TOASTS.slice(-1)}));
audit('A');
`);

/* ===== B. properly summoned by its own procedure → destroyed → 死者蘇生 revives it ===== */
harness(COMMON+String.raw`
fresh();
const dad=mk('ダーク・アームド・ドラゴン',0);gameState.players[0].hand=[dad];
gameState.players[0].grave=[mk('ワイト',0),mk('ワイトキング',0),mk('ワイト夫人',0)];gameState.players[0].hand.push(mk('死者蘇生',0));
baselineA();
finishSummonProcedure('ダーク・アームド・ドラゴン',0,'hand',0,'atk');drive();
ok('B: Special Summoned by its procedure (proper) → recorded',z(dad)==='mz'&&dad.properlySummonedS03===true,JSON.stringify({z:z(dad),f:dad.properlySummonedS03,t:TOASTS}));
API.destroy(findCardByUid(dad.uid),'test');drive();
ok('B: destroyed → in the GY the record stays',z(dad)==='grave'&&dad.properlySummonedS03===true);
revive(dad);
ok('B: 死者蘇生 revives it',z(dad)==='mz',JSON.stringify({z:z(dad),t:TOASTS.slice(-1)}));
audit('B');
`);

/* ===== C. a Synchro Monster: placed in the GY → refused; properly Synchro Summoned → destroyed → revived ===== */
harness(COMMON+String.raw`
fresh();
const sd=mk('スターダスト・ドラゴン',0);gameState.players[0].grave=[sd];gameState.players[0].hand=[mk('死者蘇生',0)];
baselineA();
revive(sd);
ok('C: a Synchro Monster that was never Synchro Summoned cannot be revived',z(sd)==='grave');
fresh();
const t=mk('ジャンク・シンクロン',0,'up'),n=mk('ゴブリンドバーグ',0,'up'),w=mk('ワイト',0,'up');gameState.players[0].mz=[t,n,w];
const sd2=mk('スターダスト・ドラゴン',0);gameState.players[0].ex=[sd2];gameState.players[0].hand=[mk('死者蘇生',0)];
baselineA();
const P=gameState.players[0];
doExSummon(0,0,[P.mz.indexOf(t),P.mz.indexOf(n),P.mz.indexOf(w)].filter(i=>exCombos(0,dbOf(sd2)).combos.some(cb=>cb.materials.indexOf(i)>=0)),'synchro','atk');drive();
const ok1=z(sd2)==='mz';
if(ok1){ API.destroy(findCardByUid(sd2.uid),'test'); drive(); revive(sd2); }
ok('C: properly Synchro Summoned → destroyed → 死者蘇生 revives it',ok1&&z(sd2)==='mz',JSON.stringify({z:z(sd2),combos:exCombos(0,dbOf(sd2)).combos.length}));
audit('C');
`);

/* ===== D. the record is forgotten once the card goes back to the hand ===== */
harness(COMMON+String.raw`
fresh();
const dad=mk('ダーク・アームド・ドラゴン',0);gameState.players[0].hand=[dad];
gameState.players[0].grave=[mk('ワイト',0),mk('ワイトキング',0),mk('ワイト夫人',0)];gameState.players[0].hand.push(mk('死者蘇生',0));
baselineA();
finishSummonProcedure('ダーク・アームド・ドラゴン',0,'hand',0,'atk');drive();
API.returnToHand(findCardByUid(dad.uid),'test bounce');
ok('D: bounced to the hand → the record is gone',z(dad)==='hand'&&!dad.properlySummonedS03);
const hd=findCardByUid(dad.uid);API.discard(0,hd.index,'test discard');
revive(dad);
ok('D: then discarded → 死者蘇生 cannot revive it',z(dad)==='grave',JSON.stringify({z:z(dad)}));
audit('D');
`);

/* ===== E. ダーク・アームド・ドラゴン: its summon procedure is a summon (negatable in the summon window); ① pays the banish cost
   on activation and destroys the target at resolution ===== */
harness(COMMON+String.raw`
fresh();
const dad=mk('ダーク・アームド・ドラゴン',0);gameState.players[0].hand=[dad];
const d1=mk('ワイト',0),d2=mk('ワイトキング',0),d3=mk('ワイト夫人',0);gameState.players[0].grave=[d1,d2,d3];
const jd=mk('神の宣告',1,'down');jd.setTurn=4;gameState.players[1].sz=[jd];
const foe=mk('ゴブリンドバーグ',1,'up');gameState.players[1].mz=[foe];
baselineA();
ok('E: with exactly 3 DARK monsters in the GY the procedure is legal (and not a chain-starting effect)',strictSummonProcedureLegality('ダーク・アームド・ドラゴン',0,'hand',0).ok===true&&!strictScriptLegalityV2('ダーク・アームド・ドラゴン',0,'hand',0,{}).ok);
finishSummonProcedure('ダーク・アームド・ドラゴン',0,'hand',0,'atk');
ok('E: the summon window opens and 神の宣告 can negate it',!!gameState.pendingSummon&&summonNegatorsV2(gameState.pendingSummon).some(x=>x.db.n==='神の宣告'),JSON.stringify(gameState.pendingSummon&&gameState.pendingSummon.kind));
commitPendingSummonV2();drive();
ok('E: not negated → on the field',z(dad)==='mz'&&dad.properlySummonedS03===true);
PREFER=[uid(d2),uid(foe)];
duelActivateFromZone(0,'mz',findCardByUid(dad.uid).index);
for(let i=0;i<5&&pc();i++)pick();   /* answer the cost and target choices only (the chain stays open) */
const onChain=gameState.chain.some(l=>l.name==='ダーク・アームド・ドラゴン');
ok('E ①: the banish cost is paid on activation (before resolution)',onChain&&z(d2)==='banish'&&z(foe)==='mz',JSON.stringify({onChain,d2:z(d2),foe:z(foe)}));
drive();PREFER=[];
ok('E ①: the target is destroyed at resolution',z(foe)==='grave');
audit('E');
`);

/* ===== F. 「「N」の効果でのみ特殊召喚できる」 monsters: the named effect is the proper method itself (found by the gate:
   ボンディング－H2O reviving ウォーター・ドラゴン); アギド does not offer a Fusion Monster that was never properly summoned ===== */
harness(COMMON+String.raw`
fresh();
const wd=mk('ウォーター・ドラゴン',0),wd2=mk('ウォーター・ドラゴン',0);gameState.players[0].grave=[wd,wd2];
baselineA();
API.specialSummon(0,'grave',0,'atk','死者蘇生');drive();
ok('F: another effect (死者蘇生) cannot Special Summon ウォーター・ドラゴン from the GY',z(wd)==='grave');
API.specialSummon(0,'grave',0,'atk','ボンディング－H2O');drive();
ok('F: ボンディング－H2O (its only proper method) can, and that counts as a proper summon',z(wd)==='mz'&&wd.properlySummonedS03===true,JSON.stringify({z:z(wd)}));
audit('F');
fresh();
const km=mk('キング・もけもけ',0),km2=mk('キング・もけもけ',0);km2.properlySummonedS03=true;gameState.players[0].grave=[km,km2];
ok('F: アギド (6) offers only the properly summoned キング・もけもけ',JSON.stringify(c2AgidoTargets(0,6).map(x=>x.card.uid))===JSON.stringify([uid(km2)]));
`);
