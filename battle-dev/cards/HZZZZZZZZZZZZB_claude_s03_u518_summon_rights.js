/* S03-U518: 決戦の火蓋, デビル・フランケン, クルセイダー・オブ・エンディミオン（1103対象の未実装カード。carddata のテキスト）。

   決戦の火蓋（永続罠）
     自分の墓地のモンスターカード1枚をゲームから除外する事で、手札から通常モンスター1体を通常召喚する事ができる。
     この効果は自分ターンのメインフェイズ時にのみ発動する事ができる。
   デビル・フランケン（闇・機械・星2・攻700/守500）
     ①:5000LPを払って発動できる。エクストラデッキから融合モンスター1体を攻撃表示で特殊召喚する。
   クルセイダー・オブ・エンディミオン（光・魔法使い・星4・攻1900/守1200・デュアル）
     ①:このカードはフィールド・墓地に存在する限り、通常モンスターとして扱う。
     ②:フィールドの通常モンスター扱いのこのカードを通常召喚としてもう1度召喚できる。その場合このカードは
     効果モンスター扱いとなり以下の効果を得る。●1ターンに1度、フィールドの魔力カウンターを置く事ができるカード
     1枚を対象として発動できる。そのカードに魔力カウンターを1つ置き、このカードの攻撃力はターン終了時まで600アップする。

   当時の裁定（この実装の根拠。推測ではない）
   - 決戦の火蓋
     WIKI-55C383C128FC（07/12/10）「《血の代償》と同様に、効果の発動時にはチェーンブロックを作りますか？」→「はい、作ります」
       → 《血の代償》と同じ共通手順（s03BloodOfferTributeThenSummon、cards/00）を使う。
     WIKI-38EC2882E2E0（08/01/18）除外は**コスト**。→ cost() で払う。
     WIKI-2AB690FE02B1（07/12/10）1ターンに複数回発動できる。→ countLimit を付けない。
     WIKI-1330B937F075（回答日なし）上級モンスターの通常召喚にはリリースが必要。
       → 共通手順が normalSummonMethodsFor / tributeCandidatesForV23 でリリースを払う。
   - デビル・フランケン
     wiki-rulings.js と rulings-data.js の**どちらにも当時の裁定が無い**（カード名・本文の両方で 0 件）。
     したがってテキストだけを実装する: コストで 5000LP を払い、エクストラデッキの融合モンスター1体を
     攻撃表示で特殊召喚する。融合召喚ではない（テキストは「特殊召喚する」）ので kind は 'effect' にしてあり、
     正規の特殊召喚（properlySummonedS03）にはならない。「ちょうど 5000 残っている時に払えるか」は
     当時の根拠が無いので RULING_UNRESOLVED として触らず、ここでは 5000 より多い場合に発動できる形にしている
     （engine の既存の LP コストのうち厳しい側＝《簡易融合》S03-U53 と同じ読み方）。
   - クルセイダー・オブ・エンディミオン
     WIKI-F0C82F8C96D2（10/12/17）魔力カウンターを乗せるのは**対象を取る起動効果**。→ IGNITION + 対象の宣言。
     WIKI-7924775F83D7（10/12/17）「数値アップ後に《スキルドレイン》を発動した場合、上昇数値は失われますか？」→「失われます」
       → 攻撃力の 600 アップは**このカード自身の継続効果**として持つ（continuous scope:'self'）。
         continuousSources() は効果が無効な出所を除くので、後からスキルドレインを出せばその瞬間に戻る。
         解決時に一度だけ加算する mods では、この裁定を再現できない（後から無効にしても残ってしまう）。
     デュアルの「もう1度召喚」と効果の獲得は S03-U119 の共通機構（defineGeminiS03 / geminiActiveS03）。 */

