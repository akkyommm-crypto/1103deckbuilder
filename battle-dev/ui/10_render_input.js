/* =========================================================================
   RENDER — gameState を読んで描画するだけ
   ========================================================================= */
function render(){
  const gs = gameState;
  const view = gs.activePlayer;          // 手番プレイヤー視点
  const opp  = view===0?1:0;
  const P = gs.players[view];
  const curIdx = PHASES.findIndex(x=>x.id===gs.phase);
  const chN = gs.chain.length;

  const fp = gs.firstPlayer ?? 0;

  /* ===== 極小ステータスバー（常時表示はこれだけ） ===== */
  const rp = view===0?1:0;
  const reactN = reactableCards(rp).length;
  const warn = gs.systemFault
    ? `<span class="sb-warn trap">SYSTEM STOP</span>`
    : (gs.loser!=null)
    ? (gs.loser===-1 ? `<span class="sb-warn trap">引き分け</span>` : `<span class="sb-warn trap">${nameOf(gs.loser===0?1:0)} の勝利</span>`)
    : gs.battle
    ? `<span class="sb-battle">${dsInfo(gs.battle.step).jp}</span>`
    : (chN
        ? `<span class="sb-warn">チェーン${chN}</span>`
        : (gs.phase==="battle" && reactN ? `<span class="sb-warn trap">伏せ${reactN}</span>` : ""));
  document.getElementById("statusbar").innerHTML =
    `<span class="sb-turn">T${gs.turn} ${nameOf(view)}${view===fp?"(先)":""}</span>` +
    `<span class="sb-phase">${phaseJp(gs.phase)}</span>` +
    `<span class="mode-badge ${playModeClass(PLAY_MODE)}">${playModeJp(PLAY_MODE)}</span>${warn}` +
    `<span class="sb-lp"><span class="me">${P.lp}</span><span class="op">${gs.players[opp].lp}</span></span>`;

  /* ===== guide strip：今のフェーズ＋できること（ドック展開時のみ見える） ===== */
  document.getElementById("guide").innerHTML = guideHTML(gs, view, curIdx, chN);

  /* ===== board：相手を上、手番を下 ===== */
  document.getElementById("board").innerHTML =
    sideHTML(opp, true) + sideHTML(view, false);

  /* ===== hand（手番のみ表向き） ===== */
  // デッキも場も空＝まだ開始していない時だけ、開始への導線を出す。
  // デュエル中に手札を使い切っただけの時は邪魔なので出さない。
  const notStarted = !P.hand.length && !P.deck.length && !P.mz.length && !P.sz.length && !P.grave.length;
  document.getElementById("hand").innerHTML = P.hand.map((c,i)=>
    cardHTML(c, `hcard ${duelReadyClassV370(view,'hand',i,false)}`.trim(), `openHand(${i})`, true)
  ).join("") || (notStarted
    ? `<div class="hand-empty">
        <span>手札なし</span>
        ${(typeof selectedDeckNameS03==='function' && selectedDeckNameS03(0) && selectedDeckNameS03(1))
          ? `<button class="he-btn" onclick="deckStartConfirmS03('')">選択デッキで開始</button>` : ''}
        <button class="he-btn${(typeof selectedDeckNameS03==='function' && selectedDeckNameS03(0) && selectedDeckNameS03(1))?' ghost':''}" onclick="startRabbitOpponentDuel()">兎ラギアと対戦開始</button>
        <button class="he-btn ghost" onclick="openDeckLoad('saved')">デッキを選ぶ</button>
        ${(typeof selectedDeckNameS03==='function' && (selectedDeckNameS03(0)||selectedDeckNameS03(1)))
          ? `<span>P1：${selectedDeckLabelS03(0)} / P2：${selectedDeckLabelS03(1)}</span>` : ''}
      </div>`
    : `<div class="hand-empty"><span>手札なし</span></div>`);

  /* ===== このターンにやったこと ===== */
  const tl = document.getElementById("turnlog");
  tl.innerHTML = `<span class="tl-lab">このターン</span>` +
    (turnActions.length
      ? turnActions.slice(-12).map(c=>`<span class="tl-chip">${c}</span>`).join("")
      : `<span class="tl-empty">まだ操作なし</span>`);

  /* ===== full log ===== */
  document.getElementById("log").innerHTML = gs.log.map(l=>`<div class="li">${l.msg}</div>`).join("");

  /* ===== チェーンは常時スタック表示 ===== */
  renderChainStack(gs);

  /* ===== 下部ドック ===== */
  const pr=document.getElementById("phaseRail");
  if(pr) pr.innerHTML=phaseRailHTMLV360(gs);
  renderDock(gs, curIdx, chN);
}

/* ---- guide strip HTML ---- */
function guideHTML(gs, view, curIdx, chN){
  const P = gs.players[view];
  const loaded = P.deck.length>0 || P.hand.length>0 || P.mz.length>0 || P.sz.length>0 || P.grave.length>0;
  const phase = gs.phase;
  const R = PHASE_RULES[phase] || PHASE_RULES.main1;
  const cans = [];
  if(!loaded){
    cans.push(`<span class="g-can">テストデッキ or 保存デッキで開始</span>`);
  } else {
    if(R.draw){
      cans.push(gs.drawnThisTurn
        ? `<span class="g-can mute">ドロー済み</span>`
        : `<span class="g-can">ドロー可${gs.turn===1?"（先攻ドローあり）":""}</span>`);
    }
    if(R.normalSummon) cans.push(`<span class="g-can">通常召喚/セット</span>`);
    if(R.activateS1)   cans.push(`<span class="g-can">魔法罠 発動/セット</span>`);
    if(R.exSummon && P.ex.length) cans.push(`<span class="g-can">EX召喚可</span>`);
    if(R.attack){
      const canAtk = P.mz.some(c=>c && c.face==='up' && c.pos==='atk');
      cans.push(`<span class="g-can ${canAtk?'':'mute'}">攻撃宣言${canAtk?'':'（表側攻撃なし）'}</span>`);
    }
    // どのフェーズでも速攻魔法・罠は撃てる
    cans.push(`<span class="g-can mute">速攻魔法・罠（SS2+）</span>`);
    if(phase==="end"){
      const over = P.hand.length - 7;
      cans.push(over>0
        ? `<span class="g-can react">手札を${over}枚捨てる</span>`
        : `<span class="g-can mute">手札${P.hand.length}枚（調整不要）</span>`);
    }
    const rp = view===0?1:0;
    const rn = reactableCards(rp).length;
    if(rn) cans.push(`<span class="g-can react">${nameOf(rp)}は${rn}枚撃てる</span>`);
  }
  const chainWarn = chN
    ? `<span class="g-chainwarn">チェーン ${chN} 解決待ち</span>` : "";
  return `<span class="g-phase">${phaseJp(phase)}</span>${cans.join("")}${chainWarn}`;
}

