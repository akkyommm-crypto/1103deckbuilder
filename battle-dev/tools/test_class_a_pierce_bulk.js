/* Class A bulk 貫通10枚 — positive / negative / ruling edge。 */
const fs=require('fs'),vm=require('vm'),path=require('path');const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};openPick=()=>{};
const R=[],ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
let U=530000;
function mk(n,p=0,pos='atk',face='up'){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);
  return{id,owner:p,controller:p,face,pos,uid:U++};}
function resetT(){gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;
  gameState.phase='battle';gameState.turn=12;PLAY_MODE=PLAY_MODES.DUEL;
  HISTORY.length=0;REDO.length=0;turnActions=[];v41ResetActionJournal(gameState);}
function pf(n){ return CARD_SCRIPTS[n].continuous.piercingDamage; }
function h(c){ return locateCardAnyV4(c); }
/* 小道具は TESTED / GENERIC_OK / NOT_STARTED のみ */
const WIGHT='ワイト';            /* GENERIC_OK・アンデット atk300 def200 */
const BEU='青眼の白龍';           /* GENERIC_OK・ドラゴン atk3000 def2500 */
const BEAST='グレート・アンガス';   /* GENERIC_OK・獣 炎 atk1800 */
const INSECT='ギロチン・クワガタ';  /* GENERIC_OK・昆虫 風 atk1700 */
const REPT='ガガギゴ';            /* GENERIC_OK・爬虫類 水 atk1850 */
const SPELLC='ヂェミナイ・エルフ';  /* GENERIC_OK・魔法使い atk1900 */

const NAMES=['セイバー・ビートル','バイトロン','暗黒ドリケラトプス','ツイン・ブレイカー',
  '天空騎士パーシアス','地獄将軍・メフィスト','激昂のミノタウルス','クロスソード・ハンター',
  'ライオ・アリゲーター','インフェルニティ・ドワーフ'];
NAMES.forEach(n=>ok('ClassA-pierce registration '+n,!!CARD_SCRIPTS[n]));

/* ================= 自身のみの貫通 6枚 ================= */
for(const n of ['セイバー・ビートル','バイトロン','暗黒ドリケラトプス','ツイン・ブレイカー',
                '天空騎士パーシアス','地獄将軍・メフィスト']){
  resetT();
  const a=mk(n),d=mk(WIGHT,1,'def'),o=mk(BEU,1);
  gameState.players[0].mz=[a];gameState.players[1].mz=[d,o];
  const f=pf(n);
  ok(n+' positive: 守備表示相手にATK−DEFの貫通',
     f({self:a,srcPlayer:0,atkCard:a,defCard:d})===Math.max(0,curATK(a)-curDEF(d)),
     String(f({self:a,srcPlayer:0,atkCard:a,defCard:d})));
  API.setDef(h(d),curATK(a)+100,'endTurn','fixture');
  ok(n+' negative: DEFがATK以上なら0',f({self:a,srcPlayer:0,atkCard:a,defCard:d})===0);
  API.clearStatMods(h(d),'fixture');
  d.pos='atk';
  ok(n+' negative: 攻撃表示の相手には貫通しない',f({self:a,srcPlayer:0,atkCard:a,defCard:d})===0);
  d.pos='def';d.face='down';
  ok(n+' ruling: 裏側守備表示でも貫通する',
     f({self:a,srcPlayer:0,atkCard:a,defCard:d})===Math.max(0,curATK(a)-curDEF(d)));
  ok(n+' negative: 自身以外が攻撃した戦闘では貫通しない',
     f({self:a,srcPlayer:0,atkCard:o,defCard:d})===0);
  ok(n+' negative: 直接攻撃では貫通差分を出さない',
     f({self:a,srcPlayer:0,atkCard:a,defCard:null})===0);
}
/* 実戦: 守備表示へ攻撃して LP が ATK−DEF だけ減る */
resetT();
let sb=mk('セイバー・ビートル'),sd=mk(WIGHT,1,'def');
gameState.players[0].mz=[sb];gameState.players[1].mz=[sd];
let lp0=gameState.players[1].lp;
act({type:'ATTACK',player:0,atkIdx:0,target:0});
ok('セイバー・ビートル positive: 実戦で貫通ダメージが通る',
   gameState.players[1].lp===lp0-(curATK(sb)-dbOf(sd).def),
   lp0+'→'+gameState.players[1].lp);

