/* =========================================================================
   S03-U28 — 対象にされた時に自動で働く無効化（永続効果）
   -------------------------------------------------------------------------
   ミドル・シールド・ガードナー 「裏側表示のこのモンスター1体を対象とする魔法カードの発動を無効にする。その時、このカードは表側守備表示になる。」
   アルカナフォース0－THE FOOL 「●表:このカードを対象にする自分のカードの効果を無効にし破壊する。●裏:このカードを対象にする相手のカードの効果を無効にし破壊する。」
   2011 wiki：THE FOOL の表・裏の効果の種別は永続効果。
   以前は onActivateSuccess の誘発効果として書かれていたが、発動に対するチェーンの誘発ではないので S03-U19 で遅れた誘発として止め、
   何も無効にしていなかった。
   ■ 宣言したカード（cards/H7）だけ
     チェーンに発動を積んだ直後（CHAIN_ADD の直後）に、そのリンクが対象にしたモンスターゾーンのカードが宣言済みで、条件を満たすなら、
     negateChainLinkV13（CHAIN_NEGATE_LINK と必要なら FX_TO_GRAVE、どちらも Action）でそのリンクを無効にし、後処理を行う。
     チェーンブロックは作らない。
   spec.applies({link, srcDb, negator, targets}) → {mode:'activation'|'effect', destroySource, reason} か null。
   targets は復号したそのリンクの対象一覧（S03-U32）。「このカード1枚だけを対象にする」条件の判定に使う。
   spec.after({link, negator}) … 無効にした後の処理（Action で行う）。
   ========================================================================= */
const TARGETING_NEGATOR_S03 = {};
function declareTargetingNegatorS03(name, spec){ TARGETING_NEGATOR_S03[name] = spec || {}; }
function targetingNegatorSpecS03(name){ return TARGETING_NEGATOR_S03[name] || null; }

function applyTargetingNegatorsS03(){
  const chain = (gameState && gameState.chain) || [];
  const link = chain[chain.length - 1];
  if(!link || link.negated || link.chainId == null || !link.targets) return false;
  const restored = (typeof deserializeChainSelectionV2 === 'function') ? deserializeChainSelectionV2(link.targets) : [];
  const list = (Array.isArray(restored) ? restored : [restored]).filter(Boolean);
  const srcDb = (link.cardId != null && CARD_DB[link.cardId]) ? CARD_DB[link.cardId] : null;
  for(const t of list){
    const h = (t && t.card) ? locateCardAnyV4(t.card) : null;
    if(!h || h.zone !== 'mz' || !h.card) continue;
    const spec = targetingNegatorSpecS03(dbOf(h.card).n);
    if(!spec || typeof spec.applies !== 'function') continue;
    if(typeof effectNegated === 'function' && effectNegated(h.card)) continue;
    let r = null;
    try{ r = spec.applies({link, srcDb, negator:h, targets:list}); }catch(e){ r = null; }
    if(!r) continue;
    if(!negateChainLinkV13(link.chainId, r.mode === 'effect' ? 'effect' : 'activation', r.reason || dbOf(h.card).n, !!r.destroySource)) continue;
    if(typeof spec.after === 'function'){
      try{ spec.after({link, negator:locateCardAnyV4(h.card)}); }catch(e){}
    }
    return true;
  }
  return false;
}
