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
  a keys.p12 file and put your password in `android-release-keys.properties` first.
- Managing splash screen images and app icons was a headache, I don't have notes on how
  to do it because it just works right now and I don't want to touch it.
- There are some additional notes in `www/customizations.txt`

## License
MIT
