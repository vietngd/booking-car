import React, { useEffect, useState } from "react";
import { supabase } from "../../app/supabase";
import { Loader2, Pencil, Upload,Users } from "lucide-react";
import type { Role } from "../../types";
import { Table, type Column } from "../../components/common/table/Table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import { PageHeader } from "../../components/common/PageHeader";
import { SearchInput } from "../../components/common/SearchInput";

interface UserProfile {
  id: string;
  email: string;
  role: Role;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}

const ROLE_LABELS: Record<Role, string> = {
  staff: "Nhân viên",
  manager_viet: "Sếp Việt (Duyệt)",
  manager_korea: "Sếp Hàn (Duyệt)",
  admin: "Hành chính (Admin)",
};

const ROLE_COLORS: Record<Role, string> = {
  admin: "bg-violet-100 text-violet-700 border-violet-200",
  manager_viet: "bg-blue-100 text-blue-700 border-blue-200",
  manager_korea: "bg-indigo-100 text-indigo-700 border-indigo-200",
  staff: "bg-slate-100 text-slate-700 border-slate-200",
};

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      setEditingName(selectedUser.full_name || "");
      setPreviewUrl(selectedUser.avatar_url || null);
      setAvatarFile(null);
    }
  }, [selectedUser]);

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
        .update({ role: newRole })
        .eq("id", userId);
      if (error) throw error;
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    try {
      setUploading(true);
      let avatarUrl = selectedUser.avatar_url;

      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `${selectedUser.id}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, avatarFile);
        if (uploadError) throw uploadError;
        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(fileName);
        avatarUrl = publicUrl;
      }

      const { error } = await supabase
        .from("users")
        .update({ full_name: editingName, avatar_url: avatarUrl })
        .eq("id", selectedUser.id);
      if (error) throw error;

      setUsers(
        users.map((u) =>
          u.id === selectedUser.id
            ? { ...u, full_name: editingName, avatar_url: avatarUrl }
            : u,
        ),
      );
      setIsDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      console.error("Error updating user:", error);
      alert("Lỗi cập nhật: " + (error.message || "Vui lòng thử lại"));
    } finally {
      setUploading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const columns: Column<UserProfile>[] = [
    {
      header: "Người dùng",
      cell: (user) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 ring-2 ring-white shadow-sm">
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white text-sm font-semibold">
              {user.full_name
                ? user.full_name[0].toUpperCase()
                : user.email[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 text-sm">
              {user.full_name || "Chưa cập nhật tên"}
            </span>
            <span className="text-xs text-slate-500">{user.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Vai trò hiện tại",
      cell: (user) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${ROLE_COLORS[user.role] || "bg-slate-100 text-slate-700 border-slate-200"}`}
        >
          {ROLE_LABELS[user.role] || user.role}
        </span>
      ),
    },
    {
      header: "Ngày tham gia",
      cell: (user) => (
        <span className="text-sm text-slate-500">
          {new Date(user.created_at).toLocaleDateString("vi-VN")}
        </span>
      ),
    },
    {
      header: "Cập nhật vai trò",
      cell: (user) => (
        <div className="flex items-center gap-2">
          {updating === user.id ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          ) : (
            <select
              value={user.role || "staff"}
              onChange={(e) =>
                handleRoleChange(user.id, e.target.value as Role)
              }
              className="text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent py-1.5 pl-2.5 pr-7 bg-white shadow-sm transition-all"
            >
              <option value="staff">Nhân viên</option>
              <option value="manager_viet">Sếp Việt</option>
              <option value="manager_korea">Sếp Hàn</option>
              <option value="admin">Admin</option>
            </select>
          )}
        </div>
      ),
    },
    {
      header: "Hành động",
      className: "text-right",
      cell: (user) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedUser(user);
              setIsDialogOpen(true);
            }}
            title="Chỉnh sửa thông tin"
            className="hover:bg-blue-50 hover:text-blue-600"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Quản lý nhân sự"
        description="Phân quyền và quản lý thông tin người dùng trong hệ thống"
        icon={<Users className="h-6 w-6" />}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(
          [
            {
              label: "Tổng người dùng",
              count: users.length,
              color: "bg-slate-100 text-slate-700",
            },
            {
              label: "Admin",
              count: users.filter((u) => u.role === "admin").length,
              color: "bg-violet-100 text-violet-700",
            },
            {
              label: "Quản lý",
              count: users.filter(
                (u) => u.role === "manager_viet" || u.role === "manager_korea",
              ).length,
              color: "bg-blue-100 text-blue-700",
            },
            {
              label: "Nhân viên",
              count: users.filter((u) => u.role === "staff").length,
              color: "bg-emerald-100 text-emerald-700",
            },
          ] as const
        ).map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
          >
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {item.label}
            </p>
            <p className={`text-2xl font-bold ${item.color.split(" ")[1]}`}>
              {item.count}
            </p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Tìm kiếm theo email hoặc tên..."
          className="max-w-sm"
        />
        <span className="text-sm text-slate-500">
          {filteredUsers.length} / {users.length} người dùng
        </span>
      </div>

      <Table
        data={filteredUsers}
        columns={columns}
        loading={loading}
        emptyMessage="Không tìm thấy người dùng nào"
      />

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin người dùng</DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="h-24 w-24 ring-4 ring-blue-100 shadow-lg">
                  <AvatarImage src={previewUrl || ""} />
                  <AvatarFallback className="text-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold">
                    {editingName
                      ? editingName[0].toUpperCase()
                      : selectedUser?.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="avatar-upload"
                  className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-blue-600 shadow flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  <Upload className="h-3.5 w-3.5 text-white" />
                </label>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              <p className="text-xs text-slate-500">
                Nhấn vào icon để đổi ảnh đại diện
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-sm font-semibold">
                Họ và tên
              </Label>
              <Input
                id="name"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                placeholder="Nhập họ tên..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-sm font-semibold">
                Email{" "}
                <span className="text-slate-400 font-normal">
                  (không thể thay đổi)
                </span>
              </Label>
              <Input
                id="email"
                value={selectedUser?.email || ""}
                disabled
                className="bg-slate-50 text-slate-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSaveUser} disabled={uploading}>
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
