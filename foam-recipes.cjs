const fs = require('node:fs');
const path = require('node:path');
// Las transcripciones de planta permanecen fuera del código público.
const recipeFile = path.join(__dirname,'Base de datos','Recetas','recetas.json');
function loadRecipes() {
  if(!fs.existsSync(recipeFile))return [];
  const recipes=JSON.parse(fs.readFileSync(recipeFile,'utf8'));
  if(!Array.isArray(recipes))throw new Error('El catálogo de recetas debe ser una lista.');
  for(const recipe of recipes){
    if(!['BCI','FP1','KIMPUR'].includes(recipe.formulation)||!['box','forzen','isoparette'].includes(recipe.family)||!Array.isArray(recipe.rows))throw new Error('Una receta no tiene su formulado o tipo de panel identificado.');
  }
  return recipes;
}
module.exports={loadRecipes};
