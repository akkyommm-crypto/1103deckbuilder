/* System v4.9.0 — P1 ChoiceRequest / ChoiceAnswer 回帰テスト
   検証項目:
     ユニット / 直列化 / Replay / Undo / Redo / Save-Load / Action Journal /
     ルール・UI分離 / legacy経路の明示 / digest後方互換                     */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
js=js.replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');

const probe=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__; NAME_INDEX=null; MAT_SPEC_CACHE.clear(); buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
let __abortCalls=0; abortResolve=()=>{__abortCalls++;};

let __u=96500;
function mk(n,p=0){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);return {id,owner:p,controller:p,face:'up',pos:'atk',uid:__u++};}
function resetP1(){
  gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';
  PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;
  resetChoiceStatsV49();__abortCalls=0;
  v41ResetActionJournal(gameState);
}
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
function cands2(){
  const a=mk('ライオウ'),b=mk('人造人間－サイコ・ショッカー');
  gameState.players[0].mz=[a,b];
  /* Replay初期状態は「盤面を組み終えた後」に取る。
     先に取ると、直接代入した盤面がJournalに現れず audit が必ず不一致になる。 */
  v41ResetActionJournal(gameState);
  return [{p:0,zone:'mz',index:0,card:a},{p:0,zone:'mz',index:1,card:b}];
}
/* 継続ハンドラ（registry = P1移行済み経路） */
registerChoiceHandlerV49('p1test.toGrave',(ans,args)=>{
  if(ans.cancelled) return;
  const c=ans.cards[0]; if(!c||c.zone==null) return;
  act({type:'FX_TO_GRAVE',player:c.p,zone:c.zone,index:c.index,reason:args.reason||'test'});
});
let __noopRuns=0;
registerChoiceHandlerV49('p1test.noop',(ans)=>{ __noopRuns++; });

/* ---- 1. registry経路: 生成 → 回答 → 解決 ---- */
resetP1();
let cs=cands2();
let opened=requestChoiceV49({kind:'card',title:'破壊するモンスター',candidates:cs,min:1,max:1,
  resume:{handler:'p1test.toGrave',args:{reason:'ユニットテスト'}}});
let pc=pendingChoiceV49(gameState);
ok('P1 registry: 選択待ちが生成される',opened===true&&!!pc&&pc.candidates.length===2);
ok('P1 registry: legacyではない',pc.legacy===false&&pc.resume.mode==='registry');
ok('P1 registry: pendingChoiceは直列化可能',assertChoiceSerializableV49(gameState).ok,assertChoiceSerializableV49(gameState).why);
let key0=pc.candidates[0].key;
let answered=answerChoiceV49([key0]);
ok('P1 registry: 回答で継続が走り墓地へ送られる',answered===true&&gameState.players[0].grave.length===1&&gameState.players[0].mz.length===1,
   'grave='+gameState.players[0].grave.length+' mz='+gameState.players[0].mz.length);
ok('P1 registry: 回答後は選択待ちが解除される',pendingChoiceV49(gameState)===null);

/* ---- 2. 候補外の回答は拒否 ---- */
resetP1();cs=cands2();
requestChoiceV49({kind:'card',title:'t',candidates:cs,min:1,max:1,resume:{handler:'p1test.noop',args:{}}});
let bad=answerChoiceV49(['存在しないキー']);
ok('P1 検証: 候補外の回答は拒否される',bad===false&&!!pendingChoiceV49(gameState));
ok('P1 検証: 拒否時に継続は走らない',__noopRuns===0);

/* ---- 3. min/max 検証 ---- */
resetP1();cs=cands2();
requestChoiceV49({kind:'card',title:'2枚選ぶ',candidates:cs,min:2,max:2,resume:{handler:'p1test.noop',args:{}}});
pc=pendingChoiceV49(gameState);
let k0=pc.candidates[0].key,k1=pc.candidates[1].key;
ok('P1 枚数: 不足は拒否',answerChoiceV49([k0])===false);
ok('P1 枚数: 重複は拒否',answerChoiceV49([k0,k0])===false);
ok('P1 枚数: ちょうどは受理',answerChoiceV49([k0,k1])===true);
resetP1();cs=cands2();
requestChoiceV49({kind:'card',title:'2枚まで',candidates:cs,min:0,max:2,resume:{handler:'p1test.noop',args:{}}});
ok('P1 枚数: 0枚可の選択で空回答が通る',answerChoiceV49([])===true);
resetP1();cs=cands2();
requestChoiceV49({kind:'card',title:'1枚まで',candidates:cs,min:0,max:1,resume:{handler:'p1test.noop',args:{}}});
pc=pendingChoiceV49(gameState);
ok('P1 枚数: 上限超過は拒否',answerChoiceV49([pc.candidates[0].key,pc.candidates[1].key])===false);

