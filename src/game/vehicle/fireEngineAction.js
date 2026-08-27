import { Direction } from "../constants/vehicleMaster";
import { worldToScreen } from "../utils/draw";


export const FireFightHiyokoAction = {
  JUMP_DURATION: 500,
  LANDING_DURATION: 230,
  JUMP_HEIGHT: 60,

  WALK_DURATION: 800,

  WALK_DISTANCE_HORIZONTAL: 180,
  WALK_DISTANCE_VERTICAL: 30,

  RETURN_WALK_DURATION: 800,
};

export const FireFightWaterAction = {
  FRAME_INTERVAL: 100,
  LOOP_DURATION: 1000,

  introFrames: [0, 1],
  loopFrames: [2, 3],
  outroFrames: [4, 5, 6],
};

//===========================================


//===========================
//消防車アクション計算本部
//===========================

export function getFireFightHiyokoPosition(vehicle, now) {

  const hiyoko = vehicle.actionState?.hiyoko;
  if (!hiyoko?.visible || hiyoko.jumpStartTime == null) {
    return;
  }


  //========時間計算部========
  const elapsed = now - hiyoko.jumpStartTime;

  //ジャンプ終わったか計算
  const jumpProgress = Math.min(
    elapsed / FireFightHiyokoAction.JUMP_DURATION,
    1
  );
  const jumpFinished =
    elapsed >=
    FireFightHiyokoAction.JUMP_DURATION +
    FireFightHiyokoAction.LANDING_DURATION;


  //歩き終わったか計算
  const walkElapsed =
    elapsed -
    FireFightHiyokoAction.JUMP_DURATION -
    FireFightHiyokoAction.LANDING_DURATION;

  const walkProgress = Math.min(
    Math.max(
      walkElapsed / FireFightHiyokoAction.WALK_DURATION,
      0
    ),
    1
  );

  const walkFinished = walkProgress >= 1;  //歩き終わった？


  //水撒きおわったか計算
  const waterDuration =
    FireFightWaterAction.introFrames.length *
    FireFightWaterAction.FRAME_INTERVAL +
    FireFightWaterAction.LOOP_DURATION +
    FireFightWaterAction.outroFrames.length *
    FireFightWaterAction.FRAME_INTERVAL;

  const waterFinishedTime =
    FireFightHiyokoAction.JUMP_DURATION +
    FireFightHiyokoAction.LANDING_DURATION +
    FireFightHiyokoAction.WALK_DURATION +
    waterDuration;

  const waterFinished =
    elapsed >= waterFinishedTime;


  //ひよこ帰る時間
  const returnWalkElapsed =
    elapsed - waterFinishedTime;

  const returnWalkProgress = Math.min(
    Math.max(
      returnWalkElapsed /
      FireFightHiyokoAction.RETURN_WALK_DURATION,
      0
    ),
    1
  );

  const returnWalkFinished =
    returnWalkProgress >= 1;


  //帰還ジャンプ時間
  const returnJumpElapsed =
    returnWalkElapsed -
    FireFightHiyokoAction.RETURN_WALK_DURATION;

  const returnJumpProgress = Math.min(
    Math.max(
      returnJumpElapsed / FireFightHiyokoAction.JUMP_DURATION,
      0
    ),
    1
  );


  //========ジャンプ座標管理部========
  //ジャンプ開始地点
  let startX = vehicle.position.x;
  let startY = vehicle.position.y;

  //着地点
  let landingX = vehicle.position.x;
  let landingY = vehicle.position.y;

  switch (vehicle.direction) {
    case Direction.RIGHT:
      landingX += 80;
      landingY += 40;

      startX += 80;
      startY += 20;
      break;

    case Direction.LEFT:
      landingX -= 80;
      landingY += 40;

      startX -= 80;
      startY += 20;
      break;

    case Direction.FRONT:
      landingX += 112;
      landingY += 40;

      startX += 80;
      startY += 10;
      break;

    case Direction.BACK:
      landingX -= 110;
      landingY += 0;

      startX -= 80;
      startY -= 30;
      break;
  }


  //=========現在位置=========
  //開始位置 → 着地点
  let x =
    startX +
    (landingX - startX) *
    jumpProgress;

  let y =
    startY +
    (landingY - startY) *
    jumpProgress;

  //ぴょん！の高さ
  if (jumpProgress < 1) {
    y -= Math.sin(jumpProgress * Math.PI) * FireFightHiyokoAction.JUMP_HEIGHT;
  }


  //=========着地後にひよこを歩かせる部========

  //着地した？
  if (jumpFinished) {
    switch (vehicle.direction) {
      case Direction.RIGHT:
        x -=
          FireFightHiyokoAction.WALK_DISTANCE_HORIZONTAL *
          walkProgress;
        break;

      case Direction.LEFT:
        x +=
          FireFightHiyokoAction.WALK_DISTANCE_HORIZONTAL *
          walkProgress;
        break;

      case Direction.FRONT:
        y -=
          FireFightHiyokoAction.WALK_DISTANCE_VERTICAL *
          walkProgress;
        break;

      case Direction.BACK:
        y +=
          FireFightHiyokoAction.WALK_DISTANCE_VERTICAL *
          walkProgress;
        break;
    }
  }


  //========放水後、消防車へ帰らせる部========

  if (waterFinished) {
    switch (vehicle.direction) {
      case Direction.RIGHT:
        x +=
          FireFightHiyokoAction.WALK_DISTANCE_HORIZONTAL *
          returnWalkProgress;
        break;

      case Direction.LEFT:
        x -=
          FireFightHiyokoAction.WALK_DISTANCE_HORIZONTAL *
          returnWalkProgress;
        break;

      case Direction.FRONT:
        y +=
          FireFightHiyokoAction.WALK_DISTANCE_VERTICAL *
          returnWalkProgress;
        break;

      case Direction.BACK:
        y -=
          FireFightHiyokoAction.WALK_DISTANCE_VERTICAL *
          returnWalkProgress;
        break;
    }
  }


  //========最後に消防車へジャンプして戻る部========

  if (returnWalkFinished) {

    //着地点 → 最初に飛び出してきた位置へ
    x =
      landingX +
      (startX - landingX) *
      returnJumpProgress;

    y =
      landingY +
      (startY - landingY) *
      returnJumpProgress;

    //ジャンプ中の向き
    switch (vehicle.direction) {
      case Direction.RIGHT:
      case Direction.LEFT:
        break;

      case Direction.FRONT:
        break;

      case Direction.BACK:
        break;
    }

    //ぴょん！
    if (returnJumpProgress < 1) {
      y -=
        Math.sin(returnJumpProgress * Math.PI) *
        FireFightHiyokoAction.JUMP_HEIGHT;
    }
  }


  //========影つけ用座標管理部========

  let shadowX = x;
  let shadowY = y;

  //登場ジャンプ中
  if (jumpProgress < 1) {
    shadowY = landingY;
  }

  //帰還ジャンプ中
  if (
    returnWalkFinished &&
    returnJumpProgress < 1
  ) {
    shadowY = landingY;
  }


  return {
    x,
    y,
    shadowX,
    shadowY,

    elapsed,
    jumpProgress,
    jumpFinished,
    walkElapsed,
    walkProgress,
    walkFinished,
    waterFinished,
    returnWalkElapsed,
    returnWalkProgress,
    returnWalkFinished,
    returnJumpProgress,
    returnWalkFinished,
  };
}


