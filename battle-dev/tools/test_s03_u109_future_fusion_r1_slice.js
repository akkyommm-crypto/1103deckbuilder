/* S03-U109 未来融合－フューチャー・フュージョン real-duel slice.
   Fixed Dragunity/レダメ vs 1103兎ラギア, normal DUEL path through tools/r1_duel_driver.js.
   This complements the focused U59 unit test by requiring a real match where the card is drawn,
   resolves, sends F・G・D materials, reaches the delayed 2nd own Standby Special Summon, and then
   continues to a normal win/loss with Replay parity and unsupported 0. */
const {execFileSync}=require('child_process');
const fs=require('fs');
const os=require('os');
const path=require('path');

const ROOT=path.resolve(__dirname,'..');
const DRIVER=path.join(__dirname,'r1_duel_driver.js');
const OUT=path.join(os.tmpdir(),'s03_u109_future_fusion_r1');
fs.mkdirSync(OUT,{recursive:true});

let fails=0;
function ok(name,v,detail){
  console.log((v?'PASS ':'FAIL ')+name+(detail?' :: '+detail:''));
  if(!v) fails++;
}

let result=null, error=null;
try{
  const out=execFileSync(process.execPath,[DRIVER,'0x52310006','0','80'],{
    cwd:ROOT,
    encoding:'utf8',
    maxBuffer:256*1024*1024,
    env:Object.assign({},process.env,{
      R1_OUT:OUT,
      R1_LIST:'v1',
      R1_RESPOND:'1',
      R1_DECKS:''
    })
  });
  const line=out.split(/\r?\n/).find(l=>l.startsWith('R1RESULT '));
  result=line?JSON.parse(line.slice('R1RESULT '.length)):null;
}catch(e){
  error=String(e&&e.stack||e).slice(0,1200);
}

ok('R1 driver reports a result for the Future Fusion representative seed',!!result&&!error,error||'');
if(result){
  const ff=result.futureFusion||{};
  ok('fixed Dragunity/rabbit lists are valid and load without misses',
    Array.isArray(result.deckErrors)&&result.deckErrors.length===0&&
    result.v1load&&result.v1load.dragunity.main===40&&result.v1load.dragunity.ex===15&&
    result.v1load.rabbit.main===40&&result.v1load.rabbit.ex===15&&
    !result.v1load.dragunity.miss.length&&!result.v1load.rabbit.miss.length&&
    !result.v1load.dragunity.violations.length&&!result.v1load.rabbit.violations.length,
    JSON.stringify(result.v1load));
  ok('未来融合 is actually drawn and activated on the DUEL path',
    ff.activated===true&&Array.isArray(result.opening&&result.opening.p0)&&result.opening.p0.includes('未来融合－フューチャー・フュージョン'),
    JSON.stringify({opening:result.opening,ff}));
  ok('F・G・D material choice sends exactly five Dragon materials by effect',
    ff.materialChoice===true&&Array.isArray(ff.materialPicks)&&ff.materialPicks.length===5&&ff.mills===5,
    JSON.stringify(ff));
  ok('the delayed Special Summon reaches the 2nd own Standby Phase and is recorded as a Fusion Summon',
    ff.fusionSummons===1&&Array.isArray(ff.fusionSummonKinds)&&ff.fusionSummonKinds.includes('fusion'),
    JSON.stringify(ff));
  ok('the duel continues to a normal win/loss after Future Fusion resolves',
    result.completed===true&&(result.loser===0||result.loser===1)&&['lp0','deckout'].includes(result.reason),
    JSON.stringify({turn:result.turn,loser:result.loser,reason:result.reason,lp:result.lp}));
  ok('real-duel slice has unsupported 0, no blocker, and Replay parity',
    !result.blocker&&Array.isArray(result.unsupported)&&result.unsupported.length===0&&
    result.truncated===false&&result.replay&&result.replay.ok===true&&result.replay.count===result.journal&&!result.digestDiff,
    JSON.stringify({unsupported:result.unsupported,blocker:result.blocker,replay:result.replay,digestDiff:result.digestDiff}));
}

if(fails) process.exit(2);
