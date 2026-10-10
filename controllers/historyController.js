const historyDb = require("../db");

async function handleListHistory(req, res) {
  try {
    const { platform, search } = req.query;
    const limit = Math.min(parseInt(req.query.limit, 10) || 200, 1000);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    const data = historyDb.listEntries({ platform, search, limit, offset });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function handleAddHistory(req, res) {
  try {
    const { url, title, platform, icon, thumbnail, date } = req.body || {};

    if (!url) {
      return res
        .status(400)
        .json({ success: false, error: "Missing 'url' in request body." });
    }

    const entry = historyDb.addEntry({
      url,
      title,
      platform,
      icon,
      thumbnail,
      date,
    });
    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function handleClearHistory(req, res) {
  try {
    const result = historyDb.clearHistory(req.query.platform);
    res.json({ success: true, data: { deleted: result.changes } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function handleStatsHistory(req, res) {
  try {
    const data = historyDb.statsByPlatform();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  handleListHistory,
  handleAddHistory,
  handleClearHistory,
  handleStatsHistory,
};
