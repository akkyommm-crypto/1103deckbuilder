/* =========================================================================
   ダメージステップ（マスタールール2・1103当時裁定）
   出典：ダメステマニュアル 2026-05-01（原案 ohkami / 製作 さばえ）

     ① 開始時        … 「戦闘を行った時」の誘発。リバース効果もここで発動宣言
     ② ダメージ計算前  … 裏側守備をリバース。攻守変動フリーチェーンはここまで
     ③ ダメージ計算時  … ⅰ効果処理（オネスト・カルート）→ ⅱ攻守確定 →
                        ⅲダメージ確定 → ⅳダメージ発生 → ⅴ戦闘破壊確定
                        発動できるのは ⅰ のみ。ⅱ以降は自動処理
     ④ ダメージ計算後  … 「ダメージ計算後」指定・戦闘ダメージ起点の誘発
     ⑤ 追加誘発解決    … 戦闘破壊されたモンスターが場を離れ、それを起点とする誘発
     ⑥ 終了時        … 「ダメージステップ終了時に○○する」効果

   フラグの意味
     quickMod  … フリーチェーンの攻守変動を発動できるか（②まで）
     dsOnly    … ダメージステップ限定の効果を発動できるか（③-ⅰまで）
     counter   … カウンター罠を発動できるか
     destroyed … 戦闘破壊が確定しているか（③-ⅴ以降）
                 確定したモンスターは永続効果を出さず、効果の対象にも取れない
   ========================================================================= */
const DAMAGE_STEPS = [
  { key:'start',  jp:'① ダメージステップ開始時', quickMod:true,  dsOnly:true,  counter:true,  destroyed:false },
  { key:'before', jp:'② ダメージ計算前',         quickMod:true,  dsOnly:true,  counter:true,  destroyed:false },
  { key:'calc',   jp:'③ ダメージ計算時',         quickMod:false, dsOnly:true,  counter:true,  destroyed:true  },
  { key:'after',  jp:'④ ダメージ計算後',         quickMod:false, dsOnly:false, counter:true,  destroyed:true  },
  { key:'leave',  jp:'⑤ 追加誘発解決',           quickMod:false, dsOnly:false, counter:true,  destroyed:true  },
  { key:'end',    jp:'⑥ ダメージステップ終了時', quickMod:false, dsOnly:false, counter:true,  destroyed:true  },
];
function dsInfo(key){ return DAMAGE_STEPS.find(d=>d.key===key) || DAMAGE_STEPS[0]; }

/* 攻撃の進行状態。null なら戦闘中ではない。 */
function startBattle(p, atkIdx, target){
  const atk=gameState.players[p].mz[atkIdx]||null;
  const foe=p===0?1:0;
  const def=(target!=='direct')?(gameState.players[foe].mz[target]||null):null;
  if(atk) ensureCardUid(gameState,atk); if(def) ensureCardUid(gameState,def);
  gameState.battle = {
    player:p, atkIdx, target, atkUid:atk?atk.uid:null, targetUid:def?def.uid:null,
    step:'start',
    flipped:false,      // ②ダメージ計算前にリバースしたか
    flippedCard:null,   // リバースしたモンスターの実体（⑤で場を離れても追う）
    flipResolved:false, // ⑤でリバース効果を処理したか
    resolved:false,     // ③ダメージ計算を行ったか
    battled:false,      // ③-ⅱに入り「戦闘を行った」が確定したか
    defPosAtCalc:null,  // ③-ⅱ突入時の攻撃対象の表示形式
    cleaned:false,      // ⑤で戦闘破壊モンスターを場から取り除いたか
  };
}
function battleStepIndex(){
  const b = gameState.battle;
  return b ? DAMAGE_STEPS.findIndex(d=>d.key===b.step) : -1;
}

/* いま攻守増減を発動できるか。
   フリーチェーンの攻守変動は②ダメージ計算前まで。
   オネスト・カルートのような「ダメージステップ限定の効果」は
   ③-ⅰ ダメージ計算時まで発動できる（damageStepOnly:true を宣言する）。 */
function canModifyNow(){
  const b = gameState.battle;
  if(!b) return true;                 // 戦闘中でなければ制限なし
  const info = dsInfo(b.step);
  /* S03-U22: チェーンの解決中は、解決中のブロックの種類で判定する（誘発効果は段階を問わず適用できる）。 */
  const byLinkS03 = (typeof damageStepModifyAllowedS03==='function') ? damageStepModifyAllowedS03(info) : null;
  if(byLinkS03 !== null) return byLinkS03;
  if(ACTIVE_SCRIPT && ACTIVE_SCRIPT.damageStepOnly) return info.dsOnly;
  return info.quickMod;
}
/* 戦闘破壊が確定しているモンスターか。
   確定後は永続効果を出さず、効果の対象にも取れない（③-ⅴ以降）。 */
