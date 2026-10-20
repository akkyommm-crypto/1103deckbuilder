/* S03-U433: コアキメイル・デビル, コアキメイル・パワーハンド, G・コザッキー, ターレット・ウォリアー, バイス・ドラゴン, デス・カンガルー (stale ENGINE_GAP cards, carddata texts).

   コアキメイル・デビル        (upkeep: 鋼核 or a 悪魔族 shown) このカードがフィールド上に表側表示で存在する限り、メインフェイズ時に発動する光属性及び闇属性モンスターの効果は無効化される。
   コアキメイル・パワーハンド  (upkeep: 鋼核 or a Normal Trap shown) このカードが光属性または闇属性のモンスターと戦闘を行う場合、バトルフェイズの間だけそのモンスターの効果は無効化される。
   G・コザッキー               フィールド上に「コザッキー」が表側表示で存在していない場合、このカードを破壊する。フィールド上に表側表示で存在するこのカードが破壊された場合、その時のコントローラーにこのカードの元々の攻撃力分のダメージを与える。
   ターレット・ウォリアー      このカードは自分フィールド上の戦士族モンスター1体をリリースして手札から特殊召喚できる。この方法で特殊召喚したこのカードの攻撃力は、リリースしたモンスターの元々の攻撃力分アップする。
   バイス・ドラゴン            ①：相手フィールドにモンスターが存在し、自分フィールドにモンスターが存在しない場合、このカードは手札から特殊召喚できる。この方法で特殊召喚したこのカードの元々の攻撃力・守備力は半分になる。
   デス・カンガルー            守備表示のこのカードを攻撃したモンスターの攻撃力がこのカードの守備力より低い場合、その攻撃モンスターを破壊する。

   Notes
   - デビル uses the activated-monster-effect field hook: it covers LIGHT / DARK effects activated from any zone in a Main Phase without blanketing continuous effects. パワーハンド uses declareNegateFromMzS03 (U432) + continuous.negateEffect(target, self) while it battles a LIGHT / DARK monster.
   - Upkeep = u321UpkeepEffect / u321UpkeepMeta (鋼核 first, else the shown card, else destroy). The shown Normal Trap = a Trap card without a sub type.
   - G・コザッキー: selfDestroyWhenS03 (no face-up コザッキー on either field) + a forced Graveyard trigger on a face-up destruction: its original ATK (2500) to the controller (same shape as マンモス・ゾンビ).
   - ターレット / バイス: summonProcedure from the hand; the Tribute is sent to the Graveyard in the cost (precedent: ヴァースキ), the Warrior's original ATK is carried in ctx.procedureDataS03 and added in afterSummonS03 (setBaseStats); the Vice Dragon halves its printed 2000 / 2400.
   - デス・カンガルー: forced onDamageStep (dsTiming 'after'): when it was the Defense Position defender and the attacker's current ATK < its current DEF, the attacker is destroyed (if still on the field). */

function u433Light(db){ return db.at==='光' || db.at==='闇'; }
function u433Main(){ return gameState.phase==='main1' || gameState.phase==='main2'; }

/* ---- コアキメイル・デビル ---- */
defineUnifiedCardV4('コアキメイル・デビル', [u321UpkeepEffect(db=>db.k==='m' && db.ra==='悪魔')], u321UpkeepMeta({
  negateActivatedMonsterEffectS03(link, sourceCard, sourceDb, attribute){
    return !!link && (link.activationPhase==='main1' || link.activationPhase==='main2') && (attribute==='光' || attribute==='闇');
  }
}));

/* ---- コアキメイル・パワーハンド ---- */
declareNegateFromMzS03('コアキメイル・パワーハンド');
function u433Fights(self, target){
  const b = gameState.battle; if(!b || gameState.phase!=='battle' || self.uid==null || target.uid==null) return false;
  return (b.atkUid===self.uid && b.targetUid===target.uid) || (b.targetUid===self.uid && b.atkUid===target.uid);
}
defineUnifiedCardV4('コアキメイル・パワーハンド', [u321UpkeepEffect(db=>db.k==='t' && !db.sub)], u321UpkeepMeta({
  continuous:{ scope:'allMonsters', from:['mz'], apply(){ return null; },
    negateEffect(target, self){ const d = dbOf(target); return self.face==='up' && target!==self && target.face==='up' && d.k==='m' && u433Light(d) && u433Fights(self, target); } } }));

