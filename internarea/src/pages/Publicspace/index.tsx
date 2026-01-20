import { useSelector } from "react-redux";
import { selectuser, selectLoading } from "@/Feature/Userslice";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import axios from "axios";
import Feed from "./Feed";
import CreatePost from "./CreatePost";
import Requests from "./Requests";
import AddFriend from "./AddFriend";
import MessageDrawer from "./MessageDrawer";
import Link from "next/link";
import { LayoutGrid, Users, MessageCircle, Menu, X } from "lucide-react";
import { selectLanguage } from "@/Feature/LanguageSlice";
import { translations } from "@/utils/translations";

export default function PublicHome() {
  const user = useSelector(selectuser);
  const isLoading = useSelector(selectLoading);
  const router = useRouter();
  const [stats, setStats] = useState({ friends: 0, posts: 0, refresh: 0 });
  // State for Navigation
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const closeSidebar = () => setIsSidebarOpen(false);

  const currentLanguage = useSelector(selectLanguage);
  const t = { ...translations["English"], ...((translations as any)[currentLanguage] || {}) };


  useEffect(() => {
    if (user?._id) {
      // Fetch counts
      const fetchData = async () => {
        try {
          const fRes = await axios.get(`https://internarea-backend-kd6b.onrender.com/api/friend-routes/list/${user._id}`);
          const pRes = await axios.get(`https://internarea-backend-kd6b.onrender.com/api/post-routes/my/${user._id}`);
          setStats({
            friends: fRes.data.length,
            posts: pRes.data.length,
            refresh: 0
          });
        } catch (e) { console.error(e); }
      };
      fetchData();
    }
  }, [user]);

  if (!isLoading && !user && typeof window !== 'undefined') {
    router.push("/login");
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return null; // Wait for redirect

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Mobile Sidebar Toggle (Visible only on mobile) */}
        <div className="lg:hidden flex items-center justify-between mb-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200 sticky top-20 z-30">
          <div className="flex items-center space-x-3">
            <img src={user?.photo || "https://via.placeholder.com/40"} className="w-10 h-10 rounded-full" />
            <span className="font-bold text-gray-800">{t?.public_my_space || "My Space"}</span>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200">
            <Menu size={24} />
          </button>
        </div>

        {/* Mobile Sidebar Drawer */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden font-sans">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeSidebar}></div>
            <div className="fixed inset-y-0 left-0 w-3/4 max-w-[300px] bg-white shadow-2xl animate-slideRight overflow-y-auto z-50">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-blue-600 text-white">
                <span className="font-bold text-lg">{t?.public_menu || "Menu"}</span>
                <button onClick={closeSidebar} className="p-1 hover:bg-blue-700 rounded transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="p-4 space-y-6">
                {/* Profile Summary */}
                <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                  <img src={user?.photo || "https://via.placeholder.com/150"} className="w-16 h-16 rounded-full mx-auto mb-2 border-2 border-white shadow-md object-cover" />
                  <h3 className="font-bold text-gray-900">{user?.name}</h3>
                  <p className="text-xs text-gray-500 mb-3">{user?.email}</p>
                  <div className="flex justify-center space-x-4 text-xs font-semibold text-gray-700">
                    <span>{stats.friends} {t?.public_friends || "Friends"}</span>
                    <span>{stats.posts} {t?.public_posts || "Posts"}</span>
                  </div>
                </div>

                {/* Navigation Links */}
                <nav className="space-y-1">
                  <h4 className="px-2 text-xs font-bold text-gray-400 uppercase mb-2">{t?.public_navigation || "Navigation"}</h4>
                  <Link href="/Publicspace/Feed" onClick={closeSidebar} className="flex items-center space-x-3 px-3 py-2.5 text-gray-700 font-medium hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
                    <LayoutGrid size={18} /> <span>{t?.public_feed || "Feed"}</span>
                  </Link>
                  <Link href="/Publicspace/Friends" onClick={closeSidebar} className="flex items-center space-x-3 px-3 py-2.5 text-gray-700 font-medium hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
                    <Users size={18} /> <span>{t?.public_my_friends || "My Friends"}</span>
                  </Link>
                </nav>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="hidden lg:block lg:col-span-3 space-y-6 lg:order-1">
            {user && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center top-24">
                <div className="relative inline-block">
                  <img src={user.photo || "https://via.placeholder.com/150"} className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white shadow-md object-cover" />
                  <div className="absolute bottom-4 right-2 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                <p className="text-sm text-gray-500 mb-6">{user.email}</p>
                <div className="flex justify-center space-x-6 py-4 border-t border-gray-100">
                  <div className="text-center">
                    <span className="block text-2xl font-bold text-gray-900">{stats.friends}</span>
                    <span className="text-xs text-gray-500 uppercase tracking-widest">{t?.public_friends || "Friends"}</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-2xl font-bold text-gray-900">{stats.posts}</span>
                    <span className="text-xs text-gray-500 uppercase tracking-widest">{t?.public_posts || "Posts"}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden top-[400px]">
              <nav className="p-2 space-y-1">
                <Link href="/Publicspace/Feed" className="flex items-center space-x-3 px-4 py-3 text-gray-700 font-medium hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all">
                  <LayoutGrid size={20} />
                  <span>{t?.public_feed || "Feed"}</span>
                </Link>
                <Link href="/Publicspace/Friends" className="flex items-center space-x-3 px-4 py-3 text-gray-700 font-medium hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all">
                  <Users size={20} />
                  <span>{t?.public_my_friends || "My Friends"}</span>
                </Link>
              </nav>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6 order-first lg:order-2">
            <div className="lg:hidden bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <img src={user?.photo || "https://via.placeholder.com/40"} className="w-12 h-12 rounded-full border border-gray-100" />
                <div>
                  <h3 className="font-bold text-gray-900">{user?.name}</h3>
                  <div className="flex space-x-2 text-xs text-gray-500">
                    <span>{stats.friends} {t?.public_friends || "Friends"}</span>
                    <span>•</span>
                    <span>{stats.posts} {t?.public_posts || "Posts"}</span>
                  </div>
                </div>
              </div>
              <Link href="/Publicspace/Friends" className="p-2 bg-gray-50 rounded-full text-blue-600">
                <Users size={20} />
              </Link>
            </div>

            <CreatePost onPostCreated={() => setStats(prev => ({ ...prev, refresh: (prev.refresh || 0) + 1 }))} />
            <Feed key={stats.refresh || 0} />
          </div>

          <div className="lg:col-span-3 space-y-6 lg:order-3">
            <Requests />
            <AddFriend />
          </div>

        </div>

        <MessageDrawer />
      </div>
    </div>
  );
}

function UserPlusLinkIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-plus"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
  );
}
