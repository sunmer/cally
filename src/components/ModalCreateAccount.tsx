// components/ScheduleItem.tsx
import React from 'react';

type ModalCreateAccountProps = {
  isOpened: boolean;
  onClose: () => void;
};

const ModalCreateAccount: React.FC<ModalCreateAccountProps> = ({
  isOpened,
  onClose
}) => {

  return (
    <>
      <div className={`hs-overlay size-full fixed top-0 start-0 z-[80] pointer-events-none ${isOpened ? 'open' : 'hidden'}`}>
        <div className="hs-overlay-open:mt-7 p-4 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-0 ease-out transition-all lg:max-w-2xl lg:w-full m-3 lg:mx-auto">
          <div className="flex flex-col bg-white shadow-sm rounded-xl pointer-events-auto">

            <div className="px-4 py-6">

              <h1 className="block text-3xl font-bold text-gray-800">
                Start your journey with Calera
              </h1>
              <p className="mt-3 mt-5 text-neutral-500 md:text-lg">
                Create your first schedule and add it to your calendar to sign up!
              </p>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={onClose}
                  className="inline-flex justify-center items-center gap-x-3 text-center bg-teal-500 hover:bg-teal-600 focus:outline-none border border-transparent text-white text-sm font-medium rounded-full py-3 px-4 disabled:opacity-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        onClick={onClose}
        className={`z-10 hs-overlay-backdrop transition duration fixed inset-0 bg-gray-900 bg-opacity-50 ${isOpened ? 'open' : 'hidden'}`}
      />
    </>
  );
};

export default ModalCreateAccount;
