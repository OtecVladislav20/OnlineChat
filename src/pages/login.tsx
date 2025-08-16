import { useEffect } from 'react';
import { checkAuth, loginWithGoogle, logout } from '../store/actions';
import { useAppDispatch } from '../store/hooks';


export default function LoginPage() {
  const dispatch = useAppDispatch();
    
  const loginButton = async () => {
    await dispatch(loginWithGoogle());
  }

  const logoutButton = async () => {
    dispatch(logout());
  }

  useEffect((() => {
    dispatch(checkAuth());
    console.log('true')
  }), [dispatch]);

  return (
    <>
      <button onClick={loginButton}>Вход через Google</button>
      <button onClick={logoutButton}>Выход из аккаунта</button>
    </>
  );
}
