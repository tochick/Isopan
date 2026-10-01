const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {loadRecipes}=require('./foam-recipes.cjs');
const recipes=loadRecipes();
const context={state:{foamGreenRecipes:recipes,foamGreenCatalog:recipes.flatMap(recipe=>recipe.rows.map(row=>({family:recipe.family,width:recipe.width,thickness:row.thickness})))},escapeHtml:value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))};
vm.createContext(context);
vm.runInContext(fs.readFileSync('foam-green.js','utf8'),context);
const render=selection=>context.foamGreenRecipe(selection);
for(const recipe of recipes){
  for(const row of recipe.rows){
    assert(row.speed>0&&Number.isInteger(row.thickness));
    const html=render({formulation:recipe.formulation,next:{family:recipe.family,width:recipe.width,thickness:row.thickness}});
    assert(html.includes(`Receta de ${recipe.formulation}`));
    assert(html.includes(recipe.source));
    assert(html.includes(String(row.speed).replace('.',',')+' m/min'));
    assert(!html.includes('No hay una receta confirmada'));
    assert(!/<img/.test(html),'Las recetas deben mostrarse como datos, no como fotografías');
    assert(html.includes('Línea completa de la receta'));
    assert(html.indexOf('Aire</span>')<html.indexOf('Caudal total</span>'));
    assert(html.indexOf('Caudal total</span>')<html.indexOf('N.º peine BASF</span>'));
  }
}
if(recipes.length){
  const example=render({formulation:'BCI',next:{family:'box',width:1000,thickness:50}});
  assert(example.includes('Pared 1000 bci-2.jpeg'));
  assert(!example.includes('Pared 1000 fp1'));
  const fp1=render({formulation:'FP1',next:{family:'box',width:1000,thickness:50}});
  assert(fp1.includes('Pared 1000 fp1-2.jpeg'));
  assert(!fp1.includes('Pared 1000 bci'));
  context.state.foamGreenCatalog.push({family:'box',width:1155,thickness:50});
  assert(render({formulation:'BCI',next:{family:'box',width:1155,thickness:50}}).includes('No hay una receta confirmada'));
  assert(render({formulation:'KIMPUR',next:{family:'box',width:1000,thickness:50}}).includes('No hay una receta confirmada'));
  assert(render({formulation:'BCI',current:{family:'box',width:1000,thickness:50},next:{family:'forzen',width:1120,thickness:80}}).includes('No hay una receta confirmada'));
  assert(render({formulation:'BCI',next:{family:'isoparette',width:1000,thickness:50}}).includes('Isoparete 50'));
}
// Este caso ficticio mantiene la comprobación de aislamiento también sin datos de planta.
context.state.foamGreenCatalog=[{family:'box',width:1000,thickness:50}];
context.state.foamGreenRecipes=[{formulation:'FP1',family:'box',width:1000,source:'receta equivocada',rows:[{thickness:50}]}];
assert(!render({formulation:'BCI',next:{family:'box',width:1000,thickness:50}}).includes('receta equivocada'));
console.log('Recetas: filtro por formulado, panel, ancho y espesor; variantes por velocidad correctas.');
