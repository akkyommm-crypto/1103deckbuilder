/* S03-U476: 「対象を選択する効果なのに targets:true を宣言していない」カードの全数監査と、1103 の文言・裁定で本当に対象を取る単体対象 8 枚の修正。
   欠陥（S03-U473 の 次元幽閉 と同型）: API.selectCard は対象耐性の要否（targeting）を「スクリプトの targets:true」から導く。宣言が無いと targeting=false になり、
   filterTargetable（対象耐性）が一度も掛からず、解決時の発生源 srcS03.tg（「対象を取らない効果では破壊されない」の判定）にも対象が載らない。
   候補の導出: 実行時の CARD_SCRIPTS 全 3601 本を走査し、selectTargets（発動準備の対象選択の道）が選択（API.selectCard / requestChoice / p11cOpen / ca3Open、
   および選択を開く全グローバル関数の推移閉包）に到達し、targets !== true のものを集める（下の「audit pin」で同じ導出を再実行して固定する）。
   ここで修正して検証するのは、1103 の文言（data/carddata.json の e）と裁定アーカイブ（wiki-rulings.js）で本当に対象を取る、単体対象の 8 枚:
     スノーマンイーター（WIKI-1C858F044CF1 2008-12-21「対象をとります」）/ マスター・ヒュペリオン（文言「選択して破壊」）/ 万力魔神バイサー・デス（文言「対象として」）/
     D・ステープラン（WIKI-2FDC4DF69545 2011-02-13「この効果で対象に選択した」）/ カラクリ参謀 弐四八（WIKI-EFE3E370ADDF 2011-06-11「対象をとります」）/
     カラクリ忍者 九壱九（文言「選択して表側守備表示で特殊召喚」）/ 暗黒界の龍神 グラファ（WIKI-7722BBA38465 2011-06-18「取ります」）/ 暗黒界の武神 ゴルド（WIKI-9F35337BF8BB 2007-01-13「対象をとる」）。
   固定する面（S03-U473 と同じ基準）:
     1. 対象の確定 — 選んだカードがチェーンリンクの targets に記録され（uid）、JSON 往復でも残り、解決の発生源（srcS03.tg）にも載る。
     2. 耐性判定 — 対象耐性（オベリスクの巨神兵 / メタルシルバー・アーマー）のある候補は選択肢から外れる。対照: 耐性が無ければ同じ位置の候補は出る。対象にできる候補が無ければ準備が U471 の取り消しで戻る。
     3. 正常発動 — 発動 → 対象選択 → 解決が最後まで通り、選んだ「実カード」(uid) が期待どおりに動く（S03-U475: targets:true で選択がチェーンに載る時、p/zone の無い返り値は複製になり解決で何も動かない。それが起きないことの確認を兼ねる）。
     4. Replay 監査と Save/Load（saveDuel → 新 VM → offerResumeDuel。チェーン上で保存 → 解決 → 追跡した全カードの位置と最終ダイジェストが無中断の VM1 と一致）。
   意図的に直していない候補（複数対象のメタルシルバー・アーマー例外 targetCount が絡む 5 枚、解決時に選ぶ構造の 2 枚など）は audit pin に「分類済み・未修正」として固定し、理由は docs/S03_U476_REPORT.md に記す。 */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
const OBE='オベリスクの巨神兵',ARM='メタルシルバー・アーマー';
function pc(){return pendingChoiceV49(gameState);}
function loc(c){const h=findCardByUid(c.uid);return h?(h.p+':'+h.zone):null;}
function posOf(c){const h=findCardByUid(c.uid);return h?h.card.pos:null;}
function faceOf(c){const h=findCardByUid(c.uid);return h?h.card.face:null;}
function uidOf(c){return ensureCardUid(gameState,c);}
function mon(name,p,face,pos){const c=mk(name,p,face||'up',pos||'atk');c.summonedTurn=3;return c;}
function sameSet(a,b){return JSON.stringify(a.slice().sort())===JSON.stringify(b.slice().sort());}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest and the final state',pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,240));}
function jtypes(j0){return V41_ACTION_JOURNAL.slice(j0).map(e=>e.action.type+(/^PREP_TX/.test(e.action.type)&&e.action.reason?':'+e.action.reason:''));}
let PREFER=[],SEEN=[],TARGET_COUNT=null;
/* 選択: min1/max1 は PREFER の先頭に合う候補（無ければ先頭）。複数選択（max>1 か min 0）は PREFER に合う候補を全て答える */
function pick(){
  const q=pc();
  SEEN.push({title:q.title,min:q.min,max:q.max,targeting:q.targeting,selection:q.selection,kind:q.kind,uids:q.candidates.map(c=>c.uid)});
  if(q.kind==='option'&&TARGET_COUNT!=null){const c=q.candidates.find(c=>Number(c.value)===TARGET_COUNT);answerChoiceV49([c.key]);return;}
  if(q.kind==='card'&&(q.max>1||q.min===0)){answerChoiceV49(q.candidates.filter(c=>PREFER.indexOf(c.uid)>=0).map(c=>c.key).slice(0,q.max));return;}
  let j=-1;for(const u of PREFER){j=q.candidates.findIndex(c=>c.uid===u);if(j>=0)break;}
  __choicePickV49(j>=0?j:0);}
