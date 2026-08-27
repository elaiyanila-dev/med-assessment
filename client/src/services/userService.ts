import { api } from "./api";

export interface UserSummaryMetrics {
  totalStaff: number;
  activeStaff: number;
  doctorsCount: number;
  nursesCount: number;
  inactiveOrSuspendedCount: number;
}

export interface UserDirectoryItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  department?: string | null;
  specialization?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserDirectoryResponse {
  metrics: UserSummaryMetrics;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  users: UserDirectoryItem[];
}

export interface UserProfileResponse {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  department?: string | null;
  specialization?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  nurseDetails?: any | null;
  operationalMetrics: {
    assignedQueueEntriesCount: number;
    activeConsultationsCount: number;
    activeAdmissionsCount: number;
    labOrdersCount: number;
    scheduledAppointmentsCount: number;
  };
}

export const getUsers = async (params?: {
  search?: string;
  role?: string;
  department?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<UserDirectoryResponse> => {
  const response = await api.get("/users", { params });
  return response.data.data;
};

export const getUserById = async (id: string): Promise<UserProfileResponse> => {
  const response = await api.get(`/users/${id}`);
  return response.data.data;
};

export const createUser = async (payload: {
  name: string;
  email: string;
  phone?: string;
  role: string;
  department?: string;
  specialization?: string;
  password?: string;
}): Promise<UserDirectoryItem> => {
  const response = await api.post("/users", payload);
  return response.data.data;
};

export const updateUser = async (
  id: string,
  payload: {
    name?: string;
    phone?: string;
    department?: string;
    specialization?: string;
  }
): Promise<UserDirectoryItem> => {
  const response = await api.patch(`/users/${id}`, payload);
  return response.data.data;
};

export const updateUserStatus = async (
  id: string,
  status: string
): Promise<UserDirectoryItem> => {
  const response = await api.patch(`/users/${id}/status`, { status });
  return response.data.data;
};

export const resetUserPassword = async (
  id: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> => {
  const response = await api.post(`/users/${id}/reset-password`, { newPassword });
  return response.data.data;
};

export const softDeleteUser = async (
  id: string
): Promise<{ success: boolean; message: string; deletedUserId: string }> => {
  const response = await api.delete(`/users/${id}`);
  return response.data.data;
};
