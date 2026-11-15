// スターワイプ トランジション設定
const TransitionConfig = {
  EXPAND_DURATION: 0.6, // 拡大開始から295％到達まで（秒）
  FADE_DURATION: 0.4,   // フェード時間（秒）
  MAX_SCALE: 2.95,      // 295％
};

// トランジションの状態
const transition = {
  active: false,
  direction: null,
  phase: null,

  scale: 0,
  opacity: 1,

  callback: null,
};


// ローディング画面の表示状態
let loadingVisible = false;


// 描画用Canvas
// ローディング画像をマスク合成するCanvas
let loadingCanvas = null;
let loadingCtx = null;

// 元画像を透明度マスクに変換するCanvas
let sourceMaskCanvas = null;
let sourceMaskCtx = null;

// 拡大・フェード処理用のCanvas
let transitionMaskCanvas = null;
let transitionMaskCtx = null;

// 読み込み済みマスクの管理
let alphaMaskCanvas = null;
let alphaMaskCtx = null;
let currentMaskImage = null;
let currentMaskDirection = null;

//=================================
// ローディング画面係
//=================================

// ローディング画面を表示する係
export function showLoadingScreen() {
  loadingVisible = true;
}
// ローディング画面を非表示にする係
export function hideLoadingScreen() {
  loadingVisible = false;
}


//=================================
// マスク画像を準備する係
//=================================
function prepareMask(maskImage, direction) {
  if (
    !maskImage ||
    !maskImage.complete ||
    !maskImage.naturalWidth
  ) {
    return false;
  }

  // 同じ画像・同じ方向なら再変換しない
  if (
    currentMaskImage === maskImage &&
    currentMaskDirection === direction &&
    alphaMaskCanvas
  ) {
    return true;
  }

  const width = maskImage.naturalWidth;
  const height = maskImage.naturalHeight;

  // 元画像読み込み用Canvas
  sourceMaskCanvas = document.createElement("canvas");
  sourceMaskCanvas.width = width;
  sourceMaskCanvas.height = height;
  sourceMaskCtx = sourceMaskCanvas.getContext("2d");

  sourceMaskCtx.drawImage(maskImage, 0, 0);

  // 透明度変換用Canvas
  alphaMaskCanvas = document.createElement("canvas");
  alphaMaskCanvas.width = width;
  alphaMaskCanvas.height = height;
  alphaMaskCtx = alphaMaskCanvas.getContext("2d");

  const imageData = sourceMaskCtx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  for (let i = 0; i < pixels.length; i += 4) {
    const brightness = pixels[i];

    // 黒い星形部分を不透明にする
    const alpha = 255 - brightness;

    pixels[i + 3] = alpha;
  }

  alphaMaskCtx.putImageData(imageData, 0, 0);

  currentMaskImage = maskImage;
  currentMaskDirection = direction;

  return true;
}


//=================================
// トランジション開始係
//=================================
function startTransition(direction, callback) {
  if (direction === "in") {
    loadingVisible = false;
  }

  transition.active = true;
  transition.direction = direction;
  transition.phase = "expanding";

  transition.scale = 0;
  transition.opacity = 1;

  transition.callback = callback;
}


//=================================
// スターワイプIN指示係
//=================================
export function startStarTransitionIn(callback) {
  startTransition("in", callback);
}

//=================================
// スターワイプOUT指示係
//=================================
export function startStarTransitionOut(callback) {
  startTransition("out", callback);
}

//=================================
// スターワイプ更新係
//=================================

export function updateTransition(deltaTime) {
  if (!transition.active) {
    return;
  }

  const expandSpeed = TransitionConfig.MAX_SCALE / TransitionConfig.EXPAND_DURATION;

  //=================================
  // OUT：星形の穴を最初から拡大する
  //=================================
  if (transition.direction === "out") {
    transition.scale += expandSpeed * deltaTime;

    if (transition.scale >= TransitionConfig.MAX_SCALE) {
      transition.scale = TransitionConfig.MAX_SCALE;
      transition.active = false;

      const callback = transition.callback;
      transition.callback = null;

      callback?.();
    }

    return;
  }

  //=================================
  // IN：従来どおりの拡大＋フェード
  //=================================
  // 拡大中
  if (transition.phase === "expanding") {
    transition.scale += expandSpeed * deltaTime;

    if (transition.scale >= TransitionConfig.MAX_SCALE) {
      transition.scale = TransitionConfig.MAX_SCALE;
      transition.phase = "fading";
    }
  }

  // フェード中
  else if (transition.phase === "fading") {
    // 拡大は止めずに続ける！
    transition.scale += expandSpeed * deltaTime;
    transition.opacity -= deltaTime / TransitionConfig.FADE_DURATION;

    if (transition.opacity <= 0) {
      transition.opacity = 0;
      transition.active = false;

      const callback = transition.callback;
      transition.callback = null;

      callback?.();
    }
  }
}

