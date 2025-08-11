import { CheckCircle } from 'lucide-react';

export default function Features() {
  return (
    <section className="py-16 bg-gray-50 rounded-lg px-8">
      <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
        Connecticut DSS Innovation
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div className="flex gap-4">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold mb-1">Structured QA-Style Interviews</h3>
            <p className="text-gray-600 text-sm">
              Follows proven Quality Assurance methodologies for consistency
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold mb-1">Real-time Discrepancy Detection</h3>
            <p className="text-gray-600 text-sm">
              Identifies missing or conflicting information immediately
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold mb-1">Human-in-the-Loop</h3>
            <p className="text-gray-600 text-sm">
              Staff retain full authority over eligibility determinations
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold mb-1">Multi-Language Support</h3>
            <p className="text-gray-600 text-sm">
              Available in English and Spanish for better accessibility
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}


