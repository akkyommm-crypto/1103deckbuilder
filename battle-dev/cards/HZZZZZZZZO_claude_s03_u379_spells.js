/* S03-U379: four NOT_STARTED Spell / Trap cards (carddata texts).

   増殖              （速攻魔法）自分フィールド上に表側表示で存在する「クリボー」1体をリリースして発動できる。自分フィールド上に「クリボートークン」(悪魔族・闇・星1・攻300/守200)を可能な限り守備表示で特殊召喚する。このトークンはアドバンス召喚のためにはリリースできない。
   百機夜工          （速攻魔法）自分の墓地に存在する「D」と名のついたモンスターを全てゲームから除外する。自分フィールド上に表側表示で存在する機械族モンスター1体の攻撃力はこのターンのエンドフェイズ時まで、この効果で除外したモンスター1体につき200ポイントアップする。
   スターライト・ロード （罠）①:自分フィールドのカードを2枚以上破壊する魔法・罠・モンスターの効果が発動した時に発動できる。その効果を無効にし破壊する。その後、「スターダスト・ドラゴン」1体をエクストラデッキから特殊召喚できる。
   マジシャンズ・クロス （通常魔法）①:自分フィールドに攻撃表示の魔法使い族モンスターが2体以上存在する場合、その内の1体を対象として発動できる。そのモンスターの攻撃力はターン終了時まで3000になる。このカードの発動後、ターン終了時までそのモンスター以外の魔法使い族モンスターは攻撃できない。

   Notes
   - 増殖: the release is the cost (the Zone it frees counts); the tokens come from API.createToken (noAdvanceTributeS03, as アイスコフュントークン S03-U339).
   - 百機夜工: the 「D」 monsters are banished on resolution (all of them, ネクロバレー respected); the Machine monster is chosen then; +200 each as a stat modifier until the End Phase.
   - スターライト・ロード: u379MyLosses(link, me) counts MY cards the link would destroy: its targets on my side, or — with no target — the mass-destruction wording (全て) of the card text, narrowed by the text's own sides (相手… = the caster's opponent) and kinds (モンスター / 魔法・罠).
     At least 2 are needed. The Special Summon of スターダスト・ドラゴン from the Extra Deck is optional (a yes / no prompt).
   - マジシャンズ・クロス: the target's ATK is a stat modifier (setAtk 3000) until the End Phase; the used Spell registers as a lingering source with a turn stamp and the target's uid (S03-U257), whose continuous.cannotAttack stops the other Spellcasters of its controller (also one Summoned later). */

/* ---- 増殖 ---- */
function u379Kuribo(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && x.db.n==='クリボー'}); }
defineScript('増殖', {
  type:'spell', priority:2, targets:false, includesSpecialSummon:true,
  condition(ctx){ if(!u379Kuribo(ctx).length){ ctx.reason = '自分フィールドに表側表示の「クリボー」がいません'; return false; } return true; },
  cost(ctx, done){
    API.selectCard('増殖：リリースする「クリボー」', u379Kuribo(ctx), t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='mz'){ done(false); return; }
      API.sendToGrave(r, '増殖（リリース）'); done(true);
    });
  },
  resolve(ctx){
    const n = Math.max(0, ZONE_LIMITS.mz - gameState.players[ctx.player].mz.length); if(n<=0) return;
    API.createToken(ctx.player, {name:'クリボートークン', atk:300, def:200, lv:1, ra:'悪魔', at:'闇', pos:'def', noAdvanceTributeS03:true}, n);
  },
  afterResolve(){}
});

/* ---- 百機夜工 ---- */
function u379DGrave(p){ return API.pileCards(p, 'grave', x=>x.db.k==='m' && isSetCardV4(x.db, SETCODE.MORPHTRONIC)); }
function u379Machines(p){ return API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='up' && x.db.ra==='機械'}); }
defineScript('百機夜工', {
  type:'spell', priority:2, targets:false,
  condition(ctx){
    if(!u379DGrave(ctx.player).length){ ctx.reason = '墓地に「D」モンスターがいません'; return false; }
    if(!u379Machines(ctx.player).length){ ctx.reason = '自分フィールドに表側表示の機械族モンスターがいません'; return false; }
    if(u342Bad()){ ctx.reason = 'ネクロバレーが適用されているため除外できません'; return false; }
    return true;
  },
  resolve(ctx){
    const pool = u379DGrave(ctx.player); let n = 0;
    pool.slice().reverse().forEach(x=>{ const h = findCardByUid(ensureCardUid(gameState, x.card)); if(h && h.zone==='grave'){ API.banish(h, '百機夜工'); n++; } });
    if(!n) return;
    const ms = u379Machines(ctx.player); if(!ms.length) return;
    API.selectCard('百機夜工：攻撃力をアップする機械族モンスター', ms, t=>{
      const r = t && resolveTarget(t); if(r && r.zone==='mz' && r.card.face==='up') v4RegisterStatModifier(r, {atk:200*n}, {code:'百機夜工', resetMask:RESET.END|RESET.LEAVE|RESET.FACE_DOWN});
    });
  },
  afterResolve(){}
});

