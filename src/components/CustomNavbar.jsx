import { useState } from "react";
import {
  Navbar,
  NavbarToggler,
  NavbarBrand,
  Nav,
  NavItem,
  NavLink,
  Container,
  Button,
  Offcanvas,
  OffcanvasHeader,
  OffcanvasBody,
} from "reactstrap";
import { Link, NavLink as RouterLink } from "react-router-dom";
import { MdLightMode, MdEventNote, MdClose } from "react-icons/md";
import { FaMoon } from "react-icons/fa";
import { useSession } from "../context/SessionContext";

const CustomNavbar = ({ theme, toggleTheme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { activeSessionId, setActiveSessionId, sessions } = useSession();

  const toggle = () => setIsOpen(!isOpen);

  const navLinks = [
    { path: "/", id: "nav-home", name: "الرئيسية" },
    { path: "/exams", id: "nav-exams", name: "التقييم الدوري" },
    { path: "/classes", id: "nav-classes", name: "الفصول" },
    { path: "/subjects", id: "nav-subjects", name: "المواد" },
    { path: "/students", id: "nav-students", name: "الطلاب" },
  ];

  return (
    <>
      <Navbar expand="lg" fixed="top" className="shadow-sm bg-navbar py-2">
        <Container fluid="lg" className="d-flex justify-content-between align-items-center">
          <NavbarBrand
            tag={Link}
            to="/"
            className="fw-bold fs-3 pe-3 me-0 text-decoration-none shadow-none d-flex align-items-center"
            style={{
              color: "var(--primary-color)",
              borderLeft: "2px solid var(--border-color)",
              marginLeft: "15px",
            }}
          >
            دار الصحابة
          </NavbarBrand>

          <Nav navbar className="d-none d-lg-flex flex-row gap-2">
            {navLinks.map((link) => (
              <NavItem key={link.path}>
                <NavLink
                  tag={RouterLink}
                  to={link.path}
                  id={link.id}
                  className="px-3 rounded-pill"
                  style={({ isActive }) => ({
                    cursor: "pointer",
                    color: isActive ? "var(--primary-color)" : "inherit",
                    fontWeight: isActive ? "bold" : "normal",
                    backgroundColor: isActive ? "rgba(var(--primary-rgb), 0.1)" : "transparent",
                  })}
                >
                  {link.name}
                </NavLink>
              </NavItem>
            ))}
          </Nav>

          <div className="d-flex align-items-center gap-2 gap-md-3">
            <div className="d-none d-md-flex align-items-center gap-2 bg-light px-3 py-1 rounded-pill border">
              <MdEventNote className="text-primary" />
              <select
                name="active-session-desktop"
                className="bg-transparent border-0 small fw-bold shadow-none cursor-pointer"
                style={{ outline: 'none' }}
                value={activeSessionId}
                onChange={(e) => setActiveSessionId(Number(e.target.value))}
              >
                <option value={0}>كشف الدرجات العام</option>
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>

            <Button
              onClick={toggleTheme}
              color="link"
              className="p-1 border-0 d-flex align-items-center text-decoration-none shadow-none hover-scale"
            >
              {theme === "light" ? (
                <MdLightMode style={{ color: "#fbc531", fontSize: "1.8rem" }} />
              ) : (
                <FaMoon
                  style={{
                    color: "#ffffff",
                    fontSize: "1.5rem",
                    transform: "rotate(-20deg)",
                  }}
                />
              )}
            </Button>

            <NavbarToggler onClick={toggle} className="border-0 shadow-none d-lg-none">
              <div className="navbar-toggler-icon"></div>
            </NavbarToggler>
          </div>
        </Container>
      </Navbar>

      <Offcanvas
        isOpen={isOpen}
        toggle={toggle}
        direction="end"
        className="bg-navbar"
        style={{ width: '280px' }}
      >
        <OffcanvasHeader className="border-bottom">
          <div className="d-flex justify-content-between align-items-center w-100">
            <span className="fw-bold fs-4 text-primary">القائمة</span>
            <Button color="link" className="p-0 text-muted" onClick={toggle}>
              <MdClose size={28} />
            </Button>
          </div>
        </OffcanvasHeader>
        <OffcanvasBody>
          <div className="d-md-none mb-4">
            <label className="small text-muted mb-2 d-block">الاختبار النشط:</label>
            <div className="d-flex align-items-center gap-2 bg-light px-3 py-2 rounded-3 border">
              <MdEventNote className="text-primary" />
              <select
                name="active-session-mobile"
                className="bg-transparent border-0 flex-grow-1 fw-bold shadow-none cursor-pointer"
                style={{ outline: 'none' }}
                value={activeSessionId}
                onChange={(e) => {
                  setActiveSessionId(Number(e.target.value));
                  toggle();
                }}
              >
                <option value={0}>كشف الدرجات العام</option>
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>
          </div>

          <Nav vertical className="gap-2">
            {navLinks.map((link) => (
              <NavItem key={link.path}>
                <NavLink
                  tag={RouterLink}
                  to={link.path}
                  onClick={toggle}
                  className="px-3 py-2 rounded-3 d-flex align-items-center gap-2"
                  style={({ isActive }) => ({
                    color: isActive ? "var(--primary-color)" : "inherit",
                    fontWeight: isActive ? "bold" : "normal",
                    backgroundColor: isActive ? "rgba(var(--primary-rgb), 0.1)" : "transparent",
                    textDecoration: 'none'
                  })}
                >
                  {link.name}
                </NavLink>
              </NavItem>
            ))}
          </Nav>
        </OffcanvasBody>
      </Offcanvas>
    </>
  );
};

export default CustomNavbar;
