/* =========================================================================
   System v15 — Equip primitive（装備の適正・装備イベント・装備先スコープ）
   -------------------------------------------------------------------------
   「〜のみ装備可能」「装備された時」「別の正しい対象へ移し替える」
   「装備モンスターは〜」を共通化する。

   既に存在するので**作り直さない**もの:
     FX_EQUIP / FX_UNEQUIP / FX_MONSTER_EQUIP_V46 … 装備そのもの
     eq.equipUid / eq.equipTo{p,uid} / mon.equippedBy[]  … 既存の結び方
     dropEquips（装備モンスターが場を離れた時の後片付け）
     API.equipSpell / API.unequip
     continuousSources / continuousReaches … 永続効果の既存規約
     battleProof … 戦闘破壊耐性（自身の宣言とテキスト推定）
     P1 ChoiceRequest / P4 predicate / v10 Position / v13 Negation /
     v14 StatModifier

   足りないので足すもの:
     1. 装備の適正を**宣言的**に持つ場所と、任意の装備カードについて
        「このモンスターに装備できるか」を engine 側から問える関数。
        （移し替え系カードは、相手の装備カードの適正まで知る必要がある）
     2. 装備された / 外れた を知らせる中央イベント。
     3. 永続効果が「自分の装備先モンスター」だけに届くスコープ。
     4. 装備元から与える戦闘破壊耐性（既存 battleProof の継続版）。

   ■ カード名分岐を engine に書かない
     適正はカードスクリプト側の sc.equipSpec.canEquip(handle, eqCard) で
     宣言する。engine はそれを呼ぶだけで、名前を見ない。宣言が無い装備
     カードは「表側表示のモンスターなら誰でも可」として扱う。

   ■ Replay 安全性
     - 新しい state を増やさない。既存の装備リンクをそのまま使う。
       → digest は装備カードが無ければ一切変わらない。
     - イベントは FX_EQUIP / FX_UNEQUIP の中（applyAction 内）で積むので
       Action を直接再適用する再生でも同じ順序になる。
   ========================================================================= */

/* ---- 装備の適正 ---------------------------------------------------------- */
/* eqCard を monHandle（{p,zone,index,card}）へ装備できるか。 */
function equipSpecV15(eqCard){
  if(!eqCard) return null;
  const sc = (typeof CARD_SCRIPTS !== 'undefined') ? CARD_SCRIPTS[dbOf(eqCard).n] : null;
  return (sc && sc.equipSpec) ? sc.equipSpec : null;
}
function equipLegalV15(eqCard, monHandle){
  if(!eqCard || !monHandle || !monHandle.card) return false;
  if(monHandle.zone !== 'mz' || monHandle.card.face !== 'up') return false;
  const spec = equipSpecV15(eqCard);
  if(!spec || typeof spec.canEquip !== 'function') return true;
  /* 呼び出し側が db を持たないハンドルを渡してくる事があるので補う。
     カード側の宣言は必ず h.db を見られる状態にしておく。 */
  const h = (monHandle.db != null) ? monHandle
          : Object.assign({}, monHandle, {db:dbOf(monHandle.card)});
  try{ return !!spec.canEquip(h, eqCard); }catch(e){ return false; }
}
/* その装備カードを装備できる、場の表側モンスターの一覧 */
function equipLegalTargetsV15(eqCard){
  if(typeof API === 'undefined' || !API.fieldCards) return [];
  return API.fieldCards({zone:'mz', filter:x=>x.card.face === 'up'})
    .filter(x=>equipLegalV15(eqCard, x));
}

/* ---- 装備の参照 ---------------------------------------------------------- */
/* そのモンスターに装備されているカードのハンドル一覧 */
function equipsOnV15(monCard, gs){
  gs = gs || gameState;
  const out = [];
  if(!monCard || !Array.isArray(monCard.equippedBy) || !monCard.equippedBy.length) return out;
  for(let p=0;p<2;p++){
    const P = gs.players[p]; if(!P) continue;
    (P.sz||[]).forEach((c,i)=>{
      if(!c || c.equipUid == null) return;
      if(monCard.equippedBy.indexOf(c.equipUid) < 0) return;
      out.push({p, zone:'sz', index:i, card:c, db:dbOf(c)});
    });
  }
  return out;
}
function equippedCountV15(monCard, gs){ return equipsOnV15(monCard, gs).length; }
/* 装備カードが今ついているモンスターのハンドル */
function equippedMonsterOfV15(eqCard, gs){
  gs = gs || gameState;
  if(!eqCard || !eqCard.equipTo || eqCard.equipTo.uid == null) return null;
  const P = gs.players[eqCard.equipTo.p]; if(!P) return null;
  const i = (P.mz||[]).findIndex(m => m && m.uid === eqCard.equipTo.uid);
  if(i < 0) return null;
  return {p:eqCard.equipTo.p, zone:'mz', index:i, card:P.mz[i], db:dbOf(P.mz[i])};
}

