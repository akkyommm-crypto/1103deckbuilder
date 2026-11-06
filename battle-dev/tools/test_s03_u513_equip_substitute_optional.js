/* S03-U513: 任意の装備身代わりと、それを使う未実装カード 3 枚（カード実装）。

   《ファイティング・スピリッツ》（NOT_STARTED・装備魔法）
     装備モンスターの攻撃力は相手フィールド上に存在するモンスター1体につき300ポイントアップする。
     装備モンスターが戦闘によって破壊される場合、代わりにこのカードを破壊する事ができる。
   《白銀の翼》（NOT_STARTED・装備魔法）
     レベル8以上のドラゴン族シンクロモンスターにのみ装備可能。
     装備モンスターは1ターンに2度まで、戦闘では破壊されない。
     装備モンスターがカードの効果によって破壊される場合、代わりにこのカードを破壊する事ができる。
   《大和神》（ENGINE_GAP・星6 戦士/闇 2200/1200・スピリット）
     通常召喚できない。自分の墓地のスピリット1体を除外した場合のみ特殊召喚できる。
     特殊召喚したターンのエンドフェイズ時に持ち主の手札に戻る。
     戦闘で相手モンスターを破壊した場合、相手フィールドの魔法・罠1枚を破壊できる。

   足した共通処理は 1 つだけ。装備カードが `equipSubstituteOptionalS03:{causes:[...]}` を申告すると、
   S03-U173 の任意の身代わり（engine/1ZV）に種別 'equipSub' の選択肢として出る。
   強制版の `equipSubstituteS03`（S03-U183）は触っていない。

   《大和神》の ENGINE_GAP の記録（「『通常召喚できない』の消費側が無い」）は失効していた:
   `cannotNormalSummonS03`（engine/70・S03-U190）が存在し、`FX_SPECIAL_SUMMON` が `summonedTurn` を
   立てるので S03-U244 のスピリットの戻りがそのまま効く（どちらも実測）。

   固定するもの:
     A 形（3 枚と申告）
     B ファイティング・スピリッツ
     C 白銀の翼
     D 大和神
     E negative control（強制版は従来どおり・申告の無い原因では出ない）
     F Replay 監査
     G 文書・登録 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S513 = pathA.resolve(__dirname, '..');
const rdS513 = p => fsA.readFileSync(pathA.join(ROOT_S513, p), 'utf8');
const SRC_S513 = {
  'cards/HZZZZZZZZZZZW_claude_s03_u513_equip_substitute_optional.js': rdS513('cards/HZZZZZZZZZZZW_claude_s03_u513_equip_substitute_optional.js'),
  'docs/S03_U513_REPORT.md': rdS513('docs/S03_U513_REPORT.md'),
  'engine/1ZV_destroy_substitute_s03.js': rdS513('engine/1ZV_destroy_substitute_s03.js'),
  'tools/check.py': rdS513('tools/check.py')
};

const COMMON = String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function zu(uid){const h=findCardByUid(uid);return h?h.zone:null;}
function graveCard(p,uid){return (gameState.players[p].grave||[]).find(c=>c&&c.uid===uid)||null;}
let FORCED=[], SUBCHOICE=[];
(function(){
  const ch=collectHandlers;collectHandlers=function(ev,evt){
    const r=ch.apply(this,arguments);
    if(ev==='onEndPhase')(r||[]).forEach(x=>FORCED.push({n:x.name,forced:triggerCandidateForcedS03(x)}));
    return r;};
})();
function resetVolatile(){EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;
  try{EVT_RESUME_DATA_V484=null;}catch(e){}
  try{CHOICE_LEGACY_CB_V49=new Map();}catch(e){}try{ACTIVATION_PREP_S03=null;}catch(e){}try{RESOLVING_LINK_S03=null;}catch(e){}
  try{PENDING_SUMMON_COMMIT=null;PENDING_SUMMON_CANCEL=null;}catch(e){}try{EVT_CANDS=[];}catch(e){}
  try{PROCESSOR_PUMPING_V27=false;}catch(e){}try{APPLY_ACTION_DEPTH_V31=0;}catch(e){}
  try{DESTROY_SUB_BATCH_S03=null;}catch(e){}}
function fresh(){resetA();resetVolatile();TOASTS.length=0;FORCED=[];SUBCHOICE=[];
  gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4961011;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:14},()=>mk('ワイト',p));}
/* 身代わりの選択が出たら記録する（キーで分かる） */
function noteChoice(){const c=pc();if(c)SUBCHOICE.push((c.candidates||[]).map(x=>x.key));return c;}
function stepS513(){
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();return 'evt';}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();return 'summon';}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();return 'chain';}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();return 'point';}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();return 'pump';}
  if((gameState.deferredEvents||[]).length){flushDeferredEventsV2();return 'flush';}
  return null;}
