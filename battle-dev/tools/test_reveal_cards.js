/* Reveal / AtomicDeck recovery batch — 12枚の positive / negative / ruling edge case。 */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);
  const c={id,owner:p,controller:p,face,pos};ensureCardUid(gameState,c);return c;}
function reset0(){
  gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=5;
  PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;
  resetChoiceStatsV49();v41ResetActionJournal(gameState);API.selectCard=(t,list,cb)=>cb(list[0]);
}
function eff(n,k){const e=nativeEffectsV4(n).find(x=>!k||x.key===k);if(!e)throw new Error('effect '+n+' '+k);return e;}
function ctxAt(card,zone,ev){const h=locateCardAnyV4(card);
  return makeContext(0,card,zone||(h&&h.zone)||'sz',(h&&h.index)||0,ev||'activate',{});}
function run(e,c){if(e.cost){let p=false;e.cost(c,v=>{p=v;});} if(e.target)e.target(c,r=>{c.selectedTargets=r;}); e.operation(c);}
function pending(){return pendingChoiceV49(gameState);}
function answerKeys(keys){return answerChoiceV49(keys);}
/* デッキのカードは非公開なのでラベルでは選べない。uid で選ぶ。 */
function answerByName(names){
  const pc=pending();if(!pc)throw new Error('no pending choice');
  const keys=names.map(n=>{
    const c=pc.candidates.find(x=>{
      if(String(x.label).includes(n)) return true;
      if(x.uid==null) return false;
      const h=findCardByUid(x.uid);
      return !!h&&dbOf(h.card).n===n;});
    if(!c)throw new Error('候補が無い: '+n+' / '+pc.candidates.map(x=>x.label).join(','));
    return c.key;});
  return answerChoiceV49(keys);
}
function candNames(){
  const pc=pending();if(!pc)return [];
  return pc.candidates.map(x=>{const h=x.uid!=null?findCardByUid(x.uid):null;
    return h?dbOf(h.card).n:String(x.label);});
}
function deckNames(p){return gameState.players[p].deck.map(c=>dbOf(c).n);}
function lastLog(){return ((gameState.log||[])[0]||{}).msg||'';}
function logsHave(re){return (gameState.log||[]).some(e=>re.test(String(e.msg||'')));}
const A='ヂェミナイ・エルフ',B='セイバーザウルス',C='ライオウ',D='クリッター',E='シャインエンジェル';
const TRAP='D2シールド',SPELL='死者蘇生';
/* 小道具は既に TESTED のカードだけを使う（fixture による誤昇格を避ける）。 */
const INSECT='アーマード・フライ';
const RITUAL_M='終焉の王デミス';
const NAMES=['旧神の印','マインド・ハック','厳格な老魔術師','大王目玉','盗み見ゴブリン',
  'リチュア・チェイン','赤い忍者','青い忍者','真実の眼','ピケルの読心術','うごめく影','翡翠の蟲笛'];
NAMES.forEach(n=>ok('v20 registration '+n,!!CARD_SCRIPTS[n]));
ok('前提: 小道具カードがDBに揃っている',!!INSECT&&!!RITUAL_M,INSECT+' / '+RITUAL_M);

/* =====================================================================
   1. 確認するだけのカード
   ===================================================================== */
reset0();
let seal=mk('旧神の印'),foeSet1=mk(TRAP,1,'down'),foeSet2=mk(A,1,'down','def');
gameState.players[0].sz=[seal];gameState.players[1].sz=[foeSet1];gameState.players[1].mz=[foeSet2];
let eSeal=eff('旧神の印');
ok('旧神の印 positive: 相手のセットカードがあれば発動できる',eSeal.condition(ctxAt(seal,'sz'))===true);
let lpBefore=gameState.players[0].lp;
run(eSeal,ctxAt(seal,'sz'));
ok('旧神の印 positive: 1000LPを払う',gameState.players[0].lp===lpBefore-1000);
ok('旧神の印 positive: セットカード2枚を確認する',logsHave(/旧神の印：.*2枚を確認/),lastLog());
ok('旧神の印 ruling: 確認しただけなので公開状態にはならない',
   gameState.revealV20===undefined&&isRevealedToV20(gameState,foeSet1.uid,0)===false);
ok('旧神の印 ruling: 相手のカードは伏せたまま',foeSet1.face==='down'&&foeSet2.face==='down');
reset0();
let seal2=mk('旧神の印');gameState.players[0].sz=[seal2];
ok('旧神の印 negative: 相手のセットカードが無ければ発動できない',
   eSeal.condition(ctxAt(seal2,'sz'))===false);
