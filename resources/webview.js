// disable the context menu (eg. the right click menu) to have a more native feel
// document.addEventListener('contextmenu', (e) => {
//   e.preventDefault()
// })

// CONTAINER
document.getElementById('All Fixed').addEventListener('click', () => {
  window.postMessage('[Container] All Fixed', 'Called from the webview')
})
document.getElementById('All Dynamic').addEventListener('click', () => {
  window.postMessage('[Container] All Dynamic', 'Called from the webview')
})
document.getElementById('Width Fixed').addEventListener('click', () => {
  window.postMessage('[Container] Width Fixed', 'Called from the webview')
})
document.getElementById('Height Fixed').addEventListener('click', () => {
  window.postMessage('[Container] Height Fixed', 'Called from the webview')
})
// CHILDREN
document.getElementById('Horizontal Fixed').addEventListener('click', () => {
  window.postMessage('[Children] Horizontal Fixed', 'Called from the webview')
})
document.getElementById('Horizontal Dynamic').addEventListener('click', () => {
  window.postMessage('[Children] Horizontal Dynamic', 'Called from the webview')
})
document.getElementById('Vertical Fixed').addEventListener('click', () => {
  window.postMessage('[Children] Vertical Fixed', 'Called from the webview')
})
document.getElementById('Vertical Dynamic').addEventListener('click', () => {
  window.postMessage('[Children] Vertical Dynamic', 'Called from the webview')
})
