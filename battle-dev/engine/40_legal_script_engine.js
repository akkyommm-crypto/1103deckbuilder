/* =========================================================================
   ADS化 Phase 1: PLAY MODE / LEGAL ACTION ENGINE

   DUEL      : エンジンが合法と判断した操作だけを表示する。
   MANUAL    : 従来の全操作パレットを使用する（例外裁定・未実装カード用）。
   DEVELOPER : MANUALに加えて状態・スクリプトデバッグを使用する。

   重要: 既存の手動機能は削除せず、DUELモードだけをADS型UIへ切り替える。
   ========================================================================= */
const PLAY_MODES = Object.freeze({DUEL:'duel', MANUAL:'manual', DEVELOPER:'developer'});
const PLAY_MODE_KEY = 'yg1103_play_mode_v1';
let PLAY_MODE = (()=>{
  try{
    const v = localStorage.getItem(PLAY_MODE_KEY);
    return Object.values(PLAY_MODES).includes(v) ? v : PLAY_MODES.DUEL;
  }catch(e){ return PLAY_MODES.DUEL; }
})();
function playModeJp(m){ return m===PLAY_MODES.MANUAL?'MANUAL':m===PLAY_MODES.DEVELOPER?'DEV':'DUEL'; }
function playModeClass(m){ return m===PLAY_MODES.MANUAL?'manual':m===PLAY_MODES.DEVELOPER?'developer':''; }
function setPlayMode(mode){
  if(!Object.values(PLAY_MODES).includes(mode)) return;
  PLAY_MODE = mode;
  try{ localStorage.setItem(PLAY_MODE_KEY, mode); }catch(e){}
  closeSheet(); render();
  showToast(`${playModeJp(mode)}モードに切り替えました`);
}

/* カードの自動化状態。将来の実装率管理の土台。 */
function automationStatus(db){
  if(!db || !db.n) return {id:'unsupported', jp:'未判定'};
  const sc = CARD_SCRIPTS[db.n];
  if(sc && (typeof sc.resolve==='function' || sc.summonProcedure || sc.normalSummonProcedure || sc.tributeValue || sc.passive || sc.continuous || sc.endPhaseMill))
    return {id:'scripted', jp:'SCRIPTED'};
  if(CARD_EFFECT[db.n] || AUTO_EFFECT[db.n]) return {id:'generic', jp:'GENERIC'};
  try{ if(parseEffectSteps(db.e||'').length) return {id:'generic', jp:'GENERIC'}; }catch(e){}
  return {id:'manual', jp:'MANUAL'};
}

/* S03-U60: a face-up Spell already resolved and sitting in a real (non-hand) zone must not be legally
   re-activatable just because its script has a resolve() — resolve() is normally the one-shot "on
   activation" effect for Continuous/Field/Equip Spells, and no ctx field visible to the card's own
   condition() can distinguish "about to activate from hand" from "already resolved on the field" (both
   reach sc.condition() with the same logical zone — see cards/HF_claude_s03_u59_future_fusion.js for the
   real-duel bug this caused: F・G・D materials could be double-sent by re-clicking an already-resolved
   未来融合). Unlike the card script's own ctx, the engine here has the actual physical `zone` the caller
   passed in (not a logical/prospective one) and the card's real `face`, so it can tell the two cases apart
   directly: only a card that is genuinely already face-up in a real board zone (not 'hand', not a
   face-down Set still awaiting its first activation) is subject to this gate. Reuses
   hasFieldActivatableEffect() (S03-U13/U46) — the same gate reactableCards() already applies for the
   opponent's response window — which already correctly allows the real field-repeatable cases
   (fieldIgnition/CARD_ACTIVATION_FREE_V32-declared legacy cards, V4 cards with a genuine IGNITION/QUICK
   effect) and blocks the one-shot ones. Originally scoped to db.k==='s' (Spells; S03-U59 follow-up,
   script_coverage.json kind spell + subtype 永続/フィールド/装備).
   S03-U61: extended to db.k==='t' with db.sub==='永続' (Continuous Traps) after measurement found the exact
   same shape reproduces for real — リミット・リバース (cards/HE_claude_s03_u56_limit_reverse.js) could
   illegally re-Special-Summon a *second* GY monster for free by re-clicking it once already resolved and
   sitting face-up on the field. A Continuous Trap's first activation always goes through
   duelActivateFromZone too (Set face-down -> later activated from that same zone; there is no
   duelActivateFromHand path for a Trap's normal activation), so the existing `card.face!=='up'` exclusion
   below already correctly leaves a first activation (still face-down at the point this runs) untouched —
   no additional call-site changes were needed for the Trap case. 80 TESTED/GENERIC_OK Continuous Traps
   audited; 9 are genuine field-repeatable (already correctly declared) and 66 shared リミット・リバース's
   one-shot shape. */
function fieldReactivationBlockedS03U60(sc, db, zone, card){
  if(!sc || !db) return false;
  const continuousStyle = (db.k==='s' && ['永続','フィールド','装備'].includes(db.sub)) ||
                           (db.k==='t' && db.sub==='永続');
  if(!continuousStyle) return false;
  if(zone==='hand' || !card || card.face!=='up') return false;
  return !(typeof hasFieldActivatableEffect==='function' && hasFieldActivatableEffect(card));
}

/* スクリプトを「強行発動なし」で実行可能か調べる。
   condition は読み取り専用であることを前提にし、例外時は合法扱いにしない。 */
function strictScriptLegality(name, p, zone, index){
  const sc = CARD_SCRIPTS[name];
  if(!sc || typeof sc.resolve!=='function') return {ok:false, reason:'自動実行スクリプトがありません'};
  const P = gameState.players[p];
  const card = zone ? zoneCard(P, zone, index) : null;
  if(fieldReactivationBlockedS03U60(sc, card?dbOf(card):null, zone, card)) return {ok:false, reason:'このカードに、場に残ったまま再度発動できる効果はありません'};
  /* S03-U51 (C-S03-39): 宣言した種類のカードの発動の封印（手札・フィールドの効果の一覧もこの判定を使う） */
  if(card && typeof activationTypeLockReasonS03==='function'){ const lockS03=activationTypeLockReasonS03(p, card, zone, dbOf(card), {}); if(lockS03) return {ok:false, reason:lockS03}; }
  if(sc.countLimit && countLeft(p, name, sc, card, countLimitEffectKeyV32(name, sc, makeContext(p, card, zone, index, 'legalCheck', {}))) <= 0) return {ok:false, reason:`${countLimitJp(sc)}までです`};
  const tm = timingCheck(sc);
  if(!tm.ok) return {ok:false, reason:tm.why};
  if(sc.condition){
    const ctx = makeContext(p, card, zone, index, 'legalCheck', {});
    let ok=false;
    try{ ok = !!sc.condition(ctx); }catch(e){ return {ok:false, reason:'発動条件の判定でエラー'}; }
    if(!ok) return {ok:false, reason:ctx.reason||'発動条件を満たしていません'};
  }
  return {ok:true, reason:''};
}

function hasMonsterZoneSpace(p){ return gameState.players[p].mz.length < ZONE_LIMITS.mz; }
function hasSpellTrapSpace(p, toField){
  const P=gameState.players[p];
  return toField ? !P.field : P.sz.length < ZONE_LIMITS.sz;
}

/* System v4.6 — ADS型の常時召喚制約。
   御前試合 / 群雄割拠は「出した後に墓地へ送る」だけでは不十分で、
   既に表側モンスターがいる場合は異なる属性/種族を表側で召喚・反転召喚
   しようとする行為自体を禁止する。EDOPro/ADSと同じく、裏側セットは許可。 */
function v46ActiveFieldRestrictions(){
  const out=[];
  if(typeof continuousSources!=='function') return out;
  (continuousSources()||[]).forEach(src=>{
    const r=src&&src.sc&&src.sc.restriction;
    if(!r || !['at','ra'].includes(r.key)) return;
    const db=src.card?dbOf(src.card):{};
    if(db.k==='t'){
      if(typeof trapNegated==='function' && trapNegated(src.card)) return;
      if(typeof trapStunned==='function' && trapStunned(src.p,src.card)) return;
    }
    out.push({name:(src.sc&&src.sc.name)||cardName(src.card),key:r.key,jp:r.jp||r.key});
  });
  return out;
}
function v46FaceUpSummonRestrictionReason(p,db,kind){
  if(!db || db.k!=='m') return '';
  /* S03-U384: summon locks by kind (engine/1ZZS): the summoned card's own condition, face-up locking cards, turn-ranged bans */
  { const slS03 = (typeof summonLockReasonS03==='function') ? summonLockReasonS03(p, db, kind) : ''; if(slS03) return slS03; }
  /* S03-U282: 「…はフィールド上に1体しか表側表示で存在できない」 (地縛神, engine/1ZZM) */
  { const uS03 = (typeof uniqueFaceUpReasonS03==='function') ? uniqueFaceUpReasonS03(db, p) : ''; if(uS03) return uS03; }
  /* S03-U129: 「このカードを発動するターン、自分はこのカードの効果以外ではモンスターを召喚・反転召喚・特殊召喚できない」（スケープ・ゴート） */
  { const tf = gameState.players[p] && gameState.players[p].temporaryFlags; if(tf && tf.noSummonS03) return `「${tf.noSummonS03}」を発動したターンはモンスターを召喚・反転召喚・特殊召喚できません`; }
  for(const r of v46ActiveFieldRestrictions()){
    const kinds=new Set((gameState.players[p].mz||[]).filter(c=>c&&c.face==='up').map(c=>dbOf(c)[r.key]).filter(Boolean));
    if(!kinds.size) continue;
    if(kinds.size!==1) return `${r.name}：${r.jp}の違反状態を先に解消してください`;
    const keep=[...kinds][0], incoming=db[r.key];
    if(incoming && incoming!==keep) return `${r.name}：自分フィールドは${r.jp}「${keep}」で統一されています`;
  }
  return '';
}
function v46GlobalSpecialSummonRestrictionReason(p){
  const temp=gameState.players[p]&&gameState.players[p].temporaryFlags;
  if(temp&&temp.noSpecialSummon) return 'このターンは特殊召喚できません';
  /* S03-U34 (C-S03-27): 「発動するターン特殊召喚できない」カードの発動がチェーン上にある間 */
  if(typeof chainedActivationNoSpecialSummonS03==='function'){ const r=chainedActivationNoSpecialSummonS03(p); if(r) return r; }
  for(let q=0;q<2;q++){
    for(const c of (gameState.players[q].mz||[])){
      if(!c||c.face!=='up') continue;
      const n=cardName(c);
      if(typeof effectNegated==='function' && effectNegated(c)) continue;
      /* S03-U110: 《大天使クリスティア》③「お互いにモンスターを特殊召喚できない」も同じ表側モンスターの双方向ロック。
         以前はクリスティアの resolve() がログを出すだけで、ロック自体はどこにも実装されていなかった。 */
      if(['虚無魔人','フォッシル・ダイナ パキケファロ','大天使クリスティア'].includes(n)) return `${n}の効果により特殊召喚できません`;
      if(n==='No.30 破滅のアシッド・ゴーレム' && q===p) return `${n}の効果により特殊召喚できません`;
      continue;
    }
    for(const c of (gameState.players[q].sz||[])){
      if(!c||c.face!=='up'||cardName(c)!=='虚無空間'||c.activationPending||c.activationNegated) continue;
      if((typeof trapNegated==='function'&&trapNegated(c))||(typeof trapStunned==='function'&&trapStunned(q,c))) continue;
      return '虚無空間の効果により特殊召喚できません';
    }
  }
  return '';
}
function v46SpecialSummonRestrictionReason(p,db){
  return v46GlobalSpecialSummonRestrictionReason(p) || v46FaceUpSummonRestrictionReason(p,db,'special') || scriptSpecialSummonLockS03(p,db);
}
/* S03-U211: 「このカードがフィールド上に表側表示で存在する限り、お互いに○○を特殊召喚できない」 — a face-up monster whose script declares
   specialSummonLockS03(db, p, srcCard, srcPlayer) → true forbids that special summon (A・O・J D.D.チェッカー). Negated sources do not lock. */
function scriptSpecialSummonLockS03(p,db){
  if(!db || db.k!=='m' || typeof CARD_SCRIPTS==='undefined') return '';
  for(let q=0;q<2;q++){
    /* S03-U220: face-up Continuous Spells / Traps too (召喚制限－パワーフィルター); a card still being activated applies nothing */
    const Pq=gameState.players[q], srcs=[].concat(Pq.mz||[], Pq.sz||[], Pq.field?[Pq.field]:[]);
    for(const c of srcs){
      if(!c || c.face!=='up' || c.activationPending || c.activationNegated) continue;
      const sc=CARD_SCRIPTS[cardName(c)], f=sc && sc.specialSummonLockS03;
      if(typeof f!=='function') continue;
      if(typeof effectNegated==='function' && effectNegated(c)) continue;
      let hit=false; try{ hit=!!f(db,p,c,q); }catch(e){ hit=false; }
      if(hit) return `${cardName(c)}の効果により特殊召喚できません`;
    }
  }
  return '';
}
/* System v32 (S03-U01): 「ドロー以外の方法でデッキからカードを手札に加える事はできない」封印。
   producer は continuous.lockDeckToHand(p, src) を宣言したカード（《ライオウ》）。
   source の表側・無効化・スキルドレインは continuousSources() が判定する。
   新しい state は持たず盤面から導出するので、Replay / Undo / SaveLoad は既存経路のまま。
   consumer: API.searchDeck / API.deckToHand（処理時）、strictScriptLegalityV2（blocksIfNoDeckToHand）。 */
function deckToHandLockReasonV32(p){
  if(typeof continuousSources!=='function' || !gameState) return '';
  for(const src of continuousSources()){
    const f=src.sc.continuous && src.sc.continuous.lockDeckToHand;
    if(!f) continue;
    let hit=false;
    try{ hit = (typeof f==='function') ? !!f(p, src) : f===true; }catch(e){ hit=false; }
    if(hit) return `${cardName(src.card)}の効果によりデッキから手札に加えられません`;
  }
  return '';
}
/* S03-U04: 誘発の候補提示でも blocksIfNoDeckToHand を尊重する（発動できない任意誘発を出さない）。 */
function triggerBlockedByDeckLockV32(sc, p, ctx){
  const f = sc && sc.blocksIfNoDeckToHand;
  if(!f || !deckToHandLockReasonV32(p)) return false;
  if(f === true) return true;
  if(typeof f === 'function'){ try{ return !!f(ctx); }catch(e){ return true; } }
  return false;
}
function canPayNormalTribute(db,p){ return normalSummonMethodsFor(db,p,'summon').length > 0; }
function canPaySetTribute(db,p){ return normalSummonMethodsFor(db,p,'set').length > 0; }

/* v3.7.0: カード効果で得る追加通常召喚権。
   現在は《鬼ガエル》の「鬼ガエル以外のガエル1体を追加召喚」に使用。 */
function extraNormalSummonKeyV370(p,db,mode){
  const P=gameState.players[p], f=P&&P.temporaryFlags||{};
  const setMode=mode==='set';
  if(!setMode && Number(f.v370FrogExtraNormal||0)>0 && db&&db.k==='m' && String(db.n||'').includes('ガエル') && db.n!=='鬼ガエル')
    return 'v370FrogExtraNormal';
  if(!setMode && Number(f.v380NordicExtraNormal||0)>0 && db&&db.k==='m' && (typeof isSetCardV4==='function'?isSetCardV4(db,SETCODE.NORDIC):String(db.n||'').includes('極星')))
    return 'v380NordicExtraNormal';
  /* S03-U101: カラクリ小町 弐弐四 — 「通常召喚に加えて『カラクリ』モンスター1体を召喚できる」。
     以前はこの権利を表すフラグ（karakuriExtraSummon）を立てるだけで、doExtraNormalSummonV370 の
     実オファー経路（このv370系関数）に一切繋がっておらず、効果が完全に機能していなかった。 */
  if(!setMode && Number(f.karakuriExtraNormal||0)>0 && db&&db.k==='m' && String(db.n||'').includes('カラクリ'))
    return 'karakuriExtraNormal';
  /* S03-U274: 「自分は通常召喚に加えて…1体を召喚できる」 granted by a face-up continuous source (氷結界の虎将 グルナード):
     continuous.extraNormalS03 = {filter(db, player, card)}; once per turn per source card (key 'src:'+uid, engine/00 NORMAL_SUMMON_ATTEMPT). */
  if(db && db.k==='m' && typeof continuousSources==='function'){
    const src = continuousSources().find(s=>{
      const x = s && s.p===p && s.sc && s.sc.continuous && s.sc.continuous.extraNormalS03;
      if(!x || !s.card || s.card.uid==null || (setMode && x.allowSet!==true)) return false;
      const useKey=x.sharedKey ? 'shared_'+String(x.sharedKey) : 'xn'+s.card.uid;
      if(f[useKey+'XnUsedS03']) return false;
      try{
        if(typeof x.active==='function' && !x.active(db,p,s.card)) return false;
        return typeof x.filter==='function' ? !!x.filter(db,p,s.card) : true;
      }catch(e){ return false; }
    });
    if(src){
      const x=src.sc.continuous.extraNormalS03;
      return 'src:'+(x.sharedKey ? 'shared_'+String(x.sharedKey) : 'xn'+src.card.uid);
    }
  }
  return null;
}

/* S03-U462: Some continuous effects grant the right only after witnessing a
   particular successful Normal Summon. Stamp the live source itself, so a
   source which was face-down/negated at that moment cannot gain the right
   later, and ordinary save/Replay state preserves the result. */
function recordConditionalExtraNormalSummonS03(player,summoned){
  if(!summoned || typeof continuousSources!=='function') return;
  continuousSources().forEach(s=>{
    const x=s&&s.p===player&&s.sc&&s.sc.continuous&&s.sc.continuous.extraNormalS03;
    if(!x || typeof x.qualifiesOnNormalSummon!=='function' || !s.card) return;
    try{ if(x.qualifiesOnNormalSummon(summoned,player,s.card)) s.card.extraNormalS03Turn=gameState.turn; }catch(e){}
  });
}

/* -------------------------------------------------------------------------
   特殊召喚手順（チェーンに乗らない自己特殊召喚）
   v3.7.0: 手札だけでなく墓地等の複数ゾーン＋手順コストに対応。
   summonProcedure: {
     from:'hand' または from:['hand','grave'],
     positions:['atk','def'], condition(ctx){...}, cost(ctx,done){...}
   }
   ------------------------------------------------------------------------- */
