/* Class A round 2, sub-batch 6: positive / negative / ruling-edge tests. */
const fs=require('fs'),vm=require('vm'),path=require('path');const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
let U=426000;function mk(n,p=0){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);return{id,owner:p,controller:p,face:'up',pos:'atk',uid:U++};}
function dyn(pred,skip){const d=CARD_DB.find(x=>x&&x.n!==skip&&pred(x));if(!d)throw Error('fixture');return mk(d.n);}
function resetT(){gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='battle';gameState.turn=12;PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];v41ResetActionJournal(gameState);}
const R=[],ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});const N=['E・HERO エッジマン','ランサー・ドラゴニュート','ランス・リンドブルム','アマゾネスの格闘戦士','モンク・ファイター','軍隊ピラニア','アステカの石像','スピリットバリア','覚醒','闇の破神剣'];N.forEach(n=>ok(n+' positive: script登録',!!CARD_SCRIPTS[n]));

/* 3枚の貫通は同じ中央計算hookを使い、自身が攻撃するDEF戦だけ差分を返す。 */
for(const n of ['E・HERO エッジマン','ランサー・ドラゴニュート','ランス・リンドブルム']){
  resetT();const a=mk(n),d=mk('ワイト',1),o=mk('青眼の白龍',1);d.pos='def';gameState.players[0].mz=[a];gameState.players[1].mz=[d,o];const f=CARD_SCRIPTS[n].continuous.piercingDamage;
  ok(n+' positive: DEF<ATKの差分',f({self:a,atkCard:a,defCard:d})===Math.max(0,curATK(a)-curDEF(d)));
  API.setDef(findCardByUid(d.uid),curATK(a)+100,'endTurn','fixture');ok(n+' negative: DEF>=ATKなら0',f({self:a,atkCard:a,defCard:d})===0);
  d.pos='atk';ok(n+' negative: 攻撃表示相手には貫通なし',f({self:a,atkCard:a,defCard:d})===0);
  d.pos='def';d.face='down';API.clearStatMods(findCardByUid(d.uid),'fixture');ok(n+' ruling: 裏側守備でも差分',f({self:a,atkCard:a,defCard:d})===Math.max(0,curATK(a)-curDEF(d)));
  ok(n+' negative: 自身が攻撃していない戦闘',f({self:a,atkCard:o,defCard:d})===0);
}
resetT();let edge=mk('E・HERO エッジマン');gameState.players[0].mz=[edge];let lp=gameState.players[1].lp;act({type:'ATTACK',player:0,atkIdx:0,target:'direct'});ok('エッジマン ruling: direct attackは通常ATKダメージ',gameState.players[1].lp===lp-curATK(edge));

/* 自身の戦闘で自分が受けるダメージだけ0。 */
for(const n of ['アマゾネスの格闘戦士','モンク・ファイター']){
  resetT();const self=mk(n),foe=mk('青眼の白龍',1),other=mk('ワイト');gameState.players[0].mz=[self,other];gameState.players[1].mz=[foe];const f=CARD_SCRIPTS[n].continuous.battleDamage;
  ok(n+' positive: 格上へ攻撃して受ける戦闘ダメージ0',f({self,srcPlayer:0,to:0,amount:1700,atkCard:self,defCard:foe,direct:false})===0);
  ok(n+' ruling: 攻撃された場合も自分の戦闘ダメージ0',f({self,srcPlayer:0,to:0,amount:1700,atkCard:foe,defCard:self,direct:false})===0);
  ok(n+' negative: 相手へ与えるダメージは0にしない',f({self,srcPlayer:0,to:1,amount:400,atkCard:self,defCard:foe,direct:false})===400);
  ok(n+' negative: 別モンスターの戦闘へ影響なし',f({self,srcPlayer:0,to:0,amount:2700,atkCard:other,defCard:foe,direct:false})===2700);
}

/* 軍隊ピラニア: この攻撃者の直接戦闘ダメージだけ倍。 */
resetT();let fish=mk('軍隊ピラニア'),other=mk('ワイト');gameState.players[0].mz=[fish,other];let f=CARD_SCRIPTS['軍隊ピラニア'].continuous.battleDamage;ok('軍隊ピラニア positive: direct damageを倍',f({self:fish,srcPlayer:0,to:1,amount:800,atkCard:fish,defCard:null,direct:true})===1600);ok('軍隊ピラニア negative: モンスター戦闘は等倍',f({self:fish,srcPlayer:0,to:1,amount:800,atkCard:fish,defCard:other,direct:false})===800);ok('軍隊ピラニア ruling: ATK0なら0',f({self:fish,srcPlayer:0,to:1,amount:0,atkCard:fish,defCard:null,direct:true})===0);ok('軍隊ピラニア negative: 他モンスター直接攻撃は等倍',f({self:fish,srcPlayer:0,to:1,amount:300,atkCard:other,defCard:null,direct:true})===300);

