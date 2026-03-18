import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const location = useLocation();

  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, [location]);

  return (
    <Routes>
      <Route
        path="/"
        element={token ? <Navigate to="/dashboard" /> : <Login />}
      />

      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route
        path="/dashboard"
        element={token ? <Dashboard /> : <Navigate to="/login" />}
      />
    </Routes>
  );
}

export default App;