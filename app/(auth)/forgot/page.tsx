import { ForgotForm } from "./forgot-form";

export default async function ForgotPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;
  return <ForgotForm initialEmail={params.email || ""} />;
}
