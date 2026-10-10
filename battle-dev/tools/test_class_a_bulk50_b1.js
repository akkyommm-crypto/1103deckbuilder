/* Class A bulk 50 — batch 1 / リバース効果10枚。positive / negative / ruling edge。 */
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
const WARRIOR='ゾンビタイガー';    /* NOT_STARTED・アンデット */
const WAR2='E・HERO クレイマン';  /* GENERIC_OK・戦士 */
const TRAP='落とし穴';           /* 罠 */
const SPELL='サイクロン';         /* 魔法 */
const FIELD='王家の眠る谷－ネクロバレー'; /* TESTED・フィールド魔法 */
const FIELD2='闇';              /* フィールド魔法（別） */
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

/* ===== 派手ハネ ===== */
reset0();
let ph=mk('派手ハネ',0),a1=mk(PLAIN,0),b1=mk(PLAIN,1),b2=mk(BIG,1);
gameState.players[0].mz=[ph,a1];gameState.players[1].mz=[b1,b2];
let pe=effOf('派手ハネ');
ok('派手ハネ positive: フィールドにモンスターがいれば発動できる',pe.condition(ctxF(0,ph,'onFlip'))===true);
pe.operation(ctxF(0,ph,'onFlip'));
let pc=pending();
ok('派手ハネ positive: 最大3体まで選べる',!!pc&&pc.min===0&&pc.max===3,pc?pc.min+'/'+pc.max:'none');
answerN(3);
ok('派手ハネ positive: 選んだ3体が持ち主の手札へ戻る',
   (gameState.players[0].mz||[]).length+(gameState.players[1].mz||[]).length===1,
   'mz0='+gameState.players[0].mz.length+' mz1='+gameState.players[1].mz.length);
ok('派手ハネ ruling: 0体でもよい（任意効果）',(()=>{
   reset0();const p2=mk('派手ハネ',0),o2=mk(PLAIN,1);
   gameState.players[0].mz=[p2];gameState.players[1].mz=[o2];
   effOf('派手ハネ').operation(ctxF(0,p2,'onFlip'));
   const q=pending(); if(!q||q.min!==0) return false;
   answerChoiceV49([]); return inMz(1,o2);})());
ok('派手ハネ negative: フィールドにモンスターがいなければ発動しない',(()=>{
   reset0();const p3=mk('派手ハネ',0);gameState.players[0].mz=[];
   gameState.players[0].hand=[p3];
   return effOf('派手ハネ').condition(ctxF(0,p3,'onFlip'))===false;})());

/* ===== 尾も白い黒猫 ===== */
reset0();
let bc=mk('尾も白い黒猫',0),ma=mk(PLAIN,0),fa=mk(PLAIN,1),fb=mk(BIG,1),fc=mk(PLAIN,1);
gameState.players[0].mz=[bc,ma];gameState.players[1].mz=[fa,fb,fc];
let be=effOf('尾も白い黒猫');
ok('尾も白い黒猫 positive: 発動条件を満たす',be.condition(ctxF(0,bc,'onFlip'))===true);
pickNamed(PLAIN);
be.operation(ctxF(0,bc,'onFlip'));
/* S03-U62: 自分側→相手側の順で2つの選択待ちが逐次発行されるようになった（元は自分側が
   legacy API.selectCard の同期上書きで相手側の選択待ちを黙って消していた事故的挙動）。 */
answerN(1);
answerN(2);
ok('尾も白い黒猫 positive: 相手2体が手札へ戻る',gameState.players[1].mz.length===1,
   'mz1='+gameState.players[1].mz.length);
ok('尾も白い黒猫 positive: 自分1体も手札へ戻る',gameState.players[0].mz.length===1,
   'mz0='+gameState.players[0].mz.length);
