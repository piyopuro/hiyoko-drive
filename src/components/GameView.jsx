import { useState, useEffect, useRef } from "react";
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

  //現在地記録係
  const [bus01Position, setBus01Position] = useState({
    x: 960,
    y: 540,
  });

  //目的地記録係
  const bus01TargetRef = useRef({
    x: 960,
    y: 540,
  });

  //バスの向き記録係
  const [bus01Direction, setBus01Direction] = useState(Direction.RIGHT);
  //バスアニメーション指示係
  const [bus01Frame, setBus01Frame] = useState(Frame.IDLE);

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

    const { background, bus01 } = imagesRef.current;

    //一回画面をきれいにする。
    ctx.clearRect(0, 0, 1920, 1080);

    //背景
    ctx.drawImage(background, 0, 0);

    //バス1号
    const frameWidth = 256;   //バス横
    const frameHeight = 128; //バス縦

    const sx = bus01Frame * frameWidth;       //アニメーション用の場所指定してるよ。
    const sy = bus01Direction * frameHeight;  //どこ向いてるかな？？によって切り取る場所を変えるよ。

    ctx.drawImage(
      bus01,

      sx,
      sy,
      frameWidth,
      frameHeight,


      bus01Position.x - frameWidth / 2,
      bus01Position.y - frameHeight / 2,
      frameWidth,
      frameHeight,
    );
  }

  function handleClick(event) {
    const x = event.nativeEvent.offsetX / scale;
    const y = event.nativeEvent.offsetY / scale;

    bus01TargetRef.current = {
      x,
      y,
    };

    //音鳴らしちゃうよ。
    soundsRef.current.busHorn.currentTime = 0;
    soundsRef.current.busHorn.play();
  }

  function update() {
    setBus01Position((prev) => {
      const dx = bus01TargetRef.current.x - prev.x;
      const dy = bus01TargetRef.current.y - prev.y;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) {
          setBus01Direction(Direction.RIGHT); //右むけ！
        } else {
          setBus01Direction(Direction.LEFT);  //左むけ！
        }
      } else if (Math.abs(dx) < Math.abs(dy)) {
        if (dy > 0) {
          setBus01Direction(Direction.FRONT); //前むけ！
        } else {
          setBus01Direction(Direction.BACK);  //後ろむけ！
        }
      } else {    //45度ななめ方向の時
        if (dx > 0) {
          setBus01Direction(Direction.RIGHT); //右むけ！
        } else {
          setBus01Direction(Direction.LEFT);  //左むけ！
        }
      }

      const distance = Math.hypot(dx, dy);

      if (distance === 0) {
        return prev;
      }

      const vx = dx / distance;
      const vy = dy / distance;

      const speed = 5;

      if (distance < speed) {
        setBus01Frame(Frame.IDLE);
        return {
          x: bus01TargetRef.current.x,
          y: bus01TargetRef.current.y,
        };
      };

      //アニメーションタイマーだよ。8フレームごとにアニメーションフレームを変えてね。
      animationTimerRef.current++;
      if (animationTimerRef.current >= 8) {
        setBus01Frame((prev) => {
          return prev === Frame.IDLE
            ? Frame.MOVE
            : Frame.IDLE;
        });
        animationTimerRef.current = 0;
      }

      return {
        x: prev.x + vx * speed,
        y: prev.y + vy * speed,
      };
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

  }, [bus01Position]);

  useEffect(() => {
    const timer = setInterval(() => {

      update();

    }, 16);

    return () => clearInterval(timer);
  }, []);

  //今まで計算したやつ、ここで出てくるよ～。
  return (
    <div className="viewport">
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
    </div>
  );

}

export default GameView;