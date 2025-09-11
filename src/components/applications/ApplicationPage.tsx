import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Music, 
  User, 
  FileText, 
  Upload,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import AuthModal from '../auth/AuthModal';

interface Program {
  id: number;
  act_title: string;
  act_location?: string;
  status: string;
  description?: string;
}

interface ApplicationPageProps {
  programId?: string | null;
}

interface ApplicationData {
  programId: number;
  artistStatement: string;
  experience: string;
  portfolio?: File;
  additionalNotes?: string;
}

const ApplicationPage: React.FC<ApplicationPageProps> = ({ programId }) => {
  const { user, profile, loading } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [applicationData, setApplicationData] = useState<ApplicationData>({
    programId: 0,
    artistStatement: '',
    experience: '',
    additionalNotes: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch available programs
  useEffect(() => {
    fetchPrograms();
  }, []);

  // Set selected program from URL parameter
  useEffect(() => {
    if (programId && programs.length > 0) {
      const program = programs.find(p => p.id.toString() === programId);
      if (program) {
        setSelectedProgram(program);
        setApplicationData(prev => ({ ...prev, programId: program.id }));
      }
    }
  }, [programId, programs]);

  const fetchPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('piano_activations')
        .select('id, act_title, act_location, status')
        .eq('status', 'Active')
        .order('act_title');

      if (error) {
        console.error('Error fetching programs:', error);
      } else {
        setPrograms(data || []);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setApplicationData(prev => ({
      ...prev,
      [name]: name === 'programId' ? parseInt(value) : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setApplicationData(prev => ({
        ...prev,
        portfolio: file
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!applicationData.programId || !applicationData.artistStatement || !applicationData.experience) {
      setErrorMessage('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Submit application to database
      const { data, error } = await supabase
        .from('piano_applications')
        .insert({
          user: user.id,
          activation: applicationData.programId,
          status: 'pending',
          artist_statement: applicationData.artistStatement,
          experience: applicationData.experience,
          additional_notes: applicationData.additionalNotes,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // TODO: Handle portfolio file upload to storage if needed
      if (applicationData.portfolio) {
        // Upload portfolio file to Supabase storage
        const fileExt = applicationData.portfolio.name.split('.').pop();
        const fileName = `${user.id}/${data.id}/portfolio.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('applications')
          .upload(fileName, applicationData.portfolio);

        if (uploadError) {
          console.error('Portfolio upload error:', uploadError);
        } else {
          // Update application with portfolio URL
          await supabase
            .from('piano_applications')
            .update({
              portfolio_url: fileName
            })
            .eq('id', data.id);
        }
      }

      setSubmitStatus('success');
      
      // Send confirmation email (would be handled by a serverless function in production)
      // For now, just log the success
      console.log('Application submitted successfully:', data);

    } catch (error) {
      console.error('Application submission error:', error);
      setSubmitStatus('error');
      setErrorMessage('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToPrograms = () => {
    setSelectedProgram(null);
    setApplicationData({
      programId: 0,
      artistStatement: '',
      experience: '',
      additionalNotes: ''
    });
    setSubmitStatus('idle');
    setErrorMessage('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application form...</p>
        </div>
      </div>
    );
  }

  if (submitStatus === 'success') {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          className="bg-white rounded-2xl shadow-lg p-8 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Application Submitted Successfully!
          </h1>
          <p className="text-gray-600 mb-8">
            Thank you for your interest in {selectedProgram?.act_title}. 
            We'll review your application and get back to you within 5-7 business days.
          </p>
          
          <div className="space-y-4">
            <a
              href="/dashboard/applications"
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              View My Applications
            </a>
            <div>
              <button
                onClick={handleBackToPrograms}
                className="text-green-600 hover:text-green-700 transition-colors"
              >
                Apply to Another Program
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          {selectedProgram && (
            <button
              onClick={handleBackToPrograms}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-3xl font-bold text-gray-900">
            {selectedProgram ? `Apply for ${selectedProgram.act_title}` : 'Choose a Program'}
          </h1>
        </div>
        
        {selectedProgram && selectedProgram.act_location && (
          <p className="text-gray-600 mb-4">{selectedProgram.act_location}</p>
        )}
      </div>

      {/* Program Selection */}
      {!selectedProgram && (
        <motion.div
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Available Programs</h2>
            <p className="text-gray-600">Choose a program to apply for</p>
          </div>

          <div className="divide-y divide-gray-200">
            {programs.length === 0 ? (
              <div className="p-12 text-center">
                <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Active Programs
                </h3>
                <p className="text-gray-600">
                  There are currently no active programs accepting applications. 
                  Check back soon for new opportunities!
                </p>
              </div>
            ) : (
              programs.map((program) => (
                <motion.button
                  key={program.id}
                  onClick={() => {
                    setSelectedProgram(program);
                    setApplicationData(prev => ({ ...prev, programId: program.id }));
                  }}
                  className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {program.act_title}
                      </h3>
                      {program.act_location && (
                        <p className="text-sm text-gray-600 mb-2">
                          {program.act_location}
                        </p>
                      )}
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {program.status}
                      </span>
                    </div>
                    <Music className="w-6 h-6 text-gray-400" />
                  </div>
                </motion.button>
              ))
            )}
          </div>
        </motion.div>
      )}

      {/* Application Form */}
      {selectedProgram && (
        <motion.div
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Application Form</h2>
            <p className="text-gray-600">Tell us about yourself and your artistic vision</p>
          </div>

          {errorMessage && (
            <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Artist Statement */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Artist Statement *
              </label>
              <textarea
                name="artistStatement"
                value={applicationData.artistStatement}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-vertical"
                placeholder="Tell us about your artistic vision, style, and what draws you to participate in Sing for Hope programs..."
                required
              />
            </div>

            {/* Experience */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Relevant Experience *
              </label>
              <textarea
                name="experience"
                value={applicationData.experience}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-vertical"
                placeholder="Describe your experience with public art, community engagement, or relevant artistic projects..."
                required
              />
            </div>

            {/* Portfolio Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Portfolio (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="portfolio-upload"
                />
                <label
                  htmlFor="portfolio-upload"
                  className="cursor-pointer text-green-600 hover:text-green-700 font-medium"
                >
                  Click to upload portfolio
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, JPG, PNG, DOC up to 10MB
                </p>
                {applicationData.portfolio && (
                  <p className="text-sm text-gray-700 mt-2">
                    Selected: {applicationData.portfolio.name}
                  </p>
                )}
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Additional Notes
              </label>
              <textarea
                name="additionalNotes"
                value={applicationData.additionalNotes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-vertical"
                placeholder="Any additional information you'd like to share..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                * Required fields
              </p>
              
              <button
                type="submit"
                disabled={isSubmitting || !user}
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : !user ? (
                  'Sign In to Apply'
                ) : (
                  'Submit Application'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode="register"
      />
    </div>
  );
};

export default ApplicationPage;