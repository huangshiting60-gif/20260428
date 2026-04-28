// Hand Pose Detection with ml5.js
// https://thecodingtrain.com/tracks/ml5js-beginners-guide/ml5/hand-pose

let video;
let handPose;
let hands = [];
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
  // 設定背景顏色為 e7c6ff
  background('#e7c6ff');
  
  // 計算顯示的影像寬高（整個畫布寬高的 50%）
  let imgW = windowWidth * 0.5;
  let imgH = windowHeight * 0.5;
  
  // 計算置中顯示的 X 與 Y 座標
  let x = (windowWidth - imgW) / 2;
  let y = (windowHeight - imgH) / 2;
  
  // 將擷取的影像繪製在視窗中間
  image(video, x, y, imgW, imgH);

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

      // Loop through keypoints and draw circles
      for (let i = 0; i < hand.keypoints.length; i++) {
        let keypoint = hand.keypoints[i];

        // Color-code based on left or right hand
        if (hand.handedness == "Left") {
          fill(255, 0, 255);
        } else {
          fill(255, 255, 0);
        }

        noStroke();
        // 根據縮放與置中後的影像，計算對應的畫布座標
        let adjustedX = x + keypoint.x * (imgW / video.width);
        let adjustedY = y + keypoint.y * (imgH / video.height);
        
        circle(adjustedX, adjustedY, 16);
      }
    }
  }

  // 在畫面最上層顯示狀態訊息介面
  if (statusMessage !== "") {
    push();
    fill(255, 255, 255, 200); // 繪製半透明白色背景框
    noStroke();
    rectMode(CENTER);
    // 背景框寬度設定為畫面的 90%，但不超過 450px
    rect(windowWidth / 2, 40, Math.min(windowWidth * 0.9, 450), 40, 10);
    
    fill(0);
    textSize(16);
    textAlign(CENTER, CENTER);
    text(statusMessage, windowWidth / 2, 40);
    pop();
  }
}
// 當瀏覽器視窗大小改變時，動態調整畫布尺寸以維持全螢幕
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
