const fs=require('fs'), path=require('path'), vm=require('vm');
const ROOT=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(ROOT,'engine','30_processor_chain_battle.js'),'utf8');

// Browser UIを起動せず、今回のルール回帰に必要な依存だけをスタブ化する。
global.gameState={turn:1,activePlayer:0,timingWindow:null,players:[{mz:[]},{mz:[]}],chain:[]};
global.CARD_SCRIPTS={};
global.zoneCard=(P,z,i)=>(P[z]||[])[i]||null;
global.dbOf=c=>c.db;
global.trapNegated=()=>false;
global.trapStunned=()=>false;
global.countLeft=()=>1;
global.timingCheck=()=>({ok:true});
global.makeContext=(p,card,zone,index,eventName,opts)=>({player:p,card,zone,index,eventName,...(opts||{})});

const test=String.raw`
(function(){
  const rows=[];
  const assert=(name,v)=>{ rows.push({name,ok:!!v}); if(!v) throw new Error(name); };

  gameState={turn:1,activePlayer:0,timingWindow:{kind:'summonFast',turn:1},players:[{mz:[]},{mz:[]}],chain:[]};
  queuePointContinuationV27({kind:'summonFast',clearTimingOnPass:true});
  assert('両者パス後に召喚成功応答窓を閉じる',gameState.timingWindow===null);

  gameState={turn:1,activePlayer:0,timingWindow:null,players:[{mz:[]},{mz:[]}],chain:[]};
  const pp=postSummonFastPointV321('onNormalSummon',{name:'レスキューラビット'});
  assert('通常召喚成功後にSS2以上の応答窓を作る',pp&&pp.kind==='summonFast'&&pp.clearTimingOnPass===true);

  const rabbit={db:{k:'m',n:'レスキューラビット'}};
  gameState={turn:1,activePlayer:0,timingWindow:{kind:'summonFast',turn:1},players:[{mz:[rabbit]},{mz:[]}],chain:[]};
  CARD_SCRIPTS['レスキューラビット']={resolve(){},quickEffect:false,condition(){return true;}};
  const during=strictScriptLegalityV2('レスキューラビット',0,'mz',0,{});
  assert('召喚成功直後の応答窓では起動効果を禁止',during.ok===false);

  gameState.timingWindow=null;
  const open=strictScriptLegalityV2('レスキューラビット',0,'mz',0,{});
  assert('オープンなMain Phaseではレスキューラビット起動可',open.ok===true);

  console.log(rows.map(x=>'PASS '+x.name).join('\n'));
})();`;

vm.runInThisContext(src+'\n'+test,{filename:'summon_timing_regression.js'});