/* 選択は先頭を選ぶ（身代わりなら「使う」側） */
function drive(){for(let i=0;i<900;i++){if(noteChoice()){__choicePickV49(0);continue;}if(!stepS513())return 'idle';}return 'loop';}
/* 身代わりの選択だけ「使わずに破壊する」を選ぶ */
function driveDecline(){for(let i=0;i<900;i++){
  const c=noteChoice();
  if(c){const ks=(c.candidates||[]).map(x=>x.key);const j=ks.indexOf('decline');__choicePickV49(j>=0?j:0);continue;}
  if(!stepS513())return 'idle';}
  return 'loop';}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});return drive();}
function turnS513(){requestProcessorV27(PROCESSOR_V27.TURN);return drive();}
function attackS513(p,atkIdx,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:atkIdx,target:target});return drive();}
function attackDecline(p,atkIdx,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:atkIdx,target:target});return driveDecline();}
function equipOf(p,name){return (gameState.players[p].sz||[]).find(c=>c&&cardName(c)===name)||null;}
function handIndexOf(p,name){return (gameState.players[p].hand||[]).findIndex(c=>c&&cardName(c)===name);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,200));}
`;

/* ===== A. 形 ===== */
harness('const SRC=' + JSON.stringify(SRC_S513) + ';' + COMMON + String.raw`
fresh();
ok('A1 ★ 3 枚が登録され、申告の形が正しい（原因ごとに分かれている）',
   !!CARD_SCRIPTS['ファイティング・スピリッツ'] && !!CARD_SCRIPTS['白銀の翼'] && !!CARD_SCRIPTS['大和神']
   && JSON.stringify(CARD_SCRIPTS['ファイティング・スピリッツ'].equipSubstituteOptionalS03)==='{"causes":["battle"]}'
   && JSON.stringify(CARD_SCRIPTS['白銀の翼'].equipSubstituteOptionalS03)==='{"causes":["effect"]}'
   && CARD_SCRIPTS['大和神'].cannotNormalSummon===true
   && CARD_SCRIPTS['大和神'].cannotSpecialSummon===false
   && !!(CARD_SCRIPTS['大和神'].summonProcedure||{}).cost,
   JSON.stringify({fs:CARD_SCRIPTS['ファイティング・スピリッツ'].equipSubstituteOptionalS03,
     wing:CARD_SCRIPTS['白銀の翼'].equipSubstituteOptionalS03}));
ok('A2 ★ engine/1ZV の追加は申告（equipSubstituteOptionalS03）がある装備カードだけを見る',
   SRC['engine/1ZV_destroy_substitute_s03.js'].indexOf("equipSubOptionalDeclsS03(card).length) return {kind:'equipSub'}")>=0
   && SRC['engine/1ZV_destroy_substitute_s03.js'].indexOf("if(decl.kind==='equipSub'){")>=0
   && SRC['engine/1ZV_destroy_substitute_s03.js'].indexOf("if(x.kind==='equipSub'){")>=0,'');
ok('A3 ★ 強制版（S03-U183）には手を付けていない（engine/1ZV は強制版の実装を呼ばない）',
   SRC['engine/1ZV_destroy_substitute_s03.js'].indexOf('equipSubstituteDestroyS03')<0
   && SRC['engine/1ZV_destroy_substitute_s03.js'].indexOf('equipSubstituteOptionalS03')>=0
   && typeof equipSubstituteDestroyS03==='function'
   && CARD_SCRIPTS['八汰鏡'].equipSubstituteS03==='battle'
   && !CARD_SCRIPTS['八汰鏡'].equipSubstituteOptionalS03,
   '');
