/* =========================================================================
   System v2.4: 特殊な通常召喚手順 + リリース価値
   -------------------------------------------------------------------------
   カード固有の「妥協召喚」「追加リリース召喚」を if(cardName) で増やさず、
   CARD_SCRIPTS[name].normalSummonProcedure.methods に宣言する。

   method = {
     id, tributes,
     modes:['summon','set'],
     summonLabel, setLabel,
     baseStats:{atk?,def?},
     loseOnFaceDown, loseOnNegate
   }
   ========================================================================= */
function standardNormalSummonMethod(db,p){
  const n=tributesNeeded(db,p);
  return {id:'standard',tributes:n,modes:['summon','set'],
    summonLabel:n?`${n}体分リリースして召喚`:'通常召喚',
    setLabel:n?`${n}体分リリースしてセット`:'セット'};
}
/* S03-U190: a monster that cannot be Normal Summoned / Set — its text says 「このカードは通常召喚できない」 / 「このカードは通常召喚できず」
   (Sin, カオス・ソーサラー, ライトロード・ビースト ウォルフ …), the script declares cannotNormalSummon, or it is a Ritual Monster (a game rule).
   Before, none of this was checked: every such monster in the hand was offered a Normal Summon / Set with the standard Tributes. */
function cannotNormalSummonS03(db){
  if(!db || db.k!=='m') return false;
  if(Array.isArray(db.st) && db.st.indexOf('儀式')>=0) return true;
  const sc=CARD_SCRIPTS[String(db.n||'')];
  if(sc && sc.cannotNormalSummon===true) return true;
  return /このカードは通常召喚でき(ない|ず)/.test(String(db.e||''));
}
function allNormalSummonMethods(db,p){
  if(cannotNormalSummonS03(db)) return [];
  const sc=CARD_SCRIPTS[String(db.n||'')];
  const proc=sc&&sc.normalSummonProcedure;
  if(!proc) return [standardNormalSummonMethod(db,p)];
  let methods=Array.isArray(proc.methods)?proc.methods.slice():[];
  if(proc.includeStandard===true && !methods.some(m=>m.id==='standard')) methods.push(standardNormalSummonMethod(db,p));
  return methods.map(m=>Object.assign({},m,{tributes:Math.max(0,Number(m.tributes)||0)}));
}
/* System v2.4: 1枚を2体分として扱うリリース価値。
   tributeValue:{value:2,target:{at:'闇'}} のようにカード側へ宣言する。
   表側で効果無効なら追加価値は失うが、裏側なら Skill Drain 等の無効を受けない。 */
function tributeValueRuleMatches(rule,targetDb){
  if(!rule) return false;
  const f=rule.target||{};
  if(f.at!=null && targetDb.at!==f.at) return false;
  if(f.ra!=null && targetDb.ra!==f.ra) return false;
  if(f.lvmin!=null && !(Number(targetDb.lv||0)>=f.lvmin)) return false;
  if(f.lvmax!=null && !(Number(targetDb.lv||0)<=f.lvmax)) return false;
  if(f.nameContains!=null && String(targetDb.n||'').indexOf(f.nameContains)<0) return false;
  if(typeof rule.condition==='function'){
    try{ if(!rule.condition(targetDb)) return false; }catch(e){ return false; }
  }
  return true;
}
function tributeValueOptionsForDb(sourceDb,targetDb,sourceCard){
  const vals=[1], sc=CARD_SCRIPTS[String(sourceDb&&sourceDb.n||'')], raw=sc&&sc.tributeValue;
  if(!raw) return vals;
  if(sourceCard && sourceCard.face==='up' && effectNegated(sourceCard)) return vals;
  const rules=Array.isArray(raw)?raw:[raw];
  rules.forEach(r=>{ if(tributeValueRuleMatches(r,targetDb)){ const v=Math.max(1,Number(r.value)||1); if(!vals.includes(v)) vals.push(v); } });
  return vals.sort((a,b)=>a-b);
}
function tributeValueOptions(card,targetDb){ return tributeValueOptionsForDb(dbOf(card),targetDb,card); }

/* System v23: アドバンス召喚のリリース素材制限。
   召喚方法（method）ごとに materialFilter(candidate, ctx) を宣言できる。
     candidate : API.fieldCards と同じ {p,zone,index,card,db} ハンドル
     ctx       : {player, db, method, mode, gameState}
   宣言しなければ従来と完全に同じ振舞い。
   関数は CARD_SCRIPTS 側に住む。gameState には一切入れない。 */
function materialFilterOfV23(method){
  const f = method && method.materialFilter;
  return (typeof f === 'function') ? f : null;
}
/* 候補1体がその method の素材条件を満たすか。
   例外は「満たさない」扱いにして召喚自体を壊さない。 */
function passesMaterialFilterV23(handle, method, ctx){
  const f = materialFilterOfV23(method);
  if(!f) return true;
  if(!handle || !handle.card) return false;
  try{ return !!f(handle, ctx||{}); }catch(e){ return false; }
}
/* method の素材条件で絞った候補。method 省略時は絞らない。 */
function tributeCandidatesForV23(p, targetDb, method, mode){
  const all = tributeCandidates(p, targetDb);
  if(!materialFilterOfV23(method)) return all;
  const ctx = {player:p, db:targetDb, method, mode:mode||'summon', gameState};
  return all.filter(x=>passesMaterialFilterV23(x, method, ctx));
}

function maxTributeCapacity(p,targetDb,method,mode){
  return tributeCandidatesForV23(p,targetDb,method,mode)
    .reduce((sum,x)=>sum+Math.max(...tributeValueOptions(x.card,targetDb)),0);
}
function normalSummonMethodsFor(db,p,mode){
  return allNormalSummonMethods(db,p).filter(m=>{
    const modes=m.modes||['summon','set'];
    if(!modes.includes(mode)) return false;
    /* System v23: 容量は method ごとに測る。
       素材制限のある method は、その条件を満たす候補だけで数える。 */
    if(m.tributes > maxTributeCapacity(p,db,m,mode)) return false;
    if(typeof m.condition==='function'){
      try{ if(!m.condition({player:p,db,mode,gameState})) return false; }catch(e){ return false; }
    }
    return true;
  });
}
function normalSummonMethodById(db,p,id){
  return allNormalSummonMethods(db,p).find(m=>m.id===id)||null;
}
function normalSummonMethodLabel(m,mode){
  return mode==='set' ? (m.setLabel||`${m.tributes}体分リリースしてセット`)
                      : (m.summonLabel||`${m.tributes}体分リリースして召喚`);
}
function makeProcedureBaseStatsState(db,m){
  return {source:db.n||'',active:true,atk:m.baseStats&&m.baseStats.atk,def:m.baseStats&&m.baseStats.def,
          loseOnFaceDown:!!m.loseOnFaceDown,loseOnNegate:!!m.loseOnNegate};
}
function activatePendingProcedureBaseStats(card,gs){
  const st=card&&card.procedureBaseStatsPending; if(!st) return;
  delete card.procedureBaseStatsPending;
  card.procedureBaseStats=Object.assign({},st,{active:true});
  if(card.procedureBaseStats.loseOnNegate && effectNegated(card)){
    delete card.procedureBaseStats;
    if(gs) logIt(gs, `${cardName(card)}：召喚方法による元々の数値変更は効果無効のため適用されない`);
  }else if(gs){
    logIt(gs, `${cardName(card)}：セット時の召喚方法による元々の数値変更を適用`);
  }
}
function applyNormalSummonMethod(card,db,p,methodId,mode){
  if(!card) return;
  const m=normalSummonMethodById(db,p,methodId);
  if(!m) return;
  card.normalSummonMethod=m.id;
  if(!m.baseStats) return;
  if(mode==='summon') card.procedureBaseStats=makeProcedureBaseStatsState(db,m);
  else if(mode==='set' && m.applyOnFlipFromSet) card.procedureBaseStatsPending=makeProcedureBaseStatsState(db,m);
}
/* 選択肢を表示し、必要数のリリース後にコールバックする。 */
function chooseNormalSummonMethod(i,mode,onReady){
  const p=gameState.activePlayer, P=gameState.players[p], db=CARD_DB[P.hand[i]?.id]||{};
  const methods=normalSummonMethodsFor(db,p,mode);
  if(!methods.length){ showToast('この方法で通常召喚できません'); return; }
  const go=m=>{
    if(m.tributes===0){ onReady(m,{bodies:0,value:0}); return; }
    /* System v23: 選ばれた召喚方法を素材選択へ渡す。 */
    pickTributes(p,m.tributes,[],payment=>onReady(m,payment),db,m,mode);
  };
  if(methods.length===1){ go(methods[0]); return; }
  openPick(`${db.n||'モンスター'}：${mode==='set'?'セット':'召喚'}方法`,
    mode==='set'?'使用するセット方法を選んでください':'使用する通常召喚方法を選んでください',
    methods.map(m=>({
      label:normalSummonMethodLabel(m,mode),
      sub:m.tributes?`必要リリース価値 ${m.tributes}`:'リリースなし',
      onPick:()=>go(m)
    })));
}
function gearTownActive(){
  return gameState.players.some(P=>P.field && P.field.face==='up' &&
    dbOf(P.field).n === '歯車街');
}

