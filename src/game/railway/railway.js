import {
  Railway,
  TrainPassenger,
} from "../constants/railwayConfig"

import {
  drawShadow,
  drawRectShadow,
} from "../utils/draw";


//========================判定所==================================

//踏切おさわり判定
export function getCrossingRect() {
  return {
    x: Railway.CROSSING_X - Railway.CROSSING_WIDTH / 2,
    y: Railway.CROSSING_Y - Railway.CROSSING_HEIGHT / 2,
    width: Railway.CROSSING_WIDTH,
    height: Railway.CROSSING_HEIGHT,
  };
}

//電車おさわり判定
export function getTrainRect(train) {
  return {
    x: train.x - Railway.TRAIN_WIDTH / 2,
    y: train.y - Railway.TRAIN_HEIGHT / 2,
    width: Railway.TRAIN_WIDTH,
    height: Railway.TRAIN_HEIGHT,
  };
}

//何両目か判定
export function getTappedTrainCarIndex(tapX, train) {
  const trainLeft =
    train.x - Railway.TRAIN_WIDTH / 2;

  const localX =
    tapX - trainLeft;

  const carIndex =
    Math.floor(localX / TrainPassenger.CAR_WIDTH);

  return Math.max(
    0,
    Math.min(carIndex, 2)
  );
}



//======================================
//踏切描画係
//======================================
export function drawCrossing(ctx, image, crossing) {

  if (!image) {
    return;
  }

  const sourceX =
    crossing.frame * Railway.CROSSING_FRAME_WIDTH;

  const sourceY = 0;

  drawShadow(
    ctx,
    Railway.CROSSING_X,
    Railway.CROSSING_Y + 90,
    50,
    10
  );

  ctx.drawImage(
    image,

    sourceX,
    sourceY,
    Railway.CROSSING_FRAME_WIDTH,
    Railway.CROSSING_FRAME_HEIGHT,

    Railway.CROSSING_X - Railway.CROSSING_WIDTH / 2,
    Railway.CROSSING_Y - Railway.CROSSING_HEIGHT / 2,
    Railway.CROSSING_WIDTH,
    Railway.CROSSING_HEIGHT
  );
}


//======================================
//電車描画係
//======================================
export function drawTrain(ctx, image, train) {

  if (!train.isRunning || !image) {
    return;
  }

  drawRectShadow(
    ctx,
    train.x,
    train.y + Railway.shadow.offsetY,
    Railway.shadow.width,
    Railway.shadow.height,
    10
  );

  ctx.drawImage(
    image,
    train.x - Railway.TRAIN_WIDTH / 2,
    train.y - Railway.TRAIN_HEIGHT / 2,
    Railway.TRAIN_WIDTH,
    Railway.TRAIN_HEIGHT
  );
}


//======================================
//電車の乗客描画係
//======================================
export function drawTrainPassengers(
  ctx,
  now,
  train,
  passengers,
  getImage
) {

  if (!train.isRunning) {
    return;
  }

  const trainLeft =
    train.x - Railway.TRAIN_WIDTH / 2;

  const trainTop =
    train.y - Railway.TRAIN_HEIGHT / 2;

  for (
    const passenger of passengers) {

    //種類
    const variant =
      TrainPassenger.variants[passenger.variant];
    if (!variant) {
      continue;
    }

    //乗客ごとの画像を取得
    const image = getImage(variant.imageKey);

    if (!image) {
      continue;
    }

    const frameWidth = variant.frameWidth;
    const frameHeight = variant.frameHeight;

    const frame =
      getTrainPassengerFrame(passenger, now);

    const sourceX =
      frame * frameWidth;
    const sourceY = 0;

    const carCenterX =
      trainLeft +
      passenger.carIndex * TrainPassenger.CAR_WIDTH +
      TrainPassenger.CAR_WIDTH / 2;

    const passengerBottomY =
      trainTop +
      TrainPassenger.BOTTOM_Y_FROM_TRAIN_TOP;

    const passengerX = carCenterX - frameWidth / 2;

    const passengerY = passengerBottomY - frameHeight;

    ctx.drawImage(
      image,

      sourceX,
      sourceY,
      frameWidth,
      frameHeight,

      passengerX,
      passengerY,
      frameWidth,
      frameHeight
    );
  }
}


