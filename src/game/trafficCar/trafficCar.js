import { worldToScreen } from "../utils/draw";
import { roadMap, Road } from "../constants/roadConfig";
import { drawShadow } from "../utils/draw";
import { Direction } from "../constants/vehicleMaster";
import {
	CarCarrierConfig,
	CarCarrierRampAction,
	CarCarrierUpperDeckAction,
} from "../vehicle/carCarrierAction";
import { findNearestRoadCenter } from "../constants/mapGrid";
import SoundManager from "../../SoundManager";

//ひよこカー情報
export const TrafficCar = {
	SPEED: 150,
	FRAME_INTERVAL: 200,
	TAP_FRAMES: [0, 2, 3, 4, 3, 4, 3, 4, 3, 2, 0],
	TAP_FRAME_INTERVAL: 170,
	POYON_DURATION: 300,


	// 荷下ろしアニメーション
	UNLOADING_SPEED: 150,
	UNLOADING_CLEAR_DISTANCE: 400,

};

export const TrafficCarMode = {
	AUTO: "auto",
	RETURNING_TO_ROAD: "returningToRoad",
	CARRIER_APPROACH: "carrierApproach",
	CARRIER_WAITING: "carrierWaiting",
	CARRIER_LOADED: "carrierLoaded",
	CARRIER_UNLOADING: "carrierUnloading",
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

		// カーキャリア関連
		mode: TrafficCarMode.AUTO,
		carrierTargetX: null,
		carrierTargetY: null,

		// 積載位置
		carrierSlot: null,  //0:上段・左　1:上段・右　2:下段・左　3:下段・右

		// つまみ関連
		isPickedUp: false,
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

		if (car.mode !== TrafficCarMode.AUTO && car.mode !== TrafficCarMode.CARRIER_WAITING) {
			return false;
		}

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
	const elapsed = now - car.poyonStart;
	const progress = Math.min(
		elapsed / TrafficCar.POYON_DURATION,
		1
	);

	car.scale = 1 + Math.sin(progress * Math.PI) * 0.3;

	if (progress >= 1) {
		car.scale = 1;
		car.poyonStart = 0;
	}
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
	// 影を描画するか判定
	const shouldDrawShadow =
		// つままれている間は影を消す
		!car.isPickedUp &&

		// カーキャリアに積載中は影を消す
		car.mode !== TrafficCarMode.CARRIER_LOADED &&

		// 荷下ろし中は、スロープを降り終わるまで影を消す
		!(
			car.mode === TrafficCarMode.CARRIER_UNLOADING &&
			car.unloadingPhase !== "ground"
		);

	if (shouldDrawShadow) {
		drawShadow(
			ctx,
			screenPosition.x,
			screenPosition.y + 32,
			50,
			18
		);
	}

	ctx.save();
	ctx.translate(screenPosition.x, screenPosition.y);

	if (car.mode === TrafficCarMode.CARRIER_UNLOADING) {
		ctx.rotate(car.unloadingAngle || 0);
	}

	ctx.drawImage(
		image,
		sx,
		sy,
		FRAME_WIDTH,
		FRAME_HEIGHT,
		-drawWidth / 2,
		-drawHeight / 2,
		drawWidth,
		drawHeight
	);
	ctx.restore();
}


