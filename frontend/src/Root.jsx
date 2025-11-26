import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import App from "./App.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/login",
    element: <Login onLogin={() => (window.location.href = "/")} />,
  },
  {
    path: "/signup",
    element: <Signup onSignup={() => (window.location.href = "/")} />,
  },
]);

export default function Root() {
  return <RouterProvider router={router} />;
}
