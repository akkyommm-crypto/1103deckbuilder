/* S03-U494: 文言分類の「時代混在」の確認。召喚無効には広げない。
   設計は docs/S03_MISSED_TIMING_DESIGN.md（1 の R8 / R9、3(B-1) / 3(B-2) / 3(B-4)、5-a / 5-b）、
   当時裁定の本文は docs/S03_MISSED_TIMING_RULINGS.md（123 件の機械抽出＋本単位で追加参照した分）。

   本単位の根拠になる当時裁定:
     WIKI-BC4886A97EED  取得 2011-08-30  《魔導戦士 ブレイカー》
       Q:「このカードが反転召喚・特殊召喚に成功した時、魔力カウンターを乗せる誘発効果は発動しますか？」
       A:「いいえ、発動しません。「召喚」とは、「表側攻撃表示または表側守備表示での通常召喚」を指します。」
       → R9。文言は**効果ごと・イベントごと**に読む。
     WIKI-B2BFD8FD6AFC  回答日 2011-03-03  《カオス・インフィニティ》
       Q:「この効果により、《素早いビッグハムスター》をリバースした場合、タイミングを逃さず効果を発動できますか？」
       A:「はい、このカードの効果処理終了後にリバース効果が発動し…」
       （同じ回答日の WIKI-7C5A73CB9786 は、同じカードで**攻撃表示にした**場合は逃すと答えている）
     WIKI-624AAB0A922F  回答日 2008-03-06  《ニードル・ボール》／ WIKI-8CD28D6D58FD  回答日 2010-04-13  《裏ガエル》
       → R8。「リバースした時」のリバース効果は逃さないので flipSummonReverse 種別を無効にした。
     WIKI-A47B4CA77987  回答日 2009-04-09  《バーニング・スカルヘッド》
       Q:「チェーン２以上のタイミングで手札から特殊召喚されたとき、ダメージを与える効果は発動しますか？」
       A:「強制効果のため、発動します。」
       → R1。スクリプトが任意として登録している強制誘発を (B-1) で宣言した（他 5 枚）。

   直したこと（すべて先に実測してから直した）:
     (1) 文言を 1 枚単位でまとめて読んでいた。語を長い語から読み、N/S/F/R に分けてイベントごとに見る。
     (2) flipSummonReverse 種別を無効にした（当時の根拠が逆だった）。
     (3) 当時裁定が「強制」と明言している 6 枚を宣言した。
   確認できなかったものは設計書 5-a に**未確定**として残してある（「正しい」「安全」とは書いていない）。 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S494 = pathA.resolve(__dirname, '..');
const rdS494 = p => fsA.readFileSync(pathA.join(ROOT_S494, p), 'utf8');
const DESIGN_S494 = rdS494('docs/S03_MISSED_TIMING_DESIGN.md');
const RULINGS_S494 = rdS494('docs/S03_MISSED_TIMING_RULINGS.md');
const ENGINE_S494 = rdS494('engine/1ZZX_missed_timing_s03.js');
const ENGINE_1ZB_S494 = rdS494('engine/1ZB_trigger_forced_per_effect_s03.js');

const COMMON = String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function s(){return gameState.procStepS03|0;}
function zu(uid){const h=findCardByUid(uid);return h?h.zone:null;}
function cu(uid){const h=findCardByUid(uid);return h?h.card:null;}
let COLLECT=[], PTS=[], STEPS=[];
const CLAUSEKIND_ORIG_S494=missedTimingClauseKindS03;
const FORCED_ORIG_S494=triggerCandidateForcedS03;
const EVS_S494=['onNormalSummon','onSpecialSummon','onFlip'];
(function(){
  const f=collectHandlers;collectHandlers=function(n,e){const r=f.apply(this,arguments);
    COLLECT.push({ev:n,stamp:(e&&e.stepS03!=null)?e.stepS03:null,now:s(),names:r.map(x=>x.name)});return r;};
  const g=pointResponsesV27;pointResponsesV27=function(p,pl){const r=g.apply(this,arguments);
    PTS.push({kind:pl&&pl.kind,p:p,names:r.map(x=>x.db&&x.db.n)});return r;};
  const h=applyAction;applyAction=function(gs,a){const d=APPLY_ACTION_DEPTH_V31,b=s();
    try{return h.apply(this,arguments);}finally{if(d===0)STEPS.push([(a&&a.type)||'?',b,s()]);}};
})();
function resetVolatile(){EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;
  try{EVT_RESUME_DATA_V484=null;}catch(e){}
  try{CHOICE_LEGACY_CB_V49=new Map();}catch(e){}try{ACTIVATION_PREP_S03=null;}catch(e){}try{RESOLVING_LINK_S03=null;}catch(e){}
  try{PENDING_SUMMON_COMMIT=null;PENDING_SUMMON_CANCEL=null;}catch(e){}try{EVT_CANDS=[];}catch(e){}
  try{PROCESSOR_PUMPING_V27=false;}catch(e){}try{APPLY_ACTION_DEPTH_V31=0;}catch(e){}}
function fresh(){resetA();resetVolatile();COLLECT=[];PTS=[];STEPS=[];resetMissedTimingDropsS03();
  gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4940011;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:14},()=>mk('ワイト',p));}
function step(){
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();return 'evt';}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();return 'summon';}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();return 'chain';}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();return 'point';}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();return 'pump';}
  if((gameState.deferredEvents||[]).length){flushDeferredEventsV2();return 'flush';}
  return null;}
function drive(){for(let i=0;i<900;i++){if(pc()){__choicePickV49(0);continue;}if(!step())return 'idle';}return 'loop';}
function savedRaw(){localStorage.removeItem(DUEL_SAVE_KEY);saveDuel();return localStorage.getItem(DUEL_SAVE_KEY);}
function loadInto(raw){resetA();resetVolatile();COLLECT=[];PTS=[];STEPS=[];resetMissedTimingDropsS03();
  localStorage.setItem(DUEL_SAVE_KEY,raw);return offerResumeDuel();}
function dropNames(){return MISSED_TIMING_DROPS_S03.map(d=>d.name).sort();}
function summonCollect(){return COLLECT.filter(c=>/^on(Normal|Special)Summon$/.test(c.ev)&&c.stamp!=null);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,160));}
/* 候補の全件列挙。カード単位（S03-U493 と同じ形）とイベントごとの組単位の両方を数える。 */
function auditBucketsS494(){
  const B={forced:[],summonNegate:[],decl:[],drop:[],baai:[],none:[]};
  const P={forced:0,negate:0,decl:0,drop:0,baai:0,none:0};
  const notForced=[];
  Object.keys(CARD_SCRIPTS).forEach(nm=>{
    const sc=CARD_SCRIPTS[nm]; if(!sc||!sc.passive) return;
    const evs=EVS_S494.filter(e=>typeof sc.passive[e]==='function');
    if(!evs.length) return;
    const effs=(sc.v4Unified&&typeof nativeEffectsV4==='function')?(nativeEffectsV4(nm)||[]):[];
    const statForced=!!sc.forced||typeof sc.forcedForEventS03==='function'||effs.some(e=>e&&e.forced===true);
    const perForced=ev=>{
      if(sc.forced) return true;
      const hit=effs.filter(e=>e&&Array.isArray(e.events)&&e.events.indexOf(ev)>=0);
      if(hit.length) return hit.some(e=>e.forced===true);
      if(typeof sc.forcedForEventS03==='function'){ try{ return !!sc.forcedForEventS03(ev,null); }catch(e){ return false; } }
      return false;
    };
    evs.forEach(ev=>{
      if(perForced(ev)){P.forced++;return;}
      if(sc.summonNegate){P.negate++;return;}
      if(missedTimingModeS03(nm)==='never'){P.decl++;return;}
      if(missedTimingClassS03({name:nm,eventName:ev},{flipSummon:true})){P.drop++;return;}
      const k=missedTimingTextKindS03(nm);
      const key=(ev==='onNormalSummon')?'n':(ev==='onSpecialSummon'?'s':'f');
      if(k[key]==='baai'||(ev==='onFlip'&&k.r==='baai')){P.baai++;return;}
      P.none++;
    });
    if(statForced && !evs.some(perForced)) notForced.push(nm);
    if(statForced){B.forced.push(nm);return;}
    if(sc.summonNegate){B.summonNegate.push(nm);return;}
    if(missedTimingModeS03(nm)==='never'){B.decl.push(nm);return;}
    const cls=evs.map(e=>missedTimingClassS03({name:nm,eventName:e},{flipSummon:true})).filter(Boolean);
    if(cls.length){B.drop.push(nm);return;}
    const k=missedTimingTextKindS03(nm);
    if(k.n==='baai'||k.s==='baai'||k.f==='baai'||k.r==='baai'){B.baai.push(nm);return;}
    B.none.push(nm);
  });
  return {B,P,notForced:notForced.sort()};
}
/* --- 盤面1（WIKI-9FC5B41EDCF4 と同じ形）---
   p0 が《ゴブリンドバーグ》を通常召喚し、その誘発で手札のレベル4以下のモンスターを特殊召喚してから
   自身が守備表示になる。特殊召喚されたカードの召喚誘発は刻みがずれる。 */
