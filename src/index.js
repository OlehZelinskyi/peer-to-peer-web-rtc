import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import Lobby from "./Lobby";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Lobby />} />
      <Route path="/room" element={<App />} />
    </Routes>
  </BrowserRouter>
);
