/* S03-U22 DAMAGE_STEP_TRIGGER_STAT_CHANGE
   Requirement: a trigger effect activated in the damage step (「ダメージ計算後に発動する」, 「戦闘によって相手モンスターを破壊し
   墓地へ送った時」) changes ATK/DEF when it resolves, even after damage calculation. Free-chain ATK/DEF changes stay limited to
   before damage calculation, and damageStepOnly effects to damage calculation.
   2011 wiki: ヘル・ツイン・コップ 「このカードの誘発効果の効果解決時に攻撃力が上がります」; ファイターズ・エイプ: the ATK-up after
   battle destruction is a trigger effect that creates a chain block.
   Before the fix: chain resolution does not set ACTIVE_SCRIPT, so canModifyNow applied the free-chain rule to every chain block and
   refused 「ダメージ計算時以降は攻守を変更できません」 (ファイターズ・エイプ stayed 1900, ジュラック・ティラヌス 2500, and ロケット戦士's
   target kept its ATK).
   Every card named here is TESTED or GENERIC_OK. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;}
function drive(){for(let i=0;i<300;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(EVT_V2_STATE)return 'evt';
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
let SEEN=[];
function settle(){for(let k=0;k<20;k++){const r=drive();if(r==='evt'){EVT_V2_STATE.groups.flat().forEach(c=>SEEN.push(c.name));const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank];if(g&&g.length)eventPickV2(0);else eventSkipGroupV2();continue;}if(r==='choice'){__choicePickV49(0);continue;}return r;}return 'loop';}
function zoneOf(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,300));return pkg;}
function addsOf(pkg){return pkg.actions.map(x=>x&&x.action).filter(x=>x&&x.type==='CHAIN_ADD').map(x=>({name:x.name,eventName:x.eventName||null}));}
function battle(build){fresh();SEEN=[];const b=build();gameState.players[0].mz=b.mine;gameState.players[1].mz=b.theirs;gameState.activePlayer=0;gameState.phase='battle';baselineA();
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});settle();return b;}
function refused(){return TOASTS.some(t=>t.indexOf('ダメージ計算時以降は攻守を変更できません')>=0);}

/* ===== ファイターズ・エイプ: destroys a monster by battle → ATK +300 ===== */
let B=battle(()=>{const ape=mk('ファイターズ・エイプ',0),w=mk('ワイト',1);return {mine:[ape],theirs:[w],ape,w};});
let pkg=audit('ファイターズ・エイプ');
ok('ファイターズ・エイプ destroys ワイト: its trigger is chained in the damage step and its ATK becomes 2200',
  zoneOf(B.w)==='grave'&&curATK(B.ape)===2200&&!refused()&&addsOf(pkg).some(x=>x.name==='ファイターズ・エイプ'&&x.eventName==='onDamageStep'),
  JSON.stringify({atk:curATK(B.ape),adds:addsOf(pkg),toasts:TOASTS}));

/* ===== ジュラック・ティラヌス: destroys a monster by battle and sends it to the GY → ATK +300 ===== */
B=battle(()=>{const ty=mk('ジュラック・ティラヌス',0),w=mk('ワイト',1);return {mine:[ty],theirs:[w],ty,w};});
audit('ジュラック・ティラヌス');
ok('ジュラック・ティラヌス destroys ワイト: its ATK becomes 2800',zoneOf(B.w)==='grave'&&curATK(B.ty)===2800&&!refused(),JSON.stringify({atk:curATK(B.ty),toasts:TOASTS}));

/* ===== ロケット戦士: after damage calculation, the attack target loses 500 ATK ===== */
B=battle(()=>{const rk=mk('ロケット戦士',0),wolf=mk('ジェネティック・ワーウルフ',1);return {mine:[rk],theirs:[wolf],rk,wolf};});
audit('ロケット戦士');
ok('ロケット戦士 attacks ジェネティック・ワーウルフ: not destroyed and no damage in its own Battle Phase; after damage calculation the target has 1500 ATK',
  zoneOf(B.rk)==='mz'&&zoneOf(B.wolf)==='mz'&&gameState.players[0].lp===8000&&curATK(B.wolf)===1500&&!refused(),
  JSON.stringify({rk:zoneOf(B.rk),wolfAtk:curATK(B.wolf),lp:gameState.players[0].lp,toasts:TOASTS}));

/* ===== the rule itself: which resolving blocks may change ATK/DEF in each damage-step step ===== */
fresh();baselineA();
const hasApi=typeof beginLinkResolutionS03==='function'&&typeof endLinkResolutionS03==='function';
ok('the resolving-block marker exists',hasApi);
if(hasApi){
  const withStep=(step,fn)=>{gameState.battle={player:0,atkIdx:0,target:0,step};try{return fn();}finally{gameState.battle=null;endLinkResolutionS03();}};
  const trig={name:'T',eventName:'onDamageStep'},free={name:'F',eventName:null},dso={name:'D',eventName:null};
  ok('outside a chain, after damage calculation: refused (free-chain rule)',withStep('after',()=>canModifyNow())===false);
  ok('outside a chain, before damage calculation: allowed',withStep('before',()=>canModifyNow())===true);
  ok('a resolving trigger block after damage calculation: allowed',withStep('after',()=>{beginLinkResolutionS03(trig,{});return canModifyNow();})===true);
  ok('a resolving trigger block at the end of the damage step: allowed',withStep('end',()=>{beginLinkResolutionS03(trig,{});return canModifyNow();})===true);
  ok('a resolving free-chain block after damage calculation: refused',withStep('after',()=>{beginLinkResolutionS03(free,{});return canModifyNow();})===false);
  ok('a resolving free-chain block before damage calculation: allowed',withStep('before',()=>{beginLinkResolutionS03(free,{});return canModifyNow();})===true);
  ok('a resolving damageStepOnly block at damage calculation: allowed',withStep('calc',()=>{beginLinkResolutionS03(dso,{damageStepOnly:true});return canModifyNow();})===true);
  ok('a resolving damageStepOnly block after damage calculation: refused',withStep('after',()=>{beginLinkResolutionS03(dso,{damageStepOnly:true});return canModifyNow();})===false);
  ok('the marker is cleared when the chain ends',(()=>{beginLinkResolutionS03(trig,{});endLinkResolutionS03();return withStep('after',()=>canModifyNow());})()===false);
}
`);