function gobBoard(second){
  fresh();
  const gob=mk('ゴブリンドバーグ',0), sec=mk(second,0);
  gameState.players[0].hand=[gob,sec];
  baselineA();
  return {gob:gob.uid, sec:sec.uid};
}
/* --- 盤面2 --- p0 の sz[0]=《血の代償》（表側）、sz[1]=チェーン1で発動するカード。
   《血の代償》をチェーン2として積み、手札のモンスターを通常召喚する。 */
function bloodBoard(o){
  fresh();
  gameState.players[0].sz=[mk('血の代償',0,'up')];
  if(o.chain1){const e=mk(o.chain1,0,'down');e.setTurn=gameState.turn-1;gameState.players[0].sz.push(e);}
  const mon=mk(o.summon,0);
  gameState.players[0].hand=[mon];
  (o.hand||[]).forEach(n=>gameState.players[0].hand.push(mk(n,0)));
  baselineA();
  return {mon:mon.uid};
}
function stackTwo(zone,index){
  duelActivateFromZone(0,zone,index);
  let g=0;while(pc()&&(gameState.chain||[]).length<1&&g++<8)__choicePickV49(0);
  const r=(getChainResponsesV2(0)||[]).find(x=>x.db.n==='血の代償');
  if(r) duelActivateResponseV2(0,r.zone,r.index);
  g=0;while(pc()&&(gameState.chain||[]).length<2&&g++<8)__choicePickV49(0);
  return (gameState.chain||[]).length;
}
const R8_CARDS_S494=['スノーマンイーター','ペンギン・ナイトメア','不死王リッチー','渋い忍者','裏ガエル',
  '電池メン－単四型','魔轟神獣ペガラサス'].sort();
const FLIP_SUMMON_SUCCESS_S494=['スカラベの大群','メデューサ・ワーム','ガーディアン・スタチュー','イナゴの軍勢'];
const DECL_S494=['サイコ・エンペラー','スノーマンイーター','バーニング・スカルヘッド','リチュア・チェイン',
  '炎帝近衛兵','素早いビッグハムスター','運命のドラ'].sort();
