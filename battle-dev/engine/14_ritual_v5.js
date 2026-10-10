/* =========================================================================
   System v5 — Ritual Summon primitive
   -------------------------------------------------------------------------
   儀式召喚を共通化する。新しい巨大な SummonProcedure を作らず、
   既存の FX_RITUAL_SUMMON / リリース / P1 ChoiceRequest / P3 provenance を
   そのまま組み合わせる。

   ■ 1103 の裁定
     - 必要レベルの数え方はカードごとに違う。グローバル推測はしない。
         levelMode:'atLeast' … 「レベルの合計がN以上になるように」
         levelMode:'exact'   … 「儀式召喚するモンスターと同じレベルになるように」
       どちらかを RITUAL_SPEC_V5 に**カード個別**で明示する。
     - 'atLeast' でも必要以上のリリースはできない。
       合計がNを満たし、かつ「どれか1体を外すとNを下回る」ことを要求する。
       （どの1体も無駄になっていない＝過剰リリースの禁止）
     - 'exact' は合計がぴったり一致した場合のみ合法。

   ■ Replay 安全性
     - 選択途中の状態は pendingChoice.resume.args にだけ置く（純JSON）。
       これにより素材を1枚選んだ途中で Save→Load しても続行できる。
     - 素材は uid で保持する。配列 index やカード名を authority にしない。
     - 素材の支払いと儀式召喚は FX_RITUAL_SUMMON 1 Action で原子的に行う。
       途中で失敗しても二重支払いにならない。
   ========================================================================= */

/* ---- カード個別メタデータ ---------------------------------------------
   level: 必要レベル。null なら「儀式召喚するモンスターのレベル」。
   levelMode: 'atLeast' | 'exact'（カードテキストから個別に決める）
   monsters: 降臨できる儀式モンスター。null なら pred で判定する。       */
const RITUAL_SPEC_V5 = Object.freeze({
  /* --- 「レベルの合計がN以上になるように」= atLeast --- */
  'カオス－黒魔術の儀式':   {monsters:['マジシャン・オブ・ブラックカオス'], level:8, levelMode:'atLeast'},
  'ジャベリンビートルの契約': {monsters:['ジャベリンビートル'],           level:8, levelMode:'atLeast'},
  'スカルライダーの復活':   {monsters:['スカルライダー'],               level:6, levelMode:'atLeast'},
  'ゼラの儀式':             {monsters:['ゼラ'],                         level:8, levelMode:'atLeast'},
  'チャクラの復活':         {monsters:['チャクラ'],                     level:7, levelMode:'atLeast'},
  'ドリアードの祈り':       {monsters:['精霊術師 ドリアード'],           level:3, levelMode:'atLeast'},
  'ライオンの儀式':         {monsters:['スーパー・ウォー・ライオン'],     level:7, levelMode:'atLeast'},
  'ローの祈り':             {monsters:['ローガーディアン'],             level:7, levelMode:'atLeast'},
  '合成魔術':               {monsters:['ライカン・スロープ'],           level:6, levelMode:'atLeast'},
  '大邪神の儀式':           {monsters:['大邪神 レシェフ'],              level:8, levelMode:'atLeast'},
  '奇跡の方舟':             {monsters:['天界王 シナト'],                level:8, levelMode:'atLeast'},
  '悪魔鏡の儀式':           {monsters:['デビルズ・ミラー'],             level:6, levelMode:'atLeast'},
  '灼熱の試練':             {monsters:['伝説の爆炎使い'],               level:7, levelMode:'atLeast'},
  '白竜降臨':               {monsters:['白竜の聖騎士'],                 level:4, levelMode:'atLeast'},
  '要塞クジラの誓い':       {monsters:['要塞クジラ'],                   level:7, levelMode:'atLeast'},
  '覚醒の証':               {monsters:['覚醒戦士 クーフーリン'],         level:4, levelMode:'atLeast'},
  '闇の支配者との契約':     {monsters:['闇の支配者－ゾーク'],           level:8, levelMode:'atLeast'},
  /* --- 「儀式召喚するモンスターと同じレベルになるように」= exact --- */
  'エンド・オブ・ザ・ワールド': {monsters:['破滅の女神ルイン','終焉の王デミス'], level:null, levelMode:'exact'},
  'リチュアの儀水鏡':       {monsters:null, pred:'RITUA',                level:null, levelMode:'exact'},
});
const RITUAL_LEVEL_MODES_V5 = Object.freeze(['atLeast','exact']);

