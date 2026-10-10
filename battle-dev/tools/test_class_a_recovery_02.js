/* Existing-engine Class A recovery, sub-batch 2: positive/negative/ruling tests. */
const fs=require('fs'),vm=require('vm'),path=require('path');const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
let U=222000;function mk(n,p=0){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);return{id,owner:p,controller:p,face:'up',pos:'atk',uid:U++};}
function dyn(pred,skip){const d=CARD_DB.find(x=>x&&x.n!==skip&&pred(x));if(!d)throw Error('fixture');return mk(d.n);}
function resetT(){gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=7;PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];resetChoiceStatsV49();v41ResetActionJournal(gameState);}
function ctx(n,z='sz',extra){const a=z==='field'?[gameState.players[0].field]:(gameState.players[0][z]||[]),c=a.find(x=>x&&cardName(x)===n);return Object.assign(makeContext(0,c,z,a.indexOf(c),'activate',{}),extra||{});}
function answer(n=1){const p=pendingChoiceV49(gameState);if(!p)throw Error('no pending');return answerChoiceV49(p.candidates.slice(0,n).map(x=>x.key));}
const R=[],ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});const N=['孵化','トラスト・マインド','投石部隊','ハ・デスの使い魔','玉砕指令','痛み分け','光と闇の洗礼','フォトン・ジェネレーター・ユニット','ボンディング－H2O','キッズ・ガード'];
N.forEach(n=>{const s=CARD_SCRIPTS[n];ok(n+' positive: script登録',!!s&&typeof s.activationV11==='function'&&typeof s.resolve==='function');ok(n+' negative: legacy callback無し',!!s&&!s.cost&&!s.selectTargets);});

/* 孵化: P3の支払時current levelだけを参照する。 */
resetT();let c=mk('孵化'),released=dyn(d=>d.k==='m'&&d.lv===3),insect=dyn(d=>d.k==='m'&&d.ra==='昆虫'&&d.lv===5);gameState.players[0].sz=[c];gameState.players[0].mz=[released];gameState.players[0].deck=[insect];gameState.pendingCostSnapshots=[{level:4}];CARD_SCRIPTS['孵化'].resolve(ctx('孵化'));ok('孵化 ruling: snapshot level+1だけが候補',pendingChoiceV49(gameState).candidates.length===1);answer();ok('孵化 positive: v16適用後level+1昆虫を特殊召喚',gameState.players[0].mz.some(x=>x.uid===insect.uid));
resetT();c=mk('孵化');gameState.players[0].sz=[c];ok('孵化 negative: リリース候補無し',!CARD_SCRIPTS['孵化'].condition(ctx('孵化')));

/* トラスト・マインド: snapshot levelの厳密な半分かつv17現在チューナー。 */
resetT();c=mk('トラスト・マインド');let tuner=dyn(d=>d.k==='m'&&d.lv===2&&(d.st||[]).includes('チューナー'));gameState.players[0].sz=[c];gameState.players[0].grave=[tuner];gameState.pendingCostSnapshots=[{level:4}];CARD_SCRIPTS['トラスト・マインド'].resolve(ctx('トラスト・マインド'));ok('トラスト・マインド ruling: levelは厳密に半分',pendingChoiceV49(gameState).candidates.length===1);answer();ok('トラスト・マインド positive: v17 tunerを墓地回収',gameState.players[0].hand.some(x=>x.uid===tuner.uid));
resetT();c=mk('トラスト・マインド');let non=dyn(d=>d.k==='m'&&d.lv===2&&!(d.st||[]).includes('チューナー'));gameState.players[0].sz=[c];gameState.players[0].mz=[dyn(d=>d.k==='m'&&d.lv===4)];gameState.players[0].grave=[non];ok('トラスト・マインド negative: 非チューナーだけでは不可',!CARD_SCRIPTS['トラスト・マインド'].condition(ctx('トラスト・マインド')));

