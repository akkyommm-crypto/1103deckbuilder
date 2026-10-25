/* S03-U473: 《次元幽閉》は対象を取る罠（targets:true）。
   カードの文言（data/carddata.json の e）: 「相手モンスターの攻撃宣言時、攻撃モンスター1体を選択して発動できる。選択した攻撃モンスターをゲームから除外する。」
   欠陥: スクリプトが type:"trap", priority:2 だけで targets:true を持たず、API.selectCard が targeting=false を導き、filterTargetable（対象耐性）が
   一度も掛からなかった。また、対象にできる攻撃モンスターが無い時にも発動が始まれてしまう（U470 と同じ形。次元幽閉は主要デッキ5本に入っている）。
   根拠（正直に）: 裁定アーカイブ（wiki-rulings.js）に 次元幽閉 のエントリは 0 件。「対象を取る」の根拠は 1103 当時の文言「選択して」と、
   このプロジェクトの既存の運用（「選択して」の効果を targets:true と宣言する）による。裁定が存在するとは言わない。
   固定する4つの面:
     1. 対象の確定 — 選んだ攻撃モンスターがチェーンリンクの targets に記録され（uid）、JSON往復でも残り、除外のアクションの発生源（srcS03.tg）にも載る。
     2. 耐性判定 — 対象耐性（ホルスのしもべ→ホルスの黒炎竜 LV4、オベリスクの巨神兵）のある攻撃モンスターは選べず、発動できない。対照: 耐性が無ければ選べる。
        耐性は攻撃モンスター本人にだけ掛ける（他の攻撃済みモンスターに切り替わらない — 以前の「attacked なモンスター全て」を現在の攻撃モンスターへ絞った修正）。
     3. 正常発動 — 攻撃宣言 → 発動 → 対象選択 → 解決（攻撃モンスターが除外される）→ 攻撃が止まる（ダメージ無し・pendingAttack が消える）。
     4. Replay — 全シナリオの Replay audit と、Save/Load（2VM）。
   U471 の準備トランザクション: 条件が生のプールを見る旧形（このテストの VM 内だけで再現）では、対象耐性で候補が空になった時に発動は始まらずに戻る（中止）。
   Cards named: 次元幽閉; 対照/道具 ホルスのしもべ, ホルスの黒炎竜 LV4, オベリスクの巨神兵, サイバー・ドラゴン, ライオウ, ワイト, 強制脱出装置。 */
const harness=require('./astra_harness');
const first=harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
const DIM='次元幽閉',HOR='ホルスの黒炎竜 LV4',SERV='ホルスのしもべ',OBE='オベリスクの巨神兵';
function pc(){return pendingChoiceV49(gameState);}
function zoneOf(c){const h=findCardByUid(c.uid);return h?(h.p+':'+h.zone):null;}
function faceOf(c){const h=findCardByUid(c.uid);return h?h.card.face:null;}
function uidOf(c){return ensureCardUid(gameState,c);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest and the final state',pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,240));}
function jtypes(j0){return V41_ACTION_JOURNAL.slice(j0).map(e=>e.action.type+(/^PREP_TX/.test(e.action.type)&&e.action.reason?':'+e.action.reason:''));}
/* 一歩進める（選択は呼び出し側が答える）。進めたら種別、何も無ければ null */
function step(){
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();return 'evt';}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();return 'chain';}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();return 'point';}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();return 'pump';}
  return null;}
function settle(){for(let i=0;i<400;i++){if(pc()){__choicePickV49(0);continue;}if(!step())return 'idle';}return 'loop';}
function atWindow(){const w=gameState.processorWaiting;return !!(w&&w.type==='POINT'&&gameState.processorPaused&&(w.payload||{}).kind==='attackDeclare');}
/* 攻撃宣言の窓まで進める。応答できるカードが誰にも無ければ窓では止まらず攻撃が進む */
function toWindow(){for(let i=0;i<120;i++){
  if(atWindow())return true;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){eventSkipGroupV2();continue;}
  if(pc()){__choicePickV49(0);continue;}
  if(!step())return false;}return false;}
