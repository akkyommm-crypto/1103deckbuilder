/* =========================================================================
   System v6 — Battle primitive
   -------------------------------------------------------------------------
   既存の戦闘エンジンは既にかなり揃っている。新しい subsystem は作らず、
   足りない4系統だけを既存 Action / event / state へ足す。

   既に存在するので**作り直さない**もの:
     continuous.cannotAttack / mustAttack        攻撃制限・攻撃強制
     continuous.battleDamage(info)               戦闘ダメージの増減・0化・倍化
     continuous.piercingDamage(info)             貫通
     sc.canDirectAttack                          自分自身の直接攻撃許可
     GRANT_EXTRA_ATTACK_V48 / attackCount        追加攻撃・攻撃回数
     NEGATE_ATTACK_V45                           攻撃の無効
     onAttackDeclare / onDamageStep / onBattleDestroy
     gameState.battle{atkUid,targetUid,step,...} 進行中の戦闘
     gameState.lastBattle                        直前の戦闘の結果
     battleProof                                 戦闘破壊耐性
     temporaryFlags.noBattlePhase                バトルフェイズを行えない

   今回足りないので足すもの:
     1. 戦闘ダメージのイベント化（金額・直接攻撃か・与えた側／受けた側）
     2. 他のモンスターへの直接攻撃許可、攻撃対象の固定・変更
     3. バトルフェイズ終了時イベントとバトルフェイズ制御
     4. 戦闘 identity の uid 化（カード名照合をやめる）

   ■ Replay 安全性
     - 追加する state は全て JSON。closure / DOM / Promise / Map / Set は持たない。
     - identity は uid。カード名・配列 index を authority にしない。
     - 場を離れたら消えるべき許可は ZONE_LOCAL_KEYS で寿命管理する。
     - 「attack replay（ルール上の巻き戻し）」と「System Replay（操作再生）」は
       別物。本モジュールの名前は battleReplay… を使わず attackRedirect… とする。
   ========================================================================= */

/* ---- カード上の戦闘許可（領域ローカル） --------------------------------
   {directAttackTurn, multiAttackTurn, attackLockUid} を1つのオブジェクトに
   まとめる。ターン番号で持つので、次のターンには自然に失効する。        */
function battlePermissionV6(card){
  return (card && card.battlePermission) || null;
}
function ensureBattlePermissionV6(card){
  if(!card) return null;
  if(!card.battlePermission) card.battlePermission = {};
  return card.battlePermission;
}
/* このターン、このカードは直接攻撃できるか（他のカードから許可された分） */
function grantedDirectAttackV6(card, gs){
  gs = gs || gameState;
  const p = battlePermissionV6(card);
  return !!(p && p.directAttackTurn != null && p.directAttackTurn === gs.turn);
}
/* このターン、相手モンスター全てに1回ずつ攻撃できるか */
function grantedMultiAttackV6(card, gs){
  gs = gs || gameState;
  const p = battlePermissionV6(card);
  return !!(p && p.multiAttackTurn != null && p.multiAttackTurn === gs.turn);
}

/* ---- バトルフェイズ制御 ------------------------------------------------
   gs.battlePhaseV6 = {skipTurnFor:{0:turn,1:turn}, repeatFor:{player,count}, ended:turn}
   全て整数。無制限履歴は持たない。                                      */
function ensureBattlePhaseStateV6(gs){
  gs = gs || gameState;
  if(!gs.battlePhaseV6) gs.battlePhaseV6 = {};
  return gs.battlePhaseV6;
}
/* そのプレイヤーの次のバトルフェイズがスキップされるか */
function battlePhaseSkippedV6(gs, player){
  const s = gs && gs.battlePhaseV6;
  return !!(s && s.skipNext && s.skipNext[player]);
}
/* バトルフェイズを追加で行える回数（0なら通常どおり1回） */
function battlePhaseRepeatV6(gs, player){
  const s = gs && gs.battlePhaseV6;
  if(!s || !s.repeat) return 0;
  return Math.max(0, Number(s.repeat[player]) || 0);
}

