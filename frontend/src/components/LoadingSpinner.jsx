import React from 'react';

const LoadingSpinner = () => {
    return (
        <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-t-4 border-blue-500 border-opacity-20"></div>
                <div className="absolute inset-0 rounded-full border-t-4 border-blue-600 animate-spin"></div>
            </div>
            <p className="text-gray-400 text-sm animate-pulse">Analyzing image for signs of manipulation (10-30s)...</p>
        </div>
    );
};

export default LoadingSpinner;
