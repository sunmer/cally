import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Footer from './components/Footer';
import Header from './components/Header';
import PrivacyAgreement from './PrivacyAgreement';
import LandingPage from './LandingPage';


function AppContent() {

  return (
    <main id="content">
      <div className="min-h-screen relative relative overflow-hidden before:absolute before:top-0 before:start-1/2 before:bg-[url('bg-element.svg')] before:bg-no-repeat before:bg-top before:size-full before:-z-1 before:transform before:-translate-x-1/2">

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