/* リリース候補（自分フィールドのモンスター） */
function tributeCandidates(p, targetDb){
  /* S03-U129: 羊トークン (card flag); S03-U169: 「このカードはアドバンス召喚のためにはリリースできない」 declared by the script (素早いムササビ);
     S03-U188: 黒焔トークン 「闇属性モンスター以外のアドバンス召喚のためにはリリースできない」 (card flag; needs the summoned monster's db) */
  return API.fieldCards({zone:'mz', player:p, filter:x=>x.card && !x.card.cannotTribute && !x.card.noAdvanceTributeS03
    && !(x.card.noAdvanceTributeNonDarkS03 && !(targetDb && targetDb.at==='闇'))
    && !(()=>{ const v=(CARD_SCRIPTS[cardName(x.card)]||{}).noAdvanceTributeS03; try{ return typeof v==='function' ? !!v(x.card) : !!v; }catch(e){ return false; } })()});   /* S03-U266: a function form (きつね火: only while face-up) */
}

function doNormalSummon(i, pos){
  const p=gameState.activePlayer,c=gameState.players[p].hand[i];
  const why=c?v46FaceUpSummonRestrictionReason(p,dbOf(c),'normal'):'';
  if(why){showToast(why);return;}
  chooseNormalSummonMethod(i,'summon',(m,payment)=>finishNormalSummon(i,pos,payment,m.id,null));
}
/* v3.7.0: 効果で得た追加通常召喚権を通常召喚権と分離して消費する。 */
function doExtraNormalSummonV370(i, extraNormalKey){
  const p=gameState.activePlayer,c=gameState.players[p].hand[i];
  const why=c?v46FaceUpSummonRestrictionReason(p,dbOf(c),'normal'):'';
  if(why){showToast(why);return;}
  chooseNormalSummonMethod(i,'summon',(m,payment)=>finishNormalSummon(i,'atk',payment,m.id,extraNormalKey));
}

/* need 体になるまでリリース対象を選ばせる */
function tributeSpent(chosen){ return (chosen||[]).reduce((s,x)=>s+(x.value||1),0); }
function chooseTributeValue(card,targetDb,remaining,onPick){
  const vals=tributeValueOptions(card,targetDb).filter(v=>v<=remaining);
  if(!vals.length){ onPick(1); return; }
  if(vals.length===1){ onPick(vals[0]); return; }
  openPick(`${cardName(card)}：リリースとしての扱い`,
    `このカードは今回のアドバンス召喚で1体分または${Math.max(...vals)}体分として扱えます。`,
    vals.map(v=>({label:`${v}体分としてリリース`,sub:v===1?'通常のリリース':'2体分効果を適用',onPick:()=>onPick(v)})));
}
function pickTributes(p, need, chosen, onDone, db, method, mode){
  const spent=tributeSpent(chosen), remaining=need-spent;
  if(remaining<=0){
    const payment={bodies:chosen.length,value:tributeSpent(chosen)};
    /* P3: リリース前に素材のスナップショットを取る。場を離れた後では現在ATK等が取れない。
       identity は uid。カード名は使わない。 */
    payment.p3Materials = chosen.map(ent=>{
      const c=ent.card; if(!c) return null;
      ensureCardUid(gameState,c);
      return (typeof snapshotCardV3==='function')
        ? snapshotCardV3(c,['atk','def','level','attribute','race','owner','originalAtk'])
        : null;
    }).filter(Boolean);
    chosen.forEach(ent=>{
      const loc=locateCard(ent.card);
      if(loc) act({type:"FX_TO_GRAVE",player:loc.p,zone:loc.zone,index:loc.index,
                   reason:`アドバンス召喚のリリース（${ent.value||1}体分）`,byDestroy:false,
                   p3:{reason:'tribute',actingPlayer:p,fromZone:loc.zone}});
    });
    onDone(payment); return;
  }
  const used=new Set(chosen.map(x=>x.card));
  /* System v23: 素材制限のある method はここでも同じ条件で絞る。 */
  const left=tributeCandidatesForV23(p,db,method,mode).filter(x=>!used.has(x.card));
  const cap=left.reduce((sum,x)=>sum+Math.max(...tributeValueOptions(x.card,db)),0);
  if(cap<remaining){ showToast(`リリースが足りません（あと${remaining}体分必要）`); render(); return; }
  API.selectCard(`${db.n||'アドバンス召喚'}：リリースするモンスター（残り${remaining}体分）`,
    left, x=>{
      chooseTributeValue(x.card,db,remaining,value=>{
        chosen.push({card:x.card,value});
        pickTributes(p,need,chosen,onDone,db,method,mode);
      });
    }, '2体分にできるモンスターは、選択後に1体分/2体分を選べます');
}

function finishNormalSummon(i, pos, payment, methodId, extraNormalKey){
  payment=payment||{bodies:0,value:0};
  const p=gameState.activePlayer, P=gameState.players[p], card=P.hand[i]; if(!card) return;
  const nm=cardName(card);
  if(PLAY_MODE!==PLAY_MODES.DUEL){
    closeSheet(); act({type:"NORMAL_SUMMON",player:p,handIndex:i,pos:'atk',tributes:payment.bodies,tributeValue:payment.value,summonMethod:methodId,p3Materials:payment.p3Materials||[]});
    const summoned=lastSummonedCard(p);
    EVT_AFTER=()=>{ offerSummonTrigger(p,nm); offerReactAfter(p===0?1:0); };
    if(!emitEvent("onNormalSummon",{player:p,name:nm,card:summoned})){ EVT_AFTER=null; askChain(`${nm} の召喚`,()=>{offerSummonTrigger(p,nm);offerReactAfter(p===0?1:0);}); }
    return;
  }
  ensureCardUid(gameState,card);
  if(extraNormalKey){
    const f=P.temporaryFlags||{};
    if(String(extraNormalKey).indexOf('src:')===0 ? !!f[String(extraNormalKey).slice(4)+'XnUsedS03'] : Number(f[extraNormalKey]||0)<=0){ showToast('追加通常召喚権がありません'); return; }   /* S03-U274: source keys */
  }
  closeSheet();
  act({type:'NORMAL_SUMMON_ATTEMPT',player:p,name:nm,extraNormalKey:extraNormalKey||null});
  /* S03-U15: 続きは pendingSummon.resumeS03 から runSummonWindowResumeS03 が実行する（保存・Undo を跨げる）。 */
  PENDING_SUMMON_COMMIT=PENDING_SUMMON_CANCEL=null;
  const resumeS03=Object.assign({uid:card.uid,tributes:payment.bodies,tributeValue:payment.value,p3Materials:payment.p3Materials||[]},methodId!=null?{summonMethod:methodId}:{});
  beginSummonWindowV2({player:p,name:nm,kind:'normal',label:extraNormalKey?'追加通常召喚':'通常召喚',uid:card.uid,commit:'__pendingSummonCommit',cancel:'__pendingSummonCancel',resumeS03});
}
function doSetMonster(i){
  const p = gameState.activePlayer;
  closeSheet();
  act(Object.assign({type:"SET_MONSTER", player:p, handIndex:i}, (typeof mustSetFaceUp==='function' && mustSetFaceUp()) ? {faceUpSetS03:true} : {}));   /* S03-U194 */
}
/* DUELモード用：特殊な通常召喚手順をセットにも共通適用する。 */
function doSetMonsterLegal(i){
  chooseNormalSummonMethod(i,'set',(m,payment)=>finishSetMonster(i,payment,m.id));
}
function finishSetMonster(i,payment,methodId){
  payment=payment||{bodies:0,value:0};
  const p=gameState.activePlayer, P=gameState.players[p];
  closeSheet();
  act(Object.assign({type:"SET_MONSTER",player:p,handIndex:i,tributes:payment.bodies||0,tributeValue:payment.value||0,summonMethod:methodId},
    (typeof mustSetFaceUp==='function' && mustSetFaceUp()) ? {faceUpSetS03:true} : {}));   /* S03-U194: 聖なる輝き */
}
function doSetST(i, toField){
  const p = gameState.activePlayer;
  closeSheet();
  act({type:"SET_ST", player:p, handIndex:i, toField:!!toField});
}
function doSpecialFromHand(i, pos, reason){
  const p = gameState.activePlayer;
  const nm = (CARD_DB[gameState.players[p].hand[i]?.id]||{}).n || "";
  closeSheet();
  act({type:"FX_SPECIAL_SUMMON", player:p, from:"hand", fromIndex:i, pos, reason:reason||"手札から"});
  const summoned = lastSummonedCard(p);
  EVT_AFTER = ()=>{ offerSummonTrigger(p, nm); offerReactAfter(p===0?1:0); };
  if(!emitEvent("onSpecialSummon", {player:p, name:nm, card:summoned})){
    EVT_AFTER = null;
    askChain(`${nm} の特殊召喚`, ()=>{ offerSummonTrigger(p, nm); offerReactAfter(p===0?1:0); });
  }
}

