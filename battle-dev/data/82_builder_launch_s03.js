/* S03-U121 (user request): デッキビルダーの「このデッキでデュエルする」からの起動動線。

   index.html（ビルダー）は編集中のデッキ（currentDeckRecord() 相当: {id, name, cards, side, candidates, memo}、
   cards / side は主に {n, q}）を sessionStorage["duel1103:launchDeck"] に JSON で保存し、battle.html?from=builder へ遷移する。

   1. 起動時に URL の from=builder を検出する（通常の直接起動では何もしない — builderLaunchS03() が false を返し、
      boot は従来どおり offerResumeDuel を呼ぶ）。
   2. sessionStorage のデッキを読み、読んだら削除する。URL から from=builder を外す（再読込で再実行しない）。
   3. 既存の読込処理で Player1 の次回開始用デッキにセットする：normalizeSavedDeckEntry → applySavedDeckS03 → applyLoad
      （SET_NEXT_DECK）。独自の読込処理は持たない。
   4. 続けて Player2 の既存デッキ選択画面（openDeckLoad('saved', 1)）を開く。
   5. Player2 を選んだら「自分が先攻で開始」「相手が先攻で開始」を確認し、既存の開始処理（startSelectedDeckDuel /
      兎ラギアを選んだ場合は startRabbitOpponentDuel）へ渡す。
   6. from=builder の時は「前回のデュエルを再開しますか？」より優先する（保存されたデュエルは消さない。新しいデュエルを
      開始した時だけ、既存の開始処理が従来どおり置き換える）。
   ルールエンジン・カードスクリプト・盤面処理は変更しない。 */
const BUILDER_LAUNCH_KEY_S03 = 'duel1103:launchDeck';
let BUILDER_LAUNCH_S03 = null;   /* {stage:'p2'|'confirm', p2:'selected'|'rabbit', p1Name} — UI 動線の状態（盤面ではない） */