/* =========================================================================
   System v24 — 儀式 spec の外部登録
   -------------------------------------------------------------------------
   上の RITUAL_SPEC_V5 は **そのまま残す**（既存 19 枚と既存テストのため）。
   cards/ 側から追加したい spec は registry へ登録する。

   優先順位: registry → legacy RITUAL_SPEC_V5 → null

   ■ 直列化
     registry は module scope（CARD_SCRIPTS と同格）。gameState には入れない。
     spec 自体は純 JSON。関数を spec に入れさせない。
     儀式モンスターの許可条件（述語）だけは関数で、
     述語 registry に id で登録する。spec 側には id 文字列だけが入る。
   ========================================================================= */
const RITUAL_SPEC_REGISTRY_V24 = new Map();
const RITUAL_PRED_REGISTRY_V24 = new Map();

/* spec を純 JSON へ正規化する。関数や未知キーは落とす。 */
function normalizeRitualSpecV24(spec){
  if(!spec || typeof spec !== 'object') return null;
  const monsters = Array.isArray(spec.monsters)
    ? spec.monsters.filter(x=>typeof x === 'string')
    : null;
  const pred = (typeof spec.pred === 'string' && spec.pred) ? spec.pred : null;
  if(!monsters && !pred) return null;                       // どちらか必須
  const levelMode = (RITUAL_LEVEL_MODES_V5.indexOf(spec.levelMode) >= 0)
    ? spec.levelMode : 'atLeast';
  const level = (spec.level == null) ? null : Number(spec.level);
  if(level != null && !Number.isFinite(level)) return null;
  return Object.freeze({monsters, level, levelMode, pred});
}
/* 儀式魔法名 → spec。同名を後から登録した場合は上書きする。 */
function registerRitualSpecV24(name, spec){
  if(typeof name !== 'string' || !name) return false;
  const norm = normalizeRitualSpecV24(spec);
  if(!norm) return false;
  RITUAL_SPEC_REGISTRY_V24.set(name, norm);
  return true;
}
function ritualSpecRegisteredV24(name){
  return RITUAL_SPEC_REGISTRY_V24.get(name) || null;
}
/* 述語の登録。fn(cardDb) -> bool。spec には id だけを入れる。 */
function registerRitualPredicateV24(id, fn){
  if(typeof id !== 'string' || !id) return false;
  if(typeof fn !== 'function') return false;
  RITUAL_PRED_REGISTRY_V24.set(id, fn);
  return true;
}
function ritualPredicateV24(id){
  const f = RITUAL_PRED_REGISTRY_V24.get(id);
  return (typeof f === 'function') ? f : null;
}
/* 既定の述語。既存の 'RITUA' を同じ内容で登録する。
   isSetCardV4 / SETCODE は呼び出し時に見るので読み込み順に依存しない。 */
registerRitualPredicateV24('RITUA', function(cardDb){
  /* 「リチュア」= P4 の GISHKI setcode。カード名の部分一致は使わない。 */
  if(typeof isSetCardV4 === 'function' && typeof SETCODE !== 'undefined' && SETCODE.GISHKI)
    return isSetCardV4(cardDb, SETCODE.GISHKI);
  return false;
});

