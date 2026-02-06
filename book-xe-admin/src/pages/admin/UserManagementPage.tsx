import React, { useEffect, useState } from "react";
import { supabase } from "../../app/supabase";
import { Loader2, Pencil, Upload, User as UserIcon } from "lucide-react";
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
        .update({
          role: newRole,
        })
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
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile);

        if (uploadError) {
          // If bucket doesn't exist, this will fail.
          // Ideally we should catch this and inform user, but for now throwing.
          throw uploadError;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(filePath);

        avatarUrl = publicUrl;
      }

      const { error } = await supabase
        .from("users")
        .update({
          full_name: editingName,
          avatar_url: avatarUrl,
        })
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
          <Avatar>
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback className="bg-slate-100">
              {user.full_name ? (
                user.full_name[0].toUpperCase()
              ) : (
                <UserIcon className="h-4 w-4" />
              )}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-slate-900">
              {user.full_name || "Chưa cập nhật tên"}
            </span>
            <span className="text-xs text-slate-500">{user.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Vai trò",
      cell: (user) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
            user.role === "admin"
              ? "bg-purple-50 text-purple-700 border-purple-200"
              : user.role === "manager_viet" || user.role === "manager_korea"
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-slate-100 text-slate-700 border-slate-200"
          }`}
        >
          {ROLE_LABELS[user.role] || user.role}
        </span>
      ),
    },
    {
      header: "Cập nhật vai trò",
      cell: (user) => (
        <div className="flex items-center gap-2">
          {updating === user.id ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          ) : (
            <select
              value={user.role || "staff"}
              onChange={(e) =>
                handleRoleChange(user.id, e.target.value as Role)
              }
              className="text-xs border-slate-200 rounded-md focus:ring-blue-500 focus:border-blue-500 py-1 pl-2 pr-6 shadow-sm"
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
          >
            <Pencil className="h-4 w-4 text-slate-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý nhân sự</h1>
          <p className="text-slate-500">
            Phân quyền và quản lý thông tin người dùng
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm max-w-md">
        <Input
          placeholder="Tìm kiếm theo email hoặc tên..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Table
        data={filteredUsers}
        columns={columns}
        loading={loading}
        emptyMessage="Không tìm thấy người dùng nào"
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin cá nhân</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={previewUrl || ""} />
                <AvatarFallback className="text-lg bg-slate-100">
                  {editingName ? (
                    editingName[0].toUpperCase()
                  ) : (
                    <UserIcon className="h-8 w-8" />
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2">
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Label
                  htmlFor="avatar-upload"
                  className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Tải ảnh lên
                </Label>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Họ và tên</Label>
              <Input
                id="name"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                placeholder="Nhập họ tên..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
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
