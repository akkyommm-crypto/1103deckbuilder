/* S03-U305 (redo of the unpublished U304): HARNESS_UI=1 runs the real UI code (render, showToast, closeSheet, openChainPriorityV2, openPick)
   against the stub DOM during the R1 driver's duels. Checks:
   - a duel with the UI running completes with no blocker, the Replay audit matches, the real render ran, and no UI function threw;
   - the UI changes nothing in the game: the same seed without the UI ends with the same turn / LP / loser / journal length / Replay count;
   - the default (no HARNESS_UI) harness is unchanged: no `ui` block, render stays a no-op;
   - an exception inside a UI function is recorded in HARNESS_UI_ERRORS (and does not stop the duel), so a UI crash cannot go unseen.
   Limit of the evidence: the DOM is a stub (Proxy), so this finds exceptions and unusable data in the UI code, not layout or visual defects. */
const {execFileSync}=require('child_process'),path=require('path'),os=require('os');
const DRIVER=path.join(__dirname,'r1_duel_driver.js'), HARNESS=path.join(__dirname,'astra_harness.js');
let fails=0;
const ok=(name,v,d)=>{console.log((v?'PASS ':'FAIL ')+name+(d?' :: '+d:''));if(!v)fails++;};
function duel(seed,first,env){
  const out=execFileSync(process.execPath,[DRIVER,seed,String(first),'80'],{encoding:'utf8',maxBuffer:256*1024*1024,
    env:Object.assign({},process.env,{R1_OUT:process.env.R1_OUT||os.tmpdir()},env)});
  const line=out.split(/\r?\n/).find(l=>l.startsWith('R1RESULT '));
  return line?JSON.parse(line.slice('R1RESULT '.length)):null;
}
const brief=r=>JSON.stringify({loser:r.loser,turn:r.turn,lp:r.lp,journal:r.journal,replay:r.replay});
for(const c of [{seed:'0x52310002',first:0,env:{},label:'seed 0x52310002, first-candidate policy'},
                {seed:'0x52310007',first:0,env:{R1_RESPOND:'1',R1_SAVELOAD:'1'},label:'seed 0x52310007, responder, save / resume at every stop'}]){
  let on=null,off=null,err=null;
  try{on=duel(c.seed,c.first,Object.assign({HARNESS_UI:'1'},c.env));off=duel(c.seed,c.first,c.env);}catch(e){err=String(e&&e.message||e).slice(0,400);}
  ok(c.label+': both runs reported a result',!!on&&!!off&&!err,err||'');
  if(!on||!off)continue;
  ok(c.label+': UI run completed with no blocker',on.completed===true&&!on.blocker&&(on.errors||[]).length===0,JSON.stringify(on.blocker||on.errors));
  ok(c.label+': Replay audit matches with the UI running',on.replay&&on.replay.ok===true,JSON.stringify(on.replay));
  ok(c.label+': the real UI code ran (render / closeSheet called many times)',!!on.ui&&on.ui.calls.render>50&&on.ui.calls.closeSheet>0,JSON.stringify(on.ui&&on.ui.calls));
  ok(c.label+': no UI function threw',!!on.ui&&on.ui.errorCount===0,JSON.stringify(on.ui&&on.ui.errors));
  ok(c.label+': the UI does not change the duel (same end state as the no-UI run)',brief(on)===brief(off),brief(on)+' vs '+brief(off));
  ok(c.label+': the default harness has no ui block',off.ui===undefined);
}
/* control on the harness itself: a UI exception is recorded, not lost and not fatal; with the UI off render is a no-op */
function probe(ui){
  const env=Object.assign({},process.env,ui?{HARNESS_UI:'1'}:{});delete env.R1_HARNESS;if(!ui)delete env.HARNESS_UI;
  const code="const h=require("+JSON.stringify(HARNESS)+");const c=h('gameState=null;let threw=false;try{render();}catch(e){threw=true;}globalThis.__P={threw,ui:typeof HARNESS_UI===\"undefined\"?null:HARNESS_UI,errs:typeof HARNESS_UI_ERRORS===\"undefined\"?null:HARNESS_UI_ERRORS.length,calls:typeof HARNESS_UI_CALLS===\"undefined\"?null:HARNESS_UI_CALLS.render};ok(\"probe ran\",true);');console.log('PROBE '+JSON.stringify(c.__P));";
  const out=execFileSync(process.execPath,['-e',code],{encoding:'utf8',env});
  return JSON.parse(out.split(/\r?\n/).find(l=>l.startsWith('PROBE ')).slice(6));
}
{const on=probe(true),off=probe(false);
 ok('control: with HARNESS_UI=1 a render exception is recorded and not thrown',on.threw===false&&on.errs===1&&on.calls===1&&on.ui===true,JSON.stringify(on));
 ok('control: without HARNESS_UI render stays a no-op and nothing is recorded',off.threw===false&&off.ui===null&&off.errs===null,JSON.stringify(off));}
console.log(fails?'S03-U305 FAILED':'S03-U305 ok');
process.exitCode=fails?1:0;
