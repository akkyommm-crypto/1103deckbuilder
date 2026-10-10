/* S03-U204: PARTIAL → TESTED — アタック・リフレクター・ユニット, ブルーメンブラット, 拘束解除, ドラゴニック・タクティクス, 六武ノ書 (Tribute cost),
   ジェムナイト・アレキサンド, キングス・ナイト, 万華鏡－華麗なる分身－, E・HERO キャプテン・ゴールド, ジェネラルデーモン. Real DUEL paths,
   Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function C(c){return findCardByUid(c.uid).card;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:6},()=>mk('ワイト',p));}
let PREFER=[],TRIG=[],SEEN=[];
function step(){const q=pc();if(q){SEEN.push({title:q.title,names:q.candidates.map(x=>x.label||x.name||'')});let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push(g.map(c=>c.name).join('+'));eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function acts(){return v41ReplayPackage(gameState).actions.map(x=>x.action||x);}
function costFirst(){const a=acts();const iT=a.findIndex(x=>x.type==='FX_TO_GRAVE'),iC=a.findIndex(x=>x.type==='CHAIN_ADD');return iT>=0&&iC>=0&&iT<iC;}

/* ===== A: Tribute-cost Spell / Trap recruiters ===== */
function rel(label,src,kind,rels,hit,where){
  fresh();const s=mk(src,0,kind==='trap'?'down':undefined);if(kind==='trap')s.setTurn=4;const R=rels.map(n=>mk(n,0,'up')),h=mk(hit,0);
  if(kind==='trap')gameState.players[0].sz=[s];else gameState.players[0].hand=[s];
  gameState.players[0].mz=R.slice();if(where==='hand')gameState.players[0].hand.push(h);else gameState.players[0].deck.push(h);baselineA();
  if(kind==='trap')duelActivateFromZone(0,'sz',0);else duelActivateFromHand(0);drive();
  ok(label+': '+rels.join(' + ')+' tributed (cost, before CHAIN_ADD); '+hit+' special summoned from the '+(where||'deck'),R.every(r=>z(r)==='grave')&&z(h)==='mz'&&costFirst(),JSON.stringify({h:z(h),r:R.map(z)}));
  audit(label);
}
rel('A1','アタック・リフレクター・ユニット','trap',['サイバー・ドラゴン'],'サイバー・バリア・ドラゴン','deck');
rel('A2','ブルーメンブラット','spell',['E・HERO クノスペ'],'E・HERO ブルーメ','hand');
rel('A3','拘束解除','spell',['鉄の騎士 ギア・フリード'],'剣聖－ネイキッド・ギア・フリード','deck');
rel('A4','ドラゴニック・タクティクス','spell',['グレイ・ウイング','ミンゲイドラゴン'],'青眼の白龍','deck');
rel('A5','六武ノ書','spell',['六武衆－ザンジ','六武衆－ヤイチ'],'大将軍 紫炎','deck');
fresh();
let br=mk('ブルーメンブラット',0);gameState.players[0].hand=[br];gameState.players[0].mz=[mk('E・HERO スパークマン',0,'up')];gameState.players[0].deck.push(mk('E・HERO ブルーメ',0));baselineA();
ok('A6: ブルーメンブラット without E・HERO クノスペ — not activatable',strictScriptLegalityV2('ブルーメンブラット',0,'hand',0,{}).ok===false);
fresh();
let bl=mk('E・HERO ブルーメ',0),rv=mk('死者蘇生',0);gameState.players[0].grave=[bl];gameState.players[0].hand=[rv];baselineA();
ok('A7: E・HERO ブルーメ cannot be revived by 死者蘇生 (「ブルーメンブラット」の効果でのみ)',canEffectSpecialSummonS03(C(bl),'grave','死者蘇生')===false);

/* ===== B: ジェムナイト・アレキサンド — Tribute it: a 「ジェムナイト」 Normal Monster from the Deck ===== */
fresh();
let ax=mk('ジェムナイト・アレキサンド',0,'up'),gn=mk('ジェムナイト・ガネット',0),ga=mk('ジェムナイト・アレキサンド',0);gameState.players[0].mz=[ax];gameState.players[0].deck.push(ga,gn);baselineA();SEEN=[];
duelActivateFromZone(0,'mz',0);drive();
ok('B: アレキサンド tributed; ジェムナイト・ガネット (Normal) special summoned; the effect アレキサンド not offered',z(ax)==='grave'&&z(gn)==='mz'&&z(ga)==='deck');
audit('B');

/* ===== C: キングス・ナイト — with クィーンズ・ナイト: ジャックス・ナイト from the Deck ===== */
fresh();
let kn=mk('キングス・ナイト',0),qn=mk('クィーンズ・ナイト',0,'up'),jk=mk('ジャックス・ナイト',0);gameState.players[0].hand=[kn];gameState.players[0].mz=[qn];gameState.players[0].deck.push(jk);baselineA();
doNormalSummon(0,'atk');drive();
ok('C: ジャックス・ナイト special summoned',z(jk)==='mz');
audit('C');
fresh();
kn=mk('キングス・ナイト',0);jk=mk('ジャックス・ナイト',0);gameState.players[0].hand=[kn];gameState.players[0].deck.push(jk);baselineA();TRIG.length=0;
doNormalSummon(0,'atk');drive();
ok('C2: without クィーンズ・ナイト — no activation',z(jk)==='deck'&&!TRIG.some(t=>/キングス/.test(t)));
audit('C2');

/* ===== D: 万華鏡－華麗なる分身－ — with ハーピィ・レディ: ハーピィ・レディ三姉妹 from the Deck ===== */
fresh();
let kl=mk('万華鏡－華麗なる分身－',0),hl=mk('ハーピィ・レディ',0,'up'),h3=mk('ハーピィ・レディ三姉妹',0);gameState.players[0].hand=[kl];gameState.players[0].mz=[hl];gameState.players[0].deck.push(h3);baselineA();
duelActivateFromHand(0);drive();
ok('D: ハーピィ・レディ三姉妹 special summoned',z(h3)==='mz');
audit('D');

/* ===== E: キャプテン・ゴールド / ジェネラルデーモン — discard: the Field Spell; destroyed without it ===== */
for(const [src,fld] of [['E・HERO キャプテン・ゴールド','摩天楼 －スカイスクレイパー－'],['ジェネラルデーモン','万魔殿－悪魔の巣窟－']]){
  fresh();const s=mk(src,0),f=mk(fld,0);gameState.players[0].hand=[s];gameState.players[0].deck.push(f);baselineA();
  duelActivateFromHand(0);drive();
  ok('E: '+src+' discarded → '+fld+' added',z(s)==='grave'&&z(f)==='hand');
  audit('E '+src);
  fresh();const s2=mk(src,0);gameState.players[0].hand=[s2];baselineA();
  doNormalSummon(0,'atk');drive();
  ok('E2: '+src+' Normal Summoned without '+fld+' — destroyed',z(s2)==='grave');
  audit('E2 '+src);
}
`);
