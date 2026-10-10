/* Auto cycle 40 — 4枚。engine 変更なし・新規 primitive なし。
     召喚／特殊召喚の成功を起点にする誘発を、実テキストどおりに組む。
   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */

function e9MyTurn(p){ return gameState.activePlayer === p; }

function e9FaceUpMz(ctx){
  const me = locateCardAnyV4(ctx.card);
  return !!(me && me.zone === 'mz' && me.card.face === 'up');
}

/* このカード自身が召喚・特殊召喚・反転召喚に成功した時か。
   queueDeferredEventV2 は card を uid へ落とすので、両方の形を見る。 */
function e9SelfSummoned(ctx){
  const e = ctx.event || {};
  if(Array.isArray(e.cards)) return e.cards.indexOf(ctx.card) >= 0;
  if(e.card) return e.card === ctx.card;
  if(e.uid != null && ctx.card.uid != null) return e.uid === ctx.card.uid;
  return false;
}

/* ===================== 1. 闇帝ディルグ =====================
   このカードが召喚・特殊召喚に成功した時、相手の墓地に存在するカードを
   2枚までゲームから除外する事ができる。
   さらに、除外した数だけ相手のデッキの上からカードを墓地へ送る。
   このカードは召喚・特殊召喚したターンには攻撃する事ができない。 */
API.registerChoiceHandler('e9.dirug', (answer, args) => {
  if(!answer || answer.cancelled) return;
  const foe = (args && (args.opponent === 0 || args.opponent === 1)) ? args.opponent : 1;
  let n = 0;
  ((answer.cards) || []).slice(0, 2).forEach(t => {
    const r = resolveTarget(t);
    if(r && r.zone === 'grave'){ API.banish(r, '闇帝ディルグ'); n++; }
  });
  if(n <= 0) return;
  const m = Math.min(n, (gameState.players[foe].deck || []).length);
  if(m > 0) API.millTop(foe, m, '闇帝ディルグ');
});
defineScript('闇帝ディルグ', {
  type:'monster', priority:1, activateFrom:['mz'],
  condition(ctx){
    if(!e9SelfSummoned(ctx)){
      ctx.reason = '召喚・特殊召喚に成功した時に発動します'; return false; }
    if(!API.pileCards(ctx.opponent, 'grave').length){
      ctx.reason = '相手の墓地にカードがありません'; return false; }
    return true;
  },
  resolve(ctx){
    const q = API.pileCards(ctx.opponent, 'grave');
    if(!q.length) return;
    API.requestChoice({
      player: ctx.player, kind:'card', cancelable:true, min:0, max:2,
      title:'闇帝ディルグ：ゲームから除外する相手の墓地のカード（2枚まで）',
      candidates: q,
      resume:{ handler:'e9.dirug', args:{ opponent:ctx.opponent } },
      meta:{ scriptName:'闇帝ディルグ' }
    });
  },
  afterResolve(){},
  passive:{
    onNormalSummon(ctx){
      return e9SelfSummoned(ctx) && API.pileCards(ctx.opponent, 'grave').length > 0; },
    onSpecialSummon(ctx){
      return e9SelfSummoned(ctx) && API.pileCards(ctx.opponent, 'grave').length > 0; }
  },
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    /* 「召喚・特殊召喚したターンには攻撃できない」。セットからの反転は含まない。 */
    cannotAttack(card, self){
      return card === self && Number(self.summonedTurn) === gameState.turn;
    }
  }
});

/* ===================== 2. 異次元への案内人 =====================
   このカードの召喚に成功した時、このカードのコントロールは相手に移る。
   エンドフェイズ毎に、相手はこのカードのコントローラーの墓地から
   カード1枚を選択しゲームから除外する。 */
