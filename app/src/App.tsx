import React, { useState } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { Shield, Users, TrendingUp, Lock } from 'lucide-react';
import { SalaryForm } from './components/SalaryForm';
import { BenchmarkResults } from './components/BenchmarkResults';
import { ConfidentialBenchClient } from './utils/web3';
import { SalarySubmission, BenchmarkResult } from './types';

function App() {
  const { connected } = useWallet();
  const [step, setStep] = useState<'form' | 'results'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<BenchmarkResult | null>(null);
  const [submissions, setSubmissions] = useState<{
    company1?: SalarySubmission;
    company2?: SalarySubmission;
    company3?: SalarySubmission;
  }>({});

  const client = new ConfidentialBenchClient();

  const handleCompanySubmission = async (companyKey: keyof typeof submissions, submission: SalarySubmission) => {
    setSubmissions(prev => ({ ...prev, [companyKey]: submission }));

    // Check if all companies have submitted
    const updatedSubmissions = { ...submissions, [companyKey]: submission };
    if (updatedSubmissions.company1 && updatedSubmissions.company2 && updatedSubmissions.company3) {
      setIsLoading(true);
      try {
        const benchmarkResult = await client.submitBenchmark(
          updatedSubmissions.company1,
          updatedSubmissions.company2,
          updatedSubmissions.company3
        );
        setResults(benchmarkResult);
        setStep('results');
      } catch (error) {
        console.error('Benchmark computation failed:', error);
        alert('Benchmark computation failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const resetDemo = () => {
    setStep('form');
    setResults(null);
    setSubmissions({});
    setIsLoading(false);
  };

  if (step === 'results' && results) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary-600" />
                <h1 className="text-2xl font-bold text-gray-900">ConfidentialBench</h1>
              </div>
              <button
                onClick={resetDemo}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                New Benchmark
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BenchmarkResults result={results} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">ConfidentialBench</h1>
            </div>
            <WalletMultiButton />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="gradient-bg text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Private Salary Benchmarking
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            Compare compensation across companies while keeping individual data encrypted
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <Lock className="h-12 w-12 mx-auto mb-4 text-blue-200" />
              <h3 className="text-lg font-semibold mb-2">Fully Private</h3>
              <p className="text-blue-100">Individual salaries never exposed using MPC technology</p>
            </div>
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-blue-200" />
              <h3 className="text-lg font-semibold mb-2">Multi-Company</h3>
              <p className="text-blue-100">Benchmark against multiple organizations securely</p>
            </div>
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-blue-200" />
              <h3 className="text-lg font-semibold mb-2">Real-time Results</h3>
              <p className="text-blue-100">Get accurate market insights instantly</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!connected ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Connect Your Wallet to Continue
            </h2>
            <p className="text-gray-600 mb-8">
              A Solana wallet is required to participate in the private computation
            </p>
            <WalletMultiButton />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Submit Company Salary Data
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Each company submits their salary data privately. The system will compute 
                benchmarks without revealing individual compensation information.
              </p>
            </div>

            {/* Progress Indicator */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center space-x-4">
                {['Company A', 'Company B', 'Company C'].map((company, index) => {
                  const companyKey = `company${index + 1}` as keyof typeof submissions;
                  const isCompleted = !!submissions[companyKey];
                  const isCurrent = !isCompleted && Object.keys(submissions).length === index;
                  
                  return (
                    <div key={company} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        isCompleted 
                          ? 'bg-green-500 text-white' 
                          : isCurrent 
                            ? 'bg-primary-500 text-white' 
                            : 'bg-gray-200 text-gray-500'
                      }`}>
                        {isCompleted ? '✓' : index + 1}
                      </div>
                      <span className={`ml-2 text-sm ${
                        isCompleted ? 'text-green-600' : isCurrent ? 'text-primary-600' : 'text-gray-500'
                      }`}>
                        {company}
                      </span>
                      {index < 2 && <div className="w-8 h-px bg-gray-300 mx-4" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Forms */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {!submissions.company1 && (
                <SalaryForm
                  companyName="Company A"
                  onSubmit={(submission) => handleCompanySubmission('company1', submission)}
                  isLoading={isLoading}
                />
              )}
              
              {submissions.company1 && !submissions.company2 && (
                <SalaryForm
                  companyName="Company B"
                  onSubmit={(submission) => handleCompanySubmission('company2', submission)}
                  isLoading={isLoading}
                />
              )}
              
              {submissions.company1 && submissions.company2 && !submissions.company3 && (
                <SalaryForm
                  companyName="Company C"
                  onSubmit={(submission) => handleCompanySubmission('company3', submission)}
                  isLoading={isLoading}
                />
              )}
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-12">
                <div className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary-700 bg-primary-100">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Computing private salary benchmarks...
                </div>
                <p className="mt-4 text-gray-600">
                  Processing encrypted data using Multi-Party Computation
                </p>
              </div>
            )}

            {/* Completed Submissions Summary */}
            {Object.keys(submissions).length > 0 && !isLoading && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Submission Status
                </h3>
                <div className="space-y-3">
                  {Object.entries(submissions).map(([key, submission]) => {
                    const companyName = key === 'company1' ? 'Company A' : 
                                      key === 'company2' ? 'Company B' : 'Company C';
                    return (
                      <div key={key} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="font-medium text-green-800">
                          {companyName} ✓
                        </span>
                        <span className="text-sm text-green-600">
                          {submission.entryCount} entries submitted
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;