function offered(p,name){return (getChainResponsesV2(p)||[]).filter(r=>r.db.n===name);}
function candUids(){const q=pc();return q?q.candidates.map(c=>c.uid):[];}
/* 盤面: P0 が攻撃する側（ターン5の戦闘フェイズ）、P1 が 次元幽閉 を伏せて持つ。 spec:
     atk … 攻撃モンスターの名前、prior … 先に攻撃を終えた別のモンスター（attacked=true）の名前、
     servant … ホルスのしもべを P0 の場に表で置く（'own'）か P1 側に置く（'foe'）、extraSet … P1 が追加で伏せるカード */
function build(spec){
  resetA();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=5;gameState.phase='battle';
  gameState.rngInitialSeed=gameState.rngState=0x4730001;
  const P=gameState.players,x={};
  x.atk=mk(spec.atk||'サイバー・ドラゴン',0);
  P[0].mz=[];
  if(spec.prior){x.prior=mk(spec.prior,0);x.prior.attacked=true;x.prior.attackCount=1;P[0].mz.push(x.prior);}
  P[0].mz.push(x.atk);
  if(spec.servant==='own'){x.servant=mk(SERV,0);P[0].mz.push(x.servant);}
  x.def=mk('ワイト',1);P[1].mz=[x.def];
  if(spec.servant==='foe'){x.servant=mk(SERV,1);P[1].mz.push(x.servant);}
  x.set=mk(DIM,1,'down');x.set.setTurn=gameState.turn-1;P[1].sz=[x.set];
  if(spec.extraSet){x.extra=mk(spec.extraSet,1,'down');x.extra.setTurn=gameState.turn-1;P[1].sz.push(x.extra);}
  baselineA();
  x.atkIdx=P[0].mz.indexOf(x.atk);
  return x;}
function declare(x){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:x.atkIdx,target:0});}
function chainTargets(){return gameState.chain.map(l=>({name:l.name,uids:linkTargetUidsS03(l)}));}

/* ===== 1+3. 正常発動（対照: 耐性なし）: 攻撃宣言 → 発動 → 対象選択 → 解決 → 攻撃が止まる ===== */
{ const x=build({});declare(x);
  const at=toWindow();
  ok('A: at the attack-declaration window 次元幽閉 is offered to the defender',at&&offered(1,DIM).length===1,JSON.stringify({at,off:(getChainResponsesV2(1)||[]).map(r=>r.db.n)}));
  const lp0=gameState.players.map(p=>p.lp),D0=v41StateDigest(gameState);
  const o=offered(1,DIM)[0];const j0=V41_ACTION_JOURNAL.length;
  pointActivateV27(1,o.zone,o.index);
  const q=pc();
  ok('A: activation opens the target choice (a targeting choice: filterTargetable applies), candidates = exactly the attacking monster',!!q&&q.targeting===true&&q.min===1&&q.max===1&&JSON.stringify(q.candidates.map(c=>c.uid))===JSON.stringify([x.atk.uid]),JSON.stringify(q&&{t:q.targeting,min:q.min,max:q.max,c:q.candidates.map(c=>c.uid)}));
  ok('A: before the choice is answered the trap is face-up and there is no chain link yet',faceOf(x.set)==='up'&&gameState.chain.length===0,'');
  __choicePickV49(0);
  ok('A (1 target fixed): exactly one chain link, 次元幽閉, and the target recorded on it is the attacker (uid)',gameState.chain.length===1&&gameState.chain[0].name===DIM&&JSON.stringify(chainTargets()[0].uids)===JSON.stringify([x.atk.uid]),JSON.stringify(chainTargets()));
  const rt=JSON.parse(JSON.stringify(gameState.chain));
  ok('A (1 target fixed): the link survives a JSON round trip with the same target reference',JSON.stringify(linkTargetUidsS03(rt[0]))===JSON.stringify([x.atk.uid])&&!!rt[0].targets&&rt[0].targets.length===1,JSON.stringify(rt[0].targets).slice(0,200));
  ok('A: the attacker is still on the field while the link is on the chain (nothing resolved yet)',zoneOf(x.atk)==='0:mz'&&!!gameState.pendingAttack,zoneOf(x.atk));
  ok('A: the trap is a SetTrap that activated the normal way (cost-free): LP unchanged, no stray abort in the journal',JSON.stringify(gameState.players.map(p=>p.lp))===JSON.stringify(lp0)&&jtypes(j0).every(t=>t.indexOf('PREP_TX_ABORT')<0),JSON.stringify(jtypes(j0)));
  settle();
  const jt=jtypes(j0);const ban=V41_ACTION_JOURNAL.slice(j0).filter(e=>e.action.type==='FX_BANISH');
  ok('A (3 normal): resolved — the attacking monster is banished, 次元幽閉 goes to the Graveyard, the defender is untouched',zoneOf(x.atk)==='0:banish'&&zoneOf(x.set)==='1:grave'&&zoneOf(x.def)==='1:mz',JSON.stringify([zoneOf(x.atk),zoneOf(x.set),zoneOf(x.def)]));
  ok('A (3 normal): the attack is stopped — no battle damage (LP unchanged), no pending attack, the defender still has its monster',JSON.stringify(gameState.players.map(p=>p.lp))===JSON.stringify(lp0)&&!gameState.pendingAttack&&jt.indexOf('ATTACK_PENDING_CLEAR_S03')>=0&&!jt.some(t=>/BATTLE_DAMAGE|DESTROY_BATTLE|FX_DESTROY/.test(t)),JSON.stringify(jt));
  ok('A (1 target fixed): the banish action carries the target in its effect source (srcS03.tg = the attacker uid), as a targeting effect',ban.length===1&&JSON.stringify(ban[0].action.srcS03&&ban[0].action.srcS03.tg)===JSON.stringify([x.atk.uid]),JSON.stringify(ban.map(b=>b.action.srcS03)));
  ok('A: the chain is empty at the end',gameState.chain.length===0,'');
  audit('A (normal activation)'); }

