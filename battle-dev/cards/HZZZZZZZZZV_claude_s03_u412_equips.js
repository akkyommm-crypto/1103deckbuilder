/* S03-U412: 災いの装備品, D・パワーユニット, コアバスター (NOT_STARTED Equip Spells, carddata texts).

   災いの装備品    （装備魔法）装備モンスターの攻撃力は、自分フィールド上に存在するモンスターの数×600ポイントダウンする。このカードがフィールド上から墓地へ送られた時、相手フィールド上に表側表示で存在するモンスター1体を選択してこのカードを装備する事ができる。
   D・パワーユニット  （装備魔法）「D」と名のついたレベル3のモンスターにのみ装備可能。装備モンスターの元々の攻撃力を倍にする。発動後2回目の自分のスタンバイフェイズ時にこのカードを破壊し、自分は装備モンスターの元々の攻撃力分のダメージを受ける。
   コアバスター    （装備魔法）「コアキメイル」と名のついたモンスターにのみ装備可能。装備モンスターが光属性または闇属性モンスターと戦闘を行う場合、ダメージ計算を行わずそのモンスターを破壊する。装備モンスターがフィールド上から離れる事によってこのカードが墓地へ送られた時、このカードを手札に戻す事ができる。

   Notes
   - u412Define is u312Define (S03-U312) plus the guard that an Equip Spell already standing equipped is not offered its equip activation again (S03-U399).
   - 災いの装備品: continuous apply -600 x my monsters on the host; when sent from the field to the Graveyard an optional Graveyard trigger equips it (API.equipFromGrave, Spell Equip) to a face-up opponent monster.
   - D・パワーユニット: the host's original ATK is added once more (apply {atk: printed ATK}); the equip operation stamps the turn it was equipped (u412Turn, u412Define's after callback); in my Standby Phase of the 2nd own turn after the activation (turn >= stamp + 4) it destroys itself and I take the host's original ATK as damage.
   - コアバスター: forced onDamageStep (dsTiming 'start') when the host battles a LIGHT or DARK monster: a3DestroyBeforeDamage on the partner; optional Graveyard trigger returning it to the hand when the host left the field (graveInfo.rule 'equip'). */

function u412EquipEffect(name, pred, after, own){
  const e = u312EquipEffect(name, pred, !!own), baseOp = e.operation;
  e.operation = function(ctx){ baseOp.call(this, ctx); if(typeof after==='function') after(ctx); };
  e.condition = function(ctx){ const h = locateCardAnyV4(ctx.card); if(h && h.zone==='sz' && ctx.card.face==='up' && ctx.card.equipTo) return false; return u312Hosts(ctx, pred, !!own).length>0; };
  return e;
}
function u412Define(name, o){
  const meta = Object.assign({type:'spell', priority:1, targets:true, activateFrom:['hand','sz','grave'],
    continuous:{scope:o.scope||'allMonsters', from:['sz'], apply(card, self){ return (o.stat && equippedS03(card, self)) ? o.stat : null; }}}, o.meta||{});
  if(o.continuous) Object.assign(meta.continuous, o.continuous);
  return defineUnifiedCardV4(name, [u412EquipEffect(name, o.pred, o.after, o.own)].concat(o.effects||[]), meta);
}
function u412Host(ctx){ const e = ctx.card && ctx.card.equipTo, h = e && e.uid!=null ? findCardByUid(e.uid) : null; return (h && h.zone==='mz') ? h : null; }
function u412OnSzUp(ctx){ return ctx.zone==='sz' && ctx.card.face==='up' && !ctx.card.activationPending; }
function u412Sent(ctx){
  const e = ctx.event || {}, g = ctx.card.graveInfo;
  return ctx.zone==='grave' && ((e.uid!=null && e.uid===ctx.card.uid) || e.card===ctx.card) && !!g && (g.from==='sz' || g.from==='field') && Number(g.turn)===Number(gameState.turn);
}

