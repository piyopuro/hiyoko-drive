import { worldToScreen, drawShadow } from "../utils/draw";
import { getRandomNumber } from "../utils/math";
import { Map } from "../constants/mapConfig";
import {
    Railway,
    railwayMap,
} from "../constants/railwayConfig";


// ================================
// たまごゲーム
// ================================

export const EggGame = {
    HIT_PADDING: 20,

    // ぷくっ情報
    PUFF_SCALE: 1.08,
    PUFF_DURATION: 500,

    PUFF_INTERVAL_MIN: 3000,
    PUFF_INTERVAL_MAX: 6000,

    // イベントUI
    EVENT_PANEL_SIZE: 640,

    EVENT_APPEAR_DURATION: 350,
    EVENT_APPEAR_START_OFFSET_Y: -100,
    EVENT_APPEAR_START_ROTATION: 10,


    // 殻エフェクト
    EFFECT_NORMAL: {
        COUNT_MIN: 5,
        COUNT_MAX: 6,
        SPEED_MIN: 650,
        SPEED_MAX: 850,
        SCALE_MIN: 0.14,
        SCALE_MAX: 0.66,
    },

    EFFECT_BIRTH: {
        COUNT_MIN: 12,
        COUNT_MAX: 16,
        SPEED_MIN: 1100,
        SPEED_MAX: 1400,
        SCALE_MIN: 0.18,
        SCALE_MAX: 1.0,
    },

    //おおきいたまごの下余白
    EVENT_EGG_BOTTOM_OFFSET_Y: 30,
    // 卵登場
    EGG_DROP_DELAY: 150,
    EGG_DROP_DURATION: 250,
    EGG_LANDING_DURATION: 240,
    EGG_SWAY_DURATION: 600,
    EGG_DROP_START_OFFSET_Y: -200,
    EGG_BOTTOM_OFFSET_Y: 30,
};

//========================================
// 線路と重なるかチェック
//========================================
export function isEggOverlappingRailway(x, y, image) {
    const eggWidth = image.width;
    const eggHeight = image.height;
    const eggLeft = x - eggWidth / 2;
    const eggRight = x + eggWidth / 2;
    const eggTop = y - eggHeight;
    const eggBottom = y;

    return railwayMap.some((rail) => {
        const railLeft = rail.x;
        const railRight = rail.x + Railway.RAILWAY_WIDTH;
        const railTop = rail.y;
        const railBottom = rail.y + Railway.RAILWAY_HEIGHT;

        return (
            eggLeft < railRight &&
            eggRight > railLeft &&
            eggTop < railBottom &&
            eggBottom > railTop
        );
    });
}

//========================================
// 他の卵と重なるかチェック
//========================================

function isEggOverlappingOtherEgg(
    x,
    y,
    image,
    eggs
) {
    const eggLeft = x - image.width / 2;
    const eggRight = x + image.width / 2;
    const eggTop = y - image.height;
    const eggBottom = y;

    return eggs.some((egg) => {
        const otherLeft = egg.x - image.width / 2;
        const otherRight = egg.x + image.width / 2;
        const otherTop = egg.y - image.height;
        const otherBottom = egg.y;

        return (
            eggLeft < otherRight &&
            eggRight > otherLeft &&
            eggTop < otherBottom &&
            eggBottom > otherTop
        );
    });
}


// ================================
// マップのたまごを作る係(座標指定)
// ================================
export function createMapEgg(x, y) {
    return {
        x,
        y,

        scale: 1,
        puffStartTime: null,
        nextPuffTime: 0,
    };
}


//========================================
// ランダムな場所に卵を作る
//========================================
export function createRandomMapEgg(eggs, image) {
    let x;
    let y;

    const halfWidth = image.width / 2;
    const eggHeight = image.height;

    // 条件を満たす場所が見つかるまで探す
    do {
        x = getRandomNumber(
            halfWidth,
            Map.WIDTH - halfWidth
        );

        y = getRandomNumber(
            eggHeight,
            Map.HEIGHT
        );

    } while (
        isEggOverlappingRailway(x, y, image) ||
        isEggOverlappingOtherEgg(x, y, image, eggs)
    );

    return createMapEgg(x, y);
}


