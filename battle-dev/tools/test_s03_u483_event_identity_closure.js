/* S03-U483: 保存・再開（saveDuel → 新 VM → offerResumeDuel）を跨いだ「イベントのカードの同一性」の残存範囲の測定と、その閉鎖（S03-U482）の固定。
   背景: S03-U477 は 暗黒界の誘発を uid 比較へ直し、「約 70 本のスクリプトが event.card を同一性で比べる」と記録した。S03-U482 はエンジンの共通の境界
   （preparedChainContext）で restoreEventRefsV27(link.event) を解決用の新しいビューに渡す修正を入れた。本単位はそれがどこまで閉じたかを測った（docs/S03_U483_REPORT.md）。
   結論: 残存は再現できなかった（解決段階の 17 本は全て U482 で閉じ、passive / condition / 誘発選択の窓の経路は元から生きたカードを受け取る）。この試験は閉鎖が静かに戻らないよう固定する。
   ■ 母集団の固定（実行時の走査）: CARD_SCRIPTS（入れ子の関数、深さ 4）と EFFECT_REGISTRY_V4 の全関数の toString と、グローバル関数への推移的な呼び出しから、event のカードを
     同一性で比べる（=== !== == != / indexOf / includes / 別名経由）スクリプトを列挙し、解決段階（resolve / operation / afterResolve）に届くものを固定する
     （同一性だけで比べる 17 本 + 分類済みの誤検出 2 本）。新しい本が入ると FAIL する: 解決段階の境界で生きたカードが渡るか確認して分類する。
   ■ 経路の固定: (a) スクリプトの ctx を作る makeContext と、イベントを直接発火する emitEvent の呼び出し箇所を固定、(b) 登録済みの選択継続・スケジューラ継続・X素材コスト仕様が event を読まない、
     (c) 実際の経路を駆動して、各段階（passive / condition / resolve / afterResolve）が受け取る event のカードが「生きたカード」であることを、保存なし / 誘発選択の窓で保存 / チェーン上で保存 の
     3 通りで確認（同名の別個体が場にいる盤面。結果は uid で確認）。 */
const harness=require('./astra_harness');
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function loc(c){const h=findCardByUid(c.uid);return h?(h.p+':'+h.zone):null;}
function liveOf(c){const h=findCardByUid(c.uid);return h?h.card:null;}
function mon(name,p,face,pos){const c=mk(name,p,face||'up',pos||'atk');c.summonedTurn=3;return c;}
function hand(p){return gameState.players[p].hand.length;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest and the final state',pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,240));}
let PREFER=[],SEEN=[],LINKS_SEEN={};
function pick(){
  const q=pc();
  SEEN.push({title:q.title,min:q.min,max:q.max,targeting:q.targeting,selection:q.selection,kind:q.kind,uids:q.candidates.map(c=>c.uid)});
  if(q.kind==='card'&&(q.max>1||q.min===0)){
    const keys=q.candidates.filter(c=>PREFER.indexOf(c.uid)>=0).map(c=>c.key);
    q.candidates.forEach(c=>{ if(keys.length<q.min&&keys.indexOf(c.key)<0) keys.push(c.key); });
    answerChoiceV49(keys.slice(0,q.max));return;}
  let j=-1;for(const u of PREFER){j=q.candidates.findIndex(c=>c.uid===u);if(j>=0){PREFER.splice(PREFER.indexOf(u),1);break;}}
  __choicePickV49(j>=0?j:0);}
function step(){
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();return 'evt';}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();return 'summon';}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();return 'chain';}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();return 'point';}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();return 'pump';}
  return null;}
function noteLinks(){gameState.chain.forEach(l=>{(LINKS_SEEN[l.name]=LINKS_SEEN[l.name]||new Set()).add(l.event&&l.event.uid!=null?l.event.uid:'c'+l.chainId);});}
function nlink(name){return LINKS_SEEN[name]?LINKS_SEEN[name].size:0;}
/* until: 述語。真で選択待ちが無ければそこで止まる */
function drive(until){for(let i=0;i<900;i++){
  noteLinks();
  if(until&&!pc()&&until())return 'until';
  if(pc()){pick();continue;}
  if(!step())return 'idle';}return 'loop';}
function linkOf(name){return gameState.chain.find(l=>l.name===name)||null;}
/* ページの再読み込みで消える実行時の変数（R1 の slReset と同じ範囲のうち、この単位が通る経路に関係するもの） */
function resetVolatile(){EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;
  try{CHOICE_LEGACY_CB_V49=new Map();}catch(e){}try{ACTIVATION_PREP_S03=null;}catch(e){}try{RESOLVING_LINK_S03=null;}catch(e){}
  try{PENDING_SUMMON_COMMIT=null;PENDING_SUMMON_CANCEL=null;}catch(e){}try{EVT_CANDS=[];}catch(e){}try{PROCESSOR_PUMPING_V27=false;}catch(e){}try{APPLY_ACTION_DEPTH_V31=0;}catch(e){}}