function battleDestroyConfirmed(card){
  return !!(card && card.battleDestroyed);
}
/* 場に残ったままの戦闘破壊確定モンスターがあるか */
function hasPendingBattleDestroy(){
  return gameState.players.some(P=>(P.mz||[]).some(c=>c && c.battleDestroyed));
}

/* =========================================================================
   同一タイミングで複数の誘発効果が発動した場合のチェーン処理順（SEGOC）
   ダメステマニュアルの原則：
     1. ターンプレイヤーの強制の誘発効果
     2. 非ターンプレイヤーの強制の誘発効果
     3. ターンプレイヤーの任意の誘発効果
     4. 非ターンプレイヤーの任意の誘発効果
   同じ区分の中の順番は、そのカードのコントローラーが決められる。
   ========================================================================= */
/* 公開領域の強制の誘発即時効果は、チェーン1のカードに対し
   必ずチェーン2として強制的に介入する。そのため、カウンター罠を
   チェーン1に対して発動することはできない（当時裁定）。 */
function forcedQuickWaiting(){
  return continuousSources().some(src => src.sc.forcedQuick === true);
}
function canActivateCounterTrap(){
  const chain = gameState.chain || [];
  if(chain.length !== 1) return true;        // チェーン1以外は通常どおり
  return !forcedQuickWaiting();
}

function segocRank(entry, turnPlayer){
  const forced = entry.forced ? 0 : 2;
  const nonTP  = (entry.player === turnPlayer) ? 0 : 1;
  return forced + nonTP;               // 0=TP強制 1=非TP強制 2=TP任意 3=非TP任意
}
/* entries: [{player, forced, name, ...}] を処理順に並べ替える。
   同順位内は元の並び（＝コントローラーの指定順）を保つ安定ソート。 */
function orderSimultaneous(entries, turnPlayer){
  const tp = (turnPlayer != null) ? turnPlayer : gameState.activePlayer;
  return entries
    .map((e,i)=>({e, i, r:segocRank(e, tp)}))
    .sort((a,b)=> a.r - b.r || a.i - b.i)
    .map(x=>x.e);
}

/* ②でリバースした攻撃対象を探す。
   ⑤の時点で墓地や除外に移動していても、リバース効果はフィールドで
   発動した扱いになるため、盤面外まで含めて追跡する。 */
function flippedDefender(b, fo){
  const P = gameState.players[fo];
  const onField = (P.mz||[])[b.target];
  if(onField) return onField;
  if(b.flippedCard) return b.flippedCard;
  return null;
}

/* ダメージステップを1段階進める。各段階で必要な処理と誘発を挟む。 */
/* この段階で発動できるカードが実際にあるか。
   どちらのプレイヤーも撃てるものが無ければ、止まる意味がない。 */
function damageStepHasCandidates(){
  const b = gameState.battle;
  if(!b) return false;
  for(let p=0; p<2; p++){
    const cands = reactableCards(p);
    for(const x of cands){
      const sc = CARD_SCRIPTS[x.db.n];
      if(!sc){ return true; }                       // 未実装カードは判定できないので止まる
      if(!timingCheck(sc).ok) continue;             // このタイミングでは撃てない
      if(sc.damageStepOnly ? !dsInfo(b.step).dsOnly
                           : !dsInfo(b.step).quickMod){
        // 攻守変動以外の効果はタイミング判定に任せる
        if(sc.dsTiming && sc.dsTiming !== b.step) continue;
      }
      if(sc.condition){
        const ctx = makeContext(p, x.card || zoneCard(gameState.players[p], x.zone, x.index),
                                x.zone, x.index, "react", {});
        let ok = true;
        try{ ok = sc.condition(ctx); }catch(e){ ok = false; }
        if(!ok) continue;
      }
      return true;
    }
  }
  return false;
}

/* 立ち止まる必要がある段階か。
   ③ダメージ計算時は結果を見せるため必ず止まる。
   それ以外は、発動できるカードや処理待ちがある場合だけ止まる。 */
function damageStepNeedsStop(){
  const b = gameState.battle;
  if(!b) return true;
  if(b.step === 'calc') return true;              // 計算結果は必ず見せる
  if(DS_PENDING_UI) return true;                  // 誘発の処理待ち
  return damageStepHasCandidates();
}

