/* S03-U110: 大天使クリスティア (Archlord Kristya) — priority #7's IMPLEMENTED tier, main-deck qty=2 (agent).
   2011-era text: 自分の墓地に存在する天使族モンスターが4体のみの場合、このカードは手札から特殊召喚する事ができる。
   この方法で特殊召喚に成功した時、自分の墓地に存在する天使族モンスター1体を選択して手札に加える。
   このカードがフィールド上に表側表示で存在する限り、お互いにモンスターを特殊召喚する事はできない。
   フィールド上に表側表示で存在するこのカードが墓地へ送られる場合、墓地へ送らずデッキの一番上に戻す。

   The previous implementation had a defect in every one of the four clauses:
   ① the hand Special Summon was an activated effect (activateFrom:['hand'] → chain link) instead of a
     chain-less summon procedure;
   ② the add-to-hand was done inside the same resolve(), optional (cancelable) and non-targeting, instead of
     a mandatory targeting trigger on the ①-method Special Summon;
   ③ "neither player can Special Summon" was a log line only — nothing enforced it;
   ④ the "top of the owner's Deck instead of the GY" replacement did not exist at all.
   Fix: summonProcedure + forced targeting trigger keyed on onSpecialSummon kind:'procedure'; the face-up
   monster mutual lock in v46GlobalSpecialSummonRestrictionReason (same family as 虚無魔人); a new central
   leave-field replacement s03DeckTopInsteadOfGraveU110 (engine/00_state_actions.js) applied at every
   field→GY site (MOVE, FX_TO_GRAVE incl. tributes, FX_WIPE_ZONE, BATTLE_CLEANUP, Synchro/Fusion materials,
   Ritual tributes, control-return overflow), judged at the pre-leave location so Skill Drain is honored. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function fresh(active){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=active||0;gameState.phase='main1';}
function drive(){for(let i=0;i<300;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(EVT_V2_STATE)return 'evt';
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function settle(){for(let k=0;k<16;k++){const r=drive();if(r==='evt'){if(EVT_V2_STATE.rank>=2)eventSkipGroupV2();else eventPickV2(0);continue;}return r;}return 'loop';}
function labels(){const pc=pendingChoiceV49(gameState);return pc?pc.candidates.map(x=>String(x.label||'')):[];}
function pick(match){const pc=pendingChoiceV49(gameState);if(!pc)throw Error('choice missing for '+match+' toasts='+JSON.stringify(TOASTS.slice(-3)));
  const i=pc.candidates.findIndex(x=>{const h=x.uid!=null&&findCardByUid(x.uid);return (h&&nm(h.card)===match)||String(x.label||'').includes(match);});
  if(i<0)throw Error('candidate '+match+' missing: '+JSON.stringify(labels()));__choicePickV49(i);}
function names(p,z){return (gameState.players[p][z]||[]).map(nm);}
function actionIds(p,i){return getLegalHandActions(p,i).map(a=>a.id);}
function procedure(name,p,idx,pos){runSummonProcedure(name,p,'hand',idx);if(!gameState.pendingSummon&&!pendingChoiceV49(gameState))finishSummonProcedure(name,p,'hand',idx,pos||'atk');}
function attack(p,atkIdx,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx,target});settle();}
function journal(){return v41ReplayPackage(gameState).actions.map(x=>x&&x.action).filter(Boolean);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,300));}
const FAIRIES=['シャインエンジェル','コーリング・ノヴァ','オネスト','ヘカテリス','豊穣のアルテミス'];
function kristya(owner,face,pos){const c=mk('大天使クリスティア',owner,face||'up');c.pos=pos||'atk';return c;}
function deckTop(p){return nm(gameState.players[p].deck[0]);}
`;

/* ===== A. ① procedure legality: exactly 4 Fairy monsters in the own GY; a hand Special Summon procedure,
   never an effect activation. ===== */
