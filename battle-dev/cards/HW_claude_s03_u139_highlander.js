/* S03-U139: 天刑王 ブラック・ハイランダー (NOT_STARTED; fixed Dark list x1)
   悪魔族チューナー＋チューナー以外の悪魔族モンスター1体以上
   このカードがフィールド上に表側表示で存在する限り、お互いにシンクロ召喚をする事ができない。
   1ターンに1度、装備カードを装備した相手モンスター1体を選択して発動する事ができる。
   選択したモンスターに装備された装備カードを全て破壊し、破壊した数×400ポイントダメージを相手ライフに与える。
   - the Synchro lock: engine/1ZN (declareSynchroSummonLockS03);
   - the ignition: once per turn, targets 1 opponent monster with at least one Equip Card; destroys every Equip Card on it at
     resolution (whoever controls them) and inflicts 400 × the number actually destroyed. */
declareSynchroSummonLockS03('天刑王 ブラック・ハイランダー');
function highlanderTargetsS03(ctx){
  return API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up' && API.equipCount(x)>0});
}
defineUnifiedCardV4('天刑王 ブラック・ハイランダー',[{
  key:'break-equips', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz'){ ctx.reason = 'フィールドで発動します'; return false; }
    if(!highlanderTargetsS03(ctx).length){ ctx.reason = '装備カードを装備した相手モンスターがいません'; return false; }
    return true;
  },
  target(ctx, done){ API.selectCard('天刑王 ブラック・ハイランダー：装備カードを破壊する相手モンスター', highlanderTargetsS03(ctx), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone!=='mz') return;
    const eqs = API.equipsOn(r).map(e=>e.card), mark = API.destroyMarkS03(), uids = eqs.map(c=>ensureCardUid(gameState, c));
    eqs.forEach(c=>{ const h = locateCardAnyV4(c); if(h && h.zone==='sz') API.destroy(h, '天刑王 ブラック・ハイランダー'); });
    /* S03-U294: 400 per Equip Card actually destroyed, after any substitute decision (engine/1ZZO) */
    API.afterDestroyS03('s03u294.highlander', {mark, uids, to:ctx.opponent});
  },
  afterResolve(){}
}],{type:'synchro', priority:1, targets:true, timing:['mainPhase'], countLimit:{n:1, effects:['break-equips']}});
registerDestroyAfterS03('s03u294.highlander', a=>{ const n = API.destroyedSinceS03(a.mark, a.uids).length; if(n) API.damageLP(a.to, n*400); });
