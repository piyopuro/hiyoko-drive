import {
  npcMaster,
  NPCState,
  NPCDirection,
  NPCAction,
  NPCBehaviorType,
  NPCFleeConfig,
  NPCDragConfig,
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

      busSeatIndex: null,

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


    drag: {
      isDragging: false,
      offsetX: 0,
      offsetY: 0,

      liftOffsetY: 0,

      velocityX: 0,
      velocityY: 0,
      lastMoveTime: 0,
      wobbleStartTime: 0,
      releaseVelocityX: 0,
      releaseVelocityY: 0,

      releaseFallDuration: 0,
      releaseFallElapsed: 0,
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
//ひよこを摘まむ係
//======================================
export function startNPCDrag(npc, worldX, worldY, now, soundManager) {

  const master = npcMaster[npc.type];

  npc.drag.isDragging = true;
  npc.drag.offsetX = 0;
  npc.drag.offsetY =
    master.drawHeight +
    NPCDragConfig.LIFT_OFFSET_Y;

  npc.drag.liftOffsetY =
    NPCDragConfig.LIFT_OFFSET_Y;

  npc.position.x =
    worldX + npc.drag.offsetX;

  npc.position.y =
    worldY + npc.drag.offsetY;

  npc.drag.velocityX = 0;
  npc.drag.velocityY = 0;
  npc.drag.lastMoveTime = now;
  npc.drag.wobbleStartTime = now;
  npc.drag.releaseVelocityX = 0;
  npc.drag.releaseVelocityY = 0;

  //摘まんでいる間は普段の行動を止める
  npc.state = NPCState.IDLE;
  npc.behavior.type = NPCBehaviorType.WANDER;
  npc.target.x = npc.position.x;
  npc.target.y = npc.position.y;
  npc.action.type = null;
  npc.frame = 0;

  soundManager.play("hiyokotsumami");  //ぴょい

}

export function updateNPCDrag(npc, worldX, worldY, now) {
  if (!npc.drag.isDragging) {
    return;
  }

  const previousTime = npc.drag.lastMoveTime;
  const elapsed = Math.max(now - previousTime, 1);

  const nextX = clamp(
    worldX + npc.drag.offsetX,
    NPCWalkArea.LEFT,
    NPCWalkArea.RIGHT
  );
  const nextY = clamp(
    worldY + npc.drag.offsetY,
    NPCWalkArea.TOP,
    NPCWalkArea.BOTTOM
  );

  const deltaX = nextX - npc.position.x;
  const deltaY = nextY - npc.position.y;

  npc.position.x = nextX;
  npc.position.y = nextY;

  const velocityScale = 1000 / elapsed;
  npc.drag.velocityX = clamp(
    deltaX * velocityScale,
    -NPCDragConfig.MAX_RELEASE_SPEED,
    NPCDragConfig.MAX_RELEASE_SPEED
  );
  npc.drag.velocityY = clamp(
    deltaY * velocityScale,
    -NPCDragConfig.MAX_RELEASE_SPEED,
    NPCDragConfig.MAX_RELEASE_SPEED
  );
  npc.drag.lastMoveTime = now;
}

export function endNPCDrag(npc) {
  if (!npc.drag.isDragging) {
    return;
  }

  npc.drag.isDragging = false;
  npc.drag.releaseVelocityX =
    npc.drag.velocityX *
    NPCDragConfig.RELEASE_VELOCITY_MULTIPLIER;
  npc.drag.releaseVelocityY =
    npc.drag.velocityY *
    NPCDragConfig.RELEASE_VELOCITY_MULTIPLIER;

  //初速から着地までの時間を計算するよ。  
  const initialSpeed = Math.hypot(
    npc.drag.releaseVelocityX,
    npc.drag.releaseVelocityY
  );

  if (initialSpeed > NPCDragConfig.RELEASE_STOP_SPEED) {
    const stopFrames =
      Math.log(
        NPCDragConfig.RELEASE_STOP_SPEED / initialSpeed
      ) /
      Math.log(NPCDragConfig.RELEASE_FRICTION);

    npc.drag.releaseFallDuration =
      stopFrames / 60;
  } else {
    npc.drag.releaseFallDuration = 0;
  }

  npc.drag.releaseFallElapsed = 0;
}


//============================================
//ひよこぽい係
//============================================
export function updateNPCDragRelease(npc, deltaTime) {
  const vx = npc.drag.releaseVelocityX;
  const vy = npc.drag.releaseVelocityY;

  npc.drag.releaseFallElapsed += deltaTime;

  const fallProgress = clamp(
    npc.drag.releaseFallElapsed /
    npc.drag.releaseFallDuration,
    0,
    1
  );

  npc.drag.liftOffsetY =
    NPCDragConfig.LIFT_OFFSET_Y * (1 - fallProgress);

  if (
    Math.hypot(vx, vy) <
    NPCDragConfig.RELEASE_STOP_SPEED
  ) {
    npc.drag.releaseVelocityX = 0;
    npc.drag.releaseVelocityY = 0;
    npc.drag.liftOffsetY = 0;

    npc.action = {

      type: "dragLanding",
      startTime: performance.now(),
      duration: NPCDragConfig.RELEASE_LANDING_DURATION,
    };
    return false;
  }

  const moveScale = deltaTime;

  npc.position.x = clamp(
    npc.position.x + vx * moveScale,
    NPCWalkArea.LEFT,
    NPCWalkArea.RIGHT
  );
  npc.position.y = clamp(
    npc.position.y + vy * moveScale,
    NPCWalkArea.TOP,
    NPCWalkArea.BOTTOM
  );

  npc.drag.releaseVelocityX *= NPCDragConfig.RELEASE_FRICTION;
  npc.drag.releaseVelocityY *= NPCDragConfig.RELEASE_FRICTION;

  return true;
}


//========================================================
//   ひよこぷらぷら係
//========================================================
export function getNPCDragTransform(npc, now) {

  //ひよこつままれ中
  if (npc.drag.isDragging) {
    const elapsed = now - npc.drag.wobbleStartTime;
    const wobble = Math.sin(
      elapsed * NPCDragConfig.WOBBLE_SPEED
    );

    return {
      offsetY: -npc.drag.liftOffsetY,
      rotation: wobble * NPCDragConfig.WOBBLE_ANGLE,
      scaleY: 1,
    };
  }

  //ひよこが投げられ中
  if (
    npc.drag.releaseFallDuration > 0 &&
    npc.drag.releaseFallElapsed <
    npc.drag.releaseFallDuration
  ) {
    return {
      offsetY: -npc.drag.liftOffsetY,
      rotation: 0,
      scaleY: 1,
    };
  }

  //ひよこ着地
  if (npc.action.type === "dragLanding") {
    const elapsed = now - npc.action.startTime;
    const progress = Math.min(
      elapsed / npc.action.duration,
      1
    );

    if (progress < 0.35) {
      const t = progress / 0.35;
      return {
        offsetY: 0,
        rotation: 0,
        scaleY: 1 + (0.55 - 1) * t,
      };
    }
    const t =
      (progress - 0.35) / (1 - 0.35);

    return {
      offsetY: 0,
      rotation: 0,
      scaleY: 0.55 + (1 - 0.55) * t,
    };
  }

  return {
    offsetY: 0,
    rotation: 0,
    scaleY: 1,
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
  const dragTransform = getNPCDragTransform(npc, now);

  ctx.save();

  //NPCの足元へ移動
  ctx.translate(
    screenPosition.x,
    screenPosition.y +
    jumpTransform.offsetY +
    dragTransform.offsetY
  );

  //ドラッグ中は頭基準でぷらぷら
  if (npc.drag.isDragging) {
    ctx.translate(0, -master.drawHeight);
    ctx.rotate(dragTransform.rotation);
    ctx.translate(0, master.drawHeight);
  } else {
    ctx.rotate(dragTransform.rotation);
  }


  //足元を基準に縦方向へ変形
  ctx.scale(
    1,
    jumpTransform.scaleY *
    dragTransform.scaleY
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

