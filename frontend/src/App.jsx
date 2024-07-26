import Game from "./pages/game/Game";
import Login from "./pages/login/Login";
import Toolbar from "./components/toolbar/Toolbar";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <>
      <BrowserRouter>
        <Toolbar />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/game" element={<Game />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
