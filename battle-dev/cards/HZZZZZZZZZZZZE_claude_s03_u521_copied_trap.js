/* S03-U521: 闇よりの罠（1103対象の未実装カード。carddata のテキスト）。

   闇よりの罠（通常罠）
     ①:自分LPが3000以下の時、1000LPを払い、「闇よりの罠」以外の自分の墓地の通常罠カード1枚を対象として
     発動できる。このカードの効果は、その墓地の通常罠カード発動時の効果と同じになる。
     その後、その墓地の通常罠カードを除外する。

   当時の裁定（この実装の根拠。推測ではない）
     WIKI-0503968039BC（08/08/25）墓地の罠カードを**対象に取る**効果である。
     WIKI-9AE0A5CB7D81（回答日なし）墓地の罠カードを選ぶのは**カードの発動時**。
     WIKI-94EA0CA95399（10/04/13）《強制脱出装置》のように対象を指定する罠を複製した場合、
       その罠の対象も「《闇よりの罠》を発動し墓地の罠を対象に選択した時」に選ぶ。
     WIKI-2CF8CB52445A（回答日なし）選択した罠カードのコストを払う必要は**ない**。
     WIKI-B458649D4609（10/08/01）《生存本能》などコストに応じて効果が変動する通常罠は**使えない**
       → 宣言表（U521_COPY_BLOCKED_S03）で候補から外す。根拠はこの裁定だけで、他は外さない。
     WIKI-DA2CD0377F38（10/04/13）効果処理時に対象の通常罠が墓地に無い場合、除外できないので
       **《闇よりの罠》の効果は適用されない**。
     WIKI-BB9A0BE15C4B（08/08/25）《くず鉄のかかし》を対象にすると、再びセットする事ができる
       → 「発動時の効果」が afterResolve に書かれているこのカードだけ、宣言表で afterResolve も実行する。
     WIKI-823265DCF017（10/08/02）複製した破壊効果にチェーンして《スターダスト・ドラゴン》等を発動できる
       → 通常のチェーン上の効果として解決する（この実装では《闇よりの罠》自身の解決として実行する）。
     WIKI-AF3464450C52（10/08/01）LP2000 対 8000 で《自爆スイッチ》を対象にお互いを 0 にはできない
       → 《自爆スイッチ》当時テキストの条件は「7000ポイント以上少ない」で、6000 差では満たさない。
         参照した罠自身の condition を発動時に見るので、この答えは宣言表なしで再現される。

   未対応（この単位では直していない。測って確認した残り）
     WIKI-D40DED072699 / WIKI-0995DB1DEA27: 《鎖付き爆弾》《鎖付きブーメラン》を対象にした場合、
     装備カードになる部分は適用されない（墓地のそのカードは除外される）。この 2 枚は engine 側の
     ENGINE_GAP でスクリプトが無く、候補にもならないので、現在の盤面では到達しない。
     スクリプトが入った時に「装備部分を適用しない」宣言が必要になる（後続課題として記録する）。 */

/* 参照できない通常罠（当時裁定で名指しされているものだけ） */
const U521_COPY_BLOCKED_S03 = {
  '生存本能': 'WIKI-B458649D4609'   /* コストに応じて効果が変動する */
};
/* 「発動時の効果」が afterResolve に書かれているカード（当時裁定で複製できると答えられているものだけ） */
const U521_COPY_AFTER_RESOLVE_S03 = {
  'くず鉄のかかし': 'WIKI-BB9A0BE15C4B'
};