function summonProcedureZonesV370(sp){
  const raw=sp&&sp.from!=null?sp.from:'hand';
  return (Array.isArray(raw)?raw:[raw]).filter(Boolean);
}
function strictSummonProcedureLegality(name,p,zone,index){
  const sc=CARD_SCRIPTS[name], sp=sc&&sc.summonProcedure;
  if(!sp) return {ok:false,reason:'特殊召喚手順がありません'};
  const from=summonProcedureZonesV370(sp);
  if(!from.includes(zone)) return {ok:false,reason:`${from.map(zoneJp).join('・')}から特殊召喚します`};
  if(p!==gameState.activePlayer) return {ok:false,reason:'自分のターンに行います'};
  if(!rules().exSummon) return {ok:false,reason:`${phaseJp(gameState.phase)}ではこの特殊召喚を行えません`};
  /* S03-U175: a procedure whose cost removes one of the player's own monsters (contact fusion, engine/1ZW) frees a zone */
  /* S03-U420: summonProcedure.toFoeS03 — the card is Special Summoned onto the OPPONENT's field (エーリアン・スカル, ヴォルカニック・クイーン …); freesFoeZoneS03: the cost releases an opponent monster */
  if(sp.toFoeS03){ if(!hasMonsterZoneSpace(p===0?1:0) && !sp.freesFoeZoneS03) return {ok:false,reason:'相手のモンスターゾーンが一杯です'}; }
  else if(!hasMonsterZoneSpace(p) && !(typeof summonProcedureFreesZoneS03==='function' && summonProcedureFreesZoneS03(name,p,sp))) return {ok:false,reason:'モンスターゾーンが一杯です'};
  // 既存v3.4回帰の明示ガードを保持し、その後v4.6の常時制約も確認する。
  if(gameState.players[p].temporaryFlags && gameState.players[p].temporaryFlags.noSpecialSummon)
    return {ok:false,reason:'このターンは特殊召喚できません'};
  const P=gameState.players[p], card=zoneCard(P,zone,index);
  if(!card) return {ok:false,reason:'カードが見つかりません'};
  const sr=v46SpecialSummonRestrictionReason(p,dbOf(card));
  if(sr) return {ok:false,reason:sr};
  const ctx=makeContext(p,card,zone,index,'summonProcedure',{});
  if(sp.condition){
    let ok=false;
    try{ ok=!!sp.condition(ctx); }catch(e){ return {ok:false,reason:'特殊召喚条件の判定でエラー'}; }
    if(!ok) return {ok:false,reason:ctx.reason||'特殊召喚条件を満たしていません'};
  }
  return {ok:true,reason:''};
}
function runSummonProcedure(name,p,zone,index){
  // v3.6以前の runSummonProcedure(name,p,index) も受け付ける。
  if(typeof zone==='number' && index==null){ index=zone; zone='hand'; }
  zone=zone||'hand';
  const L=strictSummonProcedureLegality(name,p,zone,index);
  if(!L.ok){ showToast(L.reason); return; }
  const sp=CARD_SCRIPTS[name].summonProcedure||{};
  const pos=(sp.positions&&sp.positions.length)?sp.positions:['atk'];
  if(pos.length===1){ finishSummonProcedure(name,p,zone,index,pos[0]); return; }
  const rows=pos.map(x=>`<div class="act ${x==='atk'?'gold':''}" onclick="finishSummonProcedure(${jsStr(name)},${p},${jsStr(zone)},${index},${jsStr(x)})">${x==='def'?'表側守備表示':'表側攻撃表示'}</div>`).join('');
  sheet.innerHTML=`<div class="grip"></div><h3 style="margin-bottom:6px">${name}を特殊召喚</h3>
    <div class="meta" style="margin-bottom:12px">表示形式を選んでください。この特殊召喚はチェーンブロックを作りません。</div>
    <div class="act-grid">${rows}</div><button class="close" onclick="closeSheet()">やめる</button>`;
  veil.classList.add('on');
}
let PENDING_SUMMON_COMMIT=null, PENDING_SUMMON_CANCEL=null;
/* S03-U15 SUMMON_WINDOW_RESUME: 召喚無効タイミングの続きは gameState.pendingSummon.resumeS03（JSON）から実行する。
   関数クロージャに頼らないので、保存・リロード・Undo/Redo を跨いでも召喚を完了／無効にできる。
   PENDING_SUMMON_COMMIT/CANCEL は resumeS03 を持たない呼び出し元のための互換として残す。 */
function __pendingSummonCommit(ps){ const f=PENDING_SUMMON_COMMIT; PENDING_SUMMON_COMMIT=PENDING_SUMMON_CANCEL=null; if(ps&&ps.resumeS03) runSummonWindowResumeS03(ps,'commit'); else if(f) f(); else runSummonWindowResumeS03(ps,'commit'); }
function __pendingSummonCancel(ps){ const f=PENDING_SUMMON_CANCEL; PENDING_SUMMON_COMMIT=PENDING_SUMMON_CANCEL=null; if(ps&&ps.resumeS03) runSummonWindowResumeS03(ps,'cancel'); else if(f) f(); else runSummonWindowResumeS03(ps,'cancel'); }
function runSummonWindowResumeS03(ps,result){
  const r=ps&&ps.resumeS03;
  if(!r){ logIt(gameState,'召喚の続きを復元できないため、召喚無効タイミングを閉じました（続きのデータが無い保存）'); return false; }
  const hit=findCardByUid(r.uid);
  /* S03-U119: デュアルの「もう1度召喚」（kind 'normal' + geminiS03）。カードはモンスターゾーンに居る。 */
  if(ps.geminiS03 && typeof geminiSummonResumeS03==='function') return geminiSummonResumeS03(ps, result);
  if(result==='commit'){
    if(ps.kind==='normal'){
      if(!hit||hit.zone!=='hand') return false;
      const p=ps.player;
      act({type:'NORMAL_SUMMON',player:p,handIndex:hit.index,pos:'atk',tributes:r.tributes,tributeValue:r.tributeValue,prepaid:true,summonMethod:r.summonMethod,p3Materials:r.p3Materials||[]});
      const summoned=lastSummonedCard(p);
      if(summoned) queueDeferredEventV2('onNormalSummon',{player:p,name:ps.name,card:summoned});
      flushDeferredEventsV2(); return true;
    }
    if(ps.kind==='procedure'){ doSpecialFromZoneUidV370(r.uid,r.pos,ps.name,r.data); return true; }
    if(ps.kind==='flip'){
      if(!hit) return false;
      act({type:'FX_SET_STATE',player:hit.p,zone:hit.zone,index:hit.index,face:'up',pos:'atk',reason:'反転召喚成功',flipSummon:true});   /* S03-U42 */
      const now=findCardByUid(r.uid); if(now) queueDeferredEventV2('onFlip',{player:ps.player,name:ps.name,card:now.card,treatAsField:true,flipSummon:true});
      flushDeferredEventsV2(); return true;
    }
    return false;
  }
  if(!hit) return false;
  /* S03-U277: negated and returned to the owner's hand (キックバック). A Normal Summon's monster is still in the hand (it never reached the field);
     a Flip Summon's monster goes from the Monster Zone back to its owner's hand. */
  if(ps.negateToHandS03){
    if(hit.zone==='hand'){ logIt(gameState, `${ps.name||cardName(hit.card)}：召喚を無効にされ、手札に戻った`); return true; }
    if(hit.zone==='mz'){ act({type:'FX_BOUNCE',player:hit.p,zone:hit.zone,index:hit.index,reason:'召喚を無効にし手札に戻す'}); return true; }
  }
  if(ps.kind==='flip'){ act({type:'FX_TO_GRAVE',player:hit.p,zone:hit.zone,index:hit.index,reason:'反転召喚を無効',byDestroy:true}); return true; }
  if(hit.zone!=='grave') act({type:'MOVE',player:hit.p,from:hit.zone,fromIndex:hit.index,to:'grave'});
  return true;
}
function finishSummonProcedure(name,p,zone,index,pos){
  // v3.6以前の finishSummonProcedure(name,p,index,pos) 互換。
  if(typeof zone==='number'){ pos=index; index=zone; zone='hand'; }
  zone=zone||'hand';
  const L=strictSummonProcedureLegality(name,p,zone,index);
  if(!L.ok){ closeSheet(); showToast(L.reason); return; }
  const sp=CARD_SCRIPTS[name].summonProcedure||{};
  const card=zoneCard(gameState.players[p],zone,index); if(!card) return; ensureCardUid(gameState,card);
  const ctx=makeContext(p,card,zone,index,'summonProcedure',{});
  const proceed=()=>{
    const hit=findCardByUid(card.uid);
    const allowed=summonProcedureZonesV370(sp);
    if(!hit||hit.p!==p||!allowed.includes(hit.zone)){ closeSheet(); showToast('特殊召喚するカードが指定ゾーンにありません'); return; }
    PENDING_SUMMON_COMMIT=PENDING_SUMMON_CANCEL=null;
    beginSummonWindowV2({player:p,name,kind:'procedure',label:'特殊召喚',uid:card.uid,commit:'__pendingSummonCommit',cancel:'__pendingSummonCancel',resumeS03:Object.assign({uid:card.uid,pos:pos||'atk'},ctx.procedureDataS03?{data:JSON.parse(JSON.stringify(ctx.procedureDataS03))}:{})});
  };
  if(sp.cost){
    sp.cost(ctx,ok=>{ if(ok===false){ showToast('特殊召喚のコストを払えません'); render(); return; } proceed(); });
  }else proceed();
}
/* S03-U17: 特殊召喚手順のコストで記録した JSON（procedureDataS03）があれば、特殊召喚した直後・召喚成功イベントの前に
   summonProcedure.afterSummonS03(handle,data) を呼ぶ（例：墓地へ送ったレベル分だけレベルを下げる、除外したモンスターを戻す予約）。 */
function doSpecialFromZoneUidV370(uid,pos,reason,procedureDataS03){
  const hit=findCardByUid(uid); if(!hit) return;
  const card=hit.card, nm=cardName(card), p=hit.p;
  const spT=(CARD_SCRIPTS[nm]||{}).summonProcedure, toFoeS03=!!(spT&&spT.toFoeS03), dest=toFoeS03?(p===0?1:0):p;   /* S03-U420: onto the opponent's field */
  act(Object.assign({type:'FX_SPECIAL_SUMMON',player:dest,from:hit.zone,fromIndex:hit.index,pos:pos||'atk',reason:reason||nm,summonKind:'procedure'},toFoeS03?{fromPlayer:p}:{}));   /* S03-U127: 召喚手順＝正規の方法 */
  const h=locateCard(card);
  if(h && h.p===dest && h.zone==='mz' && procedureDataS03!==undefined){
    const spS03=(CARD_SCRIPTS[nm]||{}).summonProcedure;
    if(spS03 && typeof spS03.afterSummonS03==='function') spS03.afterSummonS03({p:h.p,zone:h.zone,index:h.index,card},procedureDataS03);
  }
  if(h && h.p===dest && h.zone==='mz') queueDeferredEventV2('onSpecialSummon',{player:dest,name:nm,card,kind:'procedure'});
  flushDeferredEventsV2();
}
function doSpecialFromHandV2(index,pos,reason){
  const p=gameState.activePlayer, card=gameState.players[p].hand[index]; if(!card) return;
  ensureCardUid(gameState,card); doSpecialFromZoneUidV370(card.uid,pos,reason);
}

/* DUELモード用：手札の合法操作を返す。UI文字列ではなくAction定義を返す。 */
function getLegalHandActions(p, i){
  const P=gameState.players[p], c=P.hand[i]; if(!c) return [];
  const db=dbOf(c), nm=db.n||'', R=rules(), out=[];
  const myTurn = p===gameState.activePlayer;
  if(!myTurn) return out;
  if(db.k==='m'){
    const sc=CARD_SCRIPTS[nm];
    if(sc && sc.summonProcedure){
      const SL=strictSummonProcedureLegality(nm,p,'hand',i);
      if(SL.ok) out.push({id:'specialSummonProcedure', label:'特殊召喚', cls:'gold', run:`runSummonProcedure(${jsStr(nm)},${p},'hand',${i})`});
    }
    const summonLock=v46FaceUpSummonRestrictionReason(p,db,'normal');
    const ns = R.normalSummon && normalRightFreeS03(P) && hasMonsterZoneSpace(p) && canPayNormalTribute(db,p) && !summonLock;
    if(ns) out.push({id:'normalSummon', label:'通常召喚', cls:'gold', run:`doNormalSummon(${i},'atk')`});
    const extraKey=R.normalSummon&&hasMonsterZoneSpace(p)&&canPayNormalTribute(db,p)&&!summonLock?extraNormalSummonKeyV370(p,db):null;
    if(extraKey){
      const extraLabel={v380NordicExtraNormal:'追加召喚（ドヴェルグ）',karakuriExtraNormal:'追加召喚（カラクリ小町）'}[extraKey]||(String(extraKey).indexOf('src:')===0?'追加召喚':'追加召喚（鬼ガエル）');   /* S03-U274 */
      out.push({id:'extraNormalSummon', label:extraLabel, cls:'gold', run:`doExtraNormalSummonV370(${i},${jsStr(extraKey)})`});
    }
    const setOk = R.setCard && normalRightFreeS03(P) && hasMonsterZoneSpace(p) && canPaySetTribute(db,p);
    if(setOk) out.push({id:'setMonster', label:'セット', run:`doSetMonsterLegal(${i})`});
    const extraSetKey=R.setCard&&hasMonsterZoneSpace(p)&&canPaySetTribute(db,p)?extraNormalSummonKeyV370(p,db,'set'):null;
    if(extraSetKey) out.push({id:'extraSetMonster', label:'追加セット', run:`doExtraSetMonsterV370(${i},${jsStr(extraSetKey)})`});

    if(sc && typeof sc.resolve==='function'){
      /* 手札発動を明示したカードだけ。全モンスターに特殊召喚ボタンは出さない。 */
      if(canActivateFromZone(db,'hand')){
        const L=strictScriptLegality(nm,p,'hand',i);
        if(L.ok){
          const ssLabel = /特殊召喚/.test(String(db.e||'')) ? '⚡ 特殊召喚 / 効果発動' : '⚡ 手札効果を発動';
          out.unshift({id:'handEffect', label:ssLabel, cls:'fx', run:`duelActivateFromHand(${i})`});
        }
      }
    } else if(CARD_EFFECT[nm] && canActivateFromZone(db,'hand')){
      out.unshift({id:'legacyHandEffect', label:'⚡ 手札効果を発動', cls:'fx', run:`duelActivateFromHand(${i})`});
    }
  }else{
    const toField=db.sub==='フィールド';
    const room=hasSpellTrapSpace(p,toField);
    const canSet=R.setCard && room;
    /* 罠は手札から直接発動しない。魔法のみ。
       System v3.6.1: 「DUEL=合法操作だけ表示」を魔法にも徹底する。
       以前はボタン表示後に prepareDuelActivation() で拒否していたため、
       特殊召喚禁止中の《死者蘇生》などが見かけ上は発動可能に見えていた。 */
    if(db.k==='s' && room && canActivateNow(db)){
      if(hasEffect(nm)){
        const sc=CARD_SCRIPTS[nm];
        if(sc){
          const logicalZone=toField?'field':'sz';
          const prospectiveIndex=toField?0:P.sz.length;
          const L=strictScriptLegalityV2(nm,p,'hand',i,{cardOverride:c,logicalZone,prospectiveIndex});
          if(L.ok) out.push({id:'activate', label:'⚡ 発動', cls:'fx', run:`duelActivateFromHand(${i})`});
        }else out.push({id:'activateManual', label:'発動（手動処理）', run:`handActivate(${i})`});
      }else out.push({id:'activateManual', label:'発動（手動処理）', run:`handActivate(${i})`});
    }
    if(canSet) out.push({id:'setST', label:'セット', run:`doSetST(${i},${toField})`});
  }
  return out;
}

function canManualPositionChange(card){
  if(!card || card.face!=='up') return false;
  /* System v10: 永続効果による表示形式の固定・変更不可を先に見る。 */
  if(typeof cannotChangePositionV10==='function' && cannotChangePositionV10(card)) return false;
  /* System v10: 通常は変更できないフェイズを許す追加ウィンドウ。 */
  const extraWindow = (typeof positionWindowOpenV10==='function') && positionWindowOpenV10(card);
  if(!extraWindow && !(gameState.phase==='main1'||gameState.phase==='main2')) return false;
  if(extraWindow) return !card.attacked && card.summonedTurn!==gameState.turn && card.setTurn!==gameState.turn;
  if(card.attacked) return false;
  if(card.summonedTurn===gameState.turn || card.setTurn===gameState.turn) return false;
  if(card.positionChangedTurn===gameState.turn) return false;
  if(card.v380LylaLockThroughTurn!=null && gameState.turn<=card.v380LylaLockThroughTurn) return false;
  return true;
}
function canFlipSummonLegal(card,p){
  if(!card || card.face!=='down') return false;
  if(!(gameState.phase==='main1'||gameState.phase==='main2')) return false;
  if(card.setTurn===gameState.turn || card.summonedTurn===gameState.turn) return false;
  const owner=p!=null?p:(locateCard(card)||{}).p;
  if(owner!=null && v46FaceUpSummonRestrictionReason(owner,dbOf(card),'flip')) return false;
  return true;
}

