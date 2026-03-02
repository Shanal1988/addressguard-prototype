import React, { useState } from 'react';
import { Search, Shield, AlertTriangle, CheckCircle, XCircle, Building2, Home, Landmark, Users, Clock, MapPin, ChevronRight, Loader2 } from 'lucide-react';

// Simulated UK address database for demo (in production, this would be Royal Mail PAF API)
const KNOWN_ADDRESSES = {
  'SW1A 1AA': [
    { address: 'Buckingham Palace, London SW1A 1AA', type: 'government', risk: 'critical' },
  ],
  'SW1A 2AA': [
    { address: '10 Downing Street, London SW1A 2AA', type: 'government', risk: 'critical' },
  ],
  'EC2R 8AH': [
    { address: 'Bank of England, Threadneedle St, London EC2R 8AH', type: 'government', risk: 'high' },
  ],
  'E1 6AN': [
    { address: 'Flat 1, 42 Commercial Road, London E1 6AN', type: 'residential', risk: 'low' },
    { address: 'Flat 2, 42 Commercial Road, London E1 6AN', type: 'residential', risk: 'low' },
    { address: 'Flat 3, 42 Commercial Road, London E1 6AN', type: 'residential', risk: 'low' },
    { address: '44 Commercial Road, London E1 6AN', type: 'commercial', risk: 'medium' },
  ],
  'M1 1AE': [
    { address: '15 Portland Street, Manchester M1 1AE', type: 'residential', risk: 'low' },
    { address: '17 Portland Street, Manchester M1 1AE', type: 'residential', risk: 'low' },
  ],
  'B1 1AA': [
    { address: 'Unit 5, The Mailbox, Birmingham B1 1AA', type: 'commercial', risk: 'medium' },
  ],
};

// Implausible address patterns
const IMPLAUSIBLE_PATTERNS = [
  'buckingham palace',
  'downing street',
  '10 downing',
  'houses of parliament',
  'windsor castle',
  'bank of england',
  'hm treasury',
  'ministry of',
];

