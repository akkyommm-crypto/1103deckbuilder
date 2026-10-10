/* =========================================================================
   System v4.9.0 — P1 ChoiceRequest の UI 層
   -------------------------------------------------------------------------
   役割はこれだけ:
     gameState.pendingChoice を描画する → ユーザー操作を回答に変換して
     answerChoiceV49() / cancelChoiceV49() へ渡す。

   ルール判定は一切行わない。候補の絞り込み・対象耐性・枚数検証は
   すべてルール層（engine/09_choice_request_v49.js）が済ませている。
   複数選択中の一時的なチェック状態だけは UI ローカルに持つが、
   これは権威ある状態ではなく、確定時に Action へ変換される。
   node 回帰テストではこのファイルの関数は呼ばれない（DOM非依存を保つ）。
   ========================================================================= */

/* 複数選択中の一時バッファ（UI専用。gameStateには入れない） */
let CHOICE_UI_SEL_V49 = [];

/* ルール層からの唯一の呼び出し口 */
function onChoiceRequestOpenedV49(pc){
  CHOICE_UI_SEL_V49 = [];
  renderChoiceSheetV49();
}

function renderChoiceSheetV49(){
  const pc = (typeof pendingChoiceV49==='function') ? pendingChoiceV49(gameState) : null;
  if(!pc){ if(typeof closeSheet==='function') closeSheet(); return; }
  if(typeof sheet==='undefined' || !sheet) return;

  const multi = pc.max > 1 || pc.min !== pc.max;
  const sel = CHOICE_UI_SEL_V49;

  const rows = (pc.candidates||[]).map((c,i)=>{
    const on = sel.indexOf(c.key) >= 0;
    let thumb = '';
    if(!c.hidden && c.uid!=null && typeof findCardByUid==='function'){
      const hit = findCardByUid(c.uid);
      const db  = hit && typeof dbOf==='function' ? dbOf(hit.card) : null;
      if(db && db.c) thumb = `<span class="pk-thumb"><img src="${IMG_BASE}${db.c}.webp" onerror="this.parentElement.style.display='none'"></span>`;
    }
    const mark = multi ? `<span class="pk-mark">${on?'☑':'☐'}</span>` : '';
    return `<div class="act pick-row${on?' on':''}" onclick="__choicePickV49(${i})">
       ${mark}${thumb}<span class="pk-copy"><span class="pk-nm">${c.label}</span>
       ${c.sub?`<span class="pk-sub">${c.sub}</span>`:''}</span>
     </div>`;
  }).join('');

  const who = (typeof nameOf==='function') ? nameOf(pc.player) : `P${pc.player}`;
  const count = pc.min===pc.max ? `${pc.max}件` : `${pc.min}〜${pc.max}件`;
  const head  = `${who} が選択（${count}）`;

  const commit = multi
    ? `<div class="act fx${sel.length>=pc.min&&sel.length<=pc.max?'':' off'}" onclick="__choiceCommitV49()">決定（${sel.length}/${pc.max}）</div>`
    : '';
  const cancel = pc.cancelable
    ? `<button class="close" onclick="__choiceCancelV49()">やめる</button>` : '';

  /* S03-U173: 破壊の身代わり — 守るカードを先頭に表示する */
  let subHead = '';
  const subInfo = (typeof destroySubSheetInfoS03==='function') ? destroySubSheetInfoS03(pc) : null;
  if(subInfo){
    const hit = (typeof findCardByUid==='function') ? findCardByUid(subInfo.uid) : null;
    const db = hit && typeof dbOf==='function' ? dbOf(hit.card) : null;
    subHead = `<div class="sheet-card" style="margin-bottom:6px">${db?cardThumb(db):''}<div class="sheet-info"><div class="meta">守るカード</div><h3>${subInfo.name}</h3></div></div>`;
  }
  sheet.innerHTML = `<div class="grip"></div>${subHead}
    <h3 style="margin-bottom:4px">${pc.title}</h3>
    <div class="meta" style="margin-bottom:10px">${head}${pc.note?`<br>${pc.note}`:''}</div>
    <div class="pick-list">${rows}</div>
    <div class="act-grid" style="margin-top:10px">
      ${commit}
      <div class="act" onclick="peekBoard()">盤面を確認する</div>
    </div>
    ${cancel}`;
  if(typeof veil!=='undefined' && veil) veil.classList.add('on');
}

/* 候補クリック。単一選択なら即確定、複数選択ならトグル。 */
function __choicePickV49(i){
  const pc = (typeof pendingChoiceV49==='function') ? pendingChoiceV49(gameState) : null;
  if(!pc) return;
  const c = (pc.candidates||[])[i];
  if(!c) return;

  const multi = pc.max > 1 || pc.min !== pc.max;
  if(!multi){ answerChoiceV49([c.key]); return; }

  const at = CHOICE_UI_SEL_V49.indexOf(c.key);
  if(at >= 0) CHOICE_UI_SEL_V49.splice(at,1);
  else {
    if(CHOICE_UI_SEL_V49.length >= pc.max){
      if(typeof showToast==='function') showToast(`${pc.max}件までです`);
      return;
    }
    CHOICE_UI_SEL_V49.push(c.key);
  }
  renderChoiceSheetV49();
}

function __choiceCommitV49(){
  const pc = (typeof pendingChoiceV49==='function') ? pendingChoiceV49(gameState) : null;
  if(!pc) return;
  if(CHOICE_UI_SEL_V49.length < pc.min){
    if(typeof showToast==='function') showToast(`${pc.min}件以上選んでください`);
    return;
  }
  answerChoiceV49(CHOICE_UI_SEL_V49.slice());
}

function __choiceCancelV49(){
  CHOICE_UI_SEL_V49 = [];
  cancelChoiceV49();
}

/* 保存データから復帰した直後・Undo/Redo 直後に選択待ちを描き直す。
   registry 経路なら復元できる。legacy 経路は
   reconcileChoiceAfterLoadV49() が先に落としている。 */
function refreshChoiceSheetV49(){
  const pc = (typeof pendingChoiceV49==='function') ? pendingChoiceV49(gameState) : null;
  if(pc) renderChoiceSheetV49();
}