let DS_SKIP_DEPTH = 0;
function advanceDamageStepCoreV27(){
  const b = gameState.battle;
  if(!b) return;
  const i = battleStepIndex();
  if(i >= DAMAGE_STEPS.length-1){ endBattle(); return; }

  // 次の段階へ進み、その段階に「入った時」の処理を行う
  b.step = DAMAGE_STEPS[i+1].key;
  enterDamageStep();

  /* 何も起きない段階は自動で飛ばす。
     手動シミュレーターとしてタップ数を減らすための処理で、
     止まる必要がある段階では必ず立ち止まる。 */
  if(!DAMAGE_STEP_AUTOSKIP) return;
  if(!gameState.battle) return;                   // 効果で戦闘が終わっていることがある
  if(DS_SKIP_DEPTH > DAMAGE_STEPS.length) return; // 念のための保険
  if(damageStepNeedsStop()) return;
  DS_SKIP_DEPTH++;
  try{ advanceDamageStepCoreV27(); } finally{ DS_SKIP_DEPTH--; }
}

function advanceDamageStep(){
  if(PLAY_MODE===PLAY_MODES.DUEL){ requestProcessorV27(PROCESSOR_V27.DAMAGE_STEP,{}); return; }
  advanceDamageStepCoreV27();
}

/* 自動スキップを使うか。切りたい場合は false にする。 */
const DAMAGE_STEP_AUTOSKIP = true;

/* 現在の段階に入った時の自動処理を行う */
function enterDamageStep(){
  const b = gameState.battle;
  if(!b) return;

  /* ① ダメージステップ開始時に誘発する効果（カタストル・グラン・モール等） */
  if(b.step==='start'){
    if(afterDamageStep('start')){ DS_PENDING_UI = true; return; }
  }

  /* ② ダメージ計算前：裏側守備モンスターをリバースする（効果はまだ発動しない） */
  if(b.step==='before' && !b.flipped && b.target!=='direct'){
    const fo = b.player===0?1:0;
    const def = gameState.players[fo].mz[b.target];
    if(def && def.face==='down'){
      act({type:"FX_SET_STATE", player:fo, zone:'mz', index:b.target,
           face:'up', reason:'ダメージ計算前のリバース'});
      b.flipped = true;
      b.flippedCard = gameState.players[fo].mz[b.target] || def;
      showToast("裏側守備モンスターをリバース（効果は⑤追加誘発解決で発動）");
    }
  }

  /* ③ ダメージ計算時：実際に計算する */
  if(b.step==='calc' && !b.resolved){
    /* ③-ⅱ 攻守確定（戦闘突入）。
       この時点で「戦闘を行った」が確定し、以降に攻撃対象が消えても
       《剣闘獣》等の条件を満たす。表示形式もここの値を参照する。 */
    b.battled = true;
    if(b.target !== 'direct'){
      const def = gameState.players[b.player===0?1:0].mz[b.target];
      b.defPosAtCalc = def ? (def.face==='down' ? 'down' : def.pos) : null;
    }
    /* ③-ⅲ〜ⅴ ダメージ発生と戦闘破壊確定。破壊は確定するだけで場には残る */
    act({type:"ATTACK", player:b.player, atkIdx:b.atkIdx, target:b.target,
      battleCtxS03:(typeof battleContextSnapshotS03==='function') ? battleContextSnapshotS03(b) : null});   /* S03-U21 */
    b.resolved = true;
  }

  /* ⑤ 追加誘発解決：戦闘破壊されたモンスターが場を離れ、それを起点に誘発する。
     リバース効果もここで発動・処理する。②でリバースした事実があれば、
     この時点での存在場所を問わずフィールドで発動した扱いになる（当時裁定）。 */
  if(b.step==='leave'){
    /* まず戦闘破壊が確定したモンスターが実際に場を離れる */
    if(!b.cleaned){
      b.cleaned = true;
      act({type:"BATTLE_CLEANUP"});
    }
    /* 割拠・御前による墓地送りはCBを作らずここで処理する。
       その後にリバース効果を処理するため、スキルドレインを貫通する。 */
    if(enforceExclusions()){ DS_PENDING_UI = true; return; }
    if(b.flipped && !b.flipResolved){
      b.flipResolved = true;
      const fo = b.player===0?1:0;
      const def = flippedDefender(b, fo);
      if(def){
        const nm = cardName(def);
        const sc = CARD_SCRIPTS[nm];
        if(sc && sc.passive && sc.passive.onFlip){
          // 墓地へ送られていても、フィールドで発動した扱いで処理する
          if(emitEvent("onFlip", {player:fo, name:nm, card:def, treatAsField:true}))
            DS_PENDING_UI = true;
          renderBattle(); return;
        }
      }
    }
    if(afterDamageStep()){ DS_PENDING_UI = true; return; }
  }

  /* ④ ダメージ計算後：「ダメージ計算後」指定と戦闘ダメージ起点の誘発 */
  if(b.step==='after'){
    if(afterDamageStep('after')){ DS_PENDING_UI = true; return; }
  }

  renderBattle();
}

