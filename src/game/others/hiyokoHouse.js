import { getRandomNumber } from "../utils/math";
import { Map, Screen } from "../constants/mapConfig";
import {
  worldToScreen,
  drawShadow,
} from "../utils/draw";
import {
  canPlaceGroundObjectAt,
} from "../constants/mapGrid";


//========================================
// ひよこのお家 基本設定
//========================================

export const HiyokoHouse = {
  WIDTH: 192,
  HEIGHT: 192,

  //画像のコマ数
  HOUSE_FRAME_COUNT: 8,

  //ドアアニメーション
  DOOR_FRAMES: [
    0, 1, 2, 3, 4, 5, 6, 7, 8,
    7, 6, 7, 8, 7, 6, 5, 4, 3, 2, 1, 0,
  ],

  DOOR_FRAME_INTERVAL: 80,

  //ぽよん設定
  POUNCE_DURATION: 300,
  POUNCE_SCALE_X: 1.12,
  POUNCE_SCALE_Y: 1.18,

  // 入室ボタン
  ENTRY_BUTTONS: {
    ENTER: {
      x: 758,
      y: 1000,
      width: 192,
      height: 192,
    },

    CANCEL: {
      x: 970,
      y: 1000,
      width: 192,
      height: 192,
    },

    FRAME_SIZE: 192,
    ANIMATION_INTERVAL: 0.2,
  },
};


//========================================
// お家を作る係
//========================================

export function createHiyokoHouse() {
  const halfWidth = HiyokoHouse.WIDTH / 2;
  const halfHeight = HiyokoHouse.HEIGHT / 2;
  let x;
  let y;

  //置ける場所が見つかるまで探す
  do {
    x = getRandomNumber(halfWidth, Map.WIDTH - halfWidth);
    y = getRandomNumber(halfHeight, Map.HEIGHT - halfHeight);
  } while (
    !canPlaceGroundObjectAt([
      {
        x: x - HiyokoHouse.WIDTH / 2,
        y: y,
      },
      {
        x: x + HiyokoHouse.WIDTH / 2,
        y: y,
      },
      {
        x: x - HiyokoHouse.WIDTH / 2,
        y: y + HiyokoHouse.HEIGHT / 2,
      },
      {
        x: x + HiyokoHouse.WIDTH / 2,
        y: y + HiyokoHouse.HEIGHT / 2,
      },
    ])
  );

  return {

    position: { x, y, },        //お家の位置
    frame: 0,        //お家画像のコマ、最初は必ず0番
    hiyokoCount: 0,        //ひよこを入れた数

    //ドアアニメーション
    door: {
      isAnimating: false,
      frameIndex: 0,
      lastFrameTime: 0,
    },

    //お家ぽよん
    effect: {
      type: null,
      startTime: 0,
      duration: 0,
    },

    // おうち入室イベント
    entry: {
      active: false,
      zoomFinished: false,
      buttonsVisible: false,

      // 入るボタン
      enterFrame: 0,
      enterAnimation: null,   //null：まだアニメーションしていない "idle"：通常時の5コマアニメーション "pressed"：タップ時の4コマアニメーション
      enterSequenceIndex: 0,

      // キャンセルボタン
      cancelFrame: 0,
      cancelTimer: 0,

      // 共通
      pressedButton: null,
      buttonTimer: 0,

      // 入室前のカメラ状態
      returnCamera: null,
    },

  };
}

//========================================
// ドアアニメ開始係
//========================================
function startHiyokoHouseDoor(
  house,
  now,
  soundManager
) {
  if (house.door.isAnimating) return;

  house.door.isAnimating = true;
  house.door.frameIndex = 0;
  house.door.lastFrameTime = now;

  soundManager.play("doorOpen");
}



//========================================
// ドア開け閉め係
//========================================
export function updateHiyokoHouseDoor(
  house,
  now,
  soundManager
) {
  const door = house.door;

  if (!door.isAnimating) {
    return;
  }

  const elapsed =
    now - door.lastFrameTime;

  if (
    elapsed <
    HiyokoHouse.DOOR_FRAME_INTERVAL
  ) {
    return;
  }

  door.lastFrameTime = now;

  door.frameIndex++;

  //アニメーション終了
  if (
    door.frameIndex >=
    HiyokoHouse.DOOR_FRAMES.length
  ) {
    door.frameIndex = 0;
    door.isAnimating = false;

    soundManager.play("doorClose");

    return;
  }
}