`, {expect:3});

/* ===== B. ファイティング・スピリッツ ===== */
harness(COMMON + String.raw`
fresh();
const w=mk('ワイト',0,'up');            /* 攻 400（基礎 300 + 100） */
gameState.players[0].mz=[w];
gameState.players[1].mz=[mk('ワイト',1,'up'),mk('ワイト',1,'up')];
gameState.players[0].hand=[mk('ファイティング・スピリッツ',0)];
baselineA();
const before=curATK(w);
duelActivateFromHand(0);
const tr=drive();
ok('B1 ★ 装備モンスターの攻撃力は相手モンスター1体につき 300 アップ（2 体で +600）',
   tr==='idle' && !!equipOf(0,'ファイティング・スピリッツ') && curATK(w)===before+600,
   JSON.stringify({before,after:curATK(w)}));
audit('B1');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
const w=mk('ワイト',0,'up');
gameState.players[0].mz=[w];
gameState.players[1].mz=[mk('デーモンの召喚',1,'up')];
gameState.players[0].hand=[mk('ファイティング・スピリッツ',0)];
baselineA();
duelActivateFromHand(0);
drive();
const eq=equipOf(0,'ファイティング・スピリッツ');
phase('end');turnS513();phase('standby');phase('main1');phase('battle');
const tr=attackS513(1,0,0);
ok('B2 ★ 戦闘で破壊される場合、代わりにこのカードを破壊できる（使った場合はモンスターが残る）',
   tr==='idle' && zu(w.uid)==='mz' && !!eq && zu(eq.uid)==='grave'
   && ((graveCard(0,eq.uid)||{}).graveInfo||{}).byDestroy===true
   && SUBCHOICE.some(ks=>ks.some(k=>String(k).indexOf('eqs:')===0)),
   JSON.stringify({w:zu(w.uid),eq:eq?zu(eq.uid):null,choices:SUBCHOICE}));
audit('B2');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
const w=mk('ワイト',0,'up');
gameState.players[0].mz=[w];
gameState.players[1].mz=[mk('デーモンの召喚',1,'up')];
gameState.players[0].hand=[mk('ファイティング・スピリッツ',0)];
baselineA();
duelActivateFromHand(0);
drive();
const eq=equipOf(0,'ファイティング・スピリッツ');
phase('end');turnS513();phase('standby');phase('main1');phase('battle');
const tr=attackDecline(1,0,0);
ok('B3 ★ 任意なので「使わずに破壊する」も選べる（モンスターが破壊され、装備カードも墓地へ）',
   tr==='idle' && zu(w.uid)==='grave' && !!eq && zu(eq.uid)==='grave'
   && ((graveCard(0,w.uid)||{}).graveInfo||{}).byDestroy===true,
   JSON.stringify({w:zu(w.uid),eq:eq?zu(eq.uid):null,choices:SUBCHOICE}));
audit('B3');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* negative control: 申告は戦闘だけなので、効果破壊では身代わりの選択が出ない */
const w=mk('ワイト',0,'up');
gameState.players[0].mz=[w];
gameState.players[0].hand=[mk('ファイティング・スピリッツ',0)];
gameState.players[1].hand=[mk('地砕き',1)];
baselineA();
duelActivateFromHand(0);
drive();
const eq=equipOf(0,'ファイティング・スピリッツ');
phase('end');turnS513();phase('standby');phase('main1');
duelActivateFromHand(handIndexOf(1,'地砕き'));
const tr=drive();
ok('B4 ★ negative control: 効果破壊では身代わりの選択が出ない（原因は戦闘だけ）',
   tr==='idle' && zu(w.uid)==='grave'
   && !SUBCHOICE.some(ks=>ks.some(k=>String(k).indexOf('eqs:')===0)),
   JSON.stringify({w:zu(w.uid),eq:eq?zu(eq.uid):null,choices:SUBCHOICE}));
`, {expect:1});

/* ===== C. 白銀の翼 ===== */
harness(COMMON + String.raw`
fresh();
const sd=mk('スターダスト・ドラゴン',0,'up');
gameState.players[0].mz=[sd];
gameState.players[0].hand=[mk('白銀の翼',0)];
baselineA();
duelActivateFromHand(0);
const tr=drive();
ok('C1 ★ レベル8以上のドラゴン族シンクロには装備できる',
   tr==='idle' && !!equipOf(0,'白銀の翼') && !!equipOf(0,'白銀の翼').equipTo
   && Number(dbOf(sd).lv)===8 && dbOf(sd).ra==='ドラゴン',
   JSON.stringify({sz:(gameState.players[0].sz||[]).map(c=>cardName(c))}));
