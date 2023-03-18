import { apiProcessorGen3 } from "./apiProcessorGen3";
import { join } from "path";
import * as fs from "fs";
import vscode, { Uri } from "vscode";

import { WebSocket } from "ws";
import { checkPackageJson } from "./getProjectInfo";
import { exec, execSync } from "child_process";

var defaultPort = 1111;

var isFocused = true;
var windowID: string | undefined;

vscode.window.onDidChangeWindowState((winState) => {
  console.log(winState);
  isFocused = winState.focused;
  if (isFocused) {
    windowID = `${execSync(`xdotool getactivewindow`)}`;
    // console.log(windowID)
  }
});

function init(
  context: vscode.ExtensionContext,
  connection: WebSocket | import("ws")
) {
  const projectDir = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

  if (!projectDir) {
    vscode.window.showErrorMessage("No workspace opened.");
    return;
  }
  const relativePattern = new vscode.RelativePattern(projectDir, "**/*");
  const watcher = vscode.workspace.createFileSystemWatcher(
    relativePattern,
    false,
    false,
    false
  );
  watcher.onDidChange((uri) => {
    console.log(`File ${uri.fsPath} changed`);
  });
  watcher.onDidCreate((uri) => {
    console.log(`File ${uri.fsPath} created`);
  });
  watcher.onDidDelete((uri) => {
    console.log(`File ${uri.fsPath} deleted`);
  });
  checkPackageJson(projectDir, connection);

  context.subscriptions.push(watcher);
}

export function connectToWebSocketServer(context: vscode.ExtensionContext) {
  const connection = new WebSocket(
    `ws://localhost:${defaultPort}`
  ) as WebSocket;

  connection.on("error", function error(err) {
    console.log("connection error", err);
    setTimeout(() => {
      connectToWebSocketServer(context);
    }, 1000);
  });

  connection.on("close", function message(data) {
    console.log("connection close");
    setTimeout(() => {
      connectToWebSocketServer(context);
    }, 1000);
  });

  connection.on("open", function open() {
    console.log("connection open");
    connection?.send(JSON.stringify({ id: `code.Code` }));

    vscode.window.showInformationMessage(`Able : At your service Boss!`);

    init(context, connection);
  });

  connection.on("message", function message(data) {
    console.log("received: %s", data, isFocused);

    // apiProcessorGen2(data, isFocused);
    apiProcessorGen3(data, isFocused, windowID);
  });
}