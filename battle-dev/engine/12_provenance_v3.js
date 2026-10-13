/* =========================================================================
   System P3 — Provenance 第1弾（summon / cost snapshot / move）
   -------------------------------------------------------------------------
   「ある処理結果が、どのカード・方法・場所・プレイヤーを由来として
     発生したか」を後続処理から判定できるようにする最小メタデータ層。

   ■ 適用範囲（第1弾）
       1. move provenance      … どこから／なぜ／誰の効果で移動したか
       2. summon provenance    … 召喚方法と素材の identity / snapshot
       3. cost snapshot        … コストにした時点の値（P1.1と共有する形式）
     destruction / damage provenance は今回対象外。

   ■ 絶対規則
       - JSON のみ。function / Promise / DOM / closure を保持しない。
       - identity は uid と passcode(code)。カード名・配列indexを権威にしない。
       - 既存フィールドの意味を変えない。discardInfo.byPlayer は
         「捨てさせた側」という既存の意味のまま触らない。
         新しい情報は必ず別フィールドとして併設する。
       - provenance を持たない既存 Action の digest を変えない
         （非空のときだけ digest に載せる）。
       - gameState に無制限の履歴ログを作らない。カード上の属性として持つ。

   ■ 疎な snapshot
       毎回全フィールドを保存しない。カード効果が後で必要とする値だけを
       snapshotCardV3(card, ['atk']) のように指定して保存する。
   ========================================================================= */

/* ---- snapshot の許可フィールド（これ以外は保存しない） ---------------- */
const P3_SNAPSHOT_FIELDS = Object.freeze(
  ['atk','def','level','attribute','race','controller','owner','zone',
   'originalAtk','originalDef']);

/* 「元々の攻撃力／守備力」。curStat の増減層より前、
   procedureBaseStats（妥協召喚など召喚手順が変える元々の数値）と
   setBase 継続層まで適用した値。オネスト等の一時修正は含めない。 */
function p3OriginalStatV3(card, key){
  if(!card) return null;
  const db = (typeof dbOf==='function') ? (dbOf(card)||{}) : {};
  let v = db[key] || 0;
  const ps = card.procedureBaseStats;
  if(ps && ps.active!==false && ps[key]!=null) v = ps[key];
  if(typeof collectContinuous==='function'){
    const Base = (key==='atk') ? 'setBaseAtk' : 'setBaseDef';
    const L = collectContinuous(card);
    (L && L.setBase ? L.setBase : []).forEach(l=>{ if(l[Base]!=null) v = l[Base]; });
  }
  return Math.max(0, v);
}

/* ---- カードの疎な snapshot を作る -------------------------------------
   uid と code は identity なので常に入る。それ以外は fields で明示指定。
   戻り値は JSON のみ。                                                   */
function snapshotCardV3(card, fields, hint){
  if(!card) return null;
  const db = (typeof dbOf==='function') ? (dbOf(card)||{}) : {};
  const out = {
    uid: (card.uid!=null) ? card.uid : null,
    code: (typeof db.c==='number') ? db.c : null
  };
  const want = Array.isArray(fields) ? fields : [];
  const loc = (hint && hint.zone!=null) ? hint
            : ((typeof locateCard==='function') ? locateCard(card) : null);
  want.forEach(f=>{
    if(P3_SNAPSHOT_FIELDS.indexOf(f)<0) return;      // 未知フィールドは無視
    switch(f){
      case 'atk':        out.atk = (typeof curATK==='function' && loc) ? curATK(card) : (db.atk!=null?db.atk:null); break;
      case 'def':        out.def = (typeof curDEF==='function' && loc) ? curDEF(card) : (db.def!=null?db.def:null); break;
      case 'level':      out.level = (typeof curLV==='function') ? curLV(card) : (db.lv!=null?db.lv:null); break;
      case 'attribute':  out.attribute = db.at || null; break;
      case 'race':       out.race = db.ra || null; break;
      case 'controller': out.controller = (loc && loc.p!=null) ? loc.p : null; break;
      case 'owner':      out.owner = (card.owner!=null) ? card.owner : null; break;
      case 'zone':       out.zone = (loc && loc.zone) ? loc.zone : (hint&&hint.zone)||null; break;
      case 'originalAtk': out.originalAtk = p3OriginalStatV3(card,'atk'); break;
      case 'originalDef': out.originalDef = p3OriginalStatV3(card,'def'); break;
    }
  });
  return out;
}

