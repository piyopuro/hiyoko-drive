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

//のりものたちの基本情報
const vehicleMaster = {
  bus: {
    width: 256,
    height: 128,

    speed: 5,

    skins: {
      yellow: "bus01",
      /* 今後実装予定
      blue:"bus02",
      green:"bus03",
      pink:"bus04",
      */
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

//動きセット
const effectMaster = {
  start: {
    scaleX: [1.00, 0.85, 0.75, 0.70, 0.75, 0.85, 1.00],
    scaleY: [1.00, 1.15, 1.25, 1.30, 1.25, 1.15, 1.00],
  },

  stop: {
    scaleX: [1.00, 1.15, 1.25, 1.30, 1.25, 1.15, 1.00],
    scaleY: [1.00, 0.85, 0.75, 0.70, 0.75, 0.85, 1.00],
  },
};

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
        frame: 0,
      },

    },
  ]);

  const canvasRef = useRef(null);
  const imagesRef = useRef({
    background: null,
    bus01: null,
  });
  const animationTimerRef = useRef(0);
  const ctxRef = useRef(null);

  const soundsRef = useRef({
    busHorn: null,
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


  //描画担当君。
  function draw(ctx) {
    const background = imagesRef.current.background;

    const vehicle = vehicles[0];
    const master = vehicleMaster[vehicle.type];

    const imageName = master.skins[vehicle.skin];
    const image = imagesRef.current[imageName];

    //一回画面をきれいにする。
    ctx.clearRect(0, 0, 1920, 1080);

    //背景
    ctx.drawImage(background, 0, 0);

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


      vehicle.position.x - frameWidth / 2,
      vehicle.position.y - frameHeight / 2,
      drawWidth,
      drawHeight,
    );
  }

  function handleClick(event) {
    const x = event.nativeEvent.offsetX / scale;
    const y = event.nativeEvent.offsetY / scale;

    setVehicles((prevVehicles) => {
      const newVehicles = [...prevVehicles]; //newVehicle君に今の値をこぴ
      const vehicle = { ...newVehicles[0] };  //vehicle君（計算係）にそのセットの中のバスのやつ渡してあげて。

      vehicle.target = { x, y };
      //バスを移動状態にするよ！
      vehicle.state = State.MOVE;
      //ぽよん準備
      startPop(vehicle, "start");

      newVehicles[0] = vehicle; //newVehicles君に計算した値を渡してあげて。
      return newVehicles;   //計算し終わった新しいやつ持ってって。
    });

    //音鳴らしちゃうよ。
    soundsRef.current.busHorn.currentTime = 0;
    soundsRef.current.busHorn.play();

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

  //バスの位置情報更新係
  function updatePosition(vehicle, master, dx, dy, distance) {

    if (distance === 0) return;

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

      startPop(vehicle, "stop"); //停止のぽよん

      return;
    }

    vehicle.position = {
      x: vehicle.position.x + vx * master.speed,
      y: vehicle.position.y + vy * master.speed,
    };
  }

  //ぽよん開始合図係
  function startPop(vehicle, type) {
    vehicle.effect = {
      type,
      frame: 0,
    };
  }

  //ぽよん係
  function updatePop(vehicle) {
    const effect = effectMaster[vehicle.effect.type];
    const frame = vehicle.effect.frame;

    //ぽよん中ですか？
    if (!vehicle.effect.type) return;

    vehicle.transform.scaleX = effect.scaleX[frame];
    vehicle.transform.scaleY = effect.scaleY[frame];

    vehicle.effect.frame++;

    //ぽよん終了
    if (vehicle.effect.frame >= effect.scaleX.length) {

      vehicle.transform = {
        ...vehicle.transform,
        scaleX: 1,
        scaleY: 1,
      };

      vehicle.effect.type = null;
    }

  }

  //現場監督
  function update() {
    setVehicles((prevVehicles) => {
      const newVehicles = [...prevVehicles];
      const vehicle = { ...newVehicles[0] };
      const master = vehicleMaster[vehicle.type];


      const dx = vehicle.target.x - vehicle.position.x;
      const dy = vehicle.target.y - vehicle.position.y;
      const distance = Math.hypot(dx, dy);

      updateDirection(vehicle, dx, dy);
      updateAnimation(vehicle, animationTimerRef);
      updatePosition(vehicle, master, dx, dy, distance);
      updatePop(vehicle);

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

    imagesRef.current.background = background;
    imagesRef.current.bus01 = bus01;

    //画像の場所はここ。
    background.src = `${import.meta.env.BASE_URL}images/background01.png`;
    bus01.src = `${import.meta.env.BASE_URL}images/bus01.png`;

    //音も読み込んじゃうよ。
    const busHorn = new Audio(
      `${import.meta.env.BASE_URL}sounds/busHorn.mp3`
    );

    soundsRef.current.busHorn = busHorn;

    let loaded = 0;

    //読み込み進捗君。全部揃ったら描いてくれる。
    function imageLoaded() {
      loaded++;

      if (loaded === 2) {
        draw(ctx);
      }
    }

    //読み込みが終わったらこれ。
    background.onload = imageLoaded;
    bus01.onload = imageLoaded;

  }, []);

  useEffect(() => {
    if (!ctxRef.current) return;

    draw(ctxRef.current);

  }, [vehicles]);

  useEffect(() => {
    const timer = setInterval(() => {

      update();

    }, 16);

    return () => clearInterval(timer);
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