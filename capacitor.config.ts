import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl = (process.env.CAPACITOR_SERVER_URL || "https://lbpay.loopingbinary.com").replace(/\/$/, "");

const config: CapacitorConfig = {
  appId: "com.loopingbinary.lbpay",
  appName: "LBPay",
  webDir: "www",
  backgroundColor: "#f3f7f4",
  android: {
    allowMixedContent: true,
    backgroundColor: "#f3f7f4",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#06261c",
      showSpinner: false,
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#f3f7f4",
    },
    Keyboard: {
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ["sound", "alert", "badge"],
    },
    LocalNotifications: {
      sound: "lbpay_alert",
    },
  },
  server: {
    url: serverUrl,
    androidScheme: "https",
    allowNavigation: [
      "lbpay.loopingbinary.com",
      "*.loopingbinary.com",
      "lbpay.cm",
      "*.lbpay.cm",
      "*.vercel.app",
      "*.workers.dev",
      "localhost",
      "10.0.2.2",
    ],
  },
};

export default config;
