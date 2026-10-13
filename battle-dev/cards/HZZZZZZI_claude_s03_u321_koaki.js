/* S03-U321: six more 「コアキメイル」 monsters on the upkeep of cycle 29 / 30 (`d9KoakiUpkeep`, `v57CoreInHand`; carddata texts).

   (upkeep, all)  このカードのコントローラーは自分のエンドフェイズ毎に、手札から「コアキメイルの鋼核」1枚を墓地へ送るか、手札の〈種族〉モンスター1体を相手に見せる。または、どちらも行わずにこのカードを破壊する。
   クルセイダー   (獣戦士) このカードが戦闘によって相手モンスターを破壊した場合、自分の墓地の「コアキメイル」と名のついたカード1枚を選択して手札に加える事ができる。
   ウルナイト     (獣戦士) 1ターンに1度、手札の「コアキメイルの鋼核」1枚を相手に見せる事で、デッキから「コアキメイル・ウルナイト」以外のレベル4以下の「コアキメイル」と名のついたモンスター1体を特殊召喚する。
   スピード       (機械族) このカードがフィールド上に表側表示で存在する限り、自分のドローフェイズ時にドローしたカードが「コアキメイルの鋼核」だった場合、そのカードを相手に見せる事で自分はカードをもう1枚ドローする事ができる。
   マキシマム     このカードは通常召喚できない。自分の手札から「コアキメイルの鋼核」1枚をゲームから除外した場合に特殊召喚する事ができる。エンドフェイズ毎に手札から「コアキメイルの鋼核」1枚か「コアキメイル」と名のついた
                  モンスター1体を墓地へ送る。または、どちらも行わずにこのカードを破壊する。1ターンに1度、自分のメインフェイズ時に相手フィールド上に存在するカード1枚を選択して破壊する事ができる。
   ルークロード   (戦士族) このカードは「コアキメイル」と名のついたモンスター1体をリリースしてアドバンス召喚できる。このカードが召喚に成功した時、自分の墓地の「コアキメイル」と名のついたカード1枚をゲームから除外する事で、
                  相手フィールド上のカードを2枚まで選択して破壊する。
   ヴァラファール 維持コスト＝手札の「コアキメイルの鋼核」1枚を墓地へ送る（見せる選択肢なし）。このカードは「コアキメイル」と名のついたモンスター1体をリリースしてアドバンス召喚する事ができる。このカードが守備表示モンスターを
                  攻撃した時、その守備力を攻撃力が超えていれば、その数値だけ相手ライフに戦闘ダメージを与える。このカードは罠カードの効果では破壊されない。

   Notes
   - The upkeep is the forced End Phase effect of its controller's own turn (like the earlier cards the choice is made by the engine: 鋼核 first, else a card of the race is shown, else destroy).
   - 「コアキメイル」と名のついた = a card whose name contains コアキメイル (monsters, the Spell 鋼核, Traps). クルセイダー' effect is optional and chooses the card at resolution.
   - ウルナイト: the card shown (not discarded) is the cost; the Special Summon position is the player's (S03-U278). スピード: normal draw of the Draw Phase (event normalDraw), optional.
   - マキシマム: the hand procedure (banish a 鋼核), its own upkeep, once per turn a targeted destruction in the controller's Main Phase.
   - ルークロード / ヴァラファール: the one-Tribute Advance Summon method (System v23 materialFilter); ルークロード' trigger asks again for the second target ("up to two").
   - Left (needs engine work): ウォーアームズ (equip from the Graveyard + a destruction substitute), グールズスレイブ (a substitute granted to other cards), the Spells コアの再練成 / コア・ブラスト / コアバスター. */

function u321Koaki(x){ return !!x && x.db && String(x.db.n||'').indexOf('コアキメイル')>=0; }
function u321Up(ctx){ return ctx.zone==='mz' && !!ctx.card && ctx.card.face==='up'; }
function u321MyEnd(ctx){ return u321Up(ctx) && ctx.player===gameState.activePlayer && gameState.phase==='end'; }
function u321Main(ctx){ return u321Up(ctx) && ctx.player===gameState.activePlayer && (gameState.phase==='main1' || gameState.phase==='main2'); }
function u321UpkeepEffect(show){
  return { key:'upkeep', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onEndPhase'], forced:true,
    condition(ctx){ return u321MyEnd(ctx); },
    operation(ctx){ d9KoakiUpkeep(ctx, show); },
    afterResolve(){} };
}
function u321UpkeepMeta(extra){
  return Object.assign({type:'monster', priority:1, timing:['free'], passive:{ onEndPhase(ctx){ return u321MyEnd(ctx); } }}, extra||{});
}
function u321Advance(label){
  return {includeStandard:true, methods:[{id:'u321adv', tributes:1, modes:['summon','set'], summonLabel:label+'：「コアキメイル」1体をリリースしてアドバンス召喚', setLabel:label+'：「コアキメイル」1体をリリースしてセット',
    materialFilter(candidate){ return !!(candidate && candidate.db && String(candidate.db.n||'').indexOf('コアキメイル')>=0); } }]};
}