//==========================
//消防ひよこ描画本部
//==========================

export function drawFireFightHiyoko(ctx, vehicle, now, image, camera) {

  if (!image) {
    return;
  }

  const hiyoko = vehicle.actionState?.hiyoko;
  if (!hiyoko?.visible || hiyoko.jumpStartTime == null) {
    return;
  }

  const action =
    getFireFightHiyokoPosition(vehicle, now);

  if (!action) {
    return;
  }

  const screenPosition = worldToScreen(
    action.x,
    action.y,
    camera
  );

  const {
    elapsed,
    jumpProgress,
    jumpFinished,
    walkElapsed,
    walkFinished,
    waterFinished,
    returnWalkElapsed,
    returnWalkProgress,
    returnWalkFinished,
  } = action;

  //========画像情報管理部=========

  const frameWidth = 128;
  const frameHeight = 64;

  const WALK_FRAMES = [0, 1, 0, 2];
  const WALK_FRAME_INTERVAL = 120;


  //=========ひよこ登場向き指示部========

  let hiyokoDirection;

  //初期向き
  switch (vehicle.direction) {
    case Direction.RIGHT:
    case Direction.LEFT:
      hiyokoDirection = Direction.FRONT;
      break;

    case Direction.FRONT:
      hiyokoDirection = Direction.RIGHT;
      break;

    case Direction.BACK:
      hiyokoDirection = Direction.LEFT;
      break;
  }

  //ジャンプ中
  if (jumpFinished) {
    switch (vehicle.direction) {
      case Direction.RIGHT:
        hiyokoDirection = Direction.LEFT;
        break;

      case Direction.LEFT:
        hiyokoDirection = Direction.RIGHT;
        break;

      case Direction.FRONT:
        hiyokoDirection = Direction.BACK;
        break;

      case Direction.BACK:
        hiyokoDirection = Direction.FRONT;
        break;
    }
  }

  //戻り中
  if (waterFinished) {
    switch (vehicle.direction) {
      case Direction.RIGHT:
        hiyokoDirection = Direction.RIGHT;
        break;

      case Direction.LEFT:
        hiyokoDirection = Direction.LEFT;
        break;

      case Direction.FRONT:
        hiyokoDirection = Direction.FRONT;
        break;

      case Direction.BACK:
        hiyokoDirection = Direction.BACK;
        break;
    }
  }

  //帰りのジャンプ中
  if (returnWalkFinished) {
    switch (vehicle.direction) {
      case Direction.RIGHT:
      case Direction.LEFT:
        hiyokoDirection = Direction.BACK;
        break;

      case Direction.FRONT:
        hiyokoDirection = Direction.LEFT;
        break;

      case Direction.BACK:
        hiyokoDirection = Direction.RIGHT;
        break;
    }
  }

  //========使う画像決定部========

  let frame = 0;

  //歩行アニメ
  let animationElapsed = walkElapsed;

  if (waterFinished) {
    animationElapsed = returnWalkElapsed;
  }

  if ((jumpFinished && !walkFinished) ||
    (waterFinished && returnWalkProgress < 1)) {

    const frameIndex =
      Math.floor(
        animationElapsed / WALK_FRAME_INTERVAL
      ) % WALK_FRAMES.length;

    frame = WALK_FRAMES[frameIndex];
  }

  let sx = frame * frameWidth;
  let sy = hiyokoDirection * frameHeight;


  //========ひよこにホースを持たせる部========
  //ホースのところに到着！
  if (walkFinished && !waterFinished) { //歩き終わった？放水はまだ？
    sx = 0;

    switch (vehicle.direction) {
      case Direction.LEFT:
      case Direction.FRONT:
        sy = 4 * frameHeight;
        break;

      case Direction.RIGHT:
      case Direction.BACK:
        sy = 5 * frameHeight;
        break;
    }
  }


  //========ひよこをつぶす部========

  let scaleY = 1;

  if (jumpProgress < 0.15) {

    const t = jumpProgress / 0.15;
    scaleY = 1 + (0.5 - 1) * t;

  } else if (jumpProgress < 0.35) {

    const t = (jumpProgress - 0.15) / (0.35 - 0.15);
    scaleY = 0.5 + (1.18 - 0.5) * t;

  } else if (jumpProgress < 0.5) {

    const t = (jumpProgress - 0.35) / (0.5 - 0.35);
    scaleY = 1.18 + (1 - 1.18) * t;

  }

  //着地後の潰れ
  if (elapsed >= FireFightHiyokoAction.JUMP_DURATION) {
    const landingElapsed =
      elapsed - FireFightHiyokoAction.JUMP_DURATION;

    const landingProgress =
      Math.min(
        landingElapsed / FireFightHiyokoAction.LANDING_DURATION,
        1
      );

    if (landingProgress < 0.35) {

      const t = landingProgress / 0.35;
      scaleY = 1 + (0.5 - 1) * t;

    } else {

      const t = (landingProgress - 0.35) / (1 - 0.35);
      scaleY = 0.5 + (1 - 0.5) * t;

    }
  }


  //========描画部========

  ctx.save();

  ctx.translate(    // まず「ひよこの足元」の位置へ移動
    screenPosition.x,
    screenPosition.y + frameHeight / 2
  );

  ctx.scale(1, scaleY);    // 足元を基準に縦方向だけ伸び縮み

  ctx.drawImage(
    image,
    sx,
    sy,
    frameWidth,
    frameHeight,

    -frameWidth / 2,
    -frameHeight,

    frameWidth,
    frameHeight
  );

  ctx.restore();
}

