/* Existing-engine Class A recovery, sub-batch 1: 10-card positive/negative/ruling tests. */
const fs=require('fs'),vm=require('vm'),path=require('path');const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
let U=221000;function mk(n,p=0){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);return{id,owner:p,controller:p,face:'up',pos:'atk',uid:U++};}
function dyn(pred,skip){const d=CARD_DB.find(x=>x&&x.n!==skip&&pred(x));if(!d)throw Error('fixture');return mk(d.n);}
function resetT(){gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=7;PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];resetChoiceStatsV49();v41ResetActionJournal(gameState);}
function ctx(n,z='mz',extra){const a=z==='field'?[gameState.players[0].field]:(gameState.players[0][z]||[]),c=a.find(x=>x&&cardName(x)===n);return Object.assign(makeContext(0,c,z,a.indexOf(c),'activate',{}),extra||{});}
function answer(n=1){const p=pendingChoiceV49(gameState);if(!p)throw Error('no pending');return answerChoiceV49(p.candidates.slice(0,n).map(x=>x.key));}
const R=[],ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});const N=['カタパルト・タートル','火霊術－「紅」','サイコ・ソウル','神秘の中華なべ','炎の魔精イグニス','水霊術－「葵」','超進化薬','創世者の化身','大皇帝ペンギン','スワローズ・ネスト'];
N.forEach(n=>{const s=CARD_SCRIPTS[n];ok(n+' positive: script登録',!!s&&typeof s.activationV11==='function'&&typeof s.resolve==='function');ok(n+' negative: legacy callback無し',!!s&&!s.cost&&!s.selectTargets);});

/* snapshot-driven LP effects */
resetT();let c=mk('カタパルト・タートル');gameState.players[0].mz=[c];gameState.pendingCostSnapshots=[{atk:1901}];CARD_SCRIPTS['カタパルト・タートル'].resolve(ctx('カタパルト・タートル'));ok('カタパルト・タートル positive: cost時ATK半分を切捨て',gameState.players[1].lp===7050,String(gameState.players[1].lp));ok('カタパルト・タートル ruling: 1103版はcountLimit無し',CARD_SCRIPTS['カタパルト・タートル'].countLimit==null);
resetT();c=mk('火霊術－「紅」');gameState.players[0].sz=[c];gameState.pendingCostSnapshots=[{originalAtk:2400}];CARD_SCRIPTS['火霊術－「紅」'].resolve(ctx('火霊術－「紅」','sz'));ok('火霊術－「紅」 positive: 元々の攻撃力分damage',gameState.players[1].lp===5600);
resetT();c=mk('サイコ・ソウル');gameState.players[0].sz=[c];gameState.pendingCostSnapshots=[{level:4}];CARD_SCRIPTS['サイコ・ソウル'].resolve(ctx('サイコ・ソウル','sz'));ok('サイコ・ソウル positive: cost時level×300回復',gameState.players[0].lp===9200);
resetT();c=mk('神秘の中華なべ');gameState.players[0].sz=[c];gameState.pendingCostSnapshots=[{atk:1800,def:1200}];CARD_SCRIPTS['神秘の中華なべ'].resolve(ctx('神秘の中華なべ','sz',{v4EffectKey:'def'}));ok('神秘の中華なべ positive: 発動時に選んだDEFで回復',gameState.players[0].lp===9200);
resetT();c=mk('炎の魔精イグニス');gameState.players[0].mz=[c];gameState.players[0].grave=[dyn(d=>d.k==='m'&&d.at==='炎'),dyn(d=>d.k==='m'&&d.at==='炎')];CARD_SCRIPTS['炎の魔精イグニス'].resolve(ctx('炎の魔精イグニス'));ok('炎の魔精イグニス positive: 解決時墓地の炎属性数×100',gameState.players[1].lp===7800);

