export { TrainingModule } from "./TrainingModule";
export * from "./module.config";
export * from "./storage";
export * from "./types";
export * from "./permissions";
export * from "./services";
export * from "./adapters";
// Repository types re-exported selectively to avoid service/store name collisions
export type { M11TrainingRepository, M11Repositories, M11StoreSnapshot } from "./repository/types";
