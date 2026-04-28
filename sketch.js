// Hand Pose Detection with ml5.js
// https://thecodingtrain.com/tracks/ml5js-beginners-guide/ml5/hand-pose

let video;
let handPose;
let hands = [];

function preload() {
  // Initialize HandPose model with flipped video input
  handPose = ml5.handPose({ flipped: true });
}

function mousePressed() {
  console.log(hands);
}

function gotHands(results) {
  hands = results;
}

function setup() {
  // 第一步：產生一個全螢幕的畫布
  createCanvas(windowWidth, windowHeight);
  
  // 擷取攝影機影像並配合 ml5 啟用水平翻轉
  video = createCapture(VIDEO, { flipped: true });
  video.hide(); // 隱藏預設的 HTML 影片元素，讓我們只在畫布上繪製它

  // Start detecting hands
  handPose.detectStart(video, gotHands);
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
      if (hand.confidence > 0.1) {
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
  }
}
// 當瀏覽器視窗大小改變時，動態調整畫布尺寸以維持全螢幕
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
