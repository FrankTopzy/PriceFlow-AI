import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
// We will create these pages next
import Dashboard from './pages/Dashboard';
import Products from './pages/Products.tsx';
import Simulation from './pages/Simulation.tsx';
import Safety from './pages/Safety.tsx';
import Predict from './pages/Predict.tsx';
import SalesPredict from './pages/SalesPredict.tsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="simulation" element={<Simulation />} />
        <Route path="predict" element={<Predict />} />
        <Route path="sales" element={<SalesPredict />} />
        <Route path="safety" element={<Safety />} />
      </Route>
    </Routes>
  );
}

export default App;
