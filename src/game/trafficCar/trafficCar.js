import { worldToScreen } from "../utils/draw";
import { roadMap, Road } from "../constants/roadConfig";
import { drawShadow } from "../utils/draw";

//ひよこカー情報
export const TrafficCar = {
    SPEED: 150,
    FRAME_INTERVAL: 200,
    TAP_FRAMES: [0, 2, 3, 4, 3, 4, 3, 4, 3, 2, 0],
    TAP_FRAME_INTERVAL: 170,
    POYON_DURATION: 300,
};



//=======================================
// ひよこカーを作る係
//=======================================
export function createTrafficCar(type, roadX, roadY) {
    const x = roadX * Road.TILE_SIZE + Road.TILE_SIZE / 2;
    const y = roadY * Road.TILE_SIZE + Road.TILE_SIZE / 2;
    const soundType =
        `hiyokoCar0${Math.floor(Math.random() * 3) + 1}`;

    return {
        type,
        x,
        y,
        direction: "right",
        frame: 0,

        tapAnimation: false,
        tapAnimationStart: 0,
        tapAnimationFrame: 0,
        scale: 1,
        poyonStart: 0,

        soundType,

        turnRoadX: null,
        turnRoadY: null,
    };
}


//=======================================
// ひよこカー位置情報サービス
//=======================================
export function getRoadAtPosition(x, y) {
    const gridX = Math.floor(x / Road.TILE_SIZE);
    const gridY = Math.floor(y / Road.TILE_SIZE);

    return roadMap.find(
        (road) =>
            road.x === gridX &&
            road.y === gridY
    );
}

//=======================================
// 進行方向を決める係
//=======================================
export function getNextDirection(car, road) {
    const roadInfo = Road.types[road.type];

    // 今の走行方向の反対
    const oppositeDirection = {
        right: "left",
        left: "right",
        down: "up",
        up: "down",
    };

    //来た方向はひよこカーの向きと反対
    const comingFrom = oppositeDirection[car.direction];

    // 来た方向を除外
    const candidates =
        roadInfo.connections.filter(
            (direction) => direction !== comingFrom
        );

    // 候補がない場合は、来た方向へ戻る
    if (candidates.length === 0) {
        return comingFrom;
    }

    // 候補が1つならそのまま
    if (candidates.length === 1) {
        return candidates[0];
    }

    // 複数あるならランダム
    const index = Math.floor(Math.random() * candidates.length);

    return candidates[index];
}


//=======================================
// 道路の中心に来たかどうかチェックする係
//=======================================
export function isRoadCenter(car) {

    //ひよこカーがいるところの道路マスの中心を求めるぞ
    const centerX =
        Math.floor(car.x / Road.TILE_SIZE) * Road.TILE_SIZE + Road.TILE_SIZE / 2;

    const centerY =
        Math.floor(car.y / Road.TILE_SIZE) * Road.TILE_SIZE + Road.TILE_SIZE / 2;

    return (
        Math.abs(car.x - centerX) < 5 &&
        Math.abs(car.y - centerY) < 5
    );
}


//=======================================
// ひよこカーおさわりチェック係
//=======================================
export function getTappedTrafficCar(
    worldX,
    worldY,
    trafficCars
) {
    return trafficCars.find((car) => {
        const halfWidth = 70;
        const halfHeight = 50;

        return (
            worldX >= car.x - halfWidth &&
            worldX <= car.x + halfWidth &&
            worldY >= car.y - halfHeight &&
            worldY <= car.y + halfHeight
        );
    });
}


//=======================================
// ぽよん計算係
//=======================================
function updateTrafficCarPoyon(car, now) {
    const elapsed = now - car.tapAnimationStart;
    const progress = Math.min(elapsed / TrafficCar.POYON_DURATION, 1);

    car.scale = 1 + Math.sin(progress * Math.PI) * 0.3;
}


//=======================================
// ひよこカーを描く係
//=======================================
export function drawTrafficCar(ctx, car, image, camera) {
    const FRAME_WIDTH = 120;
    const FRAME_HEIGHT = 80;
    const directionRow = {
        right: 0,
        left: 1,
        down: 2,
        up: 3,
    };

    const sx = car.frame * FRAME_WIDTH;
    const sy = directionRow[car.direction] * FRAME_HEIGHT;

    const screenPosition = worldToScreen(
        car.x,
        car.y,
        camera
    );

    const drawWidth = FRAME_WIDTH * car.scale;
    const drawHeight = FRAME_HEIGHT * car.scale;

    // 影
    drawShadow(
        ctx,
        screenPosition.x,
        screenPosition.y + 32,
        50,
        18
    );

    ctx.drawImage(
        image,
        sx,
        sy,
        FRAME_WIDTH,
        FRAME_HEIGHT,
        screenPosition.x - drawWidth / 2,
        screenPosition.y - drawHeight / 2,
        drawWidth,
        drawHeight
    );
}


//=======================================
// ひよこカー監督
//=======================================
export function updateTrafficCar(car, now, deltaTime) {

    //ひよこカータップ時
    if (car.tapAnimation) {
        updateTrafficCarPoyon(car, now);

        const elapsed = now - car.tapAnimationStart;
        const frameIndex = Math.floor(elapsed / TrafficCar.TAP_FRAME_INTERVAL);

        if (frameIndex >= TrafficCar.TAP_FRAMES.length) {
            car.tapAnimation = false;
            car.tapAnimationFrame = 0;
            car.frame = 0;
        } else {
            car.tapAnimationFrame = frameIndex;
            car.frame = TrafficCar.TAP_FRAMES[frameIndex];
        }

        return;
    }


    //通常時
    car.frame = Math.floor(now / TrafficCar.FRAME_INTERVAL) % 2;

    //ひよこカーの座標から道路座標・道路タイプを取得
    const road = getRoadAtPosition(car.x, car.y);

    if (road && isRoadCenter(car)) {
        //記録された道路座標と今の道路座標を比較
        const sameRoad =
            car.turnRoadX === road.x &&
            car.turnRoadY === road.y;

        //通ってなければ方向転換+この道路を記録
        if (!sameRoad) {
            car.direction = getNextDirection(car, road);

            car.turnRoadX = road.x;
            car.turnRoadY = road.y;
        }
    }

    if (car.direction === "right") {
        car.x += TrafficCar.SPEED * deltaTime;
    }

    if (car.direction === "left") {
        car.x -= TrafficCar.SPEED * deltaTime;
    }

    if (car.direction === "down") {
        car.y += TrafficCar.SPEED * deltaTime;
    }

    if (car.direction === "up") {
        car.y -= TrafficCar.SPEED * deltaTime;
    }
}