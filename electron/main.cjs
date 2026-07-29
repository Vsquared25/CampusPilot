const { app, BrowserWindow, dialog } = require("electron");
const { spawn } = require("node:child_process");
const { appendFileSync, existsSync, copyFileSync, mkdirSync } = require("node:fs");
const path = require("node:path");

let apiProcess;

function logDesktop(message) {
  try {
    appendFileSync(
      path.join(app.getPath("userData"), "desktop.log"),
      `[${new Date().toISOString()}] ${message}\n`,
    );
  } catch {
    // Logging should never prevent the desktop app from opening.
  }
}

function getProjectRoot() {
  return app.isPackaged ? app.getAppPath() : path.join(__dirname, "..");
}

function getServerRoot() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "server")
    : path.join(getProjectRoot(), "server");
}

function getNodeExecutable() {
  const runtimeDirectory = app.isPackaged
    ? path.join(process.resourcesPath, "node")
    : path.join(getProjectRoot(), "electron", "runtime");
  const bundledNode = path.join(runtimeDirectory, "node.exe");

  return existsSync(bundledNode) ? bundledNode : process.execPath;
}

function getDatabaseUrl(serverRoot) {
  const userDataDirectory = app.getPath("userData");
  const databasePath = path.join(userDataDirectory, "campuspilot.db");
  const bundledDatabasePath = path.join(serverRoot, "dev.db");

  mkdirSync(userDataDirectory, { recursive: true });

  if (!existsSync(databasePath) && existsSync(bundledDatabasePath)) {
    copyFileSync(bundledDatabasePath, databasePath);
  }

  return `file:${databasePath.replaceAll("\\", "/")}`;
}

async function apiIsReady() {
  try {
    const response = await fetch("http://localhost:4000/api/health");
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForApi() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (await apiIsReady()) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return false;
}

async function startApi() {
  if (await apiIsReady()) {
    return true;
  }

  const serverRoot = getServerRoot();
  const serverEntry = app.isPackaged
    ? path.join(serverRoot, "dist", "index.js")
    : path.join(serverRoot, "src", "index.ts");
  const args = app.isPackaged
    ? [serverEntry]
    : [
        path.join(serverRoot, "node_modules", "tsx", "dist", "cli.mjs"),
        serverEntry,
      ];

  apiProcess = spawn(getNodeExecutable(), args, {
    cwd: serverRoot,
    env: {
      ...process.env,
      PORT: "4000",
      DATABASE_URL: getDatabaseUrl(serverRoot),
    },
    windowsHide: true,
  });

  apiProcess.on("error", (error) => {
    console.error("CampusPilot API could not start:", error);
    logDesktop(`API spawn error: ${error.message}`);
  });

  apiProcess.stderr.on("data", (data) => {
    logDesktop(`API error: ${data.toString().trim()}`);
  });

  apiProcess.on("exit", (code) => {
    logDesktop(`API exited with code ${code}.`);
  });

  return waitForApi();
}

function createWindow() {
  const projectRoot = getProjectRoot();
  const iconPath = path.join(projectRoot, "electron", "assets", "icon.png");
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 720,
    show: false,
    backgroundColor: "#f8fafc",
    title: "CampusPilot",
    icon: iconPath,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.once("ready-to-show", () => window.show());
  window.loadFile(path.join(projectRoot, "dist", "index.html"));
}

app.whenReady().then(async () => {
  logDesktop("CampusPilot desktop app started.");
  const apiStarted = await startApi();

  if (!apiStarted) {
    logDesktop("API did not become ready within 15 seconds.");
    dialog.showErrorBox(
      "CampusPilot API unavailable",
      "CampusPilot could not start its local database service. Make sure Node.js is installed, then try again.",
    );
  }

  createWindow();
});

app.on("before-quit", () => {
  apiProcess?.kill();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
