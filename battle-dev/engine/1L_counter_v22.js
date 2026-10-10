/* =========================================================================
   System v22 — Counter（カウンターの capability / 変化イベント / 分配払い）
   -------------------------------------------------------------------------
   「魔力カウンターを置く事ができるカード」
   「フィールド上のAカウンターが取り除かれる度に」
   「自分フィールド上に存在する魔力カウンターを10個取り除いて発動する」
   を共通化する。

   ■ 既存を作り直さない
     COUNTER_ADD / COUNTER_REMOVE / COUNTER_CLEAR   … Action。**そのまま**。
     API.addCounter / removeCounter / countCounter  … **そのまま**。
     continuous.spellCounterOnSpellResolve          … 魔法発動時の自動設置。触らない。
     破壊時の魔力カウンター移送（v3.5.0）           … 触らない。
     card.counters は既に digest に載っている。**新しい state を作らない**。

   ■ 今回足りない4点だけを足す
     1. capability metadata … そのカードに「そのカウンター」を置けるか
     2. 変化イベント        … 置かれた／取り除かれた
     3. 分配払い・分配設置  … 複数カードにまたがる N 個の取り除き／設置
     4. 設置上限            … 「(最大◯つまで)」

   ■ カード名で分岐しない
     capability は「カード側の宣言 → 自分のテキストの言い回し」で導出する。
     battleProof / EffectCategory v19 と同じ作法。結果はキャッシュする。
   ========================================================================= */

const COUNTER_DEFAULT_KIND_V22 = '魔力';

/* ---- capability（そのカードに置けるカウンターか）------------------------ */
const COUNTER_CAPABLE_CACHE_V22 = new Map();
function counterTextOfV22(card){
  const db = (typeof dbOf==='function') ? (dbOf(card)||{}) : {};
  return String(db.e || '') + String(db.e0 || '');
}
/* 1103 の裁定：魔力カウンターは「置く事ができる」と自身のテキストに
   書かれているカードにしか置けない。他のカウンターは、そのカウンターを
   自身に置くと書かれているカードに置ける。 */
function counterCapableV22(card, kind){
  if(!card) return false;
  const k = kind || COUNTER_DEFAULT_KIND_V22;
  const sc = (typeof CARD_SCRIPTS!=='undefined') ? CARD_SCRIPTS[cardName(card)] : null;
  const dec = sc && sc.counterCapableV22;
  if(dec && dec[k] != null) return !!dec[k];
  const nm = (typeof dbOf==='function') ? (dbOf(card)||{}).n : null;
  const key = (nm||'?') + '\u0000' + k;
  if(COUNTER_CAPABLE_CACHE_V22.has(key)) return COUNTER_CAPABLE_CACHE_V22.get(key);
  const text = counterTextOfV22(card);
  const esc = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  /* 自分自身を指している言い回しだけを拾う。
     「魔力カウンターを置く事ができるカード」は他のカードへの参照なので
     そのカード自身が置ける事にはならない。 */
  const re = new RegExp('この(カード|モンスター)に' + esc + 'カウンターを');
  const out = re.test(text);
  COUNTER_CAPABLE_CACHE_V22.set(key, out);
  return out;
}
/* いま場にある「そのカウンターを置けるカード」のハンドル一覧 */
function counterCapableCardsV22(gs, player, kind, faceUpOnly){
  gs = gs || gameState;
  const out = [];
  const ps = (player===0||player===1) ? [player] : [0,1];
  ps.forEach(p=>{
    ['mz','sz','field'].forEach(z=>{
      const arr = (z==='field') ? (gs.players[p].field ? [gs.players[p].field] : [])
                                : (gs.players[p][z]||[]);
      arr.forEach((c,i)=>{
        if(!c) return;
        if(faceUpOnly!==false && c.face!=='up') return;
        if(!counterCapableV22(c, kind)) return;
        out.push({p, zone:z, index:(z==='field'?0:i), card:c, db:dbOf(c)});
      });
    });
  });
  return out;
}

/* ---- 設置上限 ------------------------------------------------------------
   カード側の宣言だけを見る。宣言が無ければ上限なし。 */
function counterLimitV22(card, kind){
  const sc = (typeof CARD_SCRIPTS!=='undefined') ? CARD_SCRIPTS[cardName(card)] : null;
  const m = sc && sc.counterMaxV22;
  if(!m) return null;
  const k = kind || COUNTER_DEFAULT_KIND_V22;
  return (typeof m[k]==='number') ? m[k] : null;
}
/* 上限を踏まえて、実際に置ける枚数 */
function counterRoomV22(card, kind, want){
  const lim = counterLimitV22(card, kind);
  if(lim==null) return Math.max(0, want|0);
  const k = kind || COUNTER_DEFAULT_KIND_V22;
  const now = (card && card.counters && Number(card.counters[k])) || 0;
  return Math.max(0, Math.min(want|0, lim - now));
}

/* ---- 変化イベント --------------------------------------------------------
   COUNTER_ADD / COUNTER_REMOVE の Action の中から呼ばれる。
   deferredEvents は既に digest に含まれるので Replay 安全。 */
function emitCounterEventV22(gs, name, info){
  gs = gs || gameState;
  if(typeof queueDeferredEventV2!=='function') return;
  if(typeof PLAY_MODE==='undefined' || PLAY_MODE!==PLAY_MODES.DUEL) return;
  queueDeferredEventV2(name, {
    player: (info.player===0||info.player===1) ? info.player : null,
    uid: (info.uid!=null) ? info.uid : null,
    kind: info.kind || COUNTER_DEFAULT_KIND_V22,
    n: Number(info.n)||0,
    total: Number(info.total)||0
  });
}

