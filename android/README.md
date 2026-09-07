# LBPay Android (Capacitor)

Package: `com.loopingbinary.lbpay`  
Firebase Android app id: `1:1005766549175:android:a8788725b5871add9a7732`  
Live URL: `https://lbpay.loopingbinary.com`

## Debug APK

```bash
npx cap sync android
npm run android:debug
```

Build output: `android/app/build/outputs/apk/debug/app-debug.apk`  
Website download: `public/apps/lbpay.apk` (served at `/apps/lbpay.apk`)

Android browsers on the site see a download bar for that APK.

## Firebase

`android/app/google-services.json` is the Firebase Android config for `com.loopingbinary.lbpay` (project `lbpay-89179`).

Server-side FCM send: set `FIREBASE_SERVICE_ACCOUNT_JSON` in the web app environment to the Firebase Admin SDK service account JSON (one line). Do not commit the private key.

The money-alert channel uses `res/raw/lbpay_alert.wav`.