function endBattle(){
  const b = gameState.battle;
  const foe = b ? (b.player===0?1:0) : null;
  if(b && !b.cleaned && hasPendingBattleDestroy()) act({type:"BATTLE_CLEANUP"});
  gameState.battle = null; gameState.timingWindow=null;
  closeSheet(); render();
  // DUELはProcessorが次のPOINTへ戻す。旧manual callbackを割り込ませない。
  if(PLAY_MODE!==PLAY_MODES.DUEL && foe!=null) offerReactAfter(foe);
}

/* 戦闘の進行画面。今どの段階かと、そこで何ができるかを出す。 */
function renderBattle(){
  const b = gameState.battle;
  if(!b){ closeSheet(); render(); return; }
  const info = dsInfo(b.step);
  const P = gameState.players[b.player];
  const oppP = gameState.players[b.player===0?1:0];
  const atk = P.mz[b.atkIdx];
  const def = (b.target!=='direct') ? oppP.mz[b.target] : null;
  const foe = b.player===0?1:0;

  const steps = DAMAGE_STEPS.map((d,i)=>{
    const cur = d.key===b.step;
    const done = i < battleStepIndex();
    return `<span class="ds-step ${cur?'on':''} ${done?'done':''}">${i+1}</span>`;
  }).join('<span class="ds-arrow">›</span>');

  const atkTxt = atk ? `${cardName(atk)}（攻${curATK(atk)}）` : '—';
  const defTxt = def ? `${cardName(def)}（${def.pos==='def'?'守'+curDEF(def):'攻'+curATK(def)}）`
                     : (b.target==='direct' ? '直接攻撃' : '—');

  const modNote = info.canMod
    ? `<span class="ds-ok">攻守増減が使えます</span>`
    : `<span class="ds-ng">攻守増減はもう使えません</span>`;

  const myN = reactableCards(b.player).length;
  const foeN = reactableCards(foe).length;
  const reactRow = (myN || foeN) ? `
    <div class="act-label">この段階で割り込む</div>
    <div class="act-grid">
      ${foeN?`<div class="act" style="background:var(--trap);color:#120a1f;border-color:var(--trap)"
        onclick="closeSheet();openReactFor(${foe})">${nameOf(foe)} ${foeN}枚</div>`:''}
      ${myN?`<div class="act" onclick="closeSheet();openReactFor(${b.player})">自分 ${myN}枚</div>`:''}
    </div>` : "";

  const last = gameState.lastBattle;
  const result = (b.resolved && last) ? `
    <div class="ds-result">
      ${last.damage?`ダメージ ${last.damage} → ${nameOf(last.toPlayer)}`:'ダメージなし'}
      ${last.destroyedDef?' ／ 相手モンスター破壊':''}
      ${last.destroyedAtk?' ／ 自分モンスター破壊':''}
    </div>` : "";

  sheet.innerHTML = `<div class="grip"></div>
    <div class="ds-bar">${steps}</div>
    <h3 style="margin-bottom:4px">${info.jp}</h3>
    <div class="ds-vs">${atkTxt}<span class="ds-x">▶</span>${defTxt}</div>
    <div class="ds-note">${modNote}</div>
    ${result}
    ${reactRow}
    <div class="act-grid wide">
      <div class="act fx" onclick="advanceDamageStep()">
        ${b.step==='end' ? '戦闘を終える' : '次へ ▸ '+dsInfo(DAMAGE_STEPS[battleStepIndex()+1].key).jp}</div>
      ${b.step==='start' ? `<div class="act" onclick="cancelBattle()">攻撃を取りやめる</div>` : ''}
      ${b.step!=='start' ? `<div class="act" onclick="skipToEnd()">まとめて処理する</div>` : ''}
    </div>`;
  veil.classList.add("on");
  render();
}
function cancelBattle(){
  const b = gameState.battle;
  if(b){
    const P = gameState.players[b.player];
    if(P.mz[b.atkIdx]) P.mz[b.atkIdx].attacked = false;
  }
  gameState.battle = null;
  closeSheet(); render();
  showToast("攻撃を取りやめました");
}
/* 残りの段階を一気に処理する（テンポ重視の時用）。
   誘発の確認が出たらそこで止まる。 */