// ================================
// ぷくっ係
// ================================
export function updateMapEggs(eggs, now) {
    for (const egg of eggs) {
        if (!egg) {
            continue;
        }

        // まだ次の「ぷくっ」までの時間を決めていない？
        if (egg.nextPuffTime === 0) {
            egg.nextPuffTime =
                now +
                getRandomNumber(
                    EggGame.PUFF_INTERVAL_MIN,
                    EggGame.PUFF_INTERVAL_MAX
                );

            return;
        }

        // 「ぷくっ」開始前
        if (egg.puffStartTime === null) {
            if (now < egg.nextPuffTime) {
                return;
            }

            // 「ぷくっ」開始！
            egg.puffStartTime = now;
        }

        // 「ぷくっ」開始からの経過時間
        const elapsed = now - egg.puffStartTime;

        const progress = Math.min(
            elapsed / EggGame.PUFF_DURATION,
            1
        );

        // 0 → 1 → 0 と滑らかに変化
        const puffAmount = 4 * progress * (1 - progress);

        egg.scale = 1 + puffAmount * (EggGame.PUFF_SCALE - 1);

        // アニメーション終了
        if (progress >= 1) {
            egg.scale = 1;
            egg.puffStartTime = null;

            egg.nextPuffTime =
                now +
                getRandomNumber(
                    EggGame.PUFF_INTERVAL_MIN,
                    EggGame.PUFF_INTERVAL_MAX
                );
        }
    }
}

// ================================
// マップたまごを描く係
// ================================
export function drawMapEgg(ctx, image, egg, camera) {
    if (!egg || !image) {
        return;
    }

    const screen = worldToScreen(
        egg.x,
        egg.y,
        camera
    );

    const scale = egg.scale ?? 1;

    const width = image.width * scale;
    const height = image.height * scale;

    // 影
    drawShadow(
        ctx,
        screen.x,
        screen.y - 3,
        35,
        12
    );

    // 卵
    ctx.drawImage(
        image,
        screen.x - width / 2,
        screen.y - height,
        width,
        height
    );
}


// ================================
// たまごイベント設計
// ================================
export function createEggGame() {
    return {
        mapEggs: [],

        event: {
            active: false,

            startTime: null,
            rotation: 0,
            offsetY: 0,

            eggFrame: 0,
            eggDropStartTime: null,
            eggCrackStartTime: null,
            eggShakeRotation: 0,
            effectParticles: [],
            birthStartTime: null,
            birthEffectStartTime: null,

            eggX: null,
            eggY: null,
        },
    };
}

// ================================
// マップたまごおさわり判定
// ================================
export function isMapEggHit(x, y, egg, image) {
    if (!egg || !image) {
        return false;
    }

    const width = image.width + EggGame.HIT_PADDING * 2;
    const height = image.height + EggGame.HIT_PADDING * 2;

    const left = egg.x - width / 2;
    const right = egg.x + width / 2;
    const top = egg.y - height;
    const bottom = egg.y + EggGame.HIT_PADDING;

    return (
        x >= left &&
        x <= right &&
        y >= top &&
        y <= bottom
    );
}


// ================================
// イベントUIおさわり判定
// ================================
export function isEggEventPanelHit(
    x,
    y,
    screenWidth,
    screenHeight
) {
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;

    const size = EggGame.EVENT_PANEL_SIZE;

    const left = centerX - size / 2;
    const right = centerX + size / 2;
    const top = centerY - size / 2;
    const bottom = centerY + size / 2;

    return (
        x >= left &&
        x <= right &&
        y >= top &&
        y <= bottom
    );
}

// ================================
// イベント中たまごおさわり判定
// ================================
export function isEggHit(
    x,
    y,
    screenWidth,
    screenHeight
) {
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;
    const radius = 224;

    const dx = x - centerX;
    const dy = y - centerY;

    return (
        dx * dx +
        dy * dy <=
        radius * radius
    );
}


// ================================
// たまごを割る係
// ================================
export function crackEgg(
    event,
    x,
    y,
    now,
    particles,
    image,
    birthX,
    birthY
) {
    if (event.eggFrame < 3) {
        event.eggCrackStartTime = now;

        createEggEffectParticles(
            x,
            y,
            now,
            particles,
            image,
            EggGame.EFFECT_NORMAL
        );
    } else {
        event.birthStartTime = now;
        event.birthEffectStartTime = now;
        createEggEffectParticles(
            birthX,
            birthY,
            now,
            particles,
            image,
            EggGame.EFFECT_BIRTH
        );
    }

    event.eggFrame = Math.min(
        event.eggFrame + 1,
        4
    );
}

