/* S03-U457: the remaining CODEX-C03 targeting-immunity consumers (ヴァイロン・エプシロン / ターボ・ウォリアー / 救世の儀式) and the same resolution-time regression for the cards that still read a prep-only source (ジュラック・タイタン / 機皇城 / 地天の騎士ガイアドレイク / 安全地帯 / エレキリギリス).
   Follows S03-U456's shape: filterTargetable in the activation-prep and resolution-time source contexts, real activation paths, Replay-audited.
   (S03-U456 header follows.)
   S03-U456: CODEX-C03 source-aware targeting immunity — resolution-time regression.
   氷結界の御庭番 / ヴァイロン・セグメント / 闇の侯爵ベリアル used to read the effect source only while ACTIVATION_PREP_S03 was set
   (cleared once the activation is on the chain), so the immunity was silently lost when the target was chosen at resolution.
   Real filterTargetable path in the three source contexts (activation prep / chain resolution), Replay-audited. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pl(c){const h=findCardByUid(c.uid);return h?h.p:null;}
function C(c){const h=findCardByUid(c.uid);return h?h.card:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));return pkg;}
function uid(c){return ensureCardUid(gameState,c);}
let PREFER=[];const SEEN=[];
function pick(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}
  if(q.min>1){const keys=[];PREFER.forEach(u=>{const x=q.candidates.find(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(x&&keys.length<q.max&&keys.indexOf(x.key)<0)keys.push(x.key);});q.candidates.forEach(x=>{if(keys.length<q.min&&keys.indexOf(x.key)<0)keys.push(x.key);});answerChoiceV49(keys);return;}SEEN.push({title:q.title,cands:q.candidates.map(x=>x.uid||x.value||x.key)});let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(j>=0)break;}if(j>=0){const u=PREFER.find(u=>q.candidates.some(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u)));PREFER.splice(PREFER.indexOf(u),1);}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<800;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4560001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function lp(p){return gameState.players[p].lp;}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function startTurn(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function endTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();startTurn();}
function toOppBattle(){endTurn();phase('battle');}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function actC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function equipped(host,eq){const h=C(host),e=C(eq);return !!h&&!!e&&e.equipTo&&e.equipTo.uid===host.uid&&Array.isArray(h.equippedBy)&&h.equippedBy.indexOf(e.equipUid)>=0;}
function legalH(i){const acts=getLegalHandActions(0,i||0);return {ok:acts.some(x=>x.id==='activate'),actions:acts.map(x=>x.id)};}
function cc(c){const x=C(c);return x&&x.counters?Number(x.counters['魔力'])||0:0;}
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}

function offeredTo(p,c){return !!(gameState.chainWindow&&gameState.chain.length&&getChainResponsesV2(p).some(x=>x.card===c));}
function respond(p,c,prefer){const hh=findCardByUid(c.uid); if(!hh) return false;
  PREFER=(prefer||[]).slice();duelActivateResponseV2(p,hh.zone,hh.index);for(let i=0;i<10&&pc();i++)pick();PREFER=[];return true;}
function foeCast(name,prefer){const i=gameState.players[1].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);for(let i2=0;i2<10&&pc();i2++)pick();PREFER=[];}
function actZ(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function canZ(c){return getLegalZoneActions(0,'mz',idx(c)).map(a=>a.id).indexOf('effect')>=0;}

function sz(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function actSz(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'sz',idx(c));drive();PREFER=[];}
function legalSz(c){return strictScriptLegalityV2(cardName(c),0,'sz',idx(c)).ok;}
function gv(c){return curATK(C(c));}





/* ---- U457 helpers ---- */
function dbk(n){return CARD_DB.find(x=>x.n===n);}
/* 対象を選んでいる効果のソースの文脈を直接作る（実エンジンと同じ関数）。 */
function clearCtx(){endActivationPrepS03();p3EndEffectContextV3();}
function atPrep(src,player){clearCtx();beginActivationPrepS03(player,src,cardName(src));}
function atResolution(src,player){clearCtx();p3BeginEffectContextV3(player,src,cardName(src));}
function kept(c,byPlayer){return filterTargetable([locateCardAnyV4(c)],byPlayer).length;}
function resolvedCtxPremise(){return typeof ACTIVATION_PREP_S03==='undefined'||ACTIVATION_PREP_S03===null;}
function actZG(zone,c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,zone,idx(c));drive();PREFER=[];}
function legalZ(zone,c){return getLegalZoneActions(0,zone,idx(c)).map(a=>a.id).indexOf('effect')>=0;}
function doSynchro(mats){const P=gameState.players[0];doExSummon(0,0,mats.map(m=>P.mz.indexOf(m)),'synchro','atk');drive();}
function combos(exName){return exCombos(0,dbOf({id:findCardIndex(exName)})).combos.map(c=>c.materials.slice().sort((a,b)=>a-b).join());}
function myAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function pz(c){return z(c);}

const EPS='ヴァイロン・エプシロン',SEG='ヴァイロン・セグメント',TUR='ターボ・ウォリアー',RIT='救世の儀式',NOR='救世の美神ノースウェムコ';
const TIT='ジュラック・タイタン',CAS='機皇城',DRK='地天の騎士ガイアドレイク',SAF='安全地帯',GRA='エレキリギリス';