/* ---- 4. プレイヤー指定選択（相手が選ぶ） ---- */
resetP1();cs=cands2();
requestChoiceV49({kind:'card',title:'相手が選ぶ',player:1,candidates:cs,min:1,max:1,resume:{handler:'p1test.noop',args:{}}});
pc=pendingChoiceV49(gameState);
ok('P1 プレイヤー指定: 相手が選ぶ選択を表現できる',pc.player===1);
ok('P1 プレイヤー指定: Actionのplayerも相手',V41_ACTION_JOURNAL[V41_ACTION_JOURNAL.length-1].action.player===1);

/* ---- 5. 対象/非対象の区別 ----
   対象耐性はカードのフラグではなくテキスト由来なので、
   エンジンが実際に参照する TARGET_IMMUNE_CACHE を使って「ライオウは対象に取れない」状態を作る。 */
resetP1();cs=cands2();
TARGET_IMMUNE_CACHE.set('ライオウ',true);
requestChoiceV49({kind:'card',title:'対象を取る',candidates:cs,min:1,max:1,targeting:true,resume:{handler:'p1test.noop',args:{}}});
let tgCount=pendingChoiceV49(gameState).candidates.length;
resetP1();cs=cands2();
requestChoiceV49({kind:'card',title:'非対象選択',candidates:cs,min:1,max:1,targeting:false,resume:{handler:'p1test.noop',args:{}}});
let ntCount=pendingChoiceV49(gameState).candidates.length;
TARGET_IMMUNE_CACHE.delete('ライオウ');
ok('P1 対象耐性: targeting=true では除外される',tgCount===1,'tg='+tgCount);
ok('P1 非対象選択: targeting=false では除外されない',ntCount===2,'nt='+ntCount);

/* ---- 6. 非公開候補 ---- */
resetP1();cs=cands2();
requestChoiceV49({kind:'card',title:'伏せて選ぶ',candidates:cs,min:1,max:1,revealed:false,resume:{handler:'p1test.noop',args:{}}});
pc=pendingChoiceV49(gameState);
ok('P1 非公開: 候補が伏せられラベルが漏れない',
   pc.revealed===false&&pc.candidates.every(c=>c.hidden===true&&c.label==='裏側のカード'));
ok('P1 非公開: uidは保持され解決はできる',pc.candidates.every(c=>c.uid!=null));

/* ---- 7. 直列化（関数・DOM・Mapが入っていない） ---- */
resetP1();cs=cands2();
requestChoiceV49({kind:'card',title:'直列化',candidates:cs,min:1,max:1,resume:{handler:'p1test.toGrave',args:{reason:'x'}}});
let ser=assertChoiceSerializableV49(gameState);
let round=JSON.parse(JSON.stringify(gameState.pendingChoice));
function scanFns(v,d){ if(d>10||v===null||typeof v!=='object')return typeof v==='function';
  return Object.keys(v).some(k=>typeof v[k]==='function'||scanFns(v[k],d+1)); }
ok('P1 直列化: pendingChoiceに関数・DOMが無い',ser.ok,ser.why);
ok('P1 直列化: JSON往復で完全復元',JSON.stringify(round)===JSON.stringify(gameState.pendingChoice));
ok('P1 直列化: gameState全体に関数が混入していない',!scanFns(JSON.parse(JSON.stringify(gameState)),0));

/* ---- 8. Replay: 選択を含む解決が完全再現される ---- */
resetP1();cs=cands2();
requestChoiceV49({kind:'card',title:'Replay',candidates:cs,min:1,max:1,resume:{handler:'p1test.toGrave',args:{reason:'replay'}}});
answerChoiceV49([pendingChoiceV49(gameState).candidates[0].key]);
let pkg=v41ReplayPackage(gameState),audit=v44ReplayAuditPackage(pkg);
ok('P1 Replay: 選択を含む解決がdigest一致で再生される',audit.ok,audit.reason||audit.finalDigest);

/* ---- 9. Replay: 盤面差分ゼロの選択も記録・再現される（P1の主目的） ---- */
resetP1();cs=cands2();
__noopRuns=0;
let digestBefore=v41StateDigest(gameState);
requestChoiceV49({kind:'yesno',title:'効果を使うか',min:1,max:1,cancelable:false,
  candidates:[{key:'yes',label:'はい',value:true},{key:'no',label:'いいえ',value:false}],
  resume:{handler:'p1test.noop',args:{}}});
