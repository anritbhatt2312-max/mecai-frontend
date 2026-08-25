{/* Sidebar.jsx */}
<div className="sidebar flex flex-col justify-between bg-[#1F1F1F] w-64 h-screen p-4">
  {/* Top menu items */}
  <div className="menu flex flex-col gap-6">
    <div className="menu-item hover:bg-[#333333] p-2 rounded">Dashboard</div>
    <div className="menu-item hover:bg-[#333333] p-2 rounded">Projects</div>
    <div className="menu-item hover:bg-[#333333] p-2 rounded">Settings</div>
  </div>

  {/* Bottom profile icon */}
  <div className="profile mb-4 flex items-center gap-3">
    <img src="/profile.png" alt="Profile" className="w-10 h-10 rounded-full" />
    <span className="text-white">Anrit Bhatt</span>
  </div>
</div>