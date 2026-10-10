const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const smoke=fs.readFileSync(path.join(ROOT,'data','81_device_smoke_v351.js'),'utf8');
const proc=fs.readFileSync(path.join(ROOT,'engine','30_processor_chain_battle.js'),'utf8');
const menu=fs.readFileSync(path.join(ROOT,'engine','60_damage_segoc_ui_helpers.js'),'utf8');
const core=fs.readFileSync(path.join(ROOT,'cards','00_generic_core.js'),'utf8');
const exp=fs.readFileSync(path.join(ROOT,'cards','37_1103_expansion_v350.js'),'utf8');
const assert=(n,v)=>{if(!v)throw new Error(n);console.log('PASS '+n)};
assert('smoke 13 scenarios',(smoke.match(/\n  [A-Za-z]+:\{/g)||[]).length===13);
assert('smoke switches to DUEL before play',/writeDeviceSmokeActiveV351[\s\S]*?v351SetPlayModeRaw\(PLAY_MODES\.DUEL\)[\s\S]*?v351PrepareSmokeBase/.test(smoke));
assert('smoke restores previous mode',/function v351RestoreSmokeMode[\s\S]*?returnMode/.test(smoke));
assert('active smoke result shortcut',/deviceSmokeMenuButtonV351/.test(smoke)&&/deviceSmokeMenuButtonV351/.test(menu));
assert('specialLock expects activation prohibition',/死者蘇生をタップする[\s\S]*?特殊召喚できないため/.test(smoke));
assert('preflight checks legal actions',/function v351SmokePreflight/.test(smoke)&&/getLegalHandActions/.test(smoke)&&/getLegalZoneActions/.test(smoke));
assert('engine blocks declared SS-only effects during noSS',/blocksIfNoSpecialSummon===true/.test(proc));
assert('Monster Reborn declares noSS block',/defineScript\("死者蘇生"[\s\S]*?blocksIfNoSpecialSummon:true/.test(core));
assert('Battle Fader declares noSS block',/defineScript\("バトルフェーダー"[\s\S]*?blocksIfNoSpecialSummon:true/.test(exp));

assert('Rabbit Bottomless smoke exists',/rabbitBottomless/.test(smoke)&&/セイバーザウルス2体/.test(smoke));

assert('v3.7 new smoke cases',/frogExtra/.test(smoke)&&/fortressSummon/.test(smoke)&&/tragoControl/.test(smoke));
