/* S03-U248: Trap Monsters (2011 texts) — アポピスの化神 (ENGINE_GAP), メタル・リフレクト・スライム, 死霊ゾーマ (NOT_STARTED),
   機動砦 ストロング・ホールド (ENGINE_GAP). Engine: engine/1ZZI (trapMonsterActivateS03, asMonsterDbS03 read by dbOf). */

/* ---- アポピスの化神: ①自分・相手のメインフェイズに発動できる。このカードは発動後、通常モンスター(爬虫類族・地・星4・攻1600/守1800)となり、
   モンスターゾーンに特殊召喚する。このカードは罠カードとしても扱う。 ---- */
defineUnifiedCardV4('アポピスの化神', [trapMonsterActivateS03('アポピスの化神', {kind:'normal', ra:'爬虫類', at:'地', lv:4, atk:1600, def:1800, pos:'atk',
  condition(ctx){ if(gameState.phase!=='main1' && gameState.phase!=='main2'){ ctx.reason = 'メインフェイズに発動できます'; return false; } return true; }})],
  {type:'trap', priority:2});

/* ---- メタル・リフレクト・スライム: ①このカードは発動後、効果モンスター(水族・水・星10・攻0/守3000)となり、モンスターゾーンに守備表示で特殊召喚する。
   ②このカードの効果で特殊召喚されたこのカードは攻撃できない。 ---- */
defineUnifiedCardV4('メタル・リフレクト・スライム', [trapMonsterActivateS03('メタル・リフレクト・スライム', {kind:'effect', ra:'水', at:'水', lv:10, atk:0, def:3000, pos:'def'})],
  {type:'trap', priority:2,
   continuous:{scope:'self', from:['mz'], apply(){ return null; }, cannotAttack(card, self){ return card===self && trapMonsterSummonedS03(self); }}});

/* ---- 死霊ゾーマ: ①このカードは発動後、効果モンスター(アンデット族・闇・星4・攻1800/守500)となり、モンスターゾーンに守備表示で特殊召喚する。
   ②このカードの効果で特殊召喚したこのカードが戦闘で破壊された場合に発動する。このカードを破壊したモンスターの攻撃力分のダメージを相手に与える。
   (the zone-local marks are gone in the GY: engine/00 reset() records leftAsTrapMonsterS03 {turn, self} when a Trap Monster leaves) ---- */
function zomaBattleS03(ctx){
  if(ctx.zone!=='grave' || !ctx.card || !eventIsSelfS03(ctx)) return null;
  const g = ctx.card.graveInfo; if(!g || !g.battle || Number(g.turn)!==Number(gameState.turn)) return null;
  const b = [ctx.battle, (typeof battleContextV28==='function' ? battleContextV28() : null), gameState.lastBattle].find(x=>x && x.atkCard) || {};
  const me = ctx.card.uid;
  const foe = (b.defCard && b.defCard.uid===me) ? b.atkCard : ((b.atkCard && b.atkCard.uid===me) ? b.defCard : null);
  if(!foe) return null;
  const left = ctx.card.leftAsTrapMonsterS03;   /* engine/00 reset(): it left the field as a Trap Monster summoned by its own effect */
  if(!left || !left.self || Number(left.turn)!==Number(gameState.turn)) return null;
  return foe;
}
defineUnifiedCardV4('死霊ゾーマ', [trapMonsterActivateS03('死霊ゾーマ', {kind:'effect', ra:'アンデット', at:'闇', lv:4, atk:1800, def:500, pos:'def'}), {
  key:'battle-destroyed-burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onBattleDestroy'], forced:true,
  condition(ctx){ return !!zomaBattleS03(ctx); },
  operation(ctx){ const foe = zomaBattleS03(ctx); const h = foe && foe.uid!=null ? findCardByUid(foe.uid) : null; const atk = h ? curATK(h.card) : Number(foe && foe.atkAtBattleS03)||0; if(atk>0) API.damageLP(ctx.opponent, atk, '死霊ゾーマ'); },
  afterResolve(){}
}], {type:'trap', priority:2, activateFrom:['sz','grave']});

/* ---- 機動砦 ストロング・ホールド: ①このカードは発動後、効果モンスター(機械族・地・星4・攻0/守2000)となり、モンスターゾーンに守備表示で特殊召喚する。
   ②自分フィールドに「グリーン・ガジェット」「レッド・ガジェット」「イエロー・ガジェット」が存在する場合、このカードの効果で特殊召喚されたこのカードの
   攻撃力は3000アップする。 ---- */
function strongholdGadgetsS03(p){
  const names = new Set((gameState.players[p].mz||[]).filter(c=>c && c.face==='up').map(c=>cardName(c)));
  return ['グリーン・ガジェット','レッド・ガジェット','イエロー・ガジェット'].every(n=>names.has(n));
}
defineUnifiedCardV4('機動砦 ストロング・ホールド', [trapMonsterActivateS03('機動砦 ストロング・ホールド', {kind:'effect', ra:'機械', at:'地', lv:4, atk:0, def:2000, pos:'def'})],
  {type:'trap', priority:2,
   continuous:{scope:'self', from:['mz'], apply(card, self){
     if(card!==self || !trapMonsterSummonedS03(self)) return null;
     const loc = locateCardAnyV4(self); return (loc && strongholdGadgetsS03(loc.p)) ? {atk:3000} : null; }}});
