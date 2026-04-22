import { useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Container as BsContainer } from 'react-bootstrap';
import Home from './Home';
import Catalog from './Catalog';
import MyGarden from './MyGarden';
import CompanionPlanting from "./CompanionPlanting";
import Profile from './Profile';
import PlantProfile from './PlantProfile';
import PlantLogDetail from './PlantLogDetail';
import Admin from './Admin';
import AdminPlantForm from './AdminPlantForm';
import Navigator from './Navigator';
import LoginModal from './LoginModal';
import { FavoritesProvider } from './lib/FavoritesProvider';
import { AuthProvider } from './lib/AuthProvider';
import { useAuth } from './lib/AuthProvider';
import { useIsAdmin } from './lib/useIsAdmin';
import { PlantTrayProvider } from './lib/PlantTrayProvider';
import { DragStateProvider } from './lib/DragStateProvider';
import HelpButton from './HelpButton';
import PlantTray from './PlantTray';
import { FilterProvider } from "./lib/FilterProvider";

function RequireAuth({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();
    const [showLogin, setShowLogin] = useState(true);

    if (loading) return null;

    if (!user) {
        return (
            <>
                <Navigate to="/" replace state={{ from: location }} />
                <LoginModal show={showLogin} onHide={() => setShowLogin(false)} />
            </>
        );
    }

    return children;
}

function RequireAdmin({ children }) {
    const { user, loading: authLoading } = useAuth();
    const { isAdmin, loading: adminLoading } = useIsAdmin();

    if (authLoading || adminLoading) return null;
    if (!user || !isAdmin) return <Navigate to="/" replace />;

    return children;
}

function App() {
    return (
        <AuthProvider>
        <FavoritesProvider>
        <PlantTrayProvider>
        <DragStateProvider>
            <HashRouter>
                <Navigator />
                <HelpButton />
                <PlantTray />
                <BsContainer className="px-4 px-md-5 mt-3">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/catalog" element={<RequireAuth><Catalog /></RequireAuth>} />
                        <Route path="/garden"  element={<RequireAuth><MyGarden /></RequireAuth>} />
                        <Route
                            path="/companion-planting"
                            element={
                                <FilterProvider>
                                <CompanionPlanting />
                                </FilterProvider>
                            }
                            />
                        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                        <Route path="/plant/:id" element={<RequireAuth><PlantProfile /></RequireAuth>} />
                        <Route path="/log/:id" element={<PlantLogDetail />} />
                        <Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
                        <Route path="/admin/plant/:id" element={<RequireAdmin><AdminPlantForm /></RequireAdmin>} />
                        <Route path="/admin/plant/new" element={<RequireAdmin><AdminPlantForm /></RequireAdmin>} />
                    </Routes>
                </BsContainer>
            </HashRouter>
        </DragStateProvider>
        </PlantTrayProvider>
        </FavoritesProvider>
        </AuthProvider>
    );
};

export default App;