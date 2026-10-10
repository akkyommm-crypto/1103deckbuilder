/* S03-U65: C-S03-26 DRAW_REPLACEMENT の「墓地の魔法・罠カード」枠（engine/1V_draw_replacement_s03.js の
   S03-U65 拡張により、drawReplacementCandidatesS03 が P.grave も見るようになった）。

   コアキメイルの鋼核 … 墓地のこのカードを手札に加える（もう一つの「コアキメイルを手札から墓地へ送って加える」
     代替コストは別の発動ウィンドウの効果で本ユニットの対象外。PARTIAL のまま。data/script_status_overrides.json）。
   スピリット・バーナー … 墓地のこのカードを手札に加える（装備モンスターを守備表示にする効果と、装備モンスターが
     手札へ戻る事によりこのカードが墓地へ送られた時の600ダメージは対象外。PARTIAL のまま）。
   マジックブラスト … ①手札から発動：自分フィールドの魔法使い族の数×200ダメージ（対象を取らない）。
     ②墓地のこのカードを手札に加える（ドロー前に発動できる、という文言だが機能はC-S03-26と同じ「代わりに」なので
     同じ仕組みで扱う）。
   メテオ・プロミネンス … セットして発動：相手LP>3000の時、手札を2枚捨てて2000ダメージ。② 墓地のこのカードを
     手札に加える。

   スカル・フレイム … 自分のドローフェイズ時に通常のドローを行う代わりに、墓地の「バーニング・スカルヘッド」1体を
     手札に加える（表側表示のモンスターゾーンからの宣言 — 既存3枚と同じ形だが、候補がデッキではなく墓地の特定
     カード名という点が違うので新しいファクトリを使う。手札から「バーニング・スカルヘッド」を特殊召喚しバトル
     フェイズを行えなくする①の効果は対象外。PARTIAL のまま）。 */

API.registerChoiceHandler('s03u65.grave-to-hand', (answer, args) => {
  const picks = v49P1ChoiceCards(answer);
  const h = picks[0] && locateCardAnyV4(picks[0].card);
  if(!h || h.zone !== 'grave') return;
  API.returnToHand(h, args.reason);
});

/* ---- コアキメイルの鋼核 ---- */
defineScript('コアキメイルの鋼核', {
  type:'spell', priority:1, timing:['free'], activateFrom:['grave'],
  condition(ctx){
    if(!ctx.drawReplacementS03){ ctx.reason = '自分のドローフェイズに、通常のドローを行う代わりに発動します'; return false; }
    if(ctx.zone !== 'grave'){ ctx.reason = '墓地に存在する場合に発動します'; return false; }
    return true;
  },
  selectTargets(ctx, done){ done([]); },
  resolve(ctx){
    const h = locateCardAnyV4(ctx.card);
    if(!h || h.zone !== 'grave') return;
    API.returnToHand(h, 'コアキメイルの鋼核');
  },
  afterResolve(){}
});
declareDrawReplacementS03('コアキメイルの鋼核', {});

/* ---- スピリット・バーナー ---- */
defineScript('スピリット・バーナー', {
  type:'spell', priority:1, timing:['free'], activateFrom:['grave'],
  condition(ctx){
    if(!ctx.drawReplacementS03){ ctx.reason = '自分のドローフェイズに、通常のドローを行う代わりに発動します'; return false; }
    if(ctx.zone !== 'grave'){ ctx.reason = '墓地に存在する場合に発動します'; return false; }
    return true;
  },
  selectTargets(ctx, done){ done([]); },
  resolve(ctx){
    const h = locateCardAnyV4(ctx.card);
    if(!h || h.zone !== 'grave') return;
    API.returnToHand(h, 'スピリット・バーナー');
  },
  afterResolve(){}
});
declareDrawReplacementS03('スピリット・バーナー', {});

/* ---- マジックブラスト ---- */
defineScript('マジックブラスト', {
  /* S03-U65: duelActivateFromHand moves a Spell/Trap card hand->sz *before* calling prepareDuelActivation,
     so the real ctx.zone for the normal-activation branch is 'sz', not 'hand' (matching every other plain
     hand-activated Spell in this codebase, none of which gate on ctx.zone==='hand'). Only the GY branch
     needs an explicit zone check, same shape as メテオ・プロミネンス. */
  type:'spell', priority:1, activateFrom:['sz','grave'],
  condition(ctx){
    if(ctx.zone === 'grave'){
      if(!ctx.drawReplacementS03){ ctx.reason = '自分のドローフェイズに、通常のドローを行う代わりに発動します'; return false; }
      return true;
    }
    return true;
  },
  selectTargets(ctx, done){ done([]); },
  resolve(ctx){
    if(ctx.zone === 'grave'){
      const h = locateCardAnyV4(ctx.card);
      if(!h || h.zone !== 'grave') return;
      API.returnToHand(h, 'マジックブラスト');
      return;
    }
    const n = API.fieldCards({zone:'mz', player:ctx.player, filter:x=>x.card.face==='up' && x.db.ra==='魔法使い'}).length;
    API.damageLP(ctx.opponent, n*200, 'マジックブラスト');
  },
  afterResolve(){}
});
declareDrawReplacementS03('マジックブラスト', {});

