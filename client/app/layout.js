import "./globals.css";
import Providers from "../components/Providers.js";

export const metadata = {
  title: "AgentHire",
  description: "Spec-driven multi-agent recruitment platform"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning><Providers>{children}</Providers></body>
    </html>
  );
}