//======================================
//乗客アニメフレームNo.決定係
//======================================
export function getTrainPassengerFrame(passenger, now) {
  const variant =
    TrainPassenger.variants[passenger.variant];

  const elapsed =
    now - passenger.startTime;

  const step = Math.floor(
    elapsed / TrainPassenger.FRAME_INTERVAL
  );

  const introFrames =
    variant.introFrames;

  if (step < introFrames.length) {
    return introFrames[step];
  }

  const loopFrames =
    variant.loopFrames;

  const loopStep =
    step - introFrames.length;

  return loopFrames[
    loopStep % loopFrames.length
  ];
}


//======================================
//電車出発準備係
//======================================
export function startTrain(
  now,
  train,
  crossing,
  passengers,
  soundManager
) {

  //今走ってる？？連打禁止！
  if (train.isRunning || train.isWaiting) {
    return;
  }

  //乗客リセット
  passengers.length = 0;

  //左右指示係
  train.direction = Math.random() < 0.5 ? 1 : -1;

  train.isWaiting = true;
  train.startTime = now;

  //踏切アニメーション開始
  crossing.isRinging = true;
  crossing.frame = 1;
  crossing.lastFrameTime = now;

  //踏切音
  soundManager.play("crossing");
}


//======================================
//誰が乗ってるか決める係
//======================================
export function getRandomTrainPassengerVariant() {
  const variants = Object.entries(
    TrainPassenger.variants
  );

  const totalWeight = variants.reduce(
    (sum, [, variant]) => sum + variant.weight,
    0
  );

  let random = Math.random() * totalWeight;

  for (const [key, variant] of variants) {
    random -= variant.weight;

    if (random < 0) {
      return key;
    }
  }

  return variants[0][0];
}


//======================================
//電車に乗客を出す係
//======================================
export function createTrainPassenger(carIndex, now, passengers) {

  //乗客チェック
  const existingPassenger =
    passengers.find(
      (passenger) =>
        passenger.carIndex === carIndex
    );

  //同じ車両をもう一度押したら最初から
  if (existingPassenger) {
    existingPassenger.startTime = now;

    return {
      isNewPassenger: false,
      passenger: existingPassenger,
    };
  }

  const newPassenger = {
    type: "trainPassenger",
    variant: getRandomTrainPassengerVariant(),

    carIndex,
    startTime: now,
  };

  passengers.push(newPassenger);

  return {
    isNewPassenger: true,
    passenger: newPassenger,
  };
}

//======================================
//★踏切監督
//======================================
export function updateCrossing(now, crossing) {
  //鳴っていない？
  if (!crossing.isRinging) {
    crossing.frame = 0;
    return;
  }

  const elapsed = now - crossing.lastFrameTime;

  if (elapsed < Railway.CROSSING_FRAME_INTERVAL) {
    return;
  }

  crossing.lastFrameTime = now;

  //警報①と警報②を交互にする
  crossing.frame = crossing.frame === 1 ? 2 : 1;
}


//======================================
//★電車監督
//======================================
export function updateTrain(
  now, 
  deltaTime,
  train,
  crossing,
  soundManager,
  trainPassengers
) {

  //踏切を押して電車を待っているところ
  if (train.isWaiting) {
    const elapsed = now - train.startTime;

    if (elapsed >= Railway.START_DELAY) {
      train.isWaiting = false;
      train.isRunning = true;

      if (train.direction === 1) {
        //左側の画面外から右へ
        train.x = -Railway.TRAIN_WIDTH / 2;
      } else {
        //右側の画面外から左へ
        train.x = 1920 + Railway.TRAIN_WIDTH / 2;
      }

      soundManager.play("train01");
    }

    return;
  }

  if (!train.isRunning) {
    return;
  }

  train.x += Railway.TRAIN_SPEED * deltaTime * train.direction;

  const passedRightSide =
    train.direction === 1 &&
    train.x - Railway.TRAIN_WIDTH / 2 > 1920;

  const passedLeftSide =
    train.direction === -1 &&
    train.x + Railway.TRAIN_WIDTH / 2 < 0;

  if (passedRightSide || passedLeftSide) {
    train.isRunning = false;

    //乗客おしまい
    trainPassengers = [];
    //踏切おしまい
    crossing.isRinging = false;
    crossing.frame = 0;
  }
}
