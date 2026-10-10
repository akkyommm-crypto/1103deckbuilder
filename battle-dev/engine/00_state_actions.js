
/* =========================================================================
   DUEL FIELD — 2人ホットシート対戦アプリ（土台）
   全状態は gameState に集約。applyAction(gameState, action) だけが状態を変更する。
   描画は render() が gameState を読むだけ（DOM から状態を書き換えない）。
   → 将来: action を相手に送り、双方が同じ applyAction を実行すればオンライン対戦化できる。
   ========================================================================= */

/* ---- ダミーカードデータ（起動時に index.html の完全版へ差し替わる）----
   実データは boot() が index.html の <script id="carddata"> から読み込む。
   各カード: {n,k,atk,def,lv,ra,at,st,ex,sub,e,c,lm?}
*/
const DUMMY_DB = [
  {n:"サイバー・ドラゴン", k:"m", atk:2100, def:1600, lv:5, ra:"機械", at:"光", st:["効果"], ex:false, sub:"", e:"相手フィールド上にモンスターが存在し、自分フィールド上にモンスターが存在しない場合、このカードは手札から特殊召喚できる。", c:"70095154"},
  {n:"可変機獣 ガンナードラゴン", k:"m", atk:2800, def:2000, lv:7, ra:"機械", at:"闇", st:["効果"], ex:false, sub:"", e:"このカードはリリースなしで通常召喚できる。この方法で通常召喚したこのカードの元々の攻撃力・守備力は半分になる。", c:"51632798"},
  {n:"ダブルコストン", k:"m", atk:1700, def:1650, lv:4, ra:"アンデット", at:"闇", st:["効果"], ex:false, sub:"", e:"闇属性モンスターをアドバンス召喚する場合、このカードは2体分のリリースにできる。", c:"44436472"},
  {n:"カイザー・シーホース", k:"m", atk:1700, def:1650, lv:4, ra:"海竜", at:"光", st:["効果"], ex:false, sub:"", e:"光属性モンスターをアドバンス召喚する場合、このカードは2体分のリリースにできる。", c:"17444133"},
  {n:"トロイホース", k:"m", atk:1600, def:1200, lv:4, ra:"獣", at:"地", st:["効果"], ex:false, sub:"", e:"地属性モンスターをアドバンス召喚する場合、このカード1体で2体分のリリースにできる。", c:"38479725"},
  {n:"青眼の白龍", k:"m", atk:3000, def:2500, lv:8, ra:"ドラゴン", at:"光", st:["通常"], ex:false, sub:"", e:"高い攻撃力を誇る伝説のドラゴン。", c:"89631139"},
  {n:"死者蘇生", k:"s", ra:"", at:"", st:[], ex:false, sub:"", e:"自分または相手の墓地のモンスター1体を対象として発動できる。そのモンスターを自分フィールドに特殊召喚する。", c:"83764718"},
  {n:"聖なるバリア －ミラーフォース－", k:"t", ra:"", at:"", st:[], ex:false, sub:"", e:"相手モンスターの攻撃宣言時に発動できる。相手フィールドの攻撃表示モンスターを全て破壊する。", c:"44095762"},
  {n:"E・HERO エアーマン", k:"m", atk:1800, def:300, lv:4, ra:"戦士", at:"風", st:["効果"], ex:false, sub:"", e:"このカードが召喚に成功した時、以下の効果から1つを選択して発動できる。①自分フィールドのHEROの数まで相手にダメージ。②デッキからHEROモンスター1体を手札に加える。", c:"22103890"},
  {n:"激流葬", k:"t", ra:"", at:"", st:[], ex:false, sub:"", e:"モンスターが召喚・反転召喚・特殊召喚された時に発動できる。フィールドのモンスターを全て破壊する。", c:"90351981"},
  {n:"ブラック・ホール", k:"s", ra:"", at:"", st:[], ex:false, sub:"", e:"フィールドのモンスターを全て破壊する。", c:"83764719"},
  {n:"サイクロン", k:"s", ra:"", at:"", st:[], ex:false, sub:"速攻", e:"フィールドの魔法・罠カード1枚を対象として発動できる。そのカードを破壊する。", c:"05318639"},
];
let CARD_DB = DUMMY_DB.slice();
const IMG_BASE = "images/cards_small/";
const IMG_BACK = "images/card_back.webp";

/* -------------------- 定数 -------------------- */
const PHASES = [
  {id:"draw", jp:"ドロー"}, {id:"standby", jp:"スタンバイ"},
  {id:"main1", jp:"メイン1"}, {id:"battle", jp:"バトル"},
  {id:"main2", jp:"メイン2"}, {id:"end", jp:"エンド"},
];
const ZONE_LIMITS = { mz:5, sz:5, field:1 };
const PNAME = ["プレイヤー I", "プレイヤー II"];

/* -------------------- gameState -------------------- */
/* players[p] = {lp, hand[], deck[], mz[], sz[], field, grave[], banish[], ex[]}
   各ゾーンは "配置カード" の配列。カード＝{id(DB index), face:'up'|'down', pos:'atk'|'def'} */
let gameState = null;

function makePlayer(){
  return {
    lp:8000, hand:[], deck:[], mz:[], sz:[], field:null, grave:[], banish:[], ex:[],
    normalSummonUsed:false,   // 通常召喚権（1ターン1回）
    ssHistory:[],             // このターンの特殊召喚履歴 [{name, from, turn}]
    graveHistory:[],          // このターンの墓地送り履歴 [{name, from, turn}]
    effectFlags:{},           // 永続的なフラグ（1ターン1度の使用済み等）
    temporaryFlags:{},        // ターン終了で消えるフラグ
  };
}
function newGame(){
  // 1103環境は先攻ドローあり。ターン1もドローフェイズから始める。
  const replaySeed=(typeof v41SeedFromNow==='function')?v41SeedFromNow():((Date.now()>>>0)||0x6d2b79f5);
  return {
    turn:1, phase:"draw", activePlayer:0, firstPlayer:0,
    players:[makePlayer(), makePlayer()],
    log:[], chain:[],
    drawnThisTurn:false,
    priority:0,        // 優先権を持つプレイヤー
    pending:[],        // 発動待ち効果 [{player, name, note}]
    reserved:[],       // 予約効果（このターン終了時など）[{player, name, at, note}]
    scriptLog:[],      // カードスクリプトの処理トレース（デバッガー用）
    lastBattle:null,   // 直前の戦闘（ダメージ計算後の誘発効果が参照する）
    battle:null,       // 進行中の戦闘（ダメージステップの5段階を管理する）
    attackNegated:false,// 攻撃宣言後、効果でその攻撃が無効になったか
    loser:null,        // 敗北したプレイヤー（LP0・デッキ切れ）
    uidSeq:0,          // カード個体・装備の紐付けに使う通し番号
    chainWindow:null,   // ADS型チェーン優先権 {priority,passes}
    pendingSummon:null, // 召喚無効タイミング中の召喚情報
    pendingExV2:null,    // v4.2: Action化したEX召喚試行（JSON serializable）
    deferredEvents:[],  // チェーン解決後に処理するイベント
    systemVersion:"4.8.0",
    replayVersion:4,      // v4.4: initial state + executable replay runner + branching
    rngInitialSeed:replaySeed,
    rngState:replaySeed,
    __v41Seq:0,
    runtimeEffects:[],   // v4: serializable effect instances (lifetime/reset engine)
    runtimeEffectSeq:0,
    systemFault:null,    // Processor/ルールエンジンの致命的エラー。DUEL中は進行を止める。
    duelEndedReason:null,// LP0 / deckout 等の終了理由
    chainSeq:0,         // ChainLinkを一意に識別する通し番号
    processorQueue:[],  // System v3.1: ADS型の直列処理キュー
    processorCurrent:null,
    processorSeq:0,
    processorPaused:false,
    processorWaiting:null, // UI待ち中の親processor。子チェーンはこの親を保持したまま実行できる
    processorTrace:[],
    pendingAttack:null,    // System v2.9: 攻撃宣言からダメージステップ開始までを追跡
    pendingCostSnapshots:[], // P3: 発動コスト支払い時のスナップショット（CHAIN_ADDで消費）
    pendingChoice:null,    // v4.9 P1: 解決時選択の待ち状態（JSONのみ。関数を入れない）
    choiceSeq:0,           // ChoiceRequestを一意に識別する通し番号
    pendingDeclarationV11:null, // P1.1: CHAIN_ADD前の発動時宣言（JSONのみ）
    pendingActivationCostV11:[], // P1.1: CHAIN_ADD前の発動コストidentity
    summonSeq:0,           // 召喚1回ごとの通し番号（同一uidの再召喚を区別する）
    battlePhaseV6:{},      // System v6: バトルフェイズのスキップ／追加回数
    scheduledV7:[],        // System v7: ターンをまたぐ予約処理
    phaseSkipV7:{},        // System v7: フェイズのスキップ予約
    scheduleSeq:0,         // 予約1件ごとの通し番号（同一handlerの再予約を区別する）
    lastDrawV8:null,       // System v8: 直前のドロー（引いたカードの uid）
    fieldSnapV9:[],        // System v9: フィールドの直前状態（離脱検出用）
    posSnapV10:[],         // System v10: モンスターの表示形式の直前状態
    tokenSeq:0,            // System v11: トークンの世代採番
    lastTokenV11:null,     // System v11: 直近のトークン生成結果（1件・上書き）
    tokensGoneV11:[],      // System v11: この Action で消滅したトークン（毎回クリア）
    lpRulesV18:[],         // System v18: LP変化の置換規則（期間つき）
    lastActivationV12:null,// System v12: 直近のカード発動（1件・上書き）
  };
}

/* -------------------- P3 Provenance 付与ヘルパ --------------------
   既存フィールドは一切変更しない。Action に P3 情報が載っている時だけ
   新フィールドを追加する（載っていなければ何も書かない＝digest不変）。 */
function applySummonProvenanceP3(gs, card, a, defaultType){
  if(!card || !a) return;
  const mats = Array.isArray(a.p3Materials) ? a.p3Materials.filter(Boolean) : [];
  /* Action が召喚方法を明示していればそれを優先する（儀式召喚など）。
     明示が無い従来の呼び出しは今までどおり素材の有無で決める。 */
  const explicit = a.p3SummonType;
  const stype = (explicit==='normal'||explicit==='tribute'||explicit==='special'
                 ||explicit==='flip'||explicit==='ritual')
    ? explicit : (mats.length ? 'tribute' : (defaultType||'normal'));
  /* 召喚1回ごとの通し番号。同じカード実体（同じuid）を再び召喚したとき、
     前回の素材が今回の素材と誤認されるのを防ぐ。gs 上のカウンタなので
     Replay でも Undo でも決定的に復元される。配列indexは使わない。 */
  gs.summonSeq = (gs.summonSeq||0) + 1;
  const inst = gs.summonSeq;
  const prov = {summonType:stype, summonInstance:inst};
  if(mats.length){
    prov.materialRefs = mats.map(x=>(x && x.uid!=null)?x.uid:null).filter(x=>x!=null);
    prov.materialSnapshots = mats.map(x=>Object.assign({}, x));
  }
  card.summonProvenance = prov;
  (prov.materialRefs||[]).forEach(uid=>{
    const h = findCardByUidInState(gs, uid);
    if(h && h.card) h.card.usedAsMaterial =
      {summonType:stype, summonInstance:inst,
       summonedUid:(card.uid!=null?card.uid:null), actingPlayer:a.player};
  });
}
/* 移動由来。a.p3 が無ければ何も書かない。 */
function applyMoveProvenanceP3(card, a, fromZone){
  if(!card || !a || !a.p3 || typeof a.p3!=='object') return;
  const ok = ['cost','effect','rule','battle','tribute','material'];
  const out = {reason: ok.indexOf(a.p3.reason)>=0 ? a.p3.reason : 'effect'};
  const ap = a.p3.actingPlayer;
  if(ap===0 || ap===1) out.actingPlayer = ap;
  const fz = a.p3.fromZone || fromZone;
  if(fz) out.fromZone = String(fz);
  card.moveProvenance = out;
}

/* System v8: Action からプレイヤー番号を取り出す小さなヘルパ。 */
function who2V8(gs,a){ return (a && (a.player===0||a.player===1)) ? a.player : gs.activePlayer; }

/* System v6: 戦闘ダメージのイベント化。
   金額・直接攻撃か・攻撃者/被攻撃者の uid を載せる。
   純JSONで、Journal に載る Action の結果としてのみ発火する。 */
/* S03-U251: 「このカードは自分フィールド上に表側表示で存在する限り、コントロールを変更する事はできない」 (ホルスの黒炎竜 LV4).
   A face-up monster whose script declares controlLockS03(card) — and whose effect is not negated — keeps its controller:
   FX_CONTROL / CONTROL_SWAP_V26 change nothing (the effect still resolves; nothing else is undone). */
function s03ControlLockedU251(gs, card){
  if(!card || card.face!=='up') return false;
  const sc = (typeof CARD_SCRIPTS!=='undefined') ? CARD_SCRIPTS[cardName(card)] : null;
  if(!sc || typeof sc.controlLockS03!=='function') return false;
  try{ if(!sc.controlLockS03(card, gs)) return false; }catch(e){ return false; }
  return !(typeof effectNegated==='function' && effectNegated(card));
}
/* S03-U271: 「このカードが相手プレイヤーに与える戦闘ダメージは効果によるダメージとして扱う」 — script battleDamageAsEffectS03:true.
   'effect' only for damage to the opponent of the card's controller while its effect applies; otherwise 'battle'. */
function battleDamageCauseS03(gs, card, owner, dest){
  if(!card || card.face!=='up' || dest===owner) return 'battle';
  const sc = (typeof CARD_SCRIPTS!=='undefined') ? CARD_SCRIPTS[cardName(card)] : null;
  if(!sc || sc.battleDamageAsEffectS03!==true) return 'battle';
  if(typeof effectNegated==='function' && effectNegated(card)) return 'battle';
  return 'effect';
}
/* S03-U274: 「このターン自分は通常召喚を2回まで行う事ができる」 (二重召喚) — temporaryFlags.doubleSummonS03: 1 = the second Normal Summon / Set is
   available, 2 = used (a later 二重召喚 does not grant a third). Without the flag this is exactly the old normalSummonUsed check. */
function normalRightFreeS03(P){ return !P.normalSummonUsed || Number((P.temporaryFlags||{}).doubleSummonS03)===1; }
function consumeNormalRightS03(P){
  if(!P.normalSummonUsed){ P.normalSummonUsed = true; return true; }
  if(P.temporaryFlags && Number(P.temporaryFlags.doubleSummonS03)===1){ P.temporaryFlags.doubleSummonS03 = 2; return true; }
  return false;
}
function emitBattleDamageV6(gs, o){
  /* S03-U251: 「直接攻撃で相手に戦闘ダメージを与えた」 record on the attacker (サイレント・ソードマン LV5) — zone-local, set by this reducer */
  if(o && o.direct && o.attackerUid != null && Number(o.amount) > 0 && typeof findCardByUidInState==='function'){
    const hA = findCardByUidInState(gs, o.attackerUid);
    if(hA && hA.zone==='mz' && hA.card) hA.card.directBattleDamageTurnS03 = gs.turn;
  }
  if(typeof queueDeferredEventV2!=='function') return;
  if(typeof PLAY_MODE==='undefined' || PLAY_MODE!==PLAY_MODES.DUEL) return;
  if(typeof makeBattleDamageEventV6!=='function') return;
  const evt = makeBattleDamageEventV6(o);
  if(!evt.amount) return;
  queueDeferredEventV2('onBattleDamage', evt);
  if(evt.direct) queueDeferredEventV2('onDirectBattleDamage', evt);
}

/* -------------------- applyAction --------------------
   全ての状態変化はここを通す。副作用は gameState と log のみ。 */
