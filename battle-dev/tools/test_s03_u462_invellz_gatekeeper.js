/* S03-U462 — インヴェルズの門番.
   2011 text / ruling:
   - while a face-up Gatekeeper witnessed a face-up 「インヴェルズ」
     Advance Summon, its controller gets one additional Normal Summon or Set
     that turn;
   - multiple Gatekeepers still grant only one shared additional action;
   - Gatekeeper itself may be Tributed for that additional Advance Summon.
   Real DUEL paths, negatives and Replay audit. */
const harness=require('./astra_harness');
const COMMON=String.raw`
let PREFER=[];
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function fresh(){resetA();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=8;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x46201103;}
function hi(c){return gameState.players[0].hand.indexOf(c);}
function choose(){const q=pendingChoiceV49(gameState);if(!q)return false;let i=q.candidates.findIndex(x=>PREFER.includes(x.uid));if(i<0)i=0;__choicePickV49(i);return true;}
function drive(){for(let i=0;i<800;i++){
  if(pendingChoiceV49(gameState)){choose();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&(gameState.processorQueue||[]).length){pumpProcessorV27();continue;}
  return 'idle';
}return 'loop';}
function actions(c){const i=hi(c);return i<0?[]:getLegalHandActions(0,i);}
function extraKey(c){const a=actions(c).find(x=>x.id==='extraNormalSummon');if(!a)return null;const m=/doExtraNormalSummonV370\([^,]+,["']([^"']+)["']\)/.exec(a.run);return m&&m[1];}
function extraSummon(c){const k=extraKey(c);if(!k)return false;doExtraNormalSummonV370(hi(c),k);drive();return true;}
function extraSetKey(c){const a=actions(c).find(x=>x.id==='extraSetMonster');if(!a)return null;const m=/doExtraSetMonsterV370\([^,]+,["']([^"']+)["']\)/.exec(a.run);return m&&m[1];}
function extraSet(c){const k=extraSetKey(c);if(!k)return false;doExtraSetMonsterV370(hi(c),k);drive();return true;}
function tributeSummon(c,tribute){PREFER=[tribute.uid];doNormalSummon(hi(c),'atk');drive();PREFER=[];}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit',pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,260));}
`;

harness(COMMON+String.raw`
fresh();const gate=mk('インヴェルズの門番',0,'up'),fodder=mk('ワイト',0,'up'),morse=mk('インヴェルズ・モース',0),wolf=mk('ジェネティック・ワーウルフ',0);gameState.players[0].mz=[gate,fodder];gameState.players[0].hand=[morse,wolf];baselineA();
tributeSummon(morse,fodder);
ok('A: face-up Gatekeeper witnessed a face-up Invellz Advance Summon',z(morse)==='mz'&&morse.tributeCount===1&&!!extraKey(wolf),JSON.stringify({morse:z(morse),tributes:morse.tributeCount,key:extraKey(wolf)}));
ok('A: the additional Normal Summon succeeds',extraSummon(wolf)&&z(wolf)==='mz',JSON.stringify({wolf:z(wolf)}));
audit('A');
`);

harness(COMMON+String.raw`
fresh();const gate=mk('インヴェルズの門番',0,'up'),fodder=mk('ワイト',0,'up'),morse=mk('インヴェルズ・モース',0),wolf=mk('ジェネティック・ワーウルフ',0);gameState.players[0].mz=[gate,fodder];gameState.players[0].hand=[morse,wolf];baselineA();
tributeSummon(morse,fodder);
ok('B: the additional action may be a Set',!!extraSetKey(wolf)&&extraSet(wolf)&&z(wolf)==='mz'&&wolf.face==='down'&&wolf.pos==='def',JSON.stringify({key:extraSetKey(wolf),zone:z(wolf),face:wolf.face,pos:wolf.pos}));
audit('B');
`);

