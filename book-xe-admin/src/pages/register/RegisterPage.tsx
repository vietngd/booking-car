import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/app/supabase";
import { Car, Loader2, Mail } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const registerSchema = z.object({
  fullName: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [emailForDisplay, setEmail] = useState("");

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
          },
        },
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Đăng ký thất bại",
          description: error.message,
        });
      } else {
        toast({
          title: "Thành công",
          description: "Đăng ký thành công. Vui lòng kiểm tra email.",
        });
        setEmail(values.email);
        setSuccess(true);
        if (data.session) {
           navigate("/dashboard");
        }
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Lỗi hệ thống",
        description: err.message || "Vui lòng thử lại sau",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center border border-slate-100">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Kiểm tra email của bạn
          </h2>
          <p className="text-slate-600 mb-8">
            Chúng tôi đã gửi một liên kết xác nhận đến <strong>{emailForDisplay}</strong>.{" "}
            <br />
            Vui lòng kiểm tra hộp thư đến (và cả spam) để kích hoạt tài khoản.
          </p>
          <Link
            to="/login"
            className="text-primary font-semibold hover:underline"
          >
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-center justify-center text-center">
            <div className="bg-primary p-3 rounded-xl mb-4">
                <Car className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Tạo tài khoản mới
            </h1>
            <p className="text-slate-500 mt-2">Đăng ký để bắt đầu đặt xe công tác</p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-100">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Họ và tên</FormLabel>
                      <FormControl>
                        <Input placeholder="Nguyễn Văn A" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email công ty</FormLabel>
                      <FormControl>
                        <Input placeholder="name@company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mật khẩu</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Đang xử lý...
                        </>
                    ) : (
                        "Đăng ký tài khoản"
                    )}
                </Button>
              </form>
            </Form>

             <div className="mt-6 text-center text-sm">
                <span className="text-slate-500">Đã có tài khoản? </span>
                <Link to="/login" className="font-medium text-primary hover:underline">
                  Đăng nhập ngay
                </Link>
             </div>
        </div>
      </div>
    </div>
  );
};
