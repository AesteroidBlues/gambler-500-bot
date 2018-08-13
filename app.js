const Discord = require('discord.js');
const Craigslist = require('node-craigslist');
const Lzma = require('lzma');
const TinyURL = require('tinyurl');

let keywords = [
    'isuzu',
    'jeep',
    'subaru',
    '4wd', '4x4', '4 wheel drive', 'awd', 'all wheel drive',
    '4runner', '4 runner'
]

function main() {
    // let client = new Discord.Client();
    // client.login(process.env.DISCORD_TOKEN);
    // client.on('ready', () => {
    //     console.log(`Logged in as ${client.user.tag}!`);
    // });

    // client.on('message', message => {
    //     if (message.content == "!list") {
    //         message.channel.send("Lookin' for a good deal");
    //         performSearch().then((resultLink) => {
    //             message.channel.send("Catch a riiiiide!'\n" + resultLink);
    //         })
    //     }
    // });

    performSearch().then((url) => {
        console.log(url);
    });
}

function performSearch() {
    return new Promise((resolve, reject) => {
        let client = new Craigslist.Client({
            city: "Seattle"
        });
    
        listAvailable(client)
            .then(filterCandidates)
            .then((candidates) => {
                console.log("Getting candidate details");
                var detailsCalls = [];
                candidates.forEach((candidate) => {
                    detailsCalls.push(client.details(candidate));
                });

                return Promise.all(detailsCalls);
            })
            .then((candidateDetails) => {
                console.log("Building itty bitty page");
                let html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8" />
                    <meta http-equiv="X-UA-Compatible" content="IE=edge">
                    <title>Page Title</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <link rel="stylesheet" type="text/css" media="screen" href="main.css" />
                    <script src="main.js"></script>
                </head>
                <body>
                `;

                candidateDetails.forEach((details) => {
                    html += `
                    <div style="margin-bottom: 125px">
                        <img src="${details.images[0]}">
                        <a href="${details.url}" target="_blank">
                            <h1>${details.title}</h1>
                        </a>
                        <p>${details.description}</p>
                    </div>
                    `
                });

                html += `
                </body>
                </html>
                `

                return buildIttyBittyLink(html);
            })
            .then((url) => {
                console.log("Shortening URL");
                TinyURL.shorten(url, (shortUrl) => {
                    resolve(shortUrl);
                });
            })
            .catch((reason) => {
                console.log(reason);
            });
    });
}

function listAvailable(client) {
    console.log("Initializing client");
    return client.list({
        category: 'cta', // cars + trucks
        minAsk: 100,
        maxAsk: 500,
        hasPic: true,
        searchNearby: true
    });
}

function filterCandidates(listings) {
    console.log("Filtering candidates");
    let candidates = [];
    listings.forEach((listing) => {
        if (!listing.hasPic) 
            return;

        keywords.forEach((keyword) => {
            if (listing.title.includes(keyword)) {
                candidates.push(listing);
            }
        });
    });
    
    console.log(`Found ${candidates.length} candidates`);
    return Promise.resolve(candidates);
}

function buildIttyBittyLink(htmlString) {
    return new Promise((resolve, reject) => {
        Lzma.compress(htmlString, 9, (result, error) => {
            resolve("https://itty.bitty.site/#/" + Buffer.from(result).toString('base64'));
        });
    });
}

main();
