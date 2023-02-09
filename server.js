const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

async function generateScreenshot(url) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
      "--window-size=1920x1080",
    ],
  });

  let pages = await browser.pages();
  page = pages[0];
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"
  );

  await page.goto(url);

  let ogImage = "";
  let ogTitle = url;
  let ogDescription = "";

  try {
    ogImage = await page.$eval('meta[property="og:image"]', (el) => el.content);
    ogTitle = await page.$eval('meta[property="og:title"]', (el) => el.content);
    ogDescription = await page.$eval(
      'meta[property="og:description"]',
      (el) => el.content
    );
  } catch (err) {
    console.log(err);
  }

  // 如果沒有 og:image，就用 google 搜尋圖片
  if (!ogImage) {
    await page.goto(
      `https://www.google.com/search?q=${encodeURIComponent(
        url
      )}&rlz=1C1GCEA_enUS832US832&source=lnms&tbm=isch&sa=X&ved=0ahUKEwiY5J6Z5M_iAhXOyDgGHQzlAQQ_AUIEigB&biw=1366&bih=657`
    );

    // console.log(
    //   `https://www.google.com/search?q=${encodeURIComponent(
    //     url
    //   )}&rlz=1C1GCEA_enUS832US832&source=lnms&tbm=isch&sa=X&ved=0ahUKEwiY5J6Z5M_iAhXOyDgGHQzlAQQ_AUIEigB&biw=1366&bih=657`
    // );
    // console.log("--------------------------------------------------------");

    // const imageSrcs = await page.evaluate(() =>
    //   Array.from(document.querySelectorAll("img"), (img) => {
    //     if (!img.src.startsWith("data:image/png;base64")) {
    //       return null;
    //     } else {
    //       return img.src;
    //     }
    //   }).filter(Boolean)
    // );
    // console.log(imageSrcs[0]);

    const selector =
      "#islrg > div.islrc > div:nth-child(2) > a.wXeWr.islib.nfEiy > div.bRMDJf.islir > img";
    const imageSrc = await page.evaluate((selector) => {
      const imageElement = document.querySelector(selector);
      return imageElement ? imageElement.src : null;
    }, selector);

    // 去到圖片網址
    await page.goto(imageSrc);
    await page.screenshot({ path: "screenshot.png" });
  }

  await browser.close();
  return { ogImage, ogTitle, ogDescription };
}

// generateScreenshot('https://www.example.com');

// 後端伺服器
const express = require("express");
const app = express();
const port = 3001;

const allowedIps = ["0.0.0.0"];
app.use((req, res, next) => {
  // const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  // console.log(clientIp);
  // if (allowedIps.includes(clientIp)) {
  //   next();
  // } else {
  //   res.status(403).send("Forbidden");
  // }
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// http://localhost:3001/screenshot?url=https://www.example.com
app.get("/screenshot", async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).send("url parameter is required");
  }

  try {
    const { ogImage, ogTitle, ogDescription } = await generateScreenshot(url);

    // console.log(ogImage, ogTitle, ogDescription);

    if (ogImage) {
      res.send({
        ogImage,
        ogTitle,
        ogDescription,
      });
    } else {
      const screenshot = fs
        .readFileSync(path.join(__dirname, "screenshot.png"))
        .toString("base64");

      res.send({
        ogImage,
        ogTitle,
        ogDescription,
        screenshot,
      });
    }
    // res.sendFile(`${__dirname}/screenshot.png`);
    console.log("screenshot.png generated");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
