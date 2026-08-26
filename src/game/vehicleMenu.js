import { vehicleMaster, Direction } from "./constants/vehicleMaster";


// ======== 車メニューの情報 ========

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



// ======== 車メニュー処理 ========


//メニュー付箋位置情報システム
export function getVehicleMenuTabRect(menu) {
  const closedX =
    1920 - VehicleMenu.TAB_OVERHANG;
  const openedPanelX =
    1920 - VehicleMenu.PANEL_WIDTH;
  const openedX =
    openedPanelX - VehicleMenu.TAB_OVERHANG;
  const x =
    closedX + (openedX - closedX) * menu.progress;

  return {
    x,
    y: VehicleMenu.TAB_Y,
    width: VehicleMenu.TAB_OVERHANG,
    height: VehicleMenu.TAB_HEIGHT,
  };
}


//メニュー開け閉めチェック係
export function toggleVehicleMenu(now, menu) {

  menu.startTime = now;
  menu.startProgress = menu.progress;
  menu.targetProgress = menu.isOpen ? 0 : 1;
  menu.isOpen = !menu.isOpen;
}


//メニュー開け閉め係
export function updateVehicleMenu(now, menu) {
  if (menu.progress === menu.targetProgress) {
    return;
  }

  const elapsed = now - menu.startTime;
  const t = Math.min(
    elapsed / VehicleMenu.OPEN_DURATION,
    1
  );

  const easedT = 1 - Math.pow(1 - t, 3);    //★イーズアウトキュービック

  menu.progress =
    menu.startProgress + (menu.targetProgress - menu.startProgress) * easedT;

  if (t === 1) {
    menu.progress = menu.targetProgress;
  }
}

//メニューのお車を取得
export function getVehicleMenuVehicles(menu) {
  const panelX =
    1920 - VehicleMenu.PANEL_WIDTH * menu.progress;
  const panelY = VehicleMenu.PANEL_Y;

  return vehicleMenuItems.map((item) => {
    const master = vehicleMaster[item.type];
    return {
      ...item,

      x: panelX + item.offsetX,
      y: panelY + item.lineY - master.height / 2
        - VehicleMenu.VEHICLE_BASELINE_GAP
        + (item.baselineOffset ?? 0),
    };
  });
}


//メニューの☆描画係
export function drawMenuSelectAnimation(ctx, menuVehicle, now, images) {
  const image = images.selectAnimation01;


  if (!image) {
    return;
  }

  const frameWidth = 128;
  const frameHeight = 128;

  const frame =
    Math.floor(now / 180) % 4;
  const scalePattern = [0.85, 1.0, 1.12, 1.0];
  const scale = scalePattern[frame];
  const baseSize = 80;

  const drawWidth = baseSize * scale;
  const drawHeight = baseSize * scale;

  const sx = frame * frameWidth;
  const sy = 0;

  const starX = menuVehicle.x + (menuVehicle.selectOffsetX ?? 0);
  const starY = menuVehicle.y + (menuVehicle.selectOffsetY ?? -145);

  ctx.drawImage(
    image,

    sx,
    sy,
    frameWidth,
    frameHeight,

    starX - drawWidth / 2,
    starY - drawHeight / 2,
    drawWidth,
    drawHeight
  );
}


//メニューの車描画係
export function drawMenuVehicle(
  ctx,
  menuVehicle,
  now,
  images,
  vehicle,
  effect
) {

  const master = vehicleMaster[menuVehicle.type];

  const imageKey =
    master.skins[menuVehicle.skin];

  const image = images[imageKey];

  if (!image) {
    return;
  }

  const frameWidth = master.width;
  const frameHeight = master.height;

  //メニューのおくるまは今操作中のおくるまですか？
  const isSelected = menuVehicle.type === vehicle[0].type;
  if (isSelected) {
    drawMenuSelectAnimation(
      ctx,
      menuVehicle,
      now,
      images
    ); //選ばれてたら☆つけて
  }

  const frame = isSelected
    ? Math.floor(now / 120) % 2   //もし選択中なら120ﾐﾘ秒ごとに切り替えて！
    : 0;

  const direction = Direction.RIGHT;

  const sx = frame * frameWidth;
  const sy = direction * frameHeight;


  //選択したときのぽよん計算
  let popScale = 1;


  if (effect.type === menuVehicle.type) {
    const elapsed = now - effect.startTime; //経過時間
    const duration = 300;

    if (elapsed < duration) {
      const progress = elapsed / duration;

      popScale = 1 + Math.sin(progress * Math.PI) * 0.25;
    }
  }

  const drawWidth = frameWidth * popScale;
  const drawHeight = frameHeight * popScale;

  ctx.drawImage(
    image,

    sx,
    sy,
    frameWidth,
    frameHeight,

    menuVehicle.x - drawWidth / 2,
    menuVehicle.y - drawHeight / 2,
    drawWidth,
    drawHeight
  );
}

//メニュー付箋描画係
export function drawVehicleMenuTab(ctx, menu, menuTag) {
  const closedX =
    1920 - VehicleMenu.TAB_OVERHANG;
  const openedPanelX =
    1920 - VehicleMenu.PANEL_WIDTH;
  const openedX =
    openedPanelX - VehicleMenu.TAB_OVERHANG;

  const tabX =
    closedX + (openedX - closedX) * menu.progress;
  const tabY = VehicleMenu.TAB_Y;

  ctx.drawImage(
    menuTag,
    tabX,
    tabY,
    VehicleMenu.TAB_WIDTH,
    VehicleMenu.TAB_HEIGHT
  );
}


//メニュー描画係
export function drawVehicleMenu(
  ctx,
  now,
  vehicleMenu,
  images,
  vehicles,
  vehicleSelectEffect
) {

  const menu = vehicleMenu;
  const menuBackground = images.menuBackground01;

  if (!menuBackground) {
    return;
  }

  const panelX =
    1920 - VehicleMenu.PANEL_WIDTH * menu.progress;

  const panelY = VehicleMenu.PANEL_Y;

  ctx.drawImage(
    menuBackground,
    panelX,
    panelY,
    VehicleMenu.PANEL_WIDTH,
    VehicleMenu.PANEL_HEIGHT
  );

  const menuVehicles = getVehicleMenuVehicles(menu);

  for (const vehicle of menuVehicles) {
    drawMenuVehicle(
      ctx,
      vehicle,
      now,
      images,
      vehicles,
      vehicleSelectEffect
    );
  }
}

