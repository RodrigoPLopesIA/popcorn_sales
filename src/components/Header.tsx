import { signOut } from "firebase/auth"
import { auth } from "../services/firebase"
import { useNavigate, useLocation } from "react-router-dom"
import { useEffect, useState } from "react"
import type { User } from "firebase/auth"

function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState<User | null>(null)

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
      ? "text-blue-600 border-b-2 border-blue-600"
      : "text-gray-600 hover:text-blue-500"

  return (
    <div className="bg-white shadow mb-6">
      <div className="max-w-6xl mx-auto p-4 flex justify-between items-center">

        {/* Logo */}
        <h1
          onClick={() => navigate("/")}
          className="text-xl font-bold cursor-pointer"
        >
          🍿  Controle de Pipoca
        </h1>

        {/* Navegação estilo link */}
        <div className="flex items-center gap-6">

          <span
            onClick={() => navigate("/")}
            className={`cursor-pointer ${isActive("/")}`}
          >
            Vendas
          </span>

          <span
            onClick={() => navigate("/dashboard")}
            className={`cursor-pointer ${isActive("/dashboard")}`}
          >
            Dashboard
          </span>

        </div>

        {/* Usuário + logout */}
        <div className="flex items-center gap-4">

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
      </div>
    </div>
  )
}

export default Header