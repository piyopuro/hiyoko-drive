//===========================================
// 空を作る部署
//===========================================


//===========================================
// 空の情報を作る係
//===========================================
export function createSkyState() {
  return {
    mode: "night",

    day: {
      clouds: [],
      sun: {
        expressionFrame: 0,
        rotation: 0,
      },
    },

    night: {
      stars: [],
      moon: {
        expressionFrame: 0,
        phaseFrame: 0,
        isPhaseEventActive: false,
      },
    },
  };
}

//===========================================
// 空を更新する係
//===========================================
export function updateSky(skyState, now, deltaTime) {
  // 今後、雲・太陽・星・月などの更新処理を追加
}


//===========================================
// 空を描く係
//===========================================
export function drawSky(ctx, skyState, homeImages) {
  ctx.clearRect(0, 0, 1920, 1440);

  // 昼夜に応じた背景画像を選択
  const skyImage =
    skyState.mode === "day"
      ? homeImages.skyDay.image
      : homeImages.skyNight.image;

  ctx.drawImage(
    skyImage,
    0,
    0,
    1920,
    1440
  );
}