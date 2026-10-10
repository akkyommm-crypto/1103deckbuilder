/* S03-U33: 「自分のドローフェイズ時に通常のドローを行う代わりに…」を C-S03-26（engine/1V_draw_replacement_s03.js）で宣言する。
   以前は cards/40_auto_interpreter.js の AUTO_DECK_TABLE（op:"search", trig:"ignition"）で、
   メインフェイズに何度でも起動できるサーチになっていた。ここで文字列リテラルの defineScript を置き、テーブル由来の登録を置き換える。
   発動は通常のドローの代わりにだけ許す（condition が ctx.drawReplacementS03 を要求する）ので、メインフェイズには出ない。

   無敗将軍 フリード     … レベル4以下の戦士族モンスター1体。もう一つの効果（魔法カードの対象無効）は S03-U32（cards/H8）。
   ダーク・ジェネラル フリード … レベル4の闇属性モンスター1体。自分の表側の闇属性モンスターを対象にする魔法を無効にする永続効果は
                                未実装なので PARTIAL のまま（data/script_status_overrides.json）。
   円盤ムスキー          … 「エーリアン」と名のついたカード1枚（魔法・罠も可、2011 wiki 09/11/14）。 */

function s03DrawReplacementPoolU33(p, f){
  return (typeof autoDeckMatches === 'function') ? autoDeckMatches(p, f) : [];
}
function s03DrawReplacementScriptU33(name, f){
  return {
    type:'monster', priority:1, timing:['free'],
    condition(ctx){
      if(!ctx.drawReplacementS03){ ctx.reason = '自分のドローフェイズに、通常のドローを行う代わりに発動します'; return false; }
      if(ctx.zone !== 'mz' || !ctx.card || ctx.card.face !== 'up'){ ctx.reason = '表側表示でフィールドに存在する必要があります'; return false; }
      if(!s03DrawReplacementPoolU33(ctx.player, f).length){ ctx.reason = 'デッキに条件を満たすカードがありません'; return false; }
      return true;
    },
    resolve(ctx){
      const h = locateCardAnyV4(ctx.card);
      if(!h || h.zone !== 'mz' || h.card.face !== 'up') return;   /* 11/01/10：表側表示で存在しなければ適用しない */
      const q = s03DrawReplacementPoolU33(ctx.player, f);
      if(!q.length) return;
      API.requestChoice({player:ctx.player, kind:'card', title:name + '：手札に加えるカード', candidates:q, min:1, max:1,
        cancelable:false, resume:{handler:'s03u33.to-hand', args:{player:ctx.player, reason:name}}, meta:{scriptName:name}});
    },
    afterResolve(){}
  };
}

API.registerChoiceHandler('s03u33.draw-choice', (answer, args)=>{
  const p = args.player;
  const v = String(answer && answer.cards && answer.cards[0] && answer.cards[0].value || 'draw');
  const drawNormally = ()=>requestProcessorV27(PROCESSOR_V27.DRAW, {player:p, n:1, normal:true, declineReplacementS03:true});
  if(v === 'draw') return drawNormally();
  const h = findCardByUid(Number(v));
  /* S03-U65: 宣言カードの実体は mz（表側モンスター）／grave（墓地の魔法・罠）／field（S03-U77: フィールド魔法）のいずれか。 */
  if(!h || (h.zone !== 'mz' && h.zone !== 'grave' && h.zone !== 'field') || h.p !== p) return drawNormally();
  const name = cardName(h.card);
  act({type:'DRAW_REPLACED_S03', player:p, name});
  prepareDuelActivation(name, p, h.zone, h.index, {drawReplacementS03:true});
});
API.registerChoiceHandler('s03u33.to-hand', (answer, args)=>{
  const picked = (typeof v49P1ChoiceCards === 'function') ? v49P1ChoiceCards(answer)[0] : null;
  const h = picked && locateCardAnyV4(picked.card);
  if(h && h.zone === 'deck' && h.p === args.player) API.searchDeck(args.player, h.index, args.reason);
});

defineScript('無敗将軍 フリード', s03DrawReplacementScriptU33('無敗将軍 フリード', {lvmax:4, ra:'戦士', tk:'m'}));
declareDrawReplacementS03('無敗将軍 フリード', {});
defineScript('ダーク・ジェネラル フリード', Object.assign(s03DrawReplacementScriptU33('ダーク・ジェネラル フリード', {lv:4, at:'闇', tk:'m'}),
  {cannotSpecialSummon:true}));   /* S03-U66: 「このカードは特殊召喚できない」（既存の汎用フラグをそのまま使う） */
declareDrawReplacementS03('ダーク・ジェネラル フリード', {});
defineScript('円盤ムスキー', s03DrawReplacementScriptU33('円盤ムスキー', {arch:'エーリアン'}));
declareDrawReplacementS03('円盤ムスキー', {});