/* ---- 分配（複数カードにまたがる N 個）------------------------------------
   1個ずつを別々の候補として並べるので、
   「同じカードから2個」も「別のカードから1個ずつ」も表現できる。
   候補は {p,zone,index,card,key,label} の純JSONで、v49 P1 にそのまま渡せる。 */
function counterUnitsV22(gs, player, kind, filter){
  gs = gs || gameState;
  const k = kind || COUNTER_DEFAULT_KIND_V22;
  const out = [];
  const ps = (player===0||player===1) ? [player] : [0,1];
  ps.forEach(p=>{
    ['mz','sz','field'].forEach(z=>{
      const arr = (z==='field') ? (gs.players[p].field ? [gs.players[p].field] : [])
                                : (gs.players[p][z]||[]);
      arr.forEach((c,i)=>{
        if(!c) return;
        const n = (c.counters && Number(c.counters[k])) || 0;
        if(n<=0) return;
        const hnd = {p, zone:z, index:(z==='field'?0:i), card:c, db:dbOf(c)};
        if(typeof filter==='function' && !filter(hnd)) return;
        ensureCardUid(gs, c);
        for(let u=0; u<n; u++){
          out.push(Object.assign({}, hnd, {
            key: 'c' + c.uid + '#' + u,
            label: (typeof labelOf==='function' ? labelOf(c) : (hnd.db.n||'')) + `（${k}${u+1}）`
          }));
        }
      });
    });
  });
  return out;
}
/* 場にあるそのカウンターの総数 */
function counterTotalV22(gs, player, kind, filter){
  return counterUnitsV22(gs, player, kind, filter).length;
}
/* 選ばれた単位（uid の並び）を実際に取り除く。Action からのみ呼ぶ。 */
function removeCounterUnitsV22(gs, uids, kind, reason){
  gs = gs || gameState;
  const k = kind || COUNTER_DEFAULT_KIND_V22;
  const tally = new Map();
  (uids||[]).forEach(u=>tally.set(u, (tally.get(u)||0)+1));
  let removed = 0;
  tally.forEach((n, uid)=>{
    const h = (typeof findCardByUidInState==='function') ? findCardByUidInState(gs, uid) : null;
    if(!h || !h.card || !h.card.counters) return;
    const cur = Number(h.card.counters[k])||0;
    const take = Math.min(cur, n);
    if(take<=0) return;
    h.card.counters[k] = cur - take;
    if(h.card.counters[k] <= 0) delete h.card.counters[k];
    if(!Object.keys(h.card.counters).length) delete h.card.counters;
    removed += take;
    if(typeof logIt==='function')
      logIt(gs, `${reason||'効果'}：${cardName(h.card)} から${k}カウンターを${take}つ取り除いた`);
    emitCounterEventV22(gs, 'onCounterRemoved', {
      player:h.p, uid, kind:k, n:take,
      total:(h.card.counters && h.card.counters[k]) || 0});
  });
  return removed;
}
/* 選ばれたカード（uid の並び）へ1つずつ置く。Action からのみ呼ぶ。 */
function placeCounterUnitsV22(gs, uids, kind, reason){
  gs = gs || gameState;
  const k = kind || COUNTER_DEFAULT_KIND_V22;
  let placed = 0;
  (uids||[]).forEach(uid=>{
    const h = (typeof findCardByUidInState==='function') ? findCardByUidInState(gs, uid) : null;
    if(!h || !h.card) return;
    if(counterRoomV22(h.card, k, 1) <= 0) return;
    h.card.counters = h.card.counters || {};
    h.card.counters[k] = (Number(h.card.counters[k])||0) + 1;
    placed++;
    if(typeof logIt==='function')
      logIt(gs, `${reason||'効果'}：${cardName(h.card)} に${k}カウンターを1つ置いた（計${h.card.counters[k]}）`);
    emitCounterEventV22(gs, 'onCounterPlaced', {
      player:h.p, uid, kind:k, n:1, total:h.card.counters[k]});
  });
  return placed;
}

/* ---- イベント参照ヘルパ（カードスクリプトが使う）------------------------ */
function counterEventKindV22(evt){ return (evt && evt.kind) || null; }
function counterEventCardV22(evt){
  if(!evt || evt.uid==null) return null;
  return (typeof findCardByUid==='function') ? findCardByUid(evt.uid) : null;
}

/* ---- 直列化検査（テスト用）---------------------------------------------
   v22 は新しい state を作らない。counters の中身が数値だけであることと、
   カード側の宣言が state に漏れていないことだけ確認する。            */
function assertCounterStatelessV22(gs){
  gs = gs || gameState;
  if(gs.counterV22 != null) return 'gameState にカウンターの state を作っている';
  let bad = null;
  (gs.players||[]).forEach(P=>{
    ['mz','sz','hand','grave','banish','deck'].forEach(z=>{
      const arr = (z==='field') ? [] : (P[z]||[]);
      arr.forEach(c=>{
        if(!c || c.counters==null) return;
        if(typeof c.counters!=='object'){ bad = bad||'counters がオブジェクトではない'; return; }
        Object.keys(c.counters).forEach(k=>{
          if(typeof c.counters[k]!=='number') bad = bad||('counters.'+k+' が数値ではない');
        });
        if(c.counterCapableV22!=null) bad = bad||'capability を state に書いている';
        if(c.counterMaxV22!=null) bad = bad||'上限を state に書いている';
      });
    });
  });
  return bad;
}