function fromHand(i, to, face, pos){
  // ゾーン制限チェック
  const p = gameState.activePlayer;
  const P = gameState.players[p];
  if(ZONE_LIMITS[to] && P[to].length>=ZONE_LIMITS[to] && to!=="field"){
    showToast(`${zoneJp(to)}ゾーンは${ZONE_LIMITS[to]}枚までです`); return;
  }
  if(to==="field" && P.field){ showToast("フィールド魔法ゾーンは1枚までです"); return; }
  const nm = (CARD_DB[P.hand[i]?.id]||{}).n || "";
  act({type:"MOVE", player:p, from:"hand", fromIndex:i, to, face:face||"up", pos:pos||"atk"});
  closeSheet();
  if(to==="mz" && (face||"up")==="up" && nm){
    // 召喚に対して激流葬・奈落などを撃てるので確認する
    askChain(`${nm} の召喚`, ()=>offerSummonTrigger(p, nm));
  }
}
/* 手札から魔法罠を発動：ゾーンへ置いてからチェーンに積む */
function handActivate(i){
  const p = gameState.activePlayer;
  const P = gameState.players[p];
  const c = P.hand[i]; const db = dbOf(c);
  const ss = spellSpeed(db);
  if(!canChainOnto(ss)){ alert(`スペルスピードが足りません（このカードSS${ss}）`); return; }
  const to = db.sub==="フィールド" ? "field" : "sz";
  if(to==="sz" && P.sz.length>=ZONE_LIMITS.sz){ alert("魔法罠ゾーンは5枚までです"); return; }
  if(to==="field" && P.field){ alert("フィールド魔法ゾーンは1枚までです"); return; }
  act({type:"MOVE", player:p, from:"hand", fromIndex:i, to, face:"up"});
  const idx = to==="field" ? 0 : P.sz.length-1;
  act({type:"CHAIN_ADD", player:p, cardId:c.id, name:db.n, ss, from:to, index:idx});
  closeSheet();
  openChain();
}

/* 場のカードをタップ（一人回し用：両サイドとも操作可） */
function openZone(p, zone, idx){
  if(PLAY_MODE===PLAY_MODES.DUEL) return openZoneDuel(p, zone, idx);
  const P = gameState.players[p];
  const c = zoneCard(P, zone, idx); if(!c) return;
  const db = dbOf(c);
  const isMon = db.k==='m';
  const faceUp = c.face==='up';
  const canAttack = isMon && faceUp && c.pos==='atk';
  const R = rules();
  const ph = phaseJp(gameState.phase);
  const blockedBtn = (label, why)=>
    `<div class="act blocked" onclick="showToast('${why}')">${label}<span class="bk">${ph}不可</span></div>`;

  // 攻撃（表側攻撃表示モンスター、かつバトルフェイズのみ）
  const already = !!c.attacked;
  const attack = !canAttack ? ""
    : (!R.attack ? blockedBtn("攻撃宣言", whyBlocked('attack'))
      : already  ? blockedBtn("攻撃宣言", "このモンスターは既に攻撃しています")
      : `<div class="act" onclick="beginAttack(${p},${idx})">攻撃宣言</div>`);
  // 無効化・攻撃済みの状態表示
  const flags = [];
  if(c.attacked) flags.push('攻撃済');
  if(c.negated)  flags.push('無効');
  const flagNote = flags.length ? `<div class="flag-note">${flags.join(' / ')}</div>` : "";

  // 効果発動。自動処理できるカードは⚡付きで最優先に出す
  const nm = db.n||"";
  const eff = hasEffect(nm);
  const keep = (db.sub==="永続" || db.sub==="フィールド" || db.sub==="装備");
  const canAct = canActivateNow(db);
  const actWhy = `${ph}では通常魔法・起動効果は発動できません（速攻魔法・罠のみ）`;
  const autoAct = !eff ? ""
    : (canAct
        ? `<div class="act fx" onclick="activateFromZone(${p},'${zone}',${idx})">⚡ 効果を発動（自動処理）</div>`
        : blockedBtn("⚡ 効果を発動", actWhy));
  // カウンター操作（魔力カウンター等）
  const ctNow = c.counters ? Object.entries(c.counters).map(([k,v])=>`${k}${v}`).join(" / ") : "";
  // 攻守の増減（継続効果）
  const modNow = hasMod(c) ? `（現在 攻${curATK(c)}/守${curDEF(c)}）` : "";
  const modRow = (isMon && faceUp) ? `
    <div class="act-label">攻守の増減${modNow}</div>
    <div class="act-grid">
      <div class="act" onclick="openModMenu(${p},'${zone}',${idx})">数値を変更…</div>
      ${hasMod(c)?`<div class="act warn" onclick="closeSheet();act({type:'MOD_CLEAR',player:${p},zone:'${zone}',index:${idx}})">修正を解除</div>`:""}
    </div>` : "";

  const counterRow = `
    <div class="act-label">カウンター${ctNow?`（現在：${ctNow}）`:""}</div>
    <div class="act-grid">
      <div class="act" onclick="closeSheet();act({type:'COUNTER_ADD',player:${p},zone:'${zone}',index:${idx},kind:'魔力',n:1})">魔力 +1</div>
      <div class="act" onclick="closeSheet();act({type:'COUNTER_REMOVE',player:${p},zone:'${zone}',index:${idx},kind:'魔力',n:1})">魔力 −1</div>
      <div class="act" onclick="openCounterMenu(${p},'${zone}',${idx})">他のカウンター…</div>
      ${ctNow?`<div class="act warn" onclick="closeSheet();act({type:'COUNTER_CLEAR',player:${p},zone:'${zone}',index:${idx}})">全て取り除く</div>`:""}
    </div>`;

  // エクシーズ素材の取り除き
  const detach = (zone==="mz" && c.xyz && c.xyz.length)
    ? `<div class="act" onclick="${c.xyz.length>1?`openXyzDetachPick(${p},${idx})`:`closeSheet();act({type:'FX_DETACH',player:${p},mzIndex:${idx},reason:'効果コスト'})`}">素材を1つ取り除く（残${c.xyz.length}）</div>`
    : "";
  const activate = !(!isMon || faceUp) ? ""
    : (canAct
        ? `<div class="act" onclick="chainAddFromZone(${p},'${zone}',${idx})">効果を発動（チェーンへ）</div>`
        : blockedBtn("効果を発動（チェーンへ）", actWhy));

  const state = `
    ${c.face==='down'?`<div class="act" onclick="zAct('FLIP',${p},'${zone}',${idx})">表にする（反転）</div>`:""}
    ${isMon?`<div class="act" onclick="zAct('TOGGLE_POS',${p},'${zone}',${idx})">表示形式を変更</div>`:""}
    ${isMon&&faceUp?`<div class="act" onclick="closeSheet();act({type:'FX_SET_STATE',player:${p},zone:'${zone}',index:${idx},face:'down',pos:'def',reason:'裏側守備に'})">裏側守備にする</div>`:""}
    ${isMon&&!faceUp?`<div class="act" onclick="closeSheet();doFlipUp(${p},'${zone}',${idx},'def')">表にする（守備）</div>`:""}
    ${isMon&&!faceUp?`<div class="act" onclick="closeSheet();doFlipUp(${p},'${zone}',${idx},'atk')">反転召喚（攻撃）</div>`:""}`;
  const move = `
    <div class="act" onclick="zMove(${p},'${zone}',${idx},'grave')">墓地へ</div>
    <div class="act" onclick="zMove(${p},'${zone}',${idx},'banish')">除外</div>
    <div class="act" onclick="zMove(${p},'${zone}',${idx},'hand')">手札へ</div>
    <div class="act" onclick="zMove(${p},'${zone}',${idx},'deck')">デッキ上へ</div>
    <div class="act" onclick="zMoveDeck(${p},'${zone}',${idx},'bottom')">デッキ下へ</div>
    ${db.ex?`<div class="act" onclick="zMove(${p},'${zone}',${idx},'ex')">EXデッキへ</div>`:""}
    ${zone==='mz'?`<div class="act" onclick="zMoveZone(${p},'${zone}',${idx},'sz')">魔法＆罠ゾーンへ</div>`:""}
    ${zone==='sz'?`<div class="act" onclick="zMoveZone(${p},'${zone}',${idx},'mz')">モンスターゾーンへ</div>`:""}
    ${zone==='sz'&&!P.field?`<div class="act" onclick="zMoveZone(${p},'${zone}',${idx},'field')">フィールドゾーンへ</div>`:""}`;

  /* コントロールの移動。手動でも必ず行えるようにしておく。
     強制転移やビッグ・アイのように、スクリプトが無いカードでも処理できる。 */
  const foe = p===0?1:0;
  const moved = (c.controlReturnTo != null) || (c.owner != null && c.owner !== p);
  const control = (zone==='mz' || zone==='sz' || zone==='field') ? `
    <div class="act-label">コントロール</div>
    <div class="act-grid">
      <div class="act" onclick="zControl(${p},'${zone}',${idx},${foe},null)">${nameOf(foe)}に渡す</div>
      <div class="act" onclick="zControl(${p},'${zone}',${idx},${foe},'endPhase')">${nameOf(foe)}に渡す（エンドまで）</div>
      <div class="act" onclick="openSwapMenu(${p},'${zone}',${idx})">相手のカードと入れ替える…</div>
      ${moved?`<div class="act warn" onclick="zControlBack(${p},'${zone}',${idx})">持ち主に戻す</div>`:""}
    </div>` : "";

  /* 状態を手で付け外しする。スクリプトが無いカードの効果を再現するための逃げ道。 */
  const stateFlags = (zone==='mz' || zone==='sz' || zone==='field') ? `
    <div class="act-label">状態を付け外し</div>
    <div class="act-grid">
      <div class="act${c.negated?' warn':''}" onclick="zFlag(${p},'${zone}',${idx},'negated')">${c.negated?'効果無効を解除':'効果を無効にする'}</div>
      ${isMon?`<div class="act${c.cannotAttack?' warn':''}" onclick="zFlag(${p},'${zone}',${idx},'cannotAttack')">${c.cannotAttack?'攻撃不可を解除':'攻撃できなくする'}</div>`:""}
      ${isMon?`<div class="act${c.cannotTribute?' warn':''}" onclick="zFlag(${p},'${zone}',${idx},'cannotTribute')">${c.cannotTribute?'リリース不可を解除':'リリースできなくする'}</div>`:""}
      ${isMon?`<div class="act${c.attacked?' warn':''}" onclick="zFlag(${p},'${zone}',${idx},'attacked')">${c.attacked?'攻撃済みを解除':'攻撃済みにする'}</div>`:""}
      ${isMon?`<div class="act" onclick="openLvMenu(${p},'${zone}',${idx})">レベルを変更…</div>`:""}
    </div>` : "";

  const textSteps = (!CARD_SCRIPTS[db.n] && parseEffectSteps(db.e||'').length)
    ? `<div class="act fx" onclick="closeSheet();runAutoText(${jsStr(db.n||'')},${p},'${zone}',${idx})">⚡ テキストから処理…</div>`
    : "";
  const manual = textSteps +
    `<div class="act" onclick="closeSheet();openPrimitives(${p},'${zone}',${idx},${jsStr(db.n||'')})">手動で効果処理…</div>`;
  const primary = autoAct + detach + attack + activate + manual;
  const hasPrimary = primary.trim().length>0;
  const hasState = state.trim().length>0;
  sheet.innerHTML = metaHead(db) +
    `<div class="phase-note">${ph}：${R.note}${db.k!=='m'?`<span class="ss-tag">SS${spellSpeedOf(db)}</span>`:""}</div>` + flagNote +
    (eff?`<div class="fx-note">このカードは効果を自動処理できます${clNote(p, db.n, c)}</div>`:"") +
    (hasPrimary ? `<div class="act-label">アクション</div><div class="act-grid">${primary}</div>` : "") +
    (hasState ? `<div class="act-label">状態</div><div class="act-grid">${state}</div>` : "") +
    modRow + counterRow + stateFlags + control +
    `<div class="act-label">移動</div><div class="act-grid">${move}</div>
     <button class="close" onclick="closeSheet()">閉じる</button>`;
  veil.classList.add("on");
}

