// import { DataRepo, UserData } from "./index";

// export interface RedisConfig {
//   host: string;
// }

// export function makeRedisRepo(config: RedisConfig): DataRepo {
//   async function _loadData(): Promise<UserData> {
//     return {};
//   }
//   async function _saveData(newData: UserData): Promise<UserData> {
//     return _loadData();
//   }

//   return {
//     saveData: _saveData,
//     loadData: _loadData,
//   };
// }
