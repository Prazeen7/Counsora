import { Routes, Route } from "react-router-dom";
import './App.css'
// Pages
import SignUp from "./pages/SignUp"
import Login from "./pages/Login"
import Dashboard from "./pages/counselor/institutionList"

function App() {


  return (
    <>
      <Routes>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </>
  )
}

export default App
