import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import AuthModal from './AuthModal';

interface AuthPageProps {
  mode: 'login' | 'register';
  error?: string | null;
  redirect?: string | null;
}

const AuthPage: React.FC<AuthPageProps> = ({ mode, error, redirect }) => {
  const [showModal, setShowModal] = useState(true);

  useEffect(() => {
    // Show modal on page load
    setShowModal(true);
  }, []);

  const handleModalClose = () => {
    // Redirect to home when modal is closed
    window.location.href = '/';
  };

  const getErrorMessage = (errorCode: string | null) => {
    if (!errorCode) return null;
    
    switch (errorCode) {
      case 'auth_callback_error':
        return 'There was an error with the authentication callback. Please try again.';
      case 'access_denied':
        return 'Access denied. You need appropriate permissions to view that page.';
      case 'session_expired':
        return 'Your session has expired. Please sign in again.';
      default:
        return 'An authentication error occurred. Please try again.';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Sing for Hope
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-md mx-auto mt-8 px-4">
          <motion.div
            className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Authentication Error</h3>
              <p className="text-sm text-red-700 mt-1">
                {getErrorMessage(error)}
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full">
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img 
              src="/logo.svg" 
              alt="Sing for Hope" 
              className="h-12 mx-auto mb-6"
            />
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {mode === 'login' ? 'Welcome Back' : 'Join Our Community'}
            </h1>
            
            <p className="text-gray-600">
              {mode === 'login' 
                ? 'Sign in to access your dashboard and applications'
                : 'Create an account to apply for programs and connect with artists'
              }
            </p>

            {redirect && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  You'll be redirected after signing {mode === 'login' ? 'in' : 'up'}.
                </p>
              </div>
            )}
          </motion.div>

          {/* Benefits */}
          <motion.div
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {mode === 'login' ? 'Welcome back!' : 'Why join Sing for Hope?'}
            </h2>
            
            <div className="space-y-3">
              {[
                'Apply for piano programs and artist opportunities',
                'Track your application status and history',
                'Access exclusive artist resources and community',
                'Get notified about new programs and events',
                'Connect with other artists and collaborators'
              ].map((benefit, index) => (
                <div key={index} className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <p className="text-sm text-gray-600">
              Ready to get started? Click the button above to {mode === 'login' ? 'sign in' : 'create your account'}.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showModal}
        onClose={handleModalClose}
        defaultMode={mode}
      />
    </div>
  );
};

export default AuthPage;