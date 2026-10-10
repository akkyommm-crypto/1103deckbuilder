/* =========================================================================
   S03-U22 — ダメージステップ中に解決する誘発効果の攻守変化
   -------------------------------------------------------------------------
   canModifyNow（engine/60）は「フリーチェーンの攻守変動は②ダメージ計算前まで」を、効果の解決時
   （API.modAtk）に判定している。チェーンの解決では ACTIVE_SCRIPT が設定されないため、
   全てのチェーンブロックがフリーチェーンの規則で判定され、③ダメージ計算時以降に解決する
   誘発効果（ロケット戦士、ファイターズ・エイプ、ジュラック・ティラヌス など「ダメージ計算後」
   「戦闘で破壊し墓地へ送った時」の効果）が攻守を変えられなかった。
   2011 wiki：ヘル・ツイン・コップ「このカードの誘発効果の効果解決時に攻撃力が上がります」、
   ファイターズ・エイプ「誘発効果であり（チェーンブロックが）作られます」。
   ■ 解決中のチェーンブロックを覚えておく
     ・誘発イベントで発動したブロック（eventName あり）…ダメージステップのどの段階でも攻守を変えられる。
     ・damageStepOnly を宣言したスクリプトのブロック…③ダメージ計算時まで（dsOnly）。
     ・それ以外（フリーチェーンで発動したブロック）…従来どおり canModifyNow の規則。
   解決中の選択（pendingChoice）の後で続きが実行されることがあるので、印は次のブロックの解決開始か
   チェーンの終了まで保持する。チェーンの外（手動の発動）は従来どおり ACTIVE_SCRIPT で判定する。
   ========================================================================= */
let RESOLVING_LINK_S03 = null;
function beginLinkResolutionS03(link, sc){
  RESOLVING_LINK_S03 = link ? {
    name: link.name || null,
    chainId: link.chainId!=null ? link.chainId : null,   /* S03-U267 */
    eventName: link.eventName || null,
    damageStepOnly: !!(sc && sc.damageStepOnly),
    /* S03-U50: 効果ダメージの発生源（冥府の使者ゴーズ）。CHAIN_RESOLVE_TOP の後なのでチェーンが空ならチェーン1。 */
    player: (link.player===0||link.player===1) ? link.player : null,
    uid: link.uid!=null ? link.uid : null,
    /* S03-U131: 発動したゾーン（「墓地で発動する効果」の判定。ネクロバレー） */
    from: link.from || null,
    chainLinkOne: !!(typeof gameState!=='undefined' && gameState && Array.isArray(gameState.chain) && gameState.chain.length===0),
    /* S03-U168: the uids this link targets (only for a targeting script, targets:true — the same rule as the target immunity check).
       Carried into the affecting actions' source stamp (engine/1ZG a.srcS03.tg) for 「対象を取らない効果では破壊されない」. */
    targetUids: linkTargetUidsS03(link)
  } : null;
  /* S03-U208 follow-up: mirrored in gameState (not part of the digest) so that a save made during a resolution choice restores it on load
     (reconcileChoiceAfterLoadV49) — the resumed actions then carry the same effect source stamp (a.srcS03) as the live run. */
  if(typeof gameState!=='undefined' && gameState){ if(RESOLVING_LINK_S03) gameState.resolvingLinkS03 = JSON.parse(JSON.stringify(RESOLVING_LINK_S03)); else delete gameState.resolvingLinkS03; }
}
function linkTargetUidsS03(link){
  const sc = (link && typeof CARD_SCRIPTS!=='undefined') ? CARD_SCRIPTS[link.name] : null;
  if(!sc || sc.targets!==true) return [];
  const out = [];
  (function walk(v, d){
    if(!v || typeof v!=='object' || d>6) return;
    if(Array.isArray(v)){ v.forEach(x=>walk(x, d+1)); return; }
    if(v[CHAIN_CARD_REF_V2] && v.ref && v.ref.uid!=null){ if(out.indexOf(v.ref.uid)<0) out.push(v.ref.uid); return; }
    if(v.card && v.card.uid!=null){ if(out.indexOf(v.card.uid)<0) out.push(v.card.uid); return; }
    Object.keys(v).forEach(k=>walk(v[k], d+1));
  })(link.targets || link.selection || [], 0);
  return out;
}
function endLinkResolutionS03(){ RESOLVING_LINK_S03 = null; if(typeof gameState!=='undefined' && gameState) delete gameState.resolvingLinkS03; }
/* true / false で判定を返す。null なら従来の規則に任せる。 */
function damageStepModifyAllowedS03(info){
  const r = RESOLVING_LINK_S03;
  if(!r || !info) return null;
  if(r.eventName) return true;
  if(r.damageStepOnly) return !!info.dsOnly;
  return null;
}
