/* S03-U519: パワー・フレーム, フォーメーション・ユニオン（1103対象の未実装カード。carddata のテキスト）。

   パワー・フレーム（罠）
     自分フィールド上に表側表示で存在するモンスターが、その攻撃力よりも高い攻撃力を持つモンスターの
     攻撃対象に選択された時に発動する事ができる。その攻撃を無効にし、このカードを攻撃対象モンスター1体に装備する。
     装備モンスターの攻撃力は、その時の攻撃モンスターと攻撃対象モンスターの攻撃力の差の数値分アップする。
   フォーメーション・ユニオン（罠）
     次の効果から1つを選択して発動する。
     ●自分フィールド上に表側表示で存在するユニオンモンスター1体を選択し、自分フィールド上に表側表示で
       存在する装備可能なモンスターに装備する。
     ●自分フィールド上に存在する装備カード扱いのユニオンモンスター1体の装備を解除して、自分フィールド上に
       表側攻撃表示で特殊召喚する。

   当時の裁定（この実装の根拠。推測ではない）
   - パワー・フレーム
     WIKI-518D4C8C4B50（10/02/21）「このカードは攻撃したモンスターも対象に取りますか？」
       →「いいえ、対象に取るのは攻撃対象になったモンスター1体だけで攻撃モンスター1体は対象には取りません」
       → 対象は攻撃対象モンスターだけ（発動時に宣言する）。攻撃モンスターは対象に取らない。
     WIKI-3AA3F72AEC8B（10/02/21）《突進》をチェーンして攻撃対象の攻撃力が攻撃モンスターを上回った場合でも
       「攻撃力が上がる効果は適用され…差は600になりますので、装備モンスターの攻撃力は1600+600=2200になります」
       → 上げる数値は**解決時**の両者の攻撃力の差（絶対値）。発動時の差ではない。
     WIKI-2916A8C2E7B4（10/03/24）「このカードの発動に対して《サイクロン》等をチェーンされ破壊された場合でも、
       攻撃は無効になります」→ 先に攻撃を無効にし、装備はカードが魔法＆罠ゾーンに残っている時だけ行う。
   - フォーメーション・ユニオン
     WIKI-B49FAB74603A（09/03/05）《スキルドレイン》でユニオンの効果が無効でも装備させられる。
     WIKI-D657D4542632（09/03/05）《エンジェルＯ７》《超古代生物の墓場》でユニオンの効果を発動できない時でも
       装備させられる。→ これは**罠カードの効果**なので、ユニオンモンスター自身の効果の発動可否や
       「1ターンに1度」とは無関係に動く（unionTurnS03 を消費しない）。
     WIKI-8294B5F99F4B（09/01/20）このカードで装備した同じターンに装備を解除して特殊召喚でき、
       解除して特殊召喚したユニオンを同じターンに再度装備する事もできる。→ 回数制限を付けない。
     未確定（RULING_UNRESOLVED）: 当時のテキストの「選択」が対象を取るかどうかを答える当時の裁定が無い。
       ここでは解決時に選ぶ（対象を取らない）形にしている。発動時に効果（●の選択）は宣言する
       （テキストが「1つを選択して発動する」なので、どちらを行うかは発動時に決まる）。 */

/* ---- パワー・フレーム ---- */
/* 攻撃宣言の状態から「自分の表側モンスターが、より高い攻撃力のモンスターの攻撃対象に選択された」を読む。 */
function u519FrameLiveS03(ctx){
  const a = gameState.pendingAttack;
  if(!a || a.targetUid==null || gameState.attackNegated) return null;
  const t = findCardByUid(a.targetUid);
  const at = (a.attackerUid!=null) ? findCardByUid(a.attackerUid) : null;
  if(!t || t.zone!=='mz' || t.p!==ctx.player || t.card.face!=='up') return null;
  if(!at || at.zone!=='mz') return null;
  if(!(curATK(at.card) > curATK(t.card))) return null;
  return {t, at};
}
function u519FrameAttackerS03(ctx){
  const b = ctx.battle || {};
  if(b.atkCard) return b.atkCard;
  const a = gameState.pendingAttack;
  const h = (a && a.attackerUid!=null) ? findCardByUid(a.attackerUid) : null;
  return h ? h.card : null;
}
/* 《次元幽閉》《聖なるバリア －ミラーフォース－》と同じ、攻撃宣言時に発動する罠の形
   （passive.onAttackDeclare が発動できるタイミングを決め、selectTargets が対象を宣言する）。 */
defineScript('パワー・フレーム', {
  type:'trap', priority:2, targets:true,
  condition(ctx){
    if(!u519FrameLiveS03(ctx)){
      ctx.reason = '自分の表側モンスターが、その攻撃力より高い攻撃力のモンスターの攻撃対象に選択された時に発動します';
      return false;
    }
    return true;
  },
  /* WIKI-518D4C8C4B50（10/02/21）: 対象に取るのは攻撃対象モンスターだけ。攻撃モンスターは対象に取らない。 */
  selectTargets(ctx, done){
    const L = u519FrameLiveS03(ctx);
    if(!L){ done([]); return; }
    API.selectCard('パワー・フレーム：攻撃対象モンスター', [L.t], t=>done([t]));
  },
  resolve(ctx){
    /* WIKI-2916A8C2E7B4（10/03/24）: チェーンで破壊されても攻撃は無効になる。先に無効にする。 */
    API.negateAttack('パワー・フレーム');
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    const me = locateCardAnyV4(ctx.card);
    if(!r || r.zone!=='mz' || r.card.face!=='up' || !me || me.zone!=='sz') return;
    /* WIKI-3AA3F72AEC8B（10/02/21）: 上げる数値は解決時の両者の攻撃力の差。 */
    const atkCard = u519FrameAttackerS03(ctx);
    const diff = atkCard ? Math.abs(curATK(atkCard) - curATK(r.card)) : 0;
    if(API.equipSpell(me, r, 'パワー・フレーム')){
      const eq = locateCardAnyV4(ctx.card);
      if(eq) API.setCardFlag(eq, 'u519FrameAtkS03', diff, 'パワー・フレーム（攻撃力の差）', {silent:true});
    }
  },
  afterResolve(){},
  passive:{ onAttackDeclare(ctx){ return ctx.zone==='sz' && ctx.card.face==='down' && !!u519FrameLiveS03(ctx); } },
  continuous:{ scope:'equippedMonster', from:['sz'], apply(card, self){
    const n = Number(self && self.u519FrameAtkS03) || 0;
    return n ? {atk:n} : null; } }
});

