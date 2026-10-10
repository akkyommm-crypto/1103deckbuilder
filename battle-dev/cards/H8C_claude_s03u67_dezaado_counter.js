/* S03-U67: 大神官デ・ザード「このカードが戦闘によってモンスターを破壊する度に以下の効果を得る。
   ●1回目:フィールド上に表側表示で存在するこのカードを対象とする魔法・罠カードが発動した時、その発動を無効に
   し破壊する。●2回目:このカードをリリースする事で、自分の手札・デッキから「不死王リッチー」1体を特殊召喚
   する。」

   以前は cards/40_auto_interpreter.js の AUTO_DECK_TABLE（op:"recruit", trig:"ignition"）で、
   カウンター条件もリリースコストも無い、メインフェイズにいつでも起動できるリクルートになっていた。ここで
   文字列リテラルの defineScript を置き、テーブル由来の登録を置き換える（40_auto_interpreter.js は既存の
   CARD_SCRIPTS を上書きしないので、置くだけでよい — S03-U33 と同じ作法）。

   ①②は「1回目」「2回目」の累積カウンター（deZaadoKillCount、戦闘でモンスターを破壊するたびに+1）で条件分け
   する。カウンターはこのカードに付いたフラグ（既存の setCardFlag パターン、v370FrogExtraTurn 等と同じ —
   新しい gameState キーは無い）で、フィールドを離れれば（新しいインスタンスになるので）自然にリセットされる。
   ①は engine/1T_targeting_negation_s03.js の既存 declareTargetingNegatorS03 をそのまま使い、カウンター
   条件だけ追加する（無敗将軍 フリードと同じ形。違いは「魔法カードの効果」ではなく「魔法・罠カードの発動」を
   無効にする点 — mode:'activation'、srcDb.k は 's' と 't' の両方）。②は起動効果として新規に書く。 */

function s03u66DeZaadoWonBattle(ctx){
  const b = ctx.battle || {};
  return (b.atkCard === ctx.card && b.destroyedDef) || (b.defCard === ctx.card && b.destroyedAtk);
}

defineScript('大神官デ・ザード', {
  /* timing を明示しないと、唯一の passive フック（onDamageStep）から 'damageStep' だけが推定され、②の
     手動発動（本来メインフェイズにいつでも起動できる）まで「ダメージステップ中」限定にされてしまう。
     dsTiming も明示する — 未指定は「戦闘破壊後（leave、墓地へ送られた後）」がデフォルトだが、この効果は
     破壊されたモンスターの行方を見ないので、ダメージ計算直後（'after'）で十分かつ正しい。 */
  type:'monster', priority:1, forced:true, timing:['damageStep','mainPhase'], dsTiming:'after',
  condition(ctx){
    if(ctx.eventName === 'onDamageStep'){
      if(!s03u66DeZaadoWonBattle(ctx)){ ctx.reason = '戦闘でモンスターを破壊した時に発動します'; return false; }
      return true;
    }
    if(ctx.zone !== 'mz'){ ctx.reason = 'フィールドで発動します'; return false; }
    const cnt = Number(ctx.card.deZaadoKillCount || 0);
    if(cnt < 2){ ctx.reason = '②は2回目の戦闘破壊が必要です'; return false; }
    const pool = handCandidates(ctx, x=>x.db.n === '不死王リッチー')
      .concat(API.pileCards(ctx.player, 'deck', x=>x.db.n === '不死王リッチー'));
    if(!pool.length){ ctx.reason = '手札・デッキに「不死王リッチー」がいません'; return false; }
    return true;
  },
  cost(ctx, done){
    if(ctx.eventName === 'onDamageStep'){ done(true); return; }
    const h = locateCardAnyV4(ctx.card);
    if(!h || h.zone !== 'mz'){ done(false); return; }
    API.sendToGrave(h, '大神官デ・ザード（②のコスト：リリース）');
    done(true);
  },
  selectTargets(ctx, done){ done([]); },
  resolve(ctx){
    if(ctx.eventName === 'onDamageStep'){
      const cur = Number(ctx.card.deZaadoKillCount || 0);
      API.setCardFlag({card:ctx.card}, 'deZaadoKillCount', cur + 1, '大神官デ・ザード', {silent:true});
      return;
    }
    /* S03-U66: 対象を取らない効果なので、解決時（現在の手札・デッキ）から選ぶ（S03-U58パターン）。 */
    const pool = handCandidates(ctx, x=>x.db.n === '不死王リッチー')
      .concat(API.pileCards(ctx.player, 'deck', x=>x.db.n === '不死王リッチー'));
    if(!pool.length) return;
    API.requestChoice({player:ctx.player, kind:'card', title:'大神官デ・ザード：特殊召喚する「不死王リッチー」',
      candidates:pool, min:1, max:1, cancelable:false,
      resume:{handler:'s03u66.dezaado-liche-summon', args:{player:ctx.player}},
      meta:{scriptName:'大神官デ・ザード'}});
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return ctx.zone === 'mz' && ctx.step === 'after' && s03u66DeZaadoWonBattle(ctx); } }
});
API.registerChoiceHandler('s03u66.dezaado-liche-summon', (answer, args) => {
  const picks = v49P1ChoiceCards(answer);
  const h = picks[0] && locateCardAnyV4(picks[0].card);
  if(!h || (h.zone !== 'hand' && h.zone !== 'deck')) return;
  API.specialSummon(args.player, h.zone, h.index, 'atk', '大神官デ・ザード');
});

declareTargetingNegatorS03('大神官デ・ザード', {
  applies({srcDb, negator}){
    if(!srcDb || (srcDb.k !== 's' && srcDb.k !== 't')) return null;   /* 魔法・罠カードの発動 */
    const c = negator && negator.card;
    if(!c || c.face !== 'up') return null;                            /* 表側表示で存在する限り */
    const cnt = Number(c.deZaadoKillCount || 0);
    if(cnt < 1) return null;                                          /* 1回目の戦闘破壊が必要 */
    return {mode:'activation', destroySource:true, reason:'大神官デ・ザード'};
  }
});

/* ---- 不死王リッチー（大神官デ・ザードの②でのみ特殊召喚できる下敷き）----
   このカードは通常召喚できない（cannotNormalSummon、既存の汎用フラグ）。フィールド上に表側表示で存在する限り
   自分を対象とする魔法・罠カードの発動を無効にし破壊する効果は、大神官デ・ザードの①と同じ形なので
   declareTargetingNegatorS03 をそのまま使う（カウンター条件は無い — 常時有効）。
   1ターンに1度、裏側守備表示にできる効果と、リバース時に墓地のアンデット族を特殊召喚する効果は未実装
   （data/script_status_overrides.json で PARTIAL のまま）。 */
defineScript('不死王リッチー', {
  type:'monster', priority:1, cannotNormalSummon:true,
  condition(ctx){ ctx.reason = '発動できる効果はまだ実装されていません（大神官デ・ザードの効果でのみ特殊召喚されます）'; return false; },
  afterResolve(){}
});
declareTargetingNegatorS03('不死王リッチー', {
  applies({srcDb, negator}){
    if(!srcDb || (srcDb.k !== 's' && srcDb.k !== 't')) return null;
    const c = negator && negator.card;
    if(!c || c.face !== 'up') return null;
    return {mode:'activation', destroySource:true, reason:'不死王リッチー'};
  }
});
