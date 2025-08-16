import { BrowserRouter, Route, Routes } from "react-router-dom";
import MainPage from "./pages/main";
import LoginPage from "./pages/login";
import { AppRoute } from "./const";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={AppRoute.Login} element={<LoginPage/>}/>
        <Route path={AppRoute.Main} element={<MainPage/>}/>
      </Routes>
    </BrowserRouter>
  )
}
