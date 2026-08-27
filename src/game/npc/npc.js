import {
  npcMaster,
  NPCState,
  NPCDirection,
  NPCAction,
  NPCBehaviorType,
  NPCFleeConfig,
  NPCWalkArea,
} from "../constants/npcMaster";

import {
  getRandomNumber,
  clamp,
} from "../utils/math";

import {
  drawShadow,
  worldToScreen,
} from "../utils/draw";
import { State } from "../constants/vehicleMaster";

//================================================


//======================================
//ひよこを作る係
//======================================
export function createNPC(type, startX, startY) {
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


//======================================
//ひよこがジャンプ中かチェックする係
//======================================
export function isNPCJumping(npc) {
  return npc.action.type === "jump";
}

//======================================
//ひよこジャンプ開始係
//======================================
export function startNPCJump(npc, now) {
  npc.action = {
    type: "jump",
    startTime: now,

    duration:
      NPCAction.JUMP_DURATION +
      NPCAction.LANDING_DURATION,
  };
  npc.frame = 0;    //ジャンプ中は立ち姿のコマにする
}


//========================================
//ジャンプ中にひよこを変形させる係
//=======================================~
export function getNPCJumpTransform(npc, now) {
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


//=======================================
//ひよこを1羽描く係
//=======================================
export function drawNPC(ctx, npc, now, image, camera) {
  const master = npcMaster[npc.type];
  if (!master) {
    return;
  }

  const isInsideBus =
    npc.behavior.type === NPCBehaviorType.RIDE_BUS ||
    npc.behavior.type === NPCBehaviorType.EXIT_BUS;

  const screenPosition = worldToScreen(
    npc.position.x,
    npc.position.y,
    camera
  );


  if (!isInsideBus) {
    drawShadow(
      ctx,
      screenPosition.x,
      screenPosition.y,
      master.shadow.width,
      master.shadow.height
    );
  }

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
    screenPosition.x,
    screenPosition.y +
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

//===================================
//全てのひよこたちを描く係
//===================================
export function drawNPCs(ctx, npcs, now, getImage, camera) {
  for (const npc of npcs) {
    const master = npcMaster[npc.type];
    if (!master) {
      continue;
    }

    const image = getImage(master.imageKey);

    drawNPC(ctx, npc, now, image, camera);
  }
}


//===================================
//ひよこの向きを決める係
//===================================
export function updateNPCDirection(npc, dx, dy) {
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


//===================================
//ひよこの歩き方指導係
//===================================
export function updateNPCAnimation(npc, master, deltaTime) {
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


//===================================
//ひよこの次の行き先を決める係
//===================================
export function chooseNextNPCTarget(npc) {
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


//===================================
//「ひよこ逃げて！」係
//===================================
export function tryStartNPCFlee(npc, now, vehicle) {
  if (!vehicle) {
    return;
  }

  //今回は走っている車だけ避ける
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

