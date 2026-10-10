/* Auto cycle 41 — Red-Eyes / Dragon / Dragunity pickups.
   Dedicated positive / negative / ruling-edge tests. */
const fs=require('fs'),vm=require('vm'),path=require('path');const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*$/m,'/* boot skipped */');
js+=String.raw`
CARD_DB=globalThis.__DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};openPick=()=>{};
const R=[],ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});globalThis.__R=R;
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);
  const c={id,owner:p,controller:p,face,pos,summonedTurn:1};ensureCardUid(gameState,c);return c;}
function reset0(){gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=12;
  PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];resetChoiceStatsV49();
  v41ResetActionJournal(gameState);API.selectCard=(t,list,cb)=>cb(list[0]);API.confirm=(t,m,yes,no)=>{ if(no) no(); };
  gameState.fieldSnapV9=fieldSnapshotV9(gameState);}
function h(c){return locateCardAnyV4(c);}
function sc(n){const s=CARD_SCRIPTS[n];if(!s)throw Error('script missing '+n);return s;}
function C(p,card,zone,idx,ev,extra){const c=makeContext(p,card,zone,idx,ev||'activate',extra||{});if(extra&&extra.event)c.event=extra.event;return c;}
function ctxEv(p,card,ev,evt,zone){const loc=h(card);return C(p,card,zone||(loc&&loc.zone)||'mz',(loc&&loc.index)||0,ev,{event:evt});}
function pending(){return pendingChoiceV49(gameState);}
function answerKeys(keys){answerChoiceV49(keys);}
function lp(p){return gameState.players[p].lp;}
function names(p,z){return gameState.players[p][z].map(c=>dbOf(c).n);}
function setMod(c,atk,def){c.modifiers=(c.modifiers||[]);c.modifiers.push({atk:atk||0,def:def||0,until:'permanent',source:'test'});}

const TARGETS=['レッドアイズ・ダークネスメタルドラゴン','真紅眼の飛竜','黒炎弾','デスカイザー・ドラゴン','ドラグニティ－アングス','トライデント・ドラギオン','ストロング・ウィンド・ドラゴン'];
TARGETS.forEach(n=>ok('cycle41 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle41 枚数は7',TARGETS.length===7);

/* 1. レッドアイズ・ダークネスメタルドラゴン */
reset0();
let redmd=mk('レッドアイズ・ダークネスメタルドラゴン'), dragon=mk('青眼の白龍');
gameState.players[0].hand=[redmd];gameState.players[0].mz=[dragon];
let proc=sc('レッドアイズ・ダークネスメタルドラゴン').summonProcedure;
ok('REDMD positive: 表側ドラゴンを除外して手札から特殊召喚手順を開始できる',proc.condition(C(0,redmd,'hand',0,'summon'))===true);
proc.cost(C(0,redmd,'hand',0,'summon'),v=>ok('REDMD cost: 選択したドラゴンを除外する',v&&gameState.players[0].banish[0]===dragon&&gameState.players[0].hand[0]===redmd));
reset0();redmd=mk('レッドアイズ・ダークネスメタルドラゴン');gameState.players[0].hand=[redmd];gameState.players[0].mz=[mk('ワイト')];
ok('REDMD negative: 自分表側ドラゴンがなければ特殊召喚手順不可',proc.condition(C(0,redmd,'hand',0,'summon'))===false);
reset0();redmd=mk('レッドアイズ・ダークネスメタルドラゴン');let wyv=mk('真紅眼の飛竜'), bewd=mk('青眼の白龍');
gameState.players[0].mz=[redmd];gameState.players[0].hand=[bewd];gameState.players[0].grave=[wyv];
let redCtx=C(0,redmd,'mz',0,'activate');
ok('REDMD positive: 手札/墓地のドラゴンを特殊召喚できる',sc('レッドアイズ・ダークネスメタルドラゴン').condition(redCtx)===true);
sc('レッドアイズ・ダークネスメタルドラゴン').resolve(redCtx);
let pr=pending();
ok('REDMD P1: serializable ChoiceRequestで手札/墓地候補を提示',!!pr&&pr.candidates.length===2&&JSON.stringify(pr).indexOf('e3.redmd-special')>=0);
answerKeys([pr.candidates.find(x=>x.label.indexOf('青眼')>=0).key]);
ok('REDMD resolve: 選んだドラゴンを特殊召喚',names(0,'mz').includes('青眼の白龍')&&gameState.players[0].hand.length===0);
reset0();redmd=mk('レッドアイズ・ダークネスメタルドラゴン');gameState.players[0].mz=[redmd];gameState.players[0].hand=[mk('レッドアイズ・ダークネスメタルドラゴン')];
ok('REDMD negative: 同名自身は特殊召喚候補にしない',sc('レッドアイズ・ダークネスメタルドラゴン').condition(C(0,redmd,'mz',0,'activate'))===false);

/* 2. 真紅眼の飛竜 */
reset0();
let wyvern=mk('真紅眼の飛竜'), rebd=mk('真紅眼の黒竜');gameState.phase='end';gameState.players[0].grave=[wyvern,rebd];gameState.activePlayer=0;gameState.players[0].normalSummonUsed=false;
let wyCtx=C(0,wyvern,'grave',0,'onEndPhase',{event:{phase:'end'}});
ok('真紅眼の飛竜 positive: 通常召喚していない自分エンドフェイズに墓地で発動できる',sc('真紅眼の飛竜').condition(wyCtx)===true);
sc('真紅眼の飛竜').cost(wyCtx,v=>ok('真紅眼の飛竜 cost: 自身を除外する',v&&names(0,'banish').includes('真紅眼の飛竜')));
sc('真紅眼の飛竜').selectTargets(wyCtx,sel=>{wyCtx.selectedTargets=sel;});
sc('真紅眼の飛竜').resolve(wyCtx);
ok('真紅眼の飛竜 resolve: レッドアイズを墓地から特殊召喚',names(0,'mz').includes('真紅眼の黒竜'));
reset0();wyvern=mk('真紅眼の飛竜');rebd=mk('真紅眼の黒竜');gameState.phase='end';gameState.players[0].grave=[wyvern,rebd];gameState.players[0].normalSummonUsed=true;
ok('真紅眼の飛竜 negative: 通常召喚したターンは発動不可',sc('真紅眼の飛竜').condition(C(0,wyvern,'grave',0,'onEndPhase',{event:{phase:'end'}}))===false);

/* 3. 黒炎弾 */
reset0();
let burn=mk('黒炎弾'), target=mk('真紅眼の黒竜');gameState.players[0].sz=[burn];gameState.players[0].mz=[target];setMod(target,900,0);
let burnCtx=C(0,burn,'sz',0,'activate');
ok('黒炎弾 positive: 真紅眼の黒竜がいれば発動できる',sc('黒炎弾').condition(burnCtx)===true);
sc('黒炎弾').selectTargets(burnCtx,sel=>{burnCtx.selectedTargets=sel;});
const lpBefore=lp(1);sc('黒炎弾').resolve(burnCtx);
ok('黒炎弾 ruling: 現在ATKではなく元々のATK2400分のダメージ',lpBefore-lp(1)===2400);
ok('黒炎弾 resolve: 対象の真紅眼の黒竜は攻撃不可になる',target.cannotAttack===true);
reset0();burn=mk('黒炎弾');gameState.players[0].sz=[burn];gameState.players[0].mz=[mk('青眼の白龍')];
ok('黒炎弾 negative: 真紅眼の黒竜以外では発動不可',sc('黒炎弾').condition(C(0,burn,'sz',0,'activate'))===false);

/* 4. デスカイザー・ドラゴン */
reset0();
let dk=mk('デスカイザー・ドラゴン');let zombie=mk('ワイト',1);gameState.players[0].mz=[dk];gameState.players[1].grave=[zombie];
let dkCtx=ctxEv(0,dk,'onSpecialSummon',{card:dk,kind:'synchro',player:0});
ok('デスカイザー positive: S召喚時に相手墓地アンデットを対象化できる',sc('デスカイザー・ドラゴン').condition(dkCtx)===true);
sc('デスカイザー・ドラゴン').selectTargets(dkCtx,sel=>{dkCtx.selectedTargets=sel;});
sc('デスカイザー・ドラゴン').resolve(dkCtx);
ok('デスカイザー resolve: 相手墓地アンデットを自分フィールドに特殊召喚',names(0,'mz').includes('ワイト')&&gameState.players[1].grave.length===0);
API.destroy(h(dk),'test');v9DetectLeaveField(gameState);enforceLinkedLeaveV9(gameState);v9DetectLeaveField(gameState);
ok('デスカイザー ruling: 自身が離れた時、蘇生モンスターも破壊される',!names(0,'mz').includes('ワイト')&&names(1,'grave').includes('ワイト'));
reset0();dk=mk('デスカイザー・ドラゴン');gameState.players[0].mz=[dk];gameState.players[1].grave=[mk('ワイト',1)];
ok('デスカイザー negative: S召喚以外では誘発しない',sc('デスカイザー・ドラゴン').condition(ctxEv(0,dk,'onSpecialSummon',{card:dk,kind:'effect',player:0}))===false);

/* 5. ドラグニティ－アングス */
reset0();
let ang=mk('ドラグニティ－アングス'), equip=mk('ドラグニティ－ブラックスピア'), wall=mk('ワイト',1,'up','def');gameState.players[0].mz=[ang];gameState.players[1].mz=[wall];
equip.v46MonsterEquip=true;equip.equipTo={p:0,uid:ang.uid};equip.equipUid=equip.uid;ang.equippedBy=[equip.equipUid];gameState.players[0].sz=[equip];
let pf=sc('ドラグニティ－アングス').continuous.piercingDamage;
ok('ドラグニティ－アングス positive: ドラグニティのドラゴン装備中は貫通',pf({self:ang,atkCard:ang,defCard:wall})===Math.max(0,curATK(ang)-curDEF(wall)));
gameState.players[0].sz=[];
ok('ドラグニティ－アングス negative: 装備なしなら貫通しない',pf({self:ang,atkCard:ang,defCard:wall})===0);
gameState.players[0].sz=[mk('青眼の白龍')];gameState.players[0].sz[0].v46MonsterEquip=true;gameState.players[0].sz[0].equipUid=gameState.players[0].sz[0].uid;gameState.players[0].sz[0].equipTo={p:0,uid:ang.uid};ang.equippedBy=[gameState.players[0].sz[0].equipUid];
ok('ドラグニティ－アングス ruling: ドラグニティでないドラゴン装備では貫通しない',pf({self:ang,atkCard:ang,defCard:wall})===0);

/* 6. トライデント・ドラギオン */
reset0();
let tri=mk('トライデント・ドラギオン'), own1=mk('ワイト'), own2=mk('サイクロン');gameState.players[0].mz=[tri,own1];gameState.players[0].sz=[own2];
let triCtx=ctxEv(0,tri,'onSpecialSummon',{card:tri,kind:'synchro',player:0});
ok('トライデント positive: S召喚時に自分カードがあれば発動できる',sc('トライデント・ドラギオン').condition(triCtx)===true);
let first=true;API.selectCard=(t,list,cb)=>cb(first?(first=false,list.find(x=>x.card===own1)):list[0]);API.confirm=(t,m,yes,no)=>yes();
sc('トライデント・ドラギオン').selectTargets(triCtx,sel=>{triCtx.selectedTargets=sel;});
sc('トライデント・ドラギオン').resolve(triCtx);
ok('トライデント resolve: 破壊した2枚分だけ攻撃回数を増やす',tri.attackLimit===3&&gameState.players[0].grave.length===2);
reset0();tri=mk('トライデント・ドラギオン');gameState.players[0].mz=[tri];
ok('トライデント negative: 破壊する自分カードが無いと発動不可',sc('トライデント・ドラギオン').condition(ctxEv(0,tri,'onSpecialSummon',{card:tri,kind:'synchro',player:0}))===false);

/* 7. ストロング・ウィンド・ドラゴン */
reset0();
let sw=mk('ストロング・ウィンド・ドラゴン'), dragonMat=mk('サファイアドラゴン');gameState.players[0].mz=[sw];
sw.summonProvenance={summonType:'tribute',materialSnapshots:[snapshotCardV3(dragonMat,['race','originalAtk'])]};
let swCtx=ctxEv(0,sw,'onNormalSummon',{card:sw,player:0});
ok('ストロング・ウィンド positive: ドラゴン1体リリースのアドバンス召喚なら誘発',sc('ストロング・ウィンド・ドラゴン').condition(swCtx)===true);
const atk0=curATK(sw);sc('ストロング・ウィンド・ドラゴン').resolve(swCtx);
ok('ストロング・ウィンド resolve: 素材の元々の攻撃力の半分だけ上昇',curATK(sw)===atk0+Math.floor(dbOf(dragonMat).atk/2));
let swPierce=sc('ストロング・ウィンド・ドラゴン').continuous.piercingDamage;
let def=mk('ワイト',1,'up','def');ok('ストロング・ウィンド ruling: 守備表示へ貫通',swPierce({self:sw,atkCard:sw,defCard:def})===Math.max(0,curATK(sw)-curDEF(def)));
let equal=mk('青眼の白龍',1);gameState.players[1].mz=[equal];API.modAtk(h(equal),curATK(sw)-curATK(equal),0,'permanent','test');
ok('ストロング・ウィンド ruling: 同攻撃力モンスターとの戦闘破壊耐性',!!protectionRecordV21(gameState,sw,{cause:'battle',opponentCard:equal}));
reset0();sw=mk('ストロング・ウィンド・ドラゴン');gameState.players[0].mz=[sw];sw.summonProvenance={summonType:'tribute',materialSnapshots:[snapshotCardV3(mk('ワイト'),['race','originalAtk'])]};
ok('ストロング・ウィンド negative: ドラゴン以外をリリースした場合は誘発しない',sc('ストロング・ウィンド・ドラゴン').condition(ctxEv(0,sw,'onNormalSummon',{card:sw,player:0}))===false);

`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const context={console,require,process,__dirname:path.join(ROOT,'tools'),__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};context.window=context;context.globalThis=context;
let thrown=false;
try{vm.runInNewContext(js,context,{filename:'battle.html',timeout:60000});}catch(e){thrown=true;console.error(e.stack||e);}
const RR=context.__R||[];let f=0;for(const r of RR){console.log((r.ok?'PASS ':'FAIL ')+r.name+(r.detail?' :: '+r.detail:''));if(!r.ok)f++;}
if(thrown||f||!RR.length)process.exit(2);
