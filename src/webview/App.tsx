import * as React from 'react';

// 声明vscode API类型
declare global {
  interface Window {
    acquireVsCodeApi: () => {
      postMessage: (message: any) => void;
      getState: () => any;
      setState: (state: any) => void;
    };
  }
}

// 获取vscode API - 使用try-catch处理可能的错误
const vscode = (function() {
  try {
    return window.acquireVsCodeApi();
  } catch (error) {
    console.error('Failed to acquire VS Code API', error);
    // 提供一个模拟实现用于开发环境
    return {
      postMessage: (message: any) => console.log('postMessage', message),
      getState: () => ({}),
      setState: (state: any) => console.log('setState', state)
    };
  }
})();

export const App: React.FC = () => {
  return (
    <div className="app">
      <h2>Tree Trace</h2>
      <div className="card">
        <p>这是使用React编写的侧边栏视图</p>
      </div>
    </div>
  );
}; 