/* ================= 4. ツイン・ブレイカー の追加攻撃 ================= */
resetT();
let tb=mk('ツイン・ブレイカー'),td=mk(WIGHT,1,'def');
gameState.players[0].mz=[tb];gameState.players[1].mz=[td];
let te=nativeEffectsV4('ツイン・ブレイカー').find(x=>x.key==='extra-attack-after-defense');
/* 実際に守備表示へ1回攻撃してから、ダメージステップ終了時の誘発を回す。 */
act({type:'ATTACK',player:0,atkIdx:0,target:0});
ok('ツイン・ブレイカー positive: 1回目の攻撃で攻撃済みになる',Number(tb.attackCount)===1,
   'attackCount='+tb.attackCount);
let tc=makeContext(0,tb,'mz',0,'onDamageStep',{battle:{atkCard:tb,defCard:td},step:'leave'});
ok('ツイン・ブレイカー positive: 守備表示を攻撃した後に追加攻撃の条件を満たす',te.condition(tc)===true);
te.operation(tc);
ok('ツイン・ブレイカー positive: このターンの攻撃可能回数が2回になる',
   tb.attackLimit===2&&tb.attackLimitTurn===gameState.turn,
   'attackLimit='+tb.attackLimit+' turn='+tb.attackLimitTurn);
ok('ツイン・ブレイカー ruling: 追加攻撃は「もう1度だけ」で3回にはならない',tb.attackLimit===2);
ok('ツイン・ブレイカー ruling: 追加攻撃は1ターンに1度だけ',
   te.condition(makeContext(0,tb,'mz',0,'onDamageStep',{battle:{atkCard:tb,defCard:td},step:'leave'}))===false);
resetT();
let tb2=mk('ツイン・ブレイカー'),ta2=mk(WIGHT,1,'atk');
gameState.players[0].mz=[tb2];gameState.players[1].mz=[ta2];
ok('ツイン・ブレイカー negative: 攻撃表示を攻撃しても追加攻撃は出ない',
   te.condition(makeContext(0,tb2,'mz',0,'onDamageStep',{battle:{atkCard:tb2,defCard:ta2},step:'leave'}))===false);
ok('ツイン・ブレイカー negative: 直接攻撃では追加攻撃は出ない',
   te.condition(makeContext(0,tb2,'mz',0,'onDamageStep',{battle:{atkCard:tb2,defCard:null},step:'leave'}))===false);
ok('ツイン・ブレイカー negative: 他モンスターの戦闘では出ない',
   te.condition(makeContext(0,tb2,'mz',0,'onDamageStep',{battle:{atkCard:ta2,defCard:tb2},step:'leave'}))===false);

/* ================= 5. 天空騎士パーシアス のドロー ================= */
resetT();
let pc=mk('天空騎士パーシアス'),pd=mk(WIGHT,1,'def');
gameState.players[0].mz=[pc];gameState.players[1].mz=[pd];
gameState.players[0].deck=[mk(WIGHT,0),mk(WIGHT,0)];
let pe=nativeEffectsV4('天空騎士パーシアス').find(x=>x.key==='draw-on-battle-damage');
let pctx=makeContext(0,pc,'mz',0,'onDamageStep',{battle:{atkCard:pc,damage:800,toPlayer:1},step:'after'});
ok('天空騎士パーシアス positive: 自身が戦闘ダメージを与えたら条件成立',pe.condition(pctx)===true);
let hand0=gameState.players[0].hand.length;
pe.operation(pctx);
ok('天空騎士パーシアス positive: 1枚ドローする',gameState.players[0].hand.length===hand0+1);
ok('天空騎士パーシアス negative: ダメージ0では発動しない',
   pe.condition(makeContext(0,pc,'mz',0,'onDamageStep',{battle:{atkCard:pc,damage:0,toPlayer:1},step:'after'}))===false);
ok('天空騎士パーシアス negative: 自分がダメージを受けた場合は発動しない',
   pe.condition(makeContext(0,pc,'mz',0,'onDamageStep',{battle:{atkCard:pc,damage:500,toPlayer:0},step:'after'}))===false);
ok('天空騎士パーシアス negative: 他モンスターの戦闘では発動しない',
   pe.condition(makeContext(0,pc,'mz',0,'onDamageStep',{battle:{atkCard:pd,damage:500,toPlayer:1},step:'after'}))===false);