let DS_PENDING_UI = false;
function skipToEnd(){
  let guard = 0;
  while(gameState.battle && guard++ < 8){
    const before = gameState.battle.step;
    DS_PENDING_UI = false;
    advanceDamageStep();
    if(!gameState.battle) break;
    if(DS_PENDING_UI) break;                      // 誘発の確認が出たら止める
    if(gameState.battle.step === before) break;
  }
}

/* ハンバーガーメニュー（たまに使う操作） */
function openMenu(){
  const p = gameState.activePlayer;
  sheet.innerHTML = `<div class="grip"></div>
    <h3 style="margin-bottom:10px">メニュー</h3>
    <div class="act-label">プレイモード</div>
    <div class="act-grid">
      <div class="act fx" onclick="openModeMenu()">現在：${playModeJp(PLAY_MODE)}</div>
      <div class="act" onclick="openAutomationReport()">自動化状況</div>
    </div>
    <div class="act-label">デッキ</div>
    <div class="act-grid">
      <div class="act fx" onclick="startRabbitOpponentDuel()">⚡ 兎ラギアと対戦開始</div>
      <div class="act fx" onclick="startSelectedDeckDuel()">選択デッキで新規デュエル</div>
      <div class="act" onclick="openDeckLoad('saved')">保存デッキから</div>
      <div class="act" onclick="openDeckLoad('text')">テキストから</div>
      <div class="act" onclick="doShuffle();closeSheet()">シャッフル</div>
      <div class="act" onclick="closeSheet();openPile(${p},'deck')">デッキ操作</div>
      <div class="act" onclick="drawN()">まとめてドロー</div>
    </div>
    <div class="meta" style="margin:10px 2px 0;font-size:10.5px">
      カードデータ：<b style="color:${DB_SOURCE==='dummy'?'var(--forbidden)':'var(--gold-hi)'}">${CARD_DB.length}種（${DB_SOURCE==='dummy'?'お試し用':DB_SOURCE}）</b>
    </div>
    <div class="act-label">初手 / 先攻</div>
    <div class="act-grid">
      <div class="act" onclick="redrawHand()">初手を引き直す</div>
      <div class="act" onclick="openLP(${gameState.activePlayer})">ライフ計算機</div>
      <div class="act" onclick="setFirstPlayer(${gameState.activePlayer})">この人を先攻にする</div>
      <div class="act" onclick="coinToss()">コイントス</div>
      <div class="act" onclick="openAdsChainSettings()">ADSチェーン：${adsChainModeJp(ADS_CHAIN_MODE)}</div>
      ${typeof deviceSmokeMenuButtonV351==='function'?deviceSmokeMenuButtonV351():''}
      ${PLAY_MODE===PLAY_MODES.DEVELOPER?`<div class="act" onclick="openState()">状態を確認</div>
      <div class="act" onclick="openScriptDebug()">スクリプト デバッガー</div>
      <div class="act" onclick="openSystemSelfTestV2()">System Core v4.8.0 自己診断</div>
      <div class="act" onclick="openDuelCompletionRegressionV30()">1デュエル完走 回帰テスト</div>
      <div class="act" onclick="openProcessorDebugV27()">Processor Queue v4.8.0</div>
      <div class="act" onclick="openReplayDebugV41()">Replay / Runner v4.4</div>
      <div class="act fx" onclick="openDeviceSmokeV351()">📱 実機スモークテスト v4.7.0</div>
      <div class="act" onclick="openDeveloperTestPresets()">再現テスト（固定初手）</div>`:""}
      ${PLAY_MODE!==PLAY_MODES.DUEL?`<div class="act" onclick="openPrimitives(${gameState.activePlayer},null,null,'')">効果処理パレット</div>
      <div class="act" onclick="openTokenMenu()">トークンを出す</div>
      <div class="act" onclick="closeSheet();openDeckTop(${gameState.activePlayer},1)">デッキトップをめくる</div>`:""}
    </div>
    <div class="meta" style="margin:6px 2px 0;font-size:10.5px">
      先攻：<b style="color:var(--gold-hi)">${nameOf(gameState.firstPlayer??0)}</b>（1103は先攻ドローあり）
    </div>
    <div class="act-label">盤面</div>
    <div class="act-grid wide">
      <div class="act warn" onclick="if(confirm('盤面を全てリセットします。よろしいですか？')){doReset();}">盤面をリセット</div>
    </div>
    <button class="close" onclick="closeSheet()">閉じる</button>`;
  veil.classList.add("on");
}
function drawN(){
  const n = parseInt(prompt("何枚ドローしますか？","5")||"0",10);
  if(n>0){ act({type:"DRAW", n}); }
  closeSheet();
}
function doReset(){
  const seed=(typeof v41SeedFromNow==='function')?v41SeedFromNow():((Date.now()>>>0)||0x6d2b79f5);
  act({type:"RESET_GAME_V43",seed});
  if(typeof v41ResetActionJournal==='function') v41ResetActionJournal(gameState);
  turnActions = [];
  render(); closeSheet();
}
/* 初手引き直し：手札を山に戻す→シャッフル→5枚 */
function redrawHand(){
  const p = gameState.activePlayer;
  const P = gameState.players[p];
  if(!P.hand.length && !P.deck.length){ showToast("先にデッキを読み込むか、テストデッキで開始してください"); return; }
  act({type:"REDRAW_HAND_V43",player:p});
  turnActions = [];
  render(); closeSheet();
}

