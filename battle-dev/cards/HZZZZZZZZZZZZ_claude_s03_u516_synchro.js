/* =========================================================================
   S03-U516 — シンクロモンスターの未実装カード（カード実装）
   -------------------------------------------------------------------------
   《ジュラック・メテオ》（NOT_STARTED・星10 恐竜/炎 2800/2000・シンクロ）
     「ジュラック」と名のついたチューナー＋チューナー以外の恐竜族モンスター2体以上
     このカードがシンクロ召喚に成功した時、フィールド上のカードを全て破壊する。
     その後、自分の墓地からチューナー1体を選んで特殊召喚できる。
   《フルール・ド・シュヴァリエ》（NOT_STARTED・星8 戦士/風 2700/2300・シンクロ）
     「フルール・シンクロン」＋チューナー以外のモンスター1体以上
     相手が魔法・罠カードを発動した時に発動する事ができる。その発動を無効にし破壊する。
     この効果は自分のターンに1度だけ発動する事ができる。

   当時裁定（**回答日つき**）
     《ジュラック・メテオ》
       `WIKI-1D6EA9DA49CF`（**2009-10-08**）「効果分類は何ですか？」→「誘発効果になります。」
       `WIKI-9FD0A5460B4A`（**2009-10-08**）「破壊効果とチューナーを特殊召喚する効果はそれぞれ別の効果ですか？」
         →「一連の効果処理になり１つの効果になります。なお破壊を行った後に特殊召喚する処理になり同時ではありません。」
       `WIKI-DA5BD8451F54`（**2009-10-08**）「チューナーを特殊召喚するかどうか決めるタイミングはいつですか？」
         →「効果解決時の破壊する処理を行った後に特殊召喚する処理をするかどうか決めて、
            その時に特殊召喚する墓地のチューナーを選択します。」
       `WIKI-0B6B75AF1BCD`（**2009-10-06**）「墓地のチューナーを対象にとりますか？」→「対象をとりません。」
     《フルール・ド・シュヴァリエ》
       `WIKI-F702CAEB190D`（**2010-09-16**）「効果分類は何ですか？」→「誘発即時効果になります。」
       `WIKI-59AEA6994319`（**2010-09-16**）「《王宮の弾圧》など、既に表側表示になっている魔法・罠カードの
         効果の発動も無効にできますか？」→「いいえ、できません。」
       `WIKI-7F34FA9E9AB1`（**2010-09-16**）「カウンター罠も無効にすることができますか？」→「いいえ、できません。」
       `WIKI-2A95D67D1831`（**2010-09-16**）「《歯車街》など墓地で発動する効果も無効にできますか？」→「いいえ。」
       `WIKI-DBFFE8DBCE38` / `WIKI-4341E0D0F339`（**2010-09-16**）ダメージステップ中・ダメージ計算時にも発動できる。
       `WIKI-EE8628654118`（**2010-09-19**）「自分のターンに１度だけとは、１ターンに１度だけという意味ですか？」
         →「１ターンに１度の効果になります。」→ `countLimit:1` で表す（自分のターン限定ではない）。

   新しい共通処理は足していない。使うのは既存の仕組みだけ:
     シンクロ召喚成功の誘発（e3OnSelfSynchro）・破壊の後処理 API.afterDestroyS03（S03-U294）・
     カードの発動への応答 declareActivationResponseS03（S03-U18）と API.negateChainLink。
   ========================================================================= */

