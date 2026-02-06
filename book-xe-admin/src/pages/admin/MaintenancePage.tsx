import React, { useEffect, useState } from "react";
import { useAuth } from "../../app/auth-context";
import { supabase } from "../../app/supabase";
import type { MaintenanceRecord, Vehicle } from "../../types";
import { Edit2, Trash2, Calendar, Car, Plus } from "lucide-react";
import { useConfirm } from "../../components/common/ConfirmDialog";
import { useToast } from "@/hooks/use-toast";

import { Table, type Column } from "../../components/common/table/Table";

export const MaintenancePage: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(
    null,
  );
  const { confirm: showConfirm } = useConfirm();
  const { toast } = useToast();

  const isAdmin = user?.role === "admin" || user?.role?.includes("manager");

  useEffect(() => {
    fetchRecords();
    fetchVehicles();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("maintenance_records")
        .select("*, vehicle:vehicles(license_plate, vehicle_name)")
        .order("service_date", { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (err: any) {
      console.error("Error fetching maintenance records:", err);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách bảo trì",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    const { data } = await supabase
      .from("vehicles")
      .select("id, license_plate, vehicle_name");
    setVehicles((data as unknown as Vehicle[]) || []);
  };

  const handleDelete = async (record: MaintenanceRecord) => {
    const confirmed = await showConfirm({
      title: "Xác nhận xóa",
      description: "Bạn có chắc chắn muốn xóa phiếu bảo trì này?",
      confirmText: "Xóa",
      cancelText: "Hủy",
    });

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("maintenance_records")
        .delete()
        .eq("id", record.id);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Đã xóa phiếu bảo trì",
      });
      fetchRecords();
    } catch (err) {
      console.error("Error deleting record:", err);
      toast({
        title: "Lỗi",
        description: "Không thể xóa phiếu bảo trì",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (record: MaintenanceRecord) => {
    setEditingRecord(record);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingRecord(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingRecord(null);
    fetchRecords();
  };

  const columns: Column<MaintenanceRecord>[] = [
    {
      header: "Ngày",
      accessorKey: "service_date",
      cell: (record) => (
        <div className="flex items-center gap-2 text-slate-900">
          <Calendar className="h-4 w-4 text-slate-400" />
          {new Date(record.service_date).toLocaleDateString("vi-VN")}
        </div>
      ),
    },
    {
      header: "Phương tiện",
      cell: (record) => (
        <div className="flex flex-col">
          <div className="font-medium text-slate-900 flex items-center gap-1">
            <Car className="h-4 w-4 text-slate-400" />
            {record.vehicle?.license_plate || "N/A"}
          </div>
          <span className="text-xs text-slate-500">
            {record.vehicle?.vehicle_name}
          </span>
        </div>
      ),
    },
    {
      header: "Loại dịch vụ",
      accessorKey: "service_type",
      cell: (record) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          {record.service_type}
        </span>
      ),
    },
    {
      header: "Chi phí",
      accessorKey: "cost",
      cell: (record) => (
        <span className="font-medium text-slate-900">
          {new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(record.cost)}
        </span>
      ),
    },
    {
      header: "Đơn vị thực hiện",
      accessorKey: "garage_name",
      cell: (record) => (
        <span className="text-slate-600">{record.garage_name || "-"}</span>
      ),
    },
    ...(isAdmin
      ? [
          {
            header: "Thao tác",
            className: "text-right",
            cell: (record: MaintenanceRecord) => (
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(record);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(record);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Bảo trì & Sửa chữa
          </h1>
          <p className="text-slate-500">
            Quản lý lịch sử bảo trì và sửa chữa phương tiện
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleAdd}
            className="btn-primary inline-flex items-center gap-2 shadow-lg shadow-blue-200"
          >
            <Plus className="h-5 w-5" />
            Thêm phiếu bảo trì
          </button>
        )}
      </div>

      {/* Stats Cards (Simple) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-slate-500 text-sm font-medium">
            Tổng chi phí bảo trì
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(records.reduce((acc, curr) => acc + (curr.cost || 0), 0))}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-slate-500 text-sm font-medium">
            Số phiếu trong tháng
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {
              records.filter(
                (r) =>
                  new Date(r.service_date).getMonth() === new Date().getMonth(),
              ).length
            }
          </div>
        </div>
      </div>

      {/* List */}
      <Table
        data={records}
        columns={columns}
        emptyMessage="Chưa có dữ liệu bảo trì"
      />

      {showForm && (
        <MaintenanceFormModal
          record={editingRecord}
          vehicles={vehicles}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};

const MaintenanceFormModal: React.FC<{
  record: MaintenanceRecord | null;
  vehicles: Vehicle[];
  onClose: () => void;
}> = ({ record, vehicles, onClose }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    vehicle_id: record?.vehicle_id || "",
    service_date: record?.service_date
      ? record.service_date.split("T")[0]
      : new Date().toISOString().split("T")[0],
    service_type: record?.service_type || "scheduled",
    cost: record?.cost || 0,
    garage_name: record?.garage_name || "",
    description: record?.description || "",
    mileage_at_service: record?.mileage_at_service || "",
    performed_by: record?.performed_by || "",
    notes: record?.notes || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const dataToSave = {
        ...formData,
        cost: Number(formData.cost),
        mileage_at_service: formData.mileage_at_service
          ? Number(formData.mileage_at_service)
          : null,
        updated_at: new Date().toISOString(),
      };

      if (record) {
        const { error } = await supabase
          .from("maintenance_records")
          .update(dataToSave)
          .eq("id", record.id);
        if (error) throw error;
        toast({
          title: "Thành công",
          description: "Đã cập nhật phiếu bảo trì",
        });
      } else {
        const { error } = await supabase
          .from("maintenance_records")
          .insert(dataToSave);
        if (error) throw error;
        toast({
          title: "Thành công",
          description: "Đã thêm phiếu bảo trì mới",
        });

        // Update vehicle last maintenance date if needed (optional logic)
        // For now, let's keep it simple.
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4">
          <h2 className="text-xl font-bold text-slate-900">
            {record ? "Sửa phiếu bảo trì" : "Thêm phiếu bảo trì"}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Phương tiện <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="input-field"
                value={formData.vehicle_id}
                onChange={(e) =>
                  setFormData({ ...formData, vehicle_id: e.target.value })
                }
              >
                <option value="">Chọn xe</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.license_plate} - {v.vehicle_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Ngày thực hiện <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                className="input-field"
                value={formData.service_date}
                onChange={(e) =>
                  setFormData({ ...formData, service_date: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Loại dịch vụ <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="input-field"
                value={formData.service_type}
                onChange={(e) =>
                  setFormData({ ...formData, service_type: e.target.value })
                }
              >
                <option value="scheduled">Bảo dưỡng định kỳ</option>
                <option value="repair">Sửa chữa</option>
                <option value="inspection">Đăng kiểm / Kiểm tra</option>
                <option value="wash">Rửa xe / Vệ sinh</option>
                <option value="other">Khác</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Chi phí (VND) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                className="input-field"
                value={formData.cost}
                onChange={(e) =>
                  setFormData({ ...formData, cost: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Đơn vị thực hiện
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Garage A, Hãng xe..."
                value={formData.garage_name}
                onChange={(e) =>
                  setFormData({ ...formData, garage_name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Số công tơ mét
              </label>
              <input
                type="number"
                className="input-field"
                placeholder="KM hiện tại"
                value={formData.mileage_at_service}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    mileage_at_service: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Mô tả công việc
            </label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Thay nhớt, lọc gió,..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
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
              {saving ? "Đang lưu..." : "Lưu phiếu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