ok('fixture: エプシロン / ターボ・ウォリアー are Synchro Effect Monsters, 救世の儀式 a Ritual Spell, ノースウェムコ a Ritual Monster',
  dbk(EPS).st.indexOf('シンクロ')>=0&&dbk(TUR).st.indexOf('シンクロ')>=0&&dbk(RIT).sub==='儀式'&&dbk(NOR).st.indexOf('儀式')>=0,'');

/* ================= ジュラック・タイタン（既存・解決時の退行修正） ================= */
function titanField(withTitan){
  fresh();const ti=mon(TIT,0),foeM=mon('ライオウ',1),foeN=mon('ワイト',1),foeT=setCard('強制脱出装置',1),foeS=mk('月の書',1,'up'),own=mon('ライオウ',0);
  gameState.players[0].mz=withTitan?[ti,own]:[own];gameState.players[1].mz=[foeM,foeN];gameState.players[1].sz=[foeT];gameState.players[1].hand=[foeS];baselineA();
  return {ti,foeM,foeN,foeT,foeS,own};}
{ const x=titanField(true);
  atPrep(C(x.foeM),1);
  ok('タイタン 発動準備中: 相手の効果モンスターの効果は対象に取れない',kept(x.ti,1)===0,'kept='+kept(x.ti,1));
  atPrep(C(x.foeT),1);
  ok('タイタン 発動準備中: 相手の罠の効果は対象に取れない',kept(x.ti,1)===0,'kept='+kept(x.ti,1));
  atResolution(C(x.foeM),1);
  ok('タイタン 前提: 解決時は ACTIVATION_PREP_S03 が空で、旧 u378Source() は効果ソースを返さない',resolvedCtxPremise()&&u378Source()===null,'');
  ok('タイタン 解決時: 相手の効果モンスターの効果は対象に取れない（本単位で直した退行）',kept(x.ti,1)===0,'kept='+kept(x.ti,1));
  atResolution(C(x.foeT),1);
  ok('タイタン 解決時: 相手の罠の効果は対象に取れない',kept(x.ti,1)===0,'kept='+kept(x.ti,1));
  atResolution(C(x.own),0);
  ok('タイタン 裁定: 自分の効果モンスターの効果も対象に取れない（テキストは持ち主を問わない）（解決時）',kept(x.ti,0)===0,'kept='+kept(x.ti,0));
  atResolution(C(x.foeS),1);
  ok('タイタン negative: 相手の魔法は対象に取れる（罠・効果モンスターのみ）（解決時）',kept(x.ti,1)===1,'kept='+kept(x.ti,1));
  atResolution(C(x.foeN),1);
  ok('タイタン negative: 相手の通常モンスターは対象に取れる（解決時）',kept(x.ti,1)===1,'kept='+kept(x.ti,1));
  clearCtx(); }
{ const x=titanField(false);
  atResolution(C(x.foeM),1);
  ok('タイタン control: タイタンがいなければ相手の効果モンスターは同じモンスターを対象に取れる（解決時）',kept(x.own,1)===1,'kept='+kept(x.own,1));
  clearCtx(); }

/* ================= 機皇城（既存・解決時の退行修正） ================= */
function castleField(withCastle){
  fresh();const w=mon('機皇帝ワイゼル∞',1),pl2=mon('ライオウ',1),cas=mk(CAS,1),sy=mon('ブラック・ローズ・ドラゴン',0),em=mon('ライオウ',0),sp=mk('月の書',0,'up'),tr=setCard('強制脱出装置',0);
  gameState.players[1].mz=[w,pl2];gameState.players[1].field=withCastle?cas:null;gameState.players[0].mz=[sy,em];gameState.players[0].hand=[sp];gameState.players[0].sz=[tr];baselineA();
  return {w,pl2,cas,sy,em,sp,tr};}
{ const x=castleField(true);
  ok('機皇城 fixture: フィールドゾーンに表側表示',x.cas.face==='up'&&z(x.cas)==='field',z(x.cas));
  atPrep(C(x.sy),0);
  ok('機皇城 発動準備中: シンクロモンスターの効果は自分の「機皇帝」を対象に取れない',kept(x.w,0)===0,'kept='+kept(x.w,0));
  atResolution(C(x.sy),0);
  ok('機皇城 前提: 解決時は ACTIVATION_PREP_S03 が空',resolvedCtxPremise(),'');
  ok('機皇城 解決時: シンクロモンスターの効果は「機皇帝」を対象に取れない（本単位で直した退行）',kept(x.w,0)===0,'kept='+kept(x.w,0));
  atResolution(C(x.em),0);
  ok('機皇城 negative: シンクロ以外の効果モンスターの効果は対象に取れる（解決時）',kept(x.w,0)===1,'kept='+kept(x.w,0));
  atResolution(C(x.sp),0);
  ok('機皇城 negative: 魔法の効果は対象に取れる（解決時）',kept(x.w,0)===1,'kept='+kept(x.w,0));
  atResolution(C(x.tr),0);
  ok('機皇城 negative: 罠の効果は対象に取れる（解決時）',kept(x.w,0)===1,'kept='+kept(x.w,0));
  atResolution(C(x.sy),0);
  ok('機皇城 negative: 「機皇帝」でないモンスター（ライオウ）は守られない（解決時）',kept(x.pl2,0)===1,'kept='+kept(x.pl2,0));
  clearCtx(); }
{ const x=castleField(false);
  atResolution(C(x.sy),0);
  ok('機皇城 control: 機皇城が無ければシンクロモンスターの効果は「機皇帝」を対象に取れる（解決時）',kept(x.w,0)===1,'kept='+kept(x.w,0));
  clearCtx(); }

