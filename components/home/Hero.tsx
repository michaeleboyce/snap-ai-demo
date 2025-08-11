import Link from 'next/link';
import { ArrowRight, Mic } from 'lucide-react';

export default function Hero() {
  return (
    <section className="text-center py-16">
      <h1 className="text-5xl font-bold text-gray-900 mb-6">
        AI-Powered SNAP Interviews
      </h1>
      <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
        Transforming benefit enrollment with conversational AI that reduces interview time 
        from 45 to 10 minutes while improving accuracy and accessibility
      </p>

      <div className="flex gap-4 justify-center mb-12">
        <Link
          href="/interview"
          className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Mic className="w-5 h-5" />
          Try Voice Interview Demo
          <ArrowRight className="w-5 h-5" />
        </Link>
        <Link
          href="/interview?mode=text"
          className="bg-gray-100 text-gray-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
        >
          Text Interview Option
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <span className="sr-only">Time Saved</span>
          <div className="w-8 h-8 text-blue-600 mb-2 mx-auto flex items-center justify-center">
            <span className="text-xl">⏱️</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">75%</div>
          <div className="text-sm text-gray-600">Time Saved</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="w-8 h-8 text-green-600 mb-2 mx-auto flex items-center justify-center">
            <span className="text-xl">✅</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">95%</div>
          <div className="text-sm text-gray-600">Error Detection</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="w-8 h-8 text-purple-600 mb-2 mx-auto flex items-center justify-center">
            <span className="text-xl">👥</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">85%</div>
          <div className="text-sm text-gray-600">Completion Rate</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="w-8 h-8 text-orange-600 mb-2 mx-auto flex items-center justify-center">
            <span className="text-xl">🌐</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">2</div>
          <div className="text-sm text-gray-600">Languages</div>
        </div>
      </div>
    </section>
  );
}


