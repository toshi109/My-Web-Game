// Canvas設定
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const isAndroid = /Android/i.test(navigator.userAgent);



if (isAndroid) {
  // Android向け軽量モード（解像度を落とす）
  canvas.width = window.innerWidth / 0.4;
  canvas.height = window.innerHeight / 0.4;
  console.log("Android: 軽量モードON");
} else {
 
  // PCの場合、キャンバスサイズを固定する
  canvas.width = 800;
  canvas.height = 600;
  console.log("通常モード");
}





// ゲーム定数
const Config = {
  BLOCK: {
    ROWS: 4,
    COLS: 10,
    WIDTH: 60,
    HEIGHT: 20,
    PADDING: 10,
    OFFSET_TOP: 30,
    OFFSET_LEFT: 30
  },
  BALL: {
    RADIUS: 10,
    INIT_SPEED_X: 3,
    INIT_SPEED_Y: -3
  },
  PADDLE: {
    WIDTH: 100,
    HEIGHT: 20
  },
};

// ゲーム状態
const GameState = {
  RUNNING: 0,
  GAME_OVER: 1,
  PERFECT: 2
};

// ゲームデータ
let gameData = {
  state: GameState.RUNNING,
  ball: {
    x: canvas.width / 2,
    y: canvas.height / 2,
    speedX: Config.BALL.INIT_SPEED_X,
    speedY: Config.BALL.INIT_SPEED_Y,
    color: "red"
  },
  paddle: {
    x: canvas.width / 2 - Config.PADDLE.WIDTH / 2,
    y: canvas.height - 30,
    color: "blue",
    width: Config.PADDLE.WIDTH,
    height: Config.PADDLE.HEIGHT
  },
  blocks: [],
  score: 0,
  remainingBlocks: Config.BLOCK.ROWS * Config.BLOCK.COLS
};

// 聖句データ
let versesData = {};
let currentCategory = "hope";

// DOM要素
const retryBtn = document.getElementById("retryBtn");
const verseBox = document.getElementById("verseBox");

// 初期化
function init() {
  fetch("/static/js/verses.json")
    .then(response => response.json())
    .then(data => {
      versesData = data;
      showRandomVerse();
      startGame();
    });

  setupEventListeners();

  // === 🔽 この部分を追加 ===
  const changeBtn = document.getElementById("change-verse");
  if (changeBtn) {
        changeBtn.addEventListener("click", () => {
          showRandomVerse(); // クリックでランダムな聖句を表示
        });
}

// イベントリスナー設定
function setupEventListeners() {
  retryBtn.addEventListener("click", resetGame);

  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    gameData.paddle.x = Math.max(
      0,
      Math.min(mouseX - gameData.paddle.width / 2, canvas.width - gameData.paddle.width)
    );
  });
}

// ブロック初期化
function initBlocks() {
  gameData.blocks = [];
  gameData.remainingBlocks = Config.BLOCK.ROWS * Config.BLOCK.COLS;
  console.log("ブロック初期スタート");

  for (let c = 0; c < Config.BLOCK.COLS; c++) {
    gameData.blocks[c] = [];
    for (let r = 0; r < Config.BLOCK.ROWS; r++) {
      gameData.blocks[c][r] = {
        x: (c * (Config.BLOCK.WIDTH + Config.BLOCK.PADDING)) + Config.BLOCK.OFFSET_LEFT,
        y: (r * (Config.BLOCK.HEIGHT + Config.BLOCK.PADDING)) + Config.BLOCK.OFFSET_TOP,
        status: 1
      };
    }
  }
}

// 当たり判定
function collisionDetection() {
  // パドル衝突
  if (
    gameData.ball.x > gameData.paddle.x &&
    gameData.ball.x < gameData.paddle.x + gameData.paddle.width &&
    gameData.ball.y + Config.BALL.RADIUS > gameData.paddle.y
  ) {
    gameData.ball.speedY *= -1;
    return;
  }

  // ブロック衝突
  for (let c = 0; c < Config.BLOCK.COLS; c++) {
    for (let r = 0; r < Config.BLOCK.ROWS; r++) {
      const block = gameData.blocks[c][r];
      if (block.status === 1 &&
          gameData.ball.x > block.x &&
          gameData.ball.x < block.x + Config.BLOCK.WIDTH &&
          gameData.ball.y > block.y &&
          gameData.ball.y < block.y + Config.BLOCK.HEIGHT) {

        gameData.ball.speedY *= -1;
        block.status = 0;
        gameData.score += 10;
        gameData.remainingBlocks--;

        if (gameData.remainingBlocks === 0) {
          triggerPerfect();
        }
        return;
      }
    }
  }
}

// ゲーム状態管理
function triggerPerfect() {
  gameData.state = GameState.PERFECT;
  showRandomVerse(currentCategory);
  toggleRetryBtn(true);
}

function triggerGameOver() {
  gameData.state = GameState.GAME_OVER;
  toggleRetryBtn(true);
}

