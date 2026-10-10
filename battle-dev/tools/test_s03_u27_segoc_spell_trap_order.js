/* S03-U27 SEGOC_SPELL_TRAP_ORDER
   Requirement: when a trigger effect and a Spell/Trap card that 「〜した時に発動できる」 are both available for the same event, all
   simultaneous trigger effects are put on the chain first (turn player's, then the opponent's), and the Spell/Trap cards are offered
   afterwards; a Spell Speed 1 trigger is never blocked by a trap chained before it.
   Found by vertical slice #6: P1's set 時の機械－タイム・マシーン was ranked among the trigger effects ahead of P2's optional
   紫炎の足軽 trigger. Once the trap was chained, picking 紫炎の足軽 was refused 「スペルスピードが足りません（SS1 / チェーン上 SS2）」
   and the same candidate was offered again forever.
   Every card named here is TESTED or GENERIC_OK. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;}
function zoneOf(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function drive(){for(let i=0;i<300;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(EVT_V2_STATE)return 'evt';
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
/* take(name) activates that candidate when offered; decline(name) skips its group; every other optional group is taken in order.
   A candidate offered again after being picked counts as a loop, and the group is skipped so the test ends. */
let OFFERS=[],LOOP=false;
function settle(take,decline){const picked={};
  for(let k=0;k<40;k++){const r=drive();
    if(r==='evt'){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];
      OFFERS.push({rank:st.rank,names:g.map(c=>c.name)});
      if(!g.length){eventSkipGroupV2();continue;}
      let i=g.findIndex(c=>take.includes(c.name));
      if(i<0 && g.some(c=>decline.includes(c.name))){ if(st.rank>=2){eventSkipGroupV2();continue;} }
      if(i<0) i=0;
      const n=g[i].name; picked[n]=(picked[n]||0)+1;
      if(picked[n]>2){LOOP=true; if(st.rank>=2){eventSkipGroupV2();continue;} else break;}
      eventPickV2(i);continue;}
    if(r==='choice'){__choicePickV49(0);continue;}
    return r;}
  return 'loop';}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,300));return pkg;}
function chainAdds(pkg){return pkg.actions.map(x=>x&&x.action).filter(x=>x&&x.type==='CHAIN_ADD').map(x=>x.name);}
function board(attackerName,withNegator){fresh();OFFERS=[];LOOP=false;
  const atk=mk(attackerName,0),tm=mk('時の機械－タイム・マシーン',0,'down');tm.setTurn=gameState.turn-1;
  const foot=mk('紫炎の足軽',1),pay=mk('六武衆の露払い',1,'down');
  gameState.players[0].mz=[atk];gameState.players[0].sz=[tm];gameState.players[1].mz=[foot];gameState.players[1].deck=[pay,mk('ワイト',1,'down')];
  gameState.activePlayer=0;gameState.phase='battle';baselineA();
  return {atk,tm,foot,pay};}

/* ===== both used: ジェネティック・ワーウルフ destroys 紫炎の足軽; P2's trigger first, then P1's 時の機械 ===== */
let B=board('ジェネティック・ワーウルフ');
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});
settle(['紫炎の足軽','時の機械－タイム・マシーン'],[]);
let pkg=audit('trigger and trap');
const adds=chainAdds(pkg);
ok('no endless re-offer: P2’s 紫炎の足軽 trigger can be activated although P1 has a set 時の機械',!LOOP&&!TOASTS.some(t=>t.indexOf('スペルスピードが足りません')>=0),JSON.stringify({loop:LOOP,toasts:TOASTS.slice(-3),offers:OFFERS}));
ok('order: the trigger effect is chain link 1 and the trap card link 2 (Spell/Trap cards are offered after all trigger effects)',adds.indexOf('紫炎の足軽')>=0&&adds.indexOf('時の機械－タイム・マシーン')>adds.indexOf('紫炎の足軽'),JSON.stringify(adds));
ok('resolution: 時の機械 (link 2) returns 紫炎の足軽 to P2’s field, then 紫炎の足軽’s effect (link 1) Special Summons 六武衆の露払い',
  zoneOf(B.foot)==='mz'&&zoneOf(B.pay)==='mz'&&zoneOf(B.tm)==='grave'&&!gameState.battle,
  JSON.stringify({foot:zoneOf(B.foot),pay:zoneOf(B.pay),tm:zoneOf(B.tm),mz1:gameState.players[1].mz.map(nm),battle:!!gameState.battle}));

/* ===== the VS6 board: 漆黒の魔王 LV4 destroys 紫炎の足軽; P1 declines 時の機械 ===== */
B=board('漆黒の魔王 LV4');
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});
settle(['漆黒の魔王 LV4','紫炎の足軽'],['時の機械－タイム・マシーン']);
audit('VS6 board');
ok('VS6 board: no endless re-offer; the battle ends',!LOOP&&!gameState.battle,JSON.stringify({loop:LOOP,offers:OFFERS,toasts:TOASTS.slice(-3)}));
ok('VS6 board: 紫炎の足軽’s trigger is activated and negated by 漆黒の魔王 LV4 (S03-U25); 時の機械 stays set',
  zoneOf(B.foot)==='grave'&&zoneOf(B.pay)==='deck'&&zoneOf(B.tm)==='sz'&&B.tm.face==='down',JSON.stringify({foot:zoneOf(B.foot),pay:zoneOf(B.pay),tm:zoneOf(B.tm)}));
const trapOffer=OFFERS.find(o=>o.names.includes('時の機械－タイム・マシーン'));
const footOffer=OFFERS.find(o=>o.names.includes('紫炎の足軽'));
ok('VS6 board: 時の機械 is offered in a later group than 紫炎の足軽',!!trapOffer&&!!footOffer&&trapOffer.rank>footOffer.rank,JSON.stringify(OFFERS));

/* ===== control: a trap alone is still offered (S03-U24 path) ===== */
fresh();OFFERS=[];LOOP=false;
{const wolf=mk('ジェネティック・ワーウルフ',1),w=mk('ワイト',0),tm=mk('時の機械－タイム・マシーン',0,'down');tm.setTurn=gameState.turn-1;
 gameState.players[1].mz=[wolf];gameState.players[0].mz=[w];gameState.players[0].sz=[tm];gameState.activePlayer=1;gameState.phase='battle';baselineA();
 requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});
 settle(['時の機械－タイム・マシーン'],[]);
 audit('control trap alone');
 ok('control: ワイト destroyed by P2’s attack is returned by P1’s 時の機械 (offered as the only candidate)',zoneOf(w)==='mz'&&zoneOf(tm)==='grave'&&!LOOP,JSON.stringify({w:zoneOf(w),tm:zoneOf(tm),offers:OFFERS}));}
`);
