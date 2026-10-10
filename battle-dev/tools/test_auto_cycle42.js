/* Auto cycle 42 dedicated tests.
   Positive / negative / ruling-edge coverage for three existing-engine cards. */
const fs=require('fs'),vm=require('vm'),path=require('path');const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*$/m,'/* boot skipped */');
js+=String.raw`
CARD_DB=globalThis.__DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};openPick=()=>{};
const R=[],ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});globalThis.__R=R;
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);const c={id,owner:p,controller:p,face,pos,summonedTurn:1};ensureCardUid(gameState,c);return c;}
function reset0(){gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=20;PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];resetChoiceStatsV49();v41ResetActionJournal(gameState);gameState.fieldSnapV9=fieldSnapshotV9(gameState);}
function sc(n){const s=CARD_SCRIPTS[n];if(!s)throw Error('script missing '+n);return s;}
const TARGETS=['レアメタル・ドラゴン','ナチュル・ドラゴンフライ','ライトロード・ドラゴン グラゴニス'];
TARGETS.forEach(n=>ok('cycle42 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle42 枚数は3',TARGETS.length===3);

reset0();
let rare=sc('レアメタル・ドラゴン');
ok('レアメタル・ドラゴン positive: 通常召喚不可フラグ',rare.cannotNormalSummon===true);
ok('レアメタル・ドラゴン negative: 特殊召喚不可にはしない',rare.cannotSpecialSummon!==true);
ok('レアメタル・ドラゴン ruling: 効果本文は通常召喚不可だけ',dbOf({id:findCardIndex('レアメタル・ドラゴン')}).e.trim()==='このカードは通常召喚できない。');

reset0();
let df=mk('ナチュル・ドラゴンフライ'), nat1=mk('ナチュル・エッグプラント'), nat2=mk('ナチュル・ガオドレイク'), non=mk('ワイト'), blue=mk('青眼の白龍',1), small=mk('クリッター',1);
gameState.players[0].mz=[df];gameState.players[0].grave=[nat1,nat2,non];
let dfApply=sc('ナチュル・ドラゴンフライ').continuous.apply;
ok('ナチュル・ドラゴンフライ positive: 自分墓地ナチュル2体でATK+400',dfApply(df,df,{p:0}).atk===400);
ok('ナチュル・ドラゴンフライ negative: 非ナチュルは数えない',curATK(df)===(dbOf(df).atk||0)+400);
ok('ナチュル・ドラゴンフライ positive: 2000以上との戦闘破壊耐性',!!protectionRecordV21(gameState,df,{cause:'battle',opponentCard:blue}));
ok('ナチュル・ドラゴンフライ negative: 2000未満との戦闘では耐性なし',protectionRecordV21(gameState,df,{cause:'battle',opponentCard:small})===null);
df.face='down';
ok('ナチュル・ドラゴンフライ ruling: 裏側ではATK修整しない',dfApply(df,df,{p:0})===null);

reset0();
let gr=mk('ライトロード・ドラゴン グラゴニス'), celestia=mk('ライトロード・エンジェル ケルビム'), jain=mk('ライトロード・パラディン ジェイン'), celestia2=mk('ライトロード・エンジェル ケルビム'), wall=mk('ワイト',1,'up','def');
gameState.players[0].mz=[gr];gameState.players[0].grave=[celestia,jain,celestia2];
let grSc=sc('ライトロード・ドラゴン グラゴニス'), grApply=grSc.continuous.apply;
let stat=grApply(gr,gr,{p:0});
ok('グラゴニス positive: ライトロード種類2でATK/DEF+600',stat&&stat.atk===600&&stat.def===600);
ok('グラゴニス ruling: 同名ライトロードは種類として重複カウントしない',curATK(gr)===(dbOf(gr).atk||0)+600);
ok('グラゴニス positive: 守備表示モンスターへの貫通',grSc.continuous.piercingDamage({self:gr,atkCard:gr,defCard:wall})===Math.max(0,curATK(gr)-curDEF(wall)));
wall.pos='atk';
ok('グラゴニス negative: 攻撃表示相手には貫通なし',grSc.continuous.piercingDamage({self:gr,atkCard:gr,defCard:wall})===0);
ok('グラゴニス ruling: エンドフェイズ3枚墓地送りを既存endPhaseMillで宣言',grSc.endPhaseMill===3);

let snap=JSON.stringify(gameState);
ok('cycle42 serialization: gameStateへ関数を保存していない',snap.indexOf('function')<0&&snap.indexOf('piercingDamage')<0);
`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const context={console,require,process,__dirname:path.join(ROOT,'tools'),__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};context.window=context;context.globalThis=context;
let thrown=false;
try{vm.runInNewContext(js,context,{filename:'battle.html',timeout:60000});}catch(e){thrown=true;console.error(e.stack||e);}
const RR=context.__R||[];let f=0;for(const r of RR){console.log((r.ok?'PASS ':'FAIL ')+r.name+(r.detail?' :: '+r.detail:''));if(!r.ok)f++;}
if(thrown||f||!RR.length)process.exit(2);
