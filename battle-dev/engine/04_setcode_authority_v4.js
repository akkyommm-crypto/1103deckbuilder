/* =========================================================================
   System P4 — SetcodeAuthority（named predicate membership）
   -------------------------------------------------------------------------
   「『X』と名のついたカード」という OCG の名称指定述語を、
   passcode 単位の静的 authority として解決する層。

   ■ 絶対規則
     1. membership 判定は passcode のみ。
        実行時に name.includes / indexOf / 正規表現 / ルビ推測を一切使わない。
     2. 次の4概念を混ぜない。
          named predicate  … 本モジュール（GROUP / isCardInGroupV4）
          setcode          … engine/05 の setcodesOfV4()。テーマ所属であり述語ではない
          alias            … 別カードを同名として扱う関係（本モジュールは扱わない）
          canonical identity … canonicalCardCodeV4() による同一カード判定（本モジュールは扱わない）
     3. 既存 setcode を直接使ってよいのは、述語と完全一致すると検証済みの5群だけ。
        （ワーム / 氷結界 / 魔轟神 / ガスタ / ジェネクス）
        それ以外の群で setcode を述語代わりに使ってはならない。
        実測で setcode はテーマ支援カードを含み、述語とは別集合である。

   ■ なぜ passcode が必要か（実測根拠）
     - data/carddata.json は全角英字を半角へ正規化しており（全角Ａ-Ｚを含むカード0枚）、
       「Ｄ（ディフォーマー）」と「Ｄ．Ｄ．クロウ」「Ｄ－ＨＥＲＯ」を名前で区別できない。
     - 「Ｃ」は表示上同一だがルビが チェーン / クリサリス の2群に分かれる。
     - 「アンティーク・ギア」はルビが群名で、表示名は「古代の機械」。
     いずれも名前一致では正しく解決できない。

   ■ データ
     data/setcode_overlay_v4.json  … authority 本体（人／ツールが読む）
     data/03_setcode_overlay_v4.js … 上を埋め込んだ生成物（build_manifest で連結）
     どちらも tools/gen_setcode_overlay.py が生成する。carddata.json は変更しない。

   ■ ゲーム状態への影響
     本モジュールは静的メタデータのみを扱い、gameState を読み書きしない。
     したがって Replay / Undo / Redo / SaveLoad / Action Journal / state digest に
     一切影響しない。
   ========================================================================= */

/* ---- overlay へのアクセス（未ロードでも落ちない） ---------------------- */
function p4OverlayV4(){
  try{
    if(typeof SETCODE_OVERLAY_V4 !== 'undefined' && SETCODE_OVERLAY_V4) return SETCODE_OVERLAY_V4;
  }catch(e){ /* TDZ 等。未ロード扱いにする */ }
  return null;
}

/* ---- GROUP 定数（キーは overlay と同一） ------------------------------ */
const GROUP = (function(){
  const ov = p4OverlayV4();
  const out = {};
  if(ov && ov.groups) Object.keys(ov.groups).forEach(k=>{ out[k]=k; });
  return Object.freeze(out);
})();

/* ---- passcode → 所属 group の索引（初回のみ構築） --------------------- */
let P4_GROUP_INDEX_V4 = null;
function p4EnsureIndexV4(){
  if(P4_GROUP_INDEX_V4) return P4_GROUP_INDEX_V4;
  const ov = p4OverlayV4();
  const idx = new Map();          // passcode -> Set(groupKey)
  const members = new Map();      // groupKey -> Set(passcode)
  if(ov && ov.groups){
    Object.keys(ov.groups).forEach(key=>{
      const set = new Set();
      (ov.groups[key].members||[]).forEach(code=>{
        const n = Number(code);
        if(!Number.isFinite(n)) return;
        set.add(n);
        if(!idx.has(n)) idx.set(n, new Set());
        idx.get(n).add(key);
      });
      members.set(key, set);
    });
  }
  P4_GROUP_INDEX_V4 = {idx, members};
  return P4_GROUP_INDEX_V4;
}

/* ---- カード → passcode（唯一の同定手段） -----------------------------
   受け付ける形: 数値passcode / カード実体 / DB行 / {card:...} / {db:...}
   トークンなど passcode を持たないものは 0 を返す。          */
function cardCodeOfV4(x){
  if(x==null) return 0;
  if(typeof x === 'number') return Number.isFinite(x) ? x : 0;
  if(typeof x === 'string') return 0;                 // 名前は受け付けない（名前判定禁止）
  if(x.token) return 0;                               // トークンは述語に属さない
  if(typeof x.c === 'number' && typeof x.n === 'string') return x.c;   // DB行
  let d = null;
  try{ d = (typeof v4DbOf==='function') ? v4DbOf(x) : (typeof dbOf==='function' ? dbOf(x) : null); }
  catch(e){ d = null; }
  if(d && typeof d.c === 'number') return d.c;
  return 0;
}

