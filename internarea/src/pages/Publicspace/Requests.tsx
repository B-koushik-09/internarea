import { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
import { Check, X, UserPlus } from "lucide-react";
import { selectLanguage } from "@/Feature/LanguageSlice";
import { translations } from "@/utils/translations";

export default function Requests() {
  const [requests, setRequests] = useState<any[]>([]);
  const user = useSelector(selectuser);

  const currentLanguage = useSelector(selectLanguage);
  const t = { ...translations["English"], ...((translations as any)[currentLanguage] || {}) };

  useEffect(() => {
    if (user?._id) {
      axios.get(`https://internarea-wy7x.vercel.app/api/friend-routes/requests/${user._id}`)
        .then(res => setRequests(res.data))
        .catch(err => console.error("Error fetching requests:", err));
    }
  }, [user]);

  const accept = async (id: string) => {
    try {
      await axios.post("https://internarea-wy7x.vercel.app/api/friend-routes/accept", { requestId: id });
      setRequests(requests.filter(r => r._id !== id));
      alert(t?.public_connected || "Friend request accepted!");
    } catch (e) {
      console.error(e);
      alert(t?.public_err_send || "Failed to accept");
    }
  };

  if (!user) return <div className="text-center p-4 text-gray-500">Please log in.</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-bold text-gray-800 flex items-center">
          <UserPlus size={18} className="mr-2 text-blue-500" />
          {t?.public_friend_requests || "Friend Requests"}
        </h3>
        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{requests.length}</span>
      </div>

      <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
        {requests.length === 0 ? (
          <p className="p-4 text-center text-sm text-gray-500">{t?.public_no_requests || "No new requests"}</p>
        ) : (
          requests.map(r => (
            <div key={r._id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  {r.from.name ? r.from.name[0] : "U"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{r.from.name || "Unknown User"}</p>
                  <p className="text-xs text-gray-500">{t?.public_wants_friend || "wants to be friends"}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => accept(r._id)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-full hover:bg-blue-700 transition-colors shadow-sm"
                  title="Accept"
                >
                  <Check size={14} />
                  <span>{t?.public_accept || "Accept"}</span>
                </button>
                <button
                  onClick={() => {
                    setRequests(requests.filter(req => req._id !== r._id));
                  }}
                  className="p-1.5 bg-gray-100 text-gray-400 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"
                  title="Ignore"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
