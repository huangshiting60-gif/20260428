// Hand Pose Detection with ml5.js
// https://thecodingtrain.com/tracks/ml5js-beginners-guide/ml5/hand-pose

let video;
let handPose;
let hands = [];
let bubbles = [];
let fishes = [];
let seaweeds = [];
let statusMessage = "⏳ 正在檢查系統支援度...";

// 定義手部骨架的連接點索引
const connections = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // 0 到 4 串接
  [5, 6], [6, 7], [7, 8],               // 5 到 8 串接
  [9, 10], [10, 11], [11, 12],          // 9 到 12 串接
  [13, 14], [14, 15], [15, 16],         // 13 到 16 串接
  [17, 18], [18, 19], [19, 20]          // 17 到 20 串接
];

function mousePressed() {
  console.log(hands);
}

function gotHands(results) {
  hands = results;
  // 成功抓到手後自動隱藏提示訊息，保持畫面乾淨
  if (hands.length > 0 && statusMessage.includes("請將手出現在鏡頭前")) {
    statusMessage = ""; 
  }
}

function setup() {
  // 第一步：產生一個全螢幕的畫布
  createCanvas(windowWidth, windowHeight);
  
  // 檢查瀏覽器是否支援 WebGL
  let canvasObj = document.createElement('canvas');
  let gl = canvasObj.getContext('webgl') || canvasObj.getContext('experimental-webgl');
  let isWebGLSupported = gl && gl instanceof WebGLRenderingContext;
  
  if (!isWebGLSupported) {
    statusMessage = "❌ 警告：您的裝置不支援 WebGL，模型可能無法運作！";
  } else {
    statusMessage = "⏳ WebGL 支援正常。正在載入 ml5.js 模型...";
  }

  // 擷取攝影機影像並配合 ml5 啟用水平翻轉
  video = createCapture(VIDEO, { flipped: true });
  video.hide(); // 隱藏預設的 HTML 影片元素，讓我們只在畫布上繪製它
  
  // 初始化海底環境（魚群與海草）
  initOcean();

  try {
    // 將模型載入移至 setup 並使用 callback 取得成功狀態
    handPose = ml5.handPose({ flipped: true }, function() {
      if (isWebGLSupported) {
        statusMessage = "✅ 模型載入成功！請將手出現在鏡頭前。";
      }
      // 模型載入完畢後開始偵測手部
      handPose.detectStart(video, gotHands);
    });
  } catch (e) {
    statusMessage = "❌ 模型載入發生錯誤：" + e.message;
  }
}

