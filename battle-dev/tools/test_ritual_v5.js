/* System v5 — Ritual Summon primitive 回帰テスト
   検証項目: levelMode(exact/atLeast) / 過剰リリース禁止 / uid権威 /
             素材選択のP1再利用 / 選択途中のSaveLoad / 二重支払い防止 /
             ritual provenance / Replay / Undo / Redo / digest後方互換     */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
let __u=95000;
function mkR(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);return{id,owner:p,controller:p,face,pos,uid:__u++};}
function resetR(){
  gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=3;
  PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;
  resetChoiceStatsV49();v41ResetActionJournal(gameState);
}
function pick(i){const p=pendingChoiceV49(gameState);if(!p)throw new Error('no pending choice');return answerChoiceV49([p.candidates[i||0].key]);}
function pickUid(uid){const p=pendingChoiceV49(gameState);if(!p)throw new Error('no pending choice');
  const c=p.candidates.find(x=>x.uid===uid);if(!c)throw new Error('uid not a candidate: '+uid);return answerChoiceV49([c.key]);}

/* =====================================================================
   1. levelMode の判定ロジック
   ===================================================================== */
ok('Ritual exact: 合計一致のみ合法',
   ritualSelectionValidV5([4,4],8,'exact')===true && ritualSelectionValidV5([4,5],8,'exact')===false
   && ritualSelectionValidV5([4,3],8,'exact')===false);
ok('Ritual atLeast: 必要Lvを超えても合法',
   ritualSelectionValidV5([5,4],8,'atLeast')===true);
ok('Ritual atLeast: 不足は非合法',ritualSelectionValidV5([4,3],8,'atLeast')===false);
ok('Ritual atLeast: 過剰リリースは非合法（1体外してもNを満たす）',
   ritualSelectionValidV5([4,4,4],8,'atLeast')===false,'4+4+4 で8以上は過剰');
ok('Ritual atLeast: ちょうど到達も合法',ritualSelectionValidV5([4,4],8,'atLeast')===true);
ok('Ritual atLeast: 単体で超過は合法',ritualSelectionValidV5([8],4,'atLeast')===true);
ok('Ritual: 空選択は非合法',ritualSelectionValidV5([],8,'atLeast')===false&&ritualSelectionValidV5([],8,'exact')===false);

/* metadata がカード個別であること */
ok('Ritual metadata: 全エントリに levelMode がある',
   Object.keys(RITUAL_SPEC_V5).every(k=>RITUAL_LEVEL_MODES_V5.indexOf(RITUAL_SPEC_V5[k].levelMode)>=0));
ok('Ritual metadata: exact と atLeast が両方存在する',
   Object.keys(RITUAL_SPEC_V5).some(k=>RITUAL_SPEC_V5[k].levelMode==='exact') &&
   Object.keys(RITUAL_SPEC_V5).some(k=>RITUAL_SPEC_V5[k].levelMode==='atLeast'));
ok('Ritual metadata: exact は必要Lvを儀式モンスターから取る',
   RITUAL_SPEC_V5['エンド・オブ・ザ・ワールド'].level===null);
ok('Ritual metadata: 直列化可能（純JSON）',
   (()=>{try{JSON.parse(JSON.stringify(RITUAL_SPEC_V5));return true;}catch(e){return false;}})());

/* =====================================================================
   2. atLeast の一連の流れ（ゼラの儀式 / ゼラ Lv8）
   ===================================================================== */
resetR();
let spell=mkR('ゼラの儀式'),zera=mkR('ゼラ'),m4a=mkR('ヂェミナイ・エルフ'),m4b=mkR('ヂェミナイ・エルフ');
gameState.players[0].sz=[spell];gameState.players[0].hand=[zera,m4a,m4b];
v41ResetActionJournal(gameState);
ok('atLeast 発動条件: 素材が足りていれば発動できる',API.ritualCanActivate(0,'ゼラの儀式')===true);
let e=nativeEffectsV4('ゼラの儀式')[0];
let c=makeContext(0,spell,'sz',0,'activate',{});
ok('atLeast condition() が真',e.condition(c)===true);
e.operation(c);
let pc=pendingChoiceV49(gameState);
ok('atLeast: 素材選択が P1 ChoiceRequest として開く',!!pc&&pc.resume.handler==='ritual.pickMaterial');
ok('atLeast: 選択途中の状態は純JSON',assertChoiceSerializableV49(gameState).ok,assertChoiceSerializableV49(gameState).why);
ok('atLeast: 儀式モンスター自身は素材候補に出ない',!pc.candidates.some(x=>x.uid===zera.uid));
pickUid(m4a.uid);
ok('atLeast: 1枚目を選ぶと2枚目の選択が開く',!!pendingChoiceV49(gameState));
ok('atLeast: 選択済みは候補から外れる',!pendingChoiceV49(gameState).candidates.some(x=>x.uid===m4a.uid));
pickUid(m4b.uid);
ok('atLeast: 合計8で儀式召喚が成立する',
   gameState.players[0].mz.length===1&&gameState.players[0].mz[0].uid===zera.uid,
   'mz='+gameState.players[0].mz.length);