/* ===== 2. 耐性判定 ===== */
/* 2a. ホルスのしもべ（P0 の場）+ ホルスの黒炎竜 LV4 の攻撃: 相手（P1）は対象にできない → 次元幽閉は選べない・発動できない */
{ const x=build({atk:HOR,servant:'own'});
  const cands=API.fieldCards({zone:'mz',player:0,filter:y=>y.card===x.atk});
  ok('B setup: the attacker is ホルスの黒炎竜 LV4 under P0 own ホルスのしもべ (face-up)',cands.length===1&&faceOf(x.servant)==='up',cands.length);
  ok('B (2 immunity): the targetable filter drops the attacker for the opponent (P1) — candidate excluded',API.targetableCardsS03(cands,1).length===0,API.targetableCardsS03(cands,1).length);
  ok('B (2 immunity): ...but not for its own controller (P0): the immunity is opponent-only',API.targetableCardsS03(cands,0).length===1,'');
  declare(x);const at=toWindow();
  ok('B (2 immunity): no response window opens for 次元幽閉 — it is not offered to P1',!at&&offered(1,DIM).length===0,JSON.stringify({at,off:(getChainResponsesV2(1)||[]).map(r=>r.db.n)}));
  settle();
  ok('B (2 immunity): the attack went on normally — 次元幽閉 was not used, still face-down in the Spell & Trap Zone, attacker still on the field',zoneOf(x.set)==='1:sz'&&faceOf(x.set)==='down'&&zoneOf(x.atk)==='0:mz',JSON.stringify([zoneOf(x.set),faceOf(x.set),zoneOf(x.atk)]));
  ok('B: the attack resolved as a normal battle (the attacker destroys ワイト)',zoneOf(x.def)==='1:grave'&&gameState.players[1].lp<8000,JSON.stringify([zoneOf(x.def),gameState.players[1].lp]));
  audit('B (Horus protected)'); }
