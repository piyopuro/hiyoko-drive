//電車と踏切の情報だよ。
export const Railway = {
  //踏切
  CROSSING_X: 300,
  CROSSING_Y: 950,
  CROSSING_WIDTH: 128,
  CROSSING_HEIGHT: 192,

  CROSSING_FRAME_WIDTH: 128,
  CROSSING_FRAME_HEIGHT: 192,

  CROSSING_FRAME_INTERVAL: 600,

  //電車
  TRAIN_Y: 920,
  TRAIN_WIDTH: 1344,
  TRAIN_HEIGHT: 128,
  TRAIN_SPEED: 240,

  //踏切を押してから電車が発車するまで
  START_DELAY: 1200,

  shadow: {
    offsetY: 55,
    width: 1310,
    height: 30,
  },
};

//電車の乗客の情報だよ。
export const TrainPassenger = {
  CAR_WIDTH: 448,

  FRAME_INTERVAL: 140,
  BOTTOM_Y_FROM_TRAIN_TOP: 69,

  variants: {
    hiyoko: {
      imageKey: "tHiyoko",
      weight: 5,

      frameWidth: 96,
      frameHeight: 80,

      introFrames: [0, 1, 2],
      loopFrames: [3, 4, 5, 4],
    },

    cat01: {
      imageKey: "tCat01",
      weight: 1,

      frameWidth: 96,
      frameHeight: 80,

      introFrames: [0, 1, 2],
      loopFrames: [3, 4, 5, 4],
    },

    cat02: {
      imageKey: "tCat02",
      weight: 1,

      frameWidth: 96,
      frameHeight: 80,

      introFrames: [0, 1, 2],
      loopFrames: [3, 4, 5, 4],
    },

    cat03: {
      imageKey: "tCat03",
      weight: 1,

      frameWidth: 96,
      frameHeight: 80,

      introFrames: [0, 1, 2],
      loopFrames: [3, 4, 5, 4],
    },
  },
};

