/* S03-U529: ダーク・シムルグ（1103対象の未実装カード。carddata のテキスト）。

   ダーク・シムルグ（効果・星7・鳥獣・闇・攻2700/守1000）
     ①このカードが手札に存在する場合、自分の墓地から闇属性と風属性のモンスターを1体ずつ除外して発動できる。
       このカードを特殊召喚する。
     ②このカードが墓地に存在する場合、手札から闇属性と風属性のモンスターを1体ずつ除外して発動できる。
       このカードを特殊召喚する。
     ③このカードがモンスターゾーンに存在する限り、このカードの属性は「風」としても扱う。
     ④このカードがモンスターゾーンに存在する限り、相手はカードをセットできない。

   当時の裁定（この実装の根拠。推測ではない）
     WIKI-C4536BE0DB24（09/03/18）効果分類: 特殊召喚はどちらも**起動効果**、風属性として扱う効果と
       セットできなくする効果は**永続効果**。
     WIKI-962D8F30F472（08/01/21）特殊召喚モンスターではないので通常召喚でき、召喚条件や蘇生制限は無い。
     WIKI-A8B2B15D0BC1（08/01/22）手札・墓地からの特殊召喚で除外するのは**コスト**。
     WIKI-FEB9ECE98605（08/06/16）《王家の眠る谷－ネクロバレー》中は、墓地のカードを除外する側は発動できず、
       手札のカードを除外する側は発動できる → コストで触る場所で分かれる。
     WIKI-5D42E3BC6EBC（08/01/21）風属性として扱うのは永続効果なので、手札・墓地では闇属性としてしか扱わない。
     WIKI-5166DADCB7C4（08/07/29）複数属性のモンスターは、闇属性を要求する素材としても使える
       → 共通の `continuous.additionalAttributes`（CODEX-C09、《光と闇の竜》の前例）で表す。
     WIKI-787E4D7D65EC（08/01/21）セットする効果は、任意なら発動自体できず、強制なら発動はするが
       セットの処理は行われない → engine のセットの経路（engine/1ZZT の setBannedS03）で止める。
     WIKI-A6BBE85B1591（08/03/15）《くず鉄のかかし》は攻撃無効の効果は有効だが、セットできないので墓地へ送られる。
     WIKI-2E645AE2C1C6（09/08/30）《サイバー・シャドー・ガードナー》はセットされずフィールドに残り続ける
       （S03-U524 で実装済み）。
     WIKI-7D588C652FDC（10/03/25）**自分**は相手モンスターを対象に《月の書》を発動して裏側守備表示にできる
       → 禁止されるのは相手がセットする場合だけ（発動した側で判定する）。
     WIKI-B5978DD4B6F1（08/10/03）/ WIKI-E0DC6C808240（09/01/16）《皆既日蝕の書》は相手は発動できないが、
       自分は発動できる。
     WIKI-07B39F4CDF79（10/09/04）手札からの起動効果にチェーンして《虚無空間》を発動された場合、
       このカードは手札に残る（コストは支払われたまま。engine の既存の不発処理のまま）。 */

/* コストに使える「闇属性モンスター」「風属性モンスター」。
   WIKI-5D42E3BC6EBC: 手札・墓地では風属性として扱われないので、ゾーンのカードの属性をそのまま見る。 */
function u529AttrPoolS03(p, zone, attr, selfUid){
  return API.pileCards(p, zone, x=>{
    if(!x || !x.card || x.card.uid === selfUid) return false;
    const d = x.db;
    if(!d || d.k !== 'm') return false;
    const at = (typeof currentAttributeV17 === 'function') ? currentAttributeV17(x.card) : (d.at || '');
    return String(at) === attr;
  });
}
function u529CostReadyS03(p, zone, selfUid){
  const dark = u529AttrPoolS03(p, zone, '闇', selfUid);
  const wind = u529AttrPoolS03(p, zone, '風', selfUid);
  if(!dark.length || !wind.length) return null;
  /* 同じ 1 枚で両方を兼ねられないので、別々に 1 枚ずつ取れるかを見る */
  if(dark.length === 1 && wind.length === 1 && dark[0].card === wind[0].card) return null;
  return {dark:dark, wind:wind};
}
/* コストで墓地のカードを除外できるか。
   WIKI-FEB9ECE98605（08/06/16）: ネクロバレー中は墓地からの除外がコストでもできないので、
   墓地を除外する①は発動できない（手札を除外する②は発動できる）。
   墓地で発動する効果自身の特殊召喚は engine 側が判定する（RULING_1103_GRAVE_ACTIVATION）。 */
