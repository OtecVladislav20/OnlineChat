import { loginWithGoogle, logout } from '../store/actions';
import { useAppDispatch } from '../store/hooks';


export default function LoginPage() {
  const dispatch = useAppDispatch();
    
  const loginButton = async () => {
    await dispatch(loginWithGoogle());
  }

  const logoutButton = async () => {
    dispatch(logout());
  }

  return (
    <>
      <button onClick={loginButton}>Вход через Google</button>
      <button onClick={logoutButton}>Выход из аккаунта</button>
    </>
  );
}