/* v3.6.1: フェイズ全体を見失わないためのコンパクトレール。 */
function phaseShortV360(id){return ({draw:'DP',standby:'SP',main1:'M1',battle:'BP',main2:'M2',end:'EP'})[id]||id;}
function adsChainModeShortV370(){return ADS_CHAIN_MODE===ADS_CHAIN_MODES.IGNORE?'無視':ADS_CHAIN_MODE===ADS_CHAIN_MODES.ALWAYS?'常時':'自動';}
function cycleAdsChainModeV370(){
  const next=ADS_CHAIN_MODE===ADS_CHAIN_MODES.AVAILABLE?ADS_CHAIN_MODES.ALWAYS:(ADS_CHAIN_MODE===ADS_CHAIN_MODES.ALWAYS?ADS_CHAIN_MODES.IGNORE:ADS_CHAIN_MODES.AVAILABLE);
  ADS_CHAIN_MODE=next;saveAdsChainSettings();render();showToast(`CHAIN：${adsChainModeJp(next)}`);
}

function phaseRailHTMLV360(gs){
  return PHASES.map(ph=>{const cur=ph.id===gs.phase;const can=!cur&&(PLAY_MODE===PLAY_MODES.DUEL?publicPhaseTransitionAllowedC12(gs,ph.id):true);const cls=cur?'on':(can?'can':'');return `<button class="pr-btn ${cls}" ${cur||!can?'disabled':''} onclick="doPhase('${ph.id}')" title="${ph.jp}">${phaseShortV360(ph.id)}<br><span style="font-size:7px">${ph.jp}</span></button>`;}).join('');
}

/* ---- 下部ドック HTML ---- */
function renderDock(gs, curIdx, chN){
  const atEnd = gs.phase==="end";
  const nextId = (PLAY_MODE===PLAY_MODES.DUEL) ? nextPhaseIdV27() : (curIdx < PHASES.length-1 ? PHASES[curIdx+1].id : null);
  const nextPh = nextId ? phaseJp(nextId) : null;
  const prevDisabled = curIdx<=0;
  const canUndo = HISTORY.length>0;
  const P = gs.players[gs.activePlayer];
  const exN = P.ex.length;
  const inMain = (gs.phase==="main1"||gs.phase==="main2");
  const drawDone = (gs.phase==="draw" && gs.drawnThisTurn);
  const rp = gs.activePlayer===0 ? 1 : 0;
  const reactN = reactableCards(rp).length;
  // 手番側も速攻魔法などをチェーンできるので、その導線も用意する
  const myReactN = reactableCards(gs.activePlayer).length;

  /* v2.9: Battle StepはADS型Battle Command専用ドックに切り替える。 */
  const battleDock=battleDockV29(gs,canUndo,reactN,myReactN);
  if(battleDock){
    document.getElementById("dockBar").innerHTML=battleDock.bar;
    document.getElementById("dockActions").innerHTML=battleDock.actions;
    const dock=document.getElementById("dock"); if(dock) dock.className=DOCK_OPEN?"dock":"dock collapsed";
    return;
  }

  /* ===== 常時見える1行：フェーズ送り＋Undo＋展開 =====
     盤面を最大化するため、ここ以外は折りたたむ。 */
  // ドローフェイズは「ドロー」が唯一の主要行動なので、畳んだままでも押せる位置に出す
  const drawInBar = (gs.phase==="draw" && !gs.drawnThisTurn)
    ? `<button class="d-draw pulse" onclick="doDraw()" title="1枚ドロー">ドロー</button>` : "";
  // 相手が発動できるカードを持っている時は、畳んだままでも押せる位置に出す。
  // （自分のターン中に相手が手札誘発を撃つ導線がこれ）
  const reactInBar = reactN
    ? `<button class="d-icon react pulse" onclick="openReact()" title="${nameOf(rp)}が発動できる${reactN}枚">⚡<span class="kb">${reactN}</span></button>` : "";
  // 自分がチェーンできるカードを持っている時のボタン（速攻魔法・罠など）
  const myReactBtn = myReactN
    ? `<button class="d-act myreact" onclick="openReactFor(${gs.activePlayer})">自分<b>${myReactN}</b></button>` : "";
  const bar = `
    <button class="d-prev" onclick="doPhasePrev()" ${prevDisabled?'disabled':''}>◂</button>
    ${drawInBar}${reactInBar}
    ${atEnd
      ? `<button class="d-next endturn" onclick="doPass()">ターン終了</button>`
      : `<button class="d-next primary" onclick="doPhaseNext()" title="${phaseJp(gs.phase)}から${nextPh||""}へ">${nextPh||"次へ"} ▸</button>`}
    <button class="d-icon undo" onclick="undo()" ${canUndo?'':'disabled'} title="1つ戻す">↺</button>
    <button class="d-icon" onclick="toggleDock()" id="dockToggle" title="詳細">${DOCK_OPEN?'▾':'▴'}</button>`;

  /* ===== 展開時の詳細アクション ===== */
  const exBtn = (exN && inMain)
    ? `<button class="d-act" onclick="openExDeck(${gs.activePlayer})">EX<span class="kb">${exN}</span></button>`
    : "";
  const reactBtn = reactN
    ? `<button class="d-act react" onclick="openReact()">相手<span class="kb">${reactN}</span></button>`
    : "";
  const canDrawNow = rules().draw && !gs.drawnThisTurn;
  const drawCls = canDrawNow ? "d-act gold pulse" : (drawDone ? "d-act" : "d-act");
  const drawLabel = drawDone ? "ドロー済" : "ドロー";
  const drawClick = canDrawNow ? "doDraw()" : `showToast('${phaseJp(gs.phase)}では通常ドローできません')`;
  const actRow = `
    <button class="${drawCls}" onclick="${drawClick}">${drawLabel}</button>
    ${exBtn}${reactBtn}${myReactBtn}
    <button class="d-act" onclick="openChain()">チェーン${chN?`<span class="kb">${chN}</span>`:""}</button>
    <button class="d-act chainmode" onclick="cycleAdsChainModeV370()" title="ADS式チェーン確認モードを切替">CHAIN ${adsChainModeShortV370()}</button>
    <button class="d-act" onclick="redo()" ${REDO.length?'':'disabled'} title="やり直す">↻</button>
    <button class="d-act" onclick="openMenu()">≡</button>`;

  document.getElementById("dockBar").innerHTML = bar;
  document.getElementById("dockActions").innerHTML = actRow;
  const dock = document.getElementById("dock");
  if(dock) dock.className = DOCK_OPEN ? "dock" : "dock collapsed";
}


/* =========================================================================
   画面の実高さを測って CSS 変数に入れる。
   Android の一部ブラウザで dvh が効かず、カードサイズの上限計算が
   丸ごと無効になって盤面がドックを押し出す問題への対策。
   ========================================================================= */
