# CoughDrop Mobile

This is the skeleton for the mobile app version of CoughDrop. It is dependent on compiled
code provided by the main app in order to run. Most of the code is boilerplate 
Cordova, plugins, and code brought in from the main CoughDrop app. I haven't documented
setting up a clean dev environment, so good luck :-).

This library makes it possible to create CoughDrop executables for installation on 
iOS, Android and Kindle. It would probably work for other targets as well (other than
the plugins) but I haven't tested it anywhere else.

## Technical Notes

```bash
npm install cordova
cordova prepare
cp build-extras.gradle platforms/android/build-extras.gradle
cp android-release-keys.properties.example android-release-keys.properties
cordova prepare
```

Additional notes:

- Plugins are listed in `config.xml`
- If using Acapela TTS, you'll want to check the instructions in the `extra-tts` repo
  for how to use your commercial license, otherwise you may get unexpected crashes
  when testing or installing.
- In the main app, look in `lib/tasks/extras.rake` for helpers getting compiled code into this app
- `cordova run android` to compile and run on a plugged-in android device
- `cordova prepare` to prep for loading in XCode
- `bin/build_android` to create production-ready versions for submission to app stores. You'll need
  a keys.p12 file and put your password in `android-release-keys.properties` first. Google and 
  Amazon have different requirements for minimum and
  target SDK levels, so those will need to updated
  over time in this file.
- Managing splash screen images and app icons was a     
  headache, I don't have notes on how
  to do it because it just works right now and I don't want to touch it.
- After running bin/build_android, you'll need to manually
  remove and re-add MobileFace.storyboard in the Plugins
  group, or it will error at build time.
- Until the cordova libraries are updated, you will
  need to manually set the Minimu Deployments to 
  11.0 insted of 9.0
- There are some additional notes in `www/customizations.txt`

## Testing 
Mobile apps, in theory, should run the same as the web version. It is important to test your functionality first on the web, where it is easier to iterate and re-release. If there is an issue on mobile, it's easier to isolate, as it will most likely be found in the mobile source code.

Some areas, especially on iOS, are more fragile than others. When you first build an app package from a new device or new Cordova build, you will want to test the following features to ensure they are working correctly, as misconfigured libraries are possible any time you set things up on a new computer.

- Splash screen shows correctly on initial load
- Login works correctly
- Sync works correctly
- After sync, close the app, turn off wifi and load the app, symbols should still load correctly
- In user Preferences under voice, Premium Voices should show download link
- Premium Voices should download correctly when clicked
- Premium Voices should output speech correctly when selected in Preferences
- Editing a board, taking pictures from device camera to save on a button should work correctly
- Editing a board, recording audio from the microphone to save on a button should work correctly
- A button that links to a YouTube video should correctly play the video when selected in Speak Mode
- In Speak Mode, device should not go to sleep after OS-defined timeout
- Eye Gaze/Head Tracking should correctly use the OS libraries, not the JavaScript library (the JavaScript version will auto-run a calibration that says "Initializing..." if you hit Test Tracking from the user Preferences page, the OS libraries will not)
- In-App Purchases are only configured to work on iOS, but they can be tested from the user Billing page

## License
MIT