/* 2b. 同じ盤面から ホルスのしもべ を外した対照: 選べる（選択が開き、候補はホルスの黒炎竜、解決で除外） */
{ const x=build({atk:HOR});
  const cands=API.fieldCards({zone:'mz',player:0,filter:y=>y.card===x.atk});
  ok('B control: without the servant the same attacker is targetable by P1',API.targetableCardsS03(cands,1).length===1,'');
  declare(x);const at=toWindow();
  ok('B control: 次元幽閉 is offered',at&&offered(1,DIM).length===1,JSON.stringify({at}));
  const o=offered(1,DIM)[0];pointActivateV27(1,o.zone,o.index);
  ok('B control: the target choice lists ホルスの黒炎竜 LV4',JSON.stringify(candUids())===JSON.stringify([x.atk.uid]),JSON.stringify(candUids()));
  settle();
  ok('B control: the attacker is banished',zoneOf(x.atk)==='0:banish'&&zoneOf(x.set)==='1:grave',JSON.stringify([zoneOf(x.atk),zoneOf(x.set)]));
  audit('B control (Horus without servant)'); }
/* 2c. ホルスのしもべが P1 側（攻撃側の相手）にあっても P0 のホルスは守られない（対象を取るのは P1 = しもべのコントローラー自身） */
{ const x=build({atk:HOR,servant:'foe'});
  declare(x);const at=toWindow();
  ok('B2 control: P1 own ホルスのしもべ does not protect P0 ホルスの黒炎竜 — 次元幽閉 is offered',at&&offered(1,DIM).length===1,JSON.stringify({at}));
  const o=offered(1,DIM)[0];pointActivateV27(1,o.zone,o.index);settle();
  ok('B2 control: the attacker is banished',zoneOf(x.atk)==='0:banish',zoneOf(x.atk));
  audit('B2 control (servant on the wrong side)'); }
/* 2d. オベリスクの巨神兵（自身の「効果の対象にならない」）の攻撃: 選べない・発動できない。対照: 耐性のないモンスターなら選べる（1節） */
{ const x=build({atk:OBE});
  const cands=API.fieldCards({zone:'mz',player:0,filter:y=>y.card===x.atk});
  ok('C (2 immunity): オベリスクの巨神兵 is not targetable by the opponent',API.targetableCardsS03(cands,1).length===0,'');
  declare(x);const at=toWindow();
  ok('C (2 immunity): 次元幽閉 is not offered against an attacking オベリスクの巨神兵',!at&&offered(1,DIM).length===0,JSON.stringify({at}));
  settle();
  ok('C: the trap stays face-down; the attack went on (ワイト destroyed)',zoneOf(x.set)==='1:sz'&&faceOf(x.set)==='down'&&zoneOf(x.def)==='1:grave',JSON.stringify([zoneOf(x.set),faceOf(x.set),zoneOf(x.def)]));
  audit('C (Obelisk protected)'); }
/* 2e. 候補は現在の攻撃モンスターだけ。先に攻撃を終えた（attacked=true）別のモンスターへ切り替わらない。
       以前は attacked なモンスター全てが候補で、攻撃モンスターが守られていると別のモンスターが選べてしまった */
{ const x=build({atk:HOR,servant:'own',prior:'ライオウ'});
  ok('D setup: ライオウ attacked earlier this turn (attacked=true), ホルスの黒炎竜 LV4 is attacking now',x.prior.attacked===true&&x.atkIdx===1,'');
  declare(x);const at=toWindow();
  ok('D (2 immunity): the protected attacker cannot be swapped for the earlier attacker — 次元幽閉 is not offered',!at&&offered(1,DIM).length===0,JSON.stringify({at,off:(getChainResponsesV2(1)||[]).map(r=>r.db.n)}));
  settle();
  ok('D: nothing was banished, the trap is unused',zoneOf(x.prior)==='0:mz'&&zoneOf(x.atk)==='0:mz'&&zoneOf(x.set)==='1:sz',JSON.stringify([zoneOf(x.prior),zoneOf(x.atk),zoneOf(x.set)]));
  audit('D (protected attacker, earlier attacker present)'); }
{ const x=build({atk:'サイバー・ドラゴン',prior:'ライオウ'});
  declare(x);const at=toWindow();
  ok('D control: with an earlier attacker present 次元幽閉 is offered',at&&offered(1,DIM).length===1,'');
  const o=offered(1,DIM)[0];pointActivateV27(1,o.zone,o.index);
  ok('D control: the candidate list is only the current attacker (サイバー・ドラゴン), not the earlier attacker (ライオウ)',JSON.stringify(candUids())===JSON.stringify([x.atk.uid]),JSON.stringify({c:candUids(),atk:x.atk.uid,prior:x.prior.uid}));
  settle();
  ok('D control: the current attacker is banished and the earlier one stays',zoneOf(x.atk)==='0:banish'&&zoneOf(x.prior)==='0:mz',JSON.stringify([zoneOf(x.atk),zoneOf(x.prior)]));
  audit('D control'); }

