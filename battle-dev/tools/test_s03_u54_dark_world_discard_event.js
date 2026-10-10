/* S03-U54 Dark World discard-trigger event binding.
   Real-duel blocker found after U53: 【Dark World】 vs 兎ラギア fixed lists, responder mode, seeds
   0x52311003 / 0x52311004 / 0x52311006 / 0x52311007 stopped in RESPOND_LOOP because a stale
   Dark World card in the GY was repeatedly offered on an unrelated onDiscard event and then refused
   as Spell Speed 1 on an existing chain.
   Cards named here: 暗黒界の狩人 ブラウ, 暗黒界の武神 ゴルド, 暗黒界の軍神 シルバ,
   暗黒界の尖兵 ベージ, 暗黒界の術師 スノウ, 暗黒界の龍神 グラファ (TESTED). */
const harness=require('./astra_harness');
const {execFileSync}=require('child_process');
const path=require('path');
const os=require('os');

harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;TOASTS.length=0;}
function zoneOf(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function eventFor(card,byPlayer){
  return {player:card.owner,card,uid:card.uid,byEffect:true,byPlayer:byPlayer==null?card.owner:byPlayer,reason:'fixture'};
}
function handlerNames(evt){
  return collectHandlers('onDiscard',evt).map(x=>x.name+'#'+x.card.uid);
}
function pickFirstChoice(){
  const q=pendingChoiceV49(gameState);
  if(!q||!q.candidates||!q.candidates.length)return false;
  __choicePickV49(0);
  return true;
}

/* A. Only the card named by the current onDiscard event is allowed to answer.
      A stale discardInfo field on another Dark World card in the GY must not create a second trigger. */
fresh();
let brow=mk('暗黒界の狩人 ブラウ',0),goldd=mk('暗黒界の武神 ゴルド',0),silva=mk('暗黒界の軍神 シルバ',0);
let beige=mk('暗黒界の尖兵 ベージ',0),snoww=mk('暗黒界の術師 スノウ',0),grapha=mk('暗黒界の龍神 グラファ',0);
let wight=mk('ワイト',0);
[brow,goldd,silva,beige,snoww,grapha].forEach(c=>{c.discardInfo={byEffect:true,byPlayer:0,reason:'old discard'};});
wight.discardInfo={byEffect:true,byPlayer:0,reason:'current discard'};
gameState.players[0].grave=[brow,goldd,silva,beige,snoww,grapha,wight];
gameState.players[0].deck=[mk('暗黒界の龍神 グラファ',0),mk('暗黒界の狩人 ブラウ',0)];
gameState.activePlayer=0;gameState.phase='main1';baselineA();
let names=handlerNames(eventFor(wight,0));
ok('A: unrelated discard event does not offer stale Dark World triggers',names.length===0,JSON.stringify(names));

/* B. Each Dark World discard trigger still appears on its own onDiscard event. */
for(const c of [brow,goldd,silva,beige,snoww,grapha]){
  const got=handlerNames(eventFor(c,0));
  ok('B: '+cardName(c)+' is offered on its own effect discard event',
    got.some(x=>x.endsWith('#'+c.uid)),JSON.stringify(got));
}

/* C. The same uid guard is enforced when event.card is absent and only the journal-safe uid is present. */
names=handlerNames({player:0,uid:wight.uid,name:'ワイト',byEffect:true,byPlayer:0,reason:'fixture uid-only'});
ok('C: uid-only unrelated discard event also ignores stale Dark World cards',names.length===0,JSON.stringify(names));
names=handlerNames({player:0,uid:snoww.uid,name:'暗黒界の術師 スノウ',byEffect:true,byPlayer:0,reason:'fixture uid-only'});
ok('C: uid-only matching discard event still offers スノウ',names.some(x=>x.endsWith('#'+snoww.uid)),JSON.stringify(names));

/* D. Outside onDiscard, Grapha must use its normal grave Special Summon procedure even if the card still has old discardInfo. */
fresh();
grapha=mk('暗黒界の龍神 グラファ',0);
beige=mk('暗黒界の尖兵 ベージ',0);
const foe=mk('ヂェミナイ・エルフ',1);
grapha.discardInfo={byEffect:true,byPlayer:0,reason:'old discard'};
gameState.players[0].grave=[grapha];
gameState.players[0].mz=[beige];
gameState.players[1].mz=[foe];
gameState.activePlayer=0;gameState.phase='main1';baselineA();
const L=strictScriptLegalityV2('暗黒界の龍神 グラファ',0,'grave',0,{cardOverride:grapha});
ok('D: Grapha is legal from the GY as a Special Summon procedure, not a stale discard trigger',L.ok,JSON.stringify(L));
runScript('暗黒界の龍神 グラファ',0,'grave',0,{});
ok('D setup: Grapha asks for Dark World fodder to return as cost',/手札に戻す/.test((pendingChoiceV49(gameState)||{}).title||''),String((pendingChoiceV49(gameState)||{}).title||''));
pickFirstChoice();
ok('D: Grapha Special Summons itself, returns the fodder, and does not destroy the opponent field card',
  zoneOf(grapha)==='mz'&&zoneOf(beige)==='hand'&&zoneOf(foe)==='mz',
  JSON.stringify({grapha:zoneOf(grapha),beige:zoneOf(beige),foe:zoneOf(foe),toasts:TOASTS}));
`);

/* E. One pinned real-duel blocker seed now completes without RESPOND_LOOP and keeps Replay reproducible. */
const DRIVER=path.join(__dirname,'r1_duel_driver.js');
let result=null,err=null;
try{
  const out=execFileSync(process.execPath,[DRIVER,'0x52311003','0','80'],{
    encoding:'utf8',maxBuffer:256*1024*1024,
    env:Object.assign({},process.env,{R1_OUT:process.env.R1_OUT||os.tmpdir(),R1_RESPOND:'1',R1_LIST:'',R1_DECKS:'dark,rabbit'})
  });
  const line=out.split(/\r?\n/).find(l=>l.startsWith('R1RESULT '));
  result=line?JSON.parse(line.slice('R1RESULT '.length)):null;
}catch(e){err=String(e&&e.message||e).slice(0,500);}
const brief=result&&JSON.stringify({completed:result.completed,loser:result.loser,reason:result.reason,turn:result.turn,blocker:result.blocker&&result.blocker.kind,unsupported:result.unsupported,replay:result.replay});
console.log((result&&!err?'PASS ':'FAIL ')+'E: Dark World fixed-list blocker seed reports a result'+(err?' :: '+err:''));
console.log((result&&result.completed===true&&!result.blocker&&Array.isArray(result.unsupported)&&result.unsupported.length===0?'PASS ':'FAIL ')+'E: seed 0x52311003 dark-rabbit no longer stops on a stale discard trigger'+(brief?' :: '+brief:''));
console.log((result&&result.replay&&result.replay.ok===true&&result.replay.count===result.journal?'PASS ':'FAIL ')+'E: seed 0x52311003 Replay reproduces every digest'+(brief?' :: '+brief:''));
if(!result||err||result.completed!==true||result.blocker||(result.unsupported||[]).length||!result.replay||result.replay.ok!==true||result.replay.count!==result.journal)process.exitCode=2;
