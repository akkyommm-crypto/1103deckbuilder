/* S03-U327: two 「氷結界」 monsters and 墓守の監視者 (carddata texts; 「氷結界」 / 「墓守の」 = a monster whose name contains it).

   氷結界の封魔団   1ターンに1度、手札から「氷結界」と名のついたモンスター1体を墓地へ送って発動できる。このカードがフィールド上に表側表示で存在する限り、次の自分のターンのエンドフェイズ時までお互いに魔法カードを発動できない。
   氷結界の風水師   (Tuner) 手札を1枚捨て、属性を1つ宣言して発動できる。宣言した属性のモンスターはこのカードを攻撃対象に選択できない。この効果はこのカードがフィールド上に表側表示で存在する限り1度しか使用できない。
   墓守の監視者     相手プレイヤーが自らの手札を捨てる効果を含むカードを発動した時、このカードを手札から墓地に送る事で、その発動と効果を無効にしてそのカードを破壊する。

   Notes
   - 封魔団: the Spell lock is a card flag (the turn until which it holds: the end of the controller's next turn) read by the card's own activationLockS03 (as ナチュル・ローズウィップ); it applies to both players while the card is face-up in the Monster Zone.
   - 風水師: the discard is the cost; the Attribute is declared at resolution and stored as a card flag; the restriction is continuous.cannotBeAttackedByS03 (the attacker's current Attribute) while the card is face-up; the once-per-presence limit is a card flag (zone-local: a new copy / a return to the field resets it).
   - 監視者: declared activation response from the hand (engine/1P). 「自らの手札を捨てる効果を含む」 is read from the activated card's text (a heuristic on the carddata wording): a sentence with 手札…捨てる that is not 相手の手札 and not the cost sentence — the old texts state a cost as the first sentence of a longer text (「手札を1枚捨てる。…」) — plus a one-name override for a card whose first sentence is its effect.
   - Left: 氷結界の舞姫 (a recorded ENGINE_GAP: the shown cards are an activation cost and the targets are chosen at activation — P1 resumes only resolution operations), 氷結界の伝道師 (a Level 5+ Special Summon lock for the turn), 氷結界の御庭番 (「cannot be targeted」), 氷結界の破術師, 氷結界の虎将 ライホウ, 魔酔虫 (zone sealing), ロイヤル・ナイト, the Spells. */

function u327Ice(x){ return !!x && x.db && x.db.k==='m' && String(x.db.n||'').indexOf('氷結界')>=0; }
function u327Up(ctx){ return ctx.zone==='mz' && !!ctx.card && ctx.card.face==='up'; }
function u327Main(ctx){ return ctx.player===gameState.activePlayer && (gameState.phase==='main1' || gameState.phase==='main2'); }
function u327HandIce(ctx, except){ return API.pileCards(ctx.player, 'hand', x=>x.card!==except && u327Ice(x)); }

/* ---- 封魔団 ---- */
defineUnifiedCardV4('氷結界の封魔団', [{
  key:'seal-spells', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(!u327Up(ctx)){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(!u327Main(ctx)){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!u327HandIce(ctx).length){ ctx.reason = '手札に「氷結界」モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('氷結界の封魔団：墓地へ送る手札の「氷結界」', u327HandIce(ctx), t=>{
      const r = t && resolveTarget(t);
      if(!r || r.zone!=='hand'){ done(false); return; }
      API.sendHandToGrave(ctx.player, r.index, '氷結界の封魔団（コスト）'); done(true);
    });
  },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') API.setCardFlag(me, 'u327SealUntil', gameState.turn + 2, '氷結界の封魔団'); },
  afterResolve(){}
}], {type:'monster', priority:1, countLimit:{n:1, effects:['seal-spells']},
  activationLockS03:(i)=>{
    if(i.db.k!=='s' || !i.src || i.src.face!=='up') return false;
    const h = findCardByUid(i.src.uid); if(!h || h.zone!=='mz') return false;
    return Number(i.src.u327SealUntil) >= Number(gameState.turn);
  }});