let digestPending=v41StateDigest(gameState);
answerChoiceV49(['no']);
let digestAfter=v41StateDigest(gameState);
let jTypes=V41_ACTION_JOURNAL.map(e=>e.action.type);
ok('P1 Replay: 選択待ちはdigestに現れる',digestBefore!==digestPending);
ok('P1 Replay: 盤面差分ゼロの選択でも解決後digestは元へ戻る',digestAfter===digestBefore);
ok('P1 Replay: 盤面差分ゼロでもJournalに残る',
   jTypes.includes('CHOICE_OPEN_V49')&&jTypes.includes('CHOICE_ANSWER_V49'),jTypes.join(','));
pkg=v41ReplayPackage(gameState);audit=v44ReplayAuditPackage(pkg);
ok('P1 Replay: 盤面差分ゼロの選択がdigest一致で再生される',audit.ok,audit.reason||audit.finalDigest);
ok('P1 Replay: 再生時に継続を再実行しない（二重適用防止）',__noopRuns===1,'runs='+__noopRuns);

/* ---- 10. digest後方互換: 選択待ちでなければ従来と同一 ---- */
resetP1();cs=cands2();
let txtNoChoice=v41StateDigestText(gameState);
ok('P1 後方互換: pendingChoice=nullではdigest文字列にPCを足さない',txtNoChoice.indexOf('||PC')<0);
requestChoiceV49({kind:'card',title:'x',candidates:cs,min:1,max:1,resume:{handler:'p1test.noop',args:{}}});
ok('P1 後方互換: 選択待ちのときだけPCが載る',v41StateDigestText(gameState).indexOf('||PC')>=0);
answerChoiceV49([pendingChoiceV49(gameState).candidates[0].key]);
ok('P1 後方互換: 解除後は再びPCが消える',v41StateDigestText(gameState).indexOf('||PC')<0);

/* ---- 11. Undo ---- */
resetP1();cs=cands2();
requestChoiceV49({kind:'card',title:'Undo',candidates:cs,min:1,max:1,resume:{handler:'p1test.toGrave',args:{reason:'u'}}});
answerChoiceV49([pendingChoiceV49(gameState).candidates[0].key]);
ok('P1 Undo: 前提として墓地に送られている',gameState.players[0].grave.length===1);
undo();
ok('P1 Undo: 継続の結果が巻き戻る',gameState.players[0].grave.length===0);
undo();
ok('P1 Undo: 選択待ち状態へ戻れる',!!pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).title==='Undo');
undo();
ok('P1 Undo: 選択発行前まで戻ると選択待ちが消える',pendingChoiceV49(gameState)===null);

/* ---- 12. Redo ---- */
redo();
ok('P1 Redo: 選択待ちが復元される',!!pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).title==='Undo');
ok('P1 Redo: 復元後も直列化可能',assertChoiceSerializableV49(gameState).ok);
redo();
ok('P1 Redo: 回答済み状態へ進める',pendingChoiceV49(gameState)===null);
redo();
ok('P1 Redo: 継続の結果まで復元される',gameState.players[0].grave.length===1);

/* ---- 13. Action Journal ---- */
resetP1();cs=cands2();
requestChoiceV49({kind:'card',title:'Journal',candidates:cs,min:1,max:1,resume:{handler:'p1test.noop',args:{}}});
answerChoiceV49([pendingChoiceV49(gameState).candidates[0].key]);
let openEntry=V41_ACTION_JOURNAL.find(e=>e.action.type==='CHOICE_OPEN_V49');
let ansEntry =V41_ACTION_JOURNAL.find(e=>e.action.type==='CHOICE_ANSWER_V49');
ok('P1 Journal: CHOICE_OPEN_V49が記録される',!!openEntry);
ok('P1 Journal: CHOICE_ANSWER_V49が記録される',!!ansEntry);
ok('P1 Journal: seq/rngBefore/digestが付く',
   !!ansEntry&&Number.isFinite(Number(ansEntry.seq))&&Number.isFinite(Number(ansEntry.rngBefore))&&typeof ansEntry.digest==='string'&&ansEntry.digest.length>0);
