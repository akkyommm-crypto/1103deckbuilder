/* =========================================================================
   System v4.1 — deterministic RNG / action journal groundwork
   -------------------------------------------------------------------------
   Goal: make future replay/branching verifiable without changing duel rules.

   - All known duel randomness is routed through a serializable xorshift state.
   - act(...) commits a JSON-safe action journal entry after the state settles.
   - Each journal entry carries a compact state digest. A future replay runner
     can stop exactly where legacy direct mutation makes playback diverge.

   The journal lives OUTSIDE gameState. HISTORY snapshots therefore stay small
   instead of copying an ever-growing replay log on every Undo checkpoint.
   ========================================================================= */
const V41_REPLAY_VERSION = 4;
const V41_ACTION_JOURNAL_MAX = 2000;
let V41_ACTION_JOURNAL = [];
let V41_ACTION_SEQ = 0;
let V41_INITIAL_RNG_SEED = null;
let V41_ACTION_JOURNAL_TRUNCATED = false;
let V41_LAST_SYNC_WARNING = '';
let V44_REPLAY_INITIAL_STATE = null;
let V44_REPLAY_INITIAL_PLAY_MODE = 'duel';


function v41SeedFromNow(){
  let n=(Date.now()>>>0) ^ 0x6d2b79f5;
  if(!n) n=0x6d2b79f5;
  return n>>>0;
}
function v41EnsureReplayState(gs){
  if(!gs) return null;
  if(!Number.isFinite(Number(gs.rngInitialSeed)) || !(Number(gs.rngInitialSeed)>>>0)) gs.rngInitialSeed=v41SeedFromNow();
  if(!Number.isFinite(Number(gs.rngState)) || !(Number(gs.rngState)>>>0)) gs.rngState=Number(gs.rngInitialSeed)>>>0;
  if(!Number.isFinite(Number(gs.replayVersion))) gs.replayVersion=V41_REPLAY_VERSION;
  if(!Number.isFinite(Number(gs.__v41Seq)) || Number(gs.__v41Seq)<0) gs.__v41Seq=0;
  return gs;
}
function v44ReplayStateClone(gs){
  if(!gs) return null;
  const out=JSON.parse(JSON.stringify(gs));
  delete out.__v41ReplayApplying;
  delete out.__v44ReplayPreview;
  return out;
}
function v44CaptureReplayInitialState(gs){
  const g=v41EnsureReplayState(gs||gameState);
  if(!g) return null;
  const snap=v44ReplayStateClone(g);
  if(snap) snap.__v41Seq=0;
  V44_REPLAY_INITIAL_STATE=snap;
  V44_REPLAY_INITIAL_PLAY_MODE=(typeof PLAY_MODE!=='undefined'&&PLAY_MODE)||'duel';
  return snap;
}
function v41ResetActionJournal(gs){
  const g=v41EnsureReplayState(gs||gameState);
  V41_ACTION_JOURNAL=[]; V41_ACTION_SEQ=0; V41_ACTION_JOURNAL_TRUNCATED=false; V41_LAST_SYNC_WARNING='';
  if(g) g.__v41Seq=0;
  V41_INITIAL_RNG_SEED=g ? (Number(g.rngInitialSeed)>>>0) : null;
  v44CaptureReplayInitialState(g);
}
function duelRandomU32(gs){
  const g=v41EnsureReplayState(gs||gameState);
  let x=Number(g.rngState)>>>0;
  x ^= (x << 13)>>>0;
  x ^= x >>> 17;
  x ^= (x << 5)>>>0;
  x >>>= 0;
  if(!x) x=0x9e3779b9;
  g.rngState=x;
  return x;
}
function duelRandom(gs){ return duelRandomU32(gs)/0x100000000; }
function duelRandomInt(max,gs){
  const m=Math.floor(Number(max)||0);
  return m>0 ? Math.floor(duelRandom(gs)*m) : 0;
}
function duelShuffleV41(arr,gs){
  const a=arr||[];
  for(let i=a.length-1;i>0;i--){
    const j=duelRandomInt(i+1,gs);
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

function v41JournalClone(value){
  try{return JSON.parse(JSON.stringify(value,(k,v)=>typeof v==='function'?undefined:v));}
  catch(e){return {type:String(value&&value.type||'UNSERIALIZABLE')};}
}
function v41StableDigestValueV44(v,depth){
  const d=Number(depth)||0; if(d>5) return '[max]';
  if(v==null || typeof v==='string' || typeof v==='number' || typeof v==='boolean') return v;
  if(Array.isArray(v)) return v.map(x=>v41StableDigestValueV44(x,d+1));
  if(typeof v==='object'){
    const out={};
    Object.keys(v).sort().forEach(k=>{
      const x=v[k]; if(typeof x==='function' || k==='xyz') return;
      out[k]=v41StableDigestValueV44(x,d+1);
    });
    return out;
  }
  return String(v);
}
function v41CardDigest(card){
  if(!card) return '-';
  const uid=card.uid!=null?card.uid:'?';
  const id=card.id!=null?card.id:(card.token&&card.token.n)||'?';
  const face=card.face||''; const pos=card.pos||'';
  // System v4.4: Replay検証は配置だけでなくカード内部状態も比較する。
  // primitive flag は将来追加されたカード固有flagも自動で拾い、複合状態は裁定に影響するものを固定で含める。
  const meta={};
  Object.keys(card).sort().forEach(k=>{
    if(['uid','id','face','pos','xyz'].includes(k)) return;
    const v=card[k];
    if(v==null || typeof v==='string' || typeof v==='number' || typeof v==='boolean') meta[k]=v;
  });
  ['mods','counters','graveInfo','banishInfo','procedureBaseStats','procedureBaseStatsPending','v380SummonMaterials','token','summonProvenance','moveProvenance','usedAsMaterial','declaration','negV13','statModsV14','lvModsV16','charV17','protV21','protUsedV21'].forEach(k=>{
    if(card[k]!=null) meta[k]=v41StableDigestValueV44(card[k],0);
  });
  const xyz=(card.xyz||[]).map(v41CardDigest).join(',');
  const ms=Object.keys(meta).length?JSON.stringify(meta):'';
  return `${uid}:${id}:${face}:${pos}${ms?`{${ms}}`:''}${xyz?`[${xyz}]`:''}`;
}
function v41PlayerDigest(P){
  const z=k=>(P[k]||[]).map(v41CardDigest).join('|');
  return [P.lp,z('hand'),z('deck'),z('mz'),z('sz'),P.field?v41CardDigest(P.field):'-',z('grave'),z('banish'),z('ex'),
    P.normalSummonUsed?1:0,JSON.stringify(P.temporaryFlags||{}),JSON.stringify(P.effectFlags||{})].join('~');
}
function v41StateDigestText(gs){
  const g=gs||gameState; v41EnsureReplayState(g);
  const parts=[g.turn,g.phase,g.activePlayer,g.priority,g.loser==null?'-':g.loser,g.duelEndedReason||'',g.rngState,
    v41PlayerDigest(g.players[0]),v41PlayerDigest(g.players[1]),
    JSON.stringify((g.chain||[]).map(x=>v41StableDigestValueV44({
      chainId:x.chainId,player:x.player,cardId:x.cardId,uid:x.uid,name:x.name,ss:x.ss,from:x.from,index:x.index,prepared:x.prepared,
      targets:x.targets,selection:x.selection,eventName:x.eventName,keep:x.keep,v4EffectKey:x.v4EffectKey,effectClass:x.effectClass,
      declaration:x.declaration,activationCost:x.activationCost,
      sourceNegatedAtActivation:x.sourceNegatedAtActivation,activationTurn:x.activationTurn,activationPhase:x.activationPhase,
      negated:x.negated,activationNegated:x.activationNegated,effectNegated:x.effectNegated,negateMode:x.negateMode,negateReason:x.negateReason
    },0))),
    JSON.stringify(g.runtimeEffects||[]),
    JSON.stringify(g.pendingSummon||null),JSON.stringify(g.pendingExV2||null),
    JSON.stringify(g.pendingAttack||null),g.attackNegated?1:0,JSON.stringify(g.deferredEvents||[])];
  /* v4.9 P1: 選択待ちのときだけ追記する。
     null のときにも追記すると、選択と無関係な全局面のdigestが変化し、
     既存のReplayパッケージと既存回帰テストが一斉に不一致になる。 */
  if(g.pendingChoice) parts.push('PC'+JSON.stringify(g.pendingChoice));
  /* CODEX-C01: this journaled resolution boundary changes whether an Action
     may end the duel, so it must be part of an in-progress replay digest. */
  if(g.specialWinDeferredS03) parts.push('SWD1');
  if(g.eventChainResumeV11) parts.push('ECR'+JSON.stringify(g.eventChainResumeV11));
  /* S03-U471: 発動準備の復元点は開いている間だけ追記する（空なら既存 digest は不変）。復元点を取った時点の digest で固定する。 */
  if(g.prepTxS03) parts.push('PTX'+g.prepTxS03.uid+':'+g.prepTxS03.d);
  /* P3: provenance は非空のときだけ追記する。
     provenance を持たない既存局面の digest はバイト単位で不変になる。 */
  const p3chain=(g.chain||[]).filter(x=>x&&x.costSnapshots&&x.costSnapshots.length)
    .map(x=>[x.chainId,JSON.stringify(x.costSnapshots)].join(':'));
  if(p3chain.length) parts.push('P3C'+p3chain.join(','));
  /* P1.1: 発動途中バッファは非空のときだけ追記し、既存digestを維持する。 */
  if(g.pendingDeclarationV11) parts.push('P11D'+JSON.stringify(g.pendingDeclarationV11));
  if(Array.isArray(g.pendingActivationCostV11)&&g.pendingActivationCostV11.length)
    parts.push('P11C'+JSON.stringify(g.pendingActivationCostV11));
  /* v20: 公開記録は非空のときだけ追記する。
     確認（inspect）は state を変えないので digest には一切現れない。 */
  if(Array.isArray(g.revealV20)&&g.revealV20.length) parts.push('RV20'+JSON.stringify(g.revealV20));
  return parts.join('||');
}
function v41HashText(text){
  let h=0x811c9dc5;
  for(let i=0;i<text.length;i++){
    h^=text.charCodeAt(i);
    h=Math.imul(h,0x01000193)>>>0;
  }
  return h.toString(16).padStart(8,'0');
}
function v41StateDigest(gs){ return v41HashText(v41StateDigestText(gs)); }
function v41RecordCommittedAction(a,rngBefore){
  if(typeof gameState==='undefined'||!gameState||gameState.__v41ReplayApplying) return null;
  const g=v41EnsureReplayState(gameState);
  if(V41_INITIAL_RNG_SEED==null) V41_INITIAL_RNG_SEED=Number(g.rngInitialSeed)>>>0;
  const seq=++V41_ACTION_SEQ;
  g.__v41Seq=seq;
  const entry={
    seq,
    turn:g.turn,
    phase:g.phase,
    action:v41JournalClone(a||{}),
    rngBefore:(Number.isFinite(Number(rngBefore))?Number(rngBefore):Number(g.rngState))>>>0,
    rngState:Number(g.rngState)>>>0,
    digest:v41StateDigest(g),
  };
  V41_ACTION_JOURNAL.push(entry);
  if(V41_ACTION_JOURNAL.length>V41_ACTION_JOURNAL_MAX){
    V41_ACTION_JOURNAL_TRUNCATED=true;
    V41_ACTION_JOURNAL.splice(0,V41_ACTION_JOURNAL.length-V41_ACTION_JOURNAL_MAX);
  }
  return entry;
}
function v41SyncJournalToState(gs){
  const g=v41EnsureReplayState(gs||gameState); if(!g) return 0;
  /* S03-U471: Undo / Redo / 読込では、開いていた発動準備の実行時対応表は無効（記録は gameState 側にある） */
  if(typeof prepTxRebuildLiveS03==='function') prepTxRebuildLiveS03(g);
  const seq=Math.max(0,Number(g.__v41Seq)||0);
  V41_LAST_SYNC_WARNING='';
  if(seq===0){
    V41_ACTION_JOURNAL=[]; V41_ACTION_SEQ=0;
    return 0;
  }
  const i=V41_ACTION_JOURNAL.findIndex(e=>e&&Number(e.seq)===seq);
  if(i>=0){
    const expected=V41_ACTION_JOURNAL[i].digest, actual=v41StateDigest(g);
    if(expected!==actual){
      V41_LAST_SYNC_WARNING=`seq ${seq} digest mismatch ${actual} != ${expected}`;
      try{console.warn('[Replay sync]',V41_LAST_SYNC_WARNING);}catch(e){}
    }
    V41_ACTION_JOURNAL=V41_ACTION_JOURNAL.slice(0,i+1);
    V41_ACTION_SEQ=seq;
    return V41_ACTION_JOURNAL.length;
  }
  // Exact sequence is unavailable (old save or a state older than a truncated journal).
  v41ResetActionJournal(g);
  V41_LAST_SYNC_WARNING=`seq ${seq} is not present in the retained journal`;
  return 0;
}
function v41ReplayPackage(gs){
  const g=v41EnsureReplayState(gs||gameState);
  const first=V41_ACTION_JOURNAL[0]||null, last=V41_ACTION_JOURNAL[V41_ACTION_JOURNAL.length-1]||null;
  return {
    replayVersion:V41_REPLAY_VERSION,
    systemVersion:g.systemVersion||'4.8.0',
    playMode:V44_REPLAY_INITIAL_PLAY_MODE||((typeof PLAY_MODE!=='undefined'&&PLAY_MODE)||'duel'),
    initialRngSeed:(V41_INITIAL_RNG_SEED==null?Number(g.rngInitialSeed):V41_INITIAL_RNG_SEED)>>>0,
    initialState:v44ReplayStateClone(V44_REPLAY_INITIAL_STATE),
    initialDigest:V44_REPLAY_INITIAL_STATE?v41StateDigest(V44_REPLAY_INITIAL_STATE):null,
    truncated:V41_ACTION_JOURNAL_TRUNCATED===true,
    firstSeq:first?Number(first.seq)||0:0,
    lastSeq:last?Number(last.seq)||0:0,
    actions:v41JournalClone(V41_ACTION_JOURNAL),
    finalDigest:v41StateDigest(g),
  };
}
function v41RestoreJournalPackage(pkg,gs){
  const g=v41EnsureReplayState(gs||gameState);
  const v=v41ValidateReplayPackage(pkg); if(!v.ok){v41ResetActionJournal(g);return false;}
  // v4.3以前のJournalには開始盤面が無く、完全Replayの起点にできない。
  // 盤面自体はそのまま再開し、ここから新しいv4.4 Journalを開始する。
  if(Number(pkg.replayVersion)<4 || !pkg.initialState){v41ResetActionJournal(g);return true;}
  V41_ACTION_JOURNAL=v41JournalClone(pkg.actions||[]);
  V41_ACTION_SEQ=V41_ACTION_JOURNAL.reduce((m,e)=>Math.max(m,Number(e.seq)||0),0);
  V41_ACTION_JOURNAL_TRUNCATED=pkg.truncated===true;
  V41_INITIAL_RNG_SEED=Number(pkg.initialRngSeed)||Number(g.rngInitialSeed)||null;
  V44_REPLAY_INITIAL_STATE=v44ReplayStateClone(pkg.initialState);
  V44_REPLAY_INITIAL_PLAY_MODE=pkg.playMode||'duel';
  g.__v41Seq=V41_ACTION_SEQ;
  return true;
}
function v41ReplayPackageJson(gs){ return JSON.stringify(v41ReplayPackage(gs),null,2); }
function v41ValidateReplayPackage(pkg){
  const ver=Number(pkg&&pkg.replayVersion)||0;
  if(!pkg||![3,4].includes(ver)) return {ok:false,reason:'replayVersion'};
  if(!Array.isArray(pkg.actions)) return {ok:false,reason:'actions'};
  for(let i=0;i<pkg.actions.length;i++){
    const e=pkg.actions[i]; if(!e||!e.action||!e.action.type) return {ok:false,reason:`action:${i}`};
  }
  return {ok:true,count:pkg.actions.length,legacy:ver<4};
}

function v41IsReplayRecording(){
  return typeof gameState!=='undefined' && !!gameState && gameState.__v41ReplayApplying!==true;
}

/* Developer-only inspector. Playback UI is intentionally deferred until all
   remaining direct-state legacy paths are actionized. */
function openReplayDebugV41(){
  if(typeof V44_REPLAY_SESSION!=='undefined'&&V44_REPLAY_SESSION){openReplayControlV44();return;}
  const pkg=v41ReplayPackage(gameState), last=(pkg.actions||[]).slice(-12).reverse();
  const rows=last.map(e=>`<div class="dbg-entry"><div class="dbg-name">#${e.seq} ${e.action.type}</div><div class="dbg-step">T${e.turn} ${e.phase} / RNG ${e.rngState} / ${e.digest}</div></div>`).join('');
  const ready=!!(pkg.initialState&&!pkg.truncated);
  sheet.innerHTML=`<div class="grip"></div><h3>Replay / RNG 診断 v4.4</h3><div class="meta" style="margin-bottom:10px">Actions: <b>${pkg.actions.length}</b>${pkg.truncated?' <b style="color:var(--red)">TRUNCATED</b>':''}<br>Initial seed: ${pkg.initialRngSeed}<br>Current RNG: ${gameState.rngState}<br>State digest: ${pkg.finalDigest}<br>Replay Runner: <b>${ready?'READY':'記録開始点なし/切り詰め済み'}</b></div><div class="dbg-list">${rows||'<div class="meta">まだ記録された操作はありません。</div>'}</div><div class="act-grid wide" style="margin-top:10px"><div class="act" onclick="exportReplayV41()">Replay JSONを書き出す</div>${ready?`<div class="act fx" onclick="v44AuditCurrentReplay()">全Actionを検証</div><div class="act fx" onclick="v44StartReplayPreview()">リプレイを最初から見る</div>`:''}</div><button class="close" onclick="openMenu()">戻る</button>`;
  veil.classList.add('on');
}
function exportReplayV41(){
  const text=v41ReplayPackageJson(gameState);
  try{
    const blob=new Blob([text],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=`yg1103_replay_T${gameState.turn}_${Date.now()}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    showToast('Replay JSONを書き出しました');
  }catch(e){ prompt('Replay JSON',text); }
}