API.registerChoiceHandler('e9.guide', (answer) => {
  if(!answer || answer.cancelled) return;
  const picked = (answer.cards && answer.cards[0]) || null;
  const r = picked && resolveTarget(picked);
  if(r && r.zone === 'grave') API.banish(r, '異次元への案内人');
});
/* コントロールを移すのは「召喚に成功した時」の1回だけ。 */
function e9GuideMoving(ctx){
  return ctx.zone === 'mz' && e9SelfSummoned(ctx)
      && Number(ctx.card.e9GuideMoved || 0) === 0;
}
/* エンドフェイズの除外。選ぶのはコントローラーの相手。 */
function e9GuideEndPhase(ctx){
  const me = locateCardAnyV4(ctx.card);
  if(!me || me.zone !== 'mz') return null;
  if(Number(ctx.card.e9GuideMoved || 0) === 0) return null;
  const owner = me.p;
  const q = API.pileCards(owner, 'grave');
  if(!q.length) return null;
  return { owner:owner, chooser:(owner === 0 ? 1 : 0), pile:q };
}
defineScript('異次元への案内人', {
  type:'monster', priority:1, forced:true, activateFrom:['mz'],
  timing:['free','endPhase'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz'){
      ctx.reason = 'モンスターゾーンに存在する必要があります'; return false; }
    if(e9GuideMoving(ctx)) return true;
    if(gameState.phase !== 'end'){
      ctx.reason = 'エンドフェイズに処理します'; return false; }
    if(!e9GuideEndPhase(ctx)){
      ctx.reason = 'コントローラーの墓地にカードがありません'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    if(e9GuideMoving(ctx)){
      API.setCardFlag(me, 'e9GuideMoved', 1, '異次元への案内人');
      API.changeControl(me, me.p === 0 ? 1 : 0, '異次元への案内人');
      return;
    }
    const info = e9GuideEndPhase(ctx);
    if(!info) return;
    API.requestChoice({
      player: info.chooser, kind:'card', cancelable:false, min:1, max:1,
      title:'異次元への案内人：ゲームから除外するカードを選択',
      candidates: info.pile,
      resume:{ handler:'e9.guide', args:{} },
      meta:{ scriptName:'異次元への案内人' }
    });
  },
  afterResolve(){},
  passive:{
    onNormalSummon(ctx){ return e9GuideMoving(ctx); },
    onEndPhase(ctx){ return ctx.zone === 'mz' && !!e9GuideEndPhase(ctx); }
  }
});

/* ===================== 3. 召喚の呪詛（永続魔法） =====================
   このカードのコントローラーは自分のエンドフェイズ毎に500ライフポイントを払う。
   または、500ライフポイント払わずにこのカードを破壊する。
   このカードがフィールド上に存在する場合にモンスターが特殊召喚に成功した時、
   そのモンスターのコントローラーは手札を1枚選択してゲームから除外する。 */
