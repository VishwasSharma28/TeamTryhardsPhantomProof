import React, { useState, useRef } from 'react';
import axios from 'axios';
import API_URL from '../config.js';

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
            const analyzeRes = await axios.post(`${API_URL}/scan/image?lang=en`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            onUploadSuccess({ ...analyzeRes.data, original_image: objectUrl }, objectUrl);

        } catch (err) {
            console.error(err);
            onUploadError(err.response?.data?.detail || 'Failed to analyze image. Please try again.');
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
            <div
                className={`relative w-full border-2 border-dashed rounded-2xl transition-colors cursor-pointer mb-6 ${dragActive ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 bg-gray-900/50 hover:border-purple-400 hover:bg-gray-900'}`}
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
                <div className="flex flex-col items-center justify-center py-16 pointer-events-none">
                    <div className="p-4 bg-purple-500/10 rounded-full mb-4">
                        <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                    </div>
                    <p className="text-gray-300 font-medium mb-1">
                        <span className="text-purple-400 font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, JPEG (Max 10MB)</p>
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