/* S03-U532: ハネクリボー LV9（1103対象の未実装カード。carddata のテキスト）。

   ハネクリボー LV9（効果・星9・天使・光・攻?/守?）
     チェーンが発生した時、自分の手札からこのカードを特殊召喚する事ができる。
     このカードが自分フィールド上に表側表示で存在する限り、お互いに発動した魔法カードは
     墓地へ送られずゲームから除外する。
     このカードの攻撃力・守備力は、相手の墓地に存在する魔法カードの数×500ポイントになる。
     「ハネクリボー LV9」は、自分フィールド上に1枚しか表側表示で存在できない。

   当時の裁定（この実装の根拠。推測ではない）
     WIKI-659785AC1626（08/05/02）特殊召喚はチェーンが発生した時に**それにチェーンする形で**発動する
       → 手札から発動できるクイックエフェクト（チェーンが積まれている時だけ）。
     WIKI-CBB94CBDEEC2（08/05/13）ダメージステップ中は発動できない。
     WIKI-385F18A83A8A（08/05/02）同一チェーン上では 1 体しか発動できない
       → そのチェーン（一番下のリンクの id）を player の印に残す。
     WIKI-CF11BCF70C7E（11/01/08）永続魔法が破壊された場合も除外される /
     WIKI-2491EC08124B（11/01/08）発動した魔法にチェーンして《サイクロン》で破壊された場合も除外される /
     WIKI-6A8137A41B2F（08/05/03）《光の護封剣》が 3 ターン後に墓地へ送られる場合も除外される /
     WIKI-62F976F48DF9（11/01/08）魔法の発動が無効にされ破壊された場合も除外される
       → 「表側表示の魔法カードが墓地へ送られる」置換として共通側（engine/00 の
         activatedSpellBanishS03）に申告する。
     WIKI-190811E08EFD（11/01/08）コストで墓地へ送る場合は除外されない → コストの印（p3.reason）で除く。
     WIKI-EE40E392583E（08/05/08）《スキルドレイン》で表側のこのカードの効果は無効になるが、
       手札の 2 枚目の「1体しか存在できない」制限は無効にならないので召喚できない
       → 「1枚しか表側表示で存在できない」は召喚しようとするカード自身の条件（summonConditionS03）に置く。
     WIKI-115033D140BB（08/05/12）装備カード扱いのこのカードが居る場合も 2 枚目は出せない。
     WIKI-869722F50A42（08/05/12）このカードを含むリリースでアドバンス召喚はできない（セットは可能）。 */

function u532FoeGraveSpellsS03(p){
  const foe = (p === 0) ? 1 : 0;
  return (gameState.players[foe].grave || []).filter(c=>c && dbOf(c).k === 's').length;
}
/* 自分フィールドに表側表示の「ハネクリボー LV9」が居るか（装備カード扱いも含む） */
function u532FaceUpCopyS03(p, exceptCard){
  const P = gameState.players[p];
  const zones = [].concat(P.mz || [], P.sz || [], P.field ? [P.field] : []);
  return zones.some(c=>c && c !== exceptCard && c.face === 'up' && cardName(c) === 'ハネクリボー LV9');
}
/* 今のチェーンの識別（一番下のリンクの id）。同一チェーンで 1 体だけ出せる。 */
function u532ChainIdS03(){
  const ch = (typeof gameState !== 'undefined' && gameState && Array.isArray(gameState.chain)) ? gameState.chain : [];
  if(!ch.length) return null;
  const bottom = ch[0];
  return (bottom && bottom.chainId != null) ? Number(bottom.chainId) : null;
}
/* WIKI-385F18A83A8A（08/05/02）: 同一チェーン上では 1 体しか発動できない
   （発動の時点で見るので、チェーンに同名のリンクがあるかを数える）。 */
function u532ChainUsedS03(p, chainId){
  const P = gameState.players[p], f = (P && P.temporaryFlags) || {};
  if(chainId != null && Number(f.u532ChainS03) === Number(chainId)) return true;
  const ch = Array.isArray(gameState.chain) ? gameState.chain : [];
  return ch.some(l=>l && l.name === 'ハネクリボー LV9');
}

defineUnifiedCardV4('ハネクリボー LV9', [{
  /* チェーンが発生した時、手札からこのカードを特殊召喚する */
  key:'chain-special', type:EFFECT_TYPE.IGNITION, range:LOCATION.HAND, speed:2, events:['activate'],
  condition(ctx){
    if(ctx.zone !== 'hand'){ ctx.reason = '手札から発動します'; return false; }
    const chainId = u532ChainIdS03();
    if(chainId == null){ ctx.reason = 'チェーンが発生した時に発動します'; return false; }
    /* WIKI-CBB94CBDEEC2（08/05/13）: ダメージステップ中は発動できない。 */
    if(typeof inDamageStepS03 === 'function' && inDamageStepS03()){
      ctx.reason = 'ダメージステップ中は発動できません'; return false;
    }
    if(u532ChainUsedS03(ctx.player, chainId)){ ctx.reason = 'このチェーンでは既に特殊召喚しています'; return false; }
    if(u532FaceUpCopyS03(ctx.player)){ ctx.reason = '「ハネクリボー LV9」は自分フィールドに1枚しか表側表示で存在できません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  operation(ctx){
    const h = locateCardAnyV4(ctx.card);
    if(!h || h.zone !== 'hand' || h.p !== ctx.player) return;
    if(u532FaceUpCopyS03(ctx.player) || !hasMonsterZoneSpace(ctx.player)) return;
    const chainId = u532ChainIdS03();
    if(chainId != null) API.setFlag(ctx.player, 'u532ChainS03', chainId, true);
    /* 表示形式の指定が無いので表側攻撃／守備を選ぶ（engine/1ZZK） */
    specialSummonPositionsS03(ctx.player, [{uid:ctx.card.uid, from:'hand'}], 'ハネクリボー LV9');
  },
  afterResolve(){}
}], {
  type:'monster', priority:1, speed:2, quickEffect:true, activateFrom:['hand'],
  includesSpecialSummon:true,
  blocksIfNoSpecialSummon(ctx){ return !!ctx && ctx.zone === 'hand'; },
  /* お互いに発動した魔法カードは墓地へ送られずゲームから除外する（engine/00 の共通置換が読む申告）。 */
  spellToBanishS03:true,
  /* 「ハネクリボー LV9」は自分フィールド上に1枚しか表側表示で存在できない
     （WIKI-EE40E392583E: 出す側のカード自身の条件なので、場のカードが無効化されていても効く）。 */
  summonConditionS03(p, db, kind){
    if(!db || db.n !== 'ハネクリボー LV9') return '';
    if(kind !== 'normal' && kind !== 'special' && kind !== 'flip') return '';
    return u532FaceUpCopyS03(p) ? '「ハネクリボー LV9」は自分フィールドに1枚しか表側表示で存在できません' : '';
  },
  /* 攻撃力・守備力は、相手の墓地に存在する魔法カードの数×500ポイントになる */
  continuous:{
    scope:'self', from:['mz'],
    apply(card, self, info){
      if(card !== self) return null;
      const n = u532FoeGraveSpellsS03(info.p) * 500;
      return {setAtk:n, setDef:n};
    }
  }
});