API.registerChoiceHandler('e9.curseUpkeep', (answer, args) => {
  const p = (args && (args.player === 0 || args.player === 1)) ? args.player : 0;
  const key = (answer && answer.keys && answer.keys[0]) || 'destroy';
  if(key === 'pay'){ API.payCost(p, 500); return; }
  const h = (args && args.uid != null) ? findCardByUid(args.uid) : null;
  if(h && h.zone === 'sz') API.destroy(h, '召喚の呪詛', p);
});
API.registerChoiceHandler('e9.curseBanish', (answer) => {
  if(!answer || answer.cancelled) return;
  const picked = (answer.cards && answer.cards[0]) || null;
  const r = picked && resolveTarget(picked);
  if(r && r.zone === 'hand') API.banish(r, '召喚の呪詛');
});
/* 特殊召喚に成功したモンスターのうち、手札を持つコントローラーを1人返す。 */
function e9CurseVictim(ctx){
  const cards = b2SummonedCards(ctx.event);
  for(const c of cards){
    const h = locateCardAnyV4(c);
    if(!h || h.zone !== 'mz') continue;
    if(API.pileCards(h.p, 'hand').length) return h.p;
  }
  return null;
}
function e9CurseOnField(ctx){
  return ctx.zone === 'sz' && ctx.card.face === 'up';
}
defineScript('召喚の呪詛', {
  type:'spell', priority:1, forced:true, onOtherSummon:true,
  activateFrom:['sz'], timing:['free','endPhase'],
  condition(ctx){
    if(!e9CurseOnField(ctx)){
      ctx.reason = '表側表示で魔法＆罠ゾーンに存在する必要があります'; return false; }
    if(gameState.phase === 'end' && e9MyTurn(ctx.player)) return true;
    if(e9CurseVictim(ctx) == null){
      ctx.reason = 'モンスターが特殊召喚に成功した時に処理します'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(gameState.phase === 'end' && e9MyTurn(ctx.player)){
      if(!me || me.zone !== 'sz') return;
      const opts = [{ key:'destroy', value:'destroy', label:'払わずにこのカードを破壊する' }];
      if(API.me(ctx).lp > 500)
        opts.unshift({ key:'pay', value:'pay', label:'500ライフポイントを払う' });
      API.requestChoice({
        player: ctx.player, kind:'option', cancelable:false, min:1, max:1,
        title:'召喚の呪詛：維持コスト',
        candidates: opts,
        resume:{ handler:'e9.curseUpkeep',
                 args:{ player:ctx.player, uid:ensureCardUid(gameState, me.card) } },
        meta:{ scriptName:'召喚の呪詛' }
      });
      return;
    }
    const victim = e9CurseVictim(ctx);
    if(victim == null) return;
    const q = API.pileCards(victim, 'hand');
    if(!q.length) return;
    /* 選ぶのは特殊召喚したモンスターのコントローラー本人。 */
    API.requestChoice({
      player: victim, kind:'card', cancelable:false, min:1, max:1,
      title:'召喚の呪詛：ゲームから除外する自分の手札を選択',
      candidates: q,
      resume:{ handler:'e9.curseBanish', args:{} },
      meta:{ scriptName:'召喚の呪詛' }
    });
  },
  afterResolve(){},
  passive:{
    onSpecialSummon(ctx){
      return e9CurseOnField(ctx) && e9CurseVictim(ctx) != null; },
    onEndPhase(ctx){
      return e9CurseOnField(ctx) && e9MyTurn(ctx.player); }
  }
});

/* ===================== 4. アルカナフォース0－THE FOOL =====================
   このカードは戦闘では破壊されず、表示形式を守備表示に変更できない。
   このカードが召喚・反転召喚・特殊召喚に成功した時、コイントスを1回行い、
   その裏表によって以下の効果を得る。
   ●表: このカードを対象にする自分のカードの効果を無効にし破壊する。
   ●裏: このカードを対象にする相手のカードの効果を無効にし破壊する。 */
function e9FoolCoin(ctx){ return Number(ctx.card.e9FoolCoin || 0); }
/* 表(1)なら自分のカード、裏(2)なら相手のカードを無効にする。 */
function e9FoolSide(ctx){
  const coin = e9FoolCoin(ctx);
  if(coin === 1) return ctx.player;
  if(coin === 2) return ctx.opponent;
  return null;
}
function e9FoolTargetedBy(ctx, byPlayer){
  const e = ctx.event || {};
  if(e.player !== byPlayer) return false;
  if(e.chainId == null) return false;
  const me = locateCardAnyV4(ctx.card);
  if(!me || me.zone !== 'mz') return false;
  return (API.activationTargets(e) || []).some(t => t && t.card === ctx.card);
}
defineScript('アルカナフォース0－THE FOOL', {
  type:'monster', priority:3, forced:true, activateFrom:['mz'],
  timing:['free','chain'],
  condition(ctx){
    if(!e9FaceUpMz(ctx)){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(e9SelfSummoned(ctx) && e9FoolCoin(ctx) === 0) return true;
    const side = e9FoolSide(ctx);
    if(side == null){ ctx.reason = 'コイントスの結果が決まっていません'; return false; }
    if(!e9FoolTargetedBy(ctx, side)){
      ctx.reason = 'このカードを対象にする効果の発動時に処理します'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    if(e9SelfSummoned(ctx) && e9FoolCoin(ctx) === 0){
      const coin = duelRandomInt(2, gameState) === 0 ? 1 : 2;
      API.log('アルカナフォース0－THE FOOL：コイントスは' + (coin === 1 ? '表' : '裏'));
      API.setCardFlag(me, 'e9FoolCoin', coin, 'アルカナフォース0－THE FOOL');
      return;
    }
    const e = ctx.event || {};
    if(e.chainId != null)
      API.negateChainLink(e.chainId, 'activation', 'アルカナフォース0－THE FOOL', true);
  },
  afterResolve(){},
  passive:{
    onNormalSummon(ctx){
      return e9FaceUpMz(ctx) && e9SelfSummoned(ctx) && e9FoolCoin(ctx) === 0; },
    onSpecialSummon(ctx){
      return e9FaceUpMz(ctx) && e9SelfSummoned(ctx) && e9FoolCoin(ctx) === 0; },
    onFlip(ctx){
      return e9FaceUpMz(ctx) && e9SelfSummoned(ctx) && e9FoolCoin(ctx) === 0; },
    onActivateSuccess(ctx){
      const side = e9FoolSide(ctx);
      return side != null && e9FaceUpMz(ctx) && e9FoolTargetedBy(ctx, side); }
  },
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    protectV21:{
      key:'アルカナフォース0－THE FOOL', label:'アルカナフォース0－THE FOOL',
      battle:(target, self) => target === self, effect:false
    },
    /* 「表示形式を守備表示に変更できない」＝攻撃表示からは動かせない。 */
    cannotChangePosition(card, self){
      return card === self && self.face === 'up' && self.pos === 'atk';
    }
  }
});