/* 投石部隊: 自身を含むcost後もsource ATK snapshotで解決。 */
resetT();c=mk('投石部隊');let low=dyn(d=>d.k==='m'&&(d.def||0)<=900);gameState.players[0].mz=[c];gameState.players[1].mz=[low];let tc=ctx('投石部隊','mz',{chainLink:{activationCost:[{kind:'source-stat',snapshots:[{atk:900}]}]}});CARD_SCRIPTS['投石部隊'].resolve(tc);ok('投石部隊 ruling: source snapshotで解決時Choice',!!pendingChoiceV49(gameState));answer();ok('投石部隊 positive: snapshot ATK以下のDEFを破壊',findCardByUid(low.uid).zone==='grave');
resetT();c=mk('投石部隊');gameState.players[0].mz=[dyn(d=>d.k==='m'&&d.ra!=='戦士')];ok('投石部隊 negative: 戦士族cost無し',!CARD_SCRIPTS['投石部隊'].condition(makeContext(0,c,'mz',-1,'activate',{})));

/* ハ・デスの使い魔: v14 modifierはsource離脱後も残り、target裏側化で消える。 */
resetT();c=mk('ハ・デスの使い魔');let fiend=dyn(d=>d.k==='m'&&d.ra==='悪魔','ハ・デスの使い魔');gameState.players[0].mz=[fiend];let hc=makeContext(0,c,'grave',-1,'resolve',{});hc.selectedTargets=[{card:fiend}];CARD_SCRIPTS['ハ・デスの使い魔'].resolve(hc);ok('ハ・デスの使い魔 positive: +700/+700',curATK(fiend)===(dbOf(fiend).atk||0)+700&&curDEF(fiend)===(dbOf(fiend).def||0)+700);act({type:'FX_SET_STATE',player:0,zone:'mz',index:0,face:'down'});ok('ハ・デスの使い魔 ruling: 裏側化でmodifier失効',curATK(fiend)===(dbOf(fiend).atk||0));
resetT();c=mk('ハ・デスの使い魔');gameState.players[0].mz=[dyn(d=>d.k==='m'&&d.ra!=='悪魔')];ok('ハ・デスの使い魔 negative: 表側悪魔族無し',!CARD_SCRIPTS['ハ・デスの使い魔'].condition(makeContext(0,c,'mz',-1,'activate',{})));

/* 玉砕指令: activation targetを解決時にリリース後、0～2枚を選ぶ。 */
resetT();c=mk('玉砕指令');let normal=dyn(d=>d.k==='m'&&d.lv<=2&&(d.st||[]).includes('通常')),s1=mk('強欲な壺',1),s2=mk('サイクロン',1);gameState.players[0].sz=[c];gameState.players[0].mz=[normal];gameState.players[1].sz=[s1,s2];CARD_SCRIPTS['玉砕指令'].resolve(ctx('玉砕指令','sz',{selectedTargets:[{card:normal}]}));ok('玉砕指令 ruling: 最大2枚・0枚選択可',pendingChoiceV49(gameState).min===0&&pendingChoiceV49(gameState).max===2);answer(2);ok('玉砕指令 positive: 2枚まで破壊',findCardByUid(s1.uid).zone==='grave'&&findCardByUid(s2.uid).zone==='grave');
resetT();c=mk('玉砕指令');let tok=mk('ヒーロー・キッズ');tok.token=true;gameState.players[0].sz=[c];gameState.players[0].mz=[tok];ok('玉砕指令 negative: token不可',!CARD_SCRIPTS['玉砕指令'].condition(ctx('玉砕指令')));

/* 痛み分け: 相手playerのmandatory choice。 */
resetT();c=mk('痛み分け');let own=dyn(d=>d.k==='m'),foe=dyn(d=>d.k==='m','青眼の白龍');foe.owner=foe.controller=1;gameState.players[0].sz=[c];gameState.players[0].mz=[own];gameState.players[1].mz=[foe];CARD_SCRIPTS['痛み分け'].resolve(ctx('痛み分け'));ok('痛み分け ruling: 相手側mandatory ChoiceRequest',pendingChoiceV49(gameState).player===1&&!pendingChoiceV49(gameState).cancelable);answer();ok('痛み分け positive: 相手が選んだmonsterをリリース',findCardByUid(foe.uid).zone==='grave');
resetT();c=mk('痛み分け');gameState.players[0].sz=[c];gameState.players[0].mz=[dyn(d=>d.k==='m')];ok('痛み分け negative: 相手monster無し',!CARD_SCRIPTS['痛み分け'].condition(ctx('痛み分け')));

