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

  if (isLoading) return <div style={{ padding: "2rem", textAlign: "center" }}>Loading Announcements...</div>;
  if (error) return <div style={{ padding: "2rem", textAlign: "center", color: "red" }}>{error}</div>;

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "2rem" }}>Announcements</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
        {announcements.length > 0 ? (
          announcements.map((announcement) => (
            <div key={announcement.id} style={{
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              border: "1px solid #e5e7eb",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column"
            }}>
              <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#1f2937", marginBottom: "0.5rem" }}>
                {announcement.title}
              </h3>
              <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "1rem", flexGrow: 1, lineHeight: "1.5" }}>
                {announcement.message || announcement.description}
              </p>

              <div style={{
                borderTop: "1px solid #f3f4f6",
                paddingTop: "0.75rem",
                fontSize: "12px",
                color: "#9ca3af"
              }}>
                Posted on {new Date(announcement.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </div>
            </div>
          ))
        ) : (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", color: "#6b7280", padding: "2rem" }}>
            No announcements available.
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsPage;
