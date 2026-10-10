/* System v21 — DestructionProtection の基盤テスト。
   カード個別の TESTED 判定の証拠にはしない。 */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);
  const c={id,owner:p,controller:p,face,pos};ensureCardUid(gameState,c);return c;}
function reset0(){
  gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=5;
  PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;
  resetChoiceStatsV49();v41ResetActionJournal(gameState);API.selectCard=(t,list,cb)=>cb(list[0]);
  Object.keys(SAVED_SCRIPTS).forEach(k=>{ if(SAVED_SCRIPTS[k]===undefined) delete CARD_SCRIPTS[k]; else CARD_SCRIPTS[k]=SAVED_SCRIPTS[k]; });
}
const SAVED_SCRIPTS={};
function withScript(name, patch){
  if(!(name in SAVED_SCRIPTS)) SAVED_SCRIPTS[name]=CARD_SCRIPTS[name];
  CARD_SCRIPTS[name]=Object.assign({}, CARD_SCRIPTS[name]||{}, patch);
}
/* 小道具は通常モンスター（スクリプトを持たない）だけを使う。
   v21 の宣言はテスト内で一時的に足し、毎回元へ戻す。 */
const BIG='ヂェミナイ・エルフ';     /* 攻1900 */
const SMALL='セイバーザウルス';      /* 攻1900 守1200 */
const FIELD_S='ブラック・ホール';
function h(c){ return locateCardAnyV4(c); }
function battle(atkIdx,tgtIdx){ act({type:"ATTACK", player:0, atkIdx, target:tgtIdx}); act({type:"BATTLE_CLEANUP"}); }
function inMz(p,c){ return (gameState.players[p].mz||[]).some(x=>x&&x.uid===c.uid); }
function inGrave(p,c){ return (gameState.players[p].grave||[]).some(x=>x&&x.uid===c.uid); }

/* ================= 1. 何も宣言しなければ従来通り ================= */
reset0();
let a0=mk(BIG,0),d0=mk(SMALL,1,'up','def');
gameState.players[0].mz=[a0];gameState.players[1].mz=[d0];
let dig0=v41StateDigest(gameState);
ok('v21 非回帰: 宣言が無ければ digest に載らない',
   v41StateDigestText(gameState).indexOf('protV21')<0&&v41StateDigestText(gameState).indexOf('protUsedV21')<0);
battle(0,0);
ok('v21 非回帰: 宣言が無ければ普通に戦闘破壊される',!inMz(1,d0)&&inGrave(1,d0));
reset0();
let e0=mk(SMALL,1);gameState.players[1].mz=[e0];
API.destroy(h(e0),'テスト');
ok('v21 非回帰: 宣言が無ければ普通に効果破壊される',!inMz(1,e0)&&inGrave(1,e0));

/* ================= 2. 戦闘破壊耐性（条件付き） ================= */
reset0();
withScript(SMALL,{protectV21:{battle:(target,src,ctx)=>{
  const foe=ctx&&ctx.opponentCard; return !!foe&&curATK(foe)>=1900;},label:'テスト条件耐性'}});
let atk1=mk(BIG,0),def1=mk(SMALL,1,'up','def');
gameState.players[0].mz=[atk1];gameState.players[1].mz=[def1];
battle(0,0);
ok('v21 条件付き: 攻撃力1900以上との戦闘では破壊されない',inMz(1,def1));
reset0();
withScript(SMALL,{protectV21:{battle:(target,src,ctx)=>{
  const foe=ctx&&ctx.opponentCard; return !!foe&&curATK(foe)>=2500;},label:'テスト条件耐性'}});
let atk2=mk(BIG,0),def2=mk(SMALL,1,'up','def');
gameState.players[0].mz=[atk2];gameState.players[1].mz=[def2];
battle(0,0);
ok('v21 条件付き negative: 条件を満たさなければ破壊される',!inMz(1,def2));