/* ---- スターライト・ロード ---- */
function u379Top(){ return gameState.chain && gameState.chain.length ? gameState.chain[gameState.chain.length-1] : null; }
function u379MyLosses(link, me){
  if(!link || typeof linkHasCategoryV19!=='function' || !linkHasCategoryV19(gameState, link, 'destroy')) return 0;
  const ts = typeof linkTargetsV19==='function' ? linkTargetsV19(gameState, link) : [];
  if(ts.length) return ts.filter(h=>h.p===me && (h.zone==='mz' || h.zone==='sz' || h.zone==='field')).length;
  const i = findCardIndex(link.name), e = i>=0 ? String((CARD_DB[i]||{}).e||'') : '';
  if(!/全て/.test(e)) return 0;
  const foeOnly = /相手(の)?(フィールド|モンスター|魔法)/.test(e) && !/お互い|自分及び相手|自分と相手/.test(e);
  if(foeOnly && link.player===me) return 0;
  const P = gameState.players[me];
  let n = 0;
  if(/モンスター/.test(e)) n += (P.mz||[]).length;
  if(/魔法・罠|魔法＆罠|魔法&罠/.test(e)) n += (P.sz||[]).length + (P.field ? 1 : 0);
  return n;
}
function u379StardustPool(p){ return API.pileCards(p, 'ex', x=>x.db.n==='スターダスト・ドラゴン' && canEffectSpecialSummonS03(x.card, 'ex', 'スターライト・ロード')); }
defineScript('スターライト・ロード', {
  type:'trap', priority:3, targets:false, includesSpecialSummon:true,
  condition(ctx){
    if(u379MyLosses(u379Top(), ctx.player)<2){ ctx.reason = '自分フィールドのカードを2枚以上破壊する効果が発動した時に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    negatePreviousChainLinkV2('スターライト・ロード', true);
    if(!u379StardustPool(ctx.player).length || !hasMonsterZoneSpace(ctx.player)) return;
    API.confirm('スターライト・ロード', 'スターダスト・ドラゴンをエクストラデッキから特殊召喚しますか？', ()=>{
      const pool = u379StardustPool(ctx.player); if(!pool.length || !hasMonsterZoneSpace(ctx.player)) return;
      API.specialSummon(ctx.player, 'ex', pool[0].index, 'atk', 'スターライト・ロード');
    }, ()=>{});
  },
  afterResolve(){}
});

/* ---- マジシャンズ・クロス ---- */
function u379Casters(p){ return API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='up' && x.card.pos==='atk' && x.db.ra==='魔法使い'}); }
defineScript('マジシャンズ・クロス', {
  type:'spell', priority:1, targets:true,
  condition(ctx){ if(u379Casters(ctx.player).length<2){ ctx.reason = '自分フィールドに攻撃表示の魔法使い族モンスターが2体以上必要です'; return false; } return true; },
  selectTargets(ctx, done){ API.selectCard('マジシャンズ・クロス：攻撃力を3000にする魔法使い族モンスター', u379Casters(ctx.player), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0] && resolveTarget(ctx.selectedTargets[0]);
    const me = locateCardAnyV4(ctx.card);
    if(me){ API.setCardFlag(me, 'u379CrossTurn', gameState.turn, 'マジシャンズ・クロス', {silent:true}); if(t) API.setCardFlag(locateCardAnyV4(ctx.card) || me, 'u379CrossUid', ensureCardUid(gameState, t.card), 'マジシャンズ・クロス', {silent:true}); const me2 = locateCardAnyV4(ctx.card); if(me2) API.lingerS03(ctx.player, me2, 'マジシャンズ・クロス'); }
    if(t && t.zone==='mz' && t.card.face==='up') v4RegisterStatModifier(t, {setAtk:3000}, {code:'マジシャンズ・クロス', resetMask:RESET.END|RESET.LEAVE|RESET.FACE_DOWN});
  },
  afterResolve(){},
  continuous:{ scope:'allMonsters', from:['linger'], apply(){ return null; },
    cannotAttack(card, self){
      if(!self || Number(self.u379CrossTurn)!==Number(gameState.turn) || !card || dbOf(card).ra!=='魔法使い' || card.uid===self.u379CrossUid) return false;
      const sh = locateCardAnyV4(self), ch = locateCard(card);
      return !!sh && !!ch && ch.p===sh.p;
    } }
});
