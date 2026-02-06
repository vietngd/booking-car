import React, { useEffect, useState } from "react";
import { supabase } from "../../app/supabase";
import type { MasterData } from "../../types";
import { Plus, Edit2, Trash2, CheckCircle, XCircle } from "lucide-react";
import { useConfirm } from "../../components/common/ConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { Table, type Column } from "../../components/common/table/Table";

type MasterDataType = "department" | "cargo_type" | "cargo_weight";

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

      toast({
        title: "Thành công",
        description: "Đã xóa dữ liệu",
      });
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
      header: "Tên hiển thị (Label)",
      accessorKey: "label",
      className: "font-medium text-slate-900",
    },
    {
      header: "Giá trị (Value)",
      accessorKey: "value",
    },
    {
      header: "Thứ tự",
      accessorKey: "sort_order",
    },
    {
      header: "Trạng thái",
      accessorKey: "is_active",
      cell: (item) =>
        item.is_active ? (
          <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
            <CheckCircle className="h-3 w-3" />
            Hoạt động
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-slate-400 text-xs font-medium">
            <XCircle className="h-3 w-3" />
            Ẩn
          </span>
        ),
    },
    {
      header: "Thao tác",
      className: "text-right",
      cell: (item: MasterData) => (
        <div className="flex items-center justify-end gap-2">
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
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const tabs: { id: MasterDataType; label: string }[] = [
    { id: "department", label: "Phòng ban / Bộ phận" },
    { id: "cargo_type", label: "Loại hàng hóa" },
    { id: "cargo_weight", label: "Trọng lượng" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Quản lý Danh mục
          </h1>
          <p className="text-slate-500">
            Quản lý các dữ liệu danh mục dùng chung
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="btn-primary inline-flex items-center gap-2 shadow-lg shadow-blue-200"
        >
          <Plus className="h-5 w-5" />
          Thêm mới
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-1">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === tab.id
                  ? "bg-blue-50 text-blue-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <Table
        data={data}
        columns={columns}
        loading={loading}
        emptyMessage="Chưa có dữ liệu danh mục"
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
        value: formData.value || formData.label, // Default value to label if empty
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 rounded-t-2xl">
          <h2 className="text-xl font-bold text-slate-900">
            {item ? `Sửa ${getTypeName(type)}` : `Thêm ${getTypeName(type)}`}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tên hiển thị (Label) <span className="text-red-500">*</span>
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
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Giá trị (Value) (Tùy chọn)
            </label>
            <input
              type="text"
              className="input-field"
              value={formData.value}
              onChange={(e) =>
                setFormData({ ...formData, value: e.target.value })
              }
              placeholder="Để trống sẽ tự động lấy theo Label"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
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
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="is_active"
              className="text-sm font-medium text-slate-700"
            >
              Đang hoạt động
            </label>
          </div>

          <div className="flex gap-3 pt-4">
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
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
