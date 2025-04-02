import React from 'react';
import { useScheduleContext } from '../ScheduleContext';
import { useAuth } from '../AuthContext';
import { toast } from 'react-toastify';
import { Schedule } from '../types';

interface ModalCreateAccountProps {
  isOpened: boolean;
  onClose: () => void;
  schedule: Schedule;
}

const ModalCreateAccount: React.FC<ModalCreateAccountProps> = ({ isOpened, onClose, schedule }) => {
  const { downloadICS } = useScheduleContext();
  const { login } = useAuth();
  const [loading, setLoading] = React.useState(false);

  if (!isOpened) return null;

  const handleDownloadDirectly = async () => {
    if (!schedule) return;
    setLoading(true);
    try {
      await downloadICS(schedule);
      toast('Your ICS file is downloading.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to download ICS.');
    } finally {
      setLoading(false);
      onClose();
    }
  };

  const handleCreateAccount = () => {
    if (!schedule) return;
    localStorage.setItem("pendingSchedule", JSON.stringify(schedule));
    login();
    onClose();
  };

  return (
    <div className={`hs-overlay size-full fixed top-0 start-0 z-[80] pointer-events-none ${isOpened ? 'open' : 'hidden'}`}>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="sm:max-w-lg sm:w-full m-3 sm:mx-auto">
          <div className="flex flex-col bg-white border border-gray-200 shadow-2xs rounded-xl pointer-events-auto dark:bg-neutral-800 dark:border-neutral-700 dark:shadow-neutral-700/70">
            <div className="flex justify-between items-center py-3 px-4 border-b border-gray-200 dark:border-neutral-700">
              <h3 id="hs-basic-modal-label" className="font-bold text-gray-800 dark:text-white">
                Get Started
              </h3>
              <button
                type="button"
                className="size-8 inline-flex justify-center items-center gap-x-2 rounded-full border border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-hidden focus:bg-gray-200 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-neutral-400 dark:focus:bg-neutral-600"
                aria-label="Close"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <svg className="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <p className="mt-1 text-gray-800 dark:text-neutral-400">
                You are not logged in. You can either download the ICS directly or create an account to save your schedule.
              </p>
            </div>
            <div className="flex justify-end items-center gap-x-2 py-3 px-4 border-t border-gray-200 dark:border-neutral-700">
              <button
                type="button"
                onClick={handleDownloadDirectly}
                disabled={loading}
                className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
              >
                {loading ? 'Downloading...' : 'Download as ICS directly'}
              </button>
              <button
                type="button"
                onClick={handleCreateAccount}
                className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:outline-hidden focus:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
              >
                Create account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalCreateAccount;
