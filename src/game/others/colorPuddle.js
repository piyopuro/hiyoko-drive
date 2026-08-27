import { getRandomNumber } from "../utils/math";
import { worldToScreen } from "../utils/draw";
import { vehicleMaster } from "../constants/vehicleMaster";
import { Map } from "../constants/mapConfig";


//=========インク池の情報たち========

export const colorPuddleMaster = [
    {
        id: 1,
        radius: 80,
        skin: "yellow",
        imageName: "puddle01",
    },
    {
        id: 2,
        radius: 80,
        skin: "blue",
        imageName: "puddle02",
    },
    {
        id: 3,
        radius: 80,
        skin: "green",
        imageName: "puddle03",
    },
    {
        id: 4,
        radius: 80,
        skin: "pink",
        imageName: "puddle04",
    },
    {
        id: 5,
        radius: 80,
        skin: "red",
        imageName: "puddle05",
    },
    {
        id: 6,
        radius: 80,
        skin: "purple",
        imageName: "puddle06",
    },
    {
        id: 7,
        radius: 80,
        skin: "limeGreen",
        imageName: "puddle07",
    },
    {
        id: 8,
        radius: 80,
        skin: "orange",
        imageName: "puddle08",
    },
];


//========================================
//インク池ランダム配置係
//========================================
export function createRandomColorPuddles() {
    const placedPuddles = [];

    const margin = 100; //余白
    const puddleGap = 60; //インク池すきま

    //バスの初期位置
    const vehicleStartPosition = {
        x: 960,
        y: 540,
    };
    const vehicleStartGap = 220;

    for (const puddleMaster of colorPuddleMaster) {
        let positionFound = false;

        //100回まで探せる
        for (let attempt = 0; attempt < 100; attempt++) {
            const x = getRandomNumber(
                margin + puddleMaster.radius,
                Map.WIDTH - margin - puddleMaster.radius
            );
            const y = getRandomNumber(
                margin + puddleMaster.radius,
                1250 - margin - puddleMaster.radius
            );

            //インク池重なりチェック
            const overlapsPuddle = placedPuddles.some((placedPuddle) => {
                const dx = x - placedPuddle.x;
                const dy = y - placedPuddle.y;

                const distance = Math.hypot(dx, dy);

                const minimumDistance =
                    puddleMaster.radius +
                    placedPuddle.radius +
                    puddleGap;

                return distance < minimumDistance;
            });

            //バスの初期位置に近すぎないか確認
            const distanceFromVehicleStart = Math.hypot(
                x - vehicleStartPosition.x,
                y - vehicleStartPosition.y
            );

            const tooCloseToVehicleStart =
                distanceFromVehicleStart < vehicleStartGap;

            //問題がなければ、この位置に決定！
            if (!overlapsPuddle && !tooCloseToVehicleStart) {
                placedPuddles.push({
                    ...puddleMaster,
                    x,
                    y,
                });

                positionFound = true;
                break;
            }
        }

        if (!positionFound) {
            console.warn(
                `インク池 ${puddleMaster.id} の置き場所が見つかりませんでした`
            );
        }
    }

    return placedPuddles;
}


//========================================
//インク池描画係
//========================================
export function drawColorPuddle(ctx, puddle, image, camera) {
    const size = puddle.radius * 2;

    const screenPosition = worldToScreen(
        puddle.x,
        puddle.y,
        camera
    );

    ctx.drawImage(
        image,
        screenPosition.x - size / 2,
        screenPosition.y - size / 2,
        size,
        size,
    );
}


//========================================
//インク池警察
//========================================
export function updateColorPuddleCollision(vehicle, puddles) {
    const master = vehicleMaster[vehicle.type];

    if (!master.canChangeColor) return;  //色変可能なくるまかどうかチェック！

    for (const puddle of puddles) {
        const dx = vehicle.position.x - puddle.x;
        const dy = vehicle.position.y - puddle.y;

        const distance = Math.hypot(dx, dy);  //インク池と車の距離

        if (distance < puddle.radius) { //インク池に触ったかな？
            vehicle.skin = puddle.skin;
        }
    }
}
