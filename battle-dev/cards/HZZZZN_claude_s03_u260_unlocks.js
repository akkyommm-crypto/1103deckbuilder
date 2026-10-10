/* S03-U260: ENGINE_GAP reasons that newer capabilities cover (2011 texts) — ブリザード・プリンセス, エレキリン, エレメント・ヴァルキリー,
   氷結界の交霊師, 怨霊の湿地帯.
   Engine (this unit): engine/1B records card activations of Spells / Traps per player and turn (activatedKindsS03.spellCard / trapCard);
   FX_SET_STATE flipSummon writes card.flipSummonedTurnS03 (zone-local); engine/1ZD lets a source with locksStEffectsS03:true also lock the
   effects of face-up Spells / Traps. Reuses: activationLockS03 (S03-U217 / U259), API.lingerS03 (S03-U257), controlLockS03 (S03-U251),
   System v23 materialFilter, continuous.grantsDirectAttack / cannotAttack. */

function u260FaceUpOnField(card){ const h = card && findCardByUid(card.uid); return !!h && h.zone==='mz' && card.face==='up'; }
function u260AttrOf(card){ return (typeof currentAttributeV17==='function') ? currentAttributeV17(card) : dbOf(card).at; }
function u260AnyFaceUpAttr(attr){ return API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && u260AttrOf(x.card)===attr}).length > 0; }
function u260ActivatedThisTurn(p){ const t = gameState.players[p] && gameState.players[p].temporaryFlags; return (t && t.activatedKindsS03) || {}; }

/* ---- ブリザード・プリンセス: このカードは魔法使い族モンスター1体をリリースして表側攻撃表示でアドバンス召喚する事ができる。
   このカードが召喚に成功したターン、相手は魔法・罠カードを発動する事ができない。 (as フォトン・ケルベロス: while it is face-up on the field) ---- */
defineScript('ブリザード・プリンセス', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  normalSummonProcedure:{includeStandard:true, methods:[
    {id:'spellcasterTribute', tributes:1, modes:['summon'], summonLabel:'魔法使い族モンスター1体をリリースして攻撃表示でアドバンス召喚',
     materialFilter(c){ return (typeof currentRaceV17==='function' ? currentRaceV17(c.card) : c.db.ra)==='魔法使い'; }}]},
  activationLockS03:(i)=>{
    if((i.db.k!=='s' && i.db.k!=='t') || i.p===i.srcPlayer) return false;
    const c = i.src, sp = c.summonProvenance;
    return u260FaceUpOnField(c) && Number(c.summonedTurn)===Number(gameState.turn) && !!sp && (sp.summonType==='normal' || sp.summonType==='tribute');
  }
});

/* ---- エレキリン: このカードは相手プレイヤーに直接攻撃する事ができる。このカードが直接攻撃によって相手ライフに戦闘ダメージを与えた時、
   相手はこのターンのエンドフェイズ時まで魔法・罠・効果モンスターの効果を発動する事ができない。
   (forced trigger; the card lingers for the turn (API.lingerS03), so the lock stays even if it leaves the field; it also locks the effects of face-up
   Spells / Traps — locksStEffectsS03) ---- */
function u260ElekirinHit(ctx){
  const e = ctx.event;
  return !!e && e.direct && e.attackerUid!=null && ctx.card && e.attackerUid===ctx.card.uid && e.player===ctx.opponent;
}
defineScript('エレキリン', {
  type:'monster', priority:1, forced:true, activateFrom:['mz'],
  condition(ctx){ if(!u260ElekirinHit(ctx)){ ctx.reason = '直接攻撃で戦闘ダメージを与えた時に発動します'; return false; } return true; },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card); if(!me) return;
    API.setCardFlag(me, 'u260ElekirinTurnS03', gameState.turn, 'エレキリン');
    const me2 = locateCardAnyV4(ctx.card); if(me2) API.lingerS03(ctx.player, me2, 'エレキリン');
  },
  afterResolve(){},
  passive:{ onDirectBattleDamage(ctx){ return u260ElekirinHit(ctx); } },
  locksStEffectsS03:true,
  activationLockS03:(i)=> i.p!==i.srcPlayer && Number(i.src.u260ElekirinTurnS03)===Number(gameState.turn),
  continuous:{scope:'self', from:['mz'], apply(){ return null; },
    grantsDirectAttack(card, self){ return card===self; }}
});

/* ---- エレメント・ヴァルキリー: フィールド上に特定の属性を持つモンスターが存在する場合、以下の効果を得る。
   ●炎属性:このカードの攻撃力は500ポイントアップする。●水属性:このカードのコントロールを変更する事ができない。 ---- */
defineScript('エレメント・ヴァルキリー', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  controlLockS03(card){ return u260FaceUpOnField(card) && u260AnyFaceUpAttr('水'); },
  continuous:{scope:'self', from:['mz'], apply(card, self){ return (card===self && self.face==='up' && u260AnyFaceUpAttr('炎')) ? {atk:500} : null; }}
});

/* ---- 氷結界の交霊師: 相手フィールド上のカードの枚数が、自分フィールド上より4枚以上多い場合、このカードは手札から特殊召喚できる。
   このカードがフィールド上に表側表示で存在する限り、相手は1ターンに1度しか魔法・罠カードを発動できない。
   (card activations, counted by the per-turn record of engine/1B — activations made earlier in the turn count too) ---- */
function u260FieldCount(p){ const P = gameState.players[p]; return (P.mz||[]).filter(Boolean).length + (P.sz||[]).filter(Boolean).length + (P.field ? 1 : 0); }
defineScript('氷結界の交霊師', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  summonProcedure:{
    from:['hand'], positions:['atk','def'],
    condition(ctx){ if(u260FieldCount(ctx.player===0?1:0) < u260FieldCount(ctx.player) + 4){ ctx.reason = '相手フィールドのカードが自分より4枚以上多い必要があります'; return false; } return true; },
    cost(ctx, done){ done(true); }
  },
  activationLockS03:(i)=>{
    if((i.db.k!=='s' && i.db.k!=='t') || i.p===i.srcPlayer || !u260FaceUpOnField(i.src)) return false;
    const r = u260ActivatedThisTurn(i.p);
    return !!(r.spellCard || r.trapCard);
  }
});

/* ---- 怨霊の湿地帯 (Continuous Spell): 召喚・反転召喚・特殊召喚されたモンスターは、そのターンに攻撃する事ができない。 ---- */
function u260SummonedThisTurn(card){
  if(!card) return false;
  return Number(card.summonedTurn)===Number(gameState.turn) || Number(card.flipSummonedTurnS03)===Number(gameState.turn);
}
defineScript('怨霊の湿地帯', {
  type:'spell', priority:1,
  condition(ctx){ if(ctx.zone==='sz' && ctx.card && ctx.card.face==='up' && !ctx.card.activationPending){ ctx.reason = '発動済みです'; return false; } return true; },
  resolve(){}, afterResolve(){},
  continuous:{scope:'allMonsters', from:['sz'], apply(){ return null; },
    cannotAttack(card, self){ return !!self && self.face==='up' && !self.activationPending && u260SummonedThisTurn(card); }}
});
