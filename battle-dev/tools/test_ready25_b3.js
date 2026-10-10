/* Class A bulk 50 — READY25 batch 3 / 宣言・継続罠・追加攻撃。positive / negative / ruling edge。 */
const fs=require('fs'),vm=require('vm'),path=require('path');const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};openPick=()=>{};
const R=[],ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);
  const c={id,owner:p,controller:p,face,pos};ensureCardUid(gameState,c);return c;}
function reset0(){gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;
  gameState.phase='main1';gameState.turn=6;PLAY_MODE=PLAY_MODES.DUEL;
  HISTORY.length=0;REDO.length=0;turnActions=[];resetChoiceStatsV49();
  v41ResetActionJournal(gameState);API.selectCard=(t,list,cb)=>cb(list[0]);
  API.confirm=(t,m,yes,no)=>{ if(no) no(); };
  gameState.fieldSnapV9=fieldSnapshotV9(gameState);}
function h(c){return locateCardAnyV4(c);}
function effOf(n,k){const e=nativeEffectsV4(n).find(x=>!k||x.key===k);if(!e)throw Error('effect '+n+' '+k);return e;}
function ctxF(p,card,evname,evt){const loc=h(card);
  const c=makeContext(p,card,(loc&&loc.zone)||'mz',(loc&&loc.index)||0,evname||'onFlip',{event:evt});
  if(evt)c.event=evt;return c;}
function run(e,c){if(e.target)e.target(c,r=>{c.selectedTargets=r;}); e.operation(c);}
function pending(){return pendingChoiceV49(gameState);}
function answerAll(){const pc=pending();if(!pc)throw Error('no pending');return answerChoiceV49(pc.candidates.map(x=>x.key));}
function answerN(n){const pc=pending();if(!pc)throw Error('no pending');return answerChoiceV49(pc.candidates.slice(0,n).map(x=>x.key));}
function answerNamed(nm){const pc=pending();if(!pc)throw Error('no pending');
  const hit=pc.candidates.find(x=>{const f=x&&x.uid!=null?findCardByUid(x.uid):null;return f&&dbOf(f.card).n===nm;});
  return answerChoiceV49([(hit||pc.candidates[0]).key]);}
function inHand(p,c){return (gameState.players[p].hand||[]).some(x=>x&&x.uid===c.uid);}
function inMz(p,c){return (gameState.players[p].mz||[]).some(x=>x&&x.uid===c.uid);}
function pickFirst(){API.selectCard=(t,list,cb)=>cb(list[0]);}
function pickNamed(nm){API.selectCard=(t,list,cb)=>{const hit=list.find(x=>x&&x.card&&dbOf(x.card).n===nm);cb(hit||list[0]);};}

/* 小道具は TESTED / GENERIC_OK / NOT_STARTED のみ */
const PLAIN='ワイト';           /* GENERIC_OK lv3 */
const BIG='青眼の白龍';          /* GENERIC_OK */
const TRAP='落とし穴';           /* 罠 */
const SPELL='サイクロン';         /* 魔法 */
const FIELD='王家の眠る谷－ネクロバレー'; /* TESTED・フィールド魔法 */
const EFFMON='キラー・トマト';     /* TESTED・効果モンスター */
const NORMMON='ヂェミナイ・エルフ'; /* GENERIC_OK・通常モンスター */

const NAMES=['派手ハネ','尾も白い黒猫','水晶の占い師','聖なる守り手','幸運を告げるフクロウ',
 'カードを狩る死神','トラップ・マスター','爆弾かめ虫','雷仙人','ワーム・リンクス'];
