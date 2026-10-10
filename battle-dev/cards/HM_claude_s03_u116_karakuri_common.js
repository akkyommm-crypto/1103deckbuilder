/* S03-U116: カラクリ common clauses, added generically to the Karakuri monsters that lacked them.
   2011 texts (project carddata):
     ・このカードは攻撃可能な場合には攻撃しなければならない。
     ・フィールド上に表側攻撃表示で存在するこのカードが攻撃対象に選択された時、このカードの表示形式を守備表示にする。
       （弐参六 / 壱七七 / 弐四八: 'atkToDef'）
     ・フィールド上に表側表示で存在するこのカードが攻撃対象に選択された時、このカードの表示形式を変更する。
       （九壱九: 'toggle'）
   Measured (U115 build): カラクリ兵 弐参六 and カラクリ商人 壱七七 had neither clause (U52 had recorded the 弐参六 gap);
   カラクリ参謀 弐四八 and カラクリ忍者 九壱九 had must-attack but no attack-target position change. All four are in the
   fixed karakuri list (x3, x3, x2, x2). The same clause already existed on カラクリ守衛 参壱参 / カラクリ小町 弐弐四.

   The clause is a mandatory trigger on onAttackDeclare when this face-up card is the attack target. It is wrapped around
   the card's existing script (its own trigger is kept and dispatched by eventName). Mandatory-ness is per event via
   forcedForEventS03 (engine/1ZB), because カラクリ兵 弐参六's own recruit trigger is optional ("できる"). */
function karakuriAttackTargetedS03(ctx, mode){
  const a = gameState.pendingAttack;
  if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up' || !a) return false;
  if(a.targetUid!==ensureCardUid(gameState, ctx.card)) return false;
  return mode==='toggle' ? true : ctx.card.pos==='atk';
}
function karakuriAddCommonClausesS03(name, mode){
  const sc = CARD_SCRIPTS[name];
  if(!sc) throw new Error('karakuriAddCommonClausesS03: no script for '+name);
  const origCondition = sc.condition, origResolve = sc.resolve, origSelect = sc.selectTargets;
  const origForced = !!sc.forced, origForcedFor = sc.forcedForEventS03;
  const cont = sc.continuous || {scope:'self', from:['mz'], apply(){ return null; }};
  if((cont.scope||'self')!=='self') throw new Error('karakuriAddCommonClausesS03: non-self continuous on '+name);
  cont.mustAttack = function(){ return true; };
  sc.continuous = cont;
  sc.condition = function(ctx){
    if(ctx.eventName==='onAttackDeclare'){
      if(karakuriAttackTargetedS03(ctx, mode)) return true;
      ctx.reason = mode==='toggle' ? '表側表示のこのカードが攻撃対象に選択された時です' : '表側攻撃表示のこのカードが攻撃対象に選択された時です';
      return false;
    }
    return typeof origCondition==='function' ? origCondition.call(this, ctx) : true;
  };
  if(typeof origSelect==='function'){
    sc.selectTargets = function(ctx, done){
      if(ctx.eventName==='onAttackDeclare'){ done([]); return; }
      return origSelect.call(this, ctx, done);
    };
  }
  sc.resolve = function(ctx){
    if(ctx.eventName==='onAttackDeclare'){
      const h = locateCardAnyV4(ctx.card);
      if(!h || h.zone!=='mz' || h.card.face!=='up') return;
      if(mode==='toggle') API.changePosition(h, h.card.pos==='atk' ? 'def' : 'atk', name);
      else if(h.card.pos==='atk') API.changePosition(h, 'def', name);
      return;
    }
    return typeof origResolve==='function' ? origResolve.call(this, ctx) : undefined;
  };
  sc.passive = Object.assign({}, sc.passive||{}, {onAttackDeclare(ctx){ return karakuriAttackTargetedS03(ctx, mode); }});
  sc.forcedForEventS03 = function(eventName){
    if(eventName==='onAttackDeclare') return true;
    return typeof origForcedFor==='function' ? !!origForcedFor(eventName) : origForced;
  };
  /* an explicit timing list must also allow the attack-declaration window */
  if(Array.isArray(sc.timing) && sc.timing.indexOf('attackDeclare')<0) sc.timing = sc.timing.concat(['attackDeclare']);
}
karakuriAddCommonClausesS03('カラクリ兵 弐参六', 'atkToDef');
karakuriAddCommonClausesS03('カラクリ商人 壱七七', 'atkToDef');
karakuriAddCommonClausesS03('カラクリ参謀 弐四八', 'atkToDef');
karakuriAddCommonClausesS03('カラクリ忍者 九壱九', 'toggle');