function syncViewportHeight(){
  try{
    // visualViewport があればそれが最も正確（アドレスバーの伸縮に追従する）
    const h = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
    if(h && h > 200){
      document.documentElement.style.setProperty('--appvh', h + 'px');
    }
  }catch(e){}
}
function initViewportSync(){
  syncViewportHeight();
  if(!window.addEventListener) return;
  window.addEventListener('resize', syncViewportHeight, {passive:true});
  window.addEventListener('orientationchange', ()=>setTimeout(syncViewportHeight, 200), {passive:true});
  if(window.visualViewport && window.visualViewport.addEventListener){
    window.visualViewport.addEventListener('resize', syncViewportHeight, {passive:true});
  }
  // 起動直後はアドレスバーの高さが確定しないことがあるので少し遅れて再計測する
  setTimeout(syncViewportHeight, 300);
  setTimeout(syncViewportHeight, 1000);
}

/* =========================================================================
   スワイプでフェーズ送り（盤面を左右にスワイプ）
   ボタンを増やさずに操作ステップを減らすため。
   ========================================================================= */
function initSwipe(){
  const el = document.getElementById("board");
  if(!el || !el.addEventListener) return;
  let x0=null, y0=null, t0=0;
  el.addEventListener("touchstart", e=>{
    if(e.touches.length!==1) return;
    x0=e.touches[0].clientX; y0=e.touches[0].clientY; t0=Date.now();
  }, {passive:true});
  el.addEventListener("touchend", e=>{
    if(x0===null) return;
    const t=e.changedTouches[0];
    const dx=t.clientX-x0, dy=t.clientY-y0, dt=Date.now()-t0;
    x0=null;
    // 横方向が縦の2倍以上、かつ十分な距離と速さのときだけフェーズ送り
    if(dt<600 && Math.abs(dx)>60 && Math.abs(dx)>Math.abs(dy)*2){
      if(dx<0) doPhaseNext(); else doPhasePrev();
      showToast(phaseJp(gameState.phase));
    }
  }, {passive:true});
}

/* チェーンスタックの常時表示 */
function chainRibbonActionV360(){
  if(!gameState||!gameState.chain.length)return;
  if(PLAY_MODE===PLAY_MODES.DUEL&&gameState.chainWindow){openChainPriorityV2();return;}
  openChain();
}
function renderChainStack(gs){
  const el=document.getElementById("chainstack");if(!el)return;if(!gs.chain.length){el.hidden=true;el.innerHTML="";return;}el.hidden=false;
  const rows=gs.chain.map((lk,i)=>{const top=i===gs.chain.length-1;const neg=!!(lk.activationNegated||lk.effectNegated||lk.negated);const state=neg?`<span class="cs-state">無効</span>`:'';return `<span class="cs-link ${top?'top':''} ${neg?'neg':''}" title="CL${i+1} ${lk.name}"><span class="cs-cl">${i+1}</span><span style="overflow:hidden;text-overflow:ellipsis">${lk.name}</span><span class="cs-player">P${(lk.player??0)+1}</span><small>SS${lk.ss}</small>${state}</span>`;}).reverse().join("");
  const waiting=(PLAY_MODE===PLAY_MODES.DUEL&&gs.chainWindow);const who=waiting?`P${(gs.chainWindow.priority??0)+1} 応答`:'詳細';
  const pass=waiting?`<button class="cs-pass" onclick="chainPassV2()" title="この優先権をパス">PASS</button>`:'';
  el.innerHTML=`<span class="cs-lab">CHAIN ${gs.chain.length}</span>${rows}${pass}<button class="cs-go ${waiting?'respond':''}" onclick="chainRibbonActionV360()">${who} ▸</button>`;
}

/* ドックの開閉。盤面を広く使いたいので既定は閉じている。 */
let DOCK_OPEN = false;
function toggleDock(){
  DOCK_OPEN = !DOCK_OPEN;
  render();
}

function duelReadyClassV370(p,zone,index,isOpp){
  if(PLAY_MODE!==PLAY_MODES.DUEL||isOpp||p!==gameState.activePlayer) return '';
  let acts=[];
  try{ acts=getLegalActions(gameState,p,{zone,index})||[]; }catch(e){ return ''; }
  const ids=new Set(acts.map(a=>a.id));
  if(['effect','activateSet','handEffect','activate','legacyEffect','legacyHandEffect'].some(x=>ids.has(x))) return 'ready-fx';
  if(['specialSummonProcedure','normalSummon','extraNormalSummon','attack','flipSummon'].some(x=>ids.has(x))) return 'ready-act';
  return '';
}

function sideRestrictionBadgesV360(p){
  const f=(gameState.players[p]&&gameState.players[p].temporaryFlags)||{};const rows=[];
  if(f.noSpecialSummon)rows.push(`<span class="sf-badge">特殊召喚禁止</span>`);if(f.noBattlePhase)rows.push(`<span class="sf-badge">BP不可</span>`);if(f.v350OnlyAttackerUid)rows.push(`<span class="sf-badge warn">攻撃モンスター制限</span>`);
  return rows.length?`<div class="side-flags">${rows.join('')}</div>`:'';
}
function sideHTML(p, isOpp){
  const gs = gameState;
  const P  = gs.players[p];
  const isActive = gs.activePlayer===p;
  const lpLow = P.lp<=2000;
  return `
  <section class="side ${isOpp?'opp':''} ${isActive?'active-side':''}">
    <div class="side-head">
      <span class="side-name">${nameOf(p)}</span>
      <span class="side-tag">${isOpp?'相手':'手番'}</span>
      <div class="lp-box">
        <button class="lp-btn" onclick="lpAdj(${p},-500)">−</button>
        <button class="lp-val ${lpLow?'low':''}" onclick="openLP(${p})">${P.lp}</button>
        <button class="lp-btn" onclick="lpAdj(${p},500)">＋</button>
      </div>
    </div>
    ${sideRestrictionBadgesV360(p)}
    <div class="zones">
      ${ isOpp
        ? pileRowHTML(p,isOpp) + zoneRowHTML(p,"魔法罠","sz",5,isOpp) + zoneRowHTML(p,"モンスター","mz",5,isOpp)
        : zoneRowHTML(p,"モンスター","mz",5,isOpp) + zoneRowHTML(p,"魔法罠","sz",5,isOpp) + pileRowHTML(p,isOpp) }
    </div>
  </section>`;
}

/* 場外（フィールド/墓地/除外/デッキ/EX）の行。
   相手側は盤面の一番上、自分側は一番下に置く。 */
