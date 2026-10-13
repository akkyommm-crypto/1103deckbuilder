/* R1 real-duel driver (measurement tool, not a gate test).
   Provisional Dragunity / レダメ list (strict1103-validated, NOT a user deck) vs 1103兎ラギア, DUEL mode, normal game path.
   Operation policy (deterministic, recorded): only the actions the UI offers (getLegalHandActions / getLegalZoneActions /
   pileDuelActionsV370 run strings, EX combos via doExSummon, the attack picker battlePickAttackerV29 / battlePickTargetV29 /
   battleDirectV29). Choices: first candidate. Optional triggers: taken. Chain responses: pass by default; with R1_RESPOND=1 the
   player with priority activates the first offered response at chain windows, POINT windows (pointActivateV27) and summon-negation
   windows, once per window. The battle replay step continues directly, else re-targets, else cancels.
   Stops at a normal win/loss or at the first blocker. usage: node r1_duel_driver.js [seed] [firstPlayer] [maxTurns]
   Output: one line "R1RESULT {json}" and the operation list in R1_OUT (default: OS temp). */
const path=require('path'),os=require('os'),fs=require('fs');
const harness=require(process.env.R1_HARNESS||path.join(__dirname,'astra_harness'));
const SEED=(Number(process.argv[2])||0x52310001)>>>0, FIRST=Number(process.argv[3]||0)===1?1:0, MAXT=Number(process.argv[4]||80);
const RESPOND=process.env.R1_RESPOND==='1';
/* S03-U296: R1_SAVELOAD=1 round-trips the duel through the production save / resume path (saveDuel, a fresh game, offerResumeDuel)
   at the driver's stop points (pending choice, chain window, POINT window, summon window, trigger selection, phase change, open Main Phase).
   R1_SAVELOAD_EVERY=N does it at every Nth stop point (default 1). The default behaviour is unchanged. */
const SAVELOAD=process.env.R1_SAVELOAD==='1', SLEVERY=Math.max(1,Number(process.env.R1_SAVELOAD_EVERY)||1);
/* S03-U297: R1_POLICY=random replaces the first-candidate policy by a seeded random one: random legal picks for choices (optional ones sometimes pick 0),
   random trigger order / optional triggers skipped, chain / POINT / summon-negation responses with probability R1_RESPOND_P (default 0.5; needs R1_RESPOND=1),
   a random legal Main Phase action (R1_PASS_Q = probability of ending the phase instead, default 0.15) and a random attacker / target / direct attack.
   The driver's own PRNG (mulberry32, seed R1_POLICY_SEED, default: the duel seed) is separate from the game's replay RNG. The default policy is unchanged. */
/* S03-U297: R1_NODIGEST=1 does not add the driver's per-action digestText to the journal entries (a real save does not have it);
   R1_SAVESIZE=1 reports the size of the real saveDuel() output at the end of the duel (state vs replay journal). */
const NODIGEST=process.env.R1_NODIGEST==='1', SAVESIZE=process.env.R1_SAVESIZE==='1';
const POLICY=process.env.R1_POLICY==='random'?'random':null, PSEED=(Number(process.env.R1_POLICY_SEED)||SEED)>>>0;
const RESP_P=process.env.R1_RESPOND_P!=null&&process.env.R1_RESPOND_P!==''?Number(process.env.R1_RESPOND_P):0.5, PASS_Q=process.env.R1_PASS_Q!=null&&process.env.R1_PASS_Q!==''?Number(process.env.R1_PASS_Q):0.15;
/* S03-U42: R1_LIST=v1 uses Astra's fixed major-deck lists (1103_MAJOR_DECKS_v1, copied to data/r1_lists) through the normal text import.
   The default (provisional list) is unchanged, so earlier reproduction conditions stay valid. */
const LIST=process.env.R1_LIST==='v1'?'v1':'provisional';
/* S03-U45: R1_DECKS=<p0>,<p1> pairs any two of Astra's fixed lists (data/r1_lists/major_decks_v1_<id>.txt). */
const DECKS=(process.env.R1_DECKS||'').split(',').map(x=>x.trim()).filter(Boolean);
const V1=(DECKS.length===2)?{version:'1103_MAJOR_DECKS_v1',ids:DECKS,
  dragunity:fs.readFileSync(path.join(__dirname,'..','data','r1_lists','major_decks_v1_'+DECKS[0]+'.txt'),'utf8'),
  rabbit:fs.readFileSync(path.join(__dirname,'..','data','r1_lists','major_decks_v1_'+DECKS[1]+'.txt'),'utf8')}
 :LIST==='v1'?{version:'1103_MAJOR_DECKS_v1',ids:['dragunity','rabbit'],
  dragunity:fs.readFileSync(path.join(__dirname,'..','data','r1_lists','major_decks_v1_dragunity.txt'),'utf8'),
  rabbit:fs.readFileSync(path.join(__dirname,'..','data','r1_lists','major_decks_v1_rabbit.txt'),'utf8')}:null;
const DRAG={name:'Dragunity/レダメ provisional (R1)',strict1103:true,sourceCutoff:'2011-08-31',
 cards:[['ドラグニティ－ドゥクス',3],['ドラグニティ－ファランクス',2],['ドラグニティ－レギオン',2],['ドラグニティ－ミリトゥム',3],['ドラグニティ－ブラックスピア',2],
  ['ドラグニティ－アングス',1],['ドラグニティ－コルセスカ',1],['ドラグニティ－ブランディストック',1],['レッドアイズ・ダークネスメタルドラゴン',3],['ダーク・グレファー',1],
  ['ボマー・ドラゴン',1],['エフェクト・ヴェーラー',2],['ゴブリンドバーグ',1],['サイバー・ドラゴン',1],
  ['竜の渓谷',3],['調和の宝札',2],['トレード・イン',1],['サイクロン',2],['死者蘇生',1],['強欲で謙虚な壺',2],['ハリケーン',1],
  ['奈落の落とし穴',2],['強制脱出装置',2]].map(([n,q])=>({n,q})),
 ex:[['ドラグニティナイト－ヴァジュランダ',2],['ドラグニティナイト－ガジャルグ',2],['ドラグニティナイト－バルーチャ',1],['ブラック・ローズ・ドラゴン',1],['スターダスト・ドラゴン',1],
  ['レッド・デーモンズ・ドラゴン',1],['ギガンテック・ファイター',1],['スクラップ・ドラゴン',1],['アームズ・エイド',1],['エヴォルカイザー・ラギア',1],['ヴァイロン・ディシグマ',1],
  ['E・HERO The シャイニング',1],['ジェムナイト・パール',1]].map(([n,q])=>({n,q}))};
