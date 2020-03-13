document.addEventListener('deviceready', function() {
  if (window.capabilities) {
    jq = window.Ember && window.Ember.$;
    var div = document.createElement('div'); 
    div.id = "mobile_cursor";
    div.style.zIndex = 9999; 
    document.body.appendChild(div); 
    var delivery_debounce = null;
    var dropped_heads = [];
    var dropped_eyes = [];

    var handle_event = function(res) {
      var elem = document.getElementById('linger');
      // TODO: collect multiple events and average them
      // for smoothing
      if(res.action == 'gaze' || res.action == 'head_point') {
        var orientation = window.capabilities.orientation();
        var xpx = res.gaze_x*(window.ppix || 96) / window.devicePixelRatio;
        var ypx = res.gaze_y*(window.ppiy || 96) / window.devicePixelRatio;
        // Origin (x=0, y=0 should be the currrent location of the camera)
        // For x: looking left of the camera = negative, looking right = positive
        // For y: looking above the camera = positive, looking down = negative
        if(orientation.layout == 'landscape-primary') {
          xpx = xpx;
          ypx = (screen.width / 2) - ypx;
        } else if(orientation.layout == 'landscape-secondary') {
          xpx = (screen.height) + (xpx);
          ypx = (screen.width / 2) - ypx;
        } else if(orientation.layout == 'portrait-primary') {
          xpx = xpx + (screen.width / 2);
          ypx = ypx;
        } else if(orientation.layout == 'portrait-secondary') {
          xpx = (screen.width / 2) + (xpx);
          ypx = (screen.height) - (ypx);
        }
        if(res.action == 'gaze') {
          var x_max = window.innerWidth;
          var y_max = window.innerHeight;
          var fudge = 300;
          if(xpx < 10 && xpx >= (0 - fudge)) {
            xpx = 10;
          } else if(xpx > (x_max - 10) && xpx <= (x_max + fudge)) {
            xpx = x_max - 10;
          }
          if(ypx < 10 && ypx >= (0 - fudge)) {
            ypx = 10;
          } else if(ypx > (x_max - 10) && ypx <= (y_max + fudge)) {
            ypx = y_max - 10;
          }
        }
        res.xpx = xpx;
        res.ypx = ypx;
        if(delivery_debounce) {
          dropped_eyes.push(res);
        } else {
          delivery_debounce = setTimeout(function() {
            delivery_debounce = null;
          }, 50);
          console.log("x" + res.gaze_x + "  y" + res.gaze_y); 

          var duration = 10;
          if(dropped_eyes.length > 0) {
            for(var idx = 0; idx < dropped_eyes.length; idx++) {
              xpx = xpx + dropped_eyes[idx].xpx;
              ypx = ypx + dropped_eyes[idx].ypx;
            }
            xpx = xpx / (dropped_eyes.length + 1);
            ypx = ypx / (dropped_eyes.length + 1);
            duration = (new Date()).getTime() - dropped_eyes[0].ts;
            dropped_eyes = [];
          }
          if(res.action == 'head_point') {
            // Head pointing should still trigger when off-screen
            if(orientation.layout.match(/landscape/)) {
              xpx = Math.min(Math.max(xpx, 0), screen.height);
              ypx = Math.min(Math.max(ypx, 0), screen.width);
            } else {
              xpx = Math.min(Math.max(xpx, 0), screen.width);
              ypx = Math.min(Math.max(ypx, 0), screen.height);
            }
          }
          div.style.left = (xpx - 5) + "px";
          div.style.top = (ypx - 5) + "px";
          var e = jq.Event('gazelinger');
          e.clientX = xpx;
          e.clientY = ypx;
          e.eyegaze_hardware = 'system';
          e.pointer = !res.eyes;

          var elem_left = elem && elem.style && elem.style.left;
          if (elem) { elem.style.left = '-1000px'; }
          e.target = document.elementFromPoint(xpx, ypx);
          if(res.action == 'head_point') {
            e.target = e.target || document.body;
          }
          if (elem) { elem.style.left = elem_left; }
          e.duration = duration;
          e.ts = (new Date()).getTime();
          jq(e.target).trigger(e);
        }
      } else if(res.action == 'head') {
        if(delivery_debounce) {
          dropped_heads.push(res);
        } else {
          delivery_debounce = setTimeout(function() {
            delivery_debounce = null;
          }, 50);
          var e = jq.Event('headtilt');
          e.vertical = res.head_tilt_y;
          e.horizontal = res.head_tilt_x;
          if(dropped_heads.length > 0) {
            for(var idx = 0; idx < dropped_heads.length; idx++) {
              e.vertical = e.vertical + dropped_heads[idx].vertical;
              e.horizontal = e.horizontal + dropped_heads[idx].horizontal;
            }
            e.vertical = e.vertical / (dropped_heads.length + 1);
            e.horizontal = e.horizontal / (dropped_heads.length + 1);
            dropped_heads = [];
          }
          e.clientX = 0;
          e.clientY = 0;
          e.ts = (new Date()).getTime();
          e.target = document.body;
          jq(e.target).trigger(e);
        }
      } else if(res.action == 'ready') {
        // good to go!
      } else if(res.action == 'end') {
        // TODO: clean up?
      } else if(res.action) {
        console.log("SELECTION", res.action);
        var e = jq.Event('facechange');
        e.clientX = 0; // TODO: just use last target of other types?
        e.clientY = 0;
        e.expression = res.action;
        e.ts = (new Date()).getTime();
        e.target = document.body;
        jq(e.target).trigger(e);
      }
    }
    var gaze = {};
    // listen should be idempotent
    window.capabilities.eye_gaze.listen = function() {
      if(!gaze.listening) {
        var layout = capabilities.orientation().layout || "none";
        gaze.listening = true;
        cordova.exec(function(res) { 
          handle_event(res);
        }, function(err) { 
          console.error('gaze_error', err); 
        }, 'CoughDropFace', 'listen', [{bacon: "asdf", gaze: true, eyes: true, head: false, layout: layout}]);
      } else { return true; }
    };
    window.capabilities.eye_gaze.stop_listening = function() {
      if(gaze.listening) {
        div.style.left = "-1000px";
        gaze.listening = false;
        cordova.exec(function(res) { 
          console.log("stop res", res);
        }, function(err) { 
          console.error('b', err); 
        }, 'CoughDropFace', 'stop_listening', []);
      }
    };
    window.capabilities.eye_gaze.calibrate = function() {
      // TODO: we can run a js-based calibration tool if we like
      // trigger calibration
    };
    window.capabilities.eye_gaze.calibratable = function(cb) {
      cb(false);
    }
    window.capabilities.eye_gaze.available = false;

    // listen should be idempotent
    window.capabilities.head_tracking.listen = function(options) {
      options = options || {};
      if(!gaze.listening) {
        var layout = capabilities.orientation().layout || "none";
        gaze.listening = true;
        var head_pointing = !!options.head_pointing;
        cordova.exec(function(res) { 
          handle_event(res);
        }, function(err) { 
          console.error('b', err); 
        }, 'CoughDropFace', 'listen', [head_pointing ? {gaze: true, eyes: false, head: false, layout: layout} : {gaze: false, eyes: false, head: true, layout: layout}]);
      } else { return true; }
    };
    window.capabilities.head_tracking.stop_listening = function() {
      if(gaze.listening) {
        div.style.left = "-1000px";
        gaze.listening = false;
        cordova.exec(function(res) { 
          console.log("stop res", res);
        }, function(err) { 
          console.error('b', err); 
        }, 'CoughDropFace', 'stop_listening', []);
      }
    };
    window.capabilities.head_tracking.calibrate = function() {
      // TODO: we can run a js-based calibration tool if we like
      // trigger calibration
    };
    window.capabilities.head_tracking.calibratable = function(cb) {
      cb(false);
    }
    window.capabilities.head_tracking.available = false;

    cordova.exec(function(res) { 
      if(res && res.supported) {
        console.log("Face Tracking/TrueDepth is supported!");
        window.capabilities.eye_gaze.available = true;
        window.capabilities.head_tracking.available = true;
      }
    }, function(err) { 
      console.error('b', err); 
    }, 'CoughDropFace', 'status', []);

  }
  if(window.navigator.splashscreen) {
    window.navigator.splashscreen.show();
  }
});

// ANDROID face mesh tracking
// https://github.com/ManuelTS/augmentedFaceMeshIndices
// Left wink - distance from 159 (top) to 145 should approach 0
// Right wink - distance from 386 (top) to 374 should approach 0
// Left eyebrow - distance from 223 (top) to 159 should increase
// Right eyebrow - distance from 443 (top) to 386 should increase
// Open mouth - distance from 11 (top) to 16 should increase
// Left smirk - distance from 206 (top) to 57 should decrease
// Right smirk - distance from 426 (top) to 287 should decrease

// window.capabilities.eye_gaze.listen = function() {
//             if(!window.capabilities.eye_gaze.listening) {
//                 window.capabilities.eye_gaze.listening = true;
//                 return eye_gaze.listen();
//             } else { return true; }
//         };
//         window.capabilities.eye_gaze.stop_listening = function() {
//             window.capabilities.eye_gaze.listening = false;
//             return eye_gaze.stop_listening();
//         };
//         window.capabilities.eye_gaze.calibrate = eye_gaze.calibrate;
//         window.capabilities.eye_gaze.calibratable = eye_gaze.calibratable;
//         window.capabilities.eye_gaze.available = true;