/* ---- クルセイダー ---- */
function u321Killed(ctx){
  const b = ctx.battle || {};
  if(b.atkCard===ctx.card && b.destroyedDef && b.defCard) return b.defCard;
  if(b.defCard===ctx.card && b.destroyedAtk && b.atkCard) return b.atkCard;
  return null;
}
function u321GraveKoaki(p){ return API.pileCards(p, 'grave', x=>u321Koaki(x)); }
defineUnifiedCardV4('コアキメイル・クルセイダー', [u321UpkeepEffect(db=>db.k==='m' && db.ra==='獣戦士'), {
  key:'kill-recover', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'],
  condition(ctx){ return u321Up(ctx) && !!u321Killed(ctx) && u321GraveKoaki(ctx.player).length>0; },
  operation(ctx){
    const pool = u321GraveKoaki(ctx.player); if(!pool.length) return;
    API.selectCard('コアキメイル・クルセイダー：手札に加える「コアキメイル」', pool, t=>{
      const r = t && resolveTarget(t);
      if(r && r.zone==='grave' && r.p===ctx.player && String(dbOf(r.card).n||'').indexOf('コアキメイル')>=0) API.returnToHand(r, 'コアキメイル・クルセイダー');
    });
  },
  afterResolve(){}
}], u321UpkeepMeta({dsTiming:'after', passive:{ onEndPhase(ctx){ return u321MyEnd(ctx); }, onDamageStep(ctx){ return u321Up(ctx) && !!u321Killed(ctx) && u321GraveKoaki(ctx.player).length>0; } }}));

/* ---- ウルナイト ---- */
function u321DeckLow(p){ return API.pileCards(p, 'deck', x=>x.db.k==='m' && u321Koaki(x) && x.db.n!=='コアキメイル・ウルナイト' && (x.db.lv||99)<=4); }
defineUnifiedCardV4('コアキメイル・ウルナイト', [u321UpkeepEffect(db=>db.k==='m' && db.ra==='獣戦士'), {
  key:'show-summon', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(!u321Main(ctx)){ ctx.reason = '自分のメインフェイズにフィールドに表側表示で存在する場合に発動できます'; return false; }
    if(!v57CoreInHand(ctx.player).length){ ctx.reason = '手札に「コアキメイルの鋼核」がありません'; return false; }
    if(!u321DeckLow(ctx.player).length){ ctx.reason = 'デッキにレベル4以下の「コアキメイル」モンスターがいません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  cost(ctx, done){
    const cores = v57CoreInHand(ctx.player); if(!cores.length){ done(false); return; }
    API.reveal({cards:[cores[0]], audience:'both', label:'コアキメイル・ウルナイト', until:'resolution'}); done(true);
  },
  operation(ctx){
    const pool = u321DeckLow(ctx.player); if(!pool.length || !hasMonsterZoneSpace(ctx.player)) return;
    API.selectCard('コアキメイル・ウルナイト：特殊召喚する「コアキメイル」', pool, t=>{
      const r = t && resolveTarget(t);
      if(r && r.zone==='deck' && hasMonsterZoneSpace(ctx.player)){ API.specialSummon(ctx.player, 'deck', r.index, 'atk', 'コアキメイル・ウルナイト'); API.shuffle(ctx.player); }
    });
  },
  afterResolve(){}
}], u321UpkeepMeta({includesSpecialSummon:true, countLimit:{n:1, effects:['show-summon']}}));

/* ---- スピード ---- */
function u321SpeedDrawn(ctx){
  const e = ctx.event || {};
  if(!u321Up(ctx) || !e.normalDraw || e.player!==ctx.player || e.uid==null) return null;
  const h = findCardByUid(e.uid);
  return (h && h.zone==='hand' && h.p===ctx.player && h.card && dbOf(h.card).n==='コアキメイルの鋼核') ? h : null;
}
defineUnifiedCardV4('コアキメイル・スピード', [u321UpkeepEffect(db=>db.k==='m' && db.ra==='機械'), {
  key:'core-draw', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDrawCard'],
  condition(ctx){ return !!u321SpeedDrawn(ctx); },
  operation(ctx){
    const h = u321SpeedDrawn(ctx); if(!h) return;
    API.reveal({cards:[h], audience:'both', label:'コアキメイル・スピード', until:'resolution'});
    API.draw(ctx.player, 1, 'コアキメイル・スピード');
  },
  afterResolve(){}
}], u321UpkeepMeta({passive:{ onEndPhase(ctx){ return u321MyEnd(ctx); }, onDrawCard(ctx){ return !!u321SpeedDrawn(ctx); } }}));

