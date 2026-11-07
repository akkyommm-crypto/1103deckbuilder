/* S03-U539: 《サクリファイス》と《サウザンド・アイズ・サクリファイス》（1103対象の未実装カード。carddata のテキスト）。
   「相手モンスター1体を装備カード扱いとして自分に装備し、攻守がその数値になり、戦闘破壊の身代わりにする」
   という同じ仕組みを 1 つの共通定義（u539SacrificeS03）にまとめ、2 枚で共有する。

   サクリファイス（儀式・効果モンスター・星1・魔法使い・闇・攻0/守0）
     「イリュージョンの儀式」により降臨。
     ①:1ターンに1度、相手フィールドのモンスター1体を対象として発動できる。
       その相手モンスターを装備カード扱いとしてこのカードに装備する(1体のみ装備可能)。
     ②:このカードの攻撃力・守備力は、このカードの効果で装備したモンスターのそれぞれの数値になり、
       このカードが戦闘で破壊される場合、代わりに装備したそのモンスターを破壊する。
     ③:このカードの効果でモンスターを装備したこのカードの戦闘で自分が戦闘ダメージを受けた時、
       相手も同じ数値分の効果ダメージを受ける。

   サウザンド・アイズ・サクリファイス（融合・効果モンスター・星1・魔法使い・闇・攻0/守0）
     「サクリファイス」＋「千眼の邪教神」
     ①:このカードがモンスターゾーンに存在する限り、このカード以外のフィールドのモンスターは
       表示形式を変更できず、攻撃できない。
     ②③:サクリファイスの①②と同文。

   当時の裁定（この実装の根拠。推測ではない）
     WIKI-503AC3E45E07（10/07/10）《儀式の檻》で自分が戦闘ダメージを受けない場合、③の
       「相手にも同じ数値のダメージ」は適用されない → 戦闘ダメージのイベント（受けた数値）から出す。
     WIKI-D4D0FA960D3E（08/05/16）/ WIKI-756299CDD223 / WIKI-E3DA49DC9749 / WIKI-DB20E4E76CDC（08/10/28）/
     WIKI-8F8B9648C648（08/09/30）/ WIKI-96566E303CBD / WIKI-CC23DF26FBE0
       装備カード扱いになったモンスターは**モンスターではない**（コントロール移動の誘発・ユニオンの効果・
       自壊・洗脳解除は働かない）→ 既存の装備カード扱い（engine/00 の v46MonsterEquip）のまま。
     WIKI-5A00A96B12A6（09/03/06）《フォッシル・ダイナ パキケファロ》の破壊は、装備カードになった
       モンスターには及ばない → 同じ。
     WIKI-A303188453BB / WIKI-4D5378F1E3CC（09/08/29）/ WIKI-9A25B3DA6E23（11/03/03）/ WIKI-F6FBD6A41C62（10/07/22）
       装備カード扱いのまま**破壊された**場合は、そのカード自身の「破壊された場合」の効果は働く
       → 身代わり（engine/1ZZB）は破壊として墓地へ送り、onDestroy / onSendToGrave を出す（既存のまま）。
     WIKI-E2ED41716746 《ヴァンパイア・ロード》は装備カード状態では自己再生しない（フィールドの
       モンスターとして破壊されていないため）→ そのカード側の実装依存。報告書の未対応に書いた。
     WIKI-CA15F82514E4 《ホルスの黒炎竜 LV4》は対象にできない（この効果は**コントロールを変更する
       効果を含む**）→ コントロール変更耐性の共通処理が engine に無いので未対応に書いた。
     WIKI-7274550C7E25（11/05/09）/ WIKI-702D46EDC71F（10/08/12）《力の集約》との関係 → 未実装のカードなので未対応。
     WIKI-5D4B80FEC3FD（10/07/05）《コンビネーション・アタック》→ 未実装のカードなので未対応。
     現行Q&A（fid 113 / 6156 / 11497、retro1103 は「C 推定」）: ②の攻守は**このカード自身の効果**による
       置き換えであって装備カードの効果ではない（《裸の王様》で装備カードの効果が無効になっても戻らない）、
       数値は装備したモンスターの数値（《ブラック・マジシャン》なら 2500/2100）→ 自分の永続効果として
       `setAtk` / `setDef` の層で置き換える。
     《サウザンド・アイズ・サクリファイス》には当時裁定・現行Q&Aの該当が無い（報告書に記録）。 */

/* このカードの効果で装備したモンスター（engine/00 の sourceUid つきの装備カード） */
function u539EquippedS03(card, p){
  if(!card || card.uid == null) return [];
  return v46EquippedMonsterCards(card, p).filter(c=>c && c.equipTo && c.equipTo.sourceUid === card.uid);
}
/* 装備した時に裏側表示だったものは数値を持ち込まない（S03-U528 と同じ扱い。engine はゾーンを
   移るとカードを表側にするため、装備した時点の表裏を印で持つ） */
