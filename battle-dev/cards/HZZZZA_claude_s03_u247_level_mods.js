/* S03-U247: turn-duration Level changes (2011 texts) — ダーク・スパイダー, タイムパッセージ, コピー・プラント, フルエルフ (ENGINE_GAP:
   「Needs a first-class turn-duration Level modifier shared by summon legality, UI, save and replay」).
   The v16 Level layer already is that modifier: LEVEL_MOD_V16 (API.modLevel / API.setLevel, until 'endPhase'), journaled, zone-local, read by
   curLV — which Synchro material legality uses (engine/20 materialCandidates) — and expired by clearExpiredMods. So no engine change. */

/* ---- ダーク・スパイダー: 1ターンに1度、自分フィールド上に表側表示で存在する昆虫族モンスター1体のレベルをエンドフェイズ時まで2つ上げる事ができる。 ---- */
function darkSpiderTargetsS03(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && (typeof currentRaceV17==='function' ? currentRaceV17(x.card) : x.db.ra)==='昆虫'}); }
defineScript('ダーク・スパイダー', {
  type:'monster', priority:1, timing:['mainPhase'], countLimit:1, targets:true,
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(!darkSpiderTargetsS03(ctx).length){ ctx.reason = '自分フィールドに表側表示の昆虫族モンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('ダーク・スパイダー：レベルを2つ上げる昆虫族モンスター', darkSpiderTargetsS03(ctx), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null;
    if(h && h.zone==='mz' && h.card.face==='up') API.modLevel(h, 2, 'endPhase', 'ダーク・スパイダー');
  },
  afterResolve(){}
});

/* ---- タイムパッセージ: 自分フィールド上の「フォーチュンレディ」と名のついたモンスター1体を選択し、そのレベルをエンドフェイズ時まで3つ上げる。 ---- */
function timePassageTargetsS03(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && fortuneLadyDbS03(x.db)}); }
defineScript('タイムパッセージ', {
  type:'spell', priority:1, targets:true,
  condition(ctx){ if(!timePassageTargetsS03(ctx).length){ ctx.reason = '自分フィールドに表側表示の「フォーチュンレディ」がいません'; return false; } return true; },
  selectTargets(ctx, done){ API.selectCard('タイムパッセージ：レベルを3つ上げる「フォーチュンレディ」', timePassageTargetsS03(ctx), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null;
    if(h && h.zone==='mz' && h.card.face==='up') API.modLevel(h, 3, 'endPhase', 'タイムパッセージ');
  },
  afterResolve(){}
});

/* ---- コピー・プラント: 1ターンに1度、このカード以外のフィールド上の植物族モンスター1体を選択して発動できる。このカードのレベルはエンドフェイズ時まで、
   選択したモンスターと同じレベルになる。 (the target's Level at resolution) ---- */
function copyPlantTargetsS03(ctx){ return API.fieldCards({zone:'mz', filter:x=>x.card!==ctx.card && x.card.face==='up' && (typeof currentRaceV17==='function' ? currentRaceV17(x.card) : x.db.ra)==='植物'}); }
defineScript('コピー・プラント', {
  type:'monster', priority:1, timing:['mainPhase'], countLimit:1, targets:true,
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(!copyPlantTargetsS03(ctx).length){ ctx.reason = 'このカード以外のフィールドに植物族モンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('コピー・プラント：レベルを写す植物族モンスター', copyPlantTargetsS03(ctx), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null;
    const me = locateCardAnyV4(ctx.card);
    if(h && h.zone==='mz' && h.card.face==='up' && me && me.zone==='mz' && me.card.face==='up') API.setLevel(me, curLV(h.card), 'endPhase', 'コピー・プラント');
  },
  afterResolve(){}
});

/* ---- フルエルフ: 1ターンに1度、手札のモンスター1体を相手に見せて発動する事ができる。エンドフェイズ時まで、見せたモンスターのレベル分だけこのカードのレベルを上げる。
   (cost: the reveal, journaled REVEAL_ADD_V20 until the resolution; the revealed Level is recorded with the cost) ---- */
function fullElfPoolS03(ctx){ return API.pileCards(ctx.player, 'hand', x=>x.db.k==='m' && Number(x.db.lv)>0); }
defineScript('フルエルフ', {
  type:'monster', priority:1, timing:['mainPhase'], countLimit:1,
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(!fullElfPoolS03(ctx).length){ ctx.reason = '手札にモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('フルエルフ：相手に見せる手札のモンスター', fullElfPoolS03(ctx), t=>{
      const r = resolveTarget(t); if(!r || r.zone!=='hand'){ done(false); return; }
      API.reveal({player:ctx.player, audience:ctx.opponent, cards:[r], label:'フルエルフ', until:'resolution'});
      API.recordActivationCost(ctx, 'fullElfLvS03', [], [], curLV(r.card));
      done(true);
    });
  },
  resolve(ctx){
    const c = API.activationCosts(ctx, 'fullElfLvS03')[0], n = c ? Number(c.amount)||0 : 0;
    const me = locateCardAnyV4(ctx.card);
    if(n>0 && me && me.zone==='mz' && me.card.face==='up') API.modLevel(me, n, 'endPhase', 'フルエルフ');
  },
  afterResolve(){}
});
