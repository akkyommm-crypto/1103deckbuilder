/* S03-U200: PARTIAL cards whose AUTO_DECK_TABLE entries (cards/40) were coarse — now their 2011 texts, on the shared pool / choice helpers
   (engine/1ZT deckTriggerPoolS03 + cards/HZZF poolSpecS03 / poolS03 / askPoolS03).
   - summon searches: ジェネクス・パワー・プランナー, ジェネクス・ブラスト, ジェムレシス, レアル・ジェネクス・クラッシャー / ターボ / マグナ, リチュア・アビス;
   - Flip searches: リチュア・エリアル, ジェムタートル;
   - Deck Spells: 召喚師のスキル, 氷結界の紋章, 精神統一 (「1ターンに1枚」), 緊急鋼核処分 (to the GY). */

/* ---- summon-time searches (optional; 「召喚に成功した時」 = Normal Summon; the events are declared per card) ---- */
function defineSummonSearchS03(name, spec){
  const S = poolSpecS03(name, Object.assign({action:'search', optional:true}, spec));
  const evs = S.events || ['onNormalSummon'];
  const def = {
    type:'monster', priority:1, forced:!S.optional, blocksIfNoDeckToHand:!!S.optional,
    condition(ctx){
      if(ctx.zone!=='mz' || evs.indexOf(ctx.eventName)<0 || !eventIsSelfS03(ctx)){ ctx.reason = S.reason || '召喚に成功した時に発動します'; return false; }
      if(ctx.eventName==='onFlip' && !(ctx.event||{}).flipSummon){ ctx.reason = '反転召喚に成功した時に発動します'; return false; }
      return true;
    },
    resolve(ctx){ askPoolS03(ctx, name, S.title || `${name}：手札に加えるカード`); },
    afterResolve(){},
    passive:{}
  };
  evs.forEach(ev=>{ def.passive[ev] = (ctx)=>ctx.zone==='mz' && eventIsSelfS03(ctx) && (ev!=='onFlip' || !!(ctx.event||{}).flipSummon); });
  defineScript(name, def);
}
/* ジェネクス・パワー・プランナー: このカードが召喚に成功した時、デッキからレベル3の「ジェネクス」と名のついた効果モンスター1体を手札に加える事ができる。 */
defineSummonSearchS03('ジェネクス・パワー・プランナー', {filter:{set:SETCODE.GENEX, lv:3, effectOnly:true}});
/* ジェネクス・ブラスト: このカードが特殊召喚に成功した時、デッキから「ジェネクス」と名のついた闇属性モンスター1体を手札に加える事ができる。 */
defineSummonSearchS03('ジェネクス・ブラスト', {events:['onSpecialSummon'], reason:'特殊召喚に成功した時に発動します', filter:{set:SETCODE.GENEX, at:'闇'}});
/* ジェムレシス: このカードが召喚に成功した時、デッキから「ジェムナイト」と名のついたモンスター1体を手札に加える事ができる。 */
defineSummonSearchS03('ジェムレシス', {filter:{set:SETCODE.GEM_KNIGHT}});
/* レアル・ジェネクス・クラッシャー / マグナ: …デッキからレベル4 / 2の「レアル・ジェネクス」と名のついたモンスター1体を手札に加える事ができる。 */
defineSummonSearchS03('レアル・ジェネクス・クラッシャー', {filter:{nameHas:'レアル・ジェネクス', lv:4}});
defineSummonSearchS03('レアル・ジェネクス・マグナ', {filter:{nameHas:'レアル・ジェネクス', lv:2}});
/* レアル・ジェネクス・ターボ: …デッキからレベル1の「ジェネクス」と名のついたモンスター1体を手札に加える事ができる。 */
defineSummonSearchS03('レアル・ジェネクス・ターボ', {filter:{set:SETCODE.GENEX, lv:1}});
/* リチュア・アビス: このカードが召喚・反転召喚・特殊召喚に成功した時、デッキから「リチュア・アビス」以外の守備力1000以下の「リチュア」と名のついたモンスター1体を
   手札に加える事ができる。 */
