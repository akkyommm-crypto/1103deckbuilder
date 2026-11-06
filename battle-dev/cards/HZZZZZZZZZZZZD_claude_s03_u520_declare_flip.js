/* S03-U520: 世紀の大泥棒, 天狗のうちわ（1103対象の未実装カード。carddata のテキスト）。

   世紀の大泥棒（地・魔法使い・星3・攻1000/守1000）
     相手プレイヤーに戦闘ダメージを与える度にカード名を1つ宣言する。
     相手の手札を確認して宣言したカードがあった場合それを全て墓地に捨てる。
   天狗のうちわ（永続罠）
     ①:このカードが魔法&罠ゾーンに存在する限り、レベル2以下のモンスターは反転召喚に成功した時に破壊される。
     この時、そのモンスターはフィールドで発動する効果を発動できない。

   当時の裁定（この実装の根拠。推測ではない）
   - 世紀の大泥棒
     WIKI-6FD2C17EEAE9（10/07/04）「相手の手札が0枚の時にこのカードが相手に戦闘ダメージを与えた場合も
       カード名を宣言する必要がありますか？」→「はい、その場合でもカード名を宣言します」
       → 宣言は強制。手札が 0 枚でも誘発し、宣言まで行う（捨てる処理だけが空振りになる）。
     「度に」なので回数制限は無く、強制効果（forced）。宣言は効果の解決時に行う（コストではない）。
   - 天狗のうちわ
     WIKI-F921368DD337（10/09/17）「この効果にチェーンブロックは作られますか？」→「チェーンブロックを作ります」
       → 永続効果ではなく**誘発効果**（反転召喚に成功した時に発動する強制効果）として実装する。
     WIKI-FD3CC99C4815（09/01/03）「このカードの効果によって発動が制限されるのはリバース効果のみですか？」
       →「いいえ、違います」→ リバース効果に限らず、そのモンスターがフィールドで発動する効果すべてを封じる。
       封じは S03-U217 の activationLockS03（engine/1ZD）で、反転召喚されたターンのレベル2以下のモンスターに掛ける
       （反転召喚の記録 flipSummonedTurnS03 は S03-U260 のもので、場を離れると消えるゾーン限定の印）。
       破壊そのものより先に候補集めの段階で効くので、「この時」の封じが同じ反転召喚に対して働く。 */

/* ---- 世紀の大泥棒 ---- */
function u520ThiefDamageS03(ctx){
  const e = ctx.event || {};
  if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up') return false;
  if(!(Number(e.amount) > 0)) return false;
  if(e.player !== ctx.opponent) return false;
  const uid = ctx.card.uid;
  return uid != null && (e.attackerUid === uid || e.defenderUid === uid);
}
API.registerChoiceHandler('s03u520.thief-declare', (answer, args)=>{
  const picked = answer && answer.cards && answer.cards[0];
  const code = picked ? Number(picked.value) : NaN;
  const ref = CARD_DB.find(d=>d && ((canonicalCardCodeV4(d) || Number(d.c) || 0) === code));
  if(!ref){ API.log('世紀の大泥棒：宣言が無効'); return; }
  const foe = gameState.players[args.foe];
  const hit = (foe.hand || []).map((c, i)=>({c, i})).filter(x=>sameCanonicalCardV4(dbOf(x.c), ref));
  API.log(`世紀の大泥棒：「${ref.n}」を宣言（相手の手札 ${(foe.hand||[]).length} 枚を確認）`);
  if(!hit.length){ API.log(`世紀の大泥棒：「${ref.n}」は相手の手札に無い`); return; }
  hit.sort((a, b)=>b.i - a.i).forEach(x=>API.discard(args.foe, x.i, '世紀の大泥棒'));
  API.log(`世紀の大泥棒：「${ref.n}」を${hit.length}枚捨てさせた`);
});
defineUnifiedCardV4('世紀の大泥棒', [{
  key:'declare-discard', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onBattleDamage'], forced:true,
  /* WIKI-6FD2C17EEAE9（10/07/04）: 相手の手札が 0 枚でも宣言する → 手札の枚数を条件にしない。 */
  condition(ctx){ return u520ThiefDamageS03(ctx); },
  operation(ctx){
    API.requestChoice({player:ctx.player, kind:'declare', title:'世紀の大泥棒：カード名を1つ宣言',
      candidates:p11cNames(false), min:1, max:1, cancelable:false,
      resume:{handler:'s03u520.thief-declare', args:{player:ctx.player, foe:ctx.opponent}},
      meta:{scriptName:'世紀の大泥棒'}});
  },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true,
  passive:{ onBattleDamage(ctx){ return u520ThiefDamageS03(ctx); } }});

/* ---- 天狗のうちわ ---- */
function u520FanLevelS03(card){ return (typeof curLV==='function') ? Number(curLV(card)) : Number(dbOf(card).lv || 0); }
/* 反転召喚に成功したレベル2以下のモンスター（この誘発の対象）。 */
function u520FanFlippedS03(ctx){
  const e = ctx.event || {};
  if(ctx.zone!=='sz' || !ctx.card || ctx.card.face!=='up' || ctx.card.activationPending) return null;
  if(!e.flipSummon) return null;
  const uid = (e.uid != null) ? e.uid : null;
  const h = (uid != null) ? findCardByUid(uid) : null;
  if(!h || h.zone!=='mz' || h.card.face!=='up') return null;
  if(u520FanLevelS03(h.card) > 2) return null;
  return h;
}
/* 封じの側: 反転召喚されたターンのレベル2以下のモンスターは、フィールドで発動する効果を発動できない。 */
function u520FanLockedS03(card, zone){
  if(!card || zone!=='mz') return false;
  if(Number(card.flipSummonedTurnS03) !== Number(gameState.turn)) return false;
  return u520FanLevelS03(card) <= 2;
}
defineScript('天狗のうちわ', {
  type:'trap', priority:2,
  /* カードの発動そのものに要求は無い（発動時の効果を持たない永続罠。S03-U10 の分類と同じ扱いで
     declareCardActivationFreeV32 に登録する）。効果の発動は反転召喚の誘発だけ。 */
  condition(ctx){
    if(ctx.eventName !== 'onFlip' || !u520FanFlippedS03(ctx)){
      ctx.reason = 'レベル2以下のモンスターの反転召喚に成功した時に発動します'; return false;
    }
    return true;
  },
  /* WIKI-F921368DD337（10/09/17）: 破壊はチェーンブロックを作る誘発効果。 */
  resolve(ctx){
    const h = u520FanFlippedS03(ctx);
    if(h) API.destroy(h, '天狗のうちわ');
  },
  afterResolve(){},
  /* WIKI-FD3CC99C4815（09/01/03）: 封じるのはリバース効果だけではない。 */
  activationLockS03:(i)=> i.db.k==='m' && u520FanLockedS03(i.card, i.zone),
  forced:true,
  /* 他のモンスターの反転召喚に反応するので宣言する（S03-U225 の onOtherFlipS03、engine/40 flipTriggerApplies） */
  onOtherFlipS03:true,
  passive:{ onFlip(ctx){ return !!u520FanFlippedS03(ctx); } }
});

declareCardActivationFreeV32(['天狗のうちわ']);