function fresh(active){resetA();resetVolatile();gameState.activePlayer=active;gameState.firstPlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4830001;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function savedRaw(){localStorage.removeItem(DUEL_SAVE_KEY);saveDuel();return localStorage.getItem(DUEL_SAVE_KEY);}
function reload(raw){resetA();resetVolatile();LINKS_SEEN={};localStorage.setItem(DUEL_SAVE_KEY,raw);return offerResumeDuel();}
/* スクリプトの各段階（condition / resolve / afterResolve / passive）が受け取った event のカードが「生きたカード」かを記録する */
const WATCH=[];
function watchScript(name){
  const sc=CARD_SCRIPTS[name]; if(!sc||sc.__watchedS483) return; sc.__watchedS483=true;
  const rec=(role,ctx)=>{const ev=ctx&&ctx.event; if(!ev||!ev.card){WATCH.push({name,role,card:false});return;}
    const h=ev.card.uid!=null?findCardByUid(ev.card.uid):null;
    WATCH.push({name,role,card:true,live:!!h&&h.card===ev.card,self:!!ctx.card&&ev.card.uid===ctx.card.uid,eventName:ctx.eventName});};
  ['condition','resolve','afterResolve'].forEach(k=>{const f=sc[k]; if(typeof f==='function') sc[k]=function(ctx){ rec(k,ctx); return f.apply(this,arguments); };});
  Object.keys(sc.passive||{}).forEach(k=>{const f=sc.passive[k]; if(typeof f==='function') sc.passive[k]=function(ctx){ rec('passive.'+k,ctx); return f.apply(this,arguments); };});
}
function watchSince(w0,name,roleRe){return WATCH.slice(w0).filter(r=>r.name===name&&roleRe.test(r.role));}
`;

/* ---- 自分自身の召喚・反転で誘発する 17 本（解決段階で event のカードを同一性で比べる）----
   kind: 'summon' = 手札から通常召喚 / 'flip' = 伏せたモンスターを反転召喚。obs(x): 解決が「自分自身の召喚・反転」の枝を通った印。
   盤面: 自分の場に生贄用のモンスター 3 体、同名の別個体（decoy: 先のターンから表側で場にいる）、相手の場に表 1・裏 1・伏せ魔法罠 1。 */
const MEMBERS=String.raw`
const T=()=>gameState.turn;
const flagIs=(x,k,v)=>{const c=liveOf(x.card);return !!c&&c[k]===v;};
const spirit=(x)=>flagIs(x,'c2SpiritTurn',T());
const SPIRIT_OBS=x=>[['the spirit flag c2SpiritTurn is set by the self branch of resolve',spirit(x)]];
const ARCANA_OBS=x=>{const c=liveOf(x.card);return [['the coin result c2ArcanaCoin (heads / tails) is recorded by the self branch of resolve',!!c&&(c.c2ArcanaCoin==='heads'||c.c2ArcanaCoin==='tails')]];};
const MEMBERS=[
 {key:'YAKSHA',name:'夜叉',kind:'summon',obs:x=>[['the spirit flag c2SpiritTurn is set by the self branch of resolve',spirit(x)],['夜叉 returned the opponent Set card to the hand',loc(x.trap)==='1:hand']]},
 {key:'TSUKU',name:'月読命',kind:'summon',obs:SPIRIT_OBS},
 {key:'SANJIN',name:'砂塵の悪霊',kind:'summon',obs:SPIRIT_OBS},
 {key:'HOUOU',name:'鳳凰',kind:'summon',obs:SPIRIT_OBS},
 {key:'RYUGU',name:'竜宮之姫',kind:'summon',obs:SPIRIT_OBS},
 {key:'MAHARAGI',name:'磨破羅魏',kind:'summon',obs:SPIRIT_OBS},
 {key:'IZANAMI',name:'伊弉波',kind:'summon',obs:SPIRIT_OBS},
 {key:'KINKA',name:'金華猫',kind:'summon',obs:SPIRIT_OBS},
 {key:'HYOKETSU',name:'氷結界の神精霊',kind:'summon',obs:SPIRIT_OBS},
 {key:'DENSHO',name:'封魔の伝承者',kind:'summon',setup:x=>{gameState.players[0].grave.push(mk('封魔の伝承者',0));},obs:x=>[['the Attribute declared by the registered choice that the self branch opens is recorded on the card',flagIs(x,'c2DenshoAttrs','光')]]},
 {key:'MAGICIAN',name:'アルカナフォースI－THE MAGICIAN',kind:'summon',obs:ARCANA_OBS},
 {key:'CHARIOT',name:'アルカナフォースVII－THE CHARIOT',kind:'summon',obs:ARCANA_OBS},
 {key:'MOON',name:'アルカナフォースXVIII－THE MOON',kind:'summon',obs:x=>{const c=liveOf(x.card);return [['the coin result e7MoonCoin (1 or 2) is recorded by the self branch of resolve',!!c&&(c.e7MoonCoin===1||c.e7MoonCoin===2)]];}},
 {key:'FOOL',name:'アルカナフォース0－THE FOOL',kind:'summon',obs:x=>{const c=liveOf(x.card);return [['the coin result e9FoolCoin (1 or 2) is recorded by the self branch of resolve',!!c&&(c.e9FoolCoin===1||c.e9FoolCoin===2)]];}},
 {key:'GUIDE',name:'異次元への案内人',kind:'summon',obs:x=>[['the control moved to the opponent (the self branch of resolve)',loc(x.card)==='1:mz'&&flagIs(x,'e9GuideMoved',1)]]},
 {key:'MIMIC',name:'暗黒のミミック LV1',kind:'flip',obs:x=>[['the Flip effect drew 1 card (the self branch) and the Flip-Summoned copy is still on the field',hand(0)===x.hand0+1&&loc(x.card)==='0:mz']]},
 {key:'LUQIAE',name:'ワーム・ルクイエ',kind:'flip',obs:x=>[['the Flip flag c2LuqiaeTurn is set by the self branch of resolve',flagIs(x,'c2LuqiaeTurn',T())]]},
];
const MARK_KEYS=['c2ArcanaCoin','c2SpiritTurn','c2LuqiaeTurn','c2DenshoAttrs','e7MoonCoin','e9FoolCoin','e9GuideMoved'];
function memberBoard(m){
  fresh(0);const P=gameState.players,x={m};
  const fodder=[mon('ゴブリン突撃部隊',0),mon('ギガンテス',0),mon('ゴブリンドバーグ',0)];
  x.decoy=mon(m.name,0);
  if(m.kind==='flip'){ x.card=mk(m.name,0,'down','def');x.card.setTurn=3;x.card.summonedTurn=3;P[0].mz=[x.card,x.decoy];P[0].hand=[mk('ワイト',0)];}
  else { x.card=mk(m.name,0);P[0].hand=[x.card];P[0].mz=fodder.concat([x.decoy]); }
  x.e1=mon('ワイト',1);x.e2=mon('ゴブリン突撃部隊',1,'down','def');x.trap=mk('ブラック・ホール',1,'down');x.trap.setTurn=1;
  P[1].mz=[x.e1,x.e2];P[1].sz=[x.trap];
  for(let i=0;i<4;i++)P[0].grave.push(mk('ワイト',0));
  if(m.setup)m.setup(x);
  baselineA();x.hand0=hand(0);return x;
}
function memberStart(x){
  if(x.m.kind==='flip'){doFlipUp(0,'mz',gameState.players[0].mz.findIndex(c=>c.uid===x.card.uid),'atk');}
  else doNormalSummon(0,'atk');
}
function decoyUntouched(x){const d=liveOf(x.decoy);return !d||MARK_KEYS.every(k=>d[k]===undefined);}
function tracked(x){return [x.card,x.decoy,x.trap,x.e1,x.e2];}
function locsOf(x){return tracked(x).map(c=>{const h=findCardByUid(c.uid);return h?(h.p+':'+h.zone+'/'+h.card.pos+'/'+h.card.face):null;});}
`;

/* 解決段階に届く、event のカードを同一性で比べるスクリプトの固定（実行時の走査の結果）。strict = 同一性だけで比べる（保存・再開の複製では一致しない）。
   classified = 走査では届くが、event のカードを同一性で比べていない（誤検出）と確認した本。 */
const RESOLVE_STRICT=['夜叉','月読命','砂塵の悪霊','鳳凰','竜宮之姫','磨破羅魏','伊弉波','金華猫','氷結界の神精霊','封魔の伝承者','アルカナフォースI－THE MAGICIAN','アルカナフォースVII－THE CHARIOT',
  'アルカナフォースXVIII－THE MOON','アルカナフォース0－THE FOOL','異次元への案内人','暗黒のミミック LV1','ワーム・ルクイエ'];
const RESOLVE_CLASSIFIED=['カラクリ将軍 無零','死霊ゾーマ'];

/* ============ VM1: 保存なしの駆動と、保存データの作成 ============ */
const first=harness(COMMON+MEMBERS+('const RESOLVE_STRICT='+JSON.stringify(RESOLVE_STRICT)+',RESOLVE_CLASSIFIED='+JSON.stringify(RESOLVE_CLASSIFIED)+';')+String.raw`
globalThis.__SAVES={};

/* ===== P. 母集団の走査（実行時）。watchScript が関数を包む前に行う ===== */
{
  const OPX='(?:===|!==|==|!=)';
  const esc=s=>s.replace(/[.*+?^$()|\[\]\\{}]/g,'\\$&');
  function evIdents(src){
    const ids=new Set();
    const re=/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\(?\s*(?:[\w$]+\s*&&\s*)?(?:[\w$.]*\.)?(?:event|evt)\b/g;
    let m;while((m=re.exec(src)))ids.add(m[1]);
    const hdr=src.slice(0,src.indexOf('{')>0?src.indexOf('{'):120);
    const pm=/([A-Za-z_$][\w$]*)/g;let q;
    while((q=pm.exec(hdr))){ if(/^(ev|evt|event|e|evnt)$/.test(q[1])) ids.add(q[1]); }
    ids.add('ctx.event');ids.add('c.event');ids.add('ctx.ev');
    return ids;
  }
  function directHits(src){
    const ids=evIdents(src),hits=[];
    for(const id of ids){
      const X=esc(id)+'\\.card\\b';
      const t=[new RegExp('(?<![\\w$.])'+X+'\\s*'+OPX),new RegExp(OPX+'\\s*\\(?\\s*(?<![\\w$.])'+X),new RegExp('\\b(?:indexOf|lastIndexOf|includes)\\(\\s*'+X+'\\s*\\)')];
      for(const r of t) if(r.test(src)) hits.push(id);
      const ra=new RegExp('(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*\\(?\\s*(?<![\\w$.])'+X,'g');let m;
      while((m=ra.exec(src))){const a=esc(m[1]);
        if(new RegExp('(?:(?<![\\w$.])'+a+'\\s*'+OPX+'|'+OPX+'\\s*\\(?\\s*(?<![\\w$.])'+a+'\\b|\\b(?:indexOf|includes|lastIndexOf)\\(\\s*'+a+'\\s*\\))').test(src)) hits.push('alias:'+m[1]);}
    }
    return hits;
  }
  const fsrc={};
  for(const n of Object.getOwnPropertyNames(globalThis)){ let f; try{f=globalThis[n];}catch(e){continue;} if(typeof f!=='function'||/^(API|Object|Array|Function)$/.test(n))continue; let s; try{s=Function.prototype.toString.call(f);}catch(e){continue;} fsrc[n]=s; }
  const helper={};
  for(const n in fsrc){ if(directHits(fsrc[n]).length) helper[n]=1; }
  const callsOf=(src,set)=>{const out=[];for(const h of set){ if(src.indexOf(h)>=0 && new RegExp('(?<![\\w$.])'+esc(h)+'\\s*\\(').test(src)) out.push(h);}return out;};
  let ch=true,it=0;
  while(ch&&it++<3){ch=false;const keys=Object.keys(helper);for(const n in fsrc){ if(helper[n])continue; if(callsOf(fsrc[n],keys).length){helper[n]=1;ch=true;} }}
  const hnames=Object.keys(helper);
  const fns=[];
  function walk(o,name,role,depth,seen){
    if(!o||depth>4)return;
    if(typeof o==='function'){fns.push({name,role,src:Function.prototype.toString.call(o)});return;}
    if(typeof o!=='object'||seen.has(o))return; seen.add(o);
    for(const k of Object.keys(o)){let v;try{v=o[k];}catch(e){continue;} walk(v,name,role?role+'.'+k:k,depth+1,seen);}
  }
  for(const name of Object.keys(CARD_SCRIPTS)) walk(CARD_SCRIPTS[name],name,'',0,new Set());
  let nv4=0;for(const name of Object.keys(EFFECT_REGISTRY_V4)){ (EFFECT_REGISTRY_V4[name]||[]).forEach(e=>walk(e,name,'v4',0,new Set())); nv4++; }
  const resolveLevel=new Set(),anyHit=new Set(),roles={};
  for(const f of fns){
    const direct=directHits(f.src).length>0, via=!direct&&callsOf(f.src,hnames).length>0;
    if(!direct&&!via) continue;
    anyHit.add(f.name);
    const role=f.role.replace(/^v4\.?/,'');
    if(/^(resolve|operation|afterResolve)$/.test(role)) resolveLevel.add(f.name);
    const g=/^passive\./.test(role)?'passive':role==='condition'?'condition':/^(resolve|operation|afterResolve)$/.test(role)?'resolve-level':'other';
    roles[g]=(roles[g]||0)+1;
  }
  const got=[...resolveLevel].sort(), want=RESOLVE_STRICT.concat(RESOLVE_CLASSIFIED).sort();
  ok('population scan: '+fns.length+' script functions ('+Object.keys(CARD_SCRIPTS).length+' scripts, '+nv4+' unified-effect cards) and '+hnames.length+' global helpers were read; '+anyHit.size+' scripts reach an event-card identity comparison somewhere (passive / condition / resolve …)',fns.length>20000&&anyHit.size>300&&anyHit.size<700,JSON.stringify({fns:fns.length,hit:anyHit.size,roles}));
  ok('population scan: the scripts that reach such a comparison from resolve / operation / afterResolve are exactly the 17 pinned (strict) + 2 classified false positives; a new one must be classified (does the resolution boundary hand it a live event card?)',JSON.stringify(got)===JSON.stringify(want),JSON.stringify({extra:got.filter(n=>want.indexOf(n)<0),missing:want.filter(n=>got.indexOf(n)<0)}));
  ok('population scan: 17 strict resolve-level members, every one named in the member table of this test (each is driven below)',RESOLVE_STRICT.length===17&&MEMBERS.length===17&&MEMBERS.every(m=>RESOLVE_STRICT.indexOf(m.name)>=0),JSON.stringify(MEMBERS.map(m=>m.name)));
  /* 登録済みの継続は event を読まない（引数は JSON の uid だけ） */
  const readsEvent=s=>/\bevent\b|\bevt\b|\.ev\b|ctx\.event/.test(s);
  const chOff=Object.keys(CHOICE_HANDLERS_V49).filter(k=>readsEvent(Function.prototype.toString.call(CHOICE_HANDLERS_V49[k])));
  const scOff=Object.keys(SCHEDULE_HANDLERS_V7).filter(k=>readsEvent(Function.prototype.toString.call(SCHEDULE_HANDLERS_V7[k])));
  const dtOff=fns.filter(f=>/(^|\.)detachCostS03(\.|$)/.test(f.role)&&readsEvent(f.src)).map(f=>f.name+':'+f.role);
  ok('registered choice continuations ('+Object.keys(CHOICE_HANDLERS_V49).length+') do not read an event (their arguments are JSON uids): a new one that does must be classified',chOff.length===0,JSON.stringify(chOff));
  ok('scheduler continuations ('+Object.keys(SCHEDULE_HANDLERS_V7).length+') do not read an event',scOff.length===0,JSON.stringify(scOff));
  ok('X-material detach cost specs (after / targets / holders) do not read an event (the prepared descriptor hands them a uid-only event)',dtOff.length===0,JSON.stringify(dtOff));
}

/* ===== A. 17 本: 保存なし / チェーン上で保存（VM2 で再開）===== */
for(const m of MEMBERS){
  const nm=m.name;
  watchScript(nm);
  const x=memberBoard(m);SEEN=[];PREFER=[];WATCH.length=0;LINKS_SEEN={};
  memberStart(x);
  const r=drive(()=>!!linkOf(nm));
  const link=linkOf(nm);
  ok(nm+' (no save): the real '+(m.kind==='flip'?'Flip Summon':'Normal Summon')+' stacks its own trigger (one link)',r==='until'&&!!link&&nlink(nm)===1,JSON.stringify({r,links:nlink(nm)}));
  ok(nm+' (no save): the link names the summoned / flipped copy by uid, not the same-name copy already on the field',!!link&&link.event.uid===x.card.uid&&link.event.uid!==x.decoy.uid,JSON.stringify(link&&link.event.uid));
  const pre=WATCH.filter(r=>r.name===nm&&/^(passive|condition)/.test(r.role));
  ok(nm+' (no save): while the trigger was collected and checked (passive / condition) every event card the script saw was the live card',pre.length>=1&&pre.every(r=>!r.card||r.live),JSON.stringify(pre.slice(0,6)));
  const raw=savedRaw(),d0=v41StateDigest(gameState),w0=WATCH.length;
  drive();
  const res=watchSince(w0,nm,/^resolve$/),aft=watchSince(w0,nm,/^afterResolve$/);
  ok(nm+' (no save): resolve ran with the live event card of the summoned / flipped copy (self branch)',res.length>=1&&res.every(r=>r.card&&r.live)&&res.some(r=>r.self),JSON.stringify(res));
  ok(nm+' (no save): afterResolve saw no detached event card',aft.every(r=>!r.card||r.live),JSON.stringify(aft));
  m.obs(x).forEach(e=>ok(nm+' (no save): '+e[0],e[1]&&gameState.chain.length===0,JSON.stringify(locsOf(x))));
  ok(nm+' (no save): the same-name copy already on the field never took the self branch',decoyUntouched(x),JSON.stringify(liveOf(x.decoy)));
  audit(nm+' (no save)');
  globalThis.__SAVES['M_'+m.key]=JSON.stringify({raw,d0,final:v41StateDigest(gameState),uid:x.card.uid,decoy:x.decoy.uid,trap:x.trap.uid,e1:x.e1.uid,e2:x.e2.uid,hand0:x.hand0,locs:locsOf(x),name:nm});
}

/* ===== B. 誘発選択の窓（EVT_V2_STATE が開いている時）で保存 ===== */
for(const key of ['YAKSHA','GUIDE','MIMIC']){
  const m=MEMBERS.find(q=>q.key===key),nm=m.name;
  const x=memberBoard(m);SEEN=[];PREFER=[];WATCH.length=0;LINKS_SEEN={};
  memberStart(x);
  const hasWin=()=>typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE&&EVT_V2_STATE.groups.some(g=>g.some(c=>c.name===nm));
  const r=drive(hasWin);
  const cands=[].concat.apply([],EVT_V2_STATE.groups).filter(c=>c.name===nm);
  ok(nm+' (trigger window): the SEGOC window opens with exactly the summoned / flipped copy as the candidate (the same-name copy on the field is not offered)',r==='until'&&cands.length===1&&cands[0].card.uid===x.card.uid,JSON.stringify({r,cands:cands.map(c=>c.card.uid),want:x.card.uid}));
  ok(nm+' (trigger window): the candidate\'s event carries the live card',cands.every(c=>c.event&&c.event.card===liveOf(x.card)),'');
  const raw=savedRaw(),d0=v41StateDigest(gameState),w0=WATCH.length;
  drive();
  const res=watchSince(w0,nm,/^resolve$/);
  ok(nm+' (trigger window, no save): picking and resolving gave the live event card',res.length>=1&&res.every(r=>r.card&&r.live)&&res.some(r=>r.self),JSON.stringify(res));
  m.obs(x).forEach(e=>ok(nm+' (trigger window, no save): '+e[0],e[1],JSON.stringify(locsOf(x))));
  globalThis.__SAVES['W_'+key]=JSON.stringify({raw,d0,final:v41StateDigest(gameState),uid:x.card.uid,decoy:x.decoy.uid,trap:x.trap.uid,e1:x.e1.uid,e2:x.e2.uid,hand0:x.hand0,locs:locsOf(x),name:nm});
}


/* ===== D. 複数のカードを持つイベント（event.cards）: 同じ境界で uid から生きたカードへ。無いカードは同名で代用しない ===== */
{
  fresh(0);const P=gameState.players;
  const a=mon('ワイト',1),b=mon('ワイト',1),c=mon('ワイト',1),src=mk('つまずき',0,'up');
  P[0].sz=[src];P[1].mz=[a,b,c];baselineA();
  const ev=safeActivationEventV11({cards:[a,b],player:1,provenance:'u483-cards'});
  const mkLink=()=>({player:0,uid:ensureCardUid(gameState,src),name:'つまずき',from:'sz',index:0,ss:2,event:ev,eventName:'onSpecialSummon',chainId:483,effectClass:'trap',keep:true,targets:[],selection:[]});
  gameState.chain=[mkLink()];gameState=JSON.parse(JSON.stringify(gameState));
  const loaded=gameState.chain[0],la=liveOf(a),lb=liveOf(b),lc=liveOf(c);
  ok('event.cards (Save/Load): the stored prepared snapshot is JSON-only — it carries uids and no card copies',Array.isArray(loaded.event.uids)&&loaded.event.uids.length===2&&!('cards' in loaded.event),JSON.stringify(loaded.event));
  const ctx=preparedChainContext(loaded);
  const cs=Array.isArray(ctx.event.cards)?ctx.event.cards:[];
  ok('event.cards (Save/Load): the resolution context holds the exact LIVE cards, in order, and not the same-name third monster',cs.length===2&&cs[0]===la&&cs[1]===lb&&cs.indexOf(lc)<0&&ctx.event.provenance==='u483-cards',JSON.stringify({n:cs.length}));
  ok('event.cards (Save/Load): hydration did not mutate the stored snapshot',!('cards' in loaded.event)&&loaded.event.uids.length===2,JSON.stringify(loaded.event));
  const gone=gameState.players[1].mz.findIndex(x=>x.uid===b.uid);gameState.players[1].mz.splice(gone,1);
  const ctx2=preparedChainContext(loaded);
  const cs2=Array.isArray(ctx2.event.cards)?ctx2.event.cards:[];
  ok('event.cards (missing member): a card that no longer exists is dropped — the same-name survivor is never substituted for it',cs2.length===1&&cs2[0]===la&&cs2.indexOf(lc)<0,JSON.stringify({n:cs2.length}));
}

/* ===== E. uid を持たない直接発火のイベント（カラクリの表示形式変更: emitEvent("onKarakuriPositionChange", {player, card})）===== */
/* DUEL で届く、card だけで uid を持たないイベントはこれだけ（メインフェイズの手動の表示形式変更）。リンクの event は保存で card の複製になり、restoreEventRefsV27 は uid が無いので戻せない。
   読む側（カラクリ大将軍 無零怒）は event.card の表裏と名前しか見ず、同一性では比べない。実際に最後まで駆動して結果が保存なしと同じことを固定する（読む側が同一性で比べるようになったら
   上の母集団の走査が先に知らせる）。 */
{
  const GEN='カラクリ大将軍 無零怒';
  fresh(0);const P=gameState.players;
  const gen=mon(GEN,0),k=mon('カラクリ兵 弐参六',0);P[0].mz=[gen,k];baselineA();SEEN=[];PREFER=[];LINKS_SEEN={};WATCH.length=0;watchScript(GEN);
  const h0=hand(0);
  zAct('TOGGLE_POS',0,'mz',1);
  const r=drive(()=>!!linkOf(GEN));
  const link=linkOf(GEN);
  ok('uid-less direct emit (no save): the manual position change of a カラクリ stacks 無零怒 draw trigger',r==='until'&&!!link&&link.eventName==='onKarakuriPositionChange',JSON.stringify({r,ev:link&&link.eventName}));
  const raw=savedRaw(),d0=v41StateDigest(gameState);
  drive();
  ok('uid-less direct emit (no save): the draw resolved (1 card) and the once-per-turn mark is set',hand(0)===h0+1&&liveOf(gen).v350BureidoDrawTurn===gameState.turn&&gameState.chain.length===0,JSON.stringify({hand:hand(0)-h0}));
  audit('uid-less direct emit (no save)');
  globalThis.__SAVES['K_KARAKURI']=JSON.stringify({raw,d0,final:v41StateDigest(gameState),gen:gen.uid,k:k.uid,h0});
}
`);

/* ============ VM2: 新しい VM で保存データを読み込んで続きを解決する ============ */
const SAVES=first.__SAVES||{};
const KEYS=['M_YAKSHA','W_YAKSHA','K_KARAKURI'];
if(KEYS.some(k=>!SAVES[k])){console.log('FAIL Save/Load VM1 saves missing: '+KEYS.filter(k=>!SAVES[k]).join(','));process.exitCode=2;}
else harness('const SAVES='+JSON.stringify(SAVES)+';'+COMMON+MEMBERS+String.raw`
const NAME_OF={};MEMBERS.forEach(m=>NAME_OF[m.key]=m);
/* VM1 の x と同じ形（uid だけ）を作る */
function xOf(m,S){return {m,card:{uid:S.uid},decoy:{uid:S.decoy},trap:{uid:S.trap},e1:{uid:S.e1},e2:{uid:S.e2},hand0:S.hand0};}

/* ===== A. チェーン上で保存 → 新しい VM → 再開 → 解決 ===== */
for(const m of MEMBERS){
  const S=JSON.parse(SAVES['M_'+m.key]),nm=m.name;
  watchScript(nm);WATCH.length=0;
  const loaded=reload(S.raw),x=xOf(m,S);
  const link=linkOf(nm),live=liveOf(x.card);
  ok(nm+' (Save/Load at the chain): the saved game resumes with the trigger link on the chain',loaded===true&&!!link&&link.event.uid===x.card.uid&&gameState.chain.length===1,JSON.stringify({loaded,chain:gameState.chain.length,uid:link&&link.event.uid}));
  ok(nm+' (Save/Load at the chain): the stored link snapshot does NOT hold the live card (the JSON round trip made it a copy or dropped it) — the hazard this unit pins',!!link&&(!link.event.card||link.event.card!==live),JSON.stringify(link&&link.event.card&&link.event.card.uid));
  ok(nm+' (Save/Load at the chain): the resumed state equals the saved state (digest)',v41StateDigest(gameState)===S.d0,v41StateDigest(gameState)+' vs '+S.d0);
  const stored=link&&link.event.card;
  drive();
  const res=watchSince(0,nm,/^resolve$/),aft=watchSince(0,nm,/^afterResolve$/);
  ok(nm+' (Save/Load at the chain): resolve ran with the LIVE event card of the summoned / flipped copy, not a copy of it (self branch)',res.length>=1&&res.every(r=>r.card&&r.live)&&res.some(r=>r.self),JSON.stringify(res));
  ok(nm+' (Save/Load at the chain): afterResolve saw no detached event card',aft.every(r=>!r.card||r.live),JSON.stringify(aft));
  x.hand0=S.hand0;
  m.obs(x).forEach(e=>ok(nm+' (Save/Load at the chain): '+e[0],e[1]&&gameState.chain.length===0,JSON.stringify(locsOf(x))));
  ok(nm+' (Save/Load at the chain): the same-name copy already on the field never took the self branch',decoyUntouched(x),JSON.stringify(liveOf(x.decoy)));
  ok(nm+' (Save/Load at the chain): every tracked card ends where it ended in the uninterrupted VM1 run',JSON.stringify(locsOf(x))===JSON.stringify(S.locs),JSON.stringify({vm2:locsOf(x),vm1:S.locs}));
  ok(nm+' (Save/Load at the chain): the final digest equals the uninterrupted VM1 run',v41StateDigest(gameState)===S.final,v41StateDigest(gameState)+' vs '+S.final);
  audit(nm+' (Save/Load at the chain)');
}

/* ===== B. 誘発選択の窓で保存 → 新しい VM → 窓が開き直る → 選ぶ → 解決 ===== */
for(const key of ['YAKSHA','GUIDE','MIMIC']){
  const m=NAME_OF[key],S=JSON.parse(SAVES['W_'+key]),nm=m.name;
  watchScript(nm);WATCH.length=0;
  const loaded=reload(S.raw),x=xOf(m,S);
  const st=typeof EVT_V2_STATE!=='undefined'?EVT_V2_STATE:null;
  const cands=st?[].concat.apply([],st.groups).filter(c=>c.name===nm):[];
  ok(nm+' (Save/Load at the trigger window): the SEGOC window reopens with exactly the summoned / flipped copy (the same-name copy is not offered), by uid',loaded===true&&cands.length===1&&cands[0].card.uid===x.card.uid,JSON.stringify({loaded,cands:cands.map(c=>c.card&&c.card.uid),want:x.card.uid}));
  ok(nm+' (Save/Load at the trigger window): the reopened candidate carries the live card (hydrated), not a copy',cands.every(c=>c.event&&c.event.card===liveOf(x.card)),'');
  ok(nm+' (Save/Load at the trigger window): the resumed state equals the saved state (digest)',v41StateDigest(gameState)===S.d0,v41StateDigest(gameState)+' vs '+S.d0);
  drive();
  const cond=watchSince(0,nm,/^condition$/),res=watchSince(0,nm,/^resolve$/);
  ok(nm+' (Save/Load at the trigger window): the pick re-checked the condition with the live event card and resolve got the live card (self branch)',cond.every(r=>!r.card||r.live)&&res.length>=1&&res.every(r=>r.card&&r.live)&&res.some(r=>r.self),JSON.stringify({cond,res}));
  x.hand0=S.hand0;
  m.obs(x).forEach(e=>ok(nm+' (Save/Load at the trigger window): '+e[0],e[1],JSON.stringify(locsOf(x))));
  ok(nm+' (Save/Load at the trigger window): the same-name copy never took the self branch, and the final digest equals the uninterrupted VM1 run',decoyUntouched(x)&&v41StateDigest(gameState)===S.final,v41StateDigest(gameState)+' vs '+S.final);
  audit(nm+' (Save/Load at the trigger window)');
}


/* ===== E. uid を持たない直接発火のイベント: チェーン上で保存 → 新しい VM → 再開 ===== */
{
  const S=JSON.parse(SAVES['K_KARAKURI']),GEN='カラクリ大将軍 無零怒';
  watchScript(GEN);
  const loaded=reload(S.raw),link=linkOf(GEN);
  ok('uid-less direct emit (Save/Load): the saved game resumes with the 無零怒 trigger on the chain, in the state it was saved in',loaded===true&&!!link&&v41StateDigest(gameState)===S.d0,JSON.stringify({loaded,link:!!link}));
  drive();
  ok('uid-less direct emit (Save/Load): the draw resolved exactly as in the uninterrupted VM1 run (the consumer reads only the face and name of event.card, never its identity)',gameState.players[0].hand.length===S.h0+1&&liveOf({uid:S.gen}).v350BureidoDrawTurn===gameState.turn&&v41StateDigest(gameState)===S.final,v41StateDigest(gameState)+' vs '+S.final);
  audit('uid-less direct emit (Save/Load)');
}
`);

/* ============ Node 側: スクリプトに event を渡す入口の固定（ソース）============ */
{
  const strip=s=>s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/(^|[^:'"\\])\/\/.*$/gm,'$1');
  const count=(re)=>{const out={};
    for(const dir of ['engine','cards']){
      for(const f of fs.readdirSync(path.join(ROOT,dir)).filter(x=>x.endsWith('.js'))){
        const n=(strip(fs.readFileSync(path.join(ROOT,dir,f),'utf8')).match(re)||[]).length;
        if(n) out[dir+'/'+f]=n;
      }
    }
    return out;};
  /* ctx を作る makeContext の呼び出し箇所（定義を除く）。event を保存データから受け取る箇所は restoreEventRefsV27 で生きたカードにしてから渡している:
       engine/1O（誘発選択の再構築: restoreEventRefsV27(c.event)）/ engine/30（preparedChainContext: restoreEventRefsV27(link.event)、collectHandlers の呼び出し元 processEventV27・processEventBatchV28・flushDeferredEventsV2 も復元済み）/
       engine/1ZF（X素材コストの準備記述: uid だけの event。読む仕様は無い）/ 他は event を渡さない or 発動の時点（生きたカード）の opts。 */
  const MAKE={"engine/1O_activation_event_continuation_v11.js":1,"engine/1ZF_xyz_detach_choice_s03.js":1,"engine/20_effect_primitives_ex.js":1,"engine/30_processor_chain_battle.js":6,"engine/40_legal_script_engine.js":6,"engine/60_damage_segoc_ui_helpers.js":1,"engine/70_summon_procedures.js":1};
  /* イベントを直接発火する emitEvent の呼び出し箇所。DUEL の通常の経路のイベントは deferredEvents（uid）を通る。直接発火は card を持つが uid を持たない形があるため、DUEL で届くものは
     読むスクリプトを確認した（カラクリの表示形式変更は card の表裏・名前だけを読む）。ほかは MANUAL / 旧経路。 */
  const EMIT={"cards/20_control_counter.js":1,"cards/40_auto_interpreter.js":1,"engine/30_processor_chain_battle.js":2,"engine/40_legal_script_engine.js":1,"engine/60_damage_segoc_ui_helpers.js":1,"engine/70_summon_procedures.js":3};
  const gotMake=count(/(?<!function\s)\bmakeContext\(/g),gotEmit=count(/(?<!function\s)\bemitEvent\(/g);
  const same=(a,b)=>JSON.stringify(Object.keys(a).sort().map(k=>[k,a[k]]))===JSON.stringify(Object.keys(b).sort().map(k=>[k,b[k]]));
  const diff=(a,b)=>{const ks=new Set(Object.keys(a).concat(Object.keys(b)));return [...ks].filter(k=>a[k]!==b[k]).map(k=>k+': '+(a[k]||0)+' (found) vs '+(b[k]||0)+' (pinned)');};
  console.log((same(gotMake,MAKE)?'PASS ':'FAIL ')+'every makeContext call site (the places a script ctx — and so ctx.event — is built) is the audited set; a new or moved site must be classified: does it receive a stored event that needs restoreEventRefsV27? :: '+JSON.stringify(diff(gotMake,MAKE)));
  console.log((same(gotEmit,EMIT)?'PASS ':'FAIL ')+'every direct emitEvent call site is the audited set (events fired straight to collectHandlers without the deferred-event uid round trip); a new one must be classified :: '+JSON.stringify(diff(gotEmit,EMIT)));
  if(!same(gotMake,MAKE)||!same(gotEmit,EMIT)) process.exitCode=2;
}
