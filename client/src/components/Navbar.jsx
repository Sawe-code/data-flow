import { useState, useEffect, useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Menu, X, Sun, Moon } from "lucide-react";
import { AuthContext } from "../contexts/AuthContext";

const Navbar = () => {
  const { isLoggedIn, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const [dark, setDark] = useState(
    localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const links = isLoggedIn
    ? [
        { name: "Home", path: "/" },
        { name: "My Data", path: "/saved" },
      ]
    : [
        { name: "Home", path: "/" },
        { name: "Login", path: "/login" },
      ];

  return (
    <header>
      <div className="container-custom flex items-center justify-between h-16">

        {/* LOGO */}
        <NavLink to="/" className="flex items-center gap-2">
          <img src="/icons/dataflow.png" className="h-8 w-8 rounded-md" />
          <span className="font-bold text-lg text-gradient">DataFlow</span>
        </NavLink>

        {/* DESKTOP */}
        <nav className="hidden md:flex gap-8">
          {links.map((l) => (
            <NavLink key={l.name} to={l.path} className="nav-link">
              {l.name}
            </NavLink>
          ))}
        </nav>

        {/* RIGHT */}
        <div className="flex items-center gap-3">

          <button onClick={() => setDark(!dark)}>
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            onClick={() => {
              if (isLoggedIn) {
                logout();
                navigate("/");
                return;
              }

              navigate("/signup");
            }}
            className="hidden md:block btn btn-primary"
          >
            {isLoggedIn ? "Logout" : "Get Started"}
          </button>

          <button className="md:hidden" onClick={() => setOpen(!open)}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* MOBILE */}
      {open && (
        <div className="md:hidden px-6 pb-6 flex flex-col gap-4">
          {links.map((l) => (
            <NavLink key={l.name} to={l.path} onClick={() => setOpen(false)}>
              {l.name}
            </NavLink>
          ))}

          <button
            onClick={() => {
              if (isLoggedIn) {
                logout();
                navigate("/");
                setOpen(false);
                return;
              }

              navigate("/signup");
            }}
            className="btn btn-primary"
          >
            {isLoggedIn ? "Logout" : "Get Started"}
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
