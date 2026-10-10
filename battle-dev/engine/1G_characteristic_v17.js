/* =========================================================================
   System v17 — CharacteristicOverride primitive
                （種族・属性・カード名・チューナー状態の runtime 上書き）
   -------------------------------------------------------------------------
   「〜族になる」「属性は〜になる」「カード名は『〜』として扱う」
   「チューナーとして扱う」を共通化する。

   ■ runtime override と P4 authority metadata は別物
     ここで扱うのは**デュエル中の状態**だけ。
     data/setcode_overlay_v4.json や SETCODE / GROUP といった
     P4 の authority metadata は**一切書き換えない**。
     「現在の名前」で判定すべきルールは currentNameV17 を見るし、
     テーマ membership の定義そのものは P4 のままにしておく。

   ■ 「元々の」と「現在の」を分ける
     originalRaceV17 / originalAttributeV17 / originalNameV17
       … 印刷された情報（dbOf のまま）。「元々の」と書かれた効果用。
     currentRaceV17 / currentAttributeV17 / currentNameV17 / isTunerNowV17
       … 上書きを反映した現在値。ルール判定用。

   ■ dbOf は上書きしない
     dbOf(card) は engine 全体で 100 箇所以上から呼ばれる印刷情報の入口。
     ここを乗っ取ると影響範囲が読めなくなるので触らない。
     代わりに、**本当にルールに効く経路だけ**を現在値へ切り替える。
       (a) canonicalCardCodeV4 … 同名判定・テーマ membership の入口。
           カード名の上書きはここを通して全ての identity 判定へ届く。
       (b) slotMatches … シンクロ／エクシーズ素材の条件判定。
           種族・属性・名前・チューナーを現在値で見る。
       (c) API.fieldCards / pileCards が返すハンドルに race / attr / name /
           tuner を**追加**する（db はそのまま）。新しいカードはこれを見る。
     既存のカードスクリプトが x.db.ra を見ている箇所はそのまま動く。

   ■ 期間
     既存 card.mods / v14 / v16 と同じ until を使い、掃除も
     clearExpiredMods(gs, when) に相乗りする。
       'endTurn' / 'endPhase' / 'endBattlePhase' / 'permanent'
     「フィールドに表側で存在する限り」は permanent + 領域ローカルで表す。
     「装備している限り」は v15 の 'equippedMonster' scope で永続効果として
     宣言する（カード側に置く。ここに装備の知識は持たない）。

   ■ Replay 安全性
     state は純JSON。Action 経由でしか積まない。期限判定は turn 比較の
     純関数。場を離れたら消える（ZONE_LOCAL_KEYS）。
   ========================================================================= */

const CHAR_KIND_V17 = Object.freeze(['race','attr','name','tuner']);
const CHAR_UNTIL_V17 = Object.freeze(['endTurn','endPhase','endBattlePhase','permanent']);

function charModsV17(card){
  const a = card && card.charV17;
  return Array.isArray(a) ? a : [];
}
function makeCharModV17(o, turn){
  const m = {
    kind: (CHAR_KIND_V17.indexOf(o.kind) >= 0) ? o.kind : 'race',
    value: (o.value == null) ? null
         : (typeof o.value === 'boolean') ? (o.value ? 1 : 0)
         : String(o.value),
    until: (CHAR_UNTIL_V17.indexOf(o.until) >= 0) ? o.until : 'permanent',
    label: String(o.label || '効果'),
    turn: Number(turn) || 0,
  };
  /* S03-U211: 「フィールド上に表側表示で存在する限り」 — the mod ends when the monster is turned face-down (FX_SET_STATE). */
  if(o.faceUpOnlyS03 === true) m.faceUpOnlyS03 = true;
  return m;
}

/* ---- 印刷された情報（「元々の」） ---------------------------------------- */
function originalRaceV17(card){ return (dbOf(card).ra) || ''; }
function originalAttributeV17(card){ return (dbOf(card).at) || ''; }
function originalNameV17(card){ return (typeof cardName === 'function') ? cardName(card) : (dbOf(card).n || ''); }
function originalIsTunerV17(card){ return (dbOf(card).st || []).indexOf('チューナー') >= 0; }

/* ---- 永続効果ソースによる上書き ------------------------------------------ */
/* continuous.raceOverride / attrOverride / nameOverride / tunerOverride
   はいずれも (card, src) を受け、上書き値（tuner は真偽）を返す。 */
function continuousCharV17(card, hook){
  if(!card || typeof continuousSources !== 'function') return null;
  const loc = (typeof locateCard === 'function') ? locateCard(card) : null;
  if(!loc) return null;
  let out = null;
  continuousSources().forEach(src=>{
    const cont = src.sc.continuous; if(!cont) return;
    const f = cont[hook]; if(typeof f !== 'function') return;
    if(!continuousReaches(cont.scope || 'self', src.p, loc, src.card, card)) return;
    let r = null;
    try{ r = f(card, src.card); }catch(e){ r = null; }
    if(r != null && r !== false) out = r;
  });
  return out;
}

