/* S03-U246: 「憑依装着」 (2011 texts) — アウス, ウィン, エリア, ヒータ (ENGINE_GAP: 「手札・デッキから特殊召喚できる」 had no Deck entry point).
   The engine already offers a summon procedure from a pile (engine/70 pileDuelActionsV370: 「特殊召喚」 for a Deck card whose
   summonProcedure.from includes 'deck'; strictSummonProcedureLegality / runSummonProcedure take the zone). So:
   ① summonProcedure {from:['hand','deck']}; cost: send 1 face-up 「X霊使いY」 and 1 other face-up monster of the Attribute to the GY.
   ② 「①の方法で特殊召喚したこのカードが守備表示モンスターを攻撃した場合…貫通」 — continuous piercingDamage while card.specialSummonKind is
      'procedure' (zone-local, written by the procedure's FX_SPECIAL_SUMMON). */
function possessedS03(name, charmer, attr){
  const charmers = ctx=>API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && x.db.n===charmer});
  const others = (ctx, notUid)=>API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && x.card.uid!==notUid
    && (typeof currentAttributeV17==='function' ? currentAttributeV17(x.card) : x.db.at)===attr});
  const usable = ctx=>charmers(ctx).some(c=>others(ctx, c.card.uid).length>0);
  defineScript(name, {
    type:'monster', priority:1,
    summonProcedure:{
      from:['hand','deck'], positions:['atk','def'],
      condition(ctx){ if(!usable(ctx)){ ctx.reason = `自分フィールドの表側表示の「${charmer}」と${attr}属性モンスター1体が必要です`; return false; } return true; },
      cost(ctx, done){
        const cs = charmers(ctx).filter(c=>others(ctx, c.card.uid).length>0);
        API.selectCard(`${name}：墓地へ送る「${charmer}」`, cs, t=>{
          const a = resolveTarget(t), au = a && a.card && a.card.uid;
          if(au==null){ done(false); return; }
          API.selectCard(`${name}：墓地へ送る${attr}属性モンスター`, others(ctx, au), u=>{
            const b = resolveTarget(u), bu = b && b.card && b.card.uid;
            const ha = findCardByUid(au), hb = bu!=null ? findCardByUid(bu) : null;
            if(!ha || ha.zone!=='mz' || !hb || hb.zone!=='mz'){ done(false); return; }
            API.sendToGrave(ha, `${name}（特殊召喚の手順）`);
            const hb2 = findCardByUid(bu); if(hb2 && hb2.zone==='mz') API.sendToGrave(hb2, `${name}（特殊召喚の手順）`);
            done(true);
          });
        });
      }
    },
    condition(ctx){ ctx.reason = '起動効果はありません（特殊召喚の手順と永続効果）'; return false; },
    resolve(){}, afterResolve(){},
    continuous:{scope:'self', from:['mz'], apply(){ return null; },
      piercingDamage(info){ const s = info && info.self; return (s && info.atkCard===s && s.face==='up' && s.specialSummonKind==='procedure') ? info.amount : 0; }}
  });
}
possessedS03('憑依装着－アウス', '地霊使いアウス', '地');
possessedS03('憑依装着－ウィン', '風霊使いウィン', '風');
possessedS03('憑依装着－エリア', '水霊使いエリア', '水');
possessedS03('憑依装着－ヒータ', '火霊使いヒータ', '炎');