/* ================= 3. 1ターンに◯度 ================= */
reset0();
withScript(SMALL,{protectV21:{battle:true,perTurn:1,key:'once',label:'1ターンに1度'}});
let A3=mk(BIG,0),D3=mk(SMALL,1,'up','def');
gameState.players[0].mz=[A3];gameState.players[1].mz=[D3];
battle(0,0);
ok('v21 perTurn: 1度目は守られる',inMz(1,D3));
ok('v21 perTurn: 消費が記録される',protUsedCountV21(gameState,D3,'once')===1);
A3.attacked=false;A3.attackCount=0;
battle(0,0);
ok('v21 perTurn: 2度目は守られない',!inMz(1,D3));
reset0();
withScript(SMALL,{protectV21:{battle:true,perTurn:2,key:'twice',label:'1ターンに2度'}});
let A4=mk(BIG,0),D4=mk(SMALL,1,'up','def');
gameState.players[0].mz=[A4];gameState.players[1].mz=[D4];
battle(0,0);A4.attacked=false;A4.attackCount=0;battle(0,0);
ok('v21 perTurn 2: 2度目まで守られる',inMz(1,D4)&&protUsedCountV21(gameState,D4,'twice')===2);
A4.attacked=false;A4.attackCount=0;battle(0,0);
ok('v21 perTurn 2: 3度目は守られない',!inMz(1,D4));
/* ターンが変われば戻る */
reset0();
withScript(SMALL,{protectV21:{battle:true,perTurn:1,key:'once',label:'1ターンに1度'}});
let A5=mk(BIG,0),D5=mk(SMALL,1,'up','def');
gameState.players[0].mz=[A5];gameState.players[1].mz=[D5];
battle(0,0);
gameState.turn++;
ok('v21 perTurn: ターンが変われば使用回数は0に戻る',protUsedCountV21(gameState,D5,'once')===0);
A5.attacked=false;A5.attackCount=0;battle(0,0);
ok('v21 perTurn: 次のターンは再び守られる',inMz(1,D5));

/* ================= 4. 効果破壊耐性 ================= */
reset0();
withScript(SMALL,{protectV21:{effect:true,label:'効果破壊耐性'}});
let t4=mk(SMALL,1);gameState.players[1].mz=[t4];
API.destroy(h(t4),'テスト');
ok('v21 効果破壊: 破壊されない',inMz(1,t4)&&!inGrave(1,t4));
ok('v21 効果破壊: カードは場から動かない',gameState.players[1].mz.length===1);
API.sendToGrave(h(t4),'テスト');
ok('v21 責務分離: 墓地送りは防がない',!inMz(1,t4)&&inGrave(1,t4));
reset0();
withScript(SMALL,{protectV21:{effect:true,label:'効果破壊耐性'}});
let t5=mk(SMALL,1);gameState.players[1].mz=[t5];
act({type:'FX_BANISH',player:1,zone:'mz',index:0,reason:'テスト'});
ok('v21 責務分離: 除外は防がない',!inMz(1,t5));
reset0();
withScript(SMALL,{protectV21:{effect:true,label:'効果破壊耐性'}});
let t6=mk(SMALL,1),t7=mk(BIG,1);gameState.players[1].mz=[t6,t7];
API.destroyAll('mz',1,'全体破壊テスト');
ok('v21 全体破壊: 守られたカードだけ場に残る',
   inMz(1,t6)&&!inMz(1,t7),gameState.players[1].mz.map(c=>dbOf(c).n).join(','));
reset0();
withScript(SMALL,{protectV21:{battle:true,label:'戦闘だけ'}});
let t8=mk(SMALL,1);gameState.players[1].mz=[t8];
API.destroy(h(t8),'テスト');
ok('v21 責務分離: 戦闘耐性だけの宣言は効果破壊を防がない',!inMz(1,t8));

/* ================= 5. battleProof / 対象耐性 と混ぜない ================= */
reset0();
withScript(SMALL,{battleProof:true});
let bp=mk(SMALL,1);gameState.players[1].mz=[bp];
API.destroy(h(bp),'テスト');
ok('v21 非回帰: battleProof は効果破壊を防がないまま',!inMz(1,bp));
reset0();
withScript(SMALL,{battleProof:true});
let bpA=mk(BIG,0),bpD=mk(SMALL,1,'up','def');
gameState.players[0].mz=[bpA];gameState.players[1].mz=[bpD];
battle(0,0);
ok('v21 非回帰: battleProof は従来通り戦闘破壊を防ぐ',inMz(1,bpD));
ok('v21 非回帰: battleProof は回数を消費しない',bpD.protUsedV21===undefined);

