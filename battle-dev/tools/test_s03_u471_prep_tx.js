/* S03-U471 (part B): 発動準備トランザクション（engine/1ZZV）— 対象選択の失敗・手動キャンセル・コスト支払い済みの失敗を、発動前の状態へ戻す。
   欠陥（U468 発見、U470 計測）: 発動準備は 表にする/手札から置く → コスト → 対象選択。対象選択が「選択できるカードが足りません」で失敗しても
   requestChoiceV49 が false を返すだけで（API.selectCard は戻り値を捨てる）継続が呼ばれず、コストは払われたまま、カードは魔法・罠ゾーンに表で残った。
   手動キャンセルも同じ停止状態になった。
   設計（実装済み）:
     - 最初の状態変化（表にする / 手札から置く）の前に PREP_TX_BEGIN_S03 を Journal へ載せ、reducer が gs.prepTxS03 に復元点を1つだけ置く。
     - 失敗の合図は推測しない: requestChoiceV49 が候補不足で断った時だけ CHOICE_INSUFFICIENT_SEQ_S03 が進む。手動キャンセルは別の理由 'cancel'。
     - PREP_TX_ABORT_S03 が復元点から戻して記録を消す（冪等、同じ準備では1回だけ）。CHAIN_ADD の reducer が記録を閉じる（以後の不発・無効でコストは返らない）。
   範囲: 代表2例（コストなし／コスト支払い済み）→ 周辺。複数のカードを対象にする5枚（貪欲な壺 他）は裁定未確定のため、ここでは「現象の記録」だけで、裁定準拠・TESTED とは扱わない。
   Cards named: リビングデッドの呼び声, 洗脳－ブレインコントロール, 月の書 (TESTED); 他は現象の記録のみ。 */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
/* 古いエンジン（部分 B 無し）でも例外で止まらず、各アサーションが FAIL として数えられるように、新しい API は薄い包みを通して呼ぶ（negative control 用） */
const txStats=()=>typeof prepTxStatsS03==='function'?prepTxStatsS03():{begin:0,commit:0,abort:0,abortRefused:0,byReason:{}};
const sigSeq=()=>typeof CHOICE_INSUFFICIENT_SEQ_S03!=='undefined'?CHOICE_INSUFFICIENT_SEQ_S03:0;
const txLive=u=>typeof prepTxLiveForS03==='function'&&prepTxLiveForS03(u);
const txAbort=(r,u)=>typeof prepTxAbortS03==='function'?prepTxAbortS03(r,u):false;
const txCheck=(sg,u)=>typeof prepTxCheckInsufficientS03==='function'?prepTxCheckInsufficientS03(sg,u):false;

function pc(){return pendingChoiceV49(gameState);}
function mon(name,p,face,pos){const c=mk(name,p,face||'up',pos||'atk');c.summonedTurn=3;return c;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function C(c){const h=findCardByUid(c.uid);return h?h.card:null;}
function uid(c){return ensureCardUid(gameState,c);}
function audit(label,allowEmpty){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest and the final state',(allowEmpty||pkg.actions.length>0)&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,240));}
function jt(j0){return V41_ACTION_JOURNAL.slice(j0).map(e=>e.action.type+(/^PREP_TX/.test(e.action.type)&&e.action.reason?':'+e.action.reason:''));}
function aborts(){return V41_ACTION_JOURNAL.filter(e=>e.action.type==='PREP_TX_ABORT_S03');}
let PREFER=[];
function pickU(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}let j=-1;
  for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||(x.card&&x.card.uid===u));if(j>=0)break;}
  __choicePickV49(j>=0?j:0);}
