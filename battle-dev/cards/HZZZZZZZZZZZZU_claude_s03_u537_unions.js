/* S03-U537: ユニオンモンスターの残り 3 枚（1103対象の未実装カード。carddata のテキスト）。
   S03-U313 の共通処理 declareUnionS03 にそのまま乗せる単位。同じ仕組みのカードをまとめて実装する。
   エンジンへの追加は無い。

   セコンド・ゴブリン（効果モンスター・星1・悪魔・闇・攻100/守100）
     1ターンに1度だけ自分のメインフェイズに装備カード扱いとして自分の「ジャイアント・オーク」に装備、
     または装備を解除して表側攻撃表示で特殊召喚する事ができる。
     この効果で装備カード扱いになっている時のみ、装備モンスターの表示形式を1ターンに1度だけ変更する事ができる。
     （1体のモンスターが装備できるユニオンは1枚まで。装備モンスターが戦闘によって破壊される場合は、
       代わりにこのカードを破壊する。）

   守護霊アイリン（効果モンスター・星1・天使・光・攻0/守0）
     セコンド・ゴブリンと同文。装備先は「不屈闘士レイレイ」。

   メタル化寄生生物－ルナタイト（効果モンスター・星7・水・水・攻1000/守500）
     1ターンに1度だけ自分のメインフェイズに装備カード扱いとして、フィールド上のこのカードを
     自分フィールド上表側表示のモンスターに装備、または装備を解除して表側攻撃表示で特殊召喚する事ができる。
     装備モンスターは相手がコントロールする魔法の効果を受けなくなる。
     （1体のモンスターが装備できるユニオンは1枚まで、装備モンスターが戦闘によって破壊される場合は、
       代わりにこのカードを破壊する。）

   当時の裁定（この実装の根拠。推測ではない）
     WIKI-47313AD3D4A0（09/12/24）相手の《皆既日蝕の書》の効果を《メタル化寄生生物－ルナタイト》で**回避**できる
       → 「装備モンスターは相手がコントロールする魔法の効果を受けない」を、S03-U115/U249 の
         continuous.grantUnaffectedS03（効果元の印 src.k==='s'）で与える。FX_SET_STATE も対象の
         S03U115_AFFECT_TYPES に入っているので、裏側守備表示にする魔法は装備モンスターに効かない。
     WIKI-D657D4542632（09/03/05）《エンジェルＯ７》《超古代生物の墓場》でユニオンの効果を発動できない時でも
       《フォーメーション・ユニオン》で装備できる → 装備可否は declareUnionS03 が UNION_HOST_S03 に
         登録する装備先の規則（S03-U519）だけで決まり、ユニオン自身の発動可否を見ない。
     WIKI-5D98E3D9481F（09/01/27）《ゲットライド！》で墓地の《メタル化寄生生物－ルナタイト》を装備できる
       → 《ゲットライド！》は未実装（ENGINE_GAP）だが、装備先の規則は同じ登録を読む。
     WIKI-8294B5F99F4B（09/01/20）《フォーメーション・ユニオン》で装備した同一ターン中に、装備を解除して
       特殊召喚できる → 1ターンに1度の記録（unionTurnS03）はユニオン自身の効果だけが使う（共通処理のまま）。

   《セコンド・ゴブリン》《守護霊アイリン》の「表示形式を1ターンに1度だけ変更する」には、当時裁定も
   現行Q&Aも見つからなかった（報告書 3 節に記録）。テキストどおり、装備カード扱いの間だけ使える
   1ターンに1度の起動効果として実装する。装備先の《ジャイアント・オーク》《不屈闘士レイレイ》は
   攻撃後に守備表示になり「次の自分のターン終了時まで表示形式を変更できない」が、これは手動の変更
   （canManualPositionChange）を止める永続効果で、効果による変更（API.changePosition / FX_SET_STATE）は
   止めない。既存エンジンのこの区別に乗せている。 */

/* 共通: 装備モンスターの表示形式を 1 ターンに 1 度だけ変更する起動効果 */
function u537PosEffectS03(name){
  return {
    key:'host-position', type:EFFECT_TYPE.IGNITION, range:LOCATION.SZONE, speed:1, events:['activate'],
    condition(ctx){
      const h = locateCardAnyV4(ctx.card);
      if(!h || h.p !== ctx.player || h.zone !== 'sz' || ctx.card.v46MonsterEquip !== true){
        ctx.reason = '装備カード扱いで存在する必要があります'; return false;
      }
      if(ctx.player !== gameState.activePlayer || !(gameState.phase === 'main1' || gameState.phase === 'main2')){
        ctx.reason = '自分のメインフェイズに発動できます'; return false;
      }
      if(Number(ctx.card.u537PosTurnS03) === gameState.turn){
        ctx.reason = 'この効果はこのターン使用しています'; return false;
      }
      const host = unionHostS03(ctx.card);
      if(!host || host.card.face !== 'up'){ ctx.reason = '装備モンスターが表側表示で存在しません'; return false; }
      return true;
    },
    operation(ctx){
      const h = locateCardAnyV4(ctx.card);
      if(!h || h.zone !== 'sz' || ctx.card.v46MonsterEquip !== true) return;
      API.setCardFlag(h, 'u537PosTurnS03', gameState.turn, name, {silent:true});
      const host = unionHostS03(ctx.card);
      if(!host || host.card.face !== 'up') return;
      API.changePosition(host, host.card.pos === 'atk' ? 'def' : 'atk', name);
    },
    afterResolve(){}
  };
}

declareUnionS03('セコンド・ゴブリン', {
  host:unionNamed('ジャイアント・オーク'), substitute:'battle',
  effects:[u537PosEffectS03('セコンド・ゴブリン')]
});

declareUnionS03('守護霊アイリン', {
  host:unionNamed('不屈闘士レイレイ'), substitute:'battle',
  effects:[u537PosEffectS03('守護霊アイリン')]
});

declareUnionS03('メタル化寄生生物－ルナタイト', {
  host:(x=>true), substitute:'battle',
  continuous:{
    /* WIKI-47313AD3D4A0（09/12/24）: 装備モンスターは相手がコントロールする魔法の効果を受けない */
    grantUnaffectedS03(card, src, self){
      if(!card || !self || self.face !== 'up' || self.v46MonsterEquip !== true) return false;
      if(!src || src.k !== 's' || src.uid === self.uid) return false;
      const me = findCardByUid(self.uid);
      if(!me || me.zone !== 'sz') return false;
      if(typeof effectNegated === 'function' && effectNegated(self)) return false;
      const host = unionHostS03(self);
      if(!host || host.card !== card) return false;
      /* 「相手がコントロールする魔法」: 効果元のコントローラーを見る。特定できない場合は適用しない */
      const srcH = (src.uid != null) ? findCardByUid(src.uid) : null;
      if(!srcH || !srcH.card) return false;
      const ctrl = (srcH.card.controller === 0 || srcH.card.controller === 1) ? srcH.card.controller : srcH.p;
      return ctrl !== me.p;
    }
  }
});
