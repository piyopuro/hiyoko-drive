import { roadMap } from "./roadConfig.js";
import { Railway, railwayMap } from "./railwayConfig.js";

export const MapGrid = {
    WIDTH: 30,
    HEIGHT: 17,
    TILE_SIZE: 192,
};


//地形の性質データ
export const terrainMaster = {
    ground: {
        canHiyokoWalk: true,
        canPlaceGroundObject: true,
        canInkPlace: true,
    },

    road: {
        canHiyokoWalk: false,
        canPlaceGroundObject: false,
        canInkPlace: true,
    },

    crosswalk: {
        canHiyokoWalk: true,
        canPlaceGroundObject: false,
        canInkPlace: false,
    },

    railway: {
        canHiyokoWalk: false,
        canPlaceGroundObject: false,
        canInkPlace: false,
    },

    water: {
        canHiyokoWalk: false,
        canPlaceGroundObject: false,
        canInkPlace: false,
    },

    river: {
        canHiyokoWalk: false,
        canPlaceGroundObject: false,
        canInkPlace: false,
    },
};



//=================================
//地形データを作る係
//=================================
export function createTerrainGrid() {

    //とりあえず全部地面
    const grid = Array.from(
        { length: MapGrid.HEIGHT }, () => Array.from(
            { length: MapGrid.WIDTH }, () => "ground"
        )
    );

    //roadMapから地形データ（道路or横断歩道）を作成
    for (const road of roadMap) {
        if (
            road.x < 0 ||
            road.x >= MapGrid.WIDTH ||
            road.y < 0 ||
            road.y >= MapGrid.HEIGHT
        ) {
            continue;
        }

        //横断歩道かどうか判定
        if (road.type === "crosswalk01" || road.type === "crosswalk02") {
            grid[road.y][road.x] = "crosswalk";
        }
        else {
            grid[road.y][road.x] = "road";
        }
    }

    // 線路を登録
    for (const railway of railwayMap) {
        for (let x = railway.x; x < railway.x + 2; x++) {
            if (
                x < 0 ||
                x >= MapGrid.WIDTH ||
                railway.y < 0 ||
                railway.y >= MapGrid.HEIGHT
            ) {
                continue;
            }

            grid[railway.y][x] = "railway";
        }
    }

    return grid;
}

export const terrainGrid = createTerrainGrid();


//=================================
//指定座標の地形を教える係
//=================================
export function getTerrainAt(x, y) {
    const gridX = Math.floor(x / MapGrid.TILE_SIZE);
    const gridY = Math.floor(y / MapGrid.TILE_SIZE);

    if (
        gridX < 0 ||
        gridX >= MapGrid.WIDTH ||
        gridY < 0 ||
        gridY >= MapGrid.HEIGHT
    ) {
        return null;    //マップ外は覗いてはいけない領域
    }

    return terrainGrid[gridY][gridX];
}

//=================================
//物を置けるか判定する係
//=================================
function canPlaceGroundObjectInRect(
    left,
    top,
    right,
    bottom
) {
    const startGridX = Math.floor(left / MapGrid.TILE_SIZE);
    const startGridY = Math.floor(top / MapGrid.TILE_SIZE);
    //境界線を含める
    const endGridX = Math.floor((right - Number.EPSILON) / MapGrid.TILE_SIZE);
    const endGridY = Math.floor((bottom - Number.EPSILON) / MapGrid.TILE_SIZE);

    for (
        let gridY = startGridY;
        gridY <= endGridY;
        gridY++
    ) {
        for (
            let gridX = startGridX;
            gridX <= endGridX;
            gridX++
        ) {
            if (
                gridX < 0 ||
                gridX >= MapGrid.WIDTH ||
                gridY < 0 ||
                gridY >= MapGrid.HEIGHT
            ) {
                return false;
            }

            const terrain = terrainGrid[gridY][gridX];

            if (
                !terrainMaster[terrain]?.canPlaceGroundObject
            ) {
                return false;
            }
        }
    }

    return true;
}

export function canPlaceGroundObjectAt(x, y) {

    // 1点判定
    if (typeof x === "number" && typeof y === "number") {
        const terrain = getTerrainAt(x, y);

        if (terrain === null) {
            return false;
        }

        return (
            terrainMaster[terrain]?.canPlaceGroundObject ?? false
        );
    }


    // 複数点による矩形判定
    if (Array.isArray(x)) {

        if (x.length === 0) {
            return false;
        }

        const xs = x.map(point => point.x);
        const ys = x.map(point => point.y);

        const left = Math.min(...xs);
        const right = Math.max(...xs);
        const top = Math.min(...ys);
        const bottom = Math.max(...ys);

        return canPlaceGroundObjectInRect(
            left,
            top,
            right,
            bottom
        );
    }

    return false;
}