//=================================
// トランジション描画係
//=================================
export function drawTransition(ctx, loadingImage, maskImage) {
  if (!transition.active) {
    return;
  }

  if (
    !loadingImage ||
    !loadingImage.complete ||
    !loadingImage.naturalWidth
  ) {
    return;
  }

  if (!prepareMask(maskImage, transition.direction)) {
    return;
  }

  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  // 画面サイズのマスク用Canvas
  if (
    !transitionMaskCanvas ||
    transitionMaskCanvas.width !== width ||
    transitionMaskCanvas.height !== height
  ) {
    transitionMaskCanvas = document.createElement("canvas");
    transitionMaskCanvas.width = width;
    transitionMaskCanvas.height = height;
    transitionMaskCtx = transitionMaskCanvas.getContext("2d");
  }

  // マスクCanvasを初期化
  transitionMaskCtx.clearRect(0, 0, width, height);

  const maskWidth = alphaMaskCanvas.width * transition.scale;
  const maskHeight = alphaMaskCanvas.height * transition.scale;

  // 星形マスクを拡大描画
  transitionMaskCtx.drawImage(
    alphaMaskCanvas,
    width / 2 - maskWidth / 2,
    height / 2 - maskHeight / 2,
    maskWidth,
    maskHeight
  );


  //=================================
  // IN：星形の内側にローディング画像を表示
  //=================================

  if (transition.direction === "in") {

    // ローディング合成用Canvas
    if (
      !loadingCanvas ||
      loadingCanvas.width !== width ||
      loadingCanvas.height !== height
    ) {
      loadingCanvas = document.createElement("canvas");
      loadingCanvas.width = width;
      loadingCanvas.height = height;
      loadingCtx = loadingCanvas.getContext("2d");
    }

    // ローディング画像を全面描画
    loadingCtx.clearRect(0, 0, width, height);
    loadingCtx.drawImage(loadingImage, 0, 0, width, height);

    // 星形の外側を徐々に表示領域にする
    const fade = 1 - transition.opacity;

    transitionMaskCtx.globalAlpha = fade;
    transitionMaskCtx.fillStyle = "#FFFFFF";
    transitionMaskCtx.fillRect(0, 0, width, height);
    transitionMaskCtx.globalAlpha = 1;

    // ローディング画像をマスクで切り抜く
    loadingCtx.globalCompositeOperation = "destination-in";
    loadingCtx.drawImage(transitionMaskCanvas, 0, 0);
    loadingCtx.globalCompositeOperation = "source-over";

    ctx.drawImage(loadingCanvas, 0, 0);
  }

  //=================================
  // OUT：星形の穴からおうちを見せる
  //=================================
  else if (transition.direction === "out") {

    // ローディング画像用の別Canvasを準備
    if (
      !loadingCanvas ||
      loadingCanvas.width !== width ||
      loadingCanvas.height !== height
    ) {
      loadingCanvas = document.createElement("canvas");
      loadingCanvas.width = width;
      loadingCanvas.height = height;
      loadingCtx = loadingCanvas.getContext("2d");
    }
    // 別Canvasを初期化
    loadingCtx.clearRect(0, 0, width, height);

    // ローディング画像を全面に描画
    loadingCtx.drawImage(loadingImage, 0, 0, width, height);

    // 別Canvas上で星形の穴を開ける
    loadingCtx.globalCompositeOperation = "destination-out";
    loadingCtx.drawImage(transitionMaskCanvas, 0, 0);

    loadingCtx.globalCompositeOperation = "source-over";

    // 穴の開いたローディング画像をメインCanvasに重ねる
    ctx.drawImage(loadingCanvas, 0, 0);
  }
}

//=================================
// ローディング画面描画係
//=================================
export function drawLoadingScreen(ctx, loadingImage) {
  if (!loadingVisible || transition.active) {
    return;
  }

  if (
    !loadingImage ||
    !loadingImage.complete ||
    !loadingImage.naturalWidth
  ) {
    return;
  }

  ctx.drawImage(
    loadingImage,
    0,
    0,
    ctx.canvas.width,
    ctx.canvas.height
  );
}