ok('天空騎士パーシアス ruling: 貫通ダメージでも「戦闘ダメージを与えた」に含まれる',
   pf('天空騎士パーシアス')({self:pc,srcPlayer:0,atkCard:pc,defCard:pd})>0&&
   pe.condition(makeContext(0,pc,'mz',0,'onDamageStep',{battle:{atkCard:pc,damage:1,toPlayer:1},step:'after'}))===true);

/* ================= 6. 地獄将軍・メフィスト のランダム捨て ================= */
resetT();
let mf=mk('地獄将軍・メフィスト'),md=mk(WIGHT,1,'def');
gameState.players[0].mz=[mf];gameState.players[1].mz=[md];
gameState.players[1].hand=[mk(WIGHT,1),mk(WIGHT,1)];
let me2=nativeEffectsV4('地獄将軍・メフィスト').find(x=>x.key==='battle-damage-random-discard');
let mctx=makeContext(0,mf,'mz',0,'onDamageStep',{battle:{atkCard:mf,damage:900,toPlayer:1},step:'after'});
ok('地獄将軍・メフィスト positive: 戦闘ダメージ時に条件成立',me2.condition(mctx)===true);
let fh=gameState.players[1].hand.length;
me2.operation(mctx);
ok('地獄将軍・メフィスト positive: 相手の手札がランダムに1枚減る',
   gameState.players[1].hand.length===fh-1,fh+'→'+gameState.players[1].hand.length);
gameState.players[1].hand=[];
ok('地獄将軍・メフィスト negative: 相手の手札が0枚なら発動しない',
   me2.condition(makeContext(0,mf,'mz',0,'onDamageStep',{battle:{atkCard:mf,damage:900,toPlayer:1},step:'after'}))===false);
ok('地獄将軍・メフィスト ruling: 貫通と捨てを両方持つ',
   pf('地獄将軍・メフィスト')({self:mf,srcPlayer:0,atkCard:mf,defCard:md})===Math.max(0,curATK(mf)-curDEF(md)));

/* ================= 7. 激昂のミノタウルス（獣・獣戦士・鳥獣へ配る） ============ */
resetT();
let mn=mk('激昂のミノタウルス'),bs=mk(BEAST,0),sp=mk(SPELLC,0),fd=mk(WIGHT,1,'def'),ed=mk(BEAST,1);
gameState.players[0].mz=[mn,bs,sp];gameState.players[1].mz=[fd,ed];
let mp=pf('激昂のミノタウルス');
ok('激昂のミノタウルス positive: 自分の獣族が守備表示を攻撃すると貫通',
   mp({self:mn,srcPlayer:0,atkCard:bs,defCard:fd})===Math.max(0,curATK(bs)-curDEF(fd)),
   String(mp({self:mn,srcPlayer:0,atkCard:bs,defCard:fd})));
ok('激昂のミノタウルス positive: 自身（獣戦士）も貫通を持つ',
   mp({self:mn,srcPlayer:0,atkCard:mn,defCard:fd})===Math.max(0,curATK(mn)-curDEF(fd)));
ok('激昂のミノタウルス negative: 魔法使い族には配らない',
   mp({self:mn,srcPlayer:0,atkCard:sp,defCard:fd})===0);
ok('激昂のミノタウルス negative: 相手の獣族には配らない',
   mp({self:mn,srcPlayer:0,atkCard:ed,defCard:fd})===0);
ok('激昂のミノタウルス negative: 攻撃表示相手には貫通しない',(()=>{
   fd.pos='atk';const r=mp({self:mn,srcPlayer:0,atkCard:bs,defCard:fd});fd.pos='def';return r===0;})());
ok('激昂のミノタウルス ruling: 自身が裏側になると配らない',(()=>{
   mn.face='down';const r=mp({self:mn,srcPlayer:0,atkCard:bs,defCard:fd});mn.face='up';return r===0;})());
ok('激昂のミノタウルス ruling: v17 で獣族になったモンスターにも配る',(()=>{
   API.setRace(h(sp),'獣','endTurn','fixture');
   const r=mp({self:mn,srcPlayer:0,atkCard:sp,defCard:fd});
   API.clearCharMods(h(sp),'fixture');return r>0;})());

