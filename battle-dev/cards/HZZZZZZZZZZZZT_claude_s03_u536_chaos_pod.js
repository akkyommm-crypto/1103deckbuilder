/* S03-U536: カオスポッド（1103対象の未実装カード。carddata のテキスト）。

   カオスポッド（効果モンスター・星3・岩石・闇・攻800/守700）
     リバース:フィールド上のモンスターを全て持ち主のデッキに加えてシャッフルする。
     その後、お互いのプレイヤーはそれぞれのデッキに加えた数と同じ数のモンスターが出るまでデッキをめくり、
     その中からレベル4以下のモンスターを全て裏側守備表示で特殊召喚する。
     それ以外のめくったカードは全て墓地へ捨てる。

   当時の裁定（この実装の根拠。推測ではない）
     WIKI-EE7F0FD9C805 破壊が確定している場合、このカオスポッド自身はデッキに戻さず、戻した枚数にも数えない
       → 解決時にモンスターゾーンに在るカードだけを戻す（戦闘破壊が確定した自身は既に場を離れている）。
     WIKI-40865A68CC06 持ち主の異なるモンスターは**元々の持ち主のデッキ**に戻り、その持ち主の枚数として数える
       → 戻し先と枚数は engine の returnToOwnerDeckOrExtra（cardOwnerIndex）の結果を**見てから**数える。
     WIKI-181C35842ACF 融合モンスターは融合（EX）デッキに戻るが、「デッキに戻ったモンスター」には数えない
       → 戻った後のゾーンが 'deck' のものだけを数える。
     WIKI-48E1E4F372AF 罠モンスターはデッキに戻るが、戻る時点で罠カードとして扱うので数えない
       → 戻った後の db（reset で asMonsterDbS03 が外れる）が k==='m' のものだけを数える。
     WIKI-8525D514E977 モンスタートークンはデッキに戻らずその場で消滅し、数えない
       → engine の FX_RETURN_DECK がトークンを消滅させる。戻り先が無いので数に入らない。
     WIKI-330E11853767 一枚も戻せないならカードをめくる必要が無い → 数が 0 のプレイヤーはめくらない。
     WIKI-2C139A4EDD50 特殊召喚できないモンスターや上級モンスターは墓地へ送られるが、めくった数には数える
       → めくる処理は「モンスターが出た数」で止め、出せないものは墓地へ捨てる。
     WIKI-D0DA5D38F294 裏側守備表示で特殊召喚できる数を超える場合は、出すカードを選び、残りのレベル4以下は墓地へ捨てる
       → 空いているモンスターゾーンの数を超えるときだけ、そのプレイヤー自身に選ばせる（ChoiceRequest）。
     WIKI-053C741FA707 この効果で裏側守備表示で特殊召喚したモンスターの表示形式は、そのターン自分の意思では変更できない
       → engine の {faceDown:true} が summonedTurn を記録する（S03-U136 と同じ経路）。
     WIKI-C713005AECCE（08/03/04）リバース効果なので強制的に発動する → forced:true。
     WIKI-9D5344BF8AAD（10/08/27）《大熱波》等で特殊召喚できないモンスターは墓地へ送られる
       → 1 体ずつ engine の特殊召喚の判定（canEffectSpecialSummonS03 / API.specialSummon）に通す。
     WIKI-A9AAB0C03493（07/12/10）デッキが空で無限ループになる場合はジャッジが効果処理を行わせない
       → ジャッジの介入は実装できないので、報告書の未対応に書いた。 */

