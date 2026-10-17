/* S03-U402: 選ばれし者, 荒野の大竜巻, 竜操術 (NOT_STARTED cards, carddata texts).

   選ばれし者    （通常魔法）自分の手札から、モンスターカード1枚とモンスター以外のカード2枚を選択し、相手はその中からランダムに1枚を選択する。相手が選択したカードがモンスターだった場合、そのモンスターを自分フィールド上に特殊召喚し、残りのカードは墓地へ送る。違った場合、選択した3枚を墓地へ送る。
   荒野の大竜巻  （通常罠）①:魔法&罠ゾーンの表側表示のカード1枚を対象として発動できる。その表側表示のカードを破壊する。その後、破壊されたカードのコントローラーは手札から魔法・罠カード1枚をセットできる。②:セットされたこのカードが破壊され墓地へ送られた場合、フィールドの表側表示のカード1枚を対象として発動する。その表側表示のカードを破壊する。
   竜操術        （永続魔法）「ドラグニティ」と名のついたモンスターを装備した、自分フィールド上に存在するモンスターの攻撃力は500ポイントアップする。また、1ターンに1度、手札から「ドラグニティ」と名のついたドラゴン族モンスター1体を装備カード扱いとして自分フィールド上に表側表示で存在するモンスター1体に装備する事ができる。

   Notes
   - 選ばれし者: the three hand cards are chosen one after another (a monster, then two non-monsters, selectCard); the opponent's blind pick is duelRandomInt(3) (journaled RNG); a monster is Special Summoned when it can be (canEffectSpecialSummonS03), otherwise it goes to the Graveyard with the rest.
   - 荒野の大竜巻: ① targets a face-up Spell / Trap Zone card of either side (not itself), destroys it and offers the destroyed card's controller an optional Set of a Spell / Trap from the hand (act SET_ST for that player, Field Spells to the Field Zone); ② is a Graveyard trigger when the card was Set (graveInfo.face 'down') and destroyed on the field: a face-up card on the field is targeted and destroyed.
   - 竜操術: continuous apply +500 ATK on my monsters that carry a 「ドラグニティ」 monster as a monster-Equip (host.equippedBy -> v46MonsterEquip cards); once-per-turn ignition equipping a 「ドラグニティ」 Dragon of the hand with API.equipMonsterFromHand - NEW engine API.equipMonsterFromHand (S03-U402: FX_MONSTER_EQUIP_V46 with fromHandS03) equips straight from the hand without a Special Summon. */

/* ---- 選ばれし者 ---- */
function u402Mons(ctx){ return API.pileCards(ctx.player, 'hand', x=>x.db.k==='m'); }
function u402Others(ctx){ return API.pileCards(ctx.player, 'hand', x=>x.db.k!=='m' && x.card!==ctx.card); }
function u402Finish(ctx, monUid, others){
  const p = ctx.player, all = [monUid].concat(others);
  const pick = all[duelRandomInt(all.length)];
  API.log(`選ばれし者：相手が選んだのは${pick===monUid ? 'モンスターカード' : 'モンスター以外のカード'}`);
  const toGrave = (uids)=>{
    uids.map(u=>findCardByUid(u)).filter(h=>h && h.zone==='hand' && h.p===p).sort((x,y)=>y.index-x.index).forEach(h=>API.sendHandToGrave(p, h.index, '選ばれし者'));
  };
  if(pick===monUid){
    const h = findCardByUid(monUid);
    if(h && h.zone==='hand' && hasMonsterZoneSpace(p) && canEffectSpecialSummonS03(h.card, 'hand', '選ばれし者')) API.specialSummon(p, 'hand', h.index, 'atk', '選ばれし者');
    else toGrave([monUid]);
    toGrave(others);
  } else toGrave(all);
}
defineScript('選ばれし者', {
  type:'spell', priority:1, targets:false, includesSpecialSummon:true,
  condition(ctx){
    if(!u402Mons(ctx).length){ ctx.reason = '手札にモンスターカードがありません'; return false; }
    if(u402Others(ctx).length<2){ ctx.reason = '手札にモンスター以外のカードが2枚必要です'; return false; }
    return true;
  },
  resolve(ctx){
    API.selectCard('選ばれし者：選択する手札のモンスターカード', u402Mons(ctx), t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='hand') return;
      const monUid = ensureCardUid(gameState, r.card), others = [];
      u342PickN('選ばれし者：選択する手札のモンスター以外のカード', ctx, u402Others, 2, h=>others.push(ensureCardUid(gameState, h.card)), ok=>{ if(ok) u402Finish(ctx, monUid, others); });
    });
  },
  afterResolve(){}
});