/* ================= 地天の騎士ガイアドレイク（同じ退行・落穂拾い） ================= */
function drakeField(withDrake){
  fresh();const d=mon(DRK,0),w=mon('ワイト',1),em=mon('ライオウ',1),tr=setCard('強制脱出装置',1);
  gameState.players[0].mz=withDrake?[d]:[mon('ワイト',0)];gameState.players[1].mz=[w,em];gameState.players[1].sz=[tr];baselineA();return {d,w,em,tr};}
{ const x=drakeField(true);
  atPrep(C(x.em),1);
  ok('ドレイク 発動準備中: 効果モンスターの効果は対象に取れない',kept(x.d,1)===0,'kept='+kept(x.d,1));
  atResolution(C(x.em),1);
  ok('ドレイク 解決時: 効果モンスターの効果は対象に取れない（本単位で直した退行）',kept(x.d,1)===0,'kept='+kept(x.d,1));
  atResolution(C(x.tr),1);
  ok('ドレイク negative: 罠の効果は対象に取れる（効果モンスターの効果のみ）（解決時）',kept(x.d,1)===1,'kept='+kept(x.d,1));
  atResolution(C(x.w),1);
  ok('ドレイク negative: 通常モンスターは対象に取れる（解決時）',kept(x.d,1)===1,'kept='+kept(x.d,1));
  clearCtx(); }

/* ================= 安全地帯（同じ退行・落穂拾い） ================= */
{ fresh();const t=setCard(SAF,0),h=mon('ブラック・マジシャン',0),o=mon('ワイト',0),f=mon('ライオウ',1);
  gameState.players[0].sz=[t];gameState.players[0].mz=[h,o];gameState.players[1].mz=[f];baselineA();
  PREFER=[uid(h)];duelActivateFromZone(0,'sz',idx(t));drive();PREFER=[];
  ok('安全地帯 fixture: 発動済みでホストを記録',C(t).face==='up'&&C(t).u423Host===h.uid,JSON.stringify([C(t)&&C(t).face,C(t)&&C(t).u423Host]));
  atPrep(C(f),1);
  ok('安全地帯 発動準備中: 相手の効果は守られたモンスターを対象に取れない',kept(h,1)===0,'kept='+kept(h,1));
  atResolution(C(f),1);
  ok('安全地帯 解決時: 相手の効果は守られたモンスターを対象に取れない（本単位で直した退行）',kept(h,1)===0,'kept='+kept(h,1));
  ok('安全地帯 negative: 守られていないモンスターは対象に取れる（解決時）',kept(o,1)===1,'kept='+kept(o,1));
  atResolution(C(h),0);
  ok('安全地帯 negative: 自分の効果なら対象に取れる（「相手の効果」のみ）（解決時）',kept(h,0)===1,'kept='+kept(h,0));
  clearCtx(); }

/* ================= エレキリギリス（出所のプレイヤーを effectInfo から読む） ================= */
{ fresh();const g=mon(GRA,0),el=mon('エレキツネ',0),f=mon('ライオウ',1);
  gameState.players[0].mz=[g,el];gameState.players[1].mz=[f];baselineA();
  atPrep(C(f),1);
  ok('リギリス 発動準備中: 相手の効果は他の「エレキ」を対象に取れない',kept(el,1)===0,'kept='+kept(el,1));
  atResolution(C(f),1);
  ok('リギリス 解決時: 相手の効果は他の「エレキ」を対象に取れない',kept(el,1)===0,'kept='+kept(el,1));
  atResolution(C(g),0);
  ok('リギリス negative: 自分の効果なら対象に取れる（解決時）',kept(el,0)===1,'kept='+kept(el,0));
  clearCtx();
  /* 文脈（ACTIVATION_PREP / P3_EFFECT_CONTEXT）が無い直接の判定でも effectInfo だけで働く */
  const info=targetEffectSourceS03(1,{uid:f.uid,name:cardName(f)});
  ok('リギリス 直接 effectInfo: 文脈が無くても effectInfo.player=相手 なら対象に取れない',filterTargetable([locateCardAnyV4(el)],1,info).length===0,'');
  ok('リギリス 直接 effectInfo: effectInfo.player=自分 なら対象に取れる',filterTargetable([locateCardAnyV4(el)],0,targetEffectSourceS03(0,{uid:g.uid,name:cardName(g)})).length===1,''); }