// ================================
// とびちる殻を作る係
// ================================
export function createEggEffectParticles(
    x,
    y,
    now,
    particles,
    image,
    config
) {

    const count = getRandomNumber(config.COUNT_MIN, config.COUNT_MAX);

    for (let i = 0; i < count; i++) {
        const angle =
            Math.random() * Math.PI * 2;

        const speed = getRandomNumber(config.SPEED_MIN, config.SPEED_MAX);

        particles.push({
            x,
            y,

            vx:
                Math.cos(angle) * speed,

            vy:
                Math.sin(angle) * speed,

            scale:
                getRandomNumber(config.SCALE_MIN, config.SCALE_MAX),

            rotation:
                Math.random() * Math.PI * 2,

            rotationSpeed:
                getRandomNumber(-0.15, 0.15),

            startTime: now,
            duration: 500,

            image,
        });
    }
}

// ================================
// 殻を飛び散らせる係
// ================================
export function updateEggEffectParticles(
    now,
    deltaTime,
    particles
) {
    for (const particle of particles) {
        particle.x += particle.vx * deltaTime;
        particle.y += particle.vy * deltaTime;

        particle.vx *= 0.92;
        particle.vy *= 0.92;

        particle.rotation +=
            particle.rotationSpeed;
    }

    return particles.filter(
        (particle) =>
            now - particle.startTime <
            particle.duration
    );
}