function step(){
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();return 'evt';}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();return 'summon';}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();return 'chain';}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();return 'point';}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();return 'pump';}
  return null;}
/* until: 述語。真で選択待ちが無ければそこで止まる */
function drive(until){for(let i=0;i<900;i++){
  if(until&&!pc()&&until())return 'until';
  if(pc()){pick();continue;}
  if(!step())return 'idle';}return 'loop';}
function linkOf(name){return gameState.chain.find(l=>l.name===name)||null;}
function fresh(active){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;gameState.activePlayer=active;gameState.firstPlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4760001;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function savedRaw(){saveDuel();return localStorage.getItem(DUEL_SAVE_KEY);}
function tgOf(j0){const s=new Set();V41_ACTION_JOURNAL.slice(j0).forEach(e=>{const t=e.action.srcS03&&e.action.srcS03.tg;if(t&&t.length)t.forEach(u=>s.add(u));});return [...s];}
function oppHandDestruction(){const dd=mk('手札抹殺',1,'down');dd.setTurn=2;gameState.players[1].sz.push(dd);return dd;}
function atk(p,atkr,tg){const ai=gameState.players[p].mz.indexOf(atkr),ti=gameState.players[p===0?1:0].mz.indexOf(tg);requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:ai,target:ti});}
`;

/* ---- カード別の仕様 ----
   v: 'ctl'（耐性なし。同じ位置に普通のモンスター）/ 'obe'（その位置が オベリスクの巨神兵）/ 'only'|'msa'（対象にできる候補が無い）
   start(x): 発動を始める。 cands(x,v): 対象選択（targeting の選択）の候補として期待する uid。 pick(x): 選ぶカード（順）。 chosen(x): チェーンリンクが持つはずの対象。
   expect(x): 解決後の期待。 track(x): 追跡するカード（Save/Load で位置を比べる）。 */
const SPECS=String.raw`
const SPECS=[
{key:'SN',name:'スノーマンイーター',nt:1,vars:['ctl','obe','only'],
 build(v){fresh(0);const P=gameState.players,x={v};
   x.snow=mon('スノーマンイーター',0,'down','def');x.own=mon('ワイト',0);x.f1=mon('ゴブリン突撃部隊',1);x.f2=mon('ギガンテス',1);
   x.prot=v==='obe'?mon(OBE,1):mon('ライオウ',1);
   P[0].mz=[x.snow,x.own];P[1].mz=[x.f1,x.f2,x.prot];
   if(v==='only'){P[0].mz=[x.snow];P[1].mz=[x.prot=mon(OBE,1)];}
   baselineA();return x;},
 start(x){doFlipUp(0,'mz',0,'atk');},
 cands:(x,v)=>v==='ctl'?[x.own,x.f1,x.f2,x.prot].map(c=>c.uid):[x.own,x.f1,x.f2].map(c=>c.uid),
 pick:x=>[x.f1.uid],chosen:x=>[x.f1],
 expect:x=>[['the chosen ゴブリン突撃部隊 was destroyed',loc(x.f1)==='1:grave'],['the unchosen ギガンテス, the own ワイト and the control monster stay on the field',loc(x.f2)==='1:mz'&&loc(x.own)==='0:mz'&&loc(x.prot)==='1:mz'],['スノーマンイーター stays face-up on the field',loc(x.snow)==='0:mz'&&faceOf(x.snow)==='up']],
 untouched:x=>loc(x.prot)==='1:mz'&&faceOf(x.prot)==='up'&&loc(x.snow)==='0:mz',
 track:x=>[x.snow,x.own,x.f1,x.f2,x.prot]},
{key:'HYP',name:'マスター・ヒュペリオン',nt:1,vars:['ctl','obe'],
 build(v){fresh(0);const P=gameState.players,x={v};
   x.hyp=mon('マスター・ヒュペリオン',0);x.cost=mk('ハネワタ',0);x.f1=mon('ゴブリン突撃部隊',1);
   x.prot=v==='obe'?mon(OBE,1):mon('ライオウ',1);x.set=mk('サイクロン',1,'down');x.set.setTurn=3;
   P[0].mz=[x.hyp];P[0].grave=[x.cost];P[1].mz=[x.f1,x.prot];P[1].sz=[x.set];
   baselineA();return x;},
 start(x){duelActivateFromZone(0,'mz',0,{});},
 cands:(x,v)=>v==='ctl'?[x.hyp,x.f1,x.prot,x.set].map(c=>c.uid):[x.hyp,x.f1,x.set].map(c=>c.uid),
 pick:x=>[x.cost.uid,x.f1.uid],chosen:x=>[x.f1],
 expect:x=>[['the chosen ゴブリン突撃部隊 was destroyed',loc(x.f1)==='1:grave'],['the cost ハネワタ was banished',loc(x.cost)==='0:banish'],['the unchosen face-down card, the control monster and ヒュペリオン stay',loc(x.set)==='1:sz'&&loc(x.prot)==='1:mz'&&loc(x.hyp)==='0:mz']],
 costFirst:true,
 track:x=>[x.hyp,x.cost,x.f1,x.prot,x.set]},
{key:'VICE',name:'万力魔神バイサー・デス',nt:1,vars:['ctl','obe','only'],
 build(v){fresh(0);const P=gameState.players,x={v};
   x.vice=mk('万力魔神バイサー・デス',0);x.f1=mon('ゴブリン突撃部隊',1);x.prot=v==='obe'?mon(OBE,1):mon('ライオウ',1);
   P[0].hand=[x.vice];P[1].mz=[x.f1,x.prot];
   if(v==='only'){P[1].mz=[x.prot=mon(OBE,1)];}
   baselineA();return x;},
 start(x){doNormalSummon(0,'atk');},
 cands:(x,v)=>v==='ctl'?[x.f1,x.prot].map(c=>c.uid):[x.f1].map(c=>c.uid),
 pick:x=>[x.f1.uid],chosen:x=>[x.f1],
 expect:x=>{const f=findCardByUid(x.f1.uid),m=findCardByUid(x.vice.uid);return [['the chosen ゴブリン突撃部隊 carries the mark of 万力魔神バイサー・デス and 万力魔神 remembers it (uid)',!!f&&!!m&&f.card.u161ViceMarkedBy===x.vice.uid&&m.card.u161ViceTargetUid===x.f1.uid],['the unchosen control monster is not marked and nothing was destroyed yet',loc(x.prot)==='1:mz'&&findCardByUid(x.prot.uid).card.u161ViceMarkedBy==null&&loc(x.f1)==='1:mz']];},
 untouched:x=>loc(x.prot)==='1:mz'&&findCardByUid(x.prot.uid).card.u161ViceMarkedBy==null&&loc(x.vice)==='0:mz',
 track:x=>[x.vice,x.f1,x.prot]},
{key:'STAP',name:'D・ステープラン',nt:1,vars:['ctl','obe','only'],
 build(v){fresh(1);gameState.phase='battle';const P=gameState.players,x={v};
   x.st=mon('D・ステープラン',0,'up','def');x.a=mon('ゴブリン突撃部隊',1);x.b=mon('ギガンテス',1);x.prot=v==='obe'?mon(OBE,1):mon('ライオウ',1);
   P[0].mz=[x.st];P[1].mz=[x.a,x.b,x.prot];
   if(v==='only'){x.a=mon(OBE,1);x.b=null;x.prot=x.a;P[1].mz=[x.a];}
   baselineA();return x;},
 start(x){atk(1,x.a,x.st);},
 cands:(x,v)=>v==='ctl'?[x.a,x.b,x.prot].map(c=>c.uid):[x.a,x.b].map(c=>c.uid),
 pick:x=>[(x.b||x.a).uid],chosen:x=>[x.b||x.a],
 expect:x=>[['the chosen ギガンテス went to Defense Position',posOf(x.b)==='def'],['D・ステープラン went to Attack Position',posOf(x.st)==='atk'],['the unchosen attacker and the control monster stay in Attack Position',posOf(x.a)==='atk'&&posOf(x.prot)==='atk'],['D・ステープラン was not destroyed by the battle',loc(x.st)==='0:mz']],
 untouched:x=>loc(x.prot)==='1:mz'&&posOf(x.prot)==='atk'&&posOf(x.st)==='def',
 track:x=>[x.st,x.a,x.b,x.prot].filter(Boolean)},
{key:'KSAN',name:'カラクリ参謀 弐四八',nt:1,noStamp:true,vars:['ctl','obe'],
 build(v){fresh(0);const P=gameState.players,x={v};
   x.san=mk('カラクリ参謀 弐四八',0);x.own=mon('ワイト',0);x.f1=mon('ゴブリン突撃部隊',1);x.prot=v==='obe'?mon(OBE,1):mon('ライオウ',1);
   P[0].hand=[x.san];P[0].mz=[x.own];P[1].mz=[x.f1,x.prot];
   baselineA();return x;},
 start(x){doNormalSummon(0,'atk');},
 cands:(x,v)=>v==='ctl'?[x.san,x.own,x.f1,x.prot].map(c=>c.uid):[x.san,x.own,x.f1].map(c=>c.uid),
 pick:x=>[x.f1.uid],chosen:x=>[x.f1],
 expect:x=>[['the chosen ゴブリン突撃部隊 changed its battle position (ATK -> DEF)',posOf(x.f1)==='def'],['the unchosen control monster and the own monster keep their position',posOf(x.prot)==='atk'&&posOf(x.own)==='atk'],['カラクリ参謀 stays face-up in Attack Position',loc(x.san)==='0:mz'&&posOf(x.san)==='atk']],
 track:x=>[x.san,x.own,x.f1,x.prot]},
{key:'KNIN',name:'カラクリ忍者 九壱九',nt:1,noStamp:true,vars:['ctl','msa'],
 build(v){fresh(0);gameState.phase='battle';const P=gameState.players,x={v};
   x.nin=mon('カラクリ忍者 九壱九',0);x.g1=mk('カラクリ兵 弐参六',0);x.g2=mk('カラクリ商人 壱七七',0);x.n=mk('ワイト',0);
   x.vic=mon('はにわ',1);x.host=mon('サイバー・ドラゴン',1);
   P[0].mz=[x.nin];P[0].grave=[x.g1,x.g2,x.n];P[1].mz=[x.vic,x.host];
   if(v==='msa'){x.arm=mk(ARM,1,'up');P[1].sz=[x.arm];}
   baselineA();if(x.arm)API.equipSpell(locateCardAnyV4(x.arm),locateCardAnyV4(x.host),'S03-U476 fixture');return x;},
 start(x){atk(0,x.nin,x.vic);},
 cands:(x,v)=>[x.g1,x.g2].map(c=>c.uid),
 pick:x=>[x.g1.uid],chosen:x=>[x.g1],
 expect:x=>[['the chosen カラクリ兵 was Special Summoned from the Graveyard to P0\'s field in face-up Defense Position',loc(x.g1)==='0:mz'&&posOf(x.g1)==='def'&&faceOf(x.g1)==='up'],['the unchosen カラクリ商人 and the noise stay in the Graveyard',loc(x.g2)==='0:grave'&&loc(x.n)==='0:grave'],['the battle destroyed はにわ',loc(x.vic)==='1:grave']],
 untouched:x=>loc(x.g1)==='0:grave'&&loc(x.g2)==='0:grave'&&loc(x.nin)==='0:mz',
 track:x=>[x.nin,x.g1,x.g2,x.n,x.vic,x.host]},
{key:'GRAPHA',name:'暗黒界の龍神 グラファ',nt:1,vars:['ctl','obe'],
 build(v){fresh(1);const P=gameState.players,x={v};
   x.dd=oppHandDestruction();x.gr=mk('暗黒界の龍神 グラファ',0);x.f1=mon('ゴブリン突撃部隊',1);x.f2=mon('ギガンテス',1);x.prot=v==='obe'?mon(OBE,1):mon('ライオウ',1);
   P[0].hand=[x.gr];P[1].mz=[x.f1,x.f2,x.prot];P[1].hand=[mk('ワイト',1),mk('ワイト',1)];
   baselineA();return x;},
 start(x){duelActivateFromZone(1,'sz',0,{});},
 cands:(x,v)=>v==='ctl'?[x.f1,x.f2,x.prot].map(c=>c.uid):[x.f1,x.f2].map(c=>c.uid),
 pick:x=>[x.f1.uid],chosen:x=>[x.f1],
 expect:x=>[['the chosen ゴブリン突撃部隊 was destroyed',loc(x.f1)==='1:grave'],['the unchosen ギガンテス and the control monster stay on the field',loc(x.f2)==='1:mz'&&loc(x.prot)==='1:mz'],['the discard trigger left グラファ in the Graveyard (the destroy effect, not the Special Summon)',loc(x.gr)==='0:grave']],
 track:x=>[x.gr,x.f1,x.f2,x.prot]},
{key:'GOLD',name:'暗黒界の武神 ゴルド',nt:2,targetCount:2,vars:['ctl','obe'],
 build(v){fresh(1);const P=gameState.players,x={v};
   x.dd=oppHandDestruction();x.gold=mk('暗黒界の武神 ゴルド',0);x.f1=mon('ゴブリン突撃部隊',1);x.f2=mon('ギガンテス',1);x.prot=v==='obe'?mon(OBE,1):mon('ライオウ',1);
   P[0].hand=[x.gold];P[1].mz=[x.f1,x.f2,x.prot];P[1].hand=[mk('ワイト',1),mk('ワイト',1)];
   baselineA();return x;},
 start(x){duelActivateFromZone(1,'sz',0,{});},
 cands:(x,v)=>v==='ctl'?[x.f1,x.f2,x.prot].map(c=>c.uid):[x.f1,x.f2].map(c=>c.uid),
 pick:x=>[x.f1.uid,x.f2.uid],chosen:x=>[x.f1,x.f2],
 expect:x=>[['ゴルド was Special Summoned from the Graveyard to P0\'s field',loc(x.gold)==='0:mz'],['the 2 chosen monsters were destroyed',loc(x.f1)==='1:grave'&&loc(x.f2)==='1:grave'],['the unchosen control monster stays on the field',loc(x.prot)==='1:mz']],
 track:x=>[x.gold,x.f1,x.f2,x.prot]},
];
`;

const first=harness(COMMON+SPECS+String.raw`
globalThis.__SAVES={};
function runSpec(spec,v){
  const x=spec.build(v);SEEN=[];PREFER=spec.pick(x);TARGET_COUNT=spec.targetCount==null?null:spec.targetCount;TOASTS.length=0;
  const j0=V41_ACTION_JOURNAL.length;
  spec.start(x);
  drive(()=>!!linkOf(spec.name));
  const link=linkOf(spec.name);
  let rawLive=null;
  if(link&&link.targets){const rt=deserializeChainSelectionV2(link.targets),want=spec.chosen(x);rawLive=rt.length===want.length&&want.every(c=>rt.some(t=>t&&t.card===c));}
  const mid={link:!!link,chain:gameState.chain.length,uids:link?linkTargetUidsS03(link):[],raw:link&&link.targets?link.targets.length:0,rawLive,
    rt:link?linkTargetUidsS03(JSON.parse(JSON.stringify(gameState.chain))[gameState.chain.indexOf(link)]):[],seen:SEEN.slice()};
  return {x,j0,mid};}
