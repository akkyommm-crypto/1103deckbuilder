const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
js=js.replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
const probe=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__; NAME_INDEX=null; MAT_SPEC_CACHE.clear(); buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
let __u=94700;function mk47(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);return {id,owner:p,controller:p,face,pos,uid:__u++};}
/* S03-U62: some cards now open a real (SaveLoad-safe) API.requestChoice pending choice instead of the
   old synchronous API.confirm/API.selectCard closures the reset47() stubs below intercept. Auto-answer
   any such pending choice by always picking the first candidate (matches the stubs' own "yes" / "first
   candidate" semantics) so pre-existing direct sc.resolve(ctx) unit tests keep working unchanged. */
function drain47(){for(let i=0;i<10&&typeof pendingChoiceV49==='function'&&pendingChoiceV49(gameState);i++)__choicePickV49(0);}
function reset47(){gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=1;gameState.phase='main1';gameState.turn=2;gameState.rngInitialSeed=0x47114711;gameState.rngState=0x47114711;turnActions=[];HISTORY.length=0;REDO.length=0;PLAY_MODE=PLAY_MODES.DUEL;v41ResetActionJournal(gameState);API.selectCard=(t,c,d)=>{if(!(c||[]).length)throw new Error('no candidate '+t);d(c[0]);};API.confirm=(t,m,y,n)=>y();}
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
let self,sc,ctx,sel=[],paid=false;

// Armory Arm: cross-player equip, +1000, battle burn, detach/self summon.
reset47();self=mk47('アームズ・エイド');let foe=mk47('ライオウ',1);gameState.players[0].mz=[self];gameState.players[1].mz=[foe];sc=CARD_SCRIPTS['アームズ・エイド'];ctx=makeContext(0,self,'mz',0,'legalCheck',{});ok('v4.7 Armory equip condition',sc.condition(ctx),ctx.reason||'');API.selectCard=(t,c,d)=>d(c.find(x=>x.card===foe));sel=[];sc.selectTargets(ctx,x=>sel=x);ctx.selectedTargets=sel;sc.resolve(ctx);ok('v4.7 Armory equips opponent monster',gameState.players[0].sz.includes(self)&&self.equipTo&&self.equipTo.uid===foe.uid);ok('v4.7 Armory equip ATK +1000',curATK(foe)===2900,'atk='+curATK(foe));let beaten=mk47('クリッター');ctx=makeContext(0,self,'sz',0,'onDamageStep',{step:'leave',battle:{atkCard:foe,defCard:beaten,destroyedDef:true}});ok('v4.7 Armory burn trigger',sc.condition(ctx),ctx.reason||'');let lp=gameState.players[1].lp;sc.resolve(ctx);ok('v4.7 Armory burns destroyed original ATK',gameState.players[1].lp===lp-1000,'lp='+gameState.players[1].lp);gameState.turn=3;ctx=makeContext(0,self,'sz',0,'legalCheck',{});ok('v4.7 Armory unequip condition next turn',sc.condition(ctx),ctx.reason||'');sc.resolve(ctx);ok('v4.7 Armory unequips and Special Summons',gameState.players[0].mz.includes(self)&&!self.v46MonsterEquip&&!self.equipTo);

// Ancient Fairy Dragon historical 1103 effects.
reset47();self=mk47('エンシェント・フェアリー・ドラゴン');let hand4=mk47('ライオウ');gameState.players[0].mz=[self];gameState.players[0].hand=[hand4];sc=CARD_SCRIPTS['エンシェント・フェアリー・ドラゴン'];ctx=makeContext(0,self,'mz',0,'legalCheck',{});ok('v4.7 AFD hand Special condition',sc.condition(ctx),ctx.reason||'');sel=[];sc.selectTargets(ctx,x=>sel=x);ctx.selectedTargets=sel;sc.resolve(ctx);ok('v4.7 AFD hand Special + BP lock',gameState.players[0].mz.includes(hand4)&&gameState.players[0].temporaryFlags.noBattlePhase===true);reset47();self=mk47('エンシェント・フェアリー・ドラゴン');let fld=mk47('天空の聖域'),searchFld=mk47('歯車街');gameState.players[0].mz=[self];gameState.players[0].field=fld;gameState.players[0].deck=[searchFld];sc=CARD_SCRIPTS['エンシェント・フェアリー・ドラゴン'];ctx=makeContext(0,self,'mz',0,'legalCheck',{});ok('v4.7 AFD field replace condition',sc.condition(ctx),ctx.reason||'');let meLP=gameState.players[0].lp;sc.resolve(ctx);drain47();ok('v4.7 AFD destroys Field + heal + historical any Field search',gameState.players[0].grave.includes(fld)&&gameState.players[0].lp===meLP+1000&&gameState.players[0].hand.includes(searchFld));

