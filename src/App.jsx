import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Container as BsContainer } from 'react-bootstrap';
import Home from './Home';
import Catalog from './Catalog';
import MyGarden from './MyGarden';
import CompanionPlanting from "./CompanionPlanting";
import Profile from './Profile';
import PlantProfile from './PlantProfile';
import PlantLogDetail from './PlantLogDetail';
import Navigator from './Navigator';
import LoginModal from './LoginModal';
import ResetPasswordModal from './ResetPasswordModal';
import { FavoritesProvider } from './lib/FavoritesProvider';
import { AuthProvider } from './lib/AuthProvider';
import { useAuth } from './lib/AuthProvider';
import { useIsAdmin } from './lib/useIsAdmin';
import { PlantTrayProvider } from './lib/PlantTrayProvider';
import { DragStateProvider } from './lib/DragStateProvider';
import HelpButton from './HelpButton';
import PlantTray from './PlantTray';
import { FilterProvider } from "./lib/FilterProvider";
import Admin from './Admin';
import AdminPlantForm from './AdminPlantForm';

function RequireAuth({ children }) {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    if (loading) return null;

    // Show the login modal over the current URL rather than navigating away
    // immediately — Navigate would unmount this component before the modal renders.
    // Dismissing without signing in sends the user home; a successful login lets
    // auth state drive the re-render and the modal disappears naturally.
    if (!user) return (
        <LoginModal
            show
            onHide={() => navigate('/', { replace: true })}
            onSuccess={() => {}}
        />
    );

    return children;
}

function RequireAdmin({ children }) {
    const { user, loading: authLoading } = useAuth();
    const { isAdmin, loading: adminLoading } = useIsAdmin();

    if (authLoading || adminLoading) return null;
    if (!user || !isAdmin) return <Navigate to="/" replace />;

    return children;
}

function AppShell() {
    const { isPasswordRecovery, clearRecovery } = useAuth();
    return (
        <>
            <Navigator />
            <HelpButton />
            <PlantTray />
            <img src={`${import.meta.env.BASE_URL}plant-left.png`} className="deco-plant-left" alt="" aria-hidden="true" />
            <img src={`${import.meta.env.BASE_URL}plant-right.png`} className="deco-plant-right" alt="" aria-hidden="true" />
            {isPasswordRecovery && <ResetPasswordModal onHide={clearRecovery} />}
            <BsContainer className="px-4 px-md-5 mt-3">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/catalog" element={<RequireAuth><Catalog /></RequireAuth>} />
                    <Route path="/garden"  element={<RequireAuth><MyGarden /></RequireAuth>} />
                    <Route path="/companion-planting" element={<RequireAuth><FilterProvider><CompanionPlanting /></FilterProvider></RequireAuth>} />
                    <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                    <Route path="/plant/:id" element={<RequireAuth><PlantProfile /></RequireAuth>} />
                    <Route path="/log/:id" element={<PlantLogDetail />} />
                    <Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
                    <Route path="/admin/plant/:id" element={<RequireAdmin><AdminPlantForm /></RequireAdmin>} />
                    <Route path="/admin/plant/new" element={<RequireAdmin><AdminPlantForm /></RequireAdmin>} />
                    <Route path="/seasons" element={<SeasonalCalendar />} />
                </Routes>
            </BsContainer>
        </>
    );
}

function App() {
    return (
        <AuthProvider>
        <FavoritesProvider>
        <PlantTrayProvider>
        <DragStateProvider>
            <HashRouter>
                <AppShell />
            </HashRouter>
        </DragStateProvider>
        </PlantTrayProvider>
        </FavoritesProvider>
        </AuthProvider>
    );
};

export default App;