function driveU(){for(let i=0;i<800;i++){
  if(pc()){pickU();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
const ARM='メタルシルバー・アーマー',OBE='オベリスクの巨神兵';
function fresh(active){resetA();gameState.activePlayer=active;gameState.firstPlayer=0;gameState.turn=6;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4710002;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
/* 盤面（U468/U470 と同じ道具）:
   board 'A' … メタルシルバー・アーマー（P0）が P0 のサイバー・ドラゴンに装備。相手（P1）の効果は、装備モンスター以外のお互いの場・墓地のモンスターを対象にできない。
   board 'C' … 両者の場に オベリスクの巨神兵 だけ（自身のテキストで効果の対象にならない）。mode 'ctl' は普通のモンスターにした対照、'partial' は P0 に対象に取れる普通のモンスターが1体残る。
   own=true … カードの持ち主はアーマーのコントローラー（P0）。 */
function build(spec){
  const o=spec.own?0:1;fresh(o);
  const P=gameState.players,x={o};
  if(spec.board==='A'){
    x.host=mon('サイバー・ドラゴン',0);x.other=mon('ライオウ',0);x.armor=mk(ARM,0,'up');
    P[0].mz=[x.host,x.other];P[0].sz=[x.armor];
    x.beast=mon('ジェネティック・ワーウルフ',o);x.crit=mon('クリッター',o,'up','def');
    P[o].mz=P[o].mz.concat([x.beast,x.crit]);
    x.gA=mk('ライオウ',o);x.gB=mk('クリッター',o);P[o].grave=[x.gA,x.gB];
    if(o===1){x.gF=mk('ワイト',0);P[0].grave=[x.gF];}
  }else{
    const nm=spec.mode==='ctl'?'ライオウ':OBE;
    x.m0=mon(nm,0);x.m1=mon(nm,1);P[0].mz=[x.m0];P[1].mz=[x.m1];
    if(spec.mode==='partial'){x.plain=mon('ライオウ',0);P[0].mz.push(x.plain);}
  }
  if(spec.extra)spec.extra(x,P,o);
  x.card=mk(spec.card,o,'up');
  const db=dbOf(x.card);
  if(spec.set||db.k==='t'){x.card.face='down';x.card.setTurn=gameState.turn-1;P[o].sz.push(x.card);x.szIdx=P[o].sz.length-1;x.set=true;}
  else{P[o].hand=(spec.hand?spec.hand(o):[]).concat([x.card]);x.hidx=P[o].hand.length-1;}
  baselineA();
  if(spec.board==='A'&&spec.mode!=='ctl')API.equipSpell(locateCardAnyV4(x.armor),locateCardAnyV4(x.host),'S03-U471 fixture');
  x.D0=v41StateDigest(gameState);
  return x;}
/* 発動を1回試みる。結果と Journal の位置を返す */
function attempt(x){
  const o=x.o,P=()=>gameState.players[o];TOASTS.length=0;
  const j0=V41_ACTION_JOURNAL.length,lp0=P().lp,sig0=sigSeq();
  const ids=x.set?getLegalZoneActions(o,'sz',x.szIdx).map(a=>a.id):getLegalHandActions(o,x.hidx).map(a=>a.id);
  const offered=ids.indexOf(x.set?'activateSet':'activate')>=0;
  if(offered){ if(x.set)duelActivateFromZone(o,'sz',x.szIdx,{});else duelActivateFromHand(x.hidx); }
  const h=findCardByUid(x.card.uid);
  return {offered,j0,toast:TOASTS.slice(-1)[0]||null,pend:!!pc(),chain:gameState.chain.length,zone:h?h.zone:null,face:h?h.card.face:null,
    lpd:P().lp-lp0,sigd:sigSeq()-sig0,tx:!!gameState.prepTxS03,hand:P().hand.length,szN:P().sz.length,types:jt(j0)};}
/* 修正前（S03-U470 の前）の condition を一時的に戻す: 生の墓地プールだけを見る。発動が始まってから対象選択で全候補を失う、元の再現を作る */
function rawCothCondition(){
  /* 効果は凍結されている（createEffectV4 → Object.freeze）ので、登録表の配列ごと差し替えて戻す */
  const name='リビングデッドの呼び声',keep=EFFECT_REGISTRY_V4[name];
  const raw=function(ctx){
    if(!hasMonsterZoneSpace(ctx.player)){ctx.reason='モンスターゾーンが一杯です';return false;}
    if(!API.pileCards(ctx.player,'grave',x=>x.db.k==='m').length){ctx.reason='自分の墓地にモンスターがいません';return false;}
    return true;};
  EFFECT_REGISTRY_V4[name]=keep.map(e=>Object.freeze(Object.assign({},e,{condition:raw})));
  return ()=>{EFFECT_REGISTRY_V4[name]=keep;};}
function savedRaw(){saveDuel();return localStorage.getItem(DUEL_SAVE_KEY);}
`;

const first=harness(COMMON+String.raw`
globalThis.__SAVES={};

/* ===== 1. 代表: コストなし — 元の再現（リビングデッドの呼び声 × メタルシルバー・アーマー）===== */
/* U470 で condition が先に断るようになったので、修正前の condition を戻して「発動が始まってから候補が0になる」形をエンジン側だけで作る */
{ const restore=rawCothCondition();
  const spec={card:'リビングデッドの呼び声',set:true,board:'A',mode:'imm'};
  const x=build(spec);
  const st0=txStats();
  const r=attempt(x);
  ok('REPRO (no cost): the raw condition passes — the activation starts and the target step runs',r.offered&&r.types[0]==='PREP_TX_BEGIN_S03'&&r.types.indexOf('FX_SET_STATE')===1,JSON.stringify(r.types));
  ok('REPRO: the original symptom text is shown (「選択できるカードが足りません」), no choice, no chain link',r.toast==='選択できるカードが足りません'&&!r.pend&&r.chain===0,JSON.stringify(r));
  ok('REPRO (was {chain:0,sz:1,face:up}): the trap is back FACE-DOWN in the Spell & Trap Zone',r.zone==='sz'&&r.face==='down'&&r.szN===1,JSON.stringify(r));
  ok('REPRO: the explicit signal fired exactly once (reason insufficient) and the single abort carries that reason',r.sigd===1&&r.types[r.types.length-1]==='PREP_TX_ABORT_S03:insufficient',JSON.stringify({sigd:r.sigd,types:r.types}));
  ok('REPRO: journal is exactly BEGIN, flip, ABORT (one restore point, one abort)',JSON.stringify(r.types)===JSON.stringify(['PREP_TX_BEGIN_S03','FX_SET_STATE','PREP_TX_ABORT_S03:insufficient']),JSON.stringify(r.types));
  ok('REPRO: the restore record is cleared (state carries no prepTxS03 any more)',!r.tx&&gameState.prepTxS03===undefined,'');
  ok('REPRO: the whole state is back to the pre-activation digest (board, LP, graves, RNG, flags)',v41StateDigest(gameState)===x.D0,v41StateDigest(gameState)+' vs '+x.D0);
  ok('REPRO: the Graveyard is untouched and nothing was revived',z(x.gA)==='grave'&&z(x.gB)==='grave'&&gameState.players[1].grave.length===2,'');
  const st1=txStats();
  ok('REPRO: stats — one BEGIN, one abort (insufficient)',st1.begin-st0.begin===1&&st1.abort-st0.abort===1&&(st1.byReason.insufficient||0)>=1,JSON.stringify(st1));
  audit('REPRO');
  /* 再び発動できる: アーマーが居なくなれば通常どおり最後まで動く */
  API.sendToGrave(locateCardAnyV4(x.armor),'S03-U471 fixture');
  const r2=attempt(x);
  ok('REPRO re-operable: once the Armor is gone the same trap activates, opens the target choice and the transaction is open',r2.offered&&r2.pend&&r2.face==='up'&&r2.tx,JSON.stringify(r2));
  PREFER=[x.gB.uid];driveU();PREFER=[];
  ok('REPRO re-operable: it resolves end to end (the Graveyard monster is revived), the record was closed by CHAIN_ADD',z(x.gB)==='mz'&&gameState.prepTxS03===undefined&&!aborts().slice(1).length,JSON.stringify({gB:z(x.gB),aborts:aborts().length}));
  audit('REPRO re-operated');
  restore();
}

/* ===== 2. 代表: コストなし — 実カード（U470 が直していない約119枚の一部。罠／手札の魔法）===== */
for(const c of [
  {card:'デモンズ・チェーン',board:'C',kind:'Trap (Set)'},
  {card:'突進',board:'C',kind:'Spell (hand)'},
  {card:'『攻撃』封じ',board:'C',kind:'Spell (hand)'},
]){
  const x=build({card:c.card,board:c.board,mode:'imm'});const r=attempt(x);
  ok(c.card+' ('+c.kind+', no cost): offered, fails at the target step with the original text',r.offered&&r.toast==='選択できるカードが足りません'&&!r.pend&&r.chain===0,JSON.stringify(r));
  ok(c.card+': restored to its pre-activation place ('+(x.set?'face-down in the Spell & Trap Zone':'back in the hand')+')',x.set?(r.zone==='sz'&&r.face==='down'):(r.zone==='hand'&&r.szN===0),JSON.stringify(r));
  ok(c.card+': the state digest equals the pre-activation digest; the abort reason is insufficient',v41StateDigest(gameState)===x.D0&&r.types[r.types.length-1]==='PREP_TX_ABORT_S03:insufficient',JSON.stringify(r.types));
  audit(c.card);
}

/* ===== 3. 代表: コスト支払い済み — 洗脳－ブレインコントロール（800LP）===== */
{ const x=build({card:'洗脳－ブレインコントロール',board:'C',mode:'imm'});
  const lp0=gameState.players[1].lp;const r=attempt(x);
  ok('洗脳 (800 LP): the condition passes on the raw pool, the activation starts, the cost is paid, the target step fails',r.offered&&r.toast==='選択できるカードが足りません'&&r.types.some(t=>/^LP|PAY/.test(t)),JSON.stringify(r.types));
  ok('洗脳 (was: LP 7200 and the card stranded face-up): the 800 LP are restored',gameState.players[1].lp===lp0&&r.lpd===0,JSON.stringify({lp:gameState.players[1].lp,lp0}));
  ok('洗脳: the card is back in the hand (not stranded in the Spell & Trap Zone)',r.zone==='hand'&&r.hand===1&&r.szN===0&&r.chain===0&&!r.pend,JSON.stringify(r));
  ok('洗脳: cost journaled, then one abort; the digest equals the pre-activation digest',r.types[r.types.length-1]==='PREP_TX_ABORT_S03:insufficient'&&v41StateDigest(gameState)===x.D0&&!gameState.prepTxS03,JSON.stringify(r.types));
  audit('洗脳 cost-paid failure');
  /* 再び発動できる（対象に取れる普通のモンスターが居る盤面で、同じカードが最後まで動く）*/
  const y=build({card:'洗脳－ブレインコントロール',board:'C',mode:'partial'});
  const r2=attempt(y);
  ok('洗脳 re-operable: with a targetable monster the card activates, pays 800 LP, opens the target choice',r2.offered&&r2.pend&&r2.lpd===-800&&r2.tx,JSON.stringify(r2));
  PREFER=[y.plain.uid];for(let n=0;n<4&&pc();n++)pickU();PREFER=[];
  ok('洗脳 re-operable: after the target is chosen the chain link exists and the record is already closed (CHAIN_ADD is the boundary)',gameState.chain.length===1&&gameState.prepTxS03===undefined,JSON.stringify({chain:gameState.chain.length,tx:!!gameState.prepTxS03}));
  audit('洗脳 re-operated'); }
/* 実カードの同形（U470 が計測した他のコスト支払い済み）: 早すぎた埋葬 800LP / 自律行動ユニット 1500LP */
for(const c of [{card:'早すぎた埋葬',lp:800},{card:'自律行動ユニット',lp:1500}]){
  const x=build({card:c.card,board:'A',mode:'imm'});const lp0=gameState.players[1].lp;const r=attempt(x);
  ok(c.card+' ('+c.lp+' LP cost): LP restored, card back in the hand, digest equals the pre-activation digest',r.offered&&gameState.players[1].lp===lp0&&r.zone==='hand'&&v41StateDigest(gameState)===x.D0&&r.types[r.types.length-1]==='PREP_TX_ABORT_S03:insufficient',JSON.stringify({r:r.types,lp:gameState.players[1].lp,zone:r.zone}));
  audit(c.card);
}
/* 合成カード（テストVM内だけ）: 複数の種類のコスト（LP + 手札を捨てる + フラグ）を払った後に対象選択が失敗 — 全部が戻る */
defineScript('アンティ勝負',{
  type:'spell',priority:1,targets:true,
  condition(ctx){ if(!API.fieldCards({zone:'mz'}).length){ ctx.reason='フィールドにモンスターがいません'; return false; } return true; },
  cost(ctx,done){ API.payCost(ctx.player,1000); const h=gameState.players[ctx.player].hand; if(h.length) API.sendHandToGrave(ctx.player,0,'アンティ勝負（コスト）'); done(true); },
  selectTargets(ctx,done){ API.selectCard('テスト：対象',API.fieldCards({zone:'mz'}),t=>done([t])); },
  resolve(){}
});
{ const x=build({card:'アンティ勝負',board:'C',mode:'imm',hand:o=>[mk('ワイト',o),mk('はにわ',o)]});
  const P1=gameState.players[1];const hand0=P1.hand.map(c=>c.uid).join(','),g0=P1.grave.length;
  const r=attempt(x);
  ok('multi-part cost (1000 LP + a discard): all of it is restored — LP, the discarded card, the hand order, the Graveyard',P1.lp===8000&&P1.hand.map(c=>c.uid).join(',')===hand0&&P1.grave.length===g0&&r.zone==='hand'&&v41StateDigest(gameState)===x.D0,JSON.stringify({lp:P1.lp,hand:P1.hand.length,grave:P1.grave.length,types:r.types}));
  ok('multi-part cost: the journal shows the cost actions and then the single abort',r.types.length>=4&&r.types[r.types.length-1]==='PREP_TX_ABORT_S03:insufficient',JSON.stringify(r.types));
  audit('multi-part cost'); }

/* ===== 4. 手動キャンセル（候補不足とは別の理由 'cancel'）===== */
{ const x=build({card:'リビングデッドの呼び声',board:'A',mode:'ctl'});
  const r=attempt(x);const sigAtOpen=sigSeq();
  ok('cancel: the Set trap opens a cancelable target choice (the cost-free, targetable case)',r.pend&&pc().cancelable===true&&r.face==='up'&&r.tx,JSON.stringify(r));
  const j1=V41_ACTION_JOURNAL.length;cancelChoiceV49();
  const h=findCardByUid(x.card.uid);
  ok('cancel: the choice is gone, no chain link, the trap is FACE-DOWN again (pre-activation state)',!pc()&&gameState.chain.length===0&&h.zone==='sz'&&h.card.face==='down',JSON.stringify({pend:!!pc(),chain:gameState.chain.length,zone:h.zone,face:h.card.face}));
  ok('cancel: distinguishable from an insufficient-candidates failure — the abort reason is cancel and the explicit insufficient signal did not move',jt(j1).join()==='CHOICE_CANCEL_V49,PREP_TX_ABORT_S03:cancel'&&sigSeq()===sigAtOpen,JSON.stringify({types:jt(j1),sig:sigSeq()-sigAtOpen}));
  ok('cancel: the whole state equals the pre-activation digest and the record is cleared',v41StateDigest(gameState)===x.D0&&gameState.prepTxS03===undefined,'');
  ok('cancel: the trap offers its activation again (re-operable)',getLegalZoneActions(1,'sz',x.szIdx).some(a=>a.id==='activateSet'),'');
  audit('cancel (Set trap)');
  const r2=attempt(x);PREFER=[x.gB.uid];driveU();PREFER=[];
  ok('cancel then re-activate: the second activation resolves normally (the revived monster is on the field)',r2.pend&&z(x.gB)==='mz'&&gameState.prepTxS03===undefined,JSON.stringify({gB:z(x.gB)}));
  audit('cancel then re-activate'); }
{ const x=build({card:'月の書',board:'C',mode:'ctl'});
  const r=attempt(x);
  ok('cancel (hand Spell): 月の書 was moved to the Spell & Trap Zone and opens a cancelable choice',r.pend&&r.zone==='sz'&&r.hand===0&&r.tx,JSON.stringify(r));
  cancelChoiceV49();const h=findCardByUid(x.card.uid);
  ok('cancel (hand Spell): the Spell is returned to the hand, the digest equals the pre-activation digest',h.zone==='hand'&&gameState.players[1].sz.length===0&&v41StateDigest(gameState)===x.D0,JSON.stringify({zone:h.zone}));
  audit('cancel (hand Spell)'); }
/* キャンセル時にコスト支払い済み: 合成カード（有効な対象がある）で LP 1000 + 手札1枚を払った後に対象選択をやめる */
{ const x=build({card:'アンティ勝負',board:'C',mode:'ctl',hand:o=>[mk('ワイト',o)]});
  const P1=gameState.players[1];const r=attempt(x);
  ok('cancel after the cost: the cost is paid and the target choice is open',r.pend&&P1.lp===7000&&P1.hand.length===0,JSON.stringify({lp:P1.lp,hand:P1.hand.length}));
  cancelChoiceV49();
  ok('cancel after the cost: LP, the discarded card and the card itself are all back; digest equals the pre-activation digest',P1.lp===8000&&P1.hand.length===2&&v41StateDigest(gameState)===x.D0,JSON.stringify({lp:P1.lp,hand:P1.hand.length}));
  audit('cancel after the cost'); }

/* ===== 5. 推測しない: コールバックが来ない・選択待ちが無い、というだけでは中止しない =====
   合成カード: selectTargets が何もしない（選択も出さず、候補不足の合図も出さない）。ユーザーの条件: 「コールバックが来ない／pendingChoice が無い」だけで中止してはならない */
defineScript('エクスチェンジ',{
  type:'spell',priority:1,
  condition(){ return true; },
  selectTargets(ctx,done){ /* 何もしない: コールバックも合図も無い */ },
  resolve(){}
});
{ const x=build({card:'エクスチェンジ',board:'C',mode:'imm'});const a0=aborts().length;
  const r=attempt(x);
  ok('no inference: with no callback, no pending choice and NO explicit signal the preparation is not aborted (no abort in the journal)',r.sigd===0&&!r.pend&&aborts().length===a0&&!r.types.some(t=>/ABORT/.test(t)),JSON.stringify({sigd:r.sigd,types:r.types}));
  ok('no inference: the record stays open (not cleared, not restored) — only the explicit signal, a cancel or a cost failure close it',r.tx&&r.zone==='sz'&&r.face==='up',JSON.stringify(r));
  /* 開いたままの記録があっても、別の処理（解決時など）の候補不足では巻き戻さない: 合図はその準備の uid の窓の中だけで見る */
  const dgOpen=v41StateDigest(gameState),sigBefore=sigSeq();
  const retEmpty=API.selectCard('unrelated resolution-time pick',[],()=>{});
  ok('isolation: an unrelated selection with no candidates moves the explicit signal (and API.selectCard now returns false) but does not touch the open record of another card',sigSeq()===sigBefore+1&&retEmpty===false&&txCheck(sigBefore,999999)===false&&!!gameState.prepTxS03&&v41StateDigest(gameState)===dgOpen,JSON.stringify({sig:sigSeq()-sigBefore,ret:retEmpty}));
  /* 次の準備の BEGIN は記録を1つに保つ（置き換える） */
  const y=build({card:'月の書',board:'C',mode:'ctl'});attempt(y);
  ok('exactly one restore record at a time: a new preparation replaces the open one',gameState.prepTxS03&&gameState.prepTxS03.uid===y.card.uid,JSON.stringify(gameState.prepTxS03&&{uid:gameState.prepTxS03.uid,name:gameState.prepTxS03.name}));
  cancelChoiceV49(); }

/* ===== 6. CHAIN_ADD が境界: 正常な発動、発動後の不発・無効ではコストを返さない ===== */
{ const x=build({card:'洗脳－ブレインコントロール',board:'C',mode:'partial'});const P1=gameState.players[1];
  const r=attempt(x);PREFER=[x.plain.uid];for(let n=0;n<4&&pc();n++)pickU();PREFER=[];
  ok('commit: the activation is on the chain with the 800 LP paid; the restore record was closed by the CHAIN_ADD itself',gameState.chain.length===1&&P1.lp===7200&&gameState.prepTxS03===undefined,JSON.stringify({chain:gameState.chain.length,lp:P1.lp}));
  ok('commit: no abort was journaled; the CHAIN_ADD follows the BEGIN',jt(r.j0).indexOf('PREP_TX_BEGIN_S03')>=0&&jt(r.j0).indexOf('CHAIN_ADD')>jt(r.j0).indexOf('PREP_TX_BEGIN_S03')&&!jt(r.j0).some(t=>/ABORT/.test(t)),JSON.stringify(jt(r.j0)));
  /* チェーンに乗った後は中止できない（境界）— 関数でも reducer でも */
  const st0=txStats(),dg=v41StateDigest(gameState);
  ok('boundary: abort after the chain link exists is refused (returns false), state unchanged, nothing journaled',txAbort('late')===false&&v41StateDigest(gameState)===dg&&txStats().abortRefused-st0.abortRefused===1,'');
  /* 解決時に不発: 対象が場を離れた */
  const tgt=x.plain;API.sendToGrave(locateCardAnyV4(tgt),'S03-U471 fizzle');
  const c0=gameState.chain.length;driveU();
  ok('fizzle after the chain link: the 800 LP are NOT refunded (7200), no abort was journaled, the Spell is not back in the hand',P1.lp===7200&&!aborts().length&&z(x.card)==='grave',JSON.stringify({lp:P1.lp,card:z(x.card),aborts:aborts().length}));
  audit('fizzle after chain'); }
{ const x=build({card:'洗脳－ブレインコントロール',board:'C',mode:'partial'});const P1=gameState.players[1];
  attempt(x);PREFER=[x.plain.uid];for(let n=0;n<4&&pc();n++)pickU();PREFER=[];
  const ok1=negatePreviousChainLinkV2('S03-U471 negation',false);
  driveU();
  ok('negation after the chain link: the 800 LP are NOT refunded either, and no abort happened',ok1&&P1.lp===7200&&!aborts().length,JSON.stringify({lp:P1.lp,aborts:aborts().length}));
  audit('negation after chain'); }

/* ===== 7. すでにチェーンに乗っているリンクは、後の準備の中止の影響を受けない（チェーンへの応答の失敗）===== */
{ const restore=rawCothCondition();
  fresh(0);const P=gameState.players;
  const host=mon('サイバー・ドラゴン',0),armor=mk(ARM,0,'up'),tgt=mon('ライオウ',1);
  P[0].mz=[host];P[0].sz=[armor];P[1].mz=[tgt];
  const g1=mk('クリッター',1),g2=mk('ワイト',1);P[1].grave=[g1,g2];
  const brain=mk('洗脳－ブレインコントロール',0,'up');P[0].hand=[brain];
  const trap=mk('リビングデッドの呼び声',1,'down');trap.setTurn=gameState.turn-1;P[1].sz=[trap];
  baselineA();API.equipSpell(locateCardAnyV4(armor),locateCardAnyV4(host),'S03-U471 fixture');
  duelActivateFromHand(0);PREFER=[tgt.uid];for(let n=0;n<4&&pc();n++)pickU();PREFER=[];
  const link0=JSON.stringify(gameState.chain),lpP0=P[0].lp;
  ok('response setup: 洗脳 (P0, 800 LP paid) is chain link 1 and P1 holds priority',gameState.chain.length===1&&lpP0===7200&&gameState.chainWindow&&gameState.chainWindow.priority===1&&gameState.prepTxS03===undefined,JSON.stringify({chain:gameState.chain.length,lp:lpP0,win:gameState.chainWindow}));
  const D1=v41StateDigest(gameState);TOASTS.length=0;const j0=V41_ACTION_JOURNAL.length;
  duelActivateResponseV2(1,'sz',0);
  ok('response failure: P1 trap responds, its target step fails (the opponent Armor), and the response is restored — the trap is face-down again',z(trap)==='sz'&&C(trap).face==='down'&&TOASTS.indexOf('選択できるカードが足りません')>=0&&!pc(),JSON.stringify({zone:z(trap),face:C(trap)&&C(trap).face,toasts:TOASTS}));
  ok('response failure: the already-chained link is untouched (same chain, same link), P0 keeps paying the 800 LP, only the response was undone',JSON.stringify(gameState.chain)===link0&&P[0].lp===lpP0&&v41StateDigest(gameState)===D1,JSON.stringify({chain:gameState.chain.length,lp:P[0].lp}));
  ok('response failure: journal = BEGIN, flip, ABORT for the response only; no earlier action was touched',jt(j0).join()==='PREP_TX_BEGIN_S03,FX_SET_STATE,PREP_TX_ABORT_S03:insufficient',jt(j0).join());
  driveU();
  ok('response failure: the original chain still resolves afterwards (洗脳 takes control of the target)',(()=>{const h=findCardByUid(tgt.uid);return !!h&&h.p===0;})(),'');
  audit('response failure');
  restore(); }

/* ===== 8. 中止は1回だけ（冪等）===== */
{ const restore=rawCothCondition();
  const x=build({card:'リビングデッドの呼び声',set:true,board:'A',mode:'imm'});attempt(x);
  const dg=v41StateDigest(gameState),n0=aborts().length,j0=V41_ACTION_JOURNAL.length,st0=txStats();
  ok('abort twice: the second call returns false (nothing to abort)',txAbort('again')===false&&txAbort('and again')===false,'');
  ok('abort twice: exactly one abort in the journal for the one preparation, journal unchanged, state unchanged',aborts().length===n0&&V41_ACTION_JOURNAL.length===j0&&v41StateDigest(gameState)===dg&&txStats().abort===st0.abort,JSON.stringify({aborts:aborts().length,n0}));
  /* reducer 単体（Replay が適用するもの）も冪等 */
  const snap=JSON.stringify(gameState);const g2=JSON.parse(snap);applyAction(g2,{type:'PREP_TX_ABORT_S03',player:1,uid:x.card.uid,reason:'again'});
  ok('abort twice (reducer): applying PREP_TX_ABORT_S03 where no record exists changes nothing',JSON.stringify(g2).replace(/"log":\[.*?\]/,'')===snap.replace(/"log":\[.*?\]/,''),'');
  /* 別の準備の記録には触らない */
  const y=build({card:'月の書',board:'C',mode:'ctl'});attempt(y);
  const g3=JSON.parse(JSON.stringify(gameState));applyAction(g3,{type:'PREP_TX_ABORT_S03',player:1,uid:999999,reason:'wrong uid'});
  ok('abort (reducer): an abort for another card uid leaves the open record untouched',g3.prepTxS03&&g3.prepTxS03.uid===y.card.uid,'');
  cancelChoiceV49();
  restore(); }

/* ===== 9. 手札のカードの準備が「置いた後に条件を満たさない」: 戻す／永続魔法は従来どおり ===== */
{ const x=build({card:'ライトニング・ボルテックス',board:'C',mode:'ctl'});const r=attempt(x);
  ok('refused after placement (single card in hand, 捨てる手札がありません): the Spell is returned to the hand — reason refused (a legality failure, not the insufficient signal)',r.zone==='hand'&&r.szN===0&&r.sigd===0&&r.types[r.types.length-1]==='PREP_TX_ABORT_S03:refused'&&v41StateDigest(gameState)===x.D0,JSON.stringify(r));
  audit('refused after placement'); }
{ const x=build({card:'デッキロック',board:'C',mode:'ctl'});const r=attempt(x);
  ok('Continuous Spell placed from the hand (デッキロック, U415): kept as before — placed face-up with no chain link (by design); the record is closed without a restore',r.zone==='sz'&&r.face==='up'&&r.chain===0&&!r.tx&&r.types.join()==='PREP_TX_BEGIN_S03,MOVE,PREP_TX_COMMIT_S03:close',JSON.stringify(r)); }

/* ===== 11. Undo / Redo をまたぐ ===== */
{ const x=build({card:'リビングデッドの呼び声',board:'A',mode:'ctl'});
  const r=attempt(x);cancelChoiceV49();
  const D1=v41StateDigest(gameState);
  ok('undo/redo setup: the cancel restored the pre-activation digest',D1===x.D0&&!gameState.prepTxS03,'');
  const st0=txStats();
  undo();
  ok('undo (across the abort): back to the open target choice, with the trap face-up and the restore record open again',!!pc()&&C(x.card).face==='up'&&!!gameState.prepTxS03&&gameState.prepTxS03.uid===x.card.uid,JSON.stringify({pend:!!pc(),face:C(x.card).face,tx:!!gameState.prepTxS03}));
  ok('undo: the live table is rebuilt from the state, and the legacy choice callbacks survive (the choice is answerable)',txLive(x.card.uid)&&pc().candidates.length>0,'');
  redo();
  ok('redo: the post-abort state returns exactly (face-down, no choice, no record, same digest); the abort was not run again',!pc()&&C(x.card).face==='down'&&!gameState.prepTxS03&&v41StateDigest(gameState)===D1&&txStats().abort===st0.abort,JSON.stringify({digestEq:v41StateDigest(gameState)===D1,abort:txStats().abort-st0.abort}));
  undo();cancelChoiceV49();
  ok('undo then cancel again: the same preparation can be cancelled once more (restored again, reason cancel) — an undo re-opens the preparation, so this is not a second abort of one preparation',!pc()&&C(x.card).face==='down'&&v41StateDigest(gameState)===D1,'');
  undo();PREFER=[x.gB.uid];driveU();PREFER=[];
  ok('undo then answer: the undone choice can be answered and the activation completes (CHAIN_ADD closes the record, the monster is revived)',z(x.gB)==='mz'&&gameState.prepTxS03===undefined,JSON.stringify({gB:z(x.gB),tx:!!gameState.prepTxS03}));
}
{ const restore=rawCothCondition();
  const x=build({card:'リビングデッドの呼び声',set:true,board:'A',mode:'imm'});attempt(x);
  const D1=v41StateDigest(gameState);
  undo();
  ok('undo (across an insufficient abort): lands on the point after the restore record was taken — board identical to pre-activation, record open',!!gameState.prepTxS03&&C(x.card).face==='down'&&!pc(),JSON.stringify({tx:!!gameState.prepTxS03,face:C(x.card).face}));
  redo();
  ok('redo: the post-abort state returns exactly',!gameState.prepTxS03&&C(x.card).face==='down'&&v41StateDigest(gameState)===D1,'');
  restore(); }

/* ===== 12. Save / Load の素材（VM2 で読む）===== */
{ const restore=rawCothCondition();
  const x=build({card:'リビングデッドの呼び声',set:true,board:'A',mode:'imm'});attempt(x);
  ok('Save/Load SLa setup: an aborted preparation is behind us (record cleared, trap face-down)',!gameState.prepTxS03&&C(x.card).face==='down','');
  globalThis.__SAVES.SLa=JSON.stringify({raw:savedRaw(),digest:v41StateDigest(gameState),D0:x.D0,u:{card:uid(x.card),armor:uid(x.armor),gB:uid(x.gB)},szIdx:x.szIdx});
  restore(); }
{ /* SLb: 準備の途中（コスト支払い済みで対象選択が開いている）で保存 */
  const x=build({card:'アンティ勝負',board:'C',mode:'ctl',hand:o=>[mk('ワイト',o)]});
  const rawBefore=savedRaw();const r=attempt(x);
  ok('Save/Load SLb setup: the cost is paid (1000 LP + 1 discard) and the target choice is open with the record in the state',r.pend&&gameState.players[1].lp===7000&&!!gameState.prepTxS03,JSON.stringify({lp:gameState.players[1].lp,tx:!!gameState.prepTxS03}));
  const rawMid=savedRaw();
  globalThis.__SAVES.SLb=JSON.stringify({raw:rawMid,D0:x.D0,u:{card:uid(x.card)},sizes:{before:rawBefore.length,mid:rawMid.length,recordChars:(JSON.stringify(gameState.prepTxS03)||'').length,stateChars:JSON.stringify(gameState).length}});
  cancelChoiceV49(); }

/* ===== 13. セーブサイズ（実戦に近い局面: 両者 40 枚デッキ・場・墓地）===== */
{ fresh(1);const P=gameState.players;
  const names=['ワイト','はにわ','クリッター','ライオウ','サイクロン','月の書','ジェネティック・ワーウルフ','サイバー・ドラゴン'];
  for(let p=0;p<2;p++){P[p].deck=Array.from({length:40},(_,i)=>mk(names[i%names.length],p));
    P[p].hand=Array.from({length:5},(_,i)=>mk(names[(i+3)%names.length],p));
    P[p].mz=[mon('ライオウ',p),mon('サイバー・ドラゴン',p),mon('クリッター',p)];P[p].grave=Array.from({length:8},(_,i)=>mk(names[i%names.length],p));
    P[p].sz=[mk('月の書',p,'down'),mk('サイクロン',p,'down')];}
  const c=mk('洗脳－ブレインコントロール',1,'up');P[1].hand.push(c);baselineA();
  const idle=savedRaw().length;
  const x={o:1,card:c,hidx:P[1].hand.length-1,set:false};
  /* 洗脳 を発動して対象選択が開いた時点（記録が開いている）*/
  P[0].mz=[mon('ライオウ',0)];P[1].mz=[mon('ライオウ',1)];
  const aliveRaw=(()=>{const r=attempt({o:1,card:c,hidx:P[1].hand.length-1,set:false});return r;})();
  const pcState=!!pc();
  const withRec=savedRaw().length,recChars=gameState.prepTxS03?JSON.stringify(gameState.prepTxS03).length:0;
  ok('save size: a realistic mid-activation save (40-card decks, fields, graves) carries one restore record — measured, informational',true,JSON.stringify({idleSaveChars:idle,midPrepSaveChars:withRec,recordChars:recChars,deltaChars:withRec-idle,choiceOpen:pcState}));
  const rec=gameState.prepTxS03;
  ok('save size: the record is exactly ONE snapshot — it excludes itself (no recursion), the log, the chain and the processor, and carries no Journal; it is smaller than the state it copies',
    !!rec&&!('prepTxS03' in rec.snap)&&!('log' in rec.snap)&&!('chain' in rec.snap)&&!('processorQueue' in rec.snap)&&!('__v41Seq' in rec.snap)&&recChars<JSON.stringify(Object.assign({},gameState,{prepTxS03:undefined})).length,JSON.stringify({keys:rec&&Object.keys(rec.snap).length,recChars}));
  const j0s=V41_ACTION_JOURNAL.length;
  if(pc())cancelChoiceV49();
  const afterAbort=savedRaw().length;
  ok('save size: after the abort the record is gone and the save returns to the idle size plus only the few journal entries (measured, informational)',!gameState.prepTxS03&&afterAbort<idle+0.12*idle,JSON.stringify({idle,afterAbort,journalAdded:V41_ACTION_JOURNAL.length-j0s})); }

/* ===== 14. 免疫以外の原因で止まる 15 枚（S03-U470 の調査）に対する、明示の失敗合図の結果 =====
   問い: 新しい合図（候補不足）は、免疫以外の原因（「捨てる手札が無い」「この場所・タイミングで発動できる効果がありません」）も拾うか。
   結果（盤面: 手札が発動カード1枚だけ）:
     - 15枚中 13 枚は、手札から置いた後の合法性判定（strictScriptLegalityV2）が通らず、選択を一度も開かない → 候補不足の合図は進まない（拾わない）。
       事前判定（置く前）が手札の「自分自身」を数えて通ってしまう形で、手札に他のカードがあれば（richer hand）普通に動く = 盤面の人工物。
       このうち永続魔法 4 枚（ゼンマイマニュファクチャ / ボスラッシュ / デッキロック / 縮退回路）は「手札から置くだけ・チェーン無し」が既存の設計（U415）なので戻さず、記録だけ閉じる。
       残り 9 枚は『置いた後に条件を満たさない』ため 'refused' で置く前に戻す（候補不足とは別の理由）。
     - ブラックフェザー・シュートは候補不足の合図で拾われる（コスト支払い済みの形: BF を墓地へ送った後に対象選択が断られる）。
     - D・D・R は盤面（除外されたモンスター）を足すと再現し、'refused'。 */
const SURVEY15=[
  {n:'ライトニング・ボルテックス',cls:'refused'},{n:'リロード',cls:'refused'},{n:'振り出し',cls:'refused'},{n:'死者への手向け',cls:'refused'},{n:'ブラック・コア',cls:'refused'},
  {n:'死者転生',cls:'refused',board:'A'},{n:'鳳凰神の羽根',cls:'refused',board:'A'},{n:'カード・フリッパー',cls:'refused'},{n:'アームド・チェンジャー',cls:'refused',noRich:true},
  {n:'D・D・R',cls:'refused',noRich:true,extra:(x,P,o)=>{P[0].banish=[mk('クリッター',0)];P[1].banish=[mk('クリッター',1)];}},
  {n:'ゼンマイマニュファクチャ',cls:'design'},{n:'ボスラッシュ',cls:'design'},{n:'デッキロック',cls:'design'},{n:'縮退回路',cls:'design'},
];
{ const counts={refused:0,design:0,signal:0};
  for(const c of SURVEY15){
    const x=build({card:c.n,board:c.board||'C',mode:'ctl',extra:c.extra});const r=attempt(x);
    const last=r.types[r.types.length-1];
    if(c.cls==='refused'){
      ok(c.n+' (single card in hand): NOT caught by the insufficient signal (it fails the legality check after placement) — undone by the refused path instead, back in the hand, digest equals pre-activation',
        r.offered&&r.sigd===0&&last==='PREP_TX_ABORT_S03:refused'&&r.zone==='hand'&&v41StateDigest(gameState)===x.D0,JSON.stringify({toast:r.toast,types:r.types,sigd:r.sigd}));
      counts.refused++;
    }else{
      ok(c.n+' (Continuous Spell placed from the hand): not caught by the signal either; kept as before (placed face-up, no chain link — U415 design); the record is closed without a restore',
        r.offered&&r.sigd===0&&r.zone==='sz'&&r.face==='up'&&r.chain===0&&!r.tx&&last==='PREP_TX_COMMIT_S03:close',JSON.stringify({toast:r.toast,types:r.types}));
      counts.design++;
    }
    if(!c.noRich&&c.cls==='refused'){
      const y=build({card:c.n,board:c.board||'C',mode:'ctl',hand:o=>[mk('サイクロン',o),mk('ワイト',o),mk('月の書',o),mk('大嵐',o)]});const r2=attempt(y);
      ok(c.n+' (richer hand = other cards to discard/use): no stall at all — the choice opens or it chains, no abort (the stall was a one-card-hand artifact of the pre-check counting the card itself)',
        r2.offered&&(r2.pend||r2.chain>0)&&!r2.types.some(t=>/ABORT/.test(t)),JSON.stringify({toast:r2.toast,types:r2.types}));
      if(r2.pend)cancelChoiceV49();
    }
    audit(c.n+' survey');
  }
  /* ブラックフェザー・シュート: 候補不足の合図が拾う唯一の形（コスト支払い済み。選択の続きで対象選択が断られる）*/
  const x=build({card:'ブラックフェザー・シュート',board:'C',mode:'imm',hand:o=>[mk('BF－疾風のゲイル',o)],extra:(x,P,o)=>{x.m0.pos='def';}});
  const P1=gameState.players[1];const hand0=P1.hand.length;const r=attempt(x);
  ok('ブラックフェザー・シュート: the cost choice (which Blackwing to send) opens first; nothing has been paid yet',r.pend&&r.zone==='sz'&&P1.hand.length===hand0-1,JSON.stringify(r));
  const j1=V41_ACTION_JOURNAL.length;const sig0=sigSeq();pickU();
  ok('ブラックフェザー・シュート: CAUGHT by the explicit insufficient signal in the continuation — the cost (the Blackwing to the Graveyard) is undone, the Spell is back in the hand, digest equals pre-activation',
    sigSeq()-sig0===1&&jt(j1).join()==='CHOICE_ANSWER_V49,FX_HAND_SEND_GRAVE,PREP_TX_ABORT_S03:insufficient'&&P1.hand.length===hand0&&P1.grave.length===0&&v41StateDigest(gameState)===x.D0,JSON.stringify({types:jt(j1),hand:P1.hand.length,grave:P1.grave.length}));
  audit('ブラックフェザー・シュート'); counts.signal++;
  ok('survey tally: all 15 cards of the S03-U470 list reproduced (D・D・R needs banished monsters, ブラックフェザー・シュート a Blackwing in hand). The insufficient signal catches 1 of 15 (ブラックフェザー・シュート, a cost-paid selection failure); the other 14 fail a legality check after placement and never open a selection: 10 are undone by the refused path (8 of them run normally with a richer hand), 4 are by-design Continuous Spell placements',counts.refused===10&&counts.design===4&&counts.signal===1,JSON.stringify(counts)); }

/* ===== 15. 主要デッキのモンスター効果で「選択できるカードが足りません」で終わる 9 枚 =====
   U470 は「状態変化は観測されなかった（無害な不発）」と記録したが、依頼により、準備フラグ・優先権・再操作性を確かめるまで無害とは言わない。
   ベース（cd55f5fd）での実測（修正前、同じ盤面）:
     - 準備フラグ（ACTIVATION_PREP_S03・保留中の宣言/コスト・コストのスナップショット・確認シート）: 全員クリア。
     - 優先権（gameState.priority・chainWindow・チェーン長・processor の待ち）: 全員不変。
     - 再操作性: 8 枚は同じ効果が再び提示され、再試行しても同じ拒否で状態は動かない。
       **トラゴエディア は例外**: 失敗した試行が 1 ターンに 1 度の使用フラグ（FX_CARD_FLAG_V46）を消費し、その後は効果が提示されなくなった（そのターンは使えなくなる）。
       つまり U470 の「状態変化なし」は誤りだった（フラグは盤面の枚数ではなく digest にも出る）。本単位のトランザクションでフラグも戻り、再び提示される。
     - マスター・ヒュペリオン: 本単位の盤面（手札・墓地・場、A/A2/C と代行者・光/天使族の墓地）では再現できなかった。無害とは断定しない（未再現）。 */
function setupMon(board,m,zone){
  fresh(1);const P=gameState.players,x={};
  if(board==='A'){
    x.host=mon('サイバー・ドラゴン',0);x.armor=mk(ARM,0,'up');P[0].mz=[x.host];P[0].sz=[x.armor];
    P[1].grave=[mk('ライオウ',1),mk('クリッター',1),mk('ワイト',1),mk('BF－黒槍のブラスト',1),mk('E・HERO フェザーマン',1)];P[0].grave=[mk('ワイト',0)];
  }else{P[0].mz=[mon(OBE,0)];P[1].mz=[mon(OBE,1)];P[1].grave=[mk('ライオウ',1),mk('クリッター',1)];}
  x.m=mk(m,1,'up');x.m.summonedTurn=3;
  if(zone==='mz')P[1].mz.push(x.m);else if(zone==='grave')P[1].grave.push(x.m);else P[1].hand.push(x.m);
  baselineA();
  if(board==='A')API.equipSpell(locateCardAnyV4(x.armor),locateCardAnyV4(x.host),'S03-U471 fixture');
  x.D0=v41StateDigest(gameState);return x;}
function prioSnap(){return JSON.stringify({priority:gameState.priority,chainWindow:gameState.chainWindow,chain:gameState.chain.length,pc:!!pc(),paused:!!gameState.processorPaused,waiting:gameState.processorWaiting,queue:(gameState.processorQueue||[]).length,active:gameState.activePlayer,phase:gameState.phase,evt:typeof EVT_V2_STATE!=='undefined'&&!!EVT_V2_STATE});}
function monIds(zone,m){const h=findCardByUid(m.uid);return h?(zone==='hand'?getLegalHandActions(1,h.index):getLegalZoneActions(1,h.zone,h.index)).map(a=>a.id).filter(i=>/effect|activate/i.test(i)):[];}
const MON9=[
  ['ダーク・アームド・ドラゴン','mz','A'],['トラゴエディア','mz','A'],['BF－暁のシロッコ','mz','A'],['スクラップ・ドラゴン','mz','A'],['ワーム・キング','mz','A'],
  ['BF－疾風のゲイル','mz','C'],['ダークエンド・ドラゴン','mz','C'],['カオス・ソーサラー','grave','C'],
];
for(const [m,zone,board] of MON9){
  const x=setupMon(board,m,zone);const idx=(gameState.players[1][zone]||[]).indexOf(x.m);
  const ids0=monIds(zone,x.m),pr0=prioSnap();TOASTS.length=0;const j0=V41_ACTION_JOURNAL.length;
  if(zone==='hand')duelActivateFromHand(idx);else duelActivateFromZone(1,zone,idx,{});
  ok(m+' ('+zone+', board '+board+'): the effect is offered and ends with 「選択できるカードが足りません」',ids0.length>0&&TOASTS.slice(-1)[0]==='選択できるカードが足りません',JSON.stringify({ids0,toast:TOASTS.slice(-1)[0],types:jt(j0)}));
  ok(m+': preparation flags clear (no live preparation, no pending declaration/cost, no open prompt, no restore record)',!ACTIVATION_PREP_S03&&!gameState.pendingDeclarationV11&&!(gameState.pendingActivationCostV11||[]).length&&!(gameState.pendingCostSnapshots||[]).length&&!(typeof PROMPT_OPEN_S03!=='undefined'&&PROMPT_OPEN_S03)&&!gameState.prepTxS03,JSON.stringify({prep:!!ACTIVATION_PREP_S03,tx:!!gameState.prepTxS03}));
  ok(m+': priority unchanged (priority, chain window, chain length, processor wait, active player, phase)',prioSnap()===pr0,pr0+' -> '+prioSnap());
  ok(m+': nothing changed at all — the state digest equals the pre-activation digest'+(m==='トラゴエディア'?' (the once-per-turn flag the failed attempt used to consume is restored)':''),v41StateDigest(gameState)===x.D0,jt(j0).join());
  const ids1=monIds(zone,x.m);
  ok(m+': re-operable — the same effect is offered again'+(m==='トラゴエディア'?' (before this unit the failed attempt consumed the once-per-turn flag and the effect was no longer offered)':''),ids1.join()===ids0.join()&&ids1.length>0,JSON.stringify({ids0,ids1}));
  const j1=V41_ACTION_JOURNAL.length;TOASTS.length=0;const h1=findCardByUid(x.m.uid);
  if(zone==='hand')duelActivateFromHand(h1.index);else duelActivateFromZone(1,h1.zone,h1.index,{});
  ok(m+': trying again gives the same refusal and the state digest is still the pre-activation digest (no cost, no flag accumulates)',TOASTS.slice(-1)[0]==='選択できるカードが足りません'&&v41StateDigest(gameState)===x.D0,jt(j1).join());
  audit(m);
}
ok('マスター・ヒュペリオン (the 9th of the S03-U470 list) was NOT reproduced in hand / Graveyard / field on boards A, A2, C (its Graveyard ignition has the cost choice first) — harmlessness is NOT asserted for it',true,'');

/* ===== 16. 複数のカードを対象にする効果（裁定未確定: RULING_UNRESOLVED）— 現象の記録だけ =====
   裁定: 「複数のカードを対象にする効果の場合、発動を制限することはできません。よって発動することができます。」（2009-06-18, WIKI-32A7C5F81B06, メタルシルバー・アーマー）。
   ユーザーは condition での一律の断りを入れないと判断した。以下は、**準備の停止状態がトランザクションで戻る**ことの観測であり、
   裁定に合っている／TESTED とは主張しない。保護されたカードを複数対象の 1 枚として選べるのか、発動だけ許されるのかは回答から読み切れない（未決のまま）。 */
function a2board(x,P,o){
  P[1].mz=P[1].mz.concat(['六武衆のご隠居','TG ワーウルフ'].map(n=>mon(n,1)));
  P[1].grave=P[1].grave.concat(['E・HERO フェザーマン','六武衆のご隠居','TG ストライカー'].map(n=>mk(n,1)));
}
for(const c of [
  {n:'貪欲な壺',extra:a2board},
  {n:'諸刃の活人剣術',extra:(x,P,o)=>{P[o].grave=P[o].grave.concat([mk('六武衆のご隠居',o),mk('六武衆の影武者',o),mk('六武衆－ヤリザ',o)]);P[o].mz=P[o].mz.concat([mon('六武衆－ザンジ',o)]);}},
  {n:'TGX3－DX2',extra:(x,P,o)=>{P[o].grave=P[o].grave.concat([mk('TG ストライカー',o),mk('TG ワーウルフ',o),mk('TG ラッシュ・ライノ',o)]);}},
]){
  const x=build({card:c.n,board:'A',mode:'imm',extra:c.extra});const r=attempt(x);
  ok('RULING_UNRESOLVED characterization — '+c.n+' (multi-target): the stuck state of U470 (face-up, no chain) is now undone by the transaction; this is NOT a ruling-compliance or TESTED claim (condition-level rejection stays unimplemented)',
    r.offered&&r.toast==='選択できるカードが足りません'&&!r.pend&&r.chain===0&&r.types[r.types.length-1]==='PREP_TX_ABORT_S03:insufficient'&&v41StateDigest(gameState)===x.D0,JSON.stringify({types:r.types,zone:r.zone,face:r.face}));
}

/* ===== 17. 登録済みの選択（P1.1）での発動準備 — 保存・読込で記録が運ばれる =====
   補充要員 は P1.1 の宣言/選択を使う。対象選択の最中に保存した状態には復元点の記録が入っており（gameState の中）、読込後に選択を続けると CHAIN_ADD で記録が閉じる。 */
{ const x=build({card:'補充要員',board:'C',mode:'ctl',extra:(x,P,o)=>{P[o].grave=Array.from({length:5},(_,i)=>mk(['ワイト','はにわ','クリッター','ライオウ','ワイト'][i],o));}});
  const r=attempt(x);
  const q=pc();
  ok('P1.1 mid-preparation (補充要員): the choice is open, the record is in the state'+(q?(' (legacy='+q.legacy+')'):''),r.offered&&!!q&&r.tx,JSON.stringify({types:r.types,legacy:q&&q.legacy}));
  if(q&&!q.legacy)globalThis.__SAVES.SLc=JSON.stringify({raw:savedRaw(),u:{card:uid(x.card)},D0:x.D0});
  if(pc())cancelChoiceV49();
  ok('P1.1 cancel (補充要員): cancelling the registered choice undoes the preparation — the Trap is face-down again, digest equals pre-activation',(()=>{const h=findCardByUid(x.card.uid);return !!h&&h.zone==='sz'&&h.card.face==='down';})()&&v41StateDigest(gameState)===x.D0&&!gameState.prepTxS03,JSON.stringify({types:jt(r.j0)}));
  audit('P1.1 cancel'); }
`);

const SAVES=first.__SAVES||{};
if(!SAVES.SLa||!SAVES.SLb){console.log('FAIL Save/Load VM1 saves missing');process.exitCode=2;}
else harness('const SAVES='+JSON.stringify(SAVES)+';'+COMMON+String.raw`
function loadRaw(raw){resetA();CHOICE_LEGACY_CB_V49.clear();/* 新しいブラウザ起動と同じ: 前の読込で開いた legacy 継続の退避表を空にする */localStorage.setItem(DUEL_SAVE_KEY,raw);TOASTS.length=0;return offerResumeDuel();}
/* SLa: 中止済みの準備の後で保存 → 読込 */
{ const o=JSON.parse(SAVES.SLa),I=o.u;
  const resumed=loadRaw(o.raw);
  ok('Save/Load SLa: the save resumes; the loaded state is the saved state (digest) with no record and no pending choice',resumed&&v41StateDigest(gameState)===o.digest&&!gameState.prepTxS03&&!pc(),JSON.stringify({resumed,eq:v41StateDigest(gameState)===o.digest}));
  ok('Save/Load SLa: the whole loaded state still equals the pre-activation digest (the restore was complete, not just visually)',v41StateDigest(gameState)===o.D0,v41StateDigest(gameState)+' vs '+o.D0);
  const h=findCardByUid(I.card);
  ok('Save/Load SLa: the trap is face-down in the Spell & Trap Zone, the Armor still immune (refused up front by U470 condition)',h.zone==='sz'&&h.card.face==='down',JSON.stringify({zone:h.zone,face:h.card.face}));
  audit('Save/Load SLa');
  API.sendToGrave(locateCardAnyV4(findCardByUid(I.armor).card),'S03-U471 load');
  duelActivateFromZone(1,'sz',o.szIdx,{});PREFER=[I.gB];driveU();PREFER=[];
  const g=findCardByUid(I.gB);
  ok('Save/Load SLa resumed: after the Armor leaves, the same trap activates and revives (the load did not break the card)',!!g&&g.zone==='mz'&&gameState.prepTxS03===undefined,JSON.stringify({gB:g&&g.zone}));
  audit('Save/Load SLa continued'); }
/* SLb: 準備の途中（コスト支払い済み・対象選択が開いたまま）で保存 → 読込: S03-U35 が Journal から発動前へ戻す。復元点の記録は持ち越されない */
{ const o=JSON.parse(SAVES.SLb),I=o.u;
  const rawStateHasRecord=/prepTxS03/.test(o.raw);
  const resumed=loadRaw(o.raw);
  ok('Save/Load SLb: the save taken mid-preparation contains the restore record (it rides in gameState)',rawStateHasRecord,'');
  ok('Save/Load SLb: the legacy choice cannot be restored; the interrupted activation is undone (S03-U35) and the player is told',resumed&&TOASTS.some(t=>/発動を取り消し/.test(t))&&!pc(),JSON.stringify({resumed,toasts:TOASTS}));
  const P1=gameState.players[1],h=findCardByUid(I.card);
  ok('Save/Load SLb: the cost is restored (8000 LP, the discarded card back in hand), the card is back in the hand, no record carried',P1.lp===8000&&h.zone==='hand'&&P1.hand.length===2&&!gameState.prepTxS03&&gameState.chain.length===0,JSON.stringify({lp:P1.lp,zone:h.zone,hand:P1.hand.length,tx:!!gameState.prepTxS03}));
  ok('Save/Load SLb: the resumed state equals the pre-activation digest',v41StateDigest(gameState)===o.D0,v41StateDigest(gameState)+' vs '+o.D0);
  audit('Save/Load SLb',true);
  ok('Save/Load SLb sizes (informational): '+JSON.stringify(o.sizes),true,''); }
/* SLc: 登録済み（registry）の選択の最中に保存 → 読込: 選択が復元され、記録が運ばれ、CHAIN_ADD で閉じる */
if(SAVES.SLc){ const o=JSON.parse(SAVES.SLc),I=o.u;
  const resumed=loadRaw(o.raw);
  ok('Save/Load SLc: a save taken during a registered (P1.1) choice resumes with the choice restored and the restore record carried in the state',resumed&&!!pc()&&!pc().legacy&&!!gameState.prepTxS03&&gameState.prepTxS03.uid===I.card,JSON.stringify({resumed,pend:!!pc(),tx:!!gameState.prepTxS03}));
  answerChoiceV49([pc().candidates[0].key]);driveU();
  ok('Save/Load SLc resumed: the choices are answered, the chain link is built and the record is closed by CHAIN_ADD — no stale record is left',gameState.prepTxS03===undefined&&!pc(),JSON.stringify({tx:!!gameState.prepTxS03,chain:gameState.chain.length}));
  audit('Save/Load SLc'); }
`);
