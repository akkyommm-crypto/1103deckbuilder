/* S03-U312: Equip Spells that only fit certain monsters (carddata texts), on the equip pattern of S03-U233 (equipActivateS03 / equippedS03 / equipHostS03 / pendantSentS03).

   漆黒の名馬        「六武衆」と名のついたモンスターにのみ装備可能。装備モンスターの攻撃力と守備力は200ポイントアップする。装備モンスターが破壊される場合、代わりにこのカードを破壊する。
   古代の機械戦車    「アンティーク・ギア」と名のついたモンスターにのみ装備可能。装備モンスターの攻撃力は600ポイントアップする。このカードが破壊され墓地へ送られた時、相手ライフに600ポイントダメージを与える。
   風魔手裏剣        「忍者」という名のついたモンスターのみ装備可能。装備モンスターは攻撃力が700ポイントアップする。このカードがフィールド上から墓地に送られた時、相手ライフに700ポイントダメージを与える。
   磁力の指輪        自分フィールド上に存在するモンスターにのみ装備可能。装備モンスターの攻撃力・守備力は500ポイントダウンする。相手はこのカードの装備モンスターしか攻撃する事ができない。
   レアゴールド・アーマー このカードを装備したモンスターをコントロールしている限り、相手は装備モンスター以外のモンスターには攻撃できない。
   ヴァイロン・コンポーネント 「ヴァイロン」と名のついたモンスターにのみ装備可能。装備モンスターが守備表示モンスターを攻撃した時、その守備力を攻撃力が超えていれば、その数値だけ相手ライフに戦闘ダメージを与える。
                     フィールド上に表側表示で存在するこのカードが墓地へ送られた場合、デッキから「ヴァイロン」と名のついた魔法カード1枚を手札に加える事ができる。
   ヴァイロン・フィラメント 「ヴァイロン」と名のついたモンスターにのみ装備可能。装備モンスターが攻撃する場合、相手はダメージステップ終了時まで魔法・罠カードを発動する事ができない。
                     フィールド上に表側表示で存在するこのカードが墓地へ送られた場合、自分のデッキから「ヴァイロン」と名のついた魔法カード1枚を手札に加える事ができる。

   Notes
   - 「名のついた」: P4 groups by passcode — GROUP.SIX_SAMURAI_NAMED, GROUP.ANCIENT_GEAR, GROUP.NINJA (new, P4-v9: names containing 忍者, 11 cards), GROUP.VYLON (new, 26 cards).
   - The host may be a monster of either player unless the text says 「自分フィールド上」 (磁力の指輪). レアゴールド・アーマー has no restriction: the protected side is the one whose
     monster is equipped (「このカードを装備したモンスターをコントロールしている限り」): the opponent of its controller cannot attack that controller's other monsters.
   - 漆黒の名馬: equipSubstituteS03 (engine/1ZZB; every destruction, mandatory). 古代の機械戦車: only a DESTRUCTION of the Equip Spell (graveInfo.byDestroy) damages; being sent to the
     Graveyard because its host left is not 「破壊され」. 風魔手裏剣: any route from the field to the Graveyard.
   - ヴァイロン・* search: the optional trigger of engine/1ZT (deckTriggerHappenedS03 'fieldToGrave', faceUp) as a unified-card effect, because the same card also has the equip activation.
     The pool is the Main Deck cards of GROUP.VYLON that are Spells (filter group + spellNameAny); one is added to the hand on the engine's shared choice handler.
   - ヴァイロン・フィラメント: declareAttackLockS03 for an Equip Spell (engine/1ZO equipAttackLockS03, S03-U312).
   - NOT in this unit: ヴァイロン・セグメント (「相手の罠・効果モンスターの効果の対象にならない」) — there is no 「cannot be targeted」 capability yet (9 cards need it); see CLAUDE_RESUME. */

function u312Hosts(ctx, pred, own){
  return API.fieldCards({zone:'mz', filter:x=>x.card && x.card.face==='up' && x.db.k==='m' && (!own || x.p===ctx.player) && pred(x)});
}
function u312EquipEffect(name, pred, own){
  return {
    key:'equip', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, targetRange:LOCATION.MZONE, targetSide:own?'self':'both', speed:1, events:['activate'],
    condition(ctx){ return u312Hosts(ctx, pred, own).length>0; },
    target(ctx, done){ API.selectCard(`${name}：装備するモンスター`, u312Hosts(ctx, pred, own), t=>done([t])); },
    operation(ctx){
      const s = locateCardAnyV4(ctx.card), t = ctx.selectedTargets && resolveTarget(ctx.selectedTargets[0]);
      if(s && t && t.zone==='mz' && t.card.face==='up' && (!own || t.p===ctx.player) && pred(t)) API.equipSpell(s, t, name);
    },
    afterResolve(){}
  };
}
function u312Define(name, o){
  const meta = Object.assign({type:'spell', priority:1, targets:true, continuous:{scope:o.scope||'allMonsters', from:['sz'], apply(card, self){ return (o.stat && equippedS03(card, self)) ? o.stat : null; }}}, o.meta||{});
  if(o.continuous) Object.assign(meta.continuous, o.continuous);
  return defineUnifiedCardV4(name, [u312EquipEffect(name, o.pred, !!o.own)].concat(o.effects||[]), meta);
}
/* the Equip Spell was sent to the Graveyard from the field this turn; destroyedOnly → by destruction (graveInfo.byDestroy) */
function u312SentEquip(ctx, destroyedOnly){
  const e = ctx.event || {}, g = ctx.card && ctx.card.graveInfo;
  return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && !!g && (g.from==='sz' || g.from==='field') && Number(g.turn)===Number(gameState.turn) && (!destroyedOnly || !!g.byDestroy);
}
function u312DamageEffect(name, n, destroyedOnly){
  return { key:'burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave'], forced:true,
    condition(ctx){ return u312SentEquip(ctx, destroyedOnly); },
    operation(ctx){ API.damageLP(ctx.opponent, n, name); },
    afterResolve(){} };
}
function u312GraveMeta(destroyedOnly, extra){
  return Object.assign({activateFrom:['hand','sz','grave'], passive:{ onSendToGrave(ctx){ return u312SentEquip(ctx, destroyedOnly); } }}, extra||{});
}

