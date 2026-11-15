import * as THREE from "three";

// 窓の設定
export const HOME_WINDOW_CONFIG = {
  square: {
    image: "houseWindow01",
    mask: "windowMask01",
    hitArea: "square",

    x: 0,
    y: 720,

    width: 816,
    height: 624,
  },

  circle: {
    image: "houseWindow02",
    mask: "windowMask02",
    hitArea: "circle",

    x: 0,
    y: 720,

    width: 816,
    height: 624,
  },

  triangle: {
    image: "houseWindow03",
    mask: "windowMask03",
    hitArea: "triangle",

    x: 0,
    y: 720,

    width: 816,
    height: 624,
  },
};

// 壁全体サイズのマスクを生成する
export function createWallAlphaTexture(windowConfig, maskTexture) {
  const canvas = document.createElement("canvas");

  canvas.width = 3840;
  canvas.height = 1440;

  const ctx = canvas.getContext("2d");

  // 壁全体を白くする（表示する）
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 窓マスクの画像
  const maskImage = maskTexture.image;

  // 中心アンカーから左上座標を計算
  const x =
    windowConfig.x - windowConfig.width / 2 + 1920;

  const y =
    1440 - (windowConfig.y + windowConfig.height / 2);

  // マスクを窓の位置に配置
  ctx.drawImage(
    maskImage,
    x,
    y,
    windowConfig.width,
    windowConfig.height
  );

  const texture = new THREE.CanvasTexture(canvas);

  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;

  return texture;
}