/* ===== 3'. U471 準備トランザクション: 旧い生の condition（候補の有無だけを見る）で対象耐性により候補が空になる時 ===== */
const RAW_COND=function(ctx){
  const t=API.fieldCards({zone:'mz',player:ctx.opponent,filter:x=>x.card.face==='up'&&x.card.pos==='atk'});
  if(!t.length){ctx.reason='攻撃表示の相手モンスターがいません';return false;}
  if(gameState.phase!=='battle'){ctx.reason='x';return false;}
  { const pa=gameState.pendingAttack; if(!pa||pa.player!==ctx.opponent){ctx.reason='x';return false;} }
  return true;};
{ const sc=CARD_SCRIPTS[DIM],saved=sc.condition;
  ok('E setup: the real condition is replaced by the old raw one only inside this VM (restored below)',typeof saved==='function'&&saved!==RAW_COND,'');
  sc.condition=RAW_COND;
  const x=build({atk:HOR,servant:'own'});declare(x);const at=toWindow();
  ok('E: with the raw condition the response window does open for P1 (the old behaviour)',at&&offered(1,DIM).length===1,JSON.stringify({at}));
  const D0=v41StateDigest(gameState),j0=V41_ACTION_JOURNAL.length;TOASTS.length=0;
  const o=offered(1,DIM)[0];pointActivateV27(1,o.zone,o.index);
  const jt=jtypes(j0);
  ok('E (aborts cleanly): immunity empties the candidates — no target choice stays open and no chain link exists',!pc()&&gameState.chain.length===0,JSON.stringify({pc:!!pc(),chain:gameState.chain.length}));
  ok('E (aborts cleanly): the preparation transaction undid the activation (PREP_TX_BEGIN then PREP_TX_ABORT:insufficient, nothing else lasting)',jt.indexOf('PREP_TX_BEGIN_S03')>=0&&jt.indexOf('PREP_TX_ABORT_S03:insufficient')>=0,JSON.stringify(jt));
  ok('E (aborts cleanly): the trap is back FACE-DOWN in the Spell & Trap Zone (not stranded face-up); the attacker is untouched and still the pending attacker',zoneOf(x.set)==='1:sz'&&faceOf(x.set)==='down'&&zoneOf(x.atk)==='0:mz'&&!!gameState.pendingAttack,JSON.stringify([zoneOf(x.set),faceOf(x.set),zoneOf(x.atk)]));
  ok('E (aborts cleanly): the player is told 「選択できるカードが足りません」',TOASTS.indexOf('選択できるカードが足りません')>=0,JSON.stringify(TOASTS));
  audit('E (raw condition, aborted)');
  sc.condition=saved;
  ok('E: the real condition is restored',CARD_SCRIPTS[DIM].condition===saved,''); }

