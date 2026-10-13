/* S03-U322: three 「アルカナフォース」 monsters with the coin toss (carddata texts; the coin is duelRandomInt(2) — replay-safe — stored as the zone-local card flag u322Coin 'heads' | 'tails',
   as the earlier Arcana cards of cycles 13 / 38 / 40).

   アルカナフォースIII－THE EMPRESS   召喚・反転召喚・特殊召喚に成功した時、コイントスを1回行い以下の効果を得る。●表:相手がモンスターの通常召喚に成功する度に手札から「アルカナフォース」と名のついたモンスター1体を自分フィールド上に
                                      特殊召喚する事ができる。●裏:相手がモンスターの通常召喚に成功する度に自分は手札のカード1枚を墓地へ送る。
   アルカナフォースXIV－TEMPERANCE    戦闘ダメージ計算時、このカードを手札から捨てて発動できる。その戦闘によって発生する自分への戦闘ダメージは0になる。召喚・反転召喚・特殊召喚に成功した時、コイントスを1回行う。●表:このカードがフィールド上に
                                      表側表示で存在する限り、自分が受ける戦闘ダメージは半分になる。●裏:…相手が受ける戦闘ダメージは半分になる。
   アルカナフォースEX－THE LIGHT RULER 通常召喚できない。自分フィールド上のモンスター3体を墓地へ送った場合のみ特殊召喚できる。特殊召喚に成功した時、コイントスを1回行う。●表:相手モンスターを戦闘によって破壊し墓地へ送った時、自分の
                                      墓地からカード1枚を選択して手札に加える事ができる。●裏:このカードを対象にする効果モンスターの効果・魔法・罠カードの発動を無効にし破壊する。この効果でカードの発動を無効にする度に、このカードの攻撃力は1000ポイントダウンする。

   Notes
   - 「召喚・反転召喚・特殊召喚に成功した時」: a Normal or Special Summon of the card, or its Flip Summon (not a Flip by battle). The coin is tossed once per such success (the later result replaces the earlier flag).
   - EMPRESS: the Special Summon from the hand is optional (the position is the player's, S03-U278); the tails discard is forced and the player chooses the card. Both react to the opponent's Normal Summon success (onOtherSummon).
   - TEMPERANCE: the hand effect is the lingering pattern of S03-U257 (the discarded card is a lingering source for the turn, the marked battle only, battle damage to me is 0); the coin result halves with floor rounding while it is face-up.
   - LIGHT RULER: hand procedure whose cost is sending three monsters of mine from the field to the Graveyard; tails reuses the targeting negator of S03-U28 (engine/1T) and lowers its ATK by 1000 per negation.
   - Left: アルカナフォースEX－THE DARK RULER, III's siblings VI－THE LOVERS (a per-card tribute value), XXI－THE WORLD (skipping the opponent's turn) and アルカナ ナイトジョーカー. */

function u322Coin(card){ return card && card.u322Coin; }
function u322Up(ctx){ return ctx.zone==='mz' && !!ctx.card && ctx.card.face==='up'; }
function u322Arcana(db){ return !!db && db.k==='m' && String(db.n||'').indexOf('アルカナフォース')>=0; }
function u322SelfSuccess(ctx){
  if(!u322Up(ctx) || !eventIsSelfS03(ctx)) return false;
  return ctx.eventName!=='onFlip' || !!(ctx.event && ctx.event.flipSummon);
}
function u322CoinEffect(label){
  return { key:'coin', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onNormalSummon','onFlip','onSpecialSummon'], forced:true,
    condition(ctx){ return u322SelfSuccess(ctx); },
    operation(ctx){
      const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz') return;
      const heads = duelRandomInt(2, gameState)===0;
      API.log(label+'：コイントスは'+(heads?'表':'裏'));
      API.setCardFlag(me, 'u322Coin', heads?'heads':'tails', label);
    },
    afterResolve(){} };
}
function u322CoinPassive(extra){
  return Object.assign({
    onNormalSummon(ctx){ return u322SelfSuccess(ctx); },
    onFlip(ctx){ return u322SelfSuccess(ctx); },
    onSpecialSummon(ctx){ return u322SelfSuccess(ctx); }
  }, extra||{});
}