function draw() {
  // 繪製深藍色漸層海底背景，增加水下深度的立體感與美觀度
  push();
  let bgGradient = drawingContext.createLinearGradient(0, 0, 0, windowHeight);
  bgGradient.addColorStop(0, '#0083B0'); // 上方：較亮的水藍色 (靠近海面)
  bgGradient.addColorStop(1, '#001528'); // 下方：深邃的海底深藍色
  drawingContext.fillStyle = bgGradient;
  noStroke();
  rect(0, 0, windowWidth, windowHeight);
  pop();

  // 計算顯示的影像寬高（整個畫布寬高的 50%）
  let imgW = windowWidth * 0.5;
  let imgH = windowHeight * 0.5;
  
  // 計算置中顯示的 X 與 Y 座標
  let x = (windowWidth - imgW) / 2;
  let y = (windowHeight - imgH) / 2;
  
  // 將擷取的影像繪製在視窗中間
  image(video, x, y, imgW, imgH);

  // --- 繪製海底場景 (沙灘、海草、魚群) ---
  fill(194, 178, 128); // 海底沙子的顏色
  noStroke();
  rectMode(CORNER);
  rect(0, windowHeight - 80, windowWidth, 80);
  
  for (let s of seaweeds) s.draw();
  for (let f of fishes) {
    f.update();
    f.draw();
  }

  // Ensure at least one hand is detected and video is loaded
  if (hands.length > 0 && video.width > 0) {
    for (let hand of hands) {
      // ml5.js 底層已經做過信心度篩選，可直接繪製
      // 繪製骨架線條
      stroke(255); // 設定骨架線條為白色
      strokeWeight(4); // 線條粗細
      for (let j = 0; j < connections.length; j++) {
        let partA = hand.keypoints[connections[j][0]];
        let partB = hand.keypoints[connections[j][1]];
        
        // 同樣需要套用縮放比例與位置偏移量
        let ax = x + partA.x * (imgW / video.width);
        let ay = y + partA.y * (imgH / video.height);
        let bx = x + partB.x * (imgW / video.width);
        let by = y + partB.y * (imgH / video.height);
        
        line(ax, ay, bx, by);
      }

      // Loop through keypoints and draw circles or hearts
      const fingertips = [4, 8, 12, 16, 20];
      for (let i = 0; i < hand.keypoints.length; i++) {
        let keypoint = hand.keypoints[i];

        // 根據縮放與置中後的影像，計算對應的畫布座標
        let adjustedX = x + keypoint.x * (imgW / video.width);
        let adjustedY = y + keypoint.y * (imgH / video.height);

        if (fingertips.includes(i)) {
          // 在指尖畫愛心
          drawHeart(adjustedX, adjustedY, 30);

          // 從指尖產生氣泡
          if (frameCount % 6 === 0) { // 控制氣泡產生頻率
            bubbles.push(new Bubble(adjustedX, adjustedY));
          }
        } else {
          // 其他關節點畫圓圈
          fill(hand.handedness == "Left" ? color(255, 0, 255) : color(255, 255, 0));
          noStroke();
          circle(adjustedX, adjustedY, 16);
        }
      }
    }
  }

  // 在畫面最下層顯示狀態訊息介面 (與文字互換位置)
  if (statusMessage !== "") {
    push();
    fill(255, 255, 255, 200); // 繪製半透明白色背景框
    noStroke();
    rectMode(CENTER);
    // 背景框寬度設定為畫面的 90%，但不超過 450px
    rect(windowWidth / 2, windowHeight - 40, Math.min(windowWidth * 0.9, 450), 40, 10);
    
    fill(0);
    textSize(16);
    textAlign(CENTER, CENTER);
    text(statusMessage, windowWidth / 2, windowHeight - 40);
    pop();
  }

  // 更新並繪製所有氣泡
  for (let i = bubbles.length - 1; i >= 0; i--) {
    bubbles[i].update();
    bubbles[i].draw();
    if (bubbles[i].isFinished()) {
      bubbles.splice(i, 1); // 移除生命週期結束的氣泡
    }
  }

  // 在上方中間繪製指定文字 (與狀態列互換位置)
  push();
  fill(255);
  stroke(0);
  strokeWeight(3);
  textSize(24);
  textAlign(CENTER, TOP);
  text("414730175黃詩婷", windowWidth / 2, 20);
  pop();
}
// 當瀏覽器視窗大小改變時，動態調整畫布尺寸以維持全螢幕
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initOcean(); // 視窗改變時重新生成海洋物件適應新尺寸
}

// --- Helper Functions and Classes ---

// 繪製愛心的函式
function drawHeart(x, y, size) {
  push();
  fill(255, 80, 130); // 浪漫的粉紅色
  noStroke();
  beginShape();
  // 從底部尖端開始繪製一個向上的愛心
  vertex(x, y);
  bezierVertex(x - size / 1.5, y - size / 2, x - size / 2, y - size, x, y - size / 1.5);
  bezierVertex(x + size / 2, y - size, x + size / 1.5, y - size / 2, x, y);
  endShape(CLOSE);
  pop();
}

// 氣泡的類別
class Bubble {
  constructor(x, y) {
    this.x = x + random(-10, 10); // 初始位置稍微隨機偏移
    this.y = y;
    this.size = random(15, 40);
    this.xSpeed = random(-0.5, 0.5); // 左右飄移
    this.ySpeed = random(1, 3);      // 向上速度
    this.lifespan = 255;             // 生命週期，用於淡出效果
  }

