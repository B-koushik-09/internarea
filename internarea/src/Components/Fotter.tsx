import { Facebook, Twitter, Instagram } from "lucide-react";
import { useSelector } from "react-redux";
import { selectLanguage } from "@/Feature/LanguageSlice";
import { translations } from "@/utils/translations";

export default function Footer() {
  const currentLanguage = useSelector(selectLanguage);
  const t = { ...translations["English"], ...((translations as any)[currentLanguage] || {}) };

  // Use translations for lists if they exist, else fallback
  const placesList = t?.footer_places_list || ["New York", "Los Angeles", "Chicago", "San Francisco", "Miami", "Seattle"];
  const streamsList = t?.footer_streams_list || ["About us", "Careers", "Press", "News", "Media kit", "Contact"];
  const jobPlacesList = t?.footer_job_places_list || ["Blog", "Newsletter", "Events", "Help center", "Tutorials", "Supports"];
  const jobStreamsList = t?.footer_job_streams_list || ["Startups", "Enterprise", "Government", "SaaS", "Marketplaces", "Ecommerce"];

  const aboutList = t?.footer_about_list || ["Startups", "Enterprise"];
  const teamList = t?.footer_team_list || ["Startups", "Enterprise"];
  const termsList = t?.footer_terms_list || ["Startups", "Enterprise"];
  const sitemapList = t?.footer_sitemap_list || ["Startups"];

  return (
    <footer className="bg-gray-800 text-white py-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          <FooterSection title={t?.footer_places || "Internship by places"} items={placesList} />
          <FooterSection title={t?.footer_streams || "Internship by stream"} items={streamsList} />
          <FooterSection title={t?.footer_job_places || "Job Places"} items={jobPlacesList} links />
          <FooterSection title={t?.footer_job_streams || "Jobs by streams"} items={jobStreamsList} links />
        </div>

        <hr className="my-10 border-gray-600" />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          <FooterSection title={t?.footer_about || "About us"} items={aboutList} links />
          <FooterSection title={t?.footer_team || "Team diary"} items={teamList} links />
          <FooterSection title={t?.footer_terms || "Terms and conditions"} items={termsList} links />
          <FooterSection title={t?.footer_sitemap || "Sitemap"} items={sitemapList} links />
        </div>

        <div className="mt-10 flex flex-col sm:flex-row justify-between items-center">
          <p className="flex items-center gap-2 border border-white px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-700">
            <i className="bi bi-google-play"></i> Get Android App
          </p>
          <div className="flex space-x-4 mt-4 sm:mt-0">
            <Facebook className="w-6 h-6 hover:text-blue-400 cursor-pointer" />
            <Twitter className="w-6 h-6 hover:text-blue-400 cursor-pointer" />
            <Instagram className="w-6 h-6 hover:text-pink-400 cursor-pointer" />
          </div>
          <p className="mt-4 sm:mt-0 text-sm text-gray-400">{t?.footer_rights || "© Copyright 2025. All Rights Reserved."}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterSection({ title, items, links }: any) {
  return (
    <div>
      <h3 className="text-sm font-bold text-gray-300">{title}</h3>
      <div className="flex flex-col items-start mt-4 space-y-3">
        {items.map((item: any, index: any) =>
          links ? (
            <a key={index} href="/" className="text-gray-400 hover:text-blue-400 hover:underline">
              {item}
            </a>
          ) : (
            <p key={index} className="text-gray-400 hover:text-blue-400 hover:underline cursor-pointer">
              {item}
            </p>
          )
        )}
      </div>
    </div>
  );
}
