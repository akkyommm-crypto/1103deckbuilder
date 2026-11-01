/* S03-U478: 固定 2 枚を対象にする 3 枚（墓守の石版 / 無欲な壺 / ガスタのつむじ風）に targets:true と targetCount:2 を宣言する。
   背景: S03-U476 は、この 3 枚に targets:true だけを足すと メタルシルバー・アーマー がこれらを「単体対象」と誤って制限するため保留した。
   正しい形は 対象であること（targets:true）＋ 対象の枚数（targetCount:2、engine/1ZZR の effectInfo.targetCount / targetsMultiple。アーマーの
   immuneToTarget / immuneToTargetOffField だけが読む）の両方を宣言すること。ガスタのつむじ風は P1.1（activationV11）の道なので、さらに p11cOpen の選択へ targeting:true を足す。
   カード文（data/carddata.json の e）による枚数: 墓守の石版「墓地の『墓守の』モンスター2体を選択して手札に加える」＝2 /
     無欲な壺「自分または相手の墓地に存在するカードを合計2枚選択し、持ち主のデッキに戻す」＝合計 2 /
     ガスタのつむじ風「自分の墓地の『ガスタ』モンスター2体を選択してデッキに戻す。その後、デッキから…1体を特殊召喚」＝対象 2（特殊召喚するカードは選択して対象にするのではない）。
   裁定（wiki-rulings.js）: WIKI-75BD27DD876A（墓守の石版, answerDate 2009-11-26）「はい、対象を取ります」/ WIKI-E963579D7337（無欲な壺, 2009-11-26）「対象を取る効果ですので、発動時になります」/
     ガスタのつむじ風は WIKI-A7D8467EA203（2011-04-27）が「効果解決時に対象に選択した墓地のモンスター…」と述べる（対象を取る前提。個別の「対象を取る」の回答は無く、文言と 1103 の「選択して」の運用が根拠）。
   メタルシルバー・アーマーの複数対象の例外は「裁定の一般的な回答文に基づく Codex の採用解釈」（WIKI-32A7C5F81B06, 2009-06-18。S03-U472）。墓地を対象にする複数対象にも同じ文を当てる。
   固定する面（S03-U473 / U476 と同じ基準）:
     1. 対象の確定 — 選んだ 2 枚がチェーンリンクの targets に uid で記録され、JSON 往復でも残り、解決の発生源（srcS03.tg）にも載る。
     2. 耐性判定 — メタルシルバー・アーマーの下で、装備モンスター以外のモンスター（墓地）も 2 枚選べる（複数対象の例外）。対照: 他の対象耐性の発生源（このテストの中だけで足す合成の墓地保護）は例外の影響を受けず、
        保護されたカードは選べない。全部が保護されていれば準備は U471 の取り消しで戻る。単体対象のカード（強制脱出装置 / リビングデッドの呼び声）はアーマーで制限されたまま（例外が漏れていない）。
     3. 正常発動 — 発動 → 対象選択 → 解決が最後まで通り、選んだ「実カード」(uid) が動く（S03-U475: チェーンを通った選択が複製になり何も動かない欠陥が起きない）。
     4. Replay 監査と Save/Load（saveDuel → 新 VM → offerResumeDuel）。 */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