/* ---- モーダル ---- */
const veil = document.getElementById("veil");
const sheet = document.getElementById("sheet");
const peekBar = document.getElementById("peekBar");
function closeSheet(){ veil.classList.remove("on"); }

/* =========================================================================
   効果処理の中断とやり直し
   効果の解決中にシートを閉じると、コストだけ払われた中途半端な状態が
   残ってしまう。解決を始めた時点の履歴位置を覚えておき、
   中断したらそこまで自動で巻き戻す。
   ========================================================================= */
let RESOLVE_ANCHOR = null;      // 解決開始時の HISTORY の長さ
let RESOLVE_NAME   = "";

function beginResolve(name){
  if(RESOLVE_ANCHOR != null) return;    // 入れ子では最初の1つだけを覚える
  RESOLVE_ANCHOR = HISTORY.length;
  RESOLVE_NAME = name || "効果";
}
function endResolve(){ RESOLVE_ANCHOR = null; RESOLVE_NAME = ""; }

/* 解決を中断して、始める前の盤面に戻す */
function abortResolve(){
  const anchor = RESOLVE_ANCHOR;
  endResolve();
  CHAIN_AFTER = null;      // 巻き戻すので、チェーンの後始末は行わない
  if(anchor == null){ closeSheet(); return; }
  let n = 0;
  while(HISTORY.length > anchor){ undo(); n++; }
  closeSheet();
  showToast(n ? `処理を中断して元に戻しました` : "処理を中断しました");
  render();
}

/* シートを閉じようとしたとき。解決中なら確認する。 */
function dismissSheet(){
  if(RESOLVE_ANCHOR == null){ closeSheet(); return; }
  const moved = HISTORY.length > RESOLVE_ANCHOR;
  const msg = moved
    ? `${RESOLVE_NAME} の処理を中断します。\nここまでの処理を取り消して元の盤面に戻しますか？`
    : `${RESOLVE_NAME} の処理を中断しますか？`;
  if(!confirm(msg)) return;      // 誤タップならシートを閉じない
  abortResolve();
}

/* =========================================================================
   選択中に盤面を確認する
   シートを一時的に隠して盤面を見られるようにし、
   「選択に戻る」で元のシートへ復帰する。
   ========================================================================= */
let PEEK_HTML = null;
function peekBoard(){
  PEEK_HTML = sheet.innerHTML;
  veil.classList.remove("on");
  peekBar.classList.add("on");
}
function peekReturn(){
  peekBar.classList.remove("on");
  if(PEEK_HTML != null){ sheet.innerHTML = PEEK_HTML; PEEK_HTML = null; }
  veil.classList.add("on");
}

/* 誤タップでの取り消しを防ぐため、幕のタップでは閉じない */
veil.addEventListener("click", e=>{
  if(e.target !== veil) return;
  if(RESOLVE_ANCHOR != null) return;    // 解決中は幕タップを無視する
  /* S03-U173: 取り消せない選択（破壊の身代わりなど）は幕タップで閉じない（閉じると選び直す手段が無く、不使用と誤解される） */
  if(typeof pendingChoiceV49==='function' && pendingChoiceV49(gameState) && pendingChoiceV49(gameState).cancelable===false) return;
  closeSheet();
});

