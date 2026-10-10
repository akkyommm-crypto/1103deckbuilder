/* =========================================================================
   System v14 — StatModifier primitive（元々の数値／SET／SWAP の期間管理）
   -------------------------------------------------------------------------
   「攻撃力は○○になる」「元々の攻撃力と守備力を入れ替える」
   「元々の攻撃力・守備力は半分になる」を共通化する。

   ■ 既存の層（curStat）を壊さない
     curStat は既に多層になっている。v14 はその隙間に2つ挟むだけで、
     既存の層の意味は変えない。適用順は次の通り。

       ①  db の印刷された数値
       ②  procedureBaseStats（妥協召喚など召喚手順による元々の数値）
       ③  v14 base 層  … addBase / setBase / swapBase   ← 追加
       ④  continuous.setBaseAtk / setBaseDef（永続効果の元々の数値）
       ⑤  continuous.setAtk / setDef（永続効果の現在値SET）
       ⑥  v14 set 層   … setAtk / setDef                ← 追加
       ⑦  card.mods（オネスト・突進などの加算／減算）
       ⑧  continuous.atk / def（永続効果の増減）
       ⑨  continuous.setFinalAtk / setFinalDef

     「攻撃力が0になった後に800アップ」は 800 になる（⑥→⑦の順）。
     同じ層に複数入った場合は**後から入れた方が勝つ**（配列順）。

   ■ 期間
     既存 card.mods と同じ until を使い、掃除も既存の
     clearExpiredMods(gs, when) に相乗りする。
       'endTurn'         … ターン終了時まで
       'endPhase'        … そのフェイズ終了時まで
       'endBattlePhase'  … バトルフェイズ終了時まで
       'permanent'       … 場を離れるまで

   ■ 元々の数値の読み出し
     「元々の攻撃力分のダメージ」のような処理のために baseAtkV14 /
     baseDefV14 を用意する。db の印刷値ではなく、②③まで反映した値。

   既に存在するので**作り直さない**もの:
     curStat / curATK / curDEF / card.mods / MOD_ADD / MOD_SET /
     clearExpiredMods / procedureBaseStats / continuous.* の各層 /
     v7 scheduler（期限つき破壊などの予約）

   ■ Replay 安全性
     - state は純JSON。Action 経由でしか積まない。
     - 値は Action に literal で載せるので、再適用しても同じ数値になる。
     - 掃除は既存の clearExpiredMods と同じ Action 起点。
     - 場を離れたら消える（ZONE_LOCAL_KEYS）。
   ========================================================================= */

const STAT_KIND_V14 = Object.freeze(['addBase','setBase','swapBase','setAtk','setDef']);
const STAT_UNTIL_V14 = Object.freeze(['endTurn','endPhase','endBattlePhase','permanent']);

function statModsV14(card){
  const a = card && card.statModsV14;
  return Array.isArray(a) ? a : [];
}
function makeStatModV14(o, turn){
  return {
    kind: (STAT_KIND_V14.indexOf(o.kind) >= 0) ? o.kind : 'setAtk',
    atk: (o.atk != null) ? Number(o.atk) : null,
    def: (o.def != null) ? Number(o.def) : null,
    until: (STAT_UNTIL_V14.indexOf(o.until) >= 0) ? o.until : 'endTurn',
    label: String(o.label || '効果'),
    turn: Number(turn) || 0,
  };
}

/* ---- 各層の適用 ---------------------------------------------------------
   key は 'atk' か 'def'。v は現時点の値。                                */