function pileRowHTML(p, isOpp){
  const P=gameState.players[p];
  const fieldHTML=()=>{const c=P.field;if(!c)return `<button class="fieldbar" onclick="openZone(${p},'field',0)" aria-label="フィールドゾーン 空"><span class="field-thumb empty">F</span><span class="field-main"><span class="field-label">FIELD</span><span class="field-empty">フィールド魔法なし</span></span></button>`;const db=dbOf(c),nm=cardName(c);const ctSum=c.counters?Object.values(c.counters).reduce((a,b)=>a+(Number(b)||0),0):0;const state=ctSum?`<span class="field-state" title="カウンター ${ctSum}">●${ctSum}</span>`:'';return `<button class="fieldbar has" onclick="openZone(${p},'field',0)" title="${nm}"><span class="field-thumb"><img src="${IMG_BASE}${db.c}.webp" onerror="this.style.display='none'"></span><span class="field-main"><span class="field-label">FIELD ACTIVE</span><span class="field-name">${nm}</span></span>${state}</button>`;};
  const chip=(zone,label)=>{const n=P[zone].length;const onclick=(zone==='ex'&&!isOpp)?`openExDeck(${p})`:`openPile(${p},'${zone}')`;const ready=(zone==='ex'&&!isOpp&&n)?'ready':'';return `<button class="pchip ${n?'has':''} ${ready}" onclick="${onclick}"><span class="pc-lab">${label}</span><span class="pc-n">${n||'—'}</span></button>`;};
  return `<div class="pilebar">${fieldHTML()}${chip('grave','墓地')}${chip('banish','除外')}${chip('deck','デッキ')}${chip('ex','EX')}</div>`;
}
function zoneRowHTML(p, label, zone, count, isOpp){
  const P = gameState.players[p];
  let cells = "";
  for(let i=0;i<count;i++){
    const c = P[zone][i];
    if(c){
      const bcv=battleCardUIV29(p,zone,i,c);
      const ready=duelReadyClassV370(p,zone,i,isOpp);
      const extra=[bcv?bcv.cls:"",ready].filter(Boolean).join(' ');
      const click=bcv?bcv.onclick:`openZone(${p},'${zone}',${i})`;
      cells += `<div class="slot">${cardHTML(c,extra,click,!isOpp || c.face==='up')}</div>`;
    }else cells += `<div class="slot"><span class="ph">${label}</span></div>`;
  }
  return `<div class="zrow"><div class="lab">${label}</div><div class="slots ${zone}">${cells}</div></div>`;
}
function pileSlot(p, zone, label, isOpp){
  const P = gameState.players[p];
  if(zone==="field"){
    const c=P.field;
    return `<div class="pile"><div class="slot field">${ c ? cardHTML(c,"",`openZone(${p},'field',0)`, !isOpp||c.face==='up') : `<span class="ph">${label}</span>`}</div><span class="pile-lab">${label}</span></div>`;
  }
  const n = P[zone].length;
  const top = P[zone][n-1];
  // EXデッキは召喚画面を開く（自分のみ）
  const onclick = (zone==="ex" && !isOpp) ? `openExDeck(${p})` : `openPile(${p},'${zone}')`;
  return `<div class="pile"><div class="slot ${zone==='ex'&&!isOpp&&n?'ex-ready':''}" onclick="${onclick}">
    ${ n ? cardHTML(top,"", onclick, zone!=="deck" && zone!=="ex") : `<span class="ph">${label}</span>` }
    ${ n>0 ? `<span class="pile-n">${n}</span>`:"" }
  </div><span class="pile-lab">${label}</span></div>`;
}

/* 1枚のカード描画。faceUp=false なら裏面 */
function cardHTML(c, extra, onclick, faceUp){
  const db = dbOf(c);
  const kcls = db.k ? `k-${db.k}` : "";
  const setDown = c.face==='down';
  const defRot  = (db.k==='m' && c.pos==='def') ? 'set-mon' : '';
  if(!faceUp || setDown){
    // 裏側でも守備表示なら横向きにする（裏側守備と裏側攻撃を区別する）
    return `<div class="card facedown ${extra} ${defRot}" onclick="${onclick}">
      <img src="${IMG_BACK}" onerror="this.style.display='none'">
    </div>`;
  }
  const badge = db.k==='m' ? (db.lv?`Lv${db.lv}`:"M") : db.k==='s' ? "魔" : db.k==='t' ? "罠" : "";
  const xyzN = (c.xyz && c.xyz.length) ? `<span class="xyz-n">${c.xyz.length}</span>` : "";
  // カウンター（魔力カウンター等）の表示
  // 攻守が変動していたら盤面に出す
  const modBadge = (hasMod(c) && db.k==='m' && faceUp)
    ? `<span class="mod-n">${curATK(c)}<small>/${curDEF(c)}</small></span>` : "";
  const ctSum = c.counters ? Object.values(c.counters).reduce((a,b)=>a+b,0) : 0;
  const ctN = ctSum ? `<span class="ct-n" title="${Object.entries(c.counters).map(([k,v])=>k+v).join(' ')}">${ctSum}</span>` : "";
  // トークンは画像が無いので専用表示にする
  if(c.token){
    return `<div class="card k-m token ${extra} ${defRot}" onclick="${onclick}">
      <span class="badge">Lv${db.lv||1}</span>
      ${ctN}
      <div class="tk-body"><span class="tk-mark">◈</span><span class="tk-atk">${db.atk||0}</span></div>
      <div class="nm">${db.n||"トークン"}</div>
    </div>`;
  }
  return `<div class="card ${kcls} ${extra} ${defRot}" onclick="${onclick}">
    <img src="${IMG_BASE}${db.c}.webp" onerror="this.style.display='none'">
    ${badge?`<span class="badge">${badge}</span>`:""}
    ${xyzN}${ctN}${modBadge}
    <div class="nm">${db.n||""}</div>
  </div>`;
}

