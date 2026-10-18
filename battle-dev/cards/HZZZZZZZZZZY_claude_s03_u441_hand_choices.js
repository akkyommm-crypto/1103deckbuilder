/* S03-U441: 手札断殺, リグラス・リーパー, 悪魔への貢物, フェイク・ヒーロー (stale ENGINE_GAP cards, carddata texts).

   手札断殺              （速攻魔法）①：お互いのプレイヤーは手札を2枚墓地へ送る。その後、それぞれデッキから2枚ドローする。
   リグラス・リーパー    ①：このカードがリバースした場合に発動する。お互いのプレイヤーは、それぞれ自分の手札を1枚選んで捨てる。②：このカードがモンスターとの戦闘で破壊された場合に発動する。そのモンスターの攻撃力・守備力を500ダウンする。
   悪魔への貢物          フィールド上の特殊召喚されたモンスター1体を選択して墓地へ送り、手札からレベル4以下の通常モンスター1体を特殊召喚する。
   フェイク・ヒーロー    手札から「E・HERO」と名のついたモンスター1体を特殊召喚する。この効果で特殊召喚したモンスターは攻撃できず、このターンのエンドフェイズ時に持ち主の手札に戻る。

   Notes
   - Opponent choices use the journaled ChoiceRequest (API.requestChoice with player = the choosing player, resume handler registered with API.registerChoiceHandler): 手札断殺 asks the controller for 2 hand cards, then the opponent for 2, then both draw 2; リグラス・リーパー asks each player for 1 hand card (controller first).
   - リグラス・リーパー ②: same as ニュート (u435NewtSlayer: the slayer read from gameState.lastBattle) - the monster loses 500 ATK / DEF (permanent).
   - 悪魔への貢物: target = a face-up monster with card.specialSummoned (either field), sent to the Graveyard (selectTargets); then a Level 4 or lower Normal Monster of the hand is Special Summoned.
   - フェイク・ヒーロー: the summoned monster gets card.cannotAttack and a scheduled End Phase handler returns it to the hand (the mark u441Fake = this turn keeps a monster that left and came back untouched). */

function u441Open(player, title, min, handler, args){
  const cands = API.pileCards(player, 'hand'); cands.forEach(x=>ensureCardUid(gameState, x.card));
  return API.requestChoice({kind:'card', title, candidates:cands, min, max:min, player, cancelable:false, resume:{handler, args}});
}
function u441Picks(answer){ return (answer && answer.cards || []).filter(x=>x && !x.stale && x.card); }
function u441DiscardPicks(answer, player, reason){
  u441Picks(answer).map(x=>x.card.uid).forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='hand' && h.p===player) API.discard(player, h.index, reason); });
}

/* ---- 手札断殺 ---- */
API.registerChoiceHandler('s03u441.dp-me', (answer, args)=>{
  u441DiscardPicks(answer, args.me, '手札断殺');
  if(!u441Open(args.foe, '手札断殺：墓地へ送る手札を2枚選ぶ', 2, 's03u441.dp-foe', args)){ API.draw(args.me, 2, '手札断殺'); API.draw(args.foe, 2, '手札断殺'); }
});
API.registerChoiceHandler('s03u441.dp-foe', (answer, args)=>{
  u441DiscardPicks(answer, args.foe, '手札断殺');
  API.draw(args.me, 2, '手札断殺'); API.draw(args.foe, 2, '手札断殺');
});
defineScript('手札断殺', {
  type:'quick-play', priority:2,
  condition(ctx){
    const mine = API.pileCards(ctx.player, 'hand').filter(x=>x.card!==ctx.card).length, foe = API.pileCards(ctx.opponent, 'hand').length;
    if(mine<2 || foe<2){ ctx.reason = 'お互いの手札が2枚以上必要です'; return false; }
    return true;
  },
  resolve(ctx){
    if(!u441Open(ctx.player, '手札断殺：墓地へ送る手札を2枚選ぶ', 2, 's03u441.dp-me', {me:ctx.player, foe:ctx.opponent})){ API.draw(ctx.player, 2, '手札断殺'); API.draw(ctx.opponent, 2, '手札断殺'); }
  },
  afterResolve(){}
});

