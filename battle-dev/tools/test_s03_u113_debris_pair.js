/* S03-U113: カードガンナー + デブリ・ドラゴン — priority #7's IMPLEMENTED tier, main-deck qty=2 (debris).
   カードガンナー 2011 text: 1ターンに1度、自分のデッキの上からカードを3枚まで墓地へ送る事ができる。この効果で墓地へ
   送ったカード1枚につき、このカードの攻撃力はエンドフェイズ時まで500ポイントアップする。また、自分フィールド上に
   存在するこのカードが破壊され墓地へ送られた時、自分のデッキからカードを1枚ドローする。
   (2011: sending is part of the effect, not a cost — the later "送って発動できる" errata is not applied.)
   Measured (U112 build): the count could not be chosen (always min(3, deck)), and the "destroyed → draw 1" clause
   did not exist at all (destroyed by battle: no draw).
   デブリ・ドラゴン 2011 text: 召喚成功時、自分の墓地の攻撃力500以下のモンスター1体を選択して攻撃表示で特殊召喚できる。
   この効果で特殊召喚したモンスターの効果は無効化される。このカードをシンクロ素材とする場合、ドラゴン族モンスターの
   シンクロ召喚にしか使用できず、他のシンクロ素材モンスターは全てレベル4以外のモンスターでなければならない。
   Defects: the Synchro-material restriction was not implemented; resolve() summoned by the stale GY index and then
   negated "the last monster in the zone" instead of the summoned card. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.phase='main1';gameState.turn=3;}
function drive(){for(let i=0;i<300;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(EVT_V2_STATE)return 'evt';
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
/* optional triggers are taken (eventPickV2) — the tests below assert which ones are offered */
function settle(){for(let k=0;k<16;k++){const r=drive();if(r==='evt'){eventPickV2(0);continue;}return r;}return 'loop';}
function labels(){const pc=pendingChoiceV49(gameState);return pc?pc.candidates.map(x=>String(x.label||'')):[];}
function pick(match){const pc=pendingChoiceV49(gameState);if(!pc)throw Error('choice missing for '+match+' toasts='+JSON.stringify(TOASTS.slice(-3)));
  const i=pc.candidates.findIndex(x=>{const h=x.uid!=null&&findCardByUid(x.uid);return (h&&nm(h.card)===match)||String(x.label||'')===match||String(x.label||'').includes(match);});
  if(i<0)throw Error('candidate '+match+' missing: '+JSON.stringify(labels()));__choicePickV49(i);}
function names(p,z){return (gameState.players[p][z]||[]).map(nm);}
function attack(p,atkIdx,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx,target});settle();}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,300));}
function deckOf(n){return Array.from({length:n},()=>mk('ワイト',0));}
`;

/* ===== A. カードガンナー ① — the count is chosen (1–3), ATK +500 per card, once per turn ===== */
harness(COMMON+String.raw`
fresh();
const cg=mk('カードガンナー',0,'up');gameState.players[0].mz=[cg];gameState.players[0].deck=deckOf(5);
baselineA();
const base=curATK(cg);
duelActivateFromZone(0,'mz',0);let st=settle();
ok('A: resolution asks how many cards to send (1, 2 or 3)',st==='choice'&&labels().join()==='1枚,2枚,3枚',JSON.stringify({st,labels:labels()}));
__choiceCancelV49();st=drive();
ok('A: the count prompt cannot be skipped',st==='choice'&&gameState.players[0].deck.length===5,JSON.stringify({st,deck:gameState.players[0].deck.length}));
pick('2枚');settle();
ok('A: choosing 2 sends exactly 2 cards from the top of the Deck',names(0,'grave').length===2&&gameState.players[0].deck.length===3,JSON.stringify({g:names(0,'grave'),deck:gameState.players[0].deck.length}));
ok('A: ATK +1000 (2 × 500)',curATK(cg)===base+1000,JSON.stringify([base,curATK(cg)]));
audit('A');
const L2=strictScriptLegalityV2('カードガンナー',0,'mz',0,{});
ok('A: once per turn — a second activation this turn is illegal',!L2.ok,JSON.stringify(L2));

fresh();
const cg2=mk('カードガンナー',0,'up');gameState.players[0].mz=[cg2];gameState.players[0].deck=deckOf(2);
baselineA();
duelActivateFromZone(0,'mz',0);st=settle();
ok('A: with 2 cards in the Deck only 1 or 2 is offered',st==='choice'&&labels().join()==='1枚,2枚',JSON.stringify(labels()));
pick('1枚');settle();
ok('A: choosing 1 sends 1 and gives +500',names(0,'grave').length===1&&curATK(cg2)===dbOf(cg2).atk+500,JSON.stringify({g:names(0,'grave'),atk:curATK(cg2)}));
audit('A2');
`);

/* ===== B. カードガンナー ② — destroyed and sent to the GY → draw 1 (mandatory) ===== */
harness(COMMON+String.raw`
/* B1 battle */
fresh();gameState.activePlayer=1;gameState.phase='battle';
gameState.players[0].mz=[mk('カードガンナー',0,'up')];gameState.players[0].deck=[mk('サイクロン',0)];
gameState.players[1].mz=[mk('ダーク・アームド・ドラゴン',1,'up')];
baselineA();
attack(1,0,0);
ok('B1: destroyed by battle → it draws 1',names(0,'grave').includes('カードガンナー')&&names(0,'hand').join()==='サイクロン',JSON.stringify({g:names(0,'grave'),hand:names(0,'hand')}));
audit('B1');

