import type { User } from "../domain/entities/user.js";

export interface UserRepository {
  create: (payload: User) => Promise<User>;
  findById: (id: string) => Promise<User | null>;
  findByEmail: (email: string) => Promise<User | null>;
}