harness(COMMON+String.raw`
fresh();const gate1=mk('インヴェルズの門番',0,'up'),gate2=mk('インヴェルズの門番',0,'up'),fodder=mk('ワイト',0,'up'),morse=mk('インヴェルズ・モース',0),wolf1=mk('ジェネティック・ワーウルフ',0),wolf2=mk('セイバーザウルス',0);gameState.players[0].mz=[gate1,gate2,fodder];gameState.players[0].hand=[morse,wolf1,wolf2];baselineA();
tributeSummon(morse,fodder);extraSummon(wolf1);
ok('C: two Gatekeepers still grant only one shared additional action',z(wolf1)==='mz'&&!extraKey(wolf2)&&!extraSetKey(wolf2),JSON.stringify(actions(wolf2)));
`);

harness(COMMON+String.raw`
fresh();const gate=mk('インヴェルズの門番',0,'up'),fodder=mk('ワイト',0,'up'),morse=mk('インヴェルズ・モース',0),demon=mk('デーモンの召喚',0);gameState.players[0].mz=[gate,fodder];gameState.players[0].hand=[morse,demon];baselineA();
tributeSummon(morse,fodder);PREFER=[gate.uid];
ok('D setup: additional Advance Summon is offered',!!extraKey(demon),extraKey(demon));
extraSummon(demon);PREFER=[];
ok('D: Gatekeeper can be Tributed for the additional Advance Summon',z(gate)==='grave'&&z(demon)==='mz'&&demon.tributeCount===1,JSON.stringify({gate:z(gate),demon:z(demon),tributes:demon.tributeCount}));
`);

harness(COMMON+String.raw`
fresh();const gate=mk('インヴェルズの門番',0,'up'),scout=mk('インヴェルズの斥候',0),wolf=mk('ジェネティック・ワーウルフ',0);gameState.players[0].mz=[gate];gameState.players[0].hand=[scout,wolf];baselineA();doNormalSummon(hi(scout),'atk');drive();
ok('E negative: an Invellz Normal Summon without a Tribute grants nothing',z(scout)==='mz'&&!extraKey(wolf)&&!extraSetKey(wolf),JSON.stringify(actions(wolf)));
`);
harness(COMMON+String.raw`
fresh();const gate=mk('インヴェルズの門番',0,'up'),fodder=mk('ワイト',0,'up'),demon=mk('デーモンの召喚',0),wolf=mk('ジェネティック・ワーウルフ',0);gameState.players[0].mz=[gate,fodder];gameState.players[0].hand=[demon,wolf];baselineA();tributeSummon(demon,fodder);
ok('F negative: a non-Invellz Advance Summon grants nothing',z(demon)==='mz'&&!extraKey(wolf)&&!extraSetKey(wolf),JSON.stringify(actions(wolf)));
`);
harness(COMMON+String.raw`
fresh();const gate=mk('インヴェルズの門番',0,'down'),fodder=mk('ワイト',0,'up'),morse=mk('インヴェルズ・モース',0),wolf=mk('ジェネティック・ワーウルフ',0);gate.pos='def';gameState.players[0].mz=[gate,fodder];gameState.players[0].hand=[morse,wolf];baselineA();tributeSummon(morse,fodder);
ok('G negative: a face-down Gatekeeper did not witness the Advance Summon',z(morse)==='mz'&&!extraKey(wolf)&&!extraSetKey(wolf),JSON.stringify(actions(wolf)));
`);

harness(COMMON+String.raw`
fresh();const gate=mk('インヴェルズの門番',0,'up'),fodder=mk('ワイト',0,'up'),morse=mk('インヴェルズ・モース',0),wolf=mk('ジェネティック・ワーウルフ',0);gameState.players[0].mz=[gate,fodder];gameState.players[0].hand=[morse,wolf];baselineA();tributeSummon(morse,fodder);
ok('H setup: grant exists before Gatekeeper is turned face-down',!!extraKey(wolf),extraKey(wolf));
let loc=findCardByUid(gate.uid);act({type:'FX_SET_STATE',player:loc.p,zone:loc.zone,index:loc.index,face:'down',pos:'def',reason:'U462 test'});loc=findCardByUid(gate.uid);act({type:'FX_SET_STATE',player:loc.p,zone:loc.zone,index:loc.index,face:'up',pos:'atk',reason:'U462 test'});
ok('H negative: face-down reset prevents the old grant from returning',!extraKey(wolf)&&!extraSetKey(wolf),JSON.stringify(actions(wolf)));
audit('H');
`);
