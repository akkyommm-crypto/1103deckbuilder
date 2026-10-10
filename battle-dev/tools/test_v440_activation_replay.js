const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
js=js.replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
const probe=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__; NAME_INDEX=null; MAT_SPEC_CACHE.clear(); buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
let __u=95500;function mk44a(n,p=0){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);return {id,owner:p,controller:p,face:'up',pos:'atk',uid:__u++};}
function reset44a(){gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;}
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
// Count-limit consumption must be part of CHAIN_ADD itself.
reset44a();const rai=mk44a('ライオウ');gameState.players[0].mz=[rai];
const oldRai=CARD_SCRIPTS['ライオウ'];
CARD_SCRIPTS['ライオウ']={type:'monster',priority:1,countLimit:1,condition(){return true;},resolve(){}};
v41ResetActionJournal(gameState);
const prepared=prepareDuelActivation('ライオウ',0,'mz',0,{noPriority:true});
const e1=V41_ACTION_JOURNAL[0];
ok('v4.4 activation replay: prepare succeeds',prepared===true&&gameState.chain.length===1);
ok('v4.4 activation replay: count consumed inside CHAIN_ADD',rai.clTurn===gameState.turn&&rai.clN===1&&e1&&e1.action.type==='CHAIN_ADD'&&e1.action.v44CountConsume,'cl='+rai.clN);
let pkg=v41ReplayPackage(gameState),audit=v44ReplayAuditPackage(pkg);
ok('v4.4 activation replay: count-limit CHAIN_ADD audits exactly',audit.ok,audit.reason||audit.finalDigest);
CARD_SCRIPTS['ライオウ']=oldRai;
// Continuous-card activationPending must also be journaled and cleared by CHAIN_RESOLVE_TOP.
reset44a();const skill=mk44a('スキルドレイン');gameState.players[0].sz=[skill];
const oldSkill=CARD_SCRIPTS['スキルドレイン'];
CARD_SCRIPTS['スキルドレイン']={type:'trap',priority:1,condition(){return true;},resolve(){}};
v41ResetActionJournal(gameState);
const p2=prepareDuelActivation('スキルドレイン',0,'sz',0,{noPriority:true});
ok('v4.4 activation replay: continuous activation marks pending in action',p2===true&&skill.activationPending===true&&V41_ACTION_JOURNAL[0].action.v44ActivationPending===true);
pkg=v41ReplayPackage(gameState);audit=v44ReplayAuditPackage(pkg);
ok('v4.4 activation replay: activationPending digest replays exactly',audit.ok,audit.reason||audit.finalDigest);
const link=gameState.chain[gameState.chain.length-1];act({type:'CHAIN_RESOLVE_TOP'});
ok('v4.4 activation replay: resolve action clears pending',!skill.activationPending&&!skill.activationNegated&&gameState.chain.length===0);
pkg=v41ReplayPackage(gameState);audit=v44ReplayAuditPackage(pkg);
ok('v4.4 activation replay: pending-clear replay audits exactly',audit.ok,audit.reason||audit.finalDigest);
// Activation-negated resolution keeps the negated state and is digest-visible.
reset44a();const skill2=mk44a('スキルドレイン');gameState.players[0].sz=[skill2];CARD_SCRIPTS['スキルドレイン']={type:'trap',priority:1,condition(){return true;},resolve(){}};v41ResetActionJournal(gameState);
prepareDuelActivation('スキルドレイン',0,'sz',0,{noPriority:true});act({type:'CHAIN_NEGATE_LINK',index:0,mode:'activation',reason:'test'});act({type:'CHAIN_RESOLVE_TOP'});
ok('v4.4 activation replay: activation negate clears pending and persists negated',!skill2.activationPending&&skill2.activationNegated===true);
pkg=v41ReplayPackage(gameState);audit=v44ReplayAuditPackage(pkg);
ok('v4.4 activation replay: negated activation audits exactly',audit.ok,audit.reason||audit.finalDigest);
CARD_SCRIPTS['スキルドレイン']=oldSkill;
globalThis.__V44AR=R;
`;
js+='\n'+probe;
function nodeStub(){const b={innerHTML:'',className:'',hidden:false,textContent:'',value:'',scrollTop:0,scrollHeight:0,style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},removeEventListener(){},appendChild(){},remove(){},setAttribute(){},scrollIntoView(){},animate(){},getBoundingClientRect(){return {left:0,top:0,width:100,height:100}},querySelector(){return nodeStub()},querySelectorAll(){return []}};return new Proxy(b,{get(t,p){if(p in t)return t[p];if(p==='children'||p==='files')return [];return ()=>{}},set(t,p,v){t[p]=v;return true}})}
const nodes=new Map();const document={getElementById(id){if(!nodes.has(id))nodes.set(id,nodeStub());return nodes.get(id)},querySelector(){return nodeStub()},querySelectorAll(){return []},createElement(){return nodeStub()},addEventListener(){},removeEventListener(){},body:nodeStub(),documentElement:nodeStub()};
const store=new Map();const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k),clear:()=>store.clear()};
const context={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){},back(){}},location:{reload(){}},navigator:{userAgent:'node'},innerHeight:800,innerWidth:400,addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),cancelAnimationFrame(){},setTimeout:(f)=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},DOMParser:class{parseFromString(){return {getElementById(){return null}}}},fetch:async()=>{throw new Error('fetch disabled')},indexedDB:null,FileReader:class{},Blob,URL:{createObjectURL(){return ''},revokeObjectURL(){}},structuredClone:global.structuredClone};context.window=context;context.globalThis=context;
try{vm.runInNewContext(js,context,{filename:'v440_activation.js',timeout:30000});const r=context.__V44AR;console.log(r.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(r.some(x=>!x.ok))process.exit(2)}catch(e){console.error(e.stack||e);process.exit(1)}
