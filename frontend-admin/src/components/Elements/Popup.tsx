import React from 'react'

const Popup = ({ children, setIsShowPopup }: any) => {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="relative bg-white rounded shadow p-4 w-full max-w-3xl max-h-[90vh] overflow-auto">
        <button
          type="button"
          aria-label="Close"
          title="Close"
          onClick={() => setIsShowPopup(false)}
          className="absolute right-2 top-2 inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 text-gray-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  )
}

export default Popup