audit('C1');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* negative control: ドラゴン族シンクロ以外には装備できない */
gameState.players[0].mz=[mk('ワイト',0,'up')];
gameState.players[0].hand=[mk('白銀の翼',0)];
baselineA();
duelActivateFromHand(0);
drive();
ok('C2 ★ negative control: 条件を満たさないモンスターには装備できない',
   !equipOf(0,'白銀の翼') && (gameState.players[0].hand||[]).some(c=>c&&cardName(c)==='白銀の翼'),
   JSON.stringify({sz:(gameState.players[0].sz||[]).map(c=>cardName(c)),
     hand:(gameState.players[0].hand||[]).map(c=>cardName(c))}));
`, {expect:1});

harness(COMMON + String.raw`
fresh();
const sd=mk('スターダスト・ドラゴン',0,'up');   /* 攻 2500 */
gameState.players[0].mz=[sd];
gameState.players[0].hand=[mk('白銀の翼',0)];
gameState.players[1].mz=[mk('青眼の白龍',1,'up'),mk('青眼の白龍',1,'up'),mk('青眼の白龍',1,'up')];
baselineA();
duelActivateFromHand(0);
drive();
phase('end');turnS513();phase('standby');phase('main1');phase('battle');
attackS513(1,0,0); const a1=zu(sd.uid);
attackS513(1,1,0); const a2=zu(sd.uid);
attackS513(1,2,0); const a3=zu(sd.uid);
ok('C3 ★ 装備モンスターは 1 ターンに 2 度までは戦闘で破壊されない（3 度目で破壊）',
   a1==='mz' && a2==='mz' && a3==='grave' && gameState.players[0].lp===8000-500*3,
   JSON.stringify({a1,a2,a3,lp0:gameState.players[0].lp}));
audit('C3');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
const sd=mk('スターダスト・ドラゴン',0,'up');
gameState.players[0].mz=[sd];
gameState.players[0].hand=[mk('白銀の翼',0)];
gameState.players[1].hand=[mk('地砕き',1)];
baselineA();
duelActivateFromHand(0);
drive();
const wing=equipOf(0,'白銀の翼');
phase('end');turnS513();phase('standby');phase('main1');
duelActivateFromHand(handIndexOf(1,'地砕き'));
const tr=drive();
ok('C4 ★ カードの効果で破壊される場合、代わりにこのカードを破壊できる',
   tr==='idle' && zu(sd.uid)==='mz' && !!wing && zu(wing.uid)==='grave'
   && SUBCHOICE.some(ks=>ks.some(k=>String(k).indexOf('eqs:')===0)),
   JSON.stringify({sd:zu(sd.uid),wing:wing?zu(wing.uid):null,choices:SUBCHOICE}));
audit('C4');
`, {expect:2});

/* ===== D. 大和神 ===== */
harness(COMMON + String.raw`
fresh();
const ym=mk('大和神',0);
gameState.players[0].hand=[ym];
const sp=mk('八汰烏',0);
gameState.players[0].grave=[sp];
baselineA();
const Lp=strictSummonProcedureLegality('大和神',0,'hand',0);
const cns=cannotNormalSummonS03(dbOf(ym));
finishSummonProcedure('大和神',0,'hand',0,'atk');
const tr=drive();
ok('D1 ★ 通常召喚できず、墓地のスピリット1体を除外して手札から特殊召喚できる',
   cns===true && Lp.ok===true && tr==='idle'
   && zu(ym.uid)==='mz' && zu(sp.uid)==='banish',
   JSON.stringify({cannotNormal:cns,legal:{ok:Lp.ok,reason:Lp.reason},ym:zu(ym.uid),spirit:zu(sp.uid)}));
audit('D1');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* negative control: 墓地にスピリットがいなければ特殊召喚できない */
const ym=mk('大和神',0);
gameState.players[0].hand=[ym];
gameState.players[0].grave=[mk('ワイト',0)];
baselineA();
const Lp=strictSummonProcedureLegality('大和神',0,'hand',0);
ok('D2 ★ negative control: 墓地にスピリットがいなければ特殊召喚できない',
   Lp.ok===false && String(Lp.reason||'').indexOf('スピリット')>=0,
   JSON.stringify({ok:Lp.ok,reason:Lp.reason}));