`;

/* ===== A. テキスト層の時代混在と、召喚語の読み取り（条件1・条件4） ===== */
harness(COMMON + String.raw`
resetA();
/* 候補 518 件のテキストで、時代の違う表記を数える */
const texts=[];
Object.keys(CARD_SCRIPTS).forEach(nm=>{
  const sc=CARD_SCRIPTS[nm]; if(!sc||!sc.passive) return;
  if(!EVS_S494.some(e=>typeof sc.passive[e]==='function')) return;
  const i=findCardIndex(nm); if(i>=0&&CARD_DB[i]) texts.push(String(CARD_DB[i].e||''));
});
const count=w=>texts.reduce((a,t)=>{let n=0,k=0;for(;;){const j=t.indexOf(w,k);if(j<0)break;n++;k=j+1;}return a+n;},0);
ok('A1 ★ 候補 518 件のテキストに、時代の違う召喚語が共存している（S召喚 17 / 生け贄召喚 6 / アドバンス召喚 32）',
   texts.length===518 && count('S召喚')===17 && count('生け贄召喚')===6 && count('アドバンス召喚')===32,
   JSON.stringify({texts:texts.length,S:count('S召喚'),ikenie:count('生け贄召喚'),adv:count('アドバンス召喚')}));
ok('A2 ★ 召喚語は長い語から読む — 「特殊召喚に成功した時」は通常召喚（N）として読まれない',
   missedTimingClauseKindS03('アルカナフォースEX－THE LIGHT RULER','S')==='toki'
   && missedTimingClauseKindS03('アルカナフォースEX－THE LIGHT RULER','N')===null
   && missedTimingClausesS03('このカードが特殊召喚に成功した時').length===1
   && JSON.stringify(missedTimingClausesS03('このカードが特殊召喚に成功した時')[0].cls)===JSON.stringify(['S']),
   JSON.stringify(missedTimingTextKindS03('アルカナフォースEX－THE LIGHT RULER')));
ok('A3 ★ 「S召喚」は 2011 当時の「シンクロ召喚」の略記なので特殊召喚（S）として読む',
   missedTimingClauseKindS03('氷結界の龍 トリシューラ','S')==='toki'
   && missedTimingClauseKindS03('氷結界の龍 トリシューラ','N')===null
   && missedTimingClauseKindS03('フォーミュラ・シンクロン','S')==='toki'
   && missedTimingClauseKindS03('フォーミュラ・シンクロン','N')===null,
   JSON.stringify(missedTimingTextKindS03('氷結界の龍 トリシューラ')));
ok('A4 ★ 「生け贄召喚」「アドバンス召喚」「通常召喚」は通常召喚（N）',
   missedTimingClauseKindS03('マキシマム・シックス','N')==='toki'
   && missedTimingClauseKindS03('インヴェルズ・モース','N')==='toki'
   && missedTimingClauseKindS03('インヴェルズ・モース','S')===null,
   JSON.stringify({six:missedTimingTextKindS03('マキシマム・シックス'),morse:missedTimingTextKindS03('インヴェルズ・モース')}));
ok('A5 ★ 「・」で連なる語をすべて読む（《奈落の落とし穴》= 召喚・反転召喚・特殊召喚、《電池メン－単四型》= 召喚・リバース）',
   JSON.stringify(missedTimingTextKindS03('奈落の落とし穴'))===JSON.stringify({n:'toki',s:'toki',f:'toki',r:null})
   && JSON.stringify(missedTimingTextKindS03('電池メン－単四型'))===JSON.stringify({n:'toki',s:null,f:null,r:'toki'}),
   JSON.stringify({abyss:missedTimingTextKindS03('奈落の落とし穴'),bat:missedTimingTextKindS03('電池メン－単四型')}));
ok('A6 ★ 旧「リバース:」表記のように句が無いテキストは null（＝判定しない）',
   JSON.stringify(missedTimingTextKindS03('ニードルワーム'))===JSON.stringify({n:null,s:null,f:null,r:null})
   && missedTimingTextClausesS03('ニードルワーム').length===0
   && JSON.stringify(missedTimingTextKindS03('ペンギン・ソルジャー'))===JSON.stringify({n:null,s:null,f:null,r:null}),
   JSON.stringify(missedTimingTextKindS03('ニードルワーム')));
ok('A7 ★ 同じ種類に「時」と「場合」が混在すれば baai（逃さない側）に寄せる',
   missedTimingClauseKindS03('魔導戦士 ブレイカー','N')==='baai'
   && JSON.stringify(missedTimingClausesS03('このカードが召喚に成功した時。このカードが召喚に成功した場合')
        .map(c=>c.cls.join('')+c.kind))===JSON.stringify(['N時','N場合'])
   && missedTimingClauseKindS03('茫漠の死者','N')==='baai',
   JSON.stringify(missedTimingTextKindS03('魔導戦士 ブレイカー')));
`, {expect:7});

/* ===== B. R9 ─ 文言を効果ごと・イベントごとに読む（条件2） ===== */
harness('const DOC=' + JSON.stringify(DESIGN_S494) + ';const ENG=' + JSON.stringify(ENGINE_S494) + ';'
      + 'const RUL=' + JSON.stringify(RULINGS_S494) + ';' + COMMON + String.raw`
resetA();
gameState.procStepS03=9;
const cand=(nm,ev)=>({name:nm,eventName:ev,ctx:null,event:{flipSummon:true}});
ok('B1 ★ 特殊召喚の句しか持たないカードは、通常召喚・反転召喚のイベントでは種別に入らない（R9）',
   missedTimingClassS03(cand('アルカナフォースEX－THE LIGHT RULER','onSpecialSummon'),{})==='summonSuccess'
   && missedTimingClassS03(cand('アルカナフォースEX－THE LIGHT RULER','onNormalSummon'),{})===null
   && missedTimingClassS03(cand('アルカナフォースEX－THE LIGHT RULER','onFlip'),{flipSummon:true})===null,'');
