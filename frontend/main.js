(function () {
  'use strict';

  // 成語題庫：題目字串（括號代表填空）、答案
  var idioms = [
    { question: '畫蛇添( )', answer: '足' },
    { question: '三( )兩語', answer: '言' },    
    { question: '( )心如焚', answer: '焦' },
    { question: '一( )不染', answer: '塵' },
    { question: '守( )待兔', answer: '株' }
  ];

  var currentIndex = 0;
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');
  var questionText = document.getElementById('questionText');
  var resultEl = document.getElementById('result');
  var btnClear = document.getElementById('btnClear');
  var btnSubmit = document.getElementById('btnSubmit');
  var btnNext = document.getElementById('btnNext');

  // 與後端同網址時用相對路徑（例如 http://localhost:3000）；發佈到 GitHub Pages 時改成你的後端網址
  var API_BASE =
    window.location.protocol === 'http:' || window.location.protocol === 'https:'
      ? ''
      : 'https://idiom-backend.onrender.com/';

  // 畫板：畫線
  var drawing = false;
  var lastX = 0;
  var lastY = 0;

  function getPos(e) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;
    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  function startDraw(e) {
    e.preventDefault();
    drawing = true;
    var p = getPos(e);
    lastX = p.x;
    lastY = p.y;
  }

  function moveDraw(e) {
    e.preventDefault();
    if (!drawing) return;
    var p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();
    lastX = p.x;
    lastY = p.y;
  }

  function endDraw(e) {
    e.preventDefault();
    drawing = false;
  }

  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', moveDraw);
  canvas.addEventListener('mouseup', endDraw);
  canvas.addEventListener('mouseleave', endDraw);
  canvas.addEventListener('touchstart', startDraw, { passive: false });
  canvas.addEventListener('touchmove', moveDraw, { passive: false });
  canvas.addEventListener('touchend', endDraw, { passive: false });

  function clearCanvas() {
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    resultEl.textContent = '';
    resultEl.className = 'result';
  }

  btnClear.addEventListener('click', clearCanvas);

  function showResult(isCorrect, message) {
    resultEl.className = 'result ' + (isCorrect ? 'correct' : 'wrong');
    resultEl.textContent = message;
  }

  // 把 canvas 轉成 base64 圖片
  function canvasToBase64() {
    return canvas.toDataURL('image/png');
  }

  // 呼叫後端 /recognize
  function recognize(imageBase64, onDone) {
    fetch(API_BASE + '/recognize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64 })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        onDone(null, data);
      })
      .catch(function (err) {
        onDone(err, null);
      });
  }

  function loadQuestion() {
    var item = idioms[currentIndex];
    questionText.textContent = item.question;
    clearCanvas();
    btnNext.disabled = true;
  }

  btnSubmit.addEventListener('click', function () {
    var item = idioms[currentIndex];
    if (!item) return;

    var base64 = canvasToBase64();
    btnSubmit.disabled = true;
    resultEl.textContent = '辨識中…';
    resultEl.className = 'result';

    recognize(base64, function (err, data) {
      btnSubmit.disabled = false;
      if (err) {
        showResult(false, '無法連線到辨識服務，請確認後端已啟動。');
        return;
      }
      var recognized = (data && data.recognized) ? data.recognized.trim() : '';
      var isCorrect = recognized === item.answer;
      if (isCorrect) {
        showResult(true, '答對了！');
        btnNext.disabled = false;
      } else {
        showResult(false, '再試一次！正確答案是「' + item.answer + '」。');
      }
    });
  });

  btnNext.addEventListener('click', function () {
    currentIndex = (currentIndex + 1) % idioms.length;
    loadQuestion();
  });

  // 初始化畫布底色
  ctx.fillStyle = '#fafafa';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  loadQuestion();
})();
