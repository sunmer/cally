import { Link } from "react-router-dom";

const Footer: React.FC = () => {

  return (
    <footer className="relative overflow-hidden bg-neutral-900">
      <div className="relative z-10">
        <div className="w-full max-w-5xl px-4 xl:px-0 py-10 lg:pt-16 mx-auto">
          <div className="inline-flex items-center">
            {/* Logo */}
            <span className="font-bold text-white mr-4">Cally</span>
            <Link
              to="/privacy-agreement" className="inline-flex gap-x-2 text-gray-400 hover:text-gray-200 focus:outline-none focus:text-gray-200 dark:text-neutral-400 dark:hover:text-neutral-200 dark:focus:text-neutral-200"
              onClick={() => window.scrollTo(0, 0)}>
              Privacy agreement
            </Link>
            <div className="border-s border-neutral-700 ps-5 ms-5">
              <p className="text-sm text-white">© 2025</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;