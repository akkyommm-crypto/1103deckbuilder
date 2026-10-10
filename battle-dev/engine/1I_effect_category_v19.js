/* =========================================================================
   System v19 — EffectCategory（チェーンリンクに載る効果の性質）
   -------------------------------------------------------------------------
   「フィールドのカードを破壊する効果が発動した時」
   「ダメージを与える効果が発動した時」
   「手札を捨てる効果を含むカードを発動した時」を共通化する。

   ■ effectClassV2 とは別物
     effectClassV2 は TRIGGER / IGNITION / CONTINUOUS … という
     **発動形式**の分類で、ここでは一切変更しない。
     v19 が扱うのは「その効果が何を行うか」という別の metadata。

   ■ 「解決結果」ではなく「発動された効果の性質」
     1103 の裁定では、実際に破壊できたかではなく
     **発動された効果が破壊を含むか**で判定する。
     したがって v19 はチェーンリンクを見て判定し、解決結果は見ない。

   ■ v18 の cause:'effect' とは責務が違う
     category.damage … その効果が「ダメージを与える性質」を持つ
     LP cause:'effect' … 実際に LP が動いたときの原因
     前者はチェーン応答の条件、後者は LP 変化の置換に使う。

   ■ 新しい state を作らない
     カテゴリはチェーンリンクの name / v4EffectKey から**その都度導出**する。
     → gameState に何も足さないので digest も Replay も変わらない。

     導出は2段構え。
       ① カード側の宣言（正確・優先）
          defineScript / defineUnifiedCardV4 の effectCategories、
          あるいは個々の効果定義の categories。
       ② カードテキストからの推定（宣言が無い既存カード用）
          battleProof / targetImmune と同じ既存の作法。カード名では
          分岐せず、テキストの言い回しだけを見る。結果はキャッシュする。

   ■ 今回必要なカテゴリだけ実装する
     destroy / damage / discard の3つ。将来用の未使用タグは作らない。
   ========================================================================= */

const EFFECT_CATEGORIES_V19 = Object.freeze(['destroy','damage','discard']);

/* ---- カード側の宣言 ------------------------------------------------------ */
/* 効果単位の宣言（v4 の effect 定義）→ カード単位の宣言 の順に見る。 */
function declaredCategoriesV19(name, v4EffectKey){
  const sc = (typeof CARD_SCRIPTS !== 'undefined') ? CARD_SCRIPTS[name] : null;
  if(!sc) return null;
  if(v4EffectKey && typeof nativeEffectsV4 === 'function'){
    let list = null;
    try{ list = nativeEffectsV4(name); }catch(e){ list = null; }
    const e = Array.isArray(list) ? list.find(x => x && x.key === v4EffectKey) : null;
    if(e && e.categories) return e.categories;
  }
  return sc.effectCategories || null;
}

/* ---- テキストからの推定 -------------------------------------------------- */
const EFFECT_CATEGORY_CACHE_V19 = new Map();
function inferCategoriesV19(name){
  if(EFFECT_CATEGORY_CACHE_V19.has(name)) return EFFECT_CATEGORY_CACHE_V19.get(name);
  let text = '';
  if(typeof findCardIndex === 'function' && typeof CARD_DB !== 'undefined'){
    const i = findCardIndex(name);
    if(i >= 0) text = String((CARD_DB[i] && CARD_DB[i].e) || '');
  }
  /* 「破壊されない」「破壊された時」は破壊する効果ではない。
     「〜を破壊する」の他に「〜1体を選択して破壊する」の言い回しも拾う。 */
  const destroy = (/を(全て)?破壊(する|し)/.test(text)
      || /(選択|選)(して|んで)破壊(する|し|できる)/.test(text))
    && !/破壊されない/.test(text);
  /* 「ダメージを与える効果が発動した時」に反応する側は含めない。 */
  const damage = /ダメージを与え(る|、)/.test(text)
    && !/ダメージを与える効果が発動/.test(text);
  /* コストとしての「捨てて発動」「捨てる事で」は効果ではない。 */
  const discard = /手札(を|から)[^。]{0,12}捨て(る|させ)/.test(text)
    && !/捨てて発動|捨てる事で|捨てる事によって/.test(text);
  const out = Object.freeze({destroy, damage, discard});
  EFFECT_CATEGORY_CACHE_V19.set(name, out);
  return out;
}

/* ---- 解決 ---------------------------------------------------------------- */
function normalizeCategoriesV19(o){
  const out = {};
  EFFECT_CATEGORIES_V19.forEach(k => { out[k] = !!(o && o[k]); });
  return out;
}
/* カード名（＋効果キー）からカテゴリを求める。宣言が優先、無ければ推定。 */
function effectCategoriesOfNameV19(name, v4EffectKey){
  if(!name) return normalizeCategoriesV19(null);
  const declared = declaredCategoriesV19(name, v4EffectKey);
  if(declared) return normalizeCategoriesV19(declared);
  return normalizeCategoriesV19(inferCategoriesV19(name));
}
/* チェーンリンク（または v12 の発動イベント）からカテゴリを求める。 */
function linkOfV19(gs, x){
  gs = gs || gameState;
  if(!x) return null;
  if(x.chainId != null && Array.isArray(gs.chain)){
    const hit = gs.chain.find(l => l && l.chainId === x.chainId);
    if(hit) return hit;
  }
  return (x.name != null) ? x : null;
}
function effectCategoriesOfLinkV19(gs, x){
  const link = linkOfV19(gs, x);
  if(!link) return normalizeCategoriesV19(null);
  let name = link.name;
  if(!name && link.cardId != null && typeof CARD_DB !== 'undefined'){
    name = (CARD_DB[link.cardId] || {}).n;
  }
  return effectCategoriesOfNameV19(name, link.v4EffectKey || null);
}
function linkHasCategoryV19(gs, x, cat){
  if(EFFECT_CATEGORIES_V19.indexOf(cat) < 0) return false;
  return !!effectCategoriesOfLinkV19(gs, x)[cat];
}
/* そのチェーンリンクが対象に取ったカードのハンドル一覧 */
function linkTargetsV19(gs, x){
  gs = gs || gameState;
  const link = linkOfV19(gs, x);
  const raw = link && (link.targets || link.selection);
  if(!Array.isArray(raw) || !raw.length) return [];
  const out = [];
  raw.forEach(t => {
    /* S03-U19: チェーンリンクの対象は serializeChainSelectionV2 の参照形式（{__yg1103CardRefV2, ref:{uid}}）で保存される。 */
    const uid = (t && t.uid != null) ? t.uid
              : (t && t.card && t.card.uid != null) ? t.card.uid
              : (t && t.ref && t.ref.uid != null) ? t.ref.uid : null;
    if(uid == null) return;
    const hit = (typeof findCardByUidInState === 'function')
      ? findCardByUidInState(gs, uid)
      : (typeof findCardByUid === 'function' ? findCardByUid(uid) : null);
    if(hit) out.push(hit);
  });
  return out;
}

/* ---- 直列化の検査（テスト用） -------------------------------------------
   v19 は state を持たない。チェーンリンク側に余計な物を書いていない
   ことだけ確認する。                                                    */
function assertEffectCategoryStatelessV19(gs){
  gs = gs || gameState;
  if(!Array.isArray(gs.chain)) return null;
  for(const l of gs.chain){
    if(l && l.effectCategories != null) return 'チェーンリンクにカテゴリを書き込んでいる';
  }
  if(gs.effectCategoryV19 != null) return 'gameState にカテゴリの state を作っている';
  return null;
}