/* ---- 攻撃対象の固定・変更 ----------------------------------------------
   宣言された攻撃を、ルール処理として別の対象へ差し替える。
   attack replay（対象消失による巻き戻し）とは別概念。                    */
function attackRedirectTargetV6(gs){
  gs = gs || gameState;
  const b = gs && gs.battle;
  if(b && b.redirectV6) return b.redirectV6;
  const a = gs && gs.pendingAttack;
  return (a && a.redirectV6) ? a.redirectV6 : null;
}
/* いま攻撃対象を差し替えられる段階か。
   1103 の裁定では攻撃対象の変更は攻撃宣言時〜ダメージ計算前まで。
   ③ダメージ計算に入った後は差し替えられない。 */
function canRedirectAttackV6(gs){
  gs = gs || gameState;
  if(gs && gs.pendingAttack) return true;
  const b = gs && gs.battle;
  if(!b) return false;
  if(typeof DAMAGE_STEPS === 'undefined') return true;
  const i = DAMAGE_STEPS.findIndex(d => d.key === b.step);
  const before = DAMAGE_STEPS.findIndex(d => d.key === 'before');
  if(i < 0) return false;                 // 未知の段階では許可しない
  return before < 0 || i <= before;
}

/* ---- 戦闘 identity ------------------------------------------------------
   lastBattle は従来カード名でも照合できるようにしていたが、
   同名カードや再利用された uid を区別できない。uid を第一級にする。
   既存フィールドは残したまま uid を併設する（意味変更をしない）。      */
function battleIdentityV6(gs){
  const lb = gs && gs.lastBattle;
  if(!lb) return null;
  return {
    attackerUid: (lb.attackerUidV6 != null) ? lb.attackerUidV6 : null,
    defenderUid: (lb.defenderUidV6 != null) ? lb.defenderUidV6 : null,
    direct: !!lb.directV6,
    damage: Number(lb.damage) || 0,
    damagePlayer: (lb.toPlayer === 0 || lb.toPlayer === 1) ? lb.toPlayer : null,
    attackerOwner: lb.atkOwner, defenderOwner: lb.defOwner,
    destroyedAttacker: !!lb.destroyedAtk, destroyedDefender: !!lb.destroyedDef,
  };
}
/* 進行中の戦闘の identity（攻撃宣言時から参照できる） */
function currentBattleIdentityV6(gs){
  gs = gs || gameState;
  const b = gs && gs.battle;
  if(!b){
    const a = gs && gs.pendingAttack;
    if(!a) return null;
    return {
      attackerUid: (a.attackerUid != null) ? a.attackerUid : null,
      defenderUid: (a.targetUid != null) ? a.targetUid : null,
      direct: a.targetUid == null,
      step: 'attackDeclare',
      attackerOwner: a.player,
      defenderOwner: a.player === 0 ? 1 : 0,
    };
  }
  return {
    attackerUid: (b.atkUid != null) ? b.atkUid : null,
    defenderUid: (b.targetUid != null) ? b.targetUid : null,
    direct: b.target === 'direct',
    step: b.step || null,
    attackerOwner: b.player,
    defenderOwner: b.player === 0 ? 1 : 0,
  };
}

/* ---- バトルフェイズ内の攻撃記録 ----------------------------------------
   「このバトルフェイズ中に自分を攻撃したモンスター」を後から辿るために、
   攻撃1回ごとに uid の組だけを積む。バトルフェイズ終了時に空にするので
   無制限履歴にはならない。                                              */
