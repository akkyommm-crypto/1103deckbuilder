/* =========================================================================
   System v16 — LevelModifier primitive（レベルの増減・SET・期間・永続層）
   -------------------------------------------------------------------------
   「レベルを1つ上げる／下げる」「レベルは4になる」
   「エンドフェイズ時までレベルは3になる」を共通化する。

   ■ 既存の層を壊さない
     curLV は今まで「印刷されたレベル + card.lvMod」だけだった。
     v16 はその後ろに2層を足すだけで、既存の lvMod の意味は変えない。

       ① db の印刷レベル
       ② card.lvMod（スポーア等が使う既存の恒久デルタ）
       ③ v16 add 層 … 期間つきの増減                    ← 追加
       ④ v16 set 層 … 期間つきの「レベルは○になる」      ← 追加（後勝ち）
       ⑤ continuous.levelDelta（永続効果ソースによる増減） ← 追加
       ⑥ continuous.setLevel（永続効果ソースによる固定）   ← 追加（後勝ち）

     レベルは 0 未満にならない。エクシーズのランクは lvMod を持たない
     前提が既にあるので、その扱いも変えない。

   ■ 期間
     既存 card.mods / v14 statModsV14 と同じ until を使い、掃除も
     clearExpiredMods(gs, when) に相乗りする。
       'endTurn' / 'endPhase' / 'endBattlePhase' / 'permanent'

   既に存在するので**作り直さない**もの:
     curLV / card.lvMod / FX_SET_STATE の lvDelta・lvReset /
     clearExpiredMods / ZONE_LOCAL_KEYS / continuousSources /
     continuousReaches（v15 の 'equippedMonster' を含む）/
     v14 StatModifier（攻守は v14、レベルは v16 と役割を分ける）

   ■ Replay 安全性
     - state は純JSON。Action 経由でしか積まない。
     - 値は Action に literal で載るので再適用しても同じになる。
     - 掃除は既存 Action 起点。期限判定は turn 比較の純関数。
     - 場を離れたら消える（ZONE_LOCAL_KEYS）。
   ========================================================================= */

const LV_KIND_V16 = Object.freeze(['add','set']);
const LV_UNTIL_V16 = Object.freeze(['endTurn','endPhase','endBattlePhase','permanent']);

function levelModsV16(card){
  const a = card && card.lvModsV16;
  return Array.isArray(a) ? a : [];
}
function makeLevelModV16(o, turn){
  return {
    kind: (LV_KIND_V16.indexOf(o.kind) >= 0) ? o.kind : 'add',
    value: Number(o.value) || 0,
    until: (LV_UNTIL_V16.indexOf(o.until) >= 0) ? o.until : 'permanent',
    label: String(o.label || '効果'),
    turn: Number(turn) || 0,
  };
}

/* ---- 各層の適用（curLV から呼ぶ） ---------------------------------------- */
function applyLevelModsV16(card, v){
  const list = levelModsV16(card);
  let out = v;
  list.forEach(m => { if(m.kind === 'add') out += (Number(m.value) || 0); });
  list.forEach(m => { if(m.kind === 'set') out = (Number(m.value) || 0); });
  return out;
}
/* 永続効果ソースによるレベルの増減・固定 */
function applyContinuousLevelV16(card, v){
  if(typeof continuousSources !== 'function') return v;
  const loc = (typeof locateCard === 'function') ? locateCard(card) : null;
  if(!loc) return v;
  let out = v, setTo = null;
  continuousSources().forEach(src=>{
    const cont = src.sc.continuous; if(!cont) return;
    const scope = cont.scope || 'self';
    if(!continuousReaches(scope, src.p, loc, src.card, card)) return;
    if(typeof cont.levelDelta === 'function'){
      let d = 0;
      try{ d = Number(cont.levelDelta(card, src.card)) || 0; }catch(e){ d = 0; }
      out += d;
    }
    if(typeof cont.setLevel === 'function'){
      let s = null;
      try{ s = cont.setLevel(card, src.card); }catch(e){ s = null; }
      if(s != null && Number.isFinite(Number(s))) setTo = Number(s);
    }
  });
  return (setTo != null) ? setTo : out;
}

/* ---- 期限切れの掃除（clearExpiredMods から呼ぶ） ------------------------- */
function keepLevelModV16(m, when){
  if(!m) return false;
  if(m.until === 'permanent') return true;
  if(when === 'endBattlePhase') return m.until !== 'endBattlePhase';
  if(when === 'endTurn') return m.until !== 'endTurn' && m.until !== 'endPhase' && m.until !== 'endBattlePhase';
  if(when === 'endPhase') return m.until !== 'endPhase';
  return true;
}

/* ---- 積む / 外す --------------------------------------------------------- */
function addLevelModV16(target, spec){
  const r = (typeof resolveTarget === 'function') ? resolveTarget(target) : null;
  if(!r) return false;
  act({type:'LEVEL_MOD_V16', player:r.p, zone:r.zone, index:r.index,
       kind:spec.kind, value:Number(spec.value) || 0,
       until:spec.until || 'permanent', label:spec.label || '効果'});
  return true;
}
function clearLevelModsV16(target, label){
  const r = (typeof resolveTarget === 'function') ? resolveTarget(target) : null;
  if(!r) return false;
  act({type:'LEVEL_MOD_V16', player:r.p, zone:r.zone, index:r.index,
       clear:true, label:label || null});
  return true;
}

/* ---- 直列化の検査（テスト用） ------------------------------------------- */
function assertLevelModStateSerializableV16(gs){
  gs = gs || gameState;
  for(let p=0;p<2;p++){
    const P = gs.players && gs.players[p]; if(!P) continue;
    for(const z of ['mz','sz','grave','hand','banish','deck','ex']){
      for(const c of (P[z]||[])){
        const list = c && c.lvModsV16;
        if(list == null) continue;
        if(!Array.isArray(list)) return 'lvModsV16 が配列でない';
        for(const m of list){
          if(!m || typeof m !== 'object') return 'lvModsV16 の要素が object でない';
          for(const k of Object.keys(m)){
            const v = m[k];
            if(v != null && typeof v !== 'number' && typeof v !== 'string'){
              return 'lvModsV16.' + k + ' が JSON 化できない';
            }
          }
        }
        try{ JSON.parse(JSON.stringify(list)); }
        catch(e){ return 'lvModsV16 が JSON 化できない'; }
      }
    }
  }
  return null;
}
