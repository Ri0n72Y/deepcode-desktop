import "./App.css";
import "./timeline-overrides.css";
import { RuntimeProvider } from "./app/providers";
import AppShell from "./components/layout/AppShell";

export default function App() {
  return (
    <RuntimeProvider>
      <AppShell />
    </RuntimeProvider>
  );
}