/* 直列化検査（テスト用）。registry の中身が純 JSON か。 */
function assertRitualRegistrySerializableV24(){
  let bad = null;
  RITUAL_SPEC_REGISTRY_V24.forEach((spec, name)=>{
    if(typeof name !== 'string'){ bad = bad || 'name が文字列ではない'; return; }
    Object.keys(spec).forEach(k=>{
      const v = spec[k];
      if(v === null) return;
      if(k === 'monsters'){
        if(!Array.isArray(v)) bad = bad || 'monsters が配列ではない';
        else if(v.some(x=>typeof x !== 'string')) bad = bad || 'monsters に文字列以外が入っている';
        return;
      }
      if(typeof v === 'function' || typeof v === 'object')
        bad = bad || (k + ' が直列化できない');
    });
  });
  if(bad) return bad;
  try{
    const out = {};
    RITUAL_SPEC_REGISTRY_V24.forEach((v,k)=>{ out[k] = v; });
    JSON.parse(JSON.stringify(out));
  }catch(e){ return 'JSON 往復できない'; }
  return null;
}

function ritualSpecV5(name){
  /* System v24: registry → legacy → null の順で引く。 */
  const reg = (typeof ritualSpecRegisteredV24 === 'function') ? ritualSpecRegisteredV24(name) : null;
  if(reg) return reg;
  const s = RITUAL_SPEC_V5[name];
  return s || null;
}
/* この儀式魔法で降臨できる儀式モンスターか */
function ritualAllowsMonsterV5(spec, cardDb){
  if(!spec || !cardDb) return false;
  if(!Array.isArray(cardDb.st) || cardDb.st.indexOf('儀式') < 0) return false;
  if(Array.isArray(spec.monsters)) return spec.monsters.indexOf(cardDb.n) >= 0;
  /* System v24: 述語は registry 経由。'RITUA' は既定登録されているので
     既存の振舞いは変わらない。 */
  if(spec.pred){
    const f = (typeof ritualPredicateV24 === 'function') ? ritualPredicateV24(spec.pred) : null;
    if(!f) return false;
    try{ return !!f(cardDb); }catch(e){ return false; }
  }
  return false;
}
/* 必要レベル。spec.level が null なら儀式モンスター自身のレベル。 */
function ritualRequiredLevelV5(spec, monsterCard){
  if(!spec) return 0;
  if(spec.level != null) return spec.level;
  const d = (typeof dbOf==='function') ? (dbOf(monsterCard)||{}) : {};
  return d.lv || 0;
}
/* 素材のレベル。継続効果込みの現在レベルを使う。 */
function ritualMaterialLevelV5(card){
  return (typeof curLV==='function') ? (curLV(card)||0) : ((dbOf(card)||{}).lv || 0);
}

/* ---- 合法性判定 -------------------------------------------------------
   exact  : 合計がぴったり一致
   atLeast: 合計がN以上、かつどの1体を外してもNを下回る（過剰リリース禁止） */
function ritualSelectionValidV5(levels, need, mode){
  const L = (levels||[]).filter(x=>typeof x==='number');
  if(!L.length || !need) return false;
  const sum = L.reduce((a,b)=>a+b, 0);
  if(mode === 'exact') return sum === need;
  if(sum < need) return false;
  const min = Math.min.apply(null, L);
  return (sum - min) < need;
}
/* まだ選び足せば成立し得るか（選択を続けてよいか） */
function ritualCanContinueV5(picked, need, mode){
  const sum = (picked||[]).reduce((a,b)=>a+b, 0);
  if(mode === 'exact') return sum < need;
  /* atLeast: まだNに届いていない間だけ選び足せる */
  return sum < need;
}

/* ---- 候補 -------------------------------------------------------------
   手札のモンスターと、自分フィールドの表側モンスター。
   既に選んだ uid は除く。                                               */