function finish(spec,res){drive();return {types:jtypes(res.j0)};}
const trg=m=>m.seen.filter(s=>s.targeting===true);

for(const spec of SPECS){
  const nm=spec.name;
  ok(nm+': the script declares targets:true',CARD_SCRIPTS[nm].targets===true,String(CARD_SCRIPTS[nm].targets));
  /* ===== 1+3. 正常発動（対照: 耐性なし）===== */
  { const res=runSpec(spec,'ctl'),x=res.x,m=res.mid;
    const tq=trg(m);
    ok(nm+' (ctl): the activation opens a TARGETING choice (filterTargetable applies) and its candidates are exactly the expected cards (control monster offered)',tq.length>=1&&sameSet(tq[tq.length-1].uids,spec.cands(x,'ctl')),JSON.stringify(m.seen));
    if(spec.costFirst){const cq=m.seen.filter(s=>s.selection==='cost');
      ok(nm+' (ctl): the cost choice is a cost selection (no target immunity) and is separate from the target choice',cq.length===1&&cq[0].targeting===false&&m.seen.indexOf(cq[0])<m.seen.indexOf(tq[tq.length-1]),JSON.stringify(m.seen.map(s=>[s.targeting,s.selection])));}
    const want=spec.chosen(x).map(c=>c.uid);
    ok(nm+' (1 target fixed): one chain link with the chosen card(s) recorded by uid ('+spec.nt+') and the stored reference restores to the live card (not a copy)',m.link&&sameSet(m.uids,want)&&m.uids.length===spec.nt&&m.raw===spec.nt&&m.rawLive===true,JSON.stringify({u:m.uids,raw:m.raw,live:m.rawLive}));
    ok(nm+' (1 target fixed): the link survives a JSON round trip with the same target uid(s)',sameSet(m.rt,want),JSON.stringify(m.rt));
    globalThis.__SAVES[spec.key+'_pre']=1;
    // Save/Load: チェーン上（対象確定済み）で保存してから解決する
    const saved=savedRaw(),dg=v41StateDigest(gameState);
    const r=finish(spec,res);
    spec.expect(x).forEach(e=>ok(nm+' (3 normal / U475: the chosen live card is what is affected): '+e[0],e[1]&&gameState.chain.length===0,JSON.stringify(spec.track(x).map(c=>loc(c)))));
    /* noStamp: 表示形式の変更・特殊召喚の Action は engine/1ZG の S03U115_AFFECT_TYPES（発生源を刻む種別の固定リスト）に無いため srcS03 自体が付かない（エンジンの一覧は本単位では触らない）。
       この 2 枚の「対象の確定」は上の uid 確認（リンクの targets と linkTargetUidsS03）が担う。 */
    if(!spec.noStamp) ok(nm+' (1 target fixed): the resolving effect carries the target(s) in its effect source (srcS03.tg)',sameSet(tgOf(res.j0),want),JSON.stringify(tgOf(res.j0)));
    ok(nm+' (ctl): no preparation was aborted and no "not enough cards" notice was shown',r.types.every(t=>t.indexOf('PREP_TX_ABORT')<0)&&TOASTS.indexOf('選択できるカードが足りません')<0,JSON.stringify(r.types.slice(0,10)));
    audit(nm+' (ctl)');
    globalThis.__SAVES[spec.key]=JSON.stringify({raw:saved,digest:dg,final:v41StateDigest(gameState),noStamp:!!spec.noStamp,ids:spec.track(x).map(c=>c.uid),locs:spec.track(x).map(c=>loc(c)+'/'+posOf(c)+'/'+faceOf(c)),want,name:nm}); }
  /* ===== 2. 耐性判定: 候補の位置が 対象にならない モンスター ===== */
  if(spec.vars.indexOf('obe')>=0){ const res=runSpec(spec,'obe'),x=res.x,m=res.mid;
    const tq=trg(m);
    ok(nm+' (2 immunity): オベリスクの巨神兵 is on the field but is NOT among the target candidates; the others are',tq.length>=1&&tq[tq.length-1].uids.indexOf(uidOf(x.prot))<0&&sameSet(tq[tq.length-1].uids,spec.cands(x,'obe')),JSON.stringify(m.seen));
    const cands=API.fieldCards({zone:'mz',filter:y=>y.card===x.prot});
    ok(nm+' (2 immunity): targetableCardsS03 drops オベリスクの巨神兵 for the effect owner',cands.length===1&&API.targetableCardsS03(cands,0).length===0,'');
    const r=finish(spec,res);
    ok(nm+' (2 immunity): the effect resolved on the chosen card and オベリスクの巨神兵 was not touched',gameState.chain.length===0&&loc(x.prot)==='1:mz'&&faceOf(x.prot)==='up',JSON.stringify(spec.track(x).map(c=>loc(c))));
    audit(nm+' (obe)'); }
  /* ===== 2b. 対象にできる候補が無い: 準備が U471 の取り消しで戻る ===== */
  for(const v of ['only','msa']){ if(spec.vars.indexOf(v)<0) continue;
    const x=spec.build(v);SEEN=[];PREFER=spec.pick(x);TOASTS.length=0;const j0=V41_ACTION_JOURNAL.length;
    spec.start(x);drive();
    const types=jtypes(j0);
    ok(nm+' ('+v+', 2 immunity): the only candidate(s) are immune — no choice stays open, no chain link, no target was fixed',!pc()&&gameState.chain.length===0&&!V41_ACTION_JOURNAL.slice(j0).some(e=>e.action.type==='CHAIN_ADD'),JSON.stringify({seen:SEEN.map(s=>[s.title,s.targeting,s.uids.length]),types:types.slice(0,12)}));
    ok(nm+' ('+v+', 2 immunity): the preparation was undone by the U471 transaction (PREP_TX_ABORT:insufficient) and the player was told',types.indexOf('PREP_TX_ABORT_S03:insufficient')>=0&&TOASTS.indexOf('選択できるカードが足りません')>=0,JSON.stringify({types:types.slice(0,12),toasts:TOASTS.slice(0,4)}));
    ok(nm+' ('+v+', 2 immunity): nothing the effect would have affected was touched (the protected card is still where it was)',spec.untouched(x),JSON.stringify(spec.track(x).map(c=>loc(c))));
    audit(nm+' ('+v+')'); }
}
`);

/* ===== VM2: Save/Load（実際の保存・再開の道: saveDuel → 新しい VM → offerResumeDuel）=====
   チェーンに対象確定済みのリンクが載った状態で保存したデータを、新しい VM で読み込んで解決する。
   リンクの対象 uid・srcS03.tg・追跡した全カードの位置/表示形式/表裏・最終ダイジェストが、無中断の VM1 と一致すること。 */
const SAVES=first.__SAVES||{};
const KEYS=['SN','HYP','VICE','STAP','KSAN','KNIN','GRAPHA','GOLD'];
if(KEYS.some(k=>!SAVES[k])){console.log('FAIL Save/Load VM1 saves missing: '+KEYS.filter(k=>!SAVES[k]).join(','));process.exitCode=2;}
else harness('const SAVES='+JSON.stringify(SAVES)+';'+String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function locU(u){const h=findCardByUid(u);return h?(h.p+':'+h.zone+'/'+h.card.pos+'/'+h.card.face):null;}
function step(){
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();return 'evt';}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();return 'summon';}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();return 'chain';}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();return 'point';}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();return 'pump';}
  return null;}
function settle(){for(let i=0;i<600;i++){if(pc()){__choicePickV49(0);continue;}if(!step())return 'idle';}return 'loop';}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function tgOf(j0){const s=new Set();V41_ACTION_JOURNAL.slice(j0).forEach(e=>{const t=e.action.srcS03&&e.action.srcS03.tg;if(t&&t.length)t.forEach(u=>s.add(u));});return [...s];}
function sameSet(a,b){return JSON.stringify(a.slice().sort())===JSON.stringify(b.slice().sort());}
for(const key of ['SN','HYP','VICE','STAP','KSAN','KNIN','GRAPHA','GOLD']){
  const o=JSON.parse(SAVES[key]);
  resetA();localStorage.setItem(DUEL_SAVE_KEY,o.raw);const resumed=offerResumeDuel();
  const link=gameState.chain.find(l=>l.name===o.name);
  ok('Save/Load '+key+' ('+o.name+'): resumed with the link on the chain and the digest equal to the saved one',!!resumed&&!!link&&v41StateDigest(gameState)===o.digest,JSON.stringify({resumed,chain:gameState.chain.map(l=>l.name)}));
  ok('Save/Load '+key+' resumed: the target(s) on the loaded link are still the chosen card(s) (uid), and the effect-source target set is rebuilt from them',!!link&&sameSet(linkTargetUidsS03(link),o.want)&&linkTargetUidsS03(link).length===o.want.length,JSON.stringify(link&&linkTargetUidsS03(link)));
  /* 暗黒界の武神 ゴルド / 暗黒界の龍神 グラファ: 既存の別の不具合（本単位は直さない。docs/S03_U476_REPORT.md）— 読み込み後のチェーンリンクの event.card は複製で、
     darkWorldDiscard(ctx)（cards/20）が同一性 (ev.card !== ctx.card) で比べるため、再開後の解決は「捨てられた時の破壊」ではなく墓地からの蘇生側に落ちる（基点でも同じ）。
     そのため、この 2 枚は「再開後もリンクが対象の uid を保っていること」までを確かめ、再開後の解決の結果は固定しない（欠陥を期待値にしない）。 */
  if(key==='GRAPHA'||key==='GOLD'){ audit('Save/Load '+key+' (loaded, not resolved)'); continue; }
  const j0=V41_ACTION_JOURNAL.length;settle();
  if(!o.noStamp) ok('Save/Load '+key+' resumed: the resolution carries the target(s) in the effect source (srcS03.tg) after the resume',sameSet(tgOf(j0),o.want),JSON.stringify(tgOf(j0)));
  ok('Save/Load '+key+' resumed: every tracked card ends where it ended in the uninterrupted VM1 run (location / position / face)',JSON.stringify(o.ids.map(u=>locU(u)))===JSON.stringify(o.locs),JSON.stringify({vm2:o.ids.map(u=>locU(u)),vm1:o.locs}));
  ok('Save/Load '+key+' resumed: the chain is empty and the final digest equals the uninterrupted VM1 run',gameState.chain.length===0&&v41StateDigest(gameState)===o.final,v41StateDigest(gameState)+' vs '+o.final);
  audit('Save/Load '+key);
}
`);

