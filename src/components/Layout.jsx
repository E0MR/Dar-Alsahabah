import React from "react";
import CustomNavbar from "./CustomNavbar";

const Layout = ({ children, theme, toggleTheme }) => {
  return (
    <div className="main-wrapper">
      <CustomNavbar theme={theme} toggleTheme={toggleTheme} />
      <main className="content-area">
        {children}
      </main>
    </div>
  );
};

export default Layout;
