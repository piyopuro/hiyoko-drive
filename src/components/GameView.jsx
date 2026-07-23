import { useState, useEffect, useRef } from "react";
import { VERSION } from "../version";

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

//のりものたちの基本情報
const vehicleMaster = {
  bus: {
    width: 256,
    height: 128,

    speed: 5,

    canChangeColor: true,

    defaultSkin: "yellow",
    skins: {
      yellow: "bus01",
      blue: "bus02",
      green: "bus03",
      pink: "bus04",
    },

    actionSound: "busHorn",
  },

  ambulance: {
    width: 192,
    height: 128,

    speed: 6,

    canChangeColor: false,
    defaultSkin: "normal",
    skins: {
      normal: "ambulance01",
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
const colorPuddles = [
  {
    id: 1,
    x: 500,
    y: 400,
    radius: 80,
    skin: "yellow",
    imageName: "puddle01",
  },
  {
    id: 2,
    x: 1400,
    y: 700,
    radius: 80,
    skin: "blue",
    imageName: "puddle02",
  },
  {
    id: 3,
    x: 100,
    y: 1000,
    radius: 80,
    skin: "green",
    imageName: "puddle03",
  },
  {
    id: 4,
    x: 1700,
    y: 200,
    radius: 80,
    skin: "pink",
    imageName: "puddle04",
  },
];

//こちらがおくるまのメニューでございます。
const VehicleMenu = {
  TAB_WIDTH: 180,
  TAB_HEIGHT: 140,

  PANEL_WIDTH: 1700,
  PANEL_HEIGHT: 940,

  OPEN_DURATION: 300,
}
//メニューのおくるまです。
const vehicleMenuItems = [
  {
    type: "bus",
    skin: "yellow",
    offsetX: 300,
    offsetY: 300,
  },
  {
    type: "ambulance",
    skin: "normal",
    offsetX: 700,
    offsetY: 300,
  },
]

/*動きセット
const effectMaster = {
  start: {
    frameInterval: 15,
    scaleX: [0.92, 0.86, 0.81, 0.77, 0.74, 0.72, 0.71, 0.72, 0.74, 0.77, 0.81, 0.86, 0.92, 0.96, 0.99, 1.00,],
    scaleY: [1.08, 1.14, 1.19, 1.23, 1.26, 1.28, 1.29, 1.28, 1.26, 1.23, 1.19, 1.14, 1.08, 1.04, 1.01, 1.00,],
  },

  stop: {
    frameInterval: 15,
    scaleX: [1.08, 1.14, 1.19, 1.23, 1.26, 1.28, 1.29, 1.28, 1.26, 1.23, 1.19, 1.14, 1.08, 1.04, 1.01, 1.00,],
    scaleY: [0.92, 0.86, 0.81, 0.77, 0.74, 0.72, 0.71, 0.72, 0.74, 0.77, 0.81, 0.86, 0.92, 0.96, 0.99, 1.00,],
  },
};
*/

/*

//のりものオブジェクトお渡し係
function createVehicle({
  type,
  skin,
  x,
  y,
  direction=0,
}){
  const master= vehicleMaster[type];

  return{
    type,
    skin: skin ?? master.defaultSkin,

    frame:0,
    direction,
    position:{x,y,},
    transform:{
      scaleX=1,
      scaleY=1,
    },

    effect:{
      popFrame:0,
    },
  };
}
*/


//ゲームの中身を描いてるところだよ。
function GameView() {

  const [screenSize, setScreenSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  //画面拡縮率計算君
  const scale = Math.min(
    screenSize.width / 1920,
    screenSize.height / 1080
  );

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

  const canvasRef = useRef(null);
  const imagesRef = useRef({
    background: null,

    bus01: null,
    bus02: null,
    bus03: null,
    bus04: null,
    ambulance: null,

    puddle01: null,
    puddle02: null,
    puddle03: null,
    puddle04: null,
  });
  const animationTimerRef = useRef(0);
  const ctxRef = useRef(null);

  const soundsRef = useRef({
    busHorn: null,
    ambulanceSiren: null,
  });

  const vehicleMenuRef = useRef({
    isOpen: false,

    startTime: 0,
    startProgress: 0,
    targetProgress: 0,

    progress: 0,  //閉じてる？開いてる？
  });

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

  //メニュー描画係
  function drawVehicleMenu(ctx) {
    const menu = vehicleMenuRef.current;

    const panelX =
      1920 - VehicleMenu.PANEL_WIDTH * menu.progress;

    const panelY = 70;

    ctx.fillStyle = "#eeeeee";
    ctx.fillRect(
      panelX,
      panelY,
      VehicleMenu.PANEL_WIDTH,
      VehicleMenu.PANEL_HEIGHT
    );

    const menuVehicles = getVehicleMenuVehicles();

    for (const vehicle of menuVehicles) {
      drawMenuVehicle(ctx, vehicle,);
    }

    ctx.restore();
  }

  //メニュー付箋描画係
  function drawVehicleMenuTab(ctx) {
    const menu = vehicleMenuRef.current;

    const closedX =
      1920 - VehicleMenu.TAB_WIDTH;
    const openedX =
      1920 - VehicleMenu.PANEL_WIDTH - VehicleMenu.TAB_WIDTH;

    const tabX =
      closedX + (openedX - closedX) * menu.progress;
    const tabY = 70;

    ctx.save();

    ctx.fillStyle = "#ff7800";
    ctx.fillRect(
      tabX, tabY,
      VehicleMenu.TAB_WIDTH, VehicleMenu.TAB_HEIGHT
    );

    // 仮の車マーク
    ctx.fillStyle = "#ffffff";

    ctx.beginPath();
    ctx.roundRect(
      tabX + 35,
      tabY + 45,
      110,
      55,
      24
    );
    ctx.fill();

    ctx.restore();

  }

  //メニューの車描画係
  function drawMenuVehicle(ctx, menuVehicle) {
    const master = vehicleMaster[menuVehicle.type];

    const imageKey =
      master.skins[menuVehicle.skin];

    const image = imagesRef.current[imageKey];

    if (!image) {
      return;
    }

    const frameWidth = master.width;
    const frameHeight = master.height;

    const frame = Frame.IDLE;
    const direction = Direction.RIGHT;

    const sx = frame * frameWidth;
    const sy = frame * frameHeight;

    ctx.drawImage(
      image,

      sx,
      sy,
      frameWidth,
      frameHeight,

      menuVehicle.x - frameWidth / 2,
      menuVehicle.y - frameHeight / 2,
      frameWidth,
      frameHeight
    );
  }

  //描画担当本部
  function draw(ctx) {
    const background = imagesRef.current.background;

    //一回画面をきれいにする。
    ctx.clearRect(0, 0, 1920, 1080);

    //背景描いてる部署
    ctx.drawImage(background, 0, 0);

    //インク池描画係
    for (const puddle of colorPuddles) {
      drawColorPuddle(ctx, puddle);
    }

    //動かすのりもの描画係
    const vehicle = vehicles[0];
    drawVehicle(ctx, vehicle);

    drawVehicleMenu(ctx);
    drawVehicleMenuTab(ctx);
  }

  function handleClick(event) {
    const x = event.nativeEvent.offsetX / scale;
    const y = event.nativeEvent.offsetY / scale;

    const tabRect = getVehicleMenuTabRect();  //付箋おさわりチェック

    if (isPointInsideRect(x, y, tabRect)) {   //触ってたらメニューをだして！車は動かさないよ。
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
          changeVehicleType(menuVehicle.type);
          return;
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
    const sound = soundsRef.current[master.actionSound];

    sound.currentTime = 0;
    sound.play();

  }

  //方向更新係
  function updateDirection(vehicle, dx, dy) {

    if (dx === 0 && dy === 0) {
      return;
    }

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) {
        vehicle.direction = Direction.RIGHT; //右むけ！
      } else {
        vehicle.direction = Direction.LEFT;  //左むけ！
      }

    } else if (Math.abs(dx) < Math.abs(dy)) {
      if (dy > 0) {
        vehicle.direction = Direction.FRONT; //前むけ！
      } else {
        vehicle.direction = Direction.BACK;  //後ろむけ！
      }

    } else {    //45度ななめ方向の時
      if (dx > 0) {
        vehicle.direction = Direction.RIGHT; //右むけ！
      } else {
        vehicle.direction = Direction.LEFT;  //左むけ！
      }
    }

  }

  //車種変更係
  function changeVehicleType(newType) {
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
      1920 - VehicleMenu.TAB_WIDTH;

    const openedX =
      1920 - VehicleMenu.PANEL_WIDTH - VehicleMenu.TAB_WIDTH;

    const x =
      closedX + (openedX - closedX) * menu.progress;

    return {
      x,
      y: 70,
      width: VehicleMenu.TAB_WIDTH,
      height: VehicleMenu.TAB_HEIGHT,
    };
  }

  //メニュー付箋おさわりチェック
  function isPointInsideRect(x, y, rect) {
    return (
      x >= rect.x &&
      x <= rect.x + rect.width &&
      y >= rect.y &&
      y <= rect.y + rect.height
    );
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

    const panelY = 70;

    return vehicleMenuItems.map((item) => ({
      ...item,
      x: panelX + item.offsetX,
      y: panelY + item.offsetY,
    }));
  }

  //走行アニメーション係
  function updateAnimation(vehicle, animationTimerRef) {

    if (vehicle.state === State.STOP) {
      vehicle.frame = Frame.IDLE;
      return;
    }

    //アニメーションタイマーだよ。8フレームごとにアニメーションフレームを変えてね。
    animationTimerRef.current++;

    if (animationTimerRef.current >= 8) {

      vehicle.frame =
        vehicle.frame === Frame.IDLE
          ? Frame.MOVE
          : Frame.IDLE;

      animationTimerRef.current = 0;
    }
  }

  //のりものの位置情報更新係
  function updatePosition(vehicle, master, dx, dy, distance) {

    if (vehicle.state === State.STOP) return;

    const vx = dx / distance;
    const vy = dy / distance;

    //目的地に着いたらこれ
    if (distance < master.speed) {

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
      x: vehicle.position.x + vx * master.speed,
      y: vehicle.position.y + vy * master.speed,
    };
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

    for (const puddle of colorPuddles) {
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

    menu.progress =
      menu.startProgress + (menu.targetProgress - menu.startProgress) * t;

    if (t === 1) {
      menu.progress = menu.targetProgress;
    }
  }

  //現場監督
  function update(now) {
    setVehicles((prevVehicles) => {
      const newVehicles = [...prevVehicles];
      const vehicle = { //念のためぜーんぶコピーするよ！
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
      updateAnimation(vehicle, animationTimerRef);
      updatePosition(vehicle, master, dx, dy, distance);
      updateColoPuddleCollision(vehicle);
      updateEffect(vehicle, now);
      updateVehicleMenu(now);

      newVehicles[0] = vehicle;

      return newVehicles;
    });
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
    const ambulance01 = new Image();

    const puddle01 = new Image();
    const puddle02 = new Image();
    const puddle03 = new Image();
    const puddle04 = new Image();

    imagesRef.current.background = background;
    imagesRef.current.bus01 = bus01;
    imagesRef.current.bus02 = bus02;
    imagesRef.current.bus03 = bus03;
    imagesRef.current.bus04 = bus04;
    imagesRef.current.puddle01 = puddle01;
    imagesRef.current.puddle02 = puddle02;
    imagesRef.current.puddle03 = puddle03;
    imagesRef.current.puddle04 = puddle04;
    imagesRef.current.ambulance01 = ambulance01;


    //画像の場所はここ。
    background.src = `${import.meta.env.BASE_URL}images/background01.png`;
    bus01.src = `${import.meta.env.BASE_URL}images/bus01.png`;
    bus02.src = `${import.meta.env.BASE_URL}images/bus02.png`;
    bus03.src = `${import.meta.env.BASE_URL}images/bus03.png`;
    bus04.src = `${import.meta.env.BASE_URL}images/bus04.png`;
    puddle01.src = `${import.meta.env.BASE_URL}images/puddle01.png`;
    puddle02.src = `${import.meta.env.BASE_URL}images/puddle02.png`;
    puddle03.src = `${import.meta.env.BASE_URL}images/puddle03.png`;
    puddle04.src = `${import.meta.env.BASE_URL}images/puddle04.png`;
    ambulance01.src = `${import.meta.env.BASE_URL}images/ambulance01.png`;

    //音も読み込んじゃうよ。
    const busHorn = new Audio(
      `${import.meta.env.BASE_URL}sounds/busHorn.mp3`
    );
    const ambulanceSiren = new Audio(
      `${import.meta.env.BASE_URL}sounds/ambulanceSiren.mp3`
    );


    soundsRef.current.busHorn = busHorn;
    soundsRef.current.ambulanceSiren = ambulanceSiren;

    let loaded = 0;

    //読み込み進捗君。全部揃ったら描いてくれる。
    function imageLoaded() {
      loaded++;

      if (loaded === 10) {
        draw(ctx);
      }
    }

    //読み込みが終わったらこれ。
    background.onload = imageLoaded;
    bus01.onload = imageLoaded;
    bus02.onload = imageLoaded;
    bus03.onload = imageLoaded;
    bus04.onload = imageLoaded;
    puddle01.onload = imageLoaded;
    puddle02.onload = imageLoaded;
    puddle03.onload = imageLoaded;
    puddle04.onload = imageLoaded;
    ambulance01.onload = imageLoaded;

  }, []);

  useEffect(() => {
    if (!ctxRef.current) return;

    draw(ctxRef.current);

  }, [vehicles]);


  useEffect(() => {
    let animationFrameId;

    function gameLoop(now) {
      update(now);

      animationFrameId = requestAnimationFrame(gameLoop);
    }

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
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

        <div className="version">
          Ver {VERSION}
        </div>

      </div>

    </div>
  );

}

export default GameView;