function openXyzDetachPick(p, idx){
  const c = gameState && gameState.players[p] && gameState.players[p].mz[idx];
  const mats = c && Array.isArray(c.xyz) ? c.xyz : [];
  if(!c || !mats.length){ showToast("エクシーズ素材がありません"); return; }
  if(mats.length === 1){
    closeSheet();
    act({type:'FX_DETACH', player:p, mzIndex:idx, reason:'効果コスト'});
    return;
  }
  openPick(`${cardName(c)}：取り除く素材`, `素材${mats.length}枚`,
    mats.map((m,i)=>({
      label:labelOf(m),
      sub:`${i+1}枚目 / UID ${m.uid||''}`,
      card:m,
      onPick:()=>{
        closeSheet();
        act({type:'FX_DETACH', player:p, mzIndex:idx, materialIndex:i, materialUid:m.uid, reason:'効果コスト'});
      }
    }))
  );
}

/* 場のカードの効果を自動処理。セット状態なら表にしてから発動 */
function activateFromZone(p, zone, idx){
  const P = gameState.players[p];
  const c = zoneCard(P, zone, idx); if(!c) return;
  const db = dbOf(c);
  const nm = db.n||"";
  const scU31 = CARD_SCRIPTS[nm];
  /* S03-U31 (C-S03-07 MANUAL): 表にする前に「カードの発動」かを判定する（セット状態からの発動もカードの発動）。 */
  const cardActOnlyU31 = (typeof cardActivationOnlyV32==='function')
    && cardActivationOnlyV32(nm, scU31, db, zone, c, {});
  closeSheet();
  /* S03-U36 (C-S03-28 MANUAL): 表にする前の Journal 位置。効果の処理を始める時に控えとして使う。 */
  const prepSeqU36 = (typeof V41_ACTION_SEQ!=='undefined') ? V41_ACTION_SEQ : 0;
  if(c.face==='down'){
    act({type:"FX_SET_STATE", player:p, zone, index:idx, face:"up", reason:"発動"});
  }
  const keep = (db.sub==="永続" || db.sub==="フィールド" || db.sub==="装備" || db.k==='m');
  if(cardActOnlyU31){
    /* S03-U31: カードの発動だけが成立する。効果・コスト・回数制限は使わない。 */
    logIt(gameState, `<b>${nm}</b> を発動（カードの発動：効果は発動していません）`);
    render(); return;
  }
  logIt(gameState, `<b>${nm}</b> の効果を発動`);
  render();
  /* S03-U31: P1.1（activationV11）のカードは、モード選択とコストを正しく通すため発動パイプラインを使う。 */
  if(scU31 && typeof scU31.activationV11==='function' && typeof prepareDuelActivation==='function'){
    askChain(`${nm} の効果発動`, ()=>{ prepareDuelActivation(nm, p, zone, idx, {noPriority:true}); render(); });
    return;
  }
  /* S03-U36: 効果を処理している間（legacy のコスト・対象選択待ちを含む）だけ控えを持つ。askChain の応答待ちは対象外。 */
  if(typeof noteManualActivationPromptS03==='function') noteManualActivationPromptS03(p, c, nm, prepSeqU36);   /* S03-U37 */
  askChain(`${nm} の効果発動`, ()=>{
    if(typeof clearManualActivationPromptS03==='function') clearManualActivationPromptS03();
    if(typeof beginActivationPrepS03==='function') beginActivationPrepS03(p, c, nm, prepSeqU36);
    runEffect(p, nm, {zone, index:idx, keep});
    if(typeof settleActivationPrepS03==='function') settleActivationPrepS03();
    render();
  });
}
function zAct(type,p,zone,index){
  const card=zoneCard(gameState.players[p],zone,index);
  act({type, player:p, zone, index});
  if(type==='TOGGLE_POS' && card && typeof notifyKarakuriPositionChangeV350==='function') notifyKarakuriPositionChangeV350(p,card);
  /* S03-U234: a manual position change queues onPositionChange (engine/19) but nothing drained it, so 「表示形式が変わった時」 triggers
     (ブレードラビット, ヤドカリュー, …) never opened in a DUEL. Open them now, as a summon does, unless a chain / trigger window is already open. */
  if(type==='TOGGLE_POS' && PLAY_MODE===PLAY_MODES.DUEL && (gameState.deferredEvents||[]).length && !gameState.chain.length
     && !gameState.processorCurrent && !(typeof EVT_V2_STATE!=='undefined' && EVT_V2_STATE) && typeof flushDeferredEventsV2==='function') flushDeferredEventsV2();
  closeSheet();
}

/* 状態フラグを手で反転させる */
function zFlag(p, zone, idx, key){
  act({type:"FX_SET_STATE", player:p, zone, index:idx, flag:key,
       reason:"状態を手動で変更"});
  openZone(p, zone, idx);
}

/* レベルを手で増減する（スポーア・レベル・スティーラーの手動処理用） */
function openLvMenu(p, zone, idx){
  const P = gameState.players[p];
  const c = zoneCard(P, zone, idx); if(!c) return;
  const cur = curLV(c);
  const row = [-3,-2,-1,1,2,3].map(d=>
    `<div class="act" onclick="zLv(${p},'${zone}',${idx},${d})">${d>0?'+':''}${d}</div>`).join("");
  sheet.innerHTML = `<div class="grip"></div>
    <h3 style="margin-bottom:4px">${labelOf(c)} のレベル</h3>
    <div class="meta" style="margin-bottom:10px">現在 レベル${cur}（元々 ${dbOf(c).lv||0}）</div>
    <div class="act-grid">${row}</div>
    <div class="act-grid" style="margin-top:8px">
      <div class="act warn" onclick="zLvReset(${p},'${zone}',${idx})">元に戻す</div>
    </div>
    <button class="close" onclick="openZone(${p},'${zone}',${idx})">戻る</button>`;
  veil.classList.add("on");
}
function zLv(p, zone, idx, d){
  act({type:"FX_SET_STATE", player:p, zone, index:idx, lvDelta:d,
       reason:"レベルを手動で変更"});
  openLvMenu(p, zone, idx);
}
function zLvReset(p, zone, idx){
  act({type:"FX_SET_STATE", player:p, zone, index:idx, lvReset:true,
       reason:"レベルを元に戻す"});
  openLvMenu(p, zone, idx);
}

