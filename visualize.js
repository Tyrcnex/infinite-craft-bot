const fs = require('fs');
let recipes = JSON.parse(fs.readFileSync('./data/recipes.json'));
let returnArr = [];
let rowItems = [];
for (let recipe of recipes) {
    if (rowItems.join('').length > 50) {
        returnArr.push(rowItems.join(' | '));
        rowItems = [];
    } else {
        rowItems.push(`${recipe.emoji.trim()} ${recipe.product.trim()}`);
    }
}
if (rowItems.length) returnArr.push(rowItems.join(' | '));
console.log(returnArr.join('\n'));