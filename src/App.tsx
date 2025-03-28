import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Footer from './components/Footer';
import Header from './components/Header';
import PrivacyAgreement from './PrivacyAgreement';
import LandingPage from './LandingPage';
import ScheduleEvent from './ScheduleEvent';
import { ScheduleProvider } from './ScheduleContext';


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
          <Route path="/privacy-agreement" element={<PrivacyAgreement />} />
          <Route path="/events/:uuid/:id" element={<ScheduleEvent />} />
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