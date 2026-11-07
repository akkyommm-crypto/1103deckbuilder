/* S03-U527: 偽物のわな（1103対象の未実装カード。carddata のテキスト）。

   偽物のわな（通常罠）
     自分フィールド上に存在する罠カードを破壊する魔法・罠・効果モンスターの効果を相手が発動した時に
     発動する事ができる。このカードを代わりに破壊し、他の自分の罠カードは破壊されない。
     セットされたカードが破壊される場合、そのカードを全てめくって確認する。

   当時の裁定（この実装の根拠。推測ではない）
     WIKI-D4E66D1A9A3F（09/03/11）《大嵐》にチェーンした場合、発動したプレイヤーのセットされたカードを
       全て相手に確認させ、このカード以外の自分フィールド上の罠カードは全て破壊されない。
       相手の罠カードは《大嵐》の効果で破壊される → 守るのは自分フィールドの罠カードだけ。
     WIKI-A45948320C8C（09/03/12）《ブラック・ローズ・ドラゴン》の全体破壊にもチェーンできる（自分の罠だけ守る）。
     WIKI-F00EA2A4035E（07/06/18）《闇のデッキ破壊ウイルス》にもチェーンできるが、守られるのは
       フィールドの罠カードだけで手札の罠カードは破壊される → 守る範囲はフィールド（魔法＆罠ゾーン）。
     WIKI-5439C489E102（10/09/13）《Ｅ・ＨＥＲＯ エアーマン》のように破壊が不確定な効果には発動できない
       → 「破壊が確定している」判定（engine/1ZZZD の fakeTrapCertainS03）。対象を取る効果は対象だけを見る。
     WIKI-D5F300A58DC3（09/03/11）セットされたカードを確認するタイミングは「この効果の発動時」/
     WIKI-861BDA6FCE50（10/09/13）発動より後にセットされたカードは確認できず、破壊からも守れない
       → 発動時（コストの処理）に、確認するカードと守る罠カードの uid をチェーンリンクに控える。
     WIKI-DA0C326CE2A9（11/03/11）魔法＆罠ゾーンにセットされたカードは全て確認させる（モンスターは不要）。
     WIKI-4E31065236CC（09/03/12）《王宮のお触れ》が存在する時も確認はさせる。
     WIKI-C705DA31850D（09/04/11）このカードの発動にチェーンして発動した《サイクロン》等でこのカード自身が
       破壊された場合、「このカードを代わりに破壊する」効果は適用されない
       → 解決時にこのカードがフィールドに残っている事を条件にする。
     WIKI-F7E74B443EB4（09/01/16）《スターダスト・ドラゴン》で《炸裂装甲》の発動を無効にして破壊する場合、
       炸裂装甲は破壊されないが効果は無効になる → 止めるのは破壊だけ（無効化は止めない）。
     WIKI-3FFD3A9DA6A1（11/06/09）/ WIKI-708A2880BB28（10/09/13）《Ｄ－ＨＥＲＯ ダイヤモンドガイ》で
       墓地へ送った《大嵐》の発動にも発動できる → 発動元のゾーンは見ない。

   「破壊が確定している」かの判定と、破壊を止める印は共通側（engine/1ZZZD）に置いた。
   《サイクロン》のように対象を取る効果は対象だけを見るので、対象が自分の罠でなければ発動できない。 */

declareActivationResponseS03(['偽物のわな']);   /* 発動への応答（engine/1P、S03-U18） */

/* 今チェーンの一番上にあるリンク（応答先） */
function u527TopLinkS03(){
  const ch = (typeof gameState !== 'undefined' && gameState && Array.isArray(gameState.chain)) ? gameState.chain : [];
  return ch.length ? ch[ch.length - 1] : null;
}
/* 自分の魔法＆罠ゾーンのセットカードの uid（WIKI-DA0C326CE2A9: モンスターは含めない） */
function u527SetCardUidsS03(p){
  return (gameState.players[p].sz || [])
    .filter(c=>c && c.uid != null && c.face === 'down')
    .map(c=>c.uid);
}
/* セットされたカードをめくって確認させた印（公開情報の仕組みが engine に無いので、
   カードの印とログで表す。報告書の未対応に書いた）。 */
function u527RevealS03(p, uids){
  let shown = 0;
  (uids || []).forEach(uid=>{
    const r = findCardByUid(uid);
    if(!r || r.zone !== 'sz' || r.p !== p) return;
    API.setCardFlag(r, 'revealedTurnS527', gameState.turn, '偽物のわな（確認）', {silent:true});
    shown++;
  });
  API.log(`偽物のわな：セットされたカード ${shown} 枚をめくって確認させる`);
  return shown;
}
function u527PlanS03(ctx){
  const link = u527TopLinkS03();
  if(!link) return null;
  const uids = fakeTrapCertainS03(gameState, link, ctx.player, ctx.card ? ctx.card.uid : null);
  if(!uids.length) return null;
  return {srcUid:(link.uid != null) ? link.uid : null, uids:uids, reveal:u527SetCardUidsS03(ctx.player)};
}

defineScript('偽物のわな', {
  type:'trap', priority:2,
  condition(ctx){
    if(ctx.zone !== 'sz'){ ctx.reason = '魔法＆罠ゾーンから発動します'; return false; }
    const link = u527TopLinkS03();
    if(!link){ ctx.reason = '相手の効果の発動にチェーンして発動します'; return false; }
    const plan = u527PlanS03(ctx);
    if(!plan){
      ctx.reason = '自分フィールドの罠カードを破壊する事が確定している相手の効果の発動にチェーンして発動します';
      return false;
    }
    if(plan.srcUid == null){ ctx.reason = '発動したカードを特定できません'; return false; }
    return true;
  },
  /* WIKI-D5F300A58DC3 / WIKI-861BDA6FCE50: 確認するカードと守る罠カードは「発動時」に決まる。
     コストの処理でチェーンリンクに控える（engine/00 の costCtxS03。Replay でも同じ値になる）。 */
  cost(ctx, done){
    const plan = u527PlanS03(ctx);
    if(plan){
      ctx.costCtxS03 = Object.assign({}, ctx.costCtxS03 || {}, {fakeTrapS527:plan});
      /* WIKI-D5F300A58DC3（09/03/11）: 確認は「この効果発動時」に行う。
         WIKI-4E31065236CC（09/03/12）: 《王宮のお触れ》で効果が無効になっていても確認はさせるので、
         解決ではなく発動の処理で行う。 */
      u527RevealS03(ctx.player, plan.reveal);
    }
    done(true);
  },
  resolve(ctx){
    const plan = ctx.fakeTrapS527;
    if(!plan){ API.log('偽物のわな：守る罠カードがありません'); return; }
    const h = (ctx.card && ctx.card.uid != null) ? findCardByUid(ctx.card.uid) : null;
    /* WIKI-C705DA31850D: このカード自身が既に破壊されていたら適用されない */
    if(!h || h.zone !== 'sz'){
      API.log('偽物のわな：このカードがフィールドに存在しないため、代わりに破壊する効果は適用されない');
      return;
    }
    /* このカードを代わりに破壊し、他の自分の罠カードは破壊されない */
    fakeTrapNoteS03(gameState, {player:ctx.player, srcUid:plan.srcUid, uids:plan.uids});
    API.log(`偽物のわな：自分フィールドの罠カード ${plan.uids.length} 枚は破壊されない`);
    API.destroy(h, '偽物のわな');
  }
});