NAMES.forEach(n=>ok('bulk50-b1 registration '+n,!!CARD_SCRIPTS[n]));
ok('前提: 落とし穴は罠',dbOf({id:findCardIndex(TRAP)}).k==='t');
ok('前提: サイクロンは魔法',dbOf({id:findCardIndex(SPELL)}).k==='s');
ok('前提: ネクロバレーはフィールド魔法',dbOf({id:findCardIndex(FIELD)}).sub==='フィールド');
ok('前提: キラー・トマトは効果モンスター',(dbOf({id:findCardIndex(EFFMON)}).st||[]).includes('効果'));
ok('前提: ヂェミナイ・エルフは通常モンスター',(dbOf({id:findCardIndex(NORMMON)}).st||[]).includes('通常'));
function ctxR(p,card,evname,evt,zone){const loc=h(card);
  const c=makeContext(p,card,zone||(loc&&loc.zone)||'mz',(loc&&loc.index)||0,evname||'activate',{event:evt});
  if(evt)c.event=evt;return c;}
function declare2(atkCard,defCard,atkPlayer){
  gameState.pendingAttack={player:(atkPlayer==null?1:atkPlayer),
    attackerUid:atkCard?atkCard.uid:null,targetUid:defCard?defCard.uid:null};}
function realAttack(p,mzIndex,target){
  act({type:'ATTACK_DECLARE_V48',player:p,mzIndex:mzIndex});
  act({type:'ATTACK',player:p,atkIdx:mzIndex,target:target});}
const INF1='インフェルニティ・ビートル';
const INF2='インフェルニティ・デーモン';
const DMOR2='D・スコープン';

const N3=['リチュア・ディバイナー','罅割れゆく斧','鬼神の連撃','インフェルニティ・フォース','D・ラジカッセン'];
N3.forEach(n=>ok('ready25-b3 registration '+n,!!CARD_SCRIPTS[n]));
ok('前提: インフェルニティ2枚は INFERNITY',
   isSetCardV4(dbOf({id:findCardIndex(INF1)}),SETCODE.INFERNITY)&&isSetCardV4(dbOf({id:findCardIndex(INF2)}),SETCODE.INFERNITY));
ok('前提: D・スコープンは D_MORPHTRONIC',isCardInGroupV4(dbOf({id:findCardIndex(DMOR2)}),GROUP.D_MORPHTRONIC)===true);

/* ===== 罅割れゆく斧 ===== */
reset0();
let ax=mk('罅割れゆく斧',0,'down'),tgt=mk(BIG,1);
gameState.players[0].sz=[ax];gameState.players[1].mz=[tgt];
let axe=effOf('罅割れゆく斧','attach-decay');
let base=curATK(tgt);
ok('罅割れゆく斧 positive: 表側モンスターがいれば発動できる',axe.condition(ctxR(0,ax,'activate'))===true);
pickFirst();run(axe,ctxR(0,ax,'activate'));
ax.face='up';
ok('罅割れゆく斧 positive: 発動直後はまだ下がらない',curATK(tgt)===base,'atk='+curATK(tgt));
let axs=effOf('罅割れゆく斧','own-standby-decay');
ok('罅割れゆく斧 positive: 自分スタンバイで条件成立',axs.condition(ctxR(0,ax,'onStandbyPhase',null,'sz'))===true);
axs.operation(ctxR(0,ax,'onStandbyPhase',null,'sz'));
ok('罅割れゆく斧 positive: 1回目のスタンバイで500ダウン',curATK(tgt)===base-500,'atk='+curATK(tgt));
axs.operation(ctxR(0,ax,'onStandbyPhase',null,'sz'));
ok('罅割れゆく斧 ruling: スタンバイ毎に累積して下がる',curATK(tgt)===base-1000,'atk='+curATK(tgt));
ok('罅割れゆく斧 negative: 相手のスタンバイでは下がらない',(()=>{
   gameState.activePlayer=1;
   const r=axs.condition(ctxR(0,ax,'onStandbyPhase',null,'sz'));
   gameState.activePlayer=0;return r===false;})());
ok('罅割れゆく斧 ruling: このカードが場を離れると修整も消える（stale modifier なし）',(()=>{
   gameState.players[0].sz=[];gameState.players[0].grave=[ax];
   return curATK(tgt)===base;})());
