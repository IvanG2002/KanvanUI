import './App.css'
import { Routes, BrowserRouter, Route } from 'react-router-dom';
import { CustomKanban } from "./components/CustomKanban"
import { Login } from './pages/Login'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index path='/' element={<Login></Login>}></Route>
        <Route index path='login' element={<Login></Login>}></Route>
        <Route path='home' element={<CustomKanban></CustomKanban>}></Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
