/* S03-U420: エーリアン・スカル, ヴォルカニック・クイーン, トーチ・ゴーレム, 溶岩魔神ラヴァ・ゴーレム (NOT_STARTED cards: Special Summon onto the OPPONENT's field, carddata texts).

   エーリアン・スカル        相手フィールド上のレベル3以下のモンスター1体をリリースし、このカードを手札から相手フィールド上に特殊召喚できる。この方法で特殊召喚する場合、このターン自分は通常召喚できず、特殊召喚時にこのカードにAカウンターを1つ置く。（Aカウンターが乗ったモンスターの「エーリアン」との戦闘時のダメージ計算時のみ、Aカウンター1つにつき攻撃力・守備力が300ダウン）
   ヴォルカニック・クイーン  このカードは通常召喚できない。相手フィールド上のモンスター1体をリリースし、手札から相手フィールド上に特殊召喚できる。1ターンに1度、このカード以外の自分フィールド上のカード1枚を墓地へ送る事で、相手ライフに1000ポイントダメージを与える。また、自分のエンドフェイズ時にこのカード以外の自分フィールド上のモンスター1体をリリースするか、自分は1000ポイントダメージを受ける。このカードを特殊召喚するターン、自分は通常召喚できない。
   トーチ・ゴーレム          このカードは通常召喚できない。自分フィールドに「トーチトークン」（悪魔族・闇・星1・攻/守0）2体を攻撃表示で特殊召喚する事によって相手フィールドに特殊召喚できる。このカードを特殊召喚するターン、自分は通常召喚できない。
   溶岩魔神ラヴァ・ゴーレム  このカードは通常召喚できない。相手フィールドのモンスター2体をリリースした場合に相手フィールドに特殊召喚できる。このカードを特殊召喚するターン、自分は通常召喚できない。①：自分スタンバイフェイズに発動する。自分は1000ダメージを受ける。

   Notes
   - NEW engine (engine/40, S03-U420): summonProcedure.toFoeS03:true Special Summons the card onto the OPPONENT's field (FX_SPECIAL_SUMMON player = the opponent, fromPlayer = the summoner; strictSummonProcedureLegality checks the opponent's free Monster Zone unless freesFoeZoneS03 says the cost releases an opponent monster; afterSummonS03 / the onSpecialSummon event use the field the card landed on).
   - 「自分」 in the effects of a card standing on the opponent's field is its CONTROLLER (the opponent of the summoner): クイーン's burn / End Phase upkeep and ラヴァ・ゴーレム's 1000 damage hit that controller.
   - The Normal Summon ban of the turn is banSummonS03(…, ['normal']) paid in the procedure cost. スカル stamps the A Counter in afterSummonS03 (ctx.procedureDataS03 = {} in the cost). トーチ・ゴーレム creates the two 「トーチトークン」 (defineTokenSpecV11) on my field as its cost. */

function u420Foe(ctx){ return ctx.opponent; }
function u420Passive(extra){
  return Object.assign({type:'monster', priority:1, timing:['free'],
    condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; }, resolve(){}, afterResolve(){}}, extra || {});
}
function u420NoNormal(p, label){ banSummonS03(p, gameState.turn, gameState.turn, ['normal'], {}, label); }
function u420FoeMons(ctx, filter){ return API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.db.k==='m' && (!filter || filter(x))}); }

/* ---- エーリアン・スカル ---- */
function u420Low(ctx){ return u420FoeMons(ctx, x=>x.card.face==='up' && Number(x.db.lv)<=3); }
defineScript('エーリアン・スカル', u420Passive({continuous:alienContinuousS03(true),
  summonProcedure:{ from:['hand'], positions:['atk','def'], toFoeS03:true, freesFoeZoneS03:true,
    condition(ctx){ if(!u420Low(ctx).length){ ctx.reason = '相手フィールドにレベル3以下のモンスターがいません'; return false; } return true; },
    cost(ctx, done){
      const pool = u420Low(ctx); if(!pool.length){ done(false); return; }
      API.selectCard('エーリアン・スカル：リリースする相手のレベル3以下のモンスター', pool, t=>{
        const r = t && resolveTarget(t); if(!r || r.zone!=='mz' || r.p!==ctx.opponent){ done(false); return; }
        API.sendToGrave(r, 'エーリアン・スカル（リリース）'); u420NoNormal(ctx.player, 'エーリアン・スカル'); ctx.procedureDataS03 = {}; done(true);
      });
    },
    afterSummonS03(h){ if(h && h.zone==='mz') API.addCounter(h, 'A', 1); } } }));

