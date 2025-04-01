import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Footer from './components/Footer';
import Header from './components/Header';
import PrivacyAgreementPage from './PrivacyAgreementPage';
import LandingPage from './LandingPage';
import ScheduleEventPage from './ScheduleEventPage';
import { ScheduleProvider } from './ScheduleContext';
import LandingPageWater from './landingpages/LandingPageWater';
import LandingPageMeditation from './landingpages/LandingPageMeditation';
import LandingPageProLifeTips from './landingpages/LandingPageProLifeTips';


function AppContent() {

  return (
    <main id="content">
      <div className="min-h-screen bg-[#f5f5f5] relative relative overflow-hidden">
        <div className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              radial-gradient(at 30% 30%, #a3e6b1 0%, transparent 40%),
              radial-gradient(at 70% 20%, #f7f1dc 0%, transparent 50%),
              radial-gradient(at 50% 50%, #cfcfe8 0%, transparent 60%),
              radial-gradient(at 20% 80%, #2bc29b 0%, transparent 50%),
              radial-gradient(at 80% 80%, #3ed7c2 0%, transparent 50%)
            `
          }}
        ></div>

        <ToastContainer />

        <Header />

        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/privacy-agreement" element={<PrivacyAgreementPage />} />
          <Route path="/events/:uuid/:id" element={<ScheduleEventPage />} />

          <Route path="/landing/water" element={<LandingPageWater />} />
          <Route path="/landing/meditation" element={<LandingPageMeditation />} />
          <Route path="/landing/prolifetips" element={<LandingPageProLifeTips />} />
        </Routes>

        <Footer />
      </div>
    </main>
  );
}

function App() {
  return (
    <Router>
      <ScheduleProvider>
        <AppContent />
      </ScheduleProvider>
    </Router>
  );
}

export default App;