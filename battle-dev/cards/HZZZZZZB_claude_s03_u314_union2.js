/* S03-U314: ユニオンモンスター, part 2 — six more classic Unions on `declareUnionS03` (cards/HZZZZZZ, S03-U313): ヴァイロン・テセラクト, ヴァイロン・ペンタクロ, バスター・ショットマン, デス・デンドル,
   氷岩魔獣, 灼岩魔獣 (carddata texts, classic wording).

   ヴァイロン・テセラクト  装備モンスターが戦闘によって相手モンスターを破壊した場合、自分の墓地からレベル4以下の「ヴァイロン」と名のついたモンスター1体を選択して特殊召喚できる。(装備モンスターが破壊される場合、代わりに…)
   ヴァイロン・ペンタクロ  装備モンスターが戦闘によって相手モンスターを破壊した場合、相手フィールド上のカード1枚を選択して破壊できる。(装備モンスターが破壊される場合、代わりに…)
   バスター・ショットマン  装備モンスターの攻撃力・守備力は500ポイントダウンする。装備モンスターが戦闘によって相手モンスターを破壊した場合、フィールド上に表側表示で存在する、破壊したモンスターと同じ種族のモンスターを全て破壊する。
                          (装備モンスターが破壊される場合、代わりに…)  host: any monster of mine
   デス・デンドル          「ブラッド・オーキス」に装備。装備モンスターが戦闘によってモンスターを破壊する度に「魔草トークン」(植物族・地・星1・攻/守800)を1体特殊召喚する。(装備モンスターが戦闘によって破壊される場合は、代わりに…)
   氷岩魔獣                「灼岩魔獣」に装備。装備モンスターが相手プレイヤーに戦闘ダメージを与えた場合、フィールド上で裏側表示の魔法または罠カード1枚を破壊する。(戦闘によって破壊される場合は、代わりに…)
   灼岩魔獣                「氷岩魔獣」に装備。装備モンスターが相手プレイヤーに戦闘ダメージを与えた場合、フィールド上で表側表示の魔法または罠カード1枚を破壊する。(戦闘によって破壊される場合は、代わりに…)

   Notes
   - 「できる」 (テセラクト, ペンタクロ) = optional triggers that target on activation; the others are forced. The substitute scope follows each card's own wording (テセラクト / ペンタクロ / バスター: every destruction; デス・デンドル / 氷岩魔獣 / 灼岩魔獣: by battle only).
   - バスター・ショットマン: the destroyed monster's Race is read from the destroyed card; every face-up monster of that Race on the field is destroyed — either player's, the equipped monster included.
   - The Special Summon position of a Token / monster the text does not fix is chosen by the player afterwards (engine/1ZZK); the Token is created face-up Attack Position.
   - Left out (recorded in the unit report): セコンド・ゴブリン / 守護霊アイリン (the host's once-per-turn position-change allowance against its own lock), メタル化寄生生物－ルナタイト (immunity to the opponent's Spells), and the six
     「①:」-wording Unions (W－ウィング・カタパルト …) whose 2011 text is not confirmed. */

/* ---- ヴァイロン・テセラクト ---- */
function unionTesseractPool(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && isCardInGroupV4(x.card, GROUP.VYLON) && (x.db.lv||99)<=4 && canEffectSpecialSummonS03(x.card, 'grave', 'ヴァイロン・テセラクト')); }
declareUnionS03('ヴァイロン・テセラクト', {host:x=>isCardInGroupV4(x.card, GROUP.VYLON), substitute:'any',
  passive:{onDamageStep:UNION_PASSIVE_KILL},
  effects:[{
    key:'kill-revive', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onDamageStep'], targetRange:LOCATION.GRAVE, targetSide:'self',
    condition(ctx){ return !!unionKillS03(ctx) && unionTesseractPool(ctx).length>0 && hasMonsterZoneSpace(ctx.player); },
    target(ctx, done){ API.selectCard('ヴァイロン・テセラクト：特殊召喚するレベル4以下の「ヴァイロン」', unionTesseractPool(ctx), t=>done([t])); },
    operation(ctx){
      const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
      if(!r || r.zone!=='grave' || r.p!==ctx.player || !hasMonsterZoneSpace(ctx.player)) return;
      API.specialSummon(ctx.player, 'grave', r.index, 'atk', 'ヴァイロン・テセラクト', r.p);
    },
    afterResolve(){}
  }], script:{targets:true, includesSpecialSummon:true}});