/* 元々の（DB表記の）値だけが欲しい場合。ガーゼット等が使う。 */
function snapshotOriginalCardV3(card, fields){
  if(!card) return null;
  const db = (typeof dbOf==='function') ? (dbOf(card)||{}) : {};
  const out = {uid:(card.uid!=null)?card.uid:null, code:(typeof db.c==='number')?db.c:null};
  (Array.isArray(fields)?fields:[]).forEach(f=>{
    if(P3_SNAPSHOT_FIELDS.indexOf(f)<0) return;
    if(f==='atk')            out.atk = p3OriginalStatV3(card,'atk');
    else if(f==='def')       out.def = p3OriginalStatV3(card,'def');
    else if(f==='level')     out.level = (db.lv!=null)?db.lv:null;
    else if(f==='attribute') out.attribute = db.at||null;
    else if(f==='race')      out.race = db.ra||null;
    else if(f==='owner')     out.owner = (card.owner!=null)?card.owner:null;
  });
  return out;
}

/* ---- move provenance --------------------------------------------------
   reason  : 'cost'|'effect'|'rule'|'battle'|'tribute'|'material'
   actingPlayer: その移動を起こした効果のコントローラ。
                 discardInfo.byPlayer は手札からの「捨てる」にしか存在しないが、
                 actingPlayer はデッキ・フィールドからの移動にも付く。
   fromZone: 移動元。toZone は Action 自体から分かるので保存しない。       */
const P3_MOVE_REASONS = Object.freeze(['cost','effect','rule','battle','tribute','material']);
function makeMoveProvenanceV3(reason, actingPlayer, fromZone){
  const r = P3_MOVE_REASONS.indexOf(reason)>=0 ? reason : 'effect';
  const out = {reason:r};
  if(actingPlayer===0 || actingPlayer===1) out.actingPlayer = actingPlayer;
  if(fromZone) out.fromZone = String(fromZone);
  return out;
}
/* Action から move provenance を組み立てる。a.p3 があればそれを優先する。 */
function moveProvenanceFromActionV3(a, fallbackZone){
  if(!a) return null;
  if(a.p3 && typeof a.p3==='object'){
    return makeMoveProvenanceV3(a.p3.reason, a.p3.actingPlayer, a.p3.fromZone||fallbackZone);
  }
  return null;
}
/* カードへ付与（非空のときだけ書く。空なら何もしない＝digest不変） */
function attachMoveProvenanceV3(card, prov){
  if(!card || !prov) return;
  card.moveProvenance = prov;
}

/* ---- 効果コンテキスト（provenance の自動付与） ------------------------
   カードスクリプト側に一切書かせずに「誰の効果で動いたか」を残すため、
   解決中の効果のコントローラを実行中だけ保持する。

   ★Replay 安全性: ここで持つのは live 実行中の一時情報だけで、gameState には
     入れない。provenance は act() の時点で Action へ焼き込むので、再生は
     Journal の Action だけで完全に決まる（隠れ globals に依存しない）。      */
let P3_EFFECT_CONTEXT = null;
function p3BeginEffectContextV3(player, source, sourceName){
  if(player!==0 && player!==1){ P3_EFFECT_CONTEXT=null; return; }
  const ctx={player:player};
  if(source && typeof source==='object'){
    if(source.uid!=null) ctx.uid=source.uid;
    if(!sourceName && typeof cardName==='function') sourceName=cardName(source);
  }else if(source!=null && Number.isFinite(Number(source))) ctx.uid=Number(source);
  if(sourceName) ctx.name=String(sourceName);
  P3_EFFECT_CONTEXT=ctx;
}
function p3EndEffectContextV3(){ P3_EFFECT_CONTEXT = null; }
/* 自動付与する移動 Action。ここを増やすときは必ずテストも足す。 */
/* S03-U146: FX_WIPE_ZONE (mass destruction) too — its destroyed cards get moveProvenance and graveInfo.byPlayer like FX_TO_GRAVE */
/* S03-U162: FX_BOUNCE / FX_RETURN_DECK too — 「相手のカードの効果によってフィールド上から離れた場合」 (マイン・モール) must know the cause
   of every departure by an effect, decided inside the action (replayed from the stamp, not from the live context) */
