/* S03-U349: three Traps answering an opponent's event and a Spell recovering Fusion materials (carddata texts).

   ヘル・ポリマー   相手が融合モンスターを融合召喚した時に発動できる。自分フィールドのモンスター1体を生け贄に捧げる事で、その融合モンスター1体のコントロールを得る。
   痛恨の訴え       相手モンスターの直接攻撃によって自分が戦闘ダメージを受けた時に発動できる。相手フィールドの表側表示で守備力が一番高いモンスター1体のコントロールを次の自分のエンドフェイズ時まで得る。そのモンスターの効果は無効化され、攻撃宣言できない。
   破壊輪           （2011年当時の通常罠）フィールド上に表側表示で存在するモンスター1体を破壊し、お互いにその攻撃力分のダメージを受ける。（S03-U349 は2015年のエラッタ後の文面で実装していた → S03-U449 で修正）
   融合回収         ①:自分の墓地の「融合」1枚と融合召喚に使用した融合素材モンスター1体を対象として発動できる。そのカードを手札に加える。

   Notes
   - ヘル・ポリマー: the release is the cost; an optional response in the post-summon window to a Fusion Summon of the opponent (onOtherSummon + passive onSpecialSummon, the pattern of 奈落の落とし穴); permanent control (API.changeControl without 'until').
   - 痛恨の訴え: the control returns at MY next End Phase — a schedule (engine/16, 'endPhase', turns 1 from the opponent's turn) and not 'until endPhase' (that would end at the opponent's own End Phase); the effect negation (API.negateEffectUntil) is cleared at the return and the attack ban is the card flag cannotAttack (cleared with the move).
   - 融合回収: Fusion materials are the Graveyard cards carrying fusionMaterialS03 (written by the Fusion Summon of the engine). */

/* ---- ヘル・ポリマー ---- */
function u349FoeFusion(ctx){
  const ev = ctx.event || {};
  const cards = Array.isArray(ev.cards) ? ev.cards : (ev.card ? [ev.card] : []);
  return cards.map(card=>{ const h = locateCard(card); return (h && h.p===ctx.opponent && h.zone==='mz' && card.face==='up' && card.specialSummonKind==='fusion') ? {p:h.p, zone:h.zone, index:h.index, card, db:dbOf(card)} : null; }).filter(Boolean);
}
defineScript('ヘル・ポリマー', {
  onOtherSummon:true, type:'trap', priority:2, targets:false,
  condition(ctx){
    if(!u349FoeFusion(ctx).length){ ctx.reason = '相手が融合モンスターを融合召喚した時に発動します'; return false; }
    if(!API.fieldCards({player:ctx.player, zone:'mz'}).length){ ctx.reason = '生け贄に捧げるモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('ヘル・ポリマー：生け贄に捧げる自分のモンスター', API.fieldCards({player:ctx.player, zone:'mz'}), t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='mz'){ done(false); return; }
      API.sendToGrave(r, 'ヘル・ポリマー（生け贄）'); done(true);
    });
  },
  resolve(ctx){
    const t = u349FoeFusion(ctx)[0]; if(!t) return;
    const h = locateCardAnyV4(t.card); if(h && h.zone==='mz' && h.p===ctx.opponent) API.changeControl(h, ctx.player, 'ヘル・ポリマー');
  },
  afterResolve(){},
  passive:{ onSpecialSummon(ctx){ return ctx.card.face==='down' && ctx.zone==='sz' && u349FoeFusion(ctx).length>0; } }
});

