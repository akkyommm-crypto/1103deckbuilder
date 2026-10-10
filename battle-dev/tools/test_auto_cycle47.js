/* Auto cycle 47 dedicated tests. */
const fs=require('fs'),vm=require('vm'),path=require('path');const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*$/m,'/* boot skipped */');
js+=String.raw`
CARD_DB=globalThis.__DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};openPick=()=>{};
const R=[],ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});globalThis.__R=R;
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);const c={id,owner:p,controller:p,face,pos,summonedTurn:1};ensureCardUid(gameState,c);return c;}
function reset0(){gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=47;PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];resetChoiceStatsV49();v41ResetActionJournal(gameState);gameState.fieldSnapV9=fieldSnapshotV9(gameState);}
function sc(n){const s=CARD_SCRIPTS[n];if(!s)throw Error('script missing '+n);return s;}
function C(p,card,zone,idx,ev,extra){const c=makeContext(p,card,zone,idx,ev||'activate',extra||{});if(extra&&extra.battle)c.battle=extra.battle;if(extra&&extra.step)c.step=extra.step;return c;}
const TARGETS=['ハイパーサイコガンナー'];
TARGETS.forEach(n=>ok('cycle47 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle47 枚数は1',TARGETS.length===1);

reset0();
let hpg=mk('ハイパーサイコガンナー'), wall=mk('青眼の白龍',1,'up','def'), atk=mk('ワイト',1,'up','atk');
gameState.players[0].mz=[hpg];gameState.players[1].mz=[wall,atk];gameState.players[0].lp=5000;
let hpgSc=sc('ハイパーサイコガンナー');
ok('ハイパーサイコガンナー positive: 守備表示へ貫通',
  hpgSc.continuous.piercingDamage({self:hpg,atkCard:hpg,defCard:wall})===Math.max(0,curATK(hpg)-curDEF(wall)));
ok('ハイパーサイコガンナー negative: 攻撃表示相手には貫通しない',
  hpgSc.continuous.piercingDamage({self:hpg,atkCard:hpg,defCard:atk})===0);
ok('ハイパーサイコガンナー negative: 自身が攻撃していなければ貫通しない',
  hpgSc.continuous.piercingDamage({self:hpg,atkCard:atk,defCard:wall})===0);
let battle={atkCard:hpg,defCard:wall,damage:500,toPlayer:1};
let ctx=C(0,hpg,'mz',0,'onDamageStep',{battle,step:'after'});
ok('ハイパーサイコガンナー positive: damage step afterで回復誘発',hpgSc.passive.onDamageStep(ctx)===true);
const lp0=gameState.players[0].lp;hpgSc.resolve(ctx);
ok('ハイパーサイコガンナー positive: 超過分を回復',gameState.players[0].lp===lp0+Math.max(0,curATK(hpg)-curDEF(wall)));
let hugeWall=mk('青眼の白龍',1,'up','def');
gameState.players[1].mz.push(hugeWall);
v4RegisterStatModifier({p:1,zone:'mz',index:1,card:hugeWall},{setDef:4000},{code:'cycle47 fixture',resetMask:RESET.LEAVE});
ok('ハイパーサイコガンナー negative: 超過なしなら誘発しない',
  hpgSc.passive.onDamageStep(C(0,hpg,'mz',0,'onDamageStep',{battle:{atkCard:hpg,defCard:hugeWall},step:'after'}))===false);
ok('ハイパーサイコガンナー ruling: damage step after以外では誘発しない',
  hpgSc.passive.onDamageStep(C(0,hpg,'mz',0,'onDamageStep',{battle,step:'calc'}))===false);
hpg.face='down';
ok('ハイパーサイコガンナー negative: 裏側なら誘発しない',hpgSc.passive.onDamageStep(ctx)===false);

ok('cycle47 serialization: gameStateへ関数を保存していない',JSON.stringify(gameState).indexOf('function')<0);
`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const context={console,require,process,__dirname:path.join(ROOT,'tools'),__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};context.window=context;context.globalThis=context;
let thrown=false;
try{vm.runInNewContext(js,context,{filename:'battle.html',timeout:60000});}catch(e){thrown=true;console.error(e.stack||e);}
const RR=context.__R||[];let f=0;for(const r of RR){console.log((r.ok?'PASS ':'FAIL ')+r.name+(r.detail?' :: '+r.detail:''));if(!r.ok)f++;}
if(thrown||f||!RR.length)process.exit(2);
