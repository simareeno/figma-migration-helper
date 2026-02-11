console.clear();
figma.showUI(__html__, { width: 700, height: 700 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'importTheme') {
    console.log('result');
    figma.ui.postMessage({type: 'result', success: true, message: 'Theme imported successfully!'});
  }
};