/* ---- マキシマム ---- */
function u321MaxUpkeep(ctx){
  const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz') return;
  const cores = v57CoreInHand(ctx.player);
  const pool = cores.length ? cores : API.pileCards(ctx.player, 'hand', x=>x.db.k==='m' && u321Koaki(x));
  const r = pool.length ? resolveTarget(pool[0]) : null;
  if(r && r.zone==='hand'){ API.sendHandToGrave(ctx.player, r.index, 'コアキメイル・マキシマム（維持コスト）'); return; }
  const again = locateCardAnyV4(ctx.card);
  if(again && again.zone==='mz') API.destroy(again, 'コアキメイル・マキシマム（維持コスト）');
}
defineUnifiedCardV4('コアキメイル・マキシマム', [{
  key:'upkeep', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onEndPhase'], forced:true,
  condition(ctx){ return u321MyEnd(ctx); },
  operation(ctx){ u321MaxUpkeep(ctx); },
  afterResolve(){}
}, {
  key:'destroy', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'], targetRange:LOCATION.ONFIELD, targetSide:'opponent',
  condition(ctx){
    if(!u321Main(ctx)){ ctx.reason = '自分のメインフェイズにフィールドに表側表示で存在する場合に発動できます'; return false; }
    if(!API.fieldCards({player:ctx.opponent}).length){ ctx.reason = '相手フィールド上にカードがありません'; return false; }
    return true;
  },
  target(ctx, done){ API.selectCard('コアキメイル・マキシマム：破壊する相手フィールド上のカード', API.fieldCards({player:ctx.opponent}), t=>done([t])); },
  operation(ctx){ const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t); if(r && r.p===ctx.opponent && ['mz','sz','field'].indexOf(r.zone)>=0) API.destroy(r, 'コアキメイル・マキシマム'); },
  afterResolve(){}
}], u321UpkeepMeta({targets:true, countLimit:{n:1, effects:['destroy']},
  summonProcedure:{
    from:['hand'], positions:['atk','def'],
    condition(ctx){ if(!v57CoreInHand(ctx.player).length){ ctx.reason = '手札に「コアキメイルの鋼核」が必要です'; return false; } return true; },
    cost(ctx, done){
      const c = v57CoreInHand(ctx.player); const r = c.length ? resolveTarget(c[0]) : null;
      if(!r || r.zone!=='hand'){ done(false); return; }
      API.banish(r, 'コアキメイル・マキシマム（特殊召喚の手順）'); done(true);
    }
  }}));

/* ---- ルークロード ---- */
function u321FoeCards(ctx){ return API.fieldCards({player:ctx.opponent}); }
function u321Summoned(ctx){ return u321Up(ctx) && !!ctx.event && ctx.event.card===ctx.card; }
defineUnifiedCardV4('コアキメイル・ルークロード', [u321UpkeepEffect(db=>db.k==='m' && db.ra==='戦士'), {
  key:'summon-destroy', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onNormalSummon'], targetRange:LOCATION.ONFIELD, targetSide:'opponent',
  condition(ctx){ return u321Summoned(ctx) && u321GraveKoaki(ctx.player).length>0 && u321FoeCards(ctx).length>0; },
  cost(ctx, done){
    API.selectCard('コアキメイル・ルークロード：除外する墓地の「コアキメイル」', u321GraveKoaki(ctx.player), t=>{
      const r = t && resolveTarget(t);
      if(!r || r.zone!=='grave'){ done(false); return; }
      API.banish(r, 'コアキメイル・ルークロード（コスト）'); done(true);
    });
  },
  target(ctx, done){
    API.selectCard('コアキメイル・ルークロード：破壊する相手フィールド上のカード（1枚目）', u321FoeCards(ctx), t1=>{
      const rest = u321FoeCards(ctx).filter(x=>x.card!==(resolveTarget(t1)||{}).card);
      if(!rest.length){ done([t1]); return; }
      API.confirm('コアキメイル・ルークロード', 'もう1枚破壊するカードを選びますか？（2枚まで）',
        ()=>API.selectCard('コアキメイル・ルークロード：破壊する相手フィールド上のカード（2枚目）', rest, t2=>done([t1, t2])),
        ()=>done([t1]));
    });
  },
  operation(ctx){
    (ctx.selectedTargets || []).slice(0, 2).forEach(t=>{ const r = resolveTarget(t); if(r && r.p===ctx.opponent && ['mz','sz','field'].indexOf(r.zone)>=0) API.destroy(r, 'コアキメイル・ルークロード'); });
  },
  afterResolve(){}
}], u321UpkeepMeta({targets:true, normalSummonProcedure:u321Advance('コアキメイル・ルークロード'),
  passive:{ onEndPhase(ctx){ return u321MyEnd(ctx); }, onNormalSummon(ctx){ return u321Summoned(ctx) && u321GraveKoaki(ctx.player).length>0 && u321FoeCards(ctx).length>0; } }}));

/* ---- ヴァラファール ---- */
defineUnifiedCardV4('コアキメイル・ヴァラファール', [u321UpkeepEffect(()=>false)], u321UpkeepMeta({
  normalSummonProcedure:u321Advance('コアキメイル・ヴァラファール'),
  continuous:{ scope:'self', from:['mz'], apply(){ return null; },
    piercingDamage(info){
      const self = info.self;
      if(!self || self.face!=='up' || info.atkCard!==self || !info.defCard || info.defCard.pos!=='def') return 0;
      return Math.max(0, curATK(self) - curDEF(info.defCard));
    },
    protectV21:{ key:'コアキメイル・ヴァラファール', label:'コアキメイル・ヴァラファール', scope:'self', battle:false, effect:true, sourceKind:'t' } }}));
