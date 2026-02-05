import { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectuser, selectLoading } from "@/Feature/Userslice";
import { Users, Mail } from "lucide-react";
import { selectLanguage } from "@/Feature/LanguageSlice";
import { translations } from "@/utils/translations";

export default function Friends() {
  const [friends, setFriends] = useState<any[]>([]);
  const user = useSelector(selectuser);
  const isLoading = useSelector(selectLoading);

  const currentLanguage = useSelector(selectLanguage);
  const t = { ...translations["English"], ...((translations as any)[currentLanguage] || {}) };

  if (isLoading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>;

  useEffect(() => {
    if (user?._id) {
      axios.get(`https://internarea-wy7x.vercel.app/api/friend-routes/list/${user._id}`)
        .then(res => setFriends(res.data))
        .catch(err => console.error(err));
    }
  }, [user]);

  if (!user) return <div className="p-8 text-center text-gray-500 font-medium">{t?.public_login_req || "Please login to view friends."}</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800 flex items-center">
          <Users size={20} className="mr-2 text-blue-500" />
          {t?.public_my_friends || "My Friends"} <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{friends.length}</span>
        </h2>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {friends.length === 0 ? (
          <div className="col-span-2 text-center py-8 text-gray-400">
            <p>{t?.public_no_friends_msg || "You haven't added any friends yet."}</p>
            <p className="text-xs mt-1">{t?.public_search_network || "Search for people to build your network!"}</p>
          </div>
        ) : (
          friends.map(f => (
            <div key={f._id} className="flex items-center space-x-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-tr from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {f.name ? f.name[0] : "F"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{f.name}</p>
                <div className="flex items-center text-xs text-gray-500 mt-0.5">
                  <Mail size={12} className="mr-1" />
                  <span className="truncate">{f.email}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
