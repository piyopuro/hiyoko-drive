//道路の情報
export const Road = {
  TILE_SIZE: 192,

  types: {
    horizontal: {
      connections: ["left", "right"],
      canVehicle: true,
      canHiyoko: false,
    },

    vertical: {
      connections: ["up", "down"],
      canVehicle: true,
      canHiyoko: false,
    },

    corner_01: {
      connections: ["down", "right"],
      canVehicle: true,
      canHiyoko: false,
    },

    corner_02: {
      connections: ["left", "down"],
      canVehicle: true,
      canHiyoko: false,
    },

    corner_03: {
      connections: ["up", "left"],
      canVehicle: true,
      canHiyoko: false,
    },

    corner_04: {
      connections: ["right", "up"],
      canVehicle: true,
      canHiyoko: false,
    },

    t_01: {
      connections: ["left", "right", "up"],
      canVehicle: true,
      canHiyoko: false,
    },

    t_02: {
      connections: ["left", "right", "down"],
      canVehicle: true,
      canHiyoko: false,
    },

    t_03: {
      connections: ["left", "up", "down"],
      canVehicle: true,
      canHiyoko: false,
    },

    t_04: {
      connections: ["right", "up", "down"],
      canVehicle: true,
      canHiyoko: false,
    },

    cross: {
      connections: ["left", "right", "up", "down"],
      canVehicle: true,
      canHiyoko: false,
    },

    crosswalk01: {
      connections: ["left", "right"],
      canVehicle: true,
      canHiyoko: true,
    },

    crosswalk02: {
      connections: ["up", "down"],
      canVehicle: true,
      canHiyoko: true,
    },
  },
};
//道路の世界座標
export const roadMap = [
  // 上の道路
  { type: "corner_01", x: 1, y: 1 },
  { type: "horizontal", x: 2, y: 1 },
  { type: "horizontal", x: 3, y: 1 },
  { type: "t_02", x: 4, y: 1 },
  { type: "horizontal", x: 5, y: 1 },
  { type: "horizontal", x: 6, y: 1 },
  { type: "horizontal", x: 7, y: 1 },
  { type: "horizontal", x: 8, y: 1 },
  { type: "horizontal", x: 9, y: 1 },
  { type: "horizontal", x: 10, y: 1 },
  { type: "horizontal", x: 11, y: 1 },
  { type: "horizontal", x: 12, y: 1 },
  { type: "horizontal", x: 13, y: 1 },
  { type: "horizontal", x: 14, y: 1 },
  { type: "corner_02", x: 15, y: 1 },

  // 左端の縦道路
  { type: "vertical", x: 1, y: 2 },
  { type: "vertical", x: 1, y: 3 },
  { type: "vertical", x: 1, y: 4 },
  { type: "vertical", x: 1, y: 5 },
  { type: "vertical", x: 1, y: 6 },
  { type: "vertical", x: 1, y: 7 },
  { type: "vertical", x: 1, y: 8 },
  { type: "corner_04", x: 1, y: 9 },

  // 左側の内側へ伸びる道路
  { type: "vertical", x: 4, y: 2 },
  { type: "vertical", x: 4, y: 3 },
  { type: "vertical", x: 4, y: 4 },
  { type: "vertical", x: 4, y: 5 },
  { type: "corner_04", x: 4, y: 6 },

  // 中央左から中央環状道路へ
  { type: "horizontal", x: 5, y: 6 },
  { type: "horizontal", x: 6, y: 6 },
  { type: "t_03", x: 7, y: 6 },

  // 中央環状道路・上
  { type: "corner_01", x: 7, y: 3 },
  { type: "horizontal", x: 8, y: 3 },
  { type: "horizontal", x: 9, y: 3 },
  { type: "horizontal", x: 10, y: 3 },
  { type: "horizontal", x: 11, y: 3 },
  { type: "corner_02", x: 12, y: 3 },

  // 中央環状道路・左
  { type: "vertical", x: 7, y: 4 },
  { type: "vertical", x: 7, y: 5 },

  // 中央環状道路・右
  { type: "vertical", x: 12, y: 4 },
  { type: "t_04", x: 12, y: 5 },
  { type: "vertical", x: 12, y: 6 },

  // 中央環状道路・下
  { type: "corner_04", x: 7, y: 7 },
  { type: "horizontal", x: 8, y: 7 },
  { type: "horizontal", x: 9, y: 7 },
  { type: "horizontal", x: 10, y: 7 },
  { type: "horizontal", x: 11, y: 7 },
  { type: "corner_03", x: 12, y: 7 },

  // 上右側の縦道路
  { type: "vertical", x: 15, y: 2 },
  { type: "vertical", x: 15, y: 3 },

  // 十字路周辺
  { type: "crosswalk02", x: 15, y: 4 },
  { type: "cross", x: 15, y: 5 },
  { type: "crosswalk02", x: 15, y: 6 },

  // 十字路の横方向
  { type: "horizontal", x: 13, y: 5 },
  { type: "crosswalk01", x: 14, y: 5 },
  { type: "horizontal", x: 17, y: 5 },
  { type: "crosswalk01", x: 16, y: 5 },

  // 右側の小さいループ
  { type: "corner_02", x: 18, y: 5 },
  { type: "vertical", x: 18, y: 6 },
  { type: "vertical", x: 18, y: 7 },
  { type: "vertical", x: 18, y: 8 },
  { type: "corner_03", x: 18, y: 9 },

  // 右側中央の縦道路
  { type: "vertical", x: 15, y: 7 },
  { type: "vertical", x: 15, y: 8 },
  { type: "t_01", x: 15, y: 9 },

  // 下の道路
  { type: "horizontal", x: 2, y: 9 },
  { type: "horizontal", x: 3, y: 9 },
  { type: "horizontal", x: 4, y: 9 },
  { type: "horizontal", x: 5, y: 9 },
  { type: "horizontal", x: 6, y: 9 },
  { type: "horizontal", x: 7, y: 9 },
  { type: "horizontal", x: 8, y: 9 },
  { type: "horizontal", x: 9, y: 9 },
  { type: "horizontal", x: 10, y: 9 },
  { type: "horizontal", x: 11, y: 9 },
  { type: "horizontal", x: 12, y: 9 },
  { type: "horizontal", x: 13, y: 9 },
  { type: "horizontal", x: 14, y: 9 },
  { type: "horizontal", x: 16, y: 9 },
  { type: "horizontal", x: 17, y: 9 },
];