reset0();
let seal3=mk('旧神の印'),fs3=mk(TRAP,1,'down');
gameState.players[0].sz=[seal3];gameState.players[1].sz=[fs3];gameState.players[0].lp=1000;
ok('旧神の印 negative: LPが1000以下では発動できない',eSeal.condition(ctxAt(seal3,'sz'))===false);

reset0();
let hack=mk('マインド・ハック',0,'down'),fh1=mk(A,1),fh2=mk(B,1),fset=mk(TRAP,1,'down');
gameState.players[0].sz=[hack];gameState.players[1].hand=[fh1,fh2];gameState.players[1].sz=[fset];
let eHack=eff('マインド・ハック');
ok('マインド・ハック positive: LPが足りれば発動できる',eHack.condition(ctxAt(hack,'sz'))===true);
lpBefore=gameState.players[0].lp;
run(eHack,ctxAt(hack,'sz'));
ok('マインド・ハック positive: 500LPを払う',gameState.players[0].lp===lpBefore-500);
ok('マインド・ハック positive: 手札2枚とセット1枚の計3枚を確認する',
   logsHave(/マインド・ハック：.*3枚を確認/),lastLog());
ok('マインド・ハック ruling: 手札は公開されない',
   isRevealedToV20(gameState,fh1.uid,0)===false);
reset0();
let hack2=mk('マインド・ハック',0,'down');gameState.players[0].sz=[hack2];gameState.players[0].lp=500;
ok('マインド・ハック negative: LPが500以下では発動できない',eHack.condition(ctxAt(hack2,'sz'))===false);

reset0();
let sage=mk('厳格な老魔術師',0,'down','def'),ms=mk(TRAP,0,'down'),os=mk(SPELL,1,'down');
gameState.players[0].mz=[sage];gameState.players[0].sz=[ms];gameState.players[1].sz=[os];
let eSage=eff('厳格な老魔術師');
ok('厳格な老魔術師 positive: リバースで発動できる',eSage.condition(ctxAt(sage,'mz','onFlip'))===true);
sage.face='up';   /* リバース済みなので自身はセットカードではない */
eSage.operation(ctxAt(sage,'mz','onFlip'));
ok('厳格な老魔術師 positive: 両者のセットカードを確認する',
   logsHave(/厳格な老魔術師：.*2枚を確認/),lastLog());
ok('厳格な老魔術師 ruling: 表側にはしない',ms.face==='down'&&os.face==='down');

reset0();
let eye=mk('大王目玉',0,'down','def');
gameState.players[0].mz=[eye];
gameState.players[0].deck=[mk(A),mk(B),mk(C),mk(D),mk(E),mk(TRAP)];
let eEye=eff('大王目玉');
ok('大王目玉 positive: リバースで発動できる',eEye.condition(ctxAt(eye,'mz','onFlip'))===true);
eEye.operation(ctxAt(eye,'mz','onFlip'));
ok('大王目玉 positive: 5枚まで確認する',logsHave(/大王目玉：.*5枚を確認/),lastLog());
ok('大王目玉 positive: 並べ替えの選択が開く',!!pending()&&pending().min===5&&pending().max===5);
answerByName([E,D,C,B,A]);
ok('大王目玉 positive: 選んだ順にデッキの上へ戻る',
   deckNames(0).slice(0,5).join(',')===[E,D,C,B,A].join(','),deckNames(0).join(','));
ok('大王目玉 ruling: 6枚目には触らない',deckNames(0)[5]===TRAP);
ok('大王目玉 ruling: 枚数は変わらない',gameState.players[0].deck.length===6);
reset0();
let eye2=mk('大王目玉',0,'down','def');gameState.players[0].mz=[eye2];gameState.players[0].deck=[];
ok('大王目玉 negative: デッキが空なら発動しない',eEye.condition(ctxAt(eye2,'mz','onFlip'))===false);

/* =====================================================================
   2. めくる（公開）カード
   ===================================================================== */
reset0();
let peek=mk('盗み見ゴブリン');
gameState.players[0].sz=[peek];
gameState.players[1].deck=[mk(A,1),mk(B,1),mk(C,1),mk(D,1)];
let ePeek=eff('盗み見ゴブリン');
ok('盗み見ゴブリン positive: 相手デッキがあれば発動できる',ePeek.condition(ctxAt(peek,'sz'))===true);
ePeek.operation(ctxAt(peek,'sz'));
ok('盗み見ゴブリン ruling: 「めくる」なのでお互いに公開される',
   isRevealedToV20(gameState,gameState.players[1].deck[0].uid,0)===true);
