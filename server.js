const puppeteer = require("puppeteer");

async function generateScreenshot(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);
  await page.screenshot({ path: "screenshot.png" });
  await browser.close();
}

// generateScreenshot('https://www.example.com');

// 後端伺服器
const express = require("express");
const app = express();
const port = 3000;

const allowedIps = ["118.150.169.166"];
app.use((req, res, next) => {
  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  console.log(clientIp)
  if (allowedIps.includes(clientIp)) {
    next();
  } else {
    res.status(403).send("Forbidden");
  }
});

// http://localhost:3000/screenshot?url=https://www.example.com
app.get("/screenshot", async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).send("url parameter is required");
  }

  try {
    await generateScreenshot(url);
    res.sendFile(`${__dirname}/screenshot.png`);
    console.log("screenshot.png generated");
  } catch (err) {
    res.status(500).send(err.message);
    console.log(err);
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