ok('B2 ★ R9 の根拠（WIKI-BC4886A97EED）が engine・設計書・裁定の抽出すべてに書かれている',
   ENG.indexOf('WIKI-BC4886A97EED')>=0 && DOC.indexOf('WIKI-BC4886A97EED')>=0
   && RUL.indexOf('WIKI-BC4886A97EED')>=0
   && RUL.indexOf('表側攻撃表示または表側守備表示での通常召喚')>=0,'');
ok('B3 ★ イベントの種類とイベントに対応する句の両方を要求する（どちらか一方では落とさない）',
   missedTimingClassS03(cand('奈落の落とし穴','onNormalSummon'),{})==='summonSuccess'
   && missedTimingClassS03(cand('奈落の落とし穴','onDestroy'),{})===null
   && missedTimingClassS03(cand('ニードルワーム','onFlip'),{flipSummon:true})===null
   && missedTimingClassS03(cand('魔導戦士 ブレイカー','onNormalSummon'),{})===null,'');
let U=bloodBoard({chain1:'成金ゴブリン', summon:'魔導戦士 ブレイカー'});
let links=stackTwo('sz',1);
drive();
ok('B4 ★ 「場合」の《魔導戦士 ブレイカー》は逃さず魔力カウンターを置く（R7）。当時の文言は「時」だが強制なので結果は同じ',
   links===2 && summonCollect().length===1 && summonCollect()[0].stamp<summonCollect()[0].now
   && dropNames().length===0 && (cu(U.mon).counters||{})['魔力']===1
   && DOC.indexOf('WIKI-A9967954DFF2')>=0 && DOC.indexOf('結果は変わらない')>=0,
   JSON.stringify({links,drops:dropNames(),counters:cu(U.mon).counters}));
missedTimingClauseKindS03=function(){return 'toki';};
U=bloodBoard({chain1:'成金ゴブリン', summon:'魔導戦士 ブレイカー'});
stackTwo('sz',1);
drive();
ok('B5 ★ negative control: 文言の判定を外すと「場合」の《魔導戦士 ブレイカー》まで落ちてカウンターが置かれない',
   JSON.stringify(dropNames())===JSON.stringify(['魔導戦士 ブレイカー'])
   && !(((cu(U.mon)||{}).counters||{})['魔力']),
   JSON.stringify({drops:dropNames(),counters:(cu(U.mon)||{}).counters}));
missedTimingClauseKindS03=CLAUSEKIND_ORIG_S494;
`, {expect:5});

/* ===== C. R8 ─ 「リバースした時」のリバース効果は逃さない（条件1・条件3） ===== */
harness('const DOC=' + JSON.stringify(DESIGN_S494) + ';const ENG=' + JSON.stringify(ENGINE_S494) + ';'
      + 'const RUL=' + JSON.stringify(RULINGS_S494) + ';' + COMMON + String.raw`
resetA();
gameState.procStepS03=9;
const cand=nm=>({name:nm,eventName:'onFlip',ctx:null,event:{flipSummon:true}});
ok('C1 ★ flipSummonReverse 種別は無効。「リバースした時」だけの 7 枚は反転召喚でも落とさない',
   MISSED_TIMING_CLASSES_S03.flipSummonReverse===false
   && R8_CARDS_S494.every(nm=>missedTimingClassS03(cand(nm),{flipSummon:true})===null)
   && R8_CARDS_S494.every(nm=>missedTimingDropS03(cand(nm),{stepS03:3,flipSummon:true})===false)
   && R8_CARDS_S494.every(nm=>missedTimingClauseKindS03(nm,'R')==='toki')
   && R8_CARDS_S494.every(nm=>missedTimingTextKindS03(nm).r==='toki'),
   JSON.stringify(R8_CARDS_S494.map(nm=>[nm,missedTimingClassS03(cand(nm),{flipSummon:true})])));
ok('C2 ★ R8 の根拠 3 件が engine・設計書・裁定の抽出に書かれている',
   ['WIKI-B2BFD8FD6AFC','WIKI-624AAB0A922F','WIKI-8CD28D6D58FD'].every(id=>
     ENG.indexOf(id)>=0 && DOC.indexOf(id)>=0 && RUL.indexOf(id)>=0)
   && RUL.indexOf('一連の効果処理後、このカードのリバース効果が発動します')>=0
   && DOC.indexOf('WIKI-7C5A73CB9786')>=0,'');
MISSED_TIMING_CLASSES_S03.flipSummonReverse=true;
const backCls=R8_CARDS_S494.filter(nm=>missedTimingClassS03(cand(nm),{flipSummon:true})==='flipSummonReverse');
const backDrop=R8_CARDS_S494.filter(nm=>missedTimingDropS03(cand(nm),{stepS03:3,flipSummon:true})===true);
MISSED_TIMING_CLASSES_S03.flipSummonReverse=false;
ok('C3 ★ negative control: 種別を戻すと 7 枚とも flipSummonReverse に入り、宣言の無い 6 枚は刻みがずれると落ちる（S03-U493 の挙動）',
   JSON.stringify(backCls.slice().sort())===JSON.stringify(R8_CARDS_S494)
   && JSON.stringify(backDrop.slice().sort())===JSON.stringify(R8_CARDS_S494.filter(nm=>nm!=='スノーマンイーター'))
   && missedTimingModeS03('スノーマンイーター')==='never'
   && R8_CARDS_S494.every(nm=>missedTimingDropS03(cand(nm),{stepS03:3,flipSummon:true})===false),
   JSON.stringify({backCls,backDrop}));
/* 実経路の反転召喚。刻みが動かないので、種別を戻しても実際には落ちない。 */
fresh();
const nin=mk('渋い忍者',0,'down','def');nin.setTurn=gameState.turn-1;
gameState.players[0].mz=[nin];
gameState.players[0].hand=[mk('カゲトカゲ',0)];
baselineA();
doFlipUp(0,'mz',0,'atk');
drive();
const fl=COLLECT.filter(c=>c.ev==='onFlip'&&c.stamp!=null);
ok('C4 ★ 測った反転召喚の経路では刻みが動かない（stamp===now）ので、この種別はこの経路では落としていない',
   fl.length===1 && fl[0].stamp===fl[0].now && dropNames().length===0
   && STEPS.filter(x=>x[1]!==x[2]).length===1,
   JSON.stringify({flip:fl.map(c=>[c.stamp,c.now]),steps:STEPS.filter(x=>x[1]!==x[2])}));
resetA();
gameState.procStepS03=9;
ok('C5 ★ 「反転召喚に成功した時」の 4 枚は召喚成功として残る（R8 の対象ではない）',
   FLIP_SUMMON_SUCCESS_S494.every(nm=>missedTimingClassS03(cand(nm),{flipSummon:true})==='summonSuccess')
   && FLIP_SUMMON_SUCCESS_S494.every(nm=>missedTimingClassS03(cand(nm),{})===null)
   && FLIP_SUMMON_SUCCESS_S494.every(nm=>missedTimingTextKindS03(nm).f==='toki'),'');
ok('C6 ★ 効果で表側にされた場合も落とさない（S03-U493 の未対応 #2 は規則として解消した）',
   missedTimingClassS03({name:'スノーマンイーター',eventName:'onFlip',ctx:null,event:{}},{})===null
   && missedTimingClassS03({name:'裏ガエル',eventName:'onFlip',ctx:null,event:{}},{})===null
   && DOC.indexOf('規則として解消')>=0,'');
`, {expect:6});

/* ===== D. R1 ─ 当時裁定が「強制」と明言しているカードの宣言（条件1・条件3） ===== */
harness('const DOC=' + JSON.stringify(DESIGN_S494) + ';const RUL=' + JSON.stringify(RULINGS_S494) + ';'
      + COMMON + String.raw`
let U=gobBoard('バーニング・スカルヘッド');
doNormalSummon(0,'atk');
drive();
const sc=summonCollect().filter(c=>c.ev==='onSpecialSummon');
ok('D1 前提: 特殊召喚の後に「守備表示になる」処理が入り、刻みがずれている（WIKI-9FC5B41EDCF4 と同じ形）',
   sc.length===1 && sc[0].stamp===2 && sc[0].now===3
   && STEPS.some(x=>x[0]==='FX_SET_STATE'&&x[1]===2&&x[2]===3),
   JSON.stringify({collect:sc.map(c=>[c.stamp,c.now]),steps:STEPS.filter(x=>x[1]!==x[2])}));
ok('D2 ★ 当時裁定どおり、強制誘発の《バーニング・スカルヘッド》は逃さず 1000 ダメージを与える（WIKI-A47B4CA77987）',
   dropNames().length===0 && zu(U.sec)==='mz' && gameState.players[1].lp===7000
   && RUL.indexOf('強制効果のため、発動します')>=0,
   JSON.stringify({drops:dropNames(),sec:zu(U.sec),lp:gameState.players[1].lp}));
audit('D2');
delete MISSED_TIMING_DECL_S03['バーニング・スカルヘッド'];
U=gobBoard('バーニング・スカルヘッド');
doNormalSummon(0,'atk');
drive();
ok('D3 ★ negative control: 宣言を外すと同じ盤面で落ち、ダメージが入らない',
   JSON.stringify(dropNames())===JSON.stringify(['バーニング・スカルヘッド'])
   && gameState.players[1].lp===8000 && zu(U.sec)==='mz',
   JSON.stringify({drops:dropNames(),lp:gameState.players[1].lp}));
MISSED_TIMING_DECL_S03['バーニング・スカルヘッド']={mode:'never',ruling:'WIKI-A47B4CA77987',reason:'R1 強制（本機構と同じ場面）'};
ok('D4 ★ 宣言表は 7 件すべて never で、裁定 ID が付いている',
   JSON.stringify(Object.keys(MISSED_TIMING_DECL_S03).sort())===JSON.stringify(DECL_S494)
   && Object.keys(MISSED_TIMING_DECL_S03).every(k=>MISSED_TIMING_DECL_S03[k].mode==='never'
        && /^(WIKI|R1103)-/.test(MISSED_TIMING_DECL_S03[k].ruling||''))
   && DECL_S494.every(nm=>RUL.indexOf(MISSED_TIMING_DECL_S03[nm].ruling)>=0)
   && DECL_S494.every(nm=>DOC.indexOf(MISSED_TIMING_DECL_S03[nm].ruling)>=0),
   JSON.stringify(Object.keys(MISSED_TIMING_DECL_S03)));
resetA();
gameState.procStepS03=9;
ok('D5 ★ 宣言した 7 枚は、刻みがずれた候補でもイベントを問わず落とさない',
   DECL_S494.every(nm=>EVS_S494.every(ev=>
     missedTimingDropS03({name:nm,eventName:ev,ctx:null,event:{flipSummon:true}},{stepS03:3,flipSummon:true})===false)),'');
ok('D6 ★ R5（任意でも例外的に逃さない）の宣言は今も 0 件 — 例外 3 枚は召喚成功の候補に入っていない',
   ['ダーク・スプロケッター','ファラオの化身','アーケイン・ファイロ'].every(nm=>{
     const s2=CARD_SCRIPTS[nm];
     return !s2||!s2.passive||!EVS_S494.some(e=>typeof s2.passive[e]==='function');})
   && Object.keys(MISSED_TIMING_DECL_S03).every(k=>(MISSED_TIMING_DECL_S03[k].reason||'').indexOf('R5')<0)
   && DOC.indexOf('R5（任意でも例外的に逃さないカード）の宣言は今も 0 件')>=0,'');
