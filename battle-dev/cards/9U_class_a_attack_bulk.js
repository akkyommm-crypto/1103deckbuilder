/* Class A bulk — 攻撃対象トリガー 4枚 ＋ 2回攻撃付与 1枚。
   engine は触らない。既存の onAttackDeclare + gameState.pendingAttack.targetUid、
   continuous.mustAttack / piercingDamage、v14 StatModifier、
   API.grantMultiAttack と P4 authority だけで書く。
   カード登録の第1引数は必ず文字列リテラル。ループ登録はしない。

   ミョルニルの魔槌 は今回見送り（末尾に理由）。 */

/* このカードが攻撃対象に選択されたか。表側攻撃表示であることも含めて判定する。 */
function caAttackTargetSelf(ctx){
  const a=gameState.pendingAttack;
  if(!a || a.targetUid==null) return false;
  if(ctx.zone!=='mz') return false;
  const c=ctx.card;
  if(!c || c.uid==null || a.targetUid!==c.uid) return false;
  return c.face==='up' && c.pos==='atk';
}
/* 攻撃対象に選択されたら自身を守備表示にする定型。 */
function caAttackTargetToDefense(name, meta){
  defineUnifiedCardV4(name,[{
    key:'attack-target-to-defense', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
    speed:1, events:['onAttackDeclare'],
    condition(ctx){ return caAttackTargetSelf(ctx); },
    operation(ctx){
      const h=locateCardAnyV4(ctx.card);
      if(h) API.changePosition(h,'def',name);},
    afterResolve(){}
  }],Object.assign({type:'monster',priority:1,forced:true,
    passive:{onAttackDeclare:caAttackTargetSelf}},meta||{}));
}

/* ===== 25. 暗黒ステゴ ===== */
caAttackTargetToDefense('暗黒ステゴ');

/* ===== 26. 悪シノビ — 攻撃対象に選択された時にデッキから1枚ドロー ===== */
defineUnifiedCardV4('悪シノビ',[{
  key:'attack-target-draw', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
  speed:1, events:['onAttackDeclare'],
  condition(ctx){ return caAttackTargetSelf(ctx) && gameState.players[ctx.player].deck.length>0; },
  operation(ctx){ API.draw(ctx.player,1); },
  afterResolve(){}
}],{type:'monster', priority:1, forced:true,
    passive:{onAttackDeclare:ctx=>caAttackTargetSelf(ctx)&&gameState.players[ctx.player].deck.length>0}});

/* ===== 27. マッド・デーモン — 貫通 ＋ 攻撃対象に選択されたら守備表示 ===== */
caAttackTargetToDefense('マッド・デーモン',
  {continuous:{scope:'self',from:['mz'],apply(){return null;},piercingDamage:ca6Piercing}});

/* ===== 28. カラクリ武者 六参壱八 =====
   ・攻撃可能な場合には攻撃しなければならない（continuous.mustAttack）
   ・攻撃対象に選択されたら守備表示
   ・フィールドの「カラクリ」が破壊されたら攻撃力 +400（永続）
   「カラクリ」は P4 の KARAKURI setcode。名前の部分一致は使わない。 */
function caKarakuriDestroyed(ctx){
  const e=ctx.event||{};
  const h=locateCardAnyV4(ctx.card);
  if(!h || h.zone!=='mz' || h.card.face!=='up') return false;
  const gone=e.card;
  if(!gone) return false;
  const gdb=dbOf(gone);
  return gdb.k==='m' && isSetCardV4(gdb, SETCODE.KARAKURI);
}
defineUnifiedCardV4('カラクリ武者 六参壱八',[{
  key:'attack-target-to-defense', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
  speed:1, events:['onAttackDeclare'],
  condition(ctx){ return caAttackTargetSelf(ctx); },
  operation(ctx){
    const h=locateCardAnyV4(ctx.card);
    if(h) API.changePosition(h,'def','カラクリ武者 六参壱八');},
  afterResolve(){}
},{
  key:'karakuri-destroyed-atk-up', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
  speed:1, events:['onDestroy'],
  condition(ctx){ return caKarakuriDestroyed(ctx); },
  operation(ctx){
    const h=locateCardAnyV4(ctx.card);
    if(h) API.addBaseStats(h,400,0,'permanent','カラクリ武者 六参壱八');},
  afterResolve(){}
}],{type:'monster', priority:1, forced:true,
    continuous:{scope:'self',from:['mz'],apply(){return null;},mustAttack(){return true;}},
    passive:{onAttackDeclare:caAttackTargetSelf, onDestroy:caKarakuriDestroyed}});