//=======================
//消防ひよこ影つけ係
//=======================

export function drawFireFightHiyokoShadow(ctx, vehicle, now, camera) {

  const action =
    getFireFightHiyokoPosition(vehicle, now);

  if (!action) {
    return;
  }


  const {
    shadowX,
    shadowY,
    jumpProgress,
    returnWalkFinished,
    returnJumpProgress,
  } = action;



  let shadowScale = 1;

  if (jumpProgress < 1) {
    shadowScale =
      1 - Math.sin(jumpProgress * Math.PI) * 0.4;
  }

  if (
    returnWalkFinished &&
    returnJumpProgress < 1
  ) {
    shadowScale =
      1 - Math.sin(returnJumpProgress * Math.PI) * 0.4;
  }

  const screenPosition = worldToScreen(
    shadowX,
    shadowY,
    camera
  );

  ctx.save();

  ctx.globalAlpha = 0.2;

  ctx.beginPath();

  ctx.ellipse(
    screenPosition.x,
    screenPosition.y + 28,
    24 * shadowScale,
    8 * shadowScale,
    0,
    0,
    Math.PI * 2
  );


  ctx.fillStyle = "black";
  ctx.fill();

  ctx.restore();
}


//============================================
//放水描画係
//============================================

export function drawFireFightWater(ctx, vehicle, now, image, camera) {

  if (!image) {
    return;
  }

  const hiyoko = vehicle.actionState?.hiyoko;

  if (!hiyoko?.visible) { //ひよこ見えてる？
    return;
  }

  if (!vehicle.actionState?.hoseRemoved) {  //ホースとれてる？
    return;
  }

  const sprayStartTime =
    hiyoko.jumpStartTime +
    FireFightHiyokoAction.JUMP_DURATION +
    FireFightHiyokoAction.LANDING_DURATION +
    FireFightHiyokoAction.WALK_DURATION;

  const sprayElapsed = now - sprayStartTime;

  if (sprayElapsed < 0) {   //放水始まった？
    return;
  }

  //アニメーション用フレームどこ
  const {
    FRAME_INTERVAL,
    LOOP_DURATION,
    introFrames,
    loopFrames,
    outroFrames,
  } = FireFightWaterAction;

  const introDuration =
    introFrames.length * FRAME_INTERVAL;

  const outroDuration =
    outroFrames.length * FRAME_INTERVAL;

  let frame;

  //水撒き始め
  if (sprayElapsed < introDuration) {
    const index =
      Math.floor(sprayElapsed / FRAME_INTERVAL);

    frame = introFrames[index];
  }

  //水撒いてる中
  else if (
    sprayElapsed <
    introDuration + LOOP_DURATION
  ) {
    const loopElapsed = sprayElapsed - introDuration;

    const index =
      Math.floor(loopElapsed / FRAME_INTERVAL) %
      loopFrames.length;

    frame = loopFrames[index];
  }

  //水撒きおわり
  else if (
    sprayElapsed <
    introDuration +
    LOOP_DURATION +
    outroDuration
  ) {
    const outroElapsed =
      sprayElapsed -
      introDuration -
      LOOP_DURATION;

    const index =
      Math.floor(outroElapsed / FRAME_INTERVAL);

    frame = outroFrames[index];
  }

  //放水終了
  else {
    return;
  }


  const frameWidth = 256;
  const frameHeight = 64;

  let sx;

  const position = getFireFightHiyokoPosition(vehicle, now);
  if (!position) {
    return;
  }

  const { x, y } = position;

  let waterX = x;
  const sy = frame * frameHeight;

  switch (vehicle.direction) {
    case Direction.LEFT:
    case Direction.FRONT:
      sx = 0;
      waterX += 160;
      break;

    case Direction.RIGHT:
    case Direction.BACK:
      sx = frameWidth;
      waterX -= 160;
      break;
  }

  const screenPosition = worldToScreen(
    waterX,
    y,
    camera
  );

  ctx.drawImage(
    image,

    sx,
    sy,
    frameWidth,
    frameHeight,

    screenPosition.x - frameWidth / 2,
    screenPosition.y - frameHeight / 2,

    frameWidth,
    frameHeight
  );
}