/* ---- 現在値 -------------------------------------------------------------- */
function charModValueV17(card, kind){
  const list = charModsV17(card);
  let out = null;
  list.forEach(m => { if(m.kind === kind && m.value != null) out = m.value; });
  return out;
}
function currentRaceV17(card){
  if(!card) return '';
  const c = continuousCharV17(card, 'raceOverride');
  if(c != null) return String(c);
  const m = charModValueV17(card, 'race');
  return (m != null) ? String(m) : originalRaceV17(card);
}
function currentAttributeV17(card){
  if(!card) return '';
  const c = continuousCharV17(card, 'attrOverride');
  if(c != null) return String(c);
  const m = charModValueV17(card, 'attr');
  return (m != null) ? String(m) : originalAttributeV17(card);
}
function currentNameV17(card){
  if(!card) return '';
  const c = continuousCharV17(card, 'nameOverride');
  if(c != null) return String(c);
  const m = charModValueV17(card, 'name');
  return (m != null) ? String(m) : originalNameV17(card);
}
function isTunerNowV17(card){
  if(!card) return false;
  const c = continuousCharV17(card, 'tunerOverride');
  if(c != null) return !!c && c !== '0';
  const m = charModValueV17(card, 'tuner');
  if(m != null) return String(m) !== '0';
  return originalIsTunerV17(card);
}
/* カード名の上書きがあるとき、その名前の DB 行を返す（identity 判定用）。 */
function overriddenNameDbV17(card){
  if(!card) return null;
  const now = currentNameV17(card);
  if(!now || now === originalNameV17(card)) return null;
  if(typeof findCardIndex !== 'function' || typeof CARD_DB === 'undefined') return null;
  const i = findCardIndex(now);
  return (i >= 0) ? CARD_DB[i] : null;
}

/* ---- 期限切れの掃除（clearExpiredMods から呼ぶ） ------------------------- */
function keepCharModV17(m, when){
  if(!m) return false;
  if(m.until === 'permanent') return true;
  if(when === 'endBattlePhase') return m.until !== 'endBattlePhase';
  if(when === 'endTurn') return m.until !== 'endTurn' && m.until !== 'endPhase' && m.until !== 'endBattlePhase';
  if(when === 'endPhase') return m.until !== 'endPhase';
  return true;
}

/* ---- 積む / 外す --------------------------------------------------------- */
function addCharModV17(target, spec){
  const r = (typeof resolveTarget === 'function') ? resolveTarget(target) : null;
  if(!r) return false;
  const a = {type:'CHAR_MOD_V17', player:r.p, zone:r.zone, index:r.index,
       kind:spec.kind, value:spec.value,
       until:spec.until || 'permanent', label:spec.label || '効果'};
  if(spec.faceUpOnlyS03 === true) a.faceUpOnlyS03 = true;
  act(a);
  return true;
}
function clearCharModsV17(target, label){
  const r = (typeof resolveTarget === 'function') ? resolveTarget(target) : null;
  if(!r) return false;
  act({type:'CHAR_MOD_V17', player:r.p, zone:r.zone, index:r.index,
       clear:true, label:label || null});
  return true;
}

/* ---- ハンドル ------------------------------------------------------------
   API.fieldCards / pileCards が返すハンドルへ現在値を**追加**する。
   db は印刷情報のまま残すので、既存のカードスクリプトは影響を受けない。 */
function v17Handle(p, zone, index, card){
  const h = {p, zone, index, card, db: dbOf(card)};
  if(card){
    h.race = currentRaceV17(card);
    h.attr = currentAttributeV17(card);
    h.name = currentNameV17(card);
    h.tuner = isTunerNowV17(card);
  }
  return h;
}

/* ---- 直列化の検査（テスト用） ------------------------------------------- */
function assertCharStateSerializableV17(gs){
  gs = gs || gameState;
  for(let p=0;p<2;p++){
    const P = gs.players && gs.players[p]; if(!P) continue;
    for(const z of ['mz','sz','grave','hand','banish','deck','ex']){
      for(const c of (P[z]||[])){
        const list = c && c.charV17;
        if(list == null) continue;
        if(!Array.isArray(list)) return 'charV17 が配列でない';
        for(const m of list){
          if(!m || typeof m !== 'object') return 'charV17 の要素が object でない';
          for(const k of Object.keys(m)){
            const v = m[k];
            if(v != null && typeof v !== 'number' && typeof v !== 'string'){
              return 'charV17.' + k + ' が JSON 化できない';
            }
          }
        }
        try{ JSON.parse(JSON.stringify(list)); }
        catch(e){ return 'charV17 が JSON 化できない'; }
      }
    }
  }
  return null;
}
