import {BrowserRouter, Routes, Route } from 'react-router-dom';
import Catalog from './Catalog';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/wolf-peach" element={<Catalog />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;