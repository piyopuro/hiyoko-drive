import * as THREE from "three";

// おうちモードで使用する画像一覧
const HOME_IMAGE_NAMES = [
  "houseOutButton",

  "skyNight", "star01", "moon01", "moon02",

  "skyDay", "skyCloudy",
  "sun01", "sun02", "cloud01", "cloudEffect",
  "rain01", "rain02",

  "houseWall02", "houseFloor01",

  "houseWindow01", "houseWindow02", "houseWindow03",
  "windowMask01", "windowMask02", "windowMask03",

  "windowButton01", "windowButton02", "windowButton03",
  "dayNightButton"
];
//おうちモード用効果音一覧
const HOME_SOUND_NAMES = [
    "furnitureSelect01",
    "uiButtonTap",
    "dayNightSwitch",
  ];


  // 画像の保存先
  const HOME_IMAGE_PATH = `${import.meta.env.BASE_URL}images/homeMode/`;

  const textureCache = new Map();

// テクスチャを取得する
async function getCachedTexture(name, extension = ".webp") {
    const path = `${HOME_IMAGE_PATH}${name}${extension}`;

  // すでに読み込み済みならキャッシュを返す
  if (!textureCache.has(path)) {
    const loader = new THREE.TextureLoader();

    const texturePromise = loader.loadAsync(path)
      .then((texture) => {

        // マスク画像PNGは色ではなく数値として扱う
        texture.colorSpace =
          extension === ".png"
            ? THREE.NoColorSpace
            : THREE.SRGBColorSpace;

        return texture;
      })
      .catch((error) => {
        // 読み込みに失敗した場合はキャッシュを削除
        textureCache.delete(path);
        throw error;
      });

    textureCache.set(path, texturePromise);
  }

  return textureCache.get(path);
}


// おうち画像を読み込み所
export async function loadHomeImages() {
  const entries = await Promise.all(
    HOME_IMAGE_NAMES.map(async (name) => {
      const isMask = name.startsWith("windowMask");
      const extension = isMask ? ".png" : ".webp";


      const texture = await getCachedTexture(name, extension);
      return [name, texture];
    })
  );

  return Object.fromEntries(entries);
}


// おうちモードの効果音を読み込む
export async function loadHomeSounds(soundManager) {
    await Promise.all(
    HOME_SOUND_NAMES.map((name) =>
      soundManager.load(
        name,
        `${import.meta.env.BASE_URL}sounds/homeMode/${name}.mp3`
      )
    )
  );

  console.log("おうちモードの効果音読み込み完了");
}