function u529GraveBanishOkS03(){
  return !(typeof graveMoveBlocked === 'function' && graveMoveBlocked('grave', 'banish'));
}
function u529SelfSummonS03(ctx, zone){
  const h = locateCardAnyV4(ctx.card);
  if(!h || h.zone !== zone || h.p !== ctx.player) return;
  API.specialSummon(ctx.player, zone, h.index, 'atk', 'ダーク・シムルグ');
}

defineUnifiedCardV4('ダーク・シムルグ', [{
  /* ①手札から: 自分の墓地から闇属性と風属性のモンスターを1体ずつ除外（コスト）して特殊召喚する */
  key:'from-hand', type:EFFECT_TYPE.IGNITION, range:LOCATION.HAND, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone !== 'hand'){ ctx.reason = '手札に存在する場合に発動します'; return false; }
    if(!u529GraveBanishOkS03()){ ctx.reason = '墓地のカードを除外できません'; return false; }
    if(!u529CostReadyS03(ctx.player, 'grave', ctx.card.uid)){
      ctx.reason = '自分の墓地に闇属性と風属性のモンスターが必要です'; return false;
    }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  /* WIKI-A8B2B15D0BC1（08/01/22）: 除外はコスト。 */
  cost(ctx, done){
    const pool = u529CostReadyS03(ctx.player, 'grave', ctx.card.uid);
    if(!pool){ done(false); return; }
    API.selectCard('ダーク・シムルグ：除外する闇属性モンスター（コスト）', pool.dark, d=>{
      API.banish(d, 'ダーク・シムルグ（コスト）');
      const wind = u529AttrPoolS03(ctx.player, 'grave', '風', ctx.card.uid);
      if(!wind.length){ done(false); return; }
      API.selectCard('ダーク・シムルグ：除外する風属性モンスター（コスト）', wind, w=>{
        API.banish(w, 'ダーク・シムルグ（コスト）');
        done(true);
      });
    });
  },
  operation(ctx){ u529SelfSummonS03(ctx, 'hand'); },
  afterResolve(){}
}, {
  /* ②墓地から: 手札から闇属性と風属性のモンスターを1体ずつ除外（コスト）して特殊召喚する */
  key:'from-grave', type:EFFECT_TYPE.IGNITION, range:LOCATION.GRAVE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone !== 'grave'){ ctx.reason = '墓地に存在する場合に発動します'; return false; }
    if(!u529CostReadyS03(ctx.player, 'hand', ctx.card.uid)){
      ctx.reason = '手札に闇属性と風属性のモンスターが必要です'; return false;
    }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  cost(ctx, done){
    const pool = u529CostReadyS03(ctx.player, 'hand', ctx.card.uid);
    if(!pool){ done(false); return; }
    API.selectCard('ダーク・シムルグ：除外する闇属性モンスター（コスト）', pool.dark, d=>{
      API.banish(d, 'ダーク・シムルグ（コスト）');
      const wind = u529AttrPoolS03(ctx.player, 'hand', '風', ctx.card.uid);
      if(!wind.length){ done(false); return; }
      API.selectCard('ダーク・シムルグ：除外する風属性モンスター（コスト）', wind, w=>{
        API.banish(w, 'ダーク・シムルグ（コスト）');
        done(true);
      });
    });
  },
  operation(ctx){ u529SelfSummonS03(ctx, 'grave'); },
  afterResolve(){}
}], {
  type:'monster', priority:1, activateFrom:['hand', 'grave'], includesSpecialSummon:true,
  blocksIfNoSpecialSummon:true,
  /* ④相手はカードをセットできない（engine/1ZZT の setBannedS03 が読む申告）。 */
  setBanOpponentS03:true,
  /* ③モンスターゾーンに存在する限り、属性は「風」としても扱う。 */
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    additionalAttributes(card, self){ return (card === self && card.face === 'up') ? ['風'] : []; }
  }
});
