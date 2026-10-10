/* S03-U197: PARTIAL cards whose AUTO_DECK_TABLE entries (cards/40) were coarse trig:"ignition" actions — an effect activated at will — now
   follow their 2011 texts.
   - C・チッキー / C・ドルフィーナ / C・パンテール / C・ピニー / C・モーグ / C・ラーバ: 「フィールド上に「ネオスペース」が存在する時、このカードを生け贄に
     捧げる事で手札またはデッキから「N・X」1体を特殊召喚する。」 — an ignition effect (own Main Phase) whose cost is Tributing this card; the
     Neo-Spacian is chosen at resolution from the hand or the Deck (journaled choice, s03u156.deck-trigger: face-up, position chosen).
   - 共鳴虫 / ガスタ・スクイレル / ベビケラサウルス / レプティレス・ガードナー: triggers on the shared deck-trigger engine (engine/1ZT). */

/* ---- C・ (Chrysalis) ---- */
function neoSpacePresentS03(){ return [0,1].some(p=>{ const f = gameState.players[p].field; return f && f.face==='up' && cardName(f)==='ネオスペース'; }); }
/* the pool is the shared engine's (engine/1ZT deckTriggerPoolS03, from the hand and the Deck, the named card); the spec is registered in
   DECK_TRIGGER_S03 so the auto-table filter check (tools/test_s03_u135) still sees these entries */
function chrysalisPoolS03(p, name){ return deckTriggerPoolS03(name, DECK_TRIGGER_S03[name], p); }
function defineChrysalisS03(name, target){
  DECK_TRIGGER_S03[name] = {from:['hand','deck'], max:1, optional:true, action:'summon', pos:'faceUp', filter:{name:target}};
  defineScript(name, {
    type:'monster', priority:1, timing:['mainPhase'], blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
    condition(ctx){
      if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
      if(!neoSpacePresentS03()){ ctx.reason = '「ネオスペース」が存在しません'; return false; }
      if(!chrysalisPoolS03(ctx.player, name).length){ ctx.reason = `手札・デッキに「${target}」がいません`; return false; }
      return true;
    },
    cost(ctx, done){
      const me = ctx.card && ctx.card.uid!=null ? findCardByUid(ctx.card.uid) : null;
      if(!me || me.zone!=='mz'){ done(false); return; }
      API.sendToGrave(me, `${name}（リリース）`); done(true);
    },
    resolve(ctx){
      if(!hasMonsterZoneSpace(ctx.player)){ API.log(`${name}：モンスターゾーンが空いていない`); return; }
      const pool = chrysalisPoolS03(ctx.player, name);
      if(!pool.length){ API.log(`${name}：「${target}」が手札・デッキにいない`); return; }
      API.requestChoice({player:ctx.player, kind:'card', title:`${name}：特殊召喚する「${target}」（手札またはデッキ）`,
        candidates:pool, min:1, max:1, cancelable:false,
        resume:{handler:'s03u156.deck-trigger', args:{player:ctx.player, name, action:'summon', pos:'faceUp'}}, meta:{scriptName:name}});
    },
    afterResolve(){}
  });
}
defineChrysalisS03('C・チッキー',   'N・エア・ハミングバード');
defineChrysalisS03('C・ドルフィーナ', 'N・アクア・ドルフィン');
defineChrysalisS03('C・パンテール',  'N・ブラック・パンサー');
defineChrysalisS03('C・ピニー',     'N・グロー・モス');
defineChrysalisS03('C・モーグ',     'N・グラン・モール');
defineChrysalisS03('C・ラーバ',     'N・フレア・スカラベ');

/* ---- deck triggers ---- */
/* destroyed by a card effect (not by battle): the GY record of this move */
function destroyedByEffectS03(ctx){ const g = ctx.card && ctx.card.graveInfo; return !!(g && g.byDestroy && !g.battle && Number(g.turn)===Number(gameState.turn)); }
/* 共鳴虫: このカードが戦闘によって破壊され墓地に送られた時、デッキから攻撃力1500以下の昆虫族モンスター1体を自分フィールド上に特殊召喚する事ができる。 */
declareDeckTriggerS03('共鳴虫', {when:'battleToGrave', action:'summon', optional:true, pos:'faceUp', filter:{ra:'昆虫', atkmax:1500}});
/* ガスタ・スクイレル: このカードがカードの効果によって破壊され墓地へ送られた時、デッキからレベル5以上の「ガスタ」と名のついたモンスター1体を特殊召喚できる。 */
declareDeckTriggerS03('ガスタ・スクイレル', {when:'fieldToGrave', action:'summon', optional:true, pos:'faceUp', filter:{set:SETCODE.GUSTO, lvmin:5},
  extra(ctx){ return destroyedByEffectS03(ctx) ? '' : 'カードの効果によって破壊され墓地へ送られた時に発動します'; }});
/* ベビケラサウルス (2011): このカードがカードの効果によって破壊され墓地へ送られた時、自分のデッキからレベル4以下の恐竜族モンスター1体を特殊召喚する。 */
declareDeckTriggerS03('ベビケラサウルス', {when:'fieldToGrave', action:'summon', optional:false, pos:'faceUp', filter:{ra:'恐竜', lvmax:4},
  extra(ctx){ return destroyedByEffectS03(ctx) ? '' : 'カードの効果によって破壊され墓地へ送られた時に発動します'; }});
/* レプティレス・ガードナー: 自分フィールド上のこのカードが破壊され墓地へ送られた時、デッキから「レプティレス」と名のついたモンスター1体を手札に加える。 */
declareDeckTriggerS03('レプティレス・ガードナー', {when:'fieldToGrave', action:'search', optional:false, filter:{group:'REPTILIANNE'},
  extra(ctx){ const g = ctx.card && ctx.card.graveInfo; return (g && g.byDestroy && Number(g.turn)===Number(gameState.turn)) ? '' : '破壊され墓地へ送られた時に発動します'; }});