function builderLaunchRequestedS03(){
  /* 依存の少ない判定（URLSearchParams が無い環境でも動く）: クエリに from=builder がある */
  try{ return /(?:^|[?&])from=builder(?:&|#|$)/.test(String((window.location&&window.location.search)||'')); }catch(e){ return false; }
}
function takeBuilderLaunchDeckS03(){
  let raw = null;
  try{
    const ss = window.sessionStorage;
    raw = ss ? ss.getItem(BUILDER_LAUNCH_KEY_S03) : null;
    if(ss) ss.removeItem(BUILDER_LAUNCH_KEY_S03);
  }catch(e){ raw = null; }
  /* 再読込で同じ動線を繰り返さないよう from=builder を URL から外す（他のパラメータは残す） */
  try{
    const u = new URL(window.location.href);
    if(u.searchParams.get('from')==='builder'){
      u.searchParams.delete('from');
      window.history.replaceState(window.history.state, '', u.pathname + (u.searchParams.toString() ? '?' + u.searchParams.toString() : '') + u.hash);
    }
  }catch(e){}
  if(!raw) return null;
  try{ return JSON.parse(raw); }catch(e){ return {__invalid:true}; }
}

/* boot から呼ぶ。この動線を実行したら true（起動ダイアログを出さない）。 */
function builderLaunchS03(){
  if(!builderLaunchRequestedS03()) return false;
  const rec = takeBuilderLaunchDeckS03();
  const d = (rec && !rec.__invalid) ? normalizeSavedDeckEntry(rec, '編集中のデッキ', 'builder:launch') : null;
  if(!d){
    showToast(rec ? 'デッキビルダーから受け取ったデッキを読めませんでした' : 'デッキビルダーからのデッキがありません（通常起動します）');
    return false;
  }
  BUILDER_LAUNCH_S03 = {stage:'p1', p1Name:d.name||'編集中のデッキ'};
  DECK_LOAD_PLAYER = 0;
  applySavedDeckS03(d);   /* → applyLoad(0, parsed, false) → builderLaunchAfterLoadS03 */
  const P0 = gameState.players[0];
  if(!(P0 && P0.loadedDeckV32 && (P0.loadedDeckV32.main||[]).length)){
    /* 1枚も一致しなかった（applyLoad が理由を表示済み） */
    BUILDER_LAUNCH_S03 = null;
  }
  return true;
}

/* applyLoad の最後から呼ばれる。動線中なら次の画面を出して true（applyLoad 側の未一致カード表示をここで引き受ける）。 */
function builderLaunchAfterLoadS03(p, missNames){
  const st = BUILDER_LAUNCH_S03;
  if(!st) return false;
  const escT = s => String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const missHtml = (missNames&&missNames.length)
    ? `<div class="meta" style="margin:6px 0">次の${missNames.length}種はカードデータに見つからず、除外しました。</div><div class="eff">・${missNames.map(escT).join('<br>・')}</div>` : '';
  if(st.stage==='p1' && p===0){
    st.stage = 'p2';
    setTimeout(()=>{
      if(missHtml){
        sheet.innerHTML = `<div class="grip"></div>
          <h3 style="margin-bottom:8px">Player1：${escT(st.p1Name)}</h3>${missHtml}
          <div class="act-grid"><div class="act fx" onclick="openDeckLoad('saved',1)">Player2のデッキを選ぶ</div></div>
          <button class="close" onclick="builderLaunchCancelS03()">やめる</button>`;
        veil.classList.add('on');
      }else openDeckLoad('saved', 1);
    }, 90);
    return true;
  }
  if(st.stage==='p2' && p===1){
    st.stage = 'confirm'; st.p2 = 'selected';
    setTimeout(()=>builderLaunchConfirmS03(missHtml), 90);
    return true;
  }
  return false;
}
function builderLaunchConfirmS03(extraHtml){
  const st = BUILDER_LAUNCH_S03; if(!st) return;
  const escT = s => String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const d0 = gameState.players[0].loadedDeckV32, d1 = gameState.players[1].loadedDeckV32;
  const p2Name = st.p2==='rabbit' ? RABBIT_LAGGIA_DECK.name : ((d1&&d1.name)||'Player2のデッキ');
  sheet.innerHTML = `<div class="grip"></div>
    <h3 style="margin-bottom:8px">デュエル開始</h3>
    <div class="meta" style="margin-bottom:8px">Player1：<b>${escT((d0&&d0.name)||st.p1Name)}</b><br>Player2：<b>${escT(p2Name)}</b></div>
    ${extraHtml||''}
    <div class="act-grid">
      <div class="act fx" data-builder-start="0" onclick="builderLaunchStartS03(0)">自分が先攻で開始</div>
      <div class="act" data-builder-start="1" onclick="builderLaunchStartS03(1)">相手が先攻で開始</div>
    </div>
    <div class="act-grid" style="margin-top:8px"><div class="act" onclick="builderLaunchRepickS03()">Player2のデッキを選び直す</div></div>
    <button class="close" onclick="builderLaunchCancelS03()">やめる</button>`;
  veil.classList.add('on');
}
function builderLaunchStartS03(firstPlayer){
  const st = BUILDER_LAUNCH_S03; if(!st) return false;
  const fp = firstPlayer===1 ? 1 : 0;
  const ok = st.p2==='rabbit' ? startRabbitOpponentDuel(fp) : startSelectedDeckDuel(fp);
  if(ok!==false){ BUILDER_LAUNCH_S03 = null; closeSheet(); }
  return ok;
}
function builderLaunchRepickS03(){
  if(!BUILDER_LAUNCH_S03) return;
  BUILDER_LAUNCH_S03.stage = 'p2'; delete BUILDER_LAUNCH_S03.p2;
  openDeckLoad('saved', 1);
}
function builderLaunchCancelS03(){ BUILDER_LAUNCH_S03 = null; closeSheet(); }
/* デッキ一覧の「1103兎ラギア（対戦相手用）」行。動線中は Player2 の選択として確認画面へ、それ以外は従来どおり即開始。 */
function rabbitRowPickS03(){
  if(BUILDER_LAUNCH_S03 && BUILDER_LAUNCH_S03.stage==='p2'){
    BUILDER_LAUNCH_S03.stage = 'confirm'; BUILDER_LAUNCH_S03.p2 = 'rabbit';
    builderLaunchConfirmS03('');
    return;
  }
  startRabbitOpponentDuel();
}

/* S03-U172 (user report: 「player2のデッキがサンプルの兎ラギアしか選ぶことができない。他のデッキを選ぶとデッキが空の状態でデュエルが
   開始される」). Outside the builder flow, choosing a saved deck only set the next deck (SET_NEXT_DECK) and closed the sheet: the
   home screen offered only 「兎ラギアと対戦開始」, and 「選択デッキで新規デュエル」 was hidden in the menu — so Player2's chosen deck
   never became a duel, and advancing the phase on the empty board looked like a duel with no deck.
   Now the normal deck selection ends in the same start confirmation as the builder flow (startSelectedDeckDuel), and the home
   screen shows both selected decks with the start buttons. */
function selectedDeckNameS03(p){
  const d = gameState && gameState.players && gameState.players[p] && gameState.players[p].loadedDeckV32;
  return (d && d.source==='user' && (d.main||[]).length) ? (d.name||'無題のデッキ') : '';
}
/* the home screen label (escaped) */
function selectedDeckLabelS03(p){
  const n = selectedDeckNameS03(p);
  return n ? String(n).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : '未選択';
}
function deckStartConfirmS03(extraHtml){
  const escT = s => String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  sheet.innerHTML = `<div class="grip"></div>
    <h3 style="margin-bottom:8px">デュエル開始</h3>
    <div class="meta" style="margin-bottom:8px">Player1：<b>${escT(selectedDeckNameS03(0))}</b><br>Player2：<b>${escT(selectedDeckNameS03(1))}</b></div>
    ${extraHtml||''}
    <div class="act-grid">
      <div class="act fx" data-deck-start="0" onclick="deckStartS03(0)">自分が先攻で開始</div>
      <div class="act" data-deck-start="1" onclick="deckStartS03(1)">相手が先攻で開始</div>
    </div>
    <div class="act-grid" style="margin-top:8px">
      <div class="act" onclick="openDeckLoad('saved',0)">Player1のデッキを選び直す</div>
      <div class="act" onclick="openDeckLoad('saved',1)">Player2のデッキを選び直す</div>
    </div>
    <button class="close" onclick="closeSheet()">あとで</button>`;
  veil.classList.add('on');
}
function deckStartS03(firstPlayer){
  const ok = startSelectedDeckDuel(firstPlayer===1 ? 1 : 0);
  if(ok!==false) closeSheet();
  return ok;
}
/* applyLoad (not autostart, not the builder flow): what to show after a deck was selected */
function deckSelectAfterLoadS03(p, missNames){
  const escT = s => String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const missHtml = (missNames&&missNames.length)
    ? `<div class="meta" style="margin:6px 0">次の${missNames.length}種はカードデータに見つからず、除外しました。</div><div class="eff">・${missNames.map(escT).join('<br>・')}</div>` : '';
  if(selectedDeckNameS03(0) && selectedDeckNameS03(1)){ setTimeout(()=>deckStartConfirmS03(missHtml), 90); return true; }
  if(p===0 && selectedDeckNameS03(0)){
    setTimeout(()=>{
      sheet.innerHTML = `<div class="grip"></div>
        <h3 style="margin-bottom:8px">Player1：${escT(selectedDeckNameS03(0))}</h3>${missHtml}
        <div class="act-grid">
          <div class="act fx" onclick="openDeckLoad('saved',1)">Player2のデッキを選ぶ</div>
          <div class="act" onclick="startRabbitOpponentDuel()">兎ラギアと対戦開始</div>
        </div>
        <button class="close" onclick="closeSheet()">あとで</button>`;
      veil.classList.add('on');
    }, 90);
    return true;
  }
  if(p===1 && selectedDeckNameS03(1) && !selectedDeckNameS03(0)){
    setTimeout(()=>{
      sheet.innerHTML = `<div class="grip"></div>
        <h3 style="margin-bottom:8px">Player2：${escT(selectedDeckNameS03(1))}</h3>${missHtml}
        <div class="act-grid"><div class="act fx" onclick="openDeckLoad('saved',0)">Player1のデッキを選ぶ</div></div>
        <button class="close" onclick="closeSheet()">あとで</button>`;
      veil.classList.add('on');
    }, 90);
    return true;
  }
  return false;
}
