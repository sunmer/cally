import { Loader2, LogIn, LogOut } from "lucide-react";
import { useAuth } from '../AuthContext';

const Header: React.FC = () => {
  const { logout, loading, login, isAuthenticated } = useAuth();

  return (
    <header className="flex flex-wrap sm:justify-start sm:flex-nowrap w-full text-sm py-3">
      <nav className="max-w-[85rem] w-full mx-auto px-4 relative">
        <div className="flex flex-row items-center justify-end gap-5 mt-5">
          {loading && (
            <button
              type="button"
              disabled={true}
              className="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-teal-100 text-teal-800 hover:bg-teal-200 focus:outline-hidden focus:bg-teal-200 disabled:opacity-50 disabled:pointer-events-none dark:text-teal-500 dark:bg-teal-800/30 dark:hover:bg-teal-800/20 dark:focus:bg-teal-800/20"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
            </button>
          )}
          {isAuthenticated && !loading && (
            <button
              type="button"
              onClick={logout}
              disabled={loading}
              className="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-teal-100 text-teal-800 hover:bg-teal-200 focus:outline-hidden focus:bg-teal-200 disabled:opacity-50 disabled:pointer-events-none dark:text-teal-500 dark:bg-teal-800/30 dark:hover:bg-teal-800/20 dark:focus:bg-teal-800/20"
            >
              Logout
              <LogOut className="w-4 h-4" />
            </button>
          )}
          {!isAuthenticated && !loading && (
            <button
              type="button"
              onClick={login}
              className="cursor-pointer inline-flex justify-center items-center gap-x-3 text-center text-teal-500 text-sm font-medium"
            >
              Login
              <LogIn className="w-4 h-4" />
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