/* デッキの上／下を指定して戻す */
function zMoveDeck(p, zone, idx, where){
  act({type:"MOVE", player:p, from:zone, fromIndex:idx, to:'deck',
       face:'down', deckPos: where});
  closeSheet();
}

/* 同じプレイヤーの別ゾーンへ移す（モンスターゾーン ↔ 魔法＆罠ゾーン） */
function zMoveZone(p, zone, idx, to){
  const P = gameState.players[p];
  if(to !== 'field' && (P[to]||[]).length >= ZONE_LIMITS[to]){
    alert(`${zoneJp(to)}は${ZONE_LIMITS[to]}枚まで`); return;
  }
  if(to === 'field' && P.field){ alert("フィールドゾーンが埋まっています"); return; }
  const c = zoneCard(P, zone, idx);
  act({type:"MOVE", player:p, from:zone, fromIndex:idx, to,
       face: c ? c.face : 'up'});
  closeSheet();
}

/* コントロールを移す。until:'endPhase' なら自分のエンドフェイズに戻る。 */
function zControl(p, zone, idx, toPlayer, until){
  const P = gameState.players[p];
  const c = zoneCard(P, zone, idx); if(!c) return;
  const dstZone = (zone === 'field') ? 'field' : zone;
  const D = gameState.players[toPlayer];
  if(dstZone !== 'field' && (D[dstZone]||[]).length >= ZONE_LIMITS[dstZone]){
    alert(`${nameOf(toPlayer)}の${zoneJp(dstZone)}が一杯です`); return;
  }
  if(dstZone === 'field' && D.field){ alert("相手のフィールドゾーンが埋まっています"); return; }
  act({type:"FX_CONTROL", player:p, zone, index:idx, toPlayer,
       reason:"手動でコントロール変更", until});
  closeSheet();
}

/* 一時的に移っていたコントロールを持ち主へ戻す */
function zControlBack(p, zone, idx){
  const P = gameState.players[p];
  const c = zoneCard(P, zone, idx); if(!c) return;
  const back = (c.controlReturnTo != null) ? c.controlReturnTo
             : (c.owner != null ? c.owner : (p===0?1:0));
  act({type:"FX_CONTROL", player:p, zone, index:idx, toPlayer:back,
       reason:"コントロールを持ち主に戻す"});
  closeSheet();
}

/* 相手のカードとコントロールを入れ替える（強制転移などを手動で行う） */
function openSwapMenu(p, zone, idx){
  const P = gameState.players[p];
  const mine = zoneCard(P, zone, idx); if(!mine) return;
  const foe = p===0?1:0;
  const cands = API.fieldCards({zone:'mz', player:foe, filter:x=>x.card});
  if(!cands.length){ showToast("相手フィールドにモンスターがいません"); return; }
  API.selectCard(`${labelOf(mine)} と入れ替える相手のモンスター`, cands, x=>{
    const theirs = x.card;
    API.changeControl({card:mine},   foe, "コントロールの入れ替え");
    API.changeControl({card:theirs}, p,   "コントロールの入れ替え");
    render();
  }, "お互いのコントロールを入れ替えます");
}
function zMove(p,zone,idx,to){
  const P=gameState.players[p];
  if(ZONE_LIMITS[to] && to!=="field" && P[to].length>=ZONE_LIMITS[to]){ alert(`${zoneJp(to)}は${ZONE_LIMITS[to]}枚まで`); return; }
  if(!confirmGraveLock(zone, to)) return;
  act({type:"MOVE", player:p, from:zone, fromIndex:idx, to, face:to==="deck"?"down":"up"});
  closeSheet();
}

/* 手動で墓地からカードを動かすとき、ネクロバレーが適用されていれば確認する。
   効果によるものかコストによるものかはアプリ側で判断できないので、
   止めずに注意だけ出してプレイヤーに委ねる。 */
function confirmGraveLock(from, to){
  if(from !== 'grave') return true;
  if(!necrovalleyLocked()) return true;
  const msg = (to === 'banish')
    ? "ネクロバレーが適用されています。墓地のカードは除外できません。\nそれでも動かしますか？"
    : "ネクロバレーが適用されています。効果で墓地のカードを動かすことはできません。\n（コストや召喚条件による移動、墓地で発動する効果は可能です）\nそれでも動かしますか？";
  return confirm(msg);
}

/* ================= 攻撃（戦闘専用UI） ================= */
function beginAttack(p, atkIdx){
  if(PLAY_MODE===PLAY_MODES.DUEL){
    const c=gameState.players[p]&&gameState.players[p].mz[atkIdx];
    if(c){ ensureCardUid(gameState,c); battlePickAttackerV29(c.uid); }
    return;
  }
  const oppP = gameState.players[p===0?1:0];
  const atkCard0 = gameState.players[p].mz[atkIdx];
  const atkDB = dbOf(atkCard0);
  const aATK = curATK(atkCard0);
  // 対象候補：相手モンスター（表側／裏側とも）＋直接攻撃（相手モンスターが0なら）
  let targets = "";
  oppP.mz.forEach((c,i)=>{
    const db=dbOf(c);
    const faceUp = c.face==='up';
    let cmp="", name;
    if(faceUp){
      const defending = c.pos==='def';
      const dVal = defending ? curDEF(c) : curATK(c);
      name = `${db.n}`;
      // 結果プレビュー
      let out;
      if(defending){
        out = aATK>dVal ? "破壊" : aATK<dVal ? `反射${dVal-aATK}` : "変化なし";
      } else {
        out = aATK>dVal ? `破壊+${aATK-dVal}` : aATK<dVal ? `自壊-${dVal-aATK}` : "相打ち";
      }
      cmp = `<span style="font-size:10px;color:var(--text-dim)"> ${defending?'守':'攻'}${dVal} → <b style="color:var(--gold-hi)">${out}</b></span>`;
    } else {
      name = "裏側のカード";
      cmp = `<span style="font-size:10px;color:var(--text-dim)"> 裏守備（要リバース処理）</span>`;
    }
    targets += `<div class="act" style="justify-content:flex-start;text-align:left" onclick="doAttack(${p},${atkIdx},${i})">${name}${cmp}</div>`;
  });
  const directOK = oppP.mz.length===0 && !cannotDirectAttackNow(atkCard0);
  const direct = directOK
    ? `<div class="act" onclick="doAttack(${p},${atkIdx},'direct')">直接攻撃（${aATK}ダメージ）</div>`
    : `<div class="act" style="opacity:.4">直接攻撃（${cannotDirectAttackNow(atkCard0)?'このモンスターは不可':'相手モンスターがいる'}）</div>`;
  // 攻撃宣言時は相手の伏せに注意（1103はここが読み合いの山場）
  const rp = p===0?1:0;
  const rn = reactableCards(rp).length;
  const warn = rn
    ? `<div class="react-warn" onclick="openReact()">
         ${nameOf(rp)}は伏せカードを${rn}枚持っています — タップして割り込み
       </div>` : "";
  sheet.innerHTML = `<div class="grip"></div>
    <div class="bt-row"><span class="a-atk">${atkDB.n}</span><span class="vs">攻 ${aATK} で攻撃</span></div>
    ${warn}
    <div class="meta" style="margin-bottom:10px;text-align:center">対象を選ぶと戦闘処理・ダメージまで自動反映します（1103準拠）</div>
    ${targets? `<div class="act-label">相手モンスターへ</div><div class="act-grid wide">${targets}</div>`:""}
    <div class="act-label">プレイヤーへ</div><div class="act-grid">${direct}</div>
    <button class="close" onclick="closeSheet()">やめる</button>`;
  veil.classList.add("on");
}


/* 相手が発動できるカードを持っていれば、その場で促す。
   自分のターン中に相手が手札誘発を撃つ機会を逃さないための導線。 */
function offerReactAfter(foe){
  if(!ASK_CHAIN) return;
  const n = reactableCards(foe).length;
  if(!n) return;
  setTimeout(()=>{
    sheet.innerHTML = `<div class="grip"></div>
      <h3 style="margin-bottom:6px">${nameOf(foe)} の割り込み</h3>
      <div class="meta" style="margin-bottom:12px">
        <b style="color:var(--trap)">${nameOf(foe)}</b> は発動できるカードを ${n}枚 持っています。</div>
      <div class="act-grid wide">
        <div class="act" style="background:var(--trap);color:#120a1f;border-color:var(--trap)"
             onclick="closeSheet();openReactFor(${foe})">発動する</div>
        <div class="act" onclick="closeSheet()">発動しない</div>
      </div>`;
    veil.classList.add("on");
  }, 120);
}

