/* Class A bulk — 貫通（piercing）10枚。
   engine は触らない。既存の continuous.piercingDamage（System v6 Battle）と
   9N の ca6Piercing、v17 の現在種族、v6/v80 の戦闘ダメージ誘発だけで書く。
   カード登録の第1引数は必ず文字列リテラル。ループ登録はしない。 */

/* 自分だけが貫通を持つ定型。ca6Piercing（9N）をそのまま使う。 */
function caPierceSelfCard(name){
  defineScript(name,{type:'monster',priority:1,
    continuous:{scope:'self',from:['mz'],apply(){return null;},piercingDamage:ca6Piercing}});
}
/* 自分フィールドのモンスター群へ貫通を配る共通処理。
   applyPiercingDamage は scope を見ないので、届く範囲はこの関数で厳密に決める。 */
function caPierceGroup(info, allow){
  const self=info.self, atkCard=info.atkCard, defCard=info.defCard;
  if(!self || self.face!=='up') return 0;
  const sh=locateCardAnyV4(self);
  if(!sh || sh.zone!=='mz') return 0;
  if(!atkCard || !defCard || defCard.pos!=='def') return 0;
  const ah=locateCardAnyV4(atkCard);
  if(!ah || ah.zone!=='mz' || ah.p!==info.srcPlayer) return 0;
  if(!allow(atkCard, self, info.srcPlayer)) return 0;
  return Math.max(0, curATK(atkCard)-curDEF(defCard));
}
/* 自分フィールドに、自身以外で現在の種族が ra のモンスターがいるか */
function caOtherOwnRace(self, p, ra){
  return API.fieldCards({player:p, zone:'mz',
    filter:x => x.card!==self && x.card.face==='up' && currentRaceV17(x.card)===ra}).length>0;
}

/* ---- 1-3. 自身のみの貫通（未知ガエル・幻獣ワイルドホーンと同型） ---------- */
caPierceSelfCard('セイバー・ビートル');
caPierceSelfCard('バイトロン');
caPierceSelfCard('暗黒ドリケラトプス');

/* ---- 4. ツイン・ブレイカー ------------------------------------------------
   貫通に加えて「守備表示モンスターを攻撃した場合、もう1度だけ続けて攻撃できる」。 */
defineUnifiedCardV4('ツイン・ブレイカー',[{
  key:'extra-attack-after-defense', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
  speed:1, events:['onDamageStep'],
  condition(ctx){
    const b=ctx.battle||{};
    return ctx.zone==='mz' && ctx.card.face==='up' && ctx.step==='leave'
      && b.atkCard===ctx.card && !!b.defCard && b.defCard.pos==='def'
      && ctx.card.v9sTwinTurn!==gameState.turn;},
  operation(ctx){
    const h=locateCardAnyV4(ctx.card);
    if(!h) return;
    API.setCardFlag(h,'v9sTwinTurn',gameState.turn,'ツイン・ブレイカー');
    API.grantAdditionalAttack(h,1,'ツイン・ブレイカー',true);},
  afterResolve(){}
}],{type:'monster', priority:1, forced:true, dsTiming:'leave',
    continuous:{scope:'self',from:['mz'],apply(){return null;},piercingDamage:ca6Piercing},
    passive:{onDamageStep(ctx){const b=ctx.battle||{};
      return ctx.zone==='mz' && ctx.step==='leave' && b.atkCard===ctx.card
        && !!b.defCard && b.defCard.pos==='def' && ctx.card.v9sTwinTurn!==gameState.turn;}}});

/* ---- 5. 天空騎士パーシアス ------------------------------------------------
   貫通に加えて、相手に戦闘ダメージを与えた場合に1枚ドロー（貫通ダメージを含む）。 */
defineUnifiedCardV4('天空騎士パーシアス',[{
  key:'draw-on-battle-damage', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
  speed:1, events:['onDamageStep'],
  condition(ctx){ return v81BattleDamageBySelf(ctx,false); },
  operation(ctx){ API.draw(ctx.player,1); },
  afterResolve(){}
}],{type:'monster', priority:1, forced:true, dsTiming:'after',
    continuous:{scope:'self',from:['mz'],apply(){return null;},piercingDamage:ca6Piercing},
    passive:{onDamageStep:ctx=>v81BattleDamageBySelf(ctx,false)}});

/* ---- 6. 地獄将軍・メフィスト ----------------------------------------------
   貫通に加えて、相手に戦闘ダメージを与えた時に相手の手札をランダムに1枚捨てる。 */
defineUnifiedCardV4('地獄将軍・メフィスト',[{
  key:'battle-damage-random-discard', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
  speed:1, events:['onDamageStep'],
  condition(ctx){ return v81BattleDamageBySelf(ctx,false) && API.foe(ctx).hand.length>0; },
  operation(ctx){ v80DiscardRandom(ctx.opponent,1,'地獄将軍・メフィスト',ctx.player); },
  afterResolve(){}
}],{type:'monster', priority:1, forced:true, dsTiming:'after',
    continuous:{scope:'self',from:['mz'],apply(){return null;},piercingDamage:ca6Piercing},
    passive:{onDamageStep:ctx=>v81BattleDamageBySelf(ctx,false)&&API.foe(ctx).hand.length>0}});

/* ---- 7-10. 自分フィールドのモンスター群へ貫通を配る ---------------------- */
/* 激昂のミノタウルス — 自分の獣族・獣戦士族・鳥獣族 */
defineScript('激昂のミノタウルス',{type:'monster',priority:1,
  continuous:{scope:'allMonsters',from:['mz'],apply(){return null;},
    piercingDamage(info){ return caPierceGroup(info,(atk)=>{
      const ra=currentRaceV17(atk);
      return ra==='獣'||ra==='獣戦士'||ra==='鳥獣';}); }}});

/* クロスソード・ハンター — 自身以外の昆虫族が自分フィールドにいる場合のみ、自分の昆虫族 */
defineScript('クロスソード・ハンター',{type:'monster',priority:1,
  continuous:{scope:'allMonsters',from:['mz'],apply(){return null;},
    piercingDamage(info){ return caPierceGroup(info,(atk,self,p)=>
      currentRaceV17(atk)==='昆虫' && caOtherOwnRace(self,p,'昆虫')); }}});

/* ライオ・アリゲーター — 自身以外の爬虫類族が自分フィールドにいる場合のみ、自分の爬虫類族 */
defineScript('ライオ・アリゲーター',{type:'monster',priority:1,
  continuous:{scope:'allMonsters',from:['mz'],apply(){return null;},
    piercingDamage(info){ return caPierceGroup(info,(atk,self,p)=>
      currentRaceV17(atk)==='爬虫類' && caOtherOwnRace(self,p,'爬虫類')); }}});

/* インフェルニティ・ドワーフ — 自分の手札が0枚の場合、自分フィールドの全モンスター */
defineScript('インフェルニティ・ドワーフ',{type:'monster',priority:1,
  continuous:{scope:'allMonsters',from:['mz'],apply(){return null;},
    piercingDamage(info){ return caPierceGroup(info,(atk,self,p)=>
      gameState.players[p].hand.length===0); }}});
