
import {
	TrafficCar,
	TrafficCarMode,
} from "../trafficCar/trafficCar";
import {
	Direction,
	vehicleMaster,
} from "../constants/vehicleMaster";
import { worldToScreen } from "../utils/draw";


export const CarCarrierState = {
	EMPTY: "empty",
	LOADED: "loaded",
};

export const CarCarrierEvent = {
	NONE: null,
	LOADING: "loading",
	UNLOADING: "unloading",
};

export const CarCarrierConfig = {
	// 積載位置はカーキャリアの中心からの相対座標
	LOADING_SLOTS: [
		{ x: -100, y: -80 },
		{ x: 17, y: -80 },
		{ x: -100, y: 3 },
		{ x: 17, y: 3 },
	],

	// スロットに載せられると判定する距離
	SLOT_HIT_RADIUS: 65,

	// 最大積載台数
	MAX_LOADED_CARS: 4,
};

// カーキャリア：スロープ展開設定
export const CarCarrierRampAction = {
	DURATION: 1000,
	MAX_ANGLE: (Math.PI * 2) / 3.4, // 120度
	FRAME_WIDTH: 30,
	FRAME_HEIGHT: 110,
};

// カーキャリア：上段下降設定
export const CarCarrierUpperDeckAction = {
	DURATION: 1000,
	DROP_DISTANCE: 84,
};


//=======================================
// 積載イベント開始係
//=======================================
export function startCarCarrierLoading(carrier, trafficCars) {
	//既にイベント中なら離脱
	if (carrier.carrierEvent !== CarCarrierEvent.NONE) {
		return;
	}

	carrier.carrierEvent = CarCarrierEvent.LOADING;

	// 前向き・後ろ向きなら左向きに変更
	if (
		carrier.direction === Direction.FRONT ||
		carrier.direction === Direction.BACK
	) {
		carrier.direction = Direction.LEFT;
	}

	// 通常走行中で、タップアニメーション中ではない車を集める
	const availableCars = trafficCars.filter(
		(car) =>
			car.mode === TrafficCarMode.AUTO ||
			car.mode === TrafficCarMode.RETURNING_TO_ROAD &&
			!car.isPickedUp &&
			!car.tapAnimation
	);

	// 集合位置の設定
	const spacing = 140;
	const sideOffset = 200;

	// キャリアの向きに合わせて横一列に並べる
	const directionSign =
		carrier.direction === Direction.RIGHT ? -1 : 1;

	availableCars.slice(0, 4).forEach((car, index) => {
		car.carrierTargetX = carrier.position.x + directionSign * (index - 1.5) * spacing;
		car.carrierTargetY = carrier.position.y + sideOffset;

		// カーキャリアと同じ向きにそろえる
		car.carrierTargetDirection = carrier.direction === Direction.RIGHT ? "right" : "left";

		car.carrierSlot = index;
		car.mode = TrafficCarMode.CARRIER_APPROACH;
	});
}

