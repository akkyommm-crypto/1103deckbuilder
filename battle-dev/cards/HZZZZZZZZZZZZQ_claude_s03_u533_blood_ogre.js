/* S03-U533: 血涙のオーガ（1103対象の未実装カード。carddata のテキスト）。

   血涙のオーガ（効果・星4・悪魔・闇・攻0/守0）
     相手ターンの1度のバトルフェイズ中に2回目の直接攻撃が宣言された時、このカードを手札から
     特殊召喚する事ができる。
     この効果で特殊召喚に成功した時、このカードの攻撃力・守備力はこのターンに1回目の直接攻撃を行った、
     フィールド上に表側表示で存在するモンスターと同じ数値になる。
     このターン、この効果で特殊召喚したこのカードがフィールド上に表側表示で存在する限り、
     相手はこのカード以外のモンスターを攻撃対象に選択する事はできない。

   当時の裁定（この実装の根拠。推測ではない）
     WIKI-BF4C6CA54276（09/11/14）効果分類: 特殊召喚＝誘発効果、数値変動＝誘発効果、
       攻撃対象の選択制限＝永続効果。
     WIKI-CA335BBCDE3B（09/11/14）必ず「2回目」の直接攻撃宣言時に発動する（3回目では発動できない）。
     WIKI-282E13E4E6E2（09/11/14）無効にされた攻撃は数えない（無効にされた1回目の次が「1回目」になる）
       → 共通側の記録（engine/00 の gs.directAttacksS03）から、無効にされた宣言は取り除く。
     WIKI-9CAF81C756A1（09/12/15）1回目の直接攻撃は成功しなくてよい。
     WIKI-731D9CDDB279（09/11/14）1回目と2回目が同じモンスターでも特殊召喚できる。
     WIKI-36090A25C709（09/11/14）1回目のモンスターが場に居なくても特殊召喚自体はできる /
     WIKI-74A968D14816（09/11/14）その場合、数値は変化せず 0 のまま。
     WIKI-4FF24E124B14（09/12/09）数値を同じにする効果は**対象を取らない**。
     WIKI-B7D547F31F70（09/12/12）変化した値は「元々の数値」にはならない → set の層（setAtk / setDef）で持つ。
     WIKI-F71F9DD0C8A9（09/12/12）自分フィールドにモンスターが居るかは不問。
     WIKI-4DE60F5423BC（09/12/09）《バトルフェーダー》とは同一チェーン上でどちらか1枚しか発動できない
       → 同じチェーンに「直接攻撃宣言時に手札から特殊召喚する」効果が既にあれば発動できない。
     WIKI-BC9289B6A098（11/06/13）1回目のモンスターの攻撃力が後から変化していた場合は調整中
       → この実装は解決時の数値を見る（報告書の未対応に書いた）。 */

/* このバトルフェイズに宣言された（無効にされていない）直接攻撃の記録 */
function u533DirectsS03(){
  const r = (typeof gameState !== 'undefined' && gameState) ? gameState.directAttacksS03 : null;
  if(!r || Number(r.turn) !== Number(gameState.turn) || !Array.isArray(r.list)) return [];
  return r.list;
}
/* 今が「2回目の直接攻撃の宣言時」か（攻撃宣言の窓で、宣言済みがちょうど 2 件） */
function u533SecondDirectNowS03(ctx){
  const list = u533DirectsS03();
  if(list.length !== 2) return false;
  const last = list[list.length - 1];
  if(!last || last.player !== ctx.opponent) return false;      /* 相手の直接攻撃 */
  const w = gameState.timingWindow;
  if(!w || w.kind !== 'attackDeclare' || Number(w.turn) !== Number(gameState.turn)) return false;
  return true;
}
/* 1回目の直接攻撃を行ったモンスター（今フィールドに表側表示で居る場合だけ） */
function u533FirstAttackerS03(){
  const list = u533DirectsS03();
  if(list.length < 1) return null;
  const uid = list[0] && list[0].uid;
  if(uid == null) return null;
  const h = findCardByUid(uid);
  if(!h || h.zone !== 'mz' || h.card.face !== 'up') return null;
  return h;
}
/* WIKI-4DE60F5423BC: 同じチェーンに「直接攻撃宣言時に手札から特殊召喚する」効果が既にあるか */
const U533_DIRECT_SS_NAMES = Object.freeze(['血涙のオーガ', 'バトルフェーダー']);
function u533SameChainS03(){
  const ch = Array.isArray(gameState.chain) ? gameState.chain : [];
  return ch.some(l=>l && U533_DIRECT_SS_NAMES.indexOf(l.name) >= 0);
}
function u533SummonedByOwnEffectS03(ctx){
  const e = ctx.event || {};
  const self = e.card === ctx.card || (Array.isArray(e.cards) && e.cards.indexOf(ctx.card) >= 0)
               || (e.uid != null && ctx.card && e.uid === ctx.card.uid);
  return !!self && ctx.zone === 'mz' && !!ctx.card && Number(ctx.card.u533PendingS03) === Number(gameState.turn);
}

