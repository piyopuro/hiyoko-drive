import { Map } from "./mapConfig";

//========ひよこたち========

export const NPCState = {
  IDLE: "idle",
  WALK: "walk",
};

export const NPCDirection = {
  FRONT: "front",
  BACK: "back",
  RIGHT: "right",
  LEFT: "left",
};

export const NPCAction = {
  JUMP_DURATION: 500,
  LANDING_DURATION: 230,
  JUMP_HEIGHT: 85,
};

export const NPCBehaviorType = {
  WANDER: "wander",
  FLEE: "flee",
  BOARD_BUS: "boardBus",
  RIDE_BUS: "rideBus",
  EXIT_BUS: "exitBus",
};

export const NPCFleeConfig = {
  AVOID_DISTANCE: 170,       //この距離までバスが来たら逃げる
  FLEE_DISTANCE: 220,        //どれくらい先まで逃げるか
  FLEE_SPEED_MULTIPLIER: 2.5, //普段の何倍で走るか
};

export const NPCWalkArea = {
  LEFT: 100,
  RIGHT: Map.WIDTH - 100,
  TOP: 120,
  BOTTOM: Map.HEIGHT - 120,
};


//ひよこたちの基本情報
export const npcMaster = {
  hiyoko: {
    imageKey: "npcHiyoko01",

    frameWidth: 64,
    frameHeight: 64,

    drawWidth: 64,
    drawHeight: 64,

    speed: 75,

    animationInterval: 180,

    walkFrames: [1, 0, 2, 0],

    directionRows: {
      front: 0,
      back: 1,
      right: 2,
      left: 3,
    },

    waitTime: {
      min: 1000,
      max: 3000,
    },

    shadow: {
      offsetY: 0,
      width: 18,
      height: 6,
    },
  },

  /*
  実装予定

  rareHiyoko: {
    imageKey: "npcRareHiyoko01",

    frameWidth: 64,
    frameHeight: 64,

    drawWidth: 64,
    drawHeight: 64,

    speed: 90,

    animationInterval: 160,

    walkFrames: [1, 0, 2, 0],

    directionRows: {
      front: 0,
      back: 1,
      right: 2,
      left: 3,
    },

    waitTime: {
      min: 800,
      max: 2000,
    },
  },
  */
};

