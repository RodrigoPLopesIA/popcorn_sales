import { useState } from "react"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "../services/firebase"

export default function Login() {

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()

    await signInWithEmailAndPassword(auth, email, password)
  }

  return (

    <div className="flex items-center justify-center min-h-screen bg-gray-100">

      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded-lg shadow w-80"
      >

        <h2 className="text-xl font-bold mb-4">
          Login
        </h2>

        <input
          type="email"
          placeholder="Email"
          className="border p-2 w-full mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Senha"
          className="border p-2 w-full mb-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="bg-orange-500 text-white w-full p-2 rounded"
        >
          Entrar
        </button>

      </form>

    </div>

  )
}