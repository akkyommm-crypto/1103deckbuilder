/* =========================================================================
   S03-U66 — C-S03-24 extension: protecting OTHER cards, not just yourself.
   -------------------------------------------------------------------------
   engine/1T_targeting_negation_s03.js's declareTargetingNegatorS03 only fires for a card that is itself one
   of the chain link's targets (dbOf(h.card).n is looked up on the TARGETED card). That covers 無敗将軍 フリー
   ド／カオス・マジシャン ("...このカードを対象にする...") but not ダーク・ジェネラル フリード, whose real
   text protects *every* face-up DARK monster the controller has, not only itself:
     「自分フィールド上に表側表示で存在する闇属性モンスターを対象にする魔法カードの効果を無効にし破壊する。」
   ■ 宣言したカード（cards/H8B）だけ
     applyTargetingNegatorsS03() と同じ CHAIN_ADD 直後のタイミングで、リンクの対象一覧の中から表側表示の
     モンスターゾーンのカードを見つけ、その持ち主の他の表側表示モンスターゾーンのカードで宣言されているものが
     あれば spec.applies を呼ぶ。無効化そのものは同じ negateChainLinkV13 を使う。チェーンブロックは作らない。
   spec.applies({link, srcDb, protector, target, targets}) → {mode:'activation'|'effect', destroySource, reason} か null。
     protector: 宣言側（守っているカード）の located 情報。target: 対象にされた側の located 情報。
   spec.after({link, protector, target}) … 無効にした後の処理（Action で行う）。
   ========================================================================= */
const TARGETING_PROTECTOR_S03 = {};
function declareTargetingProtectorS03(name, spec){ TARGETING_PROTECTOR_S03[name] = spec || {}; }
function targetingProtectorSpecS03(name){ return TARGETING_PROTECTOR_S03[name] || null; }

function applyTargetingProtectorsS03(){
  const chain = (gameState && gameState.chain) || [];
  const link = chain[chain.length - 1];
  if(!link || link.negated || link.chainId == null || !link.targets) return false;
  const restored = (typeof deserializeChainSelectionV2 === 'function') ? deserializeChainSelectionV2(link.targets) : [];
  const list = (Array.isArray(restored) ? restored : [restored]).filter(Boolean);
  const srcDb = (link.cardId != null && CARD_DB[link.cardId]) ? CARD_DB[link.cardId] : null;
  for(const t of list){
    const h = (t && t.card) ? locateCardAnyV4(t.card) : null;
    if(!h || h.zone !== 'mz' || !h.card || h.card.face !== 'up') continue;
    const P = gameState.players[h.p];
    for(const pc of (P.mz || [])){
      if(!pc || pc.face !== 'up' || pc === h.card) continue;
      const spec = targetingProtectorSpecS03(dbOf(pc).n);
      if(!spec || typeof spec.applies !== 'function') continue;
      if(typeof effectNegated === 'function' && effectNegated(pc)) continue;
      const ph = locateCardAnyV4(pc);
      if(!ph) continue;
      let r = null;
      try{ r = spec.applies({link, srcDb, protector:ph, target:h, targets:list}); }catch(e){ r = null; }
      if(!r) continue;
      if(!negateChainLinkV13(link.chainId, r.mode === 'effect' ? 'effect' : 'activation', r.reason || dbOf(pc).n, !!r.destroySource)) continue;
      if(typeof spec.after === 'function'){
        try{ spec.after({link, protector:locateCardAnyV4(pc), target:locateCardAnyV4(h.card)}); }catch(e){}
      }
      return true;
    }
  }
  return false;
}
