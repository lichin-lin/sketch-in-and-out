import BrowserWindow from 'sketch-module-web-view'
import { getWebview } from 'sketch-module-web-view/remote'
import UI from 'sketch/ui'
import sketch from 'sketch'
const FIXED_COLOR = '#FF5544';
const DYNAMIC_COLOR = '#0AF';
const webviewIdentifier = 'spacing-annotation.webview'

export default function (context) {
  const options = {
    identifier: webviewIdentifier,
    width: 540,
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
const parentOffsetInArtboard = (layer) => {
  let offset = { x: 0, y: 0 };
  let parent = layer.parent;
  while (parent.name && parent.type !== 'Artboard') {
    offset.x += parent.frame.x;
    offset.y += parent.frame.y;
    parent = parent.parent;
  }
  return offset;
}

const processFragments = (container, fragments, action) => {
  // We first move the container to the back of the document.
  // container.moveToBack()
  // Then iterate through each fragment, executing the action.
  fragments.forEach((fragment, i) => action(container, fragment, i))
  // Finally, we adjust the container to enclose any new layers we've placed in it.
  container.adjustToFit()
}

const isContainByOther = (current, list) => {
  let result = false
  list.forEach((element, index) => {
    if ((current[0] > element[0]) && (current[1] < element[1])) {
      result = true
    }
  })
  return result;
}

const removeSmallFrameContainByOther = (list) => {
  return list.reduce((acc, currentValue, index, array) => {
    if (isContainByOther(currentValue, array)) {
      return [...acc]
    } else {
      return [...acc, currentValue]
    }
  }, [])
}
const getLocalRect = (layer, fragment) => {
  return (layer.type === String(sketch.Types.Text)) ? layer.localRectToParentRect(fragment.rect) : layer.frame
}

const moveFrameToNearestArtboard = (container, layer) => {
  // find layer's parent that is artboard
  setTimeout(() => {
    let parentOffset = parentOffsetInArtboard(container);
    let currentArtboard = layer;
    while (currentArtboard && currentArtboard?.type !== sketch?.Types?.Artboard) {
      currentArtboard = currentArtboard.parent
    }
    // https://sketchplugins.com/d/670-set-layers-x-coordinate-relative-to-artboard/3
    container.parent = currentArtboard
    container.frame.x = container.frame.x + parentOffset.x
    container.frame.y = container.frame.y + parentOffset.y
  }, 1)
}
const mappingTextAnnotationStyle = (annotationType, layer, group, fragment = null) => {
  let localRect = getLocalRect(layer, fragment)
  let _localRect = null
  switch (annotationType) {
    case 'All Fixed':
      return (() => {
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
        // TOP
        _localRect = {
          x: localRect.x,
          y: localRect.y + localRect.height,
          width: localRect.width,
          height: 0,
        }
        new sketch.Shape({
          parent: group,
          frame: _localRect,
          style: {
            fills: [],
            borders: [{ color: annotationType === 'Height Fixed' ? DYNAMIC_COLOR : FIXED_COLOR }],
          },
        })
        // BOTTOM
        _localRect = {
          x: localRect.x,
          y: localRect.y,
          width: localRect.width,
          height: 0,
        }
        new sketch.Shape({
          parent: group,
          frame: _localRect,
          style: {
            fills: [],
            borders: [{ color: annotationType === 'Height Fixed' ? DYNAMIC_COLOR : FIXED_COLOR }],
          },
        })
        // LEFT
        _localRect = {
          x: localRect.x + localRect.width,
          y: localRect.y - 0.5,
          width: 0,
          height: localRect.height + 1,
        }
        new sketch.Shape({
          parent: group,
          frame: _localRect,
          style: {
            fills: [],
            borders: [{ color: annotationType === 'Height Fixed' ? FIXED_COLOR : DYNAMIC_COLOR }],
          },
        })
        // RIGHT
        _localRect = {
          x: localRect.x,
          y: localRect.y - 0.5,
          width: 0,
          height: localRect.height + 1,
        }
        new sketch.Shape({
          parent: group,
          frame: _localRect,
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
      onHandleTextsAnnotation(context, layer, layer.fragments, annotationType)
    }
  })
}

export const onHandleTextsAnnotation = (context, layer, fragments, annotationType) => {
  const container = new sketch.Group({
    parent: layer.parent,
    name: `[Pico Annotation] ${annotationType} Line Fragments`,
  })
  // process each fragment in turn
  if ((layer.type === String(sketch.Types.Text))) {
    processFragments(container, fragments, (group, fragment, index) => {
      mappingTextAnnotationStyle(annotationType, layer, group, fragment)
    })
    // [TODO] merge it back to same function
  } else {
    // let localRect = layer.frame
    console.log(
      layer
    );
    console.log(
      container
    );
    mappingTextAnnotationStyle(annotationType, layer, container, null)
    // switch (annotationType) {
    //   case 'All Fixed':
    //     new sketch.Shape({
    //       parent: container,
    //       frame: localRect,
    //       style: {
    //         fills: [],
    //         borders: [{ color: FIXED_COLOR }],
    //       },
    //     })
    //     break;
    //   case 'All Dynamic':
    //     new sketch.Shape({
    //       parent: container,
    //       frame: localRect,
    //       style: {
    //         fills: [],
    //         borders: [{ color: DYNAMIC_COLOR }],
    //       },
    //     })
    //     break;
    //   case 'Width Fixed':
    //   case 'Height Fixed':
    //       // TOP
    //       localRect = {
    //         x: layer.frame.x,
    //         y: layer.frame.y + layer.frame.height,
    //         width: layer.frame.width,
    //         height: 0,
    //       }
    //       new sketch.Shape({
    //         parent: container,
    //         frame: localRect,
    //         style: {
    //           fills: [],
    //           borders: [{ color: annotationType === 'Height Fixed' ? DYNAMIC_COLOR : FIXED_COLOR }],
    //         },
    //       })
    //       // BOTTOM
    //       localRect = {
    //         x: layer.frame.x,
    //         y: layer.frame.y,
    //         width: layer.frame.width,
    //         height: 0,
    //       }
    //       new sketch.Shape({
    //         parent: container,
    //         frame: localRect,
    //         style: {
    //           fills: [],
    //           borders: [{ color: annotationType === 'Height Fixed' ? DYNAMIC_COLOR : FIXED_COLOR }],
    //         },
    //       })
    //       // LEFT
    //       localRect = {
    //         x: layer.frame.x + layer.frame.width,
    //         y: layer.frame.y - 0.5,
    //         width: 0,
    //         height: layer.frame.height + 1,
    //       }
    //       new sketch.Shape({
    //         parent: container,
    //         frame: localRect,
    //         style: {
    //           fills: [],
    //           borders: [{ color: annotationType === 'Height Fixed' ? FIXED_COLOR : DYNAMIC_COLOR }],
    //         },
    //       })
    //       // RIGHT
    //       localRect = {
    //         x: layer.frame.x,
    //         y: layer.frame.y - 0.5,
    //         width: 0,
    //         height: layer.frame.height + 1,
    //       }
    //       new sketch.Shape({
    //         parent: container,
    //         frame: localRect,
    //         style: {
    //           fills: [],
    //           borders: [{ color: annotationType === 'Height Fixed' ? FIXED_COLOR : DYNAMIC_COLOR }],
    //         },
    //       })
    //       break;
    //   default:
    //       break;
    // }
  }
  moveFrameToNearestArtboard(container,layer)
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
        name: `[Child] ${annotationType} Fragments`,
      })

      // 1. find the element. (only one layer deep)
      if (layer.type === String(sketch.Types.Group)
       || layer.type === String(sketch.Types.SymbolInstance)
      ) {
        const children = layer.sketchObject.children()
        let arr = []
        children.forEach(nativelayer => {
          const wrappedLayer = sketch.fromNative(nativelayer);
          // Since the selected element will include EVERY sub-layer children,
          // put a checker here to filter out too-deep children
          if (
            wrappedLayer.parent.id === layer.id
            && wrappedLayer.name !== 'pico_bg'
          ) {
            arr.push(annotationType.includes('Horizontal')
              ? [wrappedLayer.frame.x, wrappedLayer.frame.x + wrappedLayer.frame.width]
              : [wrappedLayer.frame.y, wrappedLayer.frame.y + wrappedLayer.frame.height])
          }
        });
        arr.sort((a, b) => a[0] - b[0])
        // remove some small shape that's contain by other
        arr = removeSmallFrameContainByOther(arr);
        if (annotationType.includes('Horizontal')) {
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
        } else {
          // 2. put Rect in the empty spacing.
          const xOffset = (layer.frame.width / 2) - (24 / 2);
          console.log(arr);
          [...new Array(arr.length + 1)].forEach((element, id) => {
            if (id === 0) {
              // console.log('first');
              // console.log(0, arr[id][0]);
              if (arr[id][0] !== 0) {
                new sketch.Shape({
                  parent: container,
                  frame: new sketch.Rectangle(xOffset, 0, 24, arr[id][0]),
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
              if (arr[id - 1][1] !== layer.frame.height) {
                const dist = layer.frame.height - arr[id - 1][1]
                new sketch.Shape({
                  parent: container,
                  frame: new sketch.Rectangle(xOffset, arr[id - 1][1], 24, dist),
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
                frame: new sketch.Rectangle(xOffset, arr[id - 1][1], 24, dist),
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

        moveFrameToNearestArtboard(container,layer.parent)
      }
    }
  })
}
