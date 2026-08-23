import { Direction, State } from "../constants/vehicleMaster";
import { NPCDirection, NPCBehaviorType, NPCState, npcMaster, } from "../constants/npcMaster";
import {  getRandomNumber} from "../utils/math";

export const BusPassenger = {
  BOARD_DISTANCE: 170,
  BOARD_ARRIVAL_DISTANCE: 4,

  EXIT_DELAY: 400,
  REBOARD_COOLDOWN: 3000,

  //バスの出入口
  doorOffsets: {
    [Direction.RIGHT]: { x: 90, y: 28 },
    [Direction.LEFT]: { x: -90, y: 68 },
    [Direction.FRONT]: { x: 45, y: 45 },
    [Direction.BACK]: { x: -45, y: 45 },
  },

  // バスに乗っている間の位置
  ridingOffsets: {
    [Direction.RIGHT]: { x: -32, y: 24 },
    [Direction.LEFT]: { x: 33, y: 24 },

    // 前後は隠れるので仮位置
    [Direction.FRONT]: { x: 10, y: 10 },
    [Direction.BACK]: { x: 10, y: 10 },
  },
};

//================================================


//====================================
//バスのドア位置を教える係
//====================================

export function getBusDoorPosition(vehicle) {
  const offset =
    BusPassenger.doorOffsets[vehicle.direction];

  return {
    x: vehicle.position.x + offset.x,
    y: vehicle.position.y + offset.y,
  };
}

//バスの中のひよこ位置を教える係
export function getBusRidingPosition(vehicle) {
  const offset =
    BusPassenger.ridingOffsets[vehicle.direction];

  return {
    x: vehicle.position.x + offset.x,
    y: vehicle.position.y + offset.y,
  };
}


//====================================
//バスの向きを教える係
//====================================

export function getNPCDirectionFromVehicle(vehicleDirection) {
  switch (vehicleDirection) {
    case Direction.RIGHT:
      return NPCDirection.RIGHT;

    case Direction.LEFT:
      return NPCDirection.LEFT;

    case Direction.FRONT:
      return NPCDirection.FRONT;

    case Direction.BACK:
      return NPCDirection.BACK;

    default:
      return NPCDirection.FRONT;
  }
}


//======================================
//乗車回数を決める係
//======================================

export function getBusRideTargetCount() {
  const random = Math.random();

  if (random < 0.2) {
    return 1;
  }
  if (random < 0.9) {
    return 2;
  }
  return 3;
}


//=============================================


//================================
//ひよこをバスの乗降口に案内する係
//================================

export function tryStartNPCBoarding(npc, vehicle, now) {

  if (!vehicle) {
    return;
  }
  //これはバス？
  if (vehicle.type !== "bus") {
    return;
  }
  //バス止まってる？
  if (vehicle.state !== State.STOP) {
    return;
  }
  //今お散歩中？
  if (npc.behavior.type !== NPCBehaviorType.WANDER) {
    return;
  }
  //さっき乗った？
  if (now < npc.behavior.canBoardAfter) {
    return;
  }

  //バスとの距離チェック
  const dx = vehicle.position.x - npc.position.x;
  const dy = vehicle.position.y - npc.position.y;
  const distance = Math.hypot(dx, dy);
  if (distance > BusPassenger.BOARD_DISTANCE) {
    return;  //遠ければ離脱
  }

  const doorPosition = getBusDoorPosition(vehicle);

  npc.target.x = doorPosition.x;
  npc.target.y = doorPosition.y;

  npc.behavior.type = NPCBehaviorType.BOARD_BUS;
  npc.behavior.vehicleId = vehicle.id;

  npc.state = NPCState.WALK;

  npc.animationTimer = 0;
  npc.animationFrameIndex = 0;

  const master = npcMaster[npc.type];

  npc.frame = master.walkFrames[0];
}


//==========================
//バスまでひよこを歩かせる係
//==========================