/* ---- 痛恨の訴え ---- */
API.registerScheduleHandler('u349.regret-return', (args)=>{
  const h = args && args.uid!=null ? findCardByUid(args.uid) : null;
  if(!h || h.zone!=='mz') return;
  API.clearNegateEffect(h);
  API.setCardFlag(h, 'cannotAttack', false, '痛恨の訴え', {silent:true});
  const back = findCardByUid(args.uid);
  if(back && back.zone==='mz' && back.p===args.me) API.changeControl(back, args.opp, '痛恨の訴え');
});
function u349DirectHit(ctx){ const e = ctx.event || {}; return !!e.direct && e.player===ctx.player && Number(e.amount)>0 && e.attackerOwner===ctx.opponent; }
function u349Foes(ctx){
  const pool = API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up'});
  const m = pool.reduce((a,x)=>Math.max(a, curDEF(x.card)), -1);
  return pool.filter(x=>curDEF(x.card)===m);
}
defineScript('痛恨の訴え', {
  type:'trap', priority:2,
  condition(ctx){
    if(ctx.eventName!=='onDirectBattleDamage' || !u349DirectHit(ctx)){ ctx.reason = '相手モンスターの直接攻撃で戦闘ダメージを受けた時に発動します'; return false; }
    if(!u349Foes(ctx).length){ ctx.reason = '相手フィールドに表側表示のモンスターがいません'; return false; }
    if(gameState.players[ctx.player].mz.length>=ZONE_LIMITS.mz){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  resolve(ctx){
    const pool = u349Foes(ctx); if(!pool.length) return;
    const go = r=>{
      if(!r || r.zone!=='mz' || r.p!==ctx.opponent || gameState.players[ctx.player].mz.length>=ZONE_LIMITS.mz) return;
      const uid = ensureCardUid(gameState, r.card);
      API.changeControl(r, ctx.player, '痛恨の訴え');
      const h = findCardByUid(uid); if(!h || h.zone!=='mz' || h.p!==ctx.player) return;
      API.negateEffectUntil(h, 'permanent', '痛恨の訴え', ctx.card);
      API.setCardFlag(h, 'cannotAttack', true, '痛恨の訴え', {silent:true});
      API.schedule({at:'endPhase', turns:(gameState.activePlayer===ctx.player?0:1), player:ctx.player, handler:'u349.regret-return', args:{uid, me:ctx.player, opp:ctx.opponent}, note:'痛恨の訴え'});
    };
    if(pool.length===1) go(resolveTarget(pool[0]));
    else API.selectCard('痛恨の訴え：コントロールを得るモンスター（守備力が一番高い）', pool, t=>go(t && resolveTarget(t)));
  },
  afterResolve(){},
  passive:{ onDirectBattleDamage(ctx){ return ctx.card.face==='down' && ctx.zone==='sz' && u349DirectHit(ctx); } }
});

/* ---- 破壊輪 ----
   S03-U449 (ChatGPT audit): the 2011 text, not the 2015 errata. Pre-errata Normal Trap (yugioh-wiki 《破壊輪》, section 'エラッタ前のテキスト'):
   「フィールド上に表側表示で存在するモンスター1体を破壊し、お互いにその攻撃力分のダメージを受ける。」 Differences from the current text, all the 2011 behaviour:
   no once-per-turn-by-name limit; also in my own turn; my own monsters can be the target; no 'ATK <= opponent LP' condition; the damage is the ATK as changed on
   the field; the destruction and the damage to both players are simultaneous (both at 0 LP → a draw; damage reducing effects of one player do not change the other's).
   Targets (黒曜岩竜 ruling 08/03/19), no damage if the target was not destroyed (スタンピング・クラッシュ FAQ 2011-08-13: 《破壊輪》と同様、破壊に失敗した場合は発生しません).
   The damage is taken when the monster is no longer on the field (マテリアルドラゴン ruling 08/09/16): the ATK is read before the destruction. */
registerDestroyAfterS03('s03u449.ring', a=>{
  if(!API.destroyedSinceS03(a.mark, [a.uid]).length) return;
  const n = Number(a.n) || 0; if(n<=0) return;
  API.damageLP(a.p0, n, '破壊輪', {simulHoldS03:true}); API.damageLP(a.p1, n, '破壊輪', {simulFinalS03:true});
});
function u349Ring(){ return API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m'}); }
defineScript('破壊輪', {
  type:'trap', priority:2, targets:true,
  condition(ctx){ if(!u349Ring().length){ ctx.reason = 'フィールドに表側表示のモンスターがいません'; return false; } return true; },
  selectTargets(ctx, done){ API.selectCard('破壊輪：破壊するモンスター', u349Ring(), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(!r || r.zone!=='mz' || r.card.face!=='up') return;
    const n = Math.max(0, curATK(r.card)), uid = ensureCardUid(gameState, r.card), mark = API.destroyMarkS03();
    API.destroy(r, '破壊輪');
    API.afterDestroyS03('s03u449.ring', {mark, uid, n, p0:ctx.player, p1:ctx.opponent});
  },
  afterResolve(){}
});

/* ---- 融合回収 ---- */
function u349FusionCard(p){ return API.pileCards(p, 'grave', x=>x.db.n==='融合'); }
function u349FusionMat(p){ return API.pileCards(p, 'grave', x=>x.db.k==='m' && !!x.card.fusionMaterialS03); }
defineScript('融合回収', {
  type:'spell', priority:1, targets:true,
  condition(ctx){
    if(!u349FusionCard(ctx.player).length){ ctx.reason = '墓地に「融合」がありません'; return false; }
    if(!u349FusionMat(ctx.player).length){ ctx.reason = '墓地に融合召喚に使用した融合素材モンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('融合回収：手札に加える「融合」', u349FusionCard(ctx.player), t1=>{
      API.selectCard('融合回収：手札に加える融合素材モンスター', u349FusionMat(ctx.player), t2=>done([t1, t2]));
    });
  },
  resolve(ctx){ (ctx.selectedTargets||[]).forEach(t=>{ const r = t && resolveTarget(t); if(r && r.zone==='grave' && r.p===ctx.player) API.returnToHand(r, '融合回収'); }); },
  afterResolve(){}
});