function cardMeta(db){
  if(db.k==='m'){
    return `${(db.st||[]).join("・")} / ${db.at}属性 / ${db.ra}族 / Lv${db.lv}<br>ATK ${db.atk} / DEF ${db.def}`;
  }
  const sub = db.sub? `（${db.sub}）`:"";
  return `${db.k==='s'?'魔法':'罠'}カード${sub}`;
}
function cardThumb(db){
  const src = db.c ? `${IMG_BASE}${db.c}.webp` : "";
  return `<div class="sheet-thumb"><img src="${src}" onerror="this.style.display='none'"></div>`;
}
function metaHead(db){
  return `<div class="grip"></div>
  <div class="sheet-card">
    ${cardThumb(db)}
    <div class="sheet-info">
      <h3>${db.n||"カード"}</h3>
      <div class="meta">${cardMeta(db)}</div>
    </div>
  </div>
  ${db.e?`<div class="eff">${db.e}</div>`:""}`;
}

/* 手札のカードをタップ */
function openHand(i){
  if(PLAY_MODE===PLAY_MODES.DUEL) return openHandDuel(i);
  const P = gameState.players[gameState.activePlayer];
  const c = P.hand[i]; const db = dbOf(c);
  const p = gameState.activePlayer;
  const nm = db.n||"";
  const eff = hasEffect(nm);
  const R = rules();
  const ph = phaseJp(gameState.phase);
  let primary = "", secondary = "";

  /* できない操作はグレーで理由を出す（消すと「なぜ無いのか」が分からないため） */
  const btn = (ok, label, onclick, why, cls)=> ok
    ? `<div class="act ${cls||''}" onclick="${onclick}">${label}</div>`
    : `<div class="act blocked" onclick="showToast('${why}')">${label}<span class="bk">${ph}不可</span></div>`;

  if(db.k==='m'){
    const nsLeft = (typeof normalRightFreeS03==='function') ? normalRightFreeS03(P) : !P.normalSummonUsed;   /* S03-U274 */
    const nsWhy  = !R.normalSummon ? whyBlocked('normalSummon') : 'このターンは既に通常召喚しています';
    primary =
      btn(R.normalSummon && nsLeft, "通常召喚（攻撃）", `doNormalSummon(${i},'atk')`, nsWhy) +
      btn(R.normalSummon && nsLeft, "通常召喚（守備）", `doNormalSummon(${i},'def')`, nsWhy) +
      btn(R.setCard && nsLeft,      "セット（裏守備）", `doSetMonster(${i})`, nsWhy) +
      `<div class="act" onclick="doSpecialFromHand(${i},'atk')">特殊召喚（攻撃）</div>
       <div class="act" onclick="doSpecialFromHand(${i},'def')">特殊召喚（守備）</div>`;
    // 手札で発動する誘発（スクリプト宣言 or テキスト推定）
    const scH = CARD_SCRIPTS[nm];
    if(canActivateFromZone(db, 'hand')){
      primary = (scH
        ? `<div class="act fx" onclick="closeSheet();runScript(${jsStr(nm)},${p},'hand',${i})">⚡ 手札から効果を発動</div>`
        : `<div class="act fx" onclick="closeSheet();openPrimitives(${p},'hand',${i},${jsStr(nm)})">⚡ 手札から効果を発動（手動）</div>`) + primary;
    } else if(eff && CARD_EFFECT[nm]){
      primary = `<div class="act fx" onclick="closeSheet();runEffect(${p},${jsStr(nm)},{zone:'hand',index:${i}})">⚡ 手札から効果を発動</div>` + primary;
    }
    secondary = `
      <div class="act" onclick="fromHand(${i},'grave')">墓地へ捨てる</div>
      <div class="act" onclick="fromHand(${i},'banish')">除外</div>
      <div class="act" onclick="fromHand(${i},'deck')">デッキトップへ</div>`;
  } else {
    const toField = db.sub==="フィールド";
    const dest = toField ? 'field' : 'sz';
    const canAct = canActivateNow(db);
    const ss = spellSpeedOf(db);
    const why = `${ph}では通常魔法は発動できません（速攻魔法・罠のみ）`;
    primary =
      (eff ? btn(canAct, "⚡ 発動（効果を自動処理）", `activateFromHand(${i})`, why, "fx") : "") +
      btn(canAct, "発動（チェーンへ）", `handActivate(${i})`, why) +
      btn(R.setCard, "セット（裏）", `doSetST(${i},${toField})`, whyBlocked('setCard'));
    secondary = `
      <div class="act" onclick="fromHand(${i},'grave')">墓地へ捨てる</div>
      <div class="act" onclick="fromHand(${i},'banish')">除外</div>`;
  }
  secondary += `<div class="act" onclick="closeSheet();openPrimitives(${p},'hand',${i},${jsStr(nm)})">手動で効果処理…</div>`;
  const ssTag = db.k!=='m' ? `<span class="ss-tag">SS${spellSpeedOf(db)}</span>` : "";
  sheet.innerHTML = metaHead(db) +
    `<div class="phase-note">${ph}：${R.note}${ssTag}</div>` +
    (eff?`<div class="fx-note">このカードは効果を自動処理できます${clNote(p, nm, c)}</div>`:"") +
    `<div class="act-label">プレイ</div><div class="act-grid">${primary}</div>
     <div class="act-label">その他へ送る</div><div class="act-grid">${secondary}</div>
     <button class="close" onclick="closeSheet()">閉じる</button>`;
  veil.classList.add("on");
}

