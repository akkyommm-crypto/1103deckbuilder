/* =========================================================================
   CODEX-C03 — source-aware targeting immunity
   -------------------------------------------------------------------------
   `continuous.immuneToTarget(target, self, effectInfo)` may now decide from:
     player, name, uid, card, db, cardType ('m'|'s'|'t'), subtype,
     level, isEffectMonster, isSynchro,
     targetCount, targetsMultiple.   (S03-U472、下記)

   Target choice happens in three different paths: activation preparation,
   resolution-time choice, and direct runScript. This helper normalizes their
   transient source metadata without storing functions or new duel state.
   ========================================================================= */
function targetEffectSourceS03(byPlayer, explicit){
  if(explicit && typeof explicit==='object'){
    const copy=Object.assign({}, explicit);
    if(byPlayer===0 || byPlayer===1) copy.player=byPlayer;
    return targetEffectSourceDetailsS03(copy);
  }
  let raw=null;
  if(typeof ACTIVATION_PREP_S03!=='undefined' && ACTIVATION_PREP_S03){
    raw={player:ACTIVATION_PREP_S03.player,uid:ACTIVATION_PREP_S03.uid,name:ACTIVATION_PREP_S03.name};
  }else if(typeof RESOLVING_LINK_S03!=='undefined' && RESOLVING_LINK_S03){
    raw={player:RESOLVING_LINK_S03.player,uid:RESOLVING_LINK_S03.uid,name:RESOLVING_LINK_S03.name,targetCount:RESOLVING_LINK_S03.targetCount};
  }else if(typeof P3_EFFECT_CONTEXT!=='undefined' && P3_EFFECT_CONTEXT){
    raw={player:P3_EFFECT_CONTEXT.player,uid:P3_EFFECT_CONTEXT.uid,name:P3_EFFECT_CONTEXT.name};
  }else if(typeof ACTIVE_SCRIPT!=='undefined' && ACTIVE_SCRIPT){
    raw={player:null,name:ACTIVE_SCRIPT.name||null};
  }else raw={player:null};
  if(byPlayer===0 || byPlayer===1) raw.player=byPlayer;
  return targetEffectSourceDetailsS03(raw);
}

/* S03-U472/U480: 効果が「対象にするカードの枚数」の宣言（カード名を知らない一般の宣言経路）。
   スクリプトに `targetCount: N`（N は 1 以上の整数）を書くと、その効果は**効果自身が**対象にするカードを N 枚取る、という宣言になる。
   - 数えるのは効果の対象だけ。コスト（リリース・捨てる・LP 等）で選ぶカードは数えない（ゴッドバードアタック＝鳥獣族のリリースはコスト、対象は 2 枚）。
   - 選択 UI の形（1 枚ずつ開く／まとめて選ぶ）や、その時点の `requestChoice` の min / max からは推測しない。宣言だけを読む。
   - 宣言が無いスクリプトは null（＝単体の対象として扱う。候補が多くても「1 体を対象にする効果」は複数対象ではない: 強制脱出装置）。
   - 複数の対象を取る効果と取らない効果を併せ持つスクリプトには、スクリプト単位の宣言は使えない（効果ごとの宣言が要る。現時点で該当なし）。
   - 明示 effectInfo が targetCount を持つ時はそれを優先する（効果ごとの呼び出し元用）。0 も「対象を選ばなかった」という実数として保持する。
   - 発動時に枚数を決める効果は `targetCountRange:[min,max]` を宣言し、選択時の明示 targetCount とチェーンリンクに実数を載せる。UI の min/max からは推測しない。
   targetsMultiple は targetCount が 2 以上の時だけ true。保存する状態は無い（純粋な読み取り）。 */
function targetCountDeclaredS03(raw, name){
  const explicit = v => { const n = Number(v); return (v!=null && Number.isInteger(n) && n>=0) ? n : null; };
  const fixed = v => { const n = Number(v); return (v!=null && Number.isInteger(n) && n>=1) ? n : null; };
  let n = explicit(raw && raw.targetCount);
  /* Zero is meaningful only for an explicitly declared optional variable-target effect (currently ゴルド).
     It must not override a fixed declaration such as 貪欲な壺's five targets. */
  if(n===0){ const r=targetCountRangeS03(name); if(!r || r[0]!==0) n=null; }
  if(n==null && name && typeof CARD_SCRIPTS!=='undefined'){
    const sc = CARD_SCRIPTS[name];
    if(sc) n = fixed(sc.targetCount);
  }
  return n;
}

