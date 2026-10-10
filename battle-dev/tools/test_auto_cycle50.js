/* Auto cycle 50 dedicated tests. */
const fs=require('fs'),vm=require('vm'),path=require('path');const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
const source=fs.readFileSync(path.join(ROOT,'cards','F2_auto_cycle50.js'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*$/m,'/* boot skipped */');
js+=String.raw`
CARD_DB=globalThis.__DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};openPick=()=>{};
const R=[],ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});globalThis.__R=R;
const TARGETS=['デス・バード','デビル・ボックス','バラに棲む悪霊','バロックス','ヒューマノイド・ドレイク','フュージョニスト','フラワー・ウルフ','フレイム・ゴースト','ブラキオレイドス','ブラック・デーモンズ・ドラゴン','プラグティカル','マスター・オブ・OZ','マブラス','マリン・ビースト','ミノケンタウロス','メカ・ザウルス','メタル・ドラゴン','メテオ・ブラック・ドラゴン','レア・フィッシュ','千年竜'];
function sc(n){const s=CARD_SCRIPTS[n];if(!s)throw Error('script missing '+n);return s;}
TARGETS.forEach(n=>{
  const d=__DB__.find(x=>x.n===n);
  ok('cycle50 registration '+n,!!CARD_SCRIPTS[n]);
  ok('cycle50 fusion DB '+n,!!(d&&d.k==='m'&&d.ex===true&&(d.st||[]).includes('融合')));
  ok('cycle50 no activated/passive effects '+n,!sc(n).resolve&&!sc(n).passive&&!sc(n).continuous&&!sc(n).canDirectAttack);
});
ok('cycle50 枚数は20',TARGETS.length===20);
ok('cycle50 state untouched by no-effect registration',typeof gameState==='object'&&JSON.stringify(gameState).indexOf('function')<0);
`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const context={console,require,process,__dirname:path.join(ROOT,'tools'),__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};context.window=context;context.globalThis=context;
let thrown=false;
try{vm.runInNewContext(js,context,{filename:'battle.html',timeout:60000});}catch(e){thrown=true;console.error(e.stack||e);}
const RR=context.__R||[];let f=0;for(const r of RR){console.log((r.ok?'PASS ':'FAIL ')+r.name+(r.detail?' :: '+r.detail:''));if(!r.ok)f++;}
const ov=JSON.parse(fs.readFileSync(path.join(ROOT,'data','script_status_overrides.json'),'utf8')).cards||{};
const targets=['デス・バード','デビル・ボックス','バラに棲む悪霊','バロックス','ヒューマノイド・ドレイク','フュージョニスト','フラワー・ウルフ','フレイム・ゴースト','ブラキオレイドス','ブラック・デーモンズ・ドラゴン','プラグティカル','マスター・オブ・OZ','マブラス','マリン・ビースト','ミノケンタウロス','メカ・ザウルス','メタル・ドラゴン','メテオ・ブラック・ドラゴン','レア・フィッシュ','千年竜'];
for(const n of targets){
  const okLit=source.includes(`defineScript('${n}'`);
  console.log((okLit?'PASS ':'FAIL ')+'cycle50 literal registration '+n);
  if(!okLit)f++;
  const okOv=!ov[n];
  console.log((okOv?'PASS ':'FAIL ')+'cycle50 no override pin '+n);
  if(!okOv)f++;
}
if(thrown||f||!RR.length)process.exit(2);
