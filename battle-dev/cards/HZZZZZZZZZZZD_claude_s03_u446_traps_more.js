/* S03-U446: 魔の取引, 闇霊術－「欲」, 硫酸のたまった落とし穴, 発条の巻き戻し, 念導力 (stale ENGINE_GAP Traps, carddata texts).

   魔の取引                    相手が魔法カードを発動した時、1000ライフポイントを払って発動できる。相手の手札をランダムに1枚捨てる。
   闇霊術－「欲」              自分フィールド上の闇属性モンスター1体をリリースして発動できる。相手は手札から魔法カード1枚を見せてこのカードの効果を無効にできる。見せなかった場合、自分はデッキからカードを2枚ドローする。
   硫酸のたまった落とし穴      ①：フィールドの裏側守備表示モンスター1体を対象として発動できる。そのモンスターを表側守備表示にし、守備力が2000以下の場合は破壊する。守備力が2000より高い場合は裏側守備表示に戻す。
   発条の巻き戻し              自分フィールド上に表側表示で存在するレベル4以下の「ゼンマイ」と名のついたモンスター1体を選択して手札に戻し、戻したモンスターと同じレベルの「ゼンマイ」と名のついたモンスター1体を手札から特殊召喚する。
   念導力                      自分フィールド上に表側表示で存在するサイキック族モンスターが、相手モンスターの攻撃によって破壊された場合に発動する事ができる。その時に攻撃を行った相手モンスター1体を破壊し、その攻撃力分だけ自分のライフポイントを回復する。

   Notes
   - 魔の取引 / 闇霊術: マジック・ドレイン pattern (S03-U? C5: d2FoeSpell = the chain link's event {player: opponent, kind 'spell'}, onActivateSuccess on the Set card, cost paid with API.payCost); 魔の取引 discards duelRandomInt(hand) at resolution; 闇霊術's opponent ChoiceRequest (min 0, hand Spells) - showing one (not discarding it) negates the effect, otherwise I draw 2.
   - 硫酸のたまった落とし穴: the face-down Defense target is turned face-up without its Flip effect (FX_SET_STATE) and is destroyed when its current DEF is 2000 or less, otherwise it is turned back face-down Defense.
   - キャトルミューティレーション was already implemented and tested by S03-U280 (cards/HZZZZZH, test_s03_u280_gap5.js: position chosen by the summoning player, the returned Beast chosen at resolution) - only its stale ENGINE_GAP override is removed here. 発条の巻き戻し: the monster of the field returns to the hand, then a monster of the hand with the same Level (the returned one included) is chosen and Special Summoned in Attack Position.
   - 念導力: a Set Trap on a face-up Psychic monster of mine destroyed by battle as the defender (graveInfo.battle, from 'mz', face-up, race サイキック); the attacker is read from gameState.lastBattle (it must still be on the field); destroyed, and I recover its ATK. */

/* ---- 魔の取引 ---- */
defineScript('魔の取引', {
  type:'trap', priority:3,
  condition(ctx){
    if(!d2FoeSpell(ctx)){ ctx.reason = '相手が魔法カードを発動した時に発動します'; return false; }
    if(API.me(ctx).lp<=1000){ ctx.reason = 'LPが足りません'; return false; }
    return true;
  },
  cost(ctx, done){ API.payCost(ctx.player, 1000, '魔の取引'); done(true); },
  resolve(ctx){ const h = gameState.players[ctx.opponent].hand; if(h.length) API.discard(ctx.opponent, duelRandomInt(h.length), '魔の取引'); },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){ return ctx.zone==='sz' && d2FoeSpell(ctx) && API.me(ctx).lp>1000; } }
});

/* ---- 闇霊術－「欲」 ---- */
API.registerChoiceHandler('s03u446.greed', (answer, args)=>{
  if(u441Picks(answer).length) { API.log('闇霊術－「欲」：相手が魔法カードを見せて効果を無効にした'); return; }
  API.draw(args.player, 2, '闇霊術－「欲」');
});
function u446Dark(p){ return API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m' && x.db.at==='闇'}); }
defineScript('闇霊術－「欲」', {
  type:'trap', priority:2,
  condition(ctx){ if(!u446Dark(ctx.player).length){ ctx.reason = 'リリースする闇属性モンスターがいません'; return false; } return true; },
  cost(ctx, done){
    const pool = u446Dark(ctx.player); if(!pool.length){ done(false); return; }
    API.selectCard('闇霊術－「欲」：リリースする闇属性モンスター', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='mz'){ done(false); return; }
      API.sendToGrave(r, '闇霊術－「欲」（リリース）'); done(true);
    });
  },
  resolve(ctx){
    const spells = API.pileCards(ctx.opponent, 'hand', x=>x.db.k==='s'); spells.forEach(x=>ensureCardUid(gameState, x.card));
    if(!spells.length){ API.draw(ctx.player, 2, '闇霊術－「欲」'); return; }
    API.requestChoice({kind:'card', title:'闇霊術－「欲」：手札の魔法カードを見せて効果を無効にできます（見せない場合は選ばない）', candidates:spells, min:0, max:1, player:ctx.opponent, cancelable:false, resume:{handler:'s03u446.greed', args:{player:ctx.player}}});
  },
  afterResolve(){}
});