harness(COMMON+String.raw`
fresh();
gameState.players[0].hand=[mk('大天使クリスティア',0)];
gameState.players[0].grave=FAIRIES.slice(0,4).map(n=>mk(n,0)).concat([mk('ワイト',0)]);
baselineA();
const ids=actionIds(0,0);
ok('A: with exactly 4 Fairy monsters (plus a non-Fairy) the hand offers the Special Summon procedure',
  ids.includes('specialSummonProcedure'),JSON.stringify(ids));
ok('A: it is not offered as an activated effect from the hand (the summon does not start a chain)',
  !ids.includes('handEffect')&&!getLegalHandActions(0,0).some(a=>/効果/.test(String(a.label||''))),JSON.stringify(getLegalHandActions(0,0).map(a=>[a.id,a.label])));
gameState.players[0].grave=FAIRIES.slice(0,3).map(n=>mk(n,0)).concat([mk('ワイト',0)]);
ok('A: with 3 Fairy monsters (the non-Fairy does not count) the procedure is not offered',
  !actionIds(0,0).includes('specialSummonProcedure'),JSON.stringify(strictSummonProcedureLegality('大天使クリスティア',0,'hand',0)));
gameState.players[0].grave=FAIRIES.map(n=>mk(n,0));
ok('A: with 5 Fairy monsters ("4体のみ") the procedure is not offered',
  !actionIds(0,0).includes('specialSummonProcedure'),JSON.stringify(strictSummonProcedureLegality('大天使クリスティア',0,'hand',0)));
gameState.players[1].grave=FAIRIES.slice(0,4).map(n=>mk(n,1));gameState.players[0].grave=[];
ok('A: Fairy monsters in the OPPONENT GY do not count',
  !actionIds(0,0).includes('specialSummonProcedure'),JSON.stringify(strictSummonProcedureLegality('大天使クリスティア',0,'hand',0)));
`);

/* ===== B. Real procedure summon → mandatory targeting trigger adds the chosen Fairy; ③ the lock is then live
   for both players. ===== */
harness(COMMON+String.raw`
fresh();
const k=mk('大天使クリスティア',0);
gameState.players[0].hand=[k,mk('サイバー・ドラゴン',0)];
gameState.players[0].grave=FAIRIES.slice(0,4).map(n=>mk(n,0)).concat([mk('ワイト',0)]);
gameState.players[1].mz=[mk('ワイト',1,'up')];
baselineA();
const before=journal().length;
procedure('大天使クリスティア',0,0,'atk');
let st=settle();
const chainAddsBeforeTarget=journal().slice(before).filter(a=>a.type==='CHAIN_ADD');
ok('B: the procedure Special Summons it face-up in Attack Position',
  gameState.players[0].mz.includes(k)&&k.face==='up'&&k.pos==='atk'&&!gameState.players[0].hand.includes(k),JSON.stringify({mz:names(0,'mz'),hand:names(0,'hand'),st}));
ok('B: the mandatory trigger asks for a target among exactly the 4 Fairy monsters in the own GY (not ワイト)',
  st==='choice'&&labels().length===4&&!labels().some(l=>l.includes('ワイト')),JSON.stringify({st,labels:labels()}));
/* Mandatory: a real cancel attempt must not skip the effect — the same target prompt stays pending. */
__choiceCancelV49();st=settle();
ok('B: the trigger is mandatory — cancelling the target prompt does not skip it (still pending, nothing moved)',
  st==='choice'&&labels().length===4&&names(0,'grave').length===5&&!names(0,'hand').includes('オネスト'),
  JSON.stringify({st,labels:labels(),grave:names(0,'grave'),hand:names(0,'hand')}));
pick('オネスト');st=settle();
ok('B: the targeted オネスト is added to the hand; the other 3 Fairy monsters and ワイト stay in the GY',
  names(0,'hand').includes('オネスト')&&!names(0,'grave').includes('オネスト')&&names(0,'grave').length===4,JSON.stringify({hand:names(0,'hand'),grave:names(0,'grave'),st}));
const adds=journal().slice(before).filter(a=>a.type==='CHAIN_ADD');
ok('B: exactly one chain link was built — the trigger — and the summon itself built none',
  adds.length===1&&adds[0].name==='大天使クリスティア',JSON.stringify({adds:adds.map(a=>a.name),early:chainAddsBeforeTarget.map(a=>a.name)}));
const why0=v46GlobalSpecialSummonRestrictionReason(0),why1=v46GlobalSpecialSummonRestrictionReason(1);
ok('B: ③ while it is face-up neither player can Special Summon',why0.includes('クリスティア')&&why1.includes('クリスティア'),JSON.stringify({why0,why1}));
ok('B: ③ the controller\'s own サイバー・ドラゴン procedure is no longer offered',
  !actionIds(0,0).includes('specialSummonProcedure'),JSON.stringify({ids:actionIds(0,0),hand:names(0,'hand'),legal:strictSummonProcedureLegality('サイバー・ドラゴン',0,'hand',0)}));
audit('B');
`);

