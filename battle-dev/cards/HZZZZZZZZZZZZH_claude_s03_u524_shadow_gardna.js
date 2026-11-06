/* S03-U524: サイバー・シャドー・ガードナー（1103対象の未実装カード。carddata のテキスト）。

   サイバー・シャドー・ガードナー（永続罠）
     相手のメインフェイズ時に発動できる。このカードは発動後モンスターカード(機械族・地・星4・攻/守?)となり、
     自分のモンスターカードゾーンに特殊召喚する。
     このカードを攻撃対象とした相手モンスターの攻撃宣言時、このカードの攻撃力・守備力は相手攻撃モンスターと
     同じ数値になる。
     このカードは相手のエンドフェイズ時に魔法&罠カードゾーンにセットされる。
     このカードは罠カードとしても扱う。

   当時の裁定（この実装の根拠。推測ではない）
     WIKI-1D20AFD4E3D6（10/08/31）変化した攻撃力・守備力は**元々の攻撃力（守備力）として扱う**
       → 「元々の数値を変える層」（setBaseAtk / setBaseDef、engine/00 の curStat）で持つ。
     WIKI-3B285A5D988E（10/08/31）《収縮》《巨大化》は**変化した後の数値**の半分・倍になる
       → 元々の数値の層が先に適用され、その後に SET / 倍率の層が掛かる順序のまま。
     WIKI-86265C2E44AE（09/06/12）数値変動後に生存した場合、ダメージステップ終了後も**変化した数値のまま**
       → ターンやステップで消さない（カードのゾーン限定の印に持つ）。
     WIKI-05116421EE18（09/08/30）2 体目（攻撃力2000）が攻撃宣言した時は**2 体目の攻撃力**になる
       → 攻撃宣言の度に上書きする。
     WIKI-502486CEABE6（10/06/18）攻守が変動する効果は**チェーンブロックを作る**／
     WIKI-99CF1034A52C（10/09/06）攻撃力0のモンスターに攻撃宣言された場合でも作る
       → 攻撃宣言時の強制の誘発効果（数値が同じでも発動する）。
     WIKI-33529E04EA15（回答日なし）この効果は**対象を取らない**。
     WIKI-D56999420D78（09/02/09）セットされる時も**チェーンブロックを作る**
       → 相手のエンドフェイズの強制の誘発効果。
     WIKI-801C30BE612F（回答日なし）破壊されて墓地へ送られた場合はセットされない
       → 誘発はモンスターゾーンに表側で存在する時だけ。
     WIKI-E1A1FA697B9E（09/08/30）《聖なる輝き》発動中はフィールドに残り続ける／
     WIKI-02A8DC802BDB（09/08/30）《サーチライトメン》の効果適用中も残り続ける／
     WIKI-2E645AE2C1C6（09/08/30）相手の《ダーク・シムルグ》が存在する場合も残り続ける
       → セットできない時はセットせず、モンスターのままフィールドに残る（engine の setBannedS03 を見る）。

   未対応（この単位では直していない）
     WIKI-DC6D7637D286: 《人造人間－サイコ・ショッカー》《王宮のお触れ》で効果が無効の場合はセットされない。
     罠モンスターは場にいる間 dbOf が k:'m' を返すので、trapNegated（dbOf(card).k==='t' を見る）が掛からない。
     これは S03-U248 の罠モンスターの共通の作りの限界として記録されているもので、このカード固有の問題ではない。
     《ダーク・シムルグ》《サーチライトメン》のセット禁止は、それぞれのカード側の実装が前提
     （ダーク・シムルグは NOT_STARTED）。 */

function u524ShadowFoeMainS03(ctx){
  return ctx.player !== gameState.activePlayer && (gameState.phase === 'main1' || gameState.phase === 'main2');
}
/* このカードを攻撃対象とした相手モンスターの攻撃宣言時（対象は取らない） */
function u524ShadowTargetedS03(ctx){
  const a = gameState.pendingAttack;
  if(ctx.zone !== 'mz' || !ctx.card || ctx.card.face !== 'up' || ctx.card.uid == null) return null;
  if(!a || a.targetUid == null || a.targetUid !== ctx.card.uid) return null;
  if(a.player !== ctx.opponent) return null;
  const at = (a.attackerUid != null) ? findCardByUid(a.attackerUid) : null;
  return (at && at.zone === 'mz') ? at : null;
}
function u524ShadowEndDueS03(ctx){
  if(ctx.zone !== 'mz' || !ctx.card || ctx.card.face !== 'up') return false;
  return gameState.phase === 'end' && ctx.player !== gameState.activePlayer;
}