ok('atLeast: 素材は墓地へ送られる',gameState.players[0].grave.length===2);
ok('atLeast: 手札は空になる',gameState.players[0].hand.length===0);
let prov=API.ritualProvenance(gameState.players[0].mz[0]);
ok('Ritual provenance: summonType が ritual',!!prov&&prov.summonType==='ritual',JSON.stringify(prov));
ok('Ritual provenance: materialRefs が uid で2件',
   prov.materialRefs.length===2&&prov.materialRefs.indexOf(m4a.uid)>=0&&prov.materialRefs.indexOf(m4b.uid)>=0);
ok('Ritual provenance: materialSnapshots が P3 形式',
   prov.materialSnapshots.length===2&&prov.materialSnapshots.every(s=>s.uid!=null&&typeof s.code==='number'&&s.atk!=null));
ok('Ritual provenance: カード名を持たない',JSON.stringify(prov).indexOf('ヂェミナイ')<0);
ok('Ritual provenance: 世代識別子を持つ（P3と整合）',typeof prov.summonInstance==='number');
ok('Ritual provenance: 素材側にも usedAsMaterial が付く',
   wasUsedAsMaterialV3(findCardByUid(m4a.uid).card,'ritual'));
ok('Ritual: specialSummoned 扱いになる',gameState.players[0].mz[0].specialSummoned===true);
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('Ritual Replay: digest 一致で再生される',audit.ok,audit.reason||audit.finalDigest);

/* 過剰リリースが選べないこと（Lv4×3で Lv8 を狙う） */
resetR();
spell=mkR('ゼラの儀式');zera=mkR('ゼラ');
let t1=mkR('ヂェミナイ・エルフ'),t2=mkR('ヂェミナイ・エルフ'),t3=mkR('ヂェミナイ・エルフ');
gameState.players[0].sz=[spell];gameState.players[0].hand=[zera,t1,t2,t3];
v41ResetActionJournal(gameState);
nativeEffectsV4('ゼラの儀式')[0].operation(makeContext(0,spell,'sz',0,'activate',{}));
pickUid(t1.uid);pickUid(t2.uid);
ok('atLeast 過剰禁止: 合計8に達した時点で選択が終了する',
   pendingChoiceV49(gameState)===null&&gameState.players[0].grave.length===2,
   'grave='+gameState.players[0].grave.length);
ok('atLeast 過剰禁止: 3枚目はリリースされていない',gameState.players[0].hand.some(x=>x.uid===t3.uid));

/* =====================================================================
   3. exact の一連の流れ（エンド・オブ・ザ・ワールド / 終焉の王デミス Lv8）
   ===================================================================== */
resetR();
let eow=mkR('エンド・オブ・ザ・ワールド'),demis=mkR('終焉の王デミス');
let e4a=mkR('ヂェミナイ・エルフ'),e4b=mkR('ヂェミナイ・エルフ');
gameState.players[0].sz=[eow];gameState.players[0].hand=[demis,e4a,e4b];
v41ResetActionJournal(gameState);
ok('exact 発動条件: ちょうど作れるので発動できる',API.ritualCanActivate(0,'エンド・オブ・ザ・ワールド')===true);
nativeEffectsV4('エンド・オブ・ザ・ワールド')[0].operation(makeContext(0,eow,'sz',0,'activate',{}));
pickUid(e4a.uid);pickUid(e4b.uid);
ok('exact: 合計8ちょうどで儀式召喚が成立する',
   gameState.players[0].mz.length===1&&gameState.players[0].mz[0].uid===demis.uid);
