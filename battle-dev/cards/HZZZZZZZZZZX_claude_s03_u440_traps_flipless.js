/* S03-U440: モンスターレリーフ, 六武派二刀流, 生命力吸収魔術, A・O・J リサーチャー (stale ENGINE_GAP cards, carddata texts).

   モンスターレリーフ     （罠）相手モンスターの攻撃宣言時に発動する事ができる。自分フィールド上に存在するモンスター1体を手札に戻し、その後手札からレベル4モンスター1体を特殊召喚する。
   六武派二刀流           （罠）自分フィールド上に存在するモンスターが、表側攻撃表示で存在する「六武衆」と名のついたモンスター1体のみの場合に発動する事ができる。相手フィールド上に存在するカード2枚を選択して持ち主の手札に戻す。
   生命力吸収魔術         （罠）フィールド上の全ての裏側守備表示モンスターを表側表示にする。この時、リバース効果モンスターの効果は発動しない。自分はフィールド上の効果モンスター1体につき400ライフポイント回復する。
   A・O・J リサーチャー   1ターンに1度、手札を1枚捨てて発動できる。相手フィールド上に裏側守備表示で存在するモンスター1体を選択して表側攻撃表示にする。この時、リバース効果モンスターの効果は発動しない。

   Notes
   - Traps follow the attack-declaration trap pattern (炸裂装甲: gameState.pendingAttack, passive onAttackDeclare on a Set card).
   - A face-up turn by FX_SET_STATE without v10FlipEffect raises no onFlip (engine/19) - exactly 「リバース効果は発動しない」; the face-down Defense monsters are turned face-up (生命力吸収魔術: both fields, position unchanged) / face-up Attack Position (リサーチャー).
   - 生命力吸収魔術 counts the Effect Monsters on the field (both sides, face-up after the flip) x 400 for its controller.
   - 六武派二刀流: two opponent cards (Monster / Spell & Trap / Field Zone) are chosen one after another and returned to the hand.
   - モンスターレリーフ: the monster to return is chosen, then a Level 4 monster of the hand (the returned one included) is Special Summoned in Attack Position. */

/* ---- モンスターレリーフ ---- */
function u440Lv4(p){ return API.pileCards(p, 'hand', x=>x.db.k==='m' && Number(x.db.lv)===4 && canEffectSpecialSummonS03(x.card, 'hand', 'モンスターレリーフ')); }
defineScript('モンスターレリーフ', {
  type:'trap', priority:2,
  condition(ctx){
    const a = gameState.pendingAttack;
    if(!a || a.player!==ctx.opponent){ ctx.reason = '相手モンスターの攻撃宣言時に発動します'; return false; }
    if(!API.fieldCards({player:ctx.player, zone:'mz'}).length){ ctx.reason = '自分フィールドにモンスターがいません'; return false; }
    return true;
  },
  resolve(ctx){
    const own = API.fieldCards({player:ctx.player, zone:'mz'}); if(!own.length) return;
    API.selectCard('モンスターレリーフ：手札に戻す自分のモンスター', own, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='mz' || r.p!==ctx.player) return;
      API.returnToHand(r, 'モンスターレリーフ');
      const pool = u440Lv4(ctx.player); if(!pool.length || !hasMonsterZoneSpace(ctx.player)) return;
      API.selectCard('モンスターレリーフ：特殊召喚するレベル4モンスター', pool, t2=>{
        const r2 = t2 && resolveTarget(t2); if(r2 && r2.zone==='hand' && r2.p===ctx.player && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'hand', r2.index, 'atk', 'モンスターレリーフ');
      });
    });
  },
  afterResolve(){},
  passive:{ onAttackDeclare(ctx){ const a = gameState.pendingAttack; return ctx.zone==='sz' && ctx.card.face==='down' && !!a && a.player===ctx.opponent && API.fieldCards({player:ctx.player, zone:'mz'}).length>0; } }
});

