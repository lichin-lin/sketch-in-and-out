// disable the context menu (eg. the right click menu) to have a more native feel
document.addEventListener('contextmenu', (e) => {
  e.preventDefault()
})

// CONTAINER
document.getElementById('button').addEventListener('click', () => {
  window.postMessage('nativeLog', 'Called from the webview')
})

// CHILDREN

// call the wevbiew from the plugin
window.setRandomNumber = (randomNumber) => {
  document.getElementById('answer').innerHTML = 'Random number from the plugin: ' + randomNumber
}