let APPLY_ACTION_DEPTH_V31=0;
function applyAction(gs,a){
  APPLY_ACTION_DEPTH_V31++;
  /* S03-U21: ATTACK の reducer が読む戦闘状況を、Replay では Action のスナップショットから置く（ライブでは何もしない）。 */
  const battleCtxS03 = (typeof installBattleContextS03==='function') ? installBattleContextS03(gs,a) : null;
  /* S03-U115: 対象がその発生源の効果を受けないなら、この Action は盤面を変えない（Action に焼き込まれた srcS03 で判定） */
  if(a && a.srcS03 && typeof s03SkipUnaffectedActionU115==='function' && s03SkipUnaffectedActionU115(gs,a)){ APPLY_ACTION_DEPTH_V31--; if(battleCtxS03&&typeof restoreBattleContextS03==='function')restoreBattleContextS03(gs,battleCtxS03); return; }
  /* S03-U214: the GY-replacement sources in force when the outermost Action starts (cards leaving together are all covered) */
  const rdOuterS03 = APPLY_ACTION_DEPTH_V31===1 && typeof captureGraveRedirectS03==='function';
  if(rdOuterS03) captureGraveRedirectS03(gs, a);
  try{return applyActionBodyV31(gs,a);}finally{APPLY_ACTION_DEPTH_V31--; if(rdOuterS03) releaseGraveRedirectS03(); if(battleCtxS03&&typeof restoreBattleContextS03==='function')restoreBattleContextS03(gs,battleCtxS03);}
}
function cardEffectNegatedInActionStateS03(gs,card){
  if(!card) return false;
  if(card.negated===true) return true;
  if(card.negatedUntilTurn != null && Number(card.negatedUntilTurn) === Number(gs&&gs.turn)) return true;
  if(typeof negatedByV13==='function' && negatedByV13(card,gs)) return true;
  if(typeof effectNegated==='function'){
    const live = (typeof gameState!=='undefined') ? gameState : null;
    try{
      if(gs && live !== gs) gameState = gs;
      return !!effectNegated(card);
    }catch(e){ return false; }
    finally{ if(live && live !== gs) gameState = live; }
  }
  return false;
}
function reconcileProcedureBaseStatsActionS03(gs){
  if(!gs || !gs.players) return;
  for(let p=0;p<2;p++){
    ((gs.players[p]&&gs.players[p].mz)||[]).forEach(card=>{
      const st=card&&card.procedureBaseStats; if(!st) return;
      if((st.loseOnFaceDown && card.face!=='up') || (st.loseOnNegate && cardEffectNegatedInActionStateS03(gs,card))){
        delete card.procedureBaseStats;
        logIt(gs, `${cardName(card)}：召喚方法による元々の数値変更の適用が終了`);
      }
    });
  }
}
function applyActionBodyV31(gs, a){
  const v4Before = (typeof v4CaptureBeforeAction==='function') ? v4CaptureBeforeAction(gs,a) : null;
  const P = gs.players[a.player ?? gs.activePlayer];
  switch(a.type){
    case 'EVENT_QUEUE_V31':
      (gs.deferredEvents||(gs.deferredEvents=[])).push(JSON.parse(JSON.stringify(a.item)));/* S03-U14 */if(typeof applySummonCountersS03==='function')applySummonCountersS03(gs,a.item);break;
    case 'EVENT_DEQUEUE_V31':
      if(gs.deferredEvents&&gs.deferredEvents.length)gs.deferredEvents.shift();break;
    /* S03-U156: take the queued events of one kind for the given cards out of the queue, so that the caller dispatches them in
       its own simultaneous batch (battle cleanup: the onLeaveField of the battle-destroyed monsters). */
    case 'DESTROY_SUB_S03':   /* S03-U173 (engine/1ZV) */
      if(typeof destroySubReduceS03==='function') destroySubReduceS03(gs, a);
      break;

    case 'EVENT_TAKE_S03':
      if(gs.deferredEvents&&gs.deferredEvents.length){
        const uidsS03=(a.uids||[]).map(Number);
        gs.deferredEvents=gs.deferredEvents.filter(x=>!(x&&x.eventName===a.eventName&&x.evt&&uidsS03.indexOf(Number(x.evt.uid))>=0));
      }
      break;

    case 'EVENT_RESUME_V11':
      delete gs.eventChainResumeV11;break;
    case 'FX_EQUIP_FROM_GRAVE_V31':
      applyGraveEquipV31(gs,a);
      break;


    case "RESET_GAME_V43": {
      const fresh=newGame();
      const seed=(Number(a.seed)>>>0)||fresh.rngInitialSeed;
      fresh.rngInitialSeed=seed; fresh.rngState=seed; fresh.__v41Seq=0;
      Object.keys(gs).forEach(k=>delete gs[k]);
      Object.assign(gs,fresh);
      logIt(gs,"盤面をリセット");
      break;
    }

    case "MANUAL_TOGGLE_NORMAL_RIGHT_V43": {
      const who=a.player??gs.activePlayer, pl=gs.players[who];
      pl.normalSummonUsed=!pl.normalSummonUsed;
      logIt(gs, `通常召喚権：${pl.normalSummonUsed?'使用済':'未使用'}に変更`);
      break;
    }

    case "MANUAL_CLEAR_ATTACKED_V43": {
      const who=a.player??gs.activePlayer, pl=gs.players[who];
      pl.mz.forEach(c=>{if(c){c.attacked=false;c.attackCount=0;delete c.attackLimit;delete c.attackLimitTurn;}});
      logIt(gs,"攻撃済みフラグをリセット");
      break;
    }

    case "REDRAW_HAND_V43": {
      const who=a.player??gs.activePlayer, pl=gs.players[who];
      while(pl.hand.length){ const c=pl.hand.shift(); c.face='down'; c.pos='atk'; pl.deck.push(c); }
      shuffle(pl.deck,gs);
      let drawn=0;
      for(let i=0;i<5;i++){
        if(!pl.deck.length){
          if(gs.loser==null){ gs.loser=who; gs.duelEndedReason='deckout'; logIt(gs, `<b>${nameOf(who)} は必要なカードをドローできない — 敗北</b>`); }
          break;
        }
        const c=pl.deck.shift(); c.face='up'; c.pos='atk'; pl.hand.push(c); drawn++;
      }
      logIt(gs, `${nameOf(who)}：初手を引き直し（${drawn}枚）`);
      break;
    }

    case "SET_PHASE":
      gs.phase = a.phase;
      logIt(gs, `${nameOf(gs.activePlayer)}：${phaseJp(a.phase)}へ`);
      break;

    case "SET_FIRST_PLAYER": {
      const fp = a.player===1 ? 1 : 0;
      gs.activePlayer = fp;
      gs.firstPlayer = fp;
      gs.turn = 1;
      gs.phase = "draw";
      gs.drawnThisTurn = false;
      gs.chain = [];
      gs.priority = fp;
      logIt(gs, `<b>先攻：${nameOf(fp)}</b>（1103は先攻ドローあり）`);
      break;
    }

    case "DUEL_LOSER_S03": {
      /* S03-U38 (C-S03-29): 戦闘ダメージなど LP を Action 内で 0 にした経路の決着を、別の Action として記録する。
         以前は processor（markBattleLoserV28 / adjustStateV27）が gameState.loser を直接書き、Replay の最終 digest と一致しなかった。 */
      if(gs.loser==null && (a.player===0||a.player===1)){
        gs.loser = a.player;
        gs.duelEndedReason = a.reason || 'lp0';
        logIt(gs, `<b>${nameOf(a.player)} のライフが0 — 敗北</b>`);
      }
      break;
    }

    case "SUMMON_WINDOW_OPEN_V42": {
      gs.pendingSummon = a.pending ? JSON.parse(JSON.stringify(a.pending)) : null;
      break;
    }
    case "SUMMON_WINDOW_NEGATE_V42": {
      if(gs.pendingSummon){ gs.pendingSummon.negated=true; gs.pendingSummon.negateReason=a.reason||'召喚無効';
        /* S03-U277: 「召喚を無効にし、そのモンスターを持ち主の手札に戻す」 (キックバック) — the cancelled monster goes to its owner's hand, not the GY */
        if(a.toHandS03===true) gs.pendingSummon.negateToHandS03=true; }
      break;
    }
    /* S03-U290: grouped Deck-to-GY / discard summaries (engine/1ZZN) */
    case "EVENT_SUMMARY_S03": {
      if(typeof eventSummaryReduceS03==='function') eventSummaryReduceS03(gs);
      break;
    }
    /* S03-U278: position choice queue of effect Special Summons (engine/1ZZK) */
    case "SS_POS_S03": {
      if(!Array.isArray(gs.ssPosQueueS03)) gs.ssPosQueueS03 = [];
      if(a.op==='queue' && a.uid!=null) gs.ssPosQueueS03.push({uid:a.uid, player:a.player, src:a.src||''});
      else if(a.op==='take') gs.ssPosQueueS03.shift();
      else if(a.op==='set'){
        const hS = (typeof findCardByUidInState==='function') ? findCardByUidInState(gs, a.uid) : null;
        if(hS && hS.zone==='mz' && hS.card.face==='up'){ hS.card.pos = (a.pos==='def') ? 'def' : 'atk'; logIt(gs, `${cardName(hS.card)}：表側${a.pos==='def'?'守備':'攻撃'}表示で特殊召喚`); }
      }
      if(!gs.ssPosQueueS03.length) delete gs.ssPosQueueS03;
      break;
    }
    case "SUMMON_WINDOW_CLOSE_V42": {
      gs.pendingSummon=null;
      break;
    }

    case "COIN_TOSS": {
      const fp = (typeof duelRandomInt==='function') ? duelRandomInt(2,gs) : Math.floor(Math.random()*2);
      gs.activePlayer = fp;
      gs.firstPlayer = fp;
      gs.turn = 1;
      gs.phase = "draw";
      gs.drawnThisTurn = false;
      gs.chain = [];
      gs.priority = fp;
      a.result = fp;
      logIt(gs, `<b>コイントス → ${nameOf(fp)}の先攻</b>（1103は先攻ドローあり）`);
      break;
    }

    case "PASS_TURN": {
      // ターン終了時の予約効果を消化
      const due = gs.reserved.filter(r=>r.at==="endPhase" && r.turn===gs.turn);
      due.forEach(r=>logIt(gs, `予約効果：${r.name}（${nameOf(r.player)}）`));
      gs.reserved = gs.reserved.filter(r=>!(r.at==="endPhase" && r.turn===gs.turn));
      gs.activePlayer = gs.activePlayer === 0 ? 1 : 0;
      gs.turn += 1;
      gs.phase = "draw";
      gs.drawnThisTurn = false;
      gs.lastBattle = null;
      gs.battle = null;
      gs.attackNegated = false;
      clearExpiredMods(gs, 'endTurn');
      if(typeof pruneLpRulesV18==='function') pruneLpRulesV18(gs);   // System v18
      if(typeof pruneDestroyLogV30==='function') pruneDestroyLogV30(gs); // System v30 B3
      gs.priority = gs.activePlayer;
      // 召喚権・攻撃済み・ターン中履歴をリセット
      gs.players.forEach(pl=>{
        pl.normalSummonUsed = false;
        pl.ssHistory = [];
        pl.graveHistory = [];
        pl.temporaryFlags = {};
        if(Array.isArray(gs.lingerLongS03)) gs.lingerLongS03 = gs.lingerLongS03.filter(e=>e && Number(e.untilTurn) >= Number(gs.turn));   /* S03-U264 */
        pl.mz.forEach(c=>{ if(c){ c.attacked=false; c.attackCount=0; delete c.attackLimit; delete c.attackLimitTurn; } });
      });
      logIt(gs, `<b>ターン ${gs.turn}</b> — ${nameOf(gs.activePlayer)}の手番（先攻ドローあり）`);
      break;
    }

    case "PLAYER_FLAG_SET_V42": {
      const F=a.temporary?P.temporaryFlags:P.effectFlags;
      if(a.deleteFlag) delete F[a.key]; else F[a.key]=a.value;
      break;
    }

    case "LP": {
      /* System v18: LP が動く直前の中央置換点。cause を明示した Action
         だけが規則の対象になるので、既存の呼び出しは挙動が変わらない。 */
      const lpInfo = {player:a.player, delta:a.delta, cause:a.cause||'unspecified', chainId:(a.chainIdS03!=null?a.chainIdS03:null),
        byPlayer:((a.byPlayer===0||a.byPlayer===1)?a.byPlayer:null)};   /* S03-U267: the resolving chain link of an effect damage; S03-U271: its origin player */
      const dlt = (typeof resolveLpChangeV18==='function')
        ? resolveLpChangeV18(gs, lpInfo) : a.delta;
      /* System v19 連携: 受け手の差し替え（地獄の扉越し銃など）。金額は変えない。 */
      const TP = (lpInfo.redirectTo===0||lpInfo.redirectTo===1) ? gs.players[lpInfo.redirectTo] : P;
      const who = (lpInfo.redirectTo===0||lpInfo.redirectTo===1) ? lpInfo.redirectTo : a.player;
      const lpBefore = TP.lp;
      TP.lp = Math.max(0, TP.lp + dlt);
      logIt(gs, `${nameOf(who)} LP ${dlt>0?"+":""}${dlt} → ${TP.lp}`);
      /* System v28: LP が実際に動いた時だけ onLPChange を出す。
         置換規則（半分・倍・肩代わり・無効）を通した後の最終値を載せる。
         Action の中で積むので Replay でも同じ順序・同じ digest になる。 */
      emitLpChangeV28(gs, {player:who, before:lpBefore, after:TP.lp,
        cause:lpInfo.cause||a.cause||'unspecified',
        requested:a.delta,
        redirected:((lpInfo.redirectTo===0||lpInfo.redirectTo===1)&&lpInfo.redirectTo!==a.player),
        sourceUid:(a.sourceUid!=null?a.sourceUid:null),
        byPlayer:((a.byPlayer===0||a.byPlayer===1)?a.byPlayer:null),
        chainLinkOneS03:(a.chainLinkOneS03===true)});   /* S03-U50 */
      if(TP.lp===0 && gs.loser==null){
        gs.loser = who ?? gs.activePlayer;
        gs.duelEndedReason = 'lp0';
        logIt(gs, `<b>${nameOf(gs.loser)} のライフが0 — 敗北</b>`);
      }
      break;
    }

    case "DRAW": {
      const n = Math.max(0, a.n ?? 1);
      const who = a.player ?? gs.activePlayer;
      let drawn = 0;
      /* System v8: 引いたカードの identity を集める。 */
      const drawnCardsV8 = [];
      // 1回の効果で複数枚ドローする場合も、必要枚数を最後まで引けなければ敗北。
      // 例：デッキ1枚で「2枚ドロー」を処理すると1枚引いた後、2枚目を引けず敗北する。
      for(let i=0;i<n;i++){
        if(!P.deck.length){
          if(gs.loser==null){
            gs.loser = who;
            gs.duelEndedReason = 'deckout';
            logIt(gs, `<b>${nameOf(who)} は必要なカードをドローできない — 敗北</b>`);
          }
          break;
        }
        const c = P.deck.shift();
        c.face = 'up';           // 手札は常に表向き（タップ不要で内容が読める）
        c.pos  = 'atk';
        P.hand.push(c);
        drawnCardsV8.push(c);
        drawn++;
      }
      // ドローフェイズの通常ドローだけを記録する。
      // 初手を配る時（a.initial）や複数枚まとめてのドローは通常ドローに数えない。
      if(gs.phase==="draw" && !a.initial && n===1 && drawn===1
         && who===gs.activePlayer) gs.drawnThisTurn = true;
      if(drawn) logIt(gs, `${nameOf(who)}：${drawn}枚ドロー${drawn<n?`（${n}枚必要）`:''}`);
      /* System v8: 引いたカードを記録し、1枚ごとにイベントを流す。
         初手配布（a.initial）は記録もイベントも作らない。 */
      if(drawn && !a.initial && typeof recordDrawV8==='function'){
        const byEffectV8 = (a.byEffect != null)
          ? !!a.byEffect
          : !(gs.phase==='draw' && n===1 && who===gs.activePlayer);
        recordDrawV8(gs, who, drawnCardsV8, byEffectV8);
        if(typeof emitDrawEventsV8==='function')
          emitDrawEventsV8(gs, who, drawnCardsV8, byEffectV8);
        /* System v20: 「引いたカードを公開する」義務があればここで果たす。 */
        if(typeof applyDrawRevealObligationV20==='function')
          applyDrawRevealObligationV20(gs, who, drawnCardsV8);
      }
      break;
    }

    case "LOAD_DECK":
      P.deck = a.deck;            // [{id,face,pos}...]
      P.ex   = a.ex || [];
      /* S03-U06: 読み込んだデッキ構成（カードID）と出所を保持する。対戦開始時は途中の盤面ではなくこの構成から初期化する。
         source: 'user'（ユーザーが読み込んだデッキ）/ 'test'（開発テスト）/ 'opponentSample'（対戦相手用サンプル） */
      P.loadedDeckV32 = {source:String(a.source||'unknown'), name:String(a.name||''),
        main:(a.deck||[]).map(c=>c&&c.id).filter(x=>x!=null), ex:(a.ex||[]).map(c=>c&&c.id).filter(x=>x!=null)};
      /* 持ち主を記録しておく。コントロールを奪われたカードが
         墓地・除外・デッキへ行くとき、持ち主のゾーンに戻すために使う。 */
      P.deck.forEach(c=>{ if(c){ c.owner = a.player; ensureCardUid(gs,c); } });
      P.ex.forEach(c=>{ if(c){ c.owner = a.player; ensureCardUid(gs,c); } });
      logIt(gs, `${nameOf(a.player)}：デッキ ${a.deck.length}枚 / EX ${(a.ex||[]).length}枚 読込`);
      break;

    case "SHUFFLE":
      shuffle(P.deck,gs);
      logIt(gs, `${nameOf(a.player)}：デッキシャッフル`);
      break;

    case "MOVE": {
      // from/to は "hand","mz","sz","field","grave","banish","deck","ex"
      const card = removeFrom(P, a.from, a.fromIndex);
      if(!card) break;
      const preFaceU110 = card.face;   /* S03-U110: 置換判定は場を離れる前の表裏で行う */
      if(a.face) card.face = a.face;
      if(a.pos)  card.pos  = a.pos;
      /* System v3.3.0: 手動MOVEでもEXモンスターを手札/メインデッキへ戻さない。
         toPlayer の明示指定はMANUAL/DEVELOPER用の強制移動として尊重する。 */
      let actualTo = (a.toPlayer == null && originalExtraDeckMonster(card) && (a.to==='hand'||a.to==='deck')) ? 'ex' : a.to;
      /* System v3.5.0: 「この効果で特殊召喚したこのカードは、フィールドから離れた場合に除外」
         （ゾンビキャリア/バトルフェーダー等）を中央処理する。X素材化は場から離れる扱いではないため別。 */
      if(v350BanishWhenLeavesField(card,a.from,actualTo)) actualTo='banish';
      /* S03-U110: 墓地へ送られる場合にデッキの一番上へ戻る置換（リリース・コスト等の MOVE 経路）。 */
      if(actualTo==='grave' && a.toPlayer==null
         && s03DeckTopInsteadOfGraveU110(gs, card, {p:a.player, zone:a.from, index:a.fromIndex}, preFaceU110)){
        delete card.declaration; delete card.controlReturnTo; delete card.controlReturnTurn;
        const retU110=returnToOwnerDeckOrExtra(gs, card, a.player, false);
        logIt(gs, `${nameOf(a.player)}：${cardName(card)} は墓地へは行かず ${nameOf(retU110.owner)} のデッキの一番上に戻った`);
        break;
      }
      /* P1.1: 手動MOVEも領域を跨ぐ。永続宣言を次の領域へ持ち越さない。 */
      if(a.from!==actualTo) delete card.declaration;
      /* カードは持ち主のゾーンに戻る。コントロールを奪ったモンスターを
         墓地へ送る場合などに効く。toPlayer で明示することもできる。 */
      let dstP = a.player;
      if(a.toPlayer != null) dstP = a.toPlayer;
      else if(['grave','banish','deck','hand','ex'].indexOf(actualTo) >= 0 && card.owner != null)
        dstP = card.owner;
      const D = gs.players[dstP];
      // 場を離れるのでコントロールの記録は消す
      if(['grave','banish','deck','hand','ex'].indexOf(actualTo) >= 0){
        delete card.controlReturnTo; delete card.controlReturnTurn;
        delete card.cannotAttack; delete card.cannotTribute;
        card.controller = dstP;
      }
      placeInto(D, actualTo, card, a.deckPos);
      logIt(gs, `${nameOf(a.player)}：${cardName(card)} を ${zoneJp(a.from)}→${zoneJp(actualTo)}` +
        `${actualTo!==a.to?'（EXモンスター戻り先補正）':''}` +
        `${dstP !== a.player ? `（${nameOf(dstP)}の）` : ''}` +
        `${a.face==='down'?'（裏）':''}${a.pos==='def'?'（守備）':''}`);
      break;
    }

    case "FLIP": {
      const card = zoneCard(P, a.zone, a.index);
      if(card){
        const was = card.face;
        card.face = card.face==='up'?'down':'up';
        if(was==='down' && card.face==='up') activatePendingProcedureBaseStats(card, gs);
        else if(card.face==='down' && card.procedureBaseStats && card.procedureBaseStats.loseOnFaceDown){
          delete card.procedureBaseStats;
          logIt(gs, `${cardName(card)}：召喚方法による元々の数値変更の適用が終了`);
        }
        logIt(gs, `${nameOf(a.player)}：${cardName(card)} を反転`);
      }
      break;
    }

    case "TOGGLE_POS": {
      const card = zoneCard(P, a.zone, a.index);
      if(card){
        card.pos = card.pos==='atk'?'def':'atk';
        card.positionChangedTurn=gs.turn;
        /* System v10: メインフェイズ外での変更は追加ウィンドウの消費。
           フェイズだけで決まるので Replay でも同じ判定になる。 */
        if(gs.phase!=='main1' && gs.phase!=='main2') card.posWindowUsedTurnV10=gs.turn;
        logIt(gs, `${nameOf(a.player)}：${cardName(card)} 表示形式変更`);
      }
      break;
    }

    /* System v4.5 WIP: 攻撃無効もAction化。カードスクリプトから gameState を直接変更しない。 */
    case "NEGATE_ATTACK_V45": {
      const a0=gs.pendingAttack;
      if(!a0) break;
      if(a.attackerUid!=null && a0.attackerUid!==a.attackerUid) break;
      if(a.targetUid!=null && a0.targetUid!==a.targetUid) break;
      gs.attackNegated=true;
      logIt(gs, `${a.reason||"効果"}：攻撃を無効`);
      break;
    }

    case "ATTACK_DECLARE_V48": {
      const card=P.mz[a.mzIndex]; if(!card) break;
      card.attackCount=Math.max(0,Number(card.attackCount)||0)+1;
      card.attacked=card.attackCount>0;
      a.declaredAttackCount=card.attackCount;
      /* S03-U149: an attack-all card remembers which monsters it attacked this turn (only such cards: other Journals unchanged) */
      if(a.pending && typeof attackAllActiveS03==='function' && attackAllActiveS03(card)) noteAttackAllTargetS03(gs, card, a.pending.targetUid);
      /* S03-U39 (C-S03-30): 攻撃宣言からダメージステップまでの状態を同じ Action で設定する。
         以前は processor が直後に gameState.pendingAttack を直接書き、攻撃宣言時の罠などで Replay が一致しなかった。
         pending を持たない既存の記録は従来どおり（digest 不変）。 */
      if(a.pending){ gs.pendingAttack=JSON.parse(JSON.stringify(a.pending)); gs.attackNegated=false; }
      break;
    }

    case "ATTACK_PENDING_CLEAR_S03": {
      /* S03-U39 (C-S03-30): 攻撃の終了（無効・続行不可・ダメージステップへ移行・リプレイで中止）で攻撃中の状態を消す */
      gs.pendingAttack=null; gs.attackNegated=false;
      break;
    }

    case "ATTACK_PENDING_RETARGET_S03": {
      /* S03-U39 (C-S03-30): リプレイで攻撃対象を選び直した */
      if(gs.pendingAttack){
        gs.pendingAttack.targetUid=(a.targetUid==null)?null:a.targetUid;
        /* S03-U149: the new target of an attack-all card counts as attacked too */
        { const ahS03 = (typeof findCardByUidInState==='function') ? findCardByUidInState(gs, gs.pendingAttack.attackerUid) : null;
          if(ahS03 && ahS03.card && typeof attackAllActiveS03==='function' && attackAllActiveS03(ahS03.card)) noteAttackAllTargetS03(gs, ahS03.card, gs.pendingAttack.targetUid); }
        gs.pendingAttack.defenderSnapshot=Array.isArray(a.defenderSnapshot)?a.defenderSnapshot.slice():[];
        if(a.redirectV6) gs.pendingAttack.redirectV6=JSON.parse(JSON.stringify(a.redirectV6));
        else delete gs.pendingAttack.redirectV6;
        /* S03-U120: 選び直した対象が X素材の無いエクシーズモンスターか（No.39 希望皇ホープ②） */
        if(a.targetNoMaterialS03) gs.pendingAttack.targetNoMaterialS03=true; else delete gs.pendingAttack.targetNoMaterialS03;
      }
      break;
    }

    case "BATTLE_REDIRECT_V6": {
      const b=gs.battle; if(!b) break;
      if(a.toDirect){
        b.target='direct'; b.targetUid=null; b.redirectV6={toDirect:true};
      }else{
        const h=(a.targetUid!=null)?findCardByUid(a.targetUid):null;
        if(!h||h.zone!=='mz') break;
        b.target=h.index; b.targetUid=a.targetUid; b.redirectV6={targetUid:a.targetUid};
      }
      break;
    }

    case "GRANT_EXTRA_ATTACK_V48": {
      const card=zoneCard(P,a.zone||'mz',a.index); if(!card) break;
      const count=Math.max(0,Number(card.attackCount)||0);
      const base=Math.max(1,Number(card.attackLimit)||1);
      card.attackLimit=Math.max(base,a.afterCurrent?count+Math.max(1,Number(a.n)||1):1+Math.max(1,Number(a.n)||1));
      card.attackLimitTurn=gs.turn;
      logIt(gs, `${cardName(card)}：このターンの攻撃可能回数 ${card.attackLimit}回`);
      break;
    }

    case "ATTACK": {
      gs.lastBattle = null;   // 直前の戦闘の記録は破棄してから新しい戦闘を行う
      // 攻撃したモンスターに攻撃済みフラグを立てる（1ターン1回制限の管理）
      if(P.mz[a.atkIdx]){
        const c=P.mz[a.atkIdx], declared=Math.max(0,Number(a.declaredAttackCount)||0);
        if(declared)c.attackCount=Math.max(Number(c.attackCount)||0,declared);
        else if(!(Number(c.attackCount)>0))c.attackCount=1;
        c.attacked=(Number(c.attackCount)||0)>0;
        const only=P.temporaryFlags&&P.temporaryFlags.v48ConsecutiveAttackerUid;
        if(only!=null && ensureCardUid(gs,c)===only) delete P.temporaryFlags.v48ConsecutiveAttackerUid;
      }
      const atkCard = P.mz[a.atkIdx];
      if(!atkCard){ break; }
      atkCard.battledTurnS03 = gs.turn;   /* S03-U180: 「このカードが戦闘を行ったバトルフェイズ終了時」 (engine/1ZZ) */
      /* System v6: このバトルフェイズ中の攻撃を記録する。
         バトルフェイズ終了時に消えるので無制限履歴にはならない。 */
      if(typeof recordBattlePhaseAttackV6==='function')
        recordBattlePhaseAttackV6(gs, a.player, atkCard,
          (a.target==='direct') ? null : (gs.players[a.player===0?1:0].mz[a.target]||null));
      const atkDB = dbOf(atkCard);
      const oppP = gs.players[a.player===0?1:0];
      const aATK = a.atkOverride!=null ? a.atkOverride : curATK(atkCard);

      if(a.target==='direct'){
        /* S03-U271: 「このカードが相手プレイヤーに与える戦闘ダメージは効果によるダメージとして扱う」 (墓守の従者) — decided first: such damage is not
           battle damage, so the battle-damage layer (v6 filters: 0 / half / …) does not touch it; the effect-damage rules apply instead */
        const causeDirS03 = battleDamageCauseS03(gs, atkCard, a.player, (a.player===0?1:0));
        let dmgDirect = (causeDirS03!=='battle') ? Math.max(0, Number(aATK)||0) : applyBattleDamageFilters({
          to:a.player===0?1:0, amount:aATK, atkCard, defCard:null,
          atkOwner:a.player, defOwner:a.player===0?1:0, direct:true});
        const lpBeforeDirect = oppP.lp;
        /* S03-U242: the v18 player rules (「このターン受ける戦闘ダメージは0」, レインボー・ライフ …) reach direct attacks too — this path used to skip
           them. A rule may turn the damage into recovery (positive delta). */
        let dDeltaS03 = -dmgDirect;
        if(typeof resolveLpChangeV18==='function' && dmgDirect>0) dDeltaS03 = Number(resolveLpChangeV18(gs, {player:(a.player===0?1:0), delta:-dmgDirect, cause:causeDirS03, byPlayer:a.player}));
        if(dDeltaS03 > 0){ oppP.lp = oppP.lp + dDeltaS03; dmgDirect = 0; logIt(gs, `${nameOf(a.player===0?1:0)}：戦闘ダメージの代わりに ${dDeltaS03} 回復`); }
        else { dmgDirect = Math.max(0, -dDeltaS03); oppP.lp = Math.max(0, oppP.lp - dmgDirect); }
        /* System v28: 戦闘ダメージも LP 変動の中央イベントへ流す。 */
        emitLpChangeV28(gs, {player:(a.player===0?1:0), before:lpBeforeDirect, after:oppP.lp,
          cause:causeDirS03, requested:-dmgDirect, redirected:false,
          sourceUid:(atkCard&&atkCard.uid!=null?atkCard.uid:null), byPlayer:a.player});
        gs.lastBattle = {player:a.player, atkIdx:a.atkIdx, target:'direct', damage:dmgDirect, toPlayer:a.player===0?1:0,
          /* System v6: identity は uid。カード名では同名・再利用を区別できない。 */
          attackerUidV6:(atkCard.uid!=null?atkCard.uid:null), defenderUidV6:null, directV6:true};
        logIt(gs, `<b>攻撃</b> ${cardName(atkCard)}(${aATK}) が直接攻撃 → ${nameOf(a.player===0?1:0)} に ${dmgDirect} ダメージ（LP ${oppP.lp}）`);
        if(causeDirS03==='battle') emitBattleDamageV6(gs, {to:a.player===0?1:0, amount:dmgDirect, direct:true,
          attackerUid:atkCard.uid, defenderUid:null, atkOwner:a.player});   /* S03-U271: damage treated as effect damage is not battle damage */
        break;
      }

      const defCard = oppP.mz[a.target];
      if(!defCard){ break; }
      /* S03-U160: record the battle on both monsters (zone-local: a monster that leaves the field forgets it), for texts like
         「このカードと戦闘を行ったモンスター」 (薄幸の乙女). Written inside the ATTACK action, so it is replayed. */
      recordBattlePartnersS03(gs, atkCard, defCard);
      defCard.battledTurnS03 = gs.turn;   /* S03-U180 */
      const defDB = dbOf(defCard);
      const defending = defCard.pos==='def';
      const dVal = a.defOverride!=null ? a.defOverride : (defending ? curDEF(defCard) : curATK(defCard));

      /* 戦闘破壊耐性（置換効果）を判定する。
         a.noDestroyAtk / a.noDestroyDef で個別に指定でき、
         指定が無ければカードの耐性フラグとスクリプト宣言から自動判定する。 */
      const protAtk = a.noDestroyAtk!=null ? a.noDestroyAtk : battleProof(atkCard);
      const protDef = a.noDestroyDef!=null ? a.noDestroyDef : battleProof(defCard);

      /* ③-ⅴ 戦闘破壊確定。
         ここでは破壊を「確定」させるだけで、実際に場を離れるのは
         ⑤ 追加誘発解決タイミング（BATTLE_CLEANUP）。
         確定したモンスターは永続効果を出さず、効果の対象にも取れなくなる。 */
      /* System v21: battleProof が false のときだけ、条件付き／回数制限付きの
         戦闘破壊耐性を見る。実際に守ったときだけ回数を消費する。 */
      /* S03-U161: battleRole — 「…が攻撃する場合、攻撃モンスターは戦闘では破壊されない」 (エレキーウィ) needs to know the side */
      const protV21 = (card, foe, role)=>{
        if(typeof applyDestructionProtectionV21!=='function') return null;
        return applyDestructionProtectionV21(gs, card,
          {cause:'battle', opponentCard:foe, byPlayer:null, targeting:false, sourceKind:null, battleRole:role});
      };
      const killDef = ()=>{
        if(protDef){ logIt(gs, `${cardName(defCard)} は戦闘では破壊されない`); return false; }
        const r = protV21(defCard, atkCard, 'defender');
        if(r){ logIt(gs, `${r.label||'効果'}：${cardName(defCard)} は戦闘では破壊されない`); return false; }
        defCard.battleDestroyed = true;
        return true;
      };
      const killAtk = ()=>{
        if(protAtk){ logIt(gs, `${cardName(atkCard)} は戦闘では破壊されない`); return false; }
        const r = protV21(atkCard, defCard, 'attacker');
        if(r){ logIt(gs, `${r.label||'効果'}：${cardName(atkCard)} は戦闘では破壊されない`); return false; }
        atkCard.battleDestroyed = true;
        return true;
      };

      let msg = `<b>戦闘</b> ${cardName(atkCard)}(攻${aATK}) vs ${cardName(defCard)}(${defending?'守':'攻'}${dVal})：`;
      let destroyedAtk=false, destroyedDef=false, dmgTo=null, dmgVal=0;

      /* ③-ⅳ ダメージ発生。天空の聖域のような介入効果をここで通す */
      let dmgRedirectedTo = null, asEffectDmgS03 = false;
      const dealDamage = (to, raw)=>{
        /* S03-U271: the monster inflicting this damage (the other side of the battle from the receiver). Damage it inflicts that is treated as
           effect damage (墓守の従者) is not battle damage: no battle-damage redirect / filters. */
        const srcS03 = (to===a.player) ? defCard : atkCard, srcOwnerS03 = (to===a.player) ? (a.player===0?1:0) : a.player;
        const asEffS03 = battleDamageCauseS03(gs, srcS03, srcOwnerS03, to)!=='battle';
        /* System v6: 受け手の差し替えを先に判定する（金額の増減より前）。 */
        const alt = asEffS03 ? null : applyBattleDamageRedirectV6({
          to, amount:raw, atkCard, defCard,
          atkOwner:a.player, defOwner:a.player===0?1:0, direct:false});
        const dest = (alt===0||alt===1) ? alt : to;
        if(dest!==to) dmgRedirectedTo = dest;
        let v = asEffS03 ? Math.max(0, Number(raw)||0) : applyBattleDamageFilters({
          to:dest, amount:raw, atkCard, defCard,
          atkOwner:a.player, defOwner:a.player===0?1:0, direct:false});
        /* System v18: 「全てのダメージは0になる」等、戦闘にも届く規則。
           戦闘ダメージの増減そのものは v6 の層が担当したままにする。 */
        let recS03 = 0;
        const causeS03 = battleDamageCauseS03(gs, srcS03, srcOwnerS03, dest);
        if(causeS03!=='battle') asEffectDmgS03 = true;
        if(typeof resolveLpChangeV18==='function' && v>0){
          const rS03 = Number(resolveLpChangeV18(gs, {player:dest, delta:-v, cause:causeS03, byPlayer:srcOwnerS03}));
          /* S03-U242: a rule may turn the damage into recovery (レインボー・ライフ); Math.abs used to drop the sign */
          if(rS03 > 0){ recS03 = rS03; v = 0; } else v = Math.abs(rS03);
        }
        const T = gs.players[dest];
        const lpBeforeBattle = T.lp;
        T.lp = Math.max(0, T.lp - v);
        if(recS03 > 0){ T.lp = T.lp + recS03; logIt(gs, `${nameOf(dest)}：戦闘ダメージの代わりに ${recS03} 回復`); }
        /* System v28: 置換・肩代わりを通した後の最終値で1回だけ出す。 */
        emitLpChangeV28(gs, {player:dest, before:lpBeforeBattle, after:T.lp,
          cause:causeS03, requested:-raw, redirected:(dest!==to),
          sourceUid:(atkCard&&atkCard.uid!=null?atkCard.uid:null), byPlayer:a.player});
        return v;
      };
      if(defending){
        if(aATK > dVal){
          /* S03-U20: ダメージ計算（③-ⅳ）を戦闘破壊の確定（③-ⅴ）より先に行う。
             確定したモンスターは継続効果を出さないので、先に確定させると
             「このカードの戦闘で発生する自分への戦闘ダメージは0」が、そのカードが破壊される戦闘で働かない。 */
          // System v3.3.0: 貫通ダメージ。カード側は continuous.piercingDamage(info) で宣言する。
          const pierce = applyPiercingDamage({
            atkCard, defCard, atkOwner:a.player, defOwner:a.player===0?1:0,
            amount:aATK-dVal, direct:false
          });
          if(pierce>0){ dmgTo=a.player===0?1:0; dmgVal=dealDamage(dmgTo,pierce); }
          destroyedDef = killDef(); msg += destroyedDef?`守備モンスター破壊`:`破壊されず`;
          if(pierce>0){
            msg += `＋貫通 ${dmgVal}ダメージ（LP ${oppP.lp}）`;
          }
        }
        else if(aATK < dVal){ dmgTo=a.player; dmgVal=dealDamage(a.player, dVal-aATK);
          msg += `反射ダメージ ${dmgVal} → ${nameOf(a.player)}（LP ${P.lp}）`; }
        else { msg += `変化なし`; }
      } else {
        if(aATK > dVal){
          /* S03-U20: ダメージ計算が先、戦闘破壊の確定が後。 */
          dmgTo=a.player===0?1:0; dmgVal=dealDamage(dmgTo, aATK-dVal);
          destroyedDef = killDef();
          msg += `${destroyedDef?'相手モンスター破壊':'破壊されず'}＋${dmgVal}ダメージ（LP ${oppP.lp}）`;
        }
        else if(aATK < dVal){
          /* S03-U20: ダメージ計算が先、戦闘破壊の確定が後。 */
          dmgTo=a.player; dmgVal=dealDamage(a.player, dVal-aATK);
          destroyedAtk = killAtk();
          msg += `${destroyedAtk?'自分モンスター破壊':'破壊されず'}＋${dmgVal}ダメージ（LP ${P.lp}）`;
        }
        else { destroyedAtk=killAtk(); destroyedDef=killDef(); msg += `相打ち`; }
      }
      logIt(gs, msg);
      /* ダメージ計算後の誘発効果（異次元の女戦士・ゴブリンゾンビ等）が参照する */
      gs.lastBattle = {
        player:a.player, atkIdx:a.atkIdx, target:a.target,
        atkCard, defCard, destroyedAtk, destroyedDef,
        // 破壊されると墓地では別オブジェクトになるため、名前でも照合できるようにする
        atkName: cardName(atkCard), defName: cardName(defCard),
        atkOwner: a.player, defOwner: a.player===0?1:0,
        damage:dmgVal, toPlayer:dmgTo,
        /* System v6: 名前ではなく uid で照合できるようにする（既存フィールドはそのまま） */
        attackerUidV6:(atkCard.uid!=null?atkCard.uid:null),
        defenderUidV6:(defCard.uid!=null?defCard.uid:null), directV6:false
      };
      if((destroyedDef||destroyedAtk) && typeof ensureBattlePhaseStateV6==='function'){
        const st6 = ensureBattlePhaseStateV6(gs);
        st6.destroyedThisPhase = (Number(st6.destroyedThisPhase)||0)
          + (destroyedDef?1:0) + (destroyedAtk?1:0);
      }
      if(dmgRedirectedTo!=null) { gs.lastBattle.toPlayer = dmgRedirectedTo; dmgTo = dmgRedirectedTo; }
      if(dmgTo!=null && dmgVal>0 && !asEffectDmgS03){   /* S03-U271: damage treated as effect damage is not battle damage */
        emitBattleDamageV6(gs, {to:dmgTo, amount:dmgVal, direct:false,
          attackerUid:atkCard.uid, defenderUid:defCard.uid, atkOwner:a.player});
      }
      break;
    }

    /* ---- チェーン（手動） ---- */
    /* コントロールの移動。until:'endPhase' なら自分のエンドフェイズに戻る。
       移ったモンスターは攻撃宣言・リリースができない（精神操作など）。 */
    case "FX_CONTROL": {
      const src = gs.players[a.player];
      const dst = gs.players[a.toPlayer];
      let card;
      if(a.zone === 'mz' && s03ControlLockedU251(gs, src && src.mz ? src.mz[a.index] : null)){
        logIt(gs, `${cardName(src.mz[a.index])} のコントロールは変更できない`); break; }   /* S03-U251 */
      if(a.zone === 'field'){ card = src.field; src.field = null; }
      else { card = (src[a.zone]||[]).splice(a.index, 1)[0]; }
      if(!card) break;
      if(a.zone === 'field'){ dst.field = card; }
      else {
        if(a.zone === 'mz' && dst.mz.length >= ZONE_LIMITS.mz){
          // ゾーンが一杯なら元に戻す
          if(a.zone === 'field') src.field = card; else src[a.zone].splice(a.index, 0, card);
          logIt(gs, `モンスターゾーンが一杯でコントロールを移せません`);
          break;
        }
        dst[a.zone].push(card);
      }
      // 元の持ち主を控えておく（戻す先の判定に使う）
      if(card.owner == null) card.owner = a.player;
      card.controller = a.toPlayer;
      if(a.until === 'endPhase'){
        card.controlReturnTo = a.player;
        card.controlReturnTurn = gs.turn;
        /* S03-U117: 「攻撃宣言できず、リリースできない」は精神操作などカード固有の制限。心変わり・洗脳などには無い。
           API.changeControl は restrictS03 を必ず Action に書く。restrictS03 を持たない旧 Action（保存済み Journal・
           手動操作 zControl）は従来どおり両方を制限する（Replay 互換）。 */
        const rS03 = a.restrictS03;
        if(!rS03 || rS03.noAttack) card.cannotAttack = true;      // このターン攻撃宣言できない
        if(!rS03 || rS03.noTribute) card.cannotTribute = true;    // リリースできない
      }
      logIt(gs, `${a.reason||"効果"}：${cardName(card)} のコントロールが ${nameOf(a.toPlayer)} へ`);
      /* System v26: 実際に成立した時だけ 1 回。ゾーン満杧で巻き戻した場合は出ない。 */
      emitControlChangeV26(gs, card, a.player, a.toPlayer, a.zone,
        (a.sourceUid != null ? a.sourceUid : null), a.reason || null);
      break;
    }

    /* ===== System v26: source 連動のコントロール返却（1枚だけ）=====
       戻し先が満杧なら墨地へ。既存 CONTROL_RETURN と同じ裁定を使う。 */
    case "CONTROL_RETURN_ONE_V26": {
      const srcP26 = gs.players[a.player], backP26 = gs.players[a.toPlayer];
      if(!srcP26 || !backP26) break;
      if((a.zone||'mz') !== 'mz') break;
      const cardP26 = zoneCard(srcP26, 'mz', a.index);
      if(!cardP26) break;
      if(a.uid != null && cardP26.uid !== a.uid) break;
      if((backP26.mz||[]).length >= ZONE_LIMITS.mz){
        srcP26.mz.splice(a.index,1);
        if(!s03DeckTopReplaceGraveU110(gs, cardP26, {p:a.player, zone:'mz', index:a.index}, cardP26.face, a.reason))   /* S03-U110 */
          pushZone(backP26.grave, cardP26);
        logIt(gs, `${a.reason||'効果'}：${cardName(cardP26)} は戻す先が一杯のため墨地へ`);
        break;
      }
      srcP26.mz.splice(a.index,1);
      cardP26.controller = a.toPlayer;
      delete cardP26.controlReturnTo; delete cardP26.controlReturnTurn;
      delete cardP26.cannotAttack; delete cardP26.cannotTribute;
      /* 使い終わったリースの watch を消す（古いリースの復活防止）。 */
      if(cardP26.linkV9 && Array.isArray(cardP26.linkV9.watch)){
        cardP26.linkV9.watch = cardP26.linkV9.watch.filter(w=>!(w && w.onGone==='controlReturn'));
        if(!cardP26.linkV9.watch.length) delete cardP26.linkV9;
      }
      backP26.mz.push(cardP26);
      logIt(gs, `${a.reason||'効果'}：${cardName(cardP26)} のコントロールが ${nameOf(a.toPlayer)} に戻った`);
      emitControlChangeV26(gs, cardP26, a.player, a.toPlayer, 'mz',
        (a.sourceUid != null ? a.sourceUid : null), 'return');
      break;
    }

    /* ===== System v26: コントロールの原子的な入れ替え =====
       両方を先に取り外してから逆側へ置くので、
       両ゾーンが満杧でも途中で capacity failure にならない。
       片方だけ移動して失敗、は起きない。 */
    case "CONTROL_SWAP_V26": {
      const PA26 = gs.players[a.aPlayer], PB26 = gs.players[a.bPlayer];
      if(!PA26 || !PB26) break;
      if(a.aPlayer === a.bPlayer){ logIt(gs, `コントロール交換：同じ側どうしでは入れ替えられません`); break; }
      const ca26 = zoneCard(PA26, 'mz', a.aIndex), cb26 = zoneCard(PB26, 'mz', a.bIndex);
      if(!ca26 || !cb26){ logIt(gs, `コントロール交換：対象が揃っていません`); break; }
      if(ca26 === cb26){ logIt(gs, `コントロール交換：同じカードは選べません`); break; }
      if(a.aUid != null && ca26.uid !== a.aUid){ logIt(gs, `コントロール交換：対象が入れ替わっています`); break; }
      if(a.bUid != null && cb26.uid !== a.bUid){ logIt(gs, `コントロール交換：対象が入れ替わっています`); break; }
      if(s03ControlLockedU251(gs, ca26) || s03ControlLockedU251(gs, cb26)){ logIt(gs, `コントロール交換：コントロールを変更できないモンスターがいます`); break; }   /* S03-U251 */
      /* ここからは失敗しない。 */
      PA26.mz.splice(a.aIndex,1);
      const bIdx26 = PB26.mz.indexOf(cb26);
      if(bIdx26 >= 0) PB26.mz.splice(bIdx26,1);
      if(ca26.owner == null) ca26.owner = a.aPlayer;
      if(cb26.owner == null) cb26.owner = a.bPlayer;
      ca26.controller = a.bPlayer;
      cb26.controller = a.aPlayer;
      PB26.mz.push(ca26);
      PA26.mz.push(cb26);
      logIt(gs, `${a.reason||'効果'}：${cardName(ca26)} と ${cardName(cb26)} のコントロールを入れ替えた`);
      /* 各カード1回ずつ、常に a → b の順で出す（順序は決定的）。 */
      emitControlChangeV26(gs, ca26, a.aPlayer, a.bPlayer, 'mz',
        (a.sourceUid != null ? a.sourceUid : null), a.reason || 'swap');
      emitControlChangeV26(gs, cb26, a.bPlayer, a.aPlayer, 'mz',
        (a.sourceUid != null ? a.sourceUid : null), a.reason || 'swap');
      break;
    }

    /* コントロールが一時的に移ったモンスターを持ち主に戻す */
    case "CONTROL_RETURN": {
      for(let pi=0; pi<2; pi++){
        const P = gs.players[pi];
        for(let i=(P.mz||[]).length-1; i>=0; i--){
          const c = P.mz[i];
          if(!c || c.controlReturnTo == null) continue;
          const back = gs.players[c.controlReturnTo];
          if((back.mz||[]).length >= ZONE_LIMITS.mz){
            logIt(gs, `${cardName(c)} は戻す先が一杯のため墓地へ`);
            P.mz.splice(i,1);
            if(!s03DeckTopReplaceGraveU110(gs, c, {p:pi, zone:'mz', index:i}, c.face, 'コントロール終了')) pushZone(back.grave, c);   /* S03-U110 */
            continue;
          }
          P.mz.splice(i,1);
          const backIdxV26 = c.controlReturnTo;
          c.controller = c.controlReturnTo;
          delete c.controlReturnTo; delete c.controlReturnTurn;
          delete c.cannotAttack; delete c.cannotTribute;
          back.mz.push(c);
          /* System v26: 戻ったのもコントロール変更。reason で区別する。 */
          emitControlChangeV26(gs, c, pi, backIdxV26, 'mz', null, 'return');
          logIt(gs, `${cardName(c)} のコントロールが ${nameOf(back === gs.players[0] ? 0 : 1)} に戻った`);
        }
      }
      break;
    }

    /* ⑤ 追加誘発解決：戦闘破壊が確定したモンスターが実際にフィールドを離れる。
       ここで初めて墓地へ送られ、「墓地へ送られた」「フィールドから離れた」を
       トリガーとする効果が誘発できるようになる。 */
    /* System v6: バトルフェイズ制御。mode で意味が決まる。
       a:{player, mode:'skipNext'|'repeat'|'endNow', n} */
    case "BATTLE_PHASE_V6": {
      if(typeof ensureBattlePhaseStateV6!=='function') break;
      const st = ensureBattlePhaseStateV6(gs);
      const who = (a.player===0||a.player===1) ? a.player : gs.activePlayer;
      if(a.mode==='skipNext'){
        if(!st.skipNext) st.skipNext={};
        st.skipNext[who]=true;
        logIt(gs, `${nameOf(who)} の次のバトルフェイズはスキップされる`);
      }else if(a.mode==='repeat'){
        if(!st.repeat) st.repeat={};
        st.repeat[who]=Math.max(0,Number(st.repeat[who])||0)+Math.max(1,Number(a.n)||1);
        logIt(gs, `${nameOf(who)} は次のバトルフェイズを追加で ${st.repeat[who]} 回行える`);
      }else if(a.mode==='endNow'){
        st.endedTurn=gs.turn;
        gs.battle=null;
        logIt(gs, `バトルフェイズを終了する`);
      }else if(a.mode==='finish'){
        /* System v6: バトルフェイズ終了時の後片付け。
           このフェイズ限りの攻守修正と攻撃記録をここで捨てる。 */
        clearExpiredMods(gs, 'endBattlePhase');
        delete st.endedTurn;   /* S03-U152: an ended Battle Phase is over (a repeated Battle Phase starts fresh) */
        /* S03-U236: 「戦闘を行ったバトルフェイズ終了時」 is checked after this cleanup (onBattlePhaseEnd runs after SET_PHASE), so keep the
           finished phase's record for that turn (engine/15 battleAttacksRecordV6 reads it outside the Battle Phase). */
        st.lastPhaseS03 = {turn:gs.turn, attacks:Array.isArray(st.attacks) ? st.attacks.slice() : []};
        st.attacks = [];
        st.destroyedThisPhase = 0;
      }else if(a.mode==='consumeSkip'){
        if(st.skipNext) delete st.skipNext[who];
      }else if(a.mode==='consumeRepeat'){
        if(st.repeat && st.repeat[who]>0) st.repeat[who]-=1;
      }
      break;
    }

    /* System v6: 戦闘許可の付与。a:{player, uid, grant:'direct'|'multi'|'lock', targetUid} */
    case "BATTLE_GRANT_V6": {
      const h = findCardByUidInState(gs, a.uid);
      if(!h || !h.card) break;
      if(typeof ensureBattlePermissionV6!=='function') break;
      const perm = ensureBattlePermissionV6(h.card);
      if(a.grant==='direct'){ perm.directAttackTurn = gs.turn;
        logIt(gs, `${cardName(h.card)} はこのターン直接攻撃できる`); }
      else if(a.grant==='multi'){ perm.multiAttackTurn = gs.turn;
        logIt(gs, `${cardName(h.card)} はこのターン相手モンスター全てに1回ずつ攻撃できる`); }
      else if(a.grant==='lock'){ perm.attackLockUid = (a.targetUid!=null?a.targetUid:null);
        perm.attackLockTurn = gs.turn;
        logIt(gs, `攻撃対象が固定された`); }
      break;
    }

    /* System v7: 遅延処理の予約。turnAbs は予約時に絶対ターンへ解決済み。
       a:{player, at, turnAbs, handler, args, sourceUid, sourceZone, note} */
    case "SCHEDULE_ADD_V7": {
      if(typeof ensureScheduleStateV7!=='function') break;
      ensureScheduleStateV7(gs);
      gs.scheduleSeq = (Number(gs.scheduleSeq)||0) + 1;
      const entry = {
        id: gs.scheduleSeq,
        at: a.at, turnAbs: Number(a.turnAbs),
        handler: a.handler, args: a.args || {},
        player: (a.player===0||a.player===1) ? a.player : gs.activePlayer,
        sourceUid: (a.sourceUid!=null) ? a.sourceUid : null,
        sourceZone: a.sourceZone || null,
        note: a.note || ''
      };
      if(typeof scheduleEntryValidV7==='function' && !scheduleEntryValidV7(entry)){
        logIt(gs, `予約を作れませんでした（${a.handler||'?'}）`); break;
      }
      gs.scheduledV7.push(entry);
      logIt(gs, `予約：${a.note||a.handler}（${a.at} / ターン${entry.turnAbs}）`);
      break;
    }
    /* 予約の取消。a:{ids:[id]} */
    case "SCHEDULE_REMOVE_V7": {
      if(!Array.isArray(gs.scheduledV7)) break;
      const ids = Array.isArray(a.ids) ? a.ids : (a.id!=null ? [a.id] : []);
      if(!ids.length) break;
      gs.scheduledV7 = gs.scheduledV7.filter(e => !e || ids.indexOf(e.id) < 0);
      break;
    }
    /* フェイズのスキップ予約。a:{player, phase, turnAbs} */
    case "PHASE_SKIP_V7": {
      if(typeof ensureScheduleStateV7!=='function') break;
      ensureScheduleStateV7(gs);
      if(SKIPPABLE_PHASE_V7.indexOf(a.phase) < 0) break;
      const k = String(a.player) + ':' + String(a.phase);
      if(!Array.isArray(gs.phaseSkipV7[k])) gs.phaseSkipV7[k] = [];
      if(a.mode === 'consume'){
        const arr = gs.phaseSkipV7[k];
        const i = arr.findIndex(t => Number(t) <= Number(gs.turn));
        if(i >= 0) arr.splice(i, 1);
        if(!arr.length) delete gs.phaseSkipV7[k];
        break;
      }
      const n = Math.max(1, Number(a.count) || 1);
      for(let i=0;i<n;i++) gs.phaseSkipV7[k].push(Number(a.turnAbs));
      logIt(gs, `${nameOf(a.player)} の ${a.phase} フェイズをスキップする予約（${n}回）`);
      break;
    }
    /* System v7: ラベル指定で攻守修正を外す。期限をスケジューラ側が持つため。
       a:{player, zone, index, label} */
    case "MOD_CLEAR_LABEL_V7": {
      const card = zoneCard(P, a.zone||'mz', a.index);
      if(!card || !Array.isArray(card.mods)) break;
      const before = card.mods.length;
      card.mods = card.mods.filter(m => !m || m.label !== a.label);
      if(card.mods.length !== before) logIt(gs, `${a.label} の効果が終了：${cardName(card)}`);
      break;
    }

    /* System v9: 生存リンクの登録。a:{player, zone, index, watchUid, onGone, label} */
    case "LINK_ADD_V9": {
      if(typeof ensureLinkStateV9!=='function') break;
      const card = zoneCard(P, a.zone||'sz', a.index);
      if(!card) break;
      const st = ensureLinkStateV9(card, a.label||'');
      const entry = {uid:Number(a.watchUid), onGone:a.onGone||'destroy'};
      /* System v26: 裏側化でも切るか、戻し先はどちらか。どちらも純 JSON。 */
      if(a.onFaceDown === true) entry.onFaceDown = true;
      if(a.returnTo === 0 || a.returnTo === 1) entry.returnTo = a.returnTo;
      if(typeof linkEntryValidV9==='function' && !linkEntryValidV9(entry)) break;
      if(!st.watch.some(w=>w&&w.uid===entry.uid&&w.onGone===entry.onGone)) st.watch.push(entry);
      logIt(gs, `${a.label||'リンク'}：${cardName(card)} が uid=${entry.uid} を監視`);
      break;
    }
    case "LINK_CLEAR_V9": {
      const card = zoneCard(P, a.zone||'sz', a.index);
      if(!card) break;
      delete card.linkV9;
      break;
    }

    case "BATTLE_CLEANUP": {
      for(let pi=0; pi<2; pi++){
        const PP = gs.players[pi];
        for(let i=(PP.mz||[]).length-1; i>=0; i--){
          const c = PP.mz[i];
          if(!c || !c.battleDestroyed) continue;
          /* S03-U183: an equip destroyed instead (engine/1ZZB) */
          if(typeof equipSubstituteDestroyS03==='function' && equipSubstituteDestroyS03(gs, c)){ delete c.battleDestroyed; continue; }
          dropXyzMaterials(PP, c, gs); dropEquips(PP, c, gs);
          PP.mz.splice(i,1);
          delete c.battleDestroyed;
          /* S03-U251: 「このカードがモンスターを戦闘によって破壊したターン」 — the destroyer still in the Monster Zone records the turn (zone-local) */
          { const lbK = gs.lastBattle, vu = c.uid;
            const kU = (!lbK || vu == null) ? null : (lbK.defenderUidV6 === vu ? lbK.attackerUidV6 : (lbK.attackerUidV6 === vu ? lbK.defenderUidV6 : null));
            const hK = (kU != null && typeof findCardByUidInState==='function') ? findCardByUidInState(gs, kU) : null;
            if(hK && hK.zone==='mz' && hK.card){
              hK.card.battleKillTurnS03 = gs.turn;
              /* S03-U255: an effect monster destroyed (漆黒の魔王 LV6 「この効果で相手モンスターの効果を無効化した」) */
              if(((dbOf(c)||{}).st||[]).indexOf('効果')>=0) hK.card.battleKillEffectTurnS03 = gs.turn;
              /* S03-U255: 「このカードが戦闘によって破壊したモンスターはゲームから除外される」 — the destroyer's script
                 battleVictimBanishS03(destroyer, victim) (face-up, effect not negated) banishes the victim instead of sending it to the GY */
              const scK = (typeof CARD_SCRIPTS!=='undefined') ? CARD_SCRIPTS[cardName(hK.card)] : null;
              if(scK && typeof scK.battleVictimBanishS03==='function' && hK.card.face==='up' && !(typeof effectNegated==='function' && effectNegated(hK.card))){
                try{ if(scK.battleVictimBanishS03(hK.card, c)) c.battleBanishS03 = true; }catch(e){}
              }
            } }
          const ownerIdxB = cardOwnerIndex(gs,c,pi), ownerB = gs.players[ownerIdxB];
          const spellN=v350DestroyedSpellCounterCount(c), sentLv=curLV(c), sentFace=c.face, sentAttrS03=(typeof currentAttributeV17==='function'?currentAttributeV17(c):null);   /* S03-U293 */
          /* System v30 B3: 戦闘破壊時の表示形式もターン記録に残す。 */
          const sentPos=c.pos||null;
          const reversedB=!!c.reversedS03;   /* S03-U185: 「リバースしたこのカードが戦闘によって破壊され」 */
          if(typeof recordDestroyedV30==='function'){
            recordDestroyedV30(gs, {byPlayer:(pi===0?1:0), victimPlayer:pi, from:'mz',
                                    pos:sentPos, face:sentFace, lv:sentLv, uid:c.uid, battle:true});
          }
          const battleBanishB = !!c.battleBanishS03; delete c.battleBanishS03;   /* S03-U255 */
          if(v350BanishWhenLeavesField(c,'mz','grave') || battleBanishB){
            pushZone(ownerB.banish,c);
            /* S03-U255: a declared battle-destroyed negator (漆黒の魔王 LV8 「効果を無効にし、ゲームから除外する」) also reaches the banished card */
            if(typeof battleNegatorUidForVictimS03==='function'){ const negUidX=battleNegatorUidForVictimS03(gs,c), putX=ownerB.banish[ownerB.banish.length-1];
              if(negUidX!=null && putX) putX.banishInfo = {turn:gs.turn, from:'mz', battle:true, battleNegatorUidS03:negUidX}; }
            logIt(gs, `${cardName(c)} が戦闘破壊され除外へ`);
          }else if(s03DeckTopReplaceGraveU110(gs, c, {p:pi, zone:'mz', index:i}, sentFace, '戦闘破壊')){
            /* S03-U110: 破壊はされたが墓地へは行かない（持ち主のデッキの一番上）。 */
          }else{
            pushZone(ownerB.grave, c);
            const putB = graveLastIsS03(ownerB.grave, c);
            if(putB) putB.graveInfo = {turn:gs.turn, from:'mz', byDestroy:true, lv:sentLv, face:sentFace, pos:sentPos, byPlayer:pi===0?1:0, battle:true, attrS03:sentAttrS03, ctrlS03:pi};   /* S03-U185: battle; S03-U293: attribute and controller on the field */
            if(Number(sentLv)>=8 && gs.players[pi]) gs.players[pi].lv8ToGraveTurnS03 = gs.turn;   /* S03-U206: デーモンとの駆け引き */
            if(putB && reversedB) putB.graveInfo.reversedS03 = true;
            /* S03-U25: 「戦闘で破壊したモンスターの効果は無効化される」を宣言したモンスターが破壊した場合だけ、そのカードを記録する。 */
            if(putB && typeof battleNegatorUidForVictimS03==='function'){ const negUid=battleNegatorUidForVictimS03(gs,c); if(negUid!=null) putB.graveInfo.battleNegatorUidS03=negUid; }
            logIt(gs, `${cardName(c)} が戦闘破壊されて墓地へ`);
          }
          if(spellN) v350TransferDestroyedSpellCounters(gs,spellN);
          /* System v11: 戦闘で消滅したトークンも記録する。 */
          if(c.token) recordTokenGoneV11(gs, c, {byDestroy:true, byBattle:true, controller:pi});
        }
      }
      break;
    }
    case "CHAIN_ADD": {
      if(a.eventResumeV11)gs.eventChainResumeV11=JSON.parse(JSON.stringify(a.eventResumeV11));
      // System v4.4: 発動のコミット時に回数制限と activationPending も同じ Action で確定する。
      // Replay/Undo で「回数だけ消費済み」「pending だけ欠落」の中間状態を作らない。
      if(a.v44CountConsume) v44ApplyCountConsume(gs,a.v44CountConsume);
      if(a.v44ActivationPending && a.uid!=null){
        const src=findCardByUidInState(gs,a.uid);
        if(src&&src.card){ src.card.activationPending=true; delete src.card.activationNegated; }
      }
      gs.chainSeq = (gs.chainSeq||0) + 1;
      gs.chain.push({
        chainId:gs.chainSeq,
        player:a.player, cardId:a.cardId, uid:a.uid||null, name:a.name, ss:a.ss,
        from:a.from, index:a.index, prepared:!!a.prepared,
        targets:a.targets||[], selection:a.targets||[], event:a.event||null, eventName:a.eventName||null, keep:!!a.keep,
        v4EffectKey:a.v4EffectKey||null,
        effectClass:a.effectClass||null,
        // System v3.5.0: 魔法カード発動時点で表側だった魔力カウンター監視カードを固定する。
        spellCounterObserverUids:Array.isArray(a.spellCounterObserverUids)?a.spellCounterObserverUids.slice():[],
        // System v3.3.0: ヴェーラー/聖杯等の「そのモンスターの効果を無効」状態は、
        // フィールドで効果を発動した時点の情報をチェーンリンクにも保持する。
        // （コストで自身が場を離れても、発動したフィールド効果は無効のまま扱う）
        sourceNegatedAtActivation:!!a.sourceNegatedAtActivation,
        activationTurn:gs.turn, activationPhase:gs.phase,
        negated:false, activationNegated:false, effectNegated:false,
        negateMode:null, negateReason:''
      });
      /* S03-U10: カードの発動だけのリンク（効果は解決しない）。true の時だけ書く。 */
      if(a.cardActivationOnly) gs.chain[gs.chain.length-1].cardActivationOnly=true;
      /* S03-U29: カードの発動（手札・セット状態から）。true の時だけ書く＝既存 Replay の digest は変わらない。 */
      if(a.cardActivationS03) gs.chain[gs.chain.length-1].cardActivationS03=true;
      if(a.drawReplacementS03) gs.chain[gs.chain.length-1].drawReplacementS03=true;
      if(a.zoneOwnerS03===0||a.zoneOwnerS03===1) gs.chain[gs.chain.length-1].zoneOwnerS03=a.zoneOwnerS03;   /* S03-U46: 相手の場のカードの効果を使用（その時だけ書く） */   /* S03-U33 */
      /* S03-U16: コスト中に控えた値（空でない時だけ書く＝既存 Replay の digest は変わらない）。 */
      if(a.costCtxS03&&typeof a.costCtxS03==='object'&&Object.keys(a.costCtxS03).length) gs.chain[gs.chain.length-1].costCtxS03=JSON.parse(JSON.stringify(a.costCtxS03));
      /* P3: 発動コストのスナップショットは非空のときだけチェーンリンクへ載せる。
         空なら書かない＝既存Replayのdigestは一切変わらない。 */
      if(Array.isArray(a.costSnapshots) && a.costSnapshots.length){
        gs.chain[gs.chain.length-1].costSnapshots = a.costSnapshots.map(x=>Object.assign({},x));
      }
      /* P1.1: 宣言と発動コストidentityは非空のときだけリンクへ凍結する。
         P3 costSnapshotsとは別の意味を維持する。 */
      if(a.declaration){
        gs.chain[gs.chain.length-1].declaration=JSON.parse(JSON.stringify(a.declaration));
      }
      if(Array.isArray(a.activationCost) && a.activationCost.length){
        gs.chain[gs.chain.length-1].activationCost=JSON.parse(JSON.stringify(a.activationCost));
      }
      /* System v12: 「発動する度に」の中央イベント。
         CHAIN_ADD の中で積むので Replay と順序が一致する。 */
      if(typeof v12EmitActivation==='function') v12EmitActivation(gs, gs.chain[gs.chain.length-1]);
      gs.pendingCostSnapshots = [];
      gs.pendingDeclarationV11 = null;
      gs.pendingActivationCostV11 = [];
      logIt(gs, `チェーン${gs.chain.length}：${nameOf(a.player)} が ${a.name}（SS${a.ss}）を発動`);
      break;
    }

    /* P1.1: 宣言・コストidentity・abort clearを1つのAction型でJournal化する。 */
    case "DECLARE_V11": {
      if(gs.pendingDeclarationV11===undefined) gs.pendingDeclarationV11=null;
      if(!Array.isArray(gs.pendingActivationCostV11)) gs.pendingActivationCostV11=[];
      if(a.clear){
        gs.pendingDeclarationV11=null;
        gs.pendingActivationCostV11=[];
        break;
      }
      if(a.clearPersistUid!=null){
        const h=findCardByUidInState(gs,a.clearPersistUid);
        if(h&&h.card) delete h.card.declaration;
      }
      if(a.activationCost){
        const rec=JSON.parse(JSON.stringify(a.activationCost));
        gs.pendingActivationCostV11.push(rec);
        if(Array.isArray(a.p3Snapshots)){
          if(!Array.isArray(gs.pendingCostSnapshots)) gs.pendingCostSnapshots=[];
          a.p3Snapshots.forEach(x=>gs.pendingCostSnapshots.push(JSON.parse(JSON.stringify(x))));
        }
        logIt(gs, `発動コスト記録：${rec.kind} × ${rec.amount||0}`);
      }
      if(a.kind && a.value!==undefined){
        const d={kind:String(a.kind),value:a.value,turn:gs.turn};
        gs.pendingDeclarationV11=JSON.parse(JSON.stringify(d));
        if(a.persistUid!=null){
          const h=findCardByUidInState(gs,a.persistUid);
          if(h&&h.card) h.card.declaration=JSON.parse(JSON.stringify(d));
        }
        logIt(gs, `宣言：${String(a.value)}`);
      }
      break;
    }
    case "EFFECT_COUNT_CONSUME_V44": {
      v44ApplyCountConsume(gs,a.consume||null);
      break;
    }
    /* S03-U141: 「その効果の対象を…このカードに移し替える」（六武衆の影武者）— a chain link's targets are replaced by the
       serialized selection computed by the card (a:{chainId, targets, reason}). Journaled, so Replay moves the target the same. */
    case "CHAIN_RETARGET_S03": {
      const li = gs.chain.findIndex(x => x && x.chainId === a.chainId);
      if(li < 0) break;
      gs.chain[li].targets = a.targets;
      if(gs.chain[li].selection != null) gs.chain[li].selection = a.targets;   /* preparedChainContext reads selection first */
      logIt(gs, `${a.reason||'効果'}：チェーン${li+1}（${gs.chain[li].name}）の対象を移し替えた`);
      break;
    }
    case "CHAIN_NEGATE_LINK": {
      /* System v13: chainId で指定された場合はそちらを優先する。
         index は再生時にずれ得るので identity を先に見る。 */
      let li = (a.index != null) ? a.index : (gs.chain.length-1);
      if(a.chainId != null){
        const byId = gs.chain.findIndex(x => x && x.chainId === a.chainId);
        if(byId >= 0) li = byId; else break;
      }
      const link = gs.chain[li];
      if(!link) break;
      link.negated = true;
      link.negateMode = a.mode || 'activation';
      link.activationNegated = link.negateMode === 'activation';
      link.effectNegated = link.negateMode === 'effect';
      link.negateReason = a.reason || (link.activationNegated ? '発動を無効' : '効果を無効');
      logIt(gs, `チェーン${li+1}：${link.name} の${link.activationNegated?'発動':'効果'}を無効（${link.negateReason}）`);
      break;
    }
    /* System v18: LP変化の置換規則。 */
    case "LP_RULE_V18": {
      if(!Array.isArray(gs.lpRulesV18)) gs.lpRulesV18 = [];
      if(a.clear){
        gs.lpRulesV18 = a.label ? gs.lpRulesV18.filter(r=>r.label!==a.label) : [];
        logIt(gs, `LP変化の規則を解除`);
        break;
      }
      const rule = makeLpRuleV18(
        {player:a.player, cause:a.cause, mode:a.mode,
         untilTurn:(Number(gs.turn)||0) + Math.max(0, Number(a.turns)||0),
         label:a.label, chainId:a.chainId, toPlayer:a.toPlayer, originPlayerS03:a.originPlayerS03}, gs.turn);   /* S03-U271: originPlayerS03 */
      gs.lpRulesV18.push(rule);
      logIt(gs, `${a.label||"効果"}：LP変化の規則を追加（${rule.cause}／${rule.mode}）`);
      break;
    }
    /* System v17: 種族・属性・カード名・チューナー状態の上書き。 */
    case "CHAR_MOD_V17": {
      const card = zoneCard(P, a.zone, a.index);
      if(!card) break;
      if(a.clear){
        if(a.label) card.charV17 = (card.charV17||[]).filter(m=>m.label!==a.label);
        else delete card.charV17;
        if(card.charV17 && !card.charV17.length) delete card.charV17;
        logIt(gs, `${cardName(card)} の特性の上書きを解除`);
        break;
      }
      card.charV17 = card.charV17 || [];
      card.charV17.push(makeCharModV17(a, gs.turn));
      logIt(gs, `${a.label||"効果"}：${cardName(card)} の特性を上書き（${a.kind}＝${a.value}）`);
      break;
    }
    /* System v16: 期間つきのレベル修整（増減 / SET）。 */
    case "LEVEL_MOD_V16": {
      const card = zoneCard(P, a.zone, a.index);
      if(!card) break;
      if(a.clear){
        if(a.label) card.lvModsV16 = (card.lvModsV16||[]).filter(m=>m.label!==a.label);
        else delete card.lvModsV16;
        if(card.lvModsV16 && !card.lvModsV16.length) delete card.lvModsV16;
        logIt(gs, `${cardName(card)} のレベル修整を解除`);
        break;
      }
      const lvBeforeS03 = curLV(card);
      card.lvModsV16 = card.lvModsV16 || [];
      card.lvModsV16.push(makeLevelModV16(a, gs.turn));
      logIt(gs, `${a.label||"効果"}：${cardName(card)} のレベルを変更（現在 ${curLV(card)}）`);
      noteLevelUpS03(card, a, lvBeforeS03);
      break;
    }
    /* System v14: 期間つきの攻守修整（元々の数値 / SET / SWAP）。 */
    case "STAT_MOD_V14": {
      const card = zoneCard(P, a.zone, a.index);
      if(!card) break;
      if(a.clear){
        if(a.label) card.statModsV14 = (card.statModsV14||[]).filter(m=>m.label!==a.label);
        else delete card.statModsV14;
        if(card.statModsV14 && !card.statModsV14.length) delete card.statModsV14;
        logIt(gs, `${cardName(card)} の攻守修整を解除`);
        break;
      }
      card.statModsV14 = card.statModsV14 || [];
      card.statModsV14.push(makeStatModV14(a, gs.turn));
      logIt(gs, `${a.label||"効果"}：${cardName(card)} の数値を変更（${modUntilJp(a.until||'endTurn')}）`);
      break;
    }
    /* System v13: 期間つきのカード効果無効。
       カードスクリプトが gameState を直接書き換えないための入口。 */
    case "NEGATE_CARD_V13": {
      const card = zoneCard(P, a.zone, a.index);
      if(!card) break;
      if(a.clear){
        delete card.negV13;
        logIt(gs, `${cardName(card)} の効果無効が解けた`);
        break;
      }
      card.negV13 = makeNegationV13(a.until, a.label, a.sourceUid, gs.turn);
      logIt(gs, `${a.label||"効果"}：${cardName(card)} の効果を無効化（${a.until==='permanent'?'場を離れるまで':'このターン'}）`);
      break;
    }
    /* S03-U244: 「次の相手ターンのドローフェイズをスキップする」 (八汰烏) — this turn's normal draw is not made */
    case "DRAW_SKIPPED_S03": {
      gs.drawnThisTurn = true;
      logIt(gs, `${nameOf(a.player ?? gs.activePlayer)}：${a.name||'効果'}によりドローフェイズをスキップ（通常のドローを行わない）`);
      break;
    }
    case "DRAW_REPLACED_S03": {
      /* S03-U33 (C-S03-26): 通常のドローを行う代わりに効果を発動した。このターンの通常ドローは済んだ扱いにする。 */
      gs.drawnThisTurn = true;
      logIt(gs, `${nameOf(a.player ?? gs.activePlayer)}：通常のドローを行う代わりに「${a.name||""}」の効果を発動`);
      break;
    }
    case "COUNT_REFUND_S03": {
      /* S03-U34 (C-S03-27): 発動を無効にされたカードの回数制限の消費を戻す（2011 wiki 強欲で謙虚な壺 10/05/19）。 */
      const d = a.refund;
      if(d && d.kind==='card'){
        const h=findCardByUidInState(gs,d.uid), c=h&&h.card;
        if(c){ if(d.scope==='duel'){ if(c.clDuel>0) c.clDuel--; } else if(c.clTurn===gs.turn && c.clN>0) c.clN--; }
      }else if(d && d.kind==='name'){
        const P=gs.players[d.player], store=P&&(d.scope==='duel'?P.effectFlags:P.temporaryFlags), key=String(d.key||'');
        if(store && key && store[key]>0){ store[key]--; if(!store[key]) delete store[key]; }
      }
      logIt(gs, `「${a.name||""}」は発動が無効になったため、発動回数に数えない`);
      break;
    }
    case "CHAIN_RESOLVE_TOP": {
      // 逆順解決：末尾（最後に積んだ＝一番上）から1つ処理して取り除く
      if(!gs.chain.length) break;
      const link = gs.chain.pop();
      // System v4.4: 永続/フィールド/装備カードの発動待ち状態も解決Actionに含める。
      // 発動無効なら activationNegated を残し、通常解決なら pending/negated を解除する。
      if(link && link.uid!=null){
        const src=findCardByUidInState(gs,link.uid);
        if(src&&src.card){
          const activationNegated = link.activationNegated===true || (link.negated && link.negateMode==='activation');
          if(activationNegated){ delete src.card.activationPending; src.card.activationNegated=true; }
          else if(link.prepared){ delete src.card.activationPending; delete src.card.activationNegated; }
        }
      }
      logIt(gs, `解決：チェーン${gs.chain.length+1} ${link.name}（効果は手動で処理してください）`);
      break;
    }
    case "SPECIAL_WIN_DEFER_S03": {
      /* CODEX-C01: a resolving link may move a completed special-win hand again
         (for example, draw then discard).  This state is an Action so replay,
         undo, and a save during a resolution-time choice retain the boundary. */
      if(a.active === true) gs.specialWinDeferredS03 = true;
      else delete gs.specialWinDeferredS03;
      break;
    }
    case "CHAIN_CLEAR": {
      gs.chain = [];
      logIt(gs, `チェーンをクリア`);
      break;
    }

    /* ================= 効果処理プリミティブ =================
       全ての効果はこれらの組み合わせで表現する。applyAction を通るので
       スナップショット／Undo／ログが自動的に効く。 */

    /* 指定ゾーンのカードを墓地へ（破壊・墓地送り共通）
       a:{player, zone:'mz'|'sz'|'field', index, reason} */
    case "FX_TO_GRAVE": {
      /* System v21: 効果破壊だけを防ぐ。墨地送り・除外・バウンスは防がない。
         場を離れる前に見るので、守れた場合カードは一切動かない。 */
      if(a.byDestroy===true && ['mz','sz','field'].includes(a.zone)
         && typeof applyDestructionProtectionV21==='function'){
        const guard = zoneCard(P, a.zone, a.index);
        if(guard){
          const gr = applyDestructionProtectionV21(gs, guard, effectDestroyCtxV21(gs, a, guard));
          if(gr){
            logIt(gs, `${gr.label||'効果'}：${cardName(guard)} はカードの効果では破壊されない`);
            break;
          }
        }
      }
      /* S03-U187: Sin スターダスト・ドラゴン ② 「フィールドゾーンの表側表示のカードは効果では破壊されない」 (engine/1ZZD) */
      if(a.byDestroy===true && a.zone==='field' && typeof sinFieldProtectedS03==='function' && P.field && P.field.face==='up' && sinFieldProtectedS03(gs, P.field)){
        logIt(gs, `Sin スターダスト・ドラゴン：${cardName(P.field)} は効果では破壊されない`); break;
      }
      /* S03-U183: 「装備モンスターが破壊される場合、代わりにこのカードを破壊する」 (engine/1ZZB) */
      if(a.byDestroy===true && a.zone==='mz' && typeof equipSubstituteDestroyS03==='function' && equipSubstituteDestroyS03(gs, zoneCard(P, a.zone, a.index))) break;
      const card = removeFrom(P, a.zone, a.index);
      if(!card) break;
      const fromField=['mz','sz','field'].includes(a.zone);
      const sentLv=(a.zone==='mz')?curLV(card):null, sentFace=card.face, sentAttrS03=(a.zone==='mz')?(typeof currentAttributeV17==='function'?currentAttributeV17(card):null):null;   /* S03-U293 */
      const sentCountersV22 = (fromField && card.counters && Object.keys(card.counters).length)
        ? Object.assign({}, card.counters) : null;
      const byDestroy = fromField && a.byDestroy !== false;
      /* System v30 B1: 効果破壊の「破壊したプレイヤー」。明示指定が無ければ
         解決中のチェーンリンクの発動プレイヤーを使う（v21 と同じ考え方）。 */
      const byPlayerV30 = (typeof destroyerPlayerV30==='function')
        ? (byDestroy ? destroyerPlayerV30(gs, a) : ((a.byPlayer===0||a.byPlayer===1)?a.byPlayer:null))
        : ((a.byPlayer===0||a.byPlayer===1)?a.byPlayer:null);
      /* System v30 B3: 破壊時の表示形式。face だけでは表裏しか分からない。 */
      const sentPos = (a.zone==='mz') ? (card.pos||null) : null;
      const spellN = byDestroy ? v350DestroyedSpellCounterCount(card) : 0;
      dropXyzMaterials(P, card, gs); dropEquips(P, card, gs);
      const ownerIdx=cardOwnerIndex(gs,card,a.player), ownerG=gs.players[ownerIdx];
      if(v350BanishWhenLeavesField(card,a.zone,'grave',a)){
        pushZone(ownerG.banish,card);
        logIt(gs, `${a.reason||"効果"}：${nameOf(a.player)}の ${cardName(card)} は墓地へ行かず除外`);
      }else if(a.deckTopInsteadS03===true && byDestroy){
        /* S03-U256: 「破壊したモンスターを墓地へ送らず、相手のデッキの一番上に置く」 (ミスティック・ソードマン LV6) — destroyed, then placed on top of its owner's Deck */
        const retS03=returnToOwnerDeckOrExtra(gs, card, a.player, false);
        logIt(gs, `${a.reason||'効果'}：${cardName(card)} は墓地へは行かず ${nameOf(retS03.owner)} のデッキの一番上に置かれた`);
      }else if(s03DeckTopReplaceGraveU110(gs, card, {p:a.player, zone:a.zone, index:a.index}, sentFace, a.reason)){
        /* S03-U110: 持ち主のデッキの一番上へ（下の onSendToGrave は墓地にいる時だけ積まれる）。 */
      }else{
        pushZone(ownerG.grave, card);
        /* いつ・どこから墓地へ来たかを控える。 */
        const putG = graveLastIsS03(ownerG.grave, card);
        if(putG) putG.graveInfo = {turn:gs.turn, from:a.zone, byDestroy, byPlayer:byPlayerV30, lv:sentLv, face:sentFace, pos:sentPos};
        if(putG && a.zone==='mz'){ putG.graveInfo.attrS03 = sentAttrS03; putG.graveInfo.ctrlS03 = a.player; }   /* S03-U293: attribute and controller on the field */
        if(putG && a.srcS03 && a.srcS03.uid!=null) putG.graveInfo.srcUidS03 = a.srcS03.uid;   /* S03-U208: the effect source (「「X」と名のついたカードの効果によって」) */
         if(putG && a.selfRuleS03) putG.graveInfo.selfRuleS03 = a.selfRuleS03;   /* S03-U284: destroyed by its own 「…場合このカードを破壊する」 or a uniqueness rule (engine/1ZZF) */
        /* S03-U235: 「リリースされた場合」 — a Tribute Summon's release (p3.reason 'tribute') or a release cost (the scripts' reason convention
           「…（リリース）」 / 「生け贄」). Destruction is never a release. */
        if(putG && !byDestroy && ((a.p3 && a.p3.reason==='tribute') || /リリース|生け贄|生贄/.test(String(a.reason||'')))) putG.graveInfo.releasedS03 = true;
        if(a.zone==='mz' && Number(sentLv)>=8 && gs.players[a.player]) gs.players[a.player].lv8ToGraveTurnS03 = gs.turn;   /* S03-U206: デーモンとの駆け引き */
        /* System v22: 場を離れる直前に乗っていたカウンターを控える。
           counters は領域ローカルで消えるので、後からは読めない。
           カウンターが乗っていた場合だけ追記する。 */
        if(putG && putG.graveInfo && byDestroy && sentCountersV22) putG.graveInfo.countersV22 = sentCountersV22;
        applyMoveProvenanceP3(putG, a, a.zone);   /* P3 */
        /* S03-U290: a card sent from the Deck to the GY by FX_TO_GRAVE is a Deck-to-GY event too (engine/1ZZN summary) */
        if(putG && a.zone==='deck' && typeof queueDeferredEventV2==='function' && typeof PLAY_MODE!=='undefined' && PLAY_MODE===PLAY_MODES.DUEL)
          queueDeferredEventV2('onSendToGrave',Object.assign({player:a.player,card:putG,reason:a.reason||'effect',from:'deck'},eventProvS03(a)));
        P.graveHistory.push({name:cardName(card), from:a.zone, turn:gs.turn});
        logIt(gs, `${a.reason||"効果"}：${nameOf(a.player)}の ${cardName(card)} を墓地へ`);
      }
      /* System v30 B3: 「〜を破壊したターン」用のターン単位記録。 */
      if(byDestroy && typeof recordDestroyedV30==='function'){
        recordDestroyedV30(gs, {byPlayer:byPlayerV30, victimPlayer:a.player, from:a.zone,
                                pos:sentPos, face:sentFace, lv:sentLv, uid:card.uid, battle:false});
      }
      if(spellN) v350TransferDestroyedSpellCounters(gs,spellN);
      /* System v11: トークンは墓地に残らないので「破壊された」事実を
         この Action の間だけ控える。onLeaveField は行き先から破壊を
         判定するため、消滅するトークンでは判定できない。 */
      if(card.token) recordTokenGoneV11(gs, card, {byDestroy, byBattle:false, controller:a.player});
      /* System v3.5.0: 効果破壊/墓地送りでも誘発イベントをチェーン解決後へ予約する。
         戦闘破壊はBATTLE_CLEANUP側で同時イベント化するためここには来ない。 */
      if(fromField && typeof queueDeferredEventV2==='function' && typeof PLAY_MODE!=='undefined' && PLAY_MODE===PLAY_MODES.DUEL){
        const loc=findCardByUid(card.uid);
        if(byDestroy) queueDeferredEventV2('onDestroy',{player:a.player,card,reason:'effect',byPlayer:byPlayerV30});
        if(loc && loc.zone==='grave') queueDeferredEventV2('onSendToGrave',Object.assign({player:a.player,card,reason:byDestroy?'destroy':'effect',byPlayer:byPlayerV30},eventProvS03(a)));   /* S03-U295: move group */
        queueDeferredEventV2('onRemove',{player:a.player,card,reason:byDestroy?'destroy':'effect',byPlayer:byPlayerV30});
      }
      break;
    }

    /* 複数まとめて墓地へ（全体破壊用）。a:{player, zone, reason} */
    case "FX_WIPE_ZONE": {
      // System v3.5.0: 全体破壊でも持ち主・場を離れたら除外・魔力カウンター移送を共通適用する。
      /* System v21: 全体破壊でもカードごとに耐性を見て、守られたカードは残す。 */
      const wipeCtxV21 = (typeof effectDestroyCtxV21==='function') ? effectDestroyCtxV21(gs, a) : null;
      const wipeGuardV21 = (c)=>{
        if(!c || !wipeCtxV21 || typeof applyDestructionProtectionV21!=='function') return null;
        return applyDestructionProtectionV21(gs, c, effectDestroyCtxV21(gs, a, c));   /* S03-U168: per card (targeting) */
      };
      const doomed=[], sparedV21=[], doomedLocU110=new Map();
      if(a.zone==='field'){
        if(P.field){
          const g=wipeGuardV21(P.field);
          if(g) logIt(gs, `${g.label||'効果'}：${cardName(P.field)} はカードの効果では破壊されない`);
          else if(P.field.face==='up' && typeof sinFieldProtectedS03==='function' && sinFieldProtectedS03(gs, P.field)) logIt(gs, `Sin スターダスト・ドラゴン：${cardName(P.field)} は効果では破壊されない`);   /* S03-U187 */
          else { doomed.push(P.field); P.field=null; }
        }
      }else{
        const arr=P[a.zone]||[];
        /* 場から取り除く前に判定する。取り除いた後では
           継続効果の届く範囲を正しく見られない。 */
        arr.slice().forEach(c=>{
          const g=wipeGuardV21(c);
          if(g){ sparedV21.push(c); logIt(gs, `${g.label||'効果'}：${cardName(c)} はカードの効果では破壊されない`); }
          /* S03-U115: 発生源の効果を受けないカードは残る */
          else if(a.srcS03 && typeof s03UnaffectedByU115==='function' && s03UnaffectedByU115(gs,c,a.srcS03)){ sparedV21.push(c); logIt(gs, `${cardName(c)} は${a.srcS03.k==='t'?'罠':'魔法'}カードの効果を受けない`); }
        });
        for(let i=arr.length-1;i>=0;i--){
          if(sparedV21.indexOf(arr[i])>=0) continue;
          if(Array.isArray(a.spareUidsS03) && arr[i] && a.spareUidsS03.indexOf(arr[i].uid)>=0) continue;   /* S03-U173: destroyed a substitute instead */
          if(a.zone==='mz' && typeof equipSubstituteDestroyS03==='function' && equipSubstituteDestroyS03(gs, arr[i])) continue;   /* S03-U183 */
          const wU110=arr.splice(i,1)[0];
          doomed.push(wU110);
          if(wU110) doomedLocU110.set(wU110, {p:a.player, zone:a.zone, index:i, face:wU110.face});   /* S03-U110 */
        }
      }
      const names=doomed.map(c=>cardName(c));
      /* S03-U145: a mass destruction (ブラック・ホール, 激流葬, ブラック・ローズ・ドラゴン, 神獣王バルバロス …) is a destruction of each
         card, exactly like FX_TO_GRAVE with byDestroy: before this unit the destroyed cards got no graveInfo, no destroyed-this-turn
         record and no onDestroy / onSendToGrave / onRemove events, so no 「破壊された場合」「墓地へ送られた時」 trigger could activate
         after it (e.g. 古代の機械究極巨人 ③, ダンディライオン). */
      const byPlayerWipeS03 = (typeof destroyerPlayerV30==='function') ? destroyerPlayerV30(gs, a) : ((a.byPlayer===0||a.byPlayer===1)?a.byPlayer:null);
      doomed.forEach(w=>{
        const spellN=v350DestroyedSpellCounterCount(w);
        const sentLv=(a.zone==='mz')?curLV(w):null, sentFace=w.face, sentPos=(a.zone==='mz')?(w.pos||null):null, sentAttrS03=(a.zone==='mz')?(typeof currentAttributeV17==='function'?currentAttributeV17(w):null):null;   /* S03-U293 */
        const sentCountersS03=(w.counters && Object.keys(w.counters).length) ? Object.assign({}, w.counters) : null;
        dropXyzMaterials(P,w,gs); dropEquips(P,w,gs);
        const owner=cardOwnerIndex(gs,w,a.player), dst=gs.players[owner];
        const locU110=doomedLocU110.get(w);
        if(v350BanishWhenLeavesField(w,a.zone,'grave',a)) pushZone(dst.banish,w);
        else if(locU110 && s03DeckTopReplaceGraveU110(gs, w, locU110, locU110.face, a.reason)){ /* S03-U110 */ }
        else {
          pushZone(dst.grave,w);
          const putG=graveLastIsS03(dst.grave, w);
          if(putG){
            putG.graveInfo={turn:gs.turn, from:a.zone, byDestroy:true, byPlayer:byPlayerWipeS03, lv:sentLv, face:sentFace, pos:sentPos};
            if(a.zone==='mz'){ putG.graveInfo.attrS03 = sentAttrS03; putG.graveInfo.ctrlS03 = a.player; }   /* S03-U293 */
            if(a.zone==='mz' && Number(sentLv)>=8 && gs.players[a.player]) gs.players[a.player].lv8ToGraveTurnS03 = gs.turn;   /* S03-U206: デーモンとの駆け引き */
            if(sentCountersS03) putG.graveInfo.countersV22=sentCountersS03;
            applyMoveProvenanceP3(putG, a, a.zone);
          }
          P.graveHistory.push({name:cardName(w), from:a.zone, turn:gs.turn});
        }
        if(typeof recordDestroyedV30==='function')
          recordDestroyedV30(gs, {byPlayer:byPlayerWipeS03, victimPlayer:a.player, from:a.zone, pos:sentPos, face:sentFace, lv:sentLv, uid:ensureCardUid(gs,w), battle:false});
        if(spellN) v350TransferDestroyedSpellCounters(gs,spellN);
        /* System v11 */
        if(w.token) recordTokenGoneV11(gs, w, {byDestroy:true, byBattle:false, controller:a.player});
        if(typeof queueDeferredEventV2==='function' && typeof PLAY_MODE!=='undefined' && PLAY_MODE===PLAY_MODES.DUEL){
          const loc=findCardByUid(w.uid);
          queueDeferredEventV2('onDestroy',{player:a.player,card:w,reason:'effect',byPlayer:byPlayerWipeS03});
          if(loc && loc.zone==='grave') queueDeferredEventV2('onSendToGrave',Object.assign({player:a.player,card:w,reason:'destroy',byPlayer:byPlayerWipeS03},eventProvS03(a)));   /* S03-U295: move group */
          queueDeferredEventV2('onRemove',{player:a.player,card:w,reason:'destroy',byPlayer:byPlayerWipeS03});
        }
      });
      if(names.length) logIt(gs, `${a.reason||"効果"}：${nameOf(a.player)}の ${names.join("・")} を破壊`);
      break;
    }

    /* 墓地/除外/デッキ/手札 から フィールドへ特殊召喚
       a:{player, from, fromIndex, pos, reason} */
    case "FX_SPECIAL_SUMMON": {
      if(P.mz.length >= ZONE_LIMITS.mz){ logIt(gs, `モンスターゾーンが一杯です`); break; }
      // System v3.4.0: 「このターン特殊召喚できない」を全ての特殊召喚経路で保証する。
      if(P.temporaryFlags && P.temporaryFlags.noSpecialSummon){
        logIt(gs, `${nameOf(a.player)}はこのターン特殊召喚できません`);
        break;
      }
      // System v3.3.0: カード固有の「特殊召喚できない」を共通処理で保証する。
      const SP = gs.players[a.fromPlayer==null?a.player:a.fromPlayer];
      const pendingCard = zoneCard(SP, a.from, a.fromIndex);
      if(pendingCard && typeof CARD_SCRIPTS!=='undefined') {
        const sc = CARD_SCRIPTS[cardName(pendingCard)];
        if(sc && sc.cannotSpecialSummon===true && a.ignoreSummonConditionS03!==true){   /* S03-U145: 召喚条件を無視して */
          logIt(gs, `${cardName(pendingCard)} は特殊召喚できません`);
          break;
        }
      }
      const card = removeFrom(SP, a.from, a.fromIndex);
      if(!card) break;
      if(a.from==='banish') delete card.banishInfo;
      if(a.from==='sz') delete card.asSpellS03;   /* S03-U240: a placed 「宝玉獣」 summoned from the Spell & Trap Zone is a monster again */
      if(a.asMonsterDbS03 && a.from==='sz') card.asMonsterDbS03 = JSON.parse(JSON.stringify(a.asMonsterDbS03));   /* S03-U248: a Trap Monster (engine/1ZZI) */
      if(a.from==='deck') shuffle(SP.deck,gs);
      card.face='up'; card.pos = a.pos||'atk'; card.attacked=false;
      /* S03-U136: 「裏側守備表示で特殊召喚する」（ワーム・ヤガン）— summonedTurn blocks a Flip Summon this turn */
      if(a.faceDown===true){ card.face='down'; card.pos='def'; }
      card.summonedTurn = gs.turn; card.specialSummoned=true; card.specialSummonedFrom=a.from;
      /* System v30 B2: どちらのプレイヤーの領域から出したか。owner から推測しない。 */
      card.specialSummonedFromPlayer = (a.fromPlayer===0||a.fromPlayer===1) ? a.fromPlayer : a.player;
      card.specialSummonKind=a.summonKind||'effect';
      if(a.gladiatorS03) card.gladiatorSummonedS03=true;   /* S03-U180: 「剣闘獣」モンスターの効果によって特殊召喚 (engine/1ZZ) */
      /* S03-U238: 「「X」と名のついたカードの効果によって特殊召喚」 — the summoning card's name, given by that card's script (opts.summonSrcS03) */
      if(a.summonSrcS03) card.summonSrcS03 = {name:String(a.summonSrcS03), turn:gs.turn};
      /* S03-U184: 「効果を無効にして特殊召喚する」 — the negation is part of the summon, so its summon triggers do not activate */
      if(a.negateOnSummonS03) card.negV13 = {until:'permanent', turn:gs.turn, label:String(a.reason||'効果'), sourceUid:(a.negateSourceUidS03!=null?Number(a.negateSourceUidS03):null)};
      /* S03-U127: 正規の方法（summonKind が一致）で特殊召喚された記録。手札・デッキ・EXへ戻ると消える。 */
      if(typeof specialSummonMonsterKindS03==='function'){
        const kS03 = specialSummonMonsterKindS03(dbOf(card));
        /* 自身の効果で自分を特殊召喚する「通常召喚できない」モンスター（カオス・ソーサラー等）も正規の方法 */
        if(kS03 && (a.summonKind===kS03 || ((kS03==='procedure' || a.summonKind==='procedure') && a.reason===cardName(card)) ||   /* S03-U174: a Fusion Monster's own procedure (contact fusion) */
           (a.reason && properSummonSourcesS03(dbOf(card)).indexOf(a.reason)>=0))) card.properlySummonedS03=true;
      }
      P.mz.push(card);
      P.ssHistory.push({name:cardName(card), from:a.from, turn:gs.turn, fromPlayer:card.specialSummonedFromPlayer,
        lv:curLV(card), kind:card.specialSummonKind});
      logIt(gs, `${a.reason||"効果"}：${card.face==='down'?'モンスター':cardName(card)} を特殊召喚（${card.face==='down'?'裏側守備':card.pos==='def'?'守備':'攻撃'}）`);
      break;
    }

    /* デッキ→手札（サーチ）。a:{player, deckIndex, reason} */
    case "FX_SEARCH": {
      const card = removeFrom(P, "deck", a.deckIndex);
      if(!card) break;
      card.face='up';
      P.hand.push(card);
      shuffle(P.deck,gs);
      logIt(gs, `${a.reason||"効果"}：${cardName(card)} を手札に加えた（デッキシャッフル）`);
      /* S03-U275: a search (API.searchDeck) is 「デッキから手札に加わった」 too — it raised no onAddToHand, so ワタポン /
         強烈なはたき落とし never saw the usual searches (only FX_DECK_TO_HAND emitted it) */
      if(typeof emitAddToHandV8==='function') emitAddToHandV8(gs, who2V8(gs,a), card, 'deck', a.reason||'');
      break;
    }

    /* デッキの指定カードを手札へ加える（シャッフルしない）。
       「めくったカードを手札に加える」等、サーチではない処理用。 */
    case "FX_DECK_TO_HAND": {
      const card=removeFrom(P,"deck",a.deckIndex);
      if(!card) break;
      card.face='up'; card.pos='atk';
      P.hand.push(card);
      logIt(gs, `${a.reason||"効果"}：${cardName(card)} をデッキから手札へ加えた`);
      /* System v8: サーチも「デッキから手札に加わった」イベントとして流す。 */
      if(typeof emitAddToHandV8==='function')
        emitAddToHandV8(gs, who2V8(gs,a), card, 'deck', a.reason||'');
      break;
    }

    /* デッキ→墓地（落とす）。a:{player, deckIndex, reason} */
    case "FX_MILL": {
      const card = removeFrom(P, "deck", a.deckIndex);
      if(!card) break;
      pushZone(P.grave, card);
      const putM = graveLastIsS03(P.grave, card);
      if(putM) putM.graveInfo = {turn:gs.turn, from:'deck', byDestroy:false};
      applyMoveProvenanceP3(putM, a, 'deck');   /* P3 */
      shuffle(P.deck,gs);
      logIt(gs, `${a.reason||"効果"}：${cardName(card)} をデッキから墓地へ`);
      if(putM && typeof queueDeferredEventV2==='function' && typeof PLAY_MODE!=='undefined' && PLAY_MODE===PLAY_MODES.DUEL){
        queueDeferredEventV2('onSendToGrave',Object.assign({player:a.player,card:putM,reason:a.reason||'effect',from:'deck'},eventProvS03(a)));
      }
      if(putM && typeof lswMillAppliedS03==='function') lswMillAppliedS03(gs, a, [putM]);   /* S03-U190 */
      break;
    }

    /* デッキトップから n 枚墓地へ。a:{player, n, reason} */
    case "FX_MILL_TOP": {
      const n = a.n||1; const names=[],sent=[];
      for(let i=0;i<n;i++){
        if(!P.deck.length) break;
        const c=P.deck.shift(); names.push(cardName(c));
        pushZone(P.grave, c);
        const putT = graveLastIsS03(P.grave, c);
        if(putT){ putT.graveInfo = {turn:gs.turn, from:'deck', byDestroy:false};
                 applyMoveProvenanceP3(putT, a, 'deck');   /* P3 */
                 sent.push(putT); }
      }
      logIt(gs, `${a.reason||"効果"}：デッキトップ ${names.join("・")||"0枚"} を墓地へ`);
      if(sent.length && typeof queueDeferredEventV2==='function' && typeof PLAY_MODE!=='undefined' && PLAY_MODE===PLAY_MODES.DUEL){
        sent.forEach(c=>queueDeferredEventV2('onSendToGrave',Object.assign({player:a.player,card:c,reason:a.reason||'effect',from:'deck'},eventProvS03(a))));
      }
      if(typeof lswMillAppliedS03==='function') lswMillAppliedS03(gs, a, sent);   /* S03-U190 */
      break;
    }

    /* フィールド→手札（バウンス）。a:{player, zone, index, reason}
       System v3.3.0:
       - 戻る先は現在のコントローラーではなくカードの持ち主。
       - 融合・S・Xなど元々EXデッキのモンスターは手札へは戻らず、持ち主のEXデッキへ戻る。
       これにより「死者蘇生で相手モンスターを奪う→強制脱出装置」も持ち主の手札へ戻る。 */
    case "FX_BOUNCE": {
      const card = removeFrom(P, a.zone, a.index);
      if(!card) break;
      dropXyzMaterials(P, card, gs); dropEquips(P, card, gs);
      if(card.token){ logIt(gs, `${cardName(card)} は消滅した`); break; }  // トークンは手札に戻らない
      if(v350BanishWhenLeavesField(card,a.zone,'hand',a)){
        const owner=cardOwnerIndex(gs,card,a.player); pushZone(gs.players[owner].banish,card);
        logIt(gs, `${a.reason||"効果"}：${cardName(card)} は手札へ戻らず除外`); break;
      }
      const ret = returnToOwnerHandOrExtra(gs, card, a.player);
      if(ret.zone==='ex'){
        logIt(gs, `${a.reason||"効果"}：${cardName(card)} は手札ではなく ${nameOf(ret.owner)} のEXデッキに戻った`);
      }else{
        logIt(gs, `${a.reason||"効果"}：${cardName(card)} を ${nameOf(ret.owner)} の手札に戻した`);
      }
      break;
    }

    /* 除外。a:{player, zone, index, reason}
       コントロールが移っているカードも、除外領域は持ち主側に置く。 */
    case "FX_BANISH": {
      const card = removeFrom(P, a.zone, a.index);
      if(!card) break;
      noteLeftFieldByEffectS03(card, a.zone, 'banish', a);   /* S03-U238 */
      dropXyzMaterials(P, card, gs); dropEquips(P, card, gs);
      const owner = cardOwnerIndex(gs, card, a.player);
      pushZone(gs.players[owner].banish, card);
      logIt(gs, `${a.reason||"効果"}：${cardName(card)} を除外${owner!==a.player?`（${nameOf(owner)}の除外）`:''}`);
      break;
    }

    /* System v3.8.0: 「破壊して除外」を通常の除外と分離する。
       《奈落の落とし穴》などは破壊された事実を残しつつ、墓地を経由せず除外する。 */
    case "FX_DESTROY_BANISH": {
      const card = removeFrom(P, a.zone, a.index);
      if(!card) break;
      noteLeftFieldByEffectS03(card, a.zone, 'banish', a);   /* S03-U238 */
      const fromField=['mz','sz','field'].includes(a.zone);
      const spellN = fromField ? v350DestroyedSpellCounterCount(card) : 0;
      /* System v30 B1: 破壊して除外でも「破壊したプレイヤー」を決める。 */
      const dbByPlayerV30 = (typeof destroyerPlayerV30==='function')
        ? destroyerPlayerV30(gs, a) : ((a.byPlayer===0||a.byPlayer===1)?a.byPlayer:null);
      ensureCardUid(gs,card);
      /* System v30 B3: 破壊して除外もこのターンの破壊として数える。 */
      if(fromField && typeof recordDestroyedV30==='function'){
        recordDestroyedV30(gs, {byPlayer:dbByPlayerV30, victimPlayer:a.player, from:a.zone,
                                pos:(a.zone==='mz'?(card.pos||null):null), face:card.face||null,
                                lv:(a.zone==='mz'?curLV(card):null), uid:card.uid, battle:false});
      }
      dropXyzMaterials(P, card, gs); dropEquips(P, card, gs);
      const owner = cardOwnerIndex(gs, card, a.player);
      pushZone(gs.players[owner].banish, card);
      if(spellN) v350TransferDestroyedSpellCounters(gs,spellN);
      logIt(gs, `${a.reason||"効果"}：${cardName(card)} を破壊して除外${owner!==a.player?`（${nameOf(owner)}の除外）`:''}`);
      if(fromField && typeof queueDeferredEventV2==='function' && typeof PLAY_MODE!=='undefined' && PLAY_MODE===PLAY_MODES.DUEL){
        queueDeferredEventV2('onDestroy',{player:a.player,card,reason:'effect',byPlayer:dbByPlayerV30});
      }
      break;
    }

    /* System v3.8.0: 手札から墓地へ「送る」。捨てる扱いではないため暗黒界などの discardInfo を付けない。
       a:{player, handIndex, reason} */
    case "FX_HAND_SEND_GRAVE": {
      const card = removeFrom(P, "hand", a.handIndex);
      if(!card) break;
      pushZone(P.grave, card);
      const put = graveLastIsS03(P.grave, card);
      if(put) put.graveInfo = {turn:gs.turn, from:'hand', byDestroy:false};
      applyMoveProvenanceP3(put, a, 'hand');   /* P3 */
      logIt(gs, `${a.reason||"コスト"}：${cardName(card)} を手札から墓地へ送った`);
      // 「手札から墓地へ送られた時」を共通イベント化（深淵の暗殺者、ダンディライオン等）。
      if(put && typeof queueDeferredEventV2==='function' && typeof PLAY_MODE!=='undefined' && PLAY_MODE===PLAY_MODES.DUEL){
        queueDeferredEventV2('onSendToGrave',{player:a.player,card:put,reason:a.reason||'effect',from:'hand'});
      }
      break;
    }

    /* 手札を捨てる（コスト）。a:{player, handIndex, reason} */
    case "FX_DISCARD": {
      const card = removeFrom(P, "hand", a.handIndex);
      if(!card) break;
      pushZone(P.grave, card);
      /* 暗黒界の判定材料。誰の効果で捨てられたかを記録する。
         pushZone は reset() でカードの状態を落とすので、置いた後に付ける。
         byEffect が false（手札制限などのルール処理）なら暗黒界は誘発しない。 */
      const put = graveLastIsS03(P.grave, card);
      if(put){
        put.graveInfo={turn:gs.turn,from:'hand',byDestroy:false};
        put.discardInfo = a.byEffect === false ? null
          : {byEffect:true, byPlayer:(a.byPlayer != null ? a.byPlayer : a.player), turn:gs.turn};
        applyMoveProvenanceP3(put, a, 'hand');   /* P3: 既存 byPlayer の意味は変えず actingPlayer を併設 */
      }
      logIt(gs, `${a.reason||"コスト"}：${cardName(card)} を手札から捨てた`);
      // System v3.8.0: 「効果で捨てられた」を独立イベント化。暗黒界・魔轟神を自動SEGOCへ載せる。
      if(put && typeof queueDeferredEventV2==='function' && typeof PLAY_MODE!=='undefined' && PLAY_MODE===PLAY_MODES.DUEL){
        if(a.byEffect !== false) queueDeferredEventV2('onDiscard',{player:a.player,card:put,byEffect:true,byPlayer:(a.byPlayer != null ? a.byPlayer : a.player),reason:a.reason||'effect'});
        /* S03-U196: every discard, also a cost or the hand-size rule (魔轟神 「手札から墓地へ捨てられた時」; onDiscard keeps 「効果で捨てられた」) */
        queueDeferredEventV2('onDiscardAnyS03',Object.assign({player:a.player,card:put,byEffect:a.byEffect!==false,reason:a.reason||'effect'},eventProvS03(a)));
        queueDeferredEventV2('onSendToGrave',{player:a.player,card:put,reason:a.reason||'effect',from:'hand'});
      }
      break;
    }

    /* 手札→デッキトップ。a:{player, handIndex, reason} */
    case "FX_HAND_TO_TOP": {
      const card = removeFrom(P, "hand", a.handIndex);
      if(!card) break;
      card.face='down';
      P.deck.unshift(card);
      logIt(gs, `${a.reason||"効果"}：${cardName(card)} をデッキトップへ`);
      break;
    }

    /* 表示形式・表裏の指定変更。a:{player, zone, index, face?, pos?} */
    /* S03-U257: a used card's lingering effect for the rest of this turn — the card (by uid, wherever it is) becomes a continuous source
       when its script declares continuous.from:['linger'] (collectSources). Stored in the player's temporaryFlags (cleared at every turn start). */
    case "LINGER_ADD_S03": {
      if(!P || a.uid == null) break;
      /* S03-U264: a lingering effect that lasts beyond this turn (「次の相手のエンドフェイズ時まで」) — {uid, player, untilTurn} in gs.lingerLongS03,
         pruned at the start of the first turn after untilTurn */
      if(a.untilTurn != null){
        const ll = gs.lingerLongS03 || (gs.lingerLongS03 = []);
        if(!ll.some(e=>e && e.uid===a.uid && e.player===a.player)) ll.push({uid:a.uid, player:a.player, untilTurn:Number(a.untilTurn)});
        break;
      }
      const tfL = P.temporaryFlags || (P.temporaryFlags = {});
      const listL = tfL.lingerUidsS03 || (tfL.lingerUidsS03 = []);
      if(listL.indexOf(a.uid) < 0) listL.push(a.uid);
      break;
    }
    /* System v4.6: カード単位のboolean状態を明示的にset/deleteする。
       旧FX_SET_STATE(flag)のtoggleと違い、Replayで意図が一意になる。 */
    case "FX_CARD_FLAG_V46": {
      const card=zoneCard(P,a.zone,a.index); if(!card) break;
      if(a.value===false || a.value==null) delete card[a.flag]; else card[a.flag]=a.value===true?true:a.value;
      if(card.procedureBaseStats && card.procedureBaseStats.loseOnNegate && cardEffectNegatedInActionStateS03(gs,card))
        delete card.procedureBaseStats;
      if(!a.silent) logIt(gs,`${a.reason||'効果'}：${cardName(card)} ${a.flag}=${card[a.flag]===undefined?'OFF':String(card[a.flag])}`);
      break;
    }

    case "FX_SET_STATE": {
      const card = zoneCard(P, a.zone, a.index);
      if(!card) break;
      const prevFace = card.face;
      if(a.face) card.face = a.face;
      if(a.pos)  card.pos  = a.pos;
      // System v2.4: 表→裏で数値変更は失効。妥協セット由来の待機状態は裏→表で初回適用。
      if(a.face==='down' && card.procedureBaseStats && card.procedureBaseStats.loseOnFaceDown){
        delete card.procedureBaseStats;
        logIt(gs, `${cardName(card)}：召喚方法による元々の数値変更の適用が終了`);
      }
      if(prevFace==='down' && a.face==='up') activatePendingProcedureBaseStats(card, gs);
      if(a.flipSummon===true && P.temporaryFlags) P.temporaryFlags.summonedThisTurnS03 = true;   /* S03-U129: 反転召喚 */
      if(a.flipSummon===true) card.flipSummonedTurnS03 = gs.turn;   /* S03-U260: 「反転召喚されたモンスターは、そのターン」 (怨霊の湿地帯) — zone-local */
      /* S03-U119: 裏側表示になったデュアルモンスターは、もう1度召喚された状態ではなくなる。 */
      if(a.face==='down' && card.dualUp) delete card.dualUp;
      /* S03-U211: characteristic mods that last only while face-up (魔轟神ミーズトージ) end when the monster is turned face-down. */
      if(a.face==='down' && Array.isArray(card.charV17)){ card.charV17 = card.charV17.filter(m=>!m.faceUpOnlyS03); if(!card.charV17.length) delete card.charV17; }
      /* 手動で状態を付け外しする。スクリプトが無いカードの効果を
         プレイヤーが自分で再現できるようにするための逃げ道。 */
      if(a.flag){
        if(card[a.flag]) delete card[a.flag]; else card[a.flag] = true;
        const jp = {negated:"効果無効", cannotAttack:"攻撃不可",
                    cannotTribute:"リリース不可", attacked:"攻撃済み"}[a.flag] || a.flag;
        logIt(gs, `${cardName(card)}：${jp} を${card[a.flag]?"付与":"解除"}`);
        break;
      }
      if(a.lvDelta){
        const lvBeforeS03 = curLV(card);
        card.lvMod = (card.lvMod||0) + a.lvDelta;
        logIt(gs, `${cardName(card)}：レベルを ${a.lvDelta>0?'+':''}${a.lvDelta}（現在 ${curLV(card)}）`);
        noteLevelUpS03(card, a, lvBeforeS03);
        break;
      }
      if(a.lvReset){
        delete card.lvMod;
        logIt(gs, `${cardName(card)}：レベルを元に戻した`);
        break;
      }
      logIt(gs, `${a.reason||"効果"}：${cardName(card)} を${a.face==='down'?'裏側':''}${a.pos==='def'?'守備表示':a.pos==='atk'?'攻撃表示':''}に`);
      break;
    }

    /* 発動したカード自身を墓地へ（通常魔法・罠の処理後） */
    case "FX_SELF_TO_GRAVE": {
      const card = removeFrom(P, a.zone, a.index);
      if(!card) break;
      pushZone(P.grave, card);
      logIt(gs, `${cardName(card)} は墓地へ`);
      break;
    }

    /* System v4.2: DUELモードのEX召喚試行をAction化する。
       PREPAREで素材とEXモンスターを盤面から切り離し、pendingExV2へ保存する。
       召喚無効窓の後、COMMIT/CANCELのどちらもActionとして記録できるためReplay可能。 */
    case "EX_SUMMON_PREPARE_V42": {
      const exCard=P.ex[a.exIndex]; if(!exCard) break;
      const indices=[].concat(a.materials||[]).map(Number).filter(Number.isInteger).sort((x,y)=>y-x);
      if(P.mz.length-indices.length>=ZONE_LIMITS.mz){ logIt(gs,'モンスターゾーンが足りません'); break; }
      ensureCardUid(gs,exCard);
      const matCards=[];
      indices.forEach(mi=>{ const c=P.mz.splice(mi,1)[0]; if(c){ensureCardUid(gs,c);matCards.push(c);} });
      P.ex.splice(a.exIndex,1);
      gs.pendingExV2={player:a.player,exCard,materialCards:matCards,kind:a.kind,pos:a.pos||'atk'};
      // シンクロ素材は召喚試行時点で墓地へ送られている。召喚が無効でも戻らない。
      if(a.kind==='synchro') {
        gs.pendingExV2.materialCards=[];
        /* S03-U80: 「シンクロ素材とした（元々の）モンスターの攻撃力」を参照するカード（ジュラック・ヴェルヒプト等）
           のため、name/tuner/lv と同じタイミング（reset・墓地送り前）で atk/def も控える。p3OriginalStatV3 は
           procedureBaseStats／setBaseAtk 継続効果まで考慮した「元々の攻撃力」を返す既存の取得元
           （P3、engine/12_provenance_v3.js）で、既に合成魔獣ガーゼット等がアドバンス召喚の素材に対して
           同じ考え方で使っている。 */
        const snapMats=matCards.map(c=>({name:cardName(c),tuner:isTuner(dbOf(c)),lv:curLV(c),at:(typeof currentAttributeV17==='function')?currentAttributeV17(c):(dbOf(c).at||null),   /* S03-U147: attribute (A・ジェネクス・トライフォース) */
          
          atk:(typeof p3OriginalStatV3==='function')?p3OriginalStatV3(c,'atk'):null,
          def:(typeof p3OriginalStatV3==='function')?p3OriginalStatV3(c,'def'):null}));
        matCards.forEach(c=>{
          const sentLv=curLV(c), sentFace=c.face, sentAttrS03=(typeof currentAttributeV17==='function'?currentAttributeV17(c):null);   /* S03-U293 */
          const owner=cardOwnerIndex(gs,c,a.player),dst=gs.players[owner];
          if(v350BanishWhenLeavesField(c,'mz','grave')){
            const r=reset(c); if(r){ r.banishInfo={turn:gs.turn,from:'mz',face:'up',reason:'synchroMaterial'}; dst.banish.push(r); }
          }else if(s03DeckTopReplaceGraveU110(gs, c, {p:a.player, zone:'mz', index:0}, sentFace, 'シンクロ素材')){
            /* S03-U110: シンクロ素材として墓地へ送られる場合も置換される（墓地へ送られた時の誘発は起きない）。 */
          }else{
            pushZone(dst.grave,c); const put=graveLastIsS03(dst.grave, c); if(put) put.graveInfo={turn:gs.turn,from:'mz',reason:'synchroMaterial',lv:sentLv,face:sentFace,attrS03:sentAttrS03,ctrlS03:a.player};
            (gs.deferredEvents||(gs.deferredEvents=[])).push({eventName:'onSendToGrave',evt:{player:owner,uid:ensureCardUid(gs,c),reason:'synchroMaterial',kind:'synchro',summonUid:exCard.uid}});
          }
        });
        gs.pendingExV2.synMaterialSnapshot=snapMats;
      }
      logIt(gs,`${cardName(exCard)} の${a.kind==='synchro'?'シンクロ':'エクシーズ'}召喚を試行`);
      break;
    }

    case "EX_SUMMON_COMMIT_V42": {
      const q=gs.pendingExV2; if(!q) break;
      const Q=gs.players[q.player],ex=q.exCard;
      if(q.kind==='xyz') ex.xyz=(q.materialCards||[]).map(c=>reset(c)).filter(Boolean);
      if(q.kind==='synchro') ex.v380SummonMaterials=(q.synMaterialSnapshot||[]).map(x=>Object.assign({},x));
      ex.face='up'; ex.pos=q.pos||'atk'; ex.specialSummoned=true; ex.specialSummonedFrom='ex'; ex.specialSummonKind=q.kind; Q.mz.push(ex); ensureCardUid(gs,ex); ex.properlySummonedS03=true;   /* S03-U127 */
      Q.ssHistory.push({name:cardName(ex),from:'ex',turn:gs.turn,lv:curLV(ex),kind:ex.specialSummonKind});
      gs.pendingExV2=null;
      gs.timingWindow={kind:'summon',turn:gs.turn,action:'EX_SUMMON_COMMIT_V42'};
      {const itemU14={eventName:'onSpecialSummon',evt:{player:q.player,name:cardName(ex),uid:ex.uid,kind:q.kind}};(gs.deferredEvents||(gs.deferredEvents=[])).push(itemU14);/* S03-U14 */if(typeof applySummonCountersS03==='function')applySummonCountersS03(gs,itemU14);}
      logIt(gs,`<b>${q.kind==='synchro'?'シンクロ召喚':'エクシーズ召喚'}成功</b>：${cardName(ex)}`);
      break;
    }

    case "EX_SUMMON_CANCEL_V42": {
      const q=gs.pendingExV2; if(!q) break;
      // X素材候補は召喚無効で墓地へ。シンクロ素材はPREPARE時点で既に墓地へ送られている。
      (q.materialCards||[]).forEach(c=>{ const owner=cardOwnerIndex(gs,c,q.player); pushZone(gs.players[owner].grave,c); });
      const owner=cardOwnerIndex(gs,q.exCard,q.player); pushZone(gs.players[owner].grave,q.exCard);
      logIt(gs,`${cardName(q.exCard)} の${q.kind==='synchro'?'シンクロ':'エクシーズ'}召喚は無効`);
      gs.pendingExV2=null;
      break;
    }

    /* EXデッキから特殊召喚し、素材を処理する
       a:{player, exIndex, materials:[mzIndex...], kind:'synchro'|'xyz'|'fusion', pos} */
    case "FX_EX_SUMMON": {
      const exCard = P.ex[a.exIndex];
      if(!exCard){ break; }
      if(P.mz.length - a.materials.length >= ZONE_LIMITS.mz){
        logIt(gs, `モンスターゾーンが足りません`); break;
      }
      const db = CARD_DB[exCard.id]||{};
      // 素材を場から取り除く（大きい添字から消してズレを防ぐ）
      const mats = a.materials.slice().sort((x,y)=>y-x);
      const matCards = [];
      mats.forEach(mi=>{
        const c = P.mz.splice(mi,1)[0];
        if(c) matCards.push(c);
      });
      const matNames = matCards.map(c=>cardName(c)).reverse();
      /* S03-U147: the attribute of each material, taken with the name / level (A・ジェネクス・トライフォース) */
      const matAttrS03 = new Map(matCards.map(c=>[c, (typeof currentAttributeV17==='function')?currentAttributeV17(c):(dbOf(c).at||null)]));
      // EXデッキから取り出して場へ
      P.ex.splice(a.exIndex,1);
      exCard.face = 'up';
      exCard.pos  = a.pos || 'atk'; exCard.specialSummoned=true; exCard.specialSummonedFrom='ex'; exCard.specialSummonKind=a.kind||'effect'; if(a.kind==='fusion'||a.kind==='synchro'||a.kind==='xyz') exCard.properlySummonedS03=true;   /* S03-U127 */
      exCard.specialSummonedFromPlayer = a.player;
      if(a.kind === 'xyz'){
        // エクシーズは素材をカードの下に重ねる
        exCard.xyz = matCards.map(c=>reset(c));
      } else {
        // シンクロ・融合は素材を墓地へ。場を離れたら除外されるカードは中央置換。
        matCards.forEach(c=>{
          const owner=cardOwnerIndex(gs,c,a.player), dst=gs.players[owner];
          if(v350BanishWhenLeavesField(c,'mz','grave')) pushZone(dst.banish,c);
          else if(s03DeckTopReplaceGraveU110(gs, c, {p:a.player, zone:'mz', index:0}, c.face, '素材')){ /* S03-U110 */ }
          else pushZone(dst.grave,c);
        });
      }
      if(a.kind === 'synchro'){
        exCard.v380SummonMaterials = matCards.map(c=>({name:cardName(c), tuner:isTuner(dbOf(c)), lv:curLV(c), at:matAttrS03.get(c)||null}));
      }
      P.mz.push(exCard);
      P.ssHistory.push({name:cardName(exCard),from:'ex',turn:gs.turn,fromPlayer:a.player,
        lv:curLV(exCard),kind:exCard.specialSummonKind});
      const kindJa = {synchro:"シンクロ召喚", xyz:"エクシーズ召喚", fusion:"融合召喚"}[a.kind]||"特殊召喚";
      logIt(gs, `<b>${kindJa}</b>：${matNames.join(" ＋ ")} → ${cardName(exCard)}`);
      break;
    }

    /* 次回開始用のデッキ構成を記録する。進行中の盤面・手札・山札は触らない。
       a:{player, deck:[card], ex:[card], source, name} */
    case "SET_NEXT_DECK": {
      P.loadedDeckV32 = {source:String(a.source||'user'), name:String(a.name||''),
        main:(a.deck||[]).map(c=>c&&c.id).filter(x=>x!=null), ex:(a.ex||[]).map(c=>c&&c.id).filter(x=>x!=null)};
      /* S03-U114: 保存デッキの内部ID・サイド（カード名と枚数）を保持する */
      if(a.deckId) P.loadedDeckV32.deckId = String(a.deckId);
      if(Array.isArray(a.side)) P.loadedDeckV32.side = a.side.map(e=>({n:String(e&&e.n||''), q:Number(e&&e.q)||1})).filter(e=>e.n);
      logIt(gs, `${nameOf(a.player)}：次回開始デッキ ${P.loadedDeckV32.main.length}枚 / EX ${P.loadedDeckV32.ex.length}枚 選択`);
      break;
    }

    /* エクシーズ素材を1つ取り除く（効果コスト）
       a:{player, mzIndex, reason, materialIndex?, materialUid?} */
    case "FX_DETACH": {
      const c = P.mz[a.mzIndex];
      if(!c || !c.xyz || !c.xyz.length){ logIt(gs, `エクシーズ素材がありません`); break; }
      let mi = 0;
      if(a.materialUid != null){
        const byUid = c.xyz.findIndex(m=>m && m.uid === a.materialUid);
        /* S03-U114: 指定の素材が無ければ何も取り除かない（別の素材＝先頭へ黙って置き換えない） */
        if(byUid < 0){ logIt(gs, `${a.reason||"効果"}：指定されたX素材が見つからないため取り除けません`); break; }
        mi = byUid;
      } else if(Number.isInteger(a.materialIndex) && a.materialIndex >= 0 && a.materialIndex < c.xyz.length){
        mi = a.materialIndex;
      }
      const m = c.xyz.splice(mi, 1)[0];
      /* X素材は現在のコントローラーではなく、その素材カードの持ち主の墓地へ送る。 */
      const matOwner = (m.owner != null && gs.players[m.owner]) ? m.owner : a.player;
      pushZone(gs.players[matOwner].grave, m);
      logIt(gs, `${a.reason||"効果"}：${cardName(c)} の素材 ${cardName(m)} を取り除いた（残${c.xyz.length}）`);
      break;
    }

    /* ===== 追加プリミティブ ===== */

    /* System v2: 召喚無効窓へ入る時点で通常召喚権を消費する。
       召喚を神の宣告などで無効にされても召喚権は戻らない。 */
    /* S03-U125: 暗黒界の龍神 グラファ「相手の手札をランダムに1枚確認する」— 乱数はこの Action の中で引く（Replay で同じ結果）。 */
    case "HAND_DESTROY_RANDOM_S03": {   /* S03-U176 (engine/1ZX): the random card is drawn inside the Action */
      if(typeof handDestroyRandomReduceS03==='function') handDestroyRandomReduceS03(gs, a);
      break;
    }
    case "GRAPHA_PEEK_S03": {
      const H = (gs.players[a.opponent]||{}).hand||[];
      if(!H.length){ gs.graphaPeekS03 = null; break; }
      const i = (typeof duelRandomInt==='function') ? duelRandomInt(H.length, gs) : 0;
      const c = H[i]; ensureCardUid(gs, c);
      gs.graphaPeekS03 = {uid:c.uid, turn:gs.turn};
      logIt(gs, `暗黒界の龍神 グラファ：${nameOf(a.player)}が相手の手札をランダムに1枚確認 — ${cardName(c)}`);
      break;
    }
    /* S03-U240: 「宝玉獣」を永続魔法カード扱いとして魔法＆罠ゾーンに置く（engine/1ZZH_crystal_beast_s03.js） */
    case "FX_PLACE_SPELL_S03": {
      if(typeof placeAsSpellReduceS03==='function') placeAsSpellReduceS03(gs, P, a);
      break;
    }
    /* S03-U119: デュアルモンスターのもう1度召喚が成立（engine/1ZI_gemini_s03.js）。召喚したターンとして扱う。 */
    case "GEMINI_SUMMON_S03": {
      const card=zoneCard(P,a.zone,a.index); if(!card) break;
      if(a.uid!=null && card.uid!==a.uid) break;
      card.dualUp=true; card.summonedTurn=gs.turn; if(P.temporaryFlags) P.temporaryFlags.summonedThisTurnS03 = true;   /* S03-U129 */
      logIt(gs, `もう1度召喚成功：${cardName(card)} は効果モンスターとして扱われる`);
      break;
    }
    case "NORMAL_SUMMON_ATTEMPT": {
      /* S03-U274: an extra right granted by a face-up continuous source (グルナード) — once per turn per source card */
      if(a.extraNormalKey && String(a.extraNormalKey).indexOf('src:')===0){
        const uk=String(a.extraNormalKey).slice(4)+'XnUsedS03';
        if(P.temporaryFlags[uk]){ logIt(gs, `追加の通常召喚権がありません`); break; }
        P.temporaryFlags[uk]=true;
        logIt(gs, `${a.name||"モンスター"} の追加通常召喚を試行`);
        break;
      }
      if(a.extraNormalKey){
        const n=Number(P.temporaryFlags[a.extraNormalKey]||0);
        if(n<=0){ logIt(gs, `追加の通常召喚権がありません`); break; }
        P.temporaryFlags[a.extraNormalKey]=n-1;
        logIt(gs, `${a.name||"モンスター"} の追加通常召喚を試行`);
        break;
      }
      if(!consumeNormalRightS03(P)){ logIt(gs, `このターンは既に通常召喚しています`); break; }   /* S03-U274: 二重召喚 */
      logIt(gs, `${a.name||"モンスター"} の通常召喚を試行`);
      break;
    }

    /* 通常召喚。prepaid=true は召喚試行時に召喚権を消費済み。 */
    case "NORMAL_SUMMON": {
      if(!a.prepaid && !normalRightFreeS03(P)){ logIt(gs, `このターンは既に通常召喚しています`); break; }   /* S03-U274 */
      if(P.mz.length >= ZONE_LIMITS.mz){ logIt(gs, `モンスターゾーンが一杯です`); break; }
      const card = removeFrom(P, "hand", a.handIndex);
      if(!card) break;
      card.face='up'; card.pos='atk'; card.attacked=false;
      if(P.temporaryFlags) P.temporaryFlags.normalSummonSuccessS03 = true;   /* S03-U266: 「自分がモンスターの召喚に成功したターン」 (Normal / Tribute Summon only) */
      card.summonedTurn = gs.turn; if(P.temporaryFlags) P.temporaryFlags.summonedThisTurnS03 = true;   /* S03-U129: このターン召喚した記録（スケープ・ゴート等） */
      card.tributeCount = a.tributes || 0;          // 実際にリリースしたカード枚数
      card.tributeValue = a.tributeValue != null ? a.tributeValue : (a.tributes || 0); // 2体分効果を含む価値
      if(a.summonMethod) card.normalSummonMethod=a.summonMethod;
      /* P3: 召喚provenance。既存フィールドは触らず、非空のときだけ付ける。
         素材側にも usedAsMaterial を残し、素材自身が誘発するカードが辿れるようにする。 */
      applySummonProvenanceP3(gs, card, a, 'normal');
      P.mz.push(card);
      if(a.summonMethod && typeof applyNormalSummonMethod==='function')
        applyNormalSummonMethod(card, dbOf(card), a.player, a.summonMethod, 'summon');
      if(!a.prepaid) consumeNormalRightS03(P);   /* S03-U274 */
      /* S03-U191: 「このカードが召喚に成功したターン、自分は通常召喚に加えて1度だけ…召喚する事ができる」 (極星霊ドヴェルグ) is not an activated
         effect — granted with the summon (once per turn), read by extraNormalSummonKeyV370. */
      { const gk=(CARD_SCRIPTS[cardName(card)]||{}).grantExtraNormalOnSummonS03;
        if(gk && P.temporaryFlags && !P.temporaryFlags[gk+'GrantedS03']){ P.temporaryFlags[gk]=1; P.temporaryFlags[gk+'GrantedS03']=true; } }
      logIt(gs, `<b>通常召喚成功</b>：${cardName(card)}（攻撃表示）`);
      break;
    }

    /* セット（モンスター）。召喚権を消費。a:{player, handIndex} */
    case "SET_MONSTER": {
      /* S03-U266: 「このターン相手プレイヤーはフィールド上にカードをセットする事ができない」 (サーチライトメン) — a turn stamp on the banned player */
      if(P.temporaryFlags && Number(P.temporaryFlags.noSetS03)===Number(gs.turn)){ logIt(gs, `このターンはカードをセットできません`); break; }
      if(!normalRightFreeS03(P)){ logIt(gs, `このターンは既に通常召喚しています`); break; }   /* S03-U274 */
      if(P.mz.length >= ZONE_LIMITS.mz){ logIt(gs, `モンスターゾーンが一杯です`); break; }
      const card = removeFrom(P, "hand", a.handIndex);
      if(!card) break;
      card.face='down'; card.pos='def'; card.attacked=false;
      card.setTurn = gs.turn;
      card.tributeCount = a.tributes || 0;          // 実際にリリースしたカード枚数
      card.tributeValue = a.tributeValue != null ? a.tributeValue : (a.tributes || 0);
      if(a.summonMethod) card.normalSummonMethod=a.summonMethod;
      /* P3: セットは召喚ではない。アドバンスセットのためのリリースは
         「アドバンス召喚のためのリリース」ではないので summonProvenance も
         usedAsMaterial も付けない。リリース自体は
         moveProvenance{reason:'tribute'} 側に残る。 */
      P.mz.push(card);
      if(a.summonMethod && typeof applyNormalSummonMethod==='function')
        applyNormalSummonMethod(card, dbOf(card), a.player, a.summonMethod, 'set');
      consumeNormalRightS03(P);   /* S03-U274 */
      /* S03-U194: 聖なる輝き 「モンスターをセットする場合は表側守備表示にしなければならない」 — decided by the caller (mustSetFaceUp) and stamped
         on the Action; still a set, not a summon */
      if(a.faceUpSetS03){ card.face='up'; card.pos='def'; logIt(gs, `セット：モンスターを表側守備表示で置いた（聖なる輝き）`); break; }
      logIt(gs, `セット：モンスターを裏側守備表示で置いた`);
      break;
    }

    /* セット（魔法・罠）。a:{player, handIndex, toField} */
    case "SET_ST": {
      if(P.temporaryFlags && Number(P.temporaryFlags.noSetS03)===Number(gs.turn)){ logIt(gs, `このターンはカードをセットできません`); break; }   /* S03-U266 */
      const zone = a.toField ? "field" : "sz";
      if(zone==="sz" && P.sz.length >= ZONE_LIMITS.sz){ logIt(gs, `魔法・罠ゾーンが一杯です`); break; }
      if(zone==="field" && P.field){ logIt(gs, `フィールドゾーンが埋まっています`); break; }
      const card = removeFrom(P, "hand", a.handIndex);
      if(!card) break;
      card.face='down'; card.pos='atk';
      card.setTurn = gs.turn;          // 罠はセットしたターンには発動できない
      if(zone==="field") P.field = card; else P.sz.push(card);
      logIt(gs, `セット：カードを伏せた`);
      break;
    }

    /* デッキへ戻す。a:{player, zone, index, toBottom}
       元々EXデッキのモンスターはメインデッキへ混ざらず、持ち主のEXデッキへ戻す。 */
    case "FX_RETURN_DECK": {
      const card = removeFrom(P, a.zone, a.index);
      if(!card) break;
      dropXyzMaterials(P, card, gs); dropEquips(P, card, gs, a.zone==='mz' ? 'deck' : null);   /* S03-U183: 闘器 */
      if(card.token){ logIt(gs, `${cardName(card)} は消滅した`); break; }
      if(v350BanishWhenLeavesField(card,a.zone,'deck',a)){
        const owner=cardOwnerIndex(gs,card,a.player); pushZone(gs.players[owner].banish,card);
        logIt(gs, `${a.reason||"効果"}：${cardName(card)} はデッキへ戻らず除外`); break;
      }
      const ret = returnToOwnerDeckOrExtra(gs, card, a.player, !!a.toBottom);
      if(ret.zone==='ex'){
        /* S03-U179: 「この効果によってこのカードがエクストラデッキに戻った時」 — the End Phase return marks the card (engine/1ZW) */
        if(a.epReturnS03) card.epReturnedS03 = gs.turn;
        logIt(gs, `${a.reason||"効果"}：${cardName(card)} は ${nameOf(ret.owner)} のEXデッキに戻った`);
      }else{
        logIt(gs, `${a.reason||"効果"}：${cardName(card)} を ${nameOf(ret.owner)} のデッキ${a.toBottom?"ボトム":"トップ"}へ`);
      }
      break;
    }

    /* 無効化フラグを立てる（裁定はプレイヤーが行う。アプリは状態を保持する）
       a:{player, zone, index, reason} */
    case "FX_NEGATE": {
      const card = zoneCard(P, a.zone, a.index);
      if(!card) break;
      card.negated = true;
      // System v2.3: バルバロス等の召喚方法で変化した元々の数値は、
      // 効果が無効になった時点で適用が失われ、無効が解けても自動では戻らない。
      if(card.procedureBaseStats && card.procedureBaseStats.loseOnNegate){
        delete card.procedureBaseStats;
        logIt(gs, `${cardName(card)}：召喚方法による元々の数値変更の適用が終了`);
      }
      logIt(gs, `${a.reason||"効果"}：${cardName(card)} の効果を無効化`);
      break;
    }

    /* エクシーズ素材として重ねる。a:{player, targetMz, from, fromIndex} */
    case "FX_OVERLAY": {
      const target = P.mz[a.targetMz];
      if(!target){ logIt(gs, `重ねる先が見つかりません`); break; }
      const card = removeFrom(P, a.from, a.fromIndex);
      if(!card) break;
      target.xyz = target.xyz || [];
      if(card.token){ logIt(gs, `トークンはエクシーズ素材にできません`); break; }
      pushZone(target.xyz, card);
      logIt(gs, `${cardName(card)} を ${cardName(target)} の素材として重ねた`);
      break;
    }

    /* 優先権の移動。a:{to} */
    case "SET_PRIORITY":
      gs.priority = a.to;
      logIt(gs, `優先権：${nameOf(a.to)}`);
      break;

    /* 発動待ち効果の登録／消化。a:{player, name, note} */
    case "PENDING_ADD":
      gs.pending.push({player:a.player, name:a.name, note:a.note||""});
      logIt(gs, `発動待ち：${a.name}（${nameOf(a.player)}）`);
      break;
    case "PENDING_RESOLVE": {
      const item = gs.pending.splice(a.index,1)[0];
      if(item) logIt(gs, `発動待ちを処理：${item.name}`);
      break;
    }
    case "PENDING_CLEAR":
      gs.pending = [];
      logIt(gs, `発動待ちをクリア`);
      break;

    /* 予約効果（このターンのエンドフェイズに戻す等）。a:{player, name, at, note} */
    case "RESERVE_ADD":
      gs.reserved.push({
        player:a.player, name:a.name, at:a.at||"endPhase", turn:gs.turn, note:a.note||"",
        kind:a.kind||null, uids:Array.isArray(a.uids)?a.uids.slice():[], data:a.data||null,
        /* System v3.8.0: 予約破壊の個別期限フラグ名も状態へ保存する。
           v3.4.0ではAPIから渡してもRESERVE_ADDで落ち、荒行のEnd破壊が実行されなかった。 */
        flagKey:a.flagKey||null
      });
      logIt(gs, `予約：${a.name}（${a.at==="endPhase"?"エンドフェイズ":a.at}）`);
      break;
    case "RESERVE_REMOVE": {
      const r = gs.reserved.splice(a.index,1)[0];
      if(r) logIt(gs, `予約を解除：${r.name}`);
      break;
    }

    /* 攻撃済みフラグ操作（1ターン1回制限の管理）。a:{player, mzIndex, value} */
    case "SET_ATTACKED": {
      const c = P.mz[a.mzIndex];
      if(c){ c.attacked=!!a.value; c.attackCount=a.value?Math.max(1,Number(c.attackCount)||0):0; }
      break;
    }

    /* ===== カウンター（魔力カウンター等）=====
       カードに任意名のカウンターを乗せる。a:{player, zone, index, kind, n} */
    case "COUNTER_ADD": {
      const card = zoneCard(P, a.zone, a.index);
      if(!card) break;
      const kind = a.kind || "魔力";
      /* System v22: 宣言された設置上限を超えては置かない。
         宣言が無ければ従来通り上限なし。 */
      let addN = a.n||1;
      if(typeof counterRoomV22==='function') addN = counterRoomV22(card, kind, addN);
      if(addN<=0){ logIt(gs, `${cardName(card)} にはこれ以上${kind}カウンターを置けない`); break; }
      card.counters = card.counters || {};
      card.counters[kind] = (card.counters[kind]||0) + addN;
      logIt(gs, `${cardName(card)} に${kind}カウンターを${addN}つ置いた（計${card.counters[kind]}）`);
      if(typeof emitCounterEventV22==='function')
        emitCounterEventV22(gs, 'onCounterPlaced', {player:a.player, uid:ensureCardUid(gs,card),
          kind, n:addN, total:card.counters[kind]});
      break;
    }
    case "COUNTER_REMOVE": {
      const card = zoneCard(P, a.zone, a.index);
      if(!card || !card.counters) break;
      const kind = a.kind || "魔力";
      const cur = card.counters[kind]||0;
      const take = Math.min(cur, a.n||1);
      card.counters[kind] = cur - take;
      if(card.counters[kind]<=0) delete card.counters[kind];
      logIt(gs, `${cardName(card)} から${kind}カウンターを${take}つ取り除いた（残${card.counters[kind]||0}）`);
      if(take>0 && typeof emitCounterEventV22==='function')
        emitCounterEventV22(gs, 'onCounterRemoved', {player:a.player, uid:ensureCardUid(gs,card),
          kind, n:take, total:card.counters[kind]||0});
      break;
    }
    case "COUNTER_CLEAR": {
      const card = zoneCard(P, a.zone, a.index);
      if(!card) break;
      delete card.counters;
      logIt(gs, `${cardName(card)} のカウンターを全て取り除いた`);
      break;
    }

    /* ===== System v20: 公開とデッキ操作 =====
       確認（inspect）は state を変えないので Action にしない。
       公開だけが直列化可能な記録として残る。 */
    /* ===== System v22: 複数カードにまたがるカウンター操作 =====
       選ばれた並びを1つの Action で適用する。 */
    case "COUNTER_SPREAD_REMOVE_V22": {
      if(typeof removeCounterUnitsV22!=='function') break;
      removeCounterUnitsV22(gs, a.uids||[], a.kind, a.reason);
      break;
    }
    case "COUNTER_SPREAD_PLACE_V22": {
      if(typeof placeCounterUnitsV22!=='function') break;
      placeCounterUnitsV22(gs, a.uids||[], a.kind, a.reason);
      break;
    }

    /* ===== System v21: 破壊耐性の一時付与 ===== */
    case "PROT_GRANT_V21": {
      if(typeof makeProtGrantV21!=='function') break;
      const card = zoneCard(P, a.zone, a.index);
      if(!card) break;
      const g = makeProtGrantV21(Object.assign({}, a.grant||{}, {turn:gs.turn}));
      if(!card.protV21) card.protV21 = [];
      card.protV21.push(g);
      logIt(gs, `${g.label||"効果"}：${cardName(card)} は破壊されなくなった`);
      break;
    }
    case "PROT_CLEAR_V21": {
      const card = zoneCard(P, a.zone, a.index);
      if(!card || !Array.isArray(card.protV21)) break;
      card.protV21 = a.key ? card.protV21.filter(g=>g&&g.key!==a.key) : [];
      if(!card.protV21.length) delete card.protV21;
      break;
    }

    case "REVEAL_ADD_V20": {
      if(typeof makeRevealV20!=='function') break;
      const rec = makeRevealV20(Object.assign({}, a.rec||{}, {turn:gs.turn}));
      if(!gs.revealV20) gs.revealV20 = [];
      rec.id = (a.rec&&a.rec.id!=null) ? a.rec.id : (++gs.uidSeq);
      gs.revealV20.push(rec);
      logIt(gs, `${rec.label||"効果"}：${nameOf(rec.player)}は${rec.zone?rec.zone==='hand'?"手札":rec.zone:`カード${rec.uids.length}枚`}を公開した`);
      break;
    }
    case "REVEAL_REMOVE_V20": {
      if(!Array.isArray(gs.revealV20)) break;
      gs.revealV20 = gs.revealV20.filter(r=>r && r.id!==a.id);
      if(!gs.revealV20.length) delete gs.revealV20;
      break;
    }
    /* 「好きな順番でデッキの上に戻す」を 1 Action で行う。 */
    case "DECK_ORDER_V20": {
      if(typeof applyDeckOrderV20!=='function') break;
      const n = applyDeckOrderV20(gs, a.player, a.uids, !!a.toBottom);
      if(n) logIt(gs, `${a.reason||"効果"}：${nameOf(a.player)}のデッキ${a.toBottom?"ボトム":"トップ"}へ${n}枚を順番を指定して戻した`);
      break;
    }
    /* 裏側守備表示モンスターだけを決定論的にシャッフルする。 */
    case "FACEDOWN_SHUFFLE_V20": {
      if(typeof shuffleFaceDownV20!=='function') break;
      const n = shuffleFaceDownV20(gs, a.player);
      if(n) logIt(gs, `${a.reason||"効果"}：${nameOf(a.player)}の裏側守備表示モンスター${n}体をシャッフルした`);
      break;
    }

    /* ===== トークン =====
       トークンは CARD_DB に無い仮想カード。tokenDef を直接持つ。
       a:{player, name, atk, def, lv, ra, at, pos, n} */
    case "TOKEN_CREATE": {
      const n = a.n || 1;
      /* System v11: トークンにも uid と持ち主・コントローラーを付ける。
         「そのトークンが破壊された時」を後から指すために必要。 */
      const madeUids = [];
      for(let i=0;i<n;i++){
        if(P.mz.length >= ZONE_LIMITS.mz){ logIt(gs, `モンスターゾーンが一杯です`); break; }
        const t = {
          id: -1,                       // DBに存在しない印
          token: {
            n: a.name || "トークン",
            k: 'm', atk: a.atk||0, def: a.def||0, lv: a.lv||1,
            ra: a.ra||"", at: a.at||"", st:["トークン"], c: null
          },
          owner: a.player, controller: a.player,
          face:'up', pos: a.pos||'atk', attacked:false, specialSummoned:true
        };
        gs.tokenSeq = (Number(gs.tokenSeq)||0) + 1;
        t.tokenV11 = {key: a.key || a.name || "トークン", seq: gs.tokenSeq};
        if(a.sourceUid != null) t.tokenV11.sourceUid = a.sourceUid;
        if(a.copiedFromUid != null) t.tokenV11.copiedFromUid = a.copiedFromUid;
        if(a.noAdvanceTributeS03) t.noAdvanceTributeS03 = true;   /* S03-U129: アドバンス召喚のためにはリリースできない */
        if(a.noAdvanceTributeNonDarkS03) t.noAdvanceTributeNonDarkS03 = true;
        if(Number(a.destroyDamageS03) > 0) t.destroyDamageS03 = Number(a.destroyDamageS03);   /* S03-U195: おジャマトークン */   /* S03-U188: 闇属性以外のアドバンス召喚のためにはリリースできない */
        P.mz.push(t);
        ensureCardUid(gs, t);
        madeUids.push(t.uid);
      }
      gs.lastTokenV11 = {key:a.key||a.name||"トークン", player:a.player,
        sourceUid:(a.sourceUid!=null)?a.sourceUid:null,
        requested:n, created:madeUids.length, uids:madeUids};
      if(madeUids.length && typeof queueDeferredEventV2==='function'
         && typeof PLAY_MODE!=='undefined' && PLAY_MODE===PLAY_MODES.DUEL){
        queueDeferredEventV2('onTokenSummon', makeTokenSummonEventV11(gs.lastTokenV11));
      }
      logIt(gs, `<b>${a.name||"トークン"}</b> を${madeUids.length}体特殊召喚（攻${a.atk||0}/守${a.def||0}）`);
      break;
    }


    /* ===== 攻守の増減（継続効果）=====
       EDOPro の EFFECT_UPDATE_ATTACK 相当。
       card.mods に修正値を積み、期間が来たら自動で消える。
       a:{player, zone, index, atk, def, until, label} */
    case "MOD_ADD": {
      const card = zoneCard(P, a.zone, a.index);
      if(!card) break;
      card.mods = card.mods || [];
      card.mods.push({
        atk: a.atk||0, def: a.def||0,
        until: a.until || 'endTurn',      // endTurn / endPhase / permanent
        label: a.label || '効果',
        turn: gs.turn
      });
      const parts=[];
      if(a.atk) parts.push(`攻${a.atk>0?'+':''}${a.atk}`);
      if(a.def) parts.push(`守${a.def>0?'+':''}${a.def}`);
      logIt(gs, `${a.label||'効果'}：${cardName(card)} ${parts.join(' ')}（${modUntilJp(a.until||'endTurn')}）`);
      break;
    }
    /* 攻守を特定の値にする（半分にする・0にする等） */
    case "MOD_SET": {
      const card = zoneCard(P, a.zone, a.index);
      if(!card) break;
      const db = dbOf(card);
      card.mods = card.mods || [];
      if(a.atk!=null) card.mods.push({atk:a.atk-(db.atk||0), def:0, until:a.until||'endTurn', label:a.label||'効果', turn:gs.turn});
      if(a.def!=null) card.mods.push({atk:0, def:a.def-(db.def||0), until:a.until||'endTurn', label:a.label||'効果', turn:gs.turn});
      logIt(gs, `${a.label||'効果'}：${cardName(card)} を攻${a.atk??'—'}/守${a.def??'—'}に`);
      break;
    }
    case "MOD_CLEAR": {
      const card = zoneCard(P, a.zone, a.index);
      if(!card) break;
      delete card.mods;
      logIt(gs, `${cardName(card)} の攻守修正を解除`);
      break;
    }


    /* ===== 装備魔法（どのモンスターに装備しているかを保持） =====
       a:{player, szIndex, targetP, targetMz} */
    case "FX_EQUIP": {
      const eq = P.sz[a.szIndex];
      if(!eq){ break; }
      const T = gs.players[a.targetP];
      const mon = T.mz[a.targetMz];
      if(!mon){ logIt(gs, `装備先が見つかりません`); break; }
      // 循環参照を作らないよう、カード実体ではなく識別子で結ぶ
      eq.equipUid = eq.equipUid || (++gs.uidSeq);
      mon.uid = mon.uid || (++gs.uidSeq);
      eq.equipTo = { p:a.targetP, uid:mon.uid };
      mon.equippedBy = mon.equippedBy || [];
      if(mon.equippedBy.indexOf(eq.equipUid)<0) mon.equippedBy.push(eq.equipUid);
      logIt(gs, `${cardName(eq)} を ${cardName(mon)} に装備`);
      /* System v15: 装備された事を知らせる中央イベント。 */
      if(typeof v15EmitEquipEvent==='function')
        v15EmitEquipEvent(gs,'onEquipAttached',
          {equipUid:eq.equipUid, uid:mon.uid, player:a.player, targetPlayer:a.targetP});
      break;
    }
    /* 装備を外す（装備モンスターが場を離れた時など） */
    /* System v4.6: モンスターを装備カード扱いでS/Tゾーンへ移す。
       《ヴァイロン・ディシグマ》等。カード実体とownerを維持する。
       a:{player, fromPlayer, fromIndex, targetPlayer, targetMz, reason} */
    case "FX_MONSTER_EQUIP_V46": {
      if(P.sz.length>=ZONE_LIMITS.sz){ logIt(gs,'魔法・罠ゾーンが一杯です'); break; }
      const FP=gs.players[a.fromPlayer], TP=gs.players[a.targetPlayer==null?a.player:a.targetPlayer], mon=TP&&TP.mz[a.targetMz];
      const eq=FP&&FP.mz[a.fromIndex];
      if(!eq||!mon){ logIt(gs,'装備するモンスターまたは装備先が見つかりません'); break; }
      if(eq===mon){ logIt(gs,'自身を装備カードにはできません'); break; }
      ensureCardUid(gs,eq); ensureCardUid(gs,mon);
      FP.mz.splice(a.fromIndex,1);
      dropXyzMaterials(FP,eq,gs); dropEquips(FP,eq,gs);
      if(eq.owner==null) eq.owner=a.fromPlayer;
      eq.controller=a.player; eq.face='up'; eq.pos='atk';
      eq.v46MonsterEquip=true; eq.equipUid=eq.equipUid||eq.uid;
      eq.equipTo={p:(a.targetPlayer==null?a.player:a.targetPlayer),uid:mon.uid};
      mon.equippedBy=mon.equippedBy||[];
      if(!mon.equippedBy.includes(eq.equipUid)) mon.equippedBy.push(eq.equipUid);
      P.sz.push(eq);
      logIt(gs,`${a.reason||'効果'}：${cardName(eq)} を ${cardName(mon)} に装備`);
      break;
    }

    case "FX_UNEQUIP": {
      const eq = P.sz[a.szIndex];
      if(!eq) break;
      if(eq.equipTo){
        const T = gs.players[eq.equipTo.p];
        const mon = (T.mz||[]).find(m=>m && m.uid===eq.equipTo.uid);
        if(mon && mon.equippedBy) mon.equippedBy = mon.equippedBy.filter(u=>u!==eq.equipUid);
      }
      const goneUid_=eq.equipUid, goneMon_=eq.equipTo?eq.equipTo.uid:null,
            goneP_=eq.equipTo?eq.equipTo.p:null;
      delete eq.equipTo;
      delete eq.v46MonsterEquip;
      delete eq.equipUid;
      logIt(gs, `${cardName(eq)} の装備を解除`);
      /* System v15 */
      if(typeof v15EmitEquipEvent==='function')
        v15EmitEquipEvent(gs,'onEquipDetached',
          {equipUid:goneUid_, uid:goneMon_, player:a.player, targetPlayer:goneP_});
      break;
    }

    /* ===== 儀式召喚 =====
       a:{player, handIndex, tributes:[{p,zone,index}], pos} */
    case "FX_RITUAL_SUMMON": {
      /* System v5: 素材は uid で指定する（materialRefs）。配列 index は
         Replay 中に他の処理でずれ得るため authority にしない。
         旧来の tributes(index) 指定も互換のため残す。 */
      const useRefs = Array.isArray(a.materialRefs) && a.materialRefs.length;
      const refHits = useRefs
        ? a.materialRefs.map(u=>findCardByUidInState(gs,u)).filter(h=>h && (h.zone==='hand'||h.zone==='mz'))
        : null;
      if(useRefs && refHits.length !== a.materialRefs.length){
        logIt(gs, `儀式召喚：素材が揃っていません`); break;
      }
      const onField = useRefs ? refHits.filter(h=>h.zone==='mz').length
                              : (a.tributes||[]).filter(t=>t.zone==='mz').length;
      if(P.mz.length - onField >= ZONE_LIMITS.mz){
        logIt(gs, `モンスターゾーンが足りません`); break;
      }
      /* 儀式モンスター本体も uid で引く。手札に無ければ何もしない
         （素材だけ払って召喚できない二重支払いを防ぐ）。 */
      let hIdx = a.handIndex;
      if(a.monsterUid != null){
        const mh = findCardByUidInState(gs, a.monsterUid);
        if(!mh || mh.p !== a.player || mh.zone !== 'hand'){
          logIt(gs, `儀式召喚：儀式モンスターが手札にありません`); break;
        }
        hIdx = mh.index;
      }
      // リリースを先に処理（後ろから消して添字ズレを防ぐ）
      const trs = (useRefs ? refHits.map(h=>({p:h.p, zone:h.zone, index:h.index}))
                           : (a.tributes||[]).slice()).sort((x,y)=>y.index-x.index);
      const names=[];
      trs.forEach(t=>{
        const TP = gs.players[t.p];
        const arr = t.zone==='hand' ? TP.hand : TP.mz;
        const c = arr.splice(t.index,1)[0];
        if(c){ names.push(cardName(c)); dropXyzMaterials(TP, c, gs);
          /* S03-U110: 場の表側クリスティアを儀式のリリースにした場合もデッキの一番上へ置換。 */
          if(!(t.zone!=='hand' && s03DeckTopReplaceGraveU110(gs, c, {p:t.p, zone:'mz', index:t.index}, c.face, 'リリース'))){ pushZone(TP.grave, c);
            /* S03-U235: a Ritual Summon's release (「リリースされた場合」) */
            const putR = graveLastIsS03(TP.grave, c); if(putR) putR.graveInfo = {turn:gs.turn, from:t.zone, byDestroy:false, releasedS03:true}; } }
      });
      const card = removeFrom(P, "hand", hIdx);
      if(!card) break;
      card.face='up'; card.pos=a.pos||'atk'; card.attacked=false; card.specialSummoned=true; card.properlySummonedS03=true;   /* S03-U127 */
      /* P3: 儀式召喚の provenance。素材の identity と snapshot を残す。 */
      applySummonProvenanceP3(gs, card, a, 'ritual');
      P.mz.push(card);
      P.ssHistory.push({name:cardName(card), from:'ritual', turn:gs.turn, lv:curLV(card), kind:'ritual'});
      logIt(gs, `<b>儀式召喚</b>：${names.join('・')} をリリースして ${cardName(card)} を特殊召喚`);
      break;
    }

    /* ===== デッキ切れ判定 ===== */
    case "CHECK_DECKOUT": {
      const who = a.player;
      if(gs.players[who].deck.length===0){
        logIt(gs, `<b>${nameOf(who)} はデッキが0枚</b> — 次のドローで敗北します`);
      }
      break;
    }

    /* v4 Architecture: runtime effect instances are plain JSON state.
       Effect callback functions live in the registry, never inside gameState. */
    case "V4_EFFECT_REGISTER": {
      gs.runtimeEffects = Array.isArray(gs.runtimeEffects) ? gs.runtimeEffects : [];
      gs.runtimeEffectSeq = Number(gs.runtimeEffectSeq||0);
      const e = Object.assign({}, a.effect||{});
      e.rid = e.rid || (++gs.runtimeEffectSeq);
      e.createdTurn = e.createdTurn || gs.turn;
      e.active = e.active !== false;
      gs.runtimeEffects.push(e);
      break;
    }
    case "V4_EFFECT_REMOVE": {
      gs.runtimeEffects = (gs.runtimeEffects||[]).filter(e=>e && e.rid!==a.rid);
      break;
    }

    case "V4_EFFECT_RESET_S03": {
      /* S03-U39 (C-S03-30): エンドフェイズで終わる実行時効果の失効を Action として記録する。
         以前は processEndPhaseV30 が v4ResetRuntimeEffects を直接呼び、Replay では失効せず最終 digest が一致しなかった
         （R1 responder seed 0x52310007 turn 23：スターダスト・ドラゴンの帰還効果）。 */
      if(typeof v4ResetRuntimeEffects==='function') v4ResetRuntimeEffects(a.event||'endPhase',{player:a.player});
      break;
    }

    /* --- System v4.9.0 P1: ChoiceRequest ---------------------------------
       ここは純粋な状態遷移のみ。継続（解決の続き）は絶対に実行しない。
       Replay は記録済みActionを順に適用するだけなので、ここで継続を走らせると
       継続自身が出したActionと二重適用になる。継続の実行は
       answerChoiceV49 / cancelChoiceV49 側（applyActionの外）で行う。 */
    case "CHOICE_OPEN_V49": {
      if(gs.choiceSeq===undefined) gs.choiceSeq=0;
      const c=a.choice||null;
      if(!c) break;
      gs.pendingChoice=JSON.parse(JSON.stringify(c));
      gs.choiceSeq=Math.max(Number(gs.choiceSeq)||0, Number(c.cid)||0);
      logIt(gs, `選択待ち：${c.title}（${nameOf(c.player)}が${c.min===c.max?`${c.max}件`:`${c.min}〜${c.max}件`}選択）`);
      break;
    }

    case "CHOICE_ANSWER_V49": {
      const pc=gs.pendingChoice;
      if(!pc || pc.cid!==a.cid) break;
      const keys=Array.isArray(a.keys)?a.keys.map(String):[];
      const labels=keys.map(k=>{
        const cand=(pc.candidates||[]).find(x=>x.key===k);
        return cand ? (cand.hidden ? '裏側のカード' : cand.label) : k;
      });
      logIt(gs, `選択：${labels.join('・')||'なし'}`);
      gs.pendingChoice=null;
      break;
    }

    case "CHOICE_CANCEL_V49": {
      const pc=gs.pendingChoice;
      if(!pc || pc.cid!==a.cid) break;
      logIt(gs, `選択を取りやめ：${pc.title}`);
      gs.pendingChoice=null;
      break;
    }

    case "RESET":
      Object.assign(gs, newGame());
      logIt(gs, "盤面をリセット");
      break;
  }
  if(typeof reconcileEquipLinksV31==='function') reconcileEquipLinksV31(gs);
  reconcileProcedureBaseStatsActionS03(gs);
  if(typeof v4OnActionApplied==='function') v4OnActionApplied(gs,a,v4Before);
  if(typeof v42OnActionApplied==='function') v42OnActionApplied(gs,a,v4Before);
  /* System v9: フィールド離脱の検出とイベント発火。
     deferredEvents は digest に含まれるため、act() ではなく
     applyAction 側で積んで Replay と一致させる。 */
  if(typeof v9DetectLeaveField==='function') v9DetectLeaveField(gs);
  /* System v10: 表示形式変更の検出とイベント発火。v9 と同じ理由でここに置く。 */
  if(typeof v10DetectPositionChange==='function') v10DetectPositionChange(gs,a);
  /* S03-U127: 手札・デッキ・EXへ戻ったカードの「正規の方法で特殊召喚された」記録を消す */
  if(typeof sweepProperlySummonedS03==='function') sweepProperlySummonedS03(gs);
  /* S03-U279 / CODEX-C01: special wins are immediate except while one chain
     link is still resolving; SPECIAL_WIN_DEFER_S03 closes that exact boundary. */
  if(typeof specialWinCheckS03==='function') specialWinCheckS03(gs);
  return gs;
}

