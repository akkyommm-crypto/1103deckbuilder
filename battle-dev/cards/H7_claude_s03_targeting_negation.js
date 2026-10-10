/* S03-U28: 対象にされた時に自動で働く無効化（永続効果）を宣言する。仕組みは engine/1T_targeting_negation_s03.js。 */

/* ミドル・シールド・ガードナー：裏側表示のこのモンスター1体を対象とする魔法カードの発動を無効にし、表側守備表示になる。
   本文は発動したプレイヤーを限定しないので、どちらのプレイヤーの魔法カードでも無効にする。 */
declareTargetingNegatorS03('ミドル・シールド・ガードナー', {
  applies({srcDb, negator}){
    if(!srcDb || srcDb.k !== 's') return null;
    if(!negator || !negator.card || negator.card.face !== 'down') return null;
    return {mode:'activation', destroySource:false, reason:'ミドル・シールド・ガードナー'};
  },
  after({negator}){
    if(negator && negator.zone === 'mz')
      act({type:'FX_SET_STATE', player:negator.p, zone:'mz', index:negator.index, face:'up', pos:'def', reason:'ミドル・シールド・ガードナー'});
  }
});

/* アルカナフォース0－THE FOOL：コイントスが表(1)ならこのカードを対象にする自分のカードの効果を、裏(2)なら相手のカードの効果を、無効にし破壊する。
   2011 wiki：表・裏の効果の種別は永続効果。コイントスの結果は e9FoolCoin（cards/E2 の召喚時の誘発効果が記録）。 */
declareTargetingNegatorS03('アルカナフォース0－THE FOOL', {
  applies({link, negator}){
    const c = negator && negator.card;
    if(!c || c.face !== 'up') return null;
    const coin = Number(c.e9FoolCoin || 0);
    const side = coin === 1 ? negator.p : (coin === 2 ? (negator.p === 0 ? 1 : 0) : null);
    if(side == null || link.player !== side) return null;
    return {mode:'effect', destroySource:true, reason:'アルカナフォース0－THE FOOL'};
  }
});