const c=harness('const SEED='+SEED+',FIRST='+FIRST+',MAXT='+MAXT+',RESPOND='+RESPOND+',NODIGEST='+NODIGEST+',SAVESIZE='+SAVESIZE+',POLICY='+JSON.stringify(POLICY)+',PSEED='+PSEED+',RESP_P='+RESP_P+',PASS_Q='+PASS_Q+',SAVELOAD='+SAVELOAD+',SLEVERY='+SLEVERY+',DRAG='+JSON.stringify(DRAG)+',V1='+JSON.stringify(V1)+';'+String.raw`
const TOASTS=[];
/* S03-U305: under HARNESS_UI=1 (tools/astra_harness.js) the real showToast stays and is only wrapped to record the message */
if(typeof HARNESS_UI!=='undefined'&&HARNESS_UI){const __realToast=showToast;showToast=m=>{TOASTS.push(String(m));return __realToast(m);};}else showToast=m=>TOASTS.push(String(m));
const OPS=[], UNSUPPORTED=[], ERRORS=[], RESPONDED=new Set(), REPLAYED=new Set();
let BLOCKER=null;
/* S03-U297: the random policy's own PRNG (mulberry32); never the game's replay RNG */
let PS=PSEED>>>0, PDRAWS=0;
function prnd(){PDRAWS++;PS=(PS+0x6D2B79F5)>>>0;let t=PS;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;}
function rint(n){return n<=1?0:Math.floor(prnd()*n);}
function chance(p){return prnd()<p;}
function rsample(arr,k){const a=arr.slice(),out=[];for(let i=0;i<k&&a.length;i++){out.push(a.splice(rint(a.length),1)[0]);}return out;}
const nm=x=>x?cardName(x):null;
const __R1_RECORD=v41RecordCommittedAction;
v41RecordCommittedAction=function(a,rngBefore){
  const e=__R1_RECORD(a,rngBefore);
  if(e&&!NODIGEST) e.digestText=v41StateDigestText(gameState);
  return e;
};
function digestDiffAt(pkg,index){
  const entry=pkg&&pkg.actions&&pkg.actions[index]; if(!entry||!entry.digestText) return null;
  const live=gameState, oldMode=v44ReplaySetMode(pkg);
  try{
    gameState=v44ReplayStateFromPackage(pkg);
    for(let i=0;i<=index;i++) v44ApplyReplayEntry(pkg.actions[i]);
    const expected=String(entry.digestText).split('||'), actual=v41StateDigestText(gameState).split('||');
    const out=[], n=Math.max(expected.length,actual.length);
    for(let i=0;i<n&&out.length<16;i++) if(expected[i]!==actual[i]) out.push({part:i,expected:String(expected[i]).slice(0,1200),actual:String(actual[i]).slice(0,1200)});
    return out;
  }catch(e){return [{error:String(e&&e.message||e)}];}
  finally{gameState=live;if(oldMode!=null)PLAY_MODE=oldMode;}
}
function note(op,detail){OPS.push({t:gameState.turn,p:gameState.activePlayer,ph:gameState.phase,op,d:detail});}
function block(kind,detail){if(!BLOCKER)BLOCKER={kind,turn:gameState.turn,player:gameState.activePlayer,phase:gameState.phase,detail,toasts:TOASTS.slice(-5),lastOps:OPS.slice(-8),sl:SAVELOAD?{lastKind:SL.lastKind,lastSeq:SL.lastSeq,opsSince:OPS.length-SL.lastOps,stops:SL.stops}:undefined};}
/* ---- S03-U296: save / resume round trip ---- */
const SL={stops:0,done:0,undo:0,perKind:{},lastKind:null,lastSeq:null,lastOps:0,seen:new Set(),pointDropped:0,evtDropped:0,bytes:0};
function slReset(){
  /* a page reload clears every module-level variable outside gameState; reset the transient ones to their initial values */
  const R=(f)=>{try{f();}catch(e){}};
  R(()=>{CHAIN_AFTER_V2=null;});R(()=>{EVT_V2_STATE=null;});R(()=>{RESOLUTION_SUMMON_BATCH_V2=null;});R(()=>{BATTLE_COMMAND_V29={mode:'idle',attackerUid:null};});
  R(()=>{CHOICE_LEGACY_CB_V49=new Map();});R(()=>{ACTIVATION_PREP_S03=null;});R(()=>{PROMPT_OPEN_S03=null;});R(()=>{MANUAL_PROMPT_PREP_S03=null;});
  R(()=>{RESOLVING_LINK_S03=null;});R(()=>{DESTROY_SUB_BATCH_S03=null;});R(()=>{PENDING_SUMMON_COMMIT=null;PENDING_SUMMON_CANCEL=null;});
  R(()=>{FORCE_CB=null;});R(()=>{TG_RESOLVE=null;});R(()=>{EVT_CANDS=[];EVT_AFTER=null;});R(()=>{CHAIN_AFTER=null;});R(()=>{DS_AFTER=null;DS_CANDS=[];});
  R(()=>{LAST_DEPARTED_V9=[];});R(()=>{LAST_FACEDOWN_V26=[];});R(()=>{TOKEN_DESTROY_DAMAGE_S03=[];});R(()=>{P3_EFFECT_CONTEXT=null;});
  R(()=>{PICK_ITEMS=[];PICK_CANCEL=null;});R(()=>{GRAVE_REDIRECT_SNAPSHOT_S03=null;GRAVE_REDIRECT_KEY_S03=null;});R(()=>{RESOLVE_ANCHOR=null;RESOLVE_NAME='';});
  R(()=>{DS_SKIP_DEPTH=0;DS_PENDING_UI=false;});R(()=>{PROCESSOR_PUMPING_V27=false;});R(()=>{APPLY_ACTION_DEPTH_V31=0;});R(()=>{CHOICE_UI_SEL_V49=[];});
}
function slDigest(){
  const z=c=>c?(c.uid+(c.face==='up'?'u':'d')+(c.pos||'')):'-';
  return JSON.stringify(gameState.players.map(P=>({lp:P.lp,hand:P.hand.map(c=>c.uid).sort(),deck:P.deck.length,grave:P.grave.length,banish:(P.banish||[]).length,ex:(P.ex||[]).length,
    mz:(P.mz||[]).map(z).join(','),sz:(P.sz||[]).map(z).join(','),field:P.field?z(P.field):null})).concat([{turn:gameState.turn,phase:gameState.phase,ap:gameState.activePlayer,loser:gameState.loser}]));
}
/* after an interrupted activation is undone, only the card totals, the turn and the phase are compared (the cost was refunded) */
function slLite(){const n=P=>P.hand.length+P.deck.length+P.grave.length+(P.banish||[]).length+(P.ex||[]).length+(P.mz||[]).filter(Boolean).length+(P.sz||[]).filter(Boolean).length+(P.field?1:0);
  return JSON.stringify(gameState.players.map(P=>({cards:n(P)})).concat([{turn:gameState.turn,phase:gameState.phase,ap:gameState.activePlayer}]));}
function slPending(){
  const w=gameState.processorWaiting;
  const pcq=pendingChoiceV49(gameState);
  return {choice:!!pcq,ctitle:pcq?String(pcq.title||'').slice(0,60)+(pcq.legacy?' [legacy]':' ['+((pcq.resume&&pcq.resume.handler)||'?')+']')+(pcq.meta&&pcq.meta.resolutionWaitS03?' [resWait]':'')+(pcq.meta&&pcq.meta.activationPrepS03?' [prep]':''):null,chainWindow:!!gameState.chainWindow,chain:gameState.chain.length,evt:!!(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE),summon:!!gameState.pendingSummon,
    point:!!(w&&w.type==='POINT'),waiting:!!w,wtype:w?w.type+(w.payload&&w.payload.kind?':'+w.payload.kind:'')+(w.payload&&w.payload.eventName?':'+w.payload.eventName:''):null,queue:gameState.processorQueue.length,qtypes:gameState.processorQueue.map(u=>u.type+(u.payload&&u.payload.kind?':'+u.payload.kind:'')),deferred:(gameState.deferredEvents||[]).length,pa:!!gameState.pendingAttack,cav:!!(typeof CHAIN_AFTER_V2!=='undefined'&&CHAIN_AFTER_V2),btl:gameState.battle?gameState.battle.step:null,battle:!!gameState.battle,battleCmd:(typeof BATTLE_COMMAND_V29!=='undefined'&&BATTLE_COMMAND_V29)?BATTLE_COMMAND_V29.mode:null};
}
function slKind(){
  if(pendingChoiceV49(gameState))return 'choice';
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE)return 'trigger';
  if(gameState.chainWindow&&gameState.chain.length)return 'chain';
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused)return 'point';
  if(gameState.pendingSummon)return 'summon';
  return null;
}
function saveLoad(kind){
  if(!SAVELOAD||BLOCKER||gameState.loser!=null||gameState.__v44ReplayPreview)return false;
  if(/^(open|phase)/.test(kind))SL.cleanSeq=V41_ACTION_SEQ;
  if(kind!=='choice')SL.skipChoice=false;
  /* an undone activation would be undone again at every choice the same activation opens: save / resume the next choice stops only after the activation went through */
  if(kind==='choice'&&SL.skipChoice){SL.skipped=(SL.skipped||0)+1;return false;}
  const sig=kind+'|'+V41_ACTION_SEQ+'|'+gameState.chain.length+'|'+gameState.turn+'|'+gameState.phase+'|'+(pendingChoiceV49(gameState)||{}).cid+'|'+((typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE)?EVT_V2_STATE.rank+'/'+EVT_V2_STATE.eventName:'')+'|'+gameState.processorQueue.length;
  if(SL.seen.has(sig))return false;   /* a stop that was already round-tripped (the same state again after an undone activation) */
  SL.seen.add(sig);
  SL.stops++;
  if(SL.stops%SLEVERY!==0)return false;
  const seqPre=V41_ACTION_SEQ, onlyChoiceActs=V41_ACTION_JOURNAL.filter(e=>Number(e.seq)>(SL.cleanSeq||0)).every(e=>/^CHOICE_(OPEN|ANSWER)_V49$/.test((e.action||{}).type)), pre=slPending(), dg=slDigest(), lite=slLite(), tmark=TOASTS.length, k0=kind.split(':')[0];
  SL.perKind[k0]=(SL.perKind[k0]||0)+1; SL.lastKind=kind; SL.lastSeq=V41_ACTION_SEQ; SL.lastOps=OPS.length;
  let raw=null;
  try{localStorage.removeItem(DUEL_SAVE_KEY);saveDuel();raw=localStorage.getItem(DUEL_SAVE_KEY);}
  catch(e){block('SAVELOAD_EXCEPTION',{stage:'save',kind,err:String(e&&e.stack||e).slice(0,400)});return true;}
  if(!raw){block('SAVELOAD_EXCEPTION',{stage:'save',kind,err:'saveDuel wrote nothing'});return true;}
  SL.bytes=Math.max(SL.bytes,raw.length);
  let r;
  try{
    resetA(); slReset();
    localStorage.setItem(DUEL_SAVE_KEY,raw);
    r=offerResumeDuel();
  }catch(e){block('SAVELOAD_EXCEPTION',{stage:'resume',kind,pre,err:String(e&&e.stack||e).slice(0,600)});return true;}
  if(!r){block('SAVELOAD_RESUME_FALSE',{kind,pre});return true;}
  SL.done++;
  const undo=TOASTS.slice(tmark).some(t=>/取り消/.test(t)), post=slPending();
  if(undo){SL.undo++;SL.skipChoice=true;note('saveloadUndo',{kind,pre,post,toasts:TOASTS.slice(tmark)});}
  const after=undo?slLite():slDigest();
  if(after!==(undo?lite:dg)){block('SAVELOAD_STATE_DIFF',{kind,undo,pre,post,before:undo?lite:dg,after});return true;}
  const lost=[];
  if(pre.chain>0&&post.chain===0&&!undo)lost.push('chain links vanished');
  if(post.chain>0&&!post.chainWindow&&!post.choice&&!post.waiting)lost.push('chain links without a window or choice');
  if(pre.chainWindow&&pre.chain>0&&!post.chainWindow&&!undo)lost.push('chain window vanished');
  if(pre.choice&&!post.choice&&post.chain===0&&!undo){
    /* a choice of a procedure that has not committed anything (only choice Actions since the last clean stop) is cancelled safely: the open phase remains */
    if(pre.chain===0&&!/resWait/.test(pre.ctitle||'')&&onlyChoiceActs){SL.cancel=(SL.cancel||0)+1;note('saveloadCancel',{kind,ctitle:pre.ctitle});}
    else lost.push('choice vanished');
  }
  if(pre.evt&&!post.evt&&!post.choice&&post.deferred===0&&post.chain===0&&!undo)lost.push('trigger selection vanished');
  if(pre.summon&&!post.summon&&!undo)lost.push('summon window vanished');
  if(pre.point&&!post.waiting){SL.pointDropped++;}
  if(pre.evt&&!post.evt){SL.evtDropped++;}
  if(lost.length){block('SAVELOAD_LOST_PENDING',{kind,lost,pre,post,seq:V41_ACTION_SEQ,cleanSeq:SL.cleanSeq,jtail:(v41ReplayPackage(gameState).actions||[]).slice(-4).map(e=>e.seq+' '+e.action.type)});return true;}
  note('saveload',{kind,undo,pw:pre.wtype,pq:pre.qtypes,pa:pre.pa+'>'+post.pa,cav:pre.cav,btl:pre.btl+'>'+post.btl,pre:pre.chain+'/'+(pre.choice?'c':'')+(pre.evt?'e':'')+(pre.point?'p':'')+(pre.summon?'s':''),post:post.chain+'/'+(post.choice?'c':'')+(post.evt?'e':'')+(post.point?'p':'')+(post.summon?'s':'')});
  return true;
}
function safe(label,fn){try{return fn();}catch(e){ERRORS.push({label,err:String(e&&e.stack||e).slice(0,400)});block('EXCEPTION',{label,err:String(e&&e.message||e)});return undefined;}}
function respond(){
  for(let i=0;i<3000;i++){
    if(BLOCKER||gameState.loser!=null)return 'end';
    if(SAVELOAD){const sk=slKind();if(sk&&saveLoad(sk))continue;}
    const q=pendingChoiceV49(gameState);
    if(q){
      if(!q.candidates||!q.candidates.length){block('CHOICE_WITHOUT_CANDIDATES',{title:q.title});return 'stuck';}
      /* policy: when a choice offers field cards of both players, prefer the chooser's opponent's cards (removal), else first */
      if(POLICY){
        /* random: min..max candidates; an optional choice (min 0) sometimes picks nothing */
        const mn=q.min||0, mx=Math.max(mn,Math.min(q.max||1,q.candidates.length));
        const k=(mn===0&&chance(0.3))?0:(()=>{const lo=Math.max(1,mn);return mx<lo?mn:lo+rint(mx-lo+1);})();
        const picks=rsample(q.candidates,k), keys=picks.map(x=>x.key);
        note('choice',{title:q.title,picked:picks.map(x=>x.label),min:mn,max:mx,of:q.candidates.length});
        const before=q.cid;
        safe('answerChoice',()=>answerChoiceV49(keys));
        const after=pendingChoiceV49(gameState);
        if(after&&after.cid===before){block('CHOICE_NOT_ACCEPTED',{title:q.title,keys,min:mn,max:mx,toasts:TOASTS.slice(-3)});return 'stuck';}
        continue;
      }
      const need=Math.max(1,q.min||1), chooser=q.player!=null?q.player:gameState.activePlayer;
      const ownerOf=x=>{const h=x.uid!=null&&findCardByUid(x.uid);return h?{p:h.p,zone:h.zone}:null;};
      const onField=q.candidates.filter(x=>{const o=ownerOf(x);return o&&['mz','sz','field'].includes(o.zone);});
      const foe=onField.filter(x=>ownerOf(x).p!==chooser);
      const ordered=(foe.length&&onField.length===q.candidates.length)?foe.concat(q.candidates.filter(x=>!foe.includes(x))):q.candidates;
      const keys=ordered.slice(0,need).map(x=>x.key);
      note('choice',{title:q.title,picked:ordered.slice(0,need).map(x=>x.label)});
      const before=pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).cid;
      safe('answerChoice',()=>answerChoiceV49(keys));
      const after=pendingChoiceV49(gameState);
      if(after&&after.cid===before){block('CHOICE_NOT_ACCEPTED',{title:q.title,keys,toasts:TOASTS.slice(-3)});return 'stuck';}
      continue;
    }
    if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){
      const st=EVT_V2_STATE,g=st.groups[st.rank]||[];
      if(POLICY){
        /* random: forced groups (rank < 2) must be stacked, optional groups are skipped sometimes; the stacking order is random */
        const forcedGroup=st.rank<2||g.every(c=>c.forcedSTS03);
        if(g.length&&(forcedGroup||!chance(0.3))){const i=rint(g.length);note('trigger',{rank:st.rank,name:g[i].name,i,of:g.length});safe('eventPick',()=>eventPickV2(i));}
        else{note('triggerSkip',{rank:st.rank,n:g.length});safe('eventSkip',()=>eventSkipGroupV2());}
      }
      else if(g.length){note('trigger',{rank:st.rank,name:g[0].name});safe('eventPick',()=>eventPickV2(0));}
      else safe('eventSkip',()=>eventSkipGroupV2());
      continue;
    }
    if(gameState.chainWindow&&gameState.chain.length){
      if(RESPOND){
        const pr=gameState.chainWindow.priority, top=gameState.chain[gameState.chain.length-1], key=top.chainId+'|'+pr;
        if(!RESPONDED.has(key)){
          RESPONDED.add(key);
          const resp=(typeof getChainResponsesV2==='function'?getChainResponsesV2(pr):[])||[];
          note('chainWindow',{pr,top:top.name,topPlayer:top.player,offered:resp.map(r=>r.db.n+'@'+r.zone),sz:gameState.players[pr].sz.map(c=>nm(c)+'/'+c.face+'/set'+c.setTurn)});
          if(resp.length&&(!POLICY||chance(RESP_P))){const r0=POLICY?resp[rint(resp.length)]:resp[0];note('chainResponse',{p:pr,name:r0.db.n,zone:r0.zone,owner:r0.ownerS03,onTopOf:top.name});const before=V41_ACTION_SEQ;
            safe('response '+r0.db.n,()=>duelActivateResponseV2(pr,r0.zone,r0.index,r0.ownerS03));
            if(V41_ACTION_SEQ!==before||pendingChoiceV49(gameState))continue;}
        }
      }
      safe('chainPass',()=>chainPassV2());continue;}
    if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){
      if(RESPOND){const w=gameState.processorWaiting,pl=w.payload||{},pr=pl.priority!=null?pl.priority:gameState.activePlayer,k='pt|'+V41_ACTION_SEQ+'|'+pr+'|'+(pl.kind||'')+'|'+(pl.step||'');
        if(!RESPONDED.has(k)){RESPONDED.add(k);let offered=[];try{offered=(getChainResponsesV2(pr)||[]).map(r=>r.db.n+'@'+r.zone);}catch(e){offered=['ERR '+e.message];}
          note('pointWindow',{kind:pl.kind,step:pl.step,label:pl.label,pr,offered});
          let resp=[];try{resp=getChainResponsesV2(pr)||[];}catch(e){resp=[];}
          if(resp.length&&(!POLICY||chance(RESP_P))){const r0=POLICY?resp[rint(resp.length)]:resp[0];note('pointResponse',{p:pr,name:r0.db.n,zone:r0.zone,kind:pl.kind,step:pl.step});const before=V41_ACTION_SEQ;
            safe('pointResponse '+r0.db.n,()=>pointActivateV27(pr,r0.zone,r0.index,r0.ownerS03));   /* the UI path: reopens the POINT after the chain */
            if(V41_ACTION_SEQ!==before||pendingChoiceV49(gameState)||gameState.chain.length)continue;
            note('pointResponseNoop',{name:r0.db.n,toast:TOASTS[TOASTS.length-1]||null});}}}
      safe('pointPass',()=>pointPassV27());continue;}
    if(!gameState.processorPaused&&gameState.processorQueue.length){safe('pump',()=>pumpProcessorV27());continue;}
    /* summon-negation window: the UI button 「何も発動しない — 召喚成功」 is commitPendingSummonV2 (responses always pass) */
    if(gameState.pendingSummon&&RESPOND&&!RESPONDED.has('sw|'+(gameState.pendingSummon.uid))){
      RESPONDED.add('sw|'+(gameState.pendingSummon.uid));
      const neg=(typeof summonNegatorsV2==='function'?summonNegatorsV2(gameState.pendingSummon):[])||[];
      if(neg.length&&(!POLICY||chance(RESP_P))){const n0=POLICY?neg[rint(neg.length)]:neg[0];note('summonNegator',{p:n0.p,name:n0.db.n,owner:n0.ownerS03,against:gameState.pendingSummon.name});safe('summonNegator',()=>activateSummonNegatorV2(n0.p,n0.zone,n0.index,n0.ownerS03));continue;}
    }
    if(gameState.pendingSummon){const before=V41_ACTION_SEQ;note('summonWindowPass',{name:gameState.pendingSummon.name});safe('summonCommit',()=>commitPendingSummonV2());
      if(V41_ACTION_SEQ===before&&gameState.pendingSummon){block('SUMMON_WINDOW_STUCK',{pending:gameState.pendingSummon});return 'stuck';}continue;}
    /* battle replay (the defender side changed after the declaration): the UI asks to re-target or cancel.
       policy: direct attack if allowed, else the first legal target, else cancel the attack */
    if(typeof BATTLE_COMMAND_V29!=='undefined'&&BATTLE_COMMAND_V29&&BATTLE_COMMAND_V29.mode==='replayTarget'&&!REPLAYED.has(V41_ACTION_SEQ)){
      REPLAYED.add(V41_ACTION_SEQ);
      let pack=null;try{pack=battleTargetsV29(BATTLE_COMMAND_V29.attackerUid);}catch(e){pack=null;}
      const before=V41_ACTION_SEQ;
      if(POLICY){
        const opts=[];if(pack&&pack.direct)opts.push({k:'direct'});if(pack&&pack.targets)for(const t of pack.targets)opts.push({k:'target',card:t.card});opts.push({k:'cancel'});
        const o=opts[rint(opts.length)];
        if(o.k==='direct'){note('battleReplay',{choice:'direct'});safe('replayDirect',()=>battleDirectV29());}
        else if(o.k==='target'){note('battleReplay',{choice:'target',name:nm(o.card)});safe('replayTarget',()=>battlePickTargetV29(o.card.uid));}
        else{note('battleReplay',{choice:'cancel'});safe('replayCancel',()=>battleReplayCancelV28());}
      }
      else if(pack&&pack.direct){note('battleReplay',{choice:'direct'});safe('replayDirect',()=>battleDirectV29());}
      else if(pack&&pack.targets&&pack.targets.length){const t=pack.targets[0].card;note('battleReplay',{choice:'target',name:nm(t)});safe('replayTarget',()=>battlePickTargetV29(t.uid));}
      else{note('battleReplay',{choice:'cancel'});safe('replayCancel',()=>battleReplayCancelV28());}
      continue;
    }
    if(gameState.systemFault){block('SYSTEM_FAULT',gameState.systemFault);return 'stuck';}
    return 'idle';
  }
  block('RESPOND_LOOP',{chain:gameState.chain.map(l=>cardName({id:l.cardId})+'/p'+l.player+'/ss'+l.ss+'/'+(l.eventName||'')),evt:(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE)?{rank:EVT_V2_STATE.rank,eventName:EVT_V2_STATE.eventName,groups:EVT_V2_STATE.groups.map(g=>g.map(c=>c.name))}:null,window:gameState.chainWindow});return 'stuck';
}
function phase(to){const before=gameState.phase;safe('phase '+to,()=>requestProcessorV27(PROCESSOR_V27.PHASE,{to}));respond();
  if(SAVELOAD&&!BLOCKER&&gameState.loser==null){saveLoad('phase:'+to);respond();}
  if(!BLOCKER&&gameState.loser==null&&gameState.phase!==to&&!(to==='end'&&gameState.phase==='end'))block('PHASE_NOT_REACHED',{from:before,to,now:gameState.phase,busy:typeof duelFlowBusyReasonV30==='function'?duelFlowBusyReasonV30():null});}
function jlen(){return V41_ACTION_SEQ;}
function candidateActions(p){
  const P=gameState.players[p],out=[];
  P.hand.forEach((card,i)=>{for(const a of (getLegalHandActions(p,i)||[]))out.push({src:'hand',name:nm(card),a});});
  for(const zone of ['field','sz','mz']){
    const list=zone==='field'?(P.field?[P.field]:[]):(P[zone]||[]);
    list.forEach((card,i)=>{if(!card)return;for(const a of (getLegalZoneActions(p,zone,i)||[]))out.push({src:zone,name:nm(card),a});});
  }
  for(const zone of ['grave','banish']){(P[zone]||[]).forEach((card,i)=>{for(const a of (pileDuelActionsV370(p,zone,i)||[]))out.push({src:zone,name:nm(card),a});});}
  (P.ex||[]).forEach((card,i)=>{const db=dbOf(card),st=db.st||[];const kind=st.includes('シンクロ')?'synchro':st.includes('エクシーズ')?'xyz':null;if(!kind)return;
    let combos=null;try{combos=exCombos(p,db);}catch(e){combos=null;}
    if(combos&&combos.combos&&combos.combos.length)out.push({src:'ex',name:db.n,a:{id:'exSummon',run:null,kind,exIndex:i,materials:(POLICY?combos.combos[rint(combos.combos.length)]:combos.combos[0]).materials}});});
  return out;
}
const RANK={activate:1,effect:2,handEffect:3,specialSummonProcedure:4,exSummon:5,activateSet:6,normalSummon:7,extraNormalSummon:8,setMonster:9,setST:10};
function mainPhase(p,second){
  const tried=new Set();
  for(let n=0;n<(POLICY?60:40)&&!BLOCKER&&gameState.loser==null;n++){
    if(SAVELOAD&&saveLoad('open:main'+(second?'2':'1'))){respond();if(BLOCKER||gameState.loser!=null)return;}
    if(POLICY&&chance(PASS_Q)){note('endMainPhase',{second:!!second});return;}
    const cands=candidateActions(p).filter(x=>x.a&&x.a.id!=='attack');
    for(const x of cands){if(['activateManual','activateSetManual','legacyEffect','legacyHandEffect'].includes(x.a.id)&&!UNSUPPORTED.some(u=>u.name===x.name&&u.id===x.a.id))UNSUPPORTED.push({turn:gameState.turn,p,name:x.name,id:x.a.id});}
    let pool=cands.filter(x=>RANK[x.a.id]);
    if(second&&!POLICY)pool=pool.filter(x=>['setST','activateSet','effect'].includes(x.a.id)||x.a.id==='activate');
    pool.sort((a,b)=>RANK[a.a.id]-RANK[b.a.id]);
    /* random policy: an action that did nothing is not offered again in this phase; the others (a repeatable effect, another summon) stay available */
    const x=POLICY?(()=>{const f=pool.filter(x=>!tried.has(x.a.id+'|'+x.src+'|'+x.name));return f.length?f[rint(f.length)]:undefined;})():pool.find(x=>!tried.has(x.a.id+'|'+x.src+'|'+x.name));
    if(!x)return;
    if(!POLICY)tried.add(x.a.id+'|'+x.src+'|'+x.name);
    if(!POLICY&&x.a.id==='normalSummon'&&pool.some(y=>y.a.id==='normalSummon')){
      const best=pool.filter(y=>y.a.id==='normalSummon').sort((a,b)=>(dbOf(gameState.players[p].hand.find(c=>nm(c)===b.name)||{}).atk||0)-(dbOf(gameState.players[p].hand.find(c=>nm(c)===a.name)||{}).atk||0))[0];
      if(best&&best!==x){tried.add(best.a.id+'|'+best.src+'|'+best.name);}
    }
    const before=jlen();
    note(x.a.id,{src:x.src,name:x.name,run:x.a.run||('doExSummon '+x.a.kind)});
    if(x.a.id==='exSummon')safe('exSummon',()=>doExSummon(p,x.a.exIndex,x.a.materials,x.a.kind,'atk'));
    else safe(x.a.id+' '+x.name,()=>(0,eval)(x.a.run));
    /* a summon procedure with two positions shows a position sheet; its UI button is finishSummonProcedure(...,'atk') */
    if(x.a.id==='specialSummonProcedure'&&jlen()===before&&!BLOCKER){
      const m=/runSummonProcedure\((.+),(\d),'(\w+)',(\d+)\)/.exec(x.a.run||'');
      if(m){note('positionSheet',{name:x.name,pos:'atk'});safe('finishSummonProcedure',()=>finishSummonProcedure((0,eval)(m[1]),Number(m[2]),m[3],Number(m[4]),'atk'));}
    }
    respond();
    if(jlen()===before&&!pendingChoiceV49(gameState)){note('noop',{id:x.a.id,name:x.name,toast:TOASTS[TOASTS.length-1]||null});if(POLICY)tried.add(x.a.id+'|'+x.src+'|'+x.name);}
  }
}
function battle(p){
  if(gameState.turn===1)return;
  phase('battle'); if(BLOCKER||gameState.loser!=null)return;
  const done=new Set();
  for(let n=0;n<10&&!BLOCKER&&gameState.loser==null;n++){
    const atks=(battleAttackersV29(p)||[]).map(x=>x.card).filter(c=>c&&!done.has(c.uid)&&canDeclareAttackV48(c)).sort((a,b)=>curATK(b)-curATK(a));
    if(POLICY&&atks.length&&chance(PASS_Q)){note('endBattlePhase',{});return;}
    const atk=POLICY?atks[rint(atks.length)]:atks[0];
    if(!atk)return;
    done.add(atk.uid);
    const pack=battleTargetsV29(atk.uid);
    const A=curATK(atk);
    if(POLICY){
      /* random: a random attacker, then a random legal target or the direct attack */
      const opts=[];if(pack.direct)opts.push(null);for(const x of (pack.targets||[]))if(x&&x.card)opts.push(x.card);
      if(!opts.length)continue;
      const t=opts[rint(opts.length)];
      if(t===null){note('attackDirect',{name:nm(atk),atk:A});safe('pickAttacker',()=>battlePickAttackerV29(atk.uid));safe('direct',()=>battleDirectV29());respond();continue;}
      note('attack',{name:nm(atk),atk:A,target:t.face==='up'?nm(t):'(face-down)'});
      safe('pickAttacker',()=>battlePickAttackerV29(atk.uid));safe('pickTarget',()=>battlePickTargetV29(t.uid));respond();continue;
    }
    if(pack.direct){note('attackDirect',{name:nm(atk),atk:A});safe('pickAttacker',()=>battlePickAttackerV29(atk.uid));safe('direct',()=>battleDirectV29());respond();continue;}
    const t=(pack.targets||[]).map(x=>x.card).filter(c=>c.face==='up'?(c.pos==='atk'?curATK(c)<A:curDEF(c)<A):true).sort((a,b)=>(a.face==='up'?curATK(a):0)-(b.face==='up'?curATK(b):0))[0];
    if(!t)continue;
    note('attack',{name:nm(atk),atk:A,target:t.face==='up'?nm(t):'(face-down)'});
    safe('pickAttacker',()=>battlePickAttackerV29(atk.uid));safe('pickTarget',()=>battlePickTargetV29(t.uid));respond();
  }
}
/* ---- setup (normal start path: LOAD_DECK, SHUFFLE, DRAW 5) ---- */
resetA();resetForTestDuel();
gameState.rngInitialSeed=SEED;gameState.rngState=SEED;gameState.__v41Seq=0;v41ResetActionJournal(gameState);
let V1LOAD=null;
const deckErrors=V1?[]:validateStrict1103TestDefinition(DRAG);
function expand(D){const main=[],ex=[];D.cards.forEach(e=>{const id=findCardIndex(e.n);if(id<0)throw Error('missing '+e.n);for(let i=0;i<e.q;i++)main.push({id,face:'down',pos:'atk'});});
  D.ex.forEach(e=>{const id=findCardIndex(e.n);if(id<0)throw Error('missing '+e.n);for(let i=0;i<e.q;i++)ex.push({id,face:'down',pos:'atk'});});return {main,ex};}
let dg, rab;
if(V1){
  const pd=parseDeckText(V1.dragunity,true), pr=parseDeckText(V1.rabbit,true);
  V1LOAD={version:V1.version,dragunity:{main:pd.main.length,ex:pd.ex.length,miss:pd.miss,violations:pd.violations},rabbit:{main:pr.main.length,ex:pr.ex.length,miss:pr.miss,violations:pr.violations}};
  if(pd.miss.length||pd.violations.length||pr.miss.length||pr.violations.length) deckErrors.push({importErrors:V1LOAD});
  dg={main:pd.main,ex:pd.ex}; rab={main:pr.main,ex:pr.ex};
}else{ dg=expand(DRAG); rab=buildTestDeck('rabbit'); }
act({type:'LOAD_DECK',player:0,deck:dg.main,ex:dg.ex,source:V1?'user':'test',name:V1?(V1.ids[0]+' '+V1.version):DRAG.name});act({type:'SHUFFLE',player:0});act({type:'DRAW',player:0,n:5,initial:true});
act({type:'LOAD_DECK',player:1,deck:rab.main.slice(),ex:rab.ex.slice(),source:V1?'user':'opponentSample',name:V1?(V1.ids[1]+' '+V1.version):RABBIT_LAGGIA_DECK.name});act({type:'SHUFFLE',player:1});act({type:'DRAW',player:1,n:5,initial:true});
act({type:'SET_FIRST_PLAYER',player:FIRST});   /* the same journaled start as the real start paths (S03-U38) */
const OPENING={p0:gameState.players[0].hand.map(nm),p1:gameState.players[1].hand.map(nm)};
if(deckErrors.length)block('DECK_INVALID',deckErrors);
for(let guard=0;guard<MAXT&&!BLOCKER&&gameState.loser==null;guard++){
  const p=gameState.activePlayer, turn=gameState.turn;
  safe('draw',()=>requestProcessorV27(PROCESSOR_V27.DRAW,{player:p}));respond();
  if(SAVELOAD&&!BLOCKER&&gameState.loser==null){saveLoad('phase:draw');respond();}
  if(BLOCKER||gameState.loser!=null)break;
  phase('standby');phase('main1');
  mainPhase(p,false);
  /* S03-U51: when the Battle Phase cannot be conducted this turn (e.g. 天空の宝札), the DUEL flow goes from Main Phase 1 straight to the End Phase */
  const noBattle=!!(typeof battlePhaseForbiddenV340==='function'&&battlePhaseForbiddenV340(gameState));
  if(!noBattle)battle(p);
  if(BLOCKER||gameState.loser!=null)break;
  /* the first turn has no Battle Phase, so Main Phase 1 goes straight to the End Phase */
  if(turn!==1&&!noBattle){phase('main2');mainPhase(p,true);}
  if(BLOCKER||gameState.loser!=null)break;
  phase('end');
  /* Replay consistency is checked every turn while the journal is short; a full re-simulation from action 1
     is O(journal length), so auditing every single turn of an unusually long duel makes the running total
     cost across the whole duel O(turns^2) in the journal length and can exceed this script's own execution
     budget even though the duel itself is completing correctly (confirmed: S03-U94's own investigation, a
     46-turn debris-vs-agent duel at seed 0x3/first=0 that only timed out because of this audit cadence, not
     any card/engine bug -- replay.ok:true and digestDiff:null once given enough time). Past turn 20, only
     audit every 5th turn; the post-loop audit below always covers the true final state regardless, so this
     only delays (never skips) eventual divergence detection for unusually long duels. */
  if(gameState.turn<=20||gameState.turn%5===0){
    const pk=v41ReplayPackage(gameState);if(!pk.truncated){const au=v44ReplayAuditPackage(pk);if(!au.ok){const e=pk.actions[au.index]||{};block('REPLAY_DIVERGENCE',{audit:au,action:e.action?{type:e.action.type,seq:e.seq}:null,actionFull:e.action||null,digestParts:digestDiffAt(pk,au.index),prev:pk.actions.slice(Math.max(0,(au.index||0)-4),(au.index||0)+1).map(x=>({seq:x.seq,type:x.action.type,ph:x.phase,action:x.action}))});break;}}
  }
  safe('turn',()=>requestProcessorV27(PROCESSOR_V27.TURN,{}));respond();
  if(!BLOCKER&&gameState.loser==null&&gameState.turn!==turn+1)block('TURN_NOT_ADVANCED',{from:turn,now:gameState.turn,phase:gameState.phase,pending:slPending(),paused:!!gameState.processorPaused,waiting:gameState.processorWaiting?JSON.stringify(gameState.processorWaiting).slice(0,400):null,queue:JSON.stringify(gameState.processorQueue).slice(0,600),busy:typeof duelFlowBusyReasonV30==='function'?duelFlowBusyReasonV30():null});
}
const pkg=v41ReplayPackage(gameState);
const audit=pkg.truncated?{ok:null,reason:'truncated'}:v44ReplayAuditPackage(pkg);
const futureFusionActions=(pkg.actions||[]).map(e=>e&&e.action).filter(Boolean).filter(a=>String(a.reason||'').includes('未来融合－フューチャー・フュージョン'));
const futureFusionOps=(OPS||[]).filter(o=>JSON.stringify(o&&o.d||{}).includes('未来融合－フューチャー・フュージョン')||JSON.stringify(o&&o.d||{}).includes('F・G・D'));
const futureFusionDiag={
  activated: futureFusionOps.some(o=>o.op==='activate'&&o.d&&o.d.name==='未来融合－フューチャー・フュージョン'),
  materialChoice: futureFusionOps.some(o=>o.op==='choice'&&o.d&&String(o.d.title||'').includes('F・G・D')&&String(o.d.title||'').includes('融合素材')),
  materialPicks: (futureFusionOps.find(o=>o.op==='choice'&&o.d&&String(o.d.title||'').includes('F・G・D')&&String(o.d.title||'').includes('融合素材'))||{}).d?.picked||[],
  mills: futureFusionActions.filter(a=>a.type==='FX_MILL').length,
  scheduledSummons: futureFusionActions.filter(a=>a.type==='SCHEDULE_ADD_V7'||a.type==='SCHEDULE_V7').length,
  fusionSummons: futureFusionActions.filter(a=>a.type==='FX_SPECIAL_SUMMON'&&a.from==='ex').length,
  fusionSummonKinds: futureFusionActions.filter(a=>a.type==='FX_SPECIAL_SUMMON'&&a.from==='ex').map(a=>a.summonKind||null),
  sourceLeaves: futureFusionActions.filter(a=>a.type==='FX_TO_GRAVE'&&['sz','field'].includes(a.zone)).length,
  actionTypes: futureFusionActions.map(a=>a.type)
};
/* diagnosis: which digest parts differ between the live end state and the Journal-rebuilt state */
let DIGEST_DIFF=null;
if(!pkg.truncated&&audit&&audit.reason==='finalDigest'){
  const liveParts=v41StateDigestText(gameState).split('||');
  const live=gameState;
  try{
    gameState=v44ReplayStateFromPackage(pkg);
    for(const e of pkg.actions)v44ApplyReplayEntry(e);
    const reb=v41StateDigestText(gameState).split('||');
    const n=Math.max(reb.length,liveParts.length),diff=[];
    for(let i=0;i<n;i++)if(reb[i]!==liveParts[i])diff.push({i,live:String(liveParts[i]).slice(0,160),rebuilt:String(reb[i]).slice(0,160)});
    DIGEST_DIFF=diff;
  }catch(e){DIGEST_DIFF=[{err:String(e&&e.message||e)}];}
  gameState=live;
}
let SAVESIZE_RESULT=null;
if(SAVESIZE){
  try{
    localStorage.removeItem(DUEL_SAVE_KEY);saveDuel();const raw=localStorage.getItem(DUEL_SAVE_KEY)||'';
    const d=raw?JSON.parse(raw):null, len=x=>JSON.stringify(x==null?null:x).length;
    const acts=(d&&d.replay&&d.replay.actions)||[], types={};
    acts.forEach(e=>{const t=(e.action&&e.action.type)||'?';types[t]=(types[t]||0)+JSON.stringify(e).length;});
    const top=Object.entries(types).sort((a,b)=>b[1]-a[1]).slice(0,8);
    const gs=d&&d.state||{}, parts=Object.keys(gs).map(k=>[k,len(gs[k])]).sort((a,b)=>b[1]-a[1]).slice(0,8);
    SAVESIZE_RESULT={chars:raw.length,utf8:unescape(encodeURIComponent(raw)).length,state:len(d&&d.state),replay:len(d&&d.replay),replayKeys:Object.keys((d&&d.replay)||{}).map(k=>[k,len(d.replay[k])]).sort((a,b)=>b[1]-a[1]).slice(0,6),
      actions:acts.length,avgEntry:acts.length?Math.round(len(acts)/acts.length):0,topActionTypes:top,topStateParts:parts,digestText:acts.filter(e=>e.digestText).length,turn:gameState.turn};
  }catch(e){SAVESIZE_RESULT={error:String(e&&e.message||e)};}
}
globalThis.__SAVESIZE=SAVESIZE_RESULT;
globalThis.__R1={list:V1?(V1.version+':'+V1.ids.join('-')):'provisional',v1load:V1LOAD,seed:SEED,first:FIRST,respond:RESPOND,policy:POLICY?{name:POLICY,seed:PSEED,respondP:RESP_P,passQ:PASS_Q,draws:PDRAWS}:null,deckErrors,opening:OPENING,completed:gameState.loser!=null,loser:gameState.loser,reason:gameState.duelEndedReason,turn:gameState.turn,
  lp:[gameState.players[0].lp,gameState.players[1].lp],deck:[gameState.players[0].deck.length,gameState.players[1].deck.length],blocker:BLOCKER,errors:ERRORS.slice(0,5),saveload:SAVELOAD?{every:SLEVERY,stops:SL.stops,done:SL.done,undo:SL.undo,perKind:SL.perKind,cancel:SL.cancel||0,skipped:SL.skipped||0,pointDropped:SL.pointDropped,evtDropped:SL.evtDropped,maxBytes:SL.bytes}:undefined,
  unsupported:UNSUPPORTED,journal:pkg.actions.length,truncated:pkg.truncated,replay:{ok:audit.ok,reason:audit.reason||null,count:audit.count},digestDiff:DIGEST_DIFF,opsCount:OPS.length,saveSize:SAVESIZE_RESULT,futureFusion:futureFusionDiag,ui:(typeof HARNESS_UI!=='undefined'&&HARNESS_UI)?{calls:HARNESS_UI_CALLS,errors:HARNESS_UI_ERRORS.slice(0,5),errorCount:HARNESS_UI_ERRORS.length}:undefined,toastsTail:TOASTS.slice(-8)};
globalThis.__OPS=OPS;
if(typeof process==='undefined'||true)globalThis.__JRN=(pkg.actions||[]).map(e=>e.seq+' '+e.action.type+(e.action.mode?':'+e.action.mode:'')+(e.action.reason?' ('+String(e.action.reason).slice(0,30)+')':''));
ok('R1 driver ran',true);
`);
const out=c.__R1||{fatal:'no result'};
if(process.env.R1_JOURNAL)fs.writeFileSync(process.env.R1_JOURNAL,(c.__JRN||[]).join(String.fromCharCode(10)));
/* the operation list is written outside the source tree (R1_OUT, default: the OS temp folder) */
fs.writeFileSync(path.join(process.env.R1_OUT||os.tmpdir(),'r1_ops_'+SEED.toString(16)+'_'+FIRST+'.json'),JSON.stringify({result:out,ops:c.__OPS||[]},null,1));
console.log('R1RESULT '+JSON.stringify(out));