/* ---- membership 判定（passcode のみ） --------------------------------- */
function isCardInGroupV4(x, group){
  const key = String(group||'');
  if(!key) return false;
  const ov = p4OverlayV4();
  const g = ov && ov.groups ? ov.groups[key] : null;
  if(!g) return false;

  /* 検証済み5群のみ、既存 setcode で解決してよい。
     ただし setcode は「カード実体／DB行」からしか引けないので、
     数値 passcode を渡された場合は overlay 索引で解決する。
     両者が完全一致することは生成時と回帰テストで保証している。 */
  if(g.setcode_exact && g.setcode!=null && typeof x !== 'number' && typeof isSetCardV4==='function'){
    return isSetCardV4(x, g.setcode);
  }
  const code = cardCodeOfV4(x);
  if(!code) return false;
  const st = p4EnsureIndexV4();
  const s = st.idx.get(code);
  return !!(s && s.has(key));
}

/* ---- そのカードが属する group 一覧 ------------------------------------ */
function groupsOfCardV4(x){
  const code = cardCodeOfV4(x);
  const out = [];
  const ov = p4OverlayV4();
  if(!ov || !ov.groups) return out;
  const st = p4EnsureIndexV4();
  if(code){
    const s = st.idx.get(code);
    if(s) s.forEach(k=>out.push(k));
  }
  /* setcode_exact 群は setcode 側でも判定する（overlay と一致することは検証済み） */
  Object.keys(ov.groups).forEach(k=>{
    const g = ov.groups[k];
    if(g.setcode_exact && g.setcode!=null && typeof isSetCardV4==='function'){
      if(isSetCardV4(x, g.setcode) && out.indexOf(k)<0) out.push(k);
    }
  });
  return out.sort();
}

function hasAnyGroupV4(x, groups){
  return [].concat(groups||[]).some(g=>isCardInGroupV4(x,g));
}

/* ---- group のメンバー passcode 一覧（読み取り専用） -------------------- */
function groupMembersV4(group){
  const st = p4EnsureIndexV4();
  const s = st.members.get(String(group||''));
  return s ? Array.from(s).sort((a,b)=>a-b) : [];
}
function groupMetaV4(group){
  const ov = p4OverlayV4();
  const g = ov && ov.groups ? ov.groups[String(group||'')] : null;
  if(!g) return null;
  return {jp:g.jp, ruby:g.ruby||null, setcodeExact:!!g.setcode_exact,
          basis:g.basis||'', ads:g.ads||'', note:g.note||null, count:(g.members||[]).length};
}

/* ---- ゾーン走査ヘルパ（カード列から group 一致だけを抜く） -------------
   実行時に名前を見ないことを保証するための入口。 */
function filterByGroupV4(list, group){
  return (list||[]).filter(t=>{
    const card = t && t.card ? t.card : t;
    return isCardInGroupV4(card, group);
  });
}

/* ---- 自己診断（テストと整合性検証で使う） ------------------------------ */
/* 件数は3種類あり混同しやすいので、返却キーでも意味を固定する。
     authorityUniquePasscodes … 全predicateのユニークpasscode（471）
     overlayUniquePasscodes   … setcode_exact群を除いたユニーク（325）
     totalMembership          … member総数・重複込み（476）              */
function p4AuditV4(){
  const ov = p4OverlayV4();
  const problems = [];
  if(!ov){ return {ok:false, problems:['overlay がロードされていません'], predicates:0,
                   authorityUniquePasscodes:0, overlayUniquePasscodes:0, totalMembership:0}; }
  const st = p4EnsureIndexV4();
  const keys = Object.keys(ov.groups||{});
  let total = 0;
  const overlayUniq = new Set();
  keys.forEach(k=>{
    const g = ov.groups[k];
    const mem = g.members||[];
    total += mem.length;
    if(!mem.length) problems.push(`${k}: メンバーが空`);
    if(new Set(mem).size !== mem.length) problems.push(`${k}: メンバーに重複`);
    mem.forEach(code=>{
      if(typeof code !== 'number' || !Number.isFinite(code)) problems.push(`${k}: 非数値passcode ${code}`);
      if(!g.setcode_exact) overlayUniq.add(code);
    });
    if(g.setcode_exact && g.setcode==null) problems.push(`${k}: setcode_exact なのに setcode 未設定`);
  });
  if(ov.predicate_count !== keys.length) problems.push('predicate_count が groups と不一致');
  if(ov.total_membership_count !== total) problems.push('total_membership_count が不一致');
  if(ov.authority_unique_passcode_count !== st.idx.size) problems.push('authority_unique_passcode_count が不一致');
  if(ov.overlay_unique_passcode_count !== overlayUniq.size) problems.push('overlay_unique_passcode_count が不一致');
  return {ok:problems.length===0, problems, predicates:keys.length,
          authorityUniquePasscodes:st.idx.size, overlayUniquePasscodes:overlayUniq.size,
          totalMembership:total};
}
