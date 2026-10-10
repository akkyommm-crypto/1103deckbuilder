/* =========================================================================
   System v11 — Token identity / creation primitive
   -------------------------------------------------------------------------
   「〇〇トークンを N 体特殊召喚する」と
   「そのトークンが破壊された時」を共通化する。

   既に存在するので**作り直さない**もの:
     TOKEN_CREATE Action / API.createToken … 生成そのもの
     card.token（DBに無い仮想カードの実体）と dbOf の分岐
     ZONE_LIMITS.mz による空き判定
     ensureCardUid / findCardByUid（identity の既存規約）
     v9 linkV9（「片方が離れたら」の追跡）
     v6 lastBattleContext（戦闘破壊の識別）
     v7 scheduler（ターン終了時の破壊）
     P1 ChoiceRequest / P4 predicate / P3 snapshot

   今回足りないので足すもの:
     1. トークンの identity。生成時に uid・owner・controller を付ける。
        （従来は uid が無く、2体のトークンを digest でも Replay でも
          区別できなかった。「そのトークン」を後から指せない。）
     2. 正規のトークン定義（key）。カード側が登録し、engine は名前で
        分岐しない。「〇〇トークン」の同名判定に使う。
     3. 実際に何体出せたかの結果。ゾーンが一杯なら要求より少なくなる。
     4. トークンが特殊召喚された事を知らせるイベント。
     5. 場のモンスターの数値を写したトークン（物理分身・武闘円舞）。

   ■ Replay 安全性
     - state は純JSON。identity は uid。カード名・配列 index を
       authority にしない。世代は gs.tokenSeq で採番する。
     - 数値の写しは API 側で解決して Action に literal で載せる。
       再適用は同じ数値になる（P3 の snapshot と同じ考え方）。
     - 生成結果 gs.lastTokenV11 は1件だけ持ち、上書きする。
       無制限履歴は作らない（v8 lastDrawV8 と同じ）。
   ========================================================================= */

/* ---- 正規のトークン定義（カード側が登録する） --------------------------- */
const TOKEN_SPEC_V11 = Object.create(null);
function defineTokenSpecV11(key, spec){
  spec = spec || {};
  TOKEN_SPEC_V11[key] = Object.freeze({
    key,
    name: spec.name || key,
    atk: Number(spec.atk) || 0,
    def: Number(spec.def) || 0,
    lv:  Number(spec.lv)  || 1,
    ra:  spec.ra || '',
    at:  spec.at || '',
    pos: (spec.pos === 'atk' || spec.pos === 'def') ? spec.pos : 'def',
  });
  return TOKEN_SPEC_V11[key];
}
function tokenSpecV11(key){ return TOKEN_SPEC_V11[key] || null; }
function tokenSpecKeysV11(){ return Object.keys(TOKEN_SPEC_V11); }

/* ---- 判定ヘルパ --------------------------------------------------------- */
function isTokenV11(card){ return !!(card && card.token); }
function tokenKeyV11(card){
  if(!isTokenV11(card)) return null;
  return (card.tokenV11 && card.tokenV11.key) || card.token.n || null;
}
function sameTokenV11(card, key){ return !!key && tokenKeyV11(card) === key; }
function tokenSourceUidV11(card){
  return (card && card.tokenV11 && card.tokenV11.sourceUid != null)
    ? card.tokenV11.sourceUid : null;
}
/* トークンの現在のコントローラー。場を離れた後は生成時の記録を使う。 */
function tokenControllerV11(card){
  if(!isTokenV11(card)) return null;
  const loc = (typeof locateCardAnyV4 === 'function') ? locateCardAnyV4(card) : null;
  if(loc) return loc.p;
  return (card.controller === 0 || card.controller === 1) ? card.controller : null;
}
/* 指定した key のトークンを場から集める */
function tokensOnFieldV11(gs, key, player){
  gs = gs || gameState;
  const out = [];
  for(let p=0;p<2;p++){
    if(player != null && p !== player) continue;
    const P = gs.players[p]; if(!P) continue;
    (P.mz||[]).forEach((c,i)=>{
      if(!isTokenV11(c)) return;
      if(key && !sameTokenV11(c, key)) return;
      out.push({p, zone:'mz', index:i, card:c, db:dbOf(c)});
    });
  }
  return out;
}

