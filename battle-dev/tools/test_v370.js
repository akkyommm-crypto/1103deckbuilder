const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
js=js.replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
const probe=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__; NAME_INDEX=null; MAT_SPEC_CACHE.clear(); buildMaterialNameSet();
render=()=>{}; showToast=()=>{}; saveDuelSoon=()=>{}; clearSavedDuel=()=>{}; closeSheet=()=>{}; openChainPriorityV2=()=>{};
let __uid=5000;
function mk370(n,p=0,pos='atk'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);return {id,owner:p,controller:p,face:'up',pos,uid:__uid++};}
function reset370(){gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=2;turnActions=[];PLAY_MODE=PLAY_MODES.DUEL;ADS_CHAIN_MODE=ADS_CHAIN_MODES.AVAILABLE;}
function solve370(){while(gameState.chain.length){const l=gameState.chain[gameState.chain.length-1];act({type:'CHAIN_RESOLVE_TOP'});resolveOnePreparedLinkV27(l);}gameState.chainWindow=null;reconcileProcedureBaseStats();}
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
// target selection strategy used by the three behavior probes
API.selectCard=(title,cands,done)=>{
 let pick=null;
 const by=n=>(cands||[]).find(x=>x&&x.db&&x.db.n===n);
 if(title.includes('手札に戻す')) pick=by('ライオウ')||cands[0];
 else if(title.includes('フォートレス')) pick=(cands||[])[0];
 else if(title.includes('トラゴエディア③：墓地へ送る')) pick=by('ライオウ')||cands[0];
 else if(title.includes('レベル4の相手')) pick=by('セイバーザウルス')||cands[0];
 else if(title.includes('レベルをコピー')) pick=by('セイバーザウルス')||cands[0];
 else pick=(cands||[])[0];
 if(!pick)throw new Error('no candidate '+title); done(pick);
};
// 1) Swap Frog ③ -> extra normal summon
reset370();
let frog=mk370('鬼ガエル'), rai=mk370('ライオウ'), tree=mk370('黄泉ガエル');
gameState.players[0].mz=[frog,rai];gameState.players[0].hand=[tree];gameState.players[0].normalSummonUsed=true;
let fi=0;duelActivateFromZone(0,'mz',fi);solve370();
ok('鬼ガエル③：追加通常召喚権を得る',gameState.players[0].temporaryFlags.v370FrogExtraNormal===1,JSON.stringify(gameState.players[0].temporaryFlags));
ok('鬼ガエル③：コストで自分モンスターを手札へ戻す',gameState.players[0].hand.some(c=>cardName(c)==='ライオウ'),gameState.players[0].hand.map(cardName).join(','));
let ti=gameState.players[0].hand.findIndex(c=>cardName(c)==='黄泉ガエル');let acts=getLegalHandActions(0,ti).map(a=>a.id);
ok('鬼ガエル③：通常召喚権使用済みでも追加召喚ボタン',acts.includes('extraNormalSummon')&&!acts.includes('normalSummon'),acts.join(','));
doExtraNormalSummonV370(ti,'v370FrogExtraNormal');__pendingSummonCommit();
ok('鬼ガエル③：追加召喚を実行',gameState.players[0].mz.some(c=>cardName(c)==='黄泉ガエル')&&gameState.players[0].temporaryFlags.v370FrogExtraNormal===0,'mz='+gameState.players[0].mz.map(cardName).join(','));
// 2) Fortress procedure, including self-discard -> grave summon
reset370();
let fort=mk370('マシンナーズ・フォートレス'),gear=mk370('マシンナーズ・ギアフレーム');gameState.players[0].hand=[fort,gear];
let L=strictSummonProcedureLegality('マシンナーズ・フォートレス',0,'hand',0);ok('フォートレス①：手札から特殊召喚手順が合法',L.ok,L.reason||'');
finishSummonProcedure('マシンナーズ・フォートレス',0,'hand',0,'atk');__pendingSummonCommit();
ok('フォートレス①：自身を捨てた場合は墓地から特殊召喚',gameState.players[0].mz.some(c=>cardName(c)==='マシンナーズ・フォートレス')&&gameState.players[0].grave.some(c=>cardName(c)==='マシンナーズ・ギアフレーム'),'mz='+gameState.players[0].mz.map(cardName).join(',')+' grave='+gameState.players[0].grave.map(cardName).join(','));
// 3) Tragoedia ③ control effect + noSS should not block field effect
reset370();
let trag=mk370('トラゴエディア'), cost=mk370('ライオウ'), foe=mk370('セイバーザウルス',1);gameState.players[0].mz=[trag];gameState.players[0].hand=[cost];gameState.players[1].mz=[foe];gameState.players[0].temporaryFlags.noSpecialSummon=true;
L=strictScriptLegalityV2('トラゴエディア',0,'mz',0,{});ok('トラゴ③：特殊召喚禁止中でもフィールド効果は合法',L.ok,L.reason||'');
duelActivateFromZone(0,'mz',0);solve370();
ok('トラゴ③：同レベル相手モンスターのコントロールを得る',gameState.players[0].mz.some(c=>cardName(c)==='セイバーザウルス')&&!gameState.players[1].mz.length,'P0='+gameState.players[0].mz.map(cardName).join(','));
ok('トラゴ③：手札モンスターをコストで墓地へ',gameState.players[0].grave.some(c=>cardName(c)==='ライオウ'),gameState.players[0].grave.map(cardName).join(','));
// 4) Tragoedia ④ level copy + End reset
reset370();
trag=mk370('トラゴエディア');let g4=mk370('セイバーザウルス');gameState.players[0].mz=[trag];gameState.players[0].grave=[g4];
L=strictScriptLegalityV2('トラゴエディア',0,'mz',0,{});ok('トラゴ④：墓地モンスターがいれば合法',L.ok,L.reason||'');
duelActivateFromZone(0,'mz',0);solve370();
ok('トラゴ④：墓地モンスターと同じレベルになる',curLV(trag)===4,'lv='+curLV(trag));
resolveReservedEffectsV30('endPhase');ok('トラゴ④：End Phaseに元のレベルへ戻る',curLV(trag)===10,'lv='+curLV(trag));
// 5) DUEL pile UI: only legal actions, Fortress can summon from grave
reset370();fort=mk370('マシンナーズ・フォートレス');gameState.players[0].grave=[fort];gameState.players[0].hand=[mk370('マシンナーズ・ギアフレーム'),mk370('マシンナーズ・ギアフレーム')];
acts=pileDuelActionsV370(0,'grave',0).map(a=>a.id);ok('DUEL墓地：フォートレスの正規SS手順だけ表示',acts.includes('specialSummonProcedure')&&!acts.includes('manualMove'),acts.join(','));
globalThis.__V370_PROBE__=R;
`;
js+='\n'+probe;
function nodeStub(){const b={innerHTML:'',className:'',hidden:false,textContent:'',value:'',scrollTop:0,scrollHeight:0,style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},removeEventListener(){},appendChild(){},remove(){},setAttribute(){},getBoundingClientRect(){return {left:0,top:0,width:100,height:100}},querySelector(){return nodeStub()},querySelectorAll(){return []}};return new Proxy(b,{get(t,p){if(p in t)return t[p];if(p==='children'||p==='files')return [];return ()=>{}},set(t,p,v){t[p]=v;return true}})}
const nodes=new Map();const document={getElementById(id){if(!nodes.has(id))nodes.set(id,nodeStub());return nodes.get(id)},querySelector(){return nodeStub()},querySelectorAll(){return []},createElement(){return nodeStub()},addEventListener(){},removeEventListener(){},body:nodeStub(),documentElement:nodeStub()};
const store=new Map();const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k),clear:()=>store.clear()};
const context={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},innerHeight:800,innerWidth:400,addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),cancelAnimationFrame(){},setTimeout:(f)=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},DOMParser:class{parseFromString(){return {getElementById(){return null}}}},fetch:async()=>{throw new Error('fetch disabled')},indexedDB:null,FileReader:class{},Blob,URL:{createObjectURL(){return ''},revokeObjectURL(){}},structuredClone:global.structuredClone};context.window=context;context.globalThis=context;
try{vm.runInNewContext(js,context,{filename:'v370.js',timeout:30000});const r=context.__V370_PROBE__;console.log(r.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(r.some(x=>!x.ok))process.exit(2)}catch(e){console.error(e.stack||e);process.exit(1)}
