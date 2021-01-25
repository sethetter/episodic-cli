import * as fs from "fs";
import { promisify } from "util";
import { DataRepo, emptyData, UserData } from "./index";

const fileExists = promisify(fs.exists);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

export function makeFsRepo(configPath: string): DataRepo {
  async function _loadData(): Promise<UserData> {
    if (!(await fileExists(configPath))) {
      await _saveData(emptyData());
    }

    let fileContents = await readFile(configPath);
    let data = JSON.parse(fileContents.toString());

    return data;
  }
  async function _saveData(newData: UserData): Promise<UserData> {
    await writeFile(configPath, JSON.stringify(newData));
    return _loadData();
  }

  return {
    saveData: _saveData,
    loadData: _loadData,
  };
}