  // 更新氣泡狀態（位置、生命週期）
  update() {
    this.x += this.xSpeed;
    this.y -= this.ySpeed;
    this.lifespan -= 2.5; // 數字越大，淡出越快，「破掉」的速度也越快
  }

  // 檢查氣泡是否該消失
  isFinished() {
    return this.lifespan < 0;
  }

  // 繪製氣泡
  draw() {
    push();
    // 氣泡外框，帶有透明度
    strokeWeight(2);
    stroke(255, 255, 255, this.lifespan * 0.7);
    // 氣泡內部，半透明
    fill(200, 225, 255, this.lifespan * 0.4);
    circle(this.x, this.y, this.size);

    // 加上一點高光效果
    fill(255, 255, 255, this.lifespan * 0.8);
    noStroke();
    ellipse(this.x - this.size * 0.2, this.y - this.size * 0.2, this.size * 0.2);
    pop();
  }
}

// --- 海底物件生成與類別 ---

// 初始化海洋物件的函式
function initOcean() {
  fishes = [];
  seaweeds = [];
  // 隨機產生魚群
  for (let i = 0; i < 8; i++) {
    fishes.push(new Fish());
  }
  // 沿著畫面底部產生海草
  for (let i = 20; i < windowWidth; i += random(40, 90)) {
    seaweeds.push(new Seaweed(i));
  }
}

// 海草類別
class Seaweed {
  constructor(x) {
    this.x = x;
    this.segments = floor(random(6, 12));
    this.segmentLength = random(15, 30);
    this.baseAngle = random(TWO_PI);
    // 隨機產生不同深淺的綠色
    this.color = color(random(20, 50), random(100, 180), random(50, 100));
  }
  draw() {
    push();
    stroke(this.color);
    strokeWeight(12);
    noFill();
    beginShape();
    let currentX = this.x;
    let currentY = windowHeight; // 從畫面最底部開始長
    vertex(currentX, currentY);
    for (let i = 0; i < this.segments; i++) {
      currentY -= this.segmentLength;
      // 利用 sin 函數搭配時間 (frameCount) 產生隨波逐流的搖擺效果
      currentX = this.x + sin(frameCount * 0.02 + i * 0.4 + this.baseAngle) * 25;
      vertex(currentX, currentY);
    }
    endShape();
    pop();
  }
}

// 魚類別
class Fish {
  constructor() {
    this.size = random(30, 60);
    this.y = random(80, windowHeight - 150);
    this.speed = random(1.5, 3.5);
    // 隨機鮮豔的顏色
    this.color = color(random(150, 255), random(100, 255), random(100, 255));
    // 隨機決定面向左邊或右邊游
    this.direction = random() > 0.5 ? 1 : -1;
    this.x = this.direction === 1 ? -this.size : windowWidth + this.size;
  }
  update() {
    this.x += this.speed * this.direction;
    // 游出邊界後從另一邊游回來，並重新設定高度
    if (this.direction === 1 && this.x > windowWidth + 100) {
      this.x = -100;
      this.y = random(80, windowHeight - 150);
    }
    if (this.direction === -1 && this.x < -100) {
      this.x = windowWidth + 100;
      this.y = random(80, windowHeight - 150);
    }
  }
  draw() {
    push();
    translate(this.x, this.y);
    scale(this.direction, 1); // 根據方向水平翻轉
    fill(this.color);
    noStroke();
    // 魚身
    ellipse(0, 0, this.size, this.size * 0.6);
    // 魚尾巴
    triangle(-this.size * 0.4, 0, -this.size * 0.8, -this.size * 0.4, -this.size * 0.8, this.size * 0.4);
    // 魚眼
    fill(255);
    circle(this.size * 0.25, -this.size * 0.1, this.size * 0.2);
    fill(0);
    circle(this.size * 0.25 + 2, -this.size * 0.1, this.size * 0.1);
    // 魚鰭 (增加一點細節)
    fill(this.color);
    triangle(0, -this.size * 0.3, -this.size * 0.2, -this.size * 0.5, this.size * 0.1, -this.size * 0.2);
    pop();
  }
}
