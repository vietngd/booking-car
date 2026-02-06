import React, { useEffect, useState } from "react";
import { useAuth } from "../../app/auth-context";
import { supabase } from "../../app/supabase";
import type { FuelLog, Vehicle } from "../../types";
import { Plus, Edit2, Trash2, Calendar, Car, Gauge } from "lucide-react";
import { useConfirm } from "../../components/common/ConfirmDialog";
import { useToast } from "@/hooks/use-toast";

import { Table, type Column } from "../../components/common/table/Table";

export const FuelPage: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLog, setEditingLog] = useState<FuelLog | null>(null);
  const { confirm: showConfirm } = useConfirm();
  const { toast } = useToast();

  const isAdmin = user?.role === "admin" || user?.role?.includes("manager");

  useEffect(() => {
    fetchLogs();
    fetchVehicles();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("fuel_logs")
        .select("*, vehicle:vehicles(license_plate, vehicle_name)")
        .order("fill_date", { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (err: any) {
      console.error("Error fetching fuel logs:", err);
      toast({
        title: "Lỗi",
        description: "Không thể tải lịch sử nhiên liệu",
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

  const handleDelete = async (log: FuelLog) => {
    const confirmed = await showConfirm({
      title: "Xác nhận xóa",
      description: "Bạn có chắc chắn muốn xóa phiếu đổ xăng này?",
      confirmText: "Xóa",
      cancelText: "Hủy",
    });

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("fuel_logs")
        .delete()
        .eq("id", log.id);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Đã xóa phiếu đổ xăng",
      });
      fetchLogs();
    } catch (err) {
      console.error("Error deleting log:", err);
      toast({
        title: "Lỗi",
        description: "Không thể xóa phiếu đổ xăng",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (log: FuelLog) => {
    setEditingLog(log);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingLog(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingLog(null);
    fetchLogs();
  };

  const columns: Column<FuelLog>[] = [
    {
      header: "Ngày đổ",
      accessorKey: "fill_date",
      cell: (log) => (
        <div className="flex items-center gap-2 text-slate-900">
          <Calendar className="h-4 w-4 text-slate-400" />
          {new Date(log.fill_date).toLocaleDateString("vi-VN")}
        </div>
      ),
    },
    {
      header: "Phương tiện",
      cell: (log) => (
        <div className="flex flex-col">
          <div className="font-medium text-slate-900 flex items-center gap-1">
            <Car className="h-4 w-4 text-slate-400" />
            {log.vehicle?.license_plate || "N/A"}
          </div>
          <span className="text-xs text-slate-500">
            {log.vehicle?.vehicle_name}
          </span>
        </div>
      ),
    },
    {
      header: "Số lượng (Lít)",
      accessorKey: "liters",
      cell: (log) => (
        <span className="text-slate-900 font-medium">{log.liters} L</span>
      ),
    },
    {
      header: "Thành tiền",
      accessorKey: "cost",
      cell: (log) => (
        <span className="font-medium text-slate-900">
          {new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(log.cost)}
        </span>
      ),
    },
    {
      header: "Odometer (KM)",
      accessorKey: "current_mileage",
      cell: (log) =>
        log.current_mileage ? (
          <div className="flex items-center gap-1 text-slate-600">
            <Gauge className="h-4 w-4 text-slate-400" />
            {log.current_mileage.toLocaleString()}
          </div>
        ) : (
          <span className="text-slate-400">-</span>
        ),
    },
    ...(isAdmin
      ? [
          {
            header: "Thao tác",
            className: "text-right",
            cell: (log: FuelLog) => (
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(log);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(log);
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
            Quản lý Nhiên liệu
          </h1>
          <p className="text-slate-500">
            Theo dõi chi phí và định mức tiêu thụ nhiên liệu
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleAdd}
            className="btn-primary inline-flex items-center gap-2 shadow-lg shadow-blue-200"
          >
            <Plus className="h-5 w-5" />
            Thêm phiếu nhiên liệu
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-slate-500 text-sm font-medium">
            Tổng chi phí nhiên liệu
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(logs.reduce((acc, curr) => acc + (curr.cost || 0), 0))}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-slate-500 text-sm font-medium">
            Tổng số lít đã đổ
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {logs.reduce((acc, curr) => acc + (curr.liters || 0), 0).toFixed(1)}{" "}
            L
          </div>
        </div>
      </div>

      {/* List */}
      <Table
        data={logs}
        columns={columns}
        emptyMessage="Chưa có dữ liệu nhiên liệu"
      />

      {showForm && (
        <FuelFormModal
          log={editingLog}
          vehicles={vehicles}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};

const FuelFormModal: React.FC<{
  log: FuelLog | null;
  vehicles: Vehicle[];
  onClose: () => void;
}> = ({ log, vehicles, onClose }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    vehicle_id: log?.vehicle_id || "",
    fill_date: log?.fill_date
      ? log.fill_date.split("T")[0]
      : new Date().toISOString().split("T")[0],
    liters: log?.liters || 0,
    cost: log?.cost || 0,
    current_mileage: log?.current_mileage || "",
    filled_by: log?.filled_by || "",
    notes: log?.notes || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const dataToSave = {
        ...formData,
        liters: Number(formData.liters),
        cost: Number(formData.cost),
        current_mileage: formData.current_mileage
          ? Number(formData.current_mileage)
          : null,
      };

      if (log) {
        const { error } = await supabase
          .from("fuel_logs")
          .update(dataToSave)
          .eq("id", log.id);
        if (error) throw error;
        toast({
          title: "Thành công",
          description: "Đã cập nhật phiếu nhiên liệu",
        });
      } else {
        const { error } = await supabase.from("fuel_logs").insert({
          ...dataToSave,
          created_at: new Date().toISOString(),
        });
        if (error) throw error;
        toast({
          title: "Thành công",
          description: "Đã thêm phiếu nhiên liệu mới",
        });
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
            {log ? "Sửa phiếu nhiên liệu" : "Thêm phiếu nhiên liệu"}
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
                Ngày đổ <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                className="input-field"
                value={formData.fill_date}
                onChange={(e) =>
                  setFormData({ ...formData, fill_date: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Số lít <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                required
                min="0"
                className="input-field"
                value={formData.liters}
                onChange={(e) =>
                  setFormData({ ...formData, liters: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Thành tiền (VND) <span className="text-red-500">*</span>
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
                Số công tơ mét
              </label>
              <input
                type="number"
                className="input-field"
                placeholder="KM hiện tại"
                value={formData.current_mileage}
                onChange={(e) =>
                  setFormData({ ...formData, current_mileage: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Người đổ
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Tài xế..."
                value={formData.filled_by}
                onChange={(e) =>
                  setFormData({ ...formData, filled_by: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Ghi chú
            </label>
            <textarea
              className="input-field"
              rows={2}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
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
