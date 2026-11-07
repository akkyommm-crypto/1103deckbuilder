/* S03-U534: ニトロ・ウォリアー（1103対象の未実装カード。carddata のテキスト）。

   ニトロ・ウォリアー（シンクロ・効果・星7・戦士・炎・攻2800/守1800）
     「ニトロ・シンクロン」＋チューナー以外のモンスター1体以上
     このカードがフィールド上に表側表示で存在する限り、自分のターンに自分が魔法カードを発動した場合、
     このカードの攻撃力はそのターンのダメージ計算時のみ1度だけ1000ポイントアップする。
     また、このカードの攻撃によって相手モンスターを破壊したダメージ計算後に発動できる。
     相手フィールド上に表側守備表示で存在するモンスター1体を選択して攻撃表示にし、
     そのモンスターにもう1度だけ続けて攻撃できる。

   当時の裁定（この実装の根拠。推測ではない）
     WIKI-5B7D3137B22E（08/04/19）攻撃力アップは**ダメージ計算時の永続効果**でチェーンブロックを作らない
       → `continuous.apply` で、ダメージ計算中かつこのカードが攻撃モンスターの時だけ +1000 を返す。
     WIKI-167AABFDECDD（08/04/19）魔法を発動したターンの**1回目の攻撃で必ず**上昇する（任意ではない）。
     WIKI-B3DFB06AC6D7（08/04/19）魔法を発動していない状態で攻撃し、2回目の攻撃のダメージ計算までに
       速攻魔法を発動した場合も「魔法発動後の1回目」なので上昇する
       → 魔法の発動時点の攻撃回数を印に残し（engine/00 の spellActS03）、その次の攻撃だけに乗せる。
       そのターン最初の魔法でだけ印を書くので「1ターンに1度」になる。
     WIKI-78D6ED4FE2E7（08/05/23）魔法の発動時にこのカードが表側表示で存在していなければ上昇しない /
     WIKI-5FF944747E56（08/10/07）魔法の発動時に**自分フィールドに**存在していなければ上昇しない
       （コントロールを得た場合も上昇しない）→ 印は発動の瞬間に、そのプレイヤーの場の表側のカードだけに付き、
       印に持ち主を持たせて別のコントローラーでは使わない。
     WIKI-2127AE156834（10/11/17）もう1度攻撃する効果は「モンスターの戦闘破壊が確定したダメージ計算後」に
       表側守備表示のモンスターを**対象に取って**発動する。
     WIKI-67F51A7AD2D5（08/04/19）通常の攻撃＋この効果の攻撃で最大2回（1ターンに1度だけ）。
     WIKI-6B508244BF77（09/09/30）対象が場を離れても攻撃対象は変更できない
       → もう1度の攻撃は選択したモンスターだけを攻撃対象にできる（印に uid を残す）。
     WIKI-981A92839D13（10/06/30）「攻撃対象に選択できない」モンスターを選んだ場合は、表示形式を変える
       処理だけを行い連続攻撃は行えない → 攻撃の可否は共通の攻撃対象の判定に任せる。
     WIKI-2B1560281ACB（10/05/09）《魂を削る死霊》を選んだ場合はそれが破壊され、他には攻撃できない。
     WIKI-4B9C7475E90E（10/06/30）攻撃表示にした後にチェーンに乗らない効果で守備表示になっても攻撃できる
       → 印は uid だけを見る（表示形式は見ない）。 */

function u534FoeDefMonstersS03(ctx){
  return API.fieldCards({player:ctx.opponent, zone:'mz',
    filter:x=>x.card.face === 'up' && x.card.pos === 'def'});
}
/* このカードの攻撃で破壊した相手モンスター（ダメージ計算後） */
function u534KilledFoeS03(ctx){
  const b = ctx.battle || {};
  if(b.atkCard === ctx.card && b.destroyedDef && b.defCard) return b.defCard;
  return null;
}

defineScript('ニトロ・ウォリアー', {
  type:'monster', priority:1, targets:true, dsTiming:'after',
  /* engine/00 が魔法の発動の瞬間に印を置く対象である事の申告（S03-U534） */
  spellActWatchS03:true,
  /* もう1度の攻撃（印が付いたターンだけ 2 回） */
  attackLimit(card){ return (card && Number(card.u534ExtraS03) === Number(gameState.turn)) ? 2 : 1; },
  condition(ctx){
    if(ctx.zone !== 'mz' || !ctx.card || ctx.card.face !== 'up'){ ctx.reason = 'フィールドで表側表示の時に発動します'; return false; }
    if(!u534KilledFoeS03(ctx)){ ctx.reason = 'このカードの攻撃で相手モンスターを破壊した時に発動します'; return false; }
    if(Number(ctx.card.u534ExtraS03) === Number(gameState.turn)){ ctx.reason = 'このターンは既に使用しています'; return false; }
    if(!u534FoeDefMonstersS03(ctx).length){ ctx.reason = '相手フィールドに表側守備表示のモンスターがいません'; return false; }
    return true;
  },
  /* WIKI-2127AE156834（10/11/17）: 表側守備表示のモンスターを対象に取る。 */
  selectTargets(ctx, done){
    API.selectCard('ニトロ・ウォリアー：攻撃表示にして攻撃するモンスター', u534FoeDefMonstersS03(ctx), t=>done([t]));
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(!r || r.zone !== 'mz'){ API.log('ニトロ・ウォリアー：選択したモンスターがフィールドにいない'); return; }
    API.changePosition(r, 'atk', 'ニトロ・ウォリアー');
    /* もう 1 度だけ、選択したモンスターにだけ攻撃できる（WIKI-6B508244BF77: 対象は変更できない） */
    API.setCardFlag(me, 'u534ExtraS03', gameState.turn, 'ニトロ・ウォリアー（もう1度攻撃）', {silent:true});
    API.setCardFlag(me, 'u534PinS03', (r.card.uid != null) ? r.card.uid : null,
                    'ニトロ・ウォリアー（攻撃対象の固定）', {silent:true});
    API.log('ニトロ・ウォリアー：選択したモンスターを攻撃表示にし、もう1度攻撃できる');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return !!u534KilledFoeS03(ctx); } },
  continuous:{
    scope:'allMonsters', from:['mz'],
    /* 魔法を発動したターンの、その後最初の攻撃のダメージ計算時だけ攻撃力 +1000 */
    apply(card, self, info){
      if(card !== self) return null;
      const m = self.spellActS03;
      if(!m || Number(m.turn) !== Number(gameState.turn)) return null;
      if(m.player !== info.p) return null;                       /* WIKI-5FF944747E56: 発動時の持ち主だけ */
      if(Number(self.attackCount || 0) !== Number(m.atk) + 1) return null;   /* 魔法発動後の 1 回目の攻撃 */
      if(!(typeof inDamageStepS03 === 'function' && inDamageStepS03())) return null;
      const b = gameState.battle;
      if(!b || b.atkUid == null || b.atkUid !== self.uid) return null;
      return {atk:1000};
    },
    /* もう1度の攻撃は、選択したモンスターしか攻撃対象にできない（お互いに効く宣言として扱う） */
    cannotBeAttackTargetBothS03:true,
    cannotBeAttackedByS03(target, attacker, self){
      if(!self || self !== attacker) return false;
      if(Number(self.u534ExtraS03) !== Number(gameState.turn)) return false;
      if(Number(self.attackCount || 0) < 1) return false;        /* 1 回目の攻撃は普通に選べる */
      const pin = self.u534PinS03;
      if(pin == null) return false;
      return !target || target.uid !== pin;
    }
  }
});