function ritualMaterialCandidatesV5(player, excludeUids, excludeSelfUid){
  const ex = new Set((excludeUids||[]).concat(excludeSelfUid!=null?[excludeSelfUid]:[]));
  const out = [];
  const P = gameState.players[player];
  (P.hand||[]).forEach((c,i)=>{
    if(!c || ex.has(c.uid)) return;
    if((dbOf(c)||{}).k !== 'm') return;
    ensureCardUid(gameState, c);
    out.push({p:player, zone:'hand', index:i, card:c});
  });
  (P.mz||[]).forEach((c,i)=>{
    if(!c || ex.has(c.uid) || c.face !== 'up') return;
    ensureCardUid(gameState, c);
    out.push({p:player, zone:'mz', index:i, card:c});
  });
  return out;
}
/* 降臨できる儀式モンスター（手札） */
function ritualMonsterCandidatesV5(player, spec){
  const out = [];
  (gameState.players[player].hand||[]).forEach((c,i)=>{
    if(!c) return;
    if(!ritualAllowsMonsterV5(spec, dbOf(c))) return;
    ensureCardUid(gameState, c);
    out.push({p:player, zone:'hand', index:i, card:c});
  });
  return out;
}
/* その儀式モンスターを出せるだけの素材が場と手札にあるか（発動条件） */
function ritualHasEnoughMaterialV5(player, spec, monsterCard){
  const need = ritualRequiredLevelV5(spec, monsterCard);
  if(!need) return false;
  const lv = ritualMaterialCandidatesV5(player, [], monsterCard.uid)
               .map(x=>ritualMaterialLevelV5(x.card)).filter(x=>x>0).sort((a,b)=>b-a);
  if(!lv.length) return false;
  if(spec.levelMode === 'exact'){
    /* 部分和で need ちょうどを作れるか（レベルは小さいので素直に探索） */
    let reach = new Set([0]);
    for(const v of lv){
      const next = new Set(reach);
      reach.forEach(s=>{ if(s+v<=need) next.add(s+v); });
      reach = next;
      if(reach.has(need)) return true;
    }
    return reach.has(need);
  }
  return lv.reduce((a,b)=>a+b,0) >= need;
}
function ritualCanActivateV5(player, spellName){
  const spec = ritualSpecV5(spellName);
  if(!spec) return false;
  if(!hasMonsterZoneSpace(player)) return false;
  return ritualMonsterCandidatesV5(player, spec)
           .some(x=>ritualHasEnoughMaterialV5(player, spec, x.card));
}

/* ---- 選択フロー（P1 ChoiceRequest を再利用） ---------------------------
   進行中の状態は resume.args だけに置く。純JSONなので
   素材を1枚選んだ途中で Save→Load しても続きから再開できる。          */
