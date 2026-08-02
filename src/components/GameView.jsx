import { useState, useEffect, useRef } from "react";
import { VERSION } from "../version";
import SoundManager from "../SoundManager";

const Direction = {
  RIGHT: 0,
  LEFT: 1,
  FRONT: 2,
  BACK: 3,
}
const Frame = {
  IDLE: 0,
  MOVE: 1,
};

const State = {
  STOP: 0,
  MOVE: 1,
};

const Effect = {
  DURATION: 300,
  AMOUNT: 0.2,
}

const TapEffect = {
  DURATION: 400,

  IMAGE_WIDTH: 64,
  IMAGE_HEIGHT: 64,

  MIN_SIZE: 35,
  MAX_SIZE: 65,

  MIN_DISTANCE: 20,
  MAX_DISTANCE: 75,
};

//========ひよこたち========

const NPCState = {
  IDLE: "idle",
  WALK: "walk",
};

const NPCDirection = {
  FRONT: "front",
  BACK: "back",
  RIGHT: "right",
  LEFT: "left",
};

const NPCWalkArea = {
  LEFT: 100,
  RIGHT: 1820,
  TOP: 120,
  BOTTOM: 800,
};

//ひよこたちの基本情報
const npcMaster = {
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

//========のりものたちの基本情報========
const vehicleMaster = {
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

    speed: 360,

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

//インク池の情報たち
const colorPuddleMaster = [
  {
    id: 1,
    radius: 80,
    skin: "yellow",
    imageName: "puddle01",
  },
  {
    id: 2,
    radius: 80,
    skin: "blue",
    imageName: "puddle02",
  },
  {
    id: 3,
    radius: 80,
    skin: "green",
    imageName: "puddle03",
  },
  {
    id: 4,
    radius: 80,
    skin: "pink",
    imageName: "puddle04",
  },
  {
    id: 5,
    radius: 80,
    skin: "red",
    imageName: "puddle05",
  },
  {
    id: 6,
    radius: 80,
    skin: "purple",
    imageName: "puddle06",
  },
  {
    id: 7,
    radius: 80,
    skin: "limeGreen",
    imageName: "puddle07",
  },
  {
    id: 8,
    radius: 80,
    skin: "orange",
    imageName: "puddle08",
  },
];

//最小値以上、最大値以下のランダムな数を作る係
function getRandomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

//ひよこを作る係
function createNPC(type, startX, startY) {
  const master = npcMaster[type];

  if (!master) {
    return null;
  }

  const x = startX ??
    getRandomNumber(
      NPCWalkArea.LEFT,
      NPCWalkArea.RIGHT
    );
  const y = startY ??
    getRandomNumber(
      NPCWalkArea.TOP,
      NPCWalkArea.BOTTOM
    );

  return {
    id: crypto.randomUUID(),

    type,
    position: {
      x,
      y,
    },
    target: {
      x,
      y,
    },

    direction: NPCDirection.FRONT,
    state: NPCState.IDLE,

    frame: 0,
    animationFrameIndex: 0,
    animationTimer: 0,

    waitUntil:
      performance.now() +
      getRandomNumber(
        master.waitTime.min,
        master.waitTime.max
      ),
  };
}

//インク池ランダム配置係
function createRandomColorPuddles() {
  const placedPuddles = [];

  const margin = 100; //余白
  const puddleGap = 60; //インク池すきま

  //バスの初期位置
  const vehicleStartPosition = {
    x: 960,
    y: 540,
  };
  const vehicleStartGap = 220;

  for (const puddleMaster of colorPuddleMaster) {
    let positionFound = false;

    //100回まで探せる
    for (let attempt = 0; attempt < 100; attempt++) {
      const x = getRandomNumber(
        margin + puddleMaster.radius,
        1920 - margin - puddleMaster.radius
      );
      const y = getRandomNumber(
        margin + puddleMaster.radius,
        850 - margin - puddleMaster.radius
      );

      //インク池重なりチェック
      const overlapsPuddle = placedPuddles.some((placedPuddle) => {
        const dx = x - placedPuddle.x;
        const dy = y - placedPuddle.y;

        const distance = Math.hypot(dx, dy);

        const minimumDistance =
          puddleMaster.radius +
          placedPuddle.radius +
          puddleGap;

        return distance < minimumDistance;
      });

      //バスの初期位置に近すぎないか確認
      const distanceFromVehicleStart = Math.hypot(
        x - vehicleStartPosition.x,
        y - vehicleStartPosition.y
      );

      const tooCloseToVehicleStart =
        distanceFromVehicleStart < vehicleStartGap;

      //問題がなければ、この位置に決定！
      if (!overlapsPuddle && !tooCloseToVehicleStart) {
        placedPuddles.push({
          ...puddleMaster,
          x,
          y,
        });

        positionFound = true;
        break;
      }
    }

    if (!positionFound) {
      console.warn(
        `インク池 ${puddleMaster.id} の置き場所が見つかりませんでした`
      );
    }
  }

  return placedPuddles;
}

//こちらがおくるまのメニューでございます。
const VehicleMenu = {
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
const vehicleMenuItems = [
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
    offsetX: 700,
    lineY: 300,
    baselineOffset: 12,

    selectOffsetX: -90,
    selectOffsetY: -75,
  },
]

//電車と踏切の情報だよ。
const Railway = {
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
const TrainPassenger = {
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

//ゲームの中身を描いてるところだよ。
function GameView() {

  //========画面管理人========
  const [screenSize, setScreenSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  //画面拡縮率計算君
  const scale = Math.min(
    screenSize.width / 1920,
    screenSize.height / 1080
  );
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);



  //========ゲーム管理人========

  //インク池ランダム座標決定所
  const colorPuddlesRef = useRef(null);
  if (colorPuddlesRef.current === null) {
    colorPuddlesRef.current = createRandomColorPuddles();
  }

  //のりものたちの状態の記録係
  const [vehicles, setVehicles] = useState([
    {
      id: 1,

      type: "bus",
      skin: "yellow",

      position: {
        x: 960,
        y: 540,
      },

      target: {
        x: 960,
        y: 540,
      },

      direction: Direction.RIGHT,
      frame: Frame.IDLE,
      state: State.STOP,

      transform: {
        scaleX: 1,
        scaleY: 1,
      },

      effect: {
        type: null, //発進ぽよん→start 停止ぽよん→stop
        startTime: 0,
        duration: 0,
      },
    },
  ]);

  //========電車========
  //車両管理人
  const railwayRef = useRef({
    crossing: {
      isRinging: false,

      frame: 0, //通常時0、警報1と2

      lastFrameTime: 0,
    },

    train: {
      isRunning: false,
      isWaiting: false,

      //右向きなら1、左向きなら-1
      direction: 1,

      x: -1344,
      y: Railway.TRAIN_Y,

      startTime: 0,
    },
  });

  //乗客管理人
  const trainPassengersRef = useRef([]);

  //タップエフェクト管理人
  const tapEffectsRef = useRef([]);

  //ひよこ管理人
  const npcsRef = useRef(null);

  if (!npcsRef.current) {
    npcsRef.current = [
      createNPC("hiyoko", 500, 500),
    ].filter(Boolean);
  }

  const imagesRef = useRef({
    background: null,

    bus01: null,
    bus02: null,
    bus03: null,
    bus04: null,
    bus05: null,
    bus06: null,
    bus07: null,
    bus08: null,

    ambulance01: null,

    train01: null,
    crossing01: null,
    tEffect01: null,
    tHiyoko: null,
    tCat01: null,
    tCat02: null,
    tCat03: null,

    puddle01: null,
    puddle02: null,
    puddle03: null,
    puddle04: null,
    puddle05: null,
    puddle06: null,
    puddle07: null,
    puddle08: null,

    npcHiyoko01: null,

    menuBackground01: null,
    menuTag01: null,
    selectAnimation01: null,
  });

  const vehiclesRef = useRef(vehicles); //車の情報
  useEffect(() => {   //車の情報が変わったら入れるよ
    vehiclesRef.current = vehicles;
  }, [vehicles]);

  const animationTimerRef = useRef(0);

  //========マネージャーさん========
  //音響担当
  const soundManagerRef = useRef(null);
  if (!soundManagerRef.current) {
    soundManagerRef.current = new SoundManager();
  }

  //========メニュー管理人========
  const vehicleMenuRef = useRef({
    isOpen: false,

    startTime: 0,
    startProgress: 0,
    targetProgress: 0,

    progress: 0,  //閉じてる？開いてる？
  });

  const vehicleSelectEffectRef = useRef({
    type: null,
    startTime: 0,
  });

  //========FPS管理人========
  const fpsRef = useRef(null);
  const fpsDataRef = useRef({
    lastReportTime: performance.now(),
    previousFrameTime: null,
    frames: 0,
    maxFrameGap: 0,
    droppedFrames: 0,
  });
  const fpsDisplayRef = useRef(null);


  //₍₍ (ง ›ω‹ )ว ⁾⁾₍₍ (ง ›ω‹ )ว ⁾⁾₍₍ (ง ›ω‹ )ว ⁾⁾₍₍ (ง ›ω‹ )ว ⁾⁾


  //ウインドウサイズ監視君。変更があったらゲーム画面の大きさを変えてくれるところ。
  useEffect(() => {
    function handleResize() {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);


  //影つけ係
  function drawShadow(ctx, x, y, width, height) {
    ctx.beginPath();

    ctx.ellipse(
      x,
      y,
      width,
      height,
      0,
      0,
      Math.PI * 2
    );

    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fill();
  }

  //影（かどまる四角）つけ係
  function drawRectShadow(ctx, x, y, width, height, radius = 8) {
    ctx.beginPath();

    ctx.roundRect(
      x - width / 2,
      y - height / 2,
      width,
      height,
      radius
    );

    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fill();
  }

  //ひよこを1羽描く係
  function drawNPC(ctx, npc) {
    const master = npcMaster[npc.type];
    if (!master) {
      return;
    }

    const image = imagesRef.current[master.imageKey];
    if (!image) {
      return;
    }

    const row = master.directionRows[npc.direction];
    const sx = npc.frame * master.frameWidth;
    const sy = row * master.frameHeight;

    ctx.drawImage(
      image,

      sx,
      sy,
      master.frameWidth,
      master.frameHeight,

      npc.position.x - master.drawWidth / 2,
      npc.position.y - master.drawHeight,

      master.drawWidth,
      master.drawHeight
    );
  }

  //全てのひよこたちを描く係
  function drawNPCs(ctx) {
    for (const npc of npcsRef.current) {
      drawNPC(ctx, npc);
    }
  }
  //のりもの描画係
  function drawVehicle(ctx, vehicle) {
    const master = vehicleMaster[vehicle.type];

    const imageName = master.skins[vehicle.skin]; //何色？
    const image = imagesRef.current[imageName];

    const frameWidth = master.width;
    const frameHeight = master.height;

    const sx = vehicle.frame * frameWidth;       //アニメーション用の場所指定してるよ。
    const sy = vehicle.direction * frameHeight;  //どこ向いてるかな？？によって切り取る場所を変えるよ。

    const drawWidth = frameWidth * vehicle.transform.scaleX;
    const drawHeight = frameHeight * vehicle.transform.scaleY;

    ctx.drawImage(
      image,

      sx,
      sy,
      frameWidth,
      frameHeight,

      vehicle.position.x - drawWidth / 2,
      vehicle.position.y - drawHeight / 2,
      drawWidth,
      drawHeight,
    );
  }

  //インク池描画係
  function drawColorPuddle(ctx, puddle) {
    const image = imagesRef.current[puddle.imageName];

    const size = puddle.radius * 2;

    ctx.drawImage(
      image,
      puddle.x - size / 2,
      puddle.y - size / 2,
      size,
      size,
    );
  }

  //踏切描画係
  function drawCrossing(ctx) {
    const image = imagesRef.current.crossing01;
    const crossing = railwayRef.current.crossing;

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

  //電車描画係
  function drawTrain(ctx) {
    const train = railwayRef.current.train;
    const image = imagesRef.current.train01;

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

  //タップエフェクト描画係
  function drawTapEffects(ctx, now) {
    for (const effect of tapEffectsRef.current) {
      if (effect.type !== "sparkle") {
        continue;
      }

      const image =
        imagesRef.current.tEffect01;
      if (!image) {
        continue;
      }

      const elapsed =
        now - effect.startTime;
      const progress = Math.min(
        elapsed / effect.duration,
        1
      );

      const scale =
        Math.sin(progress * Math.PI);
      const size =
        effect.maxSize * scale;

      ctx.drawImage(
        image,

        effect.x - size / 2,
        effect.y - size / 2,

        size,
        size
      );
    }
  }

  //電車の乗客描画係
  function drawTrainPassengers(ctx, now) {
    const train = railwayRef.current.train;
    if (!train.isRunning) {
      return;
    }

    const trainLeft =
      train.x - Railway.TRAIN_WIDTH / 2;

    const trainTop =
      train.y - Railway.TRAIN_HEIGHT / 2;

    for (
      const passenger of trainPassengersRef.current
    ) {
      //種類
      const variant =
        TrainPassenger.variants[passenger.variant];
      if (!variant) {
        continue;
      }

      //画像名
      const image =
        imagesRef.current[variant.imageKey];
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

  //メニュー描画係
  function drawVehicleMenu(ctx, now) {
    const menu = vehicleMenuRef.current;
    const menuBackground = imagesRef.current.menuBackground01;

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

    const menuVehicles = getVehicleMenuVehicles();

    for (const vehicle of menuVehicles) {
      drawMenuVehicle(ctx, vehicle, now);
    }
  }

  //メニュー付箋描画係
  function drawVehicleMenuTab(ctx) {
    const menu = vehicleMenuRef.current;
    const menuTag = imagesRef.current.menuTag01;

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

  //メニューの車描画係
  function drawMenuVehicle(ctx, menuVehicle, now) {
    const master = vehicleMaster[menuVehicle.type];

    const imageKey =
      master.skins[menuVehicle.skin];

    const image = imagesRef.current[imageKey];

    if (!image) {
      return;
    }

    const frameWidth = master.width;
    const frameHeight = master.height;

    //メニューのおくるまは今操作中のおくるまですか？
    const isSelected = menuVehicle.type === vehiclesRef.current[0].type;
    if (isSelected) {
      drawMenuSelectAnimation(ctx, menuVehicle, now); //選ばれてたら☆つけて
    }

    const frame = isSelected
      ? Math.floor(now / 120) % 2   //もし選択中なら120ﾐﾘ秒ごとに切り替えて！
      : 0;

    const direction = Direction.RIGHT;

    const sx = frame * frameWidth;
    const sy = direction * frameHeight;


    //選択したときのぽよん計算
    let popScale = 1;

    const effect = vehicleSelectEffectRef.current;

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

  //メニューの☆描画係
  function drawMenuSelectAnimation(ctx, menuVehicle, now) {
    const image = imagesRef.current.selectAnimation01;

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

  //描画担当本部
  function draw(ctx, now) {
    const background = imagesRef.current.background;

    //一回画面をきれいにする。
    ctx.clearRect(0, 0, 1920, 1080);

    //背景描いてる部署
    ctx.drawImage(background, 0, 0);

    //インク池描画係
    for (const puddle of colorPuddlesRef.current) {
      drawColorPuddle(ctx, puddle);
    }

    //NPC描画係
    drawNPCs(ctx);

    //動かすのりもの描画係
    const vehicle = vehiclesRef.current[0];
    const master = vehicleMaster[vehicle.type];
    const shadow = master.shadow;
    drawShadow(
      ctx,
      vehicle.position.x,
      vehicle.position.y + shadow.offsetY,
      shadow.width,
      shadow.height
    );
    drawVehicle(ctx, vehicle);

    //電車描画係
    drawTrain(ctx);
    //電車の乗客描画係
    drawTrainPassengers(ctx, now);
    //踏切描画係
    drawCrossing(ctx);
    //タップエフェクト描画係
    drawTapEffects(ctx, now);
    //メニュー描画係
    drawVehicleMenu(ctx, now);
    drawVehicleMenuTab(ctx);
  }

  async function handleClick(event) {

    //AudioContext起きて！
    try {
      await soundManagerRef.current.resume();
    } catch (error) {
      console.error("音声の準備に失敗しました", error);
    }

    //座標チェック
    const x = event.nativeEvent.offsetX / scale;
    const y = event.nativeEvent.offsetY / scale;

    const now = performance.now();

    //走っている電車を触ったかな？
    const train = railwayRef.current.train;
    if (train.isRunning) {
      const trainRect = getTrainRect();
      if (isPointInsideRect(x, y, trainRect)) {

        const carIndex = getTappedTrainCarIndex(x); //車両チェック
        //乗客いるかどうかチェック
        const {
          isNewPassenger,
          passenger,
        } = createTrainPassenger(carIndex, now);

        if (isNewPassenger) {
          soundManagerRef.current.play("trainHorn01");
        } else {
          soundManagerRef.current.play("passengerAppear01");
        }

        createTapSparkles(x, y, now);  //きらきら～
        createTrainPassenger(carIndex, now);  //乗客表示
        return;

      }
    }

    const crossingRect = getCrossingRect();

    if (isPointInsideRect(x, y, crossingRect)) {
      startTrain(performance.now());
      return;
    }

    const tabRect = getVehicleMenuTabRect();  //付箋おさわりチェック

    if (isPointInsideRect(x, y, tabRect)) {   //触ってたらメニューをだして！車は動かさないよ。
      soundManagerRef.current.play("menuOpen01");      //メニュー音
      toggleVehicleMenu(performance.now());


      return;
    }

    const menu = vehicleMenuRef.current;

    const menuIsVisible =
      menu.isOpen || menu.progress > 0; //メニュー見えてるかな？

    if (menuIsVisible) {
      const menuVehicles = getVehicleMenuVehicles();

      for (const menuVehicle of menuVehicles) {
        const master = vehicleMaster[menuVehicle.type];

        //おくるま選択用当たり判定をご用意。
        const vehicleRect = {
          x: menuVehicle.x - master.width / 2,
          y: menuVehicle.y - master.height / 2,
          width: master.width,
          height: master.height,
        };

        if (isPointInsideRect(x, y, vehicleRect)) {
          soundManagerRef.current.play("select01");     //ぷにっ
          changeVehicleType(menuVehicle.type);

          return;
          //車を触っていたら車を切り替えて離脱！
        }
      }

      return; //メニューが見えてたら車を動かす前に離脱！

    }

    setVehicles((prevVehicles) => {
      const newVehicles = [...prevVehicles]; //newVehicle君に今の値をこぴ
      const vehicle = { ...newVehicles[0] };  //vehicle君（計算係）にそのセットの中のバスのやつ渡してあげて。

      vehicle.target = { x, y };
      //バスを移動状態にするよ！
      vehicle.state = State.MOVE;
      //ぽよん準備
      startEffect(vehicle, "start");

      newVehicles[0] = vehicle; //newVehicles君に計算した値を渡してあげて。
      return newVehicles;   //計算し終わった新しいやつ持ってって。
    });

    //音鳴らしちゃうよ。
    const vehicle = vehicles[0];
    const master = vehicleMaster[vehicle.type];
    soundManagerRef.current.play(master.actionSound);
  }

  //方向更新係
  function updateDirection(vehicle, dx, dy) {

    if (dx === 0 && dy === 0) {
      return;
    }

    if (Math.abs(dx) > Math.abs(dy)) {
      vehicle.direction =
        dx >= 0 
        ? Direction.RIGHT
        : Direction.LEFT;
    } else {
      vehicle.direction =
        dy >= 0 
        ? Direction.FRONT
        : Direction.BACK;
    }
  }

  //車種変更係
  function changeVehicleType(newType) {
    vehicleSelectEffectRef.current = {
      type: newType,
      startTime: performance.now(),
    };


    setVehicles((prevVehicles) => {
      const newVehicles = [...prevVehicles];

      const vehicle = {
        ...newVehicles[0],
        position: { ...newVehicles[0].position },
        target: { ...newVehicles[0].target },
        transform: { ...newVehicles[0].transform },
        effect: { ...newVehicles[0].effect },
      };

      const master = vehicleMaster[newType];

      vehicle.type = newType;
      vehicle.skin = master.defaultSkin;

      vehicle.position = {
        x: 960, y: 540,
      };

      vehicle.target = {
        x: 960, y: 540,
      };

      vehicle.state = State.STOP;
      vehicle.frame = Frame.IDLE;
      vehicle.effect.type = null;
      vehicle.transform.scaleX = 1;
      vehicle.transform.scaleY = 1;

      newVehicles[0] = vehicle;
      return newVehicles;
    });
  }

  //色変更係
  function changeVehicleSkin(newSkin) {
    setVehicles((prevVehicles) => {
      const newVehicles = [...prevVehicles];

      const vehicle = {
        ...newVehicles[0],
        position: { ...newVehicles[0].position },
        target: { ...newVehicles[0].target },
        transform: { ...newVehicles[0].transform },
        effect: { ...newVehicles[0].effect },
      };

      vehicle.skin = newSkin;
      newVehicles[0] = vehicle;
      return newVehicles;
    });
  }


  //メニュー付箋位置情報システム
  function getVehicleMenuTabRect() {
    const menu = vehicleMenuRef.current;

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

  //メニュー付箋・電車おさわりチェック
  function isPointInsideRect(x, y, rect) {
    return (
      x >= rect.x &&
      x <= rect.x + rect.width &&
      y >= rect.y &&
      y <= rect.y + rect.height
    );
  }

  //踏切おさわり判定
  function getCrossingRect() {
    return {
      x: Railway.CROSSING_X - Railway.CROSSING_WIDTH / 2,
      y: Railway.CROSSING_Y - Railway.CROSSING_HEIGHT / 2,
      width: Railway.CROSSING_WIDTH,
      height: Railway.CROSSING_HEIGHT,
    };
  }

  //電車おさわり判定
  function getTrainRect() {
    const train = railwayRef.current.train;

    return {
      x: train.x - Railway.TRAIN_WIDTH / 2,
      y: train.y - Railway.TRAIN_HEIGHT / 2,
      width: Railway.TRAIN_WIDTH,
      height: Railway.TRAIN_HEIGHT,
    };
  }

  //何両目か判定
  function getTappedTrainCarIndex(tapX) {
    const train = railwayRef.current.train;

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

  //電車出発準備係
  function startTrain(now) {
    const train = railwayRef.current.train;
    const crossing = railwayRef.current.crossing;

    //今走ってる？？連打禁止！
    if (train.isRunning || train.isWaiting) {
      return;
    }
    //乗客リセット
    trainPassengersRef.current = [];

    //左右指示係
    train.direction = Math.random() < 0.5 ? 1 : -1;

    train.isWaiting = true;
    train.startTime = now;

    //踏切アニメーション開始
    crossing.isRinging = true;
    crossing.frame = 1;
    crossing.lastFrameTime = now;

    //踏切音
    soundManagerRef.current.play("crossing");
  }

  //タップ位置にキラキラを作る係
  function createTapSparkles(x, y, now) {
    const sparkleCount =
      Math.random() < 0.5 ? 3 : 4;

    for (let i = 0; i < sparkleCount; i++) {
      const angle =
        Math.random() * Math.PI * 2;

      const distance = getRandomNumber(
        TapEffect.MIN_DISTANCE,
        TapEffect.MAX_DISTANCE
      );

      const sparkleX =
        x + Math.cos(angle) * distance;

      const sparkleY =
        y + Math.sin(angle) * distance;

      tapEffectsRef.current.push({
        type: "sparkle",
        variant: "yellow",

        x: sparkleX,
        y: sparkleY,

        startTime: now,
        duration: TapEffect.DURATION,

        maxSize: getRandomNumber(
          TapEffect.MIN_SIZE,
          TapEffect.MAX_SIZE
        ),
      });
    }
  }

  //誰が乗ってるか決める係
  function getRandomTrainPassengerVariant() {
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

  //電車に乗客を出す係
  function createTrainPassenger(carIndex, now) {
    const passengers = trainPassengersRef.current;

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

  //乗客アニメフレームNo.決定係
  function getTrainPassengerFrame(passenger, now) {
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

  //タップエフェクト更新係
  function updateTapEffects(now) {
    tapEffectsRef.current =
      tapEffectsRef.current.filter((effect) => {
        const elapsed =
          now - effect.startTime;

        return elapsed < effect.duration;
      });
  }

  //ひよこの次の行き先を決める係
  function chooseNextNPCTarget(npc) {
    const master = npcMaster[npc.type];

    npc.target.x = getRandomNumber(
      NPCWalkArea.LEFT,
      NPCWalkArea.RIGHT
    );

    npc.target.y = getRandomNumber(
      NPCWalkArea.TOP,
      NPCWalkArea.BOTTOM
    );

    npc.state = NPCState.WALK;
    npc.animationTimer = 0;
    npc.animationFrameIndex = 0;
    npc.frame = master.walkFrames[0];
  }

  //ひよこの向きを決める係
  function updateNPCDirection(npc, dx, dy) {
    if (Math.abs(dx) > Math.abs(dy)) {
      npc.direction =
        dx >= 0
          ? NPCDirection.RIGHT
          : NPCDirection.LEFT;
    } else {
      npc.direction =
        dy >= 0
          ? NPCDirection.FRONT
          : NPCDirection.BACK;
    }
  }

  //ひよこの歩き方指導係
  function updateNPCAnimation(npc, master, deltaTime) {
    npc.animationTimer += deltaTime * 1000;

    if (npc.animationTimer < master.animationInterval) {
      return;
    }

    npc.animationTimer -= master.animationInterval;

    const currentIndex =
      master.walkFrames.indexOf(npc.frame);

    npc.animationFrameIndex =
      (npc.animationFrameIndex + 1) %
      master.walkFrames.length;

    npc.frame =
      master.walkFrames[npc.animationFrameIndex];
  }

  //ひよこたちを動かす係
  function updateNPCs(now, deltaTime) {
    for (const npc of npcsRef.current) {
      const master = npcMaster[npc.type];

      if (!master) {
        continue;
      }

      if (npc.state === NPCState.IDLE) {
        npc.frame = 0;

        if (now >= npc.waitUntil) {
          chooseNextNPCTarget(npc);
        }
        continue;
      }

      const dx = npc.target.x - npc.position.x;
      const dy = npc.target.y - npc.position.y;

      const distance = Math.hypot(dx, dy);

      updateNPCDirection(npc, dx, dy);

      if (distance < 2) {
        npc.position.x = npc.target.x;
        npc.position.y = npc.target.y;

        npc.state = NPCState.IDLE;
        npc.frame = 0;

        npc.waitUntil = now +
          getRandomNumber(
            master.waitTime.min,
            master.waitTime.max
          );

        continue;
      }

      const moveDistance = master.speed * deltaTime;

      if (moveDistance >= distance) {
        npc.position.x = npc.target.x;
        npc.position.y = npc.target.y;
      } else {
        npc.position.x += (dx / distance) * moveDistance;
        npc.position.y += (dy / distance) * moveDistance;
      }

      updateNPCAnimation(
        npc,
        master,
        deltaTime
      );
    }
  }

  //メニュー開け閉めチェック係
  function toggleVehicleMenu(now) {
    const menu = vehicleMenuRef.current;

    menu.startTime = now;
    menu.startProgress = menu.progress;
    menu.targetProgress = menu.isOpen ? 0 : 1;
    menu.isOpen = !menu.isOpen;
  }

  function getVehicleMenuVehicles() {
    const menu = vehicleMenuRef.current;

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

  //走行アニメーション係
  function updateAnimation(vehicle, animationTimerRef, deltaTime) {

    if (vehicle.state === State.STOP) {
      vehicle.frame = Frame.IDLE;
      return;
    }

    //アニメーションタイマーだよ。120msごとにアニメーションフレームを変えてね。
    animationTimerRef.current += deltaTime * 1000;

    if (animationTimerRef.current >= 120) {

      vehicle.frame =
        vehicle.frame === Frame.IDLE
          ? Frame.MOVE
          : Frame.IDLE;

      animationTimerRef.current -= 120;
    }
  }

  //のりものの位置情報更新係
  function updatePosition(vehicle, master, dx, dy, distance, deltaTime) {

    if (vehicle.state === State.STOP) return;

    const vx = dx / distance;
    const vy = dy / distance;
    const moveDistance = master.speed * deltaTime;

    //目的地に着いたらこれ
    if (distance <= moveDistance) {

      vehicle.state = State.STOP;  //バスの状態は止まってるよ。
      vehicle.frame = Frame.IDLE;  //バスのアニメーションは待機モード

      vehicle.position = {
        x: vehicle.target.x,
        y: vehicle.target.y,
      };

      startEffect(vehicle, "stop"); //停止のぽよん

      return;
    }

    vehicle.position = {
      x: vehicle.position.x + vx * moveDistance,
      y: vehicle.position.y + vy * moveDistance,
    };
  }

  //踏切係
  function updateCrossing(now) {
    const crossing = railwayRef.current.crossing;

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

  //電車移動係
  function updateTrain(now, deltaTime) {
    const train = railwayRef.current.train;
    const crossing = railwayRef.current.crossing;

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

        soundManagerRef.current.play("train01");
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
      trainPassengersRef.current = [];
      //踏切おしまい
      crossing.isRinging = false;
      crossing.frame = 0;
    }
  }


  //ぽよん開始合図係
  function startEffect(vehicle, type) {
    vehicle.effect = {
      type,
      startTime: performance.now(),
      duration: Effect.DURATION,
    };

    //開始直後は通常サイズ
    vehicle.transform.scaleX = 1;
    vehicle.transform.scaleY = 1;
  }

  //ぽよん係
  function updateEffect(vehicle, now) {

    const effect = vehicle.effect;

    //ぽよん中ですか？
    if (effect.type === null) return;

    const elapsed = now - effect.startTime;       //経過時間（ミリ秒）
    const t = Math.min(elapsed / effect.duration, 1);   //ぽよん進捗
    const amount = 4 * t * (1 - t);     //放物線0～1

    if (effect.type === "start") {
      vehicle.transform.scaleX = 1 + amount * Effect.AMOUNT;
      vehicle.transform.scaleY = 1 - amount * Effect.AMOUNT;
    }
    if (effect.type === "stop") {
      vehicle.transform.scaleX = 1 - amount * Effect.AMOUNT;
      vehicle.transform.scaleY = 1 + amount * Effect.AMOUNT;
    }

    //ぽよん終了
    if (t >= 1) {
      vehicle.transform.scaleX = 1;
      vehicle.transform.scaleY = 1;
      effect.type = null;
    }

    return;

  }

  //インク池警察
  function updateColoPuddleCollision(vehicle) {
    const master = vehicleMaster[vehicle.type];

    if (!master.canChangeColor) return;  //色変可能なくるまかどうかチェック！

    for (const puddle of colorPuddlesRef.current) {
      const dx = vehicle.position.x - puddle.x;
      const dy = vehicle.position.y - puddle.y;

      const distance = Math.hypot(dx, dy);  //インク池と車の距離

      if (distance < puddle.radius) { //インク池に触ったかな？
        vehicle.skin = puddle.skin;
      }
    }
  }

  //メニュー開け閉め係
  function updateVehicleMenu(now) {
    const menu = vehicleMenuRef.current;

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

  //車移動部署
  function updateVehicle(now, deltaTime) {
    setVehicles((prevVehicles) => {
      const newVehicles = [...prevVehicles];

      const vehicle = {
        ...newVehicles[0],
        position: { ...newVehicles[0].position },
        target: { ...newVehicles[0].target },
        transform: { ...newVehicles[0].transform },
        effect: { ...newVehicles[0].effect },
      };

      const master = vehicleMaster[vehicle.type];

      const dx = vehicle.target.x - vehicle.position.x;
      const dy = vehicle.target.y - vehicle.position.y;
      const distance = Math.hypot(dx, dy);

      updateDirection(vehicle, dx, dy);
      updateAnimation(vehicle, animationTimerRef, deltaTime);
      updatePosition(vehicle, master, dx, dy, distance, deltaTime);
      updateColoPuddleCollision(vehicle);
      updateEffect(vehicle, now);

      newVehicles[0] = vehicle;
      return newVehicles;
    });
  }

  //現場監督
  function update(now, deltaTime) {
    updateVehicle(now, deltaTime);
    updateNPCs(now, deltaTime);
    updateVehicleMenu(now);
    updateCrossing(now);
    updateTrain(now, deltaTime);
    updateTapEffects(now);

    const ctx = ctxRef.current;

    if (ctx) {
      draw(ctx, now);
    }
  }

  //ここはcanvas君。画面に背景とかバスとか描くところ。
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctxRef.current = ctx;

    //画像はここから。
    const background = new Image();

    const bus01 = new Image();
    const bus02 = new Image();
    const bus03 = new Image();
    const bus04 = new Image();
    const bus05 = new Image();
    const bus06 = new Image();
    const bus07 = new Image();
    const bus08 = new Image();

    const ambulance01 = new Image();

    const train01 = new Image();
    const crossing01 = new Image();
    const tEffect01 = new Image();
    const tHiyoko = new Image();
    const tCat01 = new Image();
    const tCat02 = new Image();
    const tCat03 = new Image();

    const puddle01 = new Image();
    const puddle02 = new Image();
    const puddle03 = new Image();
    const puddle04 = new Image();
    const puddle05 = new Image();
    const puddle06 = new Image();
    const puddle07 = new Image();
    const puddle08 = new Image();

    const npcHiyoko01 = new Image();

    const menuBackground01 = new Image();
    const menuTag01 = new Image();
    const selectAnimation01 = new Image();

    imagesRef.current.background = background;
    imagesRef.current.bus01 = bus01;
    imagesRef.current.bus02 = bus02;
    imagesRef.current.bus03 = bus03;
    imagesRef.current.bus04 = bus04;
    imagesRef.current.bus05 = bus05;
    imagesRef.current.bus06 = bus06;
    imagesRef.current.bus07 = bus07;
    imagesRef.current.bus08 = bus08;
    imagesRef.current.puddle01 = puddle01;
    imagesRef.current.puddle02 = puddle02;
    imagesRef.current.puddle03 = puddle03;
    imagesRef.current.puddle04 = puddle04;
    imagesRef.current.puddle05 = puddle05;
    imagesRef.current.puddle06 = puddle06;
    imagesRef.current.puddle07 = puddle07;
    imagesRef.current.puddle08 = puddle08;
    imagesRef.current.ambulance01 = ambulance01;
    imagesRef.current.menuBackground01 = menuBackground01;
    imagesRef.current.menuTag01 = menuTag01;
    imagesRef.current.selectAnimation01 = selectAnimation01;
    imagesRef.current.train01 = train01;
    imagesRef.current.crossing01 = crossing01;
    imagesRef.current.tEffect01 = tEffect01;
    imagesRef.current.tHiyoko = tHiyoko;
    imagesRef.current.tCat01 = tCat01;
    imagesRef.current.tCat02 = tCat02;
    imagesRef.current.tCat03 = tCat03;
    imagesRef.current.npcHiyoko01 = npcHiyoko01;

    //画像の場所はここ。
    background.src = `${import.meta.env.BASE_URL}images/background01.png`;
    bus01.src = `${import.meta.env.BASE_URL}images/bus01.png`;
    bus02.src = `${import.meta.env.BASE_URL}images/bus02.png`;
    bus03.src = `${import.meta.env.BASE_URL}images/bus03.png`;
    bus04.src = `${import.meta.env.BASE_URL}images/bus04.png`;
    bus05.src = `${import.meta.env.BASE_URL}images/bus05.png`;
    bus06.src = `${import.meta.env.BASE_URL}images/bus06.png`;
    bus07.src = `${import.meta.env.BASE_URL}images/bus07.png`;
    bus08.src = `${import.meta.env.BASE_URL}images/bus08.png`;
    puddle01.src = `${import.meta.env.BASE_URL}images/puddle01.png`;
    puddle02.src = `${import.meta.env.BASE_URL}images/puddle02.png`;
    puddle03.src = `${import.meta.env.BASE_URL}images/puddle03.png`;
    puddle04.src = `${import.meta.env.BASE_URL}images/puddle04.png`;
    puddle05.src = `${import.meta.env.BASE_URL}images/puddle05.png`;
    puddle06.src = `${import.meta.env.BASE_URL}images/puddle06.png`;
    puddle07.src = `${import.meta.env.BASE_URL}images/puddle07.png`;
    puddle08.src = `${import.meta.env.BASE_URL}images/puddle08.png`;
    ambulance01.src = `${import.meta.env.BASE_URL}images/ambulance01.png`;
    menuBackground01.src = `${import.meta.env.BASE_URL}images/menuBackground01.png`;
    menuTag01.src = `${import.meta.env.BASE_URL}images/menuTag01.png`;
    selectAnimation01.src = `${import.meta.env.BASE_URL}images/selectAnimation01.png`;
    train01.src = `${import.meta.env.BASE_URL}images/train01.png`;
    crossing01.src = `${import.meta.env.BASE_URL}images/crossing01.png`;
    tEffect01.src = `${import.meta.env.BASE_URL}images/tEffect01.png`;
    tHiyoko.src = `${import.meta.env.BASE_URL}images/tHiyoko.png`;
    tCat01.src = `${import.meta.env.BASE_URL}images/tCat01.png`;
    tCat02.src = `${import.meta.env.BASE_URL}images/tCat02.png`;
    tCat03.src = `${import.meta.env.BASE_URL}images/tCat03.png`;
    npcHiyoko01.src = `${import.meta.env.BASE_URL}images/npc_hiyoko01.png`;

    let loaded = 0;

    //読み込み進捗君。全部揃ったら描いてくれる。
    function imageLoaded() {
      loaded++;

      if (loaded === 29) {
        draw(ctx, performance.now());
      }
    }

    //読み込みが終わったらこれ。
    background.onload = imageLoaded;
    bus01.onload = imageLoaded;
    bus02.onload = imageLoaded;
    bus03.onload = imageLoaded;
    bus04.onload = imageLoaded;
    bus05.onload = imageLoaded;
    bus06.onload = imageLoaded;
    bus07.onload = imageLoaded;
    bus08.onload = imageLoaded;
    puddle01.onload = imageLoaded;
    puddle02.onload = imageLoaded;
    puddle03.onload = imageLoaded;
    puddle04.onload = imageLoaded;
    puddle05.onload = imageLoaded;
    puddle06.onload = imageLoaded;
    puddle07.onload = imageLoaded;
    puddle08.onload = imageLoaded;
    ambulance01.onload = imageLoaded;
    menuBackground01.onload = imageLoaded;
    menuTag01.onload = imageLoaded;
    selectAnimation01.onload = imageLoaded;
    train01.onload = imageLoaded;
    crossing01.onload = imageLoaded;
    tEffect01.onload = imageLoaded;
    tHiyoko.onload = imageLoaded;
    tCat01.onload = imageLoaded;
    tCat02.onload = imageLoaded;
    tCat03.onload = imageLoaded;
    npcHiyoko01.onload = imageLoaded;

  }, []);

  useEffect(() => {
    if (!ctxRef.current) return;

    draw(ctxRef.current, performance.now());

  }, [vehicles]);

  useEffect(() => {
    let animationFrameId;
    let previousTime = null;
    let isRunning = true;

    function gameLoop(now) {
      if (!isRunning) {
        return;
      }

      //FPSチェック
      const fpsData = fpsDataRef.current;
      fpsData.frames++;
      if (fpsData.previousFrameTime !== null) {
        const frameGap = now - fpsData.previousFrameTime;

        if (frameGap > fpsData.maxFrameGap) {
          fpsData.maxFrameGap = frameGap;
        }

        // 60fpsなら約16.7msごとに呼ばれる
        const missedFrames =
          Math.max(0, Math.round(frameGap / 16.67) - 1);

        fpsData.droppedFrames += missedFrames;
      }
      fpsData.previousFrameTime = now;

      const deltaTime =
        previousTime === null
          ? 0
          : (now - previousTime) / 1000;
      previousTime = now;

      update(now, deltaTime);

      if (now - fpsData.lastReportTime >= 1000) {
        if (fpsDisplayRef.current) {
          fpsDisplayRef.current.textContent =
            `FPS: ${fpsData.frames}` +
            ` / 最大間隔: ${fpsData.maxFrameGap.toFixed(1)}ms` +
            ` / 落ち: ${fpsData.droppedFrames}`;
        }

        fpsData.frames = 0;
        fpsData.maxFrameGap = 0;
        fpsData.droppedFrames = 0;
        fpsData.lastReportTime = now;
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    }

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  //音読み込み部署
  useEffect(() => {
    const soundManager = soundManagerRef.current;

    Promise.all([
      soundManager.load(
        "select01",
        `${import.meta.env.BASE_URL}sounds/select01.mp3`
      ),

      soundManager.load(
        "menuOpen01",
        `${import.meta.env.BASE_URL}sounds/menuOpen01.mp3`
      ),

      soundManager.load(
        "busHorn",
        `${import.meta.env.BASE_URL}sounds/busHorn.mp3`
      ),

      soundManager.load(
        "ambulanceSiren",
        `${import.meta.env.BASE_URL}sounds/ambulanceSiren.mp3`
      ),

      soundManager.load(
        "train01",
        `${import.meta.env.BASE_URL}sounds/train01.mp3`
      ),

      soundManager.load(
        "crossing",
        `${import.meta.env.BASE_URL}sounds/crossing.mp3`
      ),

      soundManager.load(
        "trainHorn01",
        `${import.meta.env.BASE_URL}sounds/trainHorn01.mp3`
      ),

      soundManager.load(
        "passengerAppear01",
        `${import.meta.env.BASE_URL}sounds/passengerAppear01.mp3`
      ),

    ])
      .then(() => {
        console.log("効果音の読み込み完了");
      })
      .catch((error) => {
        console.error("効果音の読み込みに失敗しました", error);
      });
  }, []);


  //今まで計算したやつ、ここで出てくるよ～。
  return (
    <div className="viewport">

      <div className="gameArea">

        <canvas
          className="gameCanvas"
          ref={canvasRef}
          width={1920}
          height={1080}
          style={{
            width: `${1920 * scale}px`,
            height: `${1080 * scale}px`
          }}
          onClick={handleClick}
        />

        <div
          ref={fpsDisplayRef}
          className="fps"
        >
          FPS: --
        </div>

        <div className="version">
          Ver {VERSION}
        </div>
      </div>

      <div className="copyright">
        効果音素材：OtoLogic様、Notzan ACT様、フリー効果音素材 くらげ工匠様
      </div>

    </div>
  );

}

export default GameView;