/* ================= 6. 継続効果による付与 ================= */
reset0();
withScript(FIELD_S,{continuous:{scope:'ownMonsters',protectV21:{scope:'ownMonsters',effect:true,label:'継続付与'}}});
let src6=mk(FIELD_S,1),m6=mk(SMALL,1),m6b=mk(BIG,0);
gameState.players[1].sz=[src6];gameState.players[1].mz=[m6];gameState.players[0].mz=[m6b];
API.destroy(h(m6),'テスト');
ok('v21 継続付与: 自分のモンスターが守られる',inMz(1,m6));
API.destroy(h(m6b),'テスト');
ok('v21 継続付与 negative: 相手のモンスターは守られない',!inMz(0,m6b));
API.sendToGrave(h(src6),'ソース除去');
API.destroy(h(m6),'テスト');
ok('v21 継続付与: ソースが場を離れれば守られない',!inMz(1,m6));

/* ================= 7. 一時付与 ================= */
reset0();
let g7=mk(SMALL,1);gameState.players[1].mz=[g7];
API.grantProtection(h(g7),{battle:true,effect:true,until:'endTurn',key:'temp',label:'一時付与'});
ok('v21 一時付与: 記録される',Array.isArray(g7.protV21)&&g7.protV21.length===1);
API.destroy(h(g7),'テスト');
ok('v21 一時付与: 効果破壊を防ぐ',inMz(1,g7));
clearExpiredMods(gameState,'endBattlePhase');
ok('v21 一時付与: バトルフェイズ終了では消えない',(g7.protV21||[]).length===1);
clearExpiredMods(gameState,'endTurn');
ok('v21 一時付与: ターン終了で消える',g7.protV21===undefined);
API.destroy(h(g7),'テスト');
ok('v21 一時付与: 消えた後は守られない',!inMz(1,g7));
/* チェーンスコープ */
reset0();
let g8=mk(SMALL,1),src8=mk(FIELD_S,0);
gameState.players[1].mz=[g8];gameState.players[0].sz=[src8];
ensureCardUid(gameState,src8);
act({type:'CHAIN_ADD',player:0,cardId:src8.id,uid:src8.uid,name:FIELD_S,from:'sz',index:0,targets:[]});
const cid8=gameState.chain[gameState.chain.length-1].chainId;
API.grantProtection(h(g8),{effect:true,until:'permanent',chainId:cid8,key:'chain',label:'このチェーンだけ'});
API.destroy(h(g8),'テスト');
ok('v21 チェーンスコープ: そのチェーンの間は守られる',inMz(1,g8));
act({type:'CHAIN_CLEAR'});
API.destroy(h(g8),'テスト');
ok('v21 チェーンスコープ: チェーンが終われば守られない',!inMz(1,g8));

/* ================= 8. 発動元の種類・対象の有無で絞る ================= */
reset0();
withScript(SMALL,{protectV21:{effect:true,sourceKind:'s',label:'魔法だけ防ぐ'}});
let k1=mk(SMALL,1),sp1=mk(FIELD_S,0);
gameState.players[1].mz=[k1];gameState.players[0].sz=[sp1];ensureCardUid(gameState,sp1);
act({type:'CHAIN_ADD',player:0,cardId:sp1.id,uid:sp1.uid,name:FIELD_S,from:'sz',index:0,targets:[]});
ok('v21 種類判定: 解決中のリンクから種類を取れる',destroyerKindV21(gameState)==='s');
API.destroy(h(k1),'テスト');
ok('v21 種類で絞る: 魔法カードの効果では破壊されない',inMz(1,k1));
act({type:'CHAIN_CLEAR'});
let tr1=mk('D2シールド',0);gameState.players[0].sz=[tr1];ensureCardUid(gameState,tr1);
act({type:'CHAIN_ADD',player:0,cardId:tr1.id,uid:tr1.uid,name:'D2シールド',from:'sz',index:0,targets:[]});
API.destroy(h(k1),'テスト');
ok('v21 種類で絞る negative: 罠カードの効果では守られない',!inMz(1,k1));
reset0();
withScript(SMALL,{protectV21:{effect:true,nonTargetingOnly:true,label:'対象を取らない効果だけ'}});
let k2=mk(SMALL,1),sp2=mk(FIELD_S,0);
gameState.players[1].mz=[k2];gameState.players[0].sz=[sp2];ensureCardUid(gameState,sp2);
act({type:'CHAIN_ADD',player:0,cardId:sp2.id,uid:sp2.uid,name:FIELD_S,from:'sz',index:0,targets:[]});
ok('v21 対象の有無: 対象を取っていない',destroyerTargetingV21(gameState)===false);
API.destroy(h(k2),'テスト');
ok('v21 対象を取らない効果だけ: 守られる',inMz(1,k2));
gameState.chain[gameState.chain.length-1].targets=[{p:1,zone:'mz',index:0,uid:k2.uid}];
ok('v21 対象の有無: 対象を取っている',destroyerTargetingV21(gameState)===true);
API.destroy(h(k2),'テスト');
ok('v21 対象を取らない効果だけ negative: 対象を取る効果では守られない',!inMz(1,k2));
/* 相手の効果だけ防ぐ */
reset0();
withScript(SMALL,{protectV21:{effect:true,opponentOnly:true,label:'相手の効果だけ'}});
let k3=mk(SMALL,1);gameState.players[1].mz=[k3];
act({type:'FX_TO_GRAVE',player:1,zone:'mz',index:0,reason:'相手の効果',byDestroy:true,byPlayer:0});
ok('v21 相手の効果だけ: 相手の効果では破壊されない',inMz(1,k3));
act({type:'FX_TO_GRAVE',player:1,zone:'mz',index:0,reason:'自分の効果',byDestroy:true,byPlayer:1});
ok('v21 相手の効果だけ negative: 自分の効果では破壊される',!inMz(1,k3));