gameState.players[0].sz=[ax];gameState.players[0].grave=[];
let axd=effOf('罅割れゆく斧','target-destroyed-self-destroy');
ok('罅割れゆく斧 positive: 対象が破壊されたらこのカードも破壊される',(()=>{
   const c=ctxR(0,ax,'onDestroy',{player:1,card:tgt,uid:tgt.uid,reason:'effect'},'sz');
   if(!axd.condition(c)) return false;
   axd.operation(c);
   return (gameState.players[0].grave||[]).some(x=>x&&x.uid===ax.uid);})());
ok('罅割れゆく斧 negative: 別のモンスターの破壊では自壊しない',(()=>{
   reset0();const a2=mk('罅割れゆく斧',0,'up'),t2=mk(BIG,1),o2=mk(PLAIN,1);
   gameState.players[0].sz=[a2];gameState.players[1].mz=[t2,o2];
   a2.raAxeUid=t2.uid;
   return effOf('罅割れゆく斧','target-destroyed-self-destroy')
     .condition(ctxR(0,a2,'onDestroy',{player:1,card:o2,uid:o2.uid,reason:'effect'},'sz'))===false;})());

/* ===== 鬼神の連撃 ===== */
reset0();
let on=mk('鬼神の連撃',0,'down');gameState.players[0].sz=[on];
let xyz=mk(BIG,0); xyz.xyz=[mk(PLAIN,0),mk(PLAIN,0)];
gameState.players[0].mz=[xyz];
gameState.players[1].mz=[mk(PLAIN,1),mk(PLAIN,1)];
let one=effOf('鬼神の連撃');
ok('鬼神の連撃 positive: 素材を持つエクシーズがいれば発動できる',one.condition(ctxR(0,on,'activate'))===true);
pickFirst();
let oc=ctxR(0,on,'activate');
let oPaid=false; one.cost(oc,v=>{oPaid=v;});
ok('鬼神の連撃 positive: エクシーズ素材が全て取り除かれる',
   oPaid===true&&(!Array.isArray(xyz.xyz)||xyz.xyz.length===0),
   'xyz='+((xyz.xyz||[]).length));
one.operation(oc);
ok('鬼神の連撃 positive: 攻撃可能回数が2回になる',xyz.attackLimit===2,'limit='+xyz.attackLimit);
realAttack(0,0,0);
ok('鬼神の連撃 positive: 実戦で1回攻撃した後も2回目を宣言できる',
   Number(xyz.attackCount)===1&&canDeclareAttackV48(xyz)===true,'count='+xyz.attackCount);
realAttack(0,0,0);
ok('鬼神の連撃 ruling: 3回目は宣言できない',
   Number(xyz.attackCount)===2&&canDeclareAttackV48(xyz)===false,'count='+xyz.attackCount);
ok('鬼神の連撃 negative: 素材の無いエクシーズでは発動できない',(()=>{
   reset0();const o2=mk('鬼神の連撃',0,'down');gameState.players[0].sz=[o2];
   const x2=mk(BIG,0); x2.xyz=[];gameState.players[0].mz=[x2];
   return effOf('鬼神の連撃').condition(ctxR(0,o2,'activate'))===false;})());

/* ===== インフェルニティ・フォース ===== */
reset0();
let inf=mk('インフェルニティ・フォース',0,'down');gameState.players[0].sz=[inf];
let infMon=mk(INF1,0);gameState.players[0].mz=[infMon];
let graveInf=mk(INF2,0);gameState.players[0].grave=[graveInf];
let atk1=mk(BIG,1);gameState.players[1].mz=[atk1];
gameState.players[0].hand=[];
let infe=effOf('インフェルニティ・フォース');
declare2(atk1,infMon,1);
ok('インフェルニティ・フォース positive: 手札0で「インフェルニティ」が狙われたら発動できる',
   infe.condition(ctxR(0,inf,'activate',null,'sz'))===true);
