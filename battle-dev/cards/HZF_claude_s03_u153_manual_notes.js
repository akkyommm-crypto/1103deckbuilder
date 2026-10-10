/* S03-U153: the three scripts in effect that still handed their effect to the player (API.registerPendingEffect in
   cards/00_generic_core.js). They are redefined here (a later defineScript replaces the earlier one, as 冥府の使者ゴーズ in U50).

   クリボー            ①:相手モンスターが攻撃した場合、そのダメージ計算時にこのカードを手札から捨てて発動できる。
                       その戦闘で発生する自分への戦闘ダメージは0になる。
                       Before: not a quick effect (never offered in DUEL), any battle, the discard after resolution, and a note
                       「受けたLPを戻してください」. Its TESTED status came from tests that only use it as a plain monster.
   ネクロ・ガードナー  ①:相手ターンに墓地のこのカードを除外して発動できる。このターン、相手モンスターの攻撃を1度だけ無効にする。
                       Before: a note 「攻撃を止めてバトルを続行してください」, the banish after resolution.
   打ち出の小槌        ①:自分の手札を任意の数だけデッキに戻してシャッフルする。その後、自分はデッキに戻した数だけドローする。
                       Before: a note. */

/* ---- クリボー ---- */
function u153KuriboBattle(ctx){
  const b = gameState.battle;
  if(!b || b.player!==ctx.opponent) return null;
  if(b.step!=='calc') return null;
  return b;
}
defineScript('クリボー', {
  type:'monster', priority:2, quickEffect:true, activateFrom:['hand'], dsTiming:'calc', damageStepOnly:true,
  condition(ctx){
    if(ctx.zone!=='hand'){ ctx.reason = '手札から発動します'; return false; }
    if(!u153KuriboBattle(ctx)){ ctx.reason = '相手モンスターの攻撃によるダメージ計算時に発動します'; return false; }
    return true;
  },
  cost(ctx, done){ a6HandCost(ctx, done, 'クリボー'); },
  resolve(ctx){
    const b = gameState.battle;
    const me = locateCardAnyV4(ctx.card);
    if(!b || !me) return;
    API.setCardFlag(me, 'u153KuriboAtkUid', b.atkUid!=null ? b.atkUid : null, 'クリボー', {silent:true});
    API.setCardFlag(me, 'u153KuriboTurn', gameState.turn, 'クリボー');
  },
  afterResolve(){},
  /* 「その戦闘で発生する自分への戦闘ダメージは0」: from the GY, only for the marked battle this turn */
  continuous:{ scope:'self', from:['grave','banish'],
    apply(){ return null; },
    battleDamage(info){
      const self = info && info.self;
      if(!self || Number(self.u153KuriboTurn)!==gameState.turn) return info.amount;
      const at = info.atkCard;
      if(!at || self.u153KuriboAtkUid==null || at.uid!==self.u153KuriboAtkUid) return info.amount;
      const loc = locateCardAnyV4(self);
      if(!loc || info.to!==loc.p) return info.amount;
      return 0;
    } }
});

/* ---- ネクロ・ガードナー ---- */
defineScript('ネクロ・ガードナー', {
  type:'monster', priority:2, quickEffect:true, activateFrom:['grave'],
  condition(ctx){
    if(ctx.zone!=='grave'){ ctx.reason = '墓地で発動します'; return false; }
    if(gameState.activePlayer!==ctx.opponent){ ctx.reason = '相手ターンに発動します'; return false; }
    if(gameState.battle){ ctx.reason = 'ダメージステップには発動できません'; return false; }
    return true;
  },
  cost(ctx, done){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone!=='grave'){ done(false); return; }
    API.banish(me, 'ネクロ・ガードナー（コスト）');
    done(true);
  },
  resolve(ctx){
    const a = gameState.pendingAttack;
    if(a && a.player===ctx.opponent){ API.negateAttack('ネクロ・ガードナー'); return; }
    /* no attack now: the next attack of the opponent this turn is negated (engine/1ZS pendingAttackNegatorsS03) */
    const me = locateCardAnyV4(ctx.card);
    if(me) API.setCardFlag(me, 'u153NecroTurn', gameState.turn, 'ネクロ・ガードナー');
  },
  afterResolve(){}
});

/* ---- 打ち出の小槌 ---- */
API.registerChoiceHandler('s03u153.mallet', (answer, x)=>{
  if(!answer || answer.cancelled || !x) return;
  const p = x.player;
  const cards = (answer.cards || []).filter(y=>y && !y.stale && y.card).map(y=>y.card);
  let n = 0;
  cards.forEach(c=>{ const h = locateCardAnyV4(c); if(h && h.p===p && h.zone==='hand'){ API.returnToDeck(h, false, '打ち出の小槌'); n++; } });
  API.shuffle(p);
  if(n) API.draw(p, n);
  logIt(gameState, `打ち出の小槌：${n}枚をデッキに戻し、${n}枚ドロー`);
});
defineScript('打ち出の小槌', {
  type:'spell', priority:1, quickEffect:false,
  condition(){ return true; },
  resolve(ctx){
    const hand = API.pileCards(ctx.player, 'hand', ()=>true);
    if(!hand.length){ API.shuffle(ctx.player); logIt(gameState, '打ち出の小槌：戻す手札が無い（0枚）'); return; }
    API.requestChoice({player:ctx.player, kind:'card', title:'打ち出の小槌：デッキに戻す手札（0枚以上）', candidates:hand, min:0, max:hand.length,
      cancelable:false, resume:{handler:'s03u153.mallet', args:{player:ctx.player}}, meta:{scriptName:'打ち出の小槌'}});
  }
});
