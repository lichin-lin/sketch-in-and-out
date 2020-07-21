import BrowserWindow from 'sketch-module-web-view'
import { getWebview } from 'sketch-module-web-view/remote'
import UI from 'sketch/ui'
import sketch from 'sketch'
const FIXED_COLOR = '#FF5544';
const DYNAMIC_COLOR = '#0AF';
const webviewIdentifier = 'my-plugin.webview'

export default function (context) {
  const options = {
    identifier: webviewIdentifier,
    width: 512,
    height: 240,
    show: false,
    alwaysOnTop: true,
  }
  
  const browserWindow = new BrowserWindow(options)
  
  // only show the window when the page has loaded to avoid a white flash
  browserWindow.once('ready-to-show', () => {
    browserWindow.show()
  })
  
  const webContents = browserWindow.webContents
  
  // print a message when the page loads
  webContents.on('did-finish-load', () => {
    UI.message('UI loaded!')
  })

  // CONTAINER
  webContents.on('[Container] All Fixed', s => {
    onAddTextAnnotation(context, 'All Fixed')
  })
  webContents.on('[Container] All Dynamic', s => {
    onAddTextAnnotation(context, 'All Dynamic')
  })
  webContents.on('[Container] Width Fixed', s => {
    onAddTextAnnotation(context, 'Width Fixed')
  })
  webContents.on('[Container] Height Fixed', s => {
    onAddTextAnnotation(context, 'Height Fixed')
  })
  // CHILDREN
  webContents.on('[Children] Horizontal Fixed', s => {
    onAddChildrenAnnotation(context, 'Horizontal Fixed')
  })
  webContents.on('[Children] Horizontal Dynamic', s => {
    onAddChildrenAnnotation(context, 'Horizontal Dynamic')
  })
  webContents.on('[Children] Vertical Fixed', s => {
    onAddChildrenAnnotation(context, 'Vertical Fixed')
  })
  webContents.on('[Children] Vertical Dynamic', s => {
    onAddChildrenAnnotation(context, 'Vertical Dynamic')
  })
  browserWindow.loadURL(require('../resources/webview.html'))
}

// When the plugin is shutdown by Sketch (for example when the user disable the plugin)
// we need to close the webview if it's open
export function onShutdown() {
  const existingWebview = getWebview(webviewIdentifier)
  if (existingWebview) {
    existingWebview.close()
  }
}

const processFragments = (container, fragments, action) => {
  // We first move the container to the back of the document.
  container.moveToBack()
  // Then iterate through each fragment, executing the action.
  fragments.forEach((fragment, i) => action(container, fragment, i))
  // Finally, we adjust the container to enclose any new layers we've placed in it.
  container.adjustToFit()
}

const mappingTextAnnotationStyle = (annotationType, layer, group, fragment) => {
  switch (annotationType) {
    case 'All Fixed':
      return (() => {
        const localRect = layer.localRectToParentRect(fragment.rect)
        new sketch.Shape({
          parent: group,
          frame: localRect,
          style: {
            fills: [],
            borders: [{ color: FIXED_COLOR }],
          },
        })
      })()
    case 'All Dynamic':
      return (() => {
        const localRect = layer.localRectToParentRect(fragment.rect)
        new sketch.Shape({
          parent: group,
          frame: localRect,
          style: {
            fills: [],
            borders: [{ color: DYNAMIC_COLOR }],
          },
        })
      })()
    case 'Width Fixed':
    case 'Height Fixed':
      return (() => {
        console.log('!!!!!!');
        // TOP
        let rect = layer.localRectToParentRect(fragment.rect)
        rect.y += rect.height
        rect.height = 0
        new sketch.Shape({
          parent: group,
          frame: rect,
          style: {
            fills: [],
            borders: [{ color: annotationType === 'Height Fixed' ? DYNAMIC_COLOR : FIXED_COLOR }],
          },
        })
        // BOTTOM
        rect = layer.localRectToParentRect(fragment.rect)
        rect.height = 0
        new sketch.Shape({
          parent: group,
          frame: rect,
          style: {
            fills: [],
            borders: [{ color: annotationType === 'Height Fixed' ? DYNAMIC_COLOR : FIXED_COLOR }],
          },
        })
        // LEFT
        rect = layer.localRectToParentRect(fragment.rect)
        rect.x += rect.width
        rect.y += -0.5
        rect.height = rect.height + 1
        rect.width = 0
        new sketch.Shape({
          parent: group,
          frame: rect,
          style: {
            fills: [],
            borders: [{ color: annotationType === 'Height Fixed' ? FIXED_COLOR : DYNAMIC_COLOR }],
          },
        })
        // RIGHT
        rect = layer.localRectToParentRect(fragment.rect)
        rect.height = rect.height
        rect.y += -0.5
        rect.height = rect.height + 1
        rect.width = 0
        new sketch.Shape({
          parent: group,
          frame: rect,
          style: {
            fills: [],
            borders: [{ color: annotationType === 'Height Fixed' ? FIXED_COLOR : DYNAMIC_COLOR }],
          },
        })
      })()
    default:
      return (() => {})()
  }
}
export const onAddTextAnnotation = (context, annotationType) => {
  const document = sketch.fromNative(context.document)
  // Iterate over each text layer in the selection, calling our addBaselines function
  document.selectedLayers.forEach((layer) => {
    if (true || layer.type === String(sketch.Types.Text)) {
      onHandleTextsAnnotation(layer, layer.fragments, annotationType)
    }
  })
}