// Iron Chain Dragon.
reset47();self=mk47('C・ドラゴン');let c1=mk47('C・コイル'),c2=mk47('C・スネーク');gameState.players[0].mz=[self];gameState.players[0].grave=[c1,c2];sc=CARD_SCRIPTS['C・ドラゴン'];ctx=makeContext(0,self,'mz',0,'legalCheck',{});ok('v4.7 C Dragon banish condition',sc.condition(ctx));sc.resolve(ctx);ok('v4.7 C Dragon banishes all C +400',gameState.players[0].banish.includes(c1)&&gameState.players[0].banish.includes(c2)&&curATK(self)===2900,'atk='+curATK(self));let d1=mk47('クリッター',1),d2=mk47('ライオウ',1),d3=mk47('サイバー・ドラゴン',1);gameState.players[1].deck=[d1,d2,d3];ctx=makeContext(0,self,'mz',0,'onDamageStep',{step:'leave',battle:{atkCard:self,damage:500,toPlayer:1}});ok('v4.7 C Dragon mill trigger',sc.condition(ctx));sc.resolve(ctx);ok('v4.7 C Dragon mills top 3',gameState.players[1].deck.length===0&&gameState.players[1].grave.length===3);

// Zenmaister delayed flip-up.
reset47();self=mk47('発条機甲ゼンマイスター');self.xyz=[mk47('クリッター')];let zt=mk47('ライオウ');gameState.players[0].mz=[self,zt];sc=CARD_SCRIPTS['発条機甲ゼンマイスター'];ok('v4.7 Zenmaister material ATK bonus',curATK(self)===2200,'atk='+curATK(self));ctx=makeContext(0,self,'mz',0,'legalCheck',{});ok('v4.7 Zenmaister condition',sc.condition(ctx));paid=false;sc.cost(ctx,v=>paid=v);API.selectCard=(t,c,d)=>d(c.find(x=>x.card===zt));sel=[];sc.selectTargets(ctx,x=>sel=x);ctx.selectedTargets=sel;sc.resolve(ctx);ok('v4.7 Zenmaister set + reserve',paid&&zt.face==='down'&&zt.pos==='def'&&gameState.reserved.some(r=>r.kind==='flipUpAttackUids'));resolveReservedEffectsV30('endPhase');ok('v4.7 Zenmaister End flip-up Attack',zt.face==='up'&&zt.pos==='atk');

// Aero Shark.
reset47();self=mk47('潜航母艦エアロ・シャーク');self.xyz=[mk47('クリッター')];gameState.players[0].mz=[self];gameState.players[0].banish=[mk47('ライオウ'),mk47('サイバー・ドラゴン')];sc=CARD_SCRIPTS['潜航母艦エアロ・シャーク'];ctx=makeContext(0,self,'mz',0,'legalCheck',{});paid=false;sc.cost(ctx,v=>paid=v);lp=gameState.players[1].lp;sc.resolve(ctx);ok('v4.7 Aero Shark detach + 200 burn',paid&&gameState.players[1].lp===lp-200);

// Acid Golem.
reset47();self=mk47('No.30 破滅のアシッド・ゴーレム');self.xyz=[mk47('クリッター')];gameState.players[0].mz=[self];sc=CARD_SCRIPTS['No.30 破滅のアシッド・ゴーレム'];ctx=makeContext(0,self,'mz',0,'onStandbyPhase',{});ok('v4.7 Acid Golem standby condition',sc.condition(ctx));sc.resolve(ctx);ok('v4.7 Acid Golem detaches in Standby',(self.xyz||[]).length===0);ok('v4.7 Acid Golem no material cannot attack',cannotAttackNow(self));ok('v4.7 Acid Golem controller SS lock',/アシッド・ゴーレム/.test(v46GlobalSpecialSummonRestrictionReason(0))&&v46GlobalSpecialSummonRestrictionReason(1)==='');lp=gameState.players[0].lp;ctx=makeContext(0,self,'mz',0,'onStandbyPhase',{});sc.resolve(ctx);ok('v4.7 Acid Golem no material 2000 self damage',gameState.players[0].lp===lp-2000);