// ================================
// イベント画面を描く係
// ================================
export function drawEggEvent(
    ctx,
    image,
    eggImage,
    eggEffectImage,
    event,
    screenWidth,
    screenHeight,
    now
) {
    if (!event.active || !image) {
        return;
    }

    const elapsed = now - event.startTime;

    const progress = Math.min(
        elapsed / EggGame.EVENT_APPEAR_DURATION,
        1
    );

    // なめらかに止まる
    const eased = 1 - Math.pow(1 - progress, 3);
    const rotation = EggGame.EVENT_APPEAR_START_ROTATION * (1 - eased);
    const offsetY = EggGame.EVENT_APPEAR_START_OFFSET_Y * (1 - eased);

    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;

    // 背景を少し暗くする
    ctx.save();

    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.fillRect(
        0,
        0,
        screenWidth,
        screenHeight
    );

    // UI
    ctx.translate(
        centerX,
        centerY + offsetY
    );

    ctx.rotate(
        rotation * Math.PI / 180
    );

    ctx.drawImage(
        image,
        -image.width / 2,
        -image.height / 2
    );

    ctx.restore();

    // おおきいたまご
    const frameWidth = 448;
    const frameHeight = 448;

    const uiElapsed =
        now - event.startTime;

    // UI登場が終わってから卵登場開始
    const eggElapsed =
        uiElapsed - EggGame.EGG_DROP_DELAY;

    if (eggElapsed >= 0) {
        // 卵の登場開始時刻を記録
        if (event.eggDropStartTime === null) {
            event.eggDropStartTime = now;
        }

        // ─────────────────────
        // ① 上から落ちてくる
        // ─────────────────────

        const dropProgress = Math.min(
            eggElapsed / EggGame.EGG_DROP_DURATION,
            1
        );

        let eggY =
            centerY +
            EggGame.EGG_DROP_START_OFFSET_Y *
            (1 - dropProgress);

        const fadeProgress = Math.min(
            eggElapsed / 300,
            1
        );

        const eggAlpha = fadeProgress;


        // ─────────────────────
        // ② 着地して1回だけバウンド
        // ─────────────────────

        const landingElapsed =
            eggElapsed - EggGame.EGG_DROP_DURATION;

        if (landingElapsed >= 0) {
            const landingProgress = Math.min(
                landingElapsed /
                EggGame.EGG_LANDING_DURATION,
                1
            );

            // 1回だけ「ぽんっ」と跳ねる
            const bounce =
                Math.sin(
                    landingProgress * Math.PI
                );

            eggY -= 35 * bounce;
        }

        // ─────────────────────
        // ③ 左右にちょっと振る
        // ─────────────────────

        let eggRotation = 0;

        // 割れた瞬間の小さな揺れ　※登場とは別フェーズ
        if (event.eggCrackStartTime !== null) {
            const crackElapsed =
                now - event.eggCrackStartTime;

            const crackDuration = 240;

            if (crackElapsed < crackDuration) {
                const progress = crackElapsed / crackDuration;

                const decay = 1 - progress;

                eggRotation +=
                    Math.sin(progress * Math.PI * 3) * 0.05 * decay;
            }
        }


        const swayElapsed =
            landingElapsed -
            EggGame.EGG_LANDING_DURATION;

        if (swayElapsed >= 0) {
            const swayProgress = Math.min(
                swayElapsed /
                EggGame.EGG_SWAY_DURATION,
                1
            );

            const swayAmount = Math.sin(swayProgress * Math.PI * 2);
            eggRotation += 0.08 * swayAmount * (1 - swayProgress);
        }

        // ─────────────────────
        // ④ フレームごとの支点
        // ─────────────────────

        const pivotX = centerX;

        let pivotY;
        let drawY;
        let drawWidth = frameWidth;
        let drawHeight = frameHeight;

        let birthScale = 1;

        if (
            event.eggFrame === 4 &&
            event.birthStartTime !== null
        ) {
            const birthElapsed =
                now - event.birthStartTime;

            const birthDuration = 350;

            const birthProgress = Math.min(
                birthElapsed / birthDuration,
                1
            );

            if (birthProgress < 0.5) {
                // 0.8 → 1.2
                const progress = birthProgress / 0.5;

                birthScale = 0.8 + 0.4 * progress;

            } else {
                // 1.2 → 1.0
                const progress = (birthProgress - 0.5) / 0.5;

                birthScale = 1.2 - 0.2 * progress;
            }
        }

        if (event.eggFrame < 4) {
            // ①〜④：底辺+30pxを支点
            pivotY =
                eggY +
                frameHeight / 2 -
                EggGame.EGG_BOTTOM_OFFSET_Y;

            drawY =
                -(
                    frameHeight -
                    EggGame.EGG_BOTTOM_OFFSET_Y
                );
        } else {
            // ⑤：画像中央を支点
            pivotY = centerY;
            drawWidth = frameWidth * birthScale;
            drawHeight = frameHeight * birthScale;
            drawY = -drawHeight / 2;

        }



        // 影　　１，２，３，４フレーム目のみ
        if (event.eggFrame < 4) {
            drawShadow(
                ctx,
                centerX,
                centerY + frameHeight / 2 - EggGame.EGG_BOTTOM_OFFSET_Y,
                120,
                20
            );
        }

        // 卵
        ctx.save();

        ctx.globalAlpha = eggAlpha;

        ctx.translate(
            pivotX,
            pivotY
        );

        ctx.rotate(
            eggRotation
        );

        ctx.drawImage(
            eggImage,
            event.eggFrame * frameWidth,
            0,
            frameWidth,
            frameHeight,
            -drawWidth / 2,
            drawY,
            drawWidth,
            drawHeight
        );

        ctx.restore();
    }

    // 誕生エフェクト
    if (
        event.eggFrame === 4 &&
        event.birthEffectStartTime !== null &&
        eggEffectImage
    ) {

        //誕生エフェクト②
        const effectElapsed = now - event.birthEffectStartTime;

        const effectFrameDuration = 500;
        const effectRotationStep = 120;

        const effectStep =
            Math.floor(
                effectElapsed / effectFrameDuration
            );

        const effectRotation =
            (effectStep * effectRotationStep) % 360;


        ctx.save();

        ctx.translate(
            centerX,
            centerY
        );

        ctx.rotate(
            effectRotation * Math.PI / 180
        );

        ctx.drawImage(
            eggEffectImage,
            -eggEffectImage.width / 2,
            -eggEffectImage.height / 2
        );

        ctx.restore();
    }

    // 殻エフェクト
    for (const particle of event.effectParticles) {
        if (!particle.image) {
            continue;
        }

        const size =
            64 * particle.scale;

        ctx.save();

        ctx.translate(
            particle.x,
            particle.y
        );

        ctx.rotate(
            particle.rotation
        );

        ctx.drawImage(
            particle.image,
            -size / 2,
            -size / 2,
            size,
            size
        );

        ctx.restore();
    }
}

// ================================
// イベントおしまい係
// ================================
export function finishEggEvent(event) {
    event.active = false;
    event.startTime = null;
    event.eggFrame = 0;
    event.eggDropStartTime = null;
    event.eggCrackStartTime = null;
    event.birthStartTime = null;
    event.birthEffectStartTime = null;
    event.effectParticles = [];
}