//=======================================
// ひよこカーを載せる係
//=======================================
export function tryLoadTrafficCar(carrier, car) {
	// 積載イベント中でなければ載せられない
	if (carrier.carrierEvent !== CarCarrierEvent.LOADING) {
		return false;
	}
	// 待機中のひよこカーだけを載せられる
	if (car.mode !== TrafficCarMode.CARRIER_WAITING) {
		return false;
	}
	if (car.isPickedUp) {
		return false;
	}

	// 積載済みの車を確認
	if (!Array.isArray(carrier.loadedCars)) {
		carrier.loadedCars = [];
	}

	// すでに積載済みなら何もしない
	if (carrier.loadedCars.includes(car)) {
		return false;
	}

	if (
		carrier.loadedCars.length >=
		CarCarrierConfig.MAX_LOADED_CARS
	) {
		return false;
	}

	const slots = CarCarrierConfig.LOADING_SLOTS;

	// カーキャリアの向きに応じて左右を反転
	const directionSign = carrier.direction === Direction.RIGHT ? 1 : -1;

	// 空いているスロットのうち、
	// ドロップ位置に最も近いものを探す
	let nearestSlot = null;
	let nearestDistance = Infinity;

	slots.forEach((slot, index) => {
		const isOccupied = carrier.loadedCars.some(
			(loadedCar) => loadedCar.carrierSlot === index
		);

		if (isOccupied) {
			return;
		}

		const slotX = carrier.position.x + slot.x * directionSign;
		const slotY = carrier.position.y + slot.y;

		const distance = Math.hypot(
			car.x - slotX,
			car.y - slotY
		);

		if (distance < nearestDistance) {
			nearestDistance = distance;
			nearestSlot = index;
		}
	});

	// スロットから遠すぎる場合は積載しない
	if (
		nearestSlot === null ||
		nearestDistance > CarCarrierConfig.SLOT_HIT_RADIUS
	) {
		return false;
	}

	// ひよこカーを積載状態にする
	car.mode = TrafficCarMode.CARRIER_LOADED;
	car.carrierSlot = nearestSlot;
	car.isPickedUp = false;

	// カーキャリアに積載する
	carrier.loadedCars.push(car);

	// 1台でも載ったら積載状態
	carrier.carrierState = CarCarrierState.LOADED;

	return true;
}

//=======================================
// 積載イベント終了係
//=======================================
export function finishCarCarrierLoading(carrier, trafficCars) {
	if (carrier.carrierEvent !== CarCarrierEvent.LOADING) return;

	//積まれなかったひよこカーは通常モードへ
	trafficCars.forEach((car) => {
		if (
			car.mode !== TrafficCarMode.CARRIER_APPROACH &&
			car.mode !== TrafficCarMode.CARRIER_WAITING
		) {
			return;
		}

		car.carrierTargetX = null;
		car.carrierTargetY = null;
		car.carrierSlot = null;
		car.mode = TrafficCarMode.AUTO;
	});

	//1台でも積んでいたら積載状態、0台なら空っぽ状態。
	carrier.carrierState =
		carrier.loadedCars.length > 0
			? CarCarrierState.LOADED
			: CarCarrierState.EMPTY;

	carrier.carrierEvent = CarCarrierEvent.NONE;
}

//=======================================
// 荷下ろしイベント開始係
//=======================================
export function startCarCarrierUnloading(carrier, trafficCars) {
	//イベント中or空っぽなら離脱
	if (
		carrier.carrierEvent !== CarCarrierEvent.NONE ||
		carrier.carrierState !== CarCarrierState.LOADED
	) {
		return false;
	}

	// 前向き・後ろ向きなら左向きに変更
	if (
		carrier.direction === Direction.FRONT ||
		carrier.direction === Direction.BACK
	) {
		carrier.direction = Direction.LEFT;
	}

	// 荷下ろしイベント開始
	carrier.carrierEvent = CarCarrierEvent.UNLOADING;
	carrier.unloadingPhase = "rampOpening";
	carrier.unloadingStartTime = performance.now();

	return true;
}

