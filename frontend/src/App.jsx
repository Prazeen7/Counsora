import { Routes, Route } from "react-router-dom";
import SignUp from "./pages/SignUp"
import './App.css'

function App() {


  return (
    <>
      <Routes>
        <Route path="/signup" element={<SignUp />} />
      </Routes>
    </>
  )
}

export default App
