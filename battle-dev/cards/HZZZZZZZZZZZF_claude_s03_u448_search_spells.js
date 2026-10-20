/* S03-U448: サイコパス, リゾネーター・エンジン, レベルアップ!, 六武式三段衝, バブル・シャッフル (stale ENGINE_GAP Spells, carddata texts).

   サイコパス            ①：800LPを払い、除外されている自分のサイキック族モンスターを2体まで対象として発動できる。そのモンスターを手札に加える。
   リゾネーター・エンジン 自分の墓地に存在する「リゾネーター」と名のついたモンスター2体を選択して発動する。自分のデッキからレベル4モンスター1体を手札に加え、選択した墓地のモンスターをデッキに戻す。
   レベルアップ!         フィールド上に表側表示で存在する「LV」を持つモンスター1体を墓地へ送り発動する。そのカードに記されているモンスターを、召喚条件を無視して手札またはデッキから特殊召喚する。
   六武式三段衝          自分フィールド上に「六武衆」と名のついたモンスターが表側表示で3体以上存在する場合、以下の効果から1つを選択して発動する事ができる。●相手フィールド上に表側表示で存在するモンスターを全て破壊する。●相手フィールド上に表側表示で存在する魔法・罠カードを全て破壊する。●相手フィールド上にセットされた魔法・罠カードを全て破壊する。
   バブル・シャッフル    （速攻魔法）「E・HERO バブルマン」がフィールド上に表側表示で存在する時のみ発動する事ができる。自分フィールド上に表側攻撃表示で存在する「E・HERO バブルマン」1体と相手フィールド上に表側攻撃表示で存在するモンスター1体を守備表示にする。守備表示にした「E・HERO バブルマン」1体を生け贄に捧げ、「E・HERO」と名のつくモンスター1体を手札から特殊召喚する。

   Notes
   - サイコパス / リゾネーター・エンジン: the 1-2 / exactly 2 monsters are chosen at the resolution with a ChoiceRequest (not as activation targets); サイコパス pays 800 LP as the cost (API.payCost); リゾネーター・エンジン adds the chosen Level 4 Deck monster to the hand first (API.searchDeck), then returns the two Graveyard monsters to the Deck (FX_RETURN_DECK) and shuffles.
   - レベルアップ!: the monster written on the LV card is the first 「…LV数字」 name in its text other than its own; cost = the face-up LV monster of the field to the Graveyard; the target comes from the hand or the Deck (lvUpTargetsS03, S03-U251), Special Summoned ignoring its conditions (summonSrcS03 'レベルアップ!').
   - 六武式三段衝: a 'declare' ChoiceRequest for the mode (3 candidates); condition: 3+ face-up 「六武衆」 monsters of mine and a possible target for at least one mode.
   - バブル・シャッフル: Quick-Play Spell; my face-up Attack Position 「E・HERO バブルマン」 and one face-up Attack Position opponent monster (my choice) become Defense Position, the Bubbleman is sent to the Graveyard (Tribute), and a 「E・HERO」 monster of the hand is Special Summoned. */

function u448Pay(ctx, n, done, label){ API.payCost(ctx.player, n, label); done(true); }

