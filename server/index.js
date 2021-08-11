const path = require("path");
const fs = require("fs");
const express = require("express");
const compression = require('compression');
const mkdirp = require('mkdirp')

const DIST_DIR = path.join(__dirname, "..", "dist");
const PORT = 8081;
const app = express();

// Allow posting of json
app.use(express.json());

// Use gzip
app.use(compression());


// Only send index.html when user accesses the root page
app.get("/", function (req, res) {
  // No cache
  res.sendFile(path.join(DIST_DIR, "index.html"));
});

// Robots page
app.get("/robots.txt", function (req, res) {
  // No cache
  res.sendFile(path.join(DIST_DIR, "robots.txt"));
});

// Fav icon
app.get("/favicon.ico", function (req, res) {
  // No cache
  res.sendFile(path.join(DIST_DIR, "favicon.ico"));
});

// Serve all other files in the dist folder with long cache control
app.use(express.static(DIST_DIR, {
  maxAge: "1y",
  immutable: true,
}));

//Send index.html when the user access the web
/*
app.get("*", function (req, res) {
  res.sendFile(path.join(DIST_DIR, "index.html"));
});
*/

const REPORTS_DIR = __dirname + "/reports";
if (!fs.existsSync(REPORTS_DIR)) {
  console.error("REPORTS dir does not exist!");
  process.exit(1);
}

app.post("/usage/:type", (req, res) => {
  if (req.headers['content-type'] === "application/json") {
    // Write the usage file based on timestamp
    const type = req.params.type;
    const now = new Date();
    const yearMonth = now.getFullYear() + "-" + (now.getMonth() + 1);
    const date = now.getDate().toString();
    const time = now.getHours() + "-" + now.getMinutes() + "-" + now.getSeconds() + "-" + now.getMilliseconds();
    const fileLocation = path.join(REPORTS_DIR, yearMonth, date, time + "-" + type + ".json");

    mkdirp.sync(path.dirname(fileLocation));
    fs.writeFileSync(fileLocation, JSON.stringify(req.body, null, 4));
    res.send("OK");
        
  } else {
    console.warn("Not json", req.headers);
    res.send("notOK");
  }
});


app.listen(PORT);

console.log("Listening on port " + PORT);

// Required for control+C compatibility
process.on("SIGINT", () => {
  process.exit(1);
})