/* ================= ヴァイロン・エプシロン ================= */
function epsField(opts){
  opts=opts||{};
  fresh();const e=mon(EPS,0),seg=mk(SEG,0),f1=mon('ワイト',1),f2=mon('ライオウ',1),ti=mon(TIT,1),cy=mk('サイクロン',1,'up'),mn=mk('月の書',1,'up'),
    oth=mon('ヴァイロン・ソルジャー',0),seg2=mk(SEG,0);
  gameState.players[0].hand=[seg,seg2];gameState.players[0].mz=[e,oth];
  gameState.players[1].mz=opts.onlyTitan?[ti]:[f1,f2,ti];gameState.players[1].hand=[cy,mn];baselineA();
  cast(0,SEG,[uid(e)]);
  if(opts.second){ cast(0,SEG,[uid(oth)]); }
  return {e,seg,seg2,f1,f2,ti,cy,mn,oth};}
{ const x=epsField({second:true});
  ok('エプシロン fixture: 装備カードが実際に装備されている（エプシロンに1枚、別モンスターに1枚）',equipped(x.e,x.seg)&&equipped(x.oth,x.seg2),String(z(x.seg))+z(x.seg2));
  atPrep(C(x.cy),1);
  ok('エプシロン 発動準備中: 相手のサイクロンはエプシロンに装備された装備カードを対象に取れない',kept(x.seg,1)===0,'kept='+kept(x.seg,1));
  atResolution(C(x.cy),1);
  ok('エプシロン 前提: 解決時は ACTIVATION_PREP_S03 が空',resolvedCtxPremise(),'');
  ok('エプシロン 解決時: 相手の魔法の効果は装備カードを対象に取れない',kept(x.seg,1)===0,'kept='+kept(x.seg,1));
  atResolution(C(x.f2),1);
  ok('エプシロン 解決時: 相手のモンスター効果も装備カードを対象に取れない（カードの効果すべて）',kept(x.seg,1)===0,'kept='+kept(x.seg,1));
  atResolution(C(x.oth),0);
  ok('エプシロン 裁定: 自分の効果も装備カードを対象に取れない（「カードの効果の対象にならない」はどちらの効果にも及ぶ）',kept(x.seg,0)===0,'kept='+kept(x.seg,0));
  atResolution(C(x.cy),1);
  ok('エプシロン negative: 別のモンスターに装備された装備カードは対象に取れる',kept(x.seg2,1)===1,'kept='+kept(x.seg2,1));
  ok('エプシロン negative: エプシロン自身は対象に取れる（保護されるのは装備カードだけ）',kept(x.e,1)===1,'kept='+kept(x.e,1));
  clearCtx();
  /* 実際のサイクロン: 候補に装備カードが出ない */
  SEEN.length=0;
  endTurn();   // 相手ターンへ
  gameState.phase='main1';
  foeCast('サイクロン');
  const cands=SEEN.length?SEEN[SEEN.length-1].cands:[];
  ok('エプシロン 実際のサイクロン: 候補にエプシロンの装備カードは出ず、別の装備カードは出る',cands.indexOf(x.seg.uid)<0&&cands.indexOf(x.seg2.uid)>=0,JSON.stringify(cands)+' seg='+x.seg.uid+' seg2='+x.seg2.uid);
  audit('エプシロン 1'); }
{ const x=epsField({});
  ok('エプシロン: 効果が発動できる（装備カードと破壊できる相手モンスターがある）',legalZ('mz',x.e)===true,JSON.stringify(getLegalZoneActions(0,'mz',idx(x.e)).map(a=>a.id)));
  SEEN.length=0;actC(x.e,[uid(x.seg),uid(x.f1)]);
  ok('エプシロン: コストの装備カードは「対象」ではない（対象耐性のある装備カードが選べた）',SEEN.length>=1&&SEEN[0].cands.indexOf(x.seg.uid)>=0,JSON.stringify(SEEN));
  ok('エプシロン: 装備カードを墓地へ送り、選んだ相手モンスターを破壊した',z(x.seg)==='grave'&&z(x.f1)==='grave'&&z(x.f2)==='mz',JSON.stringify([z(x.seg),z(x.f1),z(x.f2)]));
  ok('エプシロン 発動準備: 破壊対象の候補に「効果モンスターの効果の対象にならない」ジュラック・タイタンは出ない（ワイト・ライオウは出る）',SEEN.length>=2&&SEEN[1].cands.indexOf(x.ti.uid)<0&&SEEN[1].cands.indexOf(x.f1.uid)>=0&&SEEN[1].cands.indexOf(x.f2.uid)>=0,JSON.stringify(SEEN));
  ok('エプシロン negative: 1ターンに1度（2回目は発動できない）',legalZ('mz',x.e)===false,JSON.stringify(getLegalZoneActions(0,'mz',idx(x.e)).map(a=>a.id)));
  audit('エプシロン 2'); }
{ fresh();const e=mon(EPS,0),f=mon('ワイト',1);gameState.players[0].mz=[e];gameState.players[1].mz=[f];baselineA();
  ok('エプシロン negative: 装備カードが無ければ発動できない',legalZ('mz',e)===false,JSON.stringify(getLegalZoneActions(0,'mz',idx(e)).map(a=>a.id))); }
{ const x=epsField({onlyTitan:true});
  ok('エプシロン negative: 対象にできる相手モンスターが残っていなければ発動できない（タイタンだけ）',legalZ('mz',x.e)===false,JSON.stringify(getLegalZoneActions(0,'mz',idx(x.e)).map(a=>a.id)));
  ok('エプシロン fixture 確認: 相手モンスターがいること',z(x.ti)==='mz','');
  /* 対照: タイタンの代わりに通常モンスターなら発動できる */
  gameState.players[1].mz=[mon('ワイト',1)];
  ok('エプシロン control: 通常モンスターに入れ替えると発動できる',legalZ('mz',x.e)===true,''); }
{ /* 相手のターンには発動できない（起動効果） */
  const x=epsField({});endTurn();
  ok('エプシロン negative: 相手のメインフェイズには発動できない',legalZ('mz',x.e)===false,''); }
{ /* 相手の装備魔法もコストにできる (wiki 2010-08-04「このカードに装備された相手の装備魔法を墓地に送れますか？」→「はい」) */
  fresh();const e=mon(EPS,0),f=mon('ワイト',1),s1=mk(SEG,1,'up');
  gameState.players[0].mz=[e];gameState.players[1].mz=[f];gameState.players[1].hand=[s1];baselineA();
  endTurn();gameState.phase='main1';
  PREFER=[uid(e)];duelActivateFromHand(0);for(let i=0;i<10&&pc();i++)pick();drive();PREFER=[];
  ok('エプシロン fixture: 相手の装備魔法が自分のエプシロンに装備された',!!C(s1)&&!!C(s1).equipTo&&C(s1).equipTo.uid===e.uid,String(z(s1)));
  endTurn();
  ok('エプシロン 裁定(wiki 10/08/04): 相手の装備魔法もコストとして墓地へ送れる（発動できる）',legalZ('mz',e)===true,'');
  actC(e,[uid(s1),uid(f)]);
  ok('エプシロン 裁定(wiki 10/08/04): 相手の装備カードを墓地へ送って相手モンスターを破壊した',z(s1)==='grave'&&z(f)==='grave',JSON.stringify([z(s1),z(f)])); }
{ /* Synchro召喚の素材: 光属性チューナー＋チューナー以外のモンスター1体以上（レベル合計8） */
  const l6=CARD_DB.find(c=>c.k==='m'&&c.lv===6&&(c.st||[]).indexOf('チューナー')<0&&(c.st||[]).indexOf('シンクロ')<0&&!c.ex&&c.d<='2011-08-31'&&(c.st||[]).indexOf('効果')>=0);
  const l7=CARD_DB.find(c=>c.k==='m'&&c.lv===7&&(c.st||[]).indexOf('チューナー')<0&&(c.st||[]).indexOf('シンクロ')<0&&!c.ex&&c.d<='2011-08-31'&&(c.st||[]).indexOf('効果')>=0);
  fresh();const lt=mon('ヴァイロン・テトラ',0),n6=mon(l6.n,0),dt=mon('ターボ・シンクロン',0),n7=mon(l7.n,0),ns=mon('ヴァイロン・ソルジャー',0),ex=mk(EPS,0);
  gameState.players[0].mz=[lt,n6,dt,n7,ns];gameState.players[0].ex=[ex];baselineA();
  const cb=combos(EPS),i=m=>gameState.players[0].mz.indexOf(m),key=(...m)=>m.map(i).sort((a,b)=>a-b).join();
  ok('エプシロン: 光属性チューナー（ヴァイロン・テトラ Lv2）＋チューナー以外（'+l6.n+' Lv6）=8 は素材になる',cb.indexOf(key(lt,n6))>=0,JSON.stringify(cb));
  ok('エプシロン negative: 光属性チューナー＋Lv4のチューナー以外 = 6 はレベルが合わない',cb.indexOf(key(lt,ns))<0,JSON.stringify(cb));
  ok('エプシロン negative: 風属性のチューナー（ターボ・シンクロン Lv1）＋Lv7 = 8 でも光属性チューナーでないので素材にならない',cb.indexOf(key(dt,n7))<0&&cb.every(c=>c.split(',').map(Number).indexOf(i(dt))<0),JSON.stringify(cb));
  PREFER=[];doSynchro([lt,n6]);
  ok('エプシロン: 実際にシンクロ召喚できる',z(ex)==='mz'&&z(lt)==='grave'&&z(n6)==='grave',JSON.stringify([z(ex),z(lt),z(n6)])); }