/* ---- 災いの装備品 ---- */
function u412FoeUp(ctx){ return API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m'}); }
u412Define('災いの装備品', {pred:x=>x.db.k==='m', own:false,
  continuous:{ apply(card, self){
    if(!equippedS03(card, self)) return null;
    const h = locateCardAnyV4(self); if(!h) return null;
    const n = API.fieldCards({player:h.p, zone:'mz'}).length;
    return n>0 ? {atk:-600*n} : null; } },
  effects:[{
    key:'re-equip', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave'], targetRange:LOCATION.MZONE, targetSide:'opponent',
    condition(ctx){ return u412Sent(ctx) && u412FoeUp(ctx).length>0 && gameState.players[ctx.player].sz.length<ZONE_LIMITS.sz; },
    operation(ctx){
      const pool = u412FoeUp(ctx); if(!pool.length) return;
      API.selectCard('災いの装備品：装備する相手の表側表示モンスター', pool, t=>{
        const r = t && resolveTarget(t), me = locateCardAnyV4(ctx.card);
        if(r && r.zone==='mz' && r.p===ctx.opponent && r.card.face==='up' && me && me.zone==='grave') API.equipFromGrave(ctx.player, me, r, '災いの装備品');
      });
    },
    afterResolve(){}
  }],
  meta:{ passive:{ onSendToGrave(ctx){ return u412Sent(ctx) && u412FoeUp(ctx).length>0 && gameState.players[ctx.player].sz.length<ZONE_LIMITS.sz; } } } });

/* ---- D・パワーユニット ---- */
function u412IsD(x){ return x.db.k==='m' && /^D[・－]/.test(String(x.db.n||'')) && Number(x.db.lv)===3; }
function u412Fuse(ctx){ return u412OnSzUp(ctx) && ctx.player===gameState.activePlayer && gameState.phase==='standby' && Number(ctx.card.u412Turn)>0 && Number(gameState.turn) >= Number(ctx.card.u412Turn)+4 && !!u412Host(ctx); }
u412Define('D・パワーユニット', {pred:u412IsD, own:true,
  continuous:{ apply(card, self){ return equippedS03(card, self) ? {atk:Number(dbOf(card).atk)||0} : null; } },
  after(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='sz') API.setCardFlag(me, 'u412Turn', gameState.turn, 'D・パワーユニット', {silent:true}); },
  effects:[{
    key:'blow', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onStandbyPhase'], forced:true,
    condition(ctx){ return u412Fuse(ctx); },
    operation(ctx){
      const h = u412Host(ctx), me = locateCardAnyV4(ctx.card); if(!h || !me) return;
      const dmg = Number(dbOf(h.card).atk)||0;
      API.destroy(me, 'D・パワーユニット'); API.damageLP(ctx.player, dmg, 'D・パワーユニット');
    },
    afterResolve(){}
  }],
  meta:{ passive:{ onStandbyPhase(ctx){ return u412Fuse(ctx); } } } });

/* ---- コアバスター ---- */
function u412Koa(x){ return x.db.k==='m' && String(x.db.n||'').indexOf('コアキメイル')===0; }
function u412KoaPartner(ctx){
  if(ctx.zone!=='sz' || ctx.card.face!=='up') return null;
  const h = u412Host(ctx); if(!h) return null;
  const o = a5BattleOtherOf(h.card);
  if(!o || o.face!=='up') return null;
  const at = dbOf(o).at; if(at!=='光' && at!=='闇') return null;
  const l = locateCardAnyV4(o); return (l && l.zone==='mz') ? o : null;
}
u412Define('コアバスター', {pred:u412Koa, own:true,
  effects:[{
    key:'buster', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onDamageStep'], forced:true,
    condition(ctx){ return !!u412KoaPartner(ctx); },
    operation(ctx){ const o = u412KoaPartner(ctx); if(o) a3DestroyBeforeDamage(o, 'コアバスター'); },
    afterResolve(){}
  }, {
    key:'return', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave'],
    condition(ctx){ return u412Sent(ctx) && ctx.card.graveInfo.rule==='equip'; },
    operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='grave') act({type:'MOVE', player:me.p, from:'grave', fromIndex:me.index, to:'hand', face:'up'}); },
    afterResolve(){}
  }],
  meta:{ dsTiming:'start', passive:{ onDamageStep(ctx){ return !!u412KoaPartner(ctx); }, onSendToGrave(ctx){ return u412Sent(ctx) && ctx.card.graveInfo.rule==='equip'; } } } });
