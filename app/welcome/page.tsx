import { WelcomeSlides } from "@/components/welcome-slides";
import { NOINDEX } from "@/lib/site";

export const metadata = { ...NOINDEX, title: "Welcome to LBPay" };

export default function WelcomePage() {
  return <WelcomeSlides />;
}
