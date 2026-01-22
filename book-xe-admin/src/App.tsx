import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./app/auth-context";
import { router } from "./app/router";
import { NotificationProvider } from "./app/notification-context";
import { ConfirmDialogProvider } from "./components/common/ConfirmDialog";
import { Toaster } from "@/components/ui/toaster";
import { useEffect } from "react";
import { requestNotificationPermission, onMessageListener } from "./lib/firebase";
import { useToast } from "@/hooks/use-toast";

function App() {
  const { toast } = useToast();

  useEffect(() => {
    requestNotificationPermission();
    
    onMessageListener((payload) => {
      // console.log("Message received: ", payload);
      toast({
        title: payload?.notification?.title || "Thông báo mới",
        description: payload?.notification?.body,
      });
    });
  }, [toast]);

  return (
    <AuthProvider>
      <NotificationProvider>
        <ConfirmDialogProvider>
          <RouterProvider router={router} />
          <Toaster />
        </ConfirmDialogProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
