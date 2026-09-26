import { getRandomNumber } from "../utils/math";
import { worldToScreen } from "../utils/draw";
import { vehicleMaster } from "../constants/vehicleMaster";
import { Map } from "../constants/mapConfig";

//=========インク飛沫の設定========

export const InkSplash = {
    COUNT_MIN: 7,
    COUNT_MAX: 10,

    SPEED_MIN: 50,
    SPEED_MAX: 140,

    MAIN_SIZE_MIN: 15,
    MAIN_SIZE_MAX: 20,

    CIRCLE_SIZE_MIN: 3,
    CIRCLE_SIZE_MAX: 7,

    GRAVITY: 100,

    DURATION: 500,
};

//=========インク池の情報たち========

export const colorPuddleMaster = [
    {
        id: 1,
        radius: 80,
        skin: "yellow",
        splashColor: "#FFD08A",
        imageName: "puddle_01",
    },
    {
        id: 2,
        radius: 80,
        skin: "blue",
        splashColor: "#4A8BE8",
        imageName: "puddle_02",
    },
    {
        id: 3,
        radius: 80,
        skin: "green",
        splashColor: "#72A84E",
        imageName: "puddle_03",
    },
    {
        id: 4,
        radius: 80,
        skin: "pink",
        splashColor: "#E68AC7",
        imageName: "puddle_04",
    },
    {
        id: 5,
        radius: 80,
        skin: "red",
        splashColor: "#D65A5A",
        imageName: "puddle_05",
    },
    {
        id: 6,
        radius: 80,
        skin: "purple",
        splashColor: "#A35ACB",
        imageName: "puddle_06",
    },
    {
        id: 7,
        radius: 80,
        skin: "limeGreen",
        splashColor: "#A8D94A",
        imageName: "puddle_07",
    },
    {
        id: 8,
        radius: 80,
        skin: "orange",
        splashColor: "#FFB04D",
        imageName: "puddle_08",
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
//インク飛沫を作る係
//========================================
export function createInkSplash(
    puddle,
    now,
    inkSplashes,
    splashType
) {
    console.log("💦 SPLASH TYPE:", splashType);
    const count = Math.floor(
        getRandomNumber(
            InkSplash.COUNT_MIN,
            InkSplash.COUNT_MAX
        )
    );

    for (let i = 0; i < count; i++) {
        const direction =
            Math.random() < 0.5 ? 0 : Math.PI;

        const spread =
            (Math.random() - 0.5) *
            Math.PI * 0.5;

        const angle =
            direction + spread;

        const speed =
            getRandomNumber(
                InkSplash.SPEED_MIN,
                InkSplash.SPEED_MAX
            );

        const isCircle = Math.random() < 0.3;        //30%丸粒
        const size = isCircle
            ? getRandomNumber(InkSplash.CIRCLE_SIZE_MIN, InkSplash.CIRCLE_SIZE_MAX)
            : getRandomNumber(InkSplash.MAIN_SIZE_MIN, InkSplash.MAIN_SIZE_MAX);

        inkSplashes.push({
            x: puddle.x,
            y: puddle.y,

            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,

            type: isCircle
                ? "circle"
                : splashType,

            size,

            color: puddle.splashColor,

            startTime: now,
        });
    }
}

//========================================
//インクの飛沫の形を決める係
//========================================
function getRandomSplashType() {
    const types = [
        "drop",
        "star",
        "sparkle",
        "heart",
    ];

    return types[
        Math.floor(Math.random() * types.length)
    ];
}

//========================================
//インクをとびちらせる係
//========================================
export function updateInkSplashes(
    inkSplashes,
    deltaTime,
    now
) {
    for (let i = inkSplashes.length - 1; i >= 0; i--) {
        const splash = inkSplashes[i];
        const elapsed = now - splash.startTime;

        // 一定時間経ったら削除
        if (elapsed >= InkSplash.DURATION) {
            inkSplashes.splice(i, 1);
            continue;
        }

        // 移動
        splash.x += splash.vx * deltaTime;
        splash.y += splash.vy * deltaTime;
        // 重力
        splash.vy += InkSplash.GRAVITY * deltaTime;
    }
}


//========================================
//インク飛沫（丸粒）の型を作る係
//========================================
function drawInkSplashCircle(
    ctx,
    x,
    y,
    size,
    color
) {
    ctx.beginPath();

    ctx.arc(
        x,
        y,
        size,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = color;
    ctx.fill();
}

//========================================
//インク飛沫（水滴）の型を作る係
//========================================
function drawInkSplashDrop(
    ctx,
    x,
    y,
    size,
    vx,
    vy,
    color
) {
    const angle = Math.atan2(vy, vx) + Math.PI;

    ctx.save();

    ctx.translate(x, y);
    ctx.rotate(angle);

    ctx.beginPath();

    ctx.moveTo(
        size,
        0
    );

    ctx.bezierCurveTo(
        size * 0.5,
        -size * 0.8,
        -size * 0.8,
        -size * 0.8,
        -size * 0.8,
        0
    );

    ctx.bezierCurveTo(
        -size * 0.8,
        size * 0.8,
        size * 0.5,
        size * 0.8,
        size,
        0
    );

    ctx.closePath();

    ctx.fillStyle = color;
    ctx.fill();

    ctx.restore();
}

//========================================
//インク飛沫（★）の型を作る係
//========================================
function drawInkSplashStar(
    ctx,
    x,
    y,
    size,
    color
) {
    const points = 5;
    const innerRadius = size * 0.45;

    ctx.beginPath();

    for (let i = 0; i < points * 2; i++) {
        const angle =
            -Math.PI / 2 +
            (Math.PI * i) / points;

        const radius =
            i % 2 === 0
                ? size
                : innerRadius;

        const px =
            x + Math.cos(angle) * radius;

        const py =
            y + Math.sin(angle) * radius;

        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }

    ctx.closePath();

    ctx.fillStyle = color;
    ctx.fill();
}

//========================================
//インク飛沫（✨）の型を作る係
//========================================
function drawInkSplashSparkle(
    ctx,
    x,
    y,
    size,
    color
) {
    ctx.beginPath();

    ctx.moveTo(
        x,
        y - size
    );

    ctx.lineTo(
        x + size * 0.35,
        y - size * 0.35
    );

    ctx.lineTo(
        x + size,
        y
    );

    ctx.lineTo(
        x + size * 0.35,
        y + size * 0.35
    );

    ctx.lineTo(
        x,
        y + size
    );

    ctx.lineTo(
        x - size * 0.35,
        y + size * 0.35
    );

    ctx.lineTo(
        x - size,
        y
    );

    ctx.lineTo(
        x - size * 0.35,
        y - size * 0.35
    );

    ctx.closePath();

    ctx.fillStyle = color;
    ctx.fill();
}


//========================================
//インク飛沫（♡）の型を作る係
//========================================
function drawInkSplashHeart(
    ctx,
    x,
    y,
    size,
    color
) {
    ctx.beginPath();

    ctx.moveTo(
        x,
        y + size
    );

    ctx.bezierCurveTo(
        x - size * 1.2,
        y + size * 0.2,
        x - size,
        y - size * 0.8,
        x - size * 0.5,
        y - size * 0.8
    );

    ctx.bezierCurveTo(
        x - size * 0.2,
        y - size * 0.8,
        x,
        y - size * 0.45,
        x,
        y - size * 0.2
    );

    ctx.bezierCurveTo(
        x,
        y - size * 0.45,
        x + size * 0.2,
        y - size * 0.8,
        x + size * 0.5,
        y - size * 0.8
    );

    ctx.bezierCurveTo(
        x + size,
        y - size * 0.8,
        x + size * 1.2,
        y + size * 0.2,
        x,
        y + size
    );

    ctx.closePath();

    ctx.fillStyle = color;
    ctx.fill();
}

//========================================
//インク飛沫を描く係
//========================================
export function drawInkSplashes(
    ctx,
    inkSplashes,
    camera
) {
    for (const splash of inkSplashes) {
        const screen = worldToScreen(
            splash.x,
            splash.y,
            camera
        );

        ctx.save();

        switch (splash.type) {
            case "circle":
                drawInkSplashCircle(
                    ctx,
                    screen.x,
                    screen.y,
                    splash.size,
                    splash.color
                );
                break;

            case "drop":
                drawInkSplashDrop(
                    ctx,
                    screen.x,
                    screen.y,
                    splash.size,
                    splash.vx,
                    splash.vy,
                    splash.color
                );
                break;

            case "star":
                drawInkSplashStar(
                    ctx,
                    screen.x,
                    screen.y,
                    splash.size,
                    splash.color
                );
                break;

            case "sparkle":
                drawInkSplashSparkle(
                    ctx,
                    screen.x,
                    screen.y,
                    splash.size,
                    splash.color
                );
                break;

            case "heart":
                drawInkSplashHeart(
                    ctx,
                    screen.x,
                    screen.y,
                    splash.size,
                    splash.color
                );
                break;
        }

        ctx.restore();
    }
}

//========================================
//インク池警察
//========================================
export function updateColorPuddleCollision(
    vehicle,
    puddles,
    now,
    inkSplashes,
    soundManager
) {
    const master = vehicleMaster[vehicle.type];

    if (!master.canChangeColor) return;  //色変可能なくるまかどうかチェック！
    let isInColorPuddle = false;    //インク池に入ったかどうかチェック

    for (const puddle of puddles) {
        const dx = vehicle.position.x - puddle.x;
        const dy = vehicle.position.y - puddle.y;

        const distance = Math.hypot(dx, dy);  //インク池と車の距離

        if (distance < puddle.radius) { //インク池に触ったかな？
            isInColorPuddle = true;
            vehicle.skin = puddle.skin;

            // 池に入った瞬間だけ飛沫を作る
            if (!vehicle.isInColorPuddle) {
                //飛沫タイプ決めて
                const splashType = getRandomSplashType();
                createInkSplash(
                    puddle,
                    now,
                    inkSplashes,
                    splashType
                );

                soundManager.play("inkPuddle01");   //♪インクぽちゃ
            }

            break;
        }
    }
    // 池の外に出たらリセット
    vehicle.isInColorPuddle = isInColorPuddle;
}
