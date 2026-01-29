import { createHashRouter } from 'react-router-dom';
import App from './App'; // The main layout component
import Home from './pages/Home';
import Category from './pages/Category';
import Teaching from './pages/Teaching';

export const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'c/:key',
        element: <Category />,
      },
      {
        path: 'teaching',
        element: <Teaching />,
      },
    ],
  },
]);
