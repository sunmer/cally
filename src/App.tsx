import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Footer from './components/Footer';
import Header from './components/Header';
import PrivacyAgreement from './PrivacyAgreement';
import LandingPage from './LandingPage';


function AppContent() {

  return (
    <main id="content">
      <div className="min-h-screen bg-[#f5f5f5] relative relative overflow-hidden">
        <img
          className="absolute left-0 top-0 opacity-[0.3]"
          src="https://images.unsplash.com/photo-1614854262318-831574f15f1f?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" />
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