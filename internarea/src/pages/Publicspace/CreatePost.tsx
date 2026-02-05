import { useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
import { toast } from "react-toastify";
import { Image, Video, Send } from "lucide-react";
import { selectLanguage } from "@/Feature/LanguageSlice";
import { translations } from "@/utils/translations";

export default function CreatePost({ onPostCreated }: { onPostCreated?: () => void }) {
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [showMediaInput, setShowMediaInput] = useState(false);
  const user = useSelector(selectuser);

  const currentLanguage = useSelector(selectLanguage);
  const t = { ...translations["English"], ...((translations as any)[currentLanguage] || {}) };

  const submit = async () => {
    if (!user) {
      toast.error(t?.public_err_login || "Please login to post");
      return;
    }
    if (!content.trim() && !mediaUrl.trim()) {
      toast.warning(t?.public_add_content || "Please add some content");
      return;
    }

    try {
      const res = await axios.post("https://internarea-wy7x.vercel.app/api/post-routes/create", {
        userId: user._id,
        content,
        mediaUrl
      });

      if (res.data.msg?.includes("limit reached")) {
        toast.warning(res.data.msg);
      } else {
        toast.success(t?.public_posting || "Posted!");
        setContent("");
        setMediaUrl("");
        setFile(null);
        setShowMediaInput(false);
        if (onPostCreated) onPostCreated();
      }
    } catch (err) {
      console.error(err);
      toast.error(t?.public_err_create_post || "Failed to create post");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(t?.public_err_file_size || "File size must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex space-x-3 mb-4">
        {user?.photo ? (
          <img src={user.photo} className="w-10 h-10 rounded-full border border-gray-200" />
        ) : (
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold">
            {user?.name ? user.name[0] : "U"}
          </div>
        )}
        <div className="flex-1">
          <textarea
            onChange={e => setContent(e.target.value)}
            value={content}
            placeholder={`${t?.public_write_something || "What's on your mind"}, ${user?.name?.split(" ")[0] || "User"}?`}
            className="w-full bg-gray-50 border-0 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all resize-none text-sm"
            rows={2}
          />
        </div>
      </div>

      {(showMediaInput || mediaUrl) && (
        <div className="mb-4 animate-fadeIn">
          {mediaUrl ? (
            <div className="relative">
              <img src={mediaUrl} alt="Preview" className="w-full max-h-60 object-contain rounded-lg border border-gray-100" />
              <button
                onClick={() => setMediaUrl("")}
                className="absolute top-2 right-2 bg-gray-800 bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70"
              >
                <span className="sr-only">Remove</span>
                ✕
              </button>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">{t?.public_upload || "Upload from Device"}</label>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
              />
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between items-center pt-2 border-t border-gray-50">
        <div className="flex space-x-2">
          <button
            onClick={() => setShowMediaInput(true)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-blue-500 transition-colors text-sm font-medium"
          >
            <Image size={18} />
            <span>{t?.public_photo_video || "Photo/Video"}</span>
          </button>
        </div>

        <button
          onClick={submit}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-1.5 rounded-lg font-medium transition-all transform active:scale-95"
        >
          <span>{t?.public_post_btn || "Post"}</span>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