/* ---- G・コザッキー ---- */
function u433Burn(ctx){
  const e = ctx.event || {}, g = ctx.card.graveInfo;
  return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && !!g && g.from==='mz' && !!g.byDestroy && g.face==='up' && Number(g.turn)===Number(gameState.turn);
}
defineUnifiedCardV4('G・コザッキー', [{
  key:'burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave'], forced:true,
  condition(ctx){ return u433Burn(ctx); },
  operation(ctx){ API.damageLP(ctx.player, Number(dbOf(ctx.card).atk)||0, 'G・コザッキー'); },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], forced:true, activateFrom:['grave'], passive:{ onSendToGrave(ctx){ return u433Burn(ctx); } },
  selfDestroyWhenS03:(card, p)=> API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && x.db.n==='コザッキー'}).length ? false : 'G・コザッキー：フィールドに表側表示の「コザッキー」がいないため破壊' });

/* ---- ターレット・ウォリアー ---- */
function u433Warriors(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m' && x.db.ra==='戦士'}); }
defineScript('ターレット・ウォリアー', {
  type:'monster', priority:1, timing:['free'],
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; }, resolve(){}, afterResolve(){},
  summonProcedure:{ from:['hand'], positions:['atk','def'],
    condition(ctx){ if(!u433Warriors(ctx).length){ ctx.reason = '自分フィールドに戦士族モンスターがいません'; return false; } return true; },
    cost(ctx, done){
      u342PickN('ターレット・ウォリアー：リリースする戦士族モンスター', ctx, u433Warriors, 1, h=>{ ctx.procedureDataS03 = {atk:Number(dbOf(h.card).atk)||0}; API.sendToGrave(h, 'ターレット・ウォリアー（リリース）'); }, done);
    },
    afterSummonS03(h, data){ const a = Number(data && data.atk) || 0; if(h && h.zone==='mz') API.setBaseStats(h, (Number(dbOf(h.card).atk)||0) + a, Number(dbOf(h.card).def)||0, 'permanent', 'ターレット・ウォリアー'); } } });

/* ---- バイス・ドラゴン ---- */
defineScript('バイス・ドラゴン', {
  type:'monster', priority:1, timing:['free'],
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; }, resolve(){}, afterResolve(){},
  summonProcedure:{ from:['hand'], positions:['atk','def'],
    condition(ctx){
      if(!API.fieldCards({player:ctx.opponent, zone:'mz'}).length){ ctx.reason = '相手フィールドにモンスターがいません'; return false; }
      if(API.fieldCards({player:ctx.player, zone:'mz'}).length){ ctx.reason = '自分フィールドにモンスターが存在します'; return false; }
      return true;
    },
    cost(ctx, done){ ctx.procedureDataS03 = {}; done(true); },   /* afterSummonS03 runs only when the cost recorded procedureDataS03 */
    afterSummonS03(h){
      if(h && h.zone==='mz') v4RegisterStatModifier(h, {
        setBaseAtk:Math.floor((Number(dbOf(h.card).atk)||0)/2),
        setBaseDef:Math.floor((Number(dbOf(h.card).def)||0)/2)
      }, {code:'バイス・ドラゴン（自身の方法）', resetMask:RESET.LEAVE|RESET.FACE_DOWN});
    } } });

/* ---- デス・カンガルー ---- */
function u433Kangaroo(ctx){
  const b = ctx.battle || {};
  if(ctx.zone!=='mz' || ctx.card.face!=='up' || ctx.card.pos!=='def' || b.defCard!==ctx.card || !b.atkCard) return null;
  return curATK(b.atkCard) < curDEF(ctx.card) ? b.atkCard : null;
}
defineUnifiedCardV4('デス・カンガルー', [{
  key:'smash', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return !!u433Kangaroo(ctx); },
  operation(ctx){ const a = u433Kangaroo(ctx); const h = a && locateCardAnyV4(a); if(h && h.zone==='mz') API.destroy(h, 'デス・カンガルー'); },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], forced:true, dsTiming:'after', passive:{ onDamageStep(ctx){ return !!u433Kangaroo(ctx); } } });
