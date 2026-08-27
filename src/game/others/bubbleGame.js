import { getRandomNumber } from "../utils/math";
import { worldToScreen } from "../utils/draw";

//========シャボン玉たちの情報========

export const BubbleGame = {
    IMAGE_SIZE: 350,
    HIT_SIZE: 240,

    MAP_BUBBLE_SIZE: 160,  //マップにおちてるシャボン玉

    COUNT: 6,

    MIN_SIZE: 160,
    MAX_SIZE: 380,

    MIN_SPEED: 35,
    MAX_SPEED: 70,

    MIN_SWAY: 20,
    MAX_SWAY: 55,

    MIN_SWAY_SPEED: 0.001,
    MAX_SWAY_SPEED: 0.0025,

    MIN_DRIFT: -15,
    MAX_DRIFT: 15,

    GROW_DURATION: 90,

    POP_FRAME_INTERVAL: 60,
    POP_FRAME_COUNT: 3,

    RESPAWN_DELAY: 3000,
};


//=====================================
//しゃぼんだまを置く係
//=====================================
export function createMapBubble(bubbleGame) {
    bubbleGame.mapBubble = {
        x: getRandomNumber(150, 1770),
        y: getRandomNumber(150, 800),
    };

    bubbleGame.respawnTime = null;
}


//=====================================
//ちちゃいシャボン玉を描く係
//=====================================
export function drawMapBubble(ctx, bubbleGame, image, camera) {
    if (!bubbleGame.mapBubble) {
        return;
    }

    const size = BubbleGame.MAP_BUBBLE_SIZE;

    const screenPosition = worldToScreen(
        bubbleGame.mapBubble.x,
        bubbleGame.mapBubble.y,
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


//=====================================
//しゃぼんだまぷくぷく係
//=====================================
export function startBubbleGame(now, bubbleGame) {
    const bubbles = [];

    for (let i = 0; i < BubbleGame.COUNT; i++) {
        const startX = getRandomNumber(100, 1820);
        const startY = getRandomNumber(300, 1000);

        bubbles.push({
            x: startX,
            y: startY,
            baseX: startX,

            size: getRandomNumber(
                BubbleGame.MIN_SIZE,
                BubbleGame.MAX_SIZE
            ),
            speed: getRandomNumber(
                BubbleGame.MIN_SPEED,
                BubbleGame.MAX_SPEED
            ),

            swayAmount: getRandomNumber(
                BubbleGame.MIN_SWAY,
                BubbleGame.MAX_SWAY
            ),

            swaySpeed: getRandomNumber(
                BubbleGame.MIN_SWAY_SPEED,
                BubbleGame.MAX_SWAY_SPEED
            ),

            swayPhase: Math.random() * Math.PI * 2,

            driftX: getRandomNumber(
                BubbleGame.MIN_DRIFT,
                BubbleGame.MAX_DRIFT
            ),

            startTime: now,

            state: "floating",
            popStartTime: null,
        });
    }

    bubbleGame.mapBubble = null;
    bubbleGame.bubbles = bubbles;
}


//=====================================
//しゃぼんだまゆらゆら係
//=====================================
export function updateBubbles(now, deltaTime, bubbleGame) {

    for (const bubble of bubbleGame.bubbles) {

        if (bubble.state === "floating") {
            bubble.y -= bubble.speed * deltaTime;

            bubble.baseX += bubble.driftX * deltaTime;

            bubble.x =
                bubble.baseX +
                Math.sin(
                    (now - bubble.startTime) * bubble.swaySpeed + bubble.swayPhase
                ) *
                bubble.swayAmount;
        }
    }

    bubbleGame.bubbles =
        bubbleGame.bubbles.filter((bubble) => {

            if (bubble.state === "popping") {
                const elapsed =
                    now - bubble.popStartTime;

                const popDuration =
                    BubbleGame.GROW_DURATION +
                    BubbleGame.POP_FRAME_INTERVAL *
                    BubbleGame.POP_FRAME_COUNT;

                return elapsed < popDuration;
            }

            return bubble.y + bubble.size / 2 > 0;
        });

    if (
        bubbleGame.mapBubble === null &&
        bubbleGame.bubbles.length === 0
    ) {
        if (bubbleGame.respawnTime === null) {
            bubbleGame.respawnTime =
                now + BubbleGame.RESPAWN_DELAY;
        }

        if (now >= bubbleGame.respawnTime) {
            createMapBubble(bubbleGame);
        }
    }
}


//=====================================
//しゃぼんだまを描く係
//=====================================
export function drawBubbles(ctx, now, bubbleGame, image, popImage) {

    for (const bubble of bubbleGame.bubbles) {

        if (bubble.state === "floating") {
            ctx.drawImage(
                image,
                bubble.x - bubble.size / 2,
                bubble.y - bubble.size / 2,
                bubble.size,
                bubble.size
            );

            continue;
        }

        const elapsed =
            now - bubble.popStartTime;

        //ぷくっ
        if (elapsed < BubbleGame.GROW_DURATION) {
            const progress =
                elapsed / BubbleGame.GROW_DURATION;

            const scale =
                1 + progress * 0.15;

            const size =
                bubble.size * scale;

            ctx.drawImage(
                image,
                bubble.x - size / 2,
                bubble.y - size / 2,
                size,
                size
            );

            continue;
        }

        //ぱちん！
        const popElapsed =
            elapsed - BubbleGame.GROW_DURATION;

        const frame =
            Math.floor(
                popElapsed /
                BubbleGame.POP_FRAME_INTERVAL
            );

        if (frame >= BubbleGame.POP_FRAME_COUNT) {
            continue;
        }

        ctx.drawImage(
            popImage,

            frame * BubbleGame.IMAGE_SIZE,
            0,
            BubbleGame.IMAGE_SIZE,
            BubbleGame.IMAGE_SIZE,

            bubble.x - bubble.size / 2,
            bubble.y - bubble.size / 2,
            bubble.size,
            bubble.size
        );
    }
}