/* ---- 漆黒の名馬 ---- */
u312Define('漆黒の名馬', {pred:x=>isCardInGroupV4(x.card, GROUP.SIX_SAMURAI_NAMED), stat:{atk:200, def:200}, meta:{equipSubstituteS03:true}});

/* ---- 古代の機械戦車 ---- */
u312Define('古代の機械戦車', {pred:x=>isCardInGroupV4(x.card, GROUP.ANCIENT_GEAR), stat:{atk:600},
  effects:[u312DamageEffect('古代の機械戦車', 600, true)], meta:u312GraveMeta(true)});

/* ---- 風魔手裏剣 ---- */
u312Define('風魔手裏剣', {pred:x=>isCardInGroupV4(x.card, GROUP.NINJA), stat:{atk:700},
  effects:[u312DamageEffect('風魔手裏剣', 700, false)], meta:u312GraveMeta(false)});

/* ---- 磁力の指輪: only the equipped monster may be attacked ---- */
u312Define('磁力の指輪', {pred:()=>true, own:true, stat:{atk:-500, def:-500}, scope:'ownMonsters',
  continuous:{ cannotBeAttackTarget(target, self){ const h = equipHostS03(self); return !!h && target!==h.card; } }});

/* ---- レアゴールド・アーマー: the opponent of the equipped monster's controller may attack only that monster ---- */
u312Define('レアゴールド・アーマー', {pred:()=>true,
  continuous:{ cannotBeAttackTargetBothS03:true,
    cannotBeAttackTarget(target, self){
      const h = equipHostS03(self), t = h ? locateCard(target) : null;
      return !!h && !!t && t.p===h.p && target!==h.card;
    } }});

/* ---- ヴァイロン: the optional search trigger of the equip ---- */
const U312_VYLON_SEARCH = {when:'fieldToGrave', faceUp:true, action:'search', from:['deck'], optional:true, max:1, filter:{group:'VYLON', anyCard:true, spellNameAny:['ヴァイロン']}};
function u312VylonSearchEffect(name){
  DECK_TRIGGER_S03[name] = U312_VYLON_SEARCH;
  return { key:'vylon-search', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onLeaveField'],
    condition(ctx){ return deckTriggerHappenedS03(ctx, U312_VYLON_SEARCH); },
    operation(ctx){
      const pool = deckTriggerPoolS03(name, U312_VYLON_SEARCH, ctx.player);
      if(!pool.length){ API.shuffle(ctx.player); API.log(`${name}：デッキに「ヴァイロン」魔法カードが無い（デッキをシャッフル）`); return; }
      API.requestChoice({player:ctx.player, kind:'card', title:`${name}：手札に加える「ヴァイロン」魔法カード`, candidates:pool, min:1, max:1, cancelable:false,
        resume:{handler:'s03u156.deck-trigger', args:{player:ctx.player, name, action:'search', pos:'atk'}}, meta:{scriptName:name}});
    },
    afterResolve(){} };
}
function u312VylonMeta(){ return {activateFrom:['hand','sz','grave'], passive:{ onLeaveField(ctx){ return deckTriggerHappenedS03(ctx, U312_VYLON_SEARCH); } }}; }
const u312IsVylon = x=>isCardInGroupV4(x.card, GROUP.VYLON);

/* ---- ヴァイロン・コンポーネント: piercing ---- */
u312Define('ヴァイロン・コンポーネント', {pred:u312IsVylon, effects:[u312VylonSearchEffect('ヴァイロン・コンポーネント')], meta:u312VylonMeta(),
  continuous:{ piercingDamage(info){
    const self = info.self;
    if(!equippedS03(info.atkCard, self) || !info.defCard || info.defCard.pos!=='def') return 0;
    return Math.max(0, curATK(info.atkCard) - curDEF(info.defCard));
  } }});

/* ---- ヴァイロン・フィラメント: while the equipped monster attacks, the opponent cannot activate Spell / Trap cards until the end of the Damage Step ---- */
declareAttackLockS03('ヴァイロン・フィラメント');
u312Define('ヴァイロン・フィラメント', {pred:u312IsVylon, effects:[u312VylonSearchEffect('ヴァイロン・フィラメント')], meta:u312VylonMeta()});