const P3_AUTO_MOVE_TYPES = Object.freeze(['FX_TO_GRAVE','FX_DISCARD','FX_MILL','FX_MILL_TOP','FX_HAND_SEND_GRAVE','FX_WIPE_ZONE','FX_BOUNCE','FX_RETURN_DECK']);
function p3StampMoveProvenanceV3(a){
  if(!a || a.p3 !== undefined) return a;              // 明示指定があれば尊重する
  if(P3_AUTO_MOVE_TYPES.indexOf(a.type) < 0) return a;
  /* S03-U290: a chain activation pays its cost while it is being prepared (engine/30 prepareDuelActivation, ACTIVATION_PREP_S03) outside any
     effect context — those moves are costs of the activating player (「カードの効果によって」 does not include them) */
  if(!P3_EFFECT_CONTEXT && typeof ACTIVATION_PREP_S03!=='undefined' && ACTIVATION_PREP_S03 && (ACTIVATION_PREP_S03.player===0 || ACTIVATION_PREP_S03.player===1)){
    a.p3 = {reason:'cost', actingPlayer:ACTIVATION_PREP_S03.player, grpS03:'C'+String(ACTIVATION_PREP_S03.uid)+':'+String(ACTIVATION_PREP_S03.afterSeq||0)};
    return a;
  }
  if(!P3_EFFECT_CONTEXT) return a;                    // 効果解決中でなければ何も足さない
  let phase = null;
  try{ phase = (typeof SCRIPT_PHASE!=='undefined') ? SCRIPT_PHASE : null; }catch(e){ phase = null; }
  a.p3 = {reason: (phase==='cost' ? 'cost' : 'effect'), actingPlayer: P3_EFFECT_CONTEXT.player};
  /* S03-U295: the move group (cards moved by one chain link's resolution, or by one activation's cost) — engine/1ZZN summaries are per group */
  const linkS03 = (typeof RESOLVING_LINK_S03!=='undefined') ? RESOLVING_LINK_S03 : null;
  a.p3.grpS03 = (linkS03 && linkS03.chainId!=null) ? 'L'+String(linkS03.chainId) : (phase==='cost' ? 'K' : 'E')+String(P3_EFFECT_CONTEXT.player);
  return a;
}

/* ---- summon provenance ------------------------------------------------
   summonType   : 'normal'|'tribute'|'special'|'flip'
   materialRefs : [uid]   ★カード名は使わない
   materialSnapshots: [snapshotCardV3(...)]                                */
const P3_SUMMON_TYPES = Object.freeze(['normal','tribute','special','flip','ritual']);
/* summonInstance: 召喚1回ごとの通し番号。gameState.summonSeq から採番する。
   uid は「どのカード実体か」しか表さないので、同じ実体の再召喚を区別できない。 */
function makeSummonProvenanceV3(summonType, materials, fields){
  const t = P3_SUMMON_TYPES.indexOf(summonType)>=0 ? summonType : 'special';
  const list = Array.isArray(materials) ? materials.filter(Boolean) : [];
  const out = {summonType:t};
  if(list.length){
    out.materialRefs = list.map(m=>(m && m.uid!=null)?m.uid:null).filter(x=>x!=null);
    out.materialSnapshots = list.map(m=>snapshotCardV3(m, fields||[]));
  }
  return out;
}
function attachSummonProvenanceV3(card, prov){
  if(!card || !prov) return;
  card.summonProvenance = prov;
}
/* 素材の側からも「どの召喚に使われたか」を辿れるようにする。
   カイザー・サクリファイス／ゾルガのように素材自身が誘発するカードが使う。 */
function markMaterialUsedV3(materialCard, summonType, summonedUid, actingPlayer){
  if(!materialCard) return;
  const out = {summonType:(P3_SUMMON_TYPES.indexOf(summonType)>=0?summonType:'special')};
  if(summonedUid!=null) out.summonedUid = summonedUid;
  if(actingPlayer===0||actingPlayer===1) out.actingPlayer = actingPlayer;
  materialCard.usedAsMaterial = out;
}