/* resolution-time hidden/deck/hand choices */
resetT();c=mk('水霊術－「葵」');let water=dyn(d=>d.k==='m'&&d.at==='水');gameState.players[0].sz=[c];gameState.players[0].mz=[water];let hidden=mk('ヂェミナイ・エルフ',1);gameState.players[1].hand=[hidden];CARD_SCRIPTS['水霊術－「葵」'].resolve(ctx('水霊術－「葵」','sz'));ok('水霊術－「葵」 positive: inspect後に相手手札Choice',!!pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).player===0);ok('水霊術－「葵」 ruling: Choice前は相手手札不変',gameState.players[1].hand.length===1);answer();let hiddenLoc=findCardByUid(hidden.uid);ok('水霊術－「葵」 positive: 選択手札を墓地へ送る',!!hiddenLoc&&hiddenLoc.p===1&&hiddenLoc.zone==='grave');
resetT();c=mk('超進化薬');let rept=dyn(d=>d.k==='m'&&d.ra==='爬虫類'),dino=dyn(d=>d.k==='m'&&d.ra==='恐竜');gameState.players[0].sz=[c];gameState.players[0].mz=[rept];gameState.players[0].hand=[dino];CARD_SCRIPTS['超進化薬'].resolve(ctx('超進化薬','sz'));answer();ok('超進化薬 positive: 手札の恐竜族を特殊召喚',gameState.players[0].mz.some(x=>x.uid===dino.uid));
resetT();c=mk('創世者の化身');let creator=mk('創世神');gameState.players[0].mz=[c];gameState.players[0].hand=[creator];CARD_SCRIPTS['創世者の化身'].resolve(ctx('創世者の化身'));answer();ok('創世者の化身 positive: canonical創世神を特殊召喚',gameState.players[0].mz.some(x=>x.uid===creator.uid));
resetT();c=mk('大皇帝ペンギン');gameState.players[0].mz=[c];let pens=CARD_DB.filter(d=>d.k==='m'&&isCardInGroupV4(d,GROUP.PENGUIN)&&!sameCanonicalCardV4(d,dbOf(c))).slice(0,2).map(d=>mk(d.n));gameState.players[0].deck=pens;CARD_SCRIPTS['大皇帝ペンギン'].resolve(ctx('大皇帝ペンギン'));ok('大皇帝ペンギン ruling: 1～2体Choice',pendingChoiceV49(gameState).min===1&&pendingChoiceV49(gameState).max===2);answer(2);ok('大皇帝ペンギン positive: 2体特殊召喚',pens.every(p=>gameState.players[0].mz.some(x=>x.uid===p.uid)));
resetT();c=mk('スワローズ・ネスト');let bird=dyn(d=>d.k==='m'&&d.ra==='鳥獣'&&CARD_DB.some(q=>q!==d&&q.k==='m'&&q.ra==='鳥獣'&&q.lv===d.lv));let bird2=dyn(d=>d.k==='m'&&d.ra==='鳥獣'&&d.lv===dbOf(bird).lv,cardName(bird));gameState.players[0].sz=[c];gameState.players[0].mz=[bird];gameState.players[0].deck=[bird2];gameState.pendingCostSnapshots=[{level:dbOf(bird).lv}];CARD_SCRIPTS['スワローズ・ネスト'].resolve(ctx('スワローズ・ネスト','sz'));answer();ok('スワローズ・ネスト positive: cost時と同level鳥獣族を特殊召喚',gameState.players[0].mz.some(x=>x.uid===bird2.uid));

/* boundary negatives */
resetT();c=mk('カタパルト・タートル');gameState.players[0].mz=[];ok('カタパルト・タートル negative: リリース候補無し',!CARD_SCRIPTS['カタパルト・タートル'].condition(makeContext(0,c,'mz',-1,'activate',{})));
resetT();c=mk('火霊術－「紅」');gameState.players[0].sz=[c];gameState.players[0].mz=[dyn(d=>d.k==='m'&&d.at!=='炎')];ok('火霊術－「紅」 negative: 炎属性無し',!CARD_SCRIPTS['火霊術－「紅」'].condition(ctx('火霊術－「紅」','sz')));
resetT();c=mk('サイコ・ソウル');gameState.players[0].sz=[c];ok('サイコ・ソウル negative: サイキック族無し',!CARD_SCRIPTS['サイコ・ソウル'].condition(ctx('サイコ・ソウル','sz')));
resetT();c=mk('神秘の中華なべ');gameState.players[0].sz=[c];ok('神秘の中華なべ negative: monster無し',!CARD_SCRIPTS['神秘の中華なべ'].condition(ctx('神秘の中華なべ','sz')));
resetT();c=mk('炎の魔精イグニス');c.face='down';gameState.players[0].mz=[c];ok('炎の魔精イグニス negative: 表側炎属性無し',!CARD_SCRIPTS['炎の魔精イグニス'].condition(ctx('炎の魔精イグニス')));
resetT();c=mk('水霊術－「葵」');gameState.players[0].sz=[c];gameState.players[0].mz=[dyn(d=>d.k==='m'&&d.at==='水')];ok('水霊術－「葵」 negative: 相手手札0',!CARD_SCRIPTS['水霊術－「葵」'].condition(ctx('水霊術－「葵」','sz')));
resetT();c=mk('超進化薬');gameState.players[0].sz=[c];ok('超進化薬 negative: 爬虫類cost無し',!CARD_SCRIPTS['超進化薬'].condition(ctx('超進化薬','sz')));
resetT();c=mk('創世者の化身');gameState.players[0].mz=[c];ok('創世者の化身 negative: 手札に創世神無し',!CARD_SCRIPTS['創世者の化身'].condition(ctx('創世者の化身')));
resetT();c=mk('大皇帝ペンギン');gameState.players[0].mz=[c];ok('大皇帝ペンギン negative: deckに別ペンギン無し',!CARD_SCRIPTS['大皇帝ペンギン'].condition(ctx('大皇帝ペンギン')));
resetT();c=mk('スワローズ・ネスト');gameState.players[0].sz=[c];ok('スワローズ・ネスト negative: 同level deck候補無し',!CARD_SCRIPTS['スワローズ・ネスト'].condition(ctx('スワローズ・ネスト','sz')));
ok('sub-batch1: legacy Choice未使用',choiceStatsV49().legacy===0,'legacy='+choiceStatsV49().legacy);
globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error(e.stack||e);process.exit(1);}
