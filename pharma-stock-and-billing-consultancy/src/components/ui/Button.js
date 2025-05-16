import React from 'react';
import clsx from 'clsx';

export const Button = ({ className, children, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all",
        className
      )}
    >
      {children}
    </button>
  );
};