function applyStatBaseLayerV14(card, key, v){
  const list = statModsV14(card);
  if(!list.length) return v;
  /* swapBase は「入れ替え」なので、その時点の両方の値が要る。
     base 層の中で順番に畳み込む。                                       */
  let atk = (key === 'atk') ? v : null;
  let def = (key === 'def') ? v : null;
  /* 相方の値も同じ手順で作る（swap が無ければ使わない）。 */
  const needPair = list.some(m => m.kind === 'swapBase');
  if(needPair){
    const other = (key === 'atk') ? 'def' : 'atk';
    let ov = (dbOf(card)[other] || 0);
    const ps = card && card.procedureBaseStats;
    if(ps && ps.active !== false && ps[other] != null) ov = ps[other];
    if(key === 'atk') def = ov; else atk = ov;
  }
  list.forEach(m => {
    if(m.kind === 'addBase'){
      if(m.atk != null && atk != null) atk += m.atk;
      if(m.def != null && def != null) def += m.def;
    }else if(m.kind === 'setBase'){
      if(m.atk != null && atk != null) atk = m.atk;
      if(m.def != null && def != null) def = m.def;
    }else if(m.kind === 'swapBase'){
      if(needPair){ const t = atk; atk = def; def = t; }
    }
  });
  return (key === 'atk') ? atk : def;
}
function applyStatSetLayerV14(card, key, v){
  const list = statModsV14(card);
  let out = v;
  list.forEach(m => {
    if(key === 'atk' && m.kind === 'setAtk' && m.atk != null) out = m.atk;
    if(key === 'def' && m.kind === 'setDef' && m.def != null) out = m.def;
  });
  return out;
}

/* ---- 元々の数値（②③まで反映した値） ------------------------------------ */
function baseStatV14(card, key){
  if(!card) return 0;
  let v = dbOf(card)[key] || 0;
  const ps = card.procedureBaseStats;
  if(ps && ps.active !== false && ps[key] != null) v = ps[key];
  v = applyStatBaseLayerV14(card, key, v);
  return Math.max(0, Number(v) || 0);
}
function baseAtkV14(card){ return baseStatV14(card, 'atk'); }
function baseDefV14(card){ return baseStatV14(card, 'def'); }

/* ---- 期限切れの掃除（既存 clearExpiredMods から呼ぶ） -------------------- */
function keepStatModV14(m, when){
  if(!m) return false;
  if(m.until === 'permanent') return true;
  if(when === 'endBattlePhase') return m.until !== 'endBattlePhase';
  if(when === 'endTurn') return m.until !== 'endTurn' && m.until !== 'endPhase' && m.until !== 'endBattlePhase';
  if(when === 'endPhase') return m.until !== 'endPhase';
  return true;
}

/* ---- 積む / 外す --------------------------------------------------------- */
function addStatModV14(target, spec){
  const r = (typeof resolveTarget === 'function') ? resolveTarget(target) : null;
  if(!r) return false;
  act({type:'STAT_MOD_V14', player:r.p, zone:r.zone, index:r.index,
       kind:spec.kind, atk:(spec.atk != null) ? Number(spec.atk) : null,
       def:(spec.def != null) ? Number(spec.def) : null,
       until:spec.until || 'endTurn', label:spec.label || '効果'});
  return true;
}
function clearStatModsV14(target, label){
  const r = (typeof resolveTarget === 'function') ? resolveTarget(target) : null;
  if(!r) return false;
  act({type:'STAT_MOD_V14', player:r.p, zone:r.zone, index:r.index,
       clear:true, label:label || null});
  return true;
}

/* ---- 直列化の検査（テスト用） ------------------------------------------- */
function assertStatModStateSerializableV14(gs){
  gs = gs || gameState;
  for(let p=0;p<2;p++){
    const P = gs.players && gs.players[p]; if(!P) continue;
    for(const z of ['mz','sz','grave','hand','banish','deck','ex']){
      for(const c of (P[z]||[])){
        const list = c && c.statModsV14;
        if(list == null) continue;
        if(!Array.isArray(list)) return 'statModsV14 が配列でない';
        for(const m of list){
          if(!m || typeof m !== 'object') return 'statModsV14 の要素が object でない';
          for(const k of Object.keys(m)){
            const v = m[k];
            if(v != null && typeof v !== 'number' && typeof v !== 'string'){
              return 'statModsV14.' + k + ' が JSON 化できない';
            }
          }
        }
        try{ JSON.parse(JSON.stringify(list)); }
        catch(e){ return 'statModsV14 が JSON 化できない'; }
      }
    }
  }
  return null;
}
