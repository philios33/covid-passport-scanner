// Writes a build.json file containing the time of the last build

const fs = require('fs');
const buildTime = new Date();
fs.writeFileSync(__dirname + "/../compiled/build.json", JSON.stringify({
    buildTime: buildTime.toISOString(),
}));
