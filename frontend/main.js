(function () {
  'use strict';

  var ALL = window.IDIOMS;
  if (!ALL || !ALL.length) {
    document.getElementById('questionText').textContent = '題庫載入失敗';
    return;
  }

  var TOTAL = ALL.length;

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  /** 本次測驗：隨機順序的 150 題 */
  var quizList = shuffle(ALL);
  var currentIndex = 0;
  var finished = false;

  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');
  var questionText = document.getElementById('questionText');
  var progressEl = document.getElementById('progress');
  var resultEl = document.getElementById('result');
  var btnClear = document.getElementById('btnClear');
  var btnSubmit = document.getElementById('btnSubmit');
  var btnNext = document.getElementById('btnNext');
  var canvasWrap = document.querySelector('.canvas-wrap');
  var hintEl = document.getElementById('hint');
  var versionEl = document.getElementById('version');

  var API_BASE = '';

  var CONFIDENCE_THRESHOLD = 0.75;

  if (versionEl) {
    var v = window.APP_VERSION ? String(window.APP_VERSION) : 'unknown';
    versionEl.textContent = '版本：' + v;
  }

  // 簡單防呆：沒有寫任何筆畫就不允許送出
  var hasInk = false;

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
    if (finished) return;
    e.preventDefault();
    drawing = true;
    var p = getPos(e);
    lastX = p.x;
    lastY = p.y;
  }

  function moveDraw(e) {
    if (finished) return;
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

    // 只要有畫到線就算有筆畫（避免空白也送出）
    hasInk = true;

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
    hasInk = false;
  }

  btnClear.addEventListener('click', function () {
    if (finished) return;
    clearCanvas();
  });

  function showResult(isCorrect, message) {
    resultEl.className = 'result ' + (isCorrect ? 'correct' : 'wrong');
    resultEl.textContent = message;
  }

  function canvasToBase64() {
    return canvas.toDataURL('image/png');
  }

  function normalizeChar(s) {
    if (s == null || s === '') return '';
    return String(s).normalize('NFKC').trim().charAt(0) || '';
  }

  function recognize(imageBase64, expectedAnswer, onDone) {
    fetch(API_BASE + '/recognize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: imageBase64,
        expectedAnswer: expectedAnswer,
        hasInk: hasInk
      })
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        onDone(null, data);
      })
      .catch(function (err) {
        onDone(err, null);
      });
  }

  function updateProgress() {
    if (finished) return;
    progressEl.textContent = '第 ' + (currentIndex + 1) + ' / ' + TOTAL + ' 題（隨機順序）';
  }

  function setPlayingUi(enabled) {
    btnSubmit.disabled = !enabled;
    btnClear.disabled = !enabled;
    canvas.style.opacity = enabled ? '1' : '0.5';
    canvas.style.pointerEvents = enabled ? 'auto' : 'none';
  }

  function showComplete() {
    finished = true;
    progressEl.textContent = '已全部完成（共 ' + TOTAL + ' 題）';
    questionText.textContent = '恭喜！已隨機考完所有成語';
    hintEl.textContent = '按「再玩一次」可重新洗牌再考一次';
    clearCanvas();
    resultEl.className = 'result correct';
    resultEl.textContent = '太棒了！';
    setPlayingUi(false);
    btnNext.textContent = '再玩一次';
    btnNext.disabled = false;
    if (canvasWrap) canvasWrap.style.display = 'none';
  }

  function restartQuiz() {
    finished = false;
    quizList = shuffle(ALL);
    currentIndex = 0;
    btnNext.textContent = '下一題';
    hintEl.textContent = '在下方畫板寫出括號裡的答案';
    if (canvasWrap) canvasWrap.style.display = '';
    setPlayingUi(true);
    loadQuestion();
  }

  function loadQuestion() {
    if (finished) return;
    if (currentIndex >= quizList.length) {
      showComplete();
      return;
    }
    var item = quizList[currentIndex];
    questionText.textContent = item.question;
    updateProgress();
    clearCanvas();
    btnNext.disabled = true;
  }

  btnSubmit.addEventListener('click', function () {
    if (finished) return;
    var item = quizList[currentIndex];
    if (!item) return;

    if (!hasInk) {
      showResult(false, '請先在畫板寫字再送出。');
      return;
    }

    var base64 = canvasToBase64();
    btnSubmit.disabled = true;
    resultEl.textContent = '辨識中…';
    resultEl.className = 'result';

    recognize(base64, item.answer, function (err, data) {
      btnSubmit.disabled = false;
      if (err) {
        showResult(false, '無法連線到辨識服務，請確認後端已啟動。');
        return;
      }
      var recognized = normalizeChar(data && data.recognized);
      var confidence = (data && typeof data.confidence === 'number') ? data.confidence : 0;
      var answerNorm = normalizeChar(item.answer);

      var match = recognized === answerNorm;
      var isCorrect = match && confidence >= CONFIDENCE_THRESHOLD;

      if (isCorrect) {
        showResult(true, '答對了！');
        btnNext.disabled = false;
      } else if (!match) {
        showResult(false, '再試一次！正確答案是「' + item.answer + '」。辨識為「' + (recognized || '？') + '」。');
      } else {
        showResult(false, '辨識信心不足，請再試一次！正確答案是「' + item.answer + '」。');
      }
    });
  });

  btnNext.addEventListener('click', function () {
    if (finished) {
      restartQuiz();
      return;
    }
    currentIndex += 1;
    if (currentIndex >= quizList.length) {
      showComplete();
    } else {
      loadQuestion();
    }
  });

  ctx.fillStyle = '#fafafa';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  loadQuestion();
})();
