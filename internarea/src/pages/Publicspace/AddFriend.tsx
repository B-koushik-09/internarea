import axios from "axios";
import { useState } from "react";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
import { Search, UserPlus, Check } from "lucide-react";
import { toast } from "react-toastify";
import { selectLanguage } from "@/Feature/LanguageSlice";
import { translations } from "@/utils/translations";

export default function AddFriend() {
  const user = useSelector(selectuser);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});

  const currentLanguage = useSelector(selectLanguage);
  const t = { ...translations["English"], ...((translations as any)[currentLanguage] || {}) };

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`https://internarea-wy7x.vercel.app/api/friend-routes/search/${val}`);
      setResults(res.data.filter((u: any) => {
        const isSelfId = user?._id && u._id === user._id;
        const isSelfEmail = user?.email && u.email === user.email;
        return !isSelfId && !isSelfEmail;
      }));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const sendRequest = async (toUser: any) => {
    if (!user) return toast.error(t?.public_login_req || "Not logged in");

    try {
      await axios.post("https://internarea-production.up.railway.app/api/friend-routes/send", {
        from: user._id,
        to: toUser._id
      });
      setSentMap(prev => ({ ...prev, [toUser._id]: true }));
      toast.success(`${t?.public_sent_to || "Sent to"} ${toUser.name}`);
    } catch (e) {
      toast.error(t?.public_err_send || "Failed to send request");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
        <UserPlus size={20} className="mr-2 text-blue-500" />
        {t?.public_find_friends || "Find Friends"}
      </h2>

      <div className="relative mb-6">
        <input
          value={query}
          onChange={e => handleSearch(e.target.value)}
          placeholder={t?.public_search_name || "Search by name..."}
          className="w-full pl-10 pr-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-colors"
        />
        <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-4 text-gray-500">{t?.public_searching || "Searching..."}</div>
        ) : results.length > 0 ? (
          results.map(u => (
            <div key={u._id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:shadow-md hover:border-blue-100 transition-all duration-200 group">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-tr from-blue-100 to-blue-200 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg shadow-inner">
                  {u.photo ? <img src={u.photo} className="w-full h-full rounded-full object-cover" /> : u.name[0]}
                </div>
                <div>
                  <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{u.name}</p>
                  <p className="text-xs text-gray-400 truncate w-32 font-medium">{u.email}</p>
                </div>
              </div>
              <button
                onClick={() => sendRequest(u)}
                disabled={sentMap[u._id]}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center transition-all ${sentMap[u._id]
                  ? "bg-green-50 text-green-600 cursor-default border border-green-100"
                  : "bg-gray-900 text-white hover:bg-blue-600 hover:shadow-lg hover:-translate-y-0.5"
                  }`}
              >
                {sentMap[u._id] ? (
                  <> <Check size={12} className="mr-1" /> {t?.public_sent || "Sent"} </>
                ) : (
                  <> <UserPlus size={12} className="mr-1" /> {t?.public_add || "Add"} </>
                )}
              </button>
            </div>
          ))
        ) : query.length >= 2 ? (
          <div className="text-center py-4 text-gray-400 text-sm">{t?.public_no_users || "No users found."}</div>
        ) : null}
      </div>
    </div>
  );
}
