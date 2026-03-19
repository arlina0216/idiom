const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

/**
 * POST /recognize
 * Body: { image: "data:image/png;base64,...", expectedAnswer?: "序" }
 *
 * 預設為「練習用 mock」：若設 MOCK_USE_EXPECTED!=false，且 body 帶 expectedAnswer，
 * 則直接回傳該字（高信心），讓手寫流程可測通；接上真實辨識 API 前請設
 *   MOCK_USE_EXPECTED=false
 * 並改寫此處呼叫雲端辨識（否則任何人可偽造答案）。
 */
const MOCK_USE_EXPECTED = process.env.MOCK_USE_EXPECTED !== 'false';

app.post('/recognize', (req, res) => {
  const { image, expectedAnswer } = req.body || {};
  if (!image) {
    return res.status(400).json({ error: '缺少 image' });
  }

  if (MOCK_USE_EXPECTED && expectedAnswer != null && typeof expectedAnswer === 'string') {
    const ch = String(expectedAnswer).normalize('NFKC').trim().charAt(0);
    if (ch) {
      return res.json({
        recognized: ch,
        confidence: 0.97,
        mockMode: 'expected_echo'
      });
    }
  }

  return res.status(501).json({
    error: '尚未接上真正的手寫辨識服務（請部署時設 MOCK_USE_EXPECTED=true 走練習模式，或改寫後端接雲端 API）'
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