/* ダメージ計算後の誘発をまとめて処理する。
   直前の戦闘内容(gs.lastBattle)を見て、該当するカードだけ候補に出す。 */
/* 戦闘に参加したカードか判定する。
   破壊されて墓地に行くと実体が変わるので、名前と持ち主でも照合する。 */
function inBattle(ctx, b){
  if(!b) return false;
  if(b.atkCard===ctx.card || b.defCard===ctx.card) return true;
  const nm = cardName(ctx.card);
  if(ctx.p===b.atkOwner && nm===b.atkName && b.destroyedAtk) return true;
  if(ctx.p===b.defOwner && nm===b.defName && b.destroyedDef) return true;
  if(ctx.player===b.atkOwner && nm===b.atkName && b.destroyedAtk) return true;
  if(ctx.player===b.defOwner && nm===b.defName && b.destroyedDef) return true;
  return false;
}

/* ダメージステップ中の誘発候補を集めて提示する。
   stepKey ごとに担当する効果が違うので、二重提示にならないよう振り分ける。
     'start'  ① ダメージステップ開始時（カタストル・グラン・モール等）
     'after'  ④ ダメージ計算後（ゴーズ・メロウガイスト等、戦闘ダメージ起点）
     'leave'  ⑤ 追加誘発解決（戦闘破壊した/された・墓地へ送られた・リクルーター）
   スクリプトは dsTiming で宣言する。未指定は ⑤ を既定とする。 */
function afterDamageStep(stepKey){
  const want = stepKey || 'leave';
  const lb = gameState.lastBattle;
  if(!lb) return false;
  const cands = [];
  [0,1].forEach(p=>{
    const P = gameState.players[p];
    const scan = (zone, arr)=>{
      (arr||[]).forEach((c,i)=>{
        if(!c) return;
        const nm = dbOf(c).n;
        const sc = CARD_SCRIPTS[nm];
        const h = sc && sc.passive && sc.passive.onDamageStep;
        if(!h) return;
        if((sc.dsTiming || 'leave') !== want) return;
        const ctx = makeContext(p, c, zone, i, "onDamageStep", {battle:lb, step:want});
        let ok=false;
        try{ ok = h(ctx); }catch(e){ ok=false; }
        if(ok) cands.push({p, zone, index:i, card:c, name:nm});
      });
    };
    scan('mz', P.mz);
    scan('grave', P.grave);
  });
  if(!cands.length){ return false; }
  setTimeout(()=>{
    const rows = cands.map((c,i)=>
      `<div class="act pick-row" onclick="__dsPick(${i})">
         <span class="pk-nm">${c.name}</span>
         <span class="pk-sub">${nameOf(c.p)}・${zoneJp(c.zone)}</span>
       </div>`).join("");
    sheet.innerHTML = `<div class="grip"></div>
      <h3 style="margin-bottom:4px">${dsInfo(want).jp}</h3>
      <div class="meta" style="margin-bottom:10px">誘発する効果があります。発動しますか？</div>
      <div class="pick-list">${rows}</div>
      <button class="close" onclick="__dsSkip()">発動しない</button>`;
    DS_CANDS = cands;
    veil.classList.add("on");
  }, 60);
  return true;
}
let DS_CANDS=[], DS_AFTER=null;
function __dsPick(i){
  const c = DS_CANDS[i]; DS_CANDS=[];
  closeSheet();
  if(c) runScript(c.name, c.p, c.zone, c.index, {battle:gameState.lastBattle});
  const f=DS_AFTER; DS_AFTER=null; if(f) f();
}
function __dsSkip(){
  DS_CANDS=[]; closeSheet();
  const f=DS_AFTER; DS_AFTER=null; if(f) f();
}


function doAttack(p, atkIdx, target){
  if(PLAY_MODE===PLAY_MODES.DUEL){ closeSheet();
    /* S03-U302: through the attack-declaration cost (engine/1ZZQ); attacker and target by uid */
    const ahS03=gameState.players[p].mz[atkIdx], thS03=(target==='direct')?null:gameState.players[p===0?1:0].mz[target];
    if(ahS03&&typeof requestAttackS03==='function'){ ensureCardUid(gameState,ahS03); if(thS03) ensureCardUid(gameState,thS03);
      requestAttackS03({p,index:atkIdx,card:ahS03},(target==='direct')?'direct':(thS03?thS03.uid:'direct')); return; }
    requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx,target}); return; }
  closeSheet();
  const atkName = cardName(gameState.players[p].mz[atkIdx]) || "モンスター";
  const foe = p===0?1:0;
  gameState.attackNegated = false;
  const go = ()=>{
    if(gameState.players[p].mz[atkIdx]) gameState.players[p].mz[atkIdx].attacked = true;
    if(gameState.attackNegated){
      logIt(gameState, `${atkName} の攻撃は無効`);
      gameState.attackNegated = false; gameState.battle = null; render(); return;
    }
    startBattle(p, atkIdx, target); renderBattle();
  };
  EVT_AFTER = go;
  if(!emitEvent("onAttackDeclare", {player:p, atkIdx, target, name:atkName})){
    EVT_AFTER = null; askChain(`${atkName} の攻撃宣言`, go);
  }
}

/* ================= チェーン（手動・スペルスピード判定） ================= */
/* SS判定：カウンター罠=3、速攻魔法/通常罠/永続罠=2、それ以外(通常/永続/装備/フィールド魔法・モンスター効果)=1 */
function spellSpeed(db){
  if(db.k==='t'){ return db.sub==='カウンター' ? 3 : 2; }      // 罠は最低SS2、カウンターはSS3
  if(db.k==='s'){ return db.sub==='速攻' ? 2 : 1; }            // 速攻魔法のみSS2
  return 1;                                                     // モンスター効果は簡易的にSS1扱い
}
/* チェーンに新しく積めるか：既存の一番上のSS以上でなければ乗せられない */
function canChainOnto(ss){
  if(!gameState.chain.length) return true;
  const top = gameState.chain[gameState.chain.length-1];
  return ss >= top.ss;
}
function chainAddFromZone(p, zone, idx){
  const c = zoneCard(gameState.players[p], zone, idx);
  const db = dbOf(c);
  const ss = spellSpeed(db);
  if(!canChainOnto(ss)){
    alert(`スペルスピードが足りません（このカードSS${ss} / 現在チェーン上はSS${gameState.chain[gameState.chain.length-1].ss}）`);
    return;
  }
  // 表側でなければ発動時に表にする（セット→発動）
  if(c.face==='down'){ c.face='up'; }
  act({type:"CHAIN_ADD", player:p, cardId:c.id, uid:ensureCardUid(gameState,c), name:db.n, ss, from:zone, index:idx});
  closeSheet();
  openChain();
}
function chainAddFromHand(i){
  const p = gameState.activePlayer;
  const c = gameState.players[p].hand[i];
  const db = dbOf(c);
  const ss = spellSpeed(db);
  if(!canChainOnto(ss)){
    alert(`スペルスピードが足りません（このカードSS${ss}）`);
    return;
  }
  act({type:"CHAIN_ADD", player:p, cardId:c.id, uid:ensureCardUid(gameState,c), name:db.n, ss, from:"hand", index:i});
  closeSheet();
  openChain();
}
/* チェーンパネル：積んだ順を見せ、逆順に1つずつ解決。
   次に解決するリンク（＝一番上＝末尾）を強調し、次のアクションを明示する。 */