/* -------------------- ゾーン操作ヘルパ -------------------- */
/* System Core v2: カード個体ID。
   DBの id はカード種類IDなので、同名カードを複数積むとチェーン追跡に使えない。
   uid はデュエル中の「その1枚」を一意に識別し、Undo/保存後も維持する。 */
function ensureCardUid(gs, card){
  if(!card) return null;
  if(card.uid == null) card.uid = ++gs.uidSeq;
  else if(card.uid > gs.uidSeq) gs.uidSeq = card.uid;
  return card.uid;
}
function ensureAllCardUids(gs){
  (gs.players||[]).forEach(P=>{
    ['deck','hand','mz','sz','grave','banish','ex'].forEach(z=>(P[z]||[]).forEach(c=>ensureCardUid(gs,c)));
    if(P.field) ensureCardUid(gs,P.field);
  });
}
function findCardByUidInState(gs,uid){
  if(uid==null || !gs || !Array.isArray(gs.players)) return null;
  for(let p=0;p<2;p++){
    const P=gs.players[p]; if(!P) continue;
    for(const z of ['hand','mz','sz','grave','banish','deck','ex']){
      const arr=P[z]||[]; const i=arr.findIndex(c=>c&&c.uid===uid);
      if(i>=0) return {p,zone:z,index:i,card:arr[i],db:dbOf(arr[i])};
    }
    if(P.field && P.field.uid===uid) return {p,zone:'field',index:0,card:P.field,db:dbOf(P.field)};
  }
  return null;
}
function findCardByUid(uid){ return findCardByUidInState(gameState,uid); }
function v44ApplyCountConsume(gs,d){
  if(!gs || !d) return;
  const scope=d.scope==='duel'?'duel':'turn';
  if(d.kind==='card'){
    const h=findCardByUidInState(gs,d.uid); if(!h||!h.card) return;
    const c=h.card;
    if(scope==='duel'){ c.clDuel=(c.clDuel||0)+1; return; }
    if(c.clTurn!==gs.turn){ c.clTurn=gs.turn; c.clN=0; }
    c.clN=(c.clN||0)+1;
    return;
  }
  if(d.kind==='name'){
    const P=gs.players[d.player]; if(!P) return;
    const store=scope==='duel' ? (P.effectFlags||(P.effectFlags={})) : (P.temporaryFlags||(P.temporaryFlags={}));
    const key=String(d.key||''); if(!key) return;
    store[key]=(store[key]||0)+1;
  }
}
function cardRef(t){
  if(!t || !t.card) return null;
  return {p:t.p, zone:t.zone, index:t.index, uid:ensureCardUid(gameState,t.card)};
}
function resolveCardRef(r){
  if(!r) return null;
  const hit=findCardByUid(r.uid);
  /* 対象に取ったカードは、解決時まで同じ領域に存在している必要がある。
     墓地→場、場→墓地など領域を移動したカードは同じ物理カードでも
     その効果から見れば「以前の対象」ではない。コントロール変更だけなら
     zone は mz/sz のままなので UID で追跡できる。 */
  if(hit && hit.zone===r.zone) return hit;
  return null;
}

