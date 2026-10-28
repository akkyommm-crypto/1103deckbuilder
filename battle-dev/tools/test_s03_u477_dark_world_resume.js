/* S03-U477: 暗黒界の「効果で捨てられた」誘発が Save/Load（saveDuel → 新 VM → offerResumeDuel）の後でも、捨てられた「そのカード」を認識すること。
   欠陥（S03-U476 が発見）: darkWorldDiscard(ctx)（cards/20_control_counter.js）は、捨てられたカードを event.card の「オブジェクト同一性」(ev.card !== ctx.card) で判定していた。
   チェーンに載ったリンクの event（opts.event）は生のカードを持つが、保存 → 読込で複製になる。複製は同一性で一致しないので null（誘発しない扱い）を返し、
   再開後の解決は「捨てられた時の効果」ではなく別の枝に落ちる: グラファは「相手のカード 1 枚を破壊」の代わりに墓地から蘇生、ゴルド／シルバ／スノウ／ブラウは「相手のカードの効果で捨てられた場合、さらに…」が丸ごと消える。
   修正: uid で識別する。両側に uid がある時だけ uid を比べ（undefined === undefined を一致にしない）、どちらかに無い時は「全く同じオブジェクト」の時だけ一致とする。
   固定する面（各々 Save なし と Save/Load 後の両方。結果は uid で確かめる）:
     1. 自分の効果で捨てた（暗黒界の門）— 自分の効果の枝（グラファは破壊、蘇生ではない）。 2. 相手の効果で捨てられた（手札抹殺）— 相手の効果の枝（さらに…が起きる）。
     3. コストとして捨てた（鳳翼の爆風）— 誘発しない（WIKI-0D346E547FFE）。コスト選択は対象選択と別（U474）。
     4. 同名の別個体 — 実際に捨てられた個体だけが認識される。 5. uid が無いカード — 無いもの同士は一致しない。
   Replay 監査と、U471 の準備トランザクションがこの道でも変わらないことも固定する。 */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
