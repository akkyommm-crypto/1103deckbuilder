/* S03-U452: 墓掘りグール, システム・ダウン, 奇跡の発掘, トロイボム (stale ENGINE_GAP Spells / Traps, carddata texts).

   墓掘りグール    相手の墓地から1枚または2枚のモンスターカードを選択する。選択したカードをゲームから除外する。
   システム・ダウン 1000ライフポイントを払う。相手フィールド上と相手の墓地の機械族モンスターを全てゲームから除外する。
   奇跡の発掘      ①:除外されている自分のモンスターが5体以上存在する場合、その内3体を対象として発動できる。そのモンスターを墓地に戻す。
   トロイボム      （罠）自分フィールド上のモンスターのコントロールが相手のカードの効果によって相手に移った時に発動できる。そのモンスター1体を破壊し、破壊したモンスターの攻撃力分のダメージを相手ライフに与える。

   Notes
   - 墓掘りグール: the one or two monsters are chosen at the resolution (ChoiceRequest min 1 / max 2 over the Graveyard monsters of the opponent) - a deviation from 「選択する」 at the activation.
   - システム・ダウン: API.payCost 1000; face-up Machine monsters on the opponent's field and Machine monsters of the opponent's Graveyard are banished by uid (a face-down monster has no race); activatable while the LP are above 1000.
   - 奇跡の発掘: three targets chosen at the activation one after another (selectTargets) among my banished monsters (5+ needed); sent back to the Graveyard (API.sendToGrave on the banish handle).
   - トロイボム: a Set Trap answering onControlChange (event.fromPlayer = me, toPlayer = the opponent, the effect source - event.sourceUid - controlled by the opponent); the moved monster is destroyed and its ATK (read before the destruction) is dealt to the opponent only if it was destroyed (API.afterDestroyS03 continuation, like S03-U449 破壊輪). */

/* ---- 墓掘りグール ---- */
function u452FoeGrave(p){ return API.pileCards(p, 'grave', x=>x.db.k==='m'); }
API.registerChoiceHandler('s03u452.ghoul', (answer, args)=>{
  u441Picks(answer).slice(0, 2).map(x=>x.card.uid).forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='grave' && h.p===args.foe) API.banish(h, '墓掘りグール'); });
});
defineScript('墓掘りグール', {
  type:'spell', priority:1,
  condition(ctx){ if(!u452FoeGrave(ctx.opponent).length){ ctx.reason = '相手の墓地にモンスターがいません'; return false; } return true; },
  resolve(ctx){
    const pool = u452FoeGrave(ctx.opponent); if(!pool.length) return;
    pool.forEach(x=>ensureCardUid(gameState, x.card));
    API.requestChoice({kind:'card', title:'墓掘りグール：除外する相手の墓地のモンスター（1〜2枚）', candidates:pool, min:1, max:Math.min(2, pool.length), player:ctx.player, cancelable:false, resume:{handler:'s03u452.ghoul', args:{foe:ctx.opponent}}});
  },
  afterResolve(){}
});

/* ---- システム・ダウン ---- */
defineScript('システム・ダウン', {
  type:'spell', priority:1,
  condition(ctx){ if(API.me(ctx).lp<=1000){ ctx.reason = 'LPが足りません'; return false; } return true; },
  cost(ctx, done){ API.payCost(ctx.player, 1000, 'システム・ダウン'); done(true); },
  resolve(ctx){
    const isM = x=>x.db.k==='m' && x.db.ra==='機械';
    const list = API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up' && isM(x)}).concat(API.pileCards(ctx.opponent, 'grave', isM));
    list.map(x=>ensureCardUid(gameState, x.card)).forEach(u=>{ const h = findCardByUid(u); if(h) API.banish(h, 'システム・ダウン'); });
  },
  afterResolve(){}
});

/* ---- 奇跡の発掘 ---- */
function u452Banished(p){ return API.pileCards(p, 'banish', x=>x.db.k==='m'); }
defineScript('奇跡の発掘', {
  type:'spell', priority:1, targets:true,
  condition(ctx){ if(u452Banished(ctx.player).length<5){ ctx.reason = '除外されている自分のモンスターが5体以上必要です'; return false; } return true; },
  selectTargets(ctx, done){
    const picked = [];
    const next = n=>{
      const pool = u452Banished(ctx.player).filter(x=>!picked.some(t=>t.card===x.card));
      API.selectCard('奇跡の発掘：墓地に戻す除外モンスター（'+n+'体目）', pool, t=>{
        if(!t){ done([]); return; }
        picked.push(t);
        if(picked.length>=3) done(picked); else next(picked.length+1);
      });
    };
    next(1);
  },
  resolve(ctx){
    (ctx.selectedTargets || []).forEach(t=>{ const r = resolveTarget(t); if(r && r.zone==='banish' && r.p===ctx.player) API.sendToGrave(r, '奇跡の発掘'); });
  },
  afterResolve(){}
});

/* ---- トロイボム ---- */
function u452Troy(ctx){
  const e = ctx.event || {};
  if(ctx.eventName!=='onControlChange' || e.uid==null) return null;
  if(e.fromPlayer!==ctx.player || e.toPlayer!==ctx.opponent || e.sourceUid==null) return null;
  const src = findCardByUid(e.sourceUid); if(!src || src.p!==ctx.opponent) return null;
  const mv = findCardByUid(e.uid); if(!mv || mv.zone!=='mz' || mv.p!==ctx.opponent) return null;
  return mv;
}
registerDestroyAfterS03('s03u452.troy', a=>{
  if(!API.destroyedSinceS03(a.mark, [a.uid]).length) return;
  if(a.n>0) API.damageLP(a.foe, a.n, 'トロイボム');
});
defineScript('トロイボム', {
  type:'trap', priority:2,
  condition(ctx){ if(!u452Troy(ctx)){ ctx.reason = '自分のモンスターのコントロールが相手のカードの効果で移った時に発動します'; return false; } return true; },
  resolve(ctx){
    const mv = u452Troy(ctx); if(!mv) return;
    const n = Math.max(0, curATK(mv.card)), uid = ensureCardUid(gameState, mv.card), mark = API.destroyMarkS03();
    API.destroy(mv, 'トロイボム');
    API.afterDestroyS03('s03u452.troy', {mark, uid, n, foe:ctx.opponent});
  },
  afterResolve(){},
  passive:{ onControlChange(ctx){ return !!u452Troy(ctx); } }
});
