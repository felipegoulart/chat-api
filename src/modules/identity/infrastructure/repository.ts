import type { Id } from "@/shared/vo/Id.js";
import type { User } from "../entities/user.js";
import type { Email } from "../entities/vo/email.js";

export interface UserRepository {
  create: (payload: User) => Promise<User>;
  findById: (id: Id) => Promise<User | null>;
  findByEmail: (email: Email) => Promise<User | null>;
}