defineUnifiedCardV4('血涙のオーガ', [{
  /* 2回目の直接攻撃が宣言された時、手札から特殊召喚する */
  key:'hand-special', type:EFFECT_TYPE.IGNITION, range:LOCATION.HAND, speed:2, events:['activate'],
  condition(ctx){
    if(ctx.zone !== 'hand'){ ctx.reason = '手札から発動します'; return false; }
    if(gameState.activePlayer !== ctx.opponent){ ctx.reason = '相手のターンに発動します'; return false; }
    if(!u533SecondDirectNowS03(ctx)){ ctx.reason = '2回目の直接攻撃が宣言された時に発動します'; return false; }
    if(u533SameChainS03()){ ctx.reason = 'このチェーンでは既に同じ種類の効果を発動しています'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  operation(ctx){
    const h = locateCardAnyV4(ctx.card);
    if(!h || h.zone !== 'hand' || h.p !== ctx.player) return;
    if(!hasMonsterZoneSpace(ctx.player)) return;
    API.specialSummon(ctx.player, 'hand', h.index, 'atk', '血涙のオーガ');
    const now = locateCardAnyV4(ctx.card);
    if(now && now.zone === 'mz')
      API.setCardFlag(now, 'u533PendingS03', gameState.turn, '血涙のオーガ（この効果で特殊召喚）', {silent:true});
  },
  afterResolve(){}
}, {
  /* この効果で特殊召喚に成功した時、攻守は 1 回目の直接攻撃を行ったモンスターと同じ数値になる */
  key:'copy-stats', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'], forced:true,
  condition(ctx){ return u533SummonedByOwnEffectS03(ctx); },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    /* WIKI-36090A25C709 / WIKI-74A968D14816: 1 回目のモンスターが居なければ数値は変わらない（0 のまま）。 */
    const first = u533FirstAttackerS03();
    if(!first){ API.log('血涙のオーガ：1回目の直接攻撃を行ったモンスターがフィールドに居ないため数値は変わらない'); return; }
    const atk = API.curAtk(first), def = curDEF(first.card);
    /* WIKI-B7D547F31F70: 変化した値は「元々の数値」にはならない（set の層で持つ）。 */
    API.setCardFlag(me, 'u533StatS03', {atk:Number(atk) || 0, def:Number(def) || 0},
                    '血涙のオーガ（1回目の直接攻撃のモンスターと同じ数値）', {silent:true});
    API.log(`血涙のオーガ：攻守は ${Number(atk) || 0} / ${Number(def) || 0} になる`);
  },
  afterResolve(){}
}], {
  type:'monster', priority:1, speed:2, quickEffect:true, activateFrom:['hand'],
  includesSpecialSummon:true,
  blocksIfNoSpecialSummon(ctx){ return !!ctx && ctx.zone === 'hand'; },
  continuous:{
    scope:'ownMonsters', from:['mz'],
    /* 数値は set の層で持つ（元々の数値は変えない） */
    apply(card, self){
      if(card !== self) return null;
      const st = self.u533StatS03;
      if(!st) return null;
      return {setAtk:Number(st.atk) || 0, setDef:Number(st.def) || 0};
    },
    /* このターン、このカードが表側表示で存在する限り、相手はこのカード以外を攻撃対象に選択できない */
    cannotBeAttackTarget(target, self){
      if(!self || self.face !== 'up' || Number(self.u533PendingS03) !== Number(gameState.turn)) return false;
      return target !== self;
    }
  }
});
