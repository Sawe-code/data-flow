import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Saved from './pages/Saved.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import Footer from './components/Footer.jsx'

import Navbar from './components/Navbar.jsx'

const App = () => {
  return (
    <main>
      <Navbar />
      <Routes>


        <Route path="/" element={<Home />} />


        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />


        <Route
          path="/saved"
          element={
            <ProtectedRoute>
              <Saved />
            </ProtectedRoute>
          }
        />

      </Routes>
      <Footer />
    </main>
  )
}

export default App