function openChain(){
  const ch = gameState.chain;
  if(!ch.length){
    sheet.innerHTML = `<div class="grip"></div><h3>チェーン</h3>
      <div class="act-label">チェーンは積まれていません</div>
      <div class="meta" style="margin-bottom:12px">場・手札のカードの「効果を発動（チェーンへ）」で積みます。<br>速攻魔法・罠は相手ターンでも積めます（スペルスピード判定あり）。</div>
      <button class="close" onclick="closeSheet()">閉じる</button>`;
    veil.classList.add("on"); return;
  }
  const topIdx = ch.length-1;              // 次に解決するリンク
  const topLink = ch[topIdx];

  // チェーン1が下、最後に積んだリンクが上。次に解決するもの＝上を resolving 表示。
  let rows = "";
  for(let i=ch.length-1;i>=0;i--){
    const link = ch[i];
    const resolving = i===topIdx;
    const order = resolving ? "次に解決" : `${topIdx-i+1}番目に解決`;
    rows += `<div class="chain-link ${resolving?'resolving':''}">
      <span class="cl-no">${i+1}</span>
      <span class="cl-nm">${link.name}</span>
      <span class="cl-ss">SS${link.ss}</span>
      <span class="cl-who">${nameOf(link.player)}</span>
      <span class="cl-tag">${order}</span>
    </div>`;
  }

  const nextHint = `<div class="chain-next-hint">▶ 次に解決：チェーン${topIdx+1}「${topLink.name}」<br><span style="font-size:10px;color:var(--text-dim);font-weight:400">効果は手動で処理してから下のボタンで解決</span></div>`;

  sheet.innerHTML = `<div class="grip"></div>
    <h3 style="margin-bottom:8px">チェーン処理（${ch.length}）</h3>
    <div class="meta" style="margin-bottom:8px">チェーン1が最初に積まれた効果。解決は<b style="color:var(--gold-hi)">上（最後）から逆順</b>に1つずつ。</div>
    <div class="chain-list">${rows}</div>
    ${nextHint}
    <div class="act-grid wide">
      <div class="act" style="background:var(--spell);color:#0d0a06;border-color:var(--spell)" onclick="resolveChainStep()">チェーン${topIdx+1}「${topLink.name}」を解決 ▸</div>
    </div>
    ${chainManualBtn(topLink)}
    <div class="act-label">その他</div>
    <div class="act-grid">
      <div class="act" onclick="closeSheet()">保留（閉じる）</div>
      <div class="act warn" onclick="if(confirm('チェーンを全て取り消します')){act({type:'CHAIN_CLEAR'});closeSheet();}">全て取消</div>
    </div>`;
  veil.classList.add("on");
}
/* 1つ解決して、残りがあれば次の解決画面を続けて出す（テンポ重視） */
/* スクリプトが無いリンクには、テキスト解析か手動処理の入口を出す */
function chainManualBtn(link){
  if(CARD_SCRIPTS[link.name]) return "";
  const card = chainLinkCard(link);
  if(!card) return "";
  const db = dbOf(card);
  const loc = (link.from === 'field') ? {zone:'field', index:0}
            : {zone:link.from, index:(gameState.players[link.player][link.from]||[]).indexOf(card)};
  const steps = parseEffectSteps(db.e||'').length;
  return `<div class="act-label">効果の処理</div>
    <div class="act-grid">
      ${steps?`<div class="act fx" onclick="closeSheet();runAutoText(${jsStr(link.name)},${link.player},'${loc.zone}',${loc.index})">⚡ テキストから処理…</div>`:""}
      <div class="act" onclick="closeSheet();openPrimitives(${link.player},'${loc.zone}',${loc.index},${jsStr(link.name)})">手動で効果処理…</div>
    </div>`;
}

/* チェーンリンクのカード実体を探す。
   解決までに他のカードが動いて添字がずれることがあるので、
   カードIDで照合しながら探す。 */
function chainLinkCard(link){
  if(link.uid!=null){
    const hit=findCardByUid(link.uid);
    if(hit) return hit.card;
  }
  // 旧セーブ互換：uid が無いリンクだけ従来方式へフォールバック
  const P = gameState.players[link.player];
  const zone = link.from;
  if(!zone) return null;
  if(zone === 'field') return P.field || null;
  const arr = P[zone] || [];
  if(arr[link.index]) return arr[link.index];
  return null;
}

/* 解決を終えたチェーンリンクのカードを、行くべき場所へ送る。
   通常魔法・通常罠・速攻魔法は墓地へ。
   永続・フィールド・装備は場に残る。モンスターの効果も場に残る。 */
function chainLinkAfterResolve(link){
  const card = chainLinkCard(link);
  if(!card) return;
  const db = dbOf(card);
  if(db.k === 'm') return;                               // モンスターの効果は場に残る
  // 永続魔法・永続罠・フィールド魔法・装備魔法は場に残る。
  // 通常魔法・通常罠・速攻魔法・カウンター罠は墓地へ送られる。
  if(['永続','フィールド','装備'].indexOf(db.sub) >= 0) return;
  const loc = (link.from === 'field')
    ? {p:link.player, zone:'field', index:0}
    : (function(){
        const arr = gameState.players[link.player][link.from] || [];
        const i = arr.indexOf(card);
        return i >= 0 ? {p:link.player, zone:link.from, index:i} : null;
      })();
  if(!loc) return;
  act({type:"FX_SELF_TO_GRAVE", player:loc.p, zone:loc.zone, index:loc.index});
}

/* チェーンの一番上を解決する。
   スクリプトがあれば実行し、無ければテキスト解析か手動処理に回す。
   処理が終わったらカードを墓地へ送る。 */
function resolveChainStep(){
  const ch = gameState.chain;
  if(!ch.length){ closeSheet(); return; }
  const link = ch[ch.length-1];
  const card = chainLinkCard(link);
  const sc = CARD_SCRIPTS[link.name];

  const finish = ()=>{
    chainLinkAfterResolve(link);
    render();
    if(gameState.chain.length) openChain(); else closeSheet();
  };

  act({type:'CHAIN_RESOLVE_TOP'});     // 先にリンクを取り除く

  if(sc && sc.resolve && card){
    // スクリプトで処理する。処理の完了後に墓地送りを行う。
    const loc = locateCard(card) ||
      (function(){ const P=gameState.players[link.player]; const i=(P[link.from]||[]).indexOf(card);
        return i>=0 ? {p:link.player, zone:link.from, index:i} : null; })();
    if(loc){
      CHAIN_AFTER = finish;
      runScript(link.name, loc.p, loc.zone, loc.index, {fromChain:true});
      return;
    }
  }
  finish();
}

/* スクリプトの解決が終わったらチェーン側の後始末を呼ぶ */
let CHAIN_AFTER = null;
function runChainAfter(){
  const f = CHAIN_AFTER; CHAIN_AFTER = null;
  if(f) f();
}

/* 山札系（デッキ/墓地/除外/EX）を開く */
function pileDuelActionsV370(p,zone,i){
  const P=gameState.players[p], c=(P[zone]||[])[i]; if(!c) return [];
  const db=dbOf(c), nm=db.n||'', sc=CARD_SCRIPTS[nm], out=[];
  if(sc&&sc.summonProcedure&&summonProcedureZonesV370(sc.summonProcedure).includes(zone)){
    const L=strictSummonProcedureLegality(nm,p,zone,i);
    if(L.ok) out.push({id:'specialSummonProcedure',label:'特殊召喚',cls:'gold',run:`closeSheet();runSummonProcedure(${jsStr(nm)},${p},'${zone}',${i})`});
  }
  if(sc&&typeof sc.resolve==='function'&&canActivateFromZone(db,zone)){
    const L=strictScriptLegalityV2(nm,p,zone,i,{});
    if(L.ok) out.unshift({id:'effect',label:`⚡ ${zoneJp(zone)}で効果を発動`,cls:'fx',run:`closeSheet();duelActivateFromZone(${p},'${zone}',${i})`});
  }
  return out;
}

/* 山札系（デッキ/墓地/除外/EX）を開く。
   v3.7.0 DUELモードはADS同様「公開情報を見る／合法な操作だけ行う」。
   任意移動・まとめ移動・デッキ覗きはMANUAL/DEVに限定する。 */