/* DUELモード用：フィールド上カードの合法操作。 */
function getLegalZoneActions(p, zone, idx){
  const P=gameState.players[p], c=zoneCard(P,zone,idx); if(!c) return [];
  const db=dbOf(c), nm=db.n||'', out=[];
  if(p!==gameState.activePlayer) return out; // 相手カードは情報閲覧のみ
  const isMon=db.k==='m', faceUp=c.face==='up';

  if(isMon && faceUp && c.pos==='atk' && gameState.phase==='battle' && canDeclareAttackV48(c)){
    const uid=ensureCardUid(gameState,c);
    out.push({id:'attack', label:'攻撃対象を選ぶ', cls:'gold', run:`battlePickAttackerV29(${uid})`});
  }

  const sc=CARD_SCRIPTS[nm];
  if(faceUp && sc && typeof sc.resolve==='function'){
    /* S03-U60: strictScriptLegality() itself now refuses a face-up Continuous/Field/Equip Spell that has
       no genuine field-repeatable effect (see fieldReactivationBlockedS03U60 above), so this list and the
       actual duelActivateFromZone()->prepareDuelActivation() execution path stay consistent by construction. */
    const L=strictScriptLegality(nm,p,zone,idx);
    if(L.ok) out.unshift({id:'effect', label:'⚡ 効果を発動', cls:'fx', run:`duelActivateFromZone(${p},'${zone}',${idx})`});
  }else if(faceUp && !sc && hasEffect(nm) && canActivateNow(db)){
    out.unshift({id:'legacyEffect', label:'⚡ 効果を発動', cls:'fx', run:`duelActivateFromZone(${p},'${zone}',${idx})`});
  }

  /* 伏せ魔法・罠の発動。罠と速攻魔法はセットしたターン不可。 */
  if(!isMon && c.face==='down'){
    const setLocked = c.setTurn===gameState.turn && (db.k==='t' || (db.k==='s'&&db.sub==='速攻'));
    const actOk = !setLocked && canActivateNow(db);
    if(actOk){
      if(hasEffect(nm)){
        if(sc){
          const L=strictScriptLegalityV2(nm,p,zone,idx);
          if(L.ok) out.unshift({id:'activateSet', label:'⚡ 発動', cls:'fx', run:`duelActivateFromZone(${p},'${zone}',${idx})`});
        }else out.unshift({id:'activateSetManual', label:'発動（手動処理）', run:`duelActivateFromZone(${p},'${zone}',${idx})`});
      }else out.unshift({id:'activateSetManual', label:'発動（手動処理）', run:`duelActivateFromZone(${p},'${zone}',${idx})`});
    }
  }

  if(isMon){
    /* S03-U119: デュアルモンスターのもう1度召喚（通常召喚扱い） */
    if(faceUp && zone==='mz' && typeof geminiSummonBlockedS03==='function' && isGeminiS03(c) && !geminiSummonBlockedS03(c,p))
      out.push({id:'geminiSummon', label:'もう1度召喚（デュアル）', cls:'gold', run:`closeSheet();doGeminiSummonS03(${p},'${zone}',${idx})`});
    if(canFlipSummonLegal(c,p)) out.push({id:'flipSummon', label:'反転召喚', run:`closeSheet();doFlipUp(${p},'${zone}',${idx},'atk')`});
    else if(canManualPositionChange(c)) out.push({id:'position', label:'表示形式変更', run:`zAct('TOGGLE_POS',${p},'${zone}',${idx})`});
  }
  return out;
}

/* LegalActionEngine の単一入口。今後UIは原則ここだけを見る。 */
function getLegalActions(gs, p, source){
  if(!source) return [];
  if(source.zone==='hand') return getLegalHandActions(p, source.index);
  return getLegalZoneActions(p, source.zone, source.index);
}

function legalActionsHTML(actions){
  if(!actions.length) return `<div class="legal-empty">現在、このカードで行える通常操作はありません。</div>`;
  return `<div class="act-grid">${actions.map(a=>`<div class="act ${a.cls||''}" onclick="${a.run}">${a.label}</div>`).join('')}</div>`;
}

function openHandDuel(i){
  const p=gameState.activePlayer, P=gameState.players[p], c=P.hand[i]; if(!c) return;
  const db=dbOf(c), st=automationStatus(db), actions=getLegalActions(gameState,p,{zone:'hand',index:i});
  sheet.innerHTML = metaHead(db) +
    `<div class="legal-head"><span class="lh-title">LEGAL ACTIONS</span><span class="lh-auto">${st.jp}</span></div>` +
    legalActionsHTML(actions) +
    (st.id==='manual'?`<div class="legal-note">このカードは完全自動化されていません。必要な場合はメニューからMANUALモードへ切り替えて処理できます。</div>`:'') +
    `<button class="close" onclick="closeSheet()">閉じる</button>`;
  veil.classList.add('on');
}

function openZoneDuel(p,zone,idx){
  const P=gameState.players[p], c=zoneCard(P,zone,idx); if(!c) return;
  const db=dbOf(c), st=automationStatus(db), actions=getLegalActions(gameState,p,{zone,index:idx});
  const ownerNote = p!==gameState.activePlayer ? `<div class="legal-note">相手側のカードです。DUELモードではカード情報のみ表示します。</div>` : '';
  sheet.innerHTML = metaHead(db) +
    `<div class="legal-head"><span class="lh-title">LEGAL ACTIONS</span><span class="lh-auto">${st.jp}</span></div>` +
    legalActionsHTML(actions) + ownerNote +
    (st.id==='manual'?`<div class="legal-note">未自動化の処理が必要ならMANUALモードを使用してください。</div>`:'') +
    `<button class="close" onclick="closeSheet()">閉じる</button>`;
  veil.classList.add('on');
}

function openModeMenu(){
  sheet.innerHTML=`<div class="grip"></div><h3 style="margin-bottom:6px">プレイモード</h3>
    <div class="meta" style="margin-bottom:12px">通常はDUEL推奨。未実装カード・例外裁定だけMANUALを使用します。</div>
    <div class="act-grid wide">
      <div class="act ${PLAY_MODE===PLAY_MODES.DUEL?'fx':''}" onclick="setPlayMode('duel')">DUEL — 合法操作だけ表示</div>
      <div class="act ${PLAY_MODE===PLAY_MODES.MANUAL?'fx':''}" onclick="setPlayMode('manual')">MANUAL — 従来の全操作</div>
      <div class="act ${PLAY_MODE===PLAY_MODES.DEVELOPER?'fx':''}" onclick="setPlayMode('developer')">DEVELOPER — 開発・デバッグ</div>
    </div><button class="close" onclick="openMenu()">戻る</button>`;
  veil.classList.add('on');
}

function openAutomationReport(){
  const all=CARD_DB.filter(x=>x&&x.n), n={scripted:0,generic:0,manual:0,unsupported:0};
  all.forEach(db=>{ const k=automationStatus(db).id; n[k]=(n[k]||0)+1; });
  const auto=n.scripted+n.generic, pct=all.length?Math.round(auto/all.length*100):0;
  sheet.innerHTML=`<div class="grip"></div><h3 style="margin-bottom:6px">自動化状況</h3>
    <div class="state-grid">
      <div class="state-cell"><span class="k">SCRIPTED</span><span class="v">${n.scripted}</span></div>
      <div class="state-cell"><span class="k">GENERIC</span><span class="v">${n.generic}</span></div>
      <div class="state-cell"><span class="k">MANUAL</span><span class="v">${n.manual}</span></div>
      <div class="state-cell"><span class="k">自動化率（DB全体）</span><span class="v">${pct}%</span></div>
    </div>
    <div class="meta">SCRIPTED/GENERICは「何らかの自動処理を持つ」という集計です。裁定完全対応率を意味するものではありません。</div>
    <button class="close" onclick="openMenu()">戻る</button>`;
  veil.classList.add('on');
}

/* =========================================================================
   Step11-13: カードスクリプト基盤 / イベントシステム / デバッガー

   設計:
   - スクリプトは gameState を直接触らない。必ず API 経由。
   - API は内部で act()（=applyAction）を呼ぶので Undo/Redo が効く。
   - スクリプトは UI/DOM を触らない。対象選択は API が担当する。
   - 処理の各段階は scriptLog に記録され、デバッガーで追える。
   ========================================================================= */

/* =========================================================================
   回数制限（EDOPro の SetCountLimit 相当）
   スクリプトに countLimit を書くだけで「1ターンに1度」等を自動管理する。
     countLimit: 1                    → 1ターンに1度
     countLimit: {n:1, scope:'duel'}  → デュエル中に1度

   【1103の回数制限】
   通常の「1ターンに1度」はカード個体ごとに数える。
   一方、1103当時でも《レスキューラビット》のように
   「『カード名』の効果は1ターンに1度」と明示されたカードは名称単位で数える。
     例）魔導戦士 ブレイカーが2体いれば、2体とも効果を使える
         レスキューラビットは2枚目を出しても同じターンには効果を使えない

   名称単位で数えるカードは nameLimit:true を宣言する。
   ========================================================================= */
const RULING_1103_PER_CARD_LIMIT = true;
function countKey(name){ return 'cl:'+name; }

/* カード個体に記録した使用回数 */
function cardCountUsed(card, scope){
  if(!card) return 0;
  if(scope === 'duel') return card.clDuel || 0;
  return (card.clTurn === gameState.turn) ? (card.clN || 0) : 0;
}
function cardCountConsume(card, scope){
  if(!card) return;
  if(scope === 'duel'){ card.clDuel = (card.clDuel||0) + 1; return; }
  if(card.clTurn !== gameState.turn){ card.clTurn = gameState.turn; card.clN = 0; }
  card.clN = (card.clN||0) + 1;
}

/* 名称単位で記録した使用回数（後年のフォーマット用） */
function countUsed(p, name, scope){
  const P = gameState.players[p];
  const store = (scope==='duel') ? P.effectFlags : P.temporaryFlags;
  return store[countKey(name)] || 0;
}

/* card を渡せば個体単位、渡さなければ名称単位で数える */
/* S03-U02: countLimit:{n, scope, effects:[v4EffectKey...]} は列挙した効果の発動だけを数える。
   「1ターンに1度だけ裏側守備表示にできる」＋反転召喚時の誘発のように制限が片方の効果にだけ
   付くカードで、誘発の発動が制限を消費しないようにする。effects の無い従来の countLimit は
   カード全体に掛かり、挙動は変わらない。 */
function countLimitAppliesV32(sc, effectKey){
  const cl = sc && sc.countLimit;
  if(!cl) return false;
  if(typeof cl!=='object' || !Array.isArray(cl.effects)) return true;
  return cl.effects.indexOf(effectKey) >= 0;
}
/* effects 指定がある統合効果カードについて、この発動がどの効果かを返す。 */
function countLimitEffectKeyV32(name, sc, ctx){
  if(!sc || !sc.countLimit || typeof sc.countLimit!=='object' || !Array.isArray(sc.countLimit.effects)) return null;
  if(ctx && ctx.v4EffectKey) return ctx.v4EffectKey;
  if(!ctx || !sc.v4Unified || typeof v4SelectEffectForContext!=='function') return null;
  const e = v4SelectEffectForContext(name, ctx);
  return e ? e.key : null;
}
function countLeft(p, name, sc, card, effectKey){
  if(!sc || !sc.countLimit) return Infinity;
  if(!countLimitAppliesV32(sc, effectKey)) return Infinity;
  const cl = (typeof sc.countLimit==='number') ? {n:sc.countLimit} : sc.countLimit;
  const perCard = RULING_1103_PER_CARD_LIMIT && !sc.nameLimit && card;
  const used = perCard ? cardCountUsed(card, cl.scope) : countUsed(p, name, cl.scope);
  return (cl.n||1) - used;
}
function countConsume(p, name, sc, card, effectKey){
  if(!sc || !sc.countLimit || !countLimitAppliesV32(sc, effectKey)) return;
  const cl = (typeof sc.countLimit==='number') ? {n:sc.countLimit} : sc.countLimit;
  if(RULING_1103_PER_CARD_LIMIT && !sc.nameLimit && card){
    cardCountConsume(card, cl.scope);
    return;
  }
  const P = gameState.players[p];
  const store = (cl.scope==='duel') ? P.effectFlags : P.temporaryFlags;
  store[countKey(name)] = (store[countKey(name)]||0) + 1;
}
function countConsumePayloadV44(p,name,sc,card,effectKey){
  if(!sc || !sc.countLimit || !countLimitAppliesV32(sc,effectKey)) return null;
  const cl=(typeof sc.countLimit==='number')?{n:sc.countLimit}:sc.countLimit;
  const scope=cl.scope==='duel'?'duel':'turn';
  if(RULING_1103_PER_CARD_LIMIT && !sc.nameLimit && card){
    ensureCardUid(gameState,card);
    return {kind:'card',scope,uid:card.uid};
  }
  return {kind:'name',scope,player:p,key:countKey(name)};
}
function countLimitJp(sc){
  if(!sc || !sc.countLimit) return "";
  const cl = (typeof sc.countLimit==='number') ? {n:sc.countLimit} : sc.countLimit;
  const n = cl.n||1;
  return (cl.scope==='duel') ? `デュエル中に${n}度` : `1ターンに${n}度`;
}

/* ---- デバッガー用トレース ---- */
function traceStart(name){
  gameState.scriptLog = gameState.scriptLog || [];
  gameState.scriptLog.unshift({name, t:Date.now(), steps:[]});
  if(gameState.scriptLog.length>20) gameState.scriptLog.pop();
}
function trace(msg, ok){
  const cur = (gameState.scriptLog||[])[0];
  if(cur) cur.steps.push({msg, ok: ok!==false});
}

/* ---- context を組み立てる ---- */
function makeContext(p, card, zone, index, eventName, extra){
  const gs = gameState;
  return Object.assign({
    gameState: gs,
    player: p,
    opponent: p===0?1:0,
    card, zone, index,
    phase: gs.phase,
    turn: gs.turn,
    chainDepth: gs.chain.length,
    priority: gs.priority,
    eventName: eventName||null,
    targetCandidates: [],
    selectedTargets: [],
    reason: "",
    debug: [],
  }, extra||{});
}

/* =========================================================================
   共通API（スクリプトが使える唯一の手段）
   すべて act() 経由なので Undo が効く。
   ========================================================================= */
/* 手札の候補を集める。発動元が手札のカード自身なら、それは候補から除く。 */
function handCandidates(ctx, filter){
  const P = gameState.players[ctx.player];
  return P.hand.map((c,i)=>({p:ctx.player, zone:'hand', index:i, card:c, db:dbOf(c)}))
    .filter(x=>!(ctx.zone==='hand' && x.card===ctx.card))
    .filter(x=>!filter || filter(x));
}

/* 対象のカード名を伏せるべきか。
   場（モンスター/魔法罠/フィールド）に裏側で置かれている時だけ隠す。
   デッキ・墓地・除外・手札から選ぶ場合は内容が見えないと選択できない。 */
function isHiddenTarget(t){
  if(!t || !t.card) return false;
  if(t.card.face !== 'down') return false;
  return t.zone==='mz' || t.zone==='sz' || t.zone==='field';
}

/* 対象の現在位置を解決する。
   効果処理中に他のカードが動くと添字がずれるため、
   記録しておいたカード実体から探し直す。 */
function resolveTarget(t){
  if(!t) return null;
  /* カード実体だけを渡された場合は盤面全体から探す。
     強制転移のように、片方を動かすと添字がずれる処理で使う。 */
  if(t.card && (t.p == null || !t.zone)){
    const loc = locateCard(t.card);
    if(loc) return {p:loc.p, zone:loc.zone, index:loc.index, card:t.card};
    for(let p=0; p<2; p++){
      const PP = gameState.players[p];
      for(const z of ['hand','grave','deck','banish','ex']){
        const i = (PP[z]||[]).indexOf(t.card);
        if(i >= 0) return {p, zone:z, index:i, card:t.card};
      }
    }
    return null;
  }
  const P = gameState.players[t.p];
  if(t.zone === 'field'){
    return (P.field && (!t.card || P.field===t.card)) ? {p:t.p, zone:'field', index:0, card:P.field} : null;
  }
  const arr = P[t.zone] || [];
  if(t.card){
    const i = arr.indexOf(t.card);
    if(i < 0) return null;              // 既に場を離れている
    return {p:t.p, zone:t.zone, index:i, card:t.card};
  }
  return (t.index < arr.length) ? {p:t.p, zone:t.zone, index:t.index, card:arr[t.index]} : null;
}

