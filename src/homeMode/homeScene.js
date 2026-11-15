import * as THREE from "three";

import {
  HOME_WINDOW_CONFIG,
  createWallAlphaTexture,
} from "./homeConfig";


//===========================================
// おうちの3Dシーンを作る
//===========================================
export function createHomeScene(
  mountElement,
  homeImages,
  onWindowTap,
  onWindowZoomComplete
) {

  //===========================================
  // シーン・カメラ・描画装置
  //===========================================

  //-----------------
  // カメラの基本位置
  //-----------------

  const HOME_CAMERA_DEFAULT = {
    position: new THREE.Vector3(0, 600, 2400),
    lookAt: new THREE.Vector3(0, 600, 0),
  };


  const scene = new THREE.Scene();
  scene.background = null;

  const camera = new THREE.PerspectiveCamera(
    35, //視野角
    1920 / 1440,
    1,
    10000
  );

  // カメラ位置と向き
  camera.position.copy(HOME_CAMERA_DEFAULT.position);
  // カメラが見ている位置
  const cameraLookAt = HOME_CAMERA_DEFAULT.lookAt.clone();
  camera.lookAt(cameraLookAt);

  // 描画装置
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });

  renderer.setSize(1920, 1440);
  renderer.setPixelRatio(1);

  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.display = "block";

  // 描画装置を取り付ける
  mountElement.appendChild(renderer.domElement);



  //===========================================
  // お部屋の中を作る部署
  //===========================================

  //-----------壁 建設情報------------

  const wallGeometry = new THREE.PlaneGeometry(3840, 1440);

  // 今回使用する窓
  let activeWindow = HOME_WINDOW_CONFIG.square;

  // 壁全体サイズのマスクを生成
  const wallAlphaTexture = createWallAlphaTexture(
    activeWindow,
    homeImages[activeWindow.mask]
  );

  const wallMaterial = new THREE.MeshBasicMaterial({
    map: homeImages.houseWall02,
    alphaMap: wallAlphaTexture,
    transparent: true,
    alphaTest: 0.01,
  });

  const wall = new THREE.Mesh(wallGeometry, wallMaterial);

  wall.position.set(0, 720, 0);
  scene.add(wall);


  //---------窓 建設情報--------------------

  const windowGeometry = new THREE.PlaneGeometry(
    activeWindow.width,
    activeWindow.height
  );

  const windowMaterial = new THREE.MeshBasicMaterial({
    map: homeImages[activeWindow.image],
    transparent: true,
  });

  const windowFrame = new THREE.Mesh(
    windowGeometry,
    windowMaterial
  );

  windowFrame.position.set(
    activeWindow.x,
    activeWindow.y,
    1
  );

  scene.add(windowFrame);


  //-----------床 建設情報--------------

  const floorGeometry = new THREE.PlaneGeometry(3840, 1000);

  const floorMaterial = new THREE.MeshBasicMaterial({
    map: homeImages.houseFloor01,
  });

  const floor = new THREE.Mesh(floorGeometry, floorMaterial);

  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, 500);
  scene.add(floor);



  //===========================================
  // 窓の形状変更
  //===========================================

  function setWindowShape(shape) {

    const nextWindow = HOME_WINDOW_CONFIG[shape];

    if (!nextWindow) return false;

    // すでに同じ形なら変更しない
    if (activeWindow === nextWindow) return true;

    // 新しい壁マスクを生成
    const nextAlphaTexture = createWallAlphaTexture(
      nextWindow,
      homeImages[nextWindow.mask]
    );

    // 壁のマスクを差し替え
    const previousAlphaTexture = wallMaterial.alphaMap;

    wallMaterial.alphaMap = nextAlphaTexture;
    wallMaterial.needsUpdate = true;

    // 古いマスクを片付ける
    previousAlphaTexture.dispose();

    // 窓枠画像を差し替え
    windowMaterial.map = homeImages[nextWindow.image];
    windowMaterial.needsUpdate = true;

    // 現在の窓設定を更新
    activeWindow = nextWindow;

    return true;
  }

  //===========================================
  // 窓タップ判定の準備
  //===========================================

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();


  //===========================================
  // 窓の形状に合わせたタップ判定
  //===========================================

  const hitMaskCache = new Map();

  // マスク画像のピクセル情報を取得
  function getHitMaskData(maskName) {

    if (hitMaskCache.has(maskName)) {
      return hitMaskCache.get(maskName);
    }

    const image = homeImages[maskName].image;

    const canvas = document.createElement("canvas");

    canvas.width = image.width;
    canvas.height = image.height;

    const ctx = canvas.getContext("2d");

    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );

    const data = {
      pixels: imageData.data,
      width: canvas.width,
      height: canvas.height,
    };

    hitMaskCache.set(maskName, data);

    return data;
  }


  // 窓の開口部内か判定
  function isInsideWindowOpening(uv) {

    const maskData = getHitMaskData(activeWindow.mask);

    // UV座標を画像のピクセル座標へ変換
    const x = Math.floor(uv.x * maskData.width);
    const y = Math.floor((1 - uv.y) * maskData.height);

    if (
      x < 0 ||
      x >= maskData.width ||
      y < 0 ||
      y >= maskData.height
    ) {
      return false;
    }

    const index = (y * maskData.width + x) * 4;
    const brightness = maskData.pixels[index];

    // 黒い部分が窓の開口部
    return brightness < 128;
  }


  //===========================================
  // カメラ移動管理
  //===========================================

  let cameraMove = null;
  let isWindowZooming = false;

  // カメラを指定位置へ移動させる
  function moveCameraTo({
    position,
    lookAt,
    duration = 0.8,
    onComplete = null,
  }) {

    // すでに移動中なら新しい移動を開始しない
    if (cameraMove) return false;

    cameraMove = {
      startPosition: camera.position.clone(),
      startLookAt: cameraLookAt.clone(),

      endPosition: new THREE.Vector3(
        position.x,
        position.y,
        position.z
      ),

      endLookAt: new THREE.Vector3(
        lookAt.x,
        lookAt.y,
        lookAt.z
      ),

      duration,
      elapsed: 0,
      onComplete,
    };

    return true;
  }


  // カメラを初期位置へ戻す
  function resetCamera(duration = 0.8) {

    return moveCameraTo({
      position: HOME_CAMERA_DEFAULT.position,
      lookAt: HOME_CAMERA_DEFAULT.lookAt,
      duration,
      onComplete: () => {
        isWindowZooming = false;
      },
    });

  }


  // カメラ移動の更新
  function updateCameraMove(deltaTime) {

    if (!cameraMove) return;

    const move = cameraMove;

    move.elapsed += deltaTime;

    const progress = Math.min(
      move.elapsed / move.duration,
      1
    );

    // 滑らかな加速・減速
    const eased =
      progress * progress * (3 - 2 * progress);

    // カメラ位置
    camera.position.lerpVectors(
      move.startPosition,
      move.endPosition,
      eased
    );

    // カメラの注視点
    cameraLookAt.lerpVectors(
      move.startLookAt,
      move.endLookAt,
      eased
    );

    camera.lookAt(cameraLookAt);

    // 移動完了
    if (progress >= 1) {

      const callback = move.onComplete;

      cameraMove = null;

      callback?.();
    }
  }


  //===========================================
  // 窓イベント開始
  //===========================================

  function startWindowEvent() {

    if (isWindowZooming || cameraMove) return;

    isWindowZooming = true;

    // 窓の位置へカメラを移動
    moveCameraTo({
      position: {
        x: 0,
        y: 720,
        z: 1350,
      },

      lookAt: {
        x: 0,
        y: 720,
        z: 0,
      },

      duration: 0.8,

      // ズーム完了?
      onComplete: () => {
        onWindowZoomComplete?.();
      }
    });

    // HomeMode.jsx に窓イベント開始を通知
    onWindowTap?.();

  }


  //===========================================
  // Raycasterによる窓タップ判定
  //===========================================

  function handlePointerDown(event) {

    // すでにイベント中なら無視
    if (isWindowZooming || cameraMove) return;

    const rect = renderer.domElement.getBoundingClientRect();

    // ブラウザ座標をCanvas内の座標に変換
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // NDC座標に変換（-1 ～ +1）
    pointer.x = (x / rect.width) * 2 - 1;
    pointer.y = -(y / rect.height) * 2 + 1;

    // カメラから光線を飛ばす
    raycaster.setFromCamera(pointer, camera);

    // 窓枠との交差を調べる
    const intersections = raycaster.intersectObject(
      windowFrame,
      false
    );

    if (intersections.length > 0) {

      const intersection = intersections[0];

      // 窓の開口部内か確認
      if (isInsideWindowOpening(intersection.uv)) {
        startWindowEvent();
        return true;
      }
    }
    return false;
  }


  //===========================================
  // お部屋の中の更新処理
  //===========================================


  //お部屋の中監督
  function updateRoom(now, deltaTime) {
    updateCameraMove(deltaTime);
  }

  //===========================================
  // おうちイベントの更新処理
  //===========================================
  //おうちモード監督
  function updateHomeEvent(now, deltaTime) {
    // 今後、窓イベント・空イベントなどを更新
  }

  //====================================
  // お片付け処理
  //====================================

  function dispose() {
    // ジオメトリ
    wallGeometry.dispose();
    windowGeometry.dispose();
    floorGeometry.dispose();

    // マテリアル
    wallMaterial.dispose();
    windowMaterial.dispose();
    floorMaterial.dispose();

    // 自作した壁用マスクテクスチャ
    wallAlphaTexture.dispose();

    // 描画装置
    renderer.dispose();
    // DOMから描画装置を取り外す
    renderer.domElement.remove();
  }



  //===========================================
  // 作ったものを返す
  //===========================================
  return {
    scene,
    camera,
    renderer,
    setWindowShape,
    updateRoom,
    updateHomeEvent,
    moveCameraTo,
    resetCamera,
    handlePointerDown,

    dispose,
  };
}

