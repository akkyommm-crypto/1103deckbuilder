/* System P1.1 — Activation-time Choice common regression */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
js=js.replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');

const probe=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__; NAME_INDEX=null; MAT_SPEC_CACHE.clear(); buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
let __u=111000;
function mk(n,p=0){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);return {id,owner:p,controller:p,face:'up',pos:'atk',uid:__u++};}
function resetP11(){
  gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';
  PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;
  resetChoiceStatsV49();v41ResetActionJournal(gameState);
}
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
function linkAction(uid,name='テスト発動'){
  return {type:'CHAIN_ADD',player:0,cardId:findCardIndex('ライオウ'),uid,name,ss:1,from:'mz',index:0,prepared:true,targets:[],costSnapshots:takeCostSnapshotsV3(gameState)};
}
registerChoiceHandlerV49('p11test.commit',(ans,args)=>commitPreparedActivationV11(args.activation,{targets:args.targets||[],v4EffectKey:args.mode||null}));
registerChoiceHandlerV49('p11test.noop',()=>{});

/* declaration and cost are frozen on the link; P3 remains a distinct field. */
resetP11();
let src=mk('ライオウ'),cost=mk('青眼の白龍'); gameState.players[0].mz=[src];gameState.players[0].hand=[cost];v41ResetActionJournal(gameState);
act({type:'DECLARE_V11',player:0,kind:'attribute',value:'炎'});
let rec=recordActivationCostV11({player:0},'discard',[cost],['atk','def'],1);
act(linkAction(src.uid));
let link=gameState.chain[0];
ok('P1.1 declaration: CHAIN_ADDでlinkへ固定',link.declaration.kind==='attribute'&&link.declaration.value==='炎');
ok('P1.1 cost: identityをuidで固定',link.activationCost.length===1&&link.activationCost[0].refs[0]===cost.uid);
ok('P1.1 cost: P3 snapshotCardV3形式を再利用',link.activationCost[0].snapshots[0].uid===cost.uid&&link.activationCost[0].snapshots[0].atk!=null);
ok('P1.1 cost: amountを保持',link.activationCost[0].amount===1);
ok('P1.1/P3: costSnapshotsは別フィールド',Array.isArray(link.costSnapshots)&&link.costSnapshots.length===1&&link.costSnapshots!==link.activationCost);
ok('P1.1 buffer: CHAIN_ADD後は空',gameState.pendingDeclarationV11===null&&gameState.pendingActivationCostV11.length===0);
ok('P1.1 API: linkから宣言を読む',API.declared({chainId:link.chainId},'attribute')==='炎');
ok('P1.1 API: linkからコストを読む',API.activationCosts({chainId:link.chainId},'discard')[0].refs[0]===cost.uid);

/* target reading is uid-based and survives array reordering. */
resetP11();src=mk('ライオウ');let t1=mk('青眼の白龍'),t2=mk('人造人間－サイコ・ショッカー');
gameState.players[0].mz=[src,t1,t2];v41ResetActionJournal(gameState);
let targetData=serializeChainSelectionV2([{p:0,zone:'mz',index:1,card:t1}]);
let a=linkAction(src.uid);a.targets=targetData;act(a);gameState.players[0].mz=[src,t2,t1];
let restored=API.chainLinkTargets(gameState.chain[0].chainId);
ok('P1.1 targets: 既存serializeをuidで復元',restored.length===1&&restored[0].card.uid===t1.uid&&restored[0].index===2);

/* persistent declaration is zone-local. */
resetP11();src=mk('ライオウ');gameState.players[0].mz=[src];v41ResetActionJournal(gameState);
act({type:'DECLARE_V11',player:0,kind:'cardName',value:'青眼の白龍',persistUid:src.uid});
ok('P1.1 persistent: card上に保持',src.declaration.value==='青眼の白龍'&&API.persistentDeclaration(src,'cardName')==='青眼の白龍');
act({type:'MOVE',player:0,from:'mz',fromIndex:0,to:'grave',face:'up'});
ok('P1.1 freshness: 領域移動でcard.declaration消去',gameState.players[0].grave[0].declaration===undefined);

/* abort/re-activation cannot reuse stale buffers. */
resetP11();src=mk('ライオウ');cost=mk('青眼の白龍');gameState.players[0].mz=[src];gameState.players[0].hand=[cost];v41ResetActionJournal(gameState);
act({type:'DECLARE_V11',player:0,kind:'level',value:7});recordActivationCostV11({player:0},'discard',[cost],[],1);
abortPreparedActivationV11({player:0,uid:src.uid});
ok('P1.1 abort: buffer空',gameState.pendingDeclarationV11===null&&gameState.pendingActivationCostV11.length===0);
act(linkAction(src.uid,'再発動'));
ok('P1.1 reactivation: 前回値を使わない',gameState.chain[0].declaration===undefined&&gameState.chain[0].activationCost===undefined);