ok('P1 Journal: 回答Actionは選択キーを保持する',!!ansEntry&&Array.isArray(ansEntry.action.keys)&&ansEntry.action.keys.length===1);
ok('P1 Journal: 発行Actionは候補を純データで保持する',
   !!openEntry&&Array.isArray(openEntry.action.choice.candidates)&&!scanFns(openEntry.action.choice,0));

/* ---- 14. ルール層がUI無しで完走する ---- */
resetP1();cs=cands2();
const __savedHook=(typeof onChoiceRequestOpenedV49==='function')?onChoiceRequestOpenedV49:null;
onChoiceRequestOpenedV49=undefined;
let uiFree=true;
try{
  requestChoiceV49({kind:'card',title:'UI無し',candidates:cs,min:1,max:1,resume:{handler:'p1test.toGrave',args:{reason:'nodom'}}});
  answerChoiceV49([pendingChoiceV49(gameState).candidates[0].key]);
}catch(e){ uiFree=false; }
ok('P1 UI分離: UIフック無しでも選択→回答→解決まで完走する',uiFree&&gameState.players[0].grave.length===1);
if(__savedHook) onChoiceRequestOpenedV49=__savedHook;

/* ---- 15. legacy経路は明示され、移行済みに数えない ---- */
resetP1();cs=cands2();
let legacyGot=null;
API.selectCard('legacy選択',cs,(t)=>{legacyGot=t;});
pc=pendingChoiceV49(gameState);
let stats=choiceStatsV49();
ok('P1 legacy: API.selectCardもChoiceRequestを経由する',!!pc&&pc.candidates.length===2);
ok('P1 legacy: legacyとして明示される',pc.legacy===true&&pc.resume.mode==='legacy');
ok('P1 legacy: 移行済みに数えない',stats.legacy===1&&stats.migrated===0);
ok('P1 legacy: legacyでもpendingChoiceは直列化可能',assertChoiceSerializableV49(gameState).ok);
answerChoiceV49([pc.candidates[0].key]);
ok('P1 legacy: 既存onPickは従来どおり候補を受け取る',!!legacyGot&&legacyGot.uid!=null);

/* ---- 16. legacy継続の消失を安全に扱う ---- */
resetP1();cs=cands2();
API.selectCard('消失テスト',cs,()=>{throw new Error('呼ばれてはいけない');});
CHOICE_LEGACY_CB_V49.clear();
let crashed=false;
try{ answerChoiceV49([pendingChoiceV49(gameState).candidates[0].key]); }catch(e){ crashed=true; }
ok('P1 legacy: 継続消失でも例外を投げない',!crashed);
ok('P1 legacy: 継続消失は安全に中止される',__abortCalls===1&&choiceStatsV49().lostContinuation===1);
ok('P1 legacy: 継続消失後に選択待ちが残らない',pendingChoiceV49(gameState)===null);

/* ---- 17. Save/Load 復帰 ---- */
resetP1();cs=cands2();
requestChoiceV49({kind:'card',title:'保存復帰',candidates:cs,min:1,max:1,resume:{handler:'p1test.toGrave',args:{reason:'save'}}});
let saved=JSON.parse(JSON.stringify(gameState));
gameState=saved;
reconcileChoiceAfterLoadV49(gameState);
ok('P1 Save/Load: registry経路は復帰後も選択待ちが残る',!!pendingChoiceV49(gameState));
answerChoiceV49([pendingChoiceV49(gameState).candidates[0].key]);
ok('P1 Save/Load: 復帰後の回答で継続が正しく走る',gameState.players[0].grave.length===1);
resetP1();cs=cands2();
API.selectCard('legacy保存',cs,()=>{});
let savedLegacy=JSON.parse(JSON.stringify(gameState));
gameState=savedLegacy;CHOICE_LEGACY_CB_V49.clear();
reconcileChoiceAfterLoadV49(gameState);
ok('P1 Save/Load: 復元できないlegacy選択は安全に解除される',pendingChoiceV49(gameState)===null);

/* ---- 18. 進行ガード ---- */
resetP1();cs=cands2();
requestChoiceV49({kind:'card',title:'ガード',candidates:cs,min:1,max:1,resume:{handler:'p1test.noop',args:{}}});
ok('P1 ガード: 選択待ち中は他の進行を止める',duelFlowBusyReasonV30('phase')==='効果解決中の選択待ちです');

