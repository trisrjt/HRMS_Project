import { useState, useEffect } from "react";
import api, { STORAGE_URL } from "../../api/axios";

const ProfilePage = () => {
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Using /user to get the authenticated user's details
                // This typically returns { id, name, email, role_id, employee: {...}, ... }
                const { data } = await api.get("/user");
                setProfile(data);
            } catch (err) {
                setError("Failed to load profile.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const maskAadhar = (aadhar) => {
        if (!aadhar) return "N/A";
        return aadhar.replace(/\d{8}(\d{4})/, "XXXX-XXXX-$1");
    };

    const getProfilePhotoUrl = (path) => {
        if (!path) return null;
        // Adjust base URL as needed, assuming localhost:8000 for backend storage
        return `${STORAGE_URL}/${path}`;
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 transition-colors">
                <div className="text-xl font-medium animate-pulse">Loading Profile...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900 text-red-500 dark:text-red-400 transition-colors">
                <div className="text-lg">{error}</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-[1200px] mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">My Profile</h1>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-center mb-10 pb-8 border-b border-gray-100 dark:border-gray-700">
                    <div className="w-28 h-28 rounded-full overflow-hidden mr-0 md:mr-8 mb-6 md:mb-0 bg-blue-500 flex items-center justify-center border-4 border-blue-50 dark:border-blue-900/30 ring-2 ring-white dark:ring-gray-700">
                        {profile?.employee?.profile_photo ? (
                            <img
                                src={getProfilePhotoUrl(profile.employee.profile_photo)}
                                alt={profile.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                            />
                        ) : (
                            <div className="text-white text-4xl font-bold">
                                {profile?.name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="text-center md:text-left">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{profile?.name}</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">{profile?.email}</p>
                        <div className="mt-3 flex gap-2 justify-center md:justify-start flex-wrap">
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-sm font-medium">
                                {profile?.role || "Employee"}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${profile?.employee?.status === 'Inactive'
                                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                                }`}>
                                {profile?.employee?.status || "Active"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
                    {/* Personal Info */}
                    <div>
                        <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Personal Information</h3>
                        <div className="space-y-5">
                            <div>
                                <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Employee Code</label>
                                <div className="font-medium text-gray-800 dark:text-gray-200">{profile?.employee?.employee_code || "N/A"}</div>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Date of Birth</label>
                                <div className="font-medium text-gray-800 dark:text-gray-200">{formatDate(profile?.employee?.dob)}</div>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Gender</label>
                                <div className="font-medium text-gray-800 dark:text-gray-200">{profile?.employee?.gender || "N/A"}</div>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Marital Status</label>
                                <div className="font-medium text-gray-800 dark:text-gray-200">{profile?.employee?.marital_status || "N/A"}</div>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Phone</label>
                                <div className="font-medium text-gray-800 dark:text-gray-200">{profile?.employee?.phone || "N/A"}</div>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Emergency Contact</label>
                                <div className="font-medium text-gray-800 dark:text-gray-200">{profile?.employee?.emergency_contact || "N/A"}</div>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Current Address</label>
                                <div className="font-medium text-gray-800 dark:text-gray-200 leading-relaxed">{profile?.employee?.address || "N/A"}</div>
                            </div>
                        </div>
                    </div>

                    {/* Work Info */}
                    <div>
                        <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Work & Identity</h3>
                        <div className="space-y-5">
                            <div>
                                <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Department</label>
                                <div className="font-medium text-gray-800 dark:text-gray-200">{profile?.employee?.department?.name || "N/A"}</div>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Designation</label>
                                <div className="font-medium text-gray-800 dark:text-gray-200">{profile?.employee?.designation?.name || "N/A"}</div>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Date of Joining</label>
                                <div className="font-medium text-gray-800 dark:text-gray-200">{formatDate(profile?.employee?.date_of_joining)}</div>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Joining Category</label>
                                <div className="font-medium text-gray-800 dark:text-gray-200">{profile?.employee?.joining_category || "N/A"}</div>
                            </div>

                            {profile?.employee?.joining_category === "New Joinee" && profile?.employee?.probation_months > 0 && (
                                <>
                                    <div>
                                        <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Probation Period</label>
                                        <div className="font-medium text-gray-800 dark:text-gray-200">{profile.employee.probation_months} Months</div>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Probation Ends On</label>
                                        <div className="font-medium text-amber-600 dark:text-amber-400">
                                            {(() => {
                                                const doj = new Date(profile.employee.date_of_joining);
                                                doj.setMonth(doj.getMonth() + parseInt(profile.employee.probation_months));
                                                return formatDate(doj);
                                            })()}
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="mt-8 pt-6 border-t border-dashed border-gray-200 dark:border-gray-700">
                                <div className="mb-5">
                                    <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Aadhar Number</label>
                                    <div className="font-medium text-gray-800 dark:text-gray-200 font-mono tracking-wide">
                                        {maskAadhar(profile?.employee?.aadhar_number)}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">PAN Number</label>
                                    <div className="font-medium text-gray-800 dark:text-gray-200 font-mono tracking-wide">
                                        {profile?.employee?.pan_number || "N/A"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
