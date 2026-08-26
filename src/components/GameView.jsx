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
      y: Railway.TRAIN_Y,

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
  //おさわりチェック係
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
      startBubbleGame(now, bubbleGameRef.current);
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

        createTapSparkles(x, y, now, tapEffectsRef.current);  //きらきら～
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


  //=================================
  //　　　       描画
  //=================================
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
  
  function draw(ctx, now) {
    const background = imagesRef.current.background;

    //一回画面をきれいにする。
    ctx.clearRect(0, 0, 1920, 1080);

    //背景描いてる部署
    ctx.drawImage(background, 0, 0);

    //インク池描画係
    for (const puddle of colorPuddlesRef.current) {
      drawColorPuddle(
        ctx,
        puddle,
        imagesRef.current[puddle.imageName]
      );
    }

    //しゃぼんだま配置
    drawMapBubble(
      ctx,
      bubbleGameRef.current,
      imagesRef.current.bubble
    );

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
      imagesRef.current.tEffect01
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


  //=================================
  //　　　    現場監督
  //=================================
  function update(now, deltaTime) {
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

  //車の情報が変わったら入れるよ
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