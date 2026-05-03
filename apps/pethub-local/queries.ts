import {
  findPetsByStatus,
  findPetsByTags,
  getCustomerById,
  getCustomers,
  getEmployeeById,
  getEmployees,
  getAuditLog,
  getAuditLogWithRelations,
  getEvents,
  getInventory,
  getOrderById,
  getOrderByIdWithRelations,
  getOrders,
  getOrdersWithRelations,
  getPetById,
  getPetByIdWithRelations,
  getPets,
  getUserById,
  getUserByUsername,
  getUserByIdWithRelations,
  getUsers,
} from './database';
import { getDownstreamSystemSnapshot } from './downstream-systems';
import { getReadModelSnapshot } from './read-models';

export const getPetsQuery = async () => getPets();

export const getPetByIdQuery = async (id: number) => getPetById(id);

export const getPetRelationsQuery = async (id: number) => getPetByIdWithRelations(id);

export const findPetsByStatusQuery = async (status: 'available' | 'pending' | 'sold') => findPetsByStatus(status);

export const findPetsByTagsQuery = async (tags: string[]) => findPetsByTags(tags);

export const getUsersQuery = async () => getUsers();

export const getEmployeesQuery = async () => getEmployees();

export const getEmployeeByIdQuery = async (id: number) => getEmployeeById(id);

export const getCustomersQuery = async () => getCustomers();

export const getCustomerByIdQuery = async (id: number) => getCustomerById(id);

export const getUserByIdQuery = async (id: number) => getUserById(id);

export const getUserByUsernameQuery = async (username: string) => getUserByUsername(username);

export const getUserRelationsQuery = async (id: number) => getUserByIdWithRelations(id);

export const getOrdersQuery = async () => getOrders();

/**
 * Returns the next safe `orders.id`. Used by the storefront checkout route so
 * order ids are deterministic and collision-free instead of `Date.now()`,
 * which can collide on rapid sequential checkouts within the same millisecond.
 */
export const nextOrderIdQuery = async (): Promise<number> => {
  const orders = await getOrders();
  return orders.reduce((max, order) => Math.max(max, order.id), 0) + 1;
};

export const getInventoryQuery = async () => getInventory();

export const getOrdersWithRelationsQuery = async () => getOrdersWithRelations();

export const getOrderByIdQuery = async (id: number) => getOrderById(id);

export const getOrderRelationsQuery = async (id: number) => getOrderByIdWithRelations(id);

export const getAuditLogQuery = async () => getAuditLog();

export const getAuditLogRelationsQuery = async () => getAuditLogWithRelations();

export const getEventsQuery = async () => getEvents();

export const getReadModelsQuery = async () => getReadModelSnapshot();

export const getDownstreamSystemsQuery = async () => getDownstreamSystemSnapshot();