/* B2 effect destruction, after its once-per-turn ignition was used this turn */
fresh();
const cg=mk('カードガンナー',0,'up');gameState.players[0].mz=[cg];gameState.players[0].deck=deckOf(4).concat([mk('サイクロン',0)]);
gameState.players[1].sz=[(()=>{const x=mk('サンダー・ボルト',1,'down');x.setTurn=2;return x;})()];
baselineA();
duelActivateFromZone(0,'mz',0);settle();pick('1枚');settle();
gameState.activePlayer=1;
duelActivateFromZone(1,'sz',0);settle();
ok('B2: destroyed by サンダー・ボルト after using ① this turn → still draws 1 (the draw is not limited)',
  names(0,'grave').includes('カードガンナー')&&names(0,'hand').length===1,JSON.stringify({g:names(0,'grave'),hand:names(0,'hand')}));

/* B3 sent to the GY without being destroyed (tributed) → no draw */
fresh();
gameState.players[0].mz=[mk('カードガンナー',0,'up')];gameState.players[0].hand=[mk('人造人間－サイコ・ショッカー',0)];gameState.players[0].deck=[mk('サイクロン',0)];
baselineA();
doNormalSummon(0,'atk');if(pendingChoiceV49(gameState))pick('カードガンナー');settle();
ok('B3: tributed (not destroyed) → no draw',names(0,'grave').includes('カードガンナー')&&!names(0,'hand').length&&gameState.players[0].deck.length===1,
  JSON.stringify({g:names(0,'grave'),hand:names(0,'hand'),mz:names(0,'mz')}));
audit('B3');
`);

/* ===== C. デブリ・ドラゴン — summon trigger revives a ≤500 ATK monster in Attack Position with its effects negated ===== */
harness(COMMON+String.raw`
fresh();
gameState.players[0].hand=[mk('デブリ・ドラゴン',0)];
const low=mk('カードガンナー',0),high=mk('BF－黒槍のブラスト',0);
gameState.players[0].grave=[high,low];
gameState.players[0].mz=[mk('ワイト',0,'up')];
baselineA();
doNormalSummon(0,'atk');let st=settle();
ok('C: the target prompt offers only the ≤500 ATK monster',st==='choice'&&labels().length===1&&labels()[0].includes('カードガンナー'),JSON.stringify({st,labels:labels()}));
pick('カードガンナー');settle();
ok('C: the target is Special Summoned in Attack Position with its effects negated; nothing else is negated',
  gameState.players[0].mz.includes(low)&&low.pos==='atk'&&low.negated===true&&!gameState.players[0].mz.find(c=>nm(c)==='ワイト').negated&&!gameState.players[0].mz.find(c=>nm(c)==='デブリ・ドラゴン').negated,
  JSON.stringify(gameState.players[0].mz.map(c=>[nm(c),c.pos,!!c.negated])));
audit('C');
`);

/* ===== D. デブリ・ドラゴン as Synchro material — Dragon Synchros only, other materials not Level 4 ===== */
harness(COMMON+String.raw`
fresh();
const debris=mk('デブリ・ドラゴン',0,'up'),lv3=mk('カードガンナー',0,'up'),lv4=mk('BF－黒槍のブラスト',0,'up');
gameState.players[0].mz=[debris,lv3];
baselineA();
/* exCombos().combos = [{materials:[mz indices], label}] */
const usesDebris=combos=>(combos||[]).some(c=>(c.materials||[]).some(i=>gameState.players[0].mz[i]===debris));
const br=exCombos(0,dbOf(mk('ブラック・ローズ・ドラゴン',0))), pt=exCombos(0,dbOf(mk('パワー・ツール・ドラゴン',0)));
ok('D: デブリ (Lv4) + a Lv3 non-Tuner can Synchro Summon a Level 7 Dragon (ブラック・ローズ・ドラゴン)',usesDebris(br.combos),JSON.stringify((br.combos||[]).length));
ok('D: … but not a Level 7 non-Dragon (パワー・ツール・ドラゴン is a Machine)',!usesDebris(pt.combos),JSON.stringify((pt.combos||[]).length));
gameState.players[0].mz=[debris,lv4];
const sd=exCombos(0,dbOf(mk('スターダスト・ドラゴン',0)));
ok('D: with a Level 4 non-Tuner it cannot be used even for a Level 8 Dragon (スターダスト・ドラゴン)',!usesDebris(sd.combos),JSON.stringify((sd.combos||[]).length));
`);