function targetCountRangeS03(name){
  const sc = name && typeof CARD_SCRIPTS!=='undefined' ? CARD_SCRIPTS[name] : null;
  const r = sc && sc.targetCountRange;
  if(!Array.isArray(r) || r.length!==2) return null;
  const min=Number(r[0]),max=Number(r[1]);
  return Number.isInteger(min)&&Number.isInteger(max)&&min>=0&&max>=min ? [min,max] : null;
}

function targetCountAllowedS03(name, count){
  const n=Number(count),r=targetCountRangeS03(name);
  return !!r && Number.isInteger(n) && n>=r[0] && n<=r[1];
}

function targetEffectSourceDetailsS03(raw){
  raw=raw||{};
  let hit=null;
  if(raw.uid!=null && typeof findCardByUid==='function') hit=findCardByUid(raw.uid);
  const card=raw.card || (hit&&hit.card) || null;
  let name=raw.name || (card&&typeof cardName==='function' ? cardName(card) : null);
  let db=raw.db || (card&&typeof dbOf==='function' ? dbOf(card) : null);
  if((!db || !db.n) && name && typeof findCardIndex==='function' && typeof CARD_DB!=='undefined'){
    const i=findCardIndex(name); if(i>=0) db=CARD_DB[i]||null;
  }
  if(!name && db) name=db.n||null;
  const st=(db&&Array.isArray(db.st))?db.st:[];
  let level=Number(db&&db.lv||0);
  if(card && db && db.k==='m' && typeof curLV==='function') level=curLV(card);
  const count=targetCountDeclaredS03(raw, name||null),range=targetCountRangeS03(name||null);
  return {
    player:(raw.player===0||raw.player===1)?raw.player:null,
    name:name||null,
    uid:raw.uid!=null?raw.uid:(card&&card.uid!=null?card.uid:null),
    card:card,
    db:db||null,
    cardType:db&&db.k||null,
    subtype:db&&db.sub||'',
    level:level,
    isEffectMonster:!!(db&&db.k==='m'&&st.indexOf('効果')>=0),
    isSynchro:!!(db&&db.k==='m'&&st.indexOf('シンクロ')>=0),
    targetCount:count,
    targetCountRange:range,
    targetsMultiple:(count||0)>=2
  };
}

/* Small declarative matcher for the remaining target-immunity consumers. */
function targetEffectMatchesS03(info, spec){
  info=targetEffectSourceDetailsS03(info||{}); spec=spec||{};
  if(spec.opponentOf===0 || spec.opponentOf===1){
    if(info.player==null || info.player===spec.opponentOf) return false;
  }
  if(Array.isArray(spec.cardTypes) && spec.cardTypes.indexOf(info.cardType)<0) return false;
  if(spec.effectMonster===true && !info.isEffectMonster) return false;
  if(spec.synchro===true && !info.isSynchro) return false;
  if(spec.maxLevel!=null && !(info.level>0 && info.level<=Number(spec.maxLevel))) return false;
  return true;
}

/* S03-U468: 墓地・除外ゾーンのカードを「効果の対象にできない」継続効果。
   continuous.immuneToTargetOffField(card, self, effectInfo, loc) — card は墓地 / 除外ゾーンのカード、
   loc は {p, zone:'grave'|'banish', index}、effectInfo は immuneToTarget と同じ正規化済みの効果ソース。
   既存の immuneToTarget は場のカード専用（filterTargetable は場以外を素通しする）ので別フックにした。
   純粋な状態関数なので Save / Replay には何も保存しない。使うカード：メタルシルバー・アーマー。 */
function targetImmuneOffFieldS03(x, effectInfo){
  if(!x || !x.card || (x.zone!=='grave' && x.zone!=='banish') || typeof continuousSources!=='function') return false;
  const loc = {p:x.p, zone:x.zone, index:x.index};
  /* 安価な事前確認：このフックを宣言したカードが場に1枚も無ければ continuousSources() は呼ばない */
  let any = false;
  for(const P of gameState.players){
    for(const z of ['mz','sz','field']){
      const arr = z==='field' ? (P.field?[P.field]:[]) : (P[z]||[]);
      for(const c of arr){ const sc = c && CARD_SCRIPTS[cardName(c)]; if(sc && sc.continuous && typeof sc.continuous.immuneToTargetOffField==='function'){ any = true; break; } }
      if(any) break;
    }
    if(any) break;
  }
  if(!any) return false;
  for(const src of continuousSources()){
    const f = src.sc && src.sc.continuous && src.sc.continuous.immuneToTargetOffField;
    if(typeof f!=='function') continue;
    let r = false;
    try{ r = !!f(x.card, src.card, effectInfo||null, loc); }catch(e){ r = false; }
    if(r) return true;
  }
  return false;
}