//=======================================
// 荷下ろし開始・進行管理係
//=======================================
export function updateCarCarrierUnloading(carrier, now, soundManager) {
	if (carrier.carrierEvent !== CarCarrierEvent.UNLOADING) {
		return;
	}


	// -----------------------------------
	// 1. スロープが開き終わるまで待つ
	// -----------------------------------
	if (
		carrier.unloadingPhase === "rampOpening" &&
		carrier.unloadingStartTime != null
	) {

		const elapsed = now - carrier.unloadingStartTime;

		if (elapsed < CarCarrierRampAction.DURATION) {
			return;
		}

		// 下段のひよこカーを取り出す
		const unloadingCars = carrier.loadedCars.filter(
			(car) => car.carrierSlot >= 2
		);

		// 上段のひよこカーはキャリアに残す
		carrier.loadedCars = carrier.loadedCars.filter(
			(car) => car.carrierSlot < 2
		);

		// 下段のひよこカーを荷下ろしモードへ
		unloadingCars.forEach((car) => {
			car.mode = TrafficCarMode.CARRIER_UNLOADING;

			// 荷下ろしするカーキャリアを記録
			car.unloadingCarrier = carrier;

			// 荷下ろしの段階と移動距離を初期化
			car.unloadingPhase = "horizontal";
			car.unloadingDistance = 0;

			// キャリアの向きに応じて後退方向を決める
			car.unloadingDirection = carrier.direction === Direction.RIGHT ? -1 : 1;
		});

		// 下段の荷下ろしへ
		carrier.unloadingCars = unloadingCars;
		carrier.unloadingPhase = "carsUnloading";

		return;
	}

	// -----------------------------------
	// 2. 下段が空になるまで待つ
	// -----------------------------------
	if (carrier.unloadingPhase === "carsUnloading") {
		const unloadingCars = carrier.unloadingCars ?? [];

		const allCarsUnloaded = unloadingCars.every(
			(car) => car.mode !== TrafficCarMode.CARRIER_UNLOADING
		);

		if (!allCarsUnloaded) {
			return;
		}

		// 上段にひよこカーが残っていなければ、ここで終了
		if (!carrier.loadedCars || carrier.loadedCars.length === 0) {
			finishCarCarrierUnloading(carrier);
			return;
		}

		// 上段下降開始
		carrier.unloadingPhase = "upperDeckLowering";
		carrier.upperDeckLowerStartTime = now;

		soundManager?.play("carCarrier03");

		return;
	}

	// -----------------------------------
	// 3. 上段を下降させる
	// -----------------------------------
	if (carrier.unloadingPhase === "upperDeckLowering") {
		const elapsed = now - carrier.upperDeckLowerStartTime;

		const progress = Math.min(
			Math.max(elapsed / CarCarrierUpperDeckAction.DURATION, 0),
			1
		);

		carrier.upperDeckProgress = progress;

		if (progress < 1) {
			return;
		}

		// 上段下降完了
		carrier.upperDeckProgress = 1;

		// 上段のひよこカーを取得
		const unloadingCars = [...(carrier.loadedCars ?? [])];

		// 下降後の座標を確定してから荷下ろしへ移行する
		const slots = CarCarrierConfig.LOADING_SLOTS;

		unloadingCars.forEach((car) => {
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
			car.y =
				carrier.position.y +
				slotY +
				CarCarrierUpperDeckAction.DROP_DISTANCE;
		});

		unloadingCars.forEach((car) => {
			car.mode = TrafficCarMode.CARRIER_UNLOADING;
			car.unloadingCarrier = carrier;
			car.unloadingPhase = "horizontal";
			car.unloadingDistance = 0;

			car.unloadingDirection = carrier.direction === Direction.RIGHT ? -1 : 1;
		});

		carrier.loadedCars = [];
		carrier.unloadingCars = unloadingCars;
		carrier.unloadingPhase = "upperCarsUnloading";

		return;
	}

	// -----------------------------------
	// 4. 上段の荷下ろし完了を待つ
	// -----------------------------------
	if (carrier.unloadingPhase === "upperCarsUnloading") {
		const unloadingCars = carrier.unloadingCars ?? [];

		const allCarsUnloaded = unloadingCars.every(
			(car) => car.mode !== TrafficCarMode.CARRIER_UNLOADING
		);

		if (!allCarsUnloaded) {
			return;
		}

		// 荷下ろしイベント終了
		finishCarCarrierUnloading(carrier);
	}
}