/* System v2.4.1 -------------------------------------------------------------
   チェーンへ積む「選択情報」は、カードそのものだけとは限らない。
   例：エアーマン {mode:'search', t:<card>}
       エネコン   {mode:'take', r:<card>, t:<card>}
       超融合     {ex:<card>, mats:[<card>, ...]}
   旧実装は selectedTargets の各要素を cardRef() に直接渡していたため、
   このような入れ子オブジェクトが null になり、優先権パス後の解決時に
   選択内容が消失していた。

   以下では任意の配列/オブジェクトを再帰的にシリアライズし、カード候補だけを
   UID+発動時ゾーンの参照へ置換する。これにより Undo/自動保存/チェーン解決を
   またいでも「効果モード＋複数カード＋素材配列」を保持できる。 */
const CHAIN_CARD_REF_V2 = '__yg1103CardRefV2';
function serializeChainSelectionV2(v){
  if(v == null || typeof v !== 'object') return v;
  if(Array.isArray(v)) return v.map(serializeChainSelectionV2);
  // API.fieldCards / pileCards 等が返すカード候補を参照化する。
  if(v.card && typeof v.zone === 'string' && v.p != null){
    const ref = cardRef(v);
    if(!ref) return null;
    const extra = {};
    Object.keys(v).forEach(k=>{
      if(k==='p'||k==='zone'||k==='index'||k==='card'||k==='db') return;
      extra[k] = serializeChainSelectionV2(v[k]);
    });
    return {[CHAIN_CARD_REF_V2]:true, ref, extra};
  }
  const out={};
  Object.keys(v).forEach(k=>{
    // db はカード参照から復元でき、巨大なのでチェーンには保存しない。
    if(k==='db' && v.card) return;
    out[k]=serializeChainSelectionV2(v[k]);
  });
  return out;
}
function deserializeChainSelectionV2(v){
  if(v == null || typeof v !== 'object') return v;
  if(Array.isArray(v)) return v.map(deserializeChainSelectionV2);
  if(v[CHAIN_CARD_REF_V2]){
    const hit=resolveCardRef(v.ref);
    if(!hit) return null;
    const extra=v.extra||{};
    Object.keys(extra).forEach(k=>{ hit[k]=deserializeChainSelectionV2(extra[k]); });
    return hit;
  }
  // v2.4以前の自動保存中チェーンとの互換：直接 cardRef の配列だった場合。
  if(v.uid != null && typeof v.zone==='string' && v.card == null &&
     Object.keys(v).every(k=>['p','zone','index','uid'].includes(k))){
    return resolveCardRef(v);
  }
  const out={};
  Object.keys(v).forEach(k=>{ out[k]=deserializeChainSelectionV2(v[k]); });
  return out;
}