ok('盗み見ゴブリン positive: 一番下に戻す1枚を選ぶ',!!pending()&&pending().max===1);
answerByName([B]);
ok('盗み見ゴブリン positive: 残り2枚の順番を選ぶ',!!pending()&&pending().min===2);
answerByName([C,A]);
ok('盗み見ゴブリン positive: 選んだ1枚が一番下へ',
   deckNames(1)[deckNames(1).length-1]===B,deckNames(1).join(','));
ok('盗み見ゴブリン positive: 残りが選んだ順で上へ',
   deckNames(1).slice(0,2).join(',')===[C,A].join(','),deckNames(1).join(','));
ok('盗み見ゴブリン ruling: 枚数は変わらない',gameState.players[1].deck.length===4);
reset0();
let peek2=mk('盗み見ゴブリン');gameState.players[0].sz=[peek2];gameState.players[1].deck=[];
ok('盗み見ゴブリン negative: 相手デッキが空なら発動できない',ePeek.condition(ctxAt(peek2,'sz'))===false);

reset0();
let chain=mk('リチュア・チェイン');
gameState.players[0].mz=[chain];
gameState.players[0].deck=[mk(A),mk(RITUAL_M),mk(C),mk(D)];
let eChain=eff('リチュア・チェイン');
ok('リチュア・チェイン positive: 召喚成功時に発動できる',
   eChain.condition(ctxAt(chain,'mz','onNormalSummon'))===true);
eChain.operation(ctxAt(chain,'mz','onNormalSummon'));
ok('リチュア・チェイン positive: 3枚を確認する',logsHave(/リチュア・チェイン：.*3枚を確認/));
ok('リチュア・チェイン positive: 儀式カードだけが候補になる',
   !!pending()&&pending().candidates.length===1&&candNames()[0]===RITUAL_M,
   candNames().join(','));
answerByName([RITUAL_M]);
ok('リチュア・チェイン positive: 儀式モンスターが手札に加わる',
   gameState.players[0].hand.some(c=>dbOf(c).n===RITUAL_M));
ok('リチュア・チェイン ruling: 手札に加えた1枚は相手にも見せる',
   isRevealedToV20(gameState,gameState.players[0].hand[0].uid,1)===true);
ok('リチュア・チェイン positive: 残り2枚の順番を選ぶ',!!pending()&&pending().min===2);
answerByName([C,A]);
ok('リチュア・チェイン positive: 残りが選んだ順で戻る',
   deckNames(0).slice(0,2).join(',')===[C,A].join(','),deckNames(0).join(','));
reset0();
let chain2=mk('リチュア・チェイン');
gameState.players[0].mz=[chain2];gameState.players[0].deck=[mk(A),mk(B),mk(C)];
eChain.operation(ctxAt(chain2,'mz','onNormalSummon'));
ok('リチュア・チェイン negative: 儀式カードが無ければ手札に加えない',
   gameState.players[0].hand.length===0);
ok('リチュア・チェイン negative: それでも並べ替えは行う',!!pending()&&pending().min===3);
answerByName([C,B,A]);
ok('リチュア・チェイン ruling: 並べ替え後も枚数は変わらない',gameState.players[0].deck.length===3);

reset0();
let red=mk('赤い忍者',0,'down','def'),foeTrap=mk(TRAP,1,'down');
gameState.players[0].mz=[red];gameState.players[1].sz=[foeTrap];
let eRed=eff('赤い忍者');
ok('赤い忍者 positive: セットされた魔法・罠を対象にできる',
   eRed.condition(ctxAt(red,'mz','onFlip'))===true);
run(eRed,ctxAt(red,'mz','onFlip'));
ok('赤い忍者 positive: 罠カードなら破壊する',gameState.players[1].sz.length===0);
reset0();
let red2=mk('赤い忍者',0,'down','def'),foeSpell=mk(SPELL,1,'down');
gameState.players[0].mz=[red2];gameState.players[1].sz=[foeSpell];
run(eRed,ctxAt(red2,'mz','onFlip'));
ok('赤い忍者 negative: 魔法カードだったら破壊しない',gameState.players[1].sz.length===1);
ok('赤い忍者 ruling: めくって確認した後は元に戻す',gameState.players[1].sz[0].face==='down');
reset0();
let red3=mk('赤い忍者',0,'down','def');gameState.players[0].mz=[red3];
ok('赤い忍者 negative: 対象が無ければ発動しない',eRed.condition(ctxAt(red3,'mz','onFlip'))===false);

