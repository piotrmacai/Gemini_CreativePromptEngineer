
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md'; // md is default
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseStyle = "rounded-lg font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-150 ease-in-out flex items-center justify-center space-x-2 disabled:cursor-not-allowed";
  
  const sizeStyles = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3", // Default size
  };

  const variantStyles = {
    primary: "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 text-white disabled:bg-indigo-500 disabled:opacity-70",
    secondary: "bg-gray-600 hover:bg-gray-700 focus:ring-gray-500 text-gray-100 disabled:bg-gray-500 disabled:opacity-70",
    danger: "bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white disabled:bg-red-500 disabled:opacity-70",
  };

  return (
    <button
      className={`${baseStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