/* ===== C. ③ lock stops the opponent's real 死者蘇生 activation on the opponent's turn. ===== */
harness(COMMON+String.raw`
fresh(1);
gameState.players[0].mz=[kristya(0)];
gameState.players[1].hand=[mk('死者蘇生',1)];
gameState.players[1].grave=[mk('ワイト',1)];
baselineA();
const L=strictScriptLegalityV2('死者蘇生',1,'hand',0,{});
ok('C: the opponent cannot activate 死者蘇生 while Kristya is face-up',!L.ok,JSON.stringify(L));
gameState.players[0].mz=[];
const L2=strictScriptLegalityV2('死者蘇生',1,'hand',0,{});
ok('C: control — without Kristya the same 死者蘇生 is legal',L2.ok,JSON.stringify(L2));
`);

/* ===== D. ④ replacement through real removal routes. ===== */
harness(COMMON+String.raw`
/* D1: 地砕き (effect destruction, FX_TO_GRAVE) */
fresh(1);
const k1=kristya(0);gameState.players[0].mz=[k1];
gameState.players[0].deck=[mk('ワイト',0),mk('ワイト',0)];
const j1=mk('地砕き',1,'down');gameState.players[1].sz=[j1];
baselineA();
duelActivateFromZone(1,'sz',0);settle();
ok('D1: destroyed by 地砕き it goes to the top of its owner\'s Deck, face-down, not to the GY',
  deckTop(0)==='大天使クリスティア'&&gameState.players[0].deck[0].face==='down'&&!names(0,'grave').includes('大天使クリスティア')&&!names(0,'mz').length&&gameState.players[0].deck.length===3,
  JSON.stringify({deck:names(0,'deck'),grave:names(0,'grave'),mz:names(0,'mz'),toasts:TOASTS.slice(-3)}));
audit('D1');

/* D2: サンダー・ボルト (mass destruction, FX_WIPE_ZONE) — Kristya returns, the other monster goes to the GY */
fresh(1);
gameState.players[0].mz=[mk('ワイト',0,'up'),kristya(0)];
gameState.players[0].deck=[mk('ワイト',0)];
gameState.players[1].sz=[mk('サンダー・ボルト',1,'down')];
baselineA();
duelActivateFromZone(1,'sz',0);settle();
ok('D2: under サンダー・ボルト Kristya returns to the Deck top while ワイト goes to the GY',
  deckTop(0)==='大天使クリスティア'&&names(0,'grave').includes('ワイト')&&!names(0,'grave').includes('大天使クリスティア')&&!names(0,'mz').length,
  JSON.stringify({deck:names(0,'deck'),grave:names(0,'grave'),mz:names(0,'mz')}));
audit('D2');

/* D3: battle destruction (BATTLE_CLEANUP) */
fresh(1);gameState.phase='battle';
gameState.players[0].mz=[kristya(0,'up','def')];
gameState.players[1].mz=[mk('ダーク・アームド・ドラゴン',1,'up')];
baselineA();
attack(1,0,0);
ok('D3: destroyed by battle (2800 vs DEF 2300) it goes to the Deck top, not the GY',
  deckTop(0)==='大天使クリスティア'&&!names(0,'grave').includes('大天使クリスティア')&&!names(0,'mz').length,
  JSON.stringify({deck:names(0,'deck'),grave:names(0,'grave'),mz:names(0,'mz'),oppMz:names(1,'mz')}));
audit('D3');
`);

