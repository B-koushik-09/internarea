import { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
import { MessageCircle, X } from "lucide-react";
import { selectLanguage } from "@/Feature/LanguageSlice";
import { translations } from "@/utils/translations";

export default function MessageDrawer() {
    const user = useSelector(selectuser);
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<any[]>([]);

    const currentLanguage = useSelector(selectLanguage);
    const t = { ...translations["English"], ...((translations as any)[currentLanguage] || {}) };

    useEffect(() => {
        if (isOpen && user?._id) {
            axios.get(`https://internarea-backend-kd6b.onrender.com/api/message/inbox/${user._id}`)
                .then(res => setMessages(res.data))
                .catch(console.error);
        }
    }, [isOpen, user]);

    if (!user) return null;

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40"
            >
                <MessageCircle size={24} />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop for mobile */}
                    <div className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>

                    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform animate-slideIn flex flex-col">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-blue-600 text-white shadow-md">
                            <h3 className="font-bold text-lg flex items-center space-x-2">
                                <MessageCircle size={20} />
                                <span>{t?.public_messages_title || "Messages"}</span>
                            </h3>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-blue-700 p-1 rounded-full transition-colors"><X size={24} /></button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 pb-24 space-y-4 bg-gray-50/50">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <MessageCircle size={48} className="mb-4 opacity-20" />
                                    <p className="text-sm">{t?.public_no_messages || "No messages yet."}</p>
                                </div>
                            ) : (
                                messages.map((m: any) => (
                                    <div key={m._id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center space-x-3 mb-3">
                                            <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm">
                                                {m.sender?.name?.[0] || "?"}
                                            </div>
                                            <div>
                                                <span className="block text-sm font-bold text-gray-900">{m.sender?.name}</span>
                                                <span className="block text-[10px] text-gray-400">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                        {m.content && <p className="text-sm text-gray-700 mb-2 leading-relaxed">{m.content}</p>}

                                        {m.sharedPost && (
                                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 mt-2">
                                                {m.sharedPost.mediaUrl && <img src={m.sharedPost.mediaUrl} className="w-full h-32 object-cover rounded-md mb-2" />}
                                                <p className="text-xs text-gray-600 line-clamp-2 italic">"{m.sharedPost.content}"</p>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
