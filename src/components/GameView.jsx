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
  NPCDragConfig,
  NPCFleeConfig,
  npcMaster,
} from "../game/constants/npcMaster";
import {
  createNPC,
  isNPCJumping,
  startNPCJump,
  startNPCDrag,
  updateNPCDrag,
  endNPCDrag,
  updateNPCDragRelease,
  drawNPC,
  drawNPCs,
  updateNPCDirection,
  updateNPCAnimation,
  chooseNextNPCTarget,
  tryStartNPCFlee,
} from "../game/npc/npc";
//おうち関係者
import {
  HiyokoHouse,
  createHiyokoHouse,
  startHiyokoHouseDoor,
  updateHiyokoHouseDoor,
  drawHiyokoHouse,
  isPointInsideHiyokoHouse,
  startHiyokoHousePounce,
} from "../game/others/hiyokoHouse";

//エフェクト関係者
import {
  Effect,
  createTapSparkles,
  createHiyokoHouseSparkles,
  createStarSparkles,
  updateVisualEffects,
  drawVisualEffects,
} from "../game/effects/effect";

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
//たまご関係者
import {
  EggGame,
  createMapEgg,
  drawMapEgg,
  updateMapEgg,
  isMapEggHit,
  createEggGame,
  drawEggEvent,
  isEggEventPanelHit,
  isEggHit,
  crackEgg,
  updateEggEffectParticles,
  finishEggEvent,
} from "../game/others/eggGame";
//インク池関係者
import {
  createRandomColorPuddles,
  drawColorPuddle,
  updateColorPuddleCollision,
} from "../game/others/colorPuddle";

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
      createNPC("hiyoko", 800, 500),
      createNPC("hiyoko", 1100, 600),
      createNPC("hiyoko", 1400, 450),
      createNPC("hiyoko", 1700, 550),
    ].filter(Boolean);
  }

  //ひよこ長押し・摘まみ操作の管理人
  const npcPointerRef = useRef({
    npc: null,
    pointerId: null,
    timerId: null,
    isDragging: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
  });


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

  //たまご管理人
  const eggGameRef = useRef(
    createEggGame()
  );

  //おうち管理人
  const hiyokoHouseRef = useRef(null);
  if (hiyokoHouseRef.current === null) {
    hiyokoHouseRef.current = createHiyokoHouse();
  }

  //いろんなエフェクト管理人
  const visualEffectsRef = useRef([]);



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

      //バスに乗っているひよこは触れない
      if (npc.behavior.type === NPCBehaviorType.RIDE_BUS) {
        continue;
      }

      //ひよこおさわり判定。見た目より少し大きめにして誤タップを減らす
      const centerX = npc.position.x;
      const centerY = npc.position.y - master.drawHeight / 2;
      const radius =
        Math.max(master.drawWidth, master.drawHeight) / 2 +
        NPCDragConfig.HIT_RADIUS_PADDING;

      const dx = x - centerX;
      const dy = y - centerY;

      if (dx * dx + dy * dy <= radius * radius) {
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

      //摘まんでいる間は通常のNPC処理を止める
      if (npc.drag.isDragging) {
        npc.frame = 0;
        continue;
      }

      //慣性移動が終わったら、着地のぽよんを再生
      if (npc.action.type === "dragLanding") {
        const elapsed = now - npc.action.startTime;

        if (elapsed >= npc.action.duration) {
          npc.action.type = null;
          npc.waitUntil = now + 120;
        } else {
          npc.frame = 0;
          continue;
        }
      }

      //摘まんで離した直後は少しだけ慣性で滑る
      if (
        npc.drag.releaseVelocityX !== 0 ||
        npc.drag.releaseVelocityY !== 0
      ) {
        updateNPCDragRelease(npc, deltaTime);
        npc.frame = 0;

        if (
          npc.drag.releaseVelocityX === 0 &&
          npc.drag.releaseVelocityY === 0
        ) {
          npc.waitUntil = now + 120;
        }

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
          updateNPCBoarding(
            npc,
            vehicle,
            now,
            soundManagerRef.current,
            npcsRef.current
          );
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

    const worldPosition = screenToWorld(
      x,
      y,
      cameraRef.current
    );

    const npc = getTappedNPC(
      worldPosition.x,
      worldPosition.y
    );

    //ひよこを触っているなら、まず長押し待ち
    if (npc) {
      const npcPointer = npcPointerRef.current;

      npcPointer.npc = npc;
      npcPointer.pointerId = event.pointerId;
      npcPointer.isDragging = false;

      if (npcPointer.timerId !== null) {
        clearTimeout(npcPointer.timerId);
      }

      npcPointer.timerId = setTimeout(() => {
        const current = npcPointerRef.current;

        if (
          current.npc !== npc ||
          current.pointerId !== event.pointerId
        ) {
          return;
        }

        const movedDistance = Math.hypot(
          current.lastX - current.startX,
          current.lastY - current.startY
        );

        if (movedDistance > 20) {
          return;
        }

        const currentX =
          current.lastX ?? x;
        const currentY =
          current.lastY ?? y;
        const currentWorld = screenToWorld(
          currentX,
          currentY,
          cameraRef.current
        );

        startNPCDrag(
          npc,
          currentWorld.x,
          currentWorld.y,
          performance.now(),
          soundManagerRef.current,
        );

        current.isDragging = true;
        cameraDragRef.current.wasDragging = true;
      }, NPCDragConfig.HOLD_TIME);

      npcPointer.startX = x;
      npcPointer.startY = y;
      npcPointer.lastX = x;
      npcPointer.lastY = y;

      //カメラは動かさない
      cameraDragRef.current = {
        isDragging: false,
        startX: x,
        startY: y,
        lastX: x,
        lastY: y,
        velocityX: 0,
        velocityY: 0,
        wasDragging: false,
      };

      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Pointer Capture非対応時はそのまま続行
      }

      return;
    }


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

    const x =
      event.nativeEvent.offsetX / scale;

    const y =
      event.nativeEvent.offsetY / scale;

    const npcPointer = npcPointerRef.current;

    //ひよこの長押し待ち／摘まみ中
    if (
      npcPointer.npc &&
      npcPointer.pointerId === event.pointerId
    ) {
      const moveDistance = Math.hypot(
        x - npcPointer.startX,
        y - npcPointer.startY
      );

      npcPointer.lastX = x;
      npcPointer.lastY = y;

      if (npcPointer.isDragging) {
        const worldPosition = screenToWorld(
          x,
          y,
          cameraRef.current
        );

        updateNPCDrag(
          npcPointer.npc,
          worldPosition.x,
          worldPosition.y,
          performance.now()
        );
        return;
      }

      //長押し成立前に動かしたら、通常のカメラドラッグへ戻す
      if (moveDistance > 20) {
        if (npcPointer.timerId !== null) {
          clearTimeout(npcPointer.timerId);
        }

        npcPointer.npc = null;
        npcPointer.pointerId = null;
        npcPointer.timerId = null;

        cameraDragRef.current = {
          ...cameraDragRef.current,
          startX: x,
          startY: y,
          lastX: x,
          lastY: y,
          isDragging: true,
          wasDragging: true,
          velocityX: 0,
          velocityY: 0,
        };

        return;
      }

      return;
    }



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

    const deltaX =
      x - drag.lastX;

    const deltaY =
      y - drag.lastY;


    //動かした距離
    const distance =
      Math.hypot(
        x - drag.startX,
        y - drag.startY
      );

    //動かした距離が短い時はたっぷ判定、一定以上動いたらドラッグ開始
    if (!drag.isDragging) {
      if (distance < 20) {
        drag.lastX = x;
        drag.lastY = y;

        //まだドラッグしていないので、慣性も発生させない
        drag.velocityX = 0;
        drag.velocityY = 0;

        return;
      }

      drag.isDragging = true;
      drag.wasDragging = true;
    }

    //最後にどれくらい動いたか覚える
    drag.velocityX = deltaX;
    drag.velocityY = deltaY;


    //カメラをドラッグした分だけ動かす
    moveCamera(
      -deltaX,
      -deltaY
    );

    drag.lastX = x;
    drag.lastY = y;
  }

  //指、離した。
  function handlePointerUp(event) {
    const npcPointer = npcPointerRef.current;

    //ひよこを摘まんでいる指かどうか確認
    if (
      npcPointer.npc &&
      npcPointer.pointerId === event.pointerId
    ) {

      //タイマー初期化
      if (npcPointer.timerId !== null) {
        clearTimeout(npcPointer.timerId);
      }

      if (npcPointer.isDragging) {

        // 指を離した位置をワールド座標に変換
        const x = event.nativeEvent.offsetX / scale;
        const y = event.nativeEvent.offsetY / scale;
        const worldPosition = screenToWorld(x, y, cameraRef.current);

        // お家の中で離したか確認
        const isInsideHouse = isPointInsideHiyokoHouse(
          worldPosition.x,
          worldPosition.y,
          hiyokoHouseRef.current
        );

        //お家の中なら
        if (isInsideHouse) {

          // ひよこお片付け成功！       
          const now = performance.now();

          //おかたづけ
          npcsRef.current = npcsRef.current.filter(
            (item) => item !== npcPointer.npc
          );

          //あたらしいいのち
          const newNPC = createNPC("hiyoko");
          if (newNPC) {
            npcsRef.current.push(newNPC);
          }

          //ぽよん
          startHiyokoHousePounce(
            hiyokoHouseRef.current,
            now
          );
          // お家にひよこを1羽追加
          hiyokoHouseRef.current.hiyokoCount++;
          //おうちの見た目変更
          hiyokoHouseRef.current.frame =
            Math.floor(Math.random() * 7) + 1;
          //きらきらエフェクト
          createHiyokoHouseSparkles(
            hiyokoHouseRef.current.position.x,
            hiyokoHouseRef.current.position.y,
            now,
            visualEffectsRef.current
          );
          //♪きらりん
          soundManagerRef.current.play("kirari");

        } else {
          // 通常のひよこつまみ終了
          endNPCDrag(npcPointer.npc);
          cameraDragRef.current.wasDragging = true;
        }
      }

      npcPointer.npc = null;
      npcPointer.pointerId = null;
      npcPointer.timerId = null;
      npcPointer.isDragging = false;

      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // Pointer Capture非対応時はそのまま続行
      }

      return;
    }

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


    //座標チェック（スクリーン座標）
    const x = event.nativeEvent.offsetX / scale;
    const y = event.nativeEvent.offsetY / scale;

    //世界座標を取得
    const worldPosition = screenToWorld(
      x,
      y,
      cameraRef.current
    );

    const now = performance.now();


    //たまごイベント中？
    const eggEvent = eggGameRef.current.event;
    if (eggEvent.active) {

      //たまごの割れ具合をチェック
      if (eggEvent.eggFrame === 4) {

        //イベント完了処理
        //たまご座標取得
        const eggX = eggEvent.eggX;
        const eggY = eggEvent.eggY;

        eggGameRef.current.mapEgg = null;

        const newNPC = createNPC("hiyoko", eggX, eggY);
        if (newNPC) {
          npcsRef.current.push(newNPC);
        }

        createStarSparkles(
          eggX,
          eggY - 50,    //たまご座標は足元基準なので　-50で中心へ
          now,
          visualEffectsRef.current
        );

        soundManagerRef.current.play("hiyokoNoru"); //♪ぴよ
        finishEggEvent(eggEvent);

        return;
      }

      const isPanelHit = isEggEventPanelHit(
        x,
        y,
        Screen.WIDTH,
        Screen.HEIGHT
      );

      //UIの外を触った？
      if (!isPanelHit) {
        eggEvent.active = false;
        eggEvent.startTime = null;

        return;
      }

      //いべんとたまごをタップした？
      const isEggTapped = isEggHit(
        x,
        y,
        Screen.WIDTH,
        Screen.HEIGHT
      );

      if (!isEggTapped) {
        return;
      }

      crackEgg(
        eggEvent,
        x,
        y,
        now,
        eggEvent.effectParticles,
        imagesRef.current.eggEventEffect01,
        Screen.WIDTH / 2,
        Screen.HEIGHT / 2
      );

      if (eggEvent.eggFrame > 0 && eggEvent.eggFrame < 4) {
        //♪ﾊﾟｷｯ
        soundManagerRef.current.play("eggCrack");
      } else {
        soundManagerRef.current.play("hiyokoUmareta01");
        soundManagerRef.current.play("hiyokoUmareta02");
      }

      return;


    }

    //マップのたまごを触ったかな？
    const mapEgg = eggGameRef.current.mapEgg;
    if (
      isMapEggHit(
        worldPosition.x,
        worldPosition.y,
        mapEgg,
        imagesRef.current.egg01
      )
    ) {
      eggGameRef.current.event.active = true;
      eggGameRef.current.event.startTime = performance.now();
      eggGameRef.current.event.eggX = eggGameRef.current.mapEgg.x;
      eggGameRef.current.event.eggY = eggGameRef.current.mapEgg.y;
      eggGameRef.current.event.rotation = EggGame.EVENT_APPEAR_START_ROTATION;
      eggGameRef.current.event.offsetY = EggGame.EVENT_APPEAR_START_OFFSET_Y;
      eggGameRef.current.event.eggDropStartTime = null;
      eggGameRef.current.event.eggFrame = 0;

      soundManagerRef.current.play("eggEventStart");
      soundManagerRef.current.play("eggSet");

      console.log("卵イベント開始！");
      return;
    }

    //ひよこのおうちを触ったかな？
    if (
      isPointInsideHiyokoHouse(
        worldPosition.x,
        worldPosition.y,
        hiyokoHouseRef.current
      )
    ) {
      //ひよこがお家にいるかな？
      if (
        hiyokoHouseRef.current.hiyokoCount > 0
      ) {
        startHiyokoHouseDoor(
          hiyokoHouseRef.current,
          now,
          soundManagerRef.current
        );

      } else {
        // ノック音だけ
        soundManagerRef.current.play("doorKnock");
      }
      return;
    }

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
          visualEffectsRef.current);  //きらきら～
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
      menu.isOpen || menu.progress > 0;
    //メニュー見えてるかな？
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
              visualEffectsRef.current
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


  //くるまの描画Yを決める係
  function getVehicleDrawY(vehicle) {
    const master = vehicleMaster[vehicle.type];

    return (
      vehicle.position.y +
      master.height / 2
    );
  }
  //電車の描画Yを決める係
  function getTrainDrawY(train) {
    return (
      train.y +
      Railway.TRAIN_HEIGHT / 2
    );
  }
  //踏切の描画Yを決める係
  function getCrossingDrawY(crossing) {
    return (
      Railway.CROSSING_Y +
      Railway.CROSSING_HEIGHT / 2
    );
  }

  //お家の描画Yを決める係
  function getHiyokoHouseDrawY(house) {
    return (
      house.position.y +
      HiyokoHouse.HEIGHT / 2
    );
  }

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


    //------------ここからYソート対象----------------

    const drawGroups = [];

    //NPCを1つずつ描画グループに登録
    for (const npc of npcsRef.current) {
      const isDragging =
        npcPointerRef.current.npc === npc &&
        npcPointerRef.current.isDragging;

      drawGroups.push({
        type: "npc",
        drawY: isDragging
          ? Number.POSITIVE_INFINITY
          : npc.position.y,
        object: npc,
      });
    }

    //動かすのりものを描画グループに登録
    const vehicle = vehiclesRef.current[0];
    drawGroups.push({
      type: "vehicle",
      drawY: getVehicleDrawY(vehicle),
      object: vehicle,
    });

    //電車を描画グループに登録
    const train = railwayRef.current.train;
    drawGroups.push({
      type: "train",
      drawY: getTrainDrawY(train),
      object: train,
    });

    //踏切を描画グループに登録
    const crossing = railwayRef.current.crossing;
    drawGroups.push({
      type: "crossing",
      drawY: getCrossingDrawY(crossing),
      object: crossing,
    });

    //おうち登録
    const hiyokoHouse = hiyokoHouseRef.current;
    drawGroups.push({
      type: "hiyokoHouse",
      drawY: getHiyokoHouseDrawY(hiyokoHouse),
      object: hiyokoHouse,
    });

    //まっぷたまごを描画グループに登録
    const egg = eggGameRef.current.mapEgg;
    if (egg) {
      drawGroups.push({
        type: "egg",
        drawY: egg.y,
        object: egg,
      });
    }

    //★描画Yが小さい順に並べる
    drawGroups.sort(
      (a, b) => a.drawY - b.drawY
    );

    //Y座標順に描画
    for (const group of drawGroups) {

      switch (group.type) {

        case "npc":
          const master = npcMaster[group.object.type];
          if (!master) {
            break;
          }

          const image = imagesRef.current[master.imageKey];
          drawNPC(
            ctx,
            group.object,
            now,
            image,
            cameraRef.current
          );
          break;

        case "vehicle":
          drawVehicle(
            ctx,
            group.object,
            now
          );

          if (group.object.type === "fireEngine") {
            drawFireFightHiyokoShadow(
              ctx,
              group.object,
              now,
              cameraRef.current
            );
            drawFireFightHiyoko(
              ctx,
              group.object,
              now,
              imagesRef.current.fireFightAction01,
              cameraRef.current
            );
            drawFireFightWater(
              ctx,
              group.object,
              now,
              imagesRef.current.fireFightAction02,
              cameraRef.current
            );
          }
          break;

        case "train":
          drawTrain(
            ctx,
            imagesRef.current.train01,
            group.object,
            cameraRef.current
          );
          drawTrainPassengers(
            ctx,
            now,
            group.object,
            trainPassengersRef.current,
            (imageKey) => imagesRef.current[imageKey],
            cameraRef.current
          );
          break;

        case "crossing":
          drawCrossing(
            ctx,
            imagesRef.current.crossing01,
            group.object,
            cameraRef.current
          );
          break;

        case "hiyokoHouse":
          drawHiyokoHouse(
            ctx,
            imagesRef.current.hiyokoHouse01,
            imagesRef.current.hiyokoHouseDoor01,
            group.object,
            cameraRef.current,
            now
          );
          break;

        case "egg":
          drawMapEgg(
            ctx,
            imagesRef.current.egg01,
            group.object,
            cameraRef.current
          );
          break;
      }
    }

    //----------------  ↑↑  Y基準ソートここまで  ↑↑  ------------------------

    //----------------  ↓↓  前面固定  ↓↓  ------------------------------

    //しゃぼんだま描画係
    drawBubbles(
      ctx,
      now,
      bubbleGameRef.current,
      imagesRef.current.bubble,
      imagesRef.current.bubblePop
    );
    //タップエフェクト描画係
    drawVisualEffects(
      ctx,
      now,
      visualEffectsRef.current,
      imagesRef.current.tEffect01,
      cameraRef.current,
      {
        starEffect01: imagesRef.current.starEffect01,
        starEffect02: imagesRef.current.starEffect02,
        starEffect03: imagesRef.current.starEffect03,
      }
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
    drawEggEvent(
      ctx,
      imagesRef.current.eggEvent01,
      imagesRef.current.eggEvent02,
      imagesRef.current.eggEventEffect02,
      eggGameRef.current.event,
      Screen.WIDTH,
      Screen.HEIGHT,
      now
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

    const eggEvent = eggGameRef.current.event;

    //たまごイベント中？
    if (eggEvent.active) {
      eggEvent.effectParticles =
        updateEggEffectParticles(
          now,
          deltaTime,
          eggEvent.effectParticles
        );
    }
    //通常時
    else {
      updateCameraInertia();
      updateVehicle(now, deltaTime);
      updateNPCs(now, deltaTime);
      updateHiyokoHouseDoor(
        hiyokoHouseRef.current,
        now,
        soundManagerRef.current
      );
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
      updateVisualEffects(now, deltaTime, visualEffectsRef.current);
      updateBubbles(now, deltaTime, bubbleGameRef.current);
      updateMapEgg(eggGameRef.current.mapEgg, now);

    }

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
      "starEffect01", "starEffect02", "starEffect03",


      "tHiyoko", "tCat01", "tCat02", "tCat03",

      "puddle01", "puddle02", "puddle03", "puddle04",
      "puddle05", "puddle06", "puddle07", "puddle08",

      "npcHiyoko01",
      "hiyokoHouse01", "hiyokoHouseDoor01",

      "menuBackground01",
      "menuTag01",
      "selectAnimation01",

      "railway01",
      "bubble", "bubblePop",

      "egg01",
      "eggEvent01", "eggEvent02",
      "eggEventEffect01", "eggEventEffect02",
    ];

    //読み込み進捗君。全部揃ったら描いてくれる。
    let loaded = 0;

    function imageLoaded() {
      loaded++;

      if (loaded === imageNames.length) {
        createMapBubble(bubbleGameRef.current);
        eggGameRef.current.mapEgg = createMapEgg(1200, 700);
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
      "hiyokoNoru", "hiyokotsumami",

      "hiyokoUmareta01", "hiyokoUmareta02", "eggEventStart", "eggCrack",

      "kirari", "doorKnock", "doorOpen", "doorClose",

      "bubble", "bubblePop01", "bubblePop02", "bubblePop03",

      "eggEventStart", "eggSet", "eggCrack", "hiyokoUmareta01", "hiyokoUmareta02",

    ];

    Promise.all(soundNames.map((name) => soundManager.load(name, `${import.meta.env.BASE_URL}sounds/${name}.mp3`)))
      .then(() => {
        console.log("効果音の読み込み完了");
      })
      .catch((error) => {
        console.error("効果音の読み込みに失敗しました", error);
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