/* ---- サイコパス ---- */
function u448BanPsychic(p){ return API.pileCards(p, 'banish', x=>x.db.k==='m' && x.db.ra==='サイキック'); }
API.registerChoiceHandler('s03u448.psycho', (answer, args)=>{
  u441Picks(answer).map(x=>x.card.uid).forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='banish' && h.p===args.player) API.returnToHand(h, 'サイコパス'); });
});
defineScript('サイコパス', {
  type:'spell', priority:1,
  condition(ctx){
    if(API.me(ctx).lp<=800){ ctx.reason = 'LPが足りません'; return false; }
    if(!u448BanPsychic(ctx.player).length){ ctx.reason = '除外されている自分のサイキック族モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){ u448Pay(ctx, 800, done, 'サイコパス'); },
  resolve(ctx){
    const pool = u448BanPsychic(ctx.player); if(!pool.length) return; pool.forEach(x=>ensureCardUid(gameState, x.card));
    API.requestChoice({kind:'card', title:'サイコパス：手札に加える除外されているサイキック族モンスター（2体まで）', candidates:pool, min:1, max:Math.min(2, pool.length), player:ctx.player, cancelable:false, resume:{handler:'s03u448.psycho', args:{player:ctx.player}}});
  },
  afterResolve(){}
});

/* ---- リゾネーター・エンジン ---- */
function u448Reso(p){ return API.pileCards(p, 'grave', x=>x.db.k==='m' && String(x.db.n||'').indexOf('リゾネーター')>=0); }
API.registerChoiceHandler('s03u448.engine', (answer, args)=>{
  const picks = u441Picks(answer).map(x=>x.card.uid); if(picks.length!==2) return;
  const lv4 = API.pileCards(args.player, 'deck', x=>x.db.k==='m' && Number(x.db.lv)===4);
  const finish = ()=>{
    picks.forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='grave' && h.p===args.player) act({type:'FX_RETURN_DECK', player:h.p, zone:'grave', index:h.index, toBottom:false, reason:'リゾネーター・エンジン'}); });
    API.shuffle(args.player);
  };
  if(!lv4.length){ finish(); return; }
  lv4.forEach(x=>ensureCardUid(gameState, x.card));
  API.requestChoice({kind:'card', title:'リゾネーター・エンジン：手札に加えるレベル4モンスター', candidates:lv4, min:1, max:1, player:args.player, cancelable:false, resume:{handler:'s03u448.engine-2', args:{player:args.player, picks}}});
});
API.registerChoiceHandler('s03u448.engine-2', (answer, args)=>{
  const p = u441Picks(answer)[0], h = p && findCardByUid(p.card.uid);
  if(h && h.zone==='deck' && h.p===args.player) API.searchDeck(args.player, h.index, 'リゾネーター・エンジン');
  args.picks.forEach(u=>{ const g = findCardByUid(u); if(g && g.zone==='grave' && g.p===args.player) act({type:'FX_RETURN_DECK', player:g.p, zone:'grave', index:g.index, toBottom:false, reason:'リゾネーター・エンジン'}); });
  API.shuffle(args.player);
});
defineScript('リゾネーター・エンジン', {
  type:'spell', priority:1,
  condition(ctx){
    if(u448Reso(ctx.player).length<2){ ctx.reason = '墓地に「リゾネーター」モンスターが2体必要です'; return false; }
    if(!API.pileCards(ctx.player, 'deck', x=>x.db.k==='m' && Number(x.db.lv)===4).length){ ctx.reason = 'デッキにレベル4モンスターがいません'; return false; }
    return true;
  },
  resolve(ctx){
    const pool = u448Reso(ctx.player); if(pool.length<2) return; pool.forEach(x=>ensureCardUid(gameState, x.card));
    API.requestChoice({kind:'card', title:'リゾネーター・エンジン：デッキに戻す墓地の「リゾネーター」を2体選ぶ', candidates:pool, min:2, max:2, player:ctx.player, cancelable:false, resume:{handler:'s03u448.engine', args:{player:ctx.player}}});
  },
  afterResolve(){}
});

/* ---- レベルアップ! ---- */
function u448NextLv(db){
  const m = String(db.e||'').match(/「([^」]*LV\d+)」/g) || [];
  for(const t of m){ const n = t.slice(1, -1); if(n!==db.n) return n; }
  return null;
}
function u448LvMonsters(p){ return API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m' && /LV\d+$/.test(String(x.db.n||'')) && !!u448NextLv(x.db) && lvUpTargetsS03(p, u448NextLv(x.db)).length>0}); }
defineScript('レベルアップ!', {
  type:'spell', priority:1,
  condition(ctx){ if(!u448LvMonsters(ctx.player).length){ ctx.reason = '特殊召喚できる「LV」モンスターの進化先が手札・デッキにありません'; return false; } return true; },
  cost(ctx, done){
    const pool = u448LvMonsters(ctx.player); if(!pool.length){ done(false); return; }
    API.selectCard('レベルアップ!：墓地へ送る「LV」モンスター', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='mz'){ done(false); return; }
      API.setCardFlag({card:ctx.card}, 'u448Next', u448NextLv(dbOf(r.card)), 'レベルアップ!', {silent:true});
      API.sendToGrave(r, 'レベルアップ!（コスト）'); done(true);
    });
  },
  resolve(ctx){
    const next = ctx.card && ctx.card.u448Next; if(!next) return;
    lvUpResolveS03(ctx, next, 'レベルアップ!');
  },
  afterResolve(){}
});