/* ===== audit pin: 同じ導出を再実行して、未分類の候補が無いことを固定する =====
   導出: 実行時の CARD_SCRIPTS を走査し、selectTargets（発動準備の対象選択の道）が選択に到達し targets !== true のスクリプトを集める。
   「選択に到達」= 本文が selectCard / requestChoice* / p11cOpen / ca3Open を呼ぶ、または、それらを（推移的に）呼ぶグローバル関数を呼ぶ。
   カラクリの共通条項（HM_claude_s03_u116）は元の selectTargets を closure（origSelect）で包むので、本文に origSelect を含むものも候補に数える。
   P1.1（activationV11）・解決時（resolve）・コスト（cost）の選択はこの道の外（docs/S03_U476_REPORT.md に別に集計）。 */
harness(String.raw`
const names=Object.getOwnPropertyNames(globalThis);
const esc=s=>s.replace(/[.*+?^$\{\}()|[\]\\]/g,'\\$&');
const SELRE=/\bselectCard\s*\(|\brequestChoice\w*\s*\(|\bp11cOpen\s*\(|\bca3Open\s*\(/;
const fsrc={};
for(const n of names){ let f; try{f=globalThis[n];}catch(e){continue;} if(typeof f!=='function'||/^(API|Object|Array|Function)$/.test(n))continue; let s; try{s=Function.prototype.toString.call(f);}catch(e){continue;} fsrc[n]=s; }
const helpers=new Set();
for(const n in fsrc){ if(SELRE.test(fsrc[n]) && !/^(selectCard|requestChoiceV49|requestChoice)$/.test(n)) helpers.add(n); }
const hre={};function hreOf(h){ return hre[h]||(hre[h]=new RegExp('\\b'+esc(h)+'\\s*\\(')); }
let ch=true,it=0;
while(ch&&it++<8){ch=false; for(const n in fsrc){ if(helpers.has(n))continue; for(const h of helpers){ if(fsrc[n].indexOf(h)>=0 && hreOf(h).test(fsrc[n])){helpers.add(n);ch=true;break;} } } }
const hl=[...helpers];
function reaches(src){ if(SELRE.test(src)||/origSelect/.test(src)) return true; for(const h of hl){ if(src.indexOf(h)>=0 && hreOf(h).test(src)) return true; } return false; }
const cand=[];let total=0;
for(const name of Object.keys(CARD_SCRIPTS)){ total++;
  const sc=CARD_SCRIPTS[name];
  if(sc.targets===true||typeof sc.selectTargets!=='function') continue;
  if(reaches(Function.prototype.toString.call(sc.selectTargets))) cand.push(name);
}
cand.sort();
const NONTARGET=['ライトニング・ボルテックス','ダーク・グレファー','ゾンビキャリア','オネスト','ローンファイア・ブロッサム','ワン・フォー・ワン','血の代償','グリーン・ガジェット','レッド・ガジェット','イエロー・ガジェット','TG カタパルト・ドラゴン','歯車街','No.16 色の支配者ショック・ルーラー','調律','E－エマージェンシーコール','神の居城－ヴァルハラ','レスキューラビット','ジュラック・グアイバ','墓守の偵察者','BF－月影のカルート','BF－蒼炎のシュラ','黒い旋風','真六武衆－カゲキ','紫炎の狼煙','紫炎の足軽','E・HERO フォレストマン','ジュラック・ヴェロー','シャドウ・リチュア','ハーピィ・クィーン','ワンハンドレッド・アイ・ドラゴン','ヴァイロン・エレメント','カラクリ商人 壱七七','カラクリ兵 弐参六'];
/* S03-U478: 保留していた複数対象 3 枚のうち、固定 2 枚の 墓守の石版 / 無欲な壺 は targets:true と targetCount:2 を宣言した。
   S03-U480: 残る 霊滅術師 カイクウ も targets:true + targetCountRange:[1,2] へ移行した。 */
const DECLARED_U478=['墓守の石版','無欲な壺'];
const DECLARED_U480=['霊滅術師 カイクウ'];
const OPEN=['暗黒界の術師 スノウ'];
const FIXED=['スノーマンイーター','マスター・ヒュペリオン','万力魔神バイサー・デス','D・ステープラン','カラクリ参謀 弐四八','カラクリ忍者 九壱九','暗黒界の龍神 グラファ','暗黒界の武神 ゴルド'];
const classified=NONTARGET.concat(OPEN).sort();
const un=cand.filter(n=>classified.indexOf(n)<0), stale=classified.filter(n=>cand.indexOf(n)<0);
ok('audit pin: '+total+' scripts scanned; every script whose selectTargets opens a card selection without targets:true is classified (none unclassified: a new one must be triaged by its 1103 text — declare targets:true or add it to the audited list)',un.length===0,JSON.stringify(un));
ok('audit pin: no classified name has gone stale (each audited candidate still opens a selection without targets:true)',stale.length===0,JSON.stringify(stale));
ok('audit pin: the 8 fixed cards and U480 カイクウ are no longer candidates; the classified remainder is exactly 34 = 33 non-targeting + 1 open resolution-time selection',FIXED.every(n=>CARD_SCRIPTS[n].targets===true&&cand.indexOf(n)<0)&&DECLARED_U480.every(n=>CARD_SCRIPTS[n].targets===true&&cand.indexOf(n)<0)&&cand.length===34&&NONTARGET.length===33&&OPEN.length===1,JSON.stringify({cand:cand.length,fixed:FIXED.map(n=>CARD_SCRIPTS[n].targets),open:OPEN}));
ok('audit pin (S03-U478): 墓守の石版 / 無欲な壺 are no longer candidates — each declares targets:true AND targetCount:2 (a name + count pair; the U472 guard pins the same pairs)',DECLARED_U478.every(n=>CARD_SCRIPTS[n].targets===true&&CARD_SCRIPTS[n].targetCount===2&&cand.indexOf(n)<0),JSON.stringify(DECLARED_U478.map(n=>[CARD_SCRIPTS[n].targets,CARD_SCRIPTS[n].targetCount])));
ok('audit pin (S03-U480): 霊滅術師 カイクウ declares targets:true and range [1,2], never a hardcoded targetCount:2',DECLARED_U480.every(n=>CARD_SCRIPTS[n].targets===true&&JSON.stringify(CARD_SCRIPTS[n].targetCountRange)==='[1,2]'&&CARD_SCRIPTS[n].targetCount==null),JSON.stringify(DECLARED_U480.map(n=>[CARD_SCRIPTS[n].targets,CARD_SCRIPTS[n].targetCountRange,CARD_SCRIPTS[n].targetCount])));
`);
