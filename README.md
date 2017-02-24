# CoughDrop Mobile

This is the skeleton for the mobile app version of CoughDrop. It is dependent on compiled
code provided by the main app in order to run. Most of the code is boilerplate 
Cordova and code brought in from the main CoughDrop app.

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
- There may be some issues getting the `acap` (text-to-speech) dependencies configured. I
  need to update this with notes on how to do that, but it's not required for the app
  to function so you could probably remove it.
- In the main app, look in `lib/tasks/extras.rake` for helpers getting compiled code into this app
- `cordova run android` to compile and run on a plugged-in android device
- `cordova prepare` to prep for loading in XCode
- `bin/build_android` to create production-ready versions for submission to app stores. You'll need
  a keys.p12 file and put your password in `android-release-keys.properties` first.
- Managing splash screen images and app icons was a headache, I don't have notes on how
  to do it because it just works right now and I don't want to touch it.

## License

TBD, probably MIT. Message me if you need this and we can discuss.