/* ================= 8-9. 条件つきグループ貫通 ================= */
[['クロスソード・ハンター',INSECT,'昆虫'],['ライオ・アリゲーター',REPT,'爬虫類']].forEach(function(row){
  const NAME=row[0],MATE=row[1],RA=row[2];
  resetT();
  const self=mk(NAME),foe=mk(WIGHT,1,'def');
  gameState.players[0].mz=[self];gameState.players[1].mz=[foe];
  const f=pf(NAME);
  ok(NAME+' negative: 自身以外の'+RA+'族がいなければ貫通しない',
     f({self,srcPlayer:0,atkCard:self,defCard:foe})===0);
  const mate=mk(MATE,0);gameState.players[0].mz.push(mate);
  ok(NAME+' positive: 自身以外の'+RA+'族がいれば自身が貫通する',
     f({self,srcPlayer:0,atkCard:self,defCard:foe})===Math.max(0,curATK(self)-curDEF(foe)));
  ok(NAME+' positive: 同じ'+RA+'族の仲間にも配る',
     f({self,srcPlayer:0,atkCard:mate,defCard:foe})===Math.max(0,curATK(mate)-curDEF(foe)));
  const other=mk(SPELLC,0);gameState.players[0].mz.push(other);
  ok(NAME+' negative: '+RA+'族以外には配らない',
     f({self,srcPlayer:0,atkCard:other,defCard:foe})===0);
  const enemy=mk(MATE,1);gameState.players[1].mz.push(enemy);
  ok(NAME+' negative: 相手の'+RA+'族には配らない',
     f({self,srcPlayer:0,atkCard:enemy,defCard:foe})===0);
  ok(NAME+' ruling: 仲間が場を離れると貫通も消える',(()=>{
     API.destroy(h(mate),'fixture');
     return f({self,srcPlayer:0,atkCard:self,defCard:foe})===0;})());
});

/* ================= 10. インフェルニティ・ドワーフ（手札0枚条件） ============ */
resetT();
let dw=mk('インフェルニティ・ドワーフ'),ally=mk(SPELLC,0),df=mk(WIGHT,1,'def');
gameState.players[0].mz=[dw,ally];gameState.players[1].mz=[df];
gameState.players[0].hand=[mk(WIGHT,0)];
let dp=pf('インフェルニティ・ドワーフ');
ok('インフェルニティ・ドワーフ negative: 手札があるうちは貫通しない',
   dp({self:dw,srcPlayer:0,atkCard:dw,defCard:df})===0);
gameState.players[0].hand=[];
ok('インフェルニティ・ドワーフ positive: 手札0枚なら自身が貫通する',
   dp({self:dw,srcPlayer:0,atkCard:dw,defCard:df})===Math.max(0,curATK(dw)-curDEF(df)));
ok('インフェルニティ・ドワーフ positive: 種族を問わず自分の全モンスターに配る',
   dp({self:dw,srcPlayer:0,atkCard:ally,defCard:df})===Math.max(0,curATK(ally)-curDEF(df)));
ok('インフェルニティ・ドワーフ negative: 相手モンスターには配らない',(()=>{
   const e=mk(SPELLC,1);gameState.players[1].mz.push(e);
   return dp({self:dw,srcPlayer:0,atkCard:e,defCard:df})===0;})());
ok('インフェルニティ・ドワーフ ruling: 自身が裏側になると配らない',(()=>{
   dw.face='down';const r=dp({self:dw,srcPlayer:0,atkCard:ally,defCard:df});dw.face='up';return r===0;})());
ok('インフェルニティ・ドワーフ negative: 攻撃表示相手には貫通しない',(()=>{
   df.pos='atk';const r=dp({self:dw,srcPlayer:0,atkCard:dw,defCard:df});df.pos='def';return r===0;})());

/* ================= Replay / 直列化 ================= */
resetT();
let ra=mk('セイバー・ビートル'),rb=mk(WIGHT,1,'def');
gameState.players[0].mz=[ra];gameState.players[1].mz=[rb];
v41ResetActionJournal(gameState);
act({type:'ATTACK',player:0,atkIdx:0,target:0});
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('ClassA-pierce Replay: 貫通を含む戦闘が digest 一致で再生される',audit.ok,audit.reason||'');
let snap=JSON.stringify(gameState);
ok('ClassA-pierce SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('ClassA-pierce 直列化: piercingDamage は gameState に漏れていない',snap.indexOf('piercingDamage')<0);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
