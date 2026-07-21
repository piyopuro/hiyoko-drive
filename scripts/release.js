import { execSync } from "node:child_process";
import readline from "node:readline";
import { VERSION } from "../src/version.js";

console.log(`ひよこどらいぶ Ver${VERSION} をリリースします！`);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

try {
  execSync(`git rev-parse v${VERSION}`, {
      stdio: "ignore",
  });

  console.log(`v${VERSION} は既にリリースされています！`);
  process.exit(1);

} catch {

  rl.question(
    `コミットメッセージを入力してください\n（空欄なら "Release v${VERSION}"）\n> `,
    (answer) => {

    const message =
      answer.trim() === ""
        ? `Release v${VERSION}`
        : answer;
  
    execSync("git add .", { stdio: "inherit" });
    execSync(`git commit -m "v${VERSION} ${message}"`, {
      stdio: "inherit",
    });
    execSync(`git tag v${VERSION}`);
    execSync("git push", { stdio: "inherit" });
    execSync("git push --tags", { stdio: "inherit" });

    console.log("リリース完了！");
    
    rl.close();
  });

}