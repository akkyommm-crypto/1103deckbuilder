/* S03-U474: コストの選択と効果の対象の選択を共有エンジンで分ける（コストの候補に効果の対象耐性を掛けない）。
   ユーザー指示: 「コストのリリース・捨てるカードの選択には、効果の対象耐性を適用しません。共有エンジンで「コストを選ぶ処理」と「効果の対象を選ぶ処理」を
   明確に区別してください。ただし、リリース禁止などコスト自体の制約は維持します。選択後のコールバックでも区別が維持される設計とし、別ユニットで実装・検証してください。」
   欠陥（基点 c8aa65c6）: API.selectCard は対象耐性の要否（targeting）をスクリプト全体の targets:true から推定する。スクリプト単位の印なので、同じスクリプトの
   「コストの選択」と「効果の対象の選択」を区別できず、targets:true のカードではコストの候補（リリース・墓地から除外 等）にまで filterTargetable が掛かった。
   症状: デュアルスパークがメタルシルバー・アーマーの下でコスト候補が空になる／ゴッドバードアタックが、他の耐性で守られた鳥獣族をリリースできない。
   設計（engine/1ZZW + 09 + 30 + 40）: 発動準備がコストを払う間は選択の段階が 'cost'。記録 pendingChoice.selection:'cost'|'effect' に残し、継続は記録の段階で実行する。
   裁定: 該当の裁定は archive に無い（沈黙）。採用は「コストは対象ではない」という一般則（WIKI-590BE854FBC4 2009-08-12: 鳥獣族のリリース（コスト）の後に対象を選ぶ手順、
   WIKI-0C9B551C19FA 2010-08-06: トラファスフィアは ゴッドバードアタック のコストにできる）。
   Cards named: デュアルスパーク, ゴッドバードアタック, サシカエル, 泣き神の石像, アサルト・スピリッツ, D・クリーナン, メタルシルバー・アーマー, 神の威光。 */
