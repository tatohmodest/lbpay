import { ComingSoon } from "@/components/coming-soon";
import { FEATURES, INTERNATIONAL_OPENS } from "@/lib/flags";
import InternationalLivePage from "./live-page";

export default function InternationalPage() {
  if (!FEATURES.international) {
    return (
      <ComingSoon
        title="Across Africa"
        copy="Send to 9 countries. Receive from anywhere in XAF. We are finishing the corridors first."
        when={`Coming ${INTERNATIONAL_OPENS}`}
        image="/illustrations/africa-corridors.webp"
        alt="LBPay corridors across Central and West Africa"
      />
    );
  }
  return <InternationalLivePage />;
}
