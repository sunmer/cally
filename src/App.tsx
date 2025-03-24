import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Footer from './components/Footer';
import Header from './components/Header';
import PrivacyAgreement from './PrivacyAgreement';
import LandingPage from './LandingPage';


function AppContent() {

  return (
    <main id="content">
      <div className="min-h-screen relative">
        <div className="absolute w-full h-full bg-gradient-to-bl from-[#ffe4e6] to-[#ccfbf1] z-[-1]"></div>
        <ToastContainer />

        <Header />

        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/privacy-agreement" element={<PrivacyAgreement />} />
        </Routes>

        <Footer />
      </div>
    </main>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;