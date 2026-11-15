import { useEffect, useRef } from "react";
import {
  loadHomeImages,
  loadHomeSounds,
} from "../homeMode/homeAssets";
import {
  createSkyState,
  updateSky,
  drawSky
} from "../homeMode/homeSky";
import { createHomeScene } from "../homeMode/homeScene";
import { createHomeUI } from "../homeMode/homeUI";
import { createHomeLoop } from "../homeMode/homeLoop";



//===========================================
// おうちモード
//===========================================

function HomeMode({ onExit, onReady, scale, soundManager }) {

  // 3つの描画レイヤー
  const skyCanvasRef = useRef(null);  //空　2D（背景）
  const mountRef = useRef(null);  //家 3D
  const uiCanvasRef = useRef(null); //UI 2D


  // おうちモードの状態
  const homeStateRef = useRef({
    scene: "room",  //"room"：おうちの中  "sky"：空イベント中
    event: null,
    windowShape: "square",
  });

  // 空の状態
  const skyStateRef = useRef(createSkyState());

  const containerRef = useRef(null);


  //===========================================
  // 初期化・終了処理
  //===========================================

  useEffect(() => {
    let cancelled = false;

    // 各部署の管理用
    let homeScene = null;
    let homeLoop = null;
    let homeUI = null;


    //===========================================
    // 初期化
    //===========================================
    async function initialize() {

      //画像・効果音読み込み
      const [homeImages] = await Promise.all([
        loadHomeImages(),
        loadHomeSounds(soundManager),
      ]);

      // 読み込み中に画面を離れていたら、描画を開始しない
      if (cancelled || !mountRef.current) return;

      //Canvas描画コンテキストをもらってくる
      const skyCanvas = skyCanvasRef.current;
      const uiCanvas = uiCanvasRef.current;

      const skyCtx = skyCanvas.getContext("2d");
      const uiCtx = uiCanvas.getContext("2d");

      // UIを作成
      homeUI = createHomeUI(
        uiCanvas,
        uiCtx,
        homeImages,
        {
          // 窓の形状変更
          onShapeChange: (shape) => {
            homeStateRef.current.windowShape = shape;
            homeScene?.setWindowShape(shape);
          },

          // 昼夜変更
          onDayNightChange: (mode) => {
            skyStateRef.current.mode = mode;
            soundManager.play("dayNightSwitch");  //きりかえ音
          },
          // 共通ボタン押下音
          onButtonPress: () => {
            soundManager.play("uiButtonTap");
          },

          // おうちから退出
          onExit,
        }
      );

      //3Dのお部屋を作る
      homeScene = createHomeScene(
        mountRef.current,
        homeImages,
        () => {
          homeStateRef.current.event = "window";
          homeUI.setActiveEvent("window");
          //家具選択音
          soundManager.play("furnitureSelect01");
        },
        // ズーム完了
        () => {
          homeUI.show();
        }
      );

      //===========================================
      // 入力の振り分け
      //===========================================

      function handlePointerDown(event) {
        // ① まずUIに渡す
        const uiHandled = homeUI.handlePointerDown(event);
        if (uiHandled) return;

        // ② UIでなければ3Dのお部屋に渡す
        homeScene.handlePointerDown(event);
      }

      // おうち全体で入力を受け取る
      const homeContainer = containerRef.current;

      homeContainer.addEventListener(
        "pointerdown",
        handlePointerDown
      );

      //===========================================
      // 更新処理
      //===========================================

      //-------------
      //おうち監督
      //-------------
      function updateHome(now, deltaTime) {
        // 空の更新
        updateSky(
          skyStateRef.current,
          now,
          deltaTime
        );

        // お部屋の更新
        homeScene.updateRoom(
          now,
          deltaTime
        );

        // おうちイベントの更新
        homeScene.updateHomeEvent(
          now,
          deltaTime
        );

        // UIのアニメーション更新
        homeUI.update(deltaTime);
      }

      //-----------
      //描画監督
      //-----------
      function drawHome() {
        // ① 背景の空
        drawSky(
          skyCtx,
          skyStateRef.current,
          homeImages
        );

        // ② 3Dのおうち
        homeScene.renderer.render(
          homeScene.scene,
          homeScene.camera
        );

        // ③ UI
        homeUI.draw();
      }


      //===========================================
      // ゲームループ開始
      //===========================================

      homeLoop = createHomeLoop({
        update: updateHome,
        draw: drawHome,
      });

      homeLoop.start();
      onReady?.();
    }



    //===========================================
    // 初期化実行
    //===========================================
    initialize().catch((error) => {
      if (!cancelled) {
        console.error("おうちの初期化に失敗しました", error);
      }
    });


    //===========================================
    // 終了・お片付け
    //===========================================
    return () => {
      cancelled = true;

      // ゲームループ停止
      homeLoop?.stop();

      // 入力イベントを解除
      containerRef.current?.removeEventListener(
        "pointerdown",
        handlePointerDown
      );
      // UIを片付ける
      homeUI?.dispose();
      // 3Dのお部屋を片付ける
      homeScene?.dispose();
    };

  }, []);



  //===========================================
  // 画面表示
  //===========================================

  return (
    <div
      ref={containerRef}
      className="home-container"
      style={{
        width: `${1920 * scale}px`,
        height: `${1440 * scale}px`,
      }}

    >

      {/* ① 背景：2Dの空 */}
      <canvas
        ref={skyCanvasRef}
        className="home-sky-layer"
        width={1920}
        height={1440}
      />

      {/* ② 中間：3Dのおうち */}
      <div
        ref={mountRef}
        className="home-3d-layer"
      />

      {/* ③ 最前面：2D UI */}
      <canvas
        ref={uiCanvasRef}
        className="home-ui-layer"
        width={1920}
        height={1440}
      />
    </div>
  );
}

export default HomeMode;