/* ---- 19. キャンセル ---- */
resetP1();cs=cands2();
requestChoiceV49({kind:'card',title:'取消可',candidates:cs,min:1,max:1,cancelable:true,resume:{handler:'p1test.noop',args:{}}});
let cancelled=cancelChoiceV49();
ok('P1 取消: cancelableな選択は取り消せる',cancelled===true&&pendingChoiceV49(gameState)===null);
ok('P1 取消: 取消もJournalに残る',V41_ACTION_JOURNAL.some(e=>e.action.type==='CHOICE_CANCEL_V49'));
resetP1();cs=cands2();
requestChoiceV49({kind:'card',title:'取消不可',candidates:cs,min:1,max:1,cancelable:false,resume:{handler:'p1test.noop',args:{}}});
ok('P1 取消: cancelable=falseは取り消せない',cancelChoiceV49()===false&&!!pendingChoiceV49(gameState));

/* ---- 20. 未登録ハンドラは発行時に落とす ---- */
resetP1();cs=cands2();
let threw=false;
try{ requestChoiceV49({kind:'card',title:'未登録',candidates:cs,min:1,max:1,resume:{handler:'存在しない',args:{}}}); }
catch(e){ threw=true; }
ok('P1 安全性: 未登録ハンドラは発行時に検出される',threw&&pendingChoiceV49(gameState)===null);

/* ---- 21. 不可能選択は発行しない（候補 < min） ---- */
resetP1();cs=cands2();
let one=[cs[0]];
let r21a=requestChoiceV49({kind:'card',title:'2枚必要だが1枚しかない',candidates:one,min:2,max:2,
  resume:{handler:'p1test.noop',args:{}}});
ok('P1 不可能選択: 候補がminに満たなければ発行しない',r21a===false&&pendingChoiceV49(gameState)===null,
   'ret='+r21a);
resetP1();cs=cands2();
let r21b=requestChoiceV49({kind:'card',title:'候補ゼロ',candidates:[],min:1,max:1,
  resume:{handler:'p1test.noop',args:{}}});
ok('P1 不可能選択: 候補ゼロで必須選択も発行しない',r21b===false&&pendingChoiceV49(gameState)===null);
resetP1();cs=cands2();
let r21c=requestChoiceV49({kind:'card',title:'3枚必要',candidates:cs,min:3,max:3,
  resume:{handler:'p1test.noop',args:{}}});
ok('P1 不可能選択: 2候補に対しmin=3も発行しない',r21c===false&&pendingChoiceV49(gameState)===null);
resetP1();cs=cands2();
__noopRuns=0;
requestChoiceV49({kind:'card',title:'不可能選択で継続は走らない',candidates:[cs[0]],min:2,max:2,
  resume:{handler:'p1test.noop',args:{}}});
ok('P1 不可能選択: 継続も走らない',__noopRuns===0);
resetP1();cs=cands2();
let r21d=requestChoiceV49({kind:'card',title:'min=0は候補ゼロでも成立',candidates:[],min:0,max:2,
  resume:{handler:'p1test.noop',args:{}}});
ok('P1 不可能選択: min=0（境界）は従来どおり発行される',r21d===true&&!!pendingChoiceV49(gameState));

/* ---- 22. stale候補: uid解決失敗時に座標へフォールバックしない ---- */
let __staleGot=null;
registerChoiceHandlerV49('p1test.record',(ans)=>{ __staleGot=ans.cards[0]||null; });
resetP1();cs=cands2();
requestChoiceV49({kind:'card',title:'stale検証',candidates:cs,min:1,max:1,
  resume:{handler:'p1test.record',args:{}}});
pc=pendingChoiceV49(gameState);
let chosenUid=pc.candidates[0].uid;
/* 選択したカードを場から除き、同じ zone/index に別カードを置く */
let replacement=mk('青眼の白龍');
gameState.players[0].mz[0]=replacement;
ok('P1 stale: 前提として同じ座標に別uidのカードがある',
   gameState.players[0].mz[0].uid!==chosenUid&&findCardByUidInState(gameState,chosenUid)===null);
__staleGot=null;
let staleAnswered=answerChoiceV49([pc.candidates[0].key]);
ok('P1 stale: 回答自体は受理される',staleAnswered===true);
ok('P1 stale: 差し替わったカードを掴まない',
   !!__staleGot&&__staleGot.stale===true&&__staleGot.zone===undefined&&__staleGot.card===undefined,
   'got='+JSON.stringify(__staleGot&&{stale:__staleGot.stale,zone:__staleGot.zone,uid:__staleGot.uid}));
ok('P1 stale: 別カードに効果が当たっていない',
   gameState.players[0].grave.length===0&&gameState.players[0].mz[0].uid===replacement.uid);
