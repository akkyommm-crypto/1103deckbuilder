/* S03-U456: CODEX-C03 source-aware targeting immunity — resolution-time regression.
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




const SEG='ヴァイロン・セグメント',BER='闇の侯爵ベリアル',GAR='氷結界の御庭番';
function dbk(n){return CARD_DB.find(x=>x.n===n);}
/* 対象を選んでいる効果のソースの文脈を直接作る（実エンジンと同じ関数）。 */
function clearCtx(){endActivationPrepS03();p3EndEffectContextV3();}
function atPrep(src,player){clearCtx();beginActivationPrepS03(player,src,cardName(src));}
function atResolution(src,player){clearCtx();p3BeginEffectContextV3(player,src,cardName(src));}
function kept(c,byPlayer){return filterTargetable([locateCardAnyV4(c)],byPlayer).length;}
function resolvedCtxPremise(){return typeof ACTIVATION_PREP_S03==='undefined'||ACTIVATION_PREP_S03===null;}

ok('fixture: ワイト is a Normal Monster / ライオウ an Effect Monster / 強制脱出装置 a Trap / 月の書 a Spell',
  dbk('ワイト').st.indexOf('効果')<0&&dbk('ライオウ').st.indexOf('効果')>=0&&dbk('強制脱出装置').k==='t'&&dbk('月の書').k==='s','');

/* ===== 氷結界の御庭番 ===== */
function gardenField(withGarden){
  fresh();const g=mon(GAR,0),dr=mon('氷結界の龍 グングニール',0),w=mon('ワイト',0),own=mon('ライオウ',0),foeM=mon('ライオウ',1),foeN=mon('ワイト',1),foeT=setCard('強制脱出装置',1);
  gameState.players[0].mz=withGarden?[g,dr,w,own]:[dr,w,own];gameState.players[1].mz=[foeM,foeN];gameState.players[1].sz=[foeT];baselineA();
  return {g,dr,w,own,foeM,foeN,foeT};}
{ const x=gardenField(true);
  atPrep(C(x.foeM),1);
  ok('御庭番 発動準備中: 相手の効果モンスターの効果は自分の氷結界モンスターを対象に取れない',kept(x.dr,1)===0,'kept='+kept(x.dr,1));
  atResolution(C(x.foeM),1);
  ok('御庭番 前提: 解決時は ACTIVATION_PREP_S03 が空で、旧 u378Source() は効果ソースを返さない',resolvedCtxPremise()&&u378Source()===null,JSON.stringify(typeof ACTIVATION_PREP_S03==='undefined'?null:ACTIVATION_PREP_S03));
  ok('御庭番 解決時: 相手の効果モンスターの効果は自分の氷結界モンスターを対象に取れない（本単位で直した退行）',kept(x.dr,1)===0,'kept='+kept(x.dr,1));
  ok('御庭番 解決時: 御庭番自身も氷結界モンスターとして守られる',kept(x.g,1)===0,'kept='+kept(x.g,1));
  ok('御庭番 negative: 氷結界でないモンスター（ワイト）は守られない（解決時）',kept(x.w,1)===1,'kept='+kept(x.w,1));
  atResolution(C(x.own),0);
  ok('御庭番 negative: 自分自身の効果なら自分の氷結界モンスターを対象に取れる（解決時）',kept(x.dr,0)===1,'kept='+kept(x.dr,0));
  atResolution(C(x.foeN),1);
  ok('御庭番 negative: 相手の通常モンスター（効果モンスターではない）は対象に取れる（解決時）',kept(x.dr,1)===1,'kept='+kept(x.dr,1));
  atResolution(C(x.foeT),1);
  ok('御庭番 negative: 相手の罠は対象に取れる（テキストは効果モンスターのみ）（解決時）',kept(x.dr,1)===1,'kept='+kept(x.dr,1));
  clearCtx(); }
{ const x=gardenField(false);
  atResolution(C(x.foeM),1);
  ok('御庭番 control: 御庭番が場にいなければ相手の効果モンスターは氷結界モンスターを対象に取れる（解決時）',kept(x.dr,1)===1,'kept='+kept(x.dr,1));
  clearCtx(); }

