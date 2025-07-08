export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <div className="max-w-md w-full mx-auto p-6">
                <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Hello World!</h1>
                    <p className="text-gray-600 mb-6">Your Next.js app is working correctly.</p>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-800 font-medium">✅ Setup Complete</p>
                        <p className="text-xs text-green-600">Ready to build web3 features</p>
                    </div>
                </div>
            </div>
        </div>
    )
} 