/* ---- 生成 --------------------------------------------------------------- */
/* Action に載せる payload を組み立てる。純JSONだけを返す。 */
function tokenCreatePayloadV11(player, spec, n, sourceCard){
  const s = (typeof spec === 'string') ? tokenSpecV11(spec) : spec;
  if(!s) return null;
  const a = {type:'TOKEN_CREATE', player,
    key: s.key || null, name: s.name || s.key || 'トークン',
    atk: Number(s.atk)||0, def: Number(s.def)||0, lv: Number(s.lv)||1,
    ra: s.ra||'', at: s.at||'', pos: s.pos||'def', n: Math.max(1, Number(n)||1)};
  if(sourceCard){
    if(typeof ensureCardUid === 'function') ensureCardUid(gameState, sourceCard);
    if(sourceCard.uid != null) a.sourceUid = sourceCard.uid;
  }
  return a;
}
/* 場のモンスターの数値を写したトークン。数値は今この場で確定させ、
   Action に literal で載せるので再生でも同じになる。 */
function tokenCopyPayloadV11(player, srcCard, name, n, key){
  if(!srcCard) return null;
  const db = dbOf(srcCard);
  return {type:'TOKEN_CREATE', player, key:key||name||null, name:name||'トークン',
    atk: (typeof curATK==='function') ? curATK(srcCard) : (db.atk||0),
    def: (typeof curDEF==='function') ? curDEF(srcCard) : (db.def||0),
    lv:  (typeof curLV ==='function') ? curLV(srcCard)  : (db.lv||1),
    ra: db.ra||'', at: db.at||'', pos:'atk', n: Math.max(1, Number(n)||1),
    copiedFromUid: (srcCard.uid != null) ? srcCard.uid : null};
}
/* TOKEN_CREATE の結果。1件だけ保持して上書きする。 */
function lastTokenCreatedV11(gs){
  gs = gs || gameState;
  return gs.lastTokenV11 || null;
}
function makeTokenSummonEventV11(o){
  return {player:o.player, key:o.key||null, uids:(o.uids||[]).slice(),
          count:(o.uids||[]).length, sourceUid:(o.sourceUid!=null)?o.sourceUid:null};
}

/* ---- 消滅の記録 ---------------------------------------------------------
   トークンは墓地に残らないので、行き先からは破壊を判定できない。
   消滅した Action の中だけ小さな配列に控え、v9 の離脱イベントへ写す。
   イベントに写した時点で配列は空にするので履歴にはならない。          */
function recordTokenGoneV11(gs, card, info){
  if(!gs || !card) return;
  if(!Array.isArray(gs.tokensGoneV11)) gs.tokensGoneV11 = [];
  if(card.uid == null) return;
  gs.tokensGoneV11.push({uid:card.uid,
    key: tokenKeyV11(card),
    byDestroy: !!(info && info.byDestroy),
    byBattle: !!(info && info.byBattle),
    controller: (info && (info.controller === 0 || info.controller === 1))
      ? info.controller
      : ((card.controller === 0 || card.controller === 1) ? card.controller : null),
    /* S03-U195: 「このトークンが破壊された時にそのコントローラーは…ダメージを受ける」 (おジャマトークン) */
    destroyDamageS03: Number(card.destroyDamageS03)||0});
}
/* v9 の離脱イベントへ写す */
function stampTokenGoneV11(gs, evt){
  const list = gs && gs.tokensGoneV11;
  if(!Array.isArray(list) || !list.length || !evt || evt.uid == null) return evt;
  const hit = list.find(x => x.uid === evt.uid);
  if(!hit) return evt;
  evt.tokenGone = true;
  evt.tokenKey = hit.key;
  evt.tokenDestroyed = hit.byDestroy;
  evt.tokenByBattle = hit.byBattle;
  evt.tokenController = hit.controller;
  return evt;
}
/* 離脱イベントが「トークンが破壊されて消滅した」ものかどうか */
function tokenWasDestroyedV11(evt){ return !!(evt && evt.tokenDestroyed); }
function tokenDestroyedByBattleV11(evt){ return !!(evt && evt.tokenDestroyed && evt.tokenByBattle); }

/* ---- 直列化の検査（テスト用） ------------------------------------------- */
function assertTokenStateSerializableV11(gs){
  gs = gs || gameState;
  const last = gs.lastTokenV11;
  if(last != null){
    if(typeof last !== 'object') return 'lastTokenV11 が object でない';
    if(!Array.isArray(last.uids)) return 'lastTokenV11.uids が配列でない';
    if(last.uids.some(u => typeof u !== 'number')) return 'lastTokenV11.uids が数値でない';
    try{ JSON.parse(JSON.stringify(last)); }catch(e){ return 'lastTokenV11 が JSON 化できない'; }
  }
  for(let p=0;p<2;p++){
    const P = gs.players && gs.players[p]; if(!P) continue;
    for(const c of (P.mz||[])){
      if(!isTokenV11(c)) continue;
      if(c.uid == null) return 'トークンに uid が無い';
      if(c.tokenV11){
        try{ JSON.parse(JSON.stringify(c.tokenV11)); }
        catch(e){ return 'tokenV11 が JSON 化できない'; }
      }
    }
  }
  return null;
}