/* ===== 5. 連鎖: 選ばれた攻撃モンスターが解決前に場を離れた時、手札に戻ったカードを除外しない ===== */
{ const x=build({atk:'サイバー・ドラゴン',extraSet:'強制脱出装置'});declare(x);const at=toWindow();
  ok('F setup: the window opens with 次元幽閉 and 強制脱出装置 available to P1',at&&offered(1,DIM).length===1&&offered(1,'強制脱出装置').length===1,JSON.stringify((getChainResponsesV2(1)||[]).map(r=>r.db.n)));
  const o=offered(1,DIM)[0];pointActivateV27(1,o.zone,o.index);__choicePickV49(0);
  const resp=offered(1,'強制脱出装置');
  ok('F: after 次元幽閉 is on the chain, P1 can chain 強制脱出装置 onto it',gameState.chain.length===1&&resp.length===1,JSON.stringify({chain:gameState.chain.length,resp:(getChainResponsesV2(1)||[]).map(r=>r.db.n)}));
  if(resp.length){ pointActivateV27(1,resp[0].zone,resp[0].index);
    const q=pc();if(q){const k=q.candidates.findIndex(c=>c.uid===x.atk.uid);__choicePickV49(k>=0?k:0);} }
  ok('F: both links are on the chain, 強制脱出装置 on top (it targets the attacker, the same card)',gameState.chain.length===2&&gameState.chain[1].name==='強制脱出装置',JSON.stringify(chainTargets()));
  const j0=V41_ACTION_JOURNAL.length;
  settle();
  ok('F: 強制脱出装置 resolved first — the attacker is in the hand; 次元幽閉 then found nothing to banish (it does not banish the card in the hand)',zoneOf(x.atk)==='0:hand',zoneOf(x.atk));
  ok('F: no error, the chain is empty and the attack is over (no pending attack, no battle damage)',gameState.chain.length===0&&!gameState.pendingAttack&&gameState.players.every(p=>p.lp===8000),JSON.stringify({chain:gameState.chain.length,pa:gameState.pendingAttack,lp:gameState.players.map(p=>p.lp)}));
  audit('F (target left the field before resolution)'); }

/* ===== 6. 1103 の裁定との整合: 次元幽閉 にチェーンして 安全地帯 を発動しても攻撃モンスターは除外される =====
   WIKI-AD6B9A8D471E（《安全地帯》, answerDate 2011-07-07）Q「自分のモンスターの直接攻撃宣言時に《次元幽閉》が発動されたためそれにチェーンしてこのカードを発動しました。この場合攻撃モンスターはゲームから除外されますか？」 A「除外されます。(11/07/07)」
   対象を取る効果になっても、選択後に対象耐性が付いたことで解決時に不発にしてはならない（対象耐性は対象を選ぶ時点で見る）。
   なお、このアーカイブの回答は 次元幽閉 自身のエントリではない（次元幽閉 を名指しするのは他カードのページの質問）。 */
{ const x=build({atk:'サイバー・ドラゴン'});x.zone=mk('安全地帯',0,'down');x.zone.setTurn=4;gameState.players[0].sz=[x.zone];baselineA();
  declare(x);const at=toWindow();
  const o=offered(1,DIM)[0];pointActivateV27(1,o.zone,o.index);__choicePickV49(0);
  const r=offered(0,'安全地帯');
  ok('G setup: 次元幽閉 is on the chain and the attacker controller (P0) chains 安全地帯 on it',at&&gameState.chain.length===1&&r.length===1,JSON.stringify({at,chain:gameState.chain.length,r:r.length}));
  if(r.length){pointActivateV27(0,r[0].zone,r[0].index);if(pc())__choicePickV49(0);}
  ok('G: 安全地帯 (top) and 次元幽閉 are both on the chain',JSON.stringify(gameState.chain.map(l=>l.name))===JSON.stringify([DIM,'安全地帯']),JSON.stringify(gameState.chain.map(l=>l.name)));
  settle();
  ok('G (WIKI-AD6B9A8D471E 2011-07-07 「除外されます」): the attacker is still banished although 安全地帯 resolved first; the attack is stopped',zoneOf(x.atk)==='0:banish'&&zoneOf(x.set)==='1:grave'&&!gameState.pendingAttack,JSON.stringify([zoneOf(x.atk),zoneOf(x.set),gameState.pendingAttack]));
  audit('G (安全地帯 chained)'); }

/* ===== Save/Load（実際の保存・再開の道: saveDuel → 新しい VM → offerResumeDuel）=====
   SL1 … 対象を選び終えて 次元幽閉 がチェーンに載った状態（攻撃宣言の窓から始めたチェーン）
   SL2 … 保護された攻撃モンスター（ホルスのしもべ + ホルスの黒炎竜 LV4）の攻撃宣言の直前
   SL3 … 攻撃宣言の窓が開いていて 次元幽閉 が発動できる状態 */
