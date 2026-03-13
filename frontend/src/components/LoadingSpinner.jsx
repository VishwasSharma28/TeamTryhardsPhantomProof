import React, { useState, useEffect } from 'react';

const LoadingSpinner = () => {
    const [msgIndex, setMsgIndex] = useState(0);
    const messages = [
        "Analyzing image for signs of manipulation...",
        "Running ELA (Error Level Analysis)...",
        "Extracting OCR and running RoBERTa...",
        "Running 94% accuracy AI detector (umm-maybe)...",
        "Please wait! This can take 2-3 minutes on CPU...",
        "Almost done processing multi-layered AI inference..."
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setMsgIndex((prev) => (prev + 1) % messages.length);
        }, 5000); // Change text every 5 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-t-4 border-blue-500 border-opacity-20"></div>
                <div className="absolute inset-0 rounded-full border-t-4 border-blue-600 animate-spin"></div>
            </div>
            <p className="text-blue-400 font-semibold text-lg animate-pulse">{messages[msgIndex]}</p>
            <p className="text-gray-500 text-sm italic mt-2 text-center max-w-sm">
                (Note: Running 3 deep learning models on a local CPU takes about 2 to 3 minutes. Please do not refresh the page!)
            </p>
        </div>
    );
};

export default LoadingSpinner;