// 描画関数
function drawBall() {
  ctx.fillStyle = gameData.ball.color;
  ctx.beginPath();
  ctx.arc(gameData.ball.x, gameData.ball.y, Config.BALL.RADIUS, 0, Math.PI * 2);
  ctx.fill();
}

function drawPaddle() {
  ctx.fillStyle = gameData.paddle.color;
  ctx.fillRect(
    gameData.paddle.x,
    gameData.paddle.y,
    gameData.paddle.width,
    gameData.paddle.height
  );
}

function drawBlocks() {
  ctx.fillStyle = "green";
  gameData.blocks.forEach(column => {
    column.forEach(block => {
      if (block.status === 1) {
        ctx.fillRect(block.x, block.y, Config.BLOCK.WIDTH, Config.BLOCK.HEIGHT);
      }
    });
  });
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "red";
  ctx.font = "bold 48px Arial";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
}

function drawPerfect() {
  // グラデーション背景
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#4b6cb7');
  gradient.addColorStop(1, '#182848');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // メインテキスト
  ctx.fillStyle = "gold";
  ctx.font = "bold 60px Arial";
  ctx.textAlign = "center";
  ctx.fillText("🎉 PERFECT! 🎉", canvas.width / 2, canvas.height / 2 - 30);

  // 聖句表示
  ctx.font = "24px Arial";
  ctx.fillStyle = "white";
  ctx.fillText(verseBox.textContent, canvas.width / 2, canvas.height / 2 + 30);
}



// ゲームループ
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  switch (gameData.state) {
    case GameState.RUNNING:
      updateGame();
      drawGameElements();
      break;
    case GameState.GAME_OVER:
      drawGameOver();
      break;
    case GameState.PERFECT:
      drawPerfect();
      break;
  }

  requestAnimationFrame(gameLoop);
}


function updateGame() {
  // ボール移動
  gameData.ball.x += gameData.ball.speedX;
  gameData.ball.y += gameData.ball.speedY;

  // 壁衝突
  if (gameData.ball.x + Config.BALL.RADIUS > canvas.width ||
      gameData.ball.x - Config.BALL.RADIUS < 0) {
    gameData.ball.speedX *= -1;
  }
  if (gameData.ball.y - Config.BALL.RADIUS < 0) {
    gameData.ball.speedY *= -1;
  }

  // ゲームオーバー判定
  if (gameData.ball.y + Config.BALL.RADIUS > canvas.height) {
    triggerGameOver();
    return;
  }

  collisionDetection();
}

function drawGameElements() {
  drawBall();
  drawPaddle();
  drawBlocks();
}

// ゲーム制御
function startGame() {
  gameData.state = GameState.RUNNING;
  toggleRetryBtn(false);
  initBlocks();
  resetBall();
  gameLoop();
}

function resetGame() {
  gameData.score = 0;
  gameData.state = GameState.RUNNING;
  startGame();
}

function resetBall() {
  gameData.ball.x = canvas.width / 2;
  gameData.ball.y = canvas.height / 2;
  gameData.ball.speedX = Config.BALL.INIT_SPEED_X;
  gameData.ball.speedY = Config.BALL.INIT_SPEED_Y;
}


// マウスイベント
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  gameData.paddle.x = Math.max(
    0,
    Math.min(mouseX - gameData.paddle.width / 2, canvas.width - gameData.paddle.width)
  );
});





 // タッチイベント (修正版)
  let touchX = 0;
  let isTouching = false;

  canvas.addEventListener('touchstart', (e) => {
    if (e.cancelable) e.preventDefault();
    isTouching = true;
    const rect = canvas.getBoundingClientRect();
    touchX = e.touches[0].clientX - rect.left;
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    if (isTouching) {
      if (e.cancelable) e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const newTouchX = e.touches[0].clientX - rect.left;
      const deltaX = newTouchX - touchX;
      touchX = newTouchX;

      gameData.paddle.x = Math.max(
        0,
        Math.min(gameData.paddle.x + deltaX * 1.5, canvas.width - gameData.paddle.width)
      );
    }
  }, { passive: false }); // ← ここを false に戻す！

  canvas.addEventListener('touchend', () => {
    isTouching = false;
  });
}




// 聖句関連
function showRandomVerse(category = currentCategory) {
  const verseList = versesData[category];
  if (verseList?.length) {
    const randomVerse = verseList[Math.floor(Math.random() * verseList.length)];
    verseBox.textContent = randomVerse;
    verseBox.style.display = "block";
  }
}

function updateCategoryByProgress(count) {
  if (count < 6) currentCategory = "hope";
  else if (count < 9) currentCategory = "encouragement";
  else currentCategory = "gratitude";
}

// UI制御
function toggleRetryBtn(show) {
  retryBtn.style.display = show ? "block" : "none";
}

// ゲーム開始時に非表示

toggleRetryBtn(false);

// 開発者用テストコード（コンソールで直接実行）
function testPerfectScreen() {
    gameData.state = GameState.PERFECT;
    drawPerfect();
    toggleRetryBtn(true);
  }

// ゲーム開始
init();