/* ---- ジュラック・メテオ ---- */
function u516AllFieldCardsS03(){
  const out = [];
  for(let p = 0; p < (gameState.players || []).length; p++){
    const P = gameState.players[p];
    (P.mz || []).forEach((c, i) => { if(c) out.push({p:p, zone:'mz', index:i, card:c}); });
    (P.sz || []).forEach((c, i) => { if(c) out.push({p:p, zone:'sz', index:i, card:c}); });
    if(P.field) out.push({p:p, zone:'field', index:0, card:P.field});
  }
  return out;
}
function u516GraveTunersS03(p){
  return API.pileCards(p, 'grave', x => x.db.k === 'm' && !x.db.ex && isTuner(x.db));
}
/* 破壊の処理が終わってから、特殊召喚するかどうかを決める（WIKI-DA5BD8451F54）。 */
registerDestroyAfterS03('s03u516.meteor-revive', args => {
  const p = args && args.p;
  if(p !== 0 && p !== 1) return;
  const pool = u516GraveTunersS03(p);
  if(!pool.length) return;
  if(!hasMonsterZoneSpace(p)) return;
  API.requestChoice({
    player:p, kind:'card', cancelable:true, min:1, max:1,
    title:'ジュラック・メテオ：特殊召喚する墓地のチューナー（任意）',
    note:'特殊召喚しない場合は閉じてください',
    candidates:pool,
    resume:{handler:'u516.meteor-summon', args:{p:p}}
  });
});
API.registerChoiceHandler('u516.meteor-summon', (answer, args) => {
  const picked = (answer && answer.cards && answer.cards[0]) || null;
  const r = picked && resolveTarget(picked);
  const p = args && args.p;
  if(r && r.zone === 'grave' && (p === 0 || p === 1) && hasMonsterZoneSpace(p))
    API.specialSummon(p, 'grave', r.index, 'atk', 'ジュラック・メテオ', r.p);
});
defineUnifiedCardV4('ジュラック・メテオ', [{
  key:'synchro-wipe-then-tuner', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1,
  events:['onSpecialSummon'], forced:true,
  condition(ctx){
    if(!e3OnSelfSynchro(ctx)){ ctx.reason = 'このカードのS召喚成功時に発動します'; return false; }
    return true;
  },
  operation(ctx){
    /* 「フィールド上のカードを全て破壊する」。このカード自身も含む。 */
    const targets = u516AllFieldCardsS03();
    const mark = API.destroyMarkS03();
    targets.slice().reverse().forEach(t => API.destroy(t, 'ジュラック・メテオ'));
    /* 破壊の身代わりの決定が終わってから、チューナーの特殊召喚を決める（一連の処理の後半）。 */
    API.afterDestroyS03('s03u516.meteor-revive', {mark:mark, p:ctx.player});
  },
  afterResolve(){}
}], {
  type:'monster', priority:1, forced:true,
  passive:{ onSpecialSummon(ctx){ return ctx.zone === 'mz' && e3OnSelfSynchro(ctx); } }
});

/* ---- フルール・ド・シュヴァリエ ---- */
/* 応答できるのは「相手が魔法・罠カードを発動した時」＝カードの発動（表側表示のカードの
   効果の発動や墓地で発動する効果は対象外）。カウンター罠も無効にできない。 */
function u516ChevalierLinkS03(ctx){
  const e = ctx.event || {};
  if(e.player !== ctx.opponent) return null;
  if(e.kind !== 'spell' && e.kind !== 'trap') return null;
  const l = (gameState.chain || [])[Number(e.chainLink) - 1];
  if(!l || l.cardActivationS03 !== true || l.player !== ctx.opponent) return null;
  /* カウンター罠は無効にできない（WIKI-7F34FA9E9AB1、回答日 2010-09-16） */
  const h = (l.uid != null) ? findCardByUid(l.uid) : null;
  const db = h ? dbOf(h.card) : null;
  if(db && db.k === 't' && db.sub === 'カウンター') return null;
  return l;
}
defineScript('フルール・ド・シュヴァリエ', {
  type:'monster', priority:1, quickEffect:true, countLimit:1,
  timing:['free','damageStep'],
  condition(ctx){
    if(ctx.zone !== 'mz' || !ctx.card || ctx.card.face !== 'up'){
      ctx.reason = '表側表示でフィールドに存在する必要があります'; return false; }
    if(!u516ChevalierLinkS03(ctx)){
      ctx.reason = '相手が魔法・罠カードを発動した時に発動します（カウンター罠は無効にできません）';
      return false; }
    return true;
  },
  resolve(ctx){
    API.negateChainLink(ctx.event, 'activation', 'フルール・ド・シュヴァリエ', true);
  },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){ return ctx.zone === 'mz' && !!u516ChevalierLinkS03(ctx); } }
});
declareActivationResponseS03(['フルール・ド・シュヴァリエ']);   /* engine/1P: 発動への応答 */