//========================================
// おうちおさわりチェック係
//========================================
export function isPointInsideHiyokoHouse(x, y, house) {
  const halfWidth = HiyokoHouse.WIDTH / 2;
  const halfHeight = HiyokoHouse.HEIGHT / 2;

  return (
    x >= house.position.x - halfWidth &&
    x <= house.position.x + halfWidth &&
    y >= house.position.y - halfHeight &&
    y <= house.position.y + halfHeight
  );
}

//========================================
// ぽよん開始係
//========================================
export function startHiyokoHousePounce(
  house,
  now
) {
  house.effect.type = "pounce";
  house.effect.startTime = now;
  house.effect.duration =
    HiyokoHouse.POUNCE_DURATION;
}

//========================================
// ぽよん計算係
//========================================
export function getHiyokoHouseScale(house, now) {
  if (house.effect.type !== "pounce") {
    return {
      x: 1,
      y: 1,
    };
  }

  const elapsed =
    now - house.effect.startTime;

  const progress = Math.min(
    elapsed / house.effect.duration,
    1
  );

  if (progress >= 1) {
    house.effect.type = null;

    return {
      x: 1,
      y: 1,
    };
  }

  const amount =
    Math.sin(progress * Math.PI);

  return {
    x:
      1 +
      (HiyokoHouse.POUNCE_SCALE_X - 1) *
      amount,

    y:
      1 +
      (HiyokoHouse.POUNCE_SCALE_Y - 1) *
      amount,
  };
}



//===================おうち入室課=====================

//========================================
// おうちイベント開始係
//========================================
export function startHiyokoHouseEvent(
  house,
  camera,
  now,
  startCameraMoveZoom,
  soundManager
) {
  const entry = house.entry;

  // ひよこがお家にいるかな？
  if (house.hiyokoCount > 0) {
    startHiyokoHouseDoor(house, now, soundManager);
  } else {
    soundManager.play("doorKnock");
  }

  // イベント開始
  entry.active = true;

  // 入室前のカメラ状態を保存
  entry.returnCamera = {
    x: camera.x,
    y: camera.y,
    scale: camera.scale,
  };

  // お家を中心にズーム
  startCameraMoveZoom(
    now,
    house.position.x,
    house.position.y,
    2,
    800,
    () => {
      entry.zoomFinished = true;
      entry.buttonsVisible = true;

      // 入るボタンの通常アニメーション開始
      entry.enterAnimation = "idle";
      entry.enterFrame = 0;
      entry.enterSequenceIndex = 0;
      entry.buttonTimer = 0;
    }
  );
}

//========================================
// おうちイベント終了係
//========================================
export function finishHiyokoHouseEvent(
  house,
  now,
  startCameraMoveZoom
) {
  const entry = house.entry;
  const returnCamera = entry.returnCamera;

  // ボタンを非表示にする
  entry.buttonsVisible = false;

  // イベント終了後の初期化
  const resetEntry = () => {
    entry.active = false;
    entry.zoomFinished = false;

    entry.pressedButton = null;
    entry.enterAnimation = null;
    entry.enterFrame = 0;
    entry.cancelFrame = 0;

    entry.returnCamera = null;
  };

  if (!returnCamera) {
    resetEntry();
    return;
  }

  // 元のカメラ位置・倍率へ戻す
  startCameraMoveZoom(
    now,
    returnCamera.x + Screen.WIDTH / 2,
    returnCamera.y + Screen.HEIGHT / 2,
    returnCamera.scale,
    800,
    resetEntry
  );
}

//========================================
// おうち入室ボタン更新係
//========================================
export function updateHiyokoHouseEntry(house, deltaTime) {
  const entry = house.entry;

  if (!entry.buttonsVisible) return null;

  const interval = HiyokoHouse.ENTRY_BUTTONS.ANIMATION_INTERVAL;

  // 入るボタン
  if (entry.enterAnimation) {
    entry.buttonTimer += deltaTime;

    if (entry.buttonTimer >= interval) {
      entry.buttonTimer -= interval;

      if (entry.enterAnimation === "idle") {
        // 通常時：0→1→2→3→0
        const frames = [0, 1, 2, 3, 0];
        entry.enterSequenceIndex++;

        if (entry.enterSequenceIndex >= frames.length) {
          entry.enterAnimation = null;
          entry.enterFrame = 0;
        } else {
          entry.enterFrame = frames[entry.enterSequenceIndex];
        }
      }

      else if (entry.enterAnimation === "pressed") {
        // タップ時：0→1→2→3
        entry.enterFrame++;

        if (entry.enterFrame >= 4) {
          entry.enterFrame = 0;
          entry.enterAnimation = null;
          entry.pressedButton = null;
          return "enter";
        }
      }
    }
  }

  // キャンセルボタン
  if (entry.pressedButton === "cancel") {
    entry.cancelTimer += deltaTime;

    if (entry.cancelTimer >= 0.4) {
      entry.cancelTimer = 0;
      entry.cancelFrame = 0;
      entry.pressedButton = null;
      return "cancel";
    }
  }

  return null;
}

