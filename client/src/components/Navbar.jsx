import { useState, useEffect, useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Moon,
  Sun,
  Menu,
  X,
} from "lucide-react";
import { AuthContext } from "../contexts/AuthContext";

const Navbar = () => {
  const { isLoggedIn, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

  const [dark, setDark] = useState(
    localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      dark
    );

    localStorage.setItem(
      "theme",
      dark ? "dark" : "light"
    );
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
    <header
      className="
        fixed
        top-0
        left-0
        right-0
        z-50
        transition-all
        duration-500
        glass
        border-b
        border-default
      "
    >
      <div
        className="
          container-custom
          h-20
          md:h-28
          flex
          items-center
          justify-between
        "
      >
        <NavLink
          to="/"
          className="
            flex
            items-center
            gap-2
            md:gap-3
            font-bold
            text-xl
            md:text-2xl
          "
        >
          <img
            src="/icons/dataflow.png"
            className="
              w-9
              h-9
              md:w-10
              md:h-10
              rounded-xl
            "
          />

          <span className="text-gradient">
            DataFlow
          </span>
        </NavLink>

        <div className="hidden md:flex items-center gap-10">
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

        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={() => setDark(!dark)}
            className="
              h-10
              w-10
              md:h-11
              md:w-11
              rounded-full
              border
              border-default
              glass
              flex
              items-center
              justify-center
              transition-all
              duration-300
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
            className="
              hidden
              md:block
              btn
              btn-primary
            "
          >
            {isLoggedIn
              ? "Logout"
              : "Sign In"}
          </button>

          <button
            className="
              md:hidden
              h-10
              w-10
              flex
              items-center
              justify-center
            "
            onClick={() =>
              setOpen(!open)
            }
          >
            {open ? (
              <X size={24} />
            ) : (
              <Menu size={24} />
            )}
          </button>
        </div>
      </div>

      {open && (
        <div
          className="
            md:hidden
            glass
            border-t
            border-default
          "
        >
          <div
            className="
              container-custom
              py-6
              flex
              flex-col
              gap-5
            "
          >
            <NavLink
              to="/"
              className="nav-link"
              onClick={() =>
                setOpen(false)
              }
            >
              Home
            </NavLink>

            {isLoggedIn && (
              <NavLink
                to="/saved"
                className="nav-link"
                onClick={() =>
                  setOpen(false)
                }
              >
                My Data
              </NavLink>
            )}

            <button
              onClick={() => {
                handleAuth();
                setOpen(false);
              }}
              className="
                btn
                btn-primary
                w-full
              "
            >
              {isLoggedIn
                ? "Logout"
                : "Sign In"}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;