/* ================= ターボ・ウォリアー ================= */
function turField(withTurbo){
  fresh();const t=mon(TUR,0),own=mon('ライオウ',0),h7=mon('ブラック・ローズ・ドラゴン',1),e4=mon('ライオウ',1),n=mon('ワイト',1),tr=setCard('強制脱出装置',1),sp=mk('月の書',1,'up'),e6=mon('氷結界の龍 ブリューナク',1);
  gameState.players[0].mz=withTurbo?[t,own]:[own];gameState.players[1].mz=[h7,e4,n,e6];gameState.players[1].sz=[tr];gameState.players[1].hand=[sp];baselineA();
  return {t,own,h7,e4,n,tr,sp,e6};}
{ const x=turField(true);
  atPrep(C(x.e4),1);
  ok('ターボ 発動準備中: レベル4の効果モンスターの効果は対象に取れない',kept(x.t,1)===0,'kept='+kept(x.t,1));
  atPrep(C(x.e6),1);
  ok('ターボ 発動準備中(境界): レベル6のシンクロ効果モンスターの効果も対象に取れない（レベル6以下）',kept(x.t,1)===0,'kept='+kept(x.t,1));
  atResolution(C(x.e4),1);
  ok('ターボ 前提: 解決時は ACTIVATION_PREP_S03 が空',resolvedCtxPremise(),'');
  ok('ターボ 解決時: レベル4の効果モンスターの効果は対象に取れない',kept(x.t,1)===0,'kept='+kept(x.t,1));
  atResolution(C(x.e6),1);
  ok('ターボ 解決時(境界): レベル6の効果モンスターの効果は対象に取れない',kept(x.t,1)===0,'kept='+kept(x.t,1));
  atResolution(C(x.h7),1);
  ok('ターボ negative: レベル7の効果モンスターの効果は対象に取れる（解決時）',kept(x.t,1)===1,'kept='+kept(x.t,1));
  atPrep(C(x.h7),1);
  ok('ターボ negative: レベル7の効果モンスターの効果は対象に取れる（発動準備中）',kept(x.t,1)===1,'kept='+kept(x.t,1));
  atResolution(C(x.n),1);
  ok('ターボ negative: 通常モンスターは効果モンスターではないので対象に取れる（解決時）',kept(x.t,1)===1,'kept='+kept(x.t,1));
  atResolution(C(x.sp),1);
  ok('ターボ negative: 魔法の効果は対象に取れる（解決時）',kept(x.t,1)===1,'kept='+kept(x.t,1));
  atResolution(C(x.tr),1);
  ok('ターボ negative: 罠の効果は対象に取れる（解決時）',kept(x.t,1)===1,'kept='+kept(x.t,1));
  { const xy=mon('No.10 白輝士イルミネーター',1); gameState.players[1].mz.push(xy);
    atResolution(C(xy),1);
    ok('ターボ 裁定: エクシーズモンスターにレベルは無い（ランク4）ので「レベル6以下の効果モンスター」ではなく、その効果は対象に取れる（解決時）',kept(x.t,1)===1,'kept='+kept(x.t,1)); }
  atResolution(C(x.own),0);
  ok('ターボ 裁定: 自分のレベル4効果モンスターの効果も対象に取れない（持ち主を問わない）（解決時）',kept(x.t,0)===0,'kept='+kept(x.t,0));
  atResolution(C(x.e4),1);
  ok('ターボ negative: 他のモンスター（ライオウ）は守られない（解決時）',kept(x.own,1)===1,'kept='+kept(x.own,1));
  clearCtx();
  /* 効果の出所が既に場を離れていても（墓地の状態でも）データベース上のレベルで判定する */
  const lv=curLV(C(x.e4)); API.sendToGrave(locateCardAnyV4(x.e4),'test');
  atResolution(C(x.e4),1);
  ok('ターボ 裁定: 効果の出所が解決時に墓地にいても（最後の情報として）レベルで判定する',lv===4&&kept(x.t,1)===0,'lv='+lv+' kept='+kept(x.t,1));
  clearCtx(); }
{ const x=turField(false);
  atResolution(C(x.e4),1);
  ok('ターボ control: ターボ・ウォリアーがいなければ同じ効果は同じモンスターを対象に取れる（解決時）',kept(x.own,1)===1,'kept='+kept(x.own,1));
  clearCtx(); }
{ /* Synchro召喚: 「ターボ・シンクロン」＋チューナー以外 */
  fresh();const tsy=mon('ターボ・シンクロン',0),ns=mon('ライオウ',0),ot=mon('ヴァイロン・テトラ',0),ex=mk(TUR,0);
  gameState.players[0].mz=[tsy,ns,ot];gameState.players[0].ex=[ex];baselineA();
  const cb=combos(TUR),i=m=>gameState.players[0].mz.indexOf(m);
  ok('ターボ: 「ターボ・シンクロン」(Lv1)＋チューナー以外（ライオウ Lv4）は素材にならない（レベル合計5≠6）',cb.indexOf([i(tsy),i(ns)].sort((a,b)=>a-b).join())<0,JSON.stringify(cb)); }
{ fresh();const tsy=mon('ターボ・シンクロン',0),ot=mon('ヴァイロン・テトラ',0),ex=mk(TUR,0);
  /* レベル5のチューナー以外を探す */
  const l5=CARD_DB.find(c=>c.k==='m'&&c.lv===5&&(c.st||[]).indexOf('チューナー')<0&&(c.st||[]).indexOf('シンクロ')<0&&!c.ex&&c.d<='2011-08-31');
  const ns5=mon(l5.n,0);
  gameState.players[0].mz=[tsy,ns5,ot];gameState.players[0].ex=[ex];baselineA();
  const cb=combos(TUR),i=m=>gameState.players[0].mz.indexOf(m);
  ok('ターボ: 「ターボ・シンクロン」＋Lv5のチューナー以外（'+l5.n+'）は素材になる',cb.indexOf([i(tsy),i(ns5)].sort((a,b)=>a-b).join())>=0,JSON.stringify(cb));
  ok('ターボ negative: 別のチューナー（ヴァイロン・テトラ）では素材にならない',cb.indexOf([i(ot),i(ns5)].sort((a,b)=>a-b).join())<0,JSON.stringify(cb)); }