/* ---- リグラス・リーパー ---- */
API.registerChoiceHandler('s03u441.reaper-me', (answer, args)=>{
  u441DiscardPicks(answer, args.me, 'リグラス・リーパー');
  u441Open(args.foe, 'リグラス・リーパー：捨てる手札を1枚選ぶ', 1, 's03u441.reaper-foe', args);
});
API.registerChoiceHandler('s03u441.reaper-foe', (answer, args)=>{ u441DiscardPicks(answer, args.foe, 'リグラス・リーパー'); });
function u441Flipped(ctx){ const e = ctx.event || {}; return ctx.zone==='mz' && (e.uid===ctx.card.uid || e.card===ctx.card); }
defineUnifiedCardV4('リグラス・リーパー', [{
  key:'flip-discard', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onFlip'], forced:true,
  condition(ctx){ return u441Flipped(ctx); },
  operation(ctx){
    const args = {me:ctx.player, foe:ctx.opponent};
    if(!u441Open(ctx.player, 'リグラス・リーパー：捨てる手札を1枚選ぶ', 1, 's03u441.reaper-me', args)) u441Open(ctx.opponent, 'リグラス・リーパー：捨てる手札を1枚選ぶ', 1, 's03u441.reaper-foe', args);
  },
  afterResolve(){}
},{
  key:'slayer-down', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave'], forced:true,
  condition(ctx){ return !!u435NewtSlayer(ctx); },
  operation(ctx){ const h = u435NewtSlayer(ctx); if(h) API.addBaseStats(h, -500, -500, 'permanent', 'リグラス・リーパー'); },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], forced:true, activateFrom:['mz','grave'],
  passive:{ onFlip(ctx){ return u441Flipped(ctx); }, onSendToGrave(ctx){ return !!u435NewtSlayer(ctx); } } });

/* ---- 悪魔への貢物 ---- */
function u441Tributes(){ return API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && x.card.specialSummoned===true}); }
function u441Normals(p){ return API.pileCards(p, 'hand', x=>x.db.k==='m' && Number(x.db.lv)<=4 && (x.db.st||[]).indexOf('通常')>=0 && canEffectSpecialSummonS03(x.card, 'hand', '悪魔への貢物')); }
defineScript('悪魔への貢物', {
  type:'spell', priority:1, targets:true,
  condition(ctx){
    if(!u441Tributes().length){ ctx.reason = 'フィールドに特殊召喚されたモンスターがいません'; return false; }
    if(!u441Normals(ctx.player).length){ ctx.reason = '手札にレベル4以下の通常モンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('悪魔への貢物：墓地へ送る特殊召喚されたモンスター', u441Tributes(), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(!r || r.zone!=='mz') return;
    API.sendToGrave(r, '悪魔への貢物');
    const pool = u441Normals(ctx.player); if(!pool.length || !hasMonsterZoneSpace(ctx.player)) return;
    API.selectCard('悪魔への貢物：特殊召喚するレベル4以下の通常モンスター', pool, t2=>{
      const r2 = t2 && resolveTarget(t2); if(r2 && r2.zone==='hand' && r2.p===ctx.player && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'hand', r2.index, 'atk', '悪魔への貢物');
    });
  },
  afterResolve(){}
});

/* ---- フェイク・ヒーロー ---- */
function u441Hero(p){ return API.pileCards(p, 'hand', x=>x.db.k==='m' && (String(x.db.n||'').indexOf('E・HERO')>=0 || String(x.db.n||'').indexOf('E－HERO')>=0) && canEffectSpecialSummonS03(x.card, 'hand', 'フェイク・ヒーロー')); }
API.registerScheduleHandler('s03u441.fake-hero-return', (args)=>{
  const h = findCardByUid(args.uid); if(h && h.zone==='mz' && Number(h.card.u441Fake)===Number(args.turn)) API.returnToHand(h, 'フェイク・ヒーロー');
});
defineScript('フェイク・ヒーロー', {
  type:'spell', priority:1,
  condition(ctx){
    if(!u441Hero(ctx.player).length){ ctx.reason = '手札に「E・HERO」モンスターがいません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  resolve(ctx){
    const pool = u441Hero(ctx.player); if(!pool.length) return;
    API.selectCard('フェイク・ヒーロー：特殊召喚する「E・HERO」', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='hand' || r.p!==ctx.player || !hasMonsterZoneSpace(ctx.player)) return;
      const c = r.card, uid = ensureCardUid(gameState, c);
      if(!API.specialSummon(ctx.player, 'hand', r.index, 'atk', 'フェイク・ヒーロー')) return;
      const h = findCardByUid(uid); if(!h || h.zone!=='mz') return;
      API.setCardFlag(h, 'cannotAttack', true, 'フェイク・ヒーロー', {silent:true});
      API.setCardFlag(h, 'u441Fake', gameState.turn, 'フェイク・ヒーロー', {silent:true});
      API.schedule({at:'endPhase', turns:0, player:ctx.player, handler:'s03u441.fake-hero-return', args:{uid, turn:gameState.turn}, note:'フェイク・ヒーロー'});
    });
  },
  afterResolve(){}
});
