//電車と踏切の情報だよ。etVehicles
export const Railway = {
  //踏切
  CROSSING_X: 300,
  CROSSING_Y: 1550,
  CROSSING_WIDTH: 128,
  CROSSING_HEIGHT: 192,

  CROSSING_FRAME_WIDTH: 128,
  CROSSING_FRAME_HEIGHT: 192,

  CROSSING_FRAME_INTERVAL: 600,

  //線路
  RAILWAY_WIDTH: 768,
  RAILWAY_HEIGHT: 105,

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


//線路の世界座標
export const railwayMap = [
  {
    x: -50,
    y: 1500,
  },
  {
    x: -50 + Railway.RAILWAY_WIDTH * 1,
    y: 1500,
  },
  {
    x: -50 + Railway.RAILWAY_WIDTH * 2,
    y: 1500,
  },
  {
    x: -50 + Railway.RAILWAY_WIDTH * 3,
    y: 1500,
  },
  {
    x: -50 + Railway.RAILWAY_WIDTH * 4,
    y: 1500,
  },
  {
    x: -50 + Railway.RAILWAY_WIDTH * 5,
    y: 1500,
  },
];


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