/* ターボ・ウォリアーの攻撃: レベル6以上のシンクロを攻撃対象にした攻撃宣言時に攻撃力が半分になる */
function turBattle(targetName,pos){
  fresh();const t=mon(TUR,0),f=mon(targetName,1,pos||'atk');t.summonedTurn=3;
  gameState.players[0].mz=[t];gameState.players[1].mz=[f];baselineA();
  const lp0=lp(1);phase('battle');myAttack(t,f);return {t,f,dmg:lp0-lp(1)};}
{ const r=turBattle(EPS);
  ok('ターボ 攻撃: レベル8のシンクロ（攻撃力2800）を攻撃 → 半分の1400になり、ターボ(2500)が勝つ（相手モンスターは破壊される）',z(r.f)==='grave'&&z(r.t)==='mz',JSON.stringify([z(r.f),z(r.t)]));
  ok('ターボ 攻撃: 戦闘ダメージは 2500-1400=1100',r.dmg===1100,'dmg='+r.dmg);
  audit('ターボ 2'); }
{ const r=turBattle('氷結界の龍 ブリューナク');
  ok('ターボ 攻撃(境界): レベル6ちょうどのシンクロも半分（2300→1150、ダメージ1350）',z(r.f)==='grave'&&r.dmg===1350,JSON.stringify([z(r.f),r.dmg])); }
{ const r=turBattle('TG パワー・グラディエイター');
  ok('ターボ negative: レベル5のシンクロは半分にならない（2500 vs 2300 → ダメージ200）',z(r.f)==='grave'&&r.dmg===200,JSON.stringify([z(r.f),r.dmg])); }
{ const r=turBattle('ブラック・マジシャン');
  ok('ターボ negative: シンクロでないモンスターは半分にならない（2500 vs 2500 の相打ち）',z(r.f)==='grave'&&z(r.t)==='grave',JSON.stringify([z(r.f),z(r.t)])); }
{ const r=turBattle('ジオ・ジェネクス','def');
  ok('ターボ 攻撃: 守備表示のレベル6シンクロ（守備力2800）は攻撃力を半分にされても守備力で受ける → ターボ(2500)は反射ダメージ300を受ける',z(r.f)==='mz'&&z(r.t)==='mz'&&lp(0)===8000-300,JSON.stringify([z(r.f),z(r.t),lp(0)]));
  ok('ターボ 裁定: 半分にした攻撃力は「ダメージステップ終了時まで」— 戦闘後は元の1800に戻る',gv(r.f)===1800,'atk='+gv(r.f));
  ok('ターボ 裁定: 戦闘が終わったので半分の記録は効果を持たない（次の攻撃宣言まで）',(typeof u457TurboHalved==='function'?u457TurboHalved(C(r.f),C(r.t)):-1)===0,''); }
{ /* 通常モンスターを攻撃 → 後から攻撃対象がレベル6シンクロに移されても発動しない (wiki 2010-05-04) — 宣言時の攻撃対象で発動可否が決まる */
  fresh();const t=mon(TUR,0),n=mon('ワイト',1),sy=mon(EPS,1);t.summonedTurn=3;
  gameState.players[0].mz=[t];gameState.players[1].mz=[n,sy];baselineA();
  phase('battle');myAttack(t,n);
  ok('ターボ 裁定(wiki 10/05/04): 通常モンスターを攻撃宣言した場合は発動しない（シンクロ側は半分にならない）',z(sy)==='mz'&&gv(sy)===2800,'atk='+gv(sy)); }

