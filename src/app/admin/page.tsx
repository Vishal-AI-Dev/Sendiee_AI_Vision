export default function AdminDashboard() {
  return (
    <div className="flex h-screen items-center justify-center bg-green-50">
      <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">🎉 Login Successful!</h1>
        <p className="text-gray-600 text-lg">
          Welcome to the protected Admin Dashboard. You made it past the lock!
        </p>
      </div>
    </div>
  );
}