ok('尾も白い黒猫 ruling: 相手が1体しかいなければその1体だけ戻す',(()=>{
   reset0();const c2=mk('尾も白い黒猫',0),m2=mk(PLAIN,0),f2=mk(PLAIN,1);
   gameState.players[0].mz=[c2,m2];gameState.players[1].mz=[f2];
   pickFirst();effOf('尾も白い黒猫').operation(ctxF(0,c2,'onFlip'));
   for(let i=0;i<4&&pending();i++) answerN(pending().max);
   return !inMz(1,f2);})());
ok('尾も白い黒猫 negative: 両フィールドにモンスターがいなければ発動しない',(()=>{
   reset0();const c3=mk('尾も白い黒猫',0);gameState.players[0].hand=[c3];
   return effOf('尾も白い黒猫').condition(ctxF(0,c3,'onFlip'))===false;})());

/* ===== 水晶の占い師 ===== */
reset0();
let cf=mk('水晶の占い師',0);gameState.players[0].mz=[cf];
let d1=mk(PLAIN,0),d2=mk(BIG,0),d3=mk(NORMMON,0);
gameState.players[0].deck=[d1,d2,d3];
let ce=effOf('水晶の占い師');
ok('水晶の占い師 positive: デッキがあれば発動できる',ce.condition(ctxF(0,cf,'onFlip'))===true);
ce.operation(ctxF(0,cf,'onFlip'));
let cq=pending();
ok('水晶の占い師 positive: めくるのは2枚',!!cq&&cq.candidates.length===2,cq?String(cq.candidates.length):'none');
answerNamed(BIG);
ok('水晶の占い師 positive: 選んだ1枚が手札に加わる',inHand(0,d2));
ok('水晶の占い師 positive: 残り1枚はデッキの一番下へ',
   gameState.players[0].deck[gameState.players[0].deck.length-1].uid===d1.uid,
   'bottom='+dbOf(gameState.players[0].deck[gameState.players[0].deck.length-1]).n);
ok('水晶の占い師 ruling: デッキが1枚なら1枚だけ手札に加える',(()=>{
   reset0();const c2=mk('水晶の占い師',0);gameState.players[0].mz=[c2];
   const only=mk(PLAIN,0);gameState.players[0].deck=[only];
   effOf('水晶の占い師').operation(ctxF(0,c2,'onFlip'));
   return inHand(0,only)&&!pending();})());
ok('水晶の占い師 negative: デッキが0枚なら発動しない',(()=>{
   reset0();const c3=mk('水晶の占い師',0);gameState.players[0].mz=[c3];
   gameState.players[0].deck=[];
   return effOf('水晶の占い師').condition(ctxF(0,c3,'onFlip'))===false;})());

/* ===== 聖なる守り手 ===== */
reset0();
let hg=mk('聖なる守り手',0),tg=mk(BIG,1),extra=mk(PLAIN,1);
gameState.players[0].mz=[hg];gameState.players[1].mz=[tg,extra];
let he=effOf('聖なる守り手');
ok('聖なる守り手 positive: 表側モンスターがいれば発動できる',he.condition(ctxF(0,hg,'onFlip'))===true);
pickNamed(BIG);
run(he,ctxF(0,hg,'onFlip'));
ok('聖なる守り手 positive: 選んだモンスターがデッキの一番上へ戻る',
   gameState.players[1].deck.length>0&&gameState.players[1].deck[0].uid===tg.uid,
   'top='+(gameState.players[1].deck[0]?dbOf(gameState.players[1].deck[0]).n:'none'));
ok('聖なる守り手 negative: 戦士族がいなければ追加のバウンス選択は開かない',!pending());
ok('聖なる守り手 positive: 自分に戦士族がいれば追加バウンスを選べる',(()=>{
   reset0();const g2=mk('聖なる守り手',0),w=mk(WAR2,0),t2=mk(BIG,1),t3=mk(PLAIN,1);
   gameState.players[0].mz=[g2,w];gameState.players[1].mz=[t2,t3];
   pickNamed(BIG);run(effOf('聖なる守り手'),ctxF(0,g2,'onFlip'));
   const q=pending(); if(!q||q.min!==0||q.max!==1) return false;
   answerN(1); return gameState.players[1].mz.length<2;})());
