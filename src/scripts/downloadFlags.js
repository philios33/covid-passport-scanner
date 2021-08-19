
const fs = require('fs');
const util = require('util');
const { default: axios } = require('axios');
const certs = require('../compiled/certs.json');
const svgexport = require('svgexport');

const issuerCodes = [];
for(const keyId in certs.keys) {
    const key = certs.keys[keyId];
    if (issuerCodes.indexOf(key.issuer) === -1) {
        issuerCodes.push(key.issuer);
    }
}


// We assume the issuer code is the 2 character country code.
const svgDir = __dirname + "/../images/flags/svg";

(async () => {
    try {
        const forceRedownloadAll = false;
        // Get the SVG data first by downloading straight from the github
        for(let issuer of issuerCodes) {
            const targetFile = svgDir + "/" + issuer.toLowerCase() + ".svg";
            if (forceRedownloadAll || !fs.existsSync(targetFile)) {
                const url = "https://raw.githubusercontent.com/hampusborgos/country-flags/main/svg/" + issuer.toLowerCase() + ".svg";
                console.log("Downloading " + url + " ...");
                const result = await axios({
                    url,
                });
                fs.writeFileSync(targetFile, result.data);
                console.log("Saved");
            }
        };

        // Then convert all to 20px high pngs
        const pngsDir = __dirname + "/../images/flags/png20h";
        const renderData = [];
        for(let issuer of issuerCodes) {
            renderData.push({
                input: [svgDir + "/" + issuer.toLowerCase() + ".svg", "pad", ":20"],
                output: [pngsDir + "/" + issuer.toLowerCase() + ".png"],
            })
        }

        const render = util.promisify(svgexport.render);
        await render(renderData);
        
        // Now build the flags.ts file that should import all of the flag locations
        // We only render flags at 20px high, so the pngs are a lot smaller than the svg files.
        let content = "export default {\n";
        for(let issuer of issuerCodes) {
            content += "\t\"" + issuer.toUpperCase() + "\": require('../images/flags/png20h/" + issuer.toLowerCase() + ".png'),\n";
        }
        content += "}\n";
        fs.writeFileSync(__dirname + "/../compiled/flags.ts", content);

        console.log("Done");

    } catch(e) {
        console.error(e);
    }
})();