/* ---- cost snapshot ----------------------------------------------------
   将来の P1.1 activationContext.costs[key].snapshots と同一形式。
   ここでは「直近に支払ったコスト」をチェーンリンク側で読めるよう
   gameState.pendingCostSnapshots へ一時的に置く（commit で消費）。       */
function beginCostSnapshotsV3(gs){
  gs = gs || gameState;
  if(!gs) return;
  gs.pendingCostSnapshots = [];
}
function recordCostSnapshotV3(card, fields, gs){
  gs = gs || gameState;
  if(!gs || !card) return null;
  if(!Array.isArray(gs.pendingCostSnapshots)) gs.pendingCostSnapshots = [];
  const snap = snapshotCardV3(card, fields||[]);
  gs.pendingCostSnapshots.push(snap);
  return snap;
}
function takeCostSnapshotsV3(gs){
  gs = gs || gameState;
  if(!gs || !Array.isArray(gs.pendingCostSnapshots)) return [];
  const out = gs.pendingCostSnapshots.slice();
  gs.pendingCostSnapshots = [];
  return out;
}
function costSnapshotsOfChainLinkV3(link){
  return (link && Array.isArray(link.costSnapshots)) ? link.costSnapshots : [];
}

/* ---- 参照ヘルパ（カードスクリプトが使う） ------------------------------ */
function summonProvenanceOfV3(card){ return (card && card.summonProvenance) || null; }
function moveProvenanceOfV3(card){ return (card && card.moveProvenance) || null; }
function materialSnapshotsOfV3(card){
  const p = summonProvenanceOfV3(card);
  return (p && Array.isArray(p.materialSnapshots)) ? p.materialSnapshots : [];
}
function wasUsedAsMaterialV3(card, summonType){
  const u = card && card.usedAsMaterial;
  if(!u) return false;
  return summonType ? u.summonType===summonType : true;
}
/* 「この素材は、まさにその召喚の素材だったか」。
   同じカード実体を再召喚しても前回の素材が誘発しないよう、uid ではなく
   召喚の通し番号（summonInstance）で照合する。 */
function usedAsMaterialForSummonV3(materialCard, summonedCard, summonType){
  const u = materialCard && materialCard.usedAsMaterial;
  const p = summonedCard && summonedCard.summonProvenance;
  if(!u || !p) return false;
  if(u.summonInstance==null || p.summonInstance==null) return false;
  if(u.summonInstance!==p.summonInstance) return false;
  return summonType ? u.summonType===summonType : true;
}
/* 「相手の効果で動かされたか」— actingPlayer が自分でないこと */
function movedByOpponentEffectV3(card, myPlayer){
  const m = moveProvenanceOfV3(card);
  if(!m || m.reason!=='effect') return false;
  return m.actingPlayer!=null && m.actingPlayer!==myPlayer;
}

/* ---- 直列化検査（テスト用） ------------------------------------------- */
function assertProvenanceSerializableV3(value){
  const bad=[];
  (function walk(v,path,d){
    if(d>10){ bad.push(path+': too deep'); return; }
    if(v===null) return;
    const t=typeof v;
    if(t==='function'||t==='undefined'||t==='symbol'){ bad.push(path+': '+t); return; }
    if(t!=='object') return;
    if(v instanceof Map||v instanceof Set){ bad.push(path+': '+v.constructor.name); return; }
    if(v.nodeType!=null||v.classList!=null){ bad.push(path+': DOM'); return; }
    if(typeof v.then==='function'){ bad.push(path+': thenable'); return; }
    if(Array.isArray(v)){ v.forEach((x,i)=>walk(x,path+'['+i+']',d+1)); return; }
    Object.keys(v).forEach(k=>walk(v[k],path+'.'+k,d+1));
  })(value,'provenance',0);
  let rt=true;
  try{ JSON.parse(JSON.stringify(value===undefined?null:value)); }catch(e){ rt=false; bad.push('JSON roundtrip failed'); }
  return {ok:bad.length===0&&rt, why:bad.join(', ')};
}
