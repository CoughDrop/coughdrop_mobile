# CoughDrop Mobile

This is the skeleton for the mobile app version of CoughDrop. It is dependent on compiled
code provided by the main app in order to run. Most of the code is boilerplate 
Cordova and code brought in from the main CoughDrop app.

## Technical Notes

```bash
npm install cordova
cordova prepare
```

Additional notes:

- Plugins are listed in `config.xml`
- In the main app, look in `lib/tasks/extras.rake` for helpers getting compiled code into this app
- `cordova run android` to compile and run on a plugged-in android device
- `cordova prepare` to prep for loading in XCode
- `bin/build_android` to create production-ready versions for submission to app stores

## License

TBD, probably MIT. Message me if you need this and we can discuss.