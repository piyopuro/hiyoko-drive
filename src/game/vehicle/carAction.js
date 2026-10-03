export const CarAction = {
  FRAME_INTERVAL: 500,
  LOOP_COUNT: 3,

  frames: [0, 2],
};


export function updateCarAction(vehicle, now) {
  if (vehicle.type !== "car") {
    return;
  }

  const startTime =
    vehicle.actionState?.startTime;

  if (startTime == null) {
    return;
  }

  const actionDuration =
    CarAction.frames.length *
    CarAction.FRAME_INTERVAL *
    CarAction.LOOP_COUNT;

  if (now - startTime >= actionDuration) {
    vehicle.actionState.startTime = null;
  }
}