`, {expect:7});

/* ===== E. 強制／任意の分類そのものの監査（条件1） ===== */
harness('const DOC=' + JSON.stringify(DESIGN_S494) + ';const RUL=' + JSON.stringify(RULINGS_S494) + ';'
      + 'const ENG1ZB=' + JSON.stringify(ENGINE_1ZB_S494) + ';' + COMMON + String.raw`
resetA();
const A=auditBucketsS494();
ok('E1 ★ カード単位の静的な「強制 255」と、イベントごとの判定はずれる — 8 枚は召喚系のどのイベントでも強制ではない',
   A.B.forced.length===255 && A.notForced.length===8
   && JSON.stringify(A.notForced)===JSON.stringify(['エア・サーキュレーター','カラクリ商人 壱七七',
      'コアキメイル・ルークロード','ドラグニティ－アキュリス','フォーチュンレディ・ウインディー',
      'ボーンクラッシャー','ワーム・ミリディス','沈黙のサイコウィザード'].sort())
   && DOC.indexOf('8 枚は召喚系のどのイベントでも強制ではない')>=0,
   JSON.stringify({forced:A.B.forced.length,notForced:A.notForced.length,sample:A.notForced.slice(0,6)}));
/* 実経路で照合する。collectHandlers が実際に出した候補に対して triggerCandidateForcedS03 を見る。 */
function realForced(nm, how){
  fresh();
  /* 条件が成立し得る盤面にする（相手のモンスターと伏せカード、自分の墓地とデッキ） */
  gameState.players[1].mz=[mk('ワイト',1,'up'),mk('ゴブリンドバーグ',1,'up')];
  const st=mk('聖なるバリア －ミラーフォース－',1,'down');st.setTurn=gameState.turn-1;
  gameState.players[1].sz=[st];
  gameState.players[0].grave=[mk('ワイト',0),mk('ドラグニティ－ピルム',0),mk('フォーチュンレディ・ライティー',0)];
  gameState.players[0].hand=[mk('ドラグニティ－ピルム',0)];
  let c=mk(nm,0,'up');
  let seen=null;
  const f=collectHandlers;
  collectHandlers=function(n,e){const r=f.apply(this,arguments);
    r.forEach(x=>{ if(x.name===nm && seen===null) seen={ev:n,forced:!!triggerCandidateForcedS03(x)}; });return r;};
  try{
    if(how==='flip'){
      const d=Object.assign({},c,{face:'down',pos:'def'});ensureCardUid(gameState,d);
      gameState.players[0].mz=[d];baselineA();doFlipUp(0,'mz',0,'atk');
    }else{
      gameState.players[0].hand.unshift(c);baselineA();doNormalSummon(0,'atk');
    }
    drive();
  }catch(e){}
  collectHandlers=f;
  return seen;
}
const rf={yagan:realForced('ワーム・ヤガン','flip'), miri:realForced('ワーム・ミリディス','flip'),
          acu:realForced('ドラグニティ－アキュリス','normal'), wind:realForced('フォーチュンレディ・ウインディー','normal')};
ok('E2 ★ 実経路で照合: 《ワーム・ヤガン》の反転召喚は強制、「できる」と書かれた 3 枚（うち 2 枚は静的には強制扱い）は任意',
   rf.yagan && rf.yagan.forced===true
   && rf.miri && rf.miri.forced===false && rf.acu && rf.acu.forced===false && rf.wind && rf.wind.forced===false
   && A.notForced.indexOf('ワーム・ミリディス')>=0 && A.notForced.indexOf('ドラグニティ－アキュリス')>=0,
   JSON.stringify(rf));
resetA();
ok('E3 ★ 《ラヴァル・グレイター》《ラヴァル・ステライド》は v4 が forced:true を宣言しているので宣言不要（当時裁定 10/04/30 と一致）',
   ['ラヴァル・グレイター','ラヴァル・ステライド'].every(nm=>{
     const effs=nativeEffectsV4(nm)||[];
     return effs.some(e=>e&&e.forced===true&&(e.events||[]).indexOf('onSpecialSummon')>=0)
       && missedTimingModeS03(nm)===null;})
   && RUL.indexOf('WIKI-D42D50F4CFCD')>=0 && RUL.indexOf('WIKI-2DCE27070FC3')>=0,'');
ok('E4 ★ 強制と読めるのに落としているカードが、設計書に未確定として名前付きで残っている（S03-U495 で 30 枚）',
   DOC.indexOf('強制と読めるのに落としているカード 30 枚（42 組）が未確定')>=0
   && ['カラクリ商人 壱七七','ものマネ幻想師','スカラベの大群','コアキメイル・ルークロード','赤鬼']
      .every(nm=>DOC.indexOf(nm)>=0)
   && DOC.indexOf('正しい発動を潰している可能性がある側の未確定')>=0,'');
ok('E5 ★ 強制／任意の判定は engine/1ZB の 1 箇所のまま — 本機構は書き換えていない',
   typeof FORCED_ORIG_S494==='function' && FORCED_ORIG_S494===triggerCandidateForcedS03
   && ENG1ZB.indexOf('function triggerCandidateForcedS03')>=0
   && ENG1ZB.indexOf('missedTiming')<0,'');