const API = {
  /* --- 情報取得（読み取り専用） --- */
  me(ctx){ return gameState.players[ctx.player]; },
  foe(ctx){ return gameState.players[ctx.opponent]; },
  db(card){ return dbOf(card); },
  /* 場のカードを列挙 [{p, zone, index, card, db}] */
  fieldCards(opts){
    const o = opts||{};
    const out=[];
    [0,1].forEach(p=>{
      if(o.player!=null && o.player!==p) return;
      const P=gameState.players[p];
      if(o.zone==null || o.zone==='mz') P.mz.forEach((c,i)=>out.push(v17Handle(p,'mz',i,c)));
      if(o.zone==null || o.zone==='sz') P.sz.forEach((c,i)=>out.push(v17Handle(p,'sz',i,c)));
      if((o.zone==null || o.zone==='field') && P.field) out.push(v17Handle(p,'field',0,P.field));
    });
    return o.filter ? out.filter(o.filter) : out;
  },
  pileCards(p, zone, filter){
    const arr = gameState.players[p][zone]||[];
    const out = arr.map((c,i)=>v17Handle(p, zone, i, c));
    return filter ? out.filter(filter) : out;
  },

  /* --- 盤面操作プリミティブ --- */
  /* System v30 B1: byPlayer 省略時は解決中のチェーンリンクの発動プレイヤーが使われる。
     「別のプレイヤーが破壊した扱い」にしたい場合だけ明示する。 */
  destroy(t, reason, byPlayer){ const r=resolveTarget(t); if(!r){ trace(`destroy: 対象が場にない`, false); return; }
    trace(`destroy: ${labelOf(r.card)}`);
    const act1={type:"FX_TO_GRAVE", player:r.p, zone:r.zone, index:r.index, reason, byDestroy:true};
    if(byPlayer===0||byPlayer===1) act1.byPlayer=byPlayer;
    /* S03-U173: an optional destruction substitute may apply — decided by its controller before anything moves (engine/1ZV) */
    if(typeof destroySubInterceptS03==='function' && destroySubInterceptS03('destroy', act1, r)) return;
    act(act1); },
  destroyAll(zone, player, reason){
    trace(`destroyAll: ${zoneJp(zone)}${player!=null?`(${nameOf(player)})`:"(両者)"}`);
    const ps = player!=null ? [player] : [0,1];
    if(typeof destroySubInterceptS03==='function' && destroySubInterceptS03('wipe', {zone, players:ps, reason})) return;   /* S03-U173 */
    ps.forEach(p=>act({type:"FX_WIPE_ZONE", player:p, zone, reason}));
  },
  /* S03-U294: what this effect actually destroyed, after the optional substitute decisions (engine/1ZZO) */
  afterDestroyS03(handler, args){ return destroyAfterS03(handler, args); },
  destroyMarkS03(){ return destroyMarkS03(gameState); },
  destroyedSinceS03(mark, uids){ return destroyedSinceS03(mark, uids, gameState); },
  sendToGrave(t, reason){ const r=resolveTarget(t); if(!r){ trace(`sendToGrave: 対象が場にない`, false); return; }
    trace(`sendToGrave: ${labelOf(r.card)}`); act({type:"FX_TO_GRAVE", player:r.p, zone:r.zone, index:r.index, reason, byDestroy:false}); },
  specialSummon(p, from, index, pos, reason, fromPlayer, opts){
    if(graveMoveBlocked(from, 'leave')){ reportGraveLock('leave'); return false; }
    const sp=fromPlayer==null?p:fromPlayer;
    const before=(gameState.players[sp][from]||[])[index];
    const nm=before?cardName(before):"";
    const sr=before?v46SpecialSummonRestrictionReason(p,dbOf(before)):v46GlobalSpecialSummonRestrictionReason(p);
    if(sr){ trace(`specialSummon blocked: ${sr}`,false); showToast(sr); return false; }
    const extra = Object.assign({}, opts && typeof opts === 'object' ? opts : {});
    /* S03-U413: 融合禁止エリア — a face-up card with fusionSummonBanS03 stops every Fusion Summon (summonKind 'fusion') of both players */
    if(extra.summonKind==='fusion' && typeof deckLockSourceS03==='function' && deckLockSourceS03(gameState,'fusionSummonBanS03')){ trace('specialSummon blocked: fusion summon ban',false); showToast('融合召喚はできません'); return false; }
    /* S03-U415: デッキロック — no Special Summon from the Deck while a face-up card with deckSummonBanS03 stands */
    if(from==='deck' && typeof deckSummonBannedS03==='function' && deckSummonBannedS03(gameState)){ trace('specialSummon blocked: deck summon ban',false); showToast('デッキからの特殊召喚はできません'); return false; }
    /* S03-U281 (Opus review): 「…の効果によって特殊召喚」 — when the caller names no source, the card whose chain link is resolving is the source
       (summonSrcS03, S03-U238); journaled in the FX_SPECIAL_SUMMON action, so Replay records the same. */
    if(extra.summonSrcS03==null && typeof RESOLVING_LINK_S03!=='undefined' && RESOLVING_LINK_S03 && RESOLVING_LINK_S03.name) extra.summonSrcS03 = RESOLVING_LINK_S03.name;
    /* S03-U126: 「〜でしか特殊召喚できない」（engine/1ZK_summon_only_s03.js） */
    /* S03-U145: 「召喚条件を無視して特殊召喚する」（古代の機械究極巨人 ③）— opts.ignoreSummonConditionS03 skips the card's own summon
       conditions (U126 「〜でしか」, U127 proper summon, and 「特殊召喚できない」 in FX_SPECIAL_SUMMON); player-level restrictions still apply. */
    const ignoreCondS03 = extra.ignoreSummonConditionS03===true;
    /* S03-U187: 「「Sin」モンスターはフィールドに1体しか表側表示で存在できない」 — a standing rule, not a summon condition (applies even when conditions are ignored) */
    const sinS03 = (before && typeof sinUniqueReasonS03==='function') ? sinUniqueReasonS03(before) : '';
    if(sinS03){ trace(`specialSummon blocked: ${sinS03}`,false); showToast(sinS03); logIt(gameState, `${reason||'効果'}：${sinS03}`); return false; }
    const onlyS03 = (!ignoreCondS03 && before && typeof summonOnlyReasonS03==='function') ? summonOnlyReasonS03(before, extra.summonKind||null, reason) : '';
    if(onlyS03){ trace(`specialSummon blocked: ${onlyS03}`,false); showToast(onlyS03); logIt(gameState, `${reason||'効果'}：${onlyS03}`); return false; }
    /* S03-U127: 正規の方法で特殊召喚されていない特殊召喚モンスター */
    const properS03 = (!ignoreCondS03 && before && typeof properlySummonedReasonS03==='function') ? properlySummonedReasonS03(before, extra.summonKind||null, reason, from) : '';
    if(properS03){ trace(`specialSummon blocked: ${properS03}`,false); showToast(properS03); logIt(gameState, `${reason||'効果'}：${properS03}`); return false; }
    /* S03-U358: 「このカードは墓地からの特殊召喚はできない」 */
    const noGraveS03 = (!ignoreCondS03 && before && typeof noGraveSummonReasonS03==='function') ? noGraveSummonReasonS03(before, from) : '';
    if(noGraveS03){ trace(`specialSummon blocked: ${noGraveS03}`,false); showToast(noGraveS03); logIt(gameState, `${reason||'効果'}：${noGraveS03}`); return false; }
    trace(`specialSummon: ${from}[${index}] → ${pos||'atk'}`);
    act(Object.assign({type:"FX_SPECIAL_SUMMON", player:p, fromPlayer:sp, from, fromIndex:index, pos:pos||'atk', reason}, extra));
    // System v3.4.0: 特殊召喚が制約等で失敗した時、既存の最後尾モンスターを誤って「召喚成功」にしない。
    if(PLAY_MODE===PLAY_MODES.DUEL && before){
      const h=locateCard(before);
      if(h && h.p===p && h.zone==='mz') queueSpecialSummonSuccessV2(p,before,'effect');
      /* S03-U278: a text with no position lets the summoning player choose (queued; engine/1ZZK) */
      if(h && h.p===p && h.zone==='mz' && typeof ssPositionMaybeQueueS03==='function') ssPositionMaybeQueueS03(p, before, pos, reason, extra);
    }
    return !!(before&&locateCard(before)&&locateCard(before).p===p&&locateCard(before).zone==='mz');
  },
  /* S03-U01: 封印中は Action を発行しない（journal にも載らないので Replay と一致する）。 */
  searchDeck(p, deckIndex, reason){ const lock=deckToHandLockReasonV32(p); if(lock){ trace(`search blocked: ${lock}`, false); logIt(gameState, `${reason||"効果"}：${lock}`); return false; } trace(`search: deck[${deckIndex}]`); act({type:"FX_SEARCH", player:p, deckIndex, reason}); return true; },
  deckToHand(p, deckIndex, reason){ const lock=deckToHandLockReasonV32(p); if(lock){ trace(`deckToHand blocked: ${lock}`, false); logIt(gameState, `${reason||"効果"}：${lock}`); return false; } trace(`deckToHand: deck[${deckIndex}]`); act({type:"FX_DECK_TO_HAND", player:p, deckIndex, reason}); return true; },
  mill(p, deckIndex, reason){ trace(`mill: deck[${deckIndex}]`); act({type:"FX_MILL", player:p, deckIndex, reason}); },
  millTop(p, n, reason){ trace(`millTop: ${n}`); act({type:"FX_MILL_TOP", player:p, n, reason}); },
  /* opts: {byEffect:false} でルール処理による捨て札、{byPlayer:n} で捨てさせた側を指定 */
  discard(p, handIndex, reason, opts){
    trace(`discard: hand[${handIndex}]`);
    act(Object.assign({type:"FX_DISCARD", player:p, handIndex, reason}, opts||{}));
  },
  sendHandToGrave(p, handIndex, reason){
    trace(`sendHandToGrave: hand[${handIndex}]`);
    act({type:"FX_HAND_SEND_GRAVE", player:p, handIndex, reason});
  },
  returnToHand(t, reason){ const r=resolveTarget(t); if(!r){ trace(`returnToHand: 対象が場にない`, false); return; }
    if(graveMoveBlocked(r.zone, 'leave')){ reportGraveLock('leave'); return; }
    trace(`returnToHand: ${labelOf(r.card)}`); act({type:"FX_BOUNCE", player:r.p, zone:r.zone, index:r.index, reason}); },
  returnToDeck(t, toBottom, reason){ const r=resolveTarget(t); if(!r){ trace(`returnToDeck: 対象が見つからない`, false); return; }
    if(graveMoveBlocked(r.zone, 'leave')){ reportGraveLock('leave'); return; }
    trace(`returnToDeck: ${labelOf(r.card)}`); act({type:"FX_RETURN_DECK", player:r.p, zone:r.zone, index:r.index, toBottom, reason}); },
  banish(t, reason){ const r=resolveTarget(t); if(!r){ trace(`banish: 対象が見つからない`, false); return; }
    if(graveMoveBlocked(r.zone, 'banish')){ reportGraveLock('banish'); return; }
    trace(`banish: ${labelOf(r.card)}`); act({type:"FX_BANISH", player:r.p, zone:r.zone, index:r.index, reason}); },
  destroyAndBanish(t, reason, byPlayer){ const r=resolveTarget(t); if(!r){ trace(`destroyAndBanish: 対象が見つからない`, false); return; }
    trace(`destroyAndBanish: ${labelOf(r.card)}`);
    act({type:"FX_DESTROY_BANISH", player:r.p, zone:r.zone, index:r.index, reason, byPlayer}); },
  changePosition(t, pos, reason){ const r=resolveTarget(t); if(!r) return;
    const old=r.card.pos; trace(`changePosition: ${labelOf(r.card)} → ${pos}`); act({type:"FX_SET_STATE", player:r.p, zone:r.zone, index:r.index, pos, reason});
    if(old!==r.card.pos && typeof notifyKarakuriPositionChangeV350==='function') notifyKarakuriPositionChangeV350(r.p,r.card); },
  flip(t, face, reason){ const r=resolveTarget(t); if(!r) return;
    trace(`flip: ${labelOf(r.card)} → ${face}`); act({type:"FX_SET_STATE", player:r.p, zone:r.zone, index:r.index, face, reason}); },
  negate(t, reason){ const r=resolveTarget(t); if(!r) return;
    trace(`negate: ${labelOf(r.card)}`); act({type:"FX_NEGATE", player:r.p, zone:r.zone, index:r.index, reason}); },
  overlay(p, targetMz, from, fromIndex){ trace(`overlay`); act({type:"FX_OVERLAY", player:p, targetMz, from, fromIndex}); },
  /* S03-U114: 取り除く素材は UID で指定できる（opts.materialUid）。プレイヤーが選ぶ処理は requestDetachMaterial を使う。 */
  detachMaterial(p, mzIndex, reason, opts){ trace(`detach: mz[${mzIndex}]`);
    act(Object.assign({type:"FX_DETACH", player:p, mzIndex, reason}, (opts&&opts.materialUid!=null)?{materialUid:opts.materialUid}:{})); },
  /* S03-U114: プレイヤーが取り除く X 素材を選ぶ汎用処理（engine/1ZF_xyz_detach_choice_s03.js） */
  requestDetachMaterial(spec){ return requestDetachMaterialS03(spec); },
  grantAdditionalAttack(t,n,reason,afterCurrent){
    const r=resolveTarget(t); if(!r||r.zone!=='mz') return false;
    trace(`additional attack: ${labelOf(r.card)}`);
    act({type:'GRANT_EXTRA_ATTACK_V48',player:r.p,zone:r.zone,index:r.index,n:n||1,afterCurrent:!!afterCurrent,reason});
    return true;
  },
  equipFromGrave(p,equipment,target,reason,sourceUid,chainId){
    const eq=resolveTarget(equipment),host=resolveTarget(target);
    if(!graveEquipLegalV31(gameState,p,eq,host))return false;
    act({type:'FX_EQUIP_FROM_GRAVE_V31',player:p,fromPlayer:eq.p,
      equipUid:eq.card.uid,targetUid:host.card.uid,reason,
      sourceUid:sourceUid==null?null:sourceUid,chainId:chainId==null?null:chainId});
    return !!(eq.card.equipTo&&eq.card.equipTo.uid===host.card.uid);
  },
  equipMonster(p,t,target,reason){
    const r=resolveTarget(t), h=resolveTarget(target);
    if(!r||!h||r.zone!=='mz'||h.zone!=='mz') return false;
    if(gameState.players[p].sz.length>=ZONE_LIMITS.sz) return false;
    trace(`equipMonster: ${labelOf(r.card)} → ${labelOf(h.card)}`);
    act({type:'FX_MONSTER_EQUIP_V46',player:p,fromPlayer:r.p,fromIndex:r.index,targetPlayer:h.p,targetMz:h.index,reason});
    return !!(gameState.players[p].sz||[]).find(c=>c===r.card&&c.v46MonsterEquip);
  },
  /* S03-U402: a monster of the hand equipped directly (竜操術), without being Special Summoned */
  equipMonsterFromHand(p,handIndex,target,reason){
    const h=resolveTarget(target), c=gameState.players[p].hand[handIndex];
    if(!h||h.zone!=='mz'||!c) return false;
    if(gameState.players[p].sz.length>=ZONE_LIMITS.sz) return false;
    ensureCardUid(gameState,c);
    act({type:'FX_MONSTER_EQUIP_V46',player:p,fromPlayer:p,fromIndex:handIndex,fromHandS03:true,targetPlayer:h.p,targetMz:h.index,reason});
    return !!(gameState.players[p].sz||[]).find(x=>x===c&&x.v46MonsterEquip);
  },
  equipSpell(source,target,reason){
    const s=resolveTarget(source),t=resolveTarget(target);
    if(!s||!t||s.zone!=='sz'||t.zone!=='mz') return false;
    trace(`equipSpell: ${labelOf(s.card)} → ${labelOf(t.card)}`);
    act({type:'FX_EQUIP',player:s.p,szIndex:s.index,targetP:t.p,targetMz:t.index,reason});
    return !!(s.card.equipTo&&s.card.equipTo.uid===t.card.uid);
  },
  unequip(t,reason){
    const r=resolveTarget(t); if(!r||r.zone!=='sz'||r.card.v46MonsterEquip!==true) return false;
    trace(`unequip: ${labelOf(r.card)}`);
    act({type:'FX_UNEQUIP',player:r.p,szIndex:r.index,reason});
    return !r.card.v46MonsterEquip && !r.card.equipTo;
  },
  /* S03-U257: 「（エンドフェイズまで／その戦闘で）…」 — register this used card as a lingering continuous source for player p for the rest of the turn
     (its script declares continuous.from:['linger'] and checks its own turn / battle record). Journaled (LINGER_ADD_S03). */
  lingerS03(p, t, reason, untilTurn){
    const r = resolveTarget(t) || t; const c = r && r.card ? r.card : r;
    if(!c){ trace('lingerS03: カードがない', false); return; }
    ensureCardUid(gameState, c);
    trace(`lingerS03: ${labelOf(c)}`);
    const aL = {type:'LINGER_ADD_S03', player:p, uid:c.uid, reason:reason||null};
    if(untilTurn != null && Number(untilTurn) > Number(gameState.turn)) aL.untilTurn = Number(untilTurn);   /* S03-U264: lasts until that turn */
    act(aL);
  },
  setCardFlag(t,flag,value,reason,opts){
    const r=resolveTarget(t); if(!r)return false;
    /* S03-U08: 効果処理中のカード状態flagは必ずActionで書く（Replay digest一致）。silent はログを出さない。 */
    act(Object.assign({type:'FX_CARD_FLAG_V46',player:r.p,zone:r.zone,index:r.index,flag,value,reason},(opts&&opts.silent)?{silent:true}:{})); return true;
  },
  shuffle(p){ trace(`shuffle`); act({type:"SHUFFLE", player:p}); },
  /* --- 攻守の増減（継続効果） --- */
  modAtk(t, atk, def, until, label){
    if(!canModifyNow()){ trace(`攻守増減：この段階では発動できない`, false); showToast("ダメージ計算時以降は攻守を変更できません"); return; }
    const r = resolveTarget(t); if(!r) return;
    trace(`modAtk: ${labelOf(r.card)} 攻${atk>0?'+':''}${atk||0}`);
    act({type:"MOD_ADD", player:r.p, zone:r.zone, index:r.index,
         atk:atk||0, def:def||0, until:until||'endTurn', label:label||'効果'});
  },
  curAtk(t){ const r=resolveTarget(t); return r? curATK(r.card) : 0; },
  curDef(t){ const r=resolveTarget(t); return r? curDEF(r.card) : 0; },
  /* --- カウンター --- */
  addCounter(t, kind, n){ trace(`addCounter: ${kind||'魔力'}×${n||1}`); act({type:"COUNTER_ADD", player:t.p, zone:t.zone, index:t.index, kind, n}); },
  removeCounter(t, kind, n){ trace(`removeCounter: ${kind||'魔力'}×${n||1}`); act({type:"COUNTER_REMOVE", player:t.p, zone:t.zone, index:t.index, kind, n}); },
  countCounter(t, kind){
    const P = gameState.players[t.p];
    const c = zoneCard(P, t.zone, t.index);
    return (c && c.counters && c.counters[kind||'魔力']) || 0;
  },
  /* --- トークン --- */
  createToken(p, def, n){
    trace(`createToken: ${def.name}×${n||1}`);
    const beforeS03 = new Set((gameState.players[p].mz||[]).map(c=>c && c.uid));   /* S03-U289 */
    act(Object.assign({type:"TOKEN_CREATE", player:p, key:def.key||def.name||null, name:def.name,
         atk:def.atk, def:def.def, lv:def.lv, ra:def.ra, at:def.at,
         pos:def.pos||'def', n:n||1}, def.noAdvanceTributeS03 ? {noAdvanceTributeS03:true} : {},
         def.noAdvanceTributeNonDarkS03 ? {noAdvanceTributeNonDarkS03:true} : {},
         def.advanceTributeOnlyForS03 ? {advanceTributeOnlyForS03:String(def.advanceTributeOnlyForS03)} : {},
         Number(def.destroyDamageS03) > 0 ? {destroyDamageS03:Number(def.destroyDamageS03)} : {}));
    /* S03-U289: the summoning player chooses the position when the text gives none (engine/1ZZK) */
    if(typeof ssPositionQueueTokensS03==='function')   /* the text decides: a position written only in the script is not the text's */
      ssPositionQueueTokensS03(p, (gameState.players[p].mz||[]).filter(c=>c && c.uid!=null && !beforeS03.has(c.uid)).map(c=>c.uid));
  },
  /* --- System v11: identity 付きのトークン生成 --- */
  /* spec は登録済みの key 文字列でもよい。実際に出せた uid の配列を返す。 */
  createTokens(p, spec, n, sourceTarget){
    const src=sourceTarget?resolveTarget(sourceTarget):null;
    const a=tokenCreatePayloadV11(p, spec, n, src?src.card:(sourceTarget&&sourceTarget.card)||null);
    if(!a){ trace(`createTokens: 定義が見つからない`, false); return []; }
    trace(`createTokens: ${a.name}×${a.n}`);
    act(a);
    const last=lastTokenCreatedV11(gameState);
    /* S03-U289: position choice for a text that gives none (engine/1ZZK) */
    if(last && typeof ssPositionQueueTokensS03==='function') ssPositionQueueTokensS03(p, last.uids);
    return last?last.uids.slice():[];
  },
  /* 場のモンスターの数値を写したトークン */
  createTokenFrom(p, srcTarget, name, n, key){
    const r=resolveTarget(srcTarget); if(!r) return [];
    const a=tokenCopyPayloadV11(p, r.card, name, n, key);
    if(!a) return [];
    trace(`createTokenFrom: ${a.name} ← ${labelOf(r.card)}`);
    act(a);
    const last=lastTokenCreatedV11(gameState);
    return last?last.uids.slice():[];
  },
  lastTokenCreated(){ return lastTokenCreatedV11(gameState); },
  isToken(t){ const r=resolveTarget(t); return isTokenV11(r?r.card:t); },
  tokenKey(t){ const r=resolveTarget(t); return tokenKeyV11(r?r.card:t); },
  tokensOf(key, player){ return tokensOnFieldV11(gameState, key, player); },
  tokenControllerOf(uid){
    const h=(uid!=null)?findCardByUid(uid):null;
    return h?tokenControllerV11(h.card):null; },
  tokenSourceUid(t){ const r=resolveTarget(t); return tokenSourceUidV11(r?r.card:t); },
  /* onLeaveField のイベントが「消滅したトークンの破壊」かどうか。
     トークンは墓地へ行かないので行き先からは判定できない。 */
  tokenWasDestroyed(evt){ return tokenWasDestroyedV11(evt); },
  tokenDestroyedByBattle(evt){ return tokenDestroyedByBattleV11(evt); },
  goneTokenKey(evt){ return (evt && evt.tokenKey) || null; },
  goneTokenController(evt){
    return (evt && (evt.tokenController===0||evt.tokenController===1))
      ? evt.tokenController : null; },
  /* --- System v12: 発動イベント / チェーンリンクの identity --- */
  lastActivation(){ return lastActivationV12(gameState); },
  isSpellActivation(evt, sub){ return isSpellActivationV12(evt, sub); },
  isTrapActivation(evt, sub){ return isTrapActivationV12(evt, sub); },
  isCounterTrapActivation(evt){ return isCounterTrapActivationV12(evt); },
  activationSource(evt){ return activationSourceV12(evt); },
  activationLink(evt){ return activationLinkV12(gameState, evt); },
  /* --- System v13: 効果無効（期間つき / チェーンリンク指定） --- */
  negateEffectUntil(t, until, label, sourceCard){
    return applyNegationV13(t, until, label, sourceCard||null); },
  clearNegateEffect(t){ return clearNegationV13(t); },
  isEffectNegated(t){ const r=resolveTarget(t); return r?effectNegated(r.card):false; },
  negatedByThisEffect(t){ const r=resolveTarget(t); return r?negatedByV13(r.card,gameState):false; },
  negateChainLink(evtOrId, mode, reason, destroySource){
    return negateChainLinkV13(evtOrId, mode, reason, destroySource); },
  chainLinkNegated(chainId){ return chainLinkNegatedV13(gameState, chainId); },
  /* --- System v14: 攻守の SET / SWAP / 元々の数値 --- */
  setAtk(t, value, until, label){
    return addStatModV14(t,{kind:'setAtk',atk:value,until,label}); },
  setDef(t, value, until, label){
    return addStatModV14(t,{kind:'setDef',def:value,until,label}); },
  setBaseStats(t, atk, def, until, label){
    return addStatModV14(t,{kind:'setBase',atk,def,until,label}); },
  addBaseStats(t, atk, def, until, label){
    return addStatModV14(t,{kind:'addBase',atk,def,until,label}); },
  swapBaseStats(t, until, label){
    return addStatModV14(t,{kind:'swapBase',until,label}); },
  clearStatMods(t, label){ return clearStatModsV14(t, label); },
  baseAtk(t){ const r=resolveTarget(t); return r?baseAtkV14(r.card):0; },
  /* --- System v17: 特性の上書き（現在値と元々の値を分ける） --- */
  setRace(t, race, until, label){
    return addCharModV17(t,{kind:'race',value:race,until,label}); },
  setAttribute(t, attr, until, label){
    return addCharModV17(t,{kind:'attr',value:attr,until,label}); },
  setCardName(t, name, until, label){
    return addCharModV17(t,{kind:'name',value:name,until,label}); },
  setTuner(t, on, until, label){
    return addCharModV17(t,{kind:'tuner',value:(on===false)?0:1,until,label}); },
  clearCharMods(t, label){ return clearCharModsV17(t, label); },
  raceOf(t){ const r=resolveTarget(t); return r?currentRaceV17(r.card):''; },
  attrOf(t){ const r=resolveTarget(t); return r?currentAttributeV17(r.card):''; },
  nameOf(t){ const r=resolveTarget(t); return r?currentNameV17(r.card):''; },
  isTunerNow(t){ const r=resolveTarget(t); return r?isTunerNowV17(r.card):false; },
  originalRaceOf(t){ const r=resolveTarget(t); return r?originalRaceV17(r.card):''; },
  originalAttrOf(t){ const r=resolveTarget(t); return r?originalAttributeV17(r.card):''; },
  originalNameOf(t){ const r=resolveTarget(t); return r?originalNameV17(r.card):''; },
  /* --- System v15: 装備の適正・参照・移し替え --- */
  equipLegal(eqTarget, monTarget){
    const e=resolveTarget(eqTarget), m=resolveTarget(monTarget);
    return (e&&m)?equipLegalV15(e.card,m):false; },
  equipTargets(eqTarget){
    const e=resolveTarget(eqTarget); return e?equipLegalTargetsV15(e.card):[]; },
  equipsOn(monTarget){
    const m=resolveTarget(monTarget); return m?equipsOnV15(m.card,gameState):[]; },
  equipCount(monTarget){
    const m=resolveTarget(monTarget); return m?equippedCountV15(m.card,gameState):0; },
  equippedMonster(eqTarget){
    const e=resolveTarget(eqTarget); return e?equippedMonsterOfV15(e.card,gameState):null; },
  moveEquip(eqTarget, monTarget, reason){
    const e=resolveTarget(eqTarget), m=resolveTarget(monTarget);
    return (e&&m)?moveEquipV15(e,m,reason):false; },
  detachEquip(eqTarget, reason){
    const e=resolveTarget(eqTarget); return e?detachEquipV15(e,reason):false; },
  /* --- System v16: レベル修整 --- */
  modLevel(t, delta, until, label){
    return addLevelModV16(t,{kind:'add',value:delta,until,label}); },
  setLevel(t, value, until, label){
    return addLevelModV16(t,{kind:'set',value,until,label}); },
  clearLevelMods(t, label){ return clearLevelModsV16(t, label); },
  levelOf(t){ const r=resolveTarget(t); return r?curLV(r.card):0; },
  equipCardOfEvent(evt){ return equipCardOfEventV15(evt,gameState); },
  equipMonsterOfEvent(evt){ return equipMonsterOfEventV15(evt,gameState); },
  baseDef(t){ const r=resolveTarget(t); return r?baseDefV14(r.card):0; },
  /* System v8: カードの効果によるドローは byEffect:true を明示する。 */
  draw(p, n){ trace(`draw: ${n||1}`); act({type:"DRAW", player:p, n:n||1, byEffect:true}); },
  /* System v18: cause を明示して中央の置換点に載せる。 */
  damageLP(p, amount, reason, o){ trace(`damage: ${nameOf(p)} -${amount}`);
    /* S03-U50: チェーンの解決中なら発生源（プレイヤー・カード・チェーン1か）を載せる（新しい Action だけ）。 */
    const r=(typeof RESOLVING_LINK_S03!=='undefined')?RESOLVING_LINK_S03:null;
    act(Object.assign({type:"LP", player:p, delta:-Math.abs(amount), cause:'effect'},
      (r&&(r.player===0||r.player===1))?{byPlayer:r.player}:{}, (r&&r.uid!=null)?{sourceUid:r.uid}:{}, (r&&r.chainLinkOne===true)?{chainLinkOneS03:true}:{}, (r&&r.chainId!=null)?{chainIdS03:r.chainId}:{},
      (o&&o.simulHoldS03===true)?{simulHoldS03:true}:{}, (o&&o.simulFinalS03===true)?{simulFinalS03:true}:{})); },   /* S03-U449: 4th argument {simulHoldS03} / {simulFinalS03} brackets one simultaneous damage of both players */   /* S03-U267: chainIdS03 */
  recoverLP(p, amount){ trace(`recover: ${nameOf(p)} +${amount}`); act({type:"LP", player:p, delta:Math.abs(amount), cause:'recover'}); },
  payCost(p, amount){ trace(`payCost: ${amount}`); act({type:"LP", player:p, delta:-Math.abs(amount), cause:'cost'}); },
  /* --- System v18: LP変化の規則 --- */
  addLpRule(spec){ return addLpRuleV18(spec||{}); },
  clearLpRules(label){ return clearLpRulesV18(label); },
  lpRuleHits(label){ return lpRuleHitsV18(gameState, label); },
  lpRules(){ return lpRulesV18(gameState).slice(); },
  /* --- System v19: 発動された効果の性質（解決結果ではない） --- */
  effectCategories(x){ return effectCategoriesOfLinkV19(gameState, x); },
  effectHasCategory(x, cat){ return linkHasCategoryV19(gameState, x, cat); },
  activationTargets(x){ return linkTargetsV19(gameState, x); },
  /* --- System v20: 確認と公開とデッキ操作 ---
     inspect は自分だけが見る。state を変えず、相手側にも残さない。
     reveal は見せた事自体が状態なので Action で記録する。 */
  inspect(viewer, targets, label){
    const list=(Array.isArray(targets)?targets:[targets]).map(t=>resolveTarget(t)||t).filter(h=>h&&h.card);
    trace(`inspect: ${list.length}枚`);
    return inspectV20(gameState, viewer, list, label);
  },
  deckTop(p, n){ return deckTopHandlesV20(gameState, p, n); },
  reveal(spec){
    const s=spec||{};
    const uids=(s.cards||[]).map(t=>{const r=resolveTarget(t)||t; return r&&r.card?ensureCardUid(gameState,r.card):null;}).filter(u=>u!=null);
    trace(`reveal: ${s.zone||uids.length+'枚'}`);
    act({type:"REVEAL_ADD_V20", rec:{player:s.player, audience:s.audience, uids, zone:s.zone||null,
      label:s.label||'', until:s.until||'resolution', remaining:s.remaining, endPhaseOf:s.endPhaseOf,
      sourceUid:(s.sourceUid!=null)?s.sourceUid:null, on:s.on||null}});
    const list=revealListV20(gameState);
    return list.length ? list[list.length-1].id : null;
  },
  unreveal(id){ act({type:"REVEAL_REMOVE_V20", id}); },
  isRevealedTo(uid, player){ return isRevealedToV20(gameState, uid, player); },
  revealObligation(player, on){ return revealObligationV20(gameState, player, on); },
  /* --- System v21: 破壊耐性 ---
     防ぐのは破壊だけ。対象耐性とは無関係。 */
  grantProtection(t, spec){
    const r=resolveTarget(t)||t; if(!r||!r.card){ trace('grantProtection: 対象が無い',false); return; }
    ensureCardUid(gameState,r.card);
    trace(`grantProtection: ${labelOf(r.card)}`);
    act({type:"PROT_GRANT_V21", player:r.p, zone:r.zone, index:r.index,
         grant:Object.assign({},spec||{})});
  },
  clearProtection(t, key){
    const r=resolveTarget(t)||t; if(!r||!r.card) return;
    act({type:"PROT_CLEAR_V21", player:r.p, zone:r.zone, index:r.index, key:key||null});
  },
  protectionRecord(t, ctx){
    const r=resolveTarget(t)||t; if(!r||!r.card) return null;
    return protectionRecordV21(gameState, r.card, ctx||{cause:'effect'});
  },
  protectionUsed(t, key){
    const r=resolveTarget(t)||t; if(!r||!r.card) return 0;
    return protUsedCountV21(gameState, r.card, key||'self');
  },
  /* --- System v22: カウンター --- */
  counterCapable(t, kind){
    const r=resolveTarget(t)||t; if(!r||!r.card) return false;
    return counterCapableV22(r.card, kind);
  },
  counterCapableCards(player, kind, faceUpOnly){
    return counterCapableCardsV22(gameState, player, kind, faceUpOnly);
  },
  counterUnits(player, kind, filter){
    return counterUnitsV22(gameState, player, kind, filter);
  },
  counterTotal(player, kind, filter){
    return counterTotalV22(gameState, player, kind, filter);
  },
  counterLimit(t, kind){
    const r=resolveTarget(t)||t; if(!r||!r.card) return null;
    return counterLimitV22(r.card, kind);
  },
  removeCounterSpread(uids, kind, reason){
    trace(`removeCounterSpread: ${kind||'魔力'}×${(uids||[]).length}`);
    act({type:"COUNTER_SPREAD_REMOVE_V22", uids:(uids||[]).slice(), kind, reason});
  },
  placeCounterSpread(uids, kind, reason){
    trace(`placeCounterSpread: ${kind||'魔力'}×${(uids||[]).length}`);
    act({type:"COUNTER_SPREAD_PLACE_V22", uids:(uids||[]).slice(), kind, reason});
  },
  revealedCards(player){ return revealedCardsV20(gameState, player); },
  orderToDeck(player, uids, toBottom, reason){
    act({type:"DECK_ORDER_V20", player, uids:(uids||[]).slice(), toBottom:!!toBottom, reason});
  },
  shuffleFaceDown(player, reason){ act({type:"FACEDOWN_SHUFFLE_V20", player, reason}); },
  negateAttack(reason){
    const a=gameState.pendingAttack; if(!a){trace('negateAttack: 攻撃宣言がありません',false);return;}
    trace(`negateAttack: ${reason||'効果'}`);
    act({type:'NEGATE_ATTACK_V45',player:a.player,attackerUid:a.attackerUid,targetUid:a.targetUid,reason});
  },
  /* コントロール奪取（強奪など）。場のカードを相手の場へ移す */
  /* コントロール変更。until:'endPhase' を渡すとエンドフェイズに戻る。 */
  /* S03-U117: restrict = {noAttack, noTribute}（精神操作「攻撃宣言できず、リリースできない」）。省略時は制限なし。 */
  changeControl(t, toPlayer, reason, until, sourceTarget, restrict){
    const r = resolveTarget(t);
    if(!r){ trace(`changeControl: 対象が場にない`, false); return; }
    /* System v26: どのカードが移したのかをイベントへ伝える（任意）。 */
    let srcUid = null;
    if(sourceTarget){
      const sr = resolveTarget(sourceTarget) || sourceTarget;
      if(sr && sr.card) srcUid = ensureCardUid(gameState, sr.card);
    }
    trace(`changeControl: ${labelOf(r.card)} → ${nameOf(toPlayer)}`);
    const fx = {type:"FX_CONTROL", player:r.p, zone:r.zone, index:r.index,
         toPlayer, reason, until, sourceUid:srcUid};
    if(until === 'endPhase') fx.restrictS03 = {noAttack:!!(restrict && restrict.noAttack), noTribute:!!(restrict && restrict.noTribute)};
    act(fx);
  },
  /* --- System v26: コントロールの source 連動寿命と原子的交換 --- */
  /* 「this source が失効したら controlled を元のコントローラへ戻す」を宣言する。
     opts.onFaceDown が true なら、source が裏側になっただけでも戻る
     （「表側表示で存在する限り」のテキストはこちら）。
     linkV9 を直接書かずに済むよう、ここで包む。 */
  linkControlReturn(controlledTarget, sourceTarget, opts){
    const me = resolveTarget(controlledTarget) || controlledTarget;
    const src = resolveTarget(sourceTarget) || sourceTarget;
    if(!me || !me.card || !src || !src.card) return false;
    const o = opts || {};
    const back = (o.returnTo === 0 || o.returnTo === 1)
      ? o.returnTo
      : ((me.card.owner === 0 || me.card.owner === 1) ? me.card.owner : (me.p === 0 ? 1 : 0));
    ensureCardUid(gameState, me.card); ensureCardUid(gameState, src.card);
    trace(`linkControlReturn: ${labelOf(me.card)} ← ${labelOf(src.card)}`);
    act({type:'LINK_ADD_V9', player:me.p, zone:me.zone, index:me.index,
         watchUid:src.card.uid, onGone:'controlReturn',
         onFaceDown:(o.onFaceDown !== false), returnTo:back,
         label:o.label || 'コントロールの返却'});
    return true;
  },
  /* 両方のモンスターゾーンが満杧でも成立する原子的な入れ替え。 */
  swapControl(aTarget, bTarget, reason, sourceTarget){
    const ra = resolveTarget(aTarget) || aTarget;
    const rb = resolveTarget(bTarget) || bTarget;
    if(!ra || !ra.card || !rb || !rb.card){ trace('swapControl: 対象が揃っていない',false); return false; }
    if(ra.zone !== 'mz' || rb.zone !== 'mz'){ trace('swapControl: モンスターゾーンだけを扱う',false); return false; }
    if(ra.p === rb.p){ trace('swapControl: 同じ側どうしは入れ替えられない',false); return false; }
    if(ra.card === rb.card){ trace('swapControl: 同じカードは選べない',false); return false; }
    ensureCardUid(gameState, ra.card); ensureCardUid(gameState, rb.card);
    let srcUid = null;
    if(sourceTarget){
      const sr = resolveTarget(sourceTarget) || sourceTarget;
      if(sr && sr.card) srcUid = ensureCardUid(gameState, sr.card);
    }
    trace(`swapControl: ${labelOf(ra.card)} ⇄ ${labelOf(rb.card)}`);
    act({type:'CONTROL_SWAP_V26', aPlayer:ra.p, aIndex:ra.index, aUid:ra.card.uid,
         bPlayer:rb.p, bIndex:rb.index, bUid:rb.card.uid, reason, sourceUid:srcUid});
    return true;
  },

  /* --- チェーン --- */
  addChainLink(p, card, name, ss, zone, index){
    trace(`addChainLink: ${name} (SS${ss})`);
    act({type:"CHAIN_ADD", player:p, cardId:card?card.id:0, name, ss, from:zone, index});
  },
  resolveChainLink(){ trace(`resolveChainLink`); act({type:"CHAIN_RESOLVE_TOP"}); },
  /* --- 発動待ち・予約 --- */
  registerPendingEffect(p, name, note){ trace(`pending: ${name}`); act({type:"PENDING_ADD", player:p, name, note}); },
  registerReserveEffect(p, name, at, note, opts){
    trace(`reserve: ${name}@${at}`);
    act(Object.assign({type:"RESERVE_ADD", player:p, name, at, note}, opts||{}));
  },
  /* --- フラグ --- */
  setFlag(p, key, val, temporary){
    act({type:'PLAYER_FLAG_SET_V42',player:p,key,value:val,temporary:!!temporary});
  },
  getFlag(p, key){
    const P = gameState.players[p];
    return P.effectFlags[key] ?? P.temporaryFlags[key];
  },
  /* --- 選択（v4.9 P1: ChoiceRequest プリミティブ） ---------------------
     requestChoice が P1移行済み（replay-safe）の正規経路。
     解決の続きは registerChoiceHandlerV49() で登録した handler 名 +
     JSON引数で表現するので、保存・リロード・Undo/Redo を跨げる。       */
  requestChoice(spec){
    return requestChoiceV49(spec||{});
  },
  registerChoiceHandler(name, fn){ return registerChoiceHandlerV49(name, fn); },
  answerChoice(keys){ return answerChoiceV49(keys); },
  cancelChoice(){ return cancelChoiceV49(); },
  /* CODEX-C03: common target-immunity consumers use the same source-aware
     filter as API.selectCard / ChoiceRequest. */
  targetEffectInfoS03(byPlayer){
    return (typeof targetEffectSourceS03==='function') ? targetEffectSourceS03(byPlayer) : {player:byPlayer};
  },
  targetableCardsS03(candidates, byPlayer){
    return (typeof filterTargetable==='function') ? filterTargetable(candidates||[], byPlayer) : (candidates||[]);
  },

  /* --- 以下は legacy 互換層 --------------------------------------------
     onPick がクロージャなのでレジストリ化できない。シグネチャ互換のため
     残すが「P1移行済み」には数えない。
     legacy でも ChoiceRequest を経由するので、選択待ちが gameState に載り
     CHOICE_OPEN/ANSWER が Journal に記録される点は改善される。
     ただし継続はクロージャのままなので保存・リロードを跨げない。      */
  selectCard(title, candidates, onPick, note, opts){
    /* S03-U130: DUEL の発動準備（prepareDuelActivation）では ACTIVE_SCRIPT が無いため、targets:true のスクリプトでも対象耐性
       （オベリスクの巨神兵、永続効果の immuneToTarget、ダーク・フュージョン等）が候補から除かれていなかった。
       発動準備中のカード（ACTIVATION_PREP_S03）のスクリプトも見る。対象を取るプレイヤーも渡す。 */
    const prepS03 = (!ACTIVE_SCRIPT && typeof ACTIVATION_PREP_S03!=='undefined') ? ACTIVATION_PREP_S03 : null;
    const prepScS03 = prepS03 ? CARD_SCRIPTS[prepS03.name] : null;
    /* S03-U474: 選択の「段階」。opts.selection（'cost' | 'effect'）の明示が優先、無ければ発動準備がコストを払っている間（engine/1ZZW）は 'cost'。
       コストの選択はスクリプトが targets:true でも対象を取る選択ではない（対象耐性を掛けない）。requestChoiceV49 が記録 selection に残す。 */
    const selectionS03 = (opts && opts.selection != null) ? selectionKindS03(opts.selection)
      : ((typeof selectionPhaseS03 === 'function' && selectionPhaseS03() === 'cost') ? 'cost' : 'effect');
    const targeting = selectionS03 !== 'cost' && !!((ACTIVE_SCRIPT && ACTIVE_SCRIPT.targets === true) || (prepScS03 && prepScS03.targets === true));
    const targetingPlayer = prepS03 ? prepS03.player : ((typeof P3_EFFECT_CONTEXT!=='undefined' && P3_EFFECT_CONTEXT) ? P3_EFFECT_CONTEXT.player : null);
    trace(`selectCard(legacy): ${(candidates||[]).length}件`);
    const ok = requestChoiceV49({
      kind:'card', title, note, candidates, min:1, max:1,
      targeting, targetingPlayer, selection:selectionS03, cancelable:true,
      /* S03-U150: the effect's controller answers (was the turn player — e.g. 立ちはだかる強敵 in the opponent's turn) */
      player: legacyChooserS03(),
      legacy:{ onPick:(picked)=>{
        if(!picked) return;
        trace(`選択: ${picked.card?labelOf(picked.card):picked.label}`);
        onPick(picked);
      }},
      meta:{ scriptName: ACTIVE_SCRIPT ? ACTIVE_SCRIPT.name : null }
    });
    if(!ok) render();
    return ok;   /* S03-U471: 候補不足で断った時は false（明示の合図は CHOICE_INSUFFICIENT_SEQ_S03 にも立つ） */
  },
  selectPlayer(title, onPick){
    requestChoiceV49({
      kind:'player', title, min:1, max:1, cancelable:true, player: legacyChooserS03(),   /* S03-U150 */
      candidates:[0,1].map(p=>({key:'p'+p, label:nameOf(p), sub:'', value:p})),
      legacy:{ onPick:(picked)=>{ if(picked) onPick(picked.value); } }
    });
  },
  selectZone(title, p, zones, onPick){
    requestChoiceV49({
      kind:'zone', title, min:1, max:1, cancelable:true, player: legacyChooserS03(),   /* S03-U150 */
      candidates:(zones||[]).map((z,i)=>({key:'z'+i, label:zoneJp(z), sub:'', value:z})),
      legacy:{ onPick:(picked)=>{ if(picked) onPick(picked.value); } }
    });
  },
  confirm(title, message, onYes, onNo){
    requestChoiceV49({
      kind:'yesno', title, note:message, min:1, max:1, cancelable:false, player: legacyChooserS03(),   /* S03-U150 */
      candidates:[{key:'yes', label:'はい', value:true},
                  {key:'no',  label:'いいえ', value:false}],
      legacy:{ onPick:(picked)=>{
        if(picked && picked.key==='yes'){ if(onYes) onYes(); }
        else { if(onNo) onNo(); }
      }}
    });
  },
  /* --- P1.1 Activation-time Choice -------------------------------------
     宣言はP1 ChoiceRequest、対象は既存link.targets、モードはv4EffectKeyを使う。 */
  declare(ctx, kind, options, resume){
    return requestDeclarationV11(ctx,kind,options||{},resume||null,null);
  },
  declared(ctx, kind){ return declaredValueV11(ctx,kind,gameState); },
  persistDeclaration(cardOrTarget, kind, value){
    const c=(cardOrTarget&&cardOrTarget.card)?cardOrTarget.card:cardOrTarget;
    if(!c) return false;
    ensureCardUid(gameState,c);
    act({type:'DECLARE_V11',player:c.controller!=null?c.controller:gameState.activePlayer,kind,value,persistUid:c.uid});
    return true;
  },
  persistentDeclaration(cardOrTarget, kind){
    const c=(cardOrTarget&&cardOrTarget.card)?cardOrTarget.card:cardOrTarget;
    return persistentDeclarationValueV11(c,kind);
  },
  recordActivationCost(ctx, kind, targets, fields, amount){
    return recordActivationCostV11(ctx,kind,targets,fields,amount);
  },
  activationCosts(ctx, kind){ return activationCostsV11(ctx,kind,gameState); },
  chainLinkTargets(chainId){ return chainLinkTargetsV11(chainId,gameState); },
  clearActivationContext(player){ clearActivationChoiceV11(player); },
  /* --- P3 Provenance（第1弾: summon / cost snapshot / move） -----------
     provenance は「由来metadata」だけを扱う。イベント発火条件は変更しない。 */
  recordCostSnapshot(cardOrTarget, fields){
    const c = (cardOrTarget && cardOrTarget.card) ? cardOrTarget.card : cardOrTarget;
    if(!c) return null;
    ensureCardUid(gameState, c);
    return recordCostSnapshotV3(c, fields||['atk'], gameState);
  },
  costSnapshots(ctx){
    const link = ctx && ctx.chainId!=null
      ? (gameState.chain||[]).find(x=>x && x.chainId===ctx.chainId)
      : (gameState.chain||[])[gameState.chain.length-1];
    const onLink = costSnapshotsOfChainLinkV3(link);
    if(onLink.length) return onLink;
    /* チェーンリンクを作らない発動（DUELモード外・チェーンに乗らない処理）でも
       自分が払ったコストを読めるようにする。バッファはスクリプト開始時に
       毎回クリアされるので、別の効果のコストが混ざることはない。 */
    return Array.isArray(gameState.pendingCostSnapshots) ? gameState.pendingCostSnapshots.slice() : [];
  },
  summonProvenance(cardOrTarget){
    const c = (cardOrTarget && cardOrTarget.card) ? cardOrTarget.card : cardOrTarget;
    return summonProvenanceOfV3(c);
  },
  materialSnapshots(cardOrTarget){
    const c = (cardOrTarget && cardOrTarget.card) ? cardOrTarget.card : cardOrTarget;
    return materialSnapshotsOfV3(c);
  },
  usedAsMaterial(cardOrTarget, summonType){
    const c = (cardOrTarget && cardOrTarget.card) ? cardOrTarget.card : cardOrTarget;
    return wasUsedAsMaterialV3(c, summonType);
  },
  /* 「この素材は、その召喚の素材だったか」。同一uidの再召喚を区別する。 */
  usedAsMaterialFor(materialCardOrTarget, summonedCardOrTarget, summonType){
    const m = (materialCardOrTarget && materialCardOrTarget.card) ? materialCardOrTarget.card : materialCardOrTarget;
    const x = (summonedCardOrTarget && summonedCardOrTarget.card) ? summonedCardOrTarget.card : summonedCardOrTarget;
    return usedAsMaterialForSummonV3(m, x, summonType);
  },
  moveProvenance(cardOrTarget){
    const c = (cardOrTarget && cardOrTarget.card) ? cardOrTarget.card : cardOrTarget;
    return moveProvenanceOfV3(c);
  },
  movedByOpponentEffect(cardOrTarget, myPlayer){
    const c = (cardOrTarget && cardOrTarget.card) ? cardOrTarget.card : cardOrTarget;
    return movedByOpponentEffectV3(c, myPlayer);
  },
  /* --- Ritual（System v5） -------------------------------------------
     儀式魔法1枚を書くのに必要なのはこの3本だけ。素材選択・レベル判定・
     支払い・召喚・provenance は共通機構が行う。 */
  ritualCanActivate(player, spellName){ return ritualCanActivateV5(player, spellName); },
  ritualSummon(ctx, spellName){
    const self = ctx && ctx.card;
    if(self) ensureCardUid(gameState, self);
    return ritualStartV5(ctx.player, spellName, self ? self.uid : null);
  },
  ritualProvenance(cardOrTarget){
    const c = (cardOrTarget && cardOrTarget.card) ? cardOrTarget.card : cardOrTarget;
    return ritualProvenanceOfV5(c);
  },
  /* --- Battle（System v6） -------------------------------------------
     既存の continuous.cannotAttack / battleDamage / piercingDamage /
     canDirectAttack / grantAdditionalAttack / negateAttack は従来どおり。
     ここに足すのは「既存 hook で書けなかった」ものだけ。 */
  grantDirectAttack(t){ const r=resolveTarget(t)||locateCardAnyV4(t&&t.card?t.card:t);
    if(!r||!r.card) return false; ensureCardUid(gameState,r.card);
    act({type:'BATTLE_GRANT_V6',player:r.p,uid:r.card.uid,grant:'direct'}); return true; },
  grantMultiAttack(t){ const r=resolveTarget(t)||locateCardAnyV4(t&&t.card?t.card:t);
    if(!r||!r.card) return false; ensureCardUid(gameState,r.card);
    act({type:'BATTLE_GRANT_V6',player:r.p,uid:r.card.uid,grant:'multi'}); return true; },
  lockAttackTarget(t){ const r=resolveTarget(t)||locateCardAnyV4(t&&t.card?t.card:t);
    if(!r||!r.card) return false; ensureCardUid(gameState,r.card);
    act({type:'BATTLE_GRANT_V6',player:r.p,uid:r.card.uid,grant:'lock',targetUid:r.card.uid}); return true; },
  /* 宣言済みの攻撃を別の対象へ差し替える（ルール処理。System Replay とは無関係）。 */
  redirectAttack(spec){
    if(!canRedirectAttackV6(gameState)) return false;
    const a=gameState.pendingAttack;
    if(spec&&spec.toDirect){
      if(a) act({type:'ATTACK_PENDING_RETARGET_S03',targetUid:null,defenderSnapshot:defenderSnapshotV28(a.player),redirectV6:{toDirect:true}});
      else act({type:'BATTLE_REDIRECT_V6',toDirect:true});
      return true;
    }
    const uid=(spec&&spec.targetUid!=null)?spec.targetUid:null;
    const h=(uid!=null)?findCardByUid(uid):null;
    if(!h||h.zone!=='mz') return false;
    if(a) act({type:'ATTACK_PENDING_RETARGET_S03',targetUid:uid,defenderSnapshot:defenderSnapshotV28(a.player),redirectV6:{targetUid:uid}});
    else act({type:'BATTLE_REDIRECT_V6',targetUid:uid});
    return true;
  },
  battleContext(){ return currentBattleIdentityV6(gameState); },
  attackersAgainst(cardOrTarget){
    const c=(cardOrTarget&&cardOrTarget.card)?cardOrTarget.card:cardOrTarget;
    return (c&&c.uid!=null)?attackersAgainstV6(gameState,c.uid):[]; },
  battledThisPhase(cardOrTarget){
    const c=(cardOrTarget&&cardOrTarget.card)?cardOrTarget.card:cardOrTarget;
    return (c&&c.uid!=null)?battledThisPhaseV6(gameState,c.uid):false; },
  battleDestroyedThisPhase(){ return battleDestroyedThisPhaseV6(gameState); },
  lastBattleContext(){ return battleIdentityV6(gameState); },
  /* S03-U152: really ends the Battle Phase (engine/1ZS); it used to mark it and clear the battle only */
  endBattlePhase(reason){ return endBattlePhaseByEffectS03(reason||'効果'); },
  skipNextBattlePhase(p){ act({type:'BATTLE_PHASE_V6',player:p,mode:'skipNext'}); },
  repeatBattlePhase(p,n){ act({type:'BATTLE_PHASE_V6',player:p,mode:'repeat',n:n||1}); },
  canDirectAttackNow(cardOrTarget){
    const c=(cardOrTarget&&cardOrTarget.card)?cardOrTarget.card:cardOrTarget;
    return canDirectAttackThroughMonstersV51(c); },
  /* --- Delayed / Scheduled（System v7） ------------------------------
     既存の reserved（同一ターンのエンドフェイズ限定）は触らない。
     ここはターンをまたぐ汎用予約だけを扱う。 */
  schedule(spec){
    const at=spec&&spec.at, handler=spec&&spec.handler;
    if(!at||!handler) return false;
    const player=(spec.player===0||spec.player===1)?spec.player:gameState.activePlayer;
    const turns=(spec.ownTurn===true)?turnsUntilOwnTurnV7(gameState,player):(Number(spec.turns)||0);
    const src=spec.source&&spec.source.card?spec.source.card:spec.source;
    if(src) ensureCardUid(gameState,src);
    act({type:'SCHEDULE_ADD_V7',player,at,turnAbs:scheduleTurnAbsV7(gameState,turns),
         handler,args:spec.args||{},
         sourceUid:src?src.uid:null,sourceZone:spec.sourceZone||null,note:spec.note||''});
    return true;
  },
  cancelSchedule(ids){ act({type:'SCHEDULE_REMOVE_V7',ids:[].concat(ids||[])}); },
  schedules(handler){ return schedulesOfV7(gameState,handler); },
  scheduleSourceAlive(entry){ return scheduleSourceAliveV7(entry); },
  registerScheduleHandler(name,fn){ return registerScheduleHandlerV7(name,fn); },
  /* フェイズのスキップ。turns は 0=このターン / 1=次のターン / 2=次の自分のターン */
  skipPhase(player,phase,turns,count){
    act({type:'PHASE_SKIP_V7',player,phase,
         turnAbs:scheduleTurnAbsV7(gameState,Number(turns)||0),count:count||1});
  },
  skipOwnPhase(player,phase,count){
    act({type:'PHASE_SKIP_V7',player,phase,
         turnAbs:scheduleTurnAbsV7(gameState,turnsUntilOwnTurnV7(gameState,player)),count:count||1});
  },
  phaseSkipped(player,phase){ return phaseSkippedV7(gameState,player,phase); },
  /* ラベル指定で攻守修正を外す（期限をスケジューラが持つ場合に使う） */
  clearModsByLabel(t,label){
    const r=resolveTarget(t)||locateCardAnyV4(t&&t.card?t.card:t);
    if(!r) return false;
    act({type:'MOD_CLEAR_LABEL_V7',player:r.p,zone:r.zone,index:r.index,label}); return true;
  },
  /* --- Draw event（System v8） ---------------------------------------
     「ドローしたカードが◯◯だった場合」「この効果でドローしたカード」用。 */
  lastDraw(){ return lastDrawV8(gameState); },
  lastDrawCards(){ return lastDrawCardsV8(gameState); },
  lastDrawByEffect(player){ return lastDrawByEffectV8(gameState, player); },
  drawnCardOf(evt){ return drawnCardOfV8(evt); },
  drawOutsideDrawPhase(evt){ return drawOutsideDrawPhaseV8(evt); },
  /* 通常ドローと区別して効果ドローを行う（既定は byEffect:true） */
  drawNormal(p, n){ act({type:'DRAW', player:p, n:n||1, byEffect:false}); },
  /* --- Leave field / linked lifecycle（System v9） --------------------
     「フィールドから離れた時」と、カード同士の生存リンク。 */
  linkOnLeave(selfTarget, watchedTarget, onGone, label){
    const me=resolveTarget(selfTarget)||locateCardAnyV4(selfTarget&&selfTarget.card?selfTarget.card:selfTarget);
    const it=resolveTarget(watchedTarget)||locateCardAnyV4(watchedTarget&&watchedTarget.card?watchedTarget.card:watchedTarget);
    if(!me||!it||!me.card||!it.card) return false;
    ensureCardUid(gameState,me.card); ensureCardUid(gameState,it.card);
    act({type:'LINK_ADD_V9',player:me.p,zone:me.zone,index:me.index,
         watchUid:it.card.uid,onGone:onGone||'destroy',label:label||''});
    return true;
  },
  /* 相互リンク（片方が離れたらもう片方も、という組） */
  linkMutual(aTarget,bTarget,spec){
    const s=spec||{};
    const okA=API.linkOnLeave(aTarget,bTarget,s.aOnGone||'destroy',s.label||'');
    const okB=API.linkOnLeave(bTarget,aTarget,s.bOnGone||'destroy',s.label||'');
    return okA&&okB;
  },
  clearLink(selfTarget){
    const me=resolveTarget(selfTarget)||locateCardAnyV4(selfTarget&&selfTarget.card?selfTarget.card:selfTarget);
    if(!me) return false;
    act({type:'LINK_CLEAR_V9',player:me.p,zone:me.zone,index:me.index}); return true;
  },
  linkState(cardOrTarget){
    const c=(cardOrTarget&&cardOrTarget.card)?cardOrTarget.card:cardOrTarget;
    return linkStateV9(c);
  },
  leavingCardOf(evt){ return leavingCardOfV9(evt); },
  leftOwnField(evt,player){ return leftOwnFieldV9(evt,player); },
  /* ---- System v10: 表示形式 ---- */
  /* 効果で裏側から表側にする。リバース効果のために onFlip も発火させる。 */
  flipFaceUpByEffect(t, pos, reason){ const r=resolveTarget(t); if(!r) return false;
    if(r.zone!=='mz' || r.card.face!=='down') return false;
    trace(`flipFaceUpByEffect: ${labelOf(r.card)}`);
    act({type:"FX_SET_STATE", player:r.p, zone:r.zone, index:r.index,
         face:'up', pos:pos||r.card.pos||'atk', reason:reason||'効果で表側表示に', v10FlipEffect:true});
    return true; },
  positionChangedCard(evt){ return positionChangedCardV10(evt); },
  turnedToFaceUpDefense(evt){ return turnedToFaceUpDefenseV10(evt); },
  turnedFaceUp(evt){ return turnedFaceUpV10(evt); },
  forcedPositionOf(cardOrTarget){
    const r=resolveTarget(cardOrTarget); const c=r?r.card:cardOrTarget;
    return forcedPositionForV10(c); },
  cannotChangePosition(cardOrTarget){
    const r=resolveTarget(cardOrTarget); const c=r?r.card:cardOrTarget;
    return cannotChangePositionV10(c); },
  log(msg){ logIt(gameState, msg); },
};
let CFM_YES=null, CFM_NO=null;
function __cfmYes(){ const f=CFM_YES; CFM_YES=CFM_NO=null; closeSheet(); if(f) f(); }
function __cfmNo(){  const f=CFM_NO;  CFM_YES=CFM_NO=null; closeSheet(); if(f) f(); }