const AUTO_EFFECT = {
    "C・チッキー":{op:"recruit",trig:"ignition",f:{arch:"N・エア・ハミングバード"}},
    "C・ドルフィーナ":{op:"recruit",trig:"ignition",f:{arch:"N・アクア・ドルフィン"}},
    "C・パンテール":{op:"recruit",trig:"ignition",f:{arch:"N・ブラック・パンサー"}},
    "C・ピニー":{op:"recruit",trig:"ignition",f:{arch:"N・グロー・モス"}},
    "C・モーグ":{op:"recruit",trig:"ignition",f:{arch:"N・グラン・モール"}},
    "C・ラーバ":{op:"recruit",trig:"ignition",f:{arch:"N・フレア・スカラベ"}},
    "D・バリア":{op:"search",trig:"ignition",f:{arch:"D"}},
    "D・リモコン":{op:"search",trig:"ignition",f:{arch:"D",tk:"m"}},
    "E・HERO エアーマン":{op:"search",trig:"summon",f:{arch:"HERO",tk:"m"}},
    "E・HERO キャプテン・ゴールド":{op:"search",trig:"ignition",f:{arch:"摩天楼 －スカイスクレイパー－"}},
    "RAI－MEI":{op:"search",trig:"ignition",f:{lvmax:2,at:"光",tk:"m"}},
    "Sin サイバー・エンド・ドラゴン":{op:"recruit",trig:"ignition",f:{arch:"サイバー・エンド・ドラゴン"}},
    "Sin スターダスト・ドラゴン":{op:"recruit",trig:"ignition",f:{arch:"スターダスト・ドラゴン"}},
    "Sin レインボー・ドラゴン":{op:"recruit",trig:"ignition",f:{arch:"究極宝玉神 レインボー・ドラゴン"}},
    "Sin 真紅眼の黒竜":{op:"recruit",trig:"ignition",f:{arch:"真紅眼の黒竜"}},
    "Sin 青眼の白龍":{op:"recruit",trig:"ignition",f:{arch:"青眼の白龍"}},
    "TG サイバー・マジシャン":{op:"search",trig:"ignition",f:{arch:"TG",exclude:"TG サイバー・マジシャン",tk:"m"}},
    "TG ラッシュ・ライノ":{op:"search",trig:"ignition",f:{arch:"TG",exclude:"TG ラッシュ・ライノ",tk:"m"}},
    "TG ワーウルフ":{op:"search",trig:"ignition",f:{arch:"TG",exclude:"TG ワーウルフ",tk:"m"}},
    "UFOタートル":{op:"recruit",trig:"ignition",f:{at:"炎",atkmax:1500,tk:"m"}},
    "W星雲隕石":{op:"recruit",trig:"ignition",f:{lvmin:7,at:"光",ra:"爬虫類",tk:"m"}},
    "XX－セイバー エマーズブレイド":{op:"recruit",trig:"ignition",f:{lvmax:4,arch:"X－セイバー",tk:"m"}},
    "XX－セイバー ガルセム":{op:"search",trig:"ignition",f:{arch:"X－セイバー",tk:"m"}},
    "おジャマジック":{op:"search",trig:"ignition",f:{arch:"おジャマ・グリーン"}},
    "アタック・リフレクター・ユニット":{op:"recruit",trig:"ignition",f:{arch:"サイバー・バリア・ドラゴン"}},
    "アトランティスの戦士":{op:"search",trig:"ignition",f:{arch:"伝説の都 アトランティス"}},
    "アーケイン・ファイロ":{op:"search",trig:"ignition",f:{arch:"バスター・モード"}},
    "アームド・ドラゴン LV3":{op:"recruit",trig:"ignition",f:{arch:"アームド・ドラゴン LV5"}},
    "イエロー・ガジェット":{op:"search",trig:"summon",f:{arch:"グリーン・ガジェット"}},
    "イレカエル":{op:"recruit",trig:"ignition",f:{arch:"ガエル",tk:"m"}},
    "インフェルニティ・インフェルノ":{op:"mill",trig:"ignition",f:{arch:"インフェルニティ"}},
    "インヴェルズを呼ぶ者":{op:"recruit",trig:"summon",f:{lvmax:4,arch:"インヴェルズ",tk:"m"}},
    "ウェポンサモナー":{op:"search",trig:"ignition",f:{arch:"ガーディアン"}},
    "カバリスト":{op:"search",trig:"ignition",f:{ra:"サイキック",tk:"m"}},
    "カラクリ兵 弐参六":{op:"recruit",trig:"ignition",f:{lvmax:4,arch:"カラクリ",tk:"m"}},
    "カラクリ商人 壱七七":{op:"search",trig:"summon",f:{arch:"カラクリ"}},
    "カラクリ大将軍 無零怒":{op:"recruit",trig:"summon",f:{arch:"カラクリ",tk:"m"}},
    "カラクリ将軍 無零":{op:"recruit",trig:"summon",f:{arch:"カラクリ",tk:"m"}},
    "ガスタ・イグル":{op:"recruit",trig:"ignition",f:{lvmax:4,arch:"ガスタ",tuner:true,tk:"m"}},
    "ガスタ・ガルド":{op:"recruit",trig:"ignition",f:{lvmax:2,arch:"ガスタ",tk:"m"}},
    "ガスタ・サンボルト":{op:"recruit",trig:"ignition",f:{at:"風",ra:"サイキック",defmax:1500,tk:"m"}},
    "ガスタ・スクイレル":{op:"recruit",trig:"ignition",f:{lvmin:5,arch:"ガスタ",tk:"m"}},
    "キラーザウルス":{op:"search",trig:"ignition",f:{arch:"ジュラシックワールド"}},
    "キラー・トマト":{op:"recruit",trig:"ignition",f:{at:"闇",atkmax:1500,tk:"m"}},
    "キングス・ナイト":{op:"recruit",trig:"summon",f:{arch:"ジャックス・ナイト"}},
    "キーマウス":{op:"search",trig:"ignition",f:{lvmax:3,ra:"獣",tk:"m"}},
    "クリッター":{op:"search",trig:"ignition",f:{atkmax:1500,tk:"m"}},
    "クロス・ポーター":{op:"search",trig:"ignition",f:{arch:"N",tk:"m"}},
    "グリズリーマザー":{op:"recruit",trig:"ignition",f:{at:"水",atkmax:1500,tk:"m"}},
    "グリーン・ガジェット":{op:"search",trig:"summon",f:{arch:"レッド・ガジェット"}},
    "コアキメイル・ロック":{op:"search",trig:"ignition",f:{lvmax:4,arch:"コアキメイルの鋼核",tk:"m"}},
    "コア転送ユニット":{op:"search",trig:"ignition",f:{arch:"コアキメイルの鋼核"}},
    "コンバート・コンタクト":{op:"mill",trig:"ignition",f:{arch:"N"}},
    "コーリング・ノヴァ":{op:"recruit",trig:"ignition",f:{at:"光",ra:"天使",atkmax:1500,tk:"m"}},
    "コール・リゾネーター":{op:"search",trig:"ignition",f:{arch:"リゾネーター",tk:"m"}},
    "ゴキポン":{op:"search",trig:"ignition",f:{ra:"昆虫",atkmax:1500,tk:"m"}},
    "サイバー・ラーバァ":{op:"recruit",trig:"ignition",f:{arch:"サイバー・ラーバァ"}},
    "シャインエンジェル":{op:"recruit",trig:"ignition",f:{at:"光",atkmax:1500,tk:"m"}},
    "シャドウ・リチュア":{op:"search",trig:"ignition",f:{arch:"リチュア",tk:"s"}},
    "シューティング・クェーサー・ドラゴン":{op:"recruit",trig:"ignition",f:{arch:"シューティング・スター・ドラゴン"}},
    "シンクロ・フュージョニスト":{op:"search",trig:"ignition",f:{arch:"融合",tk:"s"}},
    "ジェイドナイト":{op:"search",trig:"ignition",f:{lv:4,at:"光",ra:"機械",tk:"m"}},
    "ジェネクス・ウンディーネ":{op:"search",trig:"summon",f:{arch:"ジェネクス・コントローラー"}},
    "ジェネクス・サーチャー":{op:"recruit",trig:"ignition",f:{arch:"ジェネクス",atkmax:1500,tk:"m"}},
    "ジェネクス・ニュートロン":{op:"search",trig:"ignition",f:{ra:"機械",tuner:true}},
    "ジェネクス・パワー・プランナー":{op:"search",trig:"summon",f:{lv:3,arch:"ジェネクス",tk:"m"}},
    "ジェネクス・ブラスト":{op:"search",trig:"summon",f:{at:"闇",arch:"ジェネクス",tk:"m"}},
    "ジェネラルデーモン":{op:"search",trig:"ignition",f:{arch:"万魔殿－悪魔の巣窟－"}},
    "ジェムタートル":{op:"search",trig:"ignition",f:{arch:"ジェムナイト・フュージョン"}},
    "ジェムナイト・アレキサンド":{op:"recruit",trig:"ignition",f:{arch:"ジェムナイト",normal:true,tk:"m"}},
    "ジェムレシス":{op:"search",trig:"summon",f:{arch:"ジェムナイト",tk:"m"}},
    "ジュラック・ヴェロー":{op:"recruit",trig:"ignition",f:{arch:"ジュラック",atkmax:1700,tk:"m"}},
    "スカル・ナイト":{op:"recruit",trig:"ignition",f:{arch:"スカル・ナイト"}},
    "スクラップ・エリア":{op:"search",trig:"ignition",f:{arch:"スクラップ",tuner:true}},
    "スクラップ・シャーク":{op:"mill",trig:"ignition",f:{arch:"スクラップ",tk:"m"}},
    "スクラップ・ハンター":{op:"mill",trig:"ignition",f:{tuner:true}},
    "スクラップ・リサイクラー":{op:"mill",trig:"summon",f:{ra:"機械",tk:"m"}},
    "スネーク・ホイッスル":{op:"recruit",trig:"ignition",f:{lvmax:4,ra:"爬虫類",tk:"m"}},
    "スモール・ピース・ゴーレム":{op:"recruit",trig:"summon",f:{arch:"ミッド・ピース・ゴーレム"}},
    "スレイブタイガー":{op:"recruit",trig:"ignition",f:{arch:"剣闘獣",tk:"m"}},
    "スレイブ・エイプ":{op:"recruit",trig:"ignition",f:{lvmax:4,arch:"剣闘獣",tk:"m"}},
    "スーパイ":{op:"recruit",trig:"ignition",f:{arch:"太陽の神官"}},
    "ダニポン":{op:"search",trig:"ignition",f:{ra:"昆虫",defmax:1000,tk:"m"}},
    "ダーク・ジェネラル フリード":{op:"search",trig:"ignition",f:{lv:4,at:"闇",tk:"m"}},
    "デステニー・シグナル":{op:"recruit",trig:"ignition",f:{lvmax:4,arch:"D－HERO",tk:"m"}},
    "デスハムスター":{op:"recruit",trig:"ignition",f:{arch:"デスハムスター"}},
    "デュアル・ソルジャー":{op:"recruit",trig:"ignition",f:{lvmax:4,arch:"デュアル・ソルジャー",tk:"m"}},
    "デーモンとの駆け引き":{op:"recruit",trig:"ignition",f:{arch:"バーサーク・デッド・ドラゴン"}},
    "トゥルース・リインフォース":{op:"recruit",trig:"ignition",f:{lvmax:2,ra:"戦士",tk:"m"}},
    "トゥーンのもくじ":{op:"search",trig:"ignition",f:{arch:"トゥーン"}},
    "トライアングル・エリア":{op:"recruit",trig:"ignition",f:{arch:"エーリアン",tk:"m"}},
    "トライクラー":{op:"recruit",trig:"ignition",f:{arch:"ヴィークラー"}},
    "ドラグニティナイト－ガジャルグ":{op:"search",trig:"ignition",f:{lvmax:4,ra:"ドラゴン",tk:"m"}},
    "ドラグニティ－トリブル":{op:"mill",trig:"summon",f:{lvmax:3,ra:"ドラゴン",tk:"m"}},
    "ドラゴニック・タクティクス":{op:"recruit",trig:"ignition",f:{lv:8,ra:"ドラゴン",tk:"m"}},
    "ドラゴンフライ":{op:"recruit",trig:"ignition",f:{at:"風",atkmax:1500,tk:"m"}},
    "ドレッド・ドラゴン":{op:"search",trig:"ignition",f:{lvmax:3,ra:"ドラゴン",tk:"m"}},
    "ナチュル・クリフ":{op:"recruit",trig:"ignition",f:{lvmax:4,arch:"ナチュル",tk:"m"}},
    "ナーガ":{op:"recruit",trig:"ignition",f:{lvmax:3,tk:"m"}},
    "ネフティスの導き手":{op:"recruit",trig:"ignition",f:{arch:"ネフティスの鳳凰神"}},
    "ハイエナ":{op:"recruit",trig:"ignition",f:{arch:"ハイエナ"}},
    "ハンディキャップマッチ!":{op:"recruit",trig:"summon",f:{lvmax:4,arch:"剣闘獣",tk:"m"}},
    "ハーピィ・クィーン":{op:"search",trig:"ignition",f:{arch:"ハーピィの狩場"}},
    "バイオファルコン":{op:"search",trig:"ignition",f:{ra:"機械",atkmax:1000,tk:"m"}},
    "バイオレット・ウィッチ":{op:"search",trig:"ignition",f:{ra:"植物",defmax:1500,tk:"m"}},
    "バスター・ビースト":{op:"search",trig:"ignition",f:{arch:"バスター・モード"}},
    "バフォメット":{op:"search",trig:"summon",f:{arch:"幻獣王ガゼル"}},
    "バード・フェイス":{op:"search",trig:"ignition",f:{arch:"ハーピィ・レディ"}},
    "パンダボーグ":{op:"recruit",trig:"ignition",f:{lv:4,ra:"サイキック",tk:"m"}},
    "ヒーローアライブ":{op:"recruit",trig:"ignition",f:{lvmax:4,arch:"E・HERO",tk:"m"}},
    "ヒーロー・キッズ":{op:"recruit",trig:"summon",f:{arch:"ヒーロー・キッズ"}},
    "ヒーロー・シグナル":{op:"recruit",trig:"ignition",f:{lvmax:4,arch:"E・HERO",tk:"m"}},
    "ビーストライカー":{op:"recruit",trig:"ignition",f:{arch:"モジャ"}},
    "ピラミッド・タートル":{op:"recruit",trig:"ignition",f:{ra:"アンデット",defmax:2000,tk:"m"}},
    "フェザー・ウィンド・アタック":{op:"search",trig:"ignition",f:{arch:"BF",tk:"m"}},
    "フォーチュンレディ・ライティー":{op:"recruit",trig:"ignition",f:{arch:"フォーチュンレディ",tk:"m"}},
    "ブルーメンブラット":{op:"recruit",trig:"ignition",f:{arch:"E・HERO ブルーメ"}},
    "ヘカテリス":{op:"search",trig:"ignition",f:{arch:"神の居城－ヴァルハラ"}},
    "ヘル・セキュリティ":{op:"recruit",trig:"ignition",f:{ra:"悪魔",tk:"m"}},
    "ベビケラサウルス":{op:"recruit",trig:"ignition",f:{lvmax:4,ra:"恐竜",tk:"m"}},
    "ボスラッシュ":{op:"recruit",trig:"ignition",f:{arch:"巨大戦艦",tk:"m"}},
    "ボタニティ・ガール":{op:"search",trig:"ignition",f:{ra:"植物",defmax:1000,tk:"m"}},
    "マクロコスモス":{op:"recruit",trig:"ignition",f:{arch:"原始太陽ヘリオス"}},
    "マシンナーズ・ギアフレーム":{op:"search",trig:"summon",f:{arch:"マシンナーズ",exclude:"マシンナーズ・ギアフレーム",tk:"m"}},
    "マシンナーズ・ディフェンダー":{op:"search",trig:"ignition",f:{arch:"督戦官コヴィントン"}},
    "ミッド・ピース・ゴーレム":{op:"recruit",trig:"summon",f:{arch:"スモール・ピース・ゴーレム"}},
    "メカウサー":{op:"recruit",trig:"ignition",f:{arch:"メカウサー"}},
    "メンタルマスター":{op:"recruit",trig:"ignition",f:{lvmax:4,ra:"サイキック",tk:"m"}},
    "ユーフォロイド":{op:"recruit",trig:"ignition",f:{ra:"機械",atkmax:1500,tk:"m"}},
    "ラヴァル炎火山の侍女":{op:"mill",trig:"ignition",f:{arch:"ラヴァル",tk:"m"}},
    "リチュア・アビス":{op:"search",trig:"summon",f:{arch:"リチュア・アビス",defmax:1000,tk:"m"}},
    "リチュア・エリアル":{op:"search",trig:"ignition",f:{arch:"リチュア",tk:"m"}},
    "リバース・オブ・ネオス":{op:"recruit",trig:"ignition",f:{arch:"E・HERO ネオス"}},
    "レアル・ジェネクス・クラッシャー":{op:"search",trig:"summon",f:{lv:4,arch:"レアル・ジェネクス",tk:"m"}},
    "レアル・ジェネクス・ターボ":{op:"search",trig:"summon",f:{lv:1,arch:"ジェネクス",tk:"m"}},
    "レアル・ジェネクス・マグナ":{op:"search",trig:"summon",f:{lv:2,arch:"レアル・ジェネクス",tk:"m"}},
    "レッド・ガジェット":{op:"search",trig:"summon",f:{arch:"イエロー・ガジェット"}},
    "レプティレス・ガードナー":{op:"search",trig:"ignition",f:{arch:"レプティレス",tk:"m"}},
    "ロード・ウォリアー":{op:"recruit",trig:"ignition",f:{lvmax:2,ra:"戦士",tk:"m"}},
    "ローンファイア・ブロッサム":{op:"recruit",trig:"ignition",f:{ra:"植物",tk:"m"}},
    "ワンハンドレッド・アイ・ドラゴン":{op:"search",trig:"ignition",f:{arch:"地縛神",tk:"m"}},
    "ワーム・カルタロス":{op:"search",trig:"ignition",f:{lvmax:4,ra:"爬虫類",arch:"ワーム",tk:"m"}},
    "ワーム・ゼクス":{op:"mill",trig:"summon",f:{ra:"爬虫類",arch:"ワーム",tk:"m"}},
    "ヴァイロン・エレメント":{op:"recruit",trig:"ignition",f:{arch:"ヴァイロン",tuner:true}},
    "ヴァイロン・マテリアル":{op:"search",trig:"ignition",f:{arch:"ヴァイロン",tk:"s"}},
    "ヴィークラー":{op:"recruit",trig:"ignition",f:{arch:"アンサイクラー"}},
    "ヴォルカニック・バレット":{op:"search",trig:"ignition",f:{arch:"ヴォルカニック・バレット"}},
    "万華鏡－華麗なる分身－":{op:"recruit",trig:"ignition",f:{arch:"ハーピィ・レディ"}},
    "人海戦術":{op:"recruit",trig:"ignition",f:{lvmax:2,normal:true,tk:"m"}},
    "仮面竜":{op:"recruit",trig:"ignition",f:{ra:"ドラゴン",atkmax:1500,tk:"m"}},
    "伝説の白石":{op:"search",trig:"ignition",f:{arch:"青眼の白龍"}},
    "儀式の準備":{op:"search",trig:"ignition",f:{lvmax:7,tk:"m"}},
    "充電池メン":{op:"recruit",trig:"summon",f:{arch:"電池メン",exclude:"充電池メン",tk:"m"}},
    "六武ノ書":{op:"recruit",trig:"ignition",f:{arch:"大将軍 紫炎"}},
    "共鳴虫":{op:"recruit",trig:"ignition",f:{ra:"昆虫",atkmax:1500,tk:"m"}},
    "円盤ムスキー":{op:"search",trig:"ignition",f:{arch:"エーリアン"}},
    "冥界の使者":{op:"search",trig:"ignition",f:{lvmax:3,normal:true,tk:"m"}},
    "剣闘獣アレクサンデル":{op:"recruit",trig:"ignition",f:{arch:"剣闘獣",exclude:"剣闘獣アレクサンデル",tk:"m"}},
    "剣闘獣エクイテ":{op:"recruit",trig:"summon",f:{arch:"剣闘獣",exclude:"剣闘獣エクイテ",tk:"m"}},
    "剣闘獣ダリウス":{op:"recruit",trig:"summon",f:{arch:"剣闘獣",exclude:"剣闘獣ダリウス",tk:"m"}},
    "剣闘獣ティゲル":{op:"search",trig:"summon",f:{arch:"剣闘獣",tk:"m"}},
    "剣闘獣ディカエリィ":{op:"recruit",trig:"summon",f:{arch:"剣闘獣",exclude:"剣闘獣ディカエリィ",tk:"m"}},
    "剣闘獣ベストロウリィ":{op:"recruit",trig:"summon",f:{arch:"剣闘獣",exclude:"剣闘獣ベストロウリィ",tk:"m"}},
    "剣闘獣ホプロムス":{op:"recruit",trig:"summon",f:{arch:"剣闘獣",exclude:"剣闘獣ホプロムス",tk:"m"}},
    "剣闘獣ムルミロ":{op:"recruit",trig:"summon",f:{arch:"剣闘獣",exclude:"剣闘獣ムルミロ",tk:"m"}},
    "剣闘獣ラクエル":{op:"recruit",trig:"summon",f:{arch:"剣闘獣",exclude:"剣闘獣ラクエル",tk:"m"}},
    "剣闘獣ラニスタ":{op:"recruit",trig:"summon",f:{arch:"剣闘獣",exclude:"剣闘獣ラニスタ",tk:"m"}},
    "剣闘訓練所":{op:"search",trig:"ignition",f:{lvmax:4,arch:"剣闘獣",tk:"m"}},
    "創造の代行者 ヴィーナス":{op:"recruit",trig:"ignition",f:{arch:"神聖なる球体"}},
    "召喚師のスキル":{op:"search",trig:"ignition",f:{lvmin:5,normal:true,tk:"m"}},
    "堕天使アスモディウス":{op:"mill",trig:"ignition",f:{ra:"天使",tk:"m"}},
    "墓守の偵察者":{op:"recruit",trig:"ignition",f:{arch:"墓守の",atkmax:1500,tk:"m"}},
    "墓守の司令官":{op:"search",trig:"ignition",f:{arch:"王家の眠る谷－ネクロバレー"}},
    "大神官デ・ザード":{op:"recruit",trig:"ignition",f:{arch:"不死王リッチー"}},
    "天空の使者 ゼラディアス":{op:"search",trig:"ignition",f:{arch:"天空の聖域"}},
    "宝玉の導き":{op:"recruit",trig:"ignition",f:{arch:"宝玉獣",tk:"m"}},
    "巨大ネズミ":{op:"recruit",trig:"ignition",f:{at:"地",atkmax:1500,tk:"m"}},
    "幻影の魔術士":{op:"recruit",trig:"ignition",f:{arch:"HERO",atkmax:1000,tk:"m"}},
    "悪魂邪苦止":{op:"search",trig:"ignition",f:{arch:"悪魂邪苦止"}},
    "拘束解除":{op:"recruit",trig:"ignition",f:{arch:"剣聖－ネイキッド・ギア・フリード"}},
    "暗黒界の斥候 スカー":{op:"search",trig:"ignition",f:{lvmax:4,arch:"暗黒界",tk:"m"}},
    "極星宝ドラウプニル":{op:"search",trig:"ignition",f:{arch:"極星宝"}},
    "極星獣タングニョースト":{op:"recruit",trig:"ignition",f:{arch:"極星獣",exclude:"極星獣タングニョースト",tk:"m"}},
    "機皇兵スキエル・アイン":{op:"recruit",trig:"ignition",f:{arch:"機皇兵",tk:"m"}},
    "機皇城":{op:"search",trig:"ignition",f:{arch:"機皇帝",tk:"m"}},
    "死の花－ネクロ・フルール":{op:"recruit",trig:"ignition",f:{arch:"時花の魔女－フルール・ド・ソルシエール"}},
    "氷結界の決起隊":{op:"search",trig:"ignition",f:{arch:"氷結界",tk:"m"}},
    "氷結界の紋章":{op:"search",trig:"ignition",f:{arch:"氷結界",tk:"m"}},
    "沼地の魔神王":{op:"search",trig:"ignition",f:{arch:"融合"}},
    "深海のディーヴァ":{op:"recruit",trig:"summon",f:{lvmax:3,ra:"海竜",tk:"m"}},
    "無敗将軍 フリード":{op:"search",trig:"ignition",f:{lvmax:4,ra:"戦士",tk:"m"}},
    "白竜の聖騎士":{op:"recruit",trig:"ignition",f:{arch:"青眼の白龍"}},
    "督戦官コヴィントン":{op:"recruit",trig:"ignition",f:{arch:"マシンナーズ・フォース"}},
    "神の桎梏グレイプニル":{op:"search",trig:"ignition",f:{arch:"極星",tk:"m"}},
    "神秘の代行者 アース":{op:"search",trig:"summon",f:{arch:"代行者",exclude:"神秘の代行者 アース",tk:"m"}},
    "精神統一":{op:"search",trig:"ignition",f:{arch:"精神統一"}},
    "素早いビッグハムスター":{op:"recruit",trig:"ignition",f:{lvmax:3,ra:"獣",tk:"m"}},
    "素早いマンタ":{op:"recruit",trig:"ignition",f:{arch:"素早いマンタ"}},
    "素早いモモンガ":{op:"recruit",trig:"ignition",f:{arch:"素早いモモンガ"}},
    "紫炎の狼煙":{op:"search",trig:"ignition",f:{lvmax:3,arch:"六武衆",tk:"m"}},
    "紫炎の足軽":{op:"recruit",trig:"ignition",f:{lvmax:3,arch:"六武衆",tk:"m"}},
    "緊急鋼核処分":{op:"mill",trig:"ignition",f:{arch:"コアキメイルの鋼核"}},
    "荒野の女戦士":{op:"recruit",trig:"ignition",f:{at:"地",ra:"戦士",atkmax:1500,tk:"m"}},
    "蛇神降臨":{op:"recruit",trig:"ignition",f:{arch:"毒蛇神ヴェノミナーガ"}},
    "融合賢者":{op:"search",trig:"ignition",f:{arch:"融合",tk:"s"}},
    "見習い魔術師":{op:"recruit",trig:"summon",f:{lvmax:2,ra:"魔法使い",tk:"m"}},
    "賢者の宝石":{op:"recruit",trig:"ignition",f:{arch:"ブラック・マジシャン"}},
    "超古深海王シーラカンス":{op:"recruit",trig:"ignition",f:{lvmax:4,ra:"魚",tk:"m"}},
    "軍隊竜":{op:"recruit",trig:"ignition",f:{arch:"軍隊竜"}},
    "迷宮変化":{op:"recruit",trig:"ignition",f:{arch:"ウォール・シャドウ"}},
    "遺言状":{op:"recruit",trig:"ignition",f:{atkmax:1500,tk:"m"}},
    "闇・道化師のペーテン":{op:"recruit",trig:"ignition",f:{arch:"闇・道化師のペーテン"}},
    "電池メン－ボタン型":{op:"recruit",trig:"ignition",f:{lvmax:4,arch:"電池メン－ボタン型",tk:"m"}},
    "霞の谷の神風":{op:"recruit",trig:"ignition",f:{lvmax:4,at:"風",tk:"m"}},
    "魔力掌握":{op:"search",trig:"ignition",f:{arch:"魔力掌握"}},
    "魔法の歯車":{op:"recruit",trig:"ignition",f:{arch:"古代の機械巨人"}},
    "魔轟神グリムロ":{op:"search",trig:"ignition",f:{arch:"魔轟神",exclude:"魔轟神グリムロ",tk:"m"}},
    "魔轟神獣ペガラサス":{op:"mill",trig:"ignition",f:{arch:"魔轟神",tk:"m"}},
    "黒き森のウィッチ":{op:"search",trig:"ignition",f:{defmax:1500,tk:"m"}},
    "黒魔術のカーテン":{op:"recruit",trig:"ignition",f:{arch:"ブラック・マジシャン"}}
  };