function u536OwnerDeckMonsterS03(h){
  /* 戻った後の位置と db だけで判定する（WIKI-181C35842ACF / WIKI-48E1E4F372AF） */
  return !!(h && h.zone === 'deck' && h.db && h.db.k === 'm');
}
function u536FreeZonesS03(p){
  return Math.max(0, ZONE_LIMITS.mz - ((gameState.players[p] || {}).mz || []).length);
}
/* フィールドのモンスターを全て持ち主のデッキに戻し、各プレイヤーのデッキに戻った「モンスター」の数を返す */
function u536ReturnAllS03(){
  const uids = [];
  for(const q of [gameState.activePlayer, 1 - gameState.activePlayer]){
    for(const c of ((gameState.players[q] || {}).mz || [])){
      if(!c) continue;
      /* WIKI-EE7F0FD9C805: 破壊が確定しているカードは戻さず、戻した枚数にも数えない。
         engine の共通の判定（battleDestroyConfirmed = card.battleDestroyed）を使う。ダメージ計算後に
         解決するリバース効果の時点では、戦闘破壊はまだ BATTLE_CLEANUP で適用されていない。 */
      if(typeof battleDestroyConfirmed === 'function' && battleDestroyConfirmed(c)) continue;
      ensureCardUid(gameState, c); uids.push(c.uid);
    }
  }
  for(const uid of uids){
    const h = findCardByUid(uid);
    if(h && h.zone === 'mz') API.returnToDeck(h, false, 'カオスポッド');
  }
  const mons = [0, 0], any = [0, 0];
  for(const uid of uids){
    const h = findCardByUid(uid);
    if(!h || h.zone !== 'deck') continue;      /* トークンは消滅・EXデッキ・除外は数えない */
    any[h.p]++;
    if(u536OwnerDeckMonsterS03(h)) mons[h.p]++;
  }
  for(let p = 0; p < 2; p++) if(any[p] > 0) API.shuffle(p);
  return mons;
}
/* デッキの上から「モンスターが need 体出るまで」めくる。戻り値はめくったカードの uid（上から順） */
function u536RevealS03(p, need){
  const deck = ((gameState.players[p] || {}).deck || []);
  const uids = []; let mons = 0;
  for(let i = 0; i < deck.length && mons < need; i++){
    const c = deck[i]; if(!c) continue;
    ensureCardUid(gameState, c); uids.push(c.uid);
    if((dbOf(c) || {}).k === 'm') mons++;
  }
  return uids;
}
/* めくった中の「レベル4以下で特殊召喚できるモンスター」 */
function u536CandidatesS03(p, uids){
  const out = [];
  for(const uid of (uids || [])){
    const h = findCardByUid(uid);
    if(!h || h.zone !== 'deck' || h.p !== p || !h.db || h.db.k !== 'm') continue;
    if((Number(h.db.lv) || 99) > 4) continue;
    if(typeof canEffectSpecialSummonS03 === 'function'
       && !canEffectSpecialSummonS03(h.card, 'deck', 'カオスポッド', null)) continue;   /* WIKI-9D5344BF8AAD */
    out.push(h);
  }
  return out;
}
/* 選ばれたものを裏側守備表示で特殊召喚し、残りのめくったカードは全て墓地へ捨てる */
function u536PutS03(p, pickUids, revealUids){
  for(const uid of (pickUids || [])){
    const h = findCardByUid(uid);
    if(!h || h.zone !== 'deck' || h.p !== p || !hasMonsterZoneSpace(p)) continue;
    API.specialSummon(p, 'deck', h.index, 'def', 'カオスポッド', p, {faceDown:true});   /* WIKI-053C741FA707 */
  }
  /* WIKI-2C139A4EDD50: 出せなかったものも含めて、めくった残りは墓地へ */
  for(const uid of (revealUids || [])){
    const h = findCardByUid(uid);
    if(h && h.zone === 'deck' && h.p === p) API.mill(p, h.index, 'カオスポッド（めくったカード）');
  }
}
/* プレイヤーを順に処理する。選択が必要な場面だけ中断し、継続ハンドラが残りを進める */
function u536RunS03(queue){
  const q = Array.isArray(queue) ? queue.slice() : [];
  while(q.length){
    const job = q.shift() || {};
    const p = (job.p === 0 || job.p === 1) ? job.p : 0, need = Number(job.need) || 0;
    if(need <= 0) continue;
    const revealUids = u536RevealS03(p, need);
    if(!revealUids.length) continue;
    API.log(`カオスポッド：${nameOf(p)}はデッキから ${revealUids.length} 枚をめくった`);
    const cand = u536CandidatesS03(p, revealUids);
    const free = u536FreeZonesS03(p);
    if(cand.length > free && free > 0){
      /* WIKI-D0DA5D38F294: 出せる数を超える場合は、そのプレイヤーが出すカードを選ぶ */
      const opened = API.requestChoice({player:p, kind:'card',
        title:'カオスポッド：裏側守備表示で特殊召喚するモンスター', candidates:cand,
        min:free, max:free, cancelable:false,
        resume:{handler:'s03u536.pick', args:{player:p, revealUids:revealUids.slice(), queue:q.slice()}}});
      if(opened) return;
    }
    u536PutS03(p, cand.slice(0, free).map(h=>h.card.uid), revealUids);
  }
}
API.registerChoiceHandler('s03u536.pick', (answer, args)=>{
  const picked = ((answer && answer.cards) || [])
    .filter(x=>x && !x.stale && x.card)
    .map(x=>(x.uid != null) ? x.uid : (x.card ? x.card.uid : null))
    .filter(u=>u != null);
  u536PutS03(args.player, picked, args.revealUids);
  u536RunS03(args.queue || []);
});

defineUnifiedCardV4('カオスポッド', [{
  key:'flip-pod', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onFlip'],
  condition(ctx){ return v44FlipSelfCondition(ctx); },
  operation(ctx){
    /* WIKI-EE7F0FD9C805: 解決時にモンスターゾーンに在るモンスターだけを戻す */
    const mons = u536ReturnAllS03();
    const order = [gameState.activePlayer, 1 - gameState.activePlayer];
    const queue = order.filter(p=>mons[p] > 0).map(p=>({p:p, need:mons[p]}));
    if(!queue.length){
      /* WIKI-330E11853767: 一枚も戻せないならめくらない */
      API.log('カオスポッド：デッキに戻ったモンスターが無いため、デッキをめくらない');
      return;
    }
    u536RunS03(queue);
  },
  afterResolve(){}
}], {
  type:'monster', priority:1, forced:true,                 /* WIKI-C713005AECCE: リバース効果は強制 */
  passive:{ onFlip(ctx){ return ctx.zone === 'mz'; } }
});