/* =========================================================================
   カードスクリプト定義
   condition / selectTargets / resolve / afterResolve / passive
   ========================================================================= */
const CARD_SCRIPTS = {};
/* 登録ヘルパ。name をキーにする（このアプリはカード名で引くため） */
function defineScript(name, def){
  const sc = Object.assign({name}, def);
  /* S03-U114: detachCostS03 を宣言し cost を持たないスクリプトは、cost() を直接呼ばれても同じ素材選択で払う
     （発動パイプラインは cost より先に detachCostS03 を処理する。これは cost を直接使う経路との整合用）。 */
  if(sc.detachCostS03 && typeof sc.cost!=='function'){
    sc.cost = function(ctx, done){
      const spec = (typeof detachCostSpecS03==='function') ? detachCostSpecS03(CARD_SCRIPTS[name]||sc, name, ctx) : null;
      /* S03-U120: detachCostS03 が関数で null を返した = この発動にはX素材のコストが無い（No.39 希望皇ホープ②） */
      if(!spec){ done(typeof (CARD_SCRIPTS[name]||sc).detachCostS03==='function'); return; }
      if(typeof runScriptDetachCostS03!=='function'){ done(false); return; }
      runScriptDetachCostS03(ctx, spec, ok=>done(ok!==false));
    };
  }
  CARD_SCRIPTS[name] = sc;
}