function ritualStartV5(player, spellName, spellUid){
  const spec = ritualSpecV5(spellName);
  if(!spec) return false;
  const cands = ritualMonsterCandidatesV5(player, spec)
                  .filter(x=>ritualHasEnoughMaterialV5(player, spec, x.card));
  if(!cands.length) return false;
  if(cands.length === 1) return ritualAskMaterialV5(player, spellName, spellUid, cands[0].card.uid, []);
  return requestChoiceV49({
    kind:'card', title:spellName+'：儀式召喚するモンスター', player,
    candidates:cands, min:1, max:1, targeting:false,
    resume:{handler:'ritual.pickMonster', args:{spell:spellName, spellUid:(spellUid!=null?spellUid:null), player}}
  });
}
/* 素材を1枚選ばせる。picked は uid の配列。 */
function ritualAskMaterialV5(player, spellName, spellUid, monsterUid, picked){
  const spec = ritualSpecV5(spellName);
  const mh = findCardByUid(monsterUid);
  if(!spec || !mh) return false;
  const need = ritualRequiredLevelV5(spec, mh.card);
  const cur  = (picked||[]).map(u=>{ const h=findCardByUid(u); return h?ritualMaterialLevelV5(h.card):0; });
  const cands = ritualMaterialCandidatesV5(player, picked, monsterUid)
                  .filter(x=>ritualMaterialLevelV5(x.card) > 0);
  if(!cands.length) return false;
  const sum = cur.reduce((a,b)=>a+b, 0);
  return requestChoiceV49({
    kind:'card',
    title:spellName+'：リリースする素材（レベル合計 '+sum+' / '+need+(spec.levelMode==='exact'?' ちょうど':' 以上')+'）',
    player, candidates:cands, min:1, max:1, targeting:false,
    resume:{handler:'ritual.pickMaterial',
            args:{spell:spellName, spellUid:(spellUid!=null?spellUid:null),
                  monsterUid, picked:(picked||[]).slice(), player}}
  });
}
/* 選び終わったら支払いと召喚を1 Action で行う */
function ritualFinishV5(player, spellName, monsterUid, picked){
  const spec = ritualSpecV5(spellName);
  const mh = findCardByUid(monsterUid);
  if(!spec || !mh || mh.zone !== 'hand') return false;
  const need = ritualRequiredLevelV5(spec, mh.card);
  const mats = (picked||[]).map(u=>findCardByUid(u)).filter(h=>h && (h.zone==='hand'||h.zone==='mz'));
  if(mats.length !== (picked||[]).length) return false;      // 場を離れた素材がある
  const levels = mats.map(h=>ritualMaterialLevelV5(h.card));
  if(!ritualSelectionValidV5(levels, need, spec.levelMode)) return false;
  /* P3: リリース前にスナップショットを取る。場を離れた後では現在値が取れない。 */
  const snaps = mats.map(h=>snapshotCardV3(h.card, ['atk','def','level','attribute','race','owner','originalAtk']));
  act({type:'FX_RITUAL_SUMMON', player,
       handIndex:mh.index, monsterUid,
       materialRefs:mats.map(h=>h.card.uid),
       tributes:mats.map(h=>({p:h.p, zone:h.zone, index:h.index})),
       p3Materials:snaps, p3SummonType:'ritual',
       pos:'atk', reason:spellName});
  return true;
}

registerChoiceHandlerV49('ritual.pickMonster', (answer, args)=>{
  if(answer.cancelled) return;
  const picked = v49P1ChoiceCards(answer)[0];
  if(!picked || picked.card == null) return;
  ensureCardUid(gameState, picked.card);
  ritualAskMaterialV5(args.player, args.spell, args.spellUid, picked.card.uid, []);
});
registerChoiceHandlerV49('ritual.pickMaterial', (answer, args)=>{
  if(answer.cancelled) return;
  const got = v49P1ChoiceCards(answer)[0];
  if(!got || got.card == null) return;
  ensureCardUid(gameState, got.card);
  const spec = ritualSpecV5(args.spell);
  const mh = findCardByUid(args.monsterUid);
  if(!spec || !mh) return;
  const need = ritualRequiredLevelV5(spec, mh.card);
  const picked = (args.picked||[]).concat([got.card.uid]);
  const levels = picked.map(u=>{ const h=findCardByUid(u); return h?ritualMaterialLevelV5(h.card):0; });
  if(ritualSelectionValidV5(levels, need, spec.levelMode)){
    ritualFinishV5(args.player, args.spell, args.monsterUid, picked);
    return;
  }
  if(ritualCanContinueV5(levels, need, spec.levelMode)){
    ritualAskMaterialV5(args.player, args.spell, args.spellUid, args.monsterUid, picked);
    return;
  }
  /* 合計を超えてしまい成立しない（exact で行き過ぎた等）。ここで打ち切る。 */
  if(typeof showToast==='function') showToast('この組み合わせでは儀式召喚できません');
});

/* ---- 参照ヘルパ（テスト・カードスクリプト用） -------------------------- */
function ritualProvenanceOfV5(card){
  const p = (typeof summonProvenanceOfV3==='function') ? summonProvenanceOfV3(card) : null;
  return (p && p.summonType === 'ritual') ? p : null;
}
function wasRitualSummonedV5(card){ return !!ritualProvenanceOfV5(card); }