export function updateNPCBoarding(npc, vehicle, now, soundManager) {
  //バスが発進してしまったら乗車を中止
  if (
    vehicle.type !== "bus" ||
    vehicle.state !== State.STOP
  ) {
    npc.behavior.type = NPCBehaviorType.WANDER;

    npc.behavior.vehicleId = null;

    npc.state = NPCState.IDLE;
    npc.frame = 0;

    npc.waitUntil = now + getRandomNumber(300, 700);

    return false;
  }

  //停止中にバスの向きなどが変わっても、常に最新のドア位置へ向かう
  const doorPosition = getBusDoorPosition(vehicle);

  npc.target.x = doorPosition.x;
  npc.target.y = doorPosition.y;

  const distanceToDoor =
    Math.hypot(
      doorPosition.x - npc.position.x,
      doorPosition.y - npc.position.y
    );

  //まだドアへ着いていない
  if (
    distanceToDoor >
    BusPassenger.BOARD_ARRIVAL_DISTANCE
  ) {
    return false;
  }

  //乗車完了！
  npc.behavior.type =
    NPCBehaviorType.RIDE_BUS;

  npc.behavior.isWaitingForArrival = false;
  npc.behavior.rideCount = 0;
  npc.behavior.rideTargetCount = getBusRideTargetCount();

  npc.state = NPCState.IDLE;
  npc.frame = 0;

  const ridingPosition = getBusRidingPosition(vehicle);

  npc.position.x = ridingPosition.x;
  npc.position.y = ridingPosition.y;

  npc.target.x = ridingPosition.x;
  npc.target.y = ridingPosition.y;

  soundManager.play("hiyokoNoru");  //ぴよ♪

  return true;
}


//====================
//バスとひよこ一緒係
//====================

export function updateNPCRidingBus(npc, vehicle, now) {
  //バス以外へ変更したら乗車終わり
  if (
    !vehicle ||
    vehicle.type !== "bus"
  ) {
    npc.behavior.type =
      NPCBehaviorType.WANDER;

    npc.behavior.vehicleId = null;
    npc.behavior.isWaitingForArrival = false;

    npc.state = NPCState.IDLE;
    npc.frame = 0;

    return;
  }

  const ridingPosition = getBusRidingPosition(vehicle);

  npc.position.x = ridingPosition.x;
  npc.position.y = ridingPosition.y;

  npc.target.x = ridingPosition.x;
  npc.target.y = ridingPosition.y;

  npc.direction = getNPCDirectionFromVehicle(vehicle.direction);

  npc.state = NPCState.IDLE;
  npc.frame = 0;

  //一度でもバスが動いたことを記録
  if (vehicle.state === State.MOVE) {
    npc.behavior.isWaitingForArrival = true;
  }

  //一度動いたバスが停止した
  if (
    vehicle.state === State.STOP &&
    npc.behavior.isWaitingForArrival
  ) {
    npc.behavior.isWaitingForArrival = false;
    npc.behavior.rideCount++;

    //降りるよ～
    if (
      npc.behavior.rideCount >=
      npc.behavior.rideTargetCount
    ) {
      npc.behavior.type = NPCBehaviorType.EXIT_BUS;
      npc.behavior.exitAt = now + BusPassenger.EXIT_DELAY;
    }
  }
}

//==================================
//バスからひよこを降ろす係
//==================================

export function updateNPCExitingBus(npc, vehicle, now, soundManager) {
  //待ち時間中はまだバスの中
  if (now < npc.behavior.exitAt) {
    const ridingPosition = getBusRidingPosition(vehicle);

    npc.position.x = ridingPosition.x;
    npc.position.y = ridingPosition.y;

    npc.target.x = ridingPosition.x;
    npc.target.y = ridingPosition.y;

    npc.direction = getNPCDirectionFromVehicle(vehicle.direction);

    npc.state = NPCState.IDLE;
    npc.frame = 0;

    return;
  }

  const doorPosition = getBusDoorPosition(vehicle);

  npc.position.x = doorPosition.x;
  npc.position.y = doorPosition.y;

  npc.target.x = doorPosition.x;
  npc.target.y = doorPosition.y;

  npc.behavior.type = NPCBehaviorType.WANDER;

  npc.behavior.vehicleId = null;
  npc.behavior.isWaitingForArrival = false;
  npc.behavior.rideCount = 0;
  npc.behavior.rideTargetCount = 0;

  npc.behavior.canBoardAfter = now + BusPassenger.REBOARD_COOLDOWN;

  npc.state = NPCState.IDLE;
  npc.frame = 0;

  soundManager.play("hiyokoNoru");  //ぴよ♪

  return true;

}

