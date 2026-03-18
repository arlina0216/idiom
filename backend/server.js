const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

/**
 * POST /recognize
 * Body: { image: "data:image/png;base64,..." }
 * 目前為 mock（實際接雲端 API 時改寫此處）
 */
app.post('/recognize', (req, res) => {
  const { image } = req.body || {};
  if (!image) {
    return res.status(400).json({ error: '缺少 image' });
  }

  const mockChars = ['言', '足', '焦', '塵', '株'];
  const recognized = mockChars[Math.floor(Math.random() * mockChars.length)];
  const confidence = 0.85 + Math.random() * 0.1;

  res.json({
    recognized,
    confidence: Math.round(confidence * 100) / 100
  });
});

// 一併提供前端：請用 http://localhost:3000 開啟（勿用 file:// 雙擊 html）
const frontendDir = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendDir, { index: 'index.html' }));

app.listen(PORT, () => {
  console.log('');
  console.log('請在瀏覽器開啟（成語頁面 + API 同一個網址）：');
  console.log('  http://localhost:' + PORT);
  console.log('');
});