defineUnifiedCardV4('サイバー・シャドー・ガードナー', [
  trapMonsterActivateS03('サイバー・シャドー・ガードナー', {
    kind:'effect', ra:'機械', at:'地', lv:4, atk:0, def:0, pos:'atk',
    condition(ctx){
      if(!u524ShadowFoeMainS03(ctx)){ ctx.reason = '相手のメインフェイズに発動できます'; return false; }
      return true;
    }
  }),
  {
    key:'copy-attacker', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onAttackDeclare'], forced:true,
    /* WIKI-502486CEABE6 / WIKI-99CF1034A52C: 数値が同じでもチェーンブロックを作る（強制の誘発効果）。 */
    condition(ctx){ return !!u524ShadowTargetedS03(ctx); },
    operation(ctx){
      const at = u524ShadowTargetedS03(ctx);
      const me = locateCardAnyV4(ctx.card);
      if(!at || !me || me.zone !== 'mz') return;
      const n = (typeof curATK === 'function') ? Number(curATK(at.card)) : 0;
      /* WIKI-05116421EE18: 攻撃宣言の度に上書きする。WIKI-86265C2E44AE: その後も残す。 */
      API.setCardFlag(me, 'u524ShadowStatS03', n, 'サイバー・シャドー・ガードナー（攻守は攻撃モンスターと同じ）', {silent:true});
      API.log(`サイバー・シャドー・ガードナー：攻撃力・守備力が ${n} になる`);
    },
    afterResolve(){}
  },
  {
    key:'set-back', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onEndPhase'], forced:true,
    /* WIKI-D56999420D78（09/02/09）: セットもチェーンブロックを作る。WIKI-801C30BE612F: 破壊されていたらセットしない。 */
    condition(ctx){ return u524ShadowEndDueS03(ctx); },
    operation(ctx){
      const me = locateCardAnyV4(ctx.card);
      if(!me || me.zone !== 'mz') return;
      const P = gameState.players[me.p];
      if((P.sz || []).length >= ZONE_LIMITS.sz){
        API.log('サイバー・シャドー・ガードナー：魔法＆罠ゾーンが一杯なのでセットできず、フィールドに残る'); return;
      }
      /* WIKI-E1A1FA697B9E / WIKI-02A8DC802BDB / WIKI-2E645AE2C1C6: セットできない時は残り続ける。 */
      if(typeof setBannedS03 === 'function' && setBannedS03(gameState, P)){
        API.log('サイバー・シャドー・ガードナー：カードをセットできないのでフィールドに残る'); return;
      }
      act({type:'MOVE', player:me.p, from:'mz', fromIndex:me.index, to:'sz', reason:'サイバー・シャドー・ガードナー（セット）'});
      const now = locateCardAnyV4(ctx.card);
      if(!now || now.zone !== 'sz') return;
      act({type:'FX_SET_STATE', player:now.p, zone:'sz', index:now.index, face:'down', reason:'サイバー・シャドー・ガードナー（セット）'});
      const h = locateCardAnyV4(ctx.card);
      if(!h) return;
      /* モンスターとしての状態を落として、罠カードのセットに戻す（ゾーンを移っただけでは消えない印） */
      API.setCardFlag(h, 'asMonsterDbS03', null, 'サイバー・シャドー・ガードナー（罠カードに戻る）', {silent:true});
      API.setCardFlag(h, 'trapMonsterS03', null, 'サイバー・シャドー・ガードナー（罠カードに戻る）', {silent:true});
      API.setCardFlag(h, 'u524ShadowStatS03', null, 'サイバー・シャドー・ガードナー（数値を戻す）', {silent:true});
      API.setCardFlag(h, 'setTurn', gameState.turn, 'サイバー・シャドー・ガードナー（セット）', {silent:true});
    },
    afterResolve(){}
  }
], {type:'trap', priority:2, forced:true,
  /* timing 'free': passive のフックからタイミングを推定すると、カードの発動（相手のメインフェイズ）が
     「攻撃宣言時」扱いで断られる。各効果が自分で場面を判定しているので制限しない（スライム増殖炉と同じ）。 */
  timing:['free'],
  /* WIKI-1D20AFD4E3D6: 変化した数値は「元々の数値」として扱う → 元々の数値を変える層で持つ。 */
  continuous:{ scope:'self', from:['mz'], apply(card, self){
    if(card !== self) return null;
    const n = Number(self.u524ShadowStatS03);
    return Number.isFinite(n) ? {setBaseAtk:n, setBaseDef:n} : null; } },
  passive:{
    onAttackDeclare(ctx){ return !!u524ShadowTargetedS03(ctx); },
    onEndPhase(ctx){ return u524ShadowEndDueS03(ctx); }
  }});