function removeFrom(P, zone, idx){
  if(zone==="field"){ const c=P.field; P.field=null; return c; }
  const arr = P[zone]; if(!arr) return null;
  return arr.splice(idx,1)[0];
}
function placeInto(P, zone, card, deckPos){
  // トークンは場以外へ移動できない（消滅する）
  if(card && card.token && zone!=="mz"){ return; }
  if(zone==="field"){ P.field = card; return; }
  const arr = P[zone];
  if(zone==="deck"){
    card.face='down'; card.pos='atk';
    if(deckPos==="bottom") arr.push(card); else arr.unshift(card);
    return;
  }
  // 手札・墓地・除外は常に表向きで扱う（手札はタップせず読めるように）
  if(zone==="hand" || zone==="grave" || zone==="banish"){ card.face='up'; card.pos='atk'; }
  arr.push(card);
}
function zoneCard(P, zone, idx){ return zone==="field" ? P.field : P[zone]?.[idx]; }
/* 墓地・除外へ送る際にカードの表示状態を正規化 */
/* 場を離れるカードの状態を落とす。
   以前は新しいオブジェクトを作っていたが、それだとカードの同一性が失われ、
   「リバースしたモンスター」「持ち主」「デュエル中に1度」などを追えなくなる。
   同じオブジェクトのまま、場を離れたら消える状態だけを削る。 */
