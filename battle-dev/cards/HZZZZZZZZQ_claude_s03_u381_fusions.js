/* S03-U381: three NOT_STARTED monsters with battle / targeting clauses (carddata texts).

   聖獣セルケト            ①:自分フィールドに「王家の神殿」が存在しない場合にこのカードは破壊される。②:このカードがモンスターゾーンに存在する限り、このカードが戦闘で破壊したモンスターは除外される。③:このカードが戦闘でモンスターを破壊した場合に発動する。このカードの攻撃力は500アップする。
   地天の騎士ガイアドレイク 「大地の騎士ガイアナイト」＋効果モンスター以外のシンクロモンスター このカードは効果モンスターの効果の対象にならず、効果モンスターの効果では破壊されない。
   ナイトメアを駆る死霊     「魂を削る死霊」＋「ナイトメア・ホース」 このカードは戦闘によっては破壊されない。魔法・罠・効果モンスターの効果の対象になった時、このカードを破壊する。このカードは相手フィールド上にモンスターが存在しても相手プレイヤーに直接攻撃をする事ができる。直接攻撃に成功した場合、相手はランダムに手札を1枚捨てる。

   Notes
   - セルケト: selfDestroyWhenS03 (engine/1ZZF) for ①, battleVictimBanishS03 (S03-U255) for ②, a forced onDamageStep trigger after the battle (a6DestroyedFoeInBattle, as 聖導騎士イシュザーク) for ③ (a permanent stat modifier until it leaves / turns face-down; one count per victim).
   - ガイアドレイク: continuous.immuneToTarget with the effect source from effectInfo (u378SrcOf, S03-U457; the prep-only u378Source() lost it at resolution), and protectV21 (engine/1K) {effect, sourceKind ['m']} for the destruction part. A Fusion Monster is placed on the field directly in the test (its Fusion Summon is the engine's).
   - ナイトメアを駆る死霊: declareTargetedSelfDestroyS03 (engine/1ZM, S03-U137) for the self-destruction when targeted; battleProof (text), continuous.grantsDirectAttack, and the random discard on onDirectBattleDamage (as エレキリム S03-U336, duelRandomInt). */

/* ---- 聖獣セルケト ---- */
function u381Temple(p){ return (gameState.players[p].sz||[]).some(c=>c && c.face==='up' && dbOf(c).n==='王家の神殿') || (gameState.players[p].field && gameState.players[p].field.face==='up' && dbOf(gameState.players[p].field).n==='王家の神殿'); }
function u381SethKill(ctx){
  if(ctx.zone!=='mz' || ctx.card.face!=='up') return null;
  const v = a6DestroyedFoeInBattle(ctx); if(!v) return null;
  return String(gameState.turn)+':'+String(v.uid);
}
defineScript('聖獣セルケト', {
  type:'monster', priority:1, forced:true, dsTiming:'after', targets:false,
  condition(ctx){ const k = u381SethKill(ctx); if(!k || ctx.card.u381Kill===k){ ctx.reason = '戦闘でモンスターを破壊した場合に発動します'; return false; } return true; },
  resolve(ctx){
    const k = u381SethKill(ctx); const me = locateCardAnyV4(ctx.card);
    if(!k || !me || me.zone!=='mz' || me.card.face!=='up') return;
    API.setCardFlag(me, 'u381Kill', k, '聖獣セルケト', {silent:true});
    v4RegisterStatModifier(locateCardAnyV4(ctx.card) || me, {atk:500}, {code:'聖獣セルケト', resetMask:RESET.LEAVE|RESET.FACE_DOWN});
  },
  afterResolve(){},
  selfDestroyWhenS03:(card, p)=> u381Temple(p) ? false : '聖獣セルケト：「王家の神殿」が存在しないため破壊',
  battleVictimBanishS03(){ return true; },
  passive:{ onDamageStep(ctx){ const k = u381SethKill(ctx); return !!k && ctx.card.u381Kill!==k; } }
});

/* ---- 地天の騎士ガイアドレイク ---- */
defineScript('地天の騎士ガイアドレイク', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  protectV21:{key:'u381.drake', effect:true, sourceKind:['m'], label:'地天の騎士ガイアドレイク'},
  continuous:{ scope:'self', from:['mz'], apply(){ return null; },
    immuneToTarget(card, self, effectInfo){
      if(card!==self || self.face!=='up') return false;
      /* S03-U457: u378Source() は発動準備中しか出所を返さず、解決時の対象選択で耐性が外れていた。filterTargetable の effectInfo を最優先で使う。 */
      const src = u378SrcOf(effectInfo);
      return !!src && targetEffectMatchesS03(src, {cardTypes:['m'], effectMonster:true});
    } }
});

/* ---- ナイトメアを駆る死霊 ---- */
function u381NmHit(ctx){
  const e = ctx.event;
  return !!e && e.direct && e.attackerUid!=null && ctx.card && e.attackerUid===ctx.card.uid && e.player===ctx.opponent && ctx.zone==='mz' && ctx.card.face==='up'
    && gameState.players[ctx.opponent].hand.length>0;
}
defineUnifiedCardV4('ナイトメアを駆る死霊', [{
  key:'discard', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDirectBattleDamage'], forced:true,
  condition(ctx){ return u381NmHit(ctx); },
  operation(ctx){
    const n = gameState.players[ctx.opponent].hand.length; if(!n) return;
    const i = (typeof duelRandomInt==='function') ? duelRandomInt(n) : 0;
    API.discard(ctx.opponent, i, 'ナイトメアを駆る死霊', {byEffect:true, byPlayer:ctx.player});
  },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, timing:['free'],
  passive:{ onDirectBattleDamage(ctx){ return u381NmHit(ctx); } },
  continuous:{ scope:'self', from:['mz'], apply(){ return null; }, grantsDirectAttack(card, self){ return card===self; } } });
/* S03-U137 (engine/1ZM): 「魔法・罠・効果モンスターの効果の対象になった時、このカードを破壊する」 */
declareTargetedSelfDestroyS03('ナイトメアを駆る死霊');