defineSummonSearchS03('リチュア・アビス', {events:['onNormalSummon','onFlip','onSpecialSummon'], reason:'召喚・反転召喚・特殊召喚に成功した時に発動します',
  filter:{set:SETCODE.GISHKI, defmax:1000, notName:'リチュア・アビス'}});

/* ---- Flip searches (optional) ---- */
function defineFlipSearchS03(name, spec){
  poolSpecS03(name, Object.assign({action:'search', optional:true}, spec));
  defineScript(name, {
    type:'monster', priority:1, blocksIfNoDeckToHand:true,
    condition(ctx){ if(ctx.eventName!=='onFlip' || !eventIsSelfS03(ctx)){ ctx.reason = 'リバースした時に発動します'; return false; } return true; },
    resolve(ctx){ askPoolS03(ctx, name, `${name}：手札に加えるカード`); },
    afterResolve(){},
    passive:{ onFlip(ctx){ return ctx.zone==='mz' && eventIsSelfS03(ctx); } }
  });
}
/* リチュア・エリアル: リバース：デッキから「リチュア」と名のついたモンスター1体を手札に加える事ができる。 */
defineFlipSearchS03('リチュア・エリアル', {filter:{set:SETCODE.GISHKI}});
/* ジェムタートル: リバース：デッキから「ジェムナイト・フュージョン」1枚を手札に加える事ができる。 */
defineFlipSearchS03('ジェムタートル', {filter:{name:'ジェムナイト・フュージョン', anyCard:true}});

/* ---- Deck Spells (Normal Spells, own Main Phase) ---- */
function defineDeckSpellS03(name, spec){
  const S = poolSpecS03(name, Object.assign({action:'search', optional:false}, spec));
  defineScript(name, Object.assign({
    type:'spell', priority:1,
    blocksIfNoDeckToHand: S.action==='search',
    condition(ctx){ if(!poolS03(name, ctx.player).length){ ctx.reason = S.noneReason || 'デッキに該当するカードがありません'; return false; } return true; },
    resolve(ctx){
      if(S.action==='mill'){
        const pool = poolS03(name, ctx.player);
        if(!pool.length){ API.shuffle(ctx.player); return; }
        API.requestChoice({player:ctx.player, kind:'card', title:S.title, candidates:pool, min:1, max:1, cancelable:false,
          resume:{handler:'p11cards.deck-mill', args:{player:ctx.player, reason:name}}, meta:{scriptName:name}});
        return;
      }
      askPoolS03(ctx, name, S.title);
    }
  }, S.extraScript || {}));
}
/* 召喚師のスキル: デッキからレベル5以上の通常モンスター1体を手札に加える。 */
defineDeckSpellS03('召喚師のスキル', {filter:{lvmin:5, normalOnly:true}, title:'召喚師のスキル：手札に加えるレベル5以上の通常モンスター'});
/* 氷結界の紋章: 自分のデッキから「氷結界」と名のついたモンスター1体を手札に加える。 */
defineDeckSpellS03('氷結界の紋章', {filter:{set:SETCODE.ICE_BARRIER}, title:'氷結界の紋章：手札に加える「氷結界」モンスター'});
/* 精神統一: デッキから「精神統一」を1枚手札に加える。このカードは1ターンに1枚しか使用できない。 */
defineDeckSpellS03('精神統一', {filter:{name:'精神統一', anyCard:true}, title:'精神統一：手札に加える「精神統一」', extraScript:{countLimit:1}});
/* 緊急鋼核処分: 自分のデッキから「コアキメイルの鋼核」1枚を選択して墓地へ送る。 */
defineDeckSpellS03('緊急鋼核処分', {action:'mill', filter:{name:'コアキメイルの鋼核', anyCard:true}, title:'緊急鋼核処分：墓地へ送る「コアキメイルの鋼核」'});
