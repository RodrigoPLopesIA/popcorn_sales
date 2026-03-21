import { useEffect, useState, type JSX } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "../services/firebase"
import { Navigate } from "react-router-dom"

function ProtectedRoutes({ children }: { children: JSX.Element }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoutes