import sketch from 'sketch'
const FIXED_COLOR = '#FF5544';
const DYNAMIC_COLOR = '#0AF';

export const addSpacing = (context) => {
  // check selection
  const document = sketch.fromNative(context.document)
  const page = document.selectedPage
  const selection = document.selectedLayers
  const count = selection.length
  // only run the redline when at least one selected layer
  if (count === 0) {
    sketch.UI.message('No layers selected', document)
  } else {
    const message =
      count === 1 ? '1 layer selected' : `${count} layers selected`
    sketch.UI.message(message, document)

    // start to check the layout
    new sketch.Shape({
      frame: rect,
      style: {
        fills: ['#00FFcc'],
        borders: [],
      },
    })
  }
}

function processFragments(container, fragments, action) {
  // We first move the container to the back of the document.
  container.moveToBack()
  // Then iterate through each fragment, executing the action.
  fragments.forEach((fragment, i) => action(container, fragment, i))
  // Finally, we adjust the container to enclose any new layers we've placed in it.
  container.adjustToFit()
}

// #### Adding Baselines
// Given a text layer and a list of its baselines, we want to be able to add a
// group at the same location and make new rectangles in the group to represent
// the baseline of each line of text.

function addBaselines(layer, fragments) {
  // First we make a new group to contain our baseline layers
  const container = new sketch.Group({
    parent: layer.parent,
    name: 'Baselines',
  })

  // The we process each fragment in turn
  processFragments(container, fragments, (group, fragment) => {
    // We make a rectangle that's just 0.5 pixels high, positioned to match
    // the location of the baseline
    const rect = layer.localRectToParentRect(fragment.rect)
    rect.y += rect.height - fragment.baselineOffset
    rect.height = 0.5

    // We make a new shape layer with this rectangle.
    new sketch.Shape({
      parent: group,
      frame: rect,
      style: {
        fills: ['#ff000090'],
        borders: [],
      },
    })
  })
}

// #### Adding Line Fragments
// Given a text layer and a list of its baselines, we want to be able to add a
// group at the same location and make new rectangles in the group to represent
// the lines of text.

function addLineFragments(layer, fragments) {
  // First we make a new group to contain our line fragments
  const container = new sketch.Group({
    parent: layer.parent,
    name: 'Line Fragments',
  })

  // The we process each fragment in turn
  sketch.UI.message('container: ', container)
  sketch.UI.message('fragments: ', JSON.Sfragments)
  processFragments(container, fragments, (group, fragment, index) => {
    // We alternate the color of the lines, so that we can tell them apart
    const color = index % 1 ? '#00ff00ff' : '#00ff0044'

    // We make a new shape layer with the rectangle of each line in turn
    const localRect = layer.localRectToParentRect(fragment.rect)
    new sketch.Shape({
      parent: group,
      frame: localRect,
      style: {
        fills: [color],
        borders: [],
      },
    })
  })
}

// ### Defining The Run Handlers

// In the manifest, we listed the javascript function to call for each of our five commands.
// So now we need to implement these functions.

export function onAddLineFragments(context) {
  const document = sketch.fromNative(context.document)

  // Iterate over each text layer in the selection, calling our addLineFragments function
  document.selectedLayers.forEach((layer) => {
    if (true || layer.type === String(sketch.Types.Text)) {
      addLineFragments(layer, layer.fragments)
    }
  })
}

export function onAddBaselines(context) {
  const document = sketch.fromNative(context.document)

  // Iterate over each text layer in the selection, calling our addBaselines function
  document.selectedLayers.forEach((layer) => {
    if (layer.type === String(sketch.Types.Text)) {
      addBaselines(layer, layer.fragments)
    }
  })
}

export function onAddBoth(context) {
  const document = sketch.fromNative(context.document)

  // Iterate over each text layer in the selection, calling our addBaselines and addLineFragments functions
  document.selectedLayers.forEach((layer) => {
    if (layer.type === String(sketch.Types.Text)) {
      const { fragments } = layer
      addLineFragments(layer, fragments)
      addBaselines(layer, fragments)
    }
  })
}

export function onUseLegacyBaselines(context) {
  const document = sketch.fromNative(context.document)

  // Iterate over each text layer in the selection, turning off constant baselines.
  document.selectedLayers.forEach((layer) => {
    if (layer.type === String(sketch.Types.Text)) {
      // eslint-disable-next-line no-param-reassign
      layer.lineSpacing = sketch.Text.LineSpacing.variable
    }
  })
}

export function onUseConstantBaselines(context) {
  const document = sketch.fromNative(context.document)

  // Iterate over each text layer in the selection, turning on constant baselines.
  document.selectedLayers.forEach((layer) => {
    if (layer.type === String(sketch.Types.Text)) {
      // eslint-disable-next-line no-param-reassign
      layer.lineSpacing = sketch.Text.LineSpacing.constantBaseline
    }
  })
}

// PICO_STYLE
export function onAddTextAllFixedAnnotation(context) {
  const document = sketch.fromNative(context.document)

  // Iterate over each text layer in the selection, calling our addBaselines function
  document.selectedLayers.forEach((layer) => {
    if (true || layer.type === String(sketch.Types.Text)) {
      onHandleTextAllFixedAnnotation(layer, layer.fragments)
    }
  })
}
export function onHandleTextAllFixedAnnotation(layer, fragments) {
  // First we make a new group to contain our line fragments
  const container = new sketch.Group({
    parent: layer.parent,
    name: '[Text Annotation] All Fixed Line Fragments',
  })
  // The we process each fragment in turn
  processFragments(container, fragments, (group, fragment, index) => {
    const localRect = layer.localRectToParentRect(fragment.rect)
    new sketch.Shape({
      parent: group,
      frame: localRect,
      style: {
        fills: [],
        borders: [{ color: FIXED_COLOR }],
      },
    })
  })
}

export function onAddTextAllDynamicAnnotation(context) {
  const document = sketch.fromNative(context.document)

  // Iterate over each text layer in the selection, calling our addBaselines function
  document.selectedLayers.forEach((layer) => {
    if (true || layer.type === String(sketch.Types.Text)) {
      onHandleTextAllDynamicAnnotation(layer, layer.fragments)
    }
  })
}
export function onHandleTextAllDynamicAnnotation(layer, fragments) {
  // First we make a new group to contain our line fragments
  const container = new sketch.Group({
    parent: layer.parent,
    name: '[Text Annotation] All Dynamic Line Fragments',
  })
  // The we process each fragment in turn
  processFragments(container, fragments, (group, fragment, index) => {
    // const rect = layer.localRectToParentRect(fragment.rect)
    // rect.y += rect.height - fragment.baselineOffset
    // rect.height = 0.5
    // We make a new shape layer with the rectangle of each line in turn
    const localRect = layer.localRectToParentRect(fragment.rect)
    new sketch.Shape({
      parent: group,
      frame: localRect,
      style: {
        fills: [],
        borders: [{ color: DYNAMIC_COLOR }],
      },
    })
  })
}
export function onAddTextFixedWidthAnnotation(context) {
  const document = sketch.fromNative(context.document)

  // Iterate over each text layer in the selection, calling our addBaselines function
  document.selectedLayers.forEach((layer) => {
    if (true || layer.type === String(sketch.Types.Text)) {
      onHandleTextFixedWidthAnnotation(layer, layer.fragments)
    }
  })
}
export function onHandleTextFixedWidthAnnotation(layer, fragments) {
  // First we make a new group to contain our line fragments
  const container = new sketch.Group({
    parent: layer.parent,
    name: '[Text Annotation] Fixed Width Line Fragments',
  })
  // The we process each fragment in turn
  processFragments(container, fragments, (group, fragment, index) => {
    // Fixed Width
    // TOP
    let rect = layer.localRectToParentRect(fragment.rect)
    rect.y += rect.height
    rect.height = 0
    new sketch.Shape({
      parent: group,
      frame: rect,
      style: {
        fills: [],
        borders: [{ color: FIXED_COLOR }],
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
        borders: [{ color: FIXED_COLOR }],
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
        borders: [{ color: DYNAMIC_COLOR }],
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
        borders: [{ color: DYNAMIC_COLOR }],
      },
    })
  })
}

export const onAddChildAllFixedAnnotation = () => {
  const document = sketch.fromNative(context.document)
  // Iterate over each text layer in the selection, calling our function
  document.selectedLayers.forEach((layer) => {
    if (
      layer.type === String(sketch.Types.SymbolInstance)
      || layer.type === String(sketch.Types.Group)
    ) {
      const container = new sketch.Group({
        parent: layer.parent,
        name: '[Child] All Fixed Fragments',
      })
      // 1. find the element.
      // 2. put Rect in the empty spacing.
      new sketch.Shape({
        parent: container,
        frame: new sketch.Rectangle(layer.frame.x, layer.frame.y, layer.frame.width, layer.frame.height),
        style: {
          fills: [],
          borders: [{ color: DYNAMIC_COLOR }],
        },
      })
    }
  })
}