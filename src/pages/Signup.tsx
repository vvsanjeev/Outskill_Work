import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Signup() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
          <p className="text-gray-600 mb-8">Sign up to get started</p>

          <div className="text-center text-gray-500 py-12">
            Signup page - Coming soon
          </div>
        </div>
      </div>
    </div>
  );
}
