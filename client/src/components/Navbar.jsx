import { useState, useEffect, useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { AuthContext } from "../contexts/AuthContext";

const Navbar = () => {
  const { isLoggedIn, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [dark, setDark] = useState(
    localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const handleAuth = () => {
    if (isLoggedIn) {
      logout();
      navigate("/");
      return;
    }

    navigate("/login");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transtion-all duration-500">
      <div className="container-custom h-28 flex items-center justify-between">
        <NavLink
          to="/"
          className="flex items-center gap-3 font-bold text-2xl"
        >
          <img
            src="/icons/dataflow.png"
            className="w-10 h-10 rounded-xl"
          />

          <span className="text-gradient">
            DataFlow
          </span>
        </NavLink>

        <div className="flex items-center gap-10">
          <NavLink
            to="/"
            className="nav-link"
          >
            Home
          </NavLink>

          {isLoggedIn && (
            <NavLink
              to="/saved"
              className="nav-link"
            >
              My Data
            </NavLink>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setDark(!dark)}
            className="
              h-11
              w-11
              rounded-full
              border
              border-default
              glass
              flex
              items-center
              justify-center
            "
          >
            {dark ? (
              <Sun size={18} />
            ) : (
              <Moon size={18} />
            )}
          </button>

          <button
            onClick={handleAuth}
            className="btn btn-primary"
          >
            {isLoggedIn ? "Logout" : "Sign In"}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;