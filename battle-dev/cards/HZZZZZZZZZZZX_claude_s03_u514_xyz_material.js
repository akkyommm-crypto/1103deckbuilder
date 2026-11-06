/* =========================================================================
   S03-U514 — エクシーズ素材を使う未実装カード 3 枚（カード実装）
   -------------------------------------------------------------------------
   《巨星のミラ》（NOT_STARTED・ランク1）
     レベル1モンスター×3
     フィールド上に表側表示で存在するこのカードが破壊される場合、
     代わりにこのカードのエクシーズ素材を1つ取り除く事ができる。
     また、このカードがフィールド上に表側表示で存在する限り、
     自分フィールド上に表側表示で存在するレベル4以下のモンスターは、カードの効果では破壊されない。
   《ブラック・レイ・ランサー》（NOT_STARTED・ランク3）
     水属性レベル3モンスター×2
     1ターンに1度、このカードのエクシーズ素材を1つ取り除き、フィールド上に表側表示で存在する
     モンスター1体を選択して発動できる。選択したモンスターの効果をエンドフェイズ時まで無効にする。
   《ラヴァルバル・イグニス》（NOT_STARTED・ランク3）
     レベル3モンスター×2
     このカードが戦闘を行うダメージステップ時に1度だけ、このカードのエクシーズ素材を1つ
     取り除いて発動できる。このカードの攻撃力はエンドフェイズ時まで500ポイントアップする。

   新しい共通処理は足していない。使うのは既存の仕組みだけ:
     - 任意の破壊身代わり（S03-U173、engine/1ZV）の種別 'detach'
     - 破壊耐性（v21、engine/1K）の continuous.protectV21（effect 側）
     - X素材のコスト（S03-U114、engine/1ZF）の detachCostS03
     - 「ターン終了時まで効果を無効」の card.negatedUntilTurn（《エフェクト・ヴェーラー》と同じ）
     - ダメージステップの発動（dsTiming）と API.modAtk(..., 'endPhase')
   ========================================================================= */

/* ---- 巨星のミラ ---- */
/* 「レベル4以下のモンスター」。エクシーズモンスターはレベルを持たない（ランク）ので含めない。 */
function u514Lv4OrLessS03(card){
  if(!card || card.face !== 'up') return false;
  const db = dbOf(card);
  if(!db || db.k !== 'm') return false;
  if(Array.isArray(db.st) && db.st.indexOf('エクシーズ') >= 0) return false;
  const lv = (typeof curLV === 'function') ? curLV(card) : Number(db.lv);
  return Number(lv) <= 4;
}
defineUnifiedCardV4('巨星のミラ', [], {
  type:'monster', priority:1,
  /* 「破壊される場合、代わりにエクシーズ素材を1つ取り除く事ができる」＝ S03-U173 の任意の身代わり */
  destroySubstituteS03:{kind:'detach', causes:['battle','effect']},
  continuous:{
    scope:'ownMonsters', from:['mz'],
    apply(){ return null; },
    /* 「自分フィールド上に表側表示で存在するレベル4以下のモンスターは、カードの効果では破壊されない」 */
    protectV21:{ key:'巨星のミラ', label:'巨星のミラ',
      effect:(target, self) => !!target && target !== self && u514Lv4OrLessS03(target) }
  }
});

/* ---- ブラック・レイ・ランサー ---- */
function u514FaceUpMonstersS03(){
  const out = [];
  for(let p = 0; p < (gameState.players || []).length; p++){
    (gameState.players[p].mz || []).forEach((c, i) => {
      if(c && c.face === 'up') out.push({p:p, zone:'mz', index:i, card:c});
    });
  }
  return out;
}
defineScript('ブラック・レイ・ランサー', {
  type:'monster', priority:1, targets:true, countLimit:1,
  /* S03-U114: 素材を選んで取り除き、その後に対象を選ぶ（どちらも保存・再開に耐える登録済みの選択）。
     `targets` を宣言しないと、素材のコストを払う経路では対象の選択が走らない（S03-U514 で実測）。 */
  detachCostS03:{count:1, reason:'ブラック・レイ・ランサー（素材1つ）',
    targets(){ return {title:'ブラック・レイ・ランサー：効果を無効にするモンスター',
      candidates:u514FaceUpMonstersS03()}; }},
  condition(ctx){
    if(ctx.zone !== 'mz' || !ctx.card || ctx.card.face !== 'up'){
      ctx.reason = '表側表示でフィールドに存在する必要があります'; return false; }
    if(!(ctx.card.xyz || []).length){ ctx.reason = 'エクシーズ素材がありません'; return false; }
    if(!u514FaceUpMonstersS03().length){
      ctx.reason = 'フィールドに表側表示のモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ブラック・レイ・ランサー：効果を無効にするモンスター',
      u514FaceUpMonstersS03(), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'mz' || !r.card || r.card.face !== 'up') return;
    /* 《エフェクト・ヴェーラー》と同じ記録（そのターンの終わりまで効果が無効） */
    API.setCardFlag({card:r.card}, 'negatedUntilTurn', gameState.turn, 'ブラック・レイ・ランサー', {silent:true});
    API.log(`${labelOf(r.card)} の効果はエンドフェイズ時まで無効`);
  },
  afterResolve(){}
});

/* ---- ラヴァルバル・イグニス ---- */
/* 「このカードが戦闘を行うダメージステップ時に1度だけ」。
   同じダメージステップで二度発動しないように、ターン・攻撃モンスターの uid・その攻撃回数で
   その戦闘を一意に表して控える（攻撃回数は ATTACK_DECLARE_V48 が 1 ずつ増やす）。 */
function u514BattleKeyS03(ctx){
  const b = ctx.battle || {};
  const atk = b.atkCard;
  if(!atk) return null;
  ensureCardUid(gameState, atk);
  return String(gameState.turn) + ':' + String(atk.uid) + ':' + String(Number(atk.attackCount) || 0);
}
function u514IgnisReadyS03(ctx){
  if(ctx.zone !== 'mz' || !ctx.card || ctx.card.face !== 'up') return false;
  if(!(ctx.card.xyz || []).length) return false;
  const b = ctx.battle || {};
  if(b.atkCard !== ctx.card && b.defCard !== ctx.card) return false;
  const key = u514BattleKeyS03(ctx);
  if(!key) return false;
  return String(ctx.card.u514IgnisUsedS03 || '') !== key;
}
defineScript('ラヴァルバル・イグニス', {
  type:'monster', priority:1, dsTiming:'start',
  detachCostS03:{count:1, reason:'ラヴァルバル・イグニス（素材1つ）'},   /* S03-U114 */
  condition(ctx){
    if(!u514IgnisReadyS03(ctx)){
      ctx.reason = 'このカードが戦闘を行うダメージステップに1度だけ発動できます'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    const key = u514BattleKeyS03(ctx);
    if(key) API.setCardFlag(me, 'u514IgnisUsedS03', key, 'ラヴァルバル・イグニス', {silent:true});
    API.modAtk(me, 500, 500, 'endPhase', 'ラヴァルバル・イグニス');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return ctx.step === 'start' && u514IgnisReadyS03(ctx); } }
});