function u539StatsS03(card, p){
  const c = u539EquippedS03(card, p).filter(x=>x.u539FaceDownS03 == null)[0];
  if(!c) return null;
  const d = dbOf(c) || {};
  const a = Number(d.atk), f = Number(d.def);
  return {setAtk:Number.isFinite(a) ? a : 0, setDef:Number.isFinite(f) ? f : 0};
}
function u539FoeMonstersS03(ctx){
  return API.fieldCards({player:ctx.opponent, zone:'mz'});
}
function u539CanEquipS03(ctx){
  if(ctx.zone !== 'mz' || !ctx.card || ctx.card.face !== 'up'){ ctx.reason = 'フィールドで表側表示の時に発動します'; return false; }
  /* 起動効果。timing は 'free' にして（誘発の passive から推定されるのを避ける）、ここで自分で見る */
  if(ctx.player !== gameState.activePlayer || !(gameState.phase === 'main1' || gameState.phase === 'main2')){
    ctx.reason = '自分のメインフェイズに発動できます'; return false;
  }
  if(Number(ctx.card.u539EquipTurnS03) === Number(gameState.turn)){ ctx.reason = 'この効果はこのターン使用しています'; return false; }
  if(u539EquippedS03(ctx.card, ctx.player).length){ ctx.reason = 'このカードには既にモンスターが装備されています（1体のみ）'; return false; }
  if((API.me(ctx).sz || []).length >= ZONE_LIMITS.sz){ ctx.reason = '魔法＆罠ゾーンが一杯です'; return false; }
  if(!u539FoeMonstersS03(ctx).length){ ctx.reason = '相手フィールドにモンスターがいません'; return false; }
  return true;
}
/* ③ 自分が戦闘ダメージを受けた時（このカードの戦闘で、装備している場合） */
function u539DamageS03(ctx){
  const e = ctx.event || {};
  if(ctx.zone !== 'mz' || !ctx.card || ctx.card.face !== 'up') return 0;
  if(!(Number(e.amount) > 0) || e.player !== ctx.player) return 0;
  if(ctx.card.uid == null || (e.attackerUid !== ctx.card.uid && e.defenderUid !== ctx.card.uid)) return 0;
  if(!u539EquippedS03(ctx.card, ctx.player).length) return 0;
  return Number(e.amount);
}

function u539SacrificeS03(name, spec){
  const S = spec || {};
  const effects = [{
    key:'equip-foe', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
    targetRange:LOCATION.MZONE, targetSide:'opponent',
    condition(ctx){ return u539CanEquipS03(ctx); },
    target(ctx, done){
      API.selectCard(name + '：装備する相手モンスター', u539FoeMonstersS03(ctx), t=>done([t]));
    },
    operation(ctx){
      const me = locateCardAnyV4(ctx.card);
      if(!me || me.zone !== 'mz') return;
      API.setCardFlag(me, 'u539EquipTurnS03', gameState.turn, name + '（1ターンに1度）', {silent:true});
      const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
      if(!r || r.zone !== 'mz' || r.card.uid == null) return;
      if(u539EquippedS03(ctx.card, ctx.player).length) return;        /* 1体のみ装備可能 */
      const wasDown = (r.card.face === 'down');
      const foe = findCardByUid(r.card.uid);
      if(!foe || foe.zone !== 'mz') return;
      API.equipMonster(ctx.player, foe, me, name, {sourceUidS03:ctx.card.uid});
      const eq = findCardByUid(r.card.uid);
      if(eq && eq.zone === 'sz' && wasDown)
        API.setCardFlag(eq, 'u539FaceDownS03', gameState.turn, name + '（裏側のまま装備）', {silent:true});
    },
    afterResolve(){}
  }].concat(S.effects || []);

  const meta = {
    type:'monster', priority:1, targets:true, timing:['free'],
    /* ② 戦闘で破壊される場合、代わりに装備したそのモンスターを破壊する（engine/1ZZB、S03-U323 と同じ） */
    equipHostSubstituteS03:'battle',
    continuous:Object.assign({
      scope:'self', from:['mz'],
      apply(card, self){
        if(card !== self || self.face !== 'up') return null;
        const h = locateCardAnyV4(self);
        if(!h || h.zone !== 'mz') return null;
        return u539StatsS03(self, h.p);     /* ② 攻守はそのモンスターの数値になる */
      }
    }, S.continuous || {}),
    passive:Object.assign({}, S.passive || {})
  };
  return defineUnifiedCardV4(name, effects, meta);
}

/* ---- サクリファイス ---- */
u539SacrificeS03('サクリファイス', {
  effects:[{
    /* ③ このカードの戦闘で自分が戦闘ダメージを受けた時、相手も同じ数値分の効果ダメージを受ける */
    key:'reflect-damage', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onBattleDamage'], forced:true,
    condition(ctx){ return u539DamageS03(ctx) > 0; },
    operation(ctx){
      const n = u539DamageS03(ctx);
      if(n > 0) API.damageLP(ctx.opponent, n, 'サクリファイス');
    },
    afterResolve(){}
  }],
  passive:{ onBattleDamage(ctx){ return u539DamageS03(ctx) > 0; } }
});

/* ---- サウザンド・アイズ・サクリファイス ---- */
u539SacrificeS03('サウザンド・アイズ・サクリファイス', {
  continuous:{
    scope:'allMonsters', from:['mz'],
    apply(card, self){
      if(card !== self || self.face !== 'up') return null;
      const h = locateCardAnyV4(self);
      if(!h || h.zone !== 'mz') return null;
      return u539StatsS03(self, h.p);
    },
    /* ① このカード以外のフィールドのモンスターは表示形式を変更できず、攻撃できない */
    cannotAttack(target, self){ return !!self && self.face === 'up' && target !== self; },
    cannotChangePosition(target, self){ return !!self && self.face === 'up' && target !== self; }
  }
});
