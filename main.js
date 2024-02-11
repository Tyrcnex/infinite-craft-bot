const fs = require('fs');

let items = JSON.parse(fs.readFileSync('./data/recipes.json'));
let failedRecipes = JSON.parse(fs.readFileSync('./data/failed_recipes.json'));

const timeDelay = 300; // in ms, time per recipe, to avoid 429 too many requests
const timeout = async t => new Promise(r => setTimeout(r, t));

async function search(s1, s2) {
    const response = await fetch(`https://neal.fun/api/infinite-craft/pair?first=${s1}&second=${s2}`, {
        headers: {
            Referer: "https://neal.fun/infinite-craft/",
        },
    });

    /* Old code to throw error immediately
    if (!response.ok) {
        if (response.status === 429) throw new Error(`429: Too many requests. Retry after ${response.headers.get('Retry-After')}s.`);
        else throw new Error(`Fetch failed with status ${response.status}`)
    }
    */

    // New code to retry after the Retry After limit
    if (!response.ok) {
        if (response.status === 429) {
            let retryTime = response.headers.get('Retry-After');
            console.error(`429: Too many requests. Retrying after ${+retryTime + 5}s.`); // +5s for safety
            await timeout(retryTime * 1000 + 5000);
            return search(s1, s2);
        }
        else throw new Error(`Fetch failed with status ${response.status}`)
    }

    const foundObject = await response.json();
    return foundObject;
}

function weightedRNG(weights) {
    let rand = Math.random();
    rand *= weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < weights.length; i++) {
        if (rand < weights[i]) {
            return i;
        }
        rand -= weights[i];
    }
    return 0;
}

function weightedWeights(objs) {
    return objs.map(x => {
        let rand =
            (x.timesIngredient + 1)
            - (x.timesFail) * 0.5
            - (x.timesDupe) * 0.05;
        if (rand < 0) rand = 0;
        return rand;
    })
}

function selectItems() {
    let item1 = weightedRNG(weightedWeights(items));
    let item1Product = items[item1].product;

    let recipesItem1 = new Set(items.map(x => x.recipes)
        .flat(1) // all recipes into one list, not nested lists of lists of recipes
        .concat(failedRecipes)
        .filter(x => x[0] === item1Product || x[1] === item1Product)
        .map(x => x[0] === item1Product ? x[1] : x[0])
    );
    let item2Candidates;
    if (!recipesItem1.size) item2Candidates = items;
    else item2Candidates = items.filter(x => !recipesItem1.has(x.product));
    let item2 = weightedRNG(weightedWeights(item2Candidates));

    return [item1, item2];
}

function compareRecipes(recipe1, recipe2) {
    return (recipe1[0] === recipe2[0] && recipe1[1] === recipe2[1]) 
        || (recipe1[0] === recipe2[1] && recipe1[1] === recipe2[0])
}

async function run() {
    let randomItems = selectItems(); // returns indexes
    let recipe = [
        items[randomItems[0]].product,
        items[randomItems[1]].product
    ];
    let searchObj = await search(recipe[0], recipe[1]);

    let product = searchObj.result;
    if (product == "Nothing" || !product) {
        items[randomItems[0]].timesFail += 1;
        items[randomItems[1]].timesFail += 1;
        failedRecipes.push(recipe);
    } else if (itemFind = items.find(x => x.product === product)) {
        items[randomItems[0]].timesDupe += 1;
        items[randomItems[1]].timesDupe += 1;
        if (!itemFind.recipes.some(x => compareRecipes(x, recipe)))
            itemFind.recipes.push(recipe);
    } else {
        items.push({
            product: product,
            emoji: searchObj.emoji,
            timesIngredient: 0,
            timesFail: 0,
            timesDupe: 0,
            recipes: [recipe]
        });

        items[randomItems[0]].timesIngredient += 1;
        items[randomItems[1]].timesIngredient += 1;

        if (items.length % 10 === 0) { // change 10 to something more if less logging (not debug)
            fs.writeFileSync('./data/recipes.json', JSON.stringify(items, null, 4));
            fs.writeFileSync('./data/failed_recipes.json', JSON.stringify(failedRecipes, null, 4));
            console.log(`Wrote items list of length ${items.length} to recipes.json!`);
        }
    }

    await timeout(timeDelay);
    await run();
}

run();

/*
function onlyUnique(v, index, array) {
    return array.findIndex(o => o[0] == v[0] && o[1] == v[1]) === index;
}

let arr = [];
for (let i = 0; i < 100000; i++) {
    let si = selectItems();
    arr.push([
        items[si[0]].product,
        items[si[1]].product
    ])
}

let unique = arr.filter(onlyUnique);
for (let u of unique) {
    let x = arr.filter(e => e[0] == u[0] && e[1] == u[1]);
    console.log(u, x.length)
}
*/