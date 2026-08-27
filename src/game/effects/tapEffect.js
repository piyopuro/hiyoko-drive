import { getRandomNumber } from "../utils/math";
import { worldToScreen } from "../utils/draw";


//========タップエフェクトの情報========

export const Effect = {
  DURATION: 300,
  AMOUNT: 0.2,
}

export const TapEffect = {
  DURATION: 400,

  IMAGE_WIDTH: 64,
  IMAGE_HEIGHT: 64,

  MIN_SIZE: 35,
  MAX_SIZE: 65,

  MIN_DISTANCE: 20,
  MAX_DISTANCE: 75,
};



//=================================
//タップ位置にキラキラを作る係
//=================================
export function createTapSparkles(x, y, now, tapEffects) {
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

    tapEffects.push({
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


//=================================
//タップエフェクト更新係
//=================================
export function updateTapEffects(now, tapEffects) {
  return tapEffects.filter((effect) => {
    const elapsed =
      now - effect.startTime;

    return elapsed < effect.duration;
  });
}


//=================================
//タップエフェクト描画係
//=================================
export function drawTapEffects(
  ctx,
  now,
  tapEffects,
  image,
  camera
) {

  for (const effect of tapEffects) {
    if (effect.type !== "sparkle") {
      continue;
    }

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

    const screenPosition = worldToScreen(
      effect.x,
      effect.y,
      camera
    );

    ctx.drawImage(
      image,

      screenPosition.x - size / 2,
      screenPosition.y - size / 2,

      size,
      size
    );
  }
}