//=======================================
// ひよこカー：通常走行モード
//=======================================
function updateTrafficCarAuto(car, now, deltaTime) {

	car.frame = Math.floor(now / TrafficCar.FRAME_INTERVAL) % 2;

	//ひよこカーの座標から道路座標・道路タイプを取得
	const road = getRoadAtPosition(car.x, car.y);

	// 道路外にいる場合は、最寄りの道路へ復帰する
	if (!road) {
		const nearestRoad = findNearestRoadCenter(car.x, car.y);

		if (!nearestRoad) return;

		car.returnRoadTargetX = nearestRoad.x;
		car.returnRoadTargetY = nearestRoad.y;
		car.mode = TrafficCarMode.RETURNING_TO_ROAD;

		return;
	}


	//通常走行処理

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

//=======================================
// ひよこカー：道路復帰モード
//=======================================
function updateTrafficCarReturningToRoad(car, deltaTime) {
	const targetX = car.returnRoadTargetX;
	const targetY = car.returnRoadTargetY;

	if (targetX == null || targetY == null) {
		car.mode = TrafficCarMode.AUTO;
		return;
	}

	const dx = targetX - car.x;
	const dy = targetY - car.y;
	const distance = Math.hypot(dx, dy);

	const arrivalDistance = 3;
	const moveDistance = TrafficCar.SPEED * deltaTime;

	// 道路中心に到着
	if (distance <= arrivalDistance || distance <= moveDistance) {
		car.x = targetX;
		car.y = targetY;

		const road = getRoadAtPosition(car.x, car.y);

		if (road) {
			car.turnRoadX = road.x;
			car.turnRoadY = road.y;
			car.direction = getNextDirection(car, road);
		}

		car.returnRoadTargetX = null;
		car.returnRoadTargetY = null;
		car.mode = TrafficCarMode.AUTO;
		return;
	}

	// 道路中心に向かって走行
	car.x += (dx / distance) * moveDistance;
	car.y += (dy / distance) * moveDistance;

	// 移動方向に合わせて車体の向きを変更
	if (Math.abs(dx) >= Math.abs(dy)) {
		car.direction = dx >= 0 ? "right" : "left";
	} else {
		car.direction = dy >= 0 ? "down" : "up";
	}
}

//=======================================
// ひよこカー：カーキャリアのところに集合モード
//=======================================
function updateTrafficCarApproach(car, deltaTime) {

	const dx = car.carrierTargetX - car.x;
	const dy = car.carrierTargetY - car.y;
	const distance = Math.hypot(dx, dy);

	const speed = 1200;
	const arrivalDistance = 5;

	if (distance <= arrivalDistance) {
		car.x = car.carrierTargetX;
		car.y = car.carrierTargetY;
		car.mode = TrafficCarMode.CARRIER_WAITING;
		// 集合完了時に向きをそろえる
		car.direction = car.carrierTargetDirection ?? car.direction;
		car.mode = TrafficCarMode.CARRIER_WAITING;
		return;
	}

	const moveDistance = Math.min(
		speed * deltaTime,
		distance
	);

	car.x += (dx / distance) * moveDistance;
	car.y += (dy / distance) * moveDistance;

	return;
}


//=======================================
// カーキャリアと一緒係
//=======================================
export function updateLoadedTrafficCars(carrier) {
	if (
		carrier.type !== "carCarrier" ||
		!carrier.loadedCars?.length
	) {
		return;
	}

	const slots = CarCarrierConfig.LOADING_SLOTS;
	const directionMap = {
		[Direction.RIGHT]: "right",
		[Direction.LEFT]: "left",
		[Direction.FRONT]: "down",
		[Direction.BACK]: "up",
	};

	carrier.loadedCars.forEach((car) => {
		const slot = slots[car.carrierSlot];

		if (!slot) return;

		let offsetX;
		let offsetY;

		// カーキャリアの向きに合わせてスロットを回転
		switch (carrier.direction) {
			case Direction.RIGHT:
				offsetX = slot.x;
				offsetY = slot.y;
				break;

			case Direction.LEFT:
				offsetX = -slot.x;
				offsetY = slot.y;
				break;

			case Direction.FRONT:
				offsetX = 0;
				offsetY = slot.y;
				break;

			case Direction.BACK:
				offsetX = 0;
				offsetY = slot.y;
				break;

			default:
				offsetX = slot.x;
				offsetY = slot.y;
		}

		// カーキャリアの位置を基準に配置
		car.x = carrier.position.x + offsetX;
		car.y = carrier.position.y + offsetY;

		// ひよこカーの向きも合わせる
		car.direction = directionMap[carrier.direction] ?? car.direction;
	});
}

//=======================================
// カーキャリア上段のひよこカーを降ろす係
//=======================================
export function updateCarCarrierUpperDeckCars(carrier) {
	if (
		carrier.type !== "carCarrier" ||
		carrier.carrierEvent !== "unloading" ||
		![
			"upperDeckLowering",
			"upperCarsUnloading",
		].includes(carrier.unloadingPhase)
	) {
		return;
	}

	const slots = CarCarrierConfig.LOADING_SLOTS;
	const progress =
		carrier.unloadingPhase === "upperCarsUnloading"
			? 1
			: carrier.upperDeckProgress ?? 0;

	const offsetY = CarCarrierUpperDeckAction.DROP_DISTANCE * progress;

	carrier.loadedCars?.forEach((car) => {
		const slot = slots[car.carrierSlot];

		if (!slot) return;

		let offsetX;
		let slotY;

		switch (carrier.direction) {
			case Direction.RIGHT:
				offsetX = slot.x;
				slotY = slot.y;
				break;

			case Direction.LEFT:
				offsetX = -slot.x;
				slotY = slot.y;
				break;

			default:
				offsetX = slot.x;
				slotY = slot.y;
		}

		car.x = carrier.position.x + offsetX;
		car.y = carrier.position.y + slotY + offsetY;
	});
}

//=======================================
// ひよこカー：カーキャリアから降りるモード
//=======================================
function updateTrafficCarUnloading(car, now, deltaTime, soundManager) {

	const speed = TrafficCar.UNLOADING_SPEED;
	const carrier = car.unloadingCarrier;

	if (!carrier) return;

	const isRight = carrier.direction === Direction.RIGHT;
	// 進行方向
	const directionSign = isRight ? -1 : 1;
	// フレーム間の移動量
	const moveDistance = speed * deltaTime;


	// drawCarCarrierRamp と同じ計算でスロープの支点を求める
	const scaleX = carrier.transform?.scaleX ?? 1;
	const scaleY = carrier.transform?.scaleY ?? 1;
	const carrierDrawWidth = 360 * scaleX;
	const carrierDrawHeight = 140 * scaleY;

	const pivotX =
		carrier.position.x +
		(isRight ? 1 : -1) *
		(-carrierDrawWidth / 2 + 11 * scaleX);

	const pivotY =
		carrier.position.y -
		carrierDrawHeight / 2 +
		115 * scaleY;


	// 実際に描画しているスロープの角度・高さを使用
	const rampHeight = CarCarrierRampAction.FRAME_HEIGHT * scaleY;
	const rampAngle = CarCarrierRampAction.MAX_ANGLE;
	const rotationSign = isRight ? -1 : 1;
	const theta = rampAngle * rotationSign;

	// 支点からスロープ先端までの相対位置
	const rampDX = rampHeight * Math.sin(theta);
	const rampDY = -rampHeight * Math.cos(theta);

	// 荷下ろし開始時の初期化
	if (car.unloadingPhase == null) {
		car.unloadingPhase = "horizontal";
		car.unloadingAngle = 0;
		car.unloadingRampProgress = 0;
	}


	switch (car.unloadingPhase) {
		// -------------------------------
		// 1. 荷台の上を水平に後退
		// -------------------------------
		case "horizontal": {
			// 車体の中心がスロープの支点に到達するまで後退
			const remainingX = (pivotX - car.x) * directionSign;

			//到達したら次のフェーズへ
			if (remainingX <= 0) {
				car.x = pivotX;
				car.unloadingPhase = "ramp";
				car.unloadingRampProgress = 0;

				// スロープ走行の始点を記録
				car.unloadingRampStartX = car.x;
				car.unloadingRampStartY = car.y;

				// 車体の現在位置を基準に終点を計算。
				car.unloadingRampEndX = car.unloadingRampStartX + rampDX;
				car.unloadingRampEndY = car.unloadingRampStartY + rampDY;

				break;
			}

			const step = Math.min(moveDistance, remainingX);

			car.x += directionSign * step;
			car.unloadingAngle = 0;

			// 支点に到達したらスロープ走行へ
			if (step >= remainingX) {
				car.x = pivotX;
				car.unloadingPhase = "ramp";
				car.unloadingRampProgress = 0;

				car.unloadingRampStartX = car.x;
				car.unloadingRampStartY = car.y;

				car.unloadingRampEndX = car.unloadingRampStartX + rampDX;
				car.unloadingRampEndY = car.unloadingRampStartY + rampDY;
			}

			break;
		}

		// -------------------------------
		// 2. スロープに沿って斜めに降りる
		// -------------------------------
		case "ramp": {

			const startX = car.unloadingRampStartX;
			const startY = car.unloadingRampStartY;

			const endX = car.unloadingRampEndX;
			const endY = car.unloadingRampEndY;

			const dx = endX - startX;
			const dy = endY - startY;

			const rampLength = Math.hypot(dx, dy);

			if (rampLength <= 0) {
				car.unloadingPhase = "ground";
				car.unloadingAngle = 0;
				break;
			}

			// 前フレームからの移動距離を加算
			car.unloadingRampProgress = Math.min(
				car.unloadingRampProgress + moveDistance,
				rampLength
			);

			const progress = car.unloadingRampProgress / rampLength;

			// スロープの直線上を移動
			car.x = startX + dx * progress;
			car.y = startY + dy * progress;

			// 進行方向に合わせて車体を傾ける
			const travelAngle = Math.atan2(dy, dx);

			car.unloadingAngle = isRight
				? travelAngle - Math.PI
				: travelAngle;

			// スロープの終点に到達
			if (progress >= 1) {
				car.x = endX;
				car.y = endY;

				car.unloadingPhase = "ground";
				car.unloadingAngle = 0;
			}

			break;
		}

		// -------------------------------
		// 3. 地面を水平に後退
		// -------------------------------
		case "ground": {
			car.x += directionSign * moveDistance;
			car.unloadingAngle = 0;
			break;
		}
	}


	car.frame = Math.floor(now / TrafficCar.FRAME_INTERVAL) % 2;


	const distanceFromCarrier = Math.hypot(
		car.x - carrier.position.x,
		car.y - carrier.position.y
	);


	if (
		car.unloadingPhase === "ground" &&
		distanceFromCarrier >= TrafficCar.UNLOADING_CLEAR_DISTANCE
	) {

		soundManager?.play("car02");

		// 最寄りの道路中心を探す
		const nearestRoad = findNearestRoadCenter(car.x, car.y);

		if (nearestRoad) {
			car.returnRoadTargetX = nearestRoad.x;
			car.returnRoadTargetY = nearestRoad.y;
			car.mode = TrafficCarMode.RETURNING_TO_ROAD;
		} else {
			car.mode = TrafficCarMode.AUTO;
		}


		car.unloadingCarrier = null;
		car.unloadingPhase = null;
		car.unloadingDistance = null;
		car.unloadingAngle = 0;

		// スロープ走行用のデータを初期化
		car.unloadingRampProgress = 0;
		car.unloadingRampStartX = null;
		car.unloadingRampStartY = null;
		car.unloadingRampEndX = null;
		car.unloadingRampEndY = null;

		car.carrierSlot = null;
	}
}


//=======================================
// ひよこカー監督
//=======================================
export function updateTrafficCar(car, now, deltaTime, soundManager) {

	// ぽよんアニメーション
	if (car.poyonStart > 0) {
		updateTrafficCarPoyon(car, now);
	}

	// つまんでいる間は移動・走行アニメーションを停止
	if (car.isPickedUp) {
		return;
	}

	//ひよこカータップ時
	if (car.tapAnimation) {
		//updateTrafficCarPoyon(car, now);

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


	switch (car.mode) {
		case TrafficCarMode.AUTO:
			updateTrafficCarAuto(car, now, deltaTime);
			break;

		case TrafficCarMode.RETURNING_TO_ROAD:
			updateTrafficCarReturningToRoad(car, deltaTime);
			break;

		case TrafficCarMode.CARRIER_APPROACH:
			updateTrafficCarApproach(car, deltaTime);
			break;

		case TrafficCarMode.CARRIER_WAITING:
			// 積載待ち
			break;

		case TrafficCarMode.CARRIER_LOADED:
			// 積載中の動作
			break;

		case TrafficCarMode.CARRIER_UNLOADING:
			updateTrafficCarUnloading(car, now, deltaTime, soundManager);
			break;
	}
}