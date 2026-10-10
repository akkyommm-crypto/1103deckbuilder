/* Auto cycle 40 — 4枚。positive / negative / ruling edge / Replay。 */
const fs=require('fs'),vm=require('vm'),path=require('path');const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};openPick=()=>{};
const R=[],ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});globalThis.__R=R;
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);
  const c={id,owner:p,controller:p,face,pos,summonedTurn:1};ensureCardUid(gameState,c);return c;}
function reset0(){gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;
  gameState.phase='main1';gameState.turn=6;PLAY_MODE=PLAY_MODES.DUEL;
  HISTORY.length=0;REDO.length=0;turnActions=[];resetChoiceStatsV49();
  v41ResetActionJournal(gameState);API.selectCard=(t,list,cb)=>cb(list[0]);
  API.confirm=(t,m,yes,no)=>{ if(no) no(); };
  gameState.fieldSnapV9=fieldSnapshotV9(gameState);}
function h(c){return locateCardAnyV4(c);}
function sc(n){const s=CARD_SCRIPTS[n];if(!s)throw Error('script missing '+n);return s;}
function C(p,card,zone,idx,ev,extra){const c=makeContext(p,card,zone,idx,ev||'activate',extra||{});
  if(extra&&extra.event)c.event=extra.event;return c;}
function ctxEv(p,card,ev,evt,zone){const loc=h(card);
  return C(p,card,zone||(loc&&loc.zone)||'mz',(loc&&loc.index)||0,ev,{event:evt});}
function ctxDS(p,card,battle,zone,step){const loc=h(card);
  const c=C(p,card,zone||(loc&&loc.zone)||'mz',(loc&&loc.index)||0,'onDamageStep',{event:{},battle:battle,step:step||'end'});
  c.battle=battle;c.step=step||'end';return c;}
function pending(){return pendingChoiceV49(gameState);}

const PLAIN='ワイト';        /* 闇 アンデット lv1 ATK300 */
const BIG='青眼の白龍';       /* 光 ドラゴン lv8 ATK3000 */

