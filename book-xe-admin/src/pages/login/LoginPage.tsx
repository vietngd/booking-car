import React, { useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { supabase } from "@/app/supabase";
import { useAuth } from "@/app/auth-context";
import { Car, Loader2 } from "lucide-react";
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

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export const LoginPage: React.FC = () => {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  if (user && session) {
    return <Navigate to="/dashboard" replace />;
  }

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Đăng nhập thất bại",
          description: error.message || "Email hoặc mật khẩu không đúng",
        });
      } else {
        toast({
          title: "Thành công",
          description: "Đăng nhập thành công",
        });
        navigate("/dashboard");
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Lỗi hệ thống",
        description: "Vui lòng thử lại sau",
      });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-center justify-center text-center">
            <div className="bg-primary p-3 rounded-xl mb-4">
                <Car className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Chào mừng quay lại
            </h2>
            <p className="text-slate-500 mt-2">Hệ thống đặt xe nội bộ Công ty</p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-100">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Đang đăng nhập...
                        </>
                    ) : (
                        "Đăng nhập"
                    )}
                </Button>
              </form>
            </Form>

             <div className="mt-6 text-center text-sm">
                <span className="text-slate-500">Chưa có tài khoản? </span>
                <Link to="/register" className="font-medium text-primary hover:underline">
                  Đăng ký ngay
                </Link>
             </div>
        </div>
      </div>
    </div>
  );
};
