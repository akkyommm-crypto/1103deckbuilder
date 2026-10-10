/* =========================================================================
   S03-U33 — C-S03-26 DRAW_REPLACEMENT 「自分のドローフェイズ時に通常のドローを行う代わりに…」
   -------------------------------------------------------------------------
   2011 wiki：
     10/06/11 無敗将軍 フリード／ダーク・ジェネラル フリード … ドローする代わりにモンスターを手札に加える効果は誘発効果。
     09/09/30 無敗将軍 フリード … 複数でもドローの代わりに手札に加えるのは1枚だけ。1体目の効果が無効になった後、
              同じドローフェイズに2体目の効果は発動できない。
     10/03/24 無敗将軍 フリード … 効果が無効ならドローできない。発動が無効ならドローできる。デッキ0枚なら発動できない。
     10/07/24 無敗将軍 フリード … 閃光の宝札で2枚ドローできる時も、手札に加えるのは1体だけで通常のドローもできない。
     11/01/10 円盤ムスキー … 解決時に表側表示で存在しなければ適用されない。
   ■ 宣言したカード（cards/H9, cards/H9B）だけ
     processDrawV27 が通常のドローを行う前に offerDrawReplacementS03 を呼ぶ。条件を満たす宣言カードがあれば
     「通常のドローを行う／○○の効果を発動」を選ばせる。効果を選ぶと DRAW_REPLACED_S03（Action）で通常のドローを
     済んだ扱いにしてから prepareDuelActivation で発動する。発動が無効になった時だけ通常のドローを行う。
     新しい gameState キーは作らない（drawnThisTurn を使う）。
   ■ S03-U65: 表側表示のモンスターゾーン（無敗将軍 フリード 等）に加え、墓地の魔法・罠カード（自分自身を手札に
     加えるタイプ — コアキメイルの鋼核／スピリット・バーナー／マジックブラスト／メテオ・プロミネンス）も候補に
     含める。墓地の魔法・罠が `activateFrom:['grave']` を持つのは既存のcards（突風、9L_class_a_recovery_04 等）と
     同じ engine 機能で、新しい仕組みは要らない — 候補列挙が `mz` しか見ていなかっただけ。
   ■ S03-U77: フィールドゾーン（Sin World — 自分のドローフェイズ時に通常のドローを行う代わりに発動できる）も
     候補に含める。P.field は配列ではなく単一カード（null もありうる）なので mz/grave とは別枝で扱う。
   ========================================================================= */
const DRAW_REPLACEMENT_S03 = {};
function declareDrawReplacementS03(name, spec){ DRAW_REPLACEMENT_S03[name] = spec || {}; }
function drawReplacementSpecS03(name){ return DRAW_REPLACEMENT_S03[name] || null; }

/* 通常のドローの代わりに発動できる宣言カード（表側表示のモンスターゾーン、または墓地の魔法・罠）。 */
function drawReplacementCandidatesS03(p){
  const P = gameState.players[p];
  if(!P || !(P.deck||[]).length) return [];            /* デッキ0枚なら発動できない（10/03/24） */
  const out = [];
  (P.mz||[]).forEach((c, i)=>{
    if(!c || c.face !== 'up') return;
    const name = cardName(c);
    if(!drawReplacementSpecS03(name)) return;
    const L = (typeof strictScriptLegalityV2 === 'function')
      ? strictScriptLegalityV2(name, p, 'mz', i, {drawReplacementS03:true}) : {ok:false};
    if(!L || !L.ok) return;
    ensureCardUid(gameState, c);
    out.push({p, zone:'mz', index:i, uid:c.uid, name});
  });
  (P.grave||[]).forEach((c, i)=>{
    if(!c) return;
    const name = cardName(c);
    if(!drawReplacementSpecS03(name)) return;
    const L = (typeof strictScriptLegalityV2 === 'function')
      ? strictScriptLegalityV2(name, p, 'grave', i, {drawReplacementS03:true}) : {ok:false};
    if(!L || !L.ok) return;
    ensureCardUid(gameState, c);
    out.push({p, zone:'grave', index:i, uid:c.uid, name});
  });
  if(P.field && P.field.face === 'up'){
    const name = cardName(P.field);
    if(drawReplacementSpecS03(name)){
      const L = (typeof strictScriptLegalityV2 === 'function')
        ? strictScriptLegalityV2(name, p, 'field', 0, {drawReplacementS03:true}) : {ok:false};
      if(L && L.ok){
        ensureCardUid(gameState, P.field);
        out.push({p, zone:'field', index:0, uid:P.field.uid, name});
      }
    }
  }
  return out;
}

/* 通常のドローの直前に選ばせる。候補が無ければ false（通常のドローへ進む）。 */
function offerDrawReplacementS03(p){
  if(gameState.drawnThisTurn) return false;
  const cands = drawReplacementCandidatesS03(p);
  if(!cands.length) return false;
  const options = [{key:'draw', label:'通常のドローを行う', value:'draw'}]
    .concat(cands.map(x=>({key:'uid' + x.uid, label:'「' + x.name + '」の効果を発動（通常のドローの代わり）', value:String(x.uid)})));
  API.requestChoice({player:p, kind:'mode', title:'ドローフェイズ：通常のドロー', candidates:options, min:1, max:1,
    cancelable:false, resume:{handler:'s03u33.draw-choice', args:{player:p}}, meta:{scriptName:'通常のドロー'}});
  return true;
}

/* 発動が無効になった → 通常のドローを行う（10/03/24）。効果だけの無効ではドローしない。 */
function drawReplacementActivationNegatedS03(link){
  if(!link) return false;
  act({type:'DRAW', player:link.player, n:1});
  return true;
}
