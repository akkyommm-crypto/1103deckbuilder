/* S03-U29 C-S03-25 NEGATED_ACTIVATION_TO_GRAVE
   ルール：カードの発動を無効にされた魔法・罠カードは、そのチェーンリンクの解決時に墓地へ送られる（破壊ではない）。
   1103 裁定 R1103-SUPERVISE-002：発動を無効にされたカードは「表側表示でフィールド上から墓地へ送られた」扱いにならない。
   - cardActivationMarkerS03：手札からの発動（opts.cardActivation / onAbort）とセット状態からの発動を「カードの発動」として
     CHAIN_ADD に記録する（true の時だけ書く）。表側で場にある永続・フィールド・装備カードの効果の発動は含めない。
   - settleNegatedCardActivationS03：発動を無効にされたリンクの解決時、そのカードがまだ発動した場所に表側で残っていれば
     FX_SELF_TO_GRAVE で墓地へ送る。破壊・場から墓地へ送られた時のイベントは作らない。
     効果で手札に戻した・セットし直したカード（ゴブリンのその場しのぎ／誤作動）や、無効と同時に破壊したカードは動かさない。 */
function cardActivationMarkerS03(db, zone, card, opts){
  if(!db || (db.k!=='s' && db.k!=='t') || !card) return false;
  if(zone!=='sz' && zone!=='field') return false;
  if(opts && (opts.cardActivation===true || typeof opts.onAbort==='function')) return true;
  return card.face==='down';
}
function settleNegatedCardActivationS03(link){
  if(!link || link.cardActivationS03!==true || link.uid==null) return false;
  const h=findCardByUid(link.uid);
  if(!h || !h.card || (h.zone!=='sz' && h.zone!=='field') || h.card.face!=='up') return false;
  const d=dbOf(h.card);
  if(d.k!=='s' && d.k!=='t') return false;
  act({type:'FX_SELF_TO_GRAVE', player:h.p, zone:h.zone, index:h.index, reason:'発動を無効'});
  return true;
}
