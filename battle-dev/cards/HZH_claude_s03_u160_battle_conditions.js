/* S03-U160: monsters whose battle protection is conditional (their text used to be read as unconditional until S03-U158).
   Both are continuous effects only (no activation). */

/* 薄幸の乙女 (2011):
   「このカードは表側攻撃表示で存在する限り戦闘によっては破壊されない。このカードが表側攻撃表示でフィールド上に存在する限り、
   このカードと戦闘を行ったモンスターは表示形式の変更と攻撃ができなくなる。」
   「このカードと戦闘を行ったモンスター」: the battle record written by the ATTACK action on both monsters (engine/00
   battledWithS03, zone-local — a monster that left the field since, or a 乙女 that left and came back, is not that monster). */
defineScript('薄幸の乙女', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  continuous:{
    scope:'allMonsters', from:['mz'],
    apply(){ return null; },
    protectV21:{ key:'薄幸の乙女', label:'薄幸の乙女', scope:'self',
      battle:(target, self)=> target===self && self.face==='up' && self.pos==='atk' },
    cannotAttack:(card, self)=> card!==self && self.face==='up' && self.pos==='atk' && battledTogetherS03(card, self),
    cannotChangePosition:(card, self)=> card!==self && self.face==='up' && self.pos==='atk' && battledTogetherS03(card, self)
  }
});

/* スカー・ウォリアー (2011):
   「このカードがフィールド上に表側表示で存在する限り、相手は表側表示で存在する他の戦士族モンスターを攻撃対象に選択する事は
   できない。また、このカードは1ターンに1度だけ、戦闘では破壊されない。」 (Synchro Summon procedure: the existing Synchro rules.) */
defineScript('スカー・ウォリアー', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  continuous:{
    scope:'ownMonsters', from:['mz'],
    apply(){ return null; },
    cannotBeAttackTarget:(target, self)=> target!==self && target.face==='up' && self.face==='up' && currentRaceV17(target)==='戦士',
    protectV21:{ key:'スカー・ウォリアー', label:'スカー・ウォリアー', scope:'self', perTurn:1,
      battle:(target, self)=> target===self }
  }
});
