/* =========================================================================
   S03-U522 — 墓地からの発動を 1 回だけ許可する（《D－HERO ダイヤモンドガイ》）
   -------------------------------------------------------------------------
   「この効果で通常魔法カードを墓地へ送った場合、次の自分ターンのメインフェイズに
     墓地のその通常魔法カードの発動時の効果を発動できる」

   当時の裁定から、許可は「カード 1 枚・ターン 1 つ・1 回だけ」の形になる:
     WIKI-EF0F11F0F5B7（06/02/16）次の自分のターンにこのカードが場に無くても処理する
       → 許可はカードではなくプレイヤーに持たせる（effectFlags）。
     WIKI-7C1EE634F520（06/02/16）発動しない事もでき、それ以降のターンには使えない
       → ターンを刻んで、そのターンだけ有効にする。
     WIKI-0855121F0A77（06/02/16）次の自分のメインフェイズならいつでもよい。
     WIKI-4FC1C763D881（06/02/16）複数枚めくった場合は複数枚発動できる → 一覧で持つ。
     WIKI-62E4A0F1CA35 / WIKI-79BFDC6BED27 その魔法が墓地を離れたら発動できない
       → uid で引くので、墓地に無ければ許可は働かない。
     WIKI-F23294BA0134（06/02/16）その効果は**魔法効果**。相手は応答できる
       （WIKI-3FFD3A9DA6A1 11/06/09 / WIKI-2704AA2D7864 09/12/02）
       → 墓地のそのカードを本当に発動させる（prepareDuelActivation は墓地のカードを動かさず、
         from:'grave' のチェーンリンクを作る）。コスト・条件・対象はその魔法自身のものが働く。

   許可は effectFlags.graveActGrantS03 = [{uid, turn}]（デュエル中ずっと残る側）に置く。
   使ったら CHAIN_ADD（engine/00）が消すので、同じターンに同じカードを 2 回発動できない。
   ターンが過ぎた許可は書き込み時にまとめて捨てる（state を増やさない）。
   ========================================================================= */
function graveActGrantsS03(gs, p){
  const P = ((gs || gameState).players || [])[p];
  const list = P && P.effectFlags && P.effectFlags.graveActGrantS03;
  return Array.isArray(list) ? list : [];
}
function grantGraveActivationS03(p, uid, turn){
  if(uid == null) return false;
  const keep = graveActGrantsS03(gameState, p).filter(g=>g && Number(g.turn) >= Number(gameState.turn));
  keep.push({uid:uid, turn:Number(turn)});
  API.setFlag(p, 'graveActGrantS03', keep, false);
  return true;
}
/* このカードを今、墓地から発動できるか（engine/20 の canActivateFromZone が読む） */
function graveActivationGrantedS03(p, card, zone){
  if(zone !== 'grave' || !card || card.uid == null) return false;
  return graveActGrantsS03(gameState, p).some(g=>g && g.uid === card.uid && Number(g.turn) === Number(gameState.turn));
}
/* 使った許可を消す（CHAIN_ADD の reducer から呼ばれる。Journal / Replay に乗る） */
function consumeGraveActivationGrantS03(gs, p, uid){
  if(uid == null) return false;
  const P = ((gs || gameState).players || [])[p];
  if(!P || !P.effectFlags || !Array.isArray(P.effectFlags.graveActGrantS03)) return false;
  const before = P.effectFlags.graveActGrantS03.length;
  P.effectFlags.graveActGrantS03 = P.effectFlags.graveActGrantS03
    .filter(g=>!(g && g.uid === uid && Number(g.turn) === Number((gs || gameState).turn)));
  return P.effectFlags.graveActGrantS03.length !== before;
}