ok('exact: 必要Lvは儀式モンスターのレベルから取られる',
   API.ritualProvenance(gameState.players[0].mz[0]).summonType==='ritual');

/* exact でちょうど作れない場合は発動できない（Lv5+Lv4 しかない） */
resetR();
eow=mkR('エンド・オブ・ザ・ワールド');demis=mkR('終焉の王デミス');
gameState.players[0].sz=[eow];
gameState.players[0].hand=[demis,mkR('冥界の魔王 ハ・デス'),mkR('ヂェミナイ・エルフ')];
ok('exact negative: ちょうど作れなければ発動できない',
   API.ritualCanActivate(0,'エンド・オブ・ザ・ワールド')===false,
   'Lv6+Lv4 では 8 ちょうどにできない');
ok('exact negative: 同じ盤面でも atLeast なら発動できる',
   (()=>{const s2=mkR('ゼラの儀式');gameState.players[0].sz=[s2];
         gameState.players[0].hand=[mkR('ゼラ'),mkR('冥界の魔王 ハ・デス'),mkR('ヂェミナイ・エルフ')];
         return API.ritualCanActivate(0,'ゼラの儀式')===true;})());

/* =====================================================================
   4. 素材不足・ゾーン不足の negative
   ===================================================================== */
resetR();
spell=mkR('ゼラの儀式');zera=mkR('ゼラ');
gameState.players[0].sz=[spell];gameState.players[0].hand=[zera,mkR('岩石の巨兵')];
ok('negative: 素材Lvが足りなければ発動できない',API.ritualCanActivate(0,'ゼラの儀式')===false,'Lv3のみ');
resetR();
spell=mkR('ゼラの儀式');
gameState.players[0].sz=[spell];gameState.players[0].hand=[mkR('ヂェミナイ・エルフ'),mkR('ヂェミナイ・エルフ')];
ok('negative: 儀式モンスターが手札に無ければ発動できない',API.ritualCanActivate(0,'ゼラの儀式')===false);
resetR();
spell=mkR('ゼラの儀式');zera=mkR('ゼラ');
gameState.players[0].sz=[spell];gameState.players[0].hand=[zera,mkR('ヂェミナイ・エルフ'),mkR('ヂェミナイ・エルフ')];
gameState.players[0].mz=[mkR('岩石の巨兵'),mkR('岩石の巨兵'),mkR('岩石の巨兵'),mkR('岩石の巨兵'),mkR('岩石の巨兵')];
ok('negative: モンスターゾーンが一杯なら発動できない',API.ritualCanActivate(0,'ゼラの儀式')===false);
resetR();
spell=mkR('ゼラの儀式');let wrong=mkR('チャクラ');
gameState.players[0].sz=[spell];gameState.players[0].hand=[wrong,mkR('ヂェミナイ・エルフ'),mkR('ヂェミナイ・エルフ')];
ok('negative: 対応しない儀式モンスターは降臨できない',API.ritualCanActivate(0,'ゼラの儀式')===false,'チャクラはゼラの儀式では出せない');

/* =====================================================================
   5. フィールド素材・複数候補からの選択
   ===================================================================== */
resetR();
spell=mkR('ゼラの儀式');zera=mkR('ゼラ');
let fieldMat=mkR('ヂェミナイ・エルフ'),handMat=mkR('ヂェミナイ・エルフ');
gameState.players[0].sz=[spell];gameState.players[0].mz=[fieldMat];gameState.players[0].hand=[zera,handMat];
v41ResetActionJournal(gameState);
nativeEffectsV4('ゼラの儀式')[0].operation(makeContext(0,spell,'sz',0,'activate',{}));
pc=pendingChoiceV49(gameState);
ok('素材候補: 手札とフィールドの両方が候補になる',
   pc.candidates.length===2&&pc.candidates.some(x=>x.uid===fieldMat.uid)&&pc.candidates.some(x=>x.uid===handMat.uid));
pickUid(fieldMat.uid);pickUid(handMat.uid);
ok('素材: フィールドと手札を混ぜてリリースできる',
   gameState.players[0].mz.length===1&&gameState.players[0].mz[0].uid===zera.uid&&
   gameState.players[0].grave.length===2);