const ZONE_LOCAL_KEYS = [
  'mods','counters','xyz','equippedTo','equips','equipTo','equipUid','equippedBy','v46MonsterEquip',
  'negated','negatedUntilTurn','attacked','attackCount','attackLimit','attackLimitTurn','battleDestroyed','specialSummoned','specialSummonedFrom','specialSummonedFromPlayer','specialSummonKind',
  'cannotAttack','cannotAttackTurn','cannotTribute','lvMod',
  'clTurn','clN',                      // 「1ターンに1度」はリセットされる
  'controlReturnTo','controlReturnTurn','controller',
  'barbarosNoTribute','fusionMaterialCount','dualUp',
  'oppTargetImmuneTurnS03','fusionMaterialS03',   // S03-U130: ダーク・フュージョン / 融合召喚に使用した融合素材
  'attackAllS03',   // S03-U149: the monsters an attack-all card attacked this turn
  'u155ReturnTurn','u155CoffinTurn',   // S03-U155: 異次元からの帰還 / 封印の黄金櫃 marks
  'battledWithS03','u161ViceMarkedBy','u161ViceTargetUid','u165TempesterBy','u165TempesterUids','noSynchroMaterialTurnS03',                    // S03-U160: uids of the monsters this card battled while on the field (「このカードと戦闘を行ったモンスター」)
  'u154SwordsTurn','u154LimiterTurn',   // S03-U154: 光の護封剣 / リミッター解除 marks belong to this stay on the field
  'd4WeaponSrcUid','d4WeaponUntilTurn',   // S03-U151: ウェポンチェンジ's swap belongs to the monster's stay on the field
  'battledTurnS03','gladiatorSummonedS03',   // S03-U180 (engine/1ZZ)
  'summonSrcS03',   // S03-U238: the card whose effect special summoned it
  'asSpellS03',   // S03-U240: a monster card placed as a Continuous Spell (engine/1ZZH)
  'asMonsterDbS03','trapMonsterS03',   // S03-U248: a Trap Monster's monster data / summoned by its own activation (engine/1ZZI)
  'pierceBattleS03',   // S03-U233: 機皇兵ワイゼル・アイン's one-battle piercing grant
  'reversedS03',   // S03-U185: 「リバースした」 (engine/19 v10)
  'flippedTurnS03',   // S03-U244: the turn it was flipped face-up (engine/19)
  'directBattleDamageTurnS03',   // S03-U251: the turn it dealt battle damage by a direct attack (emitBattleDamageV6)
  'battleKillTurnS03',   // S03-U251: the turn it destroyed a monster by battle (BATTLE_CLEANUP)
  'battleKillEffectTurnS03',   // S03-U255: the turn it destroyed an effect monster by battle (BATTLE_CLEANUP)
  'flipSummonedTurnS03',   // S03-U260: the turn it was Flip Summoned (FX_SET_STATE flipSummon)
  'noPosChangeTurnS03',   // S03-U186: 「このターン表示形式を変更できない」
  'recyclerTurnS03',   // S03-U201: スクラップ・リサイクラー ② used this turn
  'jenisTurnS03',   // S03-U190: ライトロード・プリースト ジェニス resolved this turn (once per End Phase)
  'stLinkTargetS03','stLinkByS03',   // S03-U188: a continuous Trap's selected monster (デモンズ・チェーン): the trap holds the target uid, the target the trap uid
  'negLinkS03','negLinkTargetS03',   // S03-U177: a monster's 「表側表示で存在する限り、選択したモンスターの効果は無効化される」 link (engine/1ZY)
  's03SummonedByUid',   // S03-U148: 「この効果で特殊召喚した」 monster → the summoner's uid (地獄の門番イル・ブラッド / 魔族召喚師)
  'spearProof','spearProofS03','wallValue','tributeCount','tributeValue','setTurn','chainedTo','rabbitEndDestroyTurn','v340EndDestroyTurn',
  'banishWhenLeavesField','v350BureidoDrawTurn','v350ExtraNormalFrogTurn','v350OnlyAttackerUid',
  'v370FrogExtraTurn','v370TragoControlTurn','v370TragoLevelTurn','v370TragoLevelResetTurn','v380SummonMaterials','v380DirectOnlyTurn','v380DoubleEdgeTurn','v380LylaLockThroughTurn',
  // System v2.3: 通常召喚手順・発動待ち状態は場を離れたら失われる
  'normalSummonMethod','procedureBaseStats','procedureBaseStatsPending','activationPending','activationNegated',
  // P3: 由来metadataは領域ローカル。場や墓地を移ったら「今回の移動・今回の召喚」ではなくなる。
  'summonProvenance','moveProvenance','usedAsMaterial',
  // P1.1: 永続カード上の宣言も領域ローカル。場を離れたら古い宣言を消す。
  'declaration',
  // System v9: 生存リンクも領域ローカル。場を離れたカードのリンクは消える。
  'linkV9',
  // System v10: 追加の表示形式変更ウィンドウの使用済み記録も領域ローカル。
  'posWindowUsedTurnV10',
  // System v13: 効果無効も領域ローカル。場を離れたら解ける。
  'negV13',
  // System v14: 攻守修整も領域ローカル。場を離れたら消える。
  'statModsV14',
  // System v16: レベル修整も領域ローカル。
  'lvModsV16',
  // System v21: 破壊耐性の一時付与と回数記録も領域ローカル。
  'protV21','protUsedV21',
  // System v17: 特性の上書きも領域ローカル。場を離れたら印刷情報に戻る。
  'charV17',
  // System v6: 戦闘許可（直接攻撃・全体攻撃・攻撃対象固定）も領域ローカル。
  'battlePermission',
  'v46StardustReturnTurn','v46TempesterAddTurn','v46DisigmaAbsorbTurn','v46ScrapTwinTurn',
  'v47ZenmaisterTurn','v47ArmoryTurn','v47AfdSpecialTurn','v47AfdFieldTurn',
];
/* System v3.5.0: 場を離れたら除外される残存効果を中央管理する。 */
/* S03-U162: 「このカードは相手のカードの効果によってフィールド上から離れた場合、ゲームから除外される」 (マイン・モール).
   Declared by the card script (banishIfLeavesByOpponentEffectS03). The cause is the move action's P3 stamp (a.p3: reason 'effect',
   actingPlayer = the effect's controller), written when the action is committed and replayed with it; the controller whose field
   the card leaves is a.player. Battle, costs and materials are not 「効果によって」. */
