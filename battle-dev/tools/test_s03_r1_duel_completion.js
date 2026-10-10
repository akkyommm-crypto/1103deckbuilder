/* S03-U38 R1 real-duel completion regression.
   Runs tools/r1_duel_driver.js (a provisional Dragunity / レダメ list, strict1103-validated and NOT a user deck, vs 1103兎ラギア; DUEL mode,
   normal game path, pinned seed, UI-offered actions only) for fixed cases and requires, for each case:
   - the duel ends normally (gameState.loser set by play: LP 0 or deck-out), with no blocker (exception / stuck choice / loop / phase or turn
     not advancing / Replay divergence) and no manual-only action taken;
   - the Replay audit reproduces every Action digest AND the final digest (S03-U38: start and end are journaled).
   Limits of the evidence (recorded): choices take the first candidate (opponent field cards preferred); responses take the first offer;
   one provisional list; four seeds (two passive, two responder), both first players. This is a regression for the path, not proof that every card is correct.
   Card names appear only in the driver (all TESTED / GENERIC_OK at the time of writing). */
const {execFileSync}=require('child_process'),path=require('path'),fs=require('fs');
const DRIVER=process.env.R1_DRIVER||path.join(__dirname,'r1_duel_driver.js');
const CASES=[
  {seed:'0x52310002',first:0,label:'seed 0x52310002, Dragunity first'},
  {seed:'0x52310001',first:1,label:'seed 0x52310001, 兎ラギア first'},
  /* S03-U39: responder mode — traps and quick effects are used in response (attack-declaration traps included) */
  {seed:'0x52310007',first:0,respond:true,label:'seed 0x52310007, Dragunity first, responder'},
  {seed:'0x5231000a',first:1,respond:true,label:'seed 0x5231000a, 兎ラギア first, responder'},
  /* S03-U41: found by the 48-duel sweep — an effect Special Summon chosen during resolution left the summon window open and the
     summoned monster's ignition effect was refused for the rest of Main Phase 1 */
  {seed:'0x52310024',first:1,respond:true,label:'seed 0x52310024, 兎ラギア first, responder'},
  /* S03-U42: Astra's fixed major-deck lists (data/r1_lists, R1_LIST=v1). Found the stale flip timing window. Unsupported actions are tolerated only
     when listed in data/r1_lists/known_gaps_v1.json (documented gaps, removed when implemented). */
  {seed:'0x52310101',first:0,respond:true,list:'v1',label:'seed 0x52310101, fixed lists v1, Dragunity first, responder'},
  /* S03-U45: a second fixed-list pairing (R1_DECKS). 六武衆 vs 兎ラギア stopped on turn 1 with the legacy choice db crash before U45. */
  {seed:'0x52310303',first:0,respond:true,list:'v1',decks:'six,rabbit',label:'seed 0x52310303, fixed lists v1 six-rabbit, 六武衆 first, responder'},
];
const KNOWN_GAPS_V1=JSON.parse(fs.readFileSync(path.join(__dirname,'..','data','r1_lists','known_gaps_v1.json'),'utf8')).knownUnsupported||[];
let fails=0;
const ok=(name,v,d)=>{console.log((v?'PASS ':'FAIL ')+name+(d?' :: '+d:''));if(!v)fails++;};
for(const c of CASES){
  let r=null,err=null;
  try{
    const out=execFileSync(process.execPath,[DRIVER,c.seed,String(c.first),'80'],{encoding:'utf8',maxBuffer:256*1024*1024,env:Object.assign({},process.env,{R1_OUT:process.env.R1_OUT||require('os').tmpdir(),R1_RESPOND:c.respond?'1':'0',R1_LIST:c.decks?'':(c.list||''),R1_DECKS:c.decks||''})});
    const line=out.split(/\r?\n/).find(l=>l.startsWith('R1RESULT '));
    r=line?JSON.parse(line.slice('R1RESULT '.length)):null;
  }catch(e){err=String(e&&e.message||e).slice(0,400);}
  ok(c.label+': the driver ran and reported a result',!!r&&!err,err||'');
  if(!r)continue;
  const brief=JSON.stringify({loser:r.loser,reason:r.reason,turn:r.turn,lp:r.lp,blocker:r.blocker&&r.blocker.kind,unsupported:r.unsupported,replay:r.replay,diff:r.digestDiff});
  ok(c.label+': the deck definition is valid for 2011-03 (strict1103)',Array.isArray(r.deckErrors)&&r.deckErrors.length===0,JSON.stringify(r.deckErrors));
  ok(c.label+': the duel ends normally with a loser decided by play',r.completed===true&&(r.loser===0||r.loser===1)&&['lp0','deckout'].includes(r.reason),brief);
  const unknownUnsupported=(r.unsupported||[]).filter(u=>!(c.list==='v1'&&KNOWN_GAPS_V1.some(g=>g.name===u.name&&(g.ids||[]).includes(u.id))));
  ok(c.label+': no blocker and no manual-only action on the way'+(c.list==='v1'?' (except documented known gaps)':''),!r.blocker&&Array.isArray(r.unsupported)&&unknownUnsupported.length===0,JSON.stringify({brief:JSON.parse(brief),unknownUnsupported}));
  if(c.list==='v1') ok(c.label+': the fixed lists load through the normal text import with no missing card and no limit violation',!!r.v1load&&r.v1load.dragunity.main>=40&&r.v1load.dragunity.ex===15&&r.v1load.rabbit.main===40&&r.v1load.rabbit.ex===15&&!r.v1load.dragunity.miss.length&&!r.v1load.rabbit.miss.length&&!r.v1load.dragunity.violations.length&&!r.v1load.rabbit.violations.length,JSON.stringify(r.v1load));
  ok(c.label+': Replay reproduces every Action digest and the final digest',r.truncated===false&&r.replay&&r.replay.ok===true&&r.replay.count===r.journal,brief);
  /* S03-U41 (C-S03-33): no ignition effect is refused as 「召喚成功直後」 once the game is back in the open state */
  let ops=null;
  try{ ops=JSON.parse(fs.readFileSync(path.join(process.env.R1_OUT||require('os').tmpdir(),'r1_ops_'+((Number(c.seed)>>>0).toString(16))+'_'+c.first+'.json'),'utf8')).ops; }catch(e){ ops=null; }
  const refused=(ops||[]).filter(o=>o.op==='noop'&&/召喚成功直後にモンスターの起動効果は発動できません/.test(String(o.d&&o.d.toast||'')));
  ok(c.label+': no ignition effect is refused after the summon timing has passed',Array.isArray(ops)&&refused.length===0,JSON.stringify(refused.slice(0,3)));
}
if(fails)process.exitCode=2;