/* 自身を墓地へ送る標準の後処理（通常魔法・通常罠） */
function selfToGrave(ctx){
  if(!ctx.zone || ctx.keep) return;
  // 効果処理中に他のカードが場を離れると添字がずれるので、
  // 記録しておいたカード実体を探し直してから墓地へ送る。
  const P = gameState.players[ctx.player];
  let idx = ctx.index;
  if(ctx.card){
    const arr = ctx.zone==='field' ? (P.field?[P.field]:[]) : (P[ctx.zone]||[]);
    const found = arr.indexOf(ctx.card);
    if(found >= 0) idx = found;
    else {
      // 実体が見つからない＝既に場を離れている
      trace(`afterResolve: 自身は既に場にない`);
      return;
    }
  }
  trace(`afterResolve: 自身を墓地へ`);
  act({type:"FX_SELF_TO_GRAVE", player:ctx.player, zone:ctx.zone, index:idx});
}

/* ---- スクリプト実行（発動条件 → 対象選択 → 解決 → 後処理） ---- */
function runScript(name, p, zone, index, opts){
  const sc = CARD_SCRIPTS[name];
  if(!sc) return false;
  const P = gameState.players[p];
  const card = zone ? zoneCard(P, zone, index) : null;
  const ctx = makeContext(p, card, zone, index, "activate", opts||{});
  ACTIVE_SCRIPT = sc;                  // 対象耐性の判定に使う
  p3BeginEffectContextV3(p, card, name); // P3 / CODEX-C03: controller and source identity
  beginCostSnapshotsV3(gameState);     // P3: コストsnapshotのバッファを毎回空にする
  SCRIPT_ZONE = zone;                  // 「墓地で発動する効果」の判定に使う
  beginResolve(name);                  // 中断したときに巻き戻す位置を覚える
  traceStart(name);
  // カウンター罠の発動を通知する（豊穣のアルテミス等が反応する）
  if(dbOf(card).sub === 'カウンター') emitEvent("onCounterTrap", {player:p, name});

  /* EDOPro に倣った処理順：
     発動条件 → 回数制限 → コスト → 対象選択 → チェーン確認 → 解決 → 後処理 */
  const finish = ()=>{
    if(sc.afterResolve) sc.afterResolve(ctx); else selfToGrave(ctx);
    trace(`解決終了`);
    ACTIVE_SCRIPT = null; p3EndEffectContextV3();
    SCRIPT_PHASE = null;
    SCRIPT_ZONE = null;
    endResolve();
    render();
    runChainAfter();               // チェーンから呼ばれていれば後始末する
  };
  const doResolve = ()=>{ SCRIPT_PHASE = 'resolve'; sc.resolve(ctx); SCRIPT_PHASE = null; finish(); };
  const doTarget = ()=>{
    if(sc.selectTargets){
      sc.selectTargets(ctx, (targets)=>{
        ctx.selectedTargets = targets||[];
        trace(`対象確定：${ctx.selectedTargets.map(t=>t&&t.card?labelOf(t.card):'—').join("、")||"なし"}`);
        confirmTargets(ctx, name, doResolve);
      });
    } else {
      confirmTargets(ctx, name, doResolve);
    }
  };
  /* コストは対象より先に払う。払えなければ発動できない。 */
  const doCost = ()=>{
    const limitKey=countLimitEffectKeyV32(name,sc,ctx);
    const v44Count=countConsumePayloadV44(p,name,sc,card,limitKey);
    if(v44Count){
      if(typeof commitAutomaticActionV44==='function') commitAutomaticActionV44({type:'EFFECT_COUNT_CONSUME_V44',consume:v44Count});
      else countConsume(p,name,sc,card,limitKey);
    }
    /* S03-U114: 「X素材を取り除いて発動」は宣言（detachCostS03）から、取り除く素材をプレイヤーに選ばせる */
    const detachSpecRS=(typeof detachCostSpecS03==='function')?detachCostSpecS03(sc,name,ctx):null;
    if(detachSpecRS){
      trace(`コスト支払い（X素材）`);
      SCRIPT_PHASE = 'cost';
      runScriptDetachCostS03(ctx, detachSpecRS, ok=>{
        SCRIPT_PHASE = null;
        if(ok===false){ trace(`コストを払えない`, false); ACTIVE_SCRIPT=null; p3EndEffectContextV3(); SCRIPT_PHASE=null; SCRIPT_ZONE=null; endResolve(); showToast("コストを払えません"); render(); return; }
        doTarget();
      });
      return;
    }
    if(sc.cost){
      trace(`コスト支払い`);
      SCRIPT_PHASE = 'cost';
      sc.cost(ctx, (ok)=>{
        SCRIPT_PHASE = null;
        if(ok===false){ trace(`コストを払えない`, false); ACTIVE_SCRIPT=null; p3EndEffectContextV3(); SCRIPT_PHASE=null; SCRIPT_ZONE=null; endResolve(); showToast("コストを払えません"); render(); return; }
        doTarget();
      });
    } else {
      doTarget();
    }
  };
  const proceed = doCost;

  // 回数制限
  if(sc.countLimit && countLeft(p, name, sc, card, countLimitEffectKeyV32(name, sc, ctx)) <= 0){
    trace(`回数制限：${countLimitJp(sc)}まで`, false);
    ACTIVE_SCRIPT=null; p3EndEffectContextV3(); SCRIPT_PHASE=null; SCRIPT_ZONE=null; endResolve();
    showToast(`${name} は${countLimitJp(sc)}までです`);
    render();
    return true;
  }

  // 発動タイミング。窓が開いていなければ警告を出す
  const tm = timingCheck(sc);
  if(!tm.ok){
    trace(`発動タイミング NG：${tm.why}`, false);
    render();
    if(PLAY_MODE===PLAY_MODES.DUEL){
      ACTIVE_SCRIPT=null; p3EndEffectContextV3(); SCRIPT_PHASE=null; SCRIPT_ZONE=null; endResolve();
      showToast(tm.why); return true;
    }
    askForce(name, tm.why, proceed);
    return true;
  }

  // 発動条件。満たさなくても警告を出して手動発動できる（裁定はプレイヤーが判断）
  if(sc.condition){
    let ok=false;
    try{ ok = sc.condition(ctx); }catch(e){ ok=false; ctx.reason='条件判定でエラー'; }
    if(!ok){
      trace(`発動条件 NG：${ctx.reason||"条件を満たしていません"}`, false);
      render();
      if(PLAY_MODE===PLAY_MODES.DUEL){
        ACTIVE_SCRIPT=null; p3EndEffectContextV3(); SCRIPT_PHASE=null; SCRIPT_ZONE=null; endResolve();
        showToast(ctx.reason||"発動条件を満たしていません"); return true;
      }
      askForce(name, ctx.reason||"発動条件を満たしていません", proceed);
      return true;
    }
  }
  trace(`発動条件 OK`);
  proceed();
  return true;
}