/* 裏側のフィールドモンスターは素材にならない */
resetR();
spell=mkR('ゼラの儀式');zera=mkR('ゼラ');
let down=mkR('ヂェミナイ・エルフ',0,'down','def');
gameState.players[0].sz=[spell];gameState.players[0].mz=[down];
gameState.players[0].hand=[zera,mkR('ヂェミナイ・エルフ'),mkR('ヂェミナイ・エルフ')];
v41ResetActionJournal(gameState);
nativeEffectsV4('ゼラの儀式')[0].operation(makeContext(0,spell,'sz',0,'activate',{}));
ok('素材: 裏側のフィールドモンスターは候補に出ない',
   !pendingChoiceV49(gameState).candidates.some(x=>x.uid===down.uid));

/* =====================================================================
   6. 選択途中の SaveLoad
   ===================================================================== */
resetR();
spell=mkR('ゼラの儀式');zera=mkR('ゼラ');
let s1=mkR('ヂェミナイ・エルフ'),s2=mkR('ヂェミナイ・エルフ');
gameState.players[0].sz=[spell];gameState.players[0].hand=[zera,s1,s2];
v41ResetActionJournal(gameState);
nativeEffectsV4('ゼラの儀式')[0].operation(makeContext(0,spell,'sz',0,'activate',{}));
pickUid(s1.uid);                                   /* 素材1枚だけ選んだ途中 */
ok('SaveLoad途中: 1枚選択済みで選択待ちが残っている',!!pendingChoiceV49(gameState));
let mid=JSON.stringify(gameState);
ok('SaveLoad途中: 途中状態がJSON往復で完全一致',JSON.stringify(JSON.parse(mid))===mid);
ok('SaveLoad途中: 選択済み素材は resume.args に uid で保持される',
   pendingChoiceV49(gameState).resume.args.picked.length===1&&
   pendingChoiceV49(gameState).resume.args.picked[0]===s1.uid,
   JSON.stringify(pendingChoiceV49(gameState).resume.args));
gameState=JSON.parse(mid);
reconcileChoiceAfterLoadV49(gameState);
ok('SaveLoad途中: Load後も選択待ちが復元される',!!pendingChoiceV49(gameState));
pickUid(s2.uid);                                   /* 続きから2枚目を選ぶ */
ok('SaveLoad途中: Load後に選択を続行して儀式召喚できる',
   gameState.players[0].mz.length===1&&gameState.players[0].mz[0].uid===zera.uid,
   'mz='+gameState.players[0].mz.length);
ok('SaveLoad途中: 素材が二重に支払われていない',gameState.players[0].grave.length===2,
   'grave='+gameState.players[0].grave.length);

/* =====================================================================
   7. 二重支払い防止
   ===================================================================== */
resetR();
spell=mkR('ゼラの儀式');zera=mkR('ゼラ');
let d1=mkR('ヂェミナイ・エルフ'),d2=mkR('ヂェミナイ・エルフ');
gameState.players[0].sz=[spell];gameState.players[0].hand=[zera,d1,d2];
v41ResetActionJournal(gameState);
/* 儀式モンスターが手札から消えている状態で FX_RITUAL_SUMMON を直接叩く */
act({type:'FX_TO_GRAVE',player:0,zone:'hand',index:gameState.players[0].hand.indexOf(zera),reason:'先に墓地へ'});
let beforeGrave=gameState.players[0].grave.length, beforeHand=gameState.players[0].hand.length;
act({type:'FX_RITUAL_SUMMON',player:0,monsterUid:zera.uid,
     materialRefs:[d1.uid,d2.uid],p3SummonType:'ritual',pos:'atk',reason:'不正な儀式召喚'});
ok('二重支払い防止: 儀式モンスターが手札に無ければ素材を払わない',
   gameState.players[0].grave.length===beforeGrave&&gameState.players[0].hand.length===beforeHand,
   'grave='+gameState.players[0].grave.length+' hand='+gameState.players[0].hand.length);
ok('二重支払い防止: モンスターゾーンにも何も出ていない',gameState.players[0].mz.length===0);
/* 素材が場を離れている場合 */
resetR();
spell=mkR('ゼラの儀式');zera=mkR('ゼラ');d1=mkR('ヂェミナイ・エルフ');d2=mkR('ヂェミナイ・エルフ');
gameState.players[0].sz=[spell];gameState.players[0].hand=[zera,d1];gameState.players[0].deck=[d2];
v41ResetActionJournal(gameState);
act({type:'FX_RITUAL_SUMMON',player:0,monsterUid:zera.uid,
     materialRefs:[d1.uid,d2.uid],p3SummonType:'ritual',pos:'atk',reason:'素材欠け'});
