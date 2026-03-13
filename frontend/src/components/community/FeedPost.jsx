import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function FeedPost({ post }) {
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes || 0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState(post.comments || []);

  const handleLike = () => {
    if (isLiked) {
      setLikes(likes - 1);
    } else {
      setLikes(likes + 1);
    }
    setIsLiked(!isLiked);
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setComments([
      ...comments,
      {
        id: Date.now(),
        author: "Guest User",
        avatar: "https://ui-avatars.com/api/?name=Guest+User&background=0D8ABC&color=fff",
        text: commentText,
        time: "Just now"
      }
    ]);
    setCommentText("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-6 mb-6 overflow-hidden relative group"
    >
      {/* Background glow specific to report verdict if applicable */}
      {post.reportData && post.reportData.verdict === "Deepfake" && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-[60px] pointer-events-none" />
      )}
      {post.reportData && post.reportData.verdict === "Authentic" && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-[60px] pointer-events-none" />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <img
            src={post.author.avatar}
            alt={post.author.name}
            className="w-10 h-10 rounded-full border border-white/10"
          />
          <div>
            <h4 className="font-semibold text-white flex items-center gap-2">
              {post.author.name}
              {post.author.verified && (
                <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{post.author.role}</span>
              <span>•</span>
              <span>{post.time}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <p className="text-slate-200 mb-4 whitespace-pre-wrap leading-relaxed relative z-10">
        {post.content}
      </p>

      {/* Embedded Report Data */}
      {post.reportData && (
        <div className="bg-black/20 border border-white/5 rounded-xl p-4 mb-4 relative z-10">
          <div className="flex flex-col md:flex-row gap-4">
            {post.reportData.image && (
              <img 
                src={post.reportData.image} 
                alt="Analyzed media" 
                className="w-full md:w-32 h-32 object-cover rounded-lg border border-white/10"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">Analysis Result</span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  post.reportData.verdict === 'Deepfake' ? 'bg-red-500/20 text-red-400' :
                  post.reportData.verdict === 'Authentic' ? 'bg-green-500/20 text-green-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {post.reportData.verdict}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Confidence Score</div>
                  <div className="text-xl font-bold text-white">{post.reportData.confidence}%</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Tags</div>
                  <div className="flex flex-wrap gap-1">
                    {post.reportData.tags?.map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-slate-300 border border-white/10">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center border-t border-white/10 pt-4 mt-2 relative z-10">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isLiked ? "text-pink-500 bg-pink-500/10" : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <svg className={`w-5 h-5 ${isLiked ? 'fill-current' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="font-medium">{likes}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors ml-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="font-medium">{comments.length}</span>
        </button>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden relative z-10"
          >
            <div className="pt-4 border-t border-white/5 mt-4 space-y-4">
              {/* Existing Comments */}
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <img src={comment.avatar} alt={comment.author} className="w-8 h-8 rounded-full" />
                  <div className="bg-white/5 rounded-2xl rounded-tl-none p-3 border border-white/5 flex-1">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-sm font-semibold text-white">{comment.author}</span>
                      <span className="text-[10px] text-slate-500">{comment.time}</span>
                    </div>
                    <p className="text-sm text-slate-300">{comment.text}</p>
                  </div>
                </div>
              ))}

              {/* Add Comment Input */}
              <form onSubmit={handleAddComment} className="flex gap-3 mt-4">
                <img
                  src="https://ui-avatars.com/api/?name=Guest+User&background=0D8ABC&color=fff"
                  alt="Current User"
                  className="w-8 h-8 rounded-full"
                />
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full bg-white/5 border border-white/10 rounded-full py-2 px-4 pr-12 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
