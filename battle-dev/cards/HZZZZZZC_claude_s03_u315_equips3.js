/* S03-U315: three more Equip Spells on the S03-U312 helper (`u312Define`, carddata texts, classic wording).

   伝説の黒帯        自分フィールド上の「格闘ねずみ チュー助」「モンク・ファイター」「マスターモンク」のみ装備可能。装備モンスターが戦闘によって相手モンスターを破壊し墓地へ送った時、
                     破壊したモンスターの守備力分のダメージを相手ライフに与える。
   剣の煌き          「X－セイバー」と名のついたモンスターにのみ装備可能。装備モンスターが戦闘によって相手モンスターを破壊した場合、相手フィールド上に存在するカード1枚を破壊する事ができる。
                     また、自分フィールド上に存在するモンスター1体をリリースする事で、自分の墓地に存在するこのカードをデッキの一番上に戻す。
   ロケット・パイルダー 装備モンスターが攻撃する場合、装備モンスターは戦闘では破壊されない。装備モンスターが攻撃を行ったダメージステップ終了時、装備モンスターの攻撃を受けたモンスターの攻撃力は、
                     エンドフェイズ時まで装備モンスターの攻撃力分ダウンする。

   Notes
   - The equipped monster's battle kill is read from the Damage Step 'leave' record of the Equip Spell itself (the Equip Spell sits in the Spell & Trap Zone; the host is its equipTo).
   - 伝説の黒帯: forced; the damage is the printed DEF of the destroyed monster (「守備力」, read from the card data; the monster is in the Graveyard by then); only when it was sent to the Graveyard.
   - 剣の煌き: the destruction is optional and not targeted (the card is chosen on resolution among the opponent's field cards). The Graveyard effect is an ignition effect of the card in the
     Graveyard: cost, release a monster you control; the card returns to the top of the Deck (an Equip Spell in the Graveyard is a card of its owner's).
   - ロケット・パイルダー: the protection is for the equipped monster only while it is the ATTACKER (protectV21.battle with battleRole 'attacker', S03-U161); the ATK reduction is a turn-long modifier on the monster
     that was attacked (the target of the attack), equal to the equipped monster's ATK at that time; a direct attack or an attacked monster that has left the field does nothing. */

function equipKillS315(ctx){
  const b = ctx.battle || {};
  if(ctx.zone!=='sz' || ctx.card.face!=='up' || ctx.step!=='leave') return null;
  const h = equipHostS03(ctx.card); if(!h) return null;
  if(b.atkCard===h.card && b.destroyedDef) return b.defCard;
  if(b.defCard===h.card && b.destroyedAtk) return b.atkCard;
  return null;
}

/* ---- 伝説の黒帯 ---- */
u312Define('伝説の黒帯', {pred:x=>['格闘ねずみ チュー助','モンク・ファイター','マスターモンク'].indexOf(x.db.n)>=0, own:true,
  effects:[{
    key:'kill-damage', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onDamageStep'], forced:true,
    condition(ctx){ const k = equipKillS315(ctx); if(!k) return false; const h = locateCardAnyV4(k); return !!h && h.zone==='grave'; },
    operation(ctx){ const k = equipKillS315(ctx) || null; const n = k ? Number(dbOf(k).def)||0 : 0; if(n>0) API.damageLP(ctx.opponent, n, '伝説の黒帯'); },
    afterResolve(){}
  }], meta:{timing:['free'], passive:{onDamageStep(ctx){ return !!equipKillS315(ctx); }}}});   /* timing 'free': otherwise inferred from the onDamageStep passive → Damage Step only */

/* ---- 剣の煌き ---- */
u312Define('剣の煌き', {pred:x=>isCardInGroupV4(x.card, GROUP.XSABER),
  effects:[{
    key:'kill-destroy', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onDamageStep'],
    condition(ctx){ return !!equipKillS315(ctx) && API.fieldCards({player:ctx.opponent}).length>0; },
    operation(ctx){
      const c = API.fieldCards({player:ctx.opponent}); if(!c.length) return;
      API.selectCard('剣の煌き：破壊する相手フィールド上のカード', c, t=>{ const r = t && resolveTarget(t); if(r && r.p===ctx.opponent && (r.zone==='mz'||r.zone==='sz'||r.zone==='field')) API.destroy(r, '剣の煌き'); });
    },
    afterResolve(){}
  }, {
    key:'grave-return-top', type:EFFECT_TYPE.IGNITION, range:LOCATION.GRAVE, speed:1, events:['activate'],
    condition(ctx){
      if(ctx.zone!=='grave'){ ctx.reason = '墓地で発動します'; return false; }
      if(ctx.player!==gameState.activePlayer || !(gameState.phase==='main1' || gameState.phase==='main2')){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
      if(!API.fieldCards({player:ctx.player, zone:'mz', filter:x=>!x.card.cannotTribute}).length){ ctx.reason = 'リリースできるモンスターがいません'; return false; }
      return true;
    },
    cost(ctx, done){
      API.selectCard('剣の煌き：リリースするモンスター', API.fieldCards({player:ctx.player, zone:'mz', filter:x=>!x.card.cannotTribute}), t=>{
        const r = resolveTarget(t);
        if(!r || r.zone!=='mz'){ done(false); return; }
        API.sendToGrave(r, '剣の煌き（リリース）'); done(true);
      });
    },
    operation(ctx){ const h = locateCardAnyV4(ctx.card); if(h && h.zone==='grave') API.returnToDeck(h, false, '剣の煌き'); },
    afterResolve(){}
  }], meta:{activateFrom:['hand','sz','grave'], passive:{onDamageStep(ctx){ return !!equipKillS315(ctx); }}}});

/* ---- ロケット・パイルダー ---- */
function rocketAttackedS315(ctx){
  const b = ctx.battle || {};
  if(ctx.zone!=='sz' || ctx.card.face!=='up' || ctx.step!=='leave') return null;   /* the Damage Step's end as this engine delivers it to a card in the Spell & Trap Zone */
  const h = equipHostS03(ctx.card); if(!h || b.atkCard!==h.card || !b.defCard) return null;
  const t = locateCardAnyV4(b.defCard);
  return (t && t.zone==='mz' && t.card.face==='up') ? {host:h, target:t} : null;
}
u312Define('ロケット・パイルダー', {pred:()=>true,
  effects:[{
    key:'attack-atk-down', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onDamageStep'], forced:true,
    condition(ctx){ return !!rocketAttackedS315(ctx); },
    operation(ctx){
      const r = rocketAttackedS315(ctx); if(!r) return;
      const n = curATK(r.host.card); if(n>0) API.modAtk(r.target, -n, 0, 'endTurn', 'ロケット・パイルダー');
    },
    afterResolve(){}
  }], meta:{timing:['free'], passive:{onDamageStep(ctx){ return !!rocketAttackedS315(ctx); }}},
  continuous:{ protectV21:{ scope:'equippedMonster', label:'ロケット・パイルダー', effect:false,
    battle:(target, self, ctx)=>!!(ctx && ctx.battleRole==='attacker') } }});
