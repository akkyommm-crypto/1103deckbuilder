/* =========================================================================
   System v12 — Activation event / ChainSource identity primitive
   -------------------------------------------------------------------------
   「魔法カードが発動する度に」「相手が罠カードを発動した時」
   「カウンター罠が発動する度に」を共通化する。

   既に存在するので**作り直さない**もの:
     CHAIN_ADD Action と gs.chain … 発動そのものとチェーンリンク
     db.sub（速攻／永続／装備／フィールド／カウンター／儀式）
     queueDeferredEventV2 / flushDeferredEventsV2 … 誘発の提示
     API.addCounter / countCounter … 魔力カウンター
     P1 ChoiceRequest / P3 provenance / P4 predicate
     v7 scheduler / v9 leave-field / v10 position / v11 token

   足りないので足すもの:
     1. 「カードの発動に成功した」を知らせる中央イベント。
        発動したプレイヤー・種類（魔法/罠/モンスター効果）・
        細分類（速攻/永続/装備/フィールド/カウンター/儀式/通常）・
        チェーンリンクの identity を持つ。
     2. そのイベントから発動元カードを引く手段（ChainSource identity）。

   ■ 既存の onCardActivate について
     EVENTS には onCardActivate が宣言されているが、engine のどこからも
     発火していない（神の宣告は passive に宣言しているだけで、実際の
     応答は askChain 側の chain 応答経路で提示される）。
     ここで onCardActivate を発火させると、神の宣告の提示経路が
     二重になり既存の挙動が変わる。意味も
       onCardActivate    … 「発動に対して」応答する窓（既存経路）
       onActivateSuccess … 「発動した時／発動する度に」の誘発（今回）
     と異なるため、別名の新しいイベントとして足す。

   ■ Replay 安全性
     - 発火は CHAIN_ADD Action の中。deferredEvents は digest に含まれるので、
       Action を直接再適用する再生でも同じ順序・同じ内容になる。
     - state は純JSON。identity は uid と chainId。カード名を authority に
       しない。直近の発動は1件だけ保持して上書きする（v8 lastDrawV8 と同じ）。
   ========================================================================= */

const ACTIVATION_KINDS_V12 = Object.freeze(['spell','trap','monster']);
/* db.sub は日本語。engine 内部では英字キーへ正規化して扱う。 */
const ACTIVATION_SUB_V12 = Object.freeze({
  '速攻':'quick', '永続':'continuous', '装備':'equip',
  'フィールド':'field', 'カウンター':'counter', '儀式':'ritual',
});

function activationKindV12(db){
  if(!db) return null;
  if(db.k === 's') return 'spell';
  if(db.k === 't') return 'trap';
  if(db.k === 'm') return 'monster';
  return null;
}
function activationSubKindV12(db){
  if(!db) return null;
  if(db.k === 'm') return 'effect';
  const sub = db.sub || '';
  return ACTIVATION_SUB_V12[sub] || 'normal';
}

/* チェーンリンクからイベント payload を作る。純JSONだけを返す。 */
function makeActivationEventV12(gs, link){
  if(!link) return null;
  const db = (link.cardId != null && typeof CARD_DB !== 'undefined') ? (CARD_DB[link.cardId] || null) : null;
  return {
    uid: (link.uid != null) ? link.uid : null,
    player: link.player,
    kind: activationKindV12(db),
    sub: activationSubKindV12(db),
    chainId: link.chainId,
    chainLink: (gs && Array.isArray(gs.chain)) ? gs.chain.length : 1,
    cardId: (link.cardId != null) ? link.cardId : null,
  };
}

/* CHAIN_ADD の中から呼ぶ。ここ以外から発火させない。 */
function v12EmitActivation(gs, link){
  if(!gs || !link) return null;
  const evt = makeActivationEventV12(gs, link);
  if(!evt || !evt.kind) return null;
  gs.lastActivationV12 = evt;
  /* S03-U253: per-turn record of what each player activated (「相手が魔法・罠・効果モンスターの効果を発動したターン」).
     temporaryFlags is cleared at every turn start; written here, inside the CHAIN_ADD reducer, so Replay reproduces it. */
  const actP = gs.players && gs.players[evt.player];
  if(actP){
    const tf = actP.temporaryFlags || (actP.temporaryFlags = {});
    const rec = tf.activatedKindsS03 || (tf.activatedKindsS03 = {});
    rec[evt.kind] = true;
    /* S03-U260: card activations of Spells / Traps (from the hand or Set — link.cardActivationS03), for 「1ターンに1度しか魔法・罠カードを発動できない」 */
    if(link.cardActivationS03 && (evt.kind==='spell' || evt.kind==='trap')) rec[evt.kind+'Card'] = true;
  }
  if(typeof queueDeferredEventV2 === 'function'
     && typeof PLAY_MODE !== 'undefined' && PLAY_MODE === PLAY_MODES.DUEL){
    queueDeferredEventV2('onActivateSuccess', evt);
  }
  return evt;
}

/* ---- 参照ヘルパ（テスト・カードスクリプト用） ---------------------------- */
function lastActivationV12(gs){ gs = gs || gameState; return gs.lastActivationV12 || null; }
function activationIsV12(evt, kind, sub){
  if(!evt || evt.kind !== kind) return false;
  return sub ? (evt.sub === sub) : true;
}
function isSpellActivationV12(evt, sub){ return activationIsV12(evt, 'spell', sub); }
function isTrapActivationV12(evt, sub){ return activationIsV12(evt, 'trap', sub); }
function isCounterTrapActivationV12(evt){ return activationIsV12(evt, 'trap', 'counter'); }
/* 発動元カード。コストで場を離れている場合は null になる。 */
function activationSourceV12(evt){
  if(!evt || evt.uid == null || typeof findCardByUid !== 'function') return null;
  return findCardByUid(evt.uid);
}
/* そのチェーンリンクが今も残っているか（無効化の判定に使う） */
function activationLinkV12(gs, evt){
  gs = gs || gameState;
  if(!evt || !Array.isArray(gs.chain)) return null;
  return gs.chain.find(x => x && x.chainId === evt.chainId) || null;
}

/* ---- 直列化の検査（テスト用） ------------------------------------------- */
function assertActivationStateSerializableV12(gs){
  gs = gs || gameState;
  const last = gs.lastActivationV12;
  if(last == null) return null;
  if(typeof last !== 'object') return 'lastActivationV12 が object でない';
  for(const k of Object.keys(last)){
    const v = last[k];
    if(v != null && typeof v !== 'number' && typeof v !== 'string'){
      return 'lastActivationV12.' + k + ' が JSON 化できない';
    }
  }
  try{ JSON.parse(JSON.stringify(last)); }
  catch(e){ return 'lastActivationV12 が JSON 化できない'; }
  return null;
}
