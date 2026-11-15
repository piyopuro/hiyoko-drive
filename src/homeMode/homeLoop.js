//===========================================
// おうちモードのゲームループ
//===========================================

export function createHomeLoop({ update, draw, }) {
  let animationFrameId = null;
  let previousTime = 0;



  //===========================================
  // 毎フレーム実行する処理
  //===========================================

  function loop(now) {
    const deltaTime =
      previousTime === 0
        ? 0
        : Math.min((now - previousTime) / 1000, 0.05);

    previousTime = now;

    update(now, deltaTime);
    draw();

    animationFrameId = requestAnimationFrame(loop);
  }


  //===========================================
  // ループ開始
  //===========================================

  function start() {

    // すでに動いていたら開始しない
    if (animationFrameId !== null) return;

    previousTime = 0;
    animationFrameId = requestAnimationFrame(loop);
  }


  //===========================================
  // ループ停止
  //===========================================

  function stop() {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    previousTime = 0;
  }

  return { start, stop };
}