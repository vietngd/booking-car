import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "../../app/supabase";
import { useAuth } from "../../app/auth-context";
import { RHFInput } from "../../components/common/form/RHFInput";
import { RHFSelect } from "../../components/common/form/RHFSelect";
import { Loader2, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../hooks/use-toast";
import { useNotification } from "../../app/notification-context";

const bookingSchema = z.object({
  requester_name: z.string().min(1, "Vui lòng nhập tên người yêu cầu"),
  requester_department: z.string().min(1, "Vui lòng chọn bộ phận"),
  vehicle_type: z.string().min(1, "Vui lòng chọn loại xe"),
  cargo_type: z.string().min(1, "Vui lòng chọn loại hàng hóa"),
  cargo_weight: z.string().min(1, "Vui lòng chọn trọng lượng"),
  destination: z.string().min(1, "Vui lòng nhập điểm đến"),
  travel_time: z.string().min(1, "Vui lòng chọn thời gian đi"),
  reason: z.string().min(1, "Vui lòng nhập lý do sử dụng"),
});

type BookingFormData = z.infer<typeof bookingSchema>;

const vehicleOptions = [
  { label: "Xe tải nhỏ (500kg - 1 tấn)", value: "Xe tải nhỏ" },
  { label: "Xe tải trung (1.5 - 2.5 tấn)", value: "Xe tải trung" },
  { label: "Xe bán tải", value: "Xe bán tải" },
  { label: "Xe nâng", value: "Xe nâng" },
  { label: "Xe cẩu", value: "Xe cẩu" },
  { label: "Khác", value: "Khác" },
];

const departmentOptions = [
  { label: "Kho (Warehouse)", value: "Kho" },
  { label: "Sản xuất (Production)", value: "Sản xuất" },
  { label: "Kế toán (Accounting)", value: "Kế toán" },
  { label: "Nhân sự (HR)", value: "Nhân sự" },
  { label: "Sales / Marketing", value: "Sales" },
  { label: "Kỹ thuật (Engineering)", value: "Kỹ thuật" },
  { label: "IT", value: "IT" },
  { label: "Bảo vệ (Security)", value: "Bảo vệ" },
  { label: "Khác", value: "Khác" },
];

const cargoTypeOptions = [
  { label: "Nguyên vật liệu", value: "Nguyên vật liệu" },
  { label: "Thành phẩm", value: "Thành phẩm" },
  { label: "Máy móc / Thiết bị", value: "Máy móc / Thiết bị" },
  { label: "Phế liệu", value: "Phế liệu" },
  { label: "Văn phòng phẩm / Đồ dùng", value: "Văn phòng phẩm / Đồ dùng" },
  { label: "Khác", value: "Khác" },
];

const cargoWeightOptions = [
  { label: "Dưới 100kg", value: "Dưới 100kg" },
  { label: "100kg - 500kg", value: "100kg - 500kg" },
  { label: "500kg - 1 tấn", value: "500kg - 1 tấn" },
  { label: "1 tấn - 2 tấn", value: "1 tấn - 2 tấn" },
  { label: "Trên 2 tấn", value: "Trên 2 tấn" },
];

export const BookingForm: React.FC<{ onSuccess?: () => void }> = ({
  onSuccess,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [dynamicVehicleOptions, setDynamicVehicleOptions] =
    useState<{ label: string; value: string }[]>(vehicleOptions);

  useEffect(() => {
    fetchVehicleTypes();
  }, []);

  const fetchVehicleTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .neq("status", "retired");

      if (error) throw error;

      if (data && data.length > 0) {
        setVehicles(data);
        const options = data.map((v) => ({
          label: `${v.vehicle_name} (${v.license_plate})`,
          value: v.id,
        }));

        options.push({ label: "Khác", value: "Khác" });

        setDynamicVehicleOptions(options);
      }
    } catch (err) {
      console.error("Error fetching vehicles:", err);
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      requester_name: "",
      requester_department: "",
      vehicle_type: "",
      cargo_type: "",
      cargo_weight: "",
      destination: "",
      travel_time: "",
      reason: "",
    },
  });

  const onSubmit = async (data: BookingFormData) => {
    if (!user) return;
    setLoading(true);
    setGeneralError(null);

    try {
      // Find selected vehicle info
      const selectedVehicle = vehicles.find((v) => v.id === data.vehicle_type);
      const vehicleTypeId = selectedVehicle ? selectedVehicle.id : null;
      const vehicleTypeName = selectedVehicle
        ? selectedVehicle.vehicle_name
        : "Khác";
      const driverInfo =
        selectedVehicle && selectedVehicle.driver_name
          ? `${selectedVehicle.driver_name}${selectedVehicle.driver_phone ? ` (${selectedVehicle.driver_phone})` : ""}`
          : "";

      const { error } = await supabase.from("bookings").insert({
        created_by: user.id,
        requester_name: data.requester_name,
        requester_department: data.requester_department,
        vehicle_type: vehicleTypeName,
        vehicle_id: vehicleTypeId,
        driver_info: driverInfo,
        cargo_type: data.cargo_type,
        cargo_weight: data.cargo_weight,
        destination: data.destination,
        travel_time: new Date(data.travel_time).toISOString(),
        reason: data.reason,
        status: "pending_viet", // Initial status
        viet_approval_status: "pending", // Explicitly pending
      });

      if (error) throw error;

      reset();

      toast({
        title: "Gửi yêu cầu thành công!",
        description: "Yêu cầu đặt xe của bạn đã được gửi và đang chờ duyệt.",
        duration: 5000,
      });

      addNotification({
        title: "Yêu cầu đặt xe mới",
        message: `Bạn đã tạo yêu cầu đặt xe đi ${data.destination}`,
        type: "success",
        user_id: user.id,
      });

      // Notify Managers
      addNotification({
        title: "Yêu cầu đặt xe mới",
        message: `${data.requester_name} vừa tạo yêu cầu đi ${data.destination}`,
        type: "info",
        target_role: "manager_viet",
      });

      if (onSuccess) {
        onSuccess();
      } else {
        // If used as a standalone page
        navigate("/dashboard");
      }
    } catch (err: any) {
      console.error(err);
      setGeneralError(err.message || "Có lỗi xảy ra khi gửi yêu cầu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-100">
      <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Send className="h-5 w-5 text-blue-600" />
        Tạo yêu cầu đặt xe mới
      </h2>

      {generalError && (
        <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 text-sm">
          {generalError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RHFInput
            name="requester_name"
            label="Người yêu cầu"
            register={register}
            errors={errors}
            placeholder="Họ và tên"
            required
          />
          <RHFSelect
            name="requester_department"
            label="Bộ phận / Phòng ban"
            register={register}
            errors={errors}
            options={departmentOptions}
            placeholder="Chọn bộ phận..."
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RHFSelect
            name="vehicle_type"
            label="Loại xe cần dùng"
            register={register}
            errors={errors}
            options={dynamicVehicleOptions}
            required
          />
          <RHFInput
            name="travel_time"
            label="Thời gian sử dụng"
            type="datetime-local"
            register={register}
            errors={errors}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RHFSelect
            name="cargo_type"
            label="Loại hàng hóa"
            register={register}
            errors={errors}
            options={cargoTypeOptions}
            placeholder="Chọn loại hàng hóa..."
            required
          />
          <RHFSelect
            name="cargo_weight"
            label="Trọng lượng ước tính"
            register={register}
            errors={errors}
            options={cargoWeightOptions}
            placeholder="Chọn trọng lượng..."
            required
          />
        </div>

        <RHFInput
          name="destination"
          label="Địa điểm vận chuyển (trong KCN)"
          register={register}
          errors={errors}
          placeholder="Ví dụ: Xưởng 1 -> Xưởng 3"
          required
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">
            Lý do sử dụng <span className="text-rose-500">*</span>
          </label>
          <textarea
            {...register("reason")}
            rows={3}
            className="block w-full rounded-xl border-0 py-3 pl-4 pr-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all bg-slate-50/50 hover:bg-white focus:bg-white"
            placeholder="Mô tả chi tiết mục đích sử dụng..."
          ></textarea>
          {errors.reason && (
            <p className="mt-1 text-sm text-rose-600 ml-1 font-medium">
              {errors.reason.message}
            </p>
          )}
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary px-8 py-3 w-full sm:w-auto shadow-lg shadow-blue-200"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Đang gửi...
              </div>
            ) : (
              "Gửi yêu cầu phê duyệt"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