globalThis.__SAVES={};
function saveCase(key,extra){saveDuel();globalThis.__SAVES[key]=JSON.stringify(Object.assign({raw:localStorage.getItem(DUEL_SAVE_KEY),digest:v41StateDigest(gameState)},extra||{}));}
function addFinal(key){globalThis.__SAVES[key]=JSON.stringify(Object.assign(JSON.parse(globalThis.__SAVES[key]),{final:v41StateDigest(gameState)}));}
{ const x=build({});declare(x);toWindow();
  const o=offered(1,DIM)[0];pointActivateV27(1,o.zone,o.index);__choicePickV49(0);
  ok('Save/Load SL1 setup: 次元幽閉 is on the chain with the attacker chosen',gameState.chain.length===1&&JSON.stringify(chainTargets()[0].uids)===JSON.stringify([x.atk.uid]),JSON.stringify(chainTargets()));
  saveCase('SL1',{ids:{atk:uidOf(x.atk),set:uidOf(x.set),def:uidOf(x.def)}});
  settle();
  ok('Save/Load SL1 VM1 reference: the attacker is banished',zoneOf(x.atk)==='0:banish',zoneOf(x.atk));
  addFinal('SL1'); }
{ const y=build({atk:HOR,servant:'own'});
  saveCase('SL2',{ids:{atk:uidOf(y.atk),set:uidOf(y.set),def:uidOf(y.def),servant:uidOf(y.servant)},atkIdx:y.atkIdx}); }
{ const x=build({atk:'サイバー・ドラゴン'});declare(x);const at=toWindow();
  ok('Save/Load SL3 setup: saved while the attack-declaration window is open and 次元幽閉 is available',at&&offered(1,DIM).length===1,'');
  saveCase('SL3',{ids:{atk:uidOf(x.atk),set:uidOf(x.set),def:uidOf(x.def)}});
  const o=offered(1,DIM)[0];pointActivateV27(1,o.zone,o.index);settle();
  ok('Save/Load SL3 VM1 reference: the attacker is banished',zoneOf(x.atk)==='0:banish',zoneOf(x.atk));
  addFinal('SL3'); }