const ALL=['闇帝ディルグ','異次元への案内人','召喚の呪詛','アルカナフォース0－THE FOOL'];
ALL.forEach(n=>ok('cycle40 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle40 枚数は4',ALL.length===4);

const FOOL='アルカナフォース0－THE FOOL';
function graveNames(p){return gameState.players[p].grave.map(c=>dbOf(c).n);}

/* ============ 1. 闇帝ディルグ ============ */
reset0();
let dg=mk('闇帝ディルグ',0);
gameState.players[0].mz=[dg];
for(let i=0;i<3;i++) gameState.players[1].grave.push(mk(PLAIN,1));
ok('闇帝ディルグ positive: 召喚に成功した時、相手の墓地があれば発動できる',
   sc('闇帝ディルグ').condition(ctxEv(0,dg,'onNormalSummon',{card:dg,player:0}))===true);

reset0();
let dgN=mk('闇帝ディルグ',0);
gameState.players[0].mz=[dgN];
ok('闇帝ディルグ negative: 相手の墓地が空なら発動できない',
   sc('闇帝ディルグ').condition(ctxEv(0,dgN,'onNormalSummon',{card:dgN,player:0}))===false);
ok('闇帝ディルグ negative: 自分以外の召喚では誘発しない',
   sc('闇帝ディルグ').passive.onNormalSummon(
     ctxEv(0,dgN,'onNormalSummon',{card:mk(BIG,1),player:1}))===false);

reset0();
let dg3=mk('闇帝ディルグ',0);
gameState.players[0].mz=[dg3];
for(let i=0;i<3;i++) gameState.players[1].grave.push(mk(PLAIN,1));
for(let i=0;i<5;i++) gameState.players[1].deck.push(mk(BIG,1));
let dgDeck0=gameState.players[1].deck.length;
sc('闇帝ディルグ').resolve(ctxEv(0,dg3,'onNormalSummon',{card:dg3,player:0}));
let pdg=pending();
ok('闇帝ディルグ positive: 2枚までの選択が開く（0枚も選べる）',
   !!pdg && pdg.min===0 && pdg.max===2 && pdg.candidates.length===3);
answerChoiceV49(pdg.candidates.slice(0,2).map(x=>x.key));
ok('闇帝ディルグ card-specific: 除外した数だけ相手のデッキの上を墓地へ送る',
   gameState.players[1].banish.length===2
   && gameState.players[1].deck.length===dgDeck0-2
   && graveNames(1).filter(n=>n===BIG).length===2,
   'banish='+gameState.players[1].banish.length+' deck='+gameState.players[1].deck.length
   +' grave='+graveNames(1).join('/'));

/* ruling edge: 召喚・特殊召喚したターンは攻撃できない */
dg3.summonedTurn=gameState.turn;
ok('闇帝ディルグ ruling edge: 召喚したターンは攻撃宣言できない',
   cannotAttackNow(dg3)===true);
dg3.summonedTurn=gameState.turn-1;
ok('闇帝ディルグ ruling edge: 次のターン以降は攻撃宣言できる',
   cannotAttackNow(dg3)===false);

/* ============ 2. 異次元への案内人 ============ */
reset0();
let gd=mk('異次元への案内人',0);
gameState.players[0].mz=[gd];
ok('異次元への案内人 positive: 召喚に成功した時に誘発する（強制）',
   sc('異次元への案内人').passive.onNormalSummon(
     ctxEv(0,gd,'onNormalSummon',{card:gd,player:0}))===true
   && sc('異次元への案内人').forced===true);
sc('異次元への案内人').resolve(ctxEv(0,gd,'onNormalSummon',{card:gd,player:0}));
ok('異次元への案内人 card-specific: コントロールが相手に移る',
   !!h(gd) && h(gd).p===1 && h(gd).zone==='mz',
   'loc='+JSON.stringify(h(gd)&&{p:h(gd).p,zone:h(gd).zone}));
ok('異次元への案内人 negative: 一度移した後は召喚誘発が再度起きない',
   sc('異次元への案内人').passive.onNormalSummon(
     ctxEv(1,gd,'onNormalSummon',{card:gd,player:1}))===false);

gameState.players[1].grave.push(mk(PLAIN,1));
gameState.phase='end';
ok('異次元への案内人 positive: エンドフェイズ毎に除外効果が誘発する',
   sc('異次元への案内人').passive.onEndPhase(
     ctxEv(1,gd,'onEndPhase',{phase:'end'}))===true);
sc('異次元への案内人').resolve(ctxEv(1,gd,'onEndPhase',{phase:'end'}));
let pgd=pending();
ok('異次元への案内人 card-specific: 選ぶのはコントローラー(P1)ではなく相手(P0)',
   !!pgd && pgd.player===0 && pgd.candidates.length===1,
   'chooser='+(pgd&&pgd.player));
answerChoiceV49([pgd.candidates[0].key]);
ok('異次元への案内人 positive: コントローラーの墓地のカードが除外される',
   gameState.players[1].grave.length===0 && gameState.players[1].banish.length===1);

reset0();
let gdX=mk('異次元への案内人',0);
gdX.e9GuideMoved=1;
gameState.players[0].mz=[gdX];
gameState.phase='end';
ok('異次元への案内人 negative: コントローラーの墓地が空なら誘発しない',
   sc('異次元への案内人').passive.onEndPhase(
     ctxEv(0,gdX,'onEndPhase',{phase:'end'}))===false);

/* ============ 3. 召喚の呪詛 ============ */
reset0();
let cs=mk('召喚の呪詛',0);
gameState.players[0].sz=[cs];
let csV=mk(BIG,1);
gameState.players[1].mz=[csV];
gameState.players[1].hand.push(mk(PLAIN,1));
ok('召喚の呪詛 positive: モンスターが特殊召喚に成功した時に誘発する',
   sc('召喚の呪詛').passive.onSpecialSummon(
     ctxEv(0,cs,'onSpecialSummon',{card:csV,player:1}))===true);
sc('召喚の呪詛').resolve(ctxEv(0,cs,'onSpecialSummon',{card:csV,player:1}));
let pcs=pending();
ok('召喚の呪詛 card-specific: 手札を選ぶのは特殊召喚したモンスターのコントローラー',
   !!pcs && pcs.player===1, 'chooser='+(pcs&&pcs.player));
answerChoiceV49([pcs.candidates[0].key]);
ok('召喚の呪詛 positive: そのコントローラーの手札が除外される（墓地ではない）',
   gameState.players[1].hand.length===0
   && gameState.players[1].banish.length===1
   && gameState.players[1].grave.length===0);

reset0();
let cs2=mk('召喚の呪詛',0);
gameState.players[0].sz=[cs2];
let cs2V=mk(BIG,1);
gameState.players[1].mz=[cs2V];
ok('召喚の呪詛 negative: そのコントローラーの手札が無ければ誘発しない',
   sc('召喚の呪詛').passive.onSpecialSummon(
     ctxEv(0,cs2,'onSpecialSummon',{card:cs2V,player:1}))===false);
cs2.face='down';
gameState.players[1].hand.push(mk(PLAIN,1));
ok('召喚の呪詛 negative: 裏側（未発動）では誘発しない',
   sc('召喚の呪詛').passive.onSpecialSummon(
     ctxEv(0,cs2,'onSpecialSummon',{card:cs2V,player:1}))===false);

reset0();
let cs3=mk('召喚の呪詛',0);
gameState.players[0].sz=[cs3];
gameState.phase='end'; gameState.activePlayer=0;
let cs3Lp=gameState.players[0].lp;
ok('召喚の呪詛 positive: 自分のエンドフェイズに維持コストが誘発する',
   sc('召喚の呪詛').passive.onEndPhase(ctxEv(0,cs3,'onEndPhase',{phase:'end'}))===true);
gameState.activePlayer=1;
ok('召喚の呪詛 negative: 相手のエンドフェイズには維持コストが誘発しない',
   sc('召喚の呪詛').passive.onEndPhase(ctxEv(0,cs3,'onEndPhase',{phase:'end'}))===false);
gameState.activePlayer=0;
sc('召喚の呪詛').resolve(ctxEv(0,cs3,'onEndPhase',{phase:'end'}));
let pcu=pending();
ok('召喚の呪詛 ruling edge: 払うか払わず破壊するかを選べる',
   !!pcu && pcu.kind==='option' && pcu.candidates.length===2
   && pcu.candidates.some(x=>x.key==='pay'));
answerChoiceV49(['pay']);
ok('召喚の呪詛 positive: 500払えば場に残る',
   gameState.players[0].lp===cs3Lp-500 && gameState.players[0].sz.length===1);

reset0();
let cs4=mk('召喚の呪詛',0);
gameState.players[0].sz=[cs4];
gameState.players[0].lp=400;
gameState.phase='end'; gameState.activePlayer=0;
sc('召喚の呪詛').resolve(ctxEv(0,cs4,'onEndPhase',{phase:'end'}));
let pcd=pending();
ok('召喚の呪詛 ruling edge: 払えないライフなら破壊しか選べない',
   !!pcd && pcd.candidates.length===1 && pcd.candidates[0].key==='destroy');
answerChoiceV49(['destroy']);
ok('召喚の呪詛 card-specific: 払わなければ自身が破壊され墓地へ行く',
   gameState.players[0].sz.length===0
   && graveNames(0).indexOf('召喚の呪詛')>=0
   && gameState.players[0].lp===400,
   'sz='+gameState.players[0].sz.length+' grave='+graveNames(0).join('/'));

/* ============ 4. アルカナフォース0－THE FOOL ============ */
reset0();
let af=mk(FOOL,0);
gameState.players[0].mz=[af];
ok('アルカナフォース0 positive: 召喚に成功した時にコイントスが誘発する',
   sc(FOOL).passive.onNormalSummon(ctxEv(0,af,'onNormalSummon',{card:af,player:0}))===true);
sc(FOOL).resolve(ctxEv(0,af,'onNormalSummon',{card:af,player:0}));
let afCoin=Number(h(af).card.e9FoolCoin||0);
ok('アルカナフォース0 card-specific: コイントスの表(1)裏(2)が記録される',
   afCoin===1||afCoin===2, 'coin='+afCoin);
ok('アルカナフォース0 negative: 結果が出た後は再抽選しない',
   sc(FOOL).passive.onNormalSummon(ctxEv(0,af,'onNormalSummon',{card:af,player:0}))===false);

ok('アルカナフォース0 ruling edge: 攻撃表示から守備表示へ変更できない',
   cannotChangePositionV10(af)===true);
ok('アルカナフォース0 card-specific: 戦闘では破壊されない',
   !!protectionRecordV21(gameState,af,{cause:'battle'}));
ok('アルカナフォース0 negative: 効果破壊までは防がない',
   !protectionRecordV21(gameState,af,{cause:'effect'}));

/* 裏（coin=2）: 相手のカードが自分を対象にした時に無効化する */
h(af).card.e9FoolCoin=2;
gameState.chain=[{chainId:11,player:1,name:'サイクロン',targets:[h(af)]}];
let afEv={player:1,chainId:11,chainLink:1};
ok('アルカナフォース0 positive(裏): 相手の対象を取る効果に誘発する',
   sc(FOOL).passive.onActivateSuccess(ctxEv(0,af,'onActivateSuccess',afEv))===true);
h(af).card.e9FoolCoin=1;
ok('アルカナフォース0 negative(表): 裏表が逆なら相手の効果には誘発しない',
   sc(FOOL).passive.onActivateSuccess(ctxEv(0,af,'onActivateSuccess',afEv))===false);
gameState.chain=[{chainId:12,player:0,name:'サイクロン',targets:[h(af)]}];
ok('アルカナフォース0 positive(表): 自分の対象を取る効果には誘発する',
   sc(FOOL).passive.onActivateSuccess(
     ctxEv(0,af,'onActivateSuccess',{player:0,chainId:12,chainLink:1}))===true);
gameState.chain=[{chainId:13,player:0,name:'サイクロン',targets:[]}];
ok('アルカナフォース0 negative: 自分を対象にしない効果には誘発しない',
   sc(FOOL).passive.onActivateSuccess(
     ctxEv(0,af,'onActivateSuccess',{player:0,chainId:13,chainLink:1}))===false);

h(af).card.e9FoolCoin=2;
gameState.chain=[{chainId:14,player:1,name:'サイクロン',targets:[h(af)]}];
sc(FOOL).resolve(ctxEv(0,af,'onActivateSuccess',{player:1,chainId:14,chainLink:1}));
ok('アルカナフォース0 card-specific: 対象を取ったチェーンリンクが無効になる',
   API.chainLinkNegated(14)===true);

/* ============ Replay / SaveLoad ============ */
reset0();
let rp1=mk('闇帝ディルグ',0);
gameState.players[0].mz=[rp1];
for(let i=0;i<3;i++) gameState.players[1].grave.push(mk(PLAIN,1));
for(let i=0;i<5;i++) gameState.players[1].deck.push(mk(BIG,1));
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.banish(h(gameState.players[1].grave[0]),'闇帝ディルグ');
API.millTop(1,1,'闇帝ディルグ');
let rq1=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle40 Replay: 墓地除外＋デッキ破壊が digest 一致で再生される',rq1.ok,rq1.reason||'');

reset0();
let rp2=mk('異次元への案内人',0);
gameState.players[0].mz=[rp2];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.changeControl(h(rp2),1,'異次元への案内人');
let rq2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle40 Replay: コントロール変更が digest 一致で再生される',rq2.ok,rq2.reason||'');

let snap40=JSON.stringify(gameState);
ok('cycle40 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap40))===snap40);
ok('cycle40 直列化: 状態に関数が入っていない',snap40.indexOf('function')<0);
globalThis.__R=R;
`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});}catch(e){console.error(e.stack||e);}
const RR=c.__R||[];console.log(RR.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join(String.fromCharCode(10)));if(RR.some(x=>!x.ok)||!RR.length)process.exit(2);