/* アステカ: 相手が自身を攻撃して相手が受ける反射ダメージだけ倍。 */
resetT();let az=mk('アステカの石像'),atk=mk('ワイト',1),own=mk('ワイト');az.pos='def';gameState.players[0].mz=[az,own];gameState.players[1].mz=[atk];f=CARD_SCRIPTS['アステカの石像'].continuous.battleDamage;ok('アステカ positive: 攻撃者への反射ダメージ倍',f({self:az,srcPlayer:0,to:1,amount:1700,atkCard:atk,defCard:az,atkOwner:1,direct:false})===3400);ok('アステカ negative: 自身から攻撃した場合は等倍',f({self:az,srcPlayer:0,to:0,amount:300,atkCard:az,defCard:atk,atkOwner:0,direct:false})===300);ok('アステカ ruling: 他モンスターの戦闘は等倍',f({self:az,srcPlayer:0,to:1,amount:1000,atkCard:atk,defCard:own,atkOwner:1,direct:false})===1000);

/* スピリットバリア: ダメージ処理時に自分MZをlive参照。 */
resetT();let bar=mk('スピリットバリア'),mon=mk('ワイト'),enemy=mk('青眼の白龍',1);gameState.players[0].sz=[bar];gameState.players[0].mz=[mon];gameState.players[1].mz=[enemy];f=CARD_SCRIPTS['スピリットバリア'].continuous.battleDamage;ok('スピリットバリア positive: 自分場モンスターありで0',f({self:bar,srcPlayer:0,to:0,amount:2700,atkCard:mon,defCard:enemy,direct:false})===0);ok('スピリットバリア ruling: direct attackでも現在MZありなら0',f({self:bar,srcPlayer:0,to:0,amount:3000,atkCard:enemy,defCard:null,direct:true})===0);gameState.players[0].mz=[];ok('スピリットバリア negative: 自分場0なら通常',f({self:bar,srcPlayer:0,to:0,amount:3000,atkCard:enemy,defCard:null,direct:true})===3000);ok('スピリットバリア negative: 相手が受けるdamageは防がない',f({self:bar,srcPlayer:0,to:1,amount:500,atkCard:enemy,defCard:null,direct:true})===500);

/* 覚醒 / 闇の破神剣: v70Equip、current attribute、live modifier。 */
for(const [n,attr] of [['覚醒','地'],['闇の破神剣','闇']]){
  resetT();const eq=mk(n),good=dyn(d=>d.k==='m'&&d.at===attr&&Number(d.def)>=0),bad=dyn(d=>d.k==='m'&&d.at!==attr&&Number(d.def)>=0,n);gameState.players[0].sz=[eq];gameState.players[0].mz=[good,bad];const eff=nativeEffectsV4(n)[0],ctx=makeContext(0,eq,'sz',0,'legalCheck',{});
  ok(n+' positive: 指定属性がいれば装備可能',eff.condition(ctx));gameState.players[0].mz=[bad];ok(n+' negative: 非指定属性だけでは不可',!eff.condition(ctx));gameState.players[0].mz=[good,bad];API.equipSpell(findCardByUid(eq.uid),findCardByUid(good.uid),'fixture');const baseA=dbOf(good).atk||0,baseD=dbOf(good).def||0;ok(n+' positive: ATK+400/DEF-200',curATK(good)===baseA+400&&curDEF(good)===Math.max(0,baseD-200));API.setAttribute(findCardByUid(good.uid),attr==='地'?'闇':'地','endTurn','fixture');ok(n+' ruling: current attribute変更で修整消滅',curATK(good)===baseA&&curDEF(good)===baseD);API.clearCharMods(findCardByUid(good.uid),'fixture');API.detachEquip(findCardByUid(eq.uid),'fixture');ok(n+' negative: 装備解除で修整消滅',curATK(good)===baseA&&curDEF(good)===baseD);
}
resetT();let awake=mk('覚醒'),low=dyn(d=>d.k==='m'&&d.at==='地'&&Number(d.def)>=0&&Number(d.def)<200);gameState.players[0].sz=[awake];gameState.players[0].mz=[low];API.equipSpell(findCardByUid(awake.uid),findCardByUid(low.uid),'fixture');ok('覚醒 ruling: DEFは0未満にならず0へclamp',curDEF(low)===0);API.destroy(findCardByUid(low.uid),'fixture');ok('覚醒 ruling: 装備対象離脱でequip cleanup',findCardByUid(awake.uid).zone==='grave');
globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error(e.stack||e);process.exit(1);}
