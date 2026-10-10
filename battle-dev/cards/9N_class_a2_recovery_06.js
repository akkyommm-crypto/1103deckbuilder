/* Existing-engine Class A recovery, round 2 — sub-batch 6.
   Card scripts only: Battle v6, Equip v15, Characteristic v17 and v70Equip. */

function ca6Piercing(info){
  if(info.atkCard!==info.self||!info.defCard||info.defCard.pos!=='def')return 0;
  return Math.max(0,curATK(info.atkCard)-curDEF(info.defCard));
}
function ca6NoOwnBattleDamage(info){
  if(!info.self||info.to!==info.srcPlayer)return info.amount;
  return (info.atkCard===info.self||info.defCard===info.self)?0:info.amount;
}

function ca6PiercingScript(){return {type:'monster',priority:1,
  continuous:{scope:'self',from:['mz'],apply(){return null;},piercingDamage:ca6Piercing}};}
function ca6NoDamageScript(){return {type:'monster',priority:1,
  continuous:{scope:'self',from:['mz'],apply(){return null;},battleDamage:ca6NoOwnBattleDamage}};}

defineScript('E・HERO エッジマン',ca6PiercingScript());
defineScript('ランサー・ドラゴニュート',ca6PiercingScript());
defineScript('ランス・リンドブルム',ca6PiercingScript());
defineScript('アマゾネスの格闘戦士',ca6NoDamageScript());
defineScript('モンク・ファイター',ca6NoDamageScript());

defineScript('軍隊ピラニア',{type:'monster',priority:1,
  continuous:{scope:'self',from:['mz'],apply(){return null;},battleDamage(info){
    if(info.direct===true&&info.atkCard===info.self&&info.to!==info.srcPlayer&&Number(info.amount)>0)
      return Number(info.amount)*2;
    return info.amount;
  }}});

defineScript('アステカの石像',{type:'monster',priority:1,
  continuous:{scope:'self',from:['mz'],apply(){return null;},battleDamage(info){
    if(info.defCard===info.self&&info.atkCard!==info.self&&info.to===info.atkOwner&&Number(info.amount)>0)
      return Number(info.amount)*2;
    return info.amount;
  }}});

defineScript('スピリットバリア',{type:'trap',priority:2,keep:true,
  continuous:{scope:'self',from:['sz'],apply(){return null;},battleDamage(info){
    if(info.to===info.srcPlayer&&API.fieldCards({player:info.srcPlayer,zone:'mz'}).length>0)return 0;
    return info.amount;
  }}});

v70Equip('覚醒',h=>API.attrOf(h)==='地',400,-200);
v70Equip('闇の破神剣',h=>API.attrOf(h)==='闇',400,-200);