const fs=require('fs'),path=require('path');
const harness=require('./astra_harness');
const ROOT=path.resolve(__dirname,'..');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function mon(name,p,face,pos){const c=mk(name,p,face||'up',pos||'atk');c.summonedTurn=3;return c;}
function uid(c){return ensureCardUid(gameState,c);}
function zoneOf(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function nm(c){return c?cardName(c):null;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest and the final state',pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,240));}
function jt(j0){return V41_ACTION_JOURNAL.slice(j0).map(e=>e.action.type+(/^PREP_TX/.test(e.action.type)&&e.action.reason?':'+e.action.reason:''));}
function candUids(){const q=pc();return q?q.candidates.map(x=>x.uid):[];}
function candNames(){const q=pc();return q?q.candidates.map(x=>{const h=x.uid!=null&&findCardByUid(x.uid);return h?nm(h.card):x.label;}):[];}
function answerUid(u){const q=pc();const c=q.candidates.find(x=>x.uid===u);if(!c)throw Error('candidate uid '+u+' missing: '+JSON.stringify(candNames()));answerChoiceV49([c.key]);}
function drive(){for(let i=0;i<300;i++){
  if(pc())return 'choice';
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
const ARM='メタルシルバー・アーマー',GOD='神の威光';
function fresh(active){resetA();EVT_V2_STATE=null;gameState.activePlayer=active;gameState.firstPlayer=0;gameState.turn=6;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4740001;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));TOASTS.length=0;}
/* 神の威光（永続罠）: 選んだモンスター1体を、お互いのプレイヤーの効果の対象にならなくする（U389: continuous.immuneToTarget がカードのフラグ u389Guarded を読む）。
   メタルシルバー・アーマー以外の、全ての効果に対する対象耐性として使う（自分の効果にも効く）。 */
function guard(owner,monster){const g=mk(GOD,owner,'up');g.u389Guarded=uid(monster);gameState.players[owner].sz.push(g);return g;}
/* メタルシルバー・アーマー（P0）を P0 のモンスターへ装備: 相手（P1）の効果は、装備モンスター以外のお互いの場・墓地のモンスターを対象にできない */
function armorOn(host){const a=mk(ARM,0,'up');gameState.players[0].sz.push(a);return a;}
function equipArmor(a,host){API.equipSpell(locateCardAnyV4(a),locateCardAnyV4(host),'S03-U474 fixture');}
function targetable(cands,by){return filterTargetable(cands,by);}
/* 古いエンジン（この単位の前）でも例外で止まらず、各アサーションが FAIL として数えられるように、新しい API は薄い包みを通して呼ぶ（negative control 用） */
/* 例外で節ごと止まっても、その節が FAIL として数えられ、後続の節は実行される（negative control で FAIL の数を測るため） */
function sec(name,fn){try{fn();}catch(e){ok(name+': section ABORTED by an exception — '+String(e&&e.message||e).slice(0,160),false,'');}}
const phaseOf=()=>typeof selectionPhaseS03==='function'?selectionPhaseS03():null;
const withPhase=(p,f)=>typeof withSelectionPhaseS03==='function'?withSelectionPhaseS03(p,f):f();
/* 合成スクリプト（テストVM内だけ。実カード名「アンティ勝負」を借りる）: targets:true、コストが2段（2つ目は1つ目の onPick の中で開く。間に確認を挟める）、その後に本当の対象。
   各段で見えている選択の段階を __seen に控える。 */
globalThis.__seen=[];globalThis.__confirmBetween=false;
defineScript('アンティ勝負',{
  type:'spell',priority:1,targets:true,
  condition(){return true;},
  cost(ctx,done){
    const mine=()=>API.fieldCards({player:ctx.player,zone:'mz'});
    API.selectCard('U474 cost 1/2',mine(),r1=>{
      globalThis.__seen.push(['cost1',phaseOf()]);API.sendToGrave(r1,'U474 cost1');
      const next=()=>API.selectCard('U474 cost 2/2',mine(),r2=>{globalThis.__seen.push(['cost2',phaseOf()]);API.sendToGrave(r2,'U474 cost2');done(true);});
      if(globalThis.__confirmBetween)API.confirm('U474 もう1体？','',()=>next(),()=>done(true));else next();
    });
  },
  selectTargets(ctx,done){globalThis.__seen.push(['targets-start',phaseOf()]);API.selectCard('U474 target',API.fieldCards({player:1-ctx.player,zone:'mz'}),t=>done([t]));},
  resolve(){}
});
function runG(kind){
  /* 保存した選択を、最初の候補以外（m2）で回答し、次の legacy 選択も回答する。結果は __G */
  const q=pc();const c1=q.candidates.find(c=>c.uid===globalThis.__GU.m2);answerChoiceV49([c1.key]);
  const q2=pc();if(q2)answerChoiceV49([q2.candidates[0].key]);
  return globalThis.__G;
}
/* G の継続（保存→再開の両方の VM に同じものを登録する）。回答後のコールバックで開く legacy 選択が、保存・再開しても同じ分類になることを見る。
   targets:true の準備中（ACTIVATION_PREP_S03）という前提を置く: 段階が引き継がれなければ、対象耐性（スクリプトの targets:true）が掛かる。 */
for(const kind of ['cost','effect'])API.registerChoiceHandler('u474.'+kind+'-a',(a,x)=>{
  if(a.cancelled)return;
  const r={phase:phaseOf()};
  ACTIVATION_PREP_S03={player:1,uid:-1,name:'アンティ勝負',afterSeq:0};
  API.selectCard('U474 2nd',API.fieldCards({player:1,zone:'mz'}),()=>{
    r.phase2=phaseOf();
    API.selectCard('U474 3rd (implicit, inside the callback)',API.fieldCards({player:1,zone:'mz'}),()=>{});
    const q3=pc();r.third=q3&&{sel:q3.selection,t:q3.targeting,u:q3.candidates.map(c=>c.uid)};
    if(q3)cancelChoiceV49();
    ACTIVATION_PREP_S03=null;
  });
  const q=pc();r.second=q&&{sel:q.selection,t:q.targeting,u:q.candidates.map(c=>c.uid)};
  globalThis.__G=r;
});
`;

const first=harness(COMMON+String.raw`
globalThis.__SAVES={};

/* ===== 0. 段階の道具（engine/1ZZW）===== */
ok('phase API exists and the idle phase is null',typeof withSelectionPhaseS03==='function'&&typeof selectionPhaseS03==='function'&&typeof runCostPhaseS03==='function'&&phaseOf()===null,'');
sec('S1',()=>{ { let seen=[];
  withPhase('cost',()=>{seen.push(phaseOf());withPhase(null,()=>seen.push(phaseOf()));seen.push(phaseOf());});
  ok('phase: set by cost, cleared by null inside it, restored afterwards, null at the end',seen[0]==='cost'&&seen[1]===null&&seen[2]==='cost'&&phaseOf()===null,JSON.stringify(seen)); } });
sec('S2',()=>{ { let threw=false;try{withPhase('cost',()=>{throw new Error('boom');});}catch(e){threw=true;}
  ok('phase: an exception inside the window still restores the phase (nothing is left marked)',threw&&phaseOf()===null,''); } });
ok('selectionKindS03: only the string "cost" is a cost selection; "effect" / "target" / undefined are effect selections',typeof selectionKindS03==='function'&&selectionKindS03('cost')==='cost'&&selectionKindS03('effect')==='effect'&&selectionKindS03('target')==='effect'&&selectionKindS03(undefined)==='effect'&&selectionKindS03(true)==='effect','');

/* ===== A. デュアルスパーク × メタルシルバー・アーマー — 記録された症状 ===== */
/* P1 が デュアルスパーク（速攻魔法）を手札から発動。P0 のアーマーは P1 の効果に対し、装備モンスター以外のお互いのモンスターを守る → P1 自身のデュアルモンスターも「対象にならない」。 */
function buildA(){
  fresh(1);const P=gameState.players;
  const x={};x.host=mon('サイバー・ドラゴン',0);x.other=mon('ライオウ',0);x.armor=armorOn();P[0].mz=[x.host,x.other];
  x.dual=mon('クルセイダー・オブ・エンディミオン',1);x.crit=mon('クリッター',1);P[1].mz=[x.dual,x.crit];
  x.spark=mk('デュアルスパーク',1);P[1].hand=[x.spark];
  baselineA();equipArmor(x.armor,x.host);x.D0=v41StateDigest(gameState);return x;
}
sec('S3',()=>{ { const x=buildA();const P1=gameState.players[1];
  ok('A fixture: the Dual Monster is a face-up Level 4 Dual (the cost) and Armor protects it from P1\'s single-target effect (the recorded defect condition)',
    (dbOf(x.dual).st||[]).includes('デュアル')&&dbOf(x.dual).lv===4&&targetable(API.fieldCards({player:1,zone:'mz',filter:c=>c.card===x.dual}),1).length===0,'');
  ok('A fixture: Armor leaves only the equipped host targetable for P1 (the effect target pool)',targetable(API.fieldCards({zone:'mz'}),1).map(c=>nm(c.card)).join()==='サイバー・ドラゴン','');
  const j0=V41_ACTION_JOURNAL.length;
  duelActivateFromHand(0);
  const q=pc();
  ok('A: the cost choice opens (was: 「選択できるカードが足りません」 and the activation was undone) — the Dual is a candidate',!!q&&candUids().includes(x.dual.uid)&&!TOASTS.includes('選択できるカードが足りません'),JSON.stringify({names:candNames(),toasts:TOASTS}));
  ok('A: the cost choice is recorded as a cost selection: selection "cost", targeting false (it rides in gameState.pendingChoice, like targeting)',q&&q.selection==='cost'&&q.targeting===false&&q.legacy===true,JSON.stringify(q&&{selection:q.selection,targeting:q.targeting}));
  ok('A: the script itself still declares targets:true (the old inference would have filtered the cost)',CARD_SCRIPTS['デュアルスパーク'].targets===true,'');
  answerUid(x.dual.uid);
  ok('A: the Dual Monster was released as the cost (Graveyard) and is not a chain target',zoneOf(x.dual)==='grave'&&gameState.chain.length===0,JSON.stringify({zone:zoneOf(x.dual)}));
  const q2=pc();
  ok('A: the next choice is the effect target: selection "effect", targeting true',!!q2&&q2.selection==='effect'&&q2.targeting===true,JSON.stringify(q2&&{selection:q2.selection,targeting:q2.targeting}));
  ok('A: the effect target is STILL filtered in the same script — the Armor-equipped host (and the Spell Armor itself, which protects monsters only) are offered; the protected ライオウ / クリッター are not',
    candNames().join()==='サイバー・ドラゴン,メタルシルバー・アーマー'&&!candUids().includes(x.other.uid)&&!candUids().includes(x.crit.uid),JSON.stringify(candNames()));
  answerUid(x.host.uid);
  ok('A: the activation is committed (chain link with the host as target)',gameState.chain.length===1&&gameState.prepTxS03===undefined,JSON.stringify({chain:gameState.chain.length}));
  const hand0=P1.hand.length;drive();
  ok('A: the effect resolves — the host is destroyed (Graveyard) and P1 draws 1',zoneOf(x.host)==='grave'&&P1.hand.length===hand0+1,JSON.stringify({host:zoneOf(x.host),hand:P1.hand.length,hand0}));
  ok('A: nothing was left marked after the activation (phase null)',phaseOf()===null,'');
  audit('A デュアルスパーク');
} });

/* ===== B. ゴッドバードアタック — 他の耐性（神の威光）で守られた鳥獣族をコストにでき、効果の対象は U472 の複数対象の規則のまま ===== */
/* P1 が自分のターンに伏せた ゴッドバードアタック を発動。P1 の鳥獣族 W1 は P1 の 神の威光 で全ての効果の対象にならない（自分の効果にも効く）。
   P0 側: アーマーが装備モンスターを守る一方、複数対象の効果には掛からない（U472）。P0 の ライオウ は P0 の 神の威光 で守られる（アーマーとは別の耐性）。 */
function buildB(){
  fresh(1);const P=gameState.players;
  const x={};x.host=mon('サイバー・ドラゴン',0);x.guarded=mon('ライオウ',0);x.plain=mon('ワイト',0);x.armor=armorOn();
  P[0].mz=[x.host,x.guarded,x.plain];
  x.w1=mon('ハーピィ・レディ',1);x.w2=mon('ハーピィ・レディ',1);P[1].mz=[x.w1,x.w2];
  x.god0=guard(0,x.guarded);x.god1=guard(1,x.w1);
  x.gba=mk('ゴッドバードアタック',1,'down');x.gba.setTurn=gameState.turn-1;P[1].sz.push(x.gba);x.szIdx=P[1].sz.length-1;
  baselineA();equipArmor(x.armor,x.host);x.D0=v41StateDigest(gameState);return x;
}
sec('S4',()=>{ { const x=buildB();
  ok('B fixture: W1 is protected by 神の威光 (not by the Armor), W2 only by the Armor; ゴッドバードアタック declares targetCount 2 (U472) so the Armor does not apply to its targets',
    targetable(API.fieldCards({player:1,zone:'mz',filter:c=>c.card===x.w1}),1).length===0&&CARD_SCRIPTS['ゴッドバードアタック'].targets===true&&CARD_SCRIPTS['ゴッドバードアタック'].targetCount===2,'');
  ok('B fixture: with the effect info of ゴッドバードアタック itself, W2 (Armor only) is targetable but W1 (神の威光) and ライオウ (神の威光) are not',
    (()=>{const info=targetEffectSourceS03(1,{name:'ゴッドバードアタック'});const f=c=>filterTargetable(API.fieldCards({zone:'mz',filter:y=>y.card===c}),1,info).length>0;return f(x.w2)&&!f(x.w1)&&!f(x.guarded)&&f(x.plain)&&f(x.host);})(),'');
  duelActivateFromZone(1,'sz',x.szIdx,{});
  const q=pc();
  ok('B: the cost choice opens and offers BOTH birds, including the one protected by another immunity (was: only W2)',!!q&&candUids().includes(x.w1.uid)&&candUids().includes(x.w2.uid),JSON.stringify({names:candNames(),toasts:TOASTS}));
  ok('B: it is recorded as a cost selection (selection "cost", targeting false)',q&&q.selection==='cost'&&q.targeting===false,JSON.stringify(q&&{selection:q.selection,targeting:q.targeting}));
  answerUid(x.w1.uid);
  ok('B: the protected bird W1 is released as the cost (Graveyard); the activation continues to the target step',zoneOf(x.w1)==='grave'&&!!pc(),JSON.stringify({w1:zoneOf(x.w1)}));
  const q1=pc();
  ok('B: target 1/2 is an effect selection (selection "effect", targeting true)',q1.selection==='effect'&&q1.targeting===true,JSON.stringify({selection:q1.selection,targeting:q1.targeting}));
  ok('B: effect targets: the 神の威光-protected ライオウ is excluded (a non-Armor immunity still applies to targets); Armor-only monsters (host, ワイト, W2) are offered by the U472 multi-target rule',
    !candUids().includes(x.guarded.uid)&&candUids().includes(x.host.uid)&&candUids().includes(x.plain.uid)&&candUids().includes(x.w2.uid),JSON.stringify(candNames()));
  answerUid(x.plain.uid);
  const q2=pc();
  ok('B: target 2/2: still an effect selection; the first pick is not offered again; ライオウ is still excluded',q2.selection==='effect'&&q2.targeting===true&&!candUids().includes(x.plain.uid)&&!candUids().includes(x.guarded.uid),JSON.stringify(candNames()));
  answerUid(x.w2.uid);
  ok('B: committed — chain link with the two targets',gameState.chain.length===1&&(gameState.chain[0].targets||[]).length===2&&gameState.prepTxS03===undefined,JSON.stringify({chain:gameState.chain.length}));
  drive();
  ok('B: resolution destroys both targets (ワイト and the Armor-exempt W2); the guarded ライオウ and the host are untouched',zoneOf(x.plain)==='grave'&&zoneOf(x.w2)==='grave'&&zoneOf(x.guarded)==='mz'&&zoneOf(x.host)==='mz',JSON.stringify({plain:zoneOf(x.plain),w2:zoneOf(x.w2),guarded:zoneOf(x.guarded)}));
  audit('B ゴッドバードアタック');
} });

/* ===== D. コスト自体の制約は維持 — サシカエル（水族をリリースするコスト）===== */
/* サシカエル: 自分の水族モンスター1体をリリース（コスト）し、自分の墓地の「ガエル」1体を対象に特殊召喚。コストの候補は「リリースできる（cannotTribute でない）表側の水族」。
   B は 神の威光 で守られた水族（旧: コスト候補から外れた）。A は リリースできない（cannotTribute）水族、C は水族でない。 */
function buildD(withArmor){
  fresh(1);const P=gameState.players;
  const x={};x.sashi=mon('サシカエル',1);x.A=mon('アクア・スネーク',1);x.A.cannotTribute=true;x.B=mon('アトランティスの戦士',1);x.C=mon('ワイト',1);
  P[1].mz=[x.sashi,x.A,x.B,x.C];
  x.gaeru=mk('デスガエル',1);P[1].grave=[x.gaeru];
  x.god=guard(1,x.B);
  if(withArmor){x.host=mon('サイバー・ドラゴン',0);x.armor=armorOn();P[0].mz=[x.host];}
  baselineA();if(withArmor)equipArmor(x.armor,x.host);x.D0=v41StateDigest(gameState);return x;
}
sec('S5',()=>{ { const x=buildD(false);
  ok('D fixture: B is protected by 神の威光 (target immunity), A cannot be tributed (cost restriction), C is not Aqua; サシカエル declares targets:true',
    targetable(API.fieldCards({player:1,zone:'mz',filter:c=>c.card===x.B}),1).length===0&&x.A.cannotTribute===true&&dbOf(x.C).ra!=='水'&&CARD_SCRIPTS['サシカエル'].targets===true,'');
  const idx=gameState.players[1].mz.indexOf(x.sashi);duelActivateFromZone(1,'mz',idx,{});
  const q=pc();
  ok('D: the cost choice opens (selection "cost", targeting false)',!!q&&q.selection==='cost'&&q.targeting===false,JSON.stringify(q&&{selection:q.selection,targeting:q.targeting,names:candNames()}));
  ok('D: the immunity-protected Aqua B is offered as the cost (was: excluded by the target-immunity filter)',candUids().includes(x.B.uid),JSON.stringify(candNames()));
  ok('D: the COST restriction is kept — the Aqua that cannot be tributed (A) and the non-Aqua (C) are NOT offered',!candUids().includes(x.A.uid)&&!candUids().includes(x.C.uid),JSON.stringify(candNames()));
  answerUid(x.B.uid);
  const q2=pc();
  ok('D: B is released as the cost; the next choice is the effect target (selection "effect", targeting true): the Frog in the Graveyard',zoneOf(x.B)==='grave'&&!!q2&&q2.selection==='effect'&&q2.targeting===true&&candUids().join()===String(x.gaeru.uid),JSON.stringify({b:zoneOf(x.B),names:candNames()}));
  answerUid(x.gaeru.uid);drive();
  ok('D: resolution Special Summons デスガエル from the Graveyard',zoneOf(x.gaeru)==='mz'&&zoneOf(x.A)==='mz',JSON.stringify({gaeru:zoneOf(x.gaeru)}));
  audit('D サシカエル');
} });

/* ===== H. U471 のトランザクションは生きている — コストが払えた後に本当の対象選択が尽きたら、発動準備を中止して元へ戻す ===== */
sec('S6',()=>{ { const x=buildD(true);const idx=gameState.players[1].mz.indexOf(x.sashi);
  ok('H fixture: under the Armor every P1 monster is protected from a single-target effect AND the Graveyard Frog is protected (the old filter emptied the cost candidates)',
    targetable(API.fieldCards({player:1,zone:'mz'}),1).length===0&&targetable([{p:1,zone:'grave',index:0,card:x.gaeru}],1).length===0,'');
  const j0=V41_ACTION_JOURNAL.length;
  duelActivateFromZone(1,'mz',idx,{});
  const q=pc();
  ok('H: the cost choice opens although every candidate is protected (selection "cost")',!!q&&q.selection==='cost'&&candUids().includes(x.B.uid),JSON.stringify({names:candNames(),toasts:TOASTS}));
  TOASTS.length=0;answerUid(x.B.uid);
  ok('H: the cost is paid (B released) and the genuine target step (the Graveyard Frog under the Armor) runs out → 「選択できるカードが足りません」, no choice, no chain link',
    TOASTS.includes('選択できるカードが足りません')&&!pc()&&gameState.chain.length===0,JSON.stringify({toasts:TOASTS,pend:!!pc(),chain:gameState.chain.length}));
  ok('H: the transaction restored everything — B is back on the field, the whole state equals the pre-activation digest, no record left',zoneOf(x.B)==='mz'&&v41StateDigest(gameState)===x.D0&&gameState.prepTxS03===undefined,JSON.stringify({b:zoneOf(x.B)}));
  ok('H: the journal shows the cost, then the single abort with the reason insufficient',jt(j0).includes('PREP_TX_ABORT_S03:insufficient')&&jt(j0).filter(t=>/PREP_TX_ABORT/.test(t)).length===1,JSON.stringify(jt(j0)));
  ok('H: the phase is not left marked after the abort',phaseOf()===null,'');
  audit('H U471 abort');
} });

/* ===== E. COST_SELECTION_FIRST の経路 — selectTargets が選ぶコストのカードにも対象耐性を掛けない ===== */
/* 泣き神の石像: 自分の墓地のチューナー1体を除外して発動し、手札から特殊召喚する。P1 の墓地のモンスターはアーマー（墓地のモンスターも守る）で守られる。 */
function buildE(){
  fresh(1);const P=gameState.players;
  const x={};x.host=mon('サイバー・ドラゴン',0);x.armor=armorOn();P[0].mz=[x.host];
  x.tuner=mk('BF－そよ風のブリーズ',1);x.plain=mk('ワイト',1);P[1].grave=[x.plain,x.tuner];
  x.card=mk('泣き神の石像',1);P[1].hand=[x.card];
  baselineA();equipArmor(x.armor,x.host);x.D0=v41StateDigest(gameState);return x;
}
sec('S7',()=>{ { const x=buildE();
  ok('E fixture: the Tuner in the Graveyard is a Tuner and is protected by the Armor from P1\'s single-target effect; 泣き神の石像 is a declared COST_SELECTION_FIRST script with targets:true',
    (dbOf(x.tuner).st||[]).includes('チューナー')&&targetable([{p:1,zone:'grave',index:1,card:x.tuner}],1).length===0&&costSelectionFirstS03('泣き神の石像',CARD_SCRIPTS['泣き神の石像'])&&CARD_SCRIPTS['泣き神の石像'].targets===true,'');
  duelActivateFromHand(0);
  const q=pc();
  ok('E: the selectTargets-driven cost choice opens with the protected Tuner (selection "cost", targeting false) — was emptied → 「選択できるカードが足りません」',!!q&&q.selection==='cost'&&q.targeting===false&&candUids().includes(x.tuner.uid),JSON.stringify({names:candNames(),toasts:TOASTS}));
  ok('E: the cost restriction (a Tuner) is kept — the non-Tuner in the Graveyard is not offered',!candUids().includes(x.plain.uid),JSON.stringify(candNames()));
  answerUid(x.tuner.uid);
  ok('E: the Tuner is banished as cost; no further choice is needed; the link is built without a target (the cost card is not a target)',zoneOf(x.tuner)==='banish'&&!pc()&&gameState.chain.length===1&&(gameState.chain[0].targets||[]).length===0,JSON.stringify({tuner:zoneOf(x.tuner),chain:gameState.chain.length}));
  drive();
  ok('E: resolution Special Summons 泣き神の石像 from the hand',zoneOf(x.card)==='mz',JSON.stringify({card:zoneOf(x.card)}));
  ok('E: the phase is not left marked',phaseOf()===null,'');
  audit('E 泣き神の石像');
} });

/* ===== F. COST_SELECTION_FIRST の selectTargets の中の本当の対象 — 明示 {selection:'effect'} で効果の選択に戻す ===== */
sec('S8',()=>{ { /* D・クリーナン（守備表示）: 相手の表側攻撃表示モンスター1体を選択して装備カード扱いで装備（本当の対象）。P1 のモンスター foeA は P1 の 神の威光 で守られる。 */
  fresh(0);const P=gameState.players;
  const cl=mon('D・クリーナン',0,'up','def'),foeA=mon('ライオウ',1),foeB=mon('クリッター',1);
  P[0].mz=[cl];P[1].mz=[foeA,foeB];guard(1,foeA);baselineA();
  ok('F fixture: D・クリーナン is a declared COST_SELECTION_FIRST script (targets:true); foeA is protected by 神の威光',costSelectionFirstS03('D・クリーナン',CARD_SCRIPTS['D・クリーナン'])&&targetable(API.fieldCards({player:1,zone:'mz',filter:c=>c.card===foeA}),0).length===0,'');
  duelActivateFromZone(0,'mz',0,{});
  const q=pc();
  ok('F: defense position — the equip target choice is a REAL target, recorded as an effect selection (selection "effect", targeting true) even though it runs inside the COST_SELECTION_FIRST selectTargets',!!q&&q.selection==='effect'&&q.targeting===true,JSON.stringify(q&&{selection:q.selection,targeting:q.targeting,names:candNames(),toasts:TOASTS}));
  ok('F: the immunity-protected foe is excluded from the genuine target selection; the other foe is offered',!candUids().includes(foeA.uid)&&candUids().includes(foeB.uid),JSON.stringify(candNames()));
  cancelChoiceV49();
  audit('F D・クリーナン (target branch, cancelled)');
} });
sec('S9',()=>{ { /* D・クリーナン（攻撃表示）: 装備カードを墓地へ送るコスト — selectTargets の既定（コストの選択） */
  fresh(0);const P=gameState.players;
  const cl=mon('D・クリーナン',0,'up','atk');P[0].mz=[cl];
  const eq=mk('団結の力',0);P[0].sz=[eq];baselineA();API.equipSpell(locateCardAnyV4(eq),locateCardAnyV4(cl),'S03-U474 fixture');
  duelActivateFromZone(0,'mz',0,{});
  const q=pc();
  ok('F: attack position — sending an equipped card to the Graveyard is the COST: recorded as a cost selection (selection "cost", targeting false), the Equip is offered',!!q&&q.selection==='cost'&&q.targeting===false&&candUids().includes(eq.uid),JSON.stringify(q&&{selection:q.selection,targeting:q.targeting,names:candNames(),toasts:TOASTS}));
  if(pc())cancelChoiceV49();
} });
sec('S10',()=>{ { /* アサルト・スピリッツ（装備されていない）: 装備するモンスター（本当の対象）。自分のモンスター g は 神の威光 で守られる */
  fresh(0);const P=gameState.players;
  const g=mon('ライオウ',0),n=mon('ワイト',0);P[0].mz=[g,n];guard(0,g);
  const trap=mk('アサルト・スピリッツ',0,'down');trap.setTurn=gameState.turn-1;P[0].sz.push(trap);const si=P[0].sz.length-1;baselineA();
  duelActivateFromZone(0,'sz',si,{});
  const q=pc();
  ok('F: アサルト・スピリッツ (not equipped) — the equip target is a REAL target: selection "effect"; the 神の威光-protected monster is excluded, the other is offered',
    !!q&&q.selection==='effect'&&q.targeting===true&&!candUids().includes(g.uid)&&candUids().includes(n.uid),JSON.stringify(q&&{selection:q.selection,names:candNames(),toasts:TOASTS}));
  cancelChoiceV49();
} });

/* ===== N. 選択後のコールバックでも区別が維持される — 合成カード（コストが2段・間に確認を挟む・その後に対象）===== */
/* 実カードと同じ道: duelActivateFromHand → prepareDuelActivation。コストの2つ目の選択・確認は1つ目の onPick の中（回答後のコールバック）で開く。 */
function buildN(){
  fresh(1);const P=gameState.players;const x={};
  x.m1=mon('ライオウ',1);x.m2=mon('ジェネティック・ワーウルフ',1);x.m3=mon('ワイト',1);P[1].mz=[x.m1,x.m2,x.m3];
  x.f1=mon('サイバー・ドラゴン',0);x.f2=mon('はにわ',0);P[0].mz=[x.f1,x.f2];
  guard(1,x.m1);guard(1,x.m2);guard(0,x.f1);
  x.card=mk('アンティ勝負',1);P[1].hand=[x.card];baselineA();globalThis.__seen=[];return x;
}
sec('S11',()=>{ for(const between of [false,true]){
  const x=buildN();globalThis.__confirmBetween=between;
  const tag='N'+(between?' (with a confirm between the two cost picks)':'');
  ok(tag+' fixture: m1 and m2 are protected by 神の威光 (P1\'s own), f1 by P0\'s; the synthetic script declares targets:true',targetable(API.fieldCards({player:1,zone:'mz'}),1).map(c=>nm(c.card)).join()==='ワイト'&&CARD_SCRIPTS['アンティ勝負'].targets===true,'');
  duelActivateFromHand(0);
  let q=pc();
  ok(tag+': cost pick 1/2 is a cost selection and offers the protected monsters too',q&&q.selection==='cost'&&q.targeting===false&&candUids().length===3,JSON.stringify(q&&{selection:q.selection,names:candNames()}));
  answerUid(x.m1.uid);
  if(between){
    q=pc();
    ok(tag+': the confirm opened INSIDE the answer callback inherits the cost classification (selection "cost")',!!q&&q.kind==='yesno'&&q.selection==='cost',JSON.stringify(q&&{kind:q.kind,selection:q.selection}));
    answerChoiceV49(['yes']);
  }
  q=pc();
  ok(tag+': cost pick 2/2 — opened in the callback of pick 1 — is still a cost selection; the protected m2 is offered (m1 is gone)',!!q&&q.selection==='cost'&&q.targeting===false&&candUids().includes(x.m2.uid)&&!candUids().includes(x.m1.uid),JSON.stringify(q&&{selection:q.selection,names:candNames()}));
  ok(tag+': the phase seen inside the callback of pick 1 is "cost" (the classification is restored from the choice record, not from the call stack)',globalThis.__seen[0]&&globalThis.__seen[0][0]==='cost1'&&globalThis.__seen[0][1]==='cost',JSON.stringify(globalThis.__seen));
  answerUid(x.m2.uid);
  ok(tag+': both costs are paid (m1, m2 in the Graveyard)',zoneOf(x.m1)==='grave'&&zoneOf(x.m2)==='grave',JSON.stringify({m1:zoneOf(x.m1),m2:zoneOf(x.m2)}));
  q=pc();
  ok(tag+': after the cost is done the NEXT selection is an effect target (selection "effect", targeting true); the phase was cleared when the cost finished',!!q&&q.selection==='effect'&&q.targeting===true&&globalThis.__seen.some(s=>s[0]==='targets-start'&&s[1]===null),JSON.stringify({q:q&&{selection:q.selection,targeting:q.targeting},seen:globalThis.__seen}));
  ok(tag+': the effect target is filtered — the protected f1 is excluded, f2 offered',!candUids().includes(x.f1.uid)&&candUids().includes(x.f2.uid),JSON.stringify(candNames()));
  answerUid(x.f2.uid);drive();
  ok(tag+': committed and resolved without leaving the phase marked',gameState.chain.length===0&&phaseOf()===null&&!pc(),JSON.stringify({chain:gameState.chain.length,phase:phaseOf(),pend:!!pc(),pt:pc()&&pc().title}));
  audit(tag);
} });
globalThis.__confirmBetween=false;

/* ===== M. 明示の指定（将来のカードが使う方法）===== */
API.registerChoiceHandler('u474.noop',()=>{});
function inPrep(fn){const c=mk('アンティ勝負',1);ACTIVATION_PREP_S03={player:1,uid:uid(c),name:'アンティ勝負',afterSeq:0};try{return fn();}finally{ACTIVATION_PREP_S03=null;}}
function openAndRead(open){const ok0=open();const q=pc();const r=q?{sel:q.selection,t:q.targeting,uids:candUids(),kind:q.kind,legacy:q.legacy}:null;if(q)cancelChoiceV49();return r;}
sec('S12',()=>{ { fresh(1);const P=gameState.players;const m1=mon('ライオウ',1),m2=mon('ワイト',1);P[1].mz=[m1,m2];guard(1,m1);baselineA();
  const cands=()=>API.fieldCards({player:1,zone:'mz'});
  const rq=(spec)=>openAndRead(()=>API.requestChoice(Object.assign({player:1,kind:'card',title:'U474 m',candidates:cands(),min:1,max:1,cancelable:true,resume:{handler:'u474.noop',args:{}}},spec)));
  let r=inPrep(()=>openAndRead(()=>API.selectCard('M a',cands(),()=>{})));
  ok('M (a) API.selectCard in a targets:true preparation, no phase: an effect selection, filtered (the protected monster is excluded) — unchanged default',r&&r.sel==='effect'&&r.t===true&&!r.uids.includes(m1.uid)&&r.uids.includes(m2.uid),JSON.stringify(r));
  r=inPrep(()=>openAndRead(()=>API.selectCard('M b',cands(),()=>{},undefined,{selection:'cost'})));
  ok('M (b) API.selectCard(..., {selection:"cost"}) outside any cost window: a cost selection, NOT filtered (opt-in for a cost opened outside cost()/selectTargets)',r&&r.sel==='cost'&&r.t===false&&r.uids.includes(m1.uid)&&r.uids.includes(m2.uid),JSON.stringify(r));
  r=inPrep(()=>withPhase('cost',()=>openAndRead(()=>API.selectCard('M c',cands(),()=>{}))));
  ok('M (c) API.selectCard inside a cost phase with no option: a cost selection (automatic — what cost(ctx,done) gets for free)',r&&r.sel==='cost'&&r.t===false&&r.uids.includes(m1.uid),JSON.stringify(r));
  r=inPrep(()=>withPhase('cost',()=>openAndRead(()=>API.selectCard('M d',cands(),()=>{},undefined,{selection:'effect'}))));
  ok('M (d) {selection:"effect"} inside a cost phase beats the automatic phase: an effect selection, filtered (a real target chosen inside a cost/selectTargets body)',r&&r.sel==='effect'&&r.t===true&&!r.uids.includes(m1.uid),JSON.stringify(r));
  r=inPrep(()=>withPhase('cost',()=>openAndRead(()=>API.selectCard('M e',cands(),()=>{},undefined,{selection:'target'}))));
  ok('M (e) {selection:"target"} is an alias of "effect"',r&&r.sel==='effect'&&r.t===true&&!r.uids.includes(m1.uid),JSON.stringify(r));
  r=rq({targeting:true,selection:'cost'});
  ok('M (f) API.requestChoice({selection:"cost", targeting:true}): a cost selection, NOT filtered, recorded targeting false (a mistaken targeting:true cannot filter a cost)',r&&r.sel==='cost'&&r.t===false&&r.uids.includes(m1.uid)&&!r.legacy,JSON.stringify(r));
  r=rq({targeting:true});
  ok('M (g) API.requestChoice({targeting:true}): an effect selection, filtered (unchanged)',r&&r.sel==='effect'&&r.t===true&&!r.uids.includes(m1.uid),JSON.stringify(r));
  r=rq({});
  ok('M (g2) API.requestChoice({}) (cost default of the registered path — targeting omitted): not filtered, recorded effect/false — the P1.1 cost choices that never state targeting stay unfiltered',r&&r.sel==='effect'&&r.t===false&&r.uids.includes(m1.uid),JSON.stringify(r));
  r=inPrep(()=>withPhase('cost',()=>rq({targeting:true})));
  ok('M (h) a REGISTERED choice does not inherit the ambient phase: requestChoice({targeting:true}) inside a cost window is still an effect selection (registered paths state their own kind)',r&&r.sel==='effect'&&r.t===true&&!r.uids.includes(m1.uid),JSON.stringify(r));
  r=withPhase('cost',()=>openAndRead(()=>API.confirm('M i','?',()=>{},()=>{})));
  ok('M (i) a legacy confirm opened inside a cost phase is recorded as cost (so the chain pick → confirm → pick keeps one classification)',r&&r.sel==='cost'&&r.kind==='yesno',JSON.stringify(r));
  r=openAndRead(()=>API.confirm('M j','?',()=>{},()=>{}));
  ok('M (j) the same confirm outside a cost phase is recorded as effect',r&&r.sel==='effect',JSON.stringify(r));
  ok('M: nothing is left marked',phaseOf()===null,'');
} });

/* ===== J. 選択の記録と Replay — 記録は JSON（Journal の CHOICE_OPEN_V49 に載る）===== */
sec('S13',()=>{ { fresh(1);const P=gameState.players;const m2=mon('ワイト',1);P[1].mz=[m2];baselineA();
  const j0=V41_ACTION_JOURNAL.length;
  API.requestChoice({player:1,kind:'card',title:'U474 j',candidates:API.fieldCards({player:1,zone:'mz'}),selection:'cost',cancelable:true,resume:{handler:'u474.noop',args:{}}});
  const open=V41_ACTION_JOURNAL.slice(j0).map(e=>e.action).find(a=>a.type==='CHOICE_OPEN_V49');
  ok('J: the Journal\'s CHOICE_OPEN_V49 carries the selection kind next to targeting (so Replay and Save/Load carry it)',!!open&&open.choice.selection==='cost'&&open.choice.targeting===false,JSON.stringify(open&&{s:open.choice.selection,t:open.choice.targeting}));
  ok('J: the pending choice in gameState survives a JSON round trip with the selection intact',JSON.parse(JSON.stringify(gameState.pendingChoice)).selection==='cost','');
  answerChoiceV49([pc().candidates[0].key]);
  audit('J'); } });


/* ===== O. 旧 S03-U471 の「ダーク・アームド・ドラゴン / ワーム・キング × アーマー（board A）」— コストが絞られていた誤りの裏返し =====
   S03-U471 のピンは、この2枚がアーマーの下で「選択できるカードが足りません」で終わることを再現として固定していた。原因は、コスト（墓地から闇属性を除外 / 「ワーム」をリリース）の候補に
   対象耐性が掛かっていたこと。コストは対象ではないので、正しくは コストを払い → 本当の対象（装備モンスター）を選び → 解決できる。 */
sec('S14',()=>{ for(const m of ['ダーク・アームド・ドラゴン','ワーム・キング']){
  fresh(1);const P=gameState.players;
  const host=mon('サイバー・ドラゴン',0),armor=armorOn();P[0].mz=[host];
  P[1].grave=[mk('ライオウ',1),mk('クリッター',1),mk('ワイト',1),mk('BF－黒槍のブラスト',1),mk('E・HERO フェザーマン',1)];
  const x=mon(m,1);P[1].mz.push(x);const worm=m==='ワーム・キング'?mon('ワーム・ゼロ',1):null;if(worm)P[1].mz.push(worm);
  baselineA();equipArmor(armor,host);
  ok(m+' fixture: under the Armor every cost candidate of P1 (field monsters / Graveyard monsters) is protected from P1\'s single-target effect',
    targetable(API.fieldCards({player:1,zone:'mz'}),1).length===0&&targetable(API.pileCards(1,'grave',()=>true),1).length===0,'');
  duelActivateFromZone(1,'mz',P[1].mz.indexOf(x),{});
  const q=pc();
  ok(m+': the activation is NOT refused — the cost choice opens (selection "cost", targeting false) although every candidate is Armor-protected',!!q&&q.selection==='cost'&&q.targeting===false&&!TOASTS.includes('選択できるカードが足りません')&&q.candidates.length>=1,JSON.stringify(q&&{selection:q.selection,names:candNames(),toasts:TOASTS}));
  answerChoiceV49([q.candidates[0].key]);
  const q2=pc();
  ok(m+': then the genuine target step: the Armor-equipped host (and the Armor itself) only — an effect selection, filtered',!!q2&&q2.selection==='effect'&&q2.targeting===true&&candNames().join()==='サイバー・ドラゴン,メタルシルバー・アーマー',JSON.stringify(q2&&{selection:q2.selection,names:candNames()}));
  answerUid(host.uid);drive();
  ok(m+': the effect resolves — the host is destroyed; the cost was paid ('+(worm?'a Worm released':'a DARK monster banished')+')',zoneOf(host)==='grave'&&(worm?P[1].grave.length===6:P[1].banish.length===1),JSON.stringify({host:zoneOf(host),grave:P[1].grave.length,banish:P[1].banish.length}));
  audit('O '+m);
} });

/* ===== G. 保存→再開（VM1 で保存、VM2 で再開）— 選択の途中で保存しても分類が同じ =====
   復元できるのは登録ハンドラ経路（registry）の選択だけ（legacy のクロージャは保存を跨げない: S03-U35 が発動を取り消す）。
   G1/G2: 合成ハンドラ（cost / effect の2種類）— 回答後のコールバックで開く次の選択（legacy API.selectCard、targets:true の準備中という前提）が、保存・再開しても同じ分類になる。
   G3: 実カード ジェム・エンハンス（P1.1: コストのリリース → 蘇生対象）— コストの選択の最中に保存して再開しても、コストの候補は絞られず、続きの対象選択は効果の選択。 */
function savedRaw(){saveDuel();return localStorage.getItem(DUEL_SAVE_KEY);}
function buildG(){
  fresh(1);const P=gameState.players;const x={};
  x.m1=mon('ライオウ',1);x.m2=mon('ワイト',1);P[1].mz=[x.m1,x.m2];x.f=mon('はにわ',0);P[0].mz=[x.f];
  guard(1,x.m1);baselineA();globalThis.__G=null;return x;
}
sec('S15',()=>{ for(const kind of ['cost','effect']){
  const x=buildG();globalThis.__GU={m1:x.m1.uid,m2:x.m2.uid};
  API.requestChoice({player:1,kind:'card',title:'U474 G '+kind,candidates:API.fieldCards({player:1,zone:'mz'}),min:1,max:1,cancelable:true,
    selection:kind==='cost'?'cost':undefined,targeting:true,resume:{handler:'u474.'+kind+'-a',args:{}}});
  const q=pc();
  ok('G '+kind+' (VM1): the registered choice is open — selection "'+kind+'", targeting '+(kind==='cost'?'false':'true')+'; the candidates are '+(kind==='cost'?'both (the protected m1 too)':'filtered (m1 excluded)'),
    !!q&&q.selection===kind&&q.targeting===(kind!=='cost')&&candUids().includes(x.m2.uid)&&(candUids().includes(x.m1.uid)===(kind==='cost')),JSON.stringify(q&&{selection:q.selection,targeting:q.targeting,names:candNames()}));
  const raw=savedRaw();const open=candUids().slice();
  const ref=runG(kind);
  ok('G '+kind+' (VM1 reference, no save): the continuation saw phase '+(kind==='cost'?'"cost"':'null')+'; the next legacy selection is classified '+kind+' (and so is the one opened inside ITS callback)',
    ref&&ref.phase===(kind==='cost'?'cost':null)&&ref.second&&ref.second.sel===kind&&ref.third&&ref.third.sel===kind,JSON.stringify(ref));
  globalThis.__SAVES['G'+kind]=JSON.stringify({raw,open,m1:x.m1.uid,m2:x.m2.uid,ref});
} });
/* G3: 実カード ジェム・エンハンス（P1.1）。コストのリリース候補は 神の威光 で守られたジェムナイト（旧から絞られない道）。保存は登録済みの選択の最中 */
sec('S16',()=>{ { fresh(1);const P=gameState.players;
  const amber=mon('ジェムナイト・アンバー',1),aeora=mk('ジェムナイト・アイオーラ',1),plain=mon('ワイト',1);P[1].mz=[amber,plain];P[1].grave=[aeora];guard(1,amber);
  const trap=mk('ジェム・エンハンス',1,'down');trap.setTurn=gameState.turn-1;P[1].sz.push(trap);const si=P[1].sz.length-1;baselineA();
  duelActivateFromZone(1,'sz',si,{});
  const q=pc();
  ok('G3 (VM1): ジェム・エンハンス (P1.1) opens its cost choice as a REGISTERED choice; the 神の威光-protected Gem-Knight is a candidate (targeting false — P1.1 cost choices never state targeting:true)',
    !!q&&q.legacy===false&&q.targeting===false&&candUids().includes(amber.uid)&&candUids().length===1,JSON.stringify(q&&{legacy:q.legacy,targeting:q.targeting,names:candNames()}));
  globalThis.__SAVES.G3=JSON.stringify({raw:savedRaw(),amber:amber.uid,aeora:aeora.uid,trap:trap.uid,open:candUids()});
  cancelChoiceV49(); } });
`);

const SAVES=first.__SAVES||{};
if(!SAVES.Gcost||!SAVES.Geffect||!SAVES.G3){console.log('FAIL Save/Load VM1 saves missing');process.exitCode=2;}
else harness('const SAVES='+JSON.stringify(SAVES)+';'+COMMON+String.raw`
function savedRaw(){saveDuel();return localStorage.getItem(DUEL_SAVE_KEY);}
function loadRaw(raw){resetA();CHOICE_LEGACY_CB_V49.clear();/* 新しいブラウザ起動と同じ: 前の読込で開いた legacy 継続の退避表を空にする */localStorage.setItem(DUEL_SAVE_KEY,raw);TOASTS.length=0;globalThis.__G=null;return offerResumeDuel();}
for(const kind of ['cost','effect']){
  const o=JSON.parse(SAVES['G'+kind]);globalThis.__GU={m1:o.m1,m2:o.m2};
  const resumed=loadRaw(o.raw);const q=pc();
  ok('G '+kind+' (VM2): the save taken in the middle of the selection resumes with the registered choice restored',resumed&&!!q&&q.legacy===false&&q.resume.mode==='registry'&&q.resume.handler==='u474.'+kind+'-a',JSON.stringify({resumed,pend:!!q}));
  ok('G '+kind+' (VM2): the resumed record keeps the classification — selection "'+kind+'", targeting '+(kind==='cost'?'false':'true')+' — and the same candidates as before the save',
    q&&q.selection===kind&&q.targeting===(kind!=='cost')&&JSON.stringify(candUids())===JSON.stringify(o.open),JSON.stringify(q&&{selection:q.selection,targeting:q.targeting,uids:candUids(),open:o.open}));
  const got=runG(kind);
  ok('G '+kind+' (VM2): the continuation after the resume classifies the following selections exactly as the unsaved run did (phase, next selection, the selection opened inside its callback, candidates)',
    JSON.stringify(got)===JSON.stringify(o.ref),JSON.stringify({got,ref:o.ref}));
  ok('G '+kind+' (VM2): '+(kind==='cost'?'the cost continuation offers the protected m1 (not filtered); the third selection (implicit, inside the callback) is still a cost':'the effect continuation filters the protected m1; the third selection (implicit, inside the callback) is still an effect selection'),
    got&&(got.second.u.includes(o.m1)===(kind==='cost'))&&got.third.sel===kind&&(got.third.u.includes(o.m1)===(kind==='cost')),JSON.stringify(got));
  ok('G '+kind+' (VM2): nothing is left marked after the resumed continuation',phaseOf()===null&&ACTIVATION_PREP_S03===null,'');
}
{ const o=JSON.parse(SAVES.G3);const resumed=loadRaw(o.raw);const q=pc();
  ok('G3 (VM2): ジェム・エンハンス — the save taken in the middle of the P1.1 cost choice resumes with the choice and the restore record',resumed&&!!q&&q.legacy===false&&!!gameState.prepTxS03&&gameState.prepTxS03.uid===o.trap,JSON.stringify({resumed,pend:!!q,tx:!!gameState.prepTxS03}));
  ok('G3 (VM2): the cost candidates are unchanged by the save (the protected Gem-Knight is still offered; targeting false)',JSON.stringify(candUids())===JSON.stringify(o.open)&&q.targeting===false&&candUids().includes(o.amber),JSON.stringify({uids:candUids(),open:o.open}));
  answerUid(o.amber);const q2=pc();
  ok('G3 (VM2): after the cost the next choice is the effect target (selection "effect", targeting true) with the Gem-Knight in the Graveyard',!!q2&&q2.selection==='effect'&&q2.targeting===true&&candUids().includes(o.aeora),JSON.stringify(q2&&{selection:q2.selection,targeting:q2.targeting,uids:candUids()}));
  answerUid(o.aeora);
  ok('G3 (VM2): the activation is committed (chain link, restore record closed) and the cost (release) was paid',gameState.chain.length===1&&gameState.prepTxS03===undefined&&zoneOf({uid:o.amber})==='grave',JSON.stringify({chain:gameState.chain.length,amber:zoneOf({uid:o.amber})}));
  drive();
  ok('G3 (VM2): the effect resolves — the Gem-Knight is Special Summoned from the Graveyard',zoneOf({uid:o.aeora})==='mz',JSON.stringify({aeora:zoneOf({uid:o.aeora})}));
  audit('G3 (VM2)'); }
`);

/* ===== S. Node 側の静的な確認（ソース）===== */
const NR=[];const nok=(n,v,d)=>NR.push({name:n,ok:!!v,detail:d||''});
function listJs(dir){return fs.readdirSync(path.join(ROOT,dir)).filter(f=>f.endsWith('.js')).map(f=>path.join(ROOT,dir,f));}
{ /* S1: P1.1 の登録済みコスト選択（ハンドラ名に cost を含む p11cOpen）は targeting:true を宣言しない — 将来のカードの回帰ガード */
  let total=0;const bad=[];
  for(const f of listJs('cards')){
    const s=fs.readFileSync(f,'utf8');
    for(const m of s.matchAll(/p11cOpen\(/g)){
      let d=1,j=m.index+m[0].length;while(j<s.length&&d>0){const c=s[j];if(c==='(')d++;else if(c===')')d--;j++;}
      const call=s.slice(m.index,j);const hs=[...call.matchAll(/'([a-zA-Z0-9]+\.[\w\-]+)'/g)].map(x=>x[1]);
      if(hs.some(h=>/cost/.test(h))){total++;if(/targeting\s*:\s*true/.test(call))bad.push(path.basename(f)+':'+hs.join(','));}
    }
  }
  nok('S1: no P1.1 cost choice (p11cOpen with a *cost* handler; '+total+' call sites) declares targeting:true — the P1.1 path separates cost and target per choice, so it does not have the script-level defect',total>=30&&bad.length===0,JSON.stringify({total,bad}));
}
{ /* S2: filterTargetable を候補に掛けるのは requestChoiceV49 の1か所（targeting===true の時だけ）。cost の選択を渡す経路は selection で外れる */
  const s=fs.readFileSync(path.join(ROOT,'engine/09_choice_request_v49.js'),'utf8');
  const calls=[...s.matchAll(/filterTargetable\(/g)].length;
  nok('S2: engine/09 applies filterTargetable in exactly one place and the guard is the recorded targeting (false for a cost selection)',calls===1&&/const targeting = selection==='cost' \? false : spec\.targeting===true;/.test(s),String(calls));
  const e=fs.readFileSync(path.join(ROOT,'engine/30_processor_chain_battle.js'),'utf8');
  nok('S2: prepareDuelActivation marks the cost in exactly the two cost paths (normal sc.cost, COST_SELECTION_FIRST selectTargets + cost) and nowhere else',
    [...e.matchAll(/runCostPhaseS03\(/g)].length===2&&[...e.matchAll(/withSelectionPhaseS03\('cost'/g)].length===1,'');
}
for(const r of NR)console.log((r.ok?'PASS ':'FAIL ')+r.name+(r.detail?' :: '+r.detail:''));
if(NR.some(r=>!r.ok))process.exitCode=2;
