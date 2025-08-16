import { BrowserRouter, Route, Routes } from "react-router-dom";
import MainPage from "./pages/main";
import LoginPage from "./pages/login";
import { AppRoute } from "./const";
import { useAppDispatch } from "./store/hooks";
import { useEffect } from "react";
import { checkAuth } from "./store/actions";


export default function App() {
  const dispatch = useAppDispatch();
  useEffect((() => {
    dispatch(checkAuth());
  }), [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path={AppRoute.Login} element={<LoginPage/>}/>
        <Route path={AppRoute.Main} element={<MainPage/>}/>
      </Routes>
    </BrowserRouter>
  )
}
