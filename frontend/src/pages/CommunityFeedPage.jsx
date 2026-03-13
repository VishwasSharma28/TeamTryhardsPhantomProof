import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AnimatedBackground from "../components/landing/AnimatedBackground";
import Navbar from "../components/landing/Navbar";
import CreatePostCard from "../components/community/CreatePostCard";
import FeedPost from "../components/community/FeedPost";

// Dummy data for initial posts
const initialPosts = [
  {
    id: 1,
    author: {
      name: "Alex Vance",
      role: "Digital Forensics Lead",
      avatar: "https://ui-avatars.com/api/?name=Alex+Vance&background=3b82f6&color=fff",
      verified: true
    },
    time: "2h ago",
    content: "Just ran this viral 'leaked' photograph through the Phantom AI Deepfake scanner. As expected, it's artificially generated. The ELA analysis showed massive inconsistencies around the facial features.",
    reportData: {
      verdict: "Deepfake",
      confidence: 99.4,
      image: "https://images.unsplash.com/photo-1618032717906-8c903ea291e5?auto=format&fit=crop&q=80&w=400",
      tags: ["Midjourney v5", "CGI", "Inconsistent Shadows"]
    },
    likes: 342,
    comments: [
      { id: 101, author: "Sarah Li", avatar: "https://ui-avatars.com/api/?name=Sarah+Li&background=ec4899&color=fff", text: "Incredible catch. The lighting on the left side gave it away for me.", time: "1h ago" }
    ]
  },
  {
    id: 2,
    author: {
      name: "Marcus Johnson",
      role: "Independent Journalist",
      avatar: "https://ui-avatars.com/api/?name=Marcus+Johnson&background=10b981&color=fff",
      verified: false
    },
    time: "5h ago",
    content: "Uploading the payment receipt from that recent scam warning going around. Phantom verified it's completely authentic. The metadata perfectly matches the issued bank statement.",
    reportData: {
      verdict: "Authentic",
      confidence: 96.8,
      tags: ["Clear Metadata", "Valid UTR", "No Splices"]
    },
    likes: 128,
    comments: []
  },
  {
    id: 3,
    author: {
      name: "Elena Rostova",
      role: "OSINT Researcher",
      avatar: "https://ui-avatars.com/api/?name=Elena+Rostova&background=f59e0b&color=fff",
      verified: true
    },
    time: "12h ago",
    content: "Found another manipulated invoice today. Fraudsters are getting better, but the pixel DNA analysis caught a subtle splice over the total amount segment.",
    reportData: {
      verdict: "Manipulated",
      confidence: 88.5,
      tags: ["Cloning Detected", "Edited Text", "High Risk"]
    },
    likes: 56,
    comments: [
      { id: 301, author: "John D.", avatar: "https://ui-avatars.com/api/?name=John+D&background=6366f1&color=fff", text: "Wow, they really tried to blend that zero in.", time: "10h ago" },
      { id: 302, author: "Elena Rostova", avatar: "https://ui-avatars.com/api/?name=Elena+Rostova&background=f59e0b&color=fff", text: "Yeah, but the quantization matrix analysis rarely fails.", time: "9h ago" }
    ]
  },
  {
    id: 4,
    author: {
      name: "TechReviewer_09",
      role: "Community Member",
      avatar: "https://ui-avatars.com/api/?name=Tech+Reviewer&background=8b5cf6&color=fff",
      verified: false
    },
    time: "1d ago",
    content: "Testing out the new Fake News detection model on that viral article about Mars colonies. It instantly flagged it as AI-generated text.",
    reportData: {
      verdict: "Deepfake",
      confidence: 92.1,
      tags: ["GPT-4 Detected", "Lack of Sources", "Synthetic Text"]
    },
    likes: 89,
    comments: []
  },
  {
    id: 5,
    author: {
      name: "Phantom AI Official",
      role: "System Admin",
      avatar: "https://ui-avatars.com/api/?name=Phantom&background=06b6d4&color=fff",
      verified: true
    },
    time: "2d ago",
    content: "Welcome to the Phantom AI Community Feed! 🛡️\n\nThis is a safe space to share verification reports, discuss digital forensics, and help combat misinformation. Remember to trust nothing, and verify everything.",
    reportData: null,
    likes: 1042,
    comments: [
      { id: 501, author: "Alice Smith", avatar: "https://ui-avatars.com/api/?name=Alice+Smith&background=14b8a6&color=fff", text: "Glad to be here!", time: "1d ago" }
    ]
  }
];

export default function CommunityFeedPage({ onNavigateHome, onTryNow }) {
  const [posts, setPosts] = useState(initialPosts);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleCreatePost = (newPostData) => {
    const newPost = {
      id: Date.now(),
      author: {
        name: newPostData.authorName,
        role: newPostData.authorRole,
        avatar: newPostData.avatar,
        verified: false
      },
      time: "Just now",
      content: newPostData.content,
      // If a file was attached, create a mock verdict for demonstration
      reportData: newPostData.imageFile ? {
        verdict: "Pending Analysis",
        confidence: 0,
        tags: ["Analyzing..."]
      } : null,
      likes: 0,
      comments: []
    };

    setPosts([newPost, ...posts]);
  };

  return (
    <div className="relative min-h-screen bg-phantom-900 text-white selection:bg-indigo-500/30 noise-overlay">
      <AnimatedBackground />
      
      {/* Reusing Navbar, pass empty onTryNow or handle it to route back */}
      <Navbar onTryNow={onTryNow} onNavigateHome={onNavigateHome} />

      <main className="relative z-10 pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
            Community <span className="text-cyan-400">Feed</span>
          </h1>
          <p className="text-slate-400">
            Share forensic reports, discuss findings, and verify together.
          </p>
        </motion.div>

        {/* Create Post Input */}
        <CreatePostCard onCreatePost={handleCreatePost} />

        {/* Feed List */}
        <div className="space-y-6">
          {posts.map((post) => (
            <FeedPost key={post.id} post={post} />
          ))}
        </div>
      </main>
    </div>
  );
}
