import ARToolkitNFT from "../build/artoolkitNFT_embed_ES6_wasm.js";

self.onmessage = function (e) {
  var msg = e.data;
  switch (msg.type) {
    case "load": {
      load(msg);
      return;
    }
    case "process": {
      next = msg.imagedata;
      process();
      return;
    }
  }
};

var next = null;
var ar = null;
var markerResult = null;
var marker;

async function load(msg) {
  const arTK = await ARToolkitNFT();
  //self.addEventListener("artoolkitNFT-loaded", function () {
  console.debug("Loading marker at: ", msg.marker);
  console.log(arTK);

  var onLoad = function () {
    ar = new arTK.ARControllerNFT(msg.pw, msg.ph, param);
    console.log(ar);
    var cameraMatrix = ar.getCameraMatrix();

    ar.addEventListener("getNFTMarker", function (ev) {
      markerResult = {
        type: "found",
        matrixGL_RH: JSON.stringify(ev.data.matrixGL_RH),
      };
    });

    ar.loadNFTMarker(msg.marker, function (id) {
      ar.trackNFTMarkerId(id);
      let marker = ar.getNFTData(id, 0);
      console.log("nftMarker data: ", marker);
      postMessage({ type: "markerInfos", marker: marker });
      console.log("loadNFTMarker -> ", id);
      postMessage({ type: "endLoading", end: true }),
        function (err) {
          console.error("Error in loading marker on Worker", err);
        };
    });

    postMessage({ type: "loaded", proj: JSON.stringify(cameraMatrix) });
  };

  var onError = function (error) {
    console.error(error);
  };

  console.debug("Loading camera at:", msg.camera_para);

  // we cannot pass the entire ARControllerNFT, so we re-create one inside the Worker, starting from camera_param
  var param = new arTK.ARCameraParamNFT(msg.camera_para, onLoad, onError);
  //});//event listener
}

function process() {
  markerResult = null;

  if (ar && ar.process) {
    ar.process(next);
  }

  if (markerResult) {
    postMessage(markerResult);
  } else {
    postMessage({ type: "not found" });
  }

  next = null;
}