/* Undo/Redo across cost and declaration answer. */
resetP11();cost=mk('青眼の白龍');gameState.players[0].hand=[cost];v41ResetActionJournal(gameState);
recordActivationCostV11({player:0},'discard',[cost],[],1);
ok('P1.1 Undo cost: 前提',gameState.pendingActivationCostV11.length===1);undo();
ok('P1.1 Undo cost: 選択前へ戻る',gameState.pendingActivationCostV11.length===0&&gameState.pendingCostSnapshots.length===0);redo();
ok('P1.1 Redo cost: identity復元',gameState.pendingActivationCostV11[0].refs[0]===cost.uid);
clearActivationChoiceV11(0);
requestDeclarationV11({player:0},'level',{values:[1,2],cancelable:false},{handler:'p11test.noop',args:{}},null);
let key=pendingChoiceV49(gameState).candidates[1].key;answerChoiceV49([key]);
ok('P1.1 Choice answer: declaration action化',gameState.pendingDeclarationV11.value===2);
undo();ok('P1.1 Undo declaration: 回答直後を巻戻す',gameState.pendingDeclarationV11===null);
undo();ok('P1.1 Undo ChoiceAnswer: 選択待ち復元',!!pendingChoiceV49(gameState));
redo();redo();ok('P1.1 Redo ChoiceAnswer: 宣言復元',gameState.pendingDeclarationV11.value===2);

/* declaration survives Save/Load. */
let saved=JSON.parse(JSON.stringify(gameState));gameState=saved;reconcileChoiceAfterLoadV49(gameState);
ok('P1.1 SaveLoad declaration: JSON往復後も保持',gameState.pendingDeclarationV11.value===2&&assertActivationContextSerializableV11(gameState).ok);

/* activation interrupted after cost, then Save/Load, choice, CHAIN_ADD. Compare no-load path. */
function runMidActivation(doLoad){
  resetP11();gameState.rngState=123456789;__u=119000;let s=mk('ライオウ'),c=mk('青眼の白龍');gameState.players[0].mz=[s];gameState.players[0].hand=[c];v41ResetActionJournal(gameState);
  const desc={player:0,uid:s.uid,name:'ライオウ',from:'mz',index:0,ss:1,event:{},eventName:null,
    sourceNegatedAtActivation:false,spellCounterObserverUids:[],v44CountConsume:null,v44ActivationPending:false,
    effectClass:'monster',keep:true,v4EffectKey:null,noPriority:true,abortReturnToHand:false};
  recordActivationCostV11({player:0},'discard',[c],['atk'],1);
  act({type:'MOVE',player:0,from:'hand',fromIndex:0,to:'grave',face:'up'});
  requestDeclarationV11({player:0},'attribute',{values:['炎','水'],activation:desc,cancelable:false},
    {handler:'p11test.commit',args:{}},null);
  if(doLoad){gameState=JSON.parse(JSON.stringify(gameState));reconcileChoiceAfterLoadV49(gameState);}
  answerChoiceV49([pendingChoiceV49(gameState).candidates[0].key]);
  return {digest:v41StateDigest(gameState),journal:V41_ACTION_JOURNAL.map(x=>x.action.type).join(','),link:JSON.parse(JSON.stringify(gameState.chain[0]))};
}
let plain=runMidActivation(false),loaded=runMidActivation(true);
ok('P1.1 mid-activation SaveLoad: CHAIN_ADDまで継続',loaded.link&&loaded.link.declaration.value==='炎'&&loaded.link.activationCost[0].kind==='discard');
ok('P1.1 mid-activation SaveLoad: 最終digest一致',loaded.digest===plain.digest,loaded.digest+' / '+plain.digest);
ok('P1.1 mid-activation SaveLoad: Journal action列一致',loaded.journal===plain.journal,loaded.journal+' / '+plain.journal);
ok('P1.1 mid-activation SaveLoad: buffer消費',gameState.pendingDeclarationV11===null&&gameState.pendingActivationCostV11.length===0);
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('P1.1 Replay: activation choiceをdigest一致で再生',audit.ok,audit.reason||audit.finalDigest);

/* Empty metadata must not affect legacy digest bytes. */
resetP11();let d1=v41StateDigestText(gameState),legacy=JSON.parse(JSON.stringify(gameState));
delete legacy.pendingDeclarationV11;delete legacy.pendingActivationCostV11;let current=gameState;gameState=legacy;let d2=v41StateDigestText(gameState);gameState=current;
ok('P1.1 digest: metadata無しは従来とバイト一致',d1===d2,d1+' / '+d2);
ok('P1.1 digest: 空bufferタグを追加しない',d1.indexOf('P11D')<0&&d1.indexOf('P11C')<0);

/* JSON-only contract. */
resetP11();
ok('P1.1 JSON: 正常contextは安全',assertActivationContextSerializableV11(gameState).ok);
gameState.pendingDeclarationV11={kind:'cardName',value:()=>{}};
ok('P1.1 JSON: closureを拒否',!assertActivationContextSerializableV11(gameState).ok);
gameState.pendingDeclarationV11={kind:'cardName',value:new Map()};
ok('P1.1 JSON: Mapを拒否',!assertActivationContextSerializableV11(gameState).ok);
gameState.pendingDeclarationV11={kind:'cardName',value:{nodeType:1,classList:{}}};
ok('P1.1 JSON: DOM様objectを拒否',!assertActivationContextSerializableV11(gameState).ok);

globalThis.__R=R;
`;
js+='\n'+probe;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map();
const document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()};
const store=new Map();const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};
c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:30000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error(e.stack||e);process.exit(1);}
