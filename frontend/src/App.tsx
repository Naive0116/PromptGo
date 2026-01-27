import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SplitView } from './pages/SplitView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SplitView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