function banishWhenLeavesByOpponentEffectS03(card,fromZone,toZone,a){
  if(!card || !a || !a.p3 || a.p3.reason!=='effect') return false;
  if(!['mz','sz','field'].includes(fromZone) || ['mz','sz','field'].includes(toZone)) return false;
  const sc = (typeof CARD_SCRIPTS!=='undefined') ? CARD_SCRIPTS[cardName(card)] : null;
  if(!sc || !sc.banishIfLeavesByOpponentEffectS03) return false;
  if(card.face==='down' && fromZone==='mz') return false;          /* a face-down monster applies no effect */
  const ap = a.p3.actingPlayer;
  return (ap===0||ap===1) && ap!==a.player;
}
/* S03-U238: 「表側表示のこのカードが効果でフィールドから離れた時」 (フォーチュンレディ・ライティー) — the leave event carries no cause, so the move
   reducers stamp the card itself from the action's P3 cause (reason 'effect'; costs, battle, materials and rules are not effects). */
function noteLeftFieldByEffectS03(card,fromZone,toZone,a){
  if(!card || !a || !a.p3 || a.p3.reason!=='effect') return;
  if(!['mz','sz','field'].includes(fromZone) || ['mz','sz','field'].includes(toZone)) return;
  card.leftFieldByEffectS03 = {turn:(typeof gameState!=='undefined' && gameState) ? gameState.turn : null, face:card.face||null, from:fromZone};
}
function v350BanishWhenLeavesField(card,fromZone,toZone,a){
  noteLeftFieldByEffectS03(card,fromZone,toZone,a);
  if(banishWhenLeavesByOpponentEffectS03(card,fromZone,toZone,a)) return true;
  return !!(card && card.banishWhenLeavesField && ['mz','sz','field'].includes(fromZone) && !['mz','sz','field'].includes(toZone));
}
/* S03-U110: 「フィールドの表側表示のこのカードが墓地へ送られる場合、墓地へは行かず持ち主のデッキの一番上に戻る」
   （《大天使クリスティア》④）の置換を中央処理する。script の leaveFieldToDeckTopS03:true で宣言する。
   置換なので墓地へは一度も行かない（onSendToGrave・graveInfo は発生しない）。
   effectNegated() は locateCard() で盤面の位置を引くため、場を離れた後では永続無効（スキルドレイン等）を
   見られない。そこで呼び出し側が場を離れる直前の位置 preLoc と表裏 preFace を渡し、その位置で判定する。 */
function s03DeckTopInsteadOfGraveU110(gs, card, preLoc, preFace){
  if(!card || card.token || !preLoc || preLoc.zone!=='mz' || preFace!=='up') return false;
  const sc=(typeof CARD_SCRIPTS!=='undefined') ? CARD_SCRIPTS[cardName(card)] : null;
  if(!sc || !sc.leaveFieldToDeckTopS03) return false;
  if(card.negated) return false;
  if(card.negatedUntilTurn!=null && card.negatedUntilTurn===gs.turn) return false;
  if(typeof negatedByV13==='function' && negatedByV13(card, gs)) return false;
  if(typeof effectNegatedBy==='function' && typeof collectSources==='function'
     && effectNegatedBy((typeof trapSourcesFilterS03==='function')   /* S03-U118: negated Traps do not negate */
          ? continuousSources().filter(x=>x.zone==='sz'||x.zone==='field') : collectSources(['sz','field'], false), card, preLoc)) return false;
  return true;
}
/* 置換が適用されたら持ち主のデッキの一番上へ置いて true を返す。呼び出し側は墓地処理を丸ごと飛ばす。 */
function s03DeckTopReplaceGraveU110(gs, card, preLoc, preFace, label){
  if(!s03DeckTopInsteadOfGraveU110(gs, card, preLoc, preFace)) return false;
  const ret=returnToOwnerDeckOrExtra(gs, card, preLoc.p, false);
  logIt(gs, `${label||'効果'}：${cardName(card)} は墓地へは行かず ${nameOf(ret.owner)} のデッキの一番上に戻った`);
  return true;
}
function v350DestroyedSpellCounterCount(card){
  return (card && card.counters && Number(card.counters['魔力']||0)) || 0;
}
/* 《魔法都市エンディミオン》②：魔力カウンターが置かれたカードが破壊された時、その数を移す。 */
function v350TransferDestroyedSpellCounters(gs,n){
  n=Math.max(0,Number(n)||0); if(!n || typeof CARD_SCRIPTS==='undefined') return;
  for(let p=0;p<2;p++){
    const P=gs.players[p];
    const scan=[]; if(P.field) scan.push({zone:'field',index:0,card:P.field});
    (P.sz||[]).forEach((c,i)=>scan.push({zone:'sz',index:i,card:c}));
    scan.forEach(x=>{
      if(!x.card || x.card.face!=='up' || x.card.activationPending || x.card.activationNegated) return;
      const sc=CARD_SCRIPTS[cardName(x.card)], cc=sc&&sc.continuous&&sc.continuous.collectDestroyedSpellCounters;
      if(!cc || effectNegated(x.card)) return;
      applyAction(gs,{type:'COUNTER_ADD',player:p,zone:x.zone,index:x.index,kind:'魔力',n});
    });
  }
}

function reset(card){
  // トークンは場を離れると消滅する（墓地に残らない）
  if(card && card.token) return null;
  if(!card) return null;
  /* S03-U248: a Trap Monster leaving the field (「このカードの効果で特殊召喚したこのカードが…破壊された場合」, read after the zone-local keys are gone) */
  if(card.asMonsterDbS03) card.leftAsTrapMonsterS03 = {turn:(typeof gameState!=='undefined' && gameState) ? gameState.turn : null, self:!!card.trapMonsterS03};
  ZONE_LOCAL_KEYS.forEach(k=>{ delete card[k]; });
  card.face = 'up'; card.pos = 'atk';
  return card;                         // 同じオブジェクトを返して同一性を保つ
}
/* 墓地・除外へ送る共通処理。トークンなら消滅させる */
function pushZone(arr, card){
  const r = reset(card); if(!r) return;
  /* S03-U214: 「墓地へ送られるカードは墓地へは行かずゲームから除外される」 (engine/1ZZG) */
  const rd = (typeof graveRedirectPileS03==='function') ? graveRedirectPileS03(arr, r) : null;
  (rd || arr).push(r);
}
/* S03-U214: the card just pushed, if it really went into `pile` (a GY replacement may have banished it instead) */
function graveLastIsS03(pile, card){ const x = pile && pile[pile.length-1]; return (x && (!card || x===card)) ? x : null; }

/* System v3.3.0: 非フィールド領域へ戻るカードの「持ち主」と「戻り先」を一元化。
   コントローラーが変わっていても hand/deck/ex/banish/grave は owner 側へ置く。
   また、元々EXデッキのモンスターは hand/deck へ戻す効果でも EX へ戻る。 */
function cardOwnerIndex(gs, card, fallback){
  const o = (card && card.owner != null && gs.players[card.owner]) ? card.owner : fallback;
  if(card && card.owner == null) card.owner = o;
  return o;
}
function originalExtraDeckMonster(card){
  if(!card || card.token) return false;
  const d = dbOf(card) || {};
  return d.k === 'm' && d.ex === true;
}
function returnToOwnerHandOrExtra(gs, card, fallback){
  const owner = cardOwnerIndex(gs, card, fallback);
  const dst = gs.players[owner];
  const r = reset(card);
  if(!r) return {owner, zone:null};
  if(originalExtraDeckMonster(r)){
    r.face='down'; r.pos='atk'; dst.ex.push(r);
    return {owner, zone:'ex'};
  }
  r.face='up'; r.pos='atk'; dst.hand.push(r);
  return {owner, zone:'hand'};
}
function returnToOwnerDeckOrExtra(gs, card, fallback, toBottom){
  const owner = cardOwnerIndex(gs, card, fallback);
  const dst = gs.players[owner];
  const r = reset(card);
  if(!r) return {owner, zone:null};
  r.face='down'; r.pos='atk';
  if(originalExtraDeckMonster(r)){
    dst.ex.push(r);
    return {owner, zone:'ex'};
  }
  if(toBottom) dst.deck.push(r); else dst.deck.unshift(r);
  return {owner, zone:'deck'};
}
/* 場を離れるカードが持つエクシーズ素材を墓地へ送る（本体処理の前に呼ぶ） */
/* =========================================================================
   継続効果レイヤー（ocgcore の EFFECT_TYPE_SINGLE / FIELD 相当）
   攻守はカードに書き込まず、参照するたびに層を重ねて計算する。
   適用順：元々の数値 → setBase → set → update（増減） → setFinal
   これにより フィールド魔法の全体強化・スキルドレイン・ガンテツ等が
   同じ経路に乗り、カードが場を離れれば自動的に効果が消える。

   スクリプト側の書き方：
     defineScript("ガチガチガンテツ", {
       continuous:{
         scope:'ownMonsters',            // self / ownMonsters / oppMonsters / allMonsters
         from:['mz'],                    // 効果元として有効なゾーン（既定 mz/sz/field）
         apply(target, self){            // 戻り値は下記キーの組み合わせ
           return { atk:200, def:200 };  // atk/def=増減, setAtk/setDef, setBaseAtk, setFinalAtk
         }
       }
     });
   ========================================================================= */

/* カード実体がいまどこにあるかを引く */
function locateCard(card){
  if(!card) return null;
  for(let p=0; p<2; p++){
    const P = gameState.players[p];
    if(P.field === card) return {p, zone:'field', index:0};
    for(const z of ['mz','sz']){
      const i = (P[z]||[]).indexOf(card);
      if(i >= 0) return {p, zone:z, index:i};
    }
  }
  return null;
}

/* 場に表側で存在し、継続効果を持つカードを列挙する。
   スキルドレイン等は魔法＆罠ゾーンからモンスターの効果を無効にするので、
   先に mz 以外を集めてから、無効化されていないモンスターを足す2段階で求める。 */
function gs2Turn(){ return gameState.turn; }
function collectSources(zones, skipNegated){
  const out = [];
  /* System v29: 墓地ソースの宣言集合は1回だけ引く（カードごとに引かない）。 */
  const graveNames = (zones.indexOf('grave') >= 0) ? graveContinuousNamesV29() : null;
  for(let p=0; p<2; p++){
    const P = gameState.players[p];
    const push = (card, zone, index)=>{
      if(!card || card.face !== 'up') return;
      // System v2.3: 永続魔法・永続罠は発動チェーンの解決前にはまだ適用しない。
      if(card.activationPending || card.activationNegated) return;
      if(card.negated) return;                    // 個別に効果を無効にされている
      if(card.negatedUntilTurn === gs2Turn()) return;   // 聖杯などによる一時的な無効化
      if(typeof negatedByV13==='function' && negatedByV13(card, gameState)) return;  // System v13
      if(battleDestroyConfirmed(card)) return;    // 戦闘破壊が確定している
      if(skipNegated && effectNegatedBy(out, card, {p, zone})) return;
      const sc = CARD_SCRIPTS[dbOf(card).n];
      if(!sc || !sc.continuous) return;
      const from = sc.continuous.from || ['mz','sz','field'];
      if(from.indexOf(zone) < 0) return;
      out.push({p, zone, index, card, sc});
    };
    if(zones.indexOf('mz') >= 0) (P.mz||[]).forEach((c,i)=>push(c,'mz',i));
    if(zones.indexOf('sz') >= 0) (P.sz||[]).forEach((c,i)=>push(c,'sz',i));
    if(zones.indexOf('field') >= 0) push(P.field, 'field', 0);
    /* System v29: 墓地を継続効果のソースにするのは、カード側が
       continuous.from に 'grave' を明示した場合だけ。
       墓地全体を毎回走査しないよう、宣言したカード名の集合で先に弾く。 */
    if(graveNames && graveNames.size)
      (P.grave||[]).forEach((c,i)=>{
        if(!c || !graveNames.has(dbOf(c).n)) return;
        push(c, 'grave', i);
      });
    /* S03-U257: lingering effects registered this turn by this player (LINGER_ADD_S03) — only those uids, wherever the card is */
    if(zones.indexOf('linger') >= 0){
      const lu = (P.temporaryFlags && P.temporaryFlags.lingerUidsS03) || [];
      lu.forEach(u=>{ const h = (typeof findCardByUid==='function') ? findCardByUid(u) : null; if(h && h.card) push(h.card, 'linger', h.index); });
      /* S03-U264: multi-turn lingering effects of this player */
      (gameState.lingerLongS03 || []).forEach(e=>{ if(!e || e.player!==p || Number(e.untilTurn) < Number(gameState.turn) || lu.indexOf(e.uid)>=0) return;
        const h = (typeof findCardByUid==='function') ? findCardByUid(e.uid) : null; if(h && h.card) push(h.card, 'linger', h.index); });
    }
  }
  return out;
}
/* continuous.from に 'grave' を書いたカード名の集合。CARD_SCRIPTS は静的なので
   一度だけ作る。宣言が無ければ空集合になり、墓地は一切走査されない。 */
let GRAVE_CONTINUOUS_NAMES_V29 = null;
let GRAVE_CONTINUOUS_KEYS_V29 = -1;
function graveContinuousNamesV29(){
  const n = (typeof CARD_SCRIPTS !== 'undefined' && CARD_SCRIPTS)
    ? Object.keys(CARD_SCRIPTS).length : 0;
  if(GRAVE_CONTINUOUS_NAMES_V29 && GRAVE_CONTINUOUS_KEYS_V29 === n)
    return GRAVE_CONTINUOUS_NAMES_V29;
  GRAVE_CONTINUOUS_KEYS_V29 = n;
  const s = new Set();
  if(typeof CARD_SCRIPTS !== 'undefined' && CARD_SCRIPTS){
    Object.keys(CARD_SCRIPTS).forEach(n=>{
      const sc = CARD_SCRIPTS[n];
      const from = sc && sc.continuous && sc.continuous.from;
      if(Array.isArray(from) && from.indexOf('grave') >= 0) s.add(n);
    });
  }
  GRAVE_CONTINUOUS_NAMES_V29 = s;
  return s;
}
function continuousSources(){
  /* System v29: 墓地ソースを宣言したカードが1枚も無いなら墓地は一切触らない。 */
  const useGrave = graveContinuousNamesV29().size > 0;
  // 魔法＆罠ゾーンとフィールドゾーンの継続効果を先に確定させる
  let outer = collectSources(['sz','field'], false);
  /* S03-U118: 無効化されている魔法＆罠ゾーンの罠カード（トラップ・スタン／王宮のお触れ）の継続効果は適用しない。
     以前は negateTrap / trapStun を発動の可否でしか見ておらず、グラヴィティ・バインドやスキルドレインは無効化中も働いていた。 */
  if(typeof trapSourcesFilterS03==='function') outer = trapSourcesFilterS03(outer, null);
  // その上で、無効化されていないモンスターの継続効果を足す
  const inner = collectSources(['mz'], true).filter(x=>!effectNegatedBy(outer, x.card, x)
    && !(typeof linkedNegationActiveS03==='function' && linkedNegationActiveS03(x.card)));   /* S03-U177: engine/1ZY */
  /* S03-U118: モンスターの negateTrap（人造人間－サイコ・ショッカー）。自身が無効（スキルドレインが先に適用）なら inner に居ない。 */
  if(typeof trapSourcesFilterS03==='function') outer = trapSourcesFilterS03(outer, inner);
  /* System v29: 宣言済みの墓地ソースを最後に足す。既存2群の順序は変えない。
     墓地を離れた瞬間に集合から消えるので、失効は自動。 */
  const grave = useGrave ? collectSources(['grave'], false) : [];
  /* S03-U257: lingering sources (LINGER_ADD_S03) last, after the GY sources; nothing is collected unless a player registered one this turn */
  const useLinger = gameState.players.some(P=>P && P.temporaryFlags && Array.isArray(P.temporaryFlags.lingerUidsS03) && P.temporaryFlags.lingerUidsS03.length)
    || (Array.isArray(gameState.lingerLongS03) && gameState.lingerLongS03.some(e=>e && Number(e.untilTurn) >= Number(gameState.turn)));   /* S03-U264 */
  const linger = useLinger ? collectSources(['linger'], false) : [];
  if(linger.length) return outer.concat(inner, grave, linger);
  return grave.length ? outer.concat(inner, grave) : outer.concat(inner);
}

/* 与えられた効果元の集合が、対象カードの効果を無効にしているか */
function effectNegatedBy(sources, card, loc){
  return sources.some(src=>{
    const f = src.sc.continuous && src.sc.continuous.negateEffect;
    if(typeof f !== 'function') return false;
    if(!continuousReaches(src.sc.continuous.scope||'self', src.p, loc, src.card, card)) return false;
    if(typeof s03UnaffectedByContinuousU115==='function' && s03UnaffectedByContinuousU115(card, src.card)) return false;   /* S03-U115 */
    try{ return !!f(card, src.card); }catch(e){ return false; }
  });
}

/* 罠カードの効果が無効化されているか（王宮のお触れ）。
   トラップ・スタンと同じ扱いで、発動の可否を判定するときに使う。 */
function trapNegated(card){
  if(!card || dbOf(card).k !== 't') return false;
  return continuousSources().some(src=>{
    const f = src.sc.continuous && src.sc.continuous.negateTrap;
    if(typeof f !== 'function') return false;
    try{ return !!f(card, src.card); }catch(e){ return false; }
  });
}

/* このカードの効果が無効化されているか（スキルドレイン・デモンズ・チェーン等） */
function effectNegated(card){
  if(!card) return false;
  if(card.negated) return true;
  // ターン終了時までの一時的な無効化（禁じられた聖杯など）
  if(card.negatedUntilTurn != null && card.negatedUntilTurn === gameState.turn) return true;
  // System v13: Action で置かれた期間つきの無効化
  if(typeof negatedByV13==='function' && negatedByV13(card, gameState)) return true;
  /* S03-U177: a face-up monster's 「選択したモンスターの効果は無効化される」 link (engine/1ZY) */
  if(typeof linkedNegationActiveS03==='function' && linkedNegationActiveS03(card)) return true;
  const loc = locateCard(card);
  if(!loc) return false;
  /* S03-U118: 無効化されている罠カード（トラップ・スタン／王宮のお触れ／サイコ・ショッカー）の negateEffect は数えない。
     continuousSources() の魔法＆罠・フィールド部分がその判定済みの集合（collectSources を直接見ると素通りする）。 */
  const stSources = (typeof trapSourcesFilterS03==='function')
    ? continuousSources().filter(x=>x.zone==='sz'||x.zone==='field')
    : collectSources(['sz','field'], false);
  return effectNegatedBy(stSources, card, loc);
}

/* このモンスターが攻撃宣言できないか */
function cannotAttackNow(card){
  if(!card) return false;
  if(card.cannotAttack) return true;
  /* S03-U100: card.cannotAttack はゾーンを離れるまで残る恒久フラグ（"このターン攻撃できない"
     効果には不適切）。attackLimitTurn と同じ形の、ターン番号スタンプ付きの一時フラグ。
     restrict対象が効果の発動元自身とは限らない（例：ジュラック・グアイバが特殊召喚した
     別名の「ジュラック」モンスター）ので、continuous.cannotAttack の自己スコープ hook では
     表現できないケース向けの汎用手段。 */
  if(card.cannotAttackTurn===gameState.turn) return true;
  const loc = locateCard(card);
  if(!loc) return false;
  /* S03-U170: 「このターン相手は攻撃宣言をする事ができない」 (威嚇する咆哮) — a turn-stamped player flag */
  { const tfS03=gameState.players[loc.p]&&gameState.players[loc.p].temporaryFlags;
    if(tfS03 && tfS03.noAttackDeclareS03===gameState.turn) return true; }
  const only=gameState.players[loc.p]&&gameState.players[loc.p].temporaryFlags&&gameState.players[loc.p].temporaryFlags.v350OnlyAttackerUid;
  if(only!=null && ensureCardUid(gameState,card)!==only) return true;
  const consecutive=gameState.players[loc.p]&&gameState.players[loc.p].temporaryFlags&&gameState.players[loc.p].temporaryFlags.v48ConsecutiveAttackerUid;
  if(consecutive!=null && ensureCardUid(gameState,card)!==consecutive) return true;
  return continuousSources().some(src=>{
    const f = src.sc.continuous && src.sc.continuous.cannotAttack;
    if(typeof f !== 'function') return false;
    if(!continuousReaches(src.sc.continuous.scope||'self', src.p, loc, src.card, card)) return false;
    try{ return !!f(card, src.card); }catch(e){ return false; }
  });
}

