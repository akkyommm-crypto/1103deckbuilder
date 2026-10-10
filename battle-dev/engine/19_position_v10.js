/* =========================================================================
   System v10 — Position event / forced-position primitive
   -------------------------------------------------------------------------
   「表示形式が変わった時」と「〜は全て守備表示になる」を共通化する。

   既に存在するので**作り直さない**もの:
     TOGGLE_POS / FX_SET_STATE      … 表示形式を変える Action そのもの
     canManualPositionChange        … 手動変更の可否（1ターン1回など）
     onFlip                         … 反転召喚・戦闘による反転
     continuousSources / continuousReaches
                                    … 永続効果の収集と及ぶ範囲の既存規約
     commitAutomaticActionV44       … ルール処理を Journal に載せる既存の入口
     P1 ChoiceRequest / P4 predicate / v7 scheduler / v9 fieldSnap

   今回足りないので足すもの:
     1. 「表示形式が変わった」イベント（変更前後の face / pos を保持する）
     2. 「〜は全て守備表示になる」の永続強制（レベル制限A地区・B地区など）
     3. 「表示形式を変更する事ができなくなる」のロック
     4. 通常は変更できないフェイズに変更を許す追加ウィンドウ

   ■ 設計
     - 検出は v9 と同じく applyAction の末尾で直前スナップショットとの差分。
       deferredEvents は digest に含まれるので、act() 側で積むと
       Action を直接再適用する Replay と食い違う。
     - 強制表示形式の適用は act() 側から commitAutomaticActionV44 で行う。
       Action として Journal に載るため Undo / Redo / Replay がそのまま効く。
     - onFlip は既存経路（反転召喚・戦闘）が発火済みなので二重に出さない。
       効果で表側にした場合だけ Action に v10FlipEffect 目印を付け、
       その Action に限って onFlip を出す。目印は Action の一部なので
       Replay でも同じ判定になる。
     - state は純 JSON。identity は uid。カード名・配列 index を authority に
       しない。スナップショットはフィールドのモンスター分だけで履歴は持たない。
   ========================================================================= */

const POS_ZONES_V10 = Object.freeze(['mz']);

/* ---- 直前スナップショット ---------------------------------------------- */
function positionSnapshotV10(gs){
  gs = gs || gameState;
  const out = [];
  for(let p=0;p<2;p++){
    const P = gs.players[p]; if(!P) continue;
    POS_ZONES_V10.forEach(z=>{
      (P[z]||[]).forEach(c=>{
        if(!c) return;
        const uid = (typeof ensureCardUid==='function') ? ensureCardUid(gs,c) : c.uid;
        if(uid==null) return;
        out.push({uid, p, zone:z, face:c.face||'up', pos:c.pos||'atk'});
      });
    });
  }
  return out;
}

/* 同じ uid が同じ zone に残ったまま face / pos だけ変わったものを拾う。
   場を離れた・入ってきたカードは v9 の担当なのでここでは扱わない。 */
function positionChangesV10(gs){
  gs = gs || gameState;
  const before = Array.isArray(gs.posSnapV10) ? gs.posSnapV10 : [];
  if(!before.length) return [];
  const now = positionSnapshotV10(gs);
  const idx = Object.create(null);
  now.forEach(x=>{ idx[x.uid] = x; });
  const out = [];
  before.forEach(b=>{
    const a = idx[b.uid];
    if(!a || a.zone !== b.zone) return;
    if(a.face === b.face && a.pos === b.pos) return;
    out.push({uid:b.uid, player:a.p, zone:a.zone,
              fromFace:b.face, fromPos:b.pos, toFace:a.face, toPos:a.pos});
  });
  return out;
}

