const fs=require('fs'), path=require('path'), vm=require('vm');
const ROOT=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(ROOT,'engine','00_state_actions.js'),'utf8');

const test=String.raw`
(function(){
  // この回帰テストではカードDBを最小構成に差し替える。
  CARD_DB = [
    {n:'テスト下級モンスター',k:'m',ex:false,atk:1800,def:1000,lv:4,st:['効果']},
    {n:'エヴォルカイザー・ラギア',k:'m',ex:true,atk:2400,def:2000,lv:4,st:['エクシーズ','効果']},
    {n:'テスト融合モンスター',k:'m',ex:true,atk:2500,def:2000,lv:6,st:['融合','効果']},
  ];
  globalThis.dbOf = c => (c && c.token) ? c.token : (CARD_DB[c?.id]||{});
  globalThis.CARD_SCRIPTS = {};
  const rows=[];
  const assert=(name,v,detail='')=>{ rows.push({name,ok:!!v,detail}); if(!v) throw new Error(name+(detail?' '+detail:'')); };

  // 1) ラギアを強制脱出装置で戻す: 手札ではなく持ち主のEXへ。
  {
    const g=newGame(); gameState=g;
    const laggia={id:1,owner:0,controller:0,face:'up',pos:'atk',xyz:[
      {id:0,owner:0,face:'up',pos:'atk'}, {id:0,owner:0,face:'up',pos:'atk'}
    ]};
    g.players[0].mz=[laggia];
    applyAction(g,{type:'FX_BOUNCE',player:0,zone:'mz',index:0,reason:'強制脱出装置'});
    assert('ラギアは手札ではなくEXデッキへ戻る',
      g.players[0].hand.length===0 && g.players[0].ex.length===1 && g.players[0].ex[0]===laggia,
      'hand='+g.players[0].hand.length+' ex='+g.players[0].ex.length);
    assert('ラギアのX素材2枚は持ち主の墓地へ送られる',g.players[0].grave.length===2,'grave='+g.players[0].grave.length);
  }

  // 2) 死者蘇生で相手墓地の下級を自分の場へ → 強制脱出装置。
  // 現行の死者蘇生スクリプトと同じ経路（FX_CONTROL→FX_SPECIAL_SUMMON）を通す。
  {
    const g=newGame(); gameState=g;
    const foeMonster={id:0,owner:1,face:'up',pos:'atk'};
    g.players[1].grave=[foeMonster];
    applyAction(g,{type:'FX_CONTROL',player:1,zone:'grave',index:0,toPlayer:0,reason:'死者蘇生'});
    applyAction(g,{type:'FX_SPECIAL_SUMMON',player:0,from:'grave',fromIndex:0,pos:'atk',reason:'死者蘇生'});
    assert('相手墓地のモンスターを自分フィールドへ蘇生できる',
      g.players[0].mz.length===1 && g.players[0].mz[0]===foeMonster && foeMonster.owner===1,
      'owner='+foeMonster.owner);
    applyAction(g,{type:'FX_BOUNCE',player:0,zone:'mz',index:0,reason:'強制脱出装置'});
    assert('死者蘇生で奪った相手モンスターは相手の手札へ戻る',
      g.players[0].hand.length===0 && g.players[1].hand.length===1 && g.players[1].hand[0]===foeMonster,
      'P0hand='+g.players[0].hand.length+' P1hand='+g.players[1].hand.length);
  }

  // 3) 相手所有のEXモンスターをコントロールしている場合も、持ち主のEXへ。
  {
    const g=newGame(); gameState=g;
    const fusion={id:2,owner:1,controller:0,face:'up',pos:'atk'};
    g.players[0].mz=[fusion];
    applyAction(g,{type:'FX_BOUNCE',player:0,zone:'mz',index:0,reason:'強制脱出装置'});
    assert('相手所有EXモンスターは相手のEXへ戻る',
      g.players[1].ex.length===1 && g.players[1].ex[0]===fusion && g.players[0].hand.length===0,
      'P1ex='+g.players[1].ex.length);
  }

  // 4) 「デッキへ戻す」でもEXモンスターをメインデッキへ混ぜない。
  {
    const g=newGame(); gameState=g;
    const laggia={id:1,owner:0,face:'up',pos:'atk'};
    g.players[0].mz=[laggia];
    applyAction(g,{type:'FX_RETURN_DECK',player:0,zone:'mz',index:0,toBottom:false,reason:'テスト'});
    assert('EXモンスターをデッキへ戻す効果でもEXへ戻る',
      g.players[0].deck.length===0 && g.players[0].ex.length===1 && g.players[0].ex[0]===laggia,
      'deck='+g.players[0].deck.length+' ex='+g.players[0].ex.length);
  }

  console.log(rows.map(x=>'PASS '+x.name+(x.detail?' — '+x.detail:'')).join('\n'));
})();`;

vm.runInThisContext(src+'\n'+test,{filename:'owner_return_regression.js'});