/* ---- 六武式三段衝 ---- */
function u448Six(p){ return API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m' && String(x.db.n||'').indexOf('六武衆')>=0}).length; }
function u448FoeMons(p){ return API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='up'}); }
function u448FoeUpSt(p){ return API.fieldCards({player:p, zone:'sz', filter:x=>x.card.face==='up'}).concat(API.fieldCards({player:p, zone:'field', filter:x=>x.card.face==='up'})); }
function u448FoeSetSt(p){ return API.fieldCards({player:p, zone:'sz', filter:x=>x.card.face==='down'}); }
API.registerChoiceHandler('s03u448.six', (answer, args)=>{
  const p = (answer && answer.cards || [])[0], mode = p && p.value;
  const pool = mode==='mons' ? u448FoeMons(args.foe) : mode==='up' ? u448FoeUpSt(args.foe) : mode==='set' ? u448FoeSetSt(args.foe) : [];
  pool.map(x=>ensureCardUid(gameState, x.card)).forEach(u=>{ const h = findCardByUid(u); if(h) API.destroy(h, '六武式三段衝'); });
});
defineScript('六武式三段衝', {
  type:'spell', priority:1,
  condition(ctx){
    if(u448Six(ctx.player)<3){ ctx.reason = '自分フィールドに表側表示の「六武衆」が3体以上必要です'; return false; }
    if(!u448FoeMons(ctx.opponent).length && !u448FoeUpSt(ctx.opponent).length && !u448FoeSetSt(ctx.opponent).length){ ctx.reason = '破壊できる相手のカードがありません'; return false; }
    return true;
  },
  resolve(ctx){
    const c = [];
    if(u448FoeMons(ctx.opponent).length) c.push({key:'mons', label:'相手の表側表示モンスターを全て破壊', value:'mons'});
    if(u448FoeUpSt(ctx.opponent).length) c.push({key:'up', label:'相手の表側表示の魔法・罠カードを全て破壊', value:'up'});
    if(u448FoeSetSt(ctx.opponent).length) c.push({key:'set', label:'相手のセットされた魔法・罠カードを全て破壊', value:'set'});
    if(!c.length) return;
    API.requestChoice({kind:'declare', title:'六武式三段衝：効果を1つ選択', candidates:c, min:1, max:1, player:ctx.player, cancelable:false, resume:{handler:'s03u448.six', args:{foe:ctx.opponent}}});
  },
  afterResolve(){}
});

/* ---- バブル・シャッフル ---- */
function u448Bubble(p){ return API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='up' && x.card.pos==='atk' && x.db.n==='E・HERO バブルマン'}); }
function u448Hero(p){ return API.pileCards(p, 'hand', x=>x.db.k==='m' && (String(x.db.n||'').indexOf('E・HERO')>=0 || String(x.db.n||'').indexOf('E－HERO')>=0) && canEffectSpecialSummonS03(x.card, 'hand', 'バブル・シャッフル')); }
function u448FoeAtk(p){ return API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='up' && x.card.pos==='atk'}); }
defineScript('バブル・シャッフル', {
  type:'quick-play', priority:2, targets:true,
  condition(ctx){
    if(!u448Bubble(ctx.player).length){ ctx.reason = '自分フィールドに表側攻撃表示の「E・HERO バブルマン」が必要です'; return false; }
    if(!u448FoeAtk(ctx.opponent).length){ ctx.reason = '相手フィールドに表側攻撃表示のモンスターがいません'; return false; }
    if(!u448Hero(ctx.player).length){ ctx.reason = '手札に「E・HERO」モンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('バブル・シャッフル：守備表示にする相手のモンスター', u448FoeAtk(ctx.opponent), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t), b = u448Bubble(ctx.player)[0];
    if(!r || r.zone!=='mz' || !b) return;
    const bu = ensureCardUid(gameState, b.card);
    API.changePosition(r, 'def', 'バブル・シャッフル');
    const bh = findCardByUid(bu); if(!bh || bh.zone!=='mz') return;
    API.changePosition(bh, 'def', 'バブル・シャッフル');
    const bh2 = findCardByUid(bu); if(bh2 && bh2.zone==='mz') API.sendToGrave(bh2, 'バブル・シャッフル（生け贄）');
    const pool = u448Hero(ctx.player); if(!pool.length || !hasMonsterZoneSpace(ctx.player)) return;
    API.selectCard('バブル・シャッフル：特殊召喚する「E・HERO」', pool, t2=>{
      const r2 = t2 && resolveTarget(t2); if(r2 && r2.zone==='hand' && r2.p===ctx.player && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'hand', r2.index, 'atk', 'バブル・シャッフル');
    });
  },
  afterResolve(){}
});
