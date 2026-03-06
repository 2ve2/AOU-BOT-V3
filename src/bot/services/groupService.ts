import { promises as fs } from 'fs';
import * as path from 'path';
import type { GroupCreateInput, Group } from '@/types/schemas';

const GROUPS_FILE_PATH = path.join(process.cwd(), 'src/data/groups.json');

interface GroupsData {
  groups: Group[];
}

/**
 * Read Groups from JSON file
 */
async function readGroupsFile(): Promise<GroupsData> {
  try {
    const data = await fs.readFile(GROUPS_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty structure
    return { groups: [] };
  }
}

/**
 * Write Groups to JSON file
 */
async function writeGroupsFile(data: GroupsData): Promise<void> {
  await fs.writeFile(GROUPS_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export const groupService = {
  /**
   * CREATE A NEW GROUP
   */
  async createGroup(data: GroupCreateInput): Promise<Group> {
    const groupsData = await readGroupsFile();
    
    const newGroup: Group = {
      id: Date.now(), // Generate unique ID based on timestamp
      courseCode: data.courseCode,
      main: data.main,
      section: data.section,
    };
    
    groupsData.groups.push(newGroup);
    await writeGroupsFile(groupsData);
    
    return newGroup;
  },

  /**
   * GET ALL GROUPS
   */
  async getAllGroups(): Promise<Group[]> {
    const groupsData = await readGroupsFile();
    return groupsData.groups;
  },

  /**
   * DELETE GROUP BY ID
   */
  async deleteGroup(id: number): Promise<boolean> {
    const groupsData = await readGroupsFile();
    
    const initialLength = groupsData.groups.length;
    groupsData.groups = groupsData.groups.filter(group => group.id !== id);
    
    if (groupsData.groups.length === initialLength) {
      return false; // Group not found
    }
    
    await writeGroupsFile(groupsData);
    return true;
  },

  /**
   * GET GROUP BY ID
   */
  async getGroupById(id: number): Promise<Group | undefined> {
    const groupsData = await readGroupsFile();
    return groupsData.groups.find(group => group.id === id);
  },

  /**
   * GET GROUP BY COURSE CODE
   */
  async getGroupByCourseCode(courseCode: string): Promise<Group | undefined> {
    const groupsData = await readGroupsFile();
    return groupsData.groups.find(group => group.courseCode === courseCode);
  },

  /**
   * GET ALL COURSE CODES
   */
  async getGroupCourseCodes(): Promise<string[]> {
    const groupsData = await readGroupsFile();
    return groupsData.groups.map(group => group.courseCode);
  },

  /**
   * UPDATE GROUP BY ID
   */
  async updateGroup(id: number, data: Partial<GroupCreateInput>): Promise<Group | null> {
    const groupsData = await readGroupsFile();
    const groupIndex = groupsData.groups.findIndex(group => group.id === id);
    
    if (groupIndex === -1) {
      return null; // Group not found
    }
    
    // Update the group
    if (data.courseCode) {
      groupsData.groups[groupIndex]!.courseCode = data.courseCode;
    }
    if (data.main) {
      groupsData.groups[groupIndex]!.main = data.main;
    }
    if (data.section) {
      groupsData.groups[groupIndex]!.section = data.section;
    }
    
    await writeGroupsFile(groupsData);
    return groupsData.groups[groupIndex]!;
  },
};