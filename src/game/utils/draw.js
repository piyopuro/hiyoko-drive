//影つけ係
export function drawShadow(ctx, x, y, width, height) {
  ctx.beginPath();

  ctx.ellipse(
    x,
    y,
    width,
    height,
    0,
    0,
    Math.PI * 2
  );

  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fill();
}

//影（かどまる四角）つけ係
export function drawRectShadow(ctx, x, y, width, height, radius = 8) {
  ctx.beginPath();

  ctx.roundRect(
    x - width / 2,
    y - height / 2,
    width,
    height,
    radius
  );

  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fill();
}