ok('二重支払い防止: 素材が手札・場に無ければ何も起きない',
   gameState.players[0].mz.length===0&&gameState.players[0].grave.length===0&&
   gameState.players[0].hand.length===2);
ok('二重支払い防止: ritualFinishV5 も場を離れた素材を拒否する',
   ritualFinishV5(0,'ゼラの儀式',zera.uid,[d1.uid,d2.uid])===false);

/* =====================================================================
   8. uid が authority であること（index に依存しない）
   ===================================================================== */
resetR();
spell=mkR('ゼラの儀式');zera=mkR('ゼラ');
let u1=mkR('ヂェミナイ・エルフ'),u2=mkR('ヂェミナイ・エルフ'),filler=mkR('岩石の巨兵');
gameState.players[0].sz=[spell];gameState.players[0].hand=[filler,zera,u1,u2];
v41ResetActionJournal(gameState);
nativeEffectsV4('ゼラの儀式')[0].operation(makeContext(0,spell,'sz',0,'activate',{}));
pickUid(u1.uid);
/* 途中で手札の並びが変わっても uid で追える */
act({type:'FX_TO_GRAVE',player:0,zone:'hand',index:gameState.players[0].hand.indexOf(filler),reason:'並びを変える'});
pickUid(u2.uid);
ok('uid権威: 途中で手札の並びが変わっても正しい素材が払われる',
   gameState.players[0].mz.length===1&&gameState.players[0].mz[0].uid===zera.uid&&
   gameState.players[0].grave.filter(x=>x.uid===u1.uid||x.uid===u2.uid).length===2,
   'grave='+gameState.players[0].grave.map(x=>x.uid).join(','));
ok('uid権威: provenance も uid を保持する',
   API.ritualProvenance(gameState.players[0].mz[0]).materialRefs.indexOf(u1.uid)>=0);

/* =====================================================================
   9. Undo / Redo / digest 後方互換
   ===================================================================== */
resetR();
spell=mkR('ゼラの儀式');zera=mkR('ゼラ');
let r1=mkR('ヂェミナイ・エルフ'),r2=mkR('ヂェミナイ・エルフ');
gameState.players[0].sz=[spell];gameState.players[0].hand=[zera,r1,r2];
v41ResetActionJournal(gameState);
let digestBefore=v41StateDigest(gameState);
let textBefore=v41StateDigestText(gameState);
ok('digest後方互換: 儀式召喚前は provenance キーが出ない',
   textBefore.indexOf('summonProvenance')<0);
nativeEffectsV4('ゼラの儀式')[0].operation(makeContext(0,spell,'sz',0,'activate',{}));
pickUid(r1.uid);pickUid(r2.uid);
ok('前提: 儀式召喚に成功している',gameState.players[0].mz.length===1);
audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('Ritual Replay: 選択を含む全工程が digest 一致で再生される',audit.ok,audit.reason||audit.finalDigest);
undo();
ok('Ritual Undo: 儀式召喚が巻き戻る',
   gameState.players[0].mz.length===0&&gameState.players[0].hand.length===3,
   'mz='+gameState.players[0].mz.length+' hand='+gameState.players[0].hand.length);
ok('Ritual Undo: 巻き戻した素材に usedAsMaterial が残らない',
   gameState.players[0].hand.every(x=>!wasUsedAsMaterialV3(x)));
redo();
ok('Ritual Redo: 儀式召喚と provenance が復元される',
   gameState.players[0].mz.length===1&&API.ritualProvenance(gameState.players[0].mz[0]).summonType==='ritual');
while(HISTORY.length) undo();
ok('digest後方互換: 全て巻き戻すと元の digest に一致する',v41StateDigest(gameState)===digestBefore,
   'before='+digestBefore+' now='+v41StateDigest(gameState));

/* 直列化の健全性 */
function scanFnsR(v,d){ if(d>12||v===null||typeof v!=='object')return typeof v==='function';
  return Object.keys(v).some(k=>typeof v[k]==='function'||scanFnsR(v[k],d+1)); }
ok('Ritual 直列化: gameState 全体に関数が混入していない',
   !scanFnsR(JSON.parse(JSON.stringify(gameState)),0));

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:30000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error(e.stack||e);process.exit(1);}