reset0();
let blue=mk('青い忍者',0,'down','def'),foeSpell2=mk(SPELL,1,'down');
gameState.players[0].mz=[blue];gameState.players[1].sz=[foeSpell2];
let eBlue=eff('青い忍者');
run(eBlue,ctxAt(blue,'mz','onFlip'));
ok('青い忍者 positive: 魔法カードなら破壊する',gameState.players[1].sz.length===0);
reset0();
let blue2=mk('青い忍者',0,'down','def'),foeTrap2=mk(TRAP,1,'down');
gameState.players[0].mz=[blue2];gameState.players[1].sz=[foeTrap2];
run(eBlue,ctxAt(blue2,'mz','onFlip'));
ok('青い忍者 negative: 罠カードだったら破壊しない',gameState.players[1].sz.length===1);

/* =====================================================================
   3. 公開し続けるカード
   ===================================================================== */
reset0();
let eyeT=mk('真実の眼',0,'down'),oh1=mk(A,1),oh2=mk(SPELL,1);
gameState.players[0].sz=[eyeT];gameState.players[1].hand=[oh1,oh2];
let eEyeT=eff('真実の眼','keep-opponent-hand-revealed');
let eHeal=eff('真実の眼','opponent-standby-heal');
eEyeT.operation(ctxAt(eyeT,'sz'));
eyeT.face='up';
ok('真実の眼 positive: 相手の手札が公開され続ける',
   isRevealedToV20(gameState,oh1.uid,0)===true&&isRevealedToV20(gameState,oh2.uid,0)===true);
let newCard=mk(C,1);gameState.players[1].hand.push(newCard);
ok('真実の眼 ruling: 後から加わった手札も公開される',
   isRevealedToV20(gameState,newCard.uid,0)===true);
gameState.activePlayer=1;gameState.phase='standby';
ok('真実の眼 positive: 相手のスタンバイに魔法があれば誘発する',
   eHeal.condition(ctxAt(eyeT,'sz','onStandbyPhase'))===true);
let foeLp=gameState.players[1].lp;
eHeal.operation(ctxAt(eyeT,'sz','onStandbyPhase'));
ok('真実の眼 positive: 相手が1000回復する',gameState.players[1].lp===foeLp+1000);
gameState.players[1].hand=[mk(A,1)];
ok('真実の眼 negative: 手札に魔法が無ければ誘発しない',
   eHeal.condition(ctxAt(eyeT,'sz','onStandbyPhase'))===false);
gameState.activePlayer=0;
ok('真実の眼 negative: 自分のスタンバイでは誘発しない',
   eHeal.condition(ctxAt(eyeT,'sz','onStandbyPhase'))===false);
API.sendToGrave(locateCardAnyV4(eyeT),'テスト');
ok('真実の眼 ruling: 場を離れれば公開は終わる',
   isRevealedToV20(gameState,oh1.uid,0)===false);

reset0();
let pikeru=mk('ピケルの読心術',0,'down');
gameState.players[0].sz=[pikeru];
gameState.players[1].deck=[mk(A,1),mk(B,1),mk(C,1),mk(D,1)];
let ePik=eff('ピケルの読心術');
ePik.operation(ctxAt(pikeru,'sz'));
ok('ピケルの読心術 positive: 公開義務が作られる',
   !!revealObligationV20(gameState,1,'draw'));
ok('ピケルの読心術 ruling: 義務そのものは何も公開していない',
   revealedCardsV20(gameState,0).length===0);
API.draw(1,1);
let drew=gameState.players[1].hand[gameState.players[1].hand.length-1];
ok('ピケルの読心術 positive: 相手が引いたカードが公開される',
   isRevealedToV20(gameState,drew.uid,0)===true);
let mine=mk(E,0);gameState.players[0].deck=[mine];
API.draw(0,1);
ok('ピケルの読心術 negative: 自分のドローは公開されない',
   isRevealedToV20(gameState,mine.uid,1)===false);
gameState.activePlayer=0;clearExpiredMods(gameState,'endPhase');
ok('ピケルの読心術 ruling: 自分のエンドフェイズでは数えない',
   !!revealObligationV20(gameState,1,'draw'));
gameState.activePlayer=1;clearExpiredMods(gameState,'endPhase');
ok('ピケルの読心術 ruling: 1回目の相手エンドフェイズでは続く',
   !!revealObligationV20(gameState,1,'draw'));
clearExpiredMods(gameState,'endPhase');
ok('ピケルの読心術 ruling: 2回目の相手エンドフェイズで終わる',
   !revealObligationV20(gameState,1,'draw'));
ok('ピケルの読心術 hidden: 効果終了後は以前のドロー公開も残らない',
   !isRevealedToV20(gameState,drew.uid,0));
