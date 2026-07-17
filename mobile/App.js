import './global.css';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider, useDispatch } from 'react-redux';
import { store } from './src/store/store';
import { bootstrap, verifySession } from './src/store/auth-slice';
import RootNavigator from './src/navigation/RootNavigator';

function Bootstrapper() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(bootstrap()).then((action) => {
      if (action.payload?.token) {
        dispatch(verifySession());
      }
    });
  }, [dispatch]);

  return null;
}

export default function App() {
  return (
    <Provider store={store}>
      <Bootstrapper />
      <RootNavigator />
      <StatusBar style="light" />
    </Provider>
  );
}
