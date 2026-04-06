import AuthGate from "./components/AuthGate";
import { LanguageProvider } from "./contexts/LanguageContext";

export default function App() {
  return (
    <LanguageProvider>
      <AuthGate />
    </LanguageProvider>
  );
}
