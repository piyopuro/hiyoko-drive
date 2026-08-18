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

const NPCAction = {
  JUMP_DURATION: 500,
  LANDING_DURATION: 230,
  JUMP_HEIGHT: 85,
};



const NPCBehaviorType = {
  WANDER: "wander",
  FLEE: "flee",
  BOARD_BUS: "boardBus",
  RIDE_BUS: "rideBus",
  EXIT_BUS: "exitBus",
};

const NPCFleeConfig = {
  AVOID_DISTANCE: 170,       //この距離までバスが来たら逃げる
  FLEE_DISTANCE: 220,        //どれくらい先まで逃げるか
  FLEE_SPEED_MULTIPLIER: 2.5, //普段の何倍で走るか
};

const NPCWalkArea = {
  LEFT: 100,
  RIGHT: 1820,
  TOP: 120,
  BOTTOM: 800,
};

const BusPassenger = {
  BOARD_DISTANCE: 170,
  BOARD_ARRIVAL_DISTANCE: 4,

  EXIT_DELAY: 400,
  REBOARD_COOLDOWN: 3000,

  //バスの出入口
  doorOffsets: {
    [Direction.RIGHT]: { x: 90, y: 28 },
    [Direction.LEFT]: { x: -90, y: 68 },
    [Direction.FRONT]: { x: 45, y: 45 },
    [Direction.BACK]: { x: -45, y: 45 },
  },

  // バスに乗っている間の位置
  ridingOffsets: {
    [Direction.RIGHT]: { x: -32, y: 24 },
    [Direction.LEFT]: { x: 33, y: 24 },

    // 前後は隠れるので仮位置
    [Direction.FRONT]: { x: 10, y: 10 },
    [Direction.BACK]: { x: 10, y: 10 },
  },
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


//========車アクション用情報========

const FireFightHiyokoAction = {
  JUMP_DURATION: 500,
  LANDING_DURATION: 230,
  JUMP_HEIGHT: 60,

  WALK_DURATION: 800,

  WALK_DISTANCE_HORIZONTAL: 180,
  WALK_DISTANCE_VERTICAL: 30,

  RETURN_WALK_DURATION: 800,
};

const FireFightWaterAction = {
  FRAME_INTERVAL: 100,
  LOOP_DURATION: 1000,

  introFrames: [0, 1],
  loopFrames: [2, 3],
  outroFrames: [4, 5, 6],
};

const PoliceCarAction = {
  FRAME_INTERVAL: 120,
  LOOP_COUNT: 3,

  frames: [2, 3, 4, 3],
};


//========シャボン玉たちの情報========

const BubbleGame = {
  IMAGE_SIZE: 350,
  HIT_SIZE: 240,

  MAP_BUBBLE_SIZE: 160,  //マップにおちてるシャボン玉

  COUNT: 6,

  MIN_SIZE: 160,
  MAX_SIZE: 380,

  MIN_SPEED: 35,
  MAX_SPEED: 70,

  MIN_SWAY: 20,
  MAX_SWAY: 55,

  MIN_SWAY_SPEED: 0.001,
  MAX_SWAY_SPEED: 0.0025,

  MIN_DRIFT: -15,
  MAX_DRIFT: 15,

  GROW_DURATION: 90,

  POP_FRAME_INTERVAL: 60,
  POP_FRAME_COUNT: 3,

  RESPAWN_DELAY: 3000,
};


//=========インク池の情報たち========

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

//ここからここまで
function clamp(value, min, max) {
  return Math.max(
    min,
    Math.min(value, max)
  );
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

    behavior: {
      type: NPCBehaviorType.WANDER,
      vehicleId: null,

      isWaitingForArrival: false,
      rideCount: 0,
      rideTargetCount: 0,

      exitAt: 0,
      canBoardAfter: 0,
    },

    frame: 0,
    animationFrameIndex: 0,
    animationTimer: 0,

    action: {
      type: null,
      startTime: 0,
      duration: 0,
    },

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


  //シャボン玉管理人
  const bubbleGameRef = useRef({
    mapBubble: null,
    bubbles: [],
    respawnTime: null,
  });


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
      createNPC("hiyoko", 500, 540),
    ].filter(Boolean);
  }

  const imagesRef = useRef({});

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

  //=========シャボン玉=========

  //しゃぼんだまを置く係

  function createMapBubble() {
    bubbleGameRef.current.mapBubble = {
      x: getRandomNumber(150, 1770),
      y: getRandomNumber(150, 800),
    };

    bubbleGameRef.current.respawnTime = null;
  }

  //ちちゃいシャボン玉を描く係
  function drawMapBubble(ctx) {
    const bubble = bubbleGameRef.current.mapBubble;

    if (!bubble) {
      return;
    }

    const image = imagesRef.current.bubble;

    const size = BubbleGame.MAP_BUBBLE_SIZE;

    ctx.drawImage(
      image,
      bubble.x - size / 2,
      bubble.y - size / 2,
      size,
      size
    );
  }

  //ひよこを1羽描く係
  function drawNPC(ctx, npc, now) {
    const master = npcMaster[npc.type];
    if (!master) {
      return;
    }

    const isInsideBus =
      npc.behavior.type === NPCBehaviorType.RIDE_BUS ||
      npc.behavior.type === NPCBehaviorType.EXIT_BUS;

    if (!isInsideBus) {
      drawShadow(
        ctx,
        npc.position.x,
        npc.position.y,
        master.shadow.width,
        master.shadow.height
      );
    }

    const image = imagesRef.current[master.imageKey];
    if (!image) {
      return;
    }

    const row = master.directionRows[npc.direction];
    const sx = npc.frame * master.frameWidth;
    const sy = row * master.frameHeight;

    const jumpTransform = getNPCJumpTransform(npc, now);

    ctx.save();

    //NPCの足元へ移動
    ctx.translate(
      npc.position.x,
      npc.position.y +
      jumpTransform.offsetY
    );

    //足元を基準に縦方向へ変形
    ctx.scale(
      1,
      jumpTransform.scaleY
    );

    ctx.drawImage(
      image,

      sx,
      sy,
      master.frameWidth,
      master.frameHeight,

      -master.drawWidth / 2,
      -master.drawHeight,

      master.drawWidth,
      master.drawHeight
    );

    ctx.restore();
  }

  //全てのひよこたちを描く係
  function drawNPCs(ctx, now) {
    for (const npc of npcsRef.current) {
      drawNPC(ctx, npc, now);
    }
  }


  //消防ひよこ描画本部
  function drawFireFightHiyoko(ctx, vehicle, now) {
    const image = imagesRef.current.fireFightAction01;

    if (!image) {
      return;
    }

    const hiyoko = vehicle.actionState?.hiyoko;
    if (!hiyoko?.visible || hiyoko.jumpStartTime == null) {
      return;
    }

    const action =
      getFireFightHiyokoPosition(vehicle, now);

    if (!action) {
      return;
    }

    let x = action.x;
    let y = action.y;

    const {
      elapsed,
      jumpProgress,
      jumpFinished,
      walkElapsed,
      walkFinished,
      waterFinished,
      returnWalkElapsed,
      returnWalkProgress,
      returnWalkFinished,
    } = action;

    //========画像情報管理部=========

    const frameWidth = 128;
    const frameHeight = 64;

    const WALK_FRAMES = [0, 1, 0, 2];
    const WALK_FRAME_INTERVAL = 120;


    //=========ひよこ登場向き指示部========

    let hiyokoDirection;

    //初期向き
    switch (vehicle.direction) {
      case Direction.RIGHT:
      case Direction.LEFT:
        hiyokoDirection = Direction.FRONT;
        break;

      case Direction.FRONT:
        hiyokoDirection = Direction.RIGHT;
        break;

      case Direction.BACK:
        hiyokoDirection = Direction.LEFT;
        break;
    }

    //ジャンプ中
    if (jumpFinished) {
      switch (vehicle.direction) {
        case Direction.RIGHT:
          hiyokoDirection = Direction.LEFT;
          break;

        case Direction.LEFT:
          hiyokoDirection = Direction.RIGHT;
          break;

        case Direction.FRONT:
          hiyokoDirection = Direction.BACK;
          break;

        case Direction.BACK:
          hiyokoDirection = Direction.FRONT;
          break;
      }
    }

    //戻り中
    if (waterFinished) {
      switch (vehicle.direction) {
        case Direction.RIGHT:
          hiyokoDirection = Direction.RIGHT;
          break;

        case Direction.LEFT:
          hiyokoDirection = Direction.LEFT;
          break;

        case Direction.FRONT:
          hiyokoDirection = Direction.FRONT;
          break;

        case Direction.BACK:
          hiyokoDirection = Direction.BACK;
          break;
      }
    }

    //帰りのジャンプ中
    if (returnWalkFinished) {
      switch (vehicle.direction) {
        case Direction.RIGHT:
        case Direction.LEFT:
          hiyokoDirection = Direction.BACK;
          break;

        case Direction.FRONT:
          hiyokoDirection = Direction.LEFT;
          break;

        case Direction.BACK:
          hiyokoDirection = Direction.RIGHT;
          break;
      }
    }

    //========使う画像決定部========

    let frame = 0;

    //歩行アニメ
    let animationElapsed = walkElapsed;

    if (waterFinished) {
      animationElapsed = returnWalkElapsed;
    }

    if ((jumpFinished && !walkFinished) ||
      (waterFinished && returnWalkProgress < 1)) {

      const frameIndex =
        Math.floor(
          animationElapsed / WALK_FRAME_INTERVAL
        ) % WALK_FRAMES.length;

      frame = WALK_FRAMES[frameIndex];
    }

    let sx = frame * frameWidth;
    let sy = hiyokoDirection * frameHeight;


    //========ひよこにホースを持たせる部========
    //ホースのところに到着！
    if (walkFinished && !waterFinished) { //歩き終わった？放水はまだ？
      sx = 0;

      switch (vehicle.direction) {
        case Direction.LEFT:
        case Direction.FRONT:
          sy = 4 * frameHeight;
          break;

        case Direction.RIGHT:
        case Direction.BACK:
          sy = 5 * frameHeight;
          break;
      }
    }


    //========ひよこをつぶす部========

    let scaleY = 1;

    if (jumpProgress < 0.15) {

      const t = jumpProgress / 0.15;
      scaleY = 1 + (0.5 - 1) * t;

    } else if (jumpProgress < 0.35) {

      const t = (jumpProgress - 0.15) / (0.35 - 0.15);
      scaleY = 0.5 + (1.18 - 0.5) * t;

    } else if (jumpProgress < 0.5) {

      const t = (jumpProgress - 0.35) / (0.5 - 0.35);
      scaleY = 1.18 + (1 - 1.18) * t;

    }

    //着地後の潰れ
    if (elapsed >= FireFightHiyokoAction.JUMP_DURATION) {
      const landingElapsed =
        elapsed - FireFightHiyokoAction.JUMP_DURATION;

      const landingProgress =
        Math.min(
          landingElapsed / FireFightHiyokoAction.LANDING_DURATION,
          1
        );

      if (landingProgress < 0.35) {

        const t = landingProgress / 0.35;
        scaleY = 1 + (0.5 - 1) * t;

      } else {

        const t = (landingProgress - 0.35) / (1 - 0.35);
        scaleY = 0.5 + (1 - 0.5) * t;

      }
    }


    //========描画部========

    ctx.save();

    ctx.translate(    // まず「ひよこの足元」の位置へ移動
      x,
      y + frameHeight / 2
    );

    ctx.scale(1, scaleY);    // 足元を基準に縦方向だけ伸び縮み

    ctx.drawImage(
      image,
      sx,
      sy,
      frameWidth,
      frameHeight,

      -frameWidth / 2,
      -frameHeight,

      frameWidth,
      frameHeight
    );

    ctx.restore();
  }

  //消防ひよこ影つけ係
  function drawFireFightHiyokoShadow(ctx, vehicle, now) {

    const action =
      getFireFightHiyokoPosition(vehicle, now);

    if (!action) {
      return;
    }

    const {
      shadowX,
      shadowY,
      jumpProgress,
      returnWalkFinished,
      returnJumpProgress,
    } = action;



    let shadowScale = 1;

    if (jumpProgress < 1) {
      shadowScale =
        1 - Math.sin(jumpProgress * Math.PI) * 0.4;
    }

    if (
      returnWalkFinished &&
      returnJumpProgress < 1
    ) {
      shadowScale =
        1 - Math.sin(returnJumpProgress * Math.PI) * 0.4;
    }


    ctx.save();

    ctx.globalAlpha = 0.2;

    ctx.beginPath();

    ctx.ellipse(
      shadowX,
      shadowY + 28,
      24 * shadowScale,
      8 * shadowScale,
      0,
      0,
      Math.PI * 2
    );


    ctx.fillStyle = "black";
    ctx.fill();

    ctx.restore();
  }

  function getFireFightHiyokoPosition(vehicle, now) {

    const hiyoko = vehicle.actionState?.hiyoko;
    if (!hiyoko?.visible || hiyoko.jumpStartTime == null) {
      return;
    }


    //========時間計算部========
    const elapsed = now - hiyoko.jumpStartTime;

    //ジャンプ終わったか計算
    const jumpProgress = Math.min(
      elapsed / FireFightHiyokoAction.JUMP_DURATION,
      1
    );
    const jumpFinished =
      elapsed >=
      FireFightHiyokoAction.JUMP_DURATION +
      FireFightHiyokoAction.LANDING_DURATION;


    //歩き終わったか計算
    const walkElapsed =
      elapsed -
      FireFightHiyokoAction.JUMP_DURATION -
      FireFightHiyokoAction.LANDING_DURATION;

    const walkProgress = Math.min(
      Math.max(
        walkElapsed / FireFightHiyokoAction.WALK_DURATION,
        0
      ),
      1
    );

    const walkFinished = walkProgress >= 1;  //歩き終わった？


    //水撒きおわったか計算
    const waterDuration =
      FireFightWaterAction.introFrames.length *
      FireFightWaterAction.FRAME_INTERVAL +
      FireFightWaterAction.LOOP_DURATION +
      FireFightWaterAction.outroFrames.length *
      FireFightWaterAction.FRAME_INTERVAL;

    const waterFinishedTime =
      FireFightHiyokoAction.JUMP_DURATION +
      FireFightHiyokoAction.LANDING_DURATION +
      FireFightHiyokoAction.WALK_DURATION +
      waterDuration;

    const waterFinished =
      elapsed >= waterFinishedTime;


    //ひよこ帰る時間
    const returnWalkElapsed =
      elapsed - waterFinishedTime;

    const returnWalkProgress = Math.min(
      Math.max(
        returnWalkElapsed /
        FireFightHiyokoAction.RETURN_WALK_DURATION,
        0
      ),
      1
    );

    const returnWalkFinished =
      returnWalkProgress >= 1;


    //帰還ジャンプ時間
    const returnJumpElapsed =
      returnWalkElapsed -
      FireFightHiyokoAction.RETURN_WALK_DURATION;

    const returnJumpProgress = Math.min(
      Math.max(
        returnJumpElapsed / FireFightHiyokoAction.JUMP_DURATION,
        0
      ),
      1
    );


    //========ジャンプ座標管理部========
    //ジャンプ開始地点
    let startX = vehicle.position.x;
    let startY = vehicle.position.y;

    //着地点
    let landingX = vehicle.position.x;
    let landingY = vehicle.position.y;

    switch (vehicle.direction) {
      case Direction.RIGHT:
        landingX += 80;
        landingY += 40;

        startX += 80;
        startY += 20;
        break;

      case Direction.LEFT:
        landingX -= 80;
        landingY += 40;

        startX -= 80;
        startY += 20;
        break;

      case Direction.FRONT:
        landingX += 112;
        landingY += 40;

        startX += 80;
        startY += 10;
        break;

      case Direction.BACK:
        landingX -= 110;
        landingY += 0;

        startX -= 80;
        startY -= 30;
        break;
    }


    //=========現在位置=========
    //開始位置 → 着地点
    let x =
      startX +
      (landingX - startX) *
      jumpProgress;

    let y =
      startY +
      (landingY - startY) *
      jumpProgress;

    //ぴょん！の高さ
    if (jumpProgress < 1) {
      y -= Math.sin(jumpProgress * Math.PI) * FireFightHiyokoAction.JUMP_HEIGHT;
    }


    //=========着地後にひよこを歩かせる部========

    //着地した？
    if (jumpFinished) {
      switch (vehicle.direction) {
        case Direction.RIGHT:
          x -=
            FireFightHiyokoAction.WALK_DISTANCE_HORIZONTAL *
            walkProgress;
          break;

        case Direction.LEFT:
          x +=
            FireFightHiyokoAction.WALK_DISTANCE_HORIZONTAL *
            walkProgress;
          break;

        case Direction.FRONT:
          y -=
            FireFightHiyokoAction.WALK_DISTANCE_VERTICAL *
            walkProgress;
          break;

        case Direction.BACK:
          y +=
            FireFightHiyokoAction.WALK_DISTANCE_VERTICAL *
            walkProgress;
          break;
      }
    }


    //========放水後、消防車へ帰らせる部========

    if (waterFinished) {
      switch (vehicle.direction) {
        case Direction.RIGHT:
          x +=
            FireFightHiyokoAction.WALK_DISTANCE_HORIZONTAL *
            returnWalkProgress;
          break;

        case Direction.LEFT:
          x -=
            FireFightHiyokoAction.WALK_DISTANCE_HORIZONTAL *
            returnWalkProgress;
          break;

        case Direction.FRONT:
          y +=
            FireFightHiyokoAction.WALK_DISTANCE_VERTICAL *
            returnWalkProgress;
          break;

        case Direction.BACK:
          y -=
            FireFightHiyokoAction.WALK_DISTANCE_VERTICAL *
            returnWalkProgress;
          break;
      }
    }


    //========最後に消防車へジャンプして戻る部========

    if (returnWalkFinished) {

      //着地点 → 最初に飛び出してきた位置へ
      x =
        landingX +
        (startX - landingX) *
        returnJumpProgress;

      y =
        landingY +
        (startY - landingY) *
        returnJumpProgress;

      //ジャンプ中の向き
      switch (vehicle.direction) {
        case Direction.RIGHT:
        case Direction.LEFT:
          break;

        case Direction.FRONT:
          break;

        case Direction.BACK:
          break;
      }

      //ぴょん！
      if (returnJumpProgress < 1) {
        y -=
          Math.sin(returnJumpProgress * Math.PI) *
          FireFightHiyokoAction.JUMP_HEIGHT;
      }
    }


    //========影つけ用座標管理部========

    let shadowX = x;
    let shadowY = y;

    //登場ジャンプ中
    if (jumpProgress < 1) {
      shadowY = landingY;
    }

    //帰還ジャンプ中
    if (
      returnWalkFinished &&
      returnJumpProgress < 1
    ) {
      shadowY = landingY;
    }


    return {
      x,
      y,
      shadowX,
      shadowY,

      elapsed,
      jumpProgress,
      jumpFinished,
      walkElapsed,
      walkProgress,
      walkFinished,
      waterFinished,
      returnWalkElapsed,
      returnWalkProgress,
      returnWalkFinished,
      returnJumpProgress,
      returnWalkFinished,
    };
  }


  //放水描画係
  function drawFireFightWater(ctx, vehicle, now) {
    const image = imagesRef.current.fireFightAction02;

    if (!image) {
      return;
    }

    const hiyoko = vehicle.actionState?.hiyoko;

    if (!hiyoko?.visible) { //ひよこ見えてる？
      return;
    }

    if (!vehicle.actionState?.hoseRemoved) {  //ホースとれてる？
      return;
    }

    const sprayStartTime =
      hiyoko.jumpStartTime +
      FireFightHiyokoAction.JUMP_DURATION +
      FireFightHiyokoAction.LANDING_DURATION +
      FireFightHiyokoAction.WALK_DURATION;

    const sprayElapsed = now - sprayStartTime;

    if (sprayElapsed < 0) {   //放水始まった？
      return;
    }

    //アニメーション用フレームどこ
    const {
      FRAME_INTERVAL,
      LOOP_DURATION,
      introFrames,
      loopFrames,
      outroFrames,
    } = FireFightWaterAction;

    const introDuration =
      introFrames.length * FRAME_INTERVAL;

    const outroDuration =
      outroFrames.length * FRAME_INTERVAL;

    let frame;

    //水撒き始め
    if (sprayElapsed < introDuration) {
      const index =
        Math.floor(sprayElapsed / FRAME_INTERVAL);

      frame = introFrames[index];
    }

    //水撒いてる中
    else if (
      sprayElapsed <
      introDuration + LOOP_DURATION
    ) {
      const loopElapsed = sprayElapsed - introDuration;

      const index =
        Math.floor(loopElapsed / FRAME_INTERVAL) %
        loopFrames.length;

      frame = loopFrames[index];
    }

    //水撒きおわり
    else if (
      sprayElapsed <
      introDuration +
      LOOP_DURATION +
      outroDuration
    ) {
      const outroElapsed =
        sprayElapsed -
        introDuration -
        LOOP_DURATION;

      const index =
        Math.floor(outroElapsed / FRAME_INTERVAL);

      frame = outroFrames[index];
    }

    //放水終了
    else {
      return;
    }


    const frameWidth = 256;
    const frameHeight = 64;

    let sx;

    const position = getFireFightHiyokoPosition(vehicle, now);
    if (!position) {
      return;
    }

    const { x, y } = position;

    let waterX = x;
    const sy = frame * frameHeight;

    switch (vehicle.direction) {
      case Direction.LEFT:
      case Direction.FRONT:
        sx = 0;
        waterX += 160;
        break;

      case Direction.RIGHT:
      case Direction.BACK:
        sx = frameWidth;
        waterX -= 160;
        break;
    }



    ctx.drawImage(
      image,

      sx,
      sy,
      frameWidth,
      frameHeight,

      waterX - frameWidth / 2,
      y - frameHeight / 2,

      frameWidth,
      frameHeight
    );
  }

  //のりもの描画係
  function drawVehicle(ctx, vehicle, now) {
    const master = vehicleMaster[vehicle.type];

    const imageName = master.skins[vehicle.skin]; //何色？
    const image = imagesRef.current[imageName];

    const frameWidth = master.width;
    const frameHeight = master.height;

    let frame = vehicle.frame;

    if (vehicle.type === "fireEngine" && vehicle.actionState?.hoseRemoved) {
      frame = master.hoseRemovedFrame;
    }

    if (
      vehicle.type === "policeCar" &&
      vehicle.actionState?.startTime != null
    ) {
      const elapsed =
        now - vehicle.actionState.startTime;

      const frameIndex = Math.floor(
        elapsed / PoliceCarAction.FRAME_INTERVAL
      );

      const totalFrames =
        PoliceCarAction.frames.length *
        PoliceCarAction.LOOP_COUNT;

      if (frameIndex < totalFrames) {
        frame =
          PoliceCarAction.frames[
          frameIndex % PoliceCarAction.frames.length
          ];
      }
    }

    const sx = frame * frameWidth;       //アニメーション用の場所指定してるよ。
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



  //しゃぼんだまを描く係

  function drawBubbles(ctx, now) {
    const image = imagesRef.current.bubble;
    const popImage = imagesRef.current.bubblePop;

    for (const bubble of bubbleGameRef.current.bubbles) {

      if (bubble.state === "floating") {
        ctx.drawImage(
          image,
          bubble.x - bubble.size / 2,
          bubble.y - bubble.size / 2,
          bubble.size,
          bubble.size
        );

        continue;
      }

      const elapsed =
        now - bubble.popStartTime;

      //ぷくっ
      if (elapsed < BubbleGame.GROW_DURATION) {
        const progress =
          elapsed / BubbleGame.GROW_DURATION;

        const scale =
          1 + progress * 0.15;

        const size =
          bubble.size * scale;

        ctx.drawImage(
          image,
          bubble.x - size / 2,
          bubble.y - size / 2,
          size,
          size
        );

        continue;
      }

      //ぱちん！
      const popElapsed =
        elapsed - BubbleGame.GROW_DURATION;

      const frame =
        Math.floor(
          popElapsed /
          BubbleGame.POP_FRAME_INTERVAL
        );

      if (frame >= BubbleGame.POP_FRAME_COUNT) {
        continue;
      }

      ctx.drawImage(
        popImage,

        frame * BubbleGame.IMAGE_SIZE,
        0,
        BubbleGame.IMAGE_SIZE,
        BubbleGame.IMAGE_SIZE,

        bubble.x - bubble.size / 2,
        bubble.y - bubble.size / 2,
        bubble.size,
        bubble.size
      );
    }
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

    //しゃぼんだま配置
    drawMapBubble(ctx);

    //NPC描画係
    drawNPCs(ctx, now);

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

    drawVehicle(ctx, vehicle, now);

    if (vehicle.type === "fireEngine") {
      drawFireFightHiyokoShadow(ctx, vehicle, now);
      drawFireFightHiyoko(ctx, vehicle, now);
      drawFireFightWater(ctx, vehicle, now);
    }

    //電車描画係
    drawTrain(ctx);
    //電車の乗客描画係
    drawTrainPassengers(ctx, now);
    //踏切描画係
    drawCrossing(ctx);
    //しゃぼんだま描画係
    drawBubbles(ctx, now);
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


    //遊び中のシャボン玉を触ったかな？
    const tappedBubble =
      getTappedBubble(x, y);

    if (tappedBubble) {
      tappedBubble.state = "popping";
      tappedBubble.popStartTime = now;

      const popSounds = [
        "bubblePop01",
        "bubblePop02",
        "bubblePop03",
      ];

      const soundName =
        popSounds[Math.floor(Math.random() * popSounds.length)];

      soundManagerRef.current.play(soundName);

      return;
    }

    //マップの小さいシャボン玉を触ったかな？
    if (getTappedMapBubble(x, y)) {
      const bubble =
        bubbleGameRef.current.mapBubble;

      startBubbleGame(now);
      soundManagerRef.current.play("bubble");

      return;
    }


    //ひよこを触ったかな？
    const tappedNPC =
      getTappedNPC(x, y);

    if (tappedNPC) {
      startNPCJump(tappedNPC, now);
      soundManagerRef.current.play(
        "hiyokoJump"
      );
      return;
    }

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


    //今いる車を触ったかな？
    const vehicle = vehiclesRef.current[0];

    if (vehicle.type === "fireEngine") {
      const vehicleRect = getVehicleRect(vehicle);

      if (isPointInsideRect(x, y, vehicleRect)) {
        const isActionRunning =
          vehicle.actionState?.hiyoko?.jumpStartTime != null;

        if (isActionRunning) {
          const hiyokoPosition =
            getFireFightHiyokoPosition(vehicle, now);

          if (hiyokoPosition) {
            createTapSparkles(
              hiyokoPosition.x,
              hiyokoPosition.y,
              now
            );
          }

          return;
        }

        if (!isActionRunning) {
          setVehicles((prevVehicles) => {
            const newVehicles = [...prevVehicles];

            const vehicle = {
              ...newVehicles[0],

              actionState: {
                ...newVehicles[0].actionState,

                hiyoko: {
                  ...newVehicles[0].actionState.hiyoko,
                },
              },
            };

            vehicle.actionState.hoseRemoved = false;
            vehicle.actionState.hiyoko.visible = true;
            vehicle.actionState.hiyoko.jumpStartTime = now;

            vehicle.actionState.hiyoko.lastWalkSoundTime = null;
            vehicle.actionState.hiyoko.soundPlayed = {
              hose: false,
              spray: false,
              returnJump: false,
            };

            soundManagerRef.current.play("hiyokoNoru");

            newVehicles[0] = vehicle;
            return newVehicles;
          });
        }
        return;
      }
    }

    if (vehicle.type === "policeCar") {
      const vehicleRect = getVehicleRect(vehicle);

      if (isPointInsideRect(x, y, vehicleRect)) {
        const isActionRunning =
          vehicle.actionState?.startTime != null;

        if (!isActionRunning) {
          setVehicles((prevVehicles) => {
            const newVehicles = [...prevVehicles];

            const vehicle = {
              ...newVehicles[0],

              actionState: {
                ...newVehicles[0].actionState,
                startTime: now,
              },
            };

            newVehicles[0] = vehicle;

            return newVehicles;
          });

          soundManagerRef.current.play("policeCarAction01");
        }

        return;
      }
    }

    //アクション中は移動しないよ！
    const fireFightActionRunning =
      vehicle.type === "fireEngine" &&
      vehicle.actionState?.hiyoko?.jumpStartTime != null;

    if (fireFightActionRunning) {
      return;
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

      if (master.initialActionState) {
        vehicle.actionState = { ...master.initialActionState };
      } else {
        delete vehicle.actionState;
      }

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

  //タップしたひよこを探す係
  function getTappedNPC(x, y) {
    //後ろから調べると、手前に描かれたNPCが優先される
    for (
      let i = npcsRef.current.length - 1;
      i >= 0;
      i--
    ) {
      const npc = npcsRef.current[i];
      const master = npcMaster[npc.type];

      if (!master) {
        continue;
      }

      const left = npc.position.x - master.drawWidth / 2;
      const right = npc.position.x + master.drawWidth / 2;
      const top = npc.position.y - master.drawHeight;
      const bottom = npc.position.y;

      const isInside =
        x >= left &&
        x <= right &&
        y >= top &&
        y <= bottom;

      if (isInside) {
        return npc;
      }
    }

    return null;
  }


  //シャボン玉おさわりチェック係

  function isPointInsideBubble(x, y, bubble) {
    const hitDiameter =
      bubble.size *
      (BubbleGame.HIT_SIZE / BubbleGame.IMAGE_SIZE);

    const radius =
      hitDiameter / 2;

    const dx = x - bubble.x;
    const dy = y - bubble.y;

    return (
      dx * dx + dy * dy <=
      radius * radius
    );
  }

  //ちちゃいんままタップ判定係
  function getTappedMapBubble(x, y) {
    const bubble =
      bubbleGameRef.current.mapBubble;

    if (!bubble) {
      return false;
    }

    return isPointInsideBubble(
      x,
      y,
      {
        ...bubble,
        size: BubbleGame.MAP_BUBBLE_SIZE,
      }
    );
  }

  //おおきいんままタップ判定係
  function getTappedBubble(x, y) {
    for (
      let i =
        bubbleGameRef.current.bubbles.length - 1;
      i >= 0;
      i--
    ) {
      const bubble =
        bubbleGameRef.current.bubbles[i];

      if (bubble.state !== "floating") {
        continue;
      }

      if (isPointInsideBubble(x, y, bubble)) {
        return bubble;
      }
    }

    return null;
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

  //おさわりチェック係
  function isPointInsideRect(x, y, rect) {
    return (
      x >= rect.x &&
      x <= rect.x + rect.width &&
      y >= rect.y &&
      y <= rect.y + rect.height
    );
  }

  //車おさわり判定
  function getVehicleRect(vehicle) {
    const master = vehicleMaster[vehicle.type];

    const width =
      master.width * Math.abs(vehicle.transform.scaleX);

    const height =
      master.height * Math.abs(vehicle.transform.scaleY);

    return {
      x: vehicle.position.x - width / 2,
      y: vehicle.position.y - height / 2,
      width,
      height,
    };
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

  //ひよこがジャンプ中かチェックする係
  function isNPCJumping(npc) {
    return npc.action.type === "jump";
  }

  //ひよこジャンプ開始係
  function startNPCJump(npc, now) {
    npc.action = {
      type: "jump",
      startTime: now,

      duration:
        NPCAction.JUMP_DURATION +
        NPCAction.LANDING_DURATION,
    };
    npc.frame = 0;    //ジャンプ中は立ち姿のコマにする
  }

  //ジャンプ中にひよこを変形させる係
  function getNPCJumpTransform(npc, now) {
    if (!isNPCJumping(npc)) {
      return {
        offsetY: 0,
        scaleY: 1,
      };
    }

    const elapsed =
      now - npc.action.startTime;

    //ジャンプ中
    if (elapsed < NPCAction.JUMP_DURATION) {
      const jumpProgress =
        elapsed / NPCAction.JUMP_DURATION;

      const offsetY =
        -Math.sin(jumpProgress * Math.PI) *
        NPCAction.JUMP_HEIGHT;

      let scaleY = 1;

      if (jumpProgress < 0.15) {
        //跳ぶ前に潰れる
        const t =
          jumpProgress / 0.15;

        scaleY =
          1 + (0.5 - 1) * t;

      } else if (jumpProgress < 0.35) {
        //潰れた状態から伸びる
        const t =
          (jumpProgress - 0.15) /
          (0.35 - 0.15);

        scaleY =
          0.5 + (1.18 - 0.5) * t;

      } else if (jumpProgress < 0.5) {
        //頂点で100％へ戻る
        const t =
          (jumpProgress - 0.35) /
          (0.5 - 0.35);

        scaleY =
          1.18 + (1 - 1.18) * t;
      }

      return {
        offsetY,
        scaleY,
      };
    }

    //着地後
    const landingElapsed =
      elapsed - NPCAction.JUMP_DURATION;

    const landingProgress =
      Math.min(
        landingElapsed /
        NPCAction.LANDING_DURATION,
        1
      );

    let scaleY;

    if (landingProgress < 0.35) {
      //地面に着いてから潰れる
      const t =
        landingProgress / 0.35;

      scaleY =
        1 + (0.5 - 1) * t;
    } else {
      //潰れたところから元へ戻る
      const t =
        (landingProgress - 0.35) /
        (1 - 0.35);

      scaleY =
        0.5 + (1 - 0.5) * t;
    }

    return {
      offsetY: 0,
      scaleY,
    };
  }

  //バスのドア位置を教える係
  function getBusDoorPosition(vehicle) {
    const offset =
      BusPassenger.doorOffsets[vehicle.direction];

    return {
      x: vehicle.position.x + offset.x,
      y: vehicle.position.y + offset.y,
    };
  }

  //バスの中のひよこ位置を教える係
  function getBusRidingPosition(vehicle) {
    const offset =
      BusPassenger.ridingOffsets[vehicle.direction];

    return {
      x: vehicle.position.x + offset.x,
      y: vehicle.position.y + offset.y,
    };
  }

  //バスの向きを教える係
  function getNPCDirectionFromVehicle(vehicleDirection) {
    switch (vehicleDirection) {
      case Direction.RIGHT:
        return NPCDirection.RIGHT;

      case Direction.LEFT:
        return NPCDirection.LEFT;

      case Direction.FRONT:
        return NPCDirection.FRONT;

      case Direction.BACK:
        return NPCDirection.BACK;

      default:
        return NPCDirection.FRONT;
    }
  }

  //乗車回数を決める係
  function getBusRideTargetCount() {
    const random = Math.random();

    if (random < 0.2) {
      return 1;
    }
    if (random < 0.9) {
      return 2;
    }
    return 3;
  }

  //ひよこをバスの乗降口に案内する係
  function tryStartNPCBoarding(npc, now) {
    const vehicle =
      vehiclesRef.current[0];
    if (!vehicle) {
      return;
    }
    //これはバス？
    if (vehicle.type !== "bus") {
      return;
    }
    //バス止まってる？
    if (vehicle.state !== State.STOP) {
      return;
    }
    //今お散歩中？
    if (npc.behavior.type !== NPCBehaviorType.WANDER) {
      return;
    }
    //さっき乗った？
    if (now < npc.behavior.canBoardAfter) {
      return;
    }

    //バスとの距離チェック
    const dx = vehicle.position.x - npc.position.x;
    const dy = vehicle.position.y - npc.position.y;
    const distance = Math.hypot(dx, dy);
    if (distance > BusPassenger.BOARD_DISTANCE) {
      return;  //遠ければ離脱
    }

    const doorPosition = getBusDoorPosition(vehicle);

    npc.target.x = doorPosition.x;
    npc.target.y = doorPosition.y;

    npc.behavior.type = NPCBehaviorType.BOARD_BUS;
    npc.behavior.vehicleId = vehicle.id;

    npc.state = NPCState.WALK;

    npc.animationTimer = 0;
    npc.animationFrameIndex = 0;

    const master = npcMaster[npc.type];

    npc.frame = master.walkFrames[0];
  }

  //バスまでひよこを歩かせる係
  function updateNPCBoarding(npc, vehicle, now) {
    //バスが発進してしまったら乗車を中止
    if (
      vehicle.type !== "bus" ||
      vehicle.state !== State.STOP
    ) {
      npc.behavior.type = NPCBehaviorType.WANDER;

      npc.behavior.vehicleId = null;

      npc.state = NPCState.IDLE;
      npc.frame = 0;

      npc.waitUntil = now + getRandomNumber(300, 700);

      return false;
    }

    //停止中にバスの向きなどが変わっても、常に最新のドア位置へ向かう
    const doorPosition = getBusDoorPosition(vehicle);

    npc.target.x = doorPosition.x;
    npc.target.y = doorPosition.y;

    const distanceToDoor =
      Math.hypot(
        doorPosition.x - npc.position.x,
        doorPosition.y - npc.position.y
      );

    //まだドアへ着いていない
    if (
      distanceToDoor >
      BusPassenger.BOARD_ARRIVAL_DISTANCE
    ) {
      return false;
    }

    //乗車完了！
    npc.behavior.type =
      NPCBehaviorType.RIDE_BUS;

    npc.behavior.isWaitingForArrival = false;
    npc.behavior.rideCount = 0;
    npc.behavior.rideTargetCount = getBusRideTargetCount();

    npc.state = NPCState.IDLE;
    npc.frame = 0;

    const ridingPosition = getBusRidingPosition(vehicle);

    npc.position.x = ridingPosition.x;
    npc.position.y = ridingPosition.y;

    npc.target.x = ridingPosition.x;
    npc.target.y = ridingPosition.y;

    soundManagerRef.current.play("hiyokoNoru");  //ぴよ♪

    return true;
  }

  //バスとひよこ一緒係
  function updateNPCRidingBus(npc, vehicle, now) {
    //バス以外へ変更したら乗車終わり
    if (
      !vehicle ||
      vehicle.type !== "bus"
    ) {
      npc.behavior.type =
        NPCBehaviorType.WANDER;

      npc.behavior.vehicleId = null;
      npc.behavior.isWaitingForArrival = false;

      npc.state = NPCState.IDLE;
      npc.frame = 0;

      return;
    }

    const ridingPosition = getBusRidingPosition(vehicle);

    npc.position.x = ridingPosition.x;
    npc.position.y = ridingPosition.y;

    npc.target.x = ridingPosition.x;
    npc.target.y = ridingPosition.y;

    npc.direction = getNPCDirectionFromVehicle(vehicle.direction);

    npc.state = NPCState.IDLE;
    npc.frame = 0;

    //一度でもバスが動いたことを記録
    if (vehicle.state === State.MOVE) {
      npc.behavior.isWaitingForArrival = true;
    }

    //一度動いたバスが停止した
    if (
      vehicle.state === State.STOP &&
      npc.behavior.isWaitingForArrival
    ) {
      npc.behavior.isWaitingForArrival = false;
      npc.behavior.rideCount++;

      //降りるよ～
      if (
        npc.behavior.rideCount >=
        npc.behavior.rideTargetCount
      ) {
        npc.behavior.type = NPCBehaviorType.EXIT_BUS;
        npc.behavior.exitAt = now + BusPassenger.EXIT_DELAY;
      }
    }
  }

  //バスからひよこを降ろす係
  function updateNPCExitingBus(npc, vehicle, now) {
    //待ち時間中はまだバスの中
    if (now < npc.behavior.exitAt) {
      const ridingPosition = getBusRidingPosition(vehicle);

      npc.position.x = ridingPosition.x;
      npc.position.y = ridingPosition.y;

      npc.target.x = ridingPosition.x;
      npc.target.y = ridingPosition.y;

      npc.direction = getNPCDirectionFromVehicle(vehicle.direction);

      npc.state = NPCState.IDLE;
      npc.frame = 0;

      return;
    }

    const doorPosition = getBusDoorPosition(vehicle);

    npc.position.x = doorPosition.x;
    npc.position.y = doorPosition.y;

    npc.target.x = doorPosition.x;
    npc.target.y = doorPosition.y;

    npc.behavior.type = NPCBehaviorType.WANDER;

    npc.behavior.vehicleId = null;
    npc.behavior.isWaitingForArrival = false;
    npc.behavior.rideCount = 0;
    npc.behavior.rideTargetCount = 0;

    npc.behavior.canBoardAfter = now + BusPassenger.REBOARD_COOLDOWN;

    npc.state = NPCState.IDLE;
    npc.frame = 0;

    soundManagerRef.current.play("hiyokoNoru");  //ぴよ♪
    startNPCJump(npc, now);  //ジャンプ
  }

  //「ひよこ逃げて！」係
  function tryStartNPCFlee(npc, now) {
    const vehicle =
      vehiclesRef.current[0];
    if (!vehicle) {
      return;
    }

    //今回は走っているバスだけ避ける
    if (vehicle.state !== State.MOVE) {
      return;
    }

    //すでに逃走中なら、今の逃げ先を維持
    if (
      npc.behavior.type === NPCBehaviorType.FLEE &&
      now < npc.behavior.until
    ) {
      return;
    }

    //ひよこの方向はどっちだ？
    let dx = npc.position.x - vehicle.position.x;
    let dy = npc.position.y - vehicle.position.y;
    let distance = Math.hypot(dx, dy);

    //まだ遠ければ逃げない
    if (
      distance >=
      NPCFleeConfig.AVOID_DISTANCE
    ) {
      return;
    }

    //完全に同じ位置だった場合の安全策
    if (distance === 0) {
      const angle = Math.random() * Math.PI * 2;

      dx = Math.cos(angle);
      dy = Math.sin(angle);
      distance = 1;
    }

    //バスと反対方向を求める
    const awayX = dx / distance;
    const awayY = dy / distance;

    npc.target.x = clamp(
      npc.position.x + awayX * NPCFleeConfig.FLEE_DISTANCE,

      NPCWalkArea.LEFT,
      NPCWalkArea.RIGHT
    );

    npc.target.y = clamp(
      npc.position.y + awayY * NPCFleeConfig.FLEE_DISTANCE,

      NPCWalkArea.TOP,
      NPCWalkArea.BOTTOM
    );

    npc.behavior.type = NPCBehaviorType.FLEE;
    npc.state = NPCState.WALK;

    npc.animationTimer = 0;
    npc.animationFrameIndex = 0;

    const master =
      npcMaster[npc.type];

    npc.frame =
      master.walkFrames[0];
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

      //ジャンプ中
      if (isNPCJumping(npc)) {
        const elapsed =
          now - npc.action.startTime;

        if (elapsed >= npc.action.duration) {
          npc.action.type = null;

          //歩行中なら歩行アニメーションを再開
          if (npc.state === NPCState.WALK) {
            npc.animationTimer = 0;
            npc.animationFrameIndex = 0;
            npc.frame = master.walkFrames[0];
          } else {
            npc.frame = 0;
          }
        } else {
          //ジャンプ中はその場に止まる
          npc.frame = 0;
          continue;
        }
      }

      const vehicle = vehiclesRef.current[0];
      //バスから降りようね
      if (
        npc.behavior.type === NPCBehaviorType.EXIT_BUS) {
        updateNPCExitingBus(npc, vehicle, now);
        continue;
      }

      //バスに乗ってるね
      if (npc.behavior.type === NPCBehaviorType.RIDE_BUS) {
        updateNPCRidingBus(npc, vehicle, now);
        continue;
      }

      //バスに乗ったかな？
      if (npc.behavior.type === NPCBehaviorType.BOARD_BUS) {
        const boarded =
          updateNPCBoarding(npc, vehicle, now);
        if (boarded) {
          continue;
        }
      }

      //走っている車が近くにいるか確認
      tryStartNPCFlee(npc, now);

      //通常状態のときだけバスを探す
      if (npc.behavior.type === NPCBehaviorType.WANDER) {
        tryStartNPCBoarding(npc, now);
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

        const wasFleeing =
          npc.behavior.type === NPCBehaviorType.FLEE;

        npc.behavior.type = NPCBehaviorType.WANDER;
        npc.state = NPCState.IDLE;
        npc.frame = 0;

        npc.waitUntil = now +
          (
            wasFleeing
              ? getRandomNumber(300, 700)
              : getRandomNumber(
                master.waitTime.min,
                master.waitTime.max
              )
          );

        continue;
      }

      const speed =
        npc.behavior.type === NPCBehaviorType.FLEE
          ? master.speed *
          NPCFleeConfig.FLEE_SPEED_MULTIPLIER
          : master.speed;

      const moveDistance =
        speed * deltaTime;

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

  //消防アクション更新係
  function updateFireFightAction(vehicle, now) {
    if (vehicle.type !== "fireEngine") {
      return;
    }

    const hiyoko = vehicle.actionState?.hiyoko;

    if (!hiyoko?.visible || hiyoko.jumpStartTime == null) {
      return;
    }

    const elapsed = now - hiyoko.jumpStartTime;

    const jumpFinished = elapsed >=
      FireFightHiyokoAction.JUMP_DURATION +
      FireFightHiyokoAction.LANDING_DURATION;

    const walkFinished =
      elapsed >=
      FireFightHiyokoAction.JUMP_DURATION +
      FireFightHiyokoAction.LANDING_DURATION +
      FireFightHiyokoAction.WALK_DURATION;

    const waterDuration =
      FireFightWaterAction.introFrames.length *
      FireFightWaterAction.FRAME_INTERVAL +
      FireFightWaterAction.LOOP_DURATION +
      FireFightWaterAction.outroFrames.length *
      FireFightWaterAction.FRAME_INTERVAL;

    const waterFinished =
      elapsed >=
      FireFightHiyokoAction.JUMP_DURATION +
      FireFightHiyokoAction.LANDING_DURATION +
      FireFightHiyokoAction.WALK_DURATION +
      waterDuration;

    const returnWalkFinished =
      elapsed >=
      FireFightHiyokoAction.JUMP_DURATION +
      FireFightHiyokoAction.LANDING_DURATION +
      FireFightHiyokoAction.WALK_DURATION +
      waterDuration +
      FireFightHiyokoAction.RETURN_WALK_DURATION;


    const actionFinished =
      elapsed >=
      FireFightHiyokoAction.JUMP_DURATION +
      FireFightHiyokoAction.LANDING_DURATION +
      FireFightHiyokoAction.WALK_DURATION +
      waterDuration +
      FireFightHiyokoAction.RETURN_WALK_DURATION +
      FireFightHiyokoAction.JUMP_DURATION;

    if (walkFinished && !waterFinished) {
      vehicle.actionState.hoseRemoved = true;
    }
    if (waterFinished) {
      vehicle.actionState.hoseRemoved = false;
    }
    if (actionFinished) {
      vehicle.actionState.hiyoko.visible = false;
      vehicle.actionState.hiyoko.jumpStartTime = null;
    }

    //音管理

    const WALK_SOUND_INTERVAL = 280;

    const isWalking =
      (jumpFinished && !walkFinished) ||
      (waterFinished && !returnWalkFinished);

    if (isWalking) {
      if (
        hiyoko.lastWalkSoundTime == null ||
        now - hiyoko.lastWalkSoundTime >= WALK_SOUND_INTERVAL
      ) {
        soundManagerRef.current.play("hiyokoWalk01");
        hiyoko.lastWalkSoundTime = now;
      }
    } else {
      hiyoko.lastWalkSoundTime = null;
    }

    if (walkFinished && !hiyoko.soundPlayed.hose) {
      soundManagerRef.current.play("fireFightAction01");
      hiyoko.soundPlayed.hose = true;
    }
    if (walkFinished && !hiyoko.soundPlayed.spray) {
      soundManagerRef.current.play("fireFightAction02");
      hiyoko.soundPlayed.spray = true;
    }
    if (returnWalkFinished && !hiyoko.soundPlayed.returnJump) {
      soundManagerRef.current.play("hiyokoNoru");
      hiyoko.soundPlayed.returnJump = true;
    }
  }

  //パトカーアクション更新係

  function updatePoliceCarAction(vehicle, now) {
    if (vehicle.type !== "policeCar") {
      return;
    }

    const startTime =
      vehicle.actionState?.startTime;

    if (startTime == null) {
      return;
    }

    const actionDuration =
      PoliceCarAction.frames.length *
      PoliceCarAction.FRAME_INTERVAL *
      PoliceCarAction.LOOP_COUNT;

    if (now - startTime >= actionDuration) {
      vehicle.actionState.startTime = null;
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

        actionState: newVehicles[0].actionState
          ? {
            ...newVehicles[0].actionState,

            hiyoko: newVehicles[0].actionState.hiyoko
              ? { ...newVehicles[0].actionState.hiyoko }
              : undefined,
          }
          : undefined,
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
      updateFireFightAction(vehicle, now);
      updatePoliceCarAction(vehicle, now);


      newVehicles[0] = vehicle;
      return newVehicles;
    });
  }


  //しゃぼんだまぷくぷく係
  function startBubbleGame(now) {
    const bubbles = [];

    for (let i = 0; i < BubbleGame.COUNT; i++) {
      const startX = getRandomNumber(100, 1820);
      const startY = getRandomNumber(300, 1000);

      bubbles.push({
        x: startX,
        y: startY,
        baseX: startX,

        size: getRandomNumber(
          BubbleGame.MIN_SIZE,
          BubbleGame.MAX_SIZE
        ),
        speed: getRandomNumber(
          BubbleGame.MIN_SPEED,
          BubbleGame.MAX_SPEED
        ),

        swayAmount: getRandomNumber(
          BubbleGame.MIN_SWAY,
          BubbleGame.MAX_SWAY
        ),

        swaySpeed: getRandomNumber(
          BubbleGame.MIN_SWAY_SPEED,
          BubbleGame.MAX_SWAY_SPEED
        ),

        driftX: getRandomNumber(
          BubbleGame.MIN_DRIFT,
          BubbleGame.MAX_DRIFT
        ),

        startTime: now,

        state: "floating",
        popStartTime: null,
      });
    }

    bubbleGameRef.current.mapBubble = null;
    bubbleGameRef.current.bubbles = bubbles;
  }


  //しゃぼんだまゆらゆら係

  function updateBubbles(now, deltaTime) {
    const bubbleGame = bubbleGameRef.current;

    for (const bubble of bubbleGame.bubbles) {

      if (bubble.state === "floating") {
        bubble.y -= bubble.speed * deltaTime;

        bubble.baseX += bubble.driftX * deltaTime;

        bubble.x =
          bubble.baseX +
          Math.sin(
            (now - bubble.startTime) * bubble.swaySpeed
          ) *
          bubble.swayAmount;
      }
    }

    bubbleGame.bubbles =
      bubbleGame.bubbles.filter((bubble) => {

        if (bubble.state === "popping") {
          const elapsed =
            now - bubble.popStartTime;

          const popDuration =
            BubbleGame.GROW_DURATION +
            BubbleGame.POP_FRAME_INTERVAL *
            BubbleGame.POP_FRAME_COUNT;

          return elapsed < popDuration;
        }

        return bubble.y + bubble.size / 2 > 0;
      });

    if (
      bubbleGame.mapBubble === null &&
      bubbleGame.bubbles.length === 0
    ) {
      if (bubbleGame.respawnTime === null) {
        bubbleGame.respawnTime =
          now + BubbleGame.RESPAWN_DELAY;
      }

      if (now >= bubbleGame.respawnTime) {
        createMapBubble();
      }
    }
  }



  //現場監督
  function update(now, deltaTime) {
    updateVehicle(now, deltaTime);
    updateNPCs(now, deltaTime);
    updateVehicleMenu(now);
    updateCrossing(now);
    updateTrain(now, deltaTime);
    updateTapEffects(now);
    updateBubbles(now, deltaTime);

    const ctx = ctxRef.current;

    if (ctx) {
      draw(ctx, now);
    }
  }

  //画像読み込み所
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctxRef.current = ctx;

    //画像はここから。
    const imageNames = [
      "background",

      "bus01", "bus02", "bus03", "bus04",
      "bus05", "bus06", "bus07", "bus08",

      "ambulance01",
      "fireEngine01", "fireFightAction01", "fireFightAction02",
      "policeCar01",

      "train01",
      "crossing01",
      "tEffect01",
      "tHiyoko", "tCat01", "tCat02", "tCat03",

      "puddle01", "puddle02", "puddle03", "puddle04",
      "puddle05", "puddle06", "puddle07", "puddle08",

      "npcHiyoko01", "hiyokoWalk01",

      "menuBackground01",
      "menuTag01",
      "selectAnimation01",

      "bubble", "bubblePop",
    ];

    //読み込み進捗君。全部揃ったら描いてくれる。
    let loaded = 0;

    function imageLoaded() {
      loaded++;

      if (loaded === imageNames.length) {
        createMapBubble();
        draw(ctx, performance.now());
      }
    }

    //読み込んでお名前をつける係
    imageNames.forEach((name) => {
      const image = new Image();

      image.onload = imageLoaded;
      image.src = `${import.meta.env.BASE_URL}images/${name}.png`;

      imagesRef.current[name] = image;
    });

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

    const soundNames = [
      "select01",
      "menuOpen01",

      "busHorn", "ambulanceSiren",
      "fireEngineSiren", "fireFightAction01", "fireFightAction02",
      "policeCarSiren", "policeCarAction01",
      "train01", "crossing", "trainHorn01", "passengerAppear01",

      "hiyokoJump", "hiyokoWalk01",
      "hiyokoNoru",

      "bubble", "bubblePop01", "bubblePop02", "bubblePop03",

    ];

    Promise.all(soundNames.map((name) => soundManager.load(name, `${import.meta.env.BASE_URL}sounds/${name}.mp3`)))
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