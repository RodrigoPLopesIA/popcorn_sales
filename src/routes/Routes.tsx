import { BrowserRouter, Route, Routes } from "react-router-dom"
import Dashboard from "../pages/Dashboard"
import Sales from "../pages/SalesPage"
import Login from "../pages/Login"
import Header from "../components/Header"
import ProtectedRoutes from "./ProtectedRoutes"

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoutes>
              <>
                <Header />
                <Sales />
              </>
            </ProtectedRoutes>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoutes>
              <>
                <Header />
                <Dashboard />
              </>
            </ProtectedRoutes>
          }
        />

      </Routes>
    </BrowserRouter>
  )
}