/* =========================================================================
   S03-U25 — 戦闘で破壊した（効果）モンスターの効果の無効化
   -------------------------------------------------------------------------
   漆黒の魔王 LV4 「このカードが戦闘によって破壊した相手モンスターの効果は無効化される」、
   ワーム・ウォーロード 「このカードが戦闘で破壊した効果モンスターの効果は無効化される」、
   エレメント・デビル（地属性）など。
   2011 wiki：ワーム・ウォーロードのこの効果は永続効果で、相打ちの場合は「戦闘破壊された」を条件とする効果を無効にできない。
   漆黒の魔王 LV6 の裁定では、発動した《キラー・トマト》の効果を無効にする（発動はでき、効果が無効になる）。
   以前は、スクリプトが FX_NEGATE（card.negated）を場のモンスターに置いていたが、negated は領域ローカルなので
   BATTLE_CLEANUP で墓地へ送られた時点で消え、しかもチェーンの解決は墓地から発動したリンクの無効を見ていなかった。
   ■ 宣言したカード（cards/H6）だけ
     1. BATTLE_CLEANUP で墓地へ送る時、破壊したモンスター（同じ戦闘で破壊されていない）が宣言済みなら、
        破壊されたカードの graveInfo に battleNegatorUidS03 を書く（reducer 内なので Replay で再現される）。
        宣言済みのカードが破壊した時だけ書くので、それ以外の戦闘の digest は変わらない。
     2. チェーンの解決で、発動元がそのターンにそう記録された墓地のカードで、記録したカードがまだ表側でモンスターゾーンにあり
        （効果が無効になっていない）、宣言の条件（effectOnly / condition）を満たすなら、そのリンクの効果は無効として扱う。
   ========================================================================= */
const BATTLE_DESTROYED_NEGATOR_S03 = {};
function declareBattleDestroyedNegatorS03(name, spec){ BATTLE_DESTROYED_NEGATOR_S03[name] = Object.assign({effectOnly:true}, spec||{}); }
function battleDestroyedNegatorSpecS03(name){ return BATTLE_DESTROYED_NEGATOR_S03[name] || null; }

/* reducer（BATTLE_CLEANUP）用：victim を戦闘で破壊した宣言済みモンスターの uid。無ければ null。 */
function battleNegatorUidForVictimS03(gs, victim){
  const b = gs && gs.lastBattle; if(!b || !victim || victim.uid == null) return null;
  let destroyerUid = null, destroyerDestroyed = false;
  if(b.defenderUidV6 != null && b.defenderUidV6 === victim.uid){ destroyerUid = b.attackerUidV6; destroyerDestroyed = !!b.destroyedAtk; }
  else if(b.attackerUidV6 != null && b.attackerUidV6 === victim.uid){ destroyerUid = b.defenderUidV6; destroyerDestroyed = !!b.destroyedDef; }
  if(destroyerUid == null || destroyerDestroyed) return null;
  const h = (typeof findCardByUidInState === 'function') ? findCardByUidInState(gs, destroyerUid) : null;
  if(!h || !h.card || h.zone !== 'mz') return null;
  return battleDestroyedNegatorSpecS03(dbOf(h.card).n) ? destroyerUid : null;
}

/* 解決用：このリンクの効果が、戦闘で破壊したモンスターの永続効果で無効か。 */
function battleDestroyedLinkNegatedS03(link, srcCard){
  if(!link || !srcCard) return false;
  /* S03-U255: also a card banished by that battle (banishInfo, 漆黒の魔王 LV8) */
  const here = locateCardAnyV4(srcCard); if(!here || (here.zone !== 'grave' && here.zone !== 'banish')) return false;
  const g = here.zone === 'grave' ? srcCard.graveInfo : srcCard.banishInfo;
  if(!g || g.battleNegatorUidS03 == null || g.turn !== gameState.turn) return false;
  const d = findCardByUid(g.battleNegatorUidS03);
  if(!d || d.zone !== 'mz' || !d.card || d.card.face !== 'up') return false;
  const spec = battleDestroyedNegatorSpecS03(dbOf(d.card).n); if(!spec) return false;
  if(typeof effectNegated === 'function' && effectNegated(d.card)) return false;
  if(spec.effectOnly && !((dbOf(srcCard).st || []).includes('効果'))) return false;
  if(typeof spec.condition === 'function'){ try{ if(!spec.condition(d.card, srcCard)) return false; }catch(e){ return false; } }
  return true;
}
