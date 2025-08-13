import AppShell from '@/components/app-shell';
import Link from 'next/link';
import { Phone, MapPin, Clock, Mail, ArrowLeft } from 'lucide-react';

export default function ContactHumanPage() {
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact a Human Representative</h1>
          <p className="text-lg text-gray-600">
            We&apos;re here to help! You can reach a SNAP benefits specialist through any of the following methods:
          </p>
        </div>

        {/* Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Phone */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Phone className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Call Us</h2>
                <p className="text-2xl font-bold text-blue-600 mb-2">1-800-555-SNAP</p>
                <p className="text-sm text-gray-600">
                  (1-800-555-7627)
                </p>
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Monday-Friday, 8:00 AM - 5:00 PM EST</span>
                </div>
              </div>
            </div>
          </div>

          {/* Visit Office */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start gap-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <MapPin className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Visit an Office</h2>
                <p className="text-gray-700 mb-3">
                  Find your nearest office for in-person assistance
                </p>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Find Office Locations
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </a>
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start gap-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Mail className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Email Support</h2>
                <p className="text-gray-700 mb-3">
                  Send us your questions and we&apos;ll respond within 1-2 business days
                </p>
                <a
                  href="mailto:hhhs@state.fake.gov"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  Send Email
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Schedule Callback */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start gap-4">
              <div className="bg-amber-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Schedule a Callback</h2>
                <p className="text-gray-700 mb-3">
                  Request a callback at a time that works for you
                </p>
                <button
                  disabled
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed text-sm font-medium"
                >
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">What to Have Ready</h3>
          <p className="text-blue-800 mb-3">
            When contacting us, please have the following information available:
          </p>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Your case number (if you have one)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Social Security numbers for household members</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Proof of income for the last 30 days</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Rent or mortgage information</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Utility bills</span>
            </li>
          </ul>
        </div>

        {/* Alternative Options */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">Changed your mind?</p>
          <Link
            href="/interview"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Try AI Interview Again
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </Link>
        </div>
      </div>
    </AppShell>
  );
}