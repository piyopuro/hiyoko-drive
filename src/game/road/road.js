import {
    Road,
    roadMap,
} from "../constants/roadConfig";

import {
    worldToScreen,
} from "../utils/draw";


//=======================================
// 道路を1枚描く係
//=======================================
export function drawRoad(
    ctx,
    road,
    image,
    camera
) {
    if (!image) {
        return;
    }

    const worldX = road.x * Road.TILE_SIZE;
    const worldY = road.y * Road.TILE_SIZE;

    const screenPosition = worldToScreen(
        worldX,
        worldY,
        camera
    );

    ctx.drawImage(
        image,
        screenPosition.x,
        screenPosition.y,
        Road.TILE_SIZE,
        Road.TILE_SIZE
    );
}


//=======================================
// マップ上の道路を全部描く係
//=======================================
export function drawRoads(
    ctx,
    roads,
    images,
    camera
) {
    for (const road of roads) {

        const image =
            images[`road_${road.type}`];

        drawRoad(
            ctx,
            road,
            image,
            camera
        );
    }
}