/* ---- ヴォルカニック・クイーン ---- */
function u420QueenOthers(ctx){ return [].concat(API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card!==ctx.card}), API.fieldCards({player:ctx.player, zone:'sz'}), API.fieldCards({player:ctx.player, zone:'field'})); }
function u420QueenMons(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card!==ctx.card && x.db.k==='m'}); }
defineUnifiedCardV4('ヴォルカニック・クイーン', [{
  key:'burn', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(!u419Main(ctx)){ ctx.reason = '自分のメインフェイズにフィールドに表側表示で存在する必要があります'; return false; }
    if(!u420QueenOthers(ctx).length){ ctx.reason = '墓地へ送れる自分フィールドのカードがありません'; return false; }
    return true;
  },
  cost(ctx, done){
    const pool = u420QueenOthers(ctx); if(!pool.length){ done(false); return; }
    API.selectCard('ヴォルカニック・クイーン：墓地へ送る自分フィールドのカード', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.p!==ctx.player){ done(false); return; }
      API.sendToGrave(r, 'ヴォルカニック・クイーン（コスト）'); done(true);
    });
  },
  operation(ctx){ API.damageLP(ctx.opponent, 1000, 'ヴォルカニック・クイーン'); },
  afterResolve(){}
}, {
  key:'upkeep', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onEndPhase'], forced:true,
  condition(ctx){ return u418Face(ctx) && ctx.player===gameState.activePlayer; },
  operation(ctx){
    const pay = ()=>API.damageLP(ctx.player, 1000, 'ヴォルカニック・クイーン');
    const pool = u420QueenMons(ctx); if(!pool.length){ pay(); return; }
    API.confirm('ヴォルカニック・クイーン', 'このカード以外の自分のモンスター1体をリリースしますか？（いいえ＝1000ダメージを受ける）', ()=>{
      API.selectCard('ヴォルカニック・クイーン：リリースするモンスター', u420QueenMons(ctx), t=>{
        const r = t && resolveTarget(t); if(r && r.zone==='mz' && r.p===ctx.player) API.sendToGrave(r, 'ヴォルカニック・クイーン（リリース）'); else pay();
      });
    }, pay);
  },
  afterResolve(){}
}], u420Passive({countLimit:{n:1, effects:['burn']}, cannotNormalSummon:true, forced:false,
  summonProcedure:{ from:['hand'], positions:['atk','def'], toFoeS03:true, freesFoeZoneS03:true,
    condition(ctx){ if(!u420FoeMons(ctx).length){ ctx.reason = '相手フィールドにモンスターがいません'; return false; } return true; },
    cost(ctx, done){
      const pool = u420FoeMons(ctx); if(!pool.length){ done(false); return; }
      API.selectCard('ヴォルカニック・クイーン：リリースする相手のモンスター', pool, t=>{
        const r = t && resolveTarget(t); if(!r || r.zone!=='mz' || r.p!==ctx.opponent){ done(false); return; }
        API.sendToGrave(r, 'ヴォルカニック・クイーン（リリース）'); u420NoNormal(ctx.player, 'ヴォルカニック・クイーン'); done(true);
      });
    } },
  passive:{ onEndPhase(ctx){ return u418Face(ctx) && ctx.player===gameState.activePlayer; } } }));

/* ---- トーチ・ゴーレム ---- */
defineTokenSpecV11('トーチトークン', {atk:0, def:0, lv:1, ra:'悪魔', at:'闇', pos:'atk'});
defineScript('トーチ・ゴーレム', u420Passive({cannotNormalSummon:true,
  summonProcedure:{ from:['hand'], positions:['atk','def'], toFoeS03:true,
    condition(ctx){ if(Math.max(0, ZONE_LIMITS.mz - gameState.players[ctx.player].mz.length)<2){ ctx.reason = '自分のモンスターゾーンに空きが2つありません'; return false; } return true; },
    cost(ctx, done){ const uids = API.createTokens(ctx.player, 'トーチトークン', 2) || []; if(uids.length<2){ done(false); return; } u420NoNormal(ctx.player, 'トーチ・ゴーレム'); done(true); } } }));

/* ---- 溶岩魔神ラヴァ・ゴーレム ---- */
defineUnifiedCardV4('溶岩魔神ラヴァ・ゴーレム', [{
  key:'upkeep', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onStandbyPhase'], forced:true,
  condition(ctx){ return u418Face(ctx) && ctx.player===gameState.activePlayer && gameState.phase==='standby'; },
  operation(ctx){ API.damageLP(ctx.player, 1000, '溶岩魔神ラヴァ・ゴーレム'); },
  afterResolve(){}
}], u420Passive({cannotNormalSummon:true, forced:false,
  summonProcedure:{ from:['hand'], positions:['atk','def'], toFoeS03:true, freesFoeZoneS03:true,
    condition(ctx){ if(u420FoeMons(ctx).length<2){ ctx.reason = '相手フィールドにモンスターが2体いません'; return false; } return true; },
    cost(ctx, done){ u342PickN('溶岩魔神ラヴァ・ゴーレム：リリースする相手のモンスター', ctx, c=>u420FoeMons(c), 2, h=>API.sendToGrave(h, '溶岩魔神ラヴァ・ゴーレム（リリース）'), ok=>{ if(ok) u420NoNormal(ctx.player, '溶岩魔神ラヴァ・ゴーレム'); done(ok); }); } },
  passive:{ onStandbyPhase(ctx){ return u418Face(ctx) && ctx.player===gameState.activePlayer && gameState.phase==='standby'; } } }));
