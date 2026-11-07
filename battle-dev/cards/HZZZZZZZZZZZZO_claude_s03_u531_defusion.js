/* S03-U531: 融合解除（1103対象の未実装カード。carddata のテキスト）。

   融合解除（速攻魔法）
     ①:フィールドの融合モンスター1体を対象として発動できる。その融合モンスターを持ち主のエクストラデッキに
     戻す。その後、エクストラデッキに戻したそのモンスターの融合召喚に使用した融合素材モンスター一組が
     自分の墓地に揃っていれば、その一組を自分フィールドに特殊召喚できる。

   当時の裁定（この実装の根拠。推測ではない）
     WIKI-5772E54131CD（10/11/04）融合召喚以外の方法で特殊召喚された融合モンスターでは素材を特殊召喚できない
       （《死者蘇生》で出した場合、除外された融合モンスターを《Ｄ・Ｄ・Ｒ》で出した場合も同じ）。
     WIKI-6F274903FD7E（10/11/04）《亜空間物質転送装置》で一時的に除外されて戻った場合は特殊召喚できる
       → 融合素材の記録は融合モンスター側に残し（engine/1ZL）、融合召喚以外の特殊召喚で消す（engine/00）。
       「戻すだけ」の処理では消さない。
     WIKI-D359E2863E30（10/11/04）《奇跡の発掘》等で後から墓地に戻した素材では特殊召喚できない
       → 記録した uid そのものが墓地にある事を見る（同名カードでは代用できない）。
     WIKI-91526184443C 「一組」を全て特殊召喚できない場合は、その全てを特殊召喚できない。
     WIKI-23A6E39C389D（09/11/21）同名のモンスターが複数必要な融合でも、一組が揃っていれば特殊召喚できる。
     WIKI-2DC70EF9977F（07/08/22）/ WIKI-9066E3EF4316 融合召喚ではない特殊召喚（《キメラテック・フォートレス・
       ドラゴン》《ＸＹＺ－ドラゴン・キャノン》）の素材は特殊召喚できない → 記録が無いので何も起きない。
     WIKI-47FAE46FE5EF（08/11/04）フィールドを離れた後に処理をはさむ効果（《Ｅ・ＨＥＲＯ アブソルートZero》）は
       発動する → engine の既存の「場を離れた時」の誘発のまま。
     WIKI-E962247E640E / WIKI-4B24CC5AEDD6（10/06/25）《プロト・サイバー・ドラゴン》は墓地では
       《サイバー・ドラゴン》として扱われないので特殊召喚できない／
     WIKI-D7F2FCEEA25F（10/06/25）《沼地の魔神王》は特殊召喚できるが《ファントム・オブ・カオス》
       《Ｅ・ＨＥＲＯ プリズマー》は特殊召喚できない
       → 名前・代用の扱いの差は記録した uid では表せない（報告書の未対応に書いた）。 */

function u531FusionsS03(ctx){
  return API.fieldCards({zone:'mz', filter:x=>x.card.face === 'up'
    && ((x.db && x.db.st) || []).indexOf('融合') >= 0});
}
/* その融合モンスターの「融合召喚に使用した融合素材モンスター一組」が自分の墓地に揃っているか */
function u531MaterialHandlesS03(card, p){
  const uids = (card && Array.isArray(card.fusionMatUidsS03)) ? card.fusionMatUidsS03.slice() : [];
  if(!uids.length) return null;
  const out = [];
  for(const u of uids){
    const h = findCardByUid(u);
    if(!h || h.zone !== 'grave' || h.p !== p) return null;         /* 一組が自分の墓地に揃っていない */
    if(typeof canEffectSpecialSummonS03 === 'function'
       && !canEffectSpecialSummonS03(h.card, 'grave', '融合解除')) return null;
    out.push(h);
  }
  return out;
}

defineUnifiedCardV4('融合解除', [{
  key:'defusion', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:2, events:['activate'],
  targetRange:LOCATION.MZONE, targetSide:'both',
  condition(ctx){
    if(!u531FusionsS03(ctx).length){ ctx.reason = 'フィールドに表側表示の融合モンスターがいません'; return false; }
    return true;
  },
  target(ctx, done){
    API.selectCard('融合解除：エクストラデッキに戻す融合モンスター', u531FusionsS03(ctx), t=>done([t]));
  },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(!r || r.zone !== 'mz') return;
    /* 記録はエクストラデッキに戻る前に読む（戻した後はカードの状態が変わるため） */
    const mats = u531MaterialHandlesS03(r.card, ctx.player);
    act({type:'FX_RETURN_DECK', player:r.p, zone:'mz', index:r.index, toBottom:false, reason:'融合解除'});
    if(!mats){ API.log('融合解除：融合召喚に使用した融合素材モンスター一組が自分の墓地に揃っていない'); return; }
    /* WIKI-91526184443C: 一組を全て特殊召喚できない場合は 1 体も特殊召喚しない */
    const room = ZONE_LIMITS.mz - (gameState.players[ctx.player].mz || []).length;
    if(room < mats.length){ API.log('融合解除：一組を全て特殊召喚できないため、特殊召喚しない'); return; }
    const items = [];
    for(const h of mats){
      const now = (h.card && h.card.uid != null) ? findCardByUid(h.card.uid) : null;
      if(!now || now.zone !== 'grave' || now.p !== ctx.player){
        API.log('融合解除：一組が揃わなくなったため、特殊召喚しない'); return;
      }
      items.push({uid:now.card.uid, from:'grave'});
    }
    /* 表示形式の指定が無いので表側攻撃／守備を選ぶ（engine/1ZZK） */
    specialSummonPositionsS03(ctx.player, items, '融合解除');
  },
  afterResolve(){}
}], {
  type:'quick-play', priority:2, targets:true,
  includesSpecialSummon:true
});
