import React, { useEffect, useState } from "react";
import { supabase } from "../../app/supabase";
import { Loader2, User, Search } from "lucide-react";
import type { Role } from "../../types";

interface UserProfile {
  id: string;
  email: string;
  role: Role;
  full_name?: string;
  created_at: string;
}

const ROLE_LABELS: Record<Role, string> = {
  staff: "Nhân viên",
  manager_viet: "Sếp Việt (Duyệt)",
  manager_korea: "Sếp Hàn (Duyệt)",
  admin: "Hành chính (Admin)",
};

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      setUpdating(userId);

      const { error } = await supabase
        .from("users")
        .update({
          role: newRole,
        })
        .eq("id", userId);

      if (error) throw error;

      // Update local state
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Không thể cập nhật vai trò. Vui lòng thử lại.");
    } finally {
      setUpdating(null);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý nhân sự</h1>
          <p className="text-slate-500">
            Phân quyền và quản lý vai trò người dùng
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="input-field pl-10"
            placeholder="Tìm kiếm theo email hoặc tên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Người dùng
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Vai trò
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                  Thay đổi vai trò
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    Không tìm thấy người dùng nào
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                          <User className="h-5 w-5" />
                        </div>
                        <span className="font-medium text-slate-900">
                          {user.full_name || "Chưa cập nhật tên"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600">{user.email}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                          user.role === "admin"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : user.role === "staff"
                              ? "bg-slate-100 text-slate-700 border-slate-200"
                              : "bg-blue-50 text-blue-700 border-blue-200" // Managers
                        }`}
                      >
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {updating === user.id ? (
                        <span className="inline-flex items-center text-slate-400 text-sm">
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          Đang xử lý...
                        </span>
                      ) : (
                        <select
                          value={user.role || "staff"}
                          onChange={(e) =>
                            handleRoleChange(user.id, e.target.value as Role)
                          }
                          className="text-sm border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 py-1.5 pl-2 pr-8 shadow-sm"
                        >
                          <option value="staff">Nhân viên</option>
                          <option value="manager_viet">Sếp Việt</option>
                          <option value="manager_korea">Sếp Hàn</option>
                          <option value="admin">Hành chính (Admin)</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
