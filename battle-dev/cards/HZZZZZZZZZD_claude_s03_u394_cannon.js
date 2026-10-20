/* S03-U394: リニアキャノン, 絶対不可侵領域, 極限への衝動 (NOT_STARTED cards, carddata texts).

   リニアキャノン    （通常魔法）自分フィールド上に存在するモンスター1体を生け贄に捧げ、そのモンスターの元々の攻撃力の半分のダメージを相手ライフに与える。このカードを発動する場合、このターン中に他の魔法カードを発動する事はできない。
   絶対不可侵領域    （通常罠）自分のスタンバイフェイズに発動する事ができる。手札からカードを1枚捨てる。相手は次の相手ターンに通常召喚・特殊召喚ができない。
   極限への衝動      （通常罠）手札を2枚墓地へ送って発動する。自分フィールド上に「ソウルトークン」(悪魔族・闇・星1・攻/守0)2体を特殊召喚する。このトークンはアドバンス召喚以外のためにはリリースできない。

   Notes
   - リニアキャノン: the Tribute is the cost (sendToGrave); the damage is half the printed ATK of that monster (db.atk, rounded down); after the activation Spell Cards of mine cannot be activated for the rest of the turn (the card lingers; activationLockS03 reads a stamp).
   - 絶対不可侵領域: my own Standby Phase only; the discard is the cost; the opponent's ban is banSummonS03 for Normal and Special Summons in turn+1.
   - 極限への衝動: two hand cards to the Graveyard (cost); two Tokens need two free zones; a Token can be Tributed for an Advance Summon (the only Tribute use the engine models centrally); known limit, as for the cloud Tokens of S03-U388: a Release as the cost of an EFFECT is not intercepted. */

/* ---- リニアキャノン ---- */
function u394Mine(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.db.k==='m' || x.card.token===true}); }
defineScript('リニアキャノン', {
  type:'spell', priority:1, targets:false,
  condition(ctx){ if(!u394Mine(ctx).length){ ctx.reason = '自分フィールドにモンスターがいません'; return false; } return true; },
  cost(ctx, done){
    const pool = u394Mine(ctx); if(!pool.length){ done(false); return; }
    API.selectCard('リニアキャノン：生け贄に捧げるモンスター', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='mz'){ done(false); return; }
      const atk = Number(dbOf(r.card).atk)||0;
      API.setFlag(ctx.player, 'u394CannonAtk', atk, true);
      API.sendToGrave(r, 'リニアキャノン（生け贄）'); done(true);
    });
  },
  resolve(ctx){
    const atk = Number(API.getFlag(ctx.player, 'u394CannonAtk'))||0;
    API.damageLP(ctx.opponent, Math.floor(atk/2), 'リニアキャノン');
    const me = locateCardAnyV4(ctx.card); if(!me) return;
    API.setCardFlag(me, 'u394CannonTurn', gameState.turn, 'リニアキャノン', {silent:true});
    const me2 = locateCardAnyV4(ctx.card); if(me2) API.lingerS03(ctx.player, me2, 'リニアキャノン');
  },
  afterResolve(){},
  activationLockS03:(i)=> i.db.k==='s' && i.p===i.srcPlayer && Number(i.src.u394CannonTurn)===Number(gameState.turn)
});

/* ---- 絶対不可侵領域 ---- */
function u394Standby(ctx){ return ctx.player===gameState.activePlayer && gameState.phase==='standby'; }
defineScript('絶対不可侵領域', {
  type:'trap', priority:2, targets:false,
  condition(ctx){
    if(!u394Standby(ctx)){ ctx.reason = '自分のスタンバイフェイズにのみ発動できます'; return false; }
    if(!API.me(ctx).hand.length){ ctx.reason = '手札がありません'; return false; }
    return true;
  },
  cost(ctx, done){
    const pool = API.pileCards(ctx.player, 'hand'); if(!pool.length){ done(false); return; }
    API.selectCard('絶対不可侵領域：捨てる手札', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='hand'){ done(false); return; }
      API.discard(ctx.player, r.index, '絶対不可侵領域（コスト）'); done(true);
    });
  },
  resolve(ctx){ banSummonS03(ctx.opponent, gameState.turn+1, gameState.turn+1, ['normal','special'], {}, '絶対不可侵領域'); },
  afterResolve(){}
});

/* ---- 極限への衝動 ---- */
defineTokenSpecV11('ソウルトークン', {atk:0, def:0, lv:1, ra:'悪魔', at:'闇', pos:'atk'});
defineScript('極限への衝動', {
  type:'trap', priority:2, targets:false, includesSpecialSummon:true,
  condition(ctx){
    if(API.me(ctx).hand.length<2){ ctx.reason = '手札が2枚必要です'; return false; }
    if(API.me(ctx).mz.length>ZONE_LIMITS.mz-2){ ctx.reason = 'モンスターゾーンに空きが2つ必要です'; return false; }
    return true;
  },
  cost(ctx, done){ u342PickN('極限への衝動：墓地へ送る手札', ctx, c=>API.pileCards(c.player, 'hand'), 2, h=>API.sendHandToGrave(ctx.player, h.index, '極限への衝動（コスト）'), done); },
  resolve(ctx){
    if(API.me(ctx).mz.length>ZONE_LIMITS.mz-2) return;
    API.createToken(ctx.player, {name:'ソウルトークン', atk:0, def:0, lv:1, ra:'悪魔', at:'闇', pos:'atk'}, 2);
  },
  afterResolve(){}
});