API.draw(1,1);
let after=gameState.players[1].hand[gameState.players[1].hand.length-1];
ok('ピケルの読心術 ruling: 終わった後のドローは公開されない',
   isRevealedToV20(gameState,after.uid,0)===false);

/* =====================================================================
   4. 原子的な並べ替え
   ===================================================================== */
reset0();
let shadow=mk('うごめく影');
gameState.players[0].sz=[shadow];
gameState.players[0].mz=[mk(A,0,'down','def'),mk(B,0,'down','def'),mk(C,0,'down','def')];
let eShadow=eff('うごめく影');
let cShadow=ctxAt(shadow,'sz');
ok('うごめく影 positive: 裏側守備が2体以上あれば発動できる',eShadow.condition(cShadow)===true);
lpBefore=gameState.players[0].lp;
let uidsBefore=gameState.players[0].mz.map(c=>c.uid).slice().sort().join(',');
run(eShadow,cShadow);
ok('うごめく影 positive: 300LPを払う',gameState.players[0].lp===lpBefore-300);
ok('うごめく影 positive: 顔ぶれは変わらない',
   gameState.players[0].mz.map(c=>c.uid).slice().sort().join(',')===uidsBefore);
ok('うごめく影 ruling: 全て裏側守備のまま',
   gameState.players[0].mz.every(c=>c.face==='down'&&c.pos==='def'));
ok('うごめく影 negative: 同じターンに2度は使えない',
   eShadow.condition(ctxAt(shadow,'sz'))===false);
gameState.turn++;
ok('うごめく影 ruling: 次のターンには再び使える',eShadow.condition(ctxAt(shadow,'sz'))===true);
reset0();
let shadow2=mk('うごめく影');
gameState.players[0].sz=[shadow2];gameState.players[0].mz=[mk(A,0,'down','def')];
ok('うごめく影 negative: 裏側守備が1体では発動できない',
   eShadow.condition(ctxAt(shadow2,'sz'))===false);
reset0();
let shadow3=mk('うごめく影');
gameState.players[0].sz=[shadow3];
gameState.players[0].mz=[mk(A,0,'down','def'),mk(B,0,'down','def')];
gameState.players[0].lp=300;
ok('うごめく影 negative: LPが300以下では発動できない',
   eShadow.condition(ctxAt(shadow3,'sz'))===false);

reset0();
let flute=mk('翡翠の蟲笛');
gameState.players[0].sz=[flute];
gameState.players[1].deck=[mk(A,1),mk(INSECT,1),mk(C,1),mk(D,1)];
let eFlute=eff('翡翠の蟲笛');
ok('翡翠の蟲笛 positive: 相手デッキに昆虫族があれば発動できる',
   eFlute.condition(ctxAt(flute,'sz'))===true,INSECT);
eFlute.operation(ctxAt(flute,'sz'));
ok('翡翠の蟲笛 positive: 昆虫族だけが候補になる',
   !!pending()&&candNames().every(n=>n===INSECT),candNames().join(','));
answerByName([INSECT]);
ok('翡翠の蟲笛 positive: 選んだ昆虫族がデッキの一番上に来る',
   deckNames(1)[0]===INSECT,deckNames(1).join(','));
ok('翡翠の蟲笛 ruling: 枚数は変わらない',gameState.players[1].deck.length===4);
ok('翡翠の蟲笛 ruling: 自分は相手のデッキを見ない（公開しない）',
   gameState.revealV20===undefined||revealedCardsV20(gameState,0).length===0);
reset0();
let flute2=mk('翡翠の蟲笛');
gameState.players[0].sz=[flute2];gameState.players[1].deck=[mk(A,1),mk(C,1)];
ok('翡翠の蟲笛 negative: 昆虫族が無ければ発動できない',
   eFlute.condition(ctxAt(flute2,'sz'))===false);

/* =====================================================================
   5. Replay / SaveLoad / 直列化
   ===================================================================== */
reset0();
let rPik=mk('ピケルの読心術',0,'down');
gameState.players[0].sz=[rPik];
gameState.players[1].deck=[mk(A,1),mk(B,1),mk(C,1)];
v41ResetActionJournal(gameState);
eff('ピケルの読心術').operation(ctxAt(rPik,'sz'));
API.draw(1,1);
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('Replay: 公開義務と公開が digest 一致で再生される',audit.ok,audit.reason||audit.finalDigest);
let snap=JSON.stringify(gameState);
ok('SaveLoad: gameState は JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('直列化: 公開記録は純JSON',assertRevealSerializableV20(gameState)===null);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