/* ---- 荒野の大竜巻 ---- */
function u402Targets(ctx){
  return API.fieldCards({zone:'sz', filter:x=>x.card.face==='up' && x.card!==ctx.card});
}
function u402Gone(ctx){
  const e = ctx.event || {}, g = ctx.card.graveInfo;
  return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && !!g && g.from==='sz' && !!g.byDestroy && g.face==='down' && Number(g.turn)===Number(gameState.turn);
}
function u402FieldFaceUp(){ return API.fieldCards({filter:x=>x.card.face==='up'}); }
defineUnifiedCardV4('荒野の大竜巻', [{
  key:'tornado', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, targetRange:LOCATION.SZONE, targetSide:'both', speed:2, events:['activate'],
  condition(ctx){ if(!u402Targets(ctx).length){ ctx.reason = '魔法&罠ゾーンに表側表示のカードがありません'; return false; } return true; },
  target(ctx, done){ API.selectCard('荒野の大竜巻：破壊する表側表示の魔法・罠カード', u402Targets(ctx), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(!r || r.zone!=='sz' || r.card.face!=='up') return;
    const q = r.p;
    API.destroy(r, '荒野の大竜巻');
    const pool = API.pileCards(q, 'hand', x=>x.db.k==='s' || x.db.k==='t');
    if(!pool.length) return;
    const doSet = ()=>{
      API.selectCard('荒野の大竜巻：セットする手札の魔法・罠カード', pool, t2=>{
        const h = t2 && resolveTarget(t2); if(!h || h.zone!=='hand' || h.p!==q) return;
        act({type:'SET_ST', player:q, handIndex:h.index, toField:dbOf(h.card).sub==='フィールド'});
      });
    };
    API.confirm('荒野の大竜巻', `${q===ctx.player ? '自分' : '相手'}は手札の魔法・罠カードを1枚セットしますか？`, doSet, ()=>{});
  },
  afterResolve(){}
}, {
  key:'revenge', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave','onDestroy'], forced:true, targetRange:LOCATION.MZONE, targetSide:'both',
  condition(ctx){ return u402Gone(ctx) && u402FieldFaceUp().length>0; },
  target(ctx, done){ API.selectCard('荒野の大竜巻：破壊する表側表示のカード', u402FieldFaceUp(), t=>done([t])); },
  operation(ctx){ const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t); if(r && r.card.face==='up') API.destroy(r, '荒野の大竜巻'); },
  afterResolve(){}
}], {type:'trap', priority:2, targets:true, activateFrom:['sz','grave'],
  passive:{ onSendToGrave(ctx){ return u402Gone(ctx) && u402FieldFaceUp().length>0; }, onDestroy(ctx){ return u402Gone(ctx) && u402FieldFaceUp().length>0; } } });

/* ---- 竜操術 ---- */
function u402DragunityEquips(host){
  return (Array.isArray(host.equippedBy) ? host.equippedBy : []).map(u=>findCardByUid(u)).filter(h=>h && h.card && h.card.v46MonsterEquip===true && isSetCardV4(dbOf(h.card), SETCODE.DRAGUNITY));
}
function u402Hand(ctx){ return API.pileCards(ctx.player, 'hand', x=>x.db.k==='m' && x.db.ra==='ドラゴン' && isSetCardV4(x.db, SETCODE.DRAGUNITY)); }
function u402Ready(ctx){ return ctx.zone==='sz' && ctx.card.face==='up' && !ctx.card.activationPending; }
defineUnifiedCardV4('竜操術', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:1, events:['activate'],
  condition(ctx){ const h = locateCardAnyV4(ctx.card); return !(h && h.zone==='sz' && ctx.card.face==='up'); }, operation(){}, afterResolve(){}
}, {
  key:'equip', type:EFFECT_TYPE.IGNITION, range:LOCATION.SZONE, speed:1, events:['activate'],
  condition(ctx){
    if(!u402Ready(ctx)){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!u402Hand(ctx).length){ ctx.reason = '手札に「ドラグニティ」ドラゴン族モンスターがいません'; return false; }
    if(!API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up'}).length){ ctx.reason = '装備する自分のモンスターがいません'; return false; }
    return true;
  },
  operation(ctx){
    API.selectCard('竜操術：装備する手札の「ドラグニティ」', u402Hand(ctx), t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='hand') return;
      const uid = ensureCardUid(gameState, r.card);
      API.selectCard('竜操術：装備されるモンスター', API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up'}), t2=>{
        const host = t2 && resolveTarget(t2), cur = findCardByUid(uid); if(!host || host.zone!=='mz' || !cur || cur.zone!=='hand') return;
        const hh = findCardByUid(ensureCardUid(gameState, host.card)); if(!hh || hh.zone!=='mz') return;
        API.equipMonsterFromHand(ctx.player, cur.index, hh, '竜操術');
      });
    });
  },
  afterResolve(){}
}], {type:'spell', priority:1, countLimit:{n:1, effects:['equip']}, timing:['mainPhase'], fieldIgnition:true, activateFrom:['sz'],
  continuous:{ scope:'ownMonsters', from:['sz'], apply(card, self){ return (self && self.face==='up' && card && u402DragunityEquips(card).length) ? {atk:500} : null; } } });