const ARM='メタルシルバー・アーマー';
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
let PREFER=[],SEEN=[];
/* 選択: min1/max1 は PREFER の先頭に合う候補（無ければ先頭）。複数選択（max>1）は PREFER に合う候補を全て答える。各選択の時点の effectInfo（宣言）と形（min/max/targeting）を残す */
function pick(){
  const q=pc();const info=targetEffectSourceS03(1);
  SEEN.push({title:q.title,min:q.min,max:q.max,targeting:q.targeting,selection:q.selection,kind:q.kind,uids:q.candidates.map(c=>c.uid),tc:info.targetCount,tm:info.targetsMultiple});
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
function drive(until){for(let i=0;i<900;i++){
  if(until&&!pc()&&until())return 'until';
  if(pc()){pick();continue;}
  if(!step())return 'idle';}return 'loop';}
function linkOf(name){return gameState.chain.find(l=>l.name===name)||null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;gameState.activePlayer=1;gameState.firstPlayer=0;gameState.turn=6;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4780001;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function savedRaw(){saveDuel();return localStorage.getItem(DUEL_SAVE_KEY);}
function tgOf(j0){const s=new Set();V41_ACTION_JOURNAL.slice(j0).forEach(e=>{const t=e.action.srcS03&&e.action.srcS03.tg;if(t&&t.length)t.forEach(u=>s.add(u));});return [...s];}
/* 他の対象耐性の発生源（合成）: このテストの中だけ、ホルスのしもべ のスクリプトに墓地・除外向けの immuneToTargetOffField を一時的に足し、
   __SYN.fn(card) が真のカードを「効果の対象にできない」ことにする（アーマーとは別の発生源。実カードで墓地の対象耐性を持つのはアーマーだけ）。使い終わったら外す。 */
const __SYN={fn:null,had:undefined};
function synOn(fn){const sc=CARD_SCRIPTS['ホルスのしもべ'];__SYN.fn=fn;__SYN.had=sc.continuous.immuneToTargetOffField;sc.continuous.immuneToTargetOffField=function(card){return !!__SYN.fn&&!!__SYN.fn(card);};}
function synOff(){const sc=CARD_SCRIPTS['ホルスのしもべ'];if(__SYN.had===undefined)delete sc.continuous.immuneToTargetOffField;else sc.continuous.immuneToTargetOffField=__SYN.had;__SYN.fn=null;}
`;

/* ---- カード別の仕様 ----
   v: 'ctl'（アーマー無し）/ 'msa'（アーマー: 墓地の全モンスターが保護される。複数対象の例外で選べる）/ 'syn'（アーマー＋合成の他の発生源で 1 枚だけ保護）/ 'all'（アーマー＋合成の他の発生源で全モンスター保護）
   build(v): 盤面を作る。start(x): 発動。 cands(x,v): 選択の候補として期待する uid（1 回目）。 pick(x,v): 選ぶ順。 chosen(x,v): チェーンリンクの対象。 expect(x,v): 解決後の期待。
   syn(x): 合成の保護で守るカード。untouched(x): 取り消し後の期待。track(x): 追跡するカード（Save/Load で位置を比べる）。 */
const SPECS=String.raw`
function board(v,x){const P=gameState.players;
  x.host=mon('サイバー・ドラゴン',0);x.oth=mon('ライオウ',0);P[0].mz=[x.host,x.oth];
  if(v==='msa'||v==='syn'||v==='all'){x.arm=mk(ARM,0,'up');P[0].sz=[x.arm];}
  if(v==='syn'||v==='all'){x.hor=mon('ホルスのしもべ',0);P[0].mz.push(x.hor);}
}
function equipArm(x){if(x.arm)API.equipSpell(locateCardAnyV4(x.arm),locateCardAnyV4(x.host),'S03-U478 fixture');}
const SPECS=[
/* ---- 墓守の石版: 自分の墓地の「墓守の」モンスター2体を選択して手札に加える（2 回の min1/max1 の選択） ---- */
{key:'TOMB',name:'墓守の石版',vars:['ctl','msa','syn','all'],
 build(v){fresh();const P=gameState.players,x={v};board(v,x);
   x.g1=mk('墓守の番兵',1);x.g2=mk('墓守の偵察者',1);x.g3=mk('墓守の末裔',1);x.n=mk('ワイト',1);x.card=mk('墓守の石版',1);
   P[1].grave=[x.g1,x.g2,x.g3,x.n];P[1].hand=[x.card];baselineA();equipArm(x);return x;},
 start(x){duelActivateFromHand(0);},
 syn(x,v){return v==='all'?null:x.g3;},                    /* 'syn' は 墓守の末裔 だけ、'all' は全モンスター */
 cands(x,v){return v==='syn'?[x.g1,x.g2].map(c=>c.uid):[x.g1,x.g2,x.g3].map(c=>c.uid);},
 pick:x=>[x.g1.uid,x.g2.uid],chosen:x=>[x.g1,x.g2],
 expect:x=>[['both chosen 墓守 monsters went to the hand',loc(x.g1)==='1:hand'&&loc(x.g2)==='1:hand'],['the unchosen 墓守の末裔 and the non-墓守 monster stay in the Graveyard',loc(x.g3)==='1:grave'&&loc(x.n)==='1:grave'],['墓守の石版 is in the Graveyard',loc(x.card)==='1:grave']],
 untouched:x=>loc(x.g1)==='1:grave'&&loc(x.g2)==='1:grave'&&loc(x.g3)==='1:grave'&&loc(x.card)==='1:hand',
 track:x=>[x.g1,x.g2,x.g3,x.n,x.card]},
/* ---- 無欲な壺: 自分または相手の墓地のカードを合計2枚選択し持ち主のデッキに戻す。発動後は除外（2 回の min1/max1 の選択。両方の墓地が候補） ---- */
{key:'GREED',name:'無欲な壺',vars:['ctl','msa','syn','all'],
 build(v){fresh();const P=gameState.players,x={v};board(v,x);
   x.a=mk('墓守の番兵',1);x.s=mk('サイクロン',1);x.b=mk('ゴブリン突撃部隊',0);x.c=mk('ワイト',0);x.card=mk('無欲な壺',1);
   P[1].grave=[x.a,x.s];P[0].grave=[x.b,x.c];P[1].hand=[x.card];baselineA();equipArm(x);return x;},
 start(x){duelActivateFromHand(0);},
 syn(x,v){return v==='all'?null:x.c;},                     /* 'syn' は P0 墓地のワイトだけ、'all' は全モンスター（サイクロンは魔法なので残る） */
 cands(x,v){return v==='syn'?[x.a,x.s,x.b].map(c=>c.uid):[x.a,x.s,x.b,x.c].map(c=>c.uid);},
 pick:x=>[x.a.uid,x.b.uid],chosen:x=>[x.a,x.b],
 expect:x=>[['each chosen card went back to its OWNER\'s Deck (P1\'s 墓守の番兵 to P1, P0\'s ゴブリン突撃部隊 to P0)',loc(x.a)==='1:deck'&&loc(x.b)==='0:deck'],['the unchosen cards stay in their Graveyards (サイクロン 1:grave, ワイト 0:grave)',loc(x.s)==='1:grave'&&loc(x.c)==='0:grave'],['無欲な壺 was banished after its activation (not sent to the Graveyard)',loc(x.card)==='1:banish']],
 untouched:x=>loc(x.a)==='1:grave'&&loc(x.b)==='0:grave'&&loc(x.s)==='1:grave'&&loc(x.card)==='1:hand',
 track:x=>[x.a,x.s,x.b,x.c,x.card]},
/* ---- ガスタのつむじ風（P1.1 / activationV11）: 自分の墓地のガスタ2体を選択してデッキに戻す（1 回の min2/max2 の選択）→ デッキから守備力1000以下のガスタ1体を特殊召喚 ---- */
{key:'GUSTA',name:'ガスタのつむじ風',vars:['ctl','msa','syn','all'],set:true,p11:true,
 build(v){fresh();const P=gameState.players,x={v};board(v,x);
   x.g1=mk('ガスタの神官 ムスト',1);x.g2=mk('ガスタ・イグル',1);x.g3=mk('ガスタ・ガルド',1);x.n=mk('ワイト',1);x.sum=mk('ガスタの巫女 ウィンダ',1);
   x.card=mk('ガスタのつむじ風',1,'down');x.card.setTurn=gameState.turn-1;
   P[1].grave=[x.g1,x.g2,x.g3,x.n];P[1].deck.push(x.sum);P[1].sz=[x.card];baselineA();equipArm(x);return x;},
 start(x){duelActivateFromZone(1,'sz',0,{});},
 syn(x,v){return v==='all'?null:x.g3;},
 cands(x,v){return v==='syn'?[x.g1,x.g2].map(c=>c.uid):[x.g1,x.g2,x.g3].map(c=>c.uid);},
 pick:x=>[x.sum.uid,x.g1.uid,x.g2.uid],chosen:x=>[x.g1,x.g2],
 expect:x=>[['both chosen ガスタ went back to the Deck (the Deck is shuffled, then the summon choice resolves)',loc(x.g1)==='1:deck'&&loc(x.g2)==='1:deck'],['ガスタの巫女 ウィンダ (DEF 400) from the Deck was Special Summoned in face-up Defense Position',loc(x.sum)==='1:mz'&&posOf(x.sum)==='def'&&faceOf(x.sum)==='up'],['the unchosen ガスタ・ガルド and the non-ガスタ monster stay in the Graveyard',loc(x.g3)==='1:grave'&&loc(x.n)==='1:grave'],['ガスタのつむじ風 is in the Graveyard',loc(x.card)==='1:grave']],
 untouched:x=>loc(x.g1)==='1:grave'&&loc(x.g2)==='1:grave'&&loc(x.g3)==='1:grave'&&loc(x.sum)==='1:deck'&&loc(x.card)==='1:sz',
 track:x=>[x.g1,x.g2,x.g3,x.n,x.sum,x.card]},
];
`;

const first=harness(COMMON+SPECS+String.raw`
globalThis.__SAVES={};
const EXPECT_COUNT={'墓守の石版':2,'無欲な壺':2,'ガスタのつむじ風':2};

/* ===== 0. 宣言の面（engine/1ZZR）: 3 枚が targets:true と targetCount:2 を宣言し、effectInfo に出る ===== */
for(const nm of Object.keys(EXPECT_COUNT)){
  const sc=CARD_SCRIPTS[nm],info=targetEffectSourceS03(1,{name:nm});
  ok('declaration: '+nm+' declares targets:true and targetCount '+EXPECT_COUNT[nm]+'; effectInfo.targetCount '+EXPECT_COUNT[nm]+' / targetsMultiple true',sc&&sc.targets===true&&sc.targetCount===EXPECT_COUNT[nm]&&info.targetCount===EXPECT_COUNT[nm]&&info.targetsMultiple===true,JSON.stringify({t:sc&&sc.targets,c:sc&&sc.targetCount,i:info.targetCount,m:info.targetsMultiple}));
}
ok('declaration (P1.1): ガスタのつむじ風 is a P1.1 script (activationV11) — no legacy selectTargets',typeof CARD_SCRIPTS['ガスタのつむじ風'].activationV11==='function'&&typeof CARD_SCRIPTS['ガスタのつむじ風'].selectTargets!=='function','');
ok('declaration (legacy path): 墓守の石版 / 無欲な壺 open their target choices from selectTargets (not P1.1)',['墓守の石版','無欲な壺'].every(n=>typeof CARD_SCRIPTS[n].selectTargets==='function'&&typeof CARD_SCRIPTS[n].activationV11!=='function'),'');
/* 単体対象のカードは宣言なし（例外が漏れていない） */
ok('declaration: single-target cards declare no targetCount (強制脱出装置 / リビングデッドの呼び声): null / not multiple',['強制脱出装置','リビングデッドの呼び声'].every(n=>CARD_SCRIPTS[n].targetCount===undefined&&targetEffectSourceS03(1,{name:n}).targetCount===null&&targetEffectSourceS03(1,{name:n}).targetsMultiple===false),'');

function runSpec(spec,v,synfn){
  const x=spec.build(v);SEEN=[];PREFER=spec.pick(x,v);TOASTS.length=0;
  if(synfn){const sc=spec.syn(x,v);synOn(sc?(c=>c===sc):(c=>dbOf(c).k==='m'));}
  const j0=V41_ACTION_JOURNAL.length;
  spec.start(x);
  drive(()=>!!linkOf(spec.name));
  const link=linkOf(spec.name);
  let rawLive=null;
  if(link&&link.targets){const rt=deserializeChainSelectionV2(link.targets),want=spec.chosen(x,v);rawLive=rt.length===want.length&&want.every(c=>rt.some(t=>t&&t.card===c));}
  const mid={link:!!link,chain:gameState.chain.length,uids:link?linkTargetUidsS03(link):[],raw:link&&link.targets?link.targets.length:0,rawLive,
    rt:link?linkTargetUidsS03(JSON.parse(JSON.stringify(gameState.chain))[gameState.chain.indexOf(link)]):[],seen:SEEN.slice()};
  return {x,j0,mid};}
function finish(res){drive();return {types:jtypes(res.j0)};}
const trg=m=>m.seen.filter(s=>s.targeting===true);

for(const spec of SPECS){
  const nm=spec.name;
  /* ===== 1+3+4. アーマー無し（ctl）とアーマー下（msa）: 対象の確定 → 正常発動 → Replay / Save-Load ===== */
  for(const v of ['ctl','msa']){
    const res=runSpec(spec,v,false),x=res.x,m=res.mid,tq=trg(m),tag=nm+' ('+v+')';
    /* 石版・無欲な壺（レガシー経路）: 1 枚ずつ 2 回の min1/max1 の選択で、どちらも targeting。ガスタのつむじ風（P1.1）: 1 回の min2/max2 の選択。
       P1.1 は activationV11 の呼び出し前に発動準備の控え（ACTIVATION_PREP_S03）が外れる（engine/30:1514）ので、選択の時点では targetCount を effectInfo から読めない。
       そのためつむじ風は候補を自分の宣言（明示 effectInfo）で filterTargetable に通してから開く（targeting フラグは立てない）。それが効いていることを下の「候補」の assertion が示す。 */
    const sel=spec.p11?m.seen:tq;
    ok(tag+': the target choice has the expected shape — '+(spec.p11?'ONE choice of min 2 / max 2':'TWO choices of min 1 / max 1, each TARGETING (filterTargetable applies)'),spec.p11?(sel.length===1&&sel[0].min===2&&sel[0].max===2):(sel.length===2&&sel.every(s=>s.min===1&&s.max===1&&s.targeting===true)),JSON.stringify(m.seen.map(s=>[s.title,s.min,s.max,s.targeting])));
    if(!spec.p11)ok(tag+': the effect declares 2 targets at every selection (targetCount 2 / targetsMultiple) — the min/max shape of the choice does not decide it',sel.length>=1&&sel.every(s=>s.tc===2&&s.tm===true),JSON.stringify(sel.map(s=>[s.tc,s.tm,s.min,s.max])));
    ok(tag+': the first target choice offers exactly the expected cards'+(v==='msa'?' — the Armor-protected Graveyard monsters ARE offered (multi-target exception)':''),sel.length>=1&&sameSet(sel[0].uids,spec.cands(x,v)),JSON.stringify(sel.map(s=>s.uids)));
    const want=spec.chosen(x,v).map(c=>c.uid);
    ok(tag+' (1 targets fixed): one chain link holds the 2 chosen cards by uid and the link has 2 stored targets',m.link&&m.chain===1&&sameSet(m.uids,want)&&m.uids.length===2&&m.raw===2,JSON.stringify({u:m.uids,raw:m.raw,chain:m.chain}));
    ok(tag+' (1 targets fixed / U475): the stored references restore to the LIVE cards, not copies',m.rawLive===true,JSON.stringify({live:m.rawLive}));
    ok(tag+' (1 targets fixed): the link survives a JSON round trip with the same 2 target uids',sameSet(m.rt,want)&&m.rt.length===2,JSON.stringify(m.rt));
    const saved=savedRaw(),dg=v41StateDigest(gameState);
    const r=finish(res);
    spec.expect(x,v).forEach(e=>ok(tag+' (3 normal / U475: the chosen live cards are what move): '+e[0],e[1]&&gameState.chain.length===0,JSON.stringify(spec.track(x).map(c=>loc(c)))));
    ok(tag+' (1 targets fixed): the resolving effect carries the 2 targets in its effect source (srcS03.tg)',sameSet(tgOf(res.j0),want),JSON.stringify(tgOf(res.j0)));
    ok(tag+': no preparation was aborted and no "not enough cards" notice was shown',r.types.every(t=>t.indexOf('PREP_TX_ABORT')<0)&&TOASTS.indexOf('選択できるカードが足りません')<0,JSON.stringify(r.types.slice(0,10)));
    audit(tag);
    globalThis.__SAVES[spec.key+'_'+v]=JSON.stringify({prefer:spec.pick(x,v),raw:saved,digest:dg,final:v41StateDigest(gameState),ids:spec.track(x).map(c=>c.uid),locs:spec.track(x).map(c=>loc(c)+'/'+posOf(c)+'/'+faceOf(c)),want,name:nm});
  }
  /* ===== 2. 耐性判定: アーマー＋他の発生源（合成）が 1 枚だけ保護 → そのカードは選べず、他の候補はアーマーの例外で選べる ===== */
  { const res=runSpec(spec,'syn',true),x=res.x,m=res.mid,tq=trg(m),prot=spec.syn(x,'syn'),tag=nm+' (syn)';
    const sq=spec.p11?m.seen:tq;
    ok(tag+' (2 immunity): the card protected by ANOTHER immunity source is NOT a candidate (the Armor exemption does not relax it); the rest are offered',sq.length>=1&&sq[0].uids.indexOf(prot.uid)<0&&sameSet(sq[0].uids,spec.cands(x,'syn')),JSON.stringify({seen:sq.map(s=>s.uids),prot:prot.uid}));
    const gy=[0,1].reduce((q,p)=>q.concat(API.pileCards(p,'grave')),[]),ei=targetEffectSourceS03(1,{name:nm}),eiSingle=targetEffectSourceS03(1,{name:'強制脱出装置'});
    ok(tag+' (2 immunity): filterTargetable with the declared effectInfo (targetCount 2) drops the card protected by the other source and keeps an unprotected one; with a single-target effectInfo the Armor protects them all',
      filterTargetable(gy.filter(y=>y.card===prot),1,ei).length===0&&filterTargetable(gy.filter(y=>y.card===(x.g1||x.a)),1,ei).length===1&&filterTargetable(gy.filter(y=>y.card===(x.g1||x.a)),1,eiSingle).length===0,JSON.stringify({ei:ei.targetCount,single:eiSingle.targetCount}));
    const r=finish(res);
    synOff();
    spec.expect(x,'syn').forEach(e=>ok(tag+' (2 immunity / 3 normal): '+e[0],e[1]&&gameState.chain.length===0,JSON.stringify(spec.track(x).map(c=>loc(c)))));
    ok(tag+' (2 immunity): the link holds exactly the 2 chosen unprotected cards and the protected card was never a target',sameSet(res.mid.uids,spec.chosen(x,'syn').map(c=>c.uid))&&res.mid.uids.indexOf(prot.uid)<0,JSON.stringify(res.mid.uids));
    audit(tag); }
  /* ===== 2b. 全モンスターが他の発生源で保護: 準備が U471 の取り消しで戻る ===== */
  { const x=spec.build('all');SEEN=[];PREFER=spec.pick(x,'all');TOASTS.length=0;synOn(c=>dbOf(c).k==='m');const j0=V41_ACTION_JOURNAL.length;
    spec.start(x);drive();const types=jtypes(j0);synOff();const tag=nm+' (all)';
    ok(tag+' (2 immunity): every Graveyard monster is protected by another source — no choice stays open, no chain link, no target was fixed',!pc()&&gameState.chain.length===0&&!V41_ACTION_JOURNAL.slice(j0).some(e=>e.action.type==='CHAIN_ADD'),JSON.stringify({seen:SEEN.map(s=>[s.title,s.targeting,s.uids.length]),types:types.slice(0,12)}));
    /* 中止の理由: レガシー経路は PREP_TX_ABORT:insufficient、P1.1 は abortPreparedActivationV11 経由の PREP_TX_ABORT:p11-abort（どちらも U471 のトランザクションが発動前へ戻す） */
    ok(tag+' (2 immunity): the preparation was undone by the U471 transaction ('+(spec.p11?'PREP_TX_ABORT:p11-abort':'PREP_TX_ABORT:insufficient')+') and the player was told',types.indexOf(spec.p11?'PREP_TX_ABORT_S03:p11-abort':'PREP_TX_ABORT_S03:insufficient')>=0&&TOASTS.indexOf('選択できるカードが足りません')>=0,JSON.stringify({types:types.slice(0,12),toasts:TOASTS.slice(0,4)}));
    ok(tag+' (2 immunity): nothing was touched — the cards are where they were and the activated card is back in hand / the Spell & Trap Zone',spec.untouched(x),JSON.stringify(spec.track(x).map(c=>loc(c))));
    audit(tag); }
}

/* ===== 5. 裁定の回帰ピン: 選んだ 2 枚のうち 1 枚が解決時に墓地から無くなった場合（targets:true の宣言がこの挙動を変えていないこと）===== */
{ const run=(key)=>{const spec=SPECS.find(s=>s.key===key),x=spec.build('ctl');SEEN=[];PREFER=spec.pick(x,'ctl');spec.start(x);drive(()=>!!linkOf(spec.name));
    const first=spec.chosen(x,'ctl')[0];API.banish(findCardByUid(first.uid),'S03-U478 fixture');drive();return {x,first};};
  { const {x,first}=run('TOMB');
    ok('WIKI-A195DBDAF3D1 (墓守の石版, 2009-12-23「残りの１体を手札に加えます」): when one of the two selected 墓守 is gone at resolution, the other is still added to the hand',loc(first)==='1:banish'&&loc(x.g2)==='1:hand'&&loc(x.card)==='1:grave'&&gameState.chain.length===0,JSON.stringify([loc(first),loc(x.g2),loc(x.card)])); audit('ruling pin 墓守の石版'); }
  { const {x,first}=run('GUSTA');
    ok('WIKI-A7D8467EA203 (ガスタのつむじ風, 2011-04-27「２枚とも、もしくは１枚しか存在しない場合、デッキに戻す処理を行わず、特殊召喚もできません」): when only one of the two selected ガスタ remains, nothing returns to the Deck and nothing is Special Summoned',loc(first)==='1:banish'&&loc(x.g2)==='1:grave'&&loc(x.sum)==='1:deck'&&loc(x.card)==='1:grave'&&gameState.chain.length===0,JSON.stringify([loc(first),loc(x.g2),loc(x.sum),loc(x.card)])); audit('ruling pin ガスタのつむじ風'); }
}

/* ===== 6. 単体対象の対照: アーマーは単体対象を制限したまま（この単位の宣言で例外が漏れていない）===== */
{ fresh();const P=gameState.players,x={};board('msa',x);x.beast=mon('ジェネティック・ワーウルフ',1);P[1].mz=[x.beast];
  x.esc=mk('強制脱出装置',1,'down');x.esc.setTurn=gameState.turn-1;P[1].sz=[x.esc];baselineA();equipArm(x);
  SEEN=[];PREFER=[x.oth.uid,x.host.uid];TOASTS.length=0;duelActivateFromZone(1,'sz',0,{});drive(()=>!!linkOf('強制脱出装置'));
  const tq=trg({seen:SEEN.slice()});
  ok('CONTROL 強制脱出装置 (single target) under the Armor: ONE targeting choice, targetCount null — only the equipped monster is offered (every other monster is protected)',tq.length===1&&tq[0].tc===null&&tq[0].tm===false&&sameSet(tq[0].uids,[x.host.uid]),JSON.stringify(tq.map(s=>[s.uids,s.tc,s.tm])));
  drive();ok('CONTROL 強制脱出装置: it resolved on the equipped monster (returned to the hand); the protected ライオウ stayed',loc(x.host)==='0:hand'&&loc(x.oth)==='0:mz',JSON.stringify([loc(x.host),loc(x.oth)]));audit('CONTROL 強制脱出装置'); }
{ fresh();const P=gameState.players,x={};board('msa',x);P[1].grave=[mk('ライオウ',1),mk('クリッター',1)];
  x.card=mk('リビングデッドの呼び声',1,'down');x.card.setTurn=gameState.turn-1;P[1].sz=[x.card];baselineA();equipArm(x);
  const D0=v41StateDigest(gameState);const ids=getLegalZoneActions(1,'sz',0).map(a=>a.id);
  ok('CONTROL リビングデッドの呼び声 (single Graveyard target) under the Armor is still refused up front — not offered, nothing changed',ids.indexOf('activateSet')<0&&v41StateDigest(gameState)===D0,JSON.stringify(ids)); }
`);

/* ===== VM2: Save/Load（実際の保存・再開の道: saveDuel → 新しい VM → offerResumeDuel）=====
   チェーンに対象確定済みのリンクが載った状態で保存したデータを、新しい VM で読み込んで解決する。
   リンクの対象 uid・srcS03.tg・追跡した全カードの位置/表示形式/表裏・最終ダイジェストが、無中断の VM1 と一致すること。 */
const SAVES=first.__SAVES||{};
const KEYS=[];for(const k of ['TOMB','GREED','GUSTA'])for(const v of ['ctl','msa'])KEYS.push(k+'_'+v);
if(KEYS.some(k=>!SAVES[k])){console.log('FAIL Save/Load VM1 saves missing: '+KEYS.filter(k=>!SAVES[k]).join(','));process.exitCode=2;}
else harness('const SAVES='+JSON.stringify(SAVES)+';const KEYS='+JSON.stringify(KEYS)+';'+String.raw`
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
/* 再開後の解決で開く選択（ガスタのつむじ風の特殊召喚）は、無中断の VM1 と同じく uid が PREFER の先頭に合う候補を選ぶ（VM1 の PREFER と同じ順） */
function settle(prefer){for(let i=0;i<600;i++){if(pc()){const q=pc();let j=-1;for(const u of prefer){j=q.candidates.findIndex(c=>c.uid===u);if(j>=0)break;}__choicePickV49(j>=0?j:0);continue;}if(!step())return 'idle';}return 'loop';}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function tgOf(j0){const s=new Set();V41_ACTION_JOURNAL.slice(j0).forEach(e=>{const t=e.action.srcS03&&e.action.srcS03.tg;if(t&&t.length)t.forEach(u=>s.add(u));});return [...s];}
function sameSet(a,b){return JSON.stringify(a.slice().sort())===JSON.stringify(b.slice().sort());}
for(const key of KEYS){
  const o=JSON.parse(SAVES[key]);
  resetA();localStorage.setItem(DUEL_SAVE_KEY,o.raw);const resumed=offerResumeDuel();
  const link=gameState.chain.find(l=>l.name===o.name);
  ok('Save/Load '+key+' ('+o.name+'): resumed with the link on the chain and the digest equal to the saved one',!!resumed&&!!link&&v41StateDigest(gameState)===o.digest,JSON.stringify({resumed,chain:gameState.chain.map(l=>l.name)}));
  ok('Save/Load '+key+' resumed: the 2 targets on the loaded link are still the chosen cards (uid), and the effect-source target set is rebuilt from them',!!link&&sameSet(linkTargetUidsS03(link),o.want)&&linkTargetUidsS03(link).length===2,JSON.stringify(link&&linkTargetUidsS03(link)));
  const j0=V41_ACTION_JOURNAL.length;settle(o.prefer||[]);
  ok('Save/Load '+key+' resumed: the resolution carries the 2 targets in the effect source (srcS03.tg) after the resume',sameSet(tgOf(j0),o.want),JSON.stringify(tgOf(j0)));
  ok('Save/Load '+key+' resumed: every tracked card ends where it ended in the uninterrupted VM1 run (location / position / face)',JSON.stringify(o.ids.map(u=>locU(u)))===JSON.stringify(o.locs),JSON.stringify({vm2:o.ids.map(u=>locU(u)),vm1:o.locs}));
  ok('Save/Load '+key+' resumed: the chain is empty and the final digest equals the uninterrupted VM1 run',gameState.chain.length===0&&v41StateDigest(gameState)===o.final,v41StateDigest(gameState)+' vs '+o.final);
  audit('Save/Load '+key);
}
`);
