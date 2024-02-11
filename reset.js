const fs = require('fs');

let resetRecipe = fs.readFileSync('./data/RESET_RECIPE.json');
fs.writeFileSync('./data/recipes.json', resetRecipe);

fs.writeFileSync('./data/failed_recipes.json', '[]');

if (process.argv.length > 2) 
    fs.appendFileSync('main.log', 'Reason: ' + process.argv.slice(2).join(' ') + '\n');