//=======================================
// スロープ描画係
//=======================================
export function drawCarCarrierRamp(ctx, carrier, now, image, camera) {
	if (!image) {
		return;
	}

	if (
		carrier.carrierEvent !== CarCarrierEvent.UNLOADING ||
		![
			"rampOpening",
			"carsUnloading",
			"upperDeckLowering",
			"upperCarsUnloading",
		].includes(carrier.unloadingPhase) ||
		carrier.unloadingStartTime == null
	) {
		return;
	}

	// アニメーションの進行度
	const elapsed = now - carrier.unloadingStartTime;
	const progress = Math.min(
		Math.max(elapsed / CarCarrierRampAction.DURATION, 0),
		1
	);

	// 0度から約60度へ回転
	const angle = CarCarrierRampAction.MAX_ANGLE * progress;

	// 右向きならフレーム0、左向きならフレーム1
	const frame = carrier.direction === Direction.RIGHT ? 0 : 1;

	const {
		FRAME_WIDTH,
		FRAME_HEIGHT,
	} = CarCarrierRampAction;

	const screenPosition = worldToScreen(
		carrier.position.x,
		carrier.position.y,
		camera
	);

	// カーキャリアの画像サイズを取得
	const drawWidth = 360 * carrier.transform.scaleX;
	const drawHeight = 140 * carrier.transform.scaleY;

	// スロープの下端中央を回転の支点にする
	// 右向き・左向きでX座標を反転する
	const directionSign = carrier.direction === Direction.RIGHT ? 1 : -1;

	const anchorX =
		screenPosition.x +
		directionSign * (-drawWidth / 2 + 11 * carrier.transform.scaleX);

	const anchorY =
		screenPosition.y -
		drawHeight / 2 +
		115 * carrier.transform.scaleY;


	ctx.save();

	ctx.translate(anchorX, anchorY);

	// 左右の向きに合わせて回転方向を反転
	const rotationSign = carrier.direction === Direction.RIGHT ? -1 : 1;

	ctx.rotate(angle * rotationSign);

	ctx.drawImage(
		image,
		0,
		frame * FRAME_HEIGHT,
		FRAME_WIDTH,
		FRAME_HEIGHT,
		-FRAME_WIDTH * carrier.transform.scaleX / 2,
		-FRAME_HEIGHT * carrier.transform.scaleY,
		FRAME_WIDTH * carrier.transform.scaleX,
		FRAME_HEIGHT * carrier.transform.scaleY
	);

	ctx.restore();
}

//=======================================
// カーキャリア：上段パーツ描画係
//=======================================
export function drawCarCarrierLowerDeck(ctx, carrier, image, camera) {
	if (!image) {
		return;
	}

	if (
		carrier.carrierEvent !== CarCarrierEvent.UNLOADING ||
		carrier.unloadingPhase !== "upperDeckLowering" &&
		carrier.unloadingPhase !== "upperCarsUnloading"
	) {
		return;
	}

	const progress =
		carrier.unloadingPhase === "upperCarsUnloading"
			? 1
			: carrier.upperDeckProgress ?? 0;

	const offsetY = CarCarrierUpperDeckAction.DROP_DISTANCE * progress;
	const frame = carrier.direction === Direction.RIGHT ? 0 : 1;

	const screenPosition = worldToScreen(
		carrier.position.x,
		carrier.position.y + offsetY,
		camera
	);

	const scaleX = carrier.transform.scaleX;
	const scaleY = carrier.transform.scaleY;

	const frameWidth = 360;
	const frameHeight = 140;

	ctx.drawImage(
		image,
		0,
		frame * frameHeight,
		frameWidth,
		frameHeight,
		screenPosition.x - frameWidth * scaleX / 2,
		screenPosition.y - frameHeight * scaleY / 2,
		frameWidth * scaleX,
		frameHeight * scaleY
	);
}


//=======================================
// 荷下ろしイベント終了係
//=======================================
export function finishCarCarrierUnloading(carrier, trafficCars) {
	if (carrier.carrierEvent !== CarCarrierEvent.UNLOADING) {
		return;
	}

	// カーキャリアを通常状態へ戻す
	carrier.carrierState = CarCarrierState.EMPTY;
	carrier.carrierEvent = CarCarrierEvent.NONE;

	// 荷下ろしの進行状況を初期化
	carrier.unloadingPhase = null;
	carrier.unloadingStartTime = null;
	carrier.unloadingCars = [];

	// 上段下降アニメーションの情報を初期化
	carrier.upperDeckLowerStartTime = null;
	carrier.upperDeckProgress = 0;

	// 積載情報を空にする
	carrier.loadedCars = [];
}

