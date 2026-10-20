/* S03-U368: three Traps that read the chain top link or give a monster away (carddata texts).

   大火葬        相手が墓地のモンスターを対象にするカードを発動した時に発動できる。お互いの墓地のモンスターを全てゲームから除外する。
   アヌビスの裁き  手札を1枚捨てる。相手が発動した「フィールド上の魔法・罠カードを破壊する」効果を持つ魔法カードの発動と効果を無効にし破壊する。その後、相手フィールド上の表側表示モンスター1体を破壊し、そのモンスターの攻撃力分のダメージを相手に与える事ができる。
   ギブ&テイク    自分の墓地のモンスター1体と自分フィールドの表側表示モンスター1体を対象として発動できる。対象の墓地のモンスターを相手フィールドに守備表示で特殊召喚し、対象のフィールドのモンスターのレベルはターン終了時まで、その特殊召喚したモンスターのレベル分だけ上がる。

   Notes
   - 大火葬 / アヌビスの裁き read the chain top link as 王家の呪い (S03-U355): linkTargetsV19 (a monster in a Graveyard) and the card text (a Spell that destroys Spell / Trap cards of the field). アヌビスの裁き' second half is optional (a min 0 choice, as 森のざわめき).
   - ギブ&テイク: two targets chosen in order (as 融合回収, S03-U349); API.specialSummon(opponent, 'grave', index, 'def', reason, me) places my Graveyard monster on the opponent's field; API.modLevel raises the Level until the End of the turn. */

function u368Top(){ return gameState.chain && gameState.chain.length ? gameState.chain[gameState.chain.length-1] : null; }
function u368TopDb(top){ const i = top ? findCardIndex(top.name) : -1; return i>=0 ? CARD_DB[i] : null; }

/* ---- 大火葬 ---- */
function u368TargetsGraveMonster(top){
  if(typeof linkTargetsV19!=='function') return false;
  return linkTargetsV19(gameState, top).some(h=>h.zone==='grave' && dbOf(h.card).k==='m');
}
defineScript('大火葬', {
  type:'trap', priority:2, targets:false,
  condition(ctx){
    const top = u368Top();
    if(!top || top.player!==ctx.opponent || !u368TargetsGraveMonster(top)){ ctx.reason = '相手が墓地のモンスターを対象にするカードを発動した時に発動します'; return false; }
    if(u342Bad()){ ctx.reason = 'ネクロバレーが適用されているため除外できません'; return false; }
    return true;
  },
  resolve(ctx){
    [0,1].forEach(p=>{ API.pileCards(p, 'grave', x=>x.db.k==='m').slice().reverse().forEach(x=>{ const h = findCardByUid(ensureCardUid(gameState, x.card)); if(h && h.zone==='grave') API.banish(h, '大火葬'); }); });
  },
  afterResolve(){}
});

/* ---- アヌビスの裁き ---- */
function u368SpellDestroysST(top){
  const db = u368TopDb(top);
  return !!db && db.k==='s' && /魔法・罠カード[^。]*破壊/.test(String(db.e||''));
}
API.registerChoiceHandler('u368.anubis', (a, x)=>{
  if(!x || !a || a.cancelled) return;
  const pick = (a.cards || []).find(y=>y && !y.stale && y.uid!=null);
  const h = pick ? findCardByUid(pick.uid) : null;
  if(!h || h.zone!=='mz' || h.card.face!=='up') return;
  const atk = curATK(h.card);
  API.destroy(h, 'アヌビスの裁き');
  const gone = findCardByUid(pick.uid);
  if(!gone || gone.zone!=='mz') API.damageLP(x.opponent, atk, 'アヌビスの裁き');
});
defineScript('アヌビスの裁き', {
  type:'trap', priority:2, targets:false,
  condition(ctx){
    const top = u368Top();
    if(!API.me(ctx).hand.length){ ctx.reason = '手札がありません'; return false; }
    if(!top || top.player!==ctx.opponent || !u368SpellDestroysST(top)){ ctx.reason = '相手が「フィールド上の魔法・罠カードを破壊する」魔法カードを発動した時に発動します'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('アヌビスの裁き：捨てる手札', API.pileCards(ctx.player, 'hand', ()=>true), t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='hand'){ done(false); return; }
      API.discard(ctx.player, r.index, 'アヌビスの裁き（コスト）', {byEffect:false}); done(true);
    });
  },
  resolve(ctx){
    negatePreviousChainLinkV2('アヌビスの裁き', true);
    const pool = API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up'});
    if(!pool.length) return;
    pool.forEach(x=>ensureCardUid(gameState, x.card));
    API.requestChoice({player:ctx.player, kind:'card', title:'アヌビスの裁き：破壊する相手の表側表示モンスター（選ばなくてもよい）', candidates:pool, min:0, max:1, cancelable:false,
      resume:{handler:'u368.anubis', args:{player:ctx.player, opponent:ctx.opponent}}, meta:{scriptName:'アヌビスの裁き'}});
  },
  afterResolve(){}
});

/* ---- ギブ&テイク ---- */
function u368GiveGrave(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && canEffectSpecialSummonS03(x.card, 'grave', 'ギブ&テイク')); }
function u368GiveField(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up'}); }
defineScript('ギブ&テイク', {
  type:'trap', priority:2, targets:true, includesSpecialSummon:true,
  condition(ctx){
    if(!u368GiveGrave(ctx).length){ ctx.reason = '自分の墓地に特殊召喚できるモンスターがいません'; return false; }
    if(!u368GiveField(ctx).length){ ctx.reason = '自分フィールドに表側表示のモンスターがいません'; return false; }
    if(!hasMonsterZoneSpace(ctx.opponent)){ ctx.reason = '相手のモンスターゾーンが一杯です'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ギブ&テイク：相手フィールドに特殊召喚する自分の墓地のモンスター', u368GiveGrave(ctx), t1=>{
      API.selectCard('ギブ&テイク：レベルを上げる自分のモンスター', u368GiveField(ctx), t2=>done([t1, t2]));
    });
  },
  resolve(ctx){
    const g = ctx.selectedTargets && ctx.selectedTargets[0], f = ctx.selectedTargets && ctx.selectedTargets[1];
    const rg = g && resolveTarget(g), rf = f && resolveTarget(f);
    if(!rg || rg.zone!=='grave' || rg.p!==ctx.player || !hasMonsterZoneSpace(ctx.opponent)) return;
    const gu = ensureCardUid(gameState, rg.card), fu = rf ? ensureCardUid(gameState, rf.card) : null;
    const lv = Number(dbOf(rg.card).lv)||0;
    API.specialSummon(ctx.opponent, 'grave', rg.index, 'def', 'ギブ&テイク', ctx.player);
    const s = findCardByUid(gu); if(!s || s.zone!=='mz') return;
    const m = fu!=null ? findCardByUid(fu) : null;
    if(m && m.zone==='mz' && lv>0) API.modLevel(m, lv, 'endTurn', 'ギブ&テイク');
  },
  afterResolve(){}
});
