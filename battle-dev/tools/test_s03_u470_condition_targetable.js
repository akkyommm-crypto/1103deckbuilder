/* S03-U470: 対象を取る発動の condition が、対象耐性で候補が0になる場合を発動の前に断る。
   欠陥（U468 で発見・本単位で再現して分類）: condition は生のプール（「墓地にモンスターがいる」など）だけを見て通る → 発動が始まり
   カードが表になる（engine/30 prepareDuelActivation の FX_SET_STATE face:'up'）→ 対象選択が filterTargetable で全候補を失い
   requestChoiceV49 が「選択できるカードが足りません」で false を返す → 継続が呼ばれず finishPrepare も onAbort も走らない
   → 罠/魔法が魔法・罠ゾーンに表で残り、チェーンも選択も無い。
   本単位（part C）は共有エンジンを変えず、再現できた主要デッキのカードの condition を API.targetableCardsS03 で絞る（U468 の死者蘇生と同じ形）:
     リビングデッドの呼び声 / リミット・リバース / ヒーロー・ブラスト（墓地: メタルシルバー・アーマー）、幻獣の角 / 六武衆の荒行（自分のモンスター: アーマー）、
     強制脱出装置 / 月の書 / 禁じられた聖槍 / 精神操作 / デュアルスパーク（場: 全モンスターが対象耐性 = オベリスクの巨神兵だけの場）。
   複数のカードを対象にする主要カード（貪欲な壺 / 諸刃の活人剣術 / 毒蛇の供物 / TGX3－DX2 / ゴッドバードアタック）は再現できたが、
   1103の裁定「複数のカードを対象にする効果の場合、発動を制限することはできません。よって発動することができます。」（2009-06-18, WIKI-32A7C5F81B06）と
   食い違うため触らない（U468 の RULING_UNRESOLVED）。
   固定する4つの形:
     1. 再現: 発動は始まらず、罠は裏のまま・魔法は手札のまま、チェーンも Journal もコストも動かない。理由が表示される。
     2. 通常発動: 対象に取れるカードがあれば最後まで動く（コントローラー自身の発動はアーマーの影響を受けない、候補が残る場合も含む）。
     3. 手動キャンセル: 対象選択を開いてやめる — S03-U471（part B）で発動前の状態へ戻るようになった。U470 で固定していた「戻らない」ピンは、
        S03-U471 の依頼（ユーザー承認済みの期待値変更）に従って修正済み（下のコメント参照）。
     4. コスト支払い済みの失敗: S03-U471（part B）でコストもカードも発動前に戻るようになった。同じく期待値を修正済み。
   Save/Load: U468 と同じ2VM方式。 */
const harness=require('./astra_harness');
const first=harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function mon(name,p,face,pos){const c=mk(name,p,face||'up',pos||'atk');c.summonedTurn=3;return c;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function C(c){const h=findCardByUid(c.uid);return h?h.card:null;}
function uid(c){return ensureCardUid(gameState,c);}
/* allowEmpty: 断られた場合は Journal に何も載らない（盤面作りだけの局面）。0件でも digest の整合は確かめる */
function audit(label,allowEmpty){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',(allowEmpty||pkg.actions.length>0)&&a.ok,JSON.stringify(a).slice(0,240));}
function candUids(){const q=pc();return q?q.candidates.map(c=>c.uid!=null?c.uid:(c.card?c.card.uid:null)):[];}
let PREFER=[];
function pickU(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}let j=-1;
  for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||(x.card&&x.card.uid===u));if(j>=0)break;}
  __choicePickV49(j>=0?j:0);}
