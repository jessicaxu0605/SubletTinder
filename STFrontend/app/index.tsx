import { useRouter } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function Index() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (user) {
      // redirect to home page if user is logged in
      router.replace("/forms/update-listing?listingId=123");
    } else {
      // redirect to welcome page if user is not logged in
      router.replace("/auth/welcome");
    }
  }, [user, isLoading]);

  return <LoadingSpinner message="Loading..." />;
}
