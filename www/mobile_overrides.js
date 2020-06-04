document.addEventListener('deviceready', function() {
  if (window.capabilities) {
    console.log("EYES", Object.keys(window.capabilities), window.capabilities.eye_gaze);
    jq = window.Ember && window.Ember.$;
    var div = document.createElement('div'); 
    div.id = "mobile_cursor";
    div.style.zIndex = 9999; 
    document.body.appendChild(div); 
    var center = document.createElement('div'); 
    center.id = "mobile_center_check";
    center.style.zIndex = 9999; 
    var inner = document.createElement('div');
    inner.classList.add('prompt');
    inner.innerText = "Look Here";
    center.appendChild(inner);
    document.body.appendChild(center); 
    var delivery_debounce = null;
    var dropped_heads = [];
    var dropped_eyes = [];
    var camera_locations = {};

    var mini_calibrate = function(xpx, ypx) {
      var orientation = window.capabilities.orientation();
      var now = (new Date()).getTime();
      if(camera_locations.for != orientation.layout) {
        camera_locations.for = orientation.layout;
        center.style.display = 'block';
        // Give up trying to calibrate after 30 seconds
        setTimeout(function() {
          if(camera_locations.for == orientation.layout) {
            center.style.display = 'none';
            camera_locations = {};
          }
        }, 30000);
      }
      camera_locations["tally" + orientation.layout] = camera_locations["tally" + orientation.layout] || [];
      var size = camera_locations["tally" + orientation.layout].length;
      var started = camera_locations["tally" + orientation.layout].started || 0;
      if(size > 15 && (now - started) > 2250) {
        center.setAttribute('class', 'level_3');
      } else if(size > 10 && (now - started) > 1500) {
        center.setAttribute('class', 'level_2');
      } else if(size > 5 && (now - started) > 750) {
        center.setAttribute('class', 'level_1');
      } else {
        center.setAttribute('class', '');
      }
      if(xpx == 'tilt') {
        var tally = camera_locations["tally" + orientation.layout];
        tally.started = tally.started || now;
        tally.push([now]);
        // Collect enough samples to gain confidence
        if((now - tally.started) > 3000 && tally.length > 20) {
          console.log("DONE TILT CALIBRATION");
          camera_locations[orientation.layout] = {
            x: 0,
            y: 0
          };
          camera_locations["tally" + orientation.layout] = [];
          camera_locations.for = null;
          window.locs = camera_locations;
          cordova.exec(function(res) { }, function(err) { 
          }, 'CoughDropFace', 'set_face', []);
        }
      } if(xpx && ypx) {
        var tally = camera_locations["tally" + orientation.layout];
        tally.started = tally.started || now;
        tally.push([xpx, ypx]);
        // Collect enough samples to gain confidence
        if((now - tally.started) > 3000 && tally.length > 20) {
          var avg_x = 0, avg_y = 0, count_x = 0, count_y = 0;
          // TODO: prune the tally and try again if we're not converging
          for(var idx = 0; idx < tally.length; idx++) {
            var power = idx + 1;
            if(idx < (tally.length * 3)) { power = power / 3; }
            if(idx > (tally.length * 2 / 3)) { power = power * 5; }
            avg_x = avg_x + (tally[idx][0] * power);
            count_x = count_x + power;
            avg_y = avg_y + (tally[idx][1] * power);
            count_y = count_y + power;
          }
          avg_x = avg_x / count_x;
          avg_y = avg_y / count_y;
          camera_locations[orientation.layout] = {
            x: avg_x - (window.innerWidth / 2),
            y: avg_y - (window.innerHeight / 2)
          };
          camera_locations["tally" + orientation.layout] = [];
          camera_locations.for = null;
          window.locs = camera_locations;
        }
      }
    };

    var gaze_history = [];
    var gaze_threshold = 15;
    window.gaze_history = gaze_history;
    var handle_event = function(res) {
      jq = jq || window.Ember && window.Ember.$;
      camera_locations = camera_locations || {};
      var elem = document.getElementById('linger');
      var orientation = window.capabilities.orientation();
      if(res.action == 'gaze' || res.action == 'head_point') {
        var xpx = res.gaze_x*(window.ppix || 96) / window.devicePixelRatio;
        var ypx = res.gaze_y*(window.ppiy || 96) / window.devicePixelRatio;
        if(capabilities.system == 'Android' && res.action == 'head_point') {
          if(!camera_locations[orientation.layout]) {
            mini_calibrate(xpx, ypx);
            return;
          } else {
            center.style.display = 'none';
            xpx = xpx - camera_locations[orientation.layout].x;
            ypx = ypx - camera_locations[orientation.layout].y;
            // calibrate it to the center
          }
        }
        // Origin (x=0, y=0 should be the currrent location of the camera)
        // For x: looking left of the camera = negative, looking right = positive
        // For y: looking above the camera = positive, looking down = negative
        if(!camera_locations[orientation.layout]) {
          var screen_width = screen.width;
          var screen_height = screen.height;
          if(capabilities.system == 'iOS' && orientation.layout.match(/landscape/)) {
            screen_width = screen.height;
            screen_height = screen.width;
          }
          if(orientation.layout == 'landscape-primary') {
            xpx = xpx;
            ypx = (screen_height / 2) - ypx;  
          } else if(orientation.layout == 'landscape-secondary') {
            xpx = (screen_width) + (xpx);
            ypx = (screen_height / 2) - ypx;
          } else if(orientation.layout == 'portrait-primary') {
            xpx = xpx + (screen_width / 2);
            ypx = ypx;
          } else if(orientation.layout == 'portrait-secondary') {
            xpx = (screen_width / 2) + (xpx);
            ypx = (screen_height) - (ypx);
          }
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
        gaze_history.push({x: xpx, y: ypx});
        if(gaze_history.length > 2) {
          // Keep a short history of events to smooth motion
          // TODO: - If you can trace a line w/ minimal jitter, try to keep on that line
          var avg_x = 0;
          var avg_y = 0;
          var new_history = [];
          gaze_history.forEach(function(coord, idx) {
            if(coord.used || idx > gaze_history.length - 3) {
              new_history.push(coord);
              avg_x = avg_x + coord.x;
              avg_y = avg_y + coord.y;
            }
          });
          avg_x = avg_x / gaze_history.length;
          avg_y = avg_y / gaze_history.length;
          var diff_x = Math.abs(gaze_history.x - avg_x);
          var diff_y = Math.abs(gaze_history.y - avg_y);
          // - If very little movement, use the oldest in history
          if(diff_x < gaze_threshold || diff_y < gaze_threshold) {
            if(diff_x < gaze_threshold) {
              xpx = new_history[0].x + (Math.random() - 0.5);
            }
            if(diff_y < gaze_threshold) {
              ypx = new_history[0].y + (Math.random() - 0.5);
            }
            new_history[0].used = true;
            gaze_history = new_history;
          } else {
            gaze_history = new_history.filter(function(c) { return !c.used; });
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
            if(orientation.layout.match(/landscape/) && capabilities.system == 'iOS') {
              xpx = Math.min(Math.max(xpx, 0), screen.height);
              ypx = Math.min(Math.max(ypx, 0), screen.width);
            } else {
              xpx = Math.min(Math.max(xpx, 0), screen.width);
              ypx = Math.min(Math.max(ypx, 0), screen.height);
            }
          }
          // div.style.left = (xpx - 5) + "px";
          // div.style.top = (ypx - 5) + "px";
          var e = jq.Event('gazelinger');
          e.clientX = xpx;
          e.clientY = ypx;
          e.eyegaze_hardware = 'system';
          e.pointer = !res.eyes;

          var elem_left = elem && elem.style && elem.style.left;
          if (elem) { elem.style.left = '-1000px'; }
          if(isFinite(xpx) && isFinite(ypx)) {
            e.target = document.elementFromPoint(xpx, ypx);
            if(res.action == 'head_point') {
              e.target = e.target || document.body;
            }
            if (elem) { elem.style.left = elem_left; }
            e.duration = duration;
            e.ts = (new Date()).getTime();
            jq(e.target).trigger(e);
          }
        }
      } else if(res.action == 'head') {
        if(delivery_debounce) {
          dropped_heads.push(res);
        } else {
          delivery_debounce = setTimeout(function() {
            delivery_debounce = null;
          }, 50);
          var e = jq.Event('headtilt');
          if(capabilities.system == 'Android') {
            if(!camera_locations[orientation.layout]) {
              mini_calibrate('tilt');
              return;
            } else {
              center.style.display = 'none';
            }
          }
  
          console.log("HEADTILT", res);
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
    window.capabilities.eye_gaze = window.capabilities.eye_gaze || {};
    window.capabilities.eye_gaze.listen = function() {
      camera_locations = {};
      if(!gaze.listening) {
        var layout = (capabilities.orientation() || {}).layout || "none";
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

    window.capabilities.head_tracking = window.capabilities.head_tracking || {};
    // listen should be idempotent
    window.capabilities.head_tracking.listen = function(options) {
      camera_locations = {};
      options = options || {};
      if(!gaze.listening) {
        var layout = (capabilities.orientation() || {}).layout || "none";
        gaze.listening = true;
        var head_pointing = !!options.head_pointing;
        if(capabilities.system == 'Android' && options.head_pointing) {
          mini_calibrate();
        }
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
        if(res.eyes !== false) {
          window.capabilities.eye_gaze.available = true;
        }
        if(res.ppi) {
          window.ppix = res.ppi;
          window.ppiy = res.ppi;
        }
        if(res.default_orientation && res.default_orientation != "unknown") {
          capabilities.default_orientation = res.default_orientation;
        }
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
// Calibrate - distance from 5 (top) to 4, nose height
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