/* ---- メテオ・プロミネンス ---- */
defineScript('メテオ・プロミネンス', {
  type:'trap', priority:2, activateFrom:['sz','grave'], timing:['chain','free'],
  condition(ctx){
    if(ctx.zone === 'grave'){
      if(!ctx.drawReplacementS03){ ctx.reason = '自分のドローフェイズに、通常のドローを行う代わりに発動します'; return false; }
      return true;
    }
    if(API.foe(ctx).lp <= 3000){ ctx.reason = '相手ライフが3000ポイントより多い場合に発動します'; return false; }
    if(API.me(ctx).hand.length < 2){ ctx.reason = '捨てる手札が2枚必要です'; return false; }
    return true;
  },
  cost(ctx, done){
    if(ctx.zone === 'grave'){ done(true); return; }
    const pool = API.pileCards(ctx.player, 'hand');
    if(pool.length < 2){ done(false); return; }
    API.selectCard('メテオ・プロミネンス（コスト）：捨てる手札 1/2', pool, t1 => {
      const r1 = resolveTarget(t1);
      if(!r1 || r1.zone !== 'hand'){ done(false); return; }
      API.discard(ctx.player, r1.index, 'メテオ・プロミネンス（コスト）');
      const remain = API.pileCards(ctx.player, 'hand');
      if(!remain.length){ done(false); return; }
      API.selectCard('メテオ・プロミネンス（コスト）：捨てる手札 2/2', remain, t2 => {
        const r2 = resolveTarget(t2);
        if(!r2 || r2.zone !== 'hand'){ done(false); return; }
        API.discard(ctx.player, r2.index, 'メテオ・プロミネンス（コスト）');
        done(true);
      });
    });
  },
  selectTargets(ctx, done){ done([]); },
  resolve(ctx){
    if(ctx.zone === 'grave'){
      const h = locateCardAnyV4(ctx.card);
      if(!h || h.zone !== 'grave') return;
      API.returnToHand(h, 'メテオ・プロミネンス');
      return;
    }
    API.damageLP(ctx.opponent, 2000, 'メテオ・プロミネンス');
  },
  afterResolve(){}
});
declareDrawReplacementS03('メテオ・プロミネンス', {});

/* ---- スカル・フレイム ---- */
defineScript('スカル・フレイム', {
  type:'monster', priority:1, timing:['free'],
  condition(ctx){
    if(!ctx.drawReplacementS03){ ctx.reason = '自分のドローフェイズに、通常のドローを行う代わりに発動します'; return false; }
    if(ctx.zone !== 'mz' || !ctx.card || ctx.card.face !== 'up'){ ctx.reason = '表側表示でフィールドに存在する必要があります'; return false; }
    if(!API.pileCards(ctx.player, 'grave', x=>x.db.n === 'バーニング・スカルヘッド').length){
      ctx.reason = '墓地に「バーニング・スカルヘッド」がいません'; return false;
    }
    return true;
  },
  selectTargets(ctx, done){ done([]); },
  resolve(ctx){
    const h = locateCardAnyV4(ctx.card);
    if(!h || h.zone !== 'mz' || h.card.face !== 'up') return;   /* 11/01/10 円盤ムスキーと同じ趣旨：表側表示で存在しなければ適用しない */
    const t = API.pileCards(ctx.player, 'grave', x=>x.db.n === 'バーニング・スカルヘッド');
    if(!t.length) return;
    API.requestChoice({player:ctx.player, kind:'card', title:'スカル・フレイム：手札に加える「バーニング・スカルヘッド」',
      candidates:t, min:1, max:1, cancelable:false,
      resume:{handler:'s03u65.grave-to-hand', args:{player:ctx.player, reason:'スカル・フレイム'}},
      meta:{scriptName:'スカル・フレイム'}});
  },
  afterResolve(){}
});
declareDrawReplacementS03('スカル・フレイム', {});
