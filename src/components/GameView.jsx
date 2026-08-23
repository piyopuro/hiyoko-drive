import { useState, useEffect, useRef } from "react";
import { VERSION } from "../version";
import SoundManager from "../SoundManager";

//ゲーム内共通
import {
  getRandomNumber,
} from "../game/utils/math";
import {
  drawShadow,
} from "../game/utils/draw";


//車基本ステータス
import {
  Direction,
  Frame,
  State,
  vehicleMaster,
} from "../game/constants/vehicleMaster";

//車メニュー関連
import {
  VehicleMenu,
  vehicleMenuItems,
} from "../game/constants/vehicleMenu";

//NPC関連
import {
  NPCState,
  NPCBehaviorType,
  NPCFleeConfig,
  npcMaster,
} from "../game/constants/npcMaster";
import {
  createNPC,
  isNPCJumping,
  startNPCJump,
  drawNPCs,
  updateNPCDirection,
  updateNPCAnimation,
  chooseNextNPCTarget,
  tryStartNPCFlee,
} from "../game/npc/npc";

//エフェクト関連
import {
  Effect,
  TapEffect,
  colorPuddleMaster,
} from "../game/constants/gameConstants";

//電車関連
import {
  Railway,
} from "../game/constants/railwayConfig";
import {
  drawCrossing,
  drawTrain,
  drawTrainPassengers,
  getCrossingRect,
  getTrainRect,
  getTappedTrainCarIndex,
  startTrain,
  createTrainPassenger,
  updateCrossing,
  updateTrain
} from "../game/railway/railway";



//車アクション関連
import {
  tryStartNPCBoarding,
  updateNPCBoarding,
  updateNPCRidingBus,
  updateNPCExitingBus,
} from "../game/vehicle/busAction";

import {
  getFireFightHiyokoPosition,
  drawFireFightHiyoko,
  drawFireFightHiyokoShadow,
  drawFireFightWater,
  updateFireFightAction,
} from "../game/vehicle/fireEngineAction";

import {
  PoliceCarAction,
  updatePoliceCarAction,
} from "../game/vehicle/policeCarAction";

//その他
import { BubbleGame } from "../game/constants/bubbleConfig";




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

  //ランダム再生係
  function playRandomSound(soundNames) {
    const soundName =
      soundNames[Math.floor(Math.random() * soundNames.length)];

    soundManagerRef.current.play(soundName);
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
    drawNPCs(
      ctx,
      npcsRef.current,
      now,
      (imageKey) => imagesRef.current[imageKey]
    );

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
      drawFireFightHiyoko(
        ctx,
        vehicle,
        now,
        imagesRef.current.fireFightAction01
      );
      drawFireFightWater(
        ctx,
        vehicle,
        now,
        imagesRef.current.fireFightAction02
      );
    }

    //電車描画係
    drawTrain(
      ctx,
      imagesRef.current.train01,
      railwayRef.current.train
    );
    //電車の乗客描画係
    drawTrainPassengers(
      ctx,
      now,
      railwayRef.current.train,
      trainPassengersRef.current,
      (imageKey) => imagesRef.current[imageKey]
    );
    //踏切描画係
    drawCrossing(
      ctx,
      imagesRef.current.crossing01,
      railwayRef.current.crossing
    );
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

      playRandomSound([
        "bubblePop01",
        "bubblePop02",
        "bubblePop03",
      ]);


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
      const trainRect = getTrainRect(railwayRef.current.train);
      if (isPointInsideRect(x, y, trainRect)) {

        const carIndex = getTappedTrainCarIndex(
          x,
          railwayRef.current.train
        ); //車両チェック
        //乗客いるかどうかチェック
        const { isNewPassenger } =
          createTrainPassenger(
            carIndex,
            now,
            trainPassengersRef.current
          );

        if (isNewPassenger) {
          soundManagerRef.current.play("trainHorn01");
        } else {
          soundManagerRef.current.play("passengerAppear01");
        }

        createTapSparkles(x, y, now);  //きらきら～
        return;

      }
    }

    const crossingRect = getCrossingRect();

    if (isPointInsideRect(x, y, crossingRect)) {
      //電車出発準備！
      startTrain(
        now,
        railwayRef.current.train,
        railwayRef.current.crossing,
        trainPassengersRef.current,
        soundManagerRef.current
      );
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

  //タップエフェクト更新係
  function updateTapEffects(now) {
    tapEffectsRef.current =
      tapEffectsRef.current.filter((effect) => {
        const elapsed =
          now - effect.startTime;

        return elapsed < effect.duration;
      });
  }

  //=================================
  //ひよこたち監督
  //=================================
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

        const exitedBus = updateNPCExitingBus(
          npc,
          vehicle,
          now,
          soundManagerRef.current
        );

        if (exitedBus) {
          startNPCJump(npc, now);
        }

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
          updateNPCBoarding(npc, vehicle, now, soundManagerRef.current);
        if (boarded) {
          continue;
        }
      }

      //走っている車が近くにいるか確認
      tryStartNPCFlee(npc, now, vehicle);

      //通常状態のときだけバスを探す
      if (npc.behavior.type === NPCBehaviorType.WANDER) {
        tryStartNPCBoarding(npc, vehiclesRef.current[0], now);
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
      updateFireFightAction(vehicle, now, soundManagerRef.current);
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

        swayPhase: Math.random() * Math.PI * 2,

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
            (now - bubble.startTime) * bubble.swaySpeed + bubble.swayPhase
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
    updateCrossing(now, railwayRef.current.crossing);
    updateTrain(
      now,
      deltaTime,
      railwayRef.current.train,
      railwayRef.current.crossing,
      soundManagerRef.current,
      trainPassengersRef.current
    );
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

      //=============FPSチェック===============
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

      //==============ここまで===================

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