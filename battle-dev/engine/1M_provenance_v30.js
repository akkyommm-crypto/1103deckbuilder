/* ============================================================================
   System v30 — Destroy / SpecialSummon / Destruction-history provenance
   ----------------------------------------------------------------------------
   B1 destroyer byPlayer
     「このカードを破壊したプレイヤー」を効果破壊経路でも決められるようにする。
     戦闘破壊は BATTLE_CLEANUP が既に byPlayer を入れている。効果破壊だけが
     欠けていたので、解決中のチェーンリンクの player を既定値として使う。
     これは v21 の destroyerKindV21 / destroyerTargetingV21 と同じ考え方で、
     新しい provenance 体系は作らない。

   B2 specialSummonedFromPlayer
     FX_SPECIAL_SUMMON は a.fromPlayer を既に受け取っているのに、カードには
     ゾーン名 (specialSummonedFrom) しか残していなかった。
     「相手の墓地から特殊召喚された」を owner から推測しないために、
     取り出し元プレイヤーをそのまま残す。

   B3 destroyedThisTurnV30
     「相手フィールド上に守備表示で存在するモンスターを破壊したターン」は
     バトルフェイズ単位ではなくターン単位で、しかも戦闘破壊・効果破壊の
     両方が対象になる。battlePhaseV6 はフェイズ終了で消えるうえ表示形式を
     持たないため、ターン単位の破壊記録を最小限だけ足す。純 JSON。
   ========================================================================== */

/* ---- B1: 破壊したプレイヤー -------------------------------------------
   明示指定 > 解決中チェーンリンクの発動プレイヤー > null。
   チェーン外（ルール処理・コスト等）では null のままにする。推測しない。 */
function destroyerPlayerV30(gs, a){
  gs = gs || gameState;
  if(a && (a.byPlayer===0 || a.byPlayer===1)) return a.byPlayer;
  /* S03-U146: the controller of the resolving effect, baked into the Action by act() (a.p3, engine/12 P3 stamp; Replay-safe).
     In DUEL the resolving link has already left gs.chain (CHAIN_RESOLVE_TOP), so the chain fallback below gave null — or the
     player of the NEXT link down when the chain had more than one link. */
  if(a && a.p3 && typeof a.p3 === 'object' && a.p3.reason === 'effect' && (a.p3.actingPlayer===0 || a.p3.actingPlayer===1)) return a.p3.actingPlayer;
  const chain = Array.isArray(gs.chain) ? gs.chain : [];
  if(!chain.length) return null;
  const link = chain[chain.length-1];
  if(!link || (link.player!==0 && link.player!==1)) return null;
  return link.player;
}

/* ---- B2: 特殊召喚の取り出し元プレイヤー -------------------------------- */
function specialSummonFromPlayerV30(card){
  if(!card) return null;
  const v = card.specialSummonedFromPlayer;
  return (v===0 || v===1) ? v : null;
}
/* 「相手の（領域）から自分フィールドへ特殊召喚された」か。
   owner ではなく、実際に取り出した領域の持ち主で判定する。 */
function summonedFromOpponentV30(card, controllerPlayer, zone){
  const fp = specialSummonFromPlayerV30(card);
  if(fp===null) return false;
  if(controllerPlayer!==0 && controllerPlayer!==1) return false;
  if(fp === controllerPlayer) return false;
  if(zone && card.specialSummonedFrom !== zone) return false;
  return true;
}

/* ---- B3: ターン単位の破壊記録 ------------------------------------------
   entry: {turn, byPlayer, victimPlayer, from, pos, face, lv, uid, battle}
   すべて純 JSON。カードそのものは持たない。 */
function ensureDestroyLogV30(gs){
  gs = gs || gameState;
  if(!Array.isArray(gs.destroyedThisTurnV30)) gs.destroyedThisTurnV30 = [];
  return gs.destroyedThisTurnV30;
}
function recordDestroyedV30(gs, o){
  gs = gs || gameState;
  if(!o) return;
  const log = ensureDestroyLogV30(gs);
  log.push({
    turn:         gs.turn,
    byPlayer:     (o.byPlayer===0||o.byPlayer===1) ? o.byPlayer : null,
    victimPlayer: (o.victimPlayer===0||o.victimPlayer===1) ? o.victimPlayer : null,
    from:         o.from || null,
    pos:          o.pos || null,
    face:         o.face || null,
    lv:           (typeof o.lv==='number') ? o.lv : null,
    uid:          (o.uid!=null) ? o.uid : null,
    battle:       !!o.battle
  });
}
/* ターンが変わった記録を捨てる。無制限履歴にしない。 */
function pruneDestroyLogV30(gs){
  gs = gs || gameState;
  if(!Array.isArray(gs.destroyedThisTurnV30)) return;
  const t = gs.turn;
  gs.destroyedThisTurnV30 = gs.destroyedThisTurnV30.filter(x => x && x.turn === t);
}
/* このターン、byPlayer が victimPlayer のフィールドの守備表示モンスターを破壊したか。
   裏側守備表示も「守備表示」に含む。戦闘破壊・効果破壊の双方を含む。 */
function destroyedDefenseMonsterThisTurnV30(gs, byPlayer, victimPlayer){
  gs = gs || gameState;
  const log = Array.isArray(gs.destroyedThisTurnV30) ? gs.destroyedThisTurnV30 : [];
  return log.some(x => x
    && x.turn === gs.turn
    && x.from === 'mz'
    && x.pos === 'def'
    && x.byPlayer === byPlayer
    && x.victimPlayer === victimPlayer);
}

/* ---- 直列化検査（テスト用） -------------------------------------------- */
function assertProvenanceSerializableV30(gs){
  gs = gs || gameState;
  const bad = [];
  (Array.isArray(gs.destroyedThisTurnV30)?gs.destroyedThisTurnV30:[]).forEach((x,i)=>{
    if(x===null || typeof x!=='object'){ bad.push('destroyedThisTurnV30['+i+']'); return; }
    Object.keys(x).forEach(k=>{
      const t = typeof x[k];
      if(x[k]!==null && t!=='number' && t!=='string' && t!=='boolean') bad.push('destroyedThisTurnV30['+i+'].'+k+': '+t);
    });
  });
  return { ok: bad.length===0, why: bad.join(', ') };
}