/* ---- 検出とイベント発火（applyAction の末尾から呼ぶ） -------------------- */
function v10DetectPositionChange(gs, a){
  gs = gs || gameState;
  if(!gs || !gs.players) return 0;
  /* S03-U278: the position chosen for a Special Summon (SS_POS_S03, engine/1ZZK) is part of that summon, not a position change */
  if(a && a.type === 'SS_POS_S03'){ gs.posSnapV10 = positionSnapshotV10(gs); return 0; }
  const changes = positionChangesV10(gs);
  gs.posSnapV10 = positionSnapshotV10(gs);
  if(!changes.length) return 0;
  if(typeof queueDeferredEventV2 === 'function'
     && typeof PLAY_MODE !== 'undefined' && PLAY_MODE === PLAY_MODES.DUEL){
    changes.forEach(x=>{
      /* S03-U185: 「リバースした」 record (電池メン－ボタン型 ②) — zone-local, set when the card turns face-up from face-down */
      if(x.fromFace === 'down' && x.toFace === 'up'){ const hr = (typeof findCardByUid==='function') ? findCardByUid(x.uid) : null; if(hr){ hr.card.reversedS03 = true; hr.card.flippedTurnS03 = gs.turn; } }   /* S03-U244: 「リバースしたターン」 (スピリット) — the turn it turned face-up */
      /* S03-U282: a 「地縛神」 turned face-up while another is face-up (engine/1ZZM; destroyed by engine/1ZZF) */
      if(x.fromFace === 'down' && x.toFace === 'up' && typeof uniqueFlipViolationS03 === 'function') uniqueFlipViolationS03(gs, x.uid);
      queueDeferredEventV2('onPositionChange', makePositionEventV10(x));
      /* 効果で裏→表にした場合だけ、リバース効果のために onFlip も出す。 */
      if(a && a.v10FlipEffect && x.fromFace === 'down' && x.toFace === 'up'){
        const hit = (typeof findCardByUid==='function') ? findCardByUid(x.uid) : null;
        if(hit) queueDeferredEventV2('onFlip', {player:x.player, card:hit.card,
          name:(typeof cardName==='function'?cardName(hit.card):null),
          treatAsField:true, byEffect:true});
      }
    });
  }
  return changes.length;
}

function makePositionEventV10(o){
  return {uid:o.uid, player:o.player, zone:o.zone,
          fromFace:o.fromFace, fromPos:o.fromPos, toFace:o.toFace, toPos:o.toPos};
}

/* ---- 参照ヘルパ（テスト・カードスクリプト用） ---------------------------- */
function positionChangedCardV10(evt){
  if(!evt || evt.uid==null || typeof findCardByUid!=='function') return null;
  const hit = findCardByUid(evt.uid);
  return hit ? hit.card : null;
}
/* 攻撃表示から表側守備表示になった（ブレードラビット等の条件） */
function turnedToFaceUpDefenseV10(evt){
  return !!evt && evt.fromFace==='up' && evt.fromPos==='atk'
              && evt.toFace==='up'   && evt.toPos==='def';
}
function turnedFaceUpV10(evt){
  return !!evt && evt.fromFace==='down' && evt.toFace==='up';
}

/* ---- 永続の強制表示形式 -------------------------------------------------- */
/* 継続効果ソースが continuous.forcedPosition(card, src) で 'atk' / 'def' を
   返したら、そのモンスターはその表示形式に固定される。
   同時に複数の指定が出た場合は「先に確定した外側（魔法・罠）」を優先する。 */
function forcedPositionForV10(card){
  if(!card || card.face!=='up') return null;
  if(typeof continuousSources!=='function') return null;
  const loc = (typeof locateCard==='function') ? locateCard(card) : null;
  if(!loc || loc.zone!=='mz') return null;
  let want = null;
  continuousSources().forEach(src=>{
    if(want) return;
    const f = src.sc.continuous && src.sc.continuous.forcedPosition;
    if(typeof f!=='function') return;
    if(!continuousReaches(src.sc.continuous.scope||'allMonsters', src.p, loc, src.card, card)) return;
    let r = null;
    try{ r = f(card, src.card); }catch(e){ r = null; }
    if(r==='atk' || r==='def') want = r;
  });
  return want;
}