/* ---- 決戦の火蓋 ---- */
function u518FuseGraveMonstersS03(p){ return API.pileCards(p, 'grave', x=>x.db.k==='m'); }
function u518FuseHandNormalsS03(p){
  return API.pileCards(p, 'hand', x=>x.db.k==='m' && (x.db.st||[]).indexOf('通常')>=0
    && normalSummonMethodsFor(x.db, p, 'summon').length>0);
}
defineScript('決戦の火蓋', {
  fieldIgnition:true,                /* 表側で場に残ったまま効果を発動する（カードの発動とは別） */
  type:'continuous-trap', priority:2,
  condition(ctx){
    if(!(gameState.activePlayer===ctx.player && (gameState.phase==='main1' || gameState.phase==='main2'))){
      ctx.reason = '自分のメインフェイズにのみ発動できます'; return false;
    }
    if(API.me(ctx).mz.length>=ZONE_LIMITS.mz){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    if(!u518FuseGraveMonstersS03(ctx.player).length){ ctx.reason = '除外する自分の墓地のモンスターがいません'; return false; }
    if(!u518FuseHandNormalsS03(ctx.player).length){ ctx.reason = '通常召喚できる通常モンスターが手札にありません'; return false; }
    return true;
  },
  /* WIKI-38EC2882E2E0（08/01/18）: 除外はコスト。 */
  cost(ctx, done){
    const pool = u518FuseGraveMonstersS03(ctx.player);
    if(!pool.length){ done(false); return; }
    API.selectCard('決戦の火蓋：ゲームから除外する墓地のモンスター', pool, t=>{
      const r = resolveTarget(t);
      if(!r || r.zone!=='grave'){ done(false); return; }
      API.banish(r, '決戦の火蓋（コスト）');
      done(true);
    });
  },
  resolve(ctx){
    const pool = u518FuseHandNormalsS03(ctx.player);
    if(!pool.length){ API.log('決戦の火蓋：通常召喚できる通常モンスターが手札に無いため不発'); return; }
    API.selectCard('決戦の火蓋：通常召喚する手札の通常モンスター', pool, x=>{
      const r = resolveTarget(x);
      if(!r || r.zone!=='hand') return;
      const db = dbOf(r.card), methods = normalSummonMethodsFor(db, ctx.player, 'summon');
      if(!methods.length){ API.log('決戦の火蓋：通常召喚できないため不発'); return; }
      s03BloodOfferTributeThenSummon(ctx.player, r.card, methods[0], db, [], '決戦の火蓋');
    });
  },
  afterResolve(){}
});

/* ---- デビル・フランケン ---- */
function u518FrankenPoolS03(p){
  return API.pileCards(p, 'ex', x=>{
    const d = x.db || {};
    return d.k==='m' && d.ex===true && Array.isArray(d.st) && d.st.indexOf('融合')>=0;
  });
}
API.registerChoiceHandler('s03u518.franken-summon', (answer, args)=>{
  const picked = (typeof v49P1ChoiceCards==='function') ? v49P1ChoiceCards(answer)[0] : null;
  const r = picked && resolveTarget(picked);
  if(!r || r.zone!=='ex' || r.p!==args.player) return;
  const before = r.card;
  ensureCardUid(gameState, before);
  /* 融合召喚ではないので kind は 'effect'（正規の特殊召喚にはならない）。 */
  act({type:'FX_EX_SUMMON', player:args.player, exIndex:r.index, materials:[], kind:'effect', pos:'atk'});
  const now = findCardByUid(before.uid);
  if(now && now.zone==='mz') queueSpecialSummonSuccessV2(args.player, now.card, 'effect');
});
defineUnifiedCardV4('デビル・フランケン', [{
  key:'ex-fusion', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up'){ ctx.reason = 'フィールドで表側表示の時に発動します'; return false; }
    if(API.me(ctx).lp<=5000){ ctx.reason = '5000LPを払えません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    if(!u518FrankenPoolS03(ctx.player).length){ ctx.reason = 'エクストラデッキに融合モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    if(API.me(ctx).lp<=5000){ showToast('LPが足りません'); done(false); return; }
    API.payCost(ctx.player, 5000);
    done(true);
  },
  operation(ctx){
    API.requestChoice({player:ctx.player, kind:'card', title:'デビル・フランケン：特殊召喚する融合モンスター',
      candidates:u518FrankenPoolS03(ctx.player), min:1, max:1, cancelable:false,
      resume:{handler:'s03u518.franken-summon', args:{player:ctx.player}}, meta:{scriptName:'デビル・フランケン'}});
  },
  afterResolve(){}
}], {type:'monster', priority:1, includesSpecialSummon:true, blocksIfNoSpecialSummon:true});

/* ---- クルセイダー・オブ・エンディミオン ---- */
function u518CrusaderTargetsS03(){
  return counterCapableCardsV22(gameState, null, '魔力', true).filter(x=>['mz','sz','field'].indexOf(x.zone)>=0);
}
/* 攻撃力アップはこのカード自身の継続効果として持つ（WIKI-7924775F83D7 10/12/17）。
   刻むのはこのターンに何回乗せたか（1ターンに1度なので 1 回だが、数で持てば裁定どおり積み上がらない）。 */
function u518CrusaderBoostS03(self){
  const m = self && self.u518CrusaderBoostS03;
  if(!m || Number(m.turn)!==Number(gameState.turn)) return 0;
  return (Number(m.n)||0) * 600;
}
defineGeminiS03('クルセイダー・オブ・エンディミオン', {
  type:'monster', priority:1, countLimit:1, targets:true,
  condition(ctx){
    if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up'){ ctx.reason = 'フィールドで表側表示の時に発動します'; return false; }
    if(!u518CrusaderTargetsS03().length){ ctx.reason = '魔力カウンターを置く事ができるカードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('クルセイダー・オブ・エンディミオン：魔力カウンターを置くカード', u518CrusaderTargetsS03(), t=>done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(r && ['mz','sz','field'].indexOf(r.zone)>=0 && r.card.face==='up') API.addCounter(r, '魔力', 1);
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone!=='mz') return;
    const cur = (ctx.card.u518CrusaderBoostS03 && Number(ctx.card.u518CrusaderBoostS03.turn)===Number(gameState.turn))
      ? Number(ctx.card.u518CrusaderBoostS03.n)||0 : 0;
    API.setCardFlag(me, 'u518CrusaderBoostS03', {turn:gameState.turn, n:cur+1},
      'クルセイダー・オブ・エンディミオン（ターン終了時まで攻撃力600アップ）');
  },
  afterResolve(){},
  continuous:{ scope:'self', from:['mz'], apply(target, self){
    const n = u518CrusaderBoostS03(self);
    return n ? {atk:n} : null; } }
});