/* ---- ヴァイロン・ペンタクロ ---- */
declareUnionS03('ヴァイロン・ペンタクロ', {host:x=>isCardInGroupV4(x.card, GROUP.VYLON), substitute:'any',
  passive:{onDamageStep:UNION_PASSIVE_KILL},
  effects:[{
    key:'kill-destroy', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onDamageStep'], targetRange:LOCATION.ONFIELD, targetSide:'opponent',
    condition(ctx){ return !!unionKillS03(ctx) && API.fieldCards({player:ctx.opponent}).length>0; },
    target(ctx, done){ API.selectCard('ヴァイロン・ペンタクロ：破壊する相手フィールド上のカード', API.fieldCards({player:ctx.opponent}), t=>done([t])); },
    operation(ctx){
      const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
      if(r && r.p===ctx.opponent && (r.zone==='mz'||r.zone==='sz'||r.zone==='field')) API.destroy(r, 'ヴァイロン・ペンタクロ');
    },
    afterResolve(){}
  }], script:{targets:true}});

/* ---- バスター・ショットマン ---- */
declareUnionS03('バスター・ショットマン', {host:()=>true, atk:-500, def:-500, substitute:'any',
  passive:{onDamageStep:UNION_PASSIVE_KILL},
  effects:[{
    key:'kill-race-wipe', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onDamageStep'], forced:true,
    condition(ctx){ return !!unionKillS03(ctx); },
    operation(ctx){
      const killed = unionKillS03(ctx);
      const ra = killed ? dbOf(killed).ra : null;
      if(!ra) return;
      API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m' && x.db.ra===ra}).map(x=>x.card).forEach(c=>{
        const h = locateCardAnyV4(c); if(h && h.zone==='mz') API.destroy(h, 'バスター・ショットマン');
      });
    },
    afterResolve(){}
  }]});

/* ---- デス・デンドル ---- */
declareUnionS03('デス・デンドル', {host:x=>x.db.n==='ブラッド・オーキス', substitute:'battle',
  passive:{onDamageStep:UNION_PASSIVE_KILL},
  effects:[{
    key:'kill-token', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onDamageStep'], forced:true,
    condition(ctx){ return !!unionKillS03(ctx) && hasMonsterZoneSpace(ctx.player); },
    operation(ctx){ if(hasMonsterZoneSpace(ctx.player)) API.createToken(ctx.player, {name:'魔草トークン', atk:800, def:800, lv:1, ra:'植物', at:'地', pos:'atk'}, 1); },
    afterResolve(){}
  }], script:{includesSpecialSummon:true}});

/* ---- 氷岩魔獣 / 灼岩魔獣 (the effect is built by a factory; the two cards are declared with literal names so the coverage scan sees them) ---- */
function unionRockBeastEffect(name, faceDown){
  const pool = ctx=>API.fieldCards({}).filter(x=>x.card!==ctx.card && (x.zone==='sz' || x.zone==='field') && (faceDown ? x.card.face==='down' : x.card.face==='up'));
  return {
    key:'damage-destroy-st', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onBattleDamage'], forced:true,
    condition(ctx){ return unionDamageS03(ctx) && pool(ctx).length>0; },
    operation(ctx){
      const c = pool(ctx);
      if(!c.length) return;
      API.selectCard(`${name}：破壊する${faceDown?'裏側表示':'表側表示'}の魔法・罠カード`, c, t=>{ const r = t && resolveTarget(t); if(r && (r.zone==='sz'||r.zone==='field')) API.destroy(r, name); });
    },
    afterResolve(){}
  };
}
declareUnionS03('氷岩魔獣', {host:x=>x.db.n==='灼岩魔獣', substitute:'battle', passive:{onBattleDamage:UNION_PASSIVE_DAMAGE}, effects:[unionRockBeastEffect('氷岩魔獣', true)]});
declareUnionS03('灼岩魔獣', {host:x=>x.db.n==='氷岩魔獣', substitute:'battle', passive:{onBattleDamage:UNION_PASSIVE_DAMAGE}, effects:[unionRockBeastEffect('灼岩魔獣', false)]});
