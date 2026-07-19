import { useState, useEffect, useRef } from "react";

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

  const [bus01Position, setBus01Position] = useState({
    x: 960,
    y: 540,
  });

  const bus01TargetRef = useRef({
    x: 960,
    y: 540,
  });

  const canvasRef = useRef(null);
  const imagesRef = useRef({
    background: null,
    bus01: null,
  });
  const ctxRef = useRef(null);

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
    ctx.drawImage(
      bus01,
      bus01Position.x - 128,
      bus01Position.y - 64
    );
  }

  function handleClick(event) {
    const x = event.nativeEvent.offsetX / scale;
    const y = event.nativeEvent.offsetY / scale;

    bus01TargetRef.current = {
      x,
      y,
    };
  }

  function update() {
    setBus01Position((prev) => {
      const dx = bus01TargetRef.current.x - prev.x;
      const dy = bus01TargetRef.current.y - prev.y;

      const distance = Math.hypot(dx, dy);

      if (distance === 0) {
        return prev;
      }

      const vx = dx / distance;
      const vy = dy / distance;

      const speed = 5;

      if (distance < speed) {
        return {
          x: bus01TargetRef.current.x,
          y: bus01TargetRef.current.y,
        };
      };

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