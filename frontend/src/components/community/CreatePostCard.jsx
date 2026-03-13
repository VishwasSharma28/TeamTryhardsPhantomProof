import { useState } from "react";
import { motion } from "framer-motion";

export default function CreatePostCard({ onCreatePost }) {
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim() && !file) return;

    onCreatePost({
      content,
      imageFile: file,
      // For a real app, this would be the logged-in user
      authorName: "Guest User",
      authorRole: "Investigator",
      avatar: "https://ui-avatars.com/api/?name=Guest+User&background=0D8ABC&color=fff",
    });

    setContent("");
    setFile(null);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-6 mb-8 relative z-10"
    >
      <form onSubmit={handleSubmit}>
        <div className="flex gap-4">
          <img
            src="https://ui-avatars.com/api/?name=Guest+User&background=0D8ABC&color=fff"
            alt="Current User"
            className="w-12 h-12 rounded-full border border-white/10"
          />
          <div className="flex-1">
            <textarea
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 resize-none transition-all"
              placeholder="Share a verification report or analysis..."
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            
            {/* File preview */}
            {file && (
              <div className="mt-4 relative inline-block">
                <div className="bg-white/10 rounded-lg p-2 text-sm text-slate-300 flex items-center gap-2">
                  <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  {file.name}
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <div className="flex items-center justify-between mt-4">
              <div className="flex gap-2">
                <label className="cursor-pointer text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium">Attach Report</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={!content.trim() && !file}
                className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${
                  content.trim() || file
                    ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                    : "bg-white/10 text-slate-400 cursor-not-allowed"
                }`}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
