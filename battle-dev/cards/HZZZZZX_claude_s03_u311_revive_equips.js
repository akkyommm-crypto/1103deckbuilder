/* S03-U311: the Equip Spells that Special Summon a monster and equip themselves to it (carddata texts; the pattern of 早すぎた埋葬, cards/B6).

   継承の印        自分の墓地に同名モンスターカードが3枚存在する時に発動できる。そのモンスター1体を選択して自分フィールド上に特殊召喚し、このカードを装備する。
                   このカードが破壊された時、装備モンスターを破壊する。
   戦線復活の代償  自分フィールド上の通常モンスター1体を墓地へ送り、自分または相手の墓地のモンスター1体を選択して発動できる。選択したモンスターを自分フィールド上に特殊召喚し、
                   このカードを装備する。このカードがフィールド上から離れた時、装備モンスターを破壊する。
   自律行動ユニット ①:1500LPを払い、相手の墓地のモンスター1体を対象としてこのカードを発動できる。そのモンスターを自分フィールドに攻撃表示で特殊召喚し、このカードを装備する。
                   このカードがフィールドから離れた時にそのモンスターは破壊される。
   契約の履行      800ライフポイントを払う。自分の墓地から儀式モンスター1体を選択して自分フィールド上に特殊召喚し、このカードを装備する。このカードが破壊された時、装備モンスターをゲームから除外する。
   再融合          ①:800LPを払い、自分の墓地の融合モンスター1体を対象としてこのカードを発動できる。そのモンスターを特殊召喚し、このカードを装備する。
                   このカードが破壊された時にそのモンスターは除外される。
   D・リペアユニット 手札から「D」と名のついたモンスター1体を墓地へ送り、自分の墓地に存在する「D」と名のついたモンスター1体を選択して発動する。選択したモンスターを特殊召喚し、このカードを装備する。
                   装備モンスターは表示形式を変更する事ができない。このカードがフィールド上に存在しなくなった時、装備モンスターを破壊する。

   Notes
   - Cost first, then the target (the engine's order): the cost card of 戦線復活の代償 (the Normal Monster sent from the field) and of D・リペアユニット (the 「D」 sent from the hand)
     is already in the Graveyard when the target is chosen, and may itself be chosen (the text lets it).
   - 「このカードが破壊された時」 (継承の印 / 契約の履行 / 再融合) = the link kinds destroyIfDestroyed / banishIfDestroyed (engine/18, banishIfDestroyed S03-U311): only a destruction of the Equip
     Spell triggers it. 「離れた時／存在しなくなった時」 (戦線復活の代償 / 自律行動ユニット / D・リペアユニット) = the link kind destroy (any departure).
   - The position of a Special Summon whose text gives none (all but 自律行動ユニット) is chosen by the player after the effect (engine/1ZZK, S03-U278); the equip is attached at once.
   - A Special Summon from the Graveyard of a monster that needs a proper summon (契約の履行 Ritual, 再融合 Fusion, 継承の印 …) is refused by API.specialSummon unless it was properly summoned before
     (engine/1ZK); the target lists only the monsters that may be summoned. LP costs follow the project convention (more LP than the cost, as 早すぎた埋葬).
   - 自律行動ユニット: the opponent's monster is summoned to the activating player's field (it stays the owner's card). */