// No.20.
reset47();self=mk47('No.20 蟻岩土ブリリアント');self.xyz=[mk47('クリッター')];let ally=mk47('ライオウ');gameState.players[0].mz=[self,ally];sc=CARD_SCRIPTS['No.20 蟻岩土ブリリアント'];ctx=makeContext(0,self,'mz',0,'legalCheck',{});paid=false;sc.cost(ctx,v=>paid=v);sc.resolve(ctx);ok('v4.7 No.20 boosts all own face-up +300',paid&&curATK(self)===2100&&curATK(ally)===2200,curATK(self)+'/'+curATK(ally));

// No.34.
reset47();self=mk47('No.34 電算機獣テラ・バイト');self.xyz=[mk47('クリッター')];foe=mk47('ライオウ',1);gameState.players[0].mz=[self];gameState.players[1].mz=[foe];sc=CARD_SCRIPTS['No.34 電算機獣テラ・バイト'];ctx=makeContext(0,self,'mz',0,'legalCheck',{});ok('v4.7 No.34 condition',sc.condition(ctx));paid=false;sc.cost(ctx,v=>paid=v);sel=[];sc.selectTargets(ctx,x=>sel=x);ctx.selectedTargets=sel;sc.resolve(ctx);ok('v4.7 No.34 temporary control',paid&&gameState.players[0].mz.includes(foe)&&foe.controlReturnTo===1);

// Thunder End.
reset47();self=mk47('サンダーエンド・ドラゴン');self.xyz=[mk47('青眼の白龍')];ally=mk47('ライオウ');foe=mk47('クリッター',1);gameState.players[0].mz=[self,ally];gameState.players[1].mz=[foe];sc=CARD_SCRIPTS['サンダーエンド・ドラゴン'];ctx=makeContext(0,self,'mz',0,'legalCheck',{});paid=false;sc.cost(ctx,v=>paid=v);sc.resolve(ctx);ok('v4.7 Thunder End wipes every other monster',paid&&gameState.players[0].mz.length===1&&gameState.players[0].mz[0]===self&&gameState.players[0].grave.includes(ally)&&gameState.players[1].grave.includes(foe));

// HERO fusion triggers: provenance + stat modifiers.
reset47();self=mk47('E・HERO Great TORNADO');self.specialSummoned=true;self.specialSummonedFrom='ex';self.specialSummonKind='fusion';foe=mk47('ライオウ',1);gameState.players[0].mz=[self];gameState.players[1].mz=[foe];sc=CARD_SCRIPTS['E・HERO Great TORNADO'];ctx=makeContext(0,self,'mz',0,'onSpecialSummon',{event:{card:self,kind:'fusion'}});ok('v4.7 Great TORNADO Fusion trigger',sc.condition(ctx));sc.resolve(ctx);ok('v4.7 Great TORNADO halves ATK/DEF',curATK(foe)===950&&curDEF(foe)===400,curATK(foe)+'/'+curDEF(foe));
reset47();self=mk47('E・HERO ガイア');self.specialSummoned=true;self.specialSummonedFrom='ex';self.specialSummonKind='fusion';foe=mk47('ライオウ',1);gameState.players[0].mz=[self];gameState.players[1].mz=[foe];sc=CARD_SCRIPTS['E・HERO ガイア'];ctx=makeContext(0,self,'mz',0,'onSpecialSummon',{event:{card:self,kind:'fusion'}});ok('v4.7 Gaia Fusion trigger',sc.condition(ctx));sel=[];sc.selectTargets(ctx,x=>sel=x);ctx.selectedTargets=sel;sc.resolve(ctx);ok('v4.7 Gaia halves target + gains lost ATK',curATK(foe)===950&&curATK(self)===3150,curATK(foe)+'/'+curATK(self));

// Nova Master works as attacker and defender.
reset47();self=mk47('E・HERO ノヴァマスター');let atk=mk47('クリッター',1);gameState.players[0].mz=[self];gameState.players[0].deck=[mk47('ライオウ')];sc=CARD_SCRIPTS['E・HERO ノヴァマスター'];ctx=makeContext(0,self,'mz',0,'onDamageStep',{step:'leave',battle:{atkCard:atk,defCard:self,destroyedAtk:true,destroyedDef:false}});ok('v4.7 Nova defender destroy trigger',sc.condition(ctx));sc.resolve(ctx);ok('v4.7 Nova draws after battle destroy',gameState.players[0].hand.length===1);

