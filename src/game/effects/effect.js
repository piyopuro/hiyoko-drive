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

//========星キラキラの情報========

export const StarSparkle = {
  STAR_COUNT: 6,

  SMALL_COUNT_MIN: 6,
  SMALL_COUNT_MAX: 10,

  SPEED_MIN: 400,
  SPEED_MAX: 550,

  MIN_SIZE: 0.2,
  MAX_SIZE: 0.5,

  DURATION: 700,
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
//星キラキラを作る係
//=================================
export function createStarSparkles(
  x,
  y,
  now,
  tapEffects
) {
  // ★ 6個
  for (let i = 0; i < StarSparkle.STAR_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = getRandomNumber(StarSparkle.SPEED_MIN, StarSparkle.SPEED_MAX);

    tapEffects.push({
      type: "starSparkle",
      variant: "star",

      x,
      y,

      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,

      startTime: now,
      duration: StarSparkle.DURATION,

      maxSize: getRandomNumber(StarSparkle.MIN_SIZE, StarSparkle.MAX_SIZE),

      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.12,
    });
  }

  // ✦ たくさん
  const smallCount02 = getRandomNumber(StarSparkle.SMALL_COUNT_MIN, StarSparkle.SMALL_COUNT_MAX);

  for (let i = 0; i < smallCount02; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = getRandomNumber(StarSparkle.SPEED_MIN, StarSparkle.SPEED_MAX);

    tapEffects.push({
      type: "starSparkle",
      variant: "small02",

      x,
      y,

      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,

      startTime: now,
      duration: StarSparkle.DURATION,

      maxSize: getRandomNumber(StarSparkle.MIN_SIZE, StarSparkle.MAX_SIZE),
    });
  }

  // ✧ たくさん
  const smallCount03 = getRandomNumber(StarSparkle.SMALL_COUNT_MIN, StarSparkle.SMALL_COUNT_MAX);

  for (let i = 0; i < smallCount03; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = getRandomNumber(StarSparkle.SPEED_MIN, StarSparkle.SPEED_MAX);

    tapEffects.push({
      type: "starSparkle",
      variant: "small03",

      x,
      y,

      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,

      startTime: now,
      duration: StarSparkle.DURATION,

      maxSize: getRandomNumber(StarSparkle.MIN_SIZE, StarSparkle.MAX_SIZE),
    });
  }
}


//=================================
//お家の周りにキラキラを作る係
//=================================
export function createHiyokoHouseSparkles(
  x,
  y,
  now,
  tapEffects
) {
  const sparkleCount =
    Math.random() < 0.5 ? 5 : 6;

  for (let i = 0; i < sparkleCount; i++) {
    const angle =
      Math.random() * Math.PI * 2;

    const distance = getRandomNumber(
      105,
      135
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
//いろんなエフェクト更新係
//=================================
export function updateVisualEffects(now, deltaTime, visualEffects) {
  for (const effect of visualEffects) {
    if (effect.type !== "starSparkle") {
      continue;
    }

    if (effect.type === "starSparkle") {
      effect.x += effect.vx * deltaTime;
      effect.y += effect.vy * deltaTime;

      effect.vx *= 0.92;
      effect.vy *= 0.92;

      effect.rotation += effect.rotationSpeed;

      const elapsed = now - effect.startTime;
      const progress =
        Math.min(
          elapsed / effect.duration,
          1
        );

      if (progress < 0.3) {
        // 0 → 1
        effect.scale = progress / 0.3;
      } else if (progress < 0.6) {
        // 1を少し維持
        effect.scale = 1;
      } else {
        // 1 → 0
        effect.scale = 1 - (progress - 0.6) / 0.4;
      }
    }
  }

  return visualEffects.filter((effect) => {
    const elapsed =
      now - effect.startTime;

    return elapsed < effect.duration;
  });
}


//=================================
//いろんなエフェクト描画係
//=================================
export function drawVisualEffects(
  ctx,
  now,
  visualEffects,
  image,
  camera,
  starImages
) {

  for (const effect of visualEffects) {

    if (effect.type === "starSparkle") {

      let starImage = null;

      if (effect.variant === "star") {
        starImage = starImages.starEffect01;
      } else if (effect.variant === "small02") {
        starImage = starImages.starEffect02;
      } else if (effect.variant === "small03") {
        starImage = starImages.starEffect03;
      }

      if (!starImage) {
        continue;
      }

      const size =
        64 *
        effect.maxSize *
        effect.scale;

      const screenPosition =
        worldToScreen(
          effect.x,
          effect.y,
          camera
        );

      ctx.save();

      ctx.translate(
        screenPosition.x,
        screenPosition.y
      );

      ctx.rotate(
        effect.rotation
      );

      ctx.drawImage(
        starImage,
        -size / 2,
        -size / 2,
        size,
        size
      );

      ctx.restore();

      continue;
    }


    //=================================
    //今までのキラキラ
    //=================================
    if (effect.type !== "sparkle") {
      continue;
    }

    if (!image) {
      continue;
    }

    const elapsed = now - effect.startTime;
    const progress = Math.min(
      elapsed / effect.duration,
      1
    );

    const scale = Math.sin(progress * Math.PI);
    const size = effect.maxSize * scale;

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
