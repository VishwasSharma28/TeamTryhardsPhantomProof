import React, { useState, useRef } from 'react';
import axios from 'axios';

const ImageUpload = ({ onUploadStart, onUploadSuccess, onUploadError }) => {
    const [dragActive, setDragActive] = useState(false);
    const [preview, setPreview] = useState(null);
    const inputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            // Only deactivate if leaving the drop zone entirely
            if (!e.currentTarget.contains(e.relatedTarget)) {
                setDragActive(false);
            }
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = async (file) => {
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);

        const formData = new FormData();
        formData.append('file', file);

        onUploadStart();

        try {
            // Unified Endpoint Call
            const analyzeRes = await axios.post('http://localhost:8000/scan/image?lang=en', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            onUploadSuccess({ ...analyzeRes.data, original_image: objectUrl }, objectUrl);

        } catch (err) {
            console.error(err);
            onUploadError(err.response?.data?.detail || 'Failed to analyze image. Please try again.');
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto mt-8">
            <div
                className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl transition-colors cursor-pointer ${dragActive
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-600 bg-gray-800 hover:bg-gray-700 hover:border-blue-400'
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => inputRef.current.click()}
            >
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleChange}
                />
                {/* pointer-events-none stops child elements from stealing drag events */}
                <div className="flex flex-col items-center justify-center p-6 text-center pointer-events-none">
                    <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    <p className="mb-2 text-sm text-gray-300">
                        <span className="font-semibold text-blue-400">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG or JPEG (Max 10MB)</p>
                </div>
            </div>

            {preview && (
                <div className="mt-4 flex justify-center">
                    <img src={preview} alt="Preview" className="max-h-48 rounded-lg border border-gray-700 object-contain" />
                </div>
            )}
        </div>
    );
};

export default ImageUpload;