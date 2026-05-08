import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
// We will create these pages next
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Simulation from './pages/Simulation';
import Safety from './pages/Safety';
import Predict from './pages/Predict.tsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="simulation" element={<Simulation />} />
        <Route path="predict" element={<Predict />} />
        <Route path="safety" element={<Safety />} />
      </Route>
    </Routes>
  );
}

export default App;