/* =========================================================================
   発動タイミングの判定
   「召喚に成功した時」のように発動できる瞬間が決まっている効果は、
   その窓が開いている間だけ素直に発動できるようにする。
   窓が閉じていても askForce で強行できる（裁定はプレイヤーが判断する）。

   スクリプト側は timing で宣言する。省略時は passive のフックから推定する。
     'summon'      召喚・特殊召喚に成功した時
     'flip'        リバースした時
     'damageStep'  ダメージステップ中
     'counterTrap' カウンター罠が発動した時
     'mainPhase'   自分のメインフェイズ
     'standby'     スタンバイフェイズ
     'endPhase'    エンドフェイズ
     'free'        いつでも（制限なし）
   ========================================================================= */
const TIMING_JP = {
  summon:'モンスターの召喚・特殊召喚に成功した時',
  flip:'モンスターがリバースした時',
  attackDeclare:'攻撃宣言時',
  damageStep:'ダメージステップ中',
  counterTrap:'カウンター罠が発動した時',
  chain:'チェーン中',
  mainPhase:'自分のメインフェイズ',
  standby:'スタンバイフェイズ',
  endPhase:'エンドフェイズ',
  free:'いつでも',
};

/* スクリプトが発動できるタイミングの一覧 */
function scriptTimings(sc){
  if(sc.timing) return [].concat(sc.timing);
  const pv = sc.passive || {};
  const t = [];
  if(pv.onNormalSummon || pv.onSpecialSummon) t.push('summon');
  if(pv.onFlip)        t.push('flip');
  if(pv.onAttackDeclare) t.push('attackDeclare');
  if(pv.onDamageStep)  t.push('damageStep');
  if(pv.onCounterTrap) t.push('counterTrap');
  if(pv.onCardActivate || sc.type==='counter') t.push('chain');
  // 手札・墓地からの発動を宣言しているカードは起動効果も持つので制限しない
  if(sc.activateFrom && sc.activateFrom.length) t.push('free');
  if(pv.onSendToGrave) t.push('free');
  return t.length ? t : ['free'];
}

/* いま開いているタイミングの一覧 */
function currentTimings(){
  const gs = gameState;
  const out = ['free'];
  const w = gs.timingWindow;
  if(w && w.turn === gs.turn) out.push(w.kind);
  if(gs.battle) out.push('damageStep');
  if(gs.chain && gs.chain.length) out.push('chain');
  if(gs.phase === 'main1' || gs.phase === 'main2') out.push('mainPhase');
  if(gs.phase === 'standby') out.push('standby');
  if(gs.phase === 'end')     out.push('endPhase');
  return out;
}

/* このスクリプトを素直に発動できるか。駄目なら理由を返す。 */
function timingCheck(sc){
  const want = scriptTimings(sc);
  if(want.indexOf('free') >= 0) return {ok:true};
  const now = currentTimings();
  if(want.some(t=>now.indexOf(t) >= 0)) return {ok:true};
  const jp = want.map(t=>TIMING_JP[t] || t).join('、または');
  return {ok:false, why:`このカードは「${jp}」に発動します`};
}

/* 条件を満たさない時に「それでも発動する」かを尋ねる */
function askForce(name, reason, onYes){
  if(typeof notePromptOpenS03==='function') notePromptOpenS03();   /* S03-U37 */
  setTimeout(()=>{
    sheet.innerHTML = `<div class="grip"></div>
      <h3 style="margin-bottom:6px">${name}</h3>
      <div class="warn-note">${reason}</div>
      <div class="meta" style="margin-bottom:12px">
        タイミングや条件はアプリでは完全に判定できません。<br>
        正しいと判断できる場合はそのまま発動できます。</div>
      <div class="act-grid wide">
        <div class="act fx" onclick="__forceYes()">それでも発動する</div>
        <div class="act" onclick="__forceNo()">やめる</div>
      </div>`;
    FORCE_CB = onYes||null;
    veil.classList.add("on");
  }, 40);
}
let FORCE_CB=null;
function __forceYes(){ const f=FORCE_CB; FORCE_CB=null; if(typeof notePromptClosedS03==='function') notePromptClosedS03(); closeSheet(); if(f) f(); if(typeof settleActivationPrepS03==='function') settleActivationPrepS03(); }
function __forceNo(){ FORCE_CB=null; if(typeof notePromptClosedS03==='function') notePromptClosedS03(); if(typeof endActivationPrepS03==='function') endActivationPrepS03(); ACTIVE_SCRIPT=null; p3EndEffectContextV3(); SCRIPT_PHASE=null; SCRIPT_ZONE=null; endResolve(); closeSheet(); showToast("発動を取りやめました"); }

/* 対象を公開して、相手にチェーンの機会を与える */
function confirmTargets(ctx, name, onResolve){
  const foe = ctx.player===0?1:0;
  const foeN = ASK_CHAIN ? reactableCards(foe).length : 0;
  const tg = (ctx.selectedTargets||[]).filter(t=>t&&t.card);
  const tgHTML = tg.length
    ? `<div class="tg-reveal"><span class="tgr-lab">対象</span>${
        tg.map(t=>`<span class="tgr-card">${labelOf(t.card)}<small>${nameOf(t.p)}</small></span>`).join("")
      }</div>`
    : "";
  // 相手が撃てるものが無ければそのまま解決する
  if(!foeN){ if(tg.length) trace(`対象を公開`); onResolve(); return; }
  if(typeof notePromptOpenS03==='function') notePromptOpenS03();   /* S03-U37 */
  setTimeout(()=>{
    sheet.innerHTML = `<div class="grip"></div>
      <h3 style="margin-bottom:6px">${name} を発動</h3>
      ${tgHTML}
      <div class="meta" style="margin-bottom:10px">
        <b style="color:var(--trap)">${nameOf(foe)}</b> は発動できるカードを ${foeN}枚 持っています。<br>
        チェーンしますか？</div>
      <div class="act-grid wide">
        <div class="act" style="background:var(--trap);color:#120a1f;border-color:var(--trap)"
             onclick="closeSheet();openReactFor(${foe})">${nameOf(foe)}がチェーンする</div>
        <div class="act fx" onclick="__tgResolve()">チェーンしない（解決）</div>
      </div>`;
    TG_RESOLVE = onResolve;
    veil.classList.add("on");
  }, 40);
}
let TG_RESOLVE=null;
function __tgResolve(){ const f=TG_RESOLVE; TG_RESOLVE=null; if(typeof notePromptClosedS03==='function') notePromptClosedS03(); closeSheet(); if(f) f(); if(typeof settleActivationPrepS03==='function') settleActivationPrepS03(); }

/* =========================================================================
   イベントシステム
   イベント発火 → 該当スクリプトの passive を評価 → 候補提示
   ========================================================================= */
