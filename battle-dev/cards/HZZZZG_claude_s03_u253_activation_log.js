/* S03-U253: per-turn activation record + 「通常召喚できない。「X」の効果で特殊召喚できる」 (2011 texts) —
   ナチュル・スパイダーファング, ハーピィ・レディ三姉妹, マシンナーズ・スナイパー (engine/1ZU: 「お互いに」 attack-target restriction).
   Engine (this unit):
   - engine/1B v12EmitActivation (inside the CHAIN_ADD reducer) records what each player activated this turn:
     gs.players[p].temporaryFlags.activatedKindsS03 = {spell, trap, monster} (cleared at every turn start);
   - engine/1ZK summonOnlyByS03 parses 「このカードは通常召喚できない。「X」の効果で特殊召喚できる／する事ができる」 as a summon condition
     (X's effect only; relaxed once properly summoned, like 「でのみ」), and X counts as the proper method (properSummonSourcesS03). */

/* ---- ナチュル・スパイダーファング: このカードは、相手が魔法・罠・効果モンスターの効果を発動したターンでなければ攻撃宣言できない。 ---- */
function opponentActivatedThisTurnS03(p){
  const foe = gameState.players[p===0 ? 1 : 0];
  const rec = foe && foe.temporaryFlags && foe.temporaryFlags.activatedKindsS03;
  return !!(rec && (rec.spell || rec.trap || rec.monster));
}
defineScript('ナチュル・スパイダーファング', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  continuous:{scope:'self', from:['mz'], apply(){ return null; },
    cannotAttack(card, self){
      if(card!==self) return false;
      const h = findCardByUid(card.uid);
      return !!h && !opponentActivatedThisTurnS03(h.p);
    }}
});

/* ---- ハーピィ・レディ三姉妹: このカードは通常召喚できない（text, S03-U190）。「万華鏡－華麗なる分身－」の効果で特殊召喚できる（engine/1ZK）。
   No other effect. ---- */
defineScript('ハーピィ・レディ三姉妹', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '召喚条件のみのカードです'; return false; },
  resolve(){}, afterResolve(){}
});

/* ---- マシンナーズ・スナイパー: ①:このカードがモンスターゾーンに存在する限り、お互いに「マシンナーズ・スナイパー」以外の「マシンナーズ」モンスターを攻撃できない。
   (engine/1ZU cannotBeAttackTarget + cannotBeAttackTargetBothS03, S03-U253; 「マシンナーズ」 = SETCODE.MACHINA, exact for monsters;
   a face-down monster has no name and is not restricted) ---- */
function machinaDbS03(db){ return !!db && db.k==='m' && isSetCardV4(db, SETCODE.MACHINA); }
defineScript('マシンナーズ・スナイパー', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  continuous:{scope:'allMonsters', from:['mz'], apply(){ return null; }, cannotBeAttackTargetBothS03:true,
    cannotBeAttackTarget(target, self){
      if(!target || !self || self.face!=='up' || target.face!=='up' || target===self) return false;
      const d = dbOf(target);
      return machinaDbS03(d) && d.n!=='マシンナーズ・スナイパー';
    }}
});
