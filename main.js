const fs = require('fs');

let items = JSON.parse(fs.readFileSync('./data/recipes.json'));

async function search(s1, s2) {
    const response = await fetch(`https://neal.fun/api/infinite-craft/pair?first=${s1}&second=${s2}`, {
        headers: {
            Referer: "https://neal.fun/infinite-craft/",
        },
    });

    if (!response.ok) {
        if (response.status === 429) throw new Error(`429: Too many requests. Retry after ${response.headers.get('Retry-After')}s.`);
        else throw new Error(`Fetch failed with status ${response.status}`)
    }

    const foundObject = await response.json();
    return foundObject;
}

async function run() {
    let randomItem1 = items[(Math.random() * items.length) | 0];
    let randomItem2 = items[(Math.random() * items.length) | 0];
    let searchObj = await search(randomItem1.product, randomItem2.product);

    let product = searchObj.result;
    if (product !== "Nothing" && !items.some(x => x.product === product)) {
        items.push({
            product: product,
            emoji: searchObj.emoji,
            ingredient1: randomItem1.product,
            ingredient2: randomItem2.product
        });
        if (items.length % 10 === 0) {
            fs.writeFileSync('./data/recipes.json', JSON.stringify(items, null, 4));
            console.log(`Wrote items list of length ${items.length} to recipes.json!`);
        }
    }

    await run();
}

run();