// AOJ Light Gazer.
reset47();self=mk47('A・O・J ライト・ゲイザー');gameState.players[0].mz=[self];gameState.players[1].grave=[mk47('ライオウ',1),mk47('シャインエンジェル',1),mk47('クリッター',1)];ok('v4.7 Light Gazer +200 per opposing LIGHT',curATK(self)===2800,'atk='+curATK(self));

// Sacred Knight Parshath.
reset47();self=mk47('神聖騎士パーシアス');foe=mk47('ライオウ',1,'up','atk');gameState.players[0].mz=[self];gameState.players[1].mz=[foe];sc=CARD_SCRIPTS['神聖騎士パーシアス'];ctx=makeContext(0,self,'mz',0,'legalCheck',{});sel=[];sc.selectTargets(ctx,x=>sel=x);ctx.selectedTargets=sel;sc.resolve(ctx);ok('v4.7 Parshath changes position',foe.pos==='def');let lowDef=mk47('クリッター',1,'up','def');ok('v4.7 Parshath piercing',applyPiercingDamage({atkCard:self,defCard:lowDef,atkOwner:0,defOwner:1,amount:2000,direct:false})===2000);

// Fabled Valkyrus.
reset47();self=mk47('魔轟神ヴァルキュルス');let fiend=mk47('クリッター');gameState.players[0].mz=[self];gameState.players[0].hand=[fiend];gameState.players[0].deck=[mk47('ライオウ')];sc=CARD_SCRIPTS['魔轟神ヴァルキュルス'];ctx=makeContext(0,self,'mz',0,'legalCheck',{});ok('v4.7 Valkyrus discard condition',sc.condition(ctx));paid=false;sc.cost(ctx,v=>paid=v);sc.resolve(ctx);ok('v4.7 Valkyrus discard Fiend + draw 1',paid&&gameState.players[0].grave.includes(fiend)&&gameState.players[0].hand.length===1);

// Common provenance action.
reset47();let ss=mk47('ライオウ');gameState.players[0].hand=[ss];API.specialSummon(0,'hand',0,'atk','v4.7 test');ok('v4.7 Special Summon provenance serialized',ss.specialSummonedFrom==='hand'&&ss.specialSummonKind==='effect');

globalThis.__V47C=R;`;
js+='\n'+probe;
function nodeStub(){const b={innerHTML:'',className:'',hidden:false,textContent:'',value:'',scrollTop:0,scrollHeight:0,style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},removeEventListener(){},appendChild(){},remove(){},setAttribute(){},scrollIntoView(){},animate(){},getBoundingClientRect(){return {left:0,top:0,width:100,height:100}},querySelector(){return nodeStub()},querySelectorAll(){return []}};return new Proxy(b,{get(t,p){if(p in t)return t[p];if(p==='children'||p==='files')return [];return ()=>{}},set(t,p,v){t[p]=v;return true}})}
const nodes=new Map();const document={getElementById(id){if(!nodes.has(id))nodes.set(id,nodeStub());return nodes.get(id)},querySelector(){return nodeStub()},querySelectorAll(){return []},createElement(){return nodeStub()},addEventListener(){},removeEventListener(){},body:nodeStub(),documentElement:nodeStub()};
const store=new Map();const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k),clear:()=>store.clear()};
const context={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){},back(){}},location:{reload(){}},navigator:{userAgent:'node'},innerHeight:800,innerWidth:400,addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),cancelAnimationFrame(){},setTimeout:(f)=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},DOMParser:class{parseFromString(){return {getElementById(){return null}}}},fetch:async()=>{throw new Error('fetch disabled')},indexedDB:null,FileReader:class{},Blob,URL:{createObjectURL(){return ''},revokeObjectURL(){}},structuredClone:global.structuredClone};context.window=context;context.globalThis=context;
try{vm.runInNewContext(js,context,{filename:'v470cards.js',timeout:30000});const r=context.__V47C;console.log(r.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(r.some(x=>!x.ok))process.exit(2)}catch(e){console.error(e.stack||e);process.exit(1)}
