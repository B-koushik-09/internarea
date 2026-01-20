import { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectuser, selectLoading } from "@/Feature/Userslice";
import { Heart, MessageSquare, Share2, MoreHorizontal, Trash2, Send, X, Check, Search } from "lucide-react";
import { toast } from "react-toastify";
import { selectLanguage } from "@/Feature/LanguageSlice";
import { translations } from "@/utils/translations";

export default function Feed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [postToShare, setPostToShare] = useState<string | null>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  const user = useSelector(selectuser);
  const isLoading = useSelector(selectLoading);

  const currentLanguage = useSelector(selectLanguage);
  const t = { ...translations["English"], ...((translations as any)[currentLanguage] || {}) };

  if (isLoading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>;

  const fetchPosts = () => {
    if (user?._id) {
      axios.get(`https://internarea-backend-kd6b.onrender.com/api/post-routes/feed/${user._id}`)
        .then(res => setPosts(res.data))
        .catch(err => console.error(err));
    }
  };

  const fetchFriends = () => {
    if (user?._id) {
      axios.get(`https://internarea-backend-kd6b.onrender.com/api/friend-routes/list/${user._id}`)
        .then(res => setFriends(res.data))
        .catch(e => console.error(e));
    }
  }

  useEffect(() => {
    fetchPosts();
  }, [user]);

  const like = async (id: string) => {
    try {
      await axios.post("https://internarea-backend-kd6b.onrender.com/api/post-routes/like", { postId: id, userId: user?._id });
      setPosts(prev => prev.map(p => {
        if (p._id === id) {
          const likes = p.likes.includes(user._id)
            ? p.likes.filter((uid: string) => uid !== user._id)
            : [...p.likes, user._id];
          return { ...p, likes };
        }
        return p;
      }));
    } catch (e) { console.error(e); }
  };

  const openShareModal = (postId: string) => {
    setPostToShare(postId);
    setShareModalOpen(true);
    fetchFriends();
    setSelectedFriends([]);
  };

  const submitShare = async () => {
    if (!postToShare || selectedFriends.length === 0) return;

    try {
      for (const friendId of selectedFriends) {
        await axios.post("https://internarea-backend-kd6b.onrender.com/api/message/send", {
          sender: user._id,
          receiver: friendId,
          content: "Shared a post with you",
          sharedPost: postToShare
        });
      }

      toast.success(`${t?.public_sent_to || "Sent to"} ${selectedFriends.length} friends!`);
      setShareModalOpen(false);
    } catch (e) {
      console.error(e);
      toast.error(t?.public_err_send || "Failed to send");
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm(t?.public_confirm_delete || "Are you sure you want to delete this post?")) return;
    try {
      await axios.delete(`https://internarea-backend-kd6b.onrender.com/api/post-routes/delete/${id}`);
      toast.success(t?.public_msg_deleted || "Post deleted");
      setPosts(prev => prev.filter(p => p._id !== id));
    } catch (e) {
      toast.error(t?.public_err_delete || "Failed to delete");
    }
  };

  const submitComment = async (postId: string) => {
    if (!commentText.trim()) return;
    try {
      await axios.post("https://internarea-backend-kd6b.onrender.com/api/post-routes/comment", {
        postId,
        userId: user._id,
        text: commentText
      });
      toast.success(t?.public_msg_commented || "Comment added");
      setCommentText("");
      setActiveCommentId(null);
      fetchPosts();
    } catch (e) {
      toast.error(t?.public_err_comment || "Failed to comment");
    }
  };

  const toggleFriendSelection = (fid: string) => {
    setSelectedFriends(prev =>
      prev.includes(fid) ? prev.filter(id => id !== fid) : [...prev, fid]
    );
  }

  return (
    <div className="space-y-6 relative">
      {posts.map(p => (
        <div key={p._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
          {/* Post Header */}
          <div className="p-4 flex justify-between items-center">
            <div className="flex space-x-3 items-center">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex-shrink-0 p-0.5 border border-gray-100">
                {p.user?.photo ? (
                  <img src={p.user.photo} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full flex items-center justify-center font-bold text-gray-500 bg-gray-200">
                    {p.user?.name ? p.user.name[0] : "U"}
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm leading-tight hover:underline cursor-pointer">{p.user?.name || "Anonymous User"}</h4>
                <p className="text-xs text-gray-500">{new Date(p.createdAt || Date.now()).toLocaleDateString()}</p>
              </div>
            </div>

            {user?._id === p.user?._id && (
              <button
                onClick={() => deletePost(p._id)}
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all"
                title={t?.public_delete_post || "Delete Post"}
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>

          <div className="px-4 pb-3">
            <p className="text-gray-800 text-sm md:text-base whitespace-pre-wrap leading-relaxed">{p.content}</p>
          </div>

          {p.mediaUrl && (
            <div className="mt-1 w-full bg-gray-50 border-t border-b border-gray-100">
              <img src={p.mediaUrl} className="w-full h-auto max-h-[500px] object-contain mx-auto" alt="Post media" />
            </div>
          )}

          <div className="px-4 py-3 flex justify-between text-xs font-medium text-gray-500 border-b border-gray-50">
            <span className="flex items-center space-x-1">
              <Heart size={14} className="fill-red-500 text-red-500" />
              <span>{p.likes?.length || 0} {t?.public_like || "Likes"}</span>
            </span>
            <button
              onClick={() => setActiveCommentId(activeCommentId === p._id ? null : p._id)}
              className="hover:text-blue-600 transition-colors"
            >
              {p.comments?.length || 0} {t?.public_comment || "Comments"}
            </button>
          </div>

          <div className="px-2 py-2 flex items-center justify-between">
            <button
              onClick={() => like(p._id)}
              className={`flex-1 flex items-center justify-center py-2 rounded-xl space-x-2 transition-all active:scale-95 ${p.likes?.includes(user?._id) ? "text-red-500 bg-red-50" : "text-gray-600 hover:bg-gray-50"}`}
            >
              <Heart size={20} className={p.likes?.includes(user?._id) ? "fill-current" : ""} />
              <span className="text-sm font-semibold">{t?.public_like || "Like"}</span>
            </button>
            <button
              onClick={() => setActiveCommentId(activeCommentId === p._id ? null : p._id)}
              className={`flex-1 flex items-center justify-center py-2 rounded-xl space-x-2 transition-all active:scale-95 ${activeCommentId === p._id ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:bg-gray-50"}`}
            >
              <MessageSquare size={20} />
              <span className="text-sm font-semibold">{t?.public_comment || "Comment"}</span>
            </button>
            <button
              onClick={() => openShareModal(p._id)}
              className="flex-1 flex items-center justify-center py-2 rounded-xl text-gray-600 space-x-2 hover:bg-gray-50 transition-all active:scale-95"
            >
              <Share2 size={20} />
              <span className="text-sm font-semibold">{t?.public_share || "Share"}</span>
            </button>
          </div>

          {activeCommentId === p._id && (
            <div className="bg-gray-50 p-4 border-t border-gray-100 animate-fadeIn">
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {p.comments && p.comments.length > 0 ? (
                  p.comments.map((c: any, idx: number) => (
                    <div key={idx} className="flex space-x-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0 overflow-hidden">
                        {c.user?.photo ? <img src={c.user.photo} className="w-full h-full object-cover" /> : (c.user?.name?.[0] || 'U')}
                      </div>
                      <div className="bg-white p-2 rounded-lg rounded-tl-none shadow-sm border border-gray-200 text-sm">
                        <p className="font-bold text-xs text-gray-900 mb-0.5">{c.user?.name || "Unknown"}</p>
                        <p className="text-gray-800">{c.text}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-xs text-gray-400 italic">{t?.public_no_comments || "No comments yet. Say something!"}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder={t?.public_write_something || "Write a comment..."}
                  className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  onKeyDown={e => e.key === 'Enter' && submitComment(p._id)}
                />
                <button
                  onClick={() => submitComment(p._id)}
                  disabled={!commentText.trim()}
                  className="text-blue-600 hover:text-blue-700 disabled:text-gray-300 cursor-pointer"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {posts.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          <p>{t?.public_no_posts || "No posts yet. Be the first to share!"}</p>
        </div>
      )}

      {shareModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">{t?.public_share_friends || "Share with Friends"}</h3>
              <button onClick={() => setShareModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 max-h-[300px] overflow-y-auto space-y-2">
              {friends.length === 0 ? (
                <p className="text-center text-gray-500">You don't have any friends to share with yet.</p>
              ) : (
                friends.filter(f => f).map(f => (
                  <div key={f._id}
                    onClick={() => toggleFriendSelection(f._id)}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${selectedFriends.includes(f._id) ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                        {f.photo ? <img src={f.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">{f.name[0]}</div>}
                      </div>
                      <span className="font-medium text-gray-900">{f.name}</span>
                    </div>
                    {selectedFriends.includes(f._id) && <Check size={18} className="text-blue-600" />}
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={submitShare}
                disabled={selectedFriends.length === 0}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {t?.public_share_btn || "Share"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