/* 手札から魔法・罠を発動 → 場に置いてから効果を自動処理 */
function activateFromHand(i){
  const p = gameState.activePlayer;
  const P = gameState.players[p];
  const c = P.hand[i]; const db = dbOf(c);
  const nm = db.n||"";
  const toField = db.sub==="フィールド";
  const to = toField ? "field" : "sz";
  if(to==="sz" && P.sz.length>=ZONE_LIMITS.sz){ showToast("魔法・罠ゾーンが一杯です"); return; }
  if(to==="field" && P.field){ showToast("フィールドゾーンが埋まっています"); return; }
  closeSheet();
  /* S03-U36 (C-S03-28 MANUAL): MOVE の前の Journal 位置。効果の処理を始める時に控えとして使う。 */
  const prepSeqU36 = (typeof V41_ACTION_SEQ!=='undefined') ? V41_ACTION_SEQ : 0;
  act({type:"MOVE", player:p, from:"hand", fromIndex:i, to, face:"up"});
  // 場に出した「後」の位置を取る（先に取ると -1 になり、自身を墓地へ送れない）
  const P2 = gameState.players[p];
  const idx = (to==="field") ? 0 : P2.sz.length-1;
  const keep = (db.sub==="永続" || db.sub==="フィールド" || db.sub==="装備");
  logIt(gameState, `<b>${nm}</b> を発動`);
  render();
  /* S03-U31 (C-S03-07 MANUAL): 宣言した永続・フィールドカードは「カードの発動」だけを行う。
     効果・コスト・回数制限は使わず、表側で場に残す。効果は表側のカードから別に発動する。 */
  const scU31 = CARD_SCRIPTS[nm];
  const placedU31 = (to==="field") ? gameState.players[p].field : gameState.players[p].sz[idx];
  if(typeof cardActivationOnlyV32==='function'
     && cardActivationOnlyV32(nm, scU31, db, to, placedU31, {cardActivation:true})){
    logIt(gameState, `${nm} の発動が成立（効果は発動していません）`);
    render(); return;
  }
  /* S03-U31: P1.1（activationV11）のカードは、モード選択とコストを正しく通すため発動パイプラインを使う。
     コミット後の解決は commitPreparedActivationV11 が DUEL 以外でも開始する。 */
  if(scU31 && typeof scU31.activationV11==='function' && typeof prepareDuelActivation==='function'){
    askChain(`${nm} の発動`, ()=>{ prepareDuelActivation(nm, p, to, idx, {noPriority:true}); render(); });
    return;
  }
  // 発動に対してチェーンできるので確認してから効果を処理する
  /* S03-U36: 効果を処理している間（legacy のコスト・対象選択待ちを含む）だけ控えを持つ。askChain の応答待ちは対象外。 */
  if(typeof noteManualActivationPromptS03==='function') noteManualActivationPromptS03(p, placedU31, nm, prepSeqU36);   /* S03-U37 */
  askChain(`${nm} の発動`, ()=>{
    if(typeof clearManualActivationPromptS03==='function') clearManualActivationPromptS03();
    if(typeof beginActivationPrepS03==='function') beginActivationPrepS03(p, placedU31, nm, prepSeqU36);
    runEffect(p, nm, {zone:to, index:idx, keep});
    if(typeof settleActivationPrepS03==='function') settleActivationPrepS03();
    render();
  });
}

/* ---- 新プリミティブを使う UI ラッパ ---- */
/* このモンスターの通常召喚に必要なリリース数。
   レベル5-6は1体、7以上は2体。特例は tributeOverride で調整する。 */
function tributesNeeded(db, p){
  const lv = db.lv || 0;
  let n = lv >= 7 ? 2 : (lv >= 5 ? 1 : 0);
  // 歯車街：「アンティーク・ギア」の必要リリースを1体少なくできる
  if(n > 0 && String(db.n||'').indexOf('古代の機械') >= 0 && gearTownActive()) n -= 1;
  return Math.max(0, n);
}
