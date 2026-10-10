/* S03-U130: 「融合」 (NOT_STARTED before this unit) and 「ダーク・フュージョン」 (NOT_STARTED), on the Fusion-Spell procedure in
   engine/1ZL_fusion_spell_s03.js. Neither targets; the Fusion Monster, the materials and the position are chosen at
   resolution.
   S03-U132: 「龍の鏡」 and 「オーバーロード・フュージョン」 (NOT_STARTED) on the same procedure (profiles in 1ZL: materials from the
   own field / GY are banished). */
function defineFusionSpellS03(name, reason){
  defineScript(name, {
    type:"spell", priority:1, includesSpecialSummon:true, blocksIfNoSpecialSummon:true,
    condition(ctx){
      if(!fusionSpellOptionsS03(ctx.player, name).length){ ctx.reason = reason; return false; }
      return true;
    },
    selectTargets(ctx, done){ done([]); },
    resolve(ctx){ fusionSpellResolveS03(ctx, name); }
  });
}

/* ---- 融合 ----
   ①:自分の手札・フィールドから、融合モンスターカードによって決められた融合素材モンスターを墓地へ送り、
   その融合モンスター1体をEXデッキから融合召喚する。 */
defineFusionSpellS03("融合", "融合召喚できる融合モンスターと融合素材がそろっていません");

/* ---- ダーク・フュージョン ----
   ①:自分の手札・フィールドから、悪魔族の融合モンスターカードによって決められた融合素材モンスターを墓地へ送り、
   その融合モンスター1体をEXデッキから融合召喚する。
   この効果で特殊召喚したモンスターは、このターン相手の効果の対象にならない。 */
defineFusionSpellS03("ダーク・フュージョン", "融合召喚できる悪魔族の融合モンスターと融合素材がそろっていません");

/* ---- 龍の鏡 ----
   ①:自分のフィールド・墓地から、ドラゴン族の融合モンスターカードによって決められた融合素材モンスターを除外し、
   その融合モンスター1体をEXデッキから融合召喚する。 */
defineFusionSpellS03("龍の鏡", "融合召喚できるドラゴン族の融合モンスターと、フィールド・墓地の融合素材がそろっていません");

/* ---- オーバーロード・フュージョン ----
   ①:自分のフィールド・墓地から、機械族・闇属性の融合モンスターカードによって決められた融合素材モンスターを除外し、
   その融合モンスター1体をEXデッキから融合召喚する。 */
defineFusionSpellS03("オーバーロード・フュージョン", "融合召喚できる機械族・闇属性の融合モンスターと、フィールド・墓地の融合素材がそろっていません");

/* ---- パワー・ボンド (S03-U133) ----
   ①:自分の手札・フィールドから、機械族の融合モンスターカードによって決められた融合素材モンスターを墓地へ送り、
   その融合モンスター1体をEXデッキから融合召喚する。この効果で特殊召喚したモンスターの攻撃力は、その元々の攻撃力分アップする。
   このカードを発動したターンのエンドフェイズに自分はこの効果でアップした数値分のダメージを受ける。 */
defineFusionSpellS03("パワー・ボンド", "融合召喚できる機械族の融合モンスターと融合素材がそろっていません");

/* ---- ジェムナイト・フュージョン (S03-U133) ----
   ①:自分の手札・フィールドから、「ジェムナイト」融合モンスターカードによって決められた融合素材モンスターを墓地へ送り、
   その融合モンスター1体をEXデッキから融合召喚する。
   ②:このカードが墓地に存在する場合、自分の墓地の「ジェムナイト」モンスター1体を除外して発動できる。墓地のこのカードを手札に加える。 */
function gemKnightFusionCostCandsS03(ctx){
  return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && String(x.db.n||'').indexOf('ジェムナイト')>=0 && x.card!==ctx.card);
}
defineUnifiedCardV4('ジェムナイト・フュージョン',[{
  key:'fusion', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:1, events:['activate'],
  condition(ctx){
    if(!fusionSpellOptionsS03(ctx.player, 'ジェムナイト・フュージョン').length){
      ctx.reason = "融合召喚できる「ジェムナイト」融合モンスターと融合素材がそろっていません"; return false;
    }
    return true;
  },
  operation(ctx){ fusionSpellResolveS03(ctx, 'ジェムナイト・フュージョン'); },
  afterResolve(){}
},{
  key:'salvage', type:EFFECT_TYPE.IGNITION, range:LOCATION.GRAVE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='grave'){ ctx.reason = "墓地で発動します"; return false; }
    if(typeof graveMoveBlocked==='function' && graveMoveBlocked('grave','banish')){ ctx.reason = "墓地のカードを除外できません"; return false; }
    if(!gemKnightFusionCostCandsS03(ctx).length){ ctx.reason = "墓地に除外できる「ジェムナイト」モンスターがいません"; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard("ジェムナイト・フュージョン：除外する「ジェムナイト」モンスター", gemKnightFusionCostCandsS03(ctx), pick=>{
      API.banish(pick, "ジェムナイト・フュージョン（コスト）"); done(true);
    });
  },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone==='grave') API.returnToHand(me, "ジェムナイト・フュージョン");
  },
  afterResolve(){}
}],{type:'spell', priority:1, includesSpecialSummon:true});

/* ---- 沼地の魔神王 (S03-U134) ----
   ①:このカードは、融合モンスターカードにカード名が記された融合素材モンスター1体の代わりにできる。
     その際、他の融合素材モンスターは正規のものでなければならない。 → engine/1ZL fusionCombosS03 (text-based, all fusion spells)
   ②:自分メインフェイズにこのカードを手札から墓地へ捨てて発動できる。デッキから「融合」1枚を手札に加える。
   Before: AUTO_DECK_TABLE's coarse "search" let the player add ANY Deck card, did not discard this card (it stayed in the
   hand) and ① did not exist (PARTIAL). Now a card-specific script; this definition replaces the auto-table one. */
defineScript("沼地の魔神王", {
  type:"monster", priority:1, activateFrom:["hand"], timing:["mainPhase"],
  condition(ctx){
    if(ctx.zone !== 'hand'){ ctx.reason = "手札から捨てて発動します"; return false; }
    if(!API.pileCards(ctx.player, 'deck', x=>x.db.n==='融合').length){ ctx.reason = "デッキに「融合」がありません"; return false; }
    return true;
  },
  cost(ctx, done){
    API.discard(ctx.player, ctx.index, "沼地の魔神王（コスト）");
    done(true);
  },
  resolve(ctx){
    const t = API.pileCards(ctx.player, 'deck', x=>x.db.n==='融合');
    if(t.length) API.searchDeck(ctx.player, t[0].index, "沼地の魔神王");
  },
  afterResolve(){}
});
