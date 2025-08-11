export default function HowItWorks() {
  return (
    <section className="py-16">
      <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
        How It Works
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <div className="text-center">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-blue-600">1</span>
          </div>
          <h3 className="font-semibold text-lg mb-2">Start Interview</h3>
          <p className="text-gray-600">
            Choose voice or text mode. AI guides you through structured questions following QA best practices.
          </p>
        </div>
        <div className="text-center">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-blue-600">2</span>
          </div>
          <h3 className="font-semibold text-lg mb-2">AI Processing</h3>
          <p className="text-gray-600">
            GPT-5 analyzes responses, flags inconsistencies, and generates a comprehensive summary.
          </p>
        </div>
        <div className="text-center">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-blue-600">3</span>
          </div>
          <h3 className="font-semibold text-lg mb-2">Staff Review</h3>
          <p className="text-gray-600">
            Merit workers review AI-generated summaries and maintain full decision-making authority.
          </p>
        </div>
      </div>
    </section>
  );
}