/* ================= 救世の儀式 ================= */
function ritField(grave){
  fresh();const s=mk(RIT,0),n=mk(NOR,0),ti=mon(TIT,0),r1=mon('ワイト',0),r2=mon('ワイト',0);
  gameState.players[0].hand=grave?[]:[s,n];gameState.players[0].mz=grave?[]:[ti];
  if(grave){ gameState.players[0].grave=[s]; }
  baselineA();return {s,n,ti,r1,r2};}
{ const x=ritField(false);
  ok('救世の儀式: レベル9のタイタン1体でレベルの合計7以上を満たし儀式召喚できる',API.ritualCanActivate(0,RIT)===true,'');
  PREFER=[x.n.uid,x.ti.uid];duelActivateFromHand(0);drive();PREFER=[];
  ok('救世の儀式: ノースウェムコが儀式召喚され、対象耐性を持つタイタンもリリースできた（リリースは対象ではない）',z(x.n)==='mz'&&z(x.ti)==='grave'&&z(x.s)==='grave',JSON.stringify([z(x.n),z(x.ti),z(x.s)]));
  audit('救世の儀式 1'); }
{ fresh();const s=mk(RIT,0),n=mk(NOR,0),a=mon('ワイト',0),b=mon('ワイト',0);   /* ワイト Lv1 ×2 */
  gameState.players[0].hand=[s,n];gameState.players[0].mz=[a,b];baselineA();
  ok('救世の儀式 negative: レベルの合計が7に満たない（Lv1+Lv1）と儀式召喚できない',API.ritualCanActivate(0,RIT)===false,''); }
{ fresh();const s=mk(RIT,0),a=mon('青眼の白龍',0);
  gameState.players[0].hand=[s];gameState.players[0].mz=[a];baselineA();
  ok('救世の儀式 negative: 手札にノースウェムコがいなければ発動できない',API.ritualCanActivate(0,RIT)===false,''); }
{ fresh();const s=mk(RIT,0),n=mk(NOR,0),a=mon(dbk('ワイト')?'ワイト':'ワイト',0),b=mon('ライオウ',0),c=mon('青眼の白龍',0);
  gameState.players[0].hand=[s,n];gameState.players[0].mz=[a,b,c];baselineA();
  PREFER=[n.uid,c.uid];duelActivateFromHand(0);drive();PREFER=[];
  ok('救世の儀式 ルール: 手札のモンスターもフィールドのモンスターもリリースにできる（青眼 Lv8 1体でよい）',z(n)==='mz'&&z(c)==='grave'&&z(a)==='mz'&&z(b)==='mz',JSON.stringify([z(n),z(c),z(a),z(b)])); }