let PILE_PEEK = false;      // MANUAL/DEVで相手の山札の中身を確認しているか
function openPile(p, zone){
  const P = gameState.players[p];
  const list = P[zone]||[];

  if(PLAY_MODE===PLAY_MODES.DUEL && zone==='deck'){
    sheet.innerHTML=`<div class="grip"></div><h3>${nameOf(p)} · デッキ（${list.length}）</h3>
      <div class="legal-note">DUELモードではデッキ内容は非公開です。サーチ・墓地送り・デッキトップ確認など、カード効果で必要になった時だけエンジンが候補を表示します。</div>
      <button class="close" onclick="closeSheet()">閉じる</button>`;
    veil.classList.add('on'); return;
  }
  if(PLAY_MODE===PLAY_MODES.DUEL && zone==='ex' && p!==gameState.activePlayer){
    sheet.innerHTML=`<div class="grip"></div><h3>${nameOf(p)} · EXデッキ（${list.length}）</h3>
      <div class="legal-note">相手のEXデッキ内容は非公開です。</div>
      <button class="close" onclick="closeSheet()">閉じる</button>`;
    veil.classList.add('on'); return;
  }

  const order=list.map((c,i)=>({c,i}));
  if(zone==='grave'||zone==='banish')order.reverse();
  let items=order.map(({c,i},rowIndex)=>{
    const db=dbOf(c), hidden=(zone==='deck'&&p!==gameState.activePlayer&&!PILE_PEEK), nm=hidden?'（非公開）':(db.n||'?');
    const sc=hidden?null:CARD_SCRIPTS[db.n];
    const legal=(!hidden&&PLAY_MODE===PLAY_MODES.DUEL)?pileDuelActionsV370(p,zone,i):[];
    const canFx=PLAY_MODE===PLAY_MODES.DUEL?legal.some(a=>a.id==='effect'):(!hidden&&canActivateFromZone(db,zone));
    const canSS=PLAY_MODE===PLAY_MODES.DUEL&&legal.some(a=>a.id==='specialSummonProcedure');
    const recent=(zone==='grave'||zone==='banish')?rowIndex===0:(zone==='deck'?i===0:false);
    const sub=hidden?'デッキのカード':(db.k==='m'?`${db.at||''} ${db.ra||''}${db.lv?` Lv${db.lv}`:''}`:`${db.k==='s'?'魔法':'罠'}${db.sub?` / ${db.sub}`:''}`);
    const thumb=hidden?`<span class="pile-thumb2 back">CARD</span>`:`<span class="pile-thumb2"><img src="${IMG_BASE}${db.c}.webp" onerror="this.style.display='none'"></span>`;
    const tags=[recent?`<span class="pile-badge top">${zone==='deck'?'TOP':'最新'}</span>`:'',canFx?`<span class="pile-badge fx">⚡効果</span>`:'',canSS?`<span class="pile-badge top">SS</span>`:'',(!hidden&&sc)?`<span class="pile-badge">AUTO</span>`:''].filter(Boolean).join('');
    return `<button class="pile-row ${recent?'recent':''}" onclick="pileAct(${p},'${zone}',${i})">${thumb}<span class="pile-info"><span class="pile-name">${nm}</span><span class="pile-meta">${sub}</span></span><span class="pile-badges">${tags}</span></button>`;
  }).join('')||`<div class="meta">カードなし</div>`;
  const head = `<div class="grip"></div><h3 style="margin-bottom:10px">${nameOf(p)} · ${zoneJp(zone)}（${list.length}）</h3>`;
  const manual=PLAY_MODE!==PLAY_MODES.DUEL;
  const deckTools = manual&&zone==='deck'
    ? `<div class="act" onclick="act({type:'DRAW',player:${p},n:1});closeSheet()">1枚ドロー</div>
       <div class="act" onclick="act({type:'SHUFFLE',player:${p}});openPile(${p},'deck')">シャッフル</div>` : '';
  const peek = manual&&(zone==='deck'&&p!==gameState.activePlayer)
    ? `<div class="act ${PILE_PEEK?'':'warn'}" onclick="PILE_PEEK=!PILE_PEEK;openPile(${p},'${zone}')">${PILE_PEEK?'中身を隠す':'中身を見る'}</div>` : '';
  const bulk = manual&&list.length ? `
       <div class="act" onclick="pileBulk(${p},'${zone}','grave')">全て墓地へ</div>
       <div class="act" onclick="pileBulk(${p},'${zone}','banish')">全て除外</div>
       <div class="act" onclick="pileBulk(${p},'${zone}','deck')">全てデッキへ戻す</div>` : '';
  const tools=(deckTools||peek||bulk)?`<div class="act-grid" style="margin-bottom:10px">${deckTools}${peek}${bulk}</div>`:'';
  const hint=(zone==='grave'||zone==='banish')?'新しいカードを上に表示':(zone==='deck'?'デッキトップを上に表示':'カードをタップして操作');
  sheet.innerHTML=head+tools+`<div class="act-label">${hint}</div><div class="pile-list">${items}</div><button class="close" onclick="closeSheet()">閉じる</button>`;
  veil.classList.add('on');
}
function pileAct(p, zone, i){
  const c=(gameState.players[p][zone]||[])[i]; if(!c)return;
  const db=dbOf(c), nm=db.n||'';
  if(PLAY_MODE===PLAY_MODES.DUEL){
    const acts=pileDuelActionsV370(p,zone,i);
    sheet.innerHTML=metaHead(db)+`<div class="legal-head"><span class="lh-title">LEGAL ACTIONS</span><span class="lh-auto">${automationStatus(db).jp}</span></div>`+
      legalActionsHTML(acts)+`<div class="legal-note">DUELモードでは任意のゾーン移動を非表示にしています。裁定再現や未実装処理が必要な場合だけMANUAL/DEVを使用してください。</div>`+
      `<button class="close" onclick="openPile(${p},'${zone}')">戻る</button>`;
    veil.classList.add('on'); return;
  }
  const isMon=db.k==='m', sc=CARD_SCRIPTS[nm], canHere=canActivateFromZone(db,zone);
  const graveFx=canHere?(sc?`<div class="act fx" onclick="closeSheet();runScript(${jsStr(nm)},${p},'${zone}',${i})">⚡ ${zoneJp(zone)}で効果を発動</div>`:`<div class="act fx" onclick="closeSheet();openPrimitives(${p},'${zone}',${i},${jsStr(nm)})">⚡ ${zoneJp(zone)}で効果を発動（手動）</div>`):((!sc&&parseEffectSteps(db.e||'').length)?`<div class="act fx" onclick="closeSheet();runAutoText(${jsStr(nm)},${p},'${zone}',${i})">⚡ テキストから処理…</div>`:(zone==='grave'&&hasEffect(nm))?`<div class="act fx" onclick="closeSheet();runEffect(${p},${jsStr(nm)},{zone:'grave',index:${i},keep:true})">⚡ 墓地で効果を発動</div>`:'');
  const foe=p===0?1:0;
  const ssBtn=isMon?`<div class="act" onclick="closeSheet();act({type:'FX_SPECIAL_SUMMON',player:${p},from:'${zone}',fromIndex:${i},pos:'atk',reason:'${zoneJp(zone)}から'})">特殊召喚（攻撃）</div><div class="act" onclick="closeSheet();act({type:'FX_SPECIAL_SUMMON',player:${p},from:'${zone}',fromIndex:${i},pos:'def',reason:'${zoneJp(zone)}から'})">特殊召喚（守備）</div><div class="act" onclick="pileMove(${p},'${zone}',${i},'mz','down','def')">裏側守備でセット</div><div class="act" onclick="pileToFoe(${p},'${zone}',${i},'mz')">${nameOf(foe)}の場へ特殊召喚</div>`:'';
  sheet.innerHTML=metaHead(db)+(graveFx?`<div class="act-label">効果</div><div class="act-grid wide">${graveFx}</div>`:'')+(ssBtn?`<div class="act-label">召喚</div><div class="act-grid">${ssBtn}</div>`:'')+`<div class="act-label">${zoneJp(zone)}から移動</div><div class="act-grid"><div class="act" onclick="pileMove(${p},'${zone}',${i},'hand')">手札へ</div><div class="act" onclick="pileMove(${p},'${zone}',${i},'sz','up')">魔法罠へ</div><div class="act" onclick="pileMove(${p},'${zone}',${i},'grave')">墓地へ</div><div class="act" onclick="pileMove(${p},'${zone}',${i},'banish')">除外へ</div><div class="act" onclick="pileMove(${p},'${zone}',${i},'deck')">デッキトップへ</div><div class="act" onclick="pileMoveDeck(${p},'${zone}',${i},'bottom')">デッキボトムへ</div><div class="act" onclick="pileMove(${p},'${zone}',${i},'sz','down')">裏側でセット（魔法罠）</div>${db.sub==='フィールド'?`<div class="act" onclick="pileMove(${p},'${zone}',${i},'field','up')">フィールドゾーンへ</div>`:''}${db.ex?`<div class="act" onclick="pileMove(${p},'${zone}',${i},'ex')">EXデッキへ</div>`:''}<div class="act" onclick="pileToFoe(${p},'${zone}',${i},'hand')">${nameOf(foe)}の手札へ</div></div><button class="close" onclick="openPile(${p},'${zone}')">戻る</button>`;
  veil.classList.add('on');
}
function pileMove(p,zone,i,to,face,pos){
  const P=gameState.players[p];
  if(ZONE_LIMITS[to] && to!=="field" && P[to].length>=ZONE_LIMITS[to]){ alert(`${zoneJp(to)}は${ZONE_LIMITS[to]}枚まで`); return; }
  if(to==="field" && P.field){ alert("フィールドゾーンが埋まっています"); return; }
  if(!confirmGraveLock(zone, to)) return;
  act({type:"MOVE", player:p, from:zone, fromIndex:i, to, face:face||"up", pos:pos||"atk"});
  closeSheet();
}
/* デッキの上／下を指定して戻す */
function pileMoveDeck(p,zone,i,where){
  act({type:"MOVE", player:p, from:zone, fromIndex:i, to:'deck', face:'down', deckPos:where});
  closeSheet();
}
/* 相手側のゾーンへ直接置く（コントロールを渡した状態で出す） */
function pileToFoe(p,zone,i,to){
  const foe = p===0?1:0;
  const D = gameState.players[foe];
  if(ZONE_LIMITS[to] && (D[to]||[]).length>=ZONE_LIMITS[to]){
    alert(`${nameOf(foe)}の${zoneJp(to)}が一杯です`); return;
  }
  act({type:"MOVE", player:p, from:zone, fromIndex:i, to, toPlayer:foe,
       face:'up', pos:'atk'});
  closeSheet();
}
/* 山札のカードをまとめて動かす。全体除去のあとの後始末に使う。 */
function pileBulk(p, zone, to){
  const P = gameState.players[p];
  const n = (P[zone]||[]).length;
  if(!n) return;
  if(!confirm(`${zoneJp(zone)}の${n}枚を${zoneJp(to)}へ移しますか？`)) return;
  for(let i=n-1; i>=0; i--){
    act({type:"MOVE", player:p, from:zone, fromIndex:i, to,
         face: to==='deck' ? 'down' : 'up'});
  }
  if(to==='deck') act({type:"SHUFFLE", player:p});
  closeSheet();
}
