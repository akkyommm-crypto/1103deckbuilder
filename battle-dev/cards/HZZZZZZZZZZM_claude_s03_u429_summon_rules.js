/* S03-U429: 氷の女王, D－HERO ディスクガイ, コアキメイル・ドラゴ, 暴君の自暴自棄, ワーム・ベイト, 迷える仔羊, スライム増殖炉 (stale ENGINE_GAP cards about summon restrictions; carddata texts).

   氷の女王          このカードは墓地からの特殊召喚はできない。自分フィールド上に表側表示で存在するこのカードが破壊され墓地へ送られた時、自分の墓地の魔法使い族モンスターが3体以上の場合、自分の墓地から魔法カード1枚を選択して手札に加える事ができる。
   D－HERO ディスクガイ  このカード名の効果はデュエル中に1度しか使用できない。このカードは墓地へ送られたターンには墓地からの特殊召喚はできない。①：このカードが墓地からの特殊召喚に成功した場合に発動できる。自分はデッキから2枚ドローする。
   コアキメイル・ドラゴ  （エンドフェイズの維持コスト）①：このカードがモンスターゾーンに存在する限り、お互いに光・闇属性モンスターを特殊召喚できない。
   暴君の自暴自棄    （永続罠）自分フィールド上に存在するトークン以外の通常モンスター2体をリリースして発動する。このカードがフィールド上に存在する限り、お互いに効果モンスターを召喚・特殊召喚する事ができない。
   ワーム・ベイト    （通常魔法）このカードを発動するターン、自分はレベル3・4のモンスターを召喚・特殊召喚できない。①：自分フィールドに昆虫族モンスターが存在する場合に発動できる。自分フィールドに「ワームトークン」（昆虫族・地・星1・攻/守0）2体を特殊召喚する。
   迷える仔羊        （通常魔法）このカードを発動するターン、自分はこのカードの効果以外ではモンスターを召喚・反転召喚・特殊召喚できない。①：自分フィールドに「仔羊トークン」（獣族・地・星1・攻/守0）2体を守備表示で特殊召喚する。
   スライム増殖炉    （永続魔法）自分のスタンバイフェイズ毎に、自分フィールド上に「スライムモンスタートークン」（水族・水・星1・攻/守500）1体を攻撃表示で特殊召喚する。このカードがフィールド上に存在する限り、自分は「スライムモンスタートークン」以外のモンスターを召喚・反転召喚・特殊召喚する事はできない。

   Notes
   - Engine (S03-U429): banSummonS03's match knows {lvmax}; the text rule noGraveSummonReasonS03 (engine/1ZK, read from the card text) also reads 「このカードは墓地へ送られたターンには墓地からの特殊召喚はできない」 (graveInfo.turn === the turn). 氷の女王's own 「墓地からの特殊召喚はできない」 was already a text rule.
   - Tokens are created by API.createTokens (TOKEN_CREATE), which the summon locks do not gate - exactly what ワーム・ベイト / 迷える仔羊 / スライム増殖炉 need ("the effect of this card" is the exception). The turn bans are banSummonS03 paid in the card's cost; スライム増殖炉 uses summonLockS03 (own summons of every kind, i.p === i.srcPlayer).
   - 暴君の自暴自棄: cost = two face-up non-Token Normal Monsters of mine released (u342PickN); summonLockS03 for 'normal' and 'special' summons of Effect Monsters of both players. コアキメイル・ドラゴ: u321UpkeepEffect (Dragon) + summonLockS03 on LIGHT / DARK Special Summons of both players.
   - 氷の女王: optional Graveyard trigger (graveInfo.from 'mz', byDestroy, face 'up', this turn), the Graveyard holds 3+ Spellcasters (herself included): a Spell of the Graveyard is moved to the hand (MOVE).
   - ディスクガイ: optional trigger on its own Special Summon from the Graveyard (card.specialSummonedFrom) drawing 2 once per duel (player flag u429Disk). */

function u429Passive(extra){
  return Object.assign({type:'monster', priority:1, timing:['free']}, extra);
}

/* ---- 氷の女王 ---- */
function u429QueenSent(ctx){
  const e = ctx.event || {}, g = ctx.card.graveInfo;
  return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && !!g && g.from==='mz' && !!g.byDestroy && g.face==='up' && Number(g.turn)===Number(gameState.turn);
}
function u429Casters(p){ return API.pileCards(p, 'grave', x=>x.db.k==='m' && x.db.ra==='魔法使い').length; }
function u429GraveSpells(p){ return API.pileCards(p, 'grave', x=>x.db.k==='s'); }
defineUnifiedCardV4('氷の女王', [{
  key:'recover', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave'],
  condition(ctx){
    if(!u429QueenSent(ctx)){ ctx.reason = 'フィールドで破壊され墓地へ送られた時に発動します'; return false; }
    if(u429Casters(ctx.player)<3){ ctx.reason = '墓地の魔法使い族モンスターが3体未満です'; return false; }
    return u429GraveSpells(ctx.player).length>0;
  },
  operation(ctx){
    const pool = u429GraveSpells(ctx.player); if(!pool.length) return;
    API.selectCard('氷の女王：手札に加える墓地の魔法カード', pool, t=>{
      const r = t && resolveTarget(t);
      if(r && r.zone==='grave' && r.p===ctx.player) act({type:'MOVE', player:r.p, from:'grave', fromIndex:r.index, to:'hand', face:'up'});
    });
  },
  afterResolve(){}
}], u429Passive({activateFrom:['grave'], passive:{ onSendToGrave(ctx){ return u429QueenSent(ctx) && u429Casters(ctx.player)>=3 && u429GraveSpells(ctx.player).length>0; } }}));