/* 表示形式を変更できないか。強制表示形式が掛かっている間も変更できない。 */
function cannotChangePositionV10(card){
  if(!card) return false;
  if(typeof continuousSources!=='function') return false;
  const loc = (typeof locateCard==='function') ? locateCard(card) : null;
  if(!loc || loc.zone!=='mz') return false;
  if(forcedPositionForV10(card)) return true;
  /* S03-U186: 「そのモンスターはこのターン表示形式を変更できない」 (強制転移) — a turn-stamped zone-local mark */
  if(card.noPosChangeTurnS03 === gameState.turn) return true;
  return continuousSources().some(src=>{
    const f = src.sc.continuous && src.sc.continuous.cannotChangePosition;
    if(typeof f!=='function') return false;
    if(!continuousReaches(src.sc.continuous.scope||'allMonsters', src.p, loc, src.card, card)) return false;
    try{ return !!f(card, src.card); }catch(e){ return false; }
  });
}

/* 通常は変更できないフェイズに手動変更を許す追加ウィンドウ。
   continuous.positionWindow(card, src) が現在フェイズを含む配列を返す。 */
function positionWindowOpenV10(card){
  if(!card || card.face!=='up') return false;
  if(typeof continuousSources!=='function') return false;
  const loc = (typeof locateCard==='function') ? locateCard(card) : null;
  if(!loc || loc.zone!=='mz') return false;
  if(card.posWindowUsedTurnV10 === gameState.turn) return false;
  return continuousSources().some(src=>{
    const f = src.sc.continuous && src.sc.continuous.positionWindow;
    if(typeof f!=='function') return false;
    if(!continuousReaches(src.sc.continuous.scope||'self', src.p, loc, src.card, card)) return false;
    let ph = null;
    try{ ph = f(card, src.card); }catch(e){ ph = null; }
    return Array.isArray(ph) && ph.indexOf(gameState.phase) >= 0;
  });
}

/* ---- 強制表示形式の適用（act() のルール処理点から呼ぶ） ------------------ */
let POS_RESOLVING_V10 = false;
function enforceForcedPositionV10(gs){
  gs = gs || gameState;
  if(POS_RESOLVING_V10) return 0;
  if(!gs || !gs.players) return 0;
  if(typeof commitAutomaticActionV44!=='function') return 0;
  let acted = 0, guard = 0;
  POS_RESOLVING_V10 = true;
  try{
    for(;;){
      if(guard++ >= 16) break;
      let hit = null;
      for(let p=0;p<2 && !hit;p++){
        const P = gs.players[p]; if(!P) continue;
        (P.mz||[]).forEach((c,i)=>{
          if(hit || !c || c.face!=='up') return;
          const want = forcedPositionForV10(c);
          if(!want || (c.pos||'atk') === want) return;
          hit = {p, index:i, want};
        });
      }
      if(!hit) break;
      commitAutomaticActionV44({type:'FX_SET_STATE', player:hit.p, zone:'mz',
        index:hit.index, pos:hit.want, reason:'永続効果による表示形式の強制'});
      acted++;
    }
  } finally { POS_RESOLVING_V10 = false; }
  return acted;
}

/* ---- 直列化の検査（テスト用） ------------------------------------------- */
function assertPositionStateSerializableV10(gs){
  gs = gs || gameState;
  const snap = gs.posSnapV10;
  if(!Array.isArray(snap)) return 'posSnapV10 が配列でない';
  for(const x of snap){
    if(!x || typeof x!=='object') return 'スナップショット要素が object でない';
    for(const k of Object.keys(x)){
      const v = x[k];
      if(v!=null && typeof v!=='number' && typeof v!=='string') return 'posSnapV10.'+k+' が JSON 化できない';
    }
  }
  try{ JSON.parse(JSON.stringify(snap)); }catch(e){ return 'posSnapV10 が JSON 化できない'; }
  return null;
}
