import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.rtl.min.css";
import { Routes, Route } from "react-router-dom";
import "./index.css";
import Layout from "./components/Layout";
// import CustomNavbar from "./components/CustomNavbar"; // Removed direct usage
import Subjects from "./pages/Subjects";
import PeriodicExams from "./pages/PeriodicExams";
import Dashboard from "./pages/Dashboard"; // سننشئ هذا المكون الآن
import Classes from "./pages/Classes";
import ClassDetails from "./pages/ClassDetails";
import Students from "./pages/Students";
import { SessionProvider } from "./context/SessionContext";

function App() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  // تحديث الثيم
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // دالة تبديل الثيم تمرر إلى الـ Layout
  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <SessionProvider>
      <Layout theme={theme} toggleTheme={toggleTheme}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/exams" element={<PeriodicExams />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/classes/:classId" element={<ClassDetails />} />
          <Route path="/students" element={<Students />} />
        </Routes>
      </Layout>
    </SessionProvider>
  );
}

export default App;
