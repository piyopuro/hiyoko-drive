//最小値以上、最大値以下のランダムな数を作る係
export function getRandomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

//ここからここまで
export function clamp(value, min, max) {
  return Math.max(
    min,
    Math.min(value, max)
  );
}