function guardField(opts){
  opts=opts||{};
  fresh();const s=mk(RIT,0),n=mon(NOR,0),other=mon('ワイト',0),foeM=mon('ライオウ',1),foeT=setCard('強制脱出装置',1),foeS=mk('月の書',1,'up');
  gameState.players[0].grave=[s];gameState.players[0].mz=opts.noRitual?[other]:[n,other];gameState.players[1].mz=[foeM];gameState.players[1].sz=[foeT];gameState.players[1].hand=[foeS];baselineA();
  return {s,n,other,foeM,foeT,foeS};}
{ const x=guardField();
  ok('救世の儀式 ②: 墓地から自分のメインフェイズに発動できる',legalZ('grave',x.s)===true,JSON.stringify(getLegalZoneActions(0,'grave',idx(x.s)).map(a=>a.id)));
  PREFER=[uid(x.n)];actZG('grave',x.s,[uid(x.n)]);
  ok('救世の儀式 ②: コストとして墓地のこのカードがゲームから除外された',z(x.s)==='banish',z(x.s));
  ok('救世の儀式 ②: 選択した儀式モンスターに記録（uid・ターン）',C(x.s)&&C(x.s).u457Guard&&C(x.s).u457Guard.uid===x.n.uid&&C(x.s).u457Guard.turn===gameState.turn,JSON.stringify(C(x.s)&&C(x.s).u457Guard));
  atPrep(C(x.foeM),1);
  ok('救世の儀式 ② 発動準備中: 相手の効果モンスターの効果は選択した儀式モンスターを対象に取れない',kept(x.n,1)===0,'kept='+kept(x.n,1));
  atResolution(C(x.foeM),1);
  ok('救世の儀式 ② 前提: 解決時は ACTIVATION_PREP_S03 が空',resolvedCtxPremise(),'');
  ok('救世の儀式 ② 解決時: 相手の効果モンスターの効果は選択した儀式モンスターを対象に取れない',kept(x.n,1)===0,'kept='+kept(x.n,1));
  atResolution(C(x.foeS),1);
  ok('救世の儀式 ② 解決時: 相手の魔法の効果も対象に取れない（カードの効果すべて）',kept(x.n,1)===0,'kept='+kept(x.n,1));
  atResolution(C(x.foeT),1);
  ok('救世の儀式 ② 解決時: 相手の罠の効果も対象に取れない',kept(x.n,1)===0,'kept='+kept(x.n,1));
  atResolution(C(x.other),0);
  ok('救世の儀式 ② 裁定: 自分の効果も対象に取れない（「カードの効果の対象にならない」）',kept(x.n,0)===0,'kept='+kept(x.n,0));
  atResolution(C(x.foeM),1);
  ok('救世の儀式 ② negative: 選択していないモンスターは対象に取れる',kept(x.other,1)===1,'kept='+kept(x.other,1));
  clearCtx();
  audit('救世の儀式 2');
  endTurn();
  atResolution(C(x.foeM),0);
  ok('救世の儀式 ② 裁定: 「このターン」だけ — 次のターンには再び対象に取れる',kept(x.n,0)===1,'kept='+kept(x.n,0));
  clearCtx(); }
{ const x=guardField({noRitual:true});
  ok('救世の儀式 ② negative: 自分フィールドに儀式モンスターがいなければ発動できない',legalZ('grave',x.s)===false,''); }
{ const x=guardField();endTurn();
  ok('救世の儀式 ② negative(wiki 09/07/19): 相手のターン（自分のメインフェイズ以外）には発動できない',legalZ('grave',x.s)===false,''); }
{ const x=guardField();
  gameState.players[0].mz=[x.other,mon('ワイト',0)];
  ok('救世の儀式 ② negative: 儀式モンスターでないモンスターは選べない',legalZ('grave',x.s)===false,''); }
{ /* 対象耐性のある儀式モンスターは「対象」に選べない — 救世の儀式 ②は対象を取る (wiki 09/08/01) */
  const x=guardField();
  x.n.face='down';
  ok('救世の儀式 ② negative: 裏側表示の儀式モンスターは選べない（表側のみ）',legalZ('grave',x.s)===false,''); }
`);
