# LBPay Android (Capacitor)

Package: `com.loopingbinary.lbpay`  
Firebase Android app id: `1:1005766549175:android:a8788725b5871add9a7732`

## Debug APK

```bash
npx cap sync android
cd android && ./gradlew assembleDebug
```

APK: `android/app/build/outputs/apk/debug/app-debug.apk`

## Firebase

`android/app/google-services.json` is the Firebase Android config for `com.loopingbinary.lbpay` (project `lbpay-89179`).

Server-side FCM send (optional): set `FIREBASE_FCM_SERVER_KEY` in the web app environment.

The money-alert channel uses `res/raw/lbpay_alert.wav`.
