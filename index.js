const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.set("json spaces", 2);
app.use(morgan("dev"));

app.use(express.static(path.join(__dirname, "public")));

app.use("/api/bluesky", require("./routes/bluesky"));
app.use("/api/capcut", require("./routes/capcut"));
app.use("/api/dailymotion", require("./routes/dailymotion"));
app.use("/api/douyin", require("./routes/douyin"));
app.use("/api/kuaishou", require("./routes/kuaishou"));
app.use("/api/linkedin", require("./routes/linkedin"));
app.use("/api/meta", require("./routes/facebookInsta"));
app.use("/api/pinterest", require("./routes/pinterest"));
app.use("/api/reddit", require("./routes/reddit"));
app.use("/api/spotify", require("./routes/spotify"));
app.use("/api/snapchat", require("./routes/snapchat"));
app.use("/api/soundcloud", require("./routes/soundcloud"));
app.use("/api/terabox", require("./routes/terabox"));
app.use("/api/threads", require("./routes/threads"));
app.use("/api/tiktok", require("./routes/tiktok"));
app.use("/api/tumblr", require("./routes/tumblr"));
app.use("/api/twitter", require("./routes/twitter"));
app.use("/api/youtube", require("./routes/youtube"));
app.use("/api/history", require("./routes/history"));

const endpoints = [
  "/api/bluesky",
  "/api/capcut",
  "/api/dailymotion",
  "/api/douyin",
  "/api/kuaishou",
  "/api/linkedin",
  "/api/meta",
  "/api/pinterest",
  "/api/reddit",
  "/api/snapchat",
  "/api/spotify",
  "/api/soundcloud",
  "/api/terabox",
  "/api/threads",
  "/api/tiktok",
  "/api/tumblr",
  "/api/twitter",
  "/api/youtube",
];

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/api/detect", (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ success: false, error: "Missing 'url' query parameter." });
  }

  const platformPatterns = [
    { name: "youtube", pattern: /(?:youtube\.com|youtu\.be)/i },
    { name: "tiktok", pattern: /tiktok\.com/i },
    { name: "instagram", pattern: /instagram\.com/i },
    { name: "twitter", pattern: /(?:twitter\.com|x\.com)/i },
    { name: "facebook", pattern: /facebook\.com/i },
    { name: "spotify", pattern: /spotify\.com/i },
    { name: "reddit", pattern: /reddit\.com/i },
    { name: "pinterest", pattern: /pinterest\./i },
    { name: "snapchat", pattern: /snapchat\.com/i },
    { name: "linkedin", pattern: /linkedin\.com/i },
    { name: "soundcloud", pattern: /soundcloud\.com/i },
    { name: "dailymotion", pattern: /dailymotion\.com/i },
    { name: "threads", pattern: /threads\.net/i },
    { name: "bluesky", pattern: /bsky\.app/i },
    { name: "douyin", pattern: /douyin\.com/i },
    { name: "kuaishou", pattern: /kuaishou\.com/i },
    { name: "tumblr", pattern: /tumblr\.com/i },
    { name: "terabox", pattern: /terabox\.com/i },
    { name: "capcut", pattern: /capcut\.com/i },
  ];

  for (const platform of platformPatterns) {
    if (platform.pattern.test(url)) {
      return res.json({ success: true, platform: platform.name });
    }
  }

  res.json({ success: true, platform: "unknown" });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
  });
});

app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(500).json({
    success: false,
    error: "Internal Server Error",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Universal Downloader corriendo en http://localhost:${PORT}`);
});