`, {expect:1});

harness(COMMON + String.raw`
fresh();
const ym=mk('大和神',0);
gameState.players[0].hand=[ym];
gameState.players[0].grave=[mk('八汰烏',0)];
baselineA();
finishSummonProcedure('大和神',0,'hand',0,'atk');
drive();
const onField=zu(ym.uid);
const tr=phase('end');
ok('D3 ★ 特殊召喚したターンのエンドフェイズに持ち主の手札へ戻る（スピリットの共通処理）',
   onField==='mz' && tr==='idle' && zu(ym.uid)==='hand'
   && FORCED.some(x=>x.n==='大和神' && x.forced===true),
   JSON.stringify({onField,ym:zu(ym.uid),forced:FORCED}));
audit('D3');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
const ym=mk('大和神',0);
gameState.players[0].hand=[ym];
gameState.players[0].grave=[mk('八汰烏',0)];
gameState.players[1].mz=[mk('ワイト',1,'up')];
const st=mk('サイクロン',1,'down');   /* 通常魔法のセット: 攻撃宣言に応答できない */
gameState.players[1].sz=[st];
baselineA();
finishSummonProcedure('大和神',0,'hand',0,'atk');
drive();
phase('battle');
const tr=attackS513(0,0,0);
ok('D4 ★ 戦闘で相手モンスターを破壊した場合、相手の魔法・罠 1 枚を破壊できる',
   tr==='idle' && zu(ym.uid)==='mz' && zu(st.uid)==='grave'
   && (gameState.players[1].mz||[]).length===0,
   JSON.stringify({ym:zu(ym.uid),st:zu(st.uid)}));
audit('D4');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* negative control: 自分が戦闘破壊された場合は発動しない */
const ym=mk('大和神',0);
gameState.players[0].hand=[ym];
gameState.players[0].grave=[mk('八汰烏',0)];
gameState.players[1].mz=[mk('青眼の白龍',1,'up')];
const st=mk('サイクロン',1,'down');
gameState.players[1].sz=[st];
baselineA();
finishSummonProcedure('大和神',0,'hand',0,'atk');
drive();
phase('battle');
const tr=attackS513(0,0,0);
ok('D5 ★ negative control: 自分が戦闘破壊された場合は発動しない',
   tr==='idle' && zu(ym.uid)==='grave' && zu(st.uid)==='sz',
   JSON.stringify({ym:zu(ym.uid),st:zu(st.uid)}));
`, {expect:1});

/* ===== E. negative control（強制版は従来どおり） ===== */
harness(COMMON + String.raw`
fresh();
/* 《八汰鏡》（S03-U512）は強制版の身代わりなので、選択は出ずに必ず装備カードが破壊される */
const sp=mk('八汰烏',0,'up'); sp.summonedTurn=gameState.turn-2;   /* 戻りのターンではない */
gameState.players[0].mz=[sp];
gameState.players[0].hand=[mk('八汰鏡',0)];
gameState.players[1].mz=[mk('デーモンの召喚',1,'up')];
baselineA();
duelActivateFromHand(0);
drive();
const mir=equipOf(0,'八汰鏡');
phase('end');turnS513();phase('standby');phase('main1');phase('battle');
const tr=attackS513(1,0,0);
ok('E1 ★ negative control: 強制版（《八汰鏡》）は選択を出さずに今までどおり身代わりになる',
   tr==='idle' && zu(sp.uid)==='mz' && !!mir && zu(mir.uid)==='grave'
   && !SUBCHOICE.some(ks=>ks.some(k=>String(k).indexOf('eqs:')===0)),
   JSON.stringify({spirit:zu(sp.uid),mir:mir?zu(mir.uid):null,choices:SUBCHOICE}));
audit('E1');
`, {expect:2});

/* ===== G. 文書・登録 ===== */
harness('const S=' + JSON.stringify(SRC_S513) + ';' + String.raw`
const REP=S['docs/S03_U513_REPORT.md'], CHK=S['tools/check.py'];
ok('G1 ★ 報告書に、実装した効果と未対応の範囲が分けて書かれている',
   REP.indexOf('実装した範囲')>=0 && REP.indexOf('未対応の範囲')>=0
   && REP.indexOf('ファイティング・スピリッツ')>=0 && REP.indexOf('白銀の翼')>=0 && REP.indexOf('大和神')>=0,'');
ok('G2 ★ check.py にこのテストが登録されている',
   CHK.indexOf('test_s03_u513_equip_substitute_optional.js')>=0,'');
`, {expect:2});