//========================================
// おうち入室ボタン描画係
//========================================
export function drawHiyokoHouseEntryButtons(
  ctx,
  images,
  house
) {
  const entry = house.entry;

  if (!entry.buttonsVisible) return;

  const config = HiyokoHouse.ENTRY_BUTTONS;
  const frameSize = config.FRAME_SIZE;

  const enterImage = images.houseInButton;
  const cancelImage = images.houseCancelButton;

  // 入るボタン
  if (enterImage) {
    const sourceY = entry.enterAnimation === "pressed" ? frameSize : 0;

    ctx.drawImage(
      enterImage,
      entry.enterFrame * frameSize,
      sourceY,
      frameSize,
      frameSize,
      config.ENTER.x,
      config.ENTER.y,
      config.ENTER.width,
      config.ENTER.height
    );
  }

  // キャンセルボタン
  if (cancelImage) {
    ctx.drawImage(
      cancelImage,
      entry.cancelFrame * frameSize,
      0,
      frameSize,
      frameSize,
      config.CANCEL.x,
      config.CANCEL.y,
      config.CANCEL.width,
      config.CANCEL.height
    );
  }
}

//========================================
// おうち入室ボタンタップ判定係
//========================================
export function handleHiyokoHouseEntryTap(
  house,
  x,
  y
) {
  const entry = house.entry;

  if (!entry.active || !entry.zoomFinished) {
    return null;
  }
  if (entry.pressedButton) {
    return null;
  }

  const config = HiyokoHouse.ENTRY_BUTTONS;

  // 入るボタン
  const enter = config.ENTER;
  if (
    x >= enter.x &&
    x <= enter.x + enter.width &&
    y >= enter.y &&
    y <= enter.y + enter.height
  ) {
    return "enter";
  }

  // キャンセルボタン
  const cancel = config.CANCEL;
  if (
    x >= cancel.x &&
    x <= cancel.x + cancel.width &&
    y >= cancel.y &&
    y <= cancel.y + cancel.height
  ) {
    return "cancel";
  }
  return null;
}


//==============================================
//おうち描画係
//==============================================
export function drawHiyokoHouse(
  ctx,
  image,
  doorImage,
  house,
  camera,
  now
) {
  const frameWidth = HiyokoHouse.WIDTH;
  const frameHeight = HiyokoHouse.HEIGHT;

  const sx = house.frame * frameWidth;

  const screenPosition = worldToScreen(
    house.position.x,
    house.position.y,
    camera
  );

  // 影
  drawShadow(
    ctx,
    screenPosition.x,
    screenPosition.y + 85,
    110,
    20
  );

  const scale = getHiyokoHouseScale(house, now);

  ctx.save();

  //足元アンカー
  ctx.translate(
    screenPosition.x,
    screenPosition.y + frameHeight / 2
  );

  ctx.scale(
    scale.x,
    scale.y
  );

  //おうち
  ctx.drawImage(
    image,

    sx,
    0,
    frameWidth,
    frameHeight,
    -frameWidth / 2,
    -frameHeight,
    frameWidth,
    frameHeight
  );

  //ドア
  const doorFrame =
    HiyokoHouse.DOOR_FRAMES[
    house.door.frameIndex
    ];

  const doorSx = doorFrame * frameWidth;

  ctx.drawImage(
    doorImage,
    doorSx,
    0,
    frameWidth,
    frameHeight,
    -frameWidth / 2,
    -frameHeight,
    frameWidth,
    frameHeight
  );

  ctx.restore();
}

//========================================
// おうち入室開始係
//========================================
export function startHiyokoHouseEnter(house, onEnter) {
  const entry = house.entry;

  entry.buttonsVisible = false;
  entry.entering = true;

  // おうちモードへ切り替え
  onEnter();
}