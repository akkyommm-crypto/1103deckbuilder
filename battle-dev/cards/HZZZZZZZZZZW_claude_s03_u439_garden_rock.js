/* S03-U439: 氷結界の御庭番, 幻獣ロックリザード, ローズ・テンタクルス (stale ENGINE_GAP / NOT_STARTED cards, carddata texts).

   氷結界の御庭番      このカードがフィールド上に表側表示で存在する限り、自分フィールド上の「氷結界」と名のついたモンスターは相手の効果モンスターの効果の対象にならない。
   幻獣ロックリザード  「幻獣」と名のついたモンスターを生け贄に捧げる場合、このカードは生け贄1体で召喚する事ができる。このカードが戦闘で破壊したモンスター1体につき、相手ライフに500ポイントダメージを与える。相手がコントロールするカードの効果によってこのカードが破壊され墓地へ送られた時、相手ライフに2000ポイントダメージを与える。
   ローズ・テンタクルス このカードは特殊召喚できない。自分のバトルフェイズ開始時に相手フィールド上に表側表示で植物族モンスターが存在する場合、このターンこのカードは通常の攻撃に加えて、その植物族モンスターの数だけ攻撃する事ができる。このカードが戦闘によって植物族モンスターを破壊した場合、相手ライフに300ポイントダメージを与える。

   Notes
   - 御庭番: continuous.immuneToTarget(card, self) with the effect source of the activation being prepared (u378Source, S03-U378): only an Effect Monster of the opponent; Traps / Spells are not covered by the text.
   - ロックリザード: normalSummonProcedure method (System v23): one Tribute that is a 「幻獣」 monster; a forced onDamageStep burn of 500 per monster it destroyed in battle (u321Killed); a forced Graveyard trigger on a destruction by an effect of the opponent (graveInfo.byDestroy, not battle / rule, byPlayer = the opponent): 2000.
   - テンタクルス: cannotSpecialSummon; onPhaseChange into my Battle Phase grants API.grantAdditionalAttack(n) with n = the face-up Plants of the opponent; a forced onDamageStep burn of 300 when it destroyed a Plant in battle. */

/* ---- 氷結界の御庭番 ---- */
defineScript('氷結界の御庭番', {
  type:'monster', priority:1, timing:['free'],
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; }, resolve(){}, afterResolve(){},
  continuous:{ scope:'ownMonsters', from:['mz'], apply(){ return null; },
    immuneToTarget(card, self, effectInfo){
      if(self.face!=='up' || !card || card.face!=='up' || dbOf(card).k!=='m' || String(dbOf(card).n||'').indexOf('氷結界')<0) return false;
      const host = locateCardAnyV4(card), src = u378SrcOf(effectInfo); if(!host || !src || src.player===host.p) return false;
      return src.db.k==='m' && (src.db.st||[]).indexOf('効果')>=0;
    } } });

/* ---- 幻獣ロックリザード ---- */
function u439Rock(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && !!u321Killed(ctx); }
function u439Burned(ctx){
  const e = ctx.event || {}, g = ctx.card.graveInfo;
  return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && !!g && g.from==='mz' && !!g.byDestroy && !g.battle && !g.rule && !g.selfRuleS03 && g.byPlayer===ctx.opponent && Number(g.turn)===Number(gameState.turn);
}
defineUnifiedCardV4('幻獣ロックリザード', [{
  key:'kill-burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return u439Rock(ctx); },
  operation(ctx){ API.damageLP(ctx.opponent, 500, '幻獣ロックリザード'); },
  afterResolve(){}
},{
  key:'effect-burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave'], forced:true,
  condition(ctx){ return u439Burned(ctx); },
  operation(ctx){ API.damageLP(ctx.opponent, 2000, '幻獣ロックリザード'); },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], forced:true, dsTiming:'after', activateFrom:['mz','grave'],
  passive:{ onDamageStep(ctx){ return u439Rock(ctx); }, onSendToGrave(ctx){ return u439Burned(ctx); } },
  normalSummonProcedure:{includeStandard:true, methods:[{id:'genjuTribute', tributes:1, modes:['summon','set'], summonLabel:'「幻獣」モンスター1体をリリースしてアドバンス召喚', setLabel:'「幻獣」モンスター1体をリリースしてアドバンスセット',
    materialFilter(c){ return String((c.db && c.db.n) || '').indexOf('幻獣')>=0; }}]} });

/* ---- ローズ・テンタクルス ---- */
function u439Plants(p){ return API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m' && x.db.ra==='植物'}).length; }
function u439BpStart(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && gameState.phase==='battle' && gameState.activePlayer===ctx.player && Number(ctx.card.u439Bp)!==Number(gameState.turn) && u439Plants(ctx.opponent)>0; }
function u439Kill(ctx){ const v = ctx.zone==='mz' && ctx.card.face==='up' ? u321Killed(ctx) : null; return !!v && dbOf(v).ra==='植物' && !!ctx.battle && ctx.battle.atkCard===ctx.card; }
defineUnifiedCardV4('ローズ・テンタクルス', [{
  key:'multi', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onPhaseChange'], forced:true,
  condition(ctx){ return u439BpStart(ctx); },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz') return; const n = u439Plants(ctx.opponent); if(!n) return;
    API.setCardFlag(me, 'u439Bp', gameState.turn, 'ローズ・テンタクルス', {silent:true}); API.grantAdditionalAttack(me, n, 'ローズ・テンタクルス'); },
  afterResolve(){}
},{
  key:'plant-burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return u439Kill(ctx); },
  operation(ctx){ API.damageLP(ctx.opponent, 300, 'ローズ・テンタクルス'); },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], forced:true, dsTiming:'after', cannotSpecialSummon:true,
  passive:{ onPhaseChange(ctx){ return u439BpStart(ctx); }, onDamageStep(ctx){ return u439Kill(ctx); } } });