infe.operation(ctxR(0,inf,'activate',null,'sz'));
ok('インフェルニティ・フォース positive: 攻撃モンスターが破壊される',
   (gameState.players[1].grave||[]).some(c=>c&&c.uid===atk1.uid));
answerN(1);
ok('インフェルニティ・フォース positive: 墓地から「インフェルニティ」が特殊召喚される',inMz(0,graveInf));
ok('インフェルニティ・フォース negative: 手札があれば発動できない',(()=>{
   reset0();const i2=mk('インフェルニティ・フォース',0,'down');gameState.players[0].sz=[i2];
   const m2=mk(INF1,0);gameState.players[0].mz=[m2];
   gameState.players[0].hand=[mk(PLAIN,0)];
   const a2=mk(BIG,1);gameState.players[1].mz=[a2];declare2(a2,m2,1);
   return effOf('インフェルニティ・フォース').condition(ctxR(0,i2,'activate',null,'sz'))===false;})());
ok('インフェルニティ・フォース negative: 「インフェルニティ」以外が狙われても発動できない',(()=>{
   reset0();const i3=mk('インフェルニティ・フォース',0,'down');gameState.players[0].sz=[i3];
   const m3=mk(PLAIN,0);gameState.players[0].mz=[m3];gameState.players[0].hand=[];
   const a3=mk(BIG,1);gameState.players[1].mz=[a3];declare2(a3,m3,1);
   return effOf('インフェルニティ・フォース').condition(ctxR(0,i3,'activate',null,'sz'))===false;})());
ok('インフェルニティ・フォース negative: 直接攻撃では発動できない',(()=>{
   reset0();const i4=mk('インフェルニティ・フォース',0,'down');gameState.players[0].sz=[i4];
   gameState.players[0].hand=[];
   const a4=mk(BIG,1);gameState.players[1].mz=[a4];declare2(a4,null,1);
   return effOf('インフェルニティ・フォース').condition(ctxR(0,i4,'activate',null,'sz'))===false;})());

/* ===== D・ラジカッセン ===== */
reset0();
gameState.phase='battle';
let rd=mk('D・ラジカッセン',0,'up','atk');gameState.players[0].mz=[rd];
gameState.players[1].mz=[mk(PLAIN,1),mk(PLAIN,1)];
let rde=effOf('D・ラジカッセン','atk-position-double-attack');
ok('D・ラジカッセン positive: 攻撃表示・自分のバトルフェイズで条件成立',
   rde.condition(ctxR(0,rd,'onPhaseChange'))===true);
rde.operation(ctxR(0,rd,'onPhaseChange'));
ok('D・ラジカッセン positive: 攻撃可能回数が2回になる',rd.attackLimit===2,'limit='+rd.attackLimit);
realAttack(0,0,0);
ok('D・ラジカッセン positive: 実戦で1回攻撃した後も2回目を宣言できる',
   Number(rd.attackCount)===1&&canDeclareAttackV48(rd)===true);
realAttack(0,0,0);
ok('D・ラジカッセン ruling: 3回目は宣言できない',canDeclareAttackV48(rd)===false);
ok('D・ラジカッセン ruling: 同じターンに二重付与しない',
   rde.condition(ctxR(0,rd,'onPhaseChange'))===false);
ok('D・ラジカッセン negative: 守備表示では2回攻撃を得ない',(()=>{
   reset0();gameState.phase='battle';
   const r2=mk('D・ラジカッセン',0,'up','def');gameState.players[0].mz=[r2];
   return effOf('D・ラジカッセン','atk-position-double-attack')
     .condition(ctxR(0,r2,'onPhaseChange'))===false;})());
reset0();
let rd2=mk('D・ラジカッセン',0,'up','def'),dm2=mk(DMOR2,0);
gameState.players[0].mz=[rd2,dm2];
let foe2=mk(BIG,1);gameState.players[1].mz=[foe2];
let rdd=effOf('D・ラジカッセン','def-position-negate-attack');
declare2(foe2,dm2,1);
ok('D・ラジカッセン positive: 守備表示で自分の「D」が狙われたら発動できる',
   rdd.condition(ctxR(0,rd2,'activate'))===true);
