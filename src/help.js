import sketch from 'sketch'
// documentation: https://developer.sketchapp.com/reference/api/

// Initialise
export const initPlugin = (context) => {
  globalContext = context;
  doc = globalContext.document;
  sketch.UI.message('!?')
  page = doc.currentPage();
  artboard = page.currentArtboard();
  plugin = globalContext.plugin;
  selection = globalContext.selection;
  pluginRoot = globalContext.scriptPath.stringByDeletingLastPathComponent().stringByDeletingLastPathComponent().stringByDeletingLastPathComponent();
  localDataPath = pluginRoot + "/Contents/Resources/user.config";
  var currentVersion = globalContext.plugin.version() + "";
  remoteManifestUrl = "https://raw.githubusercontent.com/sketch-hq/SketchAPI/develop/docs/sketch-plugin-manifest-schema.json";
  configData = readData();
  sketch.UI.message(JSON.stringify(configData) + " | typeof: " + typeof (configData))
}

export const readData = () => {
  if (NSFileManager.defaultManager().fileExistsAtPath(localDataPath)) {
    var string = NSString.stringWithContentsOfFile_encoding_error(localDataPath, 4, nil);
    string = string.replace(/(\r\n|\n|\r)/gm, "");
    var data = JSON.parse(string);
    return data;
  }
}

export const isSelectionAllowed = (selectionType) => {
  var allowedTypes = ["MSShapeGroup", "MSRectangleShape", "MSOvalShape", "MSTriangleShape", "MSShapePathLayer", "MSStarShape", "MSPolygonShape", "MSHotspotLayer", "MSTextLayer", "MSLayerGroup", "MSArtboardGroup", "MSSymbolMaster", "MSBitmapLayer", "MSSliceLayer", "MSSymbolInstance"];

  for (var j=0; j<allowedTypes.length; j++) {
        if (allowedTypes[j].match(selectionType)) return j;
    }
  return -1
}

export const isSelectionValid = (selectedLayers) => {
  var selectedCount = selectedLayers.count();
  var msg = "";
  sketch.UI.message(selectedCount)
  if (selectedCount <= 0) {
    msg = "🔥 Please select at least one element.";
    sketch.UI.message("msg")
    return false;
  }

  var layer = selectedLayers.firstObject();
  var layerType = layer.className();
  var hasArtboard = hasParentArtboard(layer);

  if (hasArtboard < 0) {
    msg = "Soemthing is wrong";
    sketch.UI.message("msg")
    return false;
  } else if (hasArtboard == 2) {
    msg = "Please select an element inside an Artboard.";
    sketch.UI.message("msg")
    return false;
  } else if (isSelectionAllowed(layerType) < 0) {
    msg = "Currently " + layerType + " selection is not allowed.";
    sketch.UI.message("msg")
    return false;
  } else if (selectedCount > 1) {
    msg = "Please select single layer";
    sketch.UI.message("msg")
  } else {
    return true;
  }
}