/* ===== 29. ヒーローハート =====
   「E・HERO」1体を選択。このターン攻撃力半分、1度のバトルフェイズ中に2回攻撃。 */
function caOwnElementalHeroes(p){
  return API.fieldCards({player:p, zone:'mz',
    filter:x => x.card.face==='up' && isSetCardV4(x.db, SETCODE.ELEMENTAL_HERO)});
}
defineUnifiedCardV4('ヒーローハート',[{
  key:'halve-and-double-attack', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE, targetSide:'self', speed:1, events:['activate'],
  condition(ctx){
    if(!caOwnElementalHeroes(ctx.player).length){
      ctx.reason='自分フィールドに「E・HERO」モンスターがいません'; return false; }
    return true;},
  target(ctx,done){
    API.selectCard('ヒーローハート：攻撃力を半分にして2回攻撃させる「E・HERO」',
      caOwnElementalHeroes(ctx.player), t=>done([t]));},
  operation(ctx){
    const t=ctx.selectedTargets&&ctx.selectedTargets[0];
    const h=t&&resolveTarget(t);
    if(!h || h.p!==ctx.player || h.zone!=='mz' || h.card.face!=='up') return;
    if(!isSetCardV4(h.db||dbOf(h.card), SETCODE.ELEMENTAL_HERO)) return;
    API.setAtk(h, Math.floor(curATK(h.card)/2), 'endTurn', 'ヒーローハート');
    /* 「1度のバトルフェイズ中に2回攻撃」は攻撃可能回数の話なので
       attackLimit を上げる grantAdditionalAttack で表す。
       grantMultiAttack は「相手モンスター全てに1回ずつ」を表す別の宣言で、
       canDeclareAttackV48 は参照しない。 */
    API.grantAdditionalAttack(h, 1, 'ヒーローハート', false);},
  afterResolve(){}
}],{type:'spell', priority:1, targets:true, timing:['mainPhase']});

/* ===== Phase 0. ミョルニルの魔槌 =====
   「自分フィールド上に表側表示で存在する「極神」と名のついたモンスター1体を
     選択して発動する。このターン、選択したモンスターは
     1度のバトルフェイズ中に2回攻撃する事ができる。」
   「極神」は P4 の AESIR authority（極神皇トール／極神皇ロキ／極神聖帝オーディンの3枚）。
   NORDIC(0x1025) は極星17枚を含む上位集合なので使わない。名前の部分一致も使わない。 */
function caOwnAesir(p){
  return API.fieldCards({player:p, zone:'mz',
    filter:x => x.card.face==='up' && isCardInGroupV4(x.db, GROUP.AESIR)});
}
defineUnifiedCardV4('ミョルニルの魔槌',[{
  key:'aesir-double-attack', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE, targetSide:'self', speed:2, events:['activate'],
  condition(ctx){
    if(!caOwnAesir(ctx.player).length){
      ctx.reason='自分フィールドに「極神」モンスターがいません'; return false; }
    return true;},
  target(ctx,done){
    API.selectCard('ミョルニルの魔槌：2回攻撃させる「極神」モンスター',
      caOwnAesir(ctx.player), t=>done([t]));},
  operation(ctx){
    const t=ctx.selectedTargets&&ctx.selectedTargets[0];
    const h=t&&resolveTarget(t);
    if(!h || h.p!==ctx.player || h.zone!=='mz' || h.card.face!=='up') return;
    if(!isCardInGroupV4(h.db||dbOf(h.card), GROUP.AESIR)) return;
    API.grantAdditionalAttack(h, 1, 'ミョルニルの魔槌', false);},
  afterResolve(){}
}],{type:'trap', priority:2, targets:true});
