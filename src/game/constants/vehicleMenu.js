//こちらがおくるまのメニューでございます。
export const VehicleMenu = {
  TAB_WIDTH: 280,
  TAB_HEIGHT: 140,

  PANEL_WIDTH: 1740,
  PANEL_HEIGHT: 980,

  PANEL_Y: 50,
  TAB_Y: 120,

  TAB_OVERHANG: 150,   //付箋はみ出し具合

  OPEN_DURATION: 300,

  VEHICLE_BASELINE_GAP: 8,  //罫線から車を離す。
};

//メニューのおくるまです。
export const vehicleMenuItems = [
  {
    type: "bus",
    skin: "yellow",
    offsetX: 300,
    lineY: 300,   //メニュー罫線の位置
    baselineOffset: 0, //タイヤの位置補整

    selectOffsetX: -130,
    selectOffsetY: -90,
  },
  {
    type: "ambulance",
    skin: "normal",
    offsetX: 650,
    lineY: 300,
    baselineOffset: 12,

    selectOffsetX: -90,
    selectOffsetY: -75,
  },
  {
    type: "fireEngine",
    skin: "normal",
    offsetX: 1000,
    lineY: 300,
    baselineOffset: 0,

    selectOffsetX: -90,
    selectOffsetY: -90,
  },
  {
    type: "policeCar",
    skin: "normal",
    offsetX: 1350,
    lineY: 300,
    baselineOffset: 0,

    selectOffsetX: -90,
    selectOffsetY: -90,
  },

]