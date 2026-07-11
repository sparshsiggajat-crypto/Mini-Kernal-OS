/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  username: string;
  role: string;
}

export type ProcessState = 'New' | 'Ready' | 'Running' | 'Waiting' | 'Terminated';

export interface Process {
  pid: number;
  name: string;
  priority: number;
  arrivalTime: number;
  burstTime: number;
  state: ProcessState;
  memorySize: number;
  remainingTime: number;
  cpuTime: number;
  waitingTime: number;
  turnaroundTime: number;
}

export interface MemoryBlock {
  id: string;
  start: number;
  size: number;
  allocated: boolean;
  processId?: number;
  processName?: string;
  internalFragmentation?: number;
}

export interface PageEntry {
  pageId: number;
  frameId: number;
  processId: number;
  processName: string;
  allocated: boolean;
}

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  parentId: string | null;
  content?: string;
  size: number;
  createdAt: string;
  updatedAt: string;
}

export type LogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  action: string;
  status: string;
  details?: string;
}

export interface SchedulerInput {
  processes: {
    id: string;
    name: string;
    arrivalTime: number;
    burstTime: number;
    priority: number;
  }[];
  algorithm: 'FCFS' | 'SJF' | 'Priority' | 'RoundRobin' | 'MultilevelQueue';
  timeQuantum?: number;
}

export interface GanttChartStep {
  processName: string;
  start: number;
  end: number;
}

export interface SchedulerResults {
  processes: {
    id: string;
    name: string;
    arrivalTime: number;
    burstTime: number;
    priority: number;
    completionTime: number;
    turnaroundTime: number;
    waitingTime: number;
  }[];
  averageWaitingTime: number;
  averageTurnaroundTime: number;
  ganttChart: GanttChartStep[];
}

export interface SystemCallStep {
  title: string;
  description: string;
  state: string;
  activeComponent: 'User App' | 'Shell' | 'Kernel' | 'CPU' | 'RAM' | 'FS';
}