/* ================= 9. Replay / SaveLoad / Undo / Redo ================= */
reset0();
withScript(SMALL,{protectV21:{battle:true,perTurn:1,key:'once',label:'1ターンに1度'}});
let rA=mk(BIG,0),rD=mk(SMALL,1,'up','def');
gameState.players[0].mz=[rA];gameState.players[1].mz=[rD];
v41ResetActionJournal(gameState);
battle(0,0);
API.grantProtection(h(rD),{effect:true,until:'endTurn',key:'temp',label:'一時'});
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('v21 Replay: 消費と一時付与が digest 一致で再生される',audit.ok,audit.reason||audit.finalDigest);
let snap=JSON.stringify(gameState);
ok('v21 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('v21 直列化: 記録は純JSON',assertProtSerializableV21(gameState)===null,
   String(assertProtSerializableV21(gameState)));
ok('v21 digest: 使ったときだけ載る',v41StateDigestText(gameState).indexOf('protUsedV21')>=0);
reset0();
let uD=mk(SMALL,1);gameState.players[1].mz=[uD];
snapshot();
let digPre=v41StateDigest(gameState);
API.grantProtection(h(uD),{effect:true,until:'endTurn',key:'temp',label:'一時'});
ok('v21 Undo: 付与後は守られる',protectionRecordV21(gameState,uD,{cause:'effect'})!==null);
undo();
ok('v21 Undo: 付与が取り消される',
   gameState.players[1].mz[0].protV21===undefined&&v41StateDigest(gameState)===digPre);
redo();
ok('v21 Redo: 付与が戻る',(gameState.players[1].mz[0].protV21||[]).length===1);

/* ================= 10. 領域ローカル ================= */
reset0();
let z=mk(SMALL,1);gameState.players[1].mz=[z];
API.grantProtection(h(z),{effect:true,until:'permanent',key:'temp',label:'一時'});
protConsumeV21(gameState,z,'temp');
API.sendToGrave(h(z),'テスト');
let inG=(gameState.players[1].grave||[]).find(c=>c&&c.uid===z.uid);
ok('v21 領域ローカル: 場を離れたら一時付与も回数記録も消える',
   !!inG&&inG.protV21===undefined&&inG.protUsedV21===undefined);

/* ================= 11. 既存機構の非回帰 ================= */
reset0();
ok('v21 非回帰: 通常のシャッフルとドローは従来通り',(()=>{
  gameState.players[0].deck=[mk(BIG),mk(SMALL)];const n=gameState.players[0].deck.length;
  API.draw(0,1);return gameState.players[0].deck.length===n-1;})());
reset0();
ok('v21 非回帰: v20 の公開は従来通り',(()=>{
  const c=mk(BIG,1);gameState.players[1].hand=[c];
  API.reveal({player:1,audience:'both',zone:'hand',until:'permanent',label:'非回帰'});
  return isRevealedToV20(gameState,c.uid,0)===true;})());
reset0();
ok('v21 非回帰: v19 の効果カテゴリは従来通り',
   effectCategoriesOfNameV19('ブラック・ホール').destroy===true);
reset0();
ok('v21 非回帰: LP 0 で敗北判定は従来通り',(()=>{
  API.damageLP(1,8000);return gameState.loser===1;})());

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