function attackCountV48(card){ return Math.max(0,Number(card&&card.attackCount)||((card&&card.attacked)?1:0)); }
function continuousAttackLimitV48(card, loc){
  if(!card || !loc || loc.zone!=='mz' || typeof continuousSources!=='function') return 1;
  let limit = 1;
  for(const src of continuousSources()){
    const cont = src.sc && src.sc.continuous;
    const f = cont && cont.grantsAttackLimit;
    if(typeof f !== 'function') continue;
    if(!continuousReaches(cont.scope||'self', src.p, loc, src.card, card)) continue;
    let v = null;
    try{ v = f(card, src.card); }catch(e){ continue; }
    if(Number.isSafeInteger(v) && v >= 1) limit = Math.max(limit, v);
  }
  return limit;
}
function attackLimitV48(card){
  const loc=locateCardAnyV4(card);
  const scripted=card&&typeof CARD_SCRIPTS!=='undefined'&&CARD_SCRIPTS[cardName(card)];
  const rule=scripted&&scripted.attackLimit; let inherent=1;
  try{ inherent=Math.max(1,Number(typeof rule==='function'?rule(card,loc):rule)||1); }catch(e){ inherent=1; }
  const granted=card&&card.attackLimitTurn===gameState.turn?Math.max(inherent,Number(card.attackLimit)||1):inherent;
  return Math.max(granted, continuousAttackLimitV48(card, loc));
}
/* S03-U212: 「このカードは○○ライフポイント払わなければ攻撃できない」 (ダーク・エルフ) — script attackLpCostS03 (a number, or fn(card) → number).
   A face-up, non-negated card with a cost larger than its controller's LP cannot declare an attack; the processor pays it at the declaration. */
function attackLpCostS03(card){
  if(!card || card.face!=='up' || typeof CARD_SCRIPTS==='undefined') return 0;
  const sc = CARD_SCRIPTS[cardName(card)], raw = sc && sc.attackLpCostS03;
  let n = 0;
  if(raw!=null && !(typeof effectNegated==='function' && effectNegated(card))){
    try{ n = Number(typeof raw==='function' ? raw(card) : raw) || 0; }catch(e){ n = 0; }
  }
  return Math.max(0, n) + attackTaxS03(card);
}
/* S03-U221: 「お互いのプレイヤーは○○ライフポイントを払わなければ、攻撃宣言をする事ができない」 (通行税) — a face-up card whose script declares
   attackTaxS03 (a number, or fn(attacker, src) → number) adds to every attack's LP cost. A card still being activated or negated adds nothing. */
function attackTaxS03(attacker){
  let t = 0;
  for(let q=0;q<2;q++){
    const P = gameState.players[q];
    [].concat(P.mz||[], P.sz||[], P.field?[P.field]:[]).forEach(c=>{
      if(!c || c.face!=='up' || c.activationPending || c.activationNegated) return;
      const sc = CARD_SCRIPTS[cardName(c)], raw = sc && sc.attackTaxS03;
      if(raw==null) return;
      if(typeof effectNegated==='function' && effectNegated(c)) return;
      let v = 0; try{ v = Number(typeof raw==='function' ? raw(attacker, c) : raw) || 0; }catch(e){ v = 0; }
      t += Math.max(0, v);
    });
  }
  return t;
}
function attackLpCostBlockedS03(card){
  const n = attackLpCostS03(card); if(!n) return false;
  const loc = locateCard(card);
  return !loc || !(Number(gameState.players[loc.p].lp) >= n);
}
function canDeclareAttackV48(card, returnCostPaidS03){
  if(!card) return false;
  if(attackLpCostBlockedS03(card)) return false;   /* S03-U212 */
  /* S03-U302: 霞の谷のファルコン — no other own card to return; not checked again once this declaration's cost is paid */
  if(!returnCostPaidS03 && typeof attackReturnCostBlockedS03==='function' && attackReturnCostBlockedS03(card)) return false;
  /* S03-U152: no attack once an effect has ended this Battle Phase (the transition to Main Phase 2 is queued) */
  if(typeof battlePhaseEndedByEffectS03==='function' && battlePhaseEndedByEffectS03()) return false;
  /* S03-U149: 「全てのモンスターに1回ずつ攻撃できる」 (engine/1ZQ) replaces the attack count for such a card */
  const aaS03 = (typeof attackAllCanDeclareS03==='function') ? attackAllCanDeclareS03(card) : null;
  if(aaS03!==null) return aaS03 && !cannotAttackNow(card);
  return attackCountV48(card)<attackLimitV48(card) && !cannotAttackNow(card);
}
function canDirectAttackThroughMonstersV51(card){
  const sc=card&&typeof CARD_SCRIPTS!=='undefined'&&CARD_SCRIPTS[cardName(card)], rule=sc&&sc.canDirectAttack;
  let allowed=false;
  try{ allowed=typeof rule==='function'?!!rule(card,locateCardAnyV4(card)):!!rule; }catch(e){ allowed=false; }
  /* System v6: 他のカードがこのターンだけ直接攻撃を許可した場合も通す。 */
  if(!allowed && typeof grantedDirectAttackV6==='function') allowed=grantedDirectAttackV6(card,gameState);
  /* System v6: 装備カード等の継続効果が直接攻撃を許可する場合。
     cannotAttack / mustAttack と同じ形の継続効果 hook にする。 */
  if(!allowed){
    const loc=locateCard(card);
    if(loc) allowed=continuousSources().some(src=>{
      const f=src.sc.continuous && src.sc.continuous.grantsDirectAttack;
      if(typeof f!=='function') return false;
      if(!continuousReaches(src.sc.continuous.scope||'self', src.p, loc, src.card, card)) return false;
      try{ return !!f(card, src.card); }catch(e){ return false; }
    });
  }
  return allowed&&!cannotDirectAttackNow(card);
}

/* 攻撃可能な場合に攻撃しなければならないか（カラクリ） */
/* このモンスターがプレイヤーへ直接攻撃できないか。 */
function cannotDirectAttackNow(card){
  if(!card) return false;
  const loc=locateCard(card); if(!loc) return false;
  return continuousSources().some(src=>{
    const f=src.sc.continuous&&src.sc.continuous.cannotDirectAttack;
    if(typeof f!=='function') return false;
    if(!continuousReaches(src.sc.continuous.scope||'self',src.p,loc,src.card,card)) return false;
    try{return !!f(card,src.card);}catch(e){return false;}
  });
}

function mustAttackNow(card){
  if(!card) return false;
  const loc = locateCard(card);
  if(!loc) return false;
  /* S03-U150: 立ちはだかる強敵 — every face-up Attack Position monster must attack the selected monster */
  if(typeof forcedAttackMustS03==='function' && forcedAttackMustS03(card)) return true;
  return continuousSources().some(src=>{
    const f = src.sc.continuous && src.sc.continuous.mustAttack;
    if(typeof f !== 'function') return false;
    if(!continuousReaches(src.sc.continuous.scope||'self', src.p, loc, src.card, card)) return false;
    try{ return !!f(card, src.card); }catch(e){ return false; }
  });
}

/* 裏側でセットできない状態か（聖なる輝き） */
function mustSetFaceUp(){
  return continuousSources().some(src=>{
    const f = src.sc.continuous && src.sc.continuous.noFaceDownSet;
    if(typeof f !== 'function') return false;
    try{ return !!f(); }catch(e){ return false; }
  });
}

/* scope が対象カードに届いているか */
function continuousReaches(scope, srcP, tgtLoc, src, target){
  switch(scope){
    case 'self':        return src === target;
    /* System v15: 装備カードから見た「装備モンスター」だけに届く。 */
    case 'equippedMonster':
      return !!(src && src.equipTo && target && target.uid != null
                && src.equipTo.uid === target.uid && tgtLoc.zone === 'mz');
    case 'ownMonsters': return tgtLoc.p === srcP && tgtLoc.zone === 'mz';
    case 'oppMonsters': return tgtLoc.p !== srcP && tgtLoc.zone === 'mz';
    case 'allMonsters': return tgtLoc.zone === 'mz';
    default:            return false;
  }
}

/* 戦闘ダメージに介入する継続効果を適用する。
   ③-ⅳ ダメージ発生の直前に呼ばれ、最終的なダメージ量を返す。
   info = {to, amount, atkCard, defCard, atkOwner, defOwner} */
/* System v6: 戦闘ダメージを「代わりに」別のプレイヤーが受ける置換効果。
   継続効果ソースが battleDamageRedirect(info) で 0/1 を返した場合だけ働く。
   金額の増減は従来どおり battleDamage が担当し、役割を分ける。 */
function applyBattleDamageRedirectV6(info){
  if(typeof continuousSources!=='function') return null;
  let to = null;
  continuousSources().forEach(src=>{
    const f = src.sc.continuous && src.sc.continuous.battleDamageRedirect;
    if(typeof f !== 'function') return;
    let r = null;
    try{ r = f(Object.assign({}, info, {srcPlayer:src.p, self:src.card})); }
    catch(e){ return; }
    if(r === 0 || r === 1) to = r;
  });
  return to;
}
function applyBattleDamageFilters(info){
  let amount = info.amount;
  continuousSources().forEach(src=>{
    const f = src.sc.continuous && src.sc.continuous.battleDamage;
    if(typeof f !== 'function') return;
    let r = null;
    try{ r = f(Object.assign({}, info, {amount, srcPlayer:src.p, self:src.card})); }
    catch(e){ return; }
    if(typeof r === 'number') amount = Math.max(0, r);
  });
  return amount;
}

/* System v3.3.0: 守備表示モンスターへの貫通ダメージ。
   通常は0。表側の継続効果ソースが piercingDamage(info) を返した場合だけ適用する。 */
function applyPiercingDamage(info){
  let amount = 0;
  /* S03-U233: 「その戦闘で…守備力を攻撃力が超えた分だけ相手に戦闘ダメージを与える」 granted by a resolved effect to one battle
     (機皇兵ワイゼル・アイン) — a stamp on the attacker {turn, target}; it stays in force even if the granting card leaves. */
  { const g = info && info.atkCard && info.atkCard.pierceBattleS03;
    /* A target omitted from the serialized grant means every Defense Position battle this turn (H－ヒートハート).
       The original single-battle grant continues to require its stamped defender. */
    if(g && Number(g.turn)===Number(gameState.turn) && info.defCard && (g.target==null || info.defCard.uid===g.target)) amount = Math.max(0, Number(info.amount)||0); }
  continuousSources().forEach(src=>{
    const f = src.sc.continuous && src.sc.continuous.piercingDamage;
    if(typeof f !== 'function') return;
    let r = 0;
    try{ r = f(Object.assign({}, info, {srcPlayer:src.p, self:src.card})); }
    catch(e){ return; }
    if(typeof r === 'number') amount = Math.max(amount, Math.max(0,r));
  });
  return amount;
}

/* 対象カードに掛かっている継続効果を層ごとに集める */
function collectContinuous(card){
  const layers = { setBase:[], set:[], update:[], setFinal:[] };
  const loc = locateCard(card);
  if(!loc) return layers;
  continuousSources().forEach(src=>{
    const cont = src.sc.continuous;
    if(!continuousReaches(cont.scope||'self', src.p, loc, src.card, card)) return;
    if(typeof s03UnaffectedByContinuousU115==='function' && s03UnaffectedByContinuousU115(card, src.card)) return;   /* S03-U115 */
    let r = null;
    try{ r = cont.apply(card, src.card, {p:src.p, loc}); }
    catch(e){ return; }                 // スクリプトの例外で盤面を壊さない
    if(!r) return;
    const tag = src.sc.name;
    if(r.setBaseAtk!=null || r.setBaseDef!=null) layers.setBase.push({...r, src:tag});
    if(r.setAtk!=null     || r.setDef!=null)     layers.set.push({...r, src:tag});
    if(r.atk!=null        || r.def!=null)        layers.update.push({...r, src:tag});
    if(r.setFinalAtk!=null|| r.setFinalDef!=null)layers.setFinal.push({...r, src:tag});
  });
  /* v4: RESET-managed modifiers share the same stat layers. */
  if(typeof v4RuntimeStatLayers==='function'){
    const rt=v4RuntimeStatLayers(card);
    ['setBase','set','update','setFinal'].forEach(k=>{ if(rt&&Array.isArray(rt[k])) layers[k].push(...rt[k]); });
  }
  return layers;
}

/* 修正値と継続効果を含めた攻撃力・守備力を返す */
function curStat(card, key){
  const db = dbOf(card);
  const Base = key==='atk' ? 'setBaseAtk' : 'setBaseDef';
  const Set_ = key==='atk' ? 'setAtk'     : 'setDef';
  const Fin  = key==='atk' ? 'setFinalAtk': 'setFinalDef';
  const L = collectContinuous(card);
  let v = db[key] || 0;
  // System v2.3: 妥協召喚など「召喚方法そのもの」で元々の数値が変わる処理。
  // カード効果のチェーンではなく、通常召喚手順が付与する状態として扱う。
  const ps = card && card.procedureBaseStats;
  if(ps && ps.active!==false && ps[key]!=null) v = ps[key];
  // System v14: 元々の数値そのものを変える層（加算 / SET / 入れ替え）
  if(typeof applyStatBaseLayerV14==='function') v = applyStatBaseLayerV14(card, key, v);
  L.setBase.forEach(l=>{ if(l[Base]!=null) v = l[Base]; });
  L.set    .forEach(l=>{ if(l[Set_]!=null) v = l[Set_]; });
  // System v14: 現在値のSET（この後の加算・減算は効く）
  if(typeof applyStatSetLayerV14==='function') v = applyStatSetLayerV14(card, key, v);
  // 一時修正値（オネスト・突進など）は増減層に入る
  (card.mods||[]).forEach(m=>{ v += (m[key]||0); });
  L.update .forEach(l=>{ if(l[key]!=null) v += l[key]; });
  L.setFinal.forEach(l=>{ if(l[Fin]!=null) v = l[Fin]; });
  return Math.max(0, v);
}
function curATK(card){ return curStat(card, 'atk'); }
function curDEF(card){ return curStat(card, 'def'); }

/* S03-U238: 「このカードのレベルが上がった時」 — a face-up monster whose level rose through a level Action (LEVEL_MOD_V16 / FX_SET_STATE lvDelta)
   queues onLevelUpS03 {uid, player, from, to} (DUEL; drained like the other deferred events). */
function noteLevelUpS03(card, a, before){
  if(!card || card.face!=='up' || !a || a.zone!=='mz') return;
  const after = curLV(card);
  if(!(after > before)) return;
  if(typeof queueDeferredEventV2==='function' && typeof PLAY_MODE!=='undefined' && PLAY_MODE===PLAY_MODES.DUEL)
    queueDeferredEventV2('onLevelUpS03', {uid:card.uid, player:a.player, name:cardName(card), from:before, to:after});
}
/* 修正を含めた現在のレベル（ランク）。
   スポーアやレベル・スティーラーが card.lvMod を増減させる。
   エクシーズのランクは変動しないので lvMod は付かない前提。 */
function curLV(card){
  if(!card) return 0;
  const base = dbOf(card).lv || 0;
  let v = base + (card.lvMod || 0);
  // System v16: 期間つきの増減 / SET と、永続効果ソースによる層
  if(typeof applyLevelModsV16==='function') v = applyLevelModsV16(card, v);
  if(typeof applyContinuousLevelV16==='function') v = applyContinuousLevelV16(card, v);
  return Math.max(0, v);
}

/* =========================================================================
   対象を取る／取らない と「効果の対象にならない」耐性
   ocgcore の EFFECT_FLAG_CARD_TARGET / EFFECT_CANNOT_BE_EFFECT_TARGET 相当。
   スクリプトに targets:true を書いたものだけが対象耐性のチェックを受ける。
   ========================================================================= */
let ACTIVE_SCRIPT = null;              // 実行中のスクリプト（対象判定に使う）

/* 対象耐性を持つか。スクリプトの continuous.immuneToTarget を優先し、
   無ければ効果テキストから自身への耐性を推定する。 */
const TARGET_IMMUNE_CACHE = new Map();
function targetImmune(card){
  if(!card || card.face !== 'up') return false;
  const db = dbOf(card);
  const nm = db.n; if(!nm) return false;
  // 他のカードから与えられている耐性
  const loc = locateCard(card);
  if(loc){
    for(const src of continuousSources()){
      const cont = src.sc.continuous;
      if(!cont.immuneToTarget) continue;
      if(!continuousReaches(cont.scope||'self', src.p, loc, src.card, card)) continue;
      let r = false;
      try{ r = cont.immuneToTarget(card, src.card); }catch(e){ r = false; }
      if(r) return true;
    }
  }
  // 自身のテキストによる耐性
  /* S03-U74 と同じ bug class（未監査領域の予防修正）: このカード自身のスクリプトが
     continuous.immuneToTarget を関数で宣言している場合、その答えは既に上のループで
     計算済み（ここに来た時点で該当なし＝false）。テキスト推定キャッシュへフォールバック
     すると、条件文言込みの原文が正規表現に無条件でマッチした場合、カード名単位で
     "true" が永続的にキャッシュされ、以後 continuous 側の正しい判定を上書きしてしまう
     （battleProof() で実際に確認した誤判定と同型）。現時点でこの形の生カードは
     未確認だが、将来同型カードが追加された際に同じ罠を踏まないよう先に塞ぐ。 */
  const sc0 = CARD_SCRIPTS[nm];
  if(sc0 && sc0.continuous && typeof sc0.continuous.immuneToTarget === 'function') return false;
  if(TARGET_IMMUNE_CACHE.has(nm)) return TARGET_IMMUNE_CACHE.get(nm);
  const e = String(db.e||"") + String(db.e0||"");
  const v = /このカードは[^。]*効果の対象にならない/.test(e);
  TARGET_IMMUNE_CACHE.set(nm, v);
  return v;
}

/* 対象を取る効果の候補から、耐性を持つカードを除く */
function filterTargetable(cands, byPlayer){
  if(!Array.isArray(cands)) return cands;
  return cands.filter(x=>{
    if(!x || !x.card) return true;
    // 対象耐性は場のカードにのみ意味がある
    if(x.zone !== 'mz' && x.zone !== 'sz' && x.zone !== 'field') return true;
    if(battleDestroyConfirmed(x.card)) return false;   // 戦闘破壊確定は対象に取れない
    /* S03-U130: 「このターン相手の効果の対象にならない」（ダーク・フュージョン）— 対象を取るプレイヤーが分かる時だけ判定する */
    if(typeof oppTargetImmuneNowS03==='function' && oppTargetImmuneNowS03(x.card, x.p, byPlayer)) return false;
    return !targetImmune(x.card);
  });
}

/* 修正値が入っているか */
function hasMod(card){ return !!(card && card.mods && card.mods.length); }
function modUntilJp(u){
  return ({endTurn:'このターン', endPhase:'このフェイズ', permanent:'永続'})[u] || 'このターン';
}
/* 期間切れの修正値を掃除する */
function clearExpiredMods(gs, when){
  gs.players.forEach(P=>{
    ['mz','sz'].forEach(z=>{
      (P[z]||[]).forEach(c=>{
        if(!c || !c.mods) return;
        c.mods = c.mods.filter(m=>{
          if(m.until==='permanent') return true;
          if(when==='endBattlePhase') return m.until!=='endBattlePhase';
          if(when==='endTurn')  return m.until!=='endTurn' && m.until!=='endPhase' && m.until!=='endBattlePhase';
          if(when==='endPhase') return m.until!=='endPhase';
          return true;
        });
        if(!c.mods.length) delete c.mods;
      });
      // System v14: 攻守修整も同じ期間規約で掃除する
      (P[z]||[]).forEach(c=>{
        if(!c || !Array.isArray(c.statModsV14)) return;
        c.statModsV14 = c.statModsV14.filter(m=>keepStatModV14(m, when));
        if(!c.statModsV14.length) delete c.statModsV14;
      });
      // System v16: レベル修整も同じ期間規約で掃除する
      (P[z]||[]).forEach(c=>{
        if(!c || !Array.isArray(c.lvModsV16)) return;
        c.lvModsV16 = c.lvModsV16.filter(m=>keepLevelModV16(m, when));
        if(!c.lvModsV16.length) delete c.lvModsV16;
      });
      // System v17: 特性の上書きも同じ期間規約で掃除する
      (P[z]||[]).forEach(c=>{
        if(!c || !Array.isArray(c.charV17)) return;
        c.charV17 = c.charV17.filter(m=>keepCharModV17(m, when));
        if(!c.charV17.length) delete c.charV17;
      });
    });
  });
  // System v20: 公開の期間も同じ規約で掃除する
  if(typeof clearExpiredRevealsV20==='function') clearExpiredRevealsV20(gs, when);
  // System v21: 一時的な破壊耐性も同じ規約で掃除する
  if(typeof clearExpiredProtV21==='function') clearExpiredProtV21(gs, when);
}

/* 戦闘では破壊されないカードか判定する。
   スクリプトに battleProof:true があればそれを使う。
   無ければ効果テキストから推定する（マシュマロン等）。 */
const BATTLE_PROOF_CACHE = new Map();
function battleProof(card){
  if(!card) return false;
  if(card.battleProof) return true;          // 効果で一時的に付与された場合
  /* S03-U171: 「このターン、自分のモンスターは戦闘では破壊されず」 (和睦の使者) — a turn-stamped flag of the monster's controller,
     so monsters that arrive later in the turn are covered too */
  { const locS03=(typeof locateCard==='function')?locateCard(card):null;
    const tfS03=locS03&&locS03.zone==='mz'&&gameState.players[locS03.p]?gameState.players[locS03.p].temporaryFlags:null;
    if(tfS03 && tfS03.noBattleDestroyS03===gameState.turn) return true; }
  // System v15: 装備カードなど外部ソースから与えられた戦闘破壊耐性
  if(typeof battleProofGrantedV15==='function' && battleProofGrantedV15(card)) return true;
  const db = dbOf(card);
  const nm = db.n; if(!nm) return false;
  const sc = CARD_SCRIPTS[nm];
  if(sc && sc.battleProof!=null) return !!sc.battleProof;
  /* S03-U74: このカード自身のスクリプトが continuous.battleProof を関数（条件付き）で宣言している場合、
     その答えは既に battleProofGrantedV15 が計算済み（ここに来た時点で false ）。以下のキャッシュ／テキスト
     推定にフォールバックすると、条件文言込みの原文（例：「〜の場合、このカードは戦闘では破壊されない」）が
     正規表現に無条件でマッチしてしまい、一度でも該当条件を満たした瞬間にカード名単位でキャッシュされた
     "true" が、以後その条件を満たさない状態でも永続的に上書きしてしまう（カラクリ守衛 参壱参・ワーム・ゼクス
     で実際に確認した誤判定）。自己申告の動的判定がある以上、それを最終回答として扱う。 */
  if(sc && sc.continuous && typeof sc.continuous.battleProof === 'function') return false;
  if(BATTLE_PROOF_CACHE.has(nm)) return BATTLE_PROOF_CACHE.get(nm);
  const proof = unconditionalBattleProofTextS03(db);
  BATTLE_PROOF_CACHE.set(nm, proof);
  return proof;
}
/* S03-U158: the text fallback used to match 「戦闘では破壊されない」 ANYWHERE in the text, so a monster became battle-indestructible
   for good when the phrase was conditional (「自分フィールド上にチューナーが…存在する場合」 ホワイトポータン), limited (「1ターンに1度だけ」
   ジャイロイド・混沌球体・スターダスト・シャオロン), about other monsters (D・ボードン, イレカエル, アマゾネス女王's others), or an effect used
   from the hand / GY (シールド・ウォリアー, BF－蒼天のジェット, 紫炎の寄子). It also masked the System v21 declarations
   (continuous.protectV21) of those cards, because battleProof is checked first.
   Now the fallback only accepts a sentence that IS the unconditional self protection: 「（①:／また、）このカードは戦闘では
   （によっては）破壊されない。」 (雲魔物, 巨大戦艦, X－セイバー パシウル, …). Everything else must be declared by the card
   (sc.battleProof, continuous.battleProof, protectV21). */
function recordBattlePartnersS03(gs, a, b){
  if(!a || !b) return;
  ensureCardUid(gs, a); ensureCardUid(gs, b);
  const add = (c, uid)=>{ if(!Array.isArray(c.battledWithS03)) c.battledWithS03 = []; if(c.battledWithS03.indexOf(uid)<0) c.battledWithS03.push(uid); };
  add(a, b.uid); add(b, a.uid);
}
/* did these two monsters battle each other while both stayed on the field? (both records are zone-local) */
function battledTogetherS03(a, b){
  return !!(a && b && a.uid!=null && b.uid!=null && Array.isArray(a.battledWithS03) && Array.isArray(b.battledWithS03)
    && a.battledWithS03.indexOf(b.uid)>=0 && b.battledWithS03.indexOf(a.uid)>=0);
}
function unconditionalBattleProofTextS03(db){
  if(!db || db.k!=='m') return false;
  const e = String(db.e||"") + "\n" + String(db.e0||"");
  return e.split(/[。\n]/).some(sen=>{
    const t = sen.replace(/\s+/g,'').replace(/^(?:[①②③④⑤⑥][:：]|また、)/,'');
    return /^このカードは戦闘(?:では|によっては|で)破壊されない$/.test(t);
  });
}

/* 装備モンスターが場を離れた時、付いている装備魔法を墓地へ送る */
function dropEquips(P, card, gsRef, whyS03){
  if(!card || !card.equippedBy || !card.equippedBy.length) return;
  const gs=gsRef||gameState, uids = card.equippedBy.slice();
  const hostPS03 = gs.players.indexOf(P);
  card.equippedBy = [];
  // 装備カードの持ち主へ戻す。相手モンスターを装備扱いにするカードにも共通対応。
  (gs.players||[]).forEach((PP,controller)=>{
    for(let i=PP.sz.length-1;i>=0;i--){
      const eq = PP.sz[i];
      if(eq && eq.equipUid && uids.indexOf(eq.equipUid)>=0){
        sendOrphanEquipV31(gs,controller,i, (whyS03==='deck' && controller===hostPS03) ? {hostToDeckS03:true} : null);   /* S03-U183 */
      }
    }
  });
}

function dropXyzMaterials(P, card, gsRef){
  if(card && card.xyz && card.xyz.length){
    const gs = gsRef || gameState;
    const fallbackIndex = gs.players.indexOf(P);
    const fallback = fallbackIndex >= 0 ? fallbackIndex : 0;
    card.xyz.forEach(m=>{
      const owner = (m && m.owner != null && gs.players[m.owner]) ? m.owner : fallback;
      pushZone(gs.players[owner].grave, m);
    });
    card.xyz = [];
  }
}

/* -------------------- ログ / 名前 -------------------- */
function logIt(gs, msg){ gs.log.unshift({t:Date.now(), msg}); if(gs.log.length>60) gs.log.pop(); }
/* System v28: LP 変動の中央イベント。payload は純 JSON。
   LP が実際に変わった時だけ出す（置換で変動0になった場合は出さない）。
   金額は半分・倍・肩代わりを通した後の最終値。 */
function emitLpChangeV28(gs, info){
  gs = gs || gameState;
  if(!info) return;
  const before = Number(info.before), after = Number(info.after);
  if(!Number.isFinite(before) || !Number.isFinite(after)) return;
  if(before === after) return;
  if(typeof queueDeferredEventV2 !== 'function') return;
  if(typeof PLAY_MODE === 'undefined' || PLAY_MODE !== PLAY_MODES.DUEL) return;
  queueDeferredEventV2('onLPChange', Object.assign({
    player:    (info.player===0||info.player===1) ? info.player : null,
    before:    before,
    after:     after,
    delta:     after - before,
    cause:     info.cause || 'unspecified',
    requested: (typeof info.requested === 'number') ? info.requested : null,
    redirected: info.redirected === true,
    sourceUid: (info.sourceUid != null) ? info.sourceUid : null,
    byPlayer:  (info.byPlayer===0||info.byPlayer===1) ? info.byPlayer : null
  }, info.chainLinkOneS03===true ? {chainLinkOneS03:true} : {}));   /* S03-U50: チェーン1の効果ダメージだけ（既存 payload は不変） */
}

/* System v26: コントロール変更の中央イベント。
   payload は純 JSON。index など Replay 中にずれる情報は載せない。 */
function emitControlChangeV26(gs, card, fromPlayer, toPlayer, zone, sourceUid, reason){
  if(!card) return;
  if(typeof queueDeferredEventV2 !== 'function') return;
  if(typeof PLAY_MODE === 'undefined' || PLAY_MODE !== PLAY_MODES.DUEL) return;
  queueDeferredEventV2('onControlChange', {
    uid: (card.uid != null) ? card.uid : null,
    fromPlayer: (fromPlayer===0||fromPlayer===1) ? fromPlayer : null,
    toPlayer:   (toPlayer===0||toPlayer===1)   ? toPlayer   : null,
    zone: zone || null,
    sourceUid: (sourceUid != null) ? sourceUid : null,
    reason: reason || null
  });
}
function nameOf(p){ return PNAME[p]; }
function phaseJp(id){ return (PHASES.find(x=>x.id===id)||{}).jp || id; }
function zoneJp(z){ return {hand:"手札",mz:"モンスター",sz:"魔法罠",field:"フィールド",grave:"墓地",banish:"除外",deck:"デッキ",ex:"EX"}[z]||z; }
function cardName(card){ return card?.token ? card.token.n : (CARD_DB[card.id]?.n || "カード"); }
function shuffle(a,gsRef){
  if(typeof duelShuffleV41==='function') return duelShuffleV41(a,gsRef||gameState);
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
