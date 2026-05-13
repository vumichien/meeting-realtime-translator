const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const source = path.join(root, "src", "onboarding");
const target = path.join(root, "out", "onboarding");

copyStatic(source, target);
fs.copyFileSync(path.join(root, "src", "preload.cjs"), path.join(root, "out", "preload.cjs"));

function copyStatic(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyStatic(src, dest);
    } else if (/\.(html|css|png|jpg|gif)$/.test(entry.name)) {
      fs.copyFileSync(src, dest);
    }
  }
}
