/* S03-U77: C-S03-26 DRAW_REPLACEMENT の最後の枠 — フィールド魔法（Sin World）。

   Sin World（2011-02-24、フィールド魔法）
   ①：自分ドローフェイズに通常のドローを行う代わりに発動できる。デッキから「Sin」カード3枚を相手に見せ、
      相手はその中からランダムに1枚選ぶ。そのカード1枚を自分の手札に加え、残りのカードはデッキに戻す。

   手札からフィールドゾーンへ置く通常の発動（①の効果とは無関係、フィールド魔法カードなら誰でも持つ挙動）は、
   fieldIgnition:true 宣言により cardActivationOnlyV32（engine/30_processor_chain_battle.js）が
   condition/resolve を一切呼ばずに素通りする — 既存の全フィールド魔法と共通の完全に汎用的な挙動なので、
   このスクリプトでは何も書く必要がない（大樹海／血の代償と同じ設計）。

   ①の効果は drawReplacementS03（engine/1V_draw_replacement_s03.js、S03-U77でフィールドゾーンにも拡張）
   経由でのみ合法になる。「相手はランダムに1枚選ぶ」は duelRandomInt（engine/06_replay_rng_v41.js、
   既存の v80DiscardRandom 等と同じ Replay-safe RNG）で表現する — 対象を取らない・墓地からの手札加えでは
   ないデッキサーチなので、選択自体は S03-U58 と同じ「解決時に requestChoice で選ばせる」方式（自分が見せる
   3枚を選ぶのは自分の選択、その中からのランダム抽選は RNG）。デッキに3枚未満しか無い場合はある分だけ見せる
   （2011年当時の一般的な「規定枚数を公開する」効果の裁定と同じ扱い — 手札交換ではなくデッキ内容の公開なので
   規定枚数に満たなくても発動でき、その分だけ見せる）。 */

API.registerChoiceHandler('s03u77.sin-world-reveal', (answer, args) => {
  const p = args.player;
  const cards = (answer && answer.cards) || [];
  const resolved = cards.map(t => resolveTarget(t)).filter(h => h && h.zone === 'deck');
  if (!resolved.length) return;
  API.log('Sin World：' + resolved.map(h => cardName(h.card)).join('、') + ' を相手に見せた');
  const idx = duelRandomInt(resolved.length, gameState);
  API.searchDeck(p, resolved[idx].index, 'Sin World');
  API.shuffle(p);
});

defineScript('Sin World', {
  type: 'spell', priority: 1, activateFrom: ['field'], fieldIgnition: true,
  condition(ctx) {
    if (!ctx.drawReplacementS03) { ctx.reason = '自分のドローフェイズに、通常のドローを行う代わりに発動します'; return false; }
    if (ctx.zone !== 'field' || !ctx.card || ctx.card.face !== 'up') { ctx.reason = 'フィールドゾーンに表側表示で存在する必要があります'; return false; }
    if (!API.pileCards(ctx.player, 'deck', x => String(x.db.n || '').indexOf('Sin') === 0).length) {
      ctx.reason = 'デッキに「Sin」カードがありません'; return false;
    }
    return true;
  },
  selectTargets(ctx, done) { done([]); },
  resolve(ctx) {
    const h = locateCardAnyV4(ctx.card);
    if (!h || h.zone !== 'field' || h.card.face !== 'up') return;   /* 11/01/10 円盤ムスキーと同じ趣旨 */
    const pool = API.pileCards(ctx.player, 'deck', x => String(x.db.n || '').indexOf('Sin') === 0);
    if (!pool.length) return;
    const n = Math.min(3, pool.length);
    API.requestChoice({
      player: ctx.player, kind: 'card', title: 'Sin World：相手に見せる「Sin」カード',
      candidates: pool, min: n, max: n, cancelable: false,
      resume: { handler: 's03u77.sin-world-reveal', args: { player: ctx.player } },
      meta: { scriptName: 'Sin World' }
    });
  },
  afterResolve() {}
});
declareDrawReplacementS03('Sin World', {});
