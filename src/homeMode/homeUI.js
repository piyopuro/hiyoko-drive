//===========================================
// おうちモード用のUIを管理する部署
//===========================================

// ボタンの配置設定
const HOME_UI_CONFIG = {

  exit: {
    x: 32,
    y: 32,
    width: 192,
    height: 192,
    display: "always",
  },

  dayNight: {
    x: 1620,
    y: 624,
    width: 192,
    height: 192,
    display: "windowEvent",
  },

  square: {
    x: 556,
    y: 1200,
    width: 192,
    height: 192,
    display: "windowEvent",
  },

  circle: {
    x: 856,
    y: 1200,
    width: 192,
    height: 192,
    display: "windowEvent",
  },

  triangle: {
    x: 1156,
    y: 1200,
    width: 192,
    height: 192,
    display: "windowEvent",
  },
};


//===========================================
// ② UI管理機能
//===========================================

export function createHomeUI(
  canvas,
  ctx,
  homeImages,
  {
    onShapeChange,
    onDayNightChange,
    onButtonPress,
    onExit,
  } = {}
) {

  // ボタンの状態
  const state = {
    roomReady: false, //ズームが終わり、UIを表示できる状態か
    activeEvent: null,  //現在のイベント情報

    visible: false,
    //退出ボタン用
    exitTimer: 0,
    exitRequested: false,

    // 昼夜ボタン
    dayNightMode: "night",
    dayNightFrame: 0,
    dayNightTimer: 0,
    dayNightAnimating: false,

    // 図形ボタン
    windowButtons: {
      square: 0,
      circle: 0,
      triangle: 0,
    },
  };


  //===========================================
  // おうちモードのUIを描く係
  //===========================================
  // スプライト画像から指定した1コマを描画
  function drawSprite(image, frameX, frameY, config) {
    if (!image) return;

    ctx.drawImage(
      image,
      frameX,
      frameY,
      192,
      192,
      config.x,
      config.y,
      config.width,
      config.height
    );
  }

  //===========================================
  // UIを描くかどうか判定する係
  //===========================================
  function shouldShowUI(uiName) {
    const display = HOME_UI_CONFIG[uiName].display;
    if (display === "always") {
      return true;
    }

    if (!state.roomReady) {
      return false;
    }

    // イベント名と表示条件を照合
    return display === `${state.activeEvent}Event`;
  }

  //===========================================
  // ④ アニメーション更新
  //===========================================

  function update(deltaTime) {
    //-------------
    // 退出ボタン
    //-------------
    if (state.exitTimer > 0) {
      state.exitTimer -= deltaTime;

      if (state.exitTimer < 0) {
        state.exitTimer = 0;
      }
    }

    if (shouldShowUI("dayNight") && state.dayNightAnimating) {
      //-------------
      // 昼夜ボタン
      //-------------
      if (state.dayNightAnimating) {

        state.dayNightTimer += deltaTime;

        // 0.1秒ごとに次のコマへ
        while (state.dayNightTimer >= 0.1) {

          state.dayNightTimer -= 0.1;
          state.dayNightFrame++;

          // 4コマのアニメーション終了
          if (state.dayNightFrame > 4) {

            state.dayNightAnimating = false;
            state.dayNightFrame = 0;

            // 昼夜を切り替える
            state.dayNightMode =
              state.dayNightMode === "night"
                ? "day"
                : "night";

            onDayNightChange?.(state.dayNightMode); //新しいモードを通知

            break;
          }
        }
      }
    }

    //-------------
    // 図形ボタン
    //-------------
    if (shouldShowUI("square")) {
      for (const shape of Object.keys(state.windowButtons)) {

        if (state.windowButtons[shape] > 0) {
          state.windowButtons[shape] -= deltaTime;

          if (state.windowButtons[shape] <= 0) {
            state.windowButtons[shape] = 0;
          }
        }
      }
    }
  }

  //===========================================
  // ⑤ UI描画
  //===========================================

  function draw() {

    ctx.clearRect(0, 0, 1920, 1440);

    //-------------
    // 退出ボタン
    //-------------
    drawSprite(
      homeImages.houseOutButton.image,
      state.exitTimer > 0 ? 192 : 0,
      0,
      HOME_UI_CONFIG.exit
    );

    //-------------
    // 昼夜ボタン
    //-------------
    if (shouldShowUI("dayNight")) {
      const dayNightRow =
        state.dayNightMode === "night"
          ? 0
          : HOME_UI_CONFIG.dayNight.height;

      const dayNightColumn =
        state.dayNightAnimating
          ? state.dayNightFrame
          : 0;

      drawSprite(
        homeImages.dayNightButton.image,
        dayNightColumn * HOME_UI_CONFIG.dayNight.width,
        dayNightRow,
        HOME_UI_CONFIG.dayNight
      );

    }


    //-------------
    // 図形ボタン
    //-------------
    if (shouldShowUI("square")) { //まとめて判定
      drawSprite(
        homeImages.windowButton01.image,
        state.windowButtons.square > 0 ? HOME_UI_CONFIG.square.width : 0,
        0,
        HOME_UI_CONFIG.square
      );
      drawSprite(
        homeImages.windowButton02.image,
        state.windowButtons.circle > 0 ? HOME_UI_CONFIG.circle.width : 0,
        0,
        HOME_UI_CONFIG.circle
      );

      drawSprite(
        homeImages.windowButton03.image,
        state.windowButtons.triangle > 0 ? HOME_UI_CONFIG.triangle.width : 0,
        0,
        HOME_UI_CONFIG.triangle
      );

    }

  }


  //===========================================
  // ⑥ タップ判定
  //===========================================

  function handlePointerDown(event) {
    const rect = canvas.getBoundingClientRect();

    // ブラウザ座標をゲーム座標に変換
    const x = (event.clientX - rect.left) * (1920 / rect.width);
    const y = (event.clientY - rect.top) * (1440 / rect.height);

    //-------------
    // 退出ボタン 
    // -------------
    if (isInside(x, y, HOME_UI_CONFIG.exit)) {

      // 連続タップ防止
      if (state.exitRequested) return true;

      state.exitRequested = true;
      state.exitTimer = 0.5;

      onButtonPress?.();
      onExit?.();

      return true;
    }



    //-------------
    // 昼夜ボタン
    //-------------
    if (
      shouldShowUI("dayNight") &&
      isInside(x, y, HOME_UI_CONFIG.dayNight)
    ) {

      // アニメーション中は連続タップを無視
      if (state.dayNightAnimating) return true;

      onButtonPress?.() //効果音用
      state.dayNightAnimating = true;
      state.dayNightFrame = 1;
      state.dayNightTimer = 0;

      return true;
    }


    //-------------
    // 図形ボタン
    //-------------

    for (const shape of ["square", "circle", "triangle"]) {

      if (
        shouldShowUI(shape) &&
        isInside(x, y, HOME_UI_CONFIG[shape])
      ) {

        onButtonPress?.() //効果音用
        state.windowButtons[shape] = 0.2;
        onShapeChange?.(shape);   //この形に変えます通知

        return true;
      }
    }
    // UIのボタンではなかった
    return false;
  }


  // ボタンの範囲内か判定
  function isInside(x, y, config) {

    return (
      x >= config.x &&
      x <= config.x + config.width &&
      y >= config.y &&
      y <= config.y + config.height
    );
  }


  //===========================================
  // ⑦ 表示・非表示
  //===========================================

  function show() {
    state.roomReady = true;
  }

  function hide() {
    state.roomReady = false;
  }

  function setActiveEvent(eventName) {
    state.activeEvent = eventName;
  }

  // 外部に公開する機能
  return {
    update,
    draw,
    show,
    hide,
    setActiveEvent,
    handlePointerDown,

    dispose() {
      canvas.style.pointerEvents = "none";
    },
  };
}