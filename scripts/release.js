import { execSync } from "node:child_process";
import { VERSION } from "../src/version.js";

console.log(`ひよこどらいぶ Ver${VERSION} をリリースします！`);

try{
    execSync("git add .",{stdio:"inherit"});

    execSync(`git commit -m "Release v${VERSION}"`,{
        stdio:"inherit",
    });
}catch{
    console.log("コミットする変更はありません。")
}

try{
    
    execSync(`git tag v${VERSION}`);

}catch{
    console.log("タグは既に存在します。");
}

execSync("git push",{stdio:"inherit"});
execSync("git push --tags",{stdio:"inherit"});

console.log("リリース完了！");