/* ---- EMPRESS ---- */
function u322FoeNormal(ctx){
  const e = ctx.event || {};
  if(!u322Up(ctx) || !e.card || e.card===ctx.card) return false;
  const h = locateCardAnyV4(e.card);
  return !!h && h.zone==='mz' && h.p===ctx.opponent && !!(dbOf(h.card).k==='m');
}
function u322HandArcana(ctx){ return API.pileCards(ctx.player, 'hand', x=>u322Arcana(x.db)); }
defineUnifiedCardV4('アルカナフォースIII－THE EMPRESS', [u322CoinEffect('アルカナフォースIII－THE EMPRESS'), {
  key:'heads-summon', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onNormalSummon'],
  condition(ctx){ return u322Coin(ctx.card)==='heads' && u322FoeNormal(ctx) && u322HandArcana(ctx).length>0 && hasMonsterZoneSpace(ctx.player); },
  operation(ctx){
    const pool = u322HandArcana(ctx); if(!pool.length || !hasMonsterZoneSpace(ctx.player)) return;
    API.selectCard('アルカナフォースIII－THE EMPRESS：特殊召喚する「アルカナフォース」', pool, t=>{
      const r = t && resolveTarget(t);
      if(r && r.zone==='hand' && r.p===ctx.player && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'hand', r.index, 'atk', 'アルカナフォースIII－THE EMPRESS');
    });
  },
  afterResolve(){}
}, {
  key:'tails-discard', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onNormalSummon'], forced:true,
  condition(ctx){ return u322Coin(ctx.card)==='tails' && u322FoeNormal(ctx) && (API.me(ctx).hand||[]).length>0; },
  operation(ctx){
    const pool = API.pileCards(ctx.player, 'hand'); if(!pool.length) return;
    API.selectCard('アルカナフォースIII－THE EMPRESS：墓地へ送る手札', pool, t=>{
      const r = t && resolveTarget(t);
      if(r && r.zone==='hand' && r.p===ctx.player) API.sendHandToGrave(ctx.player, r.index, 'アルカナフォースIII－THE EMPRESS');
    });
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], onOtherSummon:true,
  passive:u322CoinPassive({ onNormalSummon(ctx){ return u322SelfSuccess(ctx) || (!!u322Coin(ctx.card) && u322FoeNormal(ctx)); } })});

/* ---- TEMPERANCE ---- */
function u322TempBattleUids(){ const b = gameState.battle; return b ? [b.atkUid, b.targetUid] : []; }
defineUnifiedCardV4('アルカナフォースXIV－TEMPERANCE', [u322CoinEffect('アルカナフォースXIV－TEMPERANCE'), {
  key:'discard-zero', type:EFFECT_TYPE.QUICK, range:LOCATION.HAND, speed:2, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='hand'){ ctx.reason = '手札から発動します'; return false; }
    const b = gameState.battle;
    if(!b || b.step!=='calc'){ ctx.reason = '戦闘ダメージ計算時に発動します'; return false; }
    return true;
  },
  cost(ctx, done){
    const i = (API.me(ctx).hand||[]).indexOf(ctx.card); if(i<0){ done(false); return; }
    API.discard(ctx.player, i, 'アルカナフォースXIV－TEMPERANCE（コスト）'); done(true);
  },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card);
    const b = gameState.battle;
    if(me && me.zone==='grave' && b){
      API.setCardFlag(me, 'u322TempTurn', gameState.turn, 'アルカナフォースXIV－TEMPERANCE');
      API.setCardFlag(me, 'u322TempAtk', b.atkUid!=null ? b.atkUid : null, 'アルカナフォースXIV－TEMPERANCE');
      API.setCardFlag(me, 'u322TempDef', b.targetUid!=null ? b.targetUid : null, 'アルカナフォースXIV－TEMPERANCE');
      const me2 = locateCardAnyV4(ctx.card); if(me2) API.lingerS03(ctx.player, me2, 'アルカナフォースXIV－TEMPERANCE');
    }
  },
  afterResolve(){}
}], {type:'monster', priority:2, quickEffect:true, activateFrom:['hand','mz'], damageStepOnly:true, dsTiming:'calc',
  passive:u322CoinPassive(),
  continuous:{ scope:'self', from:['mz','linger'], apply(){ return null; },
    battleDamage(info){
      const self = info && info.self; if(!self) return info.amount;
      const loc = locateCardAnyV4(self); if(!loc) return info.amount;
      if(loc.zone!=='mz'){
        /* the lingering use: this battle only, this turn */
        if(Number(self.u322TempTurn)!==gameState.turn || info.to!==loc.p) return info.amount;
        const b = gameState.battle;
        if(!b || b.atkUid!==self.u322TempAtk || b.targetUid!==self.u322TempDef) return info.amount;
        return 0;
      }
      if(self.face!=='up') return info.amount;
      if(self.u322Coin==='heads' && info.to===loc.p) return Math.floor(info.amount/2);
      if(self.u322Coin==='tails' && info.to!==loc.p) return Math.floor(info.amount/2);
      return info.amount;
    } }});