function driveU(){for(let i=0;i<800;i++){
  if(pc()){pickU();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
/* 盤面（U468 と同じ道具）:
   board 'A' … メタルシルバー・アーマー（P0）が P0 の サイバー・ドラゴン に装備されている。相手（P1）の効果は、装備モンスター以外の
               お互いの場・墓地のモンスターを対象にできない。own=true ならカードの持ち主はアーマーのコントローラー（P0）自身。
   board 'C' … 両者の場に オベリスクの巨神兵 だけがいる（自身のテキストで効果の対象にならない）。mode 'ctl' は両方を普通のモンスターにした対照、
               mode 'partial' は P0 に対象に取れる普通のモンスターが1体残る。 */
const ARM='メタルシルバー・アーマー',OBE='オベリスクの巨神兵';
function fresh(active){resetA();gameState.activePlayer=active;gameState.firstPlayer=0;gameState.turn=6;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4700002;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function build(spec){
  const o=spec.own?0:1;fresh(o);
  const P=gameState.players,x={o};
  if(spec.board==='A'){
    x.host=mon('サイバー・ドラゴン',0);x.other=mon('ライオウ',0);x.armor=mk(ARM,0,'up');
    P[0].mz=[x.host,x.other];P[0].sz=[x.armor];
    x.beast=mon('ジェネティック・ワーウルフ',o);x.crit=mon('クリッター',o,'up','def');
    P[o].mz=P[o].mz.concat([x.beast,x.crit]);
    x.gA=mk('ライオウ',o);x.gB=mk('クリッター',o);P[o].grave=[x.gA,x.gB];
    if(o===1){x.gF=mk('ワイト',0);P[0].grave=[x.gF];}
  }else{
    const nm=spec.mode==='ctl'?'ライオウ':OBE;
    x.m0=mon(nm,0);x.m1=mon(nm,1);P[0].mz=[x.m0];P[1].mz=[x.m1];
    if(spec.mode==='partial'){x.plain=mon('ライオウ',0);P[0].mz.push(x.plain);}
  }
  if(spec.extra)spec.extra(x,P,o);
  x.card=mk(spec.card,o,'up');
  if(spec.set){x.card.face='down';x.card.setTurn=gameState.turn-1;P[o].sz.push(x.card);x.szIdx=P[o].sz.length-1;}
  else P[o].hand=[x.card];
  baselineA();
  if(spec.board==='A'&&spec.mode!=='ctl')API.equipSpell(locateCardAnyV4(x.armor),locateCardAnyV4(x.host),'S03-U470 fixture');
  return x;}
/* 発動を1回試みて、結果（提示されたか・理由・状態の変化）を返す */
function attempt(x,spec){
  const o=x.o,P=gameState.players[o];TOASTS.length=0;
  const j0=V41_ACTION_JOURNAL.length,lp0=P.lp;
  let L=null,ids;
  if(spec.set){L=strictScriptLegalityV2(spec.card,o,'sz',x.szIdx,{});ids=getLegalZoneActions(o,'sz',x.szIdx).map(a=>a.id);}
  else ids=getLegalHandActions(o,0).map(a=>a.id);
  const offered=ids.indexOf(spec.set?'activateSet':'activate')>=0;
  if(spec.set)duelActivateFromZone(o,'sz',x.szIdx,{});else duelActivateFromHand(0);
  const h=findCardByUid(x.card.uid);
  return {offered,reason:L?L.reason:null,toast:TOASTS.slice(-1)[0]||null,pend:!!pc(),chain:gameState.chain.length,
    zone:h?h.zone:null,face:h?h.card.face:null,jd:V41_ACTION_JOURNAL.length-j0,lpd:P.lp-lp0,hand:P.hand.length,szN:P.sz.length};}

/* 対象にした効果が最後まで動いたことの観測（カードごと） */
const CARDS=[
 {card:'リビングデッドの呼び声',set:true,board:'A',pick:x=>x.gB,done:x=>z(x.gB)==='mz'&&z(x.card)==='sz'},
 {card:'リミット・リバース',set:true,board:'A',pick:x=>x.gB,done:x=>z(x.gB)==='mz'&&z(x.card)==='sz'},
 {card:'幻獣の角',set:true,board:'A',pick:x=>x.beast,done:x=>!!(C(x.card)&&C(x.card).equipTo&&C(x.card).equipTo.uid===x.beast.uid)&&z(x.card)==='sz'},
 {card:'強制脱出装置',set:true,board:'C',pick:x=>x.plain||x.m0,done:x=>z(x.plain||x.m0)==='hand'},
 {card:'月の書',set:false,board:'C',pick:x=>x.plain||x.m0,done:x=>C(x.plain||x.m0).face==='down'},
 {card:'禁じられた聖槍',set:false,board:'C',pick:x=>x.plain||x.m0,done:x=>!!C(x.plain||x.m0).spearProofS03},
 {card:'精神操作',set:false,board:'C',pick:x=>x.plain||x.m0,done:x=>{const h=findCardByUid((x.plain||x.m0).uid);return !!h&&h.p===1&&h.zone==='mz';}},
 /* 単体対象でコストのあるカード・墓地/場の自分のモンスターを対象にするカード（再現できた主要デッキの残り3枚） */
 {card:'ヒーロー・ブラスト',set:true,board:'A',extra:(x,P,o)=>{x.hero=mk('E・HERO フェザーマン',o);P[o].grave.push(x.hero);},pick:x=>x.hero,done:x=>z(x.hero)==='hand'},
 {card:'六武衆の荒行',set:false,board:'A',extra:(x,P,o)=>{if(o===0)P[0].mz=P[0].mz.filter(m=>m!==x.crit);x.six=mon('六武衆のご隠居',o);P[o].mz.push(x.six);x.deckSix=mk('六武衆の影武者',o);P[o].deck.push(x.deckSix);},pick:x=>x.six,done:x=>z(x.deckSix)==='mz'},
 {card:'デュアルスパーク',set:false,board:'C',extra:(x,P,o)=>{x.dual=mon('E・HERO アナザー・ネオス',1);P[1].mz.push(x.dual);},pick:x=>x.plain||x.m0,picks:x=>[x.dual.uid,(x.plain||x.m0).uid],done:x=>z(x.plain||x.m0)==='grave'&&z(x.dual)==='grave'},
];
function pickList(c,x){return c.picks?c.picks(x):[c.pick(x).uid];}
function specOf(c,mode,own){return {card:c.card,set:c.set,board:c.board,mode,own:!!own,extra:c.extra};}
function nothingStarted(r,label){
  ok(label+': not offered in the legal action list',!r.offered,JSON.stringify(r));
  ok(label+': no choice opened, no chain link',!r.pend&&r.chain===0,JSON.stringify(r));
  ok(label+': nothing journaled, no cost paid',r.jd===0&&r.lpd===0,JSON.stringify(r));
}

/* ===== 形1: 再現 — 活動は始まらず、カードは動かない（全7枚）===== */
for(const c of CARDS){
  const spec=specOf(c,'imm');
  const x=build(spec);const r=attempt(x,spec);
  nothingStarted(r,c.card+' (board '+c.board+')');
  ok(c.card+': a reason about the missing targetable monster is shown (legality '+(c.set?'and toast':'toast')+')',
    /対象にできる/.test(r.toast||'')&&(!c.set||/対象にできる/.test(r.reason||'')),JSON.stringify({toast:r.toast,reason:r.reason}));
  if(c.set)ok(c.card+': the Set card stays face-down in the Spell & Trap Zone',r.zone==='sz'&&r.face==='down'&&r.szN>=1,JSON.stringify(r));
  else ok(c.card+': the Spell stays in the hand (never moved to the Spell & Trap Zone)',r.zone==='hand'&&r.hand===1&&r.szN===0,JSON.stringify(r));
  audit(c.card+' refused',true);
}
/* 利用者の再現そのもの（プロンプトの計測値）: 罠が表になって残る状態が無くなる */
{ const spec={card:'リビングデッドの呼び声',set:true,board:'A',mode:'imm'};const x=build(spec);
  const r=attempt(x,spec);
  ok('RESPONSE repro (サイバー・ドラゴン + メタルシルバー・アーマー, only monsters in the opponent Graveyard): was {chain:0,sz:1,face:up}, now stays face-down',
    r.chain===0&&r.szN===1&&r.face==='down'&&!r.pend,JSON.stringify(r));
  ok('RESPONSE repro: the toast is the targetable-monster reason, not 「選択できるカードが足りません」',r.toast&&r.toast.indexOf('選択できるカードが足りません')<0&&/対象にできる/.test(r.toast),String(r.toast)); }
/* 対照B（元から動いている形）: 墓地が空 → 元の理由で断られ、裏のまま */
{ const spec={card:'リビングデッドの呼び声',set:true,board:'A',mode:'imm'};const x=build(spec);
  gameState.players[1].grave=[];const r=attempt(x,spec);
  ok('control B: an empty Graveyard is still refused with the original reason and stays face-down',!r.offered&&r.face==='down'&&r.jd===0&&/墓地にモンスターがいません/.test(r.toast||''),JSON.stringify(r)); }

/* ===== 形2: 通常発動 — 対象に取れるカードがあれば最後まで動く ===== */
for(const c of CARDS){
  /* 2a. 対照: 耐性なし */
  { const spec=specOf(c,'ctl');const x=build(spec);const r=attempt(x,spec);
    ok(c.card+' control (no immunity): offered, the target choice opens (card '+(c.set?'flipped':'moved')+' as usual)',r.offered&&r.pend,JSON.stringify(r));
    PREFER=pickList(c,x);driveU();PREFER=[];
    ok(c.card+' control: the activation resolves end to end',c.done(x)&&gameState.chain.length===0,JSON.stringify({chain:gameState.chain.length}));
    audit(c.card+' control'); }
  /* 2b. 耐性あり・対象に取れるカードが残る */
  if(c.board==='C'){
    const spec=specOf(c,'partial');const x=build(spec);const r=attempt(x,spec);
    ok(c.card+' partial (one targetable monster left): offered and the choice opens',r.offered&&r.pend,JSON.stringify(r));
    let cu;
    if(c.picks){PREFER=[c.picks(x)[0]];pickU();PREFER=[];cu=candUids();}   /* コストの選択を先に済ませ、次の対象選択の候補を見る */
    else cu=candUids();
    ok(c.card+' partial: the protected オベリスクの巨神兵 are not candidates, the plain monster is',cu.indexOf(x.m0.uid)<0&&cu.indexOf(x.m1.uid)<0&&cu.indexOf(x.plain.uid)>=0,JSON.stringify(cu));
    PREFER=pickList(c,x);driveU();PREFER=[];
    ok(c.card+' partial: resolves end to end on the remaining monster',c.done(x)&&gameState.chain.length===0,'');
    audit(c.card+' partial');
  }
  /* 2c. アーマーのコントローラー自身の発動（相手の効果だけを防ぐ） */
  if(c.board==='A'){
    const spec=specOf(c,'imm',true);const x=build(spec);const r=attempt(x,spec);
    ok(c.card+' (the Armor controller own activation, opponent-only immunity): offered and the target choice opens',r.offered&&r.pend,JSON.stringify(r));
    PREFER=pickList(c,x);driveU();PREFER=[];
    ok(c.card+' own: resolves end to end under the Armor',c.done(x)&&gameState.chain.length===0,'');
    audit(c.card+' own under Armor');
  }
}
/* アーマーが居なくなれば相手も発動できる（U468 の対照と同じ） */
{ const spec={card:'リビングデッドの呼び声',set:true,board:'A',mode:'imm'};const x=build(spec);
  const r0=attempt(x,spec);API.sendToGrave(locateCardAnyV4(x.armor),'S03-U470 fixture');
  const r1=attempt(x,spec);
  ok('リビングデッドの呼び声: refused under the Armor, offered once the Armor has left the field',!r0.offered&&r1.offered&&r1.pend,JSON.stringify([r0.offered,r1.offered,r1.pend]));
  PREFER=[x.gB.uid];driveU();PREFER=[];
  ok('リビングデッドの呼び声 after the Armor left: the opponent revives its Graveyard monster',z(x.gB)==='mz',z(x.gB));
  audit('リビングデッドの呼び声 armor gone'); }
/* 死者蘇生（U468）が壊れていない */
{ const spec={card:'死者蘇生',set:false,board:'A',mode:'imm'};const x=build(spec);const r=attempt(x,spec);
  nothingStarted(r,'死者蘇生 (U468) under the Armor'); }

/* ===== 形3: 手動キャンセル =====
   U470 の計測: 対象選択（legacy API.selectCard）には onCancel が無く、cancelChoiceV49 の継続は「選択を閉じる」だけで中止処理を呼ばなかったため、
   発動の入口で表にしたカードが魔法・罠ゾーンに表のまま残っていた（チェーン無し・選択無し）— 既知の欠陥として「今の挙動」を固定していた。
   S03-U471（part B）で発動準備トランザクションが入り、キャンセルは発動前の状態へ戻る。以下の期待値の変更（表→裏のまま／手札に戻る／Journal に中止が1件載る／
   再び発動できる）は、S03-U471 の依頼でユーザー承認済み（Opus からの指示。「手動キャンセルは区別でき、発動前の状態へ戻す」）。 */
{ const spec={card:'リビングデッドの呼び声',set:true,board:'A',mode:'ctl'};const x=build(spec);
  const g0=gameState.players[1].grave.length,lp0=gameState.players[1].lp;
  const r=attempt(x,spec);
  ok('cancel pin: the Set 《リビングデッドの呼び声》 opens a cancelable target choice',r.pend&&pc().cancelable===true&&r.face==='up',JSON.stringify({pend:r.pend,face:r.face}));
  const j1=V41_ACTION_JOURNAL.length;
  cancelChoiceV49();
  const h=findCardByUid(x.card.uid);
  ok('cancel (S03-U471): the choice is gone and no chain link exists',!pc()&&gameState.chain.length===0,JSON.stringify({pend:!!pc(),chain:gameState.chain.length}));
  ok('cancel (S03-U471, expectation changed per the U471 brief): the trap is turned back FACE-DOWN in the Spell & Trap Zone (pre-activation state; U470 pinned face-up)',h.zone==='sz'&&h.card.face==='down',JSON.stringify({zone:h.zone,face:h.card.face}));
  ok('cancel pin: nothing else changed — no revival, Graveyard and LP untouched',gameState.players[1].grave.length===g0&&gameState.players[1].lp===lp0&&z(x.gB)==='grave',JSON.stringify({g:gameState.players[1].grave.length,lp:gameState.players[1].lp}));
  ok('cancel (S03-U471, expectation changed per the U471 brief): after the choice opened the journal gets the cancel and exactly one abort (reason cancel); U470 pinned the cancel alone',V41_ACTION_JOURNAL.length-j1===2&&V41_ACTION_JOURNAL[V41_ACTION_JOURNAL.length-2].action.type==='CHOICE_CANCEL_V49'&&V41_ACTION_JOURNAL[V41_ACTION_JOURNAL.length-1].action.type==='PREP_TX_ABORT_S03'&&V41_ACTION_JOURNAL[V41_ACTION_JOURNAL.length-1].action.reason==='cancel',JSON.stringify(V41_ACTION_JOURNAL.slice(j1).map(e=>e.action.type+':'+(e.action.reason||''))));
  const ids=getLegalZoneActions(1,'sz',x.szIdx).map(a=>a.id);
  ok('cancel (S03-U471, expectation changed per the U471 brief): the trap offers its activation again (re-operable; U470 pinned that the card was lost)',ids.indexOf('activateSet')>=0,JSON.stringify(ids));
  audit('cancel pin (Set trap)'); }
{ const spec={card:'月の書',set:false,board:'C',mode:'ctl'};const x=build(spec);
  const r=attempt(x,spec);
  ok('cancel pin: 月の書 from the hand opens a cancelable target choice (it was moved to the Spell & Trap Zone first)',r.pend&&pc().cancelable===true&&r.zone==='sz'&&r.hand===0,JSON.stringify(r));
  cancelChoiceV49();
  const h=findCardByUid(x.card.uid);
  ok('cancel (S03-U471, expectation changed per the U471 brief): the Spell is returned to the hand (pre-activation state), no chain link; U470 pinned that it stayed in the Spell & Trap Zone',!pc()&&gameState.chain.length===0&&h.zone==='hand'&&gameState.players[1].hand.length===1&&gameState.players[1].sz.length===0,JSON.stringify({zone:h.zone,hand:gameState.players[1].hand.length,chain:gameState.chain.length}));
  ok('cancel pin: the monsters on the field are untouched',C(x.m0).face==='up'&&C(x.m1).face==='up',''); audit('cancel pin (hand Spell)'); }

/* ===== 形4: コスト支払い済みの失敗 =====
   U470 は「コストは戻らず、カードは表で残る」を現行の欠陥として固定していた。S03-U471（part B）の発動準備トランザクションでコストもカードも発動前に戻る
   （依頼: 洗脳－ブレインコントロール「LP が失われカードが魔法・罠ゾーンに表で残る」→ 修復後は両方戻る）。下の 2 件（コスト／カード）は、その依頼に従った期待値の変更。
   合成カード（スクリプトはテストVM内だけ。実カードが後でガードされても固定が崩れない）: condition が生のプールだけを見て通り、
   cost で 1000LP を払い、その後の対象選択で全候補が対象耐性で消える。実カードの同形（計測、未修正のため参考）:
   洗脳－ブレインコントロール（800LP, オベリスクだけの場）/ 早すぎた埋葬（800LP, アーマー + 墓地）/ 自律行動ユニット（1500LP, アーマー）/
   ゴッドバードアタック（リリースした鳥獣族が戻らない, 複数対象のため未修正）。 */
defineScript('アンティ勝負',{
  type:'spell',priority:1,targets:true,
  condition(ctx){ if(!API.fieldCards({zone:'mz'}).length){ ctx.reason='フィールドにモンスターがいません'; return false; } return true; },
  cost(ctx,done){ API.payCost(ctx.player,1000); done(true); },
  selectTargets(ctx,done){ API.selectCard('テスト：対象',API.fieldCards({zone:'mz'}),t=>done([t])); },
  resolve(){}
});
defineScript('エクスチェンジ',{
  type:'spell',priority:1,
  condition(){ return true; },
  cost(ctx,done){ done(false); },
  resolve(){}
});
{ const spec={card:'アンティ勝負',set:false,board:'C',mode:'imm'};const x=build(spec);
  const r=attempt(x,spec);const h=findCardByUid(x.card.uid);
  ok('cost-paid failure: the synthetic Spell passes condition (the raw pool is not empty) and is offered',r.offered,JSON.stringify(r));
  ok('cost-paid failure (S03-U471, expectation changed per the U471 brief): the 1000 LP cost is restored (8000); U470 pinned 7000',gameState.players[1].lp===8000,JSON.stringify({lpd:r.lpd,lp:gameState.players[1].lp}));
  ok('cost-paid failure (S03-U471, expectation changed per the U471 brief): the card is back in the hand, not stranded face-up in the Spell & Trap Zone',h.zone==='hand'&&gameState.players[1].hand.length===1&&gameState.players[1].sz.length===0,JSON.stringify({zone:h.zone,face:h.card.face,hand:gameState.players[1].hand.length}));
  ok('cost-paid failure: no chain link and no choice; the player sees 「選択できるカードが足りません」',r.chain===0&&!r.pend&&r.toast==='選択できるカードが足りません',JSON.stringify({chain:r.chain,pend:r.pend,toast:r.toast}));
  ok('cost-paid failure: the LP payment is journaled and then undone by the single abort (Replay carries both)',V41_ACTION_JOURNAL.some(e=>/LP|PAY/.test(e.action.type))&&V41_ACTION_JOURNAL[V41_ACTION_JOURNAL.length-1].action.type==='PREP_TX_ABORT_S03',JSON.stringify(V41_ACTION_JOURNAL.map(e=>e.action.type)));
  audit('cost-paid failure pin'); }
/* 対照（今も動いている中止）: cost 自体が払えない時は onAbort が走り、カードは手札へ戻りコストも動かない */
{ const spec={card:'エクスチェンジ',set:false,board:'C',mode:'imm'};const x=build(spec);
  const r=attempt(x,spec);const h=findCardByUid(x.card.uid);
  ok('cost-fail control: when the cost itself cannot be paid the Spell is returned to the hand (opts.onAbort) with 「コストを払えません」',h.zone==='hand'&&r.szN===0&&r.chain===0&&r.toast==='コストを払えません'&&r.lpd===0,JSON.stringify(r));
  audit('cost-fail control'); }

/* ===== Save/Load: 保存データは対象を選び終えてチェーンに載せた状態、または発動前の状態（対象選択プロンプトそのものは legacy クロージャで保存できない）===== */
globalThis.__SAVES={};
function saveCase(key,extra){globalThis.__SAVES[key]=JSON.stringify(Object.assign({state:gameState,digest:v41StateDigest(gameState)},extra||{}));}
function addFinal(key){globalThis.__SAVES[key]=JSON.stringify(Object.assign(JSON.parse(globalThis.__SAVES[key]),{final:v41StateDigest(gameState)}));}
/* SL1: 発動前（アーマーの下で断られる形）— 保存 → 読込後も断られ、アーマーが居なくなれば発動できる */
{ const spec={card:'リビングデッドの呼び声',set:true,board:'A',mode:'imm'};const x=build(spec);
  const r=attempt(x,spec);
  ok('Save/Load SL1 setup: refused before saving',!r.offered&&r.face==='down',JSON.stringify(r));
  saveCase('SL1',{ids:{card:uid(x.card),armor:uid(x.armor),gB:uid(x.gB),gA:uid(x.gA)},szIdx:x.szIdx}); }
/* SL2: コントローラー自身の発動（アーマーの下）— 対象選択後、チェーン上で保存 */
{ const spec={card:'リビングデッドの呼び声',set:true,board:'A',mode:'imm',own:true};const x=build(spec);
  const r=attempt(x,spec);PREFER=[x.gA.uid];for(let n=0;n<10&&pc();n++)pickU();PREFER=[];
  ok('Save/Load SL2 setup: the Armor controller own activation is on the chain with the target chosen',r.offered&&gameState.chain.length===1&&!!gameState.chain[0].targets,JSON.stringify({offered:r.offered,chain:gameState.chain.length}));
  saveCase('SL2',{ids:{card:uid(x.card),gA:uid(x.gA),gB:uid(x.gB)}});
  driveU();
  ok('Save/Load SL2 VM1 reference: the own 《リビングデッドの呼び声》 revived the chosen monster',z(x.gA)==='mz',z(x.gA));
  addFinal('SL2'); }
/* SL3: 場のカード — オベリスクが居ても対象に取れる普通のモンスターが残る時、月の書が通る。チェーン上で保存 */
{ const spec={card:'月の書',set:false,board:'C',mode:'partial'};const x=build(spec);
  const r=attempt(x,spec);const cu=candUids();
  PREFER=[x.plain.uid];for(let n=0;n<10&&pc();n++)pickU();PREFER=[];
  ok('Save/Load SL3 setup: 月の書 is on the chain, the オベリスクの巨神兵 were not candidates',r.offered&&cu.indexOf(x.m0.uid)<0&&gameState.chain.length===1&&!!gameState.chain[0].targets,JSON.stringify({cu,chain:gameState.chain.length}));
  saveCase('SL3',{ids:{card:uid(x.card),m0:uid(x.m0),plain:uid(x.plain)}});
  driveU();
  ok('Save/Load SL3 VM1 reference: the plain monster was set face-down, the オベリスクの巨神兵 untouched',C(x.plain).face==='down'&&C(x.m0).face==='up',JSON.stringify([C(x.plain).face,C(x.m0).face]));
  addFinal('SL3'); }
/* SL4: 手札の月の書がオベリスクだけの場で断られる形を保存 */
{ const spec={card:'月の書',set:false,board:'C',mode:'imm'};const x=build(spec);
  const r=attempt(x,spec);
  ok('Save/Load SL4 setup: refused, the Spell is still in the hand',!r.offered&&r.zone==='hand',JSON.stringify(r));
  saveCase('SL4',{ids:{card:uid(x.card),m0:uid(x.m0)}}); }
`);

/* ===== VM2: 新しいエンジンが保存データを読み込んで続行する ===== */
const SAVES=first.__SAVES||{};
if(!SAVES.SL1||!SAVES.SL2||!SAVES.SL3||!SAVES.SL4){console.log('FAIL Save/Load VM1 saves missing');process.exitCode=2;}
else harness('const SAVES='+JSON.stringify(SAVES)+';'+String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function zoneOf(u){const x=findCardByUid(u);return x?x.zone:null;}
function faceOf(u){const x=findCardByUid(u);return x?x.card.face:null;}
let PREFER=[];
function pickU(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}let j=-1;
  for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||(x.card&&x.card.uid===u));if(j>=0)break;}
  __choicePickV49(j>=0?j:0);}
function driveU(){for(let i=0;i<800;i++){
  if(pc()){pickU();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function load(key){const o=JSON.parse(SAVES[key]);resetA();gameState=o.state;EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;
  if(typeof v41EnsureReplayState==='function')v41EnsureReplayState(gameState);
  if(typeof v41SyncJournalToState==='function')v41SyncJournalToState(gameState);
  reconcileChoiceAfterLoadV49(gameState);return o;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}

/* SL1 */
{ const o=load('SL1'),I=o.ids;
  ok('Save/Load SL1: the loaded state is the saved state (digest) in the opponent turn',v41StateDigest(gameState)===o.digest&&gameState.activePlayer===1,'');
  const L=strictScriptLegalityV2('リビングデッドの呼び声',1,'sz',o.szIdx,{});
  ok('Save/Load SL1 loaded: the Armor immunity is recomputed from the loaded state — still refused up front, with the targetable-monster reason',!L.ok&&/対象にできる/.test(L.reason||''),JSON.stringify(L));
  TOASTS.length=0;const j0=V41_ACTION_JOURNAL.length;duelActivateFromZone(1,'sz',o.szIdx,{});
  ok('Save/Load SL1 loaded: trying to activate leaves the trap face-down with no journal step and no chain',faceOf(I.card)==='down'&&V41_ACTION_JOURNAL.length===j0&&gameState.chain.length===0&&!pc(),JSON.stringify({face:faceOf(I.card),chain:gameState.chain.length}));
  API.sendToGrave(locateCardAnyV4(findCardByUid(I.armor).card),'S03-U470 load');
  const L2=strictScriptLegalityV2('リビングデッドの呼び声',1,'sz',o.szIdx,{});
  ok('Save/Load SL1 loaded: once the Armor leaves the field the activation is legal',L2.ok,JSON.stringify(L2));
  PREFER=[I.gB];duelActivateFromZone(1,'sz',o.szIdx,{});driveU();PREFER=[];
  ok('Save/Load SL1 resumed: the opponent revives its Graveyard monster',zoneOf(I.gB)==='mz'&&zoneOf(I.card)==='sz',JSON.stringify([zoneOf(I.gB),zoneOf(I.card)]));
  audit('Save/Load SL1'); }
/* SL2 */
{ const o=load('SL2'),I=o.ids;
  ok('Save/Load SL2: loaded with the own 《リビングデッドの呼び声》 on the chain (digest equal)',v41StateDigest(gameState)===o.digest&&gameState.chain.length===1,'');
  driveU();
  ok('Save/Load SL2 resumed: the chain resolves and the chosen Graveyard monster is revived',zoneOf(I.gA)==='mz'&&zoneOf(I.card)==='sz'&&faceOf(I.card)==='up',JSON.stringify([zoneOf(I.gA),zoneOf(I.card)]));
  ok('Save/Load SL2 resumed: the final digest equals the uninterrupted VM1 run',v41StateDigest(gameState)===o.final,v41StateDigest(gameState)+' vs '+o.final);
  audit('Save/Load SL2'); }
/* SL3 */
{ const o=load('SL3'),I=o.ids;
  ok('Save/Load SL3: loaded with 月の書 on the chain (digest equal)',v41StateDigest(gameState)===o.digest&&gameState.chain.length===1,'');
  driveU();
  ok('Save/Load SL3 resumed: the plain monster is set face-down, the オベリスクの巨神兵 untouched',faceOf(I.plain)==='down'&&faceOf(I.m0)==='up',JSON.stringify([faceOf(I.plain),faceOf(I.m0)]));
  ok('Save/Load SL3 resumed: the final digest equals the uninterrupted VM1 run',v41StateDigest(gameState)===o.final,v41StateDigest(gameState)+' vs '+o.final);
  audit('Save/Load SL3'); }
/* SL4 */
{ const o=load('SL4'),I=o.ids;
  ok('Save/Load SL4: loaded (digest equal) with 月の書 in the hand',v41StateDigest(gameState)===o.digest&&zoneOf(I.card)==='hand','');
  const ids=getLegalHandActions(1,0).map(a=>a.id);
  ok('Save/Load SL4 loaded: 月の書 is still not offered against a field of only オベリスクの巨神兵',ids.indexOf('activate')<0,JSON.stringify(ids));
  const j0=V41_ACTION_JOURNAL.length;duelActivateFromHand(0);
  ok('Save/Load SL4 loaded: trying leaves the Spell in the hand, nothing journaled, the state digest is unchanged',zoneOf(I.card)==='hand'&&V41_ACTION_JOURNAL.length===j0&&gameState.chain.length===0&&v41StateDigest(gameState)===o.digest,''); }
`);