function testSpecial(name,source,target){resetT();c=mk(name);let out=mk(target);gameState.players[0].sz=[c];gameState.players[0][source]=[out];CARD_SCRIPTS[name].resolve(ctx(name));answer();return gameState.players[0].mz.some(x=>x.uid===out.uid);}
ok('光と闇の洗礼 positive: 手札からcanonical特殊召喚',testSpecial('光と闇の洗礼','hand','混沌の黒魔術師'));ok('光と闇の洗礼 ruling: デッキからcanonical特殊召喚',testSpecial('光と闇の洗礼','deck','混沌の黒魔術師'));ok('光と闇の洗礼 ruling: 墓地からcanonical特殊召喚',testSpecial('光と闇の洗礼','grave','混沌の黒魔術師'));
resetT();c=mk('光と闇の洗礼');gameState.players[0].sz=[c];gameState.players[0].mz=[dyn(d=>d.k==='m')];gameState.players[0].hand=[mk('混沌の黒魔術師')];ok('光と闇の洗礼 negative: canonicalブラック・マジシャン無し',!CARD_SCRIPTS['光と闇の洗礼'].condition(ctx('光と闇の洗礼')));
ok('フォトン・ジェネレーター・ユニット positive: deckからLaser特殊召喚',testSpecial('フォトン・ジェネレーター・ユニット','deck','サイバー・レーザー・ドラゴン'));
resetT();c=mk('フォトン・ジェネレーター・ユニット');gameState.players[0].sz=[c];gameState.players[0].mz=[mk('サイバー・ドラゴン')];gameState.players[0].hand=[mk('サイバー・レーザー・ドラゴン')];ok('フォトン・ジェネレーター・ユニット negative: canonical Cyber Dragon 1体では不可',!CARD_SCRIPTS['フォトン・ジェネレーター・ユニット'].condition(ctx('フォトン・ジェネレーター・ユニット')));ok('フォトン・ジェネレーター・ユニット ruling: exact 2指定',CARD_SCRIPTS['フォトン・ジェネレーター・ユニット'].activationV11.toString().includes('min:2,max:2'));
ok('ボンディング－H2O positive: graveからWater Dragon特殊召喚',testSpecial('ボンディング－H2O','grave','ウォーター・ドラゴン'));
resetT();c=mk('ボンディング－H2O');gameState.players[0].sz=[c];gameState.players[0].mz=[mk('ハイドロゲドン'),mk('ハイドロゲドン')];gameState.players[0].hand=[mk('ウォーター・ドラゴン')];ok('ボンディング－H2O negative: オキシゲドン不足',!CARD_SCRIPTS['ボンディング－H2O'].condition(ctx('ボンディング－H2O')));ok('ボンディング－H2O ruling: Hydro exact 2',CARD_SCRIPTS['ボンディング－H2O'].activationV11.toString().includes('min:2,max:2'));

/* キッズ・ガード: opponent attack window only; negate then P4 E-HERO search. */
resetT();c=mk('キッズ・ガード');let kid=mk('ヒーロー・キッズ'),hero=dyn(d=>d.k==='m'&&isSetCardV4(d,SETCODE.ELEMENTAL_HERO));gameState.players[0].sz=[c];gameState.players[0].mz=[kid];gameState.players[0].deck=[hero];gameState.pendingAttack={player:1,attackerUid:U++};let kc=ctx('キッズ・ガード');ok('キッズ・ガード ruling: 相手攻撃宣言時のみlegal',CARD_SCRIPTS['キッズ・ガード'].condition(kc));CARD_SCRIPTS['キッズ・ガード'].resolve(kc);ok('キッズ・ガード positive: Battle v6で攻撃無効',gameState.attackNegated===true&&V41_ACTION_JOURNAL.some(x=>x.action.type==='NEGATE_ATTACK_V45'));answer();ok('キッズ・ガード positive: P4 E-HEROを検索',gameState.players[0].hand.some(x=>x.uid===hero.uid));
resetT();c=mk('キッズ・ガード');gameState.players[0].sz=[c];gameState.players[0].mz=[mk('ヒーロー・キッズ')];gameState.players[0].deck=[dyn(d=>d.k==='m'&&isSetCardV4(d,SETCODE.ELEMENTAL_HERO))];ok('キッズ・ガード negative: 攻撃宣言外では不可',!CARD_SCRIPTS['キッズ・ガード'].condition(ctx('キッズ・ガード')));
ok('sub-batch2: legacy Choice未使用',choiceStatsV49().legacy===0,'legacy='+choiceStatsV49().legacy);globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error(e.stack||e);process.exit(1);}