/* ---- 風水師 ---- */
API.registerChoiceHandler('u327.fengshui-declare', (answer, args)=>{
  const picked = (answer && answer.cards || [])[0], attr = picked ? String(picked.value) : '';
  const me = args.uid!=null ? findCardByUid(args.uid) : null;
  if(!attr || !me || me.zone!=='mz' || me.card.face!=='up') return;
  API.setCardFlag(me, 'u327Attr', attr, '氷結界の風水師');
});
defineUnifiedCardV4('氷結界の風水師', [{
  key:'declare-attr', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(!u327Up(ctx)){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(ctx.card.u327Used===true){ ctx.reason = 'この効果はフィールドに表側表示で存在する限り1度しか使用できません'; return false; }
    if(!(API.me(ctx).hand||[]).length){ ctx.reason = '捨てる手札がありません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('氷結界の風水師：捨てる手札', API.pileCards(ctx.player, 'hand'), t=>{
      const r = t && resolveTarget(t), me = locateCardAnyV4(ctx.card);
      if(!r || r.zone!=='hand' || !me || me.zone!=='mz'){ done(false); return; }
      API.setCardFlag(me, 'u327Used', true, '氷結界の風水師', {silent:true});
      API.discard(ctx.player, r.index, '氷結界の風水師（コスト）'); done(true);
    });
  },
  operation(ctx){
    v49P1Open(ctx, {kind:'declare', title:'氷結界の風水師：属性を宣言', candidates:['闇','光','地','水','炎','風','神'].map((v,i)=>({key:'a'+i,label:v,value:v})), min:1, max:1},
      'u327.fengshui-declare', {uid:ctx.card.uid}, false);
  },
  afterResolve(){}
}], {type:'monster', priority:1,
  continuous:{ scope:'self', from:['mz'], apply(){ return null; },
    cannotBeAttackedByS03(target, attacker, self){
      return !!self && target===self && self.face==='up' && !!self.u327Attr && currentAttributeV17(attacker)===self.u327Attr;
    } }});

/* ---- 墓守の監視者 ---- */
const U327_DISCARD_EFFECT = ['インフェルニティ・インフェルノ'];   /* cards whose first sentence is an EFFECT discard (the heuristic below would read it as a cost) */
function u327DiscardsOwnHand(db){
  if(db && U327_DISCARD_EFFECT.indexOf(db.n)>=0) return true;
  /* the old carddata states a discard COST as the first sentence of a longer text (「手札を1枚捨てる。…」); a discard inside an effect sentence (…その後手札を2枚選択して捨てる / その手札を全て捨てる) counts */
  const sents = String(db && db.e || '').split(/[。\n]+/).map(x=>x.trim()).filter(Boolean);
  return sents.some((x, i)=>{
    if(!/手札[^、]*捨てる/.test(x) || /相手の手札/.test(x)) return false;
    if(i===0 && sents.length>1 && /^(自分の)?手札(を|から)[^、]*捨てる$/.test(x)) return false;
    return !/捨てて発動/.test(x);
  });
}
function u327WatchEvent(ctx){
  const e = ctx.event;
  if(!e || e.player!==ctx.opponent || e.cardId==null || (e.kind!=='spell' && e.kind!=='trap' && e.kind!=='monster')) return false;
  return u327DiscardsOwnHand(CARD_DB[e.cardId]);
}
defineUnifiedCardV4('墓守の監視者', [{
  key:'negate-discard', type:EFFECT_TYPE.QUICK, range:LOCATION.HAND, speed:2, events:['onActivateSuccess'],
  condition(ctx){
    if(ctx.zone!=='hand'){ ctx.reason = '手札から発動します'; return false; }
    if(!u327WatchEvent(ctx)){ ctx.reason = '相手が自らの手札を捨てる効果を含むカードを発動した時に発動します'; return false; }
    return true;
  },
  cost(ctx, done){ const i = (API.me(ctx).hand||[]).indexOf(ctx.card); if(i<0){ done(false); return; } API.sendHandToGrave(ctx.player, i, '墓守の監視者（コスト）'); done(true); },
  operation(ctx){ const e = ctx.event; if(e && e.chainId!=null) API.negateChainLink(e.chainId, 'activation', '墓守の監視者', true); },
  afterResolve(){}
}], {type:'monster', priority:2, quickEffect:true, activateFrom:['hand'], timing:['free','chain'],
  passive:{ onActivateSuccess(ctx){ return ctx.zone==='hand' && u327WatchEvent(ctx); } }});
declareActivationResponseS03(['墓守の監視者']);