const EVENTS = [
  "onDraw","onSummon","onNormalSummon","onSpecialSummon","onSet","onFlip",
  "onAttackDeclare","onDamageStep","onBattleDestroy","onSendToGrave","onDiscard","onDestroy",
  "onRemove","onChainStart","onChainResolve","onEndPhase","onStandbyPhase",
  "onPhaseChange","onTurnStart","onTurnEnd","onLPChange","onTargetDeclared","onCardActivate",
  /* System v6: 戦闘ダメージとバトルフェイズ終了 */
  "onBattleDamage","onDirectBattleDamage","onBattlePhaseEnd",
  /* System v8: 引いたカード単位のドローイベントとサーチ */
  "onDrawCard","onAddToHand",
  /* System v9: 行き先を問わないフィールド離脱 */
  "onLeaveField",
  /* System v10: 表示形式の変更 */
  "onPositionChange",
  /* System v11: トークンの特殊召喚 */
  "onTokenSummon",
  /* System v12: カードの発動に成功した時 */
  "onActivateSuccess",
  /* System v15: 装備された時・装備が外れた時 */
  "onEquipAttached","onEquipDetached",
  /* System v22: カウンターが置かれた時・取り除かれた時 */
  "onCounterPlaced","onCounterRemoved",
  /* System v26: コントロールが移った時 */
  "onControlChange",
  /* S03-U238: レベルが上がった時 (engine/00 noteLevelUpS03) */
  "onLevelUpS03"
];

/* 発火候補を集める。場・手札・墓地のカードでハンドラを持つものを探す */
/* 直前に場へ出たモンスター。召喚イベントに乗せて「誰が召喚されたか」を伝える。 */
function lastSummonedCard(p){
  const mz = gameState.players[p].mz || [];
  return mz.length ? mz[mz.length-1] : null;
}

/* 召喚に反応する効果は、既定では「自分自身が召喚された場合」に限る。
   激流葬や奈落のように相手の召喚に反応するカードは
   スクリプトに onOtherSummon:true を宣言する。 */
/* リバース時の誘発は、リバースしたモンスター本人だけが対象。 */
function flipTriggerApplies(ctx, eventName, evt){
  if(eventName !== 'onFlip') return true;
  if(!evt || !evt.card) return true;
  /* S03-U225: a script that reacts to other monsters being flipped / Flip Summoned (グレイヴ・オージャ, アテナ) declares onOtherFlipS03 */
  const scS03 = (typeof CARD_SCRIPTS!=='undefined' && ctx.card) ? CARD_SCRIPTS[cardName(ctx.card)] : null;
  if(scS03 && scS03.onOtherFlipS03===true) return true;
  return ctx.card === evt.card;
}

const SUMMON_EVENTS = ['onNormalSummon','onSpecialSummon'];
function summonTriggerApplies(sc, ctx, eventName, evt){
  if(SUMMON_EVENTS.indexOf(eventName) < 0) return true;
  /* 'auto' は宣言テーブル由来。魔法・罠なら他のモンスターの召喚が起点、
     モンスターなら自分が召喚された場合に限る。カードデータの読み込み後に判定する。 */
  if(sc.onOtherSummon === 'auto') return dbOf(ctx.card).k !== 'm';
  if(sc.onOtherSummon) return true;              // 誰の召喚にも反応する
  if(evt && Array.isArray(evt.cards)) return evt.cards.indexOf(ctx.card)>=0;
  if(!evt || !evt.card) return true;             // 情報が無ければ従来どおり
  return ctx.card === evt.card;                  // 自分が召喚された場合のみ
}

function collectHandlers(eventName, evt){
  const out = [];
  [0,1].forEach(p=>{
    const P = gameState.players[p];
    const scan = (zone, arr)=>{
      (arr||[]).forEach((c,i)=>{
        if(!c) return;
        const nm = dbOf(c).n;
        const sc = CARD_SCRIPTS[nm];
        /* 宣告・警告などの「召喚を無効」は召喚成功後の誘発ではない。 */
        if(PLAY_MODE===PLAY_MODES.DUEL && sc && sc.summonNegate &&
           (eventName==='onNormalSummon'||eventName==='onSpecialSummon'||eventName==='onFlip')) return;
        const h  = sc && sc.passive && sc.passive[eventName];
        if(!h) return;
        /* S03-U203: a set Trap / Quick-Play Spell cannot be activated the turn it was set (as in the chain-response lists) */
        if((zone==='sz'||zone==='field') && c.face==='down' && c.setTurn===gameState.turn){ const dS03=dbOf(c); if(dS03.k==='t' || (dS03.k==='s' && dS03.sub==='速攻')) return; }
        /* S03-U18: 発動への応答（宣言したスクリプト）はチェーン応答で発動する。解決後の遅れた誘発としては出さない。 */
        if(eventName === 'onActivateSuccess' && typeof activationLateTriggerSuppressedS03==='function' && activationLateTriggerSuppressedS03(nm)) return;
        if(sc.countLimit && countLeft(p, nm, sc, c) <= 0) return;   // 使用済みは出さない
        /* リバース効果は「フィールドで発動した扱い」になる（1103当時裁定）。
           ②でリバースしたモンスターが⑤までに戦闘破壊されて墓地にあっても、
           フィールドにいるものとして条件を判定する。 */
        const asField = (eventName === 'onFlip' && evt && evt.treatAsField && evt.card === c);
        const extra={event:evt||{}};
        if(eventName==='onDamageStep'){
          const step=(evt&&evt.step)||((gameState.battle&&gameState.battle.step)||'leave');
          // 旧スクリプトは dsTiming 未指定を「戦闘破壊後（leave）」として実装している。
          if((sc.dsTiming||'leave')!==step) return;
          extra.step=step;
          extra.battle=(evt&&evt.battle)||battleContextV28();
          extra.battleOpponent=battleOpponentV28(c,extra.battle);
        }
        const ctx = makeContext(p, c, asField ? 'mz' : zone, i, eventName, extra);
        if(!summonTriggerApplies(sc, ctx, eventName, evt)) return;
        if(!flipTriggerApplies(ctx, eventName, evt)) return;
        /* S03-U04: 《ライオウ》等の封印中は、デッキから加える事が必須の任意誘発を候補に出さない。
           強制効果は blocksIfNoDeckToHand を宣言しないので発動し、加える処理だけ行わない。 */
        if(PLAY_MODE===PLAY_MODES.DUEL && triggerBlockedByDeckLockV32(sc, p, ctx)) return;
        // 条件を満たすものだけ候補にする。ここでは盤面を変更してはいけない。
        let ok = true;
        try{ ok = h(ctx); }catch(e){ ok = false; }
        /* S03-U09: DUEL では、選択した時と同じ発動可否（condition・回数制限・封印・罠無効など）を満たす誘発だけを候補にする。
           満たさない任意誘発は選んでも発動できず、強制誘発のグループはスキップできないためデュエルが止まる。
           選択時（eventPickV2）と同じ opts を使う。リバースを場として扱う場合は logicalZone を mz にする。 */
        /* S03-U10: 伏せた永続罠などの「カードの発動」は誘発効果ではないので SEGOC の候補にしない（チェーン応答から発動できる）。 */
        if(ok && PLAY_MODE===PLAY_MODES.DUEL && typeof cardActivationOnlyV32==='function' && cardActivationOnlyV32(nm, sc, dbOf(c), zone, c, {})) ok = false;
        if(ok && PLAY_MODE===PLAY_MODES.DUEL && typeof strictScriptLegalityV2==='function'){
          const L = strictScriptLegalityV2(nm, p, zone, i, {cardOverride:c, logicalZone:asField?'mz':zone,
            event:evt||{}, eventName, battle:extra.battle, step:extra.step, battleOpponent:extra.battleOpponent, ignoreTiming:true});
          if(!L.ok) ok = false;
        }
        if(ok) out.push(Object.assign({p, zone, index:i, card:c, name:nm, ctx, eventName, event:evt||{}}, asField?{logicalZoneS298:'mz'}:{}));   /* S03-U298: eventPickV2 judges the pick with the same logical zone */
      });
    };
    scan('mz', P.mz); scan('sz', P.sz);
    if(P.field) scan('field', [P.field]);
    scan('hand', P.hand); scan('grave', P.grave); scan('banish', P.banish);
    /* S03-U126: 「フィールド上から離れた時」— エクストラデッキへ戻ったカード（融合モンスターのバウンス等）の誘発も拾う。 */
    if(eventName==='onLeaveField') scan('ex', P.ex||[]);
    /* S03-U199: 「フィールド上に表側表示で存在するこのカードがデッキに戻った場合」 (ナーガ) — only cards whose script declares activateFrom 'deck' */
    if(eventName==='onLeaveField') scan('deck', (P.deck||[]).map(c=>{ const sc = c && CARD_SCRIPTS[dbOf(c).n]; return (sc && Array.isArray(sc.activateFrom) && sc.activateFrom.indexOf('deck')>=0) ? c : null; }));   /* null keeps the Deck indices */
  });
  return out;
}

/* DUELモード用 SEGOC。強制/任意、ターン/非ターンの4群を順に処理し、
   同じ群に複数ある場合はプレイヤーが積む順を選べる。 */
function startEventChainV2(eventName,evt,cands){
  /* S03-U27: 魔法・罠カードの「〜した時に発動できる」は誘発効果ではないので、同時に誘発した誘発効果を全てチェーンに積んだ後に
     発動する（ターンプレイヤー → 非ターンプレイヤー）。誘発効果の4群（0〜3）の後に 4 / 5 として並べる。
     以前は誘発効果の群に混ざり、スペルスピード2の罠が先に積まれると、相手のスペルスピード1の誘発効果が
     「スペルスピードが足りません」で発動できず、同じ候補が出続けた。 */
  const mapped=cands.map(c=>{ const sc=CARD_SCRIPTS[c.name]; const k=c.card?dbOf(c.card).k:null;
    /* S03-U44: 強制かどうかは、その発動イベントで選ばれる効果ごとに決める（v4 の effect.forced） */
    const forcedS03=(typeof triggerCandidateForcedS03==='function')?triggerCandidateForcedS03(c):!!(sc&&sc.forced);
    const rank=(k==='s'||k==='t') ? (c.p===gameState.activePlayer?4:5) : segocRank({player:c.p,forced:forcedS03},gameState.activePlayer);
    /* S03-U290: a forced effect of a Spell / Trap (パラライズ・チェーン 「…度に…与える」) keeps rank 4 / 5 but cannot be skipped (forcedSTS03) */
    return Object.assign({player:c.p,forced:forcedS03&&rank<4,forcedSTS03:!!forcedS03&&rank>=4,rank},c); });
  EVT_V2_STATE={eventName,evt:evt||{},groups:[0,1,2,3,4,5].map(r=>mapped.filter(x=>x.rank===r)),rank:0,chainStart:gameState.chain.length,after:EVT_AFTER};
  EVT_AFTER=null; processEventGroupV2();
}
function processEventGroupV2(){
  const st=EVT_V2_STATE; if(!st) return;
  while(st.rank<st.groups.length && !st.groups[st.rank].length) st.rank++;   /* S03-U27: 6群 */
  if(st.rank>=st.groups.length){ finishEventChainV2(); return; }
  const g=st.groups[st.rank], forced=st.rank<2 || g.every(c=>c.forcedSTS03);
  const rows=g.map((c,i)=>{
    const neg=(c.card && effectNegated(c.card))?'・効果無効中（発動は可能）':'';
    return `<div class="act pick-row" onclick="eventPickV2(${i})"><span class="pk-nm">${c.name}</span><span class="pk-sub">${nameOf(c.p)}・${zoneJp(c.zone)}${(forced||c.forcedSTS03)?'・強制':''}${neg}</span></div>`;
  }).join('');
  sheet.innerHTML=`<div class="grip"></div><h3 style="margin-bottom:4px">${st.eventName==='batch'?'同時誘発':eventJp(st.eventName)}</h3><div class="meta" style="margin-bottom:10px">${forced?'強制誘発です。複数ある場合はチェーンに積む順を選んでください。':'任意誘発です。発動するものを積む順に選んでください。'}</div><div class="pick-list">${rows}</div>${forced?'':`<button class="close" onclick="eventSkipGroupV2()">このグループはこれ以上発動しない</button>`}`;
  veil.classList.add('on');
}
function eventPickV2(i){
  const st=EVT_V2_STATE; if(!st) return; const g=st.groups[st.rank], c=g[i]; if(!c) return;
  closeSheet();
  prepareDuelActivation(c.name,c.p,c.zone,c.index,{
    event:c.event || (c.ctx&&c.ctx.event) || st.evt,
    eventName:c.eventName || st.eventName,
    battle:c.ctx&&c.ctx.battle,
    step:c.ctx&&c.ctx.step,
    battleOpponent:c.ctx&&c.ctx.battleOpponent,
    eventSelectionV11:eventSelectionDescriptorV11(i),
    /* S03-U298: a Flip effect is treated as activated on the field (collectHandlers listed it with logicalZone 'mz'): judge the pick the same way, also when the
       monster was destroyed after the flip and before the trigger was stacked (the forced group could not be skipped: the duel stopped for ever) */
    logicalZone:c.logicalZoneS298||undefined,
    ignoreTiming:true,noPriority:true,afterPrepared:()=>{
      const k=g.indexOf(c); if(k>=0) g.splice(k,1); processEventGroupV2();
    }});
}
function eventSkipGroupV2(){ const st=EVT_V2_STATE; if(!st) return; if(st.rank<2) return;
  /* S03-U290: the forced Spell / Trap effects of this group stay (only the optional ones are skipped) */
  const keepS03=(st.groups[st.rank]||[]).filter(c=>c.forcedSTS03);
  if(keepS03.length){ st.groups[st.rank]=keepS03; closeSheet(); processEventGroupV2(); return; }
  st.groups[st.rank]=[]; st.rank++; closeSheet(); processEventGroupV2(); }
function finishEventChainV2(){
  const st=EVT_V2_STATE; EVT_V2_STATE=null; closeSheet(); if(!st) return;
  if(gameState.chain.length>st.chainStart){
    CHAIN_AFTER_V2=st.resume?null:st.after||null;
    const last=gameState.chain[gameState.chain.length-1];
    gameState.chainWindow={priority:last.player===0?1:0,passes:0}; openChainPriorityV2();
  }else if(st.resume){ resumeEventProcessorV11(st.resume); }
  else if(st.after){ st.after(); }
  else flushDeferredEventsV2();
}

/* イベント発火。DUELはSEGOCビルダー、MANUAL/DEVは従来UI。 */
function emitEvent(eventName, evt){
  const cands = collectHandlers(eventName, evt);
  if(!cands.length) return false;
  if(PLAY_MODE===PLAY_MODES.DUEL){ startEventChainV2(eventName,evt,cands); return true; }
  // 強制誘発（EDOPro の TRIGGER_F 相当）は確認せずそのまま処理する
  const forced = cands.filter(c=>{
    const sc = CARD_SCRIPTS[c.name];
    /* S03-U44 */
    return sc && ((typeof triggerCandidateForcedS03==='function') ? triggerCandidateForcedS03(c) : sc.forced);
  });
  if(forced.length===cands.length && forced.length===1){
    const c = forced[0];
    runScript(c.name, c.p, c.zone, c.index, {event:c.ctx.event});
    return true;
  }
  /* 同時に誘発した効果は SEGOC の順にチェーンへ積む。
     ターンプレイヤーの強制 → 非ターンプレイヤーの強制
     → ターンプレイヤーの任意 → 非ターンプレイヤーの任意 の順。
     チェーンは逆順に解決されるので、後ろに積まれたものほど先に処理される。 */
  const ordered = orderSimultaneous(
    cands.map(c=>{
      const sc = CARD_SCRIPTS[c.name];
      return Object.assign({player:c.p, forced:!!(sc && sc.forced)}, c);
    }), gameState.activePlayer);
  cands.length = 0; ordered.forEach(x=>cands.push(x));
  setTimeout(()=>{
    const rows = cands.map((c,i)=>
      `<div class="act pick-row" onclick="__evtPick(${i})">
         <span class="pk-nm">${c.name}</span>
         <span class="pk-sub">${nameOf(c.p)}・${zoneJp(c.zone)}${c.forced?'・強制':''}</span>
       </div>`).join("");
    sheet.innerHTML = `<div class="grip"></div>
      <h3 style="margin-bottom:4px">${eventJp(eventName)}</h3>
      <div class="meta" style="margin-bottom:10px">
        発動できるカードがあります。上から順にチェーンへ積みます（解決は逆順）。</div>
      <div class="pick-list">${rows}</div>
      <button class="close" onclick="__evtSkip()">発動しない</button>`;
    EVT_CANDS = cands;
    veil.classList.add("on");
  }, 60);
  return true;
}
let EVT_CANDS = [], EVT_AFTER = null;
function __evtPick(i){
  const c = EVT_CANDS[i]; EVT_CANDS=[];
  closeSheet();
  if(!c) return;
  // 誘発効果もチェーンに積む。相手がチェーンする余地を残すため、
  // ここで即解決せず reactActivate と同じ経路を通す。
  reactActivate(c.p, c.zone, c.index);
}
function __evtSkip(){
  EVT_CANDS=[]; closeSheet();
  const f = EVT_AFTER; EVT_AFTER=null;
  if(f) f();
}
function eventJp(e){
  return ({
    onDraw:"ドロー時", onSummon:"召喚時", onNormalSummon:"通常召喚時",
    onSpecialSummon:"特殊召喚時", onSet:"セット時", onFlip:"反転時",
    onAttackDeclare:"攻撃宣言時", onDamageStep:"ダメージステップ", onBattleDestroy:"戦闘破壊時",
    onCounterPlaced:"カウンターが置かれた時", onCounterRemoved:"カウンターが取り除かれた時",
    onControlChange:"コントロールが移った時",
    onBattleDamage:"戦闘ダメージ時", onDirectBattleDamage:"直接攻撃の戦闘ダメージ時", onBattlePhaseEnd:"バトルフェイズ終了時",
    onDrawCard:"ドローした時", onAddToHand:"デッキから手札に加わった時",
    onLeaveField:"フィールドを離れた時",
    onPositionChange:"表示形式が変わった時",
    onTokenSummon:"トークンが特殊召喚された時",
    onActivateSuccess:"カードが発動した時",
    onEquipAttached:"装備された時", onEquipDetached:"装備が外れた時",
    onSendToGrave:"墓地へ送られた時", onDiscard:"効果で捨てられた時", onDestroy:"破壊された時", onRemove:"場を離れた時",
    onChainStart:"チェーン開始", onChainResolve:"チェーン解決", onEndPhase:"エンドフェイズ",
    onStandbyPhase:"スタンバイフェイズ", onPhaseChange:"フェーズ変更", onTurnStart:"ターン開始",
    onTurnEnd:"ターン終了", onLPChange:"LP変動", onTargetDeclared:"対象宣言", onCardActivate:"カード発動"
  })[e] || e;
}
