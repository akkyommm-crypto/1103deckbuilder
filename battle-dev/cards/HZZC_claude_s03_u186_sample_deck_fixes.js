/* =========================================================================
   S03-U186 — sample-deck cards whose scripts were incomplete (found by their first dedicated tests).
   ========================================================================= */
/* 裁きの龍: このカードは通常召喚できない。自分の墓地の「ライトロード」モンスターが4種類以上の場合のみ特殊召喚できる。
   (The script had ① / ② but no summon procedure: the card could not be summoned in DUEL.) */
function u186LightswornKinds(p){
  const names = {};
  API.pileCards(p, 'grave', x=>x.db.k==='m' && (typeof isSetCardV4==='function' ? isSetCardV4(x.db, SETCODE.LIGHTSWORN) : String(x.db.n||'').indexOf('ライトロード')>=0))
    .forEach(x=>{ names[x.db.n] = true; });
  return Object.keys(names).length;
}
if(CARD_SCRIPTS['裁きの龍']){
  CARD_SCRIPTS['裁きの龍'].summonProcedure = {from:'hand', positions:['atk','def'],
    condition(ctx){
      const n = u186LightswornKinds(ctx.player);
      if(n < 4){ ctx.reason = `自分の墓地の「ライトロード」モンスターが4種類以上必要です（${n}種類）`; return false; }
      return true;
    }};
}

/* Sin サイバー・エンド・ドラゴン: moved to the 「Sin」 common mechanism in S03-U187 (engine/1ZZD, cards/HZZD). */
