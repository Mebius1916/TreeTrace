import * as vscode from 'vscode';
import * as path from 'path';

// 追踪当前的WebView面板
let currentPanel: vscode.WebviewPanel | undefined = undefined;

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "tree-trace" is now active!');

  // 注册旧的Hello World命令（可以保留作为备用）
  let disposable = vscode.commands.registerCommand('tree-trace.helloWorld', () => {
    vscode.window.showInformationMessage('Hello World from tree-trace!');
    createWebviewPanel(context);
  });

  // 注册侧边栏视图
  const provider = new TreeTraceViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('treeTraceView', provider)
  );

  context.subscriptions.push(disposable);
}

export function deactivate() { }

/**
 * 创建Webview面板
 */
function createWebviewPanel(context: vscode.ExtensionContext) {
  // 如果面板已经存在，显示它
  if (currentPanel) {
    currentPanel.reveal(vscode.ViewColumn.One);
    return;
  }

  // 否则，创建新面板
  currentPanel = vscode.window.createWebviewPanel(
    'treeTrace',
    'Tree Trace',
    vscode.ViewColumn.One,
    {
      retainContextWhenHidden: true, // 保证 Webview 所在页面进入后台时不被释放
      enableScripts: true, // 运行 JS 执行
      localResourceRoots: [
        vscode.Uri.file(path.join(context.extensionPath, 'dist')),
        vscode.Uri.file(path.join(context.extensionPath, 'media'))
      ]
    }
  );
  
  currentPanel.webview.html = getWebviewContent(currentPanel.webview, context.extensionUri);

  // 当面板被关闭时重置引用
  currentPanel.onDidDispose(
    () => {
      currentPanel = undefined;
    },
    null,
    context.subscriptions
  );
}

/**
 * 侧边栏视图提供器
 */
class TreeTraceViewProvider implements vscode.WebviewViewProvider {
  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    console.log('TreeTraceViewProvider.resolveWebviewView 被调用');
    // 允许脚本执行
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.file(path.join(this._extensionUri.fsPath, 'dist')),
        vscode.Uri.file(path.join(this._extensionUri.fsPath, 'media'))
      ]
    };

    // 设置WebView内容
    webviewView.webview.html = getWebviewContent(webviewView.webview, this._extensionUri);
    console.log('已设置webview HTML内容');

    // 处理WebView发送的消息
    webviewView.webview.onDidReceiveMessage(message => {
      console.log('收到webview消息:', message);
      switch (message.command) {
        case 'alert':
          vscode.window.showInformationMessage(message.text);
          return;
      }
    });
  }
}

function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  // 获取webview.js文件的Uri
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'dist', 'webview.js')
  );
  
  console.log('Webview脚本URI:', scriptUri.toString());

  return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-inline' 'unsafe-eval';">
        <title>Tree Trace</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: var(--vscode-foreground);
            background-color: var(--vscode-sideBar-background);
          }
          .app {
            max-width: 100%;
            margin: 0 auto;
            padding: 10px;
            background-color: var(--vscode-sideBar-background);
          }
          .card {
            padding: 20px;
            border-radius: 8px;
            background-color: var(--vscode-sideBar-background);
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
            border: 1px solid var(--vscode-panel-border);
            border-left: 1px solid var(--vscode-panel-border);
          }
          button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
          }
          button:hover {
            background-color: var(--vscode-button-hoverBackground);
          }
          button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          #root {
            background-color: var(--vscode-sideBar-background);
          }
        </style>
      </head>
      <body>
        <div id="root">
          <h2>加载中...</h2>
        </div>
        <script>
          console.log("Webview加载中...");
          window.onerror = function(message, source, lineno, colno, error) {
            console.error("捕获到错误:", message, "在", source, "行:", lineno, "列:", colno);
            document.body.innerHTML += '<div style="color:red;padding:10px;">出错了: ' + message + '</div>';
            return true;
          };
        </script>
        <script src="${scriptUri}"></script>
      </body>
    </html>`;
}
