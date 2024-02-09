const fs = require('fs');

let resetRecipe = fs.readFileSync('./data/RESET_RECIPE.json');
fs.writeFileSync('./data/recipes.json', resetRecipe);