import { useState, useEffect, useRef } from "react";
import { VERSION } from "../version";
import SoundManager from "../SoundManager";

//ゲーム内共通
import {
  getRandomNumber,
  clamp,
} from "../game/utils/math";
import {
  drawShadow,
  worldToScreen,
  screenToWorld,
} from "../game/utils/draw";

//世界とカメラの情報
import {
  Map,
  Screen,
} from "../game/constants/mapConfig";


//車基本ステータス
import {
  Direction,
  Frame,
  State,
  vehicleMaster,
} from "../game/constants/vehicleMaster";

//車メニュー関係者
import {
  getVehicleMenuTabRect,
  toggleVehicleMenu,
  updateVehicleMenu,
  getVehicleMenuVehicles,
  drawVehicleMenuTab,
  drawVehicleMenu,
} from "../game/vehicleMenu";

//NPC関係者
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

//エフェクト関係者
import {
  Effect,
  createTapSparkles,
  updateTapEffects,
  drawTapEffects,
} from "../game/effects/tapEffect";

//電車関係者
import {
  Railway,
  railwayMap,
} from "../game/constants/railwayConfig";
import {
  drawRailways,
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



//車アクション関係者
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
//シャボン玉関係者
import {
  BubbleGame,
  createMapBubble,
  drawMapBubble,
  startBubbleGame,
  updateBubbles,
  drawBubbles,
} from "../game/others/bubbleGame";
//インク池関係者
import {
  createRandomColorPuddles,
  drawColorPuddle,
  updateColorPuddleCollision,
} from "../game/others/colorPuddle";

const CAMERA_EDGE_BOUNCE = 0.3;

//ゲームの中身を描いてるところだよ。
function GameView() {


  //========画面管理人たち========

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



  //========ゲーム状態管理人たち========

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

  const vehiclesRef = useRef(vehicles); //車の情報

  //ひよこ管理人
  const npcsRef = useRef(null);

  if (!npcsRef.current) {
    npcsRef.current = [
      createNPC("hiyoko", 500, 540),
    ].filter(Boolean);
  }

  const imagesRef = useRef({});

  //カメラ座標管理人
  const cameraRef = useRef({
    x: 1000,
    y: 0,
  });

  //カメラ移動管理人
  const cameraDragRef = useRef({
    isDragging: false,
    wasDragging: false,

    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,

    velocityX: 0,
    velocityY: 0,

    edgeX: 0,   //-1 → 左端、 0 → 端ではない、+1 → 右端
    edgeY: 0,   //-1 → 上端、 0 → 端ではない、+1 → 下端

    edgePushX: 0,
    edgePushY: 0,
  });


  // ======== オブジェクト管理人たち ========

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

  //タップエフェクト管理人
  const tapEffectsRef = useRef([]);



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
      y: 0,

      railwayOffset: {
        y: 15,
      },

      startTime: 0,
    },
  });

  //乗客管理人
  const trainPassengersRef = useRef([]);


  //========メニュー管理人たち========
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


  // ======== システムマネージャーさんたち ========
  //音響担当
  const soundManagerRef = useRef(null);
  if (!soundManagerRef.current) {
    soundManagerRef.current = new SoundManager();
  }
  //アニメーション担当
  const animationTimerRef = useRef(0);


  //======== FPS管理人たち ========
  const fpsRef = useRef(null);
  const fpsDataRef = useRef({
    lastReportTime: performance.now(),
    previousFrameTime: null,
    frames: 0,
    maxFrameGap: 0,
    droppedFrames: 0,
  });
  const fpsDisplayRef = useRef(null);

  ////////////////////////////////////////////////////////////////////////
  //
  //                    ココから職人たち
  //
  ////////////////////////////////////////////////////////////////////////

  //ランダム再生係
  function playRandomSound(soundNames) {
    const soundName =
      soundNames[Math.floor(Math.random() * soundNames.length)];

    soundManagerRef.current.play(soundName);
  }


  //===============================
  //          当たり判定
  //===============================
  //付箋とかおさわりチェック係
  function isPointInsideRect(x, y, rect) {
    return (
      x >= rect.x &&
      x <= rect.x + rect.width &&
      y >= rect.y &&
      y <= rect.y + rect.height
    );
  }

  //車おさわりチェック係
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


  //===============================
  //            車本部
  //===============================
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


  //のりもの監督
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
      updateColorPuddleCollision(vehicle, colorPuddlesRef.current);
      updateEffect(vehicle, now);
      updateFireFightAction(vehicle, now, soundManagerRef.current);
      updatePoliceCarAction(vehicle, now);


      newVehicles[0] = vehicle;
      return newVehicles;
    });
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


  //=================================
  //　　　   ひよこたち監督
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


  //=================================
  //　　　       入力
  //=================================

  //指、置いた。
  function handlePointerDown(event) {
    const x =
      event.nativeEvent.offsetX / scale;

    const y =
      event.nativeEvent.offsetY / scale;

    cameraDragRef.current = {
      isDragging: false,

      startX: x,
      startY: y,

      lastX: x,
      lastY: y,

      velocityX: 0,   //リセット！
      velocityY: 0,
      
      edgePushX: 0,
      edgePushY: 0,
    };
  }

  //指、動かした。
  function handlePointerMove(event) {
    const drag = cameraDragRef.current;
    if (!event.buttons) {
      return;
    }

    if (
      drag.startX == null ||
      drag.startY == null
    ) {
      return;
    }

    const x =
      event.nativeEvent.offsetX / scale;

    const y =
      event.nativeEvent.offsetY / scale;

    const deltaX =
      x - drag.lastX;

    const deltaY =
      y - drag.lastY;

    //最後にどれくらい動いたか覚える
    drag.velocityX = deltaX;
    drag.velocityY = deltaY;

    //動かした距離
    const distance =
      Math.hypot(
        x - drag.startX,
        y - drag.startY
      );

    //動かした距離が短い時はたっぷ判定、一定以上動いたらドラッグ開始
    if (!drag.isDragging) {
      if (distance < 5) {
        return;
      }

      drag.isDragging = true;
      drag.wasDragging = true;
    }

    //マップの端を押しているか
    const pushingEdgeX =
      (drag.edgeX === -1 && deltaX < 0) ||
      (drag.edgeX === 1 && deltaX > 0);

    const pushingEdgeY =
      (drag.edgeY === -1 && deltaY < 0) ||
      (drag.edgeY === 1 && deltaY > 0);


    //カメラをドラッグした分だけ動かす
    moveCamera(
      -deltaX,
      -deltaY
    );

    drag.lastX = x;
    drag.lastY = y;
  }

  //指、離した。
  function handlePointerUp() {
    cameraDragRef.current.isDragging = false;
  }



  //タップ
  async function handleClick(event) {

    //AudioContext起きて！
    try {
      await soundManagerRef.current.resume();
    } catch (error) {
      console.error("音声の準備に失敗しました", error);
    }

    //直前の操作がドラッグならクリックしない
    if (cameraDragRef.current.wasDragging) {
      cameraDragRef.current.wasDragging = false;
      return;
    }


    //座標チェック（カメラ座標）
    const x = event.nativeEvent.offsetX / scale;
    const y = event.nativeEvent.offsetY / scale;

    //世界座標を取得
    const worldPosition = screenToWorld(
      x,
      y,
      cameraRef.current
    );

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
    if (getTappedMapBubble(worldPosition.x, worldPosition.y)) {
      startBubbleGame(now, bubbleGameRef.current);
      soundManagerRef.current.play("bubble");
      return;
    }


    //ひよこを触ったかな？
    const tappedNPC =
      getTappedNPC(worldPosition.x, worldPosition.y);

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
      if (
        isPointInsideRect(
          worldPosition.x,
          worldPosition.y,
          trainRect
        )
      ) {

        const carIndex = getTappedTrainCarIndex(
          worldPosition.x,
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

        createTapSparkles(
          worldPosition.x,
          worldPosition.y,
          now,
          tapEffectsRef.current);  //きらきら～
        return;

      }
    }

    const crossingRect = getCrossingRect();

    if (
      isPointInsideRect(
        worldPosition.x,
        worldPosition.y,
        crossingRect
      )) {

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

    const tabRect = getVehicleMenuTabRect(vehicleMenuRef.current);  //付箋おさわりチェック

    if (isPointInsideRect(x, y, tabRect)) {   //触ってたらメニューをだして！車は動かさないよ。
      soundManagerRef.current.play("menuOpen01");      //メニュー音
      toggleVehicleMenu(now, vehicleMenuRef.current);


      return;
    }

    const menu = vehicleMenuRef.current;

    const menuIsVisible =
      menu.isOpen || menu.progress > 0; //メニュー見えてるかな？

    if (menuIsVisible) {
      const menuVehicles = getVehicleMenuVehicles(vehicleMenuRef.current);

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

    //君は消防車？
    if (vehicle.type === "fireEngine") {
      const vehicleRect = getVehicleRect(vehicle);

      if (
        isPointInsideRect(
          worldPosition.x,
          worldPosition.y,
          vehicleRect
        )
      ) {

        const isActionRunning =
          vehicle.actionState?.hiyoko?.jumpStartTime != null;

        if (isActionRunning) {
          const hiyokoPosition =
            getFireFightHiyokoPosition(vehicle, now);

          if (hiyokoPosition) {
            createTapSparkles(
              hiyokoPosition.x,
              hiyokoPosition.y,
              now,
              tapEffectsRef.current
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


    //君はパトカー？
    if (vehicle.type === "policeCar") {
      const vehicleRect = getVehicleRect(vehicle);

      if (
        isPointInsideRect(
          worldPosition.x,
          worldPosition.y,
          vehicleRect
        )
      ) {
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

      vehicle.target = {
        x: worldPosition.x,
        y: worldPosition.y,
      };
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


  //=================================
  //　　　       描画
  //=================================

  //のりもの描画係
  function drawVehicle(ctx, vehicle, now) {
    const master = vehicleMaster[vehicle.type];
    const shadow = master.shadow;

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

    //カメラ座標に変換
    const screenPosition = worldToScreen(
      vehicle.position.x,
      vehicle.position.y,
      cameraRef.current
    );

    const drawWidth = frameWidth * vehicle.transform.scaleX;
    const drawHeight = frameHeight * vehicle.transform.scaleY;


    // 影
    drawShadow(
      ctx,
      screenPosition.x,
      screenPosition.y + shadow.offsetY,
      shadow.width,
      shadow.height
    );

    ctx.drawImage(
      image,

      sx,
      sy,
      frameWidth,
      frameHeight,

      screenPosition.x - drawWidth / 2,
      screenPosition.y - drawHeight / 2,
      drawWidth,
      drawHeight,
    );
  }


  //描画本部

  function draw(ctx, now) {
    const background = imagesRef.current.background02;

    //一回画面をきれいにする。
    ctx.clearRect(0, 0, 1920, 1080);

    //背景描いてる部署
    const camera = cameraRef.current;
    ctx.drawImage(
      background,
      -camera.x,
      -camera.y
    );

    //線路描画係
    drawRailways(
      ctx,
      railwayMap,
      imagesRef.current.railway01,
      cameraRef.current
    );

    //インク池描画係
    for (const puddle of colorPuddlesRef.current) {
      drawColorPuddle(
        ctx,
        puddle,
        imagesRef.current[puddle.imageName],
        cameraRef.current
      );
    }

    //しゃぼんだま配置
    drawMapBubble(
      ctx,
      bubbleGameRef.current,
      imagesRef.current.bubble,
      cameraRef.current
    );

    //NPC描画係
    drawNPCs(
      ctx,
      npcsRef.current,
      now,
      (imageKey) => imagesRef.current[imageKey],
      cameraRef.current
    );

    //動かすのりもの描画係
    const vehicle = vehiclesRef.current[0];
    drawVehicle(ctx, vehicle, now);

    if (vehicle.type === "fireEngine") {
      drawFireFightHiyokoShadow(
        ctx,
        vehicle,
        now,
        cameraRef.current
      );
      drawFireFightHiyoko(
        ctx,
        vehicle,
        now,
        imagesRef.current.fireFightAction01,
        cameraRef.current
      );
      drawFireFightWater(
        ctx,
        vehicle,
        now,
        imagesRef.current.fireFightAction02,
        cameraRef.current
      );
    }

    //電車描画係
    drawTrain(
      ctx,
      imagesRef.current.train01,
      railwayRef.current.train,
      cameraRef.current
    );
    //電車の乗客描画係
    drawTrainPassengers(
      ctx,
      now,
      railwayRef.current.train,
      trainPassengersRef.current,
      (imageKey) => imagesRef.current[imageKey],
      cameraRef.current
    );
    //踏切描画係
    drawCrossing(
      ctx,
      imagesRef.current.crossing01,
      railwayRef.current.crossing,
      cameraRef.current
    );
    //しゃぼんだま描画係
    drawBubbles(
      ctx,
      now,
      bubbleGameRef.current,
      imagesRef.current.bubble,
      imagesRef.current.bubblePop
    );
    //タップエフェクト描画係
    drawTapEffects(
      ctx,
      now,
      tapEffectsRef.current,
      imagesRef.current.tEffect01,
      cameraRef.current
    );
    //メニュー描画係
    drawVehicleMenu(
      ctx,
      now,
      vehicleMenuRef.current,
      imagesRef.current,
      vehiclesRef.current,
      vehicleSelectEffectRef.current
    );
    drawVehicleMenuTab(
      ctx,
      vehicleMenuRef.current,
      imagesRef.current.menuTag01

    );
  }


  //===============================
  //          カメラ本部
  //===============================

  //カメラを移動する係
  function moveCamera(dx, dy) {
    const camera = cameraRef.current;
    const drag = cameraDragRef.current;

    const nextX = camera.x + dx;
    const nextY = camera.y + dy;

    //マップの端にぶつかったかチェック
    if (nextX < 0) {
      drag.edgeX = -1;
    } else if (
      nextX > Map.WIDTH - Screen.WIDTH
    ) {
      drag.edgeX = 1;
    } else {
      drag.edgeX = 0;
    }

    if (nextY < 0) {
      drag.edgeY = -1;
    } else if (
      nextY > Map.HEIGHT - Screen.HEIGHT
    ) {
      drag.edgeY = 1;
    } else {
      drag.edgeY = 0;
    }

    camera.x = nextX;
    camera.y = nextY;

    //マップの外には出ない
    camera.x = clamp(
      camera.x,
      0,
      Map.WIDTH - Screen.WIDTH
    );

    camera.y = clamp(
      camera.y,
      0,
      Map.HEIGHT - Screen.HEIGHT
    );
  }

  //カメラの慣性を動かす係
  function updateCameraInertia() {
    const drag = cameraDragRef.current;

    if (drag.isDragging) {
      return;
    }

    if (
      drag.velocityX === 0 &&
      drag.velocityY === 0
    ) {
      return;
    }

    moveCamera(
      -drag.velocityX,
      -drag.velocityY
    );

    //減速係数
    const friction = 0.9;
    //だんだんゆっくり
    drag.velocityX *= friction;
    drag.velocityY *= friction;

    //十分小さくなったら完全停止
    if (
      Math.abs(drag.velocityX) < 0.1 &&
      Math.abs(drag.velocityY) < 0.1
    ) {
      drag.velocityX = 0;
      drag.velocityY = 0;
    }
  }

  //=================================
  //　　　    現場監督
  //=================================
  function update(now, deltaTime) {
    updateCameraInertia();
    updateVehicle(now, deltaTime);
    updateNPCs(now, deltaTime);
    updateVehicleMenu(now, vehicleMenuRef.current);
    updateCrossing(now, railwayRef.current.crossing);
    updateTrain(
      now,
      deltaTime,
      railwayRef.current.train,
      railwayRef.current.crossing,
      soundManagerRef.current,
      trainPassengersRef.current
    );
    updateTapEffects(now, tapEffectsRef.current);
    updateBubbles(
      now,
      deltaTime,
      bubbleGameRef.current
    );

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
      "background02",

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

      "railway01",
      "bubble", "bubblePop",
    ];

    //読み込み進捗君。全部揃ったら描いてくれる。
    let loaded = 0;

    function imageLoaded() {
      loaded++;

      if (loaded === imageNames.length) {
        createMapBubble(bubbleGameRef.current);
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

  //車情報をRefに同期
  useEffect(() => {
    vehiclesRef.current = vehicles;
  }, [vehicles]);

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
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
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