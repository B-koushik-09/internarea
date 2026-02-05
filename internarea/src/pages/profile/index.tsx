import { selectuser } from "@/Feature/Userslice";
import { ExternalLink, Mail, User, Briefcase, CheckCircle } from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectLanguage } from "@/Feature/LanguageSlice";
import { translations } from "@/utils/translations";
import axios from "axios";

interface User {
  name: string;
  email: string;
  photo: string;
}

const ProfilePage = () => {
  const user = useSelector(selectuser);
  const currentLanguage = useSelector(selectLanguage);
  const t = { ...translations["English"], ...((translations as any)[currentLanguage] || {}) };

  const [activeCount, setActiveCount] = useState(0);
  const [acceptedCount, setAcceptedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch application counts
  useEffect(() => {
    const fetchApplicationCounts = async () => {
      if (!user?.name) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get("https://internarea-wy7x.vercel.app/api/application");
        const allApplications = res.data;

        // Filter applications for current user
        const userApplications = allApplications.filter(
          (app: any) => app.user?.name === user?.name
        );

        // Count active (pending) applications
        const active = userApplications.filter(
          (app: any) => app.status?.toLowerCase() === "pending"
        ).length;

        // Count accepted applications (check both 'accepted' and 'approved')
        const accepted = userApplications.filter(
          (app: any) =>
            app.status?.toLowerCase() === "accepted" ||
            app.status?.toLowerCase() === "approved"
        ).length;

        setActiveCount(active);
        setAcceptedCount(accepted);
      } catch (error) {
        console.error("Failed to fetch applications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplicationCounts();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="relative h-32 bg-gradient-to-r from-blue-500 to-blue-600">
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
              {user?.photo ? (
                <img
                  src={user?.photo}
                  alt={user?.name}
                  className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-gray-200 flex items-center justify-center">
                  <User className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Profile Content */}
          <div className="pt-16 pb-8 px-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
              <div className="mt-2 flex items-center justify-center text-gray-500">
                <Mail className="h-4 w-4 mr-2" />
                <span>{user?.email}</span>
              </div>
            </div>

            {/* Profile Details */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                    <span className="text-blue-600 font-semibold text-2xl">
                      {loading ? "..." : activeCount}
                    </span>
                  </div>
                  <p className="text-blue-600 text-sm mt-1">
                    {t?.profile_active_apps || "Active Applications"}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-600 font-semibold text-2xl">
                      {loading ? "..." : acceptedCount}
                    </span>
                  </div>
                  <p className="text-green-600 text-sm mt-1">
                    {t?.profile_accepted_apps || "Accepted Applications"}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-center pt-4">
                <Link
                  href="/userapplication"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  {t?.profile_view_apps || "View Applications"}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
