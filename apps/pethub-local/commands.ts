import type { CustomerRecord, EmployeeRecord, OrderRecord, PetRecord, UserRecord } from './database';
import {
  createCustomer,
  createEmployee,
  createOrder,
  createPet,
  createUsers,
  createUser,
  deletePet,
  deleteUser,
  initializeDatabase,
  loginUser,
  logoutUser,
  updateOrderStatus,
  updatePet,
  updatePetWithFormData,
  updateUser,
} from './database';

export const initializeLocalApp = async (): Promise<void> => {
  await initializeDatabase();
};

export const createPetCommand = async (pet: Omit<PetRecord, 'createdAt' | 'updatedAt'>): Promise<PetRecord> => {
  return createPet(pet);
};

export const updatePetCommand = async (id: number, pet: Omit<PetRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<PetRecord | undefined> => {
  return updatePet(id, pet);
};

export const updatePetWithFormCommand = async (id: number, form: { name?: string; status?: PetRecord['status'] }): Promise<PetRecord | undefined> => {
  return updatePetWithFormData(id, form);
};

export const deletePetCommand = async (id: number): Promise<boolean> => {
  return deletePet(id);
};

export const createUserCommand = async (user: Omit<UserRecord, 'createdAt'>): Promise<UserRecord> => {
  return createUser(user);
};

export const createUsersCommand = async (users: Array<Omit<UserRecord, 'createdAt'>>): Promise<UserRecord[]> => {
  return createUsers(users);
};

export const createEmployeeCommand = async (employee: Omit<EmployeeRecord, 'createdAt'>): Promise<EmployeeRecord> => {
  return createEmployee(employee);
};

export const createCustomerCommand = async (customer: Omit<CustomerRecord, 'createdAt'>): Promise<CustomerRecord> => {
  return createCustomer(customer);
};

export const updateUserCommand = async (username: string, user: Omit<UserRecord, 'createdAt'>): Promise<UserRecord | undefined> => {
  return updateUser(username, user);
};

export const deleteUserCommand = async (username: string): Promise<boolean> => {
  return deleteUser(username);
};

export const loginUserCommand = async (username: string, password: string) => {
  return loginUser(username, password);
};

export const logoutUserCommand = async (): Promise<void> => {
  return logoutUser();
};

export const createOrderCommand = async (order: Omit<OrderRecord, 'createdAt' | 'updatedAt'>): Promise<OrderRecord> => {
  return createOrder(order);
};

export const updateOrderStatusCommand = async (id: number, status: OrderRecord['status']): Promise<OrderRecord | undefined> => {
  return updateOrderStatus(id, status);
};
