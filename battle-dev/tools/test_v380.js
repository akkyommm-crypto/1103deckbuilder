const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
js=js.replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
const probe=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__; NAME_INDEX=null; MAT_SPEC_CACHE.clear(); buildMaterialNameSet();
render=()=>{}; showToast=()=>{}; saveDuelSoon=()=>{}; clearSavedDuel=()=>{}; closeSheet=()=>{}; openChainPriorityV2=()=>{};
let __uid=9000;
function mk380(n,p=0,pos='atk',face='up'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);return {id,owner:p,controller:p,face,pos,uid:__uid++};}
function reset380(){gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=2;turnActions=[];PLAY_MODE=PLAY_MODES.DUEL;ADS_CHAIN_MODE=ADS_CHAIN_MODES.AVAILABLE;}
function solve380(){let guard=20;while(gameState.chain.length&&guard--){const l=gameState.chain[gameState.chain.length-1];act({type:'CHAIN_RESOLVE_TOP'});resolveOnePreparedLinkV27(l);}gameState.chainWindow=null;reconcileProcedureBaseStats();}
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
API.confirm=(title,msg,yes,no)=>yes();
API.selectCard=(title,cands,done)=>{
  let pick=null; const by=n=>(cands||[]).find(x=>x&&x.db&&x.db.n===n);
  if(title.includes('クイック・シンクロン')) pick=by('ライオウ')||cands[0];
  else if(title.includes('戻す自分の表側')) pick=by('ライオウ')||cands[0];
  else if(title.includes('特殊召喚するE・HERO')) pick=by('E・HERO エアーマン')||cands[0];
  else if(title.includes('六武衆')) pick=(cands||[])[0];
  else if(title.includes('手札に加える')) pick=(cands||[])[0];
  else pick=(cands||[])[0];
  if(!pick)throw new Error('no candidate '+title); done(pick);
};
// 1) send-to-GY is not discard + Quick Synchron procedure
reset380();
let quick=mk380('クイック・シンクロン'), rai=mk380('ライオウ'); gameState.players[0].hand=[quick,rai];
let L=strictSummonProcedureLegality('クイック・シンクロン',0,'hand',0); ok('クイック：手札SS手順が合法',L.ok,L.reason||'');
finishSummonProcedure('クイック・シンクロン',0,'hand',0,'atk'); if(typeof __pendingSummonCommit==='function')__pendingSummonCommit();
ok('クイック：他の手札モンスターを墓地へ送る',gameState.players[0].grave.some(c=>cardName(c)==='ライオウ'),'grave='+gameState.players[0].grave.map(cardName).join(','));
let sent=gameState.players[0].grave.find(c=>cardName(c)==='ライオウ'); ok('手札から墓地へ送るは「捨てる」扱いではない',sent&&!sent.discardInfo,JSON.stringify(sent&&sent.discardInfo));
// 2) Synchron name substitute + source restriction
let dandy=mk380('ダンディライオン');gameState.players[0].mz.push(dandy); let jd=mk380('ジャンク・デストロイヤー');gameState.players[0].ex=[jd];
let ec=exCombos(0,dbOf(jd)); ok('クイック：ジャンク・シンクロン指定の代用素材になれる',ec.combos.some(c=>c.materials.length===2),JSON.stringify(ec.combos));
let st=mk380('スターダスト・ドラゴン');gameState.players[0].ex=[st]; ec=exCombos(0,dbOf(st)); ok('クイック：シンクロン指定でないS召喚には使えない',ec.combos.length===0,JSON.stringify(ec.combos));
// 3) Bolt Hedgehog self SS then banish on leave
reset380(); let bolt=mk380('ボルト・ヘッジホッグ'); let tuner=mk380('エフェクト・ヴェーラー'); gameState.players[0].grave=[bolt]; gameState.players[0].mz=[tuner];
duelActivateFromZone(0,'grave',0);solve380(); let bh=gameState.players[0].mz.find(c=>cardName(c)==='ボルト・ヘッジホッグ');
ok('ボルト：墓地から自己SS',!!bh,'mz='+gameState.players[0].mz.map(cardName).join(','));
let bl=bh&&locateCard(bh); if(bl)API.sendToGrave(bl,'test leave'); ok('ボルト：効果で蘇生後に場を離れると除外',gameState.players[0].banish.some(c=>cardName(c)==='ボルト・ヘッジホッグ'),'banish='+gameState.players[0].banish.map(cardName).join(','));
// 4) Hero Alive
reset380(); let alive=mk380('ヒーローアライブ'); let air=mk380('E・HERO エアーマン'); gameState.players[0].hand=[alive]; gameState.players[0].deck=[air]; gameState.players[0].lp=8000;
let sc=CARD_SCRIPTS['ヒーローアライブ'],ctx=makeContext(0,alive,'hand',0,'activate',{}); ok('ヒーローアライブ：条件成立',sc.condition(ctx),ctx.reason||'');
let costDone=false;sc.cost(ctx,x=>costDone=x);let sel=[];sc.selectTargets(ctx,x=>sel=x);ctx.selectedTargets=sel;sc.resolve(ctx);
if(pendingChoiceV49(gameState))__choicePickV49(0); // S03-U64: 解決時のデッキ選択（requestChoice）をドレインする
ok('ヒーローアライブ：LP半分',gameState.players[0].lp===4000,'lp='+gameState.players[0].lp); ok('ヒーローアライブ：E・HEROをデッキからSS',gameState.players[0].mz.some(c=>cardName(c)==='E・HERO エアーマン'),'mz='+gameState.players[0].mz.map(cardName).join(','));
// 5) Zephyros once per duel
reset380(); let z=mk380('BF－精鋭のゼピュロス'), r2=mk380('ライオウ'); gameState.players[0].grave=[z];gameState.players[0].mz=[r2];
sc=CARD_SCRIPTS['BF－精鋭のゼピュロス'];ctx=makeContext(0,z,'grave',0,'activate',{});ok('ゼピュロス：初回条件成立',sc.condition(ctx),ctx.reason||'');let zd=false;sc.cost(ctx,x=>zd=x);sc.resolve(ctx);ok('ゼピュロス：自己SS＋400ダメージ',gameState.players[0].mz.some(c=>cardName(c)==='BF－精鋭のゼピュロス')&&gameState.players[0].lp===7600,'lp='+gameState.players[0].lp);
let zh=gameState.players[0].mz.find(c=>cardName(c)==='BF－精鋭のゼピュロス'); let zl=locateCard(zh); if(zl)API.sendToGrave(zl,'test'); let zi=gameState.players[0].grave.findIndex(c=>cardName(c)==='BF－精鋭のゼピュロス');ctx=makeContext(0,gameState.players[0].grave[zi],'grave',zi,'activate',{});ok('ゼピュロス：2回目は不成立',!sc.condition(ctx),ctx.reason||'');
// 6) Royal Tribute under Necrovalley
reset380(); let nv=mk380('王家の眠る谷－ネクロバレー'); gameState.players[0].field=nv; gameState.players[0].hand=[mk380('ライオウ'),mk380('サイクロン')];gameState.players[1].hand=[mk380('セイバーザウルス',1),mk380('奈落の落とし穴',1)];
sc=CARD_SCRIPTS['王家の生け贄'];ctx=makeContext(0,mk380('王家の生け贄'),'hand',0,'activate',{});ok('王家の生け贄：ネクロバレーで合法',sc.condition(ctx),ctx.reason||'');sc.resolve(ctx);
ok('王家の生け贄：両手札のモンスターだけ捨てる',gameState.players[0].hand.length===1&&cardName(gameState.players[0].hand[0])==='サイクロン'&&gameState.players[1].hand.length===1&&cardName(gameState.players[1].hand[0])==='奈落の落とし穴','P0='+gameState.players[0].hand.map(cardName)+' P1='+gameState.players[1].hand.map(cardName));
// 7) Scrap Chimera material restriction
reset380(); let chim=mk380('スクラップ・キマイラ'), sg=mk380('スクラップ・ゴブリン'), foeMat=mk380('エフェクト・ヴェーラー');
sc=CARD_SCRIPTS['スクラップ・キマイラ']; ok('スクラップ・キマイラ：スクラップS＋全スクラップ素材のみ許可',sc.synchroMaterialRestriction({exDb:{n:'スクラップ・ドラゴン'},set:[{card:chim},{card:sg}]})&&!sc.synchroMaterialRestriction({exDb:{n:'スクラップ・ドラゴン'},set:[{card:chim},{card:foeMat}]})&&!sc.synchroMaterialRestriction({exDb:{n:'スターダスト・ドラゴン'},set:[{card:chim},{card:sg}]}) );
// 8) Double-Edged Sword: two revive -> End destroy + damage
reset380(); let kizan=mk380('真六武衆－キザン'),kageki=mk380('真六武衆－カゲキ');gameState.players[0].grave=[kizan,kageki]; let de=mk380('諸刃の活人剣術');
sc=CARD_SCRIPTS['諸刃の活人剣術'];ctx=makeContext(0,de,'sz',0,'activate',{});ok('諸刃：墓地六武2体で合法',sc.condition(ctx),ctx.reason||'');let targets=[];sc.selectTargets(ctx,x=>targets=x);ctx.selectedTargets=targets;sc.resolve(ctx);ok('諸刃：2体同時に場へ出る',gameState.players[0].mz.length===2,'mz='+gameState.players[0].mz.map(cardName));let before=gameState.players[0].lp;resolveReservedEffectsV30('endPhase');ok('諸刃：Endに2体破壊＋攻撃力合計ダメージ',gameState.players[0].mz.length===0&&gameState.players[0].lp===before-(1800+200),'lp='+gameState.players[0].lp+' grave='+gameState.players[0].grave.map(cardName));
// 9) Scrap-Iron Scarecrow reset
reset380(); let atk=mk380('セイバーザウルス',1), scare=mk380('くず鉄のかかし');scare.face='up';gameState.players[1].mz=[atk];gameState.players[0].sz=[scare];gameState.pendingAttack={player:1,attackerUid:atk.uid};sc=CARD_SCRIPTS['くず鉄のかかし'];ctx=makeContext(0,scare,'sz',0,'onAttackDeclare',{});sc.resolve(ctx);sc.afterResolve(ctx);ok('くず鉄のかかし：攻撃無効後に再セット',gameState.attackNegated===true&&scare.face==='down','face='+scare.face);
globalThis.__V380_PROBE__=R;
`;
js+='\n'+probe;
function nodeStub(){const b={innerHTML:'',className:'',hidden:false,textContent:'',value:'',scrollTop:0,scrollHeight:0,style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},removeEventListener(){},appendChild(){},remove(){},setAttribute(){},getBoundingClientRect(){return {left:0,top:0,width:100,height:100}},querySelector(){return nodeStub()},querySelectorAll(){return []}};return new Proxy(b,{get(t,p){if(p in t)return t[p];if(p==='children'||p==='files')return [];return ()=>{}},set(t,p,v){t[p]=v;return true}})}
const nodes=new Map();const document={getElementById(id){if(!nodes.has(id))nodes.set(id,nodeStub());return nodes.get(id)},querySelector(){return nodeStub()},querySelectorAll(){return []},createElement(){return nodeStub()},addEventListener(){},removeEventListener(){},body:nodeStub(),documentElement:nodeStub()};
const store=new Map();const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k),clear:()=>store.clear()};
const context={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},innerHeight:800,innerWidth:400,addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),cancelAnimationFrame(){},setTimeout:(f)=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},DOMParser:class{parseFromString(){return {getElementById(){return null}}}},fetch:async()=>{throw new Error('fetch disabled')},indexedDB:null,FileReader:class{},Blob,URL:{createObjectURL(){return ''},revokeObjectURL(){}},structuredClone:global.structuredClone};context.window=context;context.globalThis=context;
try{vm.runInNewContext(js,context,{filename:'v380.js',timeout:30000});const r=context.__V380_PROBE__;console.log(r.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(r.some(x=>!x.ok))process.exit(2)}catch(e){console.error(e.stack||e);process.exit(1)}
