import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Music, 
  FileText, 
  Settings, 
  Calendar,
  Award,
  Bell,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';

interface Application {
  id: number;
  user: string;
  activation: number;
  status: string;
  created_at: string;
  program?: {
    act_title: string;
    act_location?: string;
  };
}

interface DashboardStats {
  totalApplications: number;
  activeApplications: number;
  approvedApplications: number;
}

const Dashboard: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    activeApplications: 0,
    approvedApplications: 0
  });
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Debug logging
  useEffect(() => {
    console.log('Dashboard auth state:', { user: !!user, profile: !!profile, loading });
  }, [user, profile, loading]);

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading || isLoadingData) {
        console.warn('Dashboard loading timeout reached, forcing completion');
        setIsLoadingData(false);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [loading, isLoadingData]);

  // Fetch user applications and stats
  useEffect(() => {
    if (user) {
      console.log('Fetching applications for user:', user.id);
      fetchApplications();
    } else if (!loading) {
      // If not loading and no user, set loading to false
      console.log('No user and not loading, setting data loading to false');
      setIsLoadingData(false);
    }
  }, [user, loading]);

  const fetchApplications = async () => {
    try {
      setIsLoadingData(true);
      
      // For now, we'll simulate some data or gracefully handle missing tables
      // Try to fetch user applications with program details
      const { data: applicationsData, error } = await supabase
        .from('piano_applications')
        .select(`
          id,
          user,
          activation,
          status,
          created_at,
          piano_activations (
            act_title,
            act_location
          )
        `)
        .eq('user', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Applications table not available or error fetching:', error);
        // Set empty state instead of failing
        setApplications([]);
        setStats({
          totalApplications: 0,
          activeApplications: 0,
          approvedApplications: 0
        });
      } else {
        const enrichedApplications = applicationsData?.map(app => ({
          ...app,
          program: app.piano_activations ? {
            act_title: app.piano_activations.act_title,
            act_location: app.piano_activations.act_location
          } : undefined
        })) || [];

        setApplications(enrichedApplications);

        // Calculate stats
        const totalApplications = enrichedApplications.length;
        const activeApplications = enrichedApplications.filter(app => 
          app.status === 'pending' || app.status === 'in_review'
        ).length;
        const approvedApplications = enrichedApplications.filter(app => 
          app.status === 'approved'
        ).length;

        setStats({
          totalApplications,
          activeApplications,
          approvedApplications
        });
      }
    } catch (error) {
      console.warn('Error fetching applications, using empty state:', error);
      // Fallback to empty state instead of remaining in loading
      setApplications([]);
      setStats({
        totalApplications: 0,
        activeApplications: 0,
        approvedApplications: 0
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_review':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading || isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!loading && !user) {
    window.location.href = '/auth/login?redirect=/dashboard';
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile?.first_name || user?.email?.split('@')[0]}!
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your Sing for Hope applications and account.
          </p>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Applications</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active Applications</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeApplications}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approvedApplications}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Applications List */}
        <div className="lg:col-span-2">
          <motion.div
            className="bg-white rounded-lg shadow-sm border border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
                <a
                  href="/dashboard/applications"
                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  View all
                </a>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {applications.length === 0 ? (
                <div className="p-12 text-center">
                  <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No applications yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Start by applying for a piano program or partnership opportunity.
                  </p>
                  <a
                    href="/pianos/apply"
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Apply Now
                  </a>
                </div>
              ) : (
                applications.slice(0, 5).map((application, index) => (
                  <motion.div
                    key={application.id}
                    className="p-6 hover:bg-gray-50 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 mb-1">
                          {application.program?.act_title || `Application #${application.id}`}
                        </h3>
                        {application.program?.act_location && (
                          <p className="text-xs text-gray-500 mb-2">
                            {application.program.act_location}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          Submitted on {formatDate(application.created_at)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                        {application.status}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <motion.div
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <a
                href="/pianos/apply"
                className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Music className="w-5 h-5 text-green-600 mr-3" />
                <span className="text-sm font-medium text-gray-900">Apply for Program</span>
              </a>
              
              <a
                href="/dashboard/profile"
                className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <User className="w-5 h-5 text-blue-600 mr-3" />
                <span className="text-sm font-medium text-gray-900">Update Profile</span>
              </a>
              
              <a
                href="/contact"
                className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Bell className="w-5 h-5 text-purple-600 mr-3" />
                <span className="text-sm font-medium text-gray-900">Contact Support</span>
              </a>
            </div>
          </motion.div>

          {/* Profile Summary */}
          <motion.div
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile</h3>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || 'User'}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  (profile?.first_name?.[0] || user?.email?.[0] || 'U').toUpperCase()
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {profile?.full_name || user?.email?.split('@')[0]}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              <p>Member since {formatDate(user?.created_at || new Date().toISOString())}</p>
              {profile?.role && (
                <p className="mt-1">Role: <span className="capitalize">{profile.role}</span></p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;