function App() {
  const [view, setView] = useState('onboarding'); // 'onboarding' or 'dashboard'
  const [postcode, setPostcode] = useState('');
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [verificationResult, setVerificationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [applicantName, setApplicantName] = useState('');
  const [showAddressSelect, setShowAddressSelect] = useState(false);

  // Demo queue for dashboard
  const [reviewQueue] = useState([
    { id: 1, name: 'James Wilson', address: '10 Downing Street, London SW1A 2AA', score: 5, reason: 'Government building', status: 'pending', time: '2 mins ago' },
    { id: 2, name: 'Sarah Chen', address: 'Buckingham Palace, London SW1A 1AA', score: 3, reason: 'Royal residence', status: 'pending', time: '5 mins ago' },
    { id: 3, name: 'Ahmed Hassan', address: 'Unit 5, The Mailbox, Birmingham B1 1AA', score: 45, reason: 'Commercial address', status: 'pending', time: '12 mins ago' },
  ]);

  const lookupPostcode = async () => {
    setIsLoading(true);
    setShowAddressSelect(false);
    setSelectedAddress(null);
    setVerificationResult(null);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const normalizedPostcode = postcode.toUpperCase().replace(/\s+/g, ' ').trim();
    const foundAddresses = KNOWN_ADDRESSES[normalizedPostcode] || [];

    if (foundAddresses.length === 0) {
      // Generate some fake addresses for demo
      setAddresses([
        { address: `${Math.floor(Math.random() * 100) + 1} Sample Street, ${normalizedPostcode}`, type: 'residential', risk: 'low' },
        { address: `${Math.floor(Math.random() * 100) + 1} Sample Street, ${normalizedPostcode}`, type: 'residential', risk: 'low' },
      ]);
    } else {
      setAddresses(foundAddresses);
    }

    setShowAddressSelect(true);
    setIsLoading(false);
  };

  const verifyAddress = async (address) => {
    setSelectedAddress(address);
    setIsVerifying(true);

    // Extract postcode from the selected address (last postcode-looking token)
    const postcodeMatch = address.address.match(/[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i);
    const postcodeToCheck = postcodeMatch ? postcodeMatch[0].toUpperCase().replace(/\s+/g, '') : null;

    let externalVerification = {
      valid: null,
      error: null,
      provider: 'api.postcodes.io',
    };

    if (postcodeToCheck) {
      try {
        const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcodeToCheck)}`);
        const data = await response.json();

        if (data.status === 200 && data.result) {
          externalVerification = {
            valid: true,
            error: null,
            provider: 'api.postcodes.io',
            result: data.result,
          };
        } else {
          externalVerification = {
            valid: false,
            error: data.error || 'Postcode not found in official database',
            provider: 'api.postcodes.io',
          };
        }
      } catch (err) {
        externalVerification = {
          valid: null,
          error: 'Network error contacting postcode verification service',
          provider: 'api.postcodes.io',
        };
      }
    } else {
      externalVerification = {
        valid: false,
        error: 'No valid UK postcode detected in address string',
        provider: 'client-side',
      };
    }

    // Simulate AI verification delay on top of real API call
    await new Promise(resolve => setTimeout(resolve, 800));

    const addressLower = address.address.toLowerCase();
    const isImplausible = IMPLAUSIBLE_PATTERNS.some(pattern => addressLower.includes(pattern));

    let score, status, reasons, recommendation;
    const postcodeInvalid = externalVerification.valid === false;

    if (postcodeInvalid) {
      score = Math.floor(Math.random() * 10) + 1; // 1-10
      status = 'blocked';
      reasons = [
        'Postcode could not be validated against official UK postcode database (api.postcodes.io)',
        externalVerification.error || 'Postcode appears to be invalid or non-existent',
        'Applicant-provided address may not correspond to a real UK delivery point',
      ];
      if (isImplausible || address.risk === 'critical') {
        reasons.push('Address is also in internal implausible/government address list');
      }
      recommendation = 'Block application. Request alternative proof of address or additional documentation.';
    } else if (isImplausible || address.risk === 'critical') {
      score = Math.floor(Math.random() * 10) + 1; // 1-10
      status = 'blocked';
      reasons = [
        'Address identified as government/institutional building',
        'No residential occupancy records found',
        'Address flagged in implausible address database',
        'Zero electoral roll registrations at this address',
      ];
      if (externalVerification.valid === true) {
        reasons.push('Postcode exists, but address type is inconsistent with residential onboarding');
      }
      recommendation = 'Block application. Escalate to compliance team for manual review.';
    } else if (address.type === 'commercial' || address.risk === 'medium') {
      score = Math.floor(Math.random() * 30) + 40; // 40-70
      status = 'review';
      reasons = [
        'Address classified as commercial property',
        'Limited residential indicators',
        'Requires proof of address documentation',
      ];
      if (externalVerification.valid === true) {
        reasons.push('Postcode verified against official UK postcode database (api.postcodes.io)');
      }
      recommendation = 'Request enhanced verification: utility bill or bank statement required.';
    } else {
      score = Math.floor(Math.random() * 15) + 85; // 85-100
      status = 'approved';
      reasons = [
        'Address verified against Royal Mail PAF',
        'Residential property classification confirmed',
        'Electoral roll match found',
        'No adverse indicators detected',
      ];
      if (externalVerification.valid === true) {
        reasons.unshift('Postcode successfully validated via api.postcodes.io (official UK postcode registry)');
      }
      recommendation = 'Proceed with onboarding.';
    }

    setVerificationResult({
      score,
      status,
      reasons,
      recommendation,
      addressType: address.type,
      timestamp: new Date().toISOString(),
      externalVerification,
    });

    setIsVerifying(false);
  };

  const resetOnboarding = () => {
    setPostcode('');
    setAddresses([]);
    setSelectedAddress(null);
    setVerificationResult(null);
    setShowAddressSelect(false);
    setApplicantName('');
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 40) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-emerald-500/20 border-emerald-500/30';
    if (score >= 40) return 'bg-amber-500/20 border-amber-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-6 h-6 text-emerald-400" />;
      case 'review': return <AlertTriangle className="w-6 h-6 text-amber-400" />;
      case 'blocked': return <XCircle className="w-6 h-6 text-red-400" />;
      default: return null;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'residential': return <Home className="w-4 h-4" />;
      case 'commercial': return <Building2 className="w-4 h-4" />;
      case 'government': return <Landmark className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">AddressGuard</h1>
                <p className="text-xs text-slate-500">AI-Enhanced KYC Verification</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setView('onboarding'); resetOnboarding(); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  view === 'onboarding'
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Onboarding Flow
              </button>
              <button
                onClick={() => setView('dashboard')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  view === 'dashboard'
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Compliance Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      {view === 'onboarding' ? (
        /* Onboarding Flow */
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">Open Your Account</h2>
            <p className="text-slate-400">Verify your address to continue</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-4 mb-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-sm font-bold">1</div>
              <span className="text-sm text-slate-300">Identity</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                verificationResult ? 'bg-cyan-500' : 'bg-slate-700 text-slate-400'
              }`}>2</div>
              <span className={`text-sm ${verificationResult ? 'text-slate-300' : 'text-slate-500'}`}>Address</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-400">3</div>
              <span className="text-sm text-slate-500">Complete</span>
            </div>
          </div>

          {!verificationResult ? (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8">
              {/* Name input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                <input
                  type="text"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                />
              </div>

              {/* Postcode input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">Postcode</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                    placeholder="e.g., SW1A 1AA"
                    className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-mono"
                    onKeyDown={(e) => e.key === 'Enter' && postcode && lookupPostcode()}
                  />
                  <button
                    onClick={lookupPostcode}
                    disabled={!postcode || isLoading}
                    className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl font-medium transition-all flex items-center gap-2"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                    Find
                  </button>
                </div>
              </div>

              {/* Demo postcodes hint */}
              <div className="mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <p className="text-xs text-slate-500 mb-2">Demo postcodes to try:</p>
                <div className="flex flex-wrap gap-2">
                  {['SW1A 1AA', 'SW1A 2AA', 'E1 6AN', 'M1 1AE', 'B1 1AA'].map((code) => (
                    <button
                      key={code}
                      onClick={() => setPostcode(code)}
                      className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-mono text-slate-300 transition-all"
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>

              {/* Address selection */}
              {showAddressSelect && addresses.length > 0 && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-300">Select your address</label>
                  {addresses.map((addr, idx) => (
                    <button
                      key={idx}
                      onClick={() => verifyAddress(addr)}
                      disabled={isVerifying}
                      className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-4 ${
                        selectedAddress === addr
                          ? 'bg-cyan-500/10 border-cyan-500/50'
                          : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        addr.type === 'residential' ? 'bg-emerald-500/20 text-emerald-400' :
                        addr.type === 'commercial' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {getTypeIcon(addr.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{addr.address}</p>
                        <p className="text-xs text-slate-500 capitalize">{addr.type} property</p>
                      </div>
                      {isVerifying && selectedAddress === addr && (
                        <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Verification Result */
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              {/* Result header */}
              <div className={`p-6 ${
                verificationResult.status === 'approved' ? 'bg-emerald-500/10' :
                verificationResult.status === 'review' ? 'bg-amber-500/10' :
                'bg-red-500/10'
              }`}>
                <div className="flex items-center gap-4">
                  {getStatusIcon(verificationResult.status)}
                  <div>
                    <h3 className="text-xl font-bold capitalize">
                      {verificationResult.status === 'approved' ? 'Address Verified' :
                       verificationResult.status === 'review' ? 'Additional Verification Required' :
                       'Verification Failed'}
                    </h3>
                    <p className="text-sm text-slate-400">{selectedAddress.address}</p>
                  </div>
                </div>
              </div>

              {/* Score */}
              <div className="p-6 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Plausibility Score</p>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-5xl font-bold ${getScoreColor(verificationResult.score)}`}>
                        {verificationResult.score}
                      </span>
                      <span className="text-slate-500">/100</span>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-xl border ${getScoreBg(verificationResult.score)}`}>
                    <span className={`text-sm font-medium ${getScoreColor(verificationResult.score)}`}>
                      {verificationResult.score >= 80 ? 'Low Risk' :
                       verificationResult.score >= 40 ? 'Medium Risk' : 'High Risk'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Analysis */}
              <div className="p-6 border-b border-slate-800">
                <h4 className="text-sm font-medium text-slate-300 mb-3">AI Analysis</h4>
                <ul className="space-y-2">
                  {verificationResult.reasons.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-400">
                      <div className={`w-1.5 h-1.5 rounded-full mt-2 ${
                        verificationResult.status === 'approved' ? 'bg-emerald-400' :
                        verificationResult.status === 'review' ? 'bg-amber-400' : 'bg-red-400'
                      }`} />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendation */}
              <div className="p-6">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Recommendation</h4>
                <p className="text-slate-400 text-sm">{verificationResult.recommendation}</p>
              </div>

              {/* Actions */}
              <div className="p-6 bg-slate-800/50 flex gap-3">
                <button
                  onClick={resetOnboarding}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-medium transition-all"
                >
                  Try Another Address
                </button>
                {verificationResult.status === 'approved' && (
                  <button className="flex-1 px-4 py-3 bg-cyan-500 hover:bg-cyan-400 rounded-xl font-medium transition-all">
                    Continue to Next Step
                  </button>
                )}
                {verificationResult.status === 'review' && (
                  <button className="flex-1 px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl font-medium transition-all">
                    Upload Proof of Address
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Compliance Dashboard */
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Verifications', value: '12,847', change: '+12%', icon: Shield },
              { label: 'Auto-Approved', value: '94.2%', change: '+2.1%', icon: CheckCircle },
              { label: 'Pending Review', value: '23', change: '-8', icon: Clock },
              { label: 'Blocked Today', value: '7', change: '+3', icon: XCircle },
            ].map((stat, idx) => (
              <div key={idx} className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                <div className="flex items-center justify-between mb-3">
                  <stat.icon className="w-5 h-5 text-slate-500" />
                  <span className={`text-xs font-medium ${
                    stat.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'
                  }`}>{stat.change}</span>
                </div>
                <p className="text-2xl font-bold mb-1">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Review Queue */}
          <div className="bg-slate-900 rounded-xl border border-slate-800">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-slate-400" />
                <h3 className="font-semibold">Manual Review Queue</h3>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-xs font-medium">
                  {reviewQueue.length} pending
                </span>
              </div>
              <button className="text-sm text-cyan-400 hover:text-cyan-300">View all</button>
            </div>
            <div className="divide-y divide-slate-800">
              {reviewQueue.map((item) => (
                <div key={item.id} className="p-5 hover:bg-slate-800/50 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                      item.score < 20 ? 'bg-red-500/20 text-red-400' :
                      item.score < 50 ? 'bg-amber-500/20 text-amber-400' :
                      'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {item.score}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{item.name}</p>
                        <span className="text-xs text-slate-500">{item.time}</span>
                      </div>
                      <p className="text-sm text-slate-400">{item.address}</p>
                      <p className="text-xs text-red-400 mt-1">{item.reason}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium transition-all">
                        Approve
                      </button>
                      <button className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-sm font-medium transition-all">
                        Request Docs
                      </button>
                      <button className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-all">
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-6 bg-slate-900 rounded-xl border border-slate-800 p-5">
            <h3 className="font-semibold mb-4">Implausible Address Detection Log</h3>
            <div className="space-y-3">
              {[
                { address: '10 Downing Street, London SW1A 2AA', reason: 'Government building - Prime Minister residence', time: '2 mins ago' },
                { address: 'Buckingham Palace, London SW1A 1AA', reason: 'Royal residence - no residential registrations', time: '5 mins ago' },
                { address: 'Bank of England, London EC2R 8AH', reason: 'Financial institution - commercial property', time: '18 mins ago' },
              ].map((log, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{log.address}</p>
                    <p className="text-xs text-red-400">{log.reason}</p>
                  </div>
                  <span className="text-xs text-slate-500 flex-shrink-0">{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-slate-500">
          <p>AddressGuard Prototype | AI-Enhanced KYC & Address Verification</p>
          <p className="mt-1">Portfolio Demo by Shanal Agrawal | Based on FCA Enforcement Analysis</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
