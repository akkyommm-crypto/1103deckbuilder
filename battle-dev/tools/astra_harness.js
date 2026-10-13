const fs=require('fs'),vm=require('vm'),path=require('path');
module.exports=function(body){
 const ROOT=path.resolve(__dirname,'..');
 const html=fs.readFileSync(path.join(ROOT,'dist/battle.html'),'utf8');
 let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
 js+=String.raw`
 CARD_DB=globalThis.__DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
 saveDuelSoon=()=>{};clearSavedDuel=()=>{};
 /* S03-U305 (redo of the unpublished U304): HARNESS_UI=1 keeps the real UI functions (render, showToast, closeSheet, openChainPriorityV2, openPick)
    running against the stub DOM instead of no-ops, so a sweep also exercises the UI code. Each call is counted and an exception is recorded
    in HARNESS_UI_ERRORS (and swallowed, as a click handler failing would not stop the engine). The default (no HARNESS_UI) is unchanged. */
 if(${process.env.HARNESS_UI==='1'?'true':'false'}){
  HARNESS_UI=true;HARNESS_UI_ERRORS=[];HARNESS_UI_CALLS={};
  for(const n of ['render','showToast','closeSheet','openChainPriorityV2','openPick']){const f=globalThis[n];HARNESS_UI_CALLS[n]=0;
   globalThis[n]=function(...a){HARNESS_UI_CALLS[n]++;try{return f.apply(this,a);}catch(e){HARNESS_UI_ERRORS.push({fn:n,turn:(typeof gameState!=='undefined'&&gameState)?gameState.turn:null,msg:String(e&&e.stack||e).slice(0,600)});}};}
 }else{
  render=()=>{};showToast=()=>{};closeSheet=()=>{};
  openChainPriorityV2=()=>{};openPick=()=>{};
 }
 const R=[];globalThis.__R=R;const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
 function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);const c={id,owner:p,controller:p,face,pos};ensureCardUid(gameState,c);return c;}
 function resetA(){gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=5;PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;resetChoiceStatsV49();v41ResetActionJournal(gameState);gameState.fieldSnapV9=fieldSnapshotV9(gameState);}
 const h=c=>locateCardAnyV4(c), evs=n=>(gameState.deferredEvents||[]).filter(x=>x.eventName===n).map(x=>x.evt);
 /* S03-U278: the harness acts as the player for the queued position choice of an effect Special Summon whose text gives no position
    (handler s03.ss-position-free, engine/1ZZK): it keeps the position the card was summoned in (face-up Attack for a monster, the script's position for a Token — S03-U289), the position these older tests were written for. The choice is still
    opened and journaled (Replay); tests that check positions set globalThis.__MANUAL_SS_POSITION_S03=true and answer it themselves. */
 const __openedV49=(typeof onChoiceRequestOpenedV49==='function')?onChoiceRequestOpenedV49:null;
 onChoiceRequestOpenedV49=function(pc){ if(!globalThis.__MANUAL_SS_POSITION_S03&&pc&&pc.resume&&pc.resume.handler==='s03.ss-position-free'){ const hc=(pc.resume.args&&pc.resume.args.uid!=null)?findCardByUid(pc.resume.args.uid):null; const keep=(hc&&hc.card&&hc.card.pos==='def')?'def':'atk'; const k=(pc.candidates.find(x=>x.value===keep)||{}).key; if(k){ answerChoiceV49([k]); return; } } if(__openedV49) return __openedV49(pc); };
 function baselineA(){ensureAllCardUids(gameState);gameState.fieldSnapV9=fieldSnapshotV9(gameState);gameState.positionSnapV10=positionSnapshotV10(gameState);gameState.deferredEvents=[];v41ResetActionJournal(gameState);}
 `+body;
 function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
 const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
 const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data/carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
 try{vm.runInNewContext(js,c,{timeout:120000});}catch(e){console.error(e.stack||e);process.exitCode=2;}
 const R=c.__R||[];for(const r of R)console.log((r.ok?'PASS ':'FAIL ')+r.name+(r.detail?' :: '+r.detail:''));
 if(!R.length||R.some(r=>!r.ok))process.exitCode=2;
 return c;
};