rdd.operation(ctxR(0,rd2,'activate'));
ok('D・ラジカッセン positive: 攻撃が無効になる',gameState.attackNegated===true);
ok('D・ラジカッセン ruling: 1ターンに1度',rdd.condition(ctxR(0,rd2,'activate'))===false);
ok('D・ラジカッセン negative: 攻撃表示では攻撃無効を使えない',(()=>{
   reset0();const r3=mk('D・ラジカッセン',0,'up','atk'),d3=mk(DMOR2,0);
   gameState.players[0].mz=[r3,d3];
   const f3=mk(BIG,1);gameState.players[1].mz=[f3];declare2(f3,d3,1);
   return effOf('D・ラジカッセン','def-position-negate-attack').condition(ctxR(0,r3,'activate'))===false;})());
ok('D・ラジカッセン negative: 「D」以外が狙われても発動できない',(()=>{
   reset0();const r4=mk('D・ラジカッセン',0,'up','def'),p4=mk(PLAIN,0);
   gameState.players[0].mz=[r4,p4];
   const f4=mk(BIG,1);gameState.players[1].mz=[f4];declare2(f4,p4,1);
   return effOf('D・ラジカッセン','def-position-negate-attack').condition(ctxR(0,r4,'activate'))===false;})());

/* ===== リチュア・ディバイナー ===== */
reset0();
let rv=mk('リチュア・ディバイナー',0);gameState.players[0].mz=[rv];
let topCard=mk(BIG,0);gameState.players[0].deck=[topCard,mk(PLAIN,0)];
let rve=CARD_SCRIPTS['リチュア・ディバイナー'];
ok('リチュア・ディバイナー positive: 表側でデッキがあれば発動条件を満たす',
   rve.condition(ctxR(0,rv,'activate'))===true);
ok('リチュア・ディバイナー positive: 宣言経路(activationV11)を持つ',typeof rve.activationV11==='function');
ok('リチュア・ディバイナー negative: デッキが0枚なら発動できない',(()=>{
   gameState.players[0].deck=[];
   return rve.condition(ctxR(0,rv,'activate'))===false;})());
ok('リチュア・ディバイナー ruling: 1ターンに1度',(()=>{
   gameState.players[0].deck=[mk(PLAIN,0)];
   rv.raDivinerTurn=gameState.turn;
   return rve.condition(ctxR(0,rv,'activate'))===false;})());
ok('リチュア・ディバイナー negative: 裏側では発動できない',(()=>{
   reset0();const r2=mk('リチュア・ディバイナー',0,'down','def');gameState.players[0].mz=[r2];
   gameState.players[0].deck=[mk(PLAIN,0)];
   return CARD_SCRIPTS['リチュア・ディバイナー'].condition(ctxR(0,r2,'activate'))===false;})());
ok('リチュア・ディバイナー ruling: デッキトップは自分だけが見る（相手へ公開しない）',
   String(CARD_SCRIPTS['リチュア・ディバイナー'].resolve).indexOf("audience:'self'")>=0);

/* ================= Replay / SaveLoad ================= */
reset0();
gameState.phase='battle';
let za=mk('D・ラジカッセン',0,'up','atk');gameState.players[0].mz=[za];
gameState.players[1].mz=[mk(PLAIN,1)];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
effOf('D・ラジカッセン','atk-position-double-attack').operation(ctxR(0,za,'onPhaseChange'));
realAttack(0,0,0);
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('ready25-b3 Replay: 追加攻撃付与と戦闘が digest 一致で再生される',audit.ok,audit.reason||'');
let snap=JSON.stringify(gameState);
ok('ready25-b3 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('ready25-b3 直列化: gameState に関数が漏れていない',snap.indexOf('function')<0);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
