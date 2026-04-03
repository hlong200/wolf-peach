import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Container as BsContainer } from 'react-bootstrap';
import Catalog from './Catalog';
import MyGarden from './MyGarden';
import Navigator from './Navigator';
import { FavoritesProvider } from './lib/FavoritesProvider';

function App() {
    return (
        <FavoritesProvider>
            <BrowserRouter>
                <Navigator />
                <BsContainer className="px-4 px-md-5 mt-3">
                    <Routes>
                        <Route path="/wolf-peach" element={<Catalog />} />
                        <Route path="/garden" element={<MyGarden />} />
                    </Routes>
                </BsContainer>
            </BrowserRouter>
        </FavoritesProvider>
    );
};

export default App;