const OBE='オベリスクの巨神兵';
function pc(){return pendingChoiceV49(gameState);}
function loc(c){const h=findCardByUid(c.uid);return h?(h.p+':'+h.zone):null;}
function posOf(c){const h=findCardByUid(c.uid);return h?h.card.pos:null;}
function faceOf(c){const h=findCardByUid(c.uid);return h?h.card.face:null;}
function mon(name,p,face,pos){const c=mk(name,p,face||'up',pos||'atk');c.summonedTurn=3;return c;}
function hand(p){return gameState.players[p].hand.length;}
function peeks(){return V41_ACTION_JOURNAL.filter(e=>e.action.type==='GRAPHA_PEEK_S03').length;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest and the final state',pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,240));}
let PREFER=[],SEEN=[],LINKS_SEEN={};
function nlink(name){return LINKS_SEEN[name]?LINKS_SEEN[name].size:0;}
/* 選択: PREFER にあるカードを先頭から消費して選ぶ。複数選択（max>1 か min 0）は PREFER に合う候補を全て答え、min に足りなければ残りの先頭で補う */
function pick(){
  const q=pc();
  SEEN.push({title:q.title,min:q.min,max:q.max,targeting:q.targeting,selection:q.selection,kind:q.kind,uids:q.candidates.map(c=>c.uid)});
  if(q.kind==='option'&&/ゴルド.*対象にする枚数/.test(q.title||'')){
    const j=q.candidates.findIndex(c=>Number(c.value)===Math.min(2,PREFER.length));
    __choicePickV49(j>=0?j:0);return;}
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
/* チェーンに載ったリンクを（イベントの uid で）数える: 同時に載っていなくても、実際に載った個数が分かる */
function noteLinks(){gameState.chain.forEach(l=>{(LINKS_SEEN[l.name]=LINKS_SEEN[l.name]||new Set()).add(l.event&&l.event.uid!=null?l.event.uid:'c'+l.chainId);});}
/* until: 述語。真で選択待ちが無ければそこで止まる */
function drive(until){for(let i=0;i<900;i++){
  noteLinks();
  if(until&&!pc()&&until())return 'until';
  if(pc()){pick();continue;}
  if(!step())return 'idle';}return 'loop';}
function linksOf(name){return gameState.chain.filter(l=>l.name===name);}
function fresh(active){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;gameState.activePlayer=active;gameState.firstPlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4770001;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function savedRaw(){saveDuel();return localStorage.getItem(DUEL_SAVE_KEY);}
function oppHandDestruction(){const dd=mk('手札抹殺',1,'down');dd.setTurn=2;gameState.players[1].sz.push(dd);return dd;}
/* darkWorldDiscard を、解決時と同じ形（捨てられたカードの墓地、リンクの event）で直接評価する */
function dwCtx(card,event,player){return {eventName:'onDiscard',card,event,player:player==null?0:player,opponent:player==null?1:1-player,zone:'grave'};}
function evOf(c){return {player:0,card:c,uid:c.uid,byEffect:true,byPlayer:0,reason:'fixture'};}
function copyOf(o){return JSON.parse(JSON.stringify(o));}

/* ---- 盤面 ----
   自分の効果（暗黒界の門）: P0 の手番。門の墓地コスト（悪魔族を除外）は ベージ、手札は 暗黒界カード + ワイト。 P1 は場に 3 体、手札 2 枚。
   相手の効果（手札抹殺）: P1 の手番。P0 の手札は 暗黒界カードだけ（手札抹殺で捨て、1 枚ドロー）、P1 は手札 2 枚（捨てて 2 枚ドロー）。 */
function board(mode,name,extra){
  const x={};
  if(mode==='self'){ fresh(0);
    x.gate=mk('暗黒界の門',0,'up');gameState.players[0].field=x.gate;
    x.fuel=mk('暗黒界の尖兵 ベージ',0);gameState.players[0].grave=[x.fuel];
    x.dw=mk(name,0);x.keep=mk('ワイト',0);gameState.players[0].hand=[x.dw,x.keep];
  } else { fresh(1);
    x.dd=oppHandDestruction();
    x.dw=mk(name,0);gameState.players[0].hand=[x.dw];
  }
  x.f1=mon('ゴブリン突撃部隊',1);x.f2=mon('ギガンテス',1);x.f3=mon('ゴブリンドバーグ',1);
  gameState.players[1].mz=[x.f1,x.f2,x.f3];
  gameState.players[1].hand=[mk('ワイト',1),mk('ワイト',1)];
  x.pg=mk('ワイトキング',1);gameState.players[1].grave=[x.pg];
  if(extra)extra(x);
  baselineA();return x;}
function startOf(mode){return mode==='self'?function(){duelActivateFromZone(0,'field',0);}:function(){duelActivateFromZone(1,'sz',0,{});};}
const GR='暗黒界の龍神 グラファ',GO='暗黒界の武神 ゴルド',BL='暗黒界の狩人 ブラウ',SI='暗黒界の軍神 シルバ',SN='暗黒界の術師 スノウ';
const SPECS=[];
/* 各カードを 自分/相手 の効果で捨てる。expect は「カードの文言」による期待（data/carddata.json の e） */
function addCard(name,short,exp,extra){
  for(const mode of ['self','opp']){
    const who=mode==='self'?'own effect (暗黒界の門)':'opponent effect (手札抹殺)';
    SPECS.push({key:short+'_'+mode,name,mode,who,
      build:()=>board(mode,name,extra),start:startOf(mode),pref:x=>exp.pref?exp.pref(x,mode):[],
      expect:x=>exp[mode](x),track:x=>Object.keys(x).map(k=>x[k]),want:mode==='self'?'self':'opponent'});
  }
}
/* グラファ: 捨てられた → 相手のカード 1 枚を選択して破壊（蘇生ではない）。相手の効果ならさらに相手の手札をランダムに 1 枚確認（モンスターなら特殊召喚できる）。 */
addCard(GR,'GRAPHA',{
  pref:x=>[x.f1.uid],
  self:x=>[['the chosen target ゴブリン突撃部隊 is destroyed',loc(x.f1)==='1:grave'],['the other monsters are untouched',loc(x.f2)==='1:mz'&&loc(x.f3)==='1:mz'],['グラファ stays in the Graveyard: the destroy branch resolved, not the Special Summon from the Graveyard',loc(x.dw)==='0:grave'],['no hand peek: discarded by its own side',peeks()===0]],
  opp:x=>{const pk=gameState.graphaPeekS03&&gameState.graphaPeekS03.uid,pcard=pk!=null?findCardByUid(pk):null;
    return [['the chosen target ゴブリン突撃部隊 is destroyed',loc(x.f1)==='1:grave'],['the other monsters are untouched',loc(x.f2)==='1:mz'&&loc(x.f3)==='1:mz'],['グラファ stays in the Graveyard (destroy branch, not the Special Summon)',loc(x.dw)==='0:grave'],['the hand peek ran once (discarded by the opponent) and the checked monster was Special Summoned to グラファ\'s controller',peeks()===1&&!!pcard&&pcard.p===0&&pcard.zone==='mz']];}
});
/* ゴルド: 捨てられた → 墓地から特殊召喚。相手の効果ならさらに相手のカードを 2 枚まで選択して破壊できる。 */
addCard(GO,'GOLD',{
  pref:x=>[x.f1.uid,x.f2.uid],
  self:x=>[['ゴルド is Special Summoned from the Graveyard',loc(x.dw)==='0:mz'],['no opponent card is destroyed (discarded by its own side)',loc(x.f1)==='1:mz'&&loc(x.f2)==='1:mz'&&loc(x.f3)==='1:mz']],
  opp:x=>[['ゴルド is Special Summoned from the Graveyard',loc(x.dw)==='0:mz'],['the 2 chosen opponent cards are destroyed (the "さらに" clause of an opponent-effect discard)',loc(x.f1)==='1:grave'&&loc(x.f2)==='1:grave'],['the unchosen monster stays',loc(x.f3)==='1:mz']]
});
/* ブラウ: 捨てられた → 1 枚ドロー。相手の効果ならさらにもう 1 枚。 */
addCard(BL,'BLAU',{
  self:x=>[['ブラウ stays in the Graveyard',loc(x.dw)==='0:grave'],['P0 hand = the kept ワイト + the 暗黒界の門 draw + 1 draw of ブラウ (3)',hand(0)===3]],
  opp:x=>[['ブラウ stays in the Graveyard',loc(x.dw)==='0:grave'],['P0 hand = the 手札抹殺 draw + 2 draws of ブラウ (3): the extra draw of an opponent-effect discard happened',hand(0)===3]]
});
/* シルバ: 捨てられた → 墓地から特殊召喚。相手の効果ならさらに相手は手札を 2 枚選択してデッキの下に戻す。 */
addCard(SI,'SILVA',{
  self:x=>[['シルバ is Special Summoned from the Graveyard',loc(x.dw)==='0:mz'],['the opponent returned nothing (P1 hand stays 2)',hand(1)===2]],
  opp:x=>[['シルバ is Special Summoned from the Graveyard',loc(x.dw)==='0:mz'],['the opponent returned 2 hand cards to the bottom of the Deck (P1 hand 0)',hand(1)===0]]
});
/* スノウ: 捨てられた → デッキから「暗黒界」1 枚を手札に加える。相手の効果ならさらに相手の墓地のモンスター 1 体を選択して自分フィールドに表側守備表示で特殊召喚できる。 */
addCard(SN,'SNOW',{
  pref:x=>[x.srch.uid,x.pg.uid],
  self:x=>[['スノウ stays in the Graveyard','0:grave'===loc(x.dw)],['the 暗黒界 card was added from the Deck',loc(x.srch)==='0:hand'],['the opponent Graveyard monster was not Special Summoned (discarded by its own side)',loc(x.pg)==='1:grave']],
  opp:x=>[['スノウ stays in the Graveyard','0:grave'===loc(x.dw)],['the 暗黒界 card was added from the Deck',loc(x.srch)==='0:hand'],['the chosen opponent Graveyard monster was Special Summoned face-up Defense to P0',loc(x.pg)==='0:mz'&&posOf(x.pg)==='def'&&faceOf(x.pg)==='up']]
},x=>{x.srch=mk('暗黒界の狩人 ブラウ',0);gameState.players[0].deck.push(x.srch);/* 山札の末尾 = 底（draw は先頭から引く）。ドローで引かれない */});
`;

/* ---- 同名の別個体 / コスト ---- */
const COMMON_B=String.raw`
/* 4. 同名の別個体（相手の効果）: 同名の B が、同じターンの先の効果ですでに墓地にある（discardInfo が残っている）。今回捨てられたのは A だけ。
      B は誘発してはならず（リンクは A の 1 本）、再開後の解決も A の「破壊」の枝でなければならない。名前・id・名前ベースの比較では A と B を区別できない */
SPECS.push({key:'SAME',name:GR,mode:'opp',who:'opponent effect (手札抹殺) — a same-name copy already lies in the Graveyard',
  build:()=>board('opp',GR,x=>{
    x.old=mk(GR,0);x.old.discardInfo={byEffect:true,byPlayer:0,turn:5};x.old.graveInfo={turn:5,from:'hand',byDestroy:false};x.old.moveProvenance={reason:'effect',actingPlayer:1,fromZone:'hand'};
    gameState.players[0].grave=[x.old];}),
  start:startOf('opp'),pref:x=>[x.f1.uid],
  expect:x=>[['the chosen target is destroyed (destroy branch of the copy that was actually discarded)',loc(x.f1)==='1:grave'],['the discarded copy stays in the Graveyard (not Special Summoned)',loc(x.dw)==='0:grave'],
    ['the older same-name copy was never triggered or revived: still in the Graveyard',loc(x.old)==='0:grave'],['only one グラファ link was ever put on the chain',nlink(GR)===1],['the hand peek ran once',peeks()===1]],
  extra1:x=>{const l=linksOf(GR)[0],A=findCardByUid(x.dw.uid).card,B=findCardByUid(x.old.uid).card;
    return [['the link\'s event names the discarded copy by uid, not the older copy',!!l&&l.event.uid===x.dw.uid&&l.event.uid!==x.old.uid],
      ['darkWorldDiscard recognises the discarded copy (opponent effect)',darkWorldDiscard(dwCtx(A,l.event,0))==='opponent'],
      ['darkWorldDiscard does NOT recognise the same-name older copy for that event',darkWorldDiscard(dwCtx(B,l.event,0))===null]];},
  extra2:x=>{const l=linksOf(GR)[0],A=findCardByUid(x.dw.uid).card,B=findCardByUid(x.old.uid).card;
    return [['resumed: the link\'s event still names the discarded copy by uid',!!l&&l.event.uid===x.dw.uid],
      ['resumed: the event\'s card is a copy, not the live card (the case that identity cannot recognise)',!!l&&!!l.event.card&&l.event.card!==A&&l.event.card.uid===A.uid],
      ['resumed: darkWorldDiscard recognises the discarded copy from the loaded event (opponent effect)',darkWorldDiscard(dwCtx(A,l.event,0))==='opponent'],
      ['resumed: darkWorldDiscard does NOT recognise the same-name older copy for that event',darkWorldDiscard(dwCtx(B,l.event,0))===null]];},
  track:x=>Object.keys(x).map(k=>x[k]),want:'opponent'});
/* 4b. 同名 2 枚が同じ手札抹殺で同時に捨てられる: 誘発は 1 本ずつチェーンに載る（1 本目の解決後に 2 本目）。1 本目が解決待ちの状態で保存し、
      再開後に 2 本とも、それぞれ自分の個体のイベントで「破壊」の枝で解決する */
SPECS.push({key:'TWIN',name:GR,mode:'opp',who:'opponent effect (手札抹殺) — two same-name copies discarded at once',
  build:()=>board('opp',GR,x=>{x.dw2=mk(GR,0);gameState.players[0].hand.push(x.dw2);}),
  start:startOf('opp'),pref:x=>[x.f1.uid,x.f2.uid],
  expect:x=>[['both targets are destroyed (one per link)',loc(x.f1)==='1:grave'&&loc(x.f2)==='1:grave'],['the third monster stays',loc(x.f3)==='1:mz'],
    ['both copies stay in the Graveyard (both resolved the destroy branch)',loc(x.dw)==='0:grave'&&loc(x.dw2)==='0:grave'],['two links were put on the chain, one per copy (distinct event uids)',nlink(GR)===2&&LINKS_SEEN[GR].has(x.dw.uid)&&LINKS_SEEN[GR].has(x.dw2.uid)],['each copy peeked once (2)',peeks()===2]],
  extra1:x=>{const l=linksOf(GR)[0];return [['the link on the chain carries one of the two copies by uid',!!l&&(l.event.uid===x.dw.uid||l.event.uid===x.dw2.uid)]];},
  extra2:x=>{const l=linksOf(GR)[0],own=l&&(l.event.uid===x.dw.uid?x.dw:x.dw2),oth=own===x.dw?x.dw2:x.dw;
    return [['resumed: the loaded link still carries one of the two copies by uid',!!l&&(l.event.uid===x.dw.uid||l.event.uid===x.dw2.uid)],
    ['resumed: the loaded event is recognised for its own copy (opponent effect) and not for the other same-name copy',!!l&&darkWorldDiscard(dwCtx(findCardByUid(own.uid).card,l.event,0))==='opponent'&&darkWorldDiscard(dwCtx(findCardByUid(oth.uid).card,l.event,0))===null]];},
  track:x=>Object.keys(x).map(k=>x[k]),want:'opponent'});
/* 3. コストとして捨てる（鳳翼の爆風: 手札を 1 枚捨て、相手のカード 1 枚を対象として発動 — コスト選択 U474）。コストは「カードの効果によって」ではない: 暗黒界は誘発しない */
SPECS.push({key:'COST',name:'鳳翼の爆風',mode:'cost',who:'cost (鳳翼の爆風)',
  build:()=>{fresh(0);const x={};x.trap=mk('鳳翼の爆風',0,'down');x.trap.setTurn=2;gameState.players[0].sz=[x.trap];
    x.dw=mk(GR,0);x.keep=mk('ワイト',0);gameState.players[0].hand=[x.dw,x.keep];
    x.f1=mon('ゴブリン突撃部隊',1);x.f2=mon('ギガンテス',1);x.f3=mon('ゴブリンドバーグ',1);gameState.players[1].mz=[x.f1,x.f2,x.f3];
    baselineA();return x;},
  start:()=>{duelActivateFromZone(0,'sz',0,{});},pref:x=>[x.dw.uid,x.f1.uid],link:'鳳翼の爆風',
  expect:x=>{const c=findCardByUid(x.dw.uid);return [['グラファ (discarded as a cost) stays in the Graveyard: no trigger, no Special Summon',loc(x.dw)==='0:grave'],['no グラファ link was ever put on the chain',nlink(GR)===0],
    ['the discard left no "by effect" mark on the card (discardInfo is empty for a cost)',!!c&&!c.card.discardInfo],['no destroy happened and no hand peek ran: the chosen target went to the top of its owner\'s Deck',loc(x.f1)==='1:deck'&&loc(x.f2)==='1:mz'&&loc(x.f3)==='1:mz'&&peeks()===0],
    ['darkWorldDiscard refuses a cost discard even for an event that names the card',!!c&&darkWorldDiscard(dwCtx(c.card,evOf(c.card),0))===null]];},
  extra1:()=>{const cq=SEEN.filter(s=>s.selection==='cost'),tq=SEEN.filter(s=>s.targeting===true);
    return [['the discard was chosen in a COST selection (no target immunity) before the target selection (U474)',cq.length===1&&cq[0].targeting===false&&tq.length===1&&SEEN.indexOf(cq[0])<SEEN.indexOf(tq[0])]];},
  track:x=>Object.keys(x).map(k=>x[k]),want:'cost'});
`;

/* ===== VM1: Save なし（実際の道を最後まで）+ 解決待ちのリンクがチェーンにある状態で保存 ===== */
const first=harness(COMMON+COMMON_B+String.raw`
globalThis.__SAVES={};
function locsOf(spec,x){return spec.track(x).map(c=>loc(c)+'/'+posOf(c)+'/'+faceOf(c));}
function idsOf(x){const o={};Object.keys(x).forEach(k=>{o[k]=x[k].uid;});return o;}
for(const spec of SPECS){
  const x=spec.build();SEEN=[];LINKS_SEEN={};PREFER=spec.pref(x).slice();const pref0=PREFER.slice();TOASTS.length=0;
  const lname=spec.link||spec.name,nlinks=1,tag=spec.key+' ['+spec.who+']';
  spec.start(x);
  drive(()=>linksOf(lname).length>=nlinks);
  ok(tag+': '+lname+' is on the chain, waiting to resolve (the state that is saved)',linksOf(lname).length===nlinks,JSON.stringify(gameState.chain.map(l=>l.name)));
  if(spec.mode!=='cost'&&!spec.extra1){ const l=linksOf(lname)[0],c=findCardByUid(x.dw.uid).card;
    ok(tag+': darkWorldDiscard on the live link event gives the '+spec.want+' branch',!!l&&darkWorldDiscard(dwCtx(c,l.event,0))===spec.want,String(l&&darkWorldDiscard(dwCtx(c,l.event,0)))); }
  if(spec.extra1) spec.extra1(x).forEach(e=>ok(tag+' (before save): '+e[0],e[1]));
  const raw=savedRaw(),digest=v41StateDigest(gameState);
  drive();
  ok(tag+' (no save): the chain resolved completely and no choice is left',gameState.chain.length===0&&!pc(),JSON.stringify({chain:gameState.chain.map(l=>l.name),pc:!!pc()}));
  spec.expect(x).forEach(e=>ok(tag+' (no save): '+e[0],e[1],JSON.stringify(locsOf(spec,x))));
  audit(tag+' (no save)');
  globalThis.__SAVES[spec.key]=JSON.stringify({raw,digest,final:v41StateDigest(gameState),ids:idsOf(x),locs:locsOf(spec,x),hands:[hand(0),hand(1)],pref:pref0});
}

/* ===== U471（発動準備トランザクション）がこの道でも変わらない: 準備の途中（対象選択が開いている）・誘発の提示窓で保存して再開 =====
   U471/S03-U35 の設計: 準備中の legacy 選択は復元できないので、再開時に発動を取り消して発動前（誘発の提示）へ戻す。誘発は失われず、再提示されて同じ結果になる。 */
for(const key of ['GRAPHA_self','GRAPHA_opp','GOLD_opp']){
  const spec=SPECS.find(s=>s.key===key),x=spec.build();SEEN=[];LINKS_SEEN={};PREFER=spec.pref(x).slice();const pref0=PREFER.slice();TOASTS.length=0;
  const tag='EARLY '+key+' ['+spec.who+']';
  spec.start(x);
  let offer=null,choice=null;
  for(let i=0;i<400&&!choice;i++){
    if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE&&!offer){ offer={raw:savedRaw(),digest:v41StateDigest(gameState)}; }
    if(pc()){ const q=pc(); if(q.targeting===true){ choice={raw:savedRaw(),digest:v41StateDigest(gameState),tx:!!gameState.prepTxS03,legacy:!!q.legacy}; break; } pick(); continue; }
    if(!step())break; }
  ok(tag+': a save was taken in the trigger offer window and again while the target choice of the activation was open (preparation in progress)',!!offer&&!!choice&&choice.tx===true,JSON.stringify({offer:!!offer,choice:!!choice}));
  drive();
  spec.expect(x).forEach(e=>ok(tag+' (uninterrupted run): '+e[0],e[1]));
  globalThis.__SAVES['EARLY_'+key]=JSON.stringify({offer,choice,ids:idsOf(x),locs:locsOf(spec,x),hands:[hand(0),hand(1)],pref:pref0});
}

/* ===== 5. uid が無いカード（直接構成。実際の道は ensureCardUid がイベント作成時に uid を付ける）===== */
function raw(name,extra){const c={id:findCardIndex(name),owner:0,controller:0,face:'up',pos:'atk',discardInfo:{byEffect:true,byPlayer:0,turn:5}};return Object.assign(c,extra||{});}
{ resetA();baselineA();
  const a=raw(GR),b=raw(GR);
  ok('MU precondition: the two cards have no uid',a.uid===undefined&&b.uid===undefined&&a!==b);
  ok('MU 1: two different cards, both without a uid, are NOT conflated (undefined === undefined is not a match)',darkWorldDiscard(dwCtx(b,{player:0,card:a,byEffect:true,byPlayer:0},0))===null);
  ok('MU 2: the very same uid-less object still matches itself (identity is the only fallback when a uid is missing)',darkWorldDiscard(dwCtx(a,{player:0,card:a,byEffect:true,byPlayer:0},0))==='self');
  ok('MU 3: a uid-less event card and a uid-less copy of it do not match (nothing proves they are the same card; the real path never produces this)',darkWorldDiscard(dwCtx(b,{player:0,card:copyOf(b),byEffect:true,byPlayer:0},0))===null);
  const withUid=raw(GR,{uid:9001});
  ok('MU 4: an event that carries a uid does not match a card that has none',darkWorldDiscard(dwCtx(a,{player:0,uid:9001,byEffect:true,byPlayer:0},0))===null&&darkWorldDiscard(dwCtx(a,{player:0,uid:9001,card:withUid,byEffect:true,byPlayer:0},0))===null);
  ok('MU 5: an event card without a uid does not match a card that has one',darkWorldDiscard(dwCtx(withUid,{player:0,card:a,byEffect:true,byPlayer:0},0))===null);
  ok('MU 6: both present — equal uids match even when the event card is a copy; different uids do not',darkWorldDiscard(dwCtx(withUid,{player:0,uid:9001,card:copyOf(withUid),byEffect:true,byPlayer:0},0))==='self'&&darkWorldDiscard(dwCtx(withUid,{player:0,uid:9002,byEffect:true,byPlayer:0},0))===null&&darkWorldDiscard(dwCtx(withUid,{player:0,card:copyOf(raw(GR,{uid:9002})),byEffect:true,byPlayer:0},0))===null);
  ok('MU 7: an event that names no card at all is not compared (unchanged behaviour)',darkWorldDiscard(dwCtx(a,{player:0,byEffect:true,byPlayer:0},0))==='self');
}
/* 実際の道: uid の無いカードが効果で捨てられると、イベント作成時（queueDeferredEventV2）に ensureCardUid が uid を付け、そのカードだけが誘発する。
   墓地にある uid の無い同名の別カード（discardInfo が残っている）は誘発しない（修正前は uid の比較が飛ばされて誘発した）。 */
{ resetA();gameState.activePlayer=1;gameState.phase='main1';
  const A=raw(GR,{discardInfo:null}),B=raw(GR);
  gameState.players[0].hand=[A];gameState.players[0].grave=[B];gameState.players[0].deck=[];gameState.players[1].deck=[];
  ok('MU real path precondition: both cards have no uid',A.uid===undefined&&B.uid===undefined);
  API.discard(0,0,'S03-U477 fixture',{byEffect:true,byPlayer:1});
  const ev=evs('onDiscard')[0],inGrave=gameState.players[0].grave.find(c=>c!==B);
  ok('MU real path: the discard event was created with a uid (ensureCardUid at the event source) and the discarded card has that uid',!!ev&&ev.uid!=null&&!!inGrave&&inGrave.uid===ev.uid&&B.uid===undefined,JSON.stringify(ev));
  const hs=collectHandlers('onDiscard',ev).map(h=>h.name+'#'+(h.card===B?'B':(h.card===inGrave?'A':'?')));
  ok('MU real path: only the discarded card is offered the trigger; the uid-less same-name card in the Graveyard is not',hs.length===1&&hs[0]===GR+'#A',JSON.stringify(hs));
}
`);

/* ===== VM2: 新しい VM で読み込んで解決（実際の保存・再開の道: saveDuel → 新 VM → offerResumeDuel）===== */
const SAVES=first.__SAVES||{};
const NEED=['GRAPHA','GOLD','BLAU','SILVA','SNOW'].reduce((a,k)=>a.concat([k+'_self',k+'_opp']),['SAME','TWIN','COST','EARLY_GRAPHA_self','EARLY_GRAPHA_opp','EARLY_GOLD_opp']);
if(NEED.some(k=>!SAVES[k])){console.log('FAIL Save/Load VM1 saves missing: '+NEED.filter(k=>!SAVES[k]).join(','));process.exitCode=2;}
else harness('const SAVES='+JSON.stringify(SAVES)+';'+COMMON+COMMON_B+String.raw`
for(const spec of SPECS){
  const o=JSON.parse(SAVES[spec.key]),lname=spec.link||spec.name,nlinks=1,tag=spec.key+' ['+spec.who+']';
  resetA();CHOICE_LEGACY_CB_V49.clear();localStorage.setItem(DUEL_SAVE_KEY,o.raw);TOASTS.length=0;SEEN=[];LINKS_SEEN={};
  const resumed=offerResumeDuel();
  const x={};Object.keys(o.ids).forEach(k=>{x[k]={uid:o.ids[k]};});
  ok(tag+' (Save/Load): resumed with '+lname+' on the chain and the digest equal to the saved one',!!resumed&&linksOf(lname).length===nlinks&&v41StateDigest(gameState)===o.digest,JSON.stringify({resumed,chain:gameState.chain.map(l=>l.name)}));
  if(spec.mode!=='cost'&&!spec.extra2){ const l=linksOf(lname)[0],c=findCardByUid(x.dw.uid).card;
    ok(tag+' (Save/Load): on the LOADED link, darkWorldDiscard gives the '+spec.want+' branch (the event card is a copy after the load)',!!l&&darkWorldDiscard(dwCtx(c,l.event,0))===spec.want,String(l&&darkWorldDiscard(dwCtx(c,l.event,0)))); }
  if(spec.extra2) spec.extra2(x).forEach(e=>ok(tag+' (Save/Load): '+e[0],e[1]));
  PREFER=o.pref.slice();
  drive();
  ok(tag+' (Save/Load): the chain resolved completely and no choice is left',gameState.chain.length===0&&!pc(),JSON.stringify({chain:gameState.chain.map(l=>l.name),pc:!!pc()}));
  spec.expect(x).forEach(e=>ok(tag+' (Save/Load): '+e[0],e[1],JSON.stringify(spec.track(x).map(c=>loc(c)+'/'+posOf(c)+'/'+faceOf(c)))));
  ok(tag+' (Save/Load): every tracked card ends where it ended in the uninterrupted run (location / position / face), and so do both hand sizes',JSON.stringify(spec.track(x).map(c=>loc(c)+'/'+posOf(c)+'/'+faceOf(c)))===JSON.stringify(o.locs)&&hand(0)===o.hands[0]&&hand(1)===o.hands[1],JSON.stringify({vm2:spec.track(x).map(c=>loc(c)+'/'+posOf(c)+'/'+faceOf(c)),vm1:o.locs,hands:[hand(0),hand(1)],h1:o.hands}));
  ok(tag+' (Save/Load): the final digest equals the uninterrupted run',v41StateDigest(gameState)===o.final,v41StateDigest(gameState)+' vs '+o.final);
  audit(tag+' (Save/Load)');
}

/* U471: 準備の途中・誘発の提示窓で保存したものを読み込む */
for(const key of ['GRAPHA_self','GRAPHA_opp','GOLD_opp']){
  const spec=SPECS.find(s=>s.key===key),o=JSON.parse(SAVES['EARLY_'+key]),tag='EARLY '+key+' ['+spec.who+']';
  const x={};Object.keys(o.ids).forEach(k=>{x[k]={uid:o.ids[k]};});
  for(const at of ['offer','choice']){
    const sv=o[at];
    resetA();CHOICE_LEGACY_CB_V49.clear();localStorage.setItem(DUEL_SAVE_KEY,sv.raw);TOASTS.length=0;SEEN=[];LINKS_SEEN={};
    const resumed=offerResumeDuel();
    if(at==='offer') ok(tag+' saved in the offer window (Save/Load): resumed with the offer window restored and the digest equal to the saved one',!!resumed&&!!EVT_V2_STATE&&!pc()&&v41StateDigest(gameState)===sv.digest,JSON.stringify({resumed,evt:!!EVT_V2_STATE}));
    else if(key==='GOLD_opp') ok(tag+' saved while the target choice was open (Save/Load): the registered U480 exact-count choice is restored with its preparation transaction',!!resumed&&!!gameState.prepTxS03&&!!pc()&&pc().resume&&pc().resume.mode==='registry'&&assertChoiceSerializableV49(gameState).ok,JSON.stringify({resumed,tx:!!gameState.prepTxS03,resume:pc()&&pc().resume}));
    else ok(tag+' saved while the target choice was open (Save/Load): the interrupted activation was undone by the U471/S03-U35 path (the legacy choice cannot be restored), the player was told, and no stale preparation record or choice is left',!!resumed&&TOASTS.some(t=>/発動を取り消し/.test(t))&&!gameState.prepTxS03&&!pc()&&gameState.chain.length===0,JSON.stringify({resumed,toasts:TOASTS,tx:!!gameState.prepTxS03,pc:!!pc()}));
    PREFER=o.pref.slice();drive();
    ok(tag+' saved '+(at==='offer'?'in the offer window':'with the target choice open')+' (Save/Load): the trigger is not lost — it is offered again and resolves to the same result as the uninterrupted run',gameState.chain.length===0&&!pc()&&JSON.stringify(spec.track(x).map(c=>loc(c)+'/'+posOf(c)+'/'+faceOf(c)))===JSON.stringify(o.locs)&&hand(0)===o.hands[0]&&hand(1)===o.hands[1],JSON.stringify({vm2:spec.track(x).map(c=>loc(c)+'/'+posOf(c)+'/'+faceOf(c)),vm1:o.locs}));
    spec.expect(x).forEach(e=>ok(tag+' saved '+(at==='offer'?'in the offer window':'with the target choice open')+' (Save/Load): '+e[0],e[1]));
    audit(tag+' saved '+(at==='offer'?'in the offer window':'with the target choice open')+' (Save/Load)');
  }
}
`);
