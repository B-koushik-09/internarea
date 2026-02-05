import React, { useEffect, useState } from "react";
import Navbar from "@/Components/Navbar";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
import axios from "axios";
import { selectLanguage } from "@/Feature/LanguageSlice";
import { translations } from "@/utils/translations";

const LoginHistory = () => {
    const user = useSelector(selectuser);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const currentLanguage = useSelector(selectLanguage);
    const t = { ...translations["English"], ...((translations as any)[currentLanguage] || {}) };

    useEffect(() => {
        if (user?.email) {
            fetchHistory();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchHistory = async () => {
        try {
            const res = await axios.get(`https://internarea-wy7x.vercel.app/api/auth/history/${user.email}`);
            setHistory(res.data.history || []);
        } catch (error) {
            console.error("Failed to fetch history", error);
        }
        setLoading(false);
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto py-10 px-4">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">{t?.history_title || "Login History"}</h1>
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    {user ? (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t?.history_device || "Device"}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t?.history_os || "OS"}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t?.history_browser || "Browser"}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t?.history_ip || "IP Address"}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t?.history_time || "Time (IST)"}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr><td colSpan={5} className="px-6 py-4 text-center">{t?.history_loading || "Loading..."}</td></tr>
                                ) : history.length > 0 ? (
                                    history.slice().reverse().map((log: any, index: number) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.device}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.os}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.browser}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.ip}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {log.time ? new Date(log.time).toLocaleString() : "N/A"}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={5} className="px-6 py-4 text-center">{t?.history_no_data || "No history found"}</td></tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-10 text-center text-gray-500">{t?.history_login_req || "Please log in to view history."}</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginHistory;