/* uidを持たない候補（プレイヤー選択等）は従来どおり値で解決できる */
resetP1();cs=cands2();
let gotPlayer=null;
API.selectPlayer('プレイヤー選択',(p)=>{gotPlayer=p;});
answerChoiceV49([pendingChoiceV49(gameState).candidates[1].key]);
ok('P1 stale: uidを持たない候補は影響を受けない',gotPlayer===1,'got='+gotPlayer);

/* ---- 23. 発行前 JSON-safe 保証（candidate.value / resume.args） ---- */
function rejects(spec){
  const before=pendingChoiceV49(gameState);
  let threw=false;
  try{ requestChoiceV49(spec); }catch(e){ threw=true; }
  return threw && pendingChoiceV49(gameState)===before;
}
resetP1();cs=cands2();
ok('P1 JSON-safe: candidate.value に関数があれば発行を拒否',
   rejects({kind:'card',title:'fn',min:1,max:1,
     candidates:[{key:'a',label:'A',value:()=>{}}],resume:{handler:'p1test.noop',args:{}}}));
ok('P1 JSON-safe: candidate.value に Map があれば発行を拒否',
   rejects({kind:'card',title:'map',min:1,max:1,
     candidates:[{key:'a',label:'A',value:new Map()}],resume:{handler:'p1test.noop',args:{}}}));
ok('P1 JSON-safe: candidate.value に Set があれば発行を拒否',
   rejects({kind:'card',title:'set',min:1,max:1,
     candidates:[{key:'a',label:'A',value:new Set()}],resume:{handler:'p1test.noop',args:{}}}));
ok('P1 JSON-safe: candidate.value に DOM があれば発行を拒否',
   rejects({kind:'card',title:'dom',min:1,max:1,
     candidates:[{key:'a',label:'A',value:{nodeType:1,classList:{}}}],resume:{handler:'p1test.noop',args:{}}}));
ok('P1 JSON-safe: candidate.value が循環参照なら発行を拒否',
   rejects((()=>{const o={};o.self=o;return {kind:'card',title:'cyc',min:1,max:1,
     candidates:[{key:'a',label:'A',value:o}],resume:{handler:'p1test.noop',args:{}}};})()));
ok('P1 JSON-safe: resume.args に関数があれば発行を拒否',
   rejects({kind:'card',title:'args-fn',min:1,max:1,
     candidates:[{key:'a',label:'A',value:1}],resume:{handler:'p1test.noop',args:{f:()=>{}}}}));
ok('P1 JSON-safe: resume.args に Map があれば発行を拒否',
   rejects({kind:'card',title:'args-map',min:1,max:1,
     candidates:[{key:'a',label:'A',value:1}],resume:{handler:'p1test.noop',args:{m:new Map()}}}));
ok('P1 JSON-safe: 拒否後も選択待ちに入っていない',pendingChoiceV49(gameState)===null);
resetP1();cs=cands2();
let okValue=requestChoiceV49({kind:'card',title:'正常なvalue',min:1,max:1,
  candidates:[{key:'a',label:'A',value:{mode:'x',n:1,list:[1,2]}},{key:'b',label:'B',value:null}],
  resume:{handler:'p1test.noop',args:{tag:'ok',nested:{k:[1,'2',true]}}}});
ok('P1 JSON-safe: JSON-safeなvalue/argsは通る',okValue===true&&!!pendingChoiceV49(gameState));
ok('P1 JSON-safe: 通った選択は直列化検査もパスする',assertChoiceSerializableV49(gameState).ok);
ok('P1 JSON-safe: value が pendingChoice に保持される',
   JSON.stringify(pendingChoiceV49(gameState).candidates[0].value)==='{"mode":"x","n":1,"list":[1,2]}');
ok('P1 JSON-safe: チェッカーは正常値を誤検出しない',
   choiceJsonSafetyV49({a:1,b:'x',c:[1,2,{d:true}],e:null},'t').ok);
ok('P1 JSON-safe: NaN/Infinity も拒否する',
   !choiceJsonSafetyV49({a:NaN},'t').ok && !choiceJsonSafetyV49({a:Infinity},'t').ok);

globalThis.__R=R;
`;
js+='\n'+probe;

function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map();
const document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()};
const store=new Map();
const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};
c.window=c;c.globalThis=c;
try{
  vm.runInNewContext(js,c,{timeout:30000});
  console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));
  if(c.__R.some(x=>!x.ok)) process.exit(2);
}catch(e){ console.error(e.stack||e); process.exit(1); }

