export const Direction = {
  RIGHT: 0,
  LEFT: 1,
  FRONT: 2,
  BACK: 3,
}
export const Frame = {
  IDLE: 0,
  MOVE: 1,
};

export const State = {
  STOP: 0,
  MOVE: 1,
};


//========のりものたちの基本情報========
export const vehicleMaster = {
  bus: {
    width: 256,
    height: 128,

    speed: 300,

    canChangeColor: true,

    defaultSkin: "yellow",
    skins: {
      yellow: "bus01",
      blue: "bus02",
      green: "bus03",
      pink: "bus04",
      red: "bus05",
      purple: "bus06",
      limeGreen: "bus07",
      orange: "bus08",
    },

    shadow: {
      offsetY: 50,
      width: 55,
      height: 18,
    },

    actionSound: "busHorn",
  },

  ambulance: {
    width: 192,
    height: 128,

    speed: 400,

    canChangeColor: false,
    defaultSkin: "normal",
    skins: {
      normal: "ambulance01",
    },

    shadow: {
      offsetY: 40,
      width: 55,
      height: 18,
    },

    actionSound: "ambulanceSiren",

  },

  fireEngine: {
    width: 192,
    height: 128,

    speed: 400,

    canChangeColor: false,
    defaultSkin: "normal",
    skins: {
      normal: "fireEngine01",
    },

    shadow: {
      offsetY: 50,
      width: 55,
      height: 18,
    },

    actionSound: "fireEngineSiren",

    hoseRemovedFrame: 2,
    initialActionState: {
      hoseRemoved: false,

      hiyoko: {
        visible: true,
        jumpStartTime: null,

        soundPlayed: {
          hose: false,
          spray: false,
          returnJump: false,
        },
      },
    },

  },

  policeCar: {
    width: 150,
    height: 80,

    speed: 400,

    canChangeColor: false,
    defaultSkin: "normal",
    skins: {
      normal: "policeCar01",
    },

    shadow: {
      offsetY: 30,
      width: 55,
      height: 18,
    },

    actionSound: "policeCarSiren",

    initialActionState: {
      startTime: null,
    },

  },


  /* 今後実装予定
  bigbus: {
    width: 256,
    height: 128,

    speed: 5,

    skins:{
      normal:"bigbus01",
    },
  },    */

};


