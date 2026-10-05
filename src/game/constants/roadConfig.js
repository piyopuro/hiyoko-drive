//道路の情報
export const Road = {
  TILE_SIZE: 192,

  types: {
    horizontal: {
      connections: ["left", "right"],
    },

    vertical: {
      connections: ["up", "down"],
    },

    corner_01: {
      connections: ["down", "right"],
    },

    corner_02: {
      connections: ["left", "down"],
    },

    corner_03: {
      connections: ["up", "left"],
    },

    corner_04: {
      connections: ["right", "up"],
    },

    t_01: {
      connections: ["left", "right", "up"],
    },

    t_02: {
      connections: ["left", "right", "down"],
    },

    t_03: {
      connections: ["left", "up", "down"],
    },

    t_04: {
      connections: ["right", "up", "down"],
    },

    cross: {
      connections: ["left", "right", "up", "down"],
    },

    crosswalk01: {
      connections: ["left", "right"],
    },

    crosswalk02: {
      connections: ["up", "down"],
    },
  },
};
//道路の世界座標
export const roadMap = [
  // 上の道路
  { type: "corner_01", x: 2, y: 2 },
  { type: "horizontal", x: 3, y: 2 },
  { type: "horizontal", x: 4, y: 2 },
  { type: "horizontal", x: 5, y: 2 },
  { type: "crosswalk01", x: 6, y: 2 },
  { type: "t_02", x: 7, y: 2 },
  { type: "horizontal", x: 8, y: 2 },
  { type: "horizontal", x: 9, y: 2 },
  { type: "horizontal", x: 10, y: 2 },
  { type: "horizontal", x: 11, y: 2 },
  { type: "horizontal", x: 12, y: 2 },
  { type: "horizontal", x: 13, y: 2 },
  { type: "crosswalk01", x: 14, y: 2 },
  { type: "horizontal", x: 15, y: 2 },
  { type: "horizontal", x: 16, y: 2 },
  { type: "horizontal", x: 17, y: 2 },
  { type: "horizontal", x: 18, y: 2 },
  { type: "crosswalk01", x: 19, y: 2 },
  { type: "t_02", x: 20, y: 2 },
  { type: "crosswalk01", x: 21, y: 2 },
  { type: "horizontal", x: 22, y: 2 },
  { type: "horizontal", x: 23, y: 2 },
  { type: "horizontal", x: 24, y: 2 },
  { type: "horizontal", x: 25, y: 2 },
  { type: "horizontal", x: 26, y: 2 },
  { type: "horizontal", x: 27, y: 2 },
  { type: "corner_02", x: 28, y: 2 },

  // 左端の縦道路
  { type: "vertical", x: 2, y: 3 },
  { type: "vertical", x: 2, y: 4 },
  { type: "vertical", x: 2, y: 5 },
  { type: "vertical", x: 2, y: 6 },
  { type: "crosswalk02", x: 2, y: 7 },
  { type: "t_04", x: 2, y: 8 },
  { type: "crosswalk02", x: 2, y: 9 },
  { type: "vertical", x: 2, y: 10 },
  { type: "vertical", x: 2, y: 11 },
  { type: "vertical", x: 2, y: 12 },
  { type: "corner_04", x: 2, y: 13 },

  // 左側の縦道路
  { type: "crosswalk02", x: 7, y: 3 },
  { type: "vertical", x: 7, y: 4 },
  { type: "vertical", x: 7, y: 5 },
  { type: "vertical", x: 7, y: 6 },
  { type: "crosswalk02", x: 7, y: 7 },
  { type: "cross", x: 7, y: 8 },
  { type: "crosswalk02", x: 7, y: 9 },
  { type: "vertical", x: 7, y: 10 },
  { type: "vertical", x: 7, y: 11 },
  { type: "crosswalk02", x: 7, y: 12 },
  { type: "t_01", x: 7, y: 13 },

  // 中央環状道路・上
  { type: "corner_01", x: 12, y: 6 },
  { type: "horizontal", x: 13, y: 6 },
  { type: "horizontal", x: 14, y: 6 },
  { type: "crosswalk01", x: 15, y: 6 },
  { type: "horizontal", x: 16, y: 6 },
  { type: "corner_02", x: 17, y: 6 },

  // 中央環状道路・左
  { type: "vertical", x: 12, y: 7 },
  { type: "t_03", x: 12, y: 8 },
  { type: "vertical", x: 12, y: 9 },
  { type: "corner_04", x: 12, y: 10 },

  // 中央環状道路・下
  { type: "horizontal", x: 13, y: 10 },
  { type: "crosswalk01", x: 14, y: 10 },
  { type: "horizontal", x: 15, y: 10 },
  { type: "horizontal", x: 16, y: 10 },
  { type: "corner_03", x: 17, y: 10 },

  // 中央環状道路・右
  { type: "vertical", x: 17, y: 7 },
  { type: "t_04", x: 17, y: 8 },
  { type: "vertical", x: 17, y: 9 },

  // 中央の横道路・左側
  { type: "crosswalk01", x: 3, y: 8 },
  { type: "horizontal", x: 4, y: 8 },
  { type: "horizontal", x: 5, y: 8 },
  { type: "crosswalk01", x: 6, y: 8 },
  // x7 は十字路
  { type: "horizontal", x: 8, y: 8 },
  { type: "horizontal", x: 9, y: 8 },
  { type: "horizontal", x: 10, y: 8 },
  { type: "crosswalk01", x: 11, y: 8 },

  // 右側上の縦道路＋枝道
  { type: "vertical", x: 20, y: 3 },
  { type: "vertical", x: 20, y: 4 },
  { type: "corner_04", x: 20, y: 5 },
  { type: "horizontal", x: 21, y: 5 },
  { type: "horizontal", x: 22, y: 5 },
  { type: "corner_02", x: 23, y: 5 },
  { type: "vertical", x: 23, y: 6 },
  { type: "vertical", x: 23, y: 7 },
  { type: "t_01", x: 23, y: 8 },

  // 右端の縦道路
  { type: "vertical", x: 28, y: 3 },
  { type: "vertical", x: 28, y: 4 },
  { type: "vertical", x: 28, y: 5 },
  { type: "vertical", x: 28, y: 6 },
  { type: "vertical", x: 28, y: 7 },
  { type: "corner_03", x: 28, y: 8 },

  // 中央の横道路・右側
  { type: "crosswalk01", x: 18, y: 8 },
  { type: "horizontal", x: 19, y: 8 },
  // x20 は十字路
  { type: "horizontal", x: 21, y: 8 },
  { type: "crosswalk01", x: 22, y: 8 },
  { type: "t_01", x: 23, y: 8 },
  { type: "crosswalk01", x: 24, y: 8 },
  { type: "t_02", x: 25, y: 8 },
  { type: "horizontal", x: 26, y: 8 },
  { type: "crosswalk01", x: 27, y: 8 },

  // 右側の縦道路
  { type: "t_02", x: 20, y: 8 },
  { type: "crosswalk02", x: 20, y: 9 },
  { type: "vertical", x: 20, y: 10 },
  { type: "vertical", x: 20, y: 11 },
  { type: "vertical", x: 20, y: 12 },
  { type: "crosswalk02", x: 20, y: 13 },

  // 右下へ伸びる縦道路
  { type: "vertical", x: 25, y: 9 },
  { type: "vertical", x: 25, y: 10 },
  { type: "vertical", x: 25, y: 11 },
  { type: "vertical", x: 25, y: 12 },
  { type: "vertical", x: 25, y: 13 },

  // 左下の道路
  { type: "corner_04", x: 2, y: 13 },
  { type: "horizontal", x: 3, y: 13 },
  { type: "horizontal", x: 4, y: 13 },
  { type: "horizontal", x: 5, y: 13 },
  { type: "crosswalk01", x: 6, y: 13 },
  { type: "t_01", x: 7, y: 13 },
  { type: "crosswalk01", x: 8, y: 13 },
  { type: "horizontal", x: 9, y: 13 },
  { type: "horizontal", x: 10, y: 13 },
  { type: "horizontal", x: 11, y: 13 },
  { type: "horizontal", x: 12, y: 13 },
  { type: "horizontal", x: 13, y: 13 },
  { type: "horizontal", x: 14, y: 13 },
  { type: "corner_02", x: 15, y: 13 },

  // 下側の道路
  { type: "corner_04", x: 15, y: 14 },
  { type: "horizontal", x: 16, y: 14 },
  { type: "horizontal", x: 17, y: 14 },
  { type: "horizontal", x: 18, y: 14 },
  { type: "horizontal", x: 19, y: 14 },
  { type: "t_01", x: 20, y: 14 },
  { type: "horizontal", x: 21, y: 14 },
  { type: "horizontal", x: 22, y: 14 },
  { type: "horizontal", x: 23, y: 14 },
  { type: "horizontal", x: 24, y: 14 },
  { type: "corner_03", x: 25, y: 14 },
];
