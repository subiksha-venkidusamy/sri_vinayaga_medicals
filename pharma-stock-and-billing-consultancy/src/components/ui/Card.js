import React from 'react';
import clsx from 'clsx';

export const Card = ({ className, children }) => {
  return (
    <div className={clsx("bg-white shadow-lg rounded-2xl p-4 border", className)}>
      {children}
    </div>
  );
};

export const CardContent = ({ className, children }) => {
  return <div className={clsx("p-4", className)}>{children}</div>;
};
