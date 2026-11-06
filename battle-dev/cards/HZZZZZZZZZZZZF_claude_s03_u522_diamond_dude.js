/* S03-U522: D－HERO ダイヤモンドガイ（1103対象の未実装カード。carddata のテキスト）。

   D－HERO ダイヤモンドガイ（闇・戦士・星4・攻1400/守1600）
     ①:1ターンに1度、自分メインフェイズに発動できる。自分のデッキの一番上のカードをめくり、
     それが通常魔法カードだった場合、そのカードを墓地へ送る。違った場合、そのカードをデッキの一番下に戻す。
     この効果で通常魔法カードを墓地へ送った場合、次の自分ターンのメインフェイズに
     墓地のその通常魔法カードの発動時の効果を発動できる。

   当時の裁定（この実装の根拠。推測ではない）
     WIKI-D82AA70AF049（回答日なし）この効果は**起動効果**なので自分のターンにしか使えない。
     WIKI-EF0F11F0F5B7（06/02/16）次の自分のターンにこのカードが場に無くても処理する
       → 許可はプレイヤーに持たせる（engine/1ZZZA の effectFlags.graveActGrantS03）。
     WIKI-7C1EE634F520（06/02/16）その通常魔法の効果を発動しない事もでき、それ以降のターンには使えない
       → 許可にターンを刻み、そのターンだけ有効にする。
     WIKI-0855121F0A77（06/02/16）次の自分のメインフェイズならいつでもよい。
     WIKI-4FC1C763D881（06/02/16）複数枚めくった場合は複数枚発動できる → 許可は一覧で持つ。
     WIKI-F23294BA0134（06/02/16）その効果は**魔法効果**（効果モンスターの効果ではない）。
     WIKI-3FFD3A9DA6A1（11/06/09）/ WIKI-2704AA2D7864（09/12/02）相手はその発動に対して
       《偽物のわな》《スターライト・ロード》を発動できる
       → 墓地のそのカードを**本当に発動させる**（from:'grave' のチェーンリンク）。
         コスト・条件・対象・発動後の処理はその魔法自身のスクリプトがそのまま行うので、
         WIKI-86EA1BB93851（《突然変異》《孵化》はコストのモンスターがいないので発動できない）、
         WIKI-BFCE21FB743B（09/05/21 《おジャマジック》《コアキメイルの鋼核》は発動できない）、
         WIKI-9D5E2C663C65 / WIKI-60F096512877（07/06/23 《大寒波》は自分のメインフェイズ1開始時だけ）、
         WIKI-F0019AA85753（《名推理》では相手がレベルを宣言する）、
         WIKI-2B997EAF1558（08/05/17 《簡易融合》で出したモンスターは通常どおり自壊する）も
         その魔法自身の実装がそのまま決める。
     WIKI-62E4A0F1CA35（06/02/16）/ WIKI-79BFDC6BED27 その通常魔法が墓地を離れていると発動できない
       → 許可は uid で引くので、墓地に無ければ働かない。
     WIKI-A38C1B14F167（10/02/15）発動にチェーンして墓地のその魔法が除外されても効果は適用される
       → チェーンリンクは独立して解決する（墓地のカードを動かさない発動なので、そのまま適用される）。

   未対応（この単位では直していない）
     めくったカードを相手にも見せる処理は、ログに名前を出すだけにしている（公開情報の持ち方は engine 側の課題）。 */

function u522DiamondMainS03(ctx){
  if(ctx.zone !== 'mz' || !ctx.card || ctx.card.face !== 'up') return false;
  if(ctx.player !== gameState.activePlayer) return false;
  return gameState.phase === 'main1' || gameState.phase === 'main2';
}
function u522IsNormalSpellDbS03(db){ return !!db && db.k === 's' && !db.sub; }

defineUnifiedCardV4('D－HERO ダイヤモンドガイ', [{
  key:'excavate', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  /* WIKI-D82AA70AF049: 起動効果なので自分のターンだけ。1ターンに1度は countLimit。 */
  condition(ctx){
    if(!u522DiamondMainS03(ctx)){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!API.me(ctx).deck.length){ ctx.reason = 'デッキが残っていません'; return false; }
    return true;
  },
  operation(ctx){
    const P = API.me(ctx), top = P.deck[0];
    if(!top) return;
    const db = dbOf(top), nm = cardName(top);
    ensureCardUid(gameState, top);
    if(u522IsNormalSpellDbS03(db)){
      const uid = top.uid;
      act({type:'MOVE', player:ctx.player, from:'deck', fromIndex:0, to:'grave', reason:'D－HERO ダイヤモンドガイ'});
      API.log(`D－HERO ダイヤモンドガイ：デッキの一番上「${nm}」は通常魔法 → 墓地へ送る`);
      /* 「次の自分ターンのメインフェイズ」= このターンの 2 つ後（自分の次の手番）。 */
      grantGraveActivationS03(ctx.player, uid, Number(gameState.turn) + 2);
      API.log(`D－HERO ダイヤモンドガイ：次の自分のメインフェイズに「${nm}」の発動時の効果を発動できる`);
      return;
    }
    act({type:'MOVE', player:ctx.player, from:'deck', fromIndex:0, to:'deck', deckPos:'bottom', reason:'D－HERO ダイヤモンドガイ'});
    API.log(`D－HERO ダイヤモンドガイ：デッキの一番上「${nm}」は通常魔法ではない → デッキの一番下へ`);
  },
  afterResolve(){}
}], {type:'monster', priority:1, countLimit:1, timing:['mainPhase']});