/* ---- 硫酸のたまった落とし穴 ---- */
function u446DownDef(){ return [0,1].reduce((a,p)=>a.concat(API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='down' && x.card.pos==='def'})), []); }
defineScript('硫酸のたまった落とし穴', {
  type:'trap', priority:2, targets:true,
  condition(ctx){ if(!u446DownDef().length){ ctx.reason = 'フィールドに裏側守備表示のモンスターがいません'; return false; } return true; },
  selectTargets(ctx, done){ API.selectCard('硫酸のたまった落とし穴：対象の裏側守備表示モンスター', u446DownDef(), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(!r || r.zone!=='mz' || r.card.face!=='down') return;
    const uid = ensureCardUid(gameState, r.card);
    act({type:'FX_SET_STATE', player:r.p, zone:'mz', index:r.index, face:'up', pos:'def', reason:'硫酸のたまった落とし穴'});
    const h = findCardByUid(uid); if(!h || h.zone!=='mz') return;
    if(curDEF(h.card)<=2000) API.destroy(h, '硫酸のたまった落とし穴');
    else act({type:'FX_SET_STATE', player:h.p, zone:'mz', index:h.index, face:'down', pos:'def', reason:'硫酸のたまった落とし穴'});
  },
  afterResolve(){}
});

/* ---- キャトルミューティレーション / 発条の巻き戻し ---- */
function u446Swap(name, fieldPred, handPred){
  defineScript(name, {
    type:'trap', priority:2,
    condition(ctx){
      if(!API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m' && fieldPred(x.db)}).length){ ctx.reason = '自分フィールドに対象のモンスターがいません'; return false; }
      return true;
    },
    resolve(ctx){
      const own = API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m' && fieldPred(x.db)}); if(!own.length) return;
      API.selectCard(name+'：手札に戻すモンスター', own, t=>{
        const r = t && resolveTarget(t); if(!r || r.zone!=='mz' || r.p!==ctx.player) return;
        const lv = Number(dbOf(r.card).lv), uid = ensureCardUid(gameState, r.card);
        API.returnToHand(r, name);
        const pool = API.pileCards(ctx.player, 'hand', x=>x.db.k==='m' && Number(x.db.lv)===lv && handPred(x.db) && canEffectSpecialSummonS03(x.card, 'hand', name)); if(!pool.length || !hasMonsterZoneSpace(ctx.player)) return;
        API.selectCard(name+'：特殊召喚する同じレベルのモンスター', pool, t2=>{
          const r2 = t2 && resolveTarget(t2); if(r2 && r2.zone==='hand' && r2.p===ctx.player && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'hand', r2.index, 'atk', name);
        });
      });
    },
    afterResolve(){}
  });
}
u446Swap('発条の巻き戻し', db=>String(db.n||'').indexOf('ゼンマイ')>=0 && Number(db.lv)<=4, db=>String(db.n||'').indexOf('ゼンマイ')>=0);

/* ---- 念導力 ---- */
function u446Psychic(ctx){
  const ev = ctx.event || {}; if(ev.uid==null) return null;
  const h = findCardByUid(ev.uid); if(!h || h.zone!=='grave' || h.p!==ctx.player) return null;
  const g = h.card.graveInfo; if(!g || g.from!=='mz' || !g.battle || g.face!=='up' || Number(g.turn)!==Number(gameState.turn) || dbOf(h.card).ra!=='サイキック') return null;
  const b = gameState.lastBattle; if(!b || b.defenderUidV6!==h.card.uid || b.attackerUidV6==null) return null;
  const a = findCardByUid(b.attackerUidV6); return (a && a.zone==='mz' && a.p===ctx.opponent) ? a : null;
}
defineScript('念導力', {
  type:'trap', priority:2,
  condition(ctx){ if(!u446Psychic(ctx)){ ctx.reason = '自分のサイキック族モンスターが相手モンスターの攻撃によって破壊された時に発動します'; return false; } return true; },
  resolve(ctx){ const a = u446Psychic(ctx); if(!a) return; const atk = Math.max(0, curATK(a.card)); API.destroy(a, '念導力'); API.recoverLP(ctx.player, atk); },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){ return ctx.zone==='sz' && ctx.card.face==='down' && !!u446Psychic(ctx); } }
});
