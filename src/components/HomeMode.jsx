import { useEffect, useRef } from "react";
import * as THREE from "three";

const textureCache = new Map();

async function getCachedTexture(path) {
  if (!textureCache.has(path)) {
    const loader = new THREE.TextureLoader();

    const texturePromise = loader.loadAsync(path);

    textureCache.set(path, texturePromise);
  }

  return textureCache.get(path);
}



function HomeMode({ onExit, scale }) {
  const mountRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let renderer;
    let animationFrameId;

    async function initialize() {
      const [wallTexture, floorTexture] = await Promise.all([
        getCachedTexture(
          `${import.meta.env.BASE_URL}images/houseWall02.webp`
        ),
        getCachedTexture(
          `${import.meta.env.BASE_URL}images/houseFloor01.webp`
        ),
      ]);

      // 読み込み中に画面を離れていたら、描画を開始しない
      if (cancelled || !mountRef.current) return;

      wallTexture.colorSpace = THREE.SRGBColorSpace;
      floorTexture.colorSpace = THREE.SRGBColorSpace;

      // 3D空間
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xffffff);

      // カメラ：4:3の画面
      const camera = new THREE.PerspectiveCamera(
        35, //視野角
        1920 / 1440,
        1,
        10000
      );

      // 描画装置
      renderer = new THREE.WebGLRenderer({
        antialias: true,
      });

      renderer.setSize(1920, 1440);
      renderer.setPixelRatio(1);

      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.display = "block";

      mountRef.current.appendChild(renderer.domElement);

      // 壁：XY平面
      const wallGeometry = new THREE.PlaneGeometry(
        3840,
        1440
      );

      const wallMaterial = new THREE.MeshBasicMaterial({
        map: wallTexture,
      });

      const wall = new THREE.Mesh(
        wallGeometry,
        wallMaterial
      );

      wall.position.set(0, 720, 0);
      scene.add(wall);

      // 床：XZ平面
      const floorGeometry = new THREE.PlaneGeometry(
        3840,
        1000
      );

      const floorMaterial = new THREE.MeshBasicMaterial({
        map: floorTexture,
      });

      const floor = new THREE.Mesh(
        floorGeometry,
        floorMaterial
      );

      floor.rotation.x = -Math.PI / 2;
      floor.position.set(0, 0, 500);
      scene.add(floor);

      // カメラ位置と向き
      camera.position.set(0, 600, 2400);
      camera.lookAt(0, 600, 0);

      // 描画ループ
      function render() {
        if (cancelled) return;

        renderer.render(scene, camera);
        animationFrameId = requestAnimationFrame(render);
      }

      render();

      // 終了時に片付けるための参照を保存
      mountRef.current.userData.cleanup = () => {
        cancelAnimationFrame(animationFrameId);

        wallGeometry.dispose();
        wallMaterial.dispose();

        floorGeometry.dispose();
        floorMaterial.dispose();
      };
    }

    initialize().catch((error) => {
      if (!cancelled) {
        console.error("おうちの初期化に失敗しました", error);
      }
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(animationFrameId);

      if (mountRef.current) {
        mountRef.current.userData.cleanup?.();
        delete mountRef.current.userData.cleanup;
      }

      renderer?.dispose();
      renderer?.domElement.remove();
    };
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: `${1920 * scale}px`,
        height: `${1440 * scale}px`,
        overflow: "hidden",
        background: "#ffffff",
      }}
    >
      <div
        ref={mountRef}
        style={{
          width: "100%",
          height: "100%",
        }}
      />

      <button
        type="button"
        onClick={onExit}
        style={{
          position: "absolute",
          top: 20 * scale,
          left: 20 * scale,
          zIndex: 10,
          padding: "5px 5px",
          fontSize: 30 * scale,
          cursor: "pointer",
        }}
      >
        ← マップへ戻る
      </button>
    </div>
  );
}

export default HomeMode;