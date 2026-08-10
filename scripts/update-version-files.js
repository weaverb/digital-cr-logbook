import fs from 'fs';
import path from 'path';

const nextVersion = process.argv[2];

if (!nextVersion) {
  console.error("Error: No version provided to update-version-files.js");
  process.exit(1);
}

console.log(`Executing update-version-files.js for version v${nextVersion}...`);

// 1. Update package.json
const pkgPath = path.resolve("./package.json");
if (fs.existsSync(pkgPath)) {
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    pkg.version = nextVersion;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
    console.log(`✓ Updated ${pkgPath} version to v${nextVersion}`);
  } catch (err) {
    console.error(`Failed to update ${pkgPath}:`, err);
  }
}

// 2. Update src-tauri/tauri.conf.json
const tauriConfPath = path.resolve("./src-tauri/tauri.conf.json");
if (fs.existsSync(tauriConfPath)) {
  try {
    const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, "utf8"));
    tauriConf.version = nextVersion;
    fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + "\n");
    console.log(`✓ Updated ${tauriConfPath} version to v${nextVersion}`);
  } catch (err) {
    console.error(`Failed to update ${tauriConfPath}:`, err);
  }
}

// 3. Update docs/index.html download URLs
const docsPath = path.resolve("./docs/index.html");
if (fs.existsSync(docsPath)) {
  try {
    let docsContent = fs.readFileSync(docsPath, "utf8");
    docsContent = docsContent.replace(/Digital-CR-Logbook-v\d+\.\d+\.\d+/g, `Digital-CR-Logbook-v${nextVersion}`);
    fs.writeFileSync(docsPath, docsContent);
    console.log(`✓ Updated ${docsPath} download URLs to v${nextVersion}`);
  } catch (err) {
    console.error(`Failed to update ${docsPath}:`, err);
  }
}

console.log("Version file updates completed successfully.");