`, {expect:5});

/* ===== F. 全件監査の内訳（条件1・条件4） ===== */
harness('const DOC=' + JSON.stringify(DESIGN_S494) + ';' + COMMON + String.raw`
resetA();
const A=auditBucketsS494();
const total=Object.keys(A.B).reduce((a,k)=>a+A.B[k].length,0);
const pt=Object.keys(A.P).reduce((a,k)=>a+A.P[k],0);
ok('F1 ★ カード単位 518 件 = 強制 255 / 宣言 7 / 逃す 207 / 場合 15 / 召喚無効 6 / 文言なし 28（S03-U495 で更新）',
   total===518 && A.B.forced.length===255 && A.B.decl.length===7 && A.B.drop.length===207
   && A.B.baai.length===15 && A.B.summonNegate.length===6 && A.B.none.length===28,
   JSON.stringify(Object.keys(A.B).reduce((a,k)=>(a[k]=A.B[k].length,a),{})));
ok('F2 ★ イベントごとの組単位 675 組 = 強制 316 / 宣言 8 / 逃す 290 / 場合 18 / 召喚無効 12 / 文言なし 31（S03-U495 で更新）',
   pt===675 && A.P.forced===316 && A.P.decl===8 && A.P.drop===290
   && A.P.baai===18 && A.P.negate===12 && A.P.none===31,
   JSON.stringify(A.P));
ok('F3 ★ 「場合」15 件と「文言なし」28 件の一覧を固定する',
   JSON.stringify(A.B.baai.slice().sort())===JSON.stringify(['D－HERO ディスクガイ','E・HERO ガイア','ダッカー',
     'デスグレムリン','デスハムスター','ハネハネ','ハンニバル・ネクロマンサー','光神機－轟龍','名工 虎鉄',
     '夜霧のスナイパー','茫漠の死者','赤い忍者','電磁ミノ虫','青い忍者','魔導戦士 ブレイカー'].sort())
   && JSON.stringify(A.B.none.slice().sort())===JSON.stringify(['ねずみ取り','カードを狩る死神','ガジェット・アームズ',
     'ジェムタートル','トルネード・バード','ドッペルゲンガー','ニードルワーム','ニードル・ボール','ファイヤーソーサラー',
     'ペンギン・ソルジャー','ペンギン・ナイトメア','ライトロード・シーフ ライニャン','ラヴァル・ランスロッド',
     'リチュア・エリアル','ワーム・アポカリプス','ワーム・グルス','不死王リッチー','使徒喰い虫','執念深き老魔術師',
     '幻惑のラフレシア','暗黒のミミック LV1','派手ハネ','渋い忍者','白い忍者','聖なる守り手','裏ガエル','魂を呼ぶ者',
     '魔轟神獣ペガラサス'].sort()),
   JSON.stringify({baai:A.B.baai.length,none:A.B.none.length}));
ok('F4 ★ 設計書 (B-4) に、当時裁定の裏付けと現代テキストの機械分類の区別が引き方付きで書かれている（S03-U495 で数え直し）',
   DOC.indexOf('(B-4) 分類の裏付けの区別')>=0
   && DOC.indexOf('**16 枚**')>=0 && DOC.indexOf('**59 枚**')>=0 && DOC.indexOf('**125 枚**')>=0
   && DOC.indexOf('207 枚のうち 125 枚（60%）は機械分類だけ')>=0
   && DOC.indexOf('どちらも安全ではない')>=0,'');
ok('F5 ★ 「場合」15 件は落とさず、「文言なし」28 件も落とさない（刻みがずれても）',
   A.B.baai.concat(A.B.none).every(nm=>EVS_S494.every(ev=>{
     const s2=CARD_SCRIPTS[nm];
     if(!s2.passive[ev]) return true;
     return missedTimingDropS03({name:nm,eventName:ev,ctx:null,event:{flipSummon:true}},{stepS03:3,flipSummon:true})===false;})),'');
`, {expect:5});

/* ===== G. 《電池メン－単四型》 ─ 召喚句の読み落とし（条件2・条件4） ===== */
harness('const DOC=' + JSON.stringify(DESIGN_S494) + ';' + COMMON + String.raw`
let U=bloodBoard({chain1:'成金ゴブリン', summon:'電池メン－単四型', hand:['電池メン－単四型']});
const links=stackTwo('sz',1);
drive();
ok('G1 前提: チェーン2の通常召喚の後にチェーン1の処理があり、刻みがずれている',
   links===2 && summonCollect().length===1 && summonCollect()[0].stamp<summonCollect()[0].now,
   JSON.stringify({links,collect:summonCollect().map(c=>[c.stamp,c.now])}));
ok('G2 ★ 「召喚・リバースした時」の召喚句を読むようになったので、通常召喚では逃す（S03-U493 は句ごと読み落としていた）',
   JSON.stringify(dropNames())===JSON.stringify(['電池メン－単四型'])
   && gameState.players[0].mz.length===1 && gameState.players[0].hand.length===2,
   JSON.stringify({drops:dropNames(),mz:gameState.players[0].mz.length,hand:gameState.players[0].hand.length}));
audit('G2');
resetA();
gameState.procStepS03=9;
ok('G3 ★ 同じカードの反転召喚側（リバース句）は R8 で落とさない',
   missedTimingClassS03({name:'電池メン－単四型',eventName:'onNormalSummon',ctx:null,event:{}},{})==='summonSuccess'
   && missedTimingClassS03({name:'電池メン－単四型',eventName:'onFlip',ctx:null,event:{flipSummon:true}},{flipSummon:true})===null,'');
ok('G4 ★ この 1 枚は当時裁定の裏付けが無く、設計書 5-b に「機械分類だけ」と明記されている',
   DOC.indexOf('逃さない → 逃す')>=0 && DOC.indexOf('召喚句そのものを読み落としていた')>=0
   && DOC.indexOf('この 1 枚については当時裁定に文言の引用も逃す／逃さないの答えも無く')>=0,'');
