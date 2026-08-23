export const PoliceCarAction = {
  FRAME_INTERVAL: 120,
  LOOP_COUNT: 3,

  frames: [2, 3, 4, 3],
};


  //パトカーアクション更新係

export  function updatePoliceCarAction(vehicle, now) {
    if (vehicle.type !== "policeCar") {
      return;
    }

    const startTime =
      vehicle.actionState?.startTime;

    if (startTime == null) {
      return;
    }

    const actionDuration =
      PoliceCarAction.frames.length *
      PoliceCarAction.FRAME_INTERVAL *
      PoliceCarAction.LOOP_COUNT;

    if (now - startTime >= actionDuration) {
      vehicle.actionState.startTime = null;
    }
  }

