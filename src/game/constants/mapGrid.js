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
//歩ける経路を探す係
//=================================
export function findWalkablePath(
    startX,
    startY,
    targetX,
    targetY
) {
    //ワールド座標をグリッド座標に変換
    const startGridX = Math.floor(startX / MapGrid.TILE_SIZE);
    const startGridY = Math.floor(startY / MapGrid.TILE_SIZE);
    const targetGridX = Math.floor(targetX / MapGrid.TILE_SIZE);
    const targetGridY = Math.floor(targetY / MapGrid.TILE_SIZE);

    //開始地点・目的地がマップ外なら終了
    if (
        startGridX < 0 ||
        startGridX >= MapGrid.WIDTH ||
        startGridY < 0 ||
        startGridY >= MapGrid.HEIGHT ||
        targetGridX < 0 ||
        targetGridX >= MapGrid.WIDTH ||
        targetGridY < 0 ||
        targetGridY >= MapGrid.HEIGHT
    ) {
        return null;
    }

    //目的地が歩けない場所なら終了
    const targetTerrain = terrainGrid[targetGridY][targetGridX];
    if (!terrainMaster[targetTerrain]?.canHiyokoWalk) {
        return null;
    }

    //開始地点が歩けない場合も終了
    const startTerrain = terrainGrid[startGridY][startGridX];
    if (!terrainMaster[startTerrain]?.canHiyokoWalk) {
        return null;
    }

    //すでに同じマスなら、そのマスだけ返す
    if (
        startGridX === targetGridX &&
        startGridY === targetGridY
    ) {
        return [
            {
                x: startGridX,
                y: startGridY,
            },
        ];
    }

    //探索するためのキュー
    const queue = [
        {
            x: startGridX,
            y: startGridY,
        },
    ];

    //「どのマスから来たか」を記録
    const cameFrom = Array.from(
        { length: MapGrid.HEIGHT }, () => Array.from(
            { length: MapGrid.WIDTH }, () => null
        )
    );

    //開始地点は訪問済みにする
    cameFrom[startGridY][startGridX] = {
        x: startGridX,
        y: startGridY,
    };

    //上下左右
    const directions = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 },
    ];

    while (queue.length > 0) {

        const current = queue.shift();

        //目的地に到着
        if (
            current.x === targetGridX &&
            current.y === targetGridY
        ) {
            break;
        }

        for (const direction of directions) {

            const nextX =
                current.x + direction.x;

            const nextY =
                current.y + direction.y;

            //マップ外
            if (
                nextX < 0 ||
                nextX >= MapGrid.WIDTH ||
                nextY < 0 ||
                nextY >= MapGrid.HEIGHT
            ) {
                continue;
            }

            //すでに訪問済み
            if (cameFrom[nextY][nextX] !== null) {
                continue;
            }

            const terrain = terrainGrid[nextY][nextX];

            //歩けない地形
            if (!terrainMaster[terrain]?.canHiyokoWalk) {
                continue;
            }

            cameFrom[nextY][nextX] = {
                x: current.x,
                y: current.y,
            };

            queue.push({
                x: nextX,
                y: nextY,
            });
        }
    }

    //目的地まで到達できなかった
    if (cameFrom[targetGridY][targetGridX] === null) {
        return null;
    }

    //目的地から逆向きにたどって経路を作る
    const path = [];

    let current = {
        x: targetGridX,
        y: targetGridY,
    };

    while (
        current.x !== startGridX ||
        current.y !== startGridY
    ) {
        path.push(current);

        current = cameFrom[current.y][current.x];
    }

    //開始地点を追加
    path.push({
        x: startGridX,
        y: startGridY,
    });

    //開始 → 目的地の順番に戻す
    path.reverse();

    return path;
}


//=================================
//一番近い歩けるマスを探す係
//=================================
export function findNearestWalkableCell(
    startX,
    startY
) {
    const startGridX = Math.floor(startX / MapGrid.TILE_SIZE);
    const startGridY = Math.floor(startY / MapGrid.TILE_SIZE);

    if (
        startGridX < 0 ||
        startGridX >= MapGrid.WIDTH ||
        startGridY < 0 ||
        startGridY >= MapGrid.HEIGHT
    ) {
        return null;
    }

    const startTerrain = terrainGrid[startGridY][startGridX];

    //すでに歩ける場所なら、そのマスを返す
    if (terrainMaster[startTerrain]?.canHiyokoWalk) {
        return {
            x: startGridX,
            y: startGridY,
        };
    }

    const queue = [{
        x: startGridX,
        y: startGridY,
    },];

    const visited = Array.from(
        { length: MapGrid.HEIGHT }, () => Array.from(
            { length: MapGrid.WIDTH }, () => false)
    );

    visited[startGridY][startGridX] = true;

    const directions = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 },
    ];

    while (queue.length > 0) {
        const current = queue.shift();

        for (const direction of directions) {
            const nextX = current.x + direction.x;
            const nextY = current.y + direction.y;

            if (
                nextX < 0 ||
                nextX >= MapGrid.WIDTH ||
                nextY < 0 ||
                nextY >= MapGrid.HEIGHT
            ) {
                continue;
            }

            if (visited[nextY][nextX]) {
                continue;
            }

            visited[nextY][nextX] = true;

            const terrain = terrainGrid[nextY][nextX];

            //歩ける場所を見つけた！
            if (terrainMaster[terrain]?.canHiyokoWalk) {
                return {
                    x: nextX,
                    y: nextY,
                };
            }

            queue.push({
                x: nextX,
                y: nextY,
            });
        }
    }

    return null;
}


//=================================
//歩けるマスの中で一番近い地点を探す係
//=================================
export function getNearestPointInCell(startX, startY, gridX, gridY) {
    const left = gridX * MapGrid.TILE_SIZE;
    const right = (gridX + 1) * MapGrid.TILE_SIZE;
    const top = gridY * MapGrid.TILE_SIZE;
    const bottom = (gridY + 1) * MapGrid.TILE_SIZE;

    //マスの中に少しだけ入った位置を目標にする
    const margin = 16;

    const targetX = Math.max(
        left + margin,
        Math.min(startX, right - margin)
    );

    const targetY = Math.max(
        top + margin,
        Math.min(startY, bottom - margin)
    );

    return {
        x: targetX,
        y: targetY,
    };
}

//=================================
//物を置けるか判定する係
//=================================
//お手伝い係
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