function recordBattlePhaseAttackV6(gs, player, attacker, defender){
  gs = gs || gameState;
  const st = ensureBattlePhaseStateV6(gs);
  if(!Array.isArray(st.attacks)) st.attacks = [];
  if(!attacker) return;
  if(typeof ensureCardUid === 'function') ensureCardUid(gs, attacker);
  if(defender && typeof ensureCardUid === 'function') ensureCardUid(gs, defender);
  st.attacks.push({
    attackerUid: (attacker.uid != null) ? attacker.uid : null,
    defenderUid: (defender && defender.uid != null) ? defender.uid : null,
    player: player
  });
}
/* S03-U236: the attack record to read. In the Battle Phase, the current one; after it (onBattlePhaseEnd runs once 'finish' has cleared
   st.attacks), the finished phase's record of this turn (st.lastPhaseS03). */
function battleAttacksRecordV6(gs){
  gs = gs || gameState;
  const st = gs && gs.battlePhaseV6;
  if(!st) return [];
  if(gs.phase !== 'battle' && st.lastPhaseS03 && Number(st.lastPhaseS03.turn) === Number(gs.turn) && Array.isArray(st.lastPhaseS03.attacks))
    return st.lastPhaseS03.attacks;
  return Array.isArray(st.attacks) ? st.attacks : [];
}
/* このバトルフェイズ中に、その uid のモンスターを攻撃したモンスターの uid 一覧 */
function attackersAgainstV6(gs, defenderUid){
  return battleAttacksRecordV6(gs).filter(x => x && x.defenderUid === defenderUid)
                   .map(x => x.attackerUid).filter(x => x != null);
}
/* このバトルフェイズ中にそのモンスターが戦闘を行ったか */
function battledThisPhaseV6(gs, uid){
  return battleAttacksRecordV6(gs).some(x => x && (x.attackerUid === uid || x.defenderUid === uid));
}
/* このバトルフェイズ中に戦闘破壊されたモンスターの数 */
function battleDestroyedThisPhaseV6(gs){
  const st = (gs || gameState) && (gs || gameState).battlePhaseV6;
  return Math.max(0, Number(st && st.destroyedThisPhase) || 0);
}

/* ---- 戦闘ダメージイベントの payload ------------------------------------
   ATTACK Action の中で作り、queueDeferredEventV2 で流す。純JSON。       */
function makeBattleDamageEventV6(o){
  return {
    player: o.to,                       // ダメージを受けたプレイヤー
    amount: Math.max(0, Number(o.amount) || 0),
    direct: !!o.direct,
    attackerUid: (o.attackerUid != null) ? o.attackerUid : null,
    defenderUid: (o.defenderUid != null) ? o.defenderUid : null,
    attackerOwner: o.atkOwner,
    dealtBy: (o.atkOwner === 0 || o.atkOwner === 1)
      ? (o.to === o.atkOwner ? (o.atkOwner === 0 ? 1 : 0) : o.atkOwner) : null,
  };
}

/* ---- 直列化検査（テスト用） -------------------------------------------- */
function assertBattleStateSerializableV6(gs){
  gs = gs || gameState;
  const bad = [];
  const walk = (v, path, d) => {
    if(d > 10 || v === null) return;
    const t = typeof v;
    if(t === 'function' || t === 'symbol'){ bad.push(path + ': ' + t); return; }
    if(t !== 'object') return;
    if(v instanceof Map || v instanceof Set){ bad.push(path + ': ' + v.constructor.name); return; }
    if(v.nodeType != null){ bad.push(path + ': DOM'); return; }
    if(typeof v.then === 'function'){ bad.push(path + ': thenable'); return; }
    if(Array.isArray(v)){ v.forEach((x, i) => walk(x, path + '[' + i + ']', d + 1)); return; }
    Object.keys(v).forEach(k => walk(v[k], path + '.' + k, d + 1));
  };
  walk(gs.battlePhaseV6, 'battlePhaseV6', 0);
  const b = gs.battle;
  if(b) walk(b.redirectV6, 'battle.redirectV6', 0);
  [0, 1].forEach(p => (gs.players[p].mz || []).forEach((c, i) =>
    walk(c && c.battlePermission, 'p' + p + '.mz[' + i + '].battlePermission', 0)));
  return { ok: bad.length === 0, why: bad.join(', ') };
}
