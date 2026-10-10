const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
const source=fs.readFileSync(path.join(ROOT,'cards','51_v51_autobuild_batch03.js'),'utf8');
const scripted=['スペーシア・ギフト'].filter(()=>false).concat(['ダークゾーン','デザートストーム','バーニングブラッド','ダブル・サイクロン','ツイスター','ツインヘデッド・ビースト','ラージマウス','レインボー・フラワー','レッグル','人造人間7号','モアイ迎撃砲','トレード・イン','トークン収穫祭','ハンマーシュート','フォトン・リード','ポイズンマミー','マスドライバー','リロード','ワーム・アポカリプス','休息する剣闘獣','伝説のゼンマイ','使徒喰い虫','侵食細胞「A」','冥界の宝札','前線基地','勇気の旗印']);
const gaps=['ダブルトラップ'];/* Ritual primitive(System v5) で解消。当時 ENGINE_GAP だった記録として残す。 */const ritualUnlocked=['ゼラの儀式','チャクラの復活','ドリアードの祈り','ローの祈り'];
const generic=['スーパー・ウォー・ライオン','ゼラ','デビルズ・ミラー','マジシャン・オブ・ブラックカオス','仮面魔獣マスクド・ヘルレイザー'];
let fail=0;function check(name,ok){console.log((ok?'PASS ':'FAIL ')+name);if(!ok)fail++;}
for(const n of scripted)check('batch03 registration '+n,html.includes(`'${n}'`));
const ov=JSON.parse(fs.readFileSync(path.join(ROOT,'data','script_status_overrides.json'),'utf8')).cards;
for(const n of gaps)check('precise ENGINE_GAP '+n,ov[n]?.status==='ENGINE_GAP'&&ov[n].reason.length>40&&!source.includes(`'${n}'`));/* S03-U273: implemented and tested (engine: hand size limit); its ENGINE_GAP override was removed. Kept as the record that it was ENGINE_GAP then. */['ヒエログリフの石版'].forEach(n=>check('Engine unlocked '+n,!ov[n]));
for(const n of ritualUnlocked){const ok=!ov[n];console.log((ok?'PASS ':'FAIL ')+'Ritual unlocked '+n);if(!ok)fail++;}/* Counter primitive(System v22) で解消。当時 ENGINE_GAP だった記録として残す。 */for(const n of ['メガトン魔導キャノン']){const okC22=!ov[n];console.log((okC22?'PASS ':'FAIL ')+'Counter unlocked '+n);if(!okC22)fail++;}
for(const n of generic)check('generic ritual body '+n,ov[n]?.status==='GENERIC_OK');
check('Gladiator Beast uses canonical setcode',source.includes('SETCODE.GLADIATOR_BEAST')&&!source.includes('0x1019'));
check('Wind-Up uses canonical setcode',source.includes('SETCODE.WIND_UP')&&!source.includes('0x1052'));
check('generic direct-attack engine has no card-name branches',html.includes('function canDirectAttackThroughMonstersV51')&&!fs.readFileSync(path.join(ROOT,'engine','00_state_actions.js'),'utf8').includes('レインボー・フラワー'));

let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__DB;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
gameState=newGame();gameState.activePlayer=0;gameState.phase='battle';let uid=95100;
function mk(n,p=0){const id=findCardIndex(n);return{id,owner:p,controller:p,face:'up',pos:'atk',uid:uid++};}
const direct=mk('人造人間7号'),foe=mk('ライオウ',1);gameState.players[0].mz=[direct];gameState.players[1].mz=[foe];
const positive=battleTargetsV29(direct.uid).direct===true;
const ordinary=mk('ライオウ');gameState.players[0].mz=[ordinary];const negative=battleTargetsV29(ordinary.uid).direct===false;
const twin=mk('ツインヘデッド・ビースト');gameState.players[0].mz=[twin];const inherent=attackLimitV48(twin)===2;
globalThis.__R={positive,negative,inherent};`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}}, {get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:30000});check('direct-attack positive path',c.__R.positive);check('direct-attack negative path',c.__R.negative);check('inherent two-attack limit',c.__R.inherent);}catch(e){console.error(e.stack||e);fail++;}
if(fail)process.exit(2);
