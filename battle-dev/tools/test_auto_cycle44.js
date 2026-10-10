/* Auto cycle 44 dedicated tests. */
const fs=require('fs'),vm=require('vm'),path=require('path');const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*$/m,'/* boot skipped */');
js+=String.raw`
CARD_DB=globalThis.__DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};openPick=()=>{};
const R=[],ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});globalThis.__R=R;
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);const c={id,owner:p,controller:p,face,pos,summonedTurn:1};ensureCardUid(gameState,c);return c;}
function reset0(){gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=44;PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];resetChoiceStatsV49();v41ResetActionJournal(gameState);gameState.fieldSnapV9=fieldSnapshotV9(gameState);}
function sc(n){const s=CARD_SCRIPTS[n];if(!s)throw Error('script missing '+n);return s;}
function C(p,card,zone,idx,ev,extra){const c=makeContext(p,card,zone,idx,ev||'activate',extra||{});if(extra&&extra.event)c.event=extra.event;return c;}
const TARGETS=['ライカン・スロープ','アマゾネスの闘志','ワーム・ヴィクトリー','記憶破壊王'];
TARGETS.forEach(n=>ok('cycle44 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle44 枚数は4',TARGETS.length===4);

reset0();
let ly=mk('ライカン・スロープ'), n1=mk('ワイト'), n2=mk('青眼の白龍'), eff=mk('レッドアイズ・ダークネスメタルドラゴン'), foe=mk('ワイト',1);
gameState.players[0].mz=[ly];gameState.players[0].grave=[n1,n2,eff];gameState.players[1].mz=[foe];
let lySc=sc('ライカン・スロープ');
let lyCtx=C(0,ly,'mz',0,'onBattleDamage',{event:{player:1,amount:1200,direct:false,attackerUid:ly.uid,defenderUid:foe.uid}});
ok('ライカン・スロープ positive: 戦闘ダメージで誘発',lySc.passive.onBattleDamage(lyCtx)===true);
const lyLp=gameState.players[1].lp;lySc.resolve(lyCtx);
ok('ライカン・スロープ positive: 通常モンスター2体分400ダメージ',gameState.players[1].lp===lyLp-400);
ok('ライカン・スロープ negative: 効果モンスターは数えない',gameState.players[1].lp!==lyLp-600);
ok('ライカン・スロープ ruling: ダメージ0では誘発しない',
  lySc.passive.onBattleDamage(C(0,ly,'mz',0,'onBattleDamage',{event:{player:1,amount:0,attackerUid:ly.uid}}))===false);

reset0();
let spirit=mk('アマゾネスの闘志'), ama=mk('アマゾネスの格闘戦士'), big=mk('青眼の白龍',1), small=mk('ワイト',1), non=mk('ワイト');
gameState.players[0].sz=[spirit];gameState.players[0].mz=[ama,non];gameState.players[1].mz=[big,small];
let spSc=sc('アマゾネスの闘志');
gameState.battle={player:0,atkUid:ama.uid,targetUid:big.uid,atkIdx:0,target:0,step:'calc',battled:true};
let st=spSc.continuous.apply(ama,spirit,{p:0});
ok('アマゾネスの闘志 positive: アマゾネスが格上へ攻撃中のみATK+1000',st&&st.atk===1000);
gameState.battle={player:0,atkUid:ama.uid,targetUid:small.uid,atkIdx:0,target:1,step:'calc',battled:true};
ok('アマゾネスの闘志 negative: 格下相手には強化しない',spSc.continuous.apply(ama,spirit,{p:0})===null);
gameState.battle={player:0,atkUid:non.uid,targetUid:big.uid,atkIdx:1,target:0,step:'calc',battled:true};
ok('アマゾネスの闘志 negative: アマゾネス以外には強化しない',spSc.continuous.apply(non,spirit,{p:0})===null);
gameState.battle={player:0,atkUid:ama.uid,targetUid:big.uid,atkIdx:0,target:0,step:'after',battled:true};
ok('アマゾネスの闘志 ruling: ダメージ計算時以外は強化しない',spSc.continuous.apply(ama,spirit,{p:0})===null);

reset0();
let wv=mk('ワーム・ヴィクトリー'), wo=mk('ワーム・オペラ'), wd=mk('ワーム・ディミクレス'), nonWorm=mk('ワイト',1), wormFoe=mk('ワーム・ファルコ',1);
gameState.players[0].mz=[wv];gameState.players[0].grave=[wo,wd,mk('ワイト')];gameState.players[1].mz=[nonWorm,wormFoe];
let wvSc=sc('ワーム・ヴィクトリー'), wvStat=wvSc.continuous.apply(wv,wv,{p:0});
ok('ワーム・ヴィクトリー positive: 自分墓地ワーム爬虫類2体でATK+1000',wvStat&&wvStat.atk===1000);
ok('ワーム・ヴィクトリー passive: リバースで誘発',wvSc.passive.onFlip(C(0,wv,'mz',0,'onFlip',{}))===true);
wvSc.resolve(C(0,wv,'mz',0,'onFlip',{}));
ok('ワーム・ヴィクトリー positive: 非ワーム爬虫類以外の表側モンスターを破壊',gameState.players[1].grave.includes(nonWorm));
ok('ワーム・ヴィクトリー ruling: ワーム爬虫類は破壊しない',gameState.players[1].mz.includes(wormFoe));
wv.face='down';
ok('ワーム・ヴィクトリー negative: 裏側の自身は継続ATKを出さない',wvSc.continuous.apply(wv,wv,{p:0})===null);

reset0();
let mb=mk('記憶破壊王'), syn1=mk('デスカイザー・ドラゴン',1), syn2=mk('トライデント・ドラギオン',1), nm=mk('ワイト',1);
gameState.players[0].mz=[mb];gameState.players[1].grave=[syn1,nm,syn2];
let mbSc=sc('記憶破壊王');
let mbCtx=C(0,mb,'mz',0,'onBattleDamage',{event:{player:1,amount:2000,direct:true,attackerUid:mb.uid,defenderUid:null}});
ok('記憶破壊王 positive: 直接攻撃ダメージで誘発',mbSc.passive.onBattleDamage(mbCtx)===true);
const mbLp=gameState.players[1].lp;mbSc.resolve(mbCtx);
ok('記憶破壊王 positive: 相手墓地シンクロ2体を除外',gameState.players[1].banish.includes(syn1)&&gameState.players[1].banish.includes(syn2)&&gameState.players[1].grave.includes(nm));
ok('記憶破壊王 positive: 除外数×1000ダメージ',gameState.players[1].lp===mbLp-2000);
let mbBad=C(0,mb,'mz',0,'onBattleDamage',{event:{player:1,amount:2000,direct:false,attackerUid:mb.uid,defenderUid:nm.uid}});
ok('記憶破壊王 negative: 直接攻撃でなければ誘発しない',mbSc.condition(mbBad)===false);

ok('cycle44 serialization: gameStateへ関数を保存していない',JSON.stringify(gameState).indexOf('function')<0);
`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const context={console,require,process,__dirname:path.join(ROOT,'tools'),__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};context.window=context;context.globalThis=context;
let thrown=false;
try{vm.runInNewContext(js,context,{filename:'battle.html',timeout:60000});}catch(e){thrown=true;console.error(e.stack||e);}
const RR=context.__R||[];let f=0;for(const r of RR){console.log((r.ok?'PASS ':'FAIL ')+r.name+(r.detail?' :: '+r.detail:''));if(!r.ok)f++;}
if(thrown||f||!RR.length)process.exit(2);