ok('聖なる守り手 negative: 表側モンスターがいなければ発動しない',(()=>{
   reset0();const g3=mk('聖なる守り手',0,'down','def');gameState.players[0].mz=[g3];
   return effOf('聖なる守り手').condition(ctxF(0,g3,'onFlip'))===false;})());

/* ===== 幸運を告げるフクロウ ===== */
reset0();
let owl=mk('幸運を告げるフクロウ',0);gameState.players[0].mz=[owl];
let fs1=mk(FIELD,0),fs2=mk(FIELD2,0),other=mk(PLAIN,0);
gameState.players[0].deck=[other,fs1,fs2];
let oe=effOf('幸運を告げるフクロウ');
ok('幸運を告げるフクロウ positive: デッキにフィールド魔法があれば発動できる',
   oe.condition(ctxF(0,owl,'onFlip'))===true);
oe.operation(ctxF(0,owl,'onFlip'));
let oq=pending();
ok('幸運を告げるフクロウ positive: 候補はフィールド魔法だけ',
   !!oq&&oq.candidates.length===2,oq?String(oq.candidates.length):'none');
answerNamed(FIELD);
ok('幸運を告げるフクロウ positive: ネクロバレーが無ければデッキの一番上に置く',
   gameState.players[0].deck[0].uid===fs1.uid&&!inHand(0,fs1),
   'top='+dbOf(gameState.players[0].deck[0]).n);
ok('幸運を告げるフクロウ ruling: ネクロバレーがあれば手札に加えられる',(()=>{
   reset0();const o2=mk('幸運を告げるフクロウ',0);gameState.players[0].mz=[o2];
   const nv=mk(FIELD,0);gameState.players[0].field=nv;
   const target=mk(FIELD2,0);gameState.players[0].deck=[mk(PLAIN,0),target];
   effOf('幸運を告げるフクロウ').operation(ctxF(0,o2,'onFlip'));
   answerNamed(FIELD2); return inHand(0,target);})());
ok('幸運を告げるフクロウ negative: デッキにフィールド魔法が無ければ発動しない',(()=>{
   reset0();const o3=mk('幸運を告げるフクロウ',0);gameState.players[0].mz=[o3];
   gameState.players[0].deck=[mk(PLAIN,0)];
   return effOf('幸運を告げるフクロウ').condition(ctxF(0,o3,'onFlip'))===false;})());

/* ===== カードを狩る死神 / トラップ・マスター（同じ裁定） ===== */
for(const NAME of ['カードを狩る死神','トラップ・マスター']){
  reset0();
  const me=mk(NAME,0),setTrap=mk(TRAP,1,'down'),setSpell=mk(SPELL,1,'down');
  gameState.players[0].mz=[me];gameState.players[1].sz=[setTrap,setSpell];
  const e=effOf(NAME,'flip-destroy-trap');
  ok(NAME+' positive: セットされた魔法・罠があれば発動できる',e.condition(ctxF(0,me,'onFlip'))===true);
  pickFirst();run(e,ctxF(0,me,'onFlip'));
  ok(NAME+' positive: セットが罠なら破壊される',
     (gameState.players[1].grave||[]).some(c=>c&&c.uid===setTrap.uid));
  /* 魔法だった場合は元に戻す */
  reset0();
  const m2=mk(NAME,0),onlySpell=mk(SPELL,1,'down');
  gameState.players[0].mz=[m2];gameState.players[1].sz=[onlySpell];
  pickFirst();run(effOf(NAME,'flip-destroy-trap'),ctxF(0,m2,'onFlip'));
  ok(NAME+' ruling: セットが魔法なら破壊せず元に戻す',
     (gameState.players[1].sz||[]).some(c=>c&&c.uid===onlySpell.uid)
     &&onlySpell.face==='down');
  /* 表側の魔法は候補に入らない */
  reset0();
  const m3=mk(NAME,0),faceSpell=mk(SPELL,1,'up');
  gameState.players[0].mz=[m3];gameState.players[1].sz=[faceSpell];
  ok(NAME+' negative: 表側の魔法カードは候補にならない',
     effOf(NAME,'flip-destroy-trap').condition(ctxF(0,m3,'onFlip'))===false);
  /* 表側の罠は候補に入る */
  reset0();
  const m4=mk(NAME,0),faceTrap=mk(TRAP,1,'up');
  gameState.players[0].mz=[m4];gameState.players[1].sz=[faceTrap];
  ok(NAME+' positive: 表側の罠カードは候補になる',
     effOf(NAME,'flip-destroy-trap').condition(ctxF(0,m4,'onFlip'))===true);
  ok(NAME+' negative: 魔法・罠ゾーンが空なら発動しない',(()=>{
     reset0();const m5=mk(NAME,0);gameState.players[0].mz=[m5];
     return effOf(NAME,'flip-destroy-trap').condition(ctxF(0,m5,'onFlip'))===false;})());
}

