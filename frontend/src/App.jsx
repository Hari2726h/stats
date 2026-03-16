import { Navigate, Route, Routes } from "react-router-dom";
import EmbedConfigurePage from "./pages/EmbedConfigure/EmbedConfigurePage";

function App() {
  return (
    <Routes>
      <Route path="/embed/configure" element={<EmbedConfigurePage />} />
      <Route path="*" element={<Navigate to="/embed/configure" replace />} />
    </Routes>
  );
}

export default App;
