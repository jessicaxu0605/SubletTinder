import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchRenterProfileId,
  fetchListingIds,
} from "@/lib/api";

interface ActiveRoleContextProps {
  isRenter: boolean;
  resourceId: number;
  renterProfileId: number | null;
  listingIds: number[];
  setIsRenter: (isRenter: boolean) => void;
  setResourceId: (id: number) => void;
}

const ActiveRoleContext = createContext<ActiveRoleContextProps | undefined>(
  undefined
);

export const ActiveRoleProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [isRenter, setIsRenter] = useState<boolean>(false);
  const [renterProfileId, setRenterProfileId] = useState<number | null>(null);
  const [listingIds, setListingIds] = useState<number[]>([]);
  const [resourceId, setResourceIdState] = useState<number>(0);

  useEffect(() => {
    if (!user) return;

    const fetchResources = async () => {
      const [profileId, ids] = await Promise.all([
        fetchRenterProfileId(user.id),
        fetchListingIds(user.id),
      ]);
      setRenterProfileId(profileId);
      setListingIds(ids);

      if (isRenter && profileId !== null) {
        setResourceIdState(profileId);
      } else if (!isRenter && ids.length > 0) {
        setResourceIdState(ids[0]);
      } else {
        setResourceIdState(0);
      }
    };

    fetchResources();
  }, [user, isRenter]);

  const setResourceId = (id: number) => {
    if (isRenter) {
      if (id === renterProfileId && id !== null) {
        setResourceIdState(id);
      } else {
        console.warn(
          `Invalid resourceId ${id} for renter role. Must be renterProfileId.`
        );
      }
    } else {
      if (listingIds.includes(id)) {
        setResourceIdState(id);
      } else {
        console.warn(
          `Invalid resourceId ${id} for landlord role. Must be in listingIds.`
        );
      }
    }
  };

  return (
    <ActiveRoleContext.Provider
      value={{
        isRenter,
        resourceId,
        renterProfileId,
        listingIds,
        setIsRenter,
        setResourceId,
      }}
    >
      {children}
    </ActiveRoleContext.Provider>
  );
};

export function useActiveRole() {
  const context = useContext(ActiveRoleContext);
  if (!context) {
    throw new Error("useActiveRole must be used within an ActiveRoleProvider");
  }
  return context;
}