harness(COMMON+String.raw`
/* D4: Tribute for an Advance Summon (FX_TO_GRAVE via pickTributes) */
fresh();
gameState.players[0].mz=[kristya(0)];
gameState.players[0].hand=[mk('人造人間－サイコ・ショッカー',0)];
baselineA();
doNormalSummon(0,'atk');
if(pendingChoiceV49(gameState)) pick('大天使クリスティア');
settle();
ok('D4: tributed for サイコ・ショッカー it returns to the Deck top, and the Tribute Summon completes',
  deckTop(0)==='大天使クリスティア'&&!names(0,'grave').includes('大天使クリスティア')&&names(0,'mz').includes('人造人間－サイコ・ショッカー'),
  JSON.stringify({deck:names(0,'deck'),grave:names(0,'grave'),mz:names(0,'mz'),toasts:TOASTS.slice(-3)}));
audit('D4');

/* D5: face-down (set) Kristya destroyed → ordinary GY (the replacement needs it face-up) */
fresh(1);
gameState.players[0].mz=[kristya(0,'down','def')];
gameState.players[1].sz=[mk('サンダー・ボルト',1,'down')];
baselineA();
duelActivateFromZone(1,'sz',0);settle();
ok('D5: a face-down Kristya destroyed goes to the GY (no replacement)',
  names(0,'grave').includes('大天使クリスティア')&&!names(0,'deck').includes('大天使クリスティア'),
  JSON.stringify({deck:names(0,'deck'),grave:names(0,'grave')}));
audit('D5');

/* D6: under a face-up スキルドレイン both ③ and ④ are negated */
fresh(1);
gameState.players[0].mz=[kristya(0)];
gameState.players[1].sz=[mk('スキルドレイン',1,'up'),mk('サンダー・ボルト',1,'down')];
baselineA();
ok('D6: under スキルドレイン the mutual Special Summon lock does not apply',
  !v46GlobalSpecialSummonRestrictionReason(0).includes('クリスティア')&&!v46GlobalSpecialSummonRestrictionReason(1).includes('クリスティア'),
  JSON.stringify([v46GlobalSpecialSummonRestrictionReason(0),v46GlobalSpecialSummonRestrictionReason(1)]));
duelActivateFromZone(1,'sz',1);settle();
ok('D6: under スキルドレイン a destroyed Kristya goes to the GY',
  names(0,'grave').includes('大天使クリスティア')&&!names(0,'deck').includes('大天使クリスティア'),
  JSON.stringify({deck:names(0,'deck'),grave:names(0,'grave'),toasts:TOASTS.slice(-3)}));
audit('D6');

/* D7: controlled by the opponent → returns to the OWNER's Deck top */
fresh();
const k7=kristya(0);k7.controller=1;gameState.players[1].mz=[k7];
gameState.players[0].sz=[mk('サンダー・ボルト',0,'down')];
gameState.players[1].deck=[mk('ワイト',1)];
baselineA();
duelActivateFromZone(0,'sz',0);settle();
ok('D7: a Kristya controlled by the opponent returns to its owner\'s (P1-controlled → P0) Deck top',
  deckTop(0)==='大天使クリスティア'&&deckTop(1)==='ワイト'&&!names(0,'grave').includes('大天使クリスティア')&&!names(1,'grave').includes('大天使クリスティア'),
  JSON.stringify({d0:names(0,'deck'),d1:names(1,'deck'),g0:names(0,'grave'),g1:names(1,'grave')}));
audit('D7');
`);

/* ===== E. Revived by 死者蘇生 (not the ① method): no add-to-hand trigger, but ③ applies. ===== */
harness(COMMON+String.raw`
fresh();
const k=mk('大天使クリスティア',0);
gameState.players[0].grave=[k].concat(FAIRIES.slice(0,4).map(n=>mk(n,0)));
gameState.players[0].sz=[mk('死者蘇生',0,'down')];
baselineA();
duelActivateFromZone(0,'sz',0);
if(pendingChoiceV49(gameState)) pick('大天使クリスティア');
const st=settle();
ok('E: 死者蘇生 revives it',gameState.players[0].mz.includes(k),JSON.stringify({mz:names(0,'mz'),grave:names(0,'grave'),st}));
ok('E: no add-to-hand trigger (it was not Special Summoned by its own ① method)',
  st==='idle'&&!names(0,'hand').length&&names(0,'grave').filter(n=>FAIRIES.includes(n)).length===4&&!journal().some(a=>a.type==='CHAIN_ADD'&&a.name==='大天使クリスティア'),
  JSON.stringify({st,hand:names(0,'hand'),grave:names(0,'grave'),labels:labels()}));
ok('E: ③ the lock applies anyway while it is face-up',v46GlobalSpecialSummonRestrictionReason(1).includes('クリスティア'),v46GlobalSpecialSummonRestrictionReason(1));
audit('E');
`);
