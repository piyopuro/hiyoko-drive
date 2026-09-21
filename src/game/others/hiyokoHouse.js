import { getRandomNumber } from "../utils/math";
import { Map } from "../constants/mapConfig";
import {
    Railway,
    railwayMap,
} from "../constants/railwayConfig";
import {
    worldToScreen,
    drawShadow,
} from "../utils/draw";

//========================================
// ひよこのお家 基本設定
//========================================

export const HiyokoHouse = {
    WIDTH: 192,
    HEIGHT: 192,

    //画像のコマ数
    HOUSE_FRAME_COUNT: 8,

    //ドアアニメーション
    DOOR_FRAMES: [
        0, 1, 2, 3, 4, 5, 6, 7, 8,
        7, 6, 7, 8, 7, 6, 5, 4, 3, 2, 1, 0,
    ],

    DOOR_FRAME_INTERVAL: 80,

    //ぽよん設定
    POUNCE_DURATION: 300,
    POUNCE_SCALE_X: 1.12,
    POUNCE_SCALE_Y: 1.18,
};

//========================================
// 線路と重なるかチェック
//========================================

function isHouseOverlappingRailway(x, y) {

    const houseLeft =
        x - HiyokoHouse.WIDTH / 2;

    const houseRight =
        x + HiyokoHouse.WIDTH / 2;

    const houseTop =
        y - HiyokoHouse.HEIGHT / 2;

    const houseBottom =
        y + HiyokoHouse.HEIGHT / 2;


    return railwayMap.some((rail) => {

        const railLeft = rail.x;
        const railRight =
            rail.x + Railway.RAILWAY_WIDTH;

        const railTop = rail.y;
        const railBottom =
            rail.y + Railway.RAILWAY_HEIGHT;


        return (
            houseLeft < railRight &&
            houseRight > railLeft &&
            houseTop < railBottom &&
            houseBottom > railTop
        );
    });
}


//========================================
// お家を作る係
//========================================

export function createHiyokoHouse() {

    const halfWidth =
        HiyokoHouse.WIDTH / 2;

    const halfHeight =
        HiyokoHouse.HEIGHT / 2;

    let x;
    let y;

    //線路と重ならない場所が見つかるまで探す
    do {

        x = getRandomNumber(
            halfWidth,
            Map.WIDTH - halfWidth
        );

        y = getRandomNumber(
            halfHeight,
            Map.HEIGHT - halfHeight
        );

    } while (
        isHouseOverlappingRailway(x, y)
    );

    return {

        position: { x, y, },        //お家の位置
        frame: 0,        //お家画像のコマ、最初は必ず0番
        hiyokoCount: 0,        //ひよこを入れた数

        //ドアアニメーション
        door: {
            isAnimating: false,
            frameIndex: 0,
            lastFrameTime: 0,
        },

        //お家ぽよん
        effect: {
            type: null,
            startTime: 0,
            duration: 0,
        },

    };
}

//========================================
// ドアアニメ開始係
//========================================
export function startHiyokoHouseDoor(
    house,
    now,
    soundManager
) {
    if (house.door.isAnimating) {
        return;
    }

    house.door.isAnimating = true;
    house.door.frameIndex = 0;
    house.door.lastFrameTime = now;

    soundManager.play("doorOpen");
}



//========================================
// ドア開け閉め係
//========================================
export function updateHiyokoHouseDoor(
    house,
    now,
    soundManager
) {
    const door = house.door;

    if (!door.isAnimating) {
        return;
    }

    const elapsed =
        now - door.lastFrameTime;

    if (
        elapsed <
        HiyokoHouse.DOOR_FRAME_INTERVAL
    ) {
        return;
    }

    door.lastFrameTime = now;

    door.frameIndex++;

    //アニメーション終了
    if (
        door.frameIndex >=
        HiyokoHouse.DOOR_FRAMES.length
    ) {
        door.frameIndex = 0;
        door.isAnimating = false;

        soundManager.play("doorClose");

        return;
    }
}


//========================================
// おうちおさわりチェック係
//========================================
export function isPointInsideHiyokoHouse(x, y, house) {
    const halfWidth = HiyokoHouse.WIDTH / 2;
    const halfHeight = HiyokoHouse.HEIGHT / 2;

    return (
        x >= house.position.x - halfWidth &&
        x <= house.position.x + halfWidth &&
        y >= house.position.y - halfHeight &&
        y <= house.position.y + halfHeight
    );
}

//========================================
// ぽよん開始係
//========================================
export function startHiyokoHousePounce(
    house,
    now
) {
    house.effect.type = "pounce";
    house.effect.startTime = now;
    house.effect.duration =
        HiyokoHouse.POUNCE_DURATION;
}


//========================================
// ぽよん計算係
//========================================
export function getHiyokoHouseScale(house, now) {
    if (house.effect.type !== "pounce") {
        return {
            x: 1,
            y: 1,
        };
    }

    const elapsed =
        now - house.effect.startTime;

    const progress = Math.min(
        elapsed / house.effect.duration,
        1
    );

    if (progress >= 1) {
        house.effect.type = null;

        return {
            x: 1,
            y: 1,
        };
    }

    const amount =
        Math.sin(progress * Math.PI);

    return {
        x:
            1 +
            (HiyokoHouse.POUNCE_SCALE_X - 1) *
            amount,

        y:
            1 +
            (HiyokoHouse.POUNCE_SCALE_Y - 1) *
            amount,
    };
}

//==============================================
//おうち描画係
//==============================================
export function drawHiyokoHouse(
    ctx,
    image,
    doorImage,
    house,
    camera,
    now
) {
    const frameWidth = HiyokoHouse.WIDTH;
    const frameHeight = HiyokoHouse.HEIGHT;

    const sx = house.frame * frameWidth;

    const screenPosition = worldToScreen(
        house.position.x,
        house.position.y,
        camera
    );

    // 影
    drawShadow(
        ctx,
        screenPosition.x,
        screenPosition.y + 85,
        110,
        20
    );

    const scale = getHiyokoHouseScale(house, now);

    ctx.save();

    //足元アンカー
    ctx.translate(
        screenPosition.x,
        screenPosition.y + frameHeight / 2
    );

    ctx.scale(
        scale.x,
        scale.y
    );

    //おうち
    ctx.drawImage(
        image,

        sx,
        0,
        frameWidth,
        frameHeight,
        -frameWidth / 2,
        -frameHeight,
        frameWidth,
        frameHeight
    );

    //ドア
    const doorFrame =
        HiyokoHouse.DOOR_FRAMES[
        house.door.frameIndex
        ];

    const doorSx = doorFrame * frameWidth;

    ctx.drawImage(
        doorImage,
        doorSx,
        0,
        frameWidth,
        frameHeight,
        -frameWidth / 2,
        -frameHeight,
        frameWidth,
        frameHeight
    );

    ctx.restore();
}