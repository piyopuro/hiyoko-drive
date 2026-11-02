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
      width: 102,
      height: 44,

      
      horizontal: {
        width: 210        ,
        height: 35,
      },
    },

    actionSound: "busHorn",
  },

  ambulance: {
    width: 192,
    height: 128,

    speed: 500,

    canChangeColor: false,
    defaultSkin: "normal",
    skins: {
      normal: "ambulance01",
    },

    shadow: {
      offsetY: 40,
      width: 80,
      height: 36,
      
      horizontal: {
        width: 160,
        height: 36,
      },
    },

    actionSound: "ambulanceSiren",

  },

  fireEngine: {
    width: 192,
    height: 128,

    speed: 500,

    canChangeColor: false,
    defaultSkin: "normal",
    skins: {
      normal: "fireEngine01",
    },

    shadow: {
      offsetY: 50,
      width: 100,
      height: 36,
      
      horizontal: {
        width: 170,
        height: 36,
      },
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

    speed: 500,

    canChangeColor: false,
    defaultSkin: "normal",
    skins: {
      normal: "policeCar01",
    },

    shadow: {
      offsetY: 25,
      width: 64,
      height: 36,

      horizontal: {
        width: 134,
        height: 36,
      },
    },

    actionSound: "policeCarSiren",

    initialActionState: {
      startTime: null,
    },

  },

  car: {
    width: 130,
    height: 87,

    speed: 300,

    canChangeColor: true,
    defaultSkin: "yellow",
    skins: {
      yellow: "car01",
      blue: "car02",
      green: "car03",
      pink: "car04",
      red: "car05",
      purple: "car06",
      limeGreen: "car07",
      orange: "car08",
    },

    shadow: {
      offsetY: 32,
      width: 80,
      height: 36,

      horizontal: {
        width: 114,
        height: 36,
      },
    },

    actionSound: "car01",

    initialActionState: {
      startTime: null,
    },

  },

  carCarrier: {
    width: 360,
    height: 140,

    speed: 300,

    canChangeColor: false,
    defaultSkin: "normal",
    skins: {
      normal: "carCarrier01",
    },

    shadow: {
      offsetY: 62,
      width: 120,
      height: 50,

      horizontal: {
        width: 300,
        height: 34,
      },
    },

    actionSound: "carCarrier01",
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