function u521IsNormalTrapDbS03(db){ return !!db && db.k === 't' && !db.sub; }
function u521CopyScriptS03(name){
  if(U521_COPY_BLOCKED_S03[name]) return null;
  const sc = CARD_SCRIPTS[name];
  return (sc && typeof sc.resolve === 'function') ? sc : null;
}
/* 参照できる墓地の通常罠。参照した罠自身の condition も発動時に見る（自爆スイッチの裁定）。 */
function u521CopyPoolS03(ctx){
  return API.pileCards(ctx.player, 'grave', x=>{
    if(!u521IsNormalTrapDbS03(x.db)) return false;
    const nm = x.db.n;
    if(nm === '闇よりの罠') return false;
    const sc = u521CopyScriptS03(nm);
    if(!sc) return false;
    if(typeof sc.condition !== 'function') return true;
    let ok = false;
    try{ ok = !!sc.condition(Object.assign({}, ctx, {reason:undefined})); }catch(e){ ok = false; }
    return ok;
  });
}
/* 参照した罠の効果を、このカードの解決として実行する。「このカード」は《闇よりの罠》を指す。 */
function u521RunCopiedS03(ctx, name, refTargets){
  const sc = u521CopyScriptS03(name);
  if(!sc) return false;
  const sub = Object.assign({}, ctx, {selectedTargets:(refTargets || []).slice()});
  try{ sc.resolve(sub); }catch(e){ API.log(`闇よりの罠：「${name}」の効果を処理できなかった`); return false; }
  if(U521_COPY_AFTER_RESOLVE_S03[name] && typeof sc.afterResolve === 'function'){
    try{ sc.afterResolve(sub); }catch(e){}
  }
  return true;
}

defineScript('闇よりの罠', {
  type:'trap', priority:2, targets:true,
  condition(ctx){
    if(API.me(ctx).lp > 3000){ ctx.reason = '自分のLPが3000以下の時に発動できます'; return false; }
    if(API.me(ctx).lp < 1000){ ctx.reason = '1000LPを払えません'; return false; }
    if(!u521CopyPoolS03(ctx).length){ ctx.reason = '効果を複製できる墓地の通常罠カードがありません'; return false; }
    return true;
  },
  /* WIKI-0503968039BC / WIKI-9AE0A5CB7D81: 墓地の罠は発動時に対象として選ぶ。
     WIKI-94EA0CA95399: 複製する罠自身の対象も、この時に選ぶ。 */
  selectTargets(ctx, done){
    API.selectCard('闇よりの罠：効果を複製する墓地の通常罠カード', u521CopyPoolS03(ctx), t=>{
      const r = resolveTarget(t);
      if(!r || r.zone !== 'grave'){ done([]); return; }
      const sc = u521CopyScriptS03(r.db ? r.db.n : cardName(r.card));
      if(!sc || typeof sc.selectTargets !== 'function'){ done([t]); return; }
      /* 参照した罠の selectTargets は選択を開く（非同期）ものが多い。ここで即座に done を呼ぶと
         その罠の対象が入らないまま発動が確定してしまうので、コールバックだけを待つ。
         同期的に done を呼ぶ罠（くず鉄のかかし）は、その場で called が立つ。 */
      let called = false;
      const cb = list=>{ if(called) return; called = true; done([t].concat(Array.isArray(list) ? list : [])); };
      try{ sc.selectTargets(ctx, cb); }catch(e){ cb([]); }
    });
  },
  /* コストは 1000LP だけ。複製する罠のコストは払わない（WIKI-2CF8CB52445A）。 */
  cost(ctx, done){
    if(API.me(ctx).lp < 1000){ showToast('LPが足りません'); done(false); return; }
    API.payCost(ctx.player, 1000);
    done(true);
  },
  resolve(ctx){
    const picked = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = picked && resolveTarget(picked);
    /* WIKI-DA2CD0377F38（10/04/13）: 解決時に墓地に無ければ、除外できないので効果は適用されない。 */
    if(!r || r.zone !== 'grave'){ API.log('闇よりの罠：対象の通常罠カードが墓地に無いため効果は適用されない'); return; }
    const name = cardName(r.card);
    API.log(`闇よりの罠：「${name}」の発動時の効果と同じになる`);
    u521RunCopiedS03(ctx, name, (ctx.selectedTargets || []).slice(1));
    const now = resolveTarget(picked);
    if(now && now.zone === 'grave') API.banish(now, '闇よりの罠');
  },
  afterResolve(){}
});
