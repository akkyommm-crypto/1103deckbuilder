/* =========================================================================
   System v4.4 — Replay Runner / branching preview
   -------------------------------------------------------------------------
   Replays the Action Journal from the captured initial gameState.

   Important design rules:
   - Replay applies recorded actions through applyAction(), not through act().
     Therefore playback never records itself, never creates Undo snapshots and
     never schedules autosave/render between individual entries.
   - rngBefore is restored before EACH action. Random operations are therefore
     reproducible even if legacy code consumed RNG between action boundaries.
   - digest is verification only. Sequence number is the authoritative cursor.
   - Preview uses a cloned gameState. The live duel can be restored unchanged,
     or the preview position can be adopted as a new branch.
   ========================================================================= */
let V44_REPLAY_SESSION = null;

function v44ReplayReady(pkg){
  const v=v41ValidateReplayPackage(pkg);
  if(!v.ok) return {ok:false,reason:v.reason||'invalid package'};
  if(Number(pkg.replayVersion)<4 || !pkg.initialState) return {ok:false,reason:'開始盤面が記録されていません'};
  if(pkg.truncated) return {ok:false,reason:'Journalが2000件上限で切り詰められています'};
  return {ok:true,count:(pkg.actions||[]).length};
}
function v44ReplayStateFromPackage(pkg){
  const g=v44ReplayStateClone(pkg&&pkg.initialState);
  if(!g) return null;
  g.__v41Seq=0;
  g.__v41ReplayApplying=true;
  g.__v44ReplayPreview=true;
  return g;
}
function v44ReplaySetMode(pkg){
  if(typeof PLAY_MODE==='undefined') return null;
  const old=PLAY_MODE;
  if(pkg&&pkg.playMode&&Object.values(PLAY_MODES).includes(pkg.playMode)) PLAY_MODE=pkg.playMode;
  return old;
}
function v44ApplyReplayEntry(entry){
  if(!gameState||!entry||!entry.action) return {ok:false,reason:'entry'};
  gameState.__v41ReplayApplying=true;
  gameState.__v44ReplayPreview=true;
  gameState.rngState=Number(entry.rngBefore)>>>0;
  const a=v41JournalClone(entry.action);
  applyAction(gameState,a);
  if(typeof updateTimingWindow==='function') updateTimingWindow(gameState,a);
  gameState.__v41Seq=Number(entry.seq)||0;
  const actual=v41StateDigest(gameState);
  const expected=entry.digest||'';
  const rngActual=Number(gameState.rngState)>>>0;
  const rngExpected=Number(entry.rngState)>>>0;
  if(expected && actual!==expected) return {ok:false,reason:'digest',seq:entry.seq,expected,actual,rngExpected,rngActual};
  if(Number.isFinite(Number(entry.rngState)) && rngActual!==rngExpected)
    return {ok:false,reason:'rng',seq:entry.seq,expected:rngExpected,actual:rngActual};
  return {ok:true,seq:entry.seq,digest:actual,rngState:rngActual};
}
function v44ReplayAuditPackage(pkg){
  const ready=v44ReplayReady(pkg); if(!ready.ok) return ready;
  const initial=v44ReplayStateFromPackage(pkg); if(!initial) return {ok:false,reason:'initialState'};
  const live=gameState, oldMode=v44ReplaySetMode(pkg);
  let result={ok:true,count:0,finalDigest:null};
  try{
    gameState=initial;
    const initialActual=v41StateDigest(gameState);
    if(pkg.initialDigest&&initialActual!==pkg.initialDigest)
      return {ok:false,reason:'initialDigest',expected:pkg.initialDigest,actual:initialActual};
    for(let i=0;i<pkg.actions.length;i++){
      const r=v44ApplyReplayEntry(pkg.actions[i]);
      if(!r.ok){result=Object.assign({index:i},r);break;}
      result.count=i+1;
    }
    result.finalDigest=v41StateDigest(gameState);
    if(result.ok&&pkg.finalDigest&&result.finalDigest!==pkg.finalDigest)
      result={ok:false,reason:'finalDigest',count:result.count,expected:pkg.finalDigest,actual:result.finalDigest};
  } finally {
    gameState=live;
    if(oldMode!=null) PLAY_MODE=oldMode;
  }
  return result;
}
function v44AuditCurrentReplay(){
  const pkg=v41ReplayPackage(gameState), r=v44ReplayAuditPackage(pkg);
  if(r.ok) showToast(`Replay検証 PASS：${r.count} Action`);
  else showToast(`Replay検証 FAIL：${r.reason}${r.seq?` #${r.seq}`:''}`);
  openReplayDebugV41();
  return r;
}

function v44StartReplayPreview(){
  if(V44_REPLAY_SESSION){openReplayControlV44();return;}
  const pkg=v41ReplayPackage(gameState), ready=v44ReplayReady(pkg);
  if(!ready.ok){showToast(`Replay開始不可：${ready.reason}`);return;}
  const replayState=v44ReplayStateFromPackage(pkg);
  if(!replayState){showToast('Replay開始盤面を復元できません');return;}
  V44_REPLAY_SESSION={
    pkg:v41JournalClone(pkg), cursor:0, error:null,
    liveState:v44ReplayStateClone(gameState), livePackage:v41JournalClone(pkg),
    liveHistory:HISTORY.slice(), liveRedo:REDO.slice(), liveTurnActions:v41JournalClone(turnActions||[]),
    livePlayMode:(typeof PLAY_MODE!=='undefined'?PLAY_MODE:null),
  };
  gameState=replayState;
  v44ReplaySetMode(pkg);
  HISTORY.length=0; REDO.length=0; turnActions=[];
  render();
  openReplayControlV44();
}
function v44ReplaySeekIndex(target){
  const s=V44_REPLAY_SESSION; if(!s)return false;
  const max=s.pkg.actions.length;
  const to=Math.max(0,Math.min(max,Math.floor(Number(target)||0)));
  gameState=v44ReplayStateFromPackage(s.pkg);
  v44ReplaySetMode(s.pkg);
  s.cursor=0; s.error=null;
  for(let i=0;i<to;i++){
    const r=v44ApplyReplayEntry(s.pkg.actions[i]);
    if(!r.ok){s.error=Object.assign({index:i},r);break;}
    s.cursor=i+1;
  }
  render();
  openReplayControlV44();
  return !s.error;
}
function v44ReplayStep(count){
  const s=V44_REPLAY_SESSION; if(!s)return false;
  let n=Math.max(1,Math.floor(Number(count)||1));
  while(n-- > 0 && s.cursor<s.pkg.actions.length && !s.error){
    const entry=s.pkg.actions[s.cursor], r=v44ApplyReplayEntry(entry);
    if(!r.ok){s.error=Object.assign({index:s.cursor},r);break;}
    s.cursor++;
  }
  render();
  openReplayControlV44();
  return !s.error;
}
function v44ReplayBack(){
  const s=V44_REPLAY_SESSION;if(!s)return false;
  return v44ReplaySeekIndex(Math.max(0,s.cursor-1));
}
function v44ReplayToEnd(){
  const s=V44_REPLAY_SESSION;if(!s)return false;
  return v44ReplaySeekIndex(s.pkg.actions.length);
}
function v44ReplayAdoptPrefix(pkg,cursor,gs){
  const prefix=v41JournalClone((pkg.actions||[]).slice(0,cursor));
  V41_ACTION_JOURNAL=prefix;
  V41_ACTION_SEQ=prefix.length?Number(prefix[prefix.length-1].seq)||0:0;
  V41_ACTION_JOURNAL_TRUNCATED=false;
  V41_INITIAL_RNG_SEED=Number(pkg.initialRngSeed)||Number(gs.rngInitialSeed)||null;
  V44_REPLAY_INITIAL_STATE=v44ReplayStateClone(pkg.initialState);
  V44_REPLAY_INITIAL_PLAY_MODE=pkg.playMode||'duel';
  gs.__v41Seq=V41_ACTION_SEQ;
}
function v44ReplayBranchHere(){
  const s=V44_REPLAY_SESSION;if(!s)return;
  if(s.error){showToast('Replay不一致がある位置からは分岐できません');return;}
  delete gameState.__v41ReplayApplying; delete gameState.__v44ReplayPreview;
  v44ReplayAdoptPrefix(s.pkg,s.cursor,gameState);
  HISTORY.length=0; REDO.length=0; turnActions=[];
  V44_REPLAY_SESSION=null;
  render(); saveDuelSoon(); closeSheet();
  showToast('このReplay位置から新しい分岐を開始しました');
}
function v44ReplayExit(){
  const s=V44_REPLAY_SESSION;if(!s)return;
  gameState=v44ReplayStateClone(s.liveState);
  delete gameState.__v41ReplayApplying; delete gameState.__v44ReplayPreview;
  if(s.livePlayMode!=null) PLAY_MODE=s.livePlayMode;
  HISTORY.length=0; HISTORY.push(...s.liveHistory);
  REDO.length=0; REDO.push(...s.liveRedo);
  turnActions=v41JournalClone(s.liveTurnActions||[]);
  v41RestoreJournalPackage(s.livePackage,gameState);
  V44_REPLAY_SESSION=null;
  render(); closeSheet();
  showToast('元の盤面へ戻りました');
}
function openReplayControlV44(){
  const s=V44_REPLAY_SESSION;if(!s){openReplayDebugV41();return;}
  const total=s.pkg.actions.length, cur=s.cursor;
  const prev=cur>0?s.pkg.actions[cur-1]:null, next=cur<total?s.pkg.actions[cur]:null;
  const err=s.error?`<div class="meta" style="color:var(--red);margin-bottom:8px">不一致：${s.error.reason} / #${s.error.seq||'?'}<br>${s.error.actual||''}</div>`:'';
  sheet.innerHTML=`<div class="grip"></div><h3>Replay Runner v4.4</h3>
    <div class="meta" style="margin-bottom:10px">位置：<b>${cur} / ${total}</b>　seq：${gameState.__v41Seq||0}<br>現在：T${gameState.turn} ${phaseJp(gameState.phase)} / RNG ${gameState.rngState}<br>Digest：${v41StateDigest(gameState)}</div>
    ${err}
    <div class="dbg-list"><div class="dbg-entry"><div class="dbg-name">${prev?`再生済み #${prev.seq} ${prev.action.type}`:'開始盤面'}</div><div class="dbg-step">${next?`次：#${next.seq} ${next.action.type}`:'Replay終端'}</div></div></div>
    <div class="act-grid" style="margin-top:10px">
      <div class="act" onclick="v44ReplaySeekIndex(0)">⏮ 最初</div>
      <div class="act" onclick="v44ReplayBack()">◀ 1手戻す</div>
      <div class="act fx" onclick="v44ReplayStep(1)">1手進む ▶</div>
      <div class="act" onclick="v44ReplayStep(10)">10手進む</div>
      <div class="act" onclick="v44ReplayToEnd()">⏭ 最後まで</div>
      <div class="act fx" onclick="v44ReplayBranchHere()">ここから分岐</div>
    </div>
    <div class="act-grid wide" style="margin-top:8px"><div class="act warn" onclick="v44ReplayExit()">Replayを終了して元の盤面へ</div></div>`;
  veil.classList.add('on');
}
