const PrivacyAgreement: React.FC = () => {
  return (
    <div className="relative overflow-hidden relative bg-white">
      <div className="max-w-[85rem] min-h-[40rem] mx-auto px-4 sm:px-6 lg:px-8 text-left">
        <div className="text-white">
          <div className="space-y-4 text-gray-800 dark:text-white">
            <div className="max-w-4xl mx-auto py-12 px-6">
              <h1 className="text-3xl font-bold mb-6">Calera</h1>
              <h2 className="text-2xl font-semibold mb-4">
                User Agreement
              </h2>
              <p className="mb-8">
                Effective Date: <span className="font-medium">2025-03-24</span>
              </p>
              <hr className="mb-8" />

              <div className="space-y-8">
                {/* 1. Introduction */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">1. Introduction</h3>
                  <p>
                    This User Agreement ("Agreement") is a legal contract between <strong>Calera</strong> ("we," "us," or "our") and you, the user ("you" or "your"). By accessing or using our services at <strong>calera.io</strong>, you agree to be bound by this Agreement.
                  </p>
                </div>

                {/* 2. Services */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">2. Services</h3>
                  <p>
                    Calera is a digital productivity assistant that helps you set personal goals and schedule them intelligently using AI. The service includes automated planning, behavior-based insights, and productivity recommendations.
                  </p>
                </div>

                {/* 3. Acceptance of Terms */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">3. Acceptance of Terms</h3>
                  <p>
                    By signing up, creating an account, or using any part of the Calera platform, you confirm that you have read, understood, and agree to this Agreement. We may update these terms occasionally, and continued use means you accept the latest version.
                  </p>
                </div>

                {/* 4. Privacy and Data Use */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">4. Privacy and Data Use</h3>
                  <ul className="list-disc pl-5 space-y-2 mt-4">
                    <li><strong>Data Collection</strong>: We collect only the personal and usage data required to operate and improve our scheduling features.</li>
                    <li><strong>Google User Data</strong>: With your explicit consent, we access your Google Calendar availability using the <code>free/busy</code> scope. This data is used solely to provide smart, conflict-free scheduling suggestions and personalized goal planning. We do not access calendar event details.                    </li>
                    <li><strong>Data Use</strong>: Data is used for scheduling optimization, goal tracking, and anonymous product development insights.</li>
                    <li><strong>Data Sharing</strong>: We do not sell your personal data. Data may be shared with service providers strictly for functionality and legal compliance.</li>
                    <li><strong>Data Storage</strong>: All data is securely stored within the EU and processed in accordance with the General Data Protection Regulation (GDPR).</li>
                    <li><strong>AI and Machine Learning</strong>: Calera does not use your personal data to develop, train, or improve generalized AI or machine learning models.</li>

                  </ul>
                </div>

                {/* 5. User Responsibilities */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">5. User Responsibilities</h3>
                  <p>
                    You agree to provide accurate information and use Calera in a responsible manner. You are responsible for the security of your account credentials.
                  </p>
                </div>

                {/* 6. Prohibited Conduct */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">6. Prohibited Conduct</h3>
                  <ul className="list-disc pl-5 space-y-2 mt-4">
                    <li>Submitting false or misleading data.</li>
                    <li>Accessing or using the service for malicious purposes.</li>
                    <li>Violating any applicable law or regulation.</li>
                    <li>Attempting to reverse-engineer or disrupt the platform.</li>
                  </ul>
                </div>

                {/* 7. Intellectual Property */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">7. Intellectual Property</h3>
                  <p>
                    All content, software, and branding on Calera are the intellectual property of Calera or its licensors. You may not use, copy, or redistribute any part without prior written consent.
                  </p>
                </div>

                {/* 8. License to User Content */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">8. License to User Content</h3>
                  <p>
                    By entering personal goals or preferences into Calera, you grant us a limited license to process and analyze this information for scheduling, personalization, and product improvement.
                  </p>
                </div>

                {/* 9. Termination */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">9. Termination</h3>
                  <p>
                    We may suspend or terminate your access if you violate these terms or misuse the platform. You may delete your account at any time.
                  </p>
                </div>

                {/* 10. Disclaimers */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">10. Disclaimers</h3>
                  <p>
                    Calera is provided "as is." We do not guarantee goal achievement, uninterrupted access, or error-free operation. Use is at your own risk.
                  </p>
                </div>

                {/* 11. Limitation of Liability */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">11. Limitation of Liability</h3>
                  <p>
                    To the extent permitted by law, Calera shall not be liable for indirect, incidental, or consequential damages resulting from your use of the service.
                  </p>
                </div>

                {/* 12. Amendments */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">12. Amendments</h3>
                  <p>
                    We may revise this Agreement periodically. You will be notified via email or in-app notices. Continued use constitutes acceptance of the new terms.
                  </p>
                </div>

                {/* 13. Data Protection Rights */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">13. Data Protection Rights</h3>
                  <p>
                    Under GDPR, you have the right to access, correct, or delete your data. For requests, contact us at:
                    <a href="mailto:privacy@calera.io" className="text-blue-600 hover:underline"> privacy@calera.io</a>
                  </p>
                </div>

                {/* 14. Governing Law */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">14. Governing Law</h3>
                  <p>
                    This Agreement is governed by the laws of the European Union. Disputes will be handled by courts located within the EU jurisdiction.
                  </p>
                </div>

                {/* 15. Contact Information */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">15. Contact Information</h3>
                  <p>
                    For any questions or issues related to this Agreement or our service, reach out to:
                  </p>
                  <p className="mt-4">
                    <strong>Calera</strong>
                    <br />
                    <a href="mailto:contact@calera.io" className="text-blue-600 hover:underline">
                      contact@calera.io
                    </a>
                  </p>
                </div>
              </div>

              <hr className="my-8" />
              <p className="mt-8">
                <strong>By using Calera, you acknowledge that you have read, understood, and agree to this Agreement.</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
};

export default PrivacyAgreement;
