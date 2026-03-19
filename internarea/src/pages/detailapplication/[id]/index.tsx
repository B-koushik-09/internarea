import axios from "axios";
import { Building2, Calendar, Clock, FileText, Loader2, User } from "lucide-react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import React, { useEffect, useState } from "react";
import { selectLanguage } from "@/Feature/LanguageSlice";
import { translations } from "@/utils/translations";
import { API_URL } from "@/utils/apiConfig";

const index = () => {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setloading] = useState(false);
  const [data, setdata] = useState<any>([]);

  const currentLanguage = useSelector(selectLanguage);
  const t = { ...translations["English"], ...((translations as any)[currentLanguage] || {}) };
  useEffect(() => {
    const fetchdata = async () => {
      try {
        setloading(true);
        const res = await axios.get(
          `${API_URL}/api/application/${id}`
        );
        console.log(res.data);
        setdata(res.data);
      } catch (error) {
        console.log(error);
      } finally {
        setloading(false);
      }
    };
    if (id) {
      fetchdata();
    }
  }, [id]);
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">
          {t?.app_detail_loading || "Loading application details..."}
        </span>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <section key={data._id} className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Section */}
            <div className="relative bg-gray-100 min-h-[400px] flex items-center justify-center">
              {data?.user?.photo ? (
                <img
                  alt="Applicant photo"
                  className="w-full h-full object-cover"
                  src={data?.user?.photo}
                  onError={(e: any) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(data?.user?.name || 'U')}&background=random&size=400`;
                  }}
                />
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                  <User size={64} />
                  <p className="mt-2 text-sm font-medium">{t?.no_photo || "No Photo Available"}</p>
                </div>
              )}
              {data.status && (
                <div
                  className={`absolute top-4 right-4 px-4 py-2 rounded-full ${data.status === "accepted"
                    ? "bg-green-100 text-green-600"
                    : data.status === "rejected"
                      ? "bg-red-100 text-red-600"
                      : "bg-yellow-100 text-yellow-600"
                    }`}
                >
                  <span className="font-semibold capitalize">
                    {t?.[`app_status_${data.status}`] || data.status}
                  </span>
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="p-8">
              <div className="mb-8">
                <div className="flex items-center mb-6">
                  <Building2 className="w-5 h-5 text-blue-600 mr-2" />
                  <h2 className="text-sm font-medium text-gray-500">{t?.app_label_company || "Company"}</h2>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  {data.company}
                </h1>
              </div>

              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <FileText className="w-5 h-5 text-blue-600 mr-2" />
                  <h2 className="text-sm font-medium text-gray-500">
                    {t?.app_label_cover_letter || "Cover Letter"}
                  </h2>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {data.coverLetter}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <div className="flex items-center mb-2">
                    <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-gray-500">
                      {t?.app_label_date || "Application Date"}
                    </span>
                  </div>
                  <p className="text-gray-900 font-semibold">
                    {new Date(data.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
 
                <div>
                  <div className="flex items-center mb-2">
                    <User className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-gray-500">
                      {t?.app_label_by || "Applied By"}
                    </span>
                  </div>
                  <p className="text-gray-900 font-semibold">
                    {data.user?.name}
                  </p>
                </div>
              </div>
 
              {/* Availability Section */}
              {data.availability && (
                <div className="mb-8 p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center mb-2 text-blue-700">
                    <Clock className="w-5 h-5 mr-2" />
                    <h2 className="text-sm font-semibold uppercase">{t?.app_label_availability || "Availability"}</h2>
                  </div>
                  <p className="text-gray-700 font-medium">{data.availability}</p>
                </div>
              )}
 
              {/* Resume Section */}
              {data.resume && (
                <div className="border-t pt-8">
                  <div className="flex items-center mb-6">
                    <FileText className="w-6 h-6 text-blue-600 mr-2" />
                    <h2 className="text-xl font-bold text-gray-900">{t?.app_label_resume || "Attached Resume"}</h2>
                  </div>
                  <div className="space-y-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t?.resume_label_education || "Education"}</h3>
                        <p className="text-gray-900 leading-relaxed whitespace-pre-wrap text-sm">{data.resume.education}</p>
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t?.resume_label_skills || "Skills"}</h3>
                        <p className="text-gray-900 leading-relaxed whitespace-pre-wrap text-sm">{data.resume.skills}</p>
                      </div>
                    </div>
                    {data.resume.experience && (
                      <div className="border-t pt-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t?.resume_label_experience || "Experience"}</h3>
                        <p className="text-gray-900 leading-relaxed whitespace-pre-wrap text-sm">{data.resume.experience}</p>
                      </div>
                    )}
                    {(data.resume.achievements || data.resume.strengths) && (
                      <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {data.resume.achievements && (
                          <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t?.resume_label_achievements || "Achievements"}</h3>
                            <p className="text-gray-900 leading-relaxed whitespace-pre-wrap text-sm">{data.resume.achievements}</p>
                          </div>
                        )}
                        {data.resume.strengths && (
                          <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t?.resume_label_strengths || "Strengths"}</h3>
                            <p className="text-gray-900 leading-relaxed whitespace-pre-wrap text-sm">{data.resume.strengths}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default index;