/* ---- 装備イベント（FX_EQUIP / FX_UNEQUIP の中から呼ぶ） ------------------ */
function makeEquipEventV15(o){
  return {equipUid:(o.equipUid != null) ? o.equipUid : null,
          uid:(o.uid != null) ? o.uid : null,
          player:o.player, targetPlayer:o.targetPlayer};
}
function v15EmitEquipEvent(gs, name, o){
  if(!gs) return null;
  const evt = makeEquipEventV15(o);
  if(typeof queueDeferredEventV2 === 'function'
     && typeof PLAY_MODE !== 'undefined' && PLAY_MODE === PLAY_MODES.DUEL){
    queueDeferredEventV2(name, evt);
  }
  return evt;
}
/* イベントから装備カード / 装備モンスターを引く */
function equipCardOfEventV15(evt, gs){
  gs = gs || gameState;
  if(!evt || evt.equipUid == null) return null;
  for(let p=0;p<2;p++){
    const P = gs.players[p]; if(!P) continue;
    const i = (P.sz||[]).findIndex(c => c && c.equipUid === evt.equipUid);
    if(i >= 0) return {p, zone:'sz', index:i, card:P.sz[i], db:dbOf(P.sz[i])};
  }
  return null;
}
function equipMonsterOfEventV15(evt, gs){
  if(!evt || evt.uid == null || typeof findCardByUid !== 'function') return null;
  return findCardByUid(evt.uid);
}

/* ---- 取り外し ------------------------------------------------------------
   既存 API.unequip は v46MonsterEquip（モンスターを装備扱いにしたもの）
   専用の入口なので、通常の装備魔法も外せる汎用版をここに置く。      */
function detachEquipV15(eqHandle, reason){
  if(!eqHandle || eqHandle.zone !== 'sz' || !eqHandle.card || !eqHandle.card.equipTo) return false;
  act({type:'FX_UNEQUIP', player:eqHandle.p, szIndex:eqHandle.index, reason});
  return !eqHandle.card.equipTo;
}

/* ---- 移し替え ------------------------------------------------------------ */
/* 装備カードを別の正しい対象へ移す。適正が無ければ何もしない。 */
function moveEquipV15(eqHandle, monHandle, reason){
  if(!eqHandle || !monHandle) return false;
  if(eqHandle.zone !== 'sz' || monHandle.zone !== 'mz') return false;
  if(!equipLegalV15(eqHandle.card, monHandle)) return false;
  act({type:'FX_UNEQUIP', player:eqHandle.p, szIndex:eqHandle.index, reason});
  const now = (typeof locateCardAnyV4 === 'function') ? locateCardAnyV4(eqHandle.card) : null;
  const dst = (typeof locateCardAnyV4 === 'function') ? locateCardAnyV4(monHandle.card) : null;
  if(!now || now.zone !== 'sz' || !dst || dst.zone !== 'mz') return false;
  act({type:'FX_EQUIP', player:now.p, szIndex:now.index,
       targetP:dst.p, targetMz:dst.index, reason});
  return !!(now.card.equipTo && now.card.equipTo.uid === dst.card.uid);
}

/* ---- 装備元が与える戦闘破壊耐性 ------------------------------------------ */
/* 既存 battleProof(card) は「そのカード自身の宣言／テキスト」だけを見る。
   装備カードのように外から与える場合はここで拾う。                        */
function battleProofGrantedV15(card){
  if(!card || typeof continuousSources !== 'function') return false;
  const loc = (typeof locateCard === 'function') ? locateCard(card) : null;
  if(!loc || loc.zone !== 'mz') return false;
  return continuousSources().some(src=>{
    const f = src.sc.continuous && src.sc.continuous.battleProof;
    if(typeof f !== 'function') return false;
    if(!continuousReaches(src.sc.continuous.scope || 'self', src.p, loc, src.card, card)) return false;
    try{ return !!f(card, src.card); }catch(e){ return false; }
  });
}

/* ---- 直列化の検査（テスト用） -------------------------------------------- */
/* v15 は新しい state を持たない。既存の装備リンクが壊れていないかだけ見る。 */
function assertEquipStateSerializableV15(gs){
  gs = gs || gameState;
  for(let p=0;p<2;p++){
    const P = gs.players && gs.players[p]; if(!P) continue;
    for(const c of (P.sz||[])){
      if(!c || c.equipTo == null) continue;
      if(typeof c.equipTo !== 'object') return 'equipTo が object でない';
      if(c.equipTo.uid != null && typeof c.equipTo.uid !== 'number') return 'equipTo.uid が数値でない';
      if(c.equipUid != null && typeof c.equipUid !== 'number') return 'equipUid が数値でない';
    }
    for(const m of (P.mz||[])){
      if(!m || m.equippedBy == null) continue;
      if(!Array.isArray(m.equippedBy)) return 'equippedBy が配列でない';
      if(m.equippedBy.some(u => typeof u !== 'number')) return 'equippedBy が数値でない';
    }
  }
  return null;
}