export const onHandleTextsAnnotation = (layer, fragments, annotationType) => {
  // First we make a new group to contain our line fragments
  const container = new sketch.Group({
    parent: layer.parent,
    name: `[Pico Annotation] ${annotationType} Line Fragments`,
  })
  // process each fragment in turn
  processFragments(container, fragments, (group, fragment, index) => {
    mappingTextAnnotationStyle(annotationType, layer, group, fragment)
  })
}

export  const onAddChildrenAnnotation = (context, annotationType) => {
  const document = sketch.fromNative(context.document)
  // Iterate over each text layer in the selection, calling our function
  document.selectedLayers.forEach((layer) => {
    if (
      layer.type === String(sketch.Types.SymbolInstance)
      || layer.type === String(sketch.Types.Group)
    ) {
      const container = new sketch.Group({
        parent: layer.parent,
        frame: new sketch.Rectangle(layer.frame.x, layer.frame.y, layer.frame.width, layer.frame.height),
        name: '[Child] All Fixed Fragments',
      })

      // 1. find the element. (only one layer deep)
      if (layer.type === String(sketch.Types.Group)
       || layer.type === String(sketch.Types.SymbolInstance)
      ) {
        const children = layer.sketchObject.children()
        let arr = []
        children.forEach(nativelayer => {
          const wrappedLayer = sketch.fromNative(nativelayer);
          console.log(
            wrappedLayer.parent.id,
            layer.id,
          );
          // Since the selected element will include EVERY sub-layer children,
          // put a checker here to filter out too-deep children
          if (wrappedLayer.parent.id === layer.id) {
            arr.push([wrappedLayer.frame.x, wrappedLayer.frame.x + wrappedLayer.frame.width])
          }
        });
        console.log(
          arr.sort((a, b) => a[0] - b[0]),
          layer.frame.width
        );

        // 2. put Rect in the empty spacing.
        const yOffset = (layer.frame.height / 2) - (24 / 2);
        [...new Array(arr.length + 1)].forEach((element, id) => {
          if (id === 0) {
            // console.log('first');
            // console.log(0, arr[id][0]);
            if (arr[id][0] !== 0) {
              new sketch.Shape({
                parent: container,
                frame: new sketch.Rectangle(0, yOffset, arr[id][0], 24),
                style: {
                  fills: [{ color: annotationType.includes('Fixed') ? FIXED_COLOR : DYNAMIC_COLOR }],
                  borders: [
                    {
                      enabled: false
                    }
                  ]
                },
              })  
            }
          } else if (id === arr.length) {
            // console.log('last');
            // console.log(arr[id - 1][1], layer.frame.width);
            if (arr[id - 1][1] !== layer.frame.width) {
              const dist = layer.frame.width - arr[id - 1][1]
              new sketch.Shape({
                parent: container,
                frame: new sketch.Rectangle(arr[id - 1][1], yOffset, dist, 24),
                style: {
                  fills: [{ color: annotationType.includes('Fixed') ? FIXED_COLOR : DYNAMIC_COLOR }],
                  borders: [
                    {
                      enabled: false
                    }
                  ]
                },
              })  
            }
          } else {
            // console.log(arr[id - 1][1], arr[id][0]);
            const dist = arr[id][0] - arr[id - 1][1]
            new sketch.Shape({
              parent: container,
              frame: new sketch.Rectangle(arr[id - 1][1], yOffset, dist, 24),
              style: {
                fills: [{ color: annotationType.includes('Fixed') ? FIXED_COLOR : DYNAMIC_COLOR }],
                borders: [
                  {
                    enabled: false
                  }
                ]
              },
            })
          }
        })
      }
    }
  })
}