`, {expect:5});

/* ===== H-1. 保存（ここで作った保存データを次の harness ＝ 新しい VM に渡す） ===== */
const ctxH = harness(COMMON + String.raw`
const U=bloodBoard({chain1:'成金ゴブリン', summon:'電池メン－単四型', hand:['電池メン－単四型']});
const links=stackTwo('sz',1);
globalThis.__SAVED_S494=savedRaw();
globalThis.__AT_SAVE_S494=JSON.stringify({links, step:s(), drops:dropNames(), mz:gameState.players[0].mz.length});
drive();
globalThis.__WANT_S494=JSON.stringify({drops:dropNames(), step:s(), mz:gameState.players[0].mz.length,
  hand:gameState.players[0].hand.length, digest:v41StateDigest(gameState)});
ok('H1 前提: チェーン2本を積んだ窓で保存でき、保存なしの解決では《電池メン－単四型》だけが逃す',
   links===2 && JSON.stringify(dropNames())===JSON.stringify(['電池メン－単四型'])
   && (globalThis.__SAVED_S494||'').length>0,
   globalThis.__WANT_S494);
ok('H1 ★ 署名と回数は差分だけを見るので保存データにも digest にも出ない',
   (globalThis.__SAVED_S494||'').indexOf('missedTiming')<0
   && (globalThis.__SAVED_S494||'').indexOf('procStepS03')>=0
   && v41StateDigest(gameState).indexOf('missedTiming')<0,'');
`, {expect:2});

/* ===== H-2. 新しい VM で再開 ===== */
harness('const SAVED=' + JSON.stringify(ctxH.__SAVED_S494 || '') + ';'
      + 'const WANT=' + (ctxH.__WANT_S494 || 'null') + ';'
      + 'const AT=' + (ctxH.__AT_SAVE_S494 || 'null') + ';' + COMMON + String.raw`
const okLoad=loadInto(SAVED);
const atResume={links:(gameState.chain||[]).length, step:s(), drops:dropNames(), mz:gameState.players[0].mz.length};
ok('H2 前提: 別の VM で保存データから再開でき、チェーン・刻み・落とし方が保存時のまま戻っている',
   okLoad===true && JSON.stringify(atResume)===JSON.stringify(AT),
   JSON.stringify({okLoad,atResume,AT}));
drive();
const got={drops:dropNames(), step:s(), mz:gameState.players[0].mz.length,
  hand:gameState.players[0].hand.length, digest:v41StateDigest(gameState)};
ok('H2 ★ 新しい VM での再開後の解決が、保存なしの解決と同じ落とし方・同じ刻み・同じ最終 digest になる',
   JSON.stringify(got)===JSON.stringify(WANT), JSON.stringify({got,WANT}));
audit('H2');
`, {expect:3});

/* ===== I. 設計書・裁定の記録（条件3・条件4） ===== */
harness('const DOC=' + JSON.stringify(DESIGN_S494) + ';const RUL=' + JSON.stringify(RULINGS_S494) + ';'
      + COMMON + String.raw`
ok('I1 ★ 規則表に R8（リバース効果は逃さない）と R9（「召喚」の意味）が根拠付きで入っている',
   DOC.indexOf('| R8 |')>=0 && DOC.indexOf('| R9 |')>=0
   && DOC.indexOf('リバースした時」のリバース効果は逃さない')>=0
   && DOC.indexOf('表側攻撃表示または表側守備表示での通常召喚')>=0,'');
ok('I2 ★ 5-b に S03-U494 で変わった判定が組数で書かれている（逃さなくなる 12 組 / 逃すようになる 1 組）',
   DOC.indexOf('5-b. S03-U494 で変わった判定')>=0
   && DOC.indexOf('**12 組 / 11 枚**')>=0 && DOC.indexOf('**1 組**')>=0
   && DOC.indexOf('カード単位の「強制 255」は 1 枚まるごとの静的な読み方')>=0,'');
ok('I3 ★ 5-a に未確定（強制と読めるカード・「場合」12 枚・機械分類の多数）が残っていて、完成とは書かれていない',
   DOC.indexOf('5-a. 未対応（S03-U495 時点')>=0
   && DOC.indexOf('全体は完成していない')>=0
   && DOC.indexOf('| 1-b |')>=0 && DOC.indexOf('| 1-c |')>=0
   && DOC.indexOf('当時の文言が確認できていない')>=0,'');
ok('I4 ★ §6 に S03-U494 で採らなかった案（一律で強制とみなす・ブレイカーを宣言する・255 をそのまま使う）が書かれている',
   DOC.indexOf('採らない案（S03-U494 で足した分）')>=0
   && DOC.indexOf('「できる」が無ければ強制とみなし')>=0
   && DOC.indexOf('《魔導戦士 ブレイカー》を宣言表に入れる')>=0
   && DOC.indexOf('強制 255 枚」をそのまま R1 の範囲とみなす')>=0,'');
ok('I5 ★ 召喚無効には広げていない（SUMMON_WINDOW_* / summonNegate は本単位の対象外のまま）',
   DOC.indexOf('WIKI-2CF23AA42E79')>=0 && DOC.indexOf('SUMMON_WINDOW')>=0
   && ['エレキャンセル','キックバック','ライト・バニッシュ','神の宣告','神の警告','重力崩壊'].every(nm=>
      missedTimingDropS03({name:nm,eventName:'onNormalSummon',ctx:null,event:{}},{stepS03:3})===false),'');
ok('I6 ★ 追加参照した当時裁定が、123 件の機械抽出とは別の節として記録されている',
   RUL.indexOf('S03-U494 で追加参照した当時裁定')>=0
   && RUL.indexOf('その語を含まない裁定が判定の根拠になる')>=0
   && RUL.indexOf('R1103-SNOWMAN-002')>=0 && RUL.indexOf('WIKI-07D76F683452')>=0
   && RUL.indexOf('WIKI-55066C00ED04')>=0 && RUL.indexOf('WIKI-8639442A7B6A')>=0,'');
`, {expect:6});