/* ---- D－HERO ディスクガイ ---- */
function u429Disk(ctx){
  const e = ctx.event || {};
  return ctx.zone==='mz' && ctx.card.face==='up' && (e.uid===ctx.card.uid || e.card===ctx.card) && ctx.card.specialSummonedFrom==='grave' && API.getFlag(ctx.player, 'u429Disk')!==1;
}
defineUnifiedCardV4('D－HERO ディスクガイ', [{
  key:'draw2', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'],
  condition(ctx){ if(!u429Disk(ctx)){ ctx.reason = '墓地からの特殊召喚に成功した時に発動します（デュエル中に1度）'; return false; } return API.me(ctx).deck.length>=2; },
  operation(ctx){ API.setFlag(ctx.player, 'u429Disk', 1, false); API.draw(ctx.player, 2); },
  afterResolve(){}
}], u429Passive({includesSpecialSummon:true, passive:{ onSpecialSummon(ctx){ return u429Disk(ctx) && API.me(ctx).deck.length>=2; } }}));

/* ---- コアキメイル・ドラゴ ---- */
defineUnifiedCardV4('コアキメイル・ドラゴ', [u321UpkeepEffect(db=>db.k==='m' && db.ra==='ドラゴン')],
  u321UpkeepMeta({summonLockS03:(i)=> i.kind==='special' && (i.db.at==='光' || i.db.at==='闇')}));

/* ---- 暴君の自暴自棄 ---- */
function u429Normals(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m' && (x.db.st||[]).indexOf('通常')>=0 && !x.card.token}); }
defineUnifiedCardV4('暴君の自暴自棄', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:2, events:['activate'],
  condition(ctx){ if(!u422Fresh(ctx)) return false; if(u429Normals(ctx).length<2){ ctx.reason = '自分フィールドにトークン以外の通常モンスターが2体必要です'; return false; } return true; },
  cost(ctx, done){ u342PickN('暴君の自暴自棄：リリースするトークン以外の通常モンスター', ctx, u429Normals, 2, h=>API.sendToGrave(h, '暴君の自暴自棄（リリース）'), done); },
  operation(){},
  afterResolve(){}
}], {type:'trap', priority:2, summonLockS03:(i)=> (i.kind==='normal' || i.kind==='special') && (i.db.st||[]).indexOf('効果')>=0});

/* ---- ワーム・ベイト ---- */
defineTokenSpecV11('ワームトークン', {atk:0, def:0, lv:1, ra:'昆虫', at:'地'});
defineUnifiedCardV4('ワーム・ベイト', [{
  key:'tokens', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:1, events:['activate'],
  condition(ctx){
    if(!API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m' && x.db.ra==='昆虫'}).length){ ctx.reason = '自分フィールドに昆虫族モンスターがいません'; return false; }
    if(Math.max(0, ZONE_LIMITS.mz - gameState.players[ctx.player].mz.length)<2){ ctx.reason = 'モンスターゾーンに空きが2つありません'; return false; }
    return true;
  },
  cost(ctx, done){ banSummonS03(ctx.player, gameState.turn, gameState.turn, ['normal','special'], {lvmin:3, lvmax:4}, 'ワーム・ベイト'); done(true); },
  operation(ctx){ API.createTokens(ctx.player, 'ワームトークン', 2); }
}], {type:'spell', priority:1, includesSpecialSummon:true});

/* ---- 迷える仔羊 ---- */
defineTokenSpecV11('仔羊トークン', {atk:0, def:0, lv:1, ra:'獣', at:'地', pos:'def'});
defineUnifiedCardV4('迷える仔羊', [{
  key:'tokens', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:1, events:['activate'],
  condition(ctx){ if(Math.max(0, ZONE_LIMITS.mz - gameState.players[ctx.player].mz.length)<2){ ctx.reason = 'モンスターゾーンに空きが2つありません'; return false; } return true; },
  cost(ctx, done){ banSummonS03(ctx.player, gameState.turn, gameState.turn, ['normal','flip','special'], {}, '迷える仔羊'); done(true); },
  operation(ctx){ API.createTokens(ctx.player, '仔羊トークン', 2); }
}], {type:'spell', priority:1, includesSpecialSummon:true});

/* ---- スライム増殖炉 ---- */
defineTokenSpecV11('スライムモンスタートークン', {atk:500, def:500, lv:1, ra:'水', at:'水', pos:'atk'});
function u429SlimeDue(ctx){ return ctx.zone==='sz' && ctx.card.face==='up' && !ctx.card.activationPending && ctx.player===gameState.activePlayer && gameState.phase==='standby'; }
defineUnifiedCardV4('スライム増殖炉', [u422Act(false), {
  key:'slime', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onStandbyPhase'], forced:true,
  condition(ctx){ return u429SlimeDue(ctx) && hasMonsterZoneSpace(ctx.player); },
  operation(ctx){ if(hasMonsterZoneSpace(ctx.player)) API.createTokens(ctx.player, 'スライムモンスタートークン', 1); },
  afterResolve(){}
}], {type:'spell', priority:1, forced:false, includesSpecialSummon:true,
  summonLockS03:(i)=> i.p===i.srcPlayer && i.db.k==='m',
  passive:{ onStandbyPhase(ctx){ return u429SlimeDue(ctx) && hasMonsterZoneSpace(ctx.player); } } });