//========================================
//消防アクション監督
//========================================

export function updateFireFightAction(vehicle, now, soundManager) {
  if (vehicle.type !== "fireEngine") {
    return;
  }

  const hiyoko = vehicle.actionState?.hiyoko;

  if (!hiyoko?.visible || hiyoko.jumpStartTime == null) {
    return;
  }

  const elapsed = now - hiyoko.jumpStartTime;

  const jumpFinished = elapsed >=
    FireFightHiyokoAction.JUMP_DURATION +
    FireFightHiyokoAction.LANDING_DURATION;

  const walkFinished =
    elapsed >=
    FireFightHiyokoAction.JUMP_DURATION +
    FireFightHiyokoAction.LANDING_DURATION +
    FireFightHiyokoAction.WALK_DURATION;

  const waterDuration =
    FireFightWaterAction.introFrames.length *
    FireFightWaterAction.FRAME_INTERVAL +
    FireFightWaterAction.LOOP_DURATION +
    FireFightWaterAction.outroFrames.length *
    FireFightWaterAction.FRAME_INTERVAL;

  const waterFinished =
    elapsed >=
    FireFightHiyokoAction.JUMP_DURATION +
    FireFightHiyokoAction.LANDING_DURATION +
    FireFightHiyokoAction.WALK_DURATION +
    waterDuration;

  const returnWalkFinished =
    elapsed >=
    FireFightHiyokoAction.JUMP_DURATION +
    FireFightHiyokoAction.LANDING_DURATION +
    FireFightHiyokoAction.WALK_DURATION +
    waterDuration +
    FireFightHiyokoAction.RETURN_WALK_DURATION;


  const actionFinished =
    elapsed >=
    FireFightHiyokoAction.JUMP_DURATION +
    FireFightHiyokoAction.LANDING_DURATION +
    FireFightHiyokoAction.WALK_DURATION +
    waterDuration +
    FireFightHiyokoAction.RETURN_WALK_DURATION +
    FireFightHiyokoAction.JUMP_DURATION;

  if (walkFinished && !waterFinished) {
    vehicle.actionState.hoseRemoved = true;
  }
  if (waterFinished) {
    vehicle.actionState.hoseRemoved = false;
  }
  if (actionFinished) {
    vehicle.actionState.hiyoko.visible = false;
    vehicle.actionState.hiyoko.jumpStartTime = null;
  }

  //音管理

  const WALK_SOUND_INTERVAL = 280;

  const isWalking =
    (jumpFinished && !walkFinished) ||
    (waterFinished && !returnWalkFinished);

  if (isWalking) {
    if (
      hiyoko.lastWalkSoundTime == null ||
      now - hiyoko.lastWalkSoundTime >= WALK_SOUND_INTERVAL
    ) {
      soundManager.play("hiyokoWalk01");
      hiyoko.lastWalkSoundTime = now;
    }
  } else {
    hiyoko.lastWalkSoundTime = null;
  }

  if (walkFinished && !hiyoko.soundPlayed.hose) {
    soundManager.play("fireFightAction01");
    hiyoko.soundPlayed.hose = true;
  }
  if (walkFinished && !hiyoko.soundPlayed.spray) {
    soundManager.play("fireFightAction02");
    hiyoko.soundPlayed.spray = true;
  }
  if (returnWalkFinished && !hiyoko.soundPlayed.returnJump) {
    soundManager.play("hiyokoNoru");
    hiyoko.soundPlayed.returnJump = true;
  }
}
