import { useState, useEffect } from "react";
import api from "../../api/axios";

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data } = await api.get("/announcements");
        setAnnouncements(data);
      } catch (err) {
        setError("Failed to load announcements.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  if (isLoading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading Announcements...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <h1 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white">Announcements</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {announcements.length > 0 ? (
          announcements.map((announcement) => (
            <div key={announcement.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col transition-colors duration-200">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {announcement.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 flex-grow leading-relaxed">
                {announcement.message || announcement.description}
              </p>

              <div className="border-t border-gray-100 dark:border-gray-700 pt-3 text-xs text-gray-500 dark:text-gray-400">
                Posted on {new Date(announcement.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-8">
            No announcements available.
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsPage;