/* ===== ヴァイロン・セグメント（実際のカード発動経路で装備する） ===== */
function segField(withSeg){
  fresh();const v=mon('ヴァイロン・ソルジャー',0),w=mon('ワイト',0),own=mon('ライオウ',0),sg=mk(SEG,0),tr=setCard('強制脱出装置',1),mn=mk('月の書',1,'up'),gn=mon('ライオウ',1),hc=mk('ワイト',1);
  gameState.players[0].hand=withSeg?[sg]:[];gameState.players[0].mz=[v,w,own];gameState.players[1].sz=[tr];gameState.players[1].hand=[mn,hc];gameState.players[1].mz=[gn];baselineA();
  if(withSeg){cast(0,SEG,[uid(v)]);}
  return {v,w,own,sg,tr,mn,gn,hc};}
{ const x=segField(true);
  ok('セグメント fixture: 装備カードが「ヴァイロン」モンスターに実際に装備されている',equipped(x.v,x.sg),String(z(x.sg)));
  atPrep(C(x.tr),1);
  ok('セグメント 発動準備中: 相手の罠の効果は装備モンスターを対象に取れない',kept(x.v,1)===0,'kept='+kept(x.v,1));
  atResolution(C(x.tr),1);
  ok('セグメント 前提: 解決時は ACTIVATION_PREP_S03 が空',resolvedCtxPremise(),'');
  ok('セグメント 解決時: 相手の罠の効果は装備モンスターを対象に取れない（本単位で直した退行）',kept(x.v,1)===0,'kept='+kept(x.v,1));
  atResolution(C(x.gn),1);
  ok('セグメント 解決時: 相手の効果モンスターの効果も装備モンスターを対象に取れない',kept(x.v,1)===0,'kept='+kept(x.v,1));
  atResolution(C(x.mn),1);
  ok('セグメント negative: 相手の魔法は装備モンスターを対象に取れる（罠・効果モンスターのみ）（解決時）',kept(x.v,1)===1,'kept='+kept(x.v,1));
  atResolution(C(x.tr),1);
  ok('セグメント negative: 装備されていないモンスター（ワイト）は守られない（解決時）',kept(x.w,1)===1,'kept='+kept(x.w,1));
  atResolution(C(x.own),0);
  ok('セグメント negative: 自分自身の効果なら装備モンスターを対象に取れる（解決時）',kept(x.v,0)===1,'kept='+kept(x.v,0));
  clearCtx();
  audit('セグメント 1'); }
{ const x=segField(false);
  atResolution(C(x.tr),1);
  ok('セグメント control: 装備していなければ相手の罠は同じモンスターを対象に取れる（解決時）',kept(x.v,1)===1,'kept='+kept(x.v,1));
  clearCtx(); }

/* ===== 闇の侯爵ベリアル ===== */
function berField(withBer){
  fresh();const b=mon(BER,0),w=mon('ワイト',0),own=mon('ライオウ',0),foeM=mon('ライオウ',1),foeS=mk('月の書',1,'up'),foeT=setCard('強制脱出装置',1);
  gameState.players[0].mz=withBer?[b,w,own]:[w,own];gameState.players[1].mz=[foeM];gameState.players[1].hand=[foeS];gameState.players[1].sz=[foeT];baselineA();
  return {b,w,own,foeM,foeS,foeT};}
{ const x=berField(true);
  atPrep(C(x.foeS),1);
  ok('ベリアル 発動準備中: 相手の魔法の効果は自分の他のモンスターを対象に取れない',kept(x.w,1)===0,'kept='+kept(x.w,1));
  atResolution(C(x.foeS),1);
  ok('ベリアル 前提: 解決時は ACTIVATION_PREP_S03 が空',resolvedCtxPremise(),'');
  ok('ベリアル 解決時: 相手の魔法の効果は自分の他のモンスターを対象に取れない（本単位で直した退行）',kept(x.w,1)===0,'kept='+kept(x.w,1));
  atResolution(C(x.foeT),1);
  ok('ベリアル 解決時: 相手の罠の効果も自分の他のモンスターを対象に取れない',kept(x.w,1)===0,'kept='+kept(x.w,1));
  atResolution(C(x.foeS),1);
  ok('ベリアル negative: ベリアル自身は守られない（解決時）',kept(x.b,1)===1,'kept='+kept(x.b,1));
  atResolution(C(x.foeM),1);
  ok('ベリアル negative: 相手の効果モンスターの効果は対象に取れる（魔法・罠のみ防ぐ）（解決時）',kept(x.w,1)===1,'kept='+kept(x.w,1));
  atResolution(C(x.foeS),0);
  ok('ベリアル negative: 自分自身の効果なら自分の他のモンスターを対象に取れる（解決時）',kept(x.w,0)===1,'kept='+kept(x.w,0));
  clearCtx(); }
{ const x=berField(false);
  atResolution(C(x.foeS),1);
  ok('ベリアル control: ベリアルが場にいなければ相手の魔法は同じモンスターを対象に取れる（解決時）',kept(x.w,1)===1,'kept='+kept(x.w,1));
  clearCtx(); }
`);
