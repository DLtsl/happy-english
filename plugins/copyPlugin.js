import CopyPlugin from "vite-plugin-files-copy";
import fs from "fs";
import path from "path";
import fsExtra from "fs-extra";

let env = process.env.NODE_ENV;
let from = path.resolve(__dirname, "../src/cloudfunctions");
let to = path.resolve(
  __dirname,
  "../" +
    (env === "development" ? "dist/dev" : "dist/build") +
    "/mp-weixin/cloudfunctions"
);
console.log("to", to);

function copyFiles(srcDir, destDir) {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir);
  }

  const files = fs.readdirSync(srcDir);

  files.forEach((file) => {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(destDir, file);
    fsExtra.copySync(srcPath, destPath);
  });
}

function copyPlugin() {
  return {
    name: "复制云函数文件夹",
    buildEnd() {
      console.log("复制云函数文件夹", from, to);
      copyFiles(from, to);
    },
  };
}

export default copyPlugin;