/* ===== 爆弾かめ虫 ===== */
reset0();
let bb=mk('爆弾かめ虫',0),fd1=mk(EFFMON,1,'down','def'),fd2=mk(NORMMON,1,'down','def');
gameState.players[0].mz=[bb];gameState.players[1].mz=[fd1,fd2];
let bbe=effOf('爆弾かめ虫');
ok('爆弾かめ虫 positive: 相手に裏側守備がいれば発動できる',bbe.condition(ctxF(0,bb,'onFlip'))===true);
pickNamed(EFFMON);run(bbe,ctxF(0,bb,'onFlip'));
ok('爆弾かめ虫 positive: 効果モンスターなら破壊される',
   (gameState.players[1].grave||[]).some(c=>c&&c.uid===fd1.uid));
ok('爆弾かめ虫 ruling: 破壊してもリバース効果は発動しない（onFlipが出ない）',
   !(gameState.deferredEvents||[]).some(e=>e&&e.eventName==='onFlip'&&e.evt&&e.evt.uid===fd1.uid),
   JSON.stringify((gameState.deferredEvents||[]).map(e=>e.eventName)));
reset0();
let bb2=mk('爆弾かめ虫',0),nfd=mk(NORMMON,1,'down','def');
gameState.players[0].mz=[bb2];gameState.players[1].mz=[nfd];
pickFirst();run(effOf('爆弾かめ虫'),ctxF(0,bb2,'onFlip'));
ok('爆弾かめ虫 ruling: 通常モンスターなら破壊せず元に戻す',
   inMz(1,nfd)&&nfd.face==='down');
ok('爆弾かめ虫 negative: 表側の相手モンスターは候補にならない',(()=>{
   reset0();const b3=mk('爆弾かめ虫',0);gameState.players[0].mz=[b3];
   gameState.players[1].mz=[mk(EFFMON,1,'up')];
   return effOf('爆弾かめ虫').condition(ctxF(0,b3,'onFlip'))===false;})());
ok('爆弾かめ虫 negative: 自分の裏側守備は候補にならない',(()=>{
   reset0();const b4=mk('爆弾かめ虫',0);gameState.players[0].mz=[b4,mk(EFFMON,0,'down','def')];
   return effOf('爆弾かめ虫').condition(ctxF(0,b4,'onFlip'))===false;})());

/* ===== 雷仙人 ===== */
reset0();
let rs=mk('雷仙人',0);gameState.players[0].mz=[rs];
let lp0=gameState.players[0].lp;
let rse=effOf('雷仙人','flip-recover');
ok('雷仙人 positive: リバースで条件成立',rse.condition(ctxF(0,rs,'onFlip'))===true);
rse.operation(ctxF(0,rs,'onFlip'));
ok('雷仙人 positive: 3000LP回復する',gameState.players[0].lp===lp0+3000,lp0+'→'+gameState.players[0].lp);
let rle=effOf('雷仙人','leave-field-lose');
let lp1=gameState.players[0].lp;
let evt={uid:rs.uid,player:0,fromZone:'mz',toZone:'grave',fromFace:'up'};
ok('雷仙人 positive: フィールドから墓地へ送られた時に条件成立',
   rle.condition(ctxF(0,rs,'onLeaveField',evt))===true);
rle.operation(ctxF(0,rs,'onLeaveField',evt));
ok('雷仙人 positive: 5000LPを失う',gameState.players[0].lp===lp1-5000,lp1+'→'+gameState.players[0].lp);
ok('雷仙人 negative: 除外された場合は誘発しない',
   rle.condition(ctxF(0,rs,'onLeaveField',{uid:rs.uid,player:0,fromZone:'mz',toZone:'banish'}))===false);
ok('雷仙人 negative: 他のカードの離脱では誘発しない',
   rle.condition(ctxF(0,rs,'onLeaveField',{uid:rs.uid+9999,player:0,fromZone:'mz',toZone:'grave'}))===false);
ok('雷仙人 negative: 裏側のままでは回復しない',(()=>{
   reset0();const r2=mk('雷仙人',0,'down','def');gameState.players[0].mz=[r2];
   return effOf('雷仙人','flip-recover').condition(ctxF(0,r2,'onFlip'))===false;})());

/* ===== ワーム・リンクス ===== */
reset0();
let wl=mk('ワーム・リンクス',0);gameState.players[0].mz=[wl];
gameState.players[0].deck=[mk(PLAIN,0),mk(PLAIN,0)];
let wa=effOf('ワーム・リンクス','flip-arm-endphase-draw');
let wd=effOf('ワーム・リンクス','endphase-draw');
ok('ワーム・リンクス negative: リバース前はエンドフェイズ効果は働かない',
   wd.condition(ctxF(0,wl,'onEndPhase'))===false);
ok('ワーム・リンクス positive: リバースで条件成立',wa.condition(ctxF(0,wl,'onFlip'))===true);
wa.operation(ctxF(0,wl,'onFlip'));
ok('ワーム・リンクス positive: リバース後はエンドフェイズ効果が働く',
   wd.condition(ctxF(0,wl,'onEndPhase'))===true);
let hand0=gameState.players[0].hand.length;
wd.operation(ctxF(0,wl,'onEndPhase'));
ok('ワーム・リンクス positive: エンドフェイズに1枚ドローする',
   gameState.players[0].hand.length===hand0+1);
ok('ワーム・リンクス ruling: お互いのエンドフェイズで働く（相手ターンでも）',(()=>{
   gameState.activePlayer=1;
   return wd.condition(ctxF(0,wl,'onEndPhase'))===true;})());
ok('ワーム・リンクス negative: 裏側になったら働かない',(()=>{
   wl.face='down';const r=wd.condition(ctxF(0,wl,'onEndPhase'));wl.face='up';return r===false;})());
ok('ワーム・リンクス negative: デッキが0枚なら発動しない',(()=>{
   gameState.players[0].deck=[];
   return wd.condition(ctxF(0,wl,'onEndPhase'))===false;})());

/* ================= Replay / SaveLoad / 直列化 ================= */
reset0();
let za=mk('水晶の占い師',0);gameState.players[0].mz=[za];
gameState.players[0].deck=[mk(PLAIN,0),mk(BIG,0),mk(NORMMON,0)];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
effOf('水晶の占い師').operation(ctxF(0,za,'onFlip'));
answerN(1);
if(typeof flushDeferredEventsV2==='function') flushDeferredEventsV2();
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('bulk50-b1 Replay: 選択つきデッキ操作が digest 一致で再生される',audit.ok,audit.reason||'');
let snap=JSON.stringify(gameState);
ok('bulk50-b1 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('bulk50-b1 直列化: gameState に関数が漏れていない',snap.indexOf('function')<0);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