function u311Open(p){ return hasMonsterZoneSpace(p); }
function u311Summonable(p, zoneOwner, filter, name){
  return API.pileCards(zoneOwner, 'grave', x=>x.db.k==='m' && (!filter || filter(x)) && canEffectSpecialSummonS03(x.card, 'grave', name));
}
/* revive `r` (a grave handle), equip the resolving Equip Spell to it, link them */
function u311ReviveEquip(ctx, name, r, pos, link){
  if(!r || r.zone!=='grave' || !u311Open(ctx.player)) return false;
  const uid = ensureCardUid(gameState, r.card);
  if(!API.specialSummon(ctx.player, 'grave', r.index, pos||'atk', name, r.p)) return false;
  const now = findCardByUid(uid), me = locateCardAnyV4(ctx.card);
  if(!now || now.zone!=='mz' || !me) return false;
  API.equipSpell(me, now, name);
  const eq = locateCardAnyV4(ctx.card);
  if(eq && link) API.linkOnLeave(now, eq, link, name);
  return true;
}
function u311Define(name, spec){
  const d = {
    type:'spell', priority:1, targets:true, timing:['mainPhase'],
    equipSpec:{ canEquip(){ return true; } },
    condition(ctx){
      if(!u311Open(ctx.player) && !spec.freesZone){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
      if(spec.lp && !(API.me(ctx).lp > spec.lp)){ ctx.reason = `${spec.lp}ライフポイントを払えません`; return false; }
      return spec.condition(ctx);
    },
    cost: spec.cost ? spec.cost : (spec.lp ? (ctx, done)=>{ API.payCost(ctx.player, spec.lp); done(true); } : undefined),
    selectTargets(ctx, done){ API.selectCard(`${name}：特殊召喚するモンスター`, spec.pool(ctx), t=>done([t])); },
    resolve(ctx){
      const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
      if(!r) return;
      u311ReviveEquip(ctx, name, r, 'atk', spec.link);
    },
    afterResolve(){}
  };
  if(spec.continuous) d.continuous = spec.continuous;
  if(!d.cost) delete d.cost;
  defineScript(name, d);
}

/* ---- 継承の印: 3 monsters of the same name in my Graveyard ---- */
function u311Same3(ctx){
  const g = API.pileCards(ctx.player, 'grave', x=>x.db.k==='m'), by = {};
  g.forEach(x=>{ (by[x.db.n] = by[x.db.n] || []).push(x); });
  return Object.keys(by).filter(n=>by[n].length>=3).reduce((a,n)=>a.concat(by[n].filter(x=>canEffectSpecialSummonS03(x.card, 'grave', '継承の印'))), []);
}
u311Define('継承の印', { condition(ctx){ if(!u311Same3(ctx).length){ ctx.reason = '自分の墓地に同名モンスターカードが3枚存在しません'; return false; } return true; },
  pool:u311Same3, link:'destroyIfDestroyed' });

/* ---- 戦線復活の代償: send a Normal Monster of mine from the field; target a monster in either Graveyard ---- */
function u311Normals(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && (x.db.st||[]).indexOf('通常')>=0}); }
function u311EitherGrave(ctx){ return u311Summonable(ctx.player, ctx.player, null, '戦線復活の代償').concat(u311Summonable(ctx.opponent, ctx.opponent, null, '戦線復活の代償')); }
u311Define('戦線復活の代償', { freesZone:true,
  condition(ctx){ if(!u311Normals(ctx).length){ ctx.reason = '自分フィールド上に通常モンスターがいません'; return false; } return true; },
  cost(ctx, done){
    API.selectCard('戦線復活の代償：墓地へ送る通常モンスター', u311Normals(ctx), t=>{
      const r = resolveTarget(t);
      if(!r || r.zone!=='mz'){ done(false); return; }
      API.sendToGrave(r, '戦線復活の代償（コスト）'); done(true);
    });
  },
  pool:u311EitherGrave, link:'destroy' });

/* ---- 自律行動ユニット: pay 1500, a monster in the opponent's Graveyard → my field in Attack Position ---- */
u311Define('自律行動ユニット', { lp:1500,
  condition(ctx){ if(!u311Summonable(ctx.opponent, ctx.opponent, null, '自律行動ユニット').length){ ctx.reason = '相手の墓地にモンスターがいません'; return false; } return true; },
  pool:ctx=>u311Summonable(ctx.opponent, ctx.opponent, null, '自律行動ユニット'), link:'destroy' });

/* ---- 契約の履行: pay 800, a Ritual Monster from my Graveyard; the Equip Spell destroyed → the monster is banished ---- */
const u311Ritual = ctx=>u311Summonable(ctx.player, ctx.player, x=>(x.db.st||[]).indexOf('儀式')>=0, '契約の履行');
u311Define('契約の履行', { lp:800,
  condition(ctx){ if(!u311Ritual(ctx).length){ ctx.reason = '自分の墓地に特殊召喚できる儀式モンスターがいません'; return false; } return true; },
  pool:u311Ritual, link:'banishIfDestroyed' });

/* ---- 再融合: pay 800, a Fusion Monster from my Graveyard; the Equip Spell destroyed → the monster is banished ---- */
const u311Fusion = ctx=>u311Summonable(ctx.player, ctx.player, x=>(x.db.st||[]).indexOf('融合')>=0, '再融合');
u311Define('再融合', { lp:800,
  condition(ctx){ if(!u311Fusion(ctx).length){ ctx.reason = '自分の墓地に特殊召喚できる融合モンスターがいません'; return false; } return true; },
  pool:u311Fusion, link:'banishIfDestroyed' });

/* ---- D・リペアユニット: send a 「D」 monster from the hand; target a 「D」 monster in my Graveyard; the equipped monster cannot change its position ---- */

function u311DHand(ctx){ return API.pileCards(ctx.player, 'hand', x=>/^D[・－\-]/.test(String(x.db.n||'')) && x.db.k==='m'); }
function u311DGrave(ctx){ return u311Summonable(ctx.player, ctx.player, x=>/^D[・－\-]/.test(String(x.db.n||'')), 'D・リペアユニット'); }
u311Define('D・リペアユニット', {
  condition(ctx){
    if(!u311DHand(ctx).length){ ctx.reason = '手札に「D」と名のついたモンスターがいません'; return false; }
    if(!(u311DGrave(ctx).length>0 || u311DHand(ctx).length>0)){ ctx.reason = '墓地に「D」と名のついたモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('D・リペアユニット：墓地へ送る手札の「D」', u311DHand(ctx), t=>{
      const r = resolveTarget(t);
      if(!r || r.zone!=='hand'){ done(false); return; }
      API.sendHandToGrave(ctx.player, r.index, 'D・リペアユニット（コスト）'); done(true);
    });
  },
  pool:u311DGrave, link:'destroy',
  continuous:{ scope:'allMonsters', from:['sz'], apply(){ return null; },
    cannotChangePosition(card, self){ return !!(self && self.equipTo && card && self.equipTo.uid===card.uid); } }
});