`);

/* ===== VM2: 新しい VM が保存データを offerResumeDuel で読み込んで続行する ===== */
const SAVES=first.__SAVES||{};
if(!SAVES.SL1||!SAVES.SL2||!SAVES.SL3){console.log('FAIL Save/Load VM1 saves missing');process.exitCode=2;}
else harness('const SAVES='+JSON.stringify(SAVES)+';'+String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
const DIM='次元幽閉';
function pc(){return pendingChoiceV49(gameState);}
function zoneOf(u){const x=findCardByUid(u);return x?(x.p+':'+x.zone):null;}
function faceOf(u){const x=findCardByUid(u);return x?x.card.face:null;}
function step(){
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();return 'evt';}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();return 'chain';}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();return 'point';}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();return 'pump';}
  return null;}
function settle(){for(let i=0;i<400;i++){if(pc()){__choicePickV49(0);continue;}if(!step())return 'idle';}return 'loop';}
function atWindow(){const w=gameState.processorWaiting;return !!(w&&w.type==='POINT'&&gameState.processorPaused&&(w.payload||{}).kind==='attackDeclare');}
function toWindow(){for(let i=0;i<120;i++){
  if(atWindow())return true;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){eventSkipGroupV2();continue;}
  if(pc()){__choicePickV49(0);continue;}
  if(!step())return false;}return false;}
function offered(p,name){return (getChainResponsesV2(p)||[]).filter(r=>r.db.n===name);}
function load(key){const o=JSON.parse(SAVES[key]);resetA();localStorage.setItem(DUEL_SAVE_KEY,o.raw);o.resumed=offerResumeDuel();return o;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}

/* SL1: チェーン上（対象確定済み）で保存 → 再開して解決し、攻撃が止まる */
{ const o=load('SL1'),I=o.ids;
  ok('Save/Load SL1: resumed with 次元幽閉 on the chain and the attack still pending',!!o.resumed&&gameState.chain.length===1&&gameState.chain[0].name===DIM&&!!gameState.pendingAttack,JSON.stringify({r:o.resumed,chain:gameState.chain.length,pa:!!gameState.pendingAttack}));
  ok('Save/Load SL1 resumed: the target on the loaded link is still the attacker (uid), and the effect-source target set is rebuilt from it',JSON.stringify(linkTargetUidsS03(gameState.chain[0]))===JSON.stringify([I.atk]),JSON.stringify(linkTargetUidsS03(gameState.chain[0])));
  const j0=V41_ACTION_JOURNAL.length;settle();
  const ban=V41_ACTION_JOURNAL.slice(j0).filter(e=>e.action.type==='FX_BANISH');
  ok('Save/Load SL1 resumed: the attacker is banished, the trap in the Graveyard, the defender untouched, the attack is stopped',zoneOf(I.atk)==='0:banish'&&zoneOf(I.set)==='1:grave'&&zoneOf(I.def)==='1:mz'&&!gameState.pendingAttack,JSON.stringify([zoneOf(I.atk),zoneOf(I.set),zoneOf(I.def),gameState.pendingAttack]));
  ok('Save/Load SL1 resumed: the banish still carries the target in its source (srcS03.tg) after the resume',ban.length===1&&JSON.stringify(ban[0].action.srcS03&&ban[0].action.srcS03.tg)===JSON.stringify([I.atk]),JSON.stringify(ban.map(b=>b.action.srcS03)));
  ok('Save/Load SL1 resumed: the final digest equals the uninterrupted VM1 run',v41StateDigest(gameState)===o.final,v41StateDigest(gameState)+' vs '+o.final);
  audit('Save/Load SL1'); }
/* SL2: 保護された攻撃モンスター — 再開後に攻撃宣言しても 次元幽閉 は出ない（耐性は再開後の状態から再計算される） */
{ const o=load('SL2'),I=o.ids;
  ok('Save/Load SL2: resumed before the attack declaration (digest equal)',!!o.resumed&&v41StateDigest(gameState)===o.digest&&zoneOf(I.atk)==='0:mz'&&faceOf(I.set)==='down',JSON.stringify({r:o.resumed}));
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:o.atkIdx,target:0});
  const at=toWindow();
  ok('Save/Load SL2 resumed: with the servant on the field 次元幽閉 is still not offered (immunity recomputed from the loaded state)',!at&&offered(1,DIM).length===0,JSON.stringify({at}));
  settle();
  ok('Save/Load SL2 resumed: the trap is unused and the attack resolved as a normal battle',zoneOf(I.set)==='1:sz'&&faceOf(I.set)==='down'&&zoneOf(I.def)==='1:grave',JSON.stringify([zoneOf(I.set),faceOf(I.set),zoneOf(I.def)]));
  audit('Save/Load SL2'); }
/* SL3: 攻撃宣言の窓で保存 → 再開後も窓から 次元幽閉 を発動でき、同じ最終状態になる */
{ const o=load('SL3'),I=o.ids;
  ok('Save/Load SL3: resumed at the open attack-declaration window with the attack pending',!!o.resumed&&atWindow()&&!!gameState.pendingAttack,JSON.stringify({r:o.resumed,w:gameState.processorWaiting&&gameState.processorWaiting.type,paused:gameState.processorPaused}));
  const off=offered(1,DIM);
  ok('Save/Load SL3 resumed: 次元幽閉 is still offered to P1 at the window',off.length===1,JSON.stringify((getChainResponsesV2(1)||[]).map(r=>r.db.n)));
  if(off.length){ pointActivateV27(1,off[0].zone,off[0].index);
    ok('Save/Load SL3 resumed: the target choice opens with the attacker as the only candidate',!!pc()&&JSON.stringify(pc().candidates.map(c=>c.uid))===JSON.stringify([I.atk]),JSON.stringify(pc()&&pc().candidates.map(c=>c.uid)));
    settle(); }
  ok('Save/Load SL3 resumed: the attacker is banished and the attack stopped',zoneOf(I.atk)==='0:banish'&&zoneOf(I.def)==='1:mz'&&!gameState.pendingAttack,JSON.stringify([zoneOf(I.atk),zoneOf(I.def)]));
  ok('Save/Load SL3 resumed: the final digest equals the uninterrupted VM1 run',v41StateDigest(gameState)===o.final,v41StateDigest(gameState)+' vs '+o.final);
  audit('Save/Load SL3'); }
`);
