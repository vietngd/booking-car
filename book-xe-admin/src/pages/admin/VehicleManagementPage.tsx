import React, { useEffect, useState } from "react";
import { useAuth } from "../../app/auth-context";
import { supabase } from "../../app/supabase";
import type { Vehicle, VehicleStatus } from "../../types";
import {
  Car,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Calendar,
  Phone,
  User,
} from "lucide-react";
import { useConfirm } from "../../components/common/ConfirmDialog";
import { useToast } from "@/hooks/use-toast";

export const VehicleManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | "all">(
    "all",
  );
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const { confirm: showConfirm } = useConfirm();
  const { toast } = useToast();

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    filterVehicles();
  }, [vehicles, searchTerm, statusFilter]);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách phương tiện",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterVehicles = () => {
    let filtered = vehicles;

    if (searchTerm) {
      filtered = filtered.filter(
        (v) =>
          v.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.vehicle_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.vehicle_type.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((v) => v.status === statusFilter);
    }

    setFilteredVehicles(filtered);
  };

  const handleDelete = async (vehicle: Vehicle) => {
    const confirmed = await showConfirm({
      title: "Xác nhận xóa",
      description: `Bạn có chắc chắn muốn xóa phương tiện "${vehicle.vehicle_name}" (${vehicle.license_plate})?`,
      confirmText: "Xóa",
      cancelText: "Hủy",
    });

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("vehicles")
        .delete()
        .eq("id", vehicle.id);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Đã xóa phương tiện",
      });
      fetchVehicles();
    } catch (err) {
      console.error("Error deleting vehicle:", err);
      toast({
        title: "Lỗi",
        description: "Không thể xóa phương tiện",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingVehicle(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingVehicle(null);
    fetchVehicles();
  };

  const getStatusBadge = (status: VehicleStatus) => {
    const statusConfig: Record<
      VehicleStatus,
      { label: string; className: string }
    > = {
      available: {
        label: "Sẵn sàng",
        className: "bg-green-50 text-green-700 border-green-200",
      },
      in_use: {
        label: "Đang sử dụng",
        className: "bg-blue-50 text-blue-700 border-blue-200",
      },
      maintenance: {
        label: "Bảo trì",
        className: "bg-yellow-50 text-yellow-700 border-yellow-200",
      },
      retired: {
        label: "Ngưng hoạt động",
        className: "bg-slate-50 text-slate-700 border-slate-200",
      },
    };

    const config = statusConfig[status];
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

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
          <h1 className="text-2xl font-bold text-slate-900">Quản lý xe</h1>
          <p className="text-slate-500">
            Quản lý danh sách phương tiện của công ty
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleAdd}
            className="btn-primary inline-flex items-center gap-2 shadow-lg shadow-blue-200"
          >
            <Plus className="h-5 w-5" />
            Thêm phương tiện
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo biển số, tên xe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as VehicleStatus | "all")
              }
              className="input-field pl-10"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="available">Sẵn sàng</option>
              <option value="in_use">Đang sử dụng</option>
              <option value="maintenance">Bảo trì</option>
              <option value="retired">Ngưng hoạt động</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vehicle List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {filteredVehicles.length === 0 ? (
          <div className="text-center py-12">
            <Car className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">
              {searchTerm || statusFilter !== "all"
                ? "Không tìm thấy phương tiện nào"
                : "Chưa có phương tiện nào"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Biển số
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Tên xe
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Loại xe
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Tài xế
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Bảo trì tiếp theo
                  </th>
                  {isAdmin && (
                    <th className="px-6 py-4 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredVehicles.map((vehicle) => (
                  <tr
                    key={vehicle.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Car className="h-5 w-5 text-slate-400" />
                        <span className="font-medium text-slate-900">
                          {vehicle.license_plate}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-900">
                        {vehicle.vehicle_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600">
                        {vehicle.vehicle_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(vehicle.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {vehicle.driver_name ? (
                        <div className="text-sm">
                          <div className="flex items-center gap-1 text-slate-900">
                            <User className="h-4 w-4 text-slate-400" />
                            {vehicle.driver_name}
                          </div>
                          {vehicle.driver_phone && (
                            <div className="flex items-center gap-1 text-slate-500">
                              <Phone className="h-3 w-3" />
                              {vehicle.driver_phone}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {vehicle.next_maintenance_date ? (
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          {new Date(
                            vehicle.next_maintenance_date,
                          ).toLocaleDateString("vi-VN")}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(vehicle)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(vehicle)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Vehicle Form Modal */}
      {showForm && (
        <VehicleFormModal vehicle={editingVehicle} onClose={handleFormClose} />
      )}
    </div>
  );
};

// Vehicle Form Modal Component
const VehicleFormModal: React.FC<{
  vehicle: Vehicle | null;
  onClose: () => void;
}> = ({ vehicle, onClose }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    license_plate: vehicle?.license_plate || "",
    vehicle_name: vehicle?.vehicle_name || "",
    vehicle_type: vehicle?.vehicle_type || "",
    capacity: vehicle?.capacity || "",
    status: vehicle?.status || ("available" as VehicleStatus),
    driver_name: vehicle?.driver_name || "",
    driver_phone: vehicle?.driver_phone || "",
    last_maintenance_date: vehicle?.last_maintenance_date
      ? vehicle.last_maintenance_date.split("T")[0]
      : "",
    next_maintenance_date: vehicle?.next_maintenance_date
      ? vehicle.next_maintenance_date.split("T")[0]
      : "",
    notes: vehicle?.notes || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const dataToSave = {
        ...formData,
        last_maintenance_date: formData.last_maintenance_date || null,
        next_maintenance_date: formData.next_maintenance_date || null,
        updated_at: new Date().toISOString(),
      };

      if (vehicle) {
        // Update
        const { error } = await supabase
          .from("vehicles")
          .update(dataToSave)
          .eq("id", vehicle.id);

        if (error) throw error;

        toast({
          title: "Thành công",
          description: "Đã cập nhật phương tiện",
        });
      } else {
        // Create
        const { error } = await supabase.from("vehicles").insert(dataToSave);

        if (error) throw error;

        toast({
          title: "Thành công",
          description: "Đã thêm phương tiện mới",
        });
      }

      onClose();
    } catch (err: any) {
      console.error("Error saving vehicle:", err);
      toast({
        title: "Lỗi",
        description: err.message || "Không thể lưu phương tiện",
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
            {vehicle ? "Chỉnh sửa phương tiện" : "Thêm phương tiện mới"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Biển số xe <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.license_plate}
                onChange={(e) =>
                  setFormData({ ...formData, license_plate: e.target.value })
                }
                className="input-field"
                placeholder="VD: 29A-12345"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tên xe <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.vehicle_name}
                onChange={(e) =>
                  setFormData({ ...formData, vehicle_name: e.target.value })
                }
                className="input-field"
                placeholder="VD: Toyota Hilux"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Loại xe <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.vehicle_type}
                onChange={(e) =>
                  setFormData({ ...formData, vehicle_type: e.target.value })
                }
                className="input-field"
              >
                <option value="">Chọn loại xe</option>
                <option value="truck">Xe tải</option>
                <option value="van">Xe van</option>
                <option value="car">Xe con</option>
                <option value="bus">Xe bus</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Sức chứa
              </label>
              <input
                type="text"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({ ...formData, capacity: e.target.value })
                }
                className="input-field"
                placeholder="VD: 2 tấn, 7 chỗ"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Trạng thái <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as VehicleStatus,
                  })
                }
                className="input-field"
              >
                <option value="available">Sẵn sàng</option>
                <option value="in_use">Đang sử dụng</option>
                <option value="maintenance">Bảo trì</option>
                <option value="retired">Ngưng hoạt động</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tên tài xế
              </label>
              <input
                type="text"
                value={formData.driver_name}
                onChange={(e) =>
                  setFormData({ ...formData, driver_name: e.target.value })
                }
                className="input-field"
                placeholder="VD: Nguyễn Văn A"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Số điện thoại tài xế
              </label>
              <input
                type="tel"
                value={formData.driver_phone}
                onChange={(e) =>
                  setFormData({ ...formData, driver_phone: e.target.value })
                }
                className="input-field"
                placeholder="VD: 0901234567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Bảo trì lần cuối
              </label>
              <input
                type="date"
                value={formData.last_maintenance_date}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    last_maintenance_date: e.target.value,
                  })
                }
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Bảo trì tiếp theo
              </label>
              <input
                type="date"
                value={formData.next_maintenance_date}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    next_maintenance_date: e.target.value,
                  })
                }
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Ghi chú
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="input-field"
              rows={3}
              placeholder="Ghi chú thêm về phương tiện..."
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
              {saving ? "Đang lưu..." : vehicle ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