/* ---- 六武派二刀流 ---- */
function u440OnlyRokubu(ctx){
  const mine = API.fieldCards({player:ctx.player, zone:'mz'});
  return mine.length===1 && mine[0].card.face==='up' && mine[0].card.pos==='atk' && String(mine[0].db.n||'').indexOf('六武衆')>=0;
}
function u440FoeCards(p){ return API.fieldCards({player:p, zone:'mz'}).concat(API.fieldCards({player:p, zone:'sz'}), API.fieldCards({player:p, zone:'field'})); }
defineScript('六武派二刀流', {
  type:'trap', priority:2,
  condition(ctx){
    if(!u440OnlyRokubu(ctx)){ ctx.reason = '自分フィールドが表側攻撃表示の「六武衆」1体のみの場合に発動します'; return false; }
    if(u440FoeCards(ctx.opponent).length<2){ ctx.reason = '相手フィールドにカードが2枚以上必要です'; return false; }
    return true;
  },
  resolve(ctx){
    const pool = u440FoeCards(ctx.opponent); if(pool.length<2) return;
    API.selectCard('六武派二刀流：手札に戻す相手のカード（1枚目）', pool, t1=>{
      const r1 = t1 && resolveTarget(t1); if(!r1) return;
      const u1 = r1.card.uid!=null ? r1.card.uid : ensureCardUid(gameState, r1.card);
      const rest = u440FoeCards(ctx.opponent).filter(x=>x.card!==r1.card);
      API.selectCard('六武派二刀流：手札に戻す相手のカード（2枚目）', rest, t2=>{
        const r2 = t2 && resolveTarget(t2); const u2 = r2 ? (r2.card.uid!=null ? r2.card.uid : ensureCardUid(gameState, r2.card)) : null;
        [u1, u2].forEach(u=>{ if(u==null) return; const h = findCardByUid(u); if(h && (h.zone==='mz' || h.zone==='sz' || h.zone==='field')) API.returnToHand(h, '六武派二刀流'); });
      });
    });
  },
  afterResolve(){}
});

/* ---- 生命力吸収魔術 ---- */
function u440DownDef(){ return [0,1].reduce((a,p)=>a.concat(API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='down' && x.card.pos==='def'})), []); }
defineScript('生命力吸収魔術', {
  type:'trap', priority:2,
  condition(ctx){ if(!u440DownDef().length){ ctx.reason = 'フィールドに裏側守備表示のモンスターがいません'; return false; } return true; },
  resolve(ctx){
    u440DownDef().map(x=>x.card.uid!=null?x.card.uid:ensureCardUid(gameState,x.card)).forEach(u=>{
      const h = findCardByUid(u); if(h && h.zone==='mz' && h.card.face==='down') act({type:'FX_SET_STATE', player:h.p, zone:'mz', index:h.index, face:'up', reason:'生命力吸収魔術'});
    });
    const n = [0,1].reduce((s,p)=>s+API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m' && (x.db.st||[]).indexOf('効果')>=0}).length, 0);
    if(n) API.recoverLP(ctx.player, 400*n);
  },
  afterResolve(){}
});

/* ---- A・O・J リサーチャー ---- */
function u440FoeDown(p){ return API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='down' && x.card.pos==='def'}); }
defineUnifiedCardV4('A・O・J リサーチャー', [{
  key:'reveal', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1,
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up') return false;
    if(!API.pileCards(ctx.player, 'hand').length){ ctx.reason = '捨てる手札がありません'; return false; }
    if(!u440FoeDown(ctx.opponent).length){ ctx.reason = '相手フィールドに裏側守備表示のモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('A・O・J リサーチャー：捨てる手札', API.pileCards(ctx.player, 'hand'), t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='hand'){ done(false); return; }
      API.discard(ctx.player, r.index, 'A・O・J リサーチャー（コスト）', {byEffect:false}); done(true);
    });
  },
  operation(ctx){
    const pool = u440FoeDown(ctx.opponent); if(!pool.length) return;
    API.selectCard('A・O・J リサーチャー：表側攻撃表示にする相手のモンスター', pool, t=>{
      const r = t && resolveTarget(t); if(r && r.zone==='mz' && r.p===ctx.opponent && r.card.face==='down')
        act({type:'FX_SET_STATE', player:r.p, zone:'mz', index:r.index, face:'up', pos:'atk', reason:'A・O・J リサーチャー'});
    });
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], countLimit:{n:1, effects:['reveal']}, activateFrom:['mz']});
