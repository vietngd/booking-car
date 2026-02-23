import React, { useEffect, useState } from "react";
import { supabase } from "../../app/supabase";
import type { MasterData } from "../../types";
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  LayoutList,
  Building,
  Package,
  Weight,
} from "lucide-react";
import { useConfirm } from "../../components/common/ConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { Table, type Column } from "../../components/common/table/Table";
import { PageHeader } from "../../components/common/PageHeader";

type MasterDataType = "department" | "cargo_type" | "cargo_weight";

const tabs: { id: MasterDataType; label: string; icon: React.ReactNode }[] = [
  {
    id: "department",
    label: "Phòng ban / Bộ phận",
    icon: <Building className="h-4 w-4" />,
  },
  {
    id: "cargo_type",
    label: "Loại hàng hóa",
    icon: <Package className="h-4 w-4" />,
  },
  {
    id: "cargo_weight",
    label: "Trọng lượng",
    icon: <Weight className="h-4 w-4" />,
  },
];

export const MasterDataPage: React.FC = () => {
  const [data, setData] = useState<MasterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<MasterDataType>("department");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterData | null>(null);
  const { confirm: showConfirm } = useConfirm();
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("master_data")
        .select("*")
        .eq("type", activeTab)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setData(data || []);
    } catch (err: any) {
      console.error("Error fetching master data:", err);
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item: MasterData) => {
    const confirmed = await showConfirm({
      title: "Xác nhận xóa",
      description: `Bạn có chắc chắn muốn xóa "${item.label}"?`,
      confirmText: "Xóa",
      cancelText: "Hủy",
    });

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("master_data")
        .delete()
        .eq("id", item.id);
      if (error) throw error;
      toast({ title: "Thành công", description: "Đã xóa dữ liệu" });
      fetchData();
    } catch (err) {
      console.error("Error deleting item:", err);
      toast({
        title: "Lỗi",
        description: "Không thể xóa dữ liệu",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: MasterData) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingItem(null);
    fetchData();
  };

  const columns: Column<MasterData>[] = [
    {
      header: "Tên hiển thị",
      cell: (item) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center flex-none">
            <span className="text-blue-600 font-bold text-xs">
              {item.label[0]?.toUpperCase()}
            </span>
          </div>
          <span className="font-semibold text-slate-900 text-sm">
            {item.label}
          </span>
        </div>
      ),
    },
    {
      header: "Giá trị",
      cell: (item) => (
        <code className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-mono">
          {item.value}
        </code>
      ),
    },
    {
      header: "Thứ tự",
      cell: (item) => (
        <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center">
          <span className="text-xs font-bold text-slate-500">
            {item.sort_order}
          </span>
        </div>
      ),
    },
    {
      header: "Trạng thái",
      cell: (item) =>
        item.is_active ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="h-3 w-3" />
            Hoạt động
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-500 border border-slate-200">
            <XCircle className="h-3 w-3" />
            Ẩn
          </span>
        ),
    },
    {
      header: "Thao tác",
      className: "text-right",
      cell: (item: MasterData) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(item);
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(item);
            }}
            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Quản lý Danh mục"
        description="Quản lý các dữ liệu danh mục dùng chung trong hệ thống"
        icon={<LayoutList className="h-6 w-6" />}
        action={
          <button
            onClick={handleAdd}
            className="btn-primary inline-flex items-center gap-2 shadow-lg shadow-blue-200"
          >
            <Plus className="h-4 w-4" />
            Thêm mới
          </button>
        }
      />

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-1.5 inline-flex w-full">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-all ${
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <Table
        data={data}
        columns={columns}
        loading={loading}
        emptyMessage="Chưa có dữ liệu danh mục. Nhấn 'Thêm mới' để bắt đầu."
      />

      {showForm && (
        <MasterDataFormModal
          item={editingItem}
          type={activeTab}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};

const MasterDataFormModal: React.FC<{
  item: MasterData | null;
  type: MasterDataType;
  onClose: () => void;
}> = ({ item, type, onClose }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    label: item?.label || "",
    value: item?.value || "",
    description: item?.description || "",
    sort_order: item?.sort_order || 0,
    is_active: item?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const dataToSave = {
        ...formData,
        type: type,
        value: formData.value || formData.label,
        updated_at: new Date().toISOString(),
      };

      if (item) {
        const { error } = await supabase
          .from("master_data")
          .update(dataToSave)
          .eq("id", item.id);
        if (error) throw error;
        toast({ title: "Thành công", description: "Đã cập nhật dữ liệu" });
      } else {
        const { error } = await supabase.from("master_data").insert(dataToSave);
        if (error) throw error;
        toast({ title: "Thành công", description: "Đã thêm dữ liệu mới" });
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Lỗi",
        description: err.message || "Có lỗi xảy ra",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getTypeName = (t: string) => {
    switch (t) {
      case "department":
        return "Phòng ban";
      case "cargo_type":
        return "Loại hàng hóa";
      case "cargo_weight":
        return "Trọng lượng";
      default:
        return "Danh mục";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
          <h2 className="text-lg font-bold text-white">
            {item ? `Sửa ${getTypeName(type)}` : `Thêm ${getTypeName(type)}`}
          </h2>
          <p className="text-blue-200 text-sm mt-0.5">
            Điền đầy đủ thông tin bên dưới
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Tên hiển thị <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="input-field"
              value={formData.label}
              onChange={(e) =>
                setFormData({ ...formData, label: e.target.value })
              }
              placeholder="VD: Kho, 500kg..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Giá trị{" "}
              <span className="text-slate-400 font-normal">(tùy chọn)</span>
            </label>
            <input
              type="text"
              className="input-field"
              value={formData.value}
              onChange={(e) =>
                setFormData({ ...formData, value: e.target.value })
              }
              placeholder="Để trống sẽ tự lấy theo tên hiển thị"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Thứ tự sắp xếp
            </label>
            <input
              type="number"
              className="input-field"
              value={formData.sort_order}
              onChange={(e) =>
                setFormData({ ...formData, sort_order: Number(e.target.value) })
              }
            />
          </div>
          <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <p className="text-sm font-semibold text-slate-700">
                Đang hoạt động
              </p>
              <p className="text-xs text-slate-500">
                Hiển thị trong danh sách lựa chọn
              </p>
            </div>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={saving}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={saving}
            >
              {saving ? "Đang lưu..." : item ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