/* ---- LIGHT RULER ---- */
function u322RulerKill(ctx){
  const b = ctx.battle || {};
  if(b.atkCard===ctx.card && b.destroyedDef && b.defCard) return b.defCard;
  if(b.defCard===ctx.card && b.destroyedAtk && b.atkCard) return b.atkCard;
  return null;
}
defineUnifiedCardV4('アルカナフォースEX－THE LIGHT RULER', [u322CoinEffect('アルカナフォースEX－THE LIGHT RULER'), {
  key:'heads-recover', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'],
  condition(ctx){ return u322Up(ctx) && u322Coin(ctx.card)==='heads' && !!u322RulerKill(ctx) && API.pileCards(ctx.player,'grave').length>0; },
  operation(ctx){
    const pool = API.pileCards(ctx.player, 'grave'); if(!pool.length) return;
    API.selectCard('アルカナフォースEX－THE LIGHT RULER：手札に加える墓地のカード', pool, t=>{
      const r = t && resolveTarget(t);
      if(r && r.zone==='grave' && r.p===ctx.player) API.returnToHand(r, 'アルカナフォースEX－THE LIGHT RULER');
    });
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], dsTiming:'after',
  passive:u322CoinPassive({ onDamageStep(ctx){ return u322Up(ctx) && u322Coin(ctx.card)==='heads' && !!u322RulerKill(ctx) && API.pileCards(ctx.player,'grave').length>0; } }),
  summonProcedure:{
    from:['hand'], positions:['atk','def'],
    condition(ctx){ if(API.fieldCards({player:ctx.player, zone:'mz'}).length<3){ ctx.reason = '自分フィールド上にモンスターが3体必要です'; return false; } return true; },
    cost(ctx, done){
      const picked = [];
      const step = (n)=>{
        if(n>=3){
          picked.forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='mz') API.sendToGrave(h, 'アルカナフォースEX－THE LIGHT RULER（特殊召喚の手順）'); });
          done(true); return;
        }
        const pool = API.fieldCards({player:ctx.player, zone:'mz'}).filter(x=>picked.indexOf(x.card.uid)<0);
        if(!pool.length){ done(false); return; }
        API.selectCard('アルカナフォースEX－THE LIGHT RULER：墓地へ送るモンスター（'+(n+1)+'/3）', pool, t=>{
          const r = t && resolveTarget(t);
          if(!r || r.zone!=='mz'){ done(false); return; }
          picked.push(r.card.uid!=null ? r.card.uid : ensureCardUid(gameState, r.card));
          step(n+1);
        });
      };
      step(0);
    }
  }});
declareTargetingNegatorS03('アルカナフォースEX－THE LIGHT RULER', {
  applies({negator}){
    const c = negator && negator.card;
    if(!c || c.face!=='up' || c.u322Coin!=='tails') return null;
    return {mode:'activation', destroySource:true, reason:'アルカナフォースEX－THE LIGHT RULER'};
  },
  after({negator}){ if(negator && negator.zone==='mz') API.modAtk(negator, -1000, 0, 'permanent', 'アルカナフォースEX－THE LIGHT RULER'); }
});