/* ---- フォーメーション・ユニオン ---- */
function u519IsUnionCardS03(card){
  const sc = card && CARD_SCRIPTS[cardName(card)];
  return !!(sc && sc.unionS03 === true);
}
/* 場のユニオンモンスターのうち、装備できる先が1体以上いるもの */
function u519UnionsWithHostS03(p){
  return API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='up' && u519IsUnionCardS03(x.card)})
    .filter(u=>u519UnionHostsS03(p, u.card).length>0);
}
function u519UnionHostsS03(p, unionCard){
  return API.fieldCards({player:p, zone:'mz', filter:x=>unionCanEquipS03(unionCard, x)});
}
/* 装備カード扱いで存在する自分のユニオンモンスター */
function u519EquippedUnionsS03(p){
  return API.fieldCards({player:p, zone:'sz', filter:x=>x.card.v46MonsterEquip===true && u519IsUnionCardS03(x.card)});
}
function u519ModeEquipOkS03(p){ return (gameState.players[p].sz||[]).length<=ZONE_LIMITS.sz && u519UnionsWithHostS03(p).length>0; }
function u519ModeReleaseOkS03(p){
  if(!u519EquippedUnionsS03(p).length) return false;
  if(!hasMonsterZoneSpace(p)) return false;
  return true;
}
function u519ModesS03(p){
  const out = [];
  if(u519ModeEquipOkS03(p)) out.push({key:'equip', label:'ユニオンモンスターを装備する', value:'equip'});
  if(u519ModeReleaseOkS03(p)) out.push({key:'release', label:'装備を解除して特殊召喚する', value:'release'});
  return out;
}
API.registerChoiceHandler('s03u519.fu-mode', (a, x)=>{
  if(a.cancelled) return p11cAbort(x.activation);
  const m = a.cards && a.cards[0] && a.cards[0].value;
  if(!m) return p11cAbort(x.activation);
  x.activation.v4EffectKey = String(m);
  p11cCommit(x.activation, [], String(m));
});
defineScript('フォーメーション・ユニオン', {
  type:'trap', priority:2,
  condition(ctx){
    if(!u519ModesS03(ctx.player).length){
      ctx.reason = '装備できるユニオンモンスターも、装備を解除できるユニオンモンスターもいません';
      return false;
    }
    return true;
  },
  /* テキストが「次の効果から1つを選択して発動する」なので、どちらを行うかは発動時に宣言する。 */
  activationV11(ctx, d){
    p11cOpen(d, {kind:'mode', title:'フォーメーション・ユニオン：効果を選択',
      candidates:u519ModesS03(ctx.player), targeting:false}, 's03u519.fu-mode', {});
  },
  resolve(ctx){
    const mode = ctx.v4EffectKey || (u519ModeEquipOkS03(ctx.player) ? 'equip' : 'release');
    if(mode === 'equip'){
      const pool = u519UnionsWithHostS03(ctx.player);
      if(!pool.length){ API.log('フォーメーション・ユニオン：装備できるユニオンモンスターがいない（不発）'); return; }
      API.selectCard('フォーメーション・ユニオン：装備するユニオンモンスター', pool, u=>{
        const ur = resolveTarget(u);
        if(!ur || ur.zone!=='mz') return;
        const hosts = u519UnionHostsS03(ctx.player, ur.card);
        if(!hosts.length){ API.log('フォーメーション・ユニオン：装備可能なモンスターがいない（不発）'); return; }
        API.selectCard('フォーメーション・ユニオン：装備するモンスター', hosts, h=>{
          const hr = resolveTarget(h), now = resolveTarget(u);
          if(!hr || hr.zone!=='mz' || !now || now.zone!=='mz') return;
          /* ユニオン自身の「1ターンに1度」は使わない（WIKI-B49FAB74603A / WIKI-D657D4542632 09/03/05）。 */
          API.equipMonster(ctx.player, now, hr, 'フォーメーション・ユニオン');
        });
      });
      return;
    }
    const pool = u519EquippedUnionsS03(ctx.player);
    if(!pool.length){ API.log('フォーメーション・ユニオン：装備カード扱いのユニオンモンスターがいない（不発）'); return; }
    API.selectCard('フォーメーション・ユニオン：装備を解除するユニオンモンスター', pool, u=>{
      const ur = resolveTarget(u);
      if(!ur || ur.zone!=='sz' || ur.card.v46MonsterEquip!==true) return;
      if(!hasMonsterZoneSpace(ctx.player)) return;
      API.unequip(ur, 'フォーメーション・ユニオン');
      const now = resolveTarget(u);
      if(now && now.zone==='sz') API.specialSummon(ctx.player, 'sz', now.index, 'atk', 'フォーメーション・ユニオン');
    });
  },
  afterResolve(){}
});
