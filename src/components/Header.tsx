import { signOut } from "firebase/auth"
import { auth } from "../services/firebase"
import { useNavigate, useLocation } from "react-router-dom"
import { useEffect, useState } from "react"
import type { User } from "firebase/auth"

function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u)
    })
    return () => unsubscribe()
  }, [])

  function handleLogout() {
    signOut(auth)
  }

  function getUsername(email?: string | null) {
    if (!email) return ""
    return email.split("@")[0]
  }

  const isActive = (path: string) =>
    location.pathname === path
      ? "text-blue-600 font-semibold"
      : "text-gray-600 hover:text-blue-500"

  return (
    <div className="bg-white shadow mb-4">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* LOGO */}
        <h1
          onClick={() => navigate("/")}
          className="text-lg sm:text-xl font-bold cursor-pointer"
        >
          🍿 Pipoca
        </h1>

        {/* MENU DESKTOP */}
        <div className="hidden md:flex items-center gap-6">
          <span
            onClick={() => navigate("/")}
            className={`cursor-pointer ${isActive("/")}`}
          >
            Vendas
          </span>
          <span
            onClick={() => navigate("/products")}
            className={`cursor-pointer ${isActive("/products")}`}
          >
            Pipocas
          </span>

          <span
            onClick={() => navigate("/dashboard")}
            className={`cursor-pointer ${isActive("/dashboard")}`}
          >
            Dashboard
          </span>
        </div>

        {/* USER + LOGOUT (DESKTOP) */}
        <div className="hidden md:flex items-center gap-4">
          {user && (
            <span className="text-sm text-gray-600">
              👤 {getUsername(user.email)}
            </span>
          )}

          <span
            onClick={handleLogout}
            className="cursor-pointer text-red-500 hover:text-red-600 text-sm"
          >
            Sair
          </span>
        </div>

        {/* BOTÃO MOBILE */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-2xl"
        >
          ☰
        </button>
      </div>

      {/* MENU MOBILE */}
      {menuOpen && (
        <div className="md:hidden px-4 pb-4 flex flex-col gap-3 border-t">

          <span
            onClick={() => {
              navigate("/")
              setMenuOpen(false)
            }}
            className={`cursor-pointer ${isActive("/")}`}
          >
            Vendas
          </span>
          <span
            onClick={() => navigate("/products")}
            className={`cursor-pointer ${isActive("/products")}`}
          >
            Pipocas
          </span>

          <span
            onClick={() => {
              navigate("/dashboard")
              setMenuOpen(false)
            }}
            className={`cursor-pointer ${isActive("/dashboard")}`}
          >
            Dashboard
          </span>

          {user && (
            <span className="text-sm text-gray-600 mt-2">
              👤 {getUsername(user.email)}
            </span>
          )}

          <span
            onClick={handleLogout}
            className="cursor-pointer text-red-500 text-sm"
          >
            Sair
